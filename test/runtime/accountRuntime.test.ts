import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { createCloudApi } from '../../src/cloud/api.js';
import { createAuthClient } from '../../src/cloud/auth.js';
import { CloudRequestError } from '../../src/cloud/errors.js';
import { createDeviceStateStore } from '../../src/device/state.js';
import { createAccountRuntime } from '../../src/runtime/accountRuntime.js';

import type { CloudApi } from '../../src/cloud/api.js';
import type { ApiDevice } from '../../src/cloud/types.js';
import type { DeviceStateStore } from '../../src/device/state.js';
import type { ProtocolConstants } from '../../src/protocol.js';
import type { AccountRuntime } from '../../src/runtime/accountRuntime.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { LogLevel, Logging } from 'homebridge';
import type { TestContext } from 'node:test';

// Device time and local receipt time are deliberately different, so a snapshot
// that collapsed the two would fail the end-to-end case.
const DEVICE_TIME = 1_700_000_000_000;
const RECEIVED_AT = 1_700_000_777_000;

const clock: Clock = { now: () => RECEIVED_AT };

const testConstants: ProtocolConstants = {
  apiUrl: 'https://api.example.test',
  clientId: 'bundled-client-id',
  auth0Domain: 'tenant.example.test',
  auth0Realm: 'example-realm',
  awsRegion: 'us-east-1',
  protocol: 'wss',
};

// The vendor deviceId reads <account-id>_<serial-number>; fixtures carry a
// placeholder in place of the real account identifier.
function geminiDevice(): ApiDevice {
  return {
    deviceId: 'account-1_serial-1',
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: DEVICE_TIME },
    data: { water_level: 1, primary_pump_running: false, ac_power: true },
  };
}

// A REST client whose discovery route answers as the case asks. Every other
// route rejects, so a runtime that reached one would fail the case instead of
// passing on a route it has no business calling.
function discoveryOnlyApi(devices: () => Promise<readonly ApiDevice[]>): CloudApi {
  const unreachable = (route: string): Promise<never> => Promise.reject(new Error(`discovery must not reach ${route}`));

  return {
    devices,
    device: () => unreachable('the device route'),
    awsCredentials: () => unreachable('the credentials route'),
    sendCommand: () => unreachable('the command route'),
  };
}

function createRecordingLog(messages: string[]): Logging {
  const record = (message: string): void => {
    messages.push(message);
  };

  return Object.assign(record, {
    prefix: 'basement guardian',
    debug: record,
    error: record,
    info: record,
    log: (level: LogLevel, message: string): void => {
      messages.push(`${level} ${message}`);
    },
    success: record,
    warn: record,
  });
}

// Wires the real authentication client, REST client, and store behind the
// runtime, so only the network boundary is replaced. The token cache lands in
// this case's own storage directory, which is removed when the case ends.
async function createAccount(t: TestContext, messages: string[] = []): Promise<{ runtime: AccountRuntime; store: DeviceStateStore }> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-account-'));

  t.after(async () => {
    await rm(storagePath, { recursive: true, force: true });
  });

  const log = createRecordingLog(messages);
  const auth = createAuthClient({
    constants: testConstants,
    clientId: 'client-id-1',
    email: 'account@example.test',
    password: 'account-password',
    storagePath,
    requestTimeoutMs: 1_000,
    clock,
    createSalt: () => 'salt-1',
    log,
  });
  const api = createCloudApi({ baseUrl: testConstants.apiUrl, auth, requestTimeoutMs: 1_000 });
  const store = createDeviceStateStore({ clock, log });

  return { runtime: createAccountRuntime({ api, store, clock, log }), store };
}

// Answers the token request and the device request, recording both.
function stubCloud(t: TestContext, devices: unknown): { url: string; authorization: string | undefined }[] {
  const requests: { url: string; authorization: string | undefined }[] = [];

  t.mock.method(globalThis, 'fetch', (input: string | URL, init?: RequestInit) => {
    const url = input.toString();
    requests.push({ url, authorization: new Headers(init?.headers).get('authorization') ?? undefined });

    if (url.endsWith('/oauth/token')) {
      return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
    }

    return Promise.resolve(new Response(JSON.stringify(devices), { status: 200 }));
  });

  return requests;
}

