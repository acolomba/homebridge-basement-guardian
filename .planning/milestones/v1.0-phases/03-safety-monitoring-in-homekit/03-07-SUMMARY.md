---
phase: 03-safety-monitoring-in-homekit
plan: 07
subsystem: testing
tags: [cucumber, homekit, hap, gherkin, static-analysis, timers, safety]

requires:
  - phase: 03-05
    provides: All fifteen catalogue rows, so a scenario can name any published service by its display name
  - phase: 03-06
    provides: The store subscription, the DiscoveryContext pass-through for ignoredFaults, and the three runtime immediacy layers this plan's fourth layer completes
provides:
  - Seven end-to-end scenarios driving the real plugin against the fake vendor cloud, one per safety transition this phase publishes
  - A published-value step that compares whole numbers, so a scenario reads a water level and a raw thermometer code rather than booleans alone
  - One alarm vocabulary covering both the leak sensor and the seven contact adapters
  - A Given carrying an administrator's suppressed adapters into the DiscoveryContext the harness builds
  - The fourth immediacy layer, a static import gate over src/accessories with two proven negative controls

affects: [03-08]

actuals:
  # Same scale 03-06 used: chars/4 over the whole text of the files actually
  # changed (46,044 chars), not over the diff (21,062 chars, which would read
  # 5,266). Recorded on 03-06's scale so the two are comparable.
  tokens: 11511
  tasks: 2
  commits: 5

tech-stack:
  added: []
  patterns:
    - Static source-text gate over a directory read from disk, floored on the file count so a wrong path fails instead of passing vacuously
    - A detector proven twice: once that it fires on every spelling it must catch, once that it stays quiet on a mention and an unrelated import
    - Multi-line template literals for source-text fixtures, the one string form this repository's prettier and eslint settings both accept

key-files:
  created:
    - test/accessories/timerFreedom.test.ts
  modified:
    - features/safetyMonitoring.feature
    - features/support/steps/homekit.ts
    - features/support/steps/configuration.ts
    - features/support/world.ts

key-decisions:
  - "Both alarm characteristics activate at 1 and rest at 0, so one pair of sensor steps covers the leak sensor and the seven contact adapters instead of two near-identical pairs"
  - "The static gate reads an import rather than a mention, so this gate's own prose naming the forbidden modules does not report itself"
  - "The gate accepts either quote character around a specifier, because a module that reached for deferred execution is already a module that got something wrong"
  - "The repository root is three levels up, not the two the plan specified, because this gate lives one directory deeper than the module the plan pointed at"
  - "Every commit is typed test, because this plan ships no production code and a feat commit would claim a feature that does not exist"

patterns-established:
  - "Cucumber RED/GREEN: a feature file committed before its bindings fails with undefined steps and named assertion errors while still passing lint, typecheck, format, and fallow"
  - "Falsify a scenario against production code, not against the harness: each defect is patched back into src/ and the failing scenario is read by name"

requirements-completed: [SAFE-01, SAFE-03, SAFE-04, SAFE-07, CONF-06, RES-01, RES-02]

