// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Registers real-profile steps for device discovery and initial shadow state.
 */

import assert from 'node:assert/strict';

import { Then } from '@cucumber/cucumber';

import { until } from '../../lib/realPumpPolling.js';

import type { RealPumpWorld } from './realWorld.js';

Then('the harness discovers at least one device within {int} seconds', { timeout: 35_000 }, async function (this: RealPumpWorld, seconds: number) {
  await until(() => (this.deviceIds().length > 0 ? true : undefined), seconds * 1000, 'no device was discovered');
});

Then('the discovered device snapshot has a valid device id', function (this: RealPumpWorld) {
  const [deviceId] = this.deviceIds();

  assert.ok(deviceId !== undefined && deviceId.length > 0, 'no device has been discovered yet');

  const snapshot = this.snapshot(deviceId);

  assert.ok(snapshot !== undefined, 'the harness holds no discovered snapshot');
  assert.ok(snapshot.identity.deviceId === deviceId, 'the snapshot device id differs from discovery');
});

Then(
  'the discovered device snapshot gains shadow-sourced fields within {int} seconds',
  { timeout: 50_000 },
  async function (this: RealPumpWorld, seconds: number) {
    const [deviceId] = this.deviceIds();

    assert.ok(deviceId !== undefined, 'no device has been discovered yet');

    // A defined shadowVersion is what the store sets once the shadow, rather than the REST poll,
    // owns this device's telemetry (SYNC-02, SYNC-03) -- the signal that the shadow has actually
    // applied a document, not merely that the connection opened.
    await until(() => (this.snapshot(deviceId)?.shadowVersion !== undefined ? true : undefined), seconds * 1000, 'no shadow-sourced fields arrived');
  },
);
