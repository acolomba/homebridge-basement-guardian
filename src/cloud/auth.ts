import { createHash, randomBytes } from 'node:crypto';
import { access, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PLUGIN_USER_AGENT } from '../settings.js';

import { AuthHaltedError, AuthRejectedError, AuthThrottledError, CloudRequestError } from './errors.js';
import { isRecord } from './types.js';

import type { ProtocolConstants } from '../protocol.js';
import type { Clock } from '../runtime/clock.js';
import type { Logging } from 'homebridge';

const GRANT_TYPE = 'http://auth0.com/oauth/grant-type/password-realm';
const GRANT_SCOPE = 'openid profile email';
const GRANT_ROUTE = 'POST /oauth/token';
const TOO_MANY_ATTEMPTS = 429;
const CLIENT_ERROR = 400;
const SERVER_ERROR = 500;
const MILLISECONDS_PER_SECOND = 1_000;

// A network failure carries no HTTP status, and zero is the conventional
// stand-in for one that never arrived.
const NO_HTTP_STATUS = 0;

// A throttling response is retried on this interval rather than on the usual
// capped backoff, because it may mean the account is blocked and every attempt
// extends that block (D-22).
const THROTTLED_RETRY_MS = 1_800_000;

const REJECTION_ADVICE =
  'Correct the account email and password in the Homebridge UI (Plugins -> Basement Guardian -> Settings); saving there restarts the plugin.';
const REJECTION_FINALITY = 'No further attempt will be made, because each one extends the vendor block on the account.';

const THROTTLE_WARNING =
  'Authentication answered HTTP 429: the vendor is throttling it. The plugin will try again in 30 minutes. ' +
  'If the account is genuinely blocked, the block lifts only 30 days after the last attempt, so every retry postpones it. ' +
  'Disable this plugin, or remove its platform block from config.json, to let a real block clear.';

const RECOVERED = 'Authentication recovered.';
const HALTED = 'authentication stopped after the vendor refused the account credentials.';

// Only the owner may read the cache: it holds a bearer token for the account
// (AUTH-02).
const OWNER_ONLY_MODE = 0o600;

// How much randomness the temporary cache name carries, on top of the process
// id, to keep two writers off one path.
const TEMPORARY_SUFFIX_BYTES = 8;

// A token is renewed this long before it expires, so no request is sent with a
// token that lapses while it is in flight (AUTH-01).
const TOKEN_RENEWAL_MARGIN_MS = 3_600_000;

const CACHE_UNUSABLE = 'The cached token could not be read; authenticating again.';
const CACHE_OTHER_ACCOUNT = 'The cached token belongs to a different account; authenticating again.';
const CACHE_STALE = 'The cached token is at or inside its renewal margin; authenticating again.';
const CACHE_NOT_WRITTEN = 'The token cache could not be written; the token is held in memory only.';

/** The cache file's name inside the Homebridge storage directory. */
export const TOKEN_CACHE_FILENAME = '.basement-guardian-token.json';

/** Everything the authentication client needs, by injection. */
export interface AuthClientOptions {
  constants: ProtocolConstants;
  /** The resolved client identifier: the configured override or the bundled one. */
  clientId: string;
  email: string;
  password: string;
  /** The Homebridge storage directory; the token cache lives there and nowhere else. */
  storagePath: string;
  requestTimeoutMs: number;
  clock: Clock;
  /** Supplies the salt the cached fingerprint is computed over. */
  createSalt: () => string;
  /** Registers the granted token with the redacting logger (AUTH-02). */
  registerSecret: (secret: string) => void;
  log: Logging;
}

/** Supplies a valid vendor ID token, authenticating again only when needed. */
export interface AuthClient {
  idToken(signal: AbortSignal): Promise<string>;
}

interface CachedToken {
  idToken: string;
  expiresAtMs: number;
}

// What one client remembers about its failures: the code that stopped it for
// good, and the kind of the last transient failure it reported.
interface FailurePolicy {
  haltedReason: string | undefined;
  lastTransient: string | undefined;
}

// A failure worth trying again, described once so the log line, the error, and
// the repeat detection all agree.
interface TransientFailure {
  kind: string;
  status: number;
  message: string;
}

/** The payload the cache file carries between runs. */
interface TokenCacheFile {
  idToken: string;
  expiresAt: number;
  emailFingerprint: string;
  salt: string;
}

