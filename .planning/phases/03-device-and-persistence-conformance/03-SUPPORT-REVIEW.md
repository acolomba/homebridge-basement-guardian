# SUPPORT conformance review

Milestone: code-review-sweep. Requirement: DEV-01. Initial revision:
7cfedb24f9ce172a9a19dd651d9e0b1c8b20d8ea. Current applied event/health revision:
4deb91efab59f0059ab270f5dfc52d56aeba3eac. This report starts the one SUPPORT
inventory and counter retained through plans 03-05, 03-06 and 03-07.
Current HALO/registry applied revision: 6ad32c3f112c9e9184264a498be26d1d666e6a72.

## Independent initial review — round 0

Author: /root/phase3_events_health/support_initial_review_corrected, role
gsd-code-reviewer, fresh context, resolved high effort, model field omitted.
The reviewer independently read all ten complete files, AGENTS, the complete
TypeScript style, comments, unit writer, unit reviewer and local-verification
rulebooks, canonical intel decisions, current context/protocol/findings and
prior 03-01 through 03-04 summaries. It read actual consumer bodies. Its
terminal initial verdict found ten causes: four BLOCKER and six WARNING.
It established no genuine production behavior bug, fixed-finding reopening
or D-03 stop trigger. No build, mutation, installation, Git write or report
write ran in that read-only review.

The initial inventory is 10 open causes. Applied remedies below are pending
full independent SUPPORT correction acceptance after 03-07. They do not
establish a closing count. No correction round has run or been reset.

## Complete file and header inventory

Initial locations in this table are all at 7cfedb24. Current event/health
locations are at 4deb91ef. Every original file was read in full, including its
header. MIT original-work attribution is grounded in LICENSE and NOTICE.
The packaging gate checks source SPDX only; it does not prove test headers.

| File | Initial header | Current header / ownership |
| --- | --- | --- |
| src/device/events.ts | 1–15: MIT SPDX, no separate copyright or spacing | 1–21: approved sections applied; 03-05 |
| test/device/events.test.ts | 1: starts with imports, all sections absent | 1–9: approved sections applied; 03-05 |
| src/device/health.ts | 1–16: MIT SPDX, no separate copyright or spacing | 1–22: approved sections applied; 03-05 |
| test/device/health.test.ts | 1: starts with imports, all sections absent | 1–9: approved sections applied; 03-05 |
| src/device/halo.ts | 1–17: MIT SPDX, no separate copyright or spacing | 1–22 at 6ad32c3f: approved sections applied; 03-06 |
| test/device/halo.test.ts | 1: starts with imports, all sections absent | 1–7 at 6ad32c3f: approved sections applied; 03-06 |
| src/device/registry.ts | 1–11: MIT SPDX, no separate copyright or spacing | 1–16 at 6ad32c3f: approved sections applied; 03-06 |
| test/device/registry.test.ts | 1: starts with imports, all sections absent | 1–7 at 6ad32c3f: approved sections applied; 03-06 |
| src/persistence/accessoryContext.ts | 1–25: MIT SPDX, no separate copyright or spacing | Pending 03-07; unchanged |
| test/persistence/accessoryContext.test.ts | 1: starts with imports, all sections absent | Pending 03-07; unchanged |

## Stable findings and dispositions

All IDs have requirement DEV-01 and first review round 0 by the corrected
reviewer above. Initial locations below are qualified by 7cfedb24; current
applied locations are qualified by 4deb91ef. Pending-owner files still have
their original bytes. Distinct causes retain distinct IDs across later slices.

### CR-03-SUPPORT-001 — WARNING — Complete headers

Rule: 03-CONTEXT D-01; protocol “Full rulebooks, review and findings”;
Google style “Files and modules.” Locations: all ten header rows above.
Five sources lack separate copyright sections; five owners lack every header
section. Preserve MIT and essential context; apply SPDX first, separate
Copyright (c) 2026 Alessandro Colomba and overview JSDoc sections, with one
blank line between sections. Events source/owner applied at
eca71a386c0d82c913d75e5144b4533547acb2ff; health source/owner applied at
95623884bb892b1a11097b65e52a67e88ea25315. Both exact pair commits passed
audits, clean pre-steps and normal hooks. HALO sections applied at
72c4574b9737d9b35e37e52296223f62d52acfee; registry sections applied at
7d79ac127dc7d8cc0062d8bf3e5bdc6689b208a7. Their bounded independent preflight
passed at 6ad32c3f. Persistence remains unapplied; full correction acceptance
is pending. This shared ID is not closed.

