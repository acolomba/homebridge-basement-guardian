---
phase: 02-safe-gemini-discovery-and-identity
reviewed: 2026-08-29T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - .fallowrc.json
  - features/discovery.feature
  - features/support/fakeHomebridgeApi.ts
  - features/support/fakeRestApi.ts
  - features/support/steps/harness.ts
  - features/support/world.ts
  - src/accessories/basementGuardian.ts
  - src/accessories/reconciliation.ts
  - src/device/gemini.ts
  - src/device/halo.ts
  - src/device/registry.ts
  - src/device/state.ts
  - src/persistence/accessoryContext.ts
  - src/platform.ts
  - src/runtime/accountRuntime.ts
  - test/accessories/basementGuardian.test.ts
  - test/accessories/reconciliation.test.ts
  - test/device/gemini.test.ts
  - test/device/halo.test.ts
  - test/device/registry.test.ts
  - test/device/state.test.ts
  - test/persistence/accessoryContext.test.ts
  - test/platform.test.ts
  - test/runtime/accountRuntime.test.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-08-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Third-pass re-review of the full file scope (not just the previously flagged lines), per instructions.
The three prior fixes were independently re-derived from the current source rather than taken on faith:

- **CR-01** (`accountRuntime.ts`, `applyDevices`): the final-check re-observe loop iterates only
  `confirmedAbsent`, calling `reconciliation.forget()`/`onDeviceRemoved()` per deviceId based on
  membership in the freshly re-fetched `stillPresent` set. Confirmed correct by reading the code and by
  the passing `DEV-05 removal reconciliation` unit suite (`makes exactly one final-check fetch per
  cycle and removes every deviceId still absent from it`, `does not remove a deviceId that reappears in
  the final-check fetch, and resets its absence count`).
- **WR-01** (`world.ts`, `watchDevices`): re-scanned from inside the `onTrustworthyInventory` callback
  after every poll, with an idempotent `watchedDeviceIds` guard, so a device discovered only on a later
  poll still gets a listener.
- **WR-03** (`world.ts`, `onDeviceRemoved`): `this.watchedDeviceIds.delete(deviceId)` is called
  alongside `removeDiscoveredDevice()`. Traced against `state.ts`'s `remove()`, which does
  `listeners.delete(deviceId)` — dropping the store's entire listener registry entry for that device.
  Without the prune, `watchedDeviceIds` would still contain the deviceId after removal, so
  `watchDevices()`'s `if (this.watchedDeviceIds.has(deviceId)) continue;` guard would skip
  re-subscribing it on a later re-discovery, even though the store holds no listener for it anymore.
  The fix is logically sound and matches the store's actual removal semantics.

Toolchain gate, run fresh:

- `npx tsc --noEmit` — clean.
- `npx eslint . --max-warnings=0` — clean.
- `npm run test:unit` — 588/588 passing.
- `npm run test:coverage:direct` on each in-scope source/test pair (`state.ts`, `platform.ts`,
  `accountRuntime.ts`, `reconciliation.ts`, `basementGuardian.ts`, `gemini.ts`, `registry.ts`,
  `halo.ts`) — 100% line/branch/function coverage on every one, run alone.
- `npx cucumber-js features/discovery.feature` and the full `npx cucumber-js` — 44/44 scenarios,
  380/380 steps passing.

One gap survived this pass: the WR-03 fix itself has no regression test, verified empirically (see
WR-04 below) rather than asserted from reading the diff.

## Warnings

### WR-04: The WR-03 fix has no regression coverage; a revert would go undetected

**File:** `features/discovery.feature` (all scenarios), `features/support/world.ts:506-512`
**Issue:**

`onDeviceRemoved`'s `this.watchedDeviceIds.delete(deviceId)` (the WR-03 fix) is exercised by no
scenario in `discovery.feature`. Verified empirically: `git revert --no-commit d22ae7b` (removing the
4-line fix), rebuilding, and running both `npx cucumber-js features/discovery.feature` and the full
`npx cucumber-js` still produced **44/44 scenarios, 380/380 steps passing** — identical to the result
with the fix present. The revert was then aborted and the working tree restored to the fixed state, and
the fix is present and correct in the current tree.

None of the nine scenarios in `discovery.feature` puts a device through the specific sequence the fix
protects: confirmed-absent removal (two trustworthy polls + the out-of-band final check), *followed by*
re-discovery, *followed by* an assertion that the reappeared device's canonical state changes are still
observed. The closest scenario, "A device that reappears before the final check is not removed", never
crosses the removal threshold — the device reappears before `onDeviceRemoved` ever fires, so it never
touches the code path WR-03 changed. The other removal scenario, "A device omitted from two trustworthy
polls and a final check is removed", ends at removal and never re-discovers the device.

Because `world.ts`'s own file comment states its purpose is to be "usable as a regression guard for the
scenarios that follow," an untested fix inside it is a direct miss of that stated goal: the next
refactor of `watchDevices()`/`onDeviceRemoved()` could silently reintroduce the WR-03 bug (a
removed-then-rediscovered device going permanently unwatched, with `world.changes` going quiet for it
and no error raised) and the full Cucumber suite would still report 100% green.

Note this is harness-only risk today: `store.subscribe()` has no production consumer yet (confirmed via
`grep -rn "store.subscribe" src/` — zero hits outside the harness and `state.test.ts`), so the
regression this protects against is currently in test infrastructure, not yet in a shipped feature. That
keeps this a WARNING rather than a BLOCKER, but it should be closed before a production consumer of
`DeviceStateStore.subscribe()` starts relying on this harness as its regression guard.

**Fix:** Add a scenario (or extend "A device omitted from two trustworthy polls and a final check is
removed") that, after the accessory is unregistered, re-adds the device via `these devices:` /
`the vendor reports these devices:`, forces another poll, and asserts on `this.changes` (the existing
`the plugin reports N canonical changes` step from `features/support/steps/shadow.ts` is reusable) or on
a new `Then` step reading `this.changes` directly, to prove the re-subscription actually happened rather
than only that no crash occurred.

---

_Reviewed: 2026-08-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
