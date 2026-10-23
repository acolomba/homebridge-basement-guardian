---
phase: 05-accessories-conformance
plan: "02"
subsystem: testing
tags: [code-review, accessories, declarations, hap, unit-tests]

requires:
  - phase: 05-accessories-conformance
    provides: 05-01 ledger, tracer, review protocol and baseline gate
provides:
  - DECLARATIONS batch (alarmMute, services, customCharacteristics, customServices pairs) reviewed in full and clean at correction round 4
  - pinned UUID literals and whole-value domains for every vendor characteristic and service
  - an alarm-mute source scan with a floor, a planted positive and any-case mute-name matching
  - D-01 headers on all eight batch files
affects: [05-03, 05-04, 05-08, 05-09]

actuals:
  tokens: 69030
  tasks: 3
  commits: 26

tech-stack:
  added: []
  patterns:
    - "Hand-copied published identifiers pinned per row and as one name-to-UUID map"
    - "A test-local null-valued base characteristic so a declaration's own default is observable, as under real HAP"

key-files:
  created:
    - .planning/phases/05-accessories-conformance/05-DECLARATIONS-REVIEW.md
    - .planning/phases/05-accessories-conformance/05-DECLARATIONS-REVIEW-R1.md
    - .planning/phases/05-accessories-conformance/05-DECLARATIONS-REVIEW-R2.md
    - .planning/phases/05-accessories-conformance/05-DECLARATIONS-REVIEW-R3.md
    - .planning/phases/05-accessories-conformance/05-DECLARATIONS-REVIEW-R4.md
  modified:
    - src/accessories/alarmMute.ts
    - test/accessories/alarmMute.test.ts
    - src/accessories/services.ts
    - test/accessories/services.test.ts
    - src/accessories/customCharacteristics.ts
    - test/accessories/customCharacteristics.test.ts
    - src/accessories/customServices.ts
    - test/accessories/customServices.test.ts
    - .planning/phases/05-accessories-conformance/05-FINDINGS.md

key-decisions:
  - "CR-05-DECLARATIONS-004 was fixed inside the owner test (a null-valued base characteristic in the one widening helper) rather than in features/lib/hap.ts (D-12); the stand-in/real-HAP default disagreement went to GATES as lead S-05-22 (D-16)."
  - "The maintainer resolved the round-2 D-03 stop (no progress, open 1 to 2) with 'Resolve and continue'; the 026 repair closed the whole naming class of the alarm-mute scan."
  - "Lead S-05-21 (Pick alias) was rejected: it picks from homebridge's external CharacteristicProps, and both alternatives are worse."

patterns-established:
  - "A source-text gate keeps a floor and a planted positive, and each BLOCKER repair carries a restored assertion control recorded in the round report."

requirements-completed: [ACC-01]

coverage:
  - id: D1
    description: "All eight DECLARATIONS files reviewed in full; every finding fixed in its own commit and confirmed by an independent correction round"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --require-clean DECLARATIONS"
        status: pass
    human_judgment: false
  - id: D2
    description: "The four pairs pass alone at 100% direct coverage and all eight files carry the D-01 header"
    requirement: "ACC-01"
    verification:
      - kind: unit
        ref: "npm run test:coverage:direct -- <each of the four pairs>"
        status: pass
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch DECLARATIONS"
        status: pass
    human_judgment: false
  - id: D3
    description: "The combined tree passes the full gate after the wave"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "npm run check at b90a65cc1cd82bdc92cdd226c8961d38bce9c98b (raw exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The maintainer's resolution of the round-2 D-03 stop and the reasoned rejections of further scan-evasion forms"
    requirement: "ACC-01"
    verification: []
    human_judgment: true
    rationale: "Whether the alarm-mute scan's documented scope is the right line is a design judgment the maintainer already made once at the round-2 stop; phase verification re-reads it."

duration: 2h 45m
completed: 2026-10-17
status: complete
---

# Phase 5 Plan 02: DECLARATIONS Batch Summary

**The four leaf declaration pairs are clean at correction round 4: 28 findings fixed, including 7
blocking test weaknesses that now pin every published UUID, every value domain, the construction
defaults and the alarm-mute declaration scope**

## Performance

- **Duration:** 2h 45m
- **Started:** 2026-10-17T11:21:23Z (resume check)
- **Completed:** 2026-10-17T14:05:45Z
- **Tasks:** 3
- **Files modified:** 8 source and test files, the ledger and five round reports

## Accomplishments

- The round-0 review read all eight files at `053599a` and raised 24 findings (5 BLOCKER, 19
  WARNING); correction rounds 1 to 3 raised 4 more (2 BLOCKER, 2 WARNING); round 4 was clean.
- No case can now pass with a swapped, regenerated or per-process UUID: all 16 characteristic and
  4 service literals are hand-copied into their owner tests, per row and as one map.
- Every characteristic's value domain is compared as one whole value, so a clamping domain such as
  `maxValue: 255` on the activation count fails.
- The construction-default cases run over a base characteristic that leaves `value` null, as real
  HAP does, so deleting the module's own default assignment fails them.
- The alarm-mute scan has a module floor (43), a planted positive (the owning module) and matches
  any mute-named value declaration in any case.
- Comments that described absent code, release history or the wrong data source were restated as
  present-tense facts; all eight files carry the D-01 header.

## Task Commits

