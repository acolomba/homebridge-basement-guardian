// SPDX-License-Identifier: MIT
/**
 * @fileoverview The one place a HomeKit write reaches the vendor.
 *
 * Everything else in this plugin flows one way: a vendor fact becomes a
 * published characteristic. This module is the only path in the other
 * direction, so it is where a controller can cause a physical action on a
 * sump-pump system for the first time. It is deliberately narrow. Two
 * capabilities exist, only `true` is ever requested, and the wire body is built
 * behind the family boundary by whoever implements the injected command port,
 * so nothing here knows what a Gemini calls anything (D-004, CTRL-05).
 *
 * The catalogue stays projection-only. This binder attaches to a service the
 * catalogue already published, through the one lookup an accessory reaches for
 * when it must act on what it already published, so one service list keeps
 * feeding subtypes, names, and descriptors (D-01).
 *
 * Two HAP behaviours govern the code below, both read out of the pinned
 * package's own source rather than assumed:
 *
 * - A rejected write never moves the stored value, so nothing here restores a
 *   refused toggle. A push before the throw would clear the status HAP is about
 *   to set and emit a change nobody asked for.
 * - A rejected write does store its status on the characteristic, and every
 *   later read answers that status until something pushes a value. Left alone,
 *   one refused press makes the Switch unreadable until the next poll. Every
 *   refusal therefore arms a clearing push, and that push is a macrotask
 *   through the injected timer port: a microtask queued inside the handler runs
 *   before HAP's own catch assigns the status, so it would clear a status that
 *   has not been set yet (D-04).
 *
 * Once `On` carries a handler, `setCharacteristic` on it routes through the
 * write path and becomes a command this plugin issued to itself. Every writer
 * here and every caller uses `publishValue`, which updates rather than sets.
 *
 * The binder is not the only write handler this module owns. A restart the
 * vendor cloud never answers restores the control Switches from the Homebridge
 * cache long before any accessory exists to route a press, and HAP answers a
 * write with no handler by storing the value and reporting success -- so the
 * toggle flips in Apple Home, an automation built on it fires, and nothing
 * happened. `bindRestoredControlRefusal` closes that window with a refusal
 * carrying the same status and the same cause the transport rule gives a live
 * accessory, and the binder's own handler replaces it on the first publish
 * because a set handler is a single slot in HAP rather than a listener list
 * (RES-04, D-07, D-08).
 */

import { PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE } from './alarmMute.js';
import { publishValue } from './serviceCatalogue.js';

import type { DeviceCapability } from '../device/family.js';
import type { CommandFailure, CommandPort } from '../runtime/commandPort.js';
import type { Timers } from '../runtime/timers.js';
import type { API, CharacteristicValue, Logging, Service } from 'homebridge';

