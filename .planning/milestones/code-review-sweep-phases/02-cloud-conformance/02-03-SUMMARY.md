---
phase: 02-cloud-conformance
plan: "03"
subsystem: api
tags: [cloud, conformance, deadlines, errors, wire-validation]
requires:
  - phase: 02-cloud-conformance
    provides: Completed auth and shadow batches with released sequential resources
provides:
  - Pending response reads preserve root cancellation and command timeout identity
  - Failed response cleanup preserves sanitized typed HTTP status and route
  - Complete offline REST, wire normalization and structured error expectations
  - Clean independent seven-file review after sixteen cause repairs
affects: [cloud, review-process]
tech-stack:
  added: []
  patterns: [explicit offline transport, complete independent results, evidence-first regression]
key-files:
  created:
    - test/cloud/apiSeeds.ts
    - .planning/phases/02-cloud-conformance/02-API-REVIEW.md
    - .planning/phases/02-cloud-conformance/02-API-RED-EVIDENCE.json
  modified:
    - src/cloud/api.ts
    - src/cloud/types.ts
    - src/cloud/errors.ts
    - test/cloud/api.test.ts
    - test/cloud/types.test.ts
    - test/cloud/errors.test.ts
key-decisions:
  - Preserve composite abort reasons during response reading and fixed HTTP errors through failed cleanup
  - Keep route and deadline constants private after complete production and test-aware consumer traces
  - Introduce only the coordinator-authorized fresh cloud seed helper
requirements-completed: [CLOUD-01]
actuals:
  tokens: 42944
  tasks: 3
  commits: 27
plan_head_before: 22644f309952adadd2fbefca7bee21ef02951376
plan_head_after: f34682f12200e9b5985bf79d3c2c77dc22b67838
coverage:
  - id: D1
    description: Pending body cancellation and failed cleanup retain their public error contracts
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/api.test.ts#preserves the command timeout reason while its response body is pending
        status: pass
      - kind: unit
        ref: test/cloud/api.test.ts#preserves root cancellation while a device response body is pending
        status: pass
      - kind: unit
        ref: test/cloud/api.test.ts#retains the typed HTTP failure when response body cancellation rejects
        status: pass
    human_judgment: false
  - id: D2
    description: Existing routes return complete independent records through explicit offline transport
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/api.test.ts#authorizes the device request with the bearer token the auth client supplies
        status: pass
      - kind: unit
        ref: test/cloud/api.test.ts#reaches only the four declared routes when every operation runs (SYNC-01)
        status: pass
      - kind: unit
        ref: test/cloud/api.test.ts#deadlines a command with the command deadline rather than the request timeout
        status: pass
    human_judgment: false
  - id: D3
    description: Wire normalization and structured error discrimination have complete owner evidence
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/types.test.ts#returns exactly the six fields the plugin reads
        status: pass
      - kind: unit
        ref: test/cloud/errors.test.ts#a cloud request failure carries the HTTP status and the route label
        status: pass
      - kind: other
        ref: .planning/phases/02-cloud-conformance/02-API-REVIEW.md#Review rounds
        status: pass
    human_judgment: false
duration: 40min
started: "2026-10-14T00:30:10Z"
completed: "2026-10-14"
status: complete
---

# Phase 2 Plan 3: API, Wire Types and Errors Summary

**REST body reads preserve cancellation identity, failed cleanup preserves typed HTTP errors, and complete offline contract tests have a clean independent review.**

## Performance

- Recorded execution start: 2026-10-14T00:30:10Z, after initial review.
- Tasks: 3/3. Implementation files: 7. Owned records: 3 including this summary.
- Isolation: none in the existing features/code-review-sweep feature worktree. No branch or worktree was created or switched.
- Twenty-seven commits are measured from the persisted plan ledger through reviewed code HEAD f34682f. The final records commit follows that snapshot.
- Actual tokens use chars/4 over the realized owned-file diff and new records, on the plan estimate's scale.

## Accomplishments

The operation's composite signal reaches the body reader. A pending JSON read
that aborts now preserves the actual command timeout or root cancellation reason.
Genuine unreadable responses retain their fixed sanitized typed error. Failed
error-body cancellation cannot replace the received HTTP status and route with
raw stream error text. Commands still make one attempt under the existing
auth-inclusive 2,500 ms deadline.

API tests fail closed when HTTP is not explicitly supplied. Request cases compare
complete independent results before verifying the method, URL, full headers and
exact body. Cancellation cases discriminate the intended reason and ordering;
expired authentication verifies that no HTTP request occurs. Private route and
deadline constants are tested through public operations with independent values.
The private request body uses a true optional field and read builders omit it.

