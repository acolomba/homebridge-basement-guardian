import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createBasementGuardianAccessory } from '../../src/accessories/basementGuardian.js';

import type { BasementGuardianAccessory, BasementGuardianAccessoryOptions } from '../../src/accessories/basementGuardian.js';
import type { DeviceFamily } from '../../src/device/family.js';
import type { TrustScope } from '../../src/device/health.js';
import type { FamilyOutcome, FamilyRegistry } from '../../src/device/registry.js';
import type { DeviceSnapshot } from '../../src/device/state.js';
import type { API, Logging, PlatformAccessory } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const DEVICE_TYPE_ID = 'wayneWaterGemini';

// Every scope the accessory degrades, in the stable order `update()` must
// expose them -- written independently of the production constant.
const DEGRADED_SCOPES: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault'];

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

interface FakeIdentifier {
  readonly UUID: string;
}

const SERVICE_ACCESSORY_INFORMATION: FakeIdentifier = { UUID: 'fake-service-accessory-information' };
const CHARACTERISTIC_MANUFACTURER: FakeIdentifier = { UUID: 'fake-characteristic-manufacturer' };
const CHARACTERISTIC_MODEL: FakeIdentifier = { UUID: 'fake-characteristic-model' };
const CHARACTERISTIC_SERIAL_NUMBER: FakeIdentifier = { UUID: 'fake-characteristic-serial-number' };
const CHARACTERISTIC_FIRMWARE_REVISION: FakeIdentifier = { UUID: 'fake-characteristic-firmware-revision' };

const fakeHap = {
  Service: { AccessoryInformation: SERVICE_ACCESSORY_INFORMATION },
  Characteristic: {
    Manufacturer: CHARACTERISTIC_MANUFACTURER,
    Model: CHARACTERISTIC_MODEL,
    SerialNumber: CHARACTERISTIC_SERIAL_NUMBER,
    FirmwareRevision: CHARACTERISTIC_FIRMWARE_REVISION,
  },
};

// A minimal, hand-built stand-in for a HAP `Service`, backed by a `Map` a case can read back.
class FakeService {
  private readonly characteristics = new Map<string, unknown>();

  setCharacteristic(identifier: FakeIdentifier, value: unknown): this {
    this.characteristics.set(identifier.UUID, value);

    return this;
  }

  getCharacteristic(identifier: FakeIdentifier): unknown {
    return this.characteristics.get(identifier.UUID);
  }
}

// A minimal, hand-built stand-in for a HAP `PlatformAccessory`. `hasAccessoryInformation` lets one
// case prove the defensive throw when the service every real accessory carries is missing.
class FakeAccessory {
  readonly context: Record<string, unknown>;

  private readonly service = new FakeService();

  constructor(
    device: unknown,
    private readonly hasAccessoryInformation = true,
  ) {
    this.context = device === undefined ? {} : { device };
  }

