---
phase: 04-runtime-conformance
recorded: 2026-10-16T16:03:04.349Z
method: existing-independent-full-batch-reviews
current_reference: cda29908927ef5dbfddcbe31e31e65ba95aa01e8
review_base: 008218be4badf44455ab35906f1dfcff06089bf8
current_inventory_paths: 34
historical_findings: 87
historical_blockers: 37
historical_warnings: 50
independently_fixed: 87
open: 0
new_findings: 0
correction_rounds_added: 0
---

# Phase 04: Existing Review Dispositions

This is an index of completed review evidence, qualified at the current reference
above. It adds no manual full-batch review or correction round. The authoritative
original findings, fixes, first observers and native evidence remain in each
batch report. All 87 stable IDs retain their original severity and rule.

Canonical source: [04-SEAL-AUDIT.json](04-SEAL-AUDIT.json), SHA256
`bad44c95f952224b042dd35a98327e62e241ebb0dbb85c733d7d0ddf4c3b211c`.
The fresh comparison at `2026-10-16T16:00:53.239112+00:00` verified 34 current blobs,
69 applicability inputs, all ten historical rounds/93 path snapshots, and all
15 historical supersessions. It also resolved all 87 initial-definition excerpts
and current full-review closure rows. This does not claim a new source-body review.

## Qualified covering reports

The full reviewed source revision is distinct from the commit containing the
completed report. Each current report equals the recorded report Git blob.
The range points to that report's actual full-scope declaration.

| Cover key | Reviewed source revision | Report commit | Report Git blob | Scope declaration |
| --- | --- | --- | --- | --- |
| PORTS3 | `dd5ea2db8519a1dc8f6c15c847af41f58ceddf80` | `1993aaa0b3d468b2e78d0ccacd353b713739c4ef` | `b7c89fa1573cc0a7d0f2f77a94f7d820be713d6f` | 04-PORTS-REVIEW.md:1405–1480 |
| POLICIES2 | `52fe134937c7723c019925d1a768ce12166a82de` | `b64a206722ced9f713a650236bb34dca14d75945` | `4726e847a892dfdacb8fc2b3c59af0a7964c4e19` | 04-POLICIES-REVIEW.md:1803–1918 |
| TRUST2 | `9782919eed2bca9753b49465210c6405961b3a64` | `0bc71adffd4eefa63c932db11e00a54204b43ed5` | `050f3a2c101f6e61736316906ae22f7f627402ae` | 04-TRUST-REVIEW.md:2242–2278 |
| ACCOUNT3 | `4a4e445efe11395996f4fd55ee7547d8823c1c0f` | `1a750a252efc60aae68cb5bf1d724ed59ff671e1` | `64b0ab7a365be9d416475dc82827c4c2a0037f75` | 04-ACCOUNT-REVIEW.md:9974–10102 |

| Report | Current SHA256 |
| --- | --- |
| 04-PORTS-REVIEW.md | `0da62073c135d57c8a9d5eee80a2980fcdf61a06f9003368e6c33d2625de0ead` |
| 04-POLICIES-REVIEW.md | `ebd4382003818d80dc787cfb213704c840babb74c7d8c112197461cb20a329c7` |
| 04-TRUST-REVIEW.md | `4684bcdb2a331fc88a6a9d6bb256c1e2b12d7bb86a0abbcedaeb3b731dcea4a2` |
| 04-ACCOUNT-REVIEW.md | `308615caac31c8c420e7fe9c614bfa64cc3a4f3b1c173a73aa7b440b2998be94` |

The ACCOUNT3 original full-read ledger is
`/private/tmp/guardian-correction3-review/read-ledger.json`, SHA256
`5f9ae0ac2ade372e354353a446ebe130e6b28ef52c121ffb11fa92582dbb936a`.
The seal-wide original manual ledger is
`/private/tmp/guardian-04-10-canonical/manual-read-ledger-final.json`, SHA256
`76367818458325f989782d6b3796c92e7a4a25c01d806cb397d2ec23d2be6f75`.
These are the original reviewers' read records, not this aggregator's source reads.
The exact 69 applicability input rows remain under
`inventory[*].currentCoverage.applicabilityEvidence.rulebooksAndCallerInputs`
in the canonical seal; duplicate references describe the same checked paths.

## Current full inventory

The cover key resolves to the exact original source revision, report commit and
range above. The full line count is the unchanged covered body's range.
The original/expanded classification comes from the seal. Logging remains
unchanged ACCOUNT privacy-boundary support.

