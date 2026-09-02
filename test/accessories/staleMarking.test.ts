import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { HarnessPlatformAccessory } from '../../features/support/fakeHomebridgeApi.js';
import { markRestoredServicesStale, markServicesUnreadable } from '../../src/accessories/staleMarking.js';

import type { FakeCharacteristicClass, FakeHapService } from '../../features/support/fakeHap.js';
import type { API, PlatformAccessory } from 'homebridge';

const ACCESSORY_UUID = 'placeholder-accessory-uuid';

// The status a refused credential is presented under, written independently of the stand-in so a
// drifted number fails here (D-10, 04-CONTEXT D-04).
const COMMUNICATION_FAILURE = -70402;

// The one hand-built stand-in of this boundary, widened where the pass takes
// the namespace the plugin is injected with.
const HAP = createFakeHap();
const HAP_NAMESPACE = HAP as unknown as API['hap'];

// A restored accessory carries plain services holding the values the previous
// run published, which is what `restoreCachedAccessories` rebuilds and what a
// real Homebridge cache hands back.
function restoredAccessory(): HarnessPlatformAccessory {
  return new HarnessPlatformAccessory('Sump Guardian', ACCESSORY_UUID);
}

function floodSensorReporting(accessory: HarnessPlatformAccessory, trusted: boolean): FakeHapService {
  const flood = accessory.addService(HAP.Service.LeakSensor, 'Sump Pit Flood', 'sump-pit-flood');

  flood.updateCharacteristic(HAP.Characteristic.LeakDetected, HAP.Characteristic.LeakDetected.LEAK_DETECTED);
  flood.updateCharacteristic(HAP.Characteristic.StatusActive, trusted);

  return flood;
}

function batteryReporting(accessory: HarnessPlatformAccessory, trusted: boolean): FakeHapService {
  const battery = accessory.addService(HAP.Service.Battery, 'Backup Battery', 'backup-battery');

  battery.updateCharacteristic(HAP.Characteristic.BatteryLevel, 80);
  battery.updateCharacteristic(HAP.Characteristic.StatusActive, trusted);

  return battery;
}

// A control the previous run published without a trust row, which is the shape
// of a service restored from a cache an older release wrote.
function switchCarryingNoTrust(accessory: HarnessPlatformAccessory): FakeHapService {
  const control = accessory.addService(HAP.Service.Switch, 'Alarm Mute', 'alarm-mute');

  control.updateCharacteristic(HAP.Characteristic.On, true);

  return control;
}

function markStale(accessory: HarnessPlatformAccessory): number {
  return markRestoredServicesStale(accessory as unknown as PlatformAccessory, HAP_NAMESPACE);
}

function markUnreadable(accessory: HarnessPlatformAccessory): number {
  return markServicesUnreadable(accessory as unknown as PlatformAccessory, HAP_NAMESPACE, COMMUNICATION_FAILURE);
}

// What a characteristic holds, and what a controller read of it answers. The read is the whole
// difference between unreadable and merely marked, so it is driven rather than inferred from the
// stored status.
function readOf(service: FakeHapService, characteristicClass: FakeCharacteristicClass): { value: unknown; threw: unknown } {
  const held = service.getCharacteristic(characteristicClass);
  let threw: unknown = undefined;

  try {
    held?.handleGetRequest();
  } catch (error: unknown) {
    threw = error;
  }

  return { value: held?.value, threw };
}

