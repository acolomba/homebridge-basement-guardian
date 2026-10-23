---
phase: 07-cucumber-feature-conformance
plan: "13"
subsystem: testing
tags: [cucumber, real-pump, steps, complete-file-review]
requires:
  - phase: 07-11
    provides: Six reviewed real-profile scenarios
  - phase: 07-12
    provides: Reviewed real-profile World and hooks
provides:
  - Three isolated `.steps.ts` real-profile registration modules and a shared polling helper
  - Complete-file REAL_STEPS review with a truthful Round 2 no-progress STOP
affects: [07-14, FEAT-01, FEAT-02]
actuals:
  tasks: 3
key-files:
  created:
    - features/lib/realPumpPolling.ts
    - .planning/phases/07-cucumber-feature-conformance/07-REAL-STEPS-REVIEW.md
    - .planning/phases/07-cucumber-feature-conformance/07-13-SUMMARY.md
  moved:
    - features/real-pump/support/steps.ts to features/real-pump/step_definitions/discovery.steps.ts
    - features/real-pump/support/heartbeatSteps.ts to features/real-pump/step_definitions/heartbeats.steps.ts
    - features/real-pump/support/lifecycleSteps.ts to features/real-pump/step_definitions/lifecycle.steps.ts
  modified:
    - features/real-pump/discovery.feature
    - features/real-pump/heartbeats.feature
    - features/real-pump/lifecycle.feature
key-decisions:
  - Keep the real-profile step modules under its isolated import glob.
  - Preserve the Round 2 no-progress STOP with CR-07-REAL_STEPS-017 open.
requirements-completed: []
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 13: Real-profile step review summary

Three real step modules moved from `support/` to isolated `.steps.ts` modules
under `real-pump/step_definitions/`. Their shared `until` poller now lives in
`features/lib/realPumpPolling.ts` and registers no steps. “Harness starts” now
lives beside restart and stop. The discovery wording says “at least one
device,” which permits an account with several systems. All three modules
have the approved header. Bounded waits have explicit Cucumber ceilings,
and assertion failures no longer print device IDs, token-cache fingerprints,
or warning text.

The independent complete-file review accepted fifteen Round 0 causes. Round
1 confirmed those repairs and found one startup timeout cause, which was
repaired. Round 2 confirmed that repair but found a separate incomplete
`lifecycle.steps.ts` overview. Its equation was `1 - 1 - 0 + 1 + 0 = 1`, so
the protocol required **STOP with CR-07-REAL_STEPS-017 open**. No Round 3
source repair or review ran. The historical STOP, exact blobs, stable IDs,
rejected hypotheses, and normal-hook commits are in
[07-REAL-STEPS-REVIEW.md](07-REAL-STEPS-REVIEW.md). No production plugin
module changed.

## Verification

At clean executable-input commit `f04d330` on Node `v26.12.1`, the full
`TEST_CONCURRENCY=1 npm run check` exited 0: static checks, build, unpaired
tests, 130/130 offline Cucumber scenarios, 1400/1400 steps, and 43 isolated
direct coverage pairs passed. Subsequent commits changed only planning
records. The real profile ran only with `--dry-run`; it resolved six skipped
scenarios and 35 skipped steps with no undefined or ambiguous binding. The
default usage dry run exited 0 with no `UNUSED` definitions. No vendor-backed
step body ran. These checks do not prove live real-pump timing.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next phase readiness

Plan 07-14 must carry the Round 2 STOP and forward-open ID 017 into the
central ledger. A separate, explicitly adjudicated addendum can correct the
overview while preserving the historical STOP. FEAT-01 and FEAT-02 remain
pending until all Phase 7 findings and the final phase gate are reconciled.
