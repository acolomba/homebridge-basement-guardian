import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
    httpFetch: (input, init) => globalThis.fetch(input, init),
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
function stubFetch(t: TestContext, respond: (callIndex: number) => Response): { url: string; body: string; headers: Record<string, string> }[] {
  const grantRequests: { url: string; body: string; headers: Record<string, string> }[] = [];

  t.mock.method(globalThis, 'fetch', (input: string | URL, init?: RequestInit) => {
    const callIndex = grantRequests.length;
    grantRequests.push({
      url: input.toString(),
      body: typeof init?.body === 'string' ? init.body : '',
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
    });

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
  const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(
    grantRequests.map((request) => request.headers),
    [{ 'content-type': 'application/json', 'user-agent': 'homebridge-basement-guardian' }],
  );
});

test('AUTH-02 registers the granted token as a secret', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const registeredSecrets: string[] = [];
  stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { registerSecret: (secret: string) => registeredSecrets.push(secret) }));

  // act
  await authClient.idToken(new AbortController().signal);

  // assert
  assert.deepStrictEqual(registeredSecrets, ['id-token-1']);
});

test('AUTH-02 registers one token once however many requests carry it', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const registeredSecrets: string[] = [];
  stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath, { registerSecret: (secret: string) => registeredSecrets.push(secret) }));

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
  stubFetch(t, (callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(authOptions(storagePath, { clock, registerSecret: (secret: string) => registeredSecrets.push(secret) }));
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

test('AUTH-01 answers two callers that start together from the cache file, without authenticating', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await writeCacheText(storagePath, JSON.stringify(cacheContents()));
  const grantRequests = stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

  // act
  const idTokens = await Promise.all([authClient.idToken(new AbortController().signal), authClient.idToken(new AbortController().signal)]);

  // assert
  assert.deepStrictEqual(idTokens, ['cached-token-1', 'cached-token-1']);
  assert.deepStrictEqual(grantRequests, []);
});

test('AUTH-01 issues one grant for two callers that start together with no current token', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const grantRequests = stubFetch(t, (callIndex) => grantResponse(`id-token-${String(callIndex + 1)}`));
  const authClient = createAuthClient(authOptions(storagePath));

  // act
  const idTokens = await Promise.all([authClient.idToken(new AbortController().signal), authClient.idToken(new AbortController().signal)]);

  // assert
  assert.deepStrictEqual(idTokens, ['id-token-1', 'id-token-1']);
  assert.strictEqual(grantRequests.length, 1);
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

test('D-08 authenticates, keeps serving at debug level, and orphans no temporary file when the cache path cannot be read or written', async (t) => {
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

test('AUTH-02 leaves no temporary file beside the cache file it wrote', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  stubFetch(t, () => grantResponse('id-token-1'));
  const authClient = createAuthClient(authOptions(storagePath));

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
    stubFetch(t, () => grantResponse('id-token-1'));
    const authClient = createAuthClient(authOptions(storagePath));
    await chmod(storagePath, READ_ONLY_DIRECTORY_MODE);

    // act
    const idToken = await authClient.idToken(new AbortController().signal);

    // assert
    assert.strictEqual(idToken, 'id-token-1');
    assert.strictEqual(await readFile(cachePath, 'utf8'), earlierContents);
  });
}

if (process.platform !== 'win32') {
  test('AUTH-02 writes an owner-only cache file on a POSIX host where an earlier run left a wider temporary file behind', async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
    const strandedPath = `${cachePath}.${String(process.pid)}.tmp`;
    await writeFile(strandedPath, 'stranded', 'utf8');
    await chmod(strandedPath, GROUP_READABLE_MODE);
    stubFetch(t, () => grantResponse('id-token-1'));
    const authClient = createAuthClient(authOptions(storagePath));

    // act
    await authClient.idToken(new AbortController().signal);

    // assert
    const { mode } = await stat(cachePath);
    assert.strictEqual(mode & PERMISSION_BITS, OWNER_ONLY_MODE);
    assert.deepStrictEqual(parseJson(await readFile(cachePath, 'utf8')), {
      idToken: 'id-token-1',
      expiresAt: START_TIME + TOKEN_LIFETIME_MS,
      emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
      salt: 'salt-1',
    });
  });

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

test('D-13 rejects the account credentials the vendor refused', async (t) => {
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

test('D-13 deletes the cached token when the vendor refuses the account credentials', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const cachePath = join(storagePath, TOKEN_CACHE_FILENAME);
  await writeCacheText(storagePath, JSON.stringify(cacheContents({ expiresAt: START_TIME - 1_000 })));
  stubFetch(t, () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 403 }));
  const authClient = createAuthClient(authOptions(storagePath));

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
  const grantRequests = stubFetch(t, () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 403 }));
  const authClient = createAuthClient(authOptions(storagePath));
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
  stubFetch(t, () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 403 }));
  const log = mock<Logging>({ exactParams: true, name: 'log' });
  when(() => {
    log.error(REJECTION_LOG);
  }).thenReturn(undefined);
  const authClient = createAuthClient(authOptions(storagePath, { log }));

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
  stubFetch(t, () => new Response(failureBody, { status: 403 }));
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

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
    stubFetch(t, () => new Response(JSON.stringify({ error: code }), { status }));
    const authClient = createAuthClient(authOptions(storagePath));

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
  stubFetch(t, () => new Response(JSON.stringify({ error: 7 }), { status: 400 }));
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
  stubFetch(t, () => new Response(JSON.stringify('unauthorized'), { status: 401 }));
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

test('D-22 answers a throttled grant with the long retry interval', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  stubFetch(t, () => new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 429 }));
  const authClient = createAuthClient(authOptions(storagePath));

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
  const grantRequests = stubFetch(t, () => new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 429 }));
  const authClient = createAuthClient(authOptions(storagePath));
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
  stubFetch(t, () => new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 429 }));
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

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
  const grantRequests = stubFetch(t, () => new Response(JSON.stringify({ error: 'server_error' }), { status: 500 }));
  const authClient = createAuthClient(authOptions(storagePath));

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
  t.mock.method(globalThis, 'fetch', () => {
    attempts += 1;

    return Promise.reject(new Error('connect ECONNREFUSED 203.0.113.1:443'));
  });
  const authClient = createAuthClient(authOptions(storagePath));

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
  stubFetch(t, () => new Response('<html>gateway error</html>', { status: 502 }));
  const authClient = createAuthClient(authOptions(storagePath));

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
  stubFetch(t, () => new Response(JSON.stringify({ error: 'moved' }), { status: 302 }));
  const authClient = createAuthClient(authOptions(storagePath));

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
    stubFetch(t, () => new Response(body, { status: 200 }));
    const authClient = createAuthClient(authOptions(storagePath));

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

test('D-14 warns once, drops the repeat to debug, and reports the recovery at info', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const messages: string[] = [];
  stubFetch(t, (callIndex) => (callIndex < 2 ? new Response(JSON.stringify({ error: 'server_error' }), { status: 500 }) : grantResponse('id-token-1')));
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

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
  stubFetch(t, (callIndex) =>
    callIndex === 0 ? new Response(JSON.stringify({ error: 'server_error' }), { status: 500 }) : new Response(JSON.stringify({}), { status: 503 }),
  );
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

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
  t.mock.method(globalThis, 'fetch', () => {
    shutdown.abort();
    const aborted = new Error('This operation was aborted');
    aborted.name = 'AbortError';

    return Promise.reject(aborted);
  });
  const authClient = createAuthClient(authOptions(storagePath, { log: createRecordingLog(messages) }));

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
