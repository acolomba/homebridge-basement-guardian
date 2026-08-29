import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMMAND_DEADLINE_MS, createCloudApi, ROUTES } from '../../src/cloud/api.js';
import { CloudRequestError } from '../../src/cloud/errors.js';

import type { CloudApi, CloudApiOptions } from '../../src/cloud/api.js';
import type { AuthClient } from '../../src/cloud/auth.js';
import type { ApiDevice, AwsCredentialsResponse } from '../../src/cloud/types.js';
import type { TestContext } from 'node:test';

// Longer than the command deadline, which is what lets a case tell the two apart.
const REQUEST_TIMEOUT_MS = 10_000;

const auth: AuthClient = { idToken: () => Promise.resolve('id-token-1') };

// The vendor deviceId reads <account-id>_<serial-number>; fixtures carry a
// placeholder in place of the real account identifier.
function geminiDevice(): ApiDevice {
  return {
    deviceId: 'account-1_serial-1',
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: 1_700_000_000_000 },
    data: { water_level: 1 },
  };
}

// Every field here is invented; the vendor issues these values at runtime.
function awsCredentialsResponse(): AwsCredentialsResponse {
  return {
    endpoint: 'shadow.example.test',
    clientId: 'shadow-client-1',
    credentials: {
      AccessKeyId: 'access-key-1',
      SecretAccessKey: 'secret-access-key-1',
      SessionToken: 'session-token-1',
      Expiration: '2026-01-01T00:00:00.000Z',
    },
  };
}

function apiOptions(overrides: Partial<CloudApiOptions> = {}): CloudApiOptions {
  return { baseUrl: 'https://api.example.test', auth, requestTimeoutMs: REQUEST_TIMEOUT_MS, ...overrides };
}

interface RecordedRequest {
  method: string;
  url: string;
  authorization: string | undefined;
  contentType: string | undefined;
  body: string | undefined;
}

// Records every request and answers each one with a fresh Response.
function stubFetch(t: TestContext, respond: () => Response): RecordedRequest[] {
  const vendorRequests: RecordedRequest[] = [];

  t.mock.method(globalThis, 'fetch', (input: string | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);

    vendorRequests.push({
      method: init?.method ?? '',
      url: input.toString(),
      authorization: headers.get('authorization') ?? undefined,
      contentType: headers.get('content-type') ?? undefined,
      body: typeof init?.body === 'string' ? init.body : undefined,
    });

    return Promise.resolve(respond());
  });

  return vendorRequests;
}