| Path | Scope | Covered lines | Current Git blob | Current cover |
| --- | --- | ---: | --- | --- |
| eslint.config.js | expanded | 1–328 | `c3a89b524b7069f6a644550ccda4d395bf068912` | ACCOUNT3 |
| src/accessories/reconciliation.ts | expanded | 1–114 | `e25bd84d713b6daa16b9616d00e6f4d7f41f8f62` | ACCOUNT3 |
| src/cloud/shadow.ts | expanded | 1–478 | `018f49c720f0119fb131b4f03dfbc3966a98dadc` | ACCOUNT3 |
| src/logging.ts | supporting | 1–180 | `b4c2f70fec0e819d1d1963bd1d221ed7414dc0e7` | ACCOUNT3 |
| src/platform.ts | expanded | 1–673 | `8f48e059bce57d8ca320e6523d6beb0c0385eb03` | ACCOUNT3 |
| src/runtime/accessoryStore.ts | core | 1–36 | `a7ce446ff9d47ec6106d0a6f609bff1472b9677f` | PORTS3 |
| src/runtime/accountRuntime.ts | core | 1–1346 | `5d1ea815151fb008a4d49c003a2b8416cc02bf3a` | ACCOUNT3 |
| src/runtime/arrivalAnchors.ts | core | 1–211 | `aa8bdebcfa86c8ad78b8f0c3d2d614252302fa64` | ACCOUNT3 |
| src/runtime/clock.ts | core | 1–25 | `c6b98a6e2c6863ae0a567d38f1665e40fceb122b` | PORTS3 |
| src/runtime/commandPort.ts | core | 1–48 | `e0189cf9040830a85c4aa447d8a763156c40acbe` | POLICIES2 |
| src/runtime/failureLog.ts | core | 1–95 | `4d724a609b5da08f31b7978396fd4d240c93fe70` | POLICIES2 |
| src/runtime/monitoringHealth.ts | core | 1–311 | `2786f5ec0d32e22bfa1301dc41aa23acd6265c53` | TRUST2 |
| src/runtime/monotonicClock.ts | core | 1–57 | `1a4a105d8f9efd86d8cfdf9c2e20f4b9c3538192` | PORTS3 |
| src/runtime/retryPolicy.ts | core | 1–101 | `2c57c73e97be282acfdff61b439bfd86333d5b48` | POLICIES2 |
| src/runtime/timers.ts | core | 1–53 | `7fb32bb219bc4f20cff82e13bec518afc591b38f` | PORTS3 |
| test/accessories/reconciliation.test.ts | expanded | 1–256 | `12ecb92479c70f1387685a235f5ddc84f6179b6a` | ACCOUNT3 |
| test/architecture/platformWiring.test.ts | expanded | 1–278 | `6f90d6c94bd21ae59afc34ea3d4b1422f73d3266` | ACCOUNT3 |
| test/cloud/shadow.test.ts | expanded | 1–1146 | `efecee5e0f6dfebc70ae1427f222cea7fd5a8bec` | ACCOUNT3 |
| test/logging.test.ts | supporting | 1–432 | `aed3ebe79c287e1b6cde9e95b5af18f1a4fe213f` | ACCOUNT3 |
| test/platform.test.ts | expanded | 1–3779 | `74e7ddc22e2eeeba9d32cd04feebee7379e12811` | ACCOUNT3 |
| test/platformSeeds.ts | expanded | 1–176 | `ad02884ba05cadfa45959eb8c283720ca56eb27e` | ACCOUNT3 |
| test/runtime/accessoryStore.test.ts | core | 1–19 | `4da2a0ab4d8e106c115978e2c55be25a79cab07e` | PORTS3 |
| test/runtime/accountRuntime.test.ts | core | 1–9404 | `8ebf14ce198a88cc3cab2335def43d9f6896b5b8` | ACCOUNT3 |
| test/runtime/accountRuntimeSeeds.ts | expanded | 1–121 | `871c06ca00b572ab092e0bdf9f534284ddea037a` | ACCOUNT3 |
| test/runtime/accountShadowContract.ts | expanded | 1–142 | `08cfe9d5b45cbd2e9488d8781df59f5c73833aeb` | ACCOUNT3 |
| test/runtime/arrivalAnchorMemoryContract.ts | expanded | 1–213 | `37f66e8fa86b495da8aee055684ba2b90a938aaa` | ACCOUNT3 |
| test/runtime/arrivalAnchors.test.ts | core | 1–379 | `355c746c0052c87c3ea4312ac0cfb49a7a5ee9da` | ACCOUNT3 |
| test/runtime/clock.test.ts | core | 1–43 | `76e54e0379e93a0827c99cf0de959a64edfa463a` | PORTS3 |
| test/runtime/commandPort.test.ts | core | 1–40 | `bc9395128c5467d2c09bb6069eda9107a4886113` | POLICIES2 |
| test/runtime/failureLog.test.ts | core | 1–327 | `b2a366267264b4fafb821a8d1c779c047e02019d` | POLICIES2 |
| test/runtime/monitoringHealth.test.ts | core | 1–637 | `2de18da8833b17a19bf39a9befa8d48ae505fd88` | TRUST2 |
| test/runtime/monotonicClock.test.ts | core | 1–49 | `33d3e5dd77ef752c2fbd1a1b77824871f7ea5331` | PORTS3 |
| test/runtime/retryPolicy.test.ts | core | 1–414 | `1b60805478d946fb41759df2fb0adbbc46709106` | POLICIES2 |
| test/runtime/timers.test.ts | core | 1–111 | `3c853aa1a41bad5fe7a1885547afa81e63a678a5` | PORTS3 |

## Original continuous correction accounting

Round 0 is the initial review and is not added to these continuous correction
counters. ACCOUNT retains one counter across its owning and cause plans.
Each row satisfies closing = opening - fixed - rejected + new + reopened;
the stable ID sets are retained in `batches[*].rounds[*]` in the canonical seal.

| Batch | Round | Actual paths | Reviewed revision | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| PORTS | 1 | 8 | `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa` | 7 | 7 | 0 | 1 | 0 | 1 |
| PORTS | 2 | 8 | `f99a637908a693868793d1b19525ad979042ad37` | 1 | 1 | 0 | 1 | 0 | 1 |
| PORTS | 3 | 8 | `dd5ea2db8519a1dc8f6c15c847af41f58ceddf80` | 1 | 1 | 0 | 0 | 0 | 0 |
| POLICIES | 1 | 6 | `af2a8e1bda121d0804c50e37c0b7d6e8f2083906` | 12 | 12 | 0 | 1 | 0 | 1 |
| POLICIES | 2 | 6 | `52fe134937c7723c019925d1a768ce12166a82de` | 1 | 1 | 0 | 0 | 0 | 0 |
| TRUST | 1 | 5 | `0ad981c393536624fa5353e42f871f6db7b1e753` | 15 | 15 | 0 | 2 | 0 | 2 |
| TRUST | 2 | 5 | `9782919eed2bca9753b49465210c6405961b3a64` | 2 | 2 | 0 | 0 | 0 | 0 |
| ACCOUNT | 1 | 13 | `d785fd7f8850038dcb345a05d47d14cf4312e9fd` | 29 | 29 | 0 | 15 | 0 | 15 |
| ACCOUNT | 2 | 16 | `d0f46b0cd027fc1d011e8a39ac3b17d0a0a75bb7` | 15 | 14 | 0 | 4 | 0 | 5 |
| ACCOUNT | 3 | 18 | `4a4e445efe11395996f4fd55ee7547d8823c1c0f` | 5 | 5 | 0 | 0 | 0 | 0 |

The latest cover partitions the 34 unique paths as PORTS3=8, POLICIES2=6,
TRUST2=2 and ACCOUNT3=18. TRUST2 originally reviewed five paths. Later changed
TRUST bodies receive ACCOUNT3's complete current review. ACCOUNT full scopes
are 13→16→18; all 48 ACCOUNT IDs are independently closed.

PORTS2's 1→1 result triggered the actual global stop. The bounded maintainer
option-1 resolution permits 009 and PORTS3 only. No current cover constitutes
round 4; no counter is reset. All future D-03 predicates remain operative.

## Historical bodies superseded by completed full reviews

These 15 rows preserve the historical review identity and Git body rather than
claiming that a changed body stayed equal to an earlier review. Every historical
blob was independently compared with the actual Git object at its reviewed
revision. The current complete cover appears in the last column.

