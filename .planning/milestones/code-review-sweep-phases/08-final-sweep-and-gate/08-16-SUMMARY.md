---
phase: 08-final-sweep-and-gate
plan: "16"
subsystem: runtime-review
tags: [runtime, safety, correction-round, active-red]
requires:
  - phase: 08-final-sweep-and-gate
    provides: separately authorized seven-ID STOP continuation
provides:
  - four runtime causes repaired with exact active RED and atomic GREEN commits
  - independent complete-file RUNTIME continuation round 1
  - one new forward-open RUNTIME-006 cause for a focused round 2
affects: [GATE-01, GATE-02, BUG-01, 08-final-sweep-and-gate]
tech-stack:
  added: []
  patterns: [store-accepted telemetry liveness, serialized durable snapshots, monotonic reminder clock]
key-files:
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - src/runtime/arrivalAnchors.ts
    - test/runtime/arrivalAnchors.test.ts
    - src/runtime/failureLog.ts
    - test/runtime/failureLog.test.ts
    - .planning/phases/08-final-sweep-and-gate/08-STOP-CONTINUATION.json
    - .planning/phases/08-final-sweep-and-gate/08-STOP-CONTINUATION.md
    - .planning/phases/08-final-sweep-and-gate/08-FINDINGS.md
    - .planning/phases/08-final-sweep-and-gate/08-BUG-LEDGER.md
key-decisions:
  - "Preserve the original DEVICE no-progress STOP and record runtime correction rounds only in the authorized continuation."
  - "Treat post-silence shadow replay as a new source-release/version-fence cause, distinct from RUNTIME-005."
requirements-completed: []
status: complete
---

# Phase 8 Plan 16: Runtime Correction Summary

Four runtime behavior bugs were repaired. Independent review closed all four opening IDs and found one new safety blocker, RUNTIME-006. Phase 8 remains open.

## Repair and evidence

| ID | Exact RED evidence commit | GREEN commit | Result |
| --- | --- | --- | --- |
| RUNTIME-005 | `c870a08` ([V2](08-RUNTIME-005-RED-EVIDENCE-V2.json)) | `fb369ea` | Rejected duplicate and older telemetry no longer renew liveness. |
| RUNTIME-002 | `7bba9a0` ([V2](08-RUNTIME-002-RED-EVIDENCE-V2.json)) | `29bc2c0` | Persist requests finish in call order; a later anchor survives restart. |
| RUNTIME-001 | `6392324` ([V2](08-RUNTIME-001-RED-EVIDENCE-V2.json)) | `8ab71cf` | Late credential success after halt or shutdown does not log recovery. |
| RUNTIME-003 | `8072051` ([V2](08-RUNTIME-003-RED-EVIDENCE-V2.json)) | `6ba036f` | Reminders follow elapsed time after a backward wall-clock correction. |

Each final test patch produced one intended assertion failure against its unchanged source, and each V2 record passed `tdd-red-evidence --raw`. Earlier RED records remain archived. Named and owner tests, adjacent checks, static checks, normal commit hooks, and isolated 100% line/function/branch direct coverage passed for the changed source pairs.

## Combined gate and independent review

`TEST_CONCURRENCY=1 npm run check` exited 0 at clean revision `6ba036f92b526887ac04ba80256de5d7e2ed210b` on Node `v26.12.1`: 130/130 Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. The gate covers the four fixes but not later work.

Reviewer `/root/phase8_runtime_continuation_review` read all six current runtime source/test files completely at that revision. [The continuation record](08-STOP-CONTINUATION.md#runtime-continuation-correction-round-1) gives exact blobs, line spans, bounded callers, and the complete finding rationale. RUNTIME round 1 opened with 001, 002, 003, and 005; fixed all four; added 006; reopened none; and closed with 006. Its open count fell from four to one, so the continuation STOP rule did not fire.

## Forward work

RUNTIME-006 is a distinct post-silence replay cause. Releasing shadow ownership clears the version fence while the socket remains open; a duplicate older normal reading can replace a newer REST flood reading. A read-only store reproduction confirmed that transition. It needs an active end-to-end RED, a focused repair, the combined gate, and an independent complete-file round-2 review before DEVICE work. The current whole-phase forward-open IDs are DEVICE-002, RUNTIME-006, FEATURES-001, and FEATURES-002. Plan 08-14 remains halted with its original STOP unchanged.

## Threat Flags

RUNTIME-006 can replace a newer REST flood observation with an older normal shadow value after silence release. Its safety-trust effect remains open for a focused correction round.
