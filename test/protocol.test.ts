import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PROTOCOL } from '../src/protocol.js';

import type { ProtocolConstants } from '../src/protocol.js';

// The six public vendor constants the plugin bundles (D-07). Declaring the list
// against the contract type keeps it aligned with the interface.
const constantNames: (keyof ProtocolConstants)[] = ['apiUrl', 'auth0Domain', 'auth0Realm', 'awsRegion', 'clientId', 'protocol'];

test('bundles exactly the six public vendor protocol constants', () => {
  // act
  const bundledNames = Object.keys(PROTOCOL).sort((left, right) => left.localeCompare(right));

  // assert
  assert.deepStrictEqual(bundledNames, ['apiUrl', 'auth0Domain', 'auth0Realm', 'awsRegion', 'clientId', 'protocol']);
});

for (const constantName of constantNames) {
  test(`bundles ${constantName} as a non-empty string`, () => {
    // act
    const constant = PROTOCOL[constantName];

    // assert
    assert.strictEqual(typeof constant, 'string');
    assert.strictEqual(constant.length > 0, true);
  });
}
