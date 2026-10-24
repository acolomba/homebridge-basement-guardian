---
phase: 02-cloud-conformance
plan: "01"
subsystem: auth
tags: [auth, conformance, cache, regression, cancellation]
requires:
  - phase: 01-known-findings-and-loop-proof
    provides: Independent caller cancellation and exclusive cache-write proofs
provides:
  - Finite token expiry and terminal credential refusal through failed cache cleanup
  - Offline auth tests with complete independent request, token, cache, and error observations
  - Private stable cache filename with four compatible independent consumers
  - Clean independent full-auth review after sixteen atomic cause repairs
affects: [cloud, review-process]
tech-stack:
  added: []
  patterns: [explicit offline transport, evidence-first regression, independent cache bytes]
key-files:
  created:
    - .planning/phases/02-cloud-conformance/02-AUTH-REVIEW.md
    - .planning/phases/02-cloud-conformance/02-AUTH-RED-EVIDENCE.json
  modified:
    - src/cloud/auth.ts
    - test/cloud/auth.test.ts
    - test/platform.test.ts
    - features/support/steps/authentication.ts
    - features/real-pump/support/realWorld.ts
key-decisions:
  - Kept all caller cancellation, grant ownership, deadlines, and cache-format contracts
  - Made the test-only filename private while retaining independent filesystem expectations
  - Followed approved complete-patch planning-evidence commits before both genuine bug fixes
requirements-completed: [CLOUD-01]
actuals:
  tokens: 37712
  tasks: 3
  commits: 19
plan_head_before: bf9b4c9ff4a1d043c1f53bb4023c2b302c0ab455
plan_head_after: 14c740371e8a35f8ade64b7f890c0f88269e7f03
coverage:
  - id: D1
    description: Auth rejects invalid expiry and preserves terminal refusal through cleanup failure
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/auth.test.ts#authenticates again when the cache file carries an infinite expiry
        status: pass
      - kind: unit
        ref: test/cloud/auth.test.ts#D-13 preserves the terminal refusal when the cache path is a directory
        status: pass
    human_judgment: false
  - id: D2
    description: Complete offline request, token, and cache observations preserve cancellation ownership
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/auth.test.ts#sends the password-realm grant the vendor tenant expects
        status: pass
      - kind: unit
        ref: test/cloud/auth.test.ts#keeps the joined caller grant alive when the first caller aborts
        status: pass
      - kind: other
        ref: 02-AUTH-REVIEW.md#Review rounds
        status: pass
    human_judgment: false
  - id: D3
    description: Four consumers preserve the private cache filename and resolve the real profile offline
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/platform.test.ts#AUTH-02 caches the granted token under the Homebridge storage directory
        status: pass
      - kind: other
        ref: npm exec --no -- cucumber-js --profile real --dry-run
        status: pass
    human_judgment: false
duration: 74min
started: "2026-10-13T22:40:07Z"
completed: "2026-10-13"
status: complete
---

# Phase 2 Plan 1: Auth Conformance Summary

**Auth rejects unusable expiry, preserves terminal refusal through failed cache cleanup, and has complete offline contract tests with a clean independent review.**

## Performance

- Recorded start: 2026-10-13T22:40:07Z.
- Completed: 2026-10-13; approximately 74 minutes through records closeout.
- Tasks: 3/3. Changed implementation files: 5. New batch records: 3 including this summary.
- Isolation: none in the existing features/code-review-sweep checkout. No branch or worktree was created or switched.
- Actual tokens use chars/4 over the realized owned-file diff. Nineteen commits were measured from the persisted plan ledger through code HEAD 14c7403; the final records commit follows that snapshot.

## Accomplishments

The public tracer now compares the delivered token, complete independently expected
cache bytes, and the whole HTTP method/URL/headers/body. Each case injects an
offline transport; the default fails closed with a fixed synthetic error. Existing
shared-waiter, final-caller cancellation, settlement-slot, no-retry, and occupied
temporary-file tests remain active. Caller-owned abort reasons are checked by
identity, and errors by class and structured fields.

TOKEN_CACHE_FILENAME is private. Four exact consumers independently retain the
unchanged .basement-guardian-token.json filesystem contract. Three external files
received separate header-only changes. FailurePolicy uses true optional members
and deletes the transient member on recovery. Conformance causes use separate
passing-hook commits.

