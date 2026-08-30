/**
 * @fileoverview Loopback stand-in for the vendor REST API.
 *
 * The service answers the four routes the plugin uses and records every request it received, so a
 * scenario can assert the authorization header and the command payload without knowing how the
 * request was sent.
 *
 * The service emits the vendor's measured wire shape: the device routes answer an envelope and
 * carry the serial number under `attributes`. The plugin's own types describe only the normalized
 * result, so a scenario hands this service internal records and the serializer below turns each one
 * into the record the vendor would have sent.
 */

import { LOOPBACK_ADDRESS, readBody, respondJson, startLoopbackServer } from './loopbackServer.js';

import type { ApiDevice, AwsCredentialsResponse } from '../../src/cloud/types.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

export type { ApiDevice, AwsCredentialsResponse } from '../../src/cloud/types.js';

const DEVICES_PATH = '/devices';
const CREDENTIALS_PATH = '/credentials/aws';
const COMMAND_SUFFIX = '/data';

/** One request, in the shape the service received it. */
export interface FakeRestRequest {
  method: string;
  path: string;
  authorization: string | undefined;
  body: string;
}

/** A loopback vendor REST service that a scenario can arm and then inspect. */
export interface FakeRestApi {
  readonly baseUrl: string;
  readonly requests: readonly FakeRestRequest[];

  /** Sets the devices the discovery and device routes answer with. */
  setDevices(devices: readonly ApiDevice[]): void;

  /**
   * Arms the next `/devices` GET response with these devices.
   *
   * Queued answers apply in call order, one per request, before the service
   * falls back to the standing device list `setDevices` holds. This is what
   * lets a scenario script the out-of-band final-check fetch (DEV-05)
   * differently from the confirming poll that triggers it, without racing a
   * real HTTP round trip: both fetches happen back to back with no
   * scenario-controllable gap between them.
   */
  armDevicesAnswer(devices: readonly ApiDevice[]): void;

  /** Sets the response the temporary-credentials route answers with. */
  setAwsCredentials(response: AwsCredentialsResponse): void;

  /** Arms exactly one subsequent request to fail with this status. */
  failNextWith(status: number): void;

  /**
   * Records the next request and never answers it.
   *
   * A scenario uses this to hold a vendor call in flight while it shuts the plugin down. The held
   * response is destroyed with every other connection when the service closes.
   */
  holdNextRequest(): void;

  /** Stops the service and resolves once every open connection is destroyed. */
  close(): Promise<void>;
}

interface ServiceState {
  readonly requests: FakeRestRequest[];
  devices: readonly ApiDevice[];
  /** One-shot device-list answers, consumed in order before `devices`. */
  readonly queuedDeviceAnswers: (readonly ApiDevice[])[];
  credentials: AwsCredentialsResponse;
  armedStatus: number | undefined;
  holdNext: boolean;
}

const DEFAULT_CREDENTIALS: AwsCredentialsResponse = {
  endpoint: LOOPBACK_ADDRESS,
  clientId: 'fake-shadow-client-id',
  credentials: {
    AccessKeyId: 'fake-access-key-id',
    SecretAccessKey: 'fake-secret-access-key',
    SessionToken: 'fake-session-token',
    Expiration: '2000-01-01T00:00:00.000Z',
  },
};

// The vendor's own account identifier appears in every wire record. This service keeps one fixed
// placeholder while a scenario brings its own device identifiers, so the vendor's measured relation
// between deviceId, the account identifier, and the serial number does not hold here. Nothing in the
// plugin reads the account identifier or splits a deviceId today, so nothing depends on it; a future
// change that did depend on the relation would not be caught by this service.
const ACCOUNT_ID = 'fake-account-id';
const PRODUCT_LINE = 'wayneWater';

