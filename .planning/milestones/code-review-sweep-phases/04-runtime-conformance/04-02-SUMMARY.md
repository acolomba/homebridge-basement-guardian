---
phase: 04-runtime-conformance
plan: "02"
subsystem: runtime
tags: [typescript, monotonic-clock, timers, conformance]
status: complete
requires:
  - phase: 04-01
    provides: Initial full PORTS review and four repaired store/wall-clock causes
provides:
  - Exact independent monotonic millisecond observations
  - Timeout observations at both the first and later deadlines
  - Independent full eight-file PORTS closure at correction round 3
affects: [runtime-conformance, 04-03, 04-10]
tech-stack:
  added: []
  patterns: [context-owned time, independent deadline snapshots, restored assertion controls]
key-files:
  created:
    - .planning/phases/04-runtime-conformance/04-02-SUMMARY.md
  modified:
    - src/runtime/monotonicClock.ts
    - test/runtime/monotonicClock.test.ts
    - src/runtime/timers.ts
    - test/runtime/timers.test.ts
    - .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md
key-decisions:
  - Preserve every production operation and public port contract beneath the approved headers
  - Retain separate first-deadline and later-deadline callback logs
  - Preserve the round-2 stop and actual maintainer option-1 resolution without resetting the counter
requirements-completed: [RUN-01]
actuals:
  tokens: 17325
  tasks: 2
  commits: 5
plan_head_before: 8420c63b3dab421a1c002197c9e2bb15715097af
plan_head_after: dd5ea2db8519a1dc8f6c15c847af41f58ceddf80
coverage:
  - id: D1
    description: Public monotonic adapter truncates nanoseconds and advances in exact milliseconds independently of wall time
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/monotonicClock.test.ts#truncates nanoseconds to whole milliseconds and advances at the boundary
        status: pass
      - kind: unit
        ref: test/runtime/monotonicClock.test.ts#keeps elapsed readings independent of wall-clock corrections
        status: pass
    human_judgment: false
  - id: D2
    description: Public timers retain exact first-fire, single-shot, repeat and cancellation observations
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/timers.test.ts#runs a scheduled handler only once after its delay elapses
        status: pass
      - kind: unit
        ref: npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: All eight PORTS files and complete headers receive independent full correction review
    requirement: RUN-01
    verification:
      - kind: other
        ref: .planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md#independent-full-ports-correction-round-3
        status: pass
    human_judgment: false
duration: 90min elapsed including maintainer pause
started: 2026-10-14T23:10:09Z
completed: 2026-10-15
---

# Phase 4 Plan 2: Monotonic Clock and Timer Conformance Summary

**Exact monotonic readings and independent timeout deadline logs preserve correct production behavior. The full PORTS review closes at round three.**

Actual modified source: `src/runtime/monotonicClock.ts`.
Actual continuing review record: `.planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md`.

## Accomplishments

- The monotonic owner compares exact readings at 1_999_999n and 2_000_000n with independent millisecond expectations.
- The timer owner preserves callback logs at the first deadline and after another full delay.
- A fresh reviewer inspected all eight complete PORTS files and headers, with zero open findings at correction round three.

Both source files retain their complete original public documentation, API and implementation beneath the new approved headers.
No helper, external adaptation, package or new production behavior was necessary.
The arbitrary elapsed epoch remains separate from wall time.
The source retains the distinction between the historical Linux probe and its cited, unobserved suspend consequence.

`requirements-completed` records this plan's contribution to RUN-01.
RUN-01 remains Pending until the remaining declaring plans and independent phase verification finish.
The parent owns shared-state advancement and the current combined-wave full gate.

## Task Commits

| Owning task | Stable cause | Actual commit | Exact paths |
| --- | --- | --- | --- |
| 04-02-01 | CR-04-PORTS-005, monotonic headers | `8fb80f9e7c488a3c5bf0f392a54aec3ff64f45ff` | Monotonic source, owner and PORTS report |
| 04-02-01 | CR-04-PORTS-006, exact readings | `419cab0a8d14dfef16a127f0e02b6be591a3b6da` | Monotonic owner and PORTS report |
| 04-02-02 | CR-04-PORTS-007, timer headers | `8177bec3c1abca9d8ac10e8135d59e6cbf9ddafa` | Timer source, owner and PORTS report |
| 04-02-02 | CR-04-PORTS-008, single-shot observation | `f99a637908a693868793d1b19525ad979042ad37` | Timer owner and PORTS report |
| 04-02-02 | CR-04-PORTS-009, both deadlines | `dd5ea2db8519a1dc8f6c15c847af41f58ceddf80` | Timer owner and PORTS report |

