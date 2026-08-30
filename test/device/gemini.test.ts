import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { geminiFamily } from '../../src/device/gemini.js';

import type { GeminiDeviceTypeId, GeminiMetadataField, GeminiTelemetryField } from '../../src/device/gemini.js';
import type { TrustScope } from '../../src/device/health.js';
import type { DeviceSnapshot } from '../../src/device/state.js';

void ('wayneWaterGemini' satisfies GeminiDeviceTypeId);
void ('water_level' satisfies GeminiTelemetryField);
void ('backup_pump_running' satisfies GeminiTelemetryField);
void ('serial_communications' satisfies GeminiTelemetryField);
void ('alarm_audio_muted' satisfies GeminiTelemetryField);
void ('mcu_target_version' satisfies GeminiMetadataField);
void ('wifi_signal_dbm' satisfies GeminiMetadataField);

// @ts-expect-error the HALO identity selects a different adapter
void ('wayneWaterHalo' satisfies GeminiDeviceTypeId);
// @ts-expect-error pump_state belongs to the other family; Gemini does not define it
void ('pump_state' satisfies GeminiTelemetryField);
// @ts-expect-error firmware versions are device metadata, kept apart from telemetry
void ('mcu_firmware_version' satisfies GeminiTelemetryField);
// @ts-expect-error the water level is telemetry, not metadata
void ('water_level' satisfies GeminiMetadataField);

const DEVICE_ID = 'account-1_serial-1';
const RECEIVED_AT = 1_700_000_000_000;

