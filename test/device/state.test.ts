import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createDeviceStateStore } from '../../src/device/state.js';

import type { ApiDevice } from '../../src/cloud/types.js';
import type { DeviceIdentity, DeviceSnapshot, DeviceStateStore, DeviceStateStoreOptions, ReportedPatch } from '../../src/device/state.js';
import type { Clock } from '../../src/runtime/clock.js';

const DEVICE_ID = 'account-1_serial-1';
const DEVICE_TIME = 1_700_000_000_000;
const FIRST_RECEIPT = 1_700_000_777_000;
const SECOND_RECEIPT = 1_700_000_888_000;

// The vendor deviceId reads <account-id>_<serial-number>; fixtures carry a
// placeholder in place of the real account identifier.
function geminiDevice(): ApiDevice {
  return {
    deviceId: DEVICE_ID,
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: DEVICE_TIME },
    data: { water_level: 1, primary_pump_running: false, ac_power: true },
  };
}

function geminiIdentity(): DeviceIdentity {
  return { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' };
}

function fixedStoreOptions(): DeviceStateStoreOptions {
  const clock: Clock = { now: () => FIRST_RECEIPT };

  return { clock };
}

// One discovered device carrying shadow version 5, the starting point for every
// out-of-order case.
function versionedStore(): DeviceStateStore {
  const store = createDeviceStateStore(fixedStoreOptions());
  store.applyDiscovery(geminiDevice());
  store.applyReportedPatch(DEVICE_ID, { data: undefined, state: undefined, version: 5 });

  return store;
}

describe('applyDiscovery', () => {
  test('builds a snapshot that keeps device time apart from local receipt time', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());

    // act
    const snapshot = store.applyDiscovery(geminiDevice());

    // assert
    assert.deepStrictEqual(snapshot, {
      identity: geminiIdentity(),
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: FIRST_RECEIPT,
    });
  });

  test('keeps one entry and returns the newer snapshot when a device is discovered twice', () => {
    // arrange
    let currentTime = FIRST_RECEIPT;
    const clock: Clock = { now: () => currentTime };
    const store = createDeviceStateStore({ clock });
    store.applyDiscovery(geminiDevice());

    // act
    currentTime = SECOND_RECEIPT;
    const snapshot = store.applyDiscovery({ ...geminiDevice(), name: 'Cellar System' });

    // assert
    assert.deepStrictEqual(store.deviceIds(), [DEVICE_ID]);
    assert.deepStrictEqual(snapshot, {
      identity: { ...geminiIdentity(), name: 'Cellar System' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: SECOND_RECEIPT,
    });
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), snapshot);
  });

  test('keeps shadow metadata and the applied version when a later poll refreshes telemetry', () => {
    // arrange
    const store = versionedStore();
    store.applyReportedPatch(DEVICE_ID, { data: undefined, state: { mcu_firmware_version: '1.4.2' }, version: 6 });

    // act
    const snapshot = store.applyDiscovery(geminiDevice());

    // assert
    assert.deepStrictEqual(snapshot, {
      identity: geminiIdentity(),
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: { mcu_firmware_version: '1.4.2' },
      shadowVersion: 6,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: FIRST_RECEIPT,
    });
  });

  test('copies the vendor record, so a later change to it cannot reach stored state', () => {
    // arrange
    const data: Record<string, unknown> = { water_level: 1 };
    const device: ApiDevice = { ...geminiDevice(), data };
    const store = createDeviceStateStore(fixedStoreOptions());

    // act
    const snapshot = store.applyDiscovery(device);
    data.water_level = 31;

    // assert
    assert.deepStrictEqual(snapshot.data, { water_level: 1 });
  });

  test('returns a snapshot no consumer can modify', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());

    // act
    const snapshot: DeviceSnapshot = store.applyDiscovery(geminiDevice());

    // assert
    assert.strictEqual(Object.isFrozen(snapshot), true);
    assert.strictEqual(Object.isFrozen(snapshot.identity), true);
    assert.strictEqual(Object.isFrozen(snapshot.connectivity), true);
    assert.strictEqual(Object.isFrozen(snapshot.data), true);
    assert.strictEqual(Object.isFrozen(snapshot.metadata), true);
  });
});

