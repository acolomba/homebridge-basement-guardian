---
phase: 02-safe-gemini-discovery-and-identity
plan: 03
subsystem: device-discovery
tags: [homebridge, family-registry, gemini, halo, log-cadence]

# Dependency graph
requires:
  - phase: 02-safe-gemini-discovery-and-identity
    provides: "02-01: createFamilyRegistry seam, DeviceFamily<T>, registerDiscoveredDevices dispatch loop, discovery.feature/harness.ts conventions"
provides:
  - "src/device/registry.ts: three-way implemented/unsupported/unknown outcome, plus a shouldLog log-cadence tracking helper"
  - "src/device/halo.ts: HALO_DEVICE_TYPE_ID and HALO_DISPLAY_NAME runtime constants"
  - "src/platform.ts: registerDiscoveredDevices dispatches every discovered device through the registry, not only ones that will register"
affects: [02-02, 02-04, 02-05, 02-06]

# Actuals (#2632)
actuals:
  tokens: 5840
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Registry log-cadence tracking as a Map<deviceId, lastLoggedDeviceTypeId> closure-held inside createFamilyRegistry, separate from the pure lookup() method"
    - "registerDiscoveredDevices dispatches every deviceId through registry.lookup() with a per-device continue, so one skipped device never blocks the rest of the batch"

key-files:
  created: []
  modified:
    - src/device/registry.ts
    - src/device/halo.ts
    - test/device/registry.test.ts
    - test/device/halo.test.ts
    - src/platform.ts
    - test/platform.test.ts
    - features/discovery.feature
    - features/support/steps/harness.ts
    - test/accessories/basementGuardian.test.ts
    - .fallowrc.json

key-decisions:
  - "shouldLog lives on FamilyRegistry as a second method beside lookup(), rather than folding cadence tracking into lookup()'s return value. lookup() stays a pure function with no side effects, matching the plan's explicit behavior requirement; shouldLog is the separate, explicitly-invoked concern a caller drives once per device per registry-observed change."
  - "HALO_DEVICE_TYPE_ID and HALO_DISPLAY_NAME are runtime consts in halo.ts (not just the existing type), because the registry needs an actual value to compare a discovered deviceTypeId against — the type alone cannot be compared at runtime."
  - "The unsupported/unknown log message wording is a plain declarative sentence naming the deviceId, the deviceTypeId, and (for unsupported) the display name, distinct per kind, so a reader can tell 'recognized but unsupported' apart from 'never seen' without inspecting code."

patterns-established:
  - "A non-implemented outcome's explanation is gated on registry.shouldLog(deviceId, deviceTypeId) before logging, so the same explanation never repeats across polls unless the deviceTypeId itself changed (D-05)."

requirements-completed: [DEV-01, DEV-02]

coverage:
  - id: D1
    description: "The family registry resolves a deviceTypeId to exactly one of three outcomes: implemented (Gemini), unsupported (HALO), or unknown (anything else) — mutually exclusive, with a 100%-covered mutual-exclusivity test."
    requirement: "DEV-01"
    verification:
      - kind: unit
        ref: "test/device/registry.test.ts#createFamilyRegistry"
        status: pass
    human_judgment: false
  - id: D2
    description: "shouldLog logs a non-implemented deviceId/deviceTypeId pair once, and again only when the deviceTypeId changes for that deviceId (D-05 log-once-per-run cadence)."
    requirement: "DEV-01"
    verification:
      - kind: unit
        ref: "test/device/registry.test.ts#shouldLog"
        status: pass
    human_judgment: false
  - id: D3
    description: "platform.ts's registerDiscoveredDevices dispatches every discovered device through the registry: an implemented device registers, an unsupported or unknown device is explained once and never registered, and neither blocks a valid Gemini in the same batch."
    requirement: "DEV-01"
    verification:
      - kind: unit
        ref: "test/platform.test.ts#registerDiscoveredDevices"
        status: pass
      - kind: e2e
        ref: "features/discovery.feature#A HALO and an unknown device do not block a valid Gemini in the same inventory"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-08-29
status: complete
---

