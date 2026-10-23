---
phase: 04-runtime-conformance
reviewed: 2026-10-14T22:50:16Z
depth: deep
files_reviewed: 8
files_reviewed_list:
  - src/runtime/accessoryStore.ts
  - test/runtime/accessoryStore.test.ts
  - src/runtime/clock.ts
  - test/runtime/clock.test.ts
  - src/runtime/monotonicClock.ts
  - test/runtime/monotonicClock.test.ts
  - src/runtime/timers.ts
  - test/runtime/timers.test.ts
findings:
  critical: 2
  warning: 5
  info: 0
  total: 7
status: issues_found
batch: PORTS
review_round: 0
correction_rounds: 0
source_revision: 6f475a0db1698847ed7a1c7238ccb461dfdb8bda
first_reviewer: /root/phase4_ports_first/ports_initial_review
---

# Phase 04: Initial PORTS code review

This is the independent ROUND 0 review, before any PORTS repair. All eight
original files and complete headers were read. The five complete rulebooks,
AGENTS, phase context/protocol/research/patterns/plan/validation/ledger and
Fallow pointer plus installed skill were read. Configured skill injection
did not replace the complete books.

There are seven accepted open causes: two test-reliability BLOCKERs and five
conformance WARNINGs. No production bug or security vulnerability was confirmed.
No source, owner, helper or consumer was edited. No regression, assertion
control, Git mutation, commit, full gate, or clean batch is claimed.

## Narrative Findings (AI reviewer)

All initial and current locations below are qualified by the same reviewed
source revision: `6f475a0db1698847ed7a1c7238ccb461dfdb8bda`. File paths are
relative to `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian`.
The initial/current source blobs match exactly; this report is a new planning
artifact. Every cause has requirement RUN-01. Header causes also implement
PROC-03. First observer for every cause is the reviewer named in frontmatter.
All dispositions are **accepted/open**; fix/evidence commits are **none**.

### Critical Issues

### CR-04-PORTS-002 — BLOCKER: Declaration owner tests its own recorder

**Initial/current file:** `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/accessoryStore.test.ts:17-42`.

**Rule:** `skills/typescript-unit-testing/SKILL.md`, Patterns / Type-only
modules and Do not test what a gate already enforces; reviewer Patterns /
Type-only modules and Assertions; reviewer Classifying findings: a case a
wrong implementation would pass is BLOCKER.

**Issue:** The second runtime case invokes only the object literal created at
lines 31-35 and verifies that literal's keys and push. It does not invoke any
production implementation. Its title claims that the recorder represents the
whole port, but a new optional operation on AccessoryStore leaves this literal
and both cases unchanged. Usage and unused members cannot be proved by
enumerating the literal's keys. The first runtime case checks that a
declaration emits no runtime exports, contrary to the explicit declaration-only
owner policy. Neither case provides negative compiler contracts for a missing
or non-callable persist member. The existing annotated literal is a positive
compiler check, but its runtime self-test adds no port-contract protection.

**Fix:** Keep this owner declaration-only. Import AccessoryStore as a type,
retain a meaningful `satisfies` positive, and add described `@ts-expect-error`
checks for missing and non-callable persist. Preserve the exact current
`persist(): void` API. Do not add a wrapper, key enumeration, test export or
fake coverage denominator. Do not propose `persist: () => 1` as a negative:
TypeScript deliberately permits a value-returning function in a void-returning
operation slot. Actual persistence and no-op observations belong to the
platform/pump-record owners, whose production callers were read here.

**Evidence/disposition:** S-04-01 independently accepted; current strict
typecheck, owner and declaration-only direct selector pass (exit 0), showing
that existing tools accept these runtime cases. This is an assertion/design
defect, not a production bug; D-04 genuine RED is inapplicable. Owning repair:
04-01-01. No repair or mutation control was performed.

### CR-04-PORTS-006 — BLOCKER: Monotonic tests do not pin the clock reading or units

**Initial/current file:** `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/monotonicClock.test.ts:17-44`.

**Rule:** Unit writer Assertions / independently expected whole values;
reviewer Assertions / standalone negative assertions and whole values;
reviewer central question and Classifying findings / wrong implementation
would pass. Unit writer Time / deterministic explicit boundary.

**Issue:** These three cases assert only an integer, inequality with one wall
timestamp, and `later >= earlier`. A constant zero satisfies all three. So does
dividing hrtime nanoseconds by one billion to return whole seconds. The latter
still executes the same lines/functions/branches and typechecks, but violates
the module's promised milliseconds. The wall-domain check explicitly uses
`assert.notStrictEqual`, which the rulebook rejects as a standalone expected
value. The current uncontrollable live readings cannot establish the exact
bigint division/truncation that this owner should protect.

**Fix:** Observe the existing public systemMonotonicClock with context-owned
deterministic `process.hrtime.bigint` boundary values. Assert independently
written exact millisecond answers at a non-divisible nanosecond value and an
advance across a millisecond boundary, while a distinctly controlled wall clock
demonstrates independent domains. For example, `1_999_999n` must answer `1`,
then `2_000_000n` must answer `2`. Keep strict numeric expectations and proper
arrange/act/assert blocks. Preserve production behavior, public names,
signatures and visibility; no new injection API or test hook is required by
this finding. Context-owned method mocks restore after the case.

**Evidence/disposition:** S-04-05 accepted for this owner. All three existing
tests and the direct selector pass (exit 0); these passes do not discriminate
the described wrong unit/constant implementations. Counterexamples above are
code-review reasoning, not an executed mutation or genuine regression RED.
Current production uses the correct divisor. Owning repair: 04-02-01.

### Warnings

### CR-04-PORTS-001 — WARNING: Accessory-store pair lacks the approved headers

**Initial/current files:** `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:src/runtime/accessoryStore.ts:1-24`;
`6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/accessoryStore.test.ts:1-10`.

**Rule:** CONTEXT D-01; protocol Typed roles / complete headers; style Files
and modules / copyright JSDoc, fileoverview JSDoc, exactly one blank line
between present sections; style Classifying findings / documentation WARNING.

**Issue:** Source has SPDX immediately followed by the interface's description,
without separate copyright or file overview. Owner begins with the overview
and lacks SPDX and copyright. The source-only license gate accepts the source
SPDX and never inspects the owner, so it cannot enforce this complete contract.

**Fix:** Apply SPDX MIT, blank line, separate copyright JSDoc with
`Copyright (c) 2026 Alessandro Colomba`, blank line, purpose `@fileoverview`
JSDoc, blank line, imports/implementation. Keep the interface's public purpose
documented and preserve per-accessory persistence semantics. Original-work MIT
classification was checked against LICENSE/NOTICE. Header-only repair stays
separate from CR-04-PORTS-002. Owning repair: 04-01-01.

### CR-04-PORTS-003 — WARNING: Wall-clock pair lacks the approved headers

**Initial/current files:** `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:src/runtime/clock.ts:1-8`;
`6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/clock.test.ts:1-6`.

**Rule:** CONTEXT D-01; protocol complete headers; style Files and modules;
style Classifying findings / documentation WARNING.

**Issue:** Source lacks separate copyright/fileoverview blocks and SPDX spacing.
Owner begins directly with imports and lacks all three header sections.

**Fix:** Apply the approved MIT/copyright/purpose sections and exact blank-line
separation to both files, retaining Clock's epoch-millisecond documentation and
composition-only system adapter documentation. Keep this header-only cause
separate from test-structure repair. Owning repair: 04-01-02.

### CR-04-PORTS-004 — WARNING: Wall-clock observation combines ordinary act/assert phases

**Initial/current file:** `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/clock.test.ts:16-17`.

**Rule:** Unit writer Case structure: `// act & assert` only for one
`assert.rejects()` or `assert.throws()` expression; reviewer Case structure;
reviewer Classifying findings / AAA comments WARNING.

**Issue:** An ordinary numeric result assertion uses the combined phase marker.
It is neither a throwing nor rejecting operation, so the explicit exception
does not apply. The assertion itself independently pins the exact epoch time;
this finding does not claim weak behavior protection or a production defect.

**Fix:** Read systemClock.now() into a role-named reading in a separate `// act`
block; compare it with the literal expected epoch time in `// assert`.
Retain the context-owned Date mock and current public API. Owning repair:
04-01-02.

### CR-04-PORTS-005 — WARNING: Monotonic-clock pair lacks the approved headers

**Initial/current files:** `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:src/runtime/monotonicClock.ts:1-14`;
`6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/monotonicClock.test.ts:1-6`.

**Rule:** CONTEXT D-01; protocol complete headers; style Files and modules;
style Classifying findings / documentation WARNING.

**Issue:** Source lacks separate copyright/fileoverview blocks and SPDX spacing;
owner lacks SPDX, copyright and fileoverview.

**Fix:** Apply the approved MIT/copyright/purpose sections to the pair. Preserve
the distinct elapsed-time contract and relevant scope of the existing
suspend-limit explanation. Do not turn a historical Linux observation into a
new cross-platform guarantee. Header-only repair stays separate from
CR-04-PORTS-006. Owning repair: 04-02-01.

### CR-04-PORTS-007 — WARNING: Timer pair lacks the approved headers

**Initial/current files:** `6f475a0db1698847ed7a1c7238ccb461dfdb8bda:src/runtime/timers.ts:1-16`;
`6f475a0db1698847ed7a1c7238ccb461dfdb8bda:test/runtime/timers.test.ts:1-6`.

**Rule:** CONTEXT D-01; protocol complete headers; style Files and modules;
style Classifying findings / documentation WARNING.

**Issue:** Source lacks separate copyright/fileoverview blocks and SPDX spacing;
owner lacks SPDX, copyright and fileoverview.

**Fix:** Apply the approved MIT/copyright/purpose sections to both files without
changing timer or cancellation semantics. Preserve the public unknown handle
and documented narrowing. Owning repair: 04-02-02.

Header IDs are separated by pair so each atomic header cause can fit the
five-path budget and its assigned plan. They are not functional causes.

## Full-file and complete-header inventory

Every line below was reviewed, including imports, exports, full comments,
compiler contracts, every runtime case, test data, mocks, assertions and
cleanup. No helper or external adaptation was created. The blob is both the
initial and current Git blob at the reviewed revision.

| Exact path | Lines read | Initial/current blob | Complete header result | Manual result |
| --- | ---: | --- | --- | --- |
| src/runtime/accessoryStore.ts | 1-27 | 728c7d8dca615d0386424121b36cc8b87ad9ec07 | CR-04-PORTS-001 | Declaration and documented persist operation preserve per-accessory storage |
| test/runtime/accessoryStore.test.ts | 1-42 | c3564e720774c7a42a59c6168fb825ac59e540e7 | CR-04-PORTS-001 | CR-04-PORTS-002; compiler-only owner needed |
| src/runtime/clock.ts | 1-16 | 27105162565a3b6cc848642a351bb3d9923101fd | CR-04-PORTS-003 | Public adapter returns Date.now epoch milliseconds |
| test/runtime/clock.test.ts | 1-30 | 3c325a0f215809a83d0d45ea479be6b991406fb0 | CR-04-PORTS-003 | Exact public reading and advance; CR-04-PORTS-004 |
| src/runtime/monotonicClock.ts | 1-48 | 1973597a4c0f71f6c85a84107490acbcb554f5e7 | CR-04-PORTS-005 | bigint division before Number conversion; separate elapsed domain |
| test/runtime/monotonicClock.test.ts | 1-45 | 490cb015c6bd18226a677703383759f6b1dc1797 | CR-04-PORTS-005 | CR-04-PORTS-006; includes missing arrange marker in first case to resolve in rewritten cases |
| src/runtime/timers.ts | 1-44 | 4ecb4aabdafbc5050ba804a046415b73ff00039c | CR-04-PORTS-007 | Four forwarding operations, lazy side effects, justified unknown-handle narrowing |
| test/runtime/timers.test.ts | 1-98 | 0dc5534abe2bbbfd3782dafc0d5802148ba5440c | CR-04-PORTS-007 | Positive/negative interface checks; complete callback logs for delay, repeat and cancellation cases |

Full actual structural caller reads covered `src/platform.ts:1-644` and
`src/accessories/pumpRecords.ts:1-361`. Platform lines 148-157 construct a
closure bound to one accessory and persist only when that accessory is in the
owned map. PumpRecordsOptions holds AccessoryStore and `observe` calls
`store.persist()` only when changed (lines 313-349). These are consumer context,
not a completed accessory/platform sweep. The imported type travels through
basementGuardian; no public shape change is recommended.

