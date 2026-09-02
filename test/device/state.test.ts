import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createDeviceStateStore } from '../../src/device/state.js';

import type { ApiDevice } from '../../src/cloud/types.js';
import type {
  DeviceIdentity,
  DeviceSnapshot,
  DeviceSnapshotListener,
  DeviceStateStore,
  DeviceStateStoreOptions,
  ReportedPatch,
} from '../../src/device/state.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { LogLevel, Logging } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const SECOND_DEVICE_ID = 'account-1_serial-2';
const DEVICE_TIME = 1_700_000_000_000;
const LATER_DEVICE_TIME = 1_700_000_111_000;
const FIRST_RECEIPT = 1_700_000_777_000;
const SECOND_RECEIPT = 1_700_000_888_000;

// What one listener saw, so a case compares whole notifications rather than
// counting calls.
interface Notification {
  changedKeys: readonly string[];
  waterLevel: unknown;
  previousWaterLevel: unknown;
}

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

// Logging is a callable interface with seven members, so the stub is a function
// that carries them rather than an object literal.
function createRecordingLog(messages: string[]): Logging {
  const record = (message: string): void => {
    messages.push(message);
  };

  return Object.assign(record, {
    prefix: 'basement guardian',
    debug: record,
    error: record,
    info: record,
    log: (level: LogLevel, message: string): void => {
      messages.push(`${level} ${message}`);
    },
    success: record,
    warn: record,
  });
}

function storeOptions(clock: Clock, messages: string[] = []): DeviceStateStoreOptions {
  return { clock, log: createRecordingLog(messages) };
}

function fixedStoreOptions(messages: string[] = []): DeviceStateStoreOptions {
  return storeOptions({ now: () => FIRST_RECEIPT }, messages);
}

function recordInto(notifications: Notification[]): DeviceSnapshotListener {
  return (next, previous, changedKeys) => {
    notifications.push({ changedKeys, waterLevel: next.data.water_level, previousWaterLevel: previous?.data.water_level });
  };
}

