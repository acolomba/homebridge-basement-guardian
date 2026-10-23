# Phase 03 review and evidence contract

Milestone: code-review-sweep. Requirement: DEV-01. Apply 03-CONTEXT.md D-01
through D-07. This is a complete nine-pair review, including WARNING findings.
The approved SC-03 repair is a preservation baseline, not a completed review of
the remaining state source or test. Phase 2 human judgments do not approve this
phase.

## Serial ownership

| Batch | Plans | Exclusive ordinary code scope | Report |
| --- | --- | --- | --- |
| STATE | 03-01 | state source/owner; conditional stateSeeds | 03-STATE-REVIEW.md |
| DECODING | 03-02 through 03-04 | family, Gemini, waterLevel and mirrored owners; conditional geminiSeeds | 03-DECODING-REVIEW.md |
| SUPPORT | 03-05 through 03-07 | events, health, HALO, registry, accessoryContext and mirrored owners; conditional accessoryContextSeeds | 03-SUPPORT-REVIEW.md |
| Coordinator | 03-08 | findings, validation and seal audit | 03-FINDINGS.md; 03-SEAL-AUDIT.json |

All report and evidence paths are under this phase directory. Each plan creates
its numbered SUMMARY with actual repo-relative key-files, commands, exits,
revisions, commits, and ## Threat Flags. Include the AGENTS None statement if
no additional threat surface exists. Write commands as prose; do not put
backticked command fragments into filename fields.

Use the existing features/code-review-sweep checkout. Before each executor
dispatch, the coordinator resolves dispatch-isolation for phase 03 with
--force-isolation none and reads the persisted sentinel directly. Do not
replace that result with a bare re-query. Only one executor/fixer writes at a
time. Builds, direct coverage, controls, support changes, Git and shared records
are exclusive critical sections. Reviewers may read but may not change code,
compiled output, the index or coordinator records. Every code wave ends with
a full npm run check; the coordinator owns that gate.

The coordinator owns STATE, ROADMAP, REQUIREMENTS and WINDOWS. Workers preserve
others' changes and do not edit those records or the central findings ledger.
Use the GSD command for WINDOWS append, with [code-review-sweep] at the beginning
of its description. These plans neither create a checkout nor open a PR.

## Full rulebooks, review and findings — D-01, D-02, D-06

Every initial and correction reviewer uses role gsd-code-reviewer; every cause
fixer uses role gsd-code-fixer, with configured agent_skills. Read AGENTS and
the complete TypeScript style, comments, unit writer, unit reviewer and
local-verification skills. Read full owned files before triage. A feature
consumer adaptation also reads features/CLAUDE.md and the complete Cucumber
skill. Apply toolchain-enforced rules through valid checks and inspect every
rulebook judgment that the toolchain does not enforce.

Initial STATE review covers both files. Initial DECODING review covers all
six files before 03-02 edits; initial SUPPORT review covers all ten files before
03-05 edits. The smaller plans divide fixes, not the full review inventory.
Retain one counter per batch across all its slices and resumed owner tasks.
Re-review the entire batch after its complete initial repair pass. A later
accepted cause is routed to its original owner task, with exact bounded paths;
its addition does not create a new batch or reset the counter.

Use CR-03-STATE-NNN, CR-03-DECODING-NNN and CR-03-SUPPORT-NNN. Allocate each
cause once; retain its ID on recurrence. Each row contains DEV-01, exact rule
and section, initial/current revision-qualified location, BLOCKER/WARNING,
first review, fix or rejection rationale, independently observed result,
named tests/commands, source/evidence/fix hashes and actual committed paths.
Fix every confirmed finding, including warnings. Rejection requires actual
source/rule evidence. Never infer a genuine production bug from an assertion
maintenance finding.

All six STATE seed categories need separate current dispositions: optional
members, snapshot readonly members, missing/implementation JSDoc, local data
naming, in-case rationale, and incomplete whole promises. Required present
undefined keys, exhaustive scoped shape and writable persistence records are
contracts to examine. The class-only readonly rule is not automatic proof
against an interface. Preserve SC-03 whole snapshots before frozen checks,
nested record presence, and whole canonical readback after refused patches.
A confirmed reopening of SC-03 triggers the global stop.

