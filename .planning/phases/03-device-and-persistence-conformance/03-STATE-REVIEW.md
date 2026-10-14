---
phase: 03-device-and-persistence-conformance
reviewed: 2026-10-14T15:58:26Z
depth: deep
files_reviewed: 2
files_reviewed_list:
  - src/device/state.ts
  - test/device/state.test.ts
reviewed_revision: aa826a50a0afeda9a95ab05d38240219bfcb5595
reviewer: /root/phase3_state/state_initial_review
review_round: 0
requirement: DEV-01
findings:
  critical: 3
  warning: 7
  info: 0
  total: 10
status: issues_found
---

# STATE full-file initial review

This is round 0 triage for plan 03-01, not a correction verdict.
Both complete files were read at `aa826a50a0afeda9a95ab05d38240219bfcb5595`.
Source blob: `37bc96dc27786c615ab6ab1e25103c272b048f27`.
Owner blob: `9ae189718297e65855369d48eb6dee04f465c005`.
The executable tree and Git index were clean at inspection. Neither scope path
is Git-ignored; no .codexignore was present.

AGENTS, agent-skills bootstrap, current plan/context/research/patterns/protocol,
canonical intel decisions, seed findings, Phase 1 state review and its 01-03
summary were read. All five complete TypeScript rulebooks were applied.
GSD_RUNTIME=codex configured-skill query returned comments/style/unit-review;
writer and local-verification were additionally read as the plan requires.
The installed Fallow skill and live CLI help were read before semantic queries.

## Narrative Findings (AI reviewer)

All locations below are qualified by the reviewed revision above. All findings
first opened in review 0, remain open, and concern DEV-01. No fix, evidence or
source-change commit has been made by this reviewer.

### BLOCKER findings

#### CR-03-STATE-001: Incomplete public snapshot and canonical-state expectations

**File:** `test/device/state.test.ts:378-400,579-602,725-739,897-915,933-943`.
**Rule:** Unit writer/reviewer, Assertions: whole public values, independent
expectations, and public state before interactions; reviewer classification
BLOCKER for weak or missing assertions.
**Issue:** The unversioned and first-versioned patch cases compare only water
level and watermark. The unversioned tracer never reads canonical storage.
A result containing just those fields, or an implementation returning the
right result while retaining the previous stored snapshot, passes that case.
The two-device release case independently proves the first whole snapshot
but its second assertion also passes when the second device is deleted.
The unknown-device release case observes only the held watermark, and the
unknown-device remove case observes only IDs; changes to the held device's
other facts pass. Listener-failure containment compares only the returned
water level before interaction observations.
**Fix:** Independently author complete expected snapshots for these envelope/
unchanged-store promises and compare both returned snapshots where available
and `store.snapshot(deviceId)`. Compare the complete second released snapshot.
Retain scalar assertions when a scalar is the actual promise, such as receipt
time at 450-462 and the reported running flag at 617-629.
**Outcome/evidence:** Confirmed by complete source and case reads. This is
assertion maintenance, not evidence of an existing production defect. The
tracer is `applies an unversioned patch and leaves the applied version where
the last versioned patch set it`; any negative control must remain separate
from production RED and restore exact source bytes.

#### CR-03-STATE-002: Listener recorder discards most of the promised envelopes

**File:** `test/device/state.test.ts:35-41,88-91,758-784,827-837,854-879,897-914`.
**Rule:** Unit writer/reviewer, Assertions: compare whole values and every
promised result; Test doubles: assert notification arguments when notifying
is the public behavior. BLOCKER for weak assertions.
**Issue:** `recordInto` turns each callback into changed keys and two water-level
scalars. The case titled `reports the merged snapshot, the snapshot it replaced,
and the one key that changed` never checks either whole callback snapshot.
A listener receiving a fabricated next/previous object with only
`data.water_level` passes; the structured-change cases do not observe the
changed structured value at all. The first-discovery case only proves that
the prior water level is undefined, not that the prior snapshot is undefined.
These callback payloads drive the actual platform live update at
`src/platform.ts:173-176`.
**Fix:** Record `next`, `previous`, and `changedKeys` without projecting their
content. Independently compare complete notification records and public
stored/returned state before the interaction checks. Preserve empty-list
assertions for actual no-notification promises.
**Outcome/evidence:** Confirmed through the complete owner and the platform
callback body. No current wrong callback payload was observed; this is
assertion maintenance, with no genuine RED claim.

