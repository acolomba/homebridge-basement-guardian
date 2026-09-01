import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';
import { isDeepStrictEqual } from 'node:util';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createFakeAccessory } from '../../features/support/fakeHomebridgeApi.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
import { createCustomServices } from '../../src/accessories/customServices.js';
import {
  booleanOf,
  createServiceCatalogue,
  decodedGroup,
  ensureService,
  isRowFullyTrusted,
  isRowTrusted,
  numberOf,
  publishedService,
  publishValue,
  removeServiceIfPresent,
  seedConfiguredName,
} from '../../src/accessories/serviceCatalogue.js';

import type { ProjectedValue, ProjectionInput, RowTrust, ServiceRow } from '../../src/accessories/serviceCatalogue.js';
import type { ServiceKind } from '../../src/accessories/services.js';
import type { DeviceCapability } from '../../src/device/family.js';
import type { TrustScope } from '../../src/device/health.js';
import type { API, CharacteristicValue, PlatformAccessory, Service } from 'homebridge';

const ACCESSORY_NAME = 'Sump System';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';

// The standard values, written independently of the stand-in so a drifted convention fails here.
const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;
const LEAK_NOT_DETECTED = 0;
const LEAK_DETECTED = 1;
const NO_FAULT = 0;
const GENERAL_FAULT = 1;
const BATTERY_LEVEL_NORMAL = 0;
const BATTERY_LEVEL_LOW = 1;
const NOT_CHARGING = 0;
const CHARGING = 1;
const NOT_CHARGEABLE = 2;

// Apple's filter-maintenance service, written out so a row that reached for it fails here. Battery
// health and replacement are never represented through filter semantics (D-021, SAFE-06).
const FILTER_MAINTENANCE_UUID = '000000BA-0000-1000-8000-0026BB765291';

// A name a user typed, deliberately unlike anything the catalogue publishes, so a case that asserts
// it survived cannot be satisfied by a seed.
const USER_RENAME = 'Fuse Box';

/** One backup-battery reading, and the low-battery verdict `D-07` gives it. */
interface BatteryReading {
  healthCode: number;
  voltageLow: boolean;
  low: boolean;
}

// The `D-07` sources, written out here rather than derived: LOW for a low voltage, or for health
// 1 (Replace), 2 (Poor), or 32 (NotDetected); NORMAL for 4 (Okay), 8 (Good), and 16 (NA).
const BATTERY_READINGS: readonly BatteryReading[] = [
  { healthCode: 1, voltageLow: false, low: true },
  { healthCode: 2, voltageLow: false, low: true },
  { healthCode: 4, voltageLow: false, low: false },
  { healthCode: 8, voltageLow: false, low: false },
  { healthCode: 16, voltageLow: false, low: false },
  { healthCode: 32, voltageLow: false, low: true },
  { healthCode: 1, voltageLow: true, low: true },
  { healthCode: 2, voltageLow: true, low: true },
  { healthCode: 4, voltageLow: true, low: true },
  { healthCode: 8, voltageLow: true, low: true },
  { healthCode: 16, voltageLow: true, low: true },
  { healthCode: 32, voltageLow: true, low: true },
];

// The documented protection-duration bands, published as reported and never arbitrated against the
// health code (D-008, D-012).
const PROTECTION_BANDS: readonly { protectionHoursCode: number; levelPercent: number }[] = [
  { protectionHoursCode: 1, levelPercent: 25 },
  { protectionHoursCode: 2, levelPercent: 50 },
  { protectionHoursCode: 4, levelPercent: 75 },
  { protectionHoursCode: 8, levelPercent: 100 },
];

// Every scope a row can read, written out here rather than imported, so a scope added to the union
// without a row reading it is visible at this boundary too.
const TRUST_SCOPES: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault', 'connectivity', 'self-test', 'alarm-mute'];

// Every equipment-fault adapter, in the order the catalogue publishes them.
const FAULT_ADAPTERS: readonly ServiceKind[] = [
  'primary-pump-fault',
  'backup-pump-fault',
  'water-sensor-fault',
  'pump-controller-link-lost',
  'basement-guardian-offline',
];

const CLEAR_FAULTS = {
  primaryPumpFault: false,
  backupPumpFault: false,
  backupPumpFuseBlown: false,
  waterSensorFault: false,
  controllerLinkPresent: true,
};

/** One reported condition, and the single adapter it may activate. */
interface FaultCase {
  label: string;
  fault: Readonly<Record<string, boolean>>;
  offlineConfirmed: boolean;
  activated: ServiceKind;
}

const FAULT_CASES: readonly FaultCase[] = [
  { label: 'a primary pump fault', fault: { ...CLEAR_FAULTS, primaryPumpFault: true }, offlineConfirmed: false, activated: 'primary-pump-fault' },
  { label: 'a backup pump fault', fault: { ...CLEAR_FAULTS, backupPumpFault: true }, offlineConfirmed: false, activated: 'backup-pump-fault' },
  { label: 'a blown backup pump fuse', fault: { ...CLEAR_FAULTS, backupPumpFuseBlown: true }, offlineConfirmed: false, activated: 'backup-pump-fault' },
  { label: 'a water sensor fault', fault: { ...CLEAR_FAULTS, waterSensorFault: true }, offlineConfirmed: false, activated: 'water-sensor-fault' },
  {
    label: 'a lost controller link',
    fault: { ...CLEAR_FAULTS, controllerLinkPresent: false },
    offlineConfirmed: false,
    activated: 'pump-controller-link-lost',
  },
  { label: 'a confirmed offline run', fault: CLEAR_FAULTS, offlineConfirmed: true, activated: 'basement-guardian-offline' },
];

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

// One decoded battery group, carrying both the exact vendor codes and the two values the family
// derives from them.
function batteryGroup(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  return { charging: true, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false, ...overrides };
}

// One fully decoded snapshot, in the family-neutral shape every adapter answers. A case overrides
// only the group it is about, so an unrelated group never silently withholds a value.
function decodedState(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    water: { levelCode: 1, levelPercent: 20, flooded: false },
    pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined, testRunning: false },
    power: { mainsPresent: true },
    battery: batteryGroup(),
    fault: { ...CLEAR_FAULTS },
    connectivity: { reportedOffline: false },
    'self-test': { running: false, testedAt: undefined },
    'alarm-mute': { muted: false },
    ...overrides,
  };
}

/**
 * One pump's record as a row is handed it, declared here rather than read off the projection input.
 *
 * The cases below pin the shape a row publishes from instead of following whatever the module
 * declares, so a renamed or retyped member fails here rather than renaming the expectation with it.
 * Both times are strings because the accessory formats them before a row ever sees one.
 */
interface PumpRecordRow {
  observationStartedAt: string;
  activationCount: number;
  lastActivationAt: string;
  lastActivationWasTestActivity: boolean | undefined;
}

/** A projection input carrying one record per pump, which is what every row is handed. */
interface RecordedProjectionInput extends ProjectionInput {
  primaryPumpRecord: PumpRecordRow;
  backupPumpRecord: PumpRecordRow;
}

