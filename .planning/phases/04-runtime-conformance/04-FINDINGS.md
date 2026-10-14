# Phase 04 findings ledger

Milestone: code-review-sweep. Requirement RUN-01 remains Pending.
Current through 04-01: complete PORTS initial review, four applied repairs,
one restored assertion control and the combined-wave gate are recorded below.
Other batches remain pending; no genuine production bug has been confirmed.
The parent coordinator alone consolidates actual reports into this ledger.

## Full current inventory

Initial source/test baseline: 008218be4badf44455ab35906f1dfcff06089bf8.
Exactly twenty initial core paths form ten mirrored pairs. PORTS has full initial
review and complete-header inspection; other batches remain pending. ACCOUNT initial sizes are 1,283 source
lines and 3,365 owner lines; line-count changes never shrink the full review.

| Batch | Exact path | Scope | Full initial review | Current full correction | Header |
| --- | --- | --- | --- | --- | --- |
| PORTS | src/runtime/accessoryStore.ts | core | 6f475a0; full file/header | Pending | Applied; independent correction pending |
| PORTS | test/runtime/accessoryStore.test.ts | core | 6f475a0; full file/header | Pending | Applied; independent correction pending |
| PORTS | src/runtime/clock.ts | core | 6f475a0; full file/header | Pending | Applied; independent correction pending |
| PORTS | test/runtime/clock.test.ts | core | 6f475a0; full file/header | Pending | Applied; independent correction pending |
| PORTS | src/runtime/monotonicClock.ts | core | 6f475a0; full file/header | Pending | Nonconformant; repair pending |
| PORTS | test/runtime/monotonicClock.test.ts | core | 6f475a0; full file/header | Pending | Nonconformant; repair pending |
| PORTS | src/runtime/timers.ts | core | 6f475a0; full file/header | Pending | Nonconformant; repair pending |
| PORTS | test/runtime/timers.test.ts | core | 6f475a0; full file/header | Pending | Nonconformant; repair pending |
| POLICIES | src/runtime/commandPort.ts | core | Pending | Pending | Pending |
| POLICIES | test/runtime/commandPort.test.ts | core | Pending | Pending | Pending |
| POLICIES | src/runtime/failureLog.ts | core | Pending | Pending | Pending |
| POLICIES | test/runtime/failureLog.test.ts | core | Pending | Pending | Pending |
| POLICIES | src/runtime/retryPolicy.ts | core | Pending | Pending | Pending |
| POLICIES | test/runtime/retryPolicy.test.ts | core | Pending | Pending | Pending |
| TRUST | src/runtime/arrivalAnchors.ts | core | Pending | Pending | Pending |
| TRUST | test/runtime/arrivalAnchors.test.ts | core | Pending | Pending | Pending |
| TRUST | src/runtime/monitoringHealth.ts | core | Pending | Pending | Pending |
| TRUST | test/runtime/monitoringHealth.test.ts | core | Pending | Pending | Pending |
| ACCOUNT | src/runtime/accountRuntime.ts | core | Pending | Pending | Pending |
| ACCOUNT | test/runtime/accountRuntime.test.ts | core | Pending | Pending | Pending |

Initial helper inventory is empty. Add every actual helper and every narrowly
required external adaptation as its own exact row before edits, with owning
task/wave, revision/blob, full-review evidence and complete header evidence.
No source-only license result substitutes for owner/helper header inspection.

## Batch reports and continuous counters

| Batch | Plans | Report | Initial review | Last correction round | Open IDs |
| --- | --- | --- | --- | --- | --- |
| PORTS | 04-01/02 | 04-PORTS-REVIEW.md | 7 accepted at 6f475a0 | 0; partial repairs only | 005/006/007; 3 |
| POLICIES | 04-03/04 | 04-POLICIES-REVIEW.md | Pending | Not started | Unknown until review |
| TRUST | 04-05/06 | 04-TRUST-REVIEW.md | Pending | Not started | Unknown until review |
| ACCOUNT | 04-07/08/09 | 04-ACCOUNT-REVIEW.md | Pending | Not started | Unknown until full review |

D-03 requires opening/fixed/rejected/new/reopened/closing ID sets/counts for each
independent full correction. No-progress with open findings, a reopened fix, or
round four even clean pauses ALL work before further edits/builds/dispatch.
ACCOUNT keeps one counter across all slices and any added owning cause tasks.

## Candidate triage — no preaccepted finding

| Candidate | Review question | Owning task | Disposition / evidence |
| --- | --- | --- | --- |
| S-04-01 | accessoryStore compiler positives/negatives versus tests of a literal recorder | 04-01-01 | Accepted CR-04-PORTS-002; compiler repair applied |
| S-04-02 | CommandOutcome inline-object union against interface/public constituent rules | 04-03-01 | Pending |
| S-04-03 | Optional versus required-present undefined; actual exhaustive public shape | Every affected cause, coordinated in 04-09-02 | Pending |
| S-04-04 | Readonly advice versus interface rule scope and actual mutation contract | Every affected cause, coordinated in 04-09-02 | Pending |
| S-04-05 | Count/negative/single-field checks versus each complete independently expected promise | Every owner, ACCOUNT 04-07 through 04-09 | Pending |
| S-04-06 | In-flight command-cancellation title versus actual stop/send/root-signal setup | 04-09-01 | Pending |
| S-04-07 | Arrival absence/restart/seeding narration versus canonical shipped history | 04-05-02 | Pending |
| S-04-08 | Runtime identifier-privacy narration versus scoped permission and unconfirmed opaque-key premise | 04-07-02; 04-09-02 | Pending |

