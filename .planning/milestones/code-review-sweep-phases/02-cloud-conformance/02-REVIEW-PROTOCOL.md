# Phase 02 review and evidence contract

This contract applies to the live `code-review-sweep` milestone. Read it with
02-CONTEXT.md D-01 through D-07 and the Phase 1 protocol. Phase 2 reviews the
complete owned files, including all WARNING seeds. Phase 1's bounded approval
and clean review do not approve unreviewed Phase 2 scope.

## Ownership and scheduling

| Plan | Exclusive implementation ownership | Batch records |
| --- | --- | --- |
| 02-01 | Auth pair; conditional filename-only edits in platform test, authentication steps, real-pump World | 02-AUTH-REVIEW.md; conditional 02-AUTH-RED-EVIDENCE.json |
| 02-02 | Shadow pair | 02-SHADOW-REVIEW.md; conditional 02-SHADOW-RED-EVIDENCE.json |
| 02-03 | API, errors and types pairs | 02-API-REVIEW.md; conditional 02-API-RED-EVIDENCE.json |
| 02-04 | HTTP dispatcher, MQTT transport and signing pairs; ALPN helper | 02-TRANSPORT-REVIEW.md; conditional 02-TRANSPORT-RED-EVIDENCE.json |
| Coordinator / 02-05 | 02-FINDINGS.md and 02-VALIDATION.md | Combined inventory, round reconciliation, provenance and gate audit |

All record paths are in this phase directory. Batch owners also write their
own numbered SUMMARY. They do not edit STATE, ROADMAP, REQUIREMENTS, WINDOWS,
the central ledger, another batch's report, or another batch's implementation.
The coordinator owns those shared records and the live round state from triage.
It writes a diagnostic ledger immediately if execution pauses before 02-05.

Use the existing feature worktree and local HEAD. Before each executor dispatch,
the coordinator runs `node .codex/gsd-core/bin/gsd-tools.cjs query dispatch-isolation
--raw --phase 02 --force-isolation none` and reads the persisted sentinel directly;
do not undo the force with a bare re-query. Record isolation `none`. Dispatch
executors sequentially in waves 1 through 5. There is one writer, build,
mutation or Git owner at a time. Independent reviewers may read in parallel,
but cannot mutate source, build output, the index or shared records.

## Full review and bounded convergence — D-02, D-03, D-06

Before touching a file, read it and trace the function's callers. Every batch
reads the complete TS style/comment and unit writer/reviewer rulebooks, AGENTS,
local-verification, the phase context, research and patterns. A feature-support
edit also requires cucumber-behavioral-testing and features/CLAUDE.md. Review
the whole assigned file set, rather than only its diff. A green toolchain owns
the rules it enforces; reviewers inspect the rulebook's remaining judgments.

Use `gsd-code-reviewer` for independent initial review and re-review, and
`gsd-code-fixer` for confirmed fixes, with configured agent_skills. Reviewers
read the writer rulebook too; fixers read the review rulebook too. Give each role
the exact owned paths. Preserve others' work and serialize every mutation.

Finding IDs are CR-02-AUTH-NNN, CR-02-SHADOW-NNN, CR-02-API-NNN and
CR-02-TRANSPORT-NNN. Increase within a batch; retain an ID on recurrence.
Each row records CLOUD-01, exact rule/section, revision-qualified location,
BLOCKER or WARNING severity, first round, disposition, rationale, observable
evidence, named test, and actual commits. Distinct causes keep separate IDs.
Reject only with a concrete source/rule reason; an assertion warning is not
automatically a production bug. Record explicit outcomes for every auth seed.

Triage is round 0. A tracer proves one real public path; its owner checks are
not convergence rounds. Count a round when an independent reviewer evaluates
the full triaged scope after its planned repairs. Report reviewer identity,
reviewed revision/diff, opening, fixed, rejected, new, reopened and closing
counts before further fixes. Closing = opening - fixed - rejected + new +
reopened; reconcile IDs with every transition. A zero-finding report is explicit.

The coordinator pauses all work immediately when an open-count round does not
reduce the count, a fixed finding reopens, or round four is reached, including
a clean fourth round. Interrupt active work; prohibit further writes, fixes,
commits and batch dispatch until the maintainer chooses retry, skip or stop.
Preserve unresolved IDs, attempts and evidence. A skip or pause is not a fix;
an unresolved accepted finding or pending pause prevents a successful seal.

## Genuine bugs and assertion controls — D-04, D-05

For a genuine defect, keep production unchanged and add an active regression
to its paired test before the fix. Compile and run the named owner with native
TAP. The target must execute and fail its intended behavior assertion. Missing
build output, zero tests, skipped/cancelled targets, unrelated failures, fixture
errors and listener EPERM do not prove RED. Resolve permission/setup faults
and rerun. Preserve the exact reporter output separately from npm banners.

