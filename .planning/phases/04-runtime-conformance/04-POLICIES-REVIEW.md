---
phase: 04-runtime-conformance
batch: POLICIES
reviewed: 2026-10-15T00:49:07Z
depth: deep
review_round: 0
correction_round: 0
revision: e25e26e6232ed99411b7463a7f9839c5eb837ec0
files_reviewed: 6
files_reviewed_list:
  - src/runtime/commandPort.ts
  - test/runtime/commandPort.test.ts
  - src/runtime/failureLog.ts
  - test/runtime/failureLog.test.ts
  - src/runtime/retryPolicy.ts
  - test/runtime/retryPolicy.test.ts
findings:
  critical: 2
  warning: 10
  info: 0
  total: 12
status: issues_found
genuine_production_bugs: 0
---

# Phase 04: POLICIES initial review

## Summary and continuous state

Full independent initial review of every line and complete header of all six
original files at `e25e26e6232ed99411b7463a7f9839c5eb837ec0` (R below).
No repair preceded this review. First observer and triager for every accepted
ID is `policies_initial_review`, typed `gsd-code-reviewer`, under
`/root/phase4_policies_first/policies_initial_review`.

Accepted/open IDs: `CR-04-POLICIES-001` through `CR-04-POLICIES-012`:
**12 total, 2 BLOCKER, 10 WARNING**. All remain open. There are no fixed,
reopened, or rejected accepted IDs, and no source/evidence/fix commit exists
for them yet. Initial opening was the empty set; initial triage added these
12 IDs. This is round 0, not an independent correction. The POLICIES correction
counter remains **0**; D-03 must retain it across 04-03 and 04-04.

Research disposition: S-04-02 accepted as 002; S-04-03/04 rejected as changes
to this batch's current contracts; S-04-05 accepted in part as 004/008.
These are **2 accepted candidate questions and 2 rejected candidate questions**,
not another four findings. S-04-01/06/07/08 have other owners and are inapplicable
to this six-file review. No genuine production defect is established. Test
weaknesses below are test-reliability findings, not BUG-01 histories.

Fresh static checks, build, all owners, and each direct selector passed.
The baseline-reuse predicate failed because `.planning/state.json` differs
from 1993aaa; this report does not reuse or claim a new full-project gate.
No clean or partial-clean POLICIES verdict is issued. Retry causes remain open
for 04-04, along with command/log causes assigned to 04-03. RUN-01 stays Pending.

## Inputs, complete headers, and provenance

Repository root (all paths below resolve under this absolute directory):
`/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian`.
Both initial and current locations refer to R. The stable location table below
records both explicitly. Source/test bytes were unchanged throughout the native
checks. The initial input manifest retains SHA-256 values as well as these Git
blobs, exact clean status, empty working diff and empty untracked map.

| Fully read path | Lines inspected | R Git blob | Complete-header result |
| --- | ---: | --- | --- |
| src/runtime/commandPort.ts | 1–32 | b5dc838eeeeda952595ffc1b27cffc11d5bbcc9f | MIT SPDX present; missing copyright, separate overview/tag and required spacing; 001 |
| test/runtime/commandPort.test.ts | 1–24 | 06ecab60230d6fdbe05da1b2110113b0974a3885 | Starts at import; all three header sections absent; 001 |
| src/runtime/failureLog.ts | 1–86 | f33605f53e2e751f6cfb62e75de3eb478b3e5fda | MIT SPDX present; copyright/overview absent; 003 |
| test/runtime/failureLog.test.ts | 1–282 | aba7b9971634291400934f83990ee8fa30b9a2e1 | Starts at import; all three sections absent; 003 |
| src/runtime/retryPolicy.ts | 1–92 | fcf0aa892cafef282e28e57639a03d681acd3890 | MIT SPDX present; copyright/overview absent; timer note inspected; 007 |
| test/runtime/retryPolicy.test.ts | 1–178 | cb81c545b5e24a3cb81dcd0e21ab0e218e48aeef | Starts at import; all three sections absent; 007 |

LICENSE/NOTICE identify these as original MIT work. No Apache template boundary
applies to these six files. The license-header owner only checks source SPDX;
its passing result cannot approve the omitted owner headers. Header-only causes
001/003/007 must remain separate from functional/test causes.

Read AGENTS.md; complete `skills/typescript-google-style-review/SKILL.md`,
`skills/typescript-comments/SKILL.md`, `skills/typescript-unit-testing/SKILL.md`,
`skills/typescript-unit-testing-review/SKILL.md`, and
`skills/local-verification/SKILL.md`. Also read the two owning plans, CONTEXT,
RESEARCH, PATTERNS, REVIEW-PROTOCOL, FINDINGS, requirements and applicable
PROJECT/STATE/ROADMAP/decision/history context. The bootstrap and local skill
inventory were inspected; no missing configured subset replaced these books.

History inspection found the six inputs introduced in `b19ea58` (initial release)
and no later source changes on their path history. This supplies provenance,
not a conformance exemption. Existing WINDOWS46/47 and prior-phase evidence
limits remain unwaived. No external reviewer claim or structural-finding block
was supplied to this reviewer.

## Narrative Findings (AI reviewer)

### BLOCKER findings

### CR-04-POLICIES-004: The hourly logging case discards its promised stream

**Classification:** BLOCKER. **Requirement:** RUN-01.
**File:** `test/runtime/failureLog.test.ts:141–157` (absolute root above).
**Rule:** Unit writer/reviewer, Assertions: compare whole promised values and
construct expected values independently; reviewer central wrong-implementation
question and BLOCKER classification for weak assertions.
**Issue:** The case executes 120 reports but reduces the observed stream to
warning/report counts. Incorrect warning positions, incorrect debug levels on
the other 116 entries, corrupted reasons, or extra level changes can preserve
those counts. Logging is this module's public result, and the hour is intended
to demonstrate repeated cadence, not merely recorder length. Existing shorter
cases do not observe the remaining hour's entries.
**Fix:** Compare the complete independently expected stream: warning at entries
0, 30, 60 and 90 and debug at the other entries, with each complete supplied
reason. Use fixed scenario expectations rather than production cadence output
to derive the answer. Keep independent kinds, boundary reminders, recovery and
silent forget. Do not replace the per-kind map with auth's last-kind policy.
**Disposition:** Accepted/open; first observed and triaged at R. Native E1–E6
are GREEN and show why coverage alone does not settle assertion quality.
No production bug or control failure is claimed.

### CR-04-POLICIES-008: Scheduled retry boundaries and pending work are unobserved

