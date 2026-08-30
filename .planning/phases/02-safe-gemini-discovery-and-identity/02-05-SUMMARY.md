---
phase: 02-safe-gemini-discovery-and-identity
plan: 05
subsystem: device-lifecycle
tags: [node-test, cucumber, homebridge, device-removal, reconciliation]

# Dependency graph
requires:
  - phase: 02-02
    provides: "createReconciliation's two-consecutive-trustworthy-absence state machine and DeviceStateStore.remove()"
  - phase: 02-04
    provides: "platform.ts's registerDiscoveredDevices dispatch loop and identity-stable update branch"
provides:
  - "accountRuntime.ts: an in-process reconciliation instance wired into applyDevices, plus a required onDeviceRemoved hook that fires only after two consecutive trustworthy omissions AND one further out-of-band final-check fetch confirm absence"
  - "platform.ts: removeDiscoveredDevice, called through onDeviceRemoved, which unregisters the accessory, drops it from the cache, and calls store.remove(deviceId)"
affects: [02-06]

actuals:
  tokens: 8344
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "applyDevices became async: after firing onTrustworthyInventory, it calls reconciliation.observe(deviceIds); a non-empty confirmedAbsent triggers exactly one extra api.devices() call (the final check), whose result is fed through reconciliation.observe again before any onDeviceRemoved call, and a failing final-check fetch is swallowed silently so the pending deviceIds are re-evaluated on the next successful poll with no separate retry state."
    - "features/support/fakeRestApi.ts gained a one-shot devices-answer queue (armDevicesAnswer) so a Cucumber scenario can script the confirming poll and its own immediate final-check fetch independently by request order, since the two happen back to back with no scenario-controllable timing gap."

key-files:
  created: []
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - src/platform.ts
    - test/platform.test.ts
    - features/discovery.feature
    - features/support/steps/harness.ts
    - features/support/world.ts
    - features/support/fakeRestApi.ts

key-decisions:
  - "The final-check fetch's fresh deviceId list is never fed through store.applyDiscovery — only through reconciliation.observe. Nothing in the plan's must_haves or action text asks for the final check to refresh canonical device state, and doing so would blur the final check's one job (confirm absence) with the ordinary poll's job (refresh state)."
  - "onDeviceRemoved is a required AccountRuntimeOptions field (matching the existing onTrustworthyInventory shape) but an optional AccountRuntimeDeps field defaulting to a no-op, so createAccountRuntimeFromConfig callers that never remove anything (most existing tests) need no change."

patterns-established:
  - "removeDiscoveredDevice(context, deviceId, store) mirrors registerDiscoveredDevices's DiscoveryContext-based signature: derive the UUID the same way discovery does, look it up in the shared accessories Map, no-op on a miss, otherwise unregister + delete + store.remove()."

requirements-completed: [DEV-05]

coverage:
  - id: D1
    description: "A deviceId is removed only after two consecutive trustworthy inventory responses omit it, plus one further out-of-band final-check fetch that also omits it; a single omission never removes anything."
    requirement: "DEV-05"
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#DEV-05 removal reconciliation makes exactly one final-check fetch per cycle and removes every deviceId still absent from it"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#DEV-05 removal reconciliation never reports removal for a deviceId absent once between two present observations"
        status: pass
      - kind: e2e
        ref: "features/discovery.feature#A device omitted from two trustworthy polls and a final check is removed"
        status: pass
    human_judgment: false
  - id: D2
    description: "A deviceId that reappears in the final-check fetch is not removed, and the fetch's result resets its absence count through reconciliation.observe rather than merely skipping one removal."
    requirement: "DEV-05"
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#DEV-05 removal reconciliation does not remove a deviceId that reappears in the final-check fetch, and resets its absence count"
        status: pass
      - kind: e2e
        ref: "features/discovery.feature#A device that reappears before the final check is not removed"
        status: pass
    human_judgment: false
  - id: D3
    description: "A final-check fetch that itself fails removes nobody, logs nothing as a device-offline condition, and leaves the pending deviceId eligible for the next successful poll's own confirmedAbsent computation."
    requirement: "DEV-05"
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#DEV-05 removal reconciliation reports no removal when the final-check fetch itself fails, and retries the check on the next successful poll"
        status: pass
    human_judgment: false
  - id: D4
    description: "Confirmed removal unregisters the accessory from HomeKit, drops it from platform.ts's accessories cache, and calls store.remove(deviceId), so a later rediscovery of the same deviceId takes the brand-new-accessory path."
    requirement: "DEV-05"
    verification:
      - kind: unit
        ref: "test/platform.test.ts#removeDiscoveredDevice unregisters a cached accessory, drops it from accessories, and removes its stored state"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#BasementGuardianPlatform unregisters a confirmed-absent accessory once two trustworthy polls and a final check agree it is gone"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-08-29
