import { CloudRequestError } from './errors.js';
import { isApiDevice, isApiDeviceList, isAwsCredentialsResponse, isCommandResult } from './types.js';

import type { AuthClient } from './auth.js';
import type { ApiDevice, AwsCredentialsResponse, CommandResult, DeviceCommand } from './types.js';

/**
 * How long a command may wait for the vendor to accept it.
 *
 * A HomeKit control request that outlives this deadline reports a timeout and is
 * never retried automatically, because the command may already have been
 * delivered (D-038).
 */
export const COMMAND_DEADLINE_MS = 2_500;

/**
 * The complete set of vendor routes this version reaches, by operation.
 *
 * The vendor also publishes account, device-management, firmware, location,
 * rule, and contact routes. None of them is reachable from here, and a unit test
 * asserts this exact value set, so a fifth route cannot appear without the
 * recorded coverage decision being revisited (SYNC-01).
 *
 * A label is what a failure carries. The constructed URL never is: it holds the
 * base URL, and a device path holds the account identifier (AUTH-02).
 */
export const ROUTES = {
  devices: 'GET /devices',
  device: 'GET /devices/{deviceId}',
  command: 'PUT /devices/{deviceId}/data',
  awsCredentials: 'GET /credentials/aws',
} as const;

const DEVICES_PATH = '/devices';
const CREDENTIALS_PATH = '/credentials/aws';
const COMMAND_SUFFIX = '/data';
const JSON_CONTENT_TYPE = 'application/json';

/** Everything the REST client needs, by injection. */
export interface CloudApiOptions {
  baseUrl: string;
  auth: AuthClient;
  requestTimeoutMs: number;
}

/** The vendor REST routes the plugin uses. */
export interface CloudApi {
  devices(signal: AbortSignal): Promise<readonly ApiDevice[]>;
  device(deviceId: string, signal: AbortSignal): Promise<ApiDevice>;
  awsCredentials(signal: AbortSignal): Promise<AwsCredentialsResponse>;
  sendCommand(deviceId: string, command: DeviceCommand, signal: AbortSignal): Promise<CommandResult>;
}

// One vendor call: where it goes, how long it may take, and the shape its answer
// must have before it leaves this module.
interface VendorCall<T> {
  route: string;
  path: string;
  method: string;
  deadlineMs: number;
  body: string | undefined;
  accepts: (value: unknown) => value is T;
}

// The identifier is opaque and is never split, parsed, or logged. Encoding it
// keeps a character it may contain from reshaping the path (T-01-31).
function devicePath(deviceId: string, suffix: string): string {
  return `${DEVICES_PATH}/${encodeURIComponent(deviceId)}${suffix}`;
}

// The status and the shape are checked in one place, so no operation can return
// a body it did not verify. Neither failure carries a URL, a header value, or
// the body itself.
async function narrow<T>(call: VendorCall<T>, response: Response): Promise<T> {
  if (!response.ok) {
    throw new CloudRequestError(`${call.route} failed with HTTP ${String(response.status)}.`, response.status, call.route);
  }

  const body: unknown = await response.json();

  if (!call.accepts(body)) {
    throw new CloudRequestError(`${call.route} returned a response the plugin cannot read.`, response.status, call.route);
  }

  return body;
}

// A read carries no body and so declares no content type; a command declares
// one, because the vendor reads its command bodies as JSON.
function requestInit(method: string, body: string | undefined, authorization: string, deadline: AbortSignal): RequestInit {
  if (body === undefined) {
    return { method, headers: { Authorization: authorization }, signal: deadline };
  }

  return { method, headers: { Authorization: authorization, 'Content-Type': JSON_CONTENT_TYPE }, body, signal: deadline };
}

// Every request carries the bearer token and two deadlines: the caller's root
// signal and its own, so a shutdown and a slow vendor share one cancellation.
async function send<T>(options: CloudApiOptions, call: VendorCall<T>, signal: AbortSignal): Promise<T> {
  const idToken = await options.auth.idToken(signal);
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(call.deadlineMs)]);
  const response = await fetch(new URL(call.path, options.baseUrl), requestInit(call.method, call.body, `Bearer ${idToken}`, deadline));

  return narrow(call, response);
}

/**
 * Creates the vendor REST client.
 *
 * The client owns the base URL, the `Authorization` header, per-request
 * deadlines, and route labelling. Every response is narrowed before it is
 * returned, so a malformed payload never becomes device state (T-01-06).
 *
 * A command performs exactly one attempt. It is never retried here, because a
 * command that timed out may still have reached the device (D-038).
 */
export function createCloudApi(options: CloudApiOptions): CloudApi {
  return {
    devices(signal: AbortSignal): Promise<ApiDevice[]> {
      const call = { route: ROUTES.devices, path: DEVICES_PATH, method: 'GET', deadlineMs: options.requestTimeoutMs, body: undefined };

      return send(options, { ...call, accepts: isApiDeviceList }, signal);
    },
    device(deviceId: string, signal: AbortSignal): Promise<ApiDevice> {
      const call = { route: ROUTES.device, path: devicePath(deviceId, ''), method: 'GET', deadlineMs: options.requestTimeoutMs, body: undefined };

      return send(options, { ...call, accepts: isApiDevice }, signal);
    },
    awsCredentials(signal: AbortSignal): Promise<AwsCredentialsResponse> {
      const call = { route: ROUTES.awsCredentials, path: CREDENTIALS_PATH, method: 'GET', deadlineMs: options.requestTimeoutMs, body: undefined };

      return send(options, { ...call, accepts: isAwsCredentialsResponse }, signal);
    },
    sendCommand(deviceId: string, command: DeviceCommand, signal: AbortSignal): Promise<CommandResult> {
      const call = {
        route: ROUTES.command,
        path: devicePath(deviceId, COMMAND_SUFFIX),
        method: 'PUT',
        deadlineMs: COMMAND_DEADLINE_MS,
        body: JSON.stringify({ desiredData: command.desiredData }),
      };

      return send(options, { ...call, accepts: isCommandResult }, signal);
    },
  };
}