**Classification:** BLOCKER. **Requirement:** RUN-01.
**File:** `test/runtime/retryPolicy.test.ts:64–145`, especially 75–83,
99–112, 115–127 and 130–145.
**Rule:** Unit writer/reviewer central discrimination rule; Assertions and
Patterns/Time; 04-04-01 public schedule/controlled wait/completion contract.
**Issue:** The nine “waits … before attempt” rows only call `nextDelayMs()`.
The scheduled cases advance directly to 500/1000 and check final counts; a wait
shorter than the promised delay can produce the same observations. In particular,
hard-coding the wait to 500 while retaining `nextDelayMs()` progression leaves
the rows and two-run case green: the second 1000-ms advance also releases a
500-ms wait. No case holds the callback promise unresolved and observes
`pending`; clearing it while work is still active can also pass. The owner does
not establish capped/reset delays through scheduling, or exclusion of another
schedule while the callback itself is outstanding.
**Fix:** Observe the real public schedule at the pre-deadline and exact-deadline
boundaries, independently recording callback completion and public
attempt/pending. Include successive/capped waits and reset through that path.
Hold a callback with a case-owned deferred promise, observe pending and duplicate
refusal while it is outstanding, then resolve/reject it and observe completion.
Keep the existing public `nextDelayMs()` value tests, with titles describing
returned delays. Preserve abort and owned-rejection tests. Use context timers
and awaited settling, with no private access, real elapsed sleep or new policy.
**Disposition:** Accepted/open at R. E1–E6 pass, including isolated direct 100%.
This is a missing test discriminator, not proof the current policy is wrong.
No production mutation or assertion control was run.

### WARNING findings: header-only causes

### CR-04-POLICIES-001: Complete the command pair's file headers

**Classification:** WARNING. **Requirements:** RUN-01, PROC-03.
**Files:** `src/runtime/commandPort.ts:1–14` and
`test/runtime/commandPort.test.ts:1`.
**Rule:** CONTEXT D-01; REVIEW-PROTOCOL/Typed roles, terminal waits and complete
books; style/Files and modules.
**Issue:** The source starts SPDX immediately followed by an untagged explanatory
JSDoc, with no copyright. The owner starts at its import. Neither has the
approved complete sections and spacing.
**Fix:** Supply first-line MIT SPDX, blank line, separate copyright JSDoc
`Copyright (c) 2026 Alessandro Colomba`, blank line, concise `@fileoverview`
JSDoc, blank line, imports. Preserve the useful one-attempt/capability rationale
in appropriate documentation. Make only the header repair in its atomic cause.
**Disposition:** Accepted/open at R; complete source and owner headers inspected.

### CR-04-POLICIES-003: Complete the failure-log pair's file headers

**Classification:** WARNING. **Requirements:** RUN-01, PROC-03.
**Files:** `src/runtime/failureLog.ts:1–3` and
`test/runtime/failureLog.test.ts:1–8`.
**Rule:** D-01 and style/Files and modules, as for 001.
**Issue:** Source has only SPDX; owner has no header. Neither has a copyright
block or overview. Source SPDX directly touches imports.
**Fix:** Apply the same approved separated MIT/copyright/overview sections to
both files; describe the actual per-kind reporting and its owner tests.
**Disposition:** Accepted/open at R; distinct header-only pair cause.

### CR-04-POLICIES-007: Complete the retry pair's file headers

**Classification:** WARNING. **Requirements:** RUN-01, PROC-03.
**Files:** `src/runtime/retryPolicy.ts:1–7` and
`test/runtime/retryPolicy.test.ts:1–8`.
**Rule:** D-01 and style/Files and modules, as for 001.
**Issue:** Source SPDX is followed by its import explanation; copyright and
overview are absent. Owner starts at imports and has none of the sections.
**Fix:** Apply approved sections and spacing to both files. Retain the justified
module-object timer import and its note beside the import; it is not a substitute
for a file overview. Keep this atomic cause header-only.
**Disposition:** Accepted/open at R; both complete headers inspected.

### WARNING findings: nonheader causes

### CR-04-POLICIES-002: Declare command outcome object variants with interfaces

**Classification:** WARNING. **Requirement:** RUN-01.
**File:** `src/runtime/commandPort.ts:19–20`.
**Rule:** style/Types: “Object types declared with interface, not a type alias
of an object literal”; D-06 and the bounded public-variant authorization in
04-03-01 and REVIEW-PROTOCOL/Runtime preservation.
**Issue:** `CommandOutcome` defines both object variants inline in its alias.
The literal-string `CommandFailure` union is valid; the object declarations
are the independently confirmed S-04-02 finding.
**Fix:** Declare documented public `AcceptedCommandOutcome` and
`RefusedCommandOutcome` interfaces and alias their union as `CommandOutcome`.
Keep mutable `accepted: true`, mutable `accepted: false`, and mandatory mutable
`failure: CommandFailure`, with the exact vendor-error/timed-out vocabulary.
Public constituents remain transitively used; `.fallowrc.json` rejects private
type leaks. Do not force consumer imports, add suppressions, mark fields readonly,
or make refusal cause optional. Refresh exact traces at the actual pre-edit HEAD.
**Disposition:** Accepted/open at R. Six E7 exact impacts and actual inferred
controls use support a contract-preserving repair; they do not authorize a
different public shape. Existing compiler positives/negatives are meaningful.

### CR-04-POLICIES-005: Name the injected clock state by its role

**Classification:** WARNING. **Requirement:** RUN-01.
**File:** `test/runtime/failureLog.test.ts:19–25`.
**Rule:** Unit writer/Naming values; reviewer/Naming explicitly prohibits `value`.
**Issue:** The shared case-construction helper calls its epoch-millisecond state
`value`. This hides the time domain in the very helper driving cadence cases.
**Fix:** Rename the local binding to `nowMs` or `wallTimeMs`, retaining the
fresh-per-call injected clock. No production clock or public shape changes.
**Disposition:** Accepted/open at R; 04-03-02 owns the minimum owner-only fix.

### CR-04-POLICIES-006: Separate the reminder constant's act and assert

**Classification:** WARNING. **Requirement:** RUN-01.
**File:** `test/runtime/failureLog.test.ts:54–58`.
**Rule:** Unit writer/reviewer, Case structure: separate lowercase AAA phases;
`act & assert` only for one throwing/rejection assertion.
**Issue:** A normal equality of the exported constant is labeled `act & assert`
and lacks the required phases. This is a useful numeric contract, not a
throwing/rejection expression or a type-only case.
**Fix:** Capture the public constant in act, then compare it with the independent
literal 900000 in assert, with the required arrange/act/assert markers.
**Disposition:** Accepted/open at R; keep the value assertion rather than remove it.

### CR-04-POLICIES-009: Finish the reset action before asserting its observation

**Classification:** WARNING. **Requirement:** RUN-01.
**File:** `test/runtime/retryPolicy.test.ts:87–96`.
**Rule:** Unit writer/reviewer, Case structure/AAA and behavior titles.
**Issue:** `policy.nextDelayMs()` is executed inside the assertion, where it
mutates attempt. The named successful attempt is not arranged: the case
directly advances the counter and explicitly calls reset.
**Fix:** Perform reset and the next-delay read in act, capture delay and attempt,
then assert the independent whole observation. Name the case after explicit
reset behavior, or add the real scenario needed for a broader success claim.
Do not change reset semantics or infer automatic reset on every callback.
**Disposition:** Accepted/open at R. Boundary protection remains separately 008.

### CR-04-POLICIES-010: Keep retry tests focused on retry behavior, with silent logging

