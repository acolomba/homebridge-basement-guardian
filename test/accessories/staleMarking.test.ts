// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests the passes that stop a cached accessory from claiming a false normal state.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/lib/hap.js';
import { HarnessPlatformAccessory } from '../../features/lib/homebridgeApi.js';
import { createControlBinder } from '../../src/accessories/controls.js';
import { markRestoredServicesStale, markTrustReportsUnreadable, refuseRestoredControls } from '../../src/accessories/staleMarking.js';

import type { FakeCharacteristicClass, FakeHapService } from '../../features/lib/hap.js';
import type { DeviceCapability } from '../../src/device/family.js';
import type { Timers } from '../../src/runtime/timers.js';
import type { API, Logging, PlatformAccessory, Service } from 'homebridge';

const ACCESSORY_UUID = 'placeholder-accessory-uuid';

// The status the trust reports are marked under. It is not -70402, the status HAP and the stand-in
// give an error that names no status, so a pass that marked with such an error instead of its status
// argument would read differently (D-10).
const RESOURCE_BUSY = -70403;

// The status the missing command transport already answers, and the one a restored control answers
// for the same condition. Written out rather than read from the stand-in, because the refusal reads
// the status from the injected namespace, so a drifted number there fails here (D-08).
const NOT_ALLOWED_IN_CURRENT_STATE = -70412;

// The cause the missing command transport names, and the one a restored refusal names for the same
// condition. Written out here so a refusal with a different wording fails here (D-08).
const NO_COMMAND_TRANSPORT_CAUSE = 'the plugin has no way to reach the vendor right now';

const DEVICE_ID = 'account-1_serial-1';

// The one hand-built stand-in of this boundary. The namespace holds no per-case state: each case
// builds its own accessory, and a characteristic lives on the service that carries it.
const HAP = createFakeHap();

// The widenings, kept in one place. Each stand-in carries only part of the real type, so no
// structural type admits it; the widening is what lets it stand where the code under test takes the
// real type.
//
// The stand-in namespace stands where the passes and the binder take the injected HAP namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];

// The stand-in accessory stands where a pass takes a restored PlatformAccessory.
function asPlatformAccessory(accessory: HarnessPlatformAccessory): PlatformAccessory {
  return accessory as unknown as PlatformAccessory;
}

// The stand-in service stands where the binder takes a Service.
function asService(service: FakeHapService): Service {
  return service as unknown as Service;
}

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
  function noop(): void {
    // logging is not this module's job; the stub discards every call
  }

  return Object.assign(noop, { prefix: 'basement guardian', debug: noop, error: noop, info: noop, log: noop, success: noop, warn: noop });
}

// A log stand-in that collects the warnings a case reads back and discards every other level.
function warningLog(warnings: string[]): Logging {
  function noop(): void {
    // only the warning channel is read back
  }

  return Object.assign(noop, {
    prefix: 'basement guardian',
    debug: noop,
    error: noop,
    info: noop,
    log: noop,
    success: noop,
    warn: (message: string) => {
      warnings.push(message);
    },
  });
}

// Deferred execution that records nothing and runs nothing, for the cases that do not observe the
// clearing push a refusal arms; there the port only has to be something the pass can hand on.
function heldTimers(): Timers {
  return {
    setTimeout: () => undefined,
    setInterval: () => undefined,
    clearTimeout: () => {
      // nothing was armed, so there is nothing to cancel
    },
    clearInterval: () => {
      // nothing was armed, so there is nothing to cancel
    },
  };
}

/** One deferral the pass asked the injected port for. */
interface Deferral {
  delayMs: number;
  run: () => void;
}

// Deferred execution that records each deferral rather than arming one, so a case reads back the
// delay asked for and runs the handler itself.
function recordingTimers(deferrals: Deferral[]): Timers {
  return {
    setTimeout: (run: () => void, delayMs: number) => {
      deferrals.push({ delayMs, run });

      return deferrals.length;
    },
    setInterval: () => undefined,
    clearTimeout: () => {
      // the pass arms one deferral and cancels none
    },
    clearInterval: () => {
      // the pass arms no interval, so there is nothing to cancel
    },
  };
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
  return markRestoredServicesStale(asPlatformAccessory(accessory), HAP_NAMESPACE);
}

function markUnreadable(accessory: HarnessPlatformAccessory): number {
  return markTrustReportsUnreadable(asPlatformAccessory(accessory), HAP_NAMESPACE, RESOURCE_BUSY).marked;
}

function refuseControls(accessory: HarnessPlatformAccessory): number {
  return refuseControlsWith(accessory, silentLog(), heldTimers());
}

function refuseControlsWith(accessory: HarnessPlatformAccessory, log: Logging, timers: Timers): number {
  return refuseRestoredControls(asPlatformAccessory(accessory), HAP_NAMESPACE, log, timers);
}

