# Phase 04 review and evidence contract

Milestone: code-review-sweep. Requirement: RUN-01. Apply 04-CONTEXT D-01
through D-07. Review every full source, owner and actual helper/adaptation;
fix every confirmed finding, including WARNINGs. Research seeds are candidates,
not accepted causes or bugs. Phase 3 judgments do not approve this phase.

## Serial ownership and execution

| Batch | Plans | Full original review inventory | Report |
| --- | --- | --- | --- |
| PORTS | 04-01, 04-02 | accessoryStore, clock, monotonicClock, timers and four complete owners | 04-PORTS-REVIEW.md |
| POLICIES | 04-03, 04-04 | commandPort, failureLog, retryPolicy and three complete owners | 04-POLICIES-REVIEW.md |
| TRUST | 04-05, 04-06 | arrivalAnchors, monitoringHealth and both complete owners | 04-TRUST-REVIEW.md |
| ACCOUNT | 04-07, 04-08, 04-09 | Complete accountRuntime source and complete 3,365-line initial owner | 04-ACCOUNT-REVIEW.md |
| Coordinator | 04-10 | All current inventory, reports, summaries, Git and native evidence | 04-FINDINGS.md; 04-SEAL-AUDIT.json |

The exact twenty initial paths are in 04-FINDINGS.md. Later line counts may
change; full current files remain the review scope. Plan slices divide repairs,
never full initial/correction scope or batch counters. Initial independent
review of ALL original batch files precedes its first source/test/helper repair.
ACCOUNT starts with all 1,283 source lines and all 3,365 owner lines; review
every test, not a selected case, diff, helper, or excerpt.

Use the existing features/code-review-sweep checkout and GSD_RUNTIME=codex.
Before every executor, the parent runs dispatch-isolation for phase 04 with
--force-isolation none, then reads .gsd/dispatch-isolation-sentinel.json directly.
A bare re-query must not replace that check or re-enable harness isolation.
Do not create a checkout from the stale remote default.

The parent coordinator owns shared STATE, ROADMAP, REQUIREMENTS, WINDOWS,
full combined gates, Git/index and central findings/validation/seal records.
Workers own only their declared source/owner/report/conditional evidence/helper.
They are not alone and must preserve other edits. Use the owning WINDOWS CLI
with a description beginning [code-review-sweep]; do not hand-edit WINDOWS.
RUN-01 stays Pending until every declaring plan, independent phase verification,
and actual remaining human judgments finish. The parent alone queries
requirements.ready-ids and advances phase/shared state.

Only one writer/fixer runs. Serialize builds/dist-test, coverage, source controls,
helpers, Git, reports and coordinator records. After every wave and at phase
end, the parent supplies full npm run check on current combined inputs.
Independent read-only work never races a mutation of its reviewed inputs.

## Typed roles, terminal waits and complete books — D-01, D-02

Dispatch initial and correction reviews as gsd-code-reviewer; dispatch every
accepted cause repair as gsd-code-fixer. Use fresh fork_turns=none, omit model,
resolve the active Codex effort rather than inventing one. Every dispatch names
its full owned paths and output report, states that others share the checkout,
and requires complete AGENTS plus all five books:
skills/typescript-google-style-review/SKILL.md,
skills/typescript-comments/SKILL.md,
skills/typescript-unit-testing/SKILL.md,
skills/typescript-unit-testing-review/SKILL.md,
skills/local-verification/SKILL.md.
Configured injection subsets and prompt summaries do not replace these reads.
Feature adaptations also read features/CLAUDE.md and
skills/cucumber-behavioral-testing/SKILL.md.

Foreground dispatch means immediately wait for the named agent's terminal
FINAL_ANSWER/status; interim commentary, a tool yield, or an uncollected agent
is not completion. Do not inspect or mutate shared code/builds, dispatch another
repair, or commit while that agent remains active. Record its role, identity,
complete reviewed inputs/revision and terminal result.

Toolchain rules use applicable passing evidence under local-verification;
manually inspect every non-toolchain rule and every full header. Preserve .js
ESM imports and compiled dist-test/test layout. D-01 requires SPDX first,
a blank line, separate Copyright (c) 2026 Alessandro Colomba JSDoc,
a blank line, purpose @fileoverview JSDoc, a blank line before imports.
Preserve actual license and template attribution. The packaging gate is
source-only; inspect full owner/helper/external headers independently.

## Stable ledger and seed triage

Allocate CR-04-PORTS-NNN, CR-04-POLICIES-NNN, CR-04-TRUST-NNN or
CR-04-ACCOUNT-NNN once per cause. Keep IDs on recurrence. Each finding records
RUN-01, exact rule/section, initial and current revision-qualified path/line,
BLOCKER/WARNING, first independent observation, triage/disposition, reason,
actual tests/commands/raw exits, source/evidence/fix hashes and committed paths.
Reject only with actual rule/source evidence; fix every confirmed warning.
The report owns raw evidence, the central ledger mirrors audited results.

