# Phase 08 correction rounds

Milestone: `code-review-sweep`. This is the serial Plan 08-14 repair queue from the six independent round-zero complete-file reports. The [findings ledger](08-FINDINGS.md) gives every accepted cause, exact rule, reviewed blob and location, severity, and rejected candidate. The [machine record](08-CORRECTION-ROUNDS.json) has the same opening sets, queue, and completed rounds.

## Opening sets

| Owner | Paths reviewed | Opening IDs | Rounds so far |
| --- | ---: | --- | ---: |
| CLOUD | 19 | ∅ | 0 |
| DEVICE | 20 | CR-08-DEVICE-001, CR-08-DEVICE-002 | 0 |
| RUNTIME | 23 | CR-08-RUNTIME-001, CR-08-RUNTIME-002, CR-08-RUNTIME-003 | 0 |
| ACCESSORY | 21 | ∅ | 0 |
| ROOT | 15 | CR-08-ROOT-001 | 1 |
| FEATURES | 39 | CR-08-FEATURES-001, CR-08-FEATURES-002 | 0 |

The opening union has eight distinct IDs. ROOT-001 is fixed, leaving seven forward-open IDs. No new or reopened ID has appeared. Each round records opening, fixed, rejected, new, reopened, closing, and its exact open ID set. Its count must satisfy `closing = opening - fixed - rejected + new + reopened`. A round that closes with at least as many open IDs as it opened, a fixed cause returning, or completion of round four stops the **whole** Phase 08 review under [08-REVIEW-PROTOCOL.md](08-REVIEW-PROTOCOL.md). A STOP remains in the record even after any later authorized forward repair.

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

## ROOT correction round 1

CR-08-ROOT-001 had an active unchanged-source RED in `test/platform.test.ts`: the named test `keeps a restored vendor email out of logs` failed its intended complete-argument assertion because `log.info` received `account@example.test`. `npm run build:test` exited 0, the named test exited 1 with one executed failing case, and `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/08-final-sweep-and-gate/08-ROOT-001-RED-EVIDENCE.json --raw` returned `RED_EVIDENCE_OK`. Commit `d44f3a0` saved only that planning evidence while production remained at blob `e4bedd50206653eb6456a931edba97ab3bea12c1`.

Commit `7bcf55b` removed the untrusted restored display name from the cache log and committed the active regression. Named GREEN was 1/1, the platform owner module was 77/77, and isolated direct coverage of `src/platform.ts` was 100% for lines (434/434), functions (22/22), and branches (68/68). The combined `TEST_CONCURRENCY=1 npm run check` exited 0 at `7bcf55bb9e9314506bdc91a57d30b27d327dc2bf` on Node `v26.12.1`: 130/130 offline Cucumber scenarios, 1400/1400 steps, and 43 direct coverage pairs. The worktree had no executable-input diff or untracked input at this gate.

Independent reviewer `/root/phase8_root_review` read the complete current `src/platform.ts` 1-699, blob `354e6892e99e014555152763be2915500a540dd7`, and `test/platform.test.ts` 1-4289, blob `e3230a726d2a8d441e607f7942dbcb70ae2e1ad2`. The reviewer also read bounded inputs `src/cloud/types.ts`, `src/device/state.ts`, and `src/logging.ts`. The exact ROOT-001 cause is fixed; no new or reopened finding arose in either changed file. The old recording helper still discards trailing arguments, but this regression captures every argument of the affected call.

Round arithmetic: opening `{CR-08-ROOT-001}` - fixed `{CR-08-ROOT-001}` - rejected `{}` + new `{}` + reopened `{}` = closing `{}`. The global forward-open set falls from eight to seven. ROOT round 1 made progress, did not reopen a fixed cause, and did not reach round four; **no Phase 08 STOP** applies. The other seven IDs remain open until their own serial repairs and independent reviews.

## Review and gate status

At round zero, every live manifest path and all 31 rejected candidates had a recorded outcome. The current queue has no unaccounted path or candidate. New or moved files require a manifest update, one owner, and complete review at the new blob. Rejection of an accepted ID during a correction round requires an evidence-based reason; a passing check alone cannot close it.

Phase 5 GATES round-15 STOP, Phase 6 ENTRY round-four STOP, and Phase 7 STOP records stay in their original ledgers. Their later authorized outcomes do not become Phase 08 round events. Phase 08 has no STOP yet. GATE-02 and BUG-01 remain open. The final combined `TEST_CONCURRENCY=1 npm run check`, current-input RED/GREEN audit, and verification freshness work are still due; prior phase or commit-hook passes do not satisfy them.

## Threat Flags

ROOT-001 removed a vendor-derived display name from a plugin log. Its RED, GREEN, direct-coverage, combined-gate, and independent complete-file review evidence is recorded above. No other security-relevant surface was changed in this round.