**Classification:** WARNING. **Requirement:** RUN-01.
**File:** `test/runtime/retryPolicy.test.ts:10–31,148–177`.
**Rule:** Unit writer/reviewer, Test doubles: “Logging gets a silent stub;
log calls are asserted only in a module whose job is logging.”
**Issue:** The scheduling owner's abort/rejection cases assert recorded logger
messages and carry a logger recorder for that purpose. Scheduling and pending
ownership are this module's promise; using diagnostic text as the observation
couples those tests to the incidental reporting surface. The logging module's
own complete streams remain appropriate and are not included in this finding.
**Fix:** Use a silent typed logging stub. Observe that the rejecting callback
actually ran, no rejection escapes, pending clears, and another schedule can
run; preserve explicit no-callback behavior on abort. Do not weaken the rejection
test by merely removing its current recorded-message assertion.
**Disposition:** Accepted/open at R; current safe debug production message need
not change. No privacy leak or production defect is asserted.

### CR-04-POLICIES-011: Declare the logger helper's named function as a declaration

**Classification:** WARNING. **Requirement:** RUN-01.
**File:** `test/runtime/retryPolicy.test.ts:12–15`.
**Rule:** style/Functions: named functions are declarations; a const arrow is
allowed only with an explicit function type or an outer-this requirement.
**Issue:** `const write = (...) => ...` has an annotated return, not an explicit
function-type annotation, and captures no `this`. It is a named helper under
the declaration rule.
**Fix:** If still needed after 010, use a named `function write(...)` declaration.
If 010 removes the recorder, remove its now-unused helper in that owning cause;
record this ID's disposition as fixed by the same minimum repair, not a new cause.
**Disposition:** Accepted/open at R; no source API change is necessary.

### CR-04-POLICIES-012: Use the prescribed callback double for promised invocations

**Classification:** WARNING. **Requirement:** RUN-01.
**File:** `test/runtime/retryPolicy.test.ts:40–51,99–113,130–163`.
**Rule:** Unit writer/reviewer, Test doubles: prescribed callback interactions
use case-owned `strong-mock` with exactParams and explicit verify; scope requires
context-owned doubles or case-owned strong-mock rather than a custom tracker.
**Issue:** `countedWork()` hand-rolls an invocation recorder and reader, then
uses that reader to verify prescribed callback counts. It is a custom spy/mock,
not a stateful boundary fake or a canned-value stub. The callback invocation is
the stated public interaction in these cases.
**Fix:** Model the promised callback through a narrow case-owned strict mock,
state exact allowed calls, pass its callback to schedule, assert public state
before explicit verify. A case-owned recorder can accompany mocks where an
ordered timeline is needed, but must not replace their verification. Keep fresh
dependencies for each case and avoid a process-wide registry.
**Disposition:** Accepted/open at R; this double-choice issue is separate from
008's missing timing/pending observations and must not weaken those repairs.

## Stable locations and triage ledger

R is the full revision above. Each entry is RUN-01; headers also carry PROC-03.
All first observers/triagers are policies_initial_review. Every disposition is
accepted/open; repair/evidence hashes and committed paths are absent, not pending
passes. E1–E6 are current passing native baseline evidence for every row, not
proof that a finding is fixed. E7 additionally applies to 002.

| ID suffix | Severity | Initial revision-qualified location | Current revision-qualified location | Owning task |
| --- | --- | --- | --- | --- |
| 001 | WARNING | R:src/runtime/commandPort.ts:1–14; R:test/runtime/commandPort.test.ts:1 | R:src/runtime/commandPort.ts:1–14; R:test/runtime/commandPort.test.ts:1 | 04-03-01 header-only cause |
| 002 | WARNING | R:src/runtime/commandPort.ts:19–20 | R:src/runtime/commandPort.ts:19–20 | 04-03-01 |
| 003 | WARNING | R:src/runtime/failureLog.ts:1–3; R:test/runtime/failureLog.test.ts:1–8 | R:src/runtime/failureLog.ts:1–3; R:test/runtime/failureLog.test.ts:1–8 | 04-03-02 header-only cause |
| 004 | BLOCKER | R:test/runtime/failureLog.test.ts:141–157 | R:test/runtime/failureLog.test.ts:141–157 | 04-03-02 |
| 005 | WARNING | R:test/runtime/failureLog.test.ts:19–25 | R:test/runtime/failureLog.test.ts:19–25 | 04-03-02 |
| 006 | WARNING | R:test/runtime/failureLog.test.ts:54–58 | R:test/runtime/failureLog.test.ts:54–58 | 04-03-02 |
| 007 | WARNING | R:src/runtime/retryPolicy.ts:1–7; R:test/runtime/retryPolicy.test.ts:1–8 | R:src/runtime/retryPolicy.ts:1–7; R:test/runtime/retryPolicy.test.ts:1–8 | 04-04-01 header-only cause |
| 008 | BLOCKER | R:test/runtime/retryPolicy.test.ts:64–145 | R:test/runtime/retryPolicy.test.ts:64–145 | 04-04-01 |
| 009 | WARNING | R:test/runtime/retryPolicy.test.ts:87–96 | R:test/runtime/retryPolicy.test.ts:87–96 | 04-04-01 |
| 010 | WARNING | R:test/runtime/retryPolicy.test.ts:10–31,148–177 | R:test/runtime/retryPolicy.test.ts:10–31,148–177 | 04-04-01 |
| 011 | WARNING | R:test/runtime/retryPolicy.test.ts:12–15 | R:test/runtime/retryPolicy.test.ts:12–15 | 04-04-01 |
| 012 | WARNING | R:test/runtime/retryPolicy.test.ts:40–51,99–163 | R:test/runtime/retryPolicy.test.ts:40–51,99–163 | 04-04-01 |

## Candidate dispositions and full manual judgments

| Candidate/rule family | Independent judgment at R |
| --- | --- |
| S-04-02, inline object union | Accepted only as 002 under exact style/Types rule. Registry's public variants are the bounded analog; no new product result vocabulary. |
| S-04-03, optional versus present-undefined | No optionality repair in this batch. Command refusal cause is required. FailureLogOptions and RetryPolicyOptions fields are required concrete values. `Map.get()` may return undefined but is not an optional interface-field declaration. No nullable alias is introduced. Required-present absence is demonstrated by the health compiler analog; do not generalize its unrelated fields into these APIs. |
| S-04-04, readonly | Rejected for these public interface fields. style/Classes requires readonly for class fields, not every interface member. No reviewed source declares a class. Existing command outcomes/options are mutable contracts; retry's attempt/pending are already readonly getters. Preserve that exact distinction. |
| S-04-05, whole promises | Accepted 004/008. The other failureLog cases compare complete independent streams. Their supplied literal reasons are test input, not production-derived expected values. Retry's run counts can prove multiplicity; they cannot prove exact wait or pending duration. |
| S-04-01/06/07/08 | Outside this six-file batch. Store candidate has its PORTS history; ACCOUNT cancellation/privacy and TRUST arrival-history questions remain with their own full reviewers. |
| Type-only command owner | Positive accepted/refused/vendor-error/timed-out/port shapes and negative missing failure, mixed forms, invalid vocabulary and silent port return were inspected. No runtime wrapper is needed. Extra cancel negative pins the declared one-method boundary, not an attempted analysis of whether a member is read. No unused-API claim is inferred from that negative. |
| Source imports/exports/types | Relative .js/type-only imports correct. Public function/options/port exports carry JSDoc and are used through imports or public signatures. No assertion, any, non-null assertion, private leak, suppression, unsafe coercion, prototype/global mutation or default live boundary found. 002 is the specific object-definition exception. |
| Default timers import | Keep it. The owning plan/protocol explicitly preserve the module object for context timer interception. Installed node test definitions and passing controlled runs support that local behavior. A generic import-style cleanup cannot replace it with the unsupported named binding. |
| Errors and guarded work | Read all retry catches and callers. Callback errors are swallowed with fixed debug text; aborted wait is owned, finally clears pending. No empty unexplained catch, escaping asynchronous callback rejection, unsafe error serialization, new retry policy or current production bug established. Invalid custom maxDelay values are not a new product-validation requirement: composition supplies MAX_BACKOFF_MS. |
| Scheduling test hermeticity | All state/factories are per case; timers use current t.mock. Awaited nextEventLoopTurn is a settling boundary under the explicit scheduling analog, not elapsed-time polling/sleep. No network, hardware, credential, home-file, global mock registry or production test hook. 012 concerns callback-double construction. |
| Comments/titles | Every complete source and owner comment/title inspected. Durable D-/SYNC-/AUTH-/CTRL- anchors are permitted. No GSD phase/plan/wave/task history or removed-code narration found. Retry title/action mismatch is 008/009; timer import note remains relevant. Header defects separately allocated. |
| Remaining style/manual rules | No classes, switches, enums, namespace, decorators, thrown non-Errors, dangerous functions, mutable module state or public function misuse. Closure state is factory-owned. Literal/time units are named. No unrelated formatting preference is promoted into a finding; named-arrow exception is 011. |
| Pairing/coverage/test organization | Exactly three mirrored owners, native runner and strict assertions, ESM compiled layout, no skip/only/todo/coverage exception. Declaration-only owner is honest. Failure-log methods have independent cases and fresh injected clocks. Retry rows are sibling tests, not looped assertions in one test. No new helper or external adaptation exists. |