| Path | Historical review | Historical reviewed revision | Historical Git blob | Current complete cover |
| --- | --- | --- | --- | --- |
| src/platform.ts | ACCOUNT1 | `d785fd7f8850038dcb345a05d47d14cf4312e9fd` | `b7c1103e669d7d56f0a4b4c84dde7fb9248b23f5` | ACCOUNT3 |
| src/runtime/accountRuntime.ts | ACCOUNT1 | `d785fd7f8850038dcb345a05d47d14cf4312e9fd` | `c87b9330ad2589e7941c11aba90f2079c67dbc30` | ACCOUNT3 |
| test/accessories/reconciliation.test.ts | ACCOUNT1 | `d785fd7f8850038dcb345a05d47d14cf4312e9fd` | `d2f766376859734efac00a8e98c52400e49e50eb` | ACCOUNT3 |
| test/architecture/platformWiring.test.ts | ACCOUNT2 | `d0f46b0cd027fc1d011e8a39ac3b17d0a0a75bb7` | `e8d25300b20f7ae1814690925c151a1b4eb4b38a` | ACCOUNT3 |
| test/platform.test.ts | ACCOUNT1 | `d785fd7f8850038dcb345a05d47d14cf4312e9fd` | `1b29564013cf6483e0c885f04b46bbd9fc964659` | ACCOUNT3 |
| test/platform.test.ts | ACCOUNT2 | `d0f46b0cd027fc1d011e8a39ac3b17d0a0a75bb7` | `5a3e7c0632321b8c837961bdf15b011ad058ca60` | ACCOUNT3 |
| test/runtime/accountRuntime.test.ts | ACCOUNT1 | `d785fd7f8850038dcb345a05d47d14cf4312e9fd` | `72576f9e2b3beae99db99f3d9fc39f331548b780` | ACCOUNT3 |
| test/runtime/arrivalAnchorMemoryContract.ts | TRUST1 | `0ad981c393536624fa5353e42f871f6db7b1e753` | `ca2e045bfeac340c9e7be10bf1de13836c02cf1e` | ACCOUNT3 |
| test/runtime/arrivalAnchorMemoryContract.ts | TRUST2 | `9782919eed2bca9753b49465210c6405961b3a64` | `9e74e2612a3d1fe3979b92980fa03e163d4dd19f` | ACCOUNT3 |
| test/runtime/arrivalAnchors.test.ts | TRUST1 | `0ad981c393536624fa5353e42f871f6db7b1e753` | `20f52ff906ccbf4dbdaf4e6583d74de112592bc9` | ACCOUNT3 |
| test/runtime/arrivalAnchors.test.ts | TRUST2 | `9782919eed2bca9753b49465210c6405961b3a64` | `ff8d6f6dea4dac4b403b356d26291e68f9ecce71` | ACCOUNT3 |
| test/runtime/monitoringHealth.test.ts | TRUST1 | `0ad981c393536624fa5353e42f871f6db7b1e753` | `09a2cda2a37697824185e8dc65d81452a7209fe9` | TRUST2 |
| test/runtime/retryPolicy.test.ts | POLICIES1 | `af2a8e1bda121d0804c50e37c0b7d6e8f2083906` | `d01dff6456bc4d69c4de162fcb43404e2a7763e4` | POLICIES2 |
| test/runtime/timers.test.ts | PORTS1 | `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa` | `979addb2ddaad063e92781464dca8d16da376cb8` | PORTS3 |
| test/runtime/timers.test.ts | PORTS2 | `f99a637908a693868793d1b19525ad979042ad37` | `aa95042ff3b93edcfe8a59c5cc5781364fd4d9e7` | PORTS3 |

## Stable finding disposition index

Each row is one actual historical finding. Initial coordinates are preserved
exactly from the seal and do not assert that a resolved defect remains at that
location. The rule text is preserved with whitespace flattened for the table.
The definition column points to the original issue/fix section; the closure
column points to the current complete review's actual independent disposition.
Its report revision is the qualified report commit listed above.
No heading or generic latest text occurrence is substituted for a closure row.

### Historical BLOCKER findings — all fixed

