---
phase: 06-validated-release-candidate
plan: 07
subsystem: testing
tags: [cucumber, gherkin, real-pump, mqtt, homebridge]

# Dependency graph
requires:
  - phase: 06-validated-release-candidate
    provides: existing cucumber.json real profile scaffold and features/support/world.ts pattern
provides:
  - "cucumber.json default profile excludes @real, and each profile's import glob is scoped to its own support directory"
  - "features/real-pump/support/realWorld.ts: an observation-only Cucumber World wired to the real vendor cloud with no path to a command write"
  - "test/realPumpCommandBlock.test.ts: a static gate proving no file under features/real-pump/ can reach a command path"
  - "features/real-pump/discovery.feature: discovery, initial REST state, and initial shadow state scenarios, dry-run clean"
affects: [06-08]

# Actuals (#2632)
actuals:
  tokens: 3939
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-profile import scoping for Cucumber: each profile's \"import\" glob covers only its own support directory, so a second World constructor can never silently win via last-import-wins ordering"
    - "Observation-only Cucumber World: builds the account runtime alone, with no accessory/platform layer, so a whole class of write paths is structurally absent rather than merely unused"

key-files:
  created:
    - features/real-pump/support/realWorld.ts
    - features/real-pump/support/steps.ts
    - features/real-pump/discovery.feature
    - test/realPumpCommandBlock.test.ts
  modified:
    - cucumber.json

key-decisions:
  - "Scoped cucumber.json's import globs per profile (default -> features/support/**, real -> features/real-pump/**) rather than only adding the tags exclusion, to close a World-constructor collision the plan did not anticipate"
  - "Added features/real-pump/support/steps.ts, not listed in the plan's file lists, because the plan's own verify command (cucumber-js --profile real --dry-run resolving every step) is unsatisfiable without step definitions"
  - "RealPumpWorld stays unexported until a consumer needs its type, to keep each task's commit passing the fallow dead-code gate on its own"

patterns-established:
  - "A Cucumber profile that shares another profile's World must never share its import glob; scope import globs per profile from the first non-default profile added"

requirements-completed: [REL-09]

coverage:
  - id: D1
    description: "cucumber.json's default profile can no longer pick up @real-tagged scenarios, and the two profiles no longer race over which World constructor wins"
    requirement: REL-09
    verification:
      - kind: unit
        ref: "cucumber.json default.tags === 'not @real' (Task 1 verify command)"
        status: pass
      - kind: integration
        ref: "npx cucumber-js (default profile) — 104 scenarios, 104 passed, unaffected by features/real-pump/"
        status: pass
    human_judgment: false
  - id: D2
    description: "The real-pump harness reaches the real account runtime with no code path to a command write"
    requirement: REL-09
    verification:
      - kind: unit
        ref: "test/realPumpCommandBlock.test.ts#no file under features/real-pump/ references a command path (REL-09, D-04)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Discovery, initial REST state, and initial shadow state scenarios exist and resolve every step with no live credentials"
    requirement: REL-09
    verification:
      - kind: integration
        ref: "npx cucumber-js --profile real --dry-run — 3 scenarios, 3 skipped (no undefined/ambiguous steps)"
        status: pass
    human_judgment: true
    rationale: "No CI or automated run can exercise this suite against the real vendor account; a human with BG_EMAIL/BG_PASSWORD must eventually run `cucumber-js --profile real` by hand to confirm the scenarios pass against the live Gemini, which this plan explicitly does not do"

duration: 25min
completed: 2026-09-04
status: complete
---

# Phase 6 Plan 7: Real-Pump Harness and Discovery Scenarios Summary

**Closed the Cucumber default-profile tag gap, built an observation-only real-pump Cucumber World with no code path to a command write, and shipped discovery/initial-state scenarios that dry-run clean.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-09-04T22:50:00-04:00 (approximate)
- **Completed:** 2026-09-04T23:18:43-04:00
- **Tasks:** 3
- **Files modified:** 5 (1 modified, 4 created)

## Accomplishments

