---
phase: 07-cucumber-feature-conformance
plan: "11"
subsystem: testing
tags: [cucumber, real-pump, complete-file-review]
requires:
  - phase: 07-10
    provides: Completed offline HARNESS review
provides:
  - Complete-file REAL_FEATURES review with zero open findings after Round 2
  - Six bound, read-only real-profile scenarios with explicit observation limits
affects: [07-12, 07-13, 07-14, FEAT-01, FEAT-02]
actuals:
  tasks: 3
key-files:
  created:
    - .planning/phases/07-cucumber-feature-conformance/07-REAL-FEATURES-REVIEW.md
    - .planning/phases/07-cucumber-feature-conformance/07-11-SUMMARY.md
  modified:
    - features/real-pump/discovery.feature
    - features/real-pump/heartbeats.feature
    - features/real-pump/lifecycle.feature
    - features/real-pump/support/steps.ts
    - features/real-pump/support/heartbeatSteps.ts
    - features/real-pump/support/lifecycleSteps.ts
    - features/real-pump/support/realWorld.ts
key-decisions:
  - Remove the optional natural-update scenario because it had no independent event signal and could pass when an update was missed.
  - Keep real-device observations diagnostic and read-only, with explicit time bounds.
requirements-completed: []
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 11: Real-profile feature review summary

The three real-profile feature files have a complete independent review with
**zero open findings** after two correction rounds. Round 0 accepted ten causes
and rejected two with recorded reasons. Round 1 found one new wording gap;
Round 2 reviewed the full current files and found no new or reopened cause.
The complete spans, blobs, dispositions, focused checks, and normal-hook
commits are in [07-REAL-FEATURES-REVIEW.md](07-REAL-FEATURES-REVIEW.md).

The optional natural-update scenario was removed because its condition used
the store change it aimed to verify as its own signal. Its unused bindings and
World recorder were removed. The heartbeat scenario now waits for initial
shadow state and names both connection failures and unhandled rejections.
The restart claim is limited to unchanged cached-token content, and the
shutdown scenario states a five-second stop bound and one-second rejection
observation. Titles, descriptions, and step wording follow the project rules.

## Verification

On Node `v26.12.1`, `npm run build:test` exited 0. The real-profile command
`./node_modules/.bin/cucumber-js --profile real --dry-run --format summary`
exited 0 with six skipped scenarios, 35 skipped steps, and no undefined or
ambiguous status. The default-profile usage dry run exited 0 and listed no
`UNUSED` definitions. No real-profile step body ran. Every source repair
passed the normal commit hooks. The combined full gate is due after the rest
of wave 10, including Plan 07-12, so this summary does not claim that gate.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next phase readiness

Plan 07-12 can review the current World file, including the removed change
recorder. Plan 07-13 can move and review the current step bindings. The
central ledger must explain the real-profile count change from 7/41 to 6/35.
FEAT-01 remains pending until the Phase 7 gate and ledger are complete.