These questions do not limit complete style/comment/writer/reviewer review.
Each gets fixed/rejected with exact current rule/source evidence and accepted
stable finding IDs where applicable. A research example is not proof of a bug.

## Stable findings

| ID | Requirement | Exact rule/section | Initial revision:path:line | Current revision:path:line | Severity | First reviewer | Disposition/reason | Native checks/raw exits | Source/evidence/fix commits and paths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Seven PORTS IDs were independently observed at 6f475a0. The complete
04-PORTS-REVIEW.md retains each exact rule, revision-qualified initial/current
location, severity, observer, blobs and native command mapping. Its current
disposition table at 84f4ca8 is authoritative: 001/002/003/004 repaired pending
full independent correction; 005/006/007 remain open. Cause commits are
227c799, ce36088, fd53a74 and 84f4ca8 respectively. Initial 2 BLOCKERs +
5 WARNINGs = 7; 4 applied, 0 rejected/new/reopened, 3 continuing (1 BLOCKER,
2 WARNINGs). Counter remains 0; no full correction or clean batch is claimed.
S-04-03/04 were rejected for PORTS only; later batches retain their obligations.
S-04-05 accepted as CR-04-PORTS-006, with other owners still pending.
No rows are allocated before actual independent observation.
Use CR-04-PORTS-NNN / POLICIES / TRUST / ACCOUNT per protocol.

## Genuine bug history and separate controls

No Phase04 bug is accepted. Conditional pair RED files are declared by the
owning plans. For each actual bug retain the active intended failure on
UNCHANGED production, complete native TAP/command/raw exit/target/expected/
actual/semantic assessment/versions/times/blobs/full test patch, all recursively
nested priorEvidence, evidence-only commit BEFORE minimum GREEN and active test.
Classifier success and independent actual Git ancestry/blob semantics are both
mandatory. Controls remain separately labeled; restore exact bytes, rebuild
and prove GREEN. No failing/skipped code commit or fabricated failure.

## Checks and threat dispositions

All Phase04 rows are Pending. Record exact command, raw exit, revision/blobs,
Node/runtime, scope, timings and dirty/untracked input evidence. Record each
normal hook/clean pre-step and raw Fallow recorded-base audit. Pair evidence
is isolated; declaration-only selectors have no invented numerical coverage.
The parent owns every full combined-wave and phase npm run check.

T-04-01 through T-04-20 and reserved T-04-SC are planned review obligations,
not observed mitigation passes. Later added surfaces extend actual inventory.

## Unresolved probe and prohibition judgments

E-04-01: deterministic RUN-01 category unclassified, status unresolved,
verification/resolution/reason null; probe unclassified — review manually.
Actual equality: edges 1 surfaced = 0 lifted + 1 flagged assumption.
P-04-01 safety and P-04-02 truthful runtime completion are projected through
the existing projectProhibitions serializer into 04-10. Both remain unresolved,
descriptorless, unverified/flagged; prohibitions 2 = 2 authored + 0 omitted.
No inherited Phase3 answer or invented descriptor resolves them. At the seal
parent presents actual remaining Phase04 judgments with evidence/limits.

## Historical evidence limits retained

WINDOWS46/47 remain OPEN/unwaived: 18e8b83 clean pre-step repetition and a63a9eb
exact private-alias pretrace gaps. Three early hook streams lack separate JSON;
original output is the retained limit. Historical Gemini247 remains unconfirmed;
current273 compiled and248 merged are distinct representations. Phase3 closed
after actual three judgments at2716926; they do not preapprove Phase04.
Prior full gate cf04e71/Node26.11.1/exit0/104scenarios/1156steps/43pairs is prior
baseline only; exact unchanged inputs and session evidence govern any reuse.
No live vendor/hardware/private-data/install or later subsystem completion claim.

## Coordinator seal

04-10 produces 04-SEAL-AUDIT.json from actual reports/Git/native results.
It proves exact unique twenty core paths and ten pairs plus all actual additions,
full scope/header provenance, stable IDs/rules/locations/dispositions/counts,
all threat/evidence histories and final checked inputs. Automated readiness
does not supply pending human judgments or authorize shared-state advancement.

## Coordinator wave 1 evidence

At clean 4a69d1434c4cb682c40dbf1a6f757dd127c78dbb, `npm run check`
returned 0 on Node v26.11.1, 2026-10-14T23:05:55.982633Z to
23:06:31.058351Z. Six static checks, 104 Cucumber scenarios / 1156 steps
and all 43 isolated pairs passed. Native full output and metadata are
`/private/tmp/guardian-phase4-wave1-full-check.log` and
`/private/tmp/guardian-phase4-wave1-gate.json`. This is current combined-wave
evidence, not inherited Phase3 evidence; RUN-01 remains Pending.

Clock assertion control returned seconds temporarily: strict typecheck/lint
passed, native TAP returned 1 with both intended wrong-unit assertions.
Exact source blob c6b98a6e2c6863ae0a567d38f1665e40fceb122b was restored,
then fresh build, two cases and isolated coverage passed. This is a separate
restored control, not genuine bug RED. Store is declaration-only with strict
positive/negative compiler contracts and honest selector acceptance.

All four cause commits have clean first pre-steps before staging and passing
normal hooks. The cause-002 sandbox audit exit 2 remains historical failure;
authorized retry exit 0/verdict pass supplies the actual audit result. Complete
native records live under guardian-04-ports-initial-native and
guardian-04-ports-fix-native in /private/tmp. No helper, API/body change,
new package, source control mutation or new process-window waiver is claimed.

The first generic summary advisory mistook two test commands for file paths.
Explicit real output paths corrected its selection; recheck passed all four
checks. No runtime evidence changed. Full PORTS correction follows 04-02.
