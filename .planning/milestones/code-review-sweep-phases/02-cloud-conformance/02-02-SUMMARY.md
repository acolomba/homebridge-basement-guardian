---
phase: 02-cloud-conformance
plan: "02"
subsystem: shadow
tags: [shadow, conformance, mqtt, regression]
requires:
  - phase: 02-cloud-conformance
    provides: Auth batch completion and released sequential build and Git resources
provides:
  - Finite shadow versions preserve telemetry ordering through overflowing JSON numbers
  - Complete independent signed URL and sanitized disconnect expectations
  - Clean independent full shadow review with ten causes fixed
affects: [cloud, review-process]
tech-stack:
  added: []
  patterns: [reported-only patch, current connection ownership, evidence-first regression]
key-files:
  created:
    - .planning/phases/02-cloud-conformance/02-SHADOW-REVIEW.md
    - .planning/phases/02-cloud-conformance/02-SHADOW-RED-EVIDENCE.json
  modified:
    - src/cloud/shadow.ts
    - test/cloud/shadow.test.ts
key-decisions:
  - Reject non-finite version numbers with the existing undefined absence representation
  - Preserve opaque reported-only patches and existing lifecycle contracts
  - Keep complete-patch regression evidence separate from assertion controls
requirements-completed: [CLOUD-01]
actuals:
  tokens: 23660
  tasks: 2
  commits: 11
plan_head_before: 82d6d1a32d2dd078f07691171407f4d9d3d26f7d
plan_head_after: 8277ae16577453bd270803f09941ee74f8b2fbd7
coverage:
  - id: D1
    description: Invalid overflowing versions remain absent in public reported patches
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/shadow.test.ts#reports an overflowing document version as absent
        status: pass
    human_judgment: false
  - id: D2
    description: Current reported routing and credential forwarding retain exact public outcomes
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/shadow.test.ts#turns an update-accepted reported data section into a patch carrying the document version
        status: pass
      - kind: unit
        ref: test/cloud/shadow.test.ts#routes no message arriving on a connection it has replaced
        status: pass
      - kind: unit
        ref: test/cloud/shadow.test.ts#signs the handshake from the cached credentials and refreshes the client identifier
        status: pass
      - kind: other
        ref: .planning/phases/02-cloud-conformance/02-SHADOW-REVIEW.md#Review rounds
        status: pass
    human_judgment: false
duration: 21min
started: "2026-10-13T23:59:42Z"
completed: "2026-10-14"
status: complete
---

# Phase 2 Plan 2: Shadow Conformance Summary

**Shadow rejects overflowing document versions, preserves reported-only connection ownership, and has complete independent signing and lifecycle assertions with a clean full-file review.**

## Performance

- Started: 2026-10-13T23:59:42Z. Records completed: 2026-10-14.
- Tasks: 2/2. Implementation files: 2. Owned records: 3 including this summary.
- Isolation: none in the existing features/code-review-sweep checkout. No branch or worktree was created or switched.
- Eleven commits are measured from the persisted per-plan ledger through reviewed code HEAD 8277ae1. The final records commit follows that snapshot.
- Actual tokens use chars/4 over the realized owned-file diff, including new review and summary contents; no harness token metric is used.

## Accomplishments

A raw JSON version token 1e400 parses to Infinity. The transport previously
forwarded it into the store's monotonic watermark, which then refused later
finite versions. The shadow boundary now forwards only finite numbers and
uses its existing undefined representation for an invalid version. Telemetry
and metadata remain opaque; no family decoding or healthy default was added.

Both headers now have separate MIT SPDX, original copyright and file overview
sections. Connection comments describe the current ownership rule. Tests use
flat exported-entrypoint groups, separate AAA observations, case-owned typed
rotation inputs, and silent logging. Exact patches, subscriptions, publications,
connection state, rotation and disconnect classifications remain covered.

Signing tests compare independently calculated complete URLs and refreshed
identities. The sanitized disconnect test requires the complete lifecycle,
so an absent notification fails. Existing current-connection guards, reported-only
patches, readiness, deadlines, rotation, shutdown and factory handshake ordering
remain intact.

## Task Commits

| Task / cause | Full commit |
| --- | --- |
| 1 / separate headers 001 | 5db616f17da938298d4dc10cb05f462838258c49 |
| 1 / overflowing version RED evidence 010 | 461601dc1ce6df30e77614e6135e4cd5d7647abd |
| 1 / finite guard and active regression 010 | f1be01b2c9c28cf69b68527797ff1d1f3e047ec8 |
| 2 / current ownership comment 002 | 71ff3ee4015228345eb22b7aa66679dee4dc8c8d |
| 2 / complete independent signed URLs 003 | 4a6954c221b4f1a1d50967cc1233fdd62a2885c7 |
| 2 / complete sanitized lifecycle 004 | db79085c526248965ffa004d2d669834201f9a68 |
| 2 / exported entrypoint groups 005 | 5f67ac1e2a5d954a2c78ed9a6de681832ef65ccf |
| 2 / separate AAA observations 006 | 4d764a1ee99aac6546ad000a1d067e0d99457cd9 |
| 2 / silent logging and public outcomes 007 | bb423681d0e14e19c0a9380cc7e3f8ea85ce43db |
| 2 / case-owned rotated inputs 008 | 2021fce25ed97525be8ed46a18919c95443fbcfd |
| 2 / named no-op declaration 009 | 8277ae16577453bd270803f09941ee74f8b2fbd7 |

