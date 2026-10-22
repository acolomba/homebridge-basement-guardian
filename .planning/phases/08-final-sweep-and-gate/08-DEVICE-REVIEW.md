# Phase 08 DEVICE complete-file review

**Reviewer:** `/root/phase8_plan03`, an in-session reviewer who did not edit the assigned source or test files.
**Committed revision read:** `157092f765fd7e8f120a272be1e32995ea1ff48b`.
**Method:** Read every assigned file from the committed tree in contiguous spans and checked every `HEAD:path` blob and line count against the live manifest. This is round-zero discovery. No source or test file was changed, and no correction round began.

## Shard A complete-file ledger

| Path | Complete lines read | Full blob | Reviewer | Finding count and IDs |
| --- | --- | --- | --- | --- |
| src/device/state.ts | 1-419 | ccee11846085280f5618622a36d19b5ba511643d | /root/phase8_plan03 | 2: CR-08-DEVICE-001, CR-08-DEVICE-002 |
| test/device/state.test.ts | 1-1144 | bc47c2e3fbf5f0ed48a10c549a80446923f25570 | /root/phase8_plan03 | 2 linked gaps: CR-08-DEVICE-001, CR-08-DEVICE-002 |
| src/device/gemini.ts | 1-405 | 7fcd51a8f010cead9a45002ab9949a2186206ec8 | /root/phase8_plan03 | 0, clean |
| test/device/gemini.test.ts | 1-716 | 413808364b23c834867132d2334ae10467a7b233 | /root/phase8_plan03 | 0, clean |
| test/device/stateSeeds.ts | 1-29 | bdf56c4ebaf3cd07b6c2c2a26c29181367aab1e6 | /root/phase8_plan03 | 0, clean |
| test/device/geminiSeeds.ts | 1-65 | f4a66bac599da41b8f154764ad07ddde0b83cf8a | /root/phase8_plan03 | 0, clean |

The long tests were read in contiguous spans: `state.test.ts` 1-380, 381-760, 761-1144; `gemini.test.ts` 1-360, 361-716. The rows record each complete union, 1-N. The small seed files were read in full.

## Shard B complete-file ledger

| Path | Complete lines read | Full blob | Reviewer | Finding count and IDs |
| --- | --- | --- | --- | --- |
| src/device/events.ts | 1-58 | 425b8300ffa925696659be418345920c7525fed7 | /root/phase8_plan03 | 0, clean |
| src/device/family.ts | 1-216 | c8e59e594b2c01f7ef51930934a4335f67df8583 | /root/phase8_plan03 | 0, clean |
| src/device/halo.ts | 1-31 | 6f35a139334067426d34e86f389878a7780ecc23 | /root/phase8_plan03 | 0, clean |
| src/device/health.ts | 1-60 | d616298673c9a0512ddf7b77bca0451871ddfcce | /root/phase8_plan03 | 0, clean |
| src/device/registry.ts | 1-104 | 82d9aa78efe5c1bd1a850989200e2bb681bf1738 | /root/phase8_plan03 | 0, clean |
| src/device/waterLevel.ts | 1-69 | d38218a7cfc9c2cc2e981dca549b51a8040d3a6b | /root/phase8_plan03 | 0, clean |
| src/persistence/accessoryContext.ts | 1-126 | 50da62c2bb5386a070b2e5a2e30657c659ed3b0e | /root/phase8_plan03 | 0, clean |
| test/device/events.test.ts | 1-64 | 419bb1cd9d0abea8b206a1afa74b7ff3455ddb35 | /root/phase8_plan03 | 0, clean |
| test/device/family.test.ts | 1-119 | fd85bba2d65d03c6c764931637ea8aafe3fae6a3 | /root/phase8_plan03 | 0, clean |
| test/device/halo.test.ts | 1-32 | 5eb99c63e76202d61a9f089ab4aa2d556dc1af0a | /root/phase8_plan03 | 0, clean |
| test/device/health.test.ts | 1-57 | 09be8ef6c6d7ebcce1951d468fba3adfdf9bb289 | /root/phase8_plan03 | 0, clean |
| test/device/registry.test.ts | 1-123 | 1faca95b6dab69ba47a02b2234e4a586b22b26eb | /root/phase8_plan03 | 0, clean |
| test/device/waterLevel.test.ts | 1-114 | 0779fa5b95e088fcc8d3679c2012799274b72a5c | /root/phase8_plan03 | 0, clean |
| test/persistence/accessoryContext.test.ts | 1-104 | 29e6f9201214df9db5fcbf99a803b983f19bfed7 | /root/phase8_plan03 | 0, clean |