/** Everything the control binder needs, by injection. */
export interface ControlBinderOptions {
  hap: API['hap'];
  log: Logging;
  /**
   * Deferred execution, used on the write path and nowhere else.
   *
   * The clearing push has to run after HAP's own catch has stored the refusal
   * status, which is the next macrotask and no earlier. Taking the port rather
   * than reaching for the process timers is what lets a test read back the
   * delay the binder asked for instead of watching a wall clock (SAFE-07, D-18).
   */
  timers: Timers;
  commands: CommandPort;
  /** The device every command from this binder is addressed to. */
  deviceId: string;
  /**
   * Whether the configured run of consecutive disconnected polls has been reached.
   *
   * The accessory answers this from the same count it hands `ProjectionInput`,
   * so the fact a row publishes from and the fact a write is refused on cannot
   * disagree (RES-03, D-09).
   */
  offlineConfirmed: () => boolean;
  /**
   * Whether the plugin currently has a proven way to reach the vendor at all.
   *
   * This is a fact about the plugin, not about the device, and it is the other
   * half of the gate: a press can be impossible either because the plugin
   * cannot vouch for what the device is doing or because it has no route to
   * send on, and the two fail independently. A fresh live report can arrive
   * while REST authentication has not completed, and a poll can keep succeeding
   * while the live path has gone quiet, so a single readiness answer would tell
   * a user diagnosing a refused press the wrong thing half the time.
   *
   * The accessory answers this from the account-wide monitoring trust it also
   * publishes its rows from, and it answers `reported` below through the same
   * rule that decides whether the control's row may publish that value. So the
   * fact a row publishes from and the fact a write is refused on cannot
   * disagree: they are one stored value read through one rule.
   *
   * That was written here as an invariant before it was one. The row was widened
   * to keep publishing what a working transport delivered and the write path was
   * not, so a press was refused for a missing state while the tile beside it
   * showed that state. The case holding this up is "returns the Switch to the
   * value the device reported when a press is refused during shadow silence",
   * which reads the write path's own answer where a controller can see it
   * (RES-04, D-07, WR-02).
   */
  commandTransportReady: () => boolean;
  /**
   * Whether the live path can currently carry the device's own confirmation.
   *
   * A third fact rather than a shade of the other two, because all three fail
   * independently. The plugin can hold a route to send on and a freshly reported
   * value to act from and still be unable to see the answer: a confirmation
   * travels on the live path, and the window a request waits in is shorter than
   * a poll interval, so while that path is quiet the earliest confirmation is a
   * poll the configuration may put an hour away.
   *
   * A press accepted then would reach a real sump pump and expire with a warning
   * naming a device failure that did not happen, and the duplicate rule below
   * would meanwhile be judging a reading up to a poll interval old, so a second
   * press could start a test while one was already running (RES-04, D-07, D-08).
   */
  liveConfirmationObservable: () => boolean;
  /**
   * Republishes the control rows, and only those.
   *
   * Nothing else changed when a write was refused, and a full republish from a
   * deferred callback would make the accessory's "two updates cannot interleave"
   * claim harder to hold.
   */
  republish: () => void;
}

/** The write half of the two control Switches. */
export interface ControlBinder {
  /**
   * The capabilities carrying an unresolved request right now.
   *
   * The accessory reads this into `ProjectionInput`, which is the only route
   * requested state reaches a row through: no reported patch and no shadow
   * topic carries it, so it can never become canonical safety state (D-037).
   */
  readonly pending: ReadonlySet<DeviceCapability>;
  /**
   * Attaches the write handler to a Switch the catalogue already published.
   *
   * Calling it again on the same service registers no second handler, because
   * the accessory walks its whole catalogue on every update and HAP keeps only
   * the last handler registered while warning about the ones before it.
   *
   * `reported` answers what the device itself last said about this capability,
   * or `undefined` when the scope owning it did not decode.
   */
  bind(service: Service, capability: DeviceCapability, reported: () => boolean | undefined): void;
  /**
   * Resolves a pending request against what the device now reports.
   *
   * A reported value matching what was asked for clears the entry, and from
   * then on the Switch follows reported state alone. A capability with no
   * pending entry is a no-op, which is what makes an externally initiated test
   * and a second confirming report both harmless (CTRL-03, D-037).
   */
  reconcile(capability: DeviceCapability, reported: boolean | undefined): void;
}

/** Everything the refusal a restored control answers needs, by injection. */
export interface RestoredControlRefusalOptions {
  hap: API['hap'];
  log: Logging;
  /**
   * Deferred execution, for the clearing push and nothing else.
   *
   * The same port the binder takes, for the same reason: the push has to land
   * after HAP's own catch has stored the refusal status, which is the next
   * macrotask and no earlier (SAFE-07, D-18).
   */
  timers: Timers;
  /** The restored Switch the refusal is attached to. */
  service: Service;
  /**
   * The accessory the service came back on.
   *
   * The display name rather than a `deviceId`, because a restored accessory is
   * all the identity there is here: the restart passes read nothing from the
   * accessory context, and a cache an older release wrote names no device in it
   * at all. Without some name a multi-pump account cannot tell which system
   * refused a control, which is the same reason the binder's own line carries
   * the device identifier.
   */
  accessoryName: string;
}

/**
 * How long a request waits for the device's own confirming report.
 *
 * The observed self-test duration is about sixteen seconds, so this is a window
 * wide enough for a device to answer rather than a guess at how long a test
 * takes. When it closes the row resumes projecting reported state and nothing
 * is retried (D-037, D-06).
 */
const PENDING_WINDOW_MS = 30_000;

// One unresolved request: what was asked for, and the handle of the deadline
// that ends the wait for it.
interface PendingRequest {
  value: boolean;
  handle: unknown;
}

