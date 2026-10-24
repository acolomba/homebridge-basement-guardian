// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Steps that hold the HAP stand-in, and the accessory surface built on it, to their
 * own contract.
 *
 * Every safety assertion in this suite reads the plugin's HomeKit output through the stand-in, so a
 * stand-in that accepted a call shape production cannot make, or answered a default kinder than the
 * real HAP's, would turn each of those assertions into a false assurance. These steps pin the real
 * argument orders, the real duplicate refusals, and the real format defaults directly, so that
 * drift fails here rather than passing quietly somewhere downstream.
 */

import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

import { createFakeHap } from '../lib/hap.js';
import { createFakeAccessory } from '../lib/homebridgeApi.js';

import type { FakeHapCharacteristic, FakeHapService } from '../lib/hap.js';
import type { BasementGuardianWorld } from '../support/world.js';

const HAP = createFakeHap();

const CONTACT_SENSOR_UUID = '00000080-0000-1000-8000-0026BB765291';

const ACCESSORY_NAME = 'Sump System';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';

const SCRATCH_CHARACTERISTIC_MINIMUM = 3;

const FIRST_LEAK_CHARACTERISTIC = 'first leak detected characteristic';
const SECOND_LEAK_CHARACTERISTIC = 'second leak detected characteristic';

// The properties a fresh Leak Detected characteristic carries, as the real HAP declares them.
const LEAK_DETECTED_PROPS = { format: 'uint8', perms: ['ev', 'pr'], validValues: [0, 1] };

// A plugin declares its own HomeKit types by subclassing the injected namespace, so both bases must
// be constructible through the real argument orders. These two stand for a production type; nothing
// outside this module uses them (SAFE-08, D-17).
class ScratchCharacteristic extends HAP.Characteristic {
  static readonly UUID = 'placeholder-scratch-characteristic-uuid';

  constructor() {
    super('Scratch Reading', ScratchCharacteristic.UUID, {
      format: HAP.Formats.UINT8,
      perms: [HAP.Perms.PAIRED_READ, HAP.Perms.NOTIFY],
      minValue: SCRATCH_CHARACTERISTIC_MINIMUM,
      maxValue: 9,
      minStep: 1,
    });
  }
}

class ScratchService extends HAP.Service {
  static readonly UUID = 'placeholder-scratch-service-uuid';

  constructor(displayName?: string, subtype?: string) {
    super(displayName, ScratchService.UUID, subtype);

    this.addCharacteristic(ScratchCharacteristic);
  }
}

function identifiersOf(namespace: object): Record<string, string> {
  const entries: [string, unknown][] = Object.entries(namespace);
  const identifiers: Record<string, string> = {};

  for (const [name, member] of entries) {
    if (typeof member !== 'function' || !('UUID' in member) || typeof member.UUID !== 'string') {
      throw new Error(`invalid HAP type ${name}`);
    }

    identifiers[name] = member.UUID;
  }

  return identifiers;
}

function assertStandardIdentifiers(): void {
  assert.deepStrictEqual(
    { characteristics: identifiersOf(HAP.Characteristic), services: identifiersOf(HAP.Service) },
    {
      characteristics: {
        Manufacturer: '00000020-0000-1000-8000-0026BB765291',
        Model: '00000021-0000-1000-8000-0026BB765291',
        SerialNumber: '00000030-0000-1000-8000-0026BB765291',
        FirmwareRevision: '00000052-0000-1000-8000-0026BB765291',
        Name: '00000023-0000-1000-8000-0026BB765291',
        ConfiguredName: '000000E3-0000-1000-8000-0026BB765291',
        Identify: '00000014-0000-1000-8000-0026BB765291',
        LeakDetected: '00000070-0000-1000-8000-0026BB765291',
        ContactSensorState: '0000006A-0000-1000-8000-0026BB765291',
        WaterLevel: '000000B5-0000-1000-8000-0026BB765291',
        StatusActive: '00000075-0000-1000-8000-0026BB765291',
        StatusFault: '00000077-0000-1000-8000-0026BB765291',
        StatusLowBattery: '00000079-0000-1000-8000-0026BB765291',
        BatteryLevel: '00000068-0000-1000-8000-0026BB765291',
        ChargingState: '0000008F-0000-1000-8000-0026BB765291',
        On: '00000025-0000-1000-8000-0026BB765291',
      },
      services: {
        AccessoryInformation: '0000003E-0000-1000-8000-0026BB765291',
        LeakSensor: '00000083-0000-1000-8000-0026BB765291',
        ContactSensor: '00000080-0000-1000-8000-0026BB765291',
        Battery: '00000096-0000-1000-8000-0026BB765291',
        Switch: '00000049-0000-1000-8000-0026BB765291',
      },
    },
  );
}

