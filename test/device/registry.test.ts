import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { geminiFamily } from '../../src/device/gemini.js';
import { createFamilyRegistry } from '../../src/device/registry.js';

import type { FamilyOutcome } from '../../src/device/registry.js';

void ({ kind: 'implemented', family: geminiFamily } satisfies FamilyOutcome<unknown>);
void ({ kind: 'unsupported', deviceTypeId: 'wayneWaterHalo', displayName: 'Wayne Water HALO' } satisfies FamilyOutcome<unknown>);
void ({ kind: 'unknown', deviceTypeId: 'somethingElse' } satisfies FamilyOutcome<unknown>);

// @ts-expect-error an implemented outcome carries the family it resolved to
void ({ kind: 'implemented' } satisfies FamilyOutcome<unknown>);
// @ts-expect-error an unsupported outcome names the profile it cannot drive
void ({ kind: 'unsupported' } satisfies FamilyOutcome<unknown>);

describe('createFamilyRegistry', () => {
  test('resolves the Gemini deviceTypeId to the implemented Gemini family', () => {
    // arrange
    const registry = createFamilyRegistry();

    // act
    const outcome = registry.lookup('wayneWaterGemini');

    // assert
    assert.deepStrictEqual(outcome, { kind: 'implemented', family: geminiFamily });
  });

  test('resolves a deviceTypeId it has never seen to unknown', () => {
    // arrange
    const registry = createFamilyRegistry();

    // act
    const outcome = registry.lookup('somethingElse');

    // assert
    assert.deepStrictEqual(outcome, { kind: 'unknown', deviceTypeId: 'somethingElse' });
  });

  test('resolves the HALO deviceTypeId to unknown until its adapter is registered', () => {
    // arrange
    const registry = createFamilyRegistry();

    // act
    const outcome = registry.lookup('wayneWaterHalo');

    // assert
    assert.deepStrictEqual(outcome, { kind: 'unknown', deviceTypeId: 'wayneWaterHalo' });
  });
});
