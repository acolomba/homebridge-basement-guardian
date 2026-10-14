// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Checks the provisional water-level ladder and flood threshold.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { PROVISIONAL_FLOOD_WATER_LEVEL_CODE, PROVISIONAL_WATER_LEVEL_PERCENTAGES, isPitFlooded, waterLevelPercentage } from '../../src/device/waterLevel.js';

describe('waterLevelPercentage', () => {
  for (const { code, percentage } of [
    { code: 0, percentage: 0 },
    { code: 1, percentage: 20 },
    { code: 3, percentage: 40 },
    { code: 7, percentage: 60 },
    { code: 15, percentage: 80 },
    { code: 31, percentage: 100 },
  ]) {
    test(`SAFE-01 reports water_level ${String(code)} as ${String(percentage)} percent`, () => {
      // arrange
      const waterLevelCode = code;
      const expectedPercentage = percentage;

      // act
      const levelPercentage = waterLevelPercentage(waterLevelCode);

      // assert
      assert.strictEqual(levelPercentage, expectedPercentage);
    });
  }

  for (const code of [2, 16, 30, 32, -1, 1.5]) {
    test(`SAFE-01 refuses to invent a level for the illegal code ${String(code)}`, () => {
      // arrange
      const waterLevelCode = code;

      // act & assert
      assert.throws(() => waterLevelPercentage(waterLevelCode), TypeError);
    });
  }
});

describe('isPitFlooded', () => {
  for (const { code, flooded } of [
    { code: 0, flooded: false },
    { code: 1, flooded: false },
    { code: 3, flooded: false },
    { code: 7, flooded: false },
    { code: 15, flooded: false },
    { code: 31, flooded: true },
  ]) {
    test(`SAFE-01 reports water_level ${String(code)} as flooded=${String(flooded)}`, () => {
      // arrange
      const waterLevelCode = code;
      const expectedFlooded = flooded;

      // act
      const pitFlooded = isPitFlooded(waterLevelCode);

      // assert
      assert.strictEqual(pitFlooded, expectedFlooded);
    });
  }
});

describe('PROVISIONAL_WATER_LEVEL_PERCENTAGES', () => {
  test('D-01 maps the six legal water_level codes and no others', () => {
    // arrange
    const ladder = PROVISIONAL_WATER_LEVEL_PERCENTAGES;

    // act
    const codes = [...ladder.keys()];

    // assert
    assert.strictEqual(PROVISIONAL_WATER_LEVEL_PERCENTAGES.size, 6);
    assert.deepStrictEqual(codes, [0, 1, 3, 7, 15, 31]);
  });

  test('D-01 maps those codes to five even steps above zero', () => {
    // arrange
    const ladder = PROVISIONAL_WATER_LEVEL_PERCENTAGES;

    // act
    const percentages = [...ladder.values()];

    // assert
    assert.deepStrictEqual(percentages, [0, 20, 40, 60, 80, 100]);
  });

  test('D-03 places exactly one legal code at or above the flood threshold', () => {
    // arrange
    const ladder = PROVISIONAL_WATER_LEVEL_PERCENTAGES;

    // act
    const floodingCodes = [...ladder.keys()].filter((code) => isPitFlooded(code));

    // assert
    assert.deepStrictEqual(floodingCodes, [31]);
  });
});

describe('PROVISIONAL_FLOOD_WATER_LEVEL_CODE', () => {
  test('D-03 sets the flood threshold at 31, the only legal code above 15', () => {
    // arrange
    const expectedThreshold = 31;

    // act
    const floodThreshold = PROVISIONAL_FLOOD_WATER_LEVEL_CODE;

    // assert
    assert.strictEqual(floodThreshold, expectedThreshold);
  });
});
