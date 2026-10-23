---
phase: 08-final-sweep-and-gate
plan: "08"
subsystem: evidence-audit
tags: [bug-ledger, red-evidence, git-ancestry]
requires:
  - phase: 01-07
    provides: findings ledgers, native RED archives, debug records, and fixes
provides:
  - milestone bug inventory with 51 stable B-08 IDs
  - explicit proof and limits for historical RED records
affects: [BUG-01, 08-14, final-signoff]
actuals:
  tokens: 11174
  tasks: 2
  commits: 1
commits: 1
plan_head_after: e0d73859e7c62308403a94b506b955ba44ebaff4
tech-stack:
  added: []
  patterns: [revision-qualified evidence audit]
key-files:
  created:
    - .planning/phases/08-final-sweep-and-gate/08-BUG-LEDGER.md
    - .planning/phases/08-final-sweep-and-gate/08-08-SUMMARY.md
  modified: []
key-decisions:
  - "Keep three Phase 6 debug histories distinct from planning-only RED commits."
  - "Leave BUG-01 open while provenance and current-input limits remain."
requirements-completed: []
duration: 10min
completed: 2026-10-22
status: complete
---

# Phase 8 Plan 08: Milestone Bug Provenance Summary

**Audited 51 prior behavior-defect claims against native failures and Git; kept three debug histories and one policy-superseded oracle explicit.**

## Accomplishments

- Assigned B-08-001 through B-08-051 to all identified Phase 1–7 behavior defects. The count is 1, 6, 0, 9, 14, 20, and 1 by phase. Phase 7's defect and Phase 5's HAP defects concern test stand-ins.
- Checked all 16 current RED archives and all 44 nested `priorEvidence` records. Each classifier call exited 0 with `RED_EVIDENCE_OK`. The 48 planning-only rows have source → evidence → fix ancestry, unchanged owner source blobs through evidence, and evidence commits limited to planning paths.
- Preserved Phase 6 ENTRY-019/020 as resolved debug cases after the historical round-four STOP. Advisory CR-02 also has debug evidence. Its exact StatusActive assertion commit `e5b1470` follows source fix `646b327`; the later source reversal is a distinct proof, not a pre-fix test commit.
- Separated restored assertion controls, style findings, rejected candidates, and environmental failures from the behavior-bug inventory.

## Audit limits and contradictions

- The three Phase 6 debug rows lack a complete native RED JSON archive and planning-only evidence commit. Their records report intended failed owner checks and source reversal. The logging record has the maintainer's real-workflow confirmation; the trust-publication record still awaits it.
- ENTRY-017's original field-preservation oracle was superseded by the maintainer's privacy-first policy. The active owner now uses a renamed and different assertion. The earlier RED remains historical evidence; it is not an unchanged current regression.
- Phase 4's early “seven genuine” summary predates ACCOUNT-030/031. Both later archived RED and Git chains were included, giving nine Phase 4 rows.
- Current named owner tests and a fresh combined-tree gate were not run in this delegated document audit. The parent coordinator owns those checks after Phase 8 source edits. No current GREEN result was invented.
- `requirements.ready-ids` returned `0/1 requirement(s) ready to mark complete`; BUG-01 was not marked complete.

## Commands and exits

- `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence <archive> --raw`: 16/16 top-level archives exited 0 and returned `RED_EVIDENCE_OK` / `target_test_failed`.
- The same checker on 44 temporary nested records with `--cwd /private/tmp`: 44/44 exited 0 and returned `RED_EVIDENCE_OK`. The temporary directory was removed.
- `git merge-base --is-ancestor <source> <evidence>`, `<evidence> <fix>`, and `<fix> HEAD`: all three checks exited 0 for each of the 48 archive rows.
- `git show --format= --name-only <evidence>`: all 48 evidence commits changed planning paths only. The corresponding fixes changed owner source and/or active tests.
- `git rev-parse <source>:<owner source>` and `<evidence>:<owner source>`: equal blobs for all 48 archive rows.
- `node .codex/gsd-core/bin/gsd-tools.cjs query requirements.ready-ids .planning/phases/08-final-sweep-and-gate/08-08-PLAN.md BUG-01 --raw`: exit 0, `0/1 requirement(s) ready to mark complete`.
- The plan's text-presence verification for all eight phase headings, SC-05, RECORDS-004, and Negative controls exited 0. The ledger has 51 B-08 rows.

The [bug ledger](./08-BUG-LEDGER.md#commands-and-exits) lists every archived native target command and its raw historical exit. No build, test, pre-commit, or commit command ran for this delegated report.

## Task commits and state

The parent committed the ledger as `e0d7385` after planning-file checks, Fallow audit, and normal hooks. No source, test, shared state, requirement, or other review report was edited here.

## Deviations from Plan

The delegated execution restricted this agent to the two report files and read-only checks. Native current owner tests, the combined gate, commits, and shared state changes remain with the parent. The historical RED audit completed within that boundary. BUG-01 remains open because the evidence limits above cannot be closed by editorial changes.

## Next Phase Readiness

Plan 08-14 can append confirmed new Phase 8 bugs to the intake section. Final signoff must resolve the three debug-evidence limits, ENTRY-017's policy exception, the trust-publication human gate, current regression results, and verification freshness before marking BUG-01 complete.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Self-Check: PASSED

Both created files exist. All 48 recorded archive source, evidence, and fix commits are ancestors of HEAD. The ledger commit is `e0d7385`.