The persisted Git ledger `gsd-plan-head-before-04-02` records the full baseline in frontmatter.
The native `executor02-measure` command measured five commits from that baseline through `plan_head_after`.
Actual tokens use 69,298 realized diff characters divided by four, rounded upward, before this execution-only summary.
The separate execution-record commit does not enter that measured cause count.
No tracked file was deleted.
Each cause remained within five touched paths, including its report and temporary restored control.

## Independent Reviews and Continuous Counter

Every fixer and reviewer used a fresh typed context and read complete AGENTS plus all five rulebooks.
The executor resolved each role's model and effort immediately before dispatch, then queried its configured skills.
Every model result was empty, so the explicit model was omitted.
Every effort result was high.
Configured skill subsets did not replace the complete books.
The executor waited for each terminal result before another repository action.

| Role | Agent identity |
| --- | --- |
| Fixer, 005–007 | /root/phase4_ports_finish/ports_monotonic_timer_fixes |
| Reviewer, full round 1 | /root/phase4_ports_finish/ports_full_correction |
| Fixer, 008 | /root/phase4_ports_finish/ports_timeout_once_fix |
| Reviewer, full round 2 | /root/phase4_ports_finish/ports_full_correction_two |
| Fixer, 009 after actual resolution | /root/phase4_ports_finish/ports_timeout_deadlines_fix |
| Reviewer, full round 3 | /root/phase4_ports_finish/ports_full_correction_three |

| Full correction | Opening | Fixed | Rejected | New | Reopened | Closing | Actual result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1, at 8177bec | 001–007 (7) | 001–007 (7) | None (0) | 008 (1) | None (0) | 008 (1) | 7 − 7 − 0 + 1 + 0 = 1, reducing |
| 2, at f99a637 | 008 (1) | 008 (1) | None (0) | 009 (1) | None (0) | 009 (1) | 1 − 1 − 0 + 1 + 0 = 1, D-03 stop |
| 3, at dd5ea2d | 009 (1) | 009 (1) | None (0) | None (0) | None (0) | None (0) | 1 − 1 − 0 + 0 + 0 = 0, clean |

All IDs use the CR-04-PORTS prefix.
Round two found that the single-shot repair lost the first-deadline observation.
Its reviewer stopped before a report append or further repository action.
The executor returned a blocking checkpoint and released all resources.
The maintainer then selected option 1 with the actual response `1`.
That decision authorized only the bounded 009 repair and another full review.
The report preserves the stop, the native evidence and that actual resolution.
No retroactive waiver or counter reset occurred.

Round three reviewed all eight complete original source/owner files and actual callers at dd5ea2d.
No helper or adaptation exists.
IDs 001–008 remain independently fixed, and 009 is fixed.
The reviewer evaluated D-03 before writing: the open count reduced to zero, no fixed ID reopened, and the counter is three.
A future fourth correction still stops even when clean.

## Check Results

Observed toolchain: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3, ESLint 10.11.0 and Prettier 3.9.6.
All checks ran in the authorized feature checkout.
The native capture runner retains exact argv, cwd, UTC times, raw exit, complete stdout and separate stderr.
Each record also retains HEAD, branch, path/blob/SHA-256 manifests, binary dirty diff and complete nonignored untracked bytes.
Directory symlinks retain their documented capture limitation and separate link-target checks.

| Scope | Native evidence and commands | Actual result |
| --- | --- | --- |
| Every repaired pair | Fresh build:test, exact compiled native TAP owner, isolated direct selector | All restored-production runs exit 0 |
| Monotonic tracer before timer expansion | monotonic-tracer-after-build/owner/direct at 419cab0 | All exit 0, two owner cases and isolated 100% acceptance |
| Current full correction | round3-typecheck, lint, format, build at dd5ea2d | All exit 0, both compiler projects and exact eight files |
| Current store owner/direct | round3-owner-accessoryStore and direct-accessoryStore | Exit 0, zero authored runtime cases and one native passing file subtest, honest declaration-only selector acceptance |
| Current clock owner/direct | round3-owner-clock and direct-clock | Exit 0, two cases, isolated 100% lines/functions/branches |
| Current monotonic owner/direct | round3-owner-monotonicClock and direct-monotonicClock | Exit 0, two cases, isolated 100% lines/functions/branches |
| Current timer owner/direct | round3-owner-timers and direct-timers | Exit 0, five cases, isolated 100% lines/functions/branches |
| Every cause commit | Recorded-base Fallow audit, exact clean pre-step before staging, ordinary foreground commit hooks | Five passing audits, clean pre-steps and normal check:commit/gitlint streams |
| Current input provenance | round3-provenance and round3-final-provenance | Exit 0, original report prefix retained, other tracked inputs unchanged, no untracked files |
| Executor source/history check | executor02-measure | Exit 0, source contracts unchanged, five real ancestor commits and measured baseline/count |