// Every required telemetry field, correctly typed and in its legal domain.
function validTelemetry(): Record<string, unknown> {
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

// Every device metadata field, correctly typed.
function validMetadata(): Record<string, unknown> {
  return {
    wifi_signal_dbm: -60,
    mcu_firmware_version: '1.2.3',
    wifi_firmware_version: '4.5.6',
    mcu_target_version: '1.3.0',
  };
}

// One telemetry field, the scope that stops being trustworthy while it is
// invalid, a value of the wrong type for it, and whether the vendor may omit it.
interface TelemetryScopeRow {
  field: GeminiTelemetryField;
  scope: TrustScope | undefined;
  wrongValue: unknown;
  required: boolean;
}

// One metadata field and a value of the wrong type for it. No published service
// reads device metadata, so every row owns no scope.
interface MetadataScopeRow {
  field: GeminiMetadataField;
  wrongValue: unknown;
}

const TELEMETRY_SCOPES: readonly TelemetryScopeRow[] = [
  { field: 'water_level', scope: 'water', wrongValue: 'not-a-number', required: true },
  { field: 'primary_pump_running', scope: 'pump', wrongValue: 'not-a-boolean', required: true },
  { field: 'primary_pump_fault', scope: 'fault', wrongValue: 'not-a-boolean', required: true },
  { field: 'backup_pump_running', scope: 'pump', wrongValue: 'not-a-boolean', required: true },
  { field: 'backup_pump_fault', scope: 'fault', wrongValue: 'not-a-boolean', required: true },
  { field: 'backup_pump_fuse_blown', scope: 'fault', wrongValue: 'not-a-boolean', required: true },
  { field: 'backup_pump_timestamp', scope: 'pump', wrongValue: 'not-a-number', required: false },
  { field: 'ac_power', scope: 'power', wrongValue: 'not-a-boolean', required: true },
  { field: 'battery_charging', scope: 'battery', wrongValue: 'not-a-boolean', required: true },
  { field: 'battery_voltage_low', scope: 'battery', wrongValue: 'not-a-boolean', required: true },
  { field: 'battery_health', scope: 'battery', wrongValue: 'not-a-number', required: true },
  { field: 'hours_of_protection', scope: 'battery', wrongValue: 'not-a-number', required: true },
  { field: 'water_sensor_fault', scope: 'fault', wrongValue: 'not-a-boolean', required: true },
  { field: 'serial_communications', scope: 'fault', wrongValue: 'not-a-boolean', required: true },
  { field: 'alarm_audio_muted', scope: undefined, wrongValue: 'not-a-boolean', required: true },
  { field: 'test_running', scope: undefined, wrongValue: 'not-a-boolean', required: true },
  { field: 'test_timestamp', scope: undefined, wrongValue: 'not-a-number', required: false },
  { field: 'offline', scope: 'connectivity', wrongValue: 'not-a-boolean', required: true },
];

const METADATA_SCOPES: readonly MetadataScopeRow[] = [
  { field: 'wifi_signal_dbm', wrongValue: 'strong' },
  { field: 'mcu_firmware_version', wrongValue: 123 },
  { field: 'wifi_firmware_version', wrongValue: 123 },
  { field: 'mcu_target_version', wrongValue: 123 },
];

// A valid telemetry record with one field left out, so the case exercises an
// omission rather than a rebuilt object.
function telemetryWithout(field: GeminiTelemetryField): Record<string, unknown> {
  return Object.fromEntries(Object.entries(validTelemetry()).filter(([name]) => name !== field));
}

function buildSnapshot(data: Record<string, unknown>, metadata: Record<string, unknown> = {}): DeviceSnapshot {
  return {
    identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
    connectivity: { connected: true, timestamp: RECEIVED_AT },
    data,
    metadata,
    shadowVersion: undefined,
    deviceTimestamp: RECEIVED_AT,
    receivedAt: RECEIVED_AT,
  };
}

describe('validate', () => {
  test('returns valid for a snapshot with every required telemetry field present and correctly typed, and every metadata field absent', () => {
    // arrange
    const snapshot = buildSnapshot(validTelemetry());

    // act & assert
    assert.deepStrictEqual(geminiFamily.validate(snapshot), { valid: true });
  });

  test('returns valid when backup_pump_timestamp and test_timestamp are both present and correctly typed', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), backup_pump_timestamp: 1_699_999_000, test_timestamp: 1_699_998_000 });

    // act & assert
    assert.deepStrictEqual(geminiFamily.validate(snapshot), { valid: true });
  });

  test('returns valid when every metadata field is present and correctly typed', () => {
    // arrange
    const snapshot = buildSnapshot(validTelemetry(), validMetadata());

    // act & assert
    assert.deepStrictEqual(geminiFamily.validate(snapshot), { valid: true });
  });

  for (const { field, scope, wrongValue } of TELEMETRY_SCOPES) {
    test(`RES-01 attributes a wrong-type ${field} violation to the ${String(scope)} scope`, () => {
      // arrange
      const snapshot = buildSnapshot({ ...validTelemetry(), [field]: wrongValue });

      // act
      const validation = geminiFamily.validate(snapshot);

      // assert
      assert.deepStrictEqual(validation, { valid: false, violations: [{ field, reason: 'wrong-type', scope }] });
    });
  }

  for (const { field, scope } of TELEMETRY_SCOPES.filter((row) => row.required)) {
    test(`RES-01 attributes a missing ${field} violation to the ${String(scope)} scope`, () => {
      // act
      const validation = geminiFamily.validate(buildSnapshot(telemetryWithout(field)));

      // assert
      assert.deepStrictEqual(validation, { valid: false, violations: [{ field, reason: 'missing', scope }] });
    });
  }

  for (const { field, scope, illegalValue } of [
    { field: 'water_level', scope: 'water', illegalValue: 2 },
    { field: 'battery_health', scope: 'battery', illegalValue: 3 },
    { field: 'hours_of_protection', scope: 'battery', illegalValue: 3 },
  ] satisfies readonly { field: GeminiTelemetryField; scope: TrustScope; illegalValue: number }[]) {
    test(`RES-01 attributes an out-of-domain ${field} violation to the ${scope} scope`, () => {
      // arrange
      const snapshot = buildSnapshot({ ...validTelemetry(), [field]: illegalValue });

      // act
      const validation = geminiFamily.validate(snapshot);

      // assert
      assert.deepStrictEqual(validation, { valid: false, violations: [{ field, reason: 'out-of-domain', scope }] });
    });
  }

  for (const { field, wrongValue } of METADATA_SCOPES) {
    test(`RES-01 attributes a wrong-type ${field} violation to no scope, because no published service reads it`, () => {
      // arrange
      const snapshot = buildSnapshot(validTelemetry(), { [field]: wrongValue });

      // act
      const validation = geminiFamily.validate(snapshot);

      // assert
      assert.deepStrictEqual(validation, { valid: false, violations: [{ field, reason: 'wrong-type', scope: undefined }] });
    });
  }

  test('returns every violation a snapshot carries, not only the first, each with its own scope', () => {
    // arrange
    const snapshot = buildSnapshot({ ...telemetryWithout('primary_pump_running'), water_level: 2 });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, {
      valid: false,
      violations: [
        { field: 'water_level', reason: 'out-of-domain', scope: 'water' },
        { field: 'primary_pump_running', reason: 'missing', scope: 'pump' },
      ],
    });
  });
});

