// The default import is deliberate: the named ESM export of a builtin is a
// snapshot binding, which the test runner's timer mocks cannot replace, so the
// wait would be untestable without awaiting a real timer.
import timers from 'node:timers/promises';

import type { Logging } from 'homebridge';

/** The ceiling a reconnect wait is capped at, in milliseconds. */
export const MAX_BACKOFF_MS = 30_000;

const FIRST_DELAY_BASE_MS = 1_000;

/** The shutdown signal, the backoff ceiling, and where a failure is noted. */
export interface RetryPolicyOptions {
  signal: AbortSignal;
  maxDelayMs: number;
  log: Logging;
}

/** Capped backoff with a re-entrancy guard and an abortable wait. */
export interface RetryPolicy {
  readonly attempt: number;
  readonly pending: boolean;
  nextDelayMs(): number;
  schedule(run: () => Promise<void>): void;
  reset(): void;
}

/**
 * Creates the reconnect timing policy for one long-lived connection.
 *
 * The consumer owns reconnect timing rather than the transport client, whose
 * own reconnect period is uncapped. A single transport failure raises both an
 * error and a close notification, so a pending guard keeps the two from
 * starting two retry chains (SYNC-04). Every wait ends on the shared root
 * signal, which leaves no timer holding the process open at shutdown (SYNC-05).
 */
export function createRetryPolicy(options: RetryPolicyOptions): RetryPolicy {
  let attempt = 0;
  let pending = false;

  function nextDelayMs(): number {
    attempt += 1;

    return Math.min(options.maxDelayMs, FIRST_DELAY_BASE_MS * 2 ** (attempt - 2));
  }

  // The work is the caller's, so its rejection is reported and swallowed here
  // rather than escaping into an unhandled rejection.
  async function runGuarded(run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch {
      options.log.debug('A scheduled retry attempt failed.');
    }
  }

  async function waitThenRun(run: () => Promise<void>): Promise<void> {
    try {
      await timers.setTimeout(nextDelayMs(), undefined, { signal: options.signal });
      await runGuarded(run);
    } catch {
      // `runGuarded` never rejects, so only the wait can arrive here, and only
      // when a shutdown aborted it. The work is skipped and nothing is raised.
    } finally {
      pending = false;
    }
  }

  return {
    get attempt(): number {
      return attempt;
    },
    get pending(): boolean {
      return pending;
    },
    nextDelayMs,
    reset: (): void => {
      attempt = 0;
    },
    schedule: (run: () => Promise<void>): void => {
      if (pending) {
        return;
      }

      pending = true;
      void waitThenRun(run);
    },
  };
}