### CR-03-SUPPORT-002 — WARNING — Backup activation cause

Rule: canonical C-001/D-010; comments “Prose”; Google style “Comments and
documentation.” Initial src/device/events.ts:30 says backup operation means
the primary pump did not cope. An activation can occur during self-test;
the interface establishes no cause. Minimum repair describes backup start
alone. Applied at 7b72051a49671de6a62e5bd1a3f02104ff5c60a3, only that source;
current :35–36. Compiler/selector and hooks passed. Documentation maintenance,
not proof of a runtime defect; final independent acceptance remains pending.

### CR-03-SUPPORT-003 — WARNING — Distinct clock examples

Rule: context D-05; canonical D-010 and actual pumpRecords conversion;
unit writer “Test data”; comments accurate domain language. Initial events
owner :12,18–23 uses a millisecond-shaped device timestamp; related source
:21–22,43–49 leaves units implicit. Applied at
2c8f0ac0ae7033ac88c432ef35c87c8d70201e21 to the event pair. Current owner :21–22
uses local 1_700_000_777_000 milliseconds and device 1_700_000_000 Unix seconds;
source :26 and :53–54 state their units. No conversion, brand or emitter added.
This fixture/comment repair retains the existing numeric contract. The
event-clock audit's actual initial exit 2 and retry are preserved below.
Final independent acceptance remains pending.

### CR-03-SUPPORT-004 — BLOCKER — Public event union protection

Rule: unit writer/reviewer “Patterns — Type-only modules” and central
discrimination requirement; protocol meaningful compiler contracts. Initial
events owner :14–33 has complete positives for individual interfaces, but
only primary-start satisfies DeviceEvent. Removing another variant from the
union would still compile. Applied at a41e48153859f6a0cda23b727322d3eb9427f73e,
only test/device/events.test.ts. Current :35–42 adds complete backup, self-test
and recovered union positives; :44–64 preserves four omission negatives and
adds numeric local/device clock negatives. Strict compilation and declaration
selector pass. No artificial runtime test/control or genuine bug RED was
created. Final independent acceptance remains pending.

### CR-03-SUPPORT-005 — BLOCKER — Health absence/type protection

Rule: unit writer/reviewer “Patterns — Type-only modules” and discrimination;
protocol meaningful trust/absence contracts. Initial health owner :6–26 does
not reject omitted required lastTrustedAt/lastReceivedAt, invalid reason or
clock type, and never supplies a genuinely readonly list. Applied at
4deb91efab59f0059ab270f5dfc52d56aeba3eac, only test/device/health.test.ts.
Current :15,29 accepts readonly UntrustedScope[]; :39–57 adds required-clock
omission, unsupported reason and numeric-clock negatives. Original four
negatives, explicit undefined positives, empty list and unavailable state
remain. Source unions/member mutability were not changed. Declaration
selector and fresh real serviceCatalogue owner pass; final acceptance pending.

### CR-03-SUPPORT-006 — WARNING — Registry anonymous verdict objects

Rule: Google style “Types”: object types use interfaces. Initial
registry source :19–22 uses three inline object alternatives in FamilyOutcome.
Minimum remedy is documented named verdict interfaces with the same public
union/discriminants/members/generic/mutability. The configured
private-type-leaks:error rule matters; the earlier family private-interface
attempt is not a compliant analog. The coordinator amended 03-06 before edits
to authorize documented exported ImplementedFamilyOutcome<T>,
UnsupportedFamilyOutcome and UnknownFamilyOutcome. Applied at
75f02e93913ac37ac376b4de7c290a375e391b62 with that existing plan amendment;
current source :23–43 at 6ad32c3f. Exact original generic, tags, fields and
mutability remain. No default generic, readonly conversion, forced import,
suppression or runtime change. Configured export/type/private-leak check
has zero issues. Bounded preflight passed; full correction remains pending.
No dispatch defect or accepted behavior bug exists.

### CR-03-SUPPORT-007 — WARNING — HALO ordinary test phases

