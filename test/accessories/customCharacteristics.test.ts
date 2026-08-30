import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';

import type { API } from 'homebridge';

// Every type Apple assigns lives in one namespace. A plugin identifier ending with this suffix
// would sit inside Apple's assigned space, where a future Apple type could collide with it
// (SAFE-08).
const APPLE_BASE_UUID_SUFFIX = '-0000-1000-8000-0026BB765291';

// A random v4 identifier, written out here rather than derived, so a seed-derived identifier --
// which a later edit to the seed would silently change -- fails this shape (D-015).
const RANDOM_V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
function hapNamespace(): API['hap'] {
  return createFakeHap() as unknown as API['hap'];
}

describe('createCustomCharacteristics', () => {
  test('declares Mains Power Present as a read-only boolean', () => {
    // arrange
    const { MainsPowerPresent } = createCustomCharacteristics(hapNamespace());

    // act
    const mainsPowerPresent = new MainsPowerPresent();

    // assert
    assert.deepStrictEqual(
      { displayName: mainsPowerPresent.displayName, format: mainsPowerPresent.props.format, perms: mainsPowerPresent.props.perms },
      { displayName: 'Mains Power Present', format: 'bool', perms: ['pr', 'ev'] },
    );
  });

  test('grants no write permission of any kind', () => {
    // arrange
    const { MainsPowerPresent } = createCustomCharacteristics(hapNamespace());

    // act
    const perms: readonly string[] = new MainsPowerPresent().props.perms;

    // assert
    assert.deepStrictEqual(
      perms.filter((permission) => permission !== 'pr' && permission !== 'ev'),
      [],
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

  for (const name of ['MainsPowerPresent'] as const) {
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
});
