---
phase: 03-device-and-persistence-conformance
plan: "07"
subsystem: testing
tags: [typescript, persistence, compiler-contracts, support-review]
requires:
  - phase: 03-device-and-persistence-conformance
    provides: Complete SUPPORT initial inventory and applied event, health, HALO and registry remedies
provides:
  - Persistence headers and meaningful compiler contracts without source-prose runtime scaffolding
  - Accurate record recovery and scoped identifier privacy documentation
  - Complete independent SUPPORT correction verdict with zero open IDs in round 2
affects: [device, persistence, accessories, platform, phase-verification]
tech-stack:
  added: []
  patterns: [Declaration-only selector acceptance with real runtime-owner compatibility evidence]
key-files:
  created:
    - .planning/phases/03-device-and-persistence-conformance/03-07-SUMMARY.md
  modified:
    - src/persistence/accessoryContext.ts
    - test/persistence/accessoryContext.test.ts
    - .planning/phases/03-device-and-persistence-conformance/03-SUPPORT-REVIEW.md
key-decisions:
  - Preserve writable persisted records and required present-undefined fields without changing declarations
  - Retain the approved deviceId context/log treatment and its unconfirmed opaque-key assumption
  - Keep one SUPPORT counter across all slices and both complete correction rounds
requirements-completed: []
requirements-pending: [DEV-01]
actuals:
  tokens: 8366
  tasks: 3
  commits: 5
plan_head_before: bd096af2cd6f1cce272990375864b4133c974cd3
plan_head_after: 253eb82fa9efc7bee4683f988709ef66e3388641
duration: 32min
completed: 2026-10-14
status: complete
---

# Phase 3 Plan 7: Persistence and SUPPORT Conformance Summary

**Persistence keeps its mutable storage contract, replaces keyword scans with compiler contracts, and closes the complete SUPPORT review in round 2.**

## Performance

- Dispatch sentinel timestamp: 2026-10-14T19:47:45.852Z.
- Execution record prepared: 2026-10-14T20:19Z.
- Tasks: 3/3 worker tasks complete.
- Three paths changed before this summary. This summary is the fourth path.
- Actual tokens use the realized pre-summary diff: 33,463 characters / 4, rounded up to 8,366.
- Actual commits use the persisted plan ledger: five commits through 253eb82f. The summary metadata commit is separate.

## Accomplishments

Persistence source and owner now have the approved complete headers. The owner
removes source reading, private docblock parsing and four keyword runtime cases.
It retains the original four negatives and meaningful positive shapes. Its
15 compiler negatives and nine assignments protect required fields, numeric
types, genuine absence, privacy boundaries and writable records.

The source documentation describes actual first-run seeding, readable-record
resumption and unreadable-record recovery. It states the approved identifier
treatment and its limit without granting a new privacy permission. Declaration
tokens and compiler-erased JavaScript remain unchanged.

Two independent full correction reviews cover all ten SUPPORT files and their
complete headers. They inspect actual consumer bodies, native evidence and Git
objects. The final verdict has zero open IDs, with the original counter intact.
The coordinator owns the fresh combined gate after this terminal handoff.

## Task Commits

| Task / cause | Commit | Actual paths |
| --- | --- | --- |
| 03-07-01 / 001 persistence headers | 970119b2c79e4d119314a36c1dd94b7662e32af5 | src/persistence/accessoryContext.ts and mirrored owner |
| 03-07-02 / 009 compiler contracts | d5c7ea6c65ab896f502629a10fa16340d47beb3c | test/persistence/accessoryContext.test.ts |
| Original 03-07-02 / 011 record-history prose | 326b92418e3f33cb5d5d814de6f2a3692f5a202e | src/persistence/accessoryContext.ts |
| Original 03-07-02 / 012 privacy prose | d262943b0749a094c3e48488bbd952b26f103adf | src/persistence/accessoryContext.ts |
| 03-07-03 / complete review record | 253eb82fa9efc7bee4683f988709ef66e3388641 | .planning/phases/03-device-and-persistence-conformance/03-SUPPORT-REVIEW.md |

Each introducing commit passed its exact clean pre-step and ordinary foreground
hooks. Code causes also passed fresh owner/direct checks and baseline audits.
The report-only commit's build-input hook correctly reported no files to check.
No commit bypass, amendment, history rewrite or tracked deletion occurred.

## Check Results

Runtime: Node v26.11.1, npm 11.20.0, Fallow 3.27.0. Inputs are synthetic and
offline. Native captures retain full stdout/stderr, arguments, raw exits, UTC
times, revisions/blobs, exact dirty/staged diffs and untracked bytes.

| Command / capture | Checked input | Raw exit / result |
| --- | --- | --- |
| npm run build:test and initial persistence/pumpRecords owner | bd096af2 | 0, initial tracer passed 33 real pump cases and four original prose cases |
| npm run build:test, prose012-build | 326b9241 with exact pending privacy patch | 0, 20:08:54.936–57.864 UTC |
| node --test --test-reporter=tap dist-test/test/persistence/accessoryContext.test.js dist-test/test/accessories/pumpRecords.test.js, prose012-owner | Same exact source bytes later committed as d262943b | 0, 20:08:58.616–58.879 UTC, 33 real pump cases plus one context file-load sentinel |
| npm run test:coverage:direct -- src/persistence/accessoryContext.ts test/persistence/accessoryContext.test.ts, prose012-direct | Same exact source bytes later committed as d262943b | 0, declaration-only acceptance, 20:08:59.648–20:09:03.275 UTC |
| npm run build:test, finalprose-build | Clean d262943b | 0, 20:09:52.183–55.007 UTC |
| Two selected real platform persistence cases, finalprose-platform | Clean d262943b after fresh build | 0, 2/2 passed, 20:09:55.754–56.145 UTC |
| Complete five-pair SUPPORT selector, support-direct-final | Clean d262943b | 0, 20:10:41.170–44.713 UTC, strict build plus isolated pairs |
| Fallow report audit against 7cfedb24, report-audit | d262943b plus exact report-only diff | 0, verdict pass |
| Exact report pre-step and ordinary commit, report-pre-step/report-commit | Report-only change at 253eb82f | 0/0, no pre-step input changes |