// One discovered device carrying shadow version 5, the starting point for every
// out-of-order case. The seeding patch repeats the discovered water level, so it
// establishes the watermark without moving a value or notifying anyone.
function versionedStore(): DeviceStateStore {
  const store = createDeviceStateStore(fixedStoreOptions());
  store.applyDiscovery(geminiDevice());
  store.applyReportedPatch(DEVICE_ID, { data: { water_level: 1 }, state: undefined, version: 5 });

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
    const store = createDeviceStateStore(storeOptions(clock));
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

  test('refreshes reachability and leaves telemetry alone while the shadow owns it', () => {
    // arrange
    let currentTime = FIRST_RECEIPT;
    const clock: Clock = { now: () => currentTime };
    const store = createDeviceStateStore(storeOptions(clock));
    store.applyDiscovery(geminiDevice());
    store.applyReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: 90 });

    // act
    currentTime = SECOND_RECEIPT;
    const snapshot = store.applyDiscovery({ ...geminiDevice(), connectivity: { connected: false, timestamp: LATER_DEVICE_TIME } });

    // assert
    assert.deepStrictEqual(snapshot, {
      identity: geminiIdentity(),
      connectivity: { connected: false, timestamp: LATER_DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: true, ac_power: true },
      metadata: {},
      shadowVersion: 90,
      deviceTimestamp: LATER_DEVICE_TIME,
      receivedAt: SECOND_RECEIPT,
    });
  });

  test('replaces telemetry from the vendor body while the shadow owns nothing', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    store.applyReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: undefined });

    // act
    const snapshot = store.applyDiscovery(geminiDevice());

    // assert
    assert.deepStrictEqual(snapshot.data, { water_level: 1, primary_pump_running: false, ac_power: true });
  });

  test('replaces telemetry after a patch that reports neither section left the watermark absent', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    store.applyReportedPatch(DEVICE_ID, { data: undefined, state: undefined, version: 90 });

    // act
    const snapshot = store.applyDiscovery({ ...geminiDevice(), data: { water_level: 9 } });

    // assert
    assert.deepStrictEqual(snapshot.data, { water_level: 9 });
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

  test('freezes a structured value nested inside the telemetry record', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());

    // act
    const snapshot = store.applyDiscovery({ ...geminiDevice(), data: { readings: { depth: 3 }, fault: null } });

    // assert
    assert.strictEqual(Object.isFrozen(snapshot.data.readings), true);
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

  test('leaves the receipt time alone and establishes no watermark for a patch that reports neither section', () => {
    // arrange
    let currentTime = FIRST_RECEIPT;
    const clock: Clock = { now: () => currentTime };
    const store = createDeviceStateStore(storeOptions(clock));
    store.applyDiscovery(geminiDevice());

    // act
    currentTime = SECOND_RECEIPT;
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: undefined, state: undefined, version: 42 });

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

  test('leaves the receipt time alone and advances the watermark it already held for a patch that reports neither section', () => {
    // arrange
    let currentTime = FIRST_RECEIPT;
    const clock: Clock = { now: () => currentTime };
    const store = createDeviceStateStore(storeOptions(clock));
    store.applyDiscovery(geminiDevice());
    store.applyReportedPatch(DEVICE_ID, { data: { water_level: 1 }, state: undefined, version: 5 });

    // act
    currentTime = SECOND_RECEIPT;
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: undefined, state: undefined, version: 6 });

    // assert
    assert.deepStrictEqual(snapshot, {
      identity: geminiIdentity(),
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: 6,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: FIRST_RECEIPT,
    });
  });

  test('advances the receipt time for a patch that reports telemetry', () => {
    // arrange
    let currentTime = FIRST_RECEIPT;
    const clock: Clock = { now: () => currentTime };
    const store = createDeviceStateStore(storeOptions(clock));
    store.applyDiscovery(geminiDevice());

    // act
    currentTime = SECOND_RECEIPT;
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7 }, state: undefined, version: 1 });

    // assert
    assert.strictEqual(snapshot?.receivedAt, SECOND_RECEIPT);
  });

  test('advances the receipt time for a patch that reports only device metadata', () => {
    // arrange
    let currentTime = FIRST_RECEIPT;
    const clock: Clock = { now: () => currentTime };
    const store = createDeviceStateStore(storeOptions(clock));
    store.applyDiscovery(geminiDevice());

    // act
    currentTime = SECOND_RECEIPT;
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: undefined, state: { wifi_signal_dbm: -54 }, version: 1 });

    // assert
    assert.strictEqual(snapshot?.receivedAt, SECOND_RECEIPT);
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

  test('freezes a structured value nested inside the metadata record', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());

    // act
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: undefined, state: { radio: { signal: -54 } }, version: 1 });

    // assert
    assert.strictEqual(Object.isFrozen(snapshot?.metadata.radio), true);
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

