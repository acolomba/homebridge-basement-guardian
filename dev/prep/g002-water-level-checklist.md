# G-002 -- Water-Level Ladder Validation Checklist

**Blocks:** `1.0.0` only. Does not block any phase's completion.

**Why this exists.** The provisional water-level ladder and the flood threshold live in one place, `src/device/waterLevel.ts`, named `PROVISIONAL_WATER_LEVEL_PERCENTAGES` and `PROVISIONAL_FLOOD_WATER_LEVEL_CODE`. Only `water_level = 1` (mapped to 20%) carries real hardware-validation evidence. Every other rung of the ladder, and the flood threshold itself, stay provisional until a natural pump cycle validates the progression. This checklist names exactly what remains unvalidated and what a future session needs to record; closing G-002 is one reviewable edit to `waterLevel.ts` afterward.

**No item below may be marked "passed" from this phase's own evidence.** This checklist was written, not executed. Every item starts `status: pending`.

## The one existing data point (prior evidence -- do not re-ask for this)

A real, unforced `water_level` transition from `1` to `3` was observed on live hardware on 2026-08-31, mapping 20% to 40%. It exists today only in a session transcript, not in a structured record. **This checklist does not re-ask for that observation -- code `3` is already measured.** Record it in this file's evidence section the first time this checklist is run, then treat it as settled.

## The full ladder, for reference

The four still-unvalidated codes, and the flood threshold, at a glance:

- 0 -- empty pit, no sensor wet, 0%
- 7 -- third sensor wet, 60%
- 15 -- fourth sensor wet, 80%
- 31 -- all five sensors wet, 100%, and the flood threshold

| Code | Provisional percentage        | Status                                                 |
| ---- | ----------------------------- | ------------------------------------------------------ |
| 0    | 0%                            | Unvalidated -- see item 1                              |
| 1    | 20%                           | **Validated** (real hardware, pre-2026-08-31)          |
| 3    | 40%                           | **Validated** (real hardware, 2026-08-31 -- see above) |
| 7    | 60%                           | Unvalidated -- see item 2                              |
| 15   | 80%                           | Unvalidated -- see item 3                              |
| 31   | 100%, and the flood threshold | Unvalidated -- see item 4                              |

## Items

### 1. Code `0` -- empty pit

test: Observe a natural transition into `water_level = 0` (no sensor wet) -- for example, after the pit has been pumped fully dry, or before it has collected any water. Record the corresponding real pit condition: is the pit visibly empty, is there a small residual amount below the lowest sensor, etc.

expected: A confirmed real-world pit condition matching `water_level = 0`, and confirmation that the plugin reports `WaterLevel = 0` and raises no fault (`waterLevel.ts` deliberately treats `0` as a level, not a failure -- this item confirms that reading matches reality).

why_human: No fake can answer what a real, physically empty sump pit reports. The fake harness's `fakeShadowBroker.ts` sends whatever value a scenario tells it to send; it cannot be evidence for what a real Gemini reports at zero.

status: pending

### 2. Code `7` -- third sensor wet

test: Observe a natural transition into `water_level = 7` during a rising or falling water cycle. Record the corresponding real pit condition (how full the pit appears, ideally with a photo or a measured depth if practical).

expected: A confirmed real-world pit condition matching `water_level = 7`, and confirmation that the plugin reports `WaterLevel = 60`.

why_human: The 60% figure is presently an assumption from the thermometer code's bit pattern, not a measurement -- only watching a real pit at that exact code can confirm or correct it.

status: pending

### 3. Code `15` -- fourth sensor wet

test: Observe a natural transition into `water_level = 15` during a rising or falling water cycle. Record the corresponding real pit condition.

expected: A confirmed real-world pit condition matching `water_level = 15`, and confirmation that the plugin reports `WaterLevel = 80`.

why_human: Same reasoning as item 2 -- this rung has never been observed on real hardware.

status: pending

### 4. Code `31` and the flood threshold

test: Observe a natural transition into `water_level = 31` (all five sensors wet). Record the corresponding real pit condition, and confirm whether the pit is genuinely flooding at that point -- this is the value `isPitFlooded()` treats as the flood threshold, matching vendor rule `WW-GEM-ALERT-7` (`water_level > 15`).

expected: A confirmed real-world pit condition matching `water_level = 31`, confirmation that the plugin reports `WaterLevel = 100`, and a plain answer to "is this actually flooding" -- the flood threshold's whole justification.

why_human: This is the safety-critical rung. `Sump Pit Flood`'s truthfulness rests entirely on `31` corresponding to a real flood condition, and nobody has watched a real pit reach it.

status: pending

## Forcing the rare codes, if nature does not cooperate

Codes `0`, `7`, `15`, and `31` may not occur naturally within a convenient observation window -- a pit that drains fully to `0` or floods to `31` may be rare by design. If you build any temporary tooling to force a specific `water_level` value for observation, follow the discipline already established for exactly this kind of work: build it, verify it against the real device, use it to make your one observation, then revert it and never commit it. See `.planning/phases/04-pump-records-and-official-controls/04-UAT.md`, section "Deferred session, 2026-09-04," for the exact recorded precedent and the measured effect of forcing `{"water_level": 99}` (an out-of-domain code, useful for a different check, not for validating a real in-domain rung). **Forcing a code only tells you what the plugin does with that code -- it cannot tell you what a real pit looks like at that code.** Item completion for 0, 7, 15, and 31 requires a real, physically observed pit condition, not just a forced telemetry value; use forcing only to rehearse the observation procedure, not to substitute for it.

## After running this checklist

Record results in this file (update each item's `status` to `passed` or `failed` with an `evidence:` block, following `04-UAT.md`'s structure). Update `src/device/waterLevel.ts`'s `PROVISIONAL_WATER_LEVEL_PERCENTAGES` and `PROVISIONAL_FLOOD_WATER_LEVEL_CODE`, and their doc comments, only if a measurement contradicts what is currently assumed. Report the outcome in `.planning/STATE.md`'s G-002 row.
