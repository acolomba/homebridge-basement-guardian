---
phase: "04"
slug: "runtime-conformance"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-14"
---

# Phase 4 — Validation Strategy

This is a bound planning strategy for RUN-01, with twenty concrete tasks in ten
serial waves. No Phase 4 source repair, full-file execution review, owner test,
mutation, regression RED, direct coverage or full gate ran during planning.
Pending rows do not imply missing production behavior. Draft/Nyquist flags stay
false until actual execution meets their obligations.

## Test Infrastructure

| Property | Current evidence |
| --- | --- |
| Framework | Native node:test and node:assert/strict |
| Observed Node | v26.11.1 |
| Observed TypeScript | 6.0.3 |
| Configuration | Existing source/test TypeScript projects; strict ESM |
| Quick feedback | Fresh build:test, then the exact compiled owner or named tracer |
| Direct evidence | test:coverage:direct with one source/owner |
| Full combined gate | npm run check |
| Tooling | Existing pre-commit 4.5.1 and Fallow 3.27.0 |
| Duration | Phase 4 durations remain unmeasured; record actual times during execution |

The manifest defines the build/check/direct commands. The existing selector
accepts type-only sources with no executable LCOV record after strict compilation.
It does not fabricate numerical runtime coverage. [VERIFIED:
package.json:35-59; scripts/test-coverage-direct.mjs:137-190]

## Bound Ownership and Sampling

| Batch | Full initial scope | Suggested order | Final independent correction scope |
| --- | --- | --- | --- |
| PORTS | accessoryStore, clock, monotonicClock, timers and all four owners | 04-01/02, waves 1/2 | All eight files plus actual additions |
| POLICIES | commandPort, failureLog, retryPolicy and all three owners | 04-03/04, waves 3/4 | All six files plus actual additions |
| TRUST | arrivalAnchors, monitoringHealth and both owners | 04-05/06, waves 5/6 | All four files plus actual additions |
| ACCOUNT | Complete accountRuntime source and its complete owner | 04-07/08/09, waves 7/8/9 | Both full files, actual helpers and required external adaptations |
| Coordinator | Reports, inventory, real Git/evidence and current gate | 04-10, wave 10 | All current scope and records |

The batch order is the selected planning choice within approved discretion.
ACCOUNT keeps one counter and original IDs across every sequential plan.
Initial review covers each whole batch before its first repair. A plan slice
does not substitute for review of the full 1,283-line source or 3,365-line owner.
[VERIFIED: .planning/phases/04-runtime-conformance/04-CONTEXT.md:76-89]

- **During each cause:** Run the exact owner/tracer and isolated pair command.
- **Before each commit:** Run required Fallow audit and the clean exact-file pre-step.
- **Normal commit:** Preserve the actual foreground hook output, exit and committed paths.
- **After each combined code wave:** Run the full npm check on combined inputs.
- **Before phase verification:** Require a current full result under local-verification.
- **Feedback target:** Use focused tracer feedback within 30 seconds where measured.
  Do not claim that this target is already observed.

This schedule follows the project rulebook. The 2,400-second full-gate limit is
not a passing result. Serial ownership covers builds, source controls, helpers,
Git and shared records. [VERIFIED: skills/local-verification/SKILL.md:7-34;
.planning/phases/04-runtime-conformance/04-CONTEXT.md:59-63]

## Exact Command Keys

Each direct command includes its own fresh strict build. For several sequential
feedback runs, one serialized fresh build can precede compiled owner commands,
provided the coordinator tracks exact unchanged inputs. [VERIFIED:
package.json:35,51,54; skills/local-verification/SKILL.md:19-34]