Types preserve opaque telemetry and existing guards/normalization. Fresh seed
factories construct independent mutable inputs per case. Error cases compare
whole fields and class discrimination in four flat entrypoint groups. All seven
files have inspected separate MIT SPDX, original copyright and overview blocks.

## Task Commits

| Task / cause | Full commit |
| --- | --- |
| Shared headers 001 | 6b801927b64f2596068f229f802533421351d860 |
| API014 RED evidence | 4e97640e5f34aa7df92a413a6950ca3323cd3377 |
| API014 active regression and fix | 526ace58b1dd7afc56249fc0564ee621b82ef1cb |
| API015 RED evidence | a88590e9bc5b8d254f5a5c95e2ce3095df19b909 |
| API015 active regression and fix | a5196c1989d659ca69e710b569e40714d4365b4a |
| API002 explicit transport | 60cfd6f6f4f8a1327599ad61e37039d21afa8405 |
| API003 complete requests/results | 517bf0d50e1b250076ecbd880f190b28bfddadf4 |
| API004 sanitized output | b0104000d4bebcb4dbc47037a5f7b37ded817914 |
| API005 cancellation discrimination | d1874c3faaeb8152dbf3a179fcda16b63eae8a49 |
| API006 independent deadline | d29717cb8f84f525fa216e0c151f64d204a9fcee |
| API007 private constants | 601296f93f4c474ce4e78019f5d9bcf42f7799cc |
| API008 private optional body | 036f9648c1ed3fb44011b40244f73c130c0139a2 |
| API011 current comments | 19edf27ea03d322744f91a0138f590a0984016f6 |
| API012 role names | d771bcf3567abafcd140e410fc6d32cf50d6345e |
| API013 fresh seed helper | 28a65e176df0488d13d38233391780f0ef7922bb |
| API005 one request before abort | f4df2ed19baddb3ce10cb13609184b484eb76773 |
| Types003 whole normalization | 82bc842b4a749b73dd1e2d3829ad98f940c64c1e |
| Types009 AAA | 896892f23a445620f89cd2e3c5edb016153220ca |
| Types012 row names | 892629a611e6642404e95aa014970630a7742a9f |
| Types013 fresh fixtures | 925c5c1d936786a1cf3335923733682f8b792ed3 |
| Errors003 complete class/fields | ce812b5562f80f30a94ed2ac919c244e67eb73e8 |
| Errors004 route-only fields | 65486cad101b48ede0f1753973791a71c9e11a30 |
| Errors009 AAA | 7788a4d833f1ab8d57130195b109d8485030cafe |
| Errors010 class groups | 68b5f8f0dbc8753dc20cb17198258cd1c4dbc560 |
| API003 separate header control | 88e6e4c24434a6adadee9e1368c94b33329f34b1 |
| Types013 fresh malformed factories | 8012ddf54d1f35385377f6de9cca3f99837f59c3 |
| Follow-up016 accurate comment | f34682f12200e9b5985bf79d3c2c77dc22b67838 |

Actual paths and passing hooks are retained in 02-API-REVIEW.md.
Confirmed fixes use gsd-code-fixer; initial and both full re-reviews use
gsd-code-reviewer. No tracked file was deleted.

## TDD Gate Compliance

D-04 governs both genuine production defects. At unchanged source 6b801927,
35 native API tests execute: 33 pass and both pending-body error-identity
assertions fail. Evidence-only 4e97640e precedes GREEN 526ace58. At unchanged
526ace58, 36 tests execute: 35 pass and the cleanup class assertion fails.
Evidence-only a88590e9 precedes GREEN a5196c19. Both classifiers returned
RED_EVIDENCE_OK and semantic inspection confirmed intended behavior failures.

02-API-RED-EVIDENCE.json retains full patches, unmodified native TAP, real exits,
targets, expected/actual, source commits/blobs, Node version and timestamps.
Current fields describe cleanup; priorEvidence retains the pending-body record.
Actual source/evidence/fix ancestry and evidence-only paths were independently
verified. Production blobs remain unchanged through each evidence commit.
Saved patches match the GREEN tests; regressions remain active. The approved
complete-patch policy supersedes generic phase-subject/failing-code heuristics.

The wrong command-header experiment is separate assertion-control evidence.
Its named whole-header assertion fails ERR_ASSERTION, exit 1. Source returns
byte-exact to c3c11843113f897de2c8e4d2973ed35b475ab381; fresh build/API owner
returns 33/33 GREEN. No mutation was committed or classified as a bug.

## Check Results

Final API evidence covers reviewed f34682f, Node v26.11.1. Types/errors evidence
at 8012ddf remains valid after an exact unchanged-input comparison through
f34682f. Only API test comments changed after that shared-input snapshot.