## Call chains and public-contract preservation

`accountRuntime` imports command types, implements `commands.send()` at
1088–1103 and returns exact accepted/refused outcomes. `commandFailureOf()`
maps TimeoutError to timed-out and other errors to vendor-error.
`controls.answerWrite()` at 538–570 consumes the inferred send result at
563–566: false acceptance narrows to mandatory failure. It does not import
CommandOutcome. Platform/adapter options and test/World ports carry the public
structural shape. The controls owner's scripted outcomes at 104–117 were also
read. Public `createAccountRuntime(options: AccountRuntimeOptions)` and
`createAccountRuntimeFromConfig(deps: AccountRuntimeDeps)` were inspected;
public signature exposure is not equivalent to a count of named imports.

Six independent installed Fallow exact-symbol impacts at R (one project per
command) corroborate named consumers. All return exit 0, status complete,
identity completeness complete, expected selected_project, and no omitted
evidence fields. Counts below are named consumers, not exhaustive inference:

| Target | tsconfig.json | tsconfig.test.json |
| --- | ---: | ---: |
| CommandOutcome | 1 | 3 |
| CommandFailure | 2 | 3 |
| CommandPort | 4 | 9 |

The source outcome consumer is accountRuntime; test-project additions are
controls owner and command owner. CommandFailure adds controls source;
CommandPort spans runtime, platform, basementGuardian, controls, their relevant
owners and synthetic World. RealWorld did not appear as a named CommandPort
consumer. No deletion, visibility change or private-alias removal is proposed;
future fixers must refresh exact relevant traces at their actual pre-edit HEAD.

`accountRuntime.createAccountRuntime()` creates two policies with the same root
signal at 331–333. `createAccountRuntimeFromConfig()` supplies MAX_BACKOFF_MS
and FailureLog with the wall clock at 1269–1273. `shadow.scheduleReconnect()`
at 298–304 schedules one owned reopening callback; successful subscription at
370–374 resets its policy. Retry is unrelated to potentially delivered command
retries, which remain forbidden. Full shutdown cancellation is not inferred for
an already-running arbitrary callback.

FailureLog callers were traced through accountRuntime: poll success/failure
747–754, shadow success/failure 762–793/899, authentication 720/1042, rotation
952–960, per-device silence/recovery 653–655 and silent pruning 523–524.
Its map is per kind and uses the injected wall clock; it must remain distinct
from monotonic silence measurement and auth's lastTransient-kind analog.
The fixed reason/classification boundary and opaque-key assumption are
preserved; this report does not certify arbitrary caller-provided text or a
new privacy permission. No API factory or consumer was edited.

## Native evidence and exact scope

Evidence directory: `/private/tmp/guardian-04-policies-initial-native/`.
`initial-inputs.json` records cwd, UTC, R, Node v26.11.1, npm 11.20.0, exact
six source blobs/SHA-256, empty dirty diff and no untracked paths. Each native
command has its exact argv/cwd/start/end/raw exit/HEAD/runtime/input-manifest
reference in `<slug>.json`; full unaltered stdout/stderr are adjacent files.

| Evidence | Exact command | UTC interval on 2026-10-15 | Raw exit / scope |
| --- | --- | --- | --- |
| E1 static | `npm run check:static` | 00:47:12.954979–00:47:16.265215 | 0; all six static commands passed; static.stdout/stderr/json |
| E2 build | `npm run build:test` | 00:47:16.265773–00:47:18.921239 | 0; strict test project; build.stdout/stderr/json |
| E3 owners | `node --test --test-reporter=tap dist-test/test/runtime/commandPort.test.js dist-test/test/runtime/failureLog.test.js dist-test/test/runtime/retryPolicy.test.js` | 00:47:18.921857–00:47:19.171357 | 0; 31 native test records, 4 suites, 0 fail/cancel/skip/todo; owners.stdout/stderr/json |
| E4 command direct | `npm run test:coverage:direct -- src/runtime/commandPort.ts test/runtime/commandPort.test.ts` | 00:47:19.171939–00:47:22.577329 | 0; declaration-only selector acceptance; command-direct.stdout/stderr/json |
| E5 failure direct | `npm run test:coverage:direct -- src/runtime/failureLog.ts test/runtime/failureLog.test.ts` | 00:47:22.577862–00:47:25.915320 | 0; isolated selector enforces all line/function/branch hits; failure-direct.stdout/stderr/json |
| E6 retry direct | `npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts` | 00:47:25.915850–00:47:29.257453 | 0; isolated selector enforces all line/function/branch hits; retry-direct.stdout/stderr/json |

E3 contains 15 failure-log cases, 15 retry cases, and the declaration-only file's
native file-success record. CommandPort declares **zero runtime cases**; that
file-success record is not an invented behavioral assertion.

E7 exact Fallow argv for each of CommandOutcome, CommandFailure, CommandPort,
each run separately with each of tsconfig.json and tsconfig.test.json:

```text
node_modules/.bin/fallow dead-code --type-aware --symbol-impact src/runtime/commandPort.ts:<symbol> --type-aware-project <project> --type-aware-require complete --format json --quiet --explain
```

Exact substituted argv/times/exits are `<symbol>-<project>.json`; stdout retains
full checker envelopes and stderr is separate. Live installed skill and help
were read first. These six checks ran after the focused owner/direct commands.

Additional isolated native coverage captures retain the actual denominators
that the silent direct selector does not print. For each of commandPort,
failureLog and retryPolicy, exact substituted argv is in
`<pair>-native-coverage.json`:

```text
node --test --experimental-test-coverage --test-coverage-include=dist-test/src/runtime/<pair>.js --test-reporter=tap --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=/private/tmp/guardian-04-policies-initial-native/<pair>.lcov dist-test/test/runtime/<pair>.test.js
```

All returned 0 on unchanged R. Native compiled LCOV: failureLog **LH/LF 44/44,
FNH/FNF 4/4, BRH/BRF 9/9**; retryPolicy **69/69, 8/8, 15/15**. CommandPort's
LCOV is empty as expected for declarations, with no source coverage percentage
claimed. Selected checks do not refresh merged whole-project LCOV.

The prior full-gate metadata was read at
`/private/tmp/guardian-phase4-wave2-gate.json`: `npm run check`, exit 0,
1993aaa0b3d468b2e78d0ccacd353b713739c4ef, v26.11.1,
00:43:09.634130–00:43:44.569875 UTC, with original full log path. The required
comparison
`git diff 1993aaa0b3d468b2e78d0ccacd353b713739c4ef -- . ':(exclude,glob).planning/**/*.md'`
is **nonempty**, changing `.planning/state.json` updated_at. The exact diff is
retained in initial-inputs.json. Therefore no unchanged-input full-gate reuse is
asserted. Fresh focused evidence above was obtained; the parent retains
responsibility for later combined-wave and phase gates.

## Bug histories, controls, and next review

No source/test/helper edits, source controls, failing regressions, evidence
commits, fixes, hook runs, installs or live/private-data operations were performed.
No RED JSON is justified. Plausible wrong behaviors in 004/008 are manual
test-quality analysis, explicitly not observed mutation results. All native
GREEN results refer to the unchanged implementation.

The reviewer writes only this initial report. Complete repairs must precede
the first independent **full six-file** correction (plus actual additions).
Its opening set is the 12 IDs above; it must record fixed/rejected/new/reopened/
closing sets and exact arithmetic before considering D-03. Header-only IDs
remain distinct. The retry slice cannot be declared clean after command/log
repairs. Current open count is **12**, correction counter **0**, and no accepted
cause has been independently closed.

_Reviewer: policies_initial_review (gsd-code-reviewer). Initial review only._

## Repair evidence: CR-04-POLICIES-001

Applied by `policies_fix_001` (`gsd-code-fixer`), task 04-03-01, under
`/root/phase4_policies_first/policies_fix_001`. Disposition: **applied, pending
independent full correction**. This appendix preserves the initial review above;
it does not close any ID independently. The continuous opening set remains
001–012, open count **12**, correction counter **0**, production bugs **0**.

The source and owner now start with MIT SPDX, a separate
`Copyright (c) 2026 Alessandro Colomba` JSDoc, and a separate purpose
`@fileoverview` JSDoc, with one blank line between sections and before imports.
The source overview retains its existing injection/capability rationale.
All bytes from the source import onward and all original owner bytes are
unchanged. No type, body, compiler assertion, helper, package or consumer changed.
No RED history or source control mutation is appropriate for this header cause.

Initial locations remain R:src/runtime/commandPort.ts:1–14 and
R:test/runtime/commandPort.test.ts:1. Current repair-input locations are
R + the exact retained dirty diff: src/runtime/commandPort.ts:1–20 and
test/runtime/commandPort.test.ts:1–11. The terminal commit identifies the
committed revision for these same locations; no self-referential hash is claimed.

All checks ran in the existing checkout at the absolute root recorded above,
on `features/code-review-sweep`, with base and pre-edit HEAD
`e25e26e6232ed99411b7463a7f9839c5eb837ec0`, Node v26.11.1 and npm 11.20.0.
The pre-plan baseline was persisted in the checkout's Git metadata before commit.
Its sandbox failure and authorized successful retry remain native evidence.

Native evidence root: `/private/tmp/guardian-04-policies-fix-native/001/`.
Each numbered command folder contains `command.json` (exact argv, cwd, UTC
start/end and raw exit), unaltered `stdout.raw` and `stderr.raw`, and before/after
manifests with HEAD, Node/npm, source blobs/SHA-256, dirty/staged diffs and exact
owned/untracked bytes. Initial tool inspection preceded the native recorder;
the subsequent complete reads are retained there. The report was intentionally
untracked at dispatch and joins this first cause commit with its history intact.

| Command / native folder | Actual result |
| --- | --- |
| Exact three-path Fallow guard / `012-guard` | Exit 0; no boundary zones or rule packs configured |
| Baseline / `014-baseline`, `015-baseline-retry` | Exit 1 filesystem restriction; authorized retry exit 0 |
| `npm run build:test` / `017-build` | Exit 0; strict test project |
| `node --test --test-reporter=tap dist-test/test/runtime/commandPort.test.js` / `018-owner` | Exit 0; native file-success record, no fail/cancel/skip/todo |
| `npm run test:coverage:direct -- src/runtime/commandPort.ts test/runtime/commandPort.test.ts` / `019-direct` | Exit 0; declaration-only selector acceptance, zero runtime cases; no coverage percentage claimed |
| Fallow audit against R, JSON/quiet/explain / `020-audit` | Exit 0; verdict pass |
| Header-only byte comparison / `021-change-scope`, `022-change-scope-corrected` | First comparison exit 1 due to its blank-line removal expression; corrected expression exit 0, exact nonheader bytes preserved |

The required three-path pre-step and ordinary foreground commit retain their
native outputs under this same evidence root. Their actual terminal exits and
commit hash are returned to the owning executor. The parent owns the later
combined full gate and independent full six-file correction; no full-project
pass or partial-clean POLICIES verdict is asserted here.

## Repair evidence: CR-04-POLICIES-002

Applied by `policies_fix_002` (`gsd-code-fixer`), task 04-03-01, under
`/root/phase4_policies_first/policies_fix_002`. Disposition: **applied, pending
independent full correction**. Initial review and the 001 appendix remain intact.
The opening set remains 001–012, open count **12**, correction counter **0**,
and production bugs **0**. This cause does not issue a clean batch verdict.

The source declares documented public `AcceptedCommandOutcome` and
`RefusedCommandOutcome` interfaces. Existing exported `CommandOutcome` uses
their union, so both constituents serve the existing public contract transitively.
The exact mutable true/false discriminants, required mutable failure field,
vendor-error/timed-out vocabulary and `CommandPort.send` signature remain intact.
No private alias was deleted, no consumer was changed, and no forced import or
suppression was added. `.fallowrc.json` retains private-type-leaks at error.
The registry's public variants supplied the declaration pattern; the health
owner supplied the compiler-contract pattern without transferring their meanings.

All original command-owner positives and negatives remain. Three added compiler
negatives reject an absent accepted field, a string accepted field and an invalid
failure within a refusal. No runtime wrapper, helper, new package, source control
mutation or genuine RED evidence was introduced. This is the accepted interface
conformance warning, not an observed production defect.

Initial location remains R:src/runtime/commandPort.ts:19–20. Actual pre-edit HEAD
is `8052f8078e36e9aaa6d64a5e0c0ffaef3b676140`; the inline union was at line 25.
Current locations at that HEAD plus the retained exact dirty diff are
src/runtime/commandPort.ts:24–36 and test/runtime/commandPort.test.ts:29–34.
The ordinary cause commit identifies their committed revision through terminal
native evidence; no self-referential commit hash is claimed in this appendix.

