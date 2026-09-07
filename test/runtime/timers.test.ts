import assert from 'node:assert/strict';
import { test } from 'node:test';

import { systemTimers } from '../../src/runtime/timers.js';

import type { Timers } from '../../src/runtime/timers.js';

// A module that must never defer takes a Timers by injection, so a hand-built stand-in that records
// calls and schedules nothing stands where the process timers would. This declaration is what such
// a spy checks itself against before another module's test asserts it recorded no call at all.
void ({
  setTimeout: () => undefined,
  setInterval: () => undefined,
  clearTimeout: () => undefined,
  clearInterval: () => undefined,
} satisfies Timers);

// @ts-expect-error a stand-in answers every member, so a module cannot defer through one it omits
void ({ setTimeout: () => undefined, clearTimeout: () => undefined } satisfies Timers);

test('runs a scheduled handler once its delay elapses', (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const runs: string[] = [];

  // act
  systemTimers.setTimeout(() => {
    runs.push('ran');
  }, 1_000);
  t.mock.timers.tick(1_000);

  // assert
  assert.deepStrictEqual(runs, ['ran']);
});

test('runs no scheduled handler before its delay elapses', (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const runs: string[] = [];

  // act
  systemTimers.setTimeout(() => {
    runs.push('ran');
  }, 1_000);
  t.mock.timers.tick(999);

  // assert
  assert.deepStrictEqual(runs, []);
});

test('cancels a scheduled handler before it runs', (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const runs: string[] = [];
  const handle = systemTimers.setTimeout(() => {
    runs.push('ran');
  }, 1_000);

  // act
  systemTimers.clearTimeout(handle);
  t.mock.timers.tick(1_000);

  // assert
  assert.deepStrictEqual(runs, []);
});

test('runs a repeating handler once per interval', (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setInterval'] });
  const runs: string[] = [];
  const handle = systemTimers.setInterval(() => {
    runs.push('ran');
  }, 1_000);

  // act
  t.mock.timers.tick(1_000);
  t.mock.timers.tick(1_000);
  systemTimers.clearInterval(handle);

  // assert
  assert.deepStrictEqual(runs, ['ran', 'ran']);
});

test('cancels a repeating handler before its first run', (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setInterval'] });
  const runs: string[] = [];
  const handle = systemTimers.setInterval(() => {
    runs.push('ran');
  }, 1_000);

  // act
  systemTimers.clearInterval(handle);
  t.mock.timers.tick(1_000);

  // assert
  assert.deepStrictEqual(runs, []);
});
