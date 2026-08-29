import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateConfig } from '../src/config.js';
import { PROTOCOL } from '../src/protocol.js';
import { PLATFORM_NAME } from '../src/settings.js';

import type { BgConfig, ConfigAccepted, ConfigRefused } from '../src/config.js';
import type { PlatformConfig } from 'homebridge';

// The refusal names the field and the rule and quotes no value, because an account email is an
// account identifier and the refusal is logged before anything is registered as a secret.
const MALFORMED_EMAIL_REFUSAL = 'the account email must be an email address.';

const POLL_INTERVAL_REFUSAL = 'pollInterval must be a whole number of seconds from 300 to 3600, but it is';
const POLL_COUNT_REFUSAL = 'offlineConfirmationPollCount must be a whole number of polls from 1 to 8, but it is';

function accountConfig(overrides: Record<string, unknown> = {}): PlatformConfig {
  return { platform: PLATFORM_NAME, email: 'account@example.test', password: 'account-password', ...overrides };
}

function acceptedConfig(overrides: Partial<BgConfig> = {}): ConfigAccepted {
  const config: BgConfig = {
    name: 'Basement Guardian',
    email: 'account@example.test',
    password: 'account-password',
    clientId: PROTOCOL.clientId,
    pollIntervalSeconds: 900,
    offlineConfirmationPollCount: 2,
    ...overrides,
  };

  return { ok: true, config };
}

test('refuses a configuration that omits the account email', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: 'the account email is missing.' };

  // act
  const configResult = validateConfig({ platform: PLATFORM_NAME, password: 'account-password' });

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

test('refuses a configuration whose account email is empty', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: 'the account email is missing.' };

  // act
  const configResult = validateConfig(accountConfig({ email: '' }));

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

for (const email of ['not-an-email', 'jane.doe@company', 'jane doe@example.test']) {
  test(`CONF-05 refuses an account email of ${JSON.stringify(email)} without quoting any part of it`, () => {
    // arrange
    const expectedRefusal: ConfigRefused = { ok: false, reason: MALFORMED_EMAIL_REFUSAL };

    // act
    const configResult = validateConfig(accountConfig({ email }));

    // assert
    assert.deepStrictEqual(configResult, expectedRefusal);
  });
}

test('CONF-05 reports the first failing field in a fixed order when several fields are wrong', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: MALFORMED_EMAIL_REFUSAL };

  // act
  const configResult = validateConfig(accountConfig({ email: 'not-an-email', pollInterval: 1 }));

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

test('refuses a configuration that omits the account password', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: 'the account password is missing.' };

  // act
  const configResult = validateConfig({ platform: PLATFORM_NAME, email: 'account@example.test' });

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

for (const password of ['', ' ']) {
  test(`refuses an account password of ${JSON.stringify(password)}`, () => {
    // arrange
    const expectedRefusal: ConfigRefused = { ok: false, reason: 'the account password is missing.' };

    // act
    const configResult = validateConfig(accountConfig({ password }));

    // assert
    assert.deepStrictEqual(configResult, expectedRefusal);
  });
}

for (const name of ['', ' ']) {
  test(`refuses a supplied platform name of ${JSON.stringify(name)}`, () => {
    // arrange
    const expectedRefusal: ConfigRefused = { ok: false, reason: 'the platform name must not be empty when it is set.' };

    // act
    const configResult = validateConfig(accountConfig({ name }));

    // assert
    assert.deepStrictEqual(configResult, expectedRefusal);
  });
}

test('resolves the bundled client identifier and the documented defaults when the optional fields are absent', () => {
  // act
  const configResult = validateConfig(accountConfig());

  // assert
  assert.deepStrictEqual(configResult, acceptedConfig());
});

test('CONF-04 accepts a client identifier equal to the bundled constant and yields that same value', () => {
  // act
  const configResult = validateConfig(accountConfig({ clientId: PROTOCOL.clientId }));

  // assert
  assert.deepStrictEqual(configResult, acceptedConfig());
});

test('CONF-04 resolves a supplied client identifier over the bundled one', () => {
  // act
  const configResult = validateConfig(accountConfig({ clientId: 'supplied-client-id' }));

  // assert
  assert.deepStrictEqual(configResult, acceptedConfig({ clientId: 'supplied-client-id' }));
});

for (const clientId of ['', ' ']) {
  test(`CONF-04 refuses a client identifier of ${JSON.stringify(clientId)}`, () => {
    // arrange
    const expectedRefusal: ConfigRefused = { ok: false, reason: 'clientId must not be empty when it is set.' };

    // act
    const configResult = validateConfig(accountConfig({ clientId }));

    // assert
    assert.deepStrictEqual(configResult, expectedRefusal);
  });
}

test('keeps the supplied platform name', () => {
  // act
  const configResult = validateConfig(accountConfig({ name: 'Cellar Guardian' }));

  // assert
  assert.deepStrictEqual(configResult, acceptedConfig({ name: 'Cellar Guardian' }));
});

for (const pollInterval of [300, 900, 3600]) {
  test(`CONF-05 accepts a poll interval of ${String(pollInterval)}`, () => {
    // act
    const configResult = validateConfig(accountConfig({ pollInterval }));

    // assert
    assert.deepStrictEqual(configResult, acceptedConfig({ pollIntervalSeconds: pollInterval }));
  });
}

for (const pollInterval of [299, 3601, 3.5, '900', null]) {
  test(`CONF-05 refuses a poll interval of ${JSON.stringify(pollInterval)}`, () => {
    // arrange
    const expectedRefusal: ConfigRefused = { ok: false, reason: `${POLL_INTERVAL_REFUSAL} ${String(pollInterval)}.` };

    // act
    const configResult = validateConfig(accountConfig({ pollInterval }));

    // assert
    assert.deepStrictEqual(configResult, expectedRefusal);
  });
}

test('CONF-05 describes a structured poll interval rather than reporting it as an object', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: `${POLL_INTERVAL_REFUSAL} {"seconds":900}.` };

  // act
  const configResult = validateConfig(accountConfig({ pollInterval: { seconds: 900 } }));

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

for (const offlineConfirmationPollCount of [1, 2, 8]) {
  test(`CONF-05 accepts an offline confirmation poll count of ${String(offlineConfirmationPollCount)}`, () => {
    // act
    const configResult = validateConfig(accountConfig({ offlineConfirmationPollCount }));

    // assert
    assert.deepStrictEqual(configResult, acceptedConfig({ offlineConfirmationPollCount }));
  });
}

for (const offlineConfirmationPollCount of [0, 9, 1.5, '2', null]) {
  test(`CONF-05 refuses an offline confirmation poll count of ${JSON.stringify(offlineConfirmationPollCount)}`, () => {
    // arrange
    const expectedRefusal: ConfigRefused = { ok: false, reason: `${POLL_COUNT_REFUSAL} ${String(offlineConfirmationPollCount)}.` };

    // act
    const configResult = validateConfig(accountConfig({ offlineConfirmationPollCount }));

    // assert
    assert.deepStrictEqual(configResult, expectedRefusal);
  });
}
