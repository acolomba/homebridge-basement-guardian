---
phase: 07-cucumber-feature-conformance
plan: "03"
subsystem: testing
tags: [cucumber, accessory, homebridge, review]
requires:
  - phase: 07-01
    provides: Phase 7 review baseline and owner protocol
provides:
  - Complete-file ACCESSORY review with two independent correction rounds
  - Focused accessory identity, service, trust, fixture, and style repairs
  - Exact STOP record with three unresolved findings
affects: [cucumber-feature-conformance, FEAT-01, FEAT-02]
actuals:
  tokens: 13379
  tasks: 3
  commits: 23
plan_head_before: 17d79f3eaa8e32efafb23dc5af44a405844d3177
plan_head_after: ab98e337ec8143b65df1aced67dcbc1d8b158fec
tech-stack:
  added: []
  patterns: [complete-file independent review, one-cause repair commits, temporary negative controls]
key-files:
  created:
    - .planning/phases/07-cucumber-feature-conformance/07-ACCESSORY-REVIEW.md
    - .planning/phases/07-cucumber-feature-conformance/07-03-SUMMARY.md
  modified:
    - features/accessory/discovery.feature
    - features/step_definitions/accessory.steps.ts
    - features/lib/homebridgeApi.ts
    - features/lib/publishedServices.ts
key-decisions:
  - Stop after Round 2 because the positive open count stayed at three and finding 009 reopened.
  - Keep the device-table parser location open for exact-path plan reconciliation; validation behavior is repaired.
requirements-completed: []
coverage:
  - id: D1
    description: Independent complete-file review and bounded ACCESSORY finding ledger
    verification:
      - kind: other
        ref: .planning/phases/07-cucumber-feature-conformance/07-ACCESSORY-REVIEW.md#Round-2-STOP
        status: pass
    human_judgment: true
    rationale: Three accepted findings remain open at the required STOP.
  - id: D2
    description: Offline accessory scenario and stand-in repairs
    requirement: FEAT-01
    verification:
      - kind: integration
        ref: npm run test:cucumber
        status: pass
    human_judgment: true
    rationale: Passing scenarios do not prove the reopened independent service-identity oracle.
duration: 38min
completed: 2026-10-20
status: complete
---

# Phase 7 Plan 03: ACCESSORY complete-file review summary

Four ACCESSORY files received full independent review and focused repairs. Round 2 ended at the required STOP with three open findings.

## Results

- The reviewer read all four owned files from line 1 to the final line at the recorded commit and blob in each round. [07-ACCESSORY-REVIEW.md](./07-ACCESSORY-REVIEW.md) has the spans, stable IDs, and checks.
- The bounded open counts were **16 → 3 → 3**. Round 2 fixed 017 and 018, found 019, and reopened 009. The positive count did not fall, and a fixed ID reopened. No Round 3 source repair was dispatched.
- **CR-07-ACCESSORY-007 (WARNING, open):** strict device-table validation now runs, but its typed parser remains in the step module. The Cucumber rule places it under `features/lib/`; that needs an exact-path plan revision.
- **CR-07-ACCESSORY-009 (BLOCKER, reopened):** expected service names, UUIDs, and subtypes come from the production catalogue that also drives publication. A wrong catalogue identity can change both sides and pass the assertion.
- **CR-07-ACCESSORY-019 (WARNING, open):** three “accessory remembers” steps name private context fields rather than a user-visible HomeKit result.
- No production source changed. These findings concern behavioral evidence and wording; no production behavior bug or active production RED/GREEN pair was claimed.

## Verification

- At the final source revision `a39a4e6`, `npm run test:cucumber` passed **104/104 scenarios and 1,160/1,160 steps** on Node v26.12.0. The scenario count stayed at 104. The report explains the step changes from 1,162 at Round 0 to 1,170 after Round 1 repairs, then to 1,160 when ten redundant Background steps were removed.
- After compilation, `./node_modules/.bin/cucumber-js --dry-run --format usage` exited 0 with no unused, undefined, or ambiguous step bindings. Temporary wrong-result controls failed at their intended assertions and were restored before commit.
- Fallow audit and normal hooks passed for repair and report commits. The first sandboxed Cucumber run failed because it could not bind a loopback listener; the authorized offline loopback run passed. No real profile step or vendor account ran.
- The coordinator will run the full combined-wave `npm run check`; this focused pass does not claim phase closure.

## Commits

Task 1: `849b120` recorded Round 0. Task 2: `410e16c`, `cc2e011`, `20c7c4e`, `a7216c8`, `feceda8`, `5dea415`, `f9dec7a`, `cc5791a`, `11b5e5f`, `62881fb`, `ee8fe1e`, `d8f7cac`, `b57f1d0`, `46c6adb`, `76d84c8`, `1317634`, `787406b`, `2e46aca`, `a39a4e6`, and `8c24e10` recorded the repairs and checks. Task 3: `c78d116` and `ab98e33` recorded independent rounds and STOP. The measured ledger count before this summary commit is **23**.

## Deviations from Plan

None. The plan requires a truthful STOP when the open count does not fall or a fixed ID reopens. The parser-location issue needs an exact-path plan revision, so no unlisted file was added.

## Known Stubs

None. `placeholder-*` values in the feature and steps are synthetic device IDs and a synthetic serial number for offline scenarios.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next Phase Readiness

The phase coordinator has exact open IDs 007, 009, and 019 for reconciliation. FEAT-01 and FEAT-02 are not claimed complete by this summary. The combined-wave full gate is pending coordinator execution.

## Self-Check: PASSED

All four owned source paths and the review report exist. The 23 plan commits are ancestors of HEAD, and the Round 2 report commit deleted no tracked file. The final source tree is clean before this summary.