// The two record times every case starts from, written out rather than derived from a clock or a
// millisecond value, so a row that formatted or recomputed one would publish something else.
const OBSERVATION_START = '2026-08-01T00:00:00.000Z';
const LAST_ACTIVATION = '2026-08-30T12:34:56.000Z';

function pumpRecord(overrides: Partial<PumpRecordRow> = {}): PumpRecordRow {
  return {
    observationStartedAt: OBSERVATION_START,
    activationCount: 0,
    lastActivationAt: '',
    lastActivationWasTestActivity: undefined,
    ...overrides,
  };
}

function projectionInput(overrides: Partial<RecordedProjectionInput> = {}): RecordedProjectionInput {
  return {
    decoded: decodedState(),
    untrustedScopes: [],
    offlineConfirmed: false,
    controllerDataLastTrustedAt: '',
    pendingControls: new Set<DeviceCapability>(),
    primaryPumpRecord: pumpRecord(),
    backupPumpRecord: pumpRecord(),
    ...overrides,
  };
}

// The two control rows, each with the capability it withholds `On` for and the other capability
// whose pending request must leave it alone.
const CONTROL_ROWS = [
  { kind: 'system-self-test', capability: 'self-test', other: 'alarm-mute' },
  { kind: 'alarm-mute', capability: 'alarm-mute', other: 'self-test' },
] as const satisfies readonly { kind: ServiceKind; capability: DeviceCapability; other: DeviceCapability }[];

// A decoded state in which both controls read active, so a row that projects `On` is telling the
// two apart from an absent value rather than answering a format default.
function activeControls(): Record<string, unknown> {
  return decodedState({ 'self-test': { running: true, testedAt: undefined }, 'alarm-mute': { muted: true } });
}

function rowOf(hap: API['hap'], kind: ServiceKind): ServiceRow {
  const row = createServiceCatalogue(hap).find((candidate) => candidate.kind === kind);

  if (row === undefined) {
    throw new Error(`the catalogue publishes no ${kind} row`);
  }

  return row;
}

// The two backup-battery rows share one kind and one subtype, so a case that wants a specific one
// of them asks for it by the name HomeKit shows.
function rowNamed(hap: API['hap'], displayName: string): ServiceRow {
  const row = createServiceCatalogue(hap).find((candidate) => candidate.displayName === displayName);

  if (row === undefined) {
    throw new Error(`the catalogue publishes no ${displayName} row`);
  }

  return row;
}

// One value to publish, for a case that is about something other than which value a row projects.
// A row earns a service only when it has something to vouch for, so a case that wants the service
// present says so with a projection rather than with nothing at all.
function somethingToPublish(hap: API['hap']): readonly ProjectedValue[] {
  return [{ characteristic: hap.Characteristic.StatusActive, value: true }];
}

function addedService(accessory: PlatformAccessory, hap: API['hap'], row: ServiceRow): Service {
  const service = ensureService(accessory, row, somethingToPublish(hap));

  if (service === undefined) {
    throw new Error(`ensureService added no ${row.displayName} service`);
  }

  return service;
}

// A projected value is compared by the identity of the characteristic that carries it, because the
// custom characteristic classes are built per call while their identifier is the published fact.
function summarise(values: readonly ProjectedValue[]): readonly { uuid: string; value: CharacteristicValue }[] {
  return values.map((projected) => ({ uuid: projected.characteristic.UUID, value: projected.value }));
}

function valueOf(values: readonly ProjectedValue[], characteristic: { UUID: string }): CharacteristicValue | undefined {
  return values.find((projected) => projected.characteristic.UUID === characteristic.UUID)?.value;
}

// Every required characteristic a row's service class carries that the row does not publish, over
// each trust state the accessory can hand it, named once each.
//
// `ensureService` adds a service as soon as a row projects anything at all, which is sound only
// while every required characteristic of that service class comes from a scope the row still
// publishes from. Break that and the service is added for the value the row did project while the
// required one sits at HAP's format default: a `Status Fault` of `NO_FAULT`, or a quiet contact,
// that no device ever reported. `Name` is excluded because the service constructor sets it from the
// display name it is given.
function unprojectedRequiredCharacteristics(hap: API['hap'], rows: readonly ServiceRow[]): readonly string[] {
  const inputs = [
    projectionInput(),
    ...TRUST_SCOPES.map((scope) => projectionInput({ untrustedScopes: [{ scope, reason: 'invalid', lastTrustedAt: undefined }] })),
  ];
  const drifted = rows.flatMap((row) =>
    inputs.flatMap((input) => {
      const projected = new Set(row.project(input).map((value) => value.characteristic.UUID));

      if (projected.size === 0) {
        return [];
      }

      return new row.serviceClass(row.displayName, row.subtype).characteristics
        .filter((required) => required.UUID !== hap.Characteristic.Name.UUID && !projected.has(required.UUID))
        .map((required) => `${row.displayName} adds a service without publishing ${required.displayName}`);
    }),
  );

  return [...new Set(drifted)];
}

// The module is read as text rather than imported, because the assertion is about what it does not
// import; the name is interpolated so the path is a runtime value rather than a static import.
async function sourceOf(module: string): Promise<string> {
  return readFile(new URL(`../../../src/accessories/${module}`, import.meta.url), 'utf8');
}

// Every case about the pit level, the raw code beside it, and the flood adapter.
function registerWaterCases(): void {
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
}

// Every case about the two pump services and the two live activity adapters.
function registerPumpCases(): void {
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
}

