// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Stores immutable canonical device snapshots and reported state.
 */

import { isDeepStrictEqual } from 'node:util';

import type { ApiConnectivity, ApiDevice } from '../cloud/types.js';
import type { Clock } from '../runtime/clock.js';
import type { Logging } from 'homebridge';

/** The identifying and display facts for one physical system (C-002, D-030). */
export interface DeviceIdentity {
  /** The vendor identifier. It seeds the accessory UUID and is immutable. */
  deviceId: string;
  deviceTypeId: string;
  name: string;
  serialNumber: string;
}

/**
 * One canonical view of a device at a point in time.
 *
 * The envelope is typed; `data` and `metadata` are not. Nothing here decodes a
 * telemetry field, so an unknown or invalid vendor value cannot become a
 * guessed measurement (D-20, D-014).
 */
export interface DeviceSnapshot {
  identity: DeviceIdentity;
  connectivity: ApiConnectivity;
  /** Reported telemetry, carried opaquely. */
  data: Readonly<Record<string, unknown>>;
  /** Reported device metadata, carried opaquely and kept apart from telemetry. */
  metadata: Readonly<Record<string, unknown>>;
  /**
   * Which source owns `data`, and how far the shadow has been applied.
   *
   * A defined value says the shadow is currently the source of telemetry and
   * has applied up to that version. `undefined` says it is not, which is what
   * hands telemetry to the poll (SYNC-02, SYNC-03).
   */
  shadowVersion: number | undefined;
  /** Device time, as the device reported it. */
  deviceTimestamp: number | undefined;
  /** Local time the plugin received this state. Never mixed with device time. */
  receivedAt: number;
}

/**
 * One reported shadow document, or the seven fields a heartbeat carries.
 *
 * The shape holds reported device state and nothing else. Requested control
 * state never becomes canonical safety state, and a requested value of `null`
 * is the device acknowledging a command rather than reporting a measurement,
 * so neither has a member to land in (SYNC-02).
 */
export interface ReportedPatch {
  /**
   * Reported telemetry. Absent when the message carried none, and equally
   * absent when what it carried is not an object.
   */
  data: Readonly<Record<string, unknown>> | undefined;
  /** Reported device metadata. Absent when the message carries none. */
  state: Readonly<Record<string, unknown>> | undefined;
  /** The shadow document version. Absent when the source supplies none. */
  version: number | undefined;
}

/**
 * Receives one canonical state change for one device.
 *
 * `changedKeys` names the telemetry keys whose values differ, in a stable
 * order. It is empty for an accepted heartbeat that repeats the stored
 * telemetry, so consumers can update trust time without counting another
 * activation (D-19).
 */
export type DeviceSnapshotListener = (next: DeviceSnapshot, previous: DeviceSnapshot | undefined, changedKeys: readonly string[]) => void;

/** Everything the store needs, by injection. */
export interface DeviceStateStoreOptions {
  clock: Clock;
  log: Logging;
}

/** Holds one immutable snapshot per device. */
export interface DeviceStateStore {
  /** Returns the stored snapshot, or undefined for an undiscovered device. */
  snapshot(deviceId: string): DeviceSnapshot | undefined;
  /** Lists every device identifier currently held by the store. */
  deviceIds(): readonly string[];
  /**
   * Refreshes identity, reachability and device time from one REST discovery.
   * Records local receipt time separately and replaces telemetry only while
   * the shadow holds no ownership watermark. Preserves shadow metadata.
   */
  applyDiscovery(device: ApiDevice): DeviceSnapshot;
  /**
   * Merges one reported patch into the stored snapshot.
   *
   * Reports nothing for a device REST discovery has not returned, because a
   * device enters the store through discovery alone.
   */
  applyReportedPatch(deviceId: string, patch: ReportedPatch): DeviceSnapshot | undefined;
  /**
   * Drops the stored snapshot and every registered listener for `deviceId`.
   *
   * An unknown device is a no-op. Rediscovery starts a fresh observation epoch
   * (D-020).
   */
  remove(deviceId: string): void;
  /**
   * Registers a listener for one device and returns its unsubscribe function.
   *
   * An accepted telemetry heartbeat notifies listeners even when its values
   * are unchanged. Rejected patches and documents without telemetry do not.
   */
  subscribe(deviceId: string, listener: DeviceSnapshotListener): () => void;
  /**
   * Hands one device's telemetry back to polling. A silence keeps the current
   * connection's version fence; a disconnect permits a reconnect refresh.
   * Preserves observed values and receipt time, and notifies no listener.
   * An unknown device is a no-op; repeated releases leave observations unchanged.
   */
  releaseShadowSource(deviceId: string, reason: 'silence' | 'disconnect'): void;
}

