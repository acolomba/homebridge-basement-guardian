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

## Repair evidence: CR-04-POLICIES-007

Applied by `policies_fix_007` (`gsd-code-fixer`), task 04-04-01, under
`/root/phase4_policies_finish/policies_fix_007`. Disposition: **applied, pending
independent full correction**. The initial report and all previous repair
appendices remain verbatim. Repairs 001–007 are applied pending that review;
retry causes 008–012 retain their separate scope. The opening set remains
001–012, open count **12** (2 BLOCKER, 10 WARNING), correction counter **0**,
and production bugs **0**. No ID is independently closed. RUN-01 stays Pending.

Both retry files now have first-line MIT SPDX, a separate
`Copyright (c) 2026 Alessandro Colomba` JSDoc, a separate concise purpose
`@fileoverview` JSDoc, and one blank line between sections. The existing timer
import explanation remains beside its module-object default import, after the
blank line following the overview. The owner has one blank line before imports.
Exact byte comparison confirms the source suffix starting at the timer note
and the entire original owner starting at its first import are unchanged.
No function, name, signature, assertion, helper, package or consumer changed.
No production bug, RED JSON or assertion control applies to this header cause.

Initial locations remain R:src/runtime/retryPolicy.ts:1–7 and
R:test/runtime/retryPolicy.test.ts:1–8. Actual pre-edit HEAD is
`ca0ebbc3f020bd6ad0bbcaf3be5dcd1ee0341950`. Current header locations at that
HEAD plus the exact retained dirty diff are src/runtime/retryPolicy.ts:1–16
and test/runtime/retryPolicy.test.ts:1–18. The terminal ordinary commit supplies
the committed revision without a self-referential hash in this appendix.

All checks ran in the existing checkout at the absolute repository root above,
on `features/code-review-sweep`, Node v26.11.1 and npm 11.20.0. The directly
read persisted sentinel records phase 04, plan 04-04, isolation `none`.
The Git metadata ledger `gsd-plan-head-before-04-04` was persisted before the
first commit and records the actual pre-edit HEAD above. The recorded batch
audit base remains R, `e25e26e6232ed99411b7463a7f9839c5eb837ec0`.
Complete AGENTS, all five books, full source, owner, existing report, owning
plan, CONTEXT, REVIEW-PROTOCOL and PATTERNS were read before editing. Actual
retry composition and shadow schedule callers were inspected. No contract or
private alias changed, so exact-symbol impacts were not required. The complete
installed Fallow skill and live help preceded the exact three-path guard.

Native evidence root: `/private/tmp/guardian-04-policies-fix-native/007/`.
Each numbered command folder retains exact argv/cwd/UTC start/end/raw exit
in `command.json`, separate untouched `stdout.raw` and `stderr.raw`, and
before/after manifests with HEAD, runtime versions, Git blobs/SHA-256,
exact dirty/staged diffs, owned bytes and untracked bytes.

| Command / native folder | Actual result |
| --- | --- |
| Live installed Fallow help / 001–003; exact three-path guard / 004 | Exit 0 each; architecture zones and rule packs are unconfigured |
| Root/branch/HEAD/sentinel assertions and baseline persistence / 005 | Exit 0; authorized external Git metadata write, clean assigned checkout |
| Header diff reread / 006; exact nonheader/history comparison / 013 | Exit 0; both approved headers present and all existing nonheader/history bytes preserved |
| `npm run build:test` / 007 | Exit 0; fresh strict test build |
| `node --test --test-reporter=tap dist-test/test/runtime/retryPolicy.test.js` / 008 | Exit 0; 15 tests, zero fail/cancel/skip/todo |
| `npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts` / 009 | Exit 0; isolated direct requirements pass |
| Isolated native coverage / 010; `retryPolicy.lcov` | Exit 0; compiled LH/LF 75/75, FNH/FNF 8/8, BRH/BRF 15/15, all 100% |
| Recorded-base Fallow audit, JSON/quiet/explain / 011, 012 | Sandbox attempt exit 2 creating baseline snapshot; authorized retry exit 0, verdict pass, zero dead-code/complexity/duplication findings |

The audit reports two skipped TypeScript cache entry points. Selected checks
do not refresh merged all-pair LCOV. The exact three-path clean pre-step,
ordinary foreground commit, raw hook output and terminal path/hash/clean-state
checks remain under this evidence root. The parent owns the combined full gate
and independent full six-file correction. No full-project pass or partial-clean
POLICIES verdict is issued.

## Repair evidence: CR-04-POLICIES-008

Applied by `policies_fix_008` (`gsd-code-fixer`), task 04-04-01, under
`/root/phase4_policies_finish/policies_fix_008`. Disposition: **applied, pending
independent full correction**. All prior report bytes remain intact. Repairs
001–008 are applied pending that review. The opening set remains 001–012,
open count **12** (2 BLOCKER, 10 WARNING), correction counter **0**, and
production bugs **0**. No ID is independently closed. RUN-01 stays Pending.

Eight fresh sibling cases exercise `schedule()` through preceding scheduled
callbacks, then observe completion, attempt and pending immediately after the
target request, one millisecond before its deadline, and at its deadline.
Independent scenario literals cover delays 500, 1000, 2000, 4000, 8000, 16000,
30000 and the repeated 30000 cap. A separate schedule/reset/schedule case
observes the explicit reset and the new 499/500 boundary after two completed
scheduled attempts. All nine `nextDelayMs()` rows retain their values and
assertions; their titles now describe returned delays.

Two fresh cases hold the callback promise unresolved until explicit resolution
or rejection. Their whole public timelines include callback starts and
completions, attempt and pending at 499/500, duplicate refusal during the wait
and outstanding callback, another 30000 milliseconds while work remains held,
settlement, and a new callback's 999/1000 boundary and completion. Each case
owns exact-parameter strict mocks, complete expectations and explicit final
verification after public-state assertions. Callback recorders accompany those
mocks. No private state reader, new policy, real timer wait or helper file was
added. The case-owned deferred promise uses the project's ES2022 library.

The existing reset case, all existing scheduled/abort/rejection cases,
`countedWork`, `recordingLog` and their comments retain their exact bytes.
Findings 009–012 remain for their own repairs. The only original owner edits
are the strict-mock import and returned-delay title template; all functional
observations above are additions. Both 007 headers remain unchanged.

Initial location remains R:test/runtime/retryPolicy.test.ts:64–145. Actual
pre-edit HEAD is `80c93ad8863fe57b57eb730670452d07f6002d77`. Current repaired
locations at that HEAD plus the retained dirty diff are
test/runtime/retryPolicy.test.ts:87–272. Terminal ordinary-commit evidence
identifies the committed revision without a self-referential hash here.

### Separate assertion controls and exact source restoration

These are test-discrimination controls, not genuine production defects or
RED histories. Type checking and lint miss all three semantic substitutions.
Each control passed both compiler projects and focused uncached lint before
its fresh build and native intended assertion failure:

| Temporary source substitution | Named target / native folder | Actual outcome |
| --- | --- | --- |
| `Math.min(nextDelayMs(), 500)` as the wait, preserving attempt progression | `completes scheduled attempt 2 only at its 1000 ms deadline` / 017-fixed500-control | Exit 1; one intended `deepStrictEqual` failure. At 999 ms, completion is already 2 and pending is false instead of completion 1 and pending true. |
| `nextDelayMs() - 1` as the wait | First and second scheduled-deadline cases / 022-early-control | Exit 1; two intended `deepStrictEqual` failures. Completion occurs at 499/999 instead of 500/1000. |
| `pending = false` between the wait and `await runGuarded(run)` | Both callback resolution/rejection cases / 027-pending-control | Exit 1; two intended `deepStrictEqual` failures. Running work reports pending false, and the duplicate advances attempt to 2 while the first callback is unresolved. |