// Everything a local rule reads about one write. Every fact is sampled once,
// before the first rule runs, so no two rules can disagree about the same
// press.
interface ControlRequest {
  value: CharacteristicValue;
  /** The one value this capability will ever be asked for. */
  accepted: boolean;
  reported: boolean | undefined;
  offlineConfirmed: boolean;
  transportReady: boolean;
  confirmationObservable: boolean;
}

// One refusal the plugin answers on its own: what decides it, the status that
// describes it, and the cause its log line names. Nothing reaches the network
// for any of them, so a press the official Gemini client would itself have
// refused never operates a real sump pump (D-07, CTRL-03).
interface LocalRefusal {
  applies: (request: ControlRequest) => boolean;
  status: (hap: API['hap']) => number;
  cause: string;
}

// The one value a capability will ever be asked for. Self-test's is the measured
// `true`; mute's is the provisional constant, so the value the plugin accepts
// and the value it sends move together when `G-001` closes (D-16, D-019).
function acceptedValueOf(capability: DeviceCapability): boolean {
  return capability === 'alarm-mute' ? PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE : true;
}

// A write of anything but the capability's one accepted value is a cancel or an
// unmute. The device owns when a test stops, the vendor exposes no cancel, and
// mute has no off command, so this plugin answers neither rather than inventing
// one (D-018, D-019, CTRL-03).
function isNotAnOnRequest(request: ControlRequest): boolean {
  return request.value !== request.accepted;
}

// The plugin has no proven way to reach the vendor at all: the runtime is
// stopped, authentication has halted for good, or the last poll did not
// succeed. Sending anyway buys a round trip into a route that has just failed
// and lands as a vendor error, which would tell the user the vendor refused the
// command when nothing ever reached it. This is a fact about the plugin, not
// about the device, and it fails independently of the one below -- a fresh live
// report can arrive while authentication has not completed -- so it carries its
// own cause (RES-04, D-07, D-08).
function hasNoCommandTransport(request: ControlRequest): boolean {
  return !request.transportReady;
}

// The live path carrying the device's own confirmation has gone quiet, while the
// plugin still has a route to send on and a value the poll delivered. Nothing
// the plugin holds is missing here; what is missing is the channel an answer
// comes back on, and the wait for one closes long before the next poll could
// carry it. Sending anyway would operate a real sump pump and then warn that the
// device never confirmed it, for a condition on this side of the connection
// (RES-04, D-07, D-08, WR-02).
function cannotSeeAConfirmation(request: ControlRequest): boolean {
  return !request.confirmationObservable;
}

// The capability's own reported field has not decoded. Without a decoded value
// the plugin cannot tell a running test from an idle one, and issuing a command
// on that basis would operate a real sump pump on a guess, so this answers the
// same status a confirmed-offline device does: the command is not allowed in
// the state the plugin can actually vouch for (D-031, D-014).
function hasNoFreshState(request: ControlRequest): boolean {
  return request.reported === undefined;
}

// The device is confirmed offline. This is the one condition the official
// Gemini client disables both commands on, and refusing here also stops a press
// on an unreachable device from blocking HomeKit for the whole command deadline
// (D-07).
//
// Equipment faults are deliberately absent. The official client permits a
// self-test while equipment faults are present and disables the command only
// when the device is offline, so the binder reads confirmed-offline state and
// the capability's own reported value and nothing else. Inventing a physical
// eligibility rule the official client does not have would refuse exactly the
// test an owner runs to check a suspect pump (D-018).
function isConfirmedOffline(request: ControlRequest): boolean {
  return request.offlineConfirmed;
}

// The capability already reads what was asked for, so this press is a duplicate. The
// official client refuses one and `CTRL-03` requires it regardless: a second
// request would operate a real sump pump the vendor would not have (D-07).
function isAlreadyActive(request: ControlRequest): boolean {
  return request.reported === request.accepted;
}

function notAllowedInCurrentState(hap: API['hap']): number {
  return hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE;
}

