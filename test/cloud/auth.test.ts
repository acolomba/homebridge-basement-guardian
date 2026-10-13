// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests token grants, cancellation, and cache ownership.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { getEventListeners } from 'node:events';
import { access, chmod, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { getCACertificates, setDefaultCACertificates } from 'node:tls';

import { mock, verify, when } from 'strong-mock';

import { createAuthClient, TOKEN_CACHE_FILENAME } from '../../src/cloud/auth.js';
import { AuthHaltedError, AuthRejectedError, AuthThrottledError, CloudRequestError } from '../../src/cloud/errors.js';
import { httpFetch } from '../../src/cloud/httpDispatcher.js';

import { startAlpnServer } from './alpnServer.js';

import type { AuthClientOptions } from '../../src/cloud/auth.js';
import type { ProtocolConstants } from '../../src/protocol.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { LogLevel, Logging } from 'homebridge';
import type { TestContext } from 'node:test';

const START_TIME = 1_700_000_000_000;
const TOKEN_LIFETIME_SECONDS = 2_592_000;
const TOKEN_LIFETIME_MS = 2_592_000_000;
const HALF_HOUR_MS = 1_800_000;
const ACCOUNT_EMAIL = 'account@example.test';
const ACCOUNT_PASSWORD = 'account-password';
const OWNER_ONLY_MODE = 0o600;
const GROUP_READABLE_MODE = 0o644;
const OWNER_ALL_MODE = 0o700;
const READ_ONLY_DIRECTORY_MODE = 0o500;
const PERMISSION_BITS = 0o777;
const THIRTY_MINUTES_MS = 1_800_000;
const GRANT_ROUTE = 'POST /oauth/token';

const REJECTION_LOG =
  'Authentication stopped after HTTP 403: the vendor refused the account credentials. ' +
  'Correct the account email and password in the Homebridge UI (Plugins -> Basement Guardian -> Settings); saving there restarts the plugin. ' +
  'No further attempt will be made, because each one extends the vendor block on the account.';

const THROTTLE_LOG =
  'Authentication answered HTTP 429: the vendor is throttling it. The plugin will try again in 30 minutes. ' +
  'If the account is genuinely blocked, the block lifts only 30 days after the last attempt, so every retry postpones it. ' +
  'Disable this plugin, or remove its platform block from config.json, to let a real block clear.';

// Stand-in constants, so the suite asserts behavior rather than restating the
// bundled vendor values.
const testConstants: ProtocolConstants = {
  apiUrl: 'https://api.example.test',
  clientId: 'bundled-client-id',
  auth0Url: 'https://tenant.example.test',
  auth0Realm: 'example-realm',
  awsRegion: 'us-east-1',
  protocol: 'wss',
};

// The payload the cache file carries, restated here so every expectation is
// built independently of the production writer.
interface TokenCacheContents {
  idToken: string;
  expiresAt: number;
  emailFingerprint: string;
  salt: string;
}

// The digest the cache stores in place of the account email, computed from the
// stored salt rather than through the production helper.
function fingerprintOf(salt: string, email: string): string {
  return createHash('sha256').update(`${salt}${email}`).digest('hex');
}

function createRecordingLog(messages: string[]): Logging {
  const record = (level: string) => (message: string) => {
    messages.push(`${level} ${message}`);
  };

  return Object.assign(record('log'), {
    prefix: 'basement guardian',
    debug: record('debug'),
    error: record('error'),
    info: record('info'),
    log: (level: LogLevel, message: string): void => {
      messages.push(`${level} ${message}`);
    },
    success: record('success'),
    warn: record('warn'),
  });
}

// A directory mode stops a write only for a process the mode applies to:
// Windows does not enforce one, and a process running as root is exempt.
const DIRECTORY_MODES_BLOCK_WRITES = process.platform !== 'win32' && process.getuid?.() !== 0;

// One storage directory per case, so no case can observe another's cache file.
// The mode is restored first, because a case that made the directory read-only
// would otherwise leave its own contents undeletable.
async function createStoragePath(t: TestContext): Promise<string> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-auth-'));

  t.after(async () => {
    await chmod(storagePath, OWNER_ALL_MODE);
    await rm(storagePath, { recursive: true, force: true });
  });

  return storagePath;
}

function authOptions(storagePath: string, overrides: Partial<AuthClientOptions> = {}): AuthClientOptions {
  return {
    constants: testConstants,
    clientId: 'client-id-1',
    email: ACCOUNT_EMAIL,
    password: ACCOUNT_PASSWORD,
    storagePath,
    requestTimeoutMs: 1_000,
    httpFetch: () => {
      throw new Error('No synthetic HTTP transport was provided.');
    },
    clock: { now: () => START_TIME },
    createSalt: () => 'salt-1',
    registerSecret: () => undefined,
    log: createRecordingLog([]),
    ...overrides,
  };
}