Each native target ran, reached the whole-state assertion and failed with
`ERR_ASSERTION`; all three streams report zero cancelled/skipped/todo cases.
The complete untouched TAP expected/actual values and stacks, separate stderr,
exact named-pattern argv and raw exits remain in those folders. Semantic
inspection is retained in 035-native-semantics. No setup/import/filter failure
supplies this control evidence, and no temporary control bytes enter Git.

Restoration checks 018, 023 and 028 compare exact source bytes with the
pre-edit saved file and HEAD, and retain matching blob and SHA-256 values:
`2c57c73e97be282acfdff61b439bfd86333d5b48` and
`4061246a1abfd0a42a9f19238a4e091f68cd27c76a21a89a2ae71bdacac3290e`.
After final restoration, 029 rebuilds and 030 proves the full owner GREEN.
The complete production file, including the timer module-object import,
first/capped delay, reset, guard, owned rejection and root abort, is unchanged.
No RED JSON was created. No automatic command retry or consumer edit enters.

### Native verification scope and retained attempts

Native evidence root: `/private/tmp/guardian-04-policies-fix-native/008/`.
Each command folder retains exact argv/cwd/UTC start/end/raw exit in
`command.json`, separate untouched `stdout.raw` and `stderr.raw`, and
before/after manifests with HEAD, Node/npm, source blobs/SHA-256, exact
dirty/staged diffs, owned file bytes and untracked bytes. Interactive mandatory
reads preceded the recorder. All checks ran in the existing checkout at the
absolute repository root above, on `features/code-review-sweep`, Node v26.11.1
and npm 11.20.0. The directly read persisted sentinel remains phase 04,
plan 04-04, isolation `none`; no worktree was created.

Complete AGENTS, all five books, current source/owner/report, owning plan,
CONTEXT, REVIEW-PROTOCOL and PATTERNS were read before editing. Live shadow
schedule/reset calls, runtime root-signal composition and its separate
next-delay loop were traced before source controls. The shadow owner supplies
only context-timer/awaited-settling technique. No existing type, member,
signature or private alias changed, so exact-symbol refactor traces did not
apply. The complete installed Fallow skill and live help preceded exact guard.

| Command / native folder | Actual result |
| --- | --- |
| Live Fallow help / 001–003; exact three-path guard / 004 | Exit 0 each; boundaries and rule packs remain unconfigured |
| Pre-edit root/branch/HEAD/sentinel/ledger checks / 005 | Exit 0; clean assigned checkout; `gsd-plan-head-before-04-04` retains actual `ca0ebbc3f020bd6ad0bbcaf3be5dcd1ee0341950` |
| Initial draft typecheck / 007; lint / 008 | Exits 2 and 1; ES2022 has no `Promise.withResolvers`/`PromiseWithResolvers`; lint also requires two blank lines. Retained attempts were corrected before controls. |
| Corrected typecheck / 010; uncached owner/source lint / 011 | Exit 0 each |
| Initial fresh build / 012; full native owner / 013 | Exit 0 each; 26 tests pass, zero failed/cancelled/skipped/todo |
| Fixed-500 control typecheck/lint/build / 014–016 | Exit 0 each before intended native failure 017 |
| Early-wait control typecheck/lint/build / 019–021 | Exit 0 each before intended native failures 022 |
| Premature-pending control typecheck/lint/build / 024–026 | Exit 0 each before intended native failures 027 |
| Exact source restoration / 018, 023, 028 | Exit 0 each; bytes, blob and SHA-256 match baseline |
| Restored `npm run build:test` / 029; full native owner / 030 | Exit 0 each; 26 tests, zero failed/cancelled/skipped/todo |
| `npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts` / 031 | Exit 0; isolated direct requirements pass |
| Isolated native coverage / 032; `retryPolicy.lcov` | Exit 0; compiled LH/LF 75/75, FNH/FNF 8/8, BRH/BRF 15/15, all 100% |
| Recorded-base Fallow audit, JSON/quiet/explain / 033 | Exit 0; verdict pass, zero dead-code/complexity/duplication findings |
| Exact narrow-scope comparison / 034 | Exit 0; original helpers/cases/header/delay values, production and all report history preserved |

Pre-step 037 returned 1 because Prettier split the two new chained strict-mock
expectations across lines. The exact two formatting-only changes are retained
in 038-formatter-diff. Control evidence above refers to the pre-format owner;
source-control substitutions and assertions retain their exact content.
Fresh build, full owner, direct selector, native coverage and audit were rerun
after formatting; each passed, with 26 tests and the same 75/75, 8/8, 15/15
compiled denominators. The required pre-step was repeated clean before staging.

Audit base remains `e25e26e6232ed99411b7463a7f9839c5eb837ec0`.
Selected checks do not refresh merged all-pair LCOV. The exact two-path clean
pre-step, ordinary foreground commit with normal hooks, and terminal committed
path/hash/deletion/clean-tree checks retain their actual native results under
this evidence root. Only the owner and this report are committed. The parent
owns the combined full gate and independent full six-file correction. No
full-project pass or partial-clean POLICIES verdict is issued.

## Repair evidence: CR-04-POLICIES-009

Applied by `policies_fix_009` (`gsd-code-fixer`), task 04-04-01, under
`/root/phase4_policies_finish/policies_fix_009`. Disposition: **applied, pending
independent full correction**. All previous report bytes remain intact. Repairs
001–009 are applied pending that review. The opening set remains 001–012,
open count **12** (2 BLOCKER, 10 WARNING), correction counter **0**, and
production bugs **0**. No accepted ID is independently closed. RUN-01 stays Pending.

The direct reset case now names explicit reset behavior. Its act phase calls
`reset()`, reads the next delay, and captures the whole delay/attempt observation.
Its assert phase compares that capture with the independent literal
`{ delayMs: 500, attempt: 1 }`. The five preceding delay reads remain in arrange.
No successful scheduled attempt or automatic reset behavior is claimed.
Only this case changes; all 008 timing/pending cases, strict mocks, helpers,
headers and remaining cases retain their exact bytes. Production is unchanged.
No API, type, signature, private alias, helper file, package, consumer, control
mutation or genuine RED evidence was added. Findings 010–012 retain their scope.

Initial location remains R:test/runtime/retryPolicy.test.ts:87–96. Actual
pre-edit HEAD is `41268e3d81c243e5e92e693a9e98f0160b939dc8`; the repaired case
is at test/runtime/retryPolicy.test.ts:274–288 at that HEAD plus the retained
exact dirty diff. Terminal ordinary-commit evidence supplies the committed
revision without a self-referential hash in this appendix.

All checks ran in the existing checkout at the absolute repository root above,
on `features/code-review-sweep`, Node v26.11.1 and npm 11.20.0. The directly read
persisted sentinel records phase 04, plan 04-04, isolation `none`. The existing
Git metadata ledger `gsd-plan-head-before-04-04` retains
`ca0ebbc3f020bd6ad0bbcaf3be5dcd1ee0341950`; it is a file, not a Git revision.
Complete AGENTS, all five books, full current source/owner/report, owning plan,
CONTEXT, REVIEW-PROTOCOL and PATTERNS were read before editing. The callback is
registered directly with `node:test`; its arrange helpers and every caller were
read in the complete owner. No function signature or helper changes, so exact
type-aware symbol-impact refactor queries did not apply. Installed full Fallow
skill and live help preceded the exact two-path guard.

Native evidence root: `/private/tmp/guardian-04-policies-fix-native/009/`.
Each numbered folder retains `command.json` with exact argv/cwd/UTC start/end
and raw exit, separate untouched `stdout.raw` and `stderr.raw`, and before/after
manifests with HEAD, Node/npm, source and owner blobs/SHA-256, exact dirty/staged
diffs, owned bytes and untracked bytes. Interactive mandatory reads preceded
the recorder. The initial read-only attempt to resolve the ledger as a revision
returned 128; the subsequent file read verified its actual content unchanged.

