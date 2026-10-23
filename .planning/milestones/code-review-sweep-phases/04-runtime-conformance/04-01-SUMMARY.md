---
phase: 04-runtime-conformance
plan: "01"
subsystem: runtime
tags: [typescript, compiler-contracts, wall-clock, conformance]
status: complete
requires:
  - phase: 03-device-and-persistence-conformance
    provides: Preserved canonical state and persistence contracts
provides:
  - Complete initial eight-file PORTS review with stable findings
  - Strict accessory-persistence compiler contracts
  - Reviewed wall-clock headers and separate action/assertion phases
affects: [04-02, runtime-conformance]
tech-stack:
  added: []
  patterns: [declaration-only compiler contracts, context-owned deterministic time]
key-files:
  created:
    - .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md
    - .planning/phases/04-runtime-conformance/04-01-SUMMARY.md
  modified:
    - src/runtime/accessoryStore.ts
    - test/runtime/accessoryStore.test.ts
    - src/runtime/clock.ts
    - test/runtime/clock.test.ts
key-decisions:
  - Preserve persist(): void and Clock.now(): number without API or implementation changes
  - Keep PORTS open through the complete 04-02 correction review with counter 0
requirements-completed: [RUN-01]
actuals:
  tokens: 15204
  tasks: 2
  commits: 4
plan_head_before: 6f475a0db1698847ed7a1c7238ccb461dfdb8bda
plan_head_after: 84f4ca8d82f72d435895e31fe49aa0e7d85531a7
coverage:
  - id: D1
    description: Required callable accessory persistence retains strict compiler positives and negatives
    requirement: RUN-01
    verification:
      - kind: unit
        ref: npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Public wall clock retains exact epoch milliseconds and advances with controlled process time
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/clock.test.ts#reports the current process time in milliseconds
        status: pass
      - kind: unit
        ref: test/runtime/clock.test.ts#reports a time that advances with the process clock
        status: pass
    human_judgment: false
duration: 15min
started: 2026-10-14T22:47:38Z
completed: 2026-10-14
---

# Phase 4 Plan 1: Persistence and Wall-Clock Conformance Summary

**Strict accessory-persistence compiler contracts replace recorder self-tests; wall-clock tests retain exact epoch-millisecond observations.**

## Accomplishments

- A fresh independent reviewer inspected all eight original PORTS files and full headers before any repair.
- Four accepted causes were repaired in separate commits: two header causes, the declaration-only owner, and clock AAA structure.
- `persist(): void`, `Clock.now(): number`, per-accessory persistence and all production implementation bytes remain unchanged beneath the new source headers.

`requirements-completed` records this plan's contribution to RUN-01. RUN-01 remains Pending until all declaring plans and independent phase verification complete. This summary does not mark the requirement or phase complete.

## Task Commits

Actual created review record: `.planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`.
Actual modified source: `src/runtime/accessoryStore.ts`.

| Task | Cause | Commit | Exact committed paths |
| --- | --- | --- | --- |
| 04-01-01 | CR-04-PORTS-001, store headers | `227c799cebde0e77be9a85c605348ad00add1a69` | Store source, mirrored owner, PORTS report |
| 04-01-01 | CR-04-PORTS-002, compiler contracts | `ce3608815f4a9561a4807c209ae2144e7757d2cf` | Store owner, PORTS report |
| 04-01-02 | CR-04-PORTS-003, clock headers | `fd53a74eca0be5f5aece5717f6403756460dcd9b` | Clock source, mirrored owner, PORTS report |
| 04-01-02 | CR-04-PORTS-004, separate act/assert | `84f4ca8d82f72d435895e31fe49aa0e7d85531a7` | Clock owner, PORTS report |

The persisted Git ledger `gsd-plan-head-before-04-01` records `6f475a0db1698847ed7a1c7238ccb461dfdb8bda`. `git rev-list --count <ledger-base>..HEAD` measured four commits at the recorded `plan_head_after`, before the separate execution-record commit. Every cause stays within five paths. No tracked file was deleted.

## Independent Review and Continuing Batch

Initial reviewer: `/root/phase4_ports_first/ports_initial_review`, typed `gsd-code-reviewer`, fresh context. Cause fixer: `/root/phase4_ports_first/ports_store_clock_fixes`, typed `gsd-code-fixer`, fresh context. Before each dispatch, the actual Codex resolver returned effort `high` and an empty model; model was omitted. Both read complete AGENTS and all five rulebooks. Each terminal FINAL_ANSWER released its exclusive lease before the next writer or executor inspection.

The report retains the original review at `6f475a0db1698847ed7a1c7238ccb461dfdb8bda`, every original blob/header, exact rules and locations, candidate dispositions and appended repair history. S-04-01 was accepted as CR-04-PORTS-002. S-04-03/04 were rejected for these ports with rule/source reasons; S-04-05 remains accepted for the next monotonic-clock slice. No production defect was confirmed.

Initial IDs 001–007: 7 open, comprising 2 BLOCKERs and 5 WARNINGs. Repaired IDs 001–004: 4. Rejected accepted IDs: 0. New/reopened IDs: 0. Continuing IDs 005/006/007: 3 open, comprising 1 BLOCKER and 2 WARNINGs. Arithmetic: `7 - 4 - 0 + 0 + 0 = 3`.

This is a partial repair handoff, not full-batch closure. Correction counter remains **0**. The full eight-file independent correction belongs after 04-02 repairs. No D-03 stop condition arose.

## Check Results

Observed tools: Node `v26.11.1`, npm `11.20.0`, TypeScript `6.0.3`. All commands ran at the authorized feature checkout. Source checks are tied to their exact before/after blobs and dirty/untracked snapshots.

