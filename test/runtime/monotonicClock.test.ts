// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Checks the process monotonic-clock adapter.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { systemMonotonicClock } from '../../src/runtime/monotonicClock.js';

import type { MonotonicClock } from '../../src/runtime/monotonicClock.js';

// Every module measuring a duration takes a MonotonicClock by injection, so a
// movable stub of this shape stands in for the process counter throughout the
// suite.
void ({ now: () => 0 } satisfies MonotonicClock);

test('truncates nanoseconds to whole milliseconds and advances at the boundary', (t) => {
  // arrange
  let nanoseconds = 1_999_999n;
  t.mock.method(process.hrtime, 'bigint', () => nanoseconds);
  const earlier = systemMonotonicClock.now();

  // act
  nanoseconds = 2_000_000n;
  const later = systemMonotonicClock.now();

  // assert
  assert.deepStrictEqual({ earlier, later }, { earlier: 1, later: 2 });
});

test('keeps elapsed readings independent of wall-clock corrections', (t) => {
  // arrange
  t.mock.method(process.hrtime, 'bigint', () => 1_999_999n);
  t.mock.timers.enable({ apis: ['Date'], now: 1_700_000_000_000 });
  const earlier = systemMonotonicClock.now();

  // act
  t.mock.timers.setTime(1_699_000_000_000);
  const later = systemMonotonicClock.now();

  // assert
  assert.deepStrictEqual({ earlier, later }, { earlier: 1, later: 1 });
});
