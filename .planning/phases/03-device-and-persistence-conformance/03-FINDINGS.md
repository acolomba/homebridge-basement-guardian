# Phase 03 device and persistence findings ledger

Milestone: code-review-sweep. Requirement: DEV-01. Status: EXECUTION IN PROGRESS.
Planning baseline observed on features/code-review-sweep at
0a9f993072de5a0e95da643bdf437b67feaca53e. No Phase 03 source/test repair,
build, native test, mutation control, independent execution review or Git
commit is claimed by this planning record.

Current accepted findings: 11 STATE causes, all fixed at independent round 2.
DECODING and SUPPORT remain unreviewed. DEV-01 is pending. The initial planning
text below is historical; the executed STATE record and current appendix
supersede its pending statements only for that batch.

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
| src/device/state.ts | STATE / 03-01 | Complete: round 2 at ade72e10 | Inspected: approved form |
| test/device/state.test.ts | STATE / 03-01 | Complete: round 2 at ade72e10 | Inspected: approved form |
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
| test/device/stateSeeds.ts | 03-01 | Created for CR-008; full round-2 review/header inspected at ade72e10 |
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
| STATE | Source, owner and stateSeeds | 2 | 1 / 1 / 0 / 0 / 0 / 0 | Clean; initial 10, round 1 10→1, round 2 1→0 |
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

## Executed STATE closeout — 03-01

Authoritative full finding rules, original/current revision-qualified locations,
severity, exact fixes and actual Git/control evidence are in
03-STATE-REVIEW.md, final independent round 2 at ade72e10. The committed
summary/report closeout is 26761a619dd9bbd6fbd4dbd1cefb7b38c31d59b4.
All three actual batch files were reviewed in full with complete rulebooks.

| Finding suffix (CR-03-STATE-) | Cause | Fixed commit | Current disposition |
| --- | --- | --- | --- |
| 001 | Whole returned and canonical snapshots | ca8b3dd, 169e4ed | Fixed, BLOCKER |
| 002 | Complete listener envelopes | 3e4ba69 | Fixed, BLOCKER |
| 003 | Repeated-release clock discrimination | f78999a | Fixed, BLOCKER |
| 004 | Approved complete source header | 5808523 | Fixed, WARNING |
| 005 | Identity/public docs and implementation comments | 72417ab | Fixed, WARNING |
| 006 | Role-specific local telemetry name | b3e792c | Fixed, WARNING |
| 007 | Obsolete rationale | 1de1a61 | Fixed, WARNING |
| 008 | Fresh concern seed organization | 18e8b83 | Fixed in code, WARNING; process deviation below |
| 009 | Separate non-throwing act/assert | df9d37d | Fixed, WARNING |
| 010 | Module-level negative compile contracts | b05e58f | Fixed, WARNING |
| 011 | Named local logger declaration | 90dac39 | Fixed, WARNING; new in round 1 |

No IDs reopened and no D-03 stop triggered: round 1 opening10/fixed10/new1/
closing1; round 2 opening1/fixed1/new0/closing0. Original counters retained.
Required undefined fields and interface-readonly candidates were rejected
from exact contracts. JSDoc, local naming, obsolete rationale and whole
promises were repaired; blanket rationale deletion was rejected. SC-03
whole frozen/present snapshots and canonical refusal readbacks remain intact.
Production non-comment tokens match the pre-batch baseline. No genuine
production defect or RED JSON was accepted. Three separate controls failed
their intended assertions and restored exact source before rebuilt GREEN.

Fresh owner52/52; native direct264/264 lines,23/23 functions,61/61 branches,
all100%. Two synthetic runtime compile wrappers were removed while their
negative type contracts remained. Shared seed staged checks selected allpairs.

CR-008 violated pre-step ordering: formatter-changing pre-step exit1, then
ordinary commit before repeat. Normal all-pair hooks passed; subsequent
exact-byte corrective pre-step exited0 with clean tree. This does not prove
compliant ordering retroactively. Report/summary and WINDOWS retain this
actual deviation; history was preserved and continuation authorized.

Parent full combined gate at clean26761a6, Nodev26.11.1:
- npm run check first sandbox run16:57:31–16:57:39 UTC exit1: both package
  inspection tests hit npm-cache EPERM. No code failure or bypass inferred.
- Authorized filesystem retry16:58:07–16:58:42 UTC exited0. All six static
  checks,104 Cucumber scenarios/1156steps, and43isolated pairs passed; merged
  coverage/direct.lcov refreshed. Native log and command/time/commit record:
  /private/tmp/guardian-phase3-wave1-full-check.log and
  /private/tmp/guardian-phase3-wave1-gate.json. Failed run retained separately.
- Schema drift gate exit0/blockfalse, no schemafiles; codebase drift skipped
  no-structure-md/blockfalse. Summary verification passed.

Overall DEV-01 and Phase3 remain pending. Phase3 E/P flags and hardware/release
limitations are not resolved by this bounded batch.
