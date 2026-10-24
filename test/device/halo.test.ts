// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/** @fileoverview Verifies the HALO identity contract and product name. */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HALO_DISPLAY_NAME } from '../../src/device/halo.js';

import type { HaloDeviceTypeId } from '../../src/device/halo.js';

void ('wayneWaterHalo' satisfies HaloDeviceTypeId);

// @ts-expect-error the Gemini identity selects a different adapter
void ('wayneWaterGemini' satisfies HaloDeviceTypeId);
// @ts-expect-error a device type the plugin has never seen is not a HALO
void ('wayneWaterUnknown' satisfies HaloDeviceTypeId);

test('HALO_DISPLAY_NAME carries the HALO product name', () => {
  // arrange
  const expectedDisplayName = 'Wayne Water HALO';

  // act
  const displayName = HALO_DISPLAY_NAME;

  // assert
  assert.strictEqual(displayName, expectedDisplayName);
});
