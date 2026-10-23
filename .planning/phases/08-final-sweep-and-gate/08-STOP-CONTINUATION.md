# Phase 08 authorized STOP continuation

Milestone: `code-review-sweep`. The maintainer authorized a bounded GSD debug and replan after the DEVICE round-one no-progress STOP. This record is separate from [the original correction rounds](08-CORRECTION-ROUNDS.md). Their ROOT round 1, DEVICE round 1, seven IDs at STOP, and active STOP marker remain unchanged. No Plan 08-14 correction round is added here.

## Shadow liveness debug

CR-08-RUNTIME-004 is fixed at `c8aac01`. The active named regression, `hands stale shadow telemetry to the poll despite repeated messages without readings`, failed on unchanged production at `8a122ac` with one executed intended assertion: the store retained stale shadow level 2 and version 7, reported `shadowSilent: false`, and renewed the arrival anchor instead of accepting REST level 31 after telemetry silence. [The complete RED record](08-RUNTIME-004-RED-EVIDENCE.json) passed `tdd-red-evidence --raw` and was committed alone at `4b3d23a`. The GREEN change stamps liveness only for a nonempty telemetry record and still applies every patch to the store. The named case, all 170 runtime owner cases, 150 adjacent cases, static checks, isolated 100% line/function/branch coverage, and revert-and-reconfirm passed.

Independent reviewer `/root/phase8_shadow_debug_review` read complete current `src/runtime/accountRuntime.ts` lines 1-1346, blob `aed73e14c401fa2bea25e27e637a1ff06cd25a72`, and `test/runtime/accountRuntime.test.ts` lines 1-9445, blob `558caccde2e5210dca3197bcdaae5e8937669ac4`, at `c8aac01`. The reviewer confirmed RUNTIME-004 and found distinct **CR-08-RUNTIME-005**: at `c8aac01:src/runtime/accountRuntime.ts:895-899`, liveness is stamped before `src/device/state.ts:349-359` rejects an older or duplicate version. Repeated rejected telemetry can keep the silence clock fresh while old safety readings remain trusted. This is an accepted BLOCKER with a static trace; it has no active RED or repair. An accepted higher-version heartbeat with unchanged readings must continue to renew liveness. RUNTIME-005 is a new cause, not a reopening of RUNTIME-004.

## Corrected behavioral oracle and combined gate

The first combined `TEST_CONCURRENCY=1 npm run check` after `c8aac01` exited 1 because `features/monitoring/degradation.feature:209` still expected `Status Active=true` after metadata with unreadable telemetry. That was **CR-08-FEATURES-003**, an incorrect behavioral oracle. The corrected scenario at `6c578b8` keeps the metadata and later REST flood checks, expects `Status Active=false` before and after the flood, and explains why the metadata does not restore telemetry trust. Its named offline Cucumber scenario passed 1/1 with 20/20 steps.

Independent reviewer `/root/phase8_feature_oracle_review` read the complete current 730-line feature at `6c578b8`, blob `9bde291114d45a579f50251189f6e54035fe732c`, in contiguous spans 1-180, 181-360, 361-540, and 541-730. The reviewer confirmed FEATURES-003 fixed with no new or reopened finding. The full `TEST_CONCURRENCY=1 npm run check` on Node `v26.12.1` exited 0 for the exact tree committed as `6c578b8`: six static checks, unpaired tests, 130/130 offline Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. The tree was clean after the commit. The initial sandbox-only named run failed at `listen EPERM`; the same named scenario passed with local loopback access, so that attempt is not a product RED.

The complete current feature read also has a structured `supplementalReviews` row in this continuation's JSON so the final seal can match its exact blob. This records the already completed review; it does not add a correction round.

## Current forward work

The original STOP's seven-ID snapshot remains in its machine record. At the start of this separately authorized continuation, the forward-open set had seven IDs: `CR-08-DEVICE-002`, `CR-08-RUNTIME-001`, `CR-08-RUNTIME-002`, `CR-08-RUNTIME-003`, `CR-08-RUNTIME-005`, `CR-08-FEATURES-001`, and `CR-08-FEATURES-002`. RUNTIME-004 left the set after independent review; RUNTIME-005 entered it. FEATURES-003 arose and was fixed within this addendum. This is neither progress under Plan 08-14 nor permission to erase its STOP. The current set after RUNTIME round 1 is recorded below.

