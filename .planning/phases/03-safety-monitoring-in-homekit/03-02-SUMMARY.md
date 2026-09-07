---
phase: 03-safety-monitoring-in-homekit
plan: 02
subsystem: device
tags: [homekit, trust-scope, validation, water-level, battery, gemini]

requires:
  - phase: 02-safe-gemini-discovery-and-identity
    provides: the DeviceFamily contract, the Gemini field checks, and the TrustScope union this plan reworks
provides:
  - one explicit provisional water-level ladder and flood threshold, in a single module
  - per-field trust-scope ownership on every FieldViolation
  - a partial decode path where one invalid field omits one scope and no other
  - the Gemini battery protection bands and low-battery health codes as explicit lookups
  - a gate-enforced source condition keeping every freshness signal out of the device tier
affects: [sump pit services, battery services, accessory trust marking, service catalogue]

actuals:
  tokens: 18551
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A provisional constant says so in its identifier, and every provisional value for one gate lives in one module"
    - "A table row carries the scope that owns its field; one loop stamps that scope onto every violation"
    - "A scope decodes strictly or is absent; the adapter never fills an untrusted scope with a default"
    - "A defensive guard behind a gate is covered by constructing the broken contract it names, not by a coverage exception"

key-files:
  created:
    - src/device/waterLevel.ts
    - test/device/waterLevel.test.ts
  modified:
    - src/device/family.ts
    - test/device/family.test.ts
    - src/device/gemini.ts
    - test/device/gemini.test.ts
    - test/accessories/basementGuardian.test.ts

key-decisions:
  - "The six Gemini group interfaces were not declared. The family-neutral group interfaces already carry exactly Gemini's members, so `GeminiDomainState` is an alias of `ScopedDomainState`; an empty `interface X extends Y {}` is an error under @typescript-eslint/no-empty-object-type and re-declaring identical members would duplicate them across two files."
  - "decode() runs the two check tables per source rather than calling validate() once, so a malformed command-surface field (scope `undefined`) cannot blank device metadata. Gating metadata on a merged `has(undefined)` would have broken the plan's own truth that no other scope is affected."
  - "HOURS_OF_PROTECTION_VALUES is derived from the protection-band map, so the codes the shape check accepts and the codes the band lookup answers for cannot drift apart."
  - "The strict readers' throw guards became unreachable once decode() gates on validation. They were kept and covered through a public-behavior case that constructs the broken contract the guard names, rather than deleted or exempted from coverage."
  - "The D-10 scope fence is enforced by a source-condition test over the three device-tier modules, proven against a real violation, not only by review."

patterns-established:
  - "Provisional-until-a-gate constants: named PROVISIONAL_*, gathered in one module, with the gate ID in the module header"
  - "Per-field scope ownership: the check table row owns the scope, violationsOf stamps it, and one data-driven case per field pins it"
  - "Partial decode: one strict decoder per scope group, called only when that group's own fields all validated"

requirements-completed: [SAFE-01, RES-01]

