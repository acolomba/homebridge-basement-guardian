---
phase: "07"
slug: "cucumber-feature-conformance"
status: validated
nyquist_compliant: true
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

- [x] Every planned task has an exact automated verify command.
- [x] No three consecutive tasks lack automated verification.
- [x] Every combined wave has a passing full gate, including any later addendum.
- [x] Real-profile checks remain dry-run only, with status inspection.
- [x] `nyquist_compliant: true` is set after the plan and evidence pass review.

**Approval:** Phase 7 automated validation passed; no Phase 7 manual-only
check was required.

## Current combined-tree evidence

At clean executable-input commit `7616dc2` on Node `v26.12.1`, the command
`TEST_CONCURRENCY=1 npm run check` exited 0. Static checks, the test build,
unpaired tests, 130/130 default offline Cucumber scenarios, 1400/1400 steps,
and 43 isolated direct source/test coverage pairs passed. The Cucumber part
reported 37.544 seconds. `git status --porcelain=v1 --untracked-files=all`
was empty at the source commit, and `git diff --exit-code 7616dc2
-- . ':(exclude,glob).planning/**/*.md'` exited 0. This evidence is reusable
only while executable inputs remain unchanged; any later source edit needs a
fresh full gate.

After that full build, `./node_modules/.bin/cucumber-js --dry-run --format usage`
exited 0 and its complete output contained no `UNUSED` definition.
`./node_modules/.bin/cucumber-js --profile real --dry-run --format summary`
exited 0 with exactly six skipped scenarios and 35 skipped steps. It reported
zero executing time and no undefined or ambiguous status. No real-profile
step body or vendor request ran.

The forward open set at this draft is empty. The reviewed Plan
07-18 addendum
closed `CR-07-REAL_STEPS-017` forward after the historical Round 2 STOP.
The reviewed Plan 07-19 addendum closed `CR-07-OFFLINE_LIBS-016` forward
after its historical Round 3 STOP; its complete-file review found 017/018.
Plan 07-20 closed 017 forward. Its independent review rejected 019 because
the cited method-description rule does not cover a free function.
Plan 07-21 closed 018 forward after an independent complete-file review
found no new source violation. No OFFLINE_LIBS ID remains forward-open.
Plan 07-22 closed HAP 025 forward after an independent complete-file
review. The reviewer's other warning maps to existing HAP 048.
Plan 07-23 closed HAP 028 forward after an independent complete-file
review. Its warnings repeat rejected HAP 020/024 and open HAP 051.
Plan 07-24's one independent review left HAP 032 open and stopped. The
post-review source fix at `a7545ab` passed the current full check but was
unreviewed when that plan stopped.
Plan 07-25 separately reviewed the complete corrected module and closed
HAP 032 forward with no new finding. The original and Plan 07-24 STOPs
remain recorded. Plan 07-26 renamed four HAP identifier parameters and
closed HAP 048 forward after an independent complete-file review.
Plan 07-27's
one independent review confirmed the corrected `updateCharacteristic`
comment but found the same overbroad claim in the `statusCode` JSDoc.
It stopped with 050 still open. Plan 07-28 corrected that JSDoc and an
independent complete-file review closed 050 forward with no new finding.
Plan 07-29's independent complete-file review closed HAP 051 forward but
raised two distinct warnings, HAP 054 and HAP 055. Its open-count equation
`1-1-0+2+0=2` required a separate STOP. Plan 07-30's two focused
source commits and one independent complete-file review closed HAP 054
and 055 forward with equation `2-2-0+0+0=0`. Candidate 056 concerned
unchanged code and was rejected under the TypeScript style skill's
review scope. The historical STOPs remain visible; Plan 07-14 must
still reconcile the final phase evidence before sign-off.
Historical STOP sets are indexed separately in `07-FINDINGS.md`. The
forward-open set is empty. The 12 owner report blobs, 37 original paths,
and 12 correction equations reconcile; Plan 07-30's separately bounded
review closed HAP 054/055. The phase-end `TEST_CONCURRENCY=1 npm run
check` at the same clean executable-input commit `7616dc2` exited 0
with 130/130 offline scenarios, 1400/1400 steps, and 43 isolated direct
coverage pairs. Default usage had zero unused definitions. The real
dry run selected six scenarios and 35 steps, all skipped. No vendor
step ran. FEAT-01 and FEAT-02 satisfy the five concrete Phase 7 roadmap
criteria on this evidence. Their spec-less probes stay
unclassified/unresolved and are not claimed as proof or backstops.
