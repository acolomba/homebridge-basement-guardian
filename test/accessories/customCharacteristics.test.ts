import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';

import type { CharacteristicClass, CustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
import type { API } from 'homebridge';

// Every type Apple assigns lives in one namespace. A plugin identifier ending with this suffix
// would sit inside Apple's assigned space, where a future Apple type could collide with it
// (SAFE-08).
const APPLE_BASE_UUID_SUFFIX = '-0000-1000-8000-0026BB765291';

// A random v4 identifier, written out here rather than derived, so a seed-derived identifier --
// which a later edit to the seed would silently change -- fails this shape (D-015).
const RANDOM_V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// The two permissions a read-only characteristic grants, written independently of the namespace so
// a drifted permission set fails here (SAFE-08).
const READ_ONLY_PERMS: readonly string[] = ['pr', 'ev'];

// Wi-Fi signal strength is module diagnostics rather than a basement-protection condition (D-016),
// and battery health is never represented through filter-maintenance semantics (D-021, SAFE-06).
// A characteristic named after either would be the first sign that one had crept in.
const FORBIDDEN_NAME_WORDS: readonly string[] = ['Filter', 'Wi-Fi', 'WiFi', 'Signal', 'dBm'];

// A count an owner reads as a fact about their basement must not present itself as a whole-of-life
// or device-reported figure: the plugin can only ever count what it watched, and a name claiming
// otherwise would be a false normal the characteristic itself asserts (D-12, D-020).
const FORBIDDEN_COUNT_WORDS: readonly string[] = ['total', 'lifetime', 'all time'];

// The four characteristics carrying what the plugin observed rather than what the device reported.
// They are named here as the plain keys a catalogue row reads them under, so a renamed member fails
// this file rather than silently following the rename (CTRL-01).
const RECORD_CHARACTERISTIC_NAMES: readonly string[] = [
  'ObservationStartedAt',
  'ObservedActivationCount',
  'LastObservedActivationAt',
  'LastActivationWasTestActivity',
];

/** One vendor-defined characteristic and the identity a caller reads it under. */
interface CharacteristicExpectation {
  name: string;
  displayName: string;
  format: string;
}

// The whole declared set, in the order the factory answers it. The format strings are written out
// rather than read off the namespace, so a declaration that changed format fails here.
const CHARACTERISTICS: readonly CharacteristicExpectation[] = [
  { name: 'RawWaterLevelCode', displayName: 'Raw Water Level Code', format: 'uint8' },
  { name: 'PumpRunning', displayName: 'Pump Running', format: 'bool' },
  { name: 'PumpFault', displayName: 'Pump Fault', format: 'bool' },
  { name: 'PumpFuseBlown', displayName: 'Pump Fuse Blown', format: 'bool' },
  { name: 'WaterSensorFaultReported', displayName: 'Water Sensor Fault Reported', format: 'bool' },
  { name: 'MainsPowerPresent', displayName: 'Mains Power Present', format: 'bool' },
  { name: 'BatteryCharging', displayName: 'Battery Charging', format: 'bool' },
  { name: 'BatteryVoltageLow', displayName: 'Battery Voltage Low', format: 'bool' },
  { name: 'BatteryHealthCode', displayName: 'Battery Health Code', format: 'uint8' },
  { name: 'ProtectionHoursCode', displayName: 'Protection Hours Code', format: 'uint8' },
  { name: 'ControllerLinkPresent', displayName: 'Controller Link Present', format: 'bool' },
  { name: 'ControllerDataLastTrustedAt', displayName: 'Controller Data Last Trusted At', format: 'string' },
  { name: 'ObservationStartedAt', displayName: 'Observation Start', format: 'string' },
  { name: 'ObservedActivationCount', displayName: 'Activations Observed Since Observation Start', format: 'uint32' },
  { name: 'LastObservedActivationAt', displayName: 'Last Observed Activation At', format: 'string' },
  { name: 'LastActivationWasTestActivity', displayName: 'Last Activation Was Self-Test', format: 'bool' },
];

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
function hapNamespace(): API['hap'] {
  return createFakeHap() as unknown as API['hap'];
}

// The declared set as a plain lookup, so a characteristic is found by the key it is published under
// rather than through `keyof CustomCharacteristics`: the table above is what pins the declared set,
// instead of following whatever the interface happens to declare.
function declaredSet(characteristics: CustomCharacteristics): Readonly<Record<string, CharacteristicClass>> {
  return { ...characteristics };
}

function declaredAs(characteristics: CustomCharacteristics, name: string): CharacteristicClass {
  const declared = declaredSet(characteristics)[name];

  if (declared === undefined) {
    throw new Error(`no vendor-defined characteristic is declared as ${name}`);
  }

  return declared;
}

describe('createCustomCharacteristics', () => {
  test('declares exactly the vendor-defined characteristics this plugin publishes', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const names = Object.keys(characteristics);

    // assert
    assert.deepStrictEqual(
      names,
      CHARACTERISTICS.map((expectation) => expectation.name),
    );
  });

  for (const { name, displayName, format } of CHARACTERISTICS) {
    test(`declares ${name} as a read-only ${format} named ${displayName}`, () => {
      // arrange
      const characteristics = createCustomCharacteristics(hapNamespace());

      // act
      const characteristic = new (declaredAs(characteristics, name))();

      // assert
      assert.deepStrictEqual(
        { displayName: characteristic.displayName, format: characteristic.props.format, perms: characteristic.props.perms },
        { displayName, format, perms: ['pr', 'ev'] },
      );
    });

    test(`identifies ${name} with a fixed v4 identifier outside Apple's namespace`, () => {
      // arrange
      const characteristics = createCustomCharacteristics(hapNamespace());

      // act
      const uuid = declaredAs(characteristics, name).UUID;

      // assert
      assert.deepStrictEqual(
        { shape: RANDOM_V4_UUID.test(uuid), appleNamespace: uuid.endsWith(APPLE_BASE_UUID_SUFFIX) },
        { shape: true, appleNamespace: false },
      );
    });

    test(`answers the same ${name} identifier to every caller`, () => {
      // arrange
      const first = createCustomCharacteristics(hapNamespace());
      const second = createCustomCharacteristics(hapNamespace());

      // act & assert
      assert.strictEqual(declaredAs(first, name).UUID, declaredAs(second, name).UUID);
    });
  }

  test('grants no write permission on any vendor-defined characteristic', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const granted = CHARACTERISTICS.flatMap(({ name }) => {
      const perms: readonly string[] = new (declaredAs(characteristics, name))().props.perms;

      return perms.filter((permission) => !READ_ONLY_PERMS.includes(permission));
    });

    // assert
    assert.deepStrictEqual(granted, []);
  });

  test('identifies every vendor-defined characteristic distinctly', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const declared = declaredSet(characteristics);
    const uuids = new Set(Object.values(declared).map((characteristic) => characteristic.UUID));

    // assert
    assert.strictEqual(uuids.size, Object.keys(declared).length);
  });

  test('gives no vendor-defined characteristic a name drawn from diagnostics or filter maintenance', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const named = CHARACTERISTICS.filter(({ name }) =>
      FORBIDDEN_NAME_WORDS.some((word) => new (declaredAs(characteristics, name))().displayName.includes(word)),
    );

    // assert
    assert.deepStrictEqual(named, []);
  });

  test('bounds the raw water level to the legal thermometer codes', () => {
    // arrange
    const { RawWaterLevelCode } = createCustomCharacteristics(hapNamespace());

    // act
    const { minValue, maxValue, minStep, validValues } = new RawWaterLevelCode().props;

    // assert
    assert.deepStrictEqual({ minValue, maxValue, minStep, validValues }, { minValue: 0, maxValue: 31, minStep: 1, validValues: [0, 1, 3, 7, 15, 31] });
  });

  test('bounds the two battery codes to the values the vendor can legally send', () => {
    // arrange
    const { BatteryHealthCode, ProtectionHoursCode } = createCustomCharacteristics(hapNamespace());

    // act
    const validValues = { health: new BatteryHealthCode().props.validValues, protectionHours: new ProtectionHoursCode().props.validValues };

    // assert
    assert.deepStrictEqual(validValues, { health: [1, 2, 4, 8, 16, 32], protectionHours: [1, 2, 4, 8] });
  });

  test('declares no domain at all on a boolean characteristic', () => {
    // arrange
    const { MainsPowerPresent } = createCustomCharacteristics(hapNamespace());

    // act
    const { minValue, maxValue, minStep, validValues } = new MainsPowerPresent().props;

    // assert
    assert.deepStrictEqual(
      { minValue, maxValue, minStep, validValues },
      { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
    );
  });

  test('starts at the boolean construction default rather than a reported value', () => {
    // arrange
    const { MainsPowerPresent } = createCustomCharacteristics(hapNamespace());

    // act
    const mainsPowerPresent = new MainsPowerPresent();

    // assert
    assert.strictEqual(mainsPowerPresent.value, false);
  });

  // A characteristic that starts outside its own declared domain hands HomeKit a code the plugin
  // itself says the vendor cannot send, from the moment the service carrying it is added.
  for (const { name } of CHARACTERISTICS.filter((expectation) => expectation.format === 'uint8')) {
    test(`starts ${name} at a value its own validValues admits`, () => {
      // arrange
      const characteristics = createCustomCharacteristics(hapNamespace());

      // act
      const characteristic = new (declaredAs(characteristics, name))();
      const validValues: readonly number[] = characteristic.props.validValues ?? [];

      // assert
      assert.deepStrictEqual(
        { initial: characteristic.value, admitted: validValues.some((candidate) => candidate === characteristic.value) },
        { initial: validValues[0], admitted: true },
      );
    });
  }

  test('starts the controller timestamp at the empty string rather than a time nothing reported', () => {
    // arrange
    const { ControllerDataLastTrustedAt } = createCustomCharacteristics(hapNamespace());

    // act
    const controllerDataLastTrustedAt = new ControllerDataLastTrustedAt();

    // assert
    assert.strictEqual(controllerDataLastTrustedAt.value, '');
  });

  test('leaves one characteristic intact when another mutates its own permissions', () => {
    // arrange
    const hap = hapNamespace();
    const { MainsPowerPresent, PumpRunning } = createCustomCharacteristics(hap);
    const mainsPower = new MainsPowerPresent().props.perms;
    const pumpRunning = new PumpRunning().props.perms;

    // act
    mainsPower.push(hap.Perms.PAIRED_WRITE);

    // assert
    assert.deepStrictEqual({ mainsPower, pumpRunning }, { mainsPower: ['pr', 'ev', 'pw'], pumpRunning: ['pr', 'ev'] });
  });

  // The count is the one record value HAP can quietly reshape. A `uint8` maximum of 255 does not
  // refuse a larger push, it clamps it, so a count past 255 would stop advancing while still
  // reading as a fact about the basement (D-12, CTRL-01). The clamping itself is demonstrated
  // against the real pinned package in the fidelity case rather than argued about here.
  test('counts observed activations on a format wide enough that HAP cannot clamp the number', () => {
    // arrange
    const hap = hapNamespace();
    const characteristics = createCustomCharacteristics(hap);

    // act
    const observedActivationCount = new (declaredAs(characteristics, 'ObservedActivationCount'))();

    // assert
    assert.strictEqual(observedActivationCount.props.format, hap.Formats.UINT32);
  });

  test('publishes every pump record read-only and outside the Apple base namespace', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const published = RECORD_CHARACTERISTIC_NAMES.map((name) => ({
      name,
      perms: new (declaredAs(characteristics, name))().props.perms,
      appleNamespace: declaredAs(characteristics, name).UUID.endsWith(APPLE_BASE_UUID_SUFFIX),
    }));

    // assert
    assert.deepStrictEqual(
      published,
      RECORD_CHARACTERISTIC_NAMES.map((name) => ({ name, perms: ['pr', 'ev'], appleNamespace: false })),
    );
  });

  test('claims no whole-of-life or device-reported figure in any pump record name', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const claimed = RECORD_CHARACTERISTIC_NAMES.flatMap((name) => {
      const displayName = new (declaredAs(characteristics, name))().displayName.toLowerCase();

      return FORBIDDEN_COUNT_WORDS.filter((word) => displayName.includes(word));
    });

    // assert
    assert.deepStrictEqual(claimed, []);
  });

  // A controller that shows this one characteristic and nothing else must still read true, which is
  // why the qualification lives in the name rather than only in the README (D-12).
  test('says in the count name itself that the number is what the plugin observed', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const displayName = new (declaredAs(characteristics, 'ObservedActivationCount'))().displayName.toLowerCase();

    // assert
    assert.strictEqual(displayName.includes('observed'), true);
  });

  // Every one of these construction defaults is a claim the plugin has not earned -- a count of
  // zero, an empty epoch, and a last activation that was not a self-test. That is why all four are
  // declared optional on the pump service, so none is ever constructed before a record writes it.
  test('starts every pump record at the format default its declaration gives it', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const initial = RECORD_CHARACTERISTIC_NAMES.map((name) => new (declaredAs(characteristics, name))().value);

    // assert
    assert.deepStrictEqual(initial, ['', 0, '', false]);
  });
});
