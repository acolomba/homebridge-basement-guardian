/**
 * @fileoverview Step definitions for the real-pump suite's harness lifecycle and discovery
 * observations.
 *
 * Kept in one module because every step so far belongs to the same function: driving and
 * observing the harness this suite builds. A later scenario category (heartbeats, restart,
 * shutdown) gets its own module once it stops being that.
 */

import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

import { Then, When } from '@cucumber/cucumber';

import type { RealPumpWorld } from './realWorld.js';

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

When('the harness starts', async function (this: RealPumpWorld) {
  await this.start();
});

Then('the harness discovers one device within {int} seconds', async function (this: RealPumpWorld, seconds: number) {
  await until(() => (this.deviceIds().length > 0 ? true : undefined), seconds * 1000, 'no device was discovered');
});

Then('the discovered device snapshot has a valid deviceId', function (this: RealPumpWorld) {
  const [deviceId] = this.deviceIds();

  assert.ok(deviceId !== undefined && deviceId.length > 0, 'no device has been discovered yet');

  const snapshot = this.snapshot(deviceId);

  assert.ok(snapshot !== undefined, `the harness holds no snapshot for ${deviceId}`);
  assert.strictEqual(snapshot.identity.deviceId, deviceId);
});

Then('the discovered device snapshot gains shadow-sourced fields within {int} seconds', async function (this: RealPumpWorld, seconds: number) {
  const [deviceId] = this.deviceIds();

  assert.ok(deviceId !== undefined, 'no device has been discovered yet');

  // A defined shadowVersion is what the store sets once the shadow, rather than the REST poll,
  // owns this device's telemetry (SYNC-02, SYNC-03) -- the signal that the shadow has actually
  // applied a document, not merely that the connection opened.
  await until(() => (this.snapshot(deviceId)?.shadowVersion !== undefined ? true : undefined), seconds * 1000, 'no shadow-sourced fields arrived');
});