// Every case about the record each pump service carries beside its live state.
function registerPumpRecordCases(): void {
  test('publishes the observed activation count the record carries on the primary pump row', () => {
    // arrange
    const hap = hapNamespace();
    const { ObservedActivationCount } = createCustomCharacteristics(hap);
    const input = projectionInput({ primaryPumpRecord: pumpRecord({ activationCount: 7 }) });

    // act
    const projected = rowOf(hap, 'primary-pump').project(input);

    // assert
    assert.strictEqual(valueOf(projected, ObservedActivationCount), 7);
  });

  test('publishes the observation start and the last activation the record carries on the backup pump row', () => {
    // arrange
    const hap = hapNamespace();
    const { ObservationStartedAt, LastObservedActivationAt } = createCustomCharacteristics(hap);
    const input = projectionInput({ backupPumpRecord: pumpRecord({ activationCount: 3, lastActivationAt: LAST_ACTIVATION }) });

    // act
    const projected = rowOf(hap, 'backup-pump').project(input);

    // assert
    assert.deepStrictEqual(
      { start: valueOf(projected, ObservationStartedAt), last: valueOf(projected, LastObservedActivationAt) },
      { start: OBSERVATION_START, last: LAST_ACTIVATION },
    );
  });

  // The primary pump carries no self-test label at all: the device reports no primary activation
  // timestamp and a self-test runs the backup pump, so nothing about a primary run could be
  // classified (D-013, C-001).
  test('publishes no self-test label on the primary pump row even when the record carries one', () => {
    // arrange
    const hap = hapNamespace();
    const { LastActivationWasTestActivity } = createCustomCharacteristics(hap);
    const input = projectionInput({ primaryPumpRecord: pumpRecord({ lastActivationWasTestActivity: true }) });

    // act
    const projected = rowOf(hap, 'primary-pump').project(input);

    // assert
    assert.deepStrictEqual(
      summarise(projected).filter((value) => value.uuid === LastActivationWasTestActivity.UUID),
      [],
    );
  });

  for (const lastActivationWasTestActivity of [true, false]) {
    test(`publishes a self-test label of ${String(lastActivationWasTestActivity)} on the backup pump row`, () => {
      // arrange
      const hap = hapNamespace();
      const { LastActivationWasTestActivity } = createCustomCharacteristics(hap);
      const input = projectionInput({ backupPumpRecord: pumpRecord({ lastActivationWasTestActivity }) });

      // act
      const projected = rowOf(hap, 'backup-pump').project(input);

      // assert
      assert.deepStrictEqual(
        summarise(projected).filter((value) => value.uuid === LastActivationWasTestActivity.UUID),
        [{ uuid: LastActivationWasTestActivity.UUID, value: lastActivationWasTestActivity }],
      );
    });
  }

  // Absent is a different claim from `false`. `false` asserts the last activation was not a test,
  // and the plugin has not earned that until both device timestamps have settled, so an absent
  // label publishes nothing rather than the quiet half of a two-state adapter (D-013).
  test('publishes no self-test label on the backup pump row while the record carries none', () => {
    // arrange
    const hap = hapNamespace();
    const { LastActivationWasTestActivity } = createCustomCharacteristics(hap);

    // act
    const projected = rowOf(hap, 'backup-pump').project(projectionInput());

    // assert
    assert.deepStrictEqual(
      summarise(projected).filter((value) => value.uuid === LastActivationWasTestActivity.UUID),
      [],
    );
  });

  // The empty string is what a record that has never seen an activation reports, exactly as
  // `ControllerDataLastTrustedAt` already does. Publishing nothing at all would leave whatever the
  // characteristic last carried standing (CTRL-01, RES-02).
  for (const kind of ['primary-pump', 'backup-pump'] satisfies readonly ServiceKind[]) {
    test(`publishes an empty last activation on the ${kind} row rather than nothing at all`, () => {
      // arrange
      const hap = hapNamespace();
      const { LastObservedActivationAt } = createCustomCharacteristics(hap);

      // act
      const projected = rowOf(hap, kind).project(projectionInput());

      // assert
      assert.deepStrictEqual(
        summarise(projected).filter((value) => value.uuid === LastObservedActivationAt.UUID),
        [{ uuid: LastObservedActivationAt.UUID, value: '' }],
      );
    });
  }

  test('publishes a pump record on the two pump services and on no other row', () => {
    // arrange
    const hap = hapNamespace();
    const { ObservationStartedAt, ObservedActivationCount, LastObservedActivationAt, LastActivationWasTestActivity } = createCustomCharacteristics(hap);
    const recordUuids = new Set([ObservationStartedAt.UUID, ObservedActivationCount.UUID, LastObservedActivationAt.UUID, LastActivationWasTestActivity.UUID]);
    const input = projectionInput({ backupPumpRecord: pumpRecord({ lastActivationWasTestActivity: true }) });

    // act
    const publishing = createServiceCatalogue(hap)
      .filter((row) => row.project(input).some((value) => recordUuids.has(value.characteristic.UUID)))
      .map((row) => row.displayName);

    // assert
    assert.deepStrictEqual(publishing, ['Primary Pump', 'Backup Pump']);
  });

  // The record is additional and displaces nothing, so the live values each pump row published
  // before it existed are compared against an inline list rather than against the row's own answer.
  test('keeps publishing the live pump and fault values beside the record on both pump rows', () => {
    // arrange
    const hap = hapNamespace();
    const { PumpRunning, PumpFault, PumpFuseBlown } = createCustomCharacteristics(hap);
    const live = new Set([PumpRunning.UUID, PumpFault.UUID, PumpFuseBlown.UUID, hap.Characteristic.StatusFault.UUID]);
    const decoded = decodedState({
      pump: { primaryRunning: true, backupRunning: true },
      fault: { ...CLEAR_FAULTS, primaryPumpFault: true, backupPumpFuseBlown: true },
    });
    const input = projectionInput({ decoded });

    // act
    const projected = {
      primary: summarise(rowOf(hap, 'primary-pump').project(input)).filter((value) => live.has(value.uuid)),
      backup: summarise(rowOf(hap, 'backup-pump').project(input)).filter((value) => live.has(value.uuid)),
    };

    // assert
    assert.deepStrictEqual(projected, {
      primary: [
        { uuid: PumpRunning.UUID, value: true },
        { uuid: PumpFault.UUID, value: true },
        { uuid: hap.Characteristic.StatusFault.UUID, value: GENERAL_FAULT },
      ],
      backup: [
        { uuid: PumpRunning.UUID, value: true },
        { uuid: PumpFault.UUID, value: false },
        { uuid: PumpFuseBlown.UUID, value: true },
        { uuid: hap.Characteristic.StatusFault.UUID, value: GENERAL_FAULT },
      ],
    });
  });

  // An accessory that has observed no snapshot has no record to hand a row: before the first
  // update, and on an accessory whose family has never resolved, there is nothing to publish. A
  // count of zero counted from 1970 is exactly the claim the record exists to avoid making (D-020).
  test('publishes no record on either pump row before the accessory has observed anything', () => {
    // arrange
    const hap = hapNamespace();
    const { ObservationStartedAt, ObservedActivationCount, LastObservedActivationAt } = createCustomCharacteristics(hap);
    const recordUuids = new Set([ObservationStartedAt.UUID, ObservedActivationCount.UUID, LastObservedActivationAt.UUID]);
    const input: ProjectionInput = {
      decoded: decodedState(),
      untrustedScopes: [],
      offlineConfirmed: false,
      controllerDataLastTrustedAt: '',
      pendingControls: new Set<DeviceCapability>(),
    };

    // act
    const projected = {
      primary: summarise(rowOf(hap, 'primary-pump').project(input)).filter((value) => recordUuids.has(value.uuid)),
      backup: summarise(rowOf(hap, 'backup-pump').project(input)).filter((value) => recordUuids.has(value.uuid)),
    };

    // assert
    assert.deepStrictEqual(projected, { primary: [], backup: [] });
  });

  // `ensureService` adds a service as soon as a row projects anything, and `Pump Running` is the one
  // characteristic `PumpService` requires. A row that earned its service on the record alone would
  // therefore add a service whose required characteristic sits at HAP's `false` default -- a pump
  // reported as not running that no device ever reported (D-014, RES-01).
  test('publishes no record at all on a pump row whose reported running state did not decode', () => {
    // arrange
    const hap = hapNamespace();
    const { PumpFault, PumpFuseBlown } = createCustomCharacteristics(hap);
    const input = projectionInput({ decoded: decodedState({ pump: {} }) });

    // act
    const projected = {
      primary: summarise(rowOf(hap, 'primary-pump').project(input)),
      backup: summarise(rowOf(hap, 'backup-pump').project(input)),
    };

    // assert
    assert.deepStrictEqual(projected, {
      primary: [
        { uuid: PumpFault.UUID, value: false },
        { uuid: hap.Characteristic.StatusFault.UUID, value: NO_FAULT },
      ],
      backup: [
        { uuid: PumpFault.UUID, value: false },
        { uuid: PumpFuseBlown.UUID, value: false },
        { uuid: hap.Characteristic.StatusFault.UUID, value: NO_FAULT },
      ],
    });
  });
}