const NO_LISTENERS: ReadonlySet<DeviceSnapshotListener> = new Set();

// A heartbeat carries seven of the roughly twenty reported fields, so the merge
// runs key by key. Assigning a payload wholesale would blank pump, power,
// charging, test, and fault values every fifteen minutes.
function mergeRecord(base: Readonly<Record<string, unknown>>, patch: Readonly<Record<string, unknown>> | undefined): Readonly<Record<string, unknown>> {
  return patch === undefined ? base : { ...base, ...patch };
}

// Shadow delivery can arrive out of order or twice, so a patch may only move
// the version forward.
function isStalePatch(applied: number | undefined, incoming: number | undefined): boolean {
  return applied !== undefined && incoming !== undefined && incoming <= applied;
}

// Freezes one opaque record at every depth. Freezing only the top level would
// leave a structured vendor value editable, and `notify` hands the snapshot to
// arbitrary listeners. Both records are parsed vendor JSON, so they are acyclic
// by construction and need no cycle tracking.
function freezeDeep(value: unknown): void {
  if (value === null || typeof value !== 'object') {
    return;
  }

  Object.freeze(value);

  for (const nested of Object.values(value)) {
    freezeDeep(nested);
  }
}

// Freezes the envelope and both opaque records, so a consumer cannot edit
// canonical safety state in place, however deeply it reaches.
function freeze(snapshot: DeviceSnapshot): DeviceSnapshot {
  Object.freeze(snapshot.identity);
  Object.freeze(snapshot.connectivity);
  freezeDeep(snapshot.data);
  freezeDeep(snapshot.metadata);

  return Object.freeze(snapshot);
}

// While the shadow owns telemetry the poll leaves `data` alone, because a
// vendor snapshot describing an earlier moment would otherwise revert a value
// the shadow already delivered. With no watermark held the poll is the source
// and its body replaces telemetry, which is the reconciliation backstop a
// shadow outage runs on (D-15, SYNC-03).
//
// The watermark comes off in two ways, and a reader who knows only the first
// will misread this function. The connection ending is one: the shadow is gone,
// so the poll takes over. A device whose messages have stopped for long enough
// that the monitoring-trust projection calls it silent, with its socket still
// open, is the other, and it is the ordinary one: the provider closes an
// established connection daily by design, while a device that has stopped
// speaking says nothing about its socket at all (D-13).
//
// Every field is copied out of the vendor record, so a later change to the
// vendor object cannot reach stored state.
function pollTelemetry(device: ApiDevice, previous: DeviceSnapshot | undefined): Readonly<Record<string, unknown>> {
  return previous?.shadowVersion === undefined ? { ...device.data } : previous.data;
}

// A poll always refreshes reachability, identity, and device time, because
// answering at all is what the poll is for, and it always records the receipt:
// a successful poll is a real observation about this device even when it adds
// no telemetry. The response carries no metadata and no shadow version, so a
// poll leaves both where the shadow last set them.
function toSnapshot(device: ApiDevice, previous: DeviceSnapshot | undefined, receivedAt: number): DeviceSnapshot {
  const identity: DeviceIdentity = {
    deviceId: device.deviceId,
    deviceTypeId: device.deviceTypeId,
    name: device.name,
    serialNumber: device.serialNumber,
  };

  return freeze({
    identity,
    connectivity: { ...device.connectivity },
    data: pollTelemetry(device, previous),
    metadata: previous === undefined ? {} : previous.metadata,
    shadowVersion: previous?.shadowVersion,
    deviceTimestamp: device.connectivity.timestamp,
    receivedAt,
  });
}

// An empty telemetry object has no reading. It cannot claim ownership or
// restamp receipt time, but a reported metadata section still observes the device.
function hasTelemetryReading(patch: ReportedPatch): boolean {
  return patch.data !== undefined && Object.keys(patch.data).length > 0;
}

// A document with neither a telemetry reading nor a reported metadata section
// observed nothing. The vendor also publishes documents for desired-only writes.
function carriesObservation(patch: ReportedPatch): boolean {
  return hasTelemetryReading(patch) || patch.state !== undefined;
}

// A silence fence on one device. A device with no entry in the fence map is not
// fenced. A fence with no `version` was set while the device held no shadow
// version, so it refuses only versionless telemetry; a fence with a `version`
// also refuses any patch at or below that version.
interface SilenceFence {
  version?: number;
}

