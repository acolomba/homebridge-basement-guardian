import assert from 'node:assert/strict';
import { test } from 'node:test';

import { systemClock } from '../../src/runtime/clock.js';

import type { Clock } from '../../src/runtime/clock.js';

// Every module that needs the time takes a Clock by injection, so a fixed stub
// of this shape stands in for the process clock throughout the suite.
void ({ now: () => 1_700_000_000_000 } satisfies Clock);

test('reports the current process time in milliseconds', (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['Date'], now: 1_700_000_000_000 });

  // act & assert
  assert.strictEqual(systemClock.now(), 1_700_000_000_000);
});

test('reports a time that advances with the process clock', (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['Date'], now: 1_700_000_000_000 });
  const startedAt = systemClock.now();

  // act
  t.mock.timers.tick(1_500);

  // assert
  assert.strictEqual(systemClock.now() - startedAt, 1_500);
});