function recalledCharacteristic(world: BasementGuardianWorld, name: string): FakeHapCharacteristic {
  const characteristic = world.recall(name);

  if (!(characteristic instanceof HAP.Characteristic)) {
    throw new Error(`the ${name} is not a hap characteristic`);
  }

  return characteristic;
}

function leakDetectedPropsOf(characteristic: FakeHapCharacteristic): unknown {
  const { format, perms, validValues } = characteristic.props;

  return { format, perms, validValues };
}

Given('two leak detected characteristics', function (this: BasementGuardianWorld): void {
  const first = new HAP.Characteristic.LeakDetected();
  const second = new HAP.Characteristic.LeakDetected();

  assert.deepStrictEqual([leakDetectedPropsOf(first), leakDetectedPropsOf(second)], [LEAK_DETECTED_PROPS, LEAK_DETECTED_PROPS]);
  this.remember(FIRST_LEAK_CHARACTERISTIC, first);
  this.remember(SECOND_LEAK_CHARACTERISTIC, second);
});

When('a plugin changes the format, perms, and valid values of the first one', function (this: BasementGuardianWorld): void {
  const first = recalledCharacteristic(this, FIRST_LEAK_CHARACTERISTIC);
  const originalFormat = first.props.format;
  // The public props are readonly; this step mutates them to check that instances do not share arrays.
  // Keep each array reference so the release can restore shared data in place if they are shared.
  const mutablePerms = first.props.perms as string[];
  const mutableValidValues = (first.props.validValues ?? []) as number[];
  const originalPerms = [...mutablePerms];
  const originalValidValues = [...mutableValidValues];

  this.onRelease(() => {
    first.props.format = originalFormat;
    mutablePerms.splice(0, mutablePerms.length, ...originalPerms);
    mutableValidValues.splice(0, mutableValidValues.length, ...originalValidValues);

    return Promise.resolve();
  });
  first.props.format = HAP.Formats.STRING;
  mutablePerms.pop();
  mutableValidValues.pop();
});

Then('the hap stand-in carries the standard service and characteristic identifiers', () => {
  assertStandardIdentifiers();
});

Then('the hap stand-in carries the standard state and status values', () => {
  assert.deepStrictEqual(
    {
      leak: [HAP.Characteristic.LeakDetected.LEAK_NOT_DETECTED, HAP.Characteristic.LeakDetected.LEAK_DETECTED],
      contact: [HAP.Characteristic.ContactSensorState.CONTACT_DETECTED, HAP.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED],
      fault: [HAP.Characteristic.StatusFault.NO_FAULT, HAP.Characteristic.StatusFault.GENERAL_FAULT],
      battery: [HAP.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL, HAP.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW],
      charging: [HAP.Characteristic.ChargingState.NOT_CHARGING, HAP.Characteristic.ChargingState.CHARGING, HAP.Characteristic.ChargingState.NOT_CHARGEABLE],
      status: HAP.HAPStatus,
    },
    {
      leak: [0, 1],
      contact: [0, 1],
      fault: [0, 1],
      battery: [0, 1],
      charging: [0, 1, 2],
      status: {
        SUCCESS: 0,
        SERVICE_COMMUNICATION_FAILURE: -70402,
        RESOURCE_BUSY: -70403,
        OPERATION_TIMED_OUT: -70408,
        NOT_ALLOWED_IN_CURRENT_STATE: -70412,
      },
    },
  );
});

function assertFormatsPermsAndUnits(): void {
  assert.deepStrictEqual(
    { formats: HAP.Formats, perms: HAP.Perms, units: HAP.Units },
    {
      formats: { BOOL: 'bool', UINT8: 'uint8', UINT32: 'uint32', STRING: 'string', FLOAT: 'float' },
      perms: { PAIRED_READ: 'pr', PAIRED_WRITE: 'pw', NOTIFY: 'ev' },
      units: { PERCENTAGE: 'percentage' },
    },
  );
}

