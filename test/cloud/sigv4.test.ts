import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { test } from 'node:test';

import { presignIotWebsocketUrl } from '../../src/cloud/sigv4.js';

import type { PresignInput } from '../../src/cloud/sigv4.js';

const HOST = 'broker.example';
const REGION = 'us-test-1';
const ACCESS_KEY_ID = 'test-access-key-id';
const SECRET_ACCESS_KEY = 'test-secret-access-key';
const SESSION_TOKEN = 'test/session+token==';
const ENCODED_SESSION_TOKEN = 'test%2Fsession%2Btoken%3D%3D';
const SIGNED_AT = '2026-08-28T12:00:00.000Z';

// The signed query string is written out rather than assembled, so the
// expectation below inherits nothing from the production canonicalization.
const CANONICAL_QUERY = [
  'X-Amz-Algorithm=AWS4-HMAC-SHA256',
  'X-Amz-Credential=test-access-key-id%2F20260828%2Fus-test-1%2Fiotdevicegateway%2Faws4_request',
  'X-Amz-Date=20260828T120000Z',
  'X-Amz-SignedHeaders=host',
].join('&');

const CANONICAL_REQUEST = [
  'GET',
  '/mqtt',
  CANONICAL_QUERY,
  `host:${HOST}`,
  '',
  'host',
  // The SHA-256 digest of the empty payload, written as a literal.
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
].join('\n');

const STRING_TO_SIGN = [
  'AWS4-HMAC-SHA256',
  '20260828T120000Z',
  '20260828/us-test-1/iotdevicegateway/aws4_request',
  createHash('sha256').update(CANONICAL_REQUEST).digest('hex'),
].join('\n');

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

// The four-step signing-key derivation, spelled out here so the expected
// signature is computed independently of the module under test.
const SIGNING_KEY = hmac(hmac(hmac(hmac(`AWS4${SECRET_ACCESS_KEY}`, '20260828'), REGION), 'iotdevicegateway'), 'aws4_request');
const EXPECTED_SIGNATURE = hmac(SIGNING_KEY, STRING_TO_SIGN).toString('hex');

// Everything the signature covers, plus the signature itself. The scheme and
// the security token are the only parts that vary without resigning.
const SIGNED_PART = `${HOST}/mqtt?${CANONICAL_QUERY}&X-Amz-Signature=${EXPECTED_SIGNATURE}`;
const EXPECTED_URL = `wss://${SIGNED_PART}&X-Amz-Security-Token=${ENCODED_SESSION_TOKEN}`;

function baseInput(): PresignInput {
  return {
    scheme: 'wss',
    host: HOST,
    region: REGION,
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    sessionToken: SESSION_TOKEN,
    now: new Date(SIGNED_AT),
  };
}

function signatureOf(url: string): string | null {
  return new URL(url).searchParams.get('X-Amz-Signature');
}

test('signs the canonical request the AWS IoT variant defines', () => {
  // arrange
  const input = baseInput();

  // act
  const url = presignIotWebsocketUrl(input);

  // assert
  assert.strictEqual(url, EXPECTED_URL);
});

test('produces a byte-identical string for two calls with the same input', () => {
  // arrange
  const url = presignIotWebsocketUrl(baseInput());

  // act
  const repeated = presignIotWebsocketUrl(baseInput());

  // assert
  assert.strictEqual(repeated, url);
});

test('builds the URL from the supplied scheme', () => {
  // arrange
  const input = { ...baseInput(), scheme: 'ws' };

  // act
  const url = presignIotWebsocketUrl(input);

  // assert
  assert.strictEqual(url, `ws://${SIGNED_PART}&X-Amz-Security-Token=${ENCODED_SESSION_TOKEN}`);
});

for (const { change, input } of [
  { change: 'a different secret access key', input: { ...baseInput(), secretAccessKey: 'other-secret-access-key' } },
  { change: 'a different region', input: { ...baseInput(), region: 'eu-test-1' } },
  { change: 'a different host', input: { ...baseInput(), host: 'other-broker.example' } },
  { change: 'a clock one second later', input: { ...baseInput(), now: new Date('2026-08-28T12:00:01.000Z') } },
]) {
  test(`produces a different signature for ${change}`, () => {
    // act
    const url = presignIotWebsocketUrl(input);

    // assert
    assert.notStrictEqual(signatureOf(url), EXPECTED_SIGNATURE);
  });
}

test('leaves the signature untouched when only the session token changes', () => {
  // arrange
  const input = { ...baseInput(), sessionToken: 'other-session-token' };

  // act
  const url = presignIotWebsocketUrl(input);

  // assert
  assert.strictEqual(url, `wss://${SIGNED_PART}&X-Amz-Security-Token=other-session-token`);
});

test('percent-encodes a session token that carries reserved characters', () => {
  // arrange
  const input = { ...baseInput(), sessionToken: 'a b/c=d+e' };

  // act
  const url = presignIotWebsocketUrl(input);

  // assert
  assert.strictEqual(url, `wss://${SIGNED_PART}&X-Amz-Security-Token=a%20b%2Fc%3Dd%2Be`);
});