The full `test/device/health.test.ts:1-57` supplied the actual strict compiler
analogy. The full `test/packaging/licenseHeaders.test.ts:1-103` established the
source-only header boundary. LICENSE/NOTICE classification was read. Applicable
auth and monitoring-health excerpts, actual platform composition and symbol-use
searches checked clock domain preservation. Every runtime export has an actual
consumer; no export removal, readonly conversion, method renaming or signature
change is recommended. Exact two-project Fallow pretraces remain mandatory if
a fixer chooses any such change; research traces are not refreshed pre-edit
permission. Fallow was not executed by this reviewer.

## Candidate dispositions

| Candidate | Actual scope and disposition |
| --- | --- |
| S-04-01 | Accepted as CR-04-PORTS-002. The literal-recorder call observes itself; declaration-only policy requires meaningful positive/negative compiler contracts. Not a production bug. |
| S-04-03 | Rejected for this scope. The four ports have no optional or required-present undefined state fields to convert. Timers' unknown handle is intentional; no undefined alias or exhaustive snapshot change is justified. Later runtime owners retain their own review obligation. |
| S-04-04 | Rejected for this scope. The style readonly requirement applies to class properties never reassigned outside construction. These ports are interfaces with methods, not class storage fields; no immutable-interface contract is asserted. Do not make injected adapters or persisted observations readonly by inference. |
| S-04-05 | Accepted for the monotonic owner as CR-04-PORTS-006; the store problem is already CR-04-PORTS-002, not a duplicate ID. Clock compares exact epoch and exact advance; no weak numeric assertion accepted there. Timer cases compare the complete independently written callback logs, including empty logs for absence. Their returned handles are used for cancellation, and separate pre-delay/repeat cases distinguish early and repeated execution. No count-only or negative-value assertion finding is accepted for timers. |
| Adapter Date.now | Rejected as hidden-logic-dependency candidate. This is the public systemClock boundary itself, explicitly wired at composition. Context-owned deterministic Date mocking validly observes that boundary; changing the adapter API is unwarranted. |
| S-04-02/06/07/08 | Outside this eight-file batch. No disposition is inferred for command variants, account cancellation, arrival history or runtime identifier narration. |

The unit-review policy assigns BLOCKER to weak test protection even when
production is currently correct. Header/AAA warnings use the explicit project
conformance rules. No generic preference, performance finding, speculative
runtime defect, guessed normal state or new clock/recovery policy is accepted.

## Current native evidence

Capture runner: `/private/tmp/guardian-04-ports-initial-capture.py`.
Complete machine-readable native records:
`/private/tmp/guardian-04-ports-initial-native/commands.json`.
Each record retains argv, cwd, start/end UTC, measured duration, raw exitCode,
complete stdout and separate stderr. Byte-exact streams are also retained as
`<label>.stdout` and `<label>.stderr` in that directory. No streams or failed
attempts were discarded. All captured commands returned 0; there were no
unsuccessful native attempts in this pass.

`before.json` and `after-checks.json` retain HEAD plus the complete tracked and
non-ignored untracked path manifests, byte lengths, SHA-256 and Git blob hashes,
and base64 untracked bytes. They compare exactly equal. Both recorded empty
untracked arrays and clean `git status`; both `git diff --binary HEAD` streams
are empty. This is current initial-source evidence, not prior-phase reuse.
Ignored/private account files were not read. Installed tools were read only
where specifically required; no installation or network request occurred.

Observed versions: Node `v26.11.1`, npm `11.20.0`, TypeScript `6.0.3`, each raw
exit 0. All source/owner inputs remained at the frontmatter revision.

| Capture label | Exact command | UTC start → end on 2026-10-14 | Seconds | Exit/result |
| --- | --- | --- | ---: | --- |
| typecheck | `npm run typecheck` | 22:49:15.568607 → 22:49:18.190331 | 2.622 | 0, both strict projects |
| lint | `node_modules/.bin/eslint --max-warnings=0 src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts src/runtime/clock.ts test/runtime/clock.test.ts src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts src/runtime/timers.ts test/runtime/timers.test.ts` | 22:49:18.191048 → 22:49:22.363006 | 4.172 | 0, all eight exact files, no lint cache |
| format | `node_modules/.bin/prettier --check src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts src/runtime/clock.ts test/runtime/clock.test.ts src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts src/runtime/timers.ts test/runtime/timers.test.ts` | 22:49:22.363631 → 22:49:22.583264 | 0.220 | 0, all eight exact files |
| build | `npm run build:test` | 22:49:22.583936 → 22:49:25.269838 | 2.686 | 0, fresh compiled owners |
| owner-accessoryStore | `node --test --test-reporter=tap dist-test/test/runtime/accessoryStore.test.js` | 22:49:25.270521 → 22:49:25.508114 | 0.238 | 0, 2 tests/pass |
| direct-accessoryStore | `npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts` | 22:49:25.508748 → 22:49:28.813943 | 3.305 | 0, declaration-only selector acceptance |
| owner-clock | `node --test --test-reporter=tap dist-test/test/runtime/clock.test.js` | 22:49:28.814556 → 22:49:29.047016 | 0.232 | 0, 2 tests/pass |
| direct-clock | `npm run test:coverage:direct -- src/runtime/clock.ts test/runtime/clock.test.ts` | 22:49:29.047673 → 22:49:32.382150 | 3.334 | 0, isolated full line/function/branch acceptance |
| owner-monotonicClock | `node --test --test-reporter=tap dist-test/test/runtime/monotonicClock.test.js` | 22:49:32.382769 → 22:49:32.614002 | 0.231 | 0, 3 tests/pass |
| direct-monotonicClock | `npm run test:coverage:direct -- src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts` | 22:49:32.614668 → 22:49:35.897565 | 3.283 | 0, isolated full line/function/branch acceptance |
| owner-timers | `node --test --test-reporter=tap dist-test/test/runtime/timers.test.js` | 22:49:35.898213 → 22:49:36.134080 | 0.236 | 0, 5 tests/pass |
| direct-timers | `npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts` | 22:49:36.134784 → 22:49:39.444299 | 3.310 | 0, isolated full line/function/branch acceptance |
| license | `node --test --test-reporter=tap dist-test/test/packaging/licenseHeaders.test.js` | 22:49:39.444948 → 22:49:39.681866 | 0.237 | 0, 5 tests/pass; source SPDX gate only |

All stderr streams above are empty. ESLint stdout is also empty. Relevant
verbatim native stdout:

```text
> homebridge-basement-guardian@0.1.1 typecheck
> tsc --noEmit --incremental --tsBuildInfoFile node_modules/.cache/typescript/src.tsbuildinfo && tsc -p tsconfig.test.json --noEmit --incremental --tsBuildInfoFile node_modules/.cache/typescript/test.tsbuildinfo

Checking formatting...
All matched files use Prettier code style!

> homebridge-basement-guardian@0.1.1 build:test
> rimraf ./dist-test && tsc -p tsconfig.test.json
```

The exact complete native TAP, including test names and durations, is in each
`owner-*.stdout` and `commands.json`. Each owner's raw trailer reports zero
failures, cancellations, skipped tests and TODOs. The following verbatim
monotonic trailer illustrates the accepted current owner despite its finding:

```text
1..3
# tests 3
# suites 0
# pass 3
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 120.521708
```

The local direct selector intentionally prints no success summary. Its complete
stdout, for example, is:

```text

> homebridge-basement-guardian@0.1.1 test:coverage:direct
> npm run --silent build:test && node scripts/test-coverage-direct.mjs src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts

```

The selector implementation was inspected: one-source LCOV identity and equal
LF/LH, FNF/FNH, BRF/BRH are enforced at lines 161-190; declaration-only no-record
acceptance is at lines 137-165. Every direct command rebuilt first and ran only
its named owner in an isolated process. Thus executable pairs have 100% direct
line/function/branch acceptance. No numeric runtime denominator is claimed for
accessoryStore, and no compiled/merged count is invented. Selected checks do
not refresh merged `coverage/direct.lcov`.

## Batch accounting and continuation

Round 0 opening accepted IDs after complete initial triage:
`CR-04-PORTS-001`, `CR-04-PORTS-002`, `CR-04-PORTS-003`,
`CR-04-PORTS-004`, `CR-04-PORTS-005`, `CR-04-PORTS-006`,
`CR-04-PORTS-007` — **7 open (2 BLOCKER, 5 WARNING)**.
There were no previously accepted PORTS IDs. Fixed IDs: none. Rejected accepted
IDs: none. Reopened IDs: none. Closing initial open set is the same seven IDs.
Candidate rejections above are not accepted-ID removals.

04-01 owns IDs 001/002 (accessoryStore) and 003/004 (clock). 04-02 retains
005/006 (monotonicClock) and 007 (timers). No partial batch is clean. Correction
counter remains **0**; complete independent correction occurs only after the
04-02 repair pass and includes all eight current files plus actual additions.
No D-03 stop trigger exists in this initial review. New findings must retain
this continuous batch and ID sequence.

T-04-01 contract preservation was manually traced at current initial source;
store compiler-contract weakness remains open. T-04-02 now has actual initial
scope/header/native evidence, with open causes and unperformed future repairs.
T-04-03 exact elapsed conversion protection remains open in CR-04-PORTS-006.
T-04-04 timer forwarding/cancellation cases were reviewed and passed current
focused execution, while its header cause remains open. T-04-SC remains bounded
by no installs; no package or external integration was introduced.

No genuine D-04 production defect is accepted; no RED JSON, evidence-only
commit or GREEN change is authorized by test-maintenance findings alone.
No assertion control was executed. A fixer may need separate restored control
evidence for assertion work under the protocol. Any actual production bug must
be reported and follow planning-evidence-before-GREEN ordering.

The prior cf04e71 full gate is historical evidence only. This review ran no
full `npm run check`, Cucumber, real-home, hardware or live vendor checks, and
does not close RUN-01 or any later subsystem sweep. Shared ledger/windows/Git
and phase advancement remain with the parent. All child command processes
completed; no build, mutation, Git or helper resource remains held after the
reviewer's terminal result.

## Accepted-cause repair records (04-01)

The initial review above is retained as the round-0 observation. This appended
repair history does not replace it or run a full-batch correction. Fixer:
`/root/phase4_ports_first/ports_store_clock_fixes`, typed gsd-code-fixer,
fresh context, complete AGENTS and all five books read. The parent granted
exclusive writer/build/control/Git/report ownership until terminal return.
No helper, external adaptation, package or genuine production bug is needed.

All repair checks run in the existing authorized checkout
`/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian`,
branch `features/code-review-sweep`, not a temporary fixer checkout. The
persisted dispatch sentinel says `isolation: none`, plan `04-01`. Plan baseline
and recorded audit base are `6f475a0db1698847ed7a1c7238ccb461dfdb8bda`.
The plan-head ledger in the actual Git worktree metadata records that same
baseline before HEAD moves. The primary `main` checkout is not modified.

Native capture runner: `/private/tmp/guardian-04-ports-fix-capture.py`.
Each `<label>.json` under `/private/tmp/guardian-04-ports-fix-native/` retains
exact argv/cwd, UTC start/end/duration, raw exitCode, full stdout and separate
stderr, plus before/after HEAD, branch, Git directory, every tracked/nonignored
untracked path's byte length/SHA-256/Git blob, binary dirty diff and complete
untracked bytes. Exact streams are also `<label>.stdout` and `.stderr`.
This captures dirty provenance for headers as well as later test maintenance.
Node `v26.11.1` and npm `11.20.0` were observed at `initial` and `npm-version`,
both exit 0. No installation or runtime change occurred.

The canonical `execute-mvp-tdd.md` gate was read before implementation.
TDD_MODE is true, but these accepted causes add headers or maintain tests of
unchanged production behavior. The gate's behavior-adding definition excludes
this work; no fabricated regression RED or failing-code commit is introduced.
D-04 would require planning-only evidence before any genuine bug GREEN.
The task-1 pre-edit tracer freshly built and passed its owner (2 existing
runtime cases) and declaration-only selector at the baseline: captures
`tracer-before-build`, `tracer-before-owner`, `tracer-before-direct`, all exit 0.
The following compiler-only repair removes those runtime cases by design.

### CR-04-PORTS-001 repair — accessory-store headers

Applied the approved SPDX/copyright/fileoverview sections and exact blank-line
separation to both files. Kept the interface JSDoc, required `persist(): void`,
and all runtime/test statements unchanged. Read both complete edited files.
Current source blob: `a7ce446ff9d47ec6106d0a6f609bff1472b9677f`;
current owner blob: `76d76106ef9805a9213d216055861c9096b4f411`.
Initial blobs remain in the inventory above. Header sections are manually
inspected; the source-only license gate does not establish owner conformance.