function cachePath(options: AuthClientOptions): string {
  return join(options.storagePath, TOKEN_CACHE_FILENAME);
}

// The cache file is untrusted input like any other stored JSON, so it is
// narrowed by a hand-written predicate rather than assumed.
function isTokenCacheFile(value: unknown): value is TokenCacheFile {
  return (
    isRecord(value) &&
    typeof value.idToken === 'string' &&
    typeof value.expiresAt === 'number' &&
    typeof value.emailFingerprint === 'string' &&
    typeof value.salt === 'string'
  );
}

// The cache names its account by digest, so a changed account email invalidates
// it without the file ever holding the email itself (D-08, T-01-23).
function fingerprint(salt: string, email: string): string {
  return createHash('sha256').update(`${salt}${email}`).digest('hex');
}

function isCurrent(expiresAtMs: number, clock: Clock): boolean {
  return expiresAtMs - TOKEN_RENEWAL_MARGIN_MS > clock.now();
}

async function parseCacheFile(path: string): Promise<unknown> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));

    return parsed;
  } catch {
    // Unreadable and malformed are the same answer: there is no usable cache.
    return undefined;
  }
}

async function readCacheFile(options: AuthClientOptions): Promise<TokenCacheFile | undefined> {
  const path = cachePath(options);
  // A first start has no cache file, which is ordinary and says nothing. Every
  // other unusable cache is a debug note and never a failure (D-08).
  const present = await access(path).then(
    () => true,
    () => false,
  );

  if (!present) {
    return undefined;
  }

  const parsed = await parseCacheFile(path);

  if (isTokenCacheFile(parsed)) {
    return parsed;
  }

  options.log.debug(CACHE_UNUSABLE);

  return undefined;
}

async function readCachedToken(options: AuthClientOptions): Promise<CachedToken | undefined> {
  const cache = await readCacheFile(options);

  if (cache === undefined) {
    return undefined;
  }

  if (cache.emailFingerprint !== fingerprint(cache.salt, options.email)) {
    options.log.debug(CACHE_OTHER_ACCOUNT);

    return undefined;
  }

  if (!isCurrent(cache.expiresAt, options.clock)) {
    options.log.debug(CACHE_STALE);

    return undefined;
  }

  return { idToken: cache.idToken, expiresAtMs: cache.expiresAt };
}

// The temporary name carries the process id and a fresh random suffix, so
// neither two Homebridge processes nor two writers inside one process can pick
// the same path. The process id alone rules out only the first of those, and a
// recycled one does not even do that (WR-04).
function temporaryPath(target: string): string {
  return `${target}.${String(process.pid)}.${randomBytes(TEMPORARY_SUFFIX_BYTES).toString('hex')}.tmp`;
}

// The mode is applied only when the file is created, so a fresh file is written
// and renamed over the target; writing the target in place would leave a
// drifted mode untouched and the token readable by every local user (AUTH-02,
// T-01-21). For the same reason the create is exclusive: an occupied name is a
// failure rather than a rewrite of a file that already carries a wider mode
// (WR-05). The rename is atomic, so an interrupted write cannot truncate the
// cache into an avoidable authentication, and a rename that fails takes the
// fresh file with it rather than leaving a bearer token in the storage
// directory (T-01-91).
async function storeCache(temporary: string, target: string, contents: string): Promise<void> {
  await writeFile(temporary, contents, { mode: OWNER_ONLY_MODE, flag: 'wx' });

  try {
    await rename(temporary, target);
  } catch (error: unknown) {
    await rm(temporary, { force: true });

    throw error;
  }
}

async function writeCachedToken(options: AuthClientOptions, token: CachedToken): Promise<void> {
  const target = cachePath(options);
  const salt = options.createSalt();
  const cache: TokenCacheFile = {
    idToken: token.idToken,
    expiresAt: token.expiresAtMs,
    emailFingerprint: fingerprint(salt, options.email),
    salt,
  };

  try {
    await storeCache(temporaryPath(target), target, JSON.stringify(cache));
  } catch {
    // The token itself is usable, so a cache that cannot be written costs one
    // grant on the next start rather than this one.
    options.log.debug(CACHE_NOT_WRITTEN);
  }
}

