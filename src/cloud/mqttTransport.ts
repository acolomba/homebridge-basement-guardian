// The client port below is declared by this consumer rather than imported from
// the transport library, so the shadow client's own tests inject a plain object
// and open no socket, while the transport-level scenarios drive the real
// library against a local broker.

// The default import is deliberate: the named ESM export of a builtin is a
// snapshot binding, which the test runner's timer mocks cannot replace, so the
// deadline would be untestable without awaiting a real timer.
import timers from 'node:timers/promises';

// The refusal names no topic, no payload, and no identifier. It travels into a
// consumer that reports it, and a device identifier embeds the account
// identifier (AUTH-02).
const DEADLINE_REFUSAL = 'The broker did not answer a transport operation within its deadline.';

/**
 * The part of the live client object the signing hook writes.
 *
 * The vendor issues a new client identifier with every credential response, and
 * the message broker disconnects the older of two connections sharing an
 * identifier, so the hook refreshes the identifier on every handshake. Reusing
 * a stale identifier makes the plugin disconnect itself and retry (SYNC-04).
 */
export interface MqttClientIdentity {
  options: { clientId?: string };
}

/** The four notifications this transport forwards, and what each one carries. */
export interface MqttClientEvents {
  connect: () => void;
  message: (topic: string, payload: Buffer) => void;
  error: (error: Error) => void;
  close: () => void;
}

// The registrations are written as overloads rather than one generic signature.
// The library's own `on` is generic over its whole eleven-event map, and a
// narrower generic constraint cannot be related to it; overloads can.
/** The part of the transport library's client surface this adapter drives. */
export interface MqttClientLike extends MqttClientIdentity {
  on(event: 'connect', handler: MqttClientEvents['connect']): void;
  on(event: 'message', handler: MqttClientEvents['message']): void;
  on(event: 'error', handler: MqttClientEvents['error']): void;
  on(event: 'close', handler: MqttClientEvents['close']): void;
  subscribe(topics: string[], callback: (error: Error | null) => void): void;
  publish(topic: string, payload: string, callback: (error?: Error) => void): void;
  end(force: boolean, callback: (error?: Error) => void): void;
}

/**
 * The connection options this adapter fixes.
 *
 * `reconnectPeriod` is zero on purpose. The library's own period defaults to one
 * second with no ceiling, and the consumer's capped, guarded retry policy owns
 * reconnect timing instead (SYNC-04).
 */
export interface MqttConnectOptions {
  clientId: string;
  protocolVersion: 4;
  reconnectPeriod: 0;
  clean: true;
  resubscribe: true;
  transformWsUrl: (url: string, options: object, client: MqttClientIdentity) => string;
  /** Extra headers for the WebSocket handshake; only the plugin's identity header is set (REL-03, REL-04). */
  wsOptions?: { headers: Record<string, string> };
}

/** Opens one client connection. Injected, so no test defaults to a live socket. */
export type MqttConnect = (url: string, options: MqttConnectOptions) => MqttClientLike;

/** One connection, as its consumer needs it: four notifications and three verbs. */
export interface MqttTransport {
  onConnect(handler: () => void): void;
  onMessage(handler: (topic: string, payload: Buffer) => void): void;
  onError(handler: (error: Error) => void): void;
  onClose(handler: () => void): void;
  subscribe(topics: readonly string[]): Promise<void>;
  publish(topic: string, payload: string): Promise<void>;
  end(): Promise<void>;
}

/** Everything one connection needs, by injection. */
export interface MqttTransportOptions {
  connect: MqttConnect;
  url: string;
  clientId: string;
  /** How long one operation may go unanswered before it is refused (WR-11). */
  deadlineMs: number;
  /** Returns the presigned URL for this handshake and refreshes the identifier. */
  signUrl: (client: MqttClientIdentity) => string;
  /** How the plugin identifies itself on the WebSocket handshake (REL-03, REL-04). */
  userAgent: string;
}

