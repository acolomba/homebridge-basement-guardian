// This module is parked in the `.fallowrc.json` `ignoreFindings` list because
// `MAX_BACKOFF_MS` has no consumer yet. The entry and this note are removed
// together, in the commit that wires the shadow client into the account
// runtime and makes this module reachable from the plugin entry point.

import type { Logging } from 'homebridge';

/** The ceiling a reconnect wait is capped at, in milliseconds. */
export const MAX_BACKOFF_MS = 30_000;

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

/** Creates the reconnect timing policy for one long-lived connection. */
export function createRetryPolicy(options: RetryPolicyOptions): RetryPolicy {
  return {
    attempt: 0,
    pending: false,
    nextDelayMs: () => options.maxDelayMs,
    schedule: () => undefined,
    reset: () => undefined,
  };
}
