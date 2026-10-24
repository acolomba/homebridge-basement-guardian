---
phase: quick-260904-mkz
plan: 01
subsystem: runtime
tags: [homebridge, shadow, mqtt, monitoring-health, arrival-anchor]

requires:
  - phase: 05.1
    provides: per-device MonitoringHealth, ArrivalAnchors persistence, the confirmed-removal pruning branch this fix complements
provides:
  - A guard on the shadow arrival callback that drops a stray message for an already-removed deviceId before it can re-arm the in-memory arrival stamp or the persisted anchor
affects: [runtime, monitoring-health]

actuals:
  tokens: 1846
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Store-membership guard (options.store.deviceIds().includes(deviceId)) reused verbatim from the confirmed-removal branch and the shadow-disconnect handler as the check for whether a deviceId is still live."

key-files:
  created: []
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - .planning/WINDOWS.md

key-decisions:
  - "Anchored the new guard's comment to D-14, the decision the removal branch's own pruning comment (accountRuntime.ts:447) already cites for dropping this same state, rather than inventing a new ID."
  - "Closed WINDOWS.md entry 43 with the tool's fixed verb alone, no hand-added reason -- every fixed row in the ledger carries an empty reason, and markFixed accepts none."

patterns-established: []

requirements-completed: [RES-01]

coverage:
  - id: D1
    description: "A stray shadow message for a deviceId the account has already confirmed removed no longer re-arms that device's arrival stamp, in memory or in the persisted ArrivalAnchors store."
    requirement: "RES-01"
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#DEV-05 removal reconciliation > does not re-arm the arrival anchor when a stray message arrives after a pump is removed"
        status: pass
    human_judgment: false
  - id: D2
    description: "A message for a deviceId the store still holds continues to record its arrival exactly as before; no shipped case in the file regresses."
    verification:
      - kind: unit
        ref: "npm run test:unit -- 1424/1424 pass, 0 fail"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-09-04
status: complete
---

# Quick Task 260904-mkz: Guard the Shadow Arrival Callback Against a Removed Pump's Stray Message Summary

**Guarded `health.recordShadowMessage(deviceId)` in `attemptShadow()`'s `onReportedPatch` callback with a store-membership check, closing WINDOWS.md ledger entry 43.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-09-04T20:28:00Z (approx.)
- **Completed:** 2026-09-04T21:02:01Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Pinned the defect with a failing unit case against the persisted `RecordingAnchors` double: a stray `onReportedPatch` for an already-removed `deviceId` used to re-persist the arrival anchor the removal branch had just dropped.
- Closed the gap at its real site — the arrival callback, not the removal branch — with a one-line `if (options.store.deviceIds().includes(deviceId))` guard around the single statement that was unconditional, leaving `applyReportedPatch` and the recovery-latch check untouched because both were already safe for a removed `deviceId`.
- Closed WINDOWS.md ledger entry 43 as `fixed`.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): pin the anchor non-re-arm** — `68714fb` (test)
2. **Task 1 (GREEN): guard the arrival callback** — `b0f37fa` (feat)
3. **Task 2: close WINDOWS.md ledger entry 43** — `4c9f74c` (chore)

_No refactor commit — the fix is a single guarded statement plus a comment; nothing needed cleanup after GREEN._

## Files Created/Modified

- `test/runtime/accountRuntime.test.ts` — new case `'does not re-arm the arrival anchor when a stray message arrives after a pump is removed'` in `describe('DEV-05 removal reconciliation', ...)`, modeled on the sibling `'reports nothing for a message from a pump the account has already removed'` case.
- `src/runtime/accountRuntime.ts` — wrapped `health.recordShadowMessage(deviceId);` in a store-membership guard inside `attemptShadow()`'s `onReportedPatch` callback, with a comment anchored to D-14.
- `.planning/WINDOWS.md` — entry 43 marked `fixed` via `gsd-tools.cjs windows fixed 43`.

## Decisions Made

- **D-14 citation for the new comment.** The removal branch's own pruning comment (`accountRuntime.ts:447`, "this system's reporting did not come back ... (D-14)") is the decision already governing exactly this state — the arrival stamp, the persisted anchor, and the failure-log kind dropped for a device the account has confirmed gone. The new guard's comment cites the same ID rather than inventing one, per the plan's instruction to check what the surrounding comments already cite.
- **WINDOWS.md closed with no hand-added `reason`.** `markFixed` (`.claude/gsd-core/bin/lib/broken-windows.cjs:275-283`) sets only `status` and `resolved_at` and takes no `reason` parameter; every one of the ledger's 15 (now 16) `fixed` rows carries an empty `reason`. This entry follows that shape rather than hand-editing the fenced JSON block, matching the `260903-q06` precedent that closed entry 34 the same way.

## Deviations from Plan

None — plan executed exactly as written. The action steps, verification commands, and acceptance criteria all matched what the investigation findings predicted; no unplanned fix, blocker, or architectural question came up.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Verification

All four verification baselines named in the plan reproduced:

- Focused suite: `node --test dist-test/test/runtime/accountRuntime.test.js` — RED: 124 tests, 123 pass, 1 fail (the new case, as predicted). GREEN: 124 tests, 124 pass, 0 fail.
- Direct coverage: `dist-test/src/runtime/accountRuntime.js` at 100.00 / 100.00 / 100.00 (line / branch / function).
- Whole unit tree: `npm run test:unit` — 1424 tests, 1424 pass, 0 fail.
- Full suite: `npm test` — unit 1424/1424/0 fail; Cucumber 104 scenarios (104 passed), 1156 steps (1156 passed).
- `npm run typecheck`, `npm run lint`, `npm run fallow`, `npm run format:check` all exit 0. (`fallow` reports one pre-existing, unrelated duplicate-code finding in `features/support/steps/hap.ts`, outside this task's files and out of scope per the deviation rules' scope boundary.)
- `node .claude/gsd-core/bin/gsd-tools.cjs windows status --raw` confirms entry 43 `fixed` with a populated `resolved_at` and empty `reason`, `open_count: 9`, `fixed_count: 16`, `total_count: 43`.

## Next Phase Readiness

- No blockers. WINDOWS.md now carries 9 open entries; the remaining growth-surface item this task closed was the last one this plan's own `05.1-03-SUMMARY.md` had explicitly deferred.

---
*Phase: quick-260904-mkz*
*Completed: 2026-09-04*
