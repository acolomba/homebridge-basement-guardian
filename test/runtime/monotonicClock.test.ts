import assert from 'node:assert/strict';
import { test } from 'node:test';

import { systemMonotonicClock } from '../../src/runtime/monotonicClock.js';

import type { MonotonicClock } from '../../src/runtime/monotonicClock.js';

// Every module measuring a duration takes a MonotonicClock by injection, so a
// movable stub of this shape stands in for the process counter throughout the
// suite.
void ({ now: () => 0 } satisfies MonotonicClock);

// The wall-clock reading the mocked Date answers, chosen so a reading taken
// from the wrong base is unmistakable rather than plausible.
const MOCKED_WALL_TIME_MS = 1_700_000_000_000;

test('reports whole milliseconds, so a duration is never a rounded float', () => {
  // act
  const reading = systemMonotonicClock.now();

  // assert
  assert.strictEqual(Number.isInteger(reading), true);
});

test('reads a base of its own rather than the wall clock, which is the whole reason the port exists', (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['Date'], now: MOCKED_WALL_TIME_MS });

  // act
  const reading = systemMonotonicClock.now();

  // assert
  assert.notStrictEqual(reading, MOCKED_WALL_TIME_MS);
});

test('never reports a smaller reading than one taken before it', () => {
  // arrange
  const earlier = systemMonotonicClock.now();

  // act
  const later = systemMonotonicClock.now();

  // assert
  assert.strictEqual(later >= earlier, true);
});
