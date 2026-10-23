---
phase: 08-final-sweep-and-gate
plan: "18"
subsystem: cucumber-features
tags: [cucumber, cache-assertion, world, correction-round]
requires:
  - phase: 08-final-sweep-and-gate
    provides: independently closed DEVICE round 2
provides:
  - cache absence assertion that propagates nonmissing filesystem errors
  - anonymous typed World callbacks in five step modules
  - independently reviewed FEATURES continuation round 1 with zero forward-open IDs
affects: [08-15, GATE-01, GATE-02, BUG-01]
tech-stack:
  added: []
  patterns: [anonymous function expressions for World-bound Cucumber steps]
key-files:
  modified:
    - features/step_definitions/account.steps.ts
    - features/step_definitions/configuration.steps.ts
    - features/step_definitions/controls.steps.ts
    - features/step_definitions/homekit.steps.ts
    - features/step_definitions/shadow.steps.ts
    - .planning/phases/08-final-sweep-and-gate/08-FEATURES-002-NEGATIVE-CONTROL.json
    - .planning/phases/08-final-sweep-and-gate/08-STOP-CONTINUATION.json
    - .planning/phases/08-final-sweep-and-gate/08-STOP-CONTINUATION.md
    - .planning/phases/08-final-sweep-and-gate/08-FINDINGS.md
    - .planning/phases/08-final-sweep-and-gate/08-BUG-LEDGER.md
key-decisions:
  - "Treat only ENOENT as cache absence in the Cucumber assertion."
  - "Inline all World-bound registration callbacks without changing their AST behavior."
  - "Keep the historical no-progress STOP separate from completed forward correction rounds."
requirements-completed: []
status: complete
---

# Phase 8 Plan 18: FEATURES Corrections

**FEATURES-001 and FEATURES-002 are fixed and independently reviewed. The separate continuation has zero current open findings.**

## Two cause commits and checks

Commit `7735869` makes the cache-absence step report absence only for `ENOENT`. The [deterministic negative control](08-FEATURES-002-NEGATIVE-CONTROL.json) makes the storage path's parent a regular file. At the prior source revision the cache-absence `Then` falsely passed on `ENOTDIR`, so the wrapper's intended assertion exited 1; after correction the step propagated `ENOTDIR` and the wrapper exited 0. The named refused-credential scenario passed 1/1 with 12/12 steps, and the default offline profile passed 130/130 scenarios and 1401/1401 steps. This is a test assertion repair, not a production behavior RED.

Commit `dd87848` changes the five step modules to inline anonymous function expressions with typed World `this`. A TypeScript AST comparison of all 88 registrations proved that step text, options, parameter types, async flags, callback bodies, and order match the committed predecessor. Pinned Cucumber 13.2.1 and the applicable official step-definition documentation both use regular functions for World `this`; no difference was found. The default offline profile passed again, the usage dry run exited 0 with no UNUSED definition, and normal hooks and Fallow audit passed.

The final `TEST_CONCURRENCY=1 npm run check` exited 0 at clean revision `dd878480671f4e8caaf69d0c59b908db9c3fc146` on Node `v26.12.1`: 130/130 scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs.

## Independent correction round

Reviewer `/root/phase8_features_round1_review`, who edited none of the five files, read every complete current step module. The [continuation record](08-STOP-CONTINUATION.md#features-continuation-correction-round-1) gives exact blobs and contiguous spans. The reviewer confirmed both IDs fixed, default/real profile isolation, and no new or reopened cause.

FEATURES round 1 opened with two IDs, fixed both, and closed empty: **2 − 2 = 0 closing**. No continuation STOP fired. The historical DEVICE round-one STOP and seven-ID snapshot remain unchanged. Plan 08-15 now has a zero-open handoff for its final manifest seal.

## Threat Flags

The old cache-absence assertion could report success on a filesystem access error. The repaired assertion has an active negative control and independent current-file review. No security-relevant surface outside the plan's `<threat_model>` was introduced.
