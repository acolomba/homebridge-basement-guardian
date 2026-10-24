// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests the vendor-defined characteristic declarations.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { asHapNamespace, createFakeHap } from '../../features/lib/hap.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';

import type { FakeCharacteristicProps, FakeHap } from '../../features/lib/hap.js';
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

// The value domain a declaration publishes. Every member is required, though most are undefined,
// because the case compares the domain as one whole value: a row that left a member out would not
// match the `undefined` member the characteristic's props answer.
interface DomainExpectation {
  minValue: number | undefined;
  maxValue: number | undefined;
  minStep: number | undefined;
  validValues: readonly number[] | undefined;
}

/** One vendor-defined characteristic and the identity a caller reads it under. */
interface CharacteristicExpectation {
  name: string;
  displayName: string;
  uuid: string;
  format: string;
  domain: DomainExpectation;
}

// The whole declared set, in the order the factory answers it. The format strings are written out
// rather than read off the namespace, so a declaration that changed format fails here. Each
// identifier is copied by hand from the published declaration rather than imported, because a
// cached accessory finds its characteristics by these exact strings: a swapped, regenerated, or
// per-start identifier must fail here (D-015).
//
// The three coded rows are bounded to the codes the vendor can legally send. Every other row
// declares no domain, written out member by member. HAP clamps a numeric update to `maxValue` and
// rounds it to `minStep`, so an added bound would quietly reshape a reported value; it fails here.
const CHARACTERISTICS: readonly CharacteristicExpectation[] = [
  {
    name: 'RawWaterLevelCode',
    displayName: 'Raw Water Level Code',
    uuid: 'f5c6e2da-7a4f-46c0-b02e-b501e90877cf',
    format: 'uint8',
    domain: { minValue: 0, maxValue: 31, minStep: 1, validValues: [0, 1, 3, 7, 15, 31] },
  },
  {
    name: 'PumpRunning',
    displayName: 'Pump Running',
    uuid: '5b3a4ee5-cb3f-4fd5-ab25-13c886fd0ad6',
    format: 'bool',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'PumpFault',
    displayName: 'Pump Fault',
    uuid: 'c4f90c81-f8a4-43b1-a12f-c3eba16f9bba',
    format: 'bool',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'PumpFuseBlown',
    displayName: 'Pump Fuse Blown',
    uuid: 'c33321c4-f8c8-4d85-ba22-16a2c282fec2',
    format: 'bool',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'WaterSensorFaultReported',
    displayName: 'Water Sensor Fault Reported',
    uuid: '1d73fac4-3921-42e3-8d90-69065ab9c959',
    format: 'bool',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'MainsPowerPresent',
    displayName: 'Mains Power Present',
    uuid: 'b014b110-41bb-4dec-a681-4a331455425e',
    format: 'bool',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'BatteryCharging',
    displayName: 'Battery Charging',
    uuid: 'bc8b71e7-bbce-4fd7-aa00-fcd451cb451f',
    format: 'bool',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'BatteryVoltageLow',
    displayName: 'Battery Voltage Low',
    uuid: '8278fb37-28fc-4550-a684-73000dcecf53',
    format: 'bool',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'BatteryHealthCode',
    displayName: 'Battery Health Code',
    uuid: '89ff0a75-adab-4ec2-9254-446681dd5fa2',
    format: 'uint8',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: [1, 2, 4, 8, 16, 32] },
  },
  {
    name: 'ProtectionHoursCode',
    displayName: 'Protection Hours Code',
    uuid: '72432447-f7ae-4d5e-b551-7da3538267d0',
    format: 'uint8',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: [1, 2, 4, 8] },
  },
  {
    name: 'ControllerLinkPresent',
    displayName: 'Controller Link Present',
    uuid: '39f9112e-cdad-41f5-9247-f5379b0d6c11',
    format: 'bool',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'ControllerDataLastTrustedAt',
    displayName: 'Controller Data Last Trusted At',
    uuid: 'd4d0209b-1472-4a39-8d1b-1c48d94efc7f',
    format: 'string',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'ObservationStartedAt',
    displayName: 'Observation Start',
    uuid: 'f36376db-47a7-4c59-a76f-6bdc234d5634',
    format: 'string',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'ObservedActivationCount',
    displayName: 'Activations Observed Since Observation Start',
    uuid: '88734156-8e55-4697-af69-68e9576d1352',
    format: 'uint32',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'LastObservedActivationAt',
    displayName: 'Last Observed Activation At',
    uuid: '39226a7e-0b92-4f41-b9a4-a602cdc8cca3',
    format: 'string',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
  {
    name: 'LastActivationWasTestActivity',
    displayName: 'Last Activation Was Self-Test',
    uuid: '217042ab-ad7e-481b-8e7e-2510e9ad74d9',
    format: 'bool',
    domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined },
  },
];

