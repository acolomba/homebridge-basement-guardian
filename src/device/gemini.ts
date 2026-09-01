/**
 * @fileoverview The Gemini dual-pump system: its identity, the fields it
 * reports, and the family adapter that validates and decodes them.
 *
 * The level ladder and the flood threshold live in `./waterLevel.js`, so the one
 * gate that still has to close on them (G-002) closes with a single reviewable
 * edit there. This module keeps the shape check that stops an out-of-domain
 * `water_level` from ever reaching that lookup: refusing an illegal code is a
 * shape check, not a meaning the plugin has not earned yet.
 *
 * `battery_health` and `hours_of_protection` are Gemini value domains, so their
 * meaning stays behind this family boundary in the same way `water_level`'s
 * does.
 */

import { isPitFlooded, waterLevelPercentage } from './waterLevel.js';

import type {
  AlarmMuteState,
  BatteryState,
  ConnectivityState,
  DeviceCapability,
  DeviceFamily,
  DeviceMetadataState,
  FamilyCommand,
  FamilyValidation,
  FaultState,
  FieldViolation,
  FieldViolationReason,
  PowerState,
  PumpState,
  ScopedDomainState,
  SelfTestState,
  WaterState,
} from './family.js';
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

/**
 * Gemini's decoded domain state.
 *
 * Every group this family publishes is family-neutral, so Gemini's decoded shape
 * is the scoped shape itself. A scope that did not validate is `undefined` here
 * rather than filled with a default (D-014).
 */
export type GeminiDomainState = ScopedDomainState;

// The known enum codes, read from hardware-observed vendor values. `water_level`
// includes 0 even though no hardware evidence validates it as a level yet: this
// is a shape check on what the vendor can legally send, and it is what keeps an
// illegal code away from the level lookup in `./waterLevel.js` (D-014).
const WATER_LEVEL_VALUES: ReadonlySet<number> = new Set([0, 1, 3, 7, 15, 31]);
const BATTERY_HEALTH_VALUES: ReadonlySet<number> = new Set([1, 2, 4, 8, 16, 32]);

// The documented protection-duration estimate each `hours_of_protection` band
// publishes. The band is reported exactly as the vendor sends it, never
// arbitrated against `battery_health` (D-08, D-012).
const PROTECTION_HOURS_PERCENTAGES: ReadonlyMap<number, number> = new Map([
  [1, 25],
  [2, 50],
  [4, 75],
  [8, 100],
]);

// Derived from the band map so the codes the shape check accepts and the codes
// the band lookup answers for cannot drift apart.
const HOURS_OF_PROTECTION_VALUES: ReadonlySet<number> = new Set(PROTECTION_HOURS_PERCENTAGES.keys());

// The `battery_health` codes that mean the backup battery cannot be relied on:
// Replace, Poor, and NotDetected. Okay, Good, and NA do not (D-07; vendor rules
// WW-GEM-ALERT-1, -2, -3, and -11).
const LOW_BATTERY_HEALTH_VALUES: ReadonlySet<number> = new Set([1, 2, 32]);

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

function protectionHoursPercentage(code: number): number {
  const percentage = PROTECTION_HOURS_PERCENTAGES.get(code);

  if (percentage === undefined) {
    throw new TypeError(`decode() has no protection band for hours_of_protection ${String(code)}; validate() must reject this snapshot first`);
  }

  return percentage;
}

// One strict decoder per scope. Each runs only after its own scope's fields
// validated, so a guard firing here means the gate above it is broken rather
// than a value this module should guess at.
function decodeWater(data: Readonly<Record<string, unknown>>): WaterState {
  const levelCode = numberField(data, 'water_level');

  return { levelCode, levelPercent: waterLevelPercentage(levelCode), flooded: isPitFlooded(levelCode) };
}

function decodePump(data: Readonly<Record<string, unknown>>): PumpState {
  return {
    primaryRunning: booleanField(data, 'primary_pump_running'),
    backupRunning: booleanField(data, 'backup_pump_running'),
    backupActivatedAt: optionalNumberField(data, 'backup_pump_timestamp'),
  };
}

function decodePower(data: Readonly<Record<string, unknown>>): PowerState {
  return { mainsPresent: booleanField(data, 'ac_power') };
}

