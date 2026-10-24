---
phase: 08-final-sweep-and-gate
plan: "19"
subsystem: shadow-safety
tags: [runtime, device-state, safety, correction-round]
requires:
  - phase: 08-final-sweep-and-gate
    provides: RUNTIME round 1 and open CR-08-RUNTIME-006
provides:
  - active RED and GREEN repair for post-silence shadow replay
  - independent complete-current-file RUNTIME continuation round 2
  - three current forward-open IDs after runtime closure
affects: [08-17, GATE-01, GATE-02, BUG-01]
tech-stack:
  added: []
  patterns: [per-device shadow version fence, distinct silence and disconnect release]
key-files:
  modified:
    - src/device/state.ts
    - test/device/state.test.ts
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - .planning/phases/08-final-sweep-and-gate/08-STOP-CONTINUATION.json
    - .planning/phases/08-final-sweep-and-gate/08-STOP-CONTINUATION.md
    - .planning/phases/08-final-sweep-and-gate/08-FINDINGS.md
    - .planning/phases/08-final-sweep-and-gate/08-BUG-LEDGER.md
key-decisions:
  - "Keep shadow version ordering across silence but reset it on actual disconnect or device removal."
  - "Treat DEVICE file reads in this RUNTIME review as cross-owner context; Plan 08-17 still performs DEVICE owner review."
requirements-completed: []
status: complete
---

# Phase 8 Plan 19: Post-Silence Replay Summary

**The post-silence replay safety defect is fixed and independently reviewed. RUNTIME round 2 closed with no new or reopened finding.**

## Repair and checks

Two named runtime cases failed on unchanged production at `53afb50`: replayed version 7 and unversioned telemetry each replaced a newer REST flood level 31 with normal level 2 and renewed shadow liveness. The final active test patch and both native failures are in [V2 RED evidence](08-RUNTIME-006-RED-EVIDENCE-V2.json), committed alone at `80e290d` with `RED_EVIDENCE_OK`. The earlier RED record remains at `cf4d940`.

The GREEN commit `31a07f4` retains a per-device version fence through silence while allowing REST telemetry to own the device. Duplicate, older, and unversioned replay cannot renew liveness; a strictly newer version can restore shadow ownership. An actual disconnect or device removal clears the fence for a new epoch. Named runtime tests, 333 owner and adjacent cases, static checks, normal hooks, and isolated 100% line/function/branch coverage for both changed source pairs passed.

`TEST_CONCURRENCY=1 npm run check` exited 0 at clean revision `31a07f4d40a8f87716bb792f6f5c56a668b3ebc5` on Node `v26.12.1`: 130/130 scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs.

## Independent correction round

Reviewer `/root/phase8_runtime006_review`, who edited none of the files, read the complete current runtime source/test pair and complete device state source/test pair. The [continuation record](08-STOP-CONTINUATION.md#runtime-continuation-correction-round-2) gives exact blobs and contiguous spans. The RUNTIME pair received owner review; the DEVICE pair was cross-owner safety context and still needs its final owner review in Plan 08-17.

RUNTIME round 2 opened with RUNTIME-006, fixed it, and added or reopened nothing: **1 − 1 = 0 closing**. The continuation STOP predicate did not fire. The current forward-open IDs are DEVICE-002, FEATURES-001, and FEATURES-002. The original DEVICE round-one STOP and its seven-ID snapshot remain untouched.

## Threat Flags

RUNTIME-006 previously allowed an old shadow normal value to replace a newer REST flood observation. The repair blocks that transition; DEVICE-002 and FEATURES-002 remain open for their planned reviews.