function cacheContents(overrides: Partial<TokenCacheContents> = {}): TokenCacheContents {
  return {
    idToken: 'cached-token-1',
    expiresAt: START_TIME + TOKEN_LIFETIME_MS,
    emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
    salt: 'salt-1',
    ...overrides,
  };
}

async function writeCacheText(storagePath: string, text: string): Promise<void> {
  await writeFile(join(storagePath, TOKEN_CACHE_FILENAME), text, 'utf8');
}

// Records every grant request and answers each one with a fresh Response.
interface GrantRequest {
  method: string;
  url: string;
  body: string;
  headers: Record<string, string>;
}

function createGrantTransport(respond: (callIndex: number) => Response): {
  requests: GrantRequest[];
  httpFetch: AuthClientOptions['httpFetch'];
} {
  const grantRequests: GrantRequest[] = [];

  const httpFetch: AuthClientOptions['httpFetch'] = (input, init) => {
    const callIndex = grantRequests.length;
    grantRequests.push({
      method: init?.method ?? '',
      url: input.toString(),
      body: typeof init?.body === 'string' ? init.body : '',
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
    });

    return Promise.resolve(respond(callIndex));
  };

  return { requests: grantRequests, httpFetch };
}

function grantResponse(idToken: string): Response {
  return new Response(JSON.stringify({ id_token: idToken, expires_in: TOKEN_LIFETIME_SECONDS }), { status: 200 });
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function controlledGrant() {
  const started = deferred<AbortSignal>();
  const response = deferred<Response>();
  const requests: AbortSignal[] = [];
  const httpFetch: AuthClientOptions['httpFetch'] = (_input, init) => {
    const signal = init?.signal;
    assert.ok(signal instanceof AbortSignal);
    requests.push(signal);
    started.resolve(signal);

    return response.promise;
  };

  return { started, response, requests, httpFetch };
}

test('sends the password-realm grant the vendor tenant expects', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.deepStrictEqual(
    await readFile(join(storagePath, TOKEN_CACHE_FILENAME)),
    Buffer.from(
      JSON.stringify({
        idToken: 'id-token-1',
        expiresAt: START_TIME + TOKEN_LIFETIME_MS,
        emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
        salt: 'salt-1',
      }),
    ),
  );
  assert.deepStrictEqual(grantRequests, [
    {
      method: 'POST',
      url: 'https://tenant.example.test/oauth/token',
      headers: { 'content-type': 'application/json', 'user-agent': 'homebridge-basement-guardian' },
      body: JSON.stringify({
        grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
        realm: 'example-realm',
        client_id: 'client-id-1',
        username: ACCOUNT_EMAIL,
        password: ACCOUNT_PASSWORD,
        scope: 'openid profile email',
      }),
    },
  ]);
});

// A real loopback connection over the production httpFetch port, not a mocked fetch: undici's
// HTTP/2 idle-session teardown can leave an uncaught InformationalError, so which protocol actually
// goes out on the wire is itself the behavior under test, not an implementation detail a mock could
// paper over. Mirrors the equivalent case in test/cloud/api.test.ts for the grant request.
test('never negotiates HTTP/2 with the vendor tenant, even when the server offers it', async (t) => {
  // arrange
  const server = await startAlpnServer(JSON.stringify({ id_token: 'id-token-1', expires_in: TOKEN_LIFETIME_SECONDS }));
  t.after(() => server.close());
  const originalCertificates = getCACertificates('default');
  setDefaultCACertificates([...originalCertificates, server.certificate]);
  t.after(() => {
    setDefaultCACertificates(originalCertificates);
  });
  const storagePath = await createStoragePath(t);
  const authClient = createAuthClient(authOptions(storagePath, { constants: { ...testConstants, auth0Url: server.url.replace(/\/$/, '') }, httpFetch }));

  // act
  await authClient.idToken(new AbortController().signal);
  const negotiatedProtocol = await server.negotiatedProtocol();

  // assert
  assert.strictEqual(negotiatedProtocol, 'http/1.1');
});

// The grant request is the plugin's first outbound call in its whole life, and it identifies itself
// on it the same way every other outbound request does (REL-03, REL-04).
test('identifies the plugin on the grant request, alongside its content type', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(grantRequests, [
    {
      method: 'POST',
      url: 'https://tenant.example.test/oauth/token',
      headers: { 'content-type': 'application/json', 'user-agent': 'homebridge-basement-guardian' },
      body: JSON.stringify({
        grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
        realm: 'example-realm',
        client_id: 'client-id-1',
        username: ACCOUNT_EMAIL,
        password: ACCOUNT_PASSWORD,
        scope: 'openid profile email',
      }),
    },
  ]);
});

