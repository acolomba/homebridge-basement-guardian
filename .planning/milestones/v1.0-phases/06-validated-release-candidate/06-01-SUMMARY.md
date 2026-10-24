---
phase: 06-validated-release-candidate
plan: 01
subsystem: infra
tags: [npm, github-actions, licensing, trufflehog, packaging]

# Dependency graph
requires: []
provides:
  - package.json publish-ready metadata (private:false, SEE LICENSE IN LICENSE, NOTICE in files)
  - split MIT/Apache LICENSE text and a NOTICE file naming the Homebridge plugin template
  - test/packaging/licenseHeaders.test.ts gating LICENSE/NOTICE content
  - build.yml's Homebridge-version CI matrix dimension (1.8.0, 1.11.4, 2.4.0)
  - package-audit.yml, a real-tarball trufflehog secret scan as its own CI job
  - publish.yml, a workflow_dispatch-only npm publish scaffold
affects: [06-02, 06-03, 06-04, 06-05, 06-06, ship]

# Actuals (#2632)
actuals:
  tokens: 2591
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static source-text gate for LICENSE/NOTICE content, mirroring test/accessories/hapImportScope.test.ts's read-raw-text-and-assert.match shape"
    - "CI matrix cell pinned via npm install --no-save, leaving package-lock.json's committed range untouched"

key-files:
  created:
    - NOTICE
    - test/packaging/licenseHeaders.test.ts
    - .github/workflows/package-audit.yml
    - .github/workflows/publish.yml
  modified:
    - package.json
    - LICENSE
    - test/packedArtifact.test.ts
    - .github/workflows/build.yml

key-decisions:
  - "test/packaging/licenseHeaders.test.ts's REPOSITORY_ROOT uses three '..' segments, not the two the plan text specified — the file compiles to dist-test/test/packaging/, one directory deeper than dist-test/test/packageManifest.test.js, matching test/accessories/hapImportScope.test.ts's precedent for a file one level under test/"

patterns-established:
  - "Every new packaging/license test title ends with a parenthesized requirement ID (REL-05), matching the codebase-wide convention"

requirements-completed: [REL-01, REL-02, REL-04, REL-05, REL-07]

coverage:
  - id: D1
    description: "package.json declares private:false and license SEE LICENSE IN LICENSE, and npm pack --dry-run --json lists NOTICE among the root files"
    requirement: "REL-05"
    verification:
      - kind: unit
        ref: "test/packaging/licenseHeaders.test.ts#LICENSE carries both the Apache and MIT license texts (REL-05)"
        status: pass
      - kind: unit
        ref: "test/packedArtifact.test.ts#packs every allowlisted root file and no other root file (REL-04)"
        status: pass
    human_judgment: false
  - id: D2
    description: "build.yml's compatibility matrix crosses node-version [22.x, 24.x] with homebridge-version [1.8.0, 1.11.4, 2.4.0], fail-fast: false"
    requirement: "REL-01"
    verification:
      - kind: other
        ref: "pre-commit run check-yaml --files .github/workflows/build.yml (structural validity only; the six-cell matrix itself only executes in GitHub Actions CI, not locally)"
        status: pass
    human_judgment: true
    rationale: "No local runner exercises the actual GitHub Actions matrix; a passing local check-yaml only proves the YAML parses, not that all six cells install and run npm run check successfully in CI."
  - id: D3
    description: "package-audit.yml runs a real npm pack, extracts the tarball, and scans it with trufflehog filesystem mode at --results=verified,unknown --fail, as its own isolated CI job"
    requirement: "REL-04"
    verification:
      - kind: other
        ref: "pre-commit run check-yaml --files .github/workflows/package-audit.yml; npm run build && npm pack --dry-run --json (local pack step proven buildable)"
        status: pass
    human_judgment: true
    rationale: "The trufflehog install/scan steps only run inside the GitHub Actions job itself; no local check exercises the workflow end to end."
  - id: D4
    description: "publish.yml triggers only on workflow_dispatch and publishes with npm publish --tag next; no push or pull_request trigger exists"
    requirement: "REL-07"
    verification:
      - kind: unit
        ref: "grep -cE '^\\s*(push|pull_request):' .github/workflows/publish.yml == 0"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-09-05
status: complete
---

# Phase 6 Plan 01: License Boundary, CI Matrix, Package Audit, Publish Scaffold Summary

**Mixed MIT/Apache license boundary wired end to end (package.json, LICENSE, NOTICE, a static test gate), a three-way Homebridge-version CI matrix dimension, a real packed-tarball trufflehog secret scan as its own workflow, and a workflow_dispatch-only npm publish scaffold.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-09-05
- **Tasks:** 3
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments

- `package.json` now declares `private: false` and `license: "SEE LICENSE IN LICENSE"` (D-01, D-035), with `NOTICE` added to the `files` allowlist.
- `LICENSE` keeps the original Apache-2.0 text byte-identical (verified by diff against the prior commit) and now also carries a boundary-explaining preamble and the full MIT License text.
- `NOTICE` names the Homebridge plugin template, its Apache-2.0 license, and the three template-derived files (`src/index.ts`, `src/settings.ts`, `src/platform.ts`).
- `test/packaging/licenseHeaders.test.ts` gates both files' content with the same static source-text-read pattern the codebase already uses.
- `test/packedArtifact.test.ts`'s `ALLOWED_ROOT_FILES` now includes `NOTICE` in correct sort order, and its comment was updated to match.
- `.github/workflows/build.yml`'s matrix now crosses `node-version` with `homebridge-version: ['1.8.0', '1.11.4', '2.4.0']` (D-02), pinned per cell via `npm install --no-save` so `package-lock.json` stays untouched.
- `.github/workflows/package-audit.yml` runs a real (non-dry-run) `npm pack`, extracts the tarball, and scans it with a pinned `trufflehog filesystem` scan, isolated from the compat matrix (REL-04).
- `.github/workflows/publish.yml` scaffolds the eventual `npm publish --tag next` step behind `secrets.NPM_TOKEN`, gated to `workflow_dispatch` only — no `push`/`pull_request` trigger exists anywhere in the file (REL-07, D-01, D-026).

