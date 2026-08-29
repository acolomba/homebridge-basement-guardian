import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { createAuthClient, TOKEN_CACHE_FILENAME } from '../../src/cloud/auth.js';
import { AuthRejectedError, AuthThrottledError } from '../../src/cloud/errors.js';

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
const PERMISSION_BITS = 0o777;

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

// The payload the cache file carries, restated here so every expectation is
// built independently of the production writer.
interface TokenCacheContents {
  idToken: string;
  expiresAt: number;
  emailFingerprint: string;
  salt: string;
}

function parseJson(text: string): unknown {
  const parsed: unknown = JSON.parse(text);

  return parsed;
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

// One storage directory per case, so no case can observe another's cache file.
async function createStoragePath(t: TestContext): Promise<string> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-auth-'));

  t.after(async () => {
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
    clock: { now: () => START_TIME },
    createSalt: () => 'salt-1',
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
  return new Response(JSON.stringify({ id_token: idToken, expires_in: TOKEN_LIFETIME_SECONDS }), { status: 200 });
}

test('sends the password-realm grant the vendor tenant expects', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

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
        username: ACCOUNT_EMAIL,
        password: ACCOUNT_PASSWORD,
        scope: 'openid profile email',
      },
    ],
  );
});

test('reuses the cached token while it is still valid', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const grantRequests = stubFetch(t, (callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(authOptions(storagePath));

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
  const grantRequests = stubFetch(t, (callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(authOptions(storagePath, { clock }));

  // act
  const firstToken = await authClient.idToken(new AbortController().signal);
  currentTime = START_TIME + TOKEN_LIFETIME_MS + 1_000;
  const secondToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(firstToken, 'id-token-1');
  assert.strictEqual(secondToken, 'id-token-2');
  assert.strictEqual(grantRequests.length, 2);
});

test('AUTH-01 stores the granted token in the cache file under the storage path', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(parseJson(await readFile(join(storagePath, TOKEN_CACHE_FILENAME), 'utf8')), {
    idToken: 'id-token-1',
    expiresAt: START_TIME + TOKEN_LIFETIME_MS,
    emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
    salt: 'salt-1',
  });
});

test('AUTH-01 answers from the cache file a restart left behind, without authenticating', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await writeCacheText(storagePath, JSON.stringify(cacheContents()));
  const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

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
  const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

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
  const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

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
  const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

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
    const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
    const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

    // act
    const idToken = await authClient.idToken(new AbortController().signal);

    // assert
    assert.strictEqual(idToken, 'id-token-1');
    assert.strictEqual(grantRequests.length, 1);
    assert.deepStrictEqual(messages, ['debug The cached token could not be read; authenticating again.']);
  });
}

test('D-08 authenticates again and notes it once at debug when the cache file cannot be read', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await mkdir(join(storagePath, TOKEN_CACHE_FILENAME));
  const messages: string[] = [];
  const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.strictEqual(grantRequests.length, 1);
  assert.deepStrictEqual(messages, ['debug The cached token could not be read; authenticating again.']);
});

test('D-08 logs nothing on a first start, when no cache file exists yet', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(messages, []);
});

test('AUTH-02 writes neither the account email nor the account password into the cache file', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  const contents = await readFile(join(storagePath, TOKEN_CACHE_FILENAME), 'utf8');
  assert.strictEqual(contents.includes(ACCOUNT_EMAIL), false);
  assert.strictEqual(contents.includes(ACCOUNT_PASSWORD), false);
  assert.strictEqual(contents.includes('id-token-1'), true);
});

test('AUTH-02 leaves an earlier cache file byte-for-byte unchanged when the temporary file cannot be written', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
  const earlierContents = JSON.stringify(cacheContents({ expiresAt: START_TIME - 1_000 }));
  await writeCacheText(storagePath, earlierContents);
  await mkdir(`${cachePath}.${String(process.pid)}.tmp`);
  stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

  // act
  const idToken = await authClient.idToken(new AbortController().signal);

  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.strictEqual(await readFile(cachePath, 'utf8'), earlierContents);
});

if (process.platform !== 'win32') {
  test('AUTH-02 restores owner-only permissions on a POSIX host when a second grant rewrites the cache file', async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
    let currentTime = START_TIME;
    const clock: Clock = { now: () => currentTime };
    stubFetch(t, (callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
    const authClient = createAuthClient(authOptions(storagePath, { clock }));
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

test('rejects the account credentials the vendor refused', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  stubFetch(t, () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 403 }));
  const authClient = createAuthClient(authOptions(storagePath));

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
  const storagePath = await createStoragePath(t);
  stubFetch(t, () => new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 429 }));
  const authClient = createAuthClient(authOptions(storagePath));

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
  const storagePath = await createStoragePath(t);
  stubFetch(t, () => new Response(JSON.stringify({ error: 7 }), { status: 500 }));
  const authClient = createAuthClient(authOptions(storagePath));

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
  stubFetch(t, () => new Response(JSON.stringify('service unavailable'), { status: 503 }));
  const authClient = createAuthClient(authOptions(storagePath));

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
  { description: 'carries no token', body: JSON.stringify({ expires_in: TOKEN_LIFETIME_SECONDS }) },
  { description: 'carries no expiry', body: JSON.stringify({ id_token: 'id-token-1' }) },
]) {
  test(`refuses a grant response that ${description}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    stubFetch(t, () => new Response(body, { status: 200 }));
    const authClient = createAuthClient(authOptions(storagePath));

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
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  stubFetch(t, () => new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Wrong email or password.' }), { status: 403 }));
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // assert
  assert.deepStrictEqual(messages, ['error Authentication failed with HTTP 403.']);
});

test('logs a fixed message when the grant response is unusable', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  stubFetch(t, () => new Response(JSON.stringify({ id_token: 'id-token-1' }), { status: 200 }));
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

  // act
  await assert.rejects(() => authClient.idToken(new AbortController().signal));

  // assert
  assert.deepStrictEqual(messages, ['error Authentication returned a response the plugin cannot read.']);
});
