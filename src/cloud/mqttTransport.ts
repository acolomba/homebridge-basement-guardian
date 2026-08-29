// This module is parked in the `.fallowrc.json` `ignoreFindings` list because
// no production code reaches it yet. The entry and this note are removed
// together, in the commit that wires the shadow client into the account runtime
// and makes this module reachable from the plugin entry point.
//
// The client port below is declared by this consumer rather than imported from
// the transport library, so the shadow client's own tests inject a plain object
// and open no socket, while the transport-level scenarios drive the real
// library against a local broker.

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

/** The part of the transport library's client surface this adapter drives. */
export interface MqttClientLike extends MqttClientIdentity {
  on<Event extends keyof MqttClientEvents>(event: Event, handler: MqttClientEvents[Event]): void;
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
  /** Returns the presigned URL for this handshake and refreshes the identifier. */
  signUrl: (client: MqttClientIdentity) => string;
}

/**
 * Creates the transport over one client connection.
 *
 * Unlike the other factories in this project, creating this adapter does open
 * the connection: one adapter stands for one handshake, and the consumer builds
 * a new one for every reconnect so that every handshake is signed afresh.
 */
export function createMqttTransport(options: MqttTransportOptions): MqttTransport {
  void options;

  throw new Error('not implemented');
}
