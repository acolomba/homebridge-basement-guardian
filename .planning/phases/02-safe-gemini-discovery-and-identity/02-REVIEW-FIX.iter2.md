---
phase: 02-safe-gemini-discovery-and-identity
fixed_at: 2026-08-30T02:04:31Z
review_path: .planning/phases/02-safe-gemini-discovery-and-identity/02-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-08-30T02:04:31Z
**Source review:** .planning/phases/02-safe-gemini-discovery-and-identity/02-REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 3 (CR-01, WR-01, WR-02; IN-01 is out of scope for `critical_warning`)
- Fixed: 3
- Skipped: 0

## Fixed Issues

### CR-01: The DEV-05 final-check fetch can confirm an unrelated device absent early, and does so permanently once any device has ever been removed

**Files modified:** `src/runtime/accountRuntime.ts`
**Commit:** `a4c3641`
**Applied fix:** In `applyDevices()`, replaced the blanket
`reconciliation.observe(freshDeviceIds)` call on the out-of-band final-check
fetch (which touched every tracked deviceId, not just the ones under
confirmation) with a loop over `confirmedAbsent` only. For each deviceId
still present in the fresh fetch, `reconciliation.forget(deviceId)` is
called to start a fresh epoch; for each deviceId still absent,
`reconciliation.forget(deviceId)` is called before `options.onDeviceRemoved`
so it stops being tracked and can never permanently re-trigger the extra
fetch on a later poll. Adapted from the review's suggested fix to match the
current code's existing `stillPresent`/loop structure rather than
reintroducing a duplicate `Set` construction. Verified with `tsc --noEmit`
(both tsconfigs), the full `accountRuntime.ts` + `reconciliation.ts`
source-test pair (82 tests, 100% direct line/branch/function coverage), and
manual trace of all five `DEV-05 removal reconciliation` test scenarios
against the new code (cross-device pollution and permanent-recurrence
mechanisms both closed).

### WR-02: `Reconciliation.forget()` is production API with no production caller

**Files modified:** `src/runtime/accountRuntime.ts`
**Commit:** `a4c3641`
**Applied fix:** Resolved by the CR-01 fix above, per the review's own note
("Resolved by the CR-01 fix above; call `reconciliation.forget(deviceId)`
from `applyDevices()` once a deviceId is confirmed absent or observed to
have reappeared."). No separate code change was needed; `forget()` now has
a production caller in both branches of the CR-01 loop.

### WR-01: The Cucumber world only ever watches the devices present at launch, silently missing a device discovered on a later poll

**Files modified:** `features/support/world.ts`
**Commit:** `e20c176`
**Applied fix:** Added a `watchedDeviceIds` Set to `BasementGuardianWorld`
and made `watchDevices()` idempotent (skip a deviceId already watched).
Called `this.watchDevices(runtime)` from inside the `onTrustworthyInventory`
callback (right after `registerDiscoveredDevices`), so the world re-scans
`runtime.store.deviceIds()` after every trustworthy poll and subscribes to
any deviceId not already watched -- the first option the review's Fix
section offered, chosen over adding a new store-level "device added" hook
because it requires no production `src/` change. The original post-`start()`
call to `watchDevices()` was left in place; it is now a redundant, harmless
no-op for devices already caught by the first `onTrustworthyInventory` call
during `launch()`. Verified with `tsc --noEmit` (test tsconfig) and the full
`cucumber-js features/discovery.feature` suite (44/44 scenarios, 380/380
steps passing).

## Skipped Issues

None -- all in-scope findings were fixed.

## Verification environment note

Gates for both fixes (`tsc --noEmit`, `pre-commit run` including `npm lint`
/ `npm format:check` / `npm typecheck` / `npm fallow`, the direct-pair
coverage run, and `cucumber-js features/discovery.feature`) ran inside the
isolated fixer worktree at
`.claude/worktrees/rf-02-4061154-1788054831` (now removed), against a
temporary `node_modules` symlink to the main checkout's `node_modules`
(removed before each commit). The commits themselves (`a4c3641`, `e20c176`)
were made on the temp branch `gsd-reviewfix/02-4061154` inside that
worktree and fast-forwarded onto
`features/phase-02-safe-gemini-discovery-and-identity` during cleanup, so
the same numbers are reproducible from the main checkout's history.

---

_Fixed: 2026-08-30T02:04:31Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
