# Phase 08 RUNTIME complete-file review, shards A and B

**Review revisions:** Plan 08-04 shard A at `157092f765fd7e8f120a272be1e32995ea1ff48b`; Plan 08-12 continuation and shard B at `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7`. The assigned blobs did not change.
**Reviewers:** `/root/phase8_plan04` performed the first pass; `/root/phase8_runtime_independent` independently read the same four committed spans and confirmed the disposition.
**Method:** Plan 08-04 read the complete committed blobs of the source and two helpers, and the contiguous first half of the large owner test. Plan 08-12 independently read the second half and every shard B path at the unchanged manifest blobs. No product or test file was changed.

| Path | Lines read | Full blob | Reviewer | Findings / disposition |
| --- | --- | --- | --- | --- |
| src/runtime/accountRuntime.ts | 1-1346 | 8a608ecbda2609774bcded0e185c8b79af819e82 | /root/phase8_plan04 | 1 open: CR-08-RUNTIME-001 |
| test/runtime/accountRuntime.test.ts | 1-4702 | 8ebf14ce198a88cc3cab2335def43d9f6896b5b8 | /root/phase8_plan04 | Interim first-half span; 1 linked gap: CR-08-RUNTIME-001; remaining 4703-9404 unreviewed here |
| test/runtime/accountRuntime.test.ts | 4703-9404 | 8ebf14ce198a88cc3cab2335def43d9f6896b5b8 | /root/phase8_plan12 | Second contiguous span; CR-08-RUNTIME-001 remains uncovered by its assertions |
| test/runtime/accountRuntime.test.ts | 1-9404 | 8ebf14ce198a88cc3cab2335def43d9f6896b5b8 | /root/phase8_plan04 + /root/phase8_plan12 | Complete from adjacent spans 1-4702 and 4703-9404; 1 linked gap: CR-08-RUNTIME-001 |
| test/runtime/accountRuntimeSeeds.ts | 1-121 | 871c06ca00b572ab092e0bdf9f534284ddea037a | /root/phase8_plan04 | 0, clean |
| test/runtime/accountShadowContract.ts | 1-142 | 08cfe9d5b45cbd2e9488d8781df59f5c73833aeb | /root/phase8_plan04 | 0, clean |
| src/runtime/accessoryStore.ts | 1-36 | a7ce446ff9d47ec6106d0a6f609bff1472b9677f | /root/phase8_plan12 | 0, clean |
| src/runtime/arrivalAnchors.ts | 1-211 | aa8bdebcfa86c8ad78b8f0c3d2d614252302fa64 | /root/phase8_plan12 | 1 open: CR-08-RUNTIME-002 |
| src/runtime/clock.ts | 1-25 | c6b98a6e2c6863ae0a567d38f1665e40fceb122b | /root/phase8_plan12 | 0, clean |
| src/runtime/commandPort.ts | 1-48 | e0189cf9040830a85c4aa447d8a763156c40acbe | /root/phase8_plan12 | 0, clean |
| src/runtime/failureLog.ts | 1-95 | 4d724a609b5da08f31b7978396fd4d240c93fe70 | /root/phase8_plan12 | 1 open: CR-08-RUNTIME-003 |
| src/runtime/monitoringHealth.ts | 1-311 | 2786f5ec0d32e22bfa1301dc41aa23acd6265c53 | /root/phase8_plan12 | 0, clean |
| src/runtime/monotonicClock.ts | 1-57 | 1a4a105d8f9efd86d8cfdf9c2e20f4b9c3538192 | /root/phase8_plan12 | 0, clean |
| src/runtime/retryPolicy.ts | 1-101 | 2c57c73e97be282acfdff61b439bfd86333d5b48 | /root/phase8_plan12 | 0, clean |
| src/runtime/timers.ts | 1-53 | 7fb32bb219bc4f20cff82e13bec518afc591b38f | /root/phase8_plan12 | 0, clean |
| test/runtime/accessoryStore.test.ts | 1-19 | 4da2a0ab4d8e106c115978e2c55be25a79cab07e | /root/phase8_plan12 | 0, clean |
| test/runtime/arrivalAnchorMemoryContract.ts | 1-213 | 37f66e8fa86b495da8aee055684ba2b90a938aaa | /root/phase8_plan12 | 0, clean |
| test/runtime/arrivalAnchors.test.ts | 1-379 | 355c746c0052c87c3ea4312ac0cfb49a7a5ee9da | /root/phase8_plan12 | 1 linked gap: CR-08-RUNTIME-002 |
| test/runtime/clock.test.ts | 1-43 | 76e54e0379e93a0827c99cf0de959a64edfa463a | /root/phase8_plan12 | 0, clean |
| test/runtime/commandPort.test.ts | 1-40 | bc9395128c5467d2c09bb6069eda9107a4886113 | /root/phase8_plan12 | 0, clean |
| test/runtime/failureLog.test.ts | 1-327 | b2a366267264b4fafb821a8d1c779c047e02019d | /root/phase8_plan12 | 1 linked gap: CR-08-RUNTIME-003 |
| test/runtime/monitoringHealth.test.ts | 1-637 | 2de18da8833b17a19bf39a9befa8d48ae505fd88 | /root/phase8_plan12 | 0, clean |
| test/runtime/monotonicClock.test.ts | 1-49 | 33d3e5dd77ef752c2fbd1a1b77824871f7ea5331 | /root/phase8_plan12 | 0, clean |
| test/runtime/retryPolicy.test.ts | 1-414 | 1b60805478d946fb41759df2fb0adbbc46709106 | /root/phase8_plan12 | 0, clean |
| test/runtime/timers.test.ts | 1-111 | 3c853aa1a41bad5fe7a1885547afa81e63a678a5 | /root/phase8_plan12 | 0, clean |