Every B file was read 1-N. The type-only source and test pairs were checked against their positive `satisfies` and negative `@ts-expect-error` examples. All 20 TypeScript files carry the Phase 1 SPDX line, separate copyright block, and brief `@fileoverview`; attribution was preserved. The provisional water ladder and flood threshold remain explicitly gated by G-002, not represented here as hardware-validated facts.

## Accepted round-zero findings

| ID | Requirement, rule, severity, first round, disposition | Initial and current location | Cause and consumer evidence | Named check and verification state |
| --- | --- | --- | --- | --- |
| CR-08-DEVICE-001 | GATE-02; `AGENTS.md` §Project, Constraints → Safety semantics, and `08-REVIEW-PROTOCOL.md` §Scope and acceptance; **BLOCKER**; round zero; **open** | `157092f:src/device/state.ts:247-252` (initial and current); missing case at `157092f:test/device/state.test.ts:393-507` | `nextShadowVersion` treats `patch.data = {}` as an observation because it tests only `undefined`. The CLOUD parser accepts any object at `157092f:src/cloud/shadow.ts:197-205`, including `{}`. The empty object changes no reading, but establishes the shadow watermark. A later REST inventory cannot replace telemetry while that watermark exists (`157092f:src/device/state.ts:189-190,337-341`). The runtime sends the patch to the store at `157092f:src/runtime/accountRuntime.ts:858-900`. A device with no delivered telemetry can therefore keep older poll values until shadow release. An empty reported object also advances `receivedAt` at `state.ts:260-270` without a reading. | Add a named regression for an empty reported telemetry object, followed by a newer poll with different telemetry; assert the poll wins and receipt time is not restamped by the empty object. Parent must run the unchanged-source RED protocol, then the DEVICE owner test/direct coverage and combined gate after repair. No test or gate was run in this parallel review; raw exit **not run**. RED JSON/checker/commit and GREEN commit: pending Plan 08-14. |
| CR-08-DEVICE-002 | GATE-02; `AGENTS.md` §Project, Constraints → Safety semantics; `.agents/skills/typescript-unit-tests/rules/cases.md` §Assertions; **WARNING**; round zero; **open** | `157092f:src/device/state.ts:301-305,346-355` (initial and current); missing case at `157092f:test/device/state.test.ts:834-845` | An unchanged but valid heartbeat advances the store's `receivedAt`, yet `notify` returns when telemetry keys do not change. The platform's only live accessory update is that listener (`157092f:src/platform.ts:180-195`), so the accessory does not record the newer valid observation. If a later changed patch invalidates a scope, `recordTrustedScopes` leaves `lastTrustedAt` at an older poll or changed reading (`157092f:src/accessories/basementGuardian.ts:911-922,1029-1042`). That conflicts with `UntrustedScope.lastTrustedAt`'s stated meaning at `157092f:src/device/health.ts:50-55`. The current no-notification test asserts only that no listener ran; it cannot detect the stale trust time. | Add an end-to-end named regression: valid repeated heartbeat at T2, then invalid changed power at T3; assert power's last trusted time is T2, while duplicate pump activation is still suppressed. Parent must run the unchanged-source RED protocol, focused owner/consumer tests and direct coverage, then the combined gate after repair. Raw exit **not run**. RED JSON/checker/commit and GREEN commit: pending Plan 08-14. |

The two IDs name distinct causes. Neither has a fix or a passing verification claim. Plan 08-09 owns central reconciliation in `08-FINDINGS.md`; Plan 08-14 owns serial regression and repair. The round-zero forward-open DEVICE set is `{CR-08-DEVICE-001, CR-08-DEVICE-002}`.

