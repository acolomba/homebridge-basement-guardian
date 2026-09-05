/**
 * @fileoverview The per-scenario world for the opt-in real-pump suite.
 *
 * This world is deliberately narrower than features/support/world.ts: it builds only the
 * plugin's own account runtime, through the same createAccountRuntimeFromConfig seam production
 * uses, and never a BasementGuardianPlatform, a DiscoveryContext, or a BasementGuardianAccessory.
 * With no HomeKit accessory layer built, there is no write handler anywhere in this suite that
 * could ever reach the runtime's command-issuing surface in the first place --
 * test/realPumpCommandBlock.test.ts proves that mechanically by scanning this file's own text
 * (T-06-15, D-04).
 *
 * Every collaborator the runtime needs is the real one: the bundled protocol constants, the real
 * system clock and monotonic clock, the real `mqtt` connect function. Only the account
 * credentials are supplied by the operator, through BG_EMAIL and BG_PASSWORD, and both are
 * registered with the redacting logger before the runtime can ever use them (T-06-17, AUTH-02).
 *
 * This world never imports features/support/world.ts. That module calls setWorldConstructor(),
 * and Before/After -- importing it here would register a second, competing World and a second
 * scenario-teardown hook into this profile's own support-code graph.
 */

import { createHash, randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { After, Before, setWorldConstructor, World } from '@cucumber/cucumber';
import { connect } from 'mqtt';

import { TOKEN_CACHE_FILENAME } from '../../../src/cloud/auth.js';
import { createFamilyRegistry } from '../../../src/device/registry.js';
import { createRedactingLogger } from '../../../src/logging.js';
import { PROTOCOL } from '../../../src/protocol.js';
import { createAccountRuntimeFromConfig } from '../../../src/runtime/accountRuntime.js';
import { systemClock } from '../../../src/runtime/clock.js';
import { systemMonotonicClock } from '../../../src/runtime/monotonicClock.js';

import type { DeviceSnapshot } from '../../../src/device/state.js';
import type { RedactingLogger } from '../../../src/logging.js';
import type { AccountRuntime } from '../../../src/runtime/accountRuntime.js';
import type { MonitoringTrust } from '../../../src/runtime/monitoringHealth.js';
import type { IWorldOptions } from '@cucumber/cucumber';
import type { LogLevel, Logging } from 'homebridge';

/** Where every scenario's scratch storage directory is created. Removed again in the After hook. */
const SCRATCH_DIRECTORY_PREFIX = join(tmpdir(), 'basement-guardian-real-pump-');

/** How much randomness the per-run salt carries, matching the production composition root. */
const SALT_BYTES = 16;

/**
 * How often the runtime polls the vendor REST inventory, in seconds.
 *
 * The lowest value CONF-05 permits, because this suite is short-lived: a scenario waits at most a
 * couple of minutes, so a long production-scale poll interval would leave most scenarios with no
 * second poll to observe at all.
 */
const POLL_INTERVAL_SECONDS = 300;

/** How many consecutive healthy but empty inventories confirm a device absent (D-029). */
const OFFLINE_CONFIRMATION_POLL_COUNT = 2;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim().length === 0) {
    throw new Error(`the real-pump suite needs ${name} set in the environment`);
  }

  return value;
}

// A plain stdout writer rather than console.*, so this file carries no lint exemption of its own.
// The operator's terminal is this suite's only observability; nothing here is ever asserted on.
function stdoutLine(level: string, message: string): void {
  process.stdout.write(`${level} ${message}\n`);
}

/**
 * A `Logging` that writes to the operator's terminal and records each line, level-prefixed.
 *
 * The recording is what lets a scenario tell a quiet-but-healthy run apart from one that logged a
 * real failure: every warning or error this suite's own runtime reports lands in the record, so a
 * step can assert the record stayed empty rather than infer health from silence alone (T-06-20).
 */
function terminalLogging(record: (line: string) => void): Logging {
  function write(level: string, message: string): void {
    record(`${level} ${message}`);
    stdoutLine(level, message);
  }

  const info = (message: string): void => {
    write('info', message);
  };

  return Object.assign(info, {
    prefix: 'basement guardian (real-pump)',
    debug: (message: string): void => {
      write('debug', message);
    },
    error: (message: string): void => {
      write('error', message);
    },
    info,
    success: (message: string): void => {
      write('success', message);
    },
    warn: (message: string): void => {
      write('warn', message);
    },
    log: (level: LogLevel, message: string): void => {
      write(level, message);
    },
  });
}

