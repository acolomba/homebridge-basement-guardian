---
phase: 02-safe-gemini-discovery-and-identity
reviewed: 2026-08-30T02:12:21Z
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
  info: 1
  total: 2
status: issues_found
---

# Phase 02: Code Review Report (re-review after fix pass)

**Reviewed:** 2026-08-30T02:12:21Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

This is a re-review of `02-REVIEW-FIX.md`'s claim that CR-01, WR-01, and WR-02 from the prior
`02-REVIEW.md` are fixed by commits `a4c3641` (`src/runtime/accountRuntime.ts`) and `e20c176`
(`features/support/world.ts`). The toolchain was re-run from scratch rather than trusted from the
fix report: `tsc --noEmit` on both `tsconfig.json` and `tsconfig.test.json`, `eslint . --max-warnings=0`,
`npm run format:check`, `npm run fallow`, the full unit suite (588 tests), direct per-pair coverage
on `accountRuntime.ts`/`reconciliation.ts` (83 tests, 100% line/branch/function, run alone), and
`cucumber-js features/discovery.feature` (44/44 scenarios, 380/380 steps) — all green.

**CR-01 and WR-02 are genuinely fixed.** Reading the current `applyDevices()` confirms the blanket
`reconciliation.observe(freshDeviceIds)` call is gone; the final-check loop now iterates only
`confirmedAbsent` and calls `reconciliation.forget(deviceId)` on both branches (reappeared or
confirmed-and-removed), which structurally eliminates both the cross-device pollution and the
permanent-recurrence mechanism the original repro proved — a device that reaches `confirmedAbsent`
and is not present in the final check is `forget()`-ed before `onDeviceRemoved` fires, so it can
never advance an unrelated device's count again and can never keep re-triggering the extra fetch
after removal (there is nothing left in the reconciliation `Map` to keep incrementing). `forget()`
now has two production call sites in `applyDevices()`, resolving WR-02 as a direct consequence.

**WR-01 is only partially fixed.** The applied fix (a `watchedDeviceIds` Set that makes
`watchDevices()` idempotent, called from `onTrustworthyInventory` on every poll) correctly closes
the originally-reported gap: a device discovered for the first time on a later poll is now watched.
But the fix adds a new, still-open gap of the identical shape it was written to close: the Set is
never pruned when a device is removed, and `DeviceStateStore.remove()` (`src/device/state.ts:320-323`)
deletes that device's entire listener registry entry on removal. A device that is confirmed absent,
removed, and later reappears is silently never re-subscribed — the world goes on recording nothing
for it, for the same "empty array indistinguishable from a live but silent listener" reason WR-01
originally described. See WR-03 below, proved with a standalone repro against the compiled
`state.js`, not merely asserted.

No other defects were found in this pass. The remaining files in scope are unchanged since the
original review (only `accountRuntime.ts` and `world.ts` were touched by the fix commits) and were
spot-checked again (`basementGuardian.ts`, `registry.ts`, `state.ts`, `platform.ts`,
`harness.ts`) with no new findings.

## Warnings

### WR-03: The WR-01 fix's `watchedDeviceIds` Set is never pruned on removal, so a device removed and later re-discovered is never re-watched

**File:** `features/support/world.ts:178, 504, 517-543`; interacts with `src/device/state.ts:320-323`
and `src/platform.ts:208-220`

**Issue:**

`watchDevices()` now guards on a scenario-lifetime `Set`:

```ts
private readonly watchedDeviceIds = new Set<string>();
...
private watchDevices(runtime: AccountRuntime): void {
  for (const deviceId of runtime.store.deviceIds()) {
    if (this.watchedDeviceIds.has(deviceId)) {
      continue;
    }
    this.watchedDeviceIds.add(deviceId);
    const unsubscribe = runtime.store.subscribe(deviceId, ...);
    ...
  }
}
```

`watchedDeviceIds` only ever grows. `removeDiscoveredDevice()` (`src/platform.ts:208-220`), which
`onDeviceRemoved` invokes, calls `store.remove(deviceId)`, and `DeviceStateStore.remove()`
(`src/device/state.ts:320-323`) does:

```ts
remove(deviceId: string): void {
  snapshots.delete(deviceId);
  listeners.delete(deviceId);   // the whole per-device listener registry entry is gone
},
```

If the same `deviceId` is later re-discovered (the vendor reports it again — the exact scenario
DEV-05's own removal design anticipates and that `platform.ts:196-206`'s doc comment names
explicitly: "a later re-discovery of the same `deviceId`... starts a fresh observation epoch"),
`registerDiscoveredDevices()` calls `store.applyDiscovery()` again and `onTrustworthyInventory`
calls `watchDevices()` again — but `watchedDeviceIds.has(deviceId)` is still `true` from before the
removal, so the `continue` fires and no new `store.subscribe()` call is ever made. The store's
listener map for that `deviceId` is empty (deleted by `remove()`), so every future canonical-state
change for that device is silently dropped from `world.changes` for the rest of the scenario — no
error, no empty-vs-never-subscribed distinction, exactly the vacuous-pass failure mode the original
WR-01 finding described.

Proved with a standalone repro against the compiled `src/device/state.js` (the real production
store), reimplementing `watchDevices()`'s exact logic:

```
$ node repro-wr01.mjs
after poll 2, changes: [ 'D waterLevel' ]
after reappearance + change, changes: [ 'D waterLevel' ]
BUG: no listener ever re-subscribed for D after removal: true
```

No currently-committed scenario in `features/discovery.feature` exercises "removed, then
re-discovered" while asserting `world.changes`, which is why the green Cucumber suite does not
catch this — the same reason the original WR-01 gap went uncaught.

**Fix:** Have `removeDiscoveredDevice`'s caller (the `onDeviceRemoved` listener in `launch()`) also
drop the deviceId from `watchedDeviceIds`, e.g.:

```ts
onDeviceRemoved: (deviceId: string): void => {
  removeDiscoveredDevice({ api: homebridge.api, accessories, basementGuardianAccessories, registry, log: this.logger() }, deviceId, runtime.store);
  this.watchedDeviceIds.delete(deviceId);
},
```

so a later re-discovery's `watchDevices()` call finds the deviceId absent from the Set and
re-subscribes it against the store's freshly-empty listener registry for that id.

## Info

### IN-01: `BasementGuardianAccessory.services` is a permanent empty literal this phase

**File:** `src/accessories/basementGuardian.ts:161`

**Issue:** Unchanged since the original review. `services: []` is hard-coded, intentional, and
explicitly tested; flagged only so it is not mistaken for an oversight when the next phase starts
publishing real services from this same factory.

**Fix:** None needed now.

---

_Reviewed: 2026-08-30T02:12:21Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