Rule: unit writer/reviewer “Case structure”: act & assert applies to the
single throwing/rejection expression. Initial HALO owner :15–23 uses
that marker for constant assertions. Minimum remedy separates ordinary
phases for the retained product-name case; coordinate with 010 rather than
expanding the redundant identity case. Applied at
8847f1c195d23c5af24ab8d021d2f318a925a448, only HALO owner; current :23–31
at 6ad32c3f. Ordinary arrange/act/assert and independent product-name literal
remain. Bounded preflight passed; full correction remains pending.

### CR-03-SUPPORT-008 — BLOCKER — Independent registry HALO expectation

Rule: unit writer/reviewer “Assertions”: independent expected values and
isolated pairing. Initial registry owner :42–50 obtains both its
lookup input and identity/name expectation from HALO production constants.
A coordinated wrong constant could pass this pair. Minimum remedy uses
literal wayneWaterHalo and the independent complete unsupported result with
Wayne Water HALO. Applied at 6ad32c3f112c9e9184264a498be26d1d666e6a72,
only registry owner; current :50–60. Whole Gemini binding and unknown outcomes
remain. Bounded preflight passed; full correction remains pending. Existing
constants are correct, so this is assertion maintenance rather than a genuine
production bug.

### CR-03-SUPPORT-009 — BLOCKER — Persistence source-prose scaffolding

Rule: unit writer/reviewer “Production design for tests” and “Patterns —
Type-only modules”: exports and compiler contracts. Initial/current context
owner :68–144 reads source and parses private docblocks in four runtime cases.
Keyword booleans do not establish the asserted meaning; the local-time case
also passes prose that permits that comparison. Minimum remedy removes the
source-reading/parser runtime scaffold, preserves meaningful compiler checks
and strengthens required absence/type contracts as justified. Actual clock
conversion and mutation remain in pumpRecords and its real owner. Pending
original persistence owner 03-07. No persisted-value/recovery behavior bug
has been established and no helper need has been confirmed.

### CR-03-SUPPORT-010 — WARNING — Redundant HALO identity runtime case

Rule: unit writer “Patterns — Do not test what a gate already enforces.”
Initial HALO owner :15–18; source :20–23. The runtime constant's direct
assignment already has the exact literal type wayneWaterHalo. Retain meaningful
compiler positive/negatives and independent runtime product-name assertion;
remove this redundant identity case without changing the production constant.
Applied at bb6d16593a14d72ebac2dd5f6b15aed6bc12a7df, only HALO owner.
Current :16–21 preserves the positive and both negatives; :23–31 retains
the independent product-name case. Source constant remains :28 at 6ad32c3f.
Bounded preflight passed; full correction remains pending.

## Rejected and bounded contract candidates

- Required present undefined fields are deliberate contracts. Do not convert
  UntrustedScope.lastTrustedAt, DeviceHealth.lastReceivedAt,
  PumpObservation.lastActivationAt or either watermark to optional merely
  from the style preference. Real constructors carry explicit absence.
- The Google readonly property rule applies to classes, not every interface.
  Preserve the readonly health list; pumpRecords mutates persisted observations
  and watermarks. No interface-wide readonly conversion is justified.
- Optional persisted pump/watermark records and an unearned test-activity label
  distinguish absent from seeded/earned data. Preserve them without defaults,
  migration or inferred false label.
- Events have intentional nonconsumption under .fallowrc.json. Production
  DeviceEvent has no consumer; that does not authorize deletion or a new emitter.
- HALO is identified and unsupported; no profile/adapter/command meaning added.
- Registry logging has no established defect. The platform calls shouldLog
  when explaining nonimplemented outcomes; repeat/change/other-device scalar
  promises remain valid. Whole kind-array comparison already protects its
  stated kind promise; extra negative/uniqueness assertions are redundant.
- No concern seed helper is justified after persistence runtime scaffold
  removal. Do not create a helper speculatively.
- No prior closed STATE/DECODING cause or SC-03 reopened. These readings and
  repairs do not reset their counters or overturn their verdicts.

## Exact consumers and actual data use

The corrected reviewer read full relevant caller bodies: serviceCatalogue
isRowTrusted/isRowPublishable/isRowFullyTrusted/decodedGroup/trustedGroup;
basementGuardian violation narrowing, precedence, untrustedScopesOf, marking,
trusted-time recording, observation construction and update; accountRuntime
commandBodyOf/monitoringPathNow/dispatch/path getter; platform discovery,
skipped-outcome explanations and context composition; complete pumpRecords
resumption, seeding, recovery, timestamp conversion/classification and writes.
Trust loss remains per current scope, and valid retained values do not become
normal defaults. Device clocks are compared with their device watermarks;
recovered activation display timestamps convert once to milliseconds.

