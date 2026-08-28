/**
 * Source of the current time.
 *
 * Scheduling, timeout, and receipt-time code takes a clock by injection rather
 * than reading `Date.now()`, so a test drives time without faking a global.
 */
export interface Clock {
  /** Returns the current time in milliseconds since the Unix epoch. */
  now(): number;
}

/** The process clock. Wire this at the composition root only. */
export const systemClock: Clock = {
  now: () => Date.now(),
};
