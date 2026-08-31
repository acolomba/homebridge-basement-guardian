import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
import { createCustomServices } from '../../src/accessories/customServices.js';

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

/** One vendor-defined service and the characteristic sections it declares. */
interface ServiceExpectation {
  name: keyof CustomServices;
  displayName: string;
  subtype: string;
  required: readonly string[];
  optional: readonly string[];
}

// The whole declared set, in the order the factory answers it. `Name` leads every required list
// because a service constructed with a display name carries one, exactly as the real HAP does.
const SERVICES: readonly ServiceExpectation[] = [
  {
    name: 'SumpPitService',
    displayName: 'Sump Pit Level',
    subtype: 'sump-pit-level',
    required: ['Name', 'Water Level', 'Raw Water Level Code'],
    optional: ['Water Sensor Fault Reported', STATUS_ACTIVE_NAME, STATUS_FAULT_NAME, CONFIGURED_NAME],
  },
  {
    name: 'PumpService',
    displayName: 'Primary Pump',
    subtype: 'primary-pump',
    required: ['Name', 'Pump Running'],
    optional: ['Pump Fault', 'Pump Fuse Blown', STATUS_ACTIVE_NAME, STATUS_FAULT_NAME, CONFIGURED_NAME],
  },
  {
    name: 'SumpMainsPowerService',
    displayName: 'Sump Mains Power',
    subtype: 'sump-mains-power',
    required: ['Name', 'Mains Power Present'],
    optional: [STATUS_ACTIVE_NAME, STATUS_FAULT_NAME, CONFIGURED_NAME],
  },
  {
    name: 'BackupBatteryService',
    displayName: 'Backup Battery Facts',
    subtype: 'backup-battery',
    required: ['Name', 'Battery Charging', 'Battery Voltage Low', 'Battery Health Code', 'Protection Hours Code'],
    optional: [STATUS_ACTIVE_NAME, STATUS_FAULT_NAME, CONFIGURED_NAME],
  },
];

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
function hapNamespace(): API['hap'] {
  return createFakeHap() as unknown as API['hap'];
}

function displayNamesOf(characteristics: readonly { displayName: string }[]): readonly string[] {
  return characteristics.map((characteristic) => characteristic.displayName);
}

function publishedTypesOf(types: Readonly<Record<string, { readonly UUID: string }>>): readonly { readonly UUID: string }[] {
  return Object.values(types);
}

function characteristicNamesOf(service: Service): readonly string[] {
  return [...displayNamesOf(service.characteristics), ...displayNamesOf(service.optionalCharacteristics)];
}

describe('createCustomServices', () => {
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

  for (const { name, displayName, subtype, required, optional } of SERVICES) {
    test(`carries the exact vendor facts ${name} always reports as required characteristics`, () => {
      // arrange
      const services = createCustomServices(hapNamespace());

      // act
      const service = new services[name](displayName, subtype);

      // assert
      assert.deepStrictEqual(displayNamesOf(service.characteristics), required);
    });

    test(`declares the characteristics only some ${name} subtypes carry as optional`, () => {
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
      assert.deepStrictEqual(
        { displayName: service.displayName, subtype: service.subtype, uuid: service.UUID },
        { displayName, subtype, uuid: services[name].UUID },
      );
    });

    test(`identifies ${name} with a fixed v4 identifier outside Apple's namespace`, () => {
      // arrange
      const services = createCustomServices(hapNamespace());

      // act
      const uuid = services[name].UUID;

      // assert
      assert.deepStrictEqual(
        { shape: RANDOM_V4_UUID.test(uuid), appleNamespace: uuid.endsWith(APPLE_BASE_UUID_SUFFIX) },
        { shape: true, appleNamespace: false },
      );
    });

    test(`answers the same ${name} identifier to every caller`, () => {
      // arrange
      const first = createCustomServices(hapNamespace());
      const second = createCustomServices(hapNamespace());

      // act & assert
      assert.strictEqual(first[name].UUID, second[name].UUID);
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

  test('gives every published type of either factory its own identifier', () => {
    // arrange
    const hap = hapNamespace();
    const published = publishedTypesOf({ ...createCustomCharacteristics(hap), ...createCustomServices(hap) });

    // act
    const uuids = new Set(published.map((publishedClass) => publishedClass.UUID));

    // assert
    assert.strictEqual(uuids.size, published.length);
  });
});