Then('the hap stand-in carries the formats, perms, and units the plugin reads', () => {
  assertFormatsPermsAndUnits();
});

function assertScratchTypeConstructs(): void {
  const scratchService = new ScratchService('Scratch Service', 'scratch');

  assert.deepEqual(
    {
      uuid: scratchService.UUID,
      subtype: scratchService.subtype,
      name: scratchService.getCharacteristic(HAP.Characteristic.Name).value,
      reading: scratchService.getCharacteristic(ScratchCharacteristic).value,
    },
    { uuid: ScratchService.UUID, subtype: 'scratch', name: 'Scratch Service', reading: SCRATCH_CHARACTERISTIC_MINIMUM },
  );
}

Then('a plugin type extends the hap service and the hap characteristic', () => {
  assertScratchTypeConstructs();
});

Then('the second one keeps its own format, perms, and valid values', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(leakDetectedPropsOf(recalledCharacteristic(this, SECOND_LEAK_CHARACTERISTIC)), LEAK_DETECTED_PROPS);
});

function characteristicStateOf(characteristic: FakeHapCharacteristic): { value: unknown; pushed: boolean; statusCode: number } {
  return { value: characteristic.value, pushed: characteristic.pushed, statusCode: characteristic.statusCode };
}

interface StandardServiceInstances {
  leakSensor: FakeHapService;
  contactSensor: FakeHapService;
  battery: FakeHapService;
  switchService: FakeHapService;
}

function standardServiceInstances(): StandardServiceInstances {
  return {
    leakSensor: new HAP.Service.LeakSensor('Sump Pit Flood', 'sump-pit-flood'),
    contactSensor: new HAP.Service.ContactSensor('Mains Power Lost', 'mains-power-lost'),
    battery: new HAP.Service.Battery('Backup Battery Level', 'backup-battery'),
    switchService: new HAP.Service.Switch('System Self-Test', 'system-self-test'),
  };
}

// The real HAP creates each characteristic at its format default, and for this plugin those
// defaults are the good-news values: a sensor published before the first valid decode would read
// "no leak", "contact detected", and "battery normal". `StatusActive` defaults to false, the one
// default that is honest. The accessory never relies on that: it adds no service until its row has
// a value to vouch for, and pushes `StatusActive` on every service it does add (D-05, D-014).
function assertFormatDefaults(): void {
  const { leakSensor, contactSensor, battery, switchService } = standardServiceInstances();

  assert.deepStrictEqual(
    {
      leak: characteristicStateOf(leakSensor.getCharacteristic(HAP.Characteristic.LeakDetected)),
      contact: characteristicStateOf(contactSensor.getCharacteristic(HAP.Characteristic.ContactSensorState)),
      lowBattery: characteristicStateOf(battery.getCharacteristic(HAP.Characteristic.StatusLowBattery)),
      active: characteristicStateOf(leakSensor.addCharacteristic(HAP.Characteristic.StatusActive)),
      fault: characteristicStateOf(leakSensor.addCharacteristic(HAP.Characteristic.StatusFault)),
      waterLevel: characteristicStateOf(new HAP.Characteristic.WaterLevel()),
      batteryLevel: characteristicStateOf(battery.getCharacteristic(HAP.Characteristic.BatteryLevel)),
      charging: characteristicStateOf(battery.getCharacteristic(HAP.Characteristic.ChargingState)),
      on: characteristicStateOf(switchService.getCharacteristic(HAP.Characteristic.On)),
    },
    {
      leak: { value: 0, pushed: false, statusCode: 0 },
      contact: { value: 0, pushed: false, statusCode: 0 },
      lowBattery: { value: 0, pushed: false, statusCode: 0 },
      active: { value: false, pushed: false, statusCode: 0 },
      fault: { value: 0, pushed: false, statusCode: 0 },
      waterLevel: { value: 0, pushed: false, statusCode: 0 },
      batteryLevel: { value: 0, pushed: false, statusCode: 0 },
      charging: { value: 0, pushed: false, statusCode: 0 },
      on: { value: false, pushed: false, statusCode: 0 },
    },
  );
}

Then('fresh hap characteristics read at their format defaults', () => {
  assertFormatDefaults();
});