| Capture label | Exact command | Raw exit and observation |
| --- | --- | --- |
| guard-store-header | `node_modules/.bin/fallow guard src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts --format json --quiet --explain` | 0; both exist; no configured boundary zones/rule packs |
| cause001-build | `npm run build:test` | 0; fresh strict compiled owners |
| cause001-owner | `node --test --test-reporter=tap dist-test/test/runtime/accessoryStore.test.js` | 0; both existing cases passed, no skips/cancellations |
| cause001-direct | `npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts` | 0; declaration-only selector acceptance, no numeric runtime denominator |
| cause001-audit | `node_modules/.bin/fallow audit --base 6f475a0db1698847ed7a1c7238ccb461dfdb8bda --format json --quiet --explain` | 0; kind audit, verdict pass, no introduced findings |

Cause scope is exactly source, owner and this report (3 paths). Commit and
clean pre-step/hook results are appended after the actual foreground commit.
This is a header-only cause; CR-04-PORTS-002 remains for its separate commit.

CR-04-PORTS-001 committed as
`227c799cebde0e77be9a85c605348ad00add1a69`, exactly the three paths above.
`cause001-prestep` ran the exact required
`SKIP=npm-check pre-commit run --files src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`
and returned 0, clean on its first attempt, before staging. `cause001-commit`
retains the guarded cwd/toplevel/feature-branch assertion, exact named `git add`
and normal foreground commit, raw exit 0 and both hook-stage streams.
The pre-commit stage reports `npm run check:commit ... Passed`; the subsequent
commit-message stage correctly has no matching build files. No bypass was used.

### CR-04-PORTS-002 repair — declaration compiler contracts

Removed both runtime recorder/export-enumeration cases and their unused
runtime imports. The type-only owner now supplies `satisfies` positives for a
void-compatible operation, including a value-returning function that TypeScript
validly permits in a void slot. Described `@ts-expect-error` negatives pin a
missing operation and a non-callable flag. The compiler rejects an unused
negative directive if that invalid shape becomes assignable. There is no
runtime wrapper, call, key enumeration, test export, or fabricated numeric
coverage denominator. No production code or public API changed.

Read the whole edited owner. Structural caller reads included the full platform
and pumpRecords files: platform constructs a closure bound to one owned
accessory; pumpRecords persists only a changed observation. Their existing
implementation and ownership remain intact. The health compiler owner supplied
the declaration-only analogy. No name/signature/mutability/visibility change
or private-alias deletion was chosen, so conditional two-project impact or
deletion probes were not needed. No runtime assertion control applies to this
compiler-only owner; compiler contract checks replace the literal self-test.

| Capture label | Exact command | Raw exit and observation |
| --- | --- | --- |
| guard-store-contract | `node_modules/.bin/fallow guard test/runtime/accessoryStore.test.ts --format json --quiet --explain` | 0; no configured boundary zones/rule packs |
| cause002-typecheck | `npm run typecheck` | 0; both strict compiler projects, positive/negative contracts accepted |
| cause002-build | `npm run build:test` | 0; freshly compiled owner |
| cause002-owner | `node --test --test-reporter=tap dist-test/test/runtime/accessoryStore.test.js` | 0; zero declared runtime cases, Node reports one passing file subtest; no skips/cancellations |
| cause002-direct | `npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts` | 0; honest declaration-only selector acceptance |
| cause002-audit | `node_modules/.bin/fallow audit --base 6f475a0db1698847ed7a1c7238ccb461dfdb8bda --format json --quiet --explain` | 2; sandbox could not create temporary base worktree; retained as failed attempt |
| cause002-audit-retry | same exact audit with authorized Git-metadata access | 0; kind audit, verdict pass, zero introduced findings |

The retry warns that base-snapshot TypeScript cache entrypoints outside its
temporary project root are skipped; this is retained in separate stderr.
The failed sandbox attempt does not count as passing evidence. Cause scope is
owner and report (2 paths). The required clean pre-step and foreground commit
result will be appended after execution. PORTS correction counter remains 0.

CR-04-PORTS-002 committed as
`ce3608815f4a9561a4807c209ae2144e7757d2cf`, owner and report only. Owner blob
is `4da2a0ab4d8e106c115978e2c55be25a79cab07e`; source remains the cause-001
blob. `cause002-prestep` used exact
`SKIP=npm-check pre-commit run --files test/runtime/accessoryStore.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`,
exit 0 and clean on the first attempt before staging. `cause002-commit`
retains exact cwd/toplevel/feature-branch guards, named add and normal commit,
exit 0. Its pre-commit `npm run check:commit` passed; commit-message stage has
no matching build files. There are no skipped fixes or uncommitted controls.

### CR-04-PORTS-003 repair — wall-clock headers

Added the approved three header sections to the source and owner, preserving
Clock's public interface JSDoc, epoch-millisecond member documentation and
composition-only adapter documentation. Read both complete edited files and
inspected each section/blank line. Runtime/test statements are unchanged.
Cause scope is source, owner and report (3 paths), separate from AAA repair.

| Capture label | Exact command | Raw exit and observation |
| --- | --- | --- |
| guard-clock-header | `node_modules/.bin/fallow guard src/runtime/clock.ts test/runtime/clock.test.ts --format json --quiet --explain` | 0; no configured boundary zones/rule packs |
| cause003-build | `npm run build:test` | 0; fresh strict compiled owner |
| cause003-owner | `node --test --test-reporter=tap dist-test/test/runtime/clock.test.js` | 0; 2 tests passed, no skips/cancellations |
| cause003-direct | `npm run test:coverage:direct -- src/runtime/clock.ts test/runtime/clock.test.ts` | 0; isolated 100% line/function/branch acceptance |
| cause003-audit | `node_modules/.bin/fallow audit --base 6f475a0db1698847ed7a1c7238ccb461dfdb8bda --format json --quiet --explain` | 0; kind audit, verdict pass, no introduced findings |

The audit retains its cache-entrypoint warning in stderr. Clean pre-step and
actual foreground commit proof follow execution. No public contract changed;
clock consumers still read wall epoch milliseconds, separately from elapsed
time. Actual monitoring-health, auth, shadow, device-state, failure-log and
account credential-rotation bodies were read, along with platform composition.

CR-04-PORTS-003 committed as
`fd53a74eca0be5f5aece5717f6403756460dcd9b`, exactly the three named paths.
Source blob: `c6b98a6e2c6863ae0a567d38f1665e40fceb122b`; owner blob:
`b234b348a8ecdec02c223357721dff9126155a23`.
`cause003-prestep` ran exact
`SKIP=npm-check pre-commit run --files src/runtime/clock.ts test/runtime/clock.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`,
exit 0, clean on the first attempt before staging. `cause003-commit` retains
guarded cwd/toplevel/feature branch, named stage and normal foreground commit,
exit 0; pre-commit `npm run check:commit` passed. No bypass was used.

### CR-04-PORTS-004 repair — separate wall-clock act/assert

The first case reads the public `systemClock.now()` into `reading` in its act
block, then asserts the independent literal epoch value in its assert block.
Its context-owned deterministic Date setup and the exact advance assertion
remain. Read the complete edited owner. The final production file is identical
to the committed header-cause bytes; no operation, API or time domain changed.
Cause scope is the owner and report (2 final paths). The separate temporary
assertion control touched the already-owned source and was fully restored.

#### Assertion maintenance control (not genuine bug RED)

Plausible wrong public behavior: the system adapter returns seconds by dividing
`Date.now()` by `1_000`. Compiler and lint accept that numeric expression; those
checks cannot establish epoch-millisecond units. This controlled experiment
checks the assertions preserved by the AAA edit, not a previously shipped bug.
No conditional RED JSON or evidence-before-GREEN bug commit is warranted.

Before the mutation, `cause004-control-before` records HEAD
`fd53a74eca0be5f5aece5717f6403756460dcd9b`, source blob
`c6b98a6e2c6863ae0a567d38f1665e40fceb122b`, owner blob
`76e54e0379e93a0827c99cf0de959a64edfa463a` and exact dirty/untracked bytes.
The control changes only `now: () => Date.now()` to
`now: () => Date.now() / 1_000`. Complete control diff, source blob and native
streams are retained by the following captures at that same source HEAD.

| Capture label | Exact command | Raw exit and observation |
| --- | --- | --- |
| guard-clock-aaa | `node_modules/.bin/fallow guard src/runtime/clock.ts test/runtime/clock.test.ts --format json --quiet --explain` | 0; exact source/owner guard before edits/control |
| cause004-control-typecheck | `npm run typecheck` | 0; both strict projects accept the wrong units |
| cause004-control-lint | `node_modules/.bin/eslint --max-warnings=0 src/runtime/clock.ts test/runtime/clock.test.ts` | 0; no cache, accepts the wrong units |
| cause004-control-build | `npm run build:test` | 0; fresh wrong-unit owner |
| cause004-control-owner | `node --test --test-reporter=tap dist-test/test/runtime/clock.test.js` | 1; 2 intended assertion failures, 0 pass/skip/cancel |
| cause004-control-restored | exact byte comparison of working source with `git show HEAD:src/runtime/clock.ts` via captured `node -e` argv | 0; exact bytes restored to source blob above |
| cause004-build | `npm run build:test` | 0; fresh restored production |
| cause004-owner | `node --test --test-reporter=tap dist-test/test/runtime/clock.test.js` | 0; 2 tests pass, 0 fail/skip/cancel |
| cause004-direct | `npm run test:coverage:direct -- src/runtime/clock.ts test/runtime/clock.test.ts` | 0; isolated 100% line/function/branch acceptance |
| cause004-audit | `node_modules/.bin/fallow audit --base 6f475a0db1698847ed7a1c7238ccb461dfdb8bda --format json --quiet --explain` | 0; kind audit, verdict pass, no introduced findings |

Verbatim intended assertion details from full native control TAP:

```text
not ok 1 - reports the current process time in milliseconds
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 1700000000000
  actual: 1700000000
  operator: 'strictEqual'
not ok 2 - reports a time that advances with the process clock
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 1500
  actual: 1.5
  operator: 'strictEqual'
1..2
# tests 2
# suites 0
# pass 0
# fail 2
# cancelled 0
# skipped 0
# todo 0
```

Both named assertions executed and failed for the intended wrong units;
there was no compile/import/setup failure. Complete untouched TAP with stacks,
timestamps and separate empty stderr is `cause004-control-owner.stdout` and
`.json`. The exact restoration is independently byte-compared before rebuilt
GREEN; no control mutation is staged or committed. The rebuilt GREEN owner
trailer reports 2 pass, 0 fail/cancel/skip/todo. This is separate from D-04
genuine production bug history. No genuine production bug was found.

CR-04-PORTS-004 committed as
`84f4ca8d82f72d435895e31fe49aa0e7d85531a7`, owner and report only.
`cause004-prestep` ran exact
`SKIP=npm-check pre-commit run --files test/runtime/clock.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`,
exit 0, clean on the first attempt before staging. `cause004-commit` retains
the exact cwd/toplevel/feature-branch and restored-source guards, named staging
and normal foreground commit, raw exit 0. Its pre-commit
`npm run check:commit` passed. All four cause commits passed that incremental
gate and gitlint; no hook failed, formatter changed inputs, or bypass occurred.
Exact complete pre-step and commit streams for all four causes are retained.

### Current disposition and handoff

At current source revision `84f4ca8d82f72d435895e31fe49aa0e7d85531a7`:

| Accepted cause | Current revision-qualified location | Disposition / commit |
| --- | --- | --- |
| CR-04-PORTS-001 | `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:src/runtime/accessoryStore.ts:1`, `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:test/runtime/accessoryStore.test.ts:1` | Repaired; `227c799cebde0e77be9a85c605348ad00add1a69` |
| CR-04-PORTS-002 | `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:test/runtime/accessoryStore.test.ts:11` | Repaired; `ce3608815f4a9561a4807c209ae2144e7757d2cf` |
| CR-04-PORTS-003 | `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:src/runtime/clock.ts:1`, `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:test/runtime/clock.test.ts:1` | Repaired; `fd53a74eca0be5f5aece5717f6403756460dcd9b` |
| CR-04-PORTS-004 | `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:test/runtime/clock.test.ts:26` | Repaired; `84f4ca8d82f72d435895e31fe49aa0e7d85531a7` |
| CR-04-PORTS-005 | `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:src/runtime/monotonicClock.ts:1`, `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:test/runtime/monotonicClock.test.ts:1` | Open; assigned 04-02-01 |
| CR-04-PORTS-006 | `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:test/runtime/monotonicClock.test.ts:17` | Open; assigned 04-02-01 |
| CR-04-PORTS-007 | `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:src/runtime/timers.ts:1`, `84f4ca8d82f72d435895e31fe49aa0e7d85531a7:test/runtime/timers.test.ts:1` | Open; assigned 04-02-02 |

