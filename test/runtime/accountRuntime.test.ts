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

import { It, mock, verify, when } from 'strong-mock';

import { createCloudApi } from '../../src/cloud/api.js';
import { createAuthClient } from '../../src/cloud/auth.js';
import { AuthHaltedError, AuthRejectedError, AuthThrottledError, CloudRequestError } from '../../src/cloud/errors.js';
import { createShadowClient } from '../../src/cloud/shadow.js';
import { createFamilyRegistry } from '../../src/device/registry.js';
import { createDeviceStateStore } from '../../src/device/state.js';
import { PROVISIONAL_FLOOD_WATER_LEVEL_CODE } from '../../src/device/waterLevel.js';
import { createAccountRuntime, createAccountRuntimeFromConfig, MIN_ROTATION_DELAY_MS, ROTATION_LEAD_MS } from '../../src/runtime/accountRuntime.js';
import { createArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';
import { createRetryPolicy, MAX_BACKOFF_MS } from '../../src/runtime/retryPolicy.js';

import {
  accountConfig,
  bothDevicesAt,
  credentialsAt,
  geminiDevice,
  geminiWireDeviceList,
  heartbeatPatch,
  otherGeminiDevice,
  rotatedCredentialsAt,
  testConstants,
} from './accountRuntimeSeeds.js';
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
import type { HttpFetch } from '../../src/cloud/httpDispatcher.js';
import type { MqttConnect, MqttTransport } from '../../src/cloud/mqttTransport.js';
import type { CredentialCache, ShadowClient } from '../../src/cloud/shadow.js';
import type { ApiDevice, AwsCredentialsResponse, CommandResult, DeviceCommand } from '../../src/cloud/types.js';
import type { DeviceSnapshot, DeviceSnapshotListener, DeviceStateStore } from '../../src/device/state.js';
import type { RedactingLogger, SecretRole } from '../../src/logging.js';
import type { AccountRuntime, AccountRuntimeOptions, ShadowRuntimeOptions } from '../../src/runtime/accountRuntime.js';
import type { ArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { CommandOutcome } from '../../src/runtime/commandPort.js';
import type { FailureLog } from '../../src/runtime/failureLog.js';
import type { MonitoringTrust } from '../../src/runtime/monitoringHealth.js';
import type { MonotonicClock } from '../../src/runtime/monotonicClock.js';
import type { Logging } from 'homebridge';
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

// The line a removal Homebridge refused records, restated here for the same
// reason. It names the controller, because the failing activity is that
// controller's removal and not the account's, and a two-pump case has to say
// which accessory is stranded.
function removalRefusedLine(deviceId: string): string {
  return `Could not remove ${deviceId} from HomeKit; it stays published and stays watched.`;
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

function silentLog(): Logging {
  function silent(): void {
    return undefined;
  }

  return Object.assign(silent, { prefix: '', debug: silent, error: silent, info: silent, success: silent, warn: silent, log: silent });
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
   * Every attempt is recorded before an absent answer rejects. Cases promising
   * no commands assert the empty attempt set; command cases supply an answer.
   */
  command: (deviceId: string, command: DeviceCommand, signal: AbortSignal) => Promise<CommandResult>;
  /** The anchor store the runtime is given. A case about restarts supplies a pre-loaded one. */
  anchors: RecordingAnchors;
}

interface Harness {
  runtime: AccountRuntime;
  store: DeviceStateStore;
  /** Compatibility field; silent logging does not populate it. */
  logged: string[];
  /** One entry per registered secret, its role first, in registration order. */
  registrations: string[];
  shadows: ShadowRecorder[];
  calls: string[];
  /** One entry per trustworthy inventory response, the deviceIds it named. */
  trustworthyInventories: string[][];
  /** One entry per deviceId the runtime reported confirmed absent, in report order. */
  removed: string[];
  /** One entry per command attempt, including unscripted attempts, in send order. */
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

// Builds the runtime over a scripted cloud and a socket-free shadow.
// A case that promises diagnostic notifications supplies its exact FailureLog port.
function harness(
  t: TestContext,
  script: Partial<Script> = {},
  failures: FailureLog = { recordFailure: () => undefined, recordSuccess: () => undefined, forget: () => undefined },
  ports: Partial<Pick<AccountRuntimeOptions, 'registerSecret' | 'onTrustworthyInventory' | 'onDeviceRemoved' | 'onMonitoringHealth' | 'createRetry'>> &
    Partial<CloudApi> = {},
): Harness {
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
  const log = silentLog();
  const store = createDeviceStateStore({ clock, log: silentLog() });
  const anchors = script.anchors ?? recordingAnchors();

  const nextDevices = answering(script.devices ?? [() => Promise.resolve([geminiDevice()])]);
  const nextCredentials = answering(script.credentials ?? [() => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS))]);
  const shadowOpens = script.shadow ?? [true];
  let shadowAttempts = 0;

  const api: CloudApi = {
    devices: (signal: AbortSignal) => {
      calls.push('devices');

      return (ports.devices ?? nextDevices)(signal);
    },
    awsCredentials: (signal: AbortSignal) => {
      calls.push('credentials');

      return (ports.awsCredentials ?? nextCredentials)(signal);
    },
    device: () => Promise.reject(new Error('the runtime must not reach the device route')),
    // Recording precedes rejection so a caught refusal cannot hide an attempt
    // from the owning case's explicit empty-attempt assertion.
    sendCommand: (deviceId: string, command: DeviceCommand, signal: AbortSignal) => {
      commandRequests.push({ deviceId, desiredData: command.desiredData, aborted: signal.aborted });

      if (script.command === undefined) {
        return Promise.reject(new Error('the monitoring path must not reach the command route'));
      }

      return script.command(deviceId, command, signal);
    },
  };

  const runtime = createAccountRuntime({
    api,
    store,
    registry: createFamilyRegistry(),
    createShadow: (shadowOptions: ShadowRuntimeOptions): ShadowClient => {
      calls.push('shadow');

      // A scripted factory failure exercises the runtime's factory-error path.
      // The real factory is inert; start opens the transport, and broker
      // failures arrive through connection callbacks.
      const opens = shadowOpens[Math.min(shadowAttempts, shadowOpens.length - 1)] ?? true;
      shadowAttempts += 1;

      if (!opens) {
        throw new Error('the broker refused the connection');
      }

      const { client, recorder } = fakeShadow(shadowOptions, script.closeFails ?? false, script.whileShadowStarts);
      shadows.push(recorder);

      return client;
    },
    createRetry: ports.createRetry ?? ((signal: AbortSignal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() })),
    pollIntervalMs: script.pollIntervalMs ?? POLL_INTERVAL_MS,
    rotationLeadMs: script.rotationLeadMs ?? ROTATION_LEAD_MS,
    minRotationDelayMs: script.minRotationDelayMs ?? MIN_ROTATION_DELAY_MS,
    failures,
    registerSecret: (secret: string, role?: SecretRole): void => {
      ports.registerSecret?.(secret, role);
      registrations.push(`${String(role)} ${secret}`);
    },
    onTrustworthyInventory: (deviceIds: readonly string[]): void => {
      ports.onTrustworthyInventory?.(deviceIds);
      trustworthyInventories.push([...deviceIds]);
    },
    onDeviceRemoved: (deviceId: string): void => {
      ports.onDeviceRemoved?.(deviceId);
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
      ports.onMonitoringHealth?.(account, byDevice);
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
      retry: createRetryPolicy({ signal: new AbortController().signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() }),
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

interface PendingInventory {
  resolve: (devices: readonly ApiDevice[]) => void;
  reject: (error: Error) => void;
}

// Wires the real authentication client, REST client, and store behind the
// runtime, so only the network boundary is replaced. The token cache lands in
// this case's own storage directory, which is removed when the case ends.
async function endToEndRuntime(t: TestContext): Promise<{ runtime: AccountRuntime; store: DeviceStateStore }> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-account-'));

  t.after(async () => {
    await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  const clock: Clock = { now: () => START_TIME };
  const monotonic: MonotonicClock = { now: () => MONOTONIC_START_TIME };
  const log = silentLog();
  const auth = createAuthClient({
    constants: testConstants(),
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
  const api = createCloudApi({ baseUrl: testConstants().apiUrl, auth, requestTimeoutMs: 1_000, httpFetch: (input, init) => globalThis.fetch(input, init) });
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
    failures: { recordFailure: () => undefined, recordSuccess: () => undefined, forget: () => undefined },
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
function stubCloud(t: TestContext, httpFetch?: HttpFetch): { url: string; authorization: string | undefined }[] {
  const requests: { url: string; authorization: string | undefined }[] = [];

  t.mock.method(globalThis, 'fetch', (input: string | URL, init?: RequestInit) => {
    const url = input.toString();
    requests.push({ url, authorization: new Headers(init?.headers).get('authorization') ?? undefined });

    if (httpFetch !== undefined) {
      return httpFetch(input, init);
    }

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

describe('createAccountRuntime', () => {
  test('confirms seeded physical IDs before removal without inventing device state', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'seeded inventory requests' });
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'seeded device removals' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);
    when(() => {
      removals(OTHER_DEVICE_ID);
    }).thenReturn(undefined);
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
    // The promise constructor assigns the resolver synchronously.
    let completeFinalCheck!: (devices: readonly ApiDevice[]) => void;
    const finalCheck = new Promise<readonly ApiDevice[]>((resolve) => {
      completeFinalCheck = resolve;
    });
    const callbackStates: unknown[] = [];
    let rootSignal!: AbortSignal;
    const { runtime, store, anchors, removed, calls, monitoringHealth, monitoringByDevice, trustworthyInventories, commandRequests, advance } = harness(
      t,
      {
        pollIntervalMs: 1_000,
        anchors: recordingAnchors([
          [DEVICE_ID, START_TIME - 123],
          ['previous-device', START_TIME - 456],
        ]),
        command: commands,
      },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        onDeviceRemoved: (deviceId) => {
          removals(deviceId);
          callbackStates.push({ deviceId, deviceIds: store.deviceIds(), anchors: [...anchors.stored], calls: [...calls] });
        },
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenReturn(finalCheck);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));

    // act
    await runtime.start([DEVICE_ID, DEVICE_ID, OTHER_DEVICE_ID]);
    await settle();
    const afterFirstAbsence = {
      path: runtime.monitoringPath,
      deviceIds: store.deviceIds(),
      snapshots: [store.snapshot(DEVICE_ID), store.snapshot(OTHER_DEVICE_ID)],
      anchors: [...anchors.stored],
      account: monitoringHealth.at(-1),
      byDevice: monitoringByDevice.at(-1),
      removed: [...removed],
    };
    await runtime.start(['previous-device']);
    await advance(1_000);
    const beforeFinalAnswer = { removed: [...removed], anchors: [...anchors.stored], calls: [...calls] };
    completeFinalCheck([]);
    await settle();
    const afterFinalAnswer = {
      path: runtime.monitoringPath,
      deviceIds: store.deviceIds(),
      snapshots: [store.snapshot(DEVICE_ID), store.snapshot(OTHER_DEVICE_ID)],
      anchors: [...anchors.stored],
      account: monitoringHealth.at(-1),
      byDevice: monitoringByDevice.at(-1),
      removed: [...removed],
    };
    await runtime.start([DEVICE_ID]);
    await advance(1_000);
    await runtime.stop();

    // assert
    assert.deepStrictEqual(afterFirstAbsence, {
      path: 'poll-only',
      deviceIds: [],
      snapshots: [undefined, undefined],
      anchors: [
        [DEVICE_ID, START_TIME - 123],
        ['previous-device', START_TIME - 456],
      ],
      account: { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
      byDevice: new Map(),
      removed: [],
    });
    assert.deepStrictEqual(beforeFinalAnswer, {
      removed: [],
      anchors: [
        [DEVICE_ID, START_TIME - 123],
        ['previous-device', START_TIME - 456],
      ],
      calls: ['devices', 'credentials', 'devices', 'devices'],
    });
    assert.deepStrictEqual(afterFinalAnswer, {
      path: 'poll-only',
      deviceIds: [],
      snapshots: [undefined, undefined],
      anchors: [['previous-device', START_TIME - 456]],
      account: { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
      byDevice: new Map(),
      removed: [DEVICE_ID, OTHER_DEVICE_ID],
    });
    assert.deepStrictEqual(callbackStates, [
      {
        deviceId: DEVICE_ID,
        deviceIds: [],
        anchors: [
          [DEVICE_ID, START_TIME - 123],
          ['previous-device', START_TIME - 456],
        ],
        calls: ['devices', 'credentials', 'devices', 'devices'],
      },
      {
        deviceId: OTHER_DEVICE_ID,
        deviceIds: [],
        anchors: [['previous-device', START_TIME - 456]],
        calls: ['devices', 'credentials', 'devices', 'devices'],
      },
    ]);
    assert.deepStrictEqual(
      { calls, removed, trustworthyInventories, commandRequests, anchors: [...anchors.stored] },
      {
        calls: ['devices', 'credentials', 'devices', 'devices', 'devices'],
        removed: [DEVICE_ID, OTHER_DEVICE_ID],
        trustworthyInventories: [[], [], []],
        commandRequests: [],
        anchors: [['previous-device', START_TIME - 456]],
      },
    );
    verify(requests);
    verify(removals);
    verify(commands);
  });

  test('leaves restored anchors ineligible for removal when start receives no known IDs', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'unseeded inventory requests' });
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'unseeded device removal' });
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
    let rootSignal!: AbortSignal;
    const { runtime, store, anchors, removed, calls, trustworthyInventories, commandRequests, advance } = harness(
      t,
      { pollIntervalMs: 1_000, anchors: recordingAnchors([[DEVICE_ID, START_TIME - 123]]), command: commands },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        onDeviceRemoved: removals,
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));

    // act
    await runtime.start();
    await settle();
    await advance(1_000);
    await advance(1_000);
    const path = runtime.monitoringPath;
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      {
        path,
        deviceIds: store.deviceIds(),
        snapshot: store.snapshot(DEVICE_ID),
        anchors: [...anchors.stored],
        removed,
        calls,
        trustworthyInventories,
        commandRequests,
      },
      {
        path: 'poll-only',
        deviceIds: [],
        snapshot: undefined,
        anchors: [[DEVICE_ID, START_TIME - 123]],
        removed: [],
        calls: ['devices', 'credentials', 'devices', 'devices'],
        trustworthyInventories: [[], [], []],
        commandRequests: [],
      },
    );
    verify(requests);
    verify(removals);
    verify(commands);
  });

  for (const { title, inventoryError } of [
    { title: 'failed', inventoryError: new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices') },
    { title: 'incomplete', inventoryError: new Error('the inventory envelope is incomplete') },
  ]) {
    test(`retains seeded absence confirmation across ${title} inventories`, async (t) => {
      // arrange
      const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'healthy and rejected inventory requests' });
      const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'seeded device removal' });
      when(() => {
        removals(DEVICE_ID);
      }).thenReturn(undefined);
      const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
      let rootSignal!: AbortSignal;
      const { runtime, store, anchors, removed, calls, trustworthyInventories, commandRequests, advance } = harness(
        t,
        { pollIntervalMs: 1_000, anchors: recordingAnchors([[DEVICE_ID, START_TIME - 123]]), command: commands },
        undefined,
        {
          devices: (signal) => requests.devices(signal),
          awsCredentials: (signal) => requests.awsCredentials(signal),
          onDeviceRemoved: removals,
          createRetry: (signal) => {
            rootSignal = signal;
            return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
          },
        },
      );
      when(() => requests.devices(rootSignal)).thenReject(inventoryError);
      when(() => requests.devices(rootSignal)).thenResolve([]);
      when(() => requests.devices(rootSignal)).thenReject(inventoryError);
      when(() => requests.devices(rootSignal)).thenResolve([]);
      when(() => requests.devices(rootSignal)).thenResolve([]);
      when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));

      // act
      await runtime.start([DEVICE_ID]);
      await settle();
      const afterFailedLaunch = { path: runtime.monitoringPath, removed: [...removed], anchors: [...anchors.stored] };
      await advance(1_000);
      const afterFirstHealthy = { path: runtime.monitoringPath, removed: [...removed], anchors: [...anchors.stored] };
      await advance(1_000);
      const afterFailedPoll = { path: runtime.monitoringPath, removed: [...removed], anchors: [...anchors.stored] };
      await advance(1_000);
      const afterSecondHealthy = { path: runtime.monitoringPath, removed: [...removed], anchors: [...anchors.stored] };
      await runtime.stop();

      // assert
      assert.deepStrictEqual(
        { afterFailedLaunch, afterFirstHealthy, afterFailedPoll, afterSecondHealthy },
        {
          afterFailedLaunch: { path: 'unavailable', removed: [], anchors: [[DEVICE_ID, START_TIME - 123]] },
          afterFirstHealthy: { path: 'poll-only', removed: [], anchors: [[DEVICE_ID, START_TIME - 123]] },
          afterFailedPoll: { path: 'unavailable', removed: [], anchors: [[DEVICE_ID, START_TIME - 123]] },
          afterSecondHealthy: { path: 'poll-only', removed: [DEVICE_ID], anchors: [] },
        },
      );
      assert.deepStrictEqual(
        { deviceIds: store.deviceIds(), snapshot: store.snapshot(DEVICE_ID), calls, trustworthyInventories, commandRequests },
        {
          deviceIds: [],
          snapshot: undefined,
          calls: ['devices', 'credentials', 'devices', 'devices', 'devices', 'devices'],
          trustworthyInventories: [[], []],
          commandRequests: [],
        },
      );
      verify(requests);
      verify(removals);
      verify(commands);
    });
  }

  test('retains seeded removal eligibility after a failed final check and callback refusal', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'seeded removal confirmation requests' });
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'refused then successful removal' });
    when(() => {
      removals(DEVICE_ID);
    }).thenThrow(new Error('Homebridge refused removal'));
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
    let rootSignal!: AbortSignal;
    const { runtime, store, anchors, removed, calls, commandRequests, advance } = harness(
      t,
      { pollIntervalMs: 1_000, anchors: recordingAnchors([[DEVICE_ID, START_TIME - 123]]), command: commands },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        onDeviceRemoved: removals,
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenReject(new Error('the final inventory is unavailable'));
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));

    // act
    await runtime.start([DEVICE_ID]);
    await settle();
    await advance(1_000);
    const afterFailedCheck = { removed: [...removed], anchors: [...anchors.stored], calls: [...calls] };
    await advance(1_000);
    const afterRefusedCallback = { removed: [...removed], anchors: [...anchors.stored], calls: [...calls] };
    await advance(1_000);
    const afterSuccessfulCallback = { removed: [...removed], anchors: [...anchors.stored], calls: [...calls] };
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { afterFailedCheck, afterRefusedCallback, afterSuccessfulCallback, deviceIds: store.deviceIds(), snapshot: store.snapshot(DEVICE_ID), commandRequests },
      {
        afterFailedCheck: { removed: [], anchors: [[DEVICE_ID, START_TIME - 123]], calls: ['devices', 'credentials', 'devices', 'devices'] },
        afterRefusedCallback: {
          removed: [],
          anchors: [[DEVICE_ID, START_TIME - 123]],
          calls: ['devices', 'credentials', 'devices', 'devices', 'devices', 'devices'],
        },
        afterSuccessfulCallback: {
          removed: [DEVICE_ID],
          anchors: [],
          calls: ['devices', 'credentials', 'devices', 'devices', 'devices', 'devices', 'devices', 'devices'],
        },
        deviceIds: [],
        snapshot: undefined,
        commandRequests: [],
      },
    );
    verify(requests);
    verify(removals);
    verify(commands);
  });

  test('removes no seeded identity when a final inventory completes after shutdown', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'seeded shutdown inventory requests' });
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'forbidden stopped removal' });
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
    // The promise constructor assigns the resolver synchronously.
    let completeFinalCheck!: (devices: readonly ApiDevice[]) => void;
    const finalCheck = new Promise<readonly ApiDevice[]>((resolve) => {
      completeFinalCheck = resolve;
    });
    let rootSignal!: AbortSignal;
    const { runtime, store, anchors, removed, calls, monitoringHealth, monitoringByDevice, commandRequests, advance } = harness(
      t,
      {
        pollIntervalMs: 1_000,
        anchors: recordingAnchors([[DEVICE_ID, START_TIME - 123]]),
        command: commands,
      },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        onDeviceRemoved: removals,
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenReturn(finalCheck);
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));

    // act
    await runtime.start([DEVICE_ID]);
    await settle();
    await advance(1_000);
    await runtime.stop();
    completeFinalCheck([]);
    await settle();
    await runtime.start([OTHER_DEVICE_ID]);
    await advance(1_000);

    // assert
    assert.deepStrictEqual(
      {
        path: runtime.monitoringPath,
        deviceIds: store.deviceIds(),
        anchors: [...anchors.stored],
        removed,
        calls,
        monitoringHealth,
        monitoringByDevice,
        commandRequests,
      },
      {
        path: 'unavailable',
        deviceIds: [],
        anchors: [[DEVICE_ID, START_TIME - 123]],
        removed: [],
        calls: ['devices', 'credentials', 'devices', 'devices'],
        monitoringHealth: [
          { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
          { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        ],
        monitoringByDevice: [new Map(), new Map()],
        commandRequests: [],
      },
    );
    verify(requests);
    verify(removals);
    verify(commands);
  });

  test('starts no seeded inventory when anchor restoration finishes after shutdown', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'forbidden stopped inventory requests' });
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'forbidden stopped removal' });
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
    // The promise constructor assigns the resolver synchronously.
    let completeRestore!: () => void;
    const restoring = new Promise<void>((resolve) => {
      completeRestore = resolve;
    });
    const anchors = { ...recordingAnchors(), restore: () => restoring };
    const { runtime, store, calls, removed, commandRequests } = harness(t, { anchors, command: commands }, undefined, {
      devices: (signal) => requests.devices(signal),
      awsCredentials: (signal) => requests.awsCredentials(signal),
      onDeviceRemoved: removals,
    });

    // act
    const starting = runtime.start([DEVICE_ID]);
    await runtime.start([OTHER_DEVICE_ID]);
    await runtime.stop();
    completeRestore();
    await starting;
    await settle();

    // assert
    assert.deepStrictEqual(
      { path: runtime.monitoringPath, deviceIds: store.deviceIds(), anchors: [...anchors.stored], calls, removed, commandRequests },
      { path: 'unavailable', deviceIds: [], anchors: [], calls: [], removed: [], commandRequests: [] },
    );
    verify(requests);
    verify(removals);
    verify(commands);
  });

  test('releases replaced shadow readiness and telemetry ownership until the current connection is ready', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let elapsedMs = 0;
    const clock: Clock = { now: () => START_TIME + elapsedMs };
    const log = silentLog();
    const store = createDeviceStateStore({ clock, log });
    const anchors = recordingAnchors();
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'membership handoff requests' });
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'forbidden membership removal' });
    const inventories = mock<AccountRuntimeOptions['onTrustworthyInventory']>({ exactParams: true, name: 'membership inventory notifications' });
    const monitoring = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'membership trust notifications' });
    const connected: (() => void)[] = [];
    const messages: ((topic: string, payload: Buffer) => void)[] = [];
    const errors: ((error: Error) => void)[] = [];
    const closed: (() => void)[] = [];
    const transports: Pick<MqttTransport, 'subscribe' | 'publish' | 'end'>[] = [];
    const endings: number[] = [];
    const reports: { account: MonitoringTrust; byDevice: ReadonlyMap<string, MonitoringTrust> }[] = [];
    // The promise constructor assigns the resolver synchronously.
    let completeSubscription!: () => void;
    const replacementSubscription = new Promise<void>((resolve) => {
      completeSubscription = resolve;
    });
    let rootSignal!: AbortSignal;
    let shadowClient: ShadowClient | undefined;
    const runtime = createAccountRuntime({
      api: {
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        device: () => Promise.reject(new Error('no individual-device request is scripted')),
        sendCommand: commands,
      },
      store,
      registry: createFamilyRegistry(),
      createShadow: (options) => {
        shadowClient = createShadowClient({
          ...options,
          scheme: 'wss',
          region: 'us-east-1',
          clock,
          log,
          userAgent: 'offline-account-test',
          connect: () => {
            throw new Error('the injected transport opens no socket');
          },
          createTransport: () => {
            const ordinal = transports.length;
            const transport = mock<Pick<MqttTransport, 'subscribe' | 'publish' | 'end'>>({ exactParams: true, name: 'membership shadow transport' });
            const topics = [
              '$aws/things/account-1_serial-1/shadow/get/accepted',
              '$aws/things/account-1_serial-1/shadow/get/rejected',
              '$aws/things/account-1_serial-1/shadow/update/accepted',
            ];
            if (ordinal === 1) {
              topics.push(
                '$aws/things/account-1_serial-2/shadow/get/accepted',
                '$aws/things/account-1_serial-2/shadow/get/rejected',
                '$aws/things/account-1_serial-2/shadow/update/accepted',
              );
            }

            when(() => transport.subscribe(topics)).thenReturn(ordinal === 0 ? Promise.resolve() : replacementSubscription);
            when(() => transport.publish('$aws/things/account-1_serial-1/shadow/get', '')).thenResolve(undefined);
            if (ordinal === 1) {
              when(() => transport.publish('$aws/things/account-1_serial-2/shadow/get', '')).thenResolve(undefined);
            }

            when(() => transport.end()).thenResolve(undefined);
            transports.push(transport);
            return {
              onConnect: (handler) => {
                connected.push(handler);
              },
              onMessage: (handler) => {
                messages.push(handler);
              },
              onError: (handler) => {
                errors.push(handler);
              },
              onClose: (handler) => {
                closed.push(handler);
              },
              subscribe: (topics) => transport.subscribe(topics),
              publish: (topic, payload) => transport.publish(topic, payload),
              end: () => {
                endings.push(ordinal);
                return transport.end();
              },
            } satisfies MqttTransport;
          },
        });
        return shadowClient;
      },
      createRetry: (signal) => {
        rootSignal = signal;
        return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log });
      },
      pollIntervalMs: 1_000,
      rotationLeadMs: ROTATION_LEAD_MS,
      minRotationDelayMs: MIN_ROTATION_DELAY_MS,
      failures: { recordFailure: () => undefined, recordSuccess: () => undefined, forget: () => undefined },
      registerSecret: () => undefined,
      onTrustworthyInventory: inventories,
      onDeviceRemoved: removals,
      onMonitoringHealth: (account, byDevice) => {
        monitoring(account, byDevice);
        reports.push({ account, byDevice: new Map(byDevice) });
      },
      clock,
      monotonic: { now: () => MONOTONIC_START_TIME + elapsedMs },
      anchors,
      log,
    });
    t.after(async () => {
      await runtime.stop();
    });
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice(), otherGeminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([otherGeminiDevice(), geminiDevice()]);
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));
    when(() => {
      inventories([DEVICE_ID]);
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      inventories([DEVICE_ID, OTHER_DEVICE_ID]);
    }).thenReturn(undefined);
    when(() => {
      inventories([OTHER_DEVICE_ID, DEVICE_ID]);
    }).thenReturn(undefined);
    const account: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false };
    const deviceTrust: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false };
    const pairTrust = new Map([
      [DEVICE_ID, deviceTrust],
      [OTHER_DEVICE_ID, deviceTrust],
    ]);
    when(() => {
      monitoring(account, new Map([[DEVICE_ID, deviceTrust]]));
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      monitoring(account, pairTrust);
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      monitoring(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    const firstSnapshot: DeviceSnapshot = {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: 1_700_000_000_000 },
      data: { water_level: 3, primary_pump_running: false, ac_power: true },
      metadata: { firmware: 'first-live' },
      shadowVersion: 7,
      deviceTimestamp: 1_700_000_000_000,
      receivedAt: START_TIME + 123,
    };
    const otherSnapshot: DeviceSnapshot = {
      identity: { deviceId: OTHER_DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: 1_700_000_000_000 },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: 1_700_000_000_000,
      receivedAt: START_TIME + 2_000,
    };
    function captureMonitoring() {
      return {
        path: runtime.monitoringPath,
        connected: shadowClient?.connected,
        snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
        anchors: [...anchors.stored],
        report: reports.at(-1),
        connections: transports.length,
        endings: [...endings],
      };
    }

    // act
    await runtime.start();
    await settle();
    const beforeFirstReadiness = { path: runtime.monitoringPath, connected: shadowClient?.connected };
    connected[0]?.();
    await settle();
    elapsedMs = 123;
    messages[0]?.(
      '$aws/things/account-1_serial-1/shadow/get/accepted',
      Buffer.from(JSON.stringify({ state: { reported: { data: { water_level: 3 }, state: { firmware: 'first-live' } } }, version: 7 })),
    );
    const initiallyReady = captureMonitoring();
    elapsedMs = 1_000;
    t.mock.timers.tick(1_000);
    await settle();
    const unchangedMembership = captureMonitoring();
    elapsedMs = 2_000;
    t.mock.timers.tick(1_000);
    await settle();
    const replacedMembership = captureMonitoring();
    connected[0]?.();
    errors[0]?.(new Error('a replaced transport failed'));
    closed[0]?.();
    messages[0]?.(
      '$aws/things/account-1_serial-1/shadow/update/accepted',
      Buffer.from(JSON.stringify({ state: { reported: { data: { water_level: 0 } } }, version: 99 })),
    );
    await settle();
    const afterOldCallbacks = captureMonitoring();
    elapsedMs = 3_000;
    t.mock.timers.tick(1_000);
    await settle();
    const afterRestRefresh = captureMonitoring();
    connected[1]?.();
    await settle();
    const whileSubscriptionPending = captureMonitoring();
    completeSubscription();
    await settle();
    const currentReady = captureMonitoring();
    elapsedMs = 3_250;
    messages[1]?.(
      '$aws/things/account-1_serial-1/shadow/get/accepted',
      Buffer.from(JSON.stringify({ state: { reported: { data: { water_level: 2 }, state: { firmware: 'current-live' } } }, version: 1 })),
    );
    const currentTelemetry = captureMonitoring();
    await runtime.stop();
    connected[1]?.();
    messages[1]?.(
      '$aws/things/account-1_serial-1/shadow/update/accepted',
      Buffer.from(JSON.stringify({ state: { reported: { data: { water_level: 0 } } }, version: 100 })),
    );
    await settle();
    const stopped = captureMonitoring();
    const expectedReplacement = {
      path: 'poll-only',
      connected: false,
      snapshots: [{ ...firstSnapshot, shadowVersion: undefined, receivedAt: START_TIME + 2_000 }, otherSnapshot],
      anchors: [
        [DEVICE_ID, START_TIME + 123],
        [OTHER_DEVICE_ID, START_TIME + 2_000],
      ],
      report: { account, byDevice: pairTrust },
      connections: 2,
      endings: [0],
    };
    const expectedRest = {
      ...expectedReplacement,
      snapshots: [
        { ...firstSnapshot, data: { water_level: 1, primary_pump_running: false, ac_power: true }, shadowVersion: undefined, receivedAt: START_TIME + 3_000 },
        { ...otherSnapshot, receivedAt: START_TIME + 3_000 },
      ],
    };
    const expectedCurrent = {
      ...expectedRest,
      path: 'shadow-and-poll',
      connected: true,
      snapshots: [
        {
          ...firstSnapshot,
          data: { water_level: 2, primary_pump_running: false, ac_power: true },
          metadata: { firmware: 'current-live' },
          shadowVersion: 1,
          receivedAt: START_TIME + 3_250,
        },
        { ...otherSnapshot, receivedAt: START_TIME + 3_000 },
      ],
      anchors: [
        [DEVICE_ID, START_TIME + 3_250],
        [OTHER_DEVICE_ID, START_TIME + 2_000],
      ],
    };

    // assert
    assert.deepStrictEqual(beforeFirstReadiness, { path: 'poll-only', connected: false });
    assert.deepStrictEqual(initiallyReady, {
      path: 'shadow-and-poll',
      connected: true,
      snapshots: [firstSnapshot],
      anchors: [[DEVICE_ID, START_TIME + 123]],
      report: { account, byDevice: new Map([[DEVICE_ID, deviceTrust]]) },
      connections: 1,
      endings: [],
    });
    assert.deepStrictEqual(unchangedMembership, {
      path: 'shadow-and-poll',
      connected: true,
      snapshots: [{ ...firstSnapshot, receivedAt: START_TIME + 1_000 }],
      anchors: [[DEVICE_ID, START_TIME + 123]],
      report: { account, byDevice: new Map([[DEVICE_ID, deviceTrust]]) },
      connections: 1,
      endings: [],
    });
    assert.deepStrictEqual(
      { replacedMembership, afterOldCallbacks, afterRestRefresh, whileSubscriptionPending, currentReady, currentTelemetry, stopped },
      {
        replacedMembership: expectedReplacement,
        afterOldCallbacks: expectedReplacement,
        afterRestRefresh: expectedRest,
        whileSubscriptionPending: expectedRest,
        currentReady: { ...expectedRest, path: 'shadow-and-poll', connected: true },
        currentTelemetry: expectedCurrent,
        stopped: {
          ...expectedCurrent,
          path: 'unavailable',
          connected: false,
          endings: [0, 1],
          report: {
            account: { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
            byDevice: new Map([
              [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
              [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
            ]),
          },
        },
      },
    );
    verify(requests);
    verify(commands);
    verify(removals);
    verify(inventories);
    verify(monitoring);
    for (const transport of transports) {
      verify(transport);
    }
  });

  test('keeps the shadow connection when the same physical devices are enumerated in another order', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let elapsedMs = 0;
    let reverseOrder = false;
    const clock: Clock = { now: () => START_TIME + elapsedMs };
    const log = silentLog();
    const canonical = createDeviceStateStore({ clock, log });
    const store: DeviceStateStore = {
      ...canonical,
      deviceIds: () => (reverseOrder ? [...canonical.deviceIds()].reverse() : canonical.deviceIds()),
    };
    const lifecycle = mock<Pick<ShadowClient, 'start' | 'close'>>({ exactParams: true, name: 'shadow membership lifecycle' });
    when(() => lifecycle.start([DEVICE_ID, OTHER_DEVICE_ID])).thenResolve(undefined);
    when(() => lifecycle.close()).thenResolve(undefined);
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
    const starts: string[][] = [];
    const anchors = recordingAnchors();
    const runtime = createAccountRuntime({
      api: {
        devices: answering([() => Promise.resolve([geminiDevice(), otherGeminiDevice()]), () => Promise.resolve([otherGeminiDevice(), geminiDevice()])]),
        awsCredentials: () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
        device: () => Promise.reject(new Error('no individual-device request is scripted')),
        sendCommand: commands,
      },
      store,
      registry: createFamilyRegistry(),
      createShadow: () => ({
        connected: false,
        start: (deviceIds) => {
          starts.push([...deviceIds]);
          return lifecycle.start(deviceIds);
        },
        close: () => lifecycle.close(),
      }),
      createRetry: (signal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log }),
      pollIntervalMs: 1_000,
      rotationLeadMs: ROTATION_LEAD_MS,
      minRotationDelayMs: MIN_ROTATION_DELAY_MS,
      failures: { recordFailure: () => undefined, recordSuccess: () => undefined, forget: () => undefined },
      registerSecret: () => undefined,
      onTrustworthyInventory: () => undefined,
      onDeviceRemoved: () => undefined,
      onMonitoringHealth: () => undefined,
      clock,
      monotonic: { now: () => MONOTONIC_START_TIME + elapsedMs },
      anchors,
      log,
    });
    t.after(async () => {
      await runtime.stop();
    });

    // act
    await runtime.start();
    await settle();
    const initialIds = runtime.store.deviceIds();
    reverseOrder = true;
    elapsedMs = 1_000;
    t.mock.timers.tick(1_000);
    await settle();
    const afterReordering = {
      path: runtime.monitoringPath,
      deviceIds: runtime.store.deviceIds(),
      snapshots: runtime.store.deviceIds().map((deviceId) => runtime.store.snapshot(deviceId)),
      anchors: [...anchors.stored],
    };
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { initialIds, afterReordering, starts },
      {
        initialIds: [DEVICE_ID, OTHER_DEVICE_ID],
        afterReordering: {
          path: 'poll-only',
          deviceIds: [OTHER_DEVICE_ID, DEVICE_ID],
          snapshots: [
            {
              identity: { deviceId: OTHER_DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
              connectivity: { connected: true, timestamp: 1_700_000_000_000 },
              data: { water_level: 1, primary_pump_running: false, ac_power: true },
              metadata: {},
              shadowVersion: undefined,
              deviceTimestamp: 1_700_000_000_000,
              receivedAt: START_TIME + 1_000,
            },
            {
              identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
              connectivity: { connected: true, timestamp: 1_700_000_000_000 },
              data: { water_level: 1, primary_pump_running: false, ac_power: true },
              metadata: {},
              shadowVersion: undefined,
              deviceTimestamp: 1_700_000_000_000,
              receivedAt: START_TIME + 1_000,
            },
          ],
          anchors: [
            [DEVICE_ID, START_TIME],
            [OTHER_DEVICE_ID, START_TIME],
          ],
        },
        starts: [[DEVICE_ID, OTHER_DEVICE_ID]],
      },
    );
    verify(lifecycle);
    verify(commands);
  });

  test('adds a later discovered device to live shadow routing without reconnecting unchanged inventories', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let elapsedMs = 0;
    const clock: Clock = { now: () => START_TIME + elapsedMs };
    const log = silentLog();
    const store = createDeviceStateStore({ clock, log });
    const anchors = recordingAnchors();
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'forbidden device removal' });
    const inventoryListener = mock<AccountRuntimeOptions['onTrustworthyInventory']>({ exactParams: true, name: 'inventory notifications' });
    const monitoringListener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring notifications' });
    const transports: Pick<MqttTransport, 'subscribe' | 'publish' | 'end'>[] = [];
    const subscriptions: string[][] = [];
    const requests: { topic: string; payload: string }[] = [];
    const messages: ((topic: string, payload: Buffer) => void)[] = [];
    const reports: { account: MonitoringTrust; byDevice: ReadonlyMap<string, MonitoringTrust> }[] = [];
    const inventories: string[][] = [];
    const runtime = createAccountRuntime({
      api: {
        devices: answering([() => Promise.resolve([geminiDevice()]), () => Promise.resolve([geminiDevice(), otherGeminiDevice()])]),
        awsCredentials: () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
        device: () => Promise.reject(new Error('no individual-device request is scripted')),
        sendCommand: commands,
      },
      store,
      registry: createFamilyRegistry(),
      createShadow: (options) =>
        createShadowClient({
          ...options,
          scheme: 'wss',
          region: 'us-east-1',
          clock,
          log,
          userAgent: 'offline-account-test',
          connect: () => {
            throw new Error('the injected transport opens no socket');
          },
          createTransport: () => {
            const transport = mock<Pick<MqttTransport, 'subscribe' | 'publish' | 'end'>>({ exactParams: true, name: 'shadow transport operations' });
            const topics = [
              '$aws/things/account-1_serial-1/shadow/get/accepted',
              '$aws/things/account-1_serial-1/shadow/get/rejected',
              '$aws/things/account-1_serial-1/shadow/update/accepted',
            ];
            if (transports.length > 0) {
              topics.push(
                '$aws/things/account-1_serial-2/shadow/get/accepted',
                '$aws/things/account-1_serial-2/shadow/get/rejected',
                '$aws/things/account-1_serial-2/shadow/update/accepted',
              );
            }

            when(() => transport.subscribe(topics)).thenResolve(undefined);
            when(() => transport.publish('$aws/things/account-1_serial-1/shadow/get', '')).thenResolve(undefined);
            if (transports.length > 0) {
              when(() => transport.publish('$aws/things/account-1_serial-2/shadow/get', '')).thenResolve(undefined);
            }

            when(() => transport.end()).thenResolve(undefined);
            transports.push(transport);
            return {
              onConnect: (handler) => {
                queueMicrotask(handler);
              },
              onMessage: (handler) => {
                messages.push(handler);
              },
              onError: () => undefined,
              onClose: () => undefined,
              subscribe: (topics) => {
                subscriptions.push([...topics]);
                return transport.subscribe(topics);
              },
              publish: (topic, payload) => {
                requests.push({ topic, payload });
                return transport.publish(topic, payload);
              },
              end: () => transport.end(),
            } satisfies MqttTransport;
          },
        }),
      createRetry: (signal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log }),
      pollIntervalMs: 1_000,
      rotationLeadMs: ROTATION_LEAD_MS,
      minRotationDelayMs: MIN_ROTATION_DELAY_MS,
      failures: { recordFailure: () => undefined, recordSuccess: () => undefined, forget: () => undefined },
      registerSecret: () => undefined,
      onTrustworthyInventory: (deviceIds) => {
        inventoryListener(deviceIds);
        inventories.push([...deviceIds]);
      },
      onDeviceRemoved: removals,
      onMonitoringHealth: (account, byDevice) => {
        monitoringListener(account, byDevice);
        reports.push({ account, byDevice: new Map(byDevice) });
      },
      clock,
      monotonic: { now: () => MONOTONIC_START_TIME + elapsedMs },
      anchors,
      log,
    });
    t.after(async () => {
      await runtime.stop();
    });
    const expectedFirst: DeviceSnapshot = {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: 1_700_000_000_000 },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: 1_700_000_000_000,
      receivedAt: START_TIME + 1_000,
    };
    const expectedSecond: DeviceSnapshot = {
      identity: { deviceId: OTHER_DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: 1_700_000_000_000 },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: 1_700_000_000_000,
      receivedAt: START_TIME + 1_000,
    };
    const healthyAccount: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false };
    const healthyDevice: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false };
    const expectedLiveFirst: DeviceSnapshot = {
      ...expectedFirst,
      data: { water_level: 3, primary_pump_running: false, ac_power: true },
      metadata: { firmware: 'first-live' },
      shadowVersion: 11,
      receivedAt: START_TIME + 2_250,
    };
    const expectedLiveSecond: DeviceSnapshot = {
      ...expectedSecond,
      data: { water_level: 7, primary_pump_running: true, ac_power: true },
      metadata: { firmware: 'second-live' },
      shadowVersion: 12,
      receivedAt: START_TIME + 2_250,
    };
    when(() => {
      inventoryListener([DEVICE_ID]);
    }).thenReturn(undefined);
    when(() => {
      inventoryListener([DEVICE_ID, OTHER_DEVICE_ID]);
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      monitoringListener(healthyAccount, new Map([[DEVICE_ID, healthyDevice]]));
    }).thenReturn(undefined);
    when(() => {
      monitoringListener(
        healthyAccount,
        new Map([
          [DEVICE_ID, healthyDevice],
          [OTHER_DEVICE_ID, healthyDevice],
        ]),
      );
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      monitoringListener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);

    // act
    await runtime.start();
    await settle();
    const atStart = { path: runtime.monitoringPath, deviceIds: store.deviceIds(), snapshot: store.snapshot(DEVICE_ID), report: reports.at(-1) };
    elapsedMs = 1_000;
    t.mock.timers.tick(1_000);
    await settle();
    const afterAdmission = {
      path: runtime.monitoringPath,
      deviceIds: store.deviceIds(),
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      report: reports.at(-1),
      connections: transports.length,
    };
    elapsedMs = 2_000;
    t.mock.timers.tick(1_000);
    await settle();
    const connectionsAfterUnchangedPoll = transports.length;
    elapsedMs = 2_250;
    messages.at(-1)?.(
      '$aws/things/account-1_serial-1/shadow/update/accepted',
      Buffer.from(JSON.stringify({ state: { reported: { data: { water_level: 3 }, state: { firmware: 'first-live' } } }, version: 11 })),
    );
    messages.at(-1)?.(
      '$aws/things/account-1_serial-2/shadow/get/accepted',
      Buffer.from(
        JSON.stringify({ state: { reported: { data: { water_level: 7, primary_pump_running: true }, state: { firmware: 'second-live' } } }, version: 12 }),
      ),
    );
    const liveState = {
      path: runtime.monitoringPath,
      deviceIds: store.deviceIds(),
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      anchors: [...anchors.stored],
      report: reports.at(-1),
    };
    await runtime.stop();
    messages.at(-1)?.(
      '$aws/things/account-1_serial-2/shadow/update/accepted',
      Buffer.from(JSON.stringify({ state: { reported: { data: { water_level: 0 } } }, version: 13 })),
    );
    const afterStop = {
      path: runtime.monitoringPath,
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      anchors: [...anchors.stored],
      report: reports.at(-1),
    };

    // assert
    assert.deepStrictEqual(atStart, {
      path: 'shadow-and-poll',
      deviceIds: [DEVICE_ID],
      snapshot: { ...expectedFirst, receivedAt: START_TIME },
      report: { account: healthyAccount, byDevice: new Map([[DEVICE_ID, healthyDevice]]) },
    });
    assert.deepStrictEqual(
      { afterAdmission, connectionsAfterUnchangedPoll, liveState, afterStop, subscriptions, requests, inventories },
      {
        afterAdmission: {
          path: 'shadow-and-poll',
          deviceIds: [DEVICE_ID, OTHER_DEVICE_ID],
          snapshots: [expectedFirst, expectedSecond],
          report: {
            account: healthyAccount,
            byDevice: new Map([
              [DEVICE_ID, healthyDevice],
              [OTHER_DEVICE_ID, healthyDevice],
            ]),
          },
          connections: 2,
        },
        connectionsAfterUnchangedPoll: 2,
        liveState: {
          path: 'shadow-and-poll',
          deviceIds: [DEVICE_ID, OTHER_DEVICE_ID],
          snapshots: [expectedLiveFirst, expectedLiveSecond],
          anchors: [
            [DEVICE_ID, START_TIME + 2_250],
            [OTHER_DEVICE_ID, START_TIME + 2_250],
          ],
          report: {
            account: healthyAccount,
            byDevice: new Map([
              [DEVICE_ID, healthyDevice],
              [OTHER_DEVICE_ID, healthyDevice],
            ]),
          },
        },
        afterStop: {
          path: 'unavailable',
          snapshots: [expectedLiveFirst, expectedLiveSecond],
          anchors: [
            [DEVICE_ID, START_TIME + 2_250],
            [OTHER_DEVICE_ID, START_TIME + 2_250],
          ],
          report: {
            account: { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
            byDevice: new Map([
              [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
              [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
            ]),
          },
        },
        subscriptions: [
          [
            '$aws/things/account-1_serial-1/shadow/get/accepted',
            '$aws/things/account-1_serial-1/shadow/get/rejected',
            '$aws/things/account-1_serial-1/shadow/update/accepted',
          ],
          [
            '$aws/things/account-1_serial-1/shadow/get/accepted',
            '$aws/things/account-1_serial-1/shadow/get/rejected',
            '$aws/things/account-1_serial-1/shadow/update/accepted',
            '$aws/things/account-1_serial-2/shadow/get/accepted',
            '$aws/things/account-1_serial-2/shadow/get/rejected',
            '$aws/things/account-1_serial-2/shadow/update/accepted',
          ],
        ],
        requests: [
          { topic: '$aws/things/account-1_serial-1/shadow/get', payload: '' },
          { topic: '$aws/things/account-1_serial-1/shadow/get', payload: '' },
          { topic: '$aws/things/account-1_serial-2/shadow/get', payload: '' },
        ],
        inventories: [[DEVICE_ID], [DEVICE_ID, OTHER_DEVICE_ID], [DEVICE_ID, OTHER_DEVICE_ID]],
      },
    );
    verify(commands);
    verify(removals);
    verify(inventoryListener);
    verify(monitoringListener);
    for (const transport of transports) {
      verify(transport);
    }
  });

  test('removes a reappeared device only after two later healthy omissions and a final check', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const inventoryListener = mock<AccountRuntimeOptions['onTrustworthyInventory']>({ exactParams: true, name: 'trustworthy inventory listener' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);
    when(() => {
      inventoryListener([DEVICE_ID, OTHER_DEVICE_ID]);
    }).thenReturn(undefined);
    when(() => {
      inventoryListener([OTHER_DEVICE_ID]);
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      inventoryListener([]);
    }).thenReturn(undefined);
    when(() => {
      inventoryListener([OTHER_DEVICE_ID]);
    }).thenReturn(undefined);
    const removalStates: unknown[] = [];
    // The public retry factory receives the root signal before start.
    let rootSignal!: AbortSignal;
    const { runtime, store, anchors, calls, removed, monitoringHealth, monitoringByDevice, trustworthyInventories, advance, commandRequests } = harness(
      t,
      { pollIntervalMs: 1_000, command: commands },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        onTrustworthyInventory: inventoryListener,
        onDeviceRemoved: (deviceId) => {
          removals(deviceId);
          removalStates.push({
            deviceId,
            deviceIds: store.deviceIds(),
            snapshots: store.deviceIds().map((id) => store.snapshot(id)),
            anchors: [...anchors.stored],
            account: monitoringHealth.at(-1),
            byDevice: monitoringByDevice.at(-1),
            calls: [...calls],
          });
        },
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice(), otherGeminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([otherGeminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([otherGeminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([otherGeminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([otherGeminiDevice()]);
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));
    const expectedSnapshot: DeviceSnapshot = {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: 1_700_000_000_000 },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: 1_700_000_000_000,
      receivedAt: START_TIME,
    };
    const expectedOtherSnapshot: DeviceSnapshot = {
      identity: { deviceId: OTHER_DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: 1_700_000_000_000 },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: 1_700_000_000_000,
      receivedAt: START_TIME + 2_000,
    };
    const healthyAccount: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false };
    const healthyDevice: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false };
    const expectedRetainedState = {
      path: 'shadow-and-poll',
      deviceIds: [DEVICE_ID, OTHER_DEVICE_ID],
      snapshots: [expectedSnapshot, expectedOtherSnapshot],
      anchors: [
        [DEVICE_ID, START_TIME],
        [OTHER_DEVICE_ID, START_TIME],
      ],
      account: healthyAccount,
      byDevice: new Map([
        [DEVICE_ID, healthyDevice],
        [OTHER_DEVICE_ID, healthyDevice],
      ]),
      removed: [],
    };

    // act
    await runtime.start();
    await settle();
    await advance(1_000);
    await advance(1_000);
    const afterReappearance = {
      path: runtime.monitoringPath,
      deviceIds: store.deviceIds(),
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      anchors: [...anchors.stored],
      account: monitoringHealth.at(-1),
      byDevice: monitoringByDevice.at(-1),
      removed: [...removed],
    };
    await advance(1_000);
    const afterFirstLaterOmission = {
      path: runtime.monitoringPath,
      deviceIds: store.deviceIds(),
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      anchors: [...anchors.stored],
      account: monitoringHealth.at(-1),
      byDevice: monitoringByDevice.at(-1),
      removed: [...removed],
    };
    await advance(1_000);
    const afterSecondLaterOmission = {
      path: runtime.monitoringPath,
      deviceIds: store.deviceIds(),
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      anchors: [...anchors.stored],
      account: monitoringHealth.at(-1),
      byDevice: monitoringByDevice.at(-1),
      removed: [...removed],
    };
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { afterReappearance, afterFirstLaterOmission },
      {
        afterReappearance: expectedRetainedState,
        afterFirstLaterOmission: expectedRetainedState,
      },
    );
    assert.deepStrictEqual(
      { afterSecondLaterOmission, removalStates, calls, trustworthyInventories, commandRequests },
      {
        afterSecondLaterOmission: {
          path: 'shadow-and-poll',
          deviceIds: [OTHER_DEVICE_ID],
          snapshots: [{ ...expectedOtherSnapshot, receivedAt: START_TIME + 4_000 }],
          anchors: [[OTHER_DEVICE_ID, START_TIME]],
          account: healthyAccount,
          byDevice: new Map([[OTHER_DEVICE_ID, healthyDevice]]),
          removed: [DEVICE_ID],
        },
        removalStates: [
          {
            deviceId: DEVICE_ID,
            deviceIds: [DEVICE_ID, OTHER_DEVICE_ID],
            snapshots: [expectedSnapshot, { ...expectedOtherSnapshot, receivedAt: START_TIME + 4_000 }],
            anchors: [
              [DEVICE_ID, START_TIME],
              [OTHER_DEVICE_ID, START_TIME],
            ],
            account: healthyAccount,
            byDevice: new Map([
              [DEVICE_ID, healthyDevice],
              [OTHER_DEVICE_ID, healthyDevice],
            ]),
            calls: ['devices', 'credentials', 'shadow', 'devices', 'devices', 'devices', 'devices', 'devices', 'devices'],
          },
        ],
        calls: ['devices', 'credentials', 'shadow', 'devices', 'devices', 'devices', 'devices', 'devices', 'devices'],
        trustworthyInventories: [[DEVICE_ID, OTHER_DEVICE_ID], [OTHER_DEVICE_ID], [OTHER_DEVICE_ID], [], [OTHER_DEVICE_ID]],
        commandRequests: [],
      },
    );
    verify(requests);
    verify(removals);
    verify(commands);
    verify(inventoryListener);
  });

  for (const { title, terminalError } of [
    {
      title: 'rejects account credentials',
      terminalError: () => new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'),
    },
    {
      title: 'reports halted authentication',
      terminalError: () => new AuthHaltedError('authentication has stopped.', 'invalid_grant'),
    },
  ]) {
    test(`halts monitoring when the final inventory check ${title}`, async (t) => {
      // arrange
      const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
      const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
      const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
      const inventoryListener = mock<AccountRuntimeOptions['onTrustworthyInventory']>({ exactParams: true, name: 'trustworthy inventory listener' });
      when(() => {
        inventoryListener([DEVICE_ID]);
      }).thenReturn(undefined);
      when(() => {
        inventoryListener([]);
      })
        .thenReturn(undefined)
        .times(2);
      // The public retry factory receives the root signal before start.
      let rootSignal!: AbortSignal;
      const { runtime, store, anchors, calls, shadows, removed, monitoringHealth, monitoringByDevice, trustworthyInventories, advance, commandRequests } =
        harness(t, { pollIntervalMs: 1_000, command: commands }, undefined, {
          devices: (signal) => requests.devices(signal),
          awsCredentials: (signal) => requests.awsCredentials(signal),
          onDeviceRemoved: removals,
          onTrustworthyInventory: inventoryListener,
          createRetry: (signal) => {
            rootSignal = signal;
            return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
          },
        });
      when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
      when(() => requests.devices(rootSignal)).thenResolve([]);
      when(() => requests.devices(rootSignal)).thenResolve([]);
      when(() => requests.devices(rootSignal)).thenReject(terminalError());
      when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));
      const healthyAccount: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false };
      const healthyDevice: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false };
      const haltedAccount: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true };
      const haltedDevice: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true };
      const expectedHaltedState = {
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
        monitoringHealth: [healthyAccount, healthyAccount, haltedAccount],
        monitoringByDevice: [new Map([[DEVICE_ID, healthyDevice]]), new Map([[DEVICE_ID, healthyDevice]]), new Map([[DEVICE_ID, haltedDevice]])],
      };

      // act
      await runtime.start();
      await settle();
      await advance(1_000);
      await advance(1_000);
      const afterFinalCheck = {
        path: runtime.monitoringPath,
        snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
        anchors: [...anchors.stored],
        monitoringHealth: [...monitoringHealth],
        monitoringByDevice: [...monitoringByDevice],
      };
      const closesAfterFinalCheck = shadows[0]?.closes();
      await advance(3_600_000);
      const afterLaterWork = {
        path: runtime.monitoringPath,
        snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
        anchors: [...anchors.stored],
        monitoringHealth: [...monitoringHealth],
        monitoringByDevice: [...monitoringByDevice],
      };
      const closesBeforeStop = shadows[0]?.closes();
      await runtime.stop();

      // assert
      assert.deepStrictEqual(
        { afterFinalCheck, afterLaterWork, closesAfterFinalCheck, closesBeforeStop, calls, trustworthyInventories, removed, commandRequests },
        {
          afterFinalCheck: expectedHaltedState,
          afterLaterWork: expectedHaltedState,
          closesAfterFinalCheck: 1,
          closesBeforeStop: 1,
          calls: ['devices', 'credentials', 'shadow', 'devices', 'devices', 'devices'],
          trustworthyInventories: [[DEVICE_ID], [], []],
          removed: [],
          commandRequests: [],
        },
      );
      verify(requests);
      verify(removals);
      verify(commands);
      verify(inventoryListener);
    });
  }

  test('waits until a distant credential expiry using only representable native timer delays', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const { runtime, calls, advance } = harness(
      t,
      {
        credentials: [() => Promise.resolve(credentialsAt(START_TIME + 4_320_000_000))],
        rotationLeadMs: 10,
        minRotationDelayMs: 5,
      },
      undefined,
      {
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + 4_320_000_000));
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + 4_320_000_000));

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
    verify(requests);
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
      t.mock.timers.reset();
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
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }, new Map([]));
    }).thenReturn(undefined);

    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    // The promise constructor assigns the resolver synchronously.
    let completeRestore!: () => void;
    const restoring = new Promise<void>((resolve) => {
      completeRestore = resolve;
    });
    const anchors = { ...recordingAnchors(), restore: () => restoring };
    const { runtime, store, calls, monitoringHealth, commandRequests } = harness(t, { anchors, command: commands }, undefined, {
      devices: (signal) => requests.devices(signal),
      awsCredentials: (signal) => requests.awsCredentials(signal),
      onMonitoringHealth: listener,
    });

    // act
    const starting = runtime.start();
    await runtime.stop();
    completeRestore();
    await starting;
    await settle();

    const pathBeforeStop = runtime.monitoringPath;
    const healthBeforeStop = [...monitoringHealth];

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, snapshots: store.deviceIds(), anchors: [...anchors.stored], monitoringHealth: healthBeforeStop },
      {
        path: 'unavailable',
        snapshots: [],
        anchors: [],
        monitoringHealth: [{ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }],
      },
    );
    assert.deepStrictEqual(calls, []);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
    verify(listener);
  });

  test('admits no devices when the launch inventory resolves after shutdown', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }, new Map([]));
    }).thenReturn(undefined);

    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const inventoryListener = mock<AccountRuntimeOptions['onTrustworthyInventory']>({ exactParams: true, name: 'trustworthy inventory listener' });

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    // The promise constructor assigns the resolver synchronously.
    let completeInventory!: (devices: readonly ApiDevice[]) => void;
    const inventory = new Promise<readonly ApiDevice[]>((resolve) => {
      completeInventory = resolve;
    });
    const { runtime, store, anchors, calls, monitoringHealth, trustworthyInventories, commandRequests } = harness(
      t,
      { devices: [() => inventory], command: commands },
      undefined,
      {
        onTrustworthyInventory: inventoryListener,
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
        onMonitoringHealth: listener,
      },
    );
    when(() => requests.devices(rootSignal)).thenReturn(inventory);

    // act
    const starting = runtime.start();
    await settle();
    await runtime.stop();
    completeInventory([geminiDevice()]);
    await starting;
    await settle();

    const pathBeforeStop = runtime.monitoringPath;
    const healthBeforeStop = [...monitoringHealth];

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, snapshots: store.deviceIds(), anchors: [...anchors.stored], monitoringHealth: healthBeforeStop },
      {
        path: 'unavailable',
        snapshots: [],
        anchors: [],
        monitoringHealth: [{ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }],
      },
    );
    assert.deepStrictEqual({ calls, trustworthyInventories }, { calls: ['devices'], trustworthyInventories: [] });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(inventoryListener);
    verify(requests);
    verify(listener);
  });

  test('starts no background work when shutdown follows launch admission', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const inventoryListener = mock<AccountRuntimeOptions['onTrustworthyInventory']>({ exactParams: true, name: 'trustworthy inventory listener' });
    when(() => {
      inventoryListener([DEVICE_ID]);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, store, anchors, calls, monitoringHealth, trustworthyInventories, commandRequests } = harness(t, { command: commands }, undefined, {
      onTrustworthyInventory: inventoryListener,
      devices: (signal) => requests.devices(signal),
      awsCredentials: (signal) => requests.awsCredentials(signal),
      createRetry: (signal) => {
        rootSignal = signal;
        return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
      },
      onMonitoringHealth: listener,
    });
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);

    store.subscribe(DEVICE_ID, () => {
      queueMicrotask(() => {
        void runtime.stop();
      });
    });

    // act
    await runtime.start();
    await settle();

    const pathBeforeStop = runtime.monitoringPath;
    const healthBeforeStop = [...monitoringHealth];

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, snapshot: store.snapshot(DEVICE_ID), anchors: [...anchors.stored], monitoringHealth: healthBeforeStop },
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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(inventoryListener);
    verify(requests);
    verify(listener);
  });

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
      const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
      when(() => {
        listener(
          { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
          new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
        );
      })
        .thenReturn(undefined)
        .times(healthyReports);
      when(() => {
        listener(
          { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true },
          new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
        );
      }).thenReturn(undefined);
      when(() => {
        listener(
          { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true },
          new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
        );
      }).thenReturn(undefined);

      const inventoryListener = mock<AccountRuntimeOptions['onTrustworthyInventory']>({ exactParams: true, name: 'trustworthy inventory listener' });
      for (const deviceIds of expectedInventories) {
        when(() => {
          inventoryListener(deviceIds);
        }).thenReturn(undefined);
      }

      const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
      // The promise constructor assigns both resolvers synchronously.
      let completeInventory!: (devices: readonly ApiDevice[]) => void;
      let rejectInventory!: (error: Error) => void;
      const inventory = new Promise<readonly ApiDevice[]>((resolve, reject) => {
        completeInventory = resolve;
        rejectInventory = reject;
      });
      const { runtime, store, anchors, monitoringHealth, monitoringByDevice, trustworthyInventories, advance, commandRequests } = harness(
        t,
        {
          devices: [...precedingInventories, () => inventory],
          credentials: [() => Promise.resolve(credentialsAt(START_TIME + haltAtMs + 10)), refusingTheAccount],
          pollIntervalMs: 1_000,
          rotationLeadMs: 10,
          minRotationDelayMs: 5,
          command: commands,
        },
        undefined,
        { onTrustworthyInventory: inventoryListener, onMonitoringHealth: listener },
      );
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

      const pathBeforeStop = runtime.monitoringPath;
      const healthBeforeStop = [...monitoringHealth];
      const devicesBeforeStop = [...monitoringByDevice];
      await runtime.stop();

      // assert
      assert.deepStrictEqual(
        {
          path: pathBeforeStop,
          snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
          anchors: [...anchors.stored],
          monitoringHealth: healthBeforeStop,
          monitoringByDevice: devicesBeforeStop,
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
      assert.deepStrictEqual(commandRequests, []);
      verify(commands);
      verify(inventoryListener);
      verify(listener);
    });
  }

  test('discovers every device and stores its canonical snapshot', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, store, commandRequests } = harness(t, { command: commands });

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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('reads canonical state from the one store it maintains', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, store, commandRequests } = harness(t, { command: commands });

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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('stores the discovered inventory and reports successful monitoring', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    const { runtime, commandRequests } = harness(t, { command: commands }, failures);

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(runtime.store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
  });

  test('opens one shadow connection for every discovered device', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, commandRequests } = harness(t, { command: commands });

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual({ connections: shadows.length, subscribed: shadows[0]?.subscribed }, { connections: 1, subscribed: [[DEVICE_ID]] });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('reports the discovered deviceIds to the trustworthy-inventory listener', async (t) => {
    // arrange
    const inventoryListener = mock<AccountRuntimeOptions['onTrustworthyInventory']>({ exactParams: true, name: 'trustworthy inventory listener' });
    when(() => {
      inventoryListener([DEVICE_ID]);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, trustworthyInventories, commandRequests } = harness(t, { command: commands }, undefined, { onTrustworthyInventory: inventoryListener });

    // act
    await runtime.start();

    // assert
    assert.deepStrictEqual(trustworthyInventories, [[DEVICE_ID]]);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(inventoryListener);
  });

  test('reports an empty list to the trustworthy-inventory listener on a valid empty response', async (t) => {
    // arrange
    const inventoryListener = mock<AccountRuntimeOptions['onTrustworthyInventory']>({ exactParams: true, name: 'trustworthy inventory listener' });
    when(() => {
      inventoryListener([]);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, trustworthyInventories, commandRequests } = harness(t, { devices: [() => Promise.resolve([])], command: commands }, undefined, {
      onTrustworthyInventory: inventoryListener,
    });

    // act
    await runtime.start();

    // assert
    assert.deepStrictEqual(trustworthyInventories, [[]]);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(inventoryListener);
  });

  test('AUTH-02 registers every temporary credential value under its own rotated role', async (t) => {
    // arrange
    const registerSecret = mock<AccountRuntimeOptions['registerSecret']>({ exactParams: true, name: 'AWS credential registration' });
    when(() => {
      registerSecret('test-access-key-id', 'aws-access-key-id');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-secret-access-key', 'aws-secret-access-key');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-session-token', 'aws-session-token');
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, registrations, commandRequests } = harness(t, { command: commands }, undefined, { registerSecret });

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(registrations, [
      'aws-access-key-id test-access-key-id',
      'aws-secret-access-key test-secret-access-key',
      'aws-session-token test-session-token',
    ]);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(registerSecret);
  });

  test('reports the route and the status when the vendor refuses discovery', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('Device polling', 'Device discovery failed on GET /devices with HTTP 403.');
    }).thenReturn(undefined);
    const { runtime, store, commandRequests } = harness(
      t,
      { devices: [() => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 403.', 403, 'GET /devices'))], command: commands },
      failures,
    );

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual({ path: runtime.monitoringPath, stored: store.deviceIds() }, { path: 'unavailable', stored: [] });

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
  });

  test('reports a fixed message that repeats nothing from an unexpected discovery failure', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('Device polling', DISCOVERY_FAILED_UNEXPLAINED_LINE);
    }).thenReturn(undefined);
    const { runtime, commandRequests } = harness(
      t,
      { devices: [() => Promise.reject(new Error('connect ECONNREFUSED https://api.example.test/devices'))], command: commands },
      failures,
    );

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual({ path: runtime.monitoringPath, stored: runtime.store.deviceIds() }, { path: 'unavailable', stored: [] });

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
  });

  test('D-13 schedules nothing at all after the vendor refuses the account credentials', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      { devices: [() => Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'))], command: commands },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenReject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'));

    // act
    await runtime.start();
    await advance(ONE_HOUR_MS);

    // assert
    assert.deepStrictEqual(calls, ['devices']);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('D-22 waits the interval a throttling response carries rather than the capped backoff', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.reject(new AuthThrottledError('the vendor answered HTTP 429.', THROTTLE_RETRY_MS)), () => Promise.resolve([geminiDevice()])],
        command: commands,
      },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenReject(new AuthThrottledError('the vendor answered HTTP 429.', THROTTLE_RETRY_MS));
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);

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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('D-22 waits again when the launch that follows a throttling response is throttled too', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const throttled: () => Promise<never> = (): Promise<never> => Promise.reject(new AuthThrottledError('the vendor answered HTTP 429.', THROTTLE_RETRY_MS));
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      { devices: [throttled, throttled, () => Promise.resolve([geminiDevice()])], command: commands },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenReject(new AuthThrottledError('the vendor answered HTTP 429.', THROTTLE_RETRY_MS));
    when(() => requests.devices(rootSignal)).thenReject(new AuthThrottledError('the vendor answered HTTP 429.', THROTTLE_RETRY_MS));
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);

    // act
    await runtime.start();
    await advance(THROTTLE_RETRY_MS);
    await advance(THROTTLE_RETRY_MS);

    // assert
    assert.strictEqual(calls.filter((call) => call === 'devices').length, 3);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('performs no work when start runs after stop', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, commandRequests } = harness(t, { command: commands }, undefined, {
      devices: (signal) => requests.devices(signal),
      awsCredentials: (signal) => requests.awsCredentials(signal),
    });

    // act
    await runtime.stop();
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual(calls, []);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
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
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, anchors, shadows, monitoringByDevice, advance, commandRequests } = harness(
      t,
      { anchors: recordingAnchors([[DEVICE_ID, START_TIME - TWO_MISSED_HEARTBEATS_MS]]), command: commands },
      undefined,
      { onMonitoringHealth: listener },
    );

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
    await runtime.stop();

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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  // An install carrying no anchor judges the device from its admission and
  // seeds an anchor for the next run (D-08).
  test('D-08 vouches for a pump admitted on an install carrying no stored anchor, and anchors it from its admission', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, anchors, monitoringByDevice, commandRequests } = harness(t, { command: commands }, undefined, { onMonitoringHealth: listener });

    // act
    await runtime.start();
    await settle();
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { silent: devicesBeforeStop.at(0)?.get(DEVICE_ID)?.shadowSilent, anchor: anchors.stored.get(DEVICE_ID) },
      { silent: false, anchor: START_TIME },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  // The anchors are written where the trust is reported, which is every poll
  // outcome. The write is not awaited, so this asserts it happened rather than
  // when it completed.
  test('D-07 writes the anchors on the reporting tick', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, anchors, advance, commandRequests } = harness(t, { command: commands });
    await runtime.start();
    await settle();
    const afterTheLaunch = anchors.persists();

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ afterTheLaunch, afterAPoll: anchors.persists() }, { afterTheLaunch: 1, afterAPoll: 2 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('registers every AWS role before shadow use and replaces the next handshake credentials in place', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const credentialEvents: unknown[][] = [];
    const credentialCaches: CredentialCache[] = [];
    const registerSecret = mock<AccountRuntimeOptions['registerSecret']>({ exactParams: true, name: 'credential registration' });
    when(() => {
      registerSecret('test-access-key-id', 'aws-access-key-id');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-secret-access-key', 'aws-secret-access-key');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-session-token', 'aws-session-token');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-next-access-key-id', 'aws-access-key-id');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-next-secret-access-key', 'aws-secret-access-key');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-next-session-token', 'aws-session-token');
    }).thenReturn(undefined);
    const shadow = mock<Pick<ShadowClient, 'start' | 'close'>>({ exactParams: true, name: 'shadow lifecycle' });
    when(() => shadow.start(['account-1_serial-1'])).thenResolve(undefined);
    when(() => shadow.close()).thenResolve(undefined);
    const commands = mock<Pick<CloudApi, 'sendCommand'>>({ exactParams: true, name: 'forbidden monitoring commands' });
    let elapsedMs = 0;

    function silent(): void {
      return undefined;
    }

    const log: Logging = Object.assign(silent, { prefix: '', debug: silent, error: silent, info: silent, success: silent, warn: silent, log: silent });
    const clock: Clock = { now: () => START_TIME + elapsedMs };
    const runtime = createAccountRuntime({
      api: {
        devices: () => Promise.resolve([geminiDevice()]),
        device: () => Promise.reject(new Error('no single-device request is scripted')),
        awsCredentials: answering([() => Promise.resolve(credentialsAt(START_TIME + 1_000)), () => Promise.resolve(rotatedCredentialsAt(START_TIME + 2_000))]),
        sendCommand: (deviceId, command, signal) => commands.sendCommand(deviceId, command, signal),
      },
      store: createDeviceStateStore({ clock, log }),
      registry: createFamilyRegistry(),
      createShadow: (options) => {
        credentialCaches.push(options.credentials);
        credentialEvents.push(['shadow credentials', structuredClone(options.credentials.current())]);

        return { connected: false, start: (deviceIds) => shadow.start(deviceIds), close: () => shadow.close() };
      },
      createRetry: (signal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log }),
      pollIntervalMs: POLL_INTERVAL_MS,
      rotationLeadMs: 10,
      minRotationDelayMs: 5,
      failures: { recordFailure: silent, recordSuccess: silent, forget: silent },
      registerSecret: (secret, role) => {
        registerSecret(secret, role);
        credentialEvents.push(['register', secret, role]);
      },
      onTrustworthyInventory: silent,
      onDeviceRemoved: silent,
      onMonitoringHealth: silent,
      clock,
      monotonic: { now: () => MONOTONIC_START_TIME + elapsedMs },
      anchors: recordingAnchors(),
      log,
    });
    t.after(async () => {
      await runtime.stop();
    });

    // act
    await runtime.start();
    await settle();
    elapsedMs = 990;
    t.mock.timers.tick(990);
    await settle();
    const nextHandshakeCredentials = credentialCaches[0]?.current();
    credentialEvents.push(['next handshake credentials', structuredClone(nextHandshakeCredentials)]);
    const runningState = { path: runtime.monitoringPath, snapshot: runtime.store.snapshot(DEVICE_ID), nextHandshakeCredentials };
    await runtime.stop();

    // assert
    assert.deepStrictEqual(runningState, {
      path: 'poll-only',
      snapshot: {
        identity: { deviceId: 'account-1_serial-1', deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: 1_700_000_000_000 },
        data: { water_level: 1, primary_pump_running: false, ac_power: true },
        metadata: {},
        shadowVersion: undefined,
        deviceTimestamp: 1_700_000_000_000,
        receivedAt: START_TIME,
      },
      nextHandshakeCredentials: {
        endpoint: 'broker-two.invalid',
        clientId: 'client-second',
        accessKeyId: 'test-next-access-key-id',
        secretAccessKey: 'test-next-secret-access-key',
        sessionToken: 'test-next-session-token',
      },
    });
    assert.strictEqual(runtime.monitoringPath, 'unavailable');
    assert.deepStrictEqual(credentialEvents, [
      ['register', 'test-access-key-id', 'aws-access-key-id'],
      ['register', 'test-secret-access-key', 'aws-secret-access-key'],
      ['register', 'test-session-token', 'aws-session-token'],
      [
        'shadow credentials',
        {
          endpoint: 'broker.invalid',
          clientId: 'client-first',
          accessKeyId: 'test-access-key-id',
          secretAccessKey: 'test-secret-access-key',
          sessionToken: 'test-session-token',
        },
      ],
      ['register', 'test-next-access-key-id', 'aws-access-key-id'],
      ['register', 'test-next-secret-access-key', 'aws-secret-access-key'],
      ['register', 'test-next-session-token', 'aws-session-token'],
      [
        'next handshake credentials',
        {
          endpoint: 'broker-two.invalid',
          clientId: 'client-second',
          accessKeyId: 'test-next-access-key-id',
          secretAccessKey: 'test-next-secret-access-key',
          sessionToken: 'test-next-session-token',
        },
      ],
    ]);
    verify(registerSecret);
    verify(shadow);
    verify(commands);
  });
  test('SYNC-04 refreshes the credentials ten minutes before the expiry the response carries', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(t, { command: commands }, undefined, {
      awsCredentials: (signal) => requests.awsCredentials(signal),
      createRetry: (signal) => {
        rootSignal = signal;
        return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
      },
    });
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));

    await runtime.start();
    await settle();

    // act
    await advance(ROTATION_DELAY_MS - 1);
    const beforeDue = calls.filter((call) => call === 'credentials').length;
    await advance(1);

    // assert
    assert.deepStrictEqual({ beforeDue, afterDue: calls.filter((call) => call === 'credentials').length }, { beforeDue: 1, afterDue: 2 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('holds the delay at the injected floor when the response already expires inside the injected lead window', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      {
        credentials: [() => Promise.resolve(credentialsAt(START_TIME + SHORT_ROTATION_LEAD_MS))],
        rotationLeadMs: SHORT_ROTATION_LEAD_MS,
        minRotationDelayMs: SHORT_ROTATION_FLOOR_MS,
        command: commands,
      },
      undefined,
      {
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + SHORT_ROTATION_LEAD_MS));
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + SHORT_ROTATION_LEAD_MS));

    await runtime.start();
    await settle();

    // act
    await advance(SHORT_ROTATION_FLOOR_MS - 1);
    const beforeFloor = calls.filter((call) => call === 'credentials').length;
    await advance(1);

    // assert
    assert.deepStrictEqual({ beforeFloor, afterFloor: calls.filter((call) => call === 'credentials').length }, { beforeFloor: 1, afterFloor: 2 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('SYNC-04 takes the injected lead when the expiry sits further out than the injected floor', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      {
        credentials: [() => Promise.resolve(credentialsAt(START_TIME + SHORT_CREDENTIAL_LIFETIME_MS))],
        rotationLeadMs: SHORT_ROTATION_LEAD_MS,
        minRotationDelayMs: SHORT_ROTATION_FLOOR_MS,
        command: commands,
      },
      undefined,
      {
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + SHORT_CREDENTIAL_LIFETIME_MS));
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + SHORT_CREDENTIAL_LIFETIME_MS));

    await runtime.start();
    await settle();

    // act
    await advance(SHORT_CREDENTIAL_LIFETIME_MS - SHORT_ROTATION_LEAD_MS - 1);
    const beforeDue = calls.filter((call) => call === 'credentials').length;
    await advance(1);

    // assert
    assert.deepStrictEqual({ beforeDue, afterDue: calls.filter((call) => call === 'credentials').length }, { beforeDue: 1, afterDue: 2 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('SYNC-04 schedules the next rotation from the new expiry rather than the first one', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      {
        credentials: [
          () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
          () => Promise.resolve(rotatedCredentialsAt(START_TIME + ROTATION_DELAY_MS + ONE_HOUR_MS)),
        ],
        command: commands,
      },
      undefined,
      {
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));
    when(() => requests.awsCredentials(rootSignal)).thenResolve(rotatedCredentialsAt(START_TIME + ROTATION_DELAY_MS + ONE_HOUR_MS));
    when(() => requests.awsCredentials(rootSignal)).thenResolve(rotatedCredentialsAt(START_TIME + ROTATION_DELAY_MS + ONE_HOUR_MS));

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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('SYNC-04 arms the next rotation even after a refresh that rejects', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      {
        credentials: [
          () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
          () => Promise.reject(new CloudRequestError('GET /credentials/aws failed with HTTP 503.', 503, 'GET /credentials/aws')),
          () => Promise.resolve(rotatedCredentialsAt(START_TIME + ROTATION_DELAY_MS + ONE_HOUR_MS)),
        ],
        command: commands,
      },
      undefined,
      {
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));
    when(() => requests.awsCredentials(rootSignal)).thenReject(
      new CloudRequestError('GET /credentials/aws failed with HTTP 503.', 503, 'GET /credentials/aws'),
    );
    when(() => requests.awsCredentials(rootSignal)).thenResolve(rotatedCredentialsAt(START_TIME + ROTATION_DELAY_MS + ONE_HOUR_MS));

    await runtime.start();
    await settle();
    await advance(ROTATION_DELAY_MS);

    // act
    await advance(29_999);
    const beforeFloor = calls.filter((call) => call === 'credentials').length;
    await advance(1);

    // assert
    assert.deepStrictEqual({ beforeFloor, afterFloor: calls.filter((call) => call === 'credentials').length }, { beforeFloor: 2, afterFloor: 3 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('reports every failed credential refresh without changing the live monitoring path', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('Credential rotation', ROTATION_FAILED_LINE);
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    }).thenReturn(undefined);
    const { runtime, advance, commandRequests, monitoringByDevice } = harness(
      t,
      {
        credentials: [
          () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
          () => Promise.reject(new CloudRequestError('GET /credentials/aws failed with HTTP 503.', 503, 'GET /credentials/aws')),
        ],
        command: commands,
      },
      failures,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await settle();

    // act
    await advance(ROTATION_DELAY_MS);
    await advance(MIN_ROTATION_DELAY_MS);
    await advance(MIN_ROTATION_DELAY_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('SYNC-04 replaces what the next handshake reads and leaves the live connection alone', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, advance, commandRequests } = harness(t, {
      credentials: [
        () => Promise.resolve(credentialsAt(START_TIME + ONE_HOUR_MS)),
        () => Promise.resolve(rotatedCredentialsAt(START_TIME + ROTATION_DELAY_MS + ONE_HOUR_MS)),
      ],
      command: commands,
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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('holds the delay at the injected floor when the vendor expiry cannot be read as a date', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const unreadable = { ...credentialsAt(START_TIME + ONE_HOUR_MS) };
    unreadable.credentials = { ...unreadable.credentials, Expiration: 'whenever' };
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      { credentials: [() => Promise.resolve(unreadable)], minRotationDelayMs: SHORT_ROTATION_FLOOR_MS, command: commands },
      undefined,
      {
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.awsCredentials(rootSignal)).thenResolve(unreadable);
    when(() => requests.awsCredentials(rootSignal)).thenResolve(unreadable);

    await runtime.start();
    await settle();

    // act
    await advance(SHORT_ROTATION_FLOOR_MS);

    // assert
    assert.strictEqual(calls.filter((call) => call === 'credentials').length, 2);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('SYNC-04 gives the shadow client a reconnect policy the runtime own retry has not advanced', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, advance, commandRequests } = harness(t, { shadow: [false, true], command: commands });
    await runtime.start();
    await settle();

    // act
    await advance(500);

    // assert
    assert.deepStrictEqual({ connections: shadows.length, shadowAttempt: shadows[0]?.options.retry.attempt }, { connections: 1, shadowAttempt: 0 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('preserves whole canonical state through accepted, superseded and observation-free shadow callbacks', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'forbidden monitoring commands' });
    const { runtime, store, shadows, advance, commandRequests } = harness(t, { command: commands });
    const expectedAccepted: DeviceSnapshot = {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 3, primary_pump_running: false, ac_power: true, readings: { depth: 3 } },
      metadata: { firmware: { version: 'v9' } },
      shadowVersion: 7,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 123,
    };
    const expectedMetadata: DeviceSnapshot = {
      ...expectedAccepted,
      metadata: { firmware: { version: 'v9' }, radio: { signal: -54 } },
      shadowVersion: 9,
      receivedAt: START_TIME + 246,
    };

    // act
    await runtime.start();
    await settle();
    await advance(123);
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, {
      data: { water_level: 3, readings: { depth: 3 } },
      state: { firmware: { version: 'v9' } },
      version: 7,
    });
    const afterAccepted = store.snapshot(DEVICE_ID);
    await advance(123);
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, { data: undefined, state: { radio: { signal: -54 } }, version: 9 });
    const afterMetadata = store.snapshot(DEVICE_ID);
    await advance(123);
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, { data: { water_level: 0 }, state: { firmware: 'superseded' }, version: 8 });
    const afterRefused = store.snapshot(DEVICE_ID);
    await advance(123);
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, { data: undefined, state: undefined, version: 10 });
    const afterEmpty = store.snapshot(DEVICE_ID);
    await runtime.stop();

    // assert
    assert.deepStrictEqual(afterAccepted, expectedAccepted);
    assert.deepStrictEqual(afterMetadata, expectedMetadata);
    assert.deepStrictEqual(afterRefused, expectedMetadata);
    assert.deepStrictEqual(afterEmpty, { ...expectedMetadata, shadowVersion: 10 });
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), { ...expectedMetadata, shadowVersion: 10 });
    assert.strictEqual(afterRefused, afterMetadata);
    assert.strictEqual(Object.isFrozen(afterEmpty), true);
    assert.strictEqual(Object.isFrozen(afterEmpty.identity), true);
    assert.strictEqual(Object.isFrozen(afterEmpty.connectivity), true);
    assert.strictEqual(Object.isFrozen(afterEmpty.data), true);
    assert.strictEqual(Object.isFrozen(afterEmpty.data.readings), true);
    assert.strictEqual(Object.isFrozen(afterEmpty.metadata), true);
    assert.strictEqual(Object.isFrozen(afterEmpty.metadata.firmware), true);
    assert.strictEqual(Object.isFrozen(afterEmpty.metadata.radio), true);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });
  test('SYNC-03 reconciles every device again at the configured interval', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled inventory requests' });
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    let rootSignal!: AbortSignal;
    const { runtime, store, advance, calls, commandRequests } = harness(t, { command: commands }, undefined, {
      devices: (signal) => requests.devices(signal),
      awsCredentials: (signal) => requests.awsCredentials(signal),
      createRetry: (signal) => {
        rootSignal = signal;
        return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
      },
    });
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([{ ...geminiDevice(), data: { water_level: 3 } }]);
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));
    await runtime.start();
    await settle();

    // act
    await advance(899_999);
    const beforeDeadline = { snapshot: store.snapshot(DEVICE_ID), calls: [...calls], commandRequests: [...commandRequests] };
    await advance(1);

    // assert
    assert.deepStrictEqual(beforeDeadline, {
      snapshot: {
        identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: DEVICE_TIME },
        data: { water_level: 1, primary_pump_running: false, ac_power: true },
        metadata: {},
        shadowVersion: undefined,
        deviceTimestamp: DEVICE_TIME,
        receivedAt: START_TIME,
      },
      calls: ['devices', 'credentials', 'shadow'],
      commandRequests: [],
    });
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 3 },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 900_000,
    });
    assert.deepStrictEqual(store.snapshot(DEVICE_ID)?.data, { water_level: 3 });
    assert.deepStrictEqual(calls, ['devices', 'credentials', 'shadow', 'devices']);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('D-014 leaves every stored snapshot unchanged when a poll rejects', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, store, advance, commandRequests } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
      ],
      command: commands,
    });
    await runtime.start();
    await settle();
    const beforePoll: DeviceSnapshot | undefined = store.snapshot(DEVICE_ID);

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(beforePoll, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), beforePoll);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('leaves connectivity alone when a poll rejects, because a failed request is not a device report', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, store, advance, commandRequests } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
      ],
      command: commands,
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);

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
    assert.deepStrictEqual(store.snapshot(DEVICE_ID)?.connectivity, { connected: true, timestamp: DEVICE_TIME });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('schedules the next poll after one that rejects', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      {
        devices: [
          () => Promise.resolve([geminiDevice()]),
          () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
          () => Promise.resolve([geminiDevice()]),
        ],
        command: commands,
      },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenReject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'));
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);

    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.strictEqual(calls.filter((call) => call === 'devices').length, 3);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('SYNC-05 reports no failure when a shutdown aborts a poll that is in flight', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    const { runtime, advance, commandRequests, monitoringByDevice } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice()]), (signal: AbortSignal) => hangingUntilAborted(signal)], command: commands },
      failures,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await settle();
    await advance(POLL_INTERVAL_MS);

    // act
    await runtime.stop();
    await settle();

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'unavailable',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('SYNC-02 keeps the telemetry and metadata a later poll would overwrite while the shadow owns them', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([{ ...geminiDevice(), data: { water_level: 4 } }])],
      command: commands,
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 2 }, state: { firmware: 'v9' }, version: 7 });

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 2, primary_pump_running: false, ac_power: true },
      metadata: { firmware: 'v9' },
      shadowVersion: 7,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 900_000,
    });
    assert.deepStrictEqual(
      { data: store.snapshot(DEVICE_ID)?.data, metadata: store.snapshot(DEVICE_ID)?.metadata, shadowVersion: store.snapshot(DEVICE_ID)?.shadowVersion },
      { data: { water_level: 2, primary_pump_running: false, ac_power: true }, metadata: { firmware: 'v9' }, shadowVersion: 7 },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
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
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const floodedDevice = { ...geminiDevice(), data: { ...geminiDevice().data, water_level: PROVISIONAL_FLOOD_WATER_LEVEL_CODE } };
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([geminiDevice()]), () => Promise.resolve([floodedDevice])],
      command: commands,
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: 5 });

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 31, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 1_800_000,
    });
    assert.strictEqual(store.snapshot(DEVICE_ID)?.data.water_level, PROVISIONAL_FLOOD_WATER_LEVEL_CODE);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
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
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const floodedDevice = { ...geminiDevice(), data: { ...geminiDevice().data, water_level: PROVISIONAL_FLOOD_WATER_LEVEL_CODE } };
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      devices: [
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([geminiDevice()]),
        () => Promise.resolve([floodedDevice]),
      ],
      command: commands,
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
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 31, primary_pump_running: false, ac_power: true },
      metadata: { mcu_firmware_version: '1.4.2' },
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 2_700_000,
    });
    assert.deepStrictEqual(
      {
        waterLevel: store.snapshot(DEVICE_ID)?.data.water_level,
        metadata: store.snapshot(DEVICE_ID)?.metadata,
        shadowVersion: store.snapshot(DEVICE_ID)?.shadowVersion,
      },
      { waterLevel: PROVISIONAL_FLOOD_WATER_LEVEL_CODE, metadata: { mcu_firmware_version: '1.4.2' }, shadowVersion: undefined },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  // Roughly fifteen minutes of quiet is ordinary, so one missed heartbeat is
  // evidence of nothing and the shadow still owns telemetry. A pump run the
  // live path reported is not erased by a poll that happens to arrive during
  // it (SYNC-02, D-05).
  test('D-13 keeps a pump run the live path reported when a poll arrives inside the two-heartbeat window', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const stoppedPump = { ...geminiDevice(), data: { ...geminiDevice().data, primary_pump_running: false } };
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([stoppedPump])],
      command: commands,
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: 5 });

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: true, ac_power: true },
      metadata: {},
      shadowVersion: 5,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 900_000,
    });
    assert.strictEqual(store.snapshot(DEVICE_ID)?.data.primary_pump_running, true);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
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
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failing: () => Promise<ApiDevice[]> = (): Promise<ApiDevice[]> =>
      Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'));
    const stoppedPump = { ...geminiDevice(), data: { ...geminiDevice().data, primary_pump_running: false } };
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
      devices: [() => Promise.resolve([geminiDevice()]), failing, failing, () => Promise.resolve([stoppedPump])],
      command: commands,
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: 5 });

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: true, ac_power: true },
      metadata: {},
      shadowVersion: 5,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 3_000,
    });
    assert.strictEqual(store.snapshot(DEVICE_ID)?.data.primary_pump_running, true);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  // Ownership returns through the patch path that already exists: the arriving
  // document stamps the message, so the next poll performs no handover, and it
  // re-establishes the watermark on its way through `applyReportedPatch`. Once
  // the live path speaks again, a pump run it reports is not erased by the next
  // poll's older body (SYNC-03, D-13).
  test('D-13 lets the live path own telemetry again on the first message that carries an observation', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const stoppedPump = { ...geminiDevice(), data: { ...geminiDevice().data, primary_pump_running: false } };
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([geminiDevice()]), () => Promise.resolve([stoppedPump])],
      command: commands,
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
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: true, ac_power: true },
      metadata: {},
      shadowVersion: 6,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 2_700_000,
    });
    assert.deepStrictEqual(
      { pumpRunning: store.snapshot(DEVICE_ID)?.data.primary_pump_running, shadowVersion: store.snapshot(DEVICE_ID)?.shadowVersion },
      { pumpRunning: true, shadowVersion: 6 },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('D-15 lets the poll write telemetry again once the shadow connection is gone', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([{ ...geminiDevice(), data: { water_level: 4 } }])],
      command: commands,
    });
    await runtime.start();
    await settle();
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 2 }, state: undefined, version: 7 });

    // act
    shadows[0]?.options.onDisconnected('transport-closed');
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 4 },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 900_000,
    });
    assert.deepStrictEqual(store.snapshot(DEVICE_ID)?.data, { water_level: 4 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
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
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve(bothDevicesAt(1)), () => Promise.resolve(bothDevicesAt(1)), () => Promise.resolve(bothDevicesAt(7))],
      command: commands,
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
      [store.snapshot(DEVICE_ID), store.snapshot(OTHER_DEVICE_ID)],
      [
        {
          identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: DEVICE_TIME },
          data: { water_level: 7, primary_pump_running: false, ac_power: true },
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: DEVICE_TIME,
          receivedAt: START_TIME + 1_800_000,
        },
        {
          identity: { deviceId: OTHER_DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: DEVICE_TIME },
          data: { water_level: 3, primary_pump_running: false, ac_power: true },
          metadata: {},
          shadowVersion: 7,
          deviceTimestamp: DEVICE_TIME,
          receivedAt: START_TIME + 1_800_000,
        },
      ],
    );
    assert.deepStrictEqual(
      {
        quiet: store.snapshot(DEVICE_ID)?.data.water_level,
        quietVersion: store.snapshot(DEVICE_ID)?.shadowVersion,
        healthy: store.snapshot(OTHER_DEVICE_ID)?.data.water_level,
        healthyVersion: store.snapshot(OTHER_DEVICE_ID)?.shadowVersion,
      },
      { quiet: 7, quietVersion: undefined, healthy: 3, healthyVersion: 7 },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  // A connection that ended took every device's live path with it, so this
  // handover really is fleet-wide -- unlike the silence one above, which names
  // the controller that stopped speaking (D-15, SYNC-03).
  test('D-15 hands every pump back to the poll when the connection that carried them all ends', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve(bothDevicesAt(1)), () => Promise.resolve(bothDevicesAt(7))],
      command: commands,
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
      [store.snapshot(DEVICE_ID), store.snapshot(OTHER_DEVICE_ID)],
      [
        {
          identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: DEVICE_TIME },
          data: { water_level: 7, primary_pump_running: false, ac_power: true },
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: DEVICE_TIME,
          receivedAt: START_TIME + 900_000,
        },
        {
          identity: { deviceId: OTHER_DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: DEVICE_TIME },
          data: { water_level: 7, primary_pump_running: false, ac_power: true },
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: DEVICE_TIME,
          receivedAt: START_TIME + 900_000,
        },
      ],
    );
    assert.deepStrictEqual(
      { first: store.snapshot(DEVICE_ID)?.data.water_level, second: store.snapshot(OTHER_DEVICE_ID)?.data.water_level },
      { first: 7, second: 7 },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-03 lets a shadow document that arrives after a poll win on the keys it carries', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, store, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([{ ...geminiDevice(), data: { water_level: 4, ac_power: true } }])],
      command: commands,
    });
    await runtime.start();
    await settle();
    await advance(POLL_INTERVAL_MS);

    // act
    shadows[0]?.options.onReportedPatch(DEVICE_ID, { data: { water_level: 5 }, state: undefined, version: 1 });

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 5, ac_power: true },
      metadata: {},
      shadowVersion: 1,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 900_000,
    });
    assert.deepStrictEqual(store.snapshot(DEVICE_ID)?.data, { water_level: 5, ac_power: true });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 resolves both calls and closes the connection once when stop is called twice', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, commandRequests } = harness(t, { command: commands });
    await runtime.start();
    await settle();

    // act
    await runtime.stop();
    await runtime.stop();

    // assert
    assert.strictEqual(shadows[0]?.closes(), 1);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 resolves after a start that stopped at authentication', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, commandRequests } = harness(t, {
      devices: [() => Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'))],
      command: commands,
    });
    await runtime.start();
    await settle();

    // act
    const stopping = runtime.stop();
    await stopping;

    // assert
    await assert.doesNotReject(stopping);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 resolves after a start that failed at discovery', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, commandRequests } = harness(t, {
      devices: [() => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'))],
      command: commands,
    });
    await runtime.start();
    await settle();

    // act
    const stopping = runtime.stop();
    await stopping;

    // assert
    await assert.doesNotReject(stopping);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 resolves when nothing was ever started', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, commandRequests } = harness(t, { command: commands });

    // act
    const stopping = runtime.stop();
    await stopping;

    // assert
    await assert.doesNotReject(stopping);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 cancels a pending retry wait so the attempt it was waiting for never runs', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(t, { shadow: [false], command: commands });
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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 closes a shadow connection whose start resolved only after the shutdown began', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    // The shutdown lands after the connection is open and before the runtime
    // has recorded it, which is the window where nothing would close it.
    const stopped = { runtime: undefined as AccountRuntime | undefined };
    const { runtime, shadows, commandRequests } = harness(t, { whileShadowStarts: () => stopped.runtime?.stop() ?? Promise.resolve(), command: commands });
    stopped.runtime = runtime;

    // act
    await runtime.start();
    await settle();

    // assert
    assert.strictEqual(shadows[0]?.closes(), 1);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 raises nothing when the connection opened during a shutdown cannot be closed', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const stopped = { runtime: undefined as AccountRuntime | undefined };
    const { runtime, commandRequests } = harness(t, {
      closeFails: true,
      whileShadowStarts: () => stopped.runtime?.stop() ?? Promise.resolve(),
      command: commands,
    });
    stopped.runtime = runtime;

    // act
    const starting = runtime.start();
    await starting;
    await settle();

    // assert
    await assert.doesNotReject(starting);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 schedules nothing and reports no failure when a shutdown aborts the launch', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'aborted launch requests' });
    let rootSignal!: AbortSignal;

    const { runtime, calls, commandRequests } = harness(t, { command: commands }, failures, {
      devices: (signal) => requests.devices(signal),
      awsCredentials: (signal) => requests.awsCredentials(signal),
      createRetry: (signal) => {
        rootSignal = signal;

        return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
      },
    });
    when(() => requests.devices(rootSignal)).thenReturn(hangingUntilAborted(rootSignal));
    const starting = runtime.start();
    await settle();

    // act
    await runtime.stop();
    await starting;
    await settle();

    // assert
    assert.deepStrictEqual({ path: runtime.monitoringPath, stored: runtime.store.deviceIds() }, { path: 'unavailable', stored: [] });
    assert.deepStrictEqual(calls, ['devices']);

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(requests);
  });

  test('SYNC-05 reports monitoring unavailable once the runtime has stopped', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, commandRequests } = harness(t, { command: commands });
    await runtime.start();
    await settle();
    const beforeStop = runtime.monitoringPath;

    // act
    await runtime.stop();

    // assert
    assert.deepStrictEqual({ beforeStop, afterStop: runtime.monitoringPath }, { beforeStop: 'shadow-and-poll', afterStop: 'unavailable' });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 records no failure when a shutdown aborts a poll already in flight', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    const { runtime, advance, commandRequests, monitoringByDevice } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice()]), hangingUntilAborted], command: commands },
      failures,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await settle();
    await advance(POLL_INTERVAL_MS);

    // act
    await runtime.stop();
    await settle();

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'unavailable',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
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
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, monitoringHealth, commandRequests } = harness(t, { command: commands }, undefined, { onMonitoringHealth: listener });
    await runtime.start();
    await settle();
    const beforeStop = [...monitoringHealth];

    // act
    await runtime.stop();
    const healthBeforeStop = [...monitoringHealth];

    // assert
    assert.deepStrictEqual(
      { beforeStop, afterStop: healthBeforeStop },
      {
        beforeStop: [{ restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false }],
        afterStop: [
          { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
          { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: false },
        ],
      },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  test('SYNC-05 pushes once when a shutdown runs twice, because the second call returns before anything else', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, monitoringHealth, commandRequests } = harness(t, { command: commands }, undefined, { onMonitoringHealth: listener });
    await runtime.start();
    await settle();
    const beforeStop = monitoringHealth.length;

    // act
    await runtime.stop();
    await runtime.stop();
    const healthBeforeStop = [...monitoringHealth];

    // assert
    assert.deepStrictEqual({ beforeStop, afterStop: healthBeforeStop.length }, { beforeStop: 1, afterStop: 2 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  // A runtime nothing ever started has no poll behind it, so its transport was never ready and the
  // push says so. The rule stays one-sided: the tier learns the transport is gone from the runtime
  // saying so, never by inferring it from a report that did not arrive.
  test('pushes the unready transport when a runtime that never started stops', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }, new Map([]));
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, monitoringHealth, commandRequests } = harness(t, { command: commands }, undefined, { onMonitoringHealth: listener });

    // act
    await runtime.stop();
    const healthBeforeStop = [...monitoringHealth];

    // assert
    assert.deepStrictEqual(healthBeforeStop, [
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: false },
    ]);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  test('SYNC-05 arms no timer that outlives it', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(t, { command: commands }, undefined, {
      devices: (signal) => requests.devices(signal),
      awsCredentials: (signal) => requests.awsCredentials(signal),
      createRetry: (signal) => {
        rootSignal = signal;
        return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
      },
    });
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));

    await runtime.start();
    await settle();
    const callsBeforeStop = calls.length;

    // act
    await runtime.stop();
    await advance(ONE_HOUR_MS);

    // assert
    assert.deepStrictEqual({ callsBeforeStop, callsAfterStop: calls.length }, { callsBeforeStop: 3, callsAfterStop: 3 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('reports monitoring unavailable before anything has succeeded', (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, commandRequests } = harness(t, { command: commands });

    // act
    const path = runtime.monitoringPath;

    // assert
    assert.strictEqual(path, 'unavailable');
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('reports monitoring unavailable while the poll is failing and the shadow is down, and the polling-only path once a poll succeeds', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, advance, commandRequests } = harness(t, {
      devices: [
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
        () => Promise.resolve([geminiDevice()]),
      ],
      shadow: [false],
      command: commands,
    });
    await runtime.start();
    await settle();
    const whileFailing = runtime.monitoringPath;

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ whileFailing, afterRecovery: runtime.monitoringPath }, { whileFailing: 'unavailable', afterRecovery: 'poll-only' });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('D-13 reports monitoring unavailable and records the stop when the vendor refuses the account credentials', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, new Map([]));
    }).thenReturn(undefined);
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, new Map([]));
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordFailure('Authentication', STOPPED_LINE);
    }).thenReturn(undefined);
    const { runtime, commandRequests, monitoringHealth } = harness(
      t,
      { devices: [() => Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'))], command: commands },
      failures,
      { onMonitoringHealth: listener },
    );

    // act
    await runtime.start();
    await settle();

    const pathBeforeStop = runtime.monitoringPath;
    const healthBeforeStop = [...monitoringHealth];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, monitoringHealth: healthBeforeStop, stored: runtime.store.deviceIds() },
      {
        path: 'unavailable',
        monitoringHealth: [{ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }],
        stored: [],
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('D-13 reports monitoring unavailable and records the stop when authentication has halted', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, new Map([]));
    }).thenReturn(undefined);
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, new Map([]));
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordFailure('Authentication', STOPPED_LINE);
    }).thenReturn(undefined);
    const { runtime, commandRequests, monitoringHealth } = harness(
      t,
      { devices: [() => Promise.reject(new AuthHaltedError('authentication has stopped.', 'invalid_grant'))], command: commands },
      failures,
      { onMonitoringHealth: listener },
    );

    // act
    await runtime.start();
    await settle();

    const pathBeforeStop = runtime.monitoringPath;
    const healthBeforeStop = [...monitoringHealth];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, monitoringHealth: healthBeforeStop, stored: runtime.store.deviceIds() },
      {
        path: 'unavailable',
        monitoringHealth: [{ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }],
        stored: [],
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('D-22 recovers the combined path after a throttled answer rather than claiming the runtime stopped for good', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('Authentication', 'Authentication is being throttled, so the plugin is waiting before it tries again.');
    }).thenReturn(undefined);
    const { runtime, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.reject(new AuthThrottledError('the vendor answered HTTP 429.', THROTTLE_RETRY_MS)), () => Promise.resolve([geminiDevice()])],
        command: commands,
      },
      failures,
    );
    await runtime.start();
    await settle();
    const whileWaiting = runtime.monitoringPath;

    // act
    await advance(THROTTLE_RETRY_MS);

    // assert
    assert.deepStrictEqual({ whileWaiting, afterRetry: runtime.monitoringPath }, { whileWaiting: 'unavailable', afterRetry: 'shadow-and-poll' });

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
  });

  test('D-15 stays up on the polling-only path when the shadow connection fails', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, advance, commandRequests } = harness(t, { shadow: [false], command: commands });

    // act
    await runtime.start();
    await advance(0);

    // assert
    assert.strictEqual(runtime.monitoringPath, 'poll-only');
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('D-15 reports each failed shadow attempt while retaining polling', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('The shadow connection', DEGRADED_LINE);
    })
      .thenReturn(undefined)
      .times(3);
    const { runtime, calls, advance, commandRequests } = harness(t, { shadow: [false], command: commands }, failures);
    await runtime.start();
    await settle();

    // act
    await advance(500);
    await advance(1_000);

    // assert
    assert.strictEqual(runtime.monitoringPath, 'poll-only');
    assert.strictEqual(calls.filter((call) => call === 'shadow').length, 3);

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
  });

  test('D-15 leaves a pending retry chain to reconnect rather than attempting again from every poll', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(t, { shadow: [false], pollIntervalMs: 100, command: commands }, undefined, {
      devices: (signal) => requests.devices(signal),
      createRetry: (signal) => {
        rootSignal = signal;
        return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
      },
    });
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);

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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  test('D-15 reports a successful shadow retry and restores the combined path', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('The shadow connection', DEGRADED_LINE);
    }).thenReturn(undefined);
    const { runtime, advance, commandRequests, monitoringByDevice } = harness(t, { shadow: [false, true], command: commands }, failures, {
      onMonitoringHealth: listener,
    });
    await runtime.start();
    await settle();

    // act
    await advance(500);

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('reads as the combined path once the shadow connection reports itself up', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, commandRequests } = harness(t, { command: commands });

    // act
    await runtime.start();
    await settle();

    // assert
    assert.strictEqual(runtime.monitoringPath, 'shadow-and-poll');
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('falls back to the polling-only path without reporting a fault when the connection closes', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    const { runtime, shadows, commandRequests, monitoringByDevice } = harness(t, { command: commands }, failures, { onMonitoringHealth: listener });
    await runtime.start();
    await settle();

    // act
    shadows[0]?.options.onDisconnected('transport-closed');

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'poll-only',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('SYNC-04 reports no fault for the daily reconnect the provider connection ceiling forces', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    })
      .thenReturn(undefined)
      .times(2);
    const { runtime, shadows, commandRequests, monitoringByDevice } = harness(t, { command: commands }, failures, { onMonitoringHealth: listener });
    await runtime.start();
    await settle();

    // act
    shadows[0]?.options.onDisconnected('transport-closed');
    shadows[0]?.options.onConnected();

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('D-15 reports each connection failure while retaining the polling path', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('The shadow connection', DEGRADED_LINE);
    })
      .thenReturn(undefined)
      .times(3);
    const { runtime, shadows, commandRequests, monitoringByDevice } = harness(t, { command: commands }, failures, { onMonitoringHealth: listener });
    await runtime.start();
    await settle();

    // act
    shadows[0]?.options.onDisconnected('transport-error');
    shadows[0]?.options.onDisconnected('transport-error');
    shadows[0]?.options.onDisconnected('transport-error');

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'poll-only',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('D-15 reports the degraded path when the broker refuses the subscription', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('The shadow connection', DEGRADED_LINE);
    }).thenReturn(undefined);
    const { runtime, shadows, commandRequests, monitoringByDevice } = harness(t, { command: commands }, failures, { onMonitoringHealth: listener });
    await runtime.start();
    await settle();

    // act
    shadows[0]?.options.onDisconnected('subscription-refused');

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'poll-only',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  for (const reason of ['transport-closed', 'transport-error', 'subscription-refused', 'handshake-refused'] as const) {
    test(`SYNC-03 hands telemetry back to the poll when the connection reports ${reason}`, async (t) => {
      // arrange
      const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
      const { runtime, shadows, store, advance, commandRequests } = harness(t, { command: commands });
      await runtime.start();
      await settle();
      await advance(123);
      store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7 }, state: { firmware: 'v9' }, version: 90 });

      // act
      shadows[0]?.options.onDisconnected(reason);
      const snapshot = store.snapshot(DEVICE_ID);

      // assert
      assert.deepStrictEqual(snapshot, {
        identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: DEVICE_TIME },
        data: { water_level: 7, primary_pump_running: false, ac_power: true },
        metadata: { firmware: 'v9' },
        shadowVersion: undefined,
        deviceTimestamp: DEVICE_TIME,
        receivedAt: START_TIME + 123,
      });
      assert.strictEqual(Object.isFrozen(snapshot), true);
      assert.strictEqual(Object.isFrozen(snapshot.identity), true);
      assert.strictEqual(Object.isFrozen(snapshot.connectivity), true);
      assert.strictEqual(Object.isFrozen(snapshot.data), true);
      assert.strictEqual(Object.isFrozen(snapshot.metadata), true);
      assert.strictEqual(store.snapshot(DEVICE_ID)?.shadowVersion, undefined);
      assert.deepStrictEqual(commandRequests, []);
      verify(commands);
    });
  }

  test('SYNC-05 closes the shadow connection when the runtime stops', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, commandRequests } = harness(t, { command: commands });
    await runtime.start();
    await settle();

    // act
    await runtime.stop();

    // assert
    assert.strictEqual(shadows[0]?.closes(), 1);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('SYNC-05 resolves stop when the shadow connection cannot be closed', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, commandRequests } = harness(t, { closeFails: true, command: commands });
    await runtime.start();
    await settle();

    // act
    const stopping = runtime.stop();
    await stopping;

    // assert
    await assert.doesNotReject(stopping);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('opens no shadow connection while discovery has returned no device', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(t, {
      devices: [() => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'))],
      command: commands,
    });

    // act
    await runtime.start();
    await advance(0);

    // assert
    assert.deepStrictEqual(
      calls.filter((call) => call === 'shadow'),
      [],
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('reports the polling path degraded on the second consecutive failure and trusted again on the next success', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: true, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failing: () => Promise<readonly ApiDevice[]> = (): Promise<readonly ApiDevice[]> =>
      Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'));
    const { runtime, monitoringHealth, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice()]), failing, failing, () => Promise.resolve([geminiDevice()])],
        pollIntervalMs: FAST_POLL_INTERVAL_MS,
        command: commands,
      },
      undefined,
      { onMonitoringHealth: listener },
    );
    await runtime.start();

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);
    const healthBeforeStop = [...monitoringHealth];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      healthBeforeStop.map((trust) => trust.restDegraded),
      [false, false, true, false],
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  // The two thresholds answer different questions, and this is the case that separates them. One
  // failed poll must not withdraw trust in a displayed value -- the REST threshold is two, so a blip
  // cannot flap a tile -- but it is enough to say the plugin has no proven way to reach the vendor,
  // because sending into a route that has just failed buys a round trip ending as a vendor error,
  // which is the blur the per-cause status table exists to prevent (RES-04, D-07).
  test('reports the command transport unready after a single failed poll, with neither degradation field moved', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failing: () => Promise<readonly ApiDevice[]> = (): Promise<readonly ApiDevice[]> =>
      Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'));
    const { runtime, monitoringHealth, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice()]), failing, () => Promise.resolve([geminiDevice()])],
        pollIntervalMs: FAST_POLL_INTERVAL_MS,
        command: commands,
      },
      undefined,
      { onMonitoringHealth: listener },
    );
    await runtime.start();

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);
    const healthBeforeStop = [...monitoringHealth];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(healthBeforeStop, [
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: false },
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
    ]);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
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
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, new Map([]));
    }).thenReturn(undefined);
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, new Map([]));
    }).thenReturn(undefined);

    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, monitoringHealth, calls, advance, commandRequests } = harness(
      t,
      { devices: [() => Promise.reject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'))], command: commands },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
        onMonitoringHealth: listener,
      },
    );
    when(() => requests.devices(rootSignal)).thenReject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'));

    // act
    await runtime.start();
    await settle();
    await advance(POLL_INTERVAL_MS);
    const healthBeforeStop = [...monitoringHealth];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { monitoringHealth: healthBeforeStop, calls },
      {
        monitoringHealth: [{ restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: true }],
        calls: ['devices'],
      },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
    verify(listener);
  });

  // A password changed at the vendor, or a block applied to the account, can arrive after a
  // successful launch. That refusal requires a rejected-credential trust report and an
  // authentication-stop diagnostic (CR-03, D-10, D-03).
  //
  // Every credential case above answers the refusal on the first inventory call, which is the launch
  // path. This one answers a healthy inventory first, so it examines the path a restart never takes.
  test('D-13 pushes a rejected credential and records the authentication stop for a refusal that follows a healthy start', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('Authentication', STOPPED_LINE);
    }).thenReturn(undefined);
    const { runtime, monitoringHealth, advance, commandRequests, monitoringByDevice } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount], pollIntervalMs: FAST_POLL_INTERVAL_MS, command: commands },
      failures,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await settle();

    // act
    await advance(FAST_POLL_INTERVAL_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const healthBeforeStop = [...monitoringHealth];
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(healthBeforeStop.at(-1), { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true });
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'unavailable',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  // What makes the refusal a state rather than an act the runtime performed once. A socket left open
  // on a runtime that will never poll, refresh or connect again keeps delivering values, and an
  // ordinary value push clears the unreadable status the halt just stored, so the accessory goes back
  // to a fully vouched-for read for good. The close raises no disconnection, so the halt must record
  // no shadow degradation: an owner acts on the diagnostic, and a shadow line names a cause that did
  // not happen (D-10, D-13, SYNC-05).
  test('D-13 closes the live connection and opens no other for a refusal that follows a healthy start', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('Authentication', STOPPED_LINE);
    }).thenReturn(undefined);
    const { runtime, shadows, calls, advance, commandRequests } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount], pollIntervalMs: FAST_POLL_INTERVAL_MS, command: commands },
      failures,
    );
    await runtime.start();
    await settle();

    // act
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.strictEqual(runtime.monitoringPath, 'unavailable');
    assert.deepStrictEqual({ closes: shadows[0]?.closes(), clients: calls.filter((call) => call === 'shadow').length }, { closes: 1, clients: 1 });

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
  });

  // A refused credential stops the rotation loop. An authentication-stop diagnostic names the
  // terminal cause without promising another attempt (CR-03, D-10).
  test('D-13 pushes a rejected credential and records the authentication stop when a credential rotation is refused', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('Authentication', STOPPED_LINE);
    }).thenReturn(undefined);
    const { runtime, monitoringHealth, advance, commandRequests, monitoringByDevice } = harness(
      t,
      {
        credentials: [() => Promise.resolve(credentialsAt(START_TIME + SHORT_CREDENTIAL_LIFETIME_MS)), refusingTheAccount],
        rotationLeadMs: SHORT_ROTATION_LEAD_MS,
        minRotationDelayMs: SHORT_ROTATION_FLOOR_MS,
        command: commands,
      },
      failures,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await settle();

    // act
    await advance(SHORT_CREDENTIAL_LIFETIME_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const healthBeforeStop = [...monitoringHealth];
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(healthBeforeStop.at(-1), { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true });
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'unavailable',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  // The second half of the same claim, and the half a retry would make expensive: the vendor lifts a
  // brute-force block only thirty days after the last attempt. All three loops are running here --
  // the poll, the rotation, and the retry chain a refusing broker started -- so the empty hour after
  // the refusal is about every one of them (D-13, D-10).
  test('D-13 leaves the poll, the rotation and the shadow retry chain nothing to do once a mid-run refusal has halted it', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices' | 'awsCredentials'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount], shadow: [false], pollIntervalMs: FAST_POLL_INTERVAL_MS, command: commands },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        awsCredentials: (signal) => requests.awsCredentials(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenReject(new AuthRejectedError('the vendor rejected the account credentials.', 'invalid_grant'));
    when(() => requests.awsCredentials(rootSignal)).thenResolve(credentialsAt(START_TIME + ONE_HOUR_MS));

    await runtime.start();
    await settle();

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    const atTheRefusal = [...calls];
    await advance(ONE_HOUR_MS);

    // assert
    assert.deepStrictEqual(calls, atTheRefusal);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
  });

  // Two loops can be in flight against a tenant that has already said no. The rotation wakes ten
  // milliseconds before the poll here, so both meet the refusal, and the owner must not be told twice
  // nor the accessory tier pushed twice (D-10).
  test('D-13 pushes the terminal trust once when the poll and the rotation meet the refusal together', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure('Authentication', STOPPED_LINE);
    }).thenReturn(undefined);
    const { runtime, monitoringHealth, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount],
        credentials: [() => Promise.resolve(credentialsAt(START_TIME + SHORT_CREDENTIAL_LIFETIME_MS)), refusingTheAccount],
        rotationLeadMs: SHORT_ROTATION_LEAD_MS,
        minRotationDelayMs: SHORT_ROTATION_FLOOR_MS,
        pollIntervalMs: SHORT_CREDENTIAL_LIFETIME_MS,
        command: commands,
      },
      failures,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await settle();

    // act
    await advance(SHORT_CREDENTIAL_LIFETIME_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const healthBeforeStop = [...monitoringHealth];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(healthBeforeStop, [
      { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
      { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: true },
    ]);
    assert.strictEqual(pathBeforeStop, 'unavailable');

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  // Closing the connection at the halt is only half the answer, because the loop that halted is
  // rarely the only one in flight. The first credential grant is still travelling here, and it opens
  // the connection when it lands. A runtime that has stopped for good must not be holding an open
  // connection to the vendor: the socket would keep delivering values that overwrite the one
  // presentation an owner has to act on, and it is signed with credentials nothing will rotate again
  // (D-13, D-10, SYNC-05).
  test('D-13 opens no live connection for a credential grant that lands after a refusal has halted the runtime', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    // The placeholder only gives the binding a value before the executor runs, which it does in this
    // same statement; the grant below is always the promise's own resolver.
    let grantCredentials: (response: AwsCredentialsResponse) => void = () => undefined;
    const granted = new Promise<AwsCredentialsResponse>((resolve) => {
      grantCredentials = resolve;
    });
    const { runtime, calls, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount],
      credentials: [() => granted],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
      command: commands,
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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  // The other half of the same claim, one function later. The connection was already opening when the
  // poll met the refusal, so the halt found no client to close and the check after the start is what
  // is left. A runtime that kept this one would be holding a socket it will never use (D-13, SYNC-05).
  test('D-13 keeps no live connection that opened while a refusal was halting the runtime', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const halting = { advance: undefined as ((ms: number) => Promise<void>) | undefined };
    const { runtime, shadows, calls, advance, commandRequests } = harness(t, {
      devices: [() => Promise.resolve([geminiDevice()]), refusingTheAccount],
      pollIntervalMs: FAST_POLL_INTERVAL_MS,
      whileShadowStarts: () => halting.advance?.(FAST_POLL_INTERVAL_MS) ?? Promise.resolve(),
      command: commands,
    });
    halting.advance = advance;

    // act
    await runtime.start();
    await settle();

    // assert
    assert.deepStrictEqual({ closes: shadows[0]?.closes(), clients: calls.filter((call) => call === 'shadow').length }, { closes: 1, clients: 1 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  // The shutdown's own push is the runtime telling the tier the transport has gone, so it is named
  // here rather than counted with the poll reports. The poll a shutdown aborted still reports
  // nothing, which is what the two lists say: the second holds the shutdown push and nothing else
  // (SYNC-05, RES-04).
  test('reports nothing for a poll a shutdown aborted', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, monitoringHealth, advance, commandRequests } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice()]), hangingUntilAborted], pollIntervalMs: FAST_POLL_INTERVAL_MS, command: commands },
      undefined,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await advance(FAST_POLL_INTERVAL_MS);
    const beforeShutdown = [...monitoringHealth];

    // act
    await runtime.stop();
    await settle();
    const healthBeforeStop = [...monitoringHealth];

    // assert
    assert.deepStrictEqual(
      { beforeShutdown, afterShutdown: healthBeforeStop },
      {
        beforeShutdown: [{ restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false }],
        afterShutdown: [
          { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
          { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: false, credentialsRejected: false },
        ],
      },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  test('reports the shadow silent once two heartbeats have passed with no message', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, monitoringByDevice, advance, commandRequests } = harness(t, { pollIntervalMs: HEARTBEAT_MS, command: commands }, undefined, {
      onMonitoringHealth: listener,
    });
    await runtime.start();

    // act
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(silenceOf(devicesBeforeStop), [false, false, true]);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  test('reports live-device silence on every silent poll', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(4);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    })
      .thenReturn(undefined)
      .times(3);
    const { runtime, advance, commandRequests, monitoringByDevice } = harness(t, { pollIntervalMs: FAST_POLL_INTERVAL_MS, command: commands }, failures, {
      onMonitoringHealth: listener,
    });
    await runtime.start();
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // act
    await advance(FAST_POLL_INTERVAL_MS);
    await advance(FAST_POLL_INTERVAL_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('reports live-device recovery on the arriving message and subsequent poll', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    }).thenReturn(undefined);
    const { runtime, shadows, advance, commandRequests, monitoringByDevice } = harness(
      t,
      { pollIntervalMs: FAST_POLL_INTERVAL_MS, command: commands },
      failures,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    await advance(FAST_POLL_INTERVAL_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  // The scoped permission allows vendor deviceId in local logs, accessory context and persisted
  // arrival anchors. It rests on the unconfirmed assumption that the account-id segment is an opaque
  // key. The identifier tells a two-pump account which basement stopped being watched. Public and
  // planning artifacts use placeholders. Routes, headers and credentials stay out of this line
  // (AUTH-02, D-027, D-14).
  test('reports the exact device-scoped cause when live reporting falls silent', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    }).thenReturn(undefined);
    const { runtime, advance, commandRequests, monitoringByDevice } = harness(t, { pollIntervalMs: FAST_POLL_INTERVAL_MS, command: commands }, failures, {
      onMonitoringHealth: listener,
    });
    await runtime.start();

    // act
    await advance(TWO_MISSED_HEARTBEATS_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('reports the shadow trusted over the same span once a message reached the reported-patch callback', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, monitoringByDevice, advance, commandRequests } = harness(t, { pollIntervalMs: HEARTBEAT_MS, command: commands }, undefined, {
      onMonitoringHealth: listener,
    });
    await runtime.start();
    await advance(HEARTBEAT_MS);

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    await advance(HEARTBEAT_MS);
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(silenceOf(devicesBeforeStop), [false, false, false]);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  // The recovery an owner waits on. Both arrival cases above advance the clock after the message,
  // which lets the poll tick that follows do the clearing, so neither can tell an arrival-driven
  // recovery from a poll-driven one -- and the configured poll interval accepts an hour. This one
  // moves nothing: the message is the only event between the silent report and the assertion, and
  // the recorded call list says no request left the plugin in between (CR-02, D-11).
  test('RES-03 restores the trust on the message that proves the live path is carrying, with no clock movement and no poll', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, monitoringByDevice, calls, advance, commandRequests } = harness(
      t,
      { pollIntervalMs: HEARTBEAT_MS, command: commands },
      undefined,
      {
        devices: (signal) => requests.devices(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
        onMonitoringHealth: listener,
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);

    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);
    const atSilence = [...calls];

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { pushes: devicesBeforeStop.map((byDevice) => byDevice.get(DEVICE_ID)), calls },
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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(requests);
    verify(listener);
  });

  // The guard the report is made through. A healthy live path delivers a heartbeat roughly every
  // fifteen minutes and a busy one delivers many, so a report on every message would push a trust
  // fan-out across every accessory for no new information. The latch has already moved by the
  // second message, so it reports nothing (D-05).
  test('reports once per recovery rather than once per message when two messages arrive together', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, monitoringHealth, advance, commandRequests } = harness(t, { pollIntervalMs: HEARTBEAT_MS, command: commands }, undefined, {
      onMonitoringHealth: listener,
    });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);
    const atSilence = monitoringHealth.length;

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    const afterFirstMessage = monitoringHealth.length;
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    const healthBeforeStop = [...monitoringHealth];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { atSilence, afterFirstMessage, afterSecondMessage: healthBeforeStop.length },
      { atSilence: 3, afterFirstMessage: 4, afterSecondMessage: 4 },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  // The same guard on the ordinary case: a live path that is working. It costs one push per poll
  // and none per heartbeat, because a message that resolved nothing is not news (D-05).
  test('reports nothing when a message arrives on a live path it never reported silent', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, monitoringHealth, commandRequests } = harness(t, { pollIntervalMs: HEARTBEAT_MS, command: commands }, undefined, {
      onMonitoringHealth: listener,
    });
    await runtime.start();
    await settle();
    const afterLaunch = monitoringHealth.length;

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    const healthBeforeStop = [...monitoringHealth];
    await runtime.stop();

    // assert
    assert.deepStrictEqual({ afterLaunch, afterTwoMessages: healthBeforeStop.length }, { afterLaunch: 1, afterTwoMessages: 1 });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
  });

  // The diagnostic half of the same recovery. The owner is told the live connection came back once,
  // at the message that proves it, with the clock standing still (D-03).
  test('reports live-device recovery once at the arriving message without clock movement', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    }).thenReturn(undefined);
    const { runtime, shadows, advance, commandRequests, monitoringByDevice } = harness(t, { pollIntervalMs: HEARTBEAT_MS, command: commands }, failures, {
      onMonitoringHealth: listener,
    });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  // Why the report is driven from the arrival callback and not from a snapshot listener. The
  // canonical store notifies only when a telemetry value moved, so the heartbeat below reaches no
  // subscriber at all, and it is still direct evidence that the live path is carrying (D-05, D-11).
  test('clears the silence on a heartbeat carrying the values the store already holds, which notifies no subscriber', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, store, shadows, monitoringByDevice, advance, commandRequests } = harness(
      t,
      { pollIntervalMs: HEARTBEAT_MS, command: commands },
      undefined,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);
    const subscription = mock<DeviceSnapshotListener>({ exactParams: true, name: 'unchanged snapshot listener' });
    store.subscribe(DEVICE_ID, subscription);

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 1_796_000,
    });
    assert.deepStrictEqual(
      { pushed: devicesBeforeStop.at(-1)?.get(DEVICE_ID) },
      {
        pushed: { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false },
      },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
    verify(subscription);
  });

  // D-11 matches recovery to its cause: a successful poll leaves shadow silence unresolved,
  // and the arriving message clears it.
  test('D-11 leaves the shadow silence for the successful poll and clears it for the message that follows', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, monitoringByDevice, advance, commandRequests } = harness(t, { pollIntervalMs: HEARTBEAT_MS, command: commands }, undefined, {
      onMonitoringHealth: listener,
    });
    await runtime.start();
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);

    // act
    await advance(HEARTBEAT_MS);
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(silenceOf(devicesBeforeStop), [false, false, true, true, false]);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(listener);
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
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${OTHER_DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(4);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    }).thenReturn(undefined);
    const { runtime, shadows, monitoringHealth, monitoringByDevice, advance, commandRequests } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice(), otherGeminiDevice()])], pollIntervalMs: HEARTBEAT_MS, command: commands },
      failures,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await advance(HEARTBEAT_MS);
    // The back pump keeps speaking, so only the front pump reaches two missed heartbeats.
    shadowOptionsOf(shadows).onReportedPatch(OTHER_DEVICE_ID, heartbeatPatch());
    await advance(HEARTBEAT_MS);
    const atFrontPumpSilence = monitoringByDevice.length;
    const trustAtFrontPumpSilence = { account: monitoringHealth.at(-1), byDevice: monitoringByDevice.at(-1) };

    // act
    shadowOptionsOf(shadows).onReportedPatch(OTHER_DEVICE_ID, heartbeatPatch());
    const afterNeighbourHeartbeat = monitoringByDevice.length;
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());

    const pathBeforeStop = runtime.monitoringPath;
    const accountBeforeStop = monitoringHealth.at(-1);
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(trustAtFrontPumpSilence, {
      account: { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
      byDevice: new Map([
        [DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }],
        [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
      ]),
    });
    assert.deepStrictEqual(
      {
        afterNeighbourHeartbeat,
        afterFrontPumpSpoke: devicesBeforeStop.length,
        finalSilence: [devicesBeforeStop.at(-1)?.get(DEVICE_ID)?.shadowSilent, devicesBeforeStop.at(-1)?.get(OTHER_DEVICE_ID)?.shadowSilent],
      },
      { afterNeighbourHeartbeat: atFrontPumpSilence, afterFrontPumpSpoke: atFrontPumpSilence + 1, finalSilence: [false, false] },
    );
    assert.deepStrictEqual(
      { path: pathBeforeStop, account: accountBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        account: { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        trust: new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  // Each pump's failure kind identifies that controller independently.
  // Recorded limit (D-10): the second pump is this fixture's, not the vendor account's.
  test('D-14 reports each silent pump under its own failure kind', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(4);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${OTHER_DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      failures.recordFailure(`Live device reporting for ${OTHER_DEVICE_ID}`, liveReportingSilentLine(OTHER_DEVICE_ID));
    }).thenReturn(undefined);
    const { runtime, shadows, advance, commandRequests, monitoringByDevice } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice(), otherGeminiDevice()])], pollIntervalMs: HEARTBEAT_MS, command: commands },
      failures,
      { onMonitoringHealth: listener },
    );
    await runtime.start();
    await advance(HEARTBEAT_MS);
    shadowOptionsOf(shadows).onReportedPatch(OTHER_DEVICE_ID, heartbeatPatch());

    // act
    await advance(HEARTBEAT_MS);
    await advance(HEARTBEAT_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }],
        ]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(listener);
  });

  test('opens the shadow connection once a later poll finds the account devices', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, advance, commandRequests } = harness(t, {
      devices: [
        () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
        () => Promise.resolve([geminiDevice()]),
      ],
      command: commands,
    });
    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.strictEqual(calls.filter((call) => call === 'shadow').length, 1);
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  function devicesCallCount(calls: readonly string[]): number {
    return calls.filter((call) => call === 'devices').length;
  }

  test('makes no extra devices call and reports no removal while a tracked device stays present', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, removed, advance, commandRequests } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([geminiDevice()])], command: commands },
      undefined,
      {
        onDeviceRemoved: removals,
        devices: (signal) => requests.devices(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);

    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ devicesCalls: devicesCallCount(calls), removed }, { devicesCalls: 2, removed: [] });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(removals);
    verify(requests);
  });

  test('never reports removal for a deviceId absent once between two present observations', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, removed, advance, commandRequests } = harness(
      t,
      { devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([]), () => Promise.resolve([geminiDevice()])], command: commands },
      undefined,
      {
        onDeviceRemoved: removals,
        devices: (signal) => requests.devices(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);

    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ devicesCalls: devicesCallCount(calls), removed }, { devicesCalls: 3, removed: [] });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(removals);
    verify(requests);
  });

  test('makes exactly one final-check fetch per cycle and removes every deviceId still absent from it', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);
    when(() => {
      removals(OTHER_DEVICE_ID);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, removed, advance, commandRequests } = harness(
      t,
      {
        devices: [
          () => Promise.resolve([geminiDevice(), otherGeminiDevice()]),
          () => Promise.resolve([]),
          () => Promise.resolve([]),
          () => Promise.resolve([]),
        ],
        command: commands,
      },
      undefined,
      {
        onDeviceRemoved: removals,
        devices: (signal) => requests.devices(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice(), otherGeminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);

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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(removals);
    verify(requests);
  });

  test('does not remove a deviceId that reappears in the final-check fetch, and resets its absence count', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, calls, removed, advance, commandRequests } = harness(
      t,
      {
        devices: [
          () => Promise.resolve([geminiDevice()]),
          () => Promise.resolve([]),
          () => Promise.resolve([]),
          () => Promise.resolve([geminiDevice()]),
          () => Promise.resolve([]),
        ],
        command: commands,
      },
      undefined,
      {
        onDeviceRemoved: removals,
        devices: (signal) => requests.devices(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([]);

    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ devicesCalls: devicesCallCount(calls), removed }, { devicesCalls: 5, removed: [] });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(removals);
    verify(requests);
  });

  test('reports no removal when the final-check fetch itself fails, and retries the check on the next successful poll', async (t) => {
    // arrange
    const requests = mock<Pick<CloudApi, 'devices'>>({ exactParams: true, name: 'scheduled vendor requests' });
    let rootSignal!: AbortSignal;

    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(4);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    }).thenReturn(undefined);
    when(() => {
      failures.forget(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.forget(`HomeKit removal of ${DEVICE_ID}`);
    }).thenReturn(undefined);
    const { runtime, calls, removed, advance, commandRequests } = harness(
      t,
      {
        devices: [
          () => Promise.resolve([geminiDevice()]),
          () => Promise.resolve([]),
          () => Promise.resolve([]),
          () => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices')),
          () => Promise.resolve([]),
          () => Promise.resolve([]),
        ],
        command: commands,
      },
      failures,
      {
        onDeviceRemoved: removals,
        devices: (signal) => requests.devices(signal),
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    when(() => requests.devices(rootSignal)).thenResolve([geminiDevice()]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenReject(new CloudRequestError('GET /devices failed with HTTP 503.', 503, 'GET /devices'));
    when(() => requests.devices(rootSignal)).thenResolve([]);
    when(() => requests.devices(rootSignal)).thenResolve([]);

    await runtime.start();
    await settle();

    // act
    await advance(POLL_INTERVAL_MS);
    await advance(POLL_INTERVAL_MS);

    const beforeRetry = { removed: [...removed], path: runtime.monitoringPath, stored: runtime.store.deviceIds() };
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(beforeRetry, { removed: [], path: 'shadow-and-poll', stored: [DEVICE_ID] });
    assert.deepStrictEqual(
      { devicesCalls: devicesCallCount(calls), removed, stored: runtime.store.deviceIds() },
      { devicesCalls: 6, removed: [DEVICE_ID], stored: [] },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(removals);
    verify(requests);
  });

  // A removal Homebridge refuses leaves an accessory published that this plugin has already
  // vouched for. Everything that could still distrust that accessory -- its arrival stamp, its
  // persisted anchor, its absence count -- therefore has to survive the refusal. Pruned ahead of
  // the removal, the tile goes on reading no leak and a normal pump for a system the account no
  // longer holds, nothing ever retries the removal, and nothing is said about any of it (D-014).
  test('keeps a pump whose removal was refused watched, distrusted and reported, and tries the removal again', async (t) => {
    // arrange
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);

    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    })
      .thenReturn(undefined)
      .times(2);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(4);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('Credential rotation');
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordFailure(`HomeKit removal of ${DEVICE_ID}`, removalRefusedLine(DEVICE_ID));
    })
      .thenReturn(undefined)
      .times(2);
    const { runtime, store, anchors, removed, monitoringByDevice, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([])],
        pollIntervalMs: TWO_MISSED_HEARTBEATS_MS,
        removalFails: true,
        command: commands,
      },
      failures,
      { onDeviceRemoved: removals, onMonitoringHealth: listener },
    );
    await runtime.start();
    await settle();
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // act
    await advance(TWO_MISSED_HEARTBEATS_MS);

    const beforeRetry = {
      attempts: [...removed],
      snapshot: store.snapshot(DEVICE_ID),
      anchors: [...anchors.stored],
      silence: silenceOf(monitoringByDevice).at(-1),
    };
    await advance(TWO_MISSED_HEARTBEATS_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(beforeRetry, {
      attempts: [DEVICE_ID],
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
      silence: true,
    });
    assert.deepStrictEqual([...removed], [DEVICE_ID, DEVICE_ID]);
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(removals);
    verify(listener);
  });

  // A refused removal strands an accessory this plugin has already vouched for, so the first one
  // is said the moment it happens rather than held back by the cadence its repeats are subject to.
  test('reports a refused removal as soon as the removal is refused', async (t) => {
    // arrange
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`HomeKit removal of ${DEVICE_ID}`, removalRefusedLine(DEVICE_ID));
    }).thenReturn(undefined);
    const { runtime, removed, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([])],
        pollIntervalMs: FAST_POLL_INTERVAL_MS,
        removalFails: true,
        command: commands,
      },
      failures,
      { onDeviceRemoved: removals },
    );
    await runtime.start();
    await settle();
    await advance(FAST_POLL_INTERVAL_MS);

    // act
    await advance(FAST_POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual(
      { path: runtime.monitoringPath, attempts: [...removed], snapshot: runtime.store.snapshot(DEVICE_ID) },
      {
        path: 'shadow-and-poll',
        attempts: [DEVICE_ID],
        snapshot: {
          identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: DEVICE_TIME },
          data: { water_level: 1, primary_pump_running: false, ac_power: true },
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: DEVICE_TIME,
          receivedAt: START_TIME,
        },
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(removals);
  });

  // A refused accessory stays eligible for the next poll's removal attempt.
  test('reports each refused removal and retries the same device on every poll', async (t) => {
    // arrange
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    })
      .thenReturn(undefined)
      .times(4);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(6);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(6);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`HomeKit removal of ${DEVICE_ID}`, removalRefusedLine(DEVICE_ID));
    })
      .thenReturn(undefined)
      .times(4);
    const { runtime, removed, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([])],
        pollIntervalMs: FAST_POLL_INTERVAL_MS,
        removalFails: true,
        command: commands,
      },
      failures,
      { onDeviceRemoved: removals },
    );
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
      { path: runtime.monitoringPath, attempts: [...removed] },
      { path: 'shadow-and-poll', attempts: [DEVICE_ID, DEVICE_ID, DEVICE_ID, DEVICE_ID] },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(removals);
  });

  // Distinct failure kinds preserve the identity of both stranded accessories.
  test('reports the refused removal of each pump, so one refusal does not silence another', async (t) => {
    // arrange
    const callbackStates: unknown[] = [];
    const expectedSnapshots: DeviceSnapshot[] = [
      {
        identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: DEVICE_TIME },
        data: { water_level: 1, primary_pump_running: false, ac_power: true },
        metadata: {},
        shadowVersion: undefined,
        deviceTimestamp: DEVICE_TIME,
        receivedAt: START_TIME,
      },
      {
        identity: { deviceId: OTHER_DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: DEVICE_TIME },
        data: { water_level: 1, primary_pump_running: false, ac_power: true },
        metadata: {},
        shadowVersion: undefined,
        deviceTimestamp: DEVICE_TIME,
        receivedAt: START_TIME,
      },
    ];
    const expectedTracking = {
      deviceIds: [DEVICE_ID, OTHER_DEVICE_ID],
      snapshots: expectedSnapshots,
      anchors: [
        [DEVICE_ID, START_TIME - 123],
        [OTHER_DEVICE_ID, START_TIME - 456],
      ],
      account: { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
      byDevice: new Map([
        [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
      ]),
    };
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);

    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);
    when(() => {
      removals(OTHER_DEVICE_ID);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${OTHER_DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess('Credential rotation');
    }).thenReturn(undefined);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`HomeKit removal of ${DEVICE_ID}`, removalRefusedLine(DEVICE_ID));
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`HomeKit removal of ${OTHER_DEVICE_ID}`, removalRefusedLine(OTHER_DEVICE_ID));
    }).thenReturn(undefined);
    const { runtime, store, anchors, removed, advance, commandRequests, monitoringHealth, monitoringByDevice } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice(), otherGeminiDevice()]), () => Promise.resolve([])],
        pollIntervalMs: FAST_POLL_INTERVAL_MS,
        removalFails: true,
        anchors: recordingAnchors([
          [DEVICE_ID, START_TIME - 123],
          [OTHER_DEVICE_ID, START_TIME - 456],
        ]),
        command: commands,
      },
      failures,
      {
        onDeviceRemoved: (deviceId) => {
          callbackStates.push({
            deviceId,
            deviceIds: store.deviceIds(),
            snapshots: store.deviceIds().map((id) => store.snapshot(id)),
            anchors: [...anchors.stored],
            account: monitoringHealth.at(-1),
            byDevice: monitoringByDevice.at(-1),
          });
          removals(deviceId);
        },
        onMonitoringHealth: listener,
      },
    );
    await runtime.start();
    await settle();
    await advance(FAST_POLL_INTERVAL_MS);

    // act
    await advance(FAST_POLL_INTERVAL_MS);

    const pathBeforeStop = runtime.monitoringPath;
    const devicesBeforeStop = [...monitoringByDevice];
    const afterRefusals = {
      deviceIds: store.deviceIds(),
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      anchors: [...anchors.stored],
      account: monitoringHealth.at(-1),
      byDevice: monitoringByDevice.at(-1),
    };
    await runtime.stop();

    // assert
    assert.deepStrictEqual(callbackStates, [
      { deviceId: DEVICE_ID, ...expectedTracking },
      { deviceId: OTHER_DEVICE_ID, ...expectedTracking },
    ]);
    assert.deepStrictEqual(afterRefusals, expectedTracking);
    assert.deepStrictEqual(removed, [DEVICE_ID, OTHER_DEVICE_ID]);
    assert.deepStrictEqual([...removed].sort(), [DEVICE_ID, OTHER_DEVICE_ID].sort());
    assert.deepStrictEqual(
      { path: pathBeforeStop, trust: devicesBeforeStop.at(-1) },
      {
        path: 'shadow-and-poll',
        trust: new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      },
    );

    assert.deepStrictEqual(commandRequests, []);
    verify(failures);
    verify(commands);
    verify(removals);
    verify(listener);
  });

  // Removal forgets both device-scoped causes before a fresh admission.
  test('forgets both reporting kinds when a removed device returns as a new admission', async (t) => {
    // arrange
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const notifications: string[][] = [];
    const failures = mock<FailureLog>({ exactParams: true, name: 'account failure notifications' });
    when(() => {
      failures.recordSuccess('Device polling');
    })
      .thenReturn(undefined)
      .times(4);
    when(() => {
      failures.recordSuccess(`Live device reporting for ${DEVICE_ID}`);
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      failures.recordSuccess('Credential rotation');
    })
      .thenReturn(undefined)
      .times(3);
    when(() => {
      failures.recordSuccess('The shadow connection');
    }).thenReturn(undefined);
    when(() => {
      failures.recordFailure(`Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID));
    }).thenReturn(undefined);
    when(() => {
      failures.forget(`Live device reporting for ${DEVICE_ID}`);
    }).thenReturn(undefined);
    when(() => {
      failures.forget(`HomeKit removal of ${DEVICE_ID}`);
    }).thenReturn(undefined);
    const reporting: FailureLog = {
      recordSuccess: (kind) => {
        failures.recordSuccess(kind);
        notifications.push(['success', kind]);
      },
      recordFailure: (kind, reason) => {
        failures.recordFailure(kind, reason);
        notifications.push(['failure', kind, reason]);
      },
      forget: (kind) => {
        failures.forget(kind);
        notifications.push(['forget', kind]);
      },
    };
    const { runtime, removed, advance, commandRequests, anchors } = harness(
      t,
      {
        devices: [
          () => Promise.resolve([geminiDevice()]),
          () => Promise.resolve([]),
          () => Promise.resolve([]),
          () => Promise.resolve([]),
          () => Promise.resolve([geminiDevice()]),
        ],
        pollIntervalMs: TWO_MISSED_HEARTBEATS_MS,
        command: commands,
      },
      reporting,
      { onDeviceRemoved: removals },
    );
    await runtime.start();
    await settle();
    // Two missed heartbeats, so the pump's live reporting is failing when it goes.
    await advance(TWO_MISSED_HEARTBEATS_MS);
    await advance(TWO_MISSED_HEARTBEATS_MS);
    const atRemoval = { removed: [...removed], stored: runtime.store.deviceIds() };

    // act
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // assert
    assert.deepStrictEqual(atRemoval, { removed: [DEVICE_ID], stored: [] });
    assert.deepStrictEqual(
      { path: runtime.monitoringPath, snapshot: runtime.store.snapshot(DEVICE_ID), anchors: [...anchors.stored] },
      {
        path: 'shadow-and-poll',
        snapshot: {
          identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: DEVICE_TIME },
          data: { water_level: 1, primary_pump_running: false, ac_power: true },
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: DEVICE_TIME,
          receivedAt: START_TIME + 5_388_000,
        },
        anchors: [[DEVICE_ID, START_TIME + 5_388_000]],
      },
    );
    assert.deepStrictEqual(commandRequests, []);
    assert.deepStrictEqual(notifications, [
      ['success', 'Device polling'],
      ['success', `Live device reporting for ${DEVICE_ID}`],
      ['success', 'Credential rotation'],
      ['success', 'The shadow connection'],
      ['success', 'Device polling'],
      ['failure', `Live device reporting for ${DEVICE_ID}`, liveReportingSilentLine(DEVICE_ID)],
      ['success', 'Credential rotation'],
      ['forget', `Live device reporting for ${DEVICE_ID}`],
      ['forget', `HomeKit removal of ${DEVICE_ID}`],
      ['success', 'Device polling'],
      ['success', 'Credential rotation'],
      ['success', 'Device polling'],
      ['success', `Live device reporting for ${DEVICE_ID}`],
    ]);
    verify(failures);
    verify(commands);
    verify(removals);
  });

  // The store lives for the life of the process and is written back to disk, so
  // an account whose systems come and go over months would otherwise accumulate
  // an anchor per system for good. It is dropped here, beside the arrival stamp
  // and the reporting kind, because these two confirming polls are what decide a
  // device is really gone (D-14).
  test('drops the arrival anchor of a removed pump, so the stored set cannot outgrow the account', async (t) => {
    // arrange
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, anchors, removed, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([]), () => Promise.resolve([]), () => Promise.resolve([])],
        command: commands,
      },
      undefined,
      { onDeviceRemoved: removals },
    );
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
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(removals);
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
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }, new Map([]));
    }).thenReturn(undefined);
    when(() => {
      listener({ restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }, new Map([]));
    }).thenReturn(undefined);

    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, shadows, monitoringByDevice, removed, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice()]), () => Promise.resolve([]), () => Promise.resolve([]), () => Promise.resolve([])],
        pollIntervalMs: TWO_MISSED_HEARTBEATS_MS,
        command: commands,
      },
      undefined,
      { onDeviceRemoved: removals, onMonitoringHealth: listener },
    );
    await runtime.start();
    await advance(TWO_MISSED_HEARTBEATS_MS);
    await advance(TWO_MISSED_HEARTBEATS_MS);
    const atRemoval = monitoringByDevice.length;

    // act
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    const devicesBeforeStop = [...monitoringByDevice];
    await runtime.stop();

    // assert
    assert.deepStrictEqual({ removed, pushes: devicesBeforeStop.length }, { removed: [DEVICE_ID], pushes: atRemoval });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(removals);
    verify(listener);
  });

  // A stray message can still arrive after removal for the structural reason the
  // sibling case above states: the shadow client stays subscribed until the
  // connection is rebuilt. It must not resurrect the arrival stamp the removal
  // branch already dropped from both the in-memory map and the persisted anchor
  // (D-14).
  test('does not re-arm the arrival anchor when a stray message arrives after a pump is removed', async (t) => {
    // arrange
    const callbackStates: unknown[] = [];
    const expectedSnapshot: DeviceSnapshot = {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    };
    const expectedNeighbor: DeviceSnapshot = {
      identity: { deviceId: OTHER_DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME + 3_592_000,
    };
    const expectedAccount: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false };
    const expectedSilentDevice: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false };
    const expectedSurvivor = {
      deviceIds: [OTHER_DEVICE_ID],
      snapshots: [expectedNeighbor],
      departedSnapshot: undefined,
      anchors: [[OTHER_DEVICE_ID, START_TIME - 456]],
      account: expectedAccount,
      byDevice: new Map([[OTHER_DEVICE_ID, expectedSilentDevice]]),
    };
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'monitoring trust listener' });
    when(() => {
      listener(
        expectedAccount,
        new Map([
          [DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
          [OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        expectedAccount,
        new Map([
          [DEVICE_ID, expectedSilentDevice],
          [OTHER_DEVICE_ID, expectedSilentDevice],
        ]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(expectedAccount, new Map([[OTHER_DEVICE_ID, expectedSilentDevice]]));
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[OTHER_DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    const removals = mock<AccountRuntimeOptions['onDeviceRemoved']>({ exactParams: true, name: 'confirmed device removal' });
    when(() => {
      removals(DEVICE_ID);
    }).thenReturn(undefined);

    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, store, shadows, anchors, removed, monitoringHealth, monitoringByDevice, advance, commandRequests } = harness(
      t,
      {
        devices: [() => Promise.resolve([geminiDevice(), otherGeminiDevice()]), () => Promise.resolve([otherGeminiDevice()])],
        pollIntervalMs: TWO_MISSED_HEARTBEATS_MS,
        anchors: recordingAnchors([
          [DEVICE_ID, START_TIME - 123],
          [OTHER_DEVICE_ID, START_TIME - 456],
        ]),
        command: commands,
      },
      undefined,
      {
        onDeviceRemoved: (deviceId) => {
          callbackStates.push({
            deviceId,
            deviceIds: store.deviceIds(),
            snapshots: store.deviceIds().map((id) => store.snapshot(id)),
            anchors: [...anchors.stored],
            account: monitoringHealth.at(-1),
            byDevice: monitoringByDevice.at(-1),
          });
          removals(deviceId);
        },
        onMonitoringHealth: listener,
      },
    );
    await runtime.start();
    await advance(TWO_MISSED_HEARTBEATS_MS);

    // act
    const beforeRemoval = {
      deviceIds: store.deviceIds(),
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      anchors: [...anchors.stored],
      account: monitoringHealth.at(-1),
      byDevice: monitoringByDevice.at(-1),
    };
    await advance(TWO_MISSED_HEARTBEATS_MS);
    const atRemoval = { removed: [...removed], hasAnchor: anchors.stored.has(DEVICE_ID) };
    const trackingAtRemoval = {
      deviceIds: store.deviceIds(),
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      departedSnapshot: store.snapshot(DEVICE_ID),
      anchors: [...anchors.stored],
      account: monitoringHealth.at(-1),
      byDevice: monitoringByDevice.at(-1),
    };
    const reportsAtRemoval = monitoringByDevice.length;

    await advance(123);
    shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID, heartbeatPatch());
    const afterStray = {
      deviceIds: store.deviceIds(),
      snapshots: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      departedSnapshot: store.snapshot(DEVICE_ID),
      anchors: [...anchors.stored],
      account: monitoringHealth.at(-1),
      byDevice: monitoringByDevice.at(-1),
    };
    const reportsAfterStray = monitoringByDevice.length;
    await runtime.stop();

    // assert
    assert.deepStrictEqual(beforeRemoval, {
      deviceIds: [DEVICE_ID, OTHER_DEVICE_ID],
      snapshots: [expectedSnapshot, { ...expectedNeighbor, receivedAt: START_TIME + 1_796_000 }],
      anchors: [
        [DEVICE_ID, START_TIME - 123],
        [OTHER_DEVICE_ID, START_TIME - 456],
      ],
      account: expectedAccount,
      byDevice: new Map([
        [DEVICE_ID, expectedSilentDevice],
        [OTHER_DEVICE_ID, expectedSilentDevice],
      ]),
    });
    assert.deepStrictEqual(callbackStates, [
      {
        deviceId: DEVICE_ID,
        deviceIds: [DEVICE_ID, OTHER_DEVICE_ID],
        snapshots: [expectedSnapshot, expectedNeighbor],
        anchors: [
          [DEVICE_ID, START_TIME - 123],
          [OTHER_DEVICE_ID, START_TIME - 456],
        ],
        account: expectedAccount,
        byDevice: new Map([
          [DEVICE_ID, expectedSilentDevice],
          [OTHER_DEVICE_ID, expectedSilentDevice],
        ]),
      },
    ]);
    assert.deepStrictEqual({ trackingAtRemoval, afterStray }, { trackingAtRemoval: expectedSurvivor, afterStray: expectedSurvivor });
    assert.deepStrictEqual({ reportsAtRemoval, reportsAfterStray, removed }, { reportsAtRemoval: 3, reportsAfterStray: 3, removed: [DEVICE_ID] });
    assert.deepStrictEqual(
      { atRemoval, afterStrayMessage: anchors.stored.has(DEVICE_ID) },
      { atRemoval: { removed: [DEVICE_ID], hasAnchor: false }, afterStrayMessage: false },
    );
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
    verify(removals);
    verify(listener);
  });

  test('cancels a pending command through the shared root signal when shutdown begins', async (t) => {
    // arrange
    // The promise constructors assign their resolvers synchronously.
    let completeCommand!: (answer: CommandResult) => void;
    let rejectCommand!: (error: Error) => void;
    let announceDispatch!: () => void;
    const pendingCommand = new Promise<CommandResult>((resolve, reject) => {
      completeCommand = resolve;
      rejectCommand = reject;
    });
    const dispatched = new Promise<void>((resolve) => {
      announceDispatch = resolve;
    });
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'pending command dispatch' });
    when(() =>
      commands(
        DEVICE_ID,
        { desiredData: { test_running: true } },
        It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      ),
    ).thenReturn(pendingCommand);
    // The public retry factory receives the root signal during construction.
    let rootSignal!: AbortSignal;
    let commandSignal: AbortSignal | undefined;
    let commandOutcome: CommandOutcome | undefined;
    const { runtime, commandRequests } = harness(
      t,
      {
        command: (deviceId, command, signal) => {
          commandSignal = signal;
          signal.addEventListener(
            'abort',
            () => {
              rejectCommand(new Error('the pending command was aborted'));
            },
            { once: true },
          );
          announceDispatch();
          return commands(deviceId, command, signal);
        },
      },
      undefined,
      {
        createRetry: (signal) => {
          rootSignal = signal;
          return createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: silentLog() });
        },
      },
    );
    await runtime.start();

    // act
    const sending = runtime.commands.send(DEVICE_ID, 'self-test', true).then((outcome) => {
      commandOutcome = outcome;
      return outcome;
    });
    await dispatched;
    const atDispatch = { aborted: commandSignal?.aborted, outcome: commandOutcome };
    await runtime.stop();
    await settle();
    const atShutdown = { aborted: commandSignal?.aborted, outcome: commandOutcome };
    // Release the owned response after capture so a missing abort fails an assertion without hanging.
    completeCommand({ success: true });
    const outcome = await sending;
    const snapshot = runtime.store.snapshot(DEVICE_ID);

    // assert
    assert.deepStrictEqual(
      { atDispatch, atShutdown, outcome },
      {
        atDispatch: { aborted: false, outcome: undefined },
        atShutdown: { aborted: true, outcome: { accepted: false, failure: 'vendor-error' } },
        outcome: { accepted: false, failure: 'vendor-error' },
      },
    );
    assert.deepStrictEqual(snapshot, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.strictEqual(commandSignal, rootSignal);
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { test_running: true }, aborted: false }]);
    verify(commands);
  });
  test('sends the family wire body for a self-test to the device the caller names', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    when(() =>
      commands(
        DEVICE_ID,
        { desiredData: { test_running: true } },
        It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      ),
    ).thenResolve({ success: true });
    const { runtime, commandRequests } = harness(t, { command: commands });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);
    const snapshot = runtime.store.snapshot(DEVICE_ID);

    // assert
    assert.deepStrictEqual(outcome, { accepted: true });
    assert.deepStrictEqual(snapshot, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { test_running: true }, aborted: false }]);
    verify(commands);
  });

  test('sends the family wire body for an alarm mute', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    when(() =>
      commands(
        DEVICE_ID,
        { desiredData: { alarm_audio_muted: true } },
        It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      ),
    ).thenResolve({ success: true });
    const { runtime, commandRequests } = harness(t, { command: commands });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'alarm-mute', true);
    const snapshot = runtime.store.snapshot(DEVICE_ID);

    // assert
    assert.deepStrictEqual(outcome, { accepted: true });
    assert.deepStrictEqual(snapshot, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { alarm_audio_muted: true }, aborted: false }]);
    verify(commands);
  });

  test('reports a vendor error when the route rejects, and sends nothing further', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    when(() =>
      commands(
        DEVICE_ID,
        { desiredData: { test_running: true } },
        It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      ),
    ).thenReject(new CloudRequestError('PUT /devices/{deviceId}/data failed with HTTP 500.', 500, 'PUT /devices/{deviceId}/data'));
    const { runtime, commandRequests } = harness(t, { command: commands });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);
    const snapshot = runtime.store.snapshot(DEVICE_ID);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'vendor-error' });
    assert.deepStrictEqual(snapshot, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { test_running: true }, aborted: false }]);
    assert.strictEqual(commandRequests.length, 1);
    verify(commands);
  });

  test('reports a vendor error for a resolved body the vendor refused', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    when(() =>
      commands(
        DEVICE_ID,
        { desiredData: { test_running: true } },
        It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      ),
    ).thenResolve({ success: false });
    const { runtime, commandRequests } = harness(t, { command: commands });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);
    const snapshot = runtime.store.snapshot(DEVICE_ID);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'vendor-error' });
    assert.deepStrictEqual(snapshot, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { test_running: true }, aborted: false }]);
    verify(commands);
  });

  test('reports a timeout when the deadline aborted the attempt', async (t) => {
    // arrange
    const timedOut = new Error('The operation was aborted due to timeout');
    timedOut.name = 'TimeoutError';
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    when(() =>
      commands(
        DEVICE_ID,
        { desiredData: { test_running: true } },
        It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      ),
    ).thenReject(timedOut);
    const { runtime, commandRequests } = harness(t, { command: commands });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);
    const snapshot = runtime.store.snapshot(DEVICE_ID);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'timed-out' });
    assert.deepStrictEqual(snapshot, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { test_running: true }, aborted: false }]);
    assert.strictEqual(commandRequests.length, 1);
    verify(commands);
  });

  test('sends nothing for a deviceId the store never held', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, commandRequests } = harness(t, { command: commands });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(OTHER_DEVICE_ID, 'self-test', true);
    const snapshot = runtime.store.snapshot(DEVICE_ID);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'vendor-error' });
    assert.deepStrictEqual(snapshot, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('sends nothing for a device whose family this version cannot drive', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    const { runtime, commandRequests } = harness(t, {
      devices: [() => Promise.resolve([{ ...geminiDevice(), deviceTypeId: 'wayneWaterHalo' }])],
      command: commands,
    });
    await runtime.start();

    // act
    const outcome = await runtime.commands.send(DEVICE_ID, 'self-test', true);
    const snapshot = runtime.store.snapshot(DEVICE_ID);

    // assert
    assert.deepStrictEqual(outcome, { accepted: false, failure: 'vendor-error' });
    assert.deepStrictEqual(snapshot, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterHalo', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.deepStrictEqual(commandRequests, []);
    verify(commands);
  });

  test('passes an already-aborted signal to a command sent after shutdown', async (t) => {
    // arrange
    const commands = mock<CloudApi['sendCommand']>({ exactParams: true, name: 'command dispatch' });
    when(() =>
      commands(
        DEVICE_ID,
        { desiredData: { test_running: true } },
        It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && signal.aborted),
      ),
    ).thenResolve({ success: true });
    const { runtime, commandRequests } = harness(t, { command: commands });
    await runtime.start();
    await runtime.stop();

    // act
    await runtime.commands.send(DEVICE_ID, 'self-test', true);

    // assert
    assert.deepStrictEqual(commandRequests, [{ deviceId: DEVICE_ID, desiredData: { test_running: true }, aborted: true }]);
    verify(commands);
  });

  test('AUTH-01 authenticates once and carries the bearer token onto every vendor route', async (t) => {
    // arrange
    const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'composed HTTP requests' });
    when(() =>
      httpFetch('https://tenant.example.test/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'homebridge-basement-guardian' },
        body:
          '{"grant_type":"http://auth0.com/oauth/grant-type/password-realm","realm":"example-realm"' +
          ',"client_id":"client-id-1","username":"account@example.test","password":"account-password"' +
          ',"scope":"openid profile email"}',
        signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      }),
    ).thenResolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/devices'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(geminiWireDeviceList()), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/credentials/aws'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(credentialsAt(START_TIME + ONE_HOUR_MS)), { status: 200 }));

    const requests = stubCloud(t, httpFetch);
    const { runtime, store } = await endToEndRuntime(t);

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
    verify(httpFetch);
  });
});

describe('createAccountRuntimeFromConfig', () => {
  test('registers the bearer token and every AWS role before their first composed downstream use', async (t) => {
    // arrange
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-registration-'));
    const credentialEvents: unknown[][] = [];
    const registerSecret = mock<RedactingLogger['registerSecret']>({ exactParams: true, name: 'composed credential registration' });
    when(() => {
      registerSecret('id-token-1', undefined);
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-access-key-id', 'aws-access-key-id');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-secret-access-key', 'aws-secret-access-key');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-session-token', 'aws-session-token');
    }).thenReturn(undefined);

    function silent(): void {
      return undefined;
    }

    const log: RedactingLogger = Object.assign(silent, {
      prefix: '',
      debug: silent,
      error: silent,
      info: silent,
      success: silent,
      warn: silent,
      log: silent,
      registerSecret: (secret: string, role?: SecretRole) => {
        registerSecret(secret, role);
        credentialEvents.push(['register', secret, role]);
      },
    });
    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants(),
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log,
      connect: (url, options) => {
        credentialEvents.push(['connect', url, options.clientId]);
        throw new Error('the offline broker refuses the connection');
      },
      httpFetch: (input, init) => {
        const url = input.toString();
        credentialEvents.push(['request', url, new Headers(init?.headers).get('authorization')]);

        if (url === 'https://tenant.example.test/oauth/token') {
          return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
        }

        if (url === 'https://api.example.test/devices') {
          return Promise.resolve(new Response(JSON.stringify(geminiWireDeviceList()), { status: 200 }));
        }

        if (url === 'https://api.example.test/credentials/aws') {
          return Promise.resolve(new Response(JSON.stringify(credentialsAt(START_TIME + ONE_HOUR_MS)), { status: 200 }));
        }

        throw new Error('no response is scripted for this route');
      },
      createSalt: () => 'salt-1',
    });
    t.after(async () => {
      await runtime.stop();
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    // act
    await runtime.start();
    await settle();
    const runningState = { path: runtime.monitoringPath, snapshot: runtime.store.snapshot(DEVICE_ID) };
    await runtime.stop();

    // assert
    assert.deepStrictEqual(runningState, {
      path: 'poll-only',
      snapshot: {
        identity: { deviceId: 'account-1_serial-1', deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: 1_700_000_000_000 },
        data: { water_level: 1, primary_pump_running: false, ac_power: true },
        metadata: {},
        shadowVersion: undefined,
        deviceTimestamp: 1_700_000_000_000,
        receivedAt: START_TIME,
      },
    });
    assert.strictEqual(runtime.monitoringPath, 'unavailable');
    assert.deepStrictEqual(credentialEvents, [
      ['request', 'https://tenant.example.test/oauth/token', null],
      ['register', 'id-token-1', undefined],
      ['request', 'https://api.example.test/devices', 'Bearer id-token-1'],
      ['request', 'https://api.example.test/credentials/aws', 'Bearer id-token-1'],
      ['register', 'test-access-key-id', 'aws-access-key-id'],
      ['register', 'test-secret-access-key', 'aws-secret-access-key'],
      ['register', 'test-session-token', 'aws-session-token'],
      ['connect', 'wss://broker.invalid/mqtt', 'client-first'],
    ]);
    verify(registerSecret);
  });

  test('builds every collaborator without requesting HTTP or opening a socket', async (t) => {
    // arrange
    const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'construction HTTP' });
    const connect = mock<MqttConnect>({ exactParams: true, name: 'construction socket' });

    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    // act
    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants(),
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: Object.assign(silentLog(), { registerSecret: () => undefined }),
      connect,
      httpFetch,
      createSalt: () => 'salt-1',
    });

    // assert
    assert.strictEqual(runtime.monitoringPath, 'unavailable');
    verify(httpFetch);
    verify(connect);
  });

  test('AUTH-02 registers the bearer token and all temporary credential roles through composition', async (t) => {
    // arrange
    const registerSecret = mock<RedactingLogger['registerSecret']>({ exactParams: true, name: 'composed credential registration' });
    when(() => {
      registerSecret('id-token-1', undefined);
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-access-key-id', 'aws-access-key-id');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-secret-access-key', 'aws-secret-access-key');
    }).thenReturn(undefined);
    when(() => {
      registerSecret('test-session-token', 'aws-session-token');
    }).thenReturn(undefined);
    const log = Object.assign(silentLog(), {
      registerSecret: (secret: string, role?: SecretRole) => {
        registerSecret(secret, role);
      },
    });
    stubCloud(t);
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants(),
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

    // act
    await runtime.start();
    await settle();
    const discovered = runtime.store.snapshot(DEVICE_ID);
    await runtime.stop();

    // assert
    assert.deepStrictEqual(discovered, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: START_TIME,
    });
    assert.strictEqual(runtime.monitoringPath, 'unavailable');
    verify(registerSecret);
  });

  test('SYNC-04 arms the rotation on the lead the caller states for a distant expiry', async (t) => {
    // arrange
    const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'composed HTTP requests' });
    when(() =>
      httpFetch('https://tenant.example.test/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'homebridge-basement-guardian' },
        body:
          '{"grant_type":"http://auth0.com/oauth/grant-type/password-realm","realm":"example-realm"' +
          ',"client_id":"client-id-1","username":"account@example.test","password":"account-password"' +
          ',"scope":"openid profile email"}',
        signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      }),
    ).thenResolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/devices'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(geminiWireDeviceList()), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/devices'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(geminiWireDeviceList()), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/credentials/aws'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(credentialsAt(START_TIME + ONE_HOUR_MS)), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/credentials/aws'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(credentialsAt(START_TIME + ONE_HOUR_MS)), { status: 200 }));

    t.mock.timers.enable({ apis: ['setTimeout'] });
    const requests = stubCloud(t, httpFetch);
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      t.mock.timers.reset();
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants(),
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: Object.assign(silentLog(), { registerSecret: () => undefined }),
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
    verify(httpFetch);
  });

  test('waits for the supplied rotation floor when the composed expiry is inside the lead window', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'composed floor requests' });
    when(() =>
      httpFetch('https://tenant.example.test/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'homebridge-basement-guardian' },
        body:
          '{"grant_type":"http://auth0.com/oauth/grant-type/password-realm","realm":"example-realm"' +
          ',"client_id":"client-id-1","username":"account@example.test","password":"account-password"' +
          ',"scope":"openid profile email"}',
        signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      }),
    ).thenResolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/devices'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(geminiWireDeviceList()), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/credentials/aws'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(credentialsAt(START_TIME + 5)), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/credentials/aws'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(rotatedCredentialsAt(START_TIME + 5)), { status: 200 }));
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-floor-'));
    let elapsedMs = 0;
    const credentialRequests: number[] = [];
    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants(),
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME + elapsedMs },
      monotonic: { now: () => MONOTONIC_START_TIME + elapsedMs },
      log: Object.assign(silentLog(), { registerSecret: () => undefined }),
      connect: () => {
        throw new Error('the offline broker refuses the connection');
      },
      httpFetch: (input, init) => {
        if (input.toString() === 'https://api.example.test/credentials/aws') {
          credentialRequests.push(elapsedMs);
        }

        return httpFetch(input, init);
      },
      createSalt: () => 'salt-1',
      rotationLeadMs: 10,
      minRotationDelayMs: 5,
    });
    t.after(async () => {
      await runtime.stop();
      t.mock.timers.reset();
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
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

    // act
    await runtime.start();
    await settle();
    elapsedMs = 4;
    t.mock.timers.tick(4);
    await settle();
    const beforeFloor = { path: runtime.monitoringPath, snapshot: runtime.store.snapshot(DEVICE_ID), credentialRequests: [...credentialRequests] };
    elapsedMs = 5;
    t.mock.timers.tick(1);
    await settle();
    const atFloor = { path: runtime.monitoringPath, snapshot: runtime.store.snapshot(DEVICE_ID), credentialRequests: [...credentialRequests] };
    await runtime.stop();

    // assert
    assert.deepStrictEqual(
      { beforeFloor, atFloor },
      {
        beforeFloor: { path: 'poll-only', snapshot: expectedSnapshot, credentialRequests: [0] },
        atFloor: { path: 'poll-only', snapshot: expectedSnapshot, credentialRequests: [0, 5] },
      },
    );
    assert.strictEqual(runtime.monitoringPath, 'unavailable');
    verify(httpFetch);
  });

  test('uses a no-op monitoring-health listener when the caller supplies none', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    stubCloud(t);
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      t.mock.timers.reset();
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants(),
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: Object.assign(silentLog(), { registerSecret: () => undefined }),
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

    // act
    t.mock.timers.tick(POLL_INTERVAL_MS);
    const polling = settle();
    await polling;

    // assert
    await assert.doesNotReject(polling);
  });

  test('reports the monitoring trust to the listener the caller supplies', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    stubCloud(t);
    const reported: MonitoringTrust[] = [];
    const listener = mock<AccountRuntimeOptions['onMonitoringHealth']>({ exactParams: true, name: 'composed monitoring listener' });
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    when(() => {
      listener(
        { restDegraded: false, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
        new Map([[DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false }]]),
      );
    }).thenReturn(undefined);
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      t.mock.timers.reset();
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants(),
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: Object.assign(silentLog(), { registerSecret: () => undefined }),
      connect: () => {
        throw new Error('no socket expected');
      },
      httpFetch: (input, init) => globalThis.fetch(input, init),
      createSalt: () => 'salt-1',
      onMonitoringHealth: (account: MonitoringTrust, byDevice: ReadonlyMap<string, MonitoringTrust>): void => {
        listener(account, byDevice);
        reported.push(account);
      },
    });

    t.after(async () => {
      await runtime.stop();
    });

    // act
    await runtime.start();
    await settle();

    const beforeStop = [...reported];
    await runtime.stop();

    // assert
    assert.deepStrictEqual(beforeStop, [
      { restDegraded: false, shadowSilent: ACCOUNT_DECLINES_TO_VOUCH, commandTransportReady: true, credentialsRejected: false },
    ]);
    assert.strictEqual(runtime.monitoringPath, 'unavailable');
    verify(listener);
  });

  test('DEV-05 uses a no-op removal listener when the caller supplies none', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'composed HTTP requests' });
    when(() =>
      httpFetch('https://tenant.example.test/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'homebridge-basement-guardian' },
        body:
          '{"grant_type":"http://auth0.com/oauth/grant-type/password-realm","realm":"example-realm"' +
          ',"client_id":"client-id-1","username":"account@example.test","password":"account-password"' +
          ',"scope":"openid profile email"}',
        signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
      }),
    ).thenResolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/devices'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(geminiWireDeviceList()), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/devices'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/devices'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/devices'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
    when(() =>
      httpFetch(
        It.matches<string | URL>((input) => input instanceof URL && input.href === 'https://api.example.test/credentials/aws'),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' },
          signal: It.matches<AbortSignal>((signal) => signal instanceof AbortSignal && !signal.aborted),
        },
      ),
    ).thenResolve(new Response(JSON.stringify(credentialsAt(START_TIME + ONE_HOUR_MS)), { status: 200 }));
    const requests = stubCloud(t, httpFetch);
    const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-seam-'));

    t.after(async () => {
      t.mock.timers.reset();
      await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants(),
      registry: createFamilyRegistry(),
      storagePath,
      clock: { now: () => START_TIME },
      monotonic: { now: () => MONOTONIC_START_TIME },
      log: Object.assign(silentLog(), { registerSecret: () => undefined }),
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

    // act
    t.mock.timers.tick(POLL_INTERVAL_MS);
    await settle();
    t.mock.timers.tick(POLL_INTERVAL_MS);
    const polling = settle();
    await polling;
    const devicesCalls = requests.filter((request) => request.url.endsWith('/devices')).length;

    // assert
    await assert.doesNotReject(polling);
    assert.strictEqual(devicesCalls, 4);
    verify(httpFetch);
  });
});
