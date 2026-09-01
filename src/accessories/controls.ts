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
 */

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

/**
 * Builds the write half of the control Switches.
 *
 * Building it registers no handler and sends nothing; `bind` is what attaches
 * one, and it is called with a service the catalogue has already published.
 */
export function createControlBinder(options: ControlBinderOptions): ControlBinder {
  const { hap, log, timers, commands, deviceId, republish } = options;

  // What was asked for, per capability, from the moment a write is accepted for
  // sending until the device confirms it. The value is kept beside the key
  // because reconciliation compares the two: a report that does not match the
  // request resolves nothing.
  const requested = new Map<DeviceCapability, boolean>();
  const bound = new Set<Service>();

  function armClearingPush(service: Service, reported: () => boolean | undefined): void {
    timers.setTimeout(() => {
      clearRefusal(hap, service, republish, reported());
    }, 0);
  }

  // A write of anything but `true` is a cancel or an unmute. The device owns
  // when a test stops, the vendor exposes no cancel, and mute has no off
  // command, so this plugin answers neither rather than inventing one
  // (D-018, D-019, CTRL-03).
  function refuseValue(service: Service, capability: DeviceCapability, reported: () => boolean | undefined): never {
    armClearingPush(service, reported);
    log.warn(`Refused ${capability} on ${deviceId}: only an on request is supported, and the device reports when the condition ends.`);

    return refuse(hap, hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE);
  }

  // The vendor refused or never answered. The pending entry is dropped first, so
  // the row resumes publishing reported state, and nothing is retried: a command
  // that outlived its deadline may already have reached the device (D-038).
  function refuseOutcome(service: Service, capability: DeviceCapability, reported: () => boolean | undefined, failure: CommandFailure): never {
    requested.delete(capability);
    armClearingPush(service, reported);
    log.warn(`The ${capability} request on ${deviceId} did not take effect: ${failure}. It is not retried.`);

    return refuse(hap, statusOf(hap, failure));
  }

  async function answerWrite(service: Service, capability: DeviceCapability, reported: () => boolean | undefined, value: CharacteristicValue): Promise<void> {
    if (value !== true) {
      refuseValue(service, capability, reported);
    }

    // From here the row withholds `On`, so the accessory's next update cannot
    // snap the toggle back before the device confirms (D-05).
    requested.set(capability, true);

    const outcome = await commands.send(deviceId, capability, true);

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
      if (requested.get(capability) === reported) {
        requested.delete(capability);
      }
    },
  };
}
