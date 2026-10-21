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

import { Then } from '@cucumber/cucumber';

import { createFakeHap } from '../lib/hap.js';
import { createFakeAccessory } from '../lib/homebridgeApi.js';

import type { FakeHapCharacteristic, FakeHapService } from '../lib/hap.js';

const HAP = createFakeHap();

const CONTACT_SENSOR_UUID = '00000080-0000-1000-8000-0026BB765291';

const ACCESSORY_NAME = 'Sump System';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';

const SCRATCH_CHARACTERISTIC_MINIMUM = 3;

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

Then('the hap stand-in carries the standard service and characteristic identifiers', () => {
  assertStandardIdentifiers();
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

Then('two fake hap characteristics keep separate properties', () => {
  const first = new HAP.Characteristic.On();
  const second = new HAP.Characteristic.On();
  const originalFormat = first.props.format;
  const originalPerms = [...first.props.perms];

  try {
    first.props.format = HAP.Formats.STRING;
    (first.props.perms as string[]).pop();

    assert.deepStrictEqual(
      { format: second.props.format, perms: second.props.perms },
      { format: HAP.Formats.BOOL, perms: [HAP.Perms.NOTIFY, HAP.Perms.PAIRED_READ, HAP.Perms.PAIRED_WRITE] },
    );
  } finally {
    first.props.format = originalFormat;
    first.props.perms = originalPerms;
  }
});

// The real HAP creates each characteristic at its format default, and for this plugin those
// defaults are the good-news values: a sensor published before the first valid decode would read
// "no leak", "contact detected", and "battery normal". `StatusActive` defaults to false, the one
// default that is honest. The accessory never relies on that: it adds no service until its row has
// a value to vouch for, and pushes `StatusActive` on every service it does add (D-05, D-014).
function constructedStateOf(characteristic: FakeHapCharacteristic): { value: unknown; pushed: boolean; statusCode: number } {
  return { value: characteristic.value, pushed: characteristic.pushed, statusCode: characteristic.statusCode };
}

function assertFormatDefaults(): void {
  const leakSensor = new HAP.Service.LeakSensor('Sump Pit Flood', 'sump-pit-flood');
  const contactSensor = new HAP.Service.ContactSensor('Mains Power Lost', 'mains-power-lost');
  const battery = new HAP.Service.Battery('Backup Battery Level', 'backup-battery');
  const switchService = new HAP.Service.Switch('System Self-Test', 'system-self-test');

  assert.deepStrictEqual(
    {
      leak: constructedStateOf(leakSensor.getCharacteristic(HAP.Characteristic.LeakDetected)),
      contact: constructedStateOf(contactSensor.getCharacteristic(HAP.Characteristic.ContactSensorState)),
      lowBattery: constructedStateOf(battery.getCharacteristic(HAP.Characteristic.StatusLowBattery)),
      active: constructedStateOf(leakSensor.addCharacteristic(HAP.Characteristic.StatusActive)),
      fault: constructedStateOf(leakSensor.addCharacteristic(HAP.Characteristic.StatusFault)),
      waterLevel: constructedStateOf(new HAP.Characteristic.WaterLevel()),
      batteryLevel: constructedStateOf(battery.getCharacteristic(HAP.Characteristic.BatteryLevel)),
      charging: constructedStateOf(battery.getCharacteristic(HAP.Characteristic.ChargingState)),
      on: constructedStateOf(switchService.getCharacteristic(HAP.Characteristic.On)),
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

function optionalUUIDsOf(service: FakeHapService): string[] {
  return service.optionalCharacteristics.map((characteristic) => characteristic.UUID);
}

// The accessory pushes `StatusActive` onto every service it publishes, and `publishValue` declares
// a characteristic first only when the service neither carries nor declares it. A stand-in whose
// standard services declared nothing would send every one of those pushes through the declaring
// branch while production took the other one, so the guard would be proven on a path it never runs
// on. Apple's sensor definitions declare both status characteristics; the Battery definition
// declares neither, which is what keeps the declaring branch reachable in production too.
function assertStandardOptionalDeclarations(): void {
  const accessoryInformation = new HAP.Service.AccessoryInformation('Sump System');
  const leakSensor = new HAP.Service.LeakSensor('Sump Pit Flood', 'sump-pit-flood');
  const contactSensor = new HAP.Service.ContactSensor('Mains Power Lost', 'mains-power-lost');
  const battery = new HAP.Service.Battery('Backup Battery Level', 'backup-battery');
  const switchService = new HAP.Service.Switch('System Self-Test', 'system-self-test');

  assert.deepStrictEqual(
    {
      accessoryInformation: optionalUUIDsOf(accessoryInformation),
      leak: optionalUUIDsOf(leakSensor),
      contact: optionalUUIDsOf(contactSensor),
      battery: optionalUUIDsOf(battery),
      switch: optionalUUIDsOf(switchService),
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
  const stateAfterError = constructedStateOf(contactSensor.getCharacteristic(characteristicClass));
  contactSensor.updateCharacteristic(characteristicClass, true);

  assert.deepStrictEqual(
    {
      before,
      stateAfterError,
      after: contactSensor.testCharacteristic(characteristicClass),
      state: constructedStateOf(contactSensor.getCharacteristic(characteristicClass)),
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
// Battery service is the one this plugin publishes on that declares neither status characteristic,
// so its own declarations cannot be mistaken for the two appended here.
function assertOptionalCharacteristicsAppend(): void {
  const battery = new HAP.Service.Battery('Backup Battery Level', 'backup-battery');

  battery.addOptionalCharacteristic(HAP.Characteristic.StatusFault);
  battery.addOptionalCharacteristic(HAP.Characteristic.StatusFault);

  assert.deepEqual(
    battery.optionalCharacteristics
      .filter((characteristic) => characteristic.UUID === HAP.Characteristic.StatusFault.UUID)
      .map((characteristic) => characteristic.UUID),
    [HAP.Characteristic.StatusFault.UUID, HAP.Characteristic.StatusFault.UUID],
  );
}

Then('the service appends an optional characteristic on every call', () => {
  assertOptionalCharacteristicsAppend();
});

Then('the fake hap answers the real status for each error form', async () => {
  const service = new HAP.Service.Switch('System Self-Test', 'system-self-test');
  const on = service.getCharacteristic(HAP.Characteristic.On);
  const unknownStatus = new HAP.HapStatusError(0).hapStatus;

  service.updateCharacteristic(HAP.Characteristic.On, new Error('-70412'));
  const numericMessageStatus = on.statusCode;
  service.updateCharacteristic(HAP.Characteristic.On, new Error('not a status'));
  const plainErrorStatus = on.statusCode;
  on.onSet(() => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- HAP accepts bare numeric handler statuses
    throw 0;
  });
  const thrownNumberStatus: unknown = await on.handleSetRequest(true).then(
    () => undefined,
    (status: unknown) => status,
  );

  assert.deepStrictEqual(
    { unknownStatus, numericMessageStatus, plainErrorStatus, thrownNumberStatus },
    { unknownStatus: -70402, numericMessageStatus: -70412, plainErrorStatus: -70402, thrownNumberStatus: -70402 },
  );
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
    { received, returnedSelf: returned === switchService, value: switchService.getCharacteristic(HAP.Characteristic.On).value },
    { received: [true], returnedSelf: true, value: true },
  );
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

  assert.throws(
    () => accessory.addService(HAP.Service.ContactSensor, displayName, subtype),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, expectedMessage);

      return true;
    },
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
