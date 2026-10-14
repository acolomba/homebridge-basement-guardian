// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Verifies vendor REST requests, results, deadlines and privacy.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCACertificates, setDefaultCACertificates } from 'node:tls';

import { It, mock, verify, when } from 'strong-mock';

import { createCloudApi } from '../../src/cloud/api.js';
import { CloudRequestError } from '../../src/cloud/errors.js';
import { httpFetch } from '../../src/cloud/httpDispatcher.js';

import { startAlpnServer } from './alpnServer.js';
import { awsCredentialsResponse, geminiDevice, geminiWireDevice } from './apiSeeds.js';

import type { CloudApiOptions } from '../../src/cloud/api.js';
import type { AuthClient } from '../../src/cloud/auth.js';
import type { HttpFetch } from '../../src/cloud/httpDispatcher.js';
import type { TestContext } from 'node:test';

// Longer than the command deadline, which is what lets a case tell the two apart.
const REQUEST_TIMEOUT_MS = 10_000;

const auth: AuthClient = { idToken: () => Promise.resolve('id-token-1') };

function apiOptions(overrides: Partial<CloudApiOptions> = {}): CloudApiOptions {
  const fixedError = new Error('HTTP transport not supplied');

  return {
    baseUrl: 'https://api.example.test',
    auth,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    httpFetch: () => Promise.reject(fixedError),
    ...overrides,
  };
}

// Mimics fetch's abort behavior: a request settles only when its signal aborts.
function stubHangingFetch(): HttpFetch {
  return (...request) => {
    const { signal } = request[1] ?? {};

    return new Promise<Response>((...settlement) => {
      const reject = settlement[1];
      const abort = (): void => {
        const reason: unknown = signal?.reason;
        assert.ok(reason instanceof Error);
        reject(reason);
      };

      if (signal?.aborted === true) {
        abort();

        return;
      }

      signal?.addEventListener('abort', abort);
    });
  };
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
      deadline.abort(new DOMException('request deadline expired', 'TimeoutError'));
    },
  };
}

// Records the signal each request carries, so a case can compare it with the
// signal the token fetch was handed.
function stubSignalRecordingFetch(): { httpFetch: HttpFetch; requestSignals: (AbortSignal | null | undefined)[] } {
  const requestSignals: (AbortSignal | null | undefined)[] = [];

  const httpFetch: HttpFetch = (...request) => {
    requestSignals.push(request[1]?.signal);

    return Promise.resolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
  };

  return { httpFetch, requestSignals };
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

test('authorizes the device request with the bearer token the auth client supplies', async () => {
  // arrange
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          { method: 'GET', headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' }, signal: undefined },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ devices: [geminiWireDevice()] }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const devices = await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(devices, [geminiDevice()]);
  verify(httpFetch);
});

test('reads an empty account as an empty device list', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const devices = await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(devices, []);
});

test('lifts the serial number the vendor nests under attributes', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ devices: [geminiWireDevice()] }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const devices = await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(devices, [geminiDevice()]);
});

test('carries no vendor field inward beyond the six the plugin reads', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ devices: [geminiWireDevice()] }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const devices = await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(devices, [geminiDevice()]);
});

test('reads one device from the device route', async () => {
  // arrange
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices/account-1_serial-1'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          { method: 'GET', headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' }, signal: undefined },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ device: geminiWireDevice() }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const device = await cloudApi.device('account-1_serial-1', new AbortController().signal);

  // assert
  assert.deepStrictEqual(device, geminiDevice());
  verify(httpFetch);
});

test('encodes a device identifier that needs percent-encoding into the path', async () => {
  // arrange
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices/account%201%2Fserial%231'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          { method: 'GET', headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' }, signal: undefined },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ device: geminiWireDevice() }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const device = await cloudApi.device('account 1/serial#1', new AbortController().signal);

  // assert
  assert.deepStrictEqual(device, geminiDevice());
  verify(httpFetch);
});

test('reads the shadow endpoint, the client identifier, and the temporary credentials', async () => {
  // arrange
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/credentials/aws'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          { method: 'GET', headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' }, signal: undefined },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify(awsCredentialsResponse()), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const credentials = await cloudApi.awsCredentials(new AbortController().signal);

  // assert
  assert.deepStrictEqual(credentials, awsCredentialsResponse());
  verify(httpFetch);
});

