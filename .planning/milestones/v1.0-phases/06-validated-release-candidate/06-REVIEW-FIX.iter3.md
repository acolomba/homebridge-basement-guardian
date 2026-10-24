---
phase: 06-validated-release-candidate
fixed_at: 2026-09-05T13:14:10Z
review_path: .planning/phases/06-validated-release-candidate/06-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 6: Code Review Fix Report

**Fixed at:** 2026-09-05T13:14:10Z
**Source review:** .planning/phases/06-validated-release-candidate/06-REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 2 (fix_scope: critical_warning -- CR-01, WR-01; IN-01 excluded by scope)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### CR-01: Dependency telemetry scan does not reach the dependency tree it claims to cover

**Files modified:** `test/packaging/dependencyTelemetry.test.ts`
**Commit:** `0ca3ee0`
**Applied fix:** Read the review's suggested `npm ls --all --json` approach but adapted it to
match the sibling gate already in the same directory (`dependencyLicenses.test.ts`), which reads
`package-lock.json`'s per-package entries rather than shelling out to `npm`. Added a
`productionPackagePaths()` helper that reads `package-lock.json`'s `packages` map (the lockfile's
actual resolved install path for every dependency, hoisted or nested) and returns every non-dev
entry -- since `mqtt` is the project's only production dependency, this is exactly its installed
transitive closure. The test now recursively scans every `.js` file under each of those paths
(deduplicated with a `Set`, since some nested paths are subdirectories of hoisted ones) instead
of only `node_modules/mqtt`. Verified against the installed tree: the old scan covered 38 files
under `node_modules/mqtt` alone; the new scan covers 601 files across the full 46-package
production closure. Confirmed with `npx tsc --noEmit`, `npx eslint --max-warnings=0`,
`node --test` (case passes), and `npm run test:coverage:direct` (100/100/100 on the direct pair).

### WR-01: `FIRST_DELAY_BASE_MS` does not describe the first delay it produces

**Files modified:** `src/runtime/retryPolicy.ts`
**Commit:** `586fcb2`
**Applied fix:** Renamed `FIRST_DELAY_BASE_MS = 1_000` to `FIRST_RETRY_DELAY_MS = 500` (the
review's suggested literal form) and changed `nextDelayMs()`'s formula from
`FIRST_DELAY_BASE_MS * 2 ** (attempt - 2)` to `FIRST_RETRY_DELAY_MS * 2 ** (attempt - 1)`, which
produces byte-for-byte the same delay sequence (500, 1000, 2000, 4000, 8000, 16000, 30000-capped)
so the name and the formula now agree without changing behavior. Verified with `npx tsc --noEmit`,
`npx eslint --max-warnings=0`, and `npm run test:coverage:direct` on the direct pair (all 15
existing cases pass, 100/100/100 coverage), and confirmed no other file referenced the old
constant name.

## Skipped Issues

None -- both in-scope findings were fixed. IN-01 (`remember`/`recall` duplication in
`features/real-pump/support/realWorld.ts`) was out of scope for this run (`fix_scope:
critical_warning`) and its own **Fix** section says "No action required for this phase."

---

_Fixed: 2026-09-05T13:14:10Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
