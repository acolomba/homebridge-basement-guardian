import type { ApiConnectivity, ApiDevice } from '../cloud/types.js';
import type { Clock } from '../runtime/clock.js';

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

/** Everything the store needs, by injection. */
export interface DeviceStateStoreOptions {
  clock: Clock;
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
}

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

// The patch reports no device time, so `deviceTimestamp` stays where the last
// REST response set it while `receivedAt` records this arrival.
function nextSnapshot(previous: DeviceSnapshot, patch: ReportedPatch, receivedAt: number): DeviceSnapshot {
  return freeze({
    identity: previous.identity,
    connectivity: previous.connectivity,
    data: mergeRecord(previous.data, patch.data),
    metadata: mergeRecord(previous.metadata, patch.state),
    shadowVersion: patch.version ?? previous.shadowVersion,
    deviceTimestamp: previous.deviceTimestamp,
    receivedAt,
  });
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

  return {
    snapshot(deviceId: string): DeviceSnapshot | undefined {
      return snapshots.get(deviceId);
    },

    deviceIds(): readonly string[] {
      return [...snapshots.keys()];
    },

    applyDiscovery(device: ApiDevice): DeviceSnapshot {
      const snapshot = toSnapshot(device, snapshots.get(device.deviceId), options.clock.now());
      snapshots.set(device.deviceId, snapshot);

      return snapshot;
    },

    applyReportedPatch(deviceId: string, patch: ReportedPatch): DeviceSnapshot | undefined {
      const previous = snapshots.get(deviceId);

      if (previous === undefined || isStalePatch(previous.shadowVersion, patch.version)) {
        return previous;
      }

      const snapshot = nextSnapshot(previous, patch, options.clock.now());
      snapshots.set(deviceId, snapshot);

      return snapshot;
    },
  };
}
