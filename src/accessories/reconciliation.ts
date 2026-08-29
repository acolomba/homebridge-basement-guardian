/**
 * @fileoverview DEV-05: the two-consecutive-trustworthy-absence removal
 * state machine.
 *
 * `observe` takes a caller-verified-trustworthy inventory response -- the
 * full deviceId set one poll reported, after the caller has already
 * confirmed the response was HTTP 200 and schema-valid (D-02: a valid
 * empty list is a trustworthy response too). This module makes no such
 * judgment itself: its sole input is a deviceId list, so a failed,
 * non-2xx, or schema-invalid response can never reach it and can never
 * advance or reset a count (D-029).
 *
 * Tracking is by `deviceId` alone (D-003), so this module composes with
 * any current or future device family without change.
 */

import type { Clock } from '../runtime/clock.js';
import type { Logging } from 'homebridge';

/** How many consecutive trustworthy responses must omit a deviceId before it counts as confirmed absent (D-029). */
const CONFIRMATION_THRESHOLD = 2;

/** Tracks per-deviceId consecutive-absence counts across trustworthy inventory responses. */
export interface Reconciliation {
  /**
   * Records one trustworthy inventory response and reports every deviceId
   * newly confirmed absent by it.
   *
   * A deviceId present in `deviceIds` resets its count to zero. A deviceId
   * this module has never seen present is not yet a removal candidate and
   * is never reported. A deviceId this module has seen present, then
   * omitted `CONFIRMATION_THRESHOLD` times in a row, is reported here and
   * on every later call while it stays absent, so a caller whose
   * out-of-band final check fails once can retry on the next successful
   * poll without extra state.
   */
  observe(deviceIds: readonly string[]): readonly string[];
  /** Stops tracking `deviceId`, as if this module had never seen it. */
  forget(deviceId: string): void;
}

/** Everything the reconciliation state machine needs, by injection. */
export interface ReconciliationOptions {
  clock: Clock;
  log: Logging;
}

// A deviceId omitted from a trustworthy response advances its count by one;
// D-029 requires two omissions in a row, not one, before a deviceId counts
// as confirmed absent.
function nextAbsenceCount(previousCount: number): number {
  return previousCount + 1;
}

// Confirmed absent once a deviceId has been omitted from
// CONFIRMATION_THRESHOLD consecutive trustworthy responses, and on every
// call after that while it stays absent.
function isConfirmedAbsent(count: number): boolean {
  return count >= CONFIRMATION_THRESHOLD;
}

/**
 * Creates the reconciliation state machine.
 *
 * Creating it touches nothing outside itself: no HTTP call, no timer, no
 * accessory. The caller decides trustworthiness; `observe` trusts every
 * call it receives.
 */
export function createReconciliation(options: ReconciliationOptions): Reconciliation {
  const absenceCounts = new Map<string, number>();

  return {
    observe(deviceIds: readonly string[]): readonly string[] {
      const present = new Set(deviceIds);
      const confirmedAbsent: string[] = [];

      for (const deviceId of present) {
        absenceCounts.set(deviceId, 0);
      }

      for (const [deviceId, count] of absenceCounts) {
        if (present.has(deviceId)) {
          continue;
        }

        const absenceCount = nextAbsenceCount(count);
        absenceCounts.set(deviceId, absenceCount);

        if (isConfirmedAbsent(absenceCount)) {
          confirmedAbsent.push(deviceId);
          options.log.debug(`Device ${deviceId} confirmed absent from two consecutive trustworthy inventory responses.`);
        }
      }

      return confirmedAbsent;
    },

    forget(deviceId: string): void {
      absenceCounts.delete(deviceId);
    },
  };
}
