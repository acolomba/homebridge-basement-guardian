---
phase: 08-final-sweep-and-gate
plan: "07"
subsystem: testing
tags: [cucumber, gherkin, homebridge, review]
requires:
  - phase: 07-cucumber-feature-conformance
    provides: baseline Cucumber rule and finding decisions
  - phase: 08-final-sweep-and-gate
    provides: live manifest and review protocol from Plan 08-01
provides:
  - complete independent FEATURES review of 39 committed paths
  - two open causes for Plan 08-09 triage
affects: [08-09-finding-triage, 08-14-serial-repair]
actuals:
  tokens: 5769
  tasks: 2
  commits: 1
tech-stack:
  added: []
  patterns: [complete Git blob review, stable cause IDs]
key-files:
  created:
    - .planning/phases/08-final-sweep-and-gate/08-FEATURES-REVIEW.md
    - .planning/phases/08-final-sweep-and-gate/08-07-SUMMARY.md
  modified: []
key-decisions:
  - "Preserve the maintainer's Phase 7 rejection of late Given wording."
  - "Treat all named World-bound step registrations as one structural cause."
requirements-completed: []
reviewed_revision: 01bc3a3b8d542054bfdb98a13ee180155dd92fd2
plan_head_before: 01bc3a3b8d542054bfdb98a13ee180155dd92fd2
plan_head_after: c232d6387ef0777cc0972b33ec873e3a99deb63e
commits: 1
completed: 2026-10-22
status: complete
---

# Phase 08 Plan 07: FEATURES complete-file review

**All 39 live FEATURES paths have full committed-blob rows. Two distinct causes remain open for central triage.**

## Review result

Reviewer `/root/phase8_plan07` read the 15 shard A Gherkin files and 24 shard B TypeScript files at commit `01bc3a3b8d542054bfdb98a13ee180155dd92fd2`. The reviewer did not edit any reviewed file. The report records each exact path, full blob, and contiguous `1-N` span. All 39 blobs and line counts matched the live manifest.

| Path | Full blob |
| --- | --- |
| features/accessory/discovery.feature | f72433dcaf59ad6a9b1f86c06487ff277f63a779 |
| features/account/configuration.feature | 7e35c417f02a3a8b021e0f6b717b2c724874864b |
| features/account/sign-in.feature | cb1f28d9379ab316eaf89e8ff54955dec5b333df |
| features/harness/fakes.feature | c9245c20505c852f1b7bcf31130d6c07c0b9b11d |
| features/homekit/official-controls.feature | 69de42e6881a9b454c52b07a12f0a009d3709e85 |
| features/homekit/safety-state.feature | a37e26be54a6bbcfdc3f07e99ef5530bcdcacb21 |
| features/lib/auth0.ts | 178ee516e30b514c9024e0f1a66a6a076ad897ba |
| features/lib/deviceTables.ts | 93838cea7faa5faa533e76bcefe9af6fd9e775d3 |
| features/lib/hap.ts | 688d99d3e6547ae90ebf1c09ca926a767977b2bd |
| features/lib/homebridgeApi.ts | 176b7760378726e484c6a262137832b46e8af2ca |
| features/lib/loopbackServer.ts | a94eed084485bdc615d1f4c6d3716c2032688d47 |
| features/lib/publishedServices.ts | cc21c01f69ee558078fb0fd24d3a27e6e3b8eb57 |
| features/lib/realPumpPolling.ts | df8ae4058d9f45e6adaf1951ab5ce4bcfcd11ec7 |
| features/lib/shadowBroker.ts | 3edcee4bedceab9525c3dd3dadd762eec268330e |
| features/lib/timers.ts | 2d28246cbd0802b8c42bb02eff6a2be0a855b89d |
| features/lib/vendorRestApi.ts | e888964c15db0ab9eb7510b0ae2766df3c34ac75 |
| features/monitoring/degradation.feature | ab504476d5ff5fd81374d10fc0d634b9c0f8399d |
| features/plugin/lifecycle.feature | 0f924798ba246f15ff0347251af56c20979c3070 |
| features/pump/records.feature | a1eb4f9e2576cbfefb4862319fa21ea10d76d4f0 |
| features/real-pump/discovery.feature | c5da597956a39ad79ba4a7558317bd4e4393747a |
| features/real-pump/heartbeats.feature | 9680bd2435d9f406008c4862a67770a211b14ba5 |
| features/real-pump/lifecycle.feature | 1c900983f92cd61c1de571e23ba764a5fc747d8e |
| features/real-pump/step_definitions/discovery.steps.ts | b7dd65c12036f7ea5757139c3ce0a325a02409df |
| features/real-pump/step_definitions/heartbeats.steps.ts | 7835e707e98dfebfe06eb22f5407c99414bb65e5 |
| features/real-pump/step_definitions/lifecycle.steps.ts | ef8a50cec18379c8c8e651ab01603d26fee1039c |
| features/real-pump/support/realWorld.ts | 50616b5d8ae9b6a9b69823d07eda45e903be8ded |
| features/shadow/connection-lifecycle.feature | 3f16c14fe25ac17e913dff849fce743ce88bd676 |
| features/shadow/credential-rotation.feature | 2f168fa95ca2a8da6071e2aed5cc98591e8a4fbd |
| features/shadow/state-merging.feature | 3cf481ad8d39e4dea4cd9acd2746955b3d55aa01 |
| features/step_definitions/accessory.steps.ts | ffa7f87420bde559cdfd0c1198a63efdc4b53930 |
| features/step_definitions/account.steps.ts | e443e05a2c322995084e129f18189a823cc8aa2d |
| features/step_definitions/configuration.steps.ts | 29d20e0b06c1a6abd39e0e4bc77e9ba7a3644499 |
| features/step_definitions/controls.steps.ts | 355a4bed8497b9403e4524079338a9c0325aee47 |
| features/step_definitions/hap.steps.ts | 633733d38488650035e0d51991ed66538070a125 |
| features/step_definitions/harness.steps.ts | e8bcfd607f94a03e84359d31f6f3f454399ddff3 |
| features/step_definitions/homekit.steps.ts | 958b06c58b03d5d21f575b20f0e8b61067cbbd79 |
| features/step_definitions/runtime.steps.ts | 3f0b668624a4a32bd52fdd795bd3fe4d6bb25f56 |
| features/step_definitions/shadow.steps.ts | 368f0c8ce5869ded3b1e18858b17641b2fbcf836 |
| features/support/world.ts | d29d633a0f2d57ade39116253e84de9c7303e39c |