// The real HAP starts four Accessory Information strings at named defaults. ConfiguredName starts
// empty, which is the value the seeding rule checks before it writes a service name. These defaults
// keep an untouched fake service from answering a value the real HAP would not.
function assertAccessoryInformationDefaults(): void {
  const accessoryInformation = new HAP.Service.AccessoryInformation('Sump System');

  assert.deepEqual(
    {
      manufacturer: accessoryInformation.getCharacteristic(HAP.Characteristic.Manufacturer).value,
      model: accessoryInformation.getCharacteristic(HAP.Characteristic.Model).value,
      serialNumber: accessoryInformation.getCharacteristic(HAP.Characteristic.SerialNumber).value,
      firmwareRevision: accessoryInformation.getCharacteristic(HAP.Characteristic.FirmwareRevision).value,
      name: accessoryInformation.getCharacteristic(HAP.Characteristic.Name).value,
      configuredName: accessoryInformation.getCharacteristic(HAP.Characteristic.ConfiguredName).value,
    },
    {
      manufacturer: 'Default-Manufacturer',
      model: 'Default-Model',
      serialNumber: 'Default-SerialNumber',
      firmwareRevision: '0.0.0',
      name: 'Sump System',
      configuredName: '',
    },
  );
}

Then('a fresh accessory information service reads at the hap string defaults', () => {
  assertAccessoryInformationDefaults();
});

function optionalUuidsOf(service: FakeHapService): string[] {
  return service.optionalCharacteristics.map((characteristic) => characteristic.UUID);
}

// The accessory pushes `StatusActive` onto every service it publishes, and `publishValue` declares
// a characteristic first only when the service neither carries nor declares it. A stand-in whose
// standard services declared nothing would send every one of those pushes through the declaring
// branch while production took the other one, so the guard would be proven on a path it never runs
// on. Apple's sensor definitions declare both status characteristics; the Battery definition
// declares neither, which keeps the declaring branch reachable here.
function assertStandardOptionalDeclarations(): void {
  const accessoryInformation = new HAP.Service.AccessoryInformation('Sump System');
  const { leakSensor, contactSensor, battery, switchService } = standardServiceInstances();

  assert.deepStrictEqual(
    {
      accessoryInformation: optionalUuidsOf(accessoryInformation),
      leak: optionalUuidsOf(leakSensor),
      contact: optionalUuidsOf(contactSensor),
      battery: optionalUuidsOf(battery),
      switch: optionalUuidsOf(switchService),
    },
    {
      accessoryInformation: [HAP.Characteristic.ConfiguredName.UUID],
      leak: [HAP.Characteristic.Name.UUID, HAP.Characteristic.StatusActive.UUID, HAP.Characteristic.StatusFault.UUID, HAP.Characteristic.StatusLowBattery.UUID],
      contact: [
        HAP.Characteristic.Name.UUID,
        HAP.Characteristic.StatusActive.UUID,
        HAP.Characteristic.StatusFault.UUID,
        HAP.Characteristic.StatusLowBattery.UUID,
      ],
      battery: [HAP.Characteristic.BatteryLevel.UUID, HAP.Characteristic.ChargingState.UUID, HAP.Characteristic.Name.UUID],
      switch: [HAP.Characteristic.Name.UUID],
    },
  );
}

Then('the standard hap services declare their optional characteristics', () => {
  assertStandardOptionalDeclarations();
});

function assertUpdateAddsTheCharacteristicItNames(): void {
  const contactSensor = new HAP.Service.ContactSensor('Water Sensor Fault', 'water-sensor-fault');
  const before = contactSensor.testCharacteristic(HAP.Characteristic.StatusActive);
  const characteristicClass = HAP.Characteristic.StatusActive;

  contactSensor.updateCharacteristic(characteristicClass, new HAP.HapStatusError(HAP.HAPStatus.RESOURCE_BUSY));
  const stateAfterError = characteristicStateOf(contactSensor.getCharacteristic(characteristicClass));
  contactSensor.updateCharacteristic(characteristicClass, true);

  assert.deepStrictEqual(
    {
      before,
      stateAfterError,
      after: contactSensor.testCharacteristic(characteristicClass),
      state: characteristicStateOf(contactSensor.getCharacteristic(characteristicClass)),
    },
    {
      before: false,
      stateAfterError: { value: false, pushed: false, statusCode: HAP.HAPStatus.RESOURCE_BUSY },
      after: true,
      state: { value: true, pushed: true, statusCode: 0 },
    },
  );
}