coverage:
  - id: D1
    description: "Every legal water_level code maps to a percentage through one explicit six-entry ReadonlyMap: 0->0, 1->20, 3->40, 7->60, 15->80, 31->100, with code 0 reporting 0 percent and no fault"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "test/device/waterLevel.test.ts#SAFE-01 reports water_level <code> as <percentage> percent (6 cases)"
        status: pass
      - kind: unit
        ref: "test/device/waterLevel.test.ts#D-01 maps the six legal water_level codes and no others"
        status: pass
    human_judgment: false
  - id: D2
    description: "An unmapped water_level code produces no level at all: waterLevelPercentage throws rather than answering, and the flood threshold is a single named constant at 31"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "test/device/waterLevel.test.ts#SAFE-01 refuses to invent a level for the illegal code <code> (2, 16, 30, 32, -1, 1.5)"
        status: pass
      - kind: unit
        ref: "test/device/waterLevel.test.ts#D-03 places exactly one legal code at or above the flood threshold"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every FieldViolation names the TrustScope that stops being trustworthy while that field is invalid, for all three reasons, across all eighteen telemetry and four metadata fields"
    requirement: RES-01
    verification:
      - kind: unit
        ref: "test/device/gemini.test.ts#RES-01 attributes a wrong-type <field> violation to the <scope> scope (22 cases)"
        status: pass
      - kind: unit
        ref: "test/device/gemini.test.ts#RES-01 attributes a missing <field> violation to the <scope> scope (16 cases)"
        status: pass
      - kind: unit
        ref: "test/device/gemini.test.ts#RES-01 attributes an out-of-domain <field> violation to the <scope> scope (3 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A snapshot with one invalid field decodes every other scope normally; the scope owning the invalid field is undefined rather than partly populated or defaulted"
    requirement: RES-01
    verification:
      - kind: unit
        ref: "test/device/gemini.test.ts#RES-01 omits the <scope> scope and no other when <field> is invalid (6 cases)"
        status: pass
      - kind: unit
        ref: "test/device/gemini.test.ts#SAFE-01 omits the water scope for an out-of-domain water_level while every other scope keeps its current values"
        status: pass
      - kind: unit
        ref: "test/device/gemini.test.ts#RES-01 omits the whole battery scope for an out-of-domain battery_health, leaving no partly populated group"
        status: pass
      - kind: unit
        ref: "test/device/gemini.test.ts#RES-01 keeps every scope when the command-surface field <field> is invalid (3 cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The battery publishes the reported protection band and the low-battery verdict without arbitrating one vendor field from another"
    verification:
      - kind: unit
        ref: "test/device/gemini.test.ts#D-08 publishes the reported protection band even when battery_health reports NotDetected"
        status: pass
      - kind: unit
        ref: "test/device/gemini.test.ts#D-07 reports the battery as low=<low> for health <code> with battery_voltage_low <flag> (7 cases)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The field-validity half of RES-01 ships with no freshness policy attached: no device-tier module reads a clock, a timestamp, or an interval"
    requirement: RES-01
    verification:
      - kind: unit
        ref: "test/device/gemini.test.ts#D-10 keeps every freshness signal out of the device tier"
        status: pass
      - kind: unit
        ref: "test/device/gemini.test.ts#D-10 decodes a snapshot identically however long ago it was received"
        status: pass
    human_judgment: false
  - id: D7
    description: "A reader cannot mistake the placeholder ladder for a calibrated one, and closing G-002 is a single reviewable edit"
    requirement: SAFE-01
    verification: []
    human_judgment: true
    rationale: "The plan records this prohibition with `verification: judgment`. Automation can prove the identifiers contain the word `provisional` and that all six values live in one module, but whether the module header actually stops a reader from treating the ladder as measured is a reading judgment. A human should read src/device/waterLevel.ts lines 1-42."

duration: 42min
completed: 2026-08-30
status: complete
---

# Phase 03 Plan 02: The Water Ladder and Per-Field Trust Scoping Summary

**An explicit six-entry water-level ladder that an illegal code can never reach, and a Gemini adapter that decodes the scopes which validated while omitting only the scope that owns a bad field.**

## Performance

- **Duration:** 42 min
- **Started:** 2026-08-30T13:50:48Z
- **Completed:** 2026-08-30T14:32:00Z
- **Tasks:** 3
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- `src/device/waterLevel.ts` holds the whole provisional surface for G-002 in one module: a six-entry `ReadonlyMap` (`0->0, 1->20, 3->40, 7->60, 15->80, 31->100`), the single `PROVISIONAL_FLOOD_WATER_LEVEL_CODE = 31` that `isPitFlooded` compares against with `>=`, and a `waterLevelPercentage` that throws rather than answering for an unmapped code. No arithmetic, shift, or set-bit count anywhere in the module.
- `FieldViolation` now carries `scope: TrustScope | undefined`. The Gemini check tables carry a scope per row and one five-line loop stamps it onto every violation, so all eighteen telemetry and four metadata fields report their owning scope for `missing`, `wrong-type`, and `out-of-domain` alike.
- `src/device/family.ts` declares `ScopedDomainState` and seven family-neutral group interfaces. Every member is `| undefined` rather than optional, so a family that forgets a scope fails to typecheck; the type-only test pins that with a `@ts-expect-error` proven against a weakened contract.
- `geminiFamily.decode()` builds each group only when that group's own fields all validated. A snapshot with `water_level: 2` yields `water: undefined` and full, current `pump`, `power`, `battery`, `fault`, `connectivity`, and `metadata` groups.
- Device metadata is judged on its own fields, so a malformed `test_running` (which owns no scope) leaves the firmware versions intact.
- The Gemini battery value domain resolves through explicit lookups: the `1->25, 2->50, 4->75, 8->100` protection bands published as reported even when `battery_health` is `32` (D-08), and `low` from `battery_voltage_low` or health `1`, `2`, `32` (D-07).
- A source-condition test keeps the clock port, `Date.now`, timers, `receivedAt`, and `deviceTimestamp` out of all three device-tier modules (D-10).

