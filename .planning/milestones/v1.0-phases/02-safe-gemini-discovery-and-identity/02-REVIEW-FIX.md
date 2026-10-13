---
phase: 02-safe-gemini-discovery-and-identity
fixed_at: 2026-08-30T02:38:32Z
review_path: .planning/phases/02-safe-gemini-discovery-and-identity/02-REVIEW.md
iteration: 3
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-08-30T02:38:32Z
**Source review:** .planning/phases/02-safe-gemini-discovery-and-identity/02-REVIEW.md
**Iteration:** 3

**Summary:**

- Findings in scope: 1
- Fixed: 1
- Skipped: 0

## Fixed Issues

### WR-04: The WR-03 fix has no regression coverage; a revert would go undetected

**Files modified:** `features/discovery.feature`, `features/support/steps/harness.ts`
**Commit:** `438f2ac`
**Applied fix:**

Added a new scenario, "A device removed and then rediscovered is watched again," to
`features/discovery.feature`, plus one new step definition,
`the vendor reports these devices for the next inventory check:`, in `harness.ts`.

The scenario: starts the plugin, removes the device (two confirming polls + the out-of-band final
check), confirms the unregister, then arms exactly the next `/devices` response with the
rediscovered device (via a new one-shot `armDevicesAnswer` step, avoiding a race against the
background poll timer), then sets a later device-list response with a different `waterLevel`, and
asserts `the plugin reports 1 canonical change`.

Two design points were derived empirically, not assumed from the reviewer's Fix suggestion, because
the first draft (renaming the device instead of changing telemetry) silently failed to reproduce the
regression:

- `DeviceStateStore.subscribe()`'s `changedKeys` diff only compares `.data` (telemetry) fields, not
  `identity.name`, so a `name`-only change (the reviewer's exact suggestion, mirroring the existing
  "vendor rename" scenario) never reaches a listener. The scenario now changes `waterLevel` instead.
- A plain second `When the vendor reports these devices:` step (setting the standing device list)
  races the background poll timer: two `When` steps with no wait between them can both land before
  any real poll consumes either state, silently collapsing the intended two-poll sequence into one
  and defeating the test. The new `armDevicesAnswer`-based step deterministically pins the
  rediscovery inventory to exactly the next poll, regardless of prior or background poll timing.

**Verification performed** (worktree has no `node_modules`, so gates ran in the main checkout at
`/home/acolomba/homebridge-basement-guardian`, on a scratch copy of only the two changed files,
reverted via `git checkout --` before committing from the worktree):

- `npx tsc --noEmit` — clean, in both the worktree and the main checkout.
- `npx eslint features/support/steps/harness.ts --max-warnings=0` — clean.
- `npm run build:test && npx cucumber-js` (full suite) — 45/45 scenarios, 391/391 steps passing,
  with the WR-03 fix present.
- Empirical regression check: `git revert --no-commit d22ae7b` (the WR-03 fix commit), rebuild, full
  suite rerun — 44/45 scenarios pass, with the new scenario failing exactly as expected
  (`the plugin reported fewer than 1 canonical changes within 5000 ms`). `git revert --abort`
  restored the fixed state before committing.
- Filesystem secret scan (`trufflehog filesystem ... --results=verified,unknown --fail`) on both
  changed files — `verified_secrets: 0`, `unverified_secrets: 0`. Commit made with
  `SKIP=trufflehog` per this repo's worktree/git-mode-scan limitation (documented in `CLAUDE.md`).
- `pre-commit` (the full local hook suite, run implicitly by `gsd_run query commit`) — passed,
  including `npm lint`, `npm format check`, `npm typecheck`, `npm fallow`, `gitlint`.

---

_Fixed: 2026-08-30T02:38:32Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 3_
