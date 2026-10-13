# Phase 01 source, edge, and capability audit

All rows below refer to the live `code-review-sweep` phase. Current phases are
unimplemented; archived release summaries are pattern/history evidence only.
Updated CONTEXT D-06 supersedes the research's historical A1/blocker.

## Multi-source coverage

| Source | ID | Required item | Plan/task | Status |
| --- | --- | --- | --- | --- |
| GOAL | — | Five seed fixes with tests that fail, proven loop/ledger/header | 01-01 to 01-04 | COVERED |
| REQ | SPOT-01 | Real occupied exact temporary path and exclusive-create negative control | 01-01-02 | COVERED |
| REQ | SPOT-02 | Eight independently named exact refusal lines | 01-02-01, 01-02-02 | COVERED |
| REQ | SPOT-03 | Presence before freezing and actual store after stale patches | 01-03-01, 01-03-02 | COVERED |
| REQ | SPOT-04 | First-caller abort cannot cancel joined caller | 01-01-01, 01-01-02 | COVERED |
| REQ | PROC-01 | One complete stable-ID phase ledger | All batch reports; 01-04-01 | COVERED |
| REQ | PROC-02 | Review/triage/fix/re-review, four rounds and immediate maintainer stop | All batches, protocol, 01-04-01 | COVERED |
| REQ | PROC-03 | One locked header and license gate | All code tracers; 01-04-02 | COVERED |
| CONTEXT | D-01 | SPDX first; separate blocks and single blank separators | Code tracers; 01-04-02 | COVERED |
| CONTEXT | D-02 | Exact original copyright, classification and attribution | Code tracers; 01-04-02 | COVERED |
| CONTEXT | D-03 | Brief purpose and essential context on every touched TS file | Code tracers; 01-04-02 | COVERED |
| CONTEXT | D-04 | Independent caller cancellation | 01-01-01, 01-01-02 | COVERED |
| CONTEXT | D-05 | Zero-waiter shared cancellation; timeout/shutdown; no duplicate/retry | 01-01-01, 01-01-02 | COVERED |
| CONTEXT | D-06 | Active observed RED, committed complete patch/report before GREEN fix | 01-01-01; introduced-bug protocol; 01-04-01 | COVERED |
| CONTEXT | D-07 | Stable IDs and evidence-backed outcomes in one ledger | Unique batch reports; 01-04-01 | COVERED |
| CONTEXT | D-08 | Reconciled per-round summary; records feed milestone audit | Unique batch reports; 01-04-01 | COVERED |
| CONTEXT | D-09 | Pause all batches on stall/recurrence/cap; retry/skip/stop | All batch actions, protocol, 01-04-01 | COVERED |
| RESEARCH | R-01 | Grant-owned controller, per-waiter cleanup, shared slot through settlement | 01-01-01, 01-01-02 | COVERED |
| RESEARCH | R-02 | Pre-aborted/cache-read overlap, both cancellation directions, all/root abort | 01-01-02 | COVERED |
| RESEARCH | R-03 | Grant rejection, delayed teardown, later explicit call, no unhandled rejection | 01-01-02 | COVERED |
| RESEARCH | R-04 | Whole grant/cache coalescing, redaction, refusal/throttle policy preserved | 01-01-01, 01-01-02 | COVERED |
| RESEARCH | R-05 | Optional full-path seam, lazy entropy fallback, unchanged caller/cache shapes | 01-01-02 | COVERED |
| RESEARCH | R-06 | Real filesystem: occupied bytes/mode, old target, directory contents, exact log | 01-01-02 | COVERED |
| RESEARCH | R-07 | Independent literals and fresh one-test-per-row refusal fixtures | 01-02-01, 01-02-02 | COVERED |
| RESEARCH | R-08 | Complete state/nested values and canonical-store reads after patches | 01-03-01, 01-03-02 | COVERED |
| RESEARCH | R-09 | Distinct restored negative controls, not fabricated production RED | All code plans | COVERED |
| RESEARCH | R-10 | Compiled dist-test owners, 100% isolated pairs, license/full gates | All code plans; 01-04-02 | COVERED |
| RESEARCH | R-11 | Single ledger owner and unique worker reports; global stop | Protocol; 01-04-01 | COVERED |
| RESEARCH | R-12 | Plain hook-passing commits, actual path checks, historical commit hazard | Every task/protocol | COVERED |
| RESEARCH | R-13 | ASVS L1 boundaries; mitigation of high threats; synthetic-only evidence | Threat models; 01-04-01 | COVERED |
| RESEARCH | R-14 | No installs, migrations, service config, or runtime mirrors; loopback permission | Existing commands/protocol; no setup artifact needed | COVERED |

