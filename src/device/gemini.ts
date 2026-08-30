/**
 * @fileoverview The Gemini dual-pump system: its identity, the fields it
 * reports, and the family adapter that validates and decodes them.
 *
 * Only one water level has hardware-validation evidence, so the level lookup
 * and the flood threshold stay out of this module until a natural
 * water-level cycle validates the progression. A guessed lookup would read
 * as a confident measurement (D-014). `validate()` still knows every legal
 * `water_level` code, because refusing an out-of-domain code is a shape
 * check, not a meaning the plugin has not earned yet.
 */

import type { DeviceCapability, DeviceFamily, FamilyCommand, FamilyValidation, FieldViolation, FieldViolationReason } from './family.js';
import type { TrustScope } from './health.js';
import type { DeviceSnapshot } from './state.js';

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

/** Gemini's decoded telemetry. `backupPumpTimestamp` and `testTimestamp` are the only optional members. */
export interface GeminiTelemetryState {
  waterLevel: number;
  primaryPumpRunning: boolean;
  primaryPumpFault: boolean;
  backupPumpRunning: boolean;
  backupPumpFault: boolean;
  backupPumpFuseBlown: boolean;
  backupPumpTimestamp: number | undefined;
  acPower: boolean;
  batteryCharging: boolean;
  batteryVoltageLow: boolean;
  batteryHealth: number;
  hoursOfProtection: number;
  waterSensorFault: boolean;
  serialCommunications: boolean;
  alarmAudioMuted: boolean;
  testRunning: boolean;
  testTimestamp: number | undefined;
  offline: boolean;
}

/** Gemini's decoded device metadata. Every member is optional; the vendor omits all four on some firmware. */
export interface GeminiMetadataState {
  wifiSignalDbm: number | undefined;
  mcuFirmwareVersion: string | undefined;
  wifiFirmwareVersion: string | undefined;
  mcuTargetVersion: string | undefined;
}

/** Gemini's complete decoded domain state. */
export interface GeminiDomainState {
  telemetry: GeminiTelemetryState;
  metadata: GeminiMetadataState;
}

// The known enum codes, read from hardware-observed vendor values. `water_level`
// includes 0 even though no hardware evidence validates it as a level yet: this
// is a shape check on what the vendor can legally send, not the level lookup
// itself, which stays out of this module (D-014).
const WATER_LEVEL_VALUES: ReadonlySet<number> = new Set([0, 1, 3, 7, 15, 31]);
const BATTERY_HEALTH_VALUES: ReadonlySet<number> = new Set([1, 2, 4, 8, 16, 32]);
const HOURS_OF_PROTECTION_VALUES: ReadonlySet<number> = new Set([1, 2, 4, 8]);

// `undefined` names the command surface and the metadata fields. No published
// service reads either, so a violation on one is still recorded and diagnosable
// without deactivating anything, and no member is added to `TrustScope` for
// them.
type GeminiFieldScope = TrustScope | undefined;

/** How one field failed, before the scope that owns it is stamped on. */
interface FieldFault {
  field: string;
  reason: FieldViolationReason;
}

type FieldCheck = (data: Readonly<Record<string, unknown>>) => FieldFault | undefined;

/** One field's shape check and the scope that stops being trustworthy while that field is invalid (D-04). */
interface TelemetryCheck {
  scope: GeminiFieldScope;
  check: FieldCheck;
}

function requiredBoolean(field: string): FieldCheck {
  return (data) => {
    if (!(field in data)) {
      return { field, reason: 'missing' };
    }

    return typeof data[field] === 'boolean' ? undefined : { field, reason: 'wrong-type' };
  };
}

function requiredEnum(field: string, legalValues: ReadonlySet<number>): FieldCheck {
  return (data) => {
    if (!(field in data)) {
      return { field, reason: 'missing' };
    }

    const value = data[field];

    if (typeof value !== 'number') {
      return { field, reason: 'wrong-type' };
    }

    return legalValues.has(value) ? undefined : { field, reason: 'out-of-domain' };
  };
}

function optionalNumber(field: string): FieldCheck {
  return (data) => {
    if (!(field in data)) {
      return undefined;
    }

    return typeof data[field] === 'number' ? undefined : { field, reason: 'wrong-type' };
  };
}

function optionalString(field: string): FieldCheck {
  return (data) => {
    if (!(field in data)) {
      return undefined;
    }

    return typeof data[field] === 'string' ? undefined : { field, reason: 'wrong-type' };
  };
}

// `backup_pump_timestamp` and `test_timestamp` are the only two optional
// telemetry fields; every other of the 16 is required.
const TELEMETRY_CHECKS: readonly TelemetryCheck[] = [
  { scope: 'water', check: requiredEnum('water_level', WATER_LEVEL_VALUES) },
  { scope: 'pump', check: requiredBoolean('primary_pump_running') },
  { scope: 'fault', check: requiredBoolean('primary_pump_fault') },
  { scope: 'pump', check: requiredBoolean('backup_pump_running') },
  { scope: 'fault', check: requiredBoolean('backup_pump_fault') },
  { scope: 'fault', check: requiredBoolean('backup_pump_fuse_blown') },
  { scope: 'pump', check: optionalNumber('backup_pump_timestamp') },
  { scope: 'power', check: requiredBoolean('ac_power') },
  { scope: 'battery', check: requiredBoolean('battery_charging') },
  { scope: 'battery', check: requiredBoolean('battery_voltage_low') },
  { scope: 'battery', check: requiredEnum('battery_health', BATTERY_HEALTH_VALUES) },
  { scope: 'battery', check: requiredEnum('hours_of_protection', HOURS_OF_PROTECTION_VALUES) },
  { scope: 'fault', check: requiredBoolean('water_sensor_fault') },
  { scope: 'fault', check: requiredBoolean('serial_communications') },
  { scope: undefined, check: requiredBoolean('alarm_audio_muted') },
  { scope: undefined, check: requiredBoolean('test_running') },
  { scope: undefined, check: optionalNumber('test_timestamp') },
  { scope: 'connectivity', check: requiredBoolean('offline') },
];