// One device as the vendor sends it: the serial number and the product line sit under `attributes`,
// never at the top level.
function wireDevice(device: ApiDevice): Record<string, unknown> {
  return {
    accountId: ACCOUNT_ID,
    deviceId: device.deviceId,
    deviceTypeId: device.deviceTypeId,
    name: device.name,
    data: device.data,
    attributes: { productLine: PRODUCT_LINE, serialNumber: device.serialNumber },
    connectivity: device.connectivity,
  };
}

// Answers the device identifier a device-scoped path names, or undefined when the path is not one.
function deviceIdIn(pathname: string, suffix: string): string | undefined {
  const prefix = `${DEVICES_PATH}/`;

  if (!pathname.startsWith(prefix) || !pathname.endsWith(suffix)) {
    return undefined;
  }

  const deviceId = pathname.slice(prefix.length, pathname.length - suffix.length);

  return deviceId === '' || deviceId.includes('/') ? undefined : deviceId;
}

function answerDevice(state: ServiceState, deviceId: string, response: ServerResponse): void {
  const device = state.devices.find((candidate) => candidate.deviceId === deviceId);

  if (device === undefined) {
    respondJson(response, 404, { error: 'device_not_found' });

    return;
  }

  respondJson(response, 200, { device: wireDevice(device) });
}

function answer(state: ServiceState, method: string, pathname: string, response: ServerResponse): void {
  if (method === 'GET' && pathname === DEVICES_PATH) {
    const queued = state.queuedDeviceAnswers.shift();
    const devices = queued ?? state.devices;
    respondJson(response, 200, { devices: devices.map((device) => wireDevice(device)) });

    return;
  }

  if (method === 'GET' && pathname === CREDENTIALS_PATH) {
    respondJson(response, 200, state.credentials);

    return;
  }

  if (method === 'PUT' && deviceIdIn(pathname, COMMAND_SUFFIX) !== undefined) {
    respondJson(response, 200, { success: true });

    return;
  }

  const deviceId = method === 'GET' ? deviceIdIn(pathname, '') : undefined;

  if (deviceId !== undefined) {
    answerDevice(state, deviceId, response);

    return;
  }

  // An excluded route answers the vendor's unauthenticated status, so a scenario that reaches one
  // by accident fails visibly instead of reading as a missing resource.
  respondJson(response, 403, { error: 'token_missing' });
}

async function route(state: ServiceState, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const path = request.url ?? '';
  const method = request.method ?? '';

  state.requests.push({ method, path, authorization: request.headers.authorization, body: await readBody(request) });

  if (state.holdNext) {
    state.holdNext = false;

    return;
  }

  const armedStatus = state.armedStatus;
  state.armedStatus = undefined;

  if (armedStatus !== undefined) {
    respondJson(response, armedStatus, { error: 'request_failed' });

    return;
  }

  answer(state, method, new URL(path, `http://${LOOPBACK_ADDRESS}`).pathname, response);
}

/**
 * Starts a fake vendor REST service on an ephemeral loopback port.
 *
 * The promise resolves only once the port is known, so a caller can read `baseUrl` immediately.
 */
export async function createFakeRestApi(): Promise<FakeRestApi> {
  const state: ServiceState = {
    requests: [],
    devices: [],
    queuedDeviceAnswers: [],
    credentials: DEFAULT_CREDENTIALS,
    armedStatus: undefined,
    holdNext: false,
  };
  const server = await startLoopbackServer((request, response) => route(state, request, response));

  return {
    baseUrl: server.baseUrl,
    requests: state.requests,
    setDevices(devices: readonly ApiDevice[]): void {
      state.devices = devices;
    },
    armDevicesAnswer(devices: readonly ApiDevice[]): void {
      state.queuedDeviceAnswers.push(devices);
    },
    setAwsCredentials(response: AwsCredentialsResponse): void {
      state.credentials = response;
    },
    failNextWith(status: number): void {
      state.armedStatus = status;
    },
    holdNextRequest(): void {
      state.holdNext = true;
    },
    close(): Promise<void> {
      return server.close();
    },
  };
}