| Command / native folder | Actual result |
| --- | --- |
| Live Fallow help / 001–003; exact two-path guard / 004 | Exit 0 each; architecture zones and rule packs are unconfigured |
| Root/branch/HEAD/sentinel/ledger assertions / 005; callers / 006 | Exit 0; clean assigned checkout and persisted baseline preserved |
| Modified section diff/reread / 007 | Exit 0; captured observation and surrounding code intact |
| `npm run build:test` / 008 | Exit 0; fresh strict test build |
| `node --test --test-reporter=tap dist-test/test/runtime/retryPolicy.test.js` / 009 | Exit 0; 26 tests, zero failed/cancelled/skipped/todo |
| `npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts` / 010 | Exit 0; isolated direct requirements pass |
| Native isolated coverage / 011; `retryPolicy.lcov` | Exit 0; compiled LH/LF 75/75, FNH/FNF 8/8, BRH/BRF 15/15, all 100% |
| Recorded-base Fallow audit, JSON/quiet/explain / 012 | Exit 0; verdict pass, zero dead-code/complexity/duplication findings |

Audit base remains `e25e26e6232ed99411b7463a7f9839c5eb837ec0`.
Selected checks do not refresh merged all-pair LCOV. The exact two-path clean
pre-step, ordinary foreground commit with normal hooks, and terminal committed
path/hash/deletion/clean-tree checks retain their native results under this root.
Only the owner and this report are committed. The parent owns the combined full
gate and independent full six-file correction. No full-project pass or
partial-clean POLICIES verdict is issued.

## Repair evidence: CR-04-POLICIES-010 and CR-04-POLICIES-011

Applied by `policies_fix_010_011` (`gsd-code-fixer`), task 04-04-01, under
`/root/phase4_policies_finish/policies_fix_010_011`. Disposition: **applied,
pending independent full correction**. Both IDs share this minimum cause.
All previous report bytes remain intact. Repairs 001–011 are applied pending
that review; 012 retains its separate callback-double repair. The opening
set remains 001–012, open count **12** (2 BLOCKER, 10 WARNING), correction
counter **0**, and production bugs **0**. No ID is independently closed.
RUN-01 stays Pending.

The callable typed logger silently discards messages. The abort case retains
its explicit zero-callback and cleared-pending observations. The rejection
case owns a fresh exact-parameter strict callback mock: its first invocation
rejects and its next invocation resolves. A case-owned wrapper records starts
and settlements, with settlement recorded in `finally`. After the first
controlled deadline and awaited settling, the whole observation requires one
start, one settlement, attempt 1 and pending false. A second scheduled deadline
requires two starts, two settlements, attempt 2 and pending false. The strict
mock is verified after those public-state assertions. The native owner passes
without escaping/unhandled rejections. Neither case asserts logger calls.

### Exact private-query limitation and contract-preserving fallback

Before editing, installed Fallow exact `--symbol-impact` and `--trace` queries
targeted `test/runtime/retryPolicy.test.ts:recordingLog` and
`test/runtime/retryPolicy.test.ts:recordingLog.write`, separately with
`tsconfig.json` and `tsconfig.test.json`. Each command used one
`--type-aware-project`, `--type-aware-require complete --format json --quiet
--explain`. All eight returned **exit 2**: private export/member not found,
or unknown-symbol for the nested exact impact. They supply no selected-project
complete semantic proof and no zero-consumer deletion permission. The raw
unavailable results remain in native folders 006–013.

The fallback therefore preserves the existing helper names and signatures:
`recordingLog(recorded: string[]): Logging`, its nested
`write(message: string): void`, the callable logger members, and
`policyOptions(signal: AbortSignal, recorded: string[] = []): RetryPolicyOptions`.
Unused inputs are explicitly discarded with `void`; no record is retained.
The nested `write` uses a named function declaration, directly repairing 011.
No helper, type, import, member or signature was deleted or renamed. Exact
lexical uses and every helper caller were read before editing; a public-neighbor
query or named-import count was not substituted for the missing private result.
The parent confirmed this protocol-prescribed fallback before completion.

Both complete headers, all 008 timing/pending cases, the 009 reset case, and
the `countedWork` helper retain their exact bytes. The latter remains within
012's next cause. No source API, consumer, new helper file, package, live input,
new retry design or production change enters this commit.

Initial locations remain R:test/runtime/retryPolicy.test.ts:10–31,148–177 for
010 and R:test/runtime/retryPolicy.test.ts:12–15 for 011. Actual pre-edit HEAD
is `01164c48bb4136c6fe64a61bd30d115561d083b1`. Current locations at that HEAD
plus the retained exact dirty diff are test/runtime/retryPolicy.test.ts:22–45
and 339–392. The terminal ordinary commit supplies the committed revision;
this appendix does not claim its own future hash.

### Separate assertion control and exact restoration

Plausible wrong behavior: the guarded work silently completes without invoking
the callback. Type checking and lint miss that semantic substitution. The
temporary control changes only `await run()` to `await Promise.resolve(run)`
inside production `runGuarded`. Both compiler projects and uncached focused
lint pass before the control's fresh build. The named rejection test then
executes and fails its intended whole-state `deepStrictEqual`, raw exit 1:
starts and settlements are 0 after both deadlines, rather than 1 and then 2,
even though pending is false and attempts progress. Native TAP records one
failed test, zero cancelled/skipped/todo, and `ERR_ASSERTION`; this is not a
setup/import/type/unhandled-rejection failure.

The exact target argv is retained in 023-control-owner:

```text
node --test --test-reporter=tap --test-name-pattern=^keeps a rejection from the work inside the policy$ dist-test/test/runtime/retryPolicy.test.js
```

The full untouched expected/actual diff, native TAP and separate stderr are
retained. This assertion control is not an observed production bug or genuine
RED history; no RED JSON was created. Exact restoration matches saved bytes
and HEAD, with source blob `2c57c73e97be282acfdff61b439bfd86333d5b48` and SHA-256
`4061246a1abfd0a42a9f19238a4e091f68cd27c76a21a89a2ae71bdacac3290e`.
A fresh build and full owner pass after restoration. The timer module-object
import, first/capped delays, pending guard, reset, owned rejection and root-abort
production behavior remain unchanged; no temporary control bytes enter Git.

### Native verification scope

All checks ran in the existing checkout at the absolute repository root above,
on `features/code-review-sweep`, Node v26.11.1 and npm 11.20.0. No worktree was
created. The directly read sentinel records phase 04, plan 04-04, isolation
`none`. The existing Git metadata ledger `gsd-plan-head-before-04-04` retains
actual `ca0ebbc3f020bd6ad0bbcaf3be5dcd1ee0341950`.
Complete AGENTS, all five books, current full retry pair/report, owning plan,
CONTEXT, REVIEW-PROTOCOL and PATTERNS were read before editing. Shadow schedule,
reset and guarded lifecycle calls, account root-signal composition and its
separate next-delay retry loop, and relevant owners were read before controls.
The complete installed Fallow skill and live help preceded guard and queries.

Native evidence root: `/private/tmp/guardian-04-policies-fix-native/010/`.
Each numbered command folder retains exact argv/cwd/UTC start/end/raw exit
in `command.json`, separate untouched `stdout.raw` and `stderr.raw`, and
before/after manifests with HEAD, Node/npm, blobs/SHA-256, exact dirty/staged
diffs, owned bytes and untracked bytes. Initial interactive reads preceded the
recorder. Command folders also retain full control/restoration snapshots.

