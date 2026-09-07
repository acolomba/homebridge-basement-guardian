import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { isAwsCredentialsResponse, isCommandResult, isRecord, isWireDeviceListResponse, isWireDeviceResponse, toApiDevice } from '../../src/cloud/types.js';

import type { ApiConnectivity, ApiDevice, AwsCredentialsResponse, DeviceCommand, WireDevice } from '../../src/cloud/types.js';

// A command is outbound, so no predicate narrows it. Its contract is that every
// field the plugin asks for travels under one desiredData key.
void ({ desiredData: { test_running: true } } satisfies DeviceCommand);
// @ts-expect-error a command carries its fields under desiredData
void ({ test_running: true } satisfies DeviceCommand);

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

// The same device as the vendor sends it, with all thirteen top-level keys. It is
// a plain record rather than a WireDevice, because eight of those keys are ones
// the interface deliberately does not describe. The serial number sits under
// `attributes`, alongside the product line the plugin never reads.
function geminiWireDevice(): Record<string, unknown> {
  return {
    accountId: 'account-1',
    deviceId: 'account-1_serial-1',
    deviceTypeId: 'wayneWaterGemini',
    location: 'placeholder-location',
    name: 'Sump System',
    homeId: null,
    roomId: null,
    state: { wifi_signal_dbm: -55, mcu_firmware_version: '1.0.0' },
    data: { water_level: 1, primary_pump_running: false },
    timestamp: 1_700_000_000_000,
    shadow: { state: { offline: false }, data: { water_level: 1 }, timestamp: 1_700_000_000_000 },
    attributes: { productLine: 'wayneWater', serialNumber: 'serial-1' },
    connectivity: { connected: true, timestamp: 1_700_000_000_000 },
  };
}

// Routes the full wire record through the production guard, so the normalizer
// cases receive the same value a real response would hand them, extra keys and
// all.
function narrowedWireDevice(): WireDevice {
  const body = { device: geminiWireDevice() };

  if (!isWireDeviceResponse(body)) {
    assert.fail('the wire fixture does not satisfy the single-device guard');
  }

  return body.device;
}

// Every field here is invented. The vendor issues these values at runtime and
// none of them is ever written down.
function awsCredentialsResponse(): AwsCredentialsResponse {
  return {
    endpoint: 'shadow.example.test',
    clientId: 'shadow-client-1',
    credentials: {
      AccessKeyId: 'access-key-1',
      SecretAccessKey: 'secret-access-key-1',
      SessionToken: 'session-token-1',
      Expiration: '2026-01-01T00:00:00.000Z',
    },
  };
}

function withCredentials(overrides: Record<string, unknown>): unknown {
  return { ...awsCredentialsResponse(), credentials: { ...awsCredentialsResponse().credentials, ...overrides } };
}

const malformedWireDevices: { description: string; device: unknown }[] = [
  { description: 'a null value', device: null },
  { description: 'an undefined value', device: undefined },
  { description: 'a string', device: 'wayneWaterGemini' },
  { description: 'an array', device: [geminiWireDevice()] },
  { description: 'an empty record', device: {} },
  { description: 'a record with no device identifier', device: { ...geminiWireDevice(), deviceId: undefined } },
  { description: 'a record whose device identifier is a number', device: { ...geminiWireDevice(), deviceId: 7 } },
  { description: 'a record whose device type is a number', device: { ...geminiWireDevice(), deviceTypeId: 7 } },
  { description: 'a record whose name is a number', device: { ...geminiWireDevice(), name: 7 } },
  { description: 'a record with no attributes', device: { ...geminiWireDevice(), attributes: undefined } },
  { description: 'a record whose attributes are a string', device: { ...geminiWireDevice(), attributes: 'serial-1' } },
  { description: 'a record whose nested serial number is a number', device: { ...geminiWireDevice(), attributes: { serialNumber: 7 } } },
  {
    description: 'a record carrying its serial number at the top level',
    device: { ...geminiWireDevice(), attributes: undefined, serialNumber: 'serial-1' },
  },
  { description: 'a record with no connectivity', device: { ...geminiWireDevice(), connectivity: undefined } },
  { description: 'a record whose connected flag is a string', device: { ...geminiWireDevice(), connectivity: { connected: 'true', timestamp: 1 } } },
  {
    description: 'a record whose connectivity timestamp is a string',
    device: { ...geminiWireDevice(), connectivity: { connected: true, timestamp: 'now' } },
  },
  { description: 'a record whose data is a string', device: { ...geminiWireDevice(), data: 'water_level=1' } },
  { description: 'a record whose data is an array', device: { ...geminiWireDevice(), data: [1] } },
];