// Mimics fetch's abort behavior: a request settles only when its signal aborts.
function stubHangingFetch(t: TestContext): void {
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

// Replaces the per-request deadline with a signal the case owns, and records the
// deadline each route asked for, so a case reads a deadline without waiting it out.
function stubDeadlines(t: TestContext): { requested: number[]; expire: () => void } {
  const requested: number[] = [];
  const deadline = new AbortController();

  t.mock.method(AbortSignal, 'timeout', (milliseconds: number) => {
    requested.push(milliseconds);

    return deadline.signal;
  });

  return {
    requested,
    expire: (): void => {
      deadline.abort();
    },
  };
}

// Records the signal each request carries, so a case can compare it with the
// signal the token fetch was handed.
function stubSignalRecordingFetch(t: TestContext): (AbortSignal | null | undefined)[] {
  const requestSignals: (AbortSignal | null | undefined)[] = [];

  t.mock.method(globalThis, 'fetch', (_input: string | URL, init?: RequestInit) => {
    requestSignals.push(init?.signal);

    return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
  });

  return requestSignals;
}

// Answers with a token and records the signal the token fetch was given.
function stubRecordingAuth(tokenSignals: AbortSignal[]): AuthClient {
  return {
    idToken: (signal: AbortSignal): Promise<string> => {
      tokenSignals.push(signal);

      return Promise.resolve('id-token-1');
    },
  };
}

test('reaches exactly the four vendor routes this version uses', () => {
  // act & assert
  assert.deepStrictEqual(ROUTES, {
    devices: 'GET /devices',
    device: 'GET /devices/{deviceId}',
    command: 'PUT /devices/{deviceId}/data',
    awsCredentials: 'GET /credentials/aws',
  });
});

test('waits at most 2500 milliseconds for the vendor to accept a command', () => {
  // act & assert
  assert.strictEqual(COMMAND_DEADLINE_MS, 2_500);
});

test('authorizes the device request with the bearer token the auth client supplies', async (t) => {
  // arrange
  const vendorRequests = stubFetch(t, () => new Response(JSON.stringify([geminiDevice()]), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  const devices = await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(devices, [geminiDevice()]);
  assert.deepStrictEqual(vendorRequests, [
    { method: 'GET', url: 'https://api.example.test/devices', authorization: 'Bearer id-token-1', contentType: undefined, body: undefined },
  ]);
});

test('reads an empty account as an empty device list', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify([]), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  const devices = await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(devices, []);
});

test('reads one device from the device route', async (t) => {
  // arrange
  const vendorRequests = stubFetch(t, () => new Response(JSON.stringify(geminiDevice()), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  const device = await cloudApi.device('account-1_serial-1', new AbortController().signal);

  // assert
  assert.deepStrictEqual(device, geminiDevice());
  assert.deepStrictEqual(vendorRequests, [
    {
      method: 'GET',
      url: 'https://api.example.test/devices/account-1_serial-1',
      authorization: 'Bearer id-token-1',
      contentType: undefined,
      body: undefined,
    },
  ]);
});

test('encodes a device identifier that needs percent-encoding into the path', async (t) => {
  // arrange
  const vendorRequests = stubFetch(t, () => new Response(JSON.stringify(geminiDevice()), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  await cloudApi.device('account 1/serial#1', new AbortController().signal);

  // assert
  assert.deepStrictEqual(
    vendorRequests.map((vendorRequest) => vendorRequest.url),
    ['https://api.example.test/devices/account%201%2Fserial%231'],
  );
});

test('reads the shadow endpoint, the client identifier, and the temporary credentials', async (t) => {
  // arrange
  const vendorRequests = stubFetch(t, () => new Response(JSON.stringify(awsCredentialsResponse()), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  const credentials = await cloudApi.awsCredentials(new AbortController().signal);

  // assert
  assert.deepStrictEqual(credentials, awsCredentialsResponse());
  assert.deepStrictEqual(vendorRequests, [
    { method: 'GET', url: 'https://api.example.test/credentials/aws', authorization: 'Bearer id-token-1', contentType: undefined, body: undefined },
  ]);
});

test('sends a device command as a desiredData body and reports the vendor answer', async (t) => {
  // arrange
  const vendorRequests = stubFetch(t, () => new Response(JSON.stringify({ success: true }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  const commandResult = await cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal);

  // assert
  assert.deepStrictEqual(commandResult, { success: true });
  assert.deepStrictEqual(vendorRequests, [
    {
      method: 'PUT',
      url: 'https://api.example.test/devices/account-1_serial-1/data',
      authorization: 'Bearer id-token-1',
      contentType: 'application/json',
      body: '{"desiredData":{"test_running":true}}',
    },
  ]);
});

test('reports a refused command rather than raising', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify({ success: false }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  const commandResult = await cloudApi.sendCommand('account-1_serial-1', { desiredData: { alarm_audio_muted: true } }, new AbortController().signal);

  // assert
  assert.deepStrictEqual(commandResult, { success: false });
});

test('refuses a device response the vendor answered with an error status', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify({ error: { code: 403, message: 'Token is missing' } }), { status: 403 }));
  const cloudApi = createCloudApi(apiOptions());

  // act & assert
  await assert.rejects(
    () => cloudApi.devices(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.strictEqual(error.status, 403);
      assert.strictEqual(error.route, 'GET /devices');
      assert.strictEqual(error.message, 'GET /devices failed with HTTP 403.');

      return true;
    },
  );
});

test('refuses a device response whose shape the plugin cannot read', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify([{ deviceId: 'account-1_serial-1' }]), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act & assert
  await assert.rejects(
    () => cloudApi.devices(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.strictEqual(error.status, 200);
      assert.strictEqual(error.route, 'GET /devices');
      assert.strictEqual(error.message, 'GET /devices returned a response the plugin cannot read.');

      return true;
    },
  );
});

test('refuses a credential response whose shape the plugin cannot read', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify({ endpoint: 'shadow.example.test' }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act & assert
  await assert.rejects(
    () => cloudApi.awsCredentials(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.strictEqual(error.status, 200);
      assert.strictEqual(error.route, 'GET /credentials/aws');
      assert.strictEqual(error.message, 'GET /credentials/aws returned a response the plugin cannot read.');

      return true;
    },
  );
});

test('refuses a command response whose shape the plugin cannot read', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify({ accepted: 'yes' }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act & assert
  await assert.rejects(
    () => cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.strictEqual(error.status, 200);
      assert.strictEqual(error.route, 'PUT /devices/{deviceId}/data');
      assert.strictEqual(error.message, 'PUT /devices/{deviceId}/data returned a response the plugin cannot read.');

      return true;
    },
  );
});

test('keeps the token, the base URL, and the response body out of a failed request error', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify({ error: { code: 403, message: 'Token is missing' } }), { status: 403 }));
  const cloudApi = createCloudApi(apiOptions());

  // act & assert
  await assert.rejects(
    () => cloudApi.device('account-1_serial-1', new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.deepStrictEqual(
        ['id-token-1', 'api.example.test', 'account-1_serial-1', 'Token is missing'].filter((secret) => `${error.message} ${error.route}`.includes(secret)),
        [],
      );
      assert.strictEqual(error.route, 'GET /devices/{deviceId}');

      return true;
    },
  );
});

test('deadlines a read route with the configured request timeout', async (t) => {
  // arrange
  const deadlines = stubDeadlines(t);
  stubFetch(t, () => new Response(JSON.stringify([]), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(deadlines.requested, [REQUEST_TIMEOUT_MS]);
});

test('deadlines a command with the command deadline rather than the request timeout', async (t) => {
  // arrange
  const deadlines = stubDeadlines(t);
  stubFetch(t, () => new Response(JSON.stringify({ success: true }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  await cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal);

  // assert
  assert.deepStrictEqual(deadlines.requested, [COMMAND_DEADLINE_MS]);
});

test('aborts an in-flight device request when the root signal aborts', async (t) => {
  // arrange
  stubHangingFetch(t);
  const rootController = new AbortController();
  const cloudApi = createCloudApi(apiOptions());

  // act
  const devices = cloudApi.devices(rootController.signal);
  rootController.abort();

  // assert
  await assert.rejects(() => devices);
});

test('aborts a device request on its own deadline while the root signal stays open', async (t) => {
  // arrange
  stubHangingFetch(t);
  const cloudApi = createCloudApi(apiOptions({ requestTimeoutMs: 10 }));
  const rootController = new AbortController();

  // act & assert
  await assert.rejects(() => cloudApi.devices(rootController.signal));
  assert.strictEqual(rootController.signal.aborted, false);
});

test('aborts a command on its own deadline while the root signal stays open', async (t) => {
  // arrange
  const deadlines = stubDeadlines(t);
  stubHangingFetch(t);
  const rootController = new AbortController();
  const cloudApi = createCloudApi(apiOptions());

  // act
  const commandResult = cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, rootController.signal);
  deadlines.expire();

  // assert
  await assert.rejects(() => commandResult);
  assert.strictEqual(rootController.signal.aborted, false);
});

test('refuses a device response whose body is not JSON at all', async (t) => {
  // arrange
  stubFetch(t, () => new Response('<html><body>gateway error</body></html>', { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act & assert
  await assert.rejects(
    () => cloudApi.devices(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.deepStrictEqual(
        { message: error.message, route: error.route, status: error.status },
        { message: 'GET /devices returned a response the plugin cannot read.', route: 'GET /devices', status: 200 },
      );

      return true;
    },
  );
});

test('deadlines the token fetch with the same signal it deadlines the request with', async (t) => {
  // arrange
  const tokenSignals: AbortSignal[] = [];
  const requestSignals = stubSignalRecordingFetch(t);
  const cloudApi = createCloudApi(apiOptions({ auth: stubRecordingAuth(tokenSignals) }));
  const rootController = new AbortController();

  // act
  await cloudApi.devices(rootController.signal);

  // assert
  assert.strictEqual(tokenSignals.length, 1);
  assert.strictEqual(requestSignals.length, 1);
  assert.ok(tokenSignals[0] instanceof AbortSignal);
  assert.strictEqual(requestSignals[0], tokenSignals[0]);
  assert.notStrictEqual(tokenSignals[0], rootController.signal);
});

test('abandons a command without sending it when its deadline expired before the token was fetched', async (t) => {
  // arrange
  const deadlines = stubDeadlines(t);
  const lapsedAuth: AuthClient = {
    idToken: (signal: AbortSignal): Promise<string> =>
      signal.aborted ? Promise.reject(new Error('the token fetch was aborted')) : Promise.resolve('id-token-1'),
  };
  const vendorRequests = stubFetch(t, () => new Response(JSON.stringify({ success: true }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ auth: lapsedAuth }));
  deadlines.expire();

  // act & assert
  await assert.rejects(() => cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal));
  assert.deepStrictEqual(vendorRequests, []);
});

// One invocation per operation. The `Record<keyof CloudApi, ...>` annotation is
// the closed door: adding a fifth operation to `CloudApi` stops this file from
// compiling until the operation is listed here, so no new vendor route can
// reach the network without the route cases below being revisited (SYNC-01).
function invocations(cloudApi: CloudApi): Record<keyof CloudApi, () => Promise<unknown>> {
  return {
    devices: () => cloudApi.devices(new AbortController().signal),
    device: () => cloudApi.device('account-1_serial-1', new AbortController().signal),
    awsCredentials: () => cloudApi.awsCredentials(new AbortController().signal),
    sendCommand: () => cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal),
  };
}

// One well-formed answer per operation, so every call passes narrowing and its
// request is recorded rather than being cut short by a rejection.
function vendorBodies(): Record<keyof CloudApi, string> {
  return {
    devices: JSON.stringify([geminiDevice()]),
    device: JSON.stringify(geminiDevice()),
    awsCredentials: JSON.stringify(awsCredentialsResponse()),
    sendCommand: JSON.stringify({ success: true }),
  };
}

// Runs every operation of the client and reports what actually left the
// process, as `METHOD /path` lines in invocation order.
async function reachedRoutes(t: TestContext, cloudApi: CloudApi): Promise<string[]> {
  const bodies = vendorBodies();
  let nextBody = '';
  const vendorRequests = stubFetch(t, () => new Response(nextBody, { status: 200 }));
  const operations = invocations(cloudApi);

  for (const [name, invoke] of Object.entries(operations)) {
    nextBody = bodies[name as keyof CloudApi];
    await invoke();
  }

  return vendorRequests.map((request) => `${request.method} ${new URL(request.url).pathname}`);
}

test('offers exactly four operations, so no fifth vendor route is callable (SYNC-01)', () => {
  // arrange
  const cloudApi = createCloudApi(apiOptions());

  // act & assert
  assert.deepStrictEqual(Object.keys(cloudApi).sort(), ['awsCredentials', 'device', 'devices', 'sendCommand']);
  assert.deepStrictEqual(Object.keys(cloudApi).sort(), Object.keys(invocations(cloudApi)).sort());
});

test('reaches only the four declared routes when every operation runs (SYNC-01)', async (t) => {
  // arrange
  const cloudApi = createCloudApi(apiOptions());

  // act
  const routesReached = await reachedRoutes(t, cloudApi);

  // assert
  assert.deepStrictEqual(routesReached, ['GET /devices', 'GET /devices/account-1_serial-1', 'GET /credentials/aws', 'PUT /devices/account-1_serial-1/data']);
});

test('touches no excluded account-management path family (SYNC-01)', async (t) => {
  // arrange
  const excluded = ['account', 'accounts', 'users', 'firmware', 'locations', 'rules', 'contacts'];
  const cloudApi = createCloudApi(apiOptions());

  // act
  const routesReached = await reachedRoutes(t, cloudApi);

  // assert
  const pathFamilies = [...new Set(routesReached.map((route) => route.split('/').at(1) ?? ''))].sort();
  assert.deepStrictEqual(pathFamilies, ['credentials', 'devices']);
  assert.deepStrictEqual(
    pathFamilies.filter((family) => excluded.includes(family)),
    [],
  );
});
