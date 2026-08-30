import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createFakeAccessory } from '../../features/support/fakeHomebridgeApi.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
import { createCustomServices } from '../../src/accessories/customServices.js';
import { createServiceCatalogue, ensureService, isRowTrusted, publishValue, removeServiceIfPresent } from '../../src/accessories/serviceCatalogue.js';

import type { ProjectedValue, ProjectionInput, RowTrust, ServiceRow } from '../../src/accessories/serviceCatalogue.js';
import type { ServiceKind } from '../../src/accessories/services.js';
import type { API, CharacteristicValue, PlatformAccessory } from 'homebridge';

const ACCESSORY_NAME = 'Sump System';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';

// The standard values, written independently of the stand-in so a drifted convention fails here.
const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;
const LEAK_NOT_DETECTED = 0;
const LEAK_DETECTED = 1;
const NO_FAULT = 0;
const GENERAL_FAULT = 1;

/** One legal water-level code, the percentage it publishes, and the flood verdict it carries. */
interface WaterRung {
  levelCode: number;
  levelPercent: number;
  flooded: boolean;
  leak: number;
}

// The whole provisional ladder, written out here rather than read from the family, so a changed
// rung fails at the publication boundary as well as behind it (D-01, D-03).
const WATER_LADDER: readonly WaterRung[] = [
  { levelCode: 0, levelPercent: 0, flooded: false, leak: LEAK_NOT_DETECTED },
  { levelCode: 1, levelPercent: 20, flooded: false, leak: LEAK_NOT_DETECTED },
  { levelCode: 3, levelPercent: 40, flooded: false, leak: LEAK_NOT_DETECTED },
  { levelCode: 7, levelPercent: 60, flooded: false, leak: LEAK_NOT_DETECTED },
  { levelCode: 15, levelPercent: 80, flooded: false, leak: LEAK_NOT_DETECTED },
  { levelCode: 31, levelPercent: 100, flooded: true, leak: LEAK_DETECTED },
];

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

// One fully decoded snapshot, in the family-neutral shape every adapter answers. A case overrides
// only the group it is about, so an unrelated group never silently withholds a value.
function decodedState(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    water: { levelCode: 1, levelPercent: 20, flooded: false },
    pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined, testRunning: false },
    power: { mainsPresent: true },
    fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
    connectivity: { reportedOffline: false },
    ...overrides,
  };
}

