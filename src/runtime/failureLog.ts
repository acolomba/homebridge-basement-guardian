import type { Clock } from './clock.js';
import type { Logging } from 'homebridge';

/** How long a kind may keep failing before one more warning is emitted. */
export const FAILURE_REMINDER_MS = 900_000;

/** Everything the failure log needs, by injection. */
export interface FailureLogOptions {
  clock: Clock;
  log: Logging;
  /** The reminder cadence. Production supplies `FAILURE_REMINDER_MS`. */
  reminderIntervalMs: number;
}

/**
 * Rate-limited reporting for the transient failures of one long-lived runtime.
 *
 * A `kind` names one failing activity and reads as the subject of the recovery
 * sentence, so it is a capitalized noun phrase such as `Credential rotation`.
 * A `reason` is the complete line to log, which the caller keeps free of any
 * URL, response body, or credential material (AUTH-02).
 */
export interface FailureLog {
  recordFailure(kind: string, reason: string): void;
  recordSuccess(kind: string): void;
  /**
   * Drops a kind and says nothing.
   *
   * For an activity that has stopped existing rather than started working. A
   * device the account confirmed removed can never report again, so its kind
   * would sit in the rate limiter for the life of the process and hold back the
   * first warning about whatever identifier came back next. `recordSuccess` is
   * the wrong verb for that: it would tell an owner that a system which had just
   * left the account had recovered (D-14).
   */
  forget(kind: string): void;
}

/**
 * Creates the transient-failure reporting discipline.
 *
 * A thirty-second retry loop must not produce a hundred and twenty warnings an
 * hour, and a failure that reports nothing at all is equally wrong, so a
 * reminder cadence sits between the two: one warning, then debug, then one
 * warning again every reminder interval while the kind is still failing, and
 * one informational line when it recovers (D-14).
 *
 * The module owns no timer. It decides what to log when it is told something
 * happened, and its callers own the scheduling, so an hour of failures is a
 * matter of advancing the injected clock.
 */
export function createFailureLog(options: FailureLogOptions): FailureLog {
  // Each failing kind maps to the clock value of the warning it last produced.
  // A kind absent from the map is not currently failing, which is also what
  // makes the next failure of a recovered kind warn again.
  const warnedAt = new Map<string, number>();

  return {
    recordFailure(kind: string, reason: string): void {
      const now = options.clock.now();
      const lastWarnedAt = warnedAt.get(kind);

      if (lastWarnedAt === undefined || now - lastWarnedAt >= options.reminderIntervalMs) {
        warnedAt.set(kind, now);
        options.log.warn(reason);

        return;
      }

      options.log.debug(reason);
    },

    recordSuccess(kind: string): void {
      // Deleting reports whether the kind was failing, so the recovery line and
      // the state change cannot disagree.
      if (warnedAt.delete(kind)) {
        options.log.info(`${kind} recovered.`);
      }
    },

    forget(kind: string): void {
      warnedAt.delete(kind);
    },
  };
}
