---
phase: 02-safe-gemini-discovery-and-identity
plan: 04
subsystem: device-discovery
tags: [homebridge, accessory-identity, vendor-rename, discovery]

# Dependency graph
requires:
  - phase: 02-safe-gemini-discovery-and-identity
    provides: "02-03: registry three-way outcome, registerDiscoveredDevices dispatch loop"
provides:
  - "src/platform.ts: registerDiscoveredDevices updates an already-cached deviceId in place (context.device refreshed, accessory.update(snapshot) called) instead of leaving it untouched"
  - "src/platform.ts: resolveVendorName/updateDiscoveredDevice implement D-030 vendor-rename adoption gated on accessory.displayName === accessory.context.lastVendorName"
  - "src/persistence/accessoryContext.ts: AccessoryContext.lastVendorName, its first production consumer, and a corrected fileoverview (deviceId is no longer claimed non-account-identifying)"
affects: [02-05, 02-06]

# Actuals (#2632)
actuals:
  tokens: 6500
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "updateDiscoveredDevice computes previousState/nextState as plain objects and gates the api.updatePlatformAccessories call on node:util isDeepStrictEqual, rather than an OR-chain of per-field comparisons, keeping the change-detection branch coverage to one condition regardless of how many tracked fields exist."
    - "BasementGuardianAccessoryContext.lastVendorName is typed as AccessoryContext['lastVendorName'] (an indexed-access reference, not a duplicated string literal type), giving the persistence module's declaration-only interface its first real type-level consumer without pulling in the pump/watermark fields this plan does not populate."

key-files:
  created: []
  modified:
    - src/persistence/accessoryContext.ts
    - test/persistence/accessoryContext.test.ts
    - .fallowrc.json
    - src/platform.ts
    - features/discovery.feature
    - features/support/steps/harness.ts
    - features/support/fakeHomebridgeApi.ts
    - test/platform.test.ts

key-decisions:
  - "The already-cached branch's api.updatePlatformAccessories call is gated on whether displayName, lastVendorName, or context.device actually changed, per the plan's explicit instruction, rather than calling it unconditionally on every poll."
  - "features/support/fakeHomebridgeApi.ts's FakeAccessory.displayName changed from readonly to a public parameter property (public displayName: string), matching the real, mutable homebridge PlatformAccessory.displayName; the harness's stricter type was blocking the 'user renames the accessory in the home app' simulation the plan's own action text calls for."
  - "test/platform.test.ts's 'leaves a deviceId already present in accessories untouched' case was rewritten (title and body) rather than left in place: it encoded the pre-fix 'leave it untouched' behavior this plan replaces, and updatePlatformAccessories now needed a stand-in on the fake API or every already-cached-branch unit test would throw."

patterns-established:
  - "A rename/change scenario that mutates device data mid-Cucumber-scenario waits on the accessory's own stored state (lastVendorName or context.device.deviceTypeId) via untilTrue before asserting displayName, rather than waiting on a raw vendor-request count — the former is synchronized to the exact discovery dispatch that applied the change, the latter is not."

requirements-completed: [DEV-04, DEV-06]

coverage:
  - id: D1
    description: "A device already present in accessories (looked up by deviceId-derived UUID) is always updated in place on a later discovery, never re-registered — the register-vs-update branch is a UUID cache lookup only, never conditioned on deviceTypeId or name."
    requirement: "DEV-04"
    verification:
      - kind: unit
        ref: "test/platform.test.ts#registerDiscoveredDevices updates a deviceId already present in accessories in place instead of registering it again"
        status: pass
      - kind: e2e
        ref: "features/discovery.feature#A deviceTypeId change keeps the same accessory"
        status: pass
    human_judgment: false
  - id: D2
    description: "On first registration (no prior lastVendorName stored), the accessory adopts the vendor-reported name outright and stores it as lastVendorName."
    requirement: "DEV-06"
    verification:
      - kind: e2e
        ref: "features/discovery.feature#A vendor rename is adopted when there is no prior customization"
        status: pass
    human_judgment: false
  - id: D3
    description: "Name comparison for rename adoption uses exact string equality (===) on the values as Homebridge and the vendor provide them, with no Unicode normalization."
    requirement: "DEV-06"
    verification:
      - kind: unit
        ref: "test/platform.test.ts#registerDiscoveredDevices adopts a vendor rename when the display name still matches the stored vendor name"
        status: pass
    human_judgment: false
  - id: D4
    description: "A vendor rename is adopted only when the HomeKit display name still equals the last vendor name the plugin stored; when they differ, the display name is left untouched and only lastVendorName advances."
    requirement: "DEV-06"
    verification:
      - kind: unit
        ref: "test/platform.test.ts#registerDiscoveredDevices keeps a customized display name but still advances the stored vendor name"
        status: pass
      - kind: e2e
        ref: "features/discovery.feature#A vendor rename is not adopted after a user customization"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-08-29