| Command / native folder | Actual result |
| --- | --- |
| Live Fallow help / 001–003, 029; exact three-path guard / 004 | Exit 0 each; boundaries and rule packs remain unconfigured |
| Root/HEAD/clean-tree/sentinel/ledger checks / 005; lexical uses / 014 | Exit 0; assigned checkout and persisted baseline preserved |
| Eight exact private impact/trace queries / 006–013 | Exit 2 each; unavailable private targets retained; no semantic completeness or deletion proof claimed |
| Modified owner diff/reread / 015 | Exit 0; silent stub, declaration and public-state observations present |
| `npm run typecheck` / 016; focused uncached ESLint / 017 | Exit 0 each |
| Initial `npm run build:test` / 018; full native owner / 019 | Exit 0 each; 26 tests, zero fail/cancel/skip/todo |
| Control typecheck/lint/build / 020–022 | Exit 0 each before intended native assertion failure 023 |
| Exact source restoration / 024 | Exit 0; saved bytes, blob, SHA-256 and HEAD match |
| Restored `npm run build:test` / 025; full native owner / 026 | Exit 0 each; 26 tests, zero fail/cancel/skip/todo |
| `npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts` / 027 | Exit 0; isolated direct requirements pass |
| Native isolated coverage / 028; `retryPolicy.lcov` | Exit 0; compiled LH/LF 75/75, FNH/FNF 8/8, BRH/BRF 15/15, all 100% |
| Recorded-base Fallow audit, JSON/quiet/explain / 030 | Exit 0; verdict pass, zero dead-code/complexity/duplication findings |

Audit base remains `e25e26e6232ed99411b7463a7f9839c5eb837ec0`. Selected checks
do not refresh merged all-pair LCOV. Exact two-path clean pre-step, ordinary
foreground commit with normal hooks, and terminal committed-path/hash/deletion/
clean-tree checks retain their actual native results under this evidence root.
Only the owner and this report are committed. The parent owns the combined
full gate and independent full six-file correction. No full-project pass or
partial-clean POLICIES verdict is issued.

## Repair evidence: CR-04-POLICIES-012

Applied by `policies_fix_012` (`gsd-code-fixer`), task 04-04-01, under
`/root/phase4_policies_finish/policies_fix_012`. Disposition: **applied, pending
independent full correction**. All previous report bytes remain intact. Repairs
001–012 are applied pending that review. The accepted opening set remains
001–012, open count **12** (2 BLOCKER, 10 WARNING), correction counter **0**,
and production bugs **0**. No ID is independently closed. RUN-01 stays Pending.

The duplicate-notification, successive-run and aborted-wait cases each own a
fresh `strong-mock` callback with `exactParams: true`. Their complete promises
are one invocation, two invocations and no invocation, respectively. Each mock
has an explicit final `verify(work)` after its whole public-state assertion.
The independent observations retain callback counts and now include attempt
alongside pending. The case-owned wrapper records its start before reaching
the strict callback, so an unexpected callback caught by production cannot
silently preserve a zero-invocation observation. The pending-only case retains
its canned stub; its promise concerns pending state alone.

All 008 scheduled-boundary, reset and held-callback cases, the 009 direct reset
case, the 010 rejection/reschedule case and silent logger, all helpers, imports,
comments, titles and complete headers retain their bytes. Only the three named
cases change. No new helper file, package, public API, private signature, retry
policy, real elapsed wait or private state access was introduced. Production
remains byte-identical after the separate control below.

### Exact private-query limitation and preserved helper

Before editing, fresh exact Fallow `--symbol-impact` and `--trace` queries
targeted `test/runtime/retryPolicy.test.ts:countedWork`, separately for
`tsconfig.json` and `tsconfig.test.json`. Every command supplied one
`--type-aware-project`, `--type-aware-require complete --format json --quiet
--explain`. All four returned **exit 2**, reporting the private target absent.
They establish neither complete semantic consumers nor deletion permission.
Native outputs remain in 006–009. Exact lexical uses, the full helper body,
return signature and all three callers were read before editing.

The protocol-prescribed fallback preserves `countedWork()` and its exact
`{ run: () => Promise<void>; runs: () => number }` signature and body. Each
case uses its fresh result only as an independent observation accompanying
the strict mock and its explicit verification. No private alias/member/helper
is removed or renamed; the logger fallback from 010 remains unchanged.

Initial location remains R:test/runtime/retryPolicy.test.ts:40–51,99–163.
Actual pre-edit HEAD is `ddffc2c882b1951a538643ec1713c2fad1e45fab`.
Current repaired locations at that HEAD plus the retained exact dirty diff
are test/runtime/retryPolicy.test.ts:290–376. The terminal ordinary commit
supplies the committed revision without a self-referential hash here.

### Separate assertion control and exact source restoration

Plausible wrong behavior: an aborted wait still invokes its callback. Type
checking and lint cannot detect this semantic change. The temporary source
control adds `await runGuarded(run)` in the wait's catch branch. Both compiler
projects and uncached focused lint pass before the fresh control build. The
named abort case executes and fails its intended whole-state `deepStrictEqual`,
raw exit **1**: actual is `{ runs: 1, attempt: 1, pending: false }`, while the
independent expected observation is `{ runs: 0, attempt: 1, pending: false }`.
Native TAP records one failed test, zero cancelled/skipped/todo, `ERR_ASSERTION`
and `deepStrictEqual`. The assertion catches the wrong behavior even though
`runGuarded` swallows the strict mock's unexpected-call error. No import,
setup, filtering or uncaught mock error supplies the failure.

The exact native target command in 020-control-owner is:

```text
node --test --test-reporter=tap --test-name-pattern=^leaves the work uninvoked when a shutdown aborts a pending wait$ dist-test/test/runtime/retryPolicy.test.js
```

Full untouched TAP, expected/actual, stack, separate stderr and exact argv
remain there. This is an assertion control, not a genuine production bug or
RED history; no RED JSON was created. Restoration 021 compares exact saved
bytes and HEAD with source blob `2c57c73e97be282acfdff61b439bfd86333d5b48`
and SHA-256 `4061246a1abfd0a42a9f19238a4e091f68cd27c76a21a89a2ae71bdacac3290e`.
A fresh restored build and all 26 owner tests pass. No control enters Git.
First/capped delays, reset, pending guard, owned rejection, root cancellation
and the timer module-object import are unchanged.

### Native verification scope

All checks ran in the existing checkout at the absolute repository root above,
on `features/code-review-sweep`, Node v26.11.1 and npm 11.20.0. No worktree
was created. The directly read sentinel records phase 04, plan 04-04,
isolation `none`. The existing Git metadata ledger `gsd-plan-head-before-04-04`
retains `ca0ebbc3f020bd6ad0bbcaf3be5dcd1ee0341950`. Complete AGENTS, all five
books, current full retry source/owner/report, plan, CONTEXT, REVIEW-PROTOCOL
and PATTERNS were read. Actual shadow schedule/reset and runtime root-signal
composition and next-delay callers were read before the control. The shadow
owner supplies context-timer and awaited-settling techniques only. The installed
full Fallow skill and live help preceded the exact three-path guard and queries.

Native root: `/private/tmp/guardian-04-policies-fix-native/012/`. Each command
folder retains exact argv/cwd/UTC start/end/raw exit in `command.json`, separate
untouched `stdout.raw` and `stderr.raw`, and before/after manifests with HEAD,
Node/npm, Git blobs/SHA-256, exact dirty/staged diffs, owned bytes and untracked
bytes. Interactive mandatory reads preceded this recorder. An initial shell
attempt used unavailable `python` (exit 127); actual captures use `python3`.