Then('the service adds the characteristic an update names', () => {
  assertUpdateAddsTheCharacteristicItNames();
});

// The real `addOptionalCharacteristic` is not idempotent: two calls push two entries. Production
// guards against the second call, so the stand-in has to be able to record one. The standard
// Battery service declares neither status characteristic, so its own declarations cannot be
// mistaken for the two appended here.
function assertOptionalCharacteristicsAppend(): void {
  const battery = new HAP.Service.Battery('Backup Battery Level', 'backup-battery');

  battery.addOptionalCharacteristic(HAP.Characteristic.StatusFault);
  battery.addOptionalCharacteristic(HAP.Characteristic.StatusFault);

  assert.deepStrictEqual(optionalUuidsOf(battery), [
    HAP.Characteristic.BatteryLevel.UUID,
    HAP.Characteristic.ChargingState.UUID,
    HAP.Characteristic.Name.UUID,
    HAP.Characteristic.StatusFault.UUID,
    HAP.Characteristic.StatusFault.UUID,
  ]);
}

Then('the service appends an optional characteristic on every call', () => {
  assertOptionalCharacteristicsAppend();
});

async function assertStatusForms(): Promise<void> {
  const service = new HAP.Service.Switch('System Self-Test', 'system-self-test');
  const on = service.getCharacteristic(HAP.Characteristic.On);
  const unknownStatus = new HAP.HapStatusError(0).hapStatus;

  service.updateCharacteristic(HAP.Characteristic.On, new Error('-70412'));
  const numericMessageStatus = on.statusCode;
  service.updateCharacteristic(HAP.Characteristic.On, new Error('-70401'));
  const upperNumericMessageStatus = on.statusCode;
  service.updateCharacteristic(HAP.Characteristic.On, new Error('not a status'));
  const plainErrorStatus = on.statusCode;
  // Seed a different status so each fallback must store its own result.
  on.statusCode = -70408;
  on.onSet(() => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- HAP accepts bare numeric handler statuses
    throw 0;
  });
  const thrownNumberStatus: unknown = await on.handleSetRequest(true).then(
    () => undefined,
    (status: unknown) => status,
  );
  const storedThrownNumberStatus = on.statusCode;
  on.onSet(() => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- HAP accepts bare numeric handler statuses
    throw -70408;
  });
  const knownThrownNumberStatus: unknown = await on.handleSetRequest(true).then(
    () => undefined,
    (status: unknown) => status,
  );
  const storedKnownThrownNumberStatus = on.statusCode;
  on.statusCode = -70408;
  on.onSet(() => {
    throw new Error('-70412');
  });
  const thrownNumericMessageStatus: unknown = await on.handleSetRequest(true).then(
    () => undefined,
    (status: unknown) => status,
  );
  const storedThrownNumericMessageStatus = on.statusCode;
  on.statusCode = -70408;
  on.onSet(() => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- HAP accepts bare numeric handler statuses
    throw -70413;
  });
  const belowRangeThrownStatus: unknown = await on.handleSetRequest(true).then(
    () => undefined,
    (status: unknown) => status,
  );
  const storedBelowRangeThrownStatus = on.statusCode;

  assert.deepStrictEqual(
    {
      unknownStatus,
      numericMessageStatus,
      upperNumericMessageStatus,
      plainErrorStatus,
      thrownNumberStatus,
      storedThrownNumberStatus,
      knownThrownNumberStatus,
      storedKnownThrownNumberStatus,
      thrownNumericMessageStatus,
      storedThrownNumericMessageStatus,
      belowRangeThrownStatus,
      storedBelowRangeThrownStatus,
    },
    {
      unknownStatus: -70402,
      numericMessageStatus: -70412,
      upperNumericMessageStatus: -70401,
      plainErrorStatus: -70402,
      thrownNumberStatus: -70402,
      storedThrownNumberStatus: -70402,
      knownThrownNumberStatus: -70408,
      storedKnownThrownNumberStatus: -70408,
      thrownNumericMessageStatus: -70402,
      storedThrownNumericMessageStatus: -70402,
      belowRangeThrownStatus: -70402,
      storedBelowRangeThrownStatus: -70402,
    },
  );
}

