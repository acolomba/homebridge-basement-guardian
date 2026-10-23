# Phase 08 authorized STOP continuation

Milestone: `code-review-sweep`. The maintainer authorized a bounded GSD debug and replan after the DEVICE round-one no-progress STOP. This record is separate from [the original correction rounds](08-CORRECTION-ROUNDS.md). Their ROOT round 1, DEVICE round 1, seven IDs at STOP, and active STOP marker remain unchanged. No Plan 08-14 correction round is added here.

## Shadow liveness debug

CR-08-RUNTIME-004 is fixed at `c8aac01`. The active named regression, `hands stale shadow telemetry to the poll despite repeated messages without readings`, failed on unchanged production at `8a122ac` with one executed intended assertion: the store retained stale shadow level 2 and version 7, reported `shadowSilent: false`, and renewed the arrival anchor instead of accepting REST level 31 after telemetry silence. [The complete RED record](08-RUNTIME-004-RED-EVIDENCE.json) passed `tdd-red-evidence --raw` and was committed alone at `4b3d23a`. The GREEN change stamps liveness only for a nonempty telemetry record and still applies every patch to the store. The named case, all 170 runtime owner cases, 150 adjacent cases, static checks, isolated 100% line/function/branch coverage, and revert-and-reconfirm passed.

Independent reviewer `/root/phase8_shadow_debug_review` read complete current `src/runtime/accountRuntime.ts` lines 1-1346, blob `aed73e14c401fa2bea25e27e637a1ff06cd25a72`, and `test/runtime/accountRuntime.test.ts` lines 1-9445, blob `558caccde2e5210dca3197bcdaae5e8937669ac4`, at `c8aac01`. The reviewer confirmed RUNTIME-004 and found distinct **CR-08-RUNTIME-005**: at `c8aac01:src/runtime/accountRuntime.ts:895-899`, liveness is stamped before `src/device/state.ts:349-359` rejects an older or duplicate version. Repeated rejected telemetry can keep the silence clock fresh while old safety readings remain trusted. This is an accepted BLOCKER with a static trace; it has no active RED or repair. An accepted higher-version heartbeat with unchanged readings must continue to renew liveness. RUNTIME-005 is a new cause, not a reopening of RUNTIME-004.

## Corrected behavioral oracle and combined gate

The first combined `TEST_CONCURRENCY=1 npm run check` after `c8aac01` exited 1 because `features/monitoring/degradation.feature:209` still expected `Status Active=true` after metadata with unreadable telemetry. That was **CR-08-FEATURES-003**, an incorrect behavioral oracle. The corrected scenario at `6c578b8` keeps the metadata and later REST flood checks, expects `Status Active=false` before and after the flood, and explains why the metadata does not restore telemetry trust. Its named offline Cucumber scenario passed 1/1 with 20/20 steps.

Independent reviewer `/root/phase8_feature_oracle_review` read the complete current 730-line feature at `6c578b8`, blob `9bde291114d45a579f50251189f6e54035fe732c`, in contiguous spans 1-180, 181-360, 361-540, and 541-730. The reviewer confirmed FEATURES-003 fixed with no new or reopened finding. The full `TEST_CONCURRENCY=1 npm run check` on Node `v26.12.1` exited 0 for the exact tree committed as `6c578b8`: six static checks, unpaired tests, 130/130 offline Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. The tree was clean after the commit. The initial sandbox-only named run failed at `listen EPERM`; the same named scenario passed with local loopback access, so that attempt is not a product RED.

## Current forward work

The original STOP's seven-ID snapshot remains in its machine record. At the start of this separately authorized continuation, the forward-open set had seven IDs: `CR-08-DEVICE-002`, `CR-08-RUNTIME-001`, `CR-08-RUNTIME-002`, `CR-08-RUNTIME-003`, `CR-08-RUNTIME-005`, `CR-08-FEATURES-001`, and `CR-08-FEATURES-002`. RUNTIME-004 left the set after independent review; RUNTIME-005 entered it. FEATURES-003 arose and was fixed within this addendum. This is neither progress under Plan 08-14 nor permission to erase its STOP. The current set after RUNTIME round 1 is recorded below.

## RUNTIME continuation correction round 1

Plan 08-16 repaired four distinct causes in separate active RED and GREEN sequences. Each final active regression failed on unchanged production with an intended assertion; each exact RED record passed `tdd-red-evidence --raw` and was committed alone before its source/test fix. Preliminary RED records for 001, 002, and 005 were superseded by V2 records after the final test patch changed; the earlier records remain visible. [The bug ledger](08-BUG-LEDGER.md#phase-8) gives each source, V2 evidence, and GREEN commit. Focused owner and adjacent suites, static checks, and isolated 100% line/function/branch direct coverage passed for every changed source pair. Normal commit hooks passed.

The combined `TEST_CONCURRENCY=1 npm run check` at clean revision `6ba036f92b526887ac04ba80256de5d7e2ed210b` on Node `v26.12.1` exited 0: 130/130 Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. No executable input changed between that gate and the independent review.

Independent reviewer `/root/phase8_runtime_continuation_review` read every changed current file completely at `6ba036f92b526887ac04ba80256de5d7e2ed210b`:

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

## Threat Flags

RUNTIME-006 can replace a newer REST flood reading with an older shadow normal reading after silence release. It remains open for active RED, a cause repair, and independent complete-file review. The original STOP remains visible and active in its historical record.