Separately dispose every S-04 candidate from 04-FINDINGS.md. Header, JSDoc,
AAA, naming, assertion and test-design review still covers every line even
when no seed named it. A weak assertion is not automatically a production bug.
No accepted finding, bug count, helper, repair, control success or clean verdict
is assigned at plan time.

## Consumers, aliases and bounded cause tasks — D-06

Before changing any shared/exported name, signature, field presence, mutability
or visibility, read live Fallow help and run exact type-aware impact separately
for tsconfig.json and tsconfig.test.json. Use one --type-aware-project per run,
--type-aware-require complete --format json --quiet --explain.
Retain native stdout/stderr/raw exit, target, selected_project, completeness,
source HEAD and omitted evidence. Read actual named, structural and inferred
callers and public factory signatures. AccountRuntimeOptions has zero named
consumers in research but remains public through exported factory parameters.

The 18 research probes at /private/tmp/guardian-runtime-research-fallow.json
are scope leads; refresh relevant targets at actual pre-edit revision.
Earlier repeated-project runs selected production and are not two independent
compiler-project results. Before a private alias/member deletion obtain that
exact target in both projects BEFORE edits, plus all lexical/signature uses.
A public neighbor's result, unavailable/private-unsupported output or zero named
imports does not prove deletion safe. Retain the unmet trace and choose a
contract-preserving repair; a genuine conflict returns exact missing evidence.

| Potential owner contract | Conditional existing consumer paths to trace/read |
| --- | --- |
| AccessoryStore | src/platform.ts; src/accessories/pumpRecords.ts; test/platform.test.ts; test/accessories/pumpRecords.test.ts |
| Clock / MonotonicClock | src/runtime/accountRuntime.ts; src/runtime/monitoringHealth.ts; src/runtime/failureLog.ts; src/cloud/auth.ts; src/cloud/shadow.ts; src/device/state.ts; src/accessories/reconciliation.ts; exact mirrored owners |
| Timers | src/platform.ts; src/accessories/controls.ts; src/accessories/staleMarking.ts; src/accessories/basementGuardian.ts; test/platform.test.ts; test/accessories/controls.test.ts; test/accessories/staleMarking.test.ts; test/accessories/basementGuardian.test.ts; features/support/fakeTimers.ts |
| CommandPort / CommandOutcome / CommandFailure | src/runtime/accountRuntime.ts; src/platform.ts; src/accessories/controls.ts; src/accessories/basementGuardian.ts; test/runtime/accountRuntime.test.ts; test/platform.test.ts; test/accessories/controls.test.ts; test/accessories/basementGuardian.test.ts; features/support/world.ts; features/real-pump/support/realWorld.ts |
| RetryPolicy | src/runtime/accountRuntime.ts; src/cloud/shadow.ts; test/runtime/accountRuntime.test.ts; test/cloud/shadow.test.ts |
| ArrivalAnchors / MonitoringTrust | src/runtime/accountRuntime.ts; src/runtime/monitoringHealth.ts; src/platform.ts; src/accessories/basementGuardian.ts; exact mirrored owners; features/support/world.ts; features/real-pump/support/realWorld.ts |

These are conditional trace/read slots, not blanket edit permission. Resolve
actual paths from queries before any adaptation. Narrow later-subsystem edits
never certify their Phase 5–7 whole sweep. Keep required compatibility in the
owning wave.

Every cause task changes at most FIVE concrete paths, including report,
RED evidence, helper and plan amendment. Ordinary pair task: source, owner,
report, conditional pair RED JSON, conditional named concern seed = five.
If an adaptation needs source+owner+consumer source+owner+RED, that is five;
report/helper/amendment writes must be separate metadata/cause slices.
BEFORE external edits the parent amends the owning plan with explicit exact
serial task IDs/paths, files_modified, artifacts, threats, inventory and
validation. Commit that record-only amendment first when it occupies a path.
More than three tasks means a sequential same-batch plan before further edits.
A later review cause routes to its original owning task; do not silently assign
it to a seal task, a new counter, or a later subsystem sweep. If a passing
intermediate contract cannot fit, report the exact dependency conflict before
edits. No silent sixth path or invalid intermediate commit.

Conditional helpers are only those named in owning Artifacts sections, and only
for confirmed writer-rule causes. Return fresh seeds; reuse existing concern
support when sufficient. Every actual helper/adaptation joins full-file review,
header inspection, actual inventory and broad staged coverage. No generic helper
directory, test-only export, reset hook, forced consumer import, suppression,
private type leak, artificial runtime wrapper or new package is authorized.

## Correction rounds and global stop — D-03

