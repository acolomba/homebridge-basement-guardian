/**
 * @fileoverview An architectural gate rather than a behaviour test.
 *
 * `src/runtime/accessoryStore.ts` declares a port and nothing else, so there is no behaviour here
 * to exercise and nothing is missing from this file. What is asserted instead is that the compiled
 * module exports no runtime value at all, which is what proves the port carries no implementation
 * of its own and that no consumer can reach a shared or process-wide store through it (D-08).
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as accessoryStore from '../../src/runtime/accessoryStore.js';

import type { AccessoryStore } from '../../src/runtime/accessoryStore.js';

test('exports no runtime value, so the port carries no implementation of its own', () => {
  // act
  const exported = Object.keys(accessoryStore);

  // assert
  assert.deepStrictEqual(exported, []);
});

// The whole surface a records module can reach through this port. A second method here would be a
// second thing a record could do to an accessory, and a test could no longer say that a call meant
// exactly one write was asked for (D-10).
test('carries one method, so a recorder handed in stands for the whole port', () => {
  // arrange
  const persisted: string[] = [];
  const store: AccessoryStore = {
    persist: () => {
      persisted.push('persist');
    },
  };

  // act
  store.persist();

  // assert
  assert.deepStrictEqual({ declared: Object.keys(store), persisted }, { declared: ['persist'], persisted: ['persist'] });
});