// The rules in the order they are evaluated, cheapest and most local first. The
// first that applies answers the write; the rest are never consulted.
//
// The order of the three middle rules is a decision, not an accident. Any two of
// them can hold at once, and then this order decides which cause the user is
// told. Naming the missing state to someone who has no way to send anything is
// the less actionable of the two truths -- there is nothing to do about a stale
// reading while the route is down -- so the missing transport is named first. A
// unit case pins that with both conditions set, because an unrelated edit that
// reordered this table would otherwise change the user-facing cause silently.
//
// The quiet live path sits between them for the same reason read the other way.
// A plugin with no route at all is the more fundamental truth and keeps its
// place at the top. But a quiet live path is named ahead of a missing state
// because during that silence the state is not missing: the poll delivered it
// and the tile is showing it, so naming the state would send an owner to inspect
// equipment that is fine while the condition that actually blocked the press
// went unnamed. It is refused all the same -- the plugin still could not tell a
// running test from an idle one afterwards (D-07, D-08, WR-02).
// The cause the missing-transport rule names, declared once because two
// refusals now answer it. A restart the cloud has not answered is the same
// condition under a different name -- the plugin has no route to send on -- and
// one condition carrying two wordings is exactly the blur the per-cause table
// exists to prevent (D-08).
const NO_COMMAND_TRANSPORT_CAUSE = 'the plugin has no way to reach the vendor right now';

// The cause the quiet-live-path rule names, declared beside the one above so the table below reads
// as a table rather than as one wrapped line among short ones. It names the connection and what the
// plugin cannot do because of it, and nothing else: no threshold, no interval, and no internal term
// an owner would have to look up (D-08).
const QUIET_LIVE_CONNECTION_CAUSE = 'the live connection is quiet, so the plugin cannot see the device confirm the command';

const LOCAL_REFUSALS: readonly LocalRefusal[] = [
  { applies: isNotAnOnRequest, status: notAllowedInCurrentState, cause: 'only an on request is supported, and the device reports when the condition ends' },
  { applies: hasNoCommandTransport, status: notAllowedInCurrentState, cause: NO_COMMAND_TRANSPORT_CAUSE },
  { applies: cannotSeeAConfirmation, status: notAllowedInCurrentState, cause: QUIET_LIVE_CONNECTION_CAUSE },
  { applies: hasNoFreshState, status: notAllowedInCurrentState, cause: 'the plugin has no fresh state for it' },
  { applies: isConfirmedOffline, status: notAllowedInCurrentState, cause: 'the device is confirmed offline' },
  { applies: isAlreadyActive, status: (hap) => hap.HAPStatus.RESOURCE_BUSY, cause: 'it already reads active' },
];

function localRefusalFor(request: ControlRequest): LocalRefusal | undefined {
  return LOCAL_REFUSALS.find((refusal) => refusal.applies(request));
}

// The status each cause answers, so a log line and an Eve-class controller read
// true; Apple Home shows a generic failure for both (D-04).
function statusOf(hap: API['hap'], failure: CommandFailure): number {
  return failure === 'timed-out' ? hap.HAPStatus.OPERATION_TIMED_OUT : hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE;
}

// Only a `HapStatusError` is ever thrown. A plain `Error` is converted to a
// communication failure and emits a characteristic warning quoting its message,
// which would put a cause the plugin chose into a channel it does not control.
function refuse(hap: API['hap'], status: number): never {
  throw new hap.HapStatusError(status);
}

// The value HAP is already serving for this characteristic, read back rather
// than guessed.
function heldOn(hap: API['hap'], service: Service): CharacteristicValue {
  return service.getCharacteristic(hap.Characteristic.On).value === true;
}

// The push that returns a refused characteristic's stored status to `0`.
//
// The republish re-asserts everything the control rows can currently vouch for.
// The push after it closes the one case a republish cannot: a row publishes `On`
// only while it can vouch for the reported value, so a refusal answered while
// the control's own scope is untrustworthy would leave the status standing and
// the Switch unreadable. Pushing the value the characteristic already carries
// states nothing new -- HAP returns a stored status to `0` whatever value it is
// given (D-04, D-014).
function clearRefusal(hap: API['hap'], service: Service, republish: () => void, reported: boolean | undefined): void {
  republish();

  publishValue(service, hap.Characteristic.On, reported ?? heldOn(hap, service));
}

// A restored service belongs to no accessory yet, so there are no control rows
// to re-assert and nothing to republish from. The push alone is what the
// refusal needs, and it is the half of `clearRefusal` that does the work.
function nothingToRepublish(): void {
  // no accessory exists to publish rows from
}