describe('decode', () => {
  test('builds telemetry and metadata field by field, matching every source value exactly', () => {
    // arrange
    const snapshot = buildSnapshot(
      { ...validTelemetry(), backup_pump_timestamp: 1_699_999_000, test_timestamp: 1_699_998_000, unread_vendor_field: 'leak' },
      { ...validMetadata(), unread_vendor_field: 'leak' },
    );

    // act
    const state = geminiFamily.decode(snapshot);

    // assert
    assert.deepStrictEqual(state, {
      telemetry: {
        waterLevel: 1,
        primaryPumpRunning: false,
        primaryPumpFault: false,
        backupPumpRunning: false,
        backupPumpFault: false,
        backupPumpFuseBlown: false,
        backupPumpTimestamp: 1_699_999_000,
        acPower: true,
        batteryCharging: false,
        batteryVoltageLow: false,
        batteryHealth: 8,
        hoursOfProtection: 8,
        waterSensorFault: false,
        serialCommunications: true,
        alarmAudioMuted: false,
        testRunning: false,
        testTimestamp: 1_699_998_000,
        offline: false,
      },
      metadata: {
        wifiSignalDbm: -60,
        mcuFirmwareVersion: '1.2.3',
        wifiFirmwareVersion: '4.5.6',
        mcuTargetVersion: '1.3.0',
      },
    });
  });

  test('decodes backupPumpTimestamp, testTimestamp, and every metadata field as undefined when the source omits them', () => {
    // arrange
    const snapshot = buildSnapshot(validTelemetry());

    // act
    const state = geminiFamily.decode(snapshot);

    // assert
    assert.deepStrictEqual(
      { backupPumpTimestamp: state.telemetry.backupPumpTimestamp, testTimestamp: state.telemetry.testTimestamp, metadata: state.metadata },
      {
        backupPumpTimestamp: undefined,
        testTimestamp: undefined,
        metadata: { wifiSignalDbm: undefined, mcuFirmwareVersion: undefined, wifiFirmwareVersion: undefined, mcuTargetVersion: undefined },
      },
    );
  });

  test('throws when a required boolean field does not match the type validate() should have confirmed', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), primary_pump_running: 'not-a-boolean' });

    // act & assert
    assert.throws(() => geminiFamily.decode(snapshot), TypeError);
  });

  test('throws when a required number field does not match the type validate() should have confirmed', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), water_level: 'not-a-number' });

    // act & assert
    assert.throws(() => geminiFamily.decode(snapshot), TypeError);
  });

  test('throws when a metadata string field does not match the type validate() should have confirmed', () => {
    // arrange
    const snapshot = buildSnapshot(validTelemetry(), { mcu_firmware_version: 123 });

    // act & assert
    assert.throws(() => geminiFamily.decode(snapshot), TypeError);
  });
});

describe('capabilities', () => {
  test('returns self-test and alarm-mute for any decoded state', () => {
    // arrange
    const state = geminiFamily.decode(buildSnapshot(validTelemetry()));

    // act & assert
    assert.deepStrictEqual(geminiFamily.capabilities(state), ['self-test', 'alarm-mute']);
  });
});

describe('command', () => {
  test('command("self-test", true) requests test_running true', () => {
    // act & assert
    assert.deepStrictEqual(geminiFamily.command('self-test', true), { desiredData: { test_running: true } });
  });

  test('command("self-test", false) requests test_running false', () => {
    // act & assert
    assert.deepStrictEqual(geminiFamily.command('self-test', false), { desiredData: { test_running: false } });
  });

  test('command("alarm-mute", true) requests alarm_audio_muted true', () => {
    // act & assert
    assert.deepStrictEqual(geminiFamily.command('alarm-mute', true), { desiredData: { alarm_audio_muted: true } });
  });

  test('command("alarm-mute", false) requests alarm_audio_muted false', () => {
    // act & assert
    assert.deepStrictEqual(geminiFamily.command('alarm-mute', false), { desiredData: { alarm_audio_muted: false } });
  });
});
