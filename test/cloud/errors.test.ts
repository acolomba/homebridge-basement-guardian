// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Verifies cloud error classes and their structured fields.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AuthHaltedError, AuthRejectedError, AuthThrottledError, CloudRequestError } from '../../src/cloud/errors.js';

const THIRTY_MINUTES_MS = 1_800_000;

test('a cloud request failure carries the HTTP status and the route label', () => {
  // arrange
  const message = 'GET /devices failed with HTTP 403.';
  const status = 403;
  const route = 'GET /devices';

  // act
  const requestFailure = new CloudRequestError(message, status, route);

  // assert
  assert.ok(requestFailure instanceof Error);
  assert.ok(requestFailure instanceof CloudRequestError);
  assert.deepStrictEqual(
    { name: requestFailure.name, message: requestFailure.message, status: requestFailure.status, route: requestFailure.route },
    { name: 'CloudRequestError', message: 'GET /devices failed with HTTP 403.', status: 403, route: 'GET /devices' },
  );
  assert.deepStrictEqual(
    {
      cloud: requestFailure instanceof CloudRequestError,
      rejected: requestFailure instanceof AuthRejectedError,
      throttled: requestFailure instanceof AuthThrottledError,
      halted: requestFailure instanceof AuthHaltedError,
    },
    { cloud: true, rejected: false, throttled: false, halted: false },
  );
  assert.deepStrictEqual(Object.keys(requestFailure).sort(), ['name', 'route', 'status']);
});

test('a cloud request failure labels the route without naming a URL', () => {
  // arrange
  const message = 'GET /devices failed with HTTP 500.';
  const status = 500;
  const route = 'GET /devices';

  // act
  const requestFailure = new CloudRequestError(message, status, route);

  // assert
  assert.ok(requestFailure instanceof CloudRequestError);
  assert.deepStrictEqual(
    { name: requestFailure.name, message: requestFailure.message, status: requestFailure.status, route: requestFailure.route },
    { name: 'CloudRequestError', message: 'GET /devices failed with HTTP 500.', status: 500, route: 'GET /devices' },
  );
});

test('an authentication rejection carries the parsed vendor error code', () => {
  // arrange
  const message = 'the vendor rejected the account credentials with HTTP 403 (invalid_grant).';
  const reason = 'invalid_grant';

  // act
  const rejection = new AuthRejectedError(message, reason);

  // assert
  assert.ok(rejection instanceof Error);
  assert.ok(rejection instanceof AuthRejectedError);
  assert.deepStrictEqual(
    { name: rejection.name, message: rejection.message, reason: rejection.reason },
    { name: 'AuthRejectedError', message: 'the vendor rejected the account credentials with HTTP 403 (invalid_grant).', reason: 'invalid_grant' },
  );
  assert.deepStrictEqual(
    {
      cloud: rejection instanceof CloudRequestError,
      rejected: rejection instanceof AuthRejectedError,
      throttled: rejection instanceof AuthThrottledError,
      halted: rejection instanceof AuthHaltedError,
    },
    { cloud: false, rejected: true, throttled: false, halted: false },
  );
  assert.deepStrictEqual(Object.keys(rejection).sort(), ['name', 'reason']);
});

test('an authentication throttling response carries the interval to wait before trying again', () => {
  // arrange
  const message = 'the vendor authentication service answered HTTP 429 (too_many_attempts).';
  const retryAfterMs = THIRTY_MINUTES_MS;

  // act
  const throttling = new AuthThrottledError(message, retryAfterMs);

  // assert
  assert.ok(throttling instanceof Error);
  assert.ok(throttling instanceof AuthThrottledError);
  assert.deepStrictEqual(
    { name: throttling.name, message: throttling.message, retryAfterMs: throttling.retryAfterMs },
    { name: 'AuthThrottledError', message: 'the vendor authentication service answered HTTP 429 (too_many_attempts).', retryAfterMs: 1_800_000 },
  );
  assert.deepStrictEqual(
    {
      cloud: throttling instanceof CloudRequestError,
      rejected: throttling instanceof AuthRejectedError,
      throttled: throttling instanceof AuthThrottledError,
      halted: throttling instanceof AuthHaltedError,
    },
    { cloud: false, rejected: false, throttled: true, halted: false },
  );
  assert.deepStrictEqual(Object.keys(throttling).sort(), ['name', 'retryAfterMs']);
});

test('a halted authentication carries the vendor error code that stopped it', () => {
  // arrange
  const message = 'authentication stopped after the vendor refused the account credentials.';
  const reason = 'invalid_grant';

  // act
  const halt = new AuthHaltedError(message, reason);

  // assert
  assert.ok(halt instanceof Error);
  assert.ok(halt instanceof AuthHaltedError);
  assert.deepStrictEqual(
    { name: halt.name, message: halt.message, reason: halt.reason },
    { name: 'AuthHaltedError', message: 'authentication stopped after the vendor refused the account credentials.', reason: 'invalid_grant' },
  );
  assert.deepStrictEqual(
    {
      cloud: halt instanceof CloudRequestError,
      rejected: halt instanceof AuthRejectedError,
      throttled: halt instanceof AuthThrottledError,
      halted: halt instanceof AuthHaltedError,
    },
    { cloud: false, rejected: false, throttled: false, halted: true },
  );
  assert.deepStrictEqual(Object.keys(halt).sort(), ['name', 'reason']);
});