Original opening set: 001/002/003/004/005/006/007 (7). Repaired set:
001/002/003/004 (4). Rejected accepted IDs: none. New accepted IDs: none.
Reopened IDs: none. Continuing open set: 005/006/007 (3: 1 BLOCKER, 2 WARNING).
Accounting is 7 - 4 - 0 + 0 + 0 = 3. This is a cause-repair handoff, not an
independent correction. Full PORTS batch remains OPEN, correction counter 0;
the complete correction waits for 04-02 and covers all eight original files.
No D-03 correction stop trigger has occurred. The original review frontmatter
and observation text remain the original round-0 evidence.

Task 04-01-01 tracer was checked again at this current revision:
`tracer-after-build` (`npm run build:test`), `tracer-after-owner`
(`node --test --test-reporter=tap dist-test/test/runtime/accessoryStore.test.js`),
and `tracer-after-direct`
(`npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts`)
all returned 0. There are zero declared runtime cases; the native TAP has one
passing file subtest, with no failures/skips/cancellations. Strict positive and
negative shapes remain compiled. Both tasks' accepted causes are disposed.

Current blobs are source store `a7ce446ff9d47ec6106d0a6f609bff1472b9677f`,
store owner `4da2a0ab4d8e106c115978e2c55be25a79cab07e`, source clock
`c6b98a6e2c6863ae0a567d38f1665e40fceb122b`, and clock owner
`76e54e0379e93a0827c99cf0de959a64edfa463a`.
`final-source-contracts` independently compared every source byte from the
original public documentation through EOF against the initial Git source,
exit 0: both API/documentation/implementation suffixes are unchanged.
Only the approved source headers differ. `final-future-unchanged` compared
all four 04-02 paths against the initial commit with `git diff --exit-code`,
exit 0. Their initial blobs still apply. `final-git` retains all four actual
commit hashes, ancestry and exact named paths. No deletion or new executable
file was introduced. No source control experiment enters those commits.

Native executable-clock direct acceptance is isolated 100% lines/functions/
branches under the existing selector. No numeric declaration denominator or
new compiled/merged LCOV count is claimed. Selected runs do not refresh merged
`coverage/direct.lcov`. Node 26.11.1 is the observed local toolchain, not new
evidence for the declared Node 22/24 compatibility matrix. No full
`npm run check`, Cucumber, live vendor, hardware or private-input check was run
by this fixer. The parent still owes the current combined-wave full gate and
later phase verification; RUN-01 stays Pending.

This final report metadata is left for the parent's separate SUMMARY/record
commit, as authorized. Only this report may be dirty at return; all four cause
source/owner changes are committed. No SUMMARY, shared state, ledger, validation,
seal, requirement, ROADMAP or WINDOWS file was modified. All command processes
have completed, and writer/build/control/Git/report resources are released at
the fixer's terminal response.

## Accepted-cause repair records (04-02)

Fixer: `/root/phase4_ports_finish/ports_monotonic_timer_fixes`, typed
gsd-code-fixer with fresh context. Complete AGENTS and all five rulebooks were
read, with the owning plan, context, research, patterns, protocol, initial
report and preceding summary. Existing checkout and branch remain authorized;
the persisted sentinel says phase 04, plan 04-02, isolation none. Baseline
`8420c63b3dab421a1c002197c9e2bb15715097af` was persisted in the actual Git
directory as `gsd-plan-head-before-04-02` before the first cause commit.

All commands run in the existing feature checkout, not a temporary worktree.
Native runner `/private/tmp/guardian-04-ports-fix-capture.py` was read before
reuse. Records under `/private/tmp/guardian-04-ports-fix-native/<label>.json`
retain complete argv, stdout/stderr, raw exit, UTC times, revision, branch,
path/blob/SHA-256 manifest, binary dirty diff and complete untracked bytes.
Separate `.stdout` and `.stderr` retain exact streams. `cause005-initial` and
`cause005-npm` observed Node v26.11.1 and npm 11.20.0, exit 0. Two initial shell
probes used unavailable `python` and returned 127 before work; `python3` is the
available capture runtime. No runtime/package change or installation occurred.

The canonical execute-mvp-tdd gate was read. Headers and assertion maintenance
on correct production add no product behavior. No genuine bug RED is claimed.
The accepted causes preserve every public signature, member, visibility and
mutability; no alias is removed. Conditional exact two-project contract-change
traces are therefore not needed. Actual monitoring-health consumers and platform
composition were read before edits, with auth/shadow partial analogs and timer
handle/cancellation consumers. No later-subsystem sweep is claimed.

### CR-04-PORTS-005 repair — monotonic-clock headers

Added approved SPDX, separate copyright and purpose fileoverview sections with
the prescribed blank lines to both files. Re-read both full edited files.
The public elapsed-time documentation and all source/test statements remain
unchanged, including bigint division before Number and the distinction between
the historical Linux observation and the cited, unobserved suspend limit.
Cause scope is source, owner and this report (3 paths).

| Capture label | Exact command | Raw exit and observation |
| --- | --- | --- |
| guard-monotonic-header | `node_modules/.bin/fallow guard src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts --format json --quiet --explain` | 0; no configured boundary zones/rule packs |
| cause005-build | `npm run build:test` | 0; fresh strict compiled owner |
| cause005-owner | `node --test --test-reporter=tap dist-test/test/runtime/monotonicClock.test.js` | 0; 3 tests pass, 0 fail/skip/cancel/todo |
| cause005-direct | `npm run test:coverage:direct -- src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts` | 0; isolated 100% lines/functions/branches |
| cause005-audit | `node_modules/.bin/fallow audit --base 6f475a0db1698847ed7a1c7238ccb461dfdb8bda --format json --quiet --explain` | 2; sandbox temporary base-worktree creation failure, retained |
| cause005-audit-retry | same exact audit with authorized external Git metadata access | 0; kind audit, verdict pass |

The retry's stderr retains the base-snapshot TypeScript-cache-entrypoint
warning. The failed attempt is not passing evidence. Header inspection is
manual for source and owner; the packaging gate covers only source SPDX.
Clean pre-step and actual normal commit proof follow execution. The remaining
assertion repair remains separate; correction counter is still 0.

CR-04-PORTS-005 committed as
`8fb80f9e7c488a3c5bf0f392a54aec3ff64f45ff`, exactly monotonic source,
owner and report. Source blob `1a4a105d8f9efd86d8cfdf9c2e20f4b9c3538192`;
owner blob `9b2041a05dcea8968f6ad701e9983579cbb299f0`.
`cause005-prestep` ran exact `SKIP=npm-check pre-commit run --files src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`,
exit 0, clean before staging. `cause005-commit` retains cwd/toplevel/feature
branch guards, named staging and foreground normal commit, exit 0. Its ordinary
pre-commit `npm run check:commit` and gitlint passed; no bypass was used.

### CR-04-PORTS-006 repair — exact monotonic observations

The complete rewritten owner uses context-owned `process.hrtime.bigint`
stubs through the unchanged public `systemMonotonicClock.now()`.
`1_999_999n` answers literal `1`, followed by `2_000_000n` answering literal
`2`; the whole `{ earlier, later }` observation pins truncation and advance.
A separate case holds the elapsed input fixed and moves a distinctly controlled
wall clock backward, asserting exact `{ earlier: 1, later: 1 }`. Both cases
have separate arrange/act/assert blocks. Context cleanup restores globals;
no production hook, export, API, runtime behavior or time domain changed.
Read the entire modified owner and unchanged production section again.

#### Assertion maintenance control (separate from genuine bug RED)

Plausible wrong public behavior: divide by `1_000_000_000n` to return whole
seconds. Strict compiler and exact-file lint accept this numeric implementation;
coverage alone cannot distinguish its units. `cause006-control-before` retains
source HEAD `8fb80f9e7c488a3c5bf0f392a54aec3ff64f45ff`, correct source blob
`1a4a105d8f9efd86d8cfdf9c2e20f4b9c3538192`, rewritten owner blob
`33d3e5dd77ef752c2fbd1a1b77824871f7ea5331`, complete dirty diff and bytes.
The temporary control changes only the divisor; its full bytes/diff and native
outputs are retained in the following command records.

| Capture label | Exact command | Raw exit and observation |
| --- | --- | --- |
| guard-monotonic-assertions | `node_modules/.bin/fallow guard src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts --format json --quiet --explain` | 0; guard before owner/control edits |
| cause006-control-typecheck | `npm run typecheck` | 0; both strict projects accept wrong units |
| cause006-control-lint | `node_modules/.bin/eslint --max-warnings=0 src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts` | 0; no cache, accepts wrong units |
| cause006-control-build | `npm run build:test` | 0; fresh controlled implementation |
| cause006-control-owner | `node --test --test-reporter=tap dist-test/test/runtime/monotonicClock.test.js` | 1; both intended assertions fail; 0 pass/skip/cancel/todo |
| cause006-control-restored | captured `node -e` byte comparison against `git show HEAD:src/runtime/monotonicClock.ts` | 0; exact source bytes restored to blob above |
| cause006-build | `npm run build:test` | 0; fresh restored source |
| cause006-owner | `node --test --test-reporter=tap dist-test/test/runtime/monotonicClock.test.js` | 0; 2 pass, 0 fail/skip/cancel/todo |
| cause006-direct | `npm run test:coverage:direct -- src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts` | 0; isolated 100% lines/functions/branches |
| cause006-audit | `node_modules/.bin/fallow audit --base 6f475a0db1698847ed7a1c7238ccb461dfdb8bda --format json --quiet --explain` | 0; kind audit, verdict pass |

Native failure semantics: the boundary case expected `{ earlier: 1, later: 2 }`
and received `{ earlier: 0, later: 0 }`; the wall-correction case expected
`{ earlier: 1, later: 1 }` and received `{ earlier: 0, later: 0 }`.
Both are named `ERR_ASSERTION`, `AssertionError`, `deepStrictEqual` failures,
not setup/import/compile failures. Complete untouched TAP and separate stderr
are in `cause006-control-owner.stdout`, `.stderr` and `.json`.
Restoration was independently byte-compared before rebuilt GREEN. No control
mutation is staged. This is test maintenance on correct production, with no
genuine D-04 JSON or evidence-only bug commit. Cause scope is owner and report
(2 final paths); the temporary control touched the already-owned source only.

CR-04-PORTS-006 committed as
`419cab0a8d14dfef16a127f0e02b6be591a3b6da`, owner and report only.
`cause006-prestep` and final `cause006-prestep-final` both ran exact
`SKIP=npm-check pre-commit run --files test/runtime/monotonicClock.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`,
exit 0. The final clean repetition follows a report hash correction and
precedes staging. No fixer changed source/owner bytes. `cause006-commit`
retains cwd/toplevel/feature-branch and unchanged-source guards, named stage
and foreground normal commit, exit 0; incremental check:commit and gitlint
passed. No bypass or failing code commit occurred.

Before expanding to timers, task 04-02-01 was rerun at this exact source HEAD:
`monotonic-tracer-after-build` (`npm run build:test`),
`monotonic-tracer-after-owner`
(`node --test --test-reporter=tap dist-test/test/runtime/monotonicClock.test.js`)
and `monotonic-tracer-after-direct`
(`npm run test:coverage:direct -- src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts`)
all returned 0. The two complete owner cases passed with zero skips,
cancellations, failures and TODOs; isolated line/function/branch acceptance
is 100%. No selected run refreshes merged `coverage/direct.lcov`.

### CR-04-PORTS-007 repair — timer headers

Added the approved SPDX/copyright/fileoverview sections and blank-line spacing
to source and owner. Re-read both full edited files. All original public
interface documentation, the unknown handle type, justified narrowing, lazy
scheduling and cancellation implementations and all five owner cases remain
unchanged. Their complete callback logs still discriminate before-delay,
after-delay, interval repetition and cancellation through public operations.
Cause scope is source, owner and report (3 paths); no helper/adaptation exists.

| Capture label | Exact command | Raw exit and observation |
| --- | --- | --- |
| guard-timers-header | `node_modules/.bin/fallow guard src/runtime/timers.ts test/runtime/timers.test.ts --format json --quiet --explain` | 0; before edits, no configured boundary zones/rule packs |
| cause007-build | `npm run build:test` | 0; fresh strict compiled owner |
| cause007-owner | `node --test --test-reporter=tap dist-test/test/runtime/timers.test.js` | 0; 5 pass, 0 fail/skip/cancel/todo |
| cause007-direct | `npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts` | 0; isolated 100% lines/functions/branches |
| cause007-audit | `node_modules/.bin/fallow audit --base 6f475a0db1698847ed7a1c7238ccb461dfdb8bda --format json --quiet --explain` | 0; kind audit, verdict pass |

