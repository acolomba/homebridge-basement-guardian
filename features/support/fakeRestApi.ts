/**
 * @fileoverview Loopback stand-in for the vendor REST API.
 *
 * The service answers the four routes the plugin uses and records every request it received, so a
 * scenario can assert the authorization header and the command payload without knowing how the
 * request was sent.
 *
 * The wire shapes below mirror the vendor contract. They are declared here so the harness compiles
 * against the transport alone; once the shared wire-type module is reachable from this directory,
 * the harness reads the shapes from there instead of restating them.
 */

import { LOOPBACK_ADDRESS, readBody, respondJson, startLoopbackServer } from './loopbackServer.js';

import type { IncomingMessage, ServerResponse } from 'node:http';

const DEVICES_PATH = '/devices';
const CREDENTIALS_PATH = '/credentials/aws';
const COMMAND_SUFFIX = '/data';

/** Whether the vendor last saw the device, and when. */
export interface ApiConnectivity {
  connected: boolean;
  timestamp: number;
}

/** One device as the vendor device routes report it. */
export interface ApiDevice {
  deviceId: string;
  deviceTypeId: string;
  name: string;
  serialNumber: string;
  connectivity: ApiConnectivity;
  data: Readonly<Record<string, unknown>>;
}

/** The temporary security-token credentials the vendor hands out for the shadow connection. */
export interface AwsCredentials {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
  Expiration: string;
}

/** The credentials route's response: where to connect, as whom, and with which credentials. */
export interface AwsCredentialsResponse {
  endpoint: string;
  clientId: string;
  credentials: AwsCredentials;
}

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

  /** Sets the response the temporary-credentials route answers with. */
  setAwsCredentials(response: AwsCredentialsResponse): void;

  /** Arms exactly one subsequent request to fail with this status. */
  failNextWith(status: number): void;

  /** Stops the service and resolves once every open connection is destroyed. */
  close(): Promise<void>;
}

interface ServiceState {
  readonly requests: FakeRestRequest[];
  devices: readonly ApiDevice[];
  credentials: AwsCredentialsResponse;
  armedStatus: number | undefined;
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

  respondJson(response, 200, device);
}

function answer(state: ServiceState, method: string, pathname: string, response: ServerResponse): void {
  if (method === 'GET' && pathname === DEVICES_PATH) {
    respondJson(response, 200, state.devices);

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
  const state: ServiceState = { requests: [], devices: [], credentials: DEFAULT_CREDENTIALS, armedStatus: undefined };
  const server = await startLoopbackServer((request, response) => route(state, request, response));

  return {
    baseUrl: server.baseUrl,
    requests: state.requests,
    setDevices(devices: readonly ApiDevice[]): void {
      state.devices = devices;
    },
    setAwsCredentials(response: AwsCredentialsResponse): void {
      state.credentials = response;
    },
    failNextWith(status: number): void {
      state.armedStatus = status;
    },
    close(): Promise<void> {
      return server.close();
    },
  };
}
