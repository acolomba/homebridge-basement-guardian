// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Supplies fresh synthetic device and identity records for state tests.
 */

import type { ApiDevice } from '../../src/cloud/types.js';
import type { DeviceIdentity } from '../../src/device/state.js';

/** Returns a fresh Gemini record with a synthetic account identifier. */
export function geminiDevice(): ApiDevice {
  return {
    deviceId: 'account-1_serial-1',
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: 1_700_000_000_000 },
    data: { water_level: 1, primary_pump_running: false, ac_power: true },
  };
}

/** Returns fresh identifying and display facts for the synthetic Gemini device. */
export function geminiIdentity(): DeviceIdentity {
  return { deviceId: 'account-1_serial-1', deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' };
}