  getService(identifier: FakeIdentifier): FakeService | undefined {
    return this.hasAccessoryInformation && identifier.UUID === SERVICE_ACCESSORY_INFORMATION.UUID ? this.service : undefined;
  }
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

function buildSnapshot(deviceTypeId: string, receivedAt = 0): DeviceSnapshot {
  return {
    identity: { deviceId: DEVICE_ID, deviceTypeId, name: 'Sump System', serialNumber: 'serial-1' },
    connectivity: { connected: true, timestamp: 0 },
    data: {},
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
    hap: fakeHap as unknown as API['hap'],
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
    decode: () => ({}),
    capabilities: () => [],
    command: () => ({ desiredData: {} }),
    ...overrides,
  };
}

describe('createBasementGuardianAccessory', () => {
  test('reads deviceId from the accessory context the platform set', () => {
    // arrange
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });

    // act
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory }));

    // assert
    assert.strictEqual(basementGuardianAccessory.deviceId, DEVICE_ID);
  });

  test('publishes no ServiceDescriptor-based service this phase', () => {
    // arrange
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });

    // act
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory }));

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.services, []);
  });

  test('exposes no untrusted scopes before any update() call', () => {
    // arrange
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });

    // act
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory }));

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, []);
  });

  test('throws when the accessory context carries no device identity', () => {
    // arrange
    const accessory = new FakeAccessory(undefined);

    // act & assert
    assert.throws(() => createBasementGuardianAccessory(buildOptions({ accessory })), Error);
  });

  test('throws when the accessory context itself is not a record', () => {
    // arrange
    const accessory = { context: null, getService: () => new FakeService() } as unknown as PlatformAccessory;

    // act & assert
    assert.throws(
      () =>
        createBasementGuardianAccessory({
          accessory,
          hap: fakeHap as unknown as API['hap'],
          registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }),
          log: silentLog(),
        }),
      Error,
    );
  });

  test('throws when the accessory context device carries a deviceId of the wrong type', () => {
    // arrange
    const accessory = new FakeAccessory({ deviceId: 12345, deviceTypeId: DEVICE_TYPE_ID });

    // act & assert
    assert.throws(() => createBasementGuardianAccessory(buildOptions({ accessory })), Error);
  });

  test('throws when the accessory context device carries a deviceTypeId of the wrong type', () => {
    // arrange
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: 12345 });

    // act & assert
    assert.throws(() => createBasementGuardianAccessory(buildOptions({ accessory })), Error);
  });

  test('degrades every non-connectivity scope when the registry reports no adapter for the deviceTypeId', () => {
    // arrange
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(
      buildOptions({ accessory, registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }) }),
    );
    const accessoryInformation = accessory.getService(SERVICE_ACCESSORY_INFORMATION);

    // act
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.strictEqual(accessoryInformation?.getCharacteristic(CHARACTERISTIC_MANUFACTURER), undefined);
    assert.deepStrictEqual(
      basementGuardianAccessory.untrusted,
      DEGRADED_SCOPES.map((scope) => ({ scope, reason: 'invalid', lastTrustedAt: undefined })),
    );
  });

  test('degrades every non-connectivity scope when validate() reports the snapshot invalid', () => {
    // arrange
    const family = fakeFamily({ validate: () => ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] }) });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));

    // act
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.untrusted,
      DEGRADED_SCOPES.map((scope) => ({ scope, reason: 'invalid', lastTrustedAt: undefined })),
    );
  });

  test('never calls decode() when validate() reports the snapshot invalid', (t) => {
    // arrange
    const decodeSpy = t.mock.fn(() => ({}));
    const family = fakeFamily({
      validate: () => ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] }),
      decode: decodeSpy,
    });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));

    // act
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.strictEqual(decodeSpy.mock.callCount(), 0);
  });

  test('produces the identical untrusted shape whether the family is unresolved or its validate() fails', () => {
    // arrange
    const family = fakeFamily({ validate: () => ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] }) });
    const unresolvedAccessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const invalidAccessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const unresolved = createBasementGuardianAccessory(
      buildOptions({ accessory: unresolvedAccessory, registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }) }),
    );
    const invalid = createBasementGuardianAccessory(buildOptions({ accessory: invalidAccessory, registry: registryWith({ kind: 'implemented', family }) }));

    // act
    unresolved.update(buildSnapshot(DEVICE_TYPE_ID));
    invalid.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.deepStrictEqual(unresolved.untrusted, invalid.untrusted);
  });

  test('populates AccessoryInformation from the decoded metadata when the family reports the snapshot valid', () => {
    // arrange
    const family = fakeFamily({ decode: () => ({ metadata: { mcuFirmwareVersion: '1.2.3' } }) });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));
    const accessoryInformation = accessory.getService(SERVICE_ACCESSORY_INFORMATION);

    // act
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.deepStrictEqual(
      {
        manufacturer: accessoryInformation?.getCharacteristic(CHARACTERISTIC_MANUFACTURER),
        model: accessoryInformation?.getCharacteristic(CHARACTERISTIC_MODEL),
        serialNumber: accessoryInformation?.getCharacteristic(CHARACTERISTIC_SERIAL_NUMBER),
        firmwareRevision: accessoryInformation?.getCharacteristic(CHARACTERISTIC_FIRMWARE_REVISION),
      },
      { manufacturer: 'Wayne', model: 'Gemini', serialNumber: 'serial-1', firmwareRevision: '1.2.3' },
    );
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, []);
  });

  test('defaults FirmwareRevision to "unknown" when the decoded state carries no mcuFirmwareVersion', () => {
    // arrange
    const family = fakeFamily({ decode: () => ({ metadata: {} }) });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));
    const accessoryInformation = accessory.getService(SERVICE_ACCESSORY_INFORMATION);

    // act
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.strictEqual(accessoryInformation?.getCharacteristic(CHARACTERISTIC_FIRMWARE_REVISION), 'unknown');
  });

  test('defaults FirmwareRevision to "unknown" when the decoded state carries no metadata at all', () => {
    // arrange
    const family = fakeFamily({ decode: () => ({}) });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));
    const accessoryInformation = accessory.getService(SERVICE_ACCESSORY_INFORMATION);

    // act
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.strictEqual(accessoryInformation?.getCharacteristic(CHARACTERISTIC_FIRMWARE_REVISION), 'unknown');
  });

  test('defaults FirmwareRevision to "unknown" when the family decodes a non-object state', () => {
    // arrange
    const family = fakeFamily({ decode: () => null });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));
    const accessoryInformation = accessory.getService(SERVICE_ACCESSORY_INFORMATION);

    // act
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.strictEqual(accessoryInformation?.getCharacteristic(CHARACTERISTIC_FIRMWARE_REVISION), 'unknown');
  });

  test('defaults FirmwareRevision to "unknown" when the family decodes an array', () => {
    // arrange
    const family = fakeFamily({ decode: () => [] });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));
    const accessoryInformation = accessory.getService(SERVICE_ACCESSORY_INFORMATION);

    // act
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.strictEqual(accessoryInformation?.getCharacteristic(CHARACTERISTIC_FIRMWARE_REVISION), 'unknown');
  });

  test('throws when the accessory carries no AccessoryInformation service', () => {
    // arrange
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }, false);
    const family = fakeFamily({});
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));

    // act & assert
    assert.throws(() => {
      basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));
    }, Error);
  });

  test('keeps AccessoryInformation unchanged after a degrading update follows a valid one', () => {
    // arrange
    const family = fakeFamily({ decode: () => ({ metadata: { mcuFirmwareVersion: '1.2.3' } }) });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));
    const accessoryInformation = accessory.getService(SERVICE_ACCESSORY_INFORMATION);
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));
    const beforeDegrading = accessoryInformation?.getCharacteristic(CHARACTERISTIC_FIRMWARE_REVISION);

    // act
    family.validate = () => ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] });
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.strictEqual(accessoryInformation?.getCharacteristic(CHARACTERISTIC_FIRMWARE_REVISION), beforeDegrading);
  });

  test('recovers from degraded state on a following family-valid update', () => {
    // arrange
    const family = fakeFamily({ validate: () => ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] }) });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));
    const accessoryInformation = accessory.getService(SERVICE_ACCESSORY_INFORMATION);
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // act
    family.validate = () => ({ valid: true });
    family.decode = () => ({ metadata: { mcuFirmwareVersion: '4.5.6' } });
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, []);
    assert.strictEqual(accessoryInformation?.getCharacteristic(CHARACTERISTIC_FIRMWARE_REVISION), '4.5.6');
  });

  test('sets lastTrustedAt on degradation to the receivedAt of the last family-valid snapshot', () => {
    // arrange
    const family = fakeFamily({ decode: () => ({}) });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const basementGuardianAccessory = createBasementGuardianAccessory(buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }) }));
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID, 1_700_000_000_000));

    // act
    family.validate = () => ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] });
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID, 1_700_000_060_000));

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.untrusted,
      DEGRADED_SCOPES.map((scope) => ({ scope, reason: 'invalid', lastTrustedAt: 1_700_000_000_000 })),
    );
  });

  test('logs the degradation transition exactly once across repeated degraded updates', () => {
    // arrange
    const family = fakeFamily({ validate: () => ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] }) });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = createBasementGuardianAccessory(
      buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }), log }),
    );

    // act
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.strictEqual(warnings.length, 1);
  });

  test('logs again after recovering and degrading a second time', () => {
    // arrange
    const family = fakeFamily({ validate: () => ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] }) });
    const accessory = new FakeAccessory({ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID });
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = createBasementGuardianAccessory(
      buildOptions({ accessory, registry: registryWith({ kind: 'implemented', family }), log }),
    );
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // act
    family.validate = () => ({ valid: true });
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));
    family.validate = () => ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] });
    basementGuardianAccessory.update(buildSnapshot(DEVICE_TYPE_ID));

    // assert
    assert.strictEqual(warnings.length, 2);
  });
});