| Key | Exact command |
| --- | --- |
| BUILD | `npm run build:test` |
| TYPE | `npm run typecheck` |
| PAIR-STORE | `npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts` |
| PAIR-CLOCK | `npm run test:coverage:direct -- src/runtime/clock.ts test/runtime/clock.test.ts` |
| PAIR-MONOTONIC | `npm run test:coverage:direct -- src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts` |
| PAIR-TIMERS | `npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts` |
| PAIR-COMMAND | `npm run test:coverage:direct -- src/runtime/commandPort.ts test/runtime/commandPort.test.ts` |
| PAIR-LOG | `npm run test:coverage:direct -- src/runtime/failureLog.ts test/runtime/failureLog.test.ts` |
| PAIR-RETRY | `npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts` |
| PAIR-ANCHORS | `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts` |
| PAIR-HEALTH | `npm run test:coverage:direct -- src/runtime/monitoringHealth.ts test/runtime/monitoringHealth.test.ts` |
| PAIR-ACCOUNT | `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` |
| OWNER-ACCOUNT | `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js` |
| LICENSE | `node --test --test-reporter=tap dist-test/test/packaging/licenseHeaders.test.js` |
| FULL | `npm run check` |

Compiled owner commands require BUILD first. The compiled-file path comes from
the existing selector's ``return `dist-test/${file.slice(0, -3)}.js`;`` rule.
The license gate covers source licensing; independently inspect complete
headers in owners/helpers and bounded external consumers.
[VERIFIED: scripts/test-coverage-direct.mjs:35-36;
test/packaging/licenseHeaders.test.ts:50-103]

## Per-Task Verification Map — Bound, Not Executed

Every PLAN verify block carries literal root-relative automated commands and an
explicit failure condition. BUILD plus the exact compiled owner gives feedback;
PAIR commands rebuild and check each source alone. Two declaration-only owners
retain honest strict compiler contracts with no artificial runtime denominator.

| Task | Batch | Wave | Requirement | Threat refs | Secure behavior | Commands / evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 04-01-01 | PORTS | 1 | RUN-01, PROC-01/03 | T-04-01/02 | Full eight-file initial review; real persistence shape | BUILD + accessoryStore owner, PAIR-STORE; complete report/headers | Pending |
| 04-01-02 | PORTS | 1 | RUN-01 | T-04-01/02 | Epoch wall-time contract | BUILD + clock owner, PAIR-CLOCK | Pending |
| 04-02-01 | PORTS | 2 | RUN-01 | T-04-03 | Independent elapsed/bigint conversion | BUILD + monotonicClock owner, PAIR-MONOTONIC | Pending |
| 04-02-02 | PORTS | 2 | RUN-01, PROC-02/03 | T-04-04 | Exact timer/cancel; full PORTS correction | BUILD + timers owner, PAIR-TIMERS; complete eight-file review/counts | Pending |
| 04-03-01 | POLICIES | 3 | RUN-01 | T-04-05 | Full six-file initial; exact command union/callers | BUILD + commandPort owner, PAIR-COMMAND; separate project traces | Pending |
| 04-03-02 | POLICIES | 3 | RUN-01 | T-04-06 | Safe whole log stream/per-kind cadence | BUILD + failureLog owner, PAIR-LOG | Pending |
| 04-04-01 | POLICIES | 4 | RUN-01 | T-04-07 | Capped/pending/root-abort retry | BUILD + retryPolicy owner, PAIR-RETRY | Pending |
| 04-04-02 | POLICIES | 4 | RUN-01, PROC-02/03 | T-04-08 | Full six-file correction/counts | BUILD + commandPort/failureLog/retryPolicy owners; terminal report | Pending |
| 04-05-01 | TRUST | 5 | RUN-01 | T-04-09 | Full four-file initial; real storage/restore | BUILD + arrivalAnchors owner, PAIR-ANCHORS | Pending |
| 04-05-02 | TRUST | 5 | RUN-01 | T-04-10 | Actual restart/privacy history; all arrival causes | PAIR-ANCHORS; canonical Git narrative triage | Pending |
| 04-06-01 | TRUST | 6 | RUN-01 | T-04-11 | Two-device whole trust/clock/anchor projection | BUILD + monitoringHealth owner, PAIR-HEALTH | Pending |
| 04-06-02 | TRUST | 6 | RUN-01, PROC-02/03 | T-04-12 | All health causes/full TRUST correction | PAIR-HEALTH; complete four-file review/counts | Pending |
| 04-07-01 | ACCOUNT | 7 | RUN-01 | T-04-13 | Entire source/full owner initial review; restore before launch | BUILD, OWNER-ACCOUNT, PAIR-ACCOUNT; full round0 scope | Pending |
| 04-07-02 | ACCOUNT | 7 | RUN-01 | T-04-13/14 | Lifecycle/poll/rotation/halt/shutdown/secret registration | BUILD, OWNER-ACCOUNT, PAIR-ACCOUNT | Pending |
| 04-08-01 | ACCOUNT | 8 | RUN-01 | T-04-15 | Whole canonical/reported/narrow trust and SC-03 | BUILD, OWNER-ACCOUNT, PAIR-ACCOUNT | Pending |
| 04-08-02 | ACCOUNT | 8 | RUN-01 | T-04-16 | Physical inventory/final check/callback/prune/refusal | PAIR-ACCOUNT | Pending |
| 04-09-01 | ACCOUNT | 9 | RUN-01 | T-04-17 | Exact command request/outcome; no retry/optimism | BUILD, OWNER-ACCOUNT, PAIR-ACCOUNT | Pending |
| 04-09-02 | ACCOUNT | 9 | RUN-01, PROC-01/02/03 | T-04-18 | Every remaining cause/full ACCOUNT correction | PAIR-ACCOUNT; whole source/full owner/additions/counts | Pending |
| 04-10-01 | Coordinator | 10 | RUN-01, PROC-01 | T-04-19 | Real report/blob/Git/native ledger tracer | Exact inline node predicate; RUNTIME_LEDGER_TRACER_OK | Pending |
| 04-10-02 | Coordinator | 10 | RUN-01, BUG-01, GATE-01 | T-04-19/20 | Unique all-scope/history/threat/current-input audit | Exact inline scope/history predicates; LICENSE; FULL | Pending |
| Owning cause task | Any original batch | Conditional | BUG-01 | Actual owning threat | Intended active unchanged-production RED/evidence-before-GREEN | Native TAP + existing current CLI/nested classifier and actual Git ancestry | Conditional |
| Parent combined gate | Coordinator | Every wave 1–10 and phase | GATE-01 | Every owning wave threat | Current combined input, no omitted step | FULL; exact same-session input comparison only | Pending |

