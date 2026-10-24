// SPDX-License-Identifier: Apache-2.0

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Registers the Basement Guardian platform with Homebridge.
 *
 * Modified from the Homebridge plugin template (https://github.com/homebridge/homebridge-plugin-template).
 */

import { BasementGuardianPlatform } from './platform.js';
import { PLATFORM_NAME } from './settings.js';

import type { API } from 'homebridge';

/**
 * Registers the platform with Homebridge.
 */
export default function registerPlatform(api: API): void {
  api.registerPlatform(PLATFORM_NAME, BasementGuardianPlatform);
}
