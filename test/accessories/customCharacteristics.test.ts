import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';

import type { CustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
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

/** One vendor-defined characteristic and the identity a caller reads it under. */
interface CharacteristicExpectation {
  name: keyof CustomCharacteristics;
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
];

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
function hapNamespace(): API['hap'] {
  return createFakeHap() as unknown as API['hap'];
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
      const characteristic = new characteristics[name]();

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
      const uuid = characteristics[name].UUID;

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
      assert.strictEqual(first[name].UUID, second[name].UUID);
    });
  }

  test('grants no write permission on any vendor-defined characteristic', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const granted = CHARACTERISTICS.flatMap(({ name }) => {
      const perms: readonly string[] = new characteristics[name]().props.perms;

      return perms.filter((permission) => !READ_ONLY_PERMS.includes(permission));
    });

    // assert
    assert.deepStrictEqual(granted, []);
  });

  test('identifies every vendor-defined characteristic distinctly', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const uuids = new Set(CHARACTERISTICS.map(({ name }) => characteristics[name].UUID));

    // assert
    assert.strictEqual(uuids.size, CHARACTERISTICS.length);
  });

  test('gives no vendor-defined characteristic a name drawn from diagnostics or filter maintenance', () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const named = CHARACTERISTICS.filter(({ name }) => FORBIDDEN_NAME_WORDS.some((word) => new characteristics[name]().displayName.includes(word)));

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

  test('starts the controller timestamp at the empty string rather than a time nothing reported', () => {
    // arrange
    const { ControllerDataLastTrustedAt } = createCustomCharacteristics(hapNamespace());

    // act
    const controllerDataLastTrustedAt = new ControllerDataLastTrustedAt();

    // assert
    assert.strictEqual(controllerDataLastTrustedAt.value, '');
  });

  test('gives two characteristics no shared permission array to mutate', () => {
    // arrange
    const { MainsPowerPresent, PumpRunning } = createCustomCharacteristics(hapNamespace());

    // act
    const perms = { mainsPower: new MainsPowerPresent().props.perms, pumpRunning: new PumpRunning().props.perms };

    // assert
    assert.notStrictEqual(perms.mainsPower, perms.pumpRunning);
  });
});