Reviewer read-only Fallow queries for FamilyOutcome, PumpObservation and
UntrustedScope completed independently in production/test projects, exit 0.
Production MonitoringPath locates runtime; DeviceEvent locates no consumers.
A preliminary combined-project query selected production and was not counted
as separate test-project evidence. These findings support initial triage,
not permission for an untraced later registry/context type edit.

The fixer separately ran installed Fallow help then exact TrustScope impacts
before edits at 7cfedb24, both exit 0/status complete/completeness complete:
node_modules/.bin/fallow dead-code --type-aware --symbol-impact
src/device/health.ts:TrustScope --type-aware-project tsconfig.json --format
json --quiet, and the same command with tsconfig.test.json. Production has
four direct consumers (basementGuardian, serviceCatalogue, family, Gemini);
test project has eight including four owners. Captures:
/private/tmp/events-health-fixer-trust-production.json and -trust-test.json.
No source declaration/export/name/signature or alias changed. No external
consumer adaptation or alias removal was needed. Guard exit 0 reports no
configured zones/rule packs; this is not a measured compliance result.

## Actual code commits and native checks

Fixer: /root/phase3_events_health/events_health_fixer, role gsd-code-fixer,
fresh context, resolved high effort, model omitted. It read complete owning
files/rulebooks and consumers. Only four event/health paths were edited.
Each cause passed a recorded-baseline Fallow audit against 7cfedb24, an exact
SKIP=npm-check pre-commit run --files pre-step with exit 0 before staging and
commit, and an ordinary foreground git commit with normal check:commit hooks.
All six native commits exited 0. Actual Git objects match these paths, with
no tracked deletion. No formatter changed these pre-step inputs.

| Cause/task | Commit | Actual paths |
| --- | --- | --- |
| 001 event / 03-05-01 | eca71a386c0d82c913d75e5144b4533547acb2ff | src/device/events.ts; test/device/events.test.ts |
| 002 / 03-05-01 | 7b72051a49671de6a62e5bd1a3f02104ff5c60a3 | src/device/events.ts |
| 003 / 03-05-01 | 2c8f0ac0ae7033ac88c432ef35c87c8d70201e21 | event pair |
| 004 / 03-05-01 | a41e48153859f6a0cda23b727322d3eb9427f73e | test/device/events.test.ts |
| 001 health / 03-05-02 | 95623884bb892b1a11097b65e52a67e88ea25315 | src/device/health.ts; test/device/health.test.ts |
| 005 / 03-05-02 | 4deb91efab59f0059ab270f5dfc52d56aeba3eac | test/device/health.test.ts |

Node v26.11.1, npm 11.20.0, Fallow 3.27.0. Inputs are offline synthetic values.
Code-closeout native index initially held 52 captures:
/private/tmp/events-health-fixer-index.json. Later record checks append to it.
Every capture retains stdout, separate stderr, raw exit, command arguments,
UTC start/end, runtime, current revision/blobs, exact dirty/staged diff and
untracked inputs. Final evidence validation is -evidence-validation.json.

- Post-commit event tracer npm run build:test && node --test
  dist-test/test/device/events.test.js exited 0 at a41e4815, 19:11:42.053–
  19:11:44.906 UTC. Node reports one file-load sentinel, zero authored runtime
  cases. No numeric runtime coverage claim follows.
- Repeated npm run test:coverage:direct -- src/device/events.ts
  test/device/events.test.ts exited 0 at 19:11:52.173 UTC, before health
  edits. It performs strict compilation and the existing declaration-only
  selector. Original four negatives plus two numeric negatives remain active.
- Final npm run test:coverage:direct -- src/device/health.ts
  test/device/health.test.ts exited 0 at 4deb91ef, 19:14:19.919–19:14:23.525 UTC.
  This is declaration-only acceptance, not measured runtime percentages.
- Fresh npm run build:test && node --test
  dist-test/test/accessories/serviceCatalogue.test.js exited 0 at 4deb91ef,
  19:14:37.275–19:14:40.311 UTC: 185 tests/pass, zero fail/skip/cancel/todo.
  This verifies the actual structural trust reader; it does not sweep that
  later accessory subsystem. Native full output is -task2-real-owner.json.