// One client operation, settled by the callback the client invokes or refused by
// the deadline, whichever comes first.
//
// A callback that never fires parks the caller forever with no error and no
// close, so the connection keeps reporting healthy while nothing can arrive on
// it. That is what a client which went down between connecting and subscribing
// leaves behind. The deadline turns the stall into the rejection the consumer
// already handles by giving the connection up and retrying (WR-11).
//
// The wait is cancelled the moment the callback settles the operation. A timer
// left to fire holds the Node process open, which is exactly what shutdown
// promises it does not do (SYNC-05).
function within(deadlineMs: number, begin: (settle: (error?: Error | null) => void) => void): Promise<void> {
  const expiry = new AbortController();

  return new Promise<void>((resolve, reject) => {
    void timers.setTimeout(deadlineMs, undefined, { signal: expiry.signal }).then(
      () => {
        reject(new Error(DEADLINE_REFUSAL));
      },
      // The wait rejects when it is cancelled, and by then the operation has
      // already settled, so nothing is left to report.
      () => undefined,
    );

    begin((error?: Error | null) => {
      expiry.abort();

      if (error === null || error === undefined) {
        resolve();
      } else {
        reject(error);
      }
    });
  });
}

// A graceful end sends the disconnect packet rather than dropping the socket,
// and the callback is the only report that the client has finished.
//
// A client that has not connected is dropped instead. The library queues the
// disconnect packet until a connection this client may never get, so the socket
// is never ended, while the end still reports itself finished. Ending politely
// there leaves a live connection behind that nothing will ever close, which is
// exactly what a shutdown promises it does not do (SYNC-05).
function endOnce(client: MqttClientLike, force: boolean): Promise<void> {
  return new Promise<void>((resolve) => {
    client.end(force, () => {
      resolve();
    });
  });
}

/**
 * Creates the transport over one client connection.
 *
 * Unlike the other factories in this project, creating this adapter does open
 * the connection: one adapter stands for one handshake, and the consumer builds
 * a new one for every reconnect so that every handshake is signed afresh.
 */
export function createMqttTransport(options: MqttTransportOptions): MqttTransport {
  const client = options.connect(options.url, {
    clientId: options.clientId,
    protocolVersion: 4,
    reconnectPeriod: 0,
    clean: true,
    resubscribe: true,
    // The hook is handed a URL carrying a port, and the message broker signs
    // the bare host, so that argument is deliberately unused and the signer
    // builds from the endpoint instead. The hook cannot await, which is why the
    // signer reads a cache the rotation timer keeps fresh (SYNC-04).
    transformWsUrl: (_url: string, _connectOptions: object, live: MqttClientIdentity): string => options.signUrl(live),
    wsOptions: { headers: { 'User-Agent': options.userAgent } },
  });
  let ending: Promise<void> | undefined;
  // Whether a graceful end can complete. The connect notification is where that
  // fact arrives, so it is recorded on the way through to the consumer rather
  // than by a second listener the client would have to carry.
  let connected = false;

  return {
    onConnect: (handler: () => void): void => {
      client.on('connect', () => {
        connected = true;
        handler();
      });
    },
    onMessage: (handler: (topic: string, payload: Buffer) => void): void => {
      client.on('message', handler);
    },
    onError: (handler: (error: Error) => void): void => {
      client.on('error', handler);
    },
    onClose: (handler: () => void): void => {
      client.on('close', handler);
    },
    subscribe: (topics: readonly string[]): Promise<void> =>
      within(options.deadlineMs, (settle: (error?: Error | null) => void): void => {
        client.subscribe([...topics], settle);
      }),
    publish: (topic: string, payload: string): Promise<void> =>
      within(options.deadlineMs, (settle: (error?: Error | null) => void): void => {
        client.publish(topic, payload, settle);
      }),
    end: (): Promise<void> => {
      ending ??= endOnce(client, !connected);

      return ending;
    },
  };
}
