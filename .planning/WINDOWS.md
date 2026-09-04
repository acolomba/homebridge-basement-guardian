---
schema_version: 1
open_count: 7
waived_count: 19
fixed_count: 17
total_count: 43
last_updated: 2026-09-04T21:27:38.961Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 05 | unrun-verify | test/platform.test.ts |  | Deleting the configureAccessory marking call leaves all 85 Cucumber scenarios green; only the platform unit case gates that call site | waived | Not an open defect: the mutation is caught by test/platform.test.ts, which fails on it. Recorded so a later author who moves that gate knows the Cucumber tier cannot replace it, because features/support/world.ts stands in for configureAccessory. | 2026-09-02T01:46:49.765Z | 2026-09-02T01:47:10.458Z |
| 2 | 05 | unrun-verify | src/runtime/accountRuntime.ts |  | commandTransportReadyNow()'s !halted term is redundant given polling and no test fails when it is removed; kept as deliberate defence, recorded in 05-03-SUMMARY mutation 4 | fixed |  | 2026-09-02T02:30:06.953Z | 2026-09-03T12:30:27.521Z |
| 3 | 05 | deviation | README.md |  | The 30-day vendor-block figure is sourced from src/cloud/auth.ts:35, outside the two files plan 05-05's acceptance criterion names | waived | Sourcing note. The 30-day figure is correct and cited; only the file it came from sat outside the plan's named pair. | 2026-09-02T03:35:44.273Z | 2026-09-03T12:31:14.775Z |
| 4 | 05 | todo | README.md | 220 | Pre-existing: ## Project structure links src/platformAccessory.ts, which does not exist; the accessory lives under src/accessories/ | fixed |  | 2026-09-02T03:35:44.625Z | 2026-09-03T12:30:28.566Z |
| 5 | 05 | deviation | src/device/state.ts | 173 | A shadow that goes silent never releases the telemetry watermark, so no REST poll refreshes telemetry for a device whose live path spoke and then stopped; releasing it on silence changes D-15/SYNC-03 and wants a decision | fixed |  | 2026-09-02T12:34:29.654Z | 2026-09-02T15:53:59.681Z |
| 6 | 05 | deviation | src/accessories/basementGuardian.ts |  | reportControllerLink names five poisoned scopes where NON_CONNECTIVITY_SCOPES holds seven; self-test and alarm-mute are withdrawn by the same layer and go unmentioned | fixed |  | 2026-09-02T12:34:29.998Z | 2026-09-04T18:37:09.208Z |
| 7 | 05 | unrun-verify | test/platform.test.ts |  | makes an accessory a successful inventory built unreadable in the same pass as a restored one: passes without the fix and fails no mutation; keep D1-D4 as the coverage of CR-03 | waived | Superseded. The plan's own D1-D4 mutations are the agreed coverage of CR-03, and CR-03 is closed and re-pinned by the third verification. | 2026-09-02T13:47:07.171Z | 2026-09-03T12:31:15.108Z |
| 8 | 05 | deviation | features/degradedOperation.feature |  | A returning heartbeat clears the shadow silence before the next poll asserts Water Level 40 across the parked window, which holds because pollTelemetry freezes telemetry during silence; plan 05-11 changes that handover and the assertion wants one re-check | fixed |  | 2026-09-02T14:31:08.555Z | 2026-09-02T15:53:59.999Z |
| 9 | 05 | deviation | features/degradedOperation.feature |  | Scenario 'Shadow silence withdraws trust while polling continues' now rests its 'sensor is not activated' assertion on the polled water_level 1 rather than the retained heartbeat 3; still honest, but the heartbeat step no longer carries that assertion | waived | Recorded and still honest: the assertion moved from the retained heartbeat to the polled level, and the scenario asserts the same fact. | 2026-09-02T15:54:12.932Z | 2026-09-03T12:31:15.449Z |
| 10 | 05 | deviation | features/support/steps/harness.ts |  | Plan 05-11 prescribed repairing scenarios with 'Given these reported device fields:'; that step wipes the full valid telemetry these scenarios need and the matching-value repair also destroys the heartbeat barrier the snapshot step provides. Repair used the second heartbeat instead | waived | Executor chose a sounder repair than the plan prescribed; the prescribed step would have wiped the telemetry the scenarios need. | 2026-09-02T15:54:13.289Z | 2026-09-03T12:31:15.798Z |
| 11 | 05 | unrun-verify | test/accessories/staleMarking.test.ts |  | lets the accessory own binder replace the refusal: no mutation in 05-09's five reaches it, so the assertion carries no discriminating mutation; the candidate (bind as an additional listener rather than into HAP's single onSet slot) is named in 05-VALIDATION.md and was not run | open |  | 2026-09-02T16:15:52.222Z |  |
| 12 | 05 | deviation | .planning/REQUIREMENTS.md |  | Every Phase 1 requirement row still reads Pending (CONF-01..05, AUTH-01/02, SYNC-01..05), including SYNC-03 which plan 05-11 amended in place. Phase 1 predates the mark-complete habit; plan 05-10 left the block alone rather than close one row of it on Phase 5 evidence. Wants a Phase 1 close-out or a milestone audit | fixed |  | 2026-09-02T16:16:03.522Z | 2026-09-03T17:17:17.681Z |
| 13 | 05 | unrun-verify | .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md |  | The 22 first-round Per-Task Verification Map rows still read pending. Plan 05-10 reconciled the gap-closure rows against their summaries and had no equivalent basis for the first round; three of those rows are the ones 05-VERIFICATION.md found green but blind | fixed |  | 2026-09-02T16:16:03.873Z | 2026-09-03T17:24:02.509Z |
| 14 | 05 | deviation | .planning/phases/05-degraded-operation-and-recovery/05-REVIEW.md |  | WR-05 (the nine-member DiscoveryContext literal written three times in src/platform.ts) and IN-03 (shadow silence measured against a jumpable wall clock) close phase 05 deferred, with the reasons 05-06-PLAN.md recorded. Dispositions carried into 05-VALIDATION.md | open |  | 2026-09-02T16:16:04.212Z |  |
| 15 | 05 | deviation | features/degradedOperation.feature |  | Mutation B did not produce the outcome 05-12-PLAN.md predicted: the plan's own prescribed 'Then the broker holds no live connection' step sits before the settling steps and kills the scenario independently of the settle, so dropping the settle and reverting the fix still fails. Suppressing that one step isolates the half the mutation is about, and the scenario then passes against the defect. The finding stands; the plan's predicted mechanism did not | waived | Measured deviation from a plan prediction, explained in place. The behaviour is pinned; only the plan's predicted mutation outcome was wrong. | 2026-09-02T17:55:13.303Z | 2026-09-03T12:31:16.138Z |
| 16 | 05 | deviation | src/runtime/accountRuntime.ts |  | closeQuietly was relocated above haltOnTerminalAuthFailure, which 05-12-PLAN.md did not anticipate: @typescript-eslint/no-use-before-define rejects the new call site otherwise. Body unchanged. Relatedly, the entry-guard case could not use Promise.withResolvers (needs lib es2024, outside this plan's files) and captures the resolver by hand instead | waived | Lint forced the relocation; body unchanged. No behaviour change. | 2026-09-02T17:55:13.637Z | 2026-09-03T12:31:16.487Z |
| 17 | 05 | todo | features/support/steps/harness.ts |  | harness.ts keeps a private single-device currentAccessory reading registerPlatformAccessoryCalls[0].accessories[0], and a topicNamed built on a module-constant DEVICE_ID; neither was needed by the two-device work and neither was removed | fixed |  | 2026-09-02T20:38:24.798Z | 2026-09-04T18:37:09.558Z |
| 18 | 05 | todo | features/support/steps/shadow.ts |  | awaitSubscription waits on a cumulative published-topic count, so on a two-device account it answers once the client subscribed to either device; the two-pump scenarios wait for a value rather than for a subscription, so it was left as it is | fixed |  | 2026-09-02T20:38:25.145Z | 2026-09-04T18:37:09.930Z |
| 19 | 05 | todo | src/accessories/basementGuardian.ts |  | Shadow-silence marking is account-wide on a multi-device account: any silent pump makes every accessory stop vouching, so a two-pump owner is told the plugin cannot vouch for both systems when it can vouch for one. Deliberate in plan 05-14; the argument and its cost are recorded in 05-VALIDATION.md under Planning hazards. A diagnostics phase wanting per-device marking needs a per-device MonitoringTrust through onMonitoringHealth and applyMonitoringHealth. | fixed |  | 2026-09-02T21:16:50.761Z | 2026-09-04T18:37:10.276Z |
| 20 | 05 | deviation | test/runtime/monitoringHealth.test.ts |  | Plan 05-14 task 1 had to touch two test files it did not list: npm run test:cucumber runs build:test over the whole test tsconfig, so the releaseShadowSource and recordShadowMessage call sites had to compile before the tracer task could be verified at all. Only the call sites moved in that commit; the substantive restatement landed in task 2. | waived | Compilation necessity: the whole test tsconfig builds before Cucumber runs, so the call sites had to move for the tracer to be verifiable at all. | 2026-09-02T21:16:51.116Z | 2026-09-03T12:31:16.840Z |
| 21 | 05 | deviation | features/degradedOperation.feature |  | Plan 05-14 mutation C (revert the admit call) failed nothing in the new scenario. The scenario's quiet pump heartbeats once before falling silent and recordShadowMessage stamps any device a message names, admitted or not, so the admit call is redundant for a pump that has ever spoken. It is pinned instead by five shipped scenarios and by the admission-seeding unit case. | waived | Honest null result, pinned elsewhere. recordShadowMessage stamps any device a message names, so the admit call is redundant for a pump that has ever spoken. | 2026-09-02T21:16:51.402Z | 2026-09-03T12:31:17.187Z |
| 22 | 05 | deviation | .planning/phases/05-degraded-operation-and-recovery/05-15-PLAN.md |  | Plan 05-15 stated that refusing to advance a held watermark on a metadata-only document would leave a later telemetry document at the same version judged stale, discarding a real reading. Measured: refusing the advance leaves the watermark BELOW the shadow's own version, so a superseded document is accepted over a newer reading. The shipped case pins the measured consequence. | waived | Plan premise measured backwards and corrected; the shipped case pins the measured consequence. | 2026-09-02T21:52:45.278Z | 2026-09-03T12:31:17.532Z |
| 23 | 05 | deviation | test/accessories/basementGuardian.test.ts |  | Plan 05-16 task 1 listed only the feature file and the accessory source, but its own coverage verify demands 100 percent branch coverage of basementGuardian.js and the new seam guard adds a branch no scenario can reach. Three unit cases were added in task 1, one per refusal path, which is also what proves all three leaking callers closed | waived | Coverage necessity: the seam guard adds a branch no scenario can reach, so the plan's own 100 percent gate required the three unit cases. | 2026-09-02T22:32:05.472Z | 2026-09-03T12:31:17.842Z |
| 24 | 05 | deviation | test/accessories/basementGuardian.test.ts |  | Plan 05-17's first draft of the withholding case used a field that failed family validation. gemini.ts:370 drops a violated scope's whole group before the accessory sees it, so the value was already absent for a second reason and mutation F left the case green. Rebuilt on a lost controller link, a valid boolean the decode keeps. Any later case asserting that a trust rule hides a control value must not use an invalid field. | waived | Vacuous assertion caught by its own mutation and rebuilt on a reason the decode keeps. Fixed in a separate commit. | 2026-09-02T23:29:21.047Z | 2026-09-03T12:31:18.136Z |
| 25 | 05 | deviation | src/accessories/serviceCatalogue.ts |  | Plan 05-17 listed serviceCatalogue.ts in files_modified and its artifacts, expecting a possible new exported predicate over a scope and the untrusted list. None was needed: isRowPublishable already takes a RowTrust and ServiceRow extends it, so both callers pass the catalogue row itself and no toleratedDistrust list is copied. The file is unchanged and SEEING_LESS_REASONS still has one production location. | waived | Anticipated edit proved unnecessary; isRowPublishable already takes the shape both callers pass. | 2026-09-02T23:29:30.541Z | 2026-09-03T12:31:18.490Z |
| 26 | 05 | unrun-verify | features/officialControls.feature |  | Plan 05-17 mutation B (move the quiet-live-connection rule above the transport rule) fails no Cucumber scenario: no shipped scenario sets a quiet live path and an unready transport together. It is pinned at the unit tier alone, by the case added for it at test/accessories/controls.test.ts:696. Without that case the mutation would have failed nothing. | waived | Single-tier by necessity: no shipped scenario sets a quiet live path and an unready transport together. Pinned at the unit tier by the case added for it. | 2026-09-02T23:29:30.939Z | 2026-09-03T12:31:18.833Z |
| 27 | 05 | deviation | src/platform.ts |  | The DiscoveryContext half of ledger entry 14 (WR-05 in 05-REVIEW.md, WR-07 in 05-REVIEW-2.md) is closed: the platform now builds its runtime context in one local function the three callbacks call, and a static gate in test/platform.test.ts counts DiscoveryContext-shaped object literals and fails on a second one. Entry 14 stays open for its other half, IN-03 (shadow silence measured against a jumpable wall clock), which this plan did not touch | fixed |  | 2026-09-03T00:16:31.176Z | 2026-09-03T12:30:27.884Z |
| 28 | 05 | deviation | src/platform.ts |  | Plan 05-18 task 2 prescribed a parameterless local function returning the DiscoveryContext and reading runtime.commands from its closure. @typescript-eslint/no-use-before-define rejects that: the helper must be declared before the createAccountRuntimeFromConfig call whose callbacks use it, which puts its reference to runtime above the declarator. The command port is a parameter instead, which is also the harness shape (world.ts discoveryContext takes commands). One literal either way, and mutation F still fails on three layers | waived | Lint rejected the prescribed shape; the parameter form is the harness's own and makes the mutation fail the compiler rather than only the tests. | 2026-09-03T00:17:57.979Z | 2026-09-03T12:31:19.158Z |
| 29 | 05 | deviation | test/accessories/basementGuardian.test.ts |  | Plan 05-18 task 3 listed four files for the rename and the tree held a fifth caller: test/accessories/basementGuardian.test.ts imports the marking pass. The rename carried through it with no other edit | waived | A fifth caller was found and carried through the rename with no other edit. | 2026-09-03T00:17:58.292Z | 2026-09-03T12:31:19.507Z |
| 30 | 05 | deviation | README.md |  | 05-REVIEW-2.md WR-08 names README:151 alongside the pass name and docblock. Plan 05-18 does not list README.md in files_modified and its task 3 asks only for the source rename, the docblock and the report, so README:151 still reads 'Every service then stops answering whether the plugin vouches for it'. 05-REVIEW-2.md CR-04 already prescribes the README rewrite; this half stays with it | fixed |  | 2026-09-03T00:17:58.601Z | 2026-09-03T00:48:48.289Z |
| 31 | 05 | deviation | .planning/phases/05-degraded-operation-and-recovery/05-19-PLAN.md |  | Two premises of plan 05-19 did not survive measurement. Its ledger verify runs 'gsd-tools.cjs windows list', which is not a subcommand; the verbs are status, append, waive and fixed. And its task 1 verify fails when 'npm run format:check' names README.md or CHANGELOG.md, which it can never do: the script runs prettier over '**/*.{js,json,mjs,ts}' only. Markdown formatting is gated by the mdformat and markdownlint-cli2 pre-commit hooks, and both passed on the two files. | waived | Both false premises are corrected in the record; neither affected shipped behaviour. | 2026-09-03T00:49:01.522Z | 2026-09-03T12:31:19.847Z |
| 32 | 05 | deviation | .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md |  | The second gap-closure round table says the closing plan reconciles its rows against the summaries, while plan 05-19's prohibitions forbid editing an existing 05-VALIDATION.md table. Both cannot hold. The Status cells were left as the plans wrote them and every row's disposition was appended instead, under 'Second gap-closure round reconciliation'. Twenty-two rows in that table still read pending and are not. | fixed |  | 2026-09-03T00:49:01.812Z | 2026-09-03T17:28:08.307Z |
| 33 | 05 | deviation | .planning/phases/05-degraded-operation-and-recovery/05-VERIFICATION.md |  | 05-VERIFICATION.md lists 'README: the plugin holds no value back while it waits is now a true statement about the shipped code' among its gaps_closed, and 05-VALIDATION.md's gap-closure mutations table pins its documentation row on the same sentence. 05-REVIEW-2.md CR-04 showed the sentence false for the whole window its paragraph is about, and plan 05-19 deleted it. Neither record was edited: the report belongs to a verifier and the table to plan 05-10's round. A re-verification should settle both. | fixed |  | 2026-09-03T00:49:02.153Z | 2026-09-03T12:30:28.207Z |
| 34 | 05 | todo | src/device/state.ts |  | Telemetry ownership has no expiry of its own. CR-03 guarded establishing the watermark, as the review prescribed, not retaining it. Measured by the third verification (probe P9a): one telemetry heartbeat, then 17 metadata-only reports over four hours with the poll reporting 31 throughout, left the store frozen at 3, shadowSilent false, and every scope vouched for. This follows D-13 as written and plan 05-15's stated decision, and may be unreachable in practice if REST reads the same shadow. Wants a maintainer ruling on whether ownership should lapse on telemetry age rather than on message silence. | fixed |  | 2026-09-03T12:31:37.763Z | 2026-09-03T23:43:28.353Z |
| 35 | 05 | unrun-verify | src/device/state.ts |  | The carriesObservation narrowing is pinned at the unit tier alone. CR-03's fix reads patch.data in nextShadowVersion while carriesObservation still answers data or state, and the half that keeps a metadata-only report counting as the device speaking is proven by test/device/state.test.ts and by one scenario assertion. The third verification listed this among three protections living at one tier only, and unlike the other two it had no ledger entry. Recorded so a later reader does not mistake single-tier cover for absent cover. | open |  | 2026-09-03T12:31:38.115Z |  |
| 36 | 05 | deviation | .planning/STATE.md |  | Closing the Phase 1 requirement block (quick task 260903-ho5) makes two SYNC-03 sentences in STATE.md stale. Line 50, Current Position: "SYNC-03 stays pending with its reason recorded." Line 291, Accumulated Context: "[Phase 05]: SYNC-03 stays pending because its row sits in a Phase 1 block where no requirement is marked complete; closing one row of that block on Phase 5 evidence would misreport which phase delivered it". Both are now false: all twelve Phase 1 identifiers read Complete and SYNC-03 reads Phase 1, Phase 5. Prohibition 6 of plan 260903-ho5 forbade editing STATE.md here because a second session may share the working tree. Incidental finding, outside that task scope: line 386 in Blockers still carries "A shadow that goes silent never releases the telemetry watermark (src/device/state.ts pollTelemetry), so no REST poll refreshes telemetry for a device whose live path spoke and then stopped; releasing it on silence changes D-15/SYNC-03 and needs a decision" as an open concern, while ledger entry 5 records the same defect fixed on 2026-09-02 and SYNC-03 own amendment ratifies the fix. | open |  | 2026-09-03T17:17:18.027Z |  |
| 37 | 05 | unrun-verify | .planning/WINDOWS.md |  | WINDOWS ledger entry 2 reads fixed with no reason recorded, and its description still says "no test fails when it is removed" about dropping !halted from commandTransportReadyNow(). Quick task 260903-ho5 measured that this is stale: 05-VERIFICATION.md M12 re-ran the same mutation on 2026-09-03 and it fails 2 unit cases and 1 scenario, because WR-03 scope withdrawal and 05-16 cases made the term load-bearing. The ledger has no edit verb, so the correction is recorded here and in the First-round reconciliation note of 05-VALIDATION.md. First-round row 17 keeps a "green, mutation failed nothing" status because the row is a claim about its own named test and its own named mutation, and the tests that now pin the term were written by later rounds. | fixed |  | 2026-09-03T17:24:02.836Z | 2026-09-04T21:27:38.961Z |
| 38 | 05 | deviation | .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md |  | Entry 32 states twenty-two rows in the second gap-closure round table read pending. Quick task 260903-ho5 measured twenty-four. The file also holds two prose mentions of the pending marker that are not cells, which is the likeliest source of the difference. The ledger has no edit verb, so the correction is recorded here and in the Second-round reconciliation note of 05-VALIDATION.md. The 24 split by plan: 05-13 three rows, 05-14 four, 05-15 three, 05-16 four, 05-17 three, 05-18 five, 05-19 two. | open |  | 2026-09-03T17:28:08.692Z |  |
| 39 | 05 | deviation | .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md | 95 | First-round row 2 was reconciled to a status its citation did not carry, and the verification of quick task 260903-ho5 caught it. The cell read shipped, whose load-bearing clause is that the named mutation failed at the row's own tier; the row's command is node --test on monitoringHealth.test.js, but 05-01 mutation 2 names three cases that all live in test/runtime/accountRuntime.test.ts, and 05-01-SUMMARY.md:241 names no module at all, unlike every other 05-01 entry that failed a unit case. The mutation is structurally unreachable from that tier: isShadowSilent is private to monitoringHealth.ts:146, shadowConnected is a local of accountRuntime.ts:272, and monitoringHealth.test.ts imports only monitoringHealth.js and clock.js. Corrected to green, blind at this tier. The mutation was not re-run, so the correction rests on reachability rather than on a fresh measurement. This is ledger entry 33's shape reproduced inside the task written to repair it, at one cell of forty-six. | open |  | 2026-09-03T17:44:53.966Z |  |
| 40 | 05 | deviation | .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md | 762 | Ledger entry 38 and the second-round note both explained entry 32's twenty-two against the measured twenty-four by pointing at prose mentions of the pending marker. That explanation is impossible in the stated direction: a prose mention adds to a count, so it can only make twenty-four read as more, never as twenty-two. The note is corrected to say the cause is not established. Entry 38's description keeps the wrong reason because the ledger has no edit verb; read it with this entry. | open |  | 2026-09-03T17:44:54.281Z |  |
| 41 | 05 | todo | src/device/state.ts |  | Successor to entry 34, which asked for a maintainer ruling on whether telemetry ownership should lapse on telemetry age. The ruling: keep the guard, correct its stated reason, harden the test. Measured on 2026-09-03 by a 90-minute probe of one Gemini account with one device in steady state: seven messages, one get/accepted and six update/accepted, all seven carrying a telemetry section; six heartbeats each carrying both sections, six telemetry keys and wifi_signal_dbm as metadata, 584 bytes each; five consecutive heartbeat gaps averaging 898.4 s, re-confirming the recorded 898.3 s figure; and no document carrying device metadata without telemetry observed, so the metadata section never travelled alone. Not measured: one device only, steady state throughout, and no pump cycle, fault, power event, reconnect or firmware update, so event-driven vendor reports are unmeasured and six heartbeats is a small sample. The guard's behaviour did not change -- nextShadowVersion still reads patch.data and the production diff is comment-only -- while its stated reason did: the input it refuses is a telemetry section that is absent OR not an object, and isShadowDocument cannot refuse the second because it checks two levels only, the payload and its state. Arming the silence timer on telemetry rather than on any message remains an available option that nobody chose; it is recorded here as an option, deliberately not done. | waived | D-13 ruling: the silence timer keeps arming on any message, not on telemetry alone. The evidence is a 90-minute probe of one device in steady state -- seven messages, six heartbeats, and no pump cycle, fault, power event, reconnect or firmware update -- so event-driven vendor reports are unmeasured. Adopting the change would guard a shape nobody has observed, which is how entry 34's original false reason was born. | 2026-09-03T23:43:47.048Z | 2026-09-04T18:37:18.642Z |
| 42 | 05.1 | deviation | test/runtime/accountRuntime.test.ts |  | The silent-live-connection log line now names the deviceId; the shipped redaction case flipped from device:false to device:true (T-05.1-03 disposition). | waived | Confirmed correct, not a leak. The redaction case in test/runtime/accountRuntime.test.ts named 'names the controller and no route, no header, and no credential in the line a silent live connection records' (around line 2230) asserts device: true while scheme, authorization and secret all stay false. The log call site, liveReportingSilent(deviceId) in src/runtime/accountRuntime.ts (lines 78-83, called from recordFailure at line 589), interpolates only the vendor deviceId into the sentence; no route, header or credential is added. This matches the Phase 2 ruling of 2026-08-29 (STATE.md Accumulated Context, PROJECT.md D-027): the vendor deviceId is treated as non-sensitive and may enter logs and accessory context, with D-027 keeping it out of public artifacts only. D-14 (05.1-CONTEXT.md) is the decision that made this per-device change and states the same permission. The threat model disposition T-05.1-03 in 05.1-02-PLAN.md and 05.1-03-PLAN.md rates the same fact low severity and mitigate, and 05.1-02-SUMMARY.md records the device:false to device:true assertion flip as the plan's own D-14 instruction reaching a shipped assertion, not an accidental leak. No production code change needed. | 2026-09-04T04:25:17.091Z | 2026-09-04T21:13:55.243Z |
| 43 | 05.1 | deviation | src/runtime/accountRuntime.ts | 762 | A stray message from a removed device still re-arms lastShadowMessageAt via health.recordShadowMessage; the stamp is inert but nothing releases it | fixed |  | 2026-09-04T05:02:44.791Z | 2026-09-04T21:01:33.546Z |

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
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T02:30:06.953Z",
    "resolved_at": "2026-09-03T12:30:27.521Z"
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "05",
    "file": "README.md",
    "line": null,
    "description": "The 30-day vendor-block figure is sourced from src/cloud/auth.ts:35, outside the two files plan 05-05's acceptance criterion names",
    "status": "waived",
    "reason": "Sourcing note. The 30-day figure is correct and cited; only the file it came from sat outside the plan's named pair.",
    "recorded_at": "2026-09-02T03:35:44.273Z",
    "resolved_at": "2026-09-03T12:31:14.775Z"
  },
  {
    "id": 4,
    "kind": "todo",
    "phase": "05",
    "file": "README.md",
    "line": 220,
    "description": "Pre-existing: ## Project structure links src/platformAccessory.ts, which does not exist; the accessory lives under src/accessories/",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T03:35:44.625Z",
    "resolved_at": "2026-09-03T12:30:28.566Z"
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
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T12:34:29.998Z",
    "resolved_at": "2026-09-04T18:37:09.208Z"
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "test/platform.test.ts",
    "line": null,
    "description": "makes an accessory a successful inventory built unreadable in the same pass as a restored one: passes without the fix and fails no mutation; keep D1-D4 as the coverage of CR-03",
    "status": "waived",
    "reason": "Superseded. The plan's own D1-D4 mutations are the agreed coverage of CR-03, and CR-03 is closed and re-pinned by the third verification.",
    "recorded_at": "2026-09-02T13:47:07.171Z",
    "resolved_at": "2026-09-03T12:31:15.108Z"
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
    "status": "waived",
    "reason": "Recorded and still honest: the assertion moved from the retained heartbeat to the polled level, and the scenario asserts the same fact.",
    "recorded_at": "2026-09-02T15:54:12.932Z",
    "resolved_at": "2026-09-03T12:31:15.449Z"
  },
  {
    "id": 10,
    "kind": "deviation",
    "phase": "05",
    "file": "features/support/steps/harness.ts",
    "line": null,
    "description": "Plan 05-11 prescribed repairing scenarios with 'Given these reported device fields:'; that step wipes the full valid telemetry these scenarios need and the matching-value repair also destroys the heartbeat barrier the snapshot step provides. Repair used the second heartbeat instead",
    "status": "waived",
    "reason": "Executor chose a sounder repair than the plan prescribed; the prescribed step would have wiped the telemetry the scenarios need.",
    "recorded_at": "2026-09-02T15:54:13.289Z",
    "resolved_at": "2026-09-03T12:31:15.798Z"
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
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T16:16:03.522Z",
    "resolved_at": "2026-09-03T17:17:17.681Z"
  },
  {
    "id": 13,
    "kind": "unrun-verify",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md",
    "line": null,
    "description": "The 22 first-round Per-Task Verification Map rows still read pending. Plan 05-10 reconciled the gap-closure rows against their summaries and had no equivalent basis for the first round; three of those rows are the ones 05-VERIFICATION.md found green but blind",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T16:16:03.873Z",
    "resolved_at": "2026-09-03T17:24:02.509Z"
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
    "status": "waived",
    "reason": "Measured deviation from a plan prediction, explained in place. The behaviour is pinned; only the plan's predicted mutation outcome was wrong.",
    "recorded_at": "2026-09-02T17:55:13.303Z",
    "resolved_at": "2026-09-03T12:31:16.138Z"
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "05",
    "file": "src/runtime/accountRuntime.ts",
    "line": null,
    "description": "closeQuietly was relocated above haltOnTerminalAuthFailure, which 05-12-PLAN.md did not anticipate: @typescript-eslint/no-use-before-define rejects the new call site otherwise. Body unchanged. Relatedly, the entry-guard case could not use Promise.withResolvers (needs lib es2024, outside this plan's files) and captures the resolver by hand instead",
    "status": "waived",
    "reason": "Lint forced the relocation; body unchanged. No behaviour change.",
    "recorded_at": "2026-09-02T17:55:13.637Z",
    "resolved_at": "2026-09-03T12:31:16.487Z"
  },
  {
    "id": 17,
    "kind": "todo",
    "phase": "05",
    "file": "features/support/steps/harness.ts",
    "line": null,
    "description": "harness.ts keeps a private single-device currentAccessory reading registerPlatformAccessoryCalls[0].accessories[0], and a topicNamed built on a module-constant DEVICE_ID; neither was needed by the two-device work and neither was removed",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T20:38:24.798Z",
    "resolved_at": "2026-09-04T18:37:09.558Z"
  },
  {
    "id": 18,
    "kind": "todo",
    "phase": "05",
    "file": "features/support/steps/shadow.ts",
    "line": null,
    "description": "awaitSubscription waits on a cumulative published-topic count, so on a two-device account it answers once the client subscribed to either device; the two-pump scenarios wait for a value rather than for a subscription, so it was left as it is",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T20:38:25.145Z",
    "resolved_at": "2026-09-04T18:37:09.930Z"
  },
  {
    "id": 19,
    "kind": "todo",
    "phase": "05",
    "file": "src/accessories/basementGuardian.ts",
    "line": null,
    "description": "Shadow-silence marking is account-wide on a multi-device account: any silent pump makes every accessory stop vouching, so a two-pump owner is told the plugin cannot vouch for both systems when it can vouch for one. Deliberate in plan 05-14; the argument and its cost are recorded in 05-VALIDATION.md under Planning hazards. A diagnostics phase wanting per-device marking needs a per-device MonitoringTrust through onMonitoringHealth and applyMonitoringHealth.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-02T21:16:50.761Z",
    "resolved_at": "2026-09-04T18:37:10.276Z"
  },
  {
    "id": 20,
    "kind": "deviation",
    "phase": "05",
    "file": "test/runtime/monitoringHealth.test.ts",
    "line": null,
    "description": "Plan 05-14 task 1 had to touch two test files it did not list: npm run test:cucumber runs build:test over the whole test tsconfig, so the releaseShadowSource and recordShadowMessage call sites had to compile before the tracer task could be verified at all. Only the call sites moved in that commit; the substantive restatement landed in task 2.",
    "status": "waived",
    "reason": "Compilation necessity: the whole test tsconfig builds before Cucumber runs, so the call sites had to move for the tracer to be verifiable at all.",
    "recorded_at": "2026-09-02T21:16:51.116Z",
    "resolved_at": "2026-09-03T12:31:16.840Z"
  },
  {
    "id": 21,
    "kind": "deviation",
    "phase": "05",
    "file": "features/degradedOperation.feature",
    "line": null,
    "description": "Plan 05-14 mutation C (revert the admit call) failed nothing in the new scenario. The scenario's quiet pump heartbeats once before falling silent and recordShadowMessage stamps any device a message names, admitted or not, so the admit call is redundant for a pump that has ever spoken. It is pinned instead by five shipped scenarios and by the admission-seeding unit case.",
    "status": "waived",
    "reason": "Honest null result, pinned elsewhere. recordShadowMessage stamps any device a message names, so the admit call is redundant for a pump that has ever spoken.",
    "recorded_at": "2026-09-02T21:16:51.402Z",
    "resolved_at": "2026-09-03T12:31:17.187Z"
  },
  {
    "id": 22,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-15-PLAN.md",
    "line": null,
    "description": "Plan 05-15 stated that refusing to advance a held watermark on a metadata-only document would leave a later telemetry document at the same version judged stale, discarding a real reading. Measured: refusing the advance leaves the watermark BELOW the shadow's own version, so a superseded document is accepted over a newer reading. The shipped case pins the measured consequence.",
    "status": "waived",
    "reason": "Plan premise measured backwards and corrected; the shipped case pins the measured consequence.",
    "recorded_at": "2026-09-02T21:52:45.278Z",
    "resolved_at": "2026-09-03T12:31:17.532Z"
  },
  {
    "id": 23,
    "kind": "deviation",
    "phase": "05",
    "file": "test/accessories/basementGuardian.test.ts",
    "line": null,
    "description": "Plan 05-16 task 1 listed only the feature file and the accessory source, but its own coverage verify demands 100 percent branch coverage of basementGuardian.js and the new seam guard adds a branch no scenario can reach. Three unit cases were added in task 1, one per refusal path, which is also what proves all three leaking callers closed",
    "status": "waived",
    "reason": "Coverage necessity: the seam guard adds a branch no scenario can reach, so the plan's own 100 percent gate required the three unit cases.",
    "recorded_at": "2026-09-02T22:32:05.472Z",
    "resolved_at": "2026-09-03T12:31:17.842Z"
  },
  {
    "id": 24,
    "kind": "deviation",
    "phase": "05",
    "file": "test/accessories/basementGuardian.test.ts",
    "line": null,
    "description": "Plan 05-17's first draft of the withholding case used a field that failed family validation. gemini.ts:370 drops a violated scope's whole group before the accessory sees it, so the value was already absent for a second reason and mutation F left the case green. Rebuilt on a lost controller link, a valid boolean the decode keeps. Any later case asserting that a trust rule hides a control value must not use an invalid field.",
    "status": "waived",
    "reason": "Vacuous assertion caught by its own mutation and rebuilt on a reason the decode keeps. Fixed in a separate commit.",
    "recorded_at": "2026-09-02T23:29:21.047Z",
    "resolved_at": "2026-09-03T12:31:18.136Z"
  },
  {
    "id": 25,
    "kind": "deviation",
    "phase": "05",
    "file": "src/accessories/serviceCatalogue.ts",
    "line": null,
    "description": "Plan 05-17 listed serviceCatalogue.ts in files_modified and its artifacts, expecting a possible new exported predicate over a scope and the untrusted list. None was needed: isRowPublishable already takes a RowTrust and ServiceRow extends it, so both callers pass the catalogue row itself and no toleratedDistrust list is copied. The file is unchanged and SEEING_LESS_REASONS still has one production location.",
    "status": "waived",
    "reason": "Anticipated edit proved unnecessary; isRowPublishable already takes the shape both callers pass.",
    "recorded_at": "2026-09-02T23:29:30.541Z",
    "resolved_at": "2026-09-03T12:31:18.490Z"
  },
  {
    "id": 26,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "features/officialControls.feature",
    "line": null,
    "description": "Plan 05-17 mutation B (move the quiet-live-connection rule above the transport rule) fails no Cucumber scenario: no shipped scenario sets a quiet live path and an unready transport together. It is pinned at the unit tier alone, by the case added for it at test/accessories/controls.test.ts:696. Without that case the mutation would have failed nothing.",
    "status": "waived",
    "reason": "Single-tier by necessity: no shipped scenario sets a quiet live path and an unready transport together. Pinned at the unit tier by the case added for it.",
    "recorded_at": "2026-09-02T23:29:30.939Z",
    "resolved_at": "2026-09-03T12:31:18.833Z"
  },
  {
    "id": 27,
    "kind": "deviation",
    "phase": "05",
    "file": "src/platform.ts",
    "line": null,
    "description": "The DiscoveryContext half of ledger entry 14 (WR-05 in 05-REVIEW.md, WR-07 in 05-REVIEW-2.md) is closed: the platform now builds its runtime context in one local function the three callbacks call, and a static gate in test/platform.test.ts counts DiscoveryContext-shaped object literals and fails on a second one. Entry 14 stays open for its other half, IN-03 (shadow silence measured against a jumpable wall clock), which this plan did not touch",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-03T00:16:31.176Z",
    "resolved_at": "2026-09-03T12:30:27.884Z"
  },
  {
    "id": 28,
    "kind": "deviation",
    "phase": "05",
    "file": "src/platform.ts",
    "line": null,
    "description": "Plan 05-18 task 2 prescribed a parameterless local function returning the DiscoveryContext and reading runtime.commands from its closure. @typescript-eslint/no-use-before-define rejects that: the helper must be declared before the createAccountRuntimeFromConfig call whose callbacks use it, which puts its reference to runtime above the declarator. The command port is a parameter instead, which is also the harness shape (world.ts discoveryContext takes commands). One literal either way, and mutation F still fails on three layers",
    "status": "waived",
    "reason": "Lint rejected the prescribed shape; the parameter form is the harness's own and makes the mutation fail the compiler rather than only the tests.",
    "recorded_at": "2026-09-03T00:17:57.979Z",
    "resolved_at": "2026-09-03T12:31:19.158Z"
  },
  {
    "id": 29,
    "kind": "deviation",
    "phase": "05",
    "file": "test/accessories/basementGuardian.test.ts",
    "line": null,
    "description": "Plan 05-18 task 3 listed four files for the rename and the tree held a fifth caller: test/accessories/basementGuardian.test.ts imports the marking pass. The rename carried through it with no other edit",
    "status": "waived",
    "reason": "A fifth caller was found and carried through the rename with no other edit.",
    "recorded_at": "2026-09-03T00:17:58.292Z",
    "resolved_at": "2026-09-03T12:31:19.507Z"
  },
  {
    "id": 30,
    "kind": "deviation",
    "phase": "05",
    "file": "README.md",
    "line": null,
    "description": "05-REVIEW-2.md WR-08 names README:151 alongside the pass name and docblock. Plan 05-18 does not list README.md in files_modified and its task 3 asks only for the source rename, the docblock and the report, so README:151 still reads 'Every service then stops answering whether the plugin vouches for it'. 05-REVIEW-2.md CR-04 already prescribes the README rewrite; this half stays with it",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-03T00:17:58.601Z",
    "resolved_at": "2026-09-03T00:48:48.289Z"
  },
  {
    "id": 31,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-19-PLAN.md",
    "line": null,
    "description": "Two premises of plan 05-19 did not survive measurement. Its ledger verify runs 'gsd-tools.cjs windows list', which is not a subcommand; the verbs are status, append, waive and fixed. And its task 1 verify fails when 'npm run format:check' names README.md or CHANGELOG.md, which it can never do: the script runs prettier over '**/*.{js,json,mjs,ts}' only. Markdown formatting is gated by the mdformat and markdownlint-cli2 pre-commit hooks, and both passed on the two files.",
    "status": "waived",
    "reason": "Both false premises are corrected in the record; neither affected shipped behaviour.",
    "recorded_at": "2026-09-03T00:49:01.522Z",
    "resolved_at": "2026-09-03T12:31:19.847Z"
  },
  {
    "id": 32,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md",
    "line": null,
    "description": "The second gap-closure round table says the closing plan reconciles its rows against the summaries, while plan 05-19's prohibitions forbid editing an existing 05-VALIDATION.md table. Both cannot hold. The Status cells were left as the plans wrote them and every row's disposition was appended instead, under 'Second gap-closure round reconciliation'. Twenty-two rows in that table still read pending and are not.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-03T00:49:01.812Z",
    "resolved_at": "2026-09-03T17:28:08.307Z"
  },
  {
    "id": 33,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-VERIFICATION.md",
    "line": null,
    "description": "05-VERIFICATION.md lists 'README: the plugin holds no value back while it waits is now a true statement about the shipped code' among its gaps_closed, and 05-VALIDATION.md's gap-closure mutations table pins its documentation row on the same sentence. 05-REVIEW-2.md CR-04 showed the sentence false for the whole window its paragraph is about, and plan 05-19 deleted it. Neither record was edited: the report belongs to a verifier and the table to plan 05-10's round. A re-verification should settle both.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-03T00:49:02.153Z",
    "resolved_at": "2026-09-03T12:30:28.207Z"
  },
  {
    "id": 34,
    "kind": "todo",
    "phase": "05",
    "file": "src/device/state.ts",
    "line": null,
    "description": "Telemetry ownership has no expiry of its own. CR-03 guarded establishing the watermark, as the review prescribed, not retaining it. Measured by the third verification (probe P9a): one telemetry heartbeat, then 17 metadata-only reports over four hours with the poll reporting 31 throughout, left the store frozen at 3, shadowSilent false, and every scope vouched for. This follows D-13 as written and plan 05-15's stated decision, and may be unreachable in practice if REST reads the same shadow. Wants a maintainer ruling on whether ownership should lapse on telemetry age rather than on message silence.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-03T12:31:37.763Z",
    "resolved_at": "2026-09-03T23:43:28.353Z"
  },
  {
    "id": 35,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "src/device/state.ts",
    "line": null,
    "description": "The carriesObservation narrowing is pinned at the unit tier alone. CR-03's fix reads patch.data in nextShadowVersion while carriesObservation still answers data or state, and the half that keeps a metadata-only report counting as the device speaking is proven by test/device/state.test.ts and by one scenario assertion. The third verification listed this among three protections living at one tier only, and unlike the other two it had no ledger entry. Recorded so a later reader does not mistake single-tier cover for absent cover.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T12:31:38.115Z",
    "resolved_at": null
  },
  {
    "id": 36,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/STATE.md",
    "line": null,
    "description": "Closing the Phase 1 requirement block (quick task 260903-ho5) makes two SYNC-03 sentences in STATE.md stale. Line 50, Current Position: \"SYNC-03 stays pending with its reason recorded.\" Line 291, Accumulated Context: \"[Phase 05]: SYNC-03 stays pending because its row sits in a Phase 1 block where no requirement is marked complete; closing one row of that block on Phase 5 evidence would misreport which phase delivered it\". Both are now false: all twelve Phase 1 identifiers read Complete and SYNC-03 reads Phase 1, Phase 5. Prohibition 6 of plan 260903-ho5 forbade editing STATE.md here because a second session may share the working tree. Incidental finding, outside that task scope: line 386 in Blockers still carries \"A shadow that goes silent never releases the telemetry watermark (src/device/state.ts pollTelemetry), so no REST poll refreshes telemetry for a device whose live path spoke and then stopped; releasing it on silence changes D-15/SYNC-03 and needs a decision\" as an open concern, while ledger entry 5 records the same defect fixed on 2026-09-02 and SYNC-03 own amendment ratifies the fix.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T17:17:18.027Z",
    "resolved_at": null
  },
  {
    "id": 37,
    "kind": "unrun-verify",
    "phase": "05",
    "file": ".planning/WINDOWS.md",
    "line": null,
    "description": "WINDOWS ledger entry 2 reads fixed with no reason recorded, and its description still says \"no test fails when it is removed\" about dropping !halted from commandTransportReadyNow(). Quick task 260903-ho5 measured that this is stale: 05-VERIFICATION.md M12 re-ran the same mutation on 2026-09-03 and it fails 2 unit cases and 1 scenario, because WR-03 scope withdrawal and 05-16 cases made the term load-bearing. The ledger has no edit verb, so the correction is recorded here and in the First-round reconciliation note of 05-VALIDATION.md. First-round row 17 keeps a \"green, mutation failed nothing\" status because the row is a claim about its own named test and its own named mutation, and the tests that now pin the term were written by later rounds.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-03T17:24:02.836Z",
    "resolved_at": "2026-09-04T21:27:38.961Z"
  },
  {
    "id": 38,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md",
    "line": null,
    "description": "Entry 32 states twenty-two rows in the second gap-closure round table read pending. Quick task 260903-ho5 measured twenty-four. The file also holds two prose mentions of the pending marker that are not cells, which is the likeliest source of the difference. The ledger has no edit verb, so the correction is recorded here and in the Second-round reconciliation note of 05-VALIDATION.md. The 24 split by plan: 05-13 three rows, 05-14 four, 05-15 three, 05-16 four, 05-17 three, 05-18 five, 05-19 two.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T17:28:08.692Z",
    "resolved_at": null
  },
  {
    "id": 39,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md",
    "line": 95,
    "description": "First-round row 2 was reconciled to a status its citation did not carry, and the verification of quick task 260903-ho5 caught it. The cell read shipped, whose load-bearing clause is that the named mutation failed at the row's own tier; the row's command is node --test on monitoringHealth.test.js, but 05-01 mutation 2 names three cases that all live in test/runtime/accountRuntime.test.ts, and 05-01-SUMMARY.md:241 names no module at all, unlike every other 05-01 entry that failed a unit case. The mutation is structurally unreachable from that tier: isShadowSilent is private to monitoringHealth.ts:146, shadowConnected is a local of accountRuntime.ts:272, and monitoringHealth.test.ts imports only monitoringHealth.js and clock.js. Corrected to green, blind at this tier. The mutation was not re-run, so the correction rests on reachability rather than on a fresh measurement. This is ledger entry 33's shape reproduced inside the task written to repair it, at one cell of forty-six.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T17:44:53.966Z",
    "resolved_at": null
  },
  {
    "id": 40,
    "kind": "deviation",
    "phase": "05",
    "file": ".planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md",
    "line": 762,
    "description": "Ledger entry 38 and the second-round note both explained entry 32's twenty-two against the measured twenty-four by pointing at prose mentions of the pending marker. That explanation is impossible in the stated direction: a prose mention adds to a count, so it can only make twenty-four read as more, never as twenty-two. The note is corrected to say the cause is not established. Entry 38's description keeps the wrong reason because the ledger has no edit verb; read it with this entry.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T17:44:54.281Z",
    "resolved_at": null
  },
  {
    "id": 41,
    "kind": "todo",
    "phase": "05",
    "file": "src/device/state.ts",
    "line": null,
    "description": "Successor to entry 34, which asked for a maintainer ruling on whether telemetry ownership should lapse on telemetry age. The ruling: keep the guard, correct its stated reason, harden the test. Measured on 2026-09-03 by a 90-minute probe of one Gemini account with one device in steady state: seven messages, one get/accepted and six update/accepted, all seven carrying a telemetry section; six heartbeats each carrying both sections, six telemetry keys and wifi_signal_dbm as metadata, 584 bytes each; five consecutive heartbeat gaps averaging 898.4 s, re-confirming the recorded 898.3 s figure; and no document carrying device metadata without telemetry observed, so the metadata section never travelled alone. Not measured: one device only, steady state throughout, and no pump cycle, fault, power event, reconnect or firmware update, so event-driven vendor reports are unmeasured and six heartbeats is a small sample. The guard's behaviour did not change -- nextShadowVersion still reads patch.data and the production diff is comment-only -- while its stated reason did: the input it refuses is a telemetry section that is absent OR not an object, and isShadowDocument cannot refuse the second because it checks two levels only, the payload and its state. Arming the silence timer on telemetry rather than on any message remains an available option that nobody chose; it is recorded here as an option, deliberately not done.",
    "status": "waived",
    "reason": "D-13 ruling: the silence timer keeps arming on any message, not on telemetry alone. The evidence is a 90-minute probe of one device in steady state -- seven messages, six heartbeats, and no pump cycle, fault, power event, reconnect or firmware update -- so event-driven vendor reports are unmeasured. Adopting the change would guard a shape nobody has observed, which is how entry 34's original false reason was born.",
    "recorded_at": "2026-09-03T23:43:47.048Z",
    "resolved_at": "2026-09-04T18:37:18.642Z"
  },
  {
    "id": 42,
    "kind": "deviation",
    "phase": "05.1",
    "file": "test/runtime/accountRuntime.test.ts",
    "line": null,
    "description": "The silent-live-connection log line now names the deviceId; the shipped redaction case flipped from device:false to device:true (T-05.1-03 disposition).",
    "status": "waived",
    "reason": "Confirmed correct, not a leak. The redaction case in test/runtime/accountRuntime.test.ts named 'names the controller and no route, no header, and no credential in the line a silent live connection records' (around line 2230) asserts device: true while scheme, authorization and secret all stay false. The log call site, liveReportingSilent(deviceId) in src/runtime/accountRuntime.ts (lines 78-83, called from recordFailure at line 589), interpolates only the vendor deviceId into the sentence; no route, header or credential is added. This matches the Phase 2 ruling of 2026-08-29 (STATE.md Accumulated Context, PROJECT.md D-027): the vendor deviceId is treated as non-sensitive and may enter logs and accessory context, with D-027 keeping it out of public artifacts only. D-14 (05.1-CONTEXT.md) is the decision that made this per-device change and states the same permission. The threat model disposition T-05.1-03 in 05.1-02-PLAN.md and 05.1-03-PLAN.md rates the same fact low severity and mitigate, and 05.1-02-SUMMARY.md records the device:false to device:true assertion flip as the plan's own D-14 instruction reaching a shipped assertion, not an accidental leak. No production code change needed.",
    "recorded_at": "2026-09-04T04:25:17.091Z",
    "resolved_at": "2026-09-04T21:13:55.243Z"
  },
  {
    "id": 43,
    "kind": "deviation",
    "phase": "05.1",
    "file": "src/runtime/accountRuntime.ts",
    "line": 762,
    "description": "A stray message from a removed device still re-arms lastShadowMessageAt via health.recordShadowMessage; the stamp is inert but nothing releases it",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-04T05:02:44.791Z",
    "resolved_at": "2026-09-04T21:01:33.546Z"
  }
]
````
