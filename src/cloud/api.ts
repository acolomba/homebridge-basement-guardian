import { CloudRequestError } from './errors.js';
import { isApiDeviceList } from './types.js';

import type { AuthClient } from './auth.js';
import type { ApiDevice } from './types.js';

const DEVICES_PATH = '/devices';
const DEVICES_ROUTE = 'GET /devices';

/** Everything the REST client needs, by injection. */
export interface CloudApiOptions {
  baseUrl: string;
  auth: AuthClient;
  requestTimeoutMs: number;
}

/** The vendor REST routes the plugin uses. */
export interface CloudApi {
  devices(signal: AbortSignal): Promise<readonly ApiDevice[]>;
}

interface VendorResponse {
  status: number;
  body: unknown;
}

// Every request carries the bearer token and two deadlines: the caller's root
// signal and its own timeout, so a shutdown and a slow vendor both cancel it.
async function request(options: CloudApiOptions, path: string, route: string, signal: AbortSignal): Promise<VendorResponse> {
  const idToken = await options.auth.idToken(signal);
  const response = await fetch(new URL(path, options.baseUrl), {
    headers: { Authorization: `Bearer ${idToken}` },
    signal: AbortSignal.any([signal, AbortSignal.timeout(options.requestTimeoutMs)]),
  });

  if (!response.ok) {
    throw new CloudRequestError(`${route} failed with HTTP ${String(response.status)}.`, response.status, route);
  }

  const body: unknown = await response.json();

  return { status: response.status, body };
}

/**
 * Creates the vendor REST client.
 *
 * The client owns the base URL, the `Authorization` header, per-request
 * deadlines, and route labelling. Every response is narrowed before it is
 * returned, so a malformed payload never becomes device state (T-01-06).
 */
export function createCloudApi(options: CloudApiOptions): CloudApi {
  return {
    async devices(signal: AbortSignal): Promise<readonly ApiDevice[]> {
      const { status, body } = await request(options, DEVICES_PATH, DEVICES_ROUTE, signal);

      if (!isApiDeviceList(body)) {
        throw new CloudRequestError(`${DEVICES_ROUTE} returned a response the plugin cannot read.`, status, DEVICES_ROUTE);
      }

      return body;
    },
  };
}
