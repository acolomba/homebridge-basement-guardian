---
phase: 04-runtime-conformance
plan: "11"
subsystem: testing
tags: [runtime, adapter-contracts, arrival-anchors, shadow, node-test]
status: complete
requires:
  - phase: 04-06
    provides: Existing arrival memory contract and monitoring participant
provides:
  - Shared real and ACCOUNT anchor memory and successful persistence observations
  - Shared real and ACCOUNT shadow start, readiness and close observations
affects: [04-07, 04-08, 04-09, 04-10]
tech-stack:
  added: []
  patterns: [Separate contract exercise and pure assertion, Structured negative controls]
key-files:
  created:
    - test/runtime/accountShadowContract.ts
    - .planning/phases/04-runtime-conformance/04-11-SUMMARY.md
  modified:
    - test/runtime/accountRuntime.test.ts
    - test/runtime/arrivalAnchorMemoryContract.ts
    - test/runtime/arrivalAnchors.test.ts
    - test/cloud/shadow.test.ts
    - .planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md
key-decisions:
  - Preserve private fixture names and signatures; align consumed behavior through their bodies.
  - Apply the approved inventory-only trace exception without treating unavailable production impact as complete.
  - Keep state and lifecycle agreement separate from disk and network equivalence.
requirements-completed: []
requirements-pending: [RUN-01]
actuals:
  tokens: 13486
  tasks: 2
  commits: 2
plan_head_before: 6072c207706224f93059cfb9ebe1c1e6185c554e
plan_head_after: 4fc498ce4de72104461c4cef51aada40a3f2d233
coverage:
  - id: ACCOUNT-015A
    description: Real and ACCOUNT participants share independent anchor state assertions and negative controls.
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/accountRuntime.test.ts
        status: pass
      - kind: unit
        ref: test/runtime/arrivalAnchors.test.ts
        status: pass
      - kind: other
        ref: npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts
        status: pass
    human_judgment: false
  - id: ACCOUNT-015B
    description: Real and ACCOUNT participants share start, readiness and close assertions and a negative control.
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/accountRuntime.test.ts
        status: pass
      - kind: unit
        ref: test/cloud/shadow.test.ts
        status: pass
      - kind: other
        ref: npm run test:coverage:direct -- src/cloud/shadow.ts test/cloud/shadow.test.ts
        status: pass
    human_judgment: false
duration: 23 min
started: 2026-10-15T12:45:40Z
completed: 2026-10-15
---

# Phase 4 Plan 11: ACCOUNT Adapter Agreement Summary

Fresh real and ACCOUNT participants share independent anchor-state and shadow-lifecycle assertions with structured negative controls.

## Files Created and Modified