test('sends a device command as a desiredData body and reports the vendor answer', async () => {
  // arrange
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices/account-1_serial-1/data'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          {
            method: 'PUT',
            headers: {
              Authorization: 'Bearer id-token-1',
              'Content-Type': 'application/json',
              'User-Agent': 'homebridge-basement-guardian',
              Accept: 'application/json',
            },
            body: '{"desiredData":{"test_running":true}}',
            signal: undefined,
          },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const commandAnswer = await cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal);

  // assert
  assert.deepStrictEqual(commandAnswer, { success: true });
  verify(httpFetch);
});

test('reports a refused command rather than raising', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const commandResult = await cloudApi.sendCommand('account-1_serial-1', { desiredData: { alarm_audio_muted: true } }, new AbortController().signal);

  // assert
  assert.deepStrictEqual(commandResult, { success: false });
});

test('refuses a device response the vendor answered with an error status', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ error: { code: 403, message: 'Token is missing' } }), { status: 403 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

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

test('refuses a device response whose shape the plugin cannot read', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ devices: [{ deviceId: 'account-1_serial-1' }] }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

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

// A normalized record places the serial number at the top level. The vendor
// envelopes require nested attributes, so this payload distinguishes the wire boundary.
test('refuses a device list the vendor sent as a bare top-level array', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify([geminiDevice()]), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

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

// A normalized device lacks the required single-device envelope.
test('refuses a single device the vendor sent with no envelope around it', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify(geminiDevice()), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act & assert
  await assert.rejects(
    () => cloudApi.device('account-1_serial-1', new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.strictEqual(error.status, 200);
      assert.strictEqual(error.route, 'GET /devices/{deviceId}');
      assert.strictEqual(error.message, 'GET /devices/{deviceId} returned a response the plugin cannot read.');

      return true;
    },
  );
});

test('refuses a credential response whose shape the plugin cannot read', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ endpoint: 'shadow.example.test' }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

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

test('refuses a command response whose shape the plugin cannot read', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ accepted: 'yes' }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

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

test('keeps the token, the base URL, and the response body out of a failed request error', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ error: { code: 403, message: 'Token is missing' } }), { status: 403 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act & assert
  await assert.rejects(
    () => cloudApi.device('account-1_serial-1', new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.deepStrictEqual(
        { name: error.name, message: error.message, status: error.status, route: error.route },
        { name: 'CloudRequestError', message: 'GET /devices/{deviceId} failed with HTTP 403.', status: 403, route: 'GET /devices/{deviceId}' },
      );

      return true;
    },
  );
});

test('deadlines a read route with the configured request timeout', async (t) => {
  // arrange
  const deadlines = stubDeadlines(t);
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const devices = await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(devices, []);
  assert.deepStrictEqual(deadlines.requested, [REQUEST_TIMEOUT_MS]);
});

test('deadlines a command with the command deadline rather than the request timeout', async (t) => {
  // arrange
  const deadlines = stubDeadlines(t);
  const httpFetch: HttpFetch = () => Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const commandAnswer = await cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal);

  // assert
  assert.deepStrictEqual(commandAnswer, { success: true });
  assert.deepStrictEqual(deadlines.requested, [2_500]);
});

test('aborts an in-flight device request when the root signal aborts', async () => {
  // arrange
  const exchanges: unknown[] = [];
  const request = stubHangingFetch();
  const httpFetch: HttpFetch = (input, init) => {
    exchanges.push({ method: init?.method, url: input.toString(), headers: Object.fromEntries(new Headers(init?.headers)), body: init?.body });
    init?.signal?.addEventListener(
      'abort',
      () => {
        exchanges.push('root cancelled');
      },
      { once: true },
    );

    return request(input, init);
  };

  const rootController = new AbortController();
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const devices = cloudApi.devices(rootController.signal);
  await Promise.resolve();
  const cancellation = new DOMException('bridge stopped', 'AbortError');
  rootController.abort(cancellation);

  // assert
  await assert.rejects(devices, (error: unknown) => {
    assert.ok(error instanceof DOMException);
    assert.strictEqual(error.name, 'AbortError');
    assert.strictEqual(error, cancellation);

    return true;
  });
  assert.deepStrictEqual(exchanges, [
    {
      method: 'GET',
      url: 'https://api.example.test/devices',
      headers: { authorization: 'Bearer id-token-1', 'user-agent': 'homebridge-basement-guardian' },
      body: undefined,
    },
    'root cancelled',
  ]);
});

