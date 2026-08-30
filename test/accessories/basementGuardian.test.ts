import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createFakeAccessory } from '../../features/support/fakeHomebridgeApi.js';
import { createBasementGuardianAccessory } from '../../src/accessories/basementGuardian.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
import { createServiceCatalogue } from '../../src/accessories/serviceCatalogue.js';
import { systemTimers } from '../../src/runtime/timers.js';

import type { FakeHapService, FakeServiceClass } from '../../features/support/fakeHap.js';
import type { FakeAccessory } from '../../features/support/fakeHomebridgeApi.js';
import type { BasementGuardianAccessory, BasementGuardianAccessoryOptions } from '../../src/accessories/basementGuardian.js';
import type { ServiceRow } from '../../src/accessories/serviceCatalogue.js';
import type { NotificationServiceKind, ServiceDescriptor } from '../../src/accessories/services.js';
import type { DeviceFamily, FieldViolation } from '../../src/device/family.js';
import type { TrustScope } from '../../src/device/health.js';
import type { FamilyOutcome, FamilyRegistry } from '../../src/device/registry.js';
import type { DeviceSnapshot } from '../../src/device/state.js';
import type { Timers } from '../../src/runtime/timers.js';
import type { API, Logging, PlatformAccessory } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const DEVICE_TYPE_ID = 'wayneWaterGemini';
const ACCESSORY_NAME = 'Sump System';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';

const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;
const LEAK_DETECTED = 1;

// The one legal water level code above the flood threshold, and the percentage the ladder maps it
// to (D-01, D-03).
const FLOODING_LEVEL_CODE = 31;
const FLOODING_LEVEL_PERCENT = 100;

// Every scope the accessory degrades when no adapter resolves, in the stable order `untrusted` must
// expose them -- written independently of the production constant.
const DEGRADED_SCOPES: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault'];

// The published HAP service type of every row, written out here rather than read off the catalogue,
// so a row that changed service type fails at the descriptor as well as behind it. The two backup
// battery rows share a kind and a subtype and differ only here, which is what makes the descriptor
// keyable.
const LEAK_SENSOR_UUID = '00000083-0000-1000-8000-0026BB765291';
const CONTACT_SENSOR_UUID = '00000080-0000-1000-8000-0026BB765291';
const BATTERY_UUID = '00000096-0000-1000-8000-0026BB765291';
const SUMP_PIT_SERVICE_UUID = 'ed31d704-44c8-4f20-9de0-6f29b33ef607';
const PUMP_SERVICE_UUID = '523f059e-deaa-4674-bbb2-980f9f7da7ec';
const SUMP_MAINS_POWER_SERVICE_UUID = 'fbb41424-0697-4ebe-ba89-7ba8ea254623';
const BACKUP_BATTERY_SERVICE_UUID = 'eb139c1e-aa1d-4318-bee9-60a338d99686';

// Every service this accessory publishes, in the catalogue's declared order.
const PUBLISHED_SERVICES: readonly ServiceDescriptor[] = [
  { kind: 'sump-pit-flood', subtype: 'sump-pit-flood', serviceUuid: LEAK_SENSOR_UUID, name: 'Sump Pit Flood' },
  { kind: 'sump-pit-level', subtype: 'sump-pit-level', serviceUuid: SUMP_PIT_SERVICE_UUID, name: 'Sump Pit Level' },
  { kind: 'primary-pump', subtype: 'primary-pump', serviceUuid: PUMP_SERVICE_UUID, name: 'Primary Pump' },
  { kind: 'primary-pump-running', subtype: 'primary-pump-running', serviceUuid: CONTACT_SENSOR_UUID, name: 'Primary Pump Running' },
  { kind: 'backup-pump', subtype: 'backup-pump', serviceUuid: PUMP_SERVICE_UUID, name: 'Backup Pump' },
  { kind: 'backup-pump-activated', subtype: 'backup-pump-activated', serviceUuid: CONTACT_SENSOR_UUID, name: 'Backup Pump Activated' },
  { kind: 'sump-mains-power', subtype: 'sump-mains-power', serviceUuid: SUMP_MAINS_POWER_SERVICE_UUID, name: 'Sump Mains Power' },
  { kind: 'mains-power-lost', subtype: 'mains-power-lost', serviceUuid: CONTACT_SENSOR_UUID, name: 'Mains Power Lost' },
  { kind: 'backup-battery', subtype: 'backup-battery', serviceUuid: BATTERY_UUID, name: 'Backup Battery' },
  { kind: 'backup-battery', subtype: 'backup-battery', serviceUuid: BACKUP_BATTERY_SERVICE_UUID, name: 'Backup Battery Facts' },
  { kind: 'primary-pump-fault', subtype: 'primary-pump-fault', serviceUuid: CONTACT_SENSOR_UUID, name: 'Primary Pump Fault' },
  { kind: 'backup-pump-fault', subtype: 'backup-pump-fault', serviceUuid: CONTACT_SENSOR_UUID, name: 'Backup Pump Fault' },
  { kind: 'water-sensor-fault', subtype: 'water-sensor-fault', serviceUuid: CONTACT_SENSOR_UUID, name: 'Water Sensor Fault' },
  { kind: 'pump-controller-link-lost', subtype: 'pump-controller-link-lost', serviceUuid: CONTACT_SENSOR_UUID, name: 'Pump Controller Link Lost' },
  { kind: 'basement-guardian-offline', subtype: 'basement-guardian-offline', serviceUuid: CONTACT_SENSOR_UUID, name: 'Basement Guardian Offline' },
];

