---
phase: 01-secure-cloud-foundation
plan: 19
subsystem: packaging
tags: [packaging, npm-pack, publish-allowlist, threat-mitigation, T-01-60]

requires:
  - phase: 01-secure-cloud-foundation
    provides: "The `files` publish allowlist that replaced `.npmignore` (plan 01-01, D-21)"
  - phase: 01-secure-cloud-foundation
    provides: "The `features/` directory whose arrival T-01-60 is about (plan 01-11)"
provides:
  - "An automated assertion that the packed file list holds only allowlisted paths"
  - "An automated assertion that all five allowlisted root files are present"
affects: [phase-6-release-readiness]

actuals:
  tokens: 600
  tasks: 1
  commits: 1

tech-stack:
  added: []
  patterns:
    - "A packaging gate asserts the property the allowlist promises, not a snapshot of today's file list"

key-files:
  created:
    - test/packedArtifact.test.ts
  modified: []

key-decisions:
  - "The assertion is a property, not a list of 84 paths, so a legitimate `dist/` change does not edit the test and nobody learns to update a fixture instead of thinking"
  - "An unbuilt `dist/` throws with the command that fixes it, because an empty packed list would satisfy a positive allowlist assertion without examining one compiled file"
  - "Staleness of `dist/` is out of scope: the threat is a widened allowlist, which shows up whatever the compiled content is"

patterns-established:
  - "A mitigation the register calls an assertion has to be a test, not a recorded manual run"

requirements-completed: []

coverage:
  - id: T-01-60
    description: "The packed artifact carries nothing outside the compiled output and the five allowlisted root files"
    requirement: REL-04
    verification:
      - kind: unit
        ref: "test/packedArtifact.test.ts#packs nothing beyond the compiled output and the allowlisted root files (REL-04)"
        status: pass
      - kind: unit
        ref: "test/packedArtifact.test.ts#packs every allowlisted root file and no other root file (REL-04)"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 19: Packed artifact allowlist gate Summary

**The publish allowlist is now asserted by a test on every run, instead of by a manual `npm pack`
that one executor ran once.**

## Performance

- **Duration:** 40 min
- **Tasks:** 1
- **Files created:** 1

## What changed

Plan 01-11's register says T-01-60 is mitigated because "the publish allowlist is re-verified in
this plan by asserting the complete packed file list". No such assertion existed. Plan 01-11 ran
`npm pack --dry-run --json` by hand, read the 84 paths, and recorded the result in its summary. A
recorded reading is not a gate. `grep -rn "npm pack"` over the repository matched nothing.

The exposure was closed and stayed closed by luck. An edit to the `files` array, a new root file npm
force-includes, or a returning `.npmignore` would have failed no test, no `npm run check` step, no
CI job, and no pre-commit hook. D-21 exists because the packed artifact once carried 755 files,
including the raw vendor research and the live vendor scripts.

`test/packedArtifact.test.ts` runs `npm pack --dry-run --json`, parses the real report, and asserts
two things about the paths it lists:

1. Every path is under `dist/` or is one of `CHANGELOG.md`, `LICENSE`, `README.md`,
   `config.schema.json`, `package.json`. The assertion is positive, as the register requires: an
   unrecognized path fails and names itself.
2. The root files are exactly those five. A `files` array that drops `config.schema.json` ships a
   plugin Homebridge cannot configure, so presence is asserted, not only permission.

The test states the property rather than the 84 current paths. A snapshot would break on every
legitimate compiled-output change, and it would teach the next engineer to refresh the fixture
rather than ask why the list moved.

## The unbuilt `dist/` case

`npm pack` reads the working tree. With `dist/` absent, the packed list is the five root files, and
a positive allowlist assertion passes on it without examining a single compiled file. That is a test
that reports safety while checking nothing.

The helper therefore refuses to return a list that does not contain `dist/index.js`:

```
Error: the packed artifact carries no dist/index.js, so the allowlist cannot be checked;
run `npm run build` first
```

Both cases fail with that message, so the failure names the fix instead of the symptom. No case in
this module can pass on an unbuilt tree, now or later.

The guard costs nothing in practice. `npm run check` runs `fallow` before `test`, and `prefallow` is
`npm run build`, so `dist/` is present. CI orders its steps the same way. Only a bare `npm run
test:unit` on a tree that was never built hits the guard, and there the message is correct.

Stale compiled content is deliberately not checked. The threat is a widened allowlist, which shows
up whatever `dist/` holds, and no cheap check separates stale output from current output.

## Proving the test fails

A test that has never been seen to fail is not a gate. Three mutations, each reverted:

| Mutation                                          | Result                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| Added `"features"` to the `files` array           | Case 1 fails, listing all 20 packed `features/` paths                |
| Removed `"config.schema.json"` from `files`       | Case 2 fails, showing `config.schema.json` missing from the root set |
| Moved `dist/` aside                               | Both cases fail with the build guard message                        |

The first mutation is the exact regression T-01-60 describes. Its message:

```
AssertionError [ERR_ASSERTION]: the packed artifact carries paths outside the publish
allowlist (D-21): features/authentication.feature, features/CLAUDE.md,
features/configuration.feature, ..., features/support/world.ts
```

Node's diff prints the same paths under `+ actual`, so the offending files are named twice.

## Task Commits

1. **Task 1: assert the packed file list against the allowlist** - `0bf852f` (test)

## Files Created/Modified

- `test/packedArtifact.test.ts` - two cases over `npm pack --dry-run --json`, a build guard, and the
  five-file root allowlist as a named constant carrying its D-21 reference

## Decisions Made

- **No source or `package.json` change.** The allowlist is already correct. What was missing is the
  check that keeps it correct, so the whole change is one test module.
- **Two cases, two pack runs, about 3 seconds.** A cached module-scope result would halve it and
  break the rule that each case builds its own state. The unit suite runs test files in parallel, so
  the cost overlaps other modules.
- **Not mirrored under `src/`.** `test/packageManifest.test.ts` set that precedent for a manifest
  test with no production pair. This module imports nothing from `src/`, so it adds no pair and no
  coverage obligation.

## Deviations from Plan

There was no PLAN.md; the specification was inline. None.

## Known Stubs

None.

## Gate Results

| Gate                                    | Result                                     |
| --------------------------------------- | ------------------------------------------ |
| `npm run check`                         | exit 0                                     |
| Unit tests                              | 464 pass, 0 fail (462 before, +2)          |
| Cucumber                                | 35 scenarios, 299 steps, all pass          |
| Cucumber, three consecutive runs        | exit 0, 0, 0                               |
| `fallow dead-code` / `health` / `dupes` | clean; duplication 0.0%                    |
| `pre-commit run --files`                | all hooks pass except the worktree-mode TruffleHog defect CLAUDE.md documents; a filesystem scan of the file reports 0 verified and 0 unverified secrets |
| Working tree after the pack runs        | no `.tgz` left behind                      |
| Files touched                           | one new test module, and no others         |

## User Setup Required

None.

## Next Phase Readiness

**Phase 6 (REL-04, REL-05).** The packed file list is now checked by the suite, so release work can
treat the allowlist as held rather than re-derive it. Two packaging facts remain unchecked and are
Phase 6's: `package.json` still carries `private: true` at version `0.1.0`, and REL-05's license
metadata is not asserted anywhere.

---

_Phase: 01-secure-cloud-foundation_
_Completed: 2026-08-29_

## Self-Check: PASSED

- `test/packedArtifact.test.ts` exists on disk.
- Commit `0bf852f` resolves.
- `git diff --stat` against the base commit lists that one file and no others.
