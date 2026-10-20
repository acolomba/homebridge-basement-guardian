# ACCOUNT complete-file review

This report covers the `code-review-sweep` ACCOUNT owner batch. The independent
reviewer was `/root/phase7_plan02/account_review`. The reviewer read every line
of each committed file at `e3af8dda5294a5933b55c097e3d8e749ee70725a`,
including comments, step registrations, assertions, and scenario text. The
review used the Cucumber feature, step, layout, and stand-in rules; the
TypeScript style rules; and the approved header form in `07-REVIEW-PROTOCOL.md`.

## Round 0 complete-file review

| Owned path | Reviewed blob | Contiguous lines | Result |
| --- | --- | ---: | --- |
| `features/account/configuration.feature` | `631f8aaa331fa0a515f60d6f98c00cbdf83f0688` | 1-45 | Finding 008. |
| `features/account/sign-in.feature` | `7976acdf1a3d74ec152a45c14f7225d2a4c4acb0` | 1-48 | Findings 001-004 and 006-007. |
| `features/step_definitions/account.steps.ts` | `0f7922e51215818ae7a30b62239071332a8441f2` | 1-188 | Findings 001-004 and 006-007. Header and remaining TypeScript rules clean. |
| `features/step_definitions/configuration.steps.ts` | `e033c7c4049ab64cb8c92ed80613033814218b9e` | 1-88 | Finding 005; candidate 009 rejected. |

The reviewer compared scenario claims with the local Auth0 and REST stand-ins,
the per-scenario world, registered step text, and the current production
contract. No live account or real profile step ran. The default baseline is
104 scenarios and 1,156 steps at `e3af8dd`.

## Findings and triage

`B` means BLOCKER and `W` means WARNING. Every location includes the observed
commit. The opening accepted set is 001-008 (8 IDs); 009 is a rejected review
candidate and is not counted open. A scenario assertion gap is a review finding,
not an observed production bug. No production RED/GREEN pair is claimed here.

| ID | Requirement | Rule path and section | First round | Observed location | Severity | Disposition and reason | Regression / fix / verification |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| CR-07-ACCOUNT-001 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation | 0 | `e3af8dd:features/account/sign-in.feature:26`; `e3af8dd:features/step_definitions/account.steps.ts:162` | B | open: one observed refusal does not establish that authentication stays stopped; a later retry could extend the vendor block. | Pending controlled retry proof; no production bug established. |
| CR-07-ACCOUNT-002 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation | 0 | `e3af8dd:features/account/sign-in.feature:35`; `e3af8dd:features/step_definitions/account.steps.ts:168` | B | open: one 429 and its warning do not establish that authentication waits and retries; a permanent stop passes. | Pending controlled retry proof; no production bug established. |
| CR-07-ACCOUNT-003 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation; `rules/steps.md` §Steps | 0 | `e3af8dd:features/account/sign-in.feature:19`; `e3af8dd:features/step_definitions/account.steps.ts:127` | B | open: a restart that does no discovery can keep the cumulative token count at one. | Pending restart REST and authorization assertion. |
| CR-07-ACCOUNT-004 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, suite must not leak; `AGENTS.md` §Project privacy | 0 | `e3af8dd:features/account/sign-in.feature:26`; `e3af8dd:features/step_definitions/account.steps.ts:162` | B | open: refusal and throttle scenarios accept the expected log line even if other lines leak credentials. | Pending failure-path privacy steps. |
| CR-07-ACCOUNT-005 | FEAT-01 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | 0 | `e3af8dd:features/step_definitions/configuration.steps.ts:1` | W | open: missing SPDX line and separate copyright block. | Pending style-only header commit. |
| CR-07-ACCOUNT-006 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Steps, describe the actual precondition | 0 | `e3af8dd:features/account/sign-in.feature:16`; `e3af8dd:features/step_definitions/account.steps.ts:148` | W | open: the scenario never configures an account; the world supplies the fixture account. | Pending wording and registered-step alignment. |
| CR-07-ACCOUNT-007 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, suite must not leak; `AGENTS.md` §Project privacy | 0 | `e3af8dd:features/account/sign-in.feature:42`; `e3af8dd:features/step_definitions/account.steps.ts:174` | B | open: the no-credential assertion omits the account email identifier. | Pending whole-value privacy assertion. |
| CR-07-ACCOUNT-008 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation | 0 | `e3af8dd:features/account/configuration.feature:16` | B | open: three invalid-config cases omit the existing no-accessory assertion although each says the plugin starts nothing. | Pending three scenario assertions. |
| CR-07-ACCOUNT-009 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, typed data-table parser | 0 | `e3af8dd:features/step_definitions/configuration.steps.ts:27` | W | rejected: this is a two-cell settings map, not a table with field columns. Omitted keys are intentional test input for configuration rejection. The cited unknown-column rule does not apply. | No change. |

## Correction rounds

Round 0 opening accepted count: **8**. Corrections and independent full-file
rounds follow below. For each correction round:
`closing = opening - fixed - rejected + new + reopened`.
