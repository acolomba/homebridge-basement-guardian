// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Verifies account monitoring, lifecycle ownership and commands.
 */

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import timers, { setImmediate as nextEventLoopTurn } from 'node:timers/promises';

import { mock, verify, when } from 'strong-mock';

import { createCloudApi } from '../../src/cloud/api.js';
import { createAuthClient } from '../../src/cloud/auth.js';
import { AuthHaltedError, AuthRejectedError, AuthThrottledError, CloudRequestError } from '../../src/cloud/errors.js';
import { createFamilyRegistry } from '../../src/device/registry.js';
import { createDeviceStateStore } from '../../src/device/state.js';
import { PROVISIONAL_FLOOD_WATER_LEVEL_CODE } from '../../src/device/waterLevel.js';
import { createRedactingLogger } from '../../src/logging.js';
import { createAccountRuntime, createAccountRuntimeFromConfig, MIN_ROTATION_DELAY_MS, ROTATION_LEAD_MS } from '../../src/runtime/accountRuntime.js';
import { createArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';
import { createFailureLog, FAILURE_REMINDER_MS } from '../../src/runtime/failureLog.js';
import { createRetryPolicy, MAX_BACKOFF_MS } from '../../src/runtime/retryPolicy.js';

import { ACCOUNT_SHADOW_CASES, ACCOUNT_SHADOW_PARTICIPANTS, assertAccountShadowContract, exerciseAccountShadowContract } from './accountShadowContract.js';
import {
  ARRIVAL_ANCHOR_MEMORY_CASES,
  ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS,
  ARRIVAL_ANCHOR_PERSISTENCE_CASES,
  ARRIVAL_ANCHOR_PERSISTENCE_PARTICIPANTS,
  assertArrivalAnchorMemoryContract,
  assertArrivalAnchorPersistenceContract,
  exerciseArrivalAnchorMemoryContract,
  exerciseArrivalAnchorPersistenceContract,
} from './arrivalAnchorMemoryContract.js';

import type { CloudApi } from '../../src/cloud/api.js';
import type { MqttConnect } from '../../src/cloud/mqttTransport.js';
import type { ShadowClient } from '../../src/cloud/shadow.js';
import type { ApiDevice, AwsCredentialsResponse, CommandResult, DeviceCommand } from '../../src/cloud/types.js';
import type { BgConfig } from '../../src/config.js';
import type { DeviceSnapshot, DeviceStateStore, ReportedPatch } from '../../src/device/state.js';
import type { SecretRole } from '../../src/logging.js';
import type { ProtocolConstants } from '../../src/protocol.js';
import type { AccountRuntime, ShadowRuntimeOptions } from '../../src/runtime/accountRuntime.js';
import type { ArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { MonitoringTrust } from '../../src/runtime/monitoringHealth.js';
import type { MonotonicClock } from '../../src/runtime/monotonicClock.js';
import type { LogLevel, Logging } from 'homebridge';
import type { TestContext } from 'node:test';

const DEVICE_ID = 'account-1_serial-1';
const OTHER_DEVICE_ID = 'account-1_serial-2';
const START_TIME = Date.parse('2026-08-28T12:00:00.000Z');
// The forward-only base, started somewhere deliberately unlike the wall clock
// so a case that handed one port the other's reading fails loudly instead of
// agreeing by coincidence.
const MONOTONIC_START_TIME = 4_000_000;
const ONE_HOUR_MS = 3_600_000;
const POLL_INTERVAL_MS = 900_000;

// A poll interval far below the shadow-silence window, so a case about the REST
// failure run drives several polls without the silence window opening under it.
const FAST_POLL_INTERVAL_MS = 1_000;

// One device heartbeat, and the run of silence two of them make. Written as the
// measured figures rather than imported, so a projection that halved the window
// does not agree with an expectation built the same wrong way.
const HEARTBEAT_MS = 898_000;

// The run of silence two missed heartbeats make.
const TWO_MISSED_HEARTBEATS_MS = 1_796_000;
const THROTTLE_RETRY_MS = 1_800_000;

// The one actionable line a degraded monitoring path produces, restated here so
// the case fails if the wording drifts.
const DEGRADED_LINE = 'The shadow connection is unavailable, so device state is coming from polling alone until it returns.';

// The line a failed credential refresh records, restated here for the same
// reason.
const ROTATION_FAILED_LINE = 'The temporary shadow credentials could not be refreshed; the plugin will try again.';

// The line a failing inventory poll records for the status the removal cases
// script, restated here for the same reason.
const DISCOVERY_FAILED_LINE = 'Device discovery failed on GET /devices with HTTP 503.';

// The line a poll failure carrying no status records. A terminal authentication answer must never
// reach it: it names a cause that did not happen, and an owner acts on a diagnostic (D-03).
const DISCOVERY_FAILED_UNEXPLAINED_LINE = 'Device discovery failed.';

// The line one system's live connection records when it has stopped delivering,
// restated here for the same reason. It names the controller, because the
// failing activity is that controller's live reporting and not the account's.
//
// Taken per device rather than as one constant, so a two-pump case can say which
// pump the plugin stopped watching and assert the other pump's line is absent.
function liveReportingSilentLine(deviceId: string): string {
  return (
    `No device message has arrived on the live connection from ${deviceId} for two heartbeat intervals, ` +
    'so HomeKit is marking what it shows untrustworthy until one does.'
  );
}

// The line the same condition records when it clears. The failure log builds it
// from the kind, so the kind's device travels into it.
function liveReportingRecoveredLine(deviceId: string): string {
  return `Live device reporting for ${deviceId} recovered.`;
}

// The line a removal Homebridge refused records, restated here for the same
// reason. It names the controller, because the failing activity is that
// controller's removal and not the account's, and a two-pump case has to say
// which accessory is stranded.
function removalRefusedLine(deviceId: string): string {
  return `Could not remove ${deviceId} from HomeKit; it stays published and stays watched.`;
}

// Every recovery the failure log announced, whole lines and in order. A count
// alone cannot tell "the right pump recovered" from "a pump recovered", which is
// the whole question on a two-pump account (D-14).
function recoveriesIn(logged: readonly string[]): string[] {
  return logged.filter((line) => line.startsWith('info ') && line.endsWith(' recovered.'));
}

// What the account struct's silence member always carries. There is no
// account-wide answer to a per-device question, so the struct the runtime pushes
// beside the map declines to vouch and every real per-device answer overrides
// it. Naming it is what keeps a case below from reading as though it measured a
// silence when it only read a constant; the cases that are about silence read
// `monitoringByDevice` instead (D-02, D-04).
const ACCOUNT_DECLINES_TO_VOUCH = true;

// The line a terminal authentication answer records, restated here for the same
// reason.
const STOPPED_LINE = 'Monitoring has stopped because the vendor refused the account credentials. Correct the account in Homebridge to start the plugin again.';

// The rotation the fixture expiry produces: an hour of credential life, less
// the ten-minute lead.
const ROTATION_DELAY_MS = 3_000_000;

// A lead and a floor far below the bundled ones, so a case that supplies them
// fails if the runtime reads the bundled numbers instead.
const SHORT_ROTATION_LEAD_MS = 10;
const SHORT_ROTATION_FLOOR_MS = 5;
const SHORT_CREDENTIAL_LIFETIME_MS = 1_000;

// Device time and local receipt time are deliberately different, so a snapshot
// that collapsed the two would fail the end-to-end case.
const DEVICE_TIME = 1_700_000_000_000;

function accountConfig(): BgConfig {
  return {
    name: 'Basement Guardian',
    email: 'account@example.test',
    password: 'account-password',
    clientId: 'client-id-1',
    pollIntervalSeconds: POLL_INTERVAL_MS / 1_000,
    offlineConfirmationPollCount: 2,
    ignoredFaults: [],
  };
}

const testConstants: ProtocolConstants = {
  apiUrl: 'https://api.example.test',
  clientId: 'bundled-client-id',
  auth0Url: 'https://tenant.example.test',
  auth0Realm: 'example-realm',
  awsRegion: 'us-east-1',
  protocol: 'wss',
};

// The vendor deviceId reads <account-id>_<serial-number>; fixtures carry a
// placeholder in place of the real account identifier.
function geminiDevice(): ApiDevice {
  return {
    deviceId: DEVICE_ID,
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: DEVICE_TIME },
    data: { water_level: 1, primary_pump_running: false, ac_power: true },
  };
}

// A second physical device, so a removal case can prove the final-check fetch
// covers every pending deviceId at once rather than one call per id.
function otherGeminiDevice(): ApiDevice {
  return { ...geminiDevice(), deviceId: OTHER_DEVICE_ID };
}

// Both physical devices reporting the same level, which is what lets a
// two-device case state a pump's level as either the one its own live path
// delivered or the one the vendor's body carries, and never both.
function bothDevicesAt(level: number): ApiDevice[] {
  return [
    { ...geminiDevice(), data: { ...geminiDevice().data, water_level: level } },
    { ...otherGeminiDevice(), data: { ...otherGeminiDevice().data, water_level: level } },
  ];
}

// The same device as the vendor sends it: the list route wraps its records under
// a plural key and the serial number sits under `attributes`, not at the top
// level.
function geminiWireDeviceList(): { devices: Record<string, unknown>[] } {
  const device = geminiDevice();

  return {
    devices: [
      {
        accountId: 'account-1',
        deviceId: device.deviceId,
        deviceTypeId: device.deviceTypeId,
        name: device.name,
        data: device.data,
        attributes: { productLine: 'wayneWater', serialNumber: device.serialNumber },
        connectivity: device.connectivity,
      },
    ],
  };
}

function credentialsAt(expiresAtMs: number): AwsCredentialsResponse {
  return {
    endpoint: 'broker.invalid',
    clientId: 'client-first',
    credentials: {
      AccessKeyId: 'test-access-key-id',
      SecretAccessKey: 'test-secret-access-key',
      SessionToken: 'test-session-token',
      Expiration: new Date(expiresAtMs).toISOString(),
    },
  };
}

function rotatedCredentialsAt(expiresAtMs: number): AwsCredentialsResponse {
  return {
    endpoint: 'broker-two.invalid',
    clientId: 'client-second',
    credentials: {
      AccessKeyId: 'test-next-access-key-id',
      SecretAccessKey: 'test-next-secret-access-key',
      SessionToken: 'test-next-session-token',
      Expiration: new Date(expiresAtMs).toISOString(),
    },
  };
}

function recordingLog(recorded: string[]): Logging {
  function at(level: string): (message: string) => void {
    return (message: string): void => {
      recorded.push(`${level} ${message}`);
    };
  }

  return Object.assign(at('info'), {
    prefix: 'basement guardian',
    debug: at('debug'),
    error: at('error'),
    info: at('info'),
    success: at('success'),
    warn: at('warn'),
    log: (level: LogLevel, message: string): void => {
      recorded.push(`${level} ${message}`);
    },
  });
}

// One scripted answer per call, with the final entry standing for every call
// after it, so a case states only the answers it cares about.
function answering<T>(answers: readonly ((signal: AbortSignal) => Promise<T>)[]): (signal: AbortSignal) => Promise<T> {
  let calls = 0;

  return (signal: AbortSignal): Promise<T> => {
    const answer = answers[Math.min(calls, answers.length - 1)];
    calls += 1;

    return answer === undefined ? Promise.reject(new Error('no answer was scripted')) : answer(signal);
  };
}

// The vendor refusing the account credentials, as every authenticated route
// answers it once the tenant has said no. Written once because the cases below
// drive the same refusal through three different loops.
function refusingTheAccount(): Promise<never> {
  return Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'));
}

// Mimics the vendor request's abort behavior: it settles only when its signal
// aborts, which is how a shutdown reaches a request that is already in flight.
function hangingUntilAborted(signal: AbortSignal): Promise<never> {
  return new Promise<never>((_resolve, reject) => {
    // A request handed a signal that has already been aborted rejects at once
    // rather than waiting for an abort event that has been and gone. That is
    // what a real request does, and a stand-in that waited instead would hang
    // whenever a shutdown landed before the request was made.
    if (signal.aborted) {
      reject(new Error('the request was aborted'));

      return;
    }

    signal.addEventListener('abort', () => {
      reject(new Error('the request was aborted'));
    });
  });
}

interface ShadowRecorder {
  options: ShadowRuntimeOptions;
  subscribed: readonly string[][];
  closes: () => number;
}

// A socket-free shadow with start resolution separate from readiness.
//
// `whileStarting` deliberately holds the factory's start operation unresolved,
// so a shutdown can land before the runtime records the client. Ordinary
// readiness completes on a later event-loop turn and cannot survive close.
function fakeShadow(
  options: ShadowRuntimeOptions,
  closeFails = false,
  whileStarting?: () => Promise<void>,
): { client: ShadowClient; recorder: ShadowRecorder } {
  const subscribed: string[][] = [];
  let closes = 0;
  let live = false;
  let closing = false;
  let ending: Promise<void> | undefined;

  return {
    client: {
      get connected(): boolean {
        return live;
      },
      start: (deviceIds: readonly string[]): Promise<void> => {
        if (closing) {
          return Promise.resolve();
        }

        subscribed.push([...deviceIds]);
        const starting = whileStarting === undefined ? Promise.resolve() : whileStarting();
        void starting.then(
          async () => {
            await nextEventLoopTurn();

            if (!closing) {
              live = true;
              options.onConnected();
            }
          },
          // The runtime observes the rejection through the returned start promise.
          () => undefined,
        );

        return starting;
      },
      close: (): Promise<void> => {
        closing = true;
        live = false;

        if (ending === undefined) {
          closes += subscribed.length === 0 ? 0 : 1;
          ending = closeFails ? Promise.reject(new Error('the connection could not be closed')) : Promise.resolve();
        }

        return ending;
      },
    },
    recorder: { options, subscribed, closes: () => closes },
  };
}

interface Script {
  devices: readonly ((signal: AbortSignal) => Promise<readonly ApiDevice[]>)[];
  credentials: readonly ((signal: AbortSignal) => Promise<AwsCredentialsResponse>)[];
  /** Whether each successive connection attempt opens; the last entry repeats. */
  shadow: readonly boolean[];
  /** Whether closing the shadow connection rejects. */
  closeFails: boolean;
  /**
   * Whether unregistering an accessory throws.
   *
   * Homebridge answers a removal for an accessory it never bridged by
   * throwing, which is the state an accessory reaches when its UUID collided
   * with one another plugin had already bridged.
   */
  removalFails: boolean;
  /** Work the shadow start waits for, which is how a case lands a shutdown inside that window. */
  whileShadowStarts: () => Promise<void>;
  pollIntervalMs: number;
  rotationLeadMs: number;
  minRotationDelayMs: number;
  /**
   * How the vendor answers a command.
   *
   * Absent leaves the rejecting stand-in in place, which is what asserts the
   * monitoring path never reaches the command route; a case about commands
   * supplies its own answer and gets the recording stand-in instead.
   */
  command: (deviceId: string, command: DeviceCommand, signal: AbortSignal) => Promise<CommandResult>;
  /** The anchor store the runtime is given. A case about restarts supplies a pre-loaded one. */
  anchors: RecordingAnchors;
}

interface Harness {
  runtime: AccountRuntime;
  store: DeviceStateStore;
  logged: string[];
  /** One entry per registered secret, its role first, in registration order. */
  registrations: string[];
  shadows: ShadowRecorder[];
  calls: string[];
  /** One entry per trustworthy inventory response, the deviceIds it named. */
  trustworthyInventories: string[][];
  /** One entry per deviceId the runtime reported confirmed absent, in report order. */
  removed: string[];
  /** One entry per command the runtime sent, in send order. */
  commandRequests: CommandRequest[];
  /** One entry per monitoring-trust report the runtime pushed, the account struct, in push order. */
  monitoringHealth: MonitoringTrust[];
  /** The per-system map pushed alongside each entry above, same order, same length. */
  monitoringByDevice: ReadonlyMap<string, MonitoringTrust>[];
  /** The anchor store the runtime was given, so a case can read what it holds. */
  anchors: RecordingAnchors;
  advance: (ms: number) => Promise<void>;
}

/** One command the runtime sent, as the cloud client received it. */
interface CommandRequest {
  deviceId: string;
  desiredData: Readonly<Record<string, unknown>>;
  /** Whether the root signal was already aborted when the attempt was made. */
  aborted: boolean;
}

// Drains the promise chains a timer wakes, so a scheduled fetch and everything
// it triggers have settled before the assertions run.
async function settle(): Promise<void> {
  for (let turn = 0; turn < 8; turn += 1) {
    await nextEventLoopTurn();
  }
}

// The anchor store keeps a separate persisted snapshot, seeded by `restored`.
// Restore merges it one event-loop turn late so a case can distinguish awaited
// restoration. `persists` separately counts invocations on the reporting tick.
interface RecordingAnchors extends ArrivalAnchors {
  stored: Map<string, number>;
  persists: () => number;
}

function recordingAnchors(restored: readonly (readonly [string, number])[] = []): RecordingAnchors {
  const stored = new Map<string, number>();
  let persisted = new Map<string, number>(restored);
  let persists = 0;

  return {
    stored,
    persists: (): number => persists,
    get: (deviceId: string): number | undefined => stored.get(deviceId),
    record: (deviceId: string, at: number): void => {
      stored.set(deviceId, at);
    },
    forget: (deviceId: string): void => {
      stored.delete(deviceId);
    },
    restore: async (): Promise<void> => {
      await nextEventLoopTurn();

      for (const [deviceId, anchor] of persisted) {
        stored.set(deviceId, anchor);
      }
    },
    persist: (): Promise<void> => {
      persisted = new Map(stored);
      persists += 1;

      return Promise.resolve();
    },
  };
}

// Builds the runtime over a scripted cloud and a socket-free shadow. The
// failure log and both retry policies are the real ones: the reminder cadence
// and the pending guard are the behavior under test, and a hand-written double
// would re-implement them.
function harness(t: TestContext, script: Partial<Script> = {}): Harness {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const logged: string[] = [];
  const registrations: string[] = [];
  const shadows: ShadowRecorder[] = [];
  const calls: string[] = [];
  const trustworthyInventories: string[][] = [];
  const removed: string[] = [];
  const commandRequests: CommandRequest[] = [];
  const monitoringHealth: MonitoringTrust[] = [];
  const monitoringByDevice: ReadonlyMap<string, MonitoringTrust>[] = [];
  let time = START_TIME;

  const clock: Clock = { now: () => time };
  // The two bases move together, as they do in production and in the Cucumber
  // harness: a case that advances time means both, and only a case about a
  // wall-clock correction moves one alone.
  const monotonic: MonotonicClock = { now: () => MONOTONIC_START_TIME + (time - START_TIME) };
  const log = recordingLog(logged);
  const store = createDeviceStateStore({ clock, log: recordingLog([]) });
  const anchors = script.anchors ?? recordingAnchors();

  const nextDevices = answering(script.devices ?? [() => Promise.resolve([geminiDevice()])]);
  const nextCredentials = answering(script.credentials ?? [() => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS))]);
  const shadowOpens = script.shadow ?? [true];
  let shadowAttempts = 0;

  const api: CloudApi = {
    devices: (signal: AbortSignal) => {
      calls.push('devices');

      return nextDevices(signal);
    },
    awsCredentials: (signal: AbortSignal) => {
      calls.push('credentials');

      return nextCredentials(signal);
    },
    device: () => Promise.reject(new Error('the runtime must not reach the device route')),
    // The monitoring path -- polling, shadow, credential rotation, removal --
    // must never reach the command route, and this is what asserts it. A case
    // about commands supplies `script.command` and gets the recorder below
    // instead, so the deliberate assertion stays deliberate.
    sendCommand: (deviceId: string, command: DeviceCommand, signal: AbortSignal) => {
      if (script.command === undefined) {
        return Promise.reject(new Error('the monitoring path must not reach the command route'));
      }

      commandRequests.push({ deviceId, desiredData: command.desiredData, aborted: signal.aborted });

      return script.command(deviceId, command, signal);
    },
  };

  const runtime = createAccountRuntime({
    api,
    store,
    registry: createFamilyRegistry(),
    createShadow: (shadowOptions: ShadowRuntimeOptions): ShadowClient => {
      calls.push('shadow');

      // The real client opens the socket while it is being built, so a broker
      // that refuses the handshake throws out of the factory rather than
      // rejecting later.
      const opens = shadowOpens[Math.min(shadowAttempts, shadowOpens.length - 1)] ?? true;
      shadowAttempts += 1;

      if (!opens) {
        throw new Error('the broker refused the connection');
      }

      const { client, recorder } = fakeShadow(shadowOptions, script.closeFails ?? false, script.whileShadowStarts);
      shadows.push(recorder);

      return client;
    },
    createRetry: (signal: AbortSignal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: recordingLog([]) }),
    pollIntervalMs: script.pollIntervalMs ?? POLL_INTERVAL_MS,
    rotationLeadMs: script.rotationLeadMs ?? ROTATION_LEAD_MS,
    minRotationDelayMs: script.minRotationDelayMs ?? MIN_ROTATION_DELAY_MS,
    failures: createFailureLog({ clock, log, reminderIntervalMs: FAILURE_REMINDER_MS }),
    registerSecret: (secret: string, role?: SecretRole): void => {
      registrations.push(`${String(role)} ${secret}`);
    },
    onTrustworthyInventory: (deviceIds: readonly string[]): void => {
      trustworthyInventories.push([...deviceIds]);
    },
    onDeviceRemoved: (deviceId: string): void => {
      removed.push(deviceId);

      if (script.removalFails ?? false) {
        throw new Error('Cannot find the bridged Accessory to remove.');
      }

      // What the platform's own handler does with this signal, at
      // `src/platform.ts:480`. A harness that only records the call leaves the
      // device in the store, so the runtime goes on reporting on a system the
      // account no longer holds and the next poll sweeps up whatever the removal
      // failed to drop -- which is a case passing over state nothing released.
      store.remove(deviceId);
    },
    onMonitoringHealth: (account: MonitoringTrust, byDevice: ReadonlyMap<string, MonitoringTrust>): void => {
      monitoringHealth.push(account);
      monitoringByDevice.push(new Map(byDevice));
    },
    clock,
    monotonic,
    anchors,
    log,
  });

  // A case that leaves the runtime running would leave its timers armed, which
  // is what a leaked timer looks like from outside.
  t.after(async () => {
    await runtime.stop();
  });

  return {
    runtime,
    store,
    logged,
    registrations,
    shadows,
    calls,
    trustworthyInventories,
    removed,
    commandRequests,
    monitoringHealth,
    monitoringByDevice,
    anchors,
    advance: async (ms: number): Promise<void> => {
      time += ms;
      t.mock.timers.tick(ms);
      await settle();
    },
  };
}