/** The scenario state for one real-pump run, observation-only. */
export class RealPumpWorld extends World {
  private readonly discoveredDeviceIds: string[] = [];

  private readonly monitoringObservations: string[] = [];

  private readonly loggedLines: string[] = [];

  private readonly deviceChangeLog: string[] = [];

  private readonly watchedDeviceIds = new Set<string>();

  private readonly remembered = new Map<string, unknown>();

  private readonly rejectedReasons: string[] = [];

  // A stable bound reference, because the listener has to be removed again in cleanUp(). Recording
  // is what lets the shutdown scenario assert the absence of a rejection rather than hope the
  // process would have crashed on one (SYNC-05).
  private readonly recordRejection = (reason: unknown): void => {
    this.rejectedReasons.push(String(reason));
  };

  private redactingLog: RedactingLogger | undefined = undefined;

  private accountRuntime: AccountRuntime | undefined = undefined;

  private scratchDirectory: string | undefined = undefined;

  private credentialEmail: string | undefined = undefined;

  private credentialPassword: string | undefined = undefined;

  constructor(readonly options: IWorldOptions) {
    super(options);
    process.on('unhandledRejection', this.recordRejection);
  }

  /** Every deviceId a trustworthy inventory response has named so far, in discovery order. */
  deviceIds(): readonly string[] {
    return this.discoveredDeviceIds;
  }

  /** The canonical snapshot the runtime holds for one device, or `undefined` if it holds none. */
  snapshot(deviceId: string): DeviceSnapshot | undefined {
    return this.runtime().store.snapshot(deviceId);
  }

  /** Every monitoring-health summary the runtime has reported so far, in report order. */
  observations(): readonly string[] {
    return this.monitoringObservations;
  }

  /** Every log line recorded at warn or error level, level-prefixed, in arrival order. */
  failureLines(): readonly string[] {
    return this.loggedLines.filter((line) => line.startsWith('warn ') || line.startsWith('error '));
  }

  /** Every unhandled rejection the process reported while this scenario ran. */
  unhandledRejections(): readonly string[] {
    return this.rejectedReasons;
  }

  /** One entry per store change the discovered device reported, naming the keys that moved. */
  deviceChanges(): readonly string[] {
    return this.deviceChangeLog;
  }

  /** Remembers a value a step read, under a name a later step names it by. */
  remember(name: string, value: unknown): void {
    this.remembered.set(name, value);
  }

  /** The value a step remembered earlier in the scenario. */
  recall(name: string): unknown {
    if (!this.remembered.has(name)) {
      throw new Error(`no step has remembered ${name} yet`);
    }

    return this.remembered.get(name);
  }

  /**
   * A content fingerprint of the cached Auth0 token file, or `undefined` while it does not exist
   * yet.
   *
   * A fresh grant rewrites the file, and rewrites this fingerprint with it. A restart that reuses
   * the cached token leaves both untouched (AUTH-01).
   */
  async tokenCacheFingerprint(): Promise<string | undefined> {
    const path = join(this.scratchDirectoryPath(), TOKEN_CACHE_FILENAME);

    try {
      const contents = await readFile(path, 'utf8');

      return createHash('sha256').update(contents).digest('hex');
    } catch {
      // Not yet written is not a failure here; a step definition's own bounded wait decides when
      // the absence has gone on too long.
      return undefined;
    }
  }

  /** Starts the account runtime this world built in its `Before` hook. */
  async start(): Promise<void> {
    await this.runtime().start();
  }

  /** Stops the running account runtime. */
  async stop(): Promise<void> {
    await this.runtime().stop();
  }

  /**
   * Stops the running account runtime and starts a fresh one over the same scratch storage
   * directory, as a Homebridge restart does.
   */
  async restart(): Promise<void> {
    await this.stop();
    this.accountRuntime = this.createRuntime();
    await this.start();
  }

  /**
   * Builds the account runtime against the real vendor cloud, from operator-supplied credentials.
   *
   * Building the runtime opens no connection and starts no timer; only `start()` does. Called from
   * the `Before` hook below, kept as an instance method (rather than inline in the hook) so a
   * `catch` block anywhere in this file never needs to spell out this world's own construction.
   */
  async initialize(): Promise<void> {
    this.credentialEmail = requireEnv('BG_EMAIL');
    this.credentialPassword = requireEnv('BG_PASSWORD');

    this.scratchDirectory = await mkdtemp(SCRATCH_DIRECTORY_PREFIX);

    this.logger().registerSecret(this.credentialPassword);

    this.accountRuntime = this.createRuntime();
  }