// Every case about mains power at the controller and the adapter that follows it.
function registerPowerCases(): void {
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
}

// Every case about the standard battery service and the exact vendor codes beside it.
function registerBatteryCases(): void {
  for (const { healthCode, voltageLow, low } of BATTERY_READINGS) {
    test(`reports the backup battery as ${low ? 'low' : 'normal'} for health code ${String(healthCode)} with a low voltage of ${String(voltageLow)}`, () => {
      // arrange
      const hap = hapNamespace();
      const { BatteryHealthCode, BatteryVoltageLow } = createCustomCharacteristics(hap);
      const input = projectionInput({ decoded: decodedState({ battery: batteryGroup({ healthCode, voltageLow, low }) }) });

      // act
      const projected = { battery: rowNamed(hap, 'Backup Battery').project(input), facts: rowNamed(hap, 'Backup Battery Facts').project(input) };

      // assert
      assert.deepStrictEqual(
        {
          status: valueOf(projected.battery, hap.Characteristic.StatusLowBattery),
          health: valueOf(projected.facts, BatteryHealthCode),
          voltage: valueOf(projected.facts, BatteryVoltageLow),
        },
        { status: low ? BATTERY_LEVEL_LOW : BATTERY_LEVEL_NORMAL, health: healthCode, voltage: voltageLow },
      );
    });
  }

  for (const { protectionHoursCode, levelPercent } of PROTECTION_BANDS) {
    test(`publishes protection hours code ${String(protectionHoursCode)} as ${String(levelPercent)} per cent beside the raw code`, () => {
      // arrange
      const hap = hapNamespace();
      const { ProtectionHoursCode } = createCustomCharacteristics(hap);
      const input = projectionInput({ decoded: decodedState({ battery: batteryGroup({ protectionHoursCode, levelPercent }) }) });

      // act
      const projected = { battery: rowNamed(hap, 'Backup Battery').project(input), facts: rowNamed(hap, 'Backup Battery Facts').project(input) };

      // assert
      assert.deepStrictEqual(
        { level: valueOf(projected.battery, hap.Characteristic.BatteryLevel), code: valueOf(projected.facts, ProtectionHoursCode) },
        { level: levelPercent, code: protectionHoursCode },
      );
    });
  }

  test('publishes the reported protection band unchanged while the health code reports the battery absent', () => {
    // arrange
    const hap = hapNamespace();
    const { BatteryHealthCode } = createCustomCharacteristics(hap);
    const battery = batteryGroup({ healthCode: 32, low: true, protectionHoursCode: 1, levelPercent: 25 });
    const input = projectionInput({ decoded: decodedState({ battery }) });

    // act
    const projected = { battery: rowNamed(hap, 'Backup Battery').project(input), facts: rowNamed(hap, 'Backup Battery Facts').project(input) };

    // assert
    assert.deepStrictEqual(
      { level: valueOf(projected.battery, hap.Characteristic.BatteryLevel), health: valueOf(projected.facts, BatteryHealthCode) },
      { level: 25, health: 32 },
    );
  });

  for (const charging of [true, false]) {
    test(`reports the backup battery charging state of ${String(charging)} on both battery rows`, () => {
      // arrange
      const hap = hapNamespace();
      const { BatteryCharging } = createCustomCharacteristics(hap);
      const input = projectionInput({ decoded: decodedState({ battery: batteryGroup({ charging }) }) });

      // act
      const projected = { battery: rowNamed(hap, 'Backup Battery').project(input), facts: rowNamed(hap, 'Backup Battery Facts').project(input) };

      // assert
      assert.deepStrictEqual(
        { state: valueOf(projected.battery, hap.Characteristic.ChargingState), reported: valueOf(projected.facts, BatteryCharging) },
        { state: charging ? CHARGING : NOT_CHARGING, reported: charging },
      );
    });
  }

  test('never reports the backup battery as not chargeable, for any reading in this suite', () => {
    // arrange
    const hap = hapNamespace();
    const row = rowNamed(hap, 'Backup Battery');
    const readings = BATTERY_READINGS.flatMap(({ healthCode, voltageLow, low }) =>
      [true, false].map((charging) => batteryGroup({ healthCode, voltageLow, low, charging })),
    );

    // act
    const states = readings.map((battery) => valueOf(row.project(projectionInput({ decoded: decodedState({ battery }) })), hap.Characteristic.ChargingState));

    // assert
    assert.deepStrictEqual(
      states.filter((state) => state === NOT_CHARGEABLE),
      [],
    );
  });
}