// The scope each published service reads, in the same order, so a case can name the services one
// failing scope deactivates without restating the catalogue.
const PUBLISHED_SCOPES: readonly TrustScope[] = [
  'water',
  'water',
  'pump',
  'pump',
  'pump',
  'pump',
  'power',
  'power',
  'battery',
  'battery',
  'fault',
  'fault',
  'fault',
  'fault',
  'connectivity',
];

// The one row that keeps publishing while a lost controller link makes its own scope untrusted: the
// network module reports that link state directly, so the adapter for it stays truthful (D-11).
const CONTROLLER_LINK_ROW = 'Pump Controller Link Lost';

// Every published service that reads the `fault` scope, whether or not it is filed under it.
// `Sump Pit Level` reads the reported water sensor fault beside its level, and both pump services
// read their pump's own fault and fuse, so one bad `fault` field costs all three the right to call
// what they publish current (D-014).
const FAULT_READING_SERVICES: readonly string[] = [
  'Sump Pit Level',
  'Primary Pump',
  'Backup Pump',
  'Primary Pump Fault',
  'Backup Pump Fault',
  'Water Sensor Fault',
  CONTROLLER_LINK_ROW,
];

// The whole controller-link report, written out here rather than matched on a fragment, so a case
// asserts what an owner reads: the device it names, the condition, and what happens to the values.
const CONTROLLER_LINK_WARNING =
  `Lost the pump controller link on ${DEVICE_ID}: the vendor cloud still answers, so water, pump, power, ` +
  'battery, and fault values are retained rather than refreshed until the link returns.';

// Every module under `src/accessories/`, read as source so a prohibited idiom fails here by name
// rather than through some downstream symptom.
const ACCESSORY_MODULES: readonly string[] = ['basementGuardian.ts', 'customCharacteristics.ts', 'customServices.ts', 'serviceCatalogue.ts'];

// The namespace holds no per-scenario state: a service and its characteristics live on the
// accessory that added them, so one stand-in serves every case.
const HAP = createFakeHap();

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];

const { ControllerDataLastTrustedAt, ControllerLinkPresent, MainsPowerPresent } = createCustomCharacteristics(HAP_NAMESPACE);
const CATALOGUE = createServiceCatalogue(HAP_NAMESPACE);

void ({
  deviceId: DEVICE_ID,
  services: [{ kind: 'sump-pit-flood', subtype: 'sump-pit-flood', serviceUuid: LEAK_SENSOR_UUID, name: 'Sump Pit Flood' }],
  untrusted: [],
  update: () => undefined,
} satisfies BasementGuardianAccessory);

// @ts-expect-error the accessory is seeded by the immutable vendor identifier
void ({ services: [], untrusted: [], update: () => undefined } satisfies BasementGuardianAccessory);
// @ts-expect-error state reaches HomeKit through the update entry point alone
void ({ deviceId: DEVICE_ID, services: [], untrusted: [] } satisfies BasementGuardianAccessory);
// @ts-expect-error a published service is a keyed descriptor, not a bare name
void ({ deviceId: DEVICE_ID, services: ['sump-pit-flood'], untrusted: [], update: () => undefined } satisfies BasementGuardianAccessory);
// @ts-expect-error a degraded scope is a keyed descriptor, not a bare name
void ({ deviceId: DEVICE_ID, services: [], untrusted: ['water'], update: () => undefined } satisfies BasementGuardianAccessory);

// The one device identity a case asks for when it wants the platform to have set none at all.
const NO_DEVICE_CONTEXT = Symbol('no device context');

function accessoryStandIn(device: unknown = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }): FakeAccessory {
  const accessory = createFakeAccessory(ACCESSORY_NAME, ACCESSORY_UUID);

  if (device !== NO_DEVICE_CONTEXT) {
    accessory.context.device = device;
  }

  return accessory;
}

