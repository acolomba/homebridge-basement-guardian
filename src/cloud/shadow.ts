// Nothing here logs a topic, a device identifier, a URL, or a payload. The
// signed URL carries the credential scope, the session token, and the
// signature, and the device identifier embeds the account identifier (AUTH-02).

import { presignIotWebsocketUrl } from './sigv4.js';
import { isRecord } from './types.js';

import type { MqttClientIdentity, MqttConnect, MqttTransport, MqttTransportOptions } from './mqttTransport.js';
import type { ReportedPatch } from '../device/state.js';
import type { Clock } from '../runtime/clock.js';
import type { RetryPolicy } from '../runtime/retryPolicy.js';
import type { Logging } from 'homebridge';

const BROKER_PATH = '/mqtt';

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

/**
 * Why a shadow connection ended.
 *
 * `transport-closed` is routine: the provider closes an established connection
 * at a ceiling it publishes no knob for, so at least one reconnect a day is
 * expected operation. The other three say the plugin is seeing less than it
 * should, and the consumer that watches the whole failure stream decides how
 * loudly to say so (D-14, D-15).
 */
export type ShadowDisconnectReason = 'transport-closed' | 'transport-error' | 'subscription-refused' | 'handshake-refused';

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
  /** Owns reconnect timing, capped and guarded against duplicate chains. */
  retry: RetryPolicy;
  createTransport: (options: MqttTransportOptions) => MqttTransport;
  connect: MqttConnect;
  onReportedPatch: (deviceId: string, patch: ReportedPatch) => void;
  onConnected: () => void;
  /** Receives a short classification, never a URL and never credential material. */
  onDisconnected: (reason: ShadowDisconnectReason) => void;
}

/** One connection serving every device shadow on the account. */
export interface ShadowClient {
  readonly connected: boolean;
  start(deviceIds: readonly string[]): Promise<void>;
  requestFullShadow(deviceId: string): Promise<void>;
  close(): Promise<void>;
}

// A full shadow and a partial update take one path into the store, so the two
// accepted topics share a leaf. A rejection produces nothing at all.
interface ShadowRoute {
  deviceId: string;
  leaf: 'accepted' | 'rejected';
}

// The document the shadow service publishes. Only the state section is checked
// here; everything below it is narrowed where it is read.
interface ShadowDocument {
  state: Record<string, unknown>;
  version: unknown;
}

// The routing table and the subscription list are the same set, built once from
// the device list. Subscribing to a topic that cannot be routed, or routing one
// that was never subscribed to, is therefore not expressible.
function fillRoutes(routes: Map<string, ShadowRoute>, deviceIds: readonly string[]): void {
  routes.clear();

  for (const deviceId of deviceIds) {
    routes.set(SHADOW_TOPICS.getAccepted(deviceId), { deviceId, leaf: 'accepted' });
    routes.set(SHADOW_TOPICS.getRejected(deviceId), { deviceId, leaf: 'rejected' });
    routes.set(SHADOW_TOPICS.updateAccepted(deviceId), { deviceId, leaf: 'accepted' });
  }
}

function isShadowDocument(value: unknown): value is ShadowDocument {
  return isRecord(value) && isRecord(value.state);
}

// A payload that is not JSON and one whose shape is wrong are the same answer:
// the document cannot be read. Neither may raise out of a message handler,
// because an exception escaping one surfaces as an unhandled exception in the
// Homebridge process (D-20).
function readShadowDocument(payload: Buffer): ShadowDocument | undefined {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload.toString('utf8'));
  } catch {
    return undefined;
  }

  return isShadowDocument(parsed) ? parsed : undefined;
}