- Preservation proof -preservation-final.json independently compares source
  tokens and installed compiler-erased output with 7cfedb24. Both sources
  retain their exact type tokens and emit export {}; their union/member
  shapes and .fallowrc.json are unchanged. All four headers validate.
  Original four negatives in each owner survive; current totals are event
  six and health nine. That is a compiler-contract count, not runtime cases.
- No genuine behavior bug, conditional RED JSON, mutation/control, skipped
  target or artificial compiler runtime wrapper was introduced.
- The worker did not run npm run check. The coordinator owns a fresh combined
  wave gate after this terminal handoff; isolated checks and hooks do not
  substitute for it or refresh merged coverage/direct.lcov.

## Prior gate reuse boundary

The corrected reviewer independently read the coordinator's npm run check
capture at 92ce4c6b2d6fec45aab17787e93c257baa4b3131, Node v26.11.1,
18:50:04.889619–18:50:41.611989 UTC, exit 0: six static checks, 104 scenarios,
1,156 steps and 43 isolated pairs. Native records are
/private/tmp/guardian-phase3-wave4-gate.json and -full-check.log. Against
initial 7cfedb24, the prescribed Markdown-exclusion diff is not literally
empty: .planning/state.json changes only updated_at. It is outside the
hook's executable input regex; all actual build/source/test/config bytes and
untracked inputs are unchanged. That qualified reuse supports initial triage
only. Event/health test changes require the fresh coordinator wave gate.

## Dispatch correction and preserved failed attempt

The first reviewer dispatch was an executor mistake: actual spawn arguments
were gsd-code-reviewer, fork_turns all, explicit model gpt-6-astra and high
effort, despite the omit-model requirement. Tool result created
/root/phase3_events_health/support_initial_review. Parent directed a reversible
dispatch correction. Interrupt returned previous_status running;
list_agents then reported interrupted. No subsequent task/build/Git work ran
while it was active. No interim verdict was accepted or reused. A fresh
fork_turns none, high-effort, model-omitted typed corrected reviewer produced
the complete initial inventory recorded here. This cancellation/new dispatch
is not a correction round, counter reset or D-03 event. Later fixer dispatch
used the correct fresh-context/model-omitted arguments.

The event-clock audit at 19:09:59.919–19:10:00.766 UTC actually exited 2:
could not create a temporary worktree for recorded baseline 7cfedb24. It is
not a clean audit. The authorized escalated retry at 19:10:14.637–19:10:15.452
UTC exited 0/verdict pass before staging/commit. Both complete records remain
in the native index. The plan ledger's linked-Git-metadata write also needed
authorized escalation before the first commit. No hook bypass, history
rewrite, install, live/private input or out-of-scope source edit occurred.

WINDOWS 46/47 remain prior open/unwaived process deviations. Current successful
checks do not establish their missing historical ordering/alias trace. The
coordinator owns all WINDOWS/shared-state dispositions, including this
dispatch deviation if it needs a new record.

## Review counts and owner handoff

| Review | Opening | Fixed | Rejected accepted IDs | New | Reopened | Closing |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Independent initial round 0 | 10 | 0 | 0 | 0 | 0 | 10 |

Applied event/health causes 002–005 and HALO/registry causes 006–008/010,
plus their 001 header portions, await full independent acceptance. Unapplied
009 and remaining persistence 001 portions stay with 03-07. No full correction
or independent closing count ran
here. Complete SUPPORT correction follows 03-07 with this original counter.
E-03-01/P-03-01/P-03-02 remain unresolved; DEV-01 remains pending overall.

## HALO/registry execution and bounded preflight

Fixer: /root/phase3_halo_registry/halo_registry_fixer, role gsd-code-fixer.
Independent preflight reviewer: /root/phase3_halo_registry/halo_registry_preflight,
role gsd-code-reviewer. Both dispatched with fresh context, resolved high
effort and omitted empty model fields. Each foreground handoff waited for its
named terminal response; interim messages were not completion. Full required
rulebooks, four owning files, current SUPPORT history and actual callers were
read. No write/build/Git overlap occurred.