| Stable ID | Severity | Original rule | Original source coordinate | Original issue/fix definition | Current independent disposition |
| --- | --- | --- | --- | --- | --- |
| CR-04-PORTS-002 | BLOCKER | `skills/typescript-unit-testing/SKILL.md`, Patterns / Type-only modules and Do not test what a gate already enforces; reviewer Patterns / Type-only modules and Assertions; reviewer Classifying findings: a case a wrong implementation would pass is BLOCKER. | `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/accessoryStore.test.ts:17` | 04-PORTS-REVIEW.md:53–88 | Fixed; 04-PORTS-REVIEW.md:1486 (PORTS3) |
| CR-04-PORTS-006 | BLOCKER | Unit writer Assertions / independently expected whole values; reviewer Assertions / standalone negative assertions and whole values; reviewer central question and Classifying findings / wrong implementation would pass. Unit writer Time / deterministic explicit boundary. | `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/monotonicClock.test.ts:17` | 04-PORTS-REVIEW.md:88–122 | Fixed; 04-PORTS-REVIEW.md:1490 (PORTS3) |
| CR-04-PORTS-008 | BLOCKER | Unit writer central case discriminator and Assertions; unit reviewer central question and Classifying findings: a plausible wrong implementation that passes the owner is a test-reliability BLOCKER. | `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa:test/runtime/timers.test.ts:31` | 04-PORTS-REVIEW.md:970–1025 | Fixed; 04-PORTS-REVIEW.md:1492 (PORTS3) |
| CR-04-PORTS-009 | BLOCKER | Unit writer central case discriminator and Assertions; unit reviewer central question and Classifying findings. A plausible wrong implementation that passes the complete owner is a test-reliability BLOCKER. | `f99a637908a693868793d1b19525ad979042ad37:test/runtime/timers.test.ts:31` | 04-PORTS-REVIEW.md:1258–1297 | Fixed; 04-PORTS-REVIEW.md:1493 (PORTS3) |
| CR-04-POLICIES-004 | BLOCKER | Unit writer/reviewer, Assertions: compare whole promised values and construct expected values independently; reviewer central wrong-implementation question and BLOCKER classification for weak assertions. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:test/runtime/failureLog.test.ts:141` | 04-POLICIES-REVIEW.md:97–119 | Fixed; 04-POLICIES-REVIEW.md:1930 (POLICIES2) |
| CR-04-POLICIES-008 | BLOCKER | Unit writer/reviewer central discrimination rule; Assertions and Patterns/Time; 04-04-01 public schedule/controlled wait/completion contract. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:test/runtime/retryPolicy.test.ts:64` | 04-POLICIES-REVIEW.md:119–147 | Fixed; 04-POLICIES-REVIEW.md:1934 (POLICIES2) |
| CR-04-POLICIES-013 | BLOCKER | `skills/typescript-unit-testing/SKILL.md`, Pairing and coverage: the mirrored owner owns its source module's exported behavior; Assertions: expected values remain independent. Also `skills/typescript-unit-testing-review/SKILL.md`, central discrimination rule and Classifying findings/BLOCKER for a wrong implementation that passes the case. Compiler, lint and execution coverage do not pin this numeric value; the prohibition on gate-redundant tests does not make its observation redundant. | `af2a8e1bda121d0804c50e37c0b7d6e8f2083906:test/runtime/retryPolicy.test.ts:17` | 04-POLICIES-REVIEW.md:1431–1476 | Fixed; 04-POLICIES-REVIEW.md:1939 (POLICIES2) |
| CR-04-TRUST-002 | BLOCKER | AGENTS safety semantics; D-05 invalid persisted input; style Variables, literals, and data, finite-number validation; the store's own whole-file rejection contract at lines 119–126. | `23a2511ac6deb26869db8d3c44916623a27ec997:src/runtime/arrivalAnchors.ts:85` | 04-TRUST-REVIEW.md:56–92 | Fixed; 04-TRUST-REVIEW.md:2288 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-003 | BLOCKER | Unit writer/reviewer Assertions: independent expected values and complete bytes when files are the contract; D-05 exact durable filename/format. | `23a2511ac6deb26869db8d3c44916623a27ec997:test/runtime/arrivalAnchors.test.ts:59` | 04-TRUST-REVIEW.md:92–120 | Fixed; 04-TRUST-REVIEW.md:2289 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-004 | BLOCKER | Unit writer/reviewer central discrimination question and Assertions: public result/state before interactions; a wrong implementation must fail the case named for that behavior. | `23a2511ac6deb26869db8d3c44916623a27ec997:test/runtime/arrivalAnchors.test.ts:151` | 04-TRUST-REVIEW.md:120–142 | Fixed; 04-TRUST-REVIEW.md:2290 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-010 | BLOCKER | Unit writer/reviewer central discrimination question and Assertions; D-05 REST failure supplies no shadow arrival and cannot restart its window. | `23a2511ac6deb26869db8d3c44916623a27ec997:test/runtime/monitoringHealth.test.ts:302` | 04-TRUST-REVIEW.md:142–163 | Fixed; 04-TRUST-REVIEW.md:2296 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-011 | BLOCKER | Unit writer/reviewer Assertions: compare whole public values; membership, individual fields and key lists do not replace the promised value. | `23a2511ac6deb26869db8d3c44916623a27ec997:test/runtime/monitoringHealth.test.ts:155` | 04-TRUST-REVIEW.md:163–187 | Fixed; 04-TRUST-REVIEW.md:2297 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-ACCOUNT-006 | BLOCKER | unit writer/reviewer, Assertions: independent expected values and public state; each case must reject a plausible wrong implementation. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:643` | 04-ACCOUNT-REVIEW.md:147–160 | Fixed; 04-ACCOUNT-REVIEW.md:10151 (ACCOUNT3) |
| CR-04-ACCOUNT-007 | BLOCKER | unit writer/reviewer, Assertions and Patterns: expected values are independent from production computations; public behavior must discriminate. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:121` | 04-ACCOUNT-REVIEW.md:160–175 | Fixed; 04-ACCOUNT-REVIEW.md:10152 (ACCOUNT3) |
| CR-04-ACCOUNT-008 | BLOCKER | unit writer/reviewer, Assertions: whole public state and independent expected values; D-05/D-07 preserve restored anchors until a real arrival. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:816` | 04-ACCOUNT-REVIEW.md:175–189 | Fixed; 04-ACCOUNT-REVIEW.md:10153 (ACCOUNT3) |
| CR-04-ACCOUNT-009 | BLOCKER | unit writer/reviewer, Assertions and central discrimination rule; 04-09-01's existing shared-root cancellation promise. Seed S-04-06. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:3072` | 04-ACCOUNT-REVIEW.md:189–204 | Fixed; 04-ACCOUNT-REVIEW.md:10154 (ACCOUNT3) |
| CR-04-ACCOUNT-010 | BLOCKER | unit writer/reviewer, Assertions: public result/state before interactions and whole independent expectations; D-037 reported authority. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:2976` | 04-ACCOUNT-REVIEW.md:204–219 | Fixed; 04-ACCOUNT-REVIEW.md:10155 (ACCOUNT3) |
| CR-04-ACCOUNT-011 | BLOCKER | unit writer/reviewer, each case discriminates its title; Assertions. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:3087` | 04-ACCOUNT-REVIEW.md:219–233 | Fixed; 04-ACCOUNT-REVIEW.md:10156 (ACCOUNT3) |
| CR-04-ACCOUNT-018 | BLOCKER | unit writer/reviewer, Assertions: assert presence and complete public values, independent expectations; SC-03's missing-snapshot guard and readback. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:1832` | 04-ACCOUNT-REVIEW.md:233–251 | Fixed; 04-ACCOUNT-REVIEW.md:10163 (ACCOUNT3) |
| CR-04-ACCOUNT-019 | BLOCKER | unit writer/reviewer, Assertions: whole independent public state; D-05 preserves narrow per-device trust and account-wide facts separately. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:2194` | 04-ACCOUNT-REVIEW.md:251–268 | Fixed; 04-ACCOUNT-REVIEW.md:10164 (ACCOUNT3) |
| CR-04-ACCOUNT-020 | BLOCKER | unit writer/reviewer, Assertions: whole public state, not mere existence; D-029 callback-before-prune and exact-device cleanup. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:2653` | 04-ACCOUNT-REVIEW.md:268–284 | Fixed; 04-ACCOUNT-REVIEW.md:10165 (ACCOUNT3) |
| CR-04-ACCOUNT-021 | BLOCKER | canonical D-029; D-05 removal preservation; correctness. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:454` | 04-ACCOUNT-REVIEW.md:284–305 | Fixed; 04-ACCOUNT-REVIEW.md:10166 (ACCOUNT3) |
| CR-04-ACCOUNT-022 | BLOCKER | canonical D-002/D-003, F-001; D-05 current live-state ownership; correctness of discovering every supported physical device. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:419` | 04-ACCOUNT-REVIEW.md:305–326 | Fixed; 04-ACCOUNT-REVIEW.md:10167 (ACCOUNT3) |
| CR-04-ACCOUNT-023 | BLOCKER | canonical D-023/D-031 and current terminal-auth policy; D-05 lifecycle preservation; correctness. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:438` | 04-ACCOUNT-REVIEW.md:326–346 | Fixed; 04-ACCOUNT-REVIEW.md:10168 (ACCOUNT3) |
| CR-04-ACCOUNT-024 | BLOCKER | D-05 lifecycle/current ownership; canonical D-029's healthy-runtime condition; correctness and data-loss risk. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:439` | 04-ACCOUNT-REVIEW.md:346–370 | Fixed; 04-ACCOUNT-REVIEW.md:10169 (ACCOUNT3) |
| CR-04-ACCOUNT-025 | BLOCKER | correctness on untrusted expiry; D-05 existing bounded scheduling; style Errors/Types require meaningful runtime validation, not just plausible data. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:306` | 04-ACCOUNT-REVIEW.md:370–391 | Fixed; 04-ACCOUNT-REVIEW.md:10170 (ACCOUNT3) |
| CR-04-ACCOUNT-026 | BLOCKER | canonical D-029 explicitly covers cached accessories; D-020 confirmed removal and D-031 cached restart preservation; correctness. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:334` | 04-ACCOUNT-REVIEW.md:391–417 | Fixed; 04-ACCOUNT-REVIEW.md:10171 (ACCOUNT3) |
| CR-04-ACCOUNT-027 | BLOCKER | unit writer/reviewer, Test doubles and Assertions: strict absence interaction promises; each case rejects a plausible wrong implementation. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:488` | 04-ACCOUNT-REVIEW.md:417–434 | Fixed; 04-ACCOUNT-REVIEW.md:10172 (ACCOUNT3) |
| CR-04-ACCOUNT-028 | BLOCKER | unit writer/reviewer, Test doubles: shared exact order log when order is the promise; Assertions: complete meaningful observations; AUTH-02. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:531` | 04-ACCOUNT-REVIEW.md:434–450 | Fixed; 04-ACCOUNT-REVIEW.md:10173 (ACCOUNT3) |
| CR-04-ACCOUNT-029 | BLOCKER | unit writer/reviewer, case-title discrimination and Assertions. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:3157` | 04-ACCOUNT-REVIEW.md:450–463 | Fixed; 04-ACCOUNT-REVIEW.md:10174 (ACCOUNT3) |
| CR-04-ACCOUNT-030 | BLOCKER | SYNC-03 source handoff, D-15 reported authority, and the runtime's documented monitoring-path/current-connection contract. On changed membership, `client.start(deviceIds)` replaces and ends the old real transport. The new real connection starts `live=false`, and replacement does not emit `onDisconnected`. Runtime `shadowConnected` remains true and every old shadow watermark remains held. A subsequent healthy REST poll therefore cannot refresh that device's telemetry while the runtime still reports `shadow-and-poll`. The source explanation that a lost shadow hands telemetry back to polling is false for this replacement path. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:src/runtime/accountRuntime.ts:903` | 04-ACCOUNT-REVIEW.md:6502–6529 | Fixed; 04-ACCOUNT-REVIEW.md:10175 (ACCOUNT3) |
| CR-04-ACCOUNT-031 | BLOCKER | DEV-04/05 stable registration, per-inventory failure isolation and current dispatch's retry-after-failure contract. The instance map, store subscription and accessory map are populated before the synchronous `registerPlatformAccessories` call. If that call throws before acceptance, the outer catch logs and returns with both maps populated. Every later trustworthy inventory takes the existing-device branch and never attempts registration again. The HomeKit accessory can remain absent for the process life. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:src/platform.ts:342` | 04-ACCOUNT-REVIEW.md:6529–6554 | Fixed; 04-ACCOUNT-REVIEW.md:10176 (ACCOUNT3) |
| CR-04-ACCOUNT-039 | BLOCKER | unit title discrimination, Assertions and Production design for tests (use module exports); static call-graph questions belong to static analysis. The DiscoveryContext detector requires all nine keys in one fixed order. A second valid literal with reordered keys still satisfies DiscoveryContext but does not match the detector, so the exactly-one-literal test remains green. Its planted control uses only the favored order and does not close this hole. The comparedKeys case similarly inspects text of two local constants rather than the actual persistence behavior. Passing these tests does not establish the promised semantic structure/use. Compiler success cannot repair the regex blind spot because object property order is not part of the TypeScript contract. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:115` | 04-ACCOUNT-REVIEW.md:6661–6682 | Fixed; 04-ACCOUNT-REVIEW.md:10184 (ACCOUNT3) |
| CR-04-ACCOUNT-042 | BLOCKER | unit absence discrimination, explicit dependencies and offline hermeticity. These cases spy on globalThis.fetch, construct the platform with the default deps, and claim zero vendor calls. Default deps use the imported userland-undici httpFetch, so those spies cannot observe a premature vendor request. The neighboring lifecycle case explicitly injects globalThis.fetch through PlatformDeps, demonstrating the actual seam these cases omit. The current constructor is inert; the finding is a false-negative absence test, not an observed production request or a live-network run. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:1065` | 04-ACCOUNT-REVIEW.md:6707–6724 | Fixed; 04-ACCOUNT-REVIEW.md:10186 (ACCOUNT3) |
| CR-04-ACCOUNT-043 | BLOCKER | unit Assertions/independent whole public values and prescribed notification arguments. The case promises each accessory's own answer, but its recording accessory keeps only deviceId/restDegraded/shadowSilent. It discards commandTransportReady and credentialsRejected, both consumed by the actual accessory. This is the named-device case supplying ready=true; the companion whole-value missing-entry case supplies ready=false. Rebuilding the named-device answer with a false command-ready default can therefore pass this claimed two-device forwarding observation. The whole struct is the promise. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:430` | 04-ACCOUNT-REVIEW.md:6724–6741 | Fixed; 04-ACCOUNT-REVIEW.md:10187 (ACCOUNT3) |
| CR-04-ACCOUNT-044 | BLOCKER | unit title discrimination, independent timing Assertions and Time. The configured-interval case advances the entire900000ms once and then checks the replacement snapshot. It never observes state immediately before the configured deadline. A shorter wait, such as half the interval, fires during that tick and its asynchronous continuation applies at the already advanced wall clock, producing the same receipt time and final snapshot. The next loop wait is installed after the tick, so the single observation does not expose an extra earlier poll. Complete final snapshots do not supply a missing boundary. Original007 concerned credential lead/floor and is fixed; this is a distinct poll-cadence assertion cause. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/runtime/accountRuntime.test.ts:3562` | 04-ACCOUNT-REVIEW.md:6741–6761 | Fixed; 04-ACCOUNT-REVIEW.md:10188 (ACCOUNT3) |
| CR-04-ACCOUNT-045 | BLOCKER | Unit writer Assertions91–108 and reviewer Assertions46–50 / classification117; the central title-discrimination rule at writer10 and reviewer10. | `d0f46b0cd027fc1d011e8a39ac3b17d0a0a75bb7:test/platform.test.ts:3350` | 04-ACCOUNT-REVIEW.md:9176–9209 | Fixed; 04-ACCOUNT-REVIEW.md:10115 (ACCOUNT3) |

### Historical WARNING findings — all fixed

| Stable ID | Severity | Original rule | Original source coordinate | Original issue/fix definition | Current independent disposition |
| --- | --- | --- | --- | --- | --- |
| CR-04-PORTS-001 | WARNING | CONTEXT D-01; protocol Typed roles / complete headers; style Files and modules / copyright JSDoc, fileoverview JSDoc, exactly one blank line between present sections; style Classifying findings / documentation WARNING. | `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:src/runtime/accessoryStore.ts:1` | 04-PORTS-REVIEW.md:124–145 | Fixed; 04-PORTS-REVIEW.md:1485 (PORTS3) |
| CR-04-PORTS-003 | WARNING | CONTEXT D-01; protocol complete headers; style Files and modules; style Classifying findings / documentation WARNING. | `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:src/runtime/clock.ts:1` | 04-PORTS-REVIEW.md:145–161 | Fixed; 04-PORTS-REVIEW.md:1487 (PORTS3) |
| CR-04-PORTS-004 | WARNING | Unit writer Case structure: `// act & assert` only for one `assert.rejects()` or `assert.throws()` expression; reviewer Case structure; reviewer Classifying findings / AAA comments WARNING. | `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/clock.test.ts:16` | 04-PORTS-REVIEW.md:161–179 | Fixed; 04-PORTS-REVIEW.md:1488 (PORTS3) |
| CR-04-PORTS-005 | WARNING | CONTEXT D-01; protocol complete headers; style Files and modules; style Classifying findings / documentation WARNING. | `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:src/runtime/monotonicClock.ts:1` | 04-PORTS-REVIEW.md:179–196 | Fixed; 04-PORTS-REVIEW.md:1489 (PORTS3) |
| CR-04-PORTS-007 | WARNING | CONTEXT D-01; protocol complete headers; style Files and modules; style Classifying findings / documentation WARNING. | `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:src/runtime/timers.ts:1` | 04-PORTS-REVIEW.md:196–214 | Fixed; 04-PORTS-REVIEW.md:1491 (PORTS3) |
| CR-04-POLICIES-001 | WARNING | CONTEXT D-01; REVIEW-PROTOCOL/Typed roles, terminal waits and complete books; style/Files and modules. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:src/runtime/commandPort.ts:1` | 04-POLICIES-REVIEW.md:149–165 | Fixed; 04-POLICIES-REVIEW.md:1927 (POLICIES2) |
| CR-04-POLICIES-002 | WARNING | style/Types: “Object types declared with interface, not a type alias of an object literal”; D-06 and the bounded public-variant authorization in 04-03-01 and REVIEW-PROTOCOL/Runtime preservation. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:src/runtime/commandPort.ts:19` | 04-POLICIES-REVIEW.md:192–213 | Fixed; 04-POLICIES-REVIEW.md:1928 (POLICIES2) |
| CR-04-POLICIES-003 | WARNING | D-01 and style/Files and modules, as for 001. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:src/runtime/failureLog.ts:1` | 04-POLICIES-REVIEW.md:165–177 | Fixed; 04-POLICIES-REVIEW.md:1929 (POLICIES2) |
| CR-04-POLICIES-005 | WARNING | Unit writer/Naming values; reviewer/Naming explicitly prohibits `value`. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:test/runtime/failureLog.test.ts:19` | 04-POLICIES-REVIEW.md:213–224 | Fixed; 04-POLICIES-REVIEW.md:1931 (POLICIES2) |
| CR-04-POLICIES-006 | WARNING | Unit writer/reviewer, Case structure: separate lowercase AAA phases; `act & assert` only for one throwing/rejection assertion. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:test/runtime/failureLog.test.ts:54` | 04-POLICIES-REVIEW.md:224–237 | Fixed; 04-POLICIES-REVIEW.md:1932 (POLICIES2) |
| CR-04-POLICIES-007 | WARNING | D-01 and style/Files and modules, as for 001. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:src/runtime/retryPolicy.ts:1` | 04-POLICIES-REVIEW.md:177–190 | Fixed; 04-POLICIES-REVIEW.md:1933 (POLICIES2) |
| CR-04-POLICIES-009 | WARNING | Unit writer/reviewer, Case structure/AAA and behavior titles. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:test/runtime/retryPolicy.test.ts:87` | 04-POLICIES-REVIEW.md:237–251 | Fixed; 04-POLICIES-REVIEW.md:1935 (POLICIES2) |
| CR-04-POLICIES-010 | WARNING | Unit writer/reviewer, Test doubles: “Logging gets a silent stub; log calls are asserted only in a module whose job is logging.” | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:test/runtime/retryPolicy.test.ts:10` | 04-POLICIES-REVIEW.md:251–269 | Fixed; 04-POLICIES-REVIEW.md:1936 (POLICIES2) |
| CR-04-POLICIES-011 | WARNING | style/Functions: named functions are declarations; a const arrow is allowed only with an explicit function type or an outer-this requirement. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:test/runtime/retryPolicy.test.ts:12` | 04-POLICIES-REVIEW.md:269–283 | Fixed; 04-POLICIES-REVIEW.md:1937 (POLICIES2) |
| CR-04-POLICIES-012 | WARNING | Unit writer/reviewer, Test doubles: prescribed callback interactions use case-owned `strong-mock` with exactParams and explicit verify; scope requires context-owned doubles or case-owned strong-mock rather than a custom tracker. | `e25e26e6232ed99411b7463a7f9839c5eb837ec0:test/runtime/retryPolicy.test.ts:40` | 04-POLICIES-REVIEW.md:283–302 | Fixed; 04-POLICIES-REVIEW.md:1938 (POLICIES2) |
| CR-04-TRUST-001 | WARNING | D-01 / PROC-03; style Files and modules. | `23a2511ac6deb26869db8d3c44916623a27ec997:src/runtime/arrivalAnchors.ts:1` | 04-TRUST-REVIEW.md:189–208 | Fixed; 04-TRUST-REVIEW.md:2287 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-005 | WARNING | Unit writer/reviewer Production design for tests: make nondeterministic dependencies explicit; inject the existing hidden dependency rather than add module replacement, a test mode or a production state reader. | `23a2511ac6deb26869db8d3c44916623a27ec997:src/runtime/arrivalAnchors.ts:133` | 04-TRUST-REVIEW.md:208–233 | Fixed; 04-TRUST-REVIEW.md:2291 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-006 | WARNING | Comment policy opening rule and Forbidden narration of past code; D-05/D-06 current restart and admission semantics. Candidate S-04-07. | `23a2511ac6deb26869db8d3c44916623a27ec997:src/runtime/arrivalAnchors.ts:57` | 04-TRUST-REVIEW.md:233–265 | Fixed; 04-TRUST-REVIEW.md:2292 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-007 | WARNING | D-05/D-06 scoped privacy premise; canonical C-002; STATE Decisions, ratified deviceId treatment; truthful current documentation. | `23a2511ac6deb26869db8d3c44916623a27ec997:src/runtime/arrivalAnchors.ts:14` | 04-TRUST-REVIEW.md:265–287 | Fixed; 04-TRUST-REVIEW.md:2293 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-008 | WARNING | Unit writer/reviewer Case structure: arrange, act, assert in order. | `23a2511ac6deb26869db8d3c44916623a27ec997:test/runtime/arrivalAnchors.test.ts:137` | 04-TRUST-REVIEW.md:287–303 | Fixed; 04-TRUST-REVIEW.md:2294 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-009 | WARNING | D-01 / PROC-03; style Files and modules. | `23a2511ac6deb26869db8d3c44916623a27ec997:src/runtime/monitoringHealth.ts:1` | 04-TRUST-REVIEW.md:303–320 | Fixed; 04-TRUST-REVIEW.md:2295 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-012 | WARNING | Unit writer/reviewer Test doubles and Patterns, Shared adapter contracts: real and stateful fake participants share a discriminating contract. | `23a2511ac6deb26869db8d3c44916623a27ec997:test/runtime/monitoringHealth.test.ts:69` | 04-TRUST-REVIEW.md:320–347 | Fixed; 04-TRUST-REVIEW.md:2298 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-013 | WARNING | Unit writer/reviewer Case structure and writer completion checklist: `// act & assert` is reserved for one throwing/rejection expression. | `23a2511ac6deb26869db8d3c44916623a27ec997:test/runtime/monitoringHealth.test.ts:130` | 04-TRUST-REVIEW.md:347–365 | Fixed; 04-TRUST-REVIEW.md:2299 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-014 | WARNING | Comment policy Forbidden narration of code that no longer exists; opening rule: describe current behavior and its reason, leave process history to Git. D-05 preserves the actual present clock/admission contract. | `23a2511ac6deb26869db8d3c44916623a27ec997:src/runtime/monitoringHealth.ts:55` | 04-TRUST-REVIEW.md:365–388 | Fixed; 04-TRUST-REVIEW.md:2300 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-015 | WARNING | Style Comments and documentation: method descriptions begin with a third-person verb phrase. | `23a2511ac6deb26869db8d3c44916623a27ec997:src/runtime/arrivalAnchors.ts:57` | 04-TRUST-REVIEW.md:388–408 | Fixed; 04-TRUST-REVIEW.md:2301 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-016 | WARNING | Unit writer, Test doubles / Not doubles: logging gets a silent stub; log calls are asserted only in a module whose job is logging. Unit reviewer, Test doubles, repeats this rule. Requirement RUN-01. | `0ad981c393536624fa5353e42f871f6db7b1e753:test/runtime/arrivalAnchors.test.ts:36` | 04-TRUST-REVIEW.md:1723–1758 | Fixed; 04-TRUST-REVIEW.md:2302 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-TRUST-017 | WARNING | Unit writer/reviewer, Case structure: arrange, act and assert appear in order. The combined marker is reserved for one throwing/rejection expression. Requirement RUN-01. | `0ad981c393536624fa5353e42f871f6db7b1e753:test/runtime/arrivalAnchors.test.ts:91` | 04-TRUST-REVIEW.md:1758–1799 | Fixed; 04-TRUST-REVIEW.md:2303 (TRUST2 with current ACCOUNT3 cover where applicable) |
| CR-04-ACCOUNT-001 | WARNING | D-01; style Files and modules; PROC-03 approved header. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:1` | 04-ACCOUNT-REVIEW.md:465–477 | Fixed; 04-ACCOUNT-REVIEW.md:10146 (ACCOUNT3) |
| CR-04-ACCOUNT-002 | WARNING | D-05/D-06 privacy preservation; comments policy, factual what/why; canonical C-002/D-027 and scoped STATE decision. Seed S-04-08. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:71` | 04-ACCOUNT-REVIEW.md:477–493 | Fixed; 04-ACCOUNT-REVIEW.md:10147 (ACCOUNT3) |
| CR-04-ACCOUNT-003 | WARNING | style Comments and documentation; comments policy what/why; D-05 bounded shared-root shutdown semantics. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:316` | 04-ACCOUNT-REVIEW.md:493–511 | Fixed; 04-ACCOUNT-REVIEW.md:10148 (ACCOUNT3) |
| CR-04-ACCOUNT-004 | WARNING | typescript-comments, Forbidden in comments and test titles: "Narration of code that no longer exists." | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:450` | 04-ACCOUNT-REVIEW.md:511–526 | Fixed; 04-ACCOUNT-REVIEW.md:10149 (ACCOUNT3) |
| CR-04-ACCOUNT-005 | WARNING | style Functions: a named function is a declaration; const arrows need an explicit function type or outer-this requirement. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:src/runtime/accountRuntime.ts:1236` | 04-ACCOUNT-REVIEW.md:526–539 | Fixed; 04-ACCOUNT-REVIEW.md:10150 (ACCOUNT3) |
| CR-04-ACCOUNT-012 | WARNING | unit writer/reviewer, Test doubles: "Logging gets a silent stub; log calls are asserted only in a module whose job is logging." | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:232` | 04-ACCOUNT-REVIEW.md:539–557 | Fixed; 04-ACCOUNT-REVIEW.md:10157 (ACCOUNT3) |
| CR-04-ACCOUNT-013 | WARNING | unit writer/reviewer, Test doubles: prescribed interactions use strong-mock with exactParams, complete expectations and explicit per-case verify; a replacement method is a stub, not a real-behavior spy. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:477` | 04-ACCOUNT-REVIEW.md:557–574 | Fixed; 04-ACCOUNT-REVIEW.md:10158 (ACCOUNT3) |
| CR-04-ACCOUNT-014 | WARNING | unit writer/reviewer, Test data and Case structure: cross-case seeds are fresh functions in the concern's seed module; no shared mutable data. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:135` | 04-ACCOUNT-REVIEW.md:574–588 | Fixed; 04-ACCOUNT-REVIEW.md:10159 (ACCOUNT3) |
| CR-04-ACCOUNT-015 | WARNING | unit writer/reviewer, Patterns: Shared adapter contracts, fresh participants, typed inventory and independently proved negative control. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:304` | 04-ACCOUNT-REVIEW.md:588–609 | Fixed; 04-ACCOUNT-REVIEW.md:10160 (ACCOUNT3) |
| CR-04-ACCOUNT-016 | WARNING | unit writer/reviewer, Case structure: arrange/act/assert in order; combined marker only for one throwing/rejection expression. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:1623` | 04-ACCOUNT-REVIEW.md:609–624 | Fixed; 04-ACCOUNT-REVIEW.md:10161 (ACCOUNT3) |
| CR-04-ACCOUNT-017 | WARNING | unit writer/reviewer, Case structure: top-level describe names an exported entrypoint; no grouping by private helpers/concerns. | `e6f49a59671c13a20b696b7f46e38406a36aeec0:test/runtime/accountRuntime.test.ts:623` | 04-ACCOUNT-REVIEW.md:624–638 | Fixed; 04-ACCOUNT-REVIEW.md:10162 (ACCOUNT3) |
| CR-04-ACCOUNT-032 | WARNING | Google Functions, named declaration or explicit callable binding type. These `const` arrows have parameter/return annotations but no explicit function type on the binding, and none needs outer `this`. Original005's source helper is independently fixed; these are different extant declarations found in the full current owners. Platform constructor discoveryContext is allowed because it needs outer `this` and is not included. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/runtime/accountRuntime.test.ts:2809` | 04-ACCOUNT-REVIEW.md:6554–6570 | Fixed; 04-ACCOUNT-REVIEW.md:10177 (ACCOUNT3) |
| CR-04-ACCOUNT-033 | WARNING | typescript-comments Forbidden, current behavior rather than removed code/planning history; Google Comments/documentation. Examples narrate what caching first left behind, what a prior comment claimed, the fixture that was replaced, and the old three-literal source result. The owner also retains planning-artifact anchors such as `04-CONTEXT`/`03-CONTEXT` and `(05-16)` rather than self-contained durable rationale. These are source/ test comments, not historical report records that must remain immutable. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:src/platform.ts:331` | 04-ACCOUNT-REVIEW.md:6570–6586 | Fixed; 04-ACCOUNT-REVIEW.md:10178 (ACCOUNT3) |
| CR-04-ACCOUNT-034 | WARNING | unit Types/hermeticity and Production design for tests: no double assertion hiding an invalid double; narrow consumer port or typed strict mock. `standIn` implements only HAP, the accessory constructor and three registration methods, then asserts `as unknown as API`. It does not satisfy the Homebridge API type that the consumer declares. Compiler success therefore supplies no contract check for this double. The surrounding helper makes this a recurring discovery dependency. This finding does not demand replacing the deliberately documented nominal fake-HAP cast or silently changing a private helper signature. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:374` | 04-ACCOUNT-REVIEW.md:6586–6603 | Fixed; 04-ACCOUNT-REVIEW.md:10179 (ACCOUNT3) |
| CR-04-ACCOUNT-035 | WARNING | unit Test doubles, Not doubles/Logging: silent logging outside a module whose job is logging. Logger-output expectations are still coupled into platform configuration, marking and discovery tests, including empty-message assertions. ACCOUNT original012 is fixed in its own owner; these external cases remain. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:63` | 04-ACCOUNT-REVIEW.md:6603–6617 | Fixed; 04-ACCOUNT-REVIEW.md:10180 (ACCOUNT3) |
| CR-04-ACCOUNT-036 | WARNING | unit Test doubles, Mocks and Spies. Registration/removal/notification recorders are prescribed public interactions, but are plain replacement methods with manually asserted histories/counts rather than exactParams strong mocks and explicit verification. The replaced global fetch handles are stubs, despite their Spy names and call-count assertions. These are not spies running real behavior. Source031 shows one missing failure/retry observation, but does not exhaust this independent interaction-discipline cause. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:374` | 04-ACCOUNT-REVIEW.md:6617–6634 | Fixed; 04-ACCOUNT-REVIEW.md:10181 (ACCOUNT3) |
| CR-04-ACCOUNT-037 | WARNING | unit Case structure and Test data. Account config, telemetry fixtures, family objects and the shared NO_DEVICE_ANSWERED Map are reused across cases instead of concern seed factories/fresh case-owned values. TypeScript readonly views do not make the underlying objects/Map immutable. This is a data/support structure finding, not a claim that the passing current run demonstrated a leak. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:147` | 04-ACCOUNT-REVIEW.md:6634–6647 | Fixed; 04-ACCOUNT-REVIEW.md:10182 (ACCOUNT3) |
| CR-04-ACCOUNT-038 | WARNING | unit Patterns/Time: do not await real timers or poll. `until` repeatedly awaits event-loop turns against `Date.now()+5000`. Its result depends on real scheduling/load and adds a real five-second timeout to many otherwise controlled cases, including the new cached-identity owner. Real temporary filesystem work is allowed; it does not require wall-clock polling. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:98` | 04-ACCOUNT-REVIEW.md:6647–6661 | Fixed; 04-ACCOUNT-REVIEW.md:10183 (ACCOUNT3) |
| CR-04-ACCOUNT-040 | WARNING | unit Case structure: one top-level describe per exported entrypoint; do not group by private helper/concern. `the platform builds its runtime context once` is neither an exported entrypoint nor an allowed shared mutable fixture group. Original017's ACCOUNT factory groups are fixed; this external group was independently observed in the complete platform owner. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:2648` | 04-ACCOUNT-REVIEW.md:6682–6695 | Fixed; 04-ACCOUNT-REVIEW.md:10185 (ACCOUNT3) |
| CR-04-ACCOUNT-041 | WARNING | unit Case structure: arrange/act/assert in order; combined marker only for one throws/rejects expression. The wiring case has no arrange phase; the planted-literal case performs ordinary deepStrictEqual work under act & assert. Original016's ACCOUNT phases are fixed; these external cases retain the defect. | `d785fd7f8850038dcb345a05d47d14cf4312e9fd:test/platform.test.ts:1414` | 04-ACCOUNT-REVIEW.md:6695–6707 | Fixed; 04-ACCOUNT-REVIEW.md:10114 (ACCOUNT3) |
| CR-04-ACCOUNT-046 | WARNING | Unit writer Naming46 and reviewer Naming38–43 explicitly prohibit `result`; reviewer Classification118 assigns naming WARNING. | `d0f46b0cd027fc1d011e8a39ac3b17d0a0a75bb7:test/architecture/platformWiring.test.ts:128` | 04-ACCOUNT-REVIEW.md:9229–9245 | Fixed; 04-ACCOUNT-REVIEW.md:10116 (ACCOUNT3) |
| CR-04-ACCOUNT-047 | WARNING | Comments8 describes current what/why; Google Comments124–129 and Classification137 require accurate documentation. This concerns a factual claim, not cosmetic prose. | `d0f46b0cd027fc1d011e8a39ac3b17d0a0a75bb7:test/platform.test.ts:1636` | 04-ACCOUNT-REVIEW.md:9245–9266 | Fixed; 04-ACCOUNT-REVIEW.md:10117 (ACCOUNT3) |
| CR-04-ACCOUNT-048 | WARNING | Unit writer Case structure37–38 and reviewer33 / classification118. | `d0f46b0cd027fc1d011e8a39ac3b17d0a0a75bb7:test/architecture/platformWiring.test.ts:122` | 04-ACCOUNT-REVIEW.md:9266–9286 | Fixed; 04-ACCOUNT-REVIEW.md:10118 (ACCOUNT3) |

