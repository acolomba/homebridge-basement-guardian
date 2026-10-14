# Phase 03 device and persistence findings ledger

Milestone: code-review-sweep. Requirement: DEV-01. Status: EXECUTION IN PROGRESS.
Planning baseline observed on features/code-review-sweep at
0a9f993072de5a0e95da643bdf437b67feaca53e. No Phase 03 source/test repair,
build, native test, mutation control, independent execution review or Git
commit is claimed by this planning record.

Current accepted findings: 36 causes: 11 STATE and 15 DECODING independently
closed at round 2, plus 10 initial SUPPORT causes. Events/health portions are
applied pending full SUPPORT correction; later HALO/registry/persistence
portions remain. DEV-01 is pending. WINDOWS 46/47 remain open process
deviations. Initial planning text is historical; current executed appendices
supersede its pending statements only for their scope.

## Inventory

Exactly 18 existing core files: eight device source/owner pairs and one
persistence pair. Existing paths are tracked. Conditional extensions belong
to the separate inventory below and do not silently change this core count.

| File | Batch / plans | Full independent review | Complete header |
| --- | --- | --- | --- |
| src/device/events.ts | SUPPORT / 03-05 | Initial complete at 7cfedb24; full correction pending | Approved form applied; correction pending |
| test/device/events.test.ts | SUPPORT / 03-05 | Initial complete at 7cfedb24; full correction pending | Approved form applied; correction pending |
| src/device/family.ts | DECODING / 03-02 | Complete: full round 2 at e8b99aa3 | Inspected: approved complete form |
| test/device/family.test.ts | DECODING / 03-02 | Complete: full round 2 at e8b99aa3 | Inspected: approved complete form |
| src/device/gemini.ts | DECODING / 03-03 | Complete: full round 2 at e8b99aa3 | Inspected: approved complete form |
| test/device/gemini.test.ts | DECODING / 03-03 | Complete: full round 2 at e8b99aa3 | Inspected: approved complete form |
| src/device/halo.ts | SUPPORT / 03-06 | Initial complete at 7cfedb24; full correction pending | Inspected; CR-001 still open |
| test/device/halo.test.ts | SUPPORT / 03-06 | Initial complete at 7cfedb24; full correction pending | Inspected; CR-001 still open |
| src/device/health.ts | SUPPORT / 03-05 | Initial complete at 7cfedb24; full correction pending | Approved form applied; correction pending |
| test/device/health.test.ts | SUPPORT / 03-05 | Initial complete at 7cfedb24; full correction pending | Approved form applied; correction pending |
| src/device/registry.ts | SUPPORT / 03-06 | Initial complete at 7cfedb24; full correction pending | Inspected; CR-001 still open |
| test/device/registry.test.ts | SUPPORT / 03-06 | Initial complete at 7cfedb24; full correction pending | Inspected; CR-001 still open |
| src/device/state.ts | STATE / 03-01 | Complete: round 2 at ade72e10 | Inspected: approved form |
| test/device/state.test.ts | STATE / 03-01 | Complete: round 2 at ade72e10 | Inspected: approved form |
| src/device/waterLevel.ts | DECODING / 03-04 | Complete: full round 2 at e8b99aa3 | Inspected: approved complete form |
| test/device/waterLevel.test.ts | DECODING / 03-04 | Complete: full round 2 at e8b99aa3 | Inspected: approved complete form |
| src/persistence/accessoryContext.ts | SUPPORT / 03-07 | Initial complete at 7cfedb24; full correction pending | Inspected; CR-001 still open |
| test/persistence/accessoryContext.test.ts | SUPPORT / 03-07 | Initial complete at 7cfedb24; full correction pending | Inspected; CR-001 still open |

## Conditional extension inventory

These are possible remedy paths, not existing files or completed reviews.
Create fresh seeds only for a confirmed rule violation; every actual helper
joins full-file review, complete header inspection and broad staged selection.

| Conditional path | Owner | Current status |
| --- | --- | --- |
| test/device/stateSeeds.ts | 03-01 | Created for CR-008; full round-2 review/header inspected at ade72e10 |
| test/device/geminiSeeds.ts | 03-03 | Created for 009; four fresh factories, full round-2 review and complete header inspected at e8b99aa3 |
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
| DECODING | Six core files plus Gemini seed across 03-02/03/04 | 2 | 1 / 1 / 0 / 0 / 0 / 0 | Clean; original 12 plus two initial clarifications, then rounds 14→1→0 |
| SUPPORT | Ten core files across 03-05/06/07 | Initial 0 | Ten initial IDs; events/health portions applied | Full correction after 03-07; later-owner portions remain |

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

## Executed family slice — 03-02