| Command / native folder | Actual result |
| --- | --- |
| Live Fallow help / 001–004; exact three-path guard / 005 | Exit 0 each; boundaries and rule packs remain unconfigured |
| Exact private impact/trace queries / 006–009 | Exit 2 each; unavailable private target retained; no complete deletion proof |
| Root/HEAD/clean-tree/sentinel/ledger checks / 010; lexical callers / 011 | Exit 0; existing checkout and persisted baseline preserved |
| Modified owner diff/reread / 012 | Exit 0; strict mocks and independent public-state assertions present |
| `npm run typecheck` / 013; focused uncached ESLint / 014 | Exit 0 each |
| Initial `npm run build:test` / 015; full native owner / 016 | Exit 0 each; 26 tests, zero failed/cancelled/skipped/todo |
| Control typecheck/lint/build / 017–019 | Exit 0 each before intended native assertion failure 020 |
| Exact source restoration / 021 | Exit 0; saved bytes, blob, SHA-256 and HEAD match |
| Restored `npm run build:test` / 022; full native owner / 023 | Exit 0 each; 26 tests, zero failed/cancelled/skipped/todo |
| `npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts` / 024 | Exit 0; isolated direct requirements pass |
| Native isolated coverage / 025; `retryPolicy.lcov` | Exit 0; compiled LH/LF 75/75, FNH/FNF 8/8, BRH/BRF 15/15, all 100% |
| Recorded-base Fallow audit, JSON/quiet/explain / 026 | Exit 0; verdict pass; zero dead-code, complexity or duplication findings |

The audit base remains `e25e26e6232ed99411b7463a7f9839c5eb837ec0`.
Selected checks do not refresh merged all-pair LCOV. Exact scope/history checks,
the required clean two-path pre-step, individual staging, ordinary foreground
commit with normal hooks and terminal path/hash/deletion/clean-tree checks
retain their actual native streams under this root. Only the owner and this
report enter the commit. The parent owns the combined full gate and the first
independent full six-file correction. No full-project pass, zero-open result
or partial-clean POLICIES verdict is issued.

## Independent full correction round 1

**Reviewer:** `policies_full_correction_one`, typed `gsd-code-reviewer`, under
`/root/phase4_policies_finish/policies_full_correction_one`.
**Current reviewed revision C:** `af2a8e1bda121d0804c50e37c0b7d6e8f2083906`.
**Date:** 2026-10-15 UTC. **Depth:** deep.

Every line and complete header of all six original files was independently
read, including all local helpers, actual callers and public signatures.
Current source/owner scope totals 1,025 lines. Actual Git and native evidence
were inspected. All preceding initial and repair history remains verbatim;
this appended section supplies the current independent judgment.

```yaml
revision: af2a8e1bda121d0804c50e37c0b7d6e8f2083906
review_round: 1
correction_round: 1
depth: deep
files_reviewed: 6
files_reviewed_list:
  - src/runtime/commandPort.ts
  - test/runtime/commandPort.test.ts
  - src/runtime/failureLog.ts
  - test/runtime/failureLog.test.ts
  - src/runtime/retryPolicy.ts
  - test/runtime/retryPolicy.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
genuine_production_bugs: 0
d03_stop: false
```

### Exact arithmetic and immediate D-03 assessment

All suffixes in this table have the stable prefix `CR-04-POLICIES-`.
Applied repairs had not been independently closed before this round.

| Set | Exact suffix set | Count | BLOCKER / WARNING |
| --- | --- | ---: | --- |
| Opening | {001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012} | 12 | 2 / 10 |
| Fixed | {001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012} | 12 | 2 / 10 |
| Rejected accepted IDs | {} | 0 | 0 / 0 |
| New | {013} | 1 | 1 / 0 |
| Reopened | {} | 0 | 0 / 0 |
| Closing | {013} | 1 | 1 / 0 |

`closing = opening - fixed - rejected + new + reopened = 12 - 12 - 0 + 1 + 0 = 1`.
Cumulative accepted inventory: 13 unique IDs, comprising 3 BLOCKER and 10
WARNING. Twelve are fixed; **one BLOCKER remains open**, with zero open
warnings. The continuous correction counter advances **0 to 1**. Tracer checks
are not counted as corrections, and no counter resets.

D-03 evaluated immediately at the verdict: closing 1 is below opening 12;
no previously fixed ID reopens; this is round 1, below round 4. **No global
stop is triggered.** POLICIES remains unclosed. The next cause returns to
04-04-01, followed by another full six-file correction retaining counter 1.
PORTS' earlier maintainer response supplies no POLICIES permission and was
not used. This report authorizes no source repair by this reviewer.

### Narrative Findings (AI reviewer): remaining BLOCKER

#### CR-04-POLICIES-013: The owner bypasses the exported production backoff ceiling

**Classification:** BLOCKER. **Requirement:** RUN-01.
**Initial/current location:**
C:`test/runtime/retryPolicy.test.ts:17,44–45,78–109`;
associated export C:`src/runtime/retryPolicy.ts:18–19`, actual consumer
C:`src/runtime/accountRuntime.ts:1269`. Paths resolve under the absolute root
recorded in the initial report.
**First observer/triager:** `policies_full_correction_one`, this round.
**Disposition:** accepted/open; no repair or evidence-only commit exists.

**Rule:** `skills/typescript-unit-testing/SKILL.md`, Pairing and coverage:
the mirrored owner owns its source module's exported behavior; Assertions:
expected values remain independent. Also
`skills/typescript-unit-testing-review/SKILL.md`, central discrimination rule
and Classifying findings/BLOCKER for a wrong implementation that passes the
case. Compiler, lint and execution coverage do not pin this numeric value;
the prohibition on gate-redundant tests does not make its observation redundant.

**Issue:** The owner imports only `createRetryPolicy`. Every case constructs
the policy through `policyOptions`, which supplies its own literal
`maxDelayMs: 30_000`. It never reads or asserts exported `MAX_BACKOFF_MS`.
Account composition instead supplies `MAX_BACKOFF_MS`. Changing only that
export to 60,000, for example, changes the production ceiling while all 26
direct retry cases keep testing the owner's 30,000 input. The pair can retain
100% execution coverage while missing the regression. This follows from the
full source and actual call graph. No source mutation or observed RED is claimed.

**Fix:** Import `MAX_BACKOFF_MS` into this owner and supply it as the
`policyOptions` ceiling, retaining the independently authored 30,000 expected
values in the delay and scheduled-cap rows. Alternatively, add a proper AAA
assertion of the exported numeric contract against an independent literal.
Do not derive expected cap values from the export or change production's
policy. Preserve every deadline, held-callback, reset, abort and rejection
observation and full header. Rebuild, run the full owner and isolated direct
pair, then obtain another full correction. No helper or external adaptation
is required.

This is distinct from 008: its repaired cases now discriminate scheduled
cap behavior for supplied options; 013 concerns the exported value used to
construct those options in production. None of 008's observations regressed.
No previously fixed cause is renamed or reopened. The production value is
currently correct; this is test reliability, not a genuine production defect
or BUG-01 history.

### Full files, complete headers and exact inputs

Both LICENSE and NOTICE classify these six files as original MIT work.
Every complete source/owner header has first-line SPDX, the separate 2026
Alessandro Colomba copyright JSDoc, separate purpose @fileoverview, and the
required blank lines. The retry source keeps its justified timer-import note
after the overview. Source-only packaging checks did not replace owner reads.

