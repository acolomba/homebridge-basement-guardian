import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createFakeAccessory } from '../../features/support/fakeHomebridgeApi.js';
import { createBasementGuardianAccessory } from '../../src/accessories/basementGuardian.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
import { createServiceCatalogue } from '../../src/accessories/serviceCatalogue.js';

import type { FakeHapService, FakeServiceClass } from '../../features/support/fakeHap.js';
import type { FakeAccessory } from '../../features/support/fakeHomebridgeApi.js';
import type { BasementGuardianAccessory, BasementGuardianAccessoryOptions } from '../../src/accessories/basementGuardian.js';
import type { ServiceRow } from '../../src/accessories/serviceCatalogue.js';
import type { NotificationServiceKind, ServiceDescriptor } from '../../src/accessories/services.js';
import type { DeviceFamily } from '../../src/device/family.js';
import type { TrustScope } from '../../src/device/health.js';
import type { FamilyOutcome, FamilyRegistry } from '../../src/device/registry.js';
import type { DeviceSnapshot } from '../../src/device/state.js';
import type { API, Logging, PlatformAccessory } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const DEVICE_TYPE_ID = 'wayneWaterGemini';
const ACCESSORY_NAME = 'Sump System';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';

const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;

// Every scope the accessory degrades when no adapter resolves, in the stable order `untrusted` must
// expose them -- written independently of the production constant.
const DEGRADED_SCOPES: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault'];

// Every service this accessory publishes, in the catalogue's declared order.
const PUBLISHED_SERVICES: readonly ServiceDescriptor[] = [
  { kind: 'sump-pit-flood', subtype: 'sump-pit-flood', name: 'Sump Pit Flood' },
  { kind: 'sump-pit-level', subtype: 'sump-pit-level', name: 'Sump Pit Level' },
  { kind: 'primary-pump', subtype: 'primary-pump', name: 'Primary Pump' },
  { kind: 'primary-pump-running', subtype: 'primary-pump-running', name: 'Primary Pump Running' },
  { kind: 'backup-pump', subtype: 'backup-pump', name: 'Backup Pump' },
  { kind: 'backup-pump-activated', subtype: 'backup-pump-activated', name: 'Backup Pump Activated' },
  { kind: 'sump-mains-power', subtype: 'sump-mains-power', name: 'Sump Mains Power' },
  { kind: 'mains-power-lost', subtype: 'mains-power-lost', name: 'Mains Power Lost' },
  { kind: 'backup-battery', subtype: 'backup-battery', name: 'Backup Battery' },
  { kind: 'backup-battery', subtype: 'backup-battery', name: 'Backup Battery Facts' },
  { kind: 'primary-pump-fault', subtype: 'primary-pump-fault', name: 'Primary Pump Fault' },
  { kind: 'backup-pump-fault', subtype: 'backup-pump-fault', name: 'Backup Pump Fault' },
  { kind: 'water-sensor-fault', subtype: 'water-sensor-fault', name: 'Water Sensor Fault' },
  { kind: 'pump-controller-link-lost', subtype: 'pump-controller-link-lost', name: 'Pump Controller Link Lost' },
  { kind: 'basement-guardian-offline', subtype: 'basement-guardian-offline', name: 'Basement Guardian Offline' },
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

// Every module this plan writes under `src/accessories/`, read as source so a prohibited idiom
// fails here by name rather than through some downstream symptom.
const ACCESSORY_MODULES: readonly string[] = ['basementGuardian.ts', 'customCharacteristics.ts', 'customServices.ts', 'serviceCatalogue.ts'];

// The namespace holds no per-scenario state: a service and its characteristics live on the
// accessory that added them, so one stand-in serves every case.
const HAP = createFakeHap();

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];

const { MainsPowerPresent } = createCustomCharacteristics(HAP_NAMESPACE);
const CATALOGUE = createServiceCatalogue(HAP_NAMESPACE);