// What a characteristic holds, and what a controller read of it answers. The read is the whole
// difference between unreadable and merely marked, so it is driven rather than inferred from the
// stored status. The read is awaited because real HAP answers it asynchronously and rejects with the
// stored status.
async function readOf(service: FakeHapService, characteristicClass: FakeCharacteristicClass): Promise<{ value: unknown; threw: unknown }> {
  const held = service.getCharacteristic(characteristicClass);
  let threw: unknown = undefined;

  try {
    await held?.handleGetRequest();
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
  test('counts a later successful mark after the first service fails on the same accessory', async (t) => {
    // arrange
    const accessory = restoredAccessory();
    const flood = floodSensorReporting(accessory, true);
    const battery = batteryReporting(accessory, true);
    t.mock.method(flood, 'updateCharacteristic', () => {
      throw new Error('synthetic trust marking failure');
    });

    // act
    const marks = markTrustReportsUnreadable(asPlatformAccessory(accessory), HAP_NAMESPACE, RESOURCE_BUSY);

    // assert
    assert.deepStrictEqual(
      {
        marks,
        flood: await readOf(flood, HAP.Characteristic.StatusActive),
        battery: await readOf(battery, HAP.Characteristic.StatusActive),
        leakDetected: await readOf(flood, HAP.Characteristic.LeakDetected),
        batteryLevel: await readOf(battery, HAP.Characteristic.BatteryLevel),
      },
      {
        marks: { marked: 1, failed: 1 },
        flood: { value: true, threw: undefined },
        battery: { value: true, threw: RESOURCE_BUSY },
        leakDetected: { value: HAP.Characteristic.LeakDetected.LEAK_DETECTED, threw: undefined },
        batteryLevel: { value: 80, threw: undefined },
      },
    );
  });

  test('counts every service that reports whether the plugin vouches for it, and leaves one that never did alone', async () => {
    // arrange
    const accessory = restoredAccessory();
    floodSensorReporting(accessory, true);
    batteryReporting(accessory, true);
    const control = switchCarryingNoTrust(accessory);

    // act
    const marked = markUnreadable(accessory);

    // assert
    assert.deepStrictEqual(
      { marked, carriesTrust: control.testCharacteristic(HAP.Characteristic.StatusActive), on: await readOf(control, HAP.Characteristic.On) },
      { marked: 2, carriesTrust: false, on: { value: true, threw: undefined } },
    );
  });

  // The whole content of the presentation: a controller read answers the status rather than a
  // value, and the value the previous run published is still underneath it. A pass that erased the
  // reading would satisfy the first half of this and fail the second (RES-04, D-10, D-014).
  test('makes a read of every marked service throw the status it was given, and leaves the value it held', async () => {
    // arrange
    const accessory = restoredAccessory();
    const flood = floodSensorReporting(accessory, true);
    const battery = batteryReporting(accessory, true);

    // act
    markUnreadable(accessory);

    // assert
    assert.deepStrictEqual(
      {
        flood: await readOf(flood, HAP.Characteristic.StatusActive),
        battery: await readOf(battery, HAP.Characteristic.StatusActive),
      },
      {
        flood: { value: true, threw: RESOURCE_BUSY },
        battery: { value: true, threw: RESOURCE_BUSY },
      },
    );
  });

  test('retains every other reading on a service it marks, so the tile keeps its last values', async () => {
    // arrange
    const accessory = restoredAccessory();
    const flood = floodSensorReporting(accessory, true);
    const battery = batteryReporting(accessory, true);

    // act
    markUnreadable(accessory);

    // assert
    assert.deepStrictEqual(
      {
        leakDetected: await readOf(flood, HAP.Characteristic.LeakDetected),
        batteryLevel: await readOf(battery, HAP.Characteristic.BatteryLevel),
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
  // A restored accessory carries both control Switches, so a pass that armed only the first Switch it
  // found would leave the second one storing a press and reporting success.
  test('refuses a press on every restored control and counts the controls it armed', async () => {
    // arrange
    const accessory = restoredAccessory();
    floodSensorReporting(accessory, true);
    batteryReporting(accessory, true);
    const alarmMute = switchCarryingNoTrust(accessory);
    const selfTest = selfTestControl(accessory);

    // act
    const armed = refuseControls(accessory);

    // assert
    assert.deepStrictEqual(
      { armed, alarmMute: await pressOutcomeOf(alarmMute), selfTest: await pressOutcomeOf(selfTest) },
      { armed: 2, alarmMute: NOT_ALLOWED_IN_CURRENT_STATE, selfTest: NOT_ALLOWED_IN_CURRENT_STATE },
    );
  });

  // The refusal is the control module's own: the transport rule's status and cause, and a clearing
  // push. Without the push the refused Switch answers its status to every later read, which Apple
  // Home draws as "No Response", the presentation kept for a refused credential (D-07, D-08, D-10).
  test('refuses a restored press with the transport status and cause, and clears the status once the push runs', async () => {
    // arrange
    const accessory = restoredAccessory();
    const control = switchCarryingNoTrust(accessory);
    const warnings: string[] = [];
    const deferrals: Deferral[] = [];

    // act
    const armed = refuseControlsWith(accessory, warningLog(warnings), recordingTimers(deferrals));
    const press = await pressOutcomeOf(control);
    const readBeforePush = await readOf(control, HAP.Characteristic.On);

    for (const deferral of deferrals) {
      deferral.run();
    }

    const readAfterPush = await readOf(control, HAP.Characteristic.On);

    // assert
    assert.deepStrictEqual(
      { armed, press, warnings, delays: deferrals.map((deferral) => deferral.delayMs), readBeforePush, readAfterPush },
      {
        armed: 1,
        press: NOT_ALLOWED_IN_CURRENT_STATE,
        warnings: [`Refused Alarm Mute on Sump Guardian: ${NO_COMMAND_TRANSPORT_CAUSE}.`],
        delays: [0],
        readBeforePush: { value: true, threw: NOT_ALLOWED_IN_CURRENT_STATE },
        readAfterPush: { value: true, threw: undefined },
      },
    );
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
  test('leaves every control it arms answering a read', async () => {
    // arrange
    const accessory = restoredAccessory();
    const control = switchCarryingNoTrust(accessory);

    // act
    const armed = refuseControls(accessory);

    // assert
    assert.deepStrictEqual({ armed, on: await readOf(control, HAP.Characteristic.On) }, { armed: 1, on: { value: true, threw: undefined } });
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
      republish: () => {
        // this case reads back what was sent, not the rows a republish re-asserts
      },
    });

    // act
    binder.bind(asService(control), 'self-test', () => false);
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
