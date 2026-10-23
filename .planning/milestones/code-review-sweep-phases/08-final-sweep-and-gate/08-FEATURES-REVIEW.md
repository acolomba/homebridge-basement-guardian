# Phase 08 FEATURES complete-file review

**Reviewer:** `/root/phase8_plan07`, independent of the reviewed files. **Committed revision read:** `01bc3a3b8d542054bfdb98a13ee180155dd92fd2`. **Round:** 0 discovery. The review used complete `git show HEAD:path` blobs, not diffs. The current manifest contains 39 FEATURES paths: 15 Gherkin files in shard A and 24 TypeScript files in shard B. `git ls-files features` returns the same 39 paths. Every reviewed blob and line count matches `08-MANIFEST.json`; no feature file was modified during this review.

## Complete-file inventory

The line spans below are contiguous complete files. A row marked clean has zero accepted findings. The five named step modules have the IDs shown; only `account.steps.ts` also has the cache assertion cause.

| Path | Complete lines | Full blob | Reviewer | Finding IDs or clean |
| --- | --- | --- | --- | --- |
| features/accessory/discovery.feature | 1-143 | f72433dcaf59ad6a9b1f86c06487ff277f63a779 | /root/phase8_plan07 | clean (0) |
| features/account/configuration.feature | 1-48 | 7e35c417f02a3a8b021e0f6b717b2c724874864b | /root/phase8_plan07 | clean (0) |
| features/account/sign-in.feature | 1-51 | cb1f28d9379ab316eaf89e8ff54955dec5b333df | /root/phase8_plan07 | clean (0) |
| features/harness/fakes.feature | 1-208 | c9245c20505c852f1b7bcf31130d6c07c0b9b11d | /root/phase8_plan07 | clean (0) |
| features/homekit/official-controls.feature | 1-212 | 69de42e6881a9b454c52b07a12f0a009d3709e85 | /root/phase8_plan07 | clean (0) |
| features/homekit/safety-state.feature | 1-159 | a37e26be54a6bbcfdc3f07e99ef5530bcdcacb21 | /root/phase8_plan07 | clean (0) |
| features/lib/auth0.ts | 1-155 | 178ee516e30b514c9024e0f1a66a6a076ad897ba | /root/phase8_plan07 | clean (0) |
| features/lib/deviceTables.ts | 1-139 | 93838cea7faa5faa533e76bcefe9af6fd9e775d3 | /root/phase8_plan07 | clean (0) |
| features/lib/hap.ts | 1-771 | 688d99d3e6547ae90ebf1c09ca926a767977b2bd | /root/phase8_plan07 | clean (0) |
| features/lib/homebridgeApi.ts | 1-352 | 176b7760378726e484c6a262137832b46e8af2ca | /root/phase8_plan07 | clean (0) |
| features/lib/loopbackServer.ts | 1-82 | a94eed084485bdc615d1f4c6d3716c2032688d47 | /root/phase8_plan07 | clean (0) |
| features/lib/publishedServices.ts | 1-105 | cc21c01f69ee558078fb0fd24d3a27e6e3b8eb57 | /root/phase8_plan07 | clean (0) |
| features/lib/realPumpPolling.ts | 1-38 | df8ae4058d9f45e6adaf1951ab5ce4bcfcd11ec7 | /root/phase8_plan07 | clean (0) |
| features/lib/shadowBroker.ts | 1-286 | 3edcee4bedceab9525c3dd3dadd762eec268330e | /root/phase8_plan07 | clean (0) |
| features/lib/timers.ts | 1-99 | 2d28246cbd0802b8c42bb02eff6a2be0a855b89d | /root/phase8_plan07 | clean (0) |
| features/lib/vendorRestApi.ts | 1-422 | e888964c15db0ab9eb7510b0ae2766df3c34ac75 | /root/phase8_plan07 | clean (0) |
| features/monitoring/degradation.feature | 1-730 | ab504476d5ff5fd81374d10fc0d634b9c0f8399d | /root/phase8_plan07 | clean (0) |
| features/plugin/lifecycle.feature | 1-71 | 0f924798ba246f15ff0347251af56c20979c3070 | /root/phase8_plan07 | clean (0) |
| features/pump/records.feature | 1-64 | a1eb4f9e2576cbfefb4862319fa21ea10d76d4f0 | /root/phase8_plan07 | clean (0) |
| features/real-pump/discovery.feature | 1-24 | c5da597956a39ad79ba4a7558317bd4e4393747a | /root/phase8_plan07 | clean (0) |
| features/real-pump/heartbeats.feature | 1-17 | 9680bd2435d9f406008c4862a67770a211b14ba5 | /root/phase8_plan07 | clean (0) |
| features/real-pump/lifecycle.feature | 1-20 | 1c900983f92cd61c1de571e23ba764a5fc747d8e | /root/phase8_plan07 | clean (0) |
| features/real-pump/step_definitions/discovery.steps.ts | 1-47 | b7dd65c12036f7ea5757139c3ce0a325a02409df | /root/phase8_plan07 | clean (0) |
| features/real-pump/step_definitions/heartbeats.steps.ts | 1-32 | 7835e707e98dfebfe06eb22f5407c99414bb65e5 | /root/phase8_plan07 | clean (0) |
| features/real-pump/step_definitions/lifecycle.steps.ts | 1-54 | ef8a50cec18379c8c8e651ab01603d26fee1039c | /root/phase8_plan07 | clean (0) |
| features/real-pump/support/realWorld.ts | 1-364 | 50616b5d8ae9b6a9b69823d07eda45e903be8ded | /root/phase8_plan07 | clean (0) |
| features/shadow/connection-lifecycle.feature | 1-50 | 3f16c14fe25ac17e913dff849fce743ce88bd676 | /root/phase8_plan07 | clean (0) |
| features/shadow/credential-rotation.feature | 1-28 | 2f168fa95ca2a8da6071e2aed5cc98591e8a4fbd | /root/phase8_plan07 | clean (0) |
| features/shadow/state-merging.feature | 1-91 | 3cf481ad8d39e4dea4cd9acd2746955b3d55aa01 | /root/phase8_plan07 | clean (0) |
| features/step_definitions/accessory.steps.ts | 1-312 | ffa7f87420bde559cdfd0c1198a63efdc4b53930 | /root/phase8_plan07 | clean (0) |
| features/step_definitions/account.steps.ts | 1-238 | e443e05a2c322995084e129f18189a823cc8aa2d | /root/phase8_plan07 | CR-08-FEATURES-001, CR-08-FEATURES-002 |
| features/step_definitions/configuration.steps.ts | 1-94 | 29d20e0b06c1a6abd39e0e4bc77e9ba7a3644499 | /root/phase8_plan07 | CR-08-FEATURES-001 |
| features/step_definitions/controls.steps.ts | 1-319 | 355a4bed8497b9403e4524079338a9c0325aee47 | /root/phase8_plan07 | CR-08-FEATURES-001 |
| features/step_definitions/hap.steps.ts | 1-661 | 633733d38488650035e0d51991ed66538070a125 | /root/phase8_plan07 | clean (0) |
| features/step_definitions/harness.steps.ts | 1-551 | e8bcfd607f94a03e84359d31f6f3f454399ddff3 | /root/phase8_plan07 | clean (0) |
| features/step_definitions/homekit.steps.ts | 1-275 | 958b06c58b03d5d21f575b20f0e8b61067cbbd79 | /root/phase8_plan07 | CR-08-FEATURES-001 |
| features/step_definitions/runtime.steps.ts | 1-345 | 3f0b668624a4a32bd52fdd795bd3fe4d6bb25f56 | /root/phase8_plan07 | clean (0) |
| features/step_definitions/shadow.steps.ts | 1-498 | 368f0c8ce5869ded3b1e18858b17641b2fbcf836 | /root/phase8_plan07 | CR-08-FEATURES-001 |
| features/support/world.ts | 1-827 | d29d633a0f2d57ade39116253e84de9c7303e39c | /root/phase8_plan07 | clean (0) |

