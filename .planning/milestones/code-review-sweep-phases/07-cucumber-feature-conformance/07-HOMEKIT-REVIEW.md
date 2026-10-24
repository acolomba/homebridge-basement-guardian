# HOMEKIT complete-file review

This report covers the `code-review-sweep` HOMEKIT owner batch. Independent
reviewer `/root/phase7_plan04/homekit_reviewer` read every line of each owned
file at commit `71be722f274419f5fe9fec5b639a366407ec5330`. The review used
the Cucumber feature, step, layout, and stand-in rules, applicable TypeScript
style rules, and the Phase 1 header form. The shared HAP fake, vendor stand-in,
scenario world, and registered cross-owner steps were inspected as consumers.
Both owned TypeScript files already have the approved header.

## Round 0 complete-file review

| Owned path | Reviewed blob | Contiguous lines | Result |
| --- | --- | ---: | --- |
| `features/homekit/official-controls.feature` | `0253457decced7024bdd4d91f2ea03da88969182` | 1-219 | 002, 004-006, 007-008 |
| `features/homekit/safety-state.feature` | `5e1dbd0013ba6b5c43dc9e2de50f9d0501aa1a15` | 1-153 | 007, 009 |
| `features/step_definitions/controls.steps.ts` | `e1791e9b77eaca43519390d4cf46ab678ccc702e` | 1-316 | 001, 003 |
| `features/step_definitions/homekit.steps.ts` | `e94c9ce2ba92b8af01f1e4245efa3d4c34911170` | 1-256 | 003 |

Round 0 opening accepted set: **001-005 and 007-009 (8 IDs)**. These are
review findings; none is classified as a confirmed production behavior bug.
No production RED/GREEN pair is claimed. `B` means BLOCKER and `W` means
WARNING. Locations below are qualified by the reviewed commit above.

## Findings and triage