// Every case about the five equipment-fault adapters transitioning independently.
function registerFaultAdapterCases(): void {
  for (const { label, fault, offlineConfirmed, activated } of FAULT_CASES) {
    test(`activates one fault adapter alone for ${label}`, () => {
      // arrange
      const hap = hapNamespace();
      const input = projectionInput({ decoded: decodedState({ fault }), offlineConfirmed });

      // act
      const states = FAULT_ADAPTERS.map((kind) => valueOf(rowOf(hap, kind).project(input), hap.Characteristic.ContactSensorState));

      // assert
      assert.deepStrictEqual(
        states,
        FAULT_ADAPTERS.map((kind) => (kind === activated ? CONTACT_NOT_DETECTED : CONTACT_DETECTED)),
      );
    });
  }

  for (const { primaryPumpFault, waterSensorFault } of [
    { primaryPumpFault: true, waterSensorFault: false },
    { primaryPumpFault: false, waterSensorFault: true },
  ]) {
    test(`faults the adapter service alongside its contact state, given a primary pump fault of ${String(primaryPumpFault)}`, () => {
      // arrange
      const hap = hapNamespace();
      const input = projectionInput({ decoded: decodedState({ fault: { ...CLEAR_FAULTS, primaryPumpFault, waterSensorFault } }) });

      // act
      const projected = { primary: rowOf(hap, 'primary-pump-fault').project(input), water: rowOf(hap, 'water-sensor-fault').project(input) };

      // assert
      assert.deepStrictEqual(
        {
          primary: valueOf(projected.primary, hap.Characteristic.StatusFault),
          water: valueOf(projected.water, hap.Characteristic.StatusFault),
        },
        { primary: primaryPumpFault ? GENERAL_FAULT : NO_FAULT, water: waterSensorFault ? GENERAL_FAULT : NO_FAULT },
      );
    });
  }

  test('keeps the controller link adapter publishing while a lost link makes its own scope untrusted', () => {
    // arrange
    const hap = hapNamespace();
    const { ControllerLinkPresent, ControllerDataLastTrustedAt } = createCustomCharacteristics(hap);
    const input = projectionInput({
      decoded: decodedState({ fault: { ...CLEAR_FAULTS, controllerLinkPresent: false } }),
      untrustedScopes: [{ scope: 'fault', reason: 'controller-link-lost', lastTrustedAt: 1_700_000_000_000 }],
      controllerDataLastTrustedAt: '2026-08-30T15:00:00Z',
    });

    // act
    const projected = rowOf(hap, 'pump-controller-link-lost').project(input);

    // assert
    assert.deepStrictEqual(summarise(projected), [
      { uuid: hap.Characteristic.ContactSensorState.UUID, value: CONTACT_NOT_DETECTED },
      { uuid: hap.Characteristic.StatusFault.UUID, value: GENERAL_FAULT },
      { uuid: ControllerLinkPresent.UUID, value: false },
      { uuid: ControllerDataLastTrustedAt.UUID, value: '2026-08-30T15:00:00Z' },
    ]);
  });

  test('silences every other fault adapter while a lost link makes the fault scope untrusted', () => {
    // arrange
    const hap = hapNamespace();
    const input = projectionInput({
      decoded: decodedState({ fault: { ...CLEAR_FAULTS, controllerLinkPresent: false } }),
      untrustedScopes: [{ scope: 'fault', reason: 'controller-link-lost', lastTrustedAt: 1_700_000_000_000 }],
    });
    const downstream: readonly ServiceKind[] = ['primary-pump-fault', 'backup-pump-fault', 'water-sensor-fault'];

    // act
    const projected = downstream.map((kind) => rowOf(hap, kind).project(input));

    // assert
    assert.deepStrictEqual(projected, [[], [], []]);
  });

  test('publishes no controller link state at all while the link fact failed validation', () => {
    // arrange
    const hap = hapNamespace();
    const input = projectionInput({
      untrustedScopes: [{ scope: 'fault', reason: 'invalid', lastTrustedAt: 1_700_000_000_000 }],
      controllerDataLastTrustedAt: '2026-08-30T15:00:00Z',
    });

    // act
    const projected = FAULT_ADAPTERS.filter((kind) => kind !== 'basement-guardian-offline').map((kind) => rowOf(hap, kind).project(input));

    // assert
    assert.deepStrictEqual(projected, [[], [], [], []]);
  });

  test('reports the controller link as present, with the time its data was last trustworthy', () => {
    // arrange
    const hap = hapNamespace();
    const { ControllerLinkPresent, ControllerDataLastTrustedAt } = createCustomCharacteristics(hap);
    const input = projectionInput({ controllerDataLastTrustedAt: '' });

    // act
    const projected = rowOf(hap, 'pump-controller-link-lost').project(input);

    // assert
    assert.deepStrictEqual(summarise(projected), [
      { uuid: hap.Characteristic.ContactSensorState.UUID, value: CONTACT_DETECTED },
      { uuid: hap.Characteristic.StatusFault.UUID, value: NO_FAULT },
      { uuid: ControllerLinkPresent.UUID, value: true },
      { uuid: ControllerDataLastTrustedAt.UUID, value: '' },
    ]);
  });
}

// Every case about the confirmed-offline adapter.
function registerOfflineCases(): void {
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
}