No batch is predeclared clean. No helper or external source edit is preauthorized
by this map alone. A confirmed cause receives explicit same-wave paths and its
own five-file budget before edits. Report/evidence/helper/task-amendment paths
count toward that budget. [VERIFIED:
.planning/phases/04-runtime-conformance/04-CONTEXT.md:83-89]

## Wave 0 Requirements

- [x] Author the phase review protocol and concrete batch ownership (planning only).
- [x] Author the pending central ledger with all 20 exact files and header/review status.
- [ ] Create batch reports without invented initial findings or clean results.
- [x] Bind actual task/wave/threat IDs and all automated failure conditions.
- [x] Author concrete ledger/provenance and exact unique-inventory predicates in 04-10 (not executed).
- [ ] Verify the forced isolation sentinel directly before executor dispatch.
- [ ] Record the actual source baseline and applicable same-session check evidence.

Existing runner, compiler, selector and ten owner files are available.
No framework installation or speculative helper creation is required.
[VERIFIED: package.json:35-86;
.planning/phases/04-runtime-conformance/04-CONTEXT.md:154-160,175-184]

## Native Evidence and Failure Conditions

A source owner must run alone with full direct lines, functions and branches.
For declaration-only modules, require strict meaningful compiler positives and
negatives plus the selector's honest acceptance. No runtime denominator is
invented. [VERIFIED: scripts/test-coverage-direct.mjs:137-190;
skills/typescript-unit-testing/SKILL.md:204-225]

A genuine bug requires an executed active target failing its intended assertion
on unchanged production. Retain complete TAP, command, real exit, target,
expected/actual, versions, timestamps, source commit/blob identities and full
patch. Validate each current on-disk record with the existing native
check tdd-red-evidence command, then each nested archived record with the same
installed classifyRedEvidence function, recursively preserving priorEvidence.
Audit actual source/evidence/fix Git ancestry and unchanged production blobs.
Commit planning-only evidence before GREEN production edits.
No failing code, skipped regression or hook bypass enters Git.
[VERIFIED: .planning/phases/04-runtime-conformance/04-CONTEXT.md:38-44;
.planning/phases/03-device-and-persistence-conformance/03-REVIEW-PROTOCOL.md:155-190]

