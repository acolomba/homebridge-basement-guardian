import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { getCACertificates, setDefaultCACertificates } from 'node:tls';

import { httpFetch } from '../../src/cloud/httpDispatcher.js';

import { startAlpnServer } from './alpnServer.js';

import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { TestContext } from 'node:test';

interface RecordedRequest {
  method: string | undefined;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

// A loopback plain-HTTP server (no TLS, so protocol negotiation plays no part here): it records the
// one request it receives and echoes a fixed JSON body, so a case can assert what the port actually
// put on the wire and what it handed back.
async function startEchoServer(t: TestContext): Promise<{ url: string; request: () => RecordedRequest | undefined }> {
  let recorded: RecordedRequest | undefined;
  const server: Server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const chunks: Buffer[] = [];

    request.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on('end', () => {
      recorded = { method: request.method, headers: request.headers, body: Buffer.concat(chunks).toString('utf8') };
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ answer: 'echoed' }));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  t.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);

            return;
          }

          resolve();
        });
      }),
  );

  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('expected the loopback server to bind a TCP port');
  }

  return { url: `http://127.0.0.1:${String(address.port)}/`, request: () => recorded };
}

test('forwards the request method, headers, and body, and returns the server response', async (t) => {
  // arrange
  const server = await startEchoServer(t);

  // act
  const response = await httpFetch(server.url, { method: 'POST', headers: { 'x-test': 'value-1' }, body: 'request-body-1' });
  const body: unknown = await response.json();

  // assert
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, { answer: 'echoed' });
  assert.deepStrictEqual(
    { method: server.request()?.method, header: server.request()?.headers['x-test'], body: server.request()?.body },
    { method: 'POST', header: 'value-1', body: 'request-body-1' },
  );
});

test('rejects immediately when the caller supplies an already-aborted signal', async (t) => {
  // arrange
  const server = await startEchoServer(t);

  // act & assert
  await assert.rejects(() => httpFetch(server.url, { signal: AbortSignal.abort() }));
});

// A real loopback connection, not a mocked fetch: this module's entire purpose is to steer which
// protocol undici negotiates on the wire, so proving that is the behavior this case exists to check.
test('negotiates HTTP/1.1 even when the server offers HTTP/2', async (t) => {
  // arrange
  const server = await startAlpnServer(JSON.stringify({ answer: 'echoed' }));
  t.after(() => server.close());
  const originalCertificates = getCACertificates('default');
  setDefaultCACertificates([...originalCertificates, server.certificate]);
  t.after(() => {
    setDefaultCACertificates(originalCertificates);
  });

  // act
  await httpFetch(server.url);
  const negotiatedProtocol = await server.negotiatedProtocol();

  // assert
  assert.strictEqual(negotiatedProtocol, 'http/1.1');
});