The audit's cache-entrypoint warning is retained in separate stderr.
No timer assertion or runtime control was needed for this header-only cause.
There is no genuine bug JSON or production repair. Actual normal pre-step and
commit results follow execution. Original round-0 evidence stays unchanged;
no independent correction has run in this repair slice.

CR-04-PORTS-007 committed as
`8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa`, exactly timer source, owner
and report. Source blob `7fb32bb219bc4f20cff82e13bec518afc591b38f`;
owner blob `979addb2ddaad063e92781464dca8d16da376cb8`.
`cause007-prestep` ran exact
`SKIP=npm-check pre-commit run --files src/runtime/timers.ts test/runtime/timers.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`,
exit 0, clean before staging. `cause007-commit` retains cwd/toplevel/feature
guards, exact named stage and foreground normal commit, exit 0. Its ordinary
incremental check:commit and gitlint passed. All three cause commit streams
include the passing pre-commit check:commit and subsequent commit-message stage
with no matching build files. No hook bypass or failed commit occurred.

### Current repair disposition and terminal handoff

Current source revision: `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa`.
Original round-0 frontmatter and history remain historical evidence.

| Accepted cause | Current revision-qualified location | Repair / actual commit |
| --- | --- | --- |
| CR-04-PORTS-005 | `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa:src/runtime/monotonicClock.ts:1`, `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa:test/runtime/monotonicClock.test.ts:1` | Repaired; `8fb80f9e7c488a3c5bf0f392a54aec3ff64f45ff` |
| CR-04-PORTS-006 | `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa:test/runtime/monotonicClock.test.ts:23` | Repaired; `419cab0a8d14dfef16a127f0e02b6be591a3b6da` |
| CR-04-PORTS-007 | `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa:src/runtime/timers.ts:1`, `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa:test/runtime/timers.test.ts:1` | Repaired; `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa` |

Cause-repair accounting: original 001–007 (7), repaired 001–007 (7), rejected
accepted IDs none, new/reopened IDs none; `7 - 7 - 0 + 0 + 0 = 0` pending
independent full-batch confirmation. This records attempted repairs, not a clean
independent verdict. Correction counter remains **0**. The parent still must
dispatch the fresh complete eight-file PORTS correction and apply D-03 before
any further work. No correction or counter reset occurred here.

`ports-final-contracts` independently compared the complete original public
documentation/API/implementation suffix of both sources and the timer owner's
import-through-EOF suffix against plan baseline, exit 0. Only source headers
changed; bigint division and all timer semantics remain exact. The monotonic
owner blob is `33d3e5dd77ef752c2fbd1a1b77824871f7ea5331`.
`ports-final-previous-unchanged` ran exact four-path Git comparison against
baseline, exit 0: prior accessoryStore/clock repairs are untouched.
`ports-final-git` retains real three-commit ancestry and exact named paths,
exit 0. No tracked file deletion, helper or external adaptation was introduced.

Focused verification ran in the existing authorized checkout on Node v26.11.1.
No new cross-version, host-suspend, live vendor, hardware, private-input,
Cucumber or full `npm run check` result is claimed. The parent owns the current
combined-wave full gate. T-04-03 has independent exact elapsed-unit observations
and a restored wrong-unit control; T-04-04 retains the complete passing timer
owner and unchanged scheduling/cancellation bytes. RUN-01 remains Pending.

Only this final report metadata is left dirty for the parent's execution-record
commit. All three cause changes are committed. No SUMMARY, shared state,
ROADMAP, REQUIREMENTS, WINDOWS, central ledger, validation or seal was changed.
All child commands have completed. Terminal return releases the exclusive
writer/build/control/Git/report lease.

## Independent full PORTS correction — ROUND 1

Reviewer: `/root/phase4_ports_finish/ports_full_correction`, typed
`gsd-code-reviewer`, independent fresh context. Reviewed source revision:
`8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa`, existing
`features/code-review-sweep` checkout. This appended section is authoritative
for the current correction; the original frontmatter and ROUND 0 remain
historical. Current status: **issues_found — 1 BLOCKER, 0 WARNING, 0 INFO**.
Correction counter: **1**.

The reviewer read complete AGENTS, all five style/comment/unit writer/unit
reviewer/local-verification books, both owning plans, context, research,
patterns, review protocol, complete existing report and 04-01 summary.
Fresh Codex resolver returned empty model and effort `high`; configured
agent-skills named comments, style and unit reviewer and did not replace the
five books. All eight full current files, including every header and every
case, received manual review. This was not a diff-only check. No helper or
external adaptation was added: the actual source/test/feature comparison
against the initial review contains exactly these original eight paths.

### Complete current scope and manual judgments

Every location in this correction is qualified by the source revision above.
All eight headers have MIT SPDX first, separate original-work copyright and
purpose overview JSDoc blocks, and one blank line between sections. Existing
LICENSE/NOTICE attribution places these files in original MIT work. Owner
headers were inspected directly; the source-only packaging gate cannot prove
their conformance.

| Exact full path | Lines read | Current Git blob | Manual judgment |
| --- | ---: | --- | --- |
| src/runtime/accessoryStore.ts | 1–36 | `a7ce446ff9d47ec6106d0a6f609bff1472b9677f` | Required callable persist and accessory scope retained; full public documentation/header checked |
| test/runtime/accessoryStore.test.ts | 1–19 | `4da2a0ab4d8e106c115978e2c55be25a79cab07e` | Meaningful satisfies positives and described missing/non-callable negatives; zero authored runtime cases |
| src/runtime/clock.ts | 1–25 | `c6b98a6e2c6863ae0a567d38f1665e40fceb122b` | Lazy public wall-clock boundary returns epoch milliseconds; complete header/API checked |
| test/runtime/clock.test.ts | 1–43 | `76e54e0379e93a0827c99cf0de959a64edfa463a` | Exact independent epoch and advance; separate ordinary act/assert; context-owned time |
| src/runtime/monotonicClock.ts | 1–57 | `1a4a105d8f9efd86d8cfdf9c2e20f4b9c3538192` | Bigint division precedes Number; elapsed arbitrary epoch retained; full narrative/header checked |
| test/runtime/monotonicClock.test.ts | 1–49 | `33d3e5dd77ef752c2fbd1a1b77824871f7ea5331` | Exact truncation/advance and independent wall-correction observations; context cleanup |
| src/runtime/timers.ts | 1–53 | `7fb32bb219bc4f20cff82e13bec518afc591b38f` | Four lazy forwarding operations; justified native handle narrowing; complete header/API checked |
| test/runtime/timers.test.ts | 1–108 | `979addb2ddaad063e92781464dca8d16da376cb8` | Five complete cases, compiler shapes, AAA and cleanup checked; new CR-04-PORTS-008 below |

Manual review included imports/exports, documentation, naming, type assertions,
public behavior, expected-value independence, mocks, test isolation and all
non-toolchain rules. No generic helper, production test hook, suppressed
coverage or fabricated runtime wrapper exists. Public signatures, visibility,
mutability and persisted data contracts remain unchanged. No exact-symbol
contract-change/deletion trace is claimed or needed for these header/test
repairs.

Actual caller context included platform composition and its accessory-bound
persist closure, pumpRecords' changed-only persistence, monitoring-health's
separate elapsed/wall readings, controls' stored timeout handle and matching
injected cancellation, restored-control scheduling and the existing feature
timer adapter. The `unknown` handle remains appropriate: the binder records a
handle from its supplied timers object and cancels through that object. No
public narrowing or generic native-handle assumption is proposed. These caller
reads provide boundary context, not completed later subsystem reviews.

The monotonic narrative distinguishes the historical Linux probe from the
cited suspend consequence that was not observed. This review performs no host
suspend experiment and adds no cross-platform guarantee. S-04-01 is resolved
by the strict declaration owner; S-04-03/04 remain inapplicable to these method
ports for the original rule/source reasons. S-04-05's original monotonic cause
is fixed; its complete current timer review additionally found the separate
single-shot protection gap below.

### Original accepted causes independently confirmed fixed

| Stable ID | Current location | Independent disposition and actual repair commit |
| --- | --- | --- |
| CR-04-PORTS-001 | Store source/owner lines 1–9 | Fixed: approved full headers; `227c799cebde0e77be9a85c605348ad00add1a69` |
| CR-04-PORTS-002 | Store owner lines 11–19 | Fixed: compiler-only positives and meaningful negatives replace recorder self-tests; `ce3608815f4a9561a4807c209ae2144e7757d2cf` |
| CR-04-PORTS-003 | Clock source/owner lines 1–9 | Fixed: approved full headers; `fd53a74eca0be5f5aece5717f6403756460dcd9b` |
| CR-04-PORTS-004 | Clock owner lines 23–31 | Fixed: ordinary action and exact assertion have separate phases; `84f4ca8d82f72d435895e31fe49aa0e7d85531a7` |
| CR-04-PORTS-005 | Monotonic source/owner lines 1–9 | Fixed: approved headers preserve distinct time/suspend narrative; `8fb80f9e7c488a3c5bf0f392a54aec3ff64f45ff` |
| CR-04-PORTS-006 | Monotonic owner lines 23–49 | Fixed: 1_999_999n → 1, 2_000_000n → 2 plus separate fixed-elapsed/backward-wall case; `419cab0a8d14dfef16a127f0e02b6be591a3b6da` |
| CR-04-PORTS-007 | Timer source/owner lines 1–9 | Fixed: approved full headers; `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa` |

Actual Git history confirms all seven repair hashes are ancestors of the
reviewed HEAD. New timer assertion cause 008 is distinct from header cause 007;
it does not reopen or rename that fixed cause.

### New narrative finding

#### CR-04-PORTS-008 — BLOCKER: Timeout owner accepts repeated execution

**Requirement:** RUN-01. **First independent observation:** ROUND 1 reviewer
above, current revision. **File:**
`8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa:test/runtime/timers.test.ts:31-44`.
Related public promise:
`8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa:src/runtime/timers.ts:26-27`.

**Rule:** Unit writer central case discriminator and Assertions; unit reviewer
central question and Classifying findings: a plausible wrong implementation
that passes the owner is a test-reliability BLOCKER.

**Issue:** The timeout owner advances only to the first firing. It never
observes the same uncancelled timeout at a later deadline. A timeout callback
that re-arms itself with another timeout violates the documented single-shot
promise while passing all five cases. Early-execution and pre-first-run cancel
cases do not distinguish it. The interval cases exercise a separate method.
Current production correctly forwards to native setTimeout; this finding is
missing regression protection, not a discovered production bug.

**Native confirmation:** `round1-timeout-repeat-control` read freshly compiled
source and complete owner, constructed data-URL module copies in memory, and
changed only the source copy's timeout forwarding to:

```javascript
setTimeout: (handler, delayMs) => {
  function repeat() {
    handler();
    setTimeout(repeat, delayMs);
  }
  return setTimeout(repeat, delayMs);
},
```

The complete copied owner ran and reported 5 pass, 0 fail/cancel/skip/todo,
raw exit 0, at 2026-10-14T23:17:32.434531–23:17:32.561589Z. Its complete
stdout/stderr, exact argv/replacement and compiled-input SHA-256 are retained
in that native record. This uses repeated mocked setTimeout, not an unmocked
setInterval substitution. No repository or compiled file was modified; the
command also checked both compiled files remained byte-identical. This is a
read-only assertion counterexample, not intended RED, production bug history,
or a control mutation entering Git.

**Fix:** In this complete owner, advance a timeout through its first firing
and at least one later full delay without cancelling it, then independently
assert the whole callback log is still `['ran']`. Preserve separate AAA phases
and context-owned timers. A separate active case may state the single-shot
promise directly. Prove the strengthened assertion rejects the repeating
counterexample, keep exact restored-source evidence for any file-based
control, then rebuild and run this owner and isolated direct selector. Route
this bounded test-maintenance cause to 04-02-02; do not alter correct production.

**Disposition:** Accepted/open; no repair or fix commit exists. No genuine
D-04 production RED JSON is warranted by this test-maintenance finding.

### Fresh native checks and input provenance

All fresh records are under
`/private/tmp/guardian-04-ports-fix-native/round1-<label>.json`, with complete
byte-exact `.stdout` and `.stderr`. The previously read capture runner retains
exact argv/cwd, raw exitCode, UTC start/end, elapsed time, HEAD/branch, every
tracked/nonignored untracked path's bytes/SHA-256/Git blob, full binary dirty
diff and complete untracked bytes before and after each command. The 13
toolchain/owner/direct records compare exactly equal before/after: same HEAD,
only the pre-existing PORTS-report Markdown dirt, and no untracked files.
The in-memory control also leaves repository inputs unchanged. No prior
full-gate evidence is reused.