function projectionInput(overrides: Partial<ProjectionInput> = {}): ProjectionInput {
  return { decoded: decodedState(), untrustedScopes: [], offlineConfirmed: false, controllerDataLastTrustedAt: '', ...overrides };
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

function valueOf(values: readonly ProjectedValue[], characteristic: { UUID: string }): CharacteristicValue | undefined {
  return values.find((projected) => projected.characteristic.UUID === characteristic.UUID)?.value;
}

// The module is read as text rather than imported, because the assertion is about what it does not
// import; the name is interpolated so the path is a runtime value rather than a static import.
async function sourceOf(module: string): Promise<string> {
  return readFile(new URL(`../../../src/accessories/${module}`, import.meta.url), 'utf8');
}

describe('createServiceCatalogue', () => {
  test('publishes every row under a subtype that is its kind slug verbatim', () => {
    // arrange
    const catalogue = createServiceCatalogue(hapNamespace());

    // act
    const identities = catalogue.map((row) => ({ kind: row.kind, subtype: row.subtype }));

    // assert
    assert.deepStrictEqual(identities, [
      { kind: 'sump-pit-flood', subtype: 'sump-pit-flood' },
      { kind: 'sump-pit-level', subtype: 'sump-pit-level' },
      { kind: 'primary-pump', subtype: 'primary-pump' },
      { kind: 'primary-pump-running', subtype: 'primary-pump-running' },
      { kind: 'backup-pump', subtype: 'backup-pump' },
      { kind: 'backup-pump-activated', subtype: 'backup-pump-activated' },
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
      { displayName: 'Sump Pit Flood', scope: 'water', toleratedDistrust: [] },
      { displayName: 'Sump Pit Level', scope: 'water', toleratedDistrust: [] },
      { displayName: 'Primary Pump', scope: 'pump', toleratedDistrust: [] },
      { displayName: 'Primary Pump Running', scope: 'pump', toleratedDistrust: [] },
      { displayName: 'Backup Pump', scope: 'pump', toleratedDistrust: [] },
      { displayName: 'Backup Pump Activated', scope: 'pump', toleratedDistrust: [] },
      { displayName: 'Sump Mains Power', scope: 'power', toleratedDistrust: [] },
      { displayName: 'Mains Power Lost', scope: 'power', toleratedDistrust: [] },
      { displayName: 'Basement Guardian Offline', scope: 'connectivity', toleratedDistrust: [] },
    ]);
  });

  test('publishes each row on the service type its meaning requires', () => {
    // arrange
    const hap = hapNamespace();
    const services = createCustomServices(hap);
    const catalogue = createServiceCatalogue(hap);

    // act
    const types = catalogue.map((row) => row.serviceClass.UUID);

    // assert
    assert.deepStrictEqual(types, [
      hap.Service.LeakSensor.UUID,
      services.SumpPitService.UUID,
      services.PumpService.UUID,
      hap.Service.ContactSensor.UUID,
      services.PumpService.UUID,
      hap.Service.ContactSensor.UUID,
      services.SumpMainsPowerService.UUID,
      hap.Service.ContactSensor.UUID,
      hap.Service.ContactSensor.UUID,
    ]);
  });

  test('answers the same row order whatever the input carries', () => {
    // arrange
    const hap = hapNamespace();
    const catalogue = createServiceCatalogue(hap);
    const input = projectionInput({ decoded: {}, untrustedScopes: [{ scope: 'water', reason: 'invalid', lastTrustedAt: 1 }], offlineConfirmed: true });

    // act
    const kinds = catalogue.map((row) => {
      row.project(input);

      return row.kind;
    });

    // assert
    assert.deepStrictEqual(
      kinds,
      createServiceCatalogue(hap).map((row) => row.kind),
    );
  });

  test('projects the same values twice from one input', () => {
    // arrange
    const hap = hapNamespace();
    const catalogue = createServiceCatalogue(hap);
    const input = projectionInput();

    // act
    const projected = catalogue.map((row) => summarise(row.project(input)));

    // assert
    assert.deepStrictEqual(
      projected,
      catalogue.map((row) => summarise(row.project(input))),
    );
  });

  for (const { levelCode, levelPercent, flooded, leak } of WATER_LADDER) {
    test(`publishes water level code ${String(levelCode)} as ${String(levelPercent)} per cent beside the raw code`, () => {
      // arrange
      const hap = hapNamespace();
      const { RawWaterLevelCode, WaterSensorFaultReported } = createCustomCharacteristics(hap);
      const row = rowOf(hap, 'sump-pit-level');

      // act
      const projected = row.project(projectionInput({ decoded: decodedState({ water: { levelCode, levelPercent, flooded } }) }));

      // assert
      assert.deepStrictEqual(summarise(projected), [
        { uuid: hap.Characteristic.WaterLevel.UUID, value: levelPercent },
        { uuid: RawWaterLevelCode.UUID, value: levelCode },
        { uuid: WaterSensorFaultReported.UUID, value: false },
        { uuid: hap.Characteristic.StatusFault.UUID, value: NO_FAULT },
      ]);
    });

    test(`reports the flood sensor as ${String(leak)} at water level code ${String(levelCode)}`, () => {
      // arrange
      const hap = hapNamespace();
      const row = rowOf(hap, 'sump-pit-flood');

      // act
      const projected = row.project(projectionInput({ decoded: decodedState({ water: { levelCode, levelPercent, flooded } }) }));

      // assert
      assert.deepStrictEqual(summarise(projected), [{ uuid: hap.Characteristic.LeakDetected.UUID, value: leak }]);
    });

    test(`publishes an integer water level for code ${String(levelCode)}`, () => {
      // arrange
      const hap = hapNamespace();
      const row = rowOf(hap, 'sump-pit-level');

      // act
      const projected = row.project(projectionInput({ decoded: decodedState({ water: { levelCode, levelPercent, flooded } }) }));

      // assert
      assert.strictEqual(Number.isInteger(valueOf(projected, hap.Characteristic.WaterLevel)), true);
    });
  }

  test('reports a flooding pit at exactly one legal water level code', () => {
    // arrange
    const hap = hapNamespace();
    const row = rowOf(hap, 'sump-pit-flood');

    // act
    const flooding = WATER_LADDER.filter(({ levelCode, levelPercent, flooded }) => {
      const projected = row.project(projectionInput({ decoded: decodedState({ water: { levelCode, levelPercent, flooded } }) }));

      return valueOf(projected, hap.Characteristic.LeakDetected) === LEAK_DETECTED;
    });

    // assert
    assert.deepStrictEqual(
      flooding.map(({ levelCode }) => levelCode),
      [31],
    );
  });

  test('keeps publishing a trustworthy water level while the fault scope is untrusted', () => {
    // arrange
    const hap = hapNamespace();
    const { RawWaterLevelCode } = createCustomCharacteristics(hap);
    const row = rowOf(hap, 'sump-pit-level');
    const input = projectionInput({ untrustedScopes: [{ scope: 'fault', reason: 'invalid', lastTrustedAt: 7 }] });

    // act
    const projected = row.project(input);

    // assert
    assert.deepStrictEqual(summarise(projected), [
      { uuid: hap.Characteristic.WaterLevel.UUID, value: 20 },
      { uuid: RawWaterLevelCode.UUID, value: 1 },
    ]);
  });

  for (const waterSensorFault of [true, false]) {
    test(`faults the pit level service from a reported water sensor fault of ${String(waterSensorFault)}`, () => {
      // arrange
      const hap = hapNamespace();
      const { WaterSensorFaultReported } = createCustomCharacteristics(hap);
      const decoded = decodedState({ fault: { waterSensorFault } });
      const row = rowOf(hap, 'sump-pit-level');

      // act
      const projected = row.project(projectionInput({ decoded }));

      // assert
      assert.deepStrictEqual(
        {
          reported: valueOf(projected, WaterSensorFaultReported),
          fault: valueOf(projected, hap.Characteristic.StatusFault),
        },
        { reported: waterSensorFault, fault: waterSensorFault ? GENERAL_FAULT : NO_FAULT },
      );
    });
  }

  for (const primaryRunning of [true, false]) {
    test(`publishes the reported primary pump running state of ${String(primaryRunning)} on both primary rows`, () => {
      // arrange
      const hap = hapNamespace();
      const { PumpRunning } = createCustomCharacteristics(hap);
      const input = projectionInput({ decoded: decodedState({ pump: { primaryRunning, backupRunning: false } }) });

      // act
      const projected = { pump: rowOf(hap, 'primary-pump').project(input), adapter: rowOf(hap, 'primary-pump-running').project(input) };

      // assert
      assert.deepStrictEqual(
        {
          running: valueOf(projected.pump, PumpRunning),
          adapter: valueOf(projected.adapter, hap.Characteristic.ContactSensorState),
        },
        { running: primaryRunning, adapter: primaryRunning ? CONTACT_NOT_DETECTED : CONTACT_DETECTED },
      );
    });
  }

  for (const primaryPumpFault of [true, false]) {
    test(`faults the primary pump service from a reported primary pump fault of ${String(primaryPumpFault)}`, () => {
      // arrange
      const hap = hapNamespace();
      const { PumpFault, PumpFuseBlown } = createCustomCharacteristics(hap);
      const input = projectionInput({ decoded: decodedState({ fault: { primaryPumpFault } }) });

      // act
      const projected = rowOf(hap, 'primary-pump').project(input);

      // assert
      assert.deepStrictEqual(
        {
          fault: valueOf(projected, PumpFault),
          fuseBlown: valueOf(projected, PumpFuseBlown),
          status: valueOf(projected, hap.Characteristic.StatusFault),
        },
        { fault: primaryPumpFault, fuseBlown: undefined, status: primaryPumpFault ? GENERAL_FAULT : NO_FAULT },
      );
    });
  }

  for (const { backupPumpFault, backupPumpFuseBlown, status } of [
    { backupPumpFault: false, backupPumpFuseBlown: false, status: NO_FAULT },
    { backupPumpFault: true, backupPumpFuseBlown: false, status: GENERAL_FAULT },
    { backupPumpFault: false, backupPumpFuseBlown: true, status: GENERAL_FAULT },
    { backupPumpFault: true, backupPumpFuseBlown: true, status: GENERAL_FAULT },
  ]) {
    test(`keeps a backup pump fault of ${String(backupPumpFault)} and a fuse of ${String(backupPumpFuseBlown)} separately readable`, () => {
      // arrange
      const hap = hapNamespace();
      const { PumpFault, PumpFuseBlown } = createCustomCharacteristics(hap);
      const input = projectionInput({ decoded: decodedState({ fault: { backupPumpFault, backupPumpFuseBlown } }) });

      // act
      const projected = rowOf(hap, 'backup-pump').project(input);

      // assert
      assert.deepStrictEqual(
        {
          fault: valueOf(projected, PumpFault),
          fuseBlown: valueOf(projected, PumpFuseBlown),
          status: valueOf(projected, hap.Characteristic.StatusFault),
        },
        { fault: backupPumpFault, fuseBlown: backupPumpFuseBlown, status },
      );
    });
  }

  test('publishes no merged backup pump verdict while the fuse fact is missing', () => {
    // arrange
    const hap = hapNamespace();
    const { PumpFault } = createCustomCharacteristics(hap);
    const input = projectionInput({ decoded: decodedState({ fault: { backupPumpFault: true } }) });

    // act
    const projected = rowOf(hap, 'backup-pump').project(input);

    // assert
    assert.deepStrictEqual(
      { fault: valueOf(projected, PumpFault), status: valueOf(projected, hap.Characteristic.StatusFault) },
      { fault: true, status: undefined },
    );
  });

  for (const testRunning of [true, false]) {
    test(`activates the backup pump adapter during a self-test run of ${String(testRunning)}`, () => {
      // arrange
      const hap = hapNamespace();
      const input = projectionInput({ decoded: decodedState({ pump: { primaryRunning: false, backupRunning: true, testRunning } }) });

      // act
      const projected = rowOf(hap, 'backup-pump-activated').project(input);

      // assert
      assert.deepStrictEqual(summarise(projected), [{ uuid: hap.Characteristic.ContactSensorState.UUID, value: CONTACT_NOT_DETECTED }]);
    });
  }

  for (const backupActivatedAt of [1_700_000_000_000, undefined]) {
    test(`activates the backup pump adapter with a reported activation time of ${String(backupActivatedAt)}`, () => {
      // arrange
      const hap = hapNamespace();
      const input = projectionInput({ decoded: decodedState({ pump: { primaryRunning: false, backupRunning: true, backupActivatedAt } }) });

      // act
      const projected = rowOf(hap, 'backup-pump-activated').project(input);

      // assert
      assert.deepStrictEqual(summarise(projected), [{ uuid: hap.Characteristic.ContactSensorState.UUID, value: CONTACT_NOT_DETECTED }]);
    });
  }

  test('leaves the backup pump adapter quiet while every other condition is active', () => {
    // arrange
    const hap = hapNamespace();
    const decoded = decodedState({
      pump: { primaryRunning: true, backupRunning: false },
      power: { mainsPresent: false },
      fault: { primaryPumpFault: true, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: true, controllerLinkPresent: true },
    });

    // act
    const projected = rowOf(hap, 'backup-pump-activated').project(projectionInput({ decoded, offlineConfirmed: true }));

    // assert
    assert.deepStrictEqual(summarise(projected), [{ uuid: hap.Characteristic.ContactSensorState.UUID, value: CONTACT_DETECTED }]);
  });

  for (const mainsPresent of [true, false]) {
    test(`projects the reported ac_power ${String(mainsPresent)} verbatim onto Mains Power Present`, () => {
      // arrange
      const hap = hapNamespace();
      const { MainsPowerPresent } = createCustomCharacteristics(hap);
      const row = rowOf(hap, 'sump-mains-power');

      // act
      const projected = row.project(projectionInput({ decoded: decodedState({ power: { mainsPresent } }) }));

      // assert
      assert.deepStrictEqual(summarise(projected), [{ uuid: MainsPowerPresent.UUID, value: mainsPresent }]);
    });

    test(`activates Mains Power Lost only when ac_power is false, given ${String(mainsPresent)}`, () => {
      // arrange
      const hap = hapNamespace();
      const row = rowOf(hap, 'mains-power-lost');

      // act
      const projected = row.project(projectionInput({ decoded: decodedState({ power: { mainsPresent } }) }));

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
    { label: 'a decoded state carrying no group at all', decoded: {} },
    { label: 'a group that did not decode', decoded: { water: undefined, pump: undefined, power: undefined, fault: undefined } },
    { label: 'a group that is not a record', decoded: { water: 'absent', pump: 'absent', power: 'absent', fault: 'absent' } },
    { label: 'a group carrying none of its facts', decoded: { water: {}, pump: {}, power: {}, fault: {} } },
    {
      label: 'facts of the wrong type',
      decoded: { water: { levelCode: '1', levelPercent: '20', flooded: 'no' }, pump: { primaryRunning: 'yes' }, power: { mainsPresent: 'yes' } },
    },
  ]) {
    test(`projects nothing on any decoded-state row from ${label}`, () => {
      // arrange
      const hap = hapNamespace();
      const input = projectionInput({ decoded });

      // act
      const projected = createServiceCatalogue(hap)
        .filter((row) => row.kind !== 'basement-guardian-offline')
        .map((row) => row.project(input));

      // assert
      assert.deepStrictEqual(projected, [[], [], [], [], [], [], [], []]);
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

  test('reads the water level meaning from decoded state rather than from the level ladder', async () => {
    // act
    const source = await sourceOf('serviceCatalogue.ts');

    // assert
    assert.strictEqual(source.includes('waterLevel.js'), false);
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

  test('keeps both pumps apart on one custom service class', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();

    // act
    const pumps = [ensureService(accessory, rowOf(hap, 'primary-pump')), ensureService(accessory, rowOf(hap, 'backup-pump'))];

    // assert
    assert.deepStrictEqual(
      pumps.map((pump) => ({ displayName: pump.displayName, subtype: pump.subtype })),
      [
        { displayName: 'Primary Pump', subtype: 'primary-pump' },
        { displayName: 'Backup Pump', subtype: 'backup-pump' },
      ],
    );
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
