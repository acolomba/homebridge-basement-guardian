import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createAuthClient } from '../../src/cloud/auth.js';
import { AuthRejectedError, AuthThrottledError } from '../../src/cloud/errors.js';

import type { AuthClientOptions } from '../../src/cloud/auth.js';
import type { ProtocolConstants } from '../../src/protocol.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { LogLevel, Logging } from 'homebridge';
import type { TestContext } from 'node:test';

const START_TIME = 1_700_000_000_000;

// Stand-in constants, so the suite asserts behavior rather than restating the
// bundled vendor values.
const testConstants: ProtocolConstants = {
  apiUrl: 'https://api.example.test',
  clientId: 'bundled-client-id',
  auth0Domain: 'tenant.example.test',
  auth0Realm: 'example-realm',
  awsRegion: 'us-east-1',
  protocol: 'wss',
};

function parseJson(text: string): unknown {
  const parsed: unknown = JSON.parse(text);

  return parsed;
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

function authOptions(overrides: Partial<AuthClientOptions> = {}): AuthClientOptions {
  return {
    constants: testConstants,
    clientId: 'client-id-1',
    email: 'account@example.test',
    password: 'account-password',
    requestTimeoutMs: 1_000,
    clock: { now: () => START_TIME },
    log: createRecordingLog([]),
    ...overrides,
  };
}

// Records every grant request and answers each one with a fresh Response.
function stubFetch(t: TestContext, respond: (callIndex: number) => Response): { url: string; body: string }[] {
  const grantRequests: { url: string; body: string }[] = [];

  t.mock.method(globalThis, 'fetch', (input: string | URL, init?: RequestInit) => {
    const callIndex = grantRequests.length;
    grantRequests.push({ url: input.toString(), body: typeof init?.body === 'string' ? init.body : '' });

    return Promise.resolve(respond(callIndex));
  });

  return grantRequests;
}

function grantResponse(idToken: string): Response {
  return new Response(JSON.stringify({ id_token: idToken, expires_in: 2_592_000 }), { status: 200 });
}

test('sends the password-realm grant the vendor tenant expects', async (t) => {
  // arrange
  const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions());

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.deepStrictEqual(
    grantRequests.map((request) => request.url),
    ['https://tenant.example.test/oauth/token'],
  );
  assert.deepStrictEqual(
    grantRequests.map((request) => parseJson(request.body)),
    [
      {
        grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
        realm: 'example-realm',
        client_id: 'client-id-1',
        username: 'account@example.test',
        password: 'account-password',
        scope: 'openid profile email',
      },
    ],
  );
});

test('reuses the cached token while it is still valid', async (t) => {
  // arrange
  const grantRequests = stubFetch(t, (callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(authOptions());

  // act
  const firstToken = await authClient.idToken(new AbortController().signal);
  const secondToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(firstToken, 'id-token-1');
  assert.strictEqual(secondToken, 'id-token-1');
  assert.strictEqual(grantRequests.length, 1);
});

test('authenticates again once the cached token has expired', async (t) => {
  // arrange
  let currentTime = START_TIME;
  const clock: Clock = { now: () => currentTime };
  const grantRequests = stubFetch(t, (callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(authOptions({ clock }));

  // act
  const firstToken = await authClient.idToken(new AbortController().signal);
  currentTime = START_TIME + 2_592_001_000;
  const secondToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(firstToken, 'id-token-1');
  assert.strictEqual(secondToken, 'id-token-2');
  assert.strictEqual(grantRequests.length, 2);
});

test('rejects the account credentials the vendor refused', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 403 }));
  const authClient = createAuthClient(authOptions());

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof AuthRejectedError);
      assert.strictEqual(error.reason, 'invalid_grant');
      assert.strictEqual(error.message, 'the vendor rejected the account credentials with HTTP 403 (invalid_grant).');

      return true;
    },
  );
});

test('reports a throttled grant separately from a rejected one', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 429 }));
  const authClient = createAuthClient(authOptions());

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof AuthThrottledError);
      assert.strictEqual(error.message, 'the vendor authentication service answered HTTP 429 (too_many_attempts).');

      return true;
    },
  );
});

test('names an unknown error code when the failure body carries none', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify({ error: 7 }), { status: 500 }));
  const authClient = createAuthClient(authOptions());

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof AuthRejectedError);
      assert.strictEqual(error.reason, 'unknown_error');

      return true;
    },
  );
});

test('names an unknown error code when the failure body is not a record', async (t) => {
  // arrange
  stubFetch(t, () => new Response(JSON.stringify('service unavailable'), { status: 503 }));
  const authClient = createAuthClient(authOptions());

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof AuthRejectedError);
      assert.strictEqual(error.reason, 'unknown_error');

      return true;
    },
  );
});

for (const { description, body } of [
  { description: 'is not a record', body: JSON.stringify('id-token-1') },
  { description: 'carries no token', body: JSON.stringify({ expires_in: 2_592_000 }) },
  { description: 'carries no expiry', body: JSON.stringify({ id_token: 'id-token-1' }) },
]) {
  test(`refuses a grant response that ${description}`, async (t) => {
    // arrange
    stubFetch(t, () => new Response(body, { status: 200 }));
    const authClient = createAuthClient(authOptions());

    // act & assert
    await assert.rejects(
      () => authClient.idToken(new AbortController().signal),
      (error: unknown) => {
        assert.ok(error instanceof AuthRejectedError);
        assert.strictEqual(error.reason, 'malformed_response');

        return true;
      },
    );
  });
}

test('logs one fixed message and the status, and never a credential, body, or token', async (t) => {
  // arrange
  const messages: string[] = [];
  stubFetch(t, () => new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Wrong email or password.' }), { status: 403 }));
  const authClient = createAuthClient(authOptions({ log: createRecordingLog(messages) }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // assert
  assert.deepStrictEqual(messages, ['Authentication failed with HTTP 403.']);
});

test('logs a fixed message when the grant response is unusable', async (t) => {
  // arrange
  const messages: string[] = [];
  stubFetch(t, () => new Response(JSON.stringify({ id_token: 'id-token-1' }), { status: 200 }));
  const authClient = createAuthClient(authOptions({ log: createRecordingLog(messages) }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // assert
  assert.deepStrictEqual(messages, ['Authentication returned a response the plugin cannot read.']);
});
