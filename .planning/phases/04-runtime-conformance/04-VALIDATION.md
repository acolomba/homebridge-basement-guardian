---
phase: "04"
slug: "runtime-conformance"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-14"
---

# Phase 4 — Validation Strategy

This is a planning-only draft for RUN-01. No Phase 4 source repair, full-file
execution review, owner test, mutation, regression RED, direct coverage or full
gate ran during research. Pending rows do not imply missing production behavior.
The planner must bind actual task IDs, wave numbers and threat references before
execution. [VERIFIED: research command inventory; .planning/REQUIREMENTS.md:32]

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

## Proposed Ownership and Sampling

| Batch | Full initial scope | Suggested order | Final independent correction scope |
| --- | --- | --- | --- |
| PORTS | accessoryStore, clock, monotonicClock, timers and all four owners | First | All eight files plus actual additions |
| POLICIES | commandPort, failureLog, retryPolicy and all three owners | After shared ports | All six files plus actual additions |
| TRUST | arrivalAnchors, monitoringHealth and both owners | After shared contracts | All four files plus actual additions |
| ACCOUNT | Complete accountRuntime source and its complete owner | After shared work, or explicit bounded compatibility tasks | Both full files, actual helpers and required external adaptations |
| Coordinator | Reports, inventory, real Git/evidence and current gate | Seal | All current scope and records |

The batch order is a planning recommendation within approved discretion.
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

## Per-Task Verification Map — Unbound Draft

These rows describe prospective verification, not final plan/task IDs or
executed outcomes. The planner must replace the draft IDs and wave placeholders
with real task references. Every cause task needs an exact automated command
and its explicit failure condition. [VERIFIED:
.planning/phases/04-runtime-conformance/04-CONTEXT.md:29-32,59-63]

| Draft task | Batch | Wave | Requirement | Proposed threat | Secure behavior | Command keys / required evidence | Existing input | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DRAFT-INIT | Coordinator | Bind | PROC-01/02/03 | T-04-EVIDENCE | Complete scope, rules and original counters | Concrete inventory/ledger tracer must be authored | No new tracer yet | Pending |
| DRAFT-PORT-CONTRACTS | PORTS | Bind | RUN-01 | T-04-STATE | Meaningful port compiler contracts; no test-only runtime wrapper | TYPE, PAIR-STORE | Existing owner | Pending |
| DRAFT-TIME | PORTS | Bind | RUN-01 | T-04-TIME | Distinct wall/elapsed sources; exact timer execution/cancel | PAIR-CLOCK, PAIR-MONOTONIC, PAIR-TIMERS | Existing owners | Pending |
| DRAFT-COMMAND-CONTRACT | POLICIES | Bind | RUN-01 | T-04-COMMAND | Exact accepted/refused union; required cause; one attempt | TYPE, PAIR-COMMAND; both-project exact traces if changed | Existing owner | Pending |
| DRAFT-LOGGING | POLICIES | Bind | RUN-01 | T-04-PRIVACY | Whole promised lines and per-kind cadence | PAIR-LOG | Existing owner | Pending |
| DRAFT-RETRY | POLICIES | Bind | RUN-01 | T-04-LIFECYCLE | Pending guard, capped delay and root cancellation | PAIR-RETRY | Existing owner | Pending |
| DRAFT-ANCHORS | TRUST | Bind | RUN-01 | T-04-TIME/PRIVACY | Whole persisted bytes/state, restart restoration and cleanup | PAIR-ANCHORS | Existing owner | Pending |
| DRAFT-HEALTH | TRUST | Bind | RUN-01 | T-04-STATE/TIME | Per-device silence, restored anchor, independent clocks | PAIR-HEALTH | Existing owner | Pending |
| DRAFT-ACCOUNT-LIFECYCLE | ACCOUNT | Bind | RUN-01 | T-04-LIFECYCLE/PRIVACY | Current owner, late-start/stop/halt behavior, role registration | BUILD, OWNER-ACCOUNT, PAIR-ACCOUNT | Existing full owner | Pending |
| DRAFT-ACCOUNT-STATE | ACCOUNT | Bind | RUN-01 | T-04-STATE/TIME/REMOVAL | Full canonical/trust readback and callback-before-prune | BUILD, OWNER-ACCOUNT, PAIR-ACCOUNT | Existing full owner | Pending |
| DRAFT-ACCOUNT-COMMAND | ACCOUNT | Bind | RUN-01 | T-04-COMMAND | Exact outcome/body/request and no optimistic canonical state | BUILD, OWNER-ACCOUNT, PAIR-ACCOUNT | Existing full owner | Pending |
| DRAFT-BUG | Owning batch | Conditional | BUG-01 | Relevant owner threat | Active intended RED on unchanged production before GREEN | Actual native target, full patch, complete historical evidence checker | Only if real bug exists | Conditional |
| DRAFT-CORRECTION | Each batch | Bind | PROC-01/02 | T-04-EVIDENCE | Full batch independent review and exact round arithmetic | Report, native checks, stable IDs and reviewed revision | Reports not authored | Pending |
| DRAFT-WAVE | Coordinator | Every code wave | GATE-01 | All owning wave threats | Current combined inputs remain valid | FULL | Existing command | Pending |
| DRAFT-SEAL | Coordinator | Final | RUN-01 / PROC-01/02/03 | T-04-EVIDENCE | Complete scope, current review/gate, truthful provenance | Bound ledger tracer, LICENSE, all touched pairs, FULL | Tracer missing | Pending |

No batch is predeclared clean. No helper or external source edit is preauthorized
by this map alone. A confirmed cause receives explicit same-wave paths and its
own five-file budget before edits. Report/evidence/helper/task-amendment paths
count toward that budget. [VERIFIED:
.planning/phases/04-runtime-conformance/04-CONTEXT.md:83-89]

## Wave 0 Requirements

- [ ] Create the phase review protocol and concrete batch ownership.
- [ ] Create the central ledger with all 20 current files and header/review status.
- [ ] Create batch reports without invented initial findings or clean results.
- [ ] Bind actual task/wave/threat IDs and all automated failure conditions.
- [ ] Author one concrete ledger/provenance tracer with an independent expectation.
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
patch. Validate each current/historical record, recursively preserving
priorEvidence. Commit planning-only evidence before GREEN production edits.
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