Observed tool identity in `round1-tools`: Node `v26.11.1`, npm `11.20.0`,
TypeScript `6.0.3`, ESLint `10.11.0`, Prettier `3.9.6`; Node binary, compiler,
ESLint/Prettier entrypoints, direct selector and capture-runner SHA-256 are
retained. The following UTC ranges are all on 2026-10-14; every row returned 0.

| Label | Exact command or parameterized argv | UTC start → end | Result |
| --- | --- | --- | --- |
| typecheck | `npm run typecheck` | 23:15:47.385357 → 23:15:49.981510 | Both strict projects; positives/negatives compile |
| lint | `node_modules/.bin/eslint --max-warnings=0` followed by all eight exact inventory paths in source/owner pair order | 23:15:50.285300 → 23:15:53.580468 | No cache; all eight files |
| format | `node_modules/.bin/prettier --check` followed by the same eight exact paths | 23:15:53.890547 → 23:15:54.115018 | All eight files |
| build | `npm run build:test` | 23:15:54.422018 → 23:15:57.263398 | Fresh compiled owners |
| owner-accessoryStore | `node --test --test-reporter=tap dist-test/test/runtime/accessoryStore.test.js` | 23:16:00.589899 → 23:16:00.823645 | Zero authored cases; one passing native file subtest |
| direct-accessoryStore | `npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts` | 23:16:01.143477 → 23:16:04.655362 | Declaration-only selector acceptance |
| owner-clock | `node --test --test-reporter=tap dist-test/test/runtime/clock.test.js` | 23:16:04.980372 → 23:16:05.222713 | 2 pass |
| direct-clock | `npm run test:coverage:direct -- src/runtime/clock.ts test/runtime/clock.test.ts` | 23:16:05.523309 → 23:16:08.990011 | Isolated full line/function/branch acceptance |
| owner-monotonicClock | `node --test --test-reporter=tap dist-test/test/runtime/monotonicClock.test.js` | 23:16:09.310294 → 23:16:09.552229 | 2 pass |
| direct-monotonicClock | `npm run test:coverage:direct -- src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts` | 23:16:09.879266 → 23:16:13.381235 | Isolated full line/function/branch acceptance |
| owner-timers | `node --test --test-reporter=tap dist-test/test/runtime/timers.test.js` | 23:16:13.694046 → 23:16:13.930692 | 5 pass; does not resolve cause 008 |
| direct-timers | `npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts` | 23:16:14.226470 → 23:16:17.589611 | Isolated full line/function/branch acceptance |

All owner trailers have zero fail/cancel/skip/todo. Direct selector code was
read: executable pairs require one exact source LCOV record and equal
LF/LH, FNF/FNH, BRF/BRH; declaration-only no-record acceptance is separate.
Thus executable direct acceptance is 100%; no declaration percentage or merged
LCOV denominator is invented. Each direct command rebuilt serially. No
selected check refreshes merged `coverage/direct.lcov`.

The existing cause-006 control was independently inspected, including full
native failure output and captured source/owner blobs. Both intended exact
assertions failed for the wrong billion divisor with `{ earlier: 0, later: 0 }`;
restoration matched source blob `1a4a105d8f9efd86d8cfdf9c2e20f4b9c3538192`,
followed by rebuilt GREEN and direct acceptance. The unchanged owner is blob
`33d3e5dd77ef752c2fbd1a1b77824871f7ea5331`. Its source HEAD
`8fb80f9e7c488a3c5bf0f392a54aec3ff64f45ff` and cause-006 test-only repair
are retained in actual history. That is a restored maintenance control on
correct production, not a genuine bug regression. No production defect was
confirmed in this full correction.

### Round accounting and D-03 evaluation before this append

| Set | Exact stable IDs | Count |
| --- | --- | ---: |
| Opening, independently awaiting confirmation | CR-04-PORTS-001, CR-04-PORTS-002, CR-04-PORTS-003, CR-04-PORTS-004, CR-04-PORTS-005, CR-04-PORTS-006, CR-04-PORTS-007 | 7 |
| Fixed | CR-04-PORTS-001, CR-04-PORTS-002, CR-04-PORTS-003, CR-04-PORTS-004, CR-04-PORTS-005, CR-04-PORTS-006, CR-04-PORTS-007 | 7 |
| Rejected accepted IDs | None | 0 |
| New | CR-04-PORTS-008 | 1 |
| Reopened | None | 0 |
| Closing open | CR-04-PORTS-008 | 1 |

`closing = 7 - 7 - 0 + 1 + 0 = 1`. Opening severity: 2 BLOCKER,
5 WARNING. Closing severity: 1 BLOCKER, 0 WARNING. Attempted-repair zero was
not used as an independent opening zero. No previously fixed ID reopened.

Before this record write, the reviewer evaluated D-03: open count reduced
7 → 1; reopened set is empty; correction round is 1, below 4. **No stop
trigger applies.** PORTS remains OPEN. Parent must evaluate this terminal
result before any repair/build/commit/dispatch; route cause 008 to its original
owning task and retain the continuous counter for another full eight-file
correction. No clean batch or explicit zero is claimed.

No code, helper, Git/index, shared record or SUMMARY was modified by this
reviewer. Only this correction section was appended. No installs, private
inputs, live vendor, hardware, cross-version or suspend experiment occurred.
The parent still owes the current full combined-wave `npm run check`; these
focused passes do not complete that gate or RUN-01, which remains Pending.
All command processes are terminal. Report/build/control resources are
released at the reviewer's terminal result; there is no retained background
process or mutation to restore.

Closeout provenance: `round1-final-provenance` returned 1 because its helper
incorrectly assumed every tracked path was a regular file. The capture
runner labels three directory symlinks under `.claude/skills/` as `missing`;
they are existing symlinks, not missing source inputs. The corrected read-only
`round1-final-provenance-retry` returned 0 at
2026-10-14T23:19:24.174268–23:19:24.409745Z. It compared all 682 other
tracked paths with the opening bytes, checked the three link targets against
their HEAD blobs, confirmed no untracked files and all seven repair ancestors,
and proved the original 58,615 report bytes remain an exact prefix. Only this
ROUND 1 section was appended. Both complete native attempts remain retained;
the failed helper is not a passing check or production defect. This explanatory
paragraph is the final report-only addition after that prefix comparison.

## CR-04-PORTS-008 repair — single-shot timeout observation

Fixer: `/root/phase4_ports_finish/ports_timeout_once_fix`, typed
gsd-code-fixer with fresh context. Read complete AGENTS, all five rulebooks,
owning 04-02 plan, context, research, patterns, protocol, preceding summary,
complete report and timer pair before editing. The parent evaluated ROUND 1
before dispatch: `7 - 7 - 0 + 1 + 0 = 1`, reduced 7 to 1, no reopened IDs,
round 1 below 4. No D-03 stop applies. The continuous correction counter
remains **1**; this repair is not an independent correction review.

The first existing case now states the single-shot promise, advances through
the first 1,000 ms and another full 1,000 ms without cancellation, then compares
the whole callback log with independent literal `['ran']`. Separate AAA phases,
context-owned timers, headers, ESM imports and every other case remain intact.
Read the modified section and complete unchanged production section again.
No signature, member, mutability, visibility, alias or consumer contract changes.
Actual platform composition and control scheduling/cancellation callers were
read; conditional contract-change/deletion impact probes are not applicable.

Final cause scope: `test/runtime/timers.test.ts` and this report (2 paths).
Temporary assertion control also touched `src/runtime/timers.ts`, restored
exactly; the full cause remains within five paths. No helper or adaptation was
created. Owner blob: `aa95042ff3b93edcfe8a59c5cc5781364fd4d9e7`.
Production blob remains `7fb32bb219bc4f20cff82e13bec518afc591b38f`.

### Separate assertion maintenance control

The plausible wrong implementation recursively re-arms `setTimeout` after
calling its handler, using the ROUND 1 counterexample. Compiler and lint cannot
establish single-shot scheduling. The temporary source control passed strict
typecheck and exact-file lint, then the complete freshly built native owner
failed only the intended strengthened assertion: expected `['ran']`, actual
`['ran', 'ran']`. Native TAP reports 4 pass, 1 fail, zero skip/cancel/todo,
raw exit 1, at 2026-10-14T23:21:43.996532–23:21:44.246525Z.

The first control lint returned 1 for a required blank line before `return`.
That unsuccessful attempt is retained; after adding the blank line, the retry
returned 0. The intended native assertion failure followed the successful
compile/lint/build, with no setup/import failure. Exact source bytes were
restored and independently compared with `git show 8177bec:src/runtime/timers.ts`
before rebuilding GREEN. No control mutation is staged or committed.
Production was already correct: no genuine D-04 RED JSON, evidence-only bug
commit or production repair is warranted. The canonical execute-mvp-tdd gate
was read; this test-maintenance cause adds no product behavior.

### Current native evidence and verification location

All checks ran in the existing authorized feature checkout, with persisted
phase 04/plan 04-02 `isolation: none`, not a temporary worktree. Source HEAD
through verification is `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa`.
Observed Node `v26.11.1`, npm `11.20.0`; no tool/runtime change or install.
The read-before-reuse runner `/private/tmp/guardian-04-ports-fix-capture.py`
retains complete argv/cwd, raw exit, UTC start/end/duration, full stdout and
separate stderr in `/private/tmp/guardian-04-ports-fix-native/cause008-*.json`.
Each record includes before/after HEAD/branch/Git directory, all tracked and
nonignored untracked blobs/SHA-256, binary dirty diff and full untracked bytes.
Exact streams also remain in matching `.stdout` and `.stderr` files.

| Capture label | Exact command / observation | Raw exit |
| --- | --- | ---: |
| cause008-initial | `node -e` tool/source-blob identity probe | 0 |
| cause008-guard | `node_modules/.bin/fallow guard src/runtime/timers.ts test/runtime/timers.test.ts --format json --quiet --explain` | 0 |
| cause008-control-typecheck | `npm run typecheck`; both strict projects accept recursive re-arm | 0 |
| cause008-control-lint | `node_modules/.bin/eslint --max-warnings=0 src/runtime/timers.ts test/runtime/timers.test.ts`; temporary control missing blank line | 1 |
| cause008-control-lint-retry | Same exact lint after control-only blank line | 0 |
| cause008-control-build | `npm run build:test` | 0 |
| cause008-control-owner | `node --test --test-reporter=tap dist-test/test/runtime/timers.test.js`; intended second-call assertion | 1 |
| cause008-control-restored | Captured `node -e` complete byte comparison with original Git source | 0 |
| cause008-build | `npm run build:test`; restored production | 0 |
| cause008-owner | `node --test --test-reporter=tap dist-test/test/runtime/timers.test.js`; 5 pass, zero fail/skip/cancel/todo | 0 |
| cause008-direct | `npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts`; isolated 100% lines/functions/branches | 0 |
| cause008-audit | `node_modules/.bin/fallow audit --base 6f475a0db1698847ed7a1c7238ccb461dfdb8bda --format json --quiet --explain`; kind audit, verdict pass | 0 |

Cause 008 is repaired pending independent full-batch confirmation. ROUND 1's
last independent open set remains `{CR-04-PORTS-008}` (1 BLOCKER); the parent
must obtain another full eight-file correction with the same counter before
claiming clean closure. All seven earlier fixed IDs remain untouched.
The parent still owes the combined-wave full `npm run check`; focused checks
do not complete RUN-01, which remains Pending. No SUMMARY/shared record,
package, live vendor, hardware or private input was changed or exercised.
Clean pre-step and actual commit evidence follow execution.

CR-04-PORTS-008 committed as
`f99a637908a693868793d1b19525ad979042ad37`, exactly the timer owner and
continuing PORTS report. The report commit includes the pre-existing ROUND 1
append and this cause's repair evidence; original report history is preserved.
`cause008-prestep` ran exact `SKIP=npm-check pre-commit run --files test/runtime/timers.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`,
exit 0, clean before staging. `cause008-commit` retains cwd/toplevel/feature
branch, starting HEAD, empty index and restored-production guards, exact named
staging and ordinary foreground commit, exit 0. Normal pre-commit
`npm run check:commit` and gitlint passed. No amend, hook bypass or failed
commit occurred.

