// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests retry delays, pending work, reset and shutdown cancellation.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate as nextEventLoopTurn } from 'node:timers/promises';

import { mock, verify, when } from 'strong-mock';

import { createRetryPolicy } from '../../src/runtime/retryPolicy.js';

import type { RetryPolicy, RetryPolicyOptions } from '../../src/runtime/retryPolicy.js';
import type { LogLevel, Logging } from 'homebridge';

// Logging is a callable interface with seven members, so the stub is a function
// that carries them rather than an object literal.
function recordingLog(recorded: string[]): Logging {
  const write = (message: string): void => {
    recorded.push(message);
  };

  return Object.assign(write, {
    prefix: 'retry policy',
    debug: write,
    error: write,
    info: write,
    success: write,
    warn: write,
    log: (level: LogLevel, message: string): void => {
      recorded.push(`${level} ${message}`);
    },
  });
}

function policyOptions(signal: AbortSignal, recorded: string[] = []): RetryPolicyOptions {
  return { signal, maxDelayMs: 30_000, log: recordingLog(recorded) };
}

// The fake timers cover setTimeout only, so this real event-loop turn drains
// every microtask the scheduled work queued behind the wait.
async function settled(): Promise<void> {
  await nextEventLoopTurn();
}

// The retried work, plus a reader for how often the policy actually ran it.
function countedWork(): { run: () => Promise<void>; runs: () => number } {
  let runs = 0;

  return {
    run: () => {
      runs += 1;

      return Promise.resolve();
    },
    runs: () => runs,
  };
}

function delayAtAttempt(policy: RetryPolicy, attempt: number): number {
  let delayMs = policy.nextDelayMs();

  for (let taken = 1; taken < attempt; taken += 1) {
    delayMs = policy.nextDelayMs();
  }

  return delayMs;
}

for (const { attempt, delayMs } of [
  { attempt: 1, delayMs: 500 },
  { attempt: 2, delayMs: 1_000 },
  { attempt: 3, delayMs: 2_000 },
  { attempt: 4, delayMs: 4_000 },
  { attempt: 5, delayMs: 8_000 },
  { attempt: 6, delayMs: 16_000 },
  { attempt: 7, delayMs: 30_000 },
  { attempt: 8, delayMs: 30_000 },
  { attempt: 20, delayMs: 30_000 },
]) {
  test(`returns ${String(delayMs)} ms for delay number ${String(attempt)}`, () => {
    // arrange
    const policy = createRetryPolicy(policyOptions(new AbortController().signal));

    // act
    const taken = delayAtAttempt(policy, attempt);

    // assert
    assert.deepStrictEqual({ taken, attempt: policy.attempt }, { taken: delayMs, attempt });
  });
}

for (const { earlierDelays, delayMs, attempt } of [
  { earlierDelays: [], delayMs: 500, attempt: 1 },
  { earlierDelays: [500], delayMs: 1_000, attempt: 2 },
  { earlierDelays: [500, 1_000], delayMs: 2_000, attempt: 3 },
  { earlierDelays: [500, 1_000, 2_000], delayMs: 4_000, attempt: 4 },
  { earlierDelays: [500, 1_000, 2_000, 4_000], delayMs: 8_000, attempt: 5 },
  { earlierDelays: [500, 1_000, 2_000, 4_000, 8_000], delayMs: 16_000, attempt: 6 },
  { earlierDelays: [500, 1_000, 2_000, 4_000, 8_000, 16_000], delayMs: 30_000, attempt: 7 },
  { earlierDelays: [500, 1_000, 2_000, 4_000, 8_000, 16_000, 30_000], delayMs: 30_000, attempt: 8 },
]) {
  test(`completes scheduled attempt ${String(attempt)} only at its ${String(delayMs)} ms deadline`, async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const policy = createRetryPolicy(policyOptions(new AbortController().signal));
    const work = mock<() => Promise<void>>({ exactParams: true, name: 'retry work' });
    when(() => work())
      .thenResolve(undefined)
      .times(attempt);
    let completions = 0;
    async function run(): Promise<void> {
      await work();
      completions += 1;
    }

    for (const earlierDelay of earlierDelays) {
      policy.schedule(run);
      t.mock.timers.tick(earlierDelay);
      await settled();
    }

    // act
    policy.schedule(run);
    const scheduled = { completions, attempt: policy.attempt, pending: policy.pending };
    t.mock.timers.tick(delayMs - 1);
    await settled();
    const beforeDeadline = { completions, attempt: policy.attempt, pending: policy.pending };
    t.mock.timers.tick(1);
    await settled();
    const atDeadline = { completions, attempt: policy.attempt, pending: policy.pending };

    // assert
    assert.deepStrictEqual(
      { scheduled, beforeDeadline, atDeadline },
      {
        scheduled: { completions: attempt - 1, attempt, pending: true },
        beforeDeadline: { completions: attempt - 1, attempt, pending: true },
        atDeadline: { completions: attempt, attempt, pending: false },
      },
    );
    verify(work);
  });
}