describe('markRestoredServicesStale', () => {
  test('counts every restored service that already reports whether the plugin vouches for it', () => {
    // arrange
    const accessory = restoredAccessory();
    floodSensorReporting(accessory, true);
    batteryReporting(accessory, true);
    switchCarryingNoTrust(accessory);

    // act
    const marked = markStale(accessory);

    // assert
    assert.strictEqual(marked, 2);
  });

  test('leaves every marked service reporting that it cannot vouch for its value', () => {
    // arrange
    const accessory = restoredAccessory();
    const flood = floodSensorReporting(accessory, true);
    const battery = batteryReporting(accessory, true);

    // act
    markStale(accessory);

    // assert
    assert.deepStrictEqual(
      {
        flood: flood.getCharacteristic(HAP.Characteristic.StatusActive)?.value,
        battery: battery.getCharacteristic(HAP.Characteristic.StatusActive)?.value,
      },
      { flood: false, battery: false },
    );
  });

  test('adds no trust row to a restored service that never carried one', () => {
    // arrange
    const accessory = restoredAccessory();
    const control = switchCarryingNoTrust(accessory);

    // act
    const marked = markStale(accessory);

    // assert
    assert.deepStrictEqual(
      { marked, carriesTrust: control.testCharacteristic(HAP.Characteristic.StatusActive), on: control.getCharacteristic(HAP.Characteristic.On)?.value },
      { marked: 0, carriesTrust: false, on: true },
    );
  });

  test('retains every reading on a service it marks, so the tile keeps its last value', () => {
    // arrange
    const accessory = restoredAccessory();
    const flood = floodSensorReporting(accessory, true);
    const battery = batteryReporting(accessory, true);

    // act
    markStale(accessory);

    // assert
    assert.deepStrictEqual(
      {
        leakDetected: flood.getCharacteristic(HAP.Characteristic.LeakDetected)?.value,
        batteryLevel: battery.getCharacteristic(HAP.Characteristic.BatteryLevel)?.value,
      },
      { leakDetected: HAP.Characteristic.LeakDetected.LEAK_DETECTED, batteryLevel: 80 },
    );
  });

  test('marks a service the previous run had already stopped vouching for, because a restart re-establishes nothing', () => {
    // arrange
    const accessory = restoredAccessory();
    const flood = floodSensorReporting(accessory, false);

    // act
    const marked = markStale(accessory);

    // assert
    assert.deepStrictEqual({ marked, statusActive: flood.getCharacteristic(HAP.Characteristic.StatusActive)?.value }, { marked: 1, statusActive: false });
  });

  test('marks nothing on an accessory the cache restored with no services at all', () => {
    // arrange
    const accessory = restoredAccessory();
    accessory.sideloadServices([]);

    // act
    const marked = markStale(accessory);

    // assert
    assert.deepStrictEqual({ marked, services: accessory.services }, { marked: 0, services: [] });
  });

  // The forbidden implementation is the one that builds a `BasementGuardianAccessory`, whose
  // constructor throws when the context names no device. An accessory restored from a cache written
  // before that context existed carries exactly this empty context, so a pass that read it would
  // raise here rather than mark.
  test('marks an accessory whose context names no device, and leaves that context alone', () => {
    // arrange
    const accessory = restoredAccessory();
    floodSensorReporting(accessory, true);

    // act
    const marked = markStale(accessory);

    // assert
    assert.deepStrictEqual({ marked, context: accessory.context }, { marked: 1, context: {} });
  });
});

describe('markServicesUnreadable', () => {
  test('counts every service that reports whether the plugin vouches for it, and leaves one that never did alone', () => {
    // arrange
    const accessory = restoredAccessory();
    floodSensorReporting(accessory, true);
    batteryReporting(accessory, true);
    const control = switchCarryingNoTrust(accessory);

    // act
    const marked = markUnreadable(accessory);

    // assert
    assert.deepStrictEqual(
      { marked, carriesTrust: control.testCharacteristic(HAP.Characteristic.StatusActive), on: readOf(control, HAP.Characteristic.On) },
      { marked: 2, carriesTrust: false, on: { value: true, threw: undefined } },
    );
  });

  // The whole content of the presentation: a controller read answers the status rather than a
  // value, and the value the previous run published is still underneath it. A pass that erased the
  // reading would satisfy the first half of this and fail the second (RES-04, D-10, D-014).
  test('makes a read of every marked service throw the status it was given, and leaves the value it held', () => {
    // arrange
    const accessory = restoredAccessory();
    const flood = floodSensorReporting(accessory, true);
    const battery = batteryReporting(accessory, true);

    // act
    markUnreadable(accessory);

    // assert
    assert.deepStrictEqual(
      {
        flood: readOf(flood, HAP.Characteristic.StatusActive),
        battery: readOf(battery, HAP.Characteristic.StatusActive),
      },
      {
        flood: { value: true, threw: COMMUNICATION_FAILURE },
        battery: { value: true, threw: COMMUNICATION_FAILURE },
      },
    );
  });

  test('retains every other reading on a service it marks, so the tile keeps its last values', () => {
    // arrange
    const accessory = restoredAccessory();
    const flood = floodSensorReporting(accessory, true);
    const battery = batteryReporting(accessory, true);

    // act
    markUnreadable(accessory);

    // assert
    assert.deepStrictEqual(
      {
        leakDetected: readOf(flood, HAP.Characteristic.LeakDetected),
        batteryLevel: readOf(battery, HAP.Characteristic.BatteryLevel),
      },
      {
        leakDetected: { value: HAP.Characteristic.LeakDetected.LEAK_DETECTED, threw: undefined },
        batteryLevel: { value: 80, threw: undefined },
      },
    );
  });

  test('marks nothing on an accessory the cache restored with no services at all', () => {
    // arrange
    const accessory = restoredAccessory();
    accessory.sideloadServices([]);

    // act
    const marked = markUnreadable(accessory);

    // assert
    assert.deepStrictEqual({ marked, services: accessory.services }, { marked: 0, services: [] });
  });

  // The same reason the restart pass never builds one: a run whose first grant the vendor refused
  // never reached discovery, so the accessory it marks is one Homebridge restored, and a cache an
  // older release wrote carries exactly this empty context.
  test('marks an accessory whose context names no device, and leaves that context alone', () => {
    // arrange
    const accessory = restoredAccessory();
    floodSensorReporting(accessory, true);

    // act
    const marked = markUnreadable(accessory);

    // assert
    assert.deepStrictEqual({ marked, context: accessory.context }, { marked: 1, context: {} });
  });
});
