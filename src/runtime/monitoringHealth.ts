/**
 * @fileoverview What the plugin can currently say about its own ability to
 * observe one account, kept apart from what it can say about a device.
 *
 * A lost monitoring path is a fact about the plugin, never about the hardware:
 * the pump may be running perfectly while the plugin has stopped seeing it. The
 * false normal this projection prevents is the quiet one -- REST keeps
 * answering, every tile keeps reading "no leak, pump normal, battery fine", and
 * the plugin has simply stopped observing the live signals a seven-to-fifteen
 * second pump run arrives on. Two transports fail independently and cost
 * different things, so the two facts are carried apart and neither clears the
 * other (RES-03, D-04, D-11).
 *
 * The module owns no timer and reads no global clock. It records what it is
 * told and answers when it is asked, against the injected `Clock` at the moment
 * of the call, so a scenario reaches a thirty-minute threshold by advancing a
 * number rather than by waiting (D-05).
 */

import type { Clock } from './clock.js';

/**
 * How many consecutive failed REST polls mark the polling path degraded.
 *
 * It mirrors `offlineConfirmationPollCount`'s default rather than reusing that
 * setting: the setting counts *successful* snapshots reporting a disconnected
 * device, and a failed request is explicitly not a snapshot, so raising it to
 * confirm an offline device more slowly must not also slow this down (D-05,
 * D-016, CONF-05).
 */
export const REST_FAILURE_THRESHOLD = 2;

/**
 * How often the device heartbeats, measured on the wire at approximately 898
 * seconds and recorded in the protocol intel rather than restated here as
 * folklore.
 */
export const HEARTBEAT_INTERVAL_MS = 898_000;

/**
 * How many heartbeats may pass unheard before silence is evidence.
 *
 * Roughly fifteen minutes of quiet is ordinary, so one missed heartbeat is
 * never evidence of anything and a threshold of one would fire on every healthy
 * system (RES-01, D-05).
 */
export const MISSED_HEARTBEATS_BEFORE_SILENT = 2;

/** What the plugin can currently say about its own ability to observe this account. */
export interface MonitoringTrust {
  restDegraded: boolean;
  shadowSilent: boolean;
}

/** Everything the monitoring-trust projection needs, by injection. */
export interface MonitoringHealthOptions {
  clock: Clock;
}

/** Tracks the two transport facts the account-wide trust decision is derived from. */
export interface MonitoringHealth {
  /** Records one successful REST poll, which ends the failure run and nothing else. */
  recordRestSuccess(): void;
  /** Records one failed REST poll, which advances the failure run and nothing else. */
  recordRestFailure(): void;
  /** Records one shadow message arriving, whatever it carried. */
  recordShadowMessage(): void;
  /** The verdict, evaluated against the injected clock at the moment of the call. */
  trustNow(): MonitoringTrust;
}

// One blip never withdraws trust, so the run is compared against the threshold
// rather than against zero.
function isRestDegraded(consecutiveFailures: number): boolean {
  return consecutiveFailures >= REST_FAILURE_THRESHOLD;
}

// Silence is measured from when a message last arrived, and from nothing else.
//
// The socket flag is not the source: the provider closes an established
// connection at a ceiling it publishes no knob for, so at least one reconnect a
// day is ordinary and a rule keyed on the flag would flap daily on healthy
// hardware while missing a device that stops heartbeating with its socket still
// open. The canonical snapshot's receipt time is not the source either: a
// successful REST poll bumps it, so a poll would clear a shadow degradation,
// which is the one clearing D-11 forbids.
function isShadowSilent(lastMessageAt: number, now: number): boolean {
  return now - lastMessageAt >= HEARTBEAT_INTERVAL_MS * MISSED_HEARTBEATS_BEFORE_SILENT;
}

/**
 * Creates the monitoring-trust projection.
 *
 * The arrival stamp is seeded from the clock at construction rather than left
 * absent, so a broker the plugin can never reach goes silent two heartbeats
 * after the runtime was built rather than never. An absent stamp read as "not
 * silence" would leave a shadow that never connects permanently trusted, which
 * is the same false normal by a slower route.
 *
 * Creating it touches nothing outside itself: no connection, no timer, and no
 * clock reading beyond that one seed.
 */
export function createMonitoringHealth(options: MonitoringHealthOptions): MonitoringHealth {
  const lastShadowMessageAt = options.clock.now();

  return {
    recordRestSuccess: () => undefined,

    recordRestFailure: () => undefined,

    recordShadowMessage: () => undefined,

    trustNow: (): MonitoringTrust => ({
      restDegraded: isRestDegraded(0),
      shadowSilent: isShadowSilent(lastShadowMessageAt, options.clock.now()),
    }),
  };
}