Two genuine defects are fixed. Nonpositive/non-finite TTL and non-finite derived or
stored expiry cannot produce a usable token. Failed nonrecursive cache cleanup
cannot mask terminal credential refusal; the client stays halted, unexpected
directory contents survive, and the diagnostic contains no filesystem details.

## Task Commits

| Task / cause | Full commit |
| --- | --- |
| 1 / expiry RED evidence | f8b8635a4f632a78a7ea023412595230f9ea31ed |
| 1 / expiry cause and active regression | b42d3688ddcabe7aacfb8e8d5e16bc499142e5d7 |
| 1 / explicit HTTP injection | b2b2e015b6f4fd32c73b7d50fcb6c746e5b3b365 |
| 1 / complete request | 3b00c916f2b3212c5893377cef5c836c630cf479 |
| 1 / complete privacy bytes | dbf8db024c08668c28846f912575eced0cc99e12 |
| 1 / complete cache byte observations | ce3882cf82bc64473b242ebadc8d80ef0f83e805 |
| 1 / delivered-token observations | 08956910cde762bb13250885479ab0a845223ae0 |
| 2 / separate conditional consumer headers | eb5b0a0a41c1e010b26436d3dc40c9b557ed55ee |
| 2 / private filename and four consumers | 516e0becf54af99c544f177eec305d778323521d |
| 3 / optional policy | 83cb2a2592098b87dc684f7ec8162027b5d81804 |
| 3 / suppression reason | fada024dbd230af6ba18bfbf43a996c2dcde7ba9 |
| 3 / error classes and fields | 323432ea562bdd787db7b842a044a0879fd4feb4 |
| 3 / abort-reason identity | 112e5be089402fa058afe6b54bb8da48d23f62d6 |
| 3 / AAA sections | 5b6cdc72f8e1b0713016d1a9efcd28f9e723c953 |
| 3 / named recorder declaration | cb47cc83a398d9094a6e2230ef4c193b54855f02 |
| 3 / callback block bodies | 7a13125f7c80b962a78b1d888ee61a0dd1aaea7f |
| 3 / cleanup RED evidence | 31b30839ba0779017f289b5a453e657f01405a5b |
| 3 / cleanup cause and active regression | 9edb50cf4dac1d622c36e0afd21052f6d9be31a2 |
| 3 / condition-free fresh cancellation rows | 14c740371e8a35f8ade64b7f890c0f88269e7f03 |

Actual commit paths and passing hooks are recorded in 02-AUTH-REVIEW.md.
Source fixes used gsd-code-fixer; initial and both full re-reviews used
gsd-code-reviewer. No tracked file was deleted.

## TDD Gate Compliance

Approved D-04 governs both bugs. Expiry evidence at unchanged bf9b4c9 executed
66 tests: 61 passed and five intended assertions failed. Evidence-only f8b8635
precedes GREEN b42d368. Cleanup evidence at unchanged 7a13125 executed 69 tests:
68 passed and the intended AuthRejectedError assertion failed. Evidence-only
31b3083 precedes GREEN 9edb50c. Both classifiers returned RED_EVIDENCE_OK and
semantic inspection confirmed intended behavior failures, rather than setup faults.

Complete active patches, unchanged native TAP, real exits, timestamps, Node version,
source revisions, and assessments are committed in 02-AUTH-RED-EVIDENCE.json.
Current top-level fields describe cleanup; priorEvidence[0] retains the complete
original expiry record, checked against f8b8635. Actual source/evidence/fix ancestry
and unchanged source blobs were independently verified. Generic subject-based TDD
heuristics do not supersede the approved evidence policy.

The wrong-method and token-only-cache experiments are assertion controls, separate
from production-bug RED. Their intended request/Buffer assertions failed. Source
bytes were restored exactly, then rebuilt GREEN; no mutation was committed.

## Check Results

All final auth evidence is at 14c7403, Node v26.11.1. No live vendor, hardware,
package installation, or unsupported production dependency was used.

