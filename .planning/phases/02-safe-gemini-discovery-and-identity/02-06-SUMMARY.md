---
phase: 02-safe-gemini-discovery-and-identity
plan: 06
subsystem: accessory-lifecycle
tags: [homebridge, hap, degrade-in-place, trust-scope]

# Dependency graph
requires:
  - phase: 02-05
    provides: "accountRuntime.ts's live reconciliation wiring and platform.ts's removeDiscoveredDevice, plus a discovery.feature and basementGuardian.test.ts both left in a clean, fully-tested state"
provides:
  - "basementGuardian.ts: createBasementGuardianAccessory's update(snapshot) re-resolves the family registry and re-validates on every call, degrading in place (computed untrusted scopes, retained last-valid AccessoryInformation, log-once) instead of only at construction"
  - "platform.ts: a basementGuardianAccessories map, keyed the same way as the existing accessories cache, that reuses one BasementGuardianAccessory instance per physical accessory across every poll so its degrade-in-place closure state actually persists"
  - "discovery.feature: an end-to-end scenario proving a payload that stops validating stays registered, logs once, and recovers on the next valid poll"
affects: []

# Actuals (#2632)
actuals:
  tokens: 10615
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "createBasementGuardianAccessory's returned object exposes `untrusted` through a getter backed by closure-held mutable state (lastTrustedAt, a degraded flag, and the current UntrustedScope[]), the same factory-with-injected-options-and-closure-state shape state.ts and registry.ts already use — 'your discretion: a getter' from the plan, chosen because it lets update()'s internal state stay externally observable without a second write path."
    - "platform.ts now keeps two parallel Maps keyed by the same UUID: `accessories` (the HAP PlatformAccessory) and `basementGuardianAccessories` (the plugin-side wrapper). A get-or-create helper (basementGuardianAccessoryFor) is the only place either map's BasementGuardianAccessory entries are created or read, and removeDiscoveredDevice deletes from both together so a re-discovered deviceId starts a fresh epoch with no memory of a prior degradation."

key-files:
  created: []
  modified:
    - src/accessories/basementGuardian.ts
    - test/accessories/basementGuardian.test.ts
    - src/platform.ts
    - test/platform.test.ts
    - features/discovery.feature
    - features/support/steps/harness.ts
    - features/support/world.ts

key-decisions:
  - "The five degraded TrustScopes (water, pump, power, battery, fault) are a module-level constant reused verbatim in both the degrade branch and the recovery-clear branch, so the exact set and order used in production and asserted in tests can never drift apart silently."
  - "The log message text (`Degraded ${deviceId}: the profile or payload stopped validating. AccessoryInformation keeps its last valid values until a family-valid update recovers it.`) is asserted verbatim in both the unit test and the Cucumber step, matching the existing convention for the HALO/unknown skip-explanation messages in the same files."

patterns-established:
  - "update() computes degradation as a single early-return branch: family-valid path decodes, populates AccessoryInformation, updates lastTrustedAt, clears untrusted, and resets the log-once flag, then returns; every other outcome (unresolved family OR failed validate()) falls through to one shared degrade block. This is what makes 'a deviceTypeId change to unsupported/unknown' and 'a payload that stops validating with the same deviceTypeId' provably the identical path rather than two similar ones."

requirements-completed: [DEV-08]

coverage:
  - id: D1
    description: "A profile/payload validation failure marks water, pump, power, battery, and fault untrusted with reason 'invalid', carrying the last family-valid receivedAt; connectivity is left alone."
    requirement: "DEV-08"
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#degrades every non-connectivity scope when the registry reports no adapter for the deviceTypeId"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#degrades every non-connectivity scope when validate() reports the snapshot invalid"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#sets lastTrustedAt on degradation to the receivedAt of the last family-valid snapshot"
        status: pass
    human_judgment: false
  - id: D2
    description: "AccessoryInformation's published values freeze at their last family-valid values when a later snapshot degrades, and refresh again on recovery."
    requirement: "DEV-08"
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#keeps AccessoryInformation unchanged after a degrading update follows a valid one"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#recovers from degraded state on a following family-valid update"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#never calls decode() when validate() reports the snapshot invalid"
        status: pass
      - kind: e2e
        ref: "features/discovery.feature#A payload that stops validating degrades the accessory in place"
        status: pass
    human_judgment: false
  - id: D3
    description: "A deviceTypeId change to an unsupported/unknown family, and a payload that stops validating with the same deviceTypeId, route through the identical degradation path."
    requirement: "DEV-08"
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#produces the identical untrusted shape whether the family is unresolved or its validate() fails"
        status: pass
    human_judgment: false
  - id: D4
    description: "The degradation condition logs once at the transition into degraded state, and again only after a recovery followed by a later re-degradation — not on every poll while it remains degraded."
    requirement: "DEV-08"
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#logs the degradation transition exactly once across repeated degraded updates"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#logs again after recovering and degrading a second time"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#reuses the same BasementGuardianAccessory across polls so the DEV-08 log-once state persists"
        status: pass
      - kind: e2e
        ref: "features/discovery.feature#A payload that stops validating degrades the accessory in place"
        status: pass
    human_judgment: false
  - id: D5
    description: "A degraded accessory is never unregistered, never triggers HapStatusError, and never touches StatusFault; degrade-in-place is entirely internal to basementGuardian.ts, requiring no new dispatch logic in platform.ts."
    requirement: "DEV-08"
    verification:
      - kind: e2e
        ref: "features/discovery.feature#A payload that stops validating degrades the accessory in place"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#throws when the accessory carries no AccessoryInformation service"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-08-29