Full six-file DECODING initial review recorded 12 IDs CR-03-DECODING-001
through012, two BLOCKER and ten WARNING. The authoritative exact rules,
locations and all remaining owner assignments are in 03-DECODING-REVIEW.md.
The family slice repaired its header portion001 (93284c76), metadata comment
portion002 (7cbeed2d), public documentation003 (3064645d), and named verdict
declaration004 (29ddff5e). 003/004 are fixed; 001/002 and005–012 remain open
or partially repaired for Gemini/water. These partial IDs are not closed.
Counter remains initial round0; full correction follows all three slices.
No genuine behavior bug or D-03 reopening was accepted.

CR-004's first non-exported interface remedy passed build/pre-step but hit
two configured private-type-leak findings: actual sandbox audit exit2,
authorized retry exit1/verdict fail. At the released checkpoint, the bounded
coordinator amendment authorized documented exported ValidFamilyValidation
and RejectedFamilyValidation referenced by the existing FamilyValidation
union. Exact valid true/false discriminants and readonly violations remain.
Source plus approved plan amendment committed atomically with normal hooks,
audit0/pass and no unused-export or private-type-leak finding. The failed
attempt remains in the report. No suppression, forced consumer import, extra
source file, runtime feature or invented bug provenance was used.

Fresh strict build and existing whole illegal-water tracer pass89/89 Gemini
cases; missing-required-scope compiler negative remains. Family direct selector
exited0 as declaration-only, not numerical runtime coverage. Final summary
e7ad531c630868846ffab4d4a7be8a5cd918e5d6 and report72584863 are committed.
Parent adjusted only the self-check wording that the generic parser mistook
for a failed self-check; actual prior failed audits remain in Deviations.
Summary verification then passed.

Parent fresh npm run check at clean e7ad531c, Nodev26.11.1,17:29:13–17:29:48
UTC exited0: six static checks,104 scenarios/1156 steps and43 isolated pairs;
merged coverage/direct.lcov refreshed. Exact native captures are
/private/tmp/guardian-phase3-wave2-full-check.log and
/private/tmp/guardian-phase3-wave2-gate.json. Schema drift exit0/blockfalse
with no schema; codebase drift skipped no-structure-md/blockfalse.
Overall DEV-01, full DECODING closure and WINDOWS46 remain pending.

## Executed Gemini slice — 03-03

All Gemini portions from original DECODING IDs are applied, with exact rules,
revision-qualified locations and native history in 03-DECODING-REVIEW.md.
Code commits: 007 b87c55a; header001305ed86; metadata0029ec326b; alias005
a63a9eb; guard0065555069; age00850b5d83; naming01235956f1; seed009294f1c9;
fixture011e944df8; AAA010cd975d2. Report5f3d19f and summarya54cba5 are committed.
Family exports remain; only water001/010 portions are unapplied. These applied
remedies are not an independent full-batch closing count. Round0 remains;
complete correction follows03-04, with original12 IDs and no resets.

Fresh owner88/88; isolated247/247 lines,30/30 functions,85/85 branches, all
100%. Redundant no-throw case removed while retaining the complete illegal-water
result. Four fresh concern seed factories are actually consumed. Narrow
independent tracer/helper review is clear; full batch review remains pending.
Actual emitted JavaScript hashes match the pre-repair behavior baseline.
No new telemetry domain, runtime behavior defect or genuine RED JSON accepted.

Separate controls: initial wrong-scope mutation hit TypeError before decode
assertion and remains explicitly unsuccessful as assertion proof. Subsequent
validation pump-versus-self-test control and healthy-primaryRunning inversion
failed their intended assertions. Every control restored exact source and
rebuilt GREEN. No control is counted as a genuine production defect.
Seed009's first ordinary hook stopped at import grouping before any commit;
corrected fresh checks and ordinary retry passed, without history rewriting.

CR-005 trace-process gap remains explicit: full source reads and two local
use-sites preceded private alias deletion, but no alias-specific required
Fallow trace was run/captured before edit. Public-symbol probes are not that
missing proof; no retrospective compliance is claimed. Runtime/type equivalence
and passing hooks remain bounded evidence. WINDOWS47 registers this open
deviation; earlier WINDOWS46 also stays open for phase/milestone disposition.

Parent full combined gate at cleana54cba5576af5897347e8e8db239d3be65c151f9,
Nodev26.11.1,18:04:06–18:04:42UTC exited0: six static checks,104 Cucumber
scenarios/1156steps and43 isolated pairs; merged coverage/direct.lcov refreshed.
Native log and exact command/time/revision scope are
/private/tmp/guardian-phase3-wave3-full-check.log and
/private/tmp/guardian-phase3-wave3-gate.json. Summary verification passed;
schema drift exited0/blockfalse/no schema; codebase drift skipped
no-structure-md/blockfalse. Overall DEV-01 and Phase3 remain pending.

## Executed water and complete DECODING closure — 03-04

Water repairs: remaining header 001 at 5b4ada4, AAA 010 at 7b8a83c, native
TypeError assertion form 013 at 4aeaef9, and complete independent literal map
form 014 at 93a425d. Typed initial clarification accepted 013/014 as WARNINGs
only; the original joint ordered keys/values already protected mapping. No
weak-map behavior defect or genuine RED was claimed. The original 12-ID
review is preserved separately; initial clarifications increased the opening
inventory to 14, without creating or resetting a correction round.

