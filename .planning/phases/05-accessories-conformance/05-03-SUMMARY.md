---
phase: 05-accessories-conformance
plan: "03"
subsystem: testing
tags: [code-review, accessories, service-catalogue, hap, unit-tests]

requires:
  - phase: 05-accessories-conformance
    provides: 05-01 ledger, tracer and protocol; 05-02 DECLARATIONS batch clean
provides:
  - CATALOGUE batch (serviceCatalogue pair) reviewed in full and clean at correction round 6
  - a per-row coverage sweep showing all seventeen catalogue rows pinned against plausible wrong rows
  - isRowTrusted made module-local (D-06 traced; only the paired test consumed it)
affects: [05-04, 05-05, 05-06, 05-07, 05-08, 05-09]

actuals:
  tokens: 95348
  tasks: 3
  commits: 25

tech-stack:
  added: []
  patterns:
    - "Off-derivation inputs: decoded values deliberately inconsistent with the family's derivation, so a row that re-derives them fails"
    - "Expected values carried as hand-written row fields; no conditional in any data-loop body"

key-files:
  created:
    - .planning/phases/05-accessories-conformance/05-CATALOGUE-REVIEW.md
    - .planning/phases/05-accessories-conformance/05-CATALOGUE-REVIEW-R1.md
    - .planning/phases/05-accessories-conformance/05-CATALOGUE-REVIEW-R2.md
    - .planning/phases/05-accessories-conformance/05-CATALOGUE-REVIEW-R3.md
    - .planning/phases/05-accessories-conformance/05-CATALOGUE-REVIEW-R4.md
    - .planning/phases/05-accessories-conformance/05-CATALOGUE-REVIEW-R5.md
    - .planning/phases/05-accessories-conformance/05-CATALOGUE-REVIEW-R6.md
  modified:
    - src/accessories/serviceCatalogue.ts
    - test/accessories/serviceCatalogue.test.ts
    - .planning/phases/05-accessories-conformance/05-FINDINGS.md

key-decisions:
  - "CR-05-CATALOGUE-017 was accepted by coordinator triage from the round-1 reviewer's candidate list: the Data-driven cases rule forbids a conditional in a loop body, so every loop's expected value moved into its rows."
  - "The maintainer resolved two D-03 no-progress stops (rounds 2 and 3) with 'Resolve and continue'; round 3 added a systematic per-row coverage sweep, which reached all seventeen rows by round 5."
  - "Lead S-05-17 was rejected for this batch: the cited case checks an import, not a read handler, and no gate covers that import."
  - "Lead S-05-23 (GATES, D-16) records two stand-in read-path disagreements with real HAP: a synchronous get-request throw and no create-on-miss in getCharacteristic."

patterns-established:
  - "A correction round that keeps finding pre-existing gaps of one class gets a systematic sweep table so the next round can confirm the class is closed."

requirements-completed: [ACC-01]

coverage:
  - id: D1
    description: "The catalogue pair reviewed in full; all 24 findings fixed in their own commits and confirmed by independent correction rounds"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --require-clean CATALOGUE"
        status: pass
    human_judgment: false
  - id: D2
    description: "The pair passes alone at 100% direct coverage and both files carry the D-01 header"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts"
        status: pass
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CATALOGUE"
        status: pass
    human_judgment: false
  - id: D3
    description: "The combined tree passes the full gate after the wave"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "npm run check at d9ddb347909abef1558cae8c66b8f8d097daf5f6 (raw exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The maintainer's resolutions of the two D-03 stops"
    requirement: "ACC-01"
    verification: []
    human_judgment: true
    rationale: "Continuing past a no-progress stop is a maintainer decision by D-03; phase verification re-reads the stop records."

duration: 3h 4m
completed: 2026-10-17
status: complete
---

# Phase 5 Plan 03: CATALOGUE Batch Summary

**The service catalogue pair is clean at correction round 6: 24 findings fixed, including 11
blocking test gaps, so no catalogue row can now publish a re-derived, defaulted or wrongly guarded
value and still pass**

## Performance

- **Duration:** 3h 4m
- **Started:** 2026-10-17T14:12:53Z (resume check)
- **Completed:** 2026-10-17T17:17:10Z
- **Tasks:** 3
- **Files modified:** the catalogue pair, the ledger and seven round reports

## Accomplishments

- The round-0 review found 15 findings (5 BLOCKER, 10 WARNING); correction rounds 1 to 4 found 9
  more (6 BLOCKER, 3 WARNING), all pre-existing at the batch base except the two titles and
  arranges the repairs touched; rounds 5 and 6 closed the last remainder.
- Every catalogue row is pinned against the plausible wrong rows the reviewers named: absent or
  wrong-typed groups, values re-derived from raw codes (water and battery), the device's own
  offline report, a self-test in progress, other active conditions beside a flood, a missing
  connectivity group, and the wrong pump field.