## RUNTIME continuation correction round 1

Plan 08-16 repaired four distinct causes in separate active RED and GREEN sequences. Each final active regression failed on unchanged production with an intended assertion; each exact RED record passed `tdd-red-evidence --raw` and was committed alone before its source/test fix. Preliminary RED records for 001, 002, and 005 were superseded by V2 records after the final test patch changed; the earlier records remain visible. [The bug ledger](08-BUG-LEDGER.md#phase-8) gives each source, V2 evidence, and GREEN commit. Focused owner and adjacent suites, static checks, and isolated 100% line/function/branch direct coverage passed for every changed source pair. Normal commit hooks passed.

The combined `TEST_CONCURRENCY=1 npm run check` at clean revision `6ba036f92b526887ac04ba80256de5d7e2ed210b` on Node `v26.12.1` exited 0: 130/130 Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. No executable input changed between that gate and the independent review.

Independent reviewer `/root/phase8_runtime_continuation_review` read every changed current file completely at `6ba036f92b526887ac04ba80256de5d7e2ed210b`. Executor `/root/phase8_runtime005_red` edited those six files and did not conduct their independent review. Each machine review row records `editedBy` and `reviewScope: owner`:

| Path | Full blob | Complete lines and contiguous reads | Result |
| --- | --- | --- | --- |
| `src/runtime/accountRuntime.ts` | `2f21725db1d718ce8a9b69653b04de4a6607f59d` | 1-1346; 1-300, 301-650, 651-1000, 901-1200, 1201-1346 | 001 and 005 fixed; new 006 traced |
| `test/runtime/accountRuntime.test.ts` | `9aa0a99a18eea2d18022497bec2f2cedcda01b58` | 1-9672; 1-1000, 1001-2000 (1468-1500 reread at 1460-1505), then adjacent 500-line spans through 9500, 9501-9672 | 001 and 005 regressions; 006 ordering gap |
| `src/runtime/arrivalAnchors.ts` | `024b729789a271be9c90cb65e0885b5ba5c4cfd6` | 1-218 | 002 fixed |
| `test/runtime/arrivalAnchors.test.ts` | `34d9f112497ea5dafc728609bf676b31f0ac528d` | 1-457; 1-126, 127-367, 368-457 | 002 regression |
| `src/runtime/failureLog.ts` | `ce344523252d659f811cfdab41d349096f7f900c` | 1-95 | 003 fixed |
| `test/runtime/failureLog.test.ts` | `ec7d605191eedb14e83a47e705e0a323970a3561` | 1-361 | 003 regression |

The reviewer also traced bounded `src/device/state.ts`, `src/runtime/monitoringHealth.ts`, and shadow delivery. Four opening IDs (001, 002, 003, 005) were fixed, none rejected or reopened, and one distinct BLOCKER, **CR-08-RUNTIME-006**, was found. The arithmetic is **4 opening − 4 fixed − 0 rejected + 1 new + 0 reopened = 1 closing**. Round 1 progressed; the continuation STOP predicate did not fire. The whole forward-open set now has four IDs: `CR-08-DEVICE-002`, `CR-08-RUNTIME-006`, `CR-08-FEATURES-001`, and `CR-08-FEATURES-002`.

RUNTIME-006 arises after a still-open shadow connection falls silent. `src/device/state.ts:404-408` clears its version watermark on source release, so an older duplicate can be accepted at `:349-360`, replace a newer REST flood observation at `:263-274`, and renew runtime liveness at `src/runtime/accountRuntime.ts:892-900`. The existing 005 test sends duplicates before release. A read-only inline reproduction against the already-built state module applied version 7 normal, released shadow, applied REST flood level 3, then replayed version 7 normal. It yielded `afterRest.waterLevel=3` and `afterReplay.waterLevel=2`, with `accepted=true`. This confirms the store-side transition; a named end-to-end RED and focused repair remain due. The reviewer judged this a new source-release/version-fence cause, not a return of 005's stamp-before-rejection cause. Vendor replay frequency is unknown. A focused round-2 plan must precede DEVICE work; the historical STOP and its round counts remain unchanged.

## RUNTIME continuation correction round 2

Plan 08-19 added two named end-to-end runtime regressions at the unchanged source revision `53afb50`: a duplicate version 7 and an unversioned telemetry replay after shadow silence and a newer REST flood both changed level 31 back to normal level 2 and renewed liveness. [The exact final-patch RED record](08-RUNTIME-006-RED-EVIDENCE-V2.json) contains both native failures and passed `tdd-red-evidence --raw`; its planning-only commit is `80e290d`. The initial RED record remains archived at `cf4d940`. The GREEN repair `31a07f4` retains a per-device version fence across silence while leaving REST ownership free, rejects older, duplicate, and unversioned replay, admits a strictly newer version, and clears the fence on real disconnect or removal. The named cases, 333 owner and adjacent cases, static checks, normal commit hooks, and isolated 100% line/function/branch direct coverage for both changed source pairs passed.

The combined `TEST_CONCURRENCY=1 npm run check` at clean revision `31a07f4d40a8f87716bb792f6f5c56a668b3ebc5` on Node `v26.12.1` exited 0: 130/130 Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. No executable input changed between the gate and review.

Independent reviewer `/root/phase8_runtime006_review` read all four changed current files completely at that revision. Executor `/root/phase8_runtime005_red` edited them and did not review them. The RUNTIME pair has owner scope; the DEVICE pair is cross-owner safety context and still needs final DEVICE owner review in Plan 08-17.

| Path | Full blob | Complete lines and read spans | Review scope |
| --- | --- | --- | --- |
| `src/runtime/accountRuntime.ts` | `03ad2704c0e88d812b58f8e31c263265419c260e` | 1-1346; 1-700, 701-1346 | RUNTIME owner |
| `test/runtime/accountRuntime.test.ts` | `381cfc0c0381024b4f9e53b3afcaa21b8081e398` | 1-9765; 1-500, 501-1100, 1101-1700, 1701-2300, 2301-2900, 2901-3500, 3501-4100, 4101-4700, 4701-5400, 5401-6100, 6101-6800, 6801-7500, 7501-8200, 8201-8900, 8901-9500, 9501-9765 | RUNTIME owner |
| `src/device/state.ts` | `88c621f4c9f362a7947c51ef5d9c48b3d6a9465a` | 1-439 | DEVICE cross-owner context |
| `test/device/state.test.ts` | `97bb7aa40286a747a4f6a4fc5f85540533acccf5` | 1-1318; 1-400, 401-800, 801-1318 | DEVICE cross-owner context |

The reviewer traced the shadow decoder, REST handover, monitoring-health anchor, runtime callback, disconnect and removal paths, and HAP publication. RUNTIME-006 is fixed at current blobs. The round opened with one ID, fixed one, rejected none, found none, reopened none, and closed empty: **1 − 1 − 0 + 0 + 0 = 0**. The open count fell, so no continuation STOP fired. The current whole-phase forward-open set has three IDs: `CR-08-DEVICE-002`, `CR-08-FEATURES-001`, and `CR-08-FEATURES-002`. The original DEVICE round-one STOP and its seven-ID snapshot remain unchanged.

## DEVICE continuation correction round 2

Plan 08-17 proved the unchanged-heartbeat trust defect at unchanged production revision `e3783df`. The exact final-patch [V2 RED evidence](08-DEVICE-002-RED-EVIDENCE-V2.json) contains both the store and platform failures, passed `tdd-red-evidence --raw`, and was committed alone at `897d318`. The initial RED remains archived. The GREEN commit `f118cc8` forwards accepted data-bearing heartbeats with no changed keys to listeners. Rejected duplicate versions still do not notify. The platform integration case observes the power scope's trusted time move from T1 to T2 before invalid power at T3 without counting another activation.

The behavior change exposed two old test expectations. The shadow feature's notification count was updated at `459345e`, then its title was narrowed at `87e08a3` to describe the asserted notification instead of an unasserted receipt time. The runtime unit test was updated at `bf1c41c` to expect the accepted unchanged heartbeat callback. The platform source received only a comment correction at `87e08a3`; its executable code did not change. The named tests and scenarios passed after those corrections.

The final combined `TEST_CONCURRENCY=1 npm run check` at clean revision `87e08a355abb600786f8b6f22c8371cb63d9ffd1` on Node `v26.12.1` exited 0: 130/130 offline Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. The exact executable inputs were unchanged between this gate and review.

Independent reviewer `/root/phase8_device002_review` read the complete current DEVICE owner source/test pair and changed ROOT platform test at the combined-gate revision, and found DEVICE-002 fixed with no new or reopened finding. Executor `/root/phase8_runtime005_red` edited those three files. The machine record gives their exact blobs, full line ranges, contiguous read spans, and distinct reviewer/editor identities. The same reviewer also read the complete current ROOT-owned runtime test, platform source, and shadow feature after their separate oracle/comment corrections; those exact final blobs appear under `supplementalReviews` rather than inflating the three-file DEVICE owner round.

The round opened with DEVICE-002, fixed it, rejected none, added none, reopened none, and closed empty: **1 − 1 − 0 + 0 + 0 = 0**. The continuation STOP predicate did not fire. The whole-phase forward-open set is now `CR-08-FEATURES-001` and `CR-08-FEATURES-002`. The historical DEVICE round-one STOP and its seven-ID snapshot remain unchanged.

## FEATURES continuation correction round 1

Plan 08-18 fixed the two opening FEATURES causes in separate normal-hook commits. At `7735869`, the account cache-presence assertion distinguishes `ENOENT` from other filesystem errors. Its [negative-control record](08-FEATURES-002-NEGATIVE-CONTROL.json) contains a reproducible temporary scenario that makes the cache parent a regular file: the old `Then` falsely passed on `ENOTDIR` and the corrected `Then` propagates that error. This is an assertion repair, not a production behavior RED. At `dd87848`, all five World-bound step modules register anonymous typed function expressions without changing their step text, options, argument types, async flags, bodies, or order. The 88 registration shapes were compared by TypeScript AST; pinned Cucumber 13.2.1 and its installed runtime retain the World `this` binding. The default offline suite passed 130/130 scenarios and 1401/1401 steps, and usage dry run found no UNUSED definition.

The combined `TEST_CONCURRENCY=1 npm run check` at clean revision `dd878480671f4e8caaf69d0c59b908db9c3fc146` on Node `v26.12.1` exited 0: 130/130 offline Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. No executable input changed between that gate and review.

Independent reviewer `/root/phase8_features_round1_review` read every final step module completely at that revision; executor `/root` edited the five files and did not conduct their independent review. The machine record includes exact blobs and contiguous read spans. The reviewer confirmed both causes fixed, no new or reopened finding, and default/real profile isolation.

| Path | Full blob | Complete lines and reads |
| --- | --- | --- |
| `features/step_definitions/account.steps.ts` | `f133a1ccb6834ed51f728a6cf6267055a3b963f3` | 1-213 |
| `features/step_definitions/configuration.steps.ts` | `c8b6e79c1cfb3656b663bd954c2aabf33d17f576` | 1-80 |
| `features/step_definitions/controls.steps.ts` | `33f03b197d8f8d4964f333e96ecd53c90936a13e` | 1-292 |
| `features/step_definitions/homekit.steps.ts` | `65d91595cb67c3c935cb4e36c2cc715edd9d9bb1` | 1-279 |
| `features/step_definitions/shadow.steps.ts` | `0f650de6360e015c40d93fd5921063b5a0f2551b` | 1-240, 241-452 |

The round opened with FEATURES-001 and FEATURES-002, fixed both, rejected none, added none, reopened none, and closed empty: **2 − 2 − 0 + 0 + 0 = 0**. The no-progress, reopening, and fourth-round STOP predicates did not fire. The current forward-open set is empty and the separate continuation is complete. The original DEVICE round-one STOP and seven-ID snapshot remain active and unchanged in their historical record.

## Threat Flags

RUNTIME-006 previously allowed a shadow replay to replace a newer REST flood reading after silence release. DEVICE-002 previously left a trusted observation timestamp stale. Both repairs have active RED and independent current-file review. The cache absence assertion now rejects non-missing errors. There is no current forward-open finding; the original STOP remains visible and active in its historical record.