status: complete
---

# Phase 02 Plan 04: Identity-stable update branch and vendor-rename adoption Summary

**`platform.ts`'s discovery loop now updates an already-cached accessory in place (refreshing `context.device` and pushing the snapshot through `update()`) instead of leaving it untouched, and adopts a vendor rename only while the HomeKit display name still matches the last vendor name the plugin itself stored.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-29T19:58:00-04:00 (approximate)
- **Completed:** 2026-08-29T20:17:09-04:00
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- `src/persistence/accessoryContext.ts`: `AccessoryContext` gains a required `lastVendorName: string` field, and the fileoverview no longer claims the record holds no account identifier — `deviceId` embeds it and is now documented as treated as non-sensitive here, per the locked D-01 decision, while D-027 still keeps public artifacts on placeholders.
- `src/platform.ts`: `registerDiscoveredDevices`'s "already cached" branch, previously a bare `continue`, now looks up the cached accessory, computes the D-030 rename decision (`resolveVendorName`), refreshes `context.device` to the current `deviceTypeId`, calls `accessory.update(snapshot)`, and calls `api.updatePlatformAccessories([accessory])` only when the display name, stored vendor name, or device type actually changed.
- `src/platform.ts`: first registration now sets `accessory.context.lastVendorName` to the vendor-reported name (previously only `context.device` was set), giving DEV-06's adoption comparison a baseline from the moment an accessory is created.
- `features/discovery.feature`: four new scenarios — an already-cached device surviving a second poll without re-registering, a `deviceTypeId` change that keeps the same accessory (proven via a new "the accessory remembers the device type" step, not a poll-count race), a vendor rename adopted with no prior customization, and a vendor rename withheld after a user renamed the accessory in the Home app.
- `features/support/fakeHomebridgeApi.ts`: `FakeAccessory.displayName` changed from `readonly` to mutable (`public displayName: string`), correcting a harness/reality mismatch — the real `PlatformAccessory.displayName` is not readonly — that was blocking the new "user renames the accessory" step.
- `test/platform.test.ts`: replaced the now-incorrect "leaves a deviceId already present in accessories untouched" case with one that titles and asserts the new "updates in place" behavior, added `updatePlatformAccessories` to the fake discovery API stand-in, and added three new cases covering rename adoption, rename withholding, and the no-op (nothing-changed) branch, reaching 100% line/branch/function coverage on `platform.ts`.

## Task Commits

Each task was committed atomically:

1. **Task 1: AccessoryContext gains lastVendorName; fileoverview correction** - `c12ba34` (feat)
2. **Task 2: platform.ts identity-stable update branch and vendor-rename adoption** - `733aa58` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `src/persistence/accessoryContext.ts` - `lastVendorName: string` field; corrected fileoverview.
- `test/persistence/accessoryContext.test.ts` - `storedContext()` fixture and `satisfies`/`@ts-expect-error` cases for the new field.
- `.fallowrc.json` - Removed `src/persistence/accessoryContext.ts` from `ignoreFindings` now that `platform.ts` consumes its type.
- `src/platform.ts` - `resolveVendorName`, `updateDiscoveredDevice`, and the restructured `registerDiscoveredDevices` dispatch (snapshot lookup first, then existing-vs-new branch); `BasementGuardianAccessoryContext` gains `lastVendorName`.
- `features/discovery.feature` - Four new scenarios for the already-cached update path and vendor-rename adoption/withholding.
- `features/support/steps/harness.ts` - New steps: `the vendor reports these devices:`, `the user renames the accessory to "..." in the home app`, `the accessory remembers the vendor name "..."`, `the accessory remembers the device type "..."`, `the accessory is named "..."`.
- `features/support/fakeHomebridgeApi.ts` - `FakeAccessory.displayName` made mutable to match the real, non-readonly `PlatformAccessory.displayName`.
- `test/platform.test.ts` - `fakeDiscoveryApi` gains an `updateCalls` recorder; the stale "leaves it untouched" case replaced; new cases for rename adoption, rename withholding, and the no-op change-detection branch.

## Decisions Made

See `key-decisions` in the frontmatter above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `test/platform.test.ts`'s "leaves a deviceId already present in accessories untouched" case encoded the pre-fix behavior this plan replaces**

