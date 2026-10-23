---
phase: 05-accessories-conformance
plan: "04"
subsystem: testing
tags: [code-review, accessories, controls, hap, unit-tests, d-04]

requires:
  - phase: 05-accessories-conformance
    provides: 05-01 ledger, tracer and protocol; 05-02 DECLARATIONS and 05-03 CATALOGUE batches clean
provides:
  - CONTROLS batch (controls pair) reviewed in full and clean at correction round 9
  - three genuine control-path bugs fixed through RED-to-GREEN evidence (D-037, D-038)
  - all seven Phase 1 spot-check seeds disposed (all fixed)
  - sentence-level and clause-level audits of every comment claim in the pair
  - ACCESSORY leads S-05-24 and S-05-25
affects: [05-05, 05-06, 05-07, 05-08, 05-09]

actuals:
  tokens: 181844
  tasks: 3
  commits: 86

tech-stack:
  added: []
  patterns:
    - "Strict mocks (strong-mock, exactParams) for issued commands; typed stubs where the port is incidental"
    - "Held-promise cases for presses and reports that arrive while a command is still in flight"
    - "Comment-claims audit tables (sentence, then clause level) with code evidence for every factual claim"

key-files:
  created:
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R1.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R2.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R3.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R4.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R5.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R6.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R7.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R8.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R9.md
    - .planning/phases/05-accessories-conformance/05-CONTROLS-RED-EVIDENCE.json
  modified:
    - src/accessories/controls.ts
    - test/accessories/controls.test.ts
    - .planning/phases/05-accessories-conformance/05-FINDINGS.md

key-decisions:
  - "CR-05-CONTROLS-008, 009 and 033 were classified as genuine production bugs (D-04) against the locked D-037 and D-038; each landed as RED evidence first, then the minimum fix."
  - "The new pending refusal goes last in LOCAL_REFUSALS with RESOURCE_BUSY and the cause 'an earlier request is still waiting for the device to confirm it', so no existing refusal changes its answer."
  - "A timed-out command keeps its pending entry and window and logs 'timed out and may still have reached the device'; the vendor-error line is unchanged."
  - "The maintainer resolved four D-03 no-progress stops (rounds 4, 6, 7 and 8) with 'Resolve and continue'; sentence-level and clause-level comment audits closed the comment class by round 9."
  - "A refused press while a request waits pushes the reported value, as the WR-02 case decides; D-037's held requested value covers the accepted write."

patterns-established:
  - "A comment class that keeps returning gets a claims audit table with evidence per claim, then per clause, so the next round can confirm the class is closed."

requirements-completed: [ACC-01]

coverage:
  - id: D1
    description: "The controls pair reviewed in full; all 45 findings fixed in their own commits and confirmed by independent correction rounds"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --require-clean CONTROLS"
        status: pass
    human_judgment: false
  - id: D2
    description: "Three genuine bugs fixed RED-to-GREEN with committed evidence that passes the classifier"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "node .claude/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/05-accessories-conformance/05-CONTROLS-RED-EVIDENCE.json --raw (at each evidence commit)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The pair passes alone at 100% direct coverage and both files carry the D-01 header"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts"
        status: pass
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS"
        status: pass
    human_judgment: false
  - id: D4
    description: "The combined tree passes the full gate after the wave"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "npm run check at 7e9613198aa455876e6cbbd3e9c69b4e801fb0fd (raw exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The control-path behavior changes and the maintainer's resolutions of four D-03 stops"
    requirement: "ACC-01"
    verification: []
    human_judgment: true
    rationale: "The three behavior changes follow locked decisions, and the new wordings are coordinator choices; the maintainer may want to confirm the wording and re-read the stop records."

duration: 6h 11m
completed: 2026-10-17
status: complete
---

# Phase 5 Plan 04: CONTROLS Batch Summary

**The control binder pair is clean at correction round 9: 45 findings fixed, including three
genuine control-path bugs. A second press while a request waits is now refused, a timed-out
command stays pending as D-038 requires, and its warning no longer claims an outcome the plugin
cannot know.**

## Performance

- **Duration:** 6h 11m
- **Started:** 2026-10-17T17:43:33Z (resume check)
- **Completed:** 2026-10-17T23:54Z
- **Tasks:** 3
- **Files modified:** the controls pair, the ledger, ten review reports and the RED evidence file

## Accomplishments

- The round-0 review found 29 findings (9 BLOCKER, 20 WARNING) and confirmed all seven Phase 1
  seeds. Correction rounds 1 to 8 found 16 more (2 BLOCKER, 14 WARNING), mostly comment claims;
  round 9 was clean.