// The shadow options the runtime handed its first connection, which is where
// every arriving message enters the runtime.
function shadowOptionsOf(shadows: readonly ShadowRecorder[]): ShadowRuntimeOptions {
  const shadow = shadows.at(0);

  if (shadow === undefined) {
    throw new Error('the runtime opened no shadow connection');
  }

  return shadow.options;
}

// One heartbeat as the shadow client routes it. Its content is beside the point:
// arrival alone is what proves the live path is still carrying messages.
function heartbeatPatch(): ReportedPatch {
  return { data: { water_level: 1 }, state: undefined, version: undefined };
}

function countOf(logged: readonly string[], level: string): number {
  return logged.filter((line) => line.startsWith(`${level} `)).length;
}

function countOfLine(logged: readonly string[], line: string): number {
  return logged.filter((candidate) => candidate === line).length;
}

// What each push said about the one system this harness's account holds.
//
// The silence answer lives in the per-system map and nowhere else: the account
// struct beside it carries a constant, so a case that read it would report a
// pass whatever the runtime did (D-02).
function silenceOf(pushes: readonly ReadonlyMap<string, MonitoringTrust>[]): (boolean | undefined)[] {
  return pushes.map((byDevice) => byDevice.get(DEVICE_ID)?.shadowSilent);
}

for (const { name, connectedCalls } of ACCOUNT_SHADOW_CASES) {
  test(`account ${ACCOUNT_SHADOW_PARTICIPANTS.account.factoryName} ${name}`, async () => {
    // arrange
    const notifications: string[] = [];
    const callbacks = mock<Pick<ShadowRuntimeOptions, 'onConnected' | 'onDisconnected'>>({ exactParams: true, name: 'shadow notifications' });
    when(() => {
      callbacks.onConnected();
    })
      .thenReturn(undefined)
      .times(connectedCalls);
    const { client, recorder } = fakeShadow({
      credentials: {
        current: () => ({ endpoint: 'broker.invalid', clientId: 'client-1', accessKeyId: 'key', secretAccessKey: 'secret', sessionToken: 'token' }),
      },
      retry: createRetryPolicy({ signal: new AbortController().signal, maxDelayMs: MAX_BACKOFF_MS, log: recordingLog([]) }),
      onConnected: () => {
        callbacks.onConnected();
        notifications.push('connected');
      },
      onDisconnected: (reason) => {
        callbacks.onDisconnected(reason);
        notifications.push(`disconnected ${reason}`);
      },
      onReportedPatch: () => undefined,
    });
    const participant = {
      client,
      notifications,
      beginReadiness: () => undefined,
      finishReadiness: async () => {
        await nextEventLoopTurn();
      },
      opened: () => recorder.subscribed.length,
      closed: () => recorder.closes(),
    };

    // act
    const observations = await exerciseAccountShadowContract(participant, name);

    // assert
    assertAccountShadowContract(observations, name);
    verify(callbacks);
  });
}

test('rejects a shadow participant that opens after close', async () => {
  // arrange
  let connected = false;
  let opens = 0;
  const participant = {
    client: {
      get connected(): boolean {
        return connected;
      },
      start: () => {
        connected = true;
        opens += 1;

        return Promise.resolve();
      },
      close: () => Promise.resolve(),
    },
    notifications: [],
    beginReadiness: () => undefined,
    finishReadiness: () => Promise.resolve(),
    opened: () => opens,
    closed: () => 0,
  };

  // act
  const observations = await exerciseAccountShadowContract(participant, 'stays closed when started after close');

  // assert
  assert.throws(
    () => {
      assertAccountShadowContract(observations, 'stays closed when started after close');
    },
    (error: unknown) => {
      assert.ok(error instanceof assert.AssertionError);
      assert.deepStrictEqual(
        { code: error.code, actual: error.actual, expected: error.expected, operator: error.operator },
        {
          code: 'ERR_ASSERTION',
          actual: [
            { stage: 'constructed', connected: false, notifications: [], opened: 0, closed: 0 },
            { stage: 'closed before start', connected: false, notifications: [], opened: 0, closed: 0 },
            { stage: 'start after close', connected: true, notifications: [], opened: 1, closed: 0 },
            { stage: 'closed again', connected: true, notifications: [], opened: 1, closed: 0 },
          ],
          expected: [
            { stage: 'constructed', connected: false, notifications: [], opened: 0, closed: 0 },
            { stage: 'closed before start', connected: false, notifications: [], opened: 0, closed: 0 },
            { stage: 'start after close', connected: false, notifications: [], opened: 0, closed: 0 },
            { stage: 'closed again', connected: false, notifications: [], opened: 0, closed: 0 },
          ],
          operator: 'deepStrictEqual',
        },
      );
      return true;
    },
  );
});

for (const contractCase of ARRIVAL_ANCHOR_MEMORY_CASES) {
  test(`account ${ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS.account.factoryName} ${contractCase}`, () => {
    // arrange
    const anchors = recordingAnchors();

    // act
    const observation = exerciseArrivalAnchorMemoryContract(anchors, contractCase);

    // assert
    assertArrivalAnchorMemoryContract(observation, contractCase);
  });
}

for (const contractCase of ARRIVAL_ANCHOR_PERSISTENCE_CASES) {
  test(`account ${ARRIVAL_ANCHOR_PERSISTENCE_PARTICIPANTS.account.factoryName} ${contractCase}`, async () => {
    // arrange
    const anchors = recordingAnchors();

    // act
    const observation = await exerciseArrivalAnchorPersistenceContract(anchors, contractCase);

    // assert
    assertArrivalAnchorPersistenceContract(observation, contractCase);
  });
}

for (const { contractCase, createAnchors, rejectedObservation, expectedObservation } of [
  {
    contractCase: 'forgets only the named device',
    createAnchors: (): ArrivalAnchors => ({ ...recordingAnchors(), forget: () => undefined }),
    rejectedObservation: {
      beforeOperation: { anchor: 0, otherAnchor: 1_700_000_898_000 },
      afterOperation: { anchor: 0, otherAnchor: 1_700_000_898_000 },
    },
    expectedObservation: {
      beforeOperation: { anchor: 0, otherAnchor: 1_700_000_898_000 },
      afterOperation: { anchor: undefined, otherAnchor: 1_700_000_898_000 },
    },
  },
  {
    contractCase: 'restores persisted anchors without clearing other memory',
    createAnchors: (): ArrivalAnchors => ({ ...recordingAnchors(), restore: () => Promise.resolve() }),
    rejectedObservation: {
      beforeOperation: { anchor: 1_700_000_000_000, otherAnchor: 1_700_000_898_000 },
      afterOperation: { anchor: 1_700_000_000_000, otherAnchor: 1_700_000_898_000 },
    },
    expectedObservation: {
      beforeOperation: { anchor: 1_700_000_000_000, otherAnchor: 1_700_000_898_000 },
      afterOperation: { anchor: 0, otherAnchor: 1_700_000_898_000 },
    },
  },
  {
    contractCase: 'persists a snapshot including deletion',
    createAnchors: (): ArrivalAnchors => ({ ...recordingAnchors(), persist: () => Promise.resolve() }),
    rejectedObservation: {
      beforeOperation: { anchor: undefined, otherAnchor: 1_700_000_898_000 },
      afterOperation: { anchor: undefined, otherAnchor: undefined },
    },
    expectedObservation: {
      beforeOperation: { anchor: undefined, otherAnchor: 1_700_000_898_000 },
      afterOperation: { anchor: undefined, otherAnchor: 1_700_000_898_000 },
    },
  },
] as const) {
  test(`rejects an account anchor participant that never ${contractCase}`, async () => {
    // arrange
    const anchors = createAnchors();

    // act
    const observation = await exerciseArrivalAnchorPersistenceContract(anchors, contractCase);

    // assert
    assert.throws(
      () => {
        assertArrivalAnchorPersistenceContract(observation, contractCase);
      },
      (error: unknown) => {
        assert.ok(error instanceof assert.AssertionError);
        assert.deepStrictEqual(
          { code: error.code, actual: error.actual, expected: error.expected, operator: error.operator },
          { code: 'ERR_ASSERTION', actual: rejectedObservation, expected: expectedObservation, operator: 'deepStrictEqual' },
        );
        return true;
      },
    );
  });
}