// The whole request body is a secret: the account password is in it. It is
// built here and never logged, stored, or attached to an error (T-01-05).
function grantBody(options: AuthClientOptions): string {
  return JSON.stringify({
    grant_type: GRANT_TYPE,
    realm: options.constants.auth0Realm,
    client_id: options.clientId,
    username: options.email,
    password: options.password,
    scope: GRANT_SCOPE,
  });
}

function readErrorCode(body: unknown): string {
  const code = isRecord(body) ? body.error : undefined;

  return typeof code === 'string' ? code : 'unknown_error';
}

function rejectionLog(status: number): string {
  return `Authentication stopped after HTTP ${String(status)}: the vendor refused the account credentials. ${REJECTION_ADVICE} ${REJECTION_FINALITY}`;
}

function transientLog(kind: string): string {
  return `Authentication could not be completed (${kind}); the plugin will try again.`;
}

function httpFailure(status: number): TransientFailure {
  return { kind: `HTTP ${String(status)}`, status, message: `${GRANT_ROUTE} failed with HTTP ${String(status)}.` };
}

function unusableFailure(status: number): TransientFailure {
  return { kind: 'an unusable response', status, message: `${GRANT_ROUTE} returned a response the plugin cannot read.` };
}

const NETWORK_FAILURE: TransientFailure = {
  kind: 'a network error',
  status: NO_HTTP_STATUS,
  message: `${GRANT_ROUTE} could not be reached.`,
};

// A transient failure is reported once at warn and its immediate repeat drops
// to debug, so a failure that persists across a poll cycle cannot flood the log
// (D-14). The reminder cadence belongs to the account runtime, which sees the
// whole failure stream.
function reportTransient(options: AuthClientOptions, policy: FailurePolicy, failure: TransientFailure): CloudRequestError {
  if (policy.lastTransient === failure.kind) {
    options.log.debug(transientLog(failure.kind));
  } else {
    options.log.warn(transientLog(failure.kind));
  }

  policy.lastTransient = failure.kind;

  return new CloudRequestError(failure.message, failure.status, GRANT_ROUTE);
}

function reportRecovery(options: AuthClientOptions, policy: FailurePolicy): void {
  if (policy.lastTransient !== undefined) {
    options.log.info(RECOVERED);
    policy.lastTransient = undefined;
  }
}

async function deleteCachedToken(options: AuthClientOptions): Promise<void> {
  await rm(cachePath(options), { force: true });
}

async function grantFailure(options: AuthClientOptions, policy: FailurePolicy, status: number, body: unknown): Promise<Error> {
  const reason = readErrorCode(body);

  if (status === TOO_MANY_ATTEMPTS) {
    options.log.warn(THROTTLE_WARNING);

    return new AuthThrottledError(`the vendor authentication service answered HTTP ${String(status)} (${reason}).`, THROTTLED_RETRY_MS);
  }

  // The vendor does not publish the code it returns for a wrong password, so
  // every client error that is not a throttle is read as a refusal. Stopping on
  // a recoverable one costs a restart; retrying into a block costs thirty days
  // measured from the last attempt (D-13).
  if (status >= CLIENT_ERROR && status < SERVER_ERROR) {
    policy.haltedReason = reason;
    options.log.error(rejectionLog(status));
    await deleteCachedToken(options);

    return new AuthRejectedError(`the vendor rejected the account credentials with HTTP ${String(status)} (${reason}).`, reason);
  }

  return reportTransient(options, policy, httpFailure(status));
}

function readGrant(body: unknown, clock: Clock): CachedToken | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  const idToken = body.id_token;
  const expiresInSeconds = body.expires_in;

  if (typeof idToken !== 'string' || typeof expiresInSeconds !== 'number') {
    return undefined;
  }

  return { idToken, expiresAtMs: clock.now() + expiresInSeconds * MILLISECONDS_PER_SECOND };
}