coverage:
  - id: D1
    description: "The flood sensor activates at water-level code 31 and not at 15, and the pit-level service publishes the mapped percentage beside the raw code"
    requirement: SAFE-01
    verification:
      - kind: e2e
        ref: "features/safetyMonitoring.feature#A rising water level reaches the flood sensor and the pit level"
        status: pass
    human_judgment: false
  - id: D2
    description: "A flooding pit reaches the flood sensor after the scenario clock has advanced by zero, so no elapsed scenario time could have produced the transition"
    requirement: SAFE-07
    verification:
      - kind: e2e
        ref: "features/safetyMonitoring.feature#A flooding pit reaches the flood sensor with no elapsed scenario time"
        status: pass
    human_judgment: false
  - id: D3
    description: "A backup-pump activation publishes while a self-test is running, unsuppressed, and neither the mains-lost nor the primary-pump-fault adapter moves, so no cause is invented"
    requirement: SAFE-03
    verification:
      - kind: e2e
        ref: "features/safetyMonitoring.feature#A backup pump activation publishes while a self test runs"
        status: pass
    human_judgment: false
  - id: D4
    description: "A partial heartbeat carrying only legal values leaves every scope it does not touch trusted and still publishing its current values, and updates the scope it does carry"
    requirement: RES-01
    verification:
      - kind: e2e
        ref: "features/safetyMonitoring.feature#A partial heartbeat leaves every scope it does not carry trusted"
        status: pass
    human_judgment: false
  - id: D5
    description: "serial_communications turning false activates Pump Controller Link Lost, deactivates the controller-derived services with their published values unchanged, leaves the offline adapter clear, and a following true clears it"
    requirement: RES-02
    verification:
      - kind: e2e
        ref: "features/safetyMonitoring.feature#A lost pump controller link deactivates the services derived from it"
        status: pass
    human_judgment: false
  - id: D6
    description: "An equipment fault activates its own adapter and moves the owning service's StatusFault while the other four adapters stay clear"
    requirement: SAFE-04
    verification:
      - kind: e2e
        ref: "features/safetyMonitoring.feature#A primary pump fault activates its own adapter alone"
        status: pass
    human_judgment: false
  - id: D7
    description: "An ignoredFaults entry removes only its own Contact Sensor while the owning service, its status characteristics, and every other adapter stay published"
    requirement: CONF-06
    verification:
      - kind: e2e
        ref: "features/safetyMonitoring.feature#An ignored fault adapter removes its own sensor alone"
        status: pass
    human_judgment: false
  - id: D8
    description: "No file under src/accessories imports a deferred-execution module from the Node standard library, over a directory read from disk with a floor on the enumerated count"
    requirement: SAFE-07
    verification:
      - kind: unit
        ref: "test/accessories/timerFreedom.test.ts#no module in the accessories tier imports deferred execution from the node standard library (SAFE-07, D-18)"
        status: pass
    human_judgment: false
  - id: D9
    description: "The static gate is shown to detect a planted import in every spelling it must catch, and shown not to fire on a comment naming the same modules or on an unrelated Node import"
    requirement: SAFE-07
    verification:
      - kind: unit
        ref: "test/accessories/timerFreedom.test.ts#reports a planted deferred-execution import in every spelling it is meant to catch (SAFE-07)"
        status: pass
      - kind: unit
        ref: "test/accessories/timerFreedom.test.ts#reports neither a comment naming the modules nor an unrelated node import (SAFE-07)"
        status: pass
    human_judgment: false
  - id: D10
    description: "Real end-to-end latency from a reported vendor condition to a HomeKit notification, against the real vendor cloud"
    requirement: SAFE-07
    verification: []
    human_judgment: true
    rationale: "The four layers together prove the plugin adds no deferral of its own. None of them measures wall-clock latency against the real vendor: the immediacy scenario's clock step is a no-op against code that reads no clock while publishing, and its wait for a poll is real time bounded by a 2-second step deadline. Whether an owner's phone buzzes promptly depends on the vendor's own publish cadence and on Apple's notification path, and only the real-home session can settle it."

duration: 45 min
completed: 2026-08-30
status: complete
---

# Phase 3 Plan 7: End-to-End Safety Scenarios and the Static Immediacy Gate Summary

