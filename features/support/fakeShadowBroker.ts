/**
 * @fileoverview In-process MQTT broker reachable over a WebSocket.
 *
 * A scenario connects through a real MQTT handshake rather than a replay of canned bytes, so the
 * plugin's own connect, subscribe, and reconnect logic is what gets exercised.
 *
 * The broker reads exactly one chunk per readable event, while an MQTT client writes each connect
 * field as its own stream write and a WebSocket turns each write into its own frame. Pairing the
 * WebSocket library's own stream helper with the broker therefore produces a connection, a broker
 * client, and then silence: the broker consumes the first byte, finds no complete packet, and never
 * reads again. Plain TCP hides the defect because the kernel coalesces the writes. The bridge below
 * batches every frame that arrives in one tick and pushes a single concatenated buffer, which is
 * what makes the handshake complete.
 */

import { once } from 'node:events';
import { Duplex } from 'node:stream';

import { Aedes } from 'aedes';
import { WebSocketServer } from 'ws';

import { LOOPBACK_ADDRESS } from './loopbackServer.js';

import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

/** The device-shadow topics this version subscribes to. It publishes to none of them. */
export type ShadowTopicLeaf = 'get/accepted' | 'get/rejected' | 'update/accepted';

/** An in-process shadow broker a scenario drives directly. */
export interface FakeShadowBroker {
  readonly host: string;
  readonly handshakes: readonly string[];
  readonly clientIds: readonly string[];

  /** Every topic a connected client published to, in arrival order. */
  readonly publishedTopics: readonly string[];

  /**
   * How many connections the broker is holding open right now.
   *
   * A leaked connection raises nothing, so a scenario asserting that a shutdown released
   * everything has to ask the broker rather than read the absence of a rejection.
   */
  liveConnectionCount(): number;

  /** Publishes a device-reported patch on the update-accepted topic. */
  publishReported(deviceId: string, reported: Record<string, unknown>, version: number): void;

  /** Publishes a full shadow document on the get-accepted topic. */
  publishGetAccepted(deviceId: string, shadow: Record<string, unknown>, version: number): void;

  /** Publishes a rejection on the get-rejected topic. */
  publishGetRejected(deviceId: string, code: number): void;

  /** Closes every live connection, which is how a scenario forces the reconnect path. */
  disconnectAll(): void;

  /**
   * Rejects every later handshake, which is how a scenario drives the degraded path.
   *
   * The rejection happens before the upgrade, so a refused attempt reaches neither the recorded
   * handshakes nor the broker, and the client sees a failure rather than a clean close.
   */
  refuseConnections(): void;

  /** Accepts handshakes again, which is how a scenario drives the recovery path. */
  acceptConnections(): void;

  /** Stops the broker and the WebSocket service and resolves once every connection is destroyed. */
  close(): Promise<void>;
}

/** The shadow topic of one device. The thing name is the vendor device identifier. */
export function shadowTopic(deviceId: string, leaf: ShadowTopicLeaf): string {
  return `$aws/things/${deviceId}/shadow/${leaf}`;
}

// Batches every frame that arrives in one tick into a single chunk the broker can parse.
function bridge(socket: WebSocket): Duplex {
  let pending: Buffer[] = [];

  const duplex = new Duplex({
    read() {
      // The socket pushes; there is nothing to pull.
    },
    // The stream contract fixes the middle parameter. The leading underscore is the compiler's
    // marker for a parameter this implementation has no use for.
    write(chunk: Buffer, _encoding, callback) {
      socket.send(chunk, { binary: true }, () => {
        callback();
      });
    },
    destroy(error, callback) {
      socket.close();
      callback(error);
    },
  });

  const flush = (): void => {
    if (pending.length === 0) {
      return;
    }

    const batch = Buffer.concat(pending);
    pending = [];
    duplex.push(batch);
  };

  socket.on('message', (data: Buffer) => {
    pending.push(Buffer.from(data));

    if (pending.length === 1) {
      setImmediate(flush);
    }
  });

  socket.on('close', () => {
    flush();
    duplex.push(null);
  });

  socket.on('error', (error) => {
    duplex.destroy(error);
  });

  return duplex;
}

// Answers the query string of a handshake, which is where a signed connection carries its
// credential material.
function queryStringOf(request: IncomingMessage): string {
  const url = request.url ?? '';
  const separator = url.indexOf('?');

  return separator === -1 ? '' : url.slice(separator + 1);
}

function publishJson(broker: Aedes, topic: string, document: Record<string, unknown>): void {
  broker.publish({ cmd: 'publish', topic, payload: Buffer.from(JSON.stringify(document)), qos: 0, dup: false, retain: false }, (error) => {
    if (error) {
      throw error;
    }
  });
}

function hostOf(server: WebSocketServer): string {
  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('the fake shadow broker is not listening on a TCP port');
  }

  return `${LOOPBACK_ADDRESS}:${String(address.port)}`;
}

/**
 * Starts a fake shadow broker on an ephemeral loopback port.
 *
 * The promise resolves only once the port is known, so a caller can read `host` immediately.
 */
export async function createFakeShadowBroker(): Promise<FakeShadowBroker> {
  const broker = await Aedes.createBroker();
  const handshakes: string[] = [];
  const clientIds: string[] = [];
  const publishedTopics: string[] = [];
  let refusing = false;

  const server = new WebSocketServer({
    host: LOOPBACK_ADDRESS,
    port: 0,
    handleProtocols: (protocols) => (protocols.has('mqtt') ? 'mqtt' : false),
    verifyClient: () => !refusing,
  });

  broker.on('client', (client) => {
    clientIds.push(client.id);
  });

  // A null client is the broker publishing to its own subscribers, which is the scenario speaking
  // rather than the plugin. Only what a client sent is recorded.
  broker.on('publish', (packet, client) => {
    if (client !== null) {
      publishedTopics.push(packet.topic);
    }
  });

  server.on('connection', (socket, request) => {
    handshakes.push(queryStringOf(request));
    broker.handle(bridge(socket), request);
  });

  await once(server, 'listening');

  return {
    host: hostOf(server),
    handshakes,
    clientIds,
    publishedTopics,
    liveConnectionCount(): number {
      return server.clients.size;
    },
    publishReported(deviceId: string, reported: Record<string, unknown>, version: number): void {
      publishJson(broker, shadowTopic(deviceId, 'update/accepted'), { state: { reported }, version });
    },
    publishGetAccepted(deviceId: string, shadow: Record<string, unknown>, version: number): void {
      publishJson(broker, shadowTopic(deviceId, 'get/accepted'), { state: shadow, version });
    },
    publishGetRejected(deviceId: string, code: number): void {
      publishJson(broker, shadowTopic(deviceId, 'get/rejected'), { code, message: 'the scenario rejected the shadow request' });
    },
    disconnectAll(): void {
      for (const socket of server.clients) {
        socket.close();
      }
    },
    refuseConnections(): void {
      refusing = true;
    },
    acceptConnections(): void {
      refusing = false;
    },
    async close(): Promise<void> {
      for (const socket of server.clients) {
        socket.terminate();
      }

      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      await new Promise<void>((resolve) => {
        broker.close(resolve);
      });
    },
  };
}
