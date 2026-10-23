---
phase: 05-accessories-conformance
plan: "05"
subsystem: testing
tags: [code-review, accessories, pump-records, reconciliation, restart, unit-tests, d-04]

requires:
  - phase: 05-accessories-conformance
    provides: 05-01 ledger, tracer and protocol; the DECLARATIONS, CATALOGUE and CONTROLS batches clean
provides:
  - RECORDS batch (pumpRecords, reconciliation and staleMarking pairs) reviewed in full and clean at correction round 3
  - three pump-record bugs fixed through RED-to-GREEN evidence (wrong self-test label, restart double count, same-observation edge)
  - the unread reconciliation `clock` option removed (lead S-05-07, D-06)
  - adaptation rows for src/persistence/accessoryContext.ts, test/platform.test.ts and src/runtime/accountRuntime.ts
affects: [05-06, 05-07, 05-08, 05-09, 06-platform]

actuals:
  tokens: 95356
  tasks: 3
  commits: 66

tech-stack:
  added: []
  patterns:
    - "A behavior question with no safe answer (the first-timestamp trade-off) goes to the maintainer and is recorded as a rejection with the decision as its reason"
    - "Production fixes run every unit module, not only named consumers"

key-files:
  created:
    - .planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md
    - .planning/phases/05-accessories-conformance/05-RECORDS-REVIEW-R1.md
    - .planning/phases/05-accessories-conformance/05-RECORDS-REVIEW-R2.md
    - .planning/phases/05-accessories-conformance/05-RECORDS-REVIEW-R3.md
    - .planning/phases/05-accessories-conformance/05-PUMP-RECORDS-RED-EVIDENCE.json
  modified:
    - src/accessories/pumpRecords.ts
    - test/accessories/pumpRecords.test.ts
    - src/accessories/reconciliation.ts
    - test/accessories/reconciliation.test.ts
    - src/accessories/staleMarking.ts
    - test/accessories/staleMarking.test.ts
    - src/persistence/accessoryContext.ts
    - test/platform.test.ts
    - src/runtime/accountRuntime.ts
    - .planning/phases/05-accessories-conformance/05-FINDINGS.md

key-decisions:
  - "The maintainer chose to fix CR-05-RECORDS-001 and 002 in this batch: a counted backup activation removes the stored self-test label and classification waits for the run's own timestamp; the awaiting state is persisted as the optional `watermarks.backupEdgeAwaitingTimestamp` (no top-level key changed)."
  - "The maintainer kept the first-timestamp trade-off (CR-05-RECORDS-032 rejected): the record cannot tell an older first timestamp from a waiting run's own without mixing clocks; the comments now state the assumption and both costs."
  - "CR-05-RECORDS-038 was classified within the 001 class: `observe` reconciles the backup timestamp before it marks an edge, so an advance that arrives with an edge counts as an earlier run."
  - "Lead S-05-03 was rejected (the book's reference case groups a factory's operations under one describe each); S-05-07 was confirmed and its branch removed the unread clock option."

patterns-established:
  - "A comment-claim class gets checked clause by clause in the round-0 review prompt, which kept this batch to three correction rounds."

requirements-completed: [ACC-01]

coverage:
  - id: D1
    description: "The six RECORDS files reviewed in full (and the three adaptation hunks); 40 findings fixed and 1 rejected by the maintainer, confirmed by independent correction rounds"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --require-clean RECORDS"
        status: pass
    human_judgment: false
  - id: D2
    description: "Three genuine bugs fixed RED-to-GREEN with committed evidence that passes the classifier"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "node .claude/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/05-accessories-conformance/05-PUMP-RECORDS-RED-EVIDENCE.json --raw (at each evidence commit)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each touched pair passes alone at 100% direct coverage and all nine reviewed files carry the D-01 header"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "npm run test:coverage:direct -- the pumpRecords, reconciliation, staleMarking, accountRuntime, accessoryContext and platform sources"
        status: pass
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch RECORDS"
        status: pass
    human_judgment: false
  - id: D4
    description: "The combined tree passes the full gate after the wave"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "npm run check at c98babf44c810ceeea745a34021adf52260d5df9 (raw exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The pump-record behavior changes and the kept first-timestamp trade-off"
    requirement: "ACC-01"
    verification: []
    human_judgment: true
    rationale: "Both are maintainer decisions recorded in the triage; the stale-label presentation in HomeKit is an open question for the verifier."

