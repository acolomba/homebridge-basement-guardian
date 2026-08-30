import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createCustomServices } from '../../src/accessories/customServices.js';

import type { API } from 'homebridge';

// Every type Apple assigns lives in one namespace. A plugin identifier ending with this suffix
// would sit inside Apple's assigned space, where a future Apple type could collide with it
// (SAFE-08).
const APPLE_BASE_UUID_SUFFIX = '-0000-1000-8000-0026BB765291';

// A random v4 identifier, written out here rather than derived, so a seed-derived identifier --
// which a later edit to the seed would silently change -- fails this shape (D-015).
const RANDOM_V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const MAINS_POWER_PRESENT_NAME = 'Mains Power Present';
const STATUS_ACTIVE_NAME = 'Status Active';
const STATUS_FAULT_NAME = 'Status Fault';

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
function hapNamespace(): API['hap'] {
  return createFakeHap() as unknown as API['hap'];
}

function displayNamesOf(characteristics: readonly { displayName: string }[]): readonly string[] {
  return characteristics.map((characteristic) => characteristic.displayName);
}

describe('createCustomServices', () => {
  test('carries the reported mains power fact as a required characteristic', () => {
    // arrange
    const { SumpMainsPowerService } = createCustomServices(hapNamespace());

    // act
    const sumpMainsPower = new SumpMainsPowerService('Sump Mains Power', 'sump-mains-power');

    // assert
    assert.deepStrictEqual(displayNamesOf(sumpMainsPower.characteristics), ['Name', MAINS_POWER_PRESENT_NAME]);
  });

  test('declares the two status characteristics the accessory pushes as optional', () => {
    // arrange
    const { SumpMainsPowerService } = createCustomServices(hapNamespace());

    // act
    const sumpMainsPower = new SumpMainsPowerService('Sump Mains Power', 'sump-mains-power');

    // assert
    assert.deepStrictEqual(displayNamesOf(sumpMainsPower.optionalCharacteristics), [STATUS_ACTIVE_NAME, STATUS_FAULT_NAME]);
  });

  test('keeps the display name and the subtype it is constructed with', () => {
    // arrange
    const { SumpMainsPowerService } = createCustomServices(hapNamespace());

    // act
    const sumpMainsPower = new SumpMainsPowerService('Sump Mains Power', 'sump-mains-power');

    // assert
    assert.deepStrictEqual(
      { displayName: sumpMainsPower.displayName, subtype: sumpMainsPower.subtype, uuid: sumpMainsPower.UUID },
      { displayName: 'Sump Mains Power', subtype: 'sump-mains-power', uuid: SumpMainsPowerService.UUID },
    );
  });

  for (const name of ['SumpMainsPowerService'] as const) {
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
  }
});
