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

/**
 * The temporary security-token credentials the vendor issues for the shadow
 * connection.
 *
 * The capitalized names are the vendor's own, kept as they arrive so the record
 * maps onto the connection without a translation layer. Every value is a
 * credential and none of them may be logged or stored (AUTH-02).
 */
export interface AwsCredentials {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
  /** An ISO-8601 timestamp; the credentials last about an hour. */
  Expiration: string;
}

/** The credentials route's answer: where to connect, as whom, and with what. */
export interface AwsCredentialsResponse {
  endpoint: string;
  /** A fresh client identifier, different in every credential response. */
  clientId: string;
  credentials: AwsCredentials;
}

/** A family-specific device command, carried to the vendor unchanged. */
export interface DeviceCommand {
  desiredData: Readonly<Record<string, unknown>>;
}

/** The command route's answer: whether the vendor accepted the command. */
export interface CommandResult {
  success: boolean;
}

const DEVICE_STRING_FIELDS = ['deviceId', 'deviceTypeId', 'name', 'serialNumber'];
const CREDENTIAL_STRING_FIELDS = ['AccessKeyId', 'SecretAccessKey', 'SessionToken', 'Expiration'];
const CREDENTIALS_RESPONSE_STRING_FIELDS = ['endpoint', 'clientId'];

/** Narrows an unknown JSON value to a plain object with string keys. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  // `typeof null` is `'object'` and so is an array, so both are excluded before
  // any field is read.
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// A missing field and a field of the wrong type are the same answer here: the
// record cannot be read.
function hasStringFields(value: Record<string, unknown>, names: readonly string[]): boolean {
  return names.every((name) => typeof value[name] === 'string');
}

function isApiConnectivity(value: unknown): value is ApiConnectivity {
  return isRecord(value) && typeof value.connected === 'boolean' && typeof value.timestamp === 'number';
}

function isAwsCredentials(value: unknown): value is AwsCredentials {
  return isRecord(value) && hasStringFields(value, CREDENTIAL_STRING_FIELDS);
}

/** Narrows an unknown JSON value to one vendor device record. */
export function isApiDevice(value: unknown): value is ApiDevice {
  return isRecord(value) && hasStringFields(value, DEVICE_STRING_FIELDS) && isApiConnectivity(value.connectivity) && isRecord(value.data);
}

/** Narrows an unknown JSON value to a list of vendor device records. */
export function isApiDeviceList(value: unknown): value is ApiDevice[] {
  return isUnknownArray(value) && value.every((device) => isApiDevice(device));
}

/** Narrows an unknown JSON value to the vendor's temporary-credentials answer. */
export function isAwsCredentialsResponse(value: unknown): value is AwsCredentialsResponse {
  return isRecord(value) && hasStringFields(value, CREDENTIALS_RESPONSE_STRING_FIELDS) && isAwsCredentials(value.credentials);
}

/** Narrows an unknown JSON value to the vendor's answer to a device command. */
export function isCommandResult(value: unknown): value is CommandResult {
  return isRecord(value) && typeof value.success === 'boolean';
}
