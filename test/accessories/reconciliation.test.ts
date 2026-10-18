// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Verifies per-device absence confirmation and tracking removal.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createReconciliation } from '../../src/accessories/reconciliation.js';

import type { Reconciliation, ReconciliationOptions } from '../../src/accessories/reconciliation.js';
import type { Logging } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const OTHER_DEVICE_ID = 'account-1_serial-2';

// Logging is a callable interface with seven members, so the stub is a
// no-op function that carries them rather than an object literal.
function createSilentLog(): Logging {
  const noop: () => void = (): void => {
    // logging is not this module's job; the stub discards every call
  };

  return Object.assign(noop, {
    prefix: 'basement guardian',
    debug: noop,
    error: noop,
    info: noop,
    log: noop,
    success: noop,
    warn: noop,
  });
}

function reconciliationOptions(): ReconciliationOptions {
  return { log: createSilentLog() };
}

function reconciliation(): Reconciliation {
  return createReconciliation(reconciliationOptions());
}

describe('observe', () => {
  test('reports nothing for a deviceId never observed present', () => {
    // arrange
    const tracker = reconciliation();

    // act
    const confirmedAbsent = tracker.observe([]);

    // assert
    assert.deepStrictEqual(confirmedAbsent, []);
  });

  test('reports nothing after one absence following presence', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID]);

    // act
    const confirmedAbsent = tracker.observe([]);

    // assert
    assert.deepStrictEqual(confirmedAbsent, []);
  });

  test('reports a deviceId confirmed absent on its second consecutive absence', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID]);
    tracker.observe([]);

    // act
    const confirmedAbsent = tracker.observe([]);

    // assert
    assert.deepStrictEqual(confirmedAbsent, [DEVICE_ID]);
  });

  test('resets the count when a deviceId reappears, so one absence after that is not enough', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID]);
    tracker.observe([]);
    tracker.observe([DEVICE_ID]);

    // act
    const confirmedAbsent = tracker.observe([]);

    // assert
    assert.deepStrictEqual(confirmedAbsent, []);
  });

  test('treats a schema-valid empty list as a trustworthy response that can confirm absence', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID]);
    tracker.observe([]);

    // act
    const confirmedAbsent = tracker.observe([]);

    // assert
    assert.deepStrictEqual(confirmedAbsent, [DEVICE_ID]);
  });

  test('keeps reporting a deviceId confirmed absent on every later call while it stays absent', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID]);
    tracker.observe([]);
    tracker.observe([]);

    // act
    const confirmedAbsent = tracker.observe([]);

    // assert
    assert.deepStrictEqual(confirmedAbsent, [DEVICE_ID]);
  });

  test('tracks each deviceId independently', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID, OTHER_DEVICE_ID]);
    tracker.observe([DEVICE_ID]);

    // act
    const confirmedAbsent = tracker.observe([DEVICE_ID]);

    // assert
    assert.deepStrictEqual(confirmedAbsent, [OTHER_DEVICE_ID]);
  });
});

describe('present', () => {
  test('resets a confirmed absence and confirms it again only after two later omissions', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID]);
    tracker.observe([]);
    tracker.observe([]);

    // act
    tracker.present(DEVICE_ID);
    const afterFirstOmission = tracker.observe([]);
    const afterSecondOmission = tracker.observe([]);
    const afterThirdOmission = tracker.observe([]);

    // assert
    assert.deepStrictEqual(
      { afterFirstOmission, afterSecondOmission, afterThirdOmission },
      { afterFirstOmission: [], afterSecondOmission: [DEVICE_ID], afterThirdOmission: [DEVICE_ID] },
    );
  });

  test('does not advance another device absence count', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID, OTHER_DEVICE_ID]);
    tracker.observe([OTHER_DEVICE_ID]);

    // act
    tracker.present(DEVICE_ID);
    const afterFirstOmission = tracker.observe([]);
    const afterSecondOmission = tracker.observe([]);

    // assert
    assert.deepStrictEqual({ afterFirstOmission, afterSecondOmission }, { afterFirstOmission: [], afterSecondOmission: [DEVICE_ID, OTHER_DEVICE_ID] });
  });

  test('does not reset another device absence count', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID, OTHER_DEVICE_ID]);
    tracker.observe([]);

    // act
    tracker.present(DEVICE_ID);
    const afterFirstOmission = tracker.observe([]);
    const afterSecondOmission = tracker.observe([]);

    // assert
    assert.deepStrictEqual(
      { afterFirstOmission, afterSecondOmission },
      { afterFirstOmission: [OTHER_DEVICE_ID], afterSecondOmission: [DEVICE_ID, OTHER_DEVICE_ID] },
    );
  });

  test('tracks a newly present device for two later omissions', () => {
    // arrange
    const tracker = reconciliation();

    // act
    tracker.present(DEVICE_ID);
    const afterFirstOmission = tracker.observe([]);
    const afterSecondOmission = tracker.observe([]);

    // assert
    assert.deepStrictEqual({ afterFirstOmission, afterSecondOmission }, { afterFirstOmission: [], afterSecondOmission: [DEVICE_ID] });
  });

  test('lets forget remove the eligibility of a device recorded present', () => {
    // arrange
    const tracker = reconciliation();
    tracker.present(DEVICE_ID);
    tracker.observe([]);

    // act
    tracker.forget(DEVICE_ID);
    const afterFirstOmission = tracker.observe([]);
    const afterSecondOmission = tracker.observe([]);

    // assert
    assert.deepStrictEqual({ afterFirstOmission, afterSecondOmission }, { afterFirstOmission: [], afterSecondOmission: [] });
  });
});

describe('forget', () => {
  test('stops reporting a deviceId omitted afterward', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID]);
    tracker.observe([]);
    tracker.forget(DEVICE_ID);

    // act
    const confirmedAbsent = tracker.observe([]);

    // assert
    assert.deepStrictEqual(confirmedAbsent, []);
  });

  test('starts a fresh count from zero for a deviceId observed present afterward', () => {
    // arrange
    const tracker = reconciliation();
    tracker.observe([DEVICE_ID]);
    tracker.observe([]);
    tracker.forget(DEVICE_ID);
    tracker.observe([DEVICE_ID]);

    // act
    const confirmedAbsent = tracker.observe([]);

    // assert
    assert.deepStrictEqual(confirmedAbsent, []);
  });
});