Assertion controls are separate. Require the intended named failure, exact
source-byte restoration, a fresh rebuild and GREEN. Missing/filtered targets,
compile/import/setup errors, unrelated TypeErrors, cancellations and permission
errors supply no intended assertion proof. Preserve unsuccessful attempts.
[VERIFIED: .planning/phases/03-device-and-persistence-conformance/03-REVIEW-PROTOCOL.md:155-196]

D-03 pauses ALL work on a nonreducing open count, a reopened fixed ID, or the
fourth correction round, even clean. Retain original IDs/counters across causes
and account slices. Record real counts before further edits or dispatch.
[VERIFIED: .planning/phases/04-runtime-conformance/04-CONTEXT.md:33-37,76-81]

## Manual-Only Judgments and Limits

04-10's inline audit compares exact unique twenty core paths and ten pairs,
current runtime tracked/untracked inventory, all actual helpers/adaptations,
current review/header blobs, every native pair/commit/history and continuous
rounds. The new generated 04-SEAL-AUDIT.json is an evidence output excluded by
the actual formatter/ESLint/Fallow/TypeScript/build selectors. Retain its real
before/after metadata difference; no claim that the JSON was unchanged or
general JSON reuse shortcut follows. Exact checkedInputManifest path/blob
comparison covers every other tracked/untracked path except planning Markdown,
with raw dirty diff/untracked snapshots and actual tool versions. Any source,
support, configuration, dependency, runtime or tool change requires a new full
parent gate under local-verification. No Phase04 automated outcome is observed.

| Item | Treatment |
| --- | --- |
| Rulebook interpretation and rejected candidates | Independent complete source/rule reading with concrete evidence |
| Phase-end taxonomy/prohibition flags | Derive from actual Phase 4 plans; route genuine unresolved human judgments without inheriting Phase 3 answers |
| WINDOWS 46/47 | Remain OPEN/unwaived historical process gaps |
| Opaque-key assumption | Preserve scoped log/persistence treatment; sanitize committed/public examples |
| Vendor protocol, hardware and real-home gates | Outside this phase; no live run, install or release claim |

These limits come from the approved context. They do not create a new planning
permission checkpoint. [VERIFIED:
.planning/phases/04-runtime-conformance/04-CONTEXT.md:91-104,199-207]

## Prior Evidence — Not a Phase 4 Result

Phase 3's final report records npm check at
cf04e71b85ce45bcdd73fb861d77d88e22d3ebe5 on Node v26.11.1, exit 0,
104 scenarios, 1,156 steps and 43 isolated pairs. Research did not rerun that
gate. The coordinator must check exact inputs and session applicability before
reuse. Selected pair runs do not refresh the merged full-gate LCOV.
[VERIFIED: .planning/phases/03-device-and-persistence-conformance/03-VERIFICATION.md:205-209;
scripts/test-coverage-direct.mjs:359-364]

Research-only Fallow evidence is separate: nine shared symbols, independently
queried once per compiler project, 18 exit-0 complete results. It identifies
consumer scope; it proves no conformance repair, safe deletion, owner test or
coverage result. Native capture:
`/private/tmp/guardian-runtime-research-fallow.json`.
[VERIFIED: research native Fallow captures]

## Validation Sign-Off

