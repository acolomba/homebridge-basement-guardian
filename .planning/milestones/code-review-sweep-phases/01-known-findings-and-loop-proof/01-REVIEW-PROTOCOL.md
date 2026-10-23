# Phase 01 review and evidence contract

This contract belongs to the live `code-review-sweep` milestone. The current
roadmap and this phase directory govern progress. Archived release phases do
not establish current completion.

## Ownership and dispatch

| Owner | Writes | Reads |
| --- | --- | --- |
| 01-01 auth batch | `src/cloud/auth.ts`, `test/cloud/auth.test.ts`, `01-AUTH-REVIEW.md`, `01-AUTH-RED-EVIDENCE.json` | Auth callers and the rulebooks |
| 01-02 controls batch | `test/accessories/controls.test.ts`, `01-CONTROLS-REVIEW.md`, conditional `01-CONTROLS-RED-EVIDENCE.json` | `src/accessories/controls.ts` |
| 01-03 state batch | `test/device/state.test.ts`, `01-STATE-REVIEW.md`, conditional `01-STATE-RED-EVIDENCE.json` | `src/device/state.ts` |
| Execution coordinator / 01-04 process owner | `01-FINDINGS.md`, `01-VALIDATION.md` | All batch records and actual gate evidence |

All process paths in this table are under this phase directory. Workers return
records to the coordinator; they never edit the central findings ledger, state,
roadmap, requirements, or another worker's files. The coordinator retains the
live round state from the first review and assembles the persistent central
ledger in 01-04. If execution pauses earlier, the coordinator writes that ledger
immediately as a diagnostic record, without declaring 01-04 complete.

Read AGENTS.md and the four TypeScript/test rulebooks before implementation.
Reviewers use `gsd-code-reviewer`; fixers use `gsd-code-fixer`, with their
configured `agent_skills`. The coordinator schedules those roles within the
available agent slots. It may serialize dispatch when no slot is available.
Workers are not alone and preserve other workers' changes.

Before executor dispatch, run the existing worktree base check. Honor STATE.md's
forced-isolation workaround when it reports degradation; do not fork from an
obsolete remote default. Use the active feature branch and local source HEAD.

## Shared-checkout critical section

Disjoint ownership permits parallel reviews and edits. In a shared checkout,
`dist-test`, temporary source mutations, unstaged-change stashing, and the Git
index are shared mutable resources. The coordinator grants only one verification
or commit critical section at a time.

The section covers compilation, owner tests, coverage, a temporary mutation
through restoration and GREEN, staging, pre-commit, and foreground commit.
Other workers pause writes during this section. No full gate or another build
runs while a mutation or active RED experiment exists. A worker reports release
only after restoration is verified. If workers run in separate checkouts based
on the correct local HEAD, their local builds and indexes are independent; the
combined-tree gate remains the coordinator's responsibility.

## Review rounds: D-07, D-08, D-09

1. Review the owned batch before editing. Scope is SC-01 through SC-05 and
   findings introduced by their fixes. Seed WARNING rows remain assigned to the
   later owning phases. Record their deferral without implementing them here.
2. Triage each finding by rule and evidence. Keep SC-01 through SC-05. New IDs
   use `CR-01-AUTH-001`, `CR-01-CONTROLS-001`, or `CR-01-STATE-001`, increasing
   within that batch. A repeated finding retains its ID. Distinct causes at one
   location retain separate IDs.
3. Fix accepted findings one cause per hook-passing code commit. A genuine bug
   follows the evidence-first protocol below before its production change.
   A rejected finding records a concrete reason and supporting evidence.
4. Re-review the owned source/test pair and all changes introduced by the fix.
   Record reviewer identity, reviewed revision/diff, and every finding.
5. Send the round record to the coordinator before further fixes. A round
   records opening, fixed, rejected, new, reopened, and closing counts.
   Closing = opening - fixed - rejected + new + reopened. IDs and transitions
   must reconcile with those counts. A zero-finding review is explicit; a
   missing review is not a clean result.
6. Stop the batch when its re-review reports zero open findings. The coordinator
   stops all batches immediately when any round with open findings fails to
   reduce the count, when a fixed finding returns, or when round four is
   reached. At the cap, report the result even if the fourth review is clean.
   Interrupt running batches and prohibit further fixes, commits, or independent
   batch dispatch until the maintainer decides retry, skip, or stop.