The live manifest check returned four RUNTIME/A paths. Each path's `HEAD:path` blob and newline count matched the manifest at the review revision. The split is `floor(9404/2) = 4702`. A later edit to any assigned blob requires a new complete-file review; a change to the owner test requires both test spans to restart.

## Rules and trace

I applied `AGENTS.md` §Project safety semantics and privacy, `.agents/skills/typescript-style/SKILL.md` §Classifying findings, the applicable `rules/modules-and-data.md` (§Files and modules, §Variables, literals, and data), `classes.md`, `functions.md` (§Control flow, §Errors), `types.md`, `naming-and-docs.md`, `comments.md`, and `review.md`; `.agents/skills/typescript-unit-tests/SKILL.md` §Review and `rules/pairing-and-design.md`, `tools.md`, `cases.md` (§Case structure, §Assertions), `test-doubles.md`, `boundaries.md`, and `review.md` (§Reviewing, §Classifying findings); and the Phase 1 SPDX, copyright, and `@fileoverview` header form. All four assigned files have that header form and preserve attribution.

The account lifecycle was traced through bounded, read-only context. `src/platform.ts` at blob `e4bedd50206653eb6456a931edba97ab3bea12c1:634-665` wires inventory, monitoring trust, removal, launch, and shutdown. `src/accessories/controls.ts` at `a95863e48560a4bee2498e0a8611acba6ffecea9:589-621` checks local command readiness before the single send. `src/device/state.ts` at `ccee11846085280f5618622a36d19b5ba511643d:346-362` ignores a patch for an unknown device and owns canonical snapshots. `src/cloud/shadow.ts` at `018f49c720f0119fb131b4f03dfbc3966a98dadc:391-465` guards callbacks by current connection and opens the live transport. These are context spans, not ownership claims or complete-file certification.

The source maintains per-device silence and shadow ownership, account-wide poll and credential refusal trust, abortable polling and rotation waits, an out-of-band removal check, and one command request per `send`. The first test span uses fresh stand-ins and checks whole snapshots, exact monitoring maps, refusal effects, scheduled retries, no command requests during monitoring, and negative controls for shared contracts. The owner test's remaining half may change the disposition below only after it is read at the same blob.

## Accepted finding

### CR-08-RUNTIME-001 — late credential success reports recovery after terminal refusal

