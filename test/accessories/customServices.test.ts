// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests the vendor-defined service declarations.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { asHapNamespace, createFakeHap } from '../../features/lib/hap.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
import { createCustomServices } from '../../src/accessories/customServices.js';

import type { CharacteristicClass } from '../../src/accessories/customCharacteristics.js';
import type { CustomServices } from '../../src/accessories/customServices.js';
import type { API, Service } from 'homebridge';

// Every type Apple assigns lives in one namespace. A plugin identifier ending with this suffix
// would sit inside Apple's assigned space, where a future Apple type could collide with it
// (SAFE-08).
const APPLE_BASE_UUID_SUFFIX = '-0000-1000-8000-0026BB765291';

// A random v4 identifier, written out here rather than derived, so a seed-derived identifier --
// which a later edit to the seed would silently change -- fails this shape (D-015).
const RANDOM_V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const STATUS_ACTIVE_NAME = 'Status Active';
const STATUS_FAULT_NAME = 'Status Fault';

// Apple's own name characteristic, which a controller shows a secondary service by and a user
// renames through. It is declared here for the reason the two status characteristics are: HAP warns
// on every restored accessory when a service receives a characteristic its definition never
// declared.
const CONFIGURED_NAME = 'Configured Name';

// Wi-Fi signal strength is module diagnostics rather than a basement-protection condition (D-016),
// and battery health is never represented through filter-maintenance semantics (D-021, SAFE-06).
const FORBIDDEN_NAME_WORDS: readonly string[] = ['Filter', 'Wi-Fi', 'WiFi', 'Signal', 'dBm'];

// The four characteristics carrying what the plugin observed about a pump rather than what the
// device reported, named as the plain keys they are published under (CTRL-01).
const RECORD_CHARACTERISTIC_NAMES: readonly string[] = [
  'ObservationStartedAt',
  'ObservedActivationCount',
  'LastObservedActivationAt',
  'LastActivationWasTestActivity',
];

/** One vendor-defined service and the characteristic sections it declares. */
interface ServiceExpectation {
  name: keyof CustomServices;
  displayName: string;
  subtype: string;
  uuid: string;
  required: readonly string[];
  optional: readonly string[];
}

// The whole declared set, in the order the factory answers it. `Name` leads every required list
// because a service constructed with a display name carries one, exactly as the real HAP does.
// Each identifier is copied by hand from the published declaration rather than imported, because a
// cached accessory finds its services by these exact strings: a swapped, regenerated, or per-start
// identifier must fail here (D-015).
const SERVICES: readonly ServiceExpectation[] = [
  {
    name: 'SumpPitService',
    displayName: 'Sump Pit Level',
    subtype: 'sump-pit-level',
    uuid: 'ed31d704-44c8-4f20-9de0-6f29b33ef607',
    required: ['Name', 'Water Level', 'Raw Water Level Code'],
    optional: ['Water Sensor Fault Reported', STATUS_ACTIVE_NAME, STATUS_FAULT_NAME, CONFIGURED_NAME],
  },
  {
    name: 'PumpService',
    displayName: 'Primary Pump',
    subtype: 'primary-pump',
    uuid: '523f059e-deaa-4674-bbb2-980f9f7da7ec',
    required: ['Name', 'Pump Running'],
    optional: [
      'Pump Fault',
      'Pump Fuse Blown',
      'Observation Start',
      'Activations Observed Since Observation Start',
      'Last Observed Activation At',
      'Last Activation Was Self-Test',
      STATUS_ACTIVE_NAME,
      STATUS_FAULT_NAME,
      CONFIGURED_NAME,
    ],
  },
  {
    name: 'SumpMainsPowerService',
    displayName: 'Sump Mains Power',
    subtype: 'sump-mains-power',
    uuid: 'fbb41424-0697-4ebe-ba89-7ba8ea254623',
    required: ['Name', 'Mains Power Present'],
    optional: [STATUS_ACTIVE_NAME, STATUS_FAULT_NAME, CONFIGURED_NAME],
  },
  {
    name: 'BackupBatteryService',
    displayName: 'Backup Battery',
    subtype: 'backup-battery',
    uuid: 'eb139c1e-aa1d-4318-bee9-60a338d99686',
    required: ['Name', 'Battery Charging', 'Battery Voltage Low', 'Battery Health Code', 'Protection Hours Code'],
    optional: [STATUS_ACTIVE_NAME, STATUS_FAULT_NAME, CONFIGURED_NAME],
  },
];

// The namespace stand-in, widened where the plugin takes the real namespace.
function hapNamespace(): API['hap'] {
  return asHapNamespace(createFakeHap());
}

/** A characteristic, as far as the name a controller shows it by. */
interface NamedCharacteristic {
  displayName: string;
}

/** A published service or characteristic type, as far as its identifier. */
interface PublishedType {
  readonly UUID: string;
}

function displayNamesOf(characteristics: readonly NamedCharacteristic[]): readonly string[] {
  return characteristics.map((characteristic) => characteristic.displayName);
}

function publishedTypesOf(types: Readonly<Record<string, PublishedType>>): readonly PublishedType[] {
  return Object.values(types);
}

function characteristicNamesOf(service: Service): readonly string[] {
  return [...displayNamesOf(service.characteristics), ...displayNamesOf(service.optionalCharacteristics)];
}

