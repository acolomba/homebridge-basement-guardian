# MONITORING complete-file review

This is the Round 0 candidate record for the `code-review-sweep` monitoring batch. No candidate below is yet a confirmed production bug. The maintainer is ruling on candidate 001 before the opening accepted set is fixed. No source repair has begun.

## Round 0 complete-file review

Reviewer `/root/phase7_monitoring_round0` read both owned files completely at `db38aa5180ae2369f85fd0b0baad90394c45929d` against the Cucumber and TypeScript rules and `07-REVIEW-PROTOCOL.md`. The reviewer traced relevant world, fake REST, monitoring, and service-catalogue paths. The long feature contains no Scenario Outline or Examples table.

| Owned path | Reviewed blob | Contiguous lines | Result |
| --- | --- | ---: | --- |
| `features/monitoring/degradation.feature` | `33abd364ec93b0aa96f19a5b1cd7ae76ecc8bc7b` | 1-180, 181-360, 361-540, 541-707 | Candidates 001-006, 009, 011. |
| `features/step_definitions/runtime.steps.ts` | `2aaecae22b5bcbfb7c544b54ba837db37f309d22` | 1-256 | Candidates 004, 005, 007, 008, 010. |

## Candidates awaiting triage

`B` and `W` are the reviewer's proposed severity. The disposition for each row is **pending**; the protocol's opening accepted count is not yet set. Locations refer to the observed revision, not the moving current line.

| ID | Requirement | Rule path and section | Observed location | Proposed severity | Candidate and plausible wrong result |
| --- | --- | --- | --- | --- | --- |
| CR-07-MONITORING-001 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/features.md` §Scenarios and §Data tables | `db38aa5:features/monitoring/degradation.feature:333-348` | B | “Every scope” checks only Flood and Offline. Mains Power could remain marked current and pass. Maintainer decision requested: expand full published-service trust assertion or narrow the claim. |
| CR-07-MONITORING-002 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/features.md` §Scenarios | `db38aa5:features/monitoring/degradation.feature:513-533,559-604,606-657` | B | “Every service unreadable” samples one or three services. Primary Pump could answer a read after credential refusal and pass. |
| CR-07-MONITORING-003 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/features.md` §Scenarios | `db38aa5:features/monitoring/degradation.feature:659-674` | B | “Every service readable” checks two Flood characteristics. Primary Pump could answer No Response during a recoverable outage and pass. |
| CR-07-MONITORING-004 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review | `db38aa5:features/monitoring/degradation.feature:14-23,371-387`; `db38aa5:features/step_definitions/runtime.steps.ts:188-196` | B candidate | “Keeps polling” may prove only one fallback update; the eight-poll floor may be met before silence. A loop that stops at the wrong time could pass. |
| CR-07-MONITORING-005 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review | `db38aa5:features/monitoring/degradation.feature:14-23,72-80`; `db38aa5:features/step_definitions/runtime.steps.ts:149-168` | B candidate | “Warns once” checks after three refusals and may miss a later duplicate. A fourth-attempt duplicate warning could pass. |
| CR-07-MONITORING-006 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps | `db38aa5:features/monitoring/degradation.feature:328,343,366,450,469,484,502,528-529,553,588,639` | W | Multiple Given steps occur after a When. |
| CR-07-MONITORING-007 | FEAT-02 | `.agents/skills/cucumber/rules/steps.md` §Steps | `db38aa5:features/step_definitions/runtime.steps.ts:203-243` | W | A Then stores an inventory count through `remember()` for a later Then; the rule says a Then has no side effects. |
| CR-07-MONITORING-008 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | `db38aa5:features/step_definitions/runtime.steps.ts:1-8` | W | The approved SPDX and separate copyright JSDoc header are absent. |
| CR-07-MONITORING-009 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | `db38aa5:features/monitoring/degradation.feature:1-5` | W | The description omits the local fake cloud standing in for the vendor service. |
| CR-07-MONITORING-010 | FEAT-02 | `.agents/skills/cucumber/rules/steps.md` §Steps | `db38aa5:features/step_definitions/runtime.steps.ts:56-256` | W candidate | Registrations use named function declarations rather than the prescribed anonymous world-bound expressions. |
| CR-07-MONITORING-011 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/features.md` §Scenarios | `db38aa5:features/monitoring/degradation.feature:458-472` | W candidate | The title says “before any poll,” but the restart step awaits runtime startup before the assertion; it may mean before any *successful* poll. |

## Correction rounds

Not started. The opening accepted set and count will be recorded after candidate triage. The protocol applies `closing = opening - fixed - rejected + new + reopened` to every later independent correction round.
