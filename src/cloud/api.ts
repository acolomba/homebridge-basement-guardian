// SPDX-License-Identifier: MIT
import { PLUGIN_USER_AGENT } from '../settings.js';

import { CloudRequestError } from './errors.js';
import { isAwsCredentialsResponse, isCommandResult, isWireDeviceListResponse, isWireDeviceResponse, toApiDevice } from './types.js';

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

// A body that did not parse and a body of the wrong shape are the same answer,
// so they get the same fixed message: one that names the route and carries
// nothing the vendor sent (T-01-87).
function unreadable(route: string, status: number): CloudRequestError {
  return new CloudRequestError(`${route} returned a response the plugin cannot read.`, status, route);
}

// A success status is no promise of JSON: a gateway in front of the vendor can
// answer one with an error page. The parse failure is replaced here rather than
// allowed to escape, both because its own message quotes the first bytes of
// that page and because a caller branching on the vendor error class would
// otherwise fall through on it (WR-02).
async function readBody(response: Response, route: string): Promise<unknown> {
  try {
    const body: unknown = await response.json();

    return body;
  } catch {
    throw unreadable(route, response.status);
  }
}

// The status and the shape are checked in one place, so no operation can return
// a body it did not verify. No failure carries a URL, a header value, or the
// body itself.
async function narrow<T>(call: VendorCall<T>, response: Response): Promise<T> {
  if (!response.ok) {
    throw new CloudRequestError(`${call.route} failed with HTTP ${String(response.status)}.`, response.status, call.route);
  }

  const body = await readBody(response, call.route);

  if (!call.accepts(body)) {
    throw unreadable(call.route, response.status);
  }

  return body;
}

// Every REST request identifies itself with the same header, whichever branch
// built it (REL-03, REL-04). Content-Type and Accept stay on the body-carrying
// branch alone, because only a command carries a JSON body to describe; adding
// either to the read branch would change every read request's wire shape as a
// side effect of a decision about content, not identity. None of these headers
// carries a credential, an account identifier, a device identifier, a
// hostname, an operating-system detail, or a bridge name, and none presents
// the plugin as the official vendor application (AUTH-02).
//
// The Auth0 token exchange and the AWS IoT MQTT WebSocket handshake carry the
// same identity header from their own call sites.
function requestInit(method: string, body: string | undefined, authorization: string, deadline: AbortSignal): RequestInit {
  if (body === undefined) {
    return { method, headers: { Authorization: authorization, 'User-Agent': PLUGIN_USER_AGENT }, signal: deadline };
  }

  const headers = { Authorization: authorization, 'Content-Type': JSON_CONTENT_TYPE, 'User-Agent': PLUGIN_USER_AGENT, Accept: JSON_CONTENT_TYPE };

  return { method, headers, body, signal: deadline };
}

// Every request carries the bearer token and two deadlines: the caller's root
// signal and its own, so a shutdown and a slow vendor share one cancellation.
//
// The deadline is built before the token is fetched and governs that fetch too,
// so the stated deadline covers the whole operation rather than starting after
// an authentication the caller never asked for (WR-03). This deliberately makes
// a lapsed token abort a short operation instead of silently extending it,
// which is the behaviour D-038 describes. The operation is still attempted
// exactly once: a command that timed out may still have reached the device.
async function send<T>(options: CloudApiOptions, call: VendorCall<T>, signal: AbortSignal): Promise<T> {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(call.deadlineMs)]);
  const idToken = await options.auth.idToken(deadline);
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

      return send(options, { ...call, accepts: isWireDeviceListResponse }, signal).then((body) => body.devices.map((device) => toApiDevice(device)));
    },
    device(deviceId: string, signal: AbortSignal): Promise<ApiDevice> {
      const call = { route: ROUTES.device, path: devicePath(deviceId, ''), method: 'GET', deadlineMs: options.requestTimeoutMs, body: undefined };

      return send(options, { ...call, accepts: isWireDeviceResponse }, signal).then((body) => toApiDevice(body.device));
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