All six fresh exact-symbol impacts ran BEFORE editing, each with one
`--type-aware-project`, `--type-aware-require complete --format json --quiet
--explain`. Each raw envelope has status complete, identity completeness complete,
the expected selected_project, and no omitted evidence field. CommandOutcome has
1/3 direct consumers, CommandFailure 2/3 and CommandPort 4/9 for production/test
projects respectively. These counts describe named consumers only.

Actual `commands.send` production and inferred consumers were read separately:
accountRuntime.ts:1088–1103 returns the existing union; controls.ts:563–566 narrows
the inferred result before reading failure. Both public runtime factories and
their parameters/return signatures were inspected. Platform discovery context
passes runtime.commands through the accessory options into createControlBinder.
The controls, platform and accessory owner stand-ins plus synthetic World retain
structural use. No required external compatibility edit was found.

All checks ran in the existing checkout at the absolute root recorded above,
on `features/code-review-sweep`, Node v26.11.1 and npm 11.20.0. The existing
Git metadata ledger `gsd-plan-head-before-04-03` was read and matches R.
Native evidence root: `/private/tmp/guardian-04-policies-fix-native/002/`.
Numbered folders retain exact argv/cwd/UTC/raw exits, separate untouched
stdout.raw/stderr.raw, and before/after HEAD/runtime/blob/SHA-256 manifests,
exact dirty/staged diffs, owned bytes and untracked bytes. Initial interactive
reads preceded the recorder; complete books/context were also captured in 017.

| Command / native folder | Actual result |
| --- | --- |
| Live Fallow help / 001–004 | Exit 0; installed version-matched skill read before commands |
| Exact three-path guard / 005 | Exit 0; no configured boundary zones or rule packs |
| Six exact pre-edit impacts / 006–011; verification / 013 | Exit 0 each; both selected compiler projects complete at pre-edit HEAD |
| Actual consumer reads / 012, 016; source/analog/config reads / 015 | Exit 0; named, inferred, structural and public-signature evidence retained |
| Existing baseline / 014 | Exit 0; recorded R preserved |
| Modified pair reread / 018 | Exit 0; surrounding code and diff check intact |
| `npm run build:test` / 019 | Exit 0; strict test project compiles with all negatives active |
| `node --test --test-reporter=tap dist-test/test/runtime/commandPort.test.js` / 020 | Exit 0; native file success, zero authored runtime cases; no failure/cancel/skip/todo |
| `npm run test:coverage:direct -- src/runtime/commandPort.ts test/runtime/commandPort.test.ts` / 021 | Exit 0; declaration-only selector acceptance; no coverage percentage claimed |
| Fallow audit against R, JSON/quiet/explain / 022, 023 | Sandbox attempt exit 2 creating temporary base snapshot; authorized retry exit 0, verdict pass, zero unused types/exports/private leaks |

The required exact three-path clean pre-step and ordinary foreground commit
retain their native streams and terminal commit hash under this evidence root.
The audit notes two skipped TypeScript cache entry points; architecture zones
and rule packs are unconfigured. Focused evidence does not supply the parent's
combined full gate or independent full six-file correction. RUN-01 stays Pending.

## Repair evidence: CR-04-POLICIES-003

Applied by `policies_fix_003` (`gsd-code-fixer`), task 04-03-02, under
`/root/phase4_policies_first/policies_fix_003`. Disposition: **applied, pending
independent full correction**. The initial report and both earlier repair
appendices remain intact. The opening set remains 001–012, open count **12**,
correction counter **0**, and production bugs **0**. RUN-01 stays Pending.

Both failure-log files now have first-line MIT SPDX, a separate
`Copyright (c) 2026 Alessandro Colomba` JSDoc, a separate purpose
`@fileoverview` JSDoc, and one blank line between sections and before imports.
The source describes independent per-kind reporting; the owner describes its
cadence, recovery and silent-forgetting tests. All bytes from the first import
onward are unchanged in both files. No function, name, assertion, test phase,
public signature, private alias, helper, package or external consumer changed.
The distinct 004/005/006 findings remain pending their own repairs. No genuine
RED history or assertion-control mutation applies to this header cause.

Initial locations remain R:src/runtime/failureLog.ts:1–3 and
R:test/runtime/failureLog.test.ts:1–8. Actual pre-edit HEAD is
`c0f80628eb07856315de29db0d45bf76a2a37e0c`. Current header locations at that
HEAD plus the retained exact dirty diff are src/runtime/failureLog.ts:1–12 and
test/runtime/failureLog.test.ts:1–18. The terminal ordinary commit supplies the
committed revision; this appendix does not claim its own future hash.

Before any failure-log edit, fresh tracer feedback reran `npm run build:test`,
`node --test --test-reporter=tap dist-test/test/runtime/commandPort.test.js`,
and `npm run test:coverage:direct -- src/runtime/commandPort.ts
test/runtime/commandPort.test.ts`. All exited 0 on the pre-edit HEAD. The owner
has zero authored runtime cases and produces the native file-success record;
the direct result is declaration-only selector acceptance, without a coverage
percentage. This renewed feedback precedes the consumer slice and is not a
correction round.

All checks ran in the existing checkout at the absolute repository root above,
on `features/code-review-sweep`, Node v26.11.1 and npm 11.20.0. The active
phase/plan isolation sentinel records `none`. The existing Git metadata ledger
`gsd-plan-head-before-04-03` was read and matches recorded base R:
`e25e26e6232ed99411b7463a7f9839c5eb837ec0`.

Native evidence root: `/private/tmp/guardian-04-policies-fix-native/003/`.
Each command folder retains exact argv/cwd/UTC start/end/raw exit in
`command.json`, unaltered `stdout.raw` and `stderr.raw`, and before/after
manifests with HEAD, Node/npm, blobs/SHA-256, exact dirty/staged diffs,
owned bytes and untracked bytes. Initial interactive context reads preceded
the recorder; complete books, context, report, source and owner reads are also
retained in `011-complete-reads`.

| Command / native folder | Actual result |
| --- | --- |
| Pre-edit tracer build / `001-tracer-build` | Exit 0; fresh strict test build |
| Exact command-port tracer owner / `002-tracer-owner` | Exit 0; file success, zero authored runtime cases, no failure/cancel/skip/todo |
| Exact command-port tracer selector / `003-tracer-direct` | Exit 0; declaration-only acceptance |
| Installed Fallow live help / `004-help`–`006-audit-help` | Exit 0 each; version-matched full skill read before use |
| Exact three-path guard / `007-guard` | Exit 0; no architecture zones or rule packs configured |
| Existing baseline / `008-baseline` | Exit 0; R preserved |
| Header reread / `009-reread`; exact byte comparison / `015-change-scope` | Exit 0; both nonheader suffixes and all existing report history preserved |
| `npm run build:test` / `010-build` | Exit 0; fresh strict test build after header edits |
| `node --test --test-reporter=tap dist-test/test/runtime/failureLog.test.js` / `012-owner` | Exit 0; 15 cases, 4 suites, no failure/cancel/skip/todo |
| `npm run test:coverage:direct -- src/runtime/failureLog.ts test/runtime/failureLog.test.ts` / `013-direct` | Exit 0; isolated direct line/function/branch requirements pass |
| Isolated native coverage / `014-native-coverage`; `failureLog.lcov` | Exit 0; compiled LH/LF 45/45, FNH/FNF 4/4, BRH/BRF 9/9, all 100% |
| Fallow audit against R, JSON/quiet/explain / `016-audit` | Exit 0; verdict pass, zero dead-code/complexity/duplication findings |