#### CR-03-STATE-003: Repeated release cannot detect receipt-time restamping

**File:** `test/device/state.test.ts:644-671`.
**Rule:** Unit writer/reviewer, opening discrimination requirement and
Assertions; Patterns/Time: use an injected clock. BLOCKER for a case a plausible
wrong implementation would pass.
**Issue:** The case claims a later release moves no value, specifically receipt
time. It builds `fixedStoreOptions()`, whose clock always returns FIRST_RECEIPT.
The existing whole snapshot expectation therefore also passes if
`releaseShadowSource` incorrectly sets receivedAt to clock.now() on every
call. Two calls never simulate the later local time the title and rationale
describe.
**Fix:** Inject a mutable clock, discover/patch at FIRST_RECEIPT, advance it
before release and again before the repeated release, and keep the complete
independent canonical snapshot and empty notification expectations.
**Outcome/evidence:** Confirmed by the fixed clock definition at 84-85 and the
complete case. Source 385-390 currently preserves receipt time. This is a
test-fixture discrimination defect, not a production bug or SC-03 reopening.

### WARNING findings

#### CR-03-STATE-004: State source omits the approved header sections

**File:** `src/device/state.ts:1-6`.
**Rule:** D-01 and Google style, Files and modules: separate copyright,
fileoverview, imports and implementation sections.
**Issue:** The SPDX line is followed immediately by imports; copyright and
fileoverview JSDoc are absent. The already reviewed owner header at 1-9 is
correct.
**Fix:** Keep SPDX first; add separate Copyright (c) 2026 Alessandro Colomba
and concise @fileoverview blocks with one blank line between sections.
**Outcome/evidence:** Confirmed by independently inspecting both full headers.
Header-only work stays separate from functional causes.

#### CR-03-STATE-005: Public documentation omits contracts and embeds internals

**File:** `src/device/state.ts:8,83-85,93-100,109-143`.
**Rule:** Google style, Comments and documentation: document non-obvious public
members; JSDoc for users and // for implementation notes. Canonical decisions
C-002 and D-030 qualify identity mutability.
**Issue:** applyDiscovery has a substantial ownership/time/merge contract but
no JSDoc; snapshot and deviceIds omit their absence/list contracts. remove
JSDoc explains the private toSnapshot branch. releaseShadowSource JSDoc
describes nextShadowVersion internals and extensive socket/replay reasoning.
DeviceIdentity's overview says all enclosed facts never change, although the
name changes in owner 125-147 and C-002 permits deviceTypeId changes for the
same deviceId. These descriptions confuse physical identity with profile
selection and mutable vendor display facts.
**Fix:** Document observable method behavior concisely. Move implementation
rationale beside its implementation, retaining sourced safety/clock/watermark
reasons and durable IDs. Describe DeviceIdentity as identifying/display facts
for one physical system and reserve immutability for deviceId.
**Outcome/evidence:** Confirmed from source, canonical decisions, actual
constructors, platform consumers and rename case. No declaration or runtime
behavior change is required.

#### CR-03-STATE-006: Local telemetry input uses the forbidden generic name

**File:** `test/device/state.test.ts:222-228`.
**Rule:** Unit writer/reviewer, Naming values: use production roles and do not
name a local value data.
**Issue:** The writable fixture local is named data instead of identifying its
role as supplied vendor telemetry.
**Fix:** Rename only the local to vendorTelemetry (including shorthand mapping
`data: vendorTelemetry` and its mutation). Preserve canonical/vendor field
names named data.
**Outcome/evidence:** Confirmed; bounded test readability cause.

#### CR-03-STATE-007: Test rationale narrates an obsolete guard

**File:** `test/device/state.test.ts:465-469`.
**Rule:** TypeScript comments, Forbidden: narration of code that no longer
exists; comments describe current behavior and its reason.
**Issue:** `because conflating them is what the wider guard did` records an
earlier implementation instead of the current metadata/telemetry distinction.
**Fix:** Keep the present-tense safety rationale about receipt time and
telemetry ownership; remove the obsolete-guard narration. Preserve CR-03,
SYNC-02 and D-014 where they identify durable requirements.
**Outcome/evidence:** This is the accepted portion of the rationale seed.
The other rationale blocks at 493-496,644-647,694-697,722-724 describe
non-obvious setup/ownership scenarios above their cases and are retained:
the rule permits explanatory setup comments. There is no finding merely
because such comments are longer than AAA markers.