describe('releaseShadowSource', () => {
  test('clears the watermark on every stored device and leaves the rest of each snapshot alone', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    store.applyDiscovery({ ...geminiDevice(), deviceId: SECOND_DEVICE_ID, serialNumber: 'serial-2' });
    store.applyReportedPatch(DEVICE_ID, { data: { water_level: 4 }, state: { wifi_signal_dbm: -54 }, version: 90 });
    store.applyReportedPatch(SECOND_DEVICE_ID, { data: { water_level: 5 }, state: undefined, version: 91 });

    // act
    store.releaseShadowSource(DEVICE_ID);
    store.releaseShadowSource(SECOND_DEVICE_ID);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: geminiIdentity(),
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 4, primary_pump_running: false, ac_power: true },
      metadata: { wifi_signal_dbm: -54 },
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: FIRST_RECEIPT,
    });
    assert.strictEqual(store.snapshot(SECOND_DEVICE_ID)?.shadowVersion, undefined);
  });

  test('hands telemetry back to the poll', () => {
    // arrange
    const store = versionedStore();
    store.applyReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: 90 });

    // act
    store.releaseShadowSource(DEVICE_ID);
    const snapshot = store.applyDiscovery(geminiDevice());

    // assert
    assert.deepStrictEqual(snapshot.data, { water_level: 1, primary_pump_running: false, ac_power: true });
  });

  test('applies a shadow patch at a version already seen, so a reconnect refresh is not discarded', () => {
    // arrange
    const store = versionedStore();
    store.applyReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: 90 });
    store.releaseShadowSource(DEVICE_ID);
    store.applyDiscovery(geminiDevice());

    // act
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { primary_pump_running: true }, state: undefined, version: 90 });

    // assert
    assert.strictEqual(snapshot?.data.primary_pump_running, true);
  });

  test('notifies no listener, because no telemetry key moves', () => {
    // arrange
    const store = versionedStore();
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.releaseShadowSource(DEVICE_ID);

    // assert
    assert.deepStrictEqual(notifications, []);
  });

  // The handover is reachable on every poll of a silence that can last hours,
  // so a second call must cost exactly what the first one cost: no telemetry
  // key moves, the receipt time -- the snapshot's only freshness field -- is
  // not restamped, and no listener hears about a change that did not happen.
  test('moves no value and notifies nobody when it runs again on a later poll of the same silence', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    store.applyReportedPatch(DEVICE_ID, { data: { water_level: 4 }, state: { wifi_signal_dbm: -54 }, version: 90 });
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.releaseShadowSource(DEVICE_ID);
    store.releaseShadowSource(DEVICE_ID);

    // assert
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: geminiIdentity(),
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 4, primary_pump_running: false, ac_power: true },
      metadata: { wifi_signal_dbm: -54 },
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: FIRST_RECEIPT,
    });
    assert.deepStrictEqual(notifications, []);
  });

  test('returns a released snapshot no consumer can modify', () => {
    // arrange
    const store = versionedStore();

    // act
    store.releaseShadowSource(DEVICE_ID);

    // assert
    assert.strictEqual(Object.isFrozen(store.snapshot(DEVICE_ID)), true);
  });
});

