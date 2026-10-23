---
phase: 05-accessories-conformance
plan: "07"
subsystem: accessories
tags: [code-review, accessories, connectivity, unit-tests, d-04]

requires:
  - phase: 05-accessories-conformance
    provides: 05-06 ACCESSORY round-0 review, source repairs, and open finding counter
provides:
  - ACCESSORY test-side repairs and four independent correction rounds
  - Three connectivity timestamp regressions with committed RED evidence before each fix
  - Clean ACCESSORY ledger, conforming headers, and a passing full project gate
affects: [05-08, 05-09, 06-platform, 07-features]

actuals:
  tokens: 130090
  tasks: 3
  commits: 60

tech-stack:
  added: []
  patterns:
    - "A successful REST poll advances connectivity trust time; a live update does not"

key-files:
  created:
    - .planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R1.md
    - .planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R2.md
    - .planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R3.md
    - .planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R4.md
  modified:
    - src/accessories/basementGuardian.ts
    - test/accessories/basementGuardian.test.ts
    - test/accessories/hapImportScope.test.ts
    - .planning/phases/05-accessories-conformance/05-FINDINGS.md
    - .planning/phases/05-accessories-conformance/05-BASEMENT-GUARDIAN-RED-EVIDENCE.json

key-decisions:
  - "Moved cross-module HAP source checks from the accessory owner into the existing HAP gate before its full 05-08 review."
  - "The maintainer authorized a bounded continuation for finding 034 after round 3 met the D-03 stop condition."

patterns-established:
  - "Keep connectivity's last trusted time tied to a valid REST observation, including recovery polls processed before monitoring health clears."

requirements-completed: [ACC-01]

coverage:
  - id: D1
    description: "ACCESSORY test-side causes and the full pair were independently reviewed to a clean round"
    requirement: ACC-01
    verification:
      - kind: other
        ref: "05-ACCESSORY-REVIEW-R4.md; 05-ledger-tracer.mjs --require-clean ACCESSORY"
        status: pass
    human_judgment: false
  - id: D2
    description: "REST and live connectivity timestamps preserve the last valid observation"
    requirement: ACC-01
    verification:
      - kind: unit
        ref: "check tdd-red-evidence on 05-BASEMENT-GUARDIAN-RED-EVIDENCE.json; basementGuardian owner and direct pair"
        status: pass
    human_judgment: false
  - id: D3
    description: "The combined project passed static, behavioral, unpaired and direct coverage gates"
    requirement: ACC-01
    verification:
      - kind: other
        ref: "npm run check at 448b0d42f58f35d509f1c5a987165f46caca56b7"
        status: pass
    human_judgment: false

duration: 1h 52m
completed: 2026-10-18
status: complete
---

# Phase 5 Plan 07: ACCESSORY Correction Summary

**The ACCESSORY pair closed cleanly. Successful REST polls, including recovery polls, now
advance connectivity's last trusted time without treating later live updates as REST evidence.**

## Performance

- **Duration:** about 1h 52m of resumed work
- **Started:** 2026-10-18T11:58Z
- **Completed:** 2026-10-18T13:50Z
- **Tasks:** 3
- **Files modified:** 12 before this summary

## Accomplishments

- Repaired the 22 test-side causes assigned by round 0 while retaining the named behavior
  checks. Cross-module HAP source checks now run in the existing HAP gate; 05-08 will review
  that gate in full.
- Four independent correction rounds closed all 34 ACCESSORY findings. Round 3 recorded a
  D-03 stop with one open finding; the maintainer authorized the bounded repair of 034, and
  round 4 closed with no open, new or reopened findings.
- Added active regressions for three connectivity timestamp bugs (030, 033 and 034). Each
  regression failed against unchanged production, passed the RED classifier, and preceded
  its production fix.

## Task Commits

1. **05-07-01: Consolidate test-double widenings:** `05deb93`; the ledger records the
   finding hash and passing owner/pair checks.
2. **05-07-02: Repair remaining causes:** separate cause commits are listed in
   `05-FINDINGS.md`. The connectivity RED/GREEN pairs are `fd1368b`/`fee3e72` (030),
   `8fc2983`/`4f09add` (033), and `b0ffac0`/`8cbfe7a` (034).
3. **05-07-03: Independent rounds and gate:** reports R1 through R4, clean round commit
   `448b0d4`, and full-gate ledger commit `e519db3`.

## Check Results

Commands ran with Node v26.12.0 and npm 11.20.0 on clean committed HEAD
`448b0d42f58f35d509f1c5a987165f46caca56b7` before the gate evidence commit.

| Command | Raw exit | Result |
| --- | --- | --- |
| `05-ledger-tracer.mjs --require-clean ACCESSORY` | 0 | `clean=ACCESSORY`, 172 findings, 0 open |
| `05-ledger-tracer.mjs --headers --batch ACCESSORY` | 0 | `ACCESSORIES_HEADERS_OK files=2` |
| `npm run check` | 0 | 2026-10-18T13:48:07Z to 13:49:04Z; 104 scenarios and 1,156 steps passed; 43 direct pairs merged |

The first sandboxed full gate could not bind Cucumber's local fake-cloud listener
(`listen EPERM`). The identical host-permission run above passed.

## TDD Gate Compliance

| Finding | RED evidence commit | GREEN fix commit | Regression |
| --- | --- | --- | --- |
| 030 | `fd1368b` | `fee3e72` | A later live update leaves the last REST connectivity time at poll A |
| 033 | `8fc2983` | `4f09add` | An unresolved-family REST poll supplies a valid connectivity time |
| 034 | `b0ffac0` | `8cbfe7a` | The first recovered REST poll advances connectivity time despite the old degraded flag |

Each evidence commit is the parent of its fix commit and changes only the evidence file.
The current evidence file retains earlier records under `priorEvidence`.

## Decisions and Deviations

- A bounded amendment moved HAP source checks to `hapImportScope.test.ts`. The ACCESSORY
  owner now reads only its own source; the GATES inventory retains ownership of that gate.
- Round 3 stopped under D-03 because its closing count equaled its opening count. The
  maintainer instructed continuation in this thread. The plan records that authorization,
  and D-03 applies normally to later rounds.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next Phase Readiness

Ready for 05-08 GATES. It must review all four unpaired gates, including the transferred
HAP checks. ACC-01 remains Pending until phase verification.

## Self-Check

- All four correction reports and their ledger counters are tracked.
- ACCESSORY has a clean last row, no open findings, conforming headers and a passing full gate.
- Three connectivity RED evidence commits precede their GREEN fixes.

## Self-Check: PASSED
