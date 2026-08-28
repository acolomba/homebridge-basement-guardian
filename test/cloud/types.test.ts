import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { isApiDevice, isApiDeviceList, isRecord } from '../../src/cloud/types.js';

import type { ApiConnectivity, ApiDevice } from '../../src/cloud/types.js';

// The vendor deviceId reads <account-id>_<serial-number>; fixtures carry a
// placeholder in place of the real account identifier.
function geminiDevice(): ApiDevice {
  const connectivity: ApiConnectivity = { connected: true, timestamp: 1_700_000_000_000 };

  return {
    deviceId: 'account-1_serial-1',
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity,
    data: { water_level: 1, primary_pump_running: false },
  };
}

const malformedDevices: { description: string; device: unknown }[] = [
  { description: 'a null value', device: null },
  { description: 'a string', device: 'wayneWaterGemini' },
  { description: 'an array', device: [geminiDevice()] },
  { description: 'a record with no device identifier', device: { ...geminiDevice(), deviceId: undefined } },
  { description: 'a record whose device type is a number', device: { ...geminiDevice(), deviceTypeId: 7 } },
  { description: 'a record whose name is a number', device: { ...geminiDevice(), name: 7 } },
  { description: 'a record whose serial number is a number', device: { ...geminiDevice(), serialNumber: 7 } },
  { description: 'a record with no connectivity', device: { ...geminiDevice(), connectivity: undefined } },
  { description: 'a record whose connected flag is a string', device: { ...geminiDevice(), connectivity: { connected: 'yes', timestamp: 1 } } },
  { description: 'a record whose connectivity timestamp is a string', device: { ...geminiDevice(), connectivity: { connected: true, timestamp: 'now' } } },
  { description: 'a record whose data is a string', device: { ...geminiDevice(), data: 'water_level=1' } },
];

describe('isRecord', () => {
  test('accepts a plain object', () => {
    // act & assert
    assert.strictEqual(isRecord({ water_level: 1 }), true);
  });

  test('rejects a null value', () => {
    // act & assert
    assert.strictEqual(isRecord(null), false);
  });

  test('rejects an array', () => {
    // act & assert
    assert.strictEqual(isRecord([1, 2]), false);
  });

  test('rejects a string', () => {
    // act & assert
    assert.strictEqual(isRecord('water_level=1'), false);
  });
});

describe('isApiDevice', () => {
  test('accepts a device record carrying every field the plugin reads', () => {
    // act & assert
    assert.strictEqual(isApiDevice(geminiDevice()), true);
  });

  for (const { description, device } of malformedDevices) {
    test(`rejects ${description}`, () => {
      // act & assert
      assert.strictEqual(isApiDevice(device), false);
    });
  }
});

describe('isApiDeviceList', () => {
  test('accepts an empty list', () => {
    // act & assert
    assert.strictEqual(isApiDeviceList([]), true);
  });

  test('accepts a list of well-formed device records', () => {
    // act & assert
    assert.strictEqual(isApiDeviceList([geminiDevice(), geminiDevice()]), true);
  });

  test('rejects a value that is not a list', () => {
    // act & assert
    assert.strictEqual(isApiDeviceList(geminiDevice()), false);
  });

  test('rejects a list holding one malformed device record', () => {
    // act & assert
    assert.strictEqual(isApiDeviceList([geminiDevice(), { deviceId: 'account-1_serial-2' }]), false);
  });
});
