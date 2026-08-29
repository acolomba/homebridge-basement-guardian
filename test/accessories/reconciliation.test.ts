import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createReconciliation } from '../../src/accessories/reconciliation.js';

import type { Reconciliation, ReconciliationOptions } from '../../src/accessories/reconciliation.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { Logging } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const OTHER_DEVICE_ID = 'account-1_serial-2';
const NOW = 1_700_000_000_000;

// Logging is a callable interface with seven members, so the stub is a
// no-op function that carries them rather than an object literal.
function createSilentLog(): Logging {
  const noop = (): void => {
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
  const clock: Clock = { now: () => NOW };

  return { clock, log: createSilentLog() };
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
