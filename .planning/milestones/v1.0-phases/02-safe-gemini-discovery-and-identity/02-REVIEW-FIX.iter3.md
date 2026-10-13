---
phase: 02-safe-gemini-discovery-and-identity
fixed_at: 2026-08-30T02:14:35Z
review_path: .planning/phases/02-safe-gemini-discovery-and-identity/02-REVIEW.md
iteration: 2
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-08-30T02:14:35Z
**Source review:** .planning/phases/02-safe-gemini-discovery-and-identity/02-REVIEW.md
**Iteration:** 2

**Summary:**

- Findings in scope: 1 (WR-03; IN-01 excluded, fix_scope is critical_warning)
- Fixed: 1
- Skipped: 0

## Fixed Issues

### WR-03: The WR-01 fix's `watchedDeviceIds` Set is never pruned on removal, so a device removed and later re-discovered is never re-watched

**Files modified:** `features/support/world.ts`
**Commit:** `d22ae7b`
**Applied fix:** Added `this.watchedDeviceIds.delete(deviceId)` to the `onDeviceRemoved` callback
inside `launch()`, right after `removeDiscoveredDevice()` runs. `removeDiscoveredDevice()` drives
`DeviceStateStore.remove()`, which deletes the device's entire listener registry entry, so a later
re-discovery needs `watchDevices()` to see the deviceId as unwatched again rather than skip it via
the stale `watchedDeviceIds.has(deviceId)` check. The fix matches the REVIEW.md suggestion exactly
— the code at the cited lines (`world.ts:502-508`) was unchanged since the review, so no adaptation
was needed.

**Verification:**

- Tier 1: re-read the modified section; the `this.watchedDeviceIds.delete(deviceId)` line is present
  and the surrounding `onDeviceRemoved` callback and `onTrustworthyInventory` callback are intact.
- Tier 2: `npx tsc --noEmit -p tsconfig.test.json` — clean, no errors. `npx eslint
  features/support/world.ts --max-warnings=0` — clean. Full `pre-commit run --files
  features/support/world.ts` also passed (prettier, npm lint, npm format check, npm typecheck, npm
  fallow), with `TruffleHog` skipped for the known worktree-mode limitation (documented in
  `CLAUDE.md`) and separately confirmed clean via a filesystem-mode scan
  (`verified_secrets: 0, unverified_secrets: 0`) before commit.
- Ran inside the isolated review-fix worktree (`.claude/worktrees/rf-02-4087440-1788056018`,
  branch `gsd-reviewfix/02-4087440`), not the main checkout; the worktree was fast-forward merged
  into `features/phase-02-safe-gemini-discovery-and-identity` and torn down after the commit.

No dedicated Cucumber scenario exercises "removed, then re-discovered" against `world.changes`
(REVIEW.md notes this gap explicitly), so this fix has not been exercised end-to-end by the
existing suite — only by static/syntax verification and manual trace of the call graph
(`onDeviceRemoved` → `removeDiscoveredDevice` → `store.remove()` deletes the listener registry
entry → next `onTrustworthyInventory` → `watchDevices()` now finds the deviceId absent from the
Set and resubscribes). This is a straightforward one-line prune, not a logic rewrite, so it is
recorded as `fixed`, not `fixed: requires human verification`.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-08-30T02:14:35Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