// The reported shadow carries telemetry under `reported.data` and device
// metadata under `reported.state`. A requested section is excluded
// structurally: the patch has no member able to hold it (SYNC-02).
function toReportedPatch(document: ShadowDocument): ReportedPatch {
  const reported = document.state.reported;
  const sections = isRecord(reported) ? reported : {};

  return {
    data: isRecord(sections.data) ? sections.data : undefined,
    state: isRecord(sections.state) ? sections.state : undefined,
    version: typeof document.version === 'number' ? document.version : undefined,
  };
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
  const routes = new Map<string, ShadowRoute>();
  let devices: readonly string[] = [];
  let transport: MqttTransport | undefined;
  let live = false;
  let established = false;
  let failed = false;
  let closing = false;
  let ending: Promise<void> | undefined;

  // The signing hook cannot await, so it reads the cache the rotation timer
  // keeps fresh. Refreshing the identifier here is load-bearing: the broker
  // disconnects the older of two connections that share one (SYNC-04).
  function signHandshake(client: MqttClientIdentity): string {
    const current = options.credentials.current();
    client.options.clientId = current.clientId;

    return presignIotWebsocketUrl({
      scheme: options.scheme,
      host: current.endpoint,
      region: options.region,
      accessKeyId: current.accessKeyId,
      secretAccessKey: current.secretAccessKey,
      sessionToken: current.sessionToken,
      now: new Date(options.clock.now()),
    });
  }

  function handleMessage(topic: string, payload: Buffer): void {
    const route = routes.get(topic);

    if (route === undefined) {
      return;
    }

    if (route.leaf === 'rejected') {
      options.log.warn('The shadow service rejected a state request for one device.');

      return;
    }

    const document = readShadowDocument(payload);

    if (document === undefined) {
      options.log.debug('A shadow message was discarded because its document could not be read.');

      return;
    }

    options.onReportedPatch(route.deviceId, toReportedPatch(document));
  }

  // Reconnect timing belongs to the capped, guarded policy rather than to the
  // transport library, whose own timer is disabled. A single failure raises
  // both an error and a close notification, and the policy's pending guard is
  // what turns that pair into one retry chain (SYNC-04).
  //
  // The reopener is passed in rather than read from the enclosing scope: the
  // handlers, the schedule, and the opener would otherwise form a declaration
  // cycle, and the parameter names the one thing a retry actually does.
  function scheduleReconnect(reopen: () => void): void {
    if (closing) {
      return;
    }

    options.retry.schedule(() => {
      reopen();

      return Promise.resolve();
    });
  }

  // One failed attempt is a diagnostic note here, not a warning. A refused
  // broker produces one of these per capped-backoff attempt, and the consumer
  // that sees the whole stream is what holds the warning down to the reminder
  // cadence, exactly as the authentication client already does (D-14).
  function handleError(reopen: () => void): void {
    failed = true;
    options.log.debug('The shadow connection failed and will reconnect.');
    scheduleReconnect(reopen);
  }

  // The provider closes an established connection at a ceiling it does not
  // publish a knob for, so at least one reconnect a day is expected operation.
  // Reporting that as a fault would teach the reader to ignore the genuine ones.
  //
  // A connection that closes without ever becoming established is a different
  // event with the same shape: a refused handshake, which is what an expired or
  // mis-signed credential produces, and which a WebSocket reports as a plain
  // close with no error beside it. Reading that as routine would leave the
  // reader with a silently dead monitoring path and nothing above debug to say
  // so (D-15).
  function handleClose(reopen: () => void): void {
    live = false;

    if (failed) {
      options.onDisconnected('transport-error');
    } else if (established) {
      options.log.debug('The shadow connection closed and will reconnect, which the provider connection ceiling makes routine.');
      options.onDisconnected('transport-closed');
    } else {
      options.log.debug('The shadow connection was refused before it was established and will be retried.');
      options.onDisconnected('handshake-refused');
    }

    scheduleReconnect(reopen);
  }

  // The shadow service synchronizes current state rather than replaying what
  // was missed, so a complete shadow is requested after every connection
  // (SYNC-03).
  //
  // A refused subscription leaves the socket open with nothing able to arrive
  // on it. Holding a connection that reads as live while no shadow message can
  // reach the store would report a healthy monitoring path that is silently
  // dead, so the connection is given up and retried through the same guarded
  // policy a transport failure uses.
  async function requestEveryShadow(connection: MqttTransport, reopen: () => void): Promise<void> {
    try {
      await connection.subscribe([...routes.keys()]);

      for (const deviceId of devices) {
        await connection.publish(SHADOW_TOPICS.get(deviceId), '');
      }
    } catch {
      live = false;
      failed = true;
      options.log.debug('The shadow subscription could not be established, so the connection will be retried.');
      options.onDisconnected('subscription-refused');
      void connection.end();
      scheduleReconnect(reopen);
    }
  }

  function handleConnect(connection: MqttTransport, reopen: () => void): void {
    live = true;
    established = true;
    options.retry.reset();
    options.onConnected();
    void requestEveryShadow(connection, reopen);
  }

  function openConnection(): void {
    const current = options.credentials.current();
    const connection = options.createTransport({
      connect: options.connect,
      url: `${options.scheme}://${current.endpoint}${BROKER_PATH}`,
      clientId: current.clientId,
      signUrl: signHandshake,
    });
    transport = connection;
    established = false;
    failed = false;
    connection.onConnect(() => {
      handleConnect(connection, openConnection);
    });
    connection.onMessage(handleMessage);
    connection.onError(() => {
      handleError(openConnection);
    });
    connection.onClose(() => {
      handleClose(openConnection);
    });
  }

  return {
    get connected(): boolean {
      return live;
    },

    start(deviceIds: readonly string[]): Promise<void> {
      devices = [...deviceIds];
      fillRoutes(routes, devices);
      openConnection();

      return Promise.resolve();
    },

    requestFullShadow(deviceId: string): Promise<void> {
      return transport === undefined ? Promise.resolve() : transport.publish(SHADOW_TOPICS.get(deviceId), '');
    },

    // The flag is set before the transport is ended, so the close notification
    // teardown produces cannot schedule a retry.
    close(): Promise<void> {
      closing = true;
      ending ??= transport === undefined ? Promise.resolve() : transport.end();

      return ending;
    },
  };
}