test('waits until a distant credential expiry using only representable native timer delays', async (t) => {
  // arrange
  const { runtime, calls, advance } = harness(t, {
    credentials: [() => Promise.resolve(credentialsAt(START_TIME + 4_320_000_000))],
    rotationLeadMs: 10,
    minRotationDelayMs: 5,
  });
  const setTimeoutSpy = t.mock.method(timers, 'setTimeout');

  // act
  await runtime.start();
  await settle();
  await advance(2_147_483_647);
  const afterFirstBoundedWait = calls.filter((call) => call === 'credentials').length;
  await advance(2_147_483_647);
  const afterSecondBoundedWait = calls.filter((call) => call === 'credentials').length;
  await advance(25_032_695);
  const beforeExpiryLead = calls.filter((call) => call === 'credentials').length;
  await advance(1);
  const afterExpiryLead = calls.filter((call) => call === 'credentials').length;
  const unrepresentableDelays = setTimeoutSpy.mock.calls
    .map((call) => call.arguments[0])
    .filter((delay) => delay === undefined || !Number.isFinite(delay) || delay < 1 || delay > 2_147_483_647);

  // assert
  assert.strictEqual(runtime.monitoringPath, 'shadow-and-poll');
  assert.deepStrictEqual(unrepresentableDelays, [], 'credential expiry scheduling must keep every native timer delay within 1..2147483647 ms');
  assert.deepStrictEqual(
    { afterFirstBoundedWait, afterSecondBoundedWait, beforeExpiryLead, afterExpiryLead },
    { afterFirstBoundedWait: 1, afterSecondBoundedWait: 1, beforeExpiryLead: 1, afterExpiryLead: 2 },
  );
});

test('retains halted state when a pending final inventory check succeeds', async (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-account-halt-'));
  // Promise constructors assign both resolvers synchronously.
  let completeInventory!: (devices: readonly ApiDevice[]) => void;
  let announceFinalCheck!: () => void;
  const pendingInventory = new Promise<readonly ApiDevice[]>((resolve) => {
    completeInventory = resolve;
  });
  const finalCheckStarted = new Promise<void>((resolve) => {
    announceFinalCheck = resolve;
  });
  interface TrustReport {
    account: MonitoringTrust;
    byDevice: ReadonlyMap<string, MonitoringTrust>;
  }
  const healthReports: TrustReport[] = [];
  let elapsedMs = 0;

  function silent(): void {
    return undefined;
  }

  const log: Logging = Object.assign(silent, {
    prefix: '',
    debug: silent,
    error: silent,
    info: silent,
    success: silent,
    warn: silent,
    log: silent,
  });
  const clock: Clock = { now: () => START_TIME + elapsedMs };
  const store = createDeviceStateStore({ clock, log });
  const removeSpy = t.mock.method(store, 'remove');
  const anchors = createArrivalAnchors({ storagePath, log });
  const api: CloudApi = {
    devices: answering([
      () => Promise.resolve([geminiDevice()]),
      () => Promise.resolve([]),
      () => Promise.resolve([]),
      () => {
        announceFinalCheck();

        return pendingInventory;
      },
    ]),
    awsCredentials: answering([
      () => Promise.resolve(credentialsAt(START_TIME + 2_510)),
      () => Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant')),
    ]),
    device: () => Promise.reject(new Error('no single-device request is scripted')),
    sendCommand: () => Promise.reject(new Error('no command is scripted')),
  };
  const runtime = createAccountRuntime({
    api,
    store,
    registry: createFamilyRegistry(),
    createShadow: () => ({ connected: false, start: () => Promise.resolve(), close: () => Promise.resolve() }),
    createRetry: (signal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log }),
    pollIntervalMs: 1_000,
    rotationLeadMs: 10,
    minRotationDelayMs: 5,
    failures: { recordFailure: silent, recordSuccess: silent, forget: silent },
    registerSecret: silent,
    onTrustworthyInventory: silent,
    onDeviceRemoved: (deviceId) => {
      store.remove(deviceId);
    },
    onMonitoringHealth: (account, byDevice) => {
      healthReports.push({ account, byDevice: new Map(byDevice) });
    },
    clock,
    monotonic: { now: () => MONOTONIC_START_TIME + elapsedMs },
    anchors,
    log,
  });
  t.after(async () => {
    await runtime.stop();
    await rm(storagePath, { recursive: true, force: true });
  });
  const expectedSnapshot: DeviceSnapshot = {
    identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
    connectivity: { connected: true, timestamp: 1_700_000_000_000 },
    data: { water_level: 1, primary_pump_running: false, ac_power: true },
    metadata: {},
    shadowVersion: undefined,
    deviceTimestamp: 1_700_000_000_000,
    receivedAt: START_TIME,
  };
  const healthyAccount: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false };
  const healthyDevice: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false };
  const haltedAccount: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true };
  const haltedDevice: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true };
  const expectedHaltedState = {
    path: 'unavailable',
    snapshots: [expectedSnapshot],
    anchors: [[DEVICE_ID, START_TIME]],
    healthReports: [
      { account: healthyAccount, byDevice: new Map([[DEVICE_ID, healthyDevice]]) },
      { account: healthyAccount, byDevice: new Map([[DEVICE_ID, healthyDevice]]) },
      { account: haltedAccount, byDevice: new Map([[DEVICE_ID, haltedDevice]]) },
    ],
  };

  // act
  await runtime.start();
  await settle();
  elapsedMs = 1_000;
  t.mock.timers.tick(1_000);
  await settle();
  elapsedMs = 2_000;
  t.mock.timers.tick(1_000);
  await finalCheckStarted;
  elapsedMs = 2_500;
  t.mock.timers.tick(500);
  await settle();
  const beforeCompletion = {
    path: runtime.monitoringPath,
    snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
    anchors: [[DEVICE_ID, anchors.get(DEVICE_ID)]],
    healthReports: [...healthReports],
  };
  completeInventory([]);
  await settle();
  const afterCompletion = {
    path: runtime.monitoringPath,
    snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
    anchors: [[DEVICE_ID, anchors.get(DEVICE_ID)]],
    healthReports: [...healthReports],
  };

  // assert
  assert.deepStrictEqual({ beforeCompletion, afterCompletion }, { beforeCompletion: expectedHaltedState, afterCompletion: expectedHaltedState });
  assert.deepStrictEqual(
    removeSpy.mock.calls.map((call) => call.arguments),
    [],
  );
});

test('starts no inventory work when restoration completes after shutdown', async (t) => {
  // arrange
  // The promise constructor assigns the resolver synchronously.
  let completeRestore!: () => void;
  const restoring = new Promise<void>((resolve) => {
    completeRestore = resolve;
  });
  const anchors = { ...recordingAnchors(), restore: () => restoring };
  const { runtime, store, calls, monitoringHealth } = harness(t, { anchors });

  // act
  const starting = runtime.start();
  await runtime.stop();
  completeRestore();
  await starting;
  await settle();

  // assert
  assert.deepStrictEqual(
    { path: runtime.monitoringPath, snapshots: store.deviceIds(), anchors: [...anchors.stored], monitoringHealth },
    {
      path: 'unavailable',
      snapshots: [],
      anchors: [],
      monitoringHealth: [{ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }],
    },
  );
  assert.deepStrictEqual(calls, []);
});

test('admits no devices when the launch inventory resolves after shutdown', async (t) => {
  // arrange
  // The promise constructor assigns the resolver synchronously.
  let completeInventory!: (devices: readonly ApiDevice[]) => void;
  const inventory = new Promise<readonly ApiDevice[]>((resolve) => {
    completeInventory = resolve;
  });
  const { runtime, store, anchors, calls, monitoringHealth, trustworthyInventories } = harness(t, { devices: [() => inventory] });

  // act
  const starting = runtime.start();
  await settle();
  await runtime.stop();
  completeInventory([geminiDevice()]);
  await starting;
  await settle();

  // assert
  assert.deepStrictEqual(
    { path: runtime.monitoringPath, snapshots: store.deviceIds(), anchors: [...anchors.stored], monitoringHealth },
    {
      path: 'unavailable',
      snapshots: [],
      anchors: [],
      monitoringHealth: [{ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }],
    },
  );
  assert.deepStrictEqual({ calls, trustworthyInventories }, { calls: ['devices'], trustworthyInventories: [] });
});

test('starts no background work when shutdown follows launch admission', async (t) => {
  // arrange
  const { runtime, store, anchors, calls, monitoringHealth, trustworthyInventories } = harness(t);
  store.subscribe(DEVICE_ID, () => {
    queueMicrotask(() => {
      void runtime.stop();
    });
  });

  // act
  await runtime.start();
  await settle();

  // assert
  assert.deepStrictEqual(
    { path: runtime.monitoringPath, snapshot: store.snapshot(DEVICE_ID), anchors: [...anchors.stored], monitoringHealth },
    {
      path: 'unavailable',
      snapshot: {
        identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: DEVICE_TIME },
        data: { water_level: 1, primary_pump_running: false, ac_power: true },
        metadata: {},
        shadowVersion: undefined,
        deviceTimestamp: DEVICE_TIME,
        receivedAt: START_TIME,
      },
      anchors: [[DEVICE_ID, START_TIME]],
      monitoringHealth: [{ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }],
    },
  );
  assert.deepStrictEqual({ calls, trustworthyInventories }, { calls: ['devices'], trustworthyInventories: [[DEVICE_ID]] });
});

interface PendingInventory {
  resolve: (devices: readonly ApiDevice[]) => void;
  reject: (error: Error) => void;
}

for (const { completion, finish, precedingInventories, expectedInventories, healthyReports, haltAtMs } of [
  {
    completion: 'regular inventory succeeds',
    finish: (pending: PendingInventory) => {
      pending.resolve([otherGeminiDevice()]);
    },
    precedingInventories: [() => Promise.resolve([geminiDevice()])],
    expectedInventories: [[DEVICE_ID]],
    healthyReports: 1,
    haltAtMs: 1_500,
  },
  {
    completion: 'regular inventory fails',
    finish: (pending: PendingInventory) => {
      pending.reject(new Error('inventory failed'));
    },
    precedingInventories: [() => Promise.resolve([geminiDevice()])],
    expectedInventories: [[DEVICE_ID]],
    healthyReports: 1,
    haltAtMs: 1_500,
  },
  {
    completion: 'final inventory check fails',
    finish: (pending: PendingInventory) => {
      pending.reject(new Error('inventory failed'));
    },
    precedingInventories: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([]), () => Promise.resolve([])],
    expectedInventories: [[DEVICE_ID], [], []],
    healthyReports: 2,
    haltAtMs: 2_500,
  },
]) {
  test(`retains halted state when a pending ${completion}`, async (t) => {
    // arrange
    // The promise constructor assigns both resolvers synchronously.
    let completeInventory!: (devices: readonly ApiDevice[]) => void;
    let rejectInventory!: (error: Error) => void;
    const inventory = new Promise<readonly ApiDevice[]>((resolve, reject) => {
      completeInventory = resolve;
      rejectInventory = reject;
    });
    const { runtime, store, anchors, monitoringHealth, monitoringByDevice, trustworthyInventories, advance } = harness(t, {
      devices: [...precedingInventories, () => inventory],
      credentials: [() => Promise.resolve(credentialsAt(START_TIME + haltAtMs + 10)), refusingTheAccount],
      pollIntervalMs: 1_000,
      rotationLeadMs: 10,
      minRotationDelayMs: 5,
    });
    const healthyAccount: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false };
    const healthyDevice: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false };
    const haltedAccount: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true };
    const haltedDevice: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true };

    // act
    await runtime.start();

    for (let elapsedMs = 1_000; elapsedMs < haltAtMs; elapsedMs += 1_000) {
      await advance(1_000);
    }

    await advance(500);
    finish({ resolve: completeInventory, reject: rejectInventory });
    await settle();

    // assert
    assert.deepStrictEqual(
      {
        path: runtime.monitoringPath,
        snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
        anchors: [...anchors.stored],
        monitoringHealth,
        monitoringByDevice,
      },
      {
        path: 'unavailable',
        snapshots: [
          {
            identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
            connectivity: { connected: true, timestamp: DEVICE_TIME },
            data: { water_level: 1, primary_pump_running: false, ac_power: true },
            metadata: {},
            shadowVersion: undefined,
            deviceTimestamp: DEVICE_TIME,
            receivedAt: START_TIME,
          },
        ],
        anchors: [[DEVICE_ID, START_TIME]],
        monitoringHealth: [...Array.from({ length: healthyReports }, () => healthyAccount), haltedAccount],
        monitoringByDevice: [...Array.from({ length: healthyReports }, () => new Map([[DEVICE_ID, healthyDevice]])), new Map([[DEVICE_ID, haltedDevice]])],
      },
    );
    assert.deepStrictEqual(trustworthyInventories, expectedInventories);
  });
}

describe('start', () => {
  test('discovers every device and stores its canonical snapshot', async (t) => {
    // arrange
    const { runtime, store } = harness(t);

    // act
    await runtime.start();

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
  });

  test('reads canonical state from the one store it maintains', async (t) => {
    // arrange
    const { runtime, store } = harness(t);

    // act
    await runtime.start();

    // assert
    assert.strictEqual(runtime.store, store);
    assert.deepStrictEqual(runtime.store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
  });

  test('reports how many devices the account holds', async (t) => {
    // arrange
    const { runtime, logged } = harness(t);

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(logged, ['info Discovered 1 device(s).']);
  });

  test('opens one shadow connection for every discovered device', async (t) => {
    // arrange
    const { runtime, shadows } = harness(t);

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual({ connections: shadows.length, subscribed: shadows[0]?.subscribed }, { connections: 1, subscribed: [[DEVICE_ID]] });
  });

  test('reports the discovered deviceIds to the trustworthy-inventory listener', async (t) => {
    // arrange
    const { runtime, trustworthyInventories } = harness(t);

    // act
    await runtime.start();

    // assert
    assert.deepStrictEqual(trustworthyInventories, [[DEVICE_ID]]);
  });

  test('reports an empty list to the trustworthy-inventory listener on a valid empty response', async (t) => {
    // arrange
    const { runtime, trustworthyInventories } = harness(t, { devices: [() => Promise.resolve([])] });

    // act
    await runtime.start();

    // assert
    assert.deepStrictEqual(trustworthyInventories, [[]]);
  });

  test('AUTH-02 registers every temporary credential value under its own rotated role', async (t) => {
    // arrange
    const { runtime, registrations } = harness(t);

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(registrations, [
      'aws-access-key-id test-access-key-id',
      'aws-secret-access-key test-secret-access-key',
      'aws-session-token test-session-token',
    ]);
  });

  test('reports the route and the status when the vendor refuses discovery', async (t) => {
    // arrange
    const { runtime, logged, store } = harness(t, {
      devices: [() => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 403.', 403, 'GET /devices'))],
    });

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(
      { discoveryReport: logged[0], stored: store.deviceIds() },
      { discoveryReport: 'warn Device discovery failed on GET /devices with HTTP 403.', stored: [] },
    );
  });

  test('reports a fixed message that repeats nothing from an unexpected discovery failure', async (t) => {
    // arrange
    const { runtime, logged } = harness(t, {
      devices: [() => Promise.reject(new Error('connect ECONNREFUSED https://api.example.test/devices'))],
    });

    // act
    await runtime.start();
    await settle();

    // assert
    assert.strictEqual(logged[0], 'warn Device discovery failed.');
  });

  test('D-13 schedules nothing at all after the vendor refuses the account credentials', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      devices: [() => Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'))],
    });

    // act
    await runtime.start();
    await advance(ONE_HOUR_MS);

    // assert
    assert.deepStrictEqual(calls, ['devices']);
  });

  test('D-22 waits the interval a throttling response carries rather than the capped backoff', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      devices: [() => Promise.reject(new AuthThrottledError('the vendor answered HTTP 429.', THROTTLE_RETRY_MS)), () => Promise.resolve([geminiDevice()])],
    });

    // act
    await runtime.start();
    await advance(MAX_BACKOFF_MS);
    const afterCappedBackoff = calls.filter((call) => call === 'devices').length;
    await advance(THROTTLE_RETRY_MS - MAX_BACKOFF_MS);

    // assert
    assert.deepStrictEqual(
      { afterCappedBackoff, afterCarriedInterval: calls.filter((call) => call === 'devices').length },
      { afterCappedBackoff: 1, afterCarriedInterval: 2 },
    );
  });

  test('D-22 waits again when the launch that follows a throttling response is throttled too', async (t) => {
    // arrange
    const throttled = (): Promise<never> => Promise.reject(new AuthThrottledError('the vendor answered HTTP 429.', THROTTLE_RETRY_MS));
    const { runtime, calls, advance } = harness(t, { devices: [throttled, throttled, () => Promise.resolve([geminiDevice()])] });

    // act
    await runtime.start();
    await advance(THROTTLE_RETRY_MS);
    await advance(THROTTLE_RETRY_MS);

    // assert
    assert.strictEqual(calls.filter((call) => call === 'devices').length, 3);
  });

  test('performs no work when start runs after stop', async (t) => {
    // arrange
    const { runtime, calls } = harness(t);

    // act
    await runtime.stop();
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(calls, []);
  });

  // The restart case, end to end. An earlier run left an anchor older than the
  // whole silence window, so the pump was already quiet when the bridge went
  // down and this run must not vouch for it. The forward-only base restarted at
  // zero and says nothing; the restored anchor is what carries the fact across.
  //
  // It also pins the ordering. The store is restored one event-loop turn late,
  // so a restore that was fired rather than awaited would land after the
  // admission loop had already anchored the device at this instant, and the
  // first report would call it trustworthy.
  test('D-07 retains the restored anchor of a silent pump until a reported arrival', async (t) => {
    // arrange
    const { runtime, anchors, shadows, monitoringByDevice, advance } = harness(t, {
      anchors: recordingAnchors([[DEVICE_ID, START_TIME - TWO_MISSED_HEARTBEATS_MS]]),
    });

    // act
    await runtime.start();
    await settle();
    const afterStart = {
      reports: monitoringByDevice.length,
      silent: monitoringByDevice.at(0)?.get(DEVICE_ID)?.shadowSilent,
      anchor: anchors.get(DEVICE_ID),
      stored: [...anchors.stored],
    };
    await advance(123);
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual(afterStart, {
      reports: 1,
      silent: true,
      anchor: START_TIME - 1_796_000,
      stored: [[DEVICE_ID, START_TIME - 1_796_000]],
    });
    assert.deepStrictEqual(
      { anchor: anchors.get(DEVICE_ID), stored: [...anchors.stored] },
      {
        anchor: START_TIME + 123,
        stored: [[DEVICE_ID, START_TIME + 123]],
      },
    );
  });

  // An install carrying no anchor invents nothing. The device is judged from its
  // admission, exactly as it was before any anchor existed, and the run seeds an
  // anchor for the next one (D-08).
  test('D-08 vouches for a pump admitted on an install carrying no stored anchor, and anchors it from its admission', async (t) => {
    // arrange
    const { runtime, anchors, monitoringByDevice } = harness(t);

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(
      { silent: monitoringByDevice.at(0)?.get(DEVICE_ID)?.shadowSilent, anchor: anchors.stored.get(DEVICE_ID) },
      { silent: false, anchor: START_TIME },
    );
  });

  // The anchors are written where the trust is reported, which is every poll
  // outcome. The write is not awaited, so this asserts it happened rather than
  // when it completed.
  test('D-07 writes the anchors on the reporting tick', async (t) => {
    // arrange
    const { runtime, anchors, advance } = harness(t);
    await runtime.start();
    await settle();
    const afterTheLaunch = anchors.persists();

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ afterTheLaunch, afterAPoll: anchors.persists() }, { afterTheLaunch: 1, afterAPoll: 2 });
  });
});

