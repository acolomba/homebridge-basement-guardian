---
phase: 04-runtime-conformance
plan: "13"
subsystem: runtime
tags: [typescript, homebridge, shadow, registration, native-coverage]
status: complete
requires:
  - phase: "04-08"
    provides: "Physical membership reconciliation and current runtime ownership"
  - phase: "04-12"
    provides: "Cached physical identity handoff and platform owner evidence"
provides:
  - "030 replacement relinquishes old shadow readiness and telemetry ownership"
  - "031 uncertain registration remains suspended until restart with a safe diagnostic"
  - "044 independently distinguishes the configured poll deadline"
affects: ["04-14", "04-17", "04-09", "04-10"]
tech-stack:
  added: []
  patterns:
    - "Existing disconnect semantics release replaced shadow ownership"
    - "Private WeakMap follows the stable platform-owned accessory map"
key-files:
  created:
    - .planning/phases/04-runtime-conformance/04-13-SUMMARY.md
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - src/platform.ts
    - test/platform.test.ts
    - .planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md
    - .planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json
    - .planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json
    - .planning/phases/04-runtime-conformance/04-13-PLAN.md
key-decisions:
  - "The actual human selected fail-visible, restart-required suspension for every uncertain registration throw"
  - "A normal registration return grants local ownership; restored accessories remain authoritative"
  - "No acceptance oracle, automatic compensation or restart recovery guarantee was introduced"
patterns-established:
  - "Genuine owner RED precedes the parent's evidence-only commit and production GREEN"
  - "Maintenance controls retain intended failure, exact restoration and rebuilt GREEN separately"
requirements-completed: []
requirements-addressed: [RUN-01]
actuals:
  tokens: 25136011
  tasks: 3
  commits: 6
  realized_diff_chars: 100544042
plan_head_before: abf7e7ce8e2c7df892a768c3697fb0fdd63987b7
plan_head_after: 2c5944e2e9431fc7442415e701ba39a9e02ac9d7
duration: 204min
completed: 2026-10-16
---

# Phase 04 Plan 13: Replacement ownership, uncertain registration and poll deadline

Replaced shadow connections release readiness and watermarks; uncertain registration stops automatic reattempts, and poll timing has an independent before-deadline observation.

## Files and native evidence

- `src/runtime/accountRuntime.ts` and `test/runtime/accountRuntime.test.ts`:030 handoff regression and 044 poll-boundary maintenance.
- `src/platform.ts` and `test/platform.test.ts`:031 normal, uncertain and restored registration ownership.
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md`: append-only stable cause history and actual user supersession.
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json`:16 complete records, including 030 and the entire preceding 14-record root.
- `.planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json`:7 complete records, including 031 and the entire preceding 2-record root.
- `.planning/phases/04-runtime-conformance/04-13-PLAN.md`: precommitted cause declarations and the explicit 031 policy revision.
- `.planning/phases/04-runtime-conformance/04-13-SUMMARY.md`: this separate metadata output; parent owns its commit.

Full native records remain at:

| Scope | Native checkpoint or directory |
| --- | --- |
| Actual initial 13 ledger | `/private/tmp/guardian-04-13-closeout/initial-ledger-checkpoint.json` |
|030 RED and GREEN | `/private/tmp/guardian-account-030-red-YEgC4q/terminal-checkpoint.json`; `green-terminal-checkpoint.json` in the same directory |
|031 acceptance conflict | `/private/tmp/guardian-04-account-031-contract-conflict-lUNlUK/CONTRACT-CONFLICT.md` |
|031 RED | `/private/tmp/guardian-04-account-031-red-QBd86j/attempt-inventory.json` and complete native directory |
|031 GREEN | `/private/tmp/guardian-04-account-031-green-vDE7Y6/final-checkpoint.json` |
|044 control, restoration and GREEN | `/private/tmp/guardian-04-account-044-4uyesz/terminal-checkpoint.json` |
| Parent full gate | `/private/tmp/guardian-phase4-plan13-full-gate-retry.json`, corresponding `.stdout` and `.stderr` |
| Metadata pre-write guard and containment | `/private/tmp/guardian-04-13-closeout/summary-guard.json`; `summary-prewrite.json` |

Each cause's native records retain full arguments, real UTC bounds where captured, raw exits, Node/npm identities, complete separate streams, input manifests, source/owner blobs and patches. Full owned source, owners, report, callers, context and all five books were read with actual range/blob records. Byte captures did not substitute for required reads.

## Accomplishments and policy boundaries

030 reuses clean-disconnect handling immediately before replacing changed membership. The unchanged-membership early return remains. Old readiness and telemetry watermarks are released; healthy REST can again supply reported telemetry until the current connection becomes ready. The active whole regression covers real shadow transport replacement, current-only readiness, REST ownership, stale callbacks and stop. Its owner remained byte-exact from RED to GREEN, including all earlier 022 assertions.