Exclusions: seed WARNING repairs remain assigned to Phases 2, 3, and 5.
Hardware/release gates and live real-pump runs remain outside this milestone.
No source item was omitted due to implementation difficulty.

## Deterministic edge report disposition

The supplied report contains 18 rows, including 2 unclassified rows. Its
`coverage.applicable` is 18 and `coverage.unclassified` is 2; those counts are
not additive. The following 16 classified rows each become a plain explicit
truth in plan frontmatter. Neither unclassified row is auto-resolved/dismissed.

| Edge | Requirement/category | Explicit criterion or flagged assumption | Location | Disposition |
| --- | --- | --- | --- | --- |
| E-01 | SPOT-01 / empty | Empty directory grants; occupied path preserves prior bytes and in-memory token | 01-01 truths/task 02 | resolved / explicit |
| E-02 | SPOT-01 / encoding | Complete file-byte equality without normalization; exact injected attempted path | 01-01 truths/task 02 | resolved / explicit |
| E-03 | SPOT-01 / concurrency | One complete attempt; no occupied-path rewrite/delete; existing interruption cleanup | 01-01 truths/task 02 | resolved / explicit |
| E-04 | SPOT-02 / adjacency | Same-status causes have distinct independent named exact-line cases | 01-02 truths/tasks | resolved / explicit |
| E-05 | SPOT-02 / empty | Empty/extra warning output fails exact one-line array equality | 01-02 truths/task 02 | resolved / explicit |
| E-06 | SPOT-02 / ordering | Fresh per-row fixtures/logs make execution order irrelevant | 01-02 truths/task 02 | resolved / explicit |
| E-07 | SPOT-03 / unclassified | Taxonomy has no category; explicit state behavior is planned without claiming completeness | 01-03 flagged_assumptions | unresolved / flagged |
| E-08 | SPOT-04 / unclassified | Taxonomy has no category; explicit cancellation matrix is planned without claiming completeness | 01-01 flagged_assumptions | unresolved / flagged |
| E-09 | PROC-01 / adjacency | Repeated finding keeps ID; distinct causes at same location remain distinct | 01-04 truths/task 01 | resolved / explicit |
| E-10 | PROC-01 / empty | Missing report is missing; empty reviewed scope has explicit zero result | 01-04 truths/task 01 | resolved / explicit |
| E-11 | PROC-01 / ordering | Stable first-round/ID ordering | 01-04 truths/task 01 | resolved / explicit |
| E-12 | PROC-02 / adjacency | Zero is clean; unchanged positive count stalls; fourth round triggers pause | 01-04 truths/task 01 | resolved / explicit |
| E-13 | PROC-02 / empty | Explicit zero review is distinct from absent evidence | 01-04 truths/task 01 | resolved / explicit |
| E-14 | PROC-02 / ordering | Chronological rounds; actual evidence precedes each genuine bug fix | 01-04 truths/task 01 | resolved / explicit |
| E-15 | PROC-03 / adjacency | Exactly one blank line separates each header section | 01-04 truths/task 02 | resolved / explicit |
| E-16 | PROC-03 / empty | Nonempty copyright and brief purpose; missing blocks fail inspection | 01-04 truths/task 02 | resolved / explicit |
| E-17 | PROC-03 / ordering | SPDX → copyright → overview → imports | 01-04 truths/task 02 | resolved / explicit |
| E-18 | PROC-03 / concurrency | All four parallel-owned TS files retain the identical locked form | 01-04 truths/task 02 | resolved / explicit |