describe('credential rotation', () => {
  test('SYNC-04 refreshes the credentials ten minutes before the expiry the response carries', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t);
    await runtime.start();
    await settle();

    // act
    await advance(ROTATION_DELAY_MS - 1);
    const beforeDue = calls.filter((call) => call === 'credentials').length;
    await advance(1);

    // assert
    assert.deepStrictEqual({ beforeDue, afterDue: calls.filter((call) => call === 'credentials').length }, { beforeDue: 1, afterDue: 2 });
  });

  test('holds the delay at the injected floor when the response already expires inside the injected lead window', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      credentials: [() => Promise.resolve(credentialsAt(START_TIME + SHORT_ROTATION_LEAD_MS))],
      rotationLeadMs: SHORT_ROTATION_LEAD_MS,
      minRotationDelayMs: SHORT_ROTATION_FLOOR_MS,
    });
    await runtime.start();
    await settle();

    // act
    await advance(SHORT_ROTATION_FLOOR_MS - 1);
    const beforeFloor = calls.filter((call) => call === 'credentials').length;
    await advance(1);

    // assert
    assert.deepStrictEqual({ beforeFloor, afterFloor: calls.filter((call) => call === 'credentials').length }, { beforeFloor: 1, afterFloor: 2 });
  });

  test('SYNC-04 takes the injected lead when the expiry sits further out than the injected floor', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      credentials: [() => Promise.resolve(credentialsAt(START_TIME + SHORT_CREDENTIAL_LIFETIME_MS))],
      rotationLeadMs: SHORT_ROTATION_LEAD_MS,
      minRotationDelayMs: SHORT_ROTATION_FLOOR_MS,
    });
    await runtime.start();
    await settle();

    // act
    await advance(SHORT_CREDENTIAL_LIFETIME_MS - SHORT_ROTATION_LEAD_MS - 1);
    const beforeDue = calls.filter((call) => call === 'credentials').length;
    await advance(1);

    // assert
    assert.deepStrictEqual({ beforeDue, afterDue: calls.filter((call) => call === 'credentials').length }, { beforeDue: 1, afterDue: 2 });
  });

  test('SYNC-04 schedules the next rotation from the new expiry rather than the first one', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      credentials: [
        () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
        () => Promise.resolve(rotatedCredentialsAt(START_TIME + ROTATION_DELAY_MS + ONE_HOUR_MS)),
      ],
    });
    await runtime.start();
    await settle();
    await advance(ROTATION_DELAY_MS);

    // act
    await advance(ROTATION_DELAY_MS - 1);
    const beforeSecondDue = calls.filter((call) => call === 'credentials').length;
    await advance(1);

    // assert
    assert.deepStrictEqual(
      { beforeSecondDue, afterSecondDue: calls.filter((call) => call === 'credentials').length },
      { beforeSecondDue: 2, afterSecondDue: 3 },
    );
  });

  test('SYNC-04 arms the next rotation even after a refresh that rejects', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      credentials: [
        () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
        () => Promise.reject(new CloudRequestError('GET /credentials/aws failed with HTTP 503.', 503, 'GET /credentials/aws')),
        () => Promise.resolve(rotatedCredentialsAt(START_TIME + ROTATION_DELAY_MS + ONE_HOUR_MS)),
      ],
    });
    await runtime.start();
    await settle();
    await advance(ROTATION_DELAY_MS);

    // act
    await advance(29_999);
    const beforeFloor = calls.filter((call) => call === 'credentials').length;
    await advance(1);

    // assert
    assert.deepStrictEqual({ beforeFloor, afterFloor: calls.filter((call) => call === 'credentials').length }, { beforeFloor: 2, afterFloor: 3 });
  });

  test('reports a failed refresh through the rate-limited discipline rather than directly', async (t) => {
    // arrange
    const { runtime, logged, advance } = harness(t, {
      credentials: [
        () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
        () => Promise.reject(new CloudRequestError('GET /credentials/aws failed with HTTP 503.', 503, 'GET /credentials/aws')),
      ],
    });
    await runtime.start();
    await settle();

    // act
    await advance(ROTATION_DELAY_MS);
    await advance(MIN_ROTATION_DELAY_MS);
    await advance(MIN_ROTATION_DELAY_MS);

    // assert
    assert.deepStrictEqual(
      { warnings: countOfLine(logged, `warn ${ROTATION_FAILED_LINE}`), repeats: countOfLine(logged, `debug ${ROTATION_FAILED_LINE}`) },
      { warnings: 1, repeats: 2 },
    );
  });

  test('SYNC-04 replaces what the next handshake reads and leaves the live connection alone', async (t) => {
    // arrange
    const { runtime, shadows, advance } = harness(t, {
      credentials: [
        () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
        () => Promise.resolve(rotatedCredentialsAt(START_TIME + ROTATION_DELAY_MS + ONE_HOUR_MS)),
      ],
    });
    await runtime.start();
    await settle();

    // act
    await advance(ROTATION_DELAY_MS);

    // assert
    assert.deepStrictEqual(
      { connections: shadows.length, closes: shadows[0]?.closes(), cached: shadows[0]?.options.credentials.current() },
      {
        connections: 1,
        closes: 0,
        cached: {
          endpoint: 'broker-two.invalid',
          clientId: 'client-second',
          accessKeyId: 'test-next-access-key-id',
          secretAccessKey: 'test-next-secret-access-key',
          sessionToken: 'test-next-session-token',
        },
      },
    );
  });

  test('holds the delay at the injected floor when the vendor expiry cannot be read as a date', async (t) => {
    // arrange
    const unreadable = { ...credentialsAt(START_TIME + ONE_HOUR_MS) };
    unreadable.credentials = { ...unreadable.credentials, Expiration: 'whenever' };
    const { runtime, calls, advance } = harness(t, { credentials: [() => Promise.resolve(unreadable)], minRotationDelayMs: SHORT_ROTATION_FLOOR_MS });
    await runtime.start();
    await settle();

    // act
    await advance(SHORT_ROTATION_FLOOR_MS);

    // assert
    assert.strictEqual(calls.filter((call) => call === 'credentials').length, 2);
  });

  test('SYNC-04 gives the shadow client a reconnect policy the runtime own retry has not advanced', async (t) => {
    // arrange
    const { runtime, shadows, advance } = harness(t, { shadow: [false, true] });
    await runtime.start();
    await settle();

    // act
    await advance(500);

    // assert
    assert.deepStrictEqual({ connections: shadows.length, shadowAttempt: shadows[0]?.options.retry.attempt }, { connections: 1, shadowAttempt: 0 });
  });
});

describe('the poll backstop', () => {
  test('SYNC-03 reconciles every device again at the configured interval', async (t) => {
    // arrange
    const { runtime, store, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([{ ...geminiDevice(), data: { water_level: 3 } }])],
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID)?.data, { water_level: 3 });
  });

  test('D-014 leaves every stored snapshot unchanged when a poll rejects', async (t) => {
    // arrange
    const { runtime, store, advance } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
      ],
    });
    await runtime.start();
    await settle();
    const beforePoll: DeviceSnapshot | undefined = store.snapshot(DEVICE_ID);

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), beforePoll);
  });

  test('leaves connectivity alone when a poll rejects, because a failed request is not a device report', async (t) => {
    // arrange
    const { runtime, store, advance } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
      ],
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID)?.connectivity, { connected: true, timestamp: DEVICE_TIME });
  });

  test('schedules the next poll after one that rejects', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
        () => Promise.resolve([geminiDevice()]),
      ],
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.strictEqual(calls.filter((call) => call === 'devices').length, 3);
  });

  test('SYNC-05 reports no failure when a shutdown aborts a poll that is in flight', async (t) => {
    // arrange
    const { runtime, logged, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), (signal: AbortSignal) => hangingUntilAborted(signal)],
    });
    await runtime.start();
    await settle();
    await advance(POLL_INTERVAL_MS);

    // act
    await runtime.stop();
    await settle();

    // assert
    assert.deepStrictEqual({ warnings: countOf(logged, 'warn'), errors: countOf(logged, 'error') }, { warnings: 0, errors: 0 });
  });

  test('SYNC-02 keeps the telemetry and metadata a later poll would overwrite while the shadow owns them', async (t) => {
    // arrange
    const { runtime, shadows, store, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([{ ...geminiDevice(), data: { water_level: 4 } }])],
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 2 }, state: { firmware: 'v9' }, version: 7 });

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      { data: store.snapshot(DEVICE_ID)?.data, metadata: store.snapshot(DEVICE_ID)?.metadata, shadowVersion: store.snapshot(DEVICE_ID)?.shadowVersion },
      { data: { water_level: 2, primary_pump_running: false, ac_power: true }, metadata: { firmware: 'v9' }, shadowVersion: 7 },
    );
  });

  // The poll is the reconciliation backstop, and a shadow that has stopped
  // speaking is no longer feeding the store, so the poll takes telemetry back
  // and the flood it found reaches the tile (D-13, RES-03).
  //
  // The two advances are the assertion. `POLL_INTERVAL_MS` is 900 000 and the
  // silence window is 1 796 000, so the first advance is one missed heartbeat
  // and the second crosses into silence: the second poll is the *first* one that
  // observes it. Asserting there is what makes this case fail if the handover
  // arrives a poll later than it must, which `pollIntervalSeconds` lets be an
  // hour. The Cucumber tier cannot see that delay: it runs a 50 ms poll interval
  // against a 5000 ms step deadline, so a one-poll delay hides inside it.
  test('D-13 reports the flood a poll found on a device whose live path went quiet', async (t) => {
    // arrange
    const floodedDevice = { ...geminiDevice(), data: { ...geminiDevice().data, water_level: PROVISIONAL_FLOOD_WATER_LEVEL_CODE } };
    const { runtime, shadows, store, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([geminiDevice()]), () => Promise.resolve([floodedDevice])],
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: 5 });

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.strictEqual(store.snapshot(DEVICE_ID)?.data.water_level, PROVISIONAL_FLOOD_WATER_LEVEL_CODE);
  });

  // A report of device metadata delivered no reading, so it cannot take the
  // readings back from the poll. The runtime is where the two halves of that
  // meet, and the review's reproduction was at this seam: the same message
  // stamps the arrival, so the silence rule goes quiet and nothing else would
  // hand telemetry back. A guard reading the wider observation test leaves the
  // owner a tile that reads normal over a level no transport delivered
  // (CR-03, SYNC-02).
  test('D-13 leaves the poll owning telemetry through a live message that reports only device metadata', async (t) => {
    // arrange
    const floodedDevice = { ...geminiDevice(), data: { ...geminiDevice().data, water_level: PROVISIONAL_FLOOD_WATER_LEVEL_CODE } };
    const { runtime, shadows, store, advance } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([floodedDevice]),
      ],
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: 5 });
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // act
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: undefined, state: { mcu_firmware_version: '1.4.2' }, version: 6 });
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      {
        waterLevel: store.snapshot(DEVICE_ID)?.data.water_level,
        metadata: store.snapshot(DEVICE_ID)?.metadata,
        shadowVersion: store.snapshot(DEVICE_ID)?.shadowVersion,
      },
      { waterLevel: PROVISIONAL_FLOOD_WATER_LEVEL_CODE, metadata: { mcu_firmware_version: '1.4.2' }, shadowVersion: undefined },
    );
  });

  // Roughly fifteen minutes of quiet is ordinary, so one missed heartbeat is
  // evidence of nothing and the shadow still owns telemetry. A pump run the
  // live path reported is not erased by a poll that happens to arrive during
  // it (SYNC-02, D-05).
  test('D-13 keeps a pump run the live path reported when a poll arrives inside the two-heartbeat window', async (t) => {
    // arrange
    const stoppedPump = { ...geminiDevice(), data: { ...geminiDevice().data, primary_pump_running: false } };
    const { runtime, shadows, store, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([stoppedPump])],
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: 5 });

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.strictEqual(store.snapshot(DEVICE_ID)?.data.primary_pump_running, true);
  });

  // A REST degradation is not silence. `recordPollSuccess` runs after
  // `await applyDevices(...)`, so on the poll that recovers, the failure run is
  // still counted: a handover keyed on the REST degradation would fire on
  // exactly the poll where doing so is wrong, and the recovering poll's older
  // body would erase what the live path is still delivering (D-04, SYNC-02).
  //
  // The poll interval here is far below the silence window, so several polls
  // run without the window opening under them.
  test('D-13 keeps live telemetry through a poll that recovers from a REST degradation', async (t) => {
    // arrange
    const failing = (): Promise<ApiDevice[]> => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'));
    const stoppedPump = { ...geminiDevice(), data: { ...geminiDevice().data, primary_pump_running: false } };
    const { runtime, shadows, store, advance } = harness(t, {
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
      devices: [() => Promise.resolve([geminiDevice()]), failing, failing, () => Promise.resolve([stoppedPump])],
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: 5 });

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.strictEqual(store.snapshot(DEVICE_ID)?.data.primary_pump_running, true);
  });

  // Ownership returns through the patch path that already exists: the arriving
  // document stamps the message, so the next poll performs no handover, and it
  // re-establishes the watermark on its way through `applyReportedPatch`. Once
  // the live path speaks again, a pump run it reports is not erased by the next
  // poll's older body (SYNC-03, D-13).
  test('D-13 lets the live path own telemetry again on the first message that carries an observation', async (t) => {
    // arrange
    const stoppedPump = { ...geminiDevice(), data: { ...geminiDevice().data, primary_pump_running: false } };
    const { runtime, shadows, store, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([geminiDevice()]), () => Promise.resolve([stoppedPump])],
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { primary_pump_running: false }, state: undefined, version: 5 });
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // act
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: 6 });
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      { pumpRunning: store.snapshot(DEVICE_ID)?.data.primary_pump_running, shadowVersion: store.snapshot(DEVICE_ID)?.shadowVersion },
      { pumpRunning: true, shadowVersion: 6 },
    );
  });

  test('D-15 lets the poll write telemetry again once the shadow connection is gone', async (t) => {
    // arrange
    const { runtime, shadows, store, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([{ ...geminiDevice(), data: { water_level: 4 } }])],
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 2 }, state: undefined, version: 7 });

    // act
    shadows[0]?.options.onDisconnected('transport-closed');
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID)?.data, { water_level: 4 });
  });

  // The handover is a fact about one controller. A pump whose live path is
  // working keeps the level its own heartbeat delivered instead of having every
  // poll of the silence next door write the vendor's older body over it, which
  // is what an owner with two basements would otherwise lose (WR-05, SYNC-03).
  //
  // The two advances are what put the two pumps on different clocks:
  // `POLL_INTERVAL_MS` is 900 000 against a 1 796 000 silence window, so the
  // heartbeat sent after the first advance leaves the second pump one missed
  // heartbeat old while the first is two.
  test('D-13 hands only the quiet pump back to the poll and leaves its neighbour owning its telemetry', async (t) => {
    // arrange
    const { runtime, shadows, store, advance } = harness(t, {
      devices: [() => Promise.resolve(bothDevicesAt(1)), () => Promise.resolve(bothDevicesAt(1)), () => Promise.resolve(bothDevicesAt(7))],
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: 5 });
    shadows[0]?.options.onReportedPatch(OTHER_DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: 6 });

    // act
    await advance(POLL_INTERVAL_MS);
    shadows[0]?.options.onReportedPatch(OTHER_DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: 7 });
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      {
        quiet: store.snapshot(DEVICE_ID)?.data.water_level,
        quietVersion: store.snapshot(DEVICE_ID)?.shadowVersion,
        healthy: store.snapshot(OTHER_DEVICE_ID)?.data.water_level,
        healthyVersion: store.snapshot(OTHER_DEVICE_ID)?.shadowVersion,
      },
      { quiet: 7, quietVersion: undefined, healthy: 3, healthyVersion: 7 },
    );
  });

  // A connection that ended took every device's live path with it, so this
  // handover really is fleet-wide -- unlike the silence one above, which names
  // the controller that stopped speaking (D-15, SYNC-03).
  test('D-15 hands every pump back to the poll when the connection that carried them all ends', async (t) => {
    // arrange
    const { runtime, shadows, store, advance } = harness(t, {
      devices: [() => Promise.resolve(bothDevicesAt(1)), () => Promise.resolve(bothDevicesAt(7))],
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: 5 });
    shadows[0]?.options.onReportedPatch(OTHER_DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: 6 });

    // act
    shadows[0]?.options.onDisconnected('transport-closed');
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      { first: store.snapshot(DEVICE_ID)?.data.water_level, second: store.snapshot(OTHER_DEVICE_ID)?.data.water_level },
      { first: 7, second: 7 },
    );
  });

  test('SYNC-03 lets a shadow document that arrives after a poll win on the keys it carries', async (t) => {
    // arrange
    const { runtime, shadows, store, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([{ ...geminiDevice(), data: { water_level: 4, ac_power: true } }])],
    });
    await runtime.start();
    await settle();
    await advance(POLL_INTERVAL_MS);

    // act
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 5 }, state: undefined, version: 1 });

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID)?.data, { water_level: 5, ac_power: true });
  });
});