test('AUTH-02 registers the granted token as a secret', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const registeredSecrets: string[] = [];
  const { httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, registerSecret: (secret: string) => registeredSecrets.push(secret) }));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(registeredSecrets, ['id-token-1']);
});

test('AUTH-02 registers one token once however many requests carry it', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const registeredSecrets: string[] = [];
  const { httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, registerSecret: (secret: string) => registeredSecrets.push(secret) }));

  // act
  await authClient.idToken(new AbortController().signal);
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(registeredSecrets, ['id-token-1']);
});

test('AUTH-02 registers a replacement token once the previous one has expired', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const registeredSecrets: string[] = [];
  let currentTime = START_TIME;
  const clock: Clock = { now: () => currentTime };
  const { httpFetch: grantFetch } = createGrantTransport((callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(
    authOptions(storagePath, { httpFetch: grantFetch, clock, registerSecret: (secret: string) => registeredSecrets.push(secret) }),
  );
  await authClient.idToken(new AbortController().signal);

  // act
  currentTime += TOKEN_LIFETIME_MS;
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(registeredSecrets, ['id-token-1', 'id-token-2']);
});

test('reuses the cached token while it is still valid', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport((callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

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
  const storagePath = await createStoragePath(t);
  let currentTime = START_TIME;
  const clock: Clock = { now: () => currentTime };
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport((callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, clock }));

  // act
  const firstToken = await authClient.idToken(new AbortController().signal);
  currentTime = START_TIME + TOKEN_LIFETIME_MS + 1_000;
  const secondToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(firstToken, 'id-token-1');
  assert.strictEqual(secondToken, 'id-token-2');
  assert.strictEqual(grantRequests.length, 2);
});

test('AUTH-01 answers two callers that start together from the cache file, without authenticating', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await writeCacheText(storagePath, JSON.stringify(cacheContents()));
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  const idTokens = await Promise.all([authClient.idToken(new AbortController().signal), authClient.idToken(new AbortController().signal)]);

  // assert
  assert.deepStrictEqual(idTokens, ['cached-token-1', 'cached-token-1']);
  assert.deepStrictEqual(grantRequests, []);
});

test('AUTH-01 issues one grant for two callers that start together with no current token', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport((callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  const idTokens = await Promise.all([authClient.idToken(new AbortController().signal), authClient.idToken(new AbortController().signal)]);

  // assert
  assert.deepStrictEqual(idTokens, ['id-token-1', 'id-token-1']);
  assert.strictEqual(grantRequests.length, 1);
});

test('keeps the joined caller grant alive when the first caller aborts', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const started = deferred<AbortSignal>();
  const response = deferred<Response>();
  const first = new AbortController();
  const joined = new AbortController();
  const messages: string[] = [];
  let requests = 0;
  const authClient = createAuthClient(
    authOptions(storagePath, {
      httpFetch: (_input, init) => {
        requests += 1;
        const signal = init?.signal;
        assert.ok(signal instanceof AbortSignal);
        signal.addEventListener(
          'abort',
          () => {
            response.reject(signal.reason);
          },
          { once: true },
        );
        started.resolve(signal);

        return response.promise;
      },
      log: createRecordingLog(messages),
    }),
  );

  // act
  const firstToken = authClient.idToken(first.signal);
  const joinedToken = authClient.idToken(joined.signal);
  const firstRejected = assert.rejects(firstToken, { name: 'AbortError' });
  const joinedOutcome = joinedToken.then(
    (idToken) => ({ status: 'fulfilled', idToken }),
    () => ({ status: 'rejected' }),
  );
  const transport = await started.promise;
  first.abort();
  await firstRejected;
  response.resolve(grantResponse('id-token-1'));

  // assert
  assert.deepStrictEqual(await joinedOutcome, { status: 'fulfilled', idToken: 'id-token-1' });
  assert.strictEqual(transport.aborted, false);
  assert.deepStrictEqual(
    await readFile(join(storagePath, TOKEN_CACHE_FILENAME)),
    Buffer.from(
      JSON.stringify({
        idToken: 'id-token-1',
        expiresAt: START_TIME + TOKEN_LIFETIME_MS,
        emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
        salt: 'salt-1',
      }),
    ),
  );
  assert.strictEqual(requests, 1);
  assert.deepStrictEqual(messages, []);
});

test('rejects a joined caller promptly while the first caller receives its token', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const grant = controlledGrant();
  const first = new AbortController();
  const joined = new AbortController();
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grant.httpFetch }));

  // act
  const firstToken = authClient.idToken(first.signal);
  const joinedRejected = assert.rejects(authClient.idToken(joined.signal), { name: 'AbortError' });
  const transport = await grant.started.promise;
  joined.abort();
  await joinedRejected;
  grant.response.resolve(grantResponse('id-token-1'));

  // assert
  assert.strictEqual(await firstToken, 'id-token-1');
  assert.strictEqual(transport.aborted, false);
  assert.strictEqual(grant.requests.length, 1);
  assert.deepStrictEqual(getEventListeners(first.signal, 'abort'), []);
  assert.deepStrictEqual(getEventListeners(joined.signal, 'abort'), []);
});

