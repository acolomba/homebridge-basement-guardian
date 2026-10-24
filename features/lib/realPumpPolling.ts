// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Bounded polling for real-pump observations.
 */

import { setTimeout as delay } from 'node:timers/promises';

const POLL_INTERVAL_MS = 200;

/**
 * Resolves once `read()` answers a defined value, or fails once the deadline passes.
 *
 * The harness watches a real, external system it does not control, so it polls rather than
 * waits on an event this suite has no hook for. `read()` may answer synchronously or through a
 * promise; awaiting a plain value resolves it immediately, so one poller serves both shapes.
 */
export async function until<T>(read: () => T | undefined | Promise<T | undefined>, timeoutMs: number, failure: string): Promise<T> {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const value = await read();

    if (value !== undefined) {
      return value;
    }

    if (Date.now() >= deadline) {
      throw new Error(`${failure} within ${String(timeoutMs)} ms`);
    }

    await delay(POLL_INTERVAL_MS);
  }
}
