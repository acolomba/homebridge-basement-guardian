import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createFakeAccessory } from '../../features/support/fakeHomebridgeApi.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
import { createServiceCatalogue, ensureService, isRowTrusted, publishValue, removeServiceIfPresent } from '../../src/accessories/serviceCatalogue.js';

import type { ProjectedValue, ProjectionInput, RowTrust, ServiceRow } from '../../src/accessories/serviceCatalogue.js';
import type { ServiceKind } from '../../src/accessories/services.js';
import type { API, CharacteristicValue, PlatformAccessory } from 'homebridge';

const ACCESSORY_NAME = 'Sump System';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';

// The contact states, written independently of the stand-in so a drifted convention fails here.
const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;
const NO_FAULT = 0;

void ({ scope: 'power', toleratedDistrust: [] } satisfies RowTrust);
// @ts-expect-error a row is judged by the scope it publishes from
void ({ toleratedDistrust: [] } satisfies RowTrust);
// @ts-expect-error a projected value names the characteristic that carries it
void ({ value: true } satisfies ProjectedValue);
// @ts-expect-error a projection reads the offline confirmation the accessory counted
void ({ decoded: {}, untrustedScopes: [], controllerDataLastTrustedAt: '' } satisfies ProjectionInput);

// The stand-ins answer the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets each stand where the plugin takes the real object.
function hapNamespace(): API['hap'] {
  return createFakeHap() as unknown as API['hap'];
}

function accessoryStandIn(): PlatformAccessory {
  return createFakeAccessory(ACCESSORY_NAME, ACCESSORY_UUID) as unknown as PlatformAccessory;
}

function projectionInput(overrides: Partial<ProjectionInput> = {}): ProjectionInput {
  return { decoded: { power: { mainsPresent: true } }, untrustedScopes: [], offlineConfirmed: false, controllerDataLastTrustedAt: '', ...overrides };
}

function rowOf(hap: API['hap'], kind: ServiceKind): ServiceRow {
  const row = createServiceCatalogue(hap).find((candidate) => candidate.kind === kind);

  if (row === undefined) {
    throw new Error(`the catalogue publishes no ${kind} row`);
  }

  return row;
}

// A projected value is compared by the identity of the characteristic that carries it, because the
// custom characteristic classes are built per call while their identifier is the published fact.
function summarise(values: readonly ProjectedValue[]): readonly { uuid: string; value: CharacteristicValue }[] {
  return values.map((projected) => ({ uuid: projected.characteristic.UUID, value: projected.value }));
}

