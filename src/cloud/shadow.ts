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

// How long one transport operation may go unanswered before the connection is
// given up. The subscription and the complete-shadow requests are the only
// operations, and a working broker answers each within a round trip, so ten
// seconds is far past normal while still well inside the capped backoff. Without
// it a client that went down between connecting and subscribing leaves the
// operation parked forever and the connection reporting healthy (WR-11).
const OPERATION_DEADLINE_MS = 10_000;

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
  close(): Promise<void>;
}

// One connection's own state.
//
// These were once plain variables shared by every connection the client had
// ever opened, which let a connection the client had already replaced rewrite
// the live one's health and start its own retry chain. Each connection now
// carries its own record, and identity decides whether a notification is worth
// listening to at all (SYNC-04).
interface ShadowConnection {
  transport: MqttTransport;
  /** The socket opened, which tells a refused handshake from a routine close. */
  established: boolean;
  /** A shadow message can reach the store over this connection. */
  live: boolean;
  /** The client has given this connection up and has already said so once. */
  released: boolean;
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

// MQTT reserves `+` and `#` as subscription wildcards.
const TOPIC_WILDCARD = /[+#]/;

// The device identifiers whose topics the routing table can resolve.
//
// An identifier carrying a wildcard would build a subscription whose incoming
// topics cannot be found in the routing table, so every message for that device
// would be dropped by the unresolved-route path without a word. The identifier
// is refused instead. The device keeps the poll, which is the reconciliation
// backstop anyway, so this narrows the scope rather than losing the device, and
// the message says so once without quoting the identifier, which embeds the
// account identifier (D-15, AUTH-02).
function usableDevices(deviceIds: readonly string[], log: Logging): readonly string[] {
  const usable = deviceIds.filter((deviceId: string) => !TOPIC_WILDCARD.test(deviceId));

  if (usable.length !== deviceIds.length) {
    log.warn('A device identifier cannot be used as a shadow topic, so the poll is the only source for that device.');
  }

  return usable;
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
//
// A section that is not an object is refused here rather than passed on, and
// this is the only place that refuses it: validation above reaches two levels,
// the payload and its `state`, and says nothing about the sections under
// `reported`. Handing a corrupt section on as telemetry would let a message
// which delivered no reading take the readings from the poll (CR-03).
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
  let connection: ShadowConnection | undefined;
  let closing = false;
  let ending: Promise<void> | undefined;

  // Whether a notification belongs to the connection the client is actually
  // using. A connection the client has replaced keeps its handlers, and its
  // outstanding callbacks still settle, so this predicate is the one thing
  // standing between what it says and the live connection's health (SYNC-04).
  function isCurrent(target: ShadowConnection): boolean {
    return connection === target && !target.released && !closing;
  }

  // Ends the client's use of one connection and says so once.
  //
  // Ownership ends at the first of these: the transport fails under it, the
  // transport closes, or its subscription is refused. Whichever comes first
  // reports; everything after it finds the connection released and reports
  // nothing, so a consumer sees exactly one disconnection per connection.
  function release(target: ShadowConnection, reason: ShadowDisconnectReason): void {
    target.released = true;
    target.live = false;
    options.onDisconnected(reason);
  }

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
  //
  // Nothing checks the shutdown flag here. Every caller reaches this only by
  // releasing a connection it still owned, which shutdown makes impossible, and
  // the opener refuses to run once closing in any case.
  function scheduleReconnect(reopen: () => void): void {
    options.retry.schedule(() => {
      reopen();

      return Promise.resolve();
    });
  }

  // One failed attempt is a diagnostic note here, not a warning. A refused
  // broker produces one of these per capped-backoff attempt, and the consumer
  // that sees the whole stream is what holds the warning down to the reminder
  // cadence, exactly as the authentication client already does (D-14).
  // The connection is given up here rather than at the close that follows it. A
  // failed transport carries nothing, and reporting at the earliest honest
  // moment is what keeps one failure from being reported twice.
  function handleError(target: ShadowConnection, reopen: () => void): void {
    options.log.debug('The shadow connection failed and will reconnect.');
    release(target, 'transport-error');
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
  function handleClose(target: ShadowConnection, reopen: () => void): void {
    if (target.established) {
      options.log.debug('The shadow connection closed and will reconnect, which the provider connection ceiling makes routine.');
      release(target, 'transport-closed');
    } else {
      options.log.debug('The shadow connection was refused before it was established and will be retried.');
      release(target, 'handshake-refused');
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
  // The connection is checked again after the await: a subscription belonging to
  // a connection the client has already replaced must change nothing.
  async function requestEveryShadow(target: ShadowConnection, reopen: () => void): Promise<void> {
    try {
      await target.transport.subscribe([...routes.keys()]);

      for (const deviceId of devices) {
        await target.transport.publish(SHADOW_TOPICS.get(deviceId), '');
      }
    } catch {
      if (isCurrent(target)) {
        options.log.debug('The shadow subscription could not be established, so the connection will be retried.');
        release(target, 'subscription-refused');
        void target.transport.end();
        scheduleReconnect(reopen);
      }

      return;
    }

    if (isCurrent(target)) {
      target.live = true;
      options.retry.reset();
      options.onConnected();
    }
  }

  // The socket opening is not the same event as the plugin being able to see
  // anything. A connection announced at the handshake, with its subscription
  // still outstanding, reports a healthy combined path while no shadow message
  // can reach the store, which is a monitoring path that is dead and says it is
  // fine. Only `established` is set here, because telling a refused handshake
  // from a routine close is a socket-level question (D-15).
  function handleConnect(target: ShadowConnection, reopen: () => void): void {
    target.established = true;
    void requestEveryShadow(target, reopen);
  }

  // Every notification is checked against the connection it came from before it
  // reaches anything, so a connection the client has replaced drives no live
  // state, routes no message, and starts no retry.
  function attach(target: ShadowConnection, reopen: () => void): void {
    target.transport.onConnect(() => {
      if (isCurrent(target)) {
        handleConnect(target, reopen);
      }
    });
    target.transport.onMessage((topic: string, payload: Buffer) => {
      if (isCurrent(target)) {
        handleMessage(topic, payload);
      }
    });
    target.transport.onError(() => {
      if (isCurrent(target)) {
        handleError(target, reopen);
      }
    });
    target.transport.onClose(() => {
      if (isCurrent(target)) {
        handleClose(target, reopen);
      }
    });
  }

  // Nothing may open a connection once shutdown has begun. `close` memoizes the
  // ending of the transport that existed when it ran, so a connection appearing
  // after it would be one nothing ever ends; this guard is what makes that
  // memoization sound (SYNC-05).
  function openConnection(): void {
    if (closing) {
      return;
    }

    const current = options.credentials.current();
    const previous = connection;
    const target: ShadowConnection = {
      transport: options.createTransport({
        connect: options.connect,
        url: `${options.scheme}://${current.endpoint}${BROKER_PATH}`,
        clientId: current.clientId,
        deadlineMs: OPERATION_DEADLINE_MS,
        signUrl: signHandshake,
      }),
      established: false,
      live: false,
      released: false,
    };

    connection = target;
    // The socket the replacement supersedes is the plugin's own, and one the
    // broker still holds open is work nobody will ever close. Ending is
    // memoized per transport, so this costs nothing when it has already gone
    // down (SYNC-05).
    void previous?.transport.end();
    attach(target, openConnection);
  }

  return {
    // Derived from the two facts that decide it rather than held as a flag of
    // its own: whether the current connection can carry a shadow message, and
    // whether the client is still using it at all. Shutdown raises no
    // disconnection by design, so `close()` leaves `live` standing on the
    // connection it ended; reading `closing` here is what keeps a closed client
    // from reporting itself connected, without a second flag that could
    // disagree with the connection's own record (SYNC-04).
    get connected(): boolean {
      return !closing && (connection?.live ?? false);
    },

    start(deviceIds: readonly string[]): Promise<void> {
      devices = usableDevices(deviceIds, options.log);
      fillRoutes(routes, devices);
      openConnection();

      return Promise.resolve();
    },

    // The flag is set before the transport is ended, so the close notification
    // teardown produces reaches nothing, and the opener refuses to run, so the
    // memoized ending cannot be left belonging to a superseded transport.
    close(): Promise<void> {
      closing = true;
      ending ??= connection === undefined ? Promise.resolve() : connection.transport.end();

      return ending;
    },
  };
}