**Every safety transition this phase publishes is now observable end to end against the fake vendor cloud, each scenario proven by patching its defect back into production code, and the accessories tier is proven unable to reach for deferred execution at all by a static gate that is itself proven to discriminate an import from a mention.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-08-30T19:00:29Z
- **Completed:** 2026-08-30T19:45:43Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- Seven scenarios in `features/safetyMonitoring.feature` drive the real plugin — fake Auth0, fake REST, fake shadow broker, real runtime, real platform, real accessory, the HAP stand-in — and read a published characteristic value back off the one accessory the harness registered. The suite went from 54 scenarios and 444 steps to 61 and 537.
- Every one of the seven was falsified against production code, ten defects in all, each naming the scenario it was meant to name. No scenario in the file passes on the presence of a service alone.
- `test/accessories/timerFreedom.test.ts` closes the fourth immediacy layer. It enumerates `src/accessories/` from disk, floors the enumerated count at the six modules that tier holds, and asserts none imports `node:timers` or `node:timers/promises`. Eight defects were patched into the gate and into the tier it reads; each fired on exactly the case meant to catch it.
- The gate's two negative controls make it a check rather than an assumption: one plants every import spelling it must catch, the other holds a comment naming the same modules and an unrelated Node import that it must not report. The second control is the one that failed at RED, which is the design point the whole file exists to make.
- `Given the plugin ignores these fault adapters:` carries an administrator's suppression list from a scenario into the `DiscoveryContext` the harness builds, and refuses a slug the plugin never publishes.

## Task Commits

Each task ran RED then GREEN, and each gate was committed separately:

1. **Scenarios: every safety transition, end to end** — `2067089` (RED) then `55772f5` (GREEN)
2. **The static immediacy gate and its negative control** — `442b715` (RED) then `47af0e5` (GREEN)
3. **Acceptance-criteria fix** — `eb414cc`, closing the suppression scenario on a published value

Every commit is typed `test`. See *TDD Gate Compliance* below for why, and for what that costs.

## Files Created/Modified

- `test/accessories/timerFreedom.test.ts` — the forbidden-specifier table, the import detector, the directory enumeration with its floor, and seven fixture strings across two negative controls.
- `features/safetyMonitoring.feature` — seven scenarios under the existing `Background`.
- `features/support/steps/homekit.ts` — `publishedValue` in place of `booleanValue`, and `untilAlarmState` in place of `untilContactState`.
- `features/support/steps/configuration.ts` — `Given the plugin ignores these fault adapters:` and the slug check behind it.
- `features/support/world.ts` — the `ignoredFaults` field, read by both the runtime configuration and the `DiscoveryContext` the harness builds.

## Decisions Made

- **One alarm vocabulary for two characteristics.** `ContactSensorState.CONTACT_NOT_DETECTED` and `LeakDetected.LEAK_DETECTED` are both `1`, and both quiet states are `0`. A sensor step therefore reads whichever of the two the named service carries, rather than a second near-identical pair of steps for the leak sensor. A service carries exactly one of the two, so the read is unambiguous; a service carrying neither reads `undefined` and the step fails on its deadline with a named failure.
- **The gate reads an import, not a mention.** Matching the module name wherever it appears would report this gate's own `@fileoverview` as a violation, and would report any future comment explaining why the rule exists. The detector matches `from '<specifier>'`, a side-effect `import '<specifier>'`, and a dynamic `import('<specifier>')`.
- **Either quote character is accepted around a specifier.** This repository's lint forbids double-quoted strings, so an accessories module cannot legally carry one — but a module that reached for deferred execution is already a module that got something wrong, and a gate that also assumed the author obeyed the quote style would be assuming away half its own subject.
- **A floor on the enumerated count.** A gate that silently reads zero files reports the same green as a gate that read everything. Two of the eight falsifications below exist only to prove the floor fires.
- **Fixtures are multi-line template literals.** See *Issues Encountered*: no single-line TypeScript string form satisfies both prettier and eslint here. The multi-line form is also the shape the detector reads a real module in.

## Deviations from Plan

### Adjustments to the plan's letter

**1. The three `Then` steps the plan asks for already existed.**

- **Found during:** Task 1
- **Issue:** The behaviour block asks for a step asserting a named service is published, a sibling asserting it is not, and a third comparing a named characteristic's value. `Then the plugin publishes the {string} service` and `Then the plugin publishes no {string} service` already existed verbatim from the tracer, and `Then the {string} service reports {string} as {string}` existed but coerced `"true"` and `"false"` only, throwing on anything else.
- **What was done:** The value coercion was generalized to whole numbers rather than a fourth step being added beside the third. Adding a near-duplicate step would have given the suite two ways to say the same thing.
- **Files modified:** `features/support/steps/homekit.ts`
- **Committed in:** `55772f5`

