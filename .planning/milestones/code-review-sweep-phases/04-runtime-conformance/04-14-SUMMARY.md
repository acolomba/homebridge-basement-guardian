---
phase: 04-runtime-conformance
plan: "14"
subsystem: testing
tags: [typescript, homebridge, strong-mock, comments, runtime]
status: complete
requires:
  - phase: 04-runtime-conformance
    plan: "13"
    provides: Replacement ownership repair, approved uncertain-registration policy, and poll-boundary assertions
provides:
  - Seven explicitly typed local callable bindings with unchanged behavior
  - Present-tense platform publication, privacy, persistence, and observation rationale
  - Strict typed discovery API mocks with preserved helper callers and public assertions
affects: [04-15, 04-17, 04-09, runtime-conformance]
tech-stack:
  added: []
  patterns:
    - Explicit callable binding annotations preserve local contracts
    - Finite case-local API expectations preserve complete public observations
key-files:
  created:
    - .planning/phases/04-runtime-conformance/04-14-SUMMARY.md
  modified:
    - test/runtime/accountRuntime.test.ts
    - test/accessories/reconciliation.test.ts
    - test/platform.test.ts
    - src/platform.ts
    - .planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md
key-decisions:
  - Preserve the existing fakeDiscoveryApi callable contract through a compatibility overload
  - Consolidate the existing nominal fake-HAP constructor conversion into one documented owner-local binding
  - Preserve the actual user-approved registration-uncertainty policy from plan 13
requirements-completed: []
requirements-addressed: [RUN-01]
actuals:
  tokens: 27879.75
  tasks: 3
  commits: 3
commits: 3
plan_head_before: cfd221ddcde1177e29dcb852d437d12bbf7fc478
plan_head_after: 1e54b11e480197aa38d5b8ae136c8a4cb82319d5
duration: 53min39s recorded code window
completed: 2026-10-16
---

# Phase 4 Plan 14: Callable, Comment, and Discovery API Conformance Summary

**Seven callable annotations, current platform rationale, and strict typed discovery API mocks preserve the existing runtime and registration contracts.**

## Performance and Scope

The persisted base checkpoint is dated 2026-10-16T01:17:43.152147+00:00.
The code terminal checkpoint is dated 2026-10-16T02:11:22.251939+00:00.
These bounds describe the recorded code window, not a reconstructed process start.
The parent full gate finished at 02:12:19.168539 UTC; this summary follows that gate.

Three fresh typed `gsd-code-fixer` invocations executed serially in the existing
`features/code-review-sweep` checkout. Each fresh model/execution resolution used
an omitted model and high effort. The documented `workflow.use_worktrees=false`
opt-out and persisted phase 04/plan 04-14 isolation `none` remained in force.
No new checkout, branch, package, helper file, production port, or compiler
configuration was introduced. Other agents share this checkout.

The three cause commits changed five unique repository paths: one source file,
three test owners, and the append-only ACCOUNT report. The production change is
comments only. No tracked file was deleted. This summary is separate metadata.
Cause budgets are 5/4/4 paths, including the already committed plan declaration.

The ledger directly retained `cfd221ddcde1177e29dcb852d437d12bbf7fc478` before the
first cause commit. `git rev-list --count` measures three commits through the
recorded terminal HEAD. The committed realized diff contains 111,519 characters;
`actuals.tokens` is exactly that count divided by four. It is an estimate on the
required diff scale, not harness token usage. It excludes this separate summary
and the parent's uncommitted WINDOWS update. Read-volume forecasts are separate:
034 ultimately read 55 complete files totaling 1,739,334 bytes, about 434,833.5
by bytes/4, exceeding its initial forecast because complete historical references
were included. No required read was omitted to meet a forecast or advisory.

## Accomplishments

- **032:** Annotated exactly seven local callable bindings across the ACCOUNT,
  reconciliation, and platform owners. Names, lexical scope, callable types,
  bodies, and emitted JavaScript remain unchanged. Both compiler projects have
  no diagnostics; production excludes these test bindings. The test-project
  checker comparison supplies their actual callable-type evidence.
- **033:** Replaced targeted planning-history and removed-implementation
  narration with present publication, privacy, persistence, and observation
  rationale. Source and whole-owner executable tokens and comment-free compiler
  emits are identical. The scoped local identifier permission retains its
  unconfirmed opaque-key premise and sanitized-artifact requirement.
- **034:** Removed the broad API assertion that concealed a partial discovery
  double. The existing helper returns `mock<API>` with finite case-local
  expectations and explicit verification. All 44 existing helper calls and 80
  original assertions remain. Production and its public API shape are unchanged.

The compatibility overload preserves `fakeDiscoveryApi`'s existing name and
external callable contract. Its parameterless implementation needs no dummy
runtime parameter uses. The installed checker displays optional `undefined`
differently from the former default-initialized declaration; the evidence retains
both raw signatures and proves bidirectional assignability in the same program.
It does not claim textual signature identity. Positive and negative compiler
controls check the strict API boundary.