describe('createServiceCatalogue', () => {
  test('publishes three rows whose subtype is the kind slug verbatim', () => {
    // arrange
    const catalogue = createServiceCatalogue(hapNamespace());

    // act
    const identities = catalogue.map((row) => ({ kind: row.kind, subtype: row.subtype }));

    // assert
    assert.deepStrictEqual(identities, [
      { kind: 'sump-mains-power', subtype: 'sump-mains-power' },
      { kind: 'mains-power-lost', subtype: 'mains-power-lost' },
      { kind: 'basement-guardian-offline', subtype: 'basement-guardian-offline' },
    ]);
  });

  test('names each row and scopes it to the state it reads', () => {
    // arrange
    const catalogue = createServiceCatalogue(hapNamespace());

    // act
    const rows = catalogue.map((row) => ({ displayName: row.displayName, scope: row.scope, toleratedDistrust: row.toleratedDistrust }));

    // assert
    assert.deepStrictEqual(rows, [
      { displayName: 'Sump Mains Power', scope: 'power', toleratedDistrust: [] },
      { displayName: 'Mains Power Lost', scope: 'power', toleratedDistrust: [] },
      { displayName: 'Basement Guardian Offline', scope: 'connectivity', toleratedDistrust: [] },
    ]);
  });

  test('publishes the mains power service under its own type and the two adapters under the contact sensor', () => {
    // arrange
    const hap = hapNamespace();
    const catalogue = createServiceCatalogue(hap);

    // act
    const uuids = catalogue.map((row) => row.serviceClass.UUID);

    // assert
    assert.deepStrictEqual(uuids.slice(1), [hap.Service.ContactSensor.UUID, hap.Service.ContactSensor.UUID]);
    assert.notStrictEqual(uuids[0], hap.Service.ContactSensor.UUID);
  });

  for (const mainsPresent of [true, false]) {
    test(`projects the reported ac_power ${String(mainsPresent)} verbatim onto Mains Power Present`, () => {
      // arrange
      const hap = hapNamespace();
      const { MainsPowerPresent } = createCustomCharacteristics(hap);
      const row = rowOf(hap, 'sump-mains-power');

      // act
      const projected = row.project(projectionInput({ decoded: { power: { mainsPresent } } }));

      // assert
      assert.deepStrictEqual(summarise(projected), [{ uuid: MainsPowerPresent.UUID, value: mainsPresent }]);
    });

    test(`activates Mains Power Lost only when ac_power is false, given ${String(mainsPresent)}`, () => {
      // arrange
      const hap = hapNamespace();
      const row = rowOf(hap, 'mains-power-lost');

      // act
      const projected = row.project(projectionInput({ decoded: { power: { mainsPresent } } }));

      // assert
      assert.deepStrictEqual(summarise(projected), [
        { uuid: hap.Characteristic.ContactSensorState.UUID, value: mainsPresent ? CONTACT_DETECTED : CONTACT_NOT_DETECTED },
        { uuid: hap.Characteristic.StatusFault.UUID, value: NO_FAULT },
      ]);
    });
  }

  for (const offlineConfirmed of [true, false]) {
    test(`activates Basement Guardian Offline from a confirmed offline run of ${String(offlineConfirmed)}`, () => {
      // arrange
      const hap = hapNamespace();
      const row = rowOf(hap, 'basement-guardian-offline');

      // act
      const projected = row.project(projectionInput({ offlineConfirmed }));

      // assert
      assert.deepStrictEqual(summarise(projected), [
        { uuid: hap.Characteristic.ContactSensorState.UUID, value: offlineConfirmed ? CONTACT_NOT_DETECTED : CONTACT_DETECTED },
      ]);
    });
  }

  for (const { label, decoded } of [
    { label: 'a decoded state that is not a record', decoded: null },
    { label: 'a decoded state that is an array', decoded: [] },
    { label: 'a decoded state carrying no power group', decoded: {} },
    { label: 'a power group that did not decode', decoded: { power: undefined } },
    { label: 'a power group that is not a record', decoded: { power: 'absent' } },
    { label: 'a power group carrying no mains fact', decoded: { power: {} } },
    { label: 'a mains fact of the wrong type', decoded: { power: { mainsPresent: 'yes' } } },
  ]) {
    test(`projects nothing on either power row from ${label}`, () => {
      // arrange
      const hap = hapNamespace();
      const input = projectionInput({ decoded });

      // act
      const projected = [rowOf(hap, 'sump-mains-power').project(input), rowOf(hap, 'mains-power-lost').project(input)];

      // assert
      assert.deepStrictEqual(projected, [[], []]);
    });
  }

  test('projects nothing on a power row whose own scope is untrusted', () => {
    // arrange
    const hap = hapNamespace();
    const input = projectionInput({ untrustedScopes: [{ scope: 'power', reason: 'invalid', lastTrustedAt: undefined }] });

    // act
    const projected = [rowOf(hap, 'sump-mains-power').project(input), rowOf(hap, 'mains-power-lost').project(input)];

    // assert
    assert.deepStrictEqual(projected, [[], []]);
  });

  test('keeps projecting the offline adapter while an unrelated scope is untrusted', () => {
    // arrange
    const hap = hapNamespace();
    const input = projectionInput({ untrustedScopes: [{ scope: 'power', reason: 'invalid', lastTrustedAt: undefined }], offlineConfirmed: true });

    // act
    const projected = rowOf(hap, 'basement-guardian-offline').project(input);

    // assert
    assert.deepStrictEqual(summarise(projected), [{ uuid: hap.Characteristic.ContactSensorState.UUID, value: CONTACT_NOT_DETECTED }]);
  });
});

describe('isRowTrusted', () => {
  test('trusts a row whose scope carries no distrust at all', () => {
    // act & assert
    assert.strictEqual(isRowTrusted({ scope: 'power', toleratedDistrust: [] }, []), true);
  });

  test('trusts a row through the one distrust reason it tolerates, and still projects its values', () => {
    // arrange
    const hap = hapNamespace();
    const { MainsPowerPresent } = createCustomCharacteristics(hap);
    const row: ServiceRow = { ...rowOf(hap, 'sump-mains-power'), toleratedDistrust: ['controller-link-lost'] };
    const input = projectionInput({ untrustedScopes: [{ scope: 'power', reason: 'controller-link-lost', lastTrustedAt: 7 }] });

    // act
    const trusted = isRowTrusted(row, input.untrustedScopes);

    // assert
    assert.strictEqual(trusted, true);
    assert.deepStrictEqual(summarise(row.project(input)), [{ uuid: MainsPowerPresent.UUID, value: true }]);
  });

  test('distrusts the same row for a reason it does not tolerate, and projects nothing', () => {
    // arrange
    const hap = hapNamespace();
    const row: ServiceRow = { ...rowOf(hap, 'sump-mains-power'), toleratedDistrust: ['controller-link-lost'] };
    const input = projectionInput({ untrustedScopes: [{ scope: 'power', reason: 'stale', lastTrustedAt: 7 }] });

    // act
    const trusted = isRowTrusted(row, input.untrustedScopes);

    // assert
    assert.strictEqual(trusted, false);
    assert.deepStrictEqual(row.project(input), []);
  });

  test('trusts a row while a different scope is untrusted', () => {
    // act & assert
    assert.strictEqual(isRowTrusted({ scope: 'connectivity', toleratedDistrust: [] }, [{ scope: 'power', reason: 'invalid', lastTrustedAt: 1 }]), true);
  });
});

