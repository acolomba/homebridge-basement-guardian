# Phase 03 device and persistence findings ledger

Milestone: code-review-sweep. Requirement: DEV-01. Status: PENDING EXECUTION.
Planning baseline observed on features/code-review-sweep at
0a9f993072de5a0e95da643bdf437b67feaca53e. No Phase 03 source/test repair,
build, native test, mutation control, independent execution review or Git
commit is claimed by this planning record.

Accepted findings: 0 so far. This is an unreviewed initial ledger, NOT clean
review evidence. DEV-01 is pending. Each row below remains pending until a typed
independent full-file review and explicit complete-header inspection supply
the actual reviewer, revision, command scope and result.

## Inventory

Exactly 18 existing core files: eight device source/owner pairs and one
persistence pair. Existing paths are tracked. Conditional extensions belong
to the separate inventory below and do not silently change this core count.

| File | Batch / plans | Full independent review | Complete header |
| --- | --- | --- | --- |
| src/device/events.ts | SUPPORT / 03-05 | Pending | Pending |
| test/device/events.test.ts | SUPPORT / 03-05 | Pending | Pending |
| src/device/family.ts | DECODING / 03-02 | Pending | Pending |
| test/device/family.test.ts | DECODING / 03-02 | Pending | Pending |
| src/device/gemini.ts | DECODING / 03-03 | Pending | Pending |
| test/device/gemini.test.ts | DECODING / 03-03 | Pending | Pending |
| src/device/halo.ts | SUPPORT / 03-06 | Pending | Pending |
| test/device/halo.test.ts | SUPPORT / 03-06 | Pending | Pending |
| src/device/health.ts | SUPPORT / 03-05 | Pending | Pending |
| test/device/health.test.ts | SUPPORT / 03-05 | Pending | Pending |
| src/device/registry.ts | SUPPORT / 03-06 | Pending | Pending |
| test/device/registry.test.ts | SUPPORT / 03-06 | Pending | Pending |
| src/device/state.ts | STATE / 03-01 | Pending | Pending |
| test/device/state.test.ts | STATE / 03-01 | Pending | Pending |
| src/device/waterLevel.ts | DECODING / 03-04 | Pending | Pending |
| test/device/waterLevel.test.ts | DECODING / 03-04 | Pending | Pending |
| src/persistence/accessoryContext.ts | SUPPORT / 03-07 | Pending | Pending |
| test/persistence/accessoryContext.test.ts | SUPPORT / 03-07 | Pending | Pending |

## Conditional extension inventory

These are possible remedy paths, not existing files or completed reviews.
Create fresh seeds only for a confirmed rule violation; every actual helper
joins full-file review, complete header inspection and broad staged selection.

| Conditional path | Owner | Current status |
| --- | --- | --- |
| test/device/stateSeeds.ts | 03-01 | Not created; only confirmed reused-data cause |
| test/device/geminiSeeds.ts | 03-03 | Not created; only confirmed reused-data cause |
| test/persistence/accessoryContextSeeds.ts | 03-07 | Not created; only confirmed post-triage reused-data cause |

Required external consumers are read/validation targets until exact evidence
requires edits. The protocol names bounded slots for cloud/shadow,
runtime/accountRuntime, accessories/basementGuardian, pumpRecords and
serviceCatalogue, platform, their exact owners, and three snapshot feature
consumers. Before any such edit, the coordinator adds an explicit same-wave
task with at most five changed paths INCLUDING evidence/report/helper paths.
Record every actual path, reason, owning task, full-file reviewer, complete
header and owner/direct/full check. This grants no later subsystem sweep.

## Findings

No accepted execution finding is entered yet. Review candidates do not become
accepted defects by appearing in research. Allocate CR-03-STATE-NNN,
CR-03-DECODING-NNN or CR-03-SUPPORT-NNN after full independent review. Each
record needs DEV-01, exact rule/section, initial and current revision/location,
BLOCKER/WARNING, first review, fix/rejection rationale, named independent
public assertion, commands/exits/scope, actual source/evidence/fix hashes and
committed paths. Distinct causes remain separate; recurrence retains its ID.

## Six state warning dispositions

SC-03's prior whole frozen/present snapshots and canonical refused-store
readbacks remain preservation requirements. Merely reading state again does
not reopen it. A confirmed reopening invokes D-03.

