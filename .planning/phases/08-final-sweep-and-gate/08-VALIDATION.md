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
| Prior phase verification freshness | GATE-01, GATE-02 | GSD verifier | `gsd-tools query verification.status <phase-dir>` for Phases 1–7 | pending |

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
