import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { isApiDevice, isApiDeviceList, isAwsCredentialsResponse, isCommandResult, isRecord } from '../../src/cloud/types.js';

import type { ApiConnectivity, ApiDevice, AwsCredentialsResponse, DeviceCommand } from '../../src/cloud/types.js';

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

const malformedDevices: { description: string; device: unknown }[] = [
  { description: 'a null value', device: null },
  { description: 'an undefined value', device: undefined },
  { description: 'a string', device: 'wayneWaterGemini' },
  { description: 'an array', device: [geminiDevice()] },
  { description: 'an empty record', device: {} },
  { description: 'a record with no device identifier', device: { ...geminiDevice(), deviceId: undefined } },
  { description: 'a record whose device identifier is a number', device: { ...geminiDevice(), deviceId: 7 } },
  { description: 'a record whose device type is a number', device: { ...geminiDevice(), deviceTypeId: 7 } },
  { description: 'a record whose name is a number', device: { ...geminiDevice(), name: 7 } },
  { description: 'a record whose serial number is a number', device: { ...geminiDevice(), serialNumber: 7 } },
  { description: 'a record with no connectivity', device: { ...geminiDevice(), connectivity: undefined } },
  { description: 'a record whose connected flag is a string', device: { ...geminiDevice(), connectivity: { connected: 'true', timestamp: 1 } } },
  { description: 'a record whose connectivity timestamp is a string', device: { ...geminiDevice(), connectivity: { connected: true, timestamp: 'now' } } },
  { description: 'a record whose data is a string', device: { ...geminiDevice(), data: 'water_level=1' } },
  { description: 'a record whose data is an array', device: { ...geminiDevice(), data: [1] } },
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

describe('isApiDevice', () => {
  test('accepts a device record carrying every field the plugin reads', () => {
    // act & assert
    assert.strictEqual(isApiDevice(geminiDevice()), true);
  });

  test('accepts a device that has reported no telemetry yet', () => {
    // act & assert
    assert.strictEqual(isApiDevice({ ...geminiDevice(), data: {} }), true);
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
