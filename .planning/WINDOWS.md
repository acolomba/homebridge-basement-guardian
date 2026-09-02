---
schema_version: 1
open_count: 18
waived_count: 1
fixed_count: 2
total_count: 21
last_updated: 2026-09-02T21:16:51.402Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 05 | unrun-verify | test/platform.test.ts |  | Deleting the configureAccessory marking call leaves all 85 Cucumber scenarios green; only the platform unit case gates that call site | waived | Not an open defect: the mutation is caught by test/platform.test.ts, which fails on it. Recorded so a later author who moves that gate knows the Cucumber tier cannot replace it, because features/support/world.ts stands in for configureAccessory. | 2026-09-02T01:46:49.765Z | 2026-09-02T01:47:10.458Z |
| 2 | 05 | unrun-verify | src/runtime/accountRuntime.ts |  | commandTransportReadyNow()'s !halted term is redundant given polling and no test fails when it is removed; kept as deliberate defence, recorded in 05-03-SUMMARY mutation 4 | open |  | 2026-09-02T02:30:06.953Z |  |
| 3 | 05 | deviation | README.md |  | The 30-day vendor-block figure is sourced from src/cloud/auth.ts:35, outside the two files plan 05-05's acceptance criterion names | open |  | 2026-09-02T03:35:44.273Z |  |
| 4 | 05 | todo | README.md | 220 | Pre-existing: ## Project structure links src/platformAccessory.ts, which does not exist; the accessory lives under src/accessories/ | open |  | 2026-09-02T03:35:44.625Z |  |
| 5 | 05 | deviation | src/device/state.ts | 173 | A shadow that goes silent never releases the telemetry watermark, so no REST poll refreshes telemetry for a device whose live path spoke and then stopped; releasing it on silence changes D-15/SYNC-03 and wants a decision | fixed |  | 2026-09-02T12:34:29.654Z | 2026-09-02T15:53:59.681Z |
| 6 | 05 | deviation | src/accessories/basementGuardian.ts |  | reportControllerLink names five poisoned scopes where NON_CONNECTIVITY_SCOPES holds seven; self-test and alarm-mute are withdrawn by the same layer and go unmentioned | open |  | 2026-09-02T12:34:29.998Z |  |
| 7 | 05 | unrun-verify | test/platform.test.ts |  | makes an accessory a successful inventory built unreadable in the same pass as a restored one: passes without the fix and fails no mutation; keep D1-D4 as the coverage of CR-03 | open |  | 2026-09-02T13:47:07.171Z |  |
| 8 | 05 | deviation | features/degradedOperation.feature |  | A returning heartbeat clears the shadow silence before the next poll asserts Water Level 40 across the parked window, which holds because pollTelemetry freezes telemetry during silence; plan 05-11 changes that handover and the assertion wants one re-check | fixed |  | 2026-09-02T14:31:08.555Z | 2026-09-02T15:53:59.999Z |
| 9 | 05 | deviation | features/degradedOperation.feature |  | Scenario 'Shadow silence withdraws trust while polling continues' now rests its 'sensor is not activated' assertion on the polled water_level 1 rather than the retained heartbeat 3; still honest, but the heartbeat step no longer carries that assertion | open |  | 2026-09-02T15:54:12.932Z |  |
| 10 | 05 | deviation | features/support/steps/harness.ts |  | Plan 05-11 prescribed repairing scenarios with 'Given these reported device fields:'; that step wipes the full valid telemetry these scenarios need and the matching-value repair also destroys the heartbeat barrier the snapshot step provides. Repair used the second heartbeat instead | open |  | 2026-09-02T15:54:13.289Z |  |
| 11 | 05 | unrun-verify | test/accessories/staleMarking.test.ts |  | lets the accessory own binder replace the refusal: no mutation in 05-09's five reaches it, so the assertion carries no discriminating mutation; the candidate (bind as an additional listener rather than into HAP's single onSet slot) is named in 05-VALIDATION.md and was not run | open |  | 2026-09-02T16:15:52.222Z |  |
| 12 | 05 | deviation | .planning/REQUIREMENTS.md |  | Every Phase 1 requirement row still reads Pending (CONF-01..05, AUTH-01/02, SYNC-01..05), including SYNC-03 which plan 05-11 amended in place. Phase 1 predates the mark-complete habit; plan 05-10 left the block alone rather than close one row of it on Phase 5 evidence. Wants a Phase 1 close-out or a milestone audit | open |  | 2026-09-02T16:16:03.522Z |  |
| 13 | 05 | unrun-verify | .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md |  | The 22 first-round Per-Task Verification Map rows still read pending. Plan 05-10 reconciled the gap-closure rows against their summaries and had no equivalent basis for the first round; three of those rows are the ones 05-VERIFICATION.md found green but blind | open |  | 2026-09-02T16:16:03.873Z |  |
| 14 | 05 | deviation | .planning/phases/05-degraded-operation-and-recovery/05-REVIEW.md |  | WR-05 (the nine-member DiscoveryContext literal written three times in src/platform.ts) and IN-03 (shadow silence measured against a jumpable wall clock) close phase 05 deferred, with the reasons 05-06-PLAN.md recorded. Dispositions carried into 05-VALIDATION.md | open |  | 2026-09-02T16:16:04.212Z |  |
| 15 | 05 | deviation | features/degradedOperation.feature |  | Mutation B did not produce the outcome 05-12-PLAN.md predicted: the plan's own prescribed 'Then the broker holds no live connection' step sits before the settling steps and kills the scenario independently of the settle, so dropping the settle and reverting the fix still fails. Suppressing that one step isolates the half the mutation is about, and the scenario then passes against the defect. The finding stands; the plan's predicted mechanism did not | open |  | 2026-09-02T17:55:13.303Z |  |
| 16 | 05 | deviation | src/runtime/accountRuntime.ts |  | closeQuietly was relocated above haltOnTerminalAuthFailure, which 05-12-PLAN.md did not anticipate: @typescript-eslint/no-use-before-define rejects the new call site otherwise. Body unchanged. Relatedly, the entry-guard case could not use Promise.withResolvers (needs lib es2024, outside this plan's files) and captures the resolver by hand instead | open |  | 2026-09-02T17:55:13.637Z |  |
| 17 | 05 | todo | features/support/steps/harness.ts |  | harness.ts keeps a private single-device currentAccessory reading registerPlatformAccessoryCalls[0].accessories[0], and a topicNamed built on a module-constant DEVICE_ID; neither was needed by the two-device work and neither was removed | open |  | 2026-09-02T20:38:24.798Z |  |
| 18 | 05 | todo | features/support/steps/shadow.ts |  | awaitSubscription waits on a cumulative published-topic count, so on a two-device account it answers once the client subscribed to either device; the two-pump scenarios wait for a value rather than for a subscription, so it was left as it is | open |  | 2026-09-02T20:38:25.145Z |  |
| 19 | 05 | todo | src/accessories/basementGuardian.ts |  | Shadow-silence marking is account-wide on a multi-device account: any silent pump makes every accessory stop vouching, so a two-pump owner is told the plugin cannot vouch for both systems when it can vouch for one. Deliberate in plan 05-14; the argument and its cost are recorded in 05-VALIDATION.md under Planning hazards. A diagnostics phase wanting per-device marking needs a per-device MonitoringTrust through onMonitoringHealth and applyMonitoringHealth. | open |  | 2026-09-02T21:16:50.761Z |  |
| 20 | 05 | deviation | test/runtime/monitoringHealth.test.ts |  | Plan 05-14 task 1 had to touch two test files it did not list: npm run test:cucumber runs build:test over the whole test tsconfig, so the releaseShadowSource and recordShadowMessage call sites had to compile before the tracer task could be verified at all. Only the call sites moved in that commit; the substantive restatement landed in task 2. | open |  | 2026-09-02T21:16:51.116Z |  |
| 21 | 05 | deviation | features/degradedOperation.feature |  | Plan 05-14 mutation C (revert the admit call) failed nothing in the new scenario. The scenario's quiet pump heartbeats once before falling silent and recordShadowMessage stamps any device a message names, admitted or not, so the admit call is redundant for a pump that has ever spoken. It is pinned instead by five shipped scenarios and by the admission-seeding unit case. | open |  | 2026-09-02T21:16:51.402Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "test/platform.test.ts",
    "line": null,
    "description": "Deleting the configureAccessory marking call leaves all 85 Cucumber scenarios green; only the platform unit case gates that call site",
    "status": "waived",
    "reason": "Not an open defect: the mutation is caught by test/platform.test.ts, which fails on it. Recorded so a later author who moves that gate knows the Cucumber tier cannot replace it, because features/support/world.ts stands in for configureAccessory.",
    "recorded_at": "2026-09-02T01:46:49.765Z",
    "resolved_at": "2026-09-02T01:47:10.458Z"
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "src/runtime/accountRuntime.ts",
    "line": null,
    "description": "commandTransportReadyNow()'s !halted term is redundant given polling and no test fails when it is removed; kept as deliberate defence, recorded in 05-03-SUMMARY mutation 4",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T02:30:06.953Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "05",
    "file": "README.md",
    "line": null,
    "description": "The 30-day vendor-block figure is sourced from src/cloud/auth.ts:35, outside the two files plan 05-05's acceptance criterion names",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T03:35:44.273Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "todo",
    "phase": "05",
    "file": "README.md",
    "line": 220,
    "description": "Pre-existing: ## Project structure links src/platformAccessory.ts, which does not exist; the accessory lives under src/accessories/",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T03:35:44.625Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "05",
    "file": "src/device/state.ts",
    "line": 173,
    "description": "A shadow that goes silent never releases the telemetry watermark, so no REST poll refreshes telemetry for a device whose live path spoke and then stopped; releasing it on silence changes D-15/SYNC-03 and wants a decision",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T12:34:29.654Z",
    "resolved_at": "2026-09-02T15:53:59.681Z"
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "05",
    "file": "src/accessories/basementGuardian.ts",
    "line": null,
    "description": "reportControllerLink names five poisoned scopes where NON_CONNECTIVITY_SCOPES holds seven; self-test and alarm-mute are withdrawn by the same layer and go unmentioned",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T12:34:29.998Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "test/platform.test.ts",
    "line": null,
    "description": "makes an accessory a successful inventory built unreadable in the same pass as a restored one: passes without the fix and fails no mutation; keep D1-D4 as the coverage of CR-03",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T13:47:07.171Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "deviation",
    "phase": "05",
    "file": "features/degradedOperation.feature",
    "line": null,
    "description": "A returning heartbeat clears the shadow silence before the next poll asserts Water Level 40 across the parked window, which holds because pollTelemetry freezes telemetry during silence; plan 05-11 changes that handover and the assertion wants one re-check",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T14:31:08.555Z",
    "resolved_at": "2026-09-02T15:53:59.999Z"
  },
  {
    "id": 9,
    "kind": "deviation",
    "phase": "05",
    "file": "features/degradedOperation.feature",
    "line": null,
    "description": "Scenario 'Shadow silence withdraws trust while polling continues' now rests its 'sensor is not activated' assertion on the polled water_level 1 rather than the retained heartbeat 3; still honest, but the heartbeat step no longer carries that assertion",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T15:54:12.932Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "deviation",
    "phase": "05",
    "file": "features/support/steps/harness.ts",
    "line": null,
    "description": "Plan 05-11 prescribed repairing scenarios with 'Given these reported device fields:'; that step wipes the full valid telemetry these scenarios need and the matching-value repair also destroys the heartbeat barrier the snapshot step provides. Repair used the second heartbeat instead",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T15:54:13.289Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "test/accessories/staleMarking.test.ts",
    "line": null,
    "description": "lets the accessory own binder replace the refusal: no mutation in 05-09's five reaches it, so the assertion carries no discriminating mutation; the candidate (bind as an additional listener rather than into HAP's single onSet slot) is named in 05-VALIDATION.md and was not run",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T16:15:52.222Z",
    "resolved_at": null
  },
  {
    "id": 12,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/REQUIREMENTS.md",
    "line": null,
    "description": "Every Phase 1 requirement row still reads Pending (CONF-01..05, AUTH-01/02, SYNC-01..05), including SYNC-03 which plan 05-11 amended in place. Phase 1 predates the mark-complete habit; plan 05-10 left the block alone rather than close one row of it on Phase 5 evidence. Wants a Phase 1 close-out or a milestone audit",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T16:16:03.522Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "unrun-verify",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md",
    "line": null,
    "description": "The 22 first-round Per-Task Verification Map rows still read pending. Plan 05-10 reconciled the gap-closure rows against their summaries and had no equivalent basis for the first round; three of those rows are the ones 05-VERIFICATION.md found green but blind",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T16:16:03.873Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-REVIEW.md",
    "line": null,
    "description": "WR-05 (the nine-member DiscoveryContext literal written three times in src/platform.ts) and IN-03 (shadow silence measured against a jumpable wall clock) close phase 05 deferred, with the reasons 05-06-PLAN.md recorded. Dispositions carried into 05-VALIDATION.md",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T16:16:04.212Z",
    "resolved_at": null
  },
  {
    "id": 15,
    "kind": "deviation",
    "phase": "05",
    "file": "features/degradedOperation.feature",
    "line": null,
    "description": "Mutation B did not produce the outcome 05-12-PLAN.md predicted: the plan's own prescribed 'Then the broker holds no live connection' step sits before the settling steps and kills the scenario independently of the settle, so dropping the settle and reverting the fix still fails. Suppressing that one step isolates the half the mutation is about, and the scenario then passes against the defect. The finding stands; the plan's predicted mechanism did not",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T17:55:13.303Z",
    "resolved_at": null
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "05",
    "file": "src/runtime/accountRuntime.ts",
    "line": null,
    "description": "closeQuietly was relocated above haltOnTerminalAuthFailure, which 05-12-PLAN.md did not anticipate: @typescript-eslint/no-use-before-define rejects the new call site otherwise. Body unchanged. Relatedly, the entry-guard case could not use Promise.withResolvers (needs lib es2024, outside this plan's files) and captures the resolver by hand instead",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T17:55:13.637Z",
    "resolved_at": null
  },
  {
    "id": 17,
    "kind": "todo",
    "phase": "05",
    "file": "features/support/steps/harness.ts",
    "line": null,
    "description": "harness.ts keeps a private single-device currentAccessory reading registerPlatformAccessoryCalls[0].accessories[0], and a topicNamed built on a module-constant DEVICE_ID; neither was needed by the two-device work and neither was removed",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T20:38:24.798Z",
    "resolved_at": null
  },
  {
    "id": 18,
    "kind": "todo",
    "phase": "05",
    "file": "features/support/steps/shadow.ts",
    "line": null,
    "description": "awaitSubscription waits on a cumulative published-topic count, so on a two-device account it answers once the client subscribed to either device; the two-pump scenarios wait for a value rather than for a subscription, so it was left as it is",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T20:38:25.145Z",
    "resolved_at": null
  },
  {
    "id": 19,
    "kind": "todo",
    "phase": "05",
    "file": "src/accessories/basementGuardian.ts",
    "line": null,
    "description": "Shadow-silence marking is account-wide on a multi-device account: any silent pump makes every accessory stop vouching, so a two-pump owner is told the plugin cannot vouch for both systems when it can vouch for one. Deliberate in plan 05-14; the argument and its cost are recorded in 05-VALIDATION.md under Planning hazards. A diagnostics phase wanting per-device marking needs a per-device MonitoringTrust through onMonitoringHealth and applyMonitoringHealth.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T21:16:50.761Z",
    "resolved_at": null
  },
  {
    "id": 20,
    "kind": "deviation",
    "phase": "05",
    "file": "test/runtime/monitoringHealth.test.ts",
    "line": null,
    "description": "Plan 05-14 task 1 had to touch two test files it did not list: npm run test:cucumber runs build:test over the whole test tsconfig, so the releaseShadowSource and recordShadowMessage call sites had to compile before the tracer task could be verified at all. Only the call sites moved in that commit; the substantive restatement landed in task 2.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T21:16:51.116Z",
    "resolved_at": null
  },
  {
    "id": 21,
    "kind": "deviation",
    "phase": "05",
    "file": "features/degradedOperation.feature",
    "line": null,
    "description": "Plan 05-14 mutation C (revert the admit call) failed nothing in the new scenario. The scenario's quiet pump heartbeats once before falling silent and recordShadowMessage stamps any device a message names, admitted or not, so the admit call is redundant for a pump that has ever spoken. It is pinned instead by five shipped scenarios and by the admission-seeding unit case.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T21:16:51.402Z",
    "resolved_at": null
  }
]
````
