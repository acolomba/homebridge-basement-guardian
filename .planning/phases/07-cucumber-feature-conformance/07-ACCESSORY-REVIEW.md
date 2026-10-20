# ACCESSORY complete-file review

This report covers the `code-review-sweep` ACCESSORY owner batch. Independent
reviewer `/root/phase7_plan03/accessory_review` read every line of each owned
file at commit `17d79f3eaa8e32efafb23dc5af44a405844d3177`. The reviewer
applied the Cucumber feature, step, layout, and stand-in rules, every applicable
TypeScript style rule, and the approved Phase 1 header form. The HAP fake and
scenario world were inspected as consumers; their files belong to other plans.

## Round 0 complete-file review

| Owned path | Reviewed blob | Contiguous lines | Result |
| --- | --- | ---: | --- |
| `features/accessory/discovery.feature` | `616ee68840dd8c1577be2fec05aa6f9f757da309` | 1-111 | 001-006 |
| `features/step_definitions/accessory.steps.ts` | `6dd4cac3f18cb2cf88bd521542b010d1b8b29b40` | 1-286 | 003, 007-010 |
| `features/lib/homebridgeApi.ts` | `3c5b840e017987d12a41b5185bfbf0f3f2e5c1d6` | 1-321 | 011-012, 014-015 |
| `features/lib/publishedServices.ts` | `50dce0a84088d709f1fec587b29cec31eabba0a1` | 1-97 | 011, 013, 016 |

Round 0 opening accepted set: **001-016 (16 IDs)**. All are review findings,
not confirmed production behavior bugs. No production RED/GREEN pair is claimed.
`B` means BLOCKER and `W` means WARNING. Every location below is qualified by
the reviewed commit above. The default baseline at this revision is 104
scenarios and 1,162 steps on Node v26.12.0; the earlier 1,156-step baseline
predates the ACCOUNT batch.

## Findings and triage

