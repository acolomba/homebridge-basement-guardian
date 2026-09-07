import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createSecureServer } from 'node:http2';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TLSSocket } from 'node:tls';

import type { ServerHttp2Stream } from 'node:http2';
import type { Socket } from 'node:net';

/** A loopback HTTPS server that reports which protocol the connecting client actually negotiated. */
export interface AlpnServer {
  readonly url: string;
  /** The server's self-signed certificate, in PEM form, for a caller to add to its CA trust. */
  readonly certificate: string;
  /** Resolves with the ALPN protocol ('h2' or 'http/1.1') the first request negotiated. */
  negotiatedProtocol(): Promise<string>;
  close(): Promise<void>;
}

// A throwaway self-signed certificate, generated fresh for each server rather than committed to
// the repository: it needs no long-lived validity, and generating it here keeps no private key
// material in source control for a secret scanner to flag.
function generateLoopbackCertificate(): { cert: string; key: string } {
  const directory = mkdtempSync(join(tmpdir(), 'basement-guardian-alpn-'));
  const keyPath = join(directory, 'key.pem');
  const certPath = join(directory, 'cert.pem');

  try {
    execFileSync(
      'openssl',
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-keyout',
        keyPath,
        '-out',
        certPath,
        '-days',
        '1',
        '-nodes',
        '-subj',
        '/CN=localhost',
        '-addext',
        'subjectAltName=DNS:localhost,IP:127.0.0.1',
      ],
      { stdio: 'ignore' },
    );

    return { key: readFileSync(keyPath, 'utf8'), cert: readFileSync(certPath, 'utf8') };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function alpnProtocolOf(socket: Socket): string {
  // A secure server only ever hands its listeners a TLS-wrapped socket; the runtime check (rather
  // than a bare cast) is what actually proves that on every call.
  if (!(socket instanceof TLSSocket)) {
    throw new Error('expected a TLS socket from a secure server');
  }

  return typeof socket.alpnProtocol === 'string' ? socket.alpnProtocol : 'none';
}

/**
 * Starts a loopback HTTP/2-capable HTTPS server that answers every request with the given JSON
 * body, and records the ALPN protocol the connecting client actually negotiated -- proof of what
 * the wire did, not an assumption drawn from which server event fired.
 */
export async function startAlpnServer(responseBody: string): Promise<AlpnServer> {
  const { cert, key } = generateLoopbackCertificate();
  const server = createSecureServer({ cert, key, allowHTTP1: true });
  let resolveProtocol: ((protocol: string) => void) | undefined;
  const protocol = new Promise<string>((resolve) => {
    resolveProtocol = resolve;
  });

  server.on('request', (request, response) => {
    // A secure server with `allowHTTP1: true` also fires this event for an HTTP/2 client; that
    // case is answered by the `stream` listener below instead.
    if (request.httpVersionMajor === 2) {
      return;
    }

    resolveProtocol?.(alpnProtocolOf(request.socket));
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(responseBody);
  });

  server.on('stream', (stream: ServerHttp2Stream) => {
    // The event map types this parameter as the base `Http2Stream`, but a server's own `stream`
    // event always carries the server-side subclass that can `respond()`.
    resolveProtocol?.(stream.session?.alpnProtocol ?? 'unknown');
    stream.respond({ ':status': 200, 'content-type': 'application/json' });
    stream.end(responseBody);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('expected the loopback server to bind a TCP port');
  }

  return {
    url: `https://localhost:${String(address.port)}/`,
    certificate: cert,
    negotiatedProtocol: () => protocol,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);

            return;
          }

          resolve();
        });
      }),
  };
}