| Fully reviewed path | All current lines | C Git blob | Complete header |
| --- | ---: | --- | --- |
| src/runtime/commandPort.ts | 1–48 | e0189cf9040830a85c4aa447d8a763156c40acbe | Approved; complete overview/import boundary |
| test/runtime/commandPort.test.ts | 1–40 | bc9395128c5467d2c09bb6069eda9107a4886113 | Approved; all declaration comments/negatives |
| src/runtime/failureLog.ts | 1–95 | 4d724a609b5da08f31b7978396fd4d240c93fe70 | Approved; all API comments |
| test/runtime/failureLog.test.ts | 1–327 | b2a366267264b4fafb821a8d1c779c047e02019d | Approved; all four suites/helpers |
| src/runtime/retryPolicy.ts | 1–101 | 2c57c73e97be282acfdff61b439bfd86333d5b48 | Approved; timer note/import retained |
| test/runtime/retryPolicy.test.ts | 1–414 | d01dff6456bc4d69c4de162fcb43404e2a7763e4 | Approved; all 26 cases/rows/helpers |

Native `018-correction-evidence-audit` retains complete per-file SHA-256,
byte counts and blobs. Every captured command has before/after complete six
file bytes, HEAD/runtime, exact working/staged diffs and nonignored untracked
bytes. C was clean throughout executable checks. The actual R-to-C Git
inventory has these six source/owner changes plus coordinator/planning records,
with no separate helper, external source adaptation, deleted file or package
change. All local helpers are included above. No .codexignore exists; these
six tracked inputs are not ignored. Generated and installed files inspected
for execution/tool documentation are not counted as new production inventory.

Complete AGENTS and all five complete style, comment, unit writer, unit
reviewer and local-verification books were read, not only injection subsets.
The bootstrap, local skill inventory, GSD review skill, Fallow pointer and
full installed Fallow skill were read. Both full owning plans, full CONTEXT,
RESEARCH, PATTERNS, REVIEW-PROTOCOL, existing report, 04-03 SUMMARY, FINDINGS
and REQUIREMENTS were read, with applicable STATE and locked decisions.
No new external behavior question required a documentation lookup.

### Independent dispositions of original findings

Initial R-qualified locations and first observers remain in the opening
ledger. The table supplies current C-qualified locations, exact rule, real
repair and independent outcome. All rows contribute RUN-01; headers also
contribute PROC-03. Pair abbreviations mean the exact source and mirrored
owner in the inventory above.

| Stable suffix / severity | Exact rule | Current C location | Real repair commit | Independent outcome |
| --- | --- | --- | --- | --- |
| 001 / WARNING | D-01; style/Files and modules | commandPort source 1–19; owner 1–11 | 8052f8078e36e9aaa6d64a5e0c0ffaef3b676140 | Fixed; both complete headers |
| 002 / WARNING | style/Types; D-06 public constituents | src/runtime/commandPort.ts:24–36; owner:19–38 | c0f80628eb07856315de29db0d45bf76a2a37e0c | Fixed; public variants, exact mutable required shapes and strict contracts |
| 003 / WARNING | D-01; style/Files and modules | failureLog source 1–12; owner 1–18 | bd335c213ceb1671c490c822a6513aceb6eb2fa9 | Fixed; both complete headers |
| 004 / BLOCKER | unit Assertions; independent whole stream | test/runtime/failureLog.test.ts:157–202 | 5f07760a4bcc48195198818292c90ef0654608d2 | Fixed; complete independent 120-entry stream; audited restored control |
| 005 / WARNING | unit Naming values | test/runtime/failureLog.test.ts:29–37 | da5269fac68cdb76e915b7226eeca3f9b8cb29af | Fixed; fresh wallTimeMs state |
| 006 / WARNING | unit Case structure/AAA | test/runtime/failureLog.test.ts:65–74 | ed06aa029c3211cfec732ae84db058e53e43a38f | Fixed; separate constant act and assert |
| 007 / WARNING | D-01; style/Files and modules | retryPolicy source 1–16; owner 1–20 | 80c93ad8863fe57b57eb730670452d07f6002d77 | Fixed; both complete headers and timer note |
| 008 / BLOCKER | unit discrimination, Assertions, Patterns/Time | test/runtime/retryPolicy.test.ts:78–274 | 41268e3d81c243e5e92e693a9e98f0160b939dc8 | Fixed; supplied-cap deadlines, reset, held resolution/rejection and duplicate exclusion |
| 009 / WARNING | unit Case structure/AAA; truthful title | test/runtime/retryPolicy.test.ts:276–287 | 01164c48bb4136c6fe64a61bd30d115561d083b1 | Fixed; reset/read finish before whole assertion |
| 010 / WARNING | unit Test doubles/logging | test/runtime/retryPolicy.test.ts:22–45,355–414 | ddffc2c882b1951a538643ec1713c2fad1e45fab | Fixed; typed silent logger; callback start/settlement and subsequent work |
| 011 / WARNING | style/Functions | test/runtime/retryPolicy.test.ts:25–28 | ddffc2c882b1951a538643ec1713c2fad1e45fab | Fixed by same minimum repair; named write declaration |
| 012 / WARNING | unit Test doubles/mock choice/verification | test/runtime/retryPolicy.test.ts:290–374 | af2a8e1bda121d0804c50e37c0b7d6e8f2083906 | Fixed; exact case-owned strong-mock callbacks and explicit verify after public observations |

Actual Git objects prove all eleven repair commits are ancestors of C, at
most three concrete paths per cause, with no deletions. Ten IDs have singleton
commits and 010/011 share their prescribed repair. Native clean pre-step and
normal commit streams were reopened and indexed by 019-repair-hook-provenance.
Every commit reports passing check:commit and secret hooks; the later
commit-message hook's no-files skip is distinct from the successful pre-commit
run. 008's failed formatter pre-step remains exit 1, followed by post-format
checks and a repeated clean pre-step. This reviewer stages or commits nothing.

### Exact private-query limits and compatible fallback

The eight actual 010 probes separately target recordingLog and nested
recordingLog.write, using exact impact and trace in both compiler projects.
The four 012 probes target countedWork. All twelve raw exits are 2, with
private-target-not-found/unknown-symbol results. Actual argv, UTC and separate
stdout/stderr were reopened and indexed in 018-correction-evidence-audit.
These results establish neither complete semantic consumers nor deletion
permission; no public-neighbor result substitutes for them.

The fallback is compatible with all current calls. The helper signatures
`recordingLog(recorded: string[]): Logging`, nested
`write(message: string): void`, and
`policyOptions(signal: AbortSignal, recorded: string[] = []): RetryPolicyOptions`
remain unchanged, including the callable Logging shape. No logger observation
relies on recording; explicit void expressions discard its unused inputs.
The named write declaration fixes 011. countedWork retains its exact body,
return signature and three live callers. Its fresh observation accompanies
strict callback expectations and final verify rather than replacing them.
The wrapper records its start before awaiting the strict callback, so guarded
production cannot conceal an aborted callback's invocation by swallowing the
mock error. Nothing is deleted or renamed. No forced-deletion exemption or
complete private trace is claimed.

Installed strong-mock's final verify also rejects recorded unexpected calls
even if their immediate exceptions were caught. Its actual implementation was
read. Empty-expectation duplicate/abort mocks remain effective alongside the
public timelines.

### Actual consumers and D-05/D-06 preservation

All six 002 pre-edit exact impacts at 8052f80 were reopened: one project per
command, strict completeness, raw exit 0, complete status/identity, expected
selected_project. Outcome named consumers are 1/3, failure 2/3 and port 4/9.
These counts are named imports, not all inferred or structural consumers.
Current actual bodies were read separately:

- accountRuntime:128–214,243–262,330–333,1088–1103,1179–1282 carries public
  options/factories, family-built command bodies, exact outcomes and root
  signal. It retains one command attempt, without an automatic retry.
- controls:529–570 awaits the inferred commands.send result and narrows false
  acceptance before mandatory failure. Platform:566–599 and the accessory
  options/binder retain the port. Relevant controls/platform/accessory owner
  literals and synthetic World context construction were read. No forced
  import or compatibility adaptation is required; later subsystem conformance
  is not implied.
