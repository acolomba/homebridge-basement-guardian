import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createDeviceStateStore } from '../../src/device/state.js';

import type { ApiDevice } from '../../src/cloud/types.js';
import type { DeviceIdentity, DeviceSnapshot, DeviceStateStoreOptions } from '../../src/device/state.js';
import type { Clock } from '../../src/runtime/clock.js';

const DEVICE_TIME = 1_700_000_000_000;
const FIRST_RECEIPT = 1_700_000_777_000;
const SECOND_RECEIPT = 1_700_000_888_000;

// The vendor deviceId reads <account-id>_<serial-number>; fixtures carry a
// placeholder in place of the real account identifier.
function geminiDevice(): ApiDevice {
  return {
    deviceId: 'account-1_serial-1',
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: DEVICE_TIME },
    data: { water_level: 1, ac_power: true },
  };
}

function geminiIdentity(): DeviceIdentity {
  return { deviceId: 'account-1_serial-1', deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' };
}

function fixedStoreOptions(): DeviceStateStoreOptions {
  const clock: Clock = { now: () => FIRST_RECEIPT };

  return { clock };
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
      data: { water_level: 1, ac_power: true },
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
    assert.deepStrictEqual(store.deviceIds(), ['account-1_serial-1']);
    assert.deepStrictEqual(snapshot, {
      identity: { ...geminiIdentity(), name: 'Cellar System' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, ac_power: true },
      deviceTimestamp: DEVICE_TIME,
      receivedAt: SECOND_RECEIPT,
    });
    assert.deepStrictEqual(store.snapshot('account-1_serial-1'), snapshot);
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
    assert.deepStrictEqual(store.deviceIds(), ['account-1_serial-1', 'account-1_serial-2']);
  });
});