Full seven-file independent round 1: opening 14, fixed 14, rejected 0, new 1,
reopened 0, closing 1. New 015 WARNING was a pre-existing inaccurate family
owner comment, not a reopened remedy. The coordinator routed its comment-only
repair back to original 03-02-02: 1e8b074, with record e8b99aa. Literal and all
nine compiler negatives remained exact; no production edit or control needed.
Full seven-file round 2: opening 1, fixed 1, rejected/new/reopened 0, closing 0.
No open code ID, SC-03 reopening, non-reducing round or fourth round occurred.
Report 5689cf2 and summary 92ce4c6 preserve all 001–015 rules, locations, actual
fix hashes/paths, native checks and prior histories.

All three source/owner pairs and the Gemini helper received complete
independent rereads and header inspections; family is a declaration-only pair.
Current water/Gemini owners pass 109/109 (21 + 88), whole real decoder probes
for legal 31 and illegal 2 pass 2/2; all three direct selectors exit 0. Water
native compiled LCOV is 62/62 lines, 2/2 functions, 4/4 branches. Gemini
native percentages and current selector establish 100%; historical exact
247/247 line counts remain reported and independently unconfirmed because
that raw count artifact was not retained. Source-mapped representations are
not substituted for that historical record. Complete 0/1/3/7/15/31 map and
threshold 31, emitted behavior and provisional hardware limits are preserved.

No genuine production bug was accepted. Both process deviations WINDOWS
46/47 remain explicitly open and unwaived; code review closure does not claim
perfect past procedure or resolve those historical exceptions.

Parent full npm run check at clean 92ce4c6b2d6fec45aab17787e93c257baa4b3131,
Node v26.11.1, 18:50:04–18:50:41 UTC, exited 0: all six static checks, 104
Cucumber scenarios, 1,156 steps, 43 isolated pairs and refreshed merged LCOV.
Native log and exact command/time/revision are
/private/tmp/guardian-phase3-wave4-full-check.log and
/private/tmp/guardian-phase3-wave4-gate.json. Summary verification passed;
schema gate exit 0/block false/no schema; codebase drift skipped
no-structure-md/block false. Overall DEV-01 and Phase 3 remain pending.

## Executed events and health slice — 03-05

Corrected independent initial reviewer read all ten SUPPORT files, complete
rulebooks, actual callers and headers at 7cfedb24. It accepted ten causes
CR-03-SUPPORT-001–010: four BLOCKER, six WARNING. The authoritative exact
rules, revision-qualified locations, native evidence and ownership are in
03-SUPPORT-REVIEW.md, committed 662f675. No genuine behavior bug, fixed-finding
reopening or D-03 trigger was accepted. One SUPPORT initial counter remains
round 0 across 03-05/06/07; no full correction round has run.

This slice applied event header 001 at eca71a3, backup-event wording 002 at
7b72051, clock units/fixture 003 at 2c8f0ac, union compiler contracts 004 at
a41e481, health header 001 at 9562388, and absence/readonly contracts 005 at
4deb91e. All six causes passed audit, clean exact-file pre-step before normal
foreground commits and ordinary hooks. Header 001 remains shared/open until
HALO/registry/persistence portions are done; 006–010 stay pending later owners.
Applied 002–005 are not independent full-batch acceptance yet.

Events and health are declaration-only: strict positives/meaningful negatives
and their selectors pass without fabricated runtime coverage. The actual
serviceCatalogue owner passes 185/185, zero skips/cancellations. Exact
TrustScope probes in production/test completed; consumer bodies inspected.
Production type tokens and emitted erasure match baseline. No new emitter,
trust default, field meaning, migration, behavior bug or RED JSON was created.

A reviewer was initially dispatched with full inherited history and an explicit
model despite the configured omit/fresh-context contract. The actual accepted
attempt was interrupted and reconciled as terminal cancellation before any
verdict was accepted or reused. A fresh typed reviewer with resolved high
effort and omitted model performed the complete review. This corrected
dispatch attempt is retained in report/summary, not silently erased or treated
as a source finding. One sandbox audit exit 2 was retained before authorized
retry exit 0/pass. It was not claimed as clean. Summary 698460d is committed.

Parent full npm run check at clean 698460d9c3364b9f6a01e9592b084fc9a86af958,
Node v26.11.1, 19:21:19–19:21:56 UTC exited 0: all six static checks, 104
scenarios, 1,156 steps and 43 isolated pairs; merged LCOV refreshed. Native
log and exact command/time/revision are
/private/tmp/guardian-phase3-wave5-full-check.log and
/private/tmp/guardian-phase3-wave5-gate.json. Summary verification passed;
schema gate exit 0/block false/no schema; codebase drift skipped
no-structure-md/block false. Overall DEV-01 and Phase 3 remain pending.