test('aborts a device request on its own deadline while the root signal stays open', async (t) => {
  // arrange
  // The deadline is owned by the case rather than waited out. `AbortSignal.timeout`
  // creates an unref'd timer, so a real short deadline is not a slow test, it is a
  // race: with only a hanging fetch pending, the loop drains before the timer fires
  // and the request never settles. The command case below already owns its deadline
  // this way.
  const deadlines = stubDeadlines(t);
  const exchanges: unknown[] = [];
  const request = stubHangingFetch();
  const httpFetch: HttpFetch = (input, init) => {
    exchanges.push({ method: init?.method, url: input.toString(), headers: Object.fromEntries(new Headers(init?.headers)), body: init?.body });
    init?.signal?.addEventListener(
      'abort',
      () => {
        exchanges.push('read timed out');
      },
      { once: true },
    );

    return request(input, init);
  };

  const cloudApi = createCloudApi(apiOptions({ httpFetch }));
  const rootController = new AbortController();

  // act
  const devices = cloudApi.devices(rootController.signal);
  await Promise.resolve();
  deadlines.expire();

  // assert
  await assert.rejects(devices, (error: unknown) => {
    assert.ok(error instanceof DOMException);
    assert.deepStrictEqual({ name: error.name, message: error.message }, { name: 'TimeoutError', message: 'request deadline expired' });

    return true;
  });
  assert.strictEqual(rootController.signal.aborted, false);
  assert.deepStrictEqual(exchanges, [
    {
      method: 'GET',
      url: 'https://api.example.test/devices',
      headers: { authorization: 'Bearer id-token-1', 'user-agent': 'homebridge-basement-guardian' },
      body: undefined,
    },
    'read timed out',
  ]);
});

test('aborts a command on its own deadline while the root signal stays open', async (t) => {
  // arrange
  const deadlines = stubDeadlines(t);
  const exchanges: unknown[] = [];
  const request = stubHangingFetch();
  const httpFetch: HttpFetch = (input, init) => {
    exchanges.push({ method: init?.method, url: input.toString(), headers: Object.fromEntries(new Headers(init?.headers)), body: init?.body });
    init?.signal?.addEventListener(
      'abort',
      () => {
        exchanges.push('command timed out');
      },
      { once: true },
    );

    return request(input, init);
  };

  const rootController = new AbortController();
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const commandResult = cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, rootController.signal);
  await Promise.resolve();
  deadlines.expire();

  // assert
  await assert.rejects(commandResult, (error: unknown) => {
    assert.ok(error instanceof DOMException);
    assert.deepStrictEqual({ name: error.name, message: error.message }, { name: 'TimeoutError', message: 'request deadline expired' });

    return true;
  });
  assert.strictEqual(rootController.signal.aborted, false);
  assert.deepStrictEqual(exchanges, [
    {
      method: 'PUT',
      url: 'https://api.example.test/devices/account-1_serial-1/data',
      headers: {
        authorization: 'Bearer id-token-1',
        'user-agent': 'homebridge-basement-guardian',
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: '{"desiredData":{"test_running":true}}',
    },
    'command timed out',
  ]);
});