describe('ensureService', () => {
  test('adds the service under the row display name and subtype on first use', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowOf(hap, 'mains-power-lost');

    // act
    const service = ensureService(accessory, row);

    // assert
    assert.deepStrictEqual(
      { displayName: service.displayName, subtype: service.subtype, uuid: service.UUID },
      {
        displayName: 'Mains Power Lost',
        subtype: 'mains-power-lost',
        uuid: hap.Service.ContactSensor.UUID,
      },
    );
  });

  test('answers the same service on a second call rather than adding a duplicate', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowOf(hap, 'mains-power-lost');
    const first = ensureService(accessory, row);

    // act
    const second = ensureService(accessory, row);

    // assert
    assert.strictEqual(second, first);
  });

  test('keeps two rows of one service type apart by their subtypes', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();

    // act
    const mainsPowerLost = ensureService(accessory, rowOf(hap, 'mains-power-lost'));
    const offline = ensureService(accessory, rowOf(hap, 'basement-guardian-offline'));

    // assert
    assert.deepStrictEqual([mainsPowerLost.subtype, offline.subtype], ['mains-power-lost', 'basement-guardian-offline']);
  });

  test('leaves a freshly added service at its construction defaults, with no value pushed', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowOf(hap, 'sump-mains-power');

    // act
    const service = ensureService(accessory, row);

    // assert
    assert.deepStrictEqual(
      {
        statusActivePushed: service.testCharacteristic(hap.Characteristic.StatusActive),
        declaredStatusActive: service.optionalCharacteristics.find((declared) => declared.UUID === hap.Characteristic.StatusActive.UUID)?.value,
      },
      { statusActivePushed: false, declaredStatusActive: false },
    );
  });
});

describe('removeServiceIfPresent', () => {
  test('reports no removal when the accessory never carried the service', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();

    // act
    const removed = removeServiceIfPresent(accessory, rowOf(hap, 'mains-power-lost'));

    // assert
    assert.strictEqual(removed, false);
  });

  test('removes only the row it is given and leaves every sibling published', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const mainsPowerLost = rowOf(hap, 'mains-power-lost');
    const offline = rowOf(hap, 'basement-guardian-offline');
    ensureService(accessory, mainsPowerLost);
    ensureService(accessory, offline);

    // act
    const removed = removeServiceIfPresent(accessory, mainsPowerLost);

    // assert
    assert.deepStrictEqual(
      {
        removed,
        mainsPowerLost: accessory.getServiceById(mainsPowerLost.serviceClass, mainsPowerLost.subtype),
        offline: accessory.getServiceById(offline.serviceClass, offline.subtype)?.displayName,
        accessoryInformation: accessory.getService(hap.Service.AccessoryInformation)?.UUID,
      },
      { removed: true, mainsPowerLost: undefined, offline: 'Basement Guardian Offline', accessoryInformation: hap.Service.AccessoryInformation.UUID },
    );
  });
});

describe('publishValue', () => {
  test('declares an undeclared characteristic once and pushes the value', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const service = ensureService(accessory, rowOf(hap, 'mains-power-lost'));

    // act
    publishValue(service, hap.Characteristic.StatusActive, true);

    // assert
    assert.deepStrictEqual(
      {
        value: service.getCharacteristic(hap.Characteristic.StatusActive).value,
        declared: service.optionalCharacteristics.filter((declared) => declared.UUID === hap.Characteristic.StatusActive.UUID).length,
      },
      { value: true, declared: 1 },
    );
  });

  test('declares the characteristic no second time across repeated pushes', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const service = ensureService(accessory, rowOf(hap, 'mains-power-lost'));
    publishValue(service, hap.Characteristic.StatusActive, true);

    // act
    publishValue(service, hap.Characteristic.StatusActive, false);

    // assert
    assert.deepStrictEqual(
      {
        value: service.getCharacteristic(hap.Characteristic.StatusActive).value,
        declared: service.optionalCharacteristics.filter((declared) => declared.UUID === hap.Characteristic.StatusActive.UUID).length,
      },
      { value: false, declared: 1 },
    );
  });

  test('declares no characteristic the service already declares', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const service = ensureService(accessory, rowOf(hap, 'sump-mains-power'));

    // act
    publishValue(service, hap.Characteristic.StatusActive, true);

    // assert
    assert.strictEqual(service.optionalCharacteristics.filter((declared) => declared.UUID === hap.Characteristic.StatusActive.UUID).length, 1);
  });

  test('pushes onto a characteristic the service already carries without declaring it optional', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const service = ensureService(accessory, rowOf(hap, 'mains-power-lost'));

    // act
    publishValue(service, hap.Characteristic.ContactSensorState, CONTACT_NOT_DETECTED);

    // assert
    assert.deepStrictEqual(
      {
        value: service.getCharacteristic(hap.Characteristic.ContactSensorState).value,
        declared: service.optionalCharacteristics.length,
      },
      { value: CONTACT_NOT_DETECTED, declared: 0 },
    );
  });
});
