import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { PLATFORM_NAME } from '../src/settings.js';

/** One field of the generated settings form. */
interface SettingsFormField {
  title: string;
  type: string;
  format?: string;
  widget?: string;
  placeholder?: string;
  default?: unknown;
  minLength?: number;
  pattern?: string;
}

/** The six fields the settings form offers, and no others. */
interface SettingsFormFields {
  name: SettingsFormField;
  email: SettingsFormField;
  password: SettingsFormField;
  clientId: SettingsFormField;
  pollInterval: SettingsFormField;
  offlineConfirmationPollCount: SettingsFormField;
}

/** The shape of the shipped `config.schema.json`. */
interface SettingsSchema {
  pluginAlias: string;
  pluginType: string;
  singular: boolean;
  strictValidation: boolean;
  headerDisplay: string;
  schema: {
    type: string;
    required: string[];
    properties: SettingsFormFields;
  };
}

// The published package ships config.schema.json from the repository root, so
// the cases read that file rather than a copy the build emitted. The compiled
// case runs from dist-test/test, which puts the root two levels up.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readSettingsSchema(): SettingsSchema {
  const shippedSchema = readFileSync(join(REPOSITORY_ROOT, 'config.schema.json'), 'utf8');

  // JSON.parse answers `any`; the cases below assert every field this type promises.
  return JSON.parse(shippedSchema) as SettingsSchema;
}

test('advertises the plugin alias the platform registers under', () => {
  // act
  const settingsSchema = readSettingsSchema();

  // assert
  assert.strictEqual(settingsSchema.pluginAlias, PLATFORM_NAME);
  assert.strictEqual(settingsSchema.pluginType, 'platform');
});

test('offers one account block the Homebridge UI refuses to save incomplete', () => {
  // act
  const settingsSchema = readSettingsSchema();

  // assert
  assert.strictEqual(settingsSchema.singular, true);
  assert.strictEqual(settingsSchema.strictValidation, true);
});

test('CONF-02 states in the form header that Homebridge stores the password in plain text', () => {
  // act
  const settingsSchema = readSettingsSchema();

  // assert
  assert.ok(settingsSchema.headerDisplay.includes('stores the password in plain text in `config.json`'));
  assert.ok(settingsSchema.headerDisplay.includes('includes it in backups'));
});

test('CONF-02 requires the account email and password, the two fields the runtime has no default for', () => {
  // act
  const settingsSchema = readSettingsSchema();

  // assert
  assert.deepStrictEqual(settingsSchema.schema.required, ['email', 'password']);
});

// The form has to refuse a blank value for the same fields the validator refuses one for, or it
// saves a configuration the plugin then refuses to start on. A minimum length alone accepts a
// single space, which the validator trims away.
for (const field of ['name', 'password', 'clientId'] as const) {
  test(`CONF-02 gives ${field} the non-blank rule the runtime enforces`, () => {
    // act
    const { [field]: formField } = readSettingsSchema().schema.properties;

    // assert
    assert.deepStrictEqual({ minLength: formField.minLength, pattern: formField.pattern }, { minLength: 1, pattern: '\\S' });
  });
}

test('CONF-02 masks the password field and validates the email field as an address', () => {
  // act
  const settingsSchema = readSettingsSchema();

  // assert
  assert.strictEqual(settingsSchema.schema.properties.password.widget, 'password');
  assert.strictEqual(settingsSchema.schema.properties.email.format, 'email');
});

test('CONF-05 keeps the poll interval default in code by offering a placeholder rather than a default', () => {
  // act
  const { pollInterval } = readSettingsSchema().schema.properties;

  // assert
  assert.strictEqual(pollInterval.placeholder, '900');
  assert.strictEqual(Object.hasOwn(pollInterval, 'default'), false);
});

test('CONF-05 writes the offline confirmation poll count default of 2 into the configuration', () => {
  // act
  const { offlineConfirmationPollCount } = readSettingsSchema().schema.properties;

  // assert
  assert.strictEqual(offlineConfirmationPollCount.default, 2);
});

test('CONF-04 exposes no vendor protocol constant other than the client identifier', () => {
  // arrange
  const expectedFields = ['name', 'email', 'password', 'clientId', 'pollInterval', 'offlineConfirmationPollCount'];

  // act
  const settingsSchema = readSettingsSchema();

  // assert
  assert.deepStrictEqual(Object.keys(settingsSchema.schema.properties), expectedFields);
});
