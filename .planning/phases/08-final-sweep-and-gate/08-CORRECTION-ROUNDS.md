# Phase 08 correction-round opening record

Milestone: `code-review-sweep`. This is the serial Plan 08-14 repair queue from the six independent round-zero complete-file reports. The [findings ledger](08-FINDINGS.md) gives every accepted cause, exact rule, reviewed blob and location, severity, and rejected candidate. The [machine record](08-CORRECTION-ROUNDS.json) has the same opening sets and queue. No Phase 08 correction round has begun.

## Opening sets

| Owner | Paths reviewed | Opening IDs | Rounds so far |
| --- | ---: | --- | ---: |
| CLOUD | 19 | ∅ | 0 |
| DEVICE | 20 | CR-08-DEVICE-001, CR-08-DEVICE-002 | 0 |
| RUNTIME | 23 | CR-08-RUNTIME-001, CR-08-RUNTIME-002, CR-08-RUNTIME-003 | 0 |
| ACCESSORY | 21 | ∅ | 0 |
| ROOT | 15 | CR-08-ROOT-001 | 0 |
| FEATURES | 39 | CR-08-FEATURES-001, CR-08-FEATURES-002 | 0 |

The opening union has eight distinct IDs. The current forward-open set is that same union. No ID was fixed or rejected after acceptance, no new ID appeared during a correction round, and no fixed ID reopened. There is **no round-one arithmetic yet**. Each future round must record opening, fixed, rejected, new, reopened, closing, and its exact open ID set. Its count must satisfy `closing = opening - fixed - rejected + new + reopened`. A round that closes with at least as many open IDs as it opened, a fixed cause returning, or completion of round four stops the **whole** Phase 08 review under [08-REVIEW-PROTOCOL.md](08-REVIEW-PROTOCOL.md). A STOP remains in the record even after any later authorized forward repair.

## Ordered accepted-cause queue

Each row names the smallest initial edit set at the cause. The named owner retains source/test ownership. A bounded consumer is a read and verification target, **not** permission to edit another owner's path in the same row. If a regression proves an extra edit is necessary, record the path and its single owner before that edit. Source/test changes require active unchanged-source RED evidence for a genuine behavior bug, focused GREEN evidence, 100% isolated direct coverage for modified pairs, and an independent complete-file rereview at the new blob. Use the normal commit hooks. Run build/test output, Git staging, and commits serially.

| Order | ID; owner | Exact initial edit paths | Bounded consumers and repair check |
| ---: | --- | --- | --- |
| 1 | CR-08-ROOT-001; ROOT | `src/platform.ts`, `test/platform.test.ts` | Restore an email-valued accessory name and capture every logger argument. Read `src/cloud/types.ts`, `src/device/state.ts`, and `src/logging.ts` as bounded inputs. Keep source/test repair and its rereview in ROOT. This privacy BLOCKER precedes other `src/platform.ts` integration checks. |
| 2 | CR-08-DEVICE-001; DEVICE | `src/device/state.ts`, `test/device/state.test.ts` | Reject empty shadow telemetry as a new observation, then prove a later REST poll wins. Read `src/cloud/shadow.ts` and `src/runtime/accountRuntime.ts` as bounded consumers. Do not change CLOUD or RUNTIME ownership silently. |
| 3 | CR-08-DEVICE-002; DEVICE | `src/device/state.ts`, `test/device/state.test.ts` | Prove a repeated valid heartbeat updates the accessory's later `lastTrustedAt` without duplicating pump activation. Bounded consumers: `src/platform.ts`, `test/platform.test.ts`, `src/accessories/basementGuardian.ts`, `test/accessories/basementGuardian.test.ts`, and `src/device/health.ts`. ROOT/ACCESSORY files are verification targets; schedule any needed cross-owner edit as a separate serialized integration step. |
| 4 | CR-08-RUNTIME-002; RUNTIME | `src/runtime/arrivalAnchors.ts`, `test/runtime/arrivalAnchors.test.ts` | Hold overlapping writes, reverse their completion, inspect the durable file and restart silence verdict. Bounded caller: `src/runtime/accountRuntime.ts` and its owner test. Preserve health-report responsiveness. |
| 5 | CR-08-RUNTIME-001; RUNTIME | `src/runtime/accountRuntime.ts`, `test/runtime/accountRuntime.test.ts` | Race credential success with terminal refusal and `stop()`; assert no false recovery diagnostic. Bounded consumers: `src/runtime/failureLog.ts`, `src/cloud/api.ts`, `src/cloud/shadow.ts`. Keep the one-send command path and refusal trust behavior. |
| 6 | CR-08-RUNTIME-003; RUNTIME | `src/runtime/failureLog.ts`, `test/runtime/failureLog.test.ts` | Move wall time backward while elapsed time advances; assert the next warning at fifteen elapsed minutes. Bounded caller: `src/runtime/accountRuntime.ts` and its owner test. |
| 7 | CR-08-FEATURES-002; FEATURES | `features/step_definitions/account.steps.ts` | Make the cache-absence `Then` accept only `ENOENT` as absence. Use the named `A refused credential clears the cache and reports how to correct the account` scenario, plus a permission-error negative control. Bounded inputs: `features/account/sign-in.feature`, `features/support/world.ts`, `src/cloud/auth.ts`. |
| 8 | CR-08-FEATURES-001; FEATURES | `features/step_definitions/account.steps.ts`, `features/step_definitions/configuration.steps.ts`, `features/step_definitions/controls.steps.ts`, `features/step_definitions/homekit.steps.ts`, `features/step_definitions/shadow.steps.ts` | Convert the repeated registration form while preserving callback bodies, options, and World binding. Run default Cucumber and usage dry run. The account step file is shared with queue item 7, so these edits follow it serially. |

Orders 1-8 are serial; the table does not license parallel source edits. `src/platform.ts` belongs to ROOT and is only a bounded DEVICE consumer. `src/runtime/accountRuntime.ts` belongs to RUNTIME and is only a bounded DEVICE consumer. `src/accessories/basementGuardian.ts` belongs to ACCESSORY. `src/cloud/auth.ts` belongs to CLOUD. `features/support/world.ts` belongs to FEATURES, but no current cause calls for editing it. This separation preserves the six disjoint complete-file owner sets while allowing serial integration checks.

## Review and gate status

Before Plan 08-14 changes code, every live manifest path and all 31 rejected candidates have a recorded outcome. The current queue has no unaccounted path or candidate. New or moved files require a manifest update, one owner, and complete review at the new blob. Rejection of an accepted ID during a correction round requires an evidence-based reason; a passing check alone cannot close it.

Phase 5 GATES round-15 STOP, Phase 6 ENTRY round-four STOP, and Phase 7 STOP records stay in their original ledgers. Their later authorized outcomes do not become Phase 08 round events. Phase 08 has no STOP yet. GATE-02 and BUG-01 remain open. The final combined `TEST_CONCURRENCY=1 npm run check`, current-input RED/GREEN audit, and verification freshness work are still due; prior phase or commit-hook passes do not satisfy them.

## Threat Flags

None -- this evidence-only plan adds no security-relevant surface outside its `<threat_model>`. The already observed ROOT privacy finding remains open in the queue.
