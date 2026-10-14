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