- **Found during:** Task 2
- **Issue:** The existing case asserted that an already-cached accessory is left completely untouched on a later poll. That was true of the old "leave it untouched" branch and is now false: the fixed branch updates the accessory in place. Running the unmodified test against the fix also threw (`context.api.updatePlatformAccessories is not a function`), since the fake API stand-in had no such method.
- **Fix:** Added `updatePlatformAccessories` to `fakeDiscoveryApi`'s stand-in (recording calls into an `updateCalls` array), and replaced the case with `'updates a deviceId already present in accessories in place instead of registering it again'`, asserting the new behavior (register count stays 1, `context.device` refreshed, one `updatePlatformAccessories` call).
- **Files modified:** `test/platform.test.ts`.
- **Verification:** `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` reaches 100% line/branch/function coverage; confirmed the rewritten case fails against the pre-fix `platform.ts` (register-count assertion aside, the coverage/type mismatch surfaces immediately) and passes against the fix.
- **Committed in:** `733aa58` (task 2 commit).

**2. [Rule 3 - Blocking] `features/support/fakeHomebridgeApi.ts`'s `FakeAccessory.displayName` was modeled `readonly`, blocking the plan's own required "user renames the accessory" simulation**

- **Found during:** Task 2
- **Issue:** The plan's action text calls for "a step to rename an accessory in the fake Home app before the next poll." The real Homebridge `PlatformAccessory.displayName` is a plain mutable `string` (verified against `node_modules/homebridge/dist/platformAccessory.d.ts`), but the harness's `FakeAccessory` interface and `HarnessPlatformAccessory` class declared it `readonly`, so a step assigning `accessory.displayName = name` would not compile.
- **Fix:** Changed `FakeAccessory.displayName` to a mutable field and `HarnessPlatformAccessory`'s constructor parameter property to `public displayName: string`, matching the real type it stands in for.
- **Files modified:** `features/support/fakeHomebridgeApi.ts`.
- **Verification:** `npm run typecheck` and three consecutive `npm run check` runs pass; the new "not adopted after a user customization" scenario exercises the mutation directly.
- **Committed in:** `733aa58` (task 2 commit).

---

**Total deviations:** 2 auto-fixed (1 Rule 1 - bug, 1 Rule 3 - blocking).
**Impact on plan:** Both were necessary for the existing test suite to keep testing what its titles claim and for the plan's own explicitly-requested rename-simulation step to compile and run. No scope creep — no file outside the plan's `files_modified` list plus these two directly-necessitated companions (`test/platform.test.ts`, `features/support/fakeHomebridgeApi.ts`) was touched.

## Issues Encountered

- **The first two of four new Cucumber scenarios initially passed against the pre-fix `platform.ts`**, which would have made them non-discriminating evidence. The "deviceTypeId change" scenario originally asserted only a vendor-request-count floor; it was rewritten to wait on a new deterministic `the accessory remembers the device type "..."` step reading `context.device.deviceTypeId` directly, which does fail against the pre-fix code (confirmed by temporarily swapping in the pre-fix `platform.ts` and re-running). The "already-cached device updated on a second poll" scenario legitimately does not discriminate the fix — the "never re-register" invariant it proves held under both the old and new code — so it was kept as a supplementary invariant check rather than forced into a false discrimination claim.
- **Verified D2 (first registration sets `lastVendorName`) is genuinely covered, not just executed**, by temporarily disabling the `accessory.context.lastVendorName = snapshot.identity.name;` line on first registration and re-running the "adopted" scenario: it failed (`displayName` stayed at the original vendor name instead of adopting the rename), confirming the scenario discriminates this specific behavior. The line was restored immediately after (git diff confirmed clean).
- **`npm run check` was run three consecutive times** after Task 2, per the phase's own recorded hazard ("a single green run is not a green gate") — all three passed identically (570 unit tests, 41 Cucumber scenarios / 350 steps).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `AccessoryContext.lastVendorName` and `platform.ts`'s update/rename logic are complete for this plan's DEV-04/DEV-06 scope; a future plan can add the DEV-05 removal state machine and DEV-08 degrade-in-place on top of the same already-cached branch without restructuring it.
- `AccessoryContext`'s `serialNumber`, `primaryPump`, `backupPump`, and `watermarks` fields remain declaration-only (no production writer yet); `BasementGuardianAccessoryContext` in `platform.ts` deliberately stayed a lean context referencing only `AccessoryContext['lastVendorName']` rather than the whole interface, so a later plan populating pump-observation state is free to wire those fields without revisiting this one.
- No blockers.

## Self-Check: PASSED

Both files (`src/persistence/accessoryContext.ts`, `src/platform.ts`) and all six other modified files confirmed present via `git show`/`git status`. Both task commit hashes (`c12ba34`, `733aa58`) confirmed present in `git log --oneline`.

---
*Phase: 02-safe-gemini-discovery-and-identity*
*Completed: 2026-08-29*