The exact native owner command is `node --test --test-reporter=tap dist-test/test/runtime/<owner>.test.js`.
The direct command is `npm run test:coverage:direct -- src/runtime/<owner>.ts test/runtime/<owner>.test.ts`.
Every direct command rebuilt serially and selected one pair alone.
The selector requires equal native covered/total line, function and branch values for each executable source.
No numeric declaration denominator is invented.
Selected checks do not refresh merged coverage/direct.lcov.
The complete report maps exact labels, times, commands, scope and source/owner blobs.

Native records remain under /private/tmp/guardian-04-ports-fix-native/, with matching JSON, stdout and stderr files.
Current reviewer labels use round3-* and ran on 2026-10-15 from 00:36:38 through the final provenance check.
Cause labels use cause005-*, cause006-*, cause007-*, cause008-* and cause009-*.
Prior rounds remain round1-* and round2-*.
No prior full-gate evidence covers these edits.
The parent still owes the current wave-two full npm run check, Cucumber and all-pair merged coverage.

## Separate Assertion Controls

| Maintenance cause | Plausible wrong implementation | Intended native failure | Exact restoration and rebuilt result |
| --- | --- | --- | --- |
| 006 | Billion divisor returns whole seconds | Two exact observations receive zero readings, native exit 1 | Source blob 1a4a105d8f9efd86d8cfdf9c2e20f4b9c3538192, byte comparison exit 0, owner/direct GREEN |
| 008 | Timeout recursively rearms | Expected one callback, received two, native 4 pass/1 fail | Source blob 7fb32bb219bc4f20cff82e13bec518afc591b38f, byte comparison exit 0, owner/direct GREEN |
| 009, late | First fire uses twice the requested delay | Expected first log ['ran'], received [], native 4 pass/1 fail | Exact source comparison after this control, exit 0 |
| 009, repeat | Timeout recursively rearms | Expected later log ['ran'], received ['ran', 'ran'], native 4 pass/1 fail | Exact source comparison after this control, exit 0, rebuilt owner/direct GREEN |

Both 009 controls passed strict typecheck and exact-file lint before the fresh owner executed its intended assertion.
Both native failures report ERR_ASSERTION and deepStrictEqual, with no skipped or cancelled target.
The final owner preserves copied callback logs at both deadlines.
Round three independently inspected all failure/restoration/GREEN records and actual Git ancestry.
No control mutation entered Git.
No genuine production bug was found, so no conditional D-04 RED JSON or evidence-only bug commit was created.

## Deviations from Plan

The full reviews found two additional timer test-reliability causes, 008 and 009.
Both remained in their original owning task and the continuous PORTS batch.
The actual D-03 stop required the maintainer decision described in the review history.
No source scope or product contract expanded.

The cause-005 sandbox audit first returned 2 because it could not create its temporary base worktree.
The retained authorized retry returned 0 with verdict pass.
Cause-008's temporary control first failed lint for a missing blank line.
Its retained lint retry passed before the intended native assertion failed.
Round one's first provenance helper failed because it treated directory symlinks as regular files.
Its corrected read-only retry checked the link targets and returned 0.
Two initial unavailable-python probes returned 127 before work, and a reviewer field probe returned an unsupported-field error.
These attempts supply no passing evidence.
Earlier native streams and warnings remain intact.

AGENTS and the owning protocol require the existing features/code-review-sweep checkout and Conventional titles without phase or milestone text.
The executor preserved that branch and used ordinary foreground commits with normal hooks.
The parent retains ownership of shared STATE, ROADMAP, REQUIREMENTS, FINDINGS, VALIDATION, seal records and WINDOWS.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

T-04-03 retains integer elapsed milliseconds, bigint division and separate clock domains.
T-04-04 retains the public timer operations and independently observed scheduling/cancellation behavior.
T-04-SC retains the no-install boundary.
No endpoint, auth path, file-access path or trust-boundary schema was added.
No source/owner stub, skipped case or unrun executor verification remains.

## Remaining Gates and Limits

The parent owns the current full combined-wave gate and all shared-state advancement.
Focused success does not establish the full gate, later subsystem conformance, cross-version compatibility, live vendor behavior, hardware behavior or host-suspend behavior.
WINDOWS 46/47 remain OPEN and unwaived.
The earlier missing hook captures and unconfirmed historical counts remain historical limits.
The plan is ready for the parent's full wave-two gate with PORTS independently clean at counter three.

## Self-Check: PASSED

The native executor02-selfcheck returned 0.
It checked this summary, the continuing report and all four source/owner paths.
All five cause commits are ancestors of HEAD, and the persisted baseline/count agree.
Code and configuration match the independently reviewed dd5ea2d inputs exactly.
No source/owner stub or untracked executable input remains.
The parent retains the combined-wave full gate and shared records.