- Three production behavior changes, each from locked decisions and each RED-to-GREEN:
  - 008 (D-037, CTRL-03): a second on request while one waits for the device is refused locally
    with `RESOURCE_BUSY` and nothing is sent. Before, a real sump pump got a second command, and
    the first window ended the second request early.
  - 009 (D-038): a timed-out command keeps its pending entry and its 30-second window. Before, it
    dropped them, which let the next press operate the pump again.
  - 033 (D-038): the timed-out warning reads "timed out and may still have reached the device"
    instead of "did not take effect".
- The tests went from 63 cases with no suites to 105 cases in two suites (`createControlBinder`,
  `bindRestoredControlRefusal`). Strict mocks verify the issued commands. The cases now pin every
  refusal pair that can hold together, the timers a refusal leaves, the clearing push and its
  republish, the error class, both values of a restored press, and presses and reports that
  arrive while a command is still in flight.
- Every factual comment claim in both files was audited with evidence, first per sentence (R7:
  190 claims) and then per clause (R8: 392 clauses). The false claims were narrowed or dropped.

## Task Commits

1. **Task 05-04-01: Review and land the header cause** - review `eb15deb`, fix `704a2ff`
2. **Task 05-04-02: Repair every round-0 cause** - source comments `c2026fe`, `ee4969f`,
   `b1a7668`, `e3c8731`; RED/GREEN `9b5cd20`/`a2ae20a` (008) and `1f85938`/`670ae89` (009); tests
   `13d46f1`, `014f601`, `0506c32`, `05b4b9a`, `7929ddb`, `074ed67`, `c6267b1`, `dbad2c1`,
   `2a6747b`, `7a3bfc0`, `5f06eb7`, `0ca2edf`, `ae0eaa4`, `9dd9ead`, `cc1ebae`, `11b384a`,
   `498f0da`, `5d230b6`, `09882cf`, `710b87f`, `a734c1a`, `41e0ca4`, `dbcbf07`
3. **Task 05-04-03: Correction rounds and gate** - rounds `64ed4b9`, `2b191d8`, `c9eb7bb`,
   `b4f5217`, `f07bc59`, `1d0a907`, `f1e7bee`, `2079eb9`, `7e96131`; fixes `854d5d1`,
   `11c32d2`/`7790818` (033), `f96f63c`, `75b9825`, `3e879b6`, `9627362`, `5f5a828`, `946be0e`,
   `eb503e5`, `a1be90c`, `77db333`, `f9f2bcd`, `7d1943e`, `aded73a`, `3bda590`, `af70160`,
   `dda7a47`, `52f33bf`, `23ebcc1`; closure `4184f04`, `e7fe219`

## Files Created/Modified

- `src/accessories/controls.ts` - D-01 header; the pending refusal, the kept timed-out entry and
  the timed-out warning; many comment corrections
- `test/accessories/controls.test.ts` - 63 to 105 cases, two suites, strict mocks, precedence,
  timer, push, error-class and in-flight cases, and comment and title corrections
- `.planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW*.md` - round 0 and correction
  rounds 1 to 9, with the two audits
- `.planning/phases/05-accessories-conformance/05-CONTROLS-RED-EVIDENCE.json` - the 033 record,
  which holds the 009 and 008 records in `priorEvidence`
- `.planning/phases/05-accessories-conformance/05-FINDINGS.md` - CONTROLS rows, counters,
  genuine bug histories, leads S-05-24 and S-05-25, and evidence

## Check Results

All commands ran from the repository root with `export PATH="/opt/homebrew/opt/node/bin:$PATH"`,
Node v26.12.0, npm 11.20.0.

| Command | Raw exit | Result |
| --- | --- | --- |
| `05-ledger-tracer.mjs` after every ledger change | 0 | final: `inventory=24 findings=97 open=0 rounds=22` |
| `05-ledger-tracer.mjs --headers --batch CONTROLS` | 0 | `ACCESSORIES_HEADERS_OK files=2` |
| `05-ledger-tracer.mjs --require-clean CONTROLS` | 0 | `clean=CONTROLS` |
| `check tdd-red-evidence` on each of the three records | 0 | `RED_EVIDENCE_OK` (`target_test_failed`) |
| owner `node --test dist-test/test/accessories/controls.test.js` (final) | 0 | 105 tests, 2 suites, 0 failures |
| `npm run test:coverage:direct --` the pair | 0 | 100% alone |
| consumer `basementGuardian` owner and pair, whole Cucumber suite (at each GREEN) | 0 | 157 tests; 104 scenarios, 1156 steps |
| `npm run check` at `7e96131` | 0 | six static checks passed; 104 scenarios; 1156 steps; 43 pairs |
| Each fixer's guard, ESLint, typecheck and `fallow audit --base 4c143eb` | 0 | verdict pass on every cause |