| ID | Requirement | Exact rule and section | First round | Observed location | Severity | Disposition and reason | Regression, fix, verification |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| CR-07-HOMEKIT-001 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, whole-value assertions; `.agents/skills/cucumber/SKILL.md` §Review | 0 | `71be722:features/step_definitions/controls.steps.ts:123-130` | B | fixed in Round 1: a PUT to the wrong device and extra body fields could pass the command assertion. | `822081b`: compares every non-GET request's method, device route, and whole JSON body; wrong-body and wrong-device controls failed the exact assertion. |
| CR-07-HOMEKIT-002 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `71be722:features/homekit/official-controls.feature:76-100` | B | fixed in Round 1: both refused-command scenarios could pass if a local failure prevented the armed command reaching the vendor. | `8fb436b`: both scenarios assert one exact self-test command; a temporary local refusal with no vendor request failed at that assertion. |
| CR-07-HOMEKIT-003 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps, whole-value assertions | 0 | `71be722:features/step_definitions/homekit.steps.ts:51-53,78-83,127-134`; `71be722:features/step_definitions/controls.steps.ts:223-229` | B | fixed in Round 1: a pushed value could remain correct while HAP refused the controller read. | `139eea2`: checks the pushed gate and exact `handleGetRequest()` result for named values, alarms, and control switches; refused-read controls failed in both step modules. |
| CR-07-HOMEKIT-004 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/features.md` §Scenarios | 0 | `71be722:features/homekit/official-controls.feature:173-190` | B | fixed in Round 1: the “no valid state” title was not proved by the prior quiet-live setup. | `3f29c5f`: invalid `test_running` arrives while the live path is available; the scenario asserts the exact no-fresh-state cause. A substituted quiet-live warning failed that assertion. |
| CR-07-HOMEKIT-005 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps, order | 0 | `71be722:features/homekit/official-controls.feature:215` | W | fixed in Round 1: a `Given` followed `When the plugin starts`. | `bf4a88d`: a registered `When` makes the vendor start failing after plugin startup; focused scenario passed. |
| CR-07-HOMEKIT-006 | FEAT-01 | `.agents/skills/typescript-style/rules/comments.md` §Forbidden in comments and test titles | 0 | `71be722:features/homekit/official-controls.feature:173-181` | W | **rejected**: this rule governs TypeScript comments and test titles, not Gherkin comments; the cited process-history ban cannot be extended to `.feature` by implication. | No repair under this rule. The scenario's unproved claim is tracked separately as 004. |
| CR-07-HOMEKIT-007 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Scenarios and §Steps | 0 | `71be722:features/homekit/official-controls.feature:162-164`; `71be722:features/homekit/safety-state.feature:42-44` | W | fixed in Round 1: a pre-start vendor state was expressed as a first `When`. | `588e350`: registered `Given` steps seed both pre-start states; two focused scenarios passed. |
| CR-07-HOMEKIT-008 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `71be722:features/homekit/official-controls.feature:3-14` | W | fixed in Round 1: the description exceeded three lines and obscured the stand-in boundary. | `704a402`: three-line behavior and fake-vendor description; focused alarm-mute scenario passed. |
| CR-07-HOMEKIT-009 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `71be722:features/homekit/safety-state.feature:3-6` | W | fixed in Round 1: the description has three lines and names the fake vendor. | `2df7337`: focused mains-power scenario passed. |
| CR-07-HOMEKIT-010 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps, whole-value assertions | 1 | `f74b3d4:features/step_definitions/controls.steps.ts:255-261` | B | fixed in Round 2: the no-command step checks all non-GET requests. | `4a3c0f6`: temporary POST and PATCH records each failed at the assertion. |
| CR-07-HOMEKIT-011 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/features.md` §Scenarios | 1 | `f74b3d4:features/homekit/official-controls.feature:98-112` | B | fixed in Round 2: the timeout scenario checks command count after the pending window and reads exact switch state. | `c0c97fd`: post-window synthetic second PUT failed the one-command assertion; switch read and `On=false` passed. |
| CR-07-HOMEKIT-012 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Scenarios, behavior title | 1 | `f74b3d4:features/homekit/safety-state.feature:37,45-47` | W | fixed in Round 2: the title names only the absent pit services. | `25d5f46`: focused pit-service scenario passed and still required Sump Mains Power. |
| CR-07-HOMEKIT-013 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/features.md` §Scenarios | 2 | `a14e30e:features/homekit/safety-state.feature:92-112` | B | fixed in Round 3: the partial-heartbeat scenario checks both omitted control trust scopes. | `ed93d5b`: exact post-heartbeat `Status Active=true` and `On=false` reads for System Self-Test and Alarm Mute; false trust values for each scope separately failed at its assertion. |
| CR-07-HOMEKIT-014 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, whole-value assertions; `.agents/skills/cucumber/SKILL.md` §Review | 3 | `d6fc7f2:features/step_definitions/controls.steps.ts:115-121` | B | **open at Round 3 STOP**: the command assertion compares only URL pathname and ignores query parameters in the recorded vendor request. A command to `/devices/{id}/data?dryRun=1` could pass although the measured contract has no query. | No repair attempted after STOP. The next authorized correction must compare the full raw request path against the exact expected path and demonstrate the wrong-query control fails. |

No source repair preceded this triage. The default profile's phase-start count
was 104 scenarios and 1,156 steps. Earlier ACCOUNT and ACCESSORY batches have
documented step-count changes.

## Round 0 repair evidence

All eight accepted causes have a separate hook-passing Conventional Commit.
No production file changed, and no production behavior bug was diagnosed.
Each temporary wrong-result control changed an owned step module only and was
removed before commit. The default profile ran offline with fake cloud services.

| ID | Commit | Focused check and active control | Scenario delta | Step delta |
| --- | --- | --- | ---: | ---: |
| 001 | `822081b` | Self-test and alarm-mute commands passed; extra JSON field and wrong device path each failed the exact request assertion. | 0 | 0 |
| 002 | `8fb436b` | Both refused-command scenarios passed; a synthetic local communication refusal without a request failed at the new vendor-command assertion. | 0 | +2 |
| 003 | `139eea2` | Four named value, alarm, and switch scenarios passed; HAP read refusal with the correct pushed value failed in each owned step module. | 0 | 0 |
| 004 | `3f29c5f` | Invalid-state scenario passed; substituting the quiet-live warning failed the cause assertion. | 0 | +3 |
| 005 | `bf4a88d` | No-command-transport scenario passed after the post-start vendor failure. | 0 | 0 |
| 007 | `588e350` | Both pre-start-state scenarios passed using registered `Given` steps. | 0 | 0 |
| 008 | `704a402` | Alarm-mute scenario passed with the concise feature description. | 0 | 0 |
| 009 | `2df7337` | Mains-power scenario passed with the concise feature description. | 0 | 0 |

The HOMEKIT repair set adds **0 scenarios and 5 steps**. The phase-start
baseline was 104 scenarios and 1,156 steps. Four steps added by earlier
ACCOUNT and ACCESSORY batches made the pre-002 combined tree 104/1,160.
After 002 and 004, `npm run test:cucumber` passed on
`3f29c5f853dc77872925161c594ac289f78a69cc` with **104 scenarios and
1,165 steps**, all passed. It included `npm run build:test` before Cucumber.
The command exited 0 on Node `v26.12.0` on 2026-10-20. Its input was a clean
Git tree with no untracked files. Every individual commit passed the normal
commit hook, and each source change passed `fallow audit --base HEAD` before
its commit. The Cucumber run happened in the main shared checkout.

## Correction rounds

### Round 1

Independent reviewer `/root/phase7_plan04/homekit_round1_reviewer` read every
line at commit `f74b3d48048664d0d7506eb72a3eab0a3709b014`, after all
eight separate correction commits. This was a complete-file review, not a
diff-only inspection.

| Owned path | Reviewed blob | Contiguous lines |
| --- | --- | ---: |
| `features/homekit/official-controls.feature` | `8901e53c0832de68949b025adabc3b5c80bade4e` | 1-209 |
| `features/homekit/safety-state.feature` | `b67640b30d943271f8cbb2223ea83b819d0413cd` | 1-153 |
| `features/step_definitions/controls.steps.ts` | `61d6c8d6dd75d9b9de2291ddc2fee27f8141c116` | 1-319 |
| `features/step_definitions/homekit.steps.ts` | `958b06c58b03d5d21f575b20f0e8b61067cbbd79` | 1-275 |

Opening **8** (001-005, 007-009); fixed **8** (001-005, 007-009);
rejected **0**; new **3** (010-012); reopened **0**; closing **3**
(010-012). Equation: `8 - 8 - 0 + 3 + 0 = 3`. The count fell and no fixed
ID reopened, so correction round 2 is permitted. ID 006 was rejected in
Round 0 and is not part of this opening set. The default usage dry run at
`f74b3d4` exited 0 with no `UNUSED`, undefined, or ambiguous definition.

### Round 2 repairs

The three Round 1 findings each have a separate hook-passing Conventional
Commit. No production source changed. Temporary wrong-result controls changed
only the owned controls step module and were removed before the commits.

| ID | Commit | Focused check and active control | Scenario delta | Step delta |
| --- | --- | --- | ---: | ---: |
| 010 | `4a3c0f6` | Two no-command scenarios passed; synthetic POST and PATCH records each failed the assertion. | 0 | 0 |
| 011 | `c0c97fd` | Timeout scenario passed 19 steps. A second PUT after the pending-window advance failed at the new post-window command count. The switch answered a read and reported exact `On=false`. | 0 | +3 |
| 012 | `25d5f46` | Renamed pit-service scenario passed nine steps and still required Sump Mains Power to publish. | 0 | 0 |

Round 2 adds **0 scenarios and 3 steps**. The combined HOMEKIT change from
the phase-start baseline is 0 scenarios and 8 steps. `npm run test:cucumber`
passed at clean commit `25d5f46a3ce7630368c2ff4fc5e14277435f680d`
with **104 scenarios and 1,168 steps**, all passed. The command compiled with
`npm run build:test` before it ran Cucumber. It exited 0 on Node `v26.12.0`
on 2026-10-20. The Git tree had no diff or untracked file at that run. Each
commit passed the normal hook and a preceding `fallow audit --base HEAD`.
Verification ran in the main shared checkout.

### Round 2

Independent reviewer `/root/phase7_plan04/homekit_round2_reviewer` read all
current owned files from line 1 to the final line at commit
`a14e30e60c163b02bcb65dab39fd865be0d0e77f`.

| Owned path | Reviewed blob | Contiguous lines |
| --- | --- | ---: |
| `features/homekit/official-controls.feature` | `f79c1bbbd523a45f68becddd7803399f0e461882` | 1-212 |
| `features/homekit/safety-state.feature` | `bdd6a7f4edfc81ac4d1ba2b2aff6b8560934c636` | 1-153 |
| `features/step_definitions/controls.steps.ts` | `409cec6b482daa009610906e88a52b945239a772` | 1-319 |
| `features/step_definitions/homekit.steps.ts` | `958b06c58b03d5d21f575b20f0e8b61067cbbd79` | 1-275 |

Opening **3** (010-012); fixed **3** (010-012); rejected **0**; new **1**
(013); reopened **0**; closing **1** (013). Equation:
`3 - 3 - 0 + 1 + 0 = 1`. The count fell and no previously fixed finding
reopened, so correction round 3 is permitted. The reviewer found no other
accepted cause in the complete current owned files.

### Round 3 repairs

| ID | Commit | Focused check and active control | Scenario delta | Step delta |
| --- | --- | --- | ---: | ---: |
| 013 | `ed93d5b` | Partial-heartbeat scenario passed 23 steps. A temporary `Status Active=false` value for System Self-Test failed at its exact trust assertion; the same independent control for Alarm Mute failed at its exact trust assertion. Both controls were removed before commit. | 0 | +6 |

The two control switches each have a baseline `On=false` precheck, followed by
post-heartbeat `Status Active=true` and `On=false` assertions. The registered
whole-value step checks both the pushed value and the exact HAP controller
read. Round 3 adds **0 scenarios and 6 steps**. The combined HOMEKIT change
from the phase-start baseline is 0 scenarios and 14 steps. No production file
changed. `npm run build:test` and the focused scenario passed after the controls
were removed. `npm run test:cucumber` compiled first and passed at clean commit
`ed93d5b58fe1c253c57c67c88045bdd46c127763` with **104 scenarios and 1,174
steps**, all passed. It exited 0 on Node `v26.12.0` on 2026-10-20 in the main
shared checkout. The source commit passed the normal hook and preceding
`fallow audit --base HEAD`.

### Round 3 — STOP

Independent reviewer `/root/phase7_plan04/homekit_round3_reviewer` read every
owned file completely at commit `d6fc7f2e299debabab76f55602a9bb7005cef4e1`.

| Owned path | Reviewed blob | Contiguous lines |
| --- | --- | ---: |
| `features/homekit/official-controls.feature` | `f79c1bbbd523a45f68becddd7803399f0e461882` | 1-212 |
| `features/homekit/safety-state.feature` | `d86cc7bc67caef9df73caa5e53eb242a14a7c243` | 1-159 |
| `features/step_definitions/controls.steps.ts` | `409cec6b482daa009610906e88a52b945239a772` | 1-319 |
| `features/step_definitions/homekit.steps.ts` | `958b06c58b03d5d21f575b20f0e8b61067cbbd79` | 1-275 |

Opening **1** (013); fixed **1** (013); rejected **0**; new **1** (014);
reopened **0**; closing **1** (014). Equation: `1 - 1 - 0 + 1 + 0 = 1`.
The positive open count did not fall, so the batch **STOPs now**. No Round 4
repair or review is permitted in this run. The source stays at the reviewed
revision. The reviewer found no other accepted cause in the complete files.

The final default profile passed **104 scenarios and 1,174 steps** on clean
source commit `ed93d5b` with Node `v26.12.0`. After that compilation, the
default usage dry run exited 0 and its complete output had no `UNUSED`,
undefined, or ambiguous step definition. No real-profile step ran. The
coordinator owns the combined-wave `npm run check` gate. FEAT-01 remains
unproven by this batch while 014 is open.
