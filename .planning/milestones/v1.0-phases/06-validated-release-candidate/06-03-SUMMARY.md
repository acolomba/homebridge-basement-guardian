---
phase: 06-validated-release-candidate
plan: 03
subsystem: test
tags: [dependency-audit, licensing, telemetry, packaging]

# Dependency graph
requires: []
provides:
  - test/packaging/dependencyAllowlist.test.ts pinning the production dependency set to ["mqtt"]
  - test/packaging/dependencyLicenses.test.ts gating production dependencies against GPL-family licenses
  - test/packaging/dependencyTelemetry.test.ts scanning the installed mqtt tree for telemetry signatures
affects: [ship]

# Actuals (#2632)
actuals:
  tokens: 1433
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static source-text/JSON gate mirroring test/packageManifest.test.ts and test/packaging/licenseHeaders.test.ts's read-raw-data-and-assert shape, applied to dependencies, package-lock.json licenses, and installed .js files"

key-files:
  created:
    - test/packaging/dependencyAllowlist.test.ts
    - test/packaging/dependencyLicenses.test.ts
    - test/packaging/dependencyTelemetry.test.ts
  modified: []

key-decisions:
  - "REPOSITORY_ROOT in all three files uses three '..' segments, not the two the plan text specified, matching test/packaging/licenseHeaders.test.ts's already-corrected precedent from 06-01 -- test/packaging/*.test.ts compiles one directory deeper than test/packageManifest.test.ts, so two segments would resolve short of the repository root."

patterns-established:
  - "Every new packaging test title ends with a parenthesized requirement ID (REL-03), matching the codebase-wide convention"

requirements-completed: [REL-03, REL-04]

coverage:
  - id: dependencyAllowlist
    description: "package.json's dependencies object is exactly {\"mqtt\": \"^5.15.2\"}"
    requirement: "REL-03"
    verification:
      - kind: unit
        ref: "test/packaging/dependencyAllowlist.test.ts#keeps the production dependency set exactly [\"mqtt\"] (REL-03)"
        status: pass
    human_judgment: false
  - id: dependencyLicenses
    description: "No production package recorded in package-lock.json carries a GPL-family license identifier"
    requirement: "REL-03"
    verification:
      - kind: unit
        ref: "test/packaging/dependencyLicenses.test.ts#no production dependency carries a GPL-family license (REL-03)"
        status: pass
      - kind: other
        ref: "node -e inspection confirming eslint-plugin-sonarjs (the repository's one LGPL-3.0-only package) is dev:true and correctly excluded, not silently unmatched"
        status: pass
    human_judgment: false
  - id: dependencyTelemetry
    description: "No file under the installed node_modules/mqtt tree contains a known telemetry-SDK identifier"
    requirement: "REL-03"
    verification:
      - kind: unit
        ref: "test/packaging/dependencyTelemetry.test.ts#the installed mqtt tree carries no known telemetry-SDK identifier (REL-03)"
        status: pass
      - kind: other
        ref: "grep -rliE across node_modules/mqtt for all seven signatures, independently confirming zero matches"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-09-05
status: complete
---

# Phase 6 Plan 03: Dependency Allowlist, License, and Telemetry Gates Summary

**Three mechanical `node:test` gates turn REL-03's dependency-review requirement into re-runnable checks: an exact production-dependency allowlist, a GPL-family license scan of `package-lock.json`, and a telemetry-SDK signature scan of the installed `mqtt` tree.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-09-05
- **Tasks:** 3
- **Files modified:** 3 (all created)

## Accomplishments

