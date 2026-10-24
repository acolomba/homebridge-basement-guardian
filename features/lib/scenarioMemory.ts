// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Stores values that one scenario passes between its steps.
 */

/** Values saved and recalled by one Cucumber World instance. */
export class ScenarioMemory {
  private readonly values = new Map<string, unknown>();

  /** Saves a value under the name a later step will use. */
  remember(name: string, value: unknown): void {
    this.values.set(name, value);
  }

  /** Returns a previously saved value. */
  recall(name: string): unknown {
    if (!this.values.has(name)) {
      throw new Error(`no step has remembered ${name} yet`);
    }

    return this.values.get(name);
  }
}