| Candidate ID | Category | Current disposition | Required evidence |
| --- | --- | --- | --- |
| STATE-W-01 | Required undefined / optional fields | Pending triage | Complete public shape, compiler negatives, parser construction and exact callers |
| STATE-W-02 | DeviceSnapshot readonly members | Pending triage | Interface promise, runtime freeze, exact writes/aliases; class-only rule scope |
| STATE-W-03 | Missing or implementation JSDoc | Pending triage | Actual exported contract and durable safety rationale |
| STATE-W-04 | Local value named data | Pending triage | Role-local name; canonical vendor data field stays |
| STATE-W-05 | In-case design-rationale comments | Pending triage | Setup necessity and complete writer/comment rulebook |
| STATE-W-06 | Length/single-field whole promises | Pending triage | Title's public promise, independent whole expectation and true failure discrimination |

## Review rounds

No independent correction round has occurred. Initial full reviews/triage,
initial clarifications and tracer checks are not correction rounds.

| Batch | Scope | Current round | Opening / fixed / rejected / new / reopened / closing | Verdict |
| --- | --- | --- | --- | --- |
| STATE | 2 files plus actual extensions | Not started | Unmeasured | Pending |
| DECODING | 6 files plus actual extensions across 03-02/03/04 | Not started | Unmeasured | Pending |
| SUPPORT | 10 files plus actual extensions across 03-05/06/07 | Not started | Unmeasured | Pending |

One counter follows each batch across slices and resumed owner tasks. Every
correction verdict reconciles closing = opening - fixed - rejected + new +
reopened and enumerates transitions. D-03 pauses ALL work before another edit,
build, commit or dispatch on non-reduction with open findings, any reopened
fixed ID, or round four even clean. A new cause does not reset counters. A
pause/skip is not clean closure.

## Genuine bug provenance

No genuine Phase 03 defect has been accepted and no Phase 03 RED record exists.
For each actual defect, preserve an active intended failing regression on
unchanged production and the complete native command/output/exit/target/
timestamps/runtime/full patch/source commit and blobs. Commit the planning
evidence first; then minimum GREEN production and active tests together with
enabled hooks. Inspect actual source -> evidence -> fix ancestry and unchanged
production blobs through evidence. Recursively preserve/check every priorEvidence
record. Subject/type/summary heuristics are not proof.

Conditional pair records are 03-STATE, 03-FAMILY, 03-GEMINI, 03-WATER,
03-EVENTS, 03-HEALTH, 03-HALO, 03-REGISTRY and 03-PERSISTENCE-RED-EVIDENCE.json.
Create only the record for a proven genuine cause; absence is correct when no
bug is found. All files live in this phase directory.

## Separate assertion controls

No Phase 03 assertion control has run. Retain any actual named wrong-behavior
assertion failure, exact original/source restoration and rebuilt GREEN
separately. Never count a control mutation as a production bug or commit it.
Preserve Phase 1 SC-03's six independently restored controls as bounded prior
evidence; they do not validate the Phase 03 sweep.

## Checks and final-input evidence

No Phase 03 implementation test/check result is claimed here. Commands and
task/threat map are in 03-VALIDATION.md. A future record stores command, real
exit, exact reviewed inputs/revision or dirty diff/untracked contents, Node
version and scope. Modified pairs require isolated 100% runtime metrics or
the honest declaration-only selector outcome. Every combined code wave and
phase gate requires npm run check; old evidence is reused only for identical
same-session inputs under local-verification. Serialized builds, controls,
helpers, Git and shared records are mandatory.

## Residual assumptions and judgment handoff

E-03-01/DEV-01 is the actual supplied deterministic unclassified/unresolved
edge item. P-03-01 (safety telemetry) and P-03-02 (truthful completion) are
this phase's unresolved descriptorless prohibition projection; both dispose
unverified/flagged. No check descriptor, deterministic enforcement PASS,
exhaustive taxonomy or Phase 03 human judgment exists. Phase 2 answers remain
bounded to Phase 2. Equality: edges 1 = 0 lifted + 1 flagged assumption;
prohibitions 2 = 2 authored + 0 silently omitted. At Phase 03 seal, the parent
surfaces only the genuinely required evidence-backed judgments.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was
introduced by this planning-only record. Execution must update this field
from actual reviewed changes.
