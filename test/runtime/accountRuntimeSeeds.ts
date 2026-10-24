// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Supplies fresh synthetic account monitoring and command inputs.
 */

import type { ApiDevice, AwsCredentialsResponse } from '../../src/cloud/types.js';
import type { BgConfig } from '../../src/config.js';
import type { ReportedPatch } from '../../src/device/state.js';
import type { ProtocolConstants } from '../../src/protocol.js';

const DEVICE_ID = 'account-1_serial-1';
const OTHER_DEVICE_ID = 'account-1_serial-2';
const DEVICE_TIME = 1_700_000_000_000;
const POLL_INTERVAL_MS = 900_000;

/** Returns fresh account settings with the configured polling interval. */
export function accountConfig(): BgConfig {
  return {
    name: 'Basement Guardian',
    email: 'account@example.test',
    password: 'account-password',
    clientId: 'client-id-1',
    pollIntervalSeconds: POLL_INTERVAL_MS / 1_000,
    offlineConfirmationPollCount: 2,
    ignoredFaults: [],
  };
}

/** Returns fresh protocol constants for the offline cloud boundaries. */
export function testConstants(): ProtocolConstants {
  return {
    apiUrl: 'https://api.example.test',
    clientId: 'bundled-client-id',
    auth0Url: 'https://tenant.example.test',
    auth0Realm: 'example-realm',
    awsRegion: 'us-east-1',
    protocol: 'wss',
  };
}

/** Returns a fresh device with a placeholder account identifier. */
export function geminiDevice(): ApiDevice {
  return {
    deviceId: DEVICE_ID,
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: DEVICE_TIME },
    data: { water_level: 1, primary_pump_running: false, ac_power: true },
  };
}

/** Returns a fresh second physical device for account membership checks. */
export function otherGeminiDevice(): ApiDevice {
  return { ...geminiDevice(), deviceId: OTHER_DEVICE_ID };
}

/** Returns both fresh physical devices reporting the supplied level. */
export function bothDevicesAt(level: number): ApiDevice[] {
  return [
    { ...geminiDevice(), data: { ...geminiDevice().data, water_level: level } },
    { ...otherGeminiDevice(), data: { ...otherGeminiDevice().data, water_level: level } },
  ];
}

/** Returns a fresh vendor envelope with serial number under attributes. */
export function geminiWireDeviceList(): { devices: Record<string, unknown>[] } {
  const device = geminiDevice();

  return {
    devices: [
      {
        accountId: 'account-1',
        deviceId: device.deviceId,
        deviceTypeId: device.deviceTypeId,
        name: device.name,
        data: device.data,
        attributes: { productLine: 'wayneWater', serialNumber: device.serialNumber },
        connectivity: device.connectivity,
      },
    ],
  };
}

/** Returns fresh initial credentials with the supplied expiry. */
export function credentialsAt(expiresAtMs: number): AwsCredentialsResponse {
  return {
    endpoint: 'broker.invalid',
    clientId: 'client-first',
    credentials: {
      AccessKeyId: 'test-access-key-id',
      SecretAccessKey: 'test-secret-access-key',
      SessionToken: 'test-session-token',
      Expiration: new Date(expiresAtMs).toISOString(),
    },
  };
}

/** Returns fresh replacement credentials with the supplied expiry. */
export function rotatedCredentialsAt(expiresAtMs: number): AwsCredentialsResponse {
  return {
    endpoint: 'broker-two.invalid',
    clientId: 'client-second',
    credentials: {
      AccessKeyId: 'test-next-access-key-id',
      SecretAccessKey: 'test-next-secret-access-key',
      SessionToken: 'test-next-session-token',
      Expiration: new Date(expiresAtMs).toISOString(),
    },
  };
}

/** Returns a fresh heartbeat whose arrival establishes live-path activity. */
export function heartbeatPatch(): ReportedPatch {
  return { data: { water_level: 1 }, state: undefined, version: undefined };
}
