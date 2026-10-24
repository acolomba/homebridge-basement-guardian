// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Parses device tables before they enter the fake vendor service.
 */

import type { ApiDevice } from './vendorRestApi.js';
import type { DataTable } from '@cucumber/cucumber';

const DEFAULT_DEVICE_TYPE_ID = 'wayneWaterGemini';

// A complete, legal Gemini payload lets a scenario vary one field without restating every field.
const VALID_GEMINI_TELEMETRY: Readonly<Record<string, unknown>> = {
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

export interface DeviceRow {
  deviceId: string;
  name: string;
  deviceTypeId?: string;
  waterLevel?: string;
}

const DEVICE_COLUMNS: ReadonlyMap<string, keyof DeviceRow> = new Map([
  ['device id', 'deviceId'],
  ['name', 'name'],
  ['device type id', 'deviceTypeId'],
  ['water level', 'waterLevel'],
]);

/** Reads a horizontal device table without normalizing malformed input. */
export function parseDeviceRows(table: DataTable): readonly DeviceRow[] {
  const [headers, ...rows] = table.raw();

  if (headers === undefined) {
    throw new Error('a device table needs a header');
  }

  const fields = headers.map((header) => {
    const field = DEVICE_COLUMNS.get(header);

    if (field === undefined) {
      throw new Error(`unknown device column: ${header}`);
    }

    return field;
  });

  if (new Set(fields).size !== fields.length || !fields.includes('deviceId') || !fields.includes('name')) {
    throw new Error('a device table needs one device id and one name column, with no repeated field');
  }

  return rows.map((cells, index) => {
    if (cells.length !== fields.length) {
      throw new Error(`device row ${String(index + 1)} has ${String(cells.length)} cells; expected ${String(fields.length)}`);
    }

    const values: Partial<Record<keyof DeviceRow, string>> = {};

    for (const [column, field] of fields.entries()) {
      const value = cells[column];

      if (value === undefined || value.trim() === '') {
        throw new Error(`device row ${String(index + 1)} needs a value for ${field}`);
      }

      values[field] = value;
    }

    if (values.deviceId === undefined || values.name === undefined) {
      throw new Error(`device row ${String(index + 1)} needs a device id and a name`);
    }

    const row: DeviceRow = { deviceId: values.deviceId, name: values.name };

    if (values.deviceTypeId !== undefined) {
      row.deviceTypeId = values.deviceTypeId;
    }

    if (values.waterLevel !== undefined) {
      row.waterLevel = values.waterLevel;
    }

    return row;
  });
}

// An optional water level overrides one otherwise valid field.
function withWaterLevelOverride(telemetry: Readonly<Record<string, unknown>>, row: DeviceRow): Readonly<Record<string, unknown>> {
  if (row.waterLevel === undefined) {
    return telemetry;
  }

  const level = Number(row.waterLevel);

  if (!Number.isFinite(level)) {
    throw new Error(`water level must be numeric: ${row.waterLevel}`);
  }

  return { ...telemetry, water_level: level };
}

function toAccessoryDevice(row: DeviceRow): ApiDevice {
  const deviceTypeId = row.deviceTypeId ?? DEFAULT_DEVICE_TYPE_ID;
  const telemetry = deviceTypeId === DEFAULT_DEVICE_TYPE_ID ? VALID_GEMINI_TELEMETRY : {};

  return {
    deviceId: row.deviceId,
    deviceTypeId,
    name: row.name,
    serialNumber: 'placeholder-serial-number',
    connectivity: { connected: true, timestamp: 0 },
    data: withWaterLevelOverride(telemetry, row),
  };
}

/** Builds fake vendor devices with the accessory scenarios' complete telemetry. */
export function parseAccessoryDevices(table: DataTable): readonly ApiDevice[] {
  return parseDeviceRows(table).map((row) => toAccessoryDevice(row));
}