- `cucumber.json`'s `default` profile now carries `"tags": "not @real"`, so a `features/real-pump/**/*.feature` file cannot be silently picked up by `npm test` or CI.
- Each profile's `"import"` glob is now scoped to its own support directory (`default` -> `features/support/**`, `real` -> `features/real-pump/**`), closing a World-constructor collision that the original single shared glob would have caused the moment a second `features/real-pump/support/` module existed.
- `features/real-pump/support/realWorld.ts` builds the plugin's real account runtime, through the same `createAccountRuntimeFromConfig` seam production uses, with no `BasementGuardianPlatform`, `DiscoveryContext`, or accessory layer — so there is no write handler in the suite that could reach a command path in the first place.
- `test/realPumpCommandBlock.test.ts` proves that mechanically: no file under `features/real-pump/` contains `.commands`, `CommandPort`, or `sendCommand`.
- `features/real-pump/discovery.feature`, tagged `@real @read-only`, covers discovery within a bounded timeout, the initial REST snapshot's valid `deviceId`, and the snapshot gaining shadow-sourced fields within its own bounded timeout — no scenario depends on a specific live value.

## Task Commits

Each task was committed atomically:

1. **Task 1: Close the default-profile tag gap** - `44d81aa` (feat)
2. **Task 2: Observation-only real-pump harness, with commands structurally unreachable** - `06ae33f` (feat)
3. **Task 3: Discovery and initial-state scenarios** - `7ed8104` (feat)

## Files Created/Modified

- `cucumber.json` - default profile excludes `@real`; each profile's import glob scoped to its own directory
- `features/real-pump/support/realWorld.ts` - observation-only Cucumber World wired to the real vendor cloud
- `test/realPumpCommandBlock.test.ts` - static gate proving no command path is reachable from `features/real-pump/`
- `features/real-pump/support/steps.ts` - step definitions for the harness lifecycle and discovery observations
- `features/real-pump/discovery.feature` - discovery, initial REST state, and initial shadow state scenarios

## Decisions Made

- **Scoped `cucumber.json`'s `import` globs per profile**, not just added the `tags` exclusion. Both profiles previously shared `"import": ["dist-test/features/**/*.js"]`. `cucumber-js`'s `setWorldConstructor` silently overwrites on repeat calls (confirmed by reading `@cucumber/cucumber`'s own source — no error is thrown), and import order is alphabetical, so once `features/real-pump/support/realWorld.ts` existed, `dist-test/features/real-pump/...` would sort before `dist-test/features/support/...`, making whichever loaded last the World for *both* profiles. Verified empirically: `npm test` (104 scenarios) and `npx cucumber-js --profile real --dry-run` (3 scenarios) both pass cleanly with the scoped globs.
- **Added `features/real-pump/support/steps.ts`**, absent from the plan's task file lists. Task 3's own verify command requires `cucumber-js --profile real --dry-run` to resolve every step with no undefined/ambiguous steps; with no step definitions this cannot pass. The new module implements `When('the harness starts', ...)` and the three `Then` assertions `discovery.feature` needs, plus a local `until()` poller mirroring `features/support/world.ts`'s pattern (deliberately not imported from it, to avoid pulling `BasementGuardianWorld`'s own `setWorldConstructor`/`After` registration into the real profile's support graph).
- **`RealPumpWorld` stays unexported in Task 2's commit**, exported only in Task 3 once `steps.ts` needs its type. An exported class with zero consumers fails this repository's `fallow dead-code` gate, which the `.pre-commit-config.yaml`'s `npm fallow` hook runs on every commit touching `features/**/*.ts`. Keeping the class module-private until it has a real consumer let each task's commit pass its own pre-commit run independently.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scoped cucumber.json's import globs per profile**
- **Found during:** Task 1
- **Issue:** The plan's Task 1 only specified adding `"tags": "not @real"` to the `default` profile. Both profiles' `"import"` field still pointed at the same `dist-test/features/**/*.js` glob. Reading `@cucumber/cucumber`'s `support_code_library_builder`, `setWorldConstructor` has no guard against being called twice — it just reassigns `this.World`. Once `features/real-pump/support/realWorld.ts` (Task 2) existed and called `setWorldConstructor(RealPumpWorld)`, the shared import glob would load both `realWorld.js` and `support/world.js` for *every* profile, and alphabetical import ordering (`real-pump` sorts before `support`) meant `BasementGuardianWorld` would silently win for both profiles — breaking the real-pump suite's own World with no error.
- **Fix:** Scoped `default`'s import to `dist-test/features/support/**/*.js` and `real`'s import to `dist-test/features/real-pump/**/*.js`, so neither profile's support-code graph can load the other's World.
- **Files modified:** `cucumber.json`
- **Verification:** `npm test` (104/104 fake-pump scenarios pass), `npx cucumber-js --profile real --dry-run` (3/3 scenarios resolve with `RealPumpWorld`)
- **Committed in:** `44d81aa` (Task 1 commit)

**2. [Rule 3 - Blocking] Added features/real-pump/support/steps.ts**
- **Found during:** Task 3
- **Issue:** Task 3's file list named only `features/real-pump/discovery.feature`, but its own verify command (`cucumber-js --profile real --dry-run` must resolve every step) cannot pass with zero step definitions for the new feature file's `Given`/`When`/`Then` lines.
- **Fix:** Added `features/real-pump/support/steps.ts` with the `When`/`Then` definitions the three scenarios need, following `features/CLAUDE.md`'s convention of organizing steps by function rather than by feature file.
- **Files modified:** `features/real-pump/support/steps.ts`, `features/real-pump/support/realWorld.ts` (exported `RealPumpWorld`)
- **Verification:** `npx cucumber-js --profile real --dry-run` — 3 scenarios, 3 skipped, no undefined/ambiguous steps
- **Committed in:** `7ed8104` (Task 3 commit)

**3. [Rule 1 - Bug] Reworded a comment that tripped the new command-block gate**
- **Found during:** Task 2
- **Issue:** `realWorld.ts`'s file-overview comment used the literal word "CommandPort" in prose to explain what the file avoids. `test/realPumpCommandBlock.test.ts` is a blunt substring scanner with no import-vs-comment distinction (unlike `hapImportScope.test.ts`'s import-syntax detector), so the comment itself failed the gate it was documenting.
- **Fix:** Reworded the comment to say "the runtime's command-issuing surface" instead of naming the type literally.
- **Files modified:** `features/real-pump/support/realWorld.ts`
- **Verification:** `node --test dist-test/test/realPumpCommandBlock.test.js` passes
- **Committed in:** `06ae33f` (Task 2 commit)

