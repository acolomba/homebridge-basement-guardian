/**
 * @fileoverview The one place the provisional water-level ladder and the flood
 * threshold live.
 *
 * Only `water_level = 1` carries hardware-validation evidence. Every other rung
 * of the ladder, and the flood threshold itself, stay provisional until a
 * natural pump cycle validates the progression (G-002). Both exported constants
 * therefore say so in their names, and closing that gate is one reviewable edit
 * to this module (D-01, D-02, D-03, SAFE-01).
 *
 * The ladder is an explicit lookup, never a population count over the
 * thermometer code's set bits and never a formula. A formula would answer for a
 * code the vendor cannot send, and a guessed level reads downstream as a
 * confident measurement (D-014). An out-of-domain code never reaches the lookup:
 * the family adapter rejects the field before decoding it.
 */

/**
 * Every legal `water_level` code and the `WaterLevel` percentage it publishes.
 *
 * Five equal steps for the five stacked sensors a thermometer code implies, with
 * `31` as 100% of the range the device can report (D-01). Code `0` reports 0%
 * and raises no fault, because no sensor being wet is a level, not a failure
 * (D-02).
 */
export const PROVISIONAL_WATER_LEVEL_PERCENTAGES: ReadonlyMap<number, number> = new Map([
  [0, 0],
  [1, 20],
  [3, 40],
  [7, 60],
  [15, 80],
  [31, 100],
]);

/**
 * The lowest `water_level` code that reports a flooding sump pit.
 *
 * This matches vendor rule `WW-GEM-ALERT-7` (`water_level > 15`) exactly,
 * because `31` is the only legal code above `15`. The plugin makes no
 * independent claim about when a pit is flooding (D-03).
 */
export const PROVISIONAL_FLOOD_WATER_LEVEL_CODE = 31;

/**
 * Returns the `WaterLevel` percentage one legal `water_level` code publishes.
 *
 * @throws TypeError when the ladder maps no percentage for the code, which
 *     means the caller decoded a field its family should have refused.
 */
export function waterLevelPercentage(code: number): number {
  const percentage = PROVISIONAL_WATER_LEVEL_PERCENTAGES.get(code);

  if (percentage === undefined) {
    throw new TypeError(`waterLevelPercentage() has no level for water_level ${String(code)}; validate() must reject this snapshot first`);
  }

  return percentage;
}

/** Reports whether one legal `water_level` code means the sump pit is flooding (D-03). */
export function isPitFlooded(code: number): boolean {
  return code >= PROVISIONAL_FLOOD_WATER_LEVEL_CODE;
}
