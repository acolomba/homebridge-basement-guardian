// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Supplies fresh synthetic Gemini telemetry, metadata and snapshots.
 */

import type { GeminiTelemetryField } from '../../src/device/gemini.js';
import type { DeviceSnapshot } from '../../src/device/state.js';

const DEVICE_ID = 'account-1_serial-1';
const RECEIVED_AT = 1_700_000_000_000;

/** Returns fresh required Gemini telemetry in its supported domains. */
export function validTelemetry(): Record<string, unknown> {
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

/** Returns fresh optional Gemini firmware and radio metadata. */
export function validMetadata(): Record<string, unknown> {
  return {
    wifi_signal_dbm: -60,
    mcu_firmware_version: '1.2.3',
    wifi_firmware_version: '4.5.6',
    mcu_target_version: '1.3.0',
  };
}

/** Returns fresh valid telemetry with the selected field omitted. */
export function telemetryWithout(field: GeminiTelemetryField): Record<string, unknown> {
  return Object.fromEntries(Object.entries(validTelemetry()).filter(([name]) => name !== field));
}

/** Returns a fresh snapshot envelope around the supplied telemetry and metadata records. */
export function buildSnapshot(telemetry: Record<string, unknown>, metadata: Record<string, unknown> = {}): DeviceSnapshot {
  return {
    identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
    connectivity: { connected: true, timestamp: RECEIVED_AT },
    data: telemetry,
    metadata,
    shadowVersion: undefined,
    deviceTimestamp: RECEIVED_AT,
    receivedAt: RECEIVED_AT,
  };
}
