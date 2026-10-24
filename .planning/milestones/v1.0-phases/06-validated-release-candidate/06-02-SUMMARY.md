---
phase: 06-validated-release-candidate
plan: 02
subsystem: infra
tags: [licensing, spdx, node-test, packaging]

# Dependency graph
requires:
  - phase: 06-01
    provides: LICENSE/NOTICE license-boundary text and test/packaging/licenseHeaders.test.ts's initial two content tests
  - phase: 06-04
    provides: no direct file overlap; sequenced as a wave dependency only
provides:
  - SPDX-License-Identifier headers on all 42 src/*.ts files (Apache-2.0 on 2, MIT on 40)
  - A maintainer-confirmed, non-default classification of src/platform.ts as MIT
  - test/packaging/licenseHeaders.test.ts's per-file enumeration gate, mirroring hapImportScope.test.ts
affects: [06-03, 06-05, 06-06, ship]

# Actuals (#2632)
actuals:
  tokens: 4537
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-file SPDX header enumeration gate copied from test/accessories/hapImportScope.test.ts's typeScriptFilesUnder()/floor pattern, applied to src/*.ts license classification instead of a forbidden import"

key-files:
  created: []
  modified:
    - src/index.ts
    - src/settings.ts
    - src/platform.ts
    - src/accessories/alarmMute.ts
    - src/accessories/basementGuardian.ts
    - src/accessories/controls.ts
    - src/accessories/customCharacteristics.ts
    - src/accessories/customServices.ts
    - src/accessories/pumpRecords.ts
    - src/accessories/reconciliation.ts
    - src/accessories/serviceCatalogue.ts
    - src/accessories/services.ts
    - src/accessories/staleMarking.ts
    - src/cloud/api.ts
    - src/cloud/auth.ts
    - src/cloud/errors.ts
    - src/cloud/mqttTransport.ts
    - src/cloud/shadow.ts
    - src/cloud/sigv4.ts
    - src/cloud/types.ts
    - src/config.ts
    - src/device/events.ts
    - src/device/family.ts
    - src/device/gemini.ts
    - src/device/halo.ts
    - src/device/health.ts
    - src/device/registry.ts
    - src/device/state.ts
    - src/device/waterLevel.ts
    - src/logging.ts
    - src/persistence/accessoryContext.ts
    - src/protocol.ts
    - src/runtime/accessoryStore.ts
    - src/runtime/accountRuntime.ts
    - src/runtime/arrivalAnchors.ts
    - src/runtime/clock.ts
    - src/runtime/commandPort.ts
    - src/runtime/failureLog.ts
    - src/runtime/monitoringHealth.ts
    - src/runtime/monotonicClock.ts
    - src/runtime/retryPolicy.ts
    - src/runtime/timers.ts
    - test/packaging/licenseHeaders.test.ts

key-decisions:
  - "src/platform.ts is classified MIT, not Apache-2.0 — an explicit maintainer decision made through the orchestrator on Task 1's checkpoint:decision, departing from D-035's own default and from RESEARCH.md's explicit recommendation. The maintainer's stated reasoning: the file's 600/725-line rewrite since the template import is substantially original work, an affirmative reexamination finding under D-035's own 'if the implementation replaces all material from the template, reexamine' clause, rather than a line-count shortcut."

patterns-established:
  - "Every src/*.ts file opens with a bare `// SPDX-License-Identifier: <license>` line, placed before any existing content including JSDoc; the two Apache-derived files additionally carry a second `// Modified from the Homebridge plugin template (...)` line"

requirements-completed: [REL-05]

coverage:
  - id: D1
    description: "src/index.ts and src/settings.ts carry the Apache-2.0 SPDX header plus the template-modification note; src/platform.ts carries the MIT header per the maintainer's explicit reclassification"
    requirement: "REL-05"
    verification:
      - kind: unit
        ref: "test/packaging/licenseHeaders.test.ts#the three template-derived files carry the Apache-2.0 SPDX header and the template note (REL-05, D-035)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every other src/*.ts file (40 files, including src/platform.ts) carries the MIT SPDX header and never the Apache-2.0 one"
    requirement: "REL-05"
    verification:
      - kind: unit
        ref: "test/packaging/licenseHeaders.test.ts#every other src/*.ts file carries the MIT SPDX header and not the Apache one (REL-05, D-035)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The per-file gate enumerates at least 42 src/*.ts files, so the header assertions are proven non-vacuous rather than passing on an empty read"
    requirement: "REL-05"
    verification:
      - kind: unit
        ref: "test/packaging/licenseHeaders.test.ts#every src/*.ts file is enumerated for the license-header gate (REL-05)"
        status: pass
    human_judgment: false

duration: ~48min
completed: 2026-09-05
status: complete
---

# Phase 6 Plan 02: File-Level SPDX License Headers Summary

**Every src/*.ts file now opens with a first-line SPDX-License-Identifier comment — Apache-2.0 on the two near-verbatim template files, MIT on the other 40 including a maintainer-reclassified src/platform.ts — enforced by a per-file test gate mirroring the codebase's existing HAP-import scope pattern.**

## Performance

- **Duration:** ~48 min
- **Completed:** 2026-09-05
- **Tasks:** 3 (Task 1 was a `checkpoint:decision`, resolved by the maintainer before this execution began)
- **Files modified:** 42 (41 `src/*.ts` files + 1 test file)

## Accomplishments

- `src/index.ts` and `src/settings.ts` open with `// SPDX-License-Identifier: Apache-2.0` followed by `// Modified from the Homebridge plugin template (...)`, matching D-035's default reading for near-verbatim template files.
- `src/platform.ts` opens with `// SPDX-License-Identifier: MIT` — no template note — per the maintainer's explicit Task 1 decision.
- Every other file under `src/` (39 files) opens with `// SPDX-License-Identifier: MIT`.
- `test/packaging/licenseHeaders.test.ts` (created by 06-01 for LICENSE/NOTICE content) gained three new tests: a file-count floor (`SRC_FILE_FLOOR = 42`), a check that the two Apache-derived files carry both the SPDX line and the template note, and a check that every other file carries the MIT line and never the Apache one.
- `npm run check` passes in full: 1444/1444 unit tests, 104/104 Cucumber scenarios.

## Task Commits

1. **Task 1: Confirm the src/platform.ts license classification** — resolved by the maintainer through the orchestrator before this execution began (see Decisions Made below). No commit of its own; it is a decision record, not a code change.
2. **Task 2: Apache-2.0 headers on the three template-derived files** — `f99ed6d` (feat)
3. **Task 3: MIT headers on every other src file, and the per-file gate** — `291d748` (feat)

## Files Created/Modified

- `src/index.ts`, `src/settings.ts` — Apache-2.0 SPDX header + template-modification note
- `src/platform.ts` — MIT SPDX header (reclassified per Task 1's decision)
- 38 other `src/**/*.ts` files — MIT SPDX header, first line
- `test/packaging/licenseHeaders.test.ts` — extended with the per-file enumeration gate

## Decisions Made

- **`src/platform.ts` is MIT, not Apache-2.0.** Task 1's `checkpoint:decision` (`gate="blocking-human"`) asked whether `src/platform.ts` should keep the Apache-2.0 classification RESEARCH.md recommended (D-035's default reading, since the file traces its lineage to the template's platform file) or be reclassified MIT to reflect that it has grown from ~150 to ~725 lines (600 insertions, 125 deletions since the template import). The maintainer resolved this through the orchestrator as an explicit, affirmative reexamination under D-035's own "if the implementation replaces all material from the template, reexamine the Apache preservation requirement" clause — not the unattended default. This SUMMARY records that resolution rather than re-presenting the checkpoint. Consequently, Task 2's file scope narrowed to `src/index.ts` and `src/settings.ts` only, and Task 3's `APACHE_DERIVED_FILES` constant in the test gate lists only those two files, exactly as the plan's own contingency text for a non-default decision described.

## Deviations from Plan

None — plan executed exactly as written, including its own documented contingency for a non-default Task 1 decision (narrower Task 2 file scope, narrower `APACHE_DERIVED_FILES` list in the Task 3 gate).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- REL-05's file-level license-identifier requirement is fully satisfied and self-enforcing: `test/packaging/licenseHeaders.test.ts` fails a named test if a header is removed, changed, or misclassified, closing threat T-06-05.
- T-06-06 (the classification-ambiguity threat) is closed by the checkpoint having surfaced the decision to the maintainer rather than a subagent silently picking one.
- `npm run check` (full local gate) passes: 1444/1444 unit tests, 104/104 Cucumber scenarios.
- No blockers for the remaining Phase 6 plans.

## Self-Check: PASSED

All 42 modified `src/*.ts` files carry the expected first-line SPDX header (verified via `head -n 2` grep across the full `src/` tree — zero missing). Both commits (`f99ed6d`, `291d748`) are present in `git log --oneline --all`. `test/packaging/licenseHeaders.test.ts` runs 5/5 passing tests (`node --test dist-test/test/packaging/licenseHeaders.test.js`), confirmed with `ℹ fail 0` in the output.

---
*Phase: 06-validated-release-candidate*
*Completed: 2026-09-05*
