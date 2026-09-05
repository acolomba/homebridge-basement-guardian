/**
 * @fileoverview Step definitions for restarting and shutting down the harness against the real
 * Gemini.
 */

import assert from 'node:assert/strict';

import { Then, When } from '@cucumber/cucumber';

import { until } from './steps.js';

import type { RealPumpWorld } from './realWorld.js';

const MILLISECONDS_PER_SECOND = 1_000;

When('the harness restarts', async function (this: RealPumpWorld) {
  await this.restart();
});

When('the harness stops', async function (this: RealPumpWorld) {
  await this.stop();
});

When('the harness remembers the token cache fingerprint as {string} within {int} seconds', async function (this: RealPumpWorld, name: string, seconds: number) {
  const fingerprint = await until(() => this.tokenCacheFingerprint(), seconds * MILLISECONDS_PER_SECOND, 'the token cache was not written');

  this.remember(name, fingerprint);
});

Then('the token cache fingerprint matches {string}', async function (this: RealPumpWorld, name: string) {
  const fingerprint = await this.tokenCacheFingerprint();

  assert.strictEqual(fingerprint, this.recall(name));
});

Then('the harness recorded no unhandled rejection', function (this: RealPumpWorld) {
  assert.deepStrictEqual(this.unhandledRejections(), []);
});
