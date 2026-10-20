# SHADOW complete-file review

This report covers the `code-review-sweep` SHADOW batch. Local reviewer
`/root/phase7_shadow_round0` read all four owned files at
`b621f0ab8471447d5a97b79f882a371a90e1bbf7`. The reviewer used the current
Cucumber rules, TypeScript rules, and `07-REVIEW-PROTOCOL.md`. No live profile ran.

## Round 0 complete-file review

| Owned path | Reviewed blob | Contiguous lines | Result |
| --- | --- | ---: | --- |
| `features/shadow/connection-lifecycle.feature` | `4c23223604c9ea42d3574cc35dd82202bc8fc80b` | 1-50 | Candidate 003 rejected; candidate 007 rejected. |
| `features/shadow/credential-rotation.feature` | `9b4d7a920fdc715611af0e3b9c956583045dc5f1` | 1-29 | Findings 002 and 005; candidate 007 rejected. |
| `features/shadow/state-merging.feature` | `1d0c93f20bb300d324234c9efbeee9feed4acbca` | 1-86 | Findings 001 and 006; candidate 007 rejected. |
| `features/step_definitions/shadow.steps.ts` | `cdd6d60699418e6031616170d421ac53563714a3` | 1-469 | Findings 002, 004, and 006. |

The opening accepted set is **001, 002, 004, 005, 006**: one BLOCKER and four
WARNINGs. Candidates 003 and 007 are rejected and do not count as open.
These findings concern test evidence or wording. No production defect or
production RED/GREEN result is claimed.

## Findings and triage

`B` means BLOCKER and `W` means WARNING. Locations identify the observed
commit and file line. The `open` dispositions below are the Round 0 state.

| ID | Requirement | Rule path and section | First round | Observed location | Severity | Disposition and reason | Regression, fix, and verification |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| CR-07-SHADOW-001 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `b621f0a:features/shadow/state-merging.feature:21-38` | B | open: the partial-heartbeat scenario asserts two of seven incoming fields. A merge that drops `hours_of_protection` still passes. | Add all five omitted incoming fields to the expected state. Show that a dropped field fails the scenario. |
| CR-07-SHADOW-002 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Feature description; `rules/steps.md` §Steps | 0 | `b621f0a:features/shadow/credential-rotation.feature:3-6,28`; `b621f0a:features/step_definitions/shadow.steps.ts:443-454` | W | open: the prose says the new secret signs the next handshake, but this Cucumber assertion compares only key ID and token. `test/cloud/shadow.test.ts:835-872` already checks the exact rotated signature, so the Cucumber claim must match its own assertion. | Narrow the prose and step name to the key and token. Keep the direct signature test unchanged. |
| CR-07-SHADOW-003 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong result | 0 | `b621f0a:features/shadow/connection-lifecycle.feature:14-24` | B candidate | rejected: these two scenarios claim a complete-shadow **request**, and their count assertions observe it. `test/cloud/shadow.test.ts:393-417,502-510,909-933` separately tests route subscriptions, order, and reconnect. A complete-response claim is outside these scenario titles. | No change; direct unit checks retain the missing-subscription guard. |
| CR-07-SHADOW-004 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | 0 | `b621f0a:features/step_definitions/shadow.steps.ts:1` | W | open: the file lacks the approved SPDX line and separate copyright JSDoc. | Add only the approved header; run focused Shadow scenarios and normal hooks. |
| CR-07-SHADOW-005 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `b621f0a:features/shadow/credential-rotation.feature:3-6` | W | open: the feature description has four lines; the rule permits two or three. | Shorten to three lines while preserving the observed behavior. |
| CR-07-SHADOW-006 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps; `.agents/skills/typescript-style/rules/comments.md` §Prose | 0 | `b621f0a:features/shadow/state-merging.feature:43,52-54`; `b621f0a:features/step_definitions/shadow.steps.ts:240-249` | W | open: the feature says the device publishes a requested value, but the step publishes a `get/accepted` reply from the shadow service. | Name the shadow service as actor in the feature, binding, and nearby comment. |
| CR-07-SHADOW-007 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps | 0 | `b621f0a:features/shadow/connection-lifecycle.feature:16-24`; `b621f0a:features/shadow/state-merging.feature:31-38` | W candidate | rejected: these scenarios review the plugin's shadow boundary. Broker handshakes and canonical snapshots are observable through local stand-ins and give a reader the exact recovery result. A separate monitoring feature covers the homeowner-facing condition. | No change to diagnostic outcome steps. |

## Correction rounds

Round 0 opening accepted count: **5**. A later independent complete-file
review records each correction equation:
`closing = opening - fixed - rejected + new + reopened`.