for (const sharedRoot of [false, true]) {
  test(`aborts the shared transport when ${sharedRoot ? 'the root cancels both callers' : 'both callers leave'}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const grant = controlledGrant();
    const first = new AbortController();
    const joined = sharedRoot ? first : new AbortController();
    const messages: string[] = [];
    const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grant.httpFetch, log: createRecordingLog(messages) }));

    // act
    const firstRejected = assert.rejects(authClient.idToken(first.signal), { name: 'AbortError' });
    const joinedRejected = assert.rejects(authClient.idToken(joined.signal), { name: 'AbortError' });
    const transport = await grant.started.promise;
    first.abort();
    joined.abort();
    await Promise.all([firstRejected, joinedRejected]);
    const teardownRejected = assert.rejects(authClient.idToken(new AbortController().signal), { name: 'AbortError' });
    grant.response.reject(transport.reason);
    await teardownRejected;

    // assert
    assert.strictEqual(transport.aborted, true);
    assert.strictEqual(grant.requests.length, 1);
    assert.deepStrictEqual(messages, []);
    assert.deepStrictEqual(getEventListeners(first.signal, 'abort'), []);
    assert.deepStrictEqual(getEventListeners(joined.signal, 'abort'), []);
  });
}

test('starts no grant for an already aborted caller', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const caller = new AbortController();
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));
  caller.abort();

  // act & assert
  await assert.rejects(authClient.idToken(caller.signal), { name: 'AbortError' });
  assert.deepStrictEqual(grantRequests, []);
});

test('does not join a grant after cancellation during the initial cache read', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const caller = new AbortController();
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  const canceled = assert.rejects(authClient.idToken(caller.signal), { name: 'AbortError' });
  caller.abort();
  await canceled;
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.strictEqual(grantRequests.length, 1);
  assert.deepStrictEqual(getEventListeners(caller.signal, 'abort'), []);
});

test('settles surviving callers on grant failure and permits a later explicit grant', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const grant = controlledGrant();
  const first = new AbortController();
  const joined = new AbortController();
  const authClient = createAuthClient(
    authOptions(storagePath, {
      httpFetch: (input, init) => (grant.requests.length === 0 ? grant.httpFetch(input, init) : Promise.resolve(grantResponse('id-token-2'))),
    }),
  );

  // act
  const firstRejected = assert.rejects(authClient.idToken(first.signal), { name: 'CloudRequestError', status: 0, route: GRANT_ROUTE });
  const joinedRejected = assert.rejects(authClient.idToken(joined.signal), { name: 'CloudRequestError', status: 0, route: GRANT_ROUTE });
  await grant.started.promise;
  grant.response.reject(new Error('network failure'));
  await Promise.all([firstRejected, joinedRejected]);
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-2');
  assert.deepStrictEqual(getEventListeners(first.signal, 'abort'), []);
  assert.deepStrictEqual(getEventListeners(joined.signal, 'abort'), []);
});

test('rejects cancellation during cache writing while a surviving caller registers the token', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const grant = controlledGrant();
  const first = new AbortController();
  const registered: string[] = [];
  const authClient = createAuthClient(
    authOptions(storagePath, {
      httpFetch: grant.httpFetch,
      createSalt: () => {
        first.abort();
        return 'salt-1';
      },
      registerSecret: (secret) => {
        registered.push(secret);
      },
    }),
  );

  // act
  const firstRejected = assert.rejects(authClient.idToken(first.signal), { name: 'AbortError' });
  const joinedToken = authClient.idToken(new AbortController().signal);
  const transport = await grant.started.promise;
  grant.response.resolve(grantResponse('id-token-1'));
  await firstRejected;

  // assert
  assert.deepStrictEqual(registered, []);
  assert.strictEqual(await joinedToken, 'id-token-1');
  assert.deepStrictEqual(registered, ['id-token-1']);
  assert.strictEqual(transport.aborted, false);
  assert.strictEqual(grant.requests.length, 1);
});

test('retains the shared transport deadline while callers are waiting', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const grant = controlledGrant();
  const deadline = new AbortController();
  const timeoutSpy = t.mock.method(AbortSignal, 'timeout', () => deadline.signal);
  const messages: string[] = [];
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grant.httpFetch, log: createRecordingLog(messages) }));

  // act
  const rejected = assert.rejects(authClient.idToken(new AbortController().signal), { name: 'CloudRequestError', status: 0, route: GRANT_ROUTE });
  const transport = await grant.started.promise;
  deadline.abort(new DOMException('Deadline expired', 'TimeoutError'));
  grant.response.reject(transport.reason);
  await rejected;

  // assert
  assert.strictEqual(transport.aborted, true);
  assert.deepStrictEqual(messages, ['warn Authentication could not be completed (a network error); the plugin will try again.']);
  assert.deepStrictEqual(
    timeoutSpy.mock.calls.map((call) => call.arguments),
    [[1_000]],
  );
  assert.strictEqual(grant.requests.length, 1);
});

test('AUTH-01 stores the granted token in the cache file under the storage path', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(
    await readFile(join(storagePath, TOKEN_CACHE_FILENAME)),
    Buffer.from(
      JSON.stringify({
        idToken: 'id-token-1',
        expiresAt: START_TIME + TOKEN_LIFETIME_MS,
        emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
        salt: 'salt-1',
      }),
    ),
  );
});

test('AUTH-01 answers from the cache file a restart left behind, without authenticating', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await writeCacheText(storagePath, JSON.stringify(cacheContents()));
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'cached-token-1');
  assert.deepStrictEqual(grantRequests, []);
});

test('AUTH-01 authenticates again when the cache file holds an expired token', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await writeCacheText(storagePath, JSON.stringify(cacheContents({ expiresAt: START_TIME - 1_000 })));
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.strictEqual(grantRequests.length, 1);
});

test('AUTH-01 authenticates before expiry when the cached token expires inside the renewal margin', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await writeCacheText(storagePath, JSON.stringify(cacheContents({ expiresAt: START_TIME + HALF_HOUR_MS })));
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.strictEqual(grantRequests.length, 1);
});

test('D-08 authenticates again when the cache file fingerprints a different account email', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await writeCacheText(storagePath, JSON.stringify(cacheContents({ emailFingerprint: fingerprintOf('salt-1', 'other@example.test') })));
  const messages: string[] = [];
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log: createRecordingLog(messages) }));

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.strictEqual(grantRequests.length, 1);
  assert.deepStrictEqual(messages, ['debug The cached token belongs to a different account; authenticating again.']);
});

for (const { description, text } of [
  { description: 'is not valid JSON', text: 'not-json' },
  { description: 'is not a record', text: JSON.stringify('cached-token-1') },
  { description: 'carries no token', text: JSON.stringify({ ...cacheContents(), idToken: undefined }) },
  { description: 'carries no expiry', text: JSON.stringify({ ...cacheContents(), expiresAt: undefined }) },
  { description: 'carries no fingerprint', text: JSON.stringify({ ...cacheContents(), emailFingerprint: undefined }) },
  { description: 'carries no salt', text: JSON.stringify({ ...cacheContents(), salt: undefined }) },
]) {
  test(`D-08 authenticates again and notes it once at debug when the cache file ${description}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    await writeCacheText(storagePath, text);
    const messages: string[] = [];
    const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
    const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log: createRecordingLog(messages) }));

    // act
    const idToken = await authClient.idToken(new AbortController().signal);

    // assert
    assert.strictEqual(idToken, 'id-token-1');
    assert.strictEqual(grantRequests.length, 1);
    assert.deepStrictEqual(messages, ['debug The cached token could not be read; authenticating again.']);
  });
}

