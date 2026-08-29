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
  void options;

  throw new Error('not implemented');
}
