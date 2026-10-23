---
phase: 05-accessories-conformance
plan: "06"
subsystem: accessories
tags: [code-review, accessories, controls, unit-tests, d-04]

requires:
  - phase: 05-accessories-conformance
    provides: 05-01 ledger and review protocol; DECLARATIONS, CATALOGUE, CONTROLS and RECORDS batches reviewed
provides:
  - ACCESSORY round-0 review of the basementGuardian source and owner pair
  - pair headers and seven source-side causes repaired, including three behavior bugs with committed RED evidence
  - full wave gate on the committed tree and the open batch handed to 05-07
affects: [05-07, 05-08, 05-09, 06-platform, 07-features]

actuals:
  tokens: 45150
  tasks: 2
  commits: 25

tech-stack:
  added: []
  patterns:
    - "Keep the pre-press HAP value so an unconfirmed request can restore it after state withdrawal"

key-files:
  created:
    - .planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md
    - .planning/phases/05-accessories-conformance/05-BASEMENT-GUARDIAN-RED-EVIDENCE.json
  modified:
    - src/accessories/basementGuardian.ts
    - src/accessories/controls.ts
    - test/accessories/basementGuardian.test.ts
    - test/accessories/controls.test.ts
    - features/step_definitions/accessory.steps.ts
    - .planning/phases/05-accessories-conformance/05-FINDINGS.md

key-decisions:
  - "The maintainer chose to fix CR-05-ACCESSORY-001 now through a bounded edit to the closed controls module."
  - "The ACCESSORY counter remains at round 0; 05-07 owns the test-side causes and all correction rounds."

patterns-established:
  - "A source-side bug with a consumer in a later batch gets a declared bounded amendment before the consumer edit."

requirements-completed: [ACC-01]

coverage:
  - id: D1
    description: "The accessory pair received a full round-0 review and seven source-side repairs"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "05-ACCESSORY-REVIEW.md and 05-FINDINGS.md; 05-ledger-tracer.mjs exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Three confirmed behavior bugs have committed RED evidence preceding their GREEN fixes"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "check tdd-red-evidence on 05-BASEMENT-GUARDIAN-RED-EVIDENCE.json; owner and direct pair tests"
        status: pass
    human_judgment: false
  - id: D3
    description: "The pair headers and combined tree passed their required gates"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "05-ledger-tracer.mjs --headers --batch ACCESSORY; npm run check at 37259fc636a7c80cf4ff2557e68b750d7b72615d"
        status: pass
    human_judgment: false
  - id: D4
    description: "The initial ACCESSORY findings await independent correction review"
    requirement: "ACC-01"
    verification: []
    human_judgment: true
    rationale: "05-07 must review the test-side causes and the repairs before the batch can close."

duration: 1h 25m
completed: 2026-10-18
status: complete
---

# Phase 5 Plan 06: ACCESSORY Source Review Summary

**The accessory pair has a full initial review and seven source-side repairs. Expired control
requests restore the last reported value, and diagnostics name only conditions they can support.**

## Performance

- **Duration:** about 1h 25m of active resumed work
- **Started:** 2026-10-18T10:33:22Z (resume check)
- **Completed:** 2026-10-18T11:58Z
- **Tasks:** 2
- **Files modified:** the accessory source and test pair, controls source and test, one Cucumber
  step definition, the review report, the ledger and the RED evidence file

## Accomplishments

- Round 0 reviewed all 1,066 source lines and 3,456 test lines at batch base
  `9cb164b1299249c2d2083ea81677c83e28e66916`. It accepted 29 findings: 7 BLOCKER and
  22 WARNING.
- Fixed the seven causes assigned to 05-06: 001, 002, 003, 009, 011, 012 and 028. The three
  behavior bugs each have a committed RED result before their fix.
- The ACCESSORY ledger still has exactly one round-0 counter row. All findings retain `open`
  until 05-07 reviews the repairs and test-side causes.

## Task Commits

1. **05-06-01: Review and pair headers:** review `79108d4`, headers `94d3d4f`.
2. **05-06-02: Source-side causes and gate:** comments `a6fa336`, `13e0522`; type
   `2a5545f`; RED/GREEN `b025898`/`7bc2704` (002), `e8af5d2`/`667601c` (003),
   `41b2ba7`/`a6cbebf` (001); gate ledger `fe60c89`. The ledger records the intermediate
   amendment and repair-history commits.

## Check Results

Commands ran from the repository root with Node v26.12.0 and npm 11.20.0.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run build:test` | 0 | 2026-10-18T11:54:49Z to 11:54:52Z |
| `node --test dist-test/test/accessories/basementGuardian.test.js` | 0 | 160 tests passed |
| `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | 0 | pair at 100% |
| `05-ledger-tracer.mjs` | 0 | `inventory=27 findings=167 open=29 rounds=27` |
| `05-ledger-tracer.mjs --headers --batch ACCESSORY` | 0 | `ACCESSORIES_HEADERS_OK files=2` |
| `check tdd-red-evidence` | 0 | `RED_EVIDENCE_OK` |
| `npm run check` on `37259fc636a7c80cf4ff2557e68b750d7b72615d` | 0 | 2026-10-18T11:55:47Z to 11:56:44Z; 104 scenarios, 1156 steps, 43 direct pairs |

The first sandboxed `npm run check` exited 1 because package inspection could not access npm's
home cache. The identical host-resource rerun at the same HEAD exited 0.

## TDD Gate Compliance

| Finding | RED evidence commit | GREEN fix commit | Regression |
| --- | --- | --- | --- |
| 002 | `b025898` | `7bc27047c0dac3369b2e5ff76f025339c1297b63` | restored control refusal names its real cause |
| 003 | `e8af5d2` | `667601c4ba3433061b13864b0801aa10a71efa76` | degraded warning allows valid metadata to refresh |
| 001 | `41b2ba7` | `a6cbebfacdf8bf0928b2ca7fe0f30cc5cd9811f4` | expired requests restore the reported self-test value under three withdrawals |

Each evidence commit preceded its fix, left production unchanged, and recorded the named test's
failure. The current evidence file retains prior records through `priorEvidence`.

## Decisions and Deviations

- The maintainer approved fixing 001 now. Two committed plan amendments bounded the edit to
  `src/accessories/controls.ts` and one direct controls test.
- A committed amendment bounded the 003 warning's Cucumber consumer change to
  `features/step_definitions/accessory.steps.ts`.
- The 028 local type alias remained after a Fallow `private_type_leaks` check rejected a simple
  export removal; the exported method now inlines the same union.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next Phase Readiness

Ready for 05-07. Its 22 assigned open IDs are CR-05-ACCESSORY-004 through 008, 010,
013 through 027, and 029. It reviews the seven repaired source-side IDs and conducts every
ACCESSORY correction round with the same batch counter. ACC-01 remains Pending.

## Self-Check

- The round-0 report, ledger, RED evidence file and seven source-side fix commits are tracked.
- Every cited RED evidence commit is an ancestor of its GREEN fix commit.
- The ACCESSORY header tracer, ledger tracer and full gate exit 0.
- No ACCESSORY correction round or clean-batch claim appears in this plan.

## Self-Check: PASSED