test('D-08 authenticates, keeps serving at debug level, and orphans no temporary file when the cache path cannot be read or written', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await mkdir(join(storagePath, TOKEN_CACHE_FILENAME));
  const messages: string[] = [];
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log: createRecordingLog(messages) }));

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.strictEqual(grantRequests.length, 1);
  assert.deepStrictEqual(await readdir(storagePath), [TOKEN_CACHE_FILENAME]);
  assert.deepStrictEqual(messages, [
    'debug The cached token could not be read; authenticating again.',
    'debug The token cache could not be written; the token is held in memory only.',
  ]);
});

test('D-08 logs nothing on a first start, when no cache file exists yet', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  const { httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log: createRecordingLog(messages) }));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(messages, []);
});

test('AUTH-02 writes neither the account email nor the account password into the cache file', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(
    await readFile(join(storagePath, TOKEN_CACHE_FILENAME)),
    Buffer.from(
      JSON.stringify({
        idToken: 'id-token-1',
        expiresAt: START_TIME + TOKEN_LIFETIME_MS,
        emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
        salt: 'salt-1',
      }),
    ),
  );
});

test('writes through the injected full temporary path in an empty directory', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
  const temporaryPath = join(storagePath, 'injected-cache.tmp');
  const targets: string[] = [];
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(
    authOptions(storagePath, {
      httpFetch: grantFetch,
      createTemporaryPath: (target) => {
        targets.push(target);

        return temporaryPath;
      },
    }),
  );

  // act
  const idTokens = await Promise.all([authClient.idToken(new AbortController().signal), authClient.idToken(new AbortController().signal)]);

  // assert
  assert.deepStrictEqual(idTokens, ['id-token-1', 'id-token-1']);
  assert.deepStrictEqual(
    await readFile(cachePath),
    Buffer.from(
      JSON.stringify({
        idToken: 'id-token-1',
        expiresAt: START_TIME + TOKEN_LIFETIME_MS,
        emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
        salt: 'salt-1',
      }),
    ),
  );
  assert.deepStrictEqual(await readdir(storagePath), [TOKEN_CACHE_FILENAME]);
  assert.strictEqual((await stat(cachePath)).mode & PERMISSION_BITS, OWNER_ONLY_MODE);
  assert.deepStrictEqual(targets, [cachePath]);
  assert.strictEqual(grantRequests.length, 1);
});

