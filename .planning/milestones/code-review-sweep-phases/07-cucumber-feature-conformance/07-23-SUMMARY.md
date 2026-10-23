---
phase: 07-cucumber-feature-conformance
plan: "23"
subsystem: testing
tags: [cucumber, hap, isolation, post-stop-addendum]
requires:
  - phase: 07-09
    provides: historical HAP Round 3 STOP and open isolation finding
provides:
  - Bounded forward closure of the HAP isolation finding
  - One independent complete-file review and current full gate
affects: [07-14, FEAT-02]
key-files:
  created:
    - .planning/phases/07-cucumber-feature-conformance/07-HAP-ISOLATION-ADDENDUM.md
    - .planning/phases/07-cucumber-feature-conformance/07-23-SUMMARY.md
  modified:
    - features/step_definitions/hap.steps.ts
key-decisions:
  - Preserve the original HAP STOP and the four other forward-open IDs.
  - Map the reviewer's helper-name warning to existing ID 051.
requirements-completed: []
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 23: HAP isolation cleanup

The maintainer authorized one bounded repair and review for
`CR-07-HAP-028`. Commit `ed90a39` keeps the isolation test's array
references and restores their contents in place, even when its assertion
fails. The independent reviewer read the complete 628-line step module,
confirmed 028 fixed, and repeated the already-open 051 naming warning.
The original Round 3 STOP remains unchanged. The exact blob, review scope,
triage, and commands are in
[07-HAP-ISOLATION-ADDENDUM.md](07-HAP-ISOLATION-ADDENDUM.md).

## Verification

On Node `v26.12.1`, the focused isolation scenario passed 1/1 with 3/3
steps. Pre-commit checks, Fallow audit, and normal hooks passed. At clean
source commit `ed90a39`, `TEST_CONCURRENCY=1 npm run check` exited 0 with
130/130 offline scenarios, 1400/1400 steps, and all 43 direct coverage
pairs. Both dry runs passed; the real profile skipped six scenarios and 35
steps.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next phase readiness

Plan 07-14 can close 028 forward while retaining its historical STOP
origin. Four HAP IDs still need maintainer rulings, so FEAT-02 and Phase 7
remain pending.