// The stand-in's base characteristic starts every value at its format default, but the real HAP
// base leaves `value` null, and each definition assigns its own default. So this namespace swaps
// in a base that leaves `value` null, as the real one does. A vendor characteristic that does not
// assign its own construction default then starts at null, and the "starts ..." cases fail.
function hapNamespace(): API['hap'] {
  const standIn = createFakeHap();

  class NullValueCharacteristic extends standIn.Characteristic {
    constructor(displayName: string, uuid: string, props: FakeCharacteristicProps) {
      super(displayName, uuid, props);

      this.value = null;
    }
  }

  const namespace: FakeHap = { ...standIn, Characteristic: NullValueCharacteristic };

  return asHapNamespace(namespace);
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

for (const { name, displayName, uuid, format, domain } of CHARACTERISTICS) {
  test(`declares ${name} as a read-only ${format} named ${displayName} with its exact value domain`, () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const characteristic = new (declaredAs(characteristics, name))();
    const { minValue, maxValue, minStep, validValues } = characteristic.props;

    // assert
    assert.deepStrictEqual(
      {
        displayName: characteristic.displayName,
        format: characteristic.props.format,
        perms: characteristic.props.perms,
        domain: { minValue, maxValue, minStep, validValues },
      },
      { displayName, format, perms: ['pr', 'ev'], domain },
    );
  });

  test(`identifies ${name} with a fixed v4 identifier outside Apple's namespace`, () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const declared = declaredAs(characteristics, name);
    const typeUuid = declared.UUID;
    const instanceUuid = new declared().UUID;

    // assert
    assert.deepStrictEqual(
      { typeUuid, instanceUuid, shape: RANDOM_V4_UUID.test(typeUuid), appleNamespace: typeUuid.endsWith(APPLE_BASE_UUID_SUFFIX) },
      { typeUuid: uuid, instanceUuid: uuid, shape: true, appleNamespace: false },
    );
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

test('identifies every vendor-defined characteristic distinctly by its published identifier', () => {
  // arrange
  const characteristics = createCustomCharacteristics(hapNamespace());

  // act
  const identifiers = new Map(Object.entries(declaredSet(characteristics)).map(([name, characteristic]): [string, string] => [name, characteristic.UUID]));

  // assert
  assert.deepStrictEqual(identifiers, new Map(CHARACTERISTICS.map(({ name, uuid }): [string, string] => [name, uuid])));
});

test('gives no vendor-defined characteristic a name drawn from diagnostics or filter maintenance', () => {
  // arrange
  const characteristics = createCustomCharacteristics(hapNamespace());

  // act
  const named = CHARACTERISTICS.filter(({ name }) => FORBIDDEN_NAME_WORDS.some((word) => new (declaredAs(characteristics, name))().displayName.includes(word)));

  // assert
  assert.deepStrictEqual(named, []);
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
for (const { name, initial } of [
  { name: 'RawWaterLevelCode', initial: 0 },
  { name: 'BatteryHealthCode', initial: 1 },
  { name: 'ProtectionHoursCode', initial: 1 },
]) {
  test(`starts ${name} at ${String(initial)}, a value its own validValues admits`, () => {
    // arrange
    const characteristics = createCustomCharacteristics(hapNamespace());

    // act
    const characteristic = new (declaredAs(characteristics, name))();
    const validValues: readonly number[] = characteristic.props.validValues ?? [];

    // assert
    assert.deepStrictEqual(
      { initial: characteristic.value, admitted: validValues.some((candidate) => candidate === characteristic.value) },
      { initial, admitted: true },
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
  const characteristics = createCustomCharacteristics(hapNamespace());

  // act
  const { format, maxValue, minStep } = new (declaredAs(characteristics, 'ObservedActivationCount'))().props;

  // assert
  assert.deepStrictEqual({ format, maxValue, minStep }, { format: 'uint32', maxValue: undefined, minStep: undefined });
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