test('AUTH-02 leaves no temporary file beside the cache file it wrote', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(await readdir(storagePath), [TOKEN_CACHE_FILENAME]);
});

if (DIRECTORY_MODES_BLOCK_WRITES) {
  test('AUTH-02 leaves an earlier cache file byte-for-byte unchanged when the temporary file cannot be written', async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
    const earlierContents = JSON.stringify(cacheContents({ expiresAt: START_TIME - 1_000 }));
    await writeCacheText(storagePath, earlierContents);
    const { httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
    const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));
    await chmod(storagePath, READ_ONLY_DIRECTORY_MODE);

    // act
    const idToken = await authClient.idToken(new AbortController().signal);

    // assert
    assert.strictEqual(idToken, 'id-token-1');
    assert.strictEqual(await readFile(cachePath, 'utf8'), earlierContents);
  });
}

if (process.platform !== 'win32') {
  test('AUTH-02 preserves an occupied injected temporary file and the prior cache bytes', async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
    const strandedPath = join(storagePath, 'occupied-cache.tmp');
    const strandedContents = Buffer.from([0, 255, 195, 40, 10]);
    const earlierContents = Buffer.from(JSON.stringify(cacheContents({ expiresAt: START_TIME - 1_000 })));
    const targets: string[] = [];
    const messages: string[] = [];
    await writeFile(cachePath, earlierContents);
    await chmod(cachePath, OWNER_ONLY_MODE);
    await writeFile(strandedPath, strandedContents);
    await chmod(strandedPath, GROUP_READABLE_MODE);
    const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(() => grantResponse('id-token-1'));
    const authClient = createAuthClient(
      authOptions(storagePath, {
        httpFetch: grantFetch,
        createTemporaryPath: (target) => {
          targets.push(target);

          return strandedPath;
        },
        log: createRecordingLog(messages),
      }),
    );

    // act
    const idTokens = await Promise.all([authClient.idToken(new AbortController().signal), authClient.idToken(new AbortController().signal)]);
    const memoryToken = await authClient.idToken(new AbortController().signal);

    // assert
    assert.deepStrictEqual(idTokens, ['id-token-1', 'id-token-1']);
    assert.strictEqual(memoryToken, 'id-token-1');
    assert.deepStrictEqual(await readFile(cachePath), earlierContents);
    assert.deepStrictEqual(await readFile(strandedPath), strandedContents);
    assert.strictEqual((await stat(cachePath)).mode & PERMISSION_BITS, OWNER_ONLY_MODE);
    assert.strictEqual((await stat(strandedPath)).mode & PERMISSION_BITS, GROUP_READABLE_MODE);
    assert.deepStrictEqual(await readdir(storagePath), [TOKEN_CACHE_FILENAME, 'occupied-cache.tmp']);
    assert.deepStrictEqual(messages, [
      'debug The cached token is at or inside its renewal margin; authenticating again.',
      'debug The token cache could not be written; the token is held in memory only.',
    ]);
    assert.deepStrictEqual(targets, [cachePath]);
    assert.strictEqual(grantRequests.length, 1);
  });

  test('AUTH-02 restores owner-only permissions on a POSIX host when a second grant rewrites the cache file', async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
    let currentTime = START_TIME;
    const clock: Clock = { now: () => currentTime };
    const { httpFetch: grantFetch } = createGrantTransport((callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
    const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, clock }));
    await authClient.idToken(new AbortController().signal);
    await chmod(cachePath, GROUP_READABLE_MODE);
    currentTime = START_TIME + TOKEN_LIFETIME_MS + 1_000;

    // act
    await authClient.idToken(new AbortController().signal);

    // assert
    const { mode } = await stat(cachePath);
    assert.strictEqual(mode & PERMISSION_BITS, OWNER_ONLY_MODE);
  });
}

test('D-13 rejects the account credentials the vendor refused', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 403 }));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

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