031 grants local accessory/instance/listener ownership only after normal registration return. A new private WeakMap, keyed by the existing stable platform-owned accessory map, retains uncertain device attempts for that platform run. Rebuilt contexts, empty inventories, removal, store removal and reappearance do not clear suspension. Other devices continue. Preparation errors before the registration call retain the existing 026 retry behavior. Normal success and actual configureAccessory restoration retain one physical UUID and listener.

The actual human selected option 1, fail visibly and require restart after uncertainty. Commit `ad05d52` supersedes only the original 031 pre-acceptance automatic-retry requirement. Installed Homebridge 2.4.0 and its official API expose synchronous void registration without an acceptance discriminator. A successful diagnostic showed the same Error object before and after bridge acceptance; that observation is not RED. Every registration throw therefore receives the fixed safe actionable restart diagnostic through the existing real redacting logger. Synthetic secrets and arbitrary error payloads are checked at its actual delegate. No private Homebridge cache probe, public dependency port, unsafe assertion, acceptance oracle or compensation was added. Restart releases this in-memory suspension; it does not guarantee that an accepted bridge accessory disappeared. Restored ownership remains authoritative.

044 strengthens only the configured-interval case. At literal 899999 ms, the complete initial snapshot, receipt, request history and forbidden-command observations remain unchanged. The final 1 ms reaches literal 900000 ms and retains every original final assertion. Finite exact API expectations are verified after the public answers. A separate half-interval control demonstrates discrimination.

## Task and commit provenance

| Task or parent boundary | Actual commit | Result |
| --- | --- | --- |
|13-01/030 parent evidence only | `2157f9e9d6e6ed6a55c6df1417a1f54cc638f513` | Report and ACCOUNT JSON committed before GREEN; failing owner remained unstaged |
|13-01/030 minimum GREEN | `6a90071696d55c74b6b37590810197db1ddcd080` | Runtime, active owner and report |
|031 actual human policy declaration | `ad05d52f0d1088020a8666deeacd06842ebedad8` | Parent committed revised13 plan before the new policy regression |
|13-02/031 parent evidence only | `13a06a1b109e8c027c4d59d51a103e0d4c7f7f37` | Report and PLATFORM JSON committed before GREEN; failing owner remained unstaged |
|13-02/031 minimum GREEN | `c44c36f35882d8a679c084c82eb81ce7ab298a36` | Platform, unchanged active RED owner and report |
|13-03/044 maintenance | `2c5944e2e9431fc7442415e701ba39a9e02ac9d7` | Existing runtime owner case and report; no production/control mutation committed |

The parent persisted the actual 13 ledger before the first 13 commit, then directly read it. It remains `abf7e7c`; the separate 09 ledger remains `8a700ac`. There is no reconstructed historical marker. The interval contains six commits: three cause commits, two parent evidence-only commits and one parent policy declaration. This summary and its future parent metadata commit are excluded from that measured pre-summary count.

The three cause budgets are 5/5/3 paths including the already committed declaration, report and applicable evidence. This summary is separate metadata. Existing exported/private contracts were preserved; new private-ledger actual uses and stable root/World map lifetimes were inspected. No trace limitation became a passing result or a new exception. Complete source/owner headers were preserved and inspected in the recorded cause context.

## Check Results

All reported current passing checks use Node v26.11.1 and npm 11.20.0. Native records above retain full exact invocations and inputs.

| Check | Actual result |
| --- | --- |
|030 intended native RED | Named raw 1 with intended ERR_ASSERTION; complete owner 169 tests/168 pass/1 intended failure, no skip/cancel/todo |
|030 GREEN | Fresh build; named 1/1 and full 169/169; isolated direct and native runtime 1007/1007 lines, 58/58 functions, 195/195 branches; uncached lint |
|031 final intended native RED | Both named targets raw 1 with intended whole ownership ERR_ASSERTION; full 74 tests/72 pass/2 intended failures, no skip/cancel/todo; original 71 and new restoration case pass |
|031 GREEN | Fresh build; both named 1/1 and full 74/74; isolated direct and sole native platform SF 511/511 lines, 22/22 functions, 63/63 branches; uncached lint |
|044 maintenance control | Half-interval source mutation builds, then named raw 1 at the new beforeDeadline whole assertion; extra device request/water 3/receipt START+899999 expose early polling |
|044 exact restoration and GREEN | All 44 production contents/modes restored; fresh build, named 1/1 and full 169/169; runtime direct/native 1007/58/195 all 100%; uncached lint |
| Genuine evidence preservation | Installed actual-file CLIs return RED_EVIDENCE_OK; SAME installed recursive classifier accepts ACCOUNT 16 + PLATFORM 7 =23 with actual Git source provenance |
| Cause closeout | Recorded real-base audits pass; exact clean SKIP=npm-check pre-commit run --files over all actual paths precedes staging; ordinary foreground commits run with SKIP absent and normal check:commit, secret checks and gitlint |
| Parent complete gate | npm run check raw 0 at 2c5944e, 2026-10-16T01:10:50.713709+00:00 through 01:11:27.325035+00:00; six static checks, 104 Cucumber scenarios/1156 steps and 43 isolated pairs |