- [ ] Every real task has an exact automated command or Wave 0 dependency.
- [ ] Every command has a concrete failure condition.
- [ ] No three consecutive tasks lack automated feedback.
- [ ] Every full batch and actual helper/external addition receives independent review.
- [ ] Every edited executable pair has isolated 100% metrics.
- [ ] Declaration-only pairs retain meaningful compiler tests and honest reporting.
- [ ] Shared-contract changes have separate complete project traces and actual caller reads.
- [ ] Private deletions have exact pre-edit alias/member evidence.
- [ ] Genuine RED histories and assertion controls remain distinct and complete.
- [ ] Stop counters and findings arithmetic reconcile without resets.
- [ ] Required full wave and phase gates have current actual results.
- [ ] Header inspection covers owners/helpers, beyond the source-only license gate.
- [ ] Phase-specific unresolved judgments and historical limits remain visible.
- [ ] No watch command, live vendor/hardware run or install is included.
- [ ] Actual feedback latency is recorded.
- [ ] wave_0_complete and nyquist_compliant change only after their obligations are met.

**Approval:** Pending. This draft claims no executed PASS or Nyquist compliance.


## Executed seal preparation at 3ed5af0

This current execution projection supplements the historical draft above.
It does not change its frontmatter, human approval or Nyquist flags.

| Check | Actual result | Native evidence |
| --- | --- | --- |
| Tracer | raw0; RUNTIME_LEDGER_TRACER_OK | final-native/tracer-01 |
| Automated canonical seal | raw0; RUNTIME_SEAL_AUTOMATED_AUDIT_OK | final-native/seal-03 |
| Canonical history | raw0; RUNTIME_HISTORY_AUDIT_OK | final-native/history-02 |
| Original99 integration and ten scope/D03 rounds | 308 checks, zero failures | final-integration-pass-1792164823783.json |
| License fresh build and owner | raw0;5/5 | focused-current/license-build-and-owner.json |
| Applicable parent full gate | raw0;104 scenarios/1156 steps/43 isolated pairs | /private/tmp/guardian-phase4-preseal-full-gate.* |

Relative native paths above resolve under
/private/tmp/guardian-04-10-canonical/. Full argv, UTC bounds, actual raw exits,
stdout/stderr, Node/npm, exact input bodies/modes and compiled inputs are retained.
The canonical record is audited again after final metadata updates.

The first history projection omitted separate native stdout streams and failed
with INVALID_RED. The first automated seal projection lacked ACCOUNT inventory
membership; the second lacked comparator inputEvidence fields. These failed
attempts are retained as history-01/seal-01/seal-02. Corrected projections use
the original unchanged evidence. No classifier, predicate, report or raw payload
was changed to obtain a pass. Earlier TMP setup failures remain in the actual
tool transcript; missing separate UTC envelopes were not reconstructed.

Current scope is34 exact reviewed paths with full applicable headers; all87
findings are independently closed. Ten whole rounds retain the PORTS round2
stop and narrowly authorized009 resolution, plus ACCOUNT's continuous counter3.
The record includes27 genuine RED identities/nine bug episodes,39 maintenance
attempts/43 intended targets, eight seed outcomes and31 numeric threats plus SC.
Original threat-ID collisions remain plan/revision-qualified. Current caller,
rulebook and checked-input comparisons support review/gate reuse.

The user accepted only the exact021/022 unknown audit exits and008 post-audit
title change. Null exits, original passJSON/commands, exact title patch, unknown
inner times and missing auxiliary metadata remain explicit. Current Fallow and
current gate evidence are separate from these historical qualifications.

The full-gate reference is2ffeb331eb60adf1ec47bec1ef909ad12184d4fd,
UTC2026-10-16T07:59:52.668809+00:00→08:00:48.586425+00:00,
Node26.11.1/npm11.20.0. Exact executable inputs remain unchanged; only planning
Markdown and this declared generated seal output differ. The generated output
is excluded only by the exact approved predicate. Other JSON remains checked.
Compiled inventory is397 current files:130 dist and267 dist-test; the original
267-file historical capture described dist-test only.

Three actual E/P human judgments, parent final gate, goal/security/Nyquist
verification, SUMMARY and shared advancement remain pending. The original
equations remain edges1=lifted0+flagged1 and prohibitions2=authored2+omitted0.
No new descriptor, serializer, survey or inherited Phase3 approval is supplied.
RUN-01 remains Pending; WINDOWS46–58 remain OPEN/unwaived. No vendor/hardware,
install, release or cross-platform runtime certification is claimed.