test('D-13 deletes the cached token when the vendor refuses the account credentials', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
  await writeCacheText(storagePath, JSON.stringify(cacheContents({ expiresAt: START_TIME - 1_000 })));
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 403 }));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // assert
  const remains = await access(cachePath).then(
    () => true,
    () => false,
  );
  assert.strictEqual(remains, false);
});

test('D-13 makes no further attempt once the vendor has refused the account credentials', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(
    () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 403 }),
  );
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof AuthHaltedError);
      assert.strictEqual(error.reason, 'invalid_grant');
      assert.strictEqual(error.message, 'authentication stopped after the vendor refused the account credentials.');

      return true;
    },
  );
  assert.strictEqual(grantRequests.length, 1);
});

test('D-13 logs one error naming the fix when the vendor refuses the account credentials', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 403 }));
  const log = mock<Logging>({ exactParams: true, name: 'log' });
  when(() => {
    log.error(REJECTION_LOG);
  }).thenReturn(undefined);
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // assert
  verify(log);
});

test('AUTH-02 repeats no credential, request body, or response body into the log', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  const failureBody = JSON.stringify({ error: 'invalid_grant', error_description: `Wrong password for ${ACCOUNT_EMAIL}: ${ACCOUNT_PASSWORD}` });
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response(failureBody, { status: 403 }));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log: createRecordingLog(messages) }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // assert
  assert.deepStrictEqual(messages, [`error ${REJECTION_LOG}`]);
});

for (const { status, code } of [
  { status: 400, code: 'invalid_request' },
  { status: 401, code: 'unauthorized_client' },
  { status: 403, code: 'access_denied' },
]) {
  test(`D-13 stops on HTTP ${String(status)}, which the vendor does not enumerate as a rejection`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const { httpFetch: grantFetch } = createGrantTransport(() => new Response(JSON.stringify({ error: code }), { status }));
    const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

    // act & assert
    await assert.rejects(
      () => authClient.idToken(new AbortController().signal),
      (error: unknown) => {
        assert.ok(error instanceof AuthRejectedError);
        assert.strictEqual(error.reason, code);

        return true;
      },
    );
  });
}

test('names an unknown error code when the failure body carries none', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response(JSON.stringify({ error: 7 }), { status: 400 }));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

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
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response(JSON.stringify('unauthorized'), { status: 401 }));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

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

test('D-22 answers a throttled grant with the long retry interval', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 429 }));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof AuthThrottledError);
      assert.strictEqual(error.retryAfterMs, THIRTY_MINUTES_MS);
      assert.strictEqual(error.message, 'the vendor authentication service answered HTTP 429 (too_many_attempts).');

      return true;
    },
  );
});

test('D-22 keeps trying after a throttled grant instead of stopping', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(
    () => new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 429 }),
  );
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof AuthThrottledError);

      return true;
    },
  );
  assert.strictEqual(grantRequests.length, 2);
});

test('D-22 warns once, naming the 429, the thirty-day window, and how to stop the plugin', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 429 }));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log: createRecordingLog(messages) }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // assert
  assert.deepStrictEqual(messages, [`warn ${THROTTLE_LOG}`]);
});

test('keeps the cache file and stays ready to retry when the vendor answers HTTP 500', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
  const earlierContents = JSON.stringify(cacheContents({ expiresAt: START_TIME - 1_000 }));
  await writeCacheText(storagePath, earlierContents);
  const { requests: grantRequests, httpFetch: grantFetch } = createGrantTransport(
    () => new Response(JSON.stringify({ error: 'server_error' }), { status: 500 }),
  );
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.strictEqual(error.status, 500);
      assert.strictEqual(error.route, GRANT_ROUTE);
      assert.strictEqual(error.message, 'POST /oauth/token failed with HTTP 500.');

      return true;
    },
  );
  await assert.rejects(() => authClient.idToken(new AbortController().signal));
  assert.strictEqual(await readFile(cachePath, 'utf8'), earlierContents);
  assert.strictEqual(grantRequests.length, 2);
});

test('treats a network failure as transient rather than as a refusal', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
  const earlierContents = JSON.stringify(cacheContents({ expiresAt: START_TIME - 1_000 }));
  await writeCacheText(storagePath, earlierContents);
  let attempts = 0;
  const grantFetch: AuthClientOptions['httpFetch'] = () => {
    attempts += 1;

    return Promise.reject(new Error('connect ECONNREFUSED 203.0.113.1:443'));
  };

  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.strictEqual(error.status, 0);
      assert.strictEqual(error.route, GRANT_ROUTE);
      assert.strictEqual(error.message, 'POST /oauth/token could not be reached.');

      return true;
    },
  );
  await assert.rejects(() => authClient.idToken(new AbortController().signal));
  assert.strictEqual(await readFile(cachePath, 'utf8'), earlierContents);
  assert.strictEqual(attempts, 2);
});