duration: 3h 36m
completed: 2026-10-18
status: complete
---

# Phase 5 Plan 05: RECORDS Batch Summary

**The pump-records, reconciliation and restart-pass pairs are clean at correction round 3, after
40 fixes. Three pump-record bugs no longer misreport: a real backup run is not labelled a
self-test, a restart in the middle of a run does not count it twice, and a timestamp advance that
arrives with a running edge counts as the earlier run.**

## Performance

- **Duration:** 3h 36m
- **Started:** 2026-10-17T23:56:25Z (resume check)
- **Completed:** 2026-10-18T03:32Z
- **Tasks:** 3
- **Files modified:** the six batch files, three adaptations, the ledger, four review reports and
  the RED evidence file

## Accomplishments

- Round 0 found 31 findings (10 BLOCKER, 21 WARNING). Round 1 found 6 more (032 rejected by the
  maintainer) and round 2 found 4. Round 3 was clean.
- Three production behavior changes in pumpRecords, each RED-to-GREEN:
  - 001: a counted backup activation removes the stored self-test label, and classification waits
    while a counted run awaits its own timestamp or while no activation is held.
  - 002: the awaiting state is stored as the optional `watermarks.backupEdgeAwaitingTimestamp`, so a
    restart in the middle of a run no longer counts it twice. No migration and no top-level context
    key changed.
  - 038: `observe` reconciles the backup timestamp before it marks an edge.
- The reconciliation options lost their unread `clock` member, and the one runtime call stopped
  passing it (D-06, with impact checks on the type and on `createReconciliation`).
- The tests now pin watermark writes, each self-test label check alone, the exact
  unreadable-record line, both restored controls, a status no default gives, the control module's
  refusal, a `forget` that is not a tombstone, and a running state that fails to decode once.
- The first-timestamp trade-off (032) stays as the maintainer decided, and its comments now state
  it as an assumption with both costs.

## Task Commits

1. **Task 05-05-01: Review and land the pump-records header cause** - review `fd62233`, fix
   `efdf577`
2. **Task 05-05-02: Repair every round-0 cause** - RED/GREEN `9701899`/`e93758e` (001) and
   `fb0a1d1`/`5e753ca` (002), with follow-ups `30a9895` and `89fd670`; staleMarking `f23ca8d`,
   `c2875ee`, `b47954b`, `7cb97fa`, `62eec51`, `9d8d06d`, `7a7e175`, `7f52a78`, `5abd852`; sources
   `805088b`, `514f78d`, `039c51d`, `3dda902`, `d16eaf5`; reconciliation `5ecfdfe`, `3a30620`,
   `70d97fc`, `7e1eb2b`; pumpRecords tests `8036ef6`, `aa640ad`, `644ef35`, `34451dd`, `3bed8d8`,
   `aee539b`, `6a63119`, `5e50e26`, `a85b940`, `8afc2b9`, `69a609c`, `8f6cb8d`; declarations
   `cac84d9`, `721fbdc`, `79a05bd`
3. **Task 05-05-03: Correction rounds and gate** - rounds `d36cd7a`, `056264f`, `c98babf`; fixes
   `fab1c46`, `72ad42b`, `5c16b8b`, `3fc4be2`, `629dbd9`, `f840798`, RED/GREEN `5105051`/`700bd8c`
   (038), `e3b71fe`, `a120892`, `6fbb9ca`; closure `f9e56f8`, `cc745fe`

## Files Created/Modified

- `src/accessories/pumpRecords.ts`: the three bug fixes, the D-01 header and comment corrections
- `test/accessories/pumpRecords.test.ts`: 33 to 45 cases, three regression cases and the test-gap
  repairs
- `src/accessories/reconciliation.ts` / test: the `clock` option removed, comment fixes, a
  tombstone-proof `forget` case, a duplicate removed (14 to 13 cases)
- `src/accessories/staleMarking.ts` / test: D-01 headers, caller claims, both controls, the control
  module's refusal, one commented widening block (18 to 19 cases)