| Command / check | Outcome |
| --- | --- |
| npm run build:test && node --test --test-reporter=tap dist-test/test/cloud/auth.test.js | Exit 0; final 69/69, no skipped/cancelled tests |
| npm run test:coverage:direct -- src/cloud/auth.ts test/cloud/auth.test.ts | Exit 0; current isolated pair reaches 100% lines/functions/branches |
| Fresh native auth-only TAP/LCOV confirmation | Exit 0; compiled auth module 430/430 lines, 39/39 functions, 115/115 branches |
| Committed Task 1 tracer rerun before expansion | Exit 0; 66/66 at 0895691 |
| Auth/platform owners at filename-change snapshot | Exit 0; 129/129 (66 auth plus 63 platform) |
| npm exec --no -- cucumber-js --profile real --dry-run | Exit 0; 7 scenarios/41 steps intentionally skipped, no unresolved steps or executed hooks |
| Required pre-commit and enabled foreground hooks | Passed for every successful commit; conditional feature/header commits selected all pairs |
| Fallow guard, complete consumer traces, and per-commit audits | Complete zero-production/four-test filename consumers; audits exit 0/pass, no introduced findings |
| Both genuine RED records | RED_EVIDENCE_OK with actual source/evidence/fix provenance |
| Wrong-method control | Exit 1; intended complete request assertions distinguish GET from POST |
| Token-only-cache control | Exit 1; five intended complete-byte failures including privacy |
| Restoration | Exact source SHA-256 1433a95f1ae5ec9636dc855c8a5c84fa4780399b89afe123ee3de01b34d5fc02; rebuilt GREEN |

Earlier exact coverage denominators from stale merged LCOV were discarded.
Selected-pair commands did enforce current 100%; the exact final counts above
come from fresh module-only native output. Full commands, current-input scope,
logs, revisions, and dry-run limitations are recorded in 02-AUTH-REVIEW.md.
The coordinator's full npm run check wave gate remains pending.

## Review Convergence

Initial independent triage accepted 14 distinct causes. All five seed categories
have explicit dispositions; meaningful deduplication/retry counts are retained.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 at 7a13125 | 14 | 14 | 0 | 2 | 0 | 2 |
| 2 at 14c7403 | 2 | 2 | 0 | 0 | 0 | 0 |

Sixteen accepted causes are fixed. Both reviews covered the entire auth pair and
the narrow conditional deltas. Round 2 explicitly reports zero open findings.
Counts and IDs were reported before subsequent fixes or record work. No stall,
reopened cause, or fourth-round trigger occurred. This is batch completion;
the other cloud plans and phase-end judgment flags remain outside this summary.

## Deviations from Plan

Two Rule 1 bug repairs emerged from the required full-file review: invalid token
expiry (001) and cache deletion masking terminal refusal (015). Each received
active unchanged-production RED, committed complete evidence, minimum source
repair, and GREEN coverage. No protocol, JWT, integer-TTL, or recursive filesystem
behavior was added.

The coordinator owns shared state/roadmap/requirements/windows and the central
ledger. This executor leaves CLOUD-01 pending until all declaring plans finish.
The requirements-completed field identifies this plan's contribution and does
not claim the whole cloud requirement or phase is complete.

## Issues Encountered

Failed hook attempts for padding, arbitrary-abort-reason lint policy, and line
length were corrected, restaged, and retried without bypass or amend. Draft
syntax and formatting errors were corrected before commit and are not RED proof.
The inherited Fallow duplication group dup:6f87acd9 concerns existing World
remember/recall methods outside the narrow consumer edits; it was retained and
reported to the coordinator. No accepted auth finding remains deferred.

## Known Stubs

None. No introduced placeholder, disabled test, TODO, or unrun plan-owned check
remains. Existing synthetic foreign-cache fixture strings are intentional test
inputs and are unchanged by the filename repair.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next Phase Readiness

Auth batch evidence is ready for the coordinator's required full combined wave
gate. No shared state, roadmap, requirements, WINDOWS, or central findings file
was modified by this executor.

## Self-Check: PASSED

Owned evidence/review/summary files exist. All nineteen recorded commits are
ancestors of the code snapshot. Both unchanged source blobs, evidence-only paths,
source/evidence/fix ancestry, complete prior-evidence archive, and current RED
classifier were checked. Source/test inputs match reviewed HEAD; no temporary
mutation or untracked executable input remains.
