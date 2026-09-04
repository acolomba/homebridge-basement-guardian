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
import type { MonotonicClock } from './monotonicClock.js';

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
 * What this module can say about one account as a whole.
 *
 * There is one member, and that is the point: polling is an account-wide
 * activity -- one loop, one credential, one endpoint -- so a run of failed
 * polls is a fact about the account and every pump on it. Silence is not. It is
 * a fact about one controller, this module has always tracked it per device,
 * and `silentDevices()` is where that answer is read. Collapsing it into a
 * second member here is what left a two-pump owner told the plugin could not
 * vouch for a pump that was reporting perfectly (D-03, D-04).
 */
export interface TransportTrust {
  restDegraded: boolean;
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
  /**
   * Whether the plugin has stopped hearing the live path of the one system this
   * trust is about.
   *
   * It sits here rather than on `TransportTrust` because it is answered per
   * device and this type is what the runtime resolves per device. This module
   * answers `silentDevices()`; the runtime turns that list into one struct per
   * system, and an accessory hears the answer for its own controller and for no
   * other (D-01, D-03).
   */
  shadowSilent: boolean;
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
  /**
   * Wall time. It is the second opinion in the silence measurement, the term
   * that covers a suspend the forward-only source sleeps through.
   */
  clock: Clock;
  /**
   * Forward-only elapsed time, and the primary term the silence window is
   * measured against, so a wall-clock correction cannot shorten a window and
   * leave a dead pump reading as trustworthy (D-06, IN-03).
   */
  monotonic: MonotonicClock;
}

/** Tracks the two transport facts the trust decision is derived from: one for the account, one per device. */
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

// When one device's live path was last heard from, read on both time bases at
// the same instant.
//
// Two readings rather than one, because neither base answers alone: the
// forward-only one cannot be moved by a wall-clock correction and does not
// advance across a system suspend, and the wall one is the reverse of both.
// They are held in one record rather than in two maps so the pair is written,
// read and pruned together and cannot come apart.
interface ShadowArrival {
  monotonic: number;
  wall: number;
}

// How long a device has been quiet: the larger of the two elapsed times.
//
// The direction is the whole point. The larger can only ever report silence
// sooner, which is the safe direction for a plugin that must never say a normal
// it cannot support; the smaller would be the exact inversion that hides a dead
// pump, and it is the mutation this expression is pinned against.
//
// Each term covers a failure the other does not. The forward-only term covers a
// wall clock stepped backwards -- by NTP, by hand, or by a board that woke with
// no battery -- further than the whole window, which is the case that would
// otherwise hand a pump that stopped speaking hours ago a fresh certificate of
// health: a backwards step makes the wall term small or negative and the
// forward-only term wins. The wall term covers a system suspend, which the
// forward-only source does not advance across, so a host that slept wakes with
// that counter short and the wall term wins instead. A forward wall step
// inflates the wall term and marks early, which is the direction this
// measurement is allowed to be wrong in (D-07, IN-03).
function silenceElapsedMs(arrival: ShadowArrival, monotonicNow: number, wallNow: number): number {
  return Math.max(monotonicNow - arrival.monotonic, wallNow - arrival.wall);
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
  // One arrival per admitted device, because the question "has this controller
  // stopped speaking" has one answer per controller. A single account stamp is
  // re-armed by whichever pump spoke last, which vouches for the ones that did
  // not (D-05, D-13).
  const lastShadowArrival = new Map<string, ShadowArrival>();

  // Both bases are read at the same instant, so the pair describes one arrival
  // rather than two.
  function arrivalNow(): ShadowArrival {
    return { monotonic: options.monotonic.now(), wall: options.clock.now() };
  }

  function silentDevices(): readonly string[] {
    const monotonicNow = options.monotonic.now();
    const wallNow = options.clock.now();

    return [...lastShadowArrival]
      .filter(([, arrival]) => {
        // The instant the longer of the two silences began, carried onto the
        // base the threshold is measured on, so the comparison is made one way.
        const silentSince = monotonicNow - silenceElapsedMs(arrival, monotonicNow, wallNow);

        return isShadowSilent(silentSince, monotonicNow);
      })
      .map(([deviceId]) => deviceId);
  }

  return {
    recordRestSuccess(): void {
      consecutiveRestFailures = 0;
    },

    recordRestFailure(): void {
      consecutiveRestFailures += 1;
    },

    recordShadowMessage(deviceId: string): void {
      lastShadowArrival.set(deviceId, arrivalNow());
    },

    admitDevice(deviceId: string): void {
      if (!lastShadowArrival.has(deviceId)) {
        lastShadowArrival.set(deviceId, arrivalNow());
      }
    },

    forgetDevice(deviceId: string): void {
      lastShadowArrival.delete(deviceId);
    },

    silentDevices,

    // Only the account-wide fact is answered here. Silence has one answer per
    // controller and `silentDevices()` gives it; folding that list into a single
    // boolean would spend one quiet pump's silence on every pump beside it,
    // which is the false report this projection exists to avoid making
    // (D-01, D-03, D-04).
    trustNow(): TransportTrust {
      return {
        restDegraded: isRestDegraded(consecutiveRestFailures),
      };
    },
  };
}