| Command / check | Outcome |
| --- | --- |
| npm run build:test && node --test dist-test/test/cloud/api.test.js | Exit 0,33/33,no skips/cancellations |
| npm run test:coverage:direct -- src/cloud/api.ts test/cloud/api.test.ts | Exit 0,isolated 100% |
| npm run test:coverage:direct -- src/cloud/types.ts test/cloud/types.test.ts | Exit 0,isolated 100% |
| npm run test:coverage:direct -- src/cloud/errors.ts test/cloud/errors.test.ts | Exit 0,isolated 100% |
| Fresh module-only native TAP/LCOV | API33 cases156/156 lines14/14 functions28/28 branches; types77 cases69/69,14/14,31/31; errors5 cases71/71,8/8,9/9 |
| Both tracer acceptance/feedback runs before expansion | Exit 0 at f4df2ed1,33/33 and isolated API100% |
| Fallow guard, complete constant consumers/traces and baseline audits | Exit 0; only paired-test constant consumers,no production consumers; audits pass with no introduced finding |
| Required pre-step and enabled foreground hooks | All27 successful commits pass;24 build-input check:commit runs pass; shared seeds select all pairs |
| Current RED classifier and actual Git provenance | RED_EVIDENCE_OK; both complete archived records and source/evidence/fix paths/blobs checked |
| Wrong-header assertion control and exact restoration | Intended exit1,then fresh full owner exit0 |

Exact denominators come from fresh module-only LCOV, not stale merged coverage.
Selected-pair commands do not refresh coverage/direct.lcov. Compiled owners are
under dist-test/test/cloud. Detailed receipts and native reports are in the
review report and /private/tmp/guardian-api-handoff.json.
The coordinator owns the full npm run check wave gate; it remains pending.

## Review Convergence

Initial independent triage accepts 15 causes. Round 1 reads all seven files at
8012ddf, fixes all 15 and finds one distinct comment warning. Round 2 reads all
seven at f34682f and explicitly reports zero open findings.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 15 | 15 | 0 | 1 | 0 | 1 |
| 2 | 1 | 1 | 0 | 0 | 0 | 0 |

Sixteen accepted causes are fixed. Counts and IDs were reported before later
repair or closeout. No stall, reopened fixed cause or fourth-round cap occurred.
This records batch completion; CLOUD-01 and phase judgment remain pending.

## Decisions Made

Preserve the operation's own cancellation reason during body reading, and contain
cleanup failures without changing HTTP error fields. Public wire guards, family
meaning, telemetry absence, routes, fetch/Agent pairing and no-retry commands
remain authoritative. Private optional-body repair changes no shared shape.

## Deviations from Plan

Two Rule 1 bugs emerged from full review: pending-body cancellation classification
(014) and cleanup rejection masking typed HTTP failure (015). Each has active
unchanged-production RED, committed complete evidence, minimal repair and GREEN.

The coordinator authorized test/cloud/apiSeeds.ts to satisfy the existing fresh
cross-case seed rule. Its addition has a complete header and implemented exports;
broader all-pair hooks pass. No new production abstraction or dependency was added.

Shared state, roadmap, requirements, WINDOWS and central ledger are deliberately
coordinator-owned. This summary's requirements-completed field records a plan
contribution; it does not mark the whole CLOUD-01 requirement complete.

## Issues Encountered

Three rejected hook attempts caught pending-body lint, injection import ordering
and a premature fixture edit during an unfinished naming hook. The fixer preserved
its patch, restored only its own file to staged state, finished that hook, reapplied
the patch and retried cleanly. No failed hook created a commit. Compilation setup,
URL matcher and formatter failures are recorded accurately and do not count as RED.
No hook bypass, amend, stash, blanket reset or history rewrite occurred.

## Unconfirmed Concern

Dot-only identifiers remain explicitly unresolved and uncounted. Observed
sendCommand('..') reaches /data and sendCommand('.') reaches /devices/data under
WHATWG URL normalization. Documentation describes account-id_serial-number
identifiers, but neither a hard input precondition nor vendor occurrence settles
applicability. No guessed validation/encoding protocol was added, and this is
neither claimed fixed nor dismissed on improbability. The coordinator receives it.

## Known Stubs

None. The placeholder-location text is an intentional synthetic test fixture.
No product placeholder, disabled test, TODO or unrun owned check remains.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.

## Next Phase Readiness

All three owner pairs and the bounded independent review are ready for the
coordinator's required full combined wave gate. Shared records remain untouched.

## Self-Check: PASSED

All seven implementation files and the three owned records exist. All 27
recorded commits are ancestors of reviewed HEAD. Both unchanged source blobs,
evidence-only paths, source/evidence/fix ancestry and full archived regression
patches were inspected. Current source matches exact assertion-control restoration.
Owned executable inputs and index are clean; only this review and summary await
their records commit. No temporary mutation or untracked executable input remains.