Large-file read segments, whose union is the complete row above: `features/monitoring/degradation.feature` 1-370 and 371-730; `features/lib/hap.ts` 1-390 and 391-771; `features/step_definitions/hap.steps.ts` 1-350 and 351-661; `features/step_definitions/harness.steps.ts` 1-300 and 301-551; `features/support/world.ts` 1-420 and 421-827. Each other file was read in one complete span. The committed blobs have the approved SPDX line, separate copyright block, and brief `@fileoverview` form on every TypeScript file; attribution remains intact.

## Rules and consumer trace

Applied `AGENTS.md` §§General, Privacy, and GSD records; `.agents/skills/cucumber/SKILL.md` §Review and `rules/layout.md` §§File families, Vertical functions, Boundaries; `rules/features.md` §§Feature description, Scenarios, Steps, Data tables, Background; `rules/steps.md` §§Module structure, Steps, Errors; `rules/world-and-stand-ins.md` §§The world, Fakes and drivers; and the applicable `typescript-style/rules/{modules-and-data,classes,functions,types,naming-and-docs,comments,review}.md`. The TypeScript header check also used the Phase 1 form required by `08-REVIEW-PROTOCOL.md`.

All 136 Gherkin scenarios and 984 step lines were examined across the complete A files. The following consumer trace links their observable result to the B modules and plugin boundary. These context reads do not claim ownership of production code.