## Task Commits

1. **Task 1: the provisional water-level ladder and flood threshold** - `7c66932` (feat)
2. **Task 2: scope-aware violations and the partial-decode contract** - `0a56bfe` (feat)
3. **Task 3: field-to-scope rows, the ladder consumer, and partial decode** - `4c8c954` (feat)

**Plan metadata:** see the `docs(03-02)` commit that carries this file.

## Files Created/Modified

- `src/device/waterLevel.ts` (new) - the provisional D-01 ladder, the D-03 flood threshold, `waterLevelPercentage`, and `isPitFlooded`.
- `test/device/waterLevel.test.ts` (new) - 22 cases: one per ladder row, one per rejected code, and the three structural cases.
- `src/device/family.ts` - `FieldViolation.scope`; `WaterState`, `PumpState`, `PowerState`, `BatteryState`, `FaultState`, `ConnectivityState`, `DeviceMetadataState`, and `ScopedDomainState`; the partial-decode contract on `DeviceFamily.decode`.
- `test/device/family.test.ts` - scope on every violation literal, two positive `ScopedDomainState` literals, one `satisfies` per group interface, and two new `@ts-expect-error` negatives.
- `src/device/gemini.ts` - `GeminiFieldScope`, `FieldFault`, `TelemetryCheck`, scoped check tables, seven group decoders, the protection-band and low-battery lookups, and the gated `decode()`.
- `test/device/gemini.test.ts` - 88 cases: the 41-case scope table, the partial-decode cases, the battery rows, the guard cases, and the D-10 source condition.
- `test/accessories/basementGuardian.test.ts` - nine `FieldViolation` literals gained `scope: 'water'` so the file still typechecks against the new contract. No production behaviour changed.

## Verification

Recorded rather than asserted, because a single green run is not a green gate here.

- `npm run check` - exit 0 on **three consecutive runs** (`typecheck` -> `lint` -> `fallow` -> `format:check` -> `test`).
- `npm run test:coverage:direct -- dist-test/src/device/waterLevel.js dist-test/test/device/waterLevel.test.js` - 22/22, `waterLevel.js` 100.00 lines / 100.00 branches / 100.00 functions, exit 0.
- `npm run test:coverage:direct -- dist-test/src/device/family.js dist-test/test/device/family.test.js` - exit 0; a type-only pair reports 100% trivially, so the exit code is the signal that every `@ts-expect-error` still matches.
- `npm run test:coverage:direct -- dist-test/src/device/gemini.js dist-test/test/device/gemini.test.js` - 88/88, `gemini.js` 100.00 / 100.00 / 100.00, exit 0.
- Unit suite - 672 passed, 0 failed, 0 skipped, 0 todo. Cucumber - 50/50 scenarios, 406/406 steps.

### Negative controls on the defects these tests close

A passing test is not evidence, so each load-bearing assertion was shown to fail against the defect it forbids.

1. **The population-count prohibition.** `waterLevelPercentage` was patched to `code.toString(2).split('').filter((bit) => bit === '1').length * 20`. That formula agrees with the ladder on **every legal code** - 16 of 22 cases still passed - and the run failed exactly the six rejection cases (`2`, `16`, `30`, `32`, `-1`, `1.5`). This is the precise reason the prohibition matters: a set-bit count is indistinguishable from the ladder on legal input and silently invents a level on illegal input. Patch reverted; 22/22 restored.
2. **`FieldViolation.scope` is required.** `scope` was weakened to optional. `tsc -p tsconfig.test.json` then reported `test/device/family.test.ts(86,1): error TS2578: Unused '@ts-expect-error' directive`, exit 2. Restored.
3. **`ScopedDomainState` states absence rather than omitting it.** `metadata` was weakened to optional. `tsc -p tsconfig.test.json` reported `test/device/family.test.ts(88,1): error TS2578`, exit 2. Restored.
4. **The D-10 scope fence.** `decode()` was patched to read `snapshot.receivedAt`. The source-condition case failed (88 tests, 87 pass, 1 fail). Restored; 88/88.

## Decisions Made