status: complete
---

# Phase 02 Plan 06: DEV-08 degrade-in-place Summary

**`basementGuardian.ts`'s `update(snapshot)` re-resolves the family registry and re-validates on every call, computing five untrusted `TrustScope`s and logging once on a plugin-side interpretation failure — and `platform.ts` now reuses one `BasementGuardianAccessory` instance per physical accessory instead of a fresh one per poll, which is what actually lets that state persist.**

## Performance

- **Duration:** ~55 min
- **Started:** 2026-08-29T20:50:00-04:00 (approximate)
- **Completed:** 2026-08-29T21:33:14-04:00
- **Tasks:** 2
- **Files modified:** 7 (0 created, 7 modified)

## Accomplishments

- `src/accessories/basementGuardian.ts`: `createBasementGuardianAccessory`'s `update(snapshot)` calls `registry.lookup(...)` on every invocation (not only at construction). A family-valid snapshot decodes, populates `AccessoryInformation`, and clears `untrusted`. Anything else — a registry outcome that is not `implemented`, or a family-valid `implemented` outcome whose own `validate()` fails — falls through to one shared degrade branch: `decode()` is never called, `AccessoryInformation` is never touched, and `untrusted` becomes the five non-connectivity `TrustScope`s (`water`, `pump`, `power`, `battery`, `fault`), each with `reason: 'invalid'` and the `lastTrustedAt` of the last family-valid `receivedAt`. A closure-held boolean logs the transition into degraded state exactly once via `log.warn`, resetting on recovery so a later re-degradation logs again. The `BasementGuardianAccessory` interface gains a read-only `untrusted: readonly UntrustedScope[]` field, exposed through a getter over the closure state.
- `src/platform.ts`: discovered and fixed a blocking gap while extending the discovery feature — both `registerDiscoveredDevices` and `updateDiscoveredDevice` previously called `createBasementGuardianAccessory` fresh on every poll, silently discarding the `degraded` flag and `lastTrustedAt` state Task 1 introduced. Added a `basementGuardianAccessories: Map<string, BasementGuardianAccessory>` to `DiscoveryContext`, and a `basementGuardianAccessoryFor(context, uuid, accessory)` get-or-create helper that both dispatch functions now go through, so the same instance survives across every poll for as long as the accessory stays registered. `removeDiscoveredDevice` deletes from both `accessories` and `basementGuardianAccessories` together, so a later re-discovery of the same `deviceId` starts a fresh degrade-in-place epoch with no memory of a prior degradation (D-020).
- `features/discovery.feature`: a new scenario seeds a valid Gemini, registers it, then reports an out-of-domain `water_level` (`99`, not in Gemini's legal `{0,1,3,7,15,31}` set) on the next poll, asserting the degradation logs exactly once and the accessory is never unregistered, then reports valid data again and asserts the accessory is still registered and still never unregistered across the whole sequence.
- `features/support/steps/harness.ts`: `toDevice()` gained an optional `waterLevel` table column, following the same model the `deviceTypeId` column established in `02-01`, plus the new `Then the plugin explains the degradation once` step.

## Task Commits

1. **Task 1: basementGuardian: re-validate every update, compute untrusted scopes, retain last-valid state** - `043a21c` (feat)
2. **Task 2: platform.ts and features: degrade-in-place is never an unregister trigger** - `00662b7` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `src/accessories/basementGuardian.ts` - re-resolves and re-validates on every `update()`; computes `untrusted`; log-once degrade/recover state.
- `test/accessories/basementGuardian.test.ts` - 12 new behavioral cases covering every degrade/recover/log-once/AccessoryInformation-unchanged case; 100% function/line/branch coverage.
- `src/platform.ts` - `basementGuardianAccessories` map, `basementGuardianAccessoryFor` get-or-create helper, wired into `registerDiscoveredDevices`, `updateDiscoveredDevice`, and `removeDiscoveredDevice`.
- `test/platform.test.ts` - updated every `DiscoveryContext` literal for the new required field; added a dedicated test proving the same instance is reused across two `registerDiscoveredDevices` calls so the log-once state persists; 100% coverage restored.
- `features/discovery.feature` - new degrade-in-place scenario.
- `features/support/steps/harness.ts` - `waterLevel` table column, `the plugin explains the degradation once` step.
- `features/support/world.ts` - wired the new `basementGuardianAccessories` map through both discovery hooks the Cucumber harness's own `launch()` builds.

## Decisions Made

See `key-decisions` in the frontmatter above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `platform.ts` created a fresh `BasementGuardianAccessory` on every poll, discarding the DEV-08 closure state Task 1 introduced**

- **Found during:** Task 2, while writing the discovery-feature scenario's log-once assertion.
- **Issue:** `updateDiscoveredDevice` and `registerDiscoveredDevices`'s new-device branch both called `createBasementGuardianAccessory({...})` fresh on every invocation. Task 1's `update()` correctly holds `lastTrustedAt` and a `degraded` log-once flag in that factory's closure — but since `platform.ts` built a brand-new instance every poll, that state reset to its initial values on every single call in the running plugin. The isolated `basementGuardian.test.ts` unit tests never caught this because they construct one instance and call `.update()` on it repeatedly, which is exactly the shape the live platform did not have. Without this fix, the Cucumber scenario's repeated-poll log-once assertion would have logged the degradation warning on every poll instead of once, and `lastTrustedAt` would always read `undefined` instead of the true last-valid receipt time.
- **Fix:** Added `basementGuardianAccessories: Map<string, BasementGuardianAccessory>` to `DiscoveryContext`, and a `basementGuardianAccessoryFor(context, uuid, accessory)` get-or-create helper that both `updateDiscoveredDevice` and `registerDiscoveredDevices` now call instead of constructing directly. `removeDiscoveredDevice` deletes the cached instance alongside the HAP accessory on confirmed removal.
- **Files modified:** `src/platform.ts` (declared), `test/platform.test.ts` (undeclared — every existing `DiscoveryContext` object literal needed the new required field), `features/support/world.ts` (undeclared — the Cucumber harness's own `launch()` builds a `DiscoveryContext` the same way `platform.ts` does).
- **Verification:** Added `test/platform.test.ts#reuses the same BasementGuardianAccessory across polls so the DEV-08 log-once state persists`, which calls `registerDiscoveredDevices` twice with the same context and asserts the degradation-warning message appears exactly once. `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` reaches 100% function/line/branch coverage. `npm run test:cucumber` run three consecutive times, all green (44/44 scenarios). `npm test` run three consecutive times, all green.
- **Committed in:** `00662b7` (Task 2 commit).

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking).
**Impact on plan:** Necessary for the plan's own explicitly-required log-once and last-valid-value must_haves to hold true in the running plugin, not merely in an isolated unit test that happens to reuse one instance across calls. No scope creep beyond what completing Task 2's own stated dispatch-loop verification required.

## Issues Encountered

- **`npm run check` was run in full once, and both `npm test` and `npm run test:cucumber` were each run three consecutive times independently**, per this phase's own recorded hazard ("a single green run is not a green gate"). All runs were green (588/588 unit tests, 44/44 Cucumber scenarios).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `DEV-08` is fully implemented and verified: degrade-in-place is a complete, reusable mechanism (computed trust scopes, retained last-valid values, log-once semantics, never-unregistered) that Phase 3's fault adapters and per-service `StatusActive`/`StatusFault` characteristics can build on directly.
- All eight Phase 2 requirements (`DEV-01` through `DEV-08`) are now implemented and verified. This is the final plan in Phase 2.
- The recorded Phase 3 concern from `02-CONTEXT.md` stands unchanged: Apple Home does not render `StatusActive = false` prominently for every service type, so a degraded accessory may look ordinary in the UI today. Phase 3 owns deciding how visibility is achieved within `SAFE-04`'s constraint against an aggregate System Fault adapter.
- No blockers.

## Self-Check: PASSED

- FOUND: src/accessories/basementGuardian.ts
- FOUND: test/accessories/basementGuardian.test.ts
- FOUND: src/platform.ts
- FOUND: test/platform.test.ts
- FOUND: features/discovery.feature
- FOUND: features/support/steps/harness.ts
- FOUND: features/support/world.ts
- FOUND: commit 043a21c
- FOUND: commit 00662b7

---

*Phase: 02-safe-gemini-discovery-and-identity*
*Completed: 2026-08-29*