- `test/packaging/dependencyAllowlist.test.ts` asserts `package.json`'s `dependencies` object is exactly `["mqtt"]`, so a future `npm install <new-runtime-dep>` fails this test by name (REL-03).
- `test/packaging/dependencyLicenses.test.ts` reads `package-lock.json`'s lockfile-v3 `packages` object, skips the root entry and every `dev: true` entry, and asserts no remaining (production) entry's `license` field matches a GPL-family pattern, naming any violator in the assertion failure (REL-03).
- `test/packaging/dependencyTelemetry.test.ts` recursively scans every `.js` file under the installed `node_modules/mqtt` tree for seven known telemetry/analytics-SDK identifiers, naming any matching file (REL-03).
- Independently verified both non-trivial gates against real data rather than trusting a green run alone: `eslint-plugin-sonarjs` (the repository's one `LGPL-3.0-only` package, measured in `06-RESEARCH.md`) was confirmed `dev: true` and correctly excluded by the license gate's filter; a plain `grep -rliE` across the seven telemetry signatures independently confirmed zero matches in the installed `mqtt` tree, matching the telemetry gate's result.

## Task Commits

Each task was committed atomically:

1. **Task 1: Exact production dependency allowlist** — `9d1014e` (feat)
2. **Task 2: Production dependency license audit** — `e6f29e2` (feat)
3. **Task 3: Production dependency telemetry-signature review** — `c6c5852` (feat)

## Files Created/Modified

- `test/packaging/dependencyAllowlist.test.ts` — new: pins the production dependency set
- `test/packaging/dependencyLicenses.test.ts` — new: gates production dependency licenses
- `test/packaging/dependencyTelemetry.test.ts` — new: scans the installed `mqtt` tree for telemetry signatures

## Decisions Made

- **All three files' `REPOSITORY_ROOT` use three `'..'` segments, not the two the plan text specified.** The plan's action text for Task 1 described `test/packaging/dependencyAllowlist.test.ts` as sitting "at the same depth" as `test/packageManifest.test.ts`, but `test/packaging/*.test.ts` compiles to `dist-test/test/packaging/*.test.js`, one directory deeper than `dist-test/test/packageManifest.test.js`. Two `'..'` segments would resolve one level short of the repository root. `test/packaging/licenseHeaders.test.ts` (written in plan 06-01) already corrected this same mistake for the same directory; this plan followed that established precedent directly rather than rediscovering the bug. Verified: all three tests pass and read the real `package.json`, `package-lock.json`, and `node_modules/mqtt` tree — a wrong path would throw `ENOENT` or read an empty directory, not pass silently.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Used three `'..'` segments for `REPOSITORY_ROOT`, not the two the plan specified**
- **Found during:** Task 1 (writing the new test file)
- **Issue:** The plan's action text specified two `'..'` segments, reasoning the file sits at the same depth as `test/packageManifest.test.ts`. That reasoning does not hold for `test/packaging/*.test.ts`, which is one directory level deeper.
- **Fix:** Used three `'..'` segments, matching `test/packaging/licenseHeaders.test.ts`'s already-established precedent (set in plan 06-01 for an identical path-depth mistake).
- **Files modified:** `test/packaging/dependencyAllowlist.test.ts`, `test/packaging/dependencyLicenses.test.ts`, `test/packaging/dependencyTelemetry.test.ts`
- **Verification:** `node --test` on each compiled file passes, reading the real files/directories rather than resolving to a wrong path.
- **Committed in:** `9d1014e`, `e6f29e2`, `c6c5852` (each task's own commit)

---

**Total deviations:** 1 auto-fixed (a path-resolution bug in the plan text, caught before any commit landed with a broken test).
**Impact on plan:** No scope creep — a `'..'` segment-count correction across three new files, using a precedent already established in this same directory by plan 06-01.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- REL-03's dependency review is now a mechanical, re-runnable set of gates rather than a one-time desk check; a future `npm install` widening the production dependency set, introducing a GPL-family license, or pulling in a package carrying a telemetry-SDK identifier fails a named test.
- `npm run check` (full local gate: typecheck, lint, fallow, format:check, unit tests, Cucumber suite) passes: 1429/1429 unit tests, 104/104 Cucumber scenarios.
- No blockers for the other plans in this phase.

## Self-Check: PASSED

All created files exist on disk (`test/packaging/dependencyAllowlist.test.ts`,
`test/packaging/dependencyLicenses.test.ts`, `test/packaging/dependencyTelemetry.test.ts`, this
SUMMARY). All three commits (`9d1014e`, `e6f29e2`, `c6c5852`) are present in `git log --oneline --all`.

---
*Phase: 06-validated-release-candidate*
*Completed: 2026-09-05*
