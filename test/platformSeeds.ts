// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Supplies fresh platform account, telemetry, and family inputs.
 */

import { PLATFORM_NAME } from '../src/settings.js';

import type { ApiDevice } from '../src/cloud/types.js';
import type { DeviceFamily } from '../src/device/family.js';
import type { FamilyOutcome, FamilyRegistry } from '../src/device/registry.js';
import type { ReportedPatch } from '../src/device/state.js';
import type { PlatformConfig } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const DEVICE_TYPE_ID = 'wayneWaterGemini';
const THROWING_DEVICE_ID = 'account-1_serial-throwing';

/** Returns fresh settings for a platform with no account configured. */
export function emptyConfig(): PlatformConfig {
  return { platform: PLATFORM_NAME };
}

/** Returns fresh synthetic account settings. */
export function accountConfig(): PlatformConfig {
  return { platform: PLATFORM_NAME, email: 'account@example.test', password: 'account-password' };
}

/** Returns a fresh discovered device with empty telemetry. */
export function geminiDevice(): ApiDevice {
  return {
    deviceId: DEVICE_ID,
    deviceTypeId: DEVICE_TYPE_ID,
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: 0 },
    data: {},
  };
}

/** Returns fresh legal telemetry for the real Gemini adapter. */
function validGeminiTelemetry(): Readonly<Record<string, unknown>> {
  return {
    water_level: 1,
    primary_pump_running: false,
    primary_pump_fault: false,
    backup_pump_running: false,
    backup_pump_fault: false,
    backup_pump_fuse_blown: false,
    ac_power: true,
    battery_charging: false,
    battery_voltage_low: false,
    battery_health: 8,
    hours_of_protection: 8,
    water_sensor_fault: false,
    serial_communications: true,
    alarm_audio_muted: false,
    test_running: false,
    offline: false,
  };
}

/** Returns a fresh vendor inventory envelope and its nested records. */
export function geminiWireDeviceList(): { devices: Record<string, unknown>[] } {
  return {
    devices: [
      {
        accountId: 'account-1',
        deviceId: DEVICE_ID,
        deviceTypeId: DEVICE_TYPE_ID,
        name: 'Sump System',
        data: validGeminiTelemetry(),
        attributes: { productLine: 'wayneWater', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: 0 },
      },
    ],
  };
}

/** Returns a fresh registry that recognizes no device family. */
export function unknownRegistry(): FamilyRegistry {
  return { lookup: (deviceTypeId: string): FamilyOutcome<unknown> => ({ kind: 'unknown', deviceTypeId }), shouldLog: () => true };
}

/** Returns a fresh adapter with one invalid power field. */
export function fakeFamily(): DeviceFamily<unknown> {
  return {
    deviceTypeId: DEVICE_TYPE_ID,
    displayName: 'Fake Family',
    implemented: true,
    validate: () => ({ valid: false, violations: [{ field: 'ac_power', reason: 'missing', scope: 'power' }] }),
    decode: () => ({}),
    capabilities: () => [],
    command: () => ({ desiredData: {} }),
  };
}

/** Returns a fresh adapter that decodes each supported scope. */
function powerFamily(): DeviceFamily<unknown> {
  return {
    deviceTypeId: DEVICE_TYPE_ID,
    displayName: 'Power Family',
    implemented: true,
    validate: () => ({ valid: true }),
    decode: (snapshot) => ({
      metadata: {},
      water: { levelCode: 0, levelPercent: 0, flooded: false },
      pump: { primaryRunning: false, backupRunning: snapshot.data.backup_pump_running === true, backupActivatedAt: undefined },
      power: { mainsPresent: snapshot.data.ac_power === true },
      battery: { charging: true, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
      fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
      connectivity: { reportedOffline: false },
    }),
    capabilities: () => [],
    command: () => ({ desiredData: {} }),
  };
}

/** Returns a fresh adapter that rejects decoding one named device. */
export function throwingFamily(): DeviceFamily<unknown> {
  return {
    ...powerFamily(),
    decode: (snapshot) => {
      if (snapshot.identity.deviceId === THROWING_DEVICE_ID) {
        throw new TypeError('decode() expected ac_power to be a boolean');
      }

      return { metadata: {}, power: { mainsPresent: true } };
    },
  };
}

/** Returns a fresh adapter that rejects its first decode only. */
export function recoveringFamily(): DeviceFamily<unknown> {
  let decodes = 0;

  return {
    ...powerFamily(),
    decode: (snapshot) => {
      decodes += 1;

      if (decodes === 1) {
        throw new TypeError('decode() expected ac_power to be a boolean');
      }

      return powerFamily().decode(snapshot);
    },
  };
}

/** Returns a fresh registry with an invalid-power adapter. */
export function implementedRegistry(): FamilyRegistry {
  return { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: fakeFamily() }), shouldLog: () => true };
}

/** Returns a fresh registry with a complete scope adapter. */
export function powerRegistry(): FamilyRegistry {
  return { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: powerFamily() }), shouldLog: () => true };
}

/** Returns a fresh unsupported-family registry with the supplied log decision. */
export function unsupportedRegistry(shouldLog: boolean): FamilyRegistry {
  return {
    lookup: (deviceTypeId: string): FamilyOutcome<unknown> => ({ kind: 'unsupported', deviceTypeId, displayName: 'Wayne Water HALO' }),
    shouldLog: () => shouldLog,
  };
}

/** Wraps case-owned telemetry in a fresh reported patch. */
export function reportedPatch(data: Readonly<Record<string, unknown>>): ReportedPatch {
  return { data, state: undefined, version: undefined };
}
