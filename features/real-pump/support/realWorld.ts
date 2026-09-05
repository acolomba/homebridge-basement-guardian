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

import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { After, Before, setWorldConstructor, World } from '@cucumber/cucumber';
import { connect } from 'mqtt';

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

/** A `Logging` that writes to the operator's terminal. The redacting logger wraps this, never a bare one. */
function terminalLogging(): Logging {
  const info = (message: string): void => {
    stdoutLine('info', message);
  };

  return Object.assign(info, {
    prefix: 'basement guardian (real-pump)',
    debug: (message: string): void => {
      stdoutLine('debug', message);
    },
    error: (message: string): void => {
      stdoutLine('error', message);
    },
    info,
    success: (message: string): void => {
      stdoutLine('success', message);
    },
    warn: (message: string): void => {
      stdoutLine('warn', message);
    },
    log: (level: LogLevel, message: string): void => {
      stdoutLine(level, message);
    },
  });
}

/** The scenario state for one real-pump run, observation-only. */
export class RealPumpWorld extends World {
  private readonly discoveredDeviceIds: string[] = [];

  private readonly monitoringObservations: string[] = [];

  private redactingLog: RedactingLogger | undefined = undefined;

  private accountRuntime: AccountRuntime | undefined = undefined;

  private scratchDirectory: string | undefined = undefined;

  constructor(readonly options: IWorldOptions) {
    super(options);
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

  /** Starts the account runtime this world built in its `Before` hook. */
  async start(): Promise<void> {
    await this.runtime().start();
  }

  /** Stops the running account runtime. */
  async stop(): Promise<void> {
    await this.runtime().stop();
  }

  /**
   * Builds the account runtime against the real vendor cloud, from operator-supplied credentials.
   *
   * Building the runtime opens no connection and starts no timer; only `start()` does. Called from
   * the `Before` hook below, kept as an instance method (rather than inline in the hook) so a
   * `catch` block anywhere in this file never needs to spell out this world's own construction.
   */
  async initialize(): Promise<void> {
    const email = requireEnv('BG_EMAIL');
    const password = requireEnv('BG_PASSWORD');

    this.scratchDirectory = await mkdtemp(SCRATCH_DIRECTORY_PREFIX);

    const log = this.logger();

    log.registerSecret(password);

    this.accountRuntime = createAccountRuntimeFromConfig({
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
      storagePath: this.scratchDirectory,
      clock: systemClock,
      monotonic: systemMonotonicClock,
      log,
      connect,
      createSalt: () => randomBytes(SALT_BYTES).toString('hex'),
      onTrustworthyInventory: (deviceIds: readonly string[]): void => {
        for (const deviceId of deviceIds) {
          if (!this.discoveredDeviceIds.includes(deviceId)) {
            this.discoveredDeviceIds.push(deviceId);
          }
        }
      },
      onDeviceRemoved: (deviceId: string): void => {
        const index = this.discoveredDeviceIds.indexOf(deviceId);

        if (index !== -1) {
          this.discoveredDeviceIds.splice(index, 1);
        }
      },
      onMonitoringHealth: (account: MonitoringTrust, byDevice: ReadonlyMap<string, MonitoringTrust>): void => {
        const transportReady = String(account.commandTransportReady);
        const credentialsRejected = String(account.credentialsRejected);
        const deviceCount = String(byDevice.size);

        this.monitoringObservations.push(`account transportReady=${transportReady} credentialsRejected=${credentialsRejected} devices=${deviceCount}`);
      },
    });
  }

  /** Stops the runtime this world built and removes its scratch directory. Runs from the `After` hook. */
  async cleanUp(): Promise<void> {
    await this.accountRuntime?.stop();

    if (this.scratchDirectory !== undefined) {
      await rm(this.scratchDirectory, { recursive: true, force: true });
    }
  }

  private logger(): RedactingLogger {
    this.redactingLog ??= createRedactingLogger({ delegate: terminalLogging(), secrets: [] });

    return this.redactingLog;
  }

  private runtime(): AccountRuntime {
    if (this.accountRuntime === undefined) {
      throw new Error('the real-pump world has not finished initializing yet');
    }

    return this.accountRuntime;
  }
}

setWorldConstructor(RealPumpWorld);

Before(async function (this: RealPumpWorld) {
  await this.initialize();
});

After(async function (this: RealPumpWorld) {
  await this.cleanUp();
});