The complete selector command is npm run test:coverage:direct --
src/device/events.ts test/device/events.test.ts src/device/health.ts
test/device/health.test.ts src/device/halo.ts test/device/halo.test.ts
src/device/registry.ts test/device/registry.test.ts
src/persistence/accessoryContext.ts test/persistence/accessoryContext.test.ts.

Events, health and context have declaration-only selector outcomes. Persistence
has zero authored runtime cases. Node's file-load sentinel is not an authored
behavior case or numerical runtime coverage. Native unchanged HALO LCOV has
6/6 lines, 0/0 functions and 1/1 branches. Registry has 53/53 lines, 3/3
functions and 9/9 branches. The current selector passes both executable pairs
and all three declaration-only pairs. Selected runs do not refresh merged
coverage/direct.lcov.

Native index: /private/tmp/persistence-fixer-index.json. It held 79 captures at
the final independent review. Later record-only checks append to it. The
finalprose-evidence-validation-2 record reports PROSE_EVIDENCE_OK. It verifies
actual commit paths, ancestry and audit -> pre-step -> stage -> hook ordering.
The preservation records and both reviewers confirm unchanged declarations
and emitted runtime output. Prior event/health and HALO/registry native indexes
held 60 and 80 captures when independently inspected.

## Exact Consumers and Preserved Contracts

Six pre-edit exact Fallow impacts completed with exit 0 and complete status.
PumpObservation, ActivationWatermarks and AccessoryContext each ran separately
under tsconfig.json and tsconfig.test.json. Actual pumpRecords mutations and
platform persistence callbacks were read. Guard reported no configured zones
or rule packs, which supplies no measured boundary-compliance claim.

Required present-undefined activation and watermark fields stay required.
First-run records and unearned labels stay optional. Stored observation and
activation times stay milliseconds. Device watermarks stay Unix seconds.
Real reducer cases cover seeding, resumption, timestamp conversion, de-duplication,
classification and whole-record invalid recovery. The platform probes cover
registration and the per-accessory persist callback. This evidence is bounded
compatibility work, not a completed later subsystem sweep.

## Complete SUPPORT Review

Fresh typed fixers used omitted empty models and resolved high effort.
Independent typed reviewers read the full inventory, headers, rulebooks and
actual consumers. Foreground execution waited for each named terminal response.
No executor read, edit, build or Git operation overlapped a child.

| Review | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial round 0 | 10 | 0 | 0 | 0 | 0 | 10 |
| Full correction 1, d5c7ea6c | 10 | 10 | 0 | 2 | 0 | 2 |
| Full correction 2, d262943b | 2 | 2 | 0 | 0 | 0 | 0 |

Round 1 reviewer: /root/phase3_persistence/support_correction_one. Its formula
is 10 - 10 - 0 + 2 + 0 = 2. Original IDs 001–010 are fixed. New WARNING
IDs 011/012 identify source documentation causes owned by original 03-07-02.
Both received separate minimum commits without resetting the counter.

Round 2 reviewer: /root/phase3_persistence/support_correction_two. Its formula
is 2 - 2 - 0 + 0 + 0 = 0. Both opening IDs are fixed. All original IDs remain
fixed, and no concrete new or reopened finding exists. D-03 does not trigger:
the first count reduced, the second closed, and neither reached round four.

## Decisions Made

No new product decision was required. The existing plan authorized accurate
source documentation after independent classification. The approved scoped
deviceId treatment remains distinct from public and planning sanitization.
No broader privacy permission was inferred from source prose.

## Deviations from Plan

None in source scope. Correction round 1 added two documentation causes within
the original persistence task's explicit release/privacy checks. They retain
separate IDs, atomic commits and the continuous counter. No genuine runtime
bug was established, so no RED JSON or artificial failure was created.

The header audit's sandbox attempt exited 2 before its authorized retry passed.
The 011 staging attempt exited 128 before its authorized retry succeeded.
Both original attempts remain in native captures. Neither supplied behavioral
failure evidence. Historical WINDOWS 46/47 remain OPEN and unwaived.

## Known Stubs

None. No conditional seed, serializer, migration, runtime wrapper, skipped
test or speculative helper was introduced.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.

## Remaining Coordinator Work

The coordinator owns a fresh full npm run check after this terminal handoff.
This verifier is pending, not waived or represented by focused checks. Earlier
full gates are not reused across the changed test inputs. The coordinator also
owns shared STATE/ROADMAP/REQUIREMENTS/FINDINGS/WINDOWS records and advancement.
Those records were untouched by this worker.

DEV-01 remains pending across all eight phase plans. E-03-01 taxonomy and
P-03-01/P-03-02 safety/truthful-completion human judgments remain unresolved.
This SUPPORT work does not independently confirm the historical Gemini 247/247
claim. Hardware, live vendor behavior and release gates remain outside scope.

## Self-Check: PASSED

All declared current source, owner and report paths exist. The five recorded
commits are ancestors of HEAD and have their declared paths. The persisted
ledger count is five, with exact base and head recorded in frontmatter.
No new untracked input or tracked deletion remains. All child resources are
released. The coordinator handoff retains the pending combined gate explicitly.
