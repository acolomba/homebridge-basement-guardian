completed: 2026-09-05
---
created: 2026-08-31T14:32:13.700Z
title: Record G-002 natural water-level evidence
area: general
severity: major
files:

  - src/device/waterLevel.ts
  - .planning/STATE.md

---

## Resolved

Closed 2026-09-05 during the v1.0 milestone audit. Phase 6 plan 06-09 recorded this evidence in
`STATE.md` ("G-002's existing 1-to-3 water-level transition (observed 2026-08-31, mapped 20% to
40%) is recorded as prior evidence, not re-asked for") and in `dev/prep/g002-water-level-checklist.md`'s
evidence table, which marks codes `1` and `3` "Validated" and names the remaining unvalidated
codes (`0`, `7`, `15`, `31`) and the flood threshold. The checklist's own evidence section still
records the date/instrument/control detail the first time it is run against real hardware, per
its own text -- this todo's ask (do not lose the observation) is satisfied; G-002 itself stays
open pending the remaining codes.

## Problem

Release gate `G-002` needs the Gemini water-level codes and the flood threshold
validated during a natural pump cycle. On 2026-08-31, a UAT session against the
real vendor account observed part of that cycle, and the observation exists only
in a session transcript. Nothing in `.planning/` records it.

What was observed: the pit's reported `water_level` rose from code `1` to code
`3` with no intervention, and the provisional ladder in `src/device/waterLevel.ts`
mapped it from 20% to 40% on the published `WaterLevel` characteristic.

The observation was read from the live HAP accessory database with
`dev/hb observe`, against a real Homebridge process holding the real device. It
was separated from a test-override artefact deliberately: the session forced code
`7`, cleared the override, and confirmed the value returned to `3` rather than to
`7`. A value that returns to something the test never wrote is the device's own
reading, not a stuck scaffold.

This matters because the evidence cannot be re-created on demand. Codes only
advance when the pit actually fills, so re-obtaining it means waiting for real
weather and a real pump cycle.

Codes `0`, `7`, `15` and `31` are still unvalidated on real hardware, and so is
`PROVISIONAL_FLOOD_WATER_LEVEL_CODE`. `G-002` stays open.

## Solution

Record the `1` to `3` transition against `G-002` where the gate is tracked, with
the date, the instrument, and the control that separated it from the override.
Keep the remaining codes and the flood threshold listed as open, so a reader
cannot mistake partial evidence for a closed gate.

Do not change `src/device/waterLevel.ts`. The constants stay `PROVISIONAL_` until
the whole ladder is validated — that is the point of the naming, and one observed
rung does not close it.
