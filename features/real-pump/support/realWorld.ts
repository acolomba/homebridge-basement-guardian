// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Builds observation-only real-pump scenarios with the account runtime.
 *
 * Registers its own World and hooks independently of the default scenario world.
 */

import { createHash, randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { After, Before, setWorldConstructor, World } from '@cucumber/cucumber';
import { connect } from 'mqtt';

import { httpFetch } from '../../../src/cloud/httpDispatcher.js';
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
import type { LogLevel, Logging } from 'homebridge';

/** Where every scenario's scratch storage directory is created. Removed again in the After hook. */
const SCRATCH_DIRECTORY_PREFIX = join(tmpdir(), 'basement-guardian-real-pump-');

/** How much randomness the per-run salt carries, matching the production composition root. */
const SALT_BYTES = 16;

/**
 * How often the runtime polls the vendor REST inventory, in seconds.
 *
 * The lowest value CONF-05 permits. Discovery observes the startup inventory; shorter scenarios
 * do not require a second poll. The 960-second heartbeat scenario spans later five-minute polls.
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

  function info(message: string): void {
    write('info', message);
  }

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

/**
 * Provides observation-only state to one real-profile scenario's steps.
 * Cucumber creates each instance; the live Before hook initializes it and After releases it.
 */
export class RealPumpWorld extends World {
  private readonly discoveredDeviceIds: string[] = [];

  private readonly monitoringObservations: string[] = [];

  private readonly loggedLines: string[] = [];

  private readonly remembered = new Map<string, unknown>();

  private readonly rejectedReasons: string[] = [];

  // A stable bound reference, because the listener has to be removed again in cleanUp(). Recording
  // is what lets the shutdown scenario assert the absence of a rejection rather than hope the
  // process would have crashed on one (SYNC-05).
  private readonly recordRejection = (): void => {
    this.rejectedReasons.push('unhandled rejection');
  };

  private redactingLog: RedactingLogger | undefined = undefined;

  private accountRuntime: AccountRuntime | undefined = undefined;

  private scratchDirectory: string | undefined = undefined;

  private credentialEmail: string | undefined = undefined;

  private credentialPassword: string | undefined = undefined;

  /** Returns device IDs named by trustworthy inventory responses, in discovery order. */
  deviceIds(): readonly string[] {
    return this.discoveredDeviceIds;
  }

  /** Returns the canonical snapshot for one device, or `undefined` if none is held. */
  snapshot(deviceId: string): DeviceSnapshot | undefined {
    return this.runtime().store.snapshot(deviceId);
  }

  /** Returns monitoring-health summaries in report order. */
  observations(): readonly string[] {
    return this.monitoringObservations;
  }

  /** Returns warn and error log lines, level-prefixed and in arrival order. */
  failureLines(): readonly string[] {
    return this.loggedLines.filter((line) => line.startsWith('warn ') || line.startsWith('error '));
  }

  /** Returns one non-sensitive marker per unhandled rejection observed during this scenario. */
  unhandledRejections(): readonly string[] {
    return this.rejectedReasons;
  }

  /** Remembers a value a step read, under a name a later step names it by. */
  remember(name: string, value: unknown): void {
    this.remembered.set(name, value);
  }

  /** Returns a value remembered by an earlier step in the scenario. */
  recall(name: string): unknown {
    if (!this.remembered.has(name)) {
      throw new Error(`no step has remembered ${name} yet`);
    }

    return this.remembered.get(name);
  }

  /**
   * Returns a content fingerprint of the cached Auth0 token file, or `undefined` while it does
   * not exist yet.
   *
   * A fresh grant rewrites the file, and rewrites this fingerprint with it. A restart that reuses
   * the cached token leaves both untouched (AUTH-01).
   */
  async tokenCacheFingerprint(): Promise<string | undefined> {
    const path = join(this.scratchDirectoryPath(), '.basement-guardian-token.json');

    try {
      const contents = await readFile(path, 'utf8');

      return createHash('sha256').update(contents).digest('hex');
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        // A step definition's bounded wait decides when an absent cache has gone on too long.
        return undefined;
      }

      throw error;
    }
  }

  /** Starts the world's current account runtime. */
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
    this.discoveredDeviceIds.length = 0;
    this.accountRuntime = this.createRuntime();
    await this.start();
  }

  /**
   * Builds the account runtime against the real vendor cloud, from operator-supplied credentials.
   *
   * Building the runtime opens no connection and starts no timer; only `start()` does. The live
   * `Before` hook calls this method once per scenario.
   */
  async initialize(): Promise<void> {
    this.credentialEmail = requireEnv('BG_EMAIL');
    this.credentialPassword = requireEnv('BG_PASSWORD');

    this.scratchDirectory = await mkdtemp(SCRATCH_DIRECTORY_PREFIX);

    this.logger().registerSecret(this.credentialEmail);
    this.logger().registerSecret(this.credentialPassword);

    process.on('unhandledRejection', this.recordRejection);
    this.accountRuntime = this.createRuntime();
  }

  /** Stops the runtime this world built and removes its scratch directory. Runs from the `After` hook. */
  async cleanUp(): Promise<void> {
    const failures: Error[] = [];

    try {
      await this.accountRuntime?.stop();
    } catch (error: unknown) {
      failures.push(new Error('real-pump runtime stop failed'));
    }

    if (this.scratchDirectory !== undefined) {
      try {
        await rm(this.scratchDirectory, { recursive: true, force: true });
      } catch (error: unknown) {
        failures.push(new Error('real-pump scratch directory removal failed'));
      }
    }

    process.off('unhandledRejection', this.recordRejection);

    if (this.rejectedReasons.length > 0) {
      failures.push(new Error('real-pump scenario observed an unhandled rejection'));
    }

    if (failures.length > 0) {
      throw new AggregateError(failures, 'real-pump scenario release failed');
    }
  }

  private logger(): RedactingLogger {
    this.redactingLog ??= createRedactingLogger({
      delegate: terminalLogging((line) => {
        this.loggedLines.push(line);
      }),
      secrets: [],
    });

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
   * Called from `initialize()` in the `Before` hook and from `restart()` after shutdown, so a
   * restart reuses the very token cache the first runtime wrote under this directory (AUTH-01).
   */
  private createRuntime(): AccountRuntime {
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
      httpFetch,
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
}

setWorldConstructor(RealPumpWorld);

Before(async function (this: RealPumpWorld) {
  await this.initialize();
});

After(async function (this: RealPumpWorld) {
  await this.cleanUp();
});