# Phase 02 Plan 03: Safe Gemini Discovery and Identity Summary

**The family registry's three-way outcome is complete — HALO now resolves to a distinct `unsupported` result instead of falling through to `unknown` — and `platform.ts` dispatches every discovered device through it, so a HALO or unknown-profile device gets its own once-per-run log explanation and never blocks a valid Gemini in the same inventory response.**

## Performance

- **Duration:** ~24 min
- **Started:** 2026-08-29T23:18:56Z
- **Completed:** 2026-08-29T23:42:35Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- `src/device/registry.ts`: the `Map` populated at module load now includes the `'wayneWaterHalo'` entry, so `lookup('wayneWaterHalo')` returns `{ kind: 'unsupported', deviceTypeId, displayName }` instead of falling through to `unknown`. `lookup()` remains a pure function.
- `src/device/registry.ts`: a new `shouldLog(deviceId, deviceTypeId)` method, backed by a closure-held `Map<deviceId, lastLoggedDeviceTypeId>`, answers `true` the first time a device/type pair is seen (or when the type changes for that device) and `false` on every repeat — the D-05 once-per-device-per-run log cadence.
- `src/device/halo.ts`: added `HALO_DEVICE_TYPE_ID` (`'wayneWaterHalo'`) and `HALO_DISPLAY_NAME` (`'Wayne Water HALO'`) as real runtime values, giving the registry its first production consumer and letting `.fallowrc.json`'s `ignoreFindings` entry for the file come out.
- `src/platform.ts`: `registerDiscoveredDevices` now calls `registry.lookup()` for every discovered device (not only ones that end up registering). An `implemented` outcome follows the existing registration path unchanged; an `unsupported`/`unknown` outcome checks `shouldLog` and, when true, logs one distinct explanation naming the deviceId, deviceTypeId, and (for HALO) the display name — then `continue`s without touching `accessories` or calling `registerPlatformAccessories`.
- `features/discovery.feature`: a new scenario proves a mixed inventory (one Gemini, one HALO, one unknown-type device) registers exactly one accessory and logs exactly one explanation each for the HALO and the unknown device — confirmed to fail (3 accessories registered) against the pre-fix `platform.ts` and pass (1 accessory, 2 explanations) against the fix. A second forced poll (`a short poll interval` + `the plugin polls the vendor at least 2 times`) proves the explanation count does not grow across polls.

## Task Commits

Each task was committed atomically:

1. **Task 1: Registry three-way outcome and once-per-run log cadence** - `bf3faac` (feat)
2. **Task 2: platform.ts dispatches every discovered device through the registry** - `87ff828` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `src/device/registry.ts` - HALO entry in the outcome `Map`; `shouldLog` log-cadence tracking method.
- `src/device/halo.ts` - `HALO_DEVICE_TYPE_ID`/`HALO_DISPLAY_NAME` runtime constants.
- `test/device/registry.test.ts` - Mutual-exclusivity and `shouldLog` cadence coverage; HALO case upgraded from `unknown` to `unsupported`.
- `test/device/halo.test.ts` - Upgraded from a type-only stub to cover the new runtime constants.
- `src/platform.ts` - `registerDiscoveredDevices` dispatches every device through the registry; new `explainSkippedDevice` helper.
- `test/platform.test.ts` - New `implementedRegistry`/`unsupportedRegistry` fixtures and dispatch-branch coverage (implemented, unsupported, unknown, suppressed repeat, mixed batch never blocking a later valid device); the pre-existing "registers one accessory" case switched from an `unknown` registry fixture (whose new behavior no longer registers) to an `implemented` one.
- `features/discovery.feature` - New mixed-inventory scenario.
- `features/support/steps/harness.ts` - New `Then` step asserting the HALO and unknown explanations, using the real `HALO_DEVICE_TYPE_ID`/`HALO_DISPLAY_NAME` constants rather than duplicated literals.
- `test/accessories/basementGuardian.test.ts` - `registryWith()` fixture updated to satisfy the widened `FamilyRegistry` interface.
- `.fallowrc.json` - Removed `src/device/halo.ts` from `ignoreFindings`.

