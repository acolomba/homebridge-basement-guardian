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
| CR-07-HOMEKIT-001 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, whole-value assertions; `.agents/skills/cucumber/SKILL.md` §Review | 0 | `71be722:features/step_definitions/controls.steps.ts:123-130` | B | repaired, pending independent review: a PUT to the wrong device and extra body fields could pass the command assertion. | `822081b`: compares every non-GET request's method, device route, and whole JSON body; wrong-body and wrong-device controls failed the exact assertion. |
| CR-07-HOMEKIT-002 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `71be722:features/homekit/official-controls.feature:76-100` | B | repaired, pending independent review: both refused-command scenarios could pass if a local failure prevented the armed command reaching the vendor. | `8fb436b`: both scenarios assert one exact self-test command; a temporary local refusal with no vendor request failed at that assertion. |
| CR-07-HOMEKIT-003 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps, whole-value assertions | 0 | `71be722:features/step_definitions/homekit.steps.ts:51-53,78-83,127-134`; `71be722:features/step_definitions/controls.steps.ts:223-229` | B | repaired, pending independent review: a pushed value could remain correct while HAP refused the controller read. | `139eea2`: checks the pushed gate and exact `handleGetRequest()` result for named values, alarms, and control switches; refused-read controls failed in both step modules. |
| CR-07-HOMEKIT-004 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/features.md` §Scenarios | 0 | `71be722:features/homekit/official-controls.feature:173-190` | B | repaired, pending independent review: the “no valid state” title was not proved by the prior quiet-live setup. | `3f29c5f`: invalid `test_running` arrives while the live path is available; the scenario asserts the exact no-fresh-state cause. A substituted quiet-live warning failed that assertion. |
| CR-07-HOMEKIT-005 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps, order | 0 | `71be722:features/homekit/official-controls.feature:215` | W | repaired, pending independent review: a `Given` followed `When the plugin starts`. | `bf4a88d`: a registered `When` makes the vendor start failing after plugin startup; focused scenario passed. |
| CR-07-HOMEKIT-006 | FEAT-01 | `.agents/skills/typescript-style/rules/comments.md` §Forbidden in comments and test titles | 0 | `71be722:features/homekit/official-controls.feature:173-181` | W | **rejected**: this rule governs TypeScript comments and test titles, not Gherkin comments; the cited process-history ban cannot be extended to `.feature` by implication. | No repair under this rule. The scenario's unproved claim is tracked separately as 004. |
| CR-07-HOMEKIT-007 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Scenarios and §Steps | 0 | `71be722:features/homekit/official-controls.feature:162-164`; `71be722:features/homekit/safety-state.feature:42-44` | W | repaired, pending independent review: a pre-start vendor state was expressed as a first `When`. | `588e350`: registered `Given` steps seed both pre-start states; two focused scenarios passed. |
| CR-07-HOMEKIT-008 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `71be722:features/homekit/official-controls.feature:3-14` | W | repaired, pending independent review: the description exceeded three lines and obscured the stand-in boundary. | `704a402`: three-line behavior and fake-vendor description; focused alarm-mute scenario passed. |
| CR-07-HOMEKIT-009 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `71be722:features/homekit/safety-state.feature:3-6` | W | repaired, pending independent review: the description occupied four lines and did not name the local stand-in. | `2df7337`: three-line safety-state and fake-vendor description; focused mains-power scenario passed. |

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
Independent complete-file re-review is pending; this repair record does not
claim a closing finding count.
