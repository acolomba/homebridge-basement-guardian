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
| CR-07-HOMEKIT-001 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, whole-value assertions; `.agents/skills/cucumber/SKILL.md` §Review | 0 | `71be722:features/step_definitions/controls.steps.ts:123-130` | B | open: a PUT to the wrong device and extra body fields can pass the command assertion. | Pending exact route, method, and complete JSON body assertion and wrong-result control. |
| CR-07-HOMEKIT-002 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `71be722:features/homekit/official-controls.feature:76-100` | B | open: both refused-command scenarios can pass if a local failure prevents the armed command reaching the vendor. | Pending exact command assertion in each scenario and wrong-result control. |
| CR-07-HOMEKIT-003 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps, whole-value assertions | 0 | `71be722:features/step_definitions/homekit.steps.ts:51-53,78-83,127-134`; `71be722:features/step_definitions/controls.steps.ts:223-229` | B | open: a pushed value can remain correct while HAP refuses the actual controller read. | Pending pushed-value gate plus exact `handleGetRequest()` outcome and wrong-result control. |
| CR-07-HOMEKIT-004 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/features.md` §Scenarios | 0 | `71be722:features/homekit/official-controls.feature:173-190` | B | open: the “no valid state” title is not proved; live silence is the only cause and the scenario asserts only a shared refusal status. | Pending distinct invalid-state setup and cause assertion, or an exact explained scenario reconciliation. |
| CR-07-HOMEKIT-005 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps, order | 0 | `71be722:features/homekit/official-controls.feature:215` | W | open: a `Given` follows `When the plugin starts`. | Pending action-wording repair preserving post-start transport failure. |
| CR-07-HOMEKIT-006 | FEAT-01 | `.agents/skills/typescript-style/rules/comments.md` §Forbidden in comments and test titles | 0 | `71be722:features/homekit/official-controls.feature:173-181` | W | **rejected**: this rule governs TypeScript comments and test titles, not Gherkin comments; the cited process-history ban cannot be extended to `.feature` by implication. | No repair under this rule. The scenario's unproved claim is tracked separately as 004. |
| CR-07-HOMEKIT-007 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Scenarios and §Steps | 0 | `71be722:features/homekit/official-controls.feature:162-164`; `71be722:features/homekit/safety-state.feature:42-44` | W | open: a pre-start vendor state is expressed as a first `When`, followed by a second `When` for plugin startup. | Pending precondition wording using a registered `Given`; focused scenarios must retain their result. |
| CR-07-HOMEKIT-008 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `71be722:features/homekit/official-controls.feature:3-14` | W | open: the description exceeds the required two or three lines and obscures the stand-in boundary. | Pending concise description naming behavior and fake vendor. |
| CR-07-HOMEKIT-009 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `71be722:features/homekit/safety-state.feature:3-6` | W | open: the description occupies four lines and does not name the local stand-in. | Pending two or three lines naming behavior and fake vendor. |

No source repair preceded this triage. The default profile's phase-start count
was 104 scenarios and 1,156 steps. Earlier ACCOUNT and ACCESSORY batches have
documented step-count changes; this batch will record its own exact delta.
