import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createFakeHap } from '../features/support/fakeHap.js';
import { createServiceCatalogue } from '../src/accessories/serviceCatalogue.js';
import { PLATFORM_NAME } from '../src/settings.js';

import type { API } from 'homebridge';

/** The value domain of a list field in the generated settings form. */
interface SettingsFormItems {
  type: string;
  enum: string[];
  enumNames: string[];
}

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
  uniqueItems?: boolean;
  items?: SettingsFormItems;
}

/** The seven fields the settings form offers, and no others. */
interface SettingsFormFields {
  name: SettingsFormField;
  email: SettingsFormField;
  password: SettingsFormField;
  clientId: SettingsFormField;
  pollInterval: SettingsFormField;
  offlineConfirmationPollCount: SettingsFormField;
  ignoredFaults: SettingsFormField;
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

// `items` is optional on a form field, so the list cases name the missing domain rather than
// reporting a property read of `undefined`.
function readIgnoredFaultItems(): SettingsFormItems {
  const { ignoredFaults } = readSettingsSchema().schema.properties;

  return ignoredFaults.items ?? assert.fail('the ignoredFaults field declares no item domain');
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
  const expectedFields = ['name', 'email', 'password', 'clientId', 'pollInterval', 'offlineConfirmationPollCount', 'ignoredFaults'];

  // act
  const settingsSchema = readSettingsSchema();

  // assert
  assert.deepStrictEqual(Object.keys(settingsSchema.schema.properties), expectedFields);
});

test('CONF-06 offers the removable notification sensors as a list that cannot repeat a name', () => {
  // act
  const { ignoredFaults } = readSettingsSchema().schema.properties;

  // assert
  assert.strictEqual(ignoredFaults.type, 'array');
  assert.strictEqual(ignoredFaults.uniqueItems, true);
});

// The seven names are written out here rather than imported from NOTIFICATION_SERVICE_KINDS, so a
// name that drifts on the runtime side fails this case instead of travelling with it.
test('CONF-06 offers exactly the seven removable notification sensors and no other value', () => {
  // arrange
  const expectedValues = [
    'backup-pump-activated',
    'mains-power-lost',
    'primary-pump-fault',
    'backup-pump-fault',
    'water-sensor-fault',
    'pump-controller-link-lost',
    'basement-guardian-offline',
  ];

  // act
  const items = readIgnoredFaultItems();

  // assert
  assert.strictEqual(items.type, 'string');
  // Keep the existence check. It does not restate the deep-equal below it: the settings form
  // chooses the checkbox control by testing `enum` as an own property of the item schema, and
  // draws a row of per-item dropdowns when it is absent. Spelling the same seven values another
  // way keeps the deep-equal green and loses the control, which is what regressed once.
  assert.strictEqual(Object.hasOwn(items, 'enum'), true);
  assert.deepStrictEqual(items.enum, expectedValues);
  assert.strictEqual(Object.hasOwn(items, 'oneOf'), false);
});

// The settings form pairs a label with its value by position and stops at the end of the shorter
// list, so a short name list drops boxes off the end of the control and a reordered one puts one
// sensor's name on another sensor's box. Both are silent. The count is pinned here and the
// pairing itself in the case below.
test('CONF-06 gives every offered value a label to pair with', () => {
  // act
  const items = readIgnoredFaultItems();

  // assert
  assert.strictEqual(items.enum.length, 7);
  assert.strictEqual(items.enumNames.length, items.enum.length);
});

// The label a user picks in the settings form is the name their home shows for that sensor, so the
// two are read off the shipped schema and the shipped catalogue and compared as pairs: a label that
// drifts on either side names itself in the diff.
test('CONF-06 labels each option with the name the accessory publishes that sensor under', () => {
  // arrange
  const catalogue = createServiceCatalogue(createFakeHap() as unknown as API['hap']);
  const items = readIgnoredFaultItems();

  // act
  const offeredOptions = items.enum.map((kind, position) => ({ kind, displayName: items.enumNames[position] }));

  // assert
  const publishedOptions = offeredOptions.map(({ kind }) => ({ kind, displayName: catalogue.find((row) => row.kind === kind)?.displayName }));
  assert.deepStrictEqual(offeredOptions, publishedOptions);
});

// SAFE-07 forbids a plugin-side delay from existing at all, and absence is not provable by watching
// behaviour: a debounce shorter than whatever a case waits would survive. The settings form is the
// only surface an administrator could reach one through, so the key set is read from the shipped
// file rather than a literal, which covers a key added later too (D-18).
test('SAFE-07 offers no settings-form control that could delay a notification', () => {
  // arrange
  const delayTokens = ['delay', 'debounce', 'acknowledg', 'latch', 'quiet'];

  // act
  const delayControls = Object.keys(readSettingsSchema().schema.properties).filter((field) => delayTokens.some((token) => field.toLowerCase().includes(token)));

  // assert
  assert.deepStrictEqual(delayControls, []);
});
