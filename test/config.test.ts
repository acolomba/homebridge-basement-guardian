import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateConfig } from '../src/config.js';
import { PROTOCOL } from '../src/protocol.js';
import { PLATFORM_NAME } from '../src/settings.js';

import type { BgConfig, ConfigAccepted, ConfigRefused } from '../src/config.js';
import type { PlatformConfig } from 'homebridge';

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

test('refuses a configuration that omits the account password', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: 'the account password is missing.' };

  // act
  const configResult = validateConfig({ platform: PLATFORM_NAME, email: 'account@example.test' });

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

test('refuses a configuration whose account password is empty', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: 'the account password is missing.' };

  // act
  const configResult = validateConfig(accountConfig({ password: '' }));

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

test('resolves the bundled client identifier and the documented defaults when the optional fields are absent', () => {
  // act
  const configResult = validateConfig(accountConfig());

  // assert
  assert.deepStrictEqual(configResult, acceptedConfig());
});

test('resolves a supplied client identifier over the bundled one', () => {
  // act
  const configResult = validateConfig(accountConfig({ clientId: 'supplied-client-id' }));

  // assert
  assert.deepStrictEqual(configResult, acceptedConfig({ clientId: 'supplied-client-id' }));
});

test('keeps the supplied platform name', () => {
  // act
  const configResult = validateConfig(accountConfig({ name: 'Cellar Guardian' }));

  // assert
  assert.deepStrictEqual(configResult, acceptedConfig({ name: 'Cellar Guardian' }));
});

test('keeps the supplied poll interval and offline confirmation poll count', () => {
  // act
  const configResult = validateConfig(accountConfig({ pollInterval: 600, offlineConfirmationPollCount: 4 }));

  // assert
  assert.deepStrictEqual(configResult, acceptedConfig({ pollIntervalSeconds: 600, offlineConfirmationPollCount: 4 }));
});

test('refuses a poll interval that is not a number', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: 'pollInterval must be a number of seconds, but it is every-ten-minutes.' };

  // act
  const configResult = validateConfig(accountConfig({ pollInterval: 'every-ten-minutes' }));

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

test('refuses an offline confirmation poll count that is not a number', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: 'offlineConfirmationPollCount must be a number of polls, but it is twice.' };

  // act
  const configResult = validateConfig(accountConfig({ offlineConfirmationPollCount: 'twice' }));

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});