test('treats a failure body that is not JSON as transient, on the status alone', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response('<html>gateway error</html>', { status: 502 }));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.strictEqual(error.status, 502);
      assert.strictEqual(error.message, 'POST /oauth/token failed with HTTP 502.');

      return true;
    },
  );
});

test('treats a status that is neither a refusal nor a throttle as transient', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const { httpFetch: grantFetch } = createGrantTransport(() => new Response(JSON.stringify({ error: 'moved' }), { status: 302 }));
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

  // act & assert
  await assert.rejects(
    () => authClient.idToken(new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof CloudRequestError);
      assert.strictEqual(error.status, 302);

      return true;
    },
  );
});

for (const { description, body } of [
  { description: 'is not a record', body: JSON.stringify('id-token-1') },
  { description: 'carries no token', body: JSON.stringify({ expires_in: TOKEN_LIFETIME_SECONDS }) },
  { description: 'carries no expiry', body: JSON.stringify({ id_token: 'id-token-1' }) },
]) {
  test(`refuses a grant response that ${description}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const { httpFetch: grantFetch } = createGrantTransport(() => new Response(body, { status: 200 }));
    const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch }));

    // act & assert
    await assert.rejects(
      () => authClient.idToken(new AbortController().signal),
      (error: unknown) => {
        assert.ok(error instanceof CloudRequestError);
        assert.strictEqual(error.status, 200);
        assert.strictEqual(error.message, 'POST /oauth/token returned a response the plugin cannot read.');

        return true;
      },
    );
  });
}

for (const { description, body } of [
  { description: 'has zero lifetime', body: '{"id_token":"id-token-1","expires_in":0}' },
  { description: 'has negative lifetime', body: '{"id_token":"id-token-1","expires_in":-1}' },
  { description: 'has infinite lifetime', body: '{"id_token":"id-token-1","expires_in":1e309}' },
  { description: 'overflows the derived expiry', body: '{"id_token":"id-token-1","expires_in":1e308}' },
]) {
  test(`refuses a grant response that ${description}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const authClient = createAuthClient(authOptions(storagePath, { httpFetch: () => Promise.resolve(new Response(body, { status: 200 })) }));

    // act & assert
    await assert.rejects(
      () => authClient.idToken(new AbortController().signal),
      (error: unknown) => {
        assert.ok(error instanceof CloudRequestError);
        assert.strictEqual(error.status, 200);
        assert.strictEqual(error.route, GRANT_ROUTE);

        return true;
      },
    );
  });
}

test('authenticates again when the cache file carries an infinite expiry', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const contents = JSON.stringify(cacheContents()).replace('1702592000000', '1e309');
  await writeCacheText(storagePath, contents);
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: () => Promise.resolve(grantResponse('id-token-1')) }));

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
});

test('D-14 warns once, drops the repeat to debug, and reports the recovery at info', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  const { httpFetch: grantFetch } = createGrantTransport((callIndex) =>
    callIndex < 2 ? new Response(JSON.stringify({ error: 'server_error' }), { status: 500 }) : grantResponse('id-token-1'),
  );
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log: createRecordingLog(messages) }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));
  await assert.rejects(() => authClient.idToken(new AbortController().signal));
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.deepStrictEqual(messages, [
    'warn Authentication could not be completed (HTTP 500); the plugin will try again.',
    'debug Authentication could not be completed (HTTP 500); the plugin will try again.',
    'info Authentication recovered.',
  ]);
});

test('D-14 warns again when a transient failure of another kind follows', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  const { httpFetch: grantFetch } = createGrantTransport((callIndex) =>
    callIndex === 0 ? new Response(JSON.stringify({ error: 'server_error' }), { status: 500 }) : new Response(JSON.stringify({}), { status: 503 }),
  );
  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log: createRecordingLog(messages) }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // assert
  assert.deepStrictEqual(messages, [
    'warn Authentication could not be completed (HTTP 500); the plugin will try again.',
    'warn Authentication could not be completed (HTTP 503); the plugin will try again.',
  ]);
});

test('lets an abort through untouched and logs nothing for it', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  const shutdown = new AbortController();
  const grantFetch: AuthClientOptions['httpFetch'] = () => {
    shutdown.abort();
    const aborted = new Error('This operation was aborted');
    aborted.name = 'AbortError';

    return Promise.reject(aborted);
  };

  const authClient = createAuthClient(authOptions(storagePath, { httpFetch: grantFetch, log: createRecordingLog(messages) }));

  // act & assert
  await assert.rejects(
    () => authClient.idToken(shutdown.signal),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.strictEqual(error.name, 'AbortError');

      return true;
    },
  );
  assert.deepStrictEqual(messages, []);
});