**2. `untilContactState` became `untilAlarmState`.**

- **Found during:** Task 1
- **Issue:** `Sump Pit Flood` is a `LeakSensor`; it raises its alarm through `Leak Detected`, not `Contact Sensor State`. The existing sensor steps read `Contact Sensor State` unconditionally, so `Then the "Sump Pit Flood" sensor is activated` failed on its deadline rather than reading the flood state.
- **What was done:** The helper reads whichever of the two alarm characteristics the named service carries. Both activate at `1` and rest at `0`, so the step vocabulary did not change and the seven existing contact assertions are untouched.
- **Files modified:** `features/support/steps/homekit.ts`
- **Verification:** This was one of the RED failures at `2067089`; reverting the helper to the contact characteristic fails both flood scenarios.
- **Committed in:** `55772f5`

**3. The repository root is three levels up, not two.**

- **Found during:** Task 2
- **Issue:** The plan says to resolve the root "from `import.meta.url` up two levels, because the compiled case runs from `dist-test/test`", pointing at `test/configSchema.test.ts` as the model. That module sits directly under `test/`; this gate sits under `test/accessories/`, so its compiled form runs from `dist-test/test/accessories` and two levels reach `dist-test`, not the repository root.
- **What was done:** Three levels. This is exactly the vacuous-pass hazard the plan's own floor requirement exists to catch, and the floor is what would have caught it: falsification 4 below reverts to two levels and the case fails.
- **Files modified:** `test/accessories/timerFreedom.test.ts`
- **Committed in:** `442b715`

**4. A fifth fixture, for a double-quoted specifier.**

- **Found during:** Task 2
- **Issue:** The plan asks for "one per spelling the detector must catch" and names the bare form, the promises form, and the static and dynamic import spellings. The detector also accepts either quote character, and nothing exercised the double-quote alternative, so that half of the character class was untested.
- **What was done:** A fifth fixture. Falsification 6 below restricts the class to double quotes and the control fails, which is the evidence that both halves are live.
- **Files modified:** `test/accessories/timerFreedom.test.ts`
- **Committed in:** `442b715`

**5. The suppression scenario was reordered to close on a published value.**

- **Found during:** Acceptance-criteria review after task 2
- **Issue:** The criterion reads "each ending in at least one `Then` that compares a published characteristic value." The suppression scenario compared `Mains Power Present` in the middle and ended on a run of existence assertions.
- **What was done:** The two value assertions moved to the end. The scenario now closes on `Status Active` and `Mains Power Present`, so no scenario in the file ends on the presence of a service alone.
- **Files modified:** `features/safetyMonitoring.feature`
- **Verification:** Falsification 8 below still fires on this scenario after the reorder.
- **Committed in:** `eb414cc`

---

**Total deviations:** 0 auto-fixed bugs, 5 documented adjustments to the plan's letter.
**Impact on plan:** No scope creep. Every file changed is inside the plan's declared `files_modified`. Three of the five adjustments (2, 3, 4) exist because the plan's letter would have produced a gate or a step that passed without observing what it claims to observe.

## Falsification Results

Every scenario and every case was falsified by patching its defect back in and watching the suite fail. Each defect was reverted before the next.

### The seven scenarios, falsified against production code

Counts are over the whole Cucumber suite (61 scenarios).

| Defect reintroduced | Result | Scenario named |
|---|---|---|
| `water_level` 15 maps to 60 percent | 1 of 61 fails | A rising water level |
| The flood threshold drops to code 15 | 1 of 61 fails | A rising water level |
| The backup activation adapter reads the primary pump | 1 of 61 fails | A backup pump activation during a self test |
| A heartbeat replaces telemetry wholesale instead of merging | 2 of 61 fail | A partial heartbeat, plus the pre-existing merge scenario |
| A lost controller link poisons nothing | 10 of 61 fail | A lost pump controller link, plus nine others |
| The controller link flag is read uninverted | 10 of 61 fail | A lost pump controller link, plus nine others |
| The primary pump fault adapter reads the backup fault | 1 of 61 fails | A primary pump fault |
| An ignored adapter is published anyway | 1 of 61 fails | An ignored fault adapter |
| The link adapter tolerates no distrust of its own scope | 1 of 61 fails | A lost pump controller link |
| The flood publish is deferred 3 seconds through a global timer | 2 of 61 fail | A rising water level, and the immediacy scenario |

