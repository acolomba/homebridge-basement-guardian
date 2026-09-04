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

import type { ArrivalAnchors } from './arrivalAnchors.js';
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
  /**
   * Where the wall readings of the arrivals live, so the wall term survives a
   * restart the forward-only base cannot.
   *
   * It is injected rather than held here because the store is read from disk
   * and written back to it, and this module owns no I/O. It reads and records
   * anchors; the runtime decides when the store meets the disk (D-07, D-08).
   */
  anchors: ArrivalAnchors;
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
// that counter short and the wall term wins instead; and it covers a restart,
// which resets the forward-only base to nothing while the anchor stays where
// the last arrival left it. A forward wall step inflates the wall term and marks
// early, which is the direction this measurement is allowed to be wrong in
// (D-07, IN-03).
//
// The wall term is omitted when the store holds no anchor, and the answer is
// then the forward-only term alone. That is the narrow reading of D-08, and it
// is taken deliberately over the literal one. D-08 says an install carrying no
// anchor "falls through to D-02 -- silent until told otherwise", and D-02 is the
// rule that an accessory with no entry in the pushed map reads silent. Read
// narrowly, D-02 governs that platform-map lookup rather than this measurement,
// so a device this module has admitted but never heard from is judged from its
// admission and reads trustworthy until two heartbeats of forward-only time
// pass, exactly as it did before any anchor existed. Read literally as a rule
// about the measurement, a fresh admission would be silent at once -- which
// contradicts this module's own rule that admission is the right zero, and would
// leave every device on every install untrusted for fifteen minutes after an
// upgrade, for no observation anyone made. The two readings agree on the case
// D-08 is actually about: an accessory restored from cache before discovery
// completes has no map entry and does not vouch, and it gets that answer from
// the platform lookup rather than from here.
function silenceElapsedMs(arrivedAt: number, anchor: number | undefined, monotonicNow: number, wallNow: number): number {
  const forwardOnlyElapsedMs = monotonicNow - arrivedAt;

  return anchor === undefined ? forwardOnlyElapsedMs : Math.max(forwardOnlyElapsedMs, wallNow - anchor);
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
  // One arrival per admitted device, on the forward-only base, because the
  // question "has this controller stopped speaking" has one answer per
  // controller. A single account stamp is re-armed by whichever pump spoke last,
  // which vouches for the ones that did not (D-05, D-13). The wall reading of
  // the same arrival lives in the injected store, because that is the term that
  // has to survive a restart and this module writes no file.
  const lastShadowArrival = new Map<string, number>();

  function silentDevices(): readonly string[] {
    const monotonicNow = options.monotonic.now();
    const wallNow = options.clock.now();

    return [...lastShadowArrival]
      .filter(([deviceId, arrivedAt]) => {
        // The instant the longer of the two silences began, carried onto the
        // base the threshold is measured on, so the comparison is made one way.
        const silentSince = monotonicNow - silenceElapsedMs(arrivedAt, options.anchors.get(deviceId), monotonicNow, wallNow);

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
      lastShadowArrival.set(deviceId, options.monotonic.now());
      // Recorded unconditionally, because a message really did arrive: this is
      // the one event that is evidence of a live path, and it moves both terms.
      options.anchors.record(deviceId, options.clock.now());
    },

    admitDevice(deviceId: string): void {
      if (!lastShadowArrival.has(deviceId)) {
        lastShadowArrival.set(deviceId, options.monotonic.now());
      }

      // Only when the store holds none, and this is the single line that makes a
      // restart work. Admission is the right zero for a device the plugin has
      // never heard from, and only for that device: overwriting an anchor the
      // store restored with the current instant is exactly how a restart comes
      // to vouch for a pump that has been quiet for hours (D-07, D-08).
      if (options.anchors.get(deviceId) === undefined) {
        options.anchors.record(deviceId, options.clock.now());
      }
    },

    // The anchor is not dropped here. It is persisted state, and the runtime
    // drops it at the one site that has decided a device is really gone, beside
    // the stamp this line drops and the removed device's reporting kind.
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