- accountRuntime:330–333,761–762,904–927,1269–1273 creates two independent
  policies over the shared root and uses a separate next-delay loop.
  shadow:298–304,352–374 schedules owned reopen work and resets after successful
  subscription. Root abort remains distinct from terminal authentication halt;
  no arbitrary running-callback teardown is promised.
- Failure/success/forget paths at accountRuntime:490–524,653–655,720,747–754,
  762–793,899,952–960,1042 and composition:1273 preserve per-kind state,
  fixed reasons and injected wall time. Platform supplies systemClock; elapsed
  silence remains a distinct monotonic domain.

FailureLog from its first import and retryPolicy from its timer-import note
are byte-identical to R. Command changes are bounded public variants and
headers: exact true/false, mandatory failure, closed vocabulary, mutable
outcomes/options and readonly retry getters remain. Public variants are used
transitively; private-type-leaks remains error. No last-valid value, canonical
telemetry, device identity, persistence, clock domain or product meaning changes.
Scoped privacy keeps its unconfirmed opaque-key premise; no new permission,
migration or guessed normal follows.

S-04-02 remains fixed as 002. S-04-03/04 retain their exact initial rejection
reasons for these public contracts. S-04-05's 004/008 are fixed; 013 is the
distinct public-export gap. Other batch seeds retain their owners.
Every comment/title, import/export, function, error path, row and assertion
was considered under all five books. No additional security, style, comment,
API or owner defect was confirmed. The timer object import remains justified;
all type negatives are meaningful; state is fresh, tests are offline, timers
are context-owned and event-loop settling is awaited. No private access,
test hook, real elapsed sleep, module replacement, coverage exception or
skip/only/todo is introduced. Coverage does not settle 013's value observation.

### Separate controls and D-04 audit

Actual native intended failures, complete expected/actual values, exact argv
and raw exits were reopened. These are fixer controls on correct production,
not genuine bugs or RED histories. No new mutation experiment was run.

| Cause / original native folder | Independent failure judgment | Restoration and rebuilt GREEN |
| --- | --- | --- |
| 004 / 014-control-hour | Exit 1; named deepStrictEqual fails; all 120 expected/actual entries checked, retaining four warning positions while corrupting all 116 debug reasons | 015-source-restoration; failure source blob 4d724a609b5da08f31b7978396fd4d240c93fe70; build 016 and owner 017 exit 0 |
| 008 / 017-fixed500-control | Exit 1; named second attempt completes early at 999 ms | 018-restore-fixed500; exact retry blob below |
| 008 / 022-early-control | Exit 1; two named first/second deadline failures at 499/999 ms | 023-restore-early; exact retry blob below |
| 008 / 027-pending-control | Exit 1; both resolution/rejection timelines fail with premature pending false and another admitted attempt | 028-restore-pending; restored build 029 and full owner 030 exit 0 |
| 010 / 023-control-owner | Exit 1; intended rejection timeline fails with zero callback starts/settlements | 024-restoration; restored build 025 and full owner 026 exit 0 |
| 012 / 020-control-owner | Exit 1; intended abort assertion observes runs 1 rather than 0 before verify | 021-restoration; restored build 022 and full owner 023 exit 0 |

All failures are ERR_ASSERTION/deepStrictEqual with zero cancelled/skipped/todo.
Both 008 multi-target streams contain **two** failed tests, as actual TAP
states; their terse prior semantics output is not used to recount each as one.
Original control typecheck/lint/build records remain retained. The current
audit compares each exact restored source snapshot with current bytes and Git.
All retry restorations match blob 2c57c73e97be282acfdff61b439bfd86333d5b48,
SHA-256 4061246a1abfd0a42a9f19238a4e091f68cd27c76a21a89a2ae71bdacac3290e.
The logging source SHA-256 is
48d4747fd23f61913e6f353f4de04729418848a90585bc9749c1e16cbaf24b79.
No control entered Git. No production bug, RED JSON, active regression RED,
classifier success or evidence-before-GREEN history is invented.

### Current checks, raw provenance and limitations

Native root: `/private/tmp/guardian-04-policies-finish-native/`.
All new commands ran at the absolute repository root on features/code-review-sweep,
C, Node v26.11.1, npm 11.20.0. Each numbered folder has command.json with
exact argv/cwd/UTC/raw exit, untouched stdout.raw/stderr.raw, and before/after
HEAD/version/blob/SHA-256, exact diffs and complete file/untracked snapshots.

| Native record | Exact command or scope | UTC on 2026-10-15 | Raw result |
| --- | --- | --- | --- |
| 005-correction-static | npm run check:static | 01:50:51.512773–01:50:55.605435 | 0; all six static checks pass |
| 007-command-direct | npm run test:coverage:direct -- src/runtime/commandPort.ts test/runtime/commandPort.test.ts | 01:51:30.526117–01:51:35.170178 | 0; fresh strict build; declaration-only selector acceptance |
| 008-failure-direct | npm run test:coverage:direct -- src/runtime/failureLog.ts test/runtime/failureLog.test.ts | 01:51:36.419914–01:51:40.596855 | 0; fresh build and isolated requirements |
| 009-retry-direct | npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts | 01:51:48.279388–01:51:52.582730 | 0; fresh build and isolated requirements |
| 013-policies-owners | node --test --test-reporter=tap dist-test/test/runtime/commandPort.test.js dist-test/test/runtime/failureLog.test.js dist-test/test/runtime/retryPolicy.test.js | 01:52:11.479842–01:52:12.469577 | 0; 42 native records, four suites; zero failed/cancelled/skipped/todo |
| 014-fallow-review | node_modules/.bin/fallow review --base e25e26e6232ed99411b7463a7f9839c5eb837ec0 --brief --format json --quiet --explain | 01:52:22.097522–01:52:24.343856 | 0; orientation verdict pass, zero dead-code/complexity/duplication findings |
| 015-report-guard | node_modules/.bin/fallow guard .planning/phases/04-runtime-conformance/04-POLICIES-REVIEW.md --format json --quiet --explain | 01:52:23.264052–01:52:24.192215 | 0; no configured zones/rule packs |
| 016-failure-native-coverage | Exact node:test/TAP/LCOV argv in command.json; failureLog include and its owner alone | 01:53:49.808829–01:53:50.813052 | 0; 15 cases; compiled LH/LF 45/45, FNH/FNF 4/4, BRH/BRF 9/9 |
| 017-retry-native-coverage | Exact node:test/TAP/LCOV argv in command.json; retryPolicy include and its owner alone | 01:53:56.946589–01:53:57.989149 | 0; 26 cases; compiled LH/LF 75/75, FNH/FNF 8/8, BRH/BRF 15/15 |
| 018-correction-evidence-audit | python3 /private/tmp/guardian-04-policies-correction-audit.py | 01:54:36.844295–01:54:37.887173 | 0; manifest, actual Git/ancestry, control semantics/restoration, unavailable probes and 013 static cause |
| 019-repair-hook-provenance | Read-only Python native metadata/stream index; exact argv/UTC in command.json | Actual timestamps retained | 0; original pre-step/commit streams and hashes indexed |

The 42 native records comprise 15 logging cases, 26 retry cases and the
declaration file's native success record. CommandPort authors **zero runtime
cases**, with no numerical coverage claimed. Fresh compiled LCOV files are
correction-failureLog.lcov and correction-retryPolicy.lcov in the native root.
Selected runs do not refresh merged all-pair LCOV. The parent's preceding
renewed 001–004 tracer/build/owner/direct captures at C remain intact; fresh
correction checks above avoid reliance on older changed source/test inputs.