Runtime current blobs are source `5d1ea815151fb008a4d49c003a2b8416cc02bf3a` and owner `8b5c4a27dff16f00e78cb183bb32eff9227ba1e0`. Platform blobs are source `45666e623be425bdc4934618477349ad9da4aa4a` and owner `eefe895a1cc4aae261e0670ac2224d2c59872250`. Report blob at the verified code HEAD is `6d05eccb2c5fca070d1a66a0e5ddd43a907eee94`. ACCOUNT JSON remains `b882b1502f0c1fe9ffe3ebd3c5af2f9ace68c134`; PLATFORM JSON remains `321b61af80c611fda8d825dd613a2537b16303e1`. Original nested roots remain complete; successful diagnostics and maintenance controls are not genuine RED records.

For this metadata-only output, the comparator is `git diff 2c5944e -- . ':(exclude,glob).planning/**/*.md'`, with explicit absence of new untracked executable inputs. The summary creates no build input; no new source/full gate is needed for unchanged inputs. Parent owns the final metadata comparison and commit.

## Historical attempts and limitations

030's first fixer invocation stopped prematurely from estimated read volume, without a hard tool failure or edit. Fresh role resolution resumed the same cause with bounded complete reads and a durable read ledger. No scoped-read exception was granted. The complete native history retains this preparation and AST-proof refinement.

031's initial successful acceptance-conflict diagnostic stopped before edits and before all mandatory reads were complete; it claimed no RED or review. After the actual user decision and committed declaration, the same cause completed every required read. RED preparation retains build/lint typing issues and an initial full run with an unrelated inverted restoration expectation. That full run is archived preparation, not pure intended owner RED. Earlier genuine named failures preserve their complete patches and native streams. Final 74/72/2 is the intended-only full RED. Existing assertions and both JSON histories remain complete.

044 retains two EISDIR capture-preparation failures that occurred before the requested child commands spawned. Exact UTC bounds for those preparation failures were not captured; none is reconstructed. The control, restoration, rebuilt checks and normal commit have real recorded bounds. Its production mutation is absent from Git.

The parent's first complete gate at the same 2c5944e inputs exited 1 from packed-artifact npm-cache EPERM in the sandbox, 01:10:27.847407 through 01:10:36.420907 UTC. Its JSON/stdout/stderr remain under `/private/tmp/guardian-phase4-plan13-full-gate.*`. An authorized retry restored cache access and passed; no chown, configuration change or install occurred. This environment failure is not assertion RED.

Metadata's first guard launcher could not find a PATH executable named fallow and spawned no guard child or repository mutation. The installed node_modules/.bin/fallow guard then passed before the first write, with exact canonical-root containment and summary absence recorded. The first preparation's exact UTC bounds were not captured. Its error and corrected invocation are disclosed in the metadata native records.

Elapsed execution is approximately 204 minutes from the actual ledger checkpoint 2026-10-15T21:47:47.492005+00:00 to the parent's passing gate 2026-10-16T01:11:27.325035+00:00, including serial waits and the policy decision. Measured realized diff is 100544042 characters, or 25136011 using ceiling(chars/4). Complete recursive evidence dominates that measurement; it is not a harness token count, runtime resource measurement or context-capacity claim.

## Threat Flags

| Declared obligation | Actual scope and remaining limit |
| --- | --- |
|T-04-22, high, runtime ownership|Replacement releases old connection readiness/watermarks; public whole-state and current-connection regressions plus isolated 100% checks pass.|
|T-04-23, high, uncertain registration and diagnostic|New private per-run suspension and safe restart diagnostic follow the actual user's policy. Both throw locations, healthy neighbors, disappearance/reappearance, restored ownership and real redaction are observed. No acceptance/restart guarantee is inferred.|
|T-04-SC and inherited obligations|No package, live vendor/hardware or private account input was introduced. Required full security/phase judgments and the later seal remain pending.|

The changed security-relevant behavior is within the declared threat model. This summary does not assert ASVS certification or acceptance of later subsystem sweeps.

## Continuing batch state and handoff

All three implementation tasks are complete. The one ACCOUNT counter remains 1:44 accepted stable IDs, 29 independently closed originals and 15 open 030–044 pending whole correction 2 in 17. Implementing 030/031/044 does not independently close them. No second review, clean verdict, counter reset or RUN-01 completion is claimed. D-03 remains global and must be checked immediately after the next actual terminal correction. WINDOWS 46–54 remain OPEN/unwaived. All historical evidence limits remain visible.

Parent owns summary staging/commit, shared progress, next-plan dispatch, full gates and eventual restoration of only workflow.use_worktrees=true before the final milestone audit/handoff. No shared state, ROADMAP, FINDINGS, WINDOWS, configuration or requirement was changed by this metadata continuation.

## Self-Check

PASSED. All three task commits and three parent boundary commits exist at the recorded HEAD. Declared source, owners, report, evidence and native checkpoints exist. The measured ledger interval, exact pre-write guard/containment and sole summary output are recorded. Parent metadata commit remains pending.
