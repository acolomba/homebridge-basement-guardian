/**
 * @fileoverview The controllable timers a scenario drives deferred work with.
 *
 * The plugin takes deferred execution as an injected port so a scenario can hold the clock rather
 * than wait on one. The harness stands in for the composition root, so this is where that port is
 * satisfied with something a step can drive: a `setTimeout` here records a deadline instead of
 * arming a process timer, and nothing runs until the scenario clock passes it.
 *
 * Two properties of this stand-in are what make the assertions built on it mean something:
 *
 * - The current time comes from the injected clock, never from `Date.now`. The scenario clock is
 *   then the single source, so a scenario that advances past a deadline observes exactly the work
 *   that deadline was armed for, with no wall-clock sleep and no race against a real timer.
 * - Due handlers run in deadline order, and each is removed before it is invoked. A handler that
 *   arms another timer therefore does not also fire it in the same pass, which keeps one advance of
 *   the clock to one round of consequences.
 *
 * `setInterval` and `clearInterval` exist because the port declares them. Nothing the harness wires
 * this into schedules a repeating timer today; the implementation re-arms rather than pretending
 * otherwise, so a future consumer gets repeating behaviour instead of one silent run.
 */

import type { Timers } from '../../src/runtime/timers.js';

/** Reads the current time the deadlines are measured against. */
export interface ScenarioClock {
  now(): number;
}

/** The controllable timers, with the one control a scenario needs. */
export interface FakeTimers extends Timers {
  /** Runs every handler whose deadline is at or before the clock's current reading, in deadline order. */
  runDue(): void;
}

// One armed timer: when it is due, whether it repeats, and what it runs.
interface Armed {
  at: number;
  intervalMs: number | undefined;
  run: () => void;
}

/** Creates timers whose deadlines are measured against, and fired from, the supplied clock. */
export function createFakeTimers(clock: ScenarioClock): FakeTimers {
  const armed = new Map<number, Armed>();
  let nextHandle = 0;

  function arm(run: () => void, delayMs: number, intervalMs: number | undefined): number {
    const handle = nextHandle;
    nextHandle += 1;
    armed.set(handle, { at: clock.now() + delayMs, intervalMs, run });

    return handle;
  }

  // Only a handle this object itself answered is ever armed, and a value that never named a timer
  // simply matches nothing, so an unknown handle needs no runtime check of its own.
  function disarm(handle: unknown): void {
    armed.delete(handle as number);
  }

  return {
    setTimeout: (run: () => void, delayMs: number) => arm(run, delayMs, undefined),
    setInterval: (run: () => void, delayMs: number) => arm(run, delayMs, delayMs),
    clearTimeout: disarm,
    clearInterval: disarm,

    runDue(): void {
      const now = clock.now();
      const due = [...armed.entries()].filter(([, entry]) => entry.at <= now).sort(([, left], [, right]) => left.at - right.at);

      for (const [handle, entry] of due) {
        armed.delete(handle);

        if (entry.intervalMs !== undefined) {
          armed.set(handle, { ...entry, at: now + entry.intervalMs });
        }

        entry.run();
      }
    },
  };
}