describe('stop', () => {
  test('SYNC-05 resolves both calls and closes the connection once when stop is called twice', async (t) => {
    // arrange
    const { runtime, shadows } = harness(t);
    await runtime.start();
    await settle();

    // act
    await runtime.stop();
    await runtime.stop();

    // assert
    assert.strictEqual(shadows[0]?.closes(), 1);
  });

  test('SYNC-05 resolves after a start that stopped at authentication', async (t) => {
    // arrange
    const { runtime } = harness(t, {
      devices: [() => Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'))],
    });
    await runtime.start();
    await settle();

    // act & assert
    await assert.doesNotReject(() => runtime.stop());
  });

  test('SYNC-05 resolves after a start that failed at discovery', async (t) => {
    // arrange
    const { runtime } = harness(t, {
      devices: [() => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'))],
    });
    await runtime.start();
    await settle();

    // act & assert
    await assert.doesNotReject(() => runtime.stop());
  });

  test('SYNC-05 resolves when nothing was ever started', async (t) => {
    // arrange
    const { runtime } = harness(t);

    // act & assert
    await assert.doesNotReject(() => runtime.stop());
  });

  test('SYNC-05 cancels a pending retry wait so the attempt it was waiting for never runs', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, { shadow: [false] });
    await runtime.start();
    await settle();
    const attemptsBeforeStop = calls.filter((call) => call === 'shadow').length;

    // act
    await runtime.stop();
    await advance(MAX_BACKOFF_MS);

    // assert
    assert.deepStrictEqual(
      { attemptsBeforeStop, attemptsAfterStop: calls.filter((call) => call === 'shadow').length },
      { attemptsBeforeStop: 1, attemptsAfterStop: 1 },
    );
  });

  test('SYNC-05 closes a shadow connection whose start resolved only after the shutdown began', async (t) => {
    // arrange
    // The shutdown lands after the connection is open and before the runtime
    // has recorded it, which is the window where nothing would close it.
    const stopped = { runtime: undefined as AccountRuntime | undefined };
    const { runtime, shadows } = harness(t, { whileShadowStarts: () => stopped.runtime?.stop() ?? Promise.resolve() });
    stopped.runtime = runtime;

    // act
    await runtime.start();
    await settle();

    // assert
    assert.strictEqual(shadows[0]?.closes(), 1);
  });

  test('SYNC-05 raises nothing when the connection opened during a shutdown cannot be closed', async (t) => {
    // arrange
    const stopped = { runtime: undefined as AccountRuntime | undefined };
    const { runtime } = harness(t, { closeFails: true, whileShadowStarts: () => stopped.runtime?.stop() ?? Promise.resolve() });
    stopped.runtime = runtime;

    // act & assert
    await assert.doesNotReject(async () => {
      await runtime.start();
      await settle();
    });
  });

  test('SYNC-05 schedules nothing and reports no failure when a shutdown aborts the launch', async (t) => {
    // arrange
    const { runtime, logged, calls } = harness(t, { devices: [hangingUntilAborted] });
    const starting = runtime.start();
    await settle();

    // act
    await runtime.stop();
    await starting;
    await settle();

    // assert
    assert.deepStrictEqual({ calls, warnings: logged.filter((line) => line.startsWith('warn ')) }, { calls: ['devices'], warnings: [] });
  });

  test('SYNC-05 reports monitoring unavailable once the runtime has stopped', async (t) => {
    // arrange
    const { runtime } = harness(t);
    await runtime.start();
    await settle();
    const beforeStop = runtime.monitoringPath;

    // act
    await runtime.stop();

    // assert
    assert.deepStrictEqual({ beforeStop, afterStop: runtime.monitoringPath }, { beforeStop: 'shadow-and-poll', afterStop: 'unavailable' });
  });

  test('SYNC-05 records no failure when a shutdown aborts a poll already in flight', async (t) => {
    // arrange
    const { runtime, logged, advance } = harness(t, { devices: [() => Promise.resolve([geminiDevice()]), hangingUntilAborted] });
    await runtime.start();
    await settle();
    await advance(POLL_INTERVAL_MS);

    // act
    await runtime.stop();
    await settle();

    // assert
    assert.deepStrictEqual(
      logged.filter((line) => line.startsWith('warn ')),
      [],
    );
  });

  // The tier that decides whether a press may leave the plugin reads this fact from the runtime, and
  // holds whatever the last poll left until something else arrives. A tier still reporting a ready
  // transport against a runtime that has aborted every request sends a press into a route that
  // answers a vendor error -- a HomeKit failure naming the vendor for a refusal that was entirely
  // local (RES-04, D-07).
  //
  // The two degradation members are asserted unchanged in the same breath. Homebridge restarts
  // routinely, and a shutdown that withdrew value trust would mark a whole home of tiles for a
  // condition that is over the moment the process ends (D-014, D-01).
  test('RES-04 pushes an unready command transport, and withdraws no scope, when the runtime stops', async (t) => {
    // arrange
    const { runtime, monitoringHealth } = harness(t);
    await runtime.start();
    await settle();
    const beforeStop = [...monitoringHealth];

    // act
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { beforeStop, afterStop: monitoringHealth },
      {
        beforeStop: [{ restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false }],
        afterStop: [
          { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
          { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: false },
        ],
      },
    );
  });

  test('SYNC-05 pushes once when a shutdown runs twice, because the second call returns before anything else', async (t) => {
    // arrange
    const { runtime, monitoringHealth } = harness(t);
    await runtime.start();
    await settle();
    const beforeStop = monitoringHealth.length;

    // act
    await runtime.stop();
    await runtime.stop();

    // assert
    assert.deepStrictEqual({ beforeStop, afterStop: monitoringHealth.length }, { beforeStop: 1, afterStop: 2 });
  });

  // A runtime nothing ever started has no poll behind it, so its transport was never ready and the
  // push says so. The rule stays one-sided: the tier learns the transport is gone from the runtime
  // saying so, never by inferring it from a report that did not arrive.
  test('pushes the unready transport when a runtime that never started stops', async (t) => {
    // arrange
    const { runtime, monitoringHealth } = harness(t);

    // act
    await runtime.stop();

    // assert
    assert.deepStrictEqual(monitoringHealth, [
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: false },
    ]);
  });

  test('SYNC-05 arms no timer that outlives it', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t);
    await runtime.start();
    await settle();
    const callsBeforeStop = calls.length;

    // act
    await runtime.stop();
    await advance(ONE_HOUR_MS);

    // assert
    assert.deepStrictEqual({ callsBeforeStop, callsAfterStop: calls.length }, { callsBeforeStop: 3, callsAfterStop: 3 });
  });
});

