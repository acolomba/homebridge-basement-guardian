// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Step definitions for restarting and shutting down the harness against the real
 * Gemini.
 */

import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

import { Then, When } from '@cucumber/cucumber';

import { until } from '../../lib/realPumpPolling.js';

import type { RealPumpWorld } from './realWorld.js';

const MILLISECONDS_PER_SECOND = 1_000;

When('the harness starts', async function (this: RealPumpWorld) {
  await this.start();
});

When('the harness restarts', async function (this: RealPumpWorld) {
  await this.restart();
});

When('the harness stops within 5 seconds', { timeout: 5_000 }, async function (this: RealPumpWorld) {
  await this.stop();
});

When(
  'the harness remembers the token cache fingerprint as {string} within {int} seconds',
  { timeout: 15_000 },
  async function (this: RealPumpWorld, name: string, seconds: number) {
    const fingerprint = await until(() => this.tokenCacheFingerprint(), seconds * MILLISECONDS_PER_SECOND, 'the token cache was not written');

    this.remember(name, fingerprint);
  },
);

Then('the token cache fingerprint matches {string}', async function (this: RealPumpWorld, name: string) {
  const fingerprint = await this.tokenCacheFingerprint();

  assert.ok(fingerprint === this.recall(name), 'the token cache fingerprint changed');
});

Then('the harness reports no unhandled rejection for {int} second', { timeout: 10_000 }, async function (this: RealPumpWorld, seconds: number) {
  await delay(seconds * MILLISECONDS_PER_SECOND);
  assert.deepStrictEqual(this.unhandledRejections(), []);
});