`cause008-final-provenance` returned 0 at
2026-10-14T23:23:12.531595–23:23:12.704973Z. It verified the exact two
committed paths, both source/owner blobs above, no other changed paths against
the starting HEAD, the passing check:commit hook and a clean post-commit tree.
This final commit metadata is the only report dirt left for the parent's
record commit. No control remains. All processes have completed; the terminal
return releases writer/build/control/Git/report ownership. Independent full
correction and the parent combined gate remain pending with counter 1.

## Independent full PORTS correction — ROUND 2 and maintainer resolution

Reviewer: `/root/phase4_ports_finish/ports_full_correction_two`, typed
gsd-code-reviewer, fresh context. Reviewed revision:
`f99a637908a693868793d1b19525ad979042ad37`. The parent retained the terminal
review result and evaluated D-03 before any further action. The reviewer
completed all eight original full files and headers, with no helper or external
adaptation. This section records that completed result after the actual
maintainer resolution. The reviewer did not append this report after the stop.
Earlier counter-1 statements describe their historical handoffs. The current
continuous correction counter is **2**.

| Set | Exact stable IDs | Count |
| --- | --- | ---: |
| Opening | CR-04-PORTS-008 | 1 |
| Fixed | CR-04-PORTS-008 | 1 |
| Rejected accepted IDs | None | 0 |
| New | CR-04-PORTS-009 | 1 |
| Reopened | None | 0 |
| Closing open | CR-04-PORTS-009 | 1 |

Arithmetic: `1 - 1 - 0 + 1 + 0 = 1`. Opening and closing severities are each
1 BLOCKER, 0 WARNING. IDs 001–007 remain fixed. Cause 008 independently
distinguishes recursive timeout repetition after its repair. No fixed ID
reopened, and no accepted ID was rejected. Cause 009 identifies the distinct
first-deadline observation gap in the changed owner.

**D-03 STOP:** ROUND 2 did not reduce the open count (1 → 1). ALL work stopped
on the terminal result. The executor returned CHECKPOINT and released its
leases. The reviewer made no further repository action or report append.
No repair, build, commit or further review followed before maintainer resolution.
The actual human maintainer then selected option **1** with response `1`.
The parent conveyed that selection as authorization for the bounded cause-009
repair and a complete eight-file ROUND 3 review. This permits no counter reset,
retroactive waiver, successful seal, or override of a future stop condition.

### CR-04-PORTS-009 — BLOCKER: Timeout owner loses the first deadline

**Requirement:** RUN-01. **First independent observation:** ROUND 2 reviewer
named above. **Initial/current finding location:**
`f99a637908a693868793d1b19525ad979042ad37:test/runtime/timers.test.ts:31–44`.
The public promise remains
`f99a637908a693868793d1b19525ad979042ad37:src/runtime/timers.ts:26–27`.

**Rule:** Unit writer central case discriminator and Assertions; unit reviewer
central question and Classifying findings. A plausible wrong implementation
that passes the complete owner is a test-reliability BLOCKER.

**Issue:** The first case ticks 1,000 ms twice and asserts only after 2,000 ms.
It loses the state at the first deadline. Changing only the forwarding delay
to `delayMs * 2` violates the documented delay but passes all five cases.
Production currently uses the correct delay. This is assertion maintenance,
with no confirmed D-04 production defect.

**Native confirmation:** `round2-timeout-late-control` used read-only in-memory
copies of the freshly compiled source and complete owner. The source copy
changed only `setTimeout(handler, delayMs)` to
`setTimeout(handler, delayMs * 2)`. Raw exit 0, all five cases passed, zero
fail/cancel/skip/todo, at 2026-10-14T23:26:19.646331–23:26:19.880175Z.
Exact argv, input hashes, replacement, complete streams and unchanged-file
provenance remain in that native record. No repository control was committed.

ROUND 2 native evidence remains under
`/private/tmp/guardian-04-ports-fix-native/round2-*.json`, with exact `.stdout`
and `.stderr` streams. Records `typecheck`, `lint`, `format`, `build`, all four
`owner-<pair>` and all four `direct-<pair>` commands returned 0. Tool identity
and provenance are in `round2-tools-controls`. The thirteen native checks have
identical before/after path/blob/SHA-256 manifests, binary dirty diff and
untracked bytes. All eight repair commits were ancestors of reviewed HEAD.
Owners had zero authored store cases (one passing native file subtest), two
clock cases, two monotonic cases and five timer cases. Executable direct pairs
had isolated 100% line/function/branch acceptance; store acceptance remains
declaration-only. These passes did not resolve the deadline gap. Full eight-file
review was complete, with no helper/adaptation or production defect reported.

## CR-04-PORTS-009 repair — retain both deadline observations

Fixer: `/root/phase4_ports_finish/ports_timeout_deadlines_fix`, typed
gsd-code-fixer, fresh context under the maintainer's bounded continuation.
Read complete AGENTS, all five rulebooks, owning plan, context, research,
patterns, protocol, report, preceding summary and complete timer pair before
editing. The canonical execute-mvp-tdd gate excludes this test-only maintenance
of correct production from behavior-adding work. Configured skill injection
does not replace the complete books.

The first case now copies the complete callback log after 1,000 ms into
`atDeadline` and after another 1,000 ms into `afterAnotherDelay`. One whole
observation compares both with independent literal logs:
`{ atDeadline: ['ran'], afterAnotherDelay: ['ran'] }`. Context-owned timers,
separate AAA phases, headers, imports and the other four cases remain intact.
The modified section and complete source/owner were re-read after restoration.
Actual platform composition and control scheduling/cancellation callers were
read. No name, signature, member, alias, visibility or mutability changed, so
conditional two-project contract-change/deletion pretraces were not invoked.

Final cause paths: `test/runtime/timers.test.ts` and this report. Temporary
controls also touched the owned `src/runtime/timers.ts`, then restored its
exact bytes. This is three total touched paths, within the five-path budget.
No helper, source adaptation or new evidence JSON was created.

### Separate controls and exact restoration

Two named plausible wrong public behaviors discriminate the independent
observations. Strict compiler and lint cannot establish either timing promise:

| Control | Native intended assertion failure | Result |
| --- | --- | --- |
| First firing delayed to twice the supplied delay | Expected first-deadline `['ran']`, actual `[]`; second log remains `['ran']` | `cause009-late-owner`, raw exit 1, 4 pass/1 fail/0 cancel/skip/todo |
| Timeout recursively re-arms after calling its handler | First log remains `['ran']`; expected later `['ran']`, actual `['ran', 'ran']` | `cause009-repeat-owner`, raw exit 1, 4 pass/1 fail/0 cancel/skip/todo |

Both failures are `ERR_ASSERTION`/`AssertionError`/`deepStrictEqual` in the
named first case, after successful strict typecheck, exact-file no-cache lint
and fresh build. No import/setup/compile failure is counted. The late control
ran at 2026-10-15T00:32:58.897576–00:32:59.145392Z; recursive control ran
at 00:33:17.161574–00:33:17.409300Z. Complete untouched TAP and separate stderr
are retained. After EACH control, an independent complete byte comparison with
`git show f99a637908a693868793d1b19525ad979042ad37:src/runtime/timers.ts`
returned 0. Restored production blob is
`7fb32bb219bc4f20cff82e13bec518afc591b38f`. No control enters the index or Git.

### Native verification and location

All checks ran in the existing authorized feature checkout, not a temporary
worktree. The persisted dispatch sentinel remains phase 04, plan 04-02,
`isolation: none`. HEAD through focused verification is
`f99a637908a693868793d1b19525ad979042ad37`. The existing plan-head ledger
still records `8420c63b3dab421a1c002197c9e2bb15715097af`; it was read, never
overwritten. Observed Node `v26.11.1`, npm `11.20.0`.

The read-before-reuse capture runner retains exact argv/cwd, UTC start/end and
duration, raw exit, full stdout and separate stderr, before/after HEAD/branch,
all tracked/nonignored untracked path/blob/SHA-256 manifests, binary dirty diff
and complete untracked bytes. Records and exact streams use
`/private/tmp/guardian-04-ports-fix-native/cause009-<label>.json`, `.stdout`
and `.stderr`. No unsuccessful attempt was discarded.

| Label | Exact command / observation | Raw exit |
| --- | --- | ---: |
| initial | `node -e` guards HEAD/branch/index, original plan ledger and tool/blob identities | 0 |
| guard | `node_modules/.bin/fallow guard src/runtime/timers.ts test/runtime/timers.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md --format json --quiet --explain` | 0 |
| late-typecheck, repeat-typecheck | `npm run typecheck`; both strict projects accept each control | 0 each |
| late-lint, repeat-lint | `node_modules/.bin/eslint --max-warnings=0 src/runtime/timers.ts test/runtime/timers.test.ts` | 0 each |
| late-build, repeat-build | `npm run build:test` | 0 each |
| late-owner, repeat-owner | `node --test --test-reporter=tap dist-test/test/runtime/timers.test.js`; intended failures described above | 1 each |
| late-restored, repeat-restored | Complete independent byte comparison with original Git source | 0 each |
| build | `npm run build:test`; fresh restored production | 0 |
| owner | `node --test --test-reporter=tap dist-test/test/runtime/timers.test.js`; 5 pass, zero fail/cancel/skip/todo | 0 |
| direct | `npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts`; isolated 100% lines/functions/branches | 0 |
| audit | `node_modules/.bin/fallow audit --base 6f475a0db1698847ed7a1c7238ccb461dfdb8bda --format json --quiet --explain`; kind audit, verdict pass | 0 |

The rebuilt GREEN owner completed at 2026-10-15T00:33:31.119926Z and the direct
selector at 00:33:34.950108Z. Selected checks do not refresh merged
`coverage/direct.lcov`. No new compiled/merged denominator or full-gate result
is claimed. This repair awaits independent complete ROUND 3 confirmation.
The last independent open set remains `{CR-04-PORTS-009}`, 1 BLOCKER, and
the continuous correction counter remains **2**. No clean batch is claimed.
The parent owns the next full eight-file review and current combined-wave
`npm run check`. RUN-01 stays Pending. WINDOWS 46/47 remain OPEN/unwaived.
No shared state, SUMMARY, central findings, package, live vendor, hardware or
private input was changed. Clean pre-step and actual commit evidence follow.

CR-04-PORTS-009 committed as
`dd5ea2db8519a1dc8f6c15c847af41f58ceddf80`, exactly the timer owner and
continuing PORTS report. Owner blob is
`3c853aa1a41bad5fe7a1885547afa81e63a678a5`; production remains the restored
blob above. `cause009-prestep` ran exact
`SKIP=npm-check pre-commit run --files test/runtime/timers.test.ts .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`,
raw exit 0, clean on the first attempt BEFORE staging. `cause009-commit`
retains guarded cwd/toplevel/existing feature branch, starting HEAD, empty
index and exact restored-production checks, named staging and ordinary
foreground commit. Raw exit 0; normal pre-commit `npm run check:commit` and
gitlint passed. No hook bypass, amend, failed commit or history rewrite occurred.

`cause009-final-provenance` returned 0 at
2026-10-15T00:35:01.198261–00:35:01.392258Z. It independently checked the
exact two committed paths, source and owner blobs, byte-exact source
restoration, passing normal hook stream, clean post-commit tree and absence of
report-history deletions. This final metadata append is the only report dirt
left for the parent's separate execution-record commit. No source control
remains; all command processes are complete. Terminal return releases all
writer/build/control/Git/report resources. ROUND 3 and the combined-wave full
gate remain pending; the continuous counter is **2**.

## Independent full PORTS correction — ROUND 3

Reviewer: `/root/phase4_ports_finish/ports_full_correction_three`, typed
`gsd-code-reviewer`, fresh independent context. Reviewed source revision:
`dd5ea2db8519a1dc8f6c15c847af41f58ceddf80`, existing
`features/code-review-sweep` checkout. This appended section is authoritative
for the current PORTS verdict; earlier frontmatter and observations remain
historical. **Current status: clean. Open findings: 0 BLOCKER, 0 WARNING,
0 INFO. Continuous correction counter: 3.**

The actual ROUND 2 stop and the human's bounded option-1 resolution remain
recorded above. This review uses that authorization without resetting the
counter or waiving any future D-03 condition. Before this append, the reviewer
evaluated the complete result: opening 1, fixed 1, rejected 0, new 0, reopened 0,
closing 0. The open count reduced, no fix reopened, and round 3 is below 4.
**No new D-03 stop applies.** A fourth correction would still stop even clean.

### Complete scope, headers and manual review

The reviewer read complete AGENTS and all five owning books: Google style,
comments, unit writer, unit reviewer and local verification. Both complete
04-01/02 plans, context, research, patterns, protocol, preceding 04-01 summary
and the complete continuing report supplied context. Fresh Codex model
resolution returned no explicit model and effort `high`. The proper
`query agent-skills gsd-code-reviewer` listed comments/style/unit reviewer;
that subset did not replace the five books. An initial unsupported
`resolve-model --pick agent-skills` probe returned a field error and supplies
no resolution evidence.