// While a silence fence holds, the store refuses a patch at or below the
// fenced version, and a versionless patch that carries a telemetry reading. A
// versionless patch that carries only metadata still applies.
function isFencedOut(fence: SilenceFence | undefined, patch: ReportedPatch): boolean {
  if (fence === undefined) {
    return false;
  }

  if (patch.version === undefined) {
    return hasTelemetryReading(patch);
  }

  return fence.version !== undefined && patch.version <= fence.version;
}

// A watermark is ordering information, so a document that observed nothing is
// still evidence about ordering and may advance one that already exists. It may
// never establish one: a defined watermark says the shadow owns telemetry, so a
// document carrying no observation would take ownership from the poll on the
// strength of having seen nothing, freezing telemetry at whatever the poll last
// wrote (SYNC-02, D-014).
//
// The section ownership governs is telemetry, so this checks for a reading
// rather than using the wider observation test. The data section can be
// missing, invalid, or empty. `toReportedPatch` drops invalid sections.
//
// Nothing upstream refuses an invalid data section. Validation above checks only
// two levels -- the payload is an object and its `state` is an object -- and
// says nothing about `reported` or the sections under it, so a truncated or
// corrupt telemetry section parses, validates, and arrives here with the
// telemetry half empty.
//
// Either way the document delivered no reading, so it may order but may not
// own. Reading the wider test here lets such a document take the readings from
// the poll while the same message keeps the silence rule quiet, leaving nothing
// to hand them back (CR-03).
function nextShadowVersion(previous: DeviceSnapshot, patch: ReportedPatch): number | undefined {
  if (!hasTelemetryReading(patch) && previous.shadowVersion === undefined) {
    return undefined;
  }

  return patch.version ?? previous.shadowVersion;
}

// The patch reports no device time, so `deviceTimestamp` stays where the last
// REST response set it. `receivedAt` moves only when the patch carried an
// observation: it is the snapshot's only freshness field, and a document that
// observed nothing restamping it makes a device that has gone quiet read as
// freshly reporting (SC-3, D-014).
function nextSnapshot(previous: DeviceSnapshot, patch: ReportedPatch, receivedAt: number): DeviceSnapshot {
  const observed = carriesObservation(patch);

  return freeze({
    identity: previous.identity,
    connectivity: previous.connectivity,
    data: mergeRecord(previous.data, patch.data),
    metadata: mergeRecord(previous.metadata, patch.state),
    shadowVersion: nextShadowVersion(previous, patch),
    deviceTimestamp: previous.deviceTimestamp,
    receivedAt: observed ? receivedAt : previous.receivedAt,
  });
}

// Reference identity is the fast path for the scalar fields that dominate. A
// structured value falls through to a comparison by shape, because every poll
// re-parses the vendor body into fresh objects, so identity alone would report
// such a value as changed on every poll even when nothing moved (WR-07).
function isSameValue(previous: unknown, next: unknown): boolean {
  return Object.is(previous, next) || isDeepStrictEqual(previous, next);
}

// Compares the merged telemetry record key by key. This reports which keys
// moved and does not judge which of them matter, because the store decodes no
// telemetry field and holds no family knowledge: relevance is the accessory
// tier's to decide, downstream of here (D-19, D-20).
//
// Teaching a family adapter's notion of relevance to this function would be a
// safety regression. The changed-key list is the only clue a listener has that
// a pump value moved, so filtering a pump key would hide its activation from
// HomeKit (SAFE-03, SAFE-07).
function changedKeys(previous: Readonly<Record<string, unknown>>, next: Readonly<Record<string, unknown>>): readonly string[] {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);

  return [...keys].filter((key) => !isSameValue(previous[key], next[key])).sort((a, b) => a.localeCompare(b));
}

// One listener's failure is contained: the others still run and the reducer
// still returns. The report names no listener and repeats no state, because a
// listener's own message can carry both.
function notify(
  listeners: ReadonlySet<DeviceSnapshotListener>,
  log: Logging,
  next: DeviceSnapshot,
  previous: DeviceSnapshot | undefined,
  telemetryObserved = false,
): void {
  const changed = changedKeys(previous === undefined ? {} : previous.data, next.data);

  if (changed.length === 0 && !telemetryObserved) {
    return;
  }

  for (const listener of listeners) {
    try {
      listener(next, previous, changed);
    } catch {
      log.debug('A device snapshot listener failed.');
    }
  }
}

