import type { BasementGuardianAccessory } from '../../src/accessories/basementGuardian.js';

const DEVICE_ID = 'account-1_serial-1';

void ({
  deviceId: DEVICE_ID,
  services: [{ kind: 'sump-pit-flood', subtype: 'sump-pit-flood', name: 'Sump Pit Flood' }],
  update: () => undefined,
} satisfies BasementGuardianAccessory);

// @ts-expect-error the accessory is seeded by the immutable vendor identifier
void ({ services: [], update: () => undefined } satisfies BasementGuardianAccessory);
// @ts-expect-error state reaches HomeKit through the update entry point alone
void ({ deviceId: DEVICE_ID, services: [] } satisfies BasementGuardianAccessory);
// @ts-expect-error a published service is a keyed descriptor, not a bare name
void ({ deviceId: DEVICE_ID, services: ['sump-pit-flood'], update: () => undefined } satisfies BasementGuardianAccessory);