Actual paths, hooks, reviewer/fixer identities and chronology are in
02-SHADOW-REVIEW.md. No tracked file was deleted.

## TDD Gate Compliance

D-04 governs the sole genuine defect, CR-02-SHADOW-010. At unchanged source
5db616f, 61 native owner tests ran: 60 passed and the intended complete patch
assertion failed on Infinity versus undefined. The complete native TAP, real
exit 1, command, target, full regression patch, source commit/blobs, Node version,
timestamps and semantic assessment are committed in 02-SHADOW-RED-EVIDENCE.json.
The classifier returned RED_EVIDENCE_OK; the target failed the intended assertion.

Actual Git ancestry proves source 5db616f → planning-only evidence 461601d →
GREEN fix f1be01b. The evidence commit contains only the owned JSON, source
blob 8853c0a2e0fb406867bf03935696d31cd927bbde is unchanged before GREEN,
and the saved complete active patch exactly matches the GREEN test diff.
The regression remains active. Generic subject-based TDD heuristics do not
supersede this approved evidence-first policy; no failing code was committed.

The wrong-secret experiment is a separate assertion control. Both strengthened
signed URL cases executed and failed with ERR_ASSERTION. Source was restored
exactly to blob 018f49c720f0119fb131b4f03dfbc3966a98dadc with empty source
diff, rebuilt, and returned GREEN 61/61. The separate control and independent
crypto calculation are retained in assertionControls, never claimed as bug RED.

## Check Results

Final focused evidence covers reviewed code 8277ae1 on Node v26.11.1.
No vendor, real hardware, package installation or broader runtime change occurred.

| Command / check | Outcome |
| --- | --- |
| npm run build:test && node --test --test-reporter=tap dist-test/test/cloud/shadow.test.js | Exit 0; 55/55, no skips/cancellations |
| npm run test:coverage:direct -- src/cloud/shadow.ts test/cloud/shadow.test.ts | Exit 0; executor reran the exact plan command with fresh build |
| Fresh native module-only LCOV | Exit 0; 339/339 lines, 30/30 functions, 74/74 branches |
| Tracer rerun before expansion at f1be01b | Exit 0; 61/61, accepted exact patches and superseded-connection rejection |
| RED classifier and actual Git provenance | RED_EVIDENCE_OK; exact patch, source blobs, evidence-only paths and ancestry |
| Wrong-secret assertion control | Exit 1; both complete signing assertions fail; byte-exact restoration and GREEN |
| Fallow guard / baseline audits | Guard exit 0; every successful commit audit exit 0/pass, no introduced finding |
| Required pre-step and enabled ordinary hooks | Every successful commit passed; failed attempts corrected before retry |

Detailed commands and outputs are in 02-SHADOW-REVIEW.md and
/private/tmp/guardian-shadow-fixer-actuals.json. Exact coverage counts come from
fresh module-only native output; selected-pair commands do not refresh merged
coverage/direct.lcov. The coordinator owns the full npm run check wave gate.

## Review Convergence

Initial independent triage accepted ten distinct causes (three BLOCKER,
seven WARNING). Independent initial and full re-review use gsd-code-reviewer;
confirmed repairs use gsd-code-fixer. Round 1 reviewed all 478 source and 1,011
test lines at 8277ae1 and explicitly reports zero open findings.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 | 10 | 0 | 0 | 0 | 0 |

Reconciliation: 10 - 10 - 0 + 0 + 0 = 0. Counts and IDs were reported before
record work. No stall, reopened cause or fourth-round cap occurred.

## Deviations from Plan

One Rule 1 bug emerged from the required full-file review: non-finite version
watermark poisoning. Its active unchanged-production RED, committed complete
evidence, minimum finite guard and GREEN coverage follow D-04. No integer/range
protocol assumption or lifecycle redesign was added.

Shared state, roadmap, requirements, WINDOWS and central findings remain
coordinator-owned. CLOUD-01 remains pending until all declaring plans finish.
The requirements-completed field identifies this plan's contribution; it does
not assert cloud-phase or whole-requirement completion.

## Issues Encountered

Enabled hooks caught long literals, blank-line placement and declaration spacing.
These attempts created no commit and were fixed, audited, restaged and retried.
One formatter pre-step was repeated cleanly. A sandbox Fallow baseline setup
failure was resolved through authorized escalation. No hook bypass, amend,
history rewrite or failed setup claimed as RED occurred.

## Known Stubs

None. No introduced placeholder, disabled test, TODO or unrun plan-owned check
remains. Synthetic broker credentials and state values are intentional fixtures.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.

## Next Phase Readiness

The shadow batch is ready for the coordinator's required full combined wave gate.
All shared records remain untouched by this executor.

## Self-Check: PASSED

Owned source, paired test, evidence and review files exist, and all eleven
recorded commits are ancestors of reviewed code HEAD. Actual evidence-only
paths, source blobs, full active patch, source/evidence/fix ancestry and current
classifier were checked. Source/test/evidence match reviewed HEAD, with no
temporary mutation, tracked deletion or untracked executable input remaining.
