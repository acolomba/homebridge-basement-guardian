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
| Measured runtime | The current default Cucumber run took about 37 seconds; the full gate also runs static, unpaired, and direct-coverage checks. |

## Sampling Rate

- After each task commit, run the focused affected default scenario or profile,
  then use the normal commit hook. For a planning-only commit, retain the
  unchanged-input check evidence.
- After each combined wave and before phase verification, run `npm run check`.
- Before accepting real-profile binding, compile and inspect dry-run step
  statuses for zero undefined or ambiguous steps; do not run live steps.
- Do not treat a Cucumber dry-run exit code of zero as complete binding proof.

## Per-Task Verification Map

The owner batches and their report blobs are indexed in `07-FINDINGS.md`.

| Task family | Requirement | Automated verification |
|-------------|-------------|------------------------|
| Gherkin review and repair | FEAT-01 | `TEST_CONCURRENCY=1 npm run check`: current default profile 130 scenarios and 1400 steps, with the 104/1156 baseline and each change explained in the owner reports; real-profile dry run 6/35 skipped. |
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
- [ ] Every combined wave has a passing full gate, including any later addendum.
- [x] Real-profile checks remain dry-run only, with status inspection.
- [ ] `nyquist_compliant: true` is set after the plan and evidence pass review.

**Approval:** pending

## Current combined-tree evidence

At clean executable-input commit `e5f3601` on Node `v26.12.1`, the command
`TEST_CONCURRENCY=1 npm run check` exited 0. Static checks, the test build,
unpaired tests, 130/130 default offline Cucumber scenarios, 1400/1400 steps,
and 43 isolated direct source/test coverage pairs passed. The Cucumber part
reported 37.221 seconds. `git status --porcelain=v1 --untracked-files=all`
was empty before this planning-only edit, and `git diff --exit-code e5f3601
-- . ':(exclude,glob).planning/**/*.md'` exited 0. This evidence is reusable
only while executable inputs remain unchanged; any later source edit needs a
fresh full gate.

After that full build, `./node_modules/.bin/cucumber-js --dry-run --format usage`
exited 0 and its complete output contained no `UNUSED` definition.
`./node_modules/.bin/cucumber-js --profile real --dry-run --format summary`
exited 0 with exactly six skipped scenarios and 35 skipped steps. It reported
zero executing time and no undefined or ambiguous status. No real-profile
step body or vendor request ran.

The forward open set at this draft is `CR-07-OFFLINE_LIBS-017`,
`CR-07-OFFLINE_LIBS-018`, `CR-07-HAP-025`, `CR-07-HAP-028`,
`CR-07-HAP-032`, `CR-07-HAP-048`,
`CR-07-HAP-050`, and `CR-07-HAP-051`. The reviewed Plan 07-18 addendum
closed `CR-07-REAL_STEPS-017` forward after the historical Round 2 STOP.
The reviewed Plan 07-19 addendum closed `CR-07-OFFLINE_LIBS-016` forward
after its historical Round 3 STOP; its complete-file review found 017/018.
Historical STOP sets are indexed separately in `07-FINDINGS.md`. FEAT-01 and
FEAT-02 cannot receive a clean phase sign-off while any forward ID remains open. The
FEAT-01 and FEAT-02 spec-less probes stay unclassified and unresolved.