Round 0 is initial triage. Clarifications/tracers/owner checks are not correction
rounds. A correction is an independent full-batch review AFTER the complete
repair pass, covering every original file plus every actual helper/adaptation.
ACCOUNT has one continuous counter across 04-07/08/09 and any added cause plan.

Record opening/fixed/rejected/new/reopened/closing ID sets and counts;
closing = opening - fixed - rejected + new + reopened. Sets must reconcile,
IDs are unique, previously fixed IDs cannot be renamed into new causes.
A clean review explicitly reports zero open IDs. Check the stop immediately
on terminal reviewer result BEFORE any further mutation, build, commit or
dispatch. Pause ALL work if a correction has open findings without reducing
the opening count, any fixed finding reopens, or correction round FOUR is
reached even clean. Report actual IDs/counts and current retained evidence;
interrupt active work. No follow-on record edit, repair, build, commit or
dispatch until actual maintainer resolution. New causes/slices/resumes do not
reset counters. Paused work cannot receive a successful seal.

## Genuine bug evidence and separate controls — D-04

For a confirmed production defect, add an ACTIVE intended regression in the true
mirrored owner while production is UNCHANGED. Save production bytes/blobs and
source commit. Build serially; run exact native node --test --test-reporter=tap
owner or uniquely qualified named target. Require the intended assertion to
execute and fail for the planned behavior. Missing/filtered/skipped/cancelled
targets, compilation/import/fixture/setup/permission failure, unrelated
TypeError/assertion, unexpected GREEN or incomplete TAP do not authorize GREEN.
Preserve unsuccessful attempts instead of relabeling them.

The pair's conditional 04-<PAIR>-RED-EVIDENCE.json retains complete untouched
native TAP, separate stderr/npm output, exact command/raw exitCode,
targetTest/targetFile, expected/actual, semanticAssessment, complete
regressionPatch, sourceCommit, production and test blob identities, Node/npm
versions and real start/end times. Keep EVERY prior record in full, including
recursive priorEvidence. Run the existing
GSD_RUNTIME=codex node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence
<record.json> --raw on each current on-disk record and require RED_EVIDENCE_OK.
For every embedded archived record invoke the SAME installed
classifyRedEvidence function recursively; do not create a second parser or
untracked evidence-path workaround. Require RED_EVIDENCE_OK for each archived
record plus independent intended-assertion semantics and actual Git provenance.

The parent commits ONLY complete planning evidence BEFORE any GREEN production
edit, after clean required pre-step and ordinary foreground hooks. The active
test remains discoverable in the working tree with ordinary stash/index rules.
Do not stage a failing code test into the evidence commit. Inspect real Git
paths, source -> evidence -> fix ancestry and unchanged production blobs through
evidence. Then make the minimum production repair, keep the active regression,
prove rebuilt GREEN and direct coverage, and commit production+active tests
with normal hooks. Compare saved patch with active GREEN owner and disclose
formatter/lint differences. D-04 overrides generic failing-code RED commits,
generic TDD commit scopes and subject-prefix heuristics. A subject, type:tdd
or summary marker never proves ancestry.

Assertion maintenance controls are separate report sections, never genuine RED
history. First name the plausible wrong public behavior and the gate that
misses it; observe the named intended assertion failure, restore EXACT source
bytes, rebuild and prove GREEN. Preserve raw failure/restoration/GREEN evidence,
source blobs and failed attempts. No control mutation enters Git.

## Runtime preservation — D-05, D-06

Preserve opaque canonical reported-only patches, monotonic watermark rules and
SC-03's present whole frozen snapshots plus canonical refused-patch readback.
Keep last valid values, narrow invalid scopes, physical deviceId identity,
deviceTypeId adapter selection, mutable persisted observations and invalid-record
new-epoch recovery. Separate device seconds, local wall milliseconds and elapsed
milliseconds. Keep restart admission/restored-anchor behavior and
.basement-guardian-arrivals.json format/key/write ownership.

Preserve lifecycle/poll/rotation guards, current connection ownership, shared-root
shutdown cancellation, terminal-auth halt distinctions, retry pending/capped
waits and no automatic retry of a potentially delivered command. Command API
acceptance does not set canonical requested state. Monitoring-path degradation
and silence never become device offline evidence or guessed normal state.
Removal waits for actual successful inventory confirmation/final check, invokes
the removal callback before exact-device tracking/anchor pruning, and retains
tracking on refusal.

For confirmed CommandOutcome object-union conformance, bounded documented PUBLIC
AcceptedCommandOutcome and RefusedCommandOutcome interfaces may replace inline
objects; export the unchanged union through them. Preserve exact true/false,
required failure: CommandFailure, vendor-error/timed-out vocabulary and existing
mutability. Check transitive public use/configured private-type-leak rules;
no unused API, forced imports, suppression or semantics change.

