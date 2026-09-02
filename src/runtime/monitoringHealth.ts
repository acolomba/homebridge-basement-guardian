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

/**
 * What the two transport facts this module tracks can support on their own.
 *
 * This is the whole of what the projection answers, and deliberately less than
 * what the runtime pushes. Both members are derived from something this module
 * was told: a run of failed polls it counted, and a message arrival it stamped.
 */
export interface TransportTrust {
  restDegraded: boolean;
  shadowSilent: boolean;
}

/**
 * What the plugin can currently say about its own ability to observe -- and to
 * reach -- this account.
 *
 * `commandTransportReady` is assembled by the runtime rather than answered
 * here, because it depends on facts this module has no sight of: whether the
 * runtime is stopped, and whether authentication has halted for good. Moving it
 * into `TransportTrust` would mean teaching a transport-fact recorder about the
 * authentication lifecycle, and the answer it gave would be a guess (D-07).
 */
export interface MonitoringTrust extends TransportTrust {
  commandTransportReady: boolean;
  /**
   * Whether the vendor has refused the account credentials.
   *
   * This is the one condition the plugin can be in that never clears itself,
   * and the only one the user must act on. The vendor lifts a brute-force block
   * only thirty days after the last attempt, so an automatic retry does not
   * merely fail -- it extends the lockout the user is trying to escape, and
   * nothing in the plugin retries after it (D-13, D-10). Every other member of
   * this type describes a degradation that recovers on its own once the
   * transport does.
   *
   * Like `commandTransportReady` it is assembled by the runtime rather than
   * answered here: it is the authentication lifecycle, which a recorder of
   * transport facts has no sight of (D-07).
   */
  credentialsRejected: boolean;
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
  /**
   * Records one shadow message arriving for one device, whatever it carried.
   *
   * The device is named because silence is a fact about a controller rather
   * than about an account: one pump's heartbeat answering for another pump's
   * silence is what leaves a permanently quiet controller fully vouched for on
   * a multi-pump account (D-05, D-13).
   */
  recordShadowMessage(deviceId: string): void;
  /**
   * Starts a device's silence window, so a device the plugin has never heard
   * from is judged from when it was first admitted.
   *
   * A device already tracked is left exactly as it was. Re-stamping one on
   * every poll would reset the window of a pump that has been quiet for hours,
   * which is the same false normal on a slower clock.
   */
  admitDevice(deviceId: string): void;
  /** Drops a removed device's stamp, so the tracked set cannot grow for the life of the process. */
  forgetDevice(deviceId: string): void;
  /**
   * Every admitted device whose live path has been silent for two heartbeats,
   * in admission order so a caller and a test read the same list.
   */
  silentDevices(): readonly string[];
  /** The verdict, evaluated against the injected clock at the moment of the call. */
  trustNow(): TransportTrust;
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
 * An arrival stamp is seeded when discovery admits a device rather than when
 * the runtime is built, and the false normal the construction seed guarded is
 * still guarded by that later clock: a broker the plugin can never reach makes
 * every admitted device silent two heartbeats after the poll that found it, so
 * a shadow that never connects is never permanently trusted.
 *
 * Admission is the right zero and construction is not. A pump added to the
 * account an hour into the run would inherit an hour of silence it never had,
 * and the first poll after it appeared would take telemetry back from a shadow
 * that had legitimately just delivered it (D-05).
 *
 * Creating it touches nothing outside itself: no connection, no timer, and no
 * clock reading at all until something is recorded or asked.
 */
export function createMonitoringHealth(options: MonitoringHealthOptions): MonitoringHealth {
  let consecutiveRestFailures = 0;
  // One stamp per admitted device, because the question "has this controller
  // stopped speaking" has one answer per controller. A single account stamp is
  // re-armed by whichever pump spoke last, which vouches for the ones that did
  // not (D-05, D-13).
  const lastShadowMessageAt = new Map<string, number>();

  function silentDevices(): readonly string[] {
    const now = options.clock.now();

    return [...lastShadowMessageAt].filter(([, lastMessageAt]) => isShadowSilent(lastMessageAt, now)).map(([deviceId]) => deviceId);
  }

  return {
    recordRestSuccess(): void {
      consecutiveRestFailures = 0;
    },

    recordRestFailure(): void {
      consecutiveRestFailures += 1;
    },

    recordShadowMessage(deviceId: string): void {
      lastShadowMessageAt.set(deviceId, options.clock.now());
    },

    admitDevice(deviceId: string): void {
      if (!lastShadowMessageAt.has(deviceId)) {
        lastShadowMessageAt.set(deviceId, options.clock.now());
      }
    },

    forgetDevice(deviceId: string): void {
      lastShadowMessageAt.delete(deviceId);
    },

    silentDevices,

    // Any device the plugin has stopped hearing costs the account its claim to
    // be watching, because the marking every accessory hears is one answer.
    // Which device it was is the failure log's line, not this one (D-02, D-03).
    trustNow(): TransportTrust {
      return {
        restDegraded: isRestDegraded(consecutiveRestFailures),
        shadowSilent: silentDevices().length > 0,
      };
    },
  };
}