status: complete
---

# Phase 02 Plan 05: DEV-05 removal protocol wired end to end Summary

**`accountRuntime.ts` runs the two-confirmation-plus-final-check removal state machine live against every poll, and `platform.ts` acts on a confirmed removal by unregistering the accessory and clearing its stored state.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-08-29T20:20:00-04:00 (approximate)
- **Completed:** 2026-08-29T21:05:00-04:00
- **Tasks:** 2
- **Files modified:** 8 (0 created, 8 modified)

## Accomplishments

- `src/runtime/accountRuntime.ts`: `createAccountRuntime` builds its own `reconciliation = createReconciliation({ clock, log })` instance. `applyDevices` (now `async`, awaited from both `launch()` and `runPoll()`) calls `reconciliation.observe(deviceIds)` right after firing `onTrustworthyInventory`; a non-empty `confirmedAbsent` triggers exactly one extra `options.api.devices(root.signal)` call (the D-029 final check), whose fresh deviceId list is fed through `reconciliation.observe` again before deciding which of the original `confirmedAbsent` ids are still missing. Every id still missing fires the new, required `options.onDeviceRemoved(deviceId)`. A rejecting final-check fetch is swallowed silently: nothing is logged, nothing is removed, and the deviceId's count stays wherever `reconciliation` last left it, so the next successful poll's own `confirmedAbsent` computation picks it back up with no separate retry bookkeeping.
- `src/platform.ts`: new exported `removeDiscoveredDevice(context, deviceId, store)` derives the same UUID discovery derives, looks it up in the shared `accessories` Map, no-ops on a miss, and otherwise calls `api.unregisterPlatformAccessories`, deletes the cache entry, and calls `store.remove(deviceId)`. The constructor wires this through a new `onDeviceRemoved` closure into `createAccountRuntimeFromConfig`, mirroring the existing `onTrustworthyInventory` wiring. The class-level doc comment no longer claims the platform removes nothing unconditionally — it now states the D-03 cache-restore invariant plus the DEV-05/D-029 removal condition side by side.
- `features/discovery.feature` and `features/support/steps/harness.ts`: two new scenarios — one where a device omitted from two trustworthy polls plus the final check is removed, one where the device reappears in the final check and is never removed. New steps: `the vendor reports no devices`, `the vendor omits the device from the next {int} inventory checks`, `the plugin unregisters the accessory`, `the plugin never unregisters the accessory`.
- `test/runtime/accountRuntime.test.ts` and `test/platform.test.ts`: full behavioral coverage of the removal protocol at both layers, including a dedicated test proving `createAccountRuntimeFromConfig`'s default no-op `onDeviceRemoved` doesn't raise when a removal actually fires.

## Task Commits

1. **Task 1: accountRuntime: two-confirmation-plus-final-check removal protocol** - `804aab7` (feat)
2. **Task 2: platform.ts: act on confirmed removal; update the Phase-1 "removes nothing" invariant** - `2a4d07f` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `src/runtime/accountRuntime.ts` - `reconciliation` instance, async `applyDevices` with the final-check protocol, required `onDeviceRemoved` on `AccountRuntimeOptions`, optional `onDeviceRemoved` on `AccountRuntimeDeps`.
- `test/runtime/accountRuntime.test.ts` - `describe('DEV-05 removal reconciliation', ...)` (5 cases covering every `<behavior>` point) plus a `createAccountRuntimeFromConfig` case proving the default no-op listener works.
- `src/platform.ts` - `removeDiscoveredDevice`, `onDeviceRemoved` wiring, corrected class doc comment.
- `test/platform.test.ts` - retitled the D-03 cache-restore test, added `describe('removeDiscoveredDevice', ...)`, and added a full-lifecycle `BasementGuardianPlatform` case driving an actual removal through two mocked poll cycles.
- `features/discovery.feature` - two new removal scenarios.
- `features/support/steps/harness.ts` - `the vendor reports no devices`, `the vendor omits the device from the next {int} inventory checks`, `the plugin unregisters the accessory`, `the plugin never unregisters the accessory`.
- `features/support/world.ts` - wired `onDeviceRemoved` into the Cucumber world's own `createAccountRuntimeFromConfig` call, mirroring `platform.ts`'s constructor (undeclared file; see Deviations).
- `features/support/fakeRestApi.ts` - `armDevicesAnswer`, a one-shot devices-answer queue (undeclared file; see Deviations).

