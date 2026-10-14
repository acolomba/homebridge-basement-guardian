// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Checks the accessory-persistence port.
 */

import type { AccessoryStore } from '../../src/runtime/accessoryStore.js';

void ({ persist: () => undefined } satisfies AccessoryStore);
void ({ persist: () => 1 } satisfies AccessoryStore);

// @ts-expect-error a store supplies the required persistence operation
void ({} satisfies AccessoryStore);
// @ts-expect-error persistence is callable, not a stored flag
void ({ persist: false } satisfies AccessoryStore);