const malformedCredentialResponses: { description: string; response: unknown }[] = [
  { description: 'a null value', response: null },
  { description: 'a string', response: 'shadow.example.test' },
  { description: 'an array', response: [awsCredentialsResponse()] },
  { description: 'an empty record', response: {} },
  { description: 'a record with no endpoint', response: { ...awsCredentialsResponse(), endpoint: undefined } },
  { description: 'a record whose endpoint is a number', response: { ...awsCredentialsResponse(), endpoint: 7 } },
  { description: 'a record with no client identifier', response: { ...awsCredentialsResponse(), clientId: undefined } },
  { description: 'a record with no credentials', response: { ...awsCredentialsResponse(), credentials: undefined } },
  { description: 'a record whose credentials are a string', response: { ...awsCredentialsResponse(), credentials: 'access-key-1' } },
  { description: 'a record with no access key identifier', response: withCredentials({ AccessKeyId: undefined }) },
  { description: 'a record with no secret access key', response: withCredentials({ SecretAccessKey: undefined }) },
  { description: 'a record with no session token', response: withCredentials({ SessionToken: undefined }) },
  { description: 'a record with no expiration', response: withCredentials({ Expiration: undefined }) },
  { description: 'a record whose expiration is a number', response: withCredentials({ Expiration: 1_767_225_600_000 }) },
];

const malformedCommandResults: { description: string; result: unknown }[] = [
  { description: 'a null value', result: null },
  { description: 'a string', result: 'true' },
  { description: 'an array', result: [{ success: true }] },
  { description: 'an empty record', result: {} },
  { description: 'a record whose success flag is a string', result: { success: 'true' } },
  { description: 'a record whose success flag is a number', result: { success: 1 } },
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

describe('isWireDeviceListResponse', () => {
  test('accepts an empty account', () => {
    // act & assert
    assert.strictEqual(isWireDeviceListResponse({ devices: [] }), true);
  });

  test('accepts an envelope holding well-formed wire records', () => {
    // act & assert
    assert.strictEqual(isWireDeviceListResponse({ devices: [geminiWireDevice(), geminiWireDevice()] }), true);
  });

  test('accepts a device that has reported no telemetry yet', () => {
    // act & assert
    assert.strictEqual(isWireDeviceListResponse({ devices: [{ ...geminiWireDevice(), data: {} }] }), true);
  });

  test('rejects a bare top-level array', () => {
    // act & assert
    assert.strictEqual(isWireDeviceListResponse([geminiWireDevice()]), false);
  });

  test('rejects a record carrying no devices key', () => {
    // act & assert
    assert.strictEqual(isWireDeviceListResponse({ deviceList: [geminiWireDevice()] }), false);
  });

  test('rejects a devices key that is not an array', () => {
    // act & assert
    assert.strictEqual(isWireDeviceListResponse({ devices: geminiWireDevice() }), false);
  });

  test('rejects the single-device envelope, so the two routes cannot be crossed', () => {
    // act & assert
    assert.strictEqual(isWireDeviceListResponse({ device: geminiWireDevice() }), false);
  });

  for (const { description, device } of malformedWireDevices) {
    test(`rejects an envelope holding ${description}`, () => {
      // act & assert
      assert.strictEqual(isWireDeviceListResponse({ devices: [device] }), false);
    });
  }
});

describe('isWireDeviceResponse', () => {
  test('accepts an envelope holding one well-formed wire record', () => {
    // act & assert
    assert.strictEqual(isWireDeviceResponse({ device: geminiWireDevice() }), true);
  });

  test('rejects a value that is not a record', () => {
    // act & assert
    assert.strictEqual(isWireDeviceResponse([geminiWireDevice()]), false);
  });

  test('rejects a bare unwrapped record', () => {
    // act & assert
    assert.strictEqual(isWireDeviceResponse(geminiWireDevice()), false);
  });

  test('rejects a record carrying no device key', () => {
    // act & assert
    assert.strictEqual(isWireDeviceResponse({ theDevice: geminiWireDevice() }), false);
  });

  test('rejects the list envelope, so the two routes cannot be crossed', () => {
    // act & assert
    assert.strictEqual(isWireDeviceResponse({ devices: [geminiWireDevice()] }), false);
  });

  for (const { description, device } of malformedWireDevices) {
    test(`rejects an envelope holding ${description}`, () => {
      // act & assert
      assert.strictEqual(isWireDeviceResponse({ device }), false);
    });
  }
});

describe('toApiDevice', () => {
  test('lifts the serial number from the attributes the vendor nests it in', () => {
    // act & assert
    assert.deepStrictEqual(toApiDevice(narrowedWireDevice()), geminiDevice());
  });

  test('returns exactly the six fields the plugin reads', () => {
    // act & assert
    assert.deepStrictEqual(Object.keys(toApiDevice(narrowedWireDevice())).sort(), ['connectivity', 'data', 'deviceId', 'deviceTypeId', 'name', 'serialNumber']);
  });
});

describe('isAwsCredentialsResponse', () => {
  test('accepts a response carrying the endpoint, the client identifier, and all four credential fields', () => {
    // act & assert
    assert.strictEqual(isAwsCredentialsResponse(awsCredentialsResponse()), true);
  });

  for (const { description, response } of malformedCredentialResponses) {
    test(`rejects ${description}`, () => {
      // act & assert
      assert.strictEqual(isAwsCredentialsResponse(response), false);
    });
  }
});

describe('isCommandResult', () => {
  test('accepts an accepted command', () => {
    // act & assert
    assert.strictEqual(isCommandResult({ success: true }), true);
  });

  test('accepts a refused command, because a refusal is a valid answer', () => {
    // act & assert
    assert.strictEqual(isCommandResult({ success: false }), true);
  });

  for (const { description, result } of malformedCommandResults) {
    test(`rejects ${description}`, () => {
      // act & assert
      assert.strictEqual(isCommandResult(result), false);
    });
  }
});
