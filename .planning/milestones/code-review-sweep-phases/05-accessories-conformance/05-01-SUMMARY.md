---
phase: 05-accessories-conformance
plan: "01"
subsystem: testing
tags: [code-review, ledger, tracer, review-protocol, baseline-gate]

requires:
  - phase: 04-runtime-conformance
    provides: the Phase 4 review protocol and ledger shapes this phase adapts
provides:
  - 05-FINDINGS.md ledger with the 24-path inventory, seeds CR-05-CONTROLS-001 to 007, 21 leads and 16 proposed gate N/A rows
  - 05-ledger-tracer.mjs, proven to accept the ledger and to reject planted defects and stop-rule violations
  - 05-REVIEW-PROTOCOL.md, the process contract for every batch plan
  - a fresh full-gate baseline on the committed setup tree
affects: [05-02, 05-03, 05-04, 05-05, 05-06, 05-07, 05-08, 05-09]

actuals:
  tokens: 23640
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Mechanical ledger tracer: table rows split on unescaped pipes and checked by fixed header rows"
    - "Planted-defect proof: scratch ledger copies that each must draw one named violation"

key-files:
  created:
    - .planning/phases/05-accessories-conformance/05-FINDINGS.md
    - .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs
    - .planning/phases/05-accessories-conformance/05-REVIEW-PROTOCOL.md
  modified:
    - .planning/phases/05-accessories-conformance/05-VALIDATION.md

key-decisions:
  - "Base revision is e65382053a264f8003b96b1a4536e061338f07c8, the phase-start state commit on features/code-review-sweep."
  - "The tracer applies the D-03/D-18 STOP conditions to rounds above 10 as well, so an eleventh round draws L4-cap and, when it is also open, L4-stop."
  - "Require-clean violations use the code CLEAN; the plan names no code for them."

patterns-established:
  - "Each later batch records rounds as counter rows that the tracer checks against report frontmatter."

requirements-completed: [ACC-01]

coverage:
  - id: D1
    description: "Findings ledger with the 24-path inventory, the seven pending seed rows, 21 leads and the proposed gate rule applicability"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs"
        status: pass
      - kind: other
        ref: "grep counts: 7 seed rows pending, 24 core inventory rows, 21 leads"
        status: pass
    human_judgment: false
  - id: D2
    description: "Ledger tracer that accepts the ledger and rejects three planted defects and four planted stop-rule violations, and accepts the ten-round clean sequence"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "05-FINDINGS.md ### 05-01 Tracer proof (eight planted copies, raw output)"
        status: pass
      - kind: other
        ref: "node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers (exit 1, 21 named gaps)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Review protocol with fifteen sections, all eighteen decision IDs and the D-18 stop rule"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "heading loop and D18_STOP_RULE_OK verify commands of task 05-01-02"
        status: pass
    human_judgment: true
    rationale: "That the protocol copies D-01 to D-18 without weakening any decision is a reading judgment; 05-09 re-reads it against 05-CONTEXT.md."
  - id: D4
    description: "Fresh full npm run check baseline on the committed setup tree"
    requirement: "ACC-01"
    verification:
      - kind: other
        ref: "npm run check at 97e80a58ba8c271fbf295162d5016a81e7074ee8 (raw exit 0)"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-10-17
status: complete
---

# Phase 5 Plan 01: Wave 0 Ledger, Tracer, Protocol and Baseline Summary

**A checkable findings ledger, a tracer proven both ways on eight planted copies, the batch review
protocol with the ten-round stop rule, and a green full-gate baseline before any batch review**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-17T04:18:03Z (base recorded)
- **Completed:** 2026-10-17T04:31Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `05-FINDINGS.md` records the 24 inventory paths with base line counts and header states, the
  seven Phase 1 seeds as CR-05-CONTROLS-001 to 007 at their current lines, the 21 research leads
  as unaccepted candidates, and 16 proposed D-14/D-17 N/A rows for the four gates.
- `05-ledger-tracer.mjs` checks L1 to L6 (table shape, scope inventory, IDs and dispositions, the
  D-03/D-18 counter arithmetic and stop rule, open sets, report frontmatter scope), plus
  `--require-clean` and the D-01 `--headers` mode. It accepts the ledger, rejects each planted
  defect and stop-rule violation, and names exactly the 21 baseline header gaps.
- `05-REVIEW-PROTOCOL.md` states the scope, rulebook authority, lease model, both dispatch
  contracts, the cause procedure, D-04 evidence order, D-06 tracing, the ten-round stop rule, the
  pause and resume check, preserved behavior, test-double and gate rules, and the prohibitions.
- A fresh `npm run check` passed on the committed setup tree; Wave 0 is marked complete in
  `05-VALIDATION.md`.

## Task Commits

