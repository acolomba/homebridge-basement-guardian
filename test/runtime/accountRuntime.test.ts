import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { setImmediate as nextEventLoopTurn } from 'node:timers/promises';

import { createCloudApi } from '../../src/cloud/api.js';
import { createAuthClient } from '../../src/cloud/auth.js';
import { AuthHaltedError, AuthRejectedError, AuthThrottledError, CloudRequestError } from '../../src/cloud/errors.js';
import { createDeviceStateStore } from '../../src/device/state.js';
import { createRedactingLogger } from '../../src/logging.js';
import { createAccountRuntime, createAccountRuntimeFromConfig, MIN_ROTATION_DELAY_MS, ROTATION_LEAD_MS } from '../../src/runtime/accountRuntime.js';
import { createFailureLog, FAILURE_REMINDER_MS } from '../../src/runtime/failureLog.js';
import { createRetryPolicy, MAX_BACKOFF_MS } from '../../src/runtime/retryPolicy.js';

import type { CloudApi } from '../../src/cloud/api.js';
import type { MqttConnect } from '../../src/cloud/mqttTransport.js';
import type { ShadowClient } from '../../src/cloud/shadow.js';
import type { ApiDevice, AwsCredentialsResponse } from '../../src/cloud/types.js';
import type { BgConfig } from '../../src/config.js';
import type { DeviceSnapshot, DeviceStateStore } from '../../src/device/state.js';
import type { SecretRole } from '../../src/logging.js';
import type { ProtocolConstants } from '../../src/protocol.js';
import type { AccountRuntime, ShadowRuntimeOptions } from '../../src/runtime/accountRuntime.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { LogLevel, Logging } from 'homebridge';
import type { TestContext } from 'node:test';

const DEVICE_ID = 'account-1_serial-1';
const OTHER_DEVICE_ID = 'account-1_serial-2';
const START_TIME = Date.parse('2026-08-28T12:00:00.000Z');
const ONE_HOUR_MS = 3_600_000;
const POLL_INTERVAL_MS = 900_000;
const THROTTLE_RETRY_MS = 1_800_000;

// The one actionable line a degraded monitoring path produces, restated here so
// the case fails if the wording drifts.
const DEGRADED_LINE = 'The shadow connection is unavailable, so device state is coming from polling alone until it returns.';

// The line a terminal authentication answer records, restated here for the same
// reason.
const STOPPED_LINE = 'Monitoring has stopped because the vendor refused the account credentials. Correct the account in Homebridge to start the plugin again.';

// The rotation the fixture expiry produces: an hour of credential life, less
// the ten-minute lead.
const ROTATION_DELAY_MS = ONE_HOUR_MS - ROTATION_LEAD_MS;

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