// Every case about a group that did not decode and a scope that is not trustworthy.
function registerAbsentStateCases(): void {
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
      assert.deepStrictEqual(projected, [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]);
    });
  }

  for (const running of [true, false]) {
    test(`projects the reported test_running of ${String(running)} onto On while nothing is pending`, () => {
      // arrange
      const hap = hapNamespace();
      const input = projectionInput({ decoded: decodedState({ 'self-test': { running, testedAt: undefined } }) });

      // act
      const projected = rowOf(hap, 'system-self-test').project(input);

      // assert
      assert.deepStrictEqual(summarise(projected), [{ uuid: hap.Characteristic.On.UUID, value: running }]);
    });
  }

  // The whole of the withholding rule: while a request is unresolved the row publishes no `On` at
  // all, so the accessory's per-update push cannot snap the toggle back before the device confirms
  // (D-05, D-037).
  for (const { kind, capability } of CONTROL_ROWS) {
    test(`projects no On at all while ${kind} carries an unresolved request`, () => {
      // arrange
      const hap = hapNamespace();
      const input = projectionInput({ decoded: activeControls(), pendingControls: new Set<DeviceCapability>([capability]) });

      // act
      const projected = rowOf(hap, kind).project(input);

      // assert
      assert.deepStrictEqual(summarise(projected), []);
    });
  }

  // Withholding lives in the row, so the row is where the isolation is proved. A helper that read
  // one hard-coded capability, or closed over the wrong one, would keep both pending sets perfectly
  // correct and still freeze the other Switch for the whole window every time this one was pressed
  // (D-05, D-06).
  for (const { kind, other } of CONTROL_ROWS) {
    test(`projects the reported On on the ${kind} row while only ${other} is pending`, () => {
      // arrange
      const hap = hapNamespace();
      const input = projectionInput({ decoded: activeControls(), pendingControls: new Set<DeviceCapability>([other]) });

      // act
      const projected = rowOf(hap, kind).project(input);

      // assert
      assert.deepStrictEqual(summarise(projected), [{ uuid: hap.Characteristic.On.UUID, value: true }]);
    });
  }

  test('projects nothing on the control row while its own scope is untrusted', () => {
    // arrange
    const hap = hapNamespace();
    const input = projectionInput({ untrustedScopes: [{ scope: 'self-test', reason: 'invalid', lastTrustedAt: undefined }] });

    // act
    const projected = rowOf(hap, 'system-self-test').project(input);

    // assert
    assert.deepStrictEqual(summarise(projected), []);
  });

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
      { kind: 'backup-battery', subtype: 'backup-battery' },
      { kind: 'backup-battery', subtype: 'backup-battery' },
      { kind: 'primary-pump-fault', subtype: 'primary-pump-fault' },
      { kind: 'backup-pump-fault', subtype: 'backup-pump-fault' },
      { kind: 'water-sensor-fault', subtype: 'water-sensor-fault' },
      { kind: 'pump-controller-link-lost', subtype: 'pump-controller-link-lost' },
      { kind: 'system-self-test', subtype: 'system-self-test' },
      { kind: 'alarm-mute', subtype: 'alarm-mute' },
      { kind: 'basement-guardian-offline', subtype: 'basement-guardian-offline' },
    ]);
  });

  test('names each row and scopes it to the state it reads', () => {
    // arrange
    const catalogue = createServiceCatalogue(hapNamespace());

    // act
    const rows = catalogue.map((row) => ({
      displayName: row.displayName,
      scope: row.scope,
      readScopes: row.readScopes,
      toleratedDistrust: row.toleratedDistrust,
    }));

    // assert
    assert.deepStrictEqual(rows, [
      { displayName: 'Sump Pit Flood', scope: 'water', readScopes: ['water'], toleratedDistrust: [] },
      { displayName: 'Sump Pit Level', scope: 'water', readScopes: ['water', 'fault'], toleratedDistrust: [] },
      { displayName: 'Primary Pump', scope: 'pump', readScopes: ['pump', 'fault'], toleratedDistrust: [] },
      { displayName: 'Primary Pump Running', scope: 'pump', readScopes: ['pump'], toleratedDistrust: [] },
      { displayName: 'Backup Pump', scope: 'pump', readScopes: ['pump', 'fault'], toleratedDistrust: [] },
      { displayName: 'Backup Pump Activated', scope: 'pump', readScopes: ['pump'], toleratedDistrust: [] },
      { displayName: 'Sump Mains Power', scope: 'power', readScopes: ['power'], toleratedDistrust: [] },
      { displayName: 'Mains Power Lost', scope: 'power', readScopes: ['power'], toleratedDistrust: [] },
      { displayName: 'Backup Battery', scope: 'battery', readScopes: ['battery'], toleratedDistrust: [] },
      { displayName: 'Backup Battery Facts', scope: 'battery', readScopes: ['battery'], toleratedDistrust: [] },
      { displayName: 'Primary Pump Fault', scope: 'fault', readScopes: ['fault'], toleratedDistrust: [] },
      { displayName: 'Backup Pump Fault', scope: 'fault', readScopes: ['fault'], toleratedDistrust: [] },
      { displayName: 'Water Sensor Fault', scope: 'fault', readScopes: ['fault'], toleratedDistrust: [] },
      { displayName: 'Pump Controller Link Lost', scope: 'fault', readScopes: ['fault'], toleratedDistrust: ['controller-link-lost'] },
      { displayName: 'System Self-Test', scope: 'self-test', readScopes: ['self-test'], toleratedDistrust: [] },
      { displayName: 'Alarm Mute', scope: 'alarm-mute', readScopes: ['alarm-mute'], toleratedDistrust: [] },
      { displayName: 'Basement Guardian Offline', scope: 'connectivity', readScopes: ['connectivity'], toleratedDistrust: [] },
    ]);
  });

  // The declared list above is what `StatusActive` answers for, so a row that grew a second scope
  // read without declaring it would publish that scope's retained value as current. This derives the
  // list from behaviour instead: a scope a row reads is a scope whose loss changes what the row
  // publishes, so the two lists disagree the moment the declaration drifts from the projection.
  test('declares every scope whose loss changes what a row publishes', () => {
    // arrange
    const hap = hapNamespace();
    const catalogue = createServiceCatalogue(hap);
    const trustworthy = projectionInput();

    // act
    const observed = catalogue.map((row) =>
      TRUST_SCOPES.filter(
        (scope) =>
          !isDeepStrictEqual(
            summarise(row.project(projectionInput({ untrustedScopes: [{ scope, reason: 'invalid', lastTrustedAt: undefined }] }))),
            summarise(row.project(trustworthy)),
          ),
      ),
    );

    // assert
    assert.deepStrictEqual(
      observed,
      catalogue.map((row) => [...row.readScopes]),
    );
  });

  test('shows the seventeen service names HomeKit renders, in publication order', () => {
    // arrange
    const catalogue = createServiceCatalogue(hapNamespace());

    // act
    const names = catalogue.map((row) => row.displayName);

    // assert
    assert.deepStrictEqual(names, [
      'Sump Pit Flood',
      'Sump Pit Level',
      'Primary Pump',
      'Primary Pump Running',
      'Backup Pump',
      'Backup Pump Activated',
      'Sump Mains Power',
      'Mains Power Lost',
      'Backup Battery',
      'Backup Battery Facts',
      'Primary Pump Fault',
      'Backup Pump Fault',
      'Water Sensor Fault',
      'Pump Controller Link Lost',
      'System Self-Test',
      'Alarm Mute',
      'Basement Guardian Offline',
    ]);
  });

  test('tolerates a lost controller link on the one adapter that reports it, and on no other row', () => {
    // arrange
    const catalogue = createServiceCatalogue(hapNamespace());

    // act
    const tolerant = catalogue.filter((row) => row.toleratedDistrust.length > 0);

    // assert
    assert.deepStrictEqual(
      tolerant.map((row) => ({ displayName: row.displayName, toleratedDistrust: row.toleratedDistrust })),
      [{ displayName: 'Pump Controller Link Lost', toleratedDistrust: ['controller-link-lost'] }],
    );
  });

  test('publishes no aggregate fault and no filter maintenance service', () => {
    // arrange
    const catalogue = createServiceCatalogue(hapNamespace());

    // act
    const forbidden = catalogue.filter(
      (row) => row.displayName.includes('Filter') || row.displayName.includes('System Fault') || row.serviceClass.UUID === FILTER_MAINTENANCE_UUID,
    );

    // assert
    assert.deepStrictEqual(
      forbidden.map((row) => row.displayName),
      [],
    );
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
      hap.Service.Battery.UUID,
      services.BackupBatteryService.UUID,
      hap.Service.ContactSensor.UUID,
      hap.Service.ContactSensor.UUID,
      hap.Service.ContactSensor.UUID,
      hap.Service.ContactSensor.UUID,
      hap.Service.Switch.UUID,
      hap.Service.Switch.UUID,
      hap.Service.ContactSensor.UUID,
    ]);
  });

  for (const { kind, capability } of CONTROL_ROWS) {
    test(`publishes the ${kind} control as a Switch on its own trust scope, under its kind slug`, () => {
      // arrange
      const hap = hapNamespace();

      // act
      const row = rowOf(hap, kind);

      // assert
      assert.deepStrictEqual(
        { subtype: row.subtype, scope: row.scope, alwaysPublish: row.alwaysPublish, serviceUuid: row.serviceClass.UUID },
        { subtype: kind, scope: capability, alwaysPublish: true, serviceUuid: hap.Service.Switch.UUID },
      );
    });
  }

  // The vendor exposes no duration selector and no unmute command, so the plugin publishes nothing
  // that would suggest either. A simulated duration would report a mute ending that the device
  // never ended (D-019, CTRL-04).
  for (const forbidden of ['Duration', 'Timer', 'Schedule', 'Unmute']) {
    test(`publishes no row, subtype, or display name naming ${forbidden}`, () => {
      // arrange
      const catalogue = createServiceCatalogue(hapNamespace());

      // act
      const naming = catalogue.filter((row) => `${row.kind} ${row.subtype} ${row.displayName}`.includes(forbidden));

      // assert
      assert.deepStrictEqual(naming, []);
    });
  }

  test('claims the always-publish exemption on the control row alone', () => {
    // arrange
    const catalogue = createServiceCatalogue(hapNamespace());

    // act
    const exempt = catalogue.filter((row) => row.alwaysPublish);

    // assert
    assert.deepStrictEqual(
      exempt.map((row) => row.displayName),
      ['System Self-Test', 'Alarm Mute'],
    );
  });

  test('adds the control service even when the row projects nothing, and adds no sensor service on the same terms', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const control = rowOf(hap, 'system-self-test');
    const sensor = rowOf(hap, 'sump-pit-flood');

    // act
    const added = { control: ensureService(accessory, control, []), sensor: ensureService(accessory, sensor, []) };

    // assert
    assert.deepStrictEqual({ control: added.control?.UUID, sensor: added.sensor }, { control: hap.Service.Switch.UUID, sensor: undefined });
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

  registerWaterCases();

  registerPumpCases();

  registerPumpRecordCases();

  registerPowerCases();

  registerBatteryCases();

  registerFaultAdapterCases();

  registerOfflineCases();

  registerAbsentStateCases();

  test('publishes every required characteristic of a service it earns, in every trust state', () => {
    // arrange
    const hap = hapNamespace();

    // act & assert
    assert.deepStrictEqual(unprojectedRequiredCharacteristics(hap, createServiceCatalogue(hap)), []);
  });

  // The negative control for the case above. A row whose service class requires a characteristic it
  // never publishes is exactly the drift the check exists to catch, so the check has to name it;
  // without this, an empty answer would prove only that the check looks at nothing.
  test('names a row whose service class requires a characteristic the row never publishes', () => {
    // arrange
    const hap = hapNamespace();
    const drifted: ServiceRow = { ...rowOf(hap, 'mains-power-lost'), serviceClass: createCustomServices(hap).SumpPitService };

    // act & assert
    assert.deepStrictEqual(unprojectedRequiredCharacteristics(hap, [drifted]), [
      'Mains Power Lost adds a service without publishing Water Level',
      'Mains Power Lost adds a service without publishing Raw Water Level Code',
    ]);
  });

  test('reads the water level meaning from decoded state rather than from the level ladder', async () => {
    // act
    const source = await sourceOf('serviceCatalogue.ts');

    // assert
    assert.strictEqual(source.includes('waterLevel.js'), false);
  });
});