The two ten-scenario rows are not imprecision: a controller link permanently reported as lost, or permanently reported as present when it is not, poisons every controller-derived scope on every device, so it is correct that most of the file notices.

### The static gate, falsified in both directions

Counts are over the gate's three cases.

| Defect reintroduced | Result | Case named |
|---|---|---|
| An accessories module imports `node:timers/promises` | 1 of 3 fails | the tier enumeration |
| An accessories module imports `node:timers` | 1 of 3 fails | the tier enumeration |
| An accessories module defers through a dynamic import | 1 of 3 fails | the tier enumeration |
| The root resolves two levels up, as the plan specified | 1 of 3 fails | the tier enumeration |
| The gate enumerates `src/runtime` (5 modules, under the floor of 6) | 1 of 3 fails | the tier enumeration |
| The detector accepts a double-quoted specifier only | 1 of 3 fails | the planted-spelling control |
| The detector matches a bare mention rather than an import | 1 of 3 fails | the discrimination control |
| The forbidden table forgets the promises form | 1 of 3 fails | the planted-spelling control |

The last three rows are the point of the negative controls: each breaks the detector while leaving the real case green, so without them the gate would have reported a clean accessories tier using a detector that could not see the thing it forbids.

### What the immediacy scenario cannot do

Stated plainly rather than claimed as coverage. `When the scenario clock does not move` calls `advanceClock(0)`, and no production code reads the scenario clock while publishing, so against the code as written the step is a no-op. Its evidentiary content is that **no scenario time is required** for the transition, which is what `D-18` asks a scenario to show — not that no real time passes.

The scenario does catch a deferral longer than its step deadline: falsification 10 defers the flood publish by three seconds through a global timer and both flood scenarios fail. A deferral shorter than the 2-second `PUBLISH_DEADLINE_MS` would pass. That residue is precisely what the four unit-level layers exist for, and the fourth of them landed in this plan.

## The four immediacy layers are now complete and demonstrably not redundant

Plan 03-06 measured layers 1 to 3 against a deliberately deferred variant. Layer 4 is this plan's static gate, and its column is filled from the falsification table above.

| Defect | 1: injected port | 2: global spies | 3: synchronous visibility | 4: static import gate |
|---|---|---|---|---|
| A call on the injected port | **fails** | passes | passes | passes |
| A bare `globalThis.setTimeout` call | passes | **fails** | passes | passes |
| A publish deferred through the promises timers module | passes | passes | **fails** | **fails** |
| An accessories module that imports the timers module but does not call it yet | passes | passes | passes | **fails** |

The fourth row is what layer 4 adds that no runtime layer can reach. A module can carry the import before anyone writes the call that uses it, and every runtime layer is green at that moment because nothing defers yet. The static gate refuses the import itself, which is the earliest point the failure is visible and the cheapest point to fix it.

## Issues Encountered

- **Prettier and ESLint cannot both accept a TypeScript string containing a single quote.** `quotes: ['error', 'single']` rejects a double-quoted literal and rejects a bare template literal; prettier, with `singleQuote: true`, rewrites `'\'node:timers\''` to the double-quoted form to reduce escapes, which eslint then rejects. The three forms cycle. A **multi-line** template literal is exempt from the eslint rule and is preserved by prettier, so the fixtures are written that way — which is also the shape the detector reads a real module in, so it is a better fixture rather than a workaround.
- **The gate's first RED build failed `noUnusedLocals`.** The discriminating detector was written alongside the naive one so the diff would be smaller; `tsc` rejected the unused helper, and pre-commit gates typecheck. The RED commit therefore carries only the naive detector, and the discriminating one arrives with GREEN. This is the correct shape for a RED commit anyway: the naive detector is the whole implementation at that point.
- **Two of the seven new scenarios passed at RED.** *A backup pump activation during a self test* and *A lost pump controller link* use only the boolean and contact-sensor vocabulary the tracer already shipped, so they needed no new binding. Reported here rather than counted as RED evidence.