Every touched source/test/helper has the approved SPDX line first, separate
Copyright (c) 2026 Alessandro Colomba and @fileoverview JSDoc blocks, and one
blank line between present sections. Preserve existing license/attribution.
Inspect complete headers independently, including tests/helpers and bounded
external consumers; the source-only packaging gate is insufficient. Keep
header/style-only commits separate from functional causes.

## Exact consumers and five-file cause budgets

Before any exported name, signature, type or mutability change, run installed
Fallow exact symbol-impact in both tsconfig.json and tsconfig.test.json, with
--type-aware, --format json and --quiet. Read the reported caller bodies and
constructors; structural consumers matter too. A partial/unavailable result
retains the question and never proves safe removal. Read live help first; keep
stdout, stderr, raw exit, target, project, reviewed revision and completeness.
No install, remote configuration, telemetry opt-in or Fallow fix is authorized.

Ordinary tasks declare their source/owner, batch report, conditional evidence,
and, only where justified, one concern seed: at most five changed paths. A
report update is a changed path. Do not tuck an external consumer into a
sixth path or let a metadata task conceal source work.

If a confirmed shared cause actually requires external adaptation, BEFORE
changing it the coordinator replaces/extends the owning plan's task map with
explicit serial cause tasks in that SAME owning wave, updating files_modified,
validation, inventory and threat references. Each such task declares no more
than five concrete changed paths: normally the owning source/owner, one exact
consumer source/owner, and the owning RED JSON. Report updates are a separate
record-only task. Test-only consumers use their exact paths instead of an
unneeded production file. Conditional seeds are separate when this budget
is occupied. Retain all required consumers, passing intermediate contracts,
atomic cause commits and original batch counters. If a cause cannot be sliced
without an invalid intermediate contract, surface the concrete dependency or
missing-contract conflict before edits; do not omit it or defer it to another
subsystem sweep. Routine bounded reslicing does not request a new preference.

| Owning cause | Proven consumer scope / compatibility slots |
| --- | --- |
| STATE DeviceSnapshot | family/Gemini pairs; basementGuardian pair; platform pair; accountRuntime owner; features/support/world.ts, features/support/steps/shadow.ts, features/real-pump/support/realWorld.ts |
| STATE ReportedPatch | cloud/shadow pair; runtime/accountRuntime pair; platform owner |
| DECODING ScopedDomainState | Gemini pair and family owner; structural basementGuardian/serviceCatalogue reads remain compatibility observations |
| SUPPORT TrustScope | family/Gemini pairs; basementGuardian/serviceCatalogue pairs; health owner |
| SUPPORT PumpObservation / ActivationWatermarks | pumpRecords pair; persistence owner |
| SUPPORT AccessoryContext | platform pair; persistence owner |

These slots are read/validation targets until a concrete cause requires edits.
They confer narrow compatibility ownership, not full later-subsystem review.
Every edited production consumer brings its mirrored owner, isolated coverage,
headers and full-file independent review. Add new seeds only for a confirmed
writer-rule violation; they return fresh values, join full review/header
inventory, and trigger broad staged checks. No helper is created speculatively.

## Correction rounds and global stop — D-03

Initial triage is round 0. Initial questions, tracer checks and ordinary owner
runs are not correction rounds. A correction round is an independent full-batch
review after repair. Reconcile IDs and record opening, fixed, rejected, new,
reopened and closing, where closing = opening - fixed - rejected + new +
reopened. State reviewer identity, exact inputs/revision and native evidence;
a clean round explicitly reports zero open IDs.

Determine the stop from that verdict before any further edit or dispatch.
Pause ALL work when closing remains open without reducing opening, any fixed
finding reopens, or correction round four is reached, even clean. Interrupt
active work and report the actual IDs/counts and existing evidence. No later
fix, record edit, build, commit, or dispatch follows until maintainer resolution.
New causes and plan slicing never reset counters. A pause/skip is not a fix
and does not permit a successful seal.

## Genuine RED and separate assertion controls — D-04, D-05

For an actual behavior defect, first add an active intended regression in its
true mirrored owner while production is unchanged. Build serially, then run
the named owner with native TAP. Require execution of the target and its
intended behavior assertion failure. Zero/filtered-out tests, skipped or
cancelled targets, compiler/import/fixture failures, unrelated failures and
permission errors do not authorize GREEN.

