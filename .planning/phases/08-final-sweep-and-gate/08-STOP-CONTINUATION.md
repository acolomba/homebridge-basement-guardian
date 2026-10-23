# Phase 08 authorized STOP continuation

Milestone: `code-review-sweep`. The maintainer authorized a bounded GSD debug and replan after the DEVICE round-one no-progress STOP. This record is separate from [the original correction rounds](08-CORRECTION-ROUNDS.md). Their ROOT round 1, DEVICE round 1, seven IDs at STOP, and active STOP marker remain unchanged. No Plan 08-14 correction round is added here.

## Shadow liveness debug

CR-08-RUNTIME-004 is fixed at `c8aac01`. The active named regression, `hands stale shadow telemetry to the poll despite repeated messages without readings`, failed on unchanged production at `8a122ac` with one executed intended assertion: the store retained stale shadow level 2 and version 7, reported `shadowSilent: false`, and renewed the arrival anchor instead of accepting REST level 31 after telemetry silence. [The complete RED record](08-RUNTIME-004-RED-EVIDENCE.json) passed `tdd-red-evidence --raw` and was committed alone at `4b3d23a`. The GREEN change stamps liveness only for a nonempty telemetry record and still applies every patch to the store. The named case, all 170 runtime owner cases, 150 adjacent cases, static checks, isolated 100% line/function/branch coverage, and revert-and-reconfirm passed.

Independent reviewer `/root/phase8_shadow_debug_review` read complete current `src/runtime/accountRuntime.ts` lines 1-1346, blob `aed73e14c401fa2bea25e27e637a1ff06cd25a72`, and `test/runtime/accountRuntime.test.ts` lines 1-9445, blob `558caccde2e5210dca3197bcdaae5e8937669ac4`, at `c8aac01`. The reviewer confirmed RUNTIME-004 and found distinct **CR-08-RUNTIME-005**: at `c8aac01:src/runtime/accountRuntime.ts:895-899`, liveness is stamped before `src/device/state.ts:349-359` rejects an older or duplicate version. Repeated rejected telemetry can keep the silence clock fresh while old safety readings remain trusted. This is an accepted BLOCKER with a static trace; it has no active RED or repair. An accepted higher-version heartbeat with unchanged readings must continue to renew liveness. RUNTIME-005 is a new cause, not a reopening of RUNTIME-004.

## Corrected behavioral oracle and combined gate

The first combined `TEST_CONCURRENCY=1 npm run check` after `c8aac01` exited 1 because `features/monitoring/degradation.feature:209` still expected `Status Active=true` after metadata with unreadable telemetry. That was **CR-08-FEATURES-003**, an incorrect behavioral oracle. The corrected scenario at `6c578b8` keeps the metadata and later REST flood checks, expects `Status Active=false` before and after the flood, and explains why the metadata does not restore telemetry trust. Its named offline Cucumber scenario passed 1/1 with 20/20 steps.

Independent reviewer `/root/phase8_feature_oracle_review` read the complete current 730-line feature at `6c578b8`, blob `9bde291114d45a579f50251189f6e54035fe732c`, in contiguous spans 1-180, 181-360, 361-540, and 541-730. The reviewer confirmed FEATURES-003 fixed with no new or reopened finding. The full `TEST_CONCURRENCY=1 npm run check` on Node `v26.12.1` exited 0 for the exact tree committed as `6c578b8`: six static checks, unpaired tests, 130/130 offline Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage pairs. The tree was clean after the commit. The initial sandbox-only named run failed at `listen EPERM`; the same named scenario passed with local loopback access, so that attempt is not a product RED.

## Current forward work

The original STOP's seven-ID snapshot remains in its machine record. After this separately authorized debug, the **current forward-open set still has seven IDs**: `CR-08-DEVICE-002`, `CR-08-RUNTIME-001`, `CR-08-RUNTIME-002`, `CR-08-RUNTIME-003`, `CR-08-RUNTIME-005`, `CR-08-FEATURES-001`, and `CR-08-FEATURES-002`. RUNTIME-004 left the set after independent review; RUNTIME-005 entered it. FEATURES-003 arose and was fixed within this addendum. This is neither progress under Plan 08-14 nor permission to erase its STOP. New focused continuation plans must name these exact causes and preserve all original round numbers and gate requirements.

## Threat Flags

RUNTIME-005 can keep stale safety readings marked trustworthy. It remains open for active RED, a cause repair, and independent complete-file review. The original STOP remains visible and active in its historical record.
