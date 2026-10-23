---
phase: 08-final-sweep-and-gate
plan: "17"
subsystem: device-trust
tags: [device, heartbeat, trust, correction-round]
requires:
  - phase: 08-final-sweep-and-gate
    provides: RUNTIME round 2 with DEVICE-002 still open
provides:
  - active RED and GREEN repair for accepted unchanged heartbeat trust time
  - independently reviewed DEVICE continuation round 2
  - two current forward-open FEATURES IDs
affects: [08-18, GATE-01, GATE-02, BUG-01]
tech-stack:
  added: []
  patterns: [accepted heartbeat notification with empty changed keys]
key-files:
  modified:
    - src/device/state.ts
    - test/device/state.test.ts
    - test/platform.test.ts
    - test/runtime/accountRuntime.test.ts
    - features/shadow/state-merging.feature
    - src/platform.ts
    - .planning/phases/08-final-sweep-and-gate/08-STOP-CONTINUATION.json
    - .planning/phases/08-final-sweep-and-gate/08-STOP-CONTINUATION.md
    - .planning/phases/08-final-sweep-and-gate/08-FINDINGS.md
    - .planning/phases/08-final-sweep-and-gate/08-BUG-LEDGER.md
key-decisions:
  - "Notify listeners of accepted telemetry heartbeats even when the values are unchanged; retain duplicate-version refusal."
  - "Correct obsolete notification expectations in one feature and one runtime unit test."
  - "Record changed ROOT and FEATURES consumer files in supplemental full-file review rows."
requirements-completed: []
status: complete
---

# Phase 8 Plan 17: Accepted Heartbeat Trust Time

**DEVICE-002 is fixed and independently reviewed. DEVICE continuation round 2 closed without a new or reopened finding.**

## Repair and checks

The [exact V2 RED record](08-DEVICE-002-RED-EVIDENCE-V2.json) passed `tdd-red-evidence --raw` and was committed alone at `897d318`; initial RED remains archived. At unchanged production revision `e3783df`, the named store case did not notify an accepted unchanged heartbeat, and the platform integration case retained T1=2000 rather than T2=3000 as the power scope's last trusted time after invalid power at T3. The GREEN commit `f118cc8` sends the accepted heartbeat to existing listeners without treating a duplicate version as accepted or appending a second pump activation.

The owner and adjacent suites passed 286/286, relevant Cucumber scenarios passed, static checks passed, and the changed DEVICE pair retained 100% isolated line/function/branch coverage. The new callback made two old test expectations incorrect: the shadow feature count/title was corrected at `459345e` and `87e08a3`, and the runtime owner test was corrected at `bf1c41c`. The `src/platform.ts` change at `87e08a3` only updates an obsolete comment; executable platform code was unchanged. These corrections extend the plan's file list because the new public notification reached existing consumer assertions.

The final `TEST_CONCURRENCY=1 npm run check` exited 0 at clean revision `87e08a355abb600786f8b6f22c8371cb63d9ffd1` on Node `v26.12.1`: 130/130 scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. The prior attempts on intermediate commits failed at obsolete assertions; the final committed inputs passed.

## Independent correction round

Reviewer `/root/phase8_device002_review`, who edited none of these files, read the complete current DEVICE source/test pair and changed platform integration test. The [continuation record](08-STOP-CONTINUATION.md#device-continuation-correction-round-2) gives exact blobs, spans, and separate editor identities. The reviewer also read the complete current runtime test, platform source, and shadow feature after the assertion and comment corrections; those full-blob reviews are recorded separately in the continuation JSON.

DEVICE round 2 opened with DEVICE-002, fixed it, and added or reopened nothing: **1 − 1 = 0 closing**. No continuation STOP fired. The current forward-open set contains FEATURES-001 and FEATURES-002. The historical DEVICE round-one STOP and its seven-ID snapshot remain unchanged.

## Threat Flags

An accepted unchanged heartbeat previously left HomeKit's trusted observation time stale. The repaired notification path has active RED and independent current-file review. The two FEATURES findings remain open for Plan 08-18.