test('refuses a device response whose body is not JSON at all', async () => {
  // arrange
  const httpFetch: HttpFetch = () => Promise.resolve(new Response('<html><body>gateway error</body></html>', { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

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

test('deadlines the token fetch with the same signal it deadlines the request with', async () => {
  // arrange
  const tokenSignals: AbortSignal[] = [];
  const { httpFetch, requestSignals } = stubSignalRecordingFetch();
  const cloudApi = createCloudApi(apiOptions({ httpFetch, auth: stubRecordingAuth(tokenSignals) }));
  const rootController = new AbortController();

  // act
  const devices = await cloudApi.devices(rootController.signal);

  // assert
  assert.deepStrictEqual(devices, []);
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
    idToken: (signal: AbortSignal): Promise<string> => {
      signal.throwIfAborted();

      return Promise.resolve('id-token-1');
    },
  };
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  const cloudApi = createCloudApi(apiOptions({ httpFetch, auth: lapsedAuth }));
  deadlines.expire();

  // act
  const commandAnswer = cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal);

  // assert
  await assert.rejects(commandAnswer, (error: unknown) => {
    assert.ok(error instanceof DOMException);
    assert.deepStrictEqual({ name: error.name, message: error.message }, { name: 'TimeoutError', message: 'request deadline expired' });

    return true;
  });
  verify(httpFetch);
});

test('offers exactly four operations, so no fifth vendor route is callable (SYNC-01)', () => {
  // arrange
  const cloudApi = createCloudApi(apiOptions());

  // act
  const operations = Object.keys(cloudApi).sort();

  // assert
  assert.deepStrictEqual(operations, ['awsCredentials', 'device', 'devices', 'sendCommand']);
});

test('reaches only the four declared routes when every operation runs (SYNC-01)', async () => {
  // arrange
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          { method: 'GET', headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' }, signal: undefined },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ devices: [geminiWireDevice()] }), { status: 200 }));
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices/account-1_serial-1'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          { method: 'GET', headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' }, signal: undefined },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ device: geminiWireDevice() }), { status: 200 }));
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/credentials/aws'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          { method: 'GET', headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' }, signal: undefined },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify(awsCredentialsResponse()), { status: 200 }));
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices/account-1_serial-1/data'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          {
            method: 'PUT',
            headers: {
              Authorization: 'Bearer id-token-1',
              'Content-Type': 'application/json',
              'User-Agent': 'homebridge-basement-guardian',
              Accept: 'application/json',
            },
            body: '{"desiredData":{"test_running":true}}',
            signal: undefined,
          },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const devices = await cloudApi.devices(new AbortController().signal);
  const device = await cloudApi.device('account-1_serial-1', new AbortController().signal);
  const credentials = await cloudApi.awsCredentials(new AbortController().signal);
  const commandAnswer = await cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal);

  // assert
  assert.deepStrictEqual(
    { devices, device, credentials, commandAnswer },
    { devices: [geminiDevice()], device: geminiDevice(), credentials: awsCredentialsResponse(), commandAnswer: { success: true } },
  );
  verify(httpFetch);
});

// The declared headers are asserted as a complete key set, so a fifth header
// cannot appear without this case saying so (AUTH-02).
test('declares exactly four headers on a command request', async () => {
  // arrange
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices/account-1_serial-1/data'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          {
            method: 'PUT',
            headers: {
              Authorization: 'Bearer id-token-1',
              'Content-Type': 'application/json',
              'User-Agent': 'homebridge-basement-guardian',
              Accept: 'application/json',
            },
            body: '{"desiredData":{"test_running":true}}',
            signal: undefined,
          },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const commandAnswer = await cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal);

  // assert
  assert.deepStrictEqual(commandAnswer, { success: true });
  verify(httpFetch);
});

// Every REST request identifies itself the same way now, so the read branch's complete header set
// is the bearer token plus the identity header and nothing else (REL-03, REL-04).
test('declares the bearer token and the identity header on a read request', async () => {
  // arrange
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          { method: 'GET', headers: { Authorization: 'Bearer id-token-1', 'User-Agent': 'homebridge-basement-guardian' }, signal: undefined },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const devices = await cloudApi.devices(new AbortController().signal);

  // assert
  assert.deepStrictEqual(devices, []);
  verify(httpFetch);
});

// What the header does not say is the point of it: the vendor learns which plugin is calling and
// nothing about the installation it is calling from (AUTH-02).
test('says nothing about the installation in the command user agent', async () => {
  // arrange
  const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
  when(() =>
    httpFetch(
      It.matches<string | URL>((url) => url instanceof URL && url.href === 'https://api.example.test/devices/account-1_serial-1/data'),
      It.matches<RequestInit>((init) => {
        assert.deepStrictEqual(
          { ...init, signal: undefined },
          {
            method: 'PUT',
            headers: {
              Authorization: 'Bearer id-token-1',
              'Content-Type': 'application/json',
              'User-Agent': 'homebridge-basement-guardian',
              Accept: 'application/json',
            },
            body: '{"desiredData":{"test_running":true}}',
            signal: undefined,
          },
        );

        return init.signal instanceof AbortSignal;
      }),
    ),
  ).thenResolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
  const cloudApi = createCloudApi(apiOptions({ httpFetch }));

  // act
  const commandAnswer = await cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal);

  // assert
  assert.deepStrictEqual(commandAnswer, { success: true });
  verify(httpFetch);
});