| Scope | Native commands and evidence | Actual result |
| --- | --- | --- |
| Initial full PORTS review | `npm run typecheck`; exact eight-file no-cache ESLint/Prettier; `npm run build:test`; all four native TAP owners and isolated direct selectors; compiled license owner | All exit 0 at initial source; owners 2/2/3/5 cases; license 5 cases |
| Each store cause | Fresh `npm run build:test`, `node --test --test-reporter=tap dist-test/test/runtime/accessoryStore.test.js`, `npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts` | All exit 0; final owner has zero declared runtime cases and one native file subtest; selector accepts declaration-only source |
| Each clock cause | Fresh `npm run build:test`, `node --test --test-reporter=tap dist-test/test/runtime/clock.test.js`, `npm run test:coverage:direct -- src/runtime/clock.ts test/runtime/clock.test.ts` | All exit 0; two passing cases; isolated 100% lines/functions/branches |
| Compiler contracts | `npm run typecheck` | Exit 0 for strict positive and described missing/non-callable persist negatives; value-returning void-compatible positive retained |
| Task-1 tracer after all causes | Fresh build, exact store owner, exact store direct selector | All exit 0 at `84f4ca8`; final run 22:59:49.664721–22:59:52.959711 UTC |
| Each cause commit | Recorded-base Fallow audit; exact `SKIP=npm-check pre-commit run --files <cause paths>` before staging; ordinary foreground commit | Four pass verdicts, four clean first pre-steps and four passing normal hook streams |
| Source preservation | Captured byte comparison of public documentation through EOF against baseline; exact four future-path Git comparison | Both exit 0; no API/body or future-path change |
| Executor provenance | Ancestor/file checks and `git diff --exit-code 84f4ca8 -- . ':(exclude,glob).planning/**/*.md'` | Both exit 0; only planning Markdown differs |

The cause-002 audit's first sandbox attempt returned 2 because it could not create its temporary base worktree. Its complete native result is retained. The authorized metadata-access retry returned 0 with verdict `pass`; it also retained the base-snapshot cache-entrypoint warning in stderr. The first attempt supplies no passing evidence.

Initial complete native records: `/private/tmp/guardian-04-ports-initial-native/commands.json`. Repair and executor records: `/private/tmp/guardian-04-ports-fix-native/<label>.json`, with byte-exact `<label>.stdout` and `.stderr`. Each repair record retains argv/cwd, real start/end/duration, raw exit, HEAD/branch, path/blob/SHA-256 manifest, binary dirty diff and untracked bytes. The report maps exact labels to every command, pre-step, hook and commit. The CLI discovery attempts for unsupported effort commands were usage probes only; the actual dispatches used `query resolve-model <role> --pick effort`.

The direct selector enforces equal native covered/total line, function and branch values per executable source. No numeric declaration denominator is invented. Selected checks do not refresh merged `coverage/direct.lcov`; no compiled/merged denominator equivalence is claimed. The coordinator's current combined-wave `npm run check` remains pending. Prior `cf04e71` evidence is historical only.

## Separate Assertion Control

For clock assertion maintenance, the fixer temporarily returned seconds from the public adapter. Strict typecheck and exact-file lint accepted that numeric implementation. Fresh native TAP returned 1 with both intended assertions: expected `1700000000000`, actual `1700000000`; expected `1500`, actual `1.5`. No target was skipped or cancelled. Exact source bytes were restored to blob `c6b98a6e2c6863ae0a567d38f1665e40fceb122b`, then fresh build, two owner cases and isolated coverage returned 0. Complete records use `cause004-control-*` and `cause004-*` labels.

This was a restored control of existing assertions, not a genuine production regression. No conditional RED JSON, evidence-only bug commit or failing-code commit was created. The declaration-only owner uses compiler contracts and needs no runtime wrapper or runtime assertion control.

## Deviations from Plan

The coordinator's first generic summary check misclassified two backticked
test commands as created file paths. Its self-check and commit checks passed;
only those inferred file probes failed. Explicit actual paths above let the
advisory probe real outputs without changing any test or product evidence.

None in source scope or product behavior. As required by AGENTS and the explicit owning plan, commits use Conventional titles without phase/milestone text, and execution stays on the authorized `features/code-review-sweep` checkout. Shared STATE, ROADMAP, REQUIREMENTS, WINDOWS, FINDINGS and VALIDATION remain with the coordinator. Header causes stay separate from functional/test causes.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

T-04-01 retains the exact persistence and wall-time contracts with compiler/public observations. T-04-02 has complete original eight-file/header review and native provenance. T-04-SC retains the no-install boundary. No new endpoint, auth path, file access or trust-boundary schema was added. No source/owner stubs or skipped test cases remain in this plan's changes.

## Next Slice and Limits

04-02 owns CR-04-PORTS-005/006/007 and full PORTS correction with the original counter. No later subsystem sweep, live vendor/hardware/private-input result, cross-version compatibility run or Phase 4 human judgment is implied. Historical WINDOWS 46/47 and the earlier capture/count limitations remain open and unwaived. The coordinator owns shared-state advancement and the combined-wave full gate after this terminal handoff.

## Self-Check: PASSED

Executor checks confirmed this summary, all four source/owner paths and the PORTS report exist. All four cause commits are ancestors of HEAD, the persisted baseline/count agree, and the final production bodies/public contracts match their baseline. Native records are `executor-selfcheck`, `executor-summary-measure` and `executor-source-reuse`, all exit 0. The execution-record audit returned 0 with verdict pass; its cache-entrypoint warning is retained in stderr.
