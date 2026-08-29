import type { ApiConnectivity, ApiDevice } from '../cloud/types.js';
import type { Clock } from '../runtime/clock.js';
import type { Logging } from 'homebridge';

/** The device facts that identify one physical system and never change. */
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
  /** The highest shadow version this snapshot has applied. */
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
  /** Reported telemetry. Absent when the message carries none. */
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
 * order, so a consumer filters on the list instead of comparing snapshots
 * again. Comparing again is where duplicate activation records come from
 * (D-19).
 */
export type DeviceSnapshotListener = (next: DeviceSnapshot, previous: DeviceSnapshot | undefined, changedKeys: readonly string[]) => void;

/** Everything the store needs, by injection. */
export interface DeviceStateStoreOptions {
  clock: Clock;
  log: Logging;
}

/** Holds one immutable snapshot per device. */
export interface DeviceStateStore {
  snapshot(deviceId: string): DeviceSnapshot | undefined;
  deviceIds(): readonly string[];
  applyDiscovery(device: ApiDevice): DeviceSnapshot;
  /**
   * Merges one reported patch into the stored snapshot.
   *
   * Reports nothing for a device REST discovery has not returned, because a
   * device enters the store through discovery alone.
   */
  applyReportedPatch(deviceId: string, patch: ReportedPatch): DeviceSnapshot | undefined;
  /**
   * Registers a listener for one device and returns its unsubscribe function.
   *
   * A change that leaves every telemetry value where it was notifies nobody,
   * which is what keeps a repeated heartbeat silent.
   */
  subscribe(deviceId: string, listener: DeviceSnapshotListener): () => void;
}

const NO_LISTENERS: ReadonlySet<DeviceSnapshotListener> = new Set();

// A heartbeat carries seven of the roughly twenty reported fields, so the merge
// runs key by key. Assigning a payload wholesale would blank pump, power,
// charging, test, and fault values every fifteen minutes.
function mergeRecord(base: Readonly<Record<string, unknown>>, patch: Readonly<Record<string, unknown>> | undefined): Readonly<Record<string, unknown>> {
  return patch === undefined ? base : { ...base, ...patch };
}

// Shadow delivery can arrive out of order or twice, so a patch may only move
// the version forward. A patch carrying no version is always applied.
function isStalePatch(applied: number | undefined, incoming: number | undefined): boolean {
  return applied !== undefined && incoming !== undefined && incoming <= applied;
}

// Freezes the envelope and both opaque records, so a consumer cannot edit
// canonical safety state in place.
function freeze(snapshot: DeviceSnapshot): DeviceSnapshot {
  Object.freeze(snapshot.identity);
  Object.freeze(snapshot.connectivity);
  Object.freeze(snapshot.data);
  Object.freeze(snapshot.metadata);

  return Object.freeze(snapshot);
}

// Copies every field out of the vendor record, so a later change to the vendor
// object cannot reach stored state. A REST response is a full telemetry
// snapshot and replaces `data`; it carries neither metadata nor a shadow
// version, so a poll leaves both where the shadow last set them.
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
    data: { ...device.data },
    metadata: previous === undefined ? {} : previous.metadata,
    shadowVersion: previous?.shadowVersion,
    deviceTimestamp: device.connectivity.timestamp,
    receivedAt,
  });
}

// Whether the message said anything about the device at all. A document with
// neither reported section observed nothing: the vendor publishes one on every
// command it delivers, as the accepted update for a desired-only write.
function carriesObservation(patch: ReportedPatch): boolean {
  return patch.data !== undefined || patch.state !== undefined;
}

// A watermark is ordering information, so a document that observed nothing is
// still evidence about ordering and may advance one that already exists. It may
// never establish one: a defined watermark says the shadow owns telemetry, so a
// document carrying no observation would take ownership from the poll on the
// strength of having seen nothing, freezing telemetry at whatever the poll last
// wrote (SYNC-02, D-014).
function nextShadowVersion(previous: DeviceSnapshot, patch: ReportedPatch, observed: boolean): number | undefined {
  if (!observed && previous.shadowVersion === undefined) {
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
    shadowVersion: nextShadowVersion(previous, patch, observed),
    deviceTimestamp: previous.deviceTimestamp,
    receivedAt: observed ? receivedAt : previous.receivedAt,
  });
}

// Shallow comparison of the merged telemetry record. Phase 1 reports which
// keys moved and does not judge which of them matter, because no family
// adapter exists yet to define relevance (D-19).
function changedKeys(previous: Readonly<Record<string, unknown>>, next: Readonly<Record<string, unknown>>): readonly string[] {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);

  return [...keys].filter((key) => !Object.is(previous[key], next[key])).sort();
}

// One listener's failure is contained: the others still run and the reducer
// still returns. The report names no listener and repeats no state, because a
// listener's own message can carry both.
function notify(listeners: ReadonlySet<DeviceSnapshotListener>, log: Logging, next: DeviceSnapshot, previous: DeviceSnapshot | undefined): void {
  const changed = changedKeys(previous === undefined ? {} : previous.data, next.data);

  if (changed.length === 0) {
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

      if (previous === undefined || isStalePatch(previous.shadowVersion, patch.version)) {
        return previous;
      }

      const snapshot = nextSnapshot(previous, patch, options.clock.now());
      snapshots.set(deviceId, snapshot);
      notify(listeners.get(deviceId) ?? NO_LISTENERS, options.log, snapshot, previous);

      return snapshot;
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