#### CR-03-STATE-008: Reused data seeds remain inside the owner

**File:** `test/device/state.test.ts:43-58`.
**Rule:** Unit writer/reviewer, Test data and Test support organization:
cross-case fresh seeds live in their concern seed module.
**Issue:** geminiDevice and geminiIdentity are reused data constructors in the
owner instead of a concern seed module. They already return fresh literals,
so this is organization rather than shared-state contamination.
**Fix:** Move these fresh seed functions to conditional
`test/device/stateSeeds.ts`, with the approved header and role-specific typed
exports. Retain independently written expected values; do not derive expected
snapshots from production output. Do not move behavioral store/log/notification
helpers speculatively. The actual helper must receive independent full review
and broad staged verification.
**Outcome/evidence:** Confirmed from definitions and uses across the complete
owner. No existing stateSeeds file was in the baseline inventory.

#### CR-03-STATE-009: Non-throwing cases collapse act and assert

**File:** `test/device/state.test.ts:981-998`.
**Rule:** Unit writer, Case structure: act & assert only for one assert.throws
or assert.rejects expression; separate arrange/act/assert otherwise.
**Issue:** The unknown snapshot and empty deviceIds cases put non-throwing
reads inside assertions under act & assert.
**Fix:** Obtain the snapshot/identifiers in an act section and assert the
literal promised values in a separate assert section.
**Outcome/evidence:** Confirmed; no behavior change and no need to repeat
toolchain-owned style checks.

#### CR-03-STATE-010: Compile contracts are wrapped as runtime cases

**File:** `test/device/state.test.ts:320-339`.
**Rule:** Unit writer, Patterns/Type-only modules and Do not test what a gate
already enforces; unit reviewer, Case structure and meaningful public behavior.
**Issue:** These two test callbacks contain only satisfies/@ts-expect-error
compile checks. At runtime they merely evaluate and discard literals. The
meaningful contract is compiler rejection of desired fields, not a runtime
behavior observed by these cases; their act & assert markers perform neither
a throwing nor rejection expression.
**Fix:** Preserve both meaningful desired/acknowledgement negative compile
contracts as top-level satisfies/@ts-expect-error checks in the owner.
Remove only their synthetic runtime wrappers and misleading AAA markers.
**Outcome/evidence:** Confirmed structure issue, classified WARNING rather
than claiming an uncovered runtime production defect. Strict compilation
continues to enforce the actual contract.

## Six seed dispositions

| Seed | Current outcome | Source/rule evidence |
| --- | --- | --- |
| Required undefined versus optional members | Rejected as a finding; preserve required keys | state 38-62,223-231,280-288; cloud/shadow 197-205 constructs every patch key; exactOptionalPropertyTypes distinguishes omission from explicit undefined. D-05/D-06 outweigh cosmetic optionalization; Google style Types does not erase the complete public shape. |
| Snapshot readonly members | Rejected as a mandatory interface violation | Google style Classes readonly requirement applies to class properties; state 24-43 is an interface. Fresh exact semantic traces and actual constructors/readers found no required snapshot writes. Runtime freeze at 181-187 implements immutability. No readonly edit, arbitrary deep mapped type, or new mutability contract is justified by that class-only seed. |
| Public JSDoc versus implementation notes | Accepted, CR-03-STATE-005; source header separately CR-03-STATE-004 | Missing public member contract and private implementation narration cited above; identity overview qualified by C-002/D-030. |
| Local data naming versus canonical field | Accepted, CR-03-STATE-006 | Only the fixture local at 222 is generic. Public data members are protocol/canonical vocabulary and remain unchanged. |
| In-case rationale | Partly accepted, CR-03-STATE-007; blanket deletion rejected | Current seed blocks are above cases. Preserve non-obvious setup rationale under the exception; remove only past implementation narration at 466. |
| Incomplete whole promises | Accepted, CR-03-STATE-001/002; additional clock weakness CR-03-STATE-003 | Selected envelope/canonical/notification promises remain incomplete. Genuine scalar promises, whole opaque data assertions, and empty notification lists remain legitimate. |

## SC-03 preservation and production-candidate assessment

SC-03 remains fixed at this revision: complete discovery envelope 242-255;
complete nested telemetry plus presence before frozen check 266-276; complete
version row returns and canonical readbacks 355-374; metadata watermark
return and canonical refusal 501-517; complete nested metadata and presence
541-551; merged frozen snapshot presence 563-574; released stored snapshot
presence 682-691. No fixed SC-03 finding reopens. No global D-03 stop is
triggered by round 0. New independent assertion causes above do not reset the
future STATE correction-round counter.