The owning pair's conditional 03-*-RED-EVIDENCE.json stores complete unmodified
native output, command, actual exitCode, exact targetTest/targetFile, expected
and observed results, semanticAssessment, full regressionPatch, sourceCommit,
source/test blob identities, Node/npm versions and real start/end timestamps.
Keep npm banners/stderr separately; do not edit the report for its parser.
Run the existing check tdd-red-evidence command against the current record and
every older record, including recursively nested priorEvidence. It must emit
RED_EVIDENCE_OK and pass independent semantic inspection.

The coordinator commits only the complete planning evidence BEFORE any GREEN
production edit, with the approved pre-step and ordinary foreground hooks.
Preserve all prior records in full, including their own nested archives.
Inspect real commit paths and source -> evidence -> fix ancestry; production
blobs through evidence must match unchanged source. An evidence file cannot
overwrite the only surviving older history. An active regression remains
discoverable in the working tree; follow ordinary hook stashing rules.

Then make the minimum cause repair, prove active GREEN and direct coverage,
and commit production plus active tests together with enabled hooks. Compare
saved patch with active GREEN tests; record every formatter/lint difference.
A subject prefix, declared type:tdd or summary marker proves no history.
D-04 overrides generic failing-code RED commits and GSD subject conventions.
No failing/skipped code commit, hook bypass, amendment or history rewrite.

For assertion maintenance, a targeted negative control may prove the assertion
that an existing gate misses. Keep it separate from genuine bug history.
Record the intended named failure, restore EXACT pre-control source bytes,
rebuild and prove GREEN. Do not commit a mutation, call it a production defect,
or manufacture RED for already implemented behavior.

## Safety, checks and atomic commits — D-05, D-06, D-07

Preserve opaque canonical data, reported-only patches, monotonic watermarks,
deeply frozen public snapshots, required scope absence, narrow invalid trust,
last valid safety state, deviceId identity, deviceTypeId selection, separate
local/device clocks, mutable observation records and current invalid-record
new-epoch recovery. Keep the existing provisional water/battery meanings and
official command bodies. HALO stays identified and unsupported. No product
feature, fallback normal, adapter/alert mapping, protocol guess or migration.

Use node:test/assert/strict, explicit dependencies and independent whole
expected results. No production test hook, module replacement, private access,
expected value computed by production, coverage exception or new framework.
For type-only modules use meaningful satisfies/@ts-expect-error contracts and
the existing direct selector's declaration-only verdict; zero runtime cases
are appropriate and are not numerical 100% runtime coverage.

Run Fallow guard before changes and trace before deleting an export. Before
each commit record a Fallow audit against the current recorded batch baseline,
with raw verdict and exit. Run SKIP=npm-check pre-commit run --files with the
exact changed paths, restage and repeat until clean. Use plain foreground git
commit with normal hooks; inspect real hash/paths and hook exit. A failed hook
created no commit; repair/restage/retry without --amend or --no-verify. Other
hooks have no SKIP override. Conventional titles are 5–72 characters, body
lines at most 80, with domain scopes and no milestone/phase prose.

Owner tests run from dist-test after fresh build:test. Every modified pair
runs alone with 100% direct lines/functions/branches, or a valid declaration-only
selector result. Edited external pairs follow the same rule. Shared support
and feature edits broaden staged selection to all pairs. Selected pair checks
do not refresh the merged all-pair coverage artifact. The coordinator runs full
npm run check after each code wave and at phase end, including Cucumber and all
isolated pairs; its 2,400-second limit is not a pass. Reuse only exact unchanged
same-session inputs under local-verification, with real command/exit/commit,
Node version, scope, exact dirty diff and untracked bytes when applicable.

Use synthetic offline input. Never run a live vendor/hardware/real profile,
install packages, read private account material, or introduce public secrets.
Any necessary real-profile step resolution uses --dry-run only.

## Seal flags

E-03-01 is the supplied deterministic unclassified/unresolved DEV-01 item.
P-03-01 and P-03-02 are separately derived unresolved descriptorless
prohibitions, projected by the existing projectProhibitions serializer.
They dispose unverified/flagged and have no invented check descriptors.
Carry equality: edge 1 = 0 lifted + 1 flagged assumption; prohibitions
2 = 2 authored + 0 silently omitted. Concrete checks do not establish an
exhaustive taxonomy or maintainer judgment. At seal, surface only genuine
remaining human-needed judgments, preserving exact evidence limits. Do not
inherit Phase 2 answers or auto-accept Phase 3.