1. **Task 05-02-01: Review and land the alarm-mute header cause** - review `0d996f7`, fix `f7b6929`
2. **Task 05-02-02: Repair every round-0 cause** - `bf0f76d`, `4458330`, `0dcd7c2`, `644df7d`,
   `a9d9c4a`, `dfcd547`, `ef0db0a`, `5df1dff`, `c0a7b76`, `b8cbe8c`, `8d4ed4d`, `69c7801`,
   `9cedd4d`, `960f812`, `7bb76e6`, `9ef87cb`, `637da57`, `9fba016`, `6472fa9`, `7cb0069`, `96d5b19`
3. **Task 05-02-03: Correction rounds and gate** - rounds `479ac0d`, `8175302`, `81a4adb`,
   `b90a65c`; fixes `00f7bd6`, `ae9647d`, `c88bcca`, `bd39257`; closure `838fe8b`, `016cea6`

Ledger commits after each dispatch: `ee77bc2`, `cad9bda`, `c4def61`, `b26521e`, `3baea31`,
`b3635f5`, `6a769c5`, `d9ad727`, `935b290`, `6fcd1c3`.

## Files Created/Modified

- `src/accessories/{alarmMute,services,customCharacteristics,customServices}.ts` - D-01 headers and corrected comments only
- `test/accessories/{alarmMute,services,customCharacteristics,customServices}.test.ts` - headers, pinned literals, whole-value domains, a null-valued base, the mute scan, phase markers, names and types
- `.planning/phases/05-accessories-conformance/05-DECLARATIONS-REVIEW*.md` - the round-0 report and correction rounds 1 to 4
- `.planning/phases/05-accessories-conformance/05-FINDINGS.md` - DECLARATIONS rows, counters and evidence

## Check Results

All commands ran from the repository root with `export PATH="/opt/homebrew/opt/node/bin:$PATH"`,
Node v26.12.0, npm 11.20.0.

| Command | Raw exit | Result |
| --- | --- | --- |
| `05-ledger-tracer.mjs` after every ledger change | 0 | final: `inventory=24 findings=35 open=0 rounds=5` |
| `05-ledger-tracer.mjs --headers --batch DECLARATIONS` | 0 | `ACCESSORIES_HEADERS_OK files=8` |
| `05-ledger-tracer.mjs --require-clean DECLARATIONS` | 0 | `clean=DECLARATIONS` |
| `npm run build:test` and the four owners (after the round-0 pass) | 0 | 87 tests, 0 suites, 0 failures |
| `npm run test:coverage:direct --` each of the four pairs | 0 | each pair 100% alone |
| `npm run check` at `b90a65c` | 0 | six static checks passed; 104 scenarios; 1156 steps; 43 pairs |
| Each fixer's guard, ESLint and `fallow audit --base 053599a` | 0 | verdict pass on every cause |
| Each round reviewer's typecheck, ESLint, owners and pairs | 0 | recorded in each round report |

## TDD Gate Compliance

No genuine bug confirmed; no RED evidence. Every BLOCKER was a test that a plausible wrong
implementation passed, so each repair carried a restored assertion control instead (recorded in
the round reports): swapped characteristic and service literals, a clamping domain, the deleted
default assignment, and planted mute declarations in five forms. GSD's subject-based TDD check
cannot see domain-scoped commits; this record replaces it.

## Decisions Made

- 004 was repaired in the owner test, without touching `features/lib/hap.ts` (D-12); the
  stand-in/real-HAP default disagreement is lead S-05-22 for GATES (D-16).
- The maintainer resolved the round-2 stop with "Resolve and continue".
- S-05-21 was rejected with a rule reason.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Closure note miscounted severities**
- **Found during:** Task 05-02-03 (closure record)
- **Issue:** the note said 6 BLOCKER and 22 WARNING; the ledger rows hold 7 and 21.
- **Fix:** corrected the note.
- **Files modified:** `.planning/phases/05-accessories-conformance/05-FINDINGS.md`
- **Verification:** row counts by severity; tracer exit 0.
- **Committed in:** `016cea6`

---

**Total deviations:** 1 auto-fixed (record accuracy)
**Impact on plan:** none on the code; the D-03 stop at round 2 was handled by the protocol, not as a deviation.

## Issues Encountered

- Round 2 hit `STOP: no progress` (open 1 to 2: CR-05-DECLARATIONS-026 and 027). The stop row
  stayed uncommitted until the maintainer chose "Resolve and continue"; the cell now reads
  `STOP: no progress; resolved by maintainer`.
- The project's lint preset rejects `ReadonlyArray<...>`, so two type findings used named element
  interfaces, which the rules also allow.
- Out-of-scope observations for later phases: four `features/lib/hap.ts` items plus parameter
  properties at lines 116 and 295-299 (Phase 7), and `test/configSchema.test.ts:175-176` (Phase 6).

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 05-03 (CATALOGUE batch). Lead S-05-22 waits for 05-08 (GATES).

## Self-Check

- Review reports R0 to R4 exist and are tracked; all 26 fix commits are ancestors of HEAD.
- `--require-clean DECLARATIONS` and `--headers --batch DECLARATIONS` exit 0.
- `git diff 053599a..HEAD -- src/accessories/customCharacteristics.ts src/accessories/customServices.ts` changes no `_UUID = '` line; `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE = true` appears once.

## Self-Check: PASSED