| Scenario family | Step, World, and stand-in route | Public effect or assertion |
| --- | --- | --- |
| Account configuration and sign-in | `configuration.steps.ts`, `account.steps.ts` → `world.ts` → `auth0.ts`, `vendorRestApi.ts`, `homebridgeApi.ts`; bounded `src/cloud/auth.ts:338-342,555-582` | Platform refusal before lifecycle registration; grant, cache file, redacted log, and vendor-request count. |
| Discovery and accessory identity | `accessory.steps.ts` → `world.ts` → `deviceTables.ts`, `homebridgeApi.ts`, `publishedServices.ts`, `hap.ts`; bounded `src/platform.ts:390-416,634-639` | Homebridge registration, UUID, cached context, service identity, removal, and vendor rename. |
| Safety state, pump records, and controls | `homekit.steps.ts`, `controls.steps.ts`, `shadow.steps.ts` → `world.ts` → fake REST, broker, HAP, timers, and published-service lookup | Published characteristic value and read status; exact command body, count, and refusal. |
| Shadow merge and monitoring | `shadow.steps.ts`, `runtime.steps.ts` → `world.ts` → `shadowBroker.ts`, `vendorRestApi.ts`, `timers.ts` | Canonical snapshot, source ownership, per-device trust, poll fallback, and lifecycle release. |
| Harness contracts | `harness.steps.ts`, `hap.steps.ts` → local fakes and a fresh scenario World | Full local fake request/response, HAP defaults, timer cancellation, and reverse release behavior. |
| Real read-only profile | Three `real-pump/step_definitions/*.steps.ts` → isolated `real-pump/support/realWorld.ts` → `realPumpPolling.ts` and account runtime | Discovery and snapshot structure, bounded observation, cache fingerprint, and clean shutdown. This route was read statically only. |

The default `cucumber.json` profile excludes `@real`; its imports contain only offline World and step paths. The real profile selects `@real and @read-only` and imports the isolated real-pump modules. No live vendor or hardware command was run. The review makes no new claim about Cucumber 13.2.1 API behavior beyond these committed configuration paths.

Bounded cross-boundary reads at the same commit were `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:src/cloud/auth.ts:338-342,555-582` (blob `45316e06710b9ec6da56eb257376e776bab2e74d`), `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:src/platform.ts:390-416,634-639` (blob `e4bedd50206653eb6456a931edba97ab3bea12c1`), and `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:cucumber.json:1-15` (blob `0f6d5eed69ad0a05ad7b783fe8de6e05f8ac8546`). None is a second complete-file ownership claim.

## Accepted round-zero findings

| ID | Requirement | Rule and heading | Initial/current location at reviewed revision | Severity | Disposition and cause |
| --- | --- | --- | --- | --- | --- |
| CR-08-FEATURES-001 | GATE-02 | `.agents/skills/cucumber/rules/steps.md` §Steps, World-bound registration must use an anonymous `function` expression; `.agents/skills/typescript-style/rules/functions.md` §Functions | `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/step_definitions/account.steps.ts:96,238`; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/step_definitions/configuration.steps.ts:37,94`; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/step_definitions/controls.steps.ts:137,319`; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/step_definitions/homekit.steps.ts:112,275`; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/step_definitions/shadow.steps.ts:147,498` | WARNING | **open.** Five step modules pass named `this: BasementGuardianWorld` function declarations to registrations. The current rule requires anonymous World-bound callbacks. The bodies are otherwise bound through Cucumber's `this`; this is a structural rule violation, not a claimed runtime failure. One cause covers the repeated form. |
| CR-08-FEATURES-002 | GATE-02 | `.agents/skills/cucumber/SKILL.md` §Review, a plausible wrong implementation must fail; `.agents/skills/cucumber/rules/steps.md` §Steps, `Then` must assert the condition; `.agents/skills/typescript-style/rules/functions.md` §Errors | `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/step_definitions/account.steps.ts:83-88,204-208`; scenario `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/account/sign-in.feature:27-35` | BLOCKER | **open.** `isPresent()` turns every `access(path)` rejection into `false`. The cache-absence `Then` therefore passes if the cache is still present but traversal or access fails. The production deletion path catches a failed `rm` at `src/cloud/auth.ts:338-342`, so this assertion must distinguish `ENOENT` from other filesystem errors. |

