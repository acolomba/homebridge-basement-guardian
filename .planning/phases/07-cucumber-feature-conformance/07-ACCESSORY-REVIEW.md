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
| CR-07-ACCESSORY-001 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | 0 | `17d79f3:features/accessory/discovery.feature:3-5` | W | open: description does not identify the fake cloud. | Pending wording; no production bug. |
| CR-07-ACCESSORY-002 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Background | 0 | `17d79f3:features/accessory/discovery.feature:9-11,19-23` | W | open: HALO case overwrites the default device, so not every scenario needs that Background step. | Pending setup move; count must stay stable. |
| CR-07-ACCESSORY-003 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Data tables | 0 | `17d79f3:features/accessory/discovery.feature:10,20-23,42-43` | W | open: deviceId, deviceTypeId, and waterLevel headers use camelCase instead of lower-case words. | Pending header and parser alignment. |
| CR-07-ACCESSORY-004 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/accessory/discovery.feature:30-35` | B | open: unchanged registration count and information pass if later polls never update the cached accessory. | Pending changed-state assertion and negative control. |
| CR-07-ACCESSORY-005 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/accessory/discovery.feature:37-45` | B | open: context changes before adapter update; the scenario cannot detect old Gemini services left trustworthy after a type change. | Pending trust and immutable identity assertions. |
| CR-07-ACCESSORY-006 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/accessory/discovery.feature:98-111` | B | open: warning and no removal pass if invalid telemetry leaves last readings falsely trustworthy. | Pending retained-value and status assertions. |
| CR-07-ACCESSORY-007 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, typed Given parser | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:64-90` | B | open: hashes ignore unknown columns and defaults accept missing required device cells. | Pending exact table validation. |
| CR-07-ACCESSORY-008 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps; `AGENTS.md` §Identity | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:159-185` | B | open: count and information omit UUID, device context, and registration identifiers. | Pending whole identity assertion. |
| CR-07-ACCESSORY-009 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:169-184` | B | open: a plugin publishing only AccessoryInformation passes. | Pending exact service-surface assertion. |
| CR-07-ACCESSORY-010 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | 0 | `17d79f3:features/step_definitions/accessory.steps.ts:247-257` | B | open: any unregister call passes, including a wrong UUID or duplicate removal. | Pending exact call assertion. |
| CR-07-ACCESSORY-011 | FEAT-01 | `.agents/skills/cucumber/rules/world-and-stand-ins.md` §Fakes and drivers; `.agents/skills/cucumber/SKILL.md` §Review | 0 | `17d79f3:features/lib/publishedServices.ts:30-31`; `17d79f3:features/lib/homebridgeApi.ts:272-277` | B | open: the historical handed list makes a removed accessory appear current and its services readable. | Pending live-reference filtering. |
| CR-07-ACCESSORY-012 | FEAT-01 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source | 0 | `17d79f3:features/lib/homebridgeApi.ts:1` | W | open: SPDX and separate copyright JSDoc are absent. | Pending header-only change. |
| CR-07-ACCESSORY-013 | FEAT-01 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source | 0 | `17d79f3:features/lib/publishedServices.ts:1` | W | open: SPDX and separate copyright JSDoc are absent. | Pending header-only change. |
| CR-07-ACCESSORY-014 | FEAT-01 | `.agents/skills/typescript-style/rules/comments.md` §Forbidden in comments and test titles | 0 | `17d79f3:features/lib/homebridgeApi.ts:107-112` | W | open: comment narrates former code instead of present behavior. | Pending comment-only change. |
| CR-07-ACCESSORY-015 | FEAT-01 | `.agents/skills/typescript-style/rules/classes.md` §Classes | 0 | `17d79f3:features/lib/homebridgeApi.ts:169-172` | W | open: constructor parameter properties and public modifier conflict with field declaration rules. | Pending explicit fields and assignments. |
| CR-07-ACCESSORY-016 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `AGENTS.md` §Identity | 0 | `17d79f3:features/lib/publishedServices.ts:46-55,83-84` | B | open: two devices with the same vendor name cannot be distinguished by named-service lookup. | Pending immutable identity selection or explicit ambiguity rejection. |

Rejected candidates: `homebridgeApi.ts:132` holds a shared HAP namespace with no
per-scenario mutable state; `hap.ts:720-729` supports that reading. Multiple
`When` steps in the removal and recovery scenarios form one lifecycle behavior.
The world registers Homebridge temporary-directory cleanup at `world.ts:325-333`.
The Homebridge stand-in supplies the fake HAP namespace through `api.hap`, and
service assertions use the same namespace. None of those candidates violates
the cited rule.

## Correction rounds

Pending. Each round uses `closing = opening - fixed - rejected + new + reopened`.

## Repair and verification ledger

Pending. The initial offline default profile passed 104/104 scenarios and
1,162/1,162 steps at `17d79f3` on Node v26.12.0 after compilation. The first
sandboxed attempt failed at loopback bind with `EPERM`; the authorized local
loopback run exited 0. No real profile step ran.