- **Requirement and rule:** GATE-02; `AGENTS.md` §Project, Safety semantics (do not report a false normal condition); `.agents/skills/typescript-unit-tests/rules/review.md` §Reviewing and §Classifying findings (a wrong implementation must fail a discriminating case).
- **First round:** round zero. **Severity:** WARNING. **Disposition:** open, pending the regression and cause repair in Plan 08-14.
- **Initial and current location:** `157092f765fd7e8f120a272be1e32995ea1ff48b:src/runtime/accountRuntime.ts:966-988`, especially line 986. The paired assertion gap is `157092f765fd7e8f120a272be1e32995ea1ff48b:test/runtime/accountRuntime.test.ts:3619-3749` in this reviewed span.
- **Cause and effect:** `refreshCredentials()` awaits `api.awsCredentials` at line 968, then processes a successful response and calls `recordSuccess(ROTATION)` at line 986 without rechecking `halted` or shutdown. In parallel, `runPoll()` can receive an `AuthRejectedError` and route it through `haltOnTerminalAuthFailure()` at lines 1038-1042 and 746-770, or `stop()` can shut the runtime down. If rotation was already failing, a late successful response clears its failure and `failureLog.ts:83-88` emits `Credential rotation recovered.` after monitoring has stopped. `openShadow()` refuses a new connection after the halt, so the recovery line describes no restored monitoring activity. The first-half rotation tests cover success and failure, but do not assert either ordering.
- **Evidence:** Static control-flow trace at the committed blobs. No RED regression, GREEN commit, owner-test run, or full gate is claimed in this review slice. Repair must preserve the existing one-send command and credential-refusal trust behavior.

## Rejected candidates

| Candidate | Rule and revision-qualified location | Reasoned rejection |
| --- | --- | --- |
| A shadow callback could recreate a removed device | `AGENTS.md` §Project, Identity and safety semantics; `157092f765fd7e8f120a272be1e32995ea1ff48b:src/runtime/accountRuntime.ts:889-903` | The callback's stamp is guarded by store membership, and `src/device/state.ts` blob `ccee11846085280f5618622a36d19b5ba511643d:346-351` returns without creating a snapshot for an unknown ID. A stale callback therefore cannot recreate canonical state or its anchor. |
| The command port could retry an uncertain pump command | `AGENTS.md` §Project, Safety semantics; `157092f765fd7e8f120a272be1e32995ea1ff48b:src/runtime/accountRuntime.ts:1137-1157` | `send()` invokes `api.sendCommand` once and returns the accepted, vendor-error, or timed-out result. `src/accessories/controls.ts` blob `a95863e48560a4bee2498e0a8611acba6ffecea9:589-621` performs local readiness checks and also calls the port once. There is no retry branch in this path. |
| Separate shadow starts could overlap while `ShadowClient.start()` waits | `.agents/skills/typescript-unit-tests/rules/review.md` §Reviewing; `157092f765fd7e8f120a272be1e32995ea1ff48b:src/runtime/accountRuntime.ts:835-928` | The injected interface permits a delayed `start`, but the production `src/cloud/shadow.ts` blob `018f49c720f0119fb131b4f03dfbc3966a98dadc:460-465` opens synchronously and returns an already-resolved promise. The next timer or vendor response cannot interleave before the runtime assigns `shadow` on the following microtask. This review does not turn a stand-in-only scheduling possibility into a current production finding. |
| Composite `deviceId` in local diagnostic logs | `AGENTS.md` §Project, Privacy; `157092f765fd7e8f120a272be1e32995ea1ff48b:src/runtime/accountRuntime.ts:81-115` | The broad privacy sentence appears to bar account identifiers in logs. The maintainer's narrower D-14/D-027 ruling recorded in `.planning/STATE.md` permits this composite ID in local diagnostic logs while excluding it from public artifacts; `06-PLATFORM-REVIEW.md` rejected the same scoped candidate. No new unscoped identifier path was shown. The policy wording remains an explicit inconsistency for milestone reconciliation. |

## Continuation and checks

Plan 08-12 must read `test/runtime/accountRuntime.test.ts` lines **4703-9404** at blob `8ebf14ce198a88cc3cab2335def43d9f6896b5b8`, then record a complete 1-9404 row. It should inspect the late-grant and terminal-refusal cases in that span before finalizing CR-08-RUNTIME-001. The current open ID set is `{CR-08-RUNTIME-001}`. No ID was allocated to the three rejected candidates.

Read-only checks: manifest blob/line refresh exited 0; `requirements ready-ids --phase 08 --raw` reported `1/1 requirement(s) ready to mark complete`, but GATE-02 remains unchecked because the full repo review is incomplete. The plan's row-shape verifier is for the parent after independent review. Owner tests, coverage, Fallow audit, pre-commit, and the combined `npm run check` were not run while parallel reports were being written.

**Independent review:** `/root/phase8_runtime_independent` read `src/runtime/accountRuntime.ts` 1-1346, `test/runtime/accountRuntime.test.ts` 1-4702, `test/runtime/accountRuntimeSeeds.ts` 1-121, and `test/runtime/accountShadowContract.ts` 1-142 at the listed blobs. That reviewer independently confirmed CR-08-RUNTIME-001, the linked test gap, the three original rejections, and the row/blob/split accuracy. The reviewer added the post-`stop()` effect and the scoped identifier candidate above. No files were changed during that read-only review.

