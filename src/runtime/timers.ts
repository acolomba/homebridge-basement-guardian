/**
 * Source of deferred execution.
 *
 * Scheduling code takes the timers by injection rather than reaching for the
 * process globals, so a module that must never defer can be proven not to: a
 * test hands it a stand-in that records every call and asserts the count is
 * zero. That is evidence about an absence, which watching behaviour alone
 * cannot give, because a delay shorter than whatever a harness advances would
 * survive a purely behavioural test (SAFE-07, D-18).
 *
 * A handle is `unknown` so no consumer can depend on the concrete handle type,
 * which is what lets a stand-in be a plain object rather than something obliged
 * to produce a live process timer.
 */
export interface Timers {
  /** Schedules `handler` to run once, after `delayMs`, and answers its handle. */
  setTimeout(handler: () => void, delayMs: number): unknown;
  /** Schedules `handler` to run every `delayMs`, and answers its handle. */
  setInterval(handler: () => void, delayMs: number): unknown;
  /** Cancels a handle `setTimeout` answered, before its handler runs. */
  clearTimeout(handle: unknown): void;
  /** Cancels a handle `setInterval` answered, before its next run. */
  clearInterval(handle: unknown): void;
}

/** The process timers. Wire this at the composition root only. */
export const systemTimers: Timers = {
  setTimeout: () => undefined,
  setInterval: () => undefined,
  clearTimeout: () => undefined,
  clearInterval: () => undefined,
};