// Mimics the vendor request's abort behavior: it settles only when its signal
// aborts, which is how a shutdown reaches a request that is already in flight.
function hangingUntilAborted(signal: AbortSignal): Promise<never> {
  return new Promise<never>((_resolve, reject) => {
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

// A shadow client that opens no socket. Starting it reports the connection the
// way the real client does, from its connect notification.
//
// `whileStarting` holds the start unresolved after the connection has been
// announced, which is the window a shutdown has to land in for the runtime to
// see no client to close.
function fakeShadow(
  options: ShadowRuntimeOptions,
  closeFails = false,
  whileStarting?: () => Promise<void>,
): { client: ShadowClient; recorder: ShadowRecorder } {
  const subscribed: string[][] = [];
  let closes = 0;
  let live = false;

  return {
    client: {
      get connected(): boolean {
        return live;
      },
      start: (deviceIds: readonly string[]): Promise<void> => {
        subscribed.push([...deviceIds]);
        live = true;
        options.onConnected();

        return whileStarting === undefined ? Promise.resolve() : whileStarting();
      },
      close: (): Promise<void> => {
        closes += 1;
        live = false;

        return closeFails ? Promise.reject(new Error('the connection could not be closed')) : Promise.resolve();
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
  /** Work the shadow start waits for, which is how a case lands a shutdown inside that window. */
  whileShadowStarts: () => Promise<void>;
  pollIntervalMs: number;
  rotationLeadMs: number;
  minRotationDelayMs: number;
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
  advance: (ms: number) => Promise<void>;
}

// Drains the promise chains a timer wakes, so a scheduled fetch and everything
// it triggers have settled before the assertions run.
async function settle(): Promise<void> {
  for (let turn = 0; turn < 8; turn += 1) {
    await nextEventLoopTurn();
  }
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
  let time = START_TIME;

  const clock: Clock = { now: () => time };
  const log = recordingLog(logged);
  const store = createDeviceStateStore({ clock, log: recordingLog([]) });

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
    sendCommand: () => Promise.reject(new Error('the runtime must not reach the command route')),
  };

  const runtime = createAccountRuntime({
    api,
    store,
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
    },
    clock,
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
    advance: async (ms: number): Promise<void> => {
      time += ms;
      t.mock.timers.tick(ms);
      await settle();
    },
  };
}

function countOf(logged: readonly string[], level: string): number {
  return logged.filter((line) => line.startsWith(`${level} `)).length;
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
    assert.deepStrictEqual(runtime.store.snapshot(DEVICE_ID), store.snapshot(DEVICE_ID));
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
    await advance(MIN_ROTATION_DELAY_MS);

    // assert
    assert.strictEqual(calls.filter((call) => call === 'credentials').length, 3);
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
    assert.deepStrictEqual({ warnings: countOf(logged, 'warn'), repeats: countOf(logged, 'debug') }, { warnings: 1, repeats: 2 });
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
    assert.deepStrictEqual({ removed, warnings: countOf(logged, 'warn') }, { removed: [], warnings: 0 });

    // act
    await advance(POLL_INTERVAL_MS);

    // assert
    assert.deepStrictEqual({ devicesCalls: devicesCallCount(calls), removed }, { devicesCalls: 6, removed: [DEVICE_ID] });
  });
});

// Wires the real authentication client, REST client, and store behind the
// runtime, so only the network boundary is replaced. The token cache lands in
// this case's own storage directory, which is removed when the case ends.
async function endToEndRuntime(t: TestContext, logged: string[]): Promise<{ runtime: AccountRuntime; store: DeviceStateStore }> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-account-'));

  t.after(async () => {
    await rm(storagePath, { recursive: true, force: true });
  });

  const clock: Clock = { now: () => START_TIME };
  const log = recordingLog(logged);
  const auth = createAuthClient({
    constants: testConstants,
    clientId: 'client-id-1',
    email: 'account@example.test',
    password: 'account-password',
    storagePath,
    requestTimeoutMs: 1_000,
    clock,
    createSalt: () => 'salt-1',
    registerSecret: () => undefined,
    log,
  });
  const api = createCloudApi({ baseUrl: testConstants.apiUrl, auth, requestTimeoutMs: 1_000 });
  const store = createDeviceStateStore({ clock, log });
  const runtime = createAccountRuntime({
    api,
    store,
    createShadow: (shadowOptions: ShadowRuntimeOptions): ShadowClient => fakeShadow(shadowOptions).client,
    createRetry: (signal: AbortSignal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log }),
    pollIntervalMs: POLL_INTERVAL_MS,
    rotationLeadMs: ROTATION_LEAD_MS,
    minRotationDelayMs: MIN_ROTATION_DELAY_MS,
    failures: createFailureLog({ clock, log, reminderIntervalMs: FAILURE_REMINDER_MS }),
    registerSecret: () => undefined,
    onTrustworthyInventory: () => undefined,
    onDeviceRemoved: () => undefined,
    clock,
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
      await rm(storagePath, { recursive: true, force: true });
    });

    // act
    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      storagePath,
      clock: { now: () => START_TIME },
      log: createRedactingLogger({ delegate: recordingLog([]), secrets: [] }),
      connect,
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
      await rm(storagePath, { recursive: true, force: true });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      storagePath,
      clock: { now: () => START_TIME },
      log,
      connect: () => {
        throw new Error('no socket expected');
      },
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
      await rm(storagePath, { recursive: true, force: true });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      storagePath,
      clock: { now: () => START_TIME },
      log: createRedactingLogger({ delegate: recordingLog([]), secrets: [] }),
      connect: () => {
        throw new Error('no socket expected');
      },
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
      await rm(storagePath, { recursive: true, force: true });
    });

    const runtime = createAccountRuntimeFromConfig({
      config: accountConfig(),
      constants: testConstants,
      storagePath,
      clock: { now: () => START_TIME },
      log: createRedactingLogger({ delegate: recordingLog([]), secrets: [] }),
      connect: () => {
        throw new Error('no socket expected');
      },
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