**4. [Rule 1 - Bug] Dropped a possessive apostrophe from step text**
- **Found during:** Task 3
- **Issue:** A step phrased "the discovered device's snapshot ..." was double-quoted to avoid escaping the apostrophe, which fails this project's `quotes: ['error', 'single']` ESLint rule (no `avoidEscape`). Switching to a single-quoted string with an escaped apostrophe passed ESLint, but `prettier --write` then reformatted it back to double quotes (Prettier prefers the quote style needing fewer escapes even with `singleQuote: true`), which failed ESLint again — an unresolvable ESLint/Prettier loop for any string literal containing `'s`.
- **Fix:** Reworded the step text to drop the possessive ("the discovered device snapshot ..."), matching every other string literal in this codebase, none of which contain an apostrophe.
- **Files modified:** `features/real-pump/support/steps.ts`, `features/real-pump/discovery.feature`
- **Verification:** `npx eslint` and `npx prettier --check` both pass with no conflict
- **Committed in:** `7ed8104` (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 bug)
**Impact on plan:** All four were necessary for the plan's own stated success criteria to hold (a working, non-colliding, lint-clean, dry-run-clean suite). No scope creep beyond what Task 1-3's own `<verify>` and `<done>` clauses already required.

## Issues Encountered

None beyond the deviations above.

## User Setup Required

**External account credentials are required only to actually run the opt-in `real` profile — never for `npm test` or CI.** `features/real-pump/support/realWorld.ts` requires `BG_EMAIL` and `BG_PASSWORD` in the environment, and throws a named error identifying both variables if either is unset. No step in this plan's execution set or read these variables; the plan's own safety constraint (D-04) forbids issuing any real command, and no scenario built here was run against the live account.

## Next Phase Readiness

- `features/real-pump/support/realWorld.ts` and `steps.ts` are ready for plan 06-08 to extend with `heartbeats.feature` and `lifecycle.feature`, per `06-08-PLAN.md`'s `depends_on: ["06-07"]`.
- REL-09 stays open (not marked complete): `gsd_run query requirements.ready-ids` reports it `blocked`, since 06-08 declares the same requirement and has not run yet. No `requirements mark-complete` call was made for it.
- No blockers for 06-08. `RealPumpWorld` is exported and its `start()`/`stop()`/`deviceIds()`/`snapshot()`/`observations()` surface is available for the restart and shutdown scenarios 06-08 adds.

## Self-Check: PASSED

All 5 claimed files exist on disk; all 3 task commits (`44d81aa`, `06ae33f`, `7ed8104`) exist in git history.

---
*Phase: 06-validated-release-candidate*
*Completed: 2026-09-04*
