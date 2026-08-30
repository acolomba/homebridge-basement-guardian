import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateConfig } from '../src/config.js';
import { PROTOCOL } from '../src/protocol.js';
import { PLATFORM_NAME } from '../src/settings.js';

import type { NotificationServiceKind } from '../src/accessories/services.js';
import type { BgConfig, ConfigAccepted, ConfigRefused } from '../src/config.js';
import type { PlatformConfig } from 'homebridge';

// The refusal names the field and the rule and quotes no value, because an account email is an
// account identifier and the refusal is logged before anything is registered as a secret.
const MALFORMED_EMAIL_REFUSAL = 'the account email must be an email address.';

const POLL_INTERVAL_REFUSAL = 'pollInterval must be a whole number of seconds from 300 to 3600, but it is';
const POLL_COUNT_REFUSAL = 'offlineConfirmationPollCount must be a whole number of polls from 1 to 8, but it is';

// The removable sensor names are written out here rather than read from the production list, so a
// case fails when the refusal stops enumerating one of them instead of agreeing with it (D-17).
const REMOVABLE_SENSOR_NAMES: readonly NotificationServiceKind[] = [
  'backup-pump-activated',
  'mains-power-lost',
  'primary-pump-fault',
  'backup-pump-fault',
  'water-sensor-fault',
  'pump-controller-link-lost',
  'basement-guardian-offline',
];

const UNKNOWN_SENSOR_REFUSAL = `ignoredFaults must name only ${REMOVABLE_SENSOR_NAMES.join(', ')}, but it names`;
const NOT_A_LIST_REFUSAL = 'ignoredFaults must be a list of notification sensor names, but it is';

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
    ignoredFaults: [],
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

/** One removable-sensor list the validator accepts, and the words its case titles it with. */
interface AcceptedSensorList {
  described: string;
  ignoredFaults: readonly NotificationServiceKind[];
}

const ACCEPTED_SENSOR_LISTS: readonly AcceptedSensorList[] = [
  { described: 'an empty list', ignoredFaults: [] },
  { described: 'one removable sensor', ignoredFaults: ['mains-power-lost'] },
  { described: 'every removable sensor', ignoredFaults: REMOVABLE_SENSOR_NAMES },
  { described: 'every removable sensor in the opposite order', ignoredFaults: [...REMOVABLE_SENSOR_NAMES].reverse() },
];

for (const { described, ignoredFaults } of ACCEPTED_SENSOR_LISTS) {
  test(`CONF-06 accepts ${described} and resolves it in the supplied order`, () => {
    // act
    const configResult = validateConfig(accountConfig({ ignoredFaults }));

    // assert
    assert.deepStrictEqual(configResult, acceptedConfig({ ignoredFaults }));
  });
}

test('CONF-06 publishes every adapter when the configuration omits the removable sensor list', () => {
  // act
  const configResult = validateConfig(accountConfig());

  // assert
  assert.deepStrictEqual(configResult, acceptedConfig({ ignoredFaults: [] }));
});

for (const { described, entry } of [
  { described: 'a misspelled sensor name', entry: 'mains-power-lst' },
  { described: 'a truthful service that cannot be removed', entry: 'sump-pit-flood' },
  { described: 'an entry that is not text', entry: 1 },
]) {
  test(`CONF-06 refuses ${described} and enumerates every removable sensor`, () => {
    // arrange
    const expectedRefusal: ConfigRefused = { ok: false, reason: `${UNKNOWN_SENSOR_REFUSAL} ${String(entry)}.` };

    // act
    const configResult = validateConfig(accountConfig({ ignoredFaults: [entry] }));

    // assert
    assert.deepStrictEqual(configResult, expectedRefusal);
  });
}

// D-17 refuses the whole configuration over one typo, so the refusal is the administrator's only
// route back. Each removable sensor is checked on its own, against a name this module owns.
for (const sensorName of REMOVABLE_SENSOR_NAMES) {
  test(`CONF-06 names ${sensorName} in the refusal for an unrecognised removable sensor`, () => {
    // act
    const configResult = validateConfig(accountConfig({ ignoredFaults: ['mains-power-lst'] }));

    // assert
    assert.ok(!configResult.ok);
    assert.ok(configResult.reason.includes(sensorName));
  });
}

test('CONF-06 names the unrecognised entry in the refusal', () => {
  // act
  const configResult = validateConfig(accountConfig({ ignoredFaults: ['mains-power-lst'] }));

  // assert
  assert.ok(!configResult.ok);
  assert.ok(configResult.reason.includes('mains-power-lst'));
});

test('CONF-06 names the same unrecognised entry wherever it sits in the list', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: `${UNKNOWN_SENSOR_REFUSAL} mains-power-lst.` };

  // act
  const configResult = validateConfig(accountConfig({ ignoredFaults: ['backup-pump-fault', 'mains-power-lst', 'water-sensor-fault'] }));

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

test('CONF-06 refuses a repeated removable sensor and says the list must be unique', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: 'ignoredFaults must be a unique list, but it names mains-power-lost more than once.' };

  // act
  const configResult = validateConfig(accountConfig({ ignoredFaults: ['mains-power-lost', 'primary-pump-fault', 'mains-power-lost'] }));

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

for (const { supplied, describedValue } of [
  { supplied: null, describedValue: 'null' },
  { supplied: 'mains-power-lost', describedValue: 'mains-power-lost' },
  { supplied: {}, describedValue: '{}' },
  { supplied: 3, describedValue: '3' },
]) {
  test(`CONF-06 refuses a removable sensor list of ${describedValue} that is not a list`, () => {
    // arrange
    const expectedRefusal: ConfigRefused = { ok: false, reason: `${NOT_A_LIST_REFUSAL} ${describedValue}.` };

    // act
    const configResult = validateConfig(accountConfig({ ignoredFaults: supplied }));

    // assert
    assert.deepStrictEqual(configResult, expectedRefusal);
  });
}

test('CONF-06 reports the poll interval before the removable sensor list when both are wrong', () => {
  // arrange
  const expectedRefusal: ConfigRefused = { ok: false, reason: `${POLL_INTERVAL_REFUSAL} 1.` };

  // act
  const configResult = validateConfig(accountConfig({ pollInterval: 1, ignoredFaults: ['mains-power-lst'] }));

  // assert
  assert.deepStrictEqual(configResult, expectedRefusal);
});

test('CONF-06 refuses an unrecognised removable sensor without quoting the account email', () => {
  // act
  const configResult = validateConfig(accountConfig({ ignoredFaults: ['mains-power-lst'] }));

  // assert
  assert.ok(!configResult.ok);
  assert.strictEqual(configResult.reason.includes('@'), false);
});
