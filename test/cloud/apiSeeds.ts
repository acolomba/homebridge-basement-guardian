// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Supplies fresh synthetic cloud wire, device and credential records.
 */

import type { ApiDevice, AwsCredentialsResponse, WireDevice } from '../../src/cloud/types.js';

/** Returns a normalized Gemini record with synthetic account identity. */
export function geminiDevice(telemetry?: Readonly<Record<string, unknown>>): ApiDevice {
  return {
    deviceId: 'account-1_serial-1',
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: 1_700_000_000_000 },
    data: structuredClone(telemetry ?? { water_level: 1 }),
  };
}

/** Returns all thirteen vendor wire keys, including unread account metadata. */
export function geminiWireDevice(telemetry?: Readonly<Record<string, unknown>>): WireDevice & Record<string, unknown> {
  const attributes = { productLine: 'wayneWater', serialNumber: 'serial-1' };

  return {
    accountId: 'account-1',
    deviceId: 'account-1_serial-1',
    deviceTypeId: 'wayneWaterGemini',
    location: 'placeholder-location',
    name: 'Sump System',
    homeId: null,
    roomId: null,
    state: { wifi_signal_dbm: -55, mcu_firmware_version: '1.0.0' },
    data: structuredClone(telemetry ?? { water_level: 1 }),
    timestamp: 1_700_000_000_000,
    shadow: { state: { offline: false }, data: { water_level: 1 }, timestamp: 1_700_000_000_000 },
    attributes,
    connectivity: { connected: true, timestamp: 1_700_000_000_000 },
  };
}

/** Returns invented temporary credentials without contact with a vendor. */
export function awsCredentialsResponse(): AwsCredentialsResponse {
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

/** Returns a fresh untrusted credential envelope with selected wire fields changed. */
export function withCredentials(overrides: Readonly<Record<string, unknown>>): unknown {
  const response = awsCredentialsResponse();

  return { ...response, credentials: { ...response.credentials, ...structuredClone(overrides) } };
}

/** Returns fresh malformed wire seeds for both device envelope guards. */
export function malformedWireDevices(): { description: string; device: () => unknown }[] {
  return [
    { description: 'a null value', device: () => null },
    { description: 'an undefined value', device: () => undefined },
    { description: 'a string', device: () => 'wayneWaterGemini' },
    { description: 'an array', device: () => [geminiWireDevice({ water_level: 1, primary_pump_running: false })] },
    { description: 'an empty record', device: () => ({}) },
    {
      description: 'a record with no device identifier',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), deviceId: undefined }),
    },
    {
      description: 'a record whose device identifier is a number',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), deviceId: 7 }),
    },
    {
      description: 'a record whose device type is a number',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), deviceTypeId: 7 }),
    },
    { description: 'a record whose name is a number', device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), name: 7 }) },
    {
      description: 'a record with no attributes',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), attributes: undefined }),
    },
    {
      description: 'a record whose attributes are a string',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), attributes: 'serial-1' }),
    },
    {
      description: 'a record whose nested serial number is a number',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), attributes: { serialNumber: 7 } }),
    },
    {
      description: 'a record carrying its serial number at the top level',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), attributes: undefined, serialNumber: 'serial-1' }),
    },
    {
      description: 'a record with no connectivity',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), connectivity: undefined }),
    },
    {
      description: 'a record whose connected flag is a string',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), connectivity: { connected: 'true', timestamp: 1 } }),
    },
    {
      description: 'a record whose connectivity timestamp is a string',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), connectivity: { connected: true, timestamp: 'now' } }),
    },
    {
      description: 'a record whose data is a string',
      device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), data: 'water_level=1' }),
    },
    { description: 'a record whose data is an array', device: () => ({ ...geminiWireDevice({ water_level: 1, primary_pump_running: false }), data: [1] }) },
  ];
}
