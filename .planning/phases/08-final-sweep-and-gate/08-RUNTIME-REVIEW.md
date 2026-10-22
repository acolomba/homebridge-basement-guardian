# Phase 08 RUNTIME complete-file review, shard A

**Review revision:** `157092f765fd7e8f120a272be1e32995ea1ff48b`.
**Reviewers:** `/root/phase8_plan04` performed the first pass; `/root/phase8_runtime_independent` independently read the same four committed spans and confirmed the disposition.
**Method:** Read the complete committed blobs of the source and two helpers, and the contiguous first half of the large owner test. No product or test file was changed. The test row remains partial until Plan 08-12 reads lines 4703-9404 of the same blob.

| Path | Lines read | Full blob | Reviewer | Findings / disposition |
| --- | --- | --- | --- | --- |
| src/runtime/accountRuntime.ts | 1-1346 | 8a608ecbda2609774bcded0e185c8b79af819e82 | /root/phase8_plan04 | 1 open: CR-08-RUNTIME-001 |
| test/runtime/accountRuntime.test.ts | 1-4702 | 8ebf14ce198a88cc3cab2335def43d9f6896b5b8 | /root/phase8_plan04 | Interim first-half span; 1 linked gap: CR-08-RUNTIME-001; remaining 4703-9404 unreviewed here |
| test/runtime/accountRuntimeSeeds.ts | 1-121 | 871c06ca00b572ab092e0bdf9f534284ddea037a | /root/phase8_plan04 | 0, clean |
| test/runtime/accountShadowContract.ts | 1-142 | 08cfe9d5b45cbd2e9488d8781df59f5c73833aeb | /root/phase8_plan04 | 0, clean |

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