// The one structural narrowing of a decoded scope group, which the accessory reads through rather
// than repeating. Two narrowings can disagree about the same payload, and a row would then publish
// a value the accessory's own observation never saw (D-003).
describe('decodedGroup', () => {
  test('answers the group a decoded state carries for the scope asked for', () => {
    // act & assert
    assert.deepStrictEqual(decodedGroup({ pump: { primaryRunning: true }, water: { levelCode: 1 } }, 'pump'), { primaryRunning: true });
  });

  for (const { label, decoded } of [
    { label: 'a decoded state that is not a record', decoded: null },
    { label: 'a decoded state that is an array', decoded: [] },
    { label: 'a decoded state carrying no such group', decoded: {} },
    { label: 'a group that did not decode', decoded: { pump: undefined } },
    { label: 'a group that is not a record', decoded: { pump: 'absent' } },
  ]) {
    test(`answers nothing for ${label}`, () => {
      // act & assert
      assert.strictEqual(decodedGroup(decoded, 'pump'), undefined);
    });
  }
});

describe('booleanOf', () => {
  test('answers a decoded boolean field', () => {
    // act & assert
    assert.strictEqual(booleanOf({ primaryRunning: false }, 'primaryRunning'), false);
  });

  for (const { label, group } of [
    { label: 'a group that did not decode', group: undefined },
    { label: 'a group carrying no such field', group: {} },
    { label: 'a field of the wrong type', group: { primaryRunning: 'yes' } },
  ]) {
    test(`answers nothing for ${label}`, () => {
      // act & assert
      assert.strictEqual(booleanOf(group, 'primaryRunning'), undefined);
    });
  }
});

describe('numberOf', () => {
  test('answers a decoded number field', () => {
    // act & assert
    assert.strictEqual(numberOf({ backupActivatedAt: 1_700_000_000 }, 'backupActivatedAt'), 1_700_000_000);
  });

  for (const { label, group } of [
    { label: 'a group that did not decode', group: undefined },
    { label: 'a group carrying no such field', group: {} },
    { label: 'a field of the wrong type', group: { backupActivatedAt: '1700000000' } },
  ]) {
    test(`answers nothing for ${label}`, () => {
      // act & assert
      assert.strictEqual(numberOf(group, 'backupActivatedAt'), undefined);
    });
  }
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

describe('isRowFullyTrusted', () => {
  test('trusts a two-scope row while both scopes it reads carry no distrust', () => {
    // arrange
    const hap = hapNamespace();

    // act & assert
    assert.strictEqual(isRowFullyTrusted(rowOf(hap, 'primary-pump'), []), true);
  });

  test('distrusts a two-scope row when the second scope it reads stops validating', () => {
    // arrange
    const hap = hapNamespace();
    const untrustedScopes = [{ scope: 'fault' as const, reason: 'invalid' as const, lastTrustedAt: 7 }];

    // act
    const trusted = { own: isRowTrusted(rowOf(hap, 'primary-pump'), untrustedScopes), every: isRowFullyTrusted(rowOf(hap, 'primary-pump'), untrustedScopes) };

    // assert
    assert.deepStrictEqual(trusted, { own: true, every: false });
  });

  test('trusts a two-scope row through a distrust reason it tolerates on the second scope', () => {
    // arrange
    const hap = hapNamespace();
    const row: ServiceRow = { ...rowOf(hap, 'primary-pump'), toleratedDistrust: ['controller-link-lost'] };

    // act & assert
    assert.strictEqual(isRowFullyTrusted(row, [{ scope: 'fault', reason: 'controller-link-lost', lastTrustedAt: 7 }]), true);
  });

  test('distrusts a one-scope row when its own scope stops validating', () => {
    // arrange
    const hap = hapNamespace();

    // act & assert
    assert.strictEqual(isRowFullyTrusted(rowOf(hap, 'sump-mains-power'), [{ scope: 'power', reason: 'invalid', lastTrustedAt: 7 }]), false);
  });
});

describe('publishedService', () => {
  test('answers nothing for a row the accessory does not carry', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();

    // act & assert
    assert.strictEqual(publishedService(accessory, rowOf(hap, 'mains-power-lost')), undefined);
  });

  test('answers the service the accessory already carries for the row', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowOf(hap, 'mains-power-lost');
    const added = addedService(accessory, hap, row);

    // act & assert
    assert.strictEqual(publishedService(accessory, row), added);
  });

  test('tells two rows of one subtype apart by their service type', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const facts = rowNamed(hap, 'Backup Battery Facts');
    addedService(accessory, hap, facts);

    // act
    const carried = { battery: publishedService(accessory, rowNamed(hap, 'Backup Battery')), facts: publishedService(accessory, facts)?.displayName };

    // assert
    assert.deepStrictEqual(carried, { battery: undefined, facts: 'Backup Battery Facts' });
  });
});