/**
 * Refuses every press on one restored control until an accessory exists to
 * route it.
 *
 * A restart the vendor cloud never answers is the window `RES-04` names, and it
 * is unbounded: this plugin publishes nothing until the first REST inventory
 * succeeds, and the cached Switches are served by HAP from the moment the
 * bridge publishes. With no handler on `On`, HAP stores the written value and
 * answers success, so a press reports that it worked, an automation watching
 * the Switch fires, and nothing was sent. Nothing reaching the vendor is
 * correct and stays correct here; what changes is that the owner is told.
 *
 * The status and the cause are the transport rule's own, because the condition
 * is the transport rule's own: the plugin has no proven way to reach the
 * vendor. Reusing both keeps one condition answering one status with one
 * wording (D-07, D-08).
 *
 * The clearing push is not optional. HAP stores a thrown status on the
 * characteristic and answers it to every later read, which Apple Home draws as
 * "No Response" for the whole accessory -- the presentation this project
 * reserves for a refused credential, which never clears itself and which an
 * automatic retry makes worse. A restart with the cloud down clears itself the
 * moment a poll succeeds, so it must not borrow that presentation. The push
 * carries the value the characteristic is already serving, because there is no
 * reported value to restore and HAP returns a stored status to `0` whatever
 * value it is given (D-04, D-10).
 *
 * A write handler and nothing else. `RES-04` asks that reads answer from
 * memory, and the one path from HomeKit to the vendor is a write, so no read
 * handler is registered here or anywhere in this tier (D-09).
 */
export function bindRestoredControlRefusal(options: RestoredControlRefusalOptions): void {
  const { hap, log, timers, service, accessoryName } = options;

  // `onSet` rather than `on('set', ...)`, matching the binder: HAP warns when a
  // characteristic carries both and ignores the event listener. It is also what
  // makes this refusal replaceable rather than permanent -- `setHandler` is one
  // slot, so the binder's own handler takes it over on the first publish and a
  // recovered plugin operates its controls normally.
  service.getCharacteristic(hap.Characteristic.On).onSet(() => {
    timers.setTimeout(() => {
      clearRefusal(hap, service, nothingToRepublish, undefined);
    }, 0);
    log.warn(`Refused ${service.displayName} on ${accessoryName}: ${NO_COMMAND_TRANSPORT_CAUSE}.`);

    return refuse(hap, notAllowedInCurrentState(hap));
  });
}

/**
 * Builds the write half of the control Switches.
 *
 * Building it registers no handler and sends nothing; `bind` is what attaches
 * one, and it is called with a service the catalogue has already published.
 */