describe('applyReportedPatch', () => {
  test('merges a partial heartbeat and leaves every value it omits where the device last set it', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());

    // act
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7 }, state: undefined, version: undefined });

    // assert
    assert.deepStrictEqual(snapshot?.data, { water_level: 7, primary_pump_running: false, ac_power: true });
  });

  test('merges a reported state section into metadata and leaves telemetry untouched', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());

    // act
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: undefined, state: { wifi_signal_dbm: -54 }, version: undefined });

    // assert
    assert.deepStrictEqual(snapshot?.data, { water_level: 1, primary_pump_running: false, ac_power: true });
    assert.deepStrictEqual(snapshot.metadata, { wifi_signal_dbm: -54 });
  });

  test('merges a telemetry section and leaves metadata untouched', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    store.applyReportedPatch(DEVICE_ID, { data: undefined, state: { wifi_signal_dbm: -54 }, version: undefined });

    // act
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { water_level: 15 }, state: undefined, version: undefined });

    // assert
    assert.deepStrictEqual(snapshot?.data, { water_level: 15, primary_pump_running: false, ac_power: true });
    assert.deepStrictEqual(snapshot.metadata, { wifi_signal_dbm: -54 });
  });

  test('carries no member able to hold a requested control value', () => {
    // act & assert
    void ({
      data: { water_level: 1 },
      state: undefined,
      version: 6,
      // @ts-expect-error requested control state is never canonical safety state, so the patch shape gives it nowhere to land
      desired: { test_running: true },
    } satisfies ReportedPatch);
  });

  test('carries no member able to hold an acknowledged control value', () => {
    // act & assert
    void ({
      data: undefined,
      state: undefined,
      version: 6,
      // @ts-expect-error an acknowledgement is not a sensor reading, so a null requested value has nowhere to land either
      desired: { test_running: null },
    } satisfies ReportedPatch);
  });

  for (const { version, waterLevel, applied } of [
    { version: 4, waterLevel: 1, applied: 5 },
    { version: 5, waterLevel: 1, applied: 5 },
    { version: 6, waterLevel: 31, applied: 6 },
  ]) {
    test(`leaves water level at ${String(waterLevel)} and the applied version at ${String(applied)} for a patch at version ${String(version)}`, () => {
      // arrange
      const store = versionedStore();

      // act
      const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { water_level: 31 }, state: undefined, version });

      // assert
      assert.strictEqual(snapshot?.data.water_level, waterLevel);
      assert.strictEqual(snapshot.shadowVersion, applied);
    });
  }

  test('applies an unversioned patch and leaves the applied version where the last versioned patch set it', () => {
    // arrange
    const store = versionedStore();

    // act
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: undefined });

    // assert
    assert.strictEqual(snapshot?.data.water_level, 3);
    assert.strictEqual(snapshot.shadowVersion, 5);
  });

  test('applies the first versioned patch to a device the shadow has not yet versioned', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());

    // act
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { water_level: 3 }, state: undefined, version: 2 });

    // assert
    assert.strictEqual(snapshot?.data.water_level, 3);
    assert.strictEqual(snapshot.shadowVersion, 2);
  });

  test('leaves every stored value in place for a patch that reports neither section', () => {
    // arrange
    let currentTime = FIRST_RECEIPT;
    const clock: Clock = { now: () => currentTime };
    const store = createDeviceStateStore({ clock });
    store.applyDiscovery(geminiDevice());

    // act
    currentTime = SECOND_RECEIPT;
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: undefined, state: undefined, version: undefined });

    // assert
    assert.deepStrictEqual(snapshot, {
      identity: geminiIdentity(),
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: SECOND_RECEIPT,
    });
  });

  test('reports nothing and stores nothing for a device REST discovery has never returned', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());

    // act
    const snapshot = store.applyReportedPatch('account-1_serial-9', { data: { water_level: 7 }, state: undefined, version: 1 });

    // assert
    assert.strictEqual(snapshot, undefined);
    assert.deepStrictEqual(store.deviceIds(), []);
  });

  test('returns a merged snapshot no consumer can modify', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());

    // act
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7 }, state: { wifi_signal_dbm: -54 }, version: 1 });

    // assert
    assert.strictEqual(Object.isFrozen(snapshot), true);
    assert.strictEqual(Object.isFrozen(snapshot?.data), true);
    assert.strictEqual(Object.isFrozen(snapshot?.metadata), true);
  });
});

describe('snapshot', () => {
  test('reports nothing for a device it has never seen', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());

    // act & assert
    assert.strictEqual(store.snapshot('account-1_serial-9'), undefined);
  });
});

describe('deviceIds', () => {
  test('reports no identifier before any discovery', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());

    // act & assert
    assert.deepStrictEqual(store.deviceIds(), []);
  });

  test('reports every stored identifier', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());

    // act
    store.applyDiscovery(geminiDevice());
    store.applyDiscovery({ ...geminiDevice(), deviceId: 'account-1_serial-2', serialNumber: 'serial-2' });

    // assert
    assert.deepStrictEqual(store.deviceIds(), [DEVICE_ID, 'account-1_serial-2']);
  });
});