## Decisions Made

See `key-decisions` in the frontmatter above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `test/accessories/basementGuardian.test.ts` and `test/platform.test.ts` needed the new `shouldLog` method**

- **Found during:** Task 1
- **Issue:** `FamilyRegistry` gained a required `shouldLog` method. Two existing test files construct `FamilyRegistry` fixtures directly (`registryWith()` in `basementGuardian.test.ts`, `unknownRegistry()` in `platform.test.ts`) and would fail to compile without it.
- **Fix:** Added `shouldLog: () => true` to both fixtures — a stub, since neither test's own behavior exercises the log-cadence concern.
- **Files modified:** `test/accessories/basementGuardian.test.ts`, `test/platform.test.ts`.
- **Verification:** `npm run build:test` compiles; both pairs' existing cases still pass.
- **Committed in:** `bf3faac` (task 1 commit).

**2. [Rule 1 - Bug] `test/platform.test.ts`'s "registers one accessory" case used a registry fixture whose outcome the plan's own fix now excludes from registration**

- **Found during:** Task 2
- **Issue:** The pre-existing case `'registers one accessory for a newly discovered device not already in accessories'` used `unknownRegistry()` (an `unknown` outcome) and asserted one accessory registered. That assertion was only ever true because the *previous* `registerDiscoveredDevices` ignored the registry outcome when deciding whether to register — exactly the gap this plan's Task 2 closes. Once the fix landed, an `unknown` outcome correctly stops registration, and the case's own premise (assert registration happens) no longer matches its fixture.
- **Fix:** Added an `implementedRegistry()` fixture (backed by a minimal `FAKE_FAMILY` satisfying `DeviceFamily<unknown>`, independent of Gemini's own shape) and switched the case to use it, preserving its original intent — a genuinely new, implemented device registers.
- **Files modified:** `test/platform.test.ts`.
- **Verification:** `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` reaches 100% line/branch/function coverage; the case's assertion (`accessoryCount: 1`, one `registerPlatformAccessories` call) is unchanged.
- **Committed in:** `87ff828` (task 2 commit).

---

**Total deviations:** 2 auto-fixed (1 Rule 3 - blocking, 1 Rule 1 - bug).
**Impact on plan:** Both were necessary for the codebase to compile and for existing tests to keep testing what their titles claim, given the registry interface widened and the dispatch behavior changed exactly as the plan specifies. No scope creep — no file outside the plan's `files_modified` list was touched.

## Issues Encountered

- **Confirmed the tracer-equivalent RED/GREEN discipline for Task 2 manually, since the task is `type="auto"` rather than `type="tracer"`.** Before committing, the fixed `src/platform.ts` was temporarily reverted to its Task-1 (pre-fix) content via `git show HEAD:src/platform.ts`, and the new mixed-inventory Cucumber scenario was re-run: it failed (`3 !== 1` accessories registered), confirming the scenario discriminates the exact defect being fixed. The fix was then restored from a local backup (not `git checkout`, since the working tree had unstaged changes it would have discarded) and the full suite re-verified green.
- **`npm run check` was run three consecutive times** after Task 2, per the phase's own recorded hazard ("a single green run is not a green gate") — all three passed identically (567 unit tests, 37 Cucumber scenarios).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `src/device/registry.ts`'s `FamilyOutcome<T>` and `shouldLog` are now complete for this milestone's scope (Gemini implemented, HALO unsupported, everything else unknown); a future family only needs a new `Map` entry.
- `src/platform.ts`'s dispatch loop is the pattern later plans in this phase (reconciliation/removal in 02-02/02-05, vendor-rename in 02-04, degrade-in-place in 02-06) extend, not replace — it already iterates every discovered device independently with a per-device `continue`.
- No blockers.

## Self-Check: PASSED

All 10 files listed under "Files Created/Modified" confirmed present via `git status`/`git show`. Both task
commit hashes (`bf3faac`, `87ff828`) confirmed present in `git log --oneline`.

---
*Phase: 02-safe-gemini-discovery-and-identity*
*Completed: 2026-08-29*
