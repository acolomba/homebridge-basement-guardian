---
phase: 07-cucumber-feature-conformance
plan: "06"
subsystem: testing
tags: [cucumber, monitoring, complete-file-review]
requires:
  - phase: 07-05
    provides: Reviewed shadow behavior and step definitions
provides:
  - Complete-file MONITORING review with a truthful Round 1 STOP
  - Ten accepted test-material repairs and one maintainer-rejected style candidate
affects: [07-17, 07-14, FEAT-01, FEAT-02]
actuals:
  tasks: 3
  commits: 23
key-files:
  created:
    - .planning/phases/07-cucumber-feature-conformance/07-MONITORING-REVIEW.md
    - .planning/phases/07-cucumber-feature-conformance/07-06-SUMMARY.md
  modified:
    - features/monitoring/degradation.feature
    - features/step_definitions/runtime.steps.ts
key-decisions:
  - Keep the post-start Given wording by explicit maintainer ruling.
  - Preserve the Round 1 reopened finding and STOP before a separate repair plan.
requirements-completed: []
completed: 2026-10-20
status: complete
---

# Phase 7 Plan 06: Monitoring review summary

The MONITORING batch **stopped with CR-07-MONITORING-004 open**. Round 0 read both files completely and raised 11 candidates. The maintainer accepted 10 and rejected the post-start `Given` wording candidate 006. Each accepted cause received a separate fix commit. Independent Round 1 read both repaired files completely at `a700f108` and reopened 004 in a third shadow-silence scenario. The count was `10 - 10 - 0 + 0 + 1 = 1`. The protocol required an immediate STOP. The complete blobs, spans, causes, commits, and equation are in [07-MONITORING-REVIEW.md](07-MONITORING-REVIEW.md).

## Repairs and controls

The accepted repairs check every published service's trust where the scenario claims every service, require later polls in two degraded-path scenarios, recheck warning counts after later refusals and recovery, move a captured request count into setup, add the approved TypeScript header, identify the fake cloud, use anonymous World-bound callbacks, and clarify “before any successful poll.” The Gherkin title and description at `features/monitoring/degradation.feature:91` still overclaim polling after shadow silence. That is the open finding. Plan 07-17 owns one bounded forward wording repair; this report's historical STOP stays unchanged.

The scenario count stayed at 104. Added assertions raised the step count from 1174 to 1192: IDs 001, 002, 003, 004, and 005 added 1, 6, 1, 5, and 5 steps respectively. Temporary wrong-result controls for the broader trust and later-poll assertions failed at their intended checks and were removed. No production source changed.

## Gate evidence

At `a700f108` on Node `v26.12.0`, `npm run check` exited 0 with a clean tracked and untracked tree. Static checks, the test build, unpaired tests, 104/104 offline Cucumber scenarios, 1192/1192 steps, and all 43 direct coverage pairs passed. The source had not changed when the STOP record was committed at `9a93f90`. The final title edit did not receive a separate usage dry run before the STOP; Plan 07-17 owns that check. No real-pump scenario ran live.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next phase readiness

Plan 07-17 carries the maintainer-delegated narrow wording repair. Plan 07-14 must report the historical open-at-STOP state and the later forward outcome separately. FEAT-01 and FEAT-02 remain pending until all Phase 7 owner batches and the phase ledger finish.
