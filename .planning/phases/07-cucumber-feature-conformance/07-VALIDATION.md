---
phase: "07"
slug: "cucumber-feature-conformance"
status: draft
nyquist_compliant: false
wave_0_complete: true
created: "2026-10-19"
---

# Phase 7 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Cucumber.js 13.2.1; Node test runner for any source/test pair |
| Config file | `cucumber.json` |
| Quick run command | `npm run build:test && ./node_modules/.bin/cucumber-js --dry-run --format summary` |
| Full suite command | `npm run check` |
| Estimated runtime | Default Cucumber execution took about 28 seconds at baseline; record full-gate timing during execution. |

## Sampling Rate

- After each task commit, run the focused affected default scenario or profile,
  then use the normal commit hook. For a planning-only commit, retain the
  unchanged-input check evidence.
- After each combined wave and before phase verification, run `npm run check`.
- Before accepting real-profile binding, compile and inspect dry-run step
  statuses for zero undefined or ambiguous steps; do not run live steps.
- Do not treat a Cucumber dry-run exit code of zero as complete binding proof.

## Per-Task Verification Map

The planner will fill task IDs and exact commands after defining review batches.

| Task family | Requirement | Automated verification |
|-------------|-------------|------------------------|
| Gherkin review and repair | FEAT-01 | Default profile pass with scenario count 104; real-profile dry-run 7 scenarios and 41 bound, skipped steps. |
| Step and support review and repair | FEAT-02 | Default profile pass, usage formatter has no `UNUSED`, TypeScript and formatting gates pass. |
| Genuine behavior bug | BUG-01 | Active RED evidence on unchanged production before GREEN; focused scenario and any touched direct source/test pair pass. |
| Phase closure | PROC-01, PROC-02 | Ledger reconciles all 37 files and each batch's independent round/STOP result; `npm run check` passes. |

## Wave 0 Requirements

Existing Cucumber and Node test infrastructure covers the phase. The measured
baseline is 104 passing default scenarios and 1,156 passing steps; the real
dry run selects seven scenarios and 41 skipped steps.

## Manual-Only Verifications

None for Phase 7. Real hardware observation and the unresolved Phase 6
degraded-status check are outside this phase.

## Validation Sign-Off

- [ ] Every planned task has an exact automated verify command.
- [ ] No three consecutive tasks lack automated verification.
- [ ] Every combined wave has a passing full gate.
- [ ] Real-profile checks remain dry-run only, with status inspection.
- [ ] `nyquist_compliant: true` is set after the plan and evidence pass review.

**Approval:** pending
