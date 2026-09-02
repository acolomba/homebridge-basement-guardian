---
phase: quick-260902-jou
plan: 01
subsystem: platform
tags: [homebridge, registration, persistence, pump-records]
requirements: [DEV-01, CTRL-01]
dependency-graph:
  requires: []
  provides:
    - "Persist port guarded by platform-map identity: no updatePlatformAccessories before registration"
  affects:
    - src/platform.ts
    - test/platform.test.ts
tech-stack:
  added: []
  patterns:
    - "Persist port refuses until context.accessories owns the accessory (identity check)"
key-files:
  created: []
  modified:
    - src/platform.ts
    - test/platform.test.ts
key-decisions:
  - "The persist port checks map identity (get(UUID) === accessory), not truthiness, so a stale instance for the same UUID cannot open the guard"
  - "Three lifecycle cases that asserted the pre-registration persist as promised behavior were corrected in the RED commit, keeping the fix commit test-free"
metrics:
  duration: ~20 minutes
  completed: 2026-09-02
status: complete
actuals:
  tokens: 3000
  tasks: 2
  commits: 2
---

# Quick Task 260902-jou: Fix Accessory Registration Voided by a Pre-Registration Persist Summary

Persist port now refuses updatePlatformAccessories until the platform map owns the accessory, so a fresh install's first-poll pump-record seed no longer poisons Homebridge's cache and voids registration.

## What was done

**Task 1 (RED, `fc28494`):** Pinned the registration-safe persist contract in `test/platform.test.ts`:

- New case in `registerDiscoveredDevices`: a brand-new device is registered exactly once and `updateCalls` stays empty — the record seeded during the pre-registration update never reaches `updatePlatformAccessories`.
- The counted-activation case's expectation changed from `seeds: 2` to `seeds: 0` — the two counted first-poll calls were the pre-registration seed persists, i.e. the bug itself. Its `sinceTheSeeds: [[SECOND_ACCESSORY_UUID]]` half stays, proving a post-registration persist still calls the API.
- Watched RED: exactly 5 cases failed (the new case on the premature update call carrying the seeded record; the counted-activation case on `seeds`; plus the three lifecycle cases below), 50 stayed green.

**Task 2 (GREEN, `67a3ee5`):** Guarded the persist closure in `createBasementGuardianAccessoryFor` (`src/platform.ts`): it returns without calling `context.api.updatePlatformAccessories` unless `context.accessories.get(accessory.UUID) === accessory`. The comment above it now states the real constraint — an update call for a never-registered accessory merges it into Homebridge's cached-accessory list with no associated plugin, the cache save throws, and registration is skipped as a UUID duplicate — replacing the false idempotency claim that hid the defect. Registration's own cache save carries the pre-registration context mutations to disk, so nothing is lost by refusing. `dispatchDiscoveredDevice` and its update-before-register throw-safety ordering are byte-identical.

## Verification

- Focused pair green: 55/55 cases in `dist-test/test/platform.test.js`.
- Direct pair coverage: 100% line / branch / function on `dist-test/src/platform.js`.
- `npm run check` green: 1349 unit tests, 96 Cucumber scenarios, all hooks.
- `git diff HEAD~2 -- src/platform.ts` shows one hunk, entirely inside `createBasementGuardianAccessoryFor` (lines 129-153); `dispatchDiscoveredDevice` untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected three lifecycle cases that asserted the pre-registration persist as promised behavior**

- **Found during:** Task 1 (pre-edit blast-radius check of `updatePlatformAccessories` expectations)
- **Issue:** The plan's context enumerated the affected cases but missed three strong-mock lifecycle cases in the `BasementGuardianPlatform` describe — 'registers a newly discovered device once the launch event succeeds', 'withdraws the offline verdict...', and 'unregisters a confirmed-absent accessory...'. Each carried a `when(() => api.updatePlatformAccessories(...))` expectation (one also asserted `persisted: [ACCESSORY_UUID]`) satisfied only by the pre-registration seed persist — the defect itself. With the fix, those expectations go unmet and `verify(api)` fails.
- **Fix:** Removed the three expectations (and the first case's `persisted` recording/assertion) in the RED commit, with comments stating the seed mutates only the context and the strict mock fails by name if the seed asks Homebridge to update anyway. This keeps the fix commit touching only `src/platform.ts`, as the plan's Task 2 done criterion requires. Consequence: the RED run failed on 5 cases rather than the plan's predicted 2.
- **Files modified:** test/platform.test.ts
- **Commit:** fc28494

### Process note

The RED run initially hung when driven without `--test-force-exit`: the failing lifecycle case at 'registers a newly discovered device once the launch event succeeds' never reaches its shutdown call when it fails, leaving a real ~15-minute poll timer holding the process open. The RED evidence was gathered with `node --test --test-force-exit`; the GREEN runs need no flag.

## TDD Gate Compliance

- RED gate: `fc28494` `test(platform): expect no accessory update before registration` — watched to fail on the defect.
- GREEN gate: `67a3ee5` `fix(platform): skip persist for a never-registered accessory`.
- No refactor commit needed.

## Known Stubs

None.

## Threat Flags

None — the change gates an internal call into the Homebridge API; no new surface. T-quick-260902-01 (DoS on the cached-accessory list) is mitigated by this fix.

## Self-Check: PASSED

- FOUND: src/platform.ts
- FOUND: test/platform.test.ts
- FOUND: commit fc28494 (RED)
- FOUND: commit 67a3ee5 (GREEN)

## Human follow-up (from plan output note)

Re-run the fresh-storage dev Homebridge container check that diagnosed this: the accessory must publish and survive a restart. CHANGELOG entry and version bump happen at PR time per CLAUDE.md.