  /** Stops the runtime this world built and removes its scratch directory. Runs from the `After` hook. */
  async cleanUp(): Promise<void> {
    process.off('unhandledRejection', this.recordRejection);
    await this.accountRuntime?.stop();

    if (this.scratchDirectory !== undefined) {
      await rm(this.scratchDirectory, { recursive: true, force: true });
    }
  }

  private logger(): RedactingLogger {
    this.redactingLog ??= createRedactingLogger({ delegate: terminalLogging((line) => this.loggedLines.push(line)), secrets: [] });

    return this.redactingLog;
  }

  private runtime(): AccountRuntime {
    if (this.accountRuntime === undefined) {
      throw new Error('the real-pump world has not finished initializing yet');
    }

    return this.accountRuntime;
  }

  private scratchDirectoryPath(): string {
    if (this.scratchDirectory === undefined) {
      throw new Error('the real-pump world has not finished initializing yet');
    }

    return this.scratchDirectory;
  }

  /**
   * Builds a fresh account runtime against the real vendor cloud, over this world's scratch storage
   * directory.
   *
   * Called from `initialize()` on the first start and from `restart()` on every one after, so a
   * restart reuses the very token cache the first runtime wrote under this directory (AUTH-01).
   */
  private createRuntime(): AccountRuntime {
    this.watchedDeviceIds.clear();

    const email = this.credentialEmail;
    const password = this.credentialPassword;

    if (email === undefined || password === undefined) {
      throw new Error('the real-pump world has not finished initializing yet');
    }

    return createAccountRuntimeFromConfig({
      config: {
        name: 'Basement Guardian (real-pump suite)',
        email,
        password,
        clientId: PROTOCOL.clientId,
        pollIntervalSeconds: POLL_INTERVAL_SECONDS,
        offlineConfirmationPollCount: OFFLINE_CONFIRMATION_POLL_COUNT,
        ignoredFaults: [],
      },
      constants: PROTOCOL,
      registry: createFamilyRegistry(),
      storagePath: this.scratchDirectoryPath(),
      clock: systemClock,
      monotonic: systemMonotonicClock,
      log: this.logger(),
      connect,
      createSalt: () => randomBytes(SALT_BYTES).toString('hex'),
      onTrustworthyInventory: (deviceIds: readonly string[]): void => {
        for (const deviceId of deviceIds) {
          if (!this.discoveredDeviceIds.includes(deviceId)) {
            this.discoveredDeviceIds.push(deviceId);
          }

          if (!this.watchedDeviceIds.has(deviceId)) {
            this.watchedDeviceIds.add(deviceId);
            this.watchForChanges(deviceId);
          }
        }
      },
      onDeviceRemoved: (deviceId: string): void => {
        const index = this.discoveredDeviceIds.indexOf(deviceId);

        if (index !== -1) {
          this.discoveredDeviceIds.splice(index, 1);
        }

        this.watchedDeviceIds.delete(deviceId);
      },
      onMonitoringHealth: (account: MonitoringTrust, byDevice: ReadonlyMap<string, MonitoringTrust>): void => {
        const transportReady = String(account.commandTransportReady);
        const credentialsRejected = String(account.credentialsRejected);
        const deviceCount = String(byDevice.size);

        this.monitoringObservations.push(`account transportReady=${transportReady} credentialsRejected=${credentialsRejected} devices=${deviceCount}`);
      },
    });
  }

  // Recorded per device so a scenario can tell a natural update happened without forcing one
  // (REL-09, D-04). Re-subscribed against every fresh runtime createRuntime() builds, since a
  // restart's new store starts with no listeners of its own.
  private watchForChanges(deviceId: string): void {
    this.runtime().store.subscribe(deviceId, (_next, _previous, changedKeys) => {
      this.deviceChangeLog.push(`${deviceId} ${changedKeys.join(' ')}`);
    });
  }
}

setWorldConstructor(RealPumpWorld);

Before(async function (this: RealPumpWorld) {
  await this.initialize();
});

After(async function (this: RealPumpWorld) {
  await this.cleanUp();
});