void ({
  deviceId: DEVICE_ID,
  services: [{ kind: 'sump-pit-flood', subtype: 'sump-pit-flood', name: 'Sump Pit Flood' }],
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

function registryWith(outcome: FamilyOutcome<unknown>): FamilyRegistry {
  return { lookup: () => outcome, shouldLog: () => true };
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

// The family-neutral decoded shape every adapter answers: one group per scope, absent when that
// scope's own fields did not validate.
function decodedState(mainsPresent?: boolean): Record<string, unknown> {
  return { metadata: { mcuFirmwareVersion: '1.2.3' }, ...(mainsPresent === undefined ? {} : { power: { mainsPresent } }) };
}

// A family that reports mains power until a case makes `ac_power` fail its shape, which is the one
// per-field failure this plan's rows read.
function powerFamily(mainsPresent?: boolean): DeviceFamily<unknown> {
  const violations = [{ field: 'ac_power', reason: 'missing' as const, scope: 'power' as const }];

  return fakeFamily({
    validate: () => (mainsPresent === undefined ? { valid: false, violations } : { valid: true }),
    decode: () => decodedState(mainsPresent),
  });
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
    basementGuardianAccessory.update(buildSnapshot());

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.untrusted,
      DEGRADED_SCOPES.map((scope) => ({ scope, reason: 'invalid', lastTrustedAt: undefined })),
    );
    assert.deepStrictEqual(basementGuardianAccessory.services, []);
    assert.strictEqual(accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value, beforeUpdate);
  });

  test('logs the degradation transition exactly once across repeated degraded updates', () => {
    // arrange
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log });

    // act
    basementGuardianAccessory.update(buildSnapshot());
    basementGuardianAccessory.update(buildSnapshot());
    basementGuardianAccessory.update(buildSnapshot());

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
    basementGuardianAccessory.update(buildSnapshot());
    basementGuardianAccessory.update(buildSnapshot());
    basementGuardianAccessory.update(buildSnapshot());

    // assert
    assert.strictEqual(warnings.length, 2);
  });

  test('publishes every service in catalogue order and marks each one active', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot());

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.services, PUBLISHED_SERVICES);
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    );
  });

  for (const mainsPresent of [true, false]) {
    test(`publishes a reported ac_power of ${String(mainsPresent)} on both power services`, () => {
      // arrange
      const accessory = accessoryStandIn();
      const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(mainsPresent) }) });

      // act
      basementGuardianAccessory.update(buildSnapshot());

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
    basementGuardianAccessory.update(buildSnapshot());

    // assert
    assert.strictEqual(valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState), CONTACT_NOT_DETECTED);
  });

  test('refreshes AccessoryInformation from the decoded metadata', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    const accessoryInformation = accessory.getService(HAP.Service.AccessoryInformation);

    // act
    basementGuardianAccessory.update(buildSnapshot());

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
      basementGuardianAccessory.update(buildSnapshot());

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
      basementGuardianAccessory.update(buildSnapshot());

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
      basementGuardianAccessory.update(buildSnapshot());
    }, Error);
  });

  test('adds no service and changes nothing on a second update with the same snapshot', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    basementGuardianAccessory.update(buildSnapshot());
    const firstServices = [...basementGuardianAccessory.services];
    const addServiceSpy = t.mock.method(accessory, 'addService');
    const removeServiceSpy = t.mock.method(accessory, 'removeService');

    // act
    basementGuardianAccessory.update(buildSnapshot());

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
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }));
    const beforeFailing = {
      reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
      adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
    };

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }));

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
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(undefined) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot());

    // assert
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SCOPES.map((scope) => scope !== 'power'),
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
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }));

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }));

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [{ scope: 'power', reason: 'invalid', lastTrustedAt: 1_700_000_000_000 }]);
  });

  test('reports no last trusted time for a scope that has never decoded', () => {
    // arrange
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith({ kind: 'implemented', family: powerFamily(undefined) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }));

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
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }));

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
    basementGuardianAccessory.update(buildSnapshot());

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
        basementGuardianAccessory.update(buildSnapshot({ connected: false }));
        readings.push(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState));
      }

      // assert
      assert.deepStrictEqual(readings, [...Array<unknown>(threshold - 1).fill(CONTACT_DETECTED), CONTACT_NOT_DETECTED]);
    });
  }

  test('takes the documented default of two consecutive disconnected polls', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false }));
    const afterOne = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }));

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
    basementGuardianAccessory.update(buildSnapshot({ connected: false }));
    basementGuardianAccessory.update(buildSnapshot({ connected: false }));

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: true }));
    const afterReconnect = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }));

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
      basementGuardianAccessory.update(buildSnapshot({ connected: false }));
    }

    basementGuardianAccessory.update(buildSnapshot({ connected: true }));

    // act
    const readings: unknown[] = [];

    for (let poll = 0; poll < 7; poll += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: false }));
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
      basementGuardianAccessory.update(buildSnapshot({ connected: true, data: { offline: true } }));
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
    basementGuardianAccessory.update(buildSnapshot());

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
    basementGuardianAccessory.update(buildSnapshot());

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
    published.update(buildSnapshot());
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const suppressed = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }), ignoredFaults });

    // act
    suppressed.update(buildSnapshot());

    // assert
    assert.strictEqual(accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost'), undefined);
  });

  test('applies the same suppression a second time without adding or removing a service', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }), ignoredFaults });
    basementGuardianAccessory.update(buildSnapshot());
    const addServiceSpy = t.mock.method(accessory, 'addService');
    const removeServiceSpy = t.mock.method(accessory, 'removeService');

    // act
    basementGuardianAccessory.update(buildSnapshot());

    // assert
    assert.deepStrictEqual({ added: addServiceSpy.mock.callCount(), removed: removeServiceSpy.mock.callCount() }, { added: 0, removed: 0 });
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