## TDD Gate Compliance

Three genuine bugs, each with committed RED evidence before its GREEN fix (the evidence commit
is the fix commit's parent, and production is unchanged through it):

| Finding | Regression case | Evidence | Fix |
| --- | --- | --- | --- |
| 008 | 'refuses a second on request while the first waits for the device, and sends one command' | `9b5cd20` | `a2ae20a` |
| 009 | 'keeps the request pending when the vendor does not answer in time' | `1f85938` | `670ae89` |
| 033 | 'warns that a timed-out request may still have reached the device' | `11c32d2` | `7790818` |

Every other BLOCKER was a test gap. Each repair carried a restored assertion control, recorded
in the round reports. GSD's subject-based TDD check cannot see domain-scoped commits; this record
replaces it.

## Decisions Made

See key-decisions above. The coordinator chose the new pending cause and the timed-out wording.
The maintainer resolved four D-03 stops.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Three control-path bugs against locked decisions**
- **Found during:** Task 05-04-01 triage (008, 009) and correction round 1 (033)
- **Issue:** the binder sent a second command while one was pending (D-037). It dropped a
  timed-out command's pending state (D-038). It told the owner a timed-out command "did not take
  effect".
- **Fix:** D-04 RED-to-GREEN for each, with the minimum production change.
- **Plan criterion affected:** task 05-04-02's "changes no line inside the `LOCAL_REFUSALS` array
  literal" does not hold. One row was appended for 008. D-05 allows that change only when a
  finding names the behavior and D-04 proves it, as here. Every existing row is unchanged.
- **Committed in:** `a2ae20a`, `670ae89`, `7790818`

**2. [Rule 1 - Bug] A mistyped fix hash in the ledger**
- **Found during:** round-1 triage (the tracer checks fix commits of `fixed` findings)
- **Fix:** `1f85938659` was corrected to `1f8593865e` and recorded as such.
- **Committed in:** `64ed4b9`

**3. [Rule 1 - Bug] Closure note miscounted severities**
- **Fix:** the closure note said 13 BLOCKER and 32 WARNING; the rows hold 11 and 34.
- **Committed in:** `e7fe219`

---

**Total deviations:** 3 auto-fixed (one behavior class from locked decisions, two record fixes)
**Impact on plan:** the plan expected style and test repairs only. The three behavior fixes are
the D-04 path the protocol defines. The four stops were handled by the protocol, not as
deviations.

## Issues Encountered

- Rounds 4, 6, 7 and 8 hit `STOP: no progress`. Each round's comment rewrites or deeper reading
  surfaced one or two new comment claims, plus one earlier test gap (041). The maintainer chose
  "Resolve and continue" each time. A sentence-level audit (R7) and a clause-level audit (R8)
  closed the class, and round 9 was clean.
- Out-of-scope observations for later batches and the verifier:
  - leads S-05-24 and S-05-25 (ACCESSORY): an expiry that leaves HAP serving the requested value,
    and a restored refusal that logs the transport cause while the transport is ready;
  - the "before the device confirms" claim at `serviceCatalogue.ts:537-538` (CATALOGUE is
    closed; for the verifier);
  - the `CommandFailure` JSDoc at `src/runtime/commandPort.ts:21`;
  - the stand-in read and reset gaps (GATES S-05-15 and S-05-23).
- A maintainer question: the control log lines carry `deviceId`, which includes the account
  identifier in the vendor's format, while AGENTS.md keeps account identifiers out of logs. The
  lines are preserved (D-05, ruling `263cae0`), so this is recorded, not changed.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 05-05 (RECORDS batch). Leads S-05-24 and S-05-25 wait for the ACCESSORY batch
(05-06/05-07).

## Self-Check

- Reports R0 to R9 and the RED evidence file exist and are tracked; every fix commit is an
  ancestor of HEAD.
- `--require-clean CONTROLS` and `--headers --batch CONTROLS` exit 0.
- `grep -c "an earlier request is still waiting for the device to confirm it" src/accessories/controls.ts` prints 1.

## Self-Check: PASSED