## Rejected candidates without IDs

| Candidate | Exact rule and revision-qualified location | Rejection reason |
| --- | --- | --- |
| `isPitFlooded()` compares without checking a legal code | `AGENTS.md` §Project, Constraints → Safety semantics; `157092f:src/device/waterLevel.ts:65-69` | The exported helper's documented precondition is a legal code. Its production caller is `decodeWater` at `157092f:src/device/gemini.ts:282-286`; `untrustedScopesOf` validates the water enum before that decoder runs at `gemini.ts:349-376`. Illegal codes are omitted from the water scope and never reach the lookup. `test/device/gemini.test.ts:258-278` checks this boundary. |
| One invalid metadata field suppresses all metadata decoding | `AGENTS.md` §Project, Constraints → Safety semantics; `157092f:src/device/gemini.ts:353-376` | The metadata group is one non-safety group. The decoder returns `undefined` for it but keeps all eight safety scopes. The accessory retains last valid AccessoryInformation values at `157092f:src/accessories/basementGuardian.ts:1038-1054`; `test/device/gemini.test.ts:490-510` proves the scoped result. No false normal or erased safety value was shown. |
| Metadata-only reported patches do not call the accessory's live listener | `AGENTS.md` §Project, Constraints → Persistence; `157092f:src/device/state.ts:301-305`; `157092f:src/platform.ts:180-195` | The platform's later inventory dispatch calls `update()` with the store's retained metadata at `157092f:src/platform.ts:239-280`, so the metadata is not lost. No stated rule requires immediate firmware or radio display updates between polls. This is separate from CR-08-DEVICE-002's promised last-trusted observation time. |

## Boundary trace

- **Wire to store:** `src/cloud/types.ts:130-179` narrows REST identity and carries telemetry opaquely. `src/cloud/shadow.ts:188-205,275-284` narrows reported sections and routes the patch. `src/device/state.ts:189-214,247-270,337-355` owns merge, shadow watermark, and receipt time. These are bounded cross-owner reads, not second complete-file claims.
- **Store to consumer:** `src/runtime/accountRuntime.ts:430-459,670-704,858-904` releases silent devices, applies inventory and patches, and reports health. `src/platform.ts:180-195,239-370,378-400` binds `deviceId` to the UUID and forwards changed telemetry. `src/accessories/basementGuardian.ts:253-306,382-434,911-922,997-1074` decodes, retains last valid values, and marks the narrowest invalid scope. The `deviceTypeId` selects the registry adapter at `src/device/registry.ts:77-104`; it does not seed identity.
- **Persisted observations:** `src/persistence/accessoryContext.ts:32-126` permits accessory identity, vendor display name, pump records, and watermarks without tokens or raw responses. The consumer validates/resumes the record and calls its explicit persistence port at `src/accessories/pumpRecords.ts:258-302,378-418`. `src/platform.ts:153-175,239-300` implements that port through Homebridge's accessory update. These bounded reads do not certify the ACCESSORY or ROOT owner files.

## Rules and verification scope

Applied `AGENTS.md` §General, §Project, §GSD records and §Build verification; `.agents/skills/typescript-style/SKILL.md` with applicable `rules/modules-and-data.md`, `functions.md`, `types.md`, `naming-and-docs.md`, `comments.md`, and `review.md`; `.agents/skills/typescript-unit-tests/SKILL.md` with applicable `rules/cases.md`, `boundaries.md`, and `review.md`; `.agents/skills/local-verification/rules/commands.md` and `gates.md`; and `08-REVIEW-PROTOCOL.md`. This review found no additional style, header, type-only-test, or test-title candidate. Phase 1 attribution is unchanged.

The live DEVICE manifest check matched all 20 `HEAD:path` blobs and complete line counts (six A, 14 B), exit 0 at Node `v26.12.1`. The two Plan 08-03 report-row verifiers and `git diff --check` are the local read-only checks to run after writing this report. Owner tests, coverage, build, pre-commit, Fallow audit, and the full `TEST_CONCURRENCY=1 npm run check` are reserved for the parent coordinator's serialized critical section. This report does not claim those gates passed or mark GATE-02 complete.
