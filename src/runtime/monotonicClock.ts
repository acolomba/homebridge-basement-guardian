/**
 * Source of forward-only elapsed time.
 *
 * It is a second port rather than a second method on `Clock` because a call
 * site reading `now()` cannot tell which base it was handed, and the two bases
 * are not interchangeable. Every existing consumer of `Clock` genuinely wants
 * wall time -- the SigV4 request date, the token expiry measured against a
 * vendor-issued instant, the persisted receipt time, the credential rotation
 * delay, and the reminder cadence -- while a duration must not move when the
 * wall clock is corrected. One interface carrying two incompatible bases would
 * leave that difference invisible at every call site (D-06).
 */
export interface MonotonicClock {
  /**
   * Returns the milliseconds elapsed since an arbitrary fixed point.
   *
   * The epoch is arbitrary and is never comparable to a wall-clock instant.
   * Only the difference between two readings carries meaning.
   */
  now(): number;
}

/**
 * Nanoseconds in a millisecond. The source counts nanoseconds and every
 * duration in this plugin is stated in milliseconds, and the division is done
 * on the `bigint` so the result is an exact integer rather than a rounded
 * float.
 */
const NANOSECONDS_PER_MILLISECOND = 1_000_000n;

/**
 * The process monotonic counter. Wire this at the composition root only.
 *
 * `process.hrtime.bigint()` is documented as "not subject to clock drift", and
 * a Linux time-namespace probe run during this phase's research offset
 * `CLOCK_MONOTONIC` and `CLOCK_BOOTTIME` independently and showed this source
 * following the first and not the second.
 *
 * The limit that follows from that: `CLOCK_MONOTONIC` does not advance across a
 * system suspend, so a host that sleeps for two hours resumes with this counter
 * two hours short. That consequence is cited from `man 2 clock_gettime` and was
 * not observed -- the host the probe ran on had no accumulated suspend time, so
 * there was nothing to watch. It is why a wall-clock term sits beside this one
 * in the silence measurement rather than this one being trusted alone.
 */
export const systemMonotonicClock: MonotonicClock = {
  now: () => Number(process.hrtime.bigint() / NANOSECONDS_PER_MILLISECOND),
};
