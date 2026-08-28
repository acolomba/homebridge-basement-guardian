/**
 * @fileoverview The Gemini dual-pump system: its identity and the names of the
 * fields it reports.
 *
 * These are field names, not field meanings. No legal-value set and no flood
 * threshold appears here. Only one water level has hardware-validation
 * evidence, so the level lookup and the threshold stay out of the tree until
 * a natural water-level cycle validates the progression. A guessed lookup
 * would read as a confident measurement.
 *
 * This module is a declaration only. Its entry in the `ignoreFindings` list of
 * `.fallowrc.json` goes away when a production consumer arrives.
 */

/** The vendor `deviceTypeId` that selects the Gemini adapter. */
export type GeminiDeviceTypeId = 'wayneWaterGemini';

/** Every telemetry field Gemini reports. */
export type GeminiTelemetryField =
  | 'water_level'
  | 'primary_pump_running'
  | 'primary_pump_fault'
  | 'backup_pump_running'
  | 'backup_pump_fault'
  | 'backup_pump_fuse_blown'
  | 'backup_pump_timestamp'
  | 'ac_power'
  | 'battery_charging'
  | 'battery_voltage_low'
  | 'battery_health'
  | 'hours_of_protection'
  | 'water_sensor_fault'
  | 'serial_communications'
  | 'alarm_audio_muted'
  | 'test_running'
  | 'test_timestamp'
  | 'offline';

/** Every device metadata field Gemini reports. */
export type GeminiMetadataField = 'wifi_signal_dbm' | 'mcu_firmware_version' | 'wifi_firmware_version' | 'mcu_target_version';