Equality: 18 surfaced = 16 authored explicit edge criteria + 2 flagged assumptions.
Backstop and dismissed edge rows: zero.

## Prohibition recall and precision

The recall pass considered false safety defaults, misleading logs, overwritten
credentials, hidden tests, guessed evidence, omitted findings, extra grants,
silent retries, changed identity, hidden skips, erased attribution, and premature
release claims across the seven requirements. Routine correctness concerns
(empty values, ordering, mutation, coalescing, listeners, and header mechanics)
belong to the explicit edge criteria or rulebook review and were filtered out.

Canon privacy, secret handling, filesystem access, and authentication abuse are
covered by the declared security model / gsd-secure-phase and existing gates;
they are not minted as bespoke prohibitions.

Two bespoke product-safety/transparency prohibitions survive. Both were projected
through the installed `projectProhibitions` serializer, with `status: unresolved`
and no wired-check descriptor. They remain flagged-unverified for phase-end
judgment; neither is claimed green or dismissed:

| ID | Requirement | Statement | Location |
| --- | --- | --- | --- |
| P-01 | SPOT-03 | MUST NOT replace unknown or stale protection telemetry with guessed normal measurements to make this conformance sweep pass. | 01-03 must_haves.prohibitions |
| P-02 | PROC-01/PROC-02 | MUST NOT present paused or skipped findings, deferred hardware gates, or archived milestone verification as fixed or verified work in the current sweep. | 01-04 must_haves.prohibitions |

Equality: 2 surviving prohibition items = 2 descriptor-less must_haves items.

## Active contributions, in supplied array order

1. AI-integration pre-step: no AI feature is being built; no AI-SPEC is applicable.
2. Research pre-step: live RESEARCH.md is available; updated D-06 resolves A1.
3. Pattern-map pre-step: live PATTERNS.md supplies exact owned-file analogs.
4. API coverage: detector over roadmap plus all plan bodies returned
   `detected:false`, with no skip (exit 1 is the documented negative verdict).
   Existing auth is repaired; no external capability surface is newly integrated.
5. Assumption delta: roadmap detector returned `detected:false`, no skip;
   no primary identity transition is introduced.
6. Schema detection: owned paths/context/research/plans match no ORM schema
   pattern; no live database/schema push applies.
7. Security: each plan carries ASVS L1, high-blocking STRIDE threats. Numeric
   IDs T-01-01 through T-01-10 are unique; reserved T-01-SC repeats by contract.
8. TDD: the auth behavior plan is type tdd and begins with an active RED tracer.
   Test-only assertion repairs use restored negative controls; process records
   are standard tasks. Approved D-06 governs evidence/commit order.
9. Drift contributions are advisory; no source was edited by planning.

## Dependency, ownership, and estimates

Wave 1: 01-01 auth, 01-02 controls test, 01-03 state test, with disjoint final
files and unique reports. The coordinator serializes shared-checkout build,
mutation, stash/index, and commit sections; peer declarations record this coupling.
Wave 2: 01-04 consumes all three reports and owns the ledger/validation.

Each plan has two tasks and leads with a tracer. Decisions remain reversible;
the agreed header/process convention needs no repeated approval. MVP is false.
No SPEC or UI-SPEC is applicable. The calibration query returned factor 1,
sample_count 0, confidence low; all estimates use that measured confidence.
Discovery reuses source-verified patterns and current research, with no new
dependency. Graph context is disabled. No completed live milestone history exists.