## Task Commits

Each task was committed atomically:

1. **Task 1: License boundary end to end** — `6d72928` (feat)
2. **Task 2: Packed-artifact content secret scan (REL-04)** — `614d5d5` (feat)
3. **Task 3: Publish workflow scaffold, never auto-triggered (REL-07, D-01)** — `2c36f30` (feat)

## Files Created/Modified

- `package.json` — `private: false`, `license: "SEE LICENSE IN LICENSE"`, `NOTICE` added to `files`
- `LICENSE` — rewritten: boundary prose + full Apache-2.0 text (byte-identical) + full MIT text
- `NOTICE` — new: names the Homebridge plugin template and the three Apache-derived files
- `test/packaging/licenseHeaders.test.ts` — new: asserts LICENSE and NOTICE content
- `test/packedArtifact.test.ts` — `NOTICE` inserted into `ALLOWED_ROOT_FILES`
- `.github/workflows/build.yml` — added `homebridge-version` matrix dimension and its pinning step
- `.github/workflows/package-audit.yml` — new: real-pack + extract + trufflehog scan job
- `.github/workflows/publish.yml` — new: `workflow_dispatch`-only `npm publish --tag next` scaffold

## Decisions Made

- **`REPOSITORY_ROOT` in `test/packaging/licenseHeaders.test.ts` uses three `'..'` segments, not the two the plan and pattern map specified.** The plan's text claimed this file "sits at the same depth under `dist-test/test/packaging/`" as `test/packageManifest.test.ts`, but `test/packaging/licenseHeaders.test.ts` compiles to `dist-test/test/packaging/licenseHeaders.test.js`, which is one directory deeper than `dist-test/test/packageManifest.test.js`. Using two `'..'` segments would have resolved to `dist-test/` instead of the repository root, breaking both `readFileSync` calls. `test/accessories/hapImportScope.test.ts` — a file at the same one-level-deeper depth — already uses three `'..'` segments; this plan followed that precedent instead. Verified: both tests pass and read the real `LICENSE`/`NOTICE` files, not a wrong path silently returning nothing (a wrong path would throw `ENOENT`, not pass silently, so this was caught immediately on the first local test run).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the `REPOSITORY_ROOT` `'..'` segment count in `test/packaging/licenseHeaders.test.ts`**
- **Found during:** Task 1 (writing the new test file)
- **Issue:** The plan's action text and the pattern map both specified two `'..'` segments for this file's `REPOSITORY_ROOT`, reasoning it sits "at the same depth" as `test/packageManifest.test.ts`. That reasoning is incorrect: `test/packaging/licenseHeaders.test.ts` is one directory level deeper than `test/packageManifest.test.ts`, so two `'..'` segments would resolve one level short of the repository root.
- **Fix:** Used three `'..'` segments, matching `test/accessories/hapImportScope.test.ts`'s established precedent for a file one level under `test/`.
- **Files modified:** `test/packaging/licenseHeaders.test.ts`
- **Verification:** `node --test dist-test/test/packaging/licenseHeaders.test.js` passes, reading the real `LICENSE` and `NOTICE` files.
- **Committed in:** `6d72928` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix in a newly authored file, caught before commit)
**Impact on plan:** No scope creep — a path-resolution bug in new test code, fixed before any commit landed with a broken test.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. `secrets.NPM_TOKEN` referenced in `publish.yml` is a future manual GitHub repository secret the maintainer sets when they choose to actually run the publish workflow, which this plan does not do.

## Next Phase Readiness

- The mechanical spine this phase's other plans build on is in place: `package.json` is publish-ready, the CI matrix dimension exists, the packed-artifact secret scan runs as an isolated job, and the publish workflow exists but cannot fire on its own.
- `npm run check` (full local gate: typecheck, lint, fallow, format:check, unit tests, Cucumber suite) passes: 1426/1426 unit tests, 104/104 Cucumber scenarios.
- The six-cell CI matrix and the `package-audit.yml`/`publish.yml` workflows have not been exercised inside actual GitHub Actions runs yet — that only happens once this branch's changes reach CI (or a maintainer runs them via `workflow_dispatch`). Local checks (`check-yaml`, `npm run build && npm pack --dry-run --json`) prove the workflow files are syntactically valid and that the pack step they perform for real works locally, but do not prove the six matrix cells install and pass, or that the `package-audit.yml` job's `trufflehog` install/scan steps succeed inside the CI environment.
- No blockers for the next plans in this phase (dependency allowlist, README disclosures, real-pump suite, hardware-gate checklists).

## Self-Check: PASSED

All created files exist on disk (`NOTICE`, `test/packaging/licenseHeaders.test.ts`,
`.github/workflows/package-audit.yml`, `.github/workflows/publish.yml`, this SUMMARY). All four
commits (`6d72928`, `614d5d5`, `2c36f30`, `ce854d3`) are present in `git log --oneline --all`.

---
*Phase: 06-validated-release-candidate*
*Completed: 2026-09-05*