Then('the fake hap answers the real status for each error form', async () => {
  await assertStatusForms();
});

Then('the service refuses a duplicate characteristic', () => {
  const contactSensor = new HAP.Service.ContactSensor('Mains Power Lost', 'mains-power-lost');
  const characteristicClass = HAP.Characteristic.ContactSensorState;
  const before = contactSensor.characteristics.map((characteristic) => characteristic.UUID);

  assert.throws(
    () => contactSensor.addCharacteristic(characteristicClass),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.strictEqual(
        error.message,
        `Cannot add a Characteristic with the same UUID as another Characteristic in this Service: ${characteristicClass.UUID}`,
      );

      return true;
    },
  );
  assert.deepStrictEqual(
    contactSensor.characteristics.map((characteristic) => characteristic.UUID),
    before,
  );
});

Then('a service lookup adds the missing characteristic', () => {
  const contactSensor = new HAP.Service.ContactSensor('Mains Power Lost', 'mains-power-lost');
  const characteristicClass = HAP.Characteristic.StatusActive;
  const before = contactSensor.testCharacteristic(characteristicClass);
  const characteristic = contactSensor.getCharacteristic(characteristicClass);

  assert.deepStrictEqual(
    {
      before,
      uuid: characteristic.UUID,
      value: characteristic.value,
      pushed: characteristic.pushed,
      after: contactSensor.testCharacteristic(characteristicClass),
      count: contactSensor.characteristics.filter((current) => current.UUID === characteristicClass.UUID).length,
    },
    { before: false, uuid: characteristicClass.UUID, value: false, pushed: false, after: true, count: 1 },
  );
});

Then('setting a service characteristic calls its write handler', async () => {
  const switchService = new HAP.Service.Switch('System Self-Test', 'system-self-test');
  const received: unknown[] = [];

  switchService.getCharacteristic(HAP.Characteristic.On).onSet((value) => {
    received.push(value);
  });

  const returned = switchService.setCharacteristic(HAP.Characteristic.On, true);
  await Promise.resolve();

  assert.deepStrictEqual(
    { received, returnedSelf: returned === switchService, state: characteristicStateOf(switchService.getCharacteristic(HAP.Characteristic.On)) },
    { received: [true], returnedSelf: true, state: { value: true, pushed: false, statusCode: 0 } },
  );
});

Then('a refused service set preserves the prior value and stores its status', async () => {
  const switchService = new HAP.Service.Switch('System Self-Test', 'system-self-test');
  const on = switchService.getCharacteristic(HAP.Characteristic.On);
  switchService.updateCharacteristic(HAP.Characteristic.On, false);
  on.onSet(() => Promise.reject(new HAP.HapStatusError(HAP.HAPStatus.RESOURCE_BUSY)));
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown): void => {
    unhandled.push(reason);
  };

  process.on('unhandledRejection', onUnhandled);

  try {
    const returned = switchService.setCharacteristic(HAP.Characteristic.On, true);
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });

    assert.deepStrictEqual(
      { returnedSelf: returned === switchService, state: characteristicStateOf(on), unhandled },
      { returnedSelf: true, state: { value: false, pushed: true, statusCode: HAP.HAPStatus.RESOURCE_BUSY }, unhandled: [] },
    );
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
});

Then('the accessory information service carries its unnamed service name', () => {
  const accessoryInformation = new HAP.Service.AccessoryInformation();
  const hasName = accessoryInformation.testCharacteristic(HAP.Characteristic.Name);
  const name = accessoryInformation.getCharacteristic(HAP.Characteristic.Name).value;
  const declaresConfiguredName = accessoryInformation.optionalCharacteristics.some(
    (characteristic) => characteristic.UUID === HAP.Characteristic.ConfiguredName.UUID,
  );

  assert.deepStrictEqual({ hasName, name, declaresConfiguredName }, { hasName: true, name: 'Unnamed Service', declaresConfiguredName: true });
});