// The prohibitions are about what a module does, not what it explains: the module headers name both
// forbidden idioms precisely in order to forbid them, so the check reads the code without comments.
function codeOf(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function silentLog(): Logging {
  return Object.assign(() => undefined, {
    prefix: 'basement guardian',
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
    log: () => undefined,
    success: () => undefined,
    warn: () => undefined,
  });
}

// A `Logging` stand-in that records every `warn()` call, so a case can assert
// the degradation transition logs exactly once.
function recordingLog(): { log: Logging; warnings: string[] } {
  const warnings: string[] = [];
  const log = Object.assign(() => undefined, {
    prefix: 'basement guardian',
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
    log: () => undefined,
    success: () => undefined,
    warn: (message: string) => {
      warnings.push(message);
    },
  });

  return { log, warnings };
}

// A `Timers` stand-in that records every call and schedules nothing. The accessory takes the port
// and never reaches for it, so a case asserts this recorder stayed empty across a whole transition.
function recordingTimers(): { timers: Timers; calls: string[] } {
  const calls: string[] = [];
  const timers: Timers = {
    setTimeout: (_handler, delayMs) => {
      calls.push(`setTimeout ${String(delayMs)}`);

      return undefined;
    },
    setInterval: (_handler, delayMs) => {
      calls.push(`setInterval ${String(delayMs)}`);

      return undefined;
    },
    clearTimeout: () => {
      calls.push('clearTimeout');
    },
    clearInterval: () => {
      calls.push('clearInterval');
    },
  };

  return { timers, calls };
}

// A deliberately deferred variant of the same transition, private to this module and never a
// production option. Every immediacy layer is shown to catch it, which is what makes a green layer
// evidence that the accessory did not defer rather than evidence that the layer cannot tell.
function deferredTransition(timers: Timers, run: () => void): unknown {
  return timers.setTimeout(run, 0);
}

function registryWith(outcome: FamilyOutcome<unknown>): FamilyRegistry {
  return { lookup: () => outcome, shouldLog: () => true };
}

// Answers each outcome in turn and then repeats the last one, so a case drives a sequence of
// snapshots through one accessory without restating the registry.
function registryOver(outcomes: readonly FamilyOutcome<unknown>[]): FamilyRegistry {
  const remaining = [...outcomes];
  let latest = remaining[0] ?? { kind: 'unknown' as const, deviceTypeId: DEVICE_TYPE_ID };

  return {
    lookup: () => {
      latest = remaining.shift() ?? latest;

      return latest;
    },
    shouldLog: () => true,
  };
}

interface SnapshotOverrides {
  deviceTypeId?: string;
  receivedAt?: number;
  connected?: boolean;
  data?: Readonly<Record<string, unknown>>;
}

function buildSnapshot(overrides: SnapshotOverrides = {}): DeviceSnapshot {
  const { deviceTypeId = DEVICE_TYPE_ID, receivedAt = 0, connected = true, data = {} } = overrides;

  return {
    identity: { deviceId: DEVICE_ID, deviceTypeId, name: ACCESSORY_NAME, serialNumber: 'serial-1' },
    connectivity: { connected, timestamp: 0 },
    data,
    metadata: {},
    shadowVersion: undefined,
    deviceTimestamp: undefined,
    receivedAt,
  };
}

function buildOptions(
  overrides: Partial<Omit<BasementGuardianAccessoryOptions, 'accessory'>> & { accessory: FakeAccessory },
): BasementGuardianAccessoryOptions {
  const { accessory, ...rest } = overrides;

  return {
    hap: HAP_NAMESPACE,
    registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }),
    log: silentLog(),
    timers: recordingTimers().timers,
    ...rest,
    accessory: accessory as unknown as PlatformAccessory,
  };
}

function fakeFamily(overrides: Partial<DeviceFamily<unknown>>): DeviceFamily<unknown> {
  return {
    deviceTypeId: DEVICE_TYPE_ID,
    displayName: 'Wayne Water Gemini',
    implemented: true,
    validate: () => ({ valid: true }),
    decode: () => ({ metadata: {} }),
    capabilities: () => [],
    command: () => ({ desiredData: {} }),
    ...overrides,
  };
}

// The family-neutral decoded shape every adapter answers: one group per scope, and the `power`
// group absent when a case makes `ac_power` fail its shape. Every other group decodes, because a
// family omits only the scopes whose own fields did not validate (D-04).
function decodedState(mainsPresent?: boolean): Record<string, unknown> {
  return {
    metadata: { mcuFirmwareVersion: '1.2.3' },
    water: { levelCode: 0, levelPercent: 0, flooded: false },
    pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined },
    battery: { charging: true, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
    fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
    connectivity: { reportedOffline: false },
    ...(mainsPresent === undefined ? {} : { power: { mainsPresent } }),
  };
}

// A family that reports mains power until a case makes `ac_power` fail its shape, which is the one
// per-field failure the power rows read.
function powerFamily(mainsPresent?: boolean): DeviceFamily<unknown> {
  const violations = [{ field: 'ac_power', reason: 'missing' as const, scope: 'power' as const }];

  return fakeFamily({
    validate: () => (mainsPresent === undefined ? { valid: false, violations } : { valid: true }),
    decode: () => decodedState(mainsPresent),
  });
}

interface LinkOverrides {
  linkPresent: boolean;
  mainsPresent?: boolean;
  flooded?: boolean;
  violations?: readonly FieldViolation[];
}

// A family whose fault group reports the controller link state. `serial_communications` is a
// reported condition rather than a validation failure, so the whole payload keeps validating and
// every scope group decodes while the link is down -- which is what makes the distrust the
// accessory's own decision rather than a consequence of a failed field.
function linkFamily({ linkPresent, mainsPresent = true, flooded = false, violations = [] }: LinkOverrides): DeviceFamily<unknown> {
  return fakeFamily({
    validate: () => (violations.length === 0 ? { valid: true } : { valid: false, violations }),
    decode: () => ({
      metadata: { mcuFirmwareVersion: '1.2.3' },
      water: flooded ? { levelCode: FLOODING_LEVEL_CODE, levelPercent: FLOODING_LEVEL_PERCENT, flooded } : { levelCode: 0, levelPercent: 0, flooded },
      pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined },
      power: { mainsPresent },
      battery: { charging: true, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
      fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: linkPresent },
      connectivity: { reportedOffline: false },
    }),
  });
}

function linkOutcome(overrides: LinkOverrides): FamilyOutcome<unknown> {
  return { kind: 'implemented', family: linkFamily(overrides) };
}

function accessoryWith(accessory: FakeAccessory, overrides: Partial<Omit<BasementGuardianAccessoryOptions, 'accessory'>>): BasementGuardianAccessory {
  return createBasementGuardianAccessory(buildOptions({ accessory, ...overrides }));
}

// A service is resolved by the name HomeKit shows rather than by its subtype, because the two
// backup battery services share one subtype and differ only in their service type.
function rowNamed(displayName: string): ServiceRow {
  const row = CATALOGUE.find((candidate) => candidate.displayName === displayName);

  if (row === undefined) {
    throw new Error(`the catalogue publishes no ${displayName} row`);
  }

  return row;
}