- Data-loop expectations live in the rows; no `// act & assert`, no ternary and no conditional
  remains in a loop body; cases sit under the `describe()` of the entrypoint they call.
- The source changed only in its header, one JSDoc reason and the dropped `export` on
  `isRowTrusted`; every subtype, display name, mapping, withholding rule and the single
  `HapStatusError` push are unchanged (source blob `cef0ebf5...`).

## Task Commits

1. **Task 05-03-01: Review and land the header cause** - review `a68bd36`, fix `c89c8c4`
2. **Task 05-03-02: Repair every round-0 cause** - `976ca43`, `b70716f`, `76d78eb`, `36f5ff2`,
   `5420b9d`, `2f31fbd`, `570adc0`, `e86674b`, `2de0bbd`, `53c375a`, `7faf1c4`, `2cec494`,
   `e131aad`, `ded037b`
3. **Task 05-03-03: Correction rounds and gate** - rounds `f9b4b88`, `047c26c`, `520364a`,
   `c79a40e`, `64c57c7`, `d9ddb34`; fixes `1629e77`, `1a5c9ff`, `8a10ce9`, `ae2ab2c`, `e565941`,
   `f55d0f0`, `252b50a`, `b87ee68`, `da8ff2c`, `46265a6`; closure `897bb67`

## Files Created/Modified

- `src/accessories/serviceCatalogue.ts` - D-01 header, the `seedConfiguredName` JSDoc reason, `isRowTrusted` module-local
- `test/accessories/serviceCatalogue.test.ts` - header, phases, pins, row-carried expectations, describe filing (185 to 212 tests)
- `.planning/phases/05-accessories-conformance/05-CATALOGUE-REVIEW*.md` - round 0 and correction rounds 1 to 6
- `.planning/phases/05-accessories-conformance/05-FINDINGS.md` - CATALOGUE rows, counters and evidence

## Check Results

All commands ran from the repository root with `export PATH="/opt/homebrew/opt/node/bin:$PATH"`,
Node v26.12.0, npm 11.20.0.

| Command | Raw exit | Result |
| --- | --- | --- |
| `05-ledger-tracer.mjs` after every ledger change | 0 | final: `inventory=24 findings=59 open=0 rounds=12` |
| `05-ledger-tracer.mjs --headers --batch CATALOGUE` | 0 | `ACCESSORIES_HEADERS_OK files=2` |
| `05-ledger-tracer.mjs --require-clean CATALOGUE` | 0 | `clean=CATALOGUE` |
| D-06 `fallow dead-code --type-aware --symbol-impact ...:isRowTrusted` (both projects) | 0 | complete; only consumer the paired test |
| owner `node --test dist-test/test/accessories/serviceCatalogue.test.js` (final) | 0 | 212 tests, 12 suites, 0 failures |
| `npm run test:coverage:direct --` the pair | 0 | 100% alone |
| `npm run check` at `d9ddb34` | 0 | six static checks passed; 104 scenarios; 1156 steps; 43 pairs |
| Each fixer's guard, ESLint and `fallow audit --base ef7578f` | 0 | verdict pass on every cause |

## TDD Gate Compliance

No genuine bug confirmed; no RED evidence. Every BLOCKER was a test a plausible wrong row passed;
each repair carried restored assertion controls (recorded in the round reports), for example a
defaulted battery fact, an inline water ladder, a flood derived from the code, `StatusFault`
raised for an outage, `offlineConfirmed` made optional (TS2578), the battery level from the
protection band, the offline adapter firing on `reportedOffline`, the alert hidden or raised
during a self-test, the flood row withheld during a sensor fault, and the backup row reading the
primary pump. GSD's subject-based TDD check cannot see domain-scoped commits; this record
replaces it.

## Decisions Made

See key-decisions above: 017 accepted by coordinator triage, two maintainer-resolved stops, the
S-05-17 rejection and the new GATES lead S-05-23.

## Deviations from Plan

None - the plan's loop ran as written; the two D-03 stops were handled by the protocol with the
maintainer's recorded resolutions, not as deviations.

## Issues Encountered

- Rounds 2 and 3 stopped on no progress because each surfaced pre-existing gaps the earlier
  rounds had not seen. The round-3 per-row sweep made the class visible; rounds 4 to 6 closed it.
- Out-of-scope observations recorded in the reports for later batches: the stand-in read path
  (S-05-23, GATES), and no `PumpRunning` assertion in `basementGuardian.test.ts` (ACCESSORY).

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 05-04 (CONTROLS batch with the seven seeds).

## Self-Check

- Reports R0 to R6 exist and are tracked; all 25 fix commits are ancestors of HEAD.
- `--require-clean CATALOGUE` and `--headers --batch CATALOGUE` exit 0.
- `grep -c 'new hap.HapStatusError' src/accessories/serviceCatalogue.ts` prints 1.

## Self-Check: PASSED