Recheck arrival release/seeding narration and runtime privacy against canonical
history. Preserve scoped deviceId log/persistence permission with its unconfirmed
opaque-key premise; sanitize public/planning artifacts. No new migration,
new privacy permission, opaque-ID guarantee or universal transport teardown
claim follows from comment/style work.

## Checks, commit ordering and historical limits — D-07

Before edits run installed Fallow guard on exact paths. Before each commit,
run fallow audit --base <recorded-real-batch-base> --format json --quiet --explain
and retain base/raw verdict/exit. Findings are not silently converted to pass.
Run exact SKIP=npm-check pre-commit run --files <changed paths>, repeat until
CLEAN after formatter changes, THEN stage/restage and foreground git commit.
Retain raw pre-step/hook output and real commit paths/hash. Failed hook means
no commit; fix, repeat clean pre-step, restage and normal commit. No --amend,
--no-verify, rebase or history rewrite. Other hooks have no SKIP overrides.
Use Conventional titles 5–72 characters and body lines at most 80; no GSD
phase/milestone prose. Header-only repairs stay separate from functional causes.

Fresh build:test precedes compiled owners. Every modified executable pair alone
retains 100% direct lines/functions/branches; every actual external production
consumer adds its mirrored direct owner. Declaration-only pairs keep meaningful
strict satisfies/@ts-expect-error checks and honest selector acceptance, without
runtime-case wrappers or fictional percentages. Shared support changes select
all pairs in staged checks. Selected runs do not refresh merged all-pair LCOV;
keep compiled native and merged source-map denominators distinct.

The parent runs full npm run check after EACH combined wave and at phase end.
The 2,400-second limit is not pass. Same-session reuse requires command, real
exit, commit, Node, scope and exact unchanged input comparison; dirty trees retain
exact diff AND untracked bytes. For Markdown-only changes compare
git diff <verified-commit> -- . ':(exclude,glob).planning/**/*.md'
and absence of new untracked executables. Never reuse after source/support/
dependency/config/runtime/tool changes. No live vendor/hardware/real profile,
private account inputs, installs, upgrades or new product features.

04-10's generated seal JSON is an evidence OUTPUT excluded by the actual
formatter/ESLint/Fallow/TypeScript/build selectors. It cannot contain its own
final content hash as a checked input. Retain its real before/after difference,
raw dirty diff and untracked snapshots; do not claim it was unchanged. The final
predicate compares an exact path/blob manifest for EVERY tracked/untracked path
other than planning Markdown and this one generated output, plus actual tool
versions. This is no general JSON reuse shortcut: any other input difference
requires the parent to rerun the full gate. The existing Markdown-only shortcut
remains unchanged; a persistent marker or self-reported native pass is no proof.

Historical WINDOWS 46/47 remain OPEN/unwaived: missing clean pre-step repetition
before 18e8b83 and missing exact private-alias pretrace before a63a9eb.
Three early hook streams lack separate JSON; retain original output as the
limit. Historical Gemini 247 is unconfirmed; current 273 compiled/248 merged
representations are distinct, not retroactive proof. Phase 3 closed only after
actual three judgments at 2716926. Prior cf04e71 gate (Node26.11.1, exit0,
104 scenarios/1156 steps/43 pairs) is prior unchanged-source baseline; no Phase04
result follows without exact-input and session evidence.

## Seal and summaries

04-10 independently audits actual all-path inventory, complete headers/reviews,
stable findings/rules/locations/dispositions/counts, all native checks/commits,
genuine source/evidence/fix ancestry and recursively preserved histories,
controls/restoration, complete threats and current exact-input full gate.
Structured 04-SEAL-AUDIT.json is a NEW execution artifact declared in 04-10.
Its predicates compare exact UNIQUE twenty core paths and ten pair names,
not counts alone; additions remain in actual inventory and coverage.

Actual fallback: E-04-01 unclassified/unresolved RUN-01; edge equality
1 surfaced = 0 lifted + 1 flagged assumption. P-04-01 safety and P-04-02 truthful
completion are serializer-projected descriptorless unresolved prohibitions;
2 surfaced = 2 authored + 0 omitted. Their deterministic disposition remains
unverified/flagged. Never inherit Phase 3 passes, invent descriptors, resolve
taxonomy by assertion, or silently omit a flag. Parent presents actual remaining
Phase04 judgments at seal, after automation, with evidence/limits.

Each numbered SUMMARY has actual key-files/repo-relative paths, commits,
commands/exits/Node/revisions/scopes, round counts, limitations, ## Threat Flags
(including the AGENTS exact None text when appropriate), ## Check Results and
## Self-Check. Check existence/Git of declared outputs; no invented PASS.
Record no requirement/phase completion; return readiness to parent.