function serviceOf(accessory: FakeAccessory, displayName: string): FakeHapService {
  const row = rowNamed(displayName);
  // The catalogue declares its classes against the real HAP types while the accessory stand-in
  // answers its own; the class is one runtime object, so the lookup needs the stand-in's view of it.
  const service = accessory.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);

  if (service === undefined) {
    throw new Error(`the accessory publishes no ${displayName} service`);
  }

  return service;
}

function valueOf(accessory: FakeAccessory, displayName: string, characteristic: { UUID: string }): unknown {
  return serviceOf(accessory, displayName).characteristics.find((candidate) => candidate.UUID === characteristic.UUID)?.value;
}

function statusActiveOf(accessory: FakeAccessory, displayName: string): unknown {
  return valueOf(accessory, displayName, HAP.Characteristic.StatusActive);
}

async function sourceOf(module: string): Promise<string> {
  return readFile(new URL(`../../../src/accessories/${module}`, import.meta.url), 'utf8');
}

describe('createBasementGuardianAccessory', () => {
  test('reads deviceId from the accessory context the platform set', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    const basementGuardianAccessory = accessoryWith(accessory, {});

    // assert
    assert.strictEqual(basementGuardianAccessory.deviceId, DEVICE_ID);
  });

  test('throws when the accessory context carries no device identity', () => {
    // arrange
    const accessory = accessoryStandIn(NO_DEVICE_CONTEXT);

    // act & assert
    assert.throws(() => accessoryWith(accessory, {}), Error);
  });

  test('throws when the accessory context itself is not a record', () => {
    // arrange
    // A context that is not a record at all, which no accessory stand-in can express because every
    // constructed accessory carries one. It reaches the identity guard and nothing further.
    const accessory = { context: null } as unknown as PlatformAccessory;

    // act & assert
    assert.throws(() => createBasementGuardianAccessory({ ...buildOptions({ accessory: accessoryStandIn() }), accessory }), Error);
  });

  test('throws when the accessory context device carries a deviceId of the wrong type', () => {
    // arrange
    const accessory = accessoryStandIn({ deviceId: 12345, deviceTypeId: DEVICE_TYPE_ID });

    // act & assert
    assert.throws(() => accessoryWith(accessory, {}), Error);
  });

  test('throws when the accessory context device carries a deviceTypeId of the wrong type', () => {
    // arrange
    const accessory = accessoryStandIn({ deviceId: DEVICE_ID, deviceTypeId: 12345 });

    // act & assert
    assert.throws(() => accessoryWith(accessory, {}), Error);
  });

  test('publishes no service and marks no scope untrusted before the first update', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    const basementGuardianAccessory = accessoryWith(accessory, {});

    // assert
    assert.deepStrictEqual({ services: basementGuardianAccessory.services, untrusted: basementGuardianAccessory.untrusted }, { services: [], untrusted: [] });
  });

  test('degrades every non-connectivity scope and publishes nothing when no adapter resolves', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }) });
    const accessoryInformation = accessory.getService(HAP.Service.AccessoryInformation);
    const beforeUpdate = accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value;

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.untrusted,
      DEGRADED_SCOPES.map((scope) => ({ scope, reason: 'invalid', lastTrustedAt: undefined })),
    );
    assert.deepStrictEqual(basementGuardianAccessory.services, []);
    assert.strictEqual(accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value, beforeUpdate);
  });

  test('deactivates every service derived from the profile and leaves the offline sensor active when the family stops resolving', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');
    const whileResolving = PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name));

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      whileResolving,
      PUBLISHED_SERVICES.map(() => true),
    );
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SCOPES.map((scope) => scope === 'connectivity'),
    );
  });

  test('confirms the device offline on the configured polls while the family does not resolve', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true }), { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    const afterOne = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterOne, afterTwo: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterOne: CONTACT_DETECTED, afterTwo: CONTACT_NOT_DETECTED },
    );
  });

  test('leaves the offline confirmation run untouched by a live update while the family does not resolve', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true }), { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'poll');

    // act
    for (let update = 0; update < 10; update += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'live');
    }

    // assert
    assert.strictEqual(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState), CONTACT_DETECTED);
  });

  test('retains the flood it published when the family stops resolving', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, flooded: true }), { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        flood: valueOf(accessory, 'Sump Pit Flood', HAP.Characteristic.LeakDetected),
        floodActive: statusActiveOf(accessory, 'Sump Pit Flood'),
        level: valueOf(accessory, 'Sump Pit Level', HAP.Characteristic.WaterLevel),
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
      },
      { flood: LEAK_DETECTED, floodActive: false, level: FLOODING_LEVEL_PERCENT, reported: true },
    );
  });

  test('adds no service when the family stops resolving before it ever resolved', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }) });
    const addServiceSpy = t.mock.method(accessory, 'addService');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual({ services: basementGuardianAccessory.services, added: addServiceSpy.mock.callCount() }, { services: [], added: 0 });
  });

  test('logs the degradation transition exactly once across repeated degraded updates', () => {
    // arrange
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.strictEqual(warnings.length, 1);
  });

  test('logs again after recovering and degrading a second time', () => {
    // arrange
    const family = fakeFamily({});
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID },
      { kind: 'implemented', family },
      { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID },
    ];
    const { log, warnings } = recordingLog();
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log, registry });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.strictEqual(warnings.length, 2);
  });

  test('asks the family for its verdict before it asks the family to decode', () => {
    // arrange
    const calls: string[] = [];
    const family = fakeFamily({
      validate: () => {
        calls.push('validate');

        return { valid: true };
      },
      decode: () => {
        calls.push('decode');

        return decodedState(true);
      },
    });
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith({ kind: 'implemented', family }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(calls, ['validate', 'decode']);
  });

  test('publishes every service in catalogue order and marks each one active', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.services, PUBLISHED_SERVICES);
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    );
  });

  test('keys every published service distinctly, including the two backup battery services', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      [...new Set(basementGuardianAccessory.services.map((descriptor) => `${descriptor.kind}/${descriptor.subtype}/${descriptor.serviceUuid}`))],
      PUBLISHED_SERVICES.map((descriptor) => `${descriptor.kind}/${descriptor.subtype}/${descriptor.serviceUuid}`),
    );
  });

  for (const mainsPresent of [true, false]) {
    test(`publishes a reported ac_power of ${String(mainsPresent)} on both power services`, () => {
      // arrange
      const accessory = accessoryStandIn();
      const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(mainsPresent) }) });

      // act
      basementGuardianAccessory.update(buildSnapshot(), 'poll');

      // assert
      assert.deepStrictEqual(
        {
          reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
          adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
          fault: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.StatusFault),
        },
        { reported: mainsPresent, adapter: mainsPresent ? CONTACT_DETECTED : CONTACT_NOT_DETECTED, fault: HAP.Characteristic.StatusFault.NO_FAULT },
      );
    });
  }

  test('publishes every value before update() returns, with no await and no tick', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(false) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.strictEqual(valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState), CONTACT_NOT_DETECTED);
  });

  test('refreshes AccessoryInformation from the decoded metadata', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    const accessoryInformation = accessory.getService(HAP.Service.AccessoryInformation);

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        manufacturer: accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value,
        model: accessoryInformation?.getCharacteristic(HAP.Characteristic.Model)?.value,
        serialNumber: accessoryInformation?.getCharacteristic(HAP.Characteristic.SerialNumber)?.value,
        firmwareRevision: accessoryInformation?.getCharacteristic(HAP.Characteristic.FirmwareRevision)?.value,
      },
      { manufacturer: 'Wayne', model: 'Gemini', serialNumber: 'serial-1', firmwareRevision: '1.2.3' },
    );
  });

  for (const { label, decoded } of [
    { label: 'the decoded metadata carries no mcuFirmwareVersion', decoded: { metadata: {} } },
    { label: 'the mcuFirmwareVersion is not text', decoded: { metadata: { mcuFirmwareVersion: 7 } } },
  ]) {
    test(`defaults FirmwareRevision to "unknown" when ${label}`, () => {
      // arrange
      const accessory = accessoryStandIn();
      const family = fakeFamily({ decode: () => decoded });
      const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family }) });

      // act
      basementGuardianAccessory.update(buildSnapshot(), 'poll');

      // assert
      assert.strictEqual(accessory.getService(HAP.Service.AccessoryInformation)?.getCharacteristic(HAP.Characteristic.FirmwareRevision)?.value, 'unknown');
    });
  }

  for (const { label, decoded } of [
    { label: 'decodes a non-object state', decoded: null },
    { label: 'decodes an array', decoded: [] },
    { label: 'omits the metadata group', decoded: {} },
    { label: 'decodes a metadata group that is not a record', decoded: { metadata: 'absent' } },
  ]) {
    test(`leaves AccessoryInformation untouched when the family ${label}`, () => {
      // arrange
      const accessory = accessoryStandIn();
      const family = fakeFamily({ decode: () => decoded });
      const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family }) });
      const accessoryInformation = accessory.getService(HAP.Service.AccessoryInformation);
      const beforeUpdate = accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value;

      // act
      basementGuardianAccessory.update(buildSnapshot(), 'poll');

      // assert
      assert.strictEqual(accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value, beforeUpdate);
    });
  }

  test('throws when the accessory carries no AccessoryInformation service', () => {
    // arrange
    const accessory = accessoryStandIn();
    const accessoryInformation = accessory.getService(HAP.Service.AccessoryInformation);
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    accessory.removeService(accessoryInformation ?? serviceOf(accessory, 'Sump Mains Power'));

    // act & assert
    assert.throws(() => {
      basementGuardianAccessory.update(buildSnapshot(), 'poll');
    }, Error);
  });

  test('adds no service and changes nothing on a second update with the same snapshot', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const firstServices = [...basementGuardianAccessory.services];
    const addServiceSpy = t.mock.method(accessory, 'addService');
    const removeServiceSpy = t.mock.method(accessory, 'removeService');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.services, firstServices);
    assert.deepStrictEqual({ added: addServiceSpy.mock.callCount(), removed: removeServiceSpy.mock.callCount() }, { added: 0, removed: 0 });
  });

  test('keeps the last trustworthy power values when ac_power stops validating', () => {
    // arrange
    const accessory = accessoryStandIn();
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'implemented', family: powerFamily(true) },
      { kind: 'implemented', family: powerFamily(undefined) },
    ];
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'implemented', family: powerFamily(undefined) }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');
    const beforeFailing = {
      reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
      adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
    };

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
      },
      beforeFailing,
    );
    assert.deepStrictEqual(beforeFailing, { reported: true, adapter: CONTACT_DETECTED });
  });

  test('deactivates only the services of the scope that stopped validating', () => {
    // arrange
    const accessory = accessoryStandIn();
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'implemented', family: powerFamily(true) },
      { kind: 'implemented', family: powerFamily(undefined) },
    ];
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'implemented', family: powerFamily(undefined) }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SCOPES.map((scope) => scope !== 'power'),
    );
  });

  test('deactivates every service that reads the fault scope when one fault field stops validating', () => {
    // arrange
    const accessory = accessoryStandIn();
    const violations: readonly FieldViolation[] = [{ field: 'backup_pump_fault', reason: 'wrong-type', scope: 'fault' }];
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: true, violations })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SERVICES.map((descriptor) => !FAULT_READING_SERVICES.includes(descriptor.name)),
    );
  });

  test('retains the quiet fault values it published while the fault scope is untrusted', () => {
    // arrange
    const accessory = accessoryStandIn();
    const { PumpFault, WaterSensorFaultReported } = createCustomCharacteristics(HAP_NAMESPACE);
    const violations: readonly FieldViolation[] = [{ field: 'backup_pump_fault', reason: 'wrong-type', scope: 'fault' }];
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: true, violations })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        primaryFault: valueOf(accessory, 'Primary Pump', PumpFault),
        primaryStatus: valueOf(accessory, 'Primary Pump', HAP.Characteristic.StatusFault),
        waterSensorFault: valueOf(accessory, 'Sump Pit Level', WaterSensorFaultReported),
        adapter: valueOf(accessory, 'Backup Pump Fault', HAP.Characteristic.ContactSensorState),
      },
      { primaryFault: false, primaryStatus: HAP.Characteristic.StatusFault.NO_FAULT, waterSensorFault: false, adapter: CONTACT_DETECTED },
    );
  });

  test('publishes no service for a scope whose fields have never validated', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(undefined) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.services,
      PUBLISHED_SERVICES.filter((_, index) => PUBLISHED_SCOPES[index] !== 'power'),
    );
    assert.deepStrictEqual(
      {
        reported: accessory.getServiceById(rowNamed('Sump Mains Power').serviceClass as unknown as FakeServiceClass, 'sump-mains-power'),
        adapter: accessory.getServiceById(rowNamed('Mains Power Lost').serviceClass as unknown as FakeServiceClass, 'mains-power-lost'),
      },
      { reported: undefined, adapter: undefined },
    );
  });

  test('publishes the service for a scope on the first update in which its fields validate', () => {
    // arrange
    const accessory = accessoryStandIn();
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'implemented', family: powerFamily(undefined) },
      { kind: 'implemented', family: powerFamily(false) },
    ];
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'implemented', family: powerFamily(false) }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.services, PUBLISHED_SERVICES);
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
      },
      { reported: false, adapter: CONTACT_NOT_DETECTED },
    );
  });

  test('reports the failing scope alone, timed at the last snapshot in which it decoded', () => {
    // arrange
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'implemented', family: powerFamily(true) },
      { kind: 'implemented', family: powerFamily(undefined) },
    ];
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'implemented', family: powerFamily(undefined) }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [{ scope: 'power', reason: 'invalid', lastTrustedAt: 1_700_000_000_000 }]);
  });

  test('reports no last trusted time for a scope that has never decoded', () => {
    // arrange
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith({ kind: 'implemented', family: powerFamily(undefined) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [{ scope: 'power', reason: 'invalid', lastTrustedAt: undefined }]);
  });

  test('reports the fault scope with no last trusted time when its own fields never validated', () => {
    // arrange
    const family = fakeFamily({
      validate: () => ({ valid: false, violations: [{ field: 'serial_communications', reason: 'missing', scope: 'fault' }] }),
      decode: () => decodedState(true),
    });
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith({ kind: 'implemented', family }) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [{ scope: 'fault', reason: 'invalid', lastTrustedAt: undefined }]);
  });

  test('records a violation on a field no service reads without deactivating any scope', () => {
    // arrange
    const family = fakeFamily({
      validate: () => ({ valid: false, violations: [{ field: 'alarm_audio_muted', reason: 'missing', scope: undefined }] }),
      decode: () => decodedState(true),
    });
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, []);
    assert.strictEqual(statusActiveOf(accessory, 'Sump Mains Power'), true);
  });

  for (const threshold of [1, 2, 8]) {
    test(`activates the offline adapter on disconnected poll ${String(threshold)} and not before`, () => {
      // arrange
      const accessory = accessoryStandIn();
      const basementGuardianAccessory = accessoryWith(accessory, {
        registry: registryWith({ kind: 'implemented', family: powerFamily(true) }),
        offlineConfirmationPollCount: threshold,
      });

      // act
      const readings: unknown[] = [];

      for (let poll = 0; poll < threshold; poll += 1) {
        basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
        readings.push(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState));
      }

      // assert
      assert.deepStrictEqual(readings, [...Array<unknown>(threshold - 1).fill(CONTACT_DETECTED), CONTACT_NOT_DETECTED]);
    });
  }

  for (const offlineConfirmationPollCount of [0, -1, 1.5, Number.NaN]) {
    test(`refuses an offline confirmation poll count of ${String(offlineConfirmationPollCount)} at construction`, () => {
      // arrange
      const accessory = accessoryStandIn();

      // act & assert
      assert.throws(() => accessoryWith(accessory, { offlineConfirmationPollCount }), Error);
    });
  }

  test('takes the documented default of two consecutive disconnected polls', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    const afterOne = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterOne, afterTwo: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterOne: CONTACT_DETECTED, afterTwo: CONTACT_NOT_DETECTED },
    );
  });

  test('resets the run on a connected poll, so the next disconnected one alone does not reactivate', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'poll');
    const afterReconnect = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterReconnect, afterOneMore: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterReconnect: CONTACT_DETECTED, afterOneMore: CONTACT_DETECTED },
    );
  });

  test('holds no backlog after a long outage, so one connected poll fully clears the run', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, {
      registry: registryWith({ kind: 'implemented', family: powerFamily(true) }),
      offlineConfirmationPollCount: 8,
    });

    for (let poll = 0; poll < 20; poll += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    }

    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'poll');

    // act
    const readings: unknown[] = [];

    for (let poll = 0; poll < 7; poll += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
      readings.push(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState));
    }

    // assert
    assert.deepStrictEqual(readings, Array<unknown>(7).fill(CONTACT_DETECTED));
  });

  test('never activates the offline adapter from the device reporting itself offline', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    for (let poll = 0; poll < 10; poll += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: true, data: { offline: true } }), 'poll');
    }

    // assert
    assert.strictEqual(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState), CONTACT_DETECTED);
  });

  test('publishes every service but the suppressed one, in catalogue order', () => {
    // arrange
    const accessory = accessoryStandIn();
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }), ignoredFaults });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.services,
      PUBLISHED_SERVICES.filter((descriptor) => descriptor.kind !== 'mains-power-lost'),
    );
    assert.strictEqual(accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost'), undefined);
  });

  test('leaves the decoded condition and every sibling service untouched by a suppression', () => {
    // arrange
    const accessory = accessoryStandIn();
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(false) }), ignoredFaults });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        active: statusActiveOf(accessory, 'Sump Mains Power'),
        offline: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState),
        untrusted: basementGuardianAccessory.untrusted,
      },
      { reported: false, active: true, offline: CONTACT_DETECTED, untrusted: [] },
    );
  });

  test('removes a service a previous run published once suppression begins', () => {
    // arrange
    const accessory = accessoryStandIn();
    const published = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    published.update(buildSnapshot(), 'poll');
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const suppressed = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }), ignoredFaults });

    // act
    suppressed.update(buildSnapshot(), 'poll');

    // assert
    assert.strictEqual(accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost'), undefined);
  });

  test('removes a suppressed sensor a previous run published while the family no longer resolves', () => {
    // arrange
    const accessory = accessoryStandIn();
    const published = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });
    published.update(buildSnapshot({ connected: true }), 'poll');
    const ignoredFaults: readonly NotificationServiceKind[] = ['basement-guardian-offline', 'mains-power-lost'];
    const restarted = accessoryWith(accessory, { registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }), ignoredFaults });

    // act
    restarted.update(buildSnapshot({ connected: false }), 'poll');
    restarted.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        offline: accessory.getServiceById(HAP.Service.ContactSensor, 'basement-guardian-offline'),
        mainsPowerLost: accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost'),
        primaryPumpFaultActive: statusActiveOf(accessory, 'Primary Pump Fault'),
      },
      { offline: undefined, mainsPowerLost: undefined, primaryPumpFaultActive: false },
    );
  });

  test('applies the same suppression a second time without adding or removing a service', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }), ignoredFaults });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const addServiceSpy = t.mock.method(accessory, 'addService');
    const removeServiceSpy = t.mock.method(accessory, 'removeService');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual({ added: addServiceSpy.mock.callCount(), removed: removeServiceSpy.mock.callCount() }, { added: 0, removed: 0 });
  });

  test('marks every controller-derived scope untrusted when the controller link is lost', () => {
    // arrange
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [
      { scope: 'water', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'pump', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'power', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'battery', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'fault', reason: 'controller-link-lost', lastTrustedAt: undefined },
    ]);
  });

  test('keeps a field violation at reason invalid while the controller link is lost', () => {
    // arrange
    const violations: readonly FieldViolation[] = [{ field: 'water_level', reason: 'out-of-domain', scope: 'water' }];
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith(linkOutcome({ linkPresent: false, violations })) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [
      { scope: 'water', reason: 'invalid', lastTrustedAt: undefined },
      { scope: 'pump', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'power', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'battery', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'fault', reason: 'controller-link-lost', lastTrustedAt: undefined },
    ]);
  });

  test('leaves connectivity trusted while the controller link is lost, because the cloud still answers', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SERVICES.map((descriptor, index) => descriptor.name === CONTROLLER_LINK_ROW || PUBLISHED_SCOPES[index] === 'connectivity'),
    );
  });

  test('publishes only the rows that can still vouch for themselves when the link is lost from the first poll', () => {
    // arrange
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.services,
      PUBLISHED_SERVICES.filter((descriptor, index) => descriptor.name === CONTROLLER_LINK_ROW || PUBLISHED_SCOPES[index] === 'connectivity'),
    );
  });

  test('keeps the controller link adapter reporting the lost link it observed directly', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        adapter: valueOf(accessory, CONTROLLER_LINK_ROW, HAP.Characteristic.ContactSensorState),
        reported: valueOf(accessory, CONTROLLER_LINK_ROW, ControllerLinkPresent),
      },
      { adapter: CONTACT_NOT_DETECTED, reported: false },
    );
  });

  test('retains the last controller-derived values published before the link was lost', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: false, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
      },
      { reported: true, adapter: CONTACT_DETECTED },
    );
  });

  test('times each poisoned scope at the last snapshot in which the controller link was present', () => {
    // arrange
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.untrusted.map((untrusted) => untrusted.lastTrustedAt),
      [1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_000],
    );
  });

  test('publishes the time controller data was last trustworthy beside the lost link state', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.strictEqual(valueOf(accessory, CONTROLLER_LINK_ROW, ControllerDataLastTrustedAt), '2023-11-14T22:13:20.000Z');
  });

  test('clears the controller-link distrust on the first snapshot in which the link returns', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: false, mainsPresent: false }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, []);
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SERVICES.map(() => true),
    );
    assert.strictEqual(valueOf(accessory, 'Sump Mains Power', MainsPowerPresent), false);
  });

  test('reports the controller link condition exactly once across three consecutive lost-link updates', () => {
    // arrange
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log, registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(warnings, [CONTROLLER_LINK_WARNING]);
  });

  test('reports the controller link condition again after a recovery and a later re-entry', () => {
    // arrange
    const { log, warnings } = recordingLog();
    const registry = registryOver([linkOutcome({ linkPresent: false }), linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log, registry });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(warnings, [CONTROLLER_LINK_WARNING, CONTROLLER_LINK_WARNING]);
  });

  test('does not call a lost controller link a validation failure', () => {
    // arrange
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log, registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      warnings.filter((warning) => warning.includes('stopped validating')),
      [],
    );
  });

  test('leaves the offline confirmation run untouched by ten disconnected live updates', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });

    // act
    for (let update = 0; update < 10; update += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'live');
    }

    const afterLiveUpdates = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterLiveUpdates, afterTwoPolls: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterLiveUpdates: CONTACT_DETECTED, afterTwoPolls: CONTACT_NOT_DETECTED },
    );
  });

  test('confirms offline on the configured polls despite a disconnected live update between them', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'live');
    const afterOnePoll = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterOnePoll, afterTwoPolls: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterOnePoll: CONTACT_DETECTED, afterTwoPolls: CONTACT_NOT_DETECTED },
    );
  });

  test('leaves a run of disconnected polls unreset by a connected live update between them', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'live');
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.strictEqual(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState), CONTACT_NOT_DETECTED);
  });

  test('publishes a live update on the same characteristics a poll update publishes', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'live');

    // assert
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
      },
      { reported: false, adapter: CONTACT_NOT_DETECTED },
    );
  });

  test('clears a safety condition on the same update that clears it in the source', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: false }), linkOutcome({ linkPresent: true, mainsPresent: true })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const whileActive = valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState);

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      { whileActive, afterClearing: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState) },
      { whileActive: CONTACT_NOT_DETECTED, afterClearing: CONTACT_DETECTED },
    );
  });

  test('records no call on the injected timer port across a source change to a published value', () => {
    // arrange
    const { timers, calls } = recordingTimers();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry, timers });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(calls, []);
  });

  test('calls no global scheduling function across a source change to a published value', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const setTimeoutSpy = t.mock.method(globalThis, 'setTimeout');
    const setIntervalSpy = t.mock.method(globalThis, 'setInterval');
    const setImmediateSpy = t.mock.method(globalThis, 'setImmediate');
    const queueMicrotaskSpy = t.mock.method(globalThis, 'queueMicrotask');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const scheduled = {
      setTimeout: setTimeoutSpy.mock.callCount(),
      setInterval: setIntervalSpy.mock.callCount(),
      setImmediate: setImmediateSpy.mock.callCount(),
      queueMicrotask: queueMicrotaskSpy.mock.callCount(),
    };

    // assert
    assert.deepStrictEqual(scheduled, { setTimeout: 0, setInterval: 0, setImmediate: 0, queueMicrotask: 0 });
  });

  test('carries the new value on the statement after update() returns, with no await and no tick', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const readImmediately = valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState);

    // assert
    assert.strictEqual(readImmediately, CONTACT_NOT_DETECTED);
  });

  test('the timer port layer catches a transition deferred through the injected port', () => {
    // arrange
    const accessory = accessoryStandIn();
    const { timers, calls } = recordingTimers();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry, timers });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    deferredTransition(timers, () => {
      basementGuardianAccessory.update(buildSnapshot(), 'poll');
    });

    // assert
    assert.deepStrictEqual(calls, ['setTimeout 0']);
  });

  test('the global spy layer catches a transition deferred through the process timers', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const setTimeoutSpy = t.mock.method(globalThis, 'setTimeout');

    // act
    const handle = deferredTransition(systemTimers, () => {
      basementGuardianAccessory.update(buildSnapshot(), 'poll');
    });
    systemTimers.clearTimeout(handle);

    // assert
    assert.strictEqual(setTimeoutSpy.mock.callCount(), 1);
  });

  test('the synchronous-visibility layer catches a transition deferred through the process timers', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    const handle = deferredTransition(systemTimers, () => {
      basementGuardianAccessory.update(buildSnapshot(), 'poll');
    });
    const readImmediately = valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState);
    systemTimers.clearTimeout(handle);

    // assert
    assert.strictEqual(readImmediately, CONTACT_DETECTED);
  });

  for (const module of ACCESSORY_MODULES) {
    test(`${module} signals no untrusted scope through an errored characteristic`, async () => {
      // act
      const code = codeOf(await sourceOf(module));

      // assert
      assert.strictEqual(code.includes('HapStatusError'), false);
    });

    test(`${module} registers no get handler, so a read never reaches the network`, async () => {
      // act
      const code = codeOf(await sourceOf(module));

      // assert
      assert.deepStrictEqual({ onGet: code.includes('onGet'), getEvent: /\.on\(\s*['"`]get/i.test(code) }, { onGet: false, getEvent: false });
    });

    test(`${module} derives no published identifier from a seed string`, async () => {
      // act
      const code = codeOf(await sourceOf(module));

      // assert
      assert.strictEqual(code.includes('uuid.generate'), false);
    });
  }
});