The shallow-copy/deep-freeze ownership candidate was traced, not accepted as a
production bug. state 153-187,206-207 shares nested JSON objects with incoming
readonly records and freezes those aliases; the top-level vendor mutation
case 220-231 remains valid. cloud/types ApiDevice.data is readonly and the
actual JSON-normalization/ingress paths do not subsequently mutate nested
input: cloud/types toApiDevice, shadow 197-205/264-284, runtime 393-425/825-866.
No separately documented writable nested-alias preservation promise or
consumer relying on it was found. Arbitrary Maps, cycles, accessors and
non-JSON class instances do not establish a defect against these actual
JSON-ingress contracts. This assessment preserves the existing top-level
writable fixture and runtime-deep-frozen snapshots; it does not authorize
new input ownership behavior. No genuine production defect, security
vulnerability, or production RED evidence was established.

Monotonic refusals, telemetry-only watermark acquisition, metadata receipt
observations, local/device clock separation, named-device release and the
fixed private-error-safe log message were traced through their public paths.
The fixed listener log at state 315-330 and owner 897-915 is a documented
privacy promise, so its exact safe message assertion is legitimate.
No logger-call style defect is opened for it.

## Exact semantic consumer evidence

Fresh queries ran at the reviewed revision. CLI help validated flags; the
installed configuration contains no remote extends. Each command used
`./node_modules/.bin/fallow dead-code --type-aware --type-aware-project
<project> --symbol-impact src/device/state.ts:<symbol> --format json --quiet
--no-cache`. stdout was valid kind=impact JSON, stderr was empty, raw process
exit was 0, status and identity.completeness were complete, and confidence
was high for all six. These are exact symbol-consumer queries, not tsc or
coverage evidence.

| Symbol | Project | Direct consumers | Targeted owner count |
| --- | --- | --- | --- |
| DeviceSnapshot | tsconfig.json | src/accessories/basementGuardian.ts; src/device/family.ts; src/device/gemini.ts; src/platform.ts | 0 |
| DeviceSnapshot | tsconfig.test.json | preceding four; features/real-pump/support/realWorld.ts; features/support/steps/shadow.ts; features/support/world.ts; test/accessories/basementGuardian.test.ts; test/device/gemini.test.ts; test/device/state.test.ts; test/runtime/accountRuntime.test.ts | 4 |
| DeviceIdentity | tsconfig.json | none outside its declaring module | 0 |
| DeviceIdentity | tsconfig.test.json | test/device/state.test.ts | 1 |
| ReportedPatch | tsconfig.json | src/cloud/shadow.ts; src/runtime/accountRuntime.ts | 0 |
| ReportedPatch | tsconfig.test.json | preceding two; test/cloud/shadow.test.ts; test/device/state.test.ts; test/platform.test.ts; test/runtime/accountRuntime.test.ts | 4 |

Production project config hash:
`sha256:21136545e03add83002d24624dc948bec8da00383132c13a0882182a003d9a26`.
Test project config hash:
`sha256:d84fa7d40c0319006004dc8560f0e84f3dee27cc3a3f1353bcb201f05c00e3b8`.
Semantic schema version 3, backend typescript-go. All six queries returned
empty affected_files; absence of those entries is not absence of direct
consumers or unknown externally published API use.

Actual bodies/constructors were read, including family 180-194, Gemini
219-222/360-374, basementGuardian 449-460/988-1063, platform 173-176/282-334,
cloud shadow 197-205/264-284, runtime 393-425/825-866; test snapshot/patch
constructors in Gemini 114-125, basementGuardian 453-466, runtime 602-604,
platform 609-611, shadow 192-194; feature World snapshot 439-448, shadow
steps 325-338, real World 152-154. Text search found no assignment to public
snapshot envelope members. This is bounded compatibility reading, not a
full review of these outside files.

## Verification and counters

The coordinator supplied a fresh same-session
`npm run build:test && node --test --test-reporter=tap
dist-test/test/device/state.test.js` run: exit 0, 54 tests, 54 pass,
0 fail/skip/cancel, on unchanged baseline
`aa826a50a0afeda9a95ab05d38240219bfcb5595`. Node v26.11.1 was independently
observed. The reviewer ran no build, owner test, coverage, static gate,
mutation control, audit/commit hook, install, live profile or Git mutation.