The audit reports two skipped TypeScript cache entry points; architecture zones
and rule packs are unconfigured. The native compiled denominator above belongs
only to this isolated owner. Selected checks do not refresh merged all-pair
LCOV and do not establish a full-project pass.

The exact three-path clean pre-step, ordinary foreground commit and terminal
path/hash/clean-state checks retain their native results under this evidence
root. The parent owns the combined full gate and independent full six-file
correction. No partial-clean POLICIES verdict is issued.

## Repair evidence: CR-04-POLICIES-004

Applied by `policies_fix_004` (`gsd-code-fixer`), task 04-03-02, under
`/root/phase4_policies_first/policies_fix_004`. Disposition: **applied, pending
independent full correction**. The initial report and earlier repair appendices
remain verbatim. The opening set remains 001–012, open count **12**, correction
counter **0**, and production bugs **0**. RUN-01 stays Pending.

The hourly case compares the complete 120-entry log with an independently
authored 30-entry literal pattern, spread four times. Each pattern contains
one warning followed by 29 debug messages with the complete supplied reason.
This pins warnings at entries 0, 30, 60 and 90, every other level, complete
message text and order. Expectations use neither observed output nor production
cadence arithmetic/constants. Other cases, clock naming (005) and the constant
case's AAA (006) retain their original bytes.

Initial location remains R:test/runtime/failureLog.test.ts:141–157. Actual
pre-edit HEAD is `bd335c213ceb1671c490c822a6513aceb6eb2fa9`; the case starts
at line 151. Current location at that HEAD plus the retained dirty diff is
test/runtime/failureLog.test.ts:151–197. The terminal ordinary commit identifies
the committed revision, without a self-referential hash in this appendix.

### Separate assertion control, exact restoration and rebuilt GREEN

Plausible wrong behavior: debug logging appends ` Retry pending.` to each
reason while warning positions and counts stay correct. Type checking and lint
cannot detect that semantic change; the old hourly summary accepts four warnings
and 120 reports. After complete source/owner reads and actual accountRuntime
caller tracing, the temporary control changed only `options.log.debug(reason)`
to ``options.log.debug(`${reason} Retry pending.`)`` in failureLog.ts.
No genuine production defect or RED history is claimed; no RED JSON was created.

Native evidence root: `/private/tmp/guardian-04-policies-fix-native/004/`.
Each numbered command folder retains `command.json` with exact argv, cwd,
UTC start/end and raw exit; untouched `stdout.raw` and `stderr.raw`; before/after
HEAD, Node/npm, source blobs/SHA-256, dirty/staged diffs and exact owned/untracked
bytes. Initial interactive reads preceded this recorder; complete books and
context are also retained in 001/002. All checks ran in the existing checkout
at the absolute root above on `features/code-review-sweep`, Node v26.11.1,
npm 11.20.0; the active isolation sentinel is `none`.

| Command / native folder | Actual result |
| --- | --- |
| Full books/context and live caller/analog reads / 001–003, 008, 010 | Exit 0; accountRuntime failure/success/forget calls and wall-clock composition inspected; auth's fixed whole-stream assertion is an analog only |
| Installed Fallow live help / 004–006; exact three-path guard / 007 | Exit 0 each; no architecture zones or rule packs configured |
| Existing Git metadata baseline / 008 | Exit 0; `gsd-plan-head-before-04-03` still equals R |
| Updated owner reread / 009 | Exit 0; exact pre-control source bytes saved in `009-reread-and-snapshot/before/file-0.raw` |
| Control `npm run typecheck` / 011 | Exit 0; both compiler projects |
| Control `node_modules/.bin/eslint src/runtime/failureLog.ts test/runtime/failureLog.test.ts --max-warnings=0 --no-cache` / 012 | Exit 0 |
| Control `npm run build:test` / 013 | Exit 0; active updated owner compiled |
| Named hourly control / 014-control-hour | Raw exit 1; intended `deepStrictEqual` executes and fails; one test, one suite, zero cancel/skip/todo |
| Exact source restoration / 015 | Exit 0; saved bytes, SHA-256 and Git blob match, with no source diff against HEAD |
| Restored `npm run build:test` / 016 | Exit 0; fresh rebuild after restoration |
| Full owner `node --test --test-reporter=tap dist-test/test/runtime/failureLog.test.js` / 017 | Exit 0; 15 tests, four suites, no fail/cancel/skip/todo |
| `npm run test:coverage:direct -- src/runtime/failureLog.ts test/runtime/failureLog.test.ts` / 018 | Exit 0; isolated direct requirements pass |
| Native isolated coverage / 019; `failureLog.lcov` | Exit 0; compiled LH/LF 45/45, FNH/FNF 4/4, BRH/BRF 9/9, all 100% |
| Recorded-base Fallow audit / 020 | Exit 0; verdict pass; zero dead-code, complexity or duplication findings |
| Native intended-control semantics / 021 | Exit 0; complete expected/actual arrays each contain 120 entries; actual has four warnings, proving the old summary would pass |

The exact named-control argv is:

```text
node --test --test-reporter=tap --test-name-pattern='D-14 warns four times over an hour of failures thirty seconds apart' dist-test/test/runtime/failureLog.test.js
```

Its complete untouched assertion diff and both 120-entry streams remain in
`014-control-hour/stdout.raw`, with separate stderr and command/raw-exit metadata.
The named case ran and failed on changed debug text, with `ERR_ASSERTION` and
`deepStrictEqual`; no setup/import/filter failure supplied this evidence.
The source blob before control and after exact restoration is
`4d724a609b5da08f31b7978396fd4d240c93fe70`; its SHA-256 is
`48d4747fd23f61913e6f353f4de04729418848a90585bc9749c1e16cbaf24b79`.
No temporary control bytes enter the cause commit.

Production's per-kind map, wall-time reminder cadence, recovery, silent forget
and distinct monotonic silence domain remain unchanged. The current caller path
uses deps.clock in createFailureLog, supplied as systemClock by platform;
systemClock reads epoch milliseconds. Auth's last-transient-kind policy was
not transferred. No API, consumer, private alias, helper, package or private
input changed. Only the owner and this report are committed.

The Fallow audit command uses recorded base
`e25e26e6232ed99411b7463a7f9839c5eb837ec0` with JSON/quiet/explain flags.
Architecture zones and rule packs remain unconfigured; isolated native coverage
does not refresh merged all-pair LCOV. Exact two-path clean pre-step, ordinary
foreground commit, raw hook output and terminal path/hash/source-restoration
checks remain under this evidence root. The parent owns the combined full gate
and independent full six-file correction. No partial-clean verdict is issued.

## Repair evidence: CR-04-POLICIES-005

Applied by `policies_fix_005` (`gsd-code-fixer`), task 04-03-02, under
`/root/phase4_policies_first/policies_fix_005`. Disposition: **applied, pending
independent full correction**. The initial report and prior repair appendices
remain intact. The opening set remains 001–012, open count **12**, correction
counter **0**, and production bugs **0**. RUN-01 stays Pending.