function decodeBattery(data: Readonly<Record<string, unknown>>): BatteryState {
  const healthCode = numberField(data, 'battery_health');
  const protectionHoursCode = numberField(data, 'hours_of_protection');
  const voltageLow = booleanField(data, 'battery_voltage_low');

  return {
    charging: booleanField(data, 'battery_charging'),
    voltageLow,
    healthCode,
    protectionHoursCode,
    levelPercent: protectionHoursPercentage(protectionHoursCode),
    low: voltageLow || LOW_BATTERY_HEALTH_VALUES.has(healthCode),
  };
}

function decodeFault(data: Readonly<Record<string, unknown>>): FaultState {
  return {
    primaryPumpFault: booleanField(data, 'primary_pump_fault'),
    backupPumpFault: booleanField(data, 'backup_pump_fault'),
    backupPumpFuseBlown: booleanField(data, 'backup_pump_fuse_blown'),
    waterSensorFault: booleanField(data, 'water_sensor_fault'),
    controllerLinkPresent: booleanField(data, 'serial_communications'),
  };
}

function decodeSelfTest(data: Readonly<Record<string, unknown>>): SelfTestState {
  return { running: booleanField(data, 'test_running'), testedAt: optionalNumberField(data, 'test_timestamp') };
}

function decodeAlarmMute(data: Readonly<Record<string, unknown>>): AlarmMuteState {
  return { muted: booleanField(data, 'alarm_audio_muted') };
}

function decodeConnectivity(data: Readonly<Record<string, unknown>>): ConnectivityState {
  return { reportedOffline: booleanField(data, 'offline') };
}

function decodeMetadata(metadata: Readonly<Record<string, unknown>>): DeviceMetadataState {
  return {
    mcuFirmwareVersion: optionalStringField(metadata, 'mcu_firmware_version'),
    wifiFirmwareVersion: optionalStringField(metadata, 'wifi_firmware_version'),
    mcuTargetVersion: optionalStringField(metadata, 'mcu_target_version'),
    wifiSignalDbm: optionalNumberField(metadata, 'wifi_signal_dbm'),
  };
}

// The scopes at least one telemetry field stopped vouching for. A violation on
// a command-surface field lands here as `undefined`, which no group consults, so
// it is recorded without deactivating anything.
function untrustedScopesOf(data: Readonly<Record<string, unknown>>): ReadonlySet<GeminiFieldScope> {
  return new Set(violationsOf(TELEMETRY_CHECKS, data).map((violation) => violation.scope));
}

// Device metadata is judged on its own fields, so an invalid command-surface
// field cannot blank the firmware versions.
function isMetadataTrustworthy(metadata: Readonly<Record<string, unknown>>): boolean {
  return violationsOf(METADATA_CHECKS, metadata).length === 0;
}

// Every field is read by its own name, never spread from `snapshot.data` or
// `snapshot.metadata`, so an unread vendor key cannot reach domain state. A
// scope whose own fields did not all validate is absent rather than defaulted,
// so one bad field costs one scope (D-014, RES-01).
function decode(snapshot: DeviceSnapshot): GeminiDomainState {
  const { data, metadata } = snapshot;
  const untrusted = untrustedScopesOf(data);

  return {
    water: untrusted.has('water') ? undefined : decodeWater(data),
    pump: untrusted.has('pump') ? undefined : decodePump(data),
    power: untrusted.has('power') ? undefined : decodePower(data),
    battery: untrusted.has('battery') ? undefined : decodeBattery(data),
    fault: untrusted.has('fault') ? undefined : decodeFault(data),
    connectivity: untrusted.has('connectivity') ? undefined : decodeConnectivity(data),
    'self-test': untrusted.has('self-test') ? undefined : decodeSelfTest(data),
    'alarm-mute': untrusted.has('alarm-mute') ? undefined : decodeAlarmMute(data),
    metadata: isMetadataTrustworthy(metadata) ? decodeMetadata(metadata) : undefined,
  };
}

const CAPABILITIES: readonly DeviceCapability[] = ['self-test', 'alarm-mute'];

// Gemini always reports both capability-backing fields, so no state-dependent
// gating exists yet; the decoded state the interface passes here goes unread.
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
