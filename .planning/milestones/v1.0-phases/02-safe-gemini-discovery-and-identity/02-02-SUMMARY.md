---
phase: 02-safe-gemini-discovery-and-identity
plan: 02
subsystem: device-lifecycle
tags: [node-test, homebridge, device-state, reconciliation]

# Dependency graph
requires:
  - phase: 02-01
    provides: src/device/state.ts's DeviceStateStore, which this plan extends with remove()
provides:
  - "createReconciliation: a family-neutral, injectable state machine that tracks per-deviceId consecutive-absence counts across trustworthy inventory responses and reports confirmed-absent deviceIds"
  - "DeviceStateStore.remove(deviceId): drops a device's snapshot and listeners so a later applyDiscovery starts a fresh observation epoch"
affects: [02-05]

actuals:
  tokens: 2689
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Reconciliation module mirrors src/device/state.ts's factory-with-injected-options-and-closure-state shape: createReconciliation({ clock, log }) returns a closure-backed Map<string, number>."
    - "observe(deviceIds) takes only a caller-verified-trustworthy deviceId list — no connectivity flag, no HTTP-status input — so a failed or malformed poll can never reach the counter (D-029)."

key-files:
  created:
    - src/accessories/reconciliation.ts
    - test/accessories/reconciliation.test.ts
  modified:
    - src/device/state.ts
    - test/device/state.test.ts

key-decisions:
  - "Kept the reconciliation map entry for a present deviceId (set to 0) rather than deleting it, so a subsequent absence from a previously-tracked deviceId still advances a real counter instead of being treated as never-before-seen."
  - "Logged via options.log.debug on the transition to confirmed-absent (the safety-relevant removal signal), leaving the injected clock unused for now — accepted since the plan's own factory signature mirrors src/device/state.ts's DeviceStateStoreOptions shape for composition-root consistency, even though this module has no timestamp need yet."

patterns-established:
  - "Reconciliation.observe: present resets a deviceId's count to zero; absent increments it and reports the deviceId in confirmedAbsent once its count reaches 2, and on every later call while it stays absent."

requirements-completed: [DEV-05]

coverage:
  - id: D1
    description: "Reconciliation module reports a deviceId confirmed absent only after two consecutive trustworthy inventory responses omit it, including when the responses are schema-valid empty lists; reappearance resets the count."
    requirement: "DEV-05"
    verification:
      - kind: unit
        ref: "test/accessories/reconciliation.test.ts#observe"
        status: pass
    human_judgment: false
  - id: D2
    description: "Reconciliation.forget stops tracking a deviceId and lets a later observation of it start a fresh count."
    requirement: "DEV-05"
    verification:
      - kind: unit
        ref: "test/accessories/reconciliation.test.ts#forget"
        status: pass
    human_judgment: false
  - id: D3
    description: "DeviceStateStore.remove drops a device's snapshot and listeners, so a later applyDiscovery for the same deviceId starts a fresh observation epoch with no previous shadow version."
    requirement: "DEV-05"
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#remove"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-29
status: complete
---

# Phase 02 Plan 02: DEV-05 Absence-Confirmation Reconciliation Summary

**Standalone `createReconciliation` state machine tracking two-consecutive-trustworthy-absence removal, plus `DeviceStateStore.remove()` to start a fresh observation epoch after confirmed removal.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-29T22:05:00Z (approximate)
- **Completed:** 2026-08-29T22:29:00Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- `src/accessories/reconciliation.ts`: `createReconciliation({ clock, log })` returns a `Reconciliation` with `observe(deviceIds)` and `forget(deviceId)`. `observe` takes only a deviceId list (never a connectivity flag or HTTP status), tracks per-deviceId consecutive-absence counts in a closure-held `Map`, and reports a deviceId in `confirmedAbsent` once it has been omitted from two consecutive calls — including when those calls pass an empty list, matching D-02's "a valid empty inventory counts toward removal." A reappearance resets the count to zero. `forget` drops all tracking for a deviceId, exactly as if it had never been observed.
- `DeviceStateStore.remove(deviceId)` (new method on the Phase 1 store in `src/device/state.ts`): deletes the stored snapshot and any registered listeners for `deviceId`. A later `applyDiscovery` for the same `deviceId` then rebuilds the snapshot with `previous === undefined`, taking the same code path a brand-new device takes and producing a fresh observation epoch per D-020.

## Task Commits

1. **Task 1: Reconciliation: two-consecutive-trustworthy-absence state machine** - `fdbdcc2` (feat)
2. **Task 2: DeviceStateStore.remove — drop a confirmed-absent device's canonical state** - `14a29e9` (feat)

**Plan metadata:** committed separately by the worktree agent per its execution contract (STATE.md/ROADMAP.md updates are owned by the orchestrator).

## Files Created/Modified

- `src/accessories/reconciliation.ts` - `createReconciliation`, `Reconciliation`, `ReconciliationOptions`; the DEV-05 absence-counter state machine.
- `test/accessories/reconciliation.test.ts` - `node:test` coverage for every `observe`/`forget` behavior case (100% function/line/branch on the focused pair).
- `src/device/state.ts` - adds `remove(deviceId): void` to the `DeviceStateStore` interface and its `createDeviceStateStore` implementation.
- `test/device/state.test.ts` - adds a `describe('remove', ...)` block covering drop, no-op-on-unknown-deviceId, fresh-epoch-on-rediscovery, and listener-drop cases.

## Decisions Made

- Chose to keep a present deviceId's map entry at count `0` (rather than deleting it) in `createReconciliation`, since deleting on presence would make a subsequently-tracked deviceId indistinguishable from a never-before-seen one on its next absence — verified this against the plan's own "present, absent, present, absent" reset-counter behavior case.
- The `ReconciliationOptions` factory signature accepts `clock` per the plan's explicit instruction (mirroring `DeviceStateStoreOptions`'s injected-options shape for composition-root consistency across factories), even though `observe`/`forget` have no current timestamp need; `log` is used to record the confirmed-absent transition.
- No `.fallowrc.json` change was needed: `npm run fallow` passed with zero issues, since fallow's dead-code entry-point detection already reaches `reconciliation.ts` through its paired test module.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `npm run check` (typecheck, lint, fallow, format:check, unit tests, Cucumber) was run three consecutive times after both tasks landed; all three runs were green (510/510 unit tests, 35/35 Cucumber scenarios), per this phase's own hazard record that a single green run is not a green gate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `createReconciliation` and `DeviceStateStore.remove` are ready for `02-05` to wire into the account runtime and Homebridge `unregisterPlatformAccessories` call, once `02-03`/`02-04` settle `platform.ts`.
- `02-05` still owns: calling `observe()` on every trustworthy poll, running the required final current-inventory check before removal per D-029, and calling `remove()` only after that final check confirms absence.

## Self-Check: PASSED

- FOUND: src/accessories/reconciliation.ts
- FOUND: test/accessories/reconciliation.test.ts
- FOUND: commit fdbdcc2
- FOUND: commit 14a29e9

---

*Phase: 02-safe-gemini-discovery-and-identity*
*Completed: 2026-08-29*