- `test/runtime/accountShadowContract.ts` — new typed participant inventory, lifecycle exercise/capture and pure assertions.
- `.planning/phases/04-runtime-conformance/04-11-SUMMARY.md` — this execution record.
- `test/runtime/arrivalAnchorMemoryContract.ts` — approved ACCOUNT inventory entry and separately scoped persistence-state contract.
- `test/runtime/accountRuntime.test.ts` — fresh ACCOUNT participants, contract cases and negative controls; compatible private fixture bodies.
- `test/runtime/arrivalAnchors.test.ts` — real participant in the additional consumed-state contract.
- `test/cloud/shadow.test.ts` — real participant and explicit subscription-complete/get-pending readiness observation.
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md` — append-only original 015A/015B implementation evidence and limits.

## Performance and Actuals

Two tasks changed six implementation/report paths and created this separate summary.
The persisted gitdir ledger records 6072c207706224f93059cfb9ebe1c1e6185c554e.
The measured range through 4fc498ce contains exactly two implementation commits.
Its complete realized diff contains 53,941 characters: ceil(chars / 4) = 13,486 tokens.
This measurement excludes the self-referential summary/metadata commit.

## Accomplishments

- Added ACCOUNT to the existing memory participant inventory under the maintainer's exact approved exception. Existing get/record cases and assertions remain unchanged.
- Added separate forget, restore and successful-persist state observations in the same concern helper. Fresh real and ACCOUNT participants use the same pure assertions; three broken participants fail with independently specified structured AssertionError fields.
- Added the declared shadow helper. Three common lifecycle scenarios distinguish start resolution from readiness and reject late readiness after close. A deliberately broken participant fails through the same pure assertion function.
- Preserved every prior owner case, private fixture names/signatures, production bytes, original 024/025 regressions and complete six-record RED history.

## Task Commits

1. **04-11-01 / original 015A:** fae2ce4800e256a52e3aa1af7371a255a7db124b — test: verify consumed account arrival anchor agreement.
2. **04-11-02 / original 015B:** 4fc498ce4de72104461c4cef51aada40a3f2d233 — test: verify consumed account shadow lifecycle agreement.

Each commit contains exactly its four declared implementation paths. The pre-code plan declaration at 6072c20 is the fifth cause path. The summary is a separate metadata closeout.

## Check Results

All commands ran serially in the existing feature checkout with Node v26.11.1, npm 11.20.0, TypeScript 6.0.3 and Fallow 3.27.0. Full native stdout/stderr, exact argv, raw exits, UTC times, revisions, blobs and attempts are retained in the two directories below.

| Task | Fresh build and full compiled owners | Isolated native coverage: lines / functions / branches | Native evidence |
| --- | --- | --- | --- |
| 015A at fae2ce4 | Build exit 0, 12:50:18.093–12:50:21.358 UTC; owner exit 0, 12:50:21.477–12:50:22.334; 206 pass = ACCOUNT 147 + arrival 21 + monitoring 38, zero fail/cancel/skip/todo | ACCOUNT 994/994, 57/57, 181/181; arrival 145/145, 15/15, 32/32; monitoring 154/154, 13/13, 18/18 | /private/tmp/guardian-04-account-015a/ |
| 015B at 4fc498c | Build exit 0, 13:01:26.621–13:01:30.084 UTC; owner exit 0, 13:01:40.073–13:01:40.875; 210 pass = ACCOUNT 151 + shadow 59, zero fail/cancel/skip/todo | ACCOUNT 994/994, 57/57, 181/181; shadow 339/339, 30/30, 75/75 | /private/tmp/guardian-04-account-015b/ |

The exact full-owner commands were:

- `npm run build:test`
- `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js dist-test/test/runtime/arrivalAnchors.test.js dist-test/test/runtime/monitoringHealth.test.js`
- `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js dist-test/test/cloud/shadow.test.js`

Each required exact source/owner selector ran with exit 0:

- `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts`
- `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts`
- `npm run test:coverage:direct -- src/runtime/monitoringHealth.ts test/runtime/monitoringHealth.test.ts`
- `npm run test:coverage:direct -- src/cloud/shadow.ts test/cloud/shadow.test.ts`

Both tasks passed exact-file uncached ESLint and recorded-base Fallow audit against e6f49a59671c13a20b696b7f46e38406a36aeec0. Exact clean SKIP=npm-check pre-steps preceded staging and repeated after report changes. Normal foreground commit hooks passed. Shared helper paths select all 43 pairs through the unchanged installed selector; pre-commit suppresses successful per-pair output, so the retained terminal hook pass and recorded exact selection are the evidence. Selected native denominators above are distinct from merged source-mapped LCOV.

015B changed neither arrival/monitoring production nor their helper/owners. Its final account owner result supersedes the earlier ACCOUNT case count. The earlier exact arrival/monitoring evidence remains tied to unchanged inputs. No new executable check is inferred from summary writing.

## Approved Exception and Boundary Limits

The maintainer selected option 1 before the plan declarations were committed. Immediately before 015A edits, the exact ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS test-project impact completed with exit 0 and named both prior owners. Production impact remained unavailable/no-project with raw exit 1. Installed TypeScript program membership independently verified production exclusion and test inclusion. This is the approved inventory-only exception; production impact is not reported as complete.

Existing helper signatures and memory case inventory remain unchanged. Private recordingAnchors and fakeShadow keep their names and signatures; compatible body changes align only consumed behavior. The earlier TRUST-017 exception remains separate. New persistence and shadow contracts are the separately declared additions, not broader permission to change existing exports.

Anchor agreement covers get/record, exact-device deletion, restore merging and successful persisted-state restoration. Real filesystem bytes, malformed JSON, temporary-path ownership and persistence failures remain in the real owner. The fake is not disk-equivalent.

Shadow agreement covers construction, normal start before readiness, connected notification and close ownership. The real participant controls subscription/get-publish readiness through injected offline transport; the extra real case distinguishes those stages. The fake models common lifecycle facts without implementing subscriptions, message parsing, broker failures or network equivalence. Its optional pending-start seam remains deliberate for existing runtime shutdown cases. No universal external transport teardown is claimed.

Both complete adapted real owners, ACCOUNT owner and complete helpers join the later independent ACCOUNT correction. Earlier cloud/TRUST clean reviews are historical; they do not certify the changed owners.

## Deviations from Plan

Both bounded implementation tasks followed the approved plan. Preparation and lint corrections stayed within their declared paths; no production, compiler, package, shared-state or extra helper change occurred.

Metadata process limit: the executor created this summary before running its exact-path Fallow guard. The subsequent guard exited 0 with no configured boundary zones or rule packs, before further summary edits, but does not supply retroactive pre-edit evidence. The parent owns recording this disclosed process deviation in the cross-phase ledger. The task-level pre-edit guards remain valid and unaffected. Native capture: /private/tmp/guardian-04-11-closeout/summary-guard.json.

## Issues Encountered

The 015B first lint attempt found an import-group issue and two void-expression shorthand issues. They were corrected before final executable checks; complete failed streams remain in lint-1.json and its stdout/stderr. Its first temporary staging assertion script trimmed Git status spacing incorrectly; the raw failure was retained and the exact-path assertion corrected before staging. Neither is genuine RED or a hidden skipped check.

## Provenance, Stubs and Remaining Work

Production account blob remains 6e6795bb2720ea38dd46d01393d82692c636de16; production shadow remains 018f49c720f0119fb131b4f03dfbc3966a98dadc. The six-record genuine RED file remains blob 849b2e725bc19a4742e962910cce05f804a6a4c1. Both fixers verified every embedded record with the same installed classifier and preserved original 024/025 tests. Existing TRUST memory assertions, its structured negative control and the complete monitoring owner remain unchanged. No tracked files were deleted.

The changed-file stub scan found only intentional synthetic placeholder-device identifiers and existing fixture wording. No unfinished stub, skipped/todo/only test or unrun executor verification was introduced. No stub or skipped-test ledger entry is needed; the parent owns the separately disclosed metadata process entry.

Original CR-04-ACCOUNT-015 is implemented pending independent full ACCOUNT correction. The 29 stable IDs and correction counter 0 continue; this is neither a correction round nor a partial clean verdict. RUN-01 remains Pending. Remaining 04-07 IDs 002, 003, 012, 013, 027 and 028 wait for the parent gate and later resumption. No requirement or phase completion, shared record update, live input, install or release claim occurred. WINDOWS 46/47 remain OPEN and unwaived.

The parent must run full npm run check after terminal 04-11 and again after completed 04-07. No full combined gate was run here. The parent also retains its obligation to restore only workflow.use_worktrees=true before final milestone audit/handoff.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Self-Check: PASSED

Both task commits exist on this branch and contain their exact declared four paths. The new shadow helper and all modified files exist. The persisted ledger and measured two-commit range match the frontmatter. Production, original regressions, existing TRUST checks and genuine RED preservation were verified. The working tree and index were clean before this metadata file was created. Full parent gate and independent ACCOUNT correction remain explicitly pending.
