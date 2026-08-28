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

/** The vendor tenant throttled the authentication attempt. */
export class AuthThrottledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthThrottledError';
  }
}