async function fetchGrant(options: AuthClientOptions, policy: FailurePolicy, signal: AbortSignal): Promise<Response> {
  try {
    return await fetch(`${options.constants.auth0Url}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': PLUGIN_USER_AGENT },
      body: grantBody(options),
      signal: AbortSignal.any([signal, AbortSignal.timeout(options.requestTimeoutMs)]),
    });
  } catch (error: unknown) {
    // A shutdown is not a failure, so an abort the caller asked for travels on
    // untouched and says nothing.
    if (signal.aborted) {
      throw error;
    }

    throw reportTransient(options, policy, NETWORK_FAILURE);
  }
}

async function readBody(response: Response): Promise<unknown> {
  try {
    const body: unknown = await response.json();

    return body;
  } catch {
    // A gateway in front of the tenant can answer with an error page. That body
    // carries nothing the status does not already say.
    return undefined;
  }
}

async function requestGrant(options: AuthClientOptions, policy: FailurePolicy, signal: AbortSignal): Promise<CachedToken> {
  const response = await fetchGrant(options, policy, signal);
  const body = await readBody(response);

  if (!response.ok) {
    throw await grantFailure(options, policy, response.status, body);
  }

  const grant = readGrant(body, options.clock);

  if (grant === undefined) {
    throw reportTransient(options, policy, unusableFailure(response.status));
  }

  reportRecovery(options, policy);

  return grant;
}

// One grant, and the cache write that follows it, described as a single unit so
// concurrent callers can share the whole attempt rather than only its request.
async function grantAndCache(options: AuthClientOptions, policy: FailurePolicy, signal: AbortSignal): Promise<CachedToken> {
  const granted = await requestGrant(options, policy, signal);
  await writeCachedToken(options, granted);

  return granted;
}

/**
 * Creates the vendor authentication client.
 *
 * The grant is the Auth0 password-realm grant. The resulting ID token is held
 * in memory and cached under the Homebridge storage directory, so a restart
 * reuses a token that is still current instead of authenticating again
 * (AUTH-01). The cache is read once per client and rewritten after every grant.
 * Creating the client reads no file and performs no request; only `idToken`
 * does.
 *
 * Each failure class gets the one answer that is safe for it. A refused
 * credential stops this client for good, because the vendor lifts a brute-force
 * block only thirty days after the last attempt (D-13). A throttling response
 * is tried again on a long interval instead (D-22). Anything else is transient
 * and leaves both the cache and the client intact.
 *
 * Stated assumption: the vendor's published error codes do not name the code it
 * returns for a wrong password, so every client error that is not a throttle is
 * read as a refusal. If that reading is wrong, the plugin stops on a failure it
 * could have retried, which a restart clears. The opposite mistake would retry
 * into a thirty-day block that no restart clears.
 */
export function createAuthClient(options: AuthClientOptions): AuthClient {
  const policy: FailurePolicy = { haltedReason: undefined, lastTransient: undefined };
  let cached: CachedToken | undefined;
  let cacheRead: Promise<CachedToken | undefined> | undefined;
  let inFlight: Promise<CachedToken> | undefined;
  let registered: string | undefined;

  // A caller arriving while an attempt is in flight joins it instead of opening
  // a second one, because every attempt against a throttling tenant extends the
  // block it may already be under (WR-04, D-22). The attempt is forgotten once
  // it settles, so a later lapse, or a retry after a transient failure, starts
  // a fresh one.
  function sharedGrant(signal: AbortSignal): Promise<CachedToken> {
    inFlight ??= grantAndCache(options, policy, signal).finally(() => {
      inFlight = undefined;
    });

    return inFlight;
  }

  async function currentToken(signal: AbortSignal): Promise<CachedToken> {
    if (policy.haltedReason !== undefined) {
      throw new AuthHaltedError(HALTED, policy.haltedReason);
    }

    // The read is shared rather than flagged, so a second caller waits for the
    // answer instead of seeing an empty cache and stepping around it (WR-04).
    cacheRead ??= readCachedToken(options);
    cached ??= await cacheRead;

    if (cached !== undefined && isCurrent(cached.expiresAtMs, options.clock)) {
      return cached;
    }

    return sharedGrant(signal);
  }

  return {
    async idToken(signal: AbortSignal): Promise<string> {
      cached = await currentToken(signal);

      // A bearer token is credential material the moment it is in hand,
      // whether it was granted or read back from the cache. It is registered
      // once per distinct value rather than once per request, so a long-running
      // bridge does not accumulate one entry per call (AUTH-02).
      if (registered !== cached.idToken) {
        registered = cached.idToken;
        options.registerSecret(cached.idToken);
      }

      return cached.idToken;
    },
  };
}