describe('the degraded monitoring path', () => {
  test('reports monitoring unavailable before anything has succeeded', (t) => {
    // arrange
    const { runtime } = harness(t);

    // act & assert
    assert.strictEqual(runtime.monitoringPath, 'unavailable');
  });

  test('reports monitoring unavailable while the poll is failing and the shadow is down, and the polling-only path once a poll succeeds', async (t) => {
    // arrange
    const { runtime, advance } = harness(t, {
      devices: [
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
        () => Promise.resolve([geminiDevice()]),
      ],
      shadow: [false],
    });
    await runtime.start();
    await settle();
    const whileFailing = runtime.monitoringPath;

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ whileFailing, afterRecovery: runtime.monitoringPath }, { whileFailing: 'unavailable', afterRecovery: 'poll-only' });
  });

  test('D-13 reports monitoring unavailable and records the stop when the vendor refuses the account credentials', async (t) => {
    // arrange
    const { runtime, logged } = harness(t, {
      devices: [() => Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'))],
    });

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(
      { path: runtime.monitoringPath, warnings: logged.filter((line) => line.startsWith('warn ')) },
      { path: 'unavailable', warnings: [`warn ${STOPPED_LINE}`] },
    );
  });

  test('D-13 reports monitoring unavailable and records the stop when authentication has halted', async (t) => {
    // arrange
    const { runtime, logged } = harness(t, {
      devices: [() => Promise.reject(new AuthHaltedError('authentication has stopped.', 'invalid_grant'))],
    });

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(
      { path: runtime.monitoringPath, warnings: logged.filter((line) => line.startsWith('warn ')) },
      { path: 'unavailable', warnings: [`warn ${STOPPED_LINE}`] },
    );
  });

  test('D-22 recovers the combined path after a throttled answer rather than claiming the runtime stopped for good', async (t) => {
    // arrange
    const { runtime, logged, advance } = harness(t, {
      devices: [() => Promise.reject(new AuthThrottledError('the vendor answered HTTP 429.', THROTTLE_RETRY_MS)), () => Promise.resolve([geminiDevice()])],
    });
    await runtime.start();
    await settle();
    const whileWaiting = runtime.monitoringPath;

    // act
    await advance(THROTTLE_RETRY_MS);

    // assert
    assert.deepStrictEqual(
      { whileWaiting, afterRetry: runtime.monitoringPath, stops: logged.filter((line) => line.endsWith(STOPPED_LINE)) },
      { whileWaiting: 'unavailable', afterRetry: 'shadow-and-poll', stops: [] },
    );
  });

  test('D-15 stays up on the polling-only path when the shadow connection fails', async (t) => {
    // arrange
    const { runtime, advance } = harness(t, { shadow: [false] });

    // act
    await runtime.start();
    await advance(0);

    // assert
    assert.strictEqual(runtime.monitoringPath, 'poll-only');
  });

  test('D-15 reports the degraded path once across three failed shadow attempts', async (t) => {
    // arrange
    const { runtime, logged, calls, advance } = harness(t, { shadow: [false] });
    await runtime.start();
    await settle();

    // act
    await advance(500);
    await advance(1_000);

    // assert
    assert.deepStrictEqual({ attempts: calls.filter((call) => call === 'shadow').length, warnings: countOf(logged, 'warn') }, { attempts: 3, warnings: 1 });
  });

  test('D-15 leaves a pending retry chain to reconnect rather than attempting again from every poll', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, { shadow: [false], pollIntervalMs: 100 });
    await runtime.start();
    await settle();
    const attemptsBeforePoll = calls.filter((call) => call === 'shadow').length;

    // act
    await advance(100);

    // assert
    assert.deepStrictEqual(
      { attemptsBeforePoll, polls: calls.filter((call) => call === 'devices').length, attemptsAfterPoll: calls.filter((call) => call === 'shadow').length },
      { attemptsBeforePoll: 1, polls: 2, attemptsAfterPoll: 1 },
    );
  });

  test('D-15 restores the combined path and announces the recovery once when a later attempt succeeds', async (t) => {
    // arrange
    const { runtime, logged, advance } = harness(t, { shadow: [false, true] });
    await runtime.start();
    await settle();

    // act
    await advance(500);

    // assert
    assert.deepStrictEqual(
      { path: runtime.monitoringPath, recoveries: logged.filter((line) => line.endsWith('recovered.')) },
      { path: 'shadow-and-poll', recoveries: ['info The shadow connection recovered.'] },
    );
  });

  test('reads as the combined path once the shadow connection reports itself up', async (t) => {
    // arrange
    const { runtime } = harness(t);

    // act
    await runtime.start();
    await settle();

    // assert
    assert.strictEqual(runtime.monitoringPath, 'shadow-and-poll');
  });

  test('falls back to the polling-only path without reporting a fault when the connection closes', async (t) => {
    // arrange
    const { runtime, shadows, logged } = harness(t);
    await runtime.start();
    await settle();

    // act
    shadows[0]?.options.onDisconnected('transport-closed');

    // assert
    assert.deepStrictEqual({ path: runtime.monitoringPath, warnings: countOf(logged, 'warn') }, { path: 'poll-only', warnings: 0 });
  });

  test('SYNC-04 reports no fault for the daily reconnect the provider connection ceiling forces', async (t) => {
    // arrange
    const { runtime, shadows, logged } = harness(t);
    await runtime.start();
    await settle();

    // act
    shadows[0]?.options.onDisconnected('transport-closed');
    shadows[0]?.options.onConnected();

    // assert
    assert.deepStrictEqual({ path: runtime.monitoringPath, reports: logged.slice(1) }, { path: 'shadow-and-poll', reports: [] });
  });

  test('D-15 reports the degraded path once while the connection keeps failing', async (t) => {
    // arrange
    const { runtime, shadows, logged } = harness(t);
    await runtime.start();
    await settle();

    // act
    shadows[0]?.options.onDisconnected('transport-error');
    shadows[0]?.options.onDisconnected('transport-error');
    shadows[0]?.options.onDisconnected('transport-error');

    // assert
    assert.deepStrictEqual(
      { path: runtime.monitoringPath, warnings: logged.filter((line) => line.startsWith('warn ')) },
      { path: 'poll-only', warnings: [`warn ${DEGRADED_LINE}`] },
    );
  });

  test('D-15 reports the degraded path when the broker refuses the subscription', async (t) => {
    // arrange
    const { runtime, shadows, logged } = harness(t);
    await runtime.start();
    await settle();

    // act
    shadows[0]?.options.onDisconnected('subscription-refused');

    // assert
    assert.deepStrictEqual(
      { path: runtime.monitoringPath, warnings: logged.filter((line) => line.startsWith('warn ')) },
      { path: 'poll-only', warnings: [`warn ${DEGRADED_LINE}`] },
    );
  });

  for (const reason of ['transport-closed', 'transport-error', 'subscription-refused', 'handshake-refused'] as const) {
    test(`SYNC-03 hands telemetry back to the poll when the connection reports ${reason}`, async (t) => {
      // arrange
      const { runtime, shadows, store } = harness(t);
      await runtime.start();
      await settle();
      store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7 }, state: undefined, version: 90 });

      // act
      shadows[0]?.options.onDisconnected(reason);

      // assert
      assert.strictEqual(store.snapshot(DEVICE_ID)?.shadowVersion, undefined);
    });
  }

  test('SYNC-05 closes the shadow connection when the runtime stops', async (t) => {
    // arrange
    const { runtime, shadows } = harness(t);
    await runtime.start();
    await settle();

    // act
    await runtime.stop();

    // assert
    assert.strictEqual(shadows[0]?.closes(), 1);
  });

  test('SYNC-05 resolves stop when the shadow connection cannot be closed', async (t) => {
    // arrange
    const { runtime } = harness(t, { closeFails: true });
    await runtime.start();
    await settle();

    // act & assert
    await assert.doesNotReject(() => runtime.stop());
  });

  test('opens no shadow connection while discovery has returned no device', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      devices: [() => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'))],
    });

    // act
    await runtime.start();
    await advance(0);

    // assert
    assert.deepStrictEqual(
      calls.filter((call) => call === 'shadow'),
      [],
    );
  });

  test('reports the polling path degraded on the second consecutive failure and trusted again on the next success', async (t) => {
    // arrange
    const failing = (): Promise<readonly ApiDevice[]> => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'));
    const { runtime, monitoringHealth, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), failing, failing, () => Promise.resolve([geminiDevice()])],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
    });
    await runtime.start();

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      monitoringHealth.map((trust) => trust.restDegraded),
      [false, false, true, false],
    );
  });

  // The two thresholds answer different questions, and this is the case that separates them. One
  // failed poll must not withdraw trust in a displayed value -- the REST threshold is two, so a blip
  // cannot flap a tile -- but it is enough to say the plugin has no proven way to reach the vendor,
  // because sending into a route that has just failed buys a round trip ending as a vendor error,
  // which is the blur the per-cause status table exists to prevent (RES-04, D-07).
  test('reports the command transport unready after a single failed poll, with neither degradation field moved', async (t) => {
    // arrange
    const failing = (): Promise<readonly ApiDevice[]> => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'));
    const { runtime, monitoringHealth, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), failing, () => Promise.resolve([geminiDevice()])],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
    });
    await runtime.start();

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(monitoringHealth, [
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: false },
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
    ]);
  });

  // The one failure this project treats as final. Nothing polls, refreshes, or connects after it, so
  // without a push from that branch the accessory tier would go on answering with whatever the last
  // poll left and would send a press into a runtime that has stopped trying (D-13, D-07).
  //
  // The recorded call list is the second half of the claim: a retry would extend the vendor's
  // thirty-day block rather than merely fail, so an empty tail is the behaviour rather than an
  // absence of interest (D-10).
  test('D-13 pushes a rejected credential and an unready command transport, and never reaches the vendor again', async (t) => {
    // arrange
    const { runtime, monitoringHealth, calls, advance } = harness(t, {
      devices: [() => Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'))],
    });

    // act
    await runtime.start();
    await settle();
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      { monitoringHealth, calls },
      {
        monitoringHealth: [{ restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: true }],
        calls: ['devices'],
      },
    );
  });

  // The refusal an owner actually meets. A password changed at the vendor, or a block the vendor
  // applies to the account, arrives long after the launch that succeeded. Until this branch existed
  // it reached only the generic poll failure: no service went unreadable, and the log named device
  // discovery, which is not what happened (CR-03, D-10, D-03).
  //
  // Every credential case above answers the refusal on the first inventory call, which is the launch
  // path. This one answers a healthy inventory first, so it examines the path a restart never takes.
  test('D-13 pushes a rejected credential and records the authentication stop for a refusal that follows a healthy start', async (t) => {
    // arrange
    const { runtime, monitoringHealth, logged, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
    });
    await runtime.start();
    await settle();

    // act
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      {
        pushed: monitoringHealth.at(-1),
        stops: logged.filter((line) => line.endsWith(STOPPED_LINE)),
        discoveryFailures: logged.filter((line) => line.endsWith(DISCOVERY_FAILED_UNEXPLAINED_LINE)),
      },
      {
        pushed: { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: true },
        stops: [`warn ${STOPPED_LINE}`],
        discoveryFailures: [],
      },
    );
  });

  // What makes the refusal a state rather than an act the runtime performed once. A socket left open
  // on a runtime that will never poll, refresh or connect again keeps delivering values, and an
  // ordinary value push clears the unreadable status the halt just stored, so the accessory goes back
  // to a fully vouched-for read for good. The close raises no disconnection, so the halt must record
  // no shadow degradation: an owner acts on the diagnostic, and a shadow line names a cause that did
  // not happen (D-10, D-13, SYNC-05).
  test('D-13 closes the live connection and opens no other for a refusal that follows a healthy start', async (t) => {
    // arrange
    const { runtime, shadows, calls, logged, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
    });
    await runtime.start();
    await settle();

    // act
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      {
        closes: shadows[0]?.closes(),
        clients: calls.filter((call) => call === 'shadow').length,
        shadowFailures: logged.filter((line) => line.endsWith(DEGRADED_LINE)),
      },
      { closes: 1, clients: 1, shadowFailures: [] },
    );
  });

  // The rotation loop meets the same refusal and used to swallow it into a rotation failure -- a line
  // promising another attempt, for the one failure that must never be attempted again (CR-03, D-10).
  test('D-13 pushes a rejected credential and records the authentication stop when a credential rotation is refused', async (t) => {
    // arrange
    const { runtime, monitoringHealth, logged, advance } = harness(t, {
      credentials: [() => Promise.resolve(credentialsAt(START_TIME + SHORT_CREDENTIAL_LIFETIME_MS)), refusingTheAccount],
      rotationLeadMs: SHORT_ROTATION_LEAD_MS,
      minRotationDelayMs: SHORT_ROTATION_FLOOR_MS,
    });
    await runtime.start();
    await settle();

    // act
    await advance(SHORT_CREDENTIAL_LIFETIME_MS);

    // assert
    assert.deepStrictEqual(
      {
        pushed: monitoringHealth.at(-1),
        stops: logged.filter((line) => line.endsWith(STOPPED_LINE)),
        rotationFailures: logged.filter((line) => line.endsWith(ROTATION_FAILED_LINE)),
      },
      {
        pushed: { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: true },
        stops: [`warn ${STOPPED_LINE}`],
        rotationFailures: [],
      },
    );
  });

  // The second half of the same claim, and the half a retry would make expensive: the vendor lifts a
  // brute-force block only thirty days after the last attempt. All three loops are running here --
  // the poll, the rotation, and the retry chain a refusing broker started -- so the empty hour after
  // the refusal is about every one of them (D-13, D-10).
  test('D-13 leaves the poll, the rotation and the shadow retry chain nothing to do once a mid-run refusal has halted it', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount],
      shadow: [false],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
    });
    await runtime.start();
    await settle();

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    const atTheRefusal = [...calls];
    await advance(ONE_HOUR_MS);

    // assert
    assert.deepStrictEqual(calls, atTheRefusal);
  });

  // Two loops can be in flight against a tenant that has already said no. The rotation wakes ten
  // milliseconds before the poll here, so both meet the refusal, and the owner must not be told twice
  // nor the accessory tier pushed twice (D-10).
  test('D-13 pushes the terminal trust once when the poll and the rotation meet the refusal together', async (t) => {
    // arrange
    const { runtime, monitoringHealth, logged, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount],
      credentials: [() => Promise.resolve(credentialsAt(START_TIME + SHORT_CREDENTIAL_LIFETIME_MS)), refusingTheAccount],
      rotationLeadMs: SHORT_ROTATION_LEAD_MS,
      minRotationDelayMs: SHORT_ROTATION_FLOOR_MS,
      pollIntervalMs: SHORT_CREDENTIAL_LIFETIME_MS,
    });
    await runtime.start();
    await settle();

    // act
    await advance(SHORT_CREDENTIAL_LIFETIME_MS);

    // assert
    assert.deepStrictEqual(
      {
        terminalPushes: monitoringHealth.filter((trust) => trust.credentialsRejected).length,
        stops: logged.filter((line) => line.endsWith(STOPPED_LINE)).length,
      },
      { terminalPushes: 1, stops: 1 },
    );
  });

  // Closing the connection at the halt is only half the answer, because the loop that halted is
  // rarely the only one in flight. The first credential grant is still travelling here, and it opens
  // the connection when it lands. A runtime that has stopped for good must not be holding an open
  // connection to the vendor: the socket would keep delivering values that overwrite the one
  // presentation an owner has to act on, and it is signed with credentials nothing will rotate again
  // (D-13, D-10, SYNC-05).
  test('D-13 opens no live connection for a credential grant that lands after a refusal has halted the runtime', async (t) => {
    // arrange
    // The placeholder only gives the binding a value before the executor runs, which it does in this
    // same statement; the grant below is always the promise's own resolver.
    let grantCredentials: (response: AwsCredentialsResponse) => void = () => undefined;
    const granted = new Promise<AwsCredentialsResponse>((resolve) => {
      grantCredentials = resolve;
    });
    const { runtime, calls, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount],
      credentials: [() => granted],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
    });
    await runtime.start();
    await settle();
    await advance(FAST_POLL_INTERVAL_MS);

    // act
    grantCredentials(credentialsAt(START_TIME + ONE_HOUR_MS));
    await settle();

    // assert
    assert.strictEqual(
      calls.filter((call) => call === 'shadow').length,
      0,
      'a halted runtime built a shadow client for a credential grant that landed after the refusal',
    );
  });

  // The other half of the same claim, one function later. The connection was already opening when the
  // poll met the refusal, so the halt found no client to close and the check after the start is what
  // is left. A runtime that kept this one would be holding a socket it will never use (D-13, SYNC-05).
  test('D-13 keeps no live connection that opened while a refusal was halting the runtime', async (t) => {
    // arrange
    const halting = { advance: undefined as ((ms: number) => Promise<void>) | undefined };
    const { runtime, shadows, calls, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
      whileShadowStarts: () => halting.advance?.(FAST_POLL_INTERVAL_MS) ?? Promise.resolve(),
    });
    halting.advance = advance;

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual({ closes: shadows[0]?.closes(), clients: calls.filter((call) => call === 'shadow').length }, { closes: 1, clients: 1 });
  });

  // The shutdown's own push is the runtime telling the tier the transport has gone, so it is named
  // here rather than counted with the poll reports. The poll a shutdown aborted still reports
  // nothing, which is what the two lists say: the second holds the shutdown push and nothing else
  // (SYNC-05, RES-04).
  test('reports nothing for a poll a shutdown aborted', async (t) => {
    // arrange
    const { runtime, monitoringHealth, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), hangingUntilAborted],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
    });
    await runtime.start();
    await advance(FAST_POLL_INTERVAL_MS);
    const beforeShutdown = [...monitoringHealth];

    // act
    await runtime.stop();
    await settle();

    // assert
    assert.deepStrictEqual(
      { beforeShutdown, afterShutdown: monitoringHealth },
      {
        beforeShutdown: [{ restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false }],
        afterShutdown: [
          { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
          { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: false },
        ],
      },
    );
  });

  test('reports the shadow silent once two heartbeats have passed with no message', async (t) => {
    // arrange
    const { runtime, monitoringByDevice, advance } = harness(t, { pollIntervalMs: HEARTBEAT_MS });
    await runtime.start();

    // act
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);

    // assert
    assert.deepStrictEqual(silenceOf(monitoringByDevice), [false, false, true]);
  });

  test('reports the silent live connection once across three silent polls inside one reminder interval', async (t) => {
    // arrange
    const { runtime, logged, advance } = harness(t, { pollIntervalMs: FAST_POLL_INTERVAL_MS });
    await runtime.start();
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      {
        warnings: countOfLine(logged, `warn ${liveReportingSilentLine(DEVICE_ID)}`),
        repeats: countOfLine(logged, `debug ${liveReportingSilentLine(DEVICE_ID)}`),
      },
      { warnings: 1, repeats: 2 },
    );
  });

  test('announces the live connection recovered once a message arrives after the silence', async (t) => {
    // arrange
    const { runtime, shadows, logged, advance } = harness(t, { pollIntervalMs: FAST_POLL_INTERVAL_MS });
    await runtime.start();
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      {
        warnings: countOfLine(logged, `warn ${liveReportingSilentLine(DEVICE_ID)}`),
        recovered: countOfLine(logged, `info ${liveReportingRecoveredLine(DEVICE_ID)}`),
      },
      { warnings: 1, recovered: 1 },
    );
  });

  // The scoped permission allows vendor deviceId in local logs, accessory context and persisted
  // arrival anchors. It rests on the unconfirmed assumption that the account-id segment is an opaque
  // key. The identifier tells a two-pump account which basement stopped being watched. Public and
  // planning artifacts use placeholders. Routes, headers and credentials stay out of this line
  // (AUTH-02, D-027, D-14).
  test('names the controller and no route, no header, and no credential in the line a silent live connection records', async (t) => {
    // arrange
    const { runtime, logged, registrations, advance } = harness(t, { pollIntervalMs: FAST_POLL_INTERVAL_MS });
    await runtime.start();

    // act
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // assert
    const reported = logged.filter((line) => line.includes('live connection')).join(' ');
    assert.deepStrictEqual(
      {
        reported: reported.length > 0,
        scheme: /https?:\/\//.test(reported),
        authorization: reported.toLowerCase().includes('authorization'),
        secret: registrations.some((registration) => reported.includes(registration.split(' ')[1] ?? '')),
        device: reported.includes(DEVICE_ID),
      },
      { reported: true, scheme: false, authorization: false, secret: false, device: true },
    );
  });

  test('reports the shadow trusted over the same span once a message reached the reported-patch callback', async (t) => {
    // arrange
    const { runtime, shadows, monitoringByDevice, advance } = harness(t, { pollIntervalMs: HEARTBEAT_MS });
    await runtime.start();
    await advance(HEARTBEAT_MS);

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    await advance(HEARTBEAT_MS);

    // assert
    assert.deepStrictEqual(silenceOf(monitoringByDevice), [false, false, false]);
  });

  // The recovery an owner waits on. Both arrival cases above advance the clock after the message,
  // which lets the poll tick that follows do the clearing, so neither can tell an arrival-driven
  // recovery from a poll-driven one -- and the configured poll interval accepts an hour. This one
  // moves nothing: the message is the only event between the silent report and the assertion, and
  // the recorded call list says no request left the plugin in between (CR-02, D-11).
  test('RES-03 restores the trust on the message that proves the live path is carrying, with no clock movement and no poll', async (t) => {
    // arrange
    const { runtime, shadows, monitoringByDevice, calls, advance } = harness(t, { pollIntervalMs: HEARTBEAT_MS });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);
    const atSilence = [...calls];

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual(
      { pushes: monitoringByDevice.map((byDevice) => byDevice.get(DEVICE_ID)), calls },
      {
        pushes: [
          { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false },
          { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false },
          { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
          { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false },
        ],
        calls: atSilence,
      },
    );
  });

  // The guard the report is made through. A healthy live path delivers a heartbeat roughly every
  // fifteen minutes and a busy one delivers many, so a report on every message would push a trust
  // fan-out across every accessory for no new information. The latch has already moved by the
  // second message, so it reports nothing (D-05).
  test('reports once per recovery rather than once per message when two messages arrive together', async (t) => {
    // arrange
    const { runtime, shadows, monitoringHealth, advance } = harness(t, { pollIntervalMs: HEARTBEAT_MS });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);
    const atSilence = monitoringHealth.length;

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    const afterFirstMessage = monitoringHealth.length;
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual(
      { atSilence, afterFirstMessage, afterSecondMessage: monitoringHealth.length },
      { atSilence: 3, afterFirstMessage: 4, afterSecondMessage: 4 },
    );
  });

  // The same guard on the ordinary case: a live path that is working. It costs one push per poll
  // and none per heartbeat, because a message that resolved nothing is not news (D-05).
  test('reports nothing when a message arrives on a live path it never reported silent', async (t) => {
    // arrange
    const { runtime, shadows, monitoringHealth } = harness(t, { pollIntervalMs: HEARTBEAT_MS });
    await runtime.start();
    await settle();
    const afterLaunch = monitoringHealth.length;

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual({ afterLaunch, afterTwoMessages: monitoringHealth.length }, { afterLaunch: 1, afterTwoMessages: 1 });
  });

  // The diagnostic half of the same recovery. The owner is told the live connection came back once,
  // at the message that proves it, with the clock standing still (D-03).
  test('announces the live connection recovered once at the arriving message, with no clock movement', async (t) => {
    // arrange
    const { runtime, shadows, logged, advance } = harness(t, { pollIntervalMs: HEARTBEAT_MS });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual(
      {
        warnings: countOfLine(logged, `warn ${liveReportingSilentLine(DEVICE_ID)}`),
        recovered: countOfLine(logged, `info ${liveReportingRecoveredLine(DEVICE_ID)}`),
      },
      { warnings: 1, recovered: 1 },
    );
  });

  // Why the report is driven from the arrival callback and not from a snapshot listener. The
  // canonical store notifies only when a telemetry value moved, so the heartbeat below reaches no
  // subscriber at all, and it is still direct evidence that the live path is carrying (D-05, D-11).
  test('clears the silence on a heartbeat carrying the values the store already holds, which notifies no subscriber', async (t) => {
    // arrange
    const { runtime, store, shadows, monitoringByDevice, advance } = harness(t, { pollIntervalMs: HEARTBEAT_MS });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);
    let notifications = 0;
    store.subscribe(DEVICE_ID, () => {
      notifications += 1;
    });

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual(
      { notifications, pushed: monitoringByDevice.at(-1)?.get(DEVICE_ID) },
      {
        notifications: 0,
        pushed: { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false },
      },
    );
  });

  // D-11's matching of clearing to cause, re-asserted against the arrival report. The arrival
  // changed which event clears the shadow cause, never which cause it clears: the successful poll
  // in the middle here still reports the silence unresolved, and the message after it clears it.
  test('D-11 leaves the shadow silence for the successful poll and clears it for the message that follows', async (t) => {
    // arrange
    const { runtime, shadows, monitoringByDevice, advance } = harness(t, { pollIntervalMs: HEARTBEAT_MS });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);

    // act
    await advance(HEARTBEAT_MS);
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual(silenceOf(monitoringByDevice), [false, false, true, true, false]);
  });

  // D-14. What the recovery latch being a set rather than a flag buys, stated as the two ways a flag
  // gets it wrong: the quiet pump's recovery is swallowed by its neighbour, or the neighbour's
  // heartbeat announces a recovery on the quiet pump's behalf. Both are the account-wide collapse of
  // a per-controller fact, arrived at through the arrival callback instead of through the projection.
  //
  // The neighbour's heartbeat must push nothing at all. That is the observation a single boolean
  // latch cannot survive: with the latch collapsed to "is any device silent", the back pump's
  // routine heartbeat drives a whole trust fan-out while the front pump is still quiet.
  //
  // Recorded limit (D-10): the vendor account has exactly one Gemini. The second pump here is
  // fabricated by this fixture and by nothing else, and no observation of two real systems informs
  // this case.
  test('D-14 lets a quiet pump recover on its own message while its heartbeating neighbour neither reports nor is reported for', async (t) => {
    // arrange
    const { runtime, shadows, logged, monitoringByDevice, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice(), otherGeminiDevice()])],
      pollIntervalMs: HEARTBEAT_MS,
    });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    // The back pump keeps speaking, so only the front pump reaches two missed heartbeats.
    shadowOptionsOf(shadows).onReportedPatch(OTHER_DEVICE_ID, heartbeatPatch());
    await advance(HEARTBEAT_MS);
    const atFrontPumpSilence = monitoringByDevice.length;

    // act
    shadowOptionsOf(shadows).onReportedPatch(OTHER_DEVICE_ID, heartbeatPatch());
    const afterNeighbourHeartbeat = monitoringByDevice.length;
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual(
      {
        frontPumpWarnings: countOfLine(logged, `warn ${liveReportingSilentLine(DEVICE_ID)}`),
        backPumpWarnings: countOfLine(logged, `warn ${liveReportingSilentLine(OTHER_DEVICE_ID)}`),
        recoveries: recoveriesIn(logged),
        afterNeighbourHeartbeat,
        afterFrontPumpSpoke: monitoringByDevice.length,
        finalSilence: [monitoringByDevice.at(-1)?.get(DEVICE_ID)?.shadowSilent, monitoringByDevice.at(-1)?.get(OTHER_DEVICE_ID)?.shadowSilent],
      },
      {
        frontPumpWarnings: 1,
        backPumpWarnings: 0,
        recoveries: [`info ${liveReportingRecoveredLine(DEVICE_ID)}`],
        afterNeighbourHeartbeat: atFrontPumpSilence,
        afterFrontPumpSpoke: atFrontPumpSilence + 1,
        finalSilence: [false, false],
      },
    );
  });

  // D-14. The other half: the failure log's rate limiting is per kind, so a per-device kind gives
  // each pump its own cadence with no change to the limiter.
  //
  // The two silences here begin one heartbeat apart, inside one reminder interval, which is what
  // makes the case discriminate. An account-wide kind would treat the back pump's first silence as a
  // repeat of the front pump's and log it at debug. The front pump's own repeat in the same poll is
  // asserted at debug for the same reason: it proves the reminder interval had not elapsed, so the
  // back pump's warning cannot be explained away as a reminder.
  //
  // Both figures are asserted rather than assumed. If a heartbeat ever grows past the reminder
  // cadence the two silences stop sharing an interval, and this case would go on passing while
  // proving nothing -- so the numbers are read back here and a change to either one has to be seen.
  //
  // Recorded limit (D-10): the second pump is this fixture's, not the vendor account's.
  test('D-14 gives each pump its own warning when two fall silent inside one reminder interval', async (t) => {
    // arrange
    const { runtime, shadows, logged, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice(), otherGeminiDevice()])],
      pollIntervalMs: HEARTBEAT_MS,
    });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    shadowOptionsOf(shadows).onReportedPatch(OTHER_DEVICE_ID, heartbeatPatch());

    // act
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);

    // assert
    assert.deepStrictEqual(
      {
        frontPumpWarnings: countOfLine(logged, `warn ${liveReportingSilentLine(DEVICE_ID)}`),
        frontPumpRepeats: countOfLine(logged, `debug ${liveReportingSilentLine(DEVICE_ID)}`),
        backPumpWarnings: countOfLine(logged, `warn ${liveReportingSilentLine(OTHER_DEVICE_ID)}`),
        gapBetweenSilencesMs: HEARTBEAT_MS,
        reminderIntervalMs: FAILURE_REMINDER_MS,
      },
      { frontPumpWarnings: 1, frontPumpRepeats: 1, backPumpWarnings: 1, gapBetweenSilencesMs: 898_000, reminderIntervalMs: 900_000 },
    );
  });

  test('opens the shadow connection once a later poll finds the account devices', async (t) => {
    // arrange
    const { runtime, calls, advance } = harness(t, {
      devices: [
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
        () => Promise.resolve([geminiDevice()]),
      ],
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.strictEqual(calls.filter((call) => call === 'shadow').length, 1);
  });
});