test('schedules the first 500 ms delay again after an explicit reset', async (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const policy = createRetryPolicy(policyOptions(new AbortController().signal));
  const work = mock<() => Promise<void>>({ exactParams: true, name: 'retry work' });
  when(() => work())
    .thenResolve(undefined)
    .times(3);
  let completions = 0;
  async function run(): Promise<void> {
    await work();
    completions += 1;
  }

  policy.schedule(run);
  t.mock.timers.tick(500);
  await settled();
  policy.schedule(run);
  t.mock.timers.tick(1_000);
  await settled();

  // act
  policy.reset();
  const afterReset = { completions, attempt: policy.attempt, pending: policy.pending };
  policy.schedule(run);
  const scheduled = { completions, attempt: policy.attempt, pending: policy.pending };
  t.mock.timers.tick(499);
  await settled();
  const beforeDeadline = { completions, attempt: policy.attempt, pending: policy.pending };
  t.mock.timers.tick(1);
  await settled();
  const atDeadline = { completions, attempt: policy.attempt, pending: policy.pending };

  // assert
  assert.deepStrictEqual(
    { afterReset, scheduled, beforeDeadline, atDeadline },
    {
      afterReset: { completions: 2, attempt: 0, pending: false },
      scheduled: { completions: 2, attempt: 1, pending: true },
      beforeDeadline: { completions: 2, attempt: 1, pending: true },
      atDeadline: { completions: 3, attempt: 1, pending: false },
    },
  );
  verify(work);
});

for (const { outcome, settle } of [
  {
    outcome: 'resolution',
    settle: (): Promise<void> => Promise.resolve(),
  },
  {
    outcome: 'rejection',
    settle: (): Promise<void> => Promise.reject(new Error('connection refused')),
  },
]) {
  test(`refuses duplicate schedules until callback ${outcome} and then accepts new work`, async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const policy = createRetryPolicy(policyOptions(new AbortController().signal));
    let finishWork: () => void = assert.fail;
    const completion = new Promise<void>((resolve) => {
      finishWork = resolve;
    }).then(() => settle());
    const work = mock<() => Promise<void>>({ exactParams: true, name: 'retry work' });
    const duplicate = mock<() => Promise<void>>({ exactParams: true, name: 'duplicate retry work' });
    when(() => work()).thenReturn(completion);
    when(() => work()).thenResolve(undefined);
    let starts = 0;
    let completions = 0;
    async function run(): Promise<void> {
      starts += 1;
      try {
        await work();
      } finally {
        completions += 1;
      }
    }

    // act
    policy.schedule(run);
    policy.schedule(duplicate);
    const waiting = { starts, completions, attempt: policy.attempt, pending: policy.pending };
    t.mock.timers.tick(499);
    await settled();
    const beforeDeadline = { starts, completions, attempt: policy.attempt, pending: policy.pending };
    t.mock.timers.tick(1);
    await settled();
    const running = { starts, completions, attempt: policy.attempt, pending: policy.pending };
    policy.schedule(duplicate);
    t.mock.timers.tick(30_000);
    await settled();
    const stillRunning = { starts, completions, attempt: policy.attempt, pending: policy.pending };
    finishWork();
    await settled();
    const afterCompletion = { starts, completions, attempt: policy.attempt, pending: policy.pending };
    policy.schedule(run);
    t.mock.timers.tick(999);
    await settled();
    const beforeNextDeadline = { starts, completions, attempt: policy.attempt, pending: policy.pending };
    t.mock.timers.tick(1);
    await settled();
    const afterNextCompletion = { starts, completions, attempt: policy.attempt, pending: policy.pending };

    // assert
    assert.deepStrictEqual(
      { waiting, beforeDeadline, running, stillRunning, afterCompletion, beforeNextDeadline, afterNextCompletion },
      {
        waiting: { starts: 0, completions: 0, attempt: 1, pending: true },
        beforeDeadline: { starts: 0, completions: 0, attempt: 1, pending: true },
        running: { starts: 1, completions: 0, attempt: 1, pending: true },
        stillRunning: { starts: 1, completions: 0, attempt: 1, pending: true },
        afterCompletion: { starts: 1, completions: 1, attempt: 1, pending: false },
        beforeNextDeadline: { starts: 1, completions: 1, attempt: 2, pending: true },
        afterNextCompletion: { starts: 2, completions: 2, attempt: 2, pending: false },
      },
    );
    verify(work);
    verify(duplicate);
  });
}