1. **Task 05-01-01: Seed the ledger and its tracer** - `e21d5cd` (docs)
2. **Task 05-01-02: Write the review protocol** - `97e80a5` (docs)
3. **Task 05-01-03: Record the baseline gate and mark Wave 0 complete** - `d51c1b8` (docs)

**Plan metadata:** recorded in the summary commit (docs: record the accessories setup summary).

## Files Created/Modified

- `.planning/phases/05-accessories-conformance/05-FINDINGS.md` - the phase ledger and its coordinator evidence
- `.planning/phases/05-accessories-conformance/05-ledger-tracer.mjs` - the mechanical ledger and header check
- `.planning/phases/05-accessories-conformance/05-REVIEW-PROTOCOL.md` - the process contract every batch follows
- `.planning/phases/05-accessories-conformance/05-VALIDATION.md` - Wave 0 rows and requirements marked green

## Check Results

All commands ran from the repository root with `export PATH="/opt/homebrew/opt/node/bin:$PATH"`,
Node v26.12.0, npm 11.20.0.

| Command | Raw exit | Result |
| --- | --- | --- |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs` (each committed state) | 0 | `ACCESSORIES_LEDGER_TRACER_OK inventory=24 findings=7 open=0 rounds=0` |
| `... --headers --paths src/runtime/clock.ts test/accessories/reconciliation.test.ts` | 0 | `ACCESSORIES_HEADERS_OK files=2` |
| `... --headers --paths src/accessories/controls.ts` | 1 | one `HEADER_VIOLATION` naming controls.ts |
| `... --headers` | 1 | 21 `HEADER_VIOLATION` lines; reconciliation pair and controls.test.ts not named |
| Eight planted copies with `--ledger` | 1 each | each named violation present; ten-round clean copy has no L4 line (see ledger) |
| Protocol heading loop (task 05-01-02 verify 1) | 0 | all fifteen headings present |
| Protocol D-18 check (task 05-01-02 verify 2) | 0 | `D18_STOP_RULE_OK` |
| `npm run check` at `97e80a5` | 0 | six static checks passed; 104 scenarios; 1156 steps; 43 pairs |
| `SKIP=npm-check pre-commit run --files <paths>` before each commit | 0 | no file modified |

## TDD Gate Compliance

No production code changed; no RED evidence. Task 05-01-01 is `tdd="true"`: its failing cases are
the eight planted ledger copies and the header control on `src/accessories/controls.ts`, each of
which exits 1 with its named violation, and its passing cases are the real ledger and the two
conforming headers. GSD's evaluation-scope RED search finds commits by a plan ID in their titles,
which this project's commit rules forbid, so it cannot see this plan's commits; the ledger's
`### 05-01` evidence is the record instead.

## Decisions Made

- The base revision is the phase-start state commit `e653820`, because `git status --porcelain`
  had to be empty when the base was recorded.
- The tracer prints require-clean violations with the code `CLEAN`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Untracked GSD session lock broke the empty-tree checks**
- **Found during:** Task 05-01-01 (recording the Wave 0 base)
- **Issue:** `state.begin-phase` writes `.planning/milestone.lock`, which is neither tracked nor
  ignored, so `git status --porcelain` could never be empty as the plan requires.
- **Fix:** added `.planning/milestone.lock` to the local `.git/info/exclude` (shared by this
  repository's worktrees, never committed). No tracked file changed.
- **Files modified:** none in the repository
- **Verification:** `git status --porcelain` printed nothing before the base was recorded and after
  each commit.
- **Committed in:** not committed (local Git configuration)

**2. [Rule 2 - Missing critical] Protocol named only 15 of the 18 decision IDs**
- **Found during:** Task 05-01-02 acceptance check
- **Issue:** the first draft cited D-02, D-08 and D-09 only through the "D-01 to D-18" range.
- **Fix:** stated D-08 and D-09 under Scope and authority and D-02 under Ledger, reports and tracer.
- **Files modified:** `.planning/phases/05-accessories-conformance/05-REVIEW-PROTOCOL.md`
- **Verification:** the decision-ID count prints 18.
- **Committed in:** `97e80a5`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** both were needed to meet the plan's own checks; no scope change.

## Issues Encountered

- `05-RESEARCH.md` copies counts measured at `1bcaddd` into lead S-05-09; the ledger row says so.
  The phase-dir `.continue-here.md` is the pre-discussion handoff and is stale; this plan used only
  its anti-pattern table.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 05-02 (DECLARATIONS batch): the ledger, tracer and protocol are committed and the
baseline gate is green at `97e80a5`.

## Self-Check

- Files exist: `05-FINDINGS.md`, `05-ledger-tracer.mjs`, `05-REVIEW-PROTOCOL.md` (checked with `[ -f ]`).
- Commits exist on this branch: `e21d5cd`, `97e80a5`, `d51c1b8`.
- Acceptance criteria of all three tasks re-run: PASS.

## Self-Check: PASSED