| Cause | Actual commit | Actual paths |
| --- | --- | --- |
| 001 HALO | 72c4574b9737d9b35e37e52296223f62d52acfee | src/device/halo.ts; test/device/halo.test.ts |
| 010 | bb6d16593a14d72ebac2dd5f6b15aed6bc12a7df | test/device/halo.test.ts |
| 007 | 8847f1c195d23c5af24ab8d021d2f318a925a448 | test/device/halo.test.ts |
| 001 registry | 7d79ac127dc7d8cc0062d8bf3e5bdc6689b208a7 | src/device/registry.ts; test/device/registry.test.ts |
| 006 | 75f02e93913ac37ac376b4de7c290a375e391b62 | src/device/registry.ts; 03-06-PLAN.md |
| 008 | 6ad32c3f112c9e9184264a498be26d1d666e6a72 | test/device/registry.test.ts |

Each cause passed fresh build/owner execution, its isolated selector, Fallow
audit against 7cfedb24, exact clean SKIP=npm-check pre-commit pre-step before
staging, and ordinary foreground commit with normal check:commit hooks.
All six commits exited 0 and changed only the five authorized paths. No
formatter changed pre-step inputs; no tracked deletion or untracked input
remains. Ledger gsd-plan-head-before-03-06 records f04f0864. Existing
phase03/plan03-06 isolation:none sentinel was read and preserved.

Exact pre-edit Fallow dead-code --trace src/device/registry.ts:FamilyOutcome
ran at 19:29:24 UTC on original blob 5fbe6570, before replacing the alias's
inline alternatives. Independent --type-aware --symbol-impact queries used
tsconfig.json and tsconfig.test.json with --format json --quiet; both exit 0,
status/completeness complete, one/four direct consumers. Actual platform,
runtime command and accessory consumers were read. Variant traces report no
direct external imports; this is not direct-import evidence. Installed
TypeScript checker proves real transitive public union use at platform 1,
platform owner 8, accessory owner 8 and registry owner 5 references.

Node v26.11.1, npm 11.20.0, Fallow 3.27.0. Native index initially holds 72
complete captures: /private/tmp/halo-registry-fixer-index.json. Records retain
full separate stdout/stderr, arguments, exits, UTC times, runtime, revision,
source/test blobs and exact dirty/staged/untracked inputs. Final validation
checks actual commit paths/ancestry and pre-step -> stage -> hook ordering.

- Final npm run build:test && node --test dist-test/test/device/halo.test.js
  dist-test/test/device/registry.test.js: exit 0 at 6ad32c3f, 19:37:32.890–
  19:37:36.425 UTC; nine tests pass, zero fail/skip/cancel/todo.
- npm run test:coverage:direct -- src/device/halo.ts test/device/halo.test.ts:
  exit 0, 19:37:36.540–19:37:40.425 UTC. Isolated native compiled LCOV has
  lines 6/6, functions 0/0, branches 1/1.
- npm run test:coverage:direct -- src/device/registry.ts
  test/device/registry.test.ts: exit 0, 19:37:40.535–19:37:44.482 UTC.
  Isolated native compiled LCOV has lines 53/53, functions 3/3, branches 9/9.
- The outcome interfaces are erased declarations. These runtime measurements
  make no numerical runtime claim for them. Both sources' compiler-erased
  JavaScript matches baseline; HALO source tokens and registry runtime tokens
  match. Original required generic/member types/optionality/mutability and
  union alternative order are independently verified. All four headers pass.

Initial HALO-header audit exited 2 because the sandbox could not create its
temporary baseline worktree; the authorized escalated retry exited 0/verdict
pass. Both captures remain. Two temporary preservation-harness attempts
exited 1 on lexical semicolon comparison and compiler internal union ordering.
Only the /private/tmp proof harness changed to compare property AST shapes
and variant sets; final proof passed, with source alternative order checked
separately. These attempts are not production failures or genuine RED.

Independent read-only preflight at 6ad32c3f reported PREFLIGHT PASS, no concrete
defect, reopening or D-03 stop trigger. It independently inspected raw native
evidence, Git objects, exact trace timing, current blobs, caller bodies and
compiler-erased shapes without builds or mutations. This bounded acceptance
is not a full SUPPORT correction round and assigns no closing count. Initial
ten IDs and counter 0 remain. Full correction follows 03-07. WINDOWS 46/47
remain OPEN/unwaived; successful current checks do not repair historical gaps.
No genuine bug RED, source mutation, conditional evidence file, install,
live call, new adapter/default/migration or coordinator state edit occurred.
The coordinator owns the fresh full npm run check; isolated checks and hooks
do not replace it or refresh merged coverage/direct.lcov.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.
