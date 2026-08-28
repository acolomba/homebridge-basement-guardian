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
 * The envelope is typed; `data` is not. Nothing here decodes a telemetry field,
 * so an unknown or invalid vendor value cannot become a guessed measurement
 * (D-20, D-014).
 */
export interface DeviceSnapshot {
  identity: DeviceIdentity;
  connectivity: ApiConnectivity;
  data: Readonly<Record<string, unknown>>;
  /** Device time, as the device reported it. */
  deviceTimestamp: number | undefined;
  /** Local time the plugin received this state. Never mixed with device time. */
  receivedAt: number;
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
}

// Copies every field out of the vendor record, so a later change to the vendor
// object cannot reach stored state, and freezes the result.
function toSnapshot(device: ApiDevice, receivedAt: number): DeviceSnapshot {
  const identity: DeviceIdentity = {
    deviceId: device.deviceId,
    deviceTypeId: device.deviceTypeId,
    name: device.name,
    serialNumber: device.serialNumber,
  };

  return Object.freeze({
    identity: Object.freeze(identity),
    connectivity: Object.freeze({ ...device.connectivity }),
    data: Object.freeze({ ...device.data }),
    deviceTimestamp: device.connectivity.timestamp,
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
      const snapshot = toSnapshot(device, options.clock.now());
      snapshots.set(device.deviceId, snapshot);

      return snapshot;
    },
  };
}