## Known Stubs

- **No new stubs.** Every step definition added has a scenario that drives it, every fixture has an assertion that reads it, and the forbidden-specifier table is consumed by the real case and both negative controls.
- **`.fallowrc.json` was not touched.** `src/accessories/services.ts` remains in `ignoreFindings`; plan 03-08 owns that file.

## Verification Status

- `npm run check`: exit 0 on three consecutive runs against the final tree.
- `npm run test:unit`: 958 tests, all passed (955 before this plan, plus the gate's three).
- `npm run test:cucumber`: 61 scenarios, 537 steps, all passed (54 and 444 before this plan).
- `node --test dist-test/test/accessories/timerFreedom.test.js`: 3 passed, 0 failed.
- `npm run test:coverage:direct` was not run for the new module: it takes a source path and a test path, and this gate has no paired source module, in the same way `test/packedArtifact.test.ts` and `test/configSchema.test.ts` do not.

## TDD Gate Compliance

**Both tasks have a genuine RED commit followed by a GREEN commit, and the failure was read at each RED before the implementation was written.**

| Task | RED commit | What failed, and why it was the right failure |
|---|---|---|
| 1 | `2067089` | Seven scenarios with no bindings for what they needed. 5 of 61 scenarios did not pass: three on the value step rejecting a whole number, one on the flood sensor being read through the wrong alarm characteristic, one undefined on the suppression `Given`. |
| 2 | `442b715` | The gate's three cases against a detector that matches a bare module mention. 1 of 3 failed — the discrimination control, reporting this file's own comment as an import. The tier enumeration and the planted-spelling control passed, the first genuinely and the second because a mention-matcher does catch a real import. |

**The machine-readable `test(...)` then `feat(...)` sequence is absent, deliberately.** This plan ships no production code: every one of the five files is a feature file, a step definition, the harness world, or a test module. Typing a GREEN commit `feat(03-07)` would announce a user-facing feature that does not exist, which the project's Conventional Commits requirement does not permit. All five commits are typed `test`, so a gate-sequence check grepping for `^feat(03-07)` will report a violation. The discipline is present in the history and in the table above; the token that would let a script confirm it is not.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The `SAFE-07` immediacy evidence is complete at four layers, and the table above records what each one catches that the other three miss, including the pre-call import that only the static gate sees.
- Plan 03-08 still owns `.fallowrc.json`. `src/accessories/services.ts` remains in `ignoreFindings` and was not touched by this plan.
- The static gate will cover a module added to `src/accessories/` later without anyone editing it, but `ACCESSORIES_MODULE_FLOOR` is a floor of six and will not rise on its own. A plan that adds modules to that tier should raise it, or the floor slowly stops proving anything about a growing directory.
- The one open judgment is `D10`: real end-to-end latency against the real vendor cloud, which no test in this repository can settle. It joins 03-06's open item about whether the vendor publishes a shadow message for a seven-to-fifteen-second pump run at all. Both belong to the real-home session.

## Self-Check: PASSED

- All five files exist on disk; `test/accessories/timerFreedom.test.ts` is newly tracked and the other four are modified in `HEAD`.
- All five commit hashes (`2067089`, `55772f5`, `442b715`, `47af0e5`, `eb414cc`) resolve in `git log`, and `git show --name-only` on each confirms the files it claims.
- `git diff --stat 2067089~1..HEAD` lists exactly the five files named above and no others; no `.fallowrc.json` change is present.
- Every falsification reverted cleanly: `git status --short` shows no modification under `src/` at any point after the falsification runs.

---
*Phase: 03-safety-monitoring-in-homekit*
*Completed: 2026-08-30*