test('declares exactly the vendor-defined services this plugin publishes', () => {
  // arrange
  const services = createCustomServices(hapNamespace());

  // act
  const names = Object.keys(services);

  // assert
  assert.deepStrictEqual(
    names,
    SERVICES.map((expectation) => expectation.name),
  );
});

for (const { name, displayName, subtype, uuid, required, optional } of SERVICES) {
  test(`carries the exact vendor facts ${name} always reports as required characteristics`, () => {
    // arrange
    const services = createCustomServices(hapNamespace());

    // act
    const service = new services[name](displayName, subtype);

    // assert
    assert.deepStrictEqual(displayNamesOf(service.characteristics), required);
  });

  test(`declares the ${name}-specific facts, then the three shared characteristics, as optional`, () => {
    // arrange
    const services = createCustomServices(hapNamespace());

    // act
    const service = new services[name](displayName, subtype);

    // assert
    assert.deepStrictEqual(displayNamesOf(service.optionalCharacteristics), optional);
  });

  test(`keeps the display name and the subtype ${name} is constructed with`, () => {
    // arrange
    const services = createCustomServices(hapNamespace());

    // act
    const service = new services[name](displayName, subtype);

    // assert
    assert.deepStrictEqual({ displayName: service.displayName, subtype: service.subtype, uuid: service.UUID }, { displayName, subtype, uuid });
  });

  test(`identifies ${name} with a fixed v4 identifier outside Apple's namespace`, () => {
    // arrange
    const services = createCustomServices(hapNamespace());

    // act
    const typeUuid = services[name].UUID;

    // assert
    assert.deepStrictEqual(
      { typeUuid, shape: RANDOM_V4_UUID.test(typeUuid), appleNamespace: typeUuid.endsWith(APPLE_BASE_UUID_SUFFIX) },
      { typeUuid: uuid, shape: true, appleNamespace: false },
    );
  });

  test(`names no ${name} characteristic after diagnostics or filter maintenance`, () => {
    // arrange
    const services = createCustomServices(hapNamespace());

    // act
    const named = characteristicNamesOf(new services[name](displayName, subtype)).filter((characteristicName) =>
      FORBIDDEN_NAME_WORDS.some((word) => characteristicName.includes(word)),
    );

    // assert
    assert.deepStrictEqual(named, []);
  });
}

test('carries both pumps on one service class, each under its own subtype', () => {
  // arrange
  const hap = hapNamespace();
  const { PumpRunning, PumpFuseBlown } = createCustomCharacteristics(hap);
  const { PumpService } = createCustomServices(hap);

  // act
  const pumps = [new PumpService('Primary Pump', 'primary-pump'), new PumpService('Backup Pump', 'backup-pump')];

  // assert
  assert.deepStrictEqual(
    pumps.map((pump) => ({ subtype: pump.subtype, running: pump.testCharacteristic(PumpRunning), fuseBlown: pump.testCharacteristic(PumpFuseBlown) })),
    [
      { subtype: 'primary-pump', running: true, fuseBlown: false },
      { subtype: 'backup-pump', running: true, fuseBlown: false },
    ],
  );
});

// The record values come from the plugin's own observation rather than from the `pump` scope the
// row publishes from, so a record characteristic declared *required* would be constructed the
// moment the row published its pump boolean and left at HAP's format default -- presenting a
// count of zero and an empty observation start as fact (CTRL-01, D-009, SAFE-08).
test('declares every pump record optional, so none is constructed before a record writes it', () => {
  // arrange
  const hap = hapNamespace();
  const declared: Readonly<Record<string, CharacteristicClass>> = { ...createCustomCharacteristics(hap) };
  const { PumpService } = createCustomServices(hap);

  // act
  const pump = new PumpService('Backup Pump', 'backup-pump');

  // assert
  assert.deepStrictEqual(
    RECORD_CHARACTERISTIC_NAMES.map((key) => {
      const record = declared[key];

      return {
        key,
        constructed: record !== undefined && pump.testCharacteristic(record),
        declaredOptional: record !== undefined && pump.optionalCharacteristics.some((optional) => optional.UUID === record.UUID),
      };
    }),
    RECORD_CHARACTERISTIC_NAMES.map((key) => ({ key, constructed: false, declaredOptional: true })),
  );
});

test('identifies every vendor-defined service distinctly by its published identifier', () => {
  // arrange
  const services: Readonly<Record<string, { readonly UUID: string }>> = { ...createCustomServices(hapNamespace()) };

  // act
  const identifiers = new Map(Object.entries(services).map(([name, service]): [string, string] => [name, service.UUID]));

  // assert
  assert.deepStrictEqual(identifiers, new Map(SERVICES.map(({ name, uuid }): [string, string] => [name, uuid])));
});

// The table above pins the service identifiers, and the characteristic test pins its own. This case
// proves that no identifier repeats across the two factories.
test('gives every published type of either factory its own identifier', () => {
  // arrange
  const hap = hapNamespace();
  const published = publishedTypesOf({ ...createCustomCharacteristics(hap), ...createCustomServices(hap) });

  // act
  const repeated = published.map((publishedClass) => publishedClass.UUID).filter((identifier, index, identifiers) => identifiers.indexOf(identifier) !== index);

  // assert
  assert.deepStrictEqual(repeated, []);
});
