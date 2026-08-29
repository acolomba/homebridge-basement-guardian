import { AuthRejectedError, AuthThrottledError } from './errors.js';
import { isRecord } from './types.js';

import type { ProtocolConstants } from '../protocol.js';
import type { Clock } from '../runtime/clock.js';
import type { Logging } from 'homebridge';

const GRANT_TYPE = 'http://auth0.com/oauth/grant-type/password-realm';
const GRANT_SCOPE = 'openid profile email';
const TOO_MANY_ATTEMPTS = 429;
const MILLISECONDS_PER_SECOND = 1_000;

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
 * The grant is the Auth0 password-realm grant, and the resulting ID token is
 * held in memory until it expires (AUTH-01). Creating the client performs no
 * request; only `idToken` does.
 */
export function createAuthClient(options: AuthClientOptions): AuthClient {
  let cached: CachedToken | undefined;

  return {
    async idToken(signal: AbortSignal): Promise<string> {
      if (cached !== undefined && cached.expiresAtMs > options.clock.now()) {
        return cached.idToken;
      }

      cached = await requestGrant(options, signal);

      return cached.idToken;
    },
  };
}