**Certification status:** independent first-half evidence is complete; Plan 08-12 must finish the owner test before RUNTIME is certified for GATE-02.

## Plan 08-12 continuation at the unchanged blobs

At commit `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7`, all 23 RUNTIME manifest paths still resolved to the recorded blobs and line counts. The owner test remained `8ebf14ce198a88cc3cab2335def43d9f6896b5b8`, 9404 lines. Its original 1-4702 span and the independently reviewed 4703-9404 span are contiguous, nonoverlapping, and exhaustive. The aggregate 1-9404 row above combines those reviewers; it is not a claim that either reviewer read both halves. The earlier partial-row wording and certification note above remain as historical Plan 08-04 evidence. The complete review supersedes their pending status.

The second span checks shutdown and post-stop callbacks, mid-run account refusal and late credential grants, shadow reconnection and per-device silence, confirmed removal and failed HomeKit removal, command bodies and single sends, and composed Auth0/REST/IoT wiring. Lines 6110-6141 assert that a grant arriving after terminal refusal opens no live shadow. They do not assert that the same grant avoids a `Credential rotation recovered.` diagnostic, so CR-08-RUNTIME-001 remains open. The command cases at 8397-8722 compare complete snapshots and exact request lists, including one abortable in-flight send and no retry. The removal cases at 7305-8395 check out-of-band final fetches, retained tracking on refused removal, and no anchor resurrection after a stray message. No distinct new owner-test cause was accepted.

For shard B I applied `.agents/skills/typescript-style/SKILL.md` §Classifying findings and its `rules/modules-and-data.md` §Files and modules, `functions.md` §Control flow and §Errors, `types.md`, `naming-and-docs.md`, `comments.md`, and `review.md` §Quick scan; `.agents/skills/typescript-unit-tests/SKILL.md` §Review and its `rules/pairing-and-design.md` §Pairing and coverage, `cases.md` §Assertions, `test-doubles.md`, `boundaries.md`, and `review.md` §Classifying findings. Every shard B file has the Phase 1 SPDX, copyright, and `@fileoverview` header form. The quick scan found no forbidden `var`, default export, `@ts-ignore`, `test.only`, `test.skip`, `test.todo`, or `.bind` token. Type-only port tests deliberately run with zero runtime cases under `boundaries.md` §Type-only modules.

The cross-owner trace remains bounded context, not another file certification. `src/runtime/accountRuntime.ts` blob `8a608ecbda2609774bcded0e185c8b79af819e82:645-703` builds per-device trust and launches anchor persistence without waiting; `:835-999` governs shadow callbacks, retry, and credential rotation; `:1137-1159` sends a command once; `:1173-1187` restores anchors before discovery. `src/accessories/controls.ts` blob `a95863e48560a4bee2498e0a8611acba6ffecea9:589-621` checks readiness before the command port. `src/platform.ts` blob `e4bedd50206653eb6456a931edba97ab3bea12c1:616-665` injects wall/monotonic clocks and timers and forwards monitoring trust. `src/device/state.ts` blob `ccee11846085280f5618622a36d19b5ba511643d:346-362` rejects a patch for an unknown device. Source/test pairing, retained valid values, per-device silence, and single-send command behavior were checked against those calls.

### CR-08-RUNTIME-002 — overlapping anchor writes can discard a newly admitted device's durable anchor

- **Requirement and exact rule:** GATE-02 and `AGENTS.md` §Project, Safety semantics and Persistence; `.agents/skills/typescript-unit-tests/rules/review.md` §Reviewing and §Classifying findings requires a discriminating source/test pair. **First round:** round zero. **Severity:** BLOCKER. **Disposition:** open for Plan 08-09 triage and Plan 08-14 repair.
- **Initial and current location:** `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:src/runtime/arrivalAnchors.ts:198-203`, paired with `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:src/runtime/accountRuntime.ts:695-703`. The test gap is `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:test/runtime/arrivalAnchors.test.ts:140-163,207-234,258-288`: those cases await sequential writes and never hold one write while a newer snapshot finishes.
- **Cause and effect:** `persist()` serializes the current map before `await storeAnchors(...)`. `reportMonitoringHealth()` fires and forgets each persistence promise. If write A captures the first device, then admission adds device B and write B captures both, B may rename first and A may rename last. The durable file then omits B. After restart, `restore()` has no B anchor; admission starts B's silence window from the new run. A false healthy verdict occurs when B had already passed the two-heartbeat silence threshold before restart and no new B message arrives before the verdict. The randomized temporary paths prevent temporary-file collision but do not order renames to the shared target.
- **Evidence and repair handoff:** Static async ordering trace at the named committed blobs. No RED test or runtime reproduction is claimed. A regression must control the two writes' completion order and verify the durable file and restart silence verdict, then preserve newest-state ordering without blocking a health report on disk I/O.