// The loopback server offers HTTP/2. The production undici port must negotiate
// HTTP/1.1 to avoid an uncaught idle-session teardown error.
test('never negotiates HTTP/2 with the vendor, even when the server offers it', async (t) => {
  // arrange
  const server = await startAlpnServer(JSON.stringify({ devices: [] }));
  t.after(() => server.close());
  const originalCertificates = getCACertificates('default');
  setDefaultCACertificates([...originalCertificates, server.certificate]);
  t.after(() => {
    setDefaultCACertificates(originalCertificates);
  });
  const cloudApi = createCloudApi(apiOptions({ baseUrl: server.url, httpFetch }));

  // act
  const devices = await cloudApi.devices(new AbortController().signal);
  const negotiatedProtocol = await server.negotiatedProtocol();

  // assert
  assert.deepStrictEqual(devices, []);
  assert.strictEqual(negotiatedProtocol, 'http/1.1');
});

test('preserves the command timeout reason while its response body is pending', async (t) => {
  // arrange
  const deadline = new AbortController();
  const timeout = new DOMException('command deadline expired', 'TimeoutError');
  t.mock.method(AbortSignal, 'timeout', () => deadline.signal);
  let announceBodyReading: () => void = () => {
    throw new Error('body reader is not initialized');
  };

  const bodyReading = new Promise<void>((resolve) => {
    announceBodyReading = resolve;
  });
  const cloudApi = createCloudApi(
    apiOptions({
      httpFetch: (input, init) => {
        const signal = new Request(input, init).signal;
        const body = new ReadableStream<Uint8Array>({
          pull(controller) {
            signal.addEventListener(
              'abort',
              () => {
                controller.error(new DOMException('body aborted', 'AbortError'));
              },
              { once: true },
            );
            announceBodyReading();
          },
        });

        return Promise.resolve(new Response(body, { status: 200 }));
      },
    }),
  );

  // act
  const commandAnswer = cloudApi.sendCommand('account-1_serial-1', { desiredData: { test_running: true } }, new AbortController().signal);
  await bodyReading;
  deadline.abort(timeout);

  // assert
  await assert.rejects(commandAnswer, (error: unknown) => {
    assert.strictEqual(error, timeout);

    return true;
  });
});

test('preserves root cancellation while a device response body is pending', async () => {
  // arrange
  const root = new AbortController();
  const cancellation = new DOMException('bridge stopped', 'AbortError');
  let announceBodyReading: () => void = () => {
    throw new Error('body reader is not initialized');
  };

  const bodyReading = new Promise<void>((resolve) => {
    announceBodyReading = resolve;
  });
  const cloudApi = createCloudApi(
    apiOptions({
      httpFetch: (input, init) => {
        const signal = new Request(input, init).signal;
        const body = new ReadableStream<Uint8Array>({
          pull(controller) {
            signal.addEventListener(
              'abort',
              () => {
                controller.error(new DOMException('body aborted', 'AbortError'));
              },
              { once: true },
            );
            announceBodyReading();
          },
        });

        return Promise.resolve(new Response(body, { status: 200 }));
      },
    }),
  );

  // act
  const devices = cloudApi.devices(root.signal);
  await bodyReading;
  root.abort(cancellation);

  // assert
  await assert.rejects(devices, (error: unknown) => {
    assert.strictEqual(error, cancellation);

    return true;
  });
});

test('retains the typed HTTP failure when response body cancellation rejects', async () => {
  // arrange
  const cloudApi = createCloudApi(
    apiOptions({
      httpFetch: () =>
        Promise.resolve(
          new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                controller.error(new Error('private response material'));
              },
            }),
            { status: 403 },
          ),
        ),
    }),
  );

  // act & assert
  await assert.rejects(
    () => cloudApi.device('account-1_serial-1', new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.deepStrictEqual(
        { name: error.name, message: error.message, status: error.status, route: error.route },
        { name: 'CloudRequestError', message: 'GET /devices/{deviceId} failed with HTTP 403.', status: 403, route: 'GET /devices/{deviceId}' },
      );

      return true;
    },
  );
});
