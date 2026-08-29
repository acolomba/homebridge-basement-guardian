// This module is parked in the `.fallowrc.json` `ignoreFindings` list because
// no production code reaches it yet. The entry and this note are removed
// together, in the commit that wires this client into the account runtime and
// makes it reachable from the plugin entry point. Until then the whole
// transport subgraph beneath it -- the transport port, the signer, and the retry
// policy -- is reached only by its own tests.
//
// Nothing here logs a topic, a device identifier, a URL, or a payload. The
// signed URL carries the credential scope, the session token, and the
// signature, and the device identifier embeds the account identifier (AUTH-02).

import type { MqttConnect, MqttTransport, MqttTransportOptions } from './mqttTransport.js';
import type { ReportedPatch } from '../device/state.js';
import type { Clock } from '../runtime/clock.js';
import type { Logging } from 'homebridge';

/**
 * The complete shadow topic surface this plugin uses.
 *
 * There is deliberately no delta helper and no update-publish helper. A delta
 * message carries requested state, which canonical safety state ignores
 * entirely, and the plugin never writes the shadow: device commands travel over
 * the vendor REST command route (SYNC-02).
 */
export const SHADOW_TOPICS = {
  get: (deviceId: string): string => `$aws/things/${deviceId}/shadow/get`,
  getAccepted: (deviceId: string): string => `$aws/things/${deviceId}/shadow/get/accepted`,
  getRejected: (deviceId: string): string => `$aws/things/${deviceId}/shadow/get/rejected`,
  updateAccepted: (deviceId: string): string => `$aws/things/${deviceId}/shadow/update/accepted`,
} as const;

/** One handshake's worth of connection facts, as the vendor issues them. */
export interface ShadowCredentials {
  endpoint: string;
  /** A fresh identifier with every credential response; two connections may not share one. */
  clientId: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

/**
 * The credentials the next handshake will use.
 *
 * Rotation refreshes what this returns and leaves the live connection alone:
 * nothing re-signs an established socket, and the broker validates the
 * signature at the handshake only (SYNC-04).
 */
export interface CredentialCache {
  current(): ShadowCredentials;
}

/** Everything the shadow client needs, by injection. */
export interface ShadowClientOptions {
  /** The bundled protocol constant; the transport-level harness overrides it. */
  scheme: string;
  region: string;
  credentials: CredentialCache;
  clock: Clock;
  log: Logging;
  createTransport: (options: MqttTransportOptions) => MqttTransport;
  connect: MqttConnect;
  onReportedPatch: (deviceId: string, patch: ReportedPatch) => void;
}

/** One connection serving every device shadow on the account. */
export interface ShadowClient {
  start(deviceIds: readonly string[]): Promise<void>;
  requestFullShadow(deviceId: string): Promise<void>;
  close(): Promise<void>;
}

/**
 * Creates the shadow client.
 *
 * One connection serves every device shadow on the account. The credential
 * response carries a single endpoint, a single client identifier, and one
 * credential object, which is account-scoped in shape; nothing in the ingested
 * protocol record states this outright, and one connection is the cheaper
 * direction to be wrong in. This reading is a stated assumption, not a fact.
 */
export function createShadowClient(options: ShadowClientOptions): ShadowClient {
  void options;

  throw new Error('not implemented');
}