### CR-08-RUNTIME-003 — backward wall-clock correction suppresses failure reminders

- **Requirement and exact rule:** GATE-02 and D-14's fifteen-minute reminder promise as stated in `src/runtime/failureLog.ts:49-60`; `.agents/skills/typescript-unit-tests/rules/review.md` §Reviewing and §Classifying findings requires a case that rejects a plausible wrong cadence. **First round:** round zero. **Severity:** WARNING. **Disposition:** open for Plan 08-09 triage and Plan 08-14 repair.
- **Initial and current location:** `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:src/runtime/failureLog.ts:69-80`. The paired forward-only test sequence is `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:test/runtime/failureLog.test.ts:107-155,157-203`.
- **Cause and effect:** Reminder eligibility subtracts the previous wall-clock warning time from `clock.now()`. If a clock correction moves wall time backward by an hour immediately after a warning, subsequent failures continue at debug level for about an hour plus the normal fifteen-minute interval. A correction later in the interval shortens that delay by the elapsed time since the warning. The module has a monotonic clock available in the runtime but does not use it for elapsed reminder time. This affects failure diagnostics, not the trust map or stored telemetry.
- **Evidence and repair handoff:** Static arithmetic trace; no RED or GREEN result is claimed. A regression should move the wall clock backward while advancing elapsed time and assert one new warning at the next fifteen-minute boundary.

### Additional rejected candidates from the completed span and shard B

| Candidate | Exact rule and revision-qualified location | Reasoned rejection |
| --- | --- | --- |
| A late credential grant after terminal refusal reopens the broker | `AGENTS.md` §Project, Safety semantics; `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:test/runtime/accountRuntime.test.ts:6110-6166` and `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:src/runtime/accountRuntime.ts:835-928` | The two orderings are asserted: a grant after refusal makes no shadow client, and an opening connection that overlaps refusal is closed. CR-08-RUNTIME-001 remains about the false recovery diagnostic, not a reopened socket. |
| A message after confirmed removal re-creates its arrival anchor | `AGENTS.md` §Project, Identity and safety semantics; `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:test/runtime/accountRuntime.test.ts:8222-8395` and `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:src/runtime/accountRuntime.ts:889-903` | The store-membership guard prevents a new stamp and the owner test checks both memory and persisted-anchor state after the stray callback. |
| A scheduled retry can send a second uncertain command | `AGENTS.md` §Project, Safety semantics; `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:src/runtime/retryPolicy.ts:49-99` and `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:src/runtime/accountRuntime.ts:1137-1159` | The retry policy is used for reconnect timing, while the command port's `send` performs one API call and maps its result without scheduling. Owner cases compare the one request and no retry. |
| A malformed or absent anchor file should make the process fail startup | `.agents/skills/typescript-unit-tests/rules/boundaries.md` §Filesystem; `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:src/runtime/arrivalAnchors.ts:94-132` and `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7:test/runtime/arrivalAnchors.test.ts:165-205` | The specified recovery uses the forward-only term for this run and rejects a malformed file as a whole; the paired real-filesystem tests distinguish malformed JSON, wrong shapes, and nonfinite timestamps. This is separate from the accepted overlapping-write loss. |

**Review result:** 23 of 23 current RUNTIME paths have complete current-blob rows. The round-zero forward-open set is `{CR-08-RUNTIME-001, CR-08-RUNTIME-002, CR-08-RUNTIME-003}`. Plan 08-09 must reconcile these IDs before any serial repair. GATE-02 remains incomplete until every owner report, correction round, and required combined gate is complete. No source, test, feature, or manifest file was edited in this plan.

A separate read-only reviewer (`/root/phase8_runtime_new_findings_check`) independently confirmed 002 and 003 at the recorded blobs, including the conditional restart effect and wall-clock timing qualification above. That reviewer ran no RED case or build and changed no file.