7. Record unresolved IDs, attempted fixes, evidence, and the maintainer's
   decision. A skip or pause never becomes a fixed outcome. Only the maintainer
   can authorize more rounds after the cap. An unresolved accepted finding or
   outstanding pause prevents a successful phase seal.

A tracer proves one public path before expansion. Its focused checks are not
automatically new review rounds. Count a round when the reviewer evaluates the
triaged scope after its fixes; do not manufacture a no-progress round while a
planned expansion is still unfinished. Auth may re-review the SC-05 tracer as a
real first round; the still-open cache findings stay in that round's counts.

## Evidence-first bug fixes: D-06

For each genuine bug, keep production unchanged, add an active regression in
the owning test, compile, and run the owner test. The target must execute and
fail on the intended assertion. A missing build, zero tests, unrelated assertion,
import/setup error, cancellation of the test runner, or local `listen EPERM`
is not RED evidence. Resolve environmental permission failures and rerun.

The batch's RED JSON record contains `command`, `exitCode`, complete unchanged
TAP `output`, `targetTest`, `targetFile`, `expected`, `actual`,
`sourceCommit`, `regressionPatch`, and `semanticAssessment`. The patch contains
the full active test change, not an excerpt. Capture Node version and timestamps.
Use an explicit TAP reporter if the default output is incompatible. Validate
the record with `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence
<record.json> --raw`; require `RED_EVIDENCE_OK` plus the semantic assessment.

Commit only the planning evidence record before touching production. Keep the
regression active and discoverable in the working tree. Stage only the evidence
path, run the required pre-commit step, and use plain foreground `git commit`.
Do not alter discovery, skip the test, bypass a hook, or manufacture a passing
report. The maintainer approved this planning-only evidence commit in D-06.
Normal hook stashing of unstaged edits follows the repository's existing
commit behavior; do not construct a separate exclusion mechanism.

Verify the actual commit contains the evidence and no production/test change.
Then make the fix, prove GREEN and direct coverage, and commit the active test
with its production fix. Preserve each bug's complete evidence at its recorded
commit if a later bug updates the same JSON path. Ledger entries name source,
evidence, and fix commits, test title, command, exit status, and RED assessment.
Use Conventional Commits with domain scopes and the repository's title/body
limits. The approved D-06 policy and repository naming override generic TDD
active-test-first and phase-number commit-scope examples.

Assertion repairs use separate negative-control evidence: temporarily weaken
exclusive cache creation, substitute a same-status refusal cause, or return a
missing/corrupted state. Capture the intended named assertion failure, restore
the source, rebuild, and prove GREEN. Never call a mutation result an observed
production bug and never commit the mutation.

## Headers: D-01, D-02, D-03

Every touched TypeScript file begins with the existing SPDX identifier on line
one. It has a separate copyright JSDoc containing
`Copyright (c) 2026 Alessandro Colomba`, then a separate `@fileoverview` JSDoc.
One blank line separates SPDX, copyright, overview, and imports. Preserve Apache
classification and template attribution wherever present. Keep a short purpose
sentence and only essential dependency or safety context. Commit header changes
separately from a functional fix to avoid mixing style churn into that fix.

## Records and gates

Batch reports contain the full findings and rounds, exact changed-file scope,
mutations/restoration, commands, real exit status, source revision, Node version,
and hook/commit evidence. The central ledger adds requirement, rule, exact
location, severity, first round, outcome or rejection reason, named regression,
RED/evidence commit, fix commit, and verification scope. Order findings by first
round and stable ID; order rounds chronologically. Never infer completion from
an empty commit or archived verification.

Rebuild with `npm run build:test` and run the compiled owner tests. Every touched
source/test pair must independently reach 100% line, function, and branch
coverage. Run `SKIP=npm-check pre-commit run --files <changed files>`, restage
fixers, and repeat until clean. Before commits run the required Fallow audit.
Use plain foreground commits and inspect committed paths; never rely on the
known-unsafe GSD commit helper.

The coordinator runs `npm run check` after the combined code wave and before
phase verification. It includes Cucumber and all isolated pairs. Timeout or a
nonzero exit cannot establish a pass. Same-session evidence may be reused only
for unchanged inputs under local-verification, with an exact diff/untracked-input
comparison. No live vendor or real-pump run is part of this phase.

Every plan SUMMARY contains `## Threat Flags`, including the required explicit
None statement when no extra security surface exists. Shared requirement IDs
remain pending until `requirements.ready-ids` allows completion. The coordinator
owns state and roadmap updates through GSD; batch workers do not hand-edit them.
