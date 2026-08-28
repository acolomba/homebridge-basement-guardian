import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AuthRejectedError, AuthThrottledError, CloudRequestError } from '../../src/cloud/errors.js';

test('a cloud request failure carries the HTTP status and the route label', () => {
  // act
  const requestFailure = new CloudRequestError('GET /devices failed with HTTP 403.', 403, 'GET /devices');

  // assert
  assert.strictEqual(requestFailure.name, 'CloudRequestError');
  assert.strictEqual(requestFailure.message, 'GET /devices failed with HTTP 403.');
  assert.strictEqual(requestFailure.status, 403);
  assert.strictEqual(requestFailure.route, 'GET /devices');
  assert.strictEqual(requestFailure instanceof Error, true);
});

test('a cloud request failure labels the route without naming a URL', () => {
  // act
  const requestFailure = new CloudRequestError('GET /devices failed with HTTP 500.', 500, 'GET /devices');

  // assert
  assert.strictEqual(requestFailure.route.includes('://'), false);
  assert.strictEqual(requestFailure.message.includes('://'), false);
});

test('an authentication rejection carries the parsed vendor error code', () => {
  // act
  const rejection = new AuthRejectedError('the vendor rejected the account credentials with HTTP 403 (invalid_grant).', 'invalid_grant');

  // assert
  assert.strictEqual(rejection.name, 'AuthRejectedError');
  assert.strictEqual(rejection.message, 'the vendor rejected the account credentials with HTTP 403 (invalid_grant).');
  assert.strictEqual(rejection.reason, 'invalid_grant');
  assert.strictEqual(rejection instanceof Error, true);
});

test('an authentication throttling response carries its message', () => {
  // act
  const throttling = new AuthThrottledError('the vendor authentication service answered HTTP 429 (too_many_attempts).');

  // assert
  assert.strictEqual(throttling.name, 'AuthThrottledError');
  assert.strictEqual(throttling.message, 'the vendor authentication service answered HTTP 429 (too_many_attempts).');
  assert.strictEqual(throttling instanceof Error, true);
});

test('distinguishes a rejected grant from a throttled one by class', () => {
  // arrange
  const rejection = new AuthRejectedError('rejected.', 'invalid_grant');
  const throttling = new AuthThrottledError('throttled.');

  // act & assert
  assert.strictEqual(rejection instanceof AuthThrottledError, false);
  assert.strictEqual(throttling instanceof AuthRejectedError, false);
});