These are first-round discovery findings. Plan 08-09 owns central triage; Plan 08-14 owns regression evidence and repair. No source, test, or feature code was changed here. The review command for each cause is the parent-run offline Cucumber check: `npm run test:cucumber`; named scenarios are `A refused credential clears the cache and reports how to correct the account` for 002 and default dry-run usage for 001. Raw test exits are **not run in this review**.

A separate read-only reviewer (`/root/phase8_features_findings_check`) independently confirmed both causes at the recorded blobs. Pinned Cucumber 13.2.1 binds the scenario World through `fn.apply(thisArg, argsArray)`, so 001 is a project-rule warning rather than a runtime binding failure. For 002, only `ENOENT` establishes cache absence; a permission or traversal error can otherwise make the `Then` pass while the file remains. That reviewer changed no files and ran no build or test.

## Rejected candidates

| Candidate | Exact rule and current location | Evidence-based disposition |
| --- | --- | --- |
| Late `Given` after `When` | `.agents/skills/cucumber/rules/features.md` §Steps; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/monitoring/degradation.feature:336,351,375,466,485,500,518,544-545,570,606,659` | **rejected, no new ID.** The current text conflicts with the general ordering rule, but the maintainer explicitly rejected this cause in `07-MONITORING-REVIEW.md`, CR-07-MONITORING-006, and directed that wording and scenario order stay. This review preserves that ruling. |
| Isolated real-profile directories | `.agents/skills/cucumber/rules/layout.md` §§File families, Boundaries; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/real-pump/support/realWorld.ts:1-16,359-364`, `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/real-pump/step_definitions/discovery.steps.ts:1-16` | **rejected, no new ID.** `cucumber.json` imports the real World and steps only under its `real` profile. The default profile excludes them. `07-REAL-WORLD-REVIEW.md` CR-07-REAL_WORLD-010 and `07-REAL-STEPS-REVIEW.md` record this deliberate safety boundary. |
| Self-contained HAP `Then` assertions | `.agents/skills/cucumber/rules/steps.md` §Steps; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/harness/fakes.feature:131-168`, `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/step_definitions/hap.steps.ts:207-370` | **rejected, no new ID.** These checks construct ephemeral local values and assert the named stand-in contract without World or external state. `07-HAP-REVIEW.md` CR-07-HAP-020/024 and `07-HARNESS-REVIEW.md` CR-07-HARNESS-005 already rejected a split into World-backed When/Then pairs. |
| World change-list listener after restart | `.agents/skills/cucumber/SKILL.md` §Review; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:features/support/world.ts:420-425,755-778` | **rejected, no new ID.** `watchedDeviceIds` survives restart, but no current post-restart scenario reads `changes` or uses the canonical-change count step. The existing restart scenarios assert published HomeKit values and cloud requests. This candidate does not establish a current false pass; a later scenario that asserts post-restart change counts must reset that listener set. |

## Verification and handoff

| Read-only command | Exit | Result |
| --- | ---: | --- |
| Tracked FEATURES paths versus manifest owner rows, plus each HEAD blob and line count | 0 | 39/39 paths, 39/39 blobs, 39/39 line counts matched. |
| TypeScript SPDX/copyright/fileoverview scan | 0 | 24/24 TypeScript headers matched. |
| Static Gherkin scan | 0 | 136 scenarios, 984 step lines; the 12 late Given lines are the previously rejected cause. |
| `requirements.ready-ids 08-07-PLAN.md GATE-02 --raw` | 0 | 0/1 ready. GATE-02 was not marked complete. |

The parent agent should run `npm run build:test`, `npx cucumber-js --dry-run --format usage`, the real profile with `--dry-run` only, and the scheduled combined gate. This reviewer ran no build, test, pre-commit hook, or live profile. The two plan row checks should be run against this report before the parent commits it.
