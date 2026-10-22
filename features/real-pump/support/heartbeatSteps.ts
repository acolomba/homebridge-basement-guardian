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

Then('the connection reports no failure or unhandled rejection', function (this: RealPumpWorld) {
  assert.strictEqual(this.failureLines().length, 0, 'the connection reported a failure');
  assert.deepStrictEqual(this.unhandledRejections(), []);
});