Fresh static and direct-pair evidence is pending with the coordinator.
Prior Phase 1 metrics are preservation context, not new unchanged-input
same-session verification. No scheduled/missing-yet gate is misreported as
a source defect. A full combined gate remains required for the wave and phase.

| Review | Opening | Fixed | Rejected accepted IDs | New | Reopened | Closing |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial round 0 | 10 | 0 | 0 | 0 | 0 | 10 |

There are three BLOCKER assertion-maintenance causes and seven WARNING
conformance causes. Rejected seed candidates do not enter the accepted-ID
counter. No source/test/helper was modified; only this assigned report was
written. No cause is fixed or committed yet. DEV-01 remains pending.

## Native Fallow output retained

The following stdout is retained without rewriting its JSON content. Every
query has raw exitCode 0 and empty stderr. The per-query project and symbol
are part of the exact command template above.

### tsconfig.json: DeviceSnapshot

exitCode: 0; stderr: empty.

```json
{"kind":"impact","target":{"path":"src/device/state.ts","namespace":"type","declaration_kind":"export","exported_name":"DeviceSnapshot","local_name":"DeviceSnapshot","line":24,"col":17},"identity":{"mode":"type-aware","semantic_schema_version":3,"capabilities":["symbol-impact"],"project_config_hash":"sha256:21136545e03add83002d24624dc948bec8da00383132c13a0882182a003d9a26","backend_family":"typescript-go","completeness":"complete"},"selected_project":"tsconfig.json","assertion":"consumers-found","status":"complete","direct_consumers":[{"path":"src/accessories/basementGuardian.ts","relation":"direct-type-consumer","distance":1},{"path":"src/device/family.ts","relation":"direct-type-consumer","distance":1},{"path":"src/device/gemini.ts","relation":"direct-type-consumer","distance":1},{"path":"src/platform.ts","relation":"direct-type-consumer","distance":1}],"total_direct_consumer_count":4,"affected_files":[],"total_affected_file_count":0,"targeted_tests":[],"total_targeted_test_count":0,"confidence":"high"}
```

### tsconfig.json: DeviceIdentity

exitCode: 0; stderr: empty.

```json
{"kind":"impact","target":{"path":"src/device/state.ts","namespace":"type","declaration_kind":"export","exported_name":"DeviceIdentity","local_name":"DeviceIdentity","line":9,"col":17},"identity":{"mode":"type-aware","semantic_schema_version":3,"capabilities":["symbol-impact"],"project_config_hash":"sha256:21136545e03add83002d24624dc948bec8da00383132c13a0882182a003d9a26","backend_family":"typescript-go","completeness":"complete"},"selected_project":"tsconfig.json","assertion":"no-consumers-found","status":"complete","direct_consumers":[],"total_direct_consumer_count":0,"affected_files":[],"total_affected_file_count":0,"targeted_tests":[],"total_targeted_test_count":0,"confidence":"high"}
```

### tsconfig.json: ReportedPatch

exitCode: 0; stderr: empty.

```json
{"kind":"impact","target":{"path":"src/device/state.ts","namespace":"type","declaration_kind":"export","exported_name":"ReportedPatch","local_name":"ReportedPatch","line":53,"col":17},"identity":{"mode":"type-aware","semantic_schema_version":3,"capabilities":["symbol-impact"],"project_config_hash":"sha256:21136545e03add83002d24624dc948bec8da00383132c13a0882182a003d9a26","backend_family":"typescript-go","completeness":"complete"},"selected_project":"tsconfig.json","assertion":"consumers-found","status":"complete","direct_consumers":[{"path":"src/cloud/shadow.ts","relation":"direct-type-consumer","distance":1},{"path":"src/runtime/accountRuntime.ts","relation":"direct-type-consumer","distance":1}],"total_direct_consumer_count":2,"affected_files":[],"total_affected_file_count":0,"targeted_tests":[],"total_targeted_test_count":0,"confidence":"high"}
```

### tsconfig.test.json: DeviceSnapshot

exitCode: 0; stderr: empty.