test('restores the first delay after a successful attempt resets it', () => {
  // arrange
  const policy = createRetryPolicy(policyOptions(new AbortController().signal));
  delayAtAttempt(policy, 5);

  // act
  policy.reset();

  // assert
  assert.deepStrictEqual({ delayMs: policy.nextDelayMs(), attempt: policy.attempt }, { delayMs: 500, attempt: 1 });
});

test('runs the work once when an error and a close notification both ask for a retry', async (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const policy = createRetryPolicy(policyOptions(new AbortController().signal));
  const work = countedWork();

  // act
  policy.schedule(work.run);
  policy.schedule(work.run);
  t.mock.timers.tick(500);
  await settled();

  // assert
  assert.deepStrictEqual({ runs: work.runs(), pending: policy.pending }, { runs: 1, pending: false });
});

test('reports a pending retry between scheduling the work and completing it', async (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const policy = createRetryPolicy(policyOptions(new AbortController().signal));

  // act
  policy.schedule(() => Promise.resolve());
  const whileWaiting = policy.pending;
  t.mock.timers.tick(500);
  await settled();

  // assert
  assert.deepStrictEqual({ whileWaiting, afterCompletion: policy.pending }, { whileWaiting: true, afterCompletion: false });
});

test('runs the work again for a failure that arrives after the previous retry finished', async (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const policy = createRetryPolicy(policyOptions(new AbortController().signal));
  const work = countedWork();

  // act
  policy.schedule(work.run);
  t.mock.timers.tick(500);
  await settled();
  policy.schedule(work.run);
  t.mock.timers.tick(1_000);
  await settled();

  // assert
  assert.deepStrictEqual({ runs: work.runs(), pending: policy.pending }, { runs: 2, pending: false });
});

test('leaves the work uninvoked when a shutdown aborts a pending wait', async (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const controller = new AbortController();
  const recorded: string[] = [];
  const policy = createRetryPolicy(policyOptions(controller.signal, recorded));
  const work = countedWork();

  // act
  policy.schedule(work.run);
  controller.abort();
  await settled();

  // assert
  assert.deepStrictEqual({ runs: work.runs(), pending: policy.pending, recorded }, { runs: 0, pending: false, recorded: [] });
});

test('keeps a rejection from the work inside the policy', async (t) => {
  // arrange
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const recorded: string[] = [];
  const policy = createRetryPolicy(policyOptions(new AbortController().signal, recorded));

  // act
  policy.schedule(() => Promise.reject(new Error('the transport refused the connection')));
  t.mock.timers.tick(500);
  await settled();

  // assert
  assert.deepStrictEqual({ pending: policy.pending, recorded }, { pending: false, recorded: ['A scheduled retry attempt failed.'] });
});
