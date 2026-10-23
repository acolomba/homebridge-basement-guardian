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

Findings 001, 005, 006, and 008 required changes to support paths originally
owned by Plans 07-12 and 07-13. Exact-path and count revisions were recorded
before those source changes. An independent current-file review will record
the correction equation and exact remaining IDs.

## Round 0 repairs

The exact-path and 6/35 count revision was committed as `dcd3c20`, `5d707aa`,
and `ff47970` before touching the additional step and World paths. The real
profile was invoked only with `--dry-run`. `npm run build:test` exited 0 before
each changed-binding dry run; the final dry run exited 0 with six skipped
scenarios, 35 skipped steps, and no undefined or ambiguous status. Each source
commit passed `SKIP=npm-check pre-commit run --files ...`, `fallow audit --base
HEAD`, and normal `git commit` hooks. The profile's step bodies were not run;
the shutdown timing change has binding and type-check evidence only.

| ID | Repair commit | Focused evidence and disposition |
| --- | --- | --- |
| CR-07-REAL_FEATURES-001 | `98a2b3b` | Removed the optional scenario, its unused bindings, and the orphaned World change recorder. Build and dry run exited 0 at the intermediate 6 scenarios/34 steps; fixed pending independent review. |
| CR-07-REAL_FEATURES-002 | `f21c6c4`, `997cc2b` | Added the existing bounded shadow observation and narrowed the title to reported failure. Build and dry run exited 0 at 6/35; fixed pending independent review. |
| CR-07-REAL_FEATURES-003 | `6d08069` | Limited the restart claim to unchanged cached-token content. Real dry run exited 0 at 6/35; fixed pending independent review. |
| CR-07-REAL_FEATURES-004 | `0338bd2` | Replaced false heartbeat prose with the actual discovery, shadow, log, and rejection checks. Real dry run exited 0 at 6/35; fixed pending independent review. |
| CR-07-REAL_FEATURES-005 | `99bb04d` | Changed the rejection outcome and binding to present tense. Build and real dry run exited 0 at 6/35; fixed pending independent review. |
| CR-07-REAL_FEATURES-006 | `0294b26` | Corrected the possessive title and matched lower-case `device id` step/binding. Build and real dry run exited 0 at 6/35; fixed pending independent review. |
| CR-07-REAL_FEATURES-007 | `2dac0ab` | Aligned three feature titles with their directory and file names. Real dry run exited 0 at 6/35; fixed pending independent review. |
| CR-07-REAL_FEATURES-008 | `96d8699` | Bounded shutdown at five seconds and observed rejections for one second afterward. Build and real dry run exited 0 at 6/35; fixed pending independent review. |
| CR-07-REAL_FEATURES-009 | `9bd28c3` | Condensed all three descriptions to three lines. Real dry run exited 0 at 6/35; fixed pending independent review. |
| CR-07-REAL_FEATURES-010 | `43d3d03` | Removed the ambiguous internal decision and test references. Real dry run exited 0 at 6/35; fixed pending independent review. |

## Round 1 complete-file correction review

Independent reviewer: a fresh read-only Claude Opus 5.5 session on 2026-10-22.
The coordinator confirmed HEAD `c404e90a007c77f3af575e0f9103a236cd3875e2`
was clean and the expected blobs before the review. The reviewer read each
feature completely and the same project rules; it did not read step or World
code. The current real-profile dry run remained six skipped scenarios and 35
skipped steps. Reviewed spans and committed blobs:

| File | Complete contiguous span | Blob |
| --- | ---: | --- |
| `features/real-pump/discovery.feature` | 1-24 | `e0531e72a2d615ec322d4d2d86ae851e94fa99eb` |
| `features/real-pump/heartbeats.feature` | 1-17 | `101d01ee4801680a367b7c79afe5054f86cef033` |
| `features/real-pump/lifecycle.feature` | 1-20 | `b7f2aea35808b62e51a71899e3f36470911b343a` |

Opening IDs: 001-010 (10). Fixed IDs: 001-010 (10). Rejected IDs in this
round: none. New ID: 013 (1). Reopened IDs: none. Closing IDs: 013 (1).
Equation: `1 = 10 - 10 - 0 + 1 + 0`. The count fell and no fixed ID reopened,
so one correction is allowed before round 2. IDs 011 and 012 remain rejected
from the initial triage and are not in the opening count. The independent
review could inspect feature text for IDs 005, 006, and 008 but not their
TypeScript binding implementation; the local build and dry-run are recorded
above, and the step modules have a separate Plan 07-13 review.

| ID | Severity | Observed location | Rule | Disposition and repair |
| --- | --- | --- | --- | --- |
| CR-07-REAL_FEATURES-013 | WARNING | `c404e90:features/real-pump/heartbeats.feature:5,11-17` | `cucumber/SKILL.md`, Review; `rules/features.md`, Steps | Open. The description and comment name unhandled rejections, but the visible outcome step names only connection failure. The existing binding checks both. Name both in the step text and its binding without changing the 6/35 count. |

## Round 2 complete-file correction review

ID 013 was repaired in normal-hook commit `0753b42`: the visible heartbeat
outcome and its existing binding now name both connection failures and
unhandled rejections. `npm run build:test` and the real-profile dry run each
exited 0, with six skipped scenarios, 35 skipped steps, and no undefined or
ambiguous step. The coordinator confirmed a clean HEAD
`0753b429bde749066097f9291321a1d074a54cfa` and the three blobs below
before a new read-only Claude Opus 5.5 session independently read the complete
current feature files and applicable rules. The reviewer used only Read and
did not inspect step code; its binding result relies on the coordinator's
build and dry-run evidence.

| File | Complete contiguous span | Blob |
| --- | ---: | --- |
| `features/real-pump/discovery.feature` | 1-24 | `e0531e72a2d615ec322d4d2d86ae851e94fa99eb` |
| `features/real-pump/heartbeats.feature` | 1-17 | `2bf68c15efe7950b3a6b798c34a078fef7b6a6aa` |
| `features/real-pump/lifecycle.feature` | 1-20 | `b7f2aea35808b62e51a71899e3f36470911b343a` |

Opening ID: 013 (1). Fixed ID: 013 (1). Rejected, new, and reopened IDs:
none. Closing IDs: **none (0)**. Equation: `0 = 1 - 1 - 0 + 0 + 0`.
The reviewer reported zero current BLOCKERs and zero current WARNINGs. It
confirmed that 013 did not reopen. Plan 07-11 closes with zero open IDs after
two correction rounds; neither a no-progress nor a fourth-round STOP applies.
The default-profile usage dry run exited 0 and contained no `UNUSED` entry.