describe('DEV-05 removal reconciliation', () => {
  function devicesCallCount(calls: readonly string[]): number {
    return calls.filter((call) => call === 'devices').length;
  }

  test('makes no extra devices call and reports no removal while a tracked device stays present', async (t) => {
    // arrange
    const { runtime, calls, removed, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([geminiDevice()])],
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ devicesCalls: devicesCallCount(calls), removed }, { devicesCalls: 2, removed: [] });
  });

  test('never reports removal for a deviceId absent once between two present observations', async (t) => {
    // arrange
    const { runtime, calls, removed, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([]), () => Promise.resolve([geminiDevice()])],
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ devicesCalls: devicesCallCount(calls), removed }, { devicesCalls: 3, removed: [] });
  });

  test('makes exactly one final-check fetch per cycle and removes every deviceId still absent from it', async (t) => {
    // arrange
    const { runtime, calls, removed, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice(), otherGeminiDevice()]), () => Promise.resolve([]), () => Promise.resolve([]), () => Promise.resolve([])],
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      { devicesCalls: devicesCallCount(calls), removed: [...removed].sort() },
      { devicesCalls: 4, removed: [DEVICE_ID, OTHER_DEVICE_ID].sort() },
    );
  });

  test('does not remove a deviceId that reappears in the final-check fetch, and resets its absence count', async (t) => {
    // arrange
    const { runtime, calls, removed, advance } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([]),
        () => Promise.resolve([]),
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([]),
      ],
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ devicesCalls: devicesCallCount(calls), removed }, { devicesCalls: 5, removed: [] });
  });

  test('reports no removal when the final-check fetch itself fails, and retries the check on the next successful poll', async (t) => {
    // arrange
    const { runtime, calls, removed, logged, advance } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([]),
        () => Promise.resolve([]),
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
        () => Promise.resolve([]),
        () => Promise.resolve([]),
      ],
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      { removed, warnings: countOfLine(logged, `warn ${DISCOVERY_FAILED_LINE}`), errors: countOf(logged, 'error') },
      { removed: [], warnings: 0, errors: 0 },
    );

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ devicesCalls: devicesCallCount(calls), removed }, { devicesCalls: 6, removed: [DEVICE_ID] });
  });

  // A removal Homebridge refuses leaves an accessory published that this plugin has already
  // vouched for. Everything that could still distrust that accessory -- its arrival stamp, its
  // persisted anchor, its absence count -- therefore has to survive the refusal. Pruned ahead of
  // the removal, the tile goes on reading no leak and a normal pump for a system the account no
  // longer holds, nothing ever retries the removal, and nothing is said about any of it (D-014).
  test('keeps a pump whose removal was refused watched, distrusted and reported, and tries the removal again', async (t) => {
    // arrange
    const { runtime, store, logged, anchors, removed, monitoringByDevice, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([])],
      pollIntervalMs: TWO_MISSED_HEARTBEATS_MS,
      removalFails: true,
    });
    await runtime.start();
    await settle();
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // act
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // assert
    assert.deepStrictEqual(
      {
        attempts: [...removed],
        stillStored: store.snapshot(DEVICE_ID) !== undefined,
        keepsItsAnchor: anchors.stored.has(DEVICE_ID),
        silence: silenceOf(monitoringByDevice).at(-1),
        warnings: countOfLine(logged, `warn ${removalRefusedLine(DEVICE_ID)}`),
      },
      { attempts: [DEVICE_ID], stillStored: true, keepsItsAnchor: true, silence: true, warnings: 1 },
    );

    // act
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // assert
    assert.deepStrictEqual([...removed], [DEVICE_ID, DEVICE_ID]);
  });

  // A refused removal strands an accessory this plugin has already vouched for, so the first one
  // is said the moment it happens rather than held back by the cadence its repeats are subject to.
  test('reports a refused removal as soon as the removal is refused', async (t) => {
    // arrange
    const { runtime, logged, removed, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([])],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
      removalFails: true,
    });
    await runtime.start();
    await settle();
    await advance(FAST_POLL_INTERVAL_MS);

    // act
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      { attempts: [...removed], warnings: countOfLine(logged, `warn ${removalRefusedLine(DEVICE_ID)}`) },
      { attempts: [DEVICE_ID], warnings: 1 },
    );
  });

  // The documented refusal is a UUID another plugin had already bridged, which no poll clears, so
  // the removal is refused again for the life of the process. The attempt has to keep happening --
  // nothing else ever removes the accessory -- while the line does not: unlimited, it writes the
  // same sentence 288 times a day at the shortest interval the configuration allows (D-14).
  test('says nothing further about a pump refused again inside the reminder window, and still retries every poll', async (t) => {
    // arrange
    const { runtime, logged, removed, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([])],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
      removalFails: true,
    });
    await runtime.start();
    await settle();
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      {
        attempts: [...removed],
        warnings: countOfLine(logged, `warn ${removalRefusedLine(DEVICE_ID)}`),
        repeats: countOfLine(logged, `debug ${removalRefusedLine(DEVICE_ID)}`),
      },
      { attempts: [DEVICE_ID, DEVICE_ID, DEVICE_ID, DEVICE_ID], warnings: 1, repeats: 3 },
    );
  });

  // The kind is per device for the reason the live-reporting kind is: a pump refused all afternoon
  // must not hold back the first report about the pump beside it, whose accessory is stranded just
  // as badly. Both refusals land in the same poll at the same clock reading, so one shared kind
  // would send the second straight to debug (D-14).
  test('reports the refused removal of each pump, so one refusal does not silence another', async (t) => {
    // arrange
    const { runtime, logged, removed, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice(), otherGeminiDevice()]), () => Promise.resolve([])],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
      removalFails: true,
    });
    await runtime.start();
    await settle();
    await advance(FAST_POLL_INTERVAL_MS);

    // act
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      {
        attempts: [...removed].sort(),
        pump: countOfLine(logged, `warn ${removalRefusedLine(DEVICE_ID)}`),
        pumpBesideIt: countOfLine(logged, `warn ${removalRefusedLine(OTHER_DEVICE_ID)}`),
      },
      { attempts: [DEVICE_ID, OTHER_DEVICE_ID].sort(), pump: 1, pumpBesideIt: 1 },
    );
  });

  // D-14. The failure log rate-limits per kind, and a removed device's kind can never recover, so
  // nothing would ever delete it: the map holds an entry for the life of the process and the stale
  // entry follows the identifier back if the account re-adds it.
  //
  // The harm is observable at the re-add, which is why the case ends there rather than at the
  // removal. With the entry retained, the first healthy poll after the identifier returns reaches
  // the log's success path, which deletes the entry and announces a recovery -- for a system that
  // has been in the account for one poll and has never failed in it.
  test('drops the reporting kind of a removed pump, so the identifier coming back announces no recovery', async (t) => {
    // arrange
    const { runtime, logged, removed, advance } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([]),
        () => Promise.resolve([]),
        () => Promise.resolve([]),
        () => Promise.resolve([geminiDevice()]),
      ],
      pollIntervalMs: TWO_MISSED_HEARTBEATS_MS,
    });
    await runtime.start();
    // Two missed heartbeats, so the pump's live reporting is failing when it goes.
    await advance(TWO_MISSED_HEARTBEATS_MS);
    await advance(TWO_MISSED_HEARTBEATS_MS);
    const atRemoval = { removed: [...removed], recoveries: recoveriesIn(logged) };

    // act
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // assert
    assert.deepStrictEqual(
      {
        atRemoval,
        warnings: countOfLine(logged, `warn ${liveReportingSilentLine(DEVICE_ID)}`),
        recoveriesAfterTheIdentifierReturned: recoveriesIn(logged),
      },
      {
        atRemoval: { removed: [DEVICE_ID], recoveries: [] },
        warnings: 1,
        recoveriesAfterTheIdentifierReturned: [],
      },
    );
  });

  // The store lives for the life of the process and is written back to disk, so
  // an account whose systems come and go over months would otherwise accumulate
  // an anchor per system for good. It is dropped here, beside the arrival stamp
  // and the reporting kind, because these two confirming polls are what decide a
  // device is really gone (D-14).
  test('drops the arrival anchor of a removed pump, so the stored set cannot outgrow the account', async (t) => {
    // arrange
    const { runtime, anchors, removed, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([]), () => Promise.resolve([]), () => Promise.resolve([])],
    });
    await runtime.start();
    await settle();
    const whileItIsCarried = anchors.stored.has(DEVICE_ID);

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      { whileItIsCarried, afterRemoval: anchors.stored.has(DEVICE_ID), removed },
      { whileItIsCarried: true, afterRemoval: false, removed: [DEVICE_ID] },
    );
  });

  // The recovery latch does not need pruning here, and this is what says so. The shadow client stays
  // subscribed to a removed device's topics until the connection is rebuilt, so a queued message can
  // still arrive; it must push nothing, because there is no accessory left to push to.
  //
  // The latch is already empty by then for a structural reason rather than a dropped entry:
  // `reportMonitoringHealth` rebuilds it wholesale from the map it is about to push, and the removal
  // runs before the poll records its outcome, so the entry is gone by the end of the same poll. A
  // latch that accumulated instead of being rebuilt would fail this case.
  test('reports nothing for a message from a pump the account has already removed', async (t) => {
    // arrange
    const { runtime, shadows, monitoringByDevice, removed, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([]), () => Promise.resolve([]), () => Promise.resolve([])],
      pollIntervalMs: TWO_MISSED_HEARTBEATS_MS,
    });
    await runtime.start();
    await advance(TWO_MISSED_HEARTBEATS_MS);
    await advance(TWO_MISSED_HEARTBEATS_MS);
    const atRemoval = monitoringByDevice.length;

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual({ removed, pushes: monitoringByDevice.length }, { removed: [DEVICE_ID], pushes: atRemoval });
  });

  // A stray message can still arrive after removal for the structural reason the
  // sibling case above states: the shadow client stays subscribed until the
  // connection is rebuilt. It must not resurrect the arrival stamp the removal
  // branch already dropped from both the in-memory map and the persisted anchor
  // (D-14).
  test('does not re-arm the arrival anchor when a stray message arrives after a pump is removed', async (t) => {
    // arrange
    const { runtime, shadows, anchors, removed, advance } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([]), () => Promise.resolve([]), () => Promise.resolve([])],
      pollIntervalMs: TWO_MISSED_HEARTBEATS_MS,
    });
    await runtime.start();
    await advance(TWO_MISSED_HEARTBEATS_MS);
    await advance(TWO_MISSED_HEARTBEATS_MS);
    const atRemoval = { removed: [...removed], hasAnchor: anchors.stored.has(DEVICE_ID) };

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    // assert
    assert.deepStrictEqual(
      { atRemoval, afterStrayMessage: anchors.stored.has(DEVICE_ID) },
      { atRemoval: { removed: [DEVICE_ID], hasAnchor: false }, afterStrayMessage: false },
    );
  });
});

