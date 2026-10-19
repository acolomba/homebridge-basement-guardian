import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PROTOCOL } from '../src/protocol.js';

import type { ProtocolConstants } from '../src/protocol.js';

// These public values are independent of the imported bundle (D-07).
const EXPECTED_PROTOCOL = {
  apiUrl: 'https://api.iot8020.com',
  clientId: '6QsGT46CLgeTRGbDDGUwSANLPRA4n5Zs',
  auth0Url: 'https://connectsense-staging.auth0.com',
  auth0Realm: 'wayne-water',
  awsRegion: 'us-east-1',
  protocol: 'wss',
} satisfies ProtocolConstants;

test('bundles exactly the six public vendor protocol constants', () => {
  // act
  const bundledNames = Object.keys(PROTOCOL).sort((left, right) => left.localeCompare(right));

  // assert
  assert.deepStrictEqual(bundledNames, ['apiUrl', 'auth0Realm', 'auth0Url', 'awsRegion', 'clientId', 'protocol']);
});

test('bundles the exact public vendor protocol values', () => {
  // act
  const bundledProtocol = PROTOCOL;

  // assert
  assert.deepStrictEqual(bundledProtocol, EXPECTED_PROTOCOL);
});
