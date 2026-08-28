// The vendor answers with untrusted, untyped JSON. Every response is typed
// `unknown` and narrowed by a hand-written predicate: assertion syntax is banned
// and a malformed payload must be rejected rather than admitted to the store
// (T-01-06, D-014).

/** Whether the vendor believes the device is reachable, and when it last said so. */
export interface ApiConnectivity {
  connected: boolean;
  /** Device time, in Unix milliseconds. Not a local receipt time. */
  timestamp: number;
}

/** One device record as the vendor REST API returns it. */
export interface ApiDevice {
  deviceId: string;
  deviceTypeId: string;
  name: string;
  serialNumber: string;
  connectivity: ApiConnectivity;
  /**
   * Device telemetry, carried opaquely. No field is decoded or interpreted
   * here; a family adapter owns that (D-20).
   */
  data: Readonly<Record<string, unknown>>;
}

/** Narrows an unknown JSON value to a plain object with string keys. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isApiConnectivity(value: unknown): value is ApiConnectivity {
  return isRecord(value) && typeof value.connected === 'boolean' && typeof value.timestamp === 'number';
}

/** Narrows an unknown JSON value to one vendor device record. */
export function isApiDevice(value: unknown): value is ApiDevice {
  return (
    isRecord(value) &&
    typeof value.deviceId === 'string' &&
    typeof value.deviceTypeId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.serialNumber === 'string' &&
    isApiConnectivity(value.connectivity) &&
    isRecord(value.data)
  );
}

/** Narrows an unknown JSON value to a list of vendor device records. */
export function isApiDeviceList(value: unknown): value is ApiDevice[] {
  return isUnknownArray(value) && value.every((device) => isApiDevice(device));
}