## Findings and rejected candidates

- `CR-08-FEATURES-001` (WARNING, open): five step modules pass named World-bound functions to Cucumber registrations. The current steps rule requires anonymous callbacks.
- `CR-08-FEATURES-002` (BLOCKER, open): the token-cache absence assertion treats every filesystem access failure as an absent cache.
- The late `Given` wording, isolated real-profile layout, HAP contract `Then` pattern, and restart change-list listener candidate were rejected with exact rule and location evidence in the report. The first three have earlier Phase 7 decisions; the fourth has no current post-restart consumer of the change list.

The report traces scenarios through steps, World instances, local stand-ins, and public plugin effects. Real-pump files received static review only. The default profile is offline; no live vendor or hardware call occurred.

## Verification

| Command or check | Exit | Result |
| --- | ---: | --- |
| Manifest path, blob, and line comparison at HEAD | 0 | 39/39 matched. |
| TypeScript SPDX, copyright, and fileoverview scan | 0 | 24/24 matched. |
| Static Gherkin structure scan | 0 | 136 scenarios and 984 step lines examined. |
| Automated shard A report-row check | 0 | 15/15 current rows matched. |
| Automated shard B report-row check | 0 | 24/24 current rows matched. |
| `requirements.ready-ids 08-07-PLAN.md GATE-02 --raw` | 0 | 0/1 ready; GATE-02 remains incomplete. |

Builds, tests, and dry runs were not run by this reviewer. The parent ran the planning-file pre-commit checks and Fallow audit before committing the report. A separate read-only reviewer independently confirmed both findings, including that the named callback is a style violation rather than a Cucumber runtime failure.

## Commit handoff

The parent committed the report as `c232d63` with normal hooks after the Fallow audit. The default Cucumber suite, default usage dry run, and real-profile dry run remain scheduled. GATE-02 stays open until central triage and the final combined gate complete.

## Deviations from Plan

The parent assigned report writing to this independent reviewer and reserved commits and shared state updates for itself. No source or test code changed.

## Known Stubs

None.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Self-Check: PASSED

Both output files exist. The reviewed commit is an ancestor of HEAD. All 39 report rows match the manifest's path, full blob, and line count. No reviewed feature or bounded source file changed during this review.
