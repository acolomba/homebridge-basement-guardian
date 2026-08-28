import type { HaloDeviceTypeId } from '../../src/device/halo.js';

void ('wayneWaterHalo' satisfies HaloDeviceTypeId);

// @ts-expect-error the Gemini identity selects a different adapter
void ('wayneWaterGemini' satisfies HaloDeviceTypeId);
// @ts-expect-error a device type the plugin has never seen is not a HALO
void ('wayneWaterUnknown' satisfies HaloDeviceTypeId);