## Decisions Made

See `key-decisions` in the frontmatter above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `features/support/world.ts` never wired `onDeviceRemoved`, so the Cucumber removal scenarios silently never removed anything**

- **Found during:** Task 2, while running the new discovery.feature scenarios.
- **Issue:** `world.ts` builds the account runtime directly through `createAccountRuntimeFromConfig` rather than through `BasementGuardianPlatform`, and only wired `onTrustworthyInventory`. Since `onDeviceRemoved` is optional on `AccountRuntimeDeps` (defaulting to a no-op), the removal scenario ran to completion with the reconciliation state machine correctly confirming absence, but nothing ever called `unregisterPlatformAccessories` — the scenario hung until its 2-second deadline.
- **Fix:** Added the same `onDeviceRemoved: (deviceId) => removeDiscoveredDevice({...}, deviceId, runtime.store)` closure `platform.ts`'s constructor uses.
- **Files modified:** `features/support/world.ts` (not in the plan's declared `files_modified`).
- **Verification:** Both new Cucumber scenarios pass; `npm run test:cucumber` run three consecutive times, all green (43/43 scenarios).
- **Committed in:** `2a4d07f` (Task 2 commit).

**2. [Rule 3 - Blocking] `features/support/fakeRestApi.ts` had no way to script the confirming poll and its own immediate final-check fetch differently**

- **Found during:** Task 2, while writing "A device that reappears before the final check is not removed."
- **Issue:** The final-check fetch is issued immediately after its confirming poll, inside the same `applyDevices` call, with no scenario-controllable gap (real timers, real HTTP round trips). `setDevices()` only holds one standing answer, so there was no way to make the confirming poll see an empty inventory while the very next fetch saw the device present, without racing real time.
- **Fix:** Added `armDevicesAnswer(devices)`, a FIFO one-shot queue consumed in request order before falling back to the standing `setDevices()` list — mirrors `failNextWith`'s existing one-shot idiom, generalized to a queue. The reappear scenario queues exactly two empty answers and leaves the standing device list untouched, so the third `/devices` request (the final check) naturally reverts to the original present device.
- **Files modified:** `features/support/fakeRestApi.ts` (not in the plan's declared `files_modified`).
- **Verification:** `npm run test:cucumber` run three consecutive times, all green.
- **Committed in:** `2a4d07f` (Task 2 commit).

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking).
**Impact on plan:** Both were necessary for the plan's own explicitly-requested second Cucumber scenario ("a second scenario where the device reappears before the final check and is never removed") to exist and to actually exercise the real wiring end to end. No scope creep beyond what completing the plan's stated tasks required.

## Issues Encountered

- **`test/platform.test.ts`'s new full-lifecycle removal test initially failed with `TypeError: Cannot read properties of undefined (reading 'generate')`.** `strong-mock`'s property-read expectations default to `min: 1, max: 1` (consumed exactly once), same as call expectations; `api.hap` is read three times across this scenario (twice while registering the accessory, once more while deriving the UUID for removal). Fixed by adding `.times(3)` to the `when(() => api.hap)` stub, matching the codebase's existing convention (`test/platform.test.ts`'s `configureAccessory` tests already use `.times(2)` for a getter read twice). Confirmed by temporarily logging the thrown error before applying the fix.
- **`npm run check` was run three consecutive times** after both tasks landed, per this phase's own recorded hazard ("a single green run is not a green gate") — all three runs were green (579/579 unit tests, 43/43 Cucumber scenarios).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `DEV-05` is fully implemented and verified: the removal protocol runs live in `accountRuntime.ts` and `platform.ts` acts on it.
- `02-06` (DEV-08 degrade-in-place) depends on this plan and also touches `src/platform.ts` and `features/discovery.feature`; both files are in a clean, fully-tested state for it to build on.
- No blockers.

## Self-Check: PASSED

- FOUND: src/runtime/accountRuntime.ts
- FOUND: test/runtime/accountRuntime.test.ts
- FOUND: src/platform.ts
- FOUND: test/platform.test.ts
- FOUND: features/discovery.feature
- FOUND: features/support/steps/harness.ts
- FOUND: features/support/world.ts
- FOUND: features/support/fakeRestApi.ts
- FOUND: commit 804aab7
- FOUND: commit 2a4d07f

---

*Phase: 02-safe-gemini-discovery-and-identity*
*Completed: 2026-08-29*