## Preserved qualifications and pending decisions

All accepted IDs reconcile: PORTS 9/9 fixed, POLICIES 13/13, TRUST 17/17,
ACCOUNT 48/48; total 87 fixed and zero open. No accepted finding was renamed
or rejected. Original current source coordinates, complete issue/fix prose,
first independent closure rounds and native checks remain in the qualified
reports and `findings[*]` seal entries.

ACCOUNT031's original refused-registration diagnosis is historical. Its
authoritative user supersession is recorded in 04-13 at
`ad05d52f0d1088020a8666deeacd06842ebedad8`: a synchronous registration throw
leaves uncertainty until restart. The current ACCOUNT3 closure applies that
decision without automatic retry, compensation or a fabricated acceptance oracle.

The exact three maintainer acceptances are ACCOUNT021
`ce3305e8ce53f92e5e4e24a12e1694e95ced4489` and ACCOUNT022
`5987504236d4292d05cb3b1c50ac4a4ce1197a9f` with original audit exits still
null, plus ACCOUNT008 `84fd96017082503acc897521f2d458e82297266f`'s exact
post-audit owner-title wording patch. Nothing here waives other WINDOWS46–58
entries, which remain OPEN/unwaived, or any future stop.

E-04-01, P-04-01 and P-04-02 remain unanswered. RUN-01 remains Pending.
Zero open source-review findings does not resolve those judgments, complete
the requirement, replace fresh goal verification or approve a release.
Genuine RED histories and separate maintenance controls retain their original
classification, chronology and limitations.

## Reuse and preservation boundary

The parent full gate and exact unchanged-input comparison are recorded in
[04-REVIEW.md](04-REVIEW.md). No build, test, mutation control or new full source
inspection was performed in this aggregation.

The parent's existing records retain these pre-existing SHA256 values:

| Record | Preserved SHA256 |
| --- | --- |
| 04-VALIDATION.md | `36d6e174dba7cfda0a469234f318a554aa8c57cca40013e86980766e2109476a` |
| 04-SECURITY.md | `e1122a6f49598ce4daf6036b22c993dbce966591e7d44574cadb4584eb1b2c09` |

Only 04-REVIEW.md and 04-REVIEW-DISPOSITION.md are owned by this task.
No source, test, original report, seal, plan, SUMMARY, shared state, staging
or Git history change is authorized or performed.
