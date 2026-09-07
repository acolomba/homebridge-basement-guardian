import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { geminiFamily } from '../../src/device/gemini.js';
import { HALO_DEVICE_TYPE_ID, HALO_DISPLAY_NAME } from '../../src/device/halo.js';
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

  test('resolves the HALO deviceTypeId to unsupported, not implemented and not unknown', () => {
    // arrange
    const registry = createFamilyRegistry();

    // act
    const outcome = registry.lookup(HALO_DEVICE_TYPE_ID);

    // assert
    assert.deepStrictEqual(outcome, { kind: 'unsupported', deviceTypeId: HALO_DEVICE_TYPE_ID, displayName: HALO_DISPLAY_NAME });
    assert.notStrictEqual(outcome.kind, 'implemented');
    assert.notStrictEqual(outcome.kind, 'unknown');
  });

  test('resolves the three outcomes to exactly one kind each, with no overlap', () => {
    // arrange
    const registry = createFamilyRegistry();

    // act
    const kinds = [registry.lookup('wayneWaterGemini').kind, registry.lookup(HALO_DEVICE_TYPE_ID).kind, registry.lookup('somethingElse').kind];

    // assert
    assert.deepStrictEqual(kinds, ['implemented', 'unsupported', 'unknown']);
    assert.strictEqual(new Set(kinds).size, 3);
  });
});

describe('shouldLog', () => {
  test('answers true the first time a deviceId is seen with a deviceTypeId', () => {
    // arrange
    const registry = createFamilyRegistry();

    // act
    const first = registry.shouldLog('device-1', HALO_DEVICE_TYPE_ID);

    // assert
    assert.strictEqual(first, true);
  });

  test('answers false on a repeat of the same deviceId/deviceTypeId pair', () => {
    // arrange
    const registry = createFamilyRegistry();
    registry.shouldLog('device-1', HALO_DEVICE_TYPE_ID);

    // act
    const repeat = registry.shouldLog('device-1', HALO_DEVICE_TYPE_ID);

    // assert
    assert.strictEqual(repeat, false);
  });

  test('answers true again once the deviceId reports a different deviceTypeId', () => {
    // arrange
    const registry = createFamilyRegistry();
    registry.shouldLog('device-1', HALO_DEVICE_TYPE_ID);

    // act
    const afterChange = registry.shouldLog('device-1', 'somethingElse');

    // assert
    assert.strictEqual(afterChange, true);
  });

  test('tracks each deviceId independently', () => {
    // arrange
    const registry = createFamilyRegistry();
    registry.shouldLog('device-1', HALO_DEVICE_TYPE_ID);

    // act
    const otherDevice = registry.shouldLog('device-2', HALO_DEVICE_TYPE_ID);

    // assert
    assert.strictEqual(otherDevice, true);
  });
});
