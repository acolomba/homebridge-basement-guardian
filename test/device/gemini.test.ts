import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, test } from 'node:test';

import { geminiFamily } from '../../src/device/gemini.js';

import type { GeminiDeviceTypeId, GeminiDomainState, GeminiMetadataField, GeminiTelemetryField } from '../../src/device/gemini.js';
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

// The trustworthy scopes a caller reads off a decoded state, in the order
// `ScopedDomainState` declares them.
const DECODED_SCOPES = ['water', 'pump', 'power', 'battery', 'fault', 'connectivity', 'metadata'] as const;

function absentScopesOf(state: GeminiDomainState): string[] {
  return DECODED_SCOPES.filter((scope) => state[scope] === undefined);
}

// A record whose one field answers correctly the first time it is read and
// differently afterwards. `validate()` reads each field once, so this is the
// broken contract a group decoder's guard exists to catch.
function fieldChangingAfterValidation(record: Record<string, unknown>, field: string, valueAfterValidation: unknown): Record<string, unknown> {
  const reported = record[field];
  let reads = 0;

  return Object.defineProperty({ ...record }, field, {
    enumerable: true,
    get: () => {
      reads += 1;

      return reads === 1 ? reported : valueAfterValidation;
    },
  });
}

describe('decode', () => {
  test('decodes every scope of a fully valid snapshot, field by field', () => {
    // arrange
    const snapshot = buildSnapshot(
      { ...validTelemetry(), backup_pump_timestamp: 1_699_999_000, test_timestamp: 1_699_998_000, unread_vendor_field: 'leak' },
      { ...validMetadata(), unread_vendor_field: 'leak' },
    );
    const expectedState: GeminiDomainState = {
      water: { levelCode: 1, levelPercent: 20, flooded: false },
      pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: 1_699_999_000 },
      power: { mainsPresent: true },
      battery: { charging: false, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
      fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
      connectivity: { reportedOffline: false },
      metadata: { mcuFirmwareVersion: '1.2.3', wifiFirmwareVersion: '4.5.6', mcuTargetVersion: '1.3.0', wifiSignalDbm: -60 },
    };

    // act & assert
    assert.deepStrictEqual(geminiFamily.decode(snapshot), expectedState);
  });

  test('decodes backupActivatedAt and every metadata member as undefined when the source omits them', () => {
    // arrange
    const snapshot = buildSnapshot(validTelemetry());
    const expectedState = {
      pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined },
      metadata: { mcuFirmwareVersion: undefined, wifiFirmwareVersion: undefined, mcuTargetVersion: undefined, wifiSignalDbm: undefined },
    };

    // act
    const state = geminiFamily.decode(snapshot);

    // assert
    assert.deepStrictEqual({ pump: state.pump, metadata: state.metadata }, expectedState);
  });

  test('SAFE-01 omits the water scope for an out-of-domain water_level while every other scope keeps its current values', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), water_level: 2 }, validMetadata());
    const expectedState: GeminiDomainState = {
      water: undefined,
      pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined },
      power: { mainsPresent: true },
      battery: { charging: false, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
      fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
      connectivity: { reportedOffline: false },
      metadata: { mcuFirmwareVersion: '1.2.3', wifiFirmwareVersion: '4.5.6', mcuTargetVersion: '1.3.0', wifiSignalDbm: -60 },
    };

    // act & assert
    assert.deepStrictEqual(geminiFamily.decode(snapshot), expectedState);
  });

  test('SAFE-01 never reaches the level lookup for an out-of-domain water_level', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), water_level: 2 });

    // act & assert
    assert.doesNotThrow(() => geminiFamily.decode(snapshot));
  });

  test('RES-01 omits the power scope for a missing ac_power while the water scope still carries its level', () => {
    // arrange
    const snapshot = buildSnapshot(telemetryWithout('ac_power'));
    const expectedState = { power: undefined, water: { levelCode: 1, levelPercent: 20, flooded: false } };

    // act
    const state = geminiFamily.decode(snapshot);

    // assert
    assert.deepStrictEqual({ power: state.power, water: state.water }, expectedState);
  });

  test('RES-01 omits the whole battery scope for an out-of-domain battery_health, leaving no partly populated group', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), battery_health: 64, hours_of_protection: 4 });

    // act
    const state = geminiFamily.decode(snapshot);

    // assert
    assert.strictEqual(state.battery, undefined);
  });

  for (const { scope, field, wrongValue } of [
    { scope: 'water', field: 'water_level', wrongValue: 2 },
    { scope: 'pump', field: 'backup_pump_running', wrongValue: 'not-a-boolean' },
    { scope: 'power', field: 'ac_power', wrongValue: 'not-a-boolean' },
    { scope: 'battery', field: 'battery_health', wrongValue: 64 },
    { scope: 'fault', field: 'water_sensor_fault', wrongValue: 'not-a-boolean' },
    { scope: 'connectivity', field: 'offline', wrongValue: 'not-a-boolean' },
  ] satisfies readonly { scope: TrustScope; field: GeminiTelemetryField; wrongValue: unknown }[]) {
    test(`RES-01 omits the ${scope} scope and no other when ${field} is invalid`, () => {
      // arrange
      const snapshot = buildSnapshot({ ...validTelemetry(), [field]: wrongValue }, validMetadata());

      // act
      const state = geminiFamily.decode(snapshot);

      // assert
      assert.deepStrictEqual(absentScopesOf(state), [scope]);
    });
  }

  for (const field of ['alarm_audio_muted', 'test_running', 'test_timestamp'] satisfies readonly GeminiTelemetryField[]) {
    test(`RES-01 keeps every scope when the command-surface field ${field} is invalid`, () => {
      // arrange
      const snapshot = buildSnapshot({ ...validTelemetry(), [field]: 'not-the-declared-type' }, validMetadata());

      // act
      const state = geminiFamily.decode(snapshot);

      // assert
      assert.deepStrictEqual(absentScopesOf(state), []);
    });
  }

  for (const { field, wrongValue } of METADATA_SCOPES) {
    test(`RES-01 omits only the metadata scope when ${field} has the wrong type`, () => {
      // arrange
      const snapshot = buildSnapshot(validTelemetry(), { ...validMetadata(), [field]: wrongValue });

      // act
      const state = geminiFamily.decode(snapshot);

      // assert
      assert.deepStrictEqual(absentScopesOf(state), ['metadata']);
    });
  }

  for (const { protectionHoursCode, levelPercent } of [
    { protectionHoursCode: 1, levelPercent: 25 },
    { protectionHoursCode: 2, levelPercent: 50 },
    { protectionHoursCode: 4, levelPercent: 75 },
    { protectionHoursCode: 8, levelPercent: 100 },
  ]) {
    test(`SAFE-06 publishes hours_of_protection ${String(protectionHoursCode)} as ${String(levelPercent)} percent`, () => {
      // arrange
      const snapshot = buildSnapshot({ ...validTelemetry(), hours_of_protection: protectionHoursCode });

      // act
      const state = geminiFamily.decode(snapshot);

      // assert
      assert.strictEqual(state.battery?.levelPercent, levelPercent);
    });
  }

  for (const { healthCode, voltageLow, low } of [
    { healthCode: 1, voltageLow: false, low: true },
    { healthCode: 2, voltageLow: false, low: true },
    { healthCode: 4, voltageLow: false, low: false },
    { healthCode: 8, voltageLow: false, low: false },
    { healthCode: 16, voltageLow: false, low: false },
    { healthCode: 32, voltageLow: false, low: true },
    { healthCode: 8, voltageLow: true, low: true },
  ]) {
    test(`D-07 reports the battery as low=${String(low)} for health ${String(healthCode)} with battery_voltage_low ${String(voltageLow)}`, () => {
      // arrange
      const snapshot = buildSnapshot({ ...validTelemetry(), battery_health: healthCode, battery_voltage_low: voltageLow });

      // act
      const state = geminiFamily.decode(snapshot);

      // assert
      assert.strictEqual(state.battery?.low, low);
    });
  }

  test('D-08 publishes the reported protection band even when battery_health reports NotDetected', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), battery_health: 32, hours_of_protection: 1 });
    const expectedBattery = { charging: false, voltageLow: false, healthCode: 32, protectionHoursCode: 1, levelPercent: 25, low: true };

    // act
    const state = geminiFamily.decode(snapshot);

    // assert
    assert.deepStrictEqual(state.battery, expectedBattery);
  });

  test('RES-02 reports serial_communications verbatim rather than inverting it', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), serial_communications: false });

    // act
    const state = geminiFamily.decode(snapshot);

    // assert
    assert.strictEqual(state.fault?.controllerLinkPresent, false);
  });

  test('D-10 decodes a snapshot identically however long ago it was received', () => {
    // arrange
    const telemetry = validTelemetry();
    const recent = { ...buildSnapshot(telemetry, validMetadata()), receivedAt: RECEIVED_AT, deviceTimestamp: RECEIVED_AT };
    const ancient = { ...buildSnapshot(telemetry, validMetadata()), receivedAt: 0, deviceTimestamp: 0 };

    // act & assert
    assert.deepStrictEqual(geminiFamily.decode(ancient), geminiFamily.decode(recent));
  });

  test('throws when a boolean field stops matching the type validate() confirmed', () => {
    // arrange
    const snapshot = buildSnapshot(fieldChangingAfterValidation(validTelemetry(), 'primary_pump_running', 'not-a-boolean'));

    // act & assert
    assert.throws(() => geminiFamily.decode(snapshot), TypeError);
  });

  test('throws when a number field stops matching the type validate() confirmed', () => {
    // arrange
    const snapshot = buildSnapshot(fieldChangingAfterValidation(validTelemetry(), 'water_level', 'not-a-number'));

    // act & assert
    assert.throws(() => geminiFamily.decode(snapshot), TypeError);
  });

  test('throws when hours_of_protection stops matching the band validate() confirmed', () => {
    // arrange
    const snapshot = buildSnapshot(fieldChangingAfterValidation(validTelemetry(), 'hours_of_protection', 64));

    // act & assert
    assert.throws(() => geminiFamily.decode(snapshot), TypeError);
  });

  test('throws when a metadata string field stops matching the type validate() confirmed', () => {
    // arrange
    const snapshot = buildSnapshot(validTelemetry(), fieldChangingAfterValidation(validMetadata(), 'mcu_firmware_version', 123));

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

// The field-validity half of RES-01 ships without a freshness policy attached
// to it: the heartbeat interval, the missed-heartbeat rule, and shadow silence
// as a staleness signal all belong elsewhere, so nothing in the device tier may
// read a clock or judge a snapshot by its age (D-10).
test('D-10 keeps every freshness signal out of the device tier', () => {
  // arrange
  const deviceTier = ['waterLevel.ts', 'family.ts', 'gemini.ts'];
  const freshnessSignal = /runtime\/clock|Date\.now|new Date|setTimeout|setInterval|receivedAt|deviceTimestamp/;

  // act
  const offenders = deviceTier.filter((module) => freshnessSignal.test(readFileSync(resolve(import.meta.dirname, '../../../src/device', module), 'utf8')));

  // assert
  assert.deepStrictEqual(offenders, []);
});