The `movableClock()` local state is named `wallTimeMs` at its declaration,
clock read and advance assignment. An exact byte comparison confirms these
three replacements are the entire owner change. Each factory call still owns
fresh epoch-millisecond state initialized to 1_700_000_000_000; the signature,
clock object, advance function, all cases and assertions retain their bytes.
This private binding rename deletes no alias and changes no shared signature.
Production is unchanged. No helper, package, RED evidence or control applies.

Initial location remains R:test/runtime/failureLog.test.ts:19–25. Actual
pre-edit HEAD is `5f07760a4bcc48195198818292c90ef0654608d2`; current location
at that HEAD plus the retained exact dirty diff is
test/runtime/failureLog.test.ts:29–37. Terminal ordinary commit evidence
identifies the committed revision without a self-referential hash here.

All checks ran in the existing checkout at the absolute repository root above,
on `features/code-review-sweep`, Node v26.11.1 and npm 11.20.0. The persisted
04-03 isolation sentinel is `none`. Root, branch, clean pre-edit HEAD and
existing `gsd-plan-head-before-04-03` ledger were asserted before editing;
the ledger still records R, `e25e26e6232ed99411b7463a7f9839c5eb837ec0`.
Complete AGENTS, all five books, full report, plan, CONTEXT, REVIEW-PROTOCOL,
source and owner were read before editing; every movableClock caller is in
the fully read owner. Installed full Fallow skill and live help preceded guard.

Native evidence root: `/private/tmp/guardian-04-policies-fix-native/005/`.
Each numbered command folder retains exact argv/cwd/UTC/raw exit in
`command.json`, separate untouched `stdout.raw` and `stderr.raw`, and
before/after manifests with HEAD, runtime versions, blobs/SHA-256, exact
dirty/staged diffs, owned bytes, production bytes and untracked bytes.

| Command / native folder | Actual result |
| --- | --- |
| Live Fallow help / 001–003; exact two-path guard / 004 | Exit 0 each; no architecture zones or rule packs configured |
| Pre-edit root/branch/HEAD/sentinel/ledger assertions / 005 | Exit 0; clean assigned checkout and recorded base preserved |
| Modified section reread and exact byte comparison / 006 | Exit 0; exactly three lexical replacements; production unchanged |
| `npm run build:test` / 007 | Exit 0; fresh strict test build |
| `node --test --test-reporter=tap dist-test/test/runtime/failureLog.test.js` / 008 | Exit 0; 15 cases, four suites, zero fail/cancel/skip/todo |
| `npm run test:coverage:direct -- src/runtime/failureLog.ts test/runtime/failureLog.test.ts` / 009 | Exit 0; isolated direct requirements pass |
| Isolated native coverage / 010; `failureLog.lcov` | Exit 0; compiled LH/LF 45/45, FNH/FNF 4/4, BRH/BRF 9/9, all 100% |
| Fallow audit against R, JSON/quiet/explain / 011 | Exit 0; verdict pass; zero dead-code/complexity/duplication findings |

The exact two-path clean pre-step, ordinary foreground commit and terminal
path/hash/clean-state checks retain their actual native results under this
evidence root. Isolated coverage does not refresh merged all-pair LCOV.
The parent owns the combined full gate and independent full six-file correction;
no full-project pass or partial-clean POLICIES verdict is asserted.

## Repair evidence: CR-04-POLICIES-006

Applied by `policies_fix_006` (`gsd-code-fixer`), task 04-03-02, under
`/root/phase4_policies_first/policies_fix_006`. Disposition: **applied, pending
independent full correction**. The initial report and all prior repair
appendices remain verbatim. Repairs 001–006 are now applied pending that
whole-batch review; retry causes 007–012 remain for 04-04. The accepted opening
set remains 001–012, open count **12**, correction counter **0**, and production
bugs **0**. No accepted cause has independent closure. RUN-01 stays Pending.

The constant case has separate lowercase arrange, act and assert markers.
Arrange sets the independent expected reminder to `900_000`; act captures
the exported `FAILURE_REMINDER_MS`; assert compares that capture with the
expectation. An exact byte comparison confirms this case is the entire owner
change. The title, fifteen-minute numeric contract, hourly whole-stream
assertion, clock naming and all other owner bytes remain intact. Production
is unchanged. No API, signature, private alias, helper or package changed.
No production bug, RED history or assertion control applies to this repair.

Initial location remains R:test/runtime/failureLog.test.ts:54–58. Actual
pre-edit HEAD is `da5269fac68cdb76e915b7226eeca3f9b8cb29af`; the current case
is at test/runtime/failureLog.test.ts:65–75 at that HEAD plus the retained
exact dirty diff. The terminal ordinary commit supplies its committed revision
without a self-referential hash in this appendix.

All checks ran in the existing checkout at the absolute repository root above,
on `features/code-review-sweep`, Node v26.11.1 and npm 11.20.0. The persisted
04-03 isolation sentinel records `none`. Root, branch, clean pre-edit HEAD,
sentinel and existing Git metadata ledger `gsd-plan-head-before-04-03` were
asserted before editing. The ledger remains R:
`e25e26e6232ed99411b7463a7f9839c5eb837ec0`.
Complete AGENTS, all five books, full report, owning plan, CONTEXT,
REVIEW-PROTOCOL, source and owner were read. This test callback is registered
with `node:test`; no production function or caller changes. The installed
full Fallow skill and live help preceded the exact two-path guard.

Native evidence root: `/private/tmp/guardian-04-policies-fix-native/006/`.
Each numbered command folder retains exact argv/cwd/UTC/raw exit in
`command.json`, separate untouched `stdout.raw` and `stderr.raw`, and
before/after manifests with HEAD, Node/npm, blobs/SHA-256, exact dirty/staged
diffs, owned bytes, production bytes and untracked bytes.

| Command / native folder | Actual result |
| --- | --- |
| Live Fallow help / 001–003; exact two-path guard / 004 | Exit 0 each; architecture zones and rule packs are unconfigured |
| Root/branch/HEAD/sentinel/ledger assertions / 005 | Exit 0; clean assigned checkout and recorded base preserved |
| Modified section reread and exact byte comparison / 006 | Exit 0; constant case only; production unchanged |
| `npm run build:test` / 007 | Exit 0; fresh strict test build |
| `node --test --test-reporter=tap dist-test/test/runtime/failureLog.test.js` / 008 | Exit 0; 15 cases, four suites, zero fail/cancel/skip/todo |
| `npm run test:coverage:direct -- src/runtime/failureLog.ts test/runtime/failureLog.test.ts` / 009 | Exit 0; isolated direct requirements pass |
| Isolated native coverage / 010; `failureLog.lcov` | Exit 0; compiled LH/LF 45/45, FNH/FNF 4/4, BRH/BRF 9/9, all 100% |
| Recorded-base Fallow audit, JSON/quiet/explain / 011 | Exit 0; verdict pass; zero dead-code, complexity or duplication findings |

The exact two-path clean pre-step, ordinary foreground commit and terminal
path/hash/clean-state checks retain their actual native results under this
evidence root. Isolated checks do not refresh merged all-pair LCOV. The parent
owns the combined full gate and independent full six-file correction. No
full-project pass or partial-clean POLICIES verdict is issued.