- **The six Gemini group interfaces were not declared.** Task 3 asks for `GeminiWaterState` and five siblings, each satisfying its `family.ts` counterpart. The family-neutral interfaces the plan specifies already carry exactly Gemini's members, so the Gemini versions would be empty extensions - an error under `@typescript-eslint/no-empty-object-type` (`allowInterfaces` defaults to `never`) - or verbatim re-declarations across two files. `GeminiDomainState` is instead `export type GeminiDomainState = ScopedDomainState`, the group decoders return the family-neutral types directly, and `decode()` therefore returns a `ScopedDomainState` exactly as the plan's `key_links` require.
- **`decode()` does not call `validate()`.** It runs `violationsOf(TELEMETRY_CHECKS, data)` and `violationsOf(METADATA_CHECKS, metadata)` separately - the same single pass over each table that `validate()` makes. The plan asks for one `validate()` call plus a violated-scope set, but metadata fields and command-surface fields both carry `scope: undefined`, so a merged set would blank the firmware versions whenever `test_running` was malformed. That contradicts the plan's own truth that "no other scope is affected".
- **The legal `hours_of_protection` codes are derived from the band map** (`new Set(PROTECTION_HOURS_PERCENTAGES.keys())`), so the set the shape check accepts and the set the band lookup answers for cannot drift apart in a later edit.
- **The strict readers keep their throw guards, and the guards are covered rather than exempted.** Once `decode()` gates each group on that group's own validation, `booleanField`, `numberField`, `optionalStringField`, and the protection-band lookup can no longer throw through the public path - their branches became unreachable, which would have failed the required 100% branch coverage. The project rule forbids coverage exceptions and says to remove dead code or cover it through public behaviour. The guards are worth keeping (they are what makes a broken gate fail loudly instead of publishing a default), so they are covered by four cases that construct precisely the condition the guard message names: a record whose field answers correctly while `validate()` inspects it and differently afterwards. No symbol was exported for a test.
- **`family.ts` lost its "declaration only" header sentence.** It named an `ignoreFindings` entry in `.fallowrc.json` that does not exist, and after this plan every declaration in the module has a production consumer. `.fallowrc.json` itself was not touched - it remains plan 03-08's alone.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 2's contract change forced the validate-side consumer update into Task 2's commit**

- **Found during:** Task 2
- **Issue:** Adding a required `scope` to `FieldViolation` immediately broke `src/device/gemini.ts` (four `FieldCheck` factories) and `test/accessories/basementGuardian.test.ts` (nine violation literals). Task 2's own `<verify>` requires `npm run typecheck` to pass, and the `npm typecheck` pre-commit hook runs project-wide, so the contract and its consumer cannot land in separate commits.
- **Fix:** Task 2's commit carries the family contract, the Gemini field-to-scope rows, the `violationsOf` stamping, and the validate-side tests. Task 3 kept the decode-side work. The commit boundary moved from "family vs gemini" to "validate side vs decode side", which is a real seam and leaves both commits green.
- **Files modified:** `src/device/gemini.ts`, `test/device/gemini.test.ts`, `test/accessories/basementGuardian.test.ts`
- **Verification:** `npm run typecheck` exit 0 and 639/639 unit tests at that commit.
- **Committed in:** `0a56bfe`

**2. [Rule 3 - Blocking] `test/accessories/basementGuardian.test.ts` is outside the plan's `files_modified`**

- **Found during:** Task 2
- **Issue:** Nine `{ field: 'water_level', reason: 'missing' }` literals stopped satisfying `FamilyValidation`.
- **Fix:** Each gained `scope: 'water'`. Nothing else in the file changed; `createBasementGuardianAccessory` still degrades all five scopes together, which is the behaviour a later plan in this phase reworks.
- **Files modified:** `test/accessories/basementGuardian.test.ts`
- **Verification:** `npm run build:test` exit 0; the file's own cases still pass.
- **Committed in:** `0a56bfe`

**3. [Rule 3 - Blocking] `GeminiTelemetryState` and `GeminiMetadataState` removed**

- **Found during:** Task 3
- **Issue:** The plan declares `GeminiTelemetryState`'s removal as intentional. `GeminiMetadataState` is likewise fully replaced by `DeviceMetadataState`, and leaving it exported with no consumer fails `fallow dead-code --fail-on-issues`.
- **Fix:** Both removed. Neither had a consumer outside `src/device/gemini.ts`, confirmed by grep across `src/`, `test/`, and `features/`. `GeminiTelemetryField` and `GeminiMetadataField` are unchanged, as the plan requires.
- **Files modified:** `src/device/gemini.ts`
- **Verification:** `npm run fallow` passes; `npm run check` exit 0 three times.
- **Committed in:** `4c8c954`

**4. [Rule 1 - Bug] `delete telemetry[field]` violated `@typescript-eslint/no-dynamic-delete`**

