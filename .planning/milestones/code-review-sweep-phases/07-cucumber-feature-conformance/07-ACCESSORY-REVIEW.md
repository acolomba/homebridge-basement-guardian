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
| CR-07-ACCESSORY-001 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `17d79f3:features/accessory/discovery.feature:3-5` | W | fixed in Round 1: independent full-file review accepted the repair. | `feceda8`: feature description names the local fake cloud; pre-commit and default Cucumber passed. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-002 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Background | 0 | `17d79f3:features/accessory/discovery.feature:9-11,19-23` | W | fixed in Round 1: independent full-file review accepted the repair. | `5dea415`: HALO and Gemini setup scenarios passed; one redundant Given removed; 104 scenarios retained. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-003 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Data tables | 0 | `17d79f3:features/accessory/discovery.feature:10,20-23,42-43` | W | fixed in Round 1: independent full-file review accepted the repair. | `1317634`: four focused discovery scenarios passed with lower-case headers; legacy aliases retained. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-004 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/accessory/discovery.feature:30-35` | B | fixed in Round 1: independent full-file review accepted the repair. | `f9dec7a`: cached poll publishes level 3; stale-reading negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-005 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/accessory/discovery.feature:37-45` | B | fixed in Round 1: independent full-file review accepted the repair. | `20c7c4e`: type-change scenario passed; false-active negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-006 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/accessory/discovery.feature:98-111` | B | fixed in Round 1: independent full-file review accepted the repair. | `a7216c8`: invalid-telemetry scenario passed; false-trust negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-007 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, typed Given parser | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:64-90` | W | open: strict cells and headers are repaired; the parser-location rule still requires an owned `features/lib/` path. Round 1 corrected severity from BLOCKER to WARNING because only the structural location remains. | `76d84c8`: unknown-header and blank-required-cell controls failed in Given; parser remains in the step module. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-008 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps; `AGENTS.md` §Identity | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:159-185` | B | fixed in Round 1: independent full-file review accepted the repair. | `410e16c`: Gemini registration scenario passed; wrong-plugin negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-009 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:169-184`; reopened at `8c24e10:features/step_definitions/accessory.steps.ts:268-276` | B | **open at Round 2 STOP**: expected service triples come from production `createServiceCatalogue`, which also drives publication. Changing a row's subtype or display name moves both sides together and passes despite wrong HomeKit identity. | `cc2e011` caught an omitted service, but did not establish an independent oracle for service identities. Requires independently declared expected display-name, UUID, and subtype triples. |
| CR-07-ACCESSORY-010 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:247-257` | B | fixed in Round 1: independent full-file review accepted the repair. | `cc5791a`: removal scenario passed; empty-removal negative control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-011 | FEAT-01 | `.agents/skills/cucumber/rules/world-and-stand-ins.md` §Fakes and drivers; `.agents/skills/cucumber/SKILL.md` §Review | 0 | `17d79f3:features/lib/publishedServices.ts:30-31`; `17d79f3:features/lib/homebridgeApi.ts:272-277` | B | fixed in Round 1: independent full-file review accepted the repair. | `11b5e5f`: removal and rediscovery scenarios passed; historical-accessory control failed at the intended Then. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-012 | FEAT-01 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source | 0 | `17d79f3:features/lib/homebridgeApi.ts:1` | W | fixed in Round 1: independent full-file review accepted the repair. | `ee8fe1e`: header-only change passed normal commit hooks. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-013 | FEAT-01 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source | 0 | `17d79f3:features/lib/publishedServices.ts:1` | W | fixed in Round 1: independent full-file review accepted the repair. | `d8f7cac`: header-only change passed normal commit hooks. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-014 | FEAT-01 | `.agents/skills/typescript-style/rules/comments.md` §Forbidden in comments and test titles | 0 | `17d79f3:features/lib/homebridgeApi.ts:107-112` | W | fixed in Round 1: independent full-file review accepted the repair. | `b57f1d0`: present-tense cache comment passed normal commit hooks. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-015 | FEAT-01 | `.agents/skills/typescript-style/rules/classes.md` §Classes | 0 | `17d79f3:features/lib/homebridgeApi.ts:169-172` | W | fixed in Round 1: independent full-file review accepted the repair. | `46c6adb`: constructor smoke check and normal commit hooks passed. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-016 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `AGENTS.md` §Identity | 0 | `17d79f3:features/lib/publishedServices.ts:46-55,83-84` | B | fixed in Round 1: independent full-file review accepted the repair. | `62881fb`: direct two-same-name stand-in check throws on ambiguity; normal commit hooks passed. Default offline Cucumber 104/104 scenarios, 1,170/1,170 steps at `1317634` on Node v26.12.0. |
| CR-07-ACCESSORY-017 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, registration callbacks | 1 | `787406b:features/step_definitions/accessory.steps.ts:178-182,307-434` | W | fixed in Round 2: independent full-file review found all 15 world-using registrations anonymous and typed. | `2e46aca`: four focused scenarios and 41 steps passed; normal hooks passed. Default offline Cucumber 104/104 scenarios, 1,160/1,160 steps at `a39a4e6` on Node v26.12.0. |
| CR-07-ACCESSORY-018 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps, user-visible things | 1 | `787406b:features/accessory/discovery.feature:7-8` | W | fixed in Round 2: independent full-file review found no fake-cloud Background. | `a39a4e6`: removed redundant setup; normal hooks passed. Default offline Cucumber 104/104 scenarios, 1,160/1,160 steps on Node v26.12.0. |
| CR-07-ACCESSORY-019 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Steps, user-visible things | 2 | `8c24e10:features/accessory/discovery.feature:51,66,80`; `8c24e10:features/step_definitions/accessory.steps.ts:323-328,351-356` | W | **open at Round 2 STOP**: “accessory remembers” asserts private context fields instead of a user-visible result; context can change while publication fails. | Requires observable name, identity, or service outcome in scenario wording and assertion. No repair attempted after STOP. |

Rejected candidates: `homebridgeApi.ts:132` holds a shared HAP namespace with no
per-scenario mutable state; `hap.ts:720-729` supports that reading. Multiple
`When` steps in the removal and recovery scenarios form one lifecycle behavior.
The world registers Homebridge temporary-directory cleanup at `world.ts:325-333`.
The Homebridge stand-in supplies the fake HAP namespace through `api.hap`, and
service assertions use the same namespace. None of those candidates violates
the cited rule.

## Correction rounds

### Round 1

Independent reviewer `/root/phase7_plan03/accessory_round1_review` read every
line at `787406b32f57956ec0d3d741764e9cafffa18d8c`, after the correction
set. This was a new full-file review, not a diff inspection.

| Owned path | Reviewed blob | Contiguous lines |
| --- | --- | ---: |
| `features/accessory/discovery.feature` | `02ae65d8a690f05b7f470081a8ec57ccc741be2b` | 1-146 |
| `features/step_definitions/accessory.steps.ts` | `4168c115a8d3efeb95995056584c5192bef55557` | 1-434 |
| `features/lib/homebridgeApi.ts` | `176b7760378726e484c6a262137832b46e8af2ca` | 1-352 |
| `features/lib/publishedServices.ts` | `cc21c01f69ee558078fb0fd24d3a27e6e3b8eb57` | 1-105 |

Opening **16** (001-016); fixed **15** (001-006, 008-016); rejected **0**;
new **2** (017-018); reopened **0**; closing **3** (007, 017, 018).
Equation: `16 - 15 - 0 + 2 + 0 = 3`. The positive count fell and no fixed
ID reopened, so correction round 2 is permitted. The reviewer found no
further rule-backed cause in the current owned files. ID 007's residual
parser-location issue is WARNING, not the initial BLOCKER.

Seventeen IDs have repair commits. ID 007 remains open:
the owned step module now rejects unknown headers, repeated fields, short
rows, blank required cells, and nonnumeric water levels, but
`.agents/skills/cucumber/rules/steps.md` places typed Given parsers in
`features/lib/`. The owner list has no suitable parser file, and the
coordinator prohibited adding an unlisted path without an exact-path plan
revision. The independent reviewer must assess every current file before a
closing count is recorded. Each round uses
`closing = opening - fixed - rejected + new + reopened`.

### Round 2 repair set

ID 017 has repair commit `2e46aca`; ID 018 has repair commit `a39a4e6`.
ID 007 remains open because the exact parser location requires a plan revision
that names an owned `features/lib/` path. No Round 2 closing count is claimed
before an independent full-file review.

### Round 2 — STOP

Independent reviewer `/root/phase7_plan03/accessory_round2_review` read every
line at `8c24e10f71f7c7b67bcd9fd0dc0143f72c5fd642`, after the two
separate Round 2 repair commits.

| Owned path | Reviewed blob | Contiguous lines |
| --- | --- | ---: |
| `features/accessory/discovery.feature` | `f72433dcaf59ad6a9b1f86c06487ff277f63a779` | 1-143 |
| `features/step_definitions/accessory.steps.ts` | `f9d389ac654b78f65bc50fe61a1deb9d4087b8ca` | 1-440 |
| `features/lib/homebridgeApi.ts` | `176b7760378726e484c6a262137832b46e8af2ca` | 1-352 |
| `features/lib/publishedServices.ts` | `cc21c01f69ee558078fb0fd24d3a27e6e3b8eb57` | 1-105 |

Opening **3** (007, 017, 018); fixed **2** (017, 018); rejected **0**;
new **1** (019); reopened **1** (009); closing **3** (007, 009, 019).
Equation: `3 - 2 - 0 + 1 + 1 = 3`. The positive open count did not fall,
and a previously fixed ID reopened. Either condition requires **STOP now**.
No Round 3 correction is permitted under this run. The source remains at the
reviewed revision. The Round 2 reviewer found no further accepted cause.

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

After the Round 2 repair set, the main checkout at `a39a4e6` on Node
v26.12.0 passed `npm run test:cucumber`: **104/104 scenarios and 1,160/1,160
steps**. Removing the Background step reduced the prior 1,170-step count by
ten, one for each discovery scenario. The Cucumber usage command exited 0,
with no `UNUSED`, undefined, or ambiguous definitions. These checks used the
offline default profile and authorized local loopback stand-ins. The real
profile was not run. The coordinator owns the combined `npm run check` gate.
