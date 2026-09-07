/**
 * @fileoverview Step definitions for observing heartbeats and natural updates against the real
 * Gemini, without ever requiring one to happen.
 */

import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

import { Then, When } from '@cucumber/cucumber';

import type { RealPumpWorld } from './realWorld.js';

const MILLISECONDS_PER_SECOND = 1_000;

// Cucumber's own step timeout defaults to 5000ms. This step's only caller waits up to 960 seconds,
// so the ceiling below is fixed at registration time, well above that wait, because Cucumber's
// step-options object cannot be computed per-invocation.
const STEP_TIMEOUT_MS = 1_000_000;

When('the harness waits {int} seconds', { timeout: STEP_TIMEOUT_MS }, async (seconds: number) => {
  await delay(seconds * MILLISECONDS_PER_SECOND);
});

When('the harness remembers the current snapshot as {string}', function (this: RealPumpWorld, name: string) {
  const [deviceId] = this.deviceIds();

  assert.ok(deviceId !== undefined, 'no device has been discovered yet');
  this.remember(name, this.snapshot(deviceId));
});

Then('the connection reports no failure', function (this: RealPumpWorld) {
  assert.deepStrictEqual(this.failureLines(), []);
  assert.deepStrictEqual(this.unhandledRejections(), []);
});

Then('the current snapshot no longer matches {string} if the store recorded a change', function (this: RealPumpWorld, name: string) {
  if (this.deviceChanges().length === 0) {
    return;
  }

  const [deviceId] = this.deviceIds();

  assert.ok(deviceId !== undefined, 'no device has been discovered yet');
  assert.notDeepStrictEqual(this.snapshot(deviceId), this.recall(name));
});
