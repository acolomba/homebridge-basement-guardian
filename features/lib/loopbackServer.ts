/**
 * @fileoverview Shared plumbing for the loopback HTTP stand-ins.
 *
 * Both vendor HTTP services listen on an ephemeral loopback port, so scenarios never collide on a
 * fixed port and the suite runs anywhere. The server binds to the loopback address explicitly, and
 * a caller learns the port only after the socket is listening.
 */

import { createServer } from 'node:http';

import type { IncomingMessage, ServerResponse } from 'node:http';

/** The only address a harness service ever binds. */
export const LOOPBACK_ADDRESS = '127.0.0.1';

/** Answers one request. Exceptions bubble: a stack trace beats a swallowed error. */
export type RequestHandler = (request: IncomingMessage, response: ServerResponse) => Promise<void>;

/** A running loopback service. */
export interface LoopbackServer {
  readonly baseUrl: string;

  /** Stops the service and resolves once every open connection is destroyed. */
  close(): Promise<void>;
}

/** Writes a JSON body with its status. */
export function respondJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

/** Reads a request body to the end. */
export async function readBody(request: IncomingMessage): Promise<string> {
  let body = '';

  for await (const chunk of request) {
    body += String(chunk);
  }

  return body;
}

/** Starts a handler on an ephemeral loopback port, resolving once the port is known. */
export async function startLoopbackServer(handle: RequestHandler): Promise<LoopbackServer> {
  const server = createServer((request, response) => {
    void handle(request, response);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, LOOPBACK_ADDRESS, resolve);
  });

  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('the loopback service is not listening on a TCP port');
  }

  return {
    baseUrl: `http://${LOOPBACK_ADDRESS}:${String(address.port)}`,
    async close(): Promise<void> {
      server.closeAllConnections();

      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    },
  };
}