// The eight notification adapters this plugin publishes are all contact sensors on one accessory,
// so several services of one type have to coexist under their own subtypes. A display name passed
// where the real HAP takes one must also land as a display name: a stand-in that recorded it as the
// subtype would report the wrong service identity to every scenario reading a published service
// back (D-12).
function assertSiblingSubtypes(): void {
  const accessory = createFakeAccessory(ACCESSORY_NAME, ACCESSORY_UUID);
  const primaryPumpRunning = accessory.addService(HAP.Service.ContactSensor, 'Primary Pump Running', 'primary-pump-running');
  const backupPumpRunning = accessory.addService(HAP.Service.ContactSensor, 'Backup Pump Running', 'backup-pump-running');

  assert.deepEqual(
    {
      primary: accessory.getServiceById(HAP.Service.ContactSensor, 'primary-pump-running') === primaryPumpRunning,
      backup: accessory.getServiceById(HAP.Service.ContactSensor, 'backup-pump-running') === backupPumpRunning,
      primaryName: primaryPumpRunning.displayName,
      primarySubtype: primaryPumpRunning.subtype,
      unknownSubtype: accessory.getServiceById(HAP.Service.ContactSensor, 'water-sensor-fault'),
      otherType: accessory.getServiceById(HAP.Service.LeakSensor, 'primary-pump-running'),
    },
    {
      primary: true,
      backup: true,
      primaryName: 'Primary Pump Running',
      primarySubtype: 'primary-pump-running',
      unknownSubtype: undefined,
      otherType: undefined,
    },
  );
}

Then('the accessory holds each contact sensor under its own subtype', () => {
  assertSiblingSubtypes();
});

// Both refusals the real `Accessory.addService` makes, over an accessory that already carries one
// contact sensor. The get-or-add reconciliation the accessory publishes with leans on them, so the
// wording is the real wording and the refusal is asserted whole.
function refusalOfASecondContactSensor(displayName: string, subtype: string | undefined, expectedMessage: string): void {
  const accessory = createFakeAccessory(ACCESSORY_NAME, ACCESSORY_UUID);

  accessory.addService(HAP.Service.ContactSensor, 'Primary Pump Running', 'primary-pump-running');
  const before = accessory.services.map((service) => ({ uuid: service.UUID, subtype: service.subtype, name: service.displayName }));

  assert.throws(
    () => accessory.addService(HAP.Service.ContactSensor, displayName, subtype),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, expectedMessage);

      return true;
    },
  );
  assert.deepStrictEqual(
    accessory.services.map((service) => ({ uuid: service.UUID, subtype: service.subtype, name: service.displayName })),
    before,
  );
}

function assertDuplicateSubtypeRefused(): void {
  refusalOfASecondContactSensor(
    'Backup Pump Running',
    'primary-pump-running',
    `Cannot add a Service with the same UUID '${CONTACT_SENSOR_UUID}' and subtype 'primary-pump-running' as another Service in this Accessory.`,
  );
}

Then('the accessory refuses a second service with the same type and subtype', () => {
  assertDuplicateSubtypeRefused();
});

function assertMissingSubtypeRefused(): void {
  refusalOfASecondContactSensor(
    'Backup Pump Running',
    undefined,
    `Cannot add a Service with the same UUID '${CONTACT_SENSOR_UUID}' as another Service in this Accessory without also defining a unique 'subtype' property.`,
  );
}

Then('the accessory refuses a second service of one type without a subtype', () => {
  assertMissingSubtypeRefused();
});

// Removing a suppressed adapter is how `ignoredFaults` un-publishes one contact sensor, so the call
// has to leave every sibling and the accessory information service in place (D-17).
function assertRemoveServiceRemovesOnlyItsTarget(): void {
  const accessory = createFakeAccessory(ACCESSORY_NAME, ACCESSORY_UUID);
  const primaryPumpRunning = accessory.addService(HAP.Service.ContactSensor, 'Primary Pump Running', 'primary-pump-running');

  accessory.addService(HAP.Service.ContactSensor, 'Backup Pump Running', 'backup-pump-running');
  accessory.removeService(primaryPumpRunning);

  assert.deepEqual(
    {
      primary: accessory.getServiceById(HAP.Service.ContactSensor, 'primary-pump-running'),
      backup: accessory.getServiceById(HAP.Service.ContactSensor, 'backup-pump-running')?.displayName,
      accessoryInformation: accessory.getService(HAP.Service.AccessoryInformation)?.UUID,
    },
    { primary: undefined, backup: 'Backup Pump Running', accessoryInformation: HAP.Service.AccessoryInformation.UUID },
  );
}

Then('the accessory removes only the service it is given', () => {
  assertRemoveServiceRemovesOnlyItsTarget();
});