- **Found during:** Task 2
- **Issue:** The data-driven missing-field loop deleted a computed key, which the lint gate refuses.
- **Fix:** Added `telemetryWithout(field)`, which rebuilds the record without that one entry.
- **Files modified:** `test/device/gemini.test.ts`
- **Verification:** `npm run lint` exit 0.
- **Committed in:** `0a56bfe`

**5. [Rule 3 - Blocking] The `@ts-expect-error` for a `ScopedDomainState` missing a group member had to be a single-line literal**

- **Found during:** Task 2
- **Issue:** `@ts-expect-error` suppresses only the following line. Against a multi-line `void ({ ... } satisfies ScopedDomainState)`, TypeScript reports TS1360 on the `} satisfies` line, so the directive read as unused (TS2578) and the real error surfaced anyway.
- **Fix:** The negative case is one line.
- **Files modified:** `test/device/family.test.ts`
- **Verification:** Proven by negative controls 2 and 3 above.
- **Committed in:** `0a56bfe`

---

**Total deviations:** 5 auto-fixed (4 blocking, 1 bug).
**Impact on plan:** No scope change. Four of the five were forced by gates the plan itself requires (`npm run typecheck`, `npm run lint`, `npm run check`) or by the project rule against `--no-verify`. The one design departure - not declaring the six Gemini group interfaces - is recorded under Decisions Made with its reasoning, and it satisfies the plan's `must_haves` and `key_links` unchanged.

## Issues Encountered

**Defensive guards behind a gate are unreachable, and this project forbids both a coverage exception and a silent default.** Gating each group decoder on that group's validation closed the only path to the readers' `throw` statements. The plan requires the guards be kept, the testing rules require 100% branch coverage on the pair with no exception, and safety forbids replacing the guard with a value the module guesses. The resolution is four cases that construct the exact broken contract the guard message names. This is worth flagging for later plans in this phase: any new strict decoder placed behind a validation gate will hit the same wall.

**The first Task 3 commit did not land.** Its title was 77 characters and `gitlint` enforces a 72-character maximum, so the pre-commit hook rejected the commit outright - nothing was committed. It was retried with a shorter title (`4c8c954`), not amended.

**`03-PATTERNS.md` and the plan disagree on the ladder's path.** The pattern map places it at `src/accessories/waterLevel.ts`; the plan's `files_modified`, `must_haves.artifacts`, and `key_links` all say `src/device/waterLevel.ts`. The plan was followed, and `src/device/` is the right tier: the ladder is a family value domain, not a HomeKit concern.

**Nothing consumes the partial decode yet.** `createBasementGuardianAccessory.update()` still calls `validate()`, treats any violation as total, and degrades all five scopes together. That is the accessory-tier rework a later plan in this phase owns, and it is outside this plan's `files_modified` - but phase success criterion 6 is not met end to end until it lands. The device tier now supplies everything that rework needs.

**`RES-01` coverage here is partial by design.** The plan's own `<flagged_assumptions>` records it: this plan proves "the last valid value is preserved" against invalid and omitted input only, never against elapsed time, because `D-10` defers the time-based half. A reviewer should not read this plan's `RES-01` completion as the whole requirement.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for the rest of this phase.

- The `Sump Pit Level` and `Sump Pit Flood` services have their values: `water.levelCode` for the raw vendor code D-15 requires beside the mapped percentage, `water.levelPercent` for `WaterLevel`, and `water.flooded` for the Leak Sensor.
- The Battery services have `battery.levelPercent`, `battery.low`, `battery.charging`, and the exact `healthCode` / `protectionHoursCode` facts.
- The five fault adapters have `fault.*`, and `fault.controllerLinkPresent` is reported verbatim so the D-11 poison-set logic can invert it once, in the accessory.
- A scope that did not validate arrives as `undefined`, which is the signal the accessory needs to set `StatusActive = false` while retaining its last valid values (D-05, D-014).
- `.fallowrc.json` was not touched; it remains plan 03-08's alone.

Concerns: the accessory-tier consumer noted above, and the guard-coverage wall any future gated decoder will hit.

## Self-Check: PASSED

- All six plan files plus `test/accessories/basementGuardian.test.ts` exist on disk.
- All three task commits resolve: `7c66932`, `0a56bfe`, `4c8c954`.
- `git cat-file -e HEAD:src/device/waterLevel.ts` and `HEAD:test/device/waterLevel.test.ts` confirm both created files are in the committed tree.
- `npm run check` exit 0 on three consecutive runs against the committed tree.

---
*Phase: 03-safety-monitoring-in-homekit*
*Completed: 2026-08-30*
