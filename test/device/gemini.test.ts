import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { geminiFamily } from '../../src/device/gemini.js';

import type { GeminiDeviceTypeId, GeminiMetadataField, GeminiTelemetryField } from '../../src/device/gemini.js';
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

  test('returns a missing violation when a required boolean field is absent', () => {
    // arrange
    const telemetry = validTelemetry();
    delete telemetry.primary_pump_running;
    const snapshot = buildSnapshot(telemetry);

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'primary_pump_running', reason: 'missing' }] });
  });

  test('returns a missing violation when a required enum field is absent', () => {
    // arrange
    const telemetry = validTelemetry();
    delete telemetry.water_level;
    const snapshot = buildSnapshot(telemetry);

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'water_level', reason: 'missing' }] });
  });

  test('returns a wrong-type violation when a required enum field is not a number', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), water_level: '1' });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'water_level', reason: 'wrong-type' }] });
  });

  test('returns an out-of-domain violation when water_level is outside its legal codes', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), water_level: 2 });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'water_level', reason: 'out-of-domain' }] });
  });

  test('returns an out-of-domain violation when battery_health is outside its legal codes', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), battery_health: 3 });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'battery_health', reason: 'out-of-domain' }] });
  });

  test('returns an out-of-domain violation when hours_of_protection is outside its legal codes', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), hours_of_protection: 3 });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'hours_of_protection', reason: 'out-of-domain' }] });
  });

  test('returns a wrong-type violation when serial_communications is a string', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), serial_communications: 'true' });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'serial_communications', reason: 'wrong-type' }] });
  });

  test('returns valid when backup_pump_timestamp and test_timestamp are both absent', () => {
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

  test('returns a wrong-type violation when backup_pump_timestamp is present with the wrong type', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), backup_pump_timestamp: 'not-a-number' });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'backup_pump_timestamp', reason: 'wrong-type' }] });
  });

  test('returns a wrong-type violation when test_timestamp is present with the wrong type', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), test_timestamp: 'not-a-number' });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'test_timestamp', reason: 'wrong-type' }] });
  });

  test('returns valid when every metadata field is present and correctly typed', () => {
    // arrange
    const snapshot = buildSnapshot(validTelemetry(), validMetadata());

    // act & assert
    assert.deepStrictEqual(geminiFamily.validate(snapshot), { valid: true });
  });

  test('returns a wrong-type violation when wifi_signal_dbm is present with the wrong type', () => {
    // arrange
    const snapshot = buildSnapshot(validTelemetry(), { wifi_signal_dbm: 'strong' });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'wifi_signal_dbm', reason: 'wrong-type' }] });
  });

  test('returns a wrong-type violation when mcu_firmware_version is present with the wrong type', () => {
    // arrange
    const snapshot = buildSnapshot(validTelemetry(), { mcu_firmware_version: 123 });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, { valid: false, violations: [{ field: 'mcu_firmware_version', reason: 'wrong-type' }] });
  });

  test('returns every violation a snapshot carries, not only the first', () => {
    // arrange
    const telemetry = validTelemetry();
    delete telemetry.primary_pump_running;
    const snapshot = buildSnapshot({ ...telemetry, water_level: 2 });

    // act
    const validation = geminiFamily.validate(snapshot);

    // assert
    assert.deepStrictEqual(validation, {
      valid: false,
      violations: [
        { field: 'water_level', reason: 'out-of-domain' },
        { field: 'primary_pump_running', reason: 'missing' },
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
