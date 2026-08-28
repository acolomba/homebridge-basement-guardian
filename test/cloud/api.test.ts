import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createCloudApi } from '../../src/cloud/api.js';
import { CloudRequestError } from '../../src/cloud/errors.js';

import type { CloudApiOptions } from '../../src/cloud/api.js';
import type { AuthClient } from '../../src/cloud/auth.js';
import type { ApiDevice } from '../../src/cloud/types.js';
import type { TestContext } from 'node:test';

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

function apiOptions(overrides: Partial<CloudApiOptions> = {}): CloudApiOptions {
  return { baseUrl: 'https://api.example.test', auth, requestTimeoutMs: 1_000, ...overrides };
}

// Records every request and answers each one with a fresh Response.
function stubFetch(t: TestContext, respond: () => Response): { url: string; authorization: string | undefined }[] {
  const deviceRequests: { url: string; authorization: string | undefined }[] = [];

  t.mock.method(globalThis, 'fetch', (input: string | URL, init?: RequestInit) => {
    deviceRequests.push({ url: input.toString(), authorization: new Headers(init?.headers).get('authorization') ?? undefined });

    return Promise.resolve(respond());
  });

  return deviceRequests;
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

test('authorizes the device request with the bearer token the auth client supplies', async (t) => {
  // arrange
  const deviceRequests = stubFetch(t, () => new Response(JSON.stringify([geminiDevice()]), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions());

  // act
  const devices = await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(devices, [geminiDevice()]);
  assert.deepStrictEqual(deviceRequests, [{ url: 'https://api.example.test/devices', authorization: 'Bearer id-token-1' }]);
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