/**
 * Creates the canonical device state store.
 *
 * Creating the store touches nothing outside itself: no socket, no file, no
 * timer. Local receipt time comes from the injected clock and stays separate
 * from the device's own timestamp.
 */
export function createDeviceStateStore(options: DeviceStateStoreOptions): DeviceStateStore {
  const snapshots = new Map<string, DeviceSnapshot>();
  const listeners = new Map<string, Set<DeviceSnapshotListener>>();
  const silenceFences = new Map<string, SilenceFence>();

  return {
    snapshot(deviceId: string): DeviceSnapshot | undefined {
      return snapshots.get(deviceId);
    },

    deviceIds(): readonly string[] {
      return [...snapshots.keys()];
    },

    applyDiscovery(device: ApiDevice): DeviceSnapshot {
      const previous = snapshots.get(device.deviceId);
      const snapshot = toSnapshot(device, previous, options.clock.now());
      snapshots.set(device.deviceId, snapshot);
      notify(listeners.get(device.deviceId) ?? NO_LISTENERS, options.log, snapshot, previous);

      return snapshot;
    },

    applyReportedPatch(deviceId: string, patch: ReportedPatch): DeviceSnapshot | undefined {
      const previous = snapshots.get(deviceId);

      if (previous === undefined || isFencedOut(silenceFences.get(deviceId), patch) || isStalePatch(previous.shadowVersion, patch.version)) {
        return previous;
      }

      const snapshot = nextSnapshot(previous, patch, options.clock.now());
      snapshots.set(deviceId, snapshot);
      if (silenceFences.has(deviceId) && patch.version !== undefined) {
        if (snapshot.shadowVersion === undefined) {
          silenceFences.set(deviceId, { version: patch.version });
        } else {
          silenceFences.delete(deviceId);
        }
      }

      notify(listeners.get(deviceId) ?? NO_LISTENERS, options.log, snapshot, previous, hasTelemetryReading(patch));

      return snapshot;
    },

    remove(deviceId: string): void {
      // With no previous snapshot, rediscovery takes the new-device branch of
      // toSnapshot and starts a fresh observation epoch (D-020).
      snapshots.delete(deviceId);
      listeners.delete(deviceId);
      silenceFences.delete(deviceId);
    },

    // Hands one device's telemetry back to the poll by clearing its ownership
    // watermark. Nobody is notified: clearing the watermark moves no telemetry
    // key, and a listener filtering on the change report would be handed a
    // change that did not happen. A `deviceId` the store does not hold changes
    // nothing.
    //
    // The release is per device, so a caller handing back a whole fleet loops.
    // That keeps a fact about one controller from being spent on its
    // neighbours: a healthy pump released alongside a silent one would have
    // every poll overwrite the fresher readings its own live path just
    // delivered.
    //
    // Two conditions call for it. A connection that ended is one, and that one
    // is genuinely fleet-wide, because the connection carried every device. A
    // device the monitoring-trust projection reports silent, with its socket
    // still open, is the other, and it is the one an owner meets: silence is not
    // a disconnection, it belongs to one controller, and a poll that cannot
    // refresh that controller's telemetry leaves a flooding pit unreported
    // (D-13). It therefore runs on every poll of a silence that can last hours,
    // so it is written to cost nothing.
    //
    // A disconnect also clears the version fence, so a reconnect's complete
    // shadow can start a new stream (SYNC-03). A still-open silent connection
    // keeps its last accepted version, so only newer telemetry can take
    // ownership back from REST. Repeated silent polls keep that fence;
    // disconnect and removal start a fresh version epoch.
    releaseShadowSource(deviceId: string, reason: 'silence' | 'disconnect'): void {
      const snapshot = snapshots.get(deviceId);

      if (reason === 'disconnect') {
        silenceFences.delete(deviceId);
      }

      if (snapshot !== undefined) {
        if (reason === 'silence' && !silenceFences.has(deviceId)) {
          silenceFences.set(deviceId, snapshot.shadowVersion === undefined ? {} : { version: snapshot.shadowVersion });
        }

        snapshots.set(deviceId, freeze({ ...snapshot, shadowVersion: undefined }));
      }
    },

    subscribe(deviceId: string, listener: DeviceSnapshotListener): () => void {
      const registered = listeners.get(deviceId) ?? new Set<DeviceSnapshotListener>();
      registered.add(listener);
      listeners.set(deviceId, registered);

      return () => {
        registered.delete(listener);
      };
    },
  };
}