```json
{"kind":"impact","target":{"path":"src/device/state.ts","namespace":"type","declaration_kind":"export","exported_name":"DeviceSnapshot","local_name":"DeviceSnapshot","line":24,"col":17},"identity":{"mode":"type-aware","semantic_schema_version":3,"capabilities":["symbol-impact"],"project_config_hash":"sha256:d84fa7d40c0319006004dc8560f0e84f3dee27cc3a3f1353bcb201f05c00e3b8","backend_family":"typescript-go","completeness":"complete"},"selected_project":"tsconfig.test.json","assertion":"consumers-found","status":"complete","direct_consumers":[{"path":"features/real-pump/support/realWorld.ts","relation":"direct-type-consumer","distance":1},{"path":"features/support/steps/shadow.ts","relation":"direct-type-consumer","distance":1},{"path":"features/support/world.ts","relation":"direct-type-consumer","distance":1},{"path":"src/accessories/basementGuardian.ts","relation":"direct-type-consumer","distance":1},{"path":"src/device/family.ts","relation":"direct-type-consumer","distance":1},{"path":"src/device/gemini.ts","relation":"direct-type-consumer","distance":1},{"path":"src/platform.ts","relation":"direct-type-consumer","distance":1},{"path":"test/accessories/basementGuardian.test.ts","relation":"direct-type-consumer","distance":1},{"path":"test/device/gemini.test.ts","relation":"direct-type-consumer","distance":1},{"path":"test/device/state.test.ts","relation":"direct-type-consumer","distance":1},{"path":"test/runtime/accountRuntime.test.ts","relation":"direct-type-consumer","distance":1}],"total_direct_consumer_count":11,"affected_files":[],"total_affected_file_count":0,"targeted_tests":[{"path":"test/accessories/basementGuardian.test.ts","relation":"targeted-test","distance":1,"via":["test/accessories/basementGuardian.test.ts"]},{"path":"test/device/gemini.test.ts","relation":"targeted-test","distance":1,"via":["test/device/gemini.test.ts"]},{"path":"test/device/state.test.ts","relation":"targeted-test","distance":1,"via":["test/device/state.test.ts"]},{"path":"test/runtime/accountRuntime.test.ts","relation":"targeted-test","distance":1,"via":["test/runtime/accountRuntime.test.ts"]}],"total_targeted_test_count":4,"confidence":"high"}
```

### tsconfig.test.json: DeviceIdentity

exitCode: 0; stderr: empty.

```json
{"kind":"impact","target":{"path":"src/device/state.ts","namespace":"type","declaration_kind":"export","exported_name":"DeviceIdentity","local_name":"DeviceIdentity","line":9,"col":17},"identity":{"mode":"type-aware","semantic_schema_version":3,"capabilities":["symbol-impact"],"project_config_hash":"sha256:d84fa7d40c0319006004dc8560f0e84f3dee27cc3a3f1353bcb201f05c00e3b8","backend_family":"typescript-go","completeness":"complete"},"selected_project":"tsconfig.test.json","assertion":"consumers-found","status":"complete","direct_consumers":[{"path":"test/device/state.test.ts","relation":"direct-type-consumer","distance":1}],"total_direct_consumer_count":1,"affected_files":[],"total_affected_file_count":0,"targeted_tests":[{"path":"test/device/state.test.ts","relation":"targeted-test","distance":1,"via":["test/device/state.test.ts"]}],"total_targeted_test_count":1,"confidence":"high"}
```

### tsconfig.test.json: ReportedPatch

exitCode: 0; stderr: empty.

```json
{"kind":"impact","target":{"path":"src/device/state.ts","namespace":"type","declaration_kind":"export","exported_name":"ReportedPatch","local_name":"ReportedPatch","line":53,"col":17},"identity":{"mode":"type-aware","semantic_schema_version":3,"capabilities":["symbol-impact"],"project_config_hash":"sha256:d84fa7d40c0319006004dc8560f0e84f3dee27cc3a3f1353bcb201f05c00e3b8","backend_family":"typescript-go","completeness":"complete"},"selected_project":"tsconfig.test.json","assertion":"consumers-found","status":"complete","direct_consumers":[{"path":"src/cloud/shadow.ts","relation":"direct-type-consumer","distance":1},{"path":"src/runtime/accountRuntime.ts","relation":"direct-type-consumer","distance":1},{"path":"test/cloud/shadow.test.ts","relation":"direct-type-consumer","distance":1},{"path":"test/device/state.test.ts","relation":"direct-type-consumer","distance":1},{"path":"test/platform.test.ts","relation":"direct-type-consumer","distance":1},{"path":"test/runtime/accountRuntime.test.ts","relation":"direct-type-consumer","distance":1}],"total_direct_consumer_count":6,"affected_files":[],"total_affected_file_count":0,"targeted_tests":[{"path":"test/cloud/shadow.test.ts","relation":"targeted-test","distance":1,"via":["test/cloud/shadow.test.ts"]},{"path":"test/device/state.test.ts","relation":"targeted-test","distance":1,"via":["test/device/state.test.ts"]},{"path":"test/platform.test.ts","relation":"targeted-test","distance":1,"via":["test/platform.test.ts"]},{"path":"test/runtime/accountRuntime.test.ts","relation":"targeted-test","distance":1,"via":["test/runtime/accountRuntime.test.ts"]}],"total_targeted_test_count":4,"confidence":"high"}
```

