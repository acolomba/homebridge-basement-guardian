# Phase 08 findings and review index

This ledger belongs to the `code-review-sweep` milestone. Round zero starts
with the independent tracer in [08-TRACER-REVIEW.md](08-TRACER-REVIEW.md).
The six complete-file batch reports will fill this ledger in Plans 08-02
through 08-07, 08-12, and 08-13. Plans 08-09 and 08-14 own cause triage and
repair; this tracer changes no product code.

## Source snapshot and inventory

- Starting committed revision: `0217a8ac4e0c049eb152dc2b01d2952b1ae826d1`.
- [08-MANIFEST.json](08-MANIFEST.json) assigns 137 in-scope tracked paths
  exactly once: CLOUD 19, DEVICE 20, RUNTIME 23, ACCESSORY 21, ROOT 15,
  FEATURES 39. Research also counted 137; delta is zero.
- Ten repository-level gate tests are excluded from complete-file review but
  remain in the full gate. `test/configSchema.test.ts` and
  `test/packageManifest.test.ts` remain absent.
- Node for this plan: `v26.12.1`. This is local evidence, not Node 22/24
  compatibility proof. Pairing and full-gate results are recorded below.

## Requirement and probe status

| Requirement | Current Phase 08 evidence | Status |
| --- | --- | --- |
| GATE-02 | Live manifest and three independent tracer rows below; 134 paths remain assigned for later complete-file review. | In progress; no final zero-open claim. |
| BUG-01 | Regression-before-fix and milestone bug audit are specified in the protocol; Plan 08-08 and repair plans own evidence. | In progress. |
| GATE-01 | Current pairing result below; the full combined-tree gate belongs to Plan 08-11 after repair. | In progress; no current full-gate claim. |

| Flagged spec-less row | Disposition | Acceptance source |
| --- | --- | --- |
| BUG-01 adjacency | Unresolved; no probe proof or backstop | Phase 8 ROADMAP criteria 3-4 |
| BUG-01 empty | Unresolved; no probe proof or backstop | Phase 8 ROADMAP criteria 3-4 |
| BUG-01 ordering | Unresolved; no probe proof or backstop | Phase 8 ROADMAP criteria 3-4 |
| GATE-01 adjacency | Unresolved; no probe proof or backstop | Phase 8 ROADMAP criterion 2 |
| GATE-01 empty | Unresolved; no probe proof or backstop | Phase 8 ROADMAP criterion 2 |
| GATE-01 ordering | Unresolved; no probe proof or backstop | Phase 8 ROADMAP criterion 2 |
| GATE-02 unclassified | Unresolved; no probe proof or backstop | Phase 8 ROADMAP criterion 1 |

Seven surfaced = zero lifted as proven edge predicates + seven flagged.

## Batch report index

| Owner | Assigned paths | Report | Current state |
| --- | ---: | --- | --- |
| CLOUD | 19 | `08-CLOUD-REVIEW.md` | Assigned, pending complete-file review |
| DEVICE | 20 | `08-DEVICE-REVIEW.md` | Assigned, pending complete-file review |
| RUNTIME | 23 | `08-RUNTIME-REVIEW.md` | Assigned, pending complete-file review |
| ACCESSORY | 21 | `08-ACCESSORY-REVIEW.md` | Assigned, pending complete-file review |
| ROOT | 15 | `08-ROOT-REVIEW.md` | Two tracer files clean; batch review pending |
| FEATURES | 39 | `08-FEATURES-REVIEW.md` | One tracer file clean; batch review pending |

## Tracer file ledger

These rows link one manifest path and full blob to its independent
complete-file result. They do not certify the other 134 assigned paths.

| Path | Owner/shard | Revision | Full blob | Lines | Reviewer | Finding result |
| --- | --- | --- | --- | --- | --- | --- |
| `src/config.ts` | ROOT/B | `0217a8ac4e0c049eb152dc2b01d2952b1ae826d1` | `3d299fd1fe718a5ddb6835417849d01b7694f21b` | 1-216 | `/root/phase8_plan01/independent_tracer` | 0, clean |
| `test/config.test.ts` | ROOT/B | `0217a8ac4e0c049eb152dc2b01d2952b1ae826d1` | `33e1d51f1db305e2adb9ef4d898a3ccd27ca9e56` | 1-503 | `/root/phase8_plan01/independent_tracer` | 0, clean |
| `features/account/configuration.feature` | FEATURES/A | `0217a8ac4e0c049eb152dc2b01d2952b1ae826d1` | `7e35c417f02a3a8b021e0f6b717b2c724874864b` | 1-48 | `/root/phase8_plan01/independent_tracer` | 0, clean |

**Tracer finding IDs:** none allocated. The observed forward-open set from
this tracer is empty; the phase-wide forward-open set remains undetermined
until all six owner reviews and correction rounds finish. Historical STOPs
from earlier phases remain in their ledgers and will be audited, not erased.

## Plan 08-01 verification

Current pairing command, raw exit, and revision will be recorded after the
protocol task's check. The final `TEST_CONCURRENCY=1 npm run check` has not
run for Phase 08 and must not be inferred from a prior phase or commit hook.