describe('ensureService', () => {
  test('adds the service under the row display name and subtype on first use', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowOf(hap, 'mains-power-lost');

    // act
    const service = addedService(accessory, hap, row);

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

  // HAP's format defaults are this plugin's good-news values, so a service added before its row has
  // anything to vouch for would read as a healthy sump pit the device never reported (D-014).
  test('adds no service for a row with nothing to publish', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowOf(hap, 'sump-pit-flood');

    // act
    const service = ensureService(accessory, row, []);

    // assert
    assert.deepStrictEqual({ service, carried: publishedService(accessory, row) }, { service: undefined, carried: undefined });
  });

  test('adds the service on the first update in which the row has a value to publish', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowOf(hap, 'sump-pit-flood');
    ensureService(accessory, row, []);

    // act
    const service = ensureService(accessory, row, [{ characteristic: hap.Characteristic.LeakDetected, value: LEAK_DETECTED }]);

    // assert
    assert.deepStrictEqual({ subtype: service?.subtype, carried: publishedService(accessory, row) === service }, { subtype: 'sump-pit-flood', carried: true });
  });

  test('answers a service the accessory already carries even when the row has nothing to publish', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowOf(hap, 'sump-pit-flood');
    const first = addedService(accessory, hap, row);

    // act
    const second = ensureService(accessory, row, []);

    // assert
    assert.strictEqual(second, first);
  });

  test('answers the same service on a second call rather than adding a duplicate', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowOf(hap, 'mains-power-lost');
    const first = addedService(accessory, hap, row);

    // act
    const second = addedService(accessory, hap, row);

    // assert
    assert.strictEqual(second, first);
  });

  test('keeps two rows of one service type apart by their subtypes', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();

    // act
    const mainsPowerLost = addedService(accessory, hap, rowOf(hap, 'mains-power-lost'));
    const offline = addedService(accessory, hap, rowOf(hap, 'basement-guardian-offline'));

    // assert
    assert.deepStrictEqual([mainsPowerLost.subtype, offline.subtype], ['mains-power-lost', 'basement-guardian-offline']);
  });

  test('keeps both pumps apart on one custom service class', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();

    // act
    const pumps = [addedService(accessory, hap, rowOf(hap, 'primary-pump')), addedService(accessory, hap, rowOf(hap, 'backup-pump'))];

    // assert
    assert.deepStrictEqual(
      pumps.map((pump) => ({ displayName: pump.displayName, subtype: pump.subtype })),
      [
        { displayName: 'Primary Pump', subtype: 'primary-pump' },
        { displayName: 'Backup Pump', subtype: 'backup-pump' },
      ],
    );
  });

  test('carries both backup battery services on one subtype, each retrievable by its own class', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const battery = rowNamed(hap, 'Backup Battery');
    const facts = rowNamed(hap, 'Backup Battery Facts');
    addedService(accessory, hap, battery);
    addedService(accessory, hap, facts);

    // act
    const retrieved = {
      battery: accessory.getServiceById(battery.serviceClass, 'backup-battery'),
      facts: accessory.getServiceById(facts.serviceClass, 'backup-battery'),
    };

    // assert
    assert.deepStrictEqual(
      { battery: retrieved.battery?.displayName, facts: retrieved.facts?.displayName, distinct: retrieved.battery !== retrieved.facts },
      { battery: 'Backup Battery', facts: 'Backup Battery Facts', distinct: true },
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
    addedService(accessory, hap, mainsPowerLost);
    addedService(accessory, hap, offline);

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
  // The standard Battery service declares neither status characteristic, so it is the row whose
  // `StatusActive` push has to declare the characteristic before pushing it.
  test('declares an undeclared characteristic once and pushes the value', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const service = addedService(accessory, hap, rowNamed(hap, 'Backup Battery'));

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
    const service = addedService(accessory, hap, rowNamed(hap, 'Backup Battery'));
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

  // Both service families the plugin publishes on: the vendor-defined services declare the two
  // status characteristics themselves, and so do the standard sensors Apple defines.
  for (const displayName of ['Sump Mains Power', 'Mains Power Lost']) {
    test(`declares no characteristic the ${displayName} service already declares`, () => {
      // arrange
      const hap = hapNamespace();
      const accessory = accessoryStandIn();
      const service = addedService(accessory, hap, rowNamed(hap, displayName));

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
  }

  test('pushes onto a characteristic the service already carries without declaring it optional', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const service = addedService(accessory, hap, rowOf(hap, 'mains-power-lost'));

    // act
    publishValue(service, hap.Characteristic.ContactSensorState, CONTACT_NOT_DETECTED);

    // assert
    assert.deepStrictEqual(
      {
        value: service.getCharacteristic(hap.Characteristic.ContactSensorState).value,
        declared: service.optionalCharacteristics.filter((declared) => declared.UUID === hap.Characteristic.ContactSensorState.UUID).length,
      },
      { value: CONTACT_NOT_DETECTED, declared: 0 },
    );
  });
});

// What a service carries under `ConfiguredName`, beside the number of times its definition declares
// it. The count is the half a dropped guard fails: `addOptionalCharacteristic` appends rather than
// replaces, so a second declaration is a silent duplicate rather than an error.
function carriedName(hap: API['hap'], service: Service): { value: unknown; declared: number } {
  const characteristic = hap.Characteristic.ConfiguredName;

  return {
    value: service.getCharacteristic(characteristic).value,
    declared: service.optionalCharacteristics.filter((declared) => declared.UUID === characteristic.UUID).length,
  };
}

describe('seedConfiguredName', () => {
  // Apple's sensor definitions declare no `ConfiguredName`, so a standard sensor is the service
  // whose seed has to declare the characteristic before pushing it.
  test('declares the characteristic once and names a service that carries no name', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowNamed(hap, 'Mains Power Lost');
    const service = addedService(accessory, hap, row);

    // act
    seedConfiguredName(hap, service, row.displayName);

    // assert
    assert.deepStrictEqual(carriedName(hap, service), { value: row.displayName, declared: 1 });
  });

  // A vendor-defined service declares `ConfiguredName` itself, so the seed must push onto it without
  // appending a second declaration.
  test('declares no second entry on a service whose definition already declares the characteristic', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowNamed(hap, 'Sump Mains Power');
    const service = addedService(accessory, hap, row);

    // act
    seedConfiguredName(hap, service, row.displayName);

    // assert
    assert.deepStrictEqual(carriedName(hap, service), { value: row.displayName, declared: 1 });
  });

  // HAP constructs a string characteristic it names no default for at the empty string, which is
  // what a service restored from the Homebridge cache with no name reads. That is an unnamed
  // service rather than a renamed one, so it earns the catalogue name.
  test('names a service carrying the characteristic at its construction default', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowNamed(hap, 'Mains Power Lost');
    const service = addedService(accessory, hap, row);
    service.addCharacteristic(hap.Characteristic.ConfiguredName);

    // act
    seedConfiguredName(hap, service, row.displayName);

    // assert
    assert.strictEqual(carriedName(hap, service).value, row.displayName);
  });

  // `ConfiguredName` is paired-write, and `Characteristic.serialize` writes its value into the
  // Homebridge accessory cache, so a name a controller wrote survives a restart. Writing on every
  // update would therefore not merely flicker: it would destroy a name the user set and expected to
  // keep, again on every poll, forever (D-14).
  test('leaves a name already on the service exactly as it is', () => {
    // arrange
    const hap = hapNamespace();
    const accessory = accessoryStandIn();
    const row = rowNamed(hap, 'Mains Power Lost');
    const service = addedService(accessory, hap, row);
    service.setCharacteristic(hap.Characteristic.ConfiguredName, USER_RENAME);

    // act
    seedConfiguredName(hap, service, row.displayName);

    // assert
    assert.strictEqual(carriedName(hap, service).value, USER_RENAME);
  });
});
