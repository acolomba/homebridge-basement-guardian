import { createHash } from 'node:crypto';
import { access, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { AuthRejectedError, AuthThrottledError } from './errors.js';
import { isRecord } from './types.js';

import type { ProtocolConstants } from '../protocol.js';
import type { Clock } from '../runtime/clock.js';
import type { Logging } from 'homebridge';

const GRANT_TYPE = 'http://auth0.com/oauth/grant-type/password-realm';
const GRANT_SCOPE = 'openid profile email';
const TOO_MANY_ATTEMPTS = 429;
const MILLISECONDS_PER_SECOND = 1_000;

// Only the owner may read the cache: it holds a bearer token for the account
// (AUTH-02).
const OWNER_ONLY_MODE = 0o600;

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

// The mode is applied only when the file is created, so a fresh file is written
// and renamed over the target; writing the target in place would leave a
// drifted mode untouched and the token readable by every local user (AUTH-02,
// T-01-21). The rename is atomic, so an interrupted write cannot truncate the
// cache into an avoidable authentication. The temporary name carries the
// process id, so two Homebridge processes cannot collide on it.
async function writeCachedToken(options: AuthClientOptions, token: CachedToken): Promise<void> {
  const target = cachePath(options);
  const temporary = `${target}.${String(process.pid)}.tmp`;
  const salt = options.createSalt();
  const cache: TokenCacheFile = {
    idToken: token.idToken,
    expiresAt: token.expiresAtMs,
    emailFingerprint: fingerprint(salt, options.email),
    salt,
  };

  try {
    await writeFile(temporary, JSON.stringify(cache), { mode: OWNER_ONLY_MODE });
    await rename(temporary, target);
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

function grantFailure(status: number, body: unknown): Error {
  const reason = readErrorCode(body);

  if (status === TOO_MANY_ATTEMPTS) {
    return new AuthThrottledError(`the vendor authentication service answered HTTP ${String(status)} (${reason}).`);
  }

  return new AuthRejectedError(`the vendor rejected the account credentials with HTTP ${String(status)} (${reason}).`, reason);
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

async function requestGrant(options: AuthClientOptions, signal: AbortSignal): Promise<CachedToken> {
  const response = await fetch(`https://${options.constants.auth0Domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: grantBody(options),
    signal: AbortSignal.any([signal, AbortSignal.timeout(options.requestTimeoutMs)]),
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    options.log.error(`Authentication failed with HTTP ${String(response.status)}.`);

    throw grantFailure(response.status, body);
  }

  const grant = readGrant(body, options.clock);

  if (grant === undefined) {
    options.log.error('Authentication returned a response the plugin cannot read.');

    throw new AuthRejectedError('the vendor authentication response carried no usable token.', 'malformed_response');
  }

  return grant;
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
 */
export function createAuthClient(options: AuthClientOptions): AuthClient {
  let cached: CachedToken | undefined;
  let cacheRead = false;

  async function currentToken(signal: AbortSignal): Promise<CachedToken> {
    if (!cacheRead) {
      cacheRead = true;
      cached = await readCachedToken(options);
    }

    if (cached !== undefined && isCurrent(cached.expiresAtMs, options.clock)) {
      return cached;
    }

    const granted = await requestGrant(options, signal);
    await writeCachedToken(options, granted);

    return granted;
  }

  return {
    async idToken(signal: AbortSignal): Promise<string> {
      cached = await currentToken(signal);

      return cached.idToken;
    },
  };
}
