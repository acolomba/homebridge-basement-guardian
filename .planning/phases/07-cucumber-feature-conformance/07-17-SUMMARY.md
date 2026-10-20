---
phase: 07-cucumber-feature-conformance
plan: "17"
subsystem: testing
tags: [cucumber, monitoring, post-stop-adjudication]
requires:
  - phase: 07-06
    provides: MONITORING Round 1 STOP with CR-07-MONITORING-004 open
provides:
  - Bounded forward wording closure for CR-07-MONITORING-004
  - Current full offline gate after the wording change
affects: [07-14, FEAT-01]
actuals:
  tasks: 1
  commits: 1
key-files:
  created:
    - .planning/phases/07-cucumber-feature-conformance/07-17-SUMMARY.md
  modified:
    - features/monitoring/degradation.feature
key-decisions:
  - Narrow the claim because another scenario proves continued polling after silence.
  - Keep the historical Round 1 STOP and open-at-STOP ID in the MONITORING report.
requirements-completed: []
completed: 2026-10-20
status: complete
---

# Phase 7 Plan 17: Monitoring post-STOP wording

The maintainer delegated the choice for reopened `CR-07-MONITORING-004` with “whatever you think best.” I chose to narrow the scenario claim. The title now says **“Shadow silence withdraws flood trust while offline status stays current.”** Its three-line description says only what the existing flood and offline trust and alarm assertions show. The separate scenario **“A successful poll does not clear the shadow silence”** still observes two later vendor updates, so continued polling remains covered there.

This was one finite repair after the historical STOP, not another MONITORING correction round. [07-MONITORING-REVIEW.md](07-MONITORING-REVIEW.md) still records Round 1 closing with 004 open. Commit `4a882ae` changed only the scenario title and description in `features/monitoring/degradation.feature`; the steps and their count did not change. The current feature blob is `97907698e60ac2f8a94eaba25e744d74736603b9`. Plan 07-14 must show the historical STOP and this later forward closure separately.

## Verification

Before commit on Node `v26.12.0`, the only tracked input diff was the title and description change later committed as `4a882ae`; there were no untracked inputs. `npm run build:test` exited 0. The named scenario passed 1/1 with 15/15 steps. `./node_modules/.bin/cucumber-js --dry-run --format usage` exited 0, and its saved output contained no `UNUSED`, `UNDEFINED`, or `AMBIGUOUS` marker. The pre-commit checks, Fallow audit, and normal commit hooks passed.

The post-commit `npm run check` exited 0 at the same commit and clean input tree: all static checks, the test build, unpaired tests, **104/104 offline Cucumber scenarios**, **1192/1192 steps**, and all **43 direct coverage pairs** passed. No real-pump scenario ran live.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next phase readiness

The forward wording gap is closed. The original MONITORING STOP remains visible for the Phase 7 ledger. FEAT-01 and FEAT-02 remain pending until the other owner batches and final phase gate finish.
