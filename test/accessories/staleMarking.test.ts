import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { HarnessPlatformAccessory } from '../../features/support/fakeHomebridgeApi.js';
import { createControlBinder } from '../../src/accessories/controls.js';
import { markRestoredServicesStale, markTrustReportsUnreadable, refuseRestoredControls } from '../../src/accessories/staleMarking.js';

import type { FakeCharacteristicClass, FakeHapService } from '../../features/support/fakeHap.js';
import type { DeviceCapability } from '../../src/device/family.js';
import type { Timers } from '../../src/runtime/timers.js';
import type { API, Logging, PlatformAccessory, Service } from 'homebridge';

const ACCESSORY_UUID = 'placeholder-accessory-uuid';

// The status a refused credential is presented under, written independently of the stand-in so a
// drifted number fails here (D-10, 04-CONTEXT D-04).
const COMMUNICATION_FAILURE = -70402;

// The status the missing command transport already answers, and the one a restored control answers
// for the same condition. Written out here for the same reason as the one above (D-08).
const NOT_ALLOWED_IN_CURRENT_STATE = -70412;

const DEVICE_ID = 'account-1_serial-1';

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
  const battery = accessory.addService(HAP.Service.Battery, 'Backup Battery Level', 'backup-battery');

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

// A control the previous run published, as the restart passes meet it: the value the device last
// reported, and no handler behind it.
function selfTestControl(accessory: HarnessPlatformAccessory): FakeHapService {
  const control = accessory.addService(HAP.Service.Switch, 'System Self-Test', 'system-self-test');

  control.updateCharacteristic(HAP.Characteristic.On, false);

  return control;
}

function silentLog(): Logging {
  const noop = (): void => {
    // logging is not this module's job; the stub discards every call
  };

  return Object.assign(noop, { prefix: 'basement guardian', debug: noop, error: noop, info: noop, log: noop, success: noop, warn: noop });
}

// Deferred execution that records nothing and runs nothing. The clearing push a refusal arms is the
// control module's behaviour and is driven in that module's own cases; here the port only has to be
// something the pass can hand on.
function heldTimers(): Timers {
  return { setTimeout: () => undefined, setInterval: () => undefined, clearTimeout: () => undefined, clearInterval: () => undefined };
}

// What a controller's press answered: the status a refusal threw, or `undefined` for a write HAP
// accepted and stored. An accepted press and a refused one differ only in that answer, which is the
// whole of what the restored-control pass changes.
async function pressOutcomeOf(service: FakeHapService): Promise<unknown> {
  const on = service.getCharacteristic(HAP.Characteristic.On);

  if (on === undefined) {
    throw new Error('the restored control carries no On characteristic');
  }

  try {
    await on.handleSetRequest(true);

    return undefined;
  } catch (error: unknown) {
    return error;
  }
}

function markStale(accessory: HarnessPlatformAccessory): number {
  return markRestoredServicesStale(accessory as unknown as PlatformAccessory, HAP_NAMESPACE);
}

function markUnreadable(accessory: HarnessPlatformAccessory): number {
  return markTrustReportsUnreadable(accessory as unknown as PlatformAccessory, HAP_NAMESPACE, COMMUNICATION_FAILURE);
}

function refuseControls(accessory: HarnessPlatformAccessory): number {
  return refuseRestoredControls(accessory as unknown as PlatformAccessory, HAP_NAMESPACE, silentLog(), heldTimers());
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

describe('markTrustReportsUnreadable', () => {
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

describe('refuseRestoredControls', () => {
  test('refuses a press on every restored control and counts the controls it armed', async () => {
    // arrange
    const accessory = restoredAccessory();
    floodSensorReporting(accessory, true);
    batteryReporting(accessory, true);
    const control = switchCarryingNoTrust(accessory);

    // act
    const armed = refuseControls(accessory);

    // assert
    assert.deepStrictEqual({ armed, press: await pressOutcomeOf(control) }, { armed: 1, press: NOT_ALLOWED_IN_CURRENT_STATE });
  });

  // The guard is the control write surface itself, so a sensor is walked and left exactly as the
  // cache handed it back. A sensor that gained `On` would gain a published identity a user's
  // automations may already attach to, and a handler on a row nobody can write to.
  test('adds no write surface to a restored sensor, which never carried one', () => {
    // arrange
    const accessory = restoredAccessory();
    const flood = floodSensorReporting(accessory, true);

    // act
    const armed = refuseControls(accessory);

    // assert
    assert.deepStrictEqual(
      {
        armed,
        carriesOn: flood.testCharacteristic(HAP.Characteristic.On),
        characteristics: flood.characteristics.map((characteristic) => characteristic.displayName),
      },
      { armed: 0, carriesOn: false, characteristics: ['Name', 'Leak Detected', 'Status Active'] },
    );
  });

  test('arms nothing on an accessory the cache restored with no services at all', () => {
    // arrange
    const accessory = restoredAccessory();
    accessory.sideloadServices([]);

    // act
    const armed = refuseControls(accessory);

    // assert
    assert.deepStrictEqual({ armed, services: accessory.services }, { armed: 0, services: [] });
  });

  // A write handler and nothing else. `RES-04` asks that a read answers from memory, so the pass
  // must leave every control it arms answering one (D-09).
  test('leaves every control it arms answering a read', () => {
    // arrange
    const accessory = restoredAccessory();
    const control = switchCarryingNoTrust(accessory);

    // act
    const armed = refuseControls(accessory);

    // assert
    assert.deepStrictEqual({ armed, on: readOf(control, HAP.Characteristic.On) }, { armed: 1, on: { value: true, threw: undefined } });
  });

  // A set handler is one slot in HAP rather than a listener list, so the accessory's own binder
  // takes it over on the first publish. Without this the refusal would outlive the condition that
  // justified it and a recovered plugin could never operate its controls again.
  test('lets the accessory own binder replace the refusal, so a recovered plugin still sends', async () => {
    // arrange
    const accessory = restoredAccessory();
    const control = selfTestControl(accessory);
    refuseControls(accessory);
    const sends: string[] = [];
    const binder = createControlBinder({
      hap: HAP_NAMESPACE,
      log: silentLog(),
      timers: heldTimers(),
      commands: {
        send: (deviceId: string, capability: DeviceCapability, requested: boolean) => {
          sends.push(`${deviceId} ${capability} ${String(requested)}`);

          return Promise.resolve({ accepted: true });
        },
      },
      deviceId: DEVICE_ID,
      offlineConfirmed: () => false,
      commandTransportReady: () => true,
      liveConfirmationObservable: () => true,
      republish: () => undefined,
    });

    // act
    binder.bind(control as unknown as Service, 'self-test', () => false);
    const press = await pressOutcomeOf(control);

    // assert
    assert.deepStrictEqual({ press, sends }, { press: undefined, sends: [`${DEVICE_ID} self-test true`] });
  });

  // The forbidden implementation is the one that builds a `BasementGuardianAccessory`, whose
  // constructor throws when the context names no device. A cache written before that context existed
  // carries exactly this empty one, so a pass that read it would raise here rather than arm.
  test('arms an accessory whose context names no device, and leaves that context alone', () => {
    // arrange
    const accessory = restoredAccessory();
    switchCarryingNoTrust(accessory);

    // act
    const armed = refuseControls(accessory);

    // assert
    assert.deepStrictEqual({ armed, context: accessory.context }, { armed: 1, context: {} });
  });
});
