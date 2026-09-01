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
} from '../../src/device/family.js';

// A family's decoded state is the family's own, so the contract is checked
// against a stand-in rather than a shape this module decides.
interface SumpState {
  flooded: boolean;
}

const geminiAdapter = {
  deviceTypeId: 'wayneWaterGemini',
  displayName: 'Basement Guardian Gemini',
  implemented: true,
  validate: () => ({ valid: true }),
  decode: () => ({ flooded: false }),
  capabilities: () => ['self-test'],
  command: () => ({ desiredData: { test_running: true } }),
} satisfies DeviceFamily<SumpState>;

void ('self-test' satisfies DeviceCapability);
void ('out-of-domain' satisfies FieldViolationReason);
void ({ field: 'water_level', reason: 'out-of-domain', scope: 'water' } satisfies FieldViolation);
void ({ field: 'test_running', reason: 'wrong-type', scope: 'self-test' } satisfies FieldViolation);
void ({ field: 'mcu_firmware_version', reason: 'wrong-type', scope: undefined } satisfies FieldViolation);
void ({ valid: true } satisfies FamilyValidation);
void ({ valid: false, violations: [{ field: 'water_level', reason: 'missing', scope: 'water' }] } satisfies FamilyValidation);
void ({ desiredData: { test_running: true } } satisfies FamilyCommand);
void (geminiAdapter satisfies DeviceFamily<SumpState>);

void ({ levelCode: 31, levelPercent: 100, flooded: true } satisfies WaterState);
void ({ primaryRunning: true, backupRunning: false, backupActivatedAt: 1_699_999_000 } satisfies PumpState);
void ({ mainsPresent: false } satisfies PowerState);
void ({ charging: true, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false } satisfies BatteryState);
void ({
  primaryPumpFault: false,
  backupPumpFault: false,
  backupPumpFuseBlown: false,
  waterSensorFault: false,
  controllerLinkPresent: true,
} satisfies FaultState);
void ({ reportedOffline: false } satisfies ConnectivityState);
void ({ running: true, testedAt: 1_699_998_000 } satisfies SelfTestState);
void ({ running: false, testedAt: undefined } satisfies SelfTestState);
void ({ muted: true } satisfies AlarmMuteState);
void ({ mcuFirmwareVersion: '1.2.3', wifiFirmwareVersion: '4.5.6', mcuTargetVersion: '1.3.0', wifiSignalDbm: -60 } satisfies DeviceMetadataState);

void ({
  water: { levelCode: 0, levelPercent: 0, flooded: false },
  pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined },
  power: { mainsPresent: true },
  battery: { charging: false, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
  fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
  connectivity: { reportedOffline: false },
  'self-test': { running: false, testedAt: undefined },
  'alarm-mute': { muted: false },
  metadata: { mcuFirmwareVersion: '1.2.3', wifiFirmwareVersion: '4.5.6', mcuTargetVersion: '1.3.0', wifiSignalDbm: -60 },
} satisfies ScopedDomainState);

// Only the scope that lost its link is absent; the rest keep publishing current values.
void ({
  water: undefined,
  pump: undefined,
  power: undefined,
  battery: undefined,
  fault: undefined,
  connectivity: { reportedOffline: false },
  'self-test': undefined,
  'alarm-mute': undefined,
  metadata: undefined,
} satisfies ScopedDomainState);

// @ts-expect-error a valid verdict carries no violations, so the two forms cannot be mixed
void ({ valid: true, violations: [] } satisfies FamilyValidation);
// @ts-expect-error a rejected snapshot says which fields failed and why
void ({ valid: false } satisfies FamilyValidation);
// @ts-expect-error the command body reaches the vendor as requested data, not as reported state
void ({ reportedData: { test_running: true } } satisfies FamilyCommand);
// @ts-expect-error a field violation names the field it is about
void ({ reason: 'missing', scope: 'water' } satisfies FieldViolation);
// @ts-expect-error a field violation names the scope that stops being trustworthy while it is invalid
void ({ field: 'water_level', reason: 'missing' } satisfies FieldViolation);
// @ts-expect-error a family that forgets a scope states its absence rather than omitting the member
void ({ water: undefined, pump: undefined, power: undefined, battery: undefined, fault: undefined, connectivity: undefined } satisfies ScopedDomainState);
// @ts-expect-error the self-test scope carries the device's own timestamp beside the running flag
void ({ running: true } satisfies SelfTestState);
// @ts-expect-error the alarm mute scope reports what the device says about its audible alarm
void ({} satisfies AlarmMuteState);

const { implemented, ...withoutSupportFlag } = geminiAdapter;
void (implemented satisfies boolean);
// @ts-expect-error an adapter states whether it can drive the device type it names
void (withoutSupportFlag satisfies DeviceFamily<SumpState>);