// Every metadata field is optional: the vendor omits all four on some
// firmware, and an absent field is not a violation. None of the four belongs to
// a scope, because no published service reads them.
const METADATA_CHECKS: readonly TelemetryCheck[] = [
  { scope: undefined, check: optionalNumber('wifi_signal_dbm') },
  { scope: undefined, check: optionalString('mcu_firmware_version') },
  { scope: undefined, check: optionalString('wifi_firmware_version') },
  { scope: undefined, check: optionalString('mcu_target_version') },
];

function violationsOf(checks: readonly TelemetryCheck[], data: Readonly<Record<string, unknown>>): FieldViolation[] {
  const violations: FieldViolation[] = [];

  for (const { scope, check } of checks) {
    const fault = check(data);

    if (fault !== undefined) {
      violations.push({ ...fault, scope });
    }
  }

  return violations;
}

function validate(snapshot: DeviceSnapshot): FamilyValidation {
  const violations = [...violationsOf(TELEMETRY_CHECKS, snapshot.data), ...violationsOf(METADATA_CHECKS, snapshot.metadata)];

  return violations.length === 0 ? { valid: true } : { valid: false, violations };
}

// `decode()` runs only after `validate()` confirms every field's shape, so a
// mismatch here means that contract was broken rather than a value this
// module should guess at.
function booleanField(data: Readonly<Record<string, unknown>>, field: string): boolean {
  const value = data[field];

  if (typeof value !== 'boolean') {
    throw new TypeError(`decode() expected ${field} to be a boolean; validate() must reject this snapshot first`);
  }

  return value;
}

function numberField(data: Readonly<Record<string, unknown>>, field: string): number {
  const value = data[field];

  if (typeof value !== 'number') {
    throw new TypeError(`decode() expected ${field} to be a number; validate() must reject this snapshot first`);
  }

  return value;
}

function optionalNumberField(data: Readonly<Record<string, unknown>>, field: string): number | undefined {
  return field in data ? numberField(data, field) : undefined;
}

function optionalStringField(data: Readonly<Record<string, unknown>>, field: string): string | undefined {
  if (!(field in data)) {
    return undefined;
  }

  const value = data[field];

  if (typeof value !== 'string') {
    throw new TypeError(`decode() expected ${field} to be a string; validate() must reject this snapshot first`);
  }

  return value;
}

// Every field is read by its own name, never spread from `snapshot.data` or
// `snapshot.metadata`, so an unread vendor key cannot reach domain state.
function decode(snapshot: DeviceSnapshot): GeminiDomainState {
  const { data, metadata } = snapshot;

  return {
    telemetry: {
      waterLevel: numberField(data, 'water_level'),
      primaryPumpRunning: booleanField(data, 'primary_pump_running'),
      primaryPumpFault: booleanField(data, 'primary_pump_fault'),
      backupPumpRunning: booleanField(data, 'backup_pump_running'),
      backupPumpFault: booleanField(data, 'backup_pump_fault'),
      backupPumpFuseBlown: booleanField(data, 'backup_pump_fuse_blown'),
      backupPumpTimestamp: optionalNumberField(data, 'backup_pump_timestamp'),
      acPower: booleanField(data, 'ac_power'),
      batteryCharging: booleanField(data, 'battery_charging'),
      batteryVoltageLow: booleanField(data, 'battery_voltage_low'),
      batteryHealth: numberField(data, 'battery_health'),
      hoursOfProtection: numberField(data, 'hours_of_protection'),
      waterSensorFault: booleanField(data, 'water_sensor_fault'),
      serialCommunications: booleanField(data, 'serial_communications'),
      alarmAudioMuted: booleanField(data, 'alarm_audio_muted'),
      testRunning: booleanField(data, 'test_running'),
      testTimestamp: optionalNumberField(data, 'test_timestamp'),
      offline: booleanField(data, 'offline'),
    },
    metadata: {
      wifiSignalDbm: optionalNumberField(metadata, 'wifi_signal_dbm'),
      mcuFirmwareVersion: optionalStringField(metadata, 'mcu_firmware_version'),
      wifiFirmwareVersion: optionalStringField(metadata, 'wifi_firmware_version'),
      mcuTargetVersion: optionalStringField(metadata, 'mcu_target_version'),
    },
  };
}

const CAPABILITIES: readonly DeviceCapability[] = ['self-test', 'alarm-mute'];

// Gemini always reports both capability-backing fields, so no state-dependent
// gating exists at this phase; the decoded state the interface passes here
// goes unread.
function capabilities(): readonly DeviceCapability[] {
  return CAPABILITIES;
}

function command(capability: DeviceCapability, requested: boolean): FamilyCommand {
  if (capability === 'self-test') {
    return { desiredData: { test_running: requested } };
  }

  return { desiredData: { alarm_audio_muted: requested } };
}

/** The Gemini family adapter: strict validation, field-by-field decoding, and its two official commands. */
export const geminiFamily: DeviceFamily<GeminiDomainState> = {
  deviceTypeId: 'wayneWaterGemini',
  displayName: 'Wayne Water Gemini',
  implemented: true,
  validate,
  decode,
  capabilities,
  command,
};
