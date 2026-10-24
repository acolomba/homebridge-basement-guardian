---
phase: 07-cucumber-feature-conformance
plan: "04"
subsystem: testing
tags: [cucumber, homekit, safety, controls, review]
requires:
  - phase: 07-01
    provides: Phase 7 review protocol and offline baseline
provides:
  - Four complete-file HOMEKIT reviews with stable findings and bounded correction rounds
  - Exact command, controller-read, timeout, and telemetry-trust assertion repairs
  - Truthful Round 3 STOP with one unresolved command-path finding
affects: [cucumber-feature-conformance, FEAT-01, FEAT-02]
actuals:
  tokens: 8653
  tasks: 3
  commits: 19
plan_head_before: 71be722f274419f5fe9fec5b639a366407ec5330
plan_head_after: 243630005302c91d9254983ee54f72158fd49ec5
tech-stack:
  added: []
  patterns: [complete-file independent review, one-cause commits, temporary wrong-result controls]
key-files:
  created:
    - .planning/phases/07-cucumber-feature-conformance/07-HOMEKIT-REVIEW.md
    - .planning/phases/07-cucumber-feature-conformance/07-04-SUMMARY.md
  modified:
    - features/homekit/official-controls.feature
    - features/homekit/safety-state.feature
    - features/step_definitions/controls.steps.ts
    - features/step_definitions/homekit.steps.ts
key-decisions:
  - Stop after Round 3 because the positive open count stayed at one.
  - Keep command-path finding 014 open for phase reconciliation; do not extend the correction round.
requirements-completed: []
coverage:
  - id: D1
    description: Four complete-file HOMEKIT reviews and bounded finding ledger
    verification:
      - kind: other
        ref: .planning/phases/07-cucumber-feature-conformance/07-HOMEKIT-REVIEW.md#Round-3-STOP
        status: pass
    human_judgment: true
    rationale: One accepted BLOCKER remains open at the required STOP.
  - id: D2
    description: Offline control and safety assertion repairs
    requirement: FEAT-02
    verification:
      - kind: integration
        ref: npm run test:cucumber
        status: pass
    human_judgment: true
    rationale: Passing scenarios do not prove the full command path while finding 014 remains open.
duration: 33min
completed: 2026-10-20
status: complete
---

# Phase 7 Plan 04: HOMEKIT complete-file review summary

Four HOMEKIT files received complete independent review. Twelve accepted
findings were repaired; Round 3 stopped with one open blocker.

## Results

- [07-HOMEKIT-REVIEW.md](./07-HOMEKIT-REVIEW.md) records each reviewer, exact
  source commit and blob, full-file span, finding disposition, focused proof,
  and correction count. The accepted open counts were **8 → 3 → 1 → 1**.
- **CR-07-HOMEKIT-014 (BLOCKER, open):** the vendor command assertion compares
  only URL pathname. A request with an extra query parameter can pass its
  exact-command check. It first appeared at
  `d6fc7f2:features/step_definitions/controls.steps.ts:115-121` and was not
  repaired after the Round 3 STOP.
- The Round 3 equation is `1 opening - 1 fixed - 0 rejected + 1 new + 0
  reopened = 1 closing`. The positive count did not fall. No Round 4 repair
  or review was dispatched.
- No production source changed. These were Cucumber assertion and wording
  findings, so no production behavior RED/GREEN pair was claimed.

## Verification

- `npm run test:cucumber` passed on clean source commit `ed93d5b` with **104
  scenarios and 1,174 steps** on Node `v26.12.0`. HOMEKIT added 14 steps and
  no scenarios; prior ACCOUNT and ACCESSORY batches explain four other steps
  above the phase-start 1,156-step baseline.
- `./node_modules/.bin/cucumber-js --dry-run --format usage` exited 0 after
  compilation. Its complete output had no unused, undefined, or ambiguous
  step definition. No real-profile step ran.
- Temporary wrong-result controls failed the intended command, HAP read,
  timeout, and trust assertions. They were restored before their repair
  commits. Normal hooks and Fallow audit passed for the repair commits.
- The coordinator owns the combined-wave `npm run check` gate. This focused
  result does not claim phase closure.

## Commits

Round 0 report: `02b24c1`. First repair set: `704a402`, `2df7337`,
`bf4a88d`, `588e350`, `822081b`, `8fb436b`, `139eea2`, `3f29c5f`.
First evidence and review: `f74b3d4`, `dcb549a`. Second repair set:
`4a3c0f6`, `c0c97fd`, `25d5f46`; evidence and review: `a14e30e`,
`daa117a`. Third repair and evidence: `ed93d5b`, `d6fc7f2`; STOP report:
`2436300`. The persisted plan ledger measured **19** commits before this
summary commit.

## Deviations from Plan

None. The plan requires a truthful STOP when a positive open count does not
fall. Finding 014 is left open under that rule.

## Known Stubs

None. `placeholder-gemini` is an offline synthetic device ID, not a product
stub.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next Phase Readiness

The phase coordinator has open ID 014 for reconciliation. FEAT-01 is not
claimed complete by this batch. The combined-wave full gate remains pending.

## Self-Check: PASSED

All four owned source files and the review report exist. The 19 measured plan
commits are ancestors of HEAD, no reviewed source file was deleted, and the
checkout was clean before this summary was written.
