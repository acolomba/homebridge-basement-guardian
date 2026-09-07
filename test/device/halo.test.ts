import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HALO_DEVICE_TYPE_ID, HALO_DISPLAY_NAME } from '../../src/device/halo.js';

import type { HaloDeviceTypeId } from '../../src/device/halo.js';

void ('wayneWaterHalo' satisfies HaloDeviceTypeId);

// @ts-expect-error the Gemini identity selects a different adapter
void ('wayneWaterGemini' satisfies HaloDeviceTypeId);
// @ts-expect-error a device type the plugin has never seen is not a HALO
void ('wayneWaterUnknown' satisfies HaloDeviceTypeId);

test('HALO_DEVICE_TYPE_ID carries the HALO deviceTypeId', () => {
  // act & assert
  assert.strictEqual(HALO_DEVICE_TYPE_ID, 'wayneWaterHalo');
});

test('HALO_DISPLAY_NAME carries a non-empty product name', () => {
  // act & assert
  assert.strictEqual(HALO_DISPLAY_NAME, 'Wayne Water HALO');
});
