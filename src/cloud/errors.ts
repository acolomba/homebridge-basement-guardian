// SPDX-License-Identifier: MIT
/**
 * A vendor REST call that did not produce usable data.
 *
 * The error carries the HTTP status and a route label such as `GET /devices`.
 * It never carries a URL, a header, a token, or response body text, so logging
 * it cannot leak a credential (T-01-05, AUTH-02).
 */
export class CloudRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly route: string,
  ) {
    super(message);
    this.name = 'CloudRequestError';
  }
}

/**
 * The vendor tenant refused the account credentials.
 *
 * `reason` is the vendor's parsed `error` code. The request body is a secret in
 * its entirety and never reaches this error.
 */
export class AuthRejectedError extends Error {
  constructor(
    message: string,
    readonly reason: string,
  ) {
    super(message);
    this.name = 'AuthRejectedError';
  }
}

/**
 * The vendor tenant throttled the authentication attempt.
 *
 * `retryAfterMs` is the long interval the caller waits before trying again. It
 * is deliberately longer than a capped backoff: a throttling response can mean
 * the account is blocked, and each attempt extends that block (D-22).
 */
export class AuthThrottledError extends Error {
  constructor(
    message: string,
    readonly retryAfterMs: number,
  ) {
    super(message);
    this.name = 'AuthThrottledError';
  }
}

/**
 * Authentication has stopped and will not be attempted again.
 *
 * The vendor lifts a brute-force block only once thirty days pass from the last
 * failed attempt, so a plugin that keeps trying prevents the block from ever
 * clearing. `reason` is the vendor error code that stopped it. Correcting the
 * account in the Homebridge UI restarts the bridge, which is what clears this
 * state (D-13).
 */
export class AuthHaltedError extends Error {
  constructor(
    message: string,
    readonly reason: string,
  ) {
    super(message);
    this.name = 'AuthHaltedError';
  }
}