The Fallow brief is orientation, never a correctness gate. Its loader-default
signal is assessed against the actual unchanged entrypoint exception; three
added @ts-expect-error signals are meaningful allowed declaration negatives.
Unconfigured boundary detectors are not measured passes. Historical failed
sandbox, formatting and draft-compiler attempts remain retained. This review's
initial guessed restoration-folder reads and append-anchor check failed
without source changes; actual folder discovery/audit and the corrected append
preserve those limits. Read/tool errors are not source findings or intended RED.

No full npm run check was run or reused by this reviewer. The wave-three gate
predates retry owner edits and cannot certify C. The parent owns the current
wave-four combined gate, later phase verification and final full gate.
WINDOWS46/47 stay OPEN/unwaived, with earlier hook/Gemini limits unchanged.
No later-subsystem, live vendor, hardware, private-account, install, release,
human-judgment or RUN-01 completion is claimed.

Only this report receives a repository write, as an append. The audit script
and native outputs live under /private/tmp. Source, helpers, staged state,
commits and shared coordinator records are unchanged. All reviewer/build/read
resources are released at terminal return.

**Terminal verdict:** full six-file correction round **1**; original
**001–012 fixed**; new/open **CR-04-POLICIES-013 (BLOCKER)**; **1 open**;
rejected/reopened sets empty; **D-03 stop false**. POLICIES remains unclosed
and RUN-01 remains Pending.

## Repair evidence: CR-04-POLICIES-013

Applied by `policies_fix_013` (`gsd-code-fixer`), original bounded task
04-04-01, under `/root/phase4_policies_finish/policies_fix_013`.
Disposition: **applied, pending independent full correction round 2**.
The complete preceding report, including correction round 1, remains verbatim.
That terminal review fixed 001–012 and added only 013: opening 12 minus fixed
12 plus new 1 equals closing 1, with no rejection or reopened finding.
Its D-03 assessment remains reducing, correction counter **1**, stop **false**.
This repair does not reset the counter or independently close 013. The next
full six-file correction retains opening `{CR-04-POLICIES-013}`, count **1**
(one BLOCKER, zero WARNING). Production bugs remain **0**; RUN-01 stays Pending.

The owner imports existing `MAX_BACKOFF_MS` and supplies it as the tested
policy's `maxDelayMs`. Expected delay rows and scheduled deadline observations
retain independent `30_000` literals. An exact comparison confirms these two
replacements are the entire owner change. Every 001–012 repair, full header,
case, expectation, helper name/signature/body and callback verification remains
intact. No production behavior, API, helper file, package or external consumer
changes. The existing recordingLog/countedWork private-query exit-2 limits and
contract-preserving fallbacks remain as recorded above; nothing is deleted.

Initial/current finding location is correction revision
`af2a8e1bda121d0804c50e37c0b7d6e8f2083906` (C), owner lines 17 and 44–45.
Those same locations hold the two-line repair at C plus the retained diff.
The terminal ordinary commit identifies the committed revision; this appendix
does not claim its own future hash.

### Exact production consumers and separate assertion control

Fresh installed Fallow exact impacts targeted
`src/runtime/retryPolicy.ts:MAX_BACKOFF_MS` BEFORE edits, separately using one
`--type-aware-project tsconfig.json` and one `tsconfig.test.json`, each with
`--type-aware-require complete --format json --quiet --explain`.
Both exit 0 with complete status/identity and the expected selected project.
Production identifies accountRuntime; the test project additionally identifies
its owner. Actual composition at accountRuntime:1269, shared-root policy
creation, separate next-delay loop, shadow schedule/reset and relevant owners
were read. Named consumer counts are 1 and 2, not an exhaustive structural-use
claim. No signature/type/member/private-alias change or removal is needed.

Plausible wrong behavior: exported ceiling changes to `30_001` while the
owner's independent promise remains 30,000 milliseconds. Compiler, lint and
execution coverage do not pin the number. The temporary control changes ONLY
that exported numeric initializer. Both compiler projects and focused uncached
lint pass before the fresh control build. Native named target
`completes scheduled attempt 7 only at its 30000 ms deadline` executes and
fails its intended whole-state `deepStrictEqual`, raw exit **1**. At the exact
deadline actual completion is 6 and pending true; expected completion is 7
and pending false. TAP records one failure, zero cancelled/skipped/todo,
`ERR_ASSERTION`; no setup/import/filter error supplies this evidence.

Exact source restoration matches saved pre-edit bytes and HEAD, Git blob
`2c57c73e97be282acfdff61b439bfd86333d5b48`, SHA-256
`4061246a1abfd0a42a9f19238a4e091f68cd27c76a21a89a2ae71bdacac3290e`.
Fresh restored build and all 26 owner tests pass. No control enters Git.
This is assertion maintenance on correct production, not genuine RED history;
no RED JSON or evidence-before-GREEN production repair is claimed.

### Native verification and limits

All checks ran in the existing main checkout at the absolute root above,
features/code-review-sweep, C, Node v26.11.1 and npm 11.20.0. No worktree was
created. The directly read sentinel remains phase 04, plan 04-04, isolation
`none`; Git metadata ledger `gsd-plan-head-before-04-04` retains
`ca0ebbc3f020bd6ad0bbcaf3be5dcd1ee0341950`. Complete AGENTS, all five books,
current source/owner/report, owning plan, CONTEXT, REVIEW-PROTOCOL, PATTERNS,
installed Fallow skill and live help were read before the repair/control.

Native root: `/private/tmp/guardian-04-policies-fix-native/013/`. Each numbered
folder retains exact argv/cwd/UTC start/end/raw exit in command.json, untouched
stdout.raw/stderr.raw, and before/after HEAD/runtime/blob/SHA-256, exact dirty
and staged diffs, full owned bytes and nonignored untracked bytes. The initially
dirty correction-round-1 report is retained in full and joins this cause commit.
Initial interactive context reads precede the recorder; complete caller and
isolation/ledger reads are also retained in 008–009. An initial read-only broad
temporary-directory search encountered a denied daemon directory; it changed
nothing and supplies no assertion evidence.

| Native folder / command scope | Actual result |
| --- | --- |
| 001–004 live Fallow help; 005 exact three-path guard | Exit 0 each; boundaries and rule packs unconfigured |
| 006–007 exact pre-edit MAX_BACKOFF_MS impacts | Exit 0 each; selected projects independently complete |
| 008 callers; 009 assigned-input assertions; 010 reread | Exit 0 each; correct HEAD/branch, only report initially dirty, two-line repair |
| 011 control typecheck; 012 uncached ESLint; 013 build:test | Exit 0 each before intended native failure |
| 014 named cap-deadline control | Exit 1; one intended deepStrictEqual failure, full native TAP retained |
| 015 exact restoration and native failure assessment | Exit 0; saved bytes/blob/SHA-256 and HEAD match |
| 016 restored build:test; 017 full native owner | Exit 0 each; 26 pass, zero fail/cancel/skip/todo |
| 018 test:coverage:direct, exact retry source/owner | Exit 0; isolated direct requirements pass |
| 019 isolated native coverage; retryPolicy.lcov | Exit 0; compiled LH/LF 75/75, FNH/FNF 8/8, BRH/BRF 15/15, all 100% |
| 020 recorded-base Fallow audit, JSON/quiet/explain | Exit 0; verdict pass; zero dead-code/complexity/duplication findings |

Audit base remains R, `e25e26e6232ed99411b7463a7f9839c5eb837ec0`.
Selected runs do not refresh merged all-pair LCOV. Exact scope/history checks,
the clean required two-path pre-step BEFORE individual staging, ordinary
foreground commit with normal hooks, and terminal committed-path/hash/deletion/
clean-tree checks retain actual native streams under this root. Only the owner
and this existing report enter the cause commit. The parent owns the current
combined full gate and fresh full six-file correction round 2. No full-project
pass, zero-open review or POLICIES closure is issued by this fixer.
