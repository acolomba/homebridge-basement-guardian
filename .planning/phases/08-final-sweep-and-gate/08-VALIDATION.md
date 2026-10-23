---
phase: "08"
slug: "final-sweep-and-gate"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-22"
---

# Phase 8 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node test runner and Cucumber.js 13.2.1 |
| Config file | `tsconfig.test.json`, `cucumber.json`, `package.json` |
| Quick run command | `npm run build:test` followed by the affected owner test or default scenario |
| Full suite command | `TEST_CONCURRENCY=1 npm run check` |
| Estimated runtime | Record the measured duration at the Phase 8 gate |

## Sampling Rate

- After a source or test repair, run the focused owner test and direct pair
  coverage, or the affected offline Cucumber scenario. Use the normal commit
  hook after the committing skill's fixer step.
- After each combined repair wave, run `TEST_CONCURRENCY=1 npm run check`.
- Before Phase 8 verification and milestone audit, run the full gate on the
  final combined tree and record the exact commit, Node version, exit and scope.
- A planning-only commit may reuse same-session evidence only when executable
  inputs are proven unchanged by the local-verification rule.

## Per-Task Verification Map

The plan IDs and task commands will be added when Phase 8 plans exist.

| Task family | Requirement | Test type | Automated command | Status |
|-------------|-------------|-----------|-------------------|--------|
| Six complete-file review batches and correction rounds | GATE-02 | static review and owner checks | `TEST_CONCURRENCY=1 npm run check` after each combined repair wave | pending |
| Genuine bug provenance and new RED/GREEN evidence | BUG-01 | active target regression and Git audit | `gsd-tools check tdd-red-evidence <archive> --raw`, named owner test and Git ancestry checks | pending |
| Final combined tree | GATE-01 | static, unpaired, offline Cucumber and isolated direct coverage | `TEST_CONCURRENCY=1 npm run check` | pending |
| Prior phase verification freshness | GATE-01, GATE-02 | GSD verifier | `gsd-tools query verification.status <phase-dir>` for Phases 1–7 | blocked by current ROOT STOP |

## Prior-phase verifier refresh attempt

Plan 08-10 started after the former Phase 8 review seal. Phase 1's normal
verification-only route stopped at `tdd.review-checkpoint`: it requires separate
`test(01-01)` and `feat(01-01)` commits, while the approved D-06 plan retained
the active RED in a planning-only commit and committed the test with its fix.
Plan 08-22 corrected the plan's execution-mode metadata to `execute` and
documented the approved custom TDD task. The GSD checkpoint now reports
`block: false`, `violations: 0`, `tddPlans: 0` (skip). Separately, the actual
RED archive still reports `RED_EVIDENCE_OK`; Git proves source `109fda7` <
planning-only evidence `919d70d` < active test and fix `3878103`. This is a
metadata reconciliation, not a new RED/GREEN sequence. No old verifier status
was edited.

| Phase | Refresh result before Plan 08-20 source/test changes | Current live status after Plan 08-20 | Next action |
| --- | --- | --- | --- |
| 01 | TDD gate `block: true`, one plan violation; verifier not run | stale | Run the normal verifier route now that approved evidence and execution metadata agree. |
| 02 | Fresh full route and typed verifier: passed, 18/18; full gate 130 scenarios, 1401 steps, 43 pairs | passed | Keep the fresh covered-file fingerprint. |
| 03 | Fresh full route and typed verifier: `human_needed`, 19/22, with E-03-01 and P-03-01/02 open | stale | Rerun after source seal, then retain any human-needed result. |
| 04 | Nyquist and security passed; advisory review found ROOT-002 and RUNTIME-007; later gates not run | stale | Rerun after the new separate ROOT-003 closure and seal. |
| 05–07 | Not yet refreshed | stale | Run each normal route after the current sealed source tree. |

At `9863d9b`, the Plan 08-20 full `npm run check` passed 130/130 scenarios,
1401/1401 steps, and all 43 direct coverage pairs on Node `v26.12.1`. This is
a combined-tree test result, not a verifier pass or a current review seal.

At `499659b`, Plan 08-21's full `NPM_CONFIG_CACHE=/private/tmp/guardian-phase8-plan21-npm-cache TEST_CONCURRENCY=1 npm run check` exited 0 on Node `v26.12.1`: 130/130 Cucumber scenarios, 1401/1401 steps, and 43 direct coverage pairs. The separate ROOT-003 review closed its only ID and a one-off exact-blob audit passed all 137 current paths. Both earlier STOP records remain unchanged. The source tree is ready for the stale verifier routes; no Phase 8 signoff is claimed yet.

## Wave 0 Requirements

Existing Node, Cucumber and direct-coverage infrastructure covers this phase.
Execution must create a live file manifest, batch review reports, a Phase 8
findings ledger, and the milestone bug index. It must refresh the manifest when
the tree changes.

## Manual-Only Verifications

None for Phase 8. Live vendor, hardware, and real Homebridge checks remain
outside this milestone. The real Cucumber profile is dry-run only.

## Validation Sign-Off

- [ ] Every plan task has a concrete automated check or explicit evidence audit.
- [ ] No three consecutive tasks lack automated verification.
- [ ] Every combined repair wave and the final tree pass the full gate.
- [ ] All 43 direct source/test pairs reach 100% line, function and branch coverage.
- [ ] No watch-mode flags or live real-pump execution.
- [ ] `nyquist_compliant: true` is set after the final evidence audit.

**Approval:** Pending Phase 8 execution and verification.
