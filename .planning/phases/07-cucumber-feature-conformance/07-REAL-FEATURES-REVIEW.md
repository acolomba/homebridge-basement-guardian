# REAL_FEATURES review

## Round 0 complete-file review

Independent reviewer: Claude Opus 5.5, read-only, 2026-10-22. The reviewer read all
three files at `dfa97e3228cada3b8cf022b0a4a1e12c3d3af7ce` and the applicable
project and Cucumber rules. The coordinator confirmed the committed blobs and
inspected the related step definitions locally. No real-profile step was run.

| File | Complete contiguous span | Committed blob |
| --- | ---: | --- |
| `features/real-pump/discovery.feature` | 1-26 | `fc0c03df0f0c5ca7987043d248efbe8ae30f98ff` |
| `features/real-pump/heartbeats.feature` | 1-25 | `1e131d26bd24d388797bad5e0e299a3646a70fe7` |
| `features/real-pump/lifecycle.feature` | 1-21 | `d52df511e538d38301c6c83fa66427d919fb2e7c` |

Baseline: `./node_modules/.bin/cucumber-js --profile real --dry-run --format
summary` exited 0 with seven skipped scenarios, 41 skipped steps, and no
undefined or ambiguous steps. The reviewer found 12 candidates. Ten are
accepted and two are rejected; opening open count is **10**.

| ID | Severity | Observed location | Rule | Disposition and reason |
| --- | --- | --- | --- | --- |
| CR-07-REAL_FEATURES-001 | BLOCKER | `dfa97e3:features/real-pump/heartbeats.feature:20-25` | `cucumber/SKILL.md`, Review | Open. The condition uses a store change as its own oracle, so a missed natural update passes. Remove this unprovable optional scenario and record the count change. |
| CR-07-REAL_FEATURES-002 | BLOCKER | `dfa97e3:features/real-pump/heartbeats.feature:10-18` | `cucumber/SKILL.md`, Review | Open. REST discovery does not prove the live connection opened. Require the existing shadow-sourced-field observation before waiting; describe the later check as absence of reported failure. |
| CR-07-REAL_FEATURES-003 | WARNING | `dfa97e3:features/real-pump/lifecycle.feature:4-15` | `cucumber/SKILL.md`, Review; `rules/features.md`, Scenarios | Open. Fingerprint equality alone does not observe the absence of a grant. Narrow the title and description to the cached token remaining unchanged. |
| CR-07-REAL_FEATURES-004 | WARNING | `dfa97e3:features/real-pump/heartbeats.feature:4-18` | `rules/features.md`, Feature description | Open. Prose excludes discovery failure and claims rejection coverage without a named step. Describe the actual checks accurately. The existing connection-failure assertion checks both failure lines and rejections. |
| CR-07-REAL_FEATURES-005 | WARNING | `dfa97e3:features/real-pump/lifecycle.feature:21`; `dfa97e3:features/real-pump/heartbeats.feature:25` | `rules/features.md`, Steps | Open. The observable outcome uses past-tense `recorded`. Change the surviving lifecycle step to present tense with its binding. The heartbeat line disappears under 001. |
| CR-07-REAL_FEATURES-006 | WARNING | `dfa97e3:features/real-pump/discovery.feature:16-19` | `rules/features.md`, Scenarios and Steps | Open. Use the possessive title and lower-case `device id` in the step and binding. |
| CR-07-REAL_FEATURES-007 | WARNING | `dfa97e3:features/real-pump/discovery.feature:2`; `dfa97e3:features/real-pump/heartbeats.feature:2`; `dfa97e3:features/real-pump/lifecycle.feature:2` | `rules/layout.md`, Vertical functions | Open. Align all three feature titles with their real-pump directory and file names. |
| CR-07-REAL_FEATURES-008 | WARNING | `dfa97e3:features/real-pump/lifecycle.feature:20-21` | `rules/features.md`, Scenarios; `07-11-PLAN.md`, task 01 | Open. Bound the stop and the post-stop rejection observation in Gherkin and bindings. |
| CR-07-REAL_FEATURES-009 | WARNING | `dfa97e3:features/real-pump/discovery.feature:4-8`; `dfa97e3:features/real-pump/heartbeats.feature:4-8`; `dfa97e3:features/real-pump/lifecycle.feature:4-7` | `rules/features.md`, Feature description | Open. Each description exceeds three lines. Condense to three lines without changing observation scope. |
| CR-07-REAL_FEATURES-010 | WARNING | `dfa97e3:features/real-pump/heartbeats.feature:8,14`; `dfa97e3:features/real-pump/discovery.feature:8`; `dfa97e3:features/real-pump/lifecycle.feature:7` | `rules/features.md`, Scenarios | Open. Remove ambiguous internal decision/test references from scenario prose. |
| CR-07-REAL_FEATURES-011 | WARNING | `dfa97e3:features/real-pump/discovery.feature:12` and other real-profile steps | `rules/features.md`, Steps | Rejected. These are explicitly diagnostic read-only observations of a real vendor connection; the maintainer accepted diagnostic outcomes in this phase. `harness` describes the operator-owned runner. Rewording every binding adds no behavioral evidence. |
| CR-07-REAL_FEATURES-012 | WARNING | `dfa97e3:features/real-pump/heartbeats.feature:15-18`; `dfa97e3:features/real-pump/lifecycle.feature:10-15` | `rules/features.md`, Scenarios and Steps | Rejected. Start, discovery, wait, and restart are sequential actions and observations for one lifecycle behavior. The rule permits alternating `When` and `Then` and says a second `When` *usually* hides another behavior; these scenarios do not. |

Findings 005, 006, and 008 require changes to existing step bindings owned by
Plan 07-13. Those exact paths and the revised dry-run counts must enter an
approved plan revision before source changes. Each accepted cause receives a
focused check and one normal-hook commit. An independent current-file review
will record the correction equation and exact remaining IDs.
