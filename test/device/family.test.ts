import type { DeviceCapability, DeviceFamily, FamilyCommand, FamilyValidation, FieldViolation, FieldViolationReason } from '../../src/device/family.js';

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
void ({ field: 'water_level', reason: 'out-of-domain' } satisfies FieldViolation);
void ({ valid: true } satisfies FamilyValidation);
void ({ valid: false, violations: [{ field: 'water_level', reason: 'missing' }] } satisfies FamilyValidation);
void ({ desiredData: { test_running: true } } satisfies FamilyCommand);
void (geminiAdapter satisfies DeviceFamily<SumpState>);

// @ts-expect-error a valid verdict carries no violations, so the two forms cannot be mixed
void ({ valid: true, violations: [] } satisfies FamilyValidation);
// @ts-expect-error a rejected snapshot says which fields failed and why
void ({ valid: false } satisfies FamilyValidation);
// @ts-expect-error the command body reaches the vendor as requested data, not as reported state
void ({ reportedData: { test_running: true } } satisfies FamilyCommand);
// @ts-expect-error a field violation names the field it is about
void ({ reason: 'missing' } satisfies FieldViolation);

const { implemented, ...withoutSupportFlag } = geminiAdapter;
void (implemented satisfies boolean);
// @ts-expect-error an adapter states whether it can drive the device type it names
void (withoutSupportFlag satisfies DeviceFamily<SumpState>);
