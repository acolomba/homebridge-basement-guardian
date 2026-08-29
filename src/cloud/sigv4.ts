// This module is parked in the `.fallowrc.json` `ignoreFindings` list because
// `IOT_SERVICE_NAME` has no consumer yet. The entry and this note are removed
// together, in the commit that wires the shadow client into the account
// runtime and makes this module reachable from the plugin entry point.
//
// Nothing here logs, and the produced URL never reaches an error message: it
// carries the credential scope, the session token, and the signature (AUTH-02).

import { createHash, createHmac } from 'node:crypto';

/** The AWS service name the message broker signs connection requests under. */
export const IOT_SERVICE_NAME = 'iotdevicegateway';

const ALGORITHM = 'AWS4-HMAC-SHA256';
const CANONICAL_PATH = '/mqtt';
const REQUEST_SCOPE_TERMINATOR = 'aws4_request';
const SIGNED_HEADERS = 'host';

/**
 * One set of temporary credentials plus the moment the URL is signed at.
 *
 * `scheme` is injected rather than fixed so the transport-level harness can
 * reach a local broker; production always supplies the bundled protocol
 * constant. It is not a configuration field and it disables no verification.
 *
 * `host` is the bare endpoint. The message broker signs the host without a
 * port, so a caller holding a URL that carries one must not build from it.
 */
export interface PresignInput {
  scheme: string;
  host: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  now: Date;
}

function sha256Hex(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

function hmacSha256(key: Buffer | string, payload: string): Buffer {
  return createHmac('sha256', key).update(payload).digest();
}

// The four-step derivation from the AWS Signature Version 4 specification. The
// primitives come from the platform library; only the canonicalization below is
// written here (D-05).
function signingKey(secretAccessKey: string, dateStamp: string, region: string): Buffer {
  const forDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const forRegion = hmacSha256(forDate, region);
  const forService = hmacSha256(forRegion, IOT_SERVICE_NAME);

  return hmacSha256(forService, REQUEST_SCOPE_TERMINATOR);
}

/**
 * Returns the presigned WebSocket URL for the AWS IoT message broker.
 *
 * The result is a pure function of the input, so the same input always produces
 * the same bytes. The security token is appended after the signature rather
 * than folded into the signed query string: AWS IoT is one of the services that
 * signs without it, and the other placement fails the handshake with HTTP 403.
 */
export function presignIotWebsocketUrl(input: PresignInput): string {
  const timestamp = input.now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const dateStamp = timestamp.slice(0, 8);
  const credentialScope = `${dateStamp}/${input.region}/${IOT_SERVICE_NAME}/${REQUEST_SCOPE_TERMINATOR}`;
  const credential = encodeURIComponent(`${input.accessKeyId}/${credentialScope}`);

  const canonicalQuery = [
    `X-Amz-Algorithm=${ALGORITHM}`,
    `X-Amz-Credential=${credential}`,
    `X-Amz-Date=${timestamp}`,
    `X-Amz-SignedHeaders=${SIGNED_HEADERS}`,
  ].join('&');

  const canonicalRequest = ['GET', CANONICAL_PATH, canonicalQuery, `host:${input.host.toLowerCase()}`, '', SIGNED_HEADERS, sha256Hex('')].join('\n');
  const stringToSign = [ALGORITHM, timestamp, credentialScope, sha256Hex(canonicalRequest)].join('\n');
  const signature = hmacSha256(signingKey(input.secretAccessKey, dateStamp, input.region), stringToSign).toString('hex');

  const signed = `${input.scheme}://${input.host}${CANONICAL_PATH}?${canonicalQuery}&X-Amz-Signature=${signature}`;

  return `${signed}&X-Amz-Security-Token=${encodeURIComponent(input.sessionToken)}`;
}
