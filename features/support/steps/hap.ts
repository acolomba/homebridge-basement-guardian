/**
 * @fileoverview Steps that hold the HAP stand-in to its own contract.
 *
 * Every safety assertion in this suite reads the plugin's HomeKit output through the stand-in, so a
 * stand-in that accepted a call shape production cannot make, or answered a default kinder than the
 * real HAP's, would turn each of those assertions into a false assurance. These steps pin the real
 * argument orders and the real format defaults directly, so that drift fails here rather than
 * passing quietly somewhere downstream.
 */

import assert from 'node:assert/strict';

import { Then } from '@cucumber/cucumber';

import { createFakeHap } from '../fakeHap.js';

const HAP = createFakeHap();

// The identifiers Apple assigns, written out here rather than read back from the stand-in, so the
// assertion fails when the stand-in's own literal drifts.
const LEAK_DETECTED_UUID = '00000070-0000-1000-8000-0026BB765291';
const CONTACT_SENSOR_STATE_UUID = '0000006A-0000-1000-8000-0026BB765291';

const SCRATCH_CHARACTERISTIC_MINIMUM = 3;

// A plugin declares its own HomeKit types by subclassing the injected namespace, so both bases must
// be constructible through the real argument orders. These two stand for a production type; nothing
// outside this module uses them (SAFE-08, D-15).
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

function assertStandardIdentifiers(): void {
  assert.deepEqual(
    { leakDetected: HAP.Characteristic.LeakDetected.UUID, contactSensorState: HAP.Characteristic.ContactSensorState.UUID },
    { leakDetected: LEAK_DETECTED_UUID, contactSensorState: CONTACT_SENSOR_STATE_UUID },
  );
}

Then('the hap stand-in carries the standard characteristic identifiers', assertStandardIdentifiers);

function assertFormatsPermsAndUnits(): void {
  assert.deepEqual(
    {
      bool: HAP.Formats.BOOL,
      uint8: HAP.Formats.UINT8,
      float: HAP.Formats.FLOAT,
      string: HAP.Formats.STRING,
      pairedRead: HAP.Perms.PAIRED_READ,
      notify: HAP.Perms.NOTIFY,
      percentage: HAP.Units.PERCENTAGE,
    },
    { bool: 'bool', uint8: 'uint8', float: 'float', string: 'string', pairedRead: 'pr', notify: 'ev', percentage: 'percentage' },
  );
}

Then('the hap stand-in carries the formats, perms, and units the plugin reads', assertFormatsPermsAndUnits);

function assertScratchTypeConstructs(): void {
  const scratchService = new ScratchService('Scratch Service', 'scratch');

  assert.deepEqual(
    {
      uuid: scratchService.UUID,
      subtype: scratchService.subtype,
      name: scratchService.getCharacteristic(HAP.Characteristic.Name)?.value,
      reading: scratchService.getCharacteristic(ScratchCharacteristic)?.value,
    },
    { uuid: ScratchService.UUID, subtype: 'scratch', name: 'Scratch Service', reading: SCRATCH_CHARACTERISTIC_MINIMUM },
  );
}

Then('a plugin type extends the hap service and the hap characteristic', assertScratchTypeConstructs);

// The real HAP creates each characteristic at its format default, and for this plugin those
// defaults are the good-news values: a sensor published before the first valid decode reads "no
// leak", "contact detected", and "battery normal". `StatusActive` defaults to false, the one
// default that is honest, which is why the accessory leaves it there until a valid decode arrives
// (D-05, D-014).
function assertFormatDefaults(): void {
  const leakSensor = new HAP.Service.LeakSensor('Sump Pit Flood', 'sump-pit-flood');
  const contactSensor = new HAP.Service.ContactSensor('Mains Power Lost', 'mains-power-lost');
  const battery = new HAP.Service.Battery('Backup Battery', 'backup-battery');

  assert.deepEqual(
    {
      leak: leakSensor.getCharacteristic(HAP.Characteristic.LeakDetected)?.value,
      contact: contactSensor.getCharacteristic(HAP.Characteristic.ContactSensorState)?.value,
      lowBattery: battery.getCharacteristic(HAP.Characteristic.StatusLowBattery)?.value,
      active: leakSensor.addCharacteristic(HAP.Characteristic.StatusActive).value,
    },
    { leak: 0, contact: 0, lowBattery: 0, active: false },
  );
}

Then('a fresh sensor service reads at the hap format defaults', assertFormatDefaults);

function assertUpdateAddsTheCharacteristicItNames(): void {
  const contactSensor = new HAP.Service.ContactSensor('Water Sensor Fault', 'water-sensor-fault');
  const before = contactSensor.testCharacteristic(HAP.Characteristic.StatusActive);

  contactSensor.updateCharacteristic(HAP.Characteristic.StatusActive, true);

  assert.deepEqual(
    {
      before,
      after: contactSensor.testCharacteristic(HAP.Characteristic.StatusActive),
      value: contactSensor.getCharacteristic(HAP.Characteristic.StatusActive)?.value,
    },
    { before: false, after: true, value: true },
  );
}

Then('the service adds the characteristic an update names', assertUpdateAddsTheCharacteristicItNames);

// The real `addOptionalCharacteristic` is not idempotent: two calls push two entries. Production
// guards against the second call, so the stand-in has to be able to record one.
function assertOptionalCharacteristicsAppend(): void {
  const contactSensor = new HAP.Service.ContactSensor('Primary Pump Fault', 'primary-pump-fault');

  contactSensor.addOptionalCharacteristic(HAP.Characteristic.StatusFault);
  contactSensor.addOptionalCharacteristic(HAP.Characteristic.StatusFault);

  assert.deepEqual(
    contactSensor.optionalCharacteristics.map((characteristic) => characteristic.UUID),
    [HAP.Characteristic.StatusFault.UUID, HAP.Characteristic.StatusFault.UUID],
  );
}

Then('the service appends an optional characteristic on every call', assertOptionalCharacteristicsAppend);