The three existing `HarnessPlatformAccessory` constructor conversions now use
one documented owner-local typed binding with the same conversion target.
This retains the existing nominal fake-HAP limitation; it does not establish
structural equivalence with real HAP. No other API member uses a broad assertion
to conceal missing properties or methods. Actual callers and postcreation uses
are recorded in the cause evidence.

## Task Commits

| Task | Cause | Commit | Title |
| --- | --- | --- | --- |
| 04-14-01 | CR-04-ACCOUNT-032 | `9b331673cf6c49981965e0e5a5edc9cd5f5b990d` | `test: type local callable bindings` |
| 04-14-02 | CR-04-ACCOUNT-033 | `bf1a7f98e9ccac6ea5b196d530fdcfa20471119d` | `docs: clarify platform publication and observation rationale` |
| 04-14-03 | CR-04-ACCOUNT-034 | `1e54b11e480197aa38d5b8ae136c8a4cb82319d5` | `test: validate discovery API mocks against Homebridge` |

Each cause passed its recorded-base Fallow audit, clean exact-file
`SKIP=npm-check pre-commit run --files` before individual staging, and ordinary
foreground commit with SKIP absent. Actual `check:commit`, gitlint, and TruffleHog
hooks completed. The parent owns the separate metadata audit, pre-step, and commit.

## Preserved Contracts and History

The actual human choice recorded in plan 13 supersedes the old 031 retry prose.
Every registration throw has uncertain acceptance and suspends further attempts
for that platform run. The stable accessory-map-keyed ledger survives context
reassembly, removal, store removal, and reappearance. Normal registration return
earns local accessory, instance, and listener ownership. Restored ownership from
`configureAccessory` remains authoritative. Healthy-device behavior and pre-call
preparation retry remain intact. Restart supplies no acceptance oracle or
guarantee that a possibly accepted bridge accessory is absent.

The required fixed actionable restart diagnostic still passes through the real
redacting logger. Its assertions remain active for later 035 work. Existing 026
cached-identity, stale-value preservation, seed-before-registration, persistence,
and cleanup assertions remain. No source mutation control, genuine production
RED, new product policy, live vendor request, or hardware result was introduced.

Both entire RED JSON files remain immutable: ACCOUNT blob
`b882b1502f0c1fe9ffe3ebd3c5af2f9ace68c134` contains 16 records; PLATFORM blob
`321b61af80c611fda8d825dd613a2537b16303e1` contains seven. Both installed
actual-file CLI checks and the SAME installed recursive `classifyRedEvidence`
accept all 23 records. Actual Git `sourceCommit:path` identities resolve to the
recorded source blobs. Older owner versions retain their original provenance.
All native histories, patches, assertions, and historical limits remain intact.
The complete 508,778-byte report at the plan base remains an exact prefix.

## Deviations and Retained Attempts

No extra implementation cause or production repair was added. The compatibility
overload and consolidated constructor boundary follow the parent's bounded
interpretation of 034; they grant no broader trace or nominal-type exception.

The following process and capture gaps remain open in parent-recorded WINDOWS
entry 55. Corrected checks supply current evidence, without reconstructing the
missing historical captures or serial ordering:

- **032:** A display-only audit extraction had a syntax error. Its original UTC
  and separate native streams are unavailable; the tool transcript is retained.
- **033:** A preservation capture waited in an owned Git hash child. The attempt
  ran from 01:42:47.662251 to 01:45:46.342230 UTC, about 178.68 seconds. The owned
  child received SIGTERM and the retained command ended with raw exit 1. A
  read-only audit overlapped it at 01:43:16.944439–01:43:17.750457 UTC. No
  repository, build, or index mutation occurred during that overlap. Corrected
  file-based hashing, preservation, and audit subsequently ran serially.
- **034:** A direct read-only `sed`/Prettier check exited 1 for formatting. Its
  command, output, and exit remain in the transcript, with no separate native
  UTC/envelope. The following captured guard retained the same owner bytes
  before captured formatting and fresh successful checks.

Initial capture helpers also omitted three tracked directory symlinks. Those
attempts remain disclosed; corrected complete manifests and literal link-target
proofs support the final checked inputs. Earlier preparation and failed proof
attempts remain in their owning native directories. No failure is relabeled as
production RED. WINDOWS 46–55 remain OPEN and unwaived.

## Native Evidence

Each cause directory retains its complete read ranges and input identities,
commands, raw exits, actual UTC bounds, Node/npm versions, patches, compiled
inputs, separate native streams, and the limitations stated above:

| Cause | Native directory and terminal checkpoint |
| --- | --- |
| 032 | `/private/tmp/guardian032-900dzf_2/committed-checkpoint.json` |
| 033 | `/private/tmp/guardian033-dqmmik8l/committed-checkpoint.json` |
| 034 | `/private/tmp/guardian034-e1pwotud/committed-checkpoint.json` |
| Controller | `/private/tmp/guardian-04-14-closeout/code-terminal-checkpoint.json` |
| Parent full gate | `/private/tmp/guardian-phase4-plan14-full-gate.json`, separate `.stdout` and `.stderr` |
| Parent WINDOW 55 | `/private/tmp/guardian-04-14-parent-window-append.json` |

The summary path was absent before creation. Canonical-root containment and
the exact installed Fallow guard completed before the first write, raw exit 0,
at 02:13:33.855080–02:13:34.018641 UTC. Metadata captures reside under
`/private/tmp/guardian-04-14-closeout/metadata/`.

## Threat Flags

T-04-24's test-double boundary mitigation has passing strict compiler controls,
finite interaction checks, preserved public state, and direct owner evidence.
The explicit nominal fake-HAP constructor boundary remains a limitation.
T-04-SC introduces no install. Inherited identity, reported-authority, privacy,
registration-uncertainty, and lifecycle boundaries remain unchanged. No new
security-relevant production surface was introduced. These bounded results do
not certify security or resolve the pending phase-level safety and completion
judgments. Historical process gaps remain open.

## Check Results

All checks below used Node v26.11.1 and npm 11.20.0. Native records retain their
full actual argv, UTC, input identities, streams, and raw exits.

| Check | Actual result |
| --- | --- |
| 032 fresh `npm run build:test` and all three compiled owners | Exit 0; 257 pass: ACCOUNT 169, reconciliation 14, platform 74; no skipped or cancelled cases |
| 032 isolated direct selectors and native exact-source coverage | Exit 0; ACCOUNT 1007/1007 lines, 58/58 functions, 195/195 branches; reconciliation 53/53, 6/6, 12/12; platform 511/511, 22/22, 63/63 |
| 033 fresh build and compiled platform owner | Exit 0; 74 pass, no skipped or cancelled cases; identical executable tokens and comment-free source/owner emits |
| 033 isolated direct selector and native exact-source coverage | Exit 0; platform 508/508 lines, 22/22 functions, 63/63 branches |
| 034 fresh build and compiled platform owner | Exit 0; 74 pass, no skipped or cancelled cases; preserved 44 calls and 80 original assertions |
| 034 isolated direct selector and native exact-source coverage | Exit 0; platform 508/508 lines, 22/22 functions, 63/63 branches |
| Compiler projects, uncached lint, typed-boundary and preservation proofs | Final raw exits 0; earlier attempts retained as described above |
| Installed RED CLI checks and recursive classifier/Git provenance | Final raw exits 0; all 16 ACCOUNT plus seven PLATFORM records accepted; JSON bytes unchanged |
| Each cause's final audit, clean pre-step, and normal commit hooks | Final raw exits 0; actual audit verdict pass; capture/order limits remain open |
| Parent `npm run check` at `1e54b11e480197aa38d5b8ae136c8a4cb82319d5` | Exit 0, 02:11:43.317345–02:12:19.168539 UTC; six static checks, 104 Cucumber scenarios, 1156 steps, and 43 isolated pairs |

Selected native LCOV denominators describe their compiled inputs; they do not
replace historical denominators or the merged all-pair source-mapped LCOV.
The parent full gate produced the current 43-pair merged artifact. Its inputs
remain unchanged: the post-gate comparator excluding planning Markdown is
empty, with no new untracked executable. The parent's dirty WINDOWS entry and
this summary are planning Markdown only. Hook results do not substitute for
that separate full gate.

## Readiness and Remaining Ownership

032, 033, and 034 are implemented pending the single whole ACCOUNT correction 2
in plan 17. This summary supplies no independent review or clean finding
verdict. Counter 1 remains 44 accepted, 29 independently closed, and 15 open
IDs 030–044. No finding is reopened, rejected, or independently closed here.
The actual correction-1 D-03 predicates remain false; any later non-progress,
reopening, or round-four result must stop all work immediately.

RUN-01 remains Pending. No STATE, state JSON, ROADMAP, REQUIREMENTS, FINDINGS,
configuration, or WINDOWS change belongs to this metadata executor. The parent
owns shared records, the metadata commit, remaining plans, the later whole
review, and final workflow-setting restoration. No external setup is required.

## Self-Check

PASSED: the three actual cause commits exist in HEAD ancestry; their exact five
changed paths contain no tracked-file deletion. The recorded ledger base and
terminal HEAD measure three commits. The summary is the sole executor-created
metadata path, with canonical containment and exact-path guard before creation.
The complete original report prefix and immutable RED files remain preserved.
The parent full gate passed on the current executable inputs. This result
leaves independent correction, RUN-01, and all open process limits pending.