- `src/persistence/accessoryContext.ts` (adaptation): the optional awaiting member and comment fixes
- `test/platform.test.ts` (adaptation): the one expectation the awaiting mark changes
- `src/runtime/accountRuntime.ts` (adaptation): the one `createReconciliation` call

## Check Results

All commands ran from the repository root with `export PATH="/opt/homebrew/opt/node/bin:$PATH"`,
Node v26.12.0, npm 11.20.0.

| Command | Raw exit | Result |
| --- | --- | --- |
| `05-ledger-tracer.mjs` after every ledger change | 0 | final: `inventory=27 findings=138 open=0 rounds=26` |
| `05-ledger-tracer.mjs --headers --batch RECORDS` | 0 | `ACCESSORIES_HEADERS_OK files=9` |
| `05-ledger-tracer.mjs --require-clean RECORDS` | 0 | `clean=RECORDS` |
| `check tdd-red-evidence` on each of the three records | 0 | `RED_EVIDENCE_OK` (`target_test_failed`) |
| D-06 impact commands (`ActivationWatermarks`, `ReconciliationOptions`, `createReconciliation`) | 0 | complete; consumers recorded in the ledger |
| every unit module (after the consumer follow-up and after 038) | 0 | 1634 and 1636 tests, 0 failures |
| `npm run check` at `c98babf` | 0 | six static checks passed; 104 scenarios; 1156 steps; 43 pairs |

## TDD Gate Compliance

Three genuine bugs, each with committed RED evidence before its GREEN fix. In each case the
evidence commit is the fix commit's parent, and production is unchanged through it:

| Finding | Regression case | Evidence | Fix |
| --- | --- | --- | --- |
| 001 | 'withholds the self-test label from a watched backup run whose device timestamp has not arrived' | `9701899` | `e93758e` |
| 002 | 'counts a watched backup run once across a restart before its device timestamp arrives' | `fb0a1d1` | `5e753ca` |
| 038 | 'reads a timestamp advance that arrives with a backup edge as an earlier run' | `5105051` | `700bd8c` |

Every other BLOCKER was a test gap. Each repair carried a restored assertion control, recorded in
the round reports.

## Decisions Made

See key-decisions above. The maintainer chose the fixes for 001 and 002 and kept the 032
trade-off.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The 002 fix broke a Phase 6 test that its consumer checks had missed**
- **Found during:** the staleMarking dispatch (it ran the platform owner)
- **Issue:** `test/platform.test.ts` expected the stored watermarks without the new awaiting member.
- **Fix:** declared the file as an adaptation (row 26) and updated that one expectation. Every
  production fix since then runs every unit module.
- **Committed in:** `721fbdc`, `89fd670`

**2. [Rule 1 - Bug] Closure note miscounted bugs**
- **Fix:** the note named a fourth bug; it now names three bugs, one follow-up and the severity
  counts.
- **Committed in:** `cc745fe`

**3. [Plan] Repair order grouped by pair**
- The plan orders all source comments before all tests. The dispatches grouped causes by pair
  (staleMarking, then pumpRecords and reconciliation sources, then tests). Each cause still has its
  own commit.

---

**Total deviations:** 2 auto-fixed, 1 ordering adjustment
**Impact on plan:** the behavior changes are the D-04 path with maintainer approval; adaptation
edits stayed bounded to the declared hunks.

## Issues Encountered

- Out-of-scope observations for the verifier and later phases:
  - the stale `watermarks` JSDoc at `src/platform.ts:66` (Phase 6);
  - the `AccessoryContext` top-level identity members against the stored `device` object;
  - the HomeKit presentation of a removed label (HAP keeps the last published value).

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 05-06/05-07 (ACCESSORY batch), with leads S-05-24 and S-05-25 waiting there.

## Self-Check

- Reports R0 to R3 and the RED evidence file exist and are tracked, and every fix commit is an
  ancestor of HEAD.
- `--require-clean RECORDS` and `--headers --batch RECORDS` exit 0.
- `grep -cE 'primaryPump\?:|backupPump\?:|watermarks\?:' src/accessories/pumpRecords.ts` prints 3.
- `git diff 0c0930e..HEAD -- src/runtime/accountRuntime.ts` changes only the `createReconciliation`
  call.

## Self-Check: PASSED