describe('subscribe', () => {
  test('stops notifying a listener that unsubscribes', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    const notifications: Notification[] = [];
    const unsubscribe = store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    unsubscribe();
    store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7 }, state: undefined, version: undefined });

    // assert
    assert.deepStrictEqual(notifications, []);
  });

  test('reports the merged snapshot, the snapshot it replaced, and the one key that changed', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7 }, state: undefined, version: undefined });

    // assert
    assert.deepStrictEqual(notifications, [{ changedKeys: ['water_level'], waterLevel: 7, previousWaterLevel: 1 }]);
  });

  test('reports every changed key in a stable order', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7, ac_power: false }, state: undefined, version: undefined });

    // assert
    assert.deepStrictEqual(notifications, [{ changedKeys: ['ac_power', 'water_level'], waterLevel: 7, previousWaterLevel: 1 }]);
  });

  test('notifies no listener for a heartbeat that repeats the stored values', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.applyReportedPatch(DEVICE_ID, { data: { water_level: 1, ac_power: true }, state: undefined, version: undefined });

    // assert
    assert.deepStrictEqual(notifications, []);
  });

  test('notifies no listener for a patch that reports neither section', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.applyReportedPatch(DEVICE_ID, { data: undefined, state: undefined, version: 3 });

    // assert
    assert.deepStrictEqual(notifications, []);
  });

  test('notifies no listener for a patch the version watermark discards', () => {
    // arrange
    const store = versionedStore();
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.applyReportedPatch(DEVICE_ID, { data: { water_level: 31 }, state: undefined, version: 4 });

    // assert
    assert.deepStrictEqual(notifications, []);
  });

  test('reports no previous snapshot and every key the device record supplied on a first discovery', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.applyDiscovery(geminiDevice());

    // assert
    assert.deepStrictEqual(notifications, [{ changedKeys: ['ac_power', 'primary_pump_running', 'water_level'], waterLevel: 1, previousWaterLevel: undefined }]);
  });

  test('notifies no listener when two identical polls repeat a structured value', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery({ ...geminiDevice(), data: { water_level: 1, readings: { depth: 3 } } });
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.applyDiscovery({ ...geminiDevice(), data: { water_level: 1, readings: { depth: 3 } } });

    // assert
    assert.deepStrictEqual(notifications, []);
  });

  test('reports a structured value that moved as the one key that changed', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery({ ...geminiDevice(), data: { water_level: 1, readings: { depth: 3 } } });
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.applyDiscovery({ ...geminiDevice(), data: { water_level: 1, readings: { depth: 4 } } });

    // assert
    assert.deepStrictEqual(notifications, [{ changedKeys: ['readings'], waterLevel: 1, previousWaterLevel: 1 }]);
  });

  test('reports a key one record carries and the other omits as changed', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery({ ...geminiDevice(), data: { water_level: 1 } });
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    store.applyDiscovery({ ...geminiDevice(), data: { water_level: 1, readings: { depth: 3 } } });

    // assert
    assert.deepStrictEqual(notifications, [{ changedKeys: ['readings'], waterLevel: 1, previousWaterLevel: 1 }]);
  });

  test('notifies no listener registered for a different device', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    store.applyDiscovery({ ...geminiDevice(), deviceId: SECOND_DEVICE_ID, serialNumber: 'serial-2' });
    const notifications: Notification[] = [];
    store.subscribe(SECOND_DEVICE_ID, recordInto(notifications));

    // act
    store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7 }, state: undefined, version: undefined });

    // assert
    assert.deepStrictEqual(notifications, []);
  });

  test('runs the remaining listeners and reports a fixed message when one listener raises', () => {
    // arrange
    const messages: string[] = [];
    const store = createDeviceStateStore(fixedStoreOptions(messages));
    store.applyDiscovery(geminiDevice());
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, () => {
      throw new Error('the listener read water_level 7 from account-1_serial-1');
    });
    store.subscribe(DEVICE_ID, recordInto(notifications));

    // act
    const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { water_level: 7 }, state: undefined, version: undefined });

    // assert
    assert.strictEqual(snapshot?.data.water_level, 7);
    assert.deepStrictEqual(notifications, [{ changedKeys: ['water_level'], waterLevel: 7, previousWaterLevel: 1 }]);
    assert.deepStrictEqual(messages, ['A device snapshot listener failed.']);
  });
});

describe('remove', () => {
  test('drops the snapshot and the deviceId from deviceIds', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    store.applyDiscovery({ ...geminiDevice(), deviceId: SECOND_DEVICE_ID, serialNumber: 'serial-2' });

    // act
    store.remove(DEVICE_ID);

    // assert
    assert.strictEqual(store.snapshot(DEVICE_ID), undefined);
    assert.deepStrictEqual(store.deviceIds(), [SECOND_DEVICE_ID]);
  });

  test('is a no-op for a deviceId the store never held', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());

    // act
    store.remove(SECOND_DEVICE_ID);

    // assert
    assert.deepStrictEqual(store.deviceIds(), [DEVICE_ID]);
  });

  test('starts a fresh observation epoch, so a rediscovered deviceId gets no previous shadow version', () => {
    // arrange
    const store = versionedStore();

    // act
    store.remove(DEVICE_ID);
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

  test('drops a listener registered before removal, so it is not notified by a later rediscovery', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());
    store.applyDiscovery(geminiDevice());
    const notifications: Notification[] = [];
    store.subscribe(DEVICE_ID, recordInto(notifications));
    store.remove(DEVICE_ID);

    // act
    store.applyDiscovery(geminiDevice());

    // assert
    assert.deepStrictEqual(notifications, []);
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
    store.applyDiscovery({ ...geminiDevice(), deviceId: SECOND_DEVICE_ID, serialNumber: 'serial-2' });

    // assert
    assert.deepStrictEqual(store.deviceIds(), [DEVICE_ID, SECOND_DEVICE_ID]);
  });
});