export function createControlBinder(options: ControlBinderOptions): ControlBinder {
  const { hap, log, timers, commands, deviceId, offlineConfirmed, commandTransportReady, liveConfirmationObservable, republish } = options;

  // What was asked for, per capability, from the moment a write is accepted for
  // sending until the device confirms it or the window closes. The value is kept
  // beside the key because reconciliation compares the two: a report that does
  // not match the request resolves nothing. The window's handle is kept beside
  // it so a confirming report can cancel the deadline it no longer needs.
  //
  // One binder exists per accessory and one entry exists per capability, so the
  // window is per capability per accessory by construction rather than by a rule
  // someone has to remember: no process-wide or cross-accessory state exists for
  // two requests to contend over (D-05, D-06).
  const requested = new Map<DeviceCapability, PendingRequest>();
  const bound = new Set<Service>();

  // Drops the entry and cancels the deadline that was ending the wait for it.
  //
  // A capability with no entry is a no-op, which is what makes this and the
  // expiry idempotent deletes of the same thing: whichever runs first wins and
  // the second changes nothing, so a confirming report landing at the instant
  // the window closes needs no ordering rule beyond that. It also covers a
  // report that resolved the request while its own command was still in flight.
  function resolvePending(capability: DeviceCapability): void {
    const entry = requested.get(capability);

    if (entry === undefined) {
      return;
    }

    timers.clearTimeout(entry.handle);
    requested.delete(capability);
  }

  // The window closed with no confirming report. The entry goes, the control
  // rows republish so the Switch returns to what the device says, and one
  // warning names the capability.
  //
  // Nothing is retried: a command that outlived its deadline may already have
  // reached the device, and a second attempt would operate a real sump pump
  // twice. `StatusActive` is deliberately not used to mark this either -- it
  // already means the reported field did not decode, and one signal carrying two
  // meanings would leave a user unable to tell which happened (D-038, D-06).
  //
  // The republish is the control rows alone, as `republish` documents: nothing
  // else changed, and a full republish driven from a timer would make the
  // accessory's "two updates cannot interleave" claim harder to hold.
  function expire(capability: DeviceCapability): void {
    if (!requested.delete(capability)) {
      return;
    }

    republish();
    log.warn(`The ${capability} request on ${deviceId} was never confirmed by the device. It is not retried.`);
  }

  function armClearingPush(service: Service, reported: () => boolean | undefined): void {
    timers.setTimeout(() => {
      clearRefusal(hap, service, republish, reported());
    }, 0);
  }

  // A refusal the plugin answered by itself. Nothing was sent, so nothing is
  // pending to drop; the clearing push is armed before the throw because HAP
  // stores the status on the characteristic and answers it to every later read
  // until something pushes a value.
  //
  // The line names the device, the capability and a cause, and nothing else: no
  // URL, header value, token, or response body (AUTH-02). The `deviceId` is
  // deliberate. It reads `<account-id>_<serial-number>`, and the 2026-08-29
  // ruling treats it as non-sensitive and admits it to logs and accessory
  // context; `D-027` still keeps it out of public artifacts. Without it a
  // multi-pump account cannot tell which pump refused a control, which matters
  // more here than the residual the ruling already weighed.
  function refuseLocally(service: Service, capability: DeviceCapability, reported: () => boolean | undefined, refusal: LocalRefusal): never {
    armClearingPush(service, reported);
    log.warn(`Refused ${capability} on ${deviceId}: ${refusal.cause}.`);

    return refuse(hap, refusal.status(hap));
  }

  // The vendor refused or never answered. The pending entry is dropped first, so
  // the row resumes publishing reported state, and nothing is retried: a command
  // that outlived its deadline may already have reached the device (D-038).
  function refuseOutcome(service: Service, capability: DeviceCapability, reported: () => boolean | undefined, failure: CommandFailure): never {
    resolvePending(capability);
    armClearingPush(service, reported);
    log.warn(`The ${capability} request on ${deviceId} did not take effect: ${failure}. It is not retried.`);

    return refuse(hap, statusOf(hap, failure));
  }

  async function answerWrite(service: Service, capability: DeviceCapability, reported: () => boolean | undefined, value: CharacteristicValue): Promise<void> {
    const accepted = acceptedValueOf(capability);
    const refusal = localRefusalFor({
      value,
      accepted,
      reported: reported(),
      offlineConfirmed: offlineConfirmed(),
      transportReady: commandTransportReady(),
      confirmationObservable: liveConfirmationObservable(),
    });

    if (refusal !== undefined) {
      refuseLocally(service, capability, reported, refusal);
    }

    // From here the row withholds `On`, so the accessory's next update cannot
    // snap the toggle back before the device confirms (D-05). The entry is
    // created immediately before the request leaves, with its own deadline, so
    // no path can leave one behind with no way out.
    requested.set(capability, {
      value: accepted,
      handle: timers.setTimeout(() => {
        expire(capability);
      }, PENDING_WINDOW_MS),
    });

    const outcome = await commands.send(deviceId, capability, accepted);

    if (!outcome.accepted) {
      refuseOutcome(service, capability, reported, outcome.failure);
    }

    // Accepted. Nothing is pushed: HAP keeps serving the value this write left,
    // and the entry stays until the device's own report resolves it.
  }

  return {
    get pending(): ReadonlySet<DeviceCapability> {
      return new Set(requested.keys());
    },

    bind(service: Service, capability: DeviceCapability, reported: () => boolean | undefined): void {
      if (bound.has(service)) {
        return;
      }

      bound.add(service);
      // `onSet` rather than `on('set', ...)`: HAP warns when a characteristic
      // carries both and ignores the event listener.
      service.getCharacteristic(hap.Characteristic.On).onSet((value) => answerWrite(service, capability, reported, value));
    },

    reconcile(capability: DeviceCapability, reported: boolean | undefined): void {
      if (requested.get(capability)?.value === reported) {
        resolvePending(capability);
      }
    },
  };
}
