// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Verifies cloud wire guards and complete device normalization.
 */

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

const malformedCommandResults: { description: string; commandAnswer: unknown }[] = [
  { description: 'a null value', commandAnswer: null },
  { description: 'a string', commandAnswer: 'true' },
  { description: 'an array', commandAnswer: [{ success: true }] },
  { description: 'an empty record', commandAnswer: {} },
  { description: 'a record whose success flag is a string', commandAnswer: { success: 'true' } },
  { description: 'a record whose success flag is a number', commandAnswer: { success: 1 } },
];

describe('isRecord', () => {
  test('accepts a plain object', () => {
    // arrange
    const record = { water_level: 1 };

    // act
    const recordAccepted = isRecord(record);

    // assert
    assert.strictEqual(recordAccepted, true);
  });

  test('rejects a null value', () => {
    // arrange
    const record = null;

    // act
    const recordAccepted = isRecord(record);

    // assert
    assert.strictEqual(recordAccepted, false);
  });

  test('rejects an array', () => {
    // arrange
    const record = [1, 2];

    // act
    const recordAccepted = isRecord(record);

    // assert
    assert.strictEqual(recordAccepted, false);
  });

  test('rejects a string', () => {
    // arrange
    const record = 'water_level=1';

    // act
    const recordAccepted = isRecord(record);

    // assert
    assert.strictEqual(recordAccepted, false);
  });
});

describe('isWireDeviceListResponse', () => {
  test('accepts an empty account', () => {
    // arrange
    const wireResponse = { devices: [] };

    // act
    const listAccepted = isWireDeviceListResponse(wireResponse);

    // assert
    assert.strictEqual(listAccepted, true);
  });

  test('accepts an envelope holding well-formed wire records', () => {
    // arrange
    const wireResponse = { devices: [geminiWireDevice(), geminiWireDevice()] };

    // act
    const listAccepted = isWireDeviceListResponse(wireResponse);

    // assert
    assert.strictEqual(listAccepted, true);
  });

  test('accepts a device that has reported no telemetry yet', () => {
    // arrange
    const wireResponse = { devices: [{ ...geminiWireDevice(), data: {} }] };

    // act
    const listAccepted = isWireDeviceListResponse(wireResponse);

    // assert
    assert.strictEqual(listAccepted, true);
  });

  test('rejects a bare top-level array', () => {
    // arrange
    const wireResponse = [geminiWireDevice()];

    // act
    const listAccepted = isWireDeviceListResponse(wireResponse);

    // assert
    assert.strictEqual(listAccepted, false);
  });

  test('rejects a record carrying no devices key', () => {
    // arrange
    const wireResponse = { deviceList: [geminiWireDevice()] };

    // act
    const listAccepted = isWireDeviceListResponse(wireResponse);

    // assert
    assert.strictEqual(listAccepted, false);
  });

  test('rejects a devices key that is not an array', () => {
    // arrange
    const wireResponse = { devices: geminiWireDevice() };

    // act
    const listAccepted = isWireDeviceListResponse(wireResponse);

    // assert
    assert.strictEqual(listAccepted, false);
  });

  test('rejects the single-device envelope, so the two routes cannot be crossed', () => {
    // arrange
    const wireResponse = { device: geminiWireDevice() };

    // act
    const listAccepted = isWireDeviceListResponse(wireResponse);

    // assert
    assert.strictEqual(listAccepted, false);
  });

  for (const { description, device } of malformedWireDevices) {
    test(`rejects an envelope holding ${description}`, () => {
      // arrange
      const wireResponse = { devices: [device] };

      // act
      const listAccepted = isWireDeviceListResponse(wireResponse);

      // assert
      assert.strictEqual(listAccepted, false);
    });
  }
});

describe('isWireDeviceResponse', () => {
  test('accepts an envelope holding one well-formed wire record', () => {
    // arrange
    const wireResponse = { device: geminiWireDevice() };

    // act
    const deviceAccepted = isWireDeviceResponse(wireResponse);

    // assert
    assert.strictEqual(deviceAccepted, true);
  });

  test('rejects a value that is not a record', () => {
    // arrange
    const wireResponse = [geminiWireDevice()];

    // act
    const deviceAccepted = isWireDeviceResponse(wireResponse);

    // assert
    assert.strictEqual(deviceAccepted, false);
  });

  test('rejects a bare unwrapped record', () => {
    // arrange
    const wireResponse = geminiWireDevice();

    // act
    const deviceAccepted = isWireDeviceResponse(wireResponse);

    // assert
    assert.strictEqual(deviceAccepted, false);
  });

  test('rejects a record carrying no device key', () => {
    // arrange
    const wireResponse = { theDevice: geminiWireDevice() };

    // act
    const deviceAccepted = isWireDeviceResponse(wireResponse);

    // assert
    assert.strictEqual(deviceAccepted, false);
  });

  test('rejects the list envelope, so the two routes cannot be crossed', () => {
    // arrange
    const wireResponse = { devices: [geminiWireDevice()] };

    // act
    const deviceAccepted = isWireDeviceResponse(wireResponse);

    // assert
    assert.strictEqual(deviceAccepted, false);
  });

  for (const { description, device } of malformedWireDevices) {
    test(`rejects an envelope holding ${description}`, () => {
      // arrange
      const wireResponse = { device };

      // act
      const deviceAccepted = isWireDeviceResponse(wireResponse);

      // assert
      assert.strictEqual(deviceAccepted, false);
    });
  }
});

describe('toApiDevice', () => {
  test('lifts the serial number from the attributes the vendor nests it in', () => {
    // arrange
    const wireDevice = narrowedWireDevice();

    // act
    const device = toApiDevice(wireDevice);

    // assert
    assert.deepStrictEqual(device, geminiDevice());
  });

  test('returns exactly the six fields the plugin reads', () => {
    // arrange
    const wireDevice = narrowedWireDevice();

    // act
    const device = toApiDevice(wireDevice);

    // assert
    assert.deepStrictEqual(device, geminiDevice());
  });
});

describe('isAwsCredentialsResponse', () => {
  test('accepts a response carrying the endpoint, the client identifier, and all four credential fields', () => {
    // arrange
    const credentialResponse = awsCredentialsResponse();

    // act
    const credentialsAccepted = isAwsCredentialsResponse(credentialResponse);

    // assert
    assert.strictEqual(credentialsAccepted, true);
  });

  for (const { description, response } of malformedCredentialResponses) {
    test(`rejects ${description}`, () => {
      // arrange
      const credentialResponse = response;

      // act
      const credentialsAccepted = isAwsCredentialsResponse(credentialResponse);

      // assert
      assert.strictEqual(credentialsAccepted, false);
    });
  }
});

describe('isCommandResult', () => {
  test('accepts an accepted command', () => {
    // arrange
    const command = { success: true };

    // act
    const commandAccepted = isCommandResult(command);

    // assert
    assert.strictEqual(commandAccepted, true);
  });

  test('accepts a refused command, because a refusal is a valid answer', () => {
    // arrange
    const command = { success: false };

    // act
    const commandAccepted = isCommandResult(command);

    // assert
    assert.strictEqual(commandAccepted, true);
  });

  for (const { description, commandAnswer } of malformedCommandResults) {
    test(`rejects ${description}`, () => {
      // arrange
      const command = commandAnswer;

      // act
      const commandAccepted = isCommandResult(command);

      // assert
      assert.strictEqual(commandAccepted, false);
    });
  }
});