| ID | Requirement | Rule path and section | First round | Observed location | Severity | Disposition and reason | Regression, fix, verification |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| CR-07-ACCESSORY-001 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `17d79f3:features/accessory/discovery.feature:3-5` | W | repair committed; awaiting independent correction review. | `feceda8`: feature description names the local fake cloud; pre-commit and default Cucumber passed. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-002 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Background | 0 | `17d79f3:features/accessory/discovery.feature:9-11,19-23` | W | repair committed; awaiting independent correction review. | `5dea415`: HALO and Gemini setup scenarios passed; one redundant Given removed; 104 scenarios retained. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-003 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Data tables | 0 | `17d79f3:features/accessory/discovery.feature:10,20-23,42-43` | W | repair committed; awaiting independent correction review. | `1317634`: four focused discovery scenarios passed with lower-case headers; legacy aliases retained. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-004 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/accessory/discovery.feature:30-35` | B | repair committed; awaiting independent correction review. | `f9dec7a`: cached poll publishes level 3; stale-reading negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-005 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/accessory/discovery.feature:37-45` | B | repair committed; awaiting independent correction review. | `20c7c4e`: type-change scenario passed; false-active negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-006 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/accessory/discovery.feature:98-111` | B | repair committed; awaiting independent correction review. | `a7216c8`: invalid-telemetry scenario passed; false-trust negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-007 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, typed Given parser | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:64-90` | B | open: strict cells and headers are repaired; the parser-location rule still requires an owned `features/lib/` path. | `76d84c8`: unknown-header and blank-required-cell controls failed in Given; parser remains in the step module. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-008 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps; `AGENTS.md` §Identity | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:159-185` | B | repair committed; awaiting independent correction review. | `410e16c`: Gemini registration scenario passed; wrong-plugin negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-009 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:169-184` | B | repair committed; awaiting independent correction review. | `cc2e011`: Gemini registration scenario passed; omitted-service negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-010 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:247-257` | B | repair committed; awaiting independent correction review. | `cc5791a`: removal scenario passed; empty-removal negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-011 | FEAT-01 | `.agents/skills/cucumber/rules/world-and-stand-ins.md` §Fakes and drivers; `.agents/skills/cucumber/SKILL.md` §Review | 0 | `17d79f3:features/lib/publishedServices.ts:30-31`; `17d79f3:features/lib/homebridgeApi.ts:272-277` | B | repair committed; awaiting independent correction review. | `11b5e5f`: removal and rediscovery scenarios passed; historical-accessory control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-012 | FEAT-01 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source | 0 | `17d79f3:features/lib/homebridgeApi.ts:1` | W | repair committed; awaiting independent correction review. | `ee8fe1e`: header-only change passed normal commit hooks. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-013 | FEAT-01 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source | 0 | `17d79f3:features/lib/publishedServices.ts:1` | W | repair committed; awaiting independent correction review. | `d8f7cac`: header-only change passed normal commit hooks. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-014 | FEAT-01 | `.agents/skills/typescript-style/rules/comments.md` §Forbidden in comments and test titles | 0 | `17d79f3:features/lib/homebridgeApi.ts:107-112` | W | repair committed; awaiting independent correction review. | `b57f1d0`: present-tense cache comment passed normal commit hooks. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-015 | FEAT-01 | `.agents/skills/typescript-style/rules/classes.md` §Classes | 0 | `17d79f3:features/lib/homebridgeApi.ts:169-172` | W | repair committed; awaiting independent correction review. | `46c6adb`: constructor smoke check and normal commit hooks passed. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-016 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `AGENTS.md` §Identity | 0 | `17d79f3:features/lib/publishedServices.ts:46-55,83-84` | B | repair committed; awaiting independent correction review. | `62881fb`: direct two-same-name stand-in check throws on ambiguity; normal commit hooks passed. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |

Rejected candidates: `homebridgeApi.ts:132` holds a shared HAP namespace with no
per-scenario mutable state; `hap.ts:720-729` supports that reading. Multiple
`When` steps in the removal and recovery scenarios form one lifecycle behavior.
The world registers Homebridge temporary-directory cleanup at `world.ts:325-333`.
The Homebridge stand-in supplies the fake HAP namespace through `api.hap`, and
service assertions use the same namespace. None of those candidates violates
the cited rule.

## Correction rounds

Independent correction round 1 is pending. The repair author has not reviewed the
complete current files. Fifteen IDs have repair commits. ID 007 remains open:
the owned step module now rejects unknown headers, repeated fields, short
rows, blank required cells, and nonnumeric water levels, but
`.agents/skills/cucumber/rules/steps.md` places typed Given parsers in
`features/lib/`. The owner list has no suitable parser file, and the
coordinator prohibited adding an unlisted path without an exact-path plan
revision. The independent reviewer must assess every current file before a
closing count is recorded. Each round uses
`closing = opening - fixed - rejected + new + reopened`.

## Repair and verification ledger

All 16 accepted IDs were attempted in the shared feature-branch checkout.
Each source repair has one normal hooked commit, listed in the finding row.
The source files had no uncommitted changes after the final repair. No
production source was changed, so no production RED/GREEN pair applies.
Temporary negative controls changed only harness or feature bytes, failed at
the named assertion, and were restored before commit. IDs 004-006 and 008-011
have those controls in their finding rows. ID 007 rejected an unknown header
and a blank required name in its `Given` step. ID 016 rejected two live
accessories with the same vendor name in a direct stand-in check.

The scenario count stayed **104**. The explained step delta is **+8** from
the Round 0 baseline of 1,162: ID 002 removed one redundant `Given`; ID 004
added two steps; ID 005 added two steps; and ID 006 added five steps.
In the main checkout at `1317634` on Node v26.12.0,
`npm run test:cucumber` exited 0 with **104/104 scenarios and 1,170/1,170
steps**. `./node_modules/.bin/cucumber-js --dry-run --format usage` exited 0;
a separate search of that output found no `UNUSED`, undefined, or ambiguous
definitions. The default profile used local loopback stand-ins. The real
profile was not run. The first sandboxed loopback attempt failed with `EPERM`;
the authorized local loopback checks passed. The coordinator owns the combined
wave `npm run check` gate.