// Mimics fetch's abort behavior: a request settles only when its signal aborts.
function stubHangingCloud(t: TestContext): void {
  t.mock.method(globalThis, 'fetch', (_input: string | URL, init?: RequestInit) => {
    const { signal } = init ?? {};

    return new Promise<Response>((_resolve, reject) => {
      const abort = (): void => {
        reject(new Error('the request was aborted'));
      };

      if (signal?.aborted === true) {
        abort();

        return;
      }

      signal?.addEventListener('abort', abort);
    });
  });
}

test('authenticates, discovers one device, and stores its canonical snapshot', async (t) => {
  // arrange
  const requests = stubCloud(t, [geminiDevice()]);
  const { runtime, store } = await createAccount(t);

  // act
  await runtime.start();

  // assert
  assert.deepStrictEqual(store.deviceIds(), ['account-1_serial-1']);
  assert.deepStrictEqual(store.snapshot('account-1_serial-1'), {
    identity: { deviceId: 'account-1_serial-1', deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
    connectivity: { connected: true, timestamp: DEVICE_TIME },
    data: { water_level: 1, primary_pump_running: false, ac_power: true },
    metadata: {},
    shadowVersion: undefined,
    deviceTimestamp: DEVICE_TIME,
    receivedAt: RECEIVED_AT,
  });
  assert.deepStrictEqual(requests, [
    { url: 'https://tenant.example.test/oauth/token', authorization: undefined },
    { url: 'https://api.example.test/devices', authorization: 'Bearer id-token-1' },
  ]);
});

test('resolves a second stop without raising', async (t) => {
  // arrange
  stubCloud(t, [geminiDevice()]);
  const { runtime } = await createAccount(t);
  await runtime.start();

  // act & assert
  await assert.doesNotReject(() => runtime.stop());
  await assert.doesNotReject(() => runtime.stop());
});

test('performs no request when start runs after stop', async (t) => {
  // arrange
  const requests = stubCloud(t, [geminiDevice()]);
  const { runtime } = await createAccount(t);

  // act
  await runtime.stop();
  await runtime.start();

  // assert
  assert.deepStrictEqual(requests, []);
});

test('resolves start with no unhandled rejection when a shutdown interrupts discovery', async (t) => {
  // arrange
  stubHangingCloud(t);
  const { runtime } = await createAccount(t);

  // act
  const started = runtime.start();
  await runtime.stop();

  // assert
  await assert.doesNotReject(() => started);
});

test('logs the route and the status when the vendor refuses discovery', async () => {
  // arrange
  const messages: string[] = [];
  const api = discoveryOnlyApi(() => Promise.reject(new CloudRequestError('GET /devices failed with HTTP 403.', 403, 'GET /devices')));
  const log = createRecordingLog(messages);
  const store = createDeviceStateStore({ clock, log });
  const accountRuntime = createAccountRuntime({ api, store, clock, log });

  // act
  await accountRuntime.start();

  // assert
  assert.deepStrictEqual(messages, ['Device discovery failed on GET /devices with HTTP 403.']);
  assert.deepStrictEqual(store.deviceIds(), []);
});

test('logs a fixed message that repeats nothing from an unexpected discovery failure', async () => {
  // arrange
  const messages: string[] = [];
  const api = discoveryOnlyApi(() => Promise.reject(new Error('connect ECONNREFUSED https://api.example.test/devices')));
  const log = createRecordingLog(messages);
  const store = createDeviceStateStore({ clock, log });
  const accountRuntime = createAccountRuntime({ api, store, clock, log });

  // act
  await accountRuntime.start();

  // assert
  assert.deepStrictEqual(messages, ['Device discovery failed.']);
});

test('reports how many devices the account holds', async (t) => {
  // arrange
  const messages: string[] = [];
  stubCloud(t, [geminiDevice()]);
  const { runtime } = await createAccount(t, messages);

  // act
  await runtime.start();

  // assert
  assert.deepStrictEqual(messages, ['Discovered 1 device(s).']);
});