// Wires the real authentication client, REST client, and store behind the
// runtime, so only the network boundary is replaced. The token cache lands in
// this case's own storage directory, which is removed when the case ends.
async function endToEndRuntime(t: TestContext, logged: string[]): Promise<{ runtime: AccountRuntime; store: DeviceStateStore }> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-account-'));

  t.after(async () => {
    await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  const clock: Clock = { now: () => START_TIME };
  const monotonic: MonotonicClock = { now: () => MONOTONIC_START_TIME };
  const log = recordingLog(logged);
  const auth = createAuthClient({
    constants: testConstants,
    clientId: 'client-id-1',
    email: 'account@example.test',
    password: 'account-password',
    storagePath,
    requestTimeoutMs: 1_000,
    httpFetch: (input, init) => globalThis.fetch(input, init),
    clock,
    createSalt: () => 'salt-1',
    registerSecret: () => undefined,
    log,
  });
  const api = createCloudApi({ baseUrl: testConstants.apiUrl, auth, requestTimeoutMs: 1_000, httpFetch: (input, init) => globalThis.fetch(input, init) });
  const store = createDeviceStateStore({ clock, log });
  const runtime = createAccountRuntime({
    api,
    store,
    registry: createFamilyRegistry(),
    createShadow: (shadowOptions: ShadowRuntimeOptions): ShadowClient => fakeShadow(shadowOptions).client,
    createRetry: (signal: AbortSignal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log }),
    pollIntervalMs: POLL_INTERVAL_MS,
    rotationLeadMs: ROTATION_LEAD_MS,
    minRotationDelayMs: MIN_ROTATION_DELAY_MS,
    failures: createFailureLog({ clock, log, reminderIntervalMs: FAILURE_REMINDER_MS }),
    registerSecret: () => undefined,
    onTrustworthyInventory: () => undefined,
    onDeviceRemoved: () => undefined,
    onMonitoringHealth: () => undefined,
    clock,
    monotonic,
    anchors: createArrivalAnchors({ storagePath, log }),
    log,
  });

  // This case runs on real timers, so the poll and rotation timers must be
  // released or they would hold the runner open.
  t.after(async () => {
    await runtime.stop();
  });

  return { runtime, store };
}

// Answers the token request, the device request, and the credentials request.
function stubCloud(t: TestContext): { url: string; authorization: string | undefined }[] {
  const requests: { url: string; authorization: string | undefined }[] = [];

  t.mock.method(globalThis, 'fetch', (input: string | URL, init?: RequestInit) => {
    const url = input.toString();
    requests.push({ url, authorization: new Headers(init?.headers).get('authorization') ?? undefined });

    if (url.endsWith('/oauth/token')) {
      return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
    }

    if (url.endsWith('/credentials/aws')) {
      return Promise.resolve(new Response(JSON.stringify(credentialsAt(START_TIME + ONE_HOUR_MS)), { status: 200 }));
    }

    return Promise.resolve(new Response(JSON.stringify(geminiWireDeviceList()), { status: 200 }));
  });

  return requests;
}

function credentialRequestCount(requests: readonly { url: string }[]): number {
  return requests.filter((request) => request.url.endsWith('/credentials/aws')).length;
}

describe('commands', () => {
  test('sends the family wire body for a self-test to the device the caller names', async (t) => {
    // arrange
    const { runtime, commandRequests } = harness(t, { command: () => Promise.resolve({ success: true }) });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);

    // assert
    assert.deepStrictEqual(outcome, { accepted: true });
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { test_running: true }, aborted: false }]);
  });

  test('sends the family wire body for an alarm mute', async (t) => {
    // arrange
    const { runtime, commandRequests } = harness(t, { command: () => Promise.resolve({ success: true }) });
    await runtime.start();

    // act
    await runtime.commands.send(DEVICE_ID, 'alarm-mute', true);

    // assert
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { alarm_audio_muted: true }, aborted: false }]);
  });

  test('reports a vendor error when the route rejects, and sends nothing further', async (t) => {
    // arrange
    const { runtime, commandRequests } = harness(t, {
      command: () => Promise.reject(new CloudRequestError('PUT /devices/{deviceId}/data failed with HTTP 500.', 500, 'PUT /devices/{deviceId}/data')),
    });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'vendor-error' });
    assert.strictEqual(commandRequests.length, 1);
  });

  test('reports a vendor error for a resolved body the vendor refused', async (t) => {
    // arrange
    const { runtime } = harness(t, { command: () => Promise.resolve({ success: false }) });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'vendor-error' });
  });

  test('reports a timeout when the deadline aborted the attempt', async (t) => {
    // arrange
    const timedOut = new Error('The operation was aborted due to timeout');
    timedOut.name = 'TimeoutError';
    const { runtime, commandRequests } = harness(t, { command: () => Promise.reject(timedOut) });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'timed-out' });
    assert.strictEqual(commandRequests.length, 1);
  });

  test('sends nothing for a deviceId the store never held', async (t) => {
    // arrange
    const { runtime, commandRequests } = harness(t, { command: () => Promise.resolve({ success: true }) });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(OTHER_DEVICE_ID, 'self-test', true);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'vendor-error' });
    assert.deepStrictEqual(commandRequests, []);
  });

  test('sends nothing for a device whose family this version cannot drive', async (t) => {
    // arrange
    const { runtime, commandRequests } = harness(t, {
      command: () => Promise.resolve({ success: true }),
      devices: [() => Promise.resolve([{ ...geminiDevice(), deviceTypeId: 'wayneWaterHalo' }])],
    });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'vendor-error' });
    assert.deepStrictEqual(commandRequests, []);
  });

  test('passes the root signal, so a shutdown cancels an attempt in flight', async (t) => {
    // arrange
    const { runtime, commandRequests } = harness(t, { command: () => Promise.resolve({ success: true }) });
    await runtime.start();
    await runtime.stop();

    // act
    await runtime.commands.send(DEVICE_ID, 'self-test', true);

    // assert
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { test_running: true }, aborted: true }]);
  });
});

describe('createAccountRuntimeFromConfig', () => {
  test('builds every collaborator without opening a connection, reading a file, or starting a timer', async (t) => {
    // arrange
    const requestSpy = t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no request expected')));
    let sockets = 0;
    const connect: MqttConnect = () => {
      sockets += 1;

      throw new Error('no socket expected');
    };

    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    // act
    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: createRedactingLogger({ delegate: recordingLog([]), secrets: [] }),
      connect,
      httpFetch: (input, init) => globalThis.fetch(input, init),
      createSalt: () => 'salt-1',
    });

    // assert
    assert.deepStrictEqual({ path: runtime.monitoringPath, requests: requestSpy.mock.callCount(), sockets }, { path: 'unavailable', requests: 0, sockets: 0 });
  });

  test('AUTH-02 registers the bearer token and the temporary credentials with the redacting logger', async (t) => {
    // arrange
    const recorded: string[] = [];
    const log = createRedactingLogger({ delegate: recordingLog(recorded), secrets: [] });
    stubCloud(t);
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log,
      connect: () => {
        throw new Error('no socket expected');
      },
      httpFetch: (input, init) => globalThis.fetch(input, init),
      createSalt: () => 'salt-1',
    });
    await runtime.start();
    await settle();
    await runtime.stop();

    // act
    log.info('the grant produced id-token-1 and the handshake used test-session-token with test-secret-access-key');

    // assert
    assert.strictEqual(recorded.at(-1), 'info the grant produced [redacted] and the handshake used [redacted] with [redacted]');
  });

  test('SYNC-04 arms the rotation on the lead and floor the caller states rather than the bundled pair', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const requests = stubCloud(t);
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: createRedactingLogger({ delegate: recordingLog([]), secrets: [] }),
      connect: () => {
        throw new Error('no socket expected');
      },
      httpFetch: (input, init) => globalThis.fetch(input, init),
      createSalt: () => 'salt-1',
      rotationLeadMs: SHORT_ROTATION_LEAD_MS,
      minRotationDelayMs: SHORT_ROTATION_FLOOR_MS,
    });

    t.after(async () => {
      await runtime.stop();
    });

    await runtime.start();
    await settle();

    // act
    t.mock.timers.tick(ONE_HOUR_MS - SHORT_ROTATION_LEAD_MS - 1);
    await settle();
    const beforeDue = credentialRequestCount(requests);
    t.mock.timers.tick(1);
    await settle();

    // assert
    assert.deepStrictEqual({ beforeDue, afterDue: credentialRequestCount(requests) }, { beforeDue: 1, afterDue: 2 });
  });

  test('uses a no-op monitoring-health listener when the caller supplies none', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    stubCloud(t);
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: createRedactingLogger({ delegate: recordingLog([]), secrets: [] }),
      connect: () => {
        throw new Error('no socket expected');
      },
      httpFetch: (input, init) => globalThis.fetch(input, init),
      createSalt: () => 'salt-1',
    });

    t.after(async () => {
      await runtime.stop();
    });

    await runtime.start();
    await settle();

    // act & assert
    await assert.doesNotReject(async () => {
      t.mock.timers.tick(POLL_INTERVAL_MS);
      await settle();
    });
  });

  test('reports the monitoring trust to the listener the caller supplies', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    stubCloud(t);
    const reported: MonitoringTrust[] = [];
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: createRedactingLogger({ delegate: recordingLog([]), secrets: [] }),
      connect: () => {
        throw new Error('no socket expected');
      },
      httpFetch: (input, init) => globalThis.fetch(input, init),
      createSalt: () => 'salt-1',
      onMonitoringHealth: (account: MonitoringTrust): void => {
        reported.push(account);
      },
    });

    t.after(async () => {
      await runtime.stop();
    });

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(reported, [
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
    ]);
  });

  test('DEV-05 uses a no-op removal listener when the caller supplies none', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let deviceListCalls = 0;
    t.mock.method(globalThis, 'fetch', (input: string | URL) => {
      const url = input.toString();

      if (url.endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      if (url.endsWith('/devices')) {
        deviceListCalls += 1;

        return Promise.resolve(new Response(JSON.stringify(deviceListCalls === 1 ? geminiWireDeviceList() : { devices: [] }), { status: 200 }));
      }

      return Promise.resolve(new Response(JSON.stringify(credentialsAt(START_TIME + ONE_HOUR_MS)), { status: 200 }));
    });
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: createRedactingLogger({ delegate: recordingLog([]), secrets: [] }),
      connect: () => {
        throw new Error('no socket expected');
      },
      httpFetch: (input, init) => globalThis.fetch(input, init),
      createSalt: () => 'salt-1',
    });

    t.after(async () => {
      await runtime.stop();
    });

    await runtime.start();
    await settle();

    // act & assert
    await assert.doesNotReject(async () => {
      t.mock.timers.tick(POLL_INTERVAL_MS);
      await settle();
      t.mock.timers.tick(POLL_INTERVAL_MS);
      await settle();
    });
    assert.strictEqual(deviceListCalls, 4);
  });
});

describe('the wired account', () => {
  test('AUTH-01 authenticates once and carries the bearer token onto every vendor route', async (t) => {
    // arrange
    const requests = stubCloud(t);
    const { runtime, store } = await endToEndRuntime(t, []);

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(
      { requests, stored: store.deviceIds() },
      {
        requests: [
          { url: 'https://tenant.example.test/oauth/token', authorization: undefined },
          { url: 'https://api.example.test/devices', authorization: 'Bearer id-token-1' },
          { url: 'https://api.example.test/credentials/aws', authorization: 'Bearer id-token-1' },
        ],
        stored: [DEVICE_ID],
      },
    );
  });
});
