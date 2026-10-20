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
commit and file line. Dispositions below include accepted repairs and Round 1 triage.

| ID | Requirement | Rule path and section | First round | Observed location | Severity | Disposition and reason | Regression, fix, and verification |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| CR-07-SHADOW-001 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `b621f0a:features/shadow/state-merging.feature:21-38` | B | fixed: the partial-heartbeat scenario asserts two of seven incoming fields. A merge that drops `hours_of_protection` still passes. | Add all five omitted incoming fields to the expected state. Show that a dropped field fails the scenario. Fix `735e0e0`. All seven incoming fields are asserted; the focused scenario passed 1/1. A temporary expected `hours_of_protection=13` failed at the snapshot assertion (exit 1), then was restored. |
| CR-07-SHADOW-002 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Feature description; `rules/steps.md` §Steps | 0 | `b621f0a:features/shadow/credential-rotation.feature:3-6,28`; `b621f0a:features/step_definitions/shadow.steps.ts:443-454` | W | fixed: the prose says the new secret signs the next handshake, but this Cucumber assertion compares only key ID and token. `test/cloud/shadow.test.ts:835-872` already checks the exact rotated signature, so the Cucumber claim must match its own assertion. | Narrow the prose and step name to the key and token. Keep the direct signature test unchanged. Fix `0b74845`. The feature and binding name key and token; the focused rotation scenario passed 1/1. Signature coverage remains in the direct unit test. |
| CR-07-SHADOW-003 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong result | 0 | `b621f0a:features/shadow/connection-lifecycle.feature:14-24` | B candidate | rejected: these two scenarios claim a complete-shadow **request**, and their count assertions observe it. `test/cloud/shadow.test.ts:393-417,502-510,909-933` separately tests route subscriptions, order, and reconnect. A complete-response claim is outside these scenario titles. | No change; direct unit checks retain the missing-subscription guard. |
| CR-07-SHADOW-004 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | 0 | `b621f0a:features/step_definitions/shadow.steps.ts:1` | W | fixed: the file lacks the approved SPDX line and separate copyright JSDoc. | Add only the approved header; run focused Shadow scenarios and normal hooks. Fix `deaa9ea`. The approved header was added; normal hooks passed. Default Cucumber passed 104/104 at `8498d21`. |
| CR-07-SHADOW-005 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `b621f0a:features/shadow/credential-rotation.feature:3-6` | W | fixed: the feature description has four lines; the rule permits two or three. | Shorten to three lines while preserving the observed behavior. Fix `a852a59`. The description became three lines; normal hooks passed. Default Cucumber passed 104/104 at `8498d21`. |
| CR-07-SHADOW-006 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps; `.agents/skills/typescript-style/rules/comments.md` §Prose | 0 | `b621f0a:features/shadow/state-merging.feature:43,52-54`; `b621f0a:features/step_definitions/shadow.steps.ts:240-249` | W | fixed: the feature says the device publishes a requested value, but the step publishes a `get/accepted` reply from the shadow service. | Name the shadow service as actor in the feature, binding, and nearby comment. Fix `8498d21`. The feature, comment, and binding name the shadow service; the focused requested-value scenario passed 1/1 and default Cucumber passed 104/104. |
| CR-07-SHADOW-007 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps | 0 | `b621f0a:features/shadow/connection-lifecycle.feature:16-24`; `b621f0a:features/shadow/state-merging.feature:31-38` | W candidate | rejected: these scenarios review the plugin's shadow boundary. Broker handshakes and canonical snapshots are observable through local stand-ins and give a reader the exact recovery result. A separate monitoring feature covers the homeowner-facing condition. The maintainer explicitly chose to keep these diagnostic outcomes during Round 1. | No change to diagnostic outcome steps. |
| CR-07-SHADOW-008 | FEAT-02 | `.agents/skills/cucumber/rules/steps.md` §Steps; `rules/features.md` §Data tables | 1 | `8498d21:features/step_definitions/shadow.steps.ts:317-325`; `8498d21:features/shadow/state-merging.feature:31-43` | B | fixed: the partial snapshot matcher accepted extra canonical fields even after all expected rows were listed. | Fix `68d7784`: the full-record scenario uses exact deep equality. Focused scenario passed 1/1; temporarily omitting expected `wifi_signal_dbm` failed on the unexpected actual field (exit 1), then was restored. |
| CR-07-SHADOW-009 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | 1 | `8498d21:features/shadow/connection-lifecycle.feature:3-5`; `8498d21:features/shadow/credential-rotation.feature:3-5`; `8498d21:features/shadow/state-merging.feature:3-5` | W | fixed: the descriptions did not identify the fake cloud and broker standing in for vendor services. | Fix `016b206`: all three descriptions now name the stand-ins; normal hooks passed. |
| CR-07-SHADOW-010 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Data tables | 1 | `8498d21:features/shadow/state-merging.feature:32-43` | W | fixed: the newly added rows had a different second-column boundary. | Fix `b1977f2`: all twelve expected rows align; normal hooks passed. |

## Correction rounds

Round 0 opening accepted count: **5**. Correction counts use
`closing = opening - fixed - rejected + new + reopened`.

### Round 1

Independent reviewer `/root/phase7_shadow_round1` read every owned file at
`8498d2171e77afbf19bf5800134b835a4bf70283`. This was a complete-file
review, not a diff-only inspection.

| Owned path | Reviewed blob | Contiguous lines | Result |
| --- | --- | ---: | --- |
| `features/shadow/connection-lifecycle.feature` | `4c23223604c9ea42d3574cc35dd82202bc8fc80b` | 1-50 | Finding 009; candidate 007 reaffirmed as rejected by maintainer. |
| `features/shadow/credential-rotation.feature` | `d195353e664dc1a130607a2f8f11b9bc5e3737c5` | 1-28 | Finding 009; accepted 002 and 005 fixed. |
| `features/shadow/state-merging.feature` | `9aafdb0d3dd55acef573efc20586a7334352ec0c` | 1-91 | Findings 008, 009, 010; accepted 001 and 006 fixed. |
| `features/step_definitions/shadow.steps.ts` | `7a903f57d1229c5dd5d86690a74f8c863c05355d` | 1-475 | Finding 008; accepted 002, 004, and 006 fixed. |

Opening 5 (001, 002, 004, 005, 006) - fixed 5 - rejected 0 + new 3
(008, 009, 010) + reopened 0 = **closing 3**. Findings 003 and 007 remain
rejected; the maintainer explicitly retained diagnostic outcome steps for 007.
The count fell, so the protocol permits one more correction round. No
production file changed. Every fix commit passed normal hooks. At `8498d21`,
`npm run test:cucumber` passed 104/104 scenarios and 1,174/1,174 steps; the
full `npm run check` passed, including 43 direct coverage pairs, on Node
`v26.12.0`. Later source edits require a fresh full gate.