Every line of every file below was reviewed, including complete headers,
imports, exports, public documentation, type contracts, all cases, mock
ownership, expected values and cleanup. All locations in this section are
qualified by the reviewed revision above. This was a full-file review.

| Exact path | Full lines read | Current Git blob | Manual judgment |
| --- | ---: | --- | --- |
| src/runtime/accessoryStore.ts | 1–36 | `a7ce446ff9d47ec6106d0a6f609bff1472b9677f` | Required callable persist, accessory ownership and documented cache-write boundary retained |
| test/runtime/accessoryStore.test.ts | 1–19 | `4da2a0ab4d8e106c115978e2c55be25a79cab07e` | Strict satisfies positives and described missing/non-callable negatives; zero authored runtime cases |
| src/runtime/clock.ts | 1–25 | `c6b98a6e2c6863ae0a567d38f1665e40fceb122b` | Lazy system boundary returns wall epoch milliseconds; injected consumer API remains exact |
| test/runtime/clock.test.ts | 1–43 | `76e54e0379e93a0827c99cf0de959a64edfa463a` | Independent exact epoch and advance assertions, separate AAA phases and context-owned Date |
| src/runtime/monotonicClock.ts | 1–57 | `1a4a105d8f9efd86d8cfdf9c2e20f4b9c3538192` | Bigint division precedes Number; arbitrary elapsed epoch stays separate from wall time |
| test/runtime/monotonicClock.test.ts | 1–49 | `33d3e5dd77ef752c2fbd1a1b77824871f7ea5331` | Independent exact truncation/advance and backward-wall observations; context restoration |
| src/runtime/timers.ts | 1–53 | `7fb32bb219bc4f20cff82e13bec518afc591b38f` | Four lazy scheduling/cancellation operations; documented handle narrowing remains justified |
| test/runtime/timers.test.ts | 1–111 | `3c853aa1a41bad5fe7a1885547afa81e63a678a5` | Five complete public-behavior cases; independent first/later deadline logs now retained |

All eight complete headers have MIT SPDX first, a separate original-work
copyright JSDoc, a separate purpose fileoverview JSDoc, and the prescribed
blank lines. LICENSE/NOTICE identify these as original MIT work. Owner headers
were inspected directly, independently of the source-only packaging gate.
No helper or external adaptation exists: actual source/test/feature changes
from initial review revision `6f475a0` to current HEAD are exactly these eight
paths. No new executable input or untracked file was present.

Manual checks covered every non-toolchain rule, including public documentation,
comment purpose, naming, imports, assertion justification, AAA structure,
independent whole observations, types, side-effect boundaries and isolation.
There is no production test hook, generic helper, suppression, fabricated
runtime wrapper, changed API, alias deletion, or inferred readonly change.

Actual caller reads included the platform's accessory-bound persist closure
and system-clock/timer composition, pumpRecords' changed-only persistence,
monitoringHealth's separate wall/elapsed readings, controls' pending timeout
and matching cancellation, restored-control scheduling, and the existing
feature timer adapter. A handle comes from the supplied timers object and is
cancelled through that object; the public `unknown` handle and native narrowing
need no API change. These reads establish port context, not later subsystem
review completion. No shared-signature change or deletion was proposed, so
conditional exact-symbol pre-edit traces were not invoked.

Wall epoch and arbitrary elapsed time remain distinct. The monotonic source
divides the bigint before conversion. Its narrative separates the historical
Linux probe from the cited suspend consequence that was not observed. This
review adds no host-suspend or cross-platform result. S-04-01 remains resolved;
S-04-03/04 retain their original rule/source rejections for these method ports;
S-04-05's accepted assertion causes are now fixed.

### Stable finding dispositions

| Stable ID | Current revision-qualified location | Independent disposition |
| --- | --- | --- |
| CR-04-PORTS-001 | Store source/owner lines 1–9 | Remains fixed: complete approved headers; repair `227c799` |
| CR-04-PORTS-002 | Store owner lines 11–19 | Remains fixed: meaningful declaration-only compiler contracts; repair `ce36088` |
| CR-04-PORTS-003 | Clock source/owner lines 1–9 | Remains fixed: complete approved headers; repair `fd53a74` |
| CR-04-PORTS-004 | Clock owner lines 23–31 | Remains fixed: separate action and exact assertion; repair `84f4ca8` |
| CR-04-PORTS-005 | Monotonic source/owner lines 1–9 | Remains fixed: approved headers and preserved elapsed narrative; repair `8fb80f9` |
| CR-04-PORTS-006 | Monotonic owner lines 23–49 | Remains fixed: exact independent readings and wall correction; repair `419cab0` |
| CR-04-PORTS-007 | Timer source/owner lines 1–9 | Remains fixed: complete approved headers; repair `8177bec` |
| CR-04-PORTS-008 | Timer owner lines 31–47 | Remains fixed: the uncancelled timeout is observed after a second full delay; repair `f99a637` |
| CR-04-PORTS-009 | Timer owner lines 31–47 | Fixed: copies at the first deadline and second deadline are independently compared; repair `dd5ea2d` |

The cause-009 owner snapshots `atDeadline` after 1,000 ms and
`afterAnotherDelay` after another 1,000 ms. Its whole expected observation is
`{ atDeadline: ['ran'], afterAnotherDelay: ['ran'] }`. Both arrays are copied,
so later mutation cannot erase the first observation. Expected logs are literal
and independent of the adapter. No fixed cause reopened, no accepted ID was
renamed or rejected, and no new narrative finding is confirmed.

### Fresh scoped native evidence

All commands ran in the authorized repository cwd. The read-before-reuse
capture runner is `/private/tmp/guardian-04-ports-fix-capture.py`. Complete
records and byte-exact separate streams are
`/private/tmp/guardian-04-ports-fix-native/round3-<label>.json`, `.stdout` and
`.stderr`. Each record retains exact argv/cwd, raw exitCode, actual UTC start,
end and duration, HEAD/branch/Git directory, full tracked/nonignored untracked
path/blob/SHA-256 manifest, binary dirty diff and complete untracked bytes.

Observed versions: Node `v26.11.1`, npm `11.20.0`, TypeScript `6.0.3`, ESLint
`10.11.0`, Prettier `3.9.6`. `round3-tools-controls` retains version commands,
Node/tool entrypoint/capture-runner/direct-selector SHA-256 identities and real
Git ancestry/changed-path results. All nine repair commits are ancestors of
current HEAD. No tool/runtime/package input changed.

All UTC ranges below are on 2026-10-15. Every row returned raw exit **0**.
Lint and format argv use the exact eight inventory paths in source/owner order.

| Label | Exact command / scope | UTC start → end | Result |
| --- | --- | --- | --- |
| typecheck | `npm run typecheck` | 00:36:38.001061 → 00:36:40.601690 | Both strict projects and compiler positives/negatives |
| lint | `node_modules/.bin/eslint --max-warnings=0` plus all eight exact paths | 00:36:40.859799 → 00:36:44.098597 | No-cache lint, all eight files |
| format | `node_modules/.bin/prettier --check` plus all eight exact paths | 00:36:44.350644 → 00:36:44.573628 | All eight files |
| build | `npm run build:test` | 00:36:44.833520 → 00:36:47.626102 | Fresh compiled owners |
| owner-accessoryStore | `node --test --test-reporter=tap dist-test/test/runtime/accessoryStore.test.js` | 00:36:57.234703 → 00:36:57.466828 | Zero authored cases; one passing native file subtest |
| direct-accessoryStore | `npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts` | 00:36:57.713234 → 00:37:01.202762 | Honest declaration-only acceptance |
| owner-clock | `node --test --test-reporter=tap dist-test/test/runtime/clock.test.js` | 00:37:01.455992 → 00:37:01.708781 | 2 passing cases |
| direct-clock | `npm run test:coverage:direct -- src/runtime/clock.ts test/runtime/clock.test.ts` | 00:37:01.968433 → 00:37:05.471654 | Isolated 100% lines/functions/branches |
| owner-monotonicClock | `node --test --test-reporter=tap dist-test/test/runtime/monotonicClock.test.js` | 00:37:05.733210 → 00:37:05.987277 | 2 passing cases |
| direct-monotonicClock | `npm run test:coverage:direct -- src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts` | 00:37:06.239648 → 00:37:09.788639 | Isolated 100% lines/functions/branches |
| owner-timers | `node --test --test-reporter=tap dist-test/test/runtime/timers.test.js` | 00:37:10.050020 → 00:37:10.294787 | 5 passing cases |
| direct-timers | `npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts` | 00:37:10.534774 → 00:37:14.025048 | Isolated 100% lines/functions/branches |

Each native owner reports zero failure, cancellation, skip and TODO. The direct
selector was inspected: executable pairs require one exact-source LCOV record
and equal LF/LH, FNF/FNH and BRF/BRH; declaration-only acceptance has its own
no-record path. No numeric store denominator is invented. Each direct command
rebuilt serially; selected checks do not refresh merged `coverage/direct.lcov`.
The twelve fresh check records plus `tools-controls` have identical complete
before/after provenance snapshots, independently asserted by
`round3-provenance` (exit 0, 00:38:02.664238–00:38:02.787286 UTC). Only the
pre-existing report Markdown was dirty; all untracked arrays were empty.

### Independently inspected assertion controls

Complete native cause-006, cause-008 and both cause-009 intended failures,
restoration commands and rebuilt GREEN records were inspected. Cause-006's
wrong billion divisor fails both exact monotonic assertions. Cause-008's
recursive timeout fails the later whole log. Cause-009's late-first-fire
control fails `atDeadline` with `[]`; its recursive timeout fails
`afterAnotherDelay` with `['ran', 'ran']`. Both cause-009 native owners report
raw exit 1, 4 pass/1 fail, zero skip/cancel/TODO, and the intended
`ERR_ASSERTION`/`deepStrictEqual`, after successful strict typecheck, no-cache
lint and fresh build. Both controlled owners have the exact current owner
blob `3c853aa1a41bad5fe7a1885547afa81e63a678a5`.

The separate byte comparisons after EACH cause-009 control returned 0 and
matched timer source blob `7fb32bb219bc4f20cff82e13bec518afc591b38f`.
The cause-006/cause-008 restoration records also match their current source
blobs. Rebuilt GREEN and isolated direct checks followed restoration. Actual
commit paths/ancestry confirm test/report repairs; no control mutation entered
Git. The earlier cause-008 lint failure and successful retry remain retained.
These are assertion-maintenance controls on correct production. No genuine
D-04 production bug, regression RED JSON or evidence-only bug commit is claimed.

An additional read-only in-memory early-interval counterexample changed only
the compiled source copy's interval delay to `delayMs / 2`. The complete owner
rejected it at the intended interval assertion: 4 pass/1 fail, raw exit 1,
`ERR_ASSERTION`, zero skip/cancel/TODO. Exact compiled-input hashes,
replacement, full native output and separate stderr are retained in
`round3-interval-early-control` at 00:37:41.061561–00:37:41.190585 UTC.
That exploratory run uses the native default reporter; the fresh owner checks
above use explicit TAP. It supplies no genuine RED claim or new finding.
Repository and compiled files remained byte-identical, and its complete
before/after provenance equals the fresh-check baseline.

### Continuous accounting and terminal handoff

| Set | Exact stable IDs | Count |
| --- | --- | ---: |
| Opening | CR-04-PORTS-009 | 1 |
| Fixed | CR-04-PORTS-009 | 1 |
| Rejected accepted IDs | None | 0 |
| New | None | 0 |
| Reopened | None | 0 |
| Closing open | None | 0 |

Arithmetic: `1 - 1 - 0 + 0 + 0 = 0`. Previously independently fixed IDs
001–008 remain fixed. ROUND 3 completes with **zero open findings** after full
eight-file review. D-03 was evaluated immediately before this report write:
the count reduced 1 → 0, no fixed finding reopened, and the counter is 3.
The actual prior stop/resolution remains historical evidence, not a waiver or
counter reset. Any future fourth correction still requires an immediate stop.

No source, owner, helper, Git/index, SUMMARY or shared record was changed by
this reviewer. The sole repository edit is this appended review section.
No install, private input, live vendor/hardware run, host suspend, cross-version
check, Cucumber or full `npm run check` was performed. The parent owns the
current full combined-wave gate and shared records. RUN-01 remains Pending;
WINDOWS 46/47 remain OPEN/unwaived. All command processes are terminal; no
mutation remains to restore. Report/build/control resources are released on
the reviewer's terminal return.