The conditional RED JSON records command, real exitCode, complete unchanged TAP
output, targetTest, targetFile, expected, actual, sourceCommit, complete
regressionPatch, semanticAssessment, Node version and timestamps. Run the
existing `check tdd-red-evidence` command against the record and require
RED_EVIDENCE_OK plus semantic inspection. Commit only that planning record
before changing production, using the required enabled hooks. Inspect actual
commit paths. Keep the active regression discoverable in the working tree;
ordinary hook stashing follows repository policy. Then make the cause fix,
prove GREEN and direct 100% coverage, and commit the active test and fix together.
Source < evidence < fix ancestry and actual Git objects are authoritative.
Domain-scoped Conventional Commits replace generic phase-scoped TDD subjects.
This is the approved sweep full-patch evidence policy, not a failing-code commit.

Assertion repairs may use a targeted negative-control mutation where an
existing gate cannot show discrimination. Capture the named assertion failure,
restore the exact pre-experiment source bytes, rebuild and prove GREEN. Record
the mutation/restoration separately; never label a mutation as a production
defect or commit it. Do not manufacture RED for behavior already implemented.
Newly discovered behavior defects use test-first RED/evidence/GREEN; style,
headers and assertion maintenance remain conformance work.

Auth must preserve independent caller cancellation, cancellation of shared
transport only after every caller leaves, attempt ownership through settlement,
single concurrent grants, no automatic retries, current deadlines and cache
format. The Phase 1 cancellation and occupied-temporary-file cases remain active.

## Minimum causes, headers and narrow consumers — D-01, D-06

Inspect all 17 cloud headers. SPDX is line one with the original identifier;
separate copyright and overview JSDoc blocks follow, with one blank line between
sections and imports. Original work uses Copyright (c) 2026 Alessandro Colomba.
Retain Apache classification and attribution. Brief overviews describe current
purpose and essential context. Header/style-only changes use separate commits.

Do not add features, integrations, packages, public test hooks or speculative
abstractions. Keep telemetry opaque at cloud boundaries, reported state
authoritative, unknown/stale values untrusted, and credentials/raw/private
material absent from logs and records. Preserve existing userland undici
fetch/Agent HTTP/1.1 pairing, MQTT handshake-on-factory-call semantics, wire and
cache formats, and crypto primitives. Review lifecycle rules against the actual
contract; no networking move is authorized as routine style cleanup.

TOKEN_CACHE_FILENAME disposition is routine cause assessment, not a preference
checkpoint. Trace its exact four consumers with both production and test-aware
Fallow evidence. Test-only use does not establish an intended public contract.
If confirmed as privileged test knowledge, make it private and independently
name the stable .basement-guardian-token.json path in those four consumers.
Auth owns the narrow import/expectation edits; this is not a platform/features
sweep. Retain only with a concrete intended public/production contract and an
evidence-backed rejection. No getter or new persistence module is warranted.

## Checks, commits and records — D-02, D-07

Read current Fallow help before probes. Use JSON/quiet output, preserve stderr
and exit status, run guard before edits, exact symbol-impact before signature
changes, trace before export deletion, and audit against the recorded current
batch baseline before each commit. A permission/setup error is not a clean audit.

Compile with npm run build:test; owners run from dist-test/test/cloud. Each of
the eight source/test pairs must reach 100% direct lines/functions/branches
alone. Feature-support or ALPN-helper edits select all pairs in check:commit;
they require the broader staged-input gate. Run the AGENTS-required
SKIP=npm-check pre-commit run --files step, restage fixer edits and repeat until
clean, then plain foreground git commit. Inspect actual hash/paths and hook exit.
Never bypass hooks, amend after a failed hook, rebase or rewrite history.

The coordinator runs npm run check after every code wave and at phase end;
the gate includes Cucumber and all isolated pairs. Its 2,400-second limit is
not passing evidence. Reuse only same-session exact unchanged-input evidence,
recording command, exit, commit/diff, Node version and scope. Dirty-tree reuse
requires retained exact diff and untracked contents, not just path names.
No live vendor or real-pump run is part of this phase; real-profile verification
is dry-run only if the narrow filename consumer changes.

Reports retain full reviewed inventory, headers, findings, chronological rounds,
consumer decisions, commands, exit statuses, revisions, hooks and mutations.
SUMMARY key-files and unit-test paths name actual repo-relative files. Write
commands as plain text rather than backticked filename-like tokens, which the
known summary parser can misread. Include ## Threat Flags with the explicit
None statement if no extra security surface exists. Batches leave CLOUD-01
pending; the coordinator uses requirements.ready-ids before advancement.

## Judgment handoff

E-02-01/CLOUD-01 remains unclassified and unresolved. P-02-01 (truthful safety
telemetry) and P-02-02 (truthful completion records) are descriptorless judgment
prohibitions, flagged-unverified. Tests support concrete behavior only; no
taxonomy-completeness or new-scope human approval is claimed. Record these flags
in the ledger, validation and phase-end human-check. See 02-SOURCE-AUDIT.md.