## Header and unversioned tracer repair

Fixer: `/root/phase3_state/state_tracer_fix`, role `gsd-code-fixer`.
Scope is only 03-01-01. This records initial repairs, not a correction round.
Initial review history and its ten accepted IDs remain above unchanged.

The persisted `.gsd/dispatch-isolation-sentinel.json` was read directly:
isolation `none`, phase `03`, plan `03-01`, written_at `1791993068541`.
All verification ran in the existing `features/code-review-sweep` checkout,
not a new isolated worktree. The pre-plan ledger
`gsd-plan-head-before-03-01` in the resolved Git directory was persisted as
`aa826a50a0afeda9a95ab05d38240219bfcb5595` before the first commit.
No isolation query, branch switch, install or live integration was performed.

CR-03-STATE-004 has its minimum header repair in
`5808523c26899d15f8f0a4b0be7b147de6863d86`:
`style(state): add canonical source file header`.
The actual sole committed path is `src/device/state.ts`, with nine added
lines and no deletions. SPDX remains first, with separate copyright and
overview JSDoc blocks and exactly one blank line between sections/imports.
No source declaration or runtime behavior changed. The complete owner
header remains correct and unchanged. Independent correction review is pending.

CR-03-STATE-001 is partially repaired: its unversioned water-level-3 tracer
replaces two selected-property checks with one independent whole
`DeviceSnapshot` expectation, used for both the returned value and public
`store.snapshot(DEVICE_ID)` readback. It preserves version 5, connectivity,
identity, all omitted telemetry, empty metadata, device time
`1700000000000` and separate local receipt time `1700000777000`.
Expected values are authored literals, not derived from the returned snapshot.
Other CR-03-STATE-001 sites remain pending. CR-03-STATE-002/003/005 through
010 remain pending. No new seed helper or production-bug RED record was needed.
All original SC-03 whole/frozen-presence/canonical-refusal assertions remain
unchanged. No reopening or D-03 stop was found.

### Native tracer and control evidence

Every experiment used `npm run build:test`, followed by
`node --test --test-reporter=tap dist-test/test/device/state.test.js`.
Node was `v26.11.1`; reviewed source revision was
`5808523c26899d15f8f0a4b0be7b147de6863d86` with only the tracer test diff.
Initial tracer build/owner both exited 0, with 54/54 tests passing and no
failed, skipped or cancelled tests. These are assertion controls against
implemented behavior, not unchanged-production bug RED.

Both mutations applied only when `patch.version === undefined` and
`patch.data?.water_level === 3`, leaving every SC-03 case untouched.

| Control | UTC owner start | Native build / owner exits | Intended failure | Restored build / owner exits |
| --- | --- | --- | --- | --- |
| Correct returned snapshot, previous canonical snapshot retained | 2026-10-14T16:05:58.533692Z | 0 / 1 | Tracer canonical expectation: actual water level 1 versus expected 3; ERR_ASSERTION | 0 / 0; 54/54 |
| Correct canonical snapshot, returned connectivity.connected false | 2026-10-14T16:06:25.052472Z | 0 / 1 | Tracer returned expectation: actual connected false versus expected true; ERR_ASSERTION | 0 / 0; 54/54 |

The named target was `applies an unversioned patch and leaves the applied
version where the last versioned patch set it`. Each mutated run executed
all 54 tests: 53 passed, only the intended target failed, zero skipped or
cancelled. The canonical failure was the second whole assertion at compiled
owner line 318; the envelope failure was the first at line 317. Both earlier
selected-property assertions would miss these controls.

Canonical control replaced the store write with:

```typescript
snapshots.set(deviceId, patch.version === undefined && patch.data?.water_level === 3 ? previous : snapshot);
```

Envelope control replaced the patch return with:

```typescript
return patch.version === undefined && patch.data?.water_level === 3 ? freeze({ ...snapshot, connectivity: { ...snapshot.connectivity, connected: false } }) : snapshot;
```

After each control, `cmp src/device/state.ts /tmp/state-tracer-original.ts`
exited 0 and `git diff -- src/device/state.ts` was empty against the header
commit. Restored source SHA-256 is
`070c580951f786152b5105da9d6776e742345e1740aec5c5751c1d2d0bda06bd`.
Mutated source SHA-256 values were respectively
`15f6b1f0708ed5da92c9e127bc4995f7013ec657a3202076818be75ac84a56ac`
and `ce742dd8d572137a37decf9758fdc270925768e3ed949890a39681bad73ef0ee`.
The unchanged tracer-owner SHA-256 throughout was
`ef19760354a7624725d167d8b9f9dc2a2aa656f79f3c3027808981ec4458865d`.
The source diff against the batch baseline contains only the approved header.

Full unmodified stdout/stderr, exact command arrays, start/end timestamps,
raw exits, Node version, revision, complete source/owner patches and SHA-256
values are retained under `/tmp/state-tracer-evidence/` in
`canonical-control-build.json`, `canonical-control-owner.json`,
`canonical-restored-build.json`, `canonical-restored-owner.json`,
`envelope-control-build.json`, `envelope-control-owner.json`,
`envelope-restored-build.json` and `envelope-restored-owner.json`.
Exact restored source bytes remain `/tmp/state-tracer-original.ts`.

`npm run test:coverage:direct -- src/device/state.ts test/device/state.test.ts`
started at 2026-10-14T16:06:58.795134Z and exited 0 at
16:07:02.042026Z. This selector builds freshly and runs only the state pair.
A native module-only LCOV run on the same compiled inputs exited 0 and
recorded lines 231/231, functions 23/23 and branches 61/61: all 100%.
Its exact command and raw exit are in `tracer-native-counts.json`, complete
TAP in `/tmp/state-tracer-native-coverage.tap` and the single LCOV record in
`/tmp/state-tracer-native.lcov`. This is focused evidence; the coordinator
owns the full combined `npm run check` gate.

### Guard, audit and commit evidence

Installed Fallow 3.27.0 skill and live root/guard/audit help were read.
Guard ran before either code change with raw exit 0; both paths have no
configured boundary zones or policy packs. This reports absent policies,
not a measurement of configured architecture compliance.
Before the header commit, `./node_modules/.bin/fallow audit --base
aa826a50a0afeda9a95ab05d38240219bfcb5595 --format json --quiet`
exited 0, verdict `pass`, base_ref exactly the batch baseline, head_sha
`aa826a5`, zero introduced findings. Its actual header pre-step
`SKIP=npm-check pre-commit run --files src/device/state.ts` exited 0.
Ordinary foreground `git commit` exited 0 with all applicable normal hooks
enabled, including `npm run check:commit`; no failed commit occurred.

Before the tracer commit, the sandboxed exact-base audit exited 2 because
Fallow could not create its temporary baseline worktree. That attempt was
UNAVAILABLE, not clean; `tracer-audit.json` preserves it. A justified elevated
retry exited 0, verdict `pass`, base_ref exactly the batch baseline, head_sha
`5808523`, zero introduced findings. Its complete stdout and stderr are retained
in `tracer-audit-escalated.json`; stderr warns about two cached TypeScript
package entry points outside the temporary project root. `tracer-guard.json`
retains the guard result. The temporary Fallow baseline is tool-owned analysis,
not executor isolation or a new feature branch.
The tracer owns exactly `test/device/state.test.ts` and this report.
Its exact pre-step is `SKIP=npm-check pre-commit run --files
test/device/state.test.ts
.planning/phases/03-device-and-persistence-conformance/03-STATE-REVIEW.md`.
The first pre-step exited 1 only because end-of-file-fixer removed an extra
trailing blank line from the report; it changed no TypeScript bytes. After
restaging, the repeated pre-step exited 0 at 2026-10-14T16:09:40.185851Z.
Native outputs are `tracer-pre-step.json` and `tracer-pre-step-repeat.json`.
This evidence addition is restaged and rechecked before the commit.
Actual normal-hook result, commit hash/path inspection and rebuilt tracer
feedback are supplied to the coordinator after the foreground commit.
No correction round or accepted-ID closure is claimed by this repair record.
