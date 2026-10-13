---
phase: "01"
slug: "known-findings-and-loop-proof"
status: complete
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-13"
---

# Phase 1 — Validation Record

Execution evidence audited 2026-10-13 on Node v26.11.1. Combined source
revision: `218ab0cac702c5699ced277aaf499fe5f5194d54`. This record signs the
executed checks. Independent phase verification and the four judgment flags
below remain pending; hardware and live vendor behavior are outside this scope.

## Test Infrastructure

| Property | Value |
| --- | --- |
| Framework | Node built-in test runner; TypeScript 6.0.3 |
| Config | `tsconfig.test.json`, `package.json` |
| Compile | `npm run build:test` |
| Quick run | `node --test dist-test/test/cloud/auth.test.js dist-test/test/accessories/controls.test.js dist-test/test/device/state.test.js dist-test/test/packaging/licenseHeaders.test.js` |
| Full gate | `npm run check` |
| Timeout | 2,400 seconds for full gate; this is a limit, not evidence of success |

## Sampling Rate

Run compilation and the owning test after edits. Before each code commit, run the isolated pair coverage and required pre-commit checks; verify the commit hook result. Run the full gate after each combined wave and before phase verification. Reuse evidence only for unchanged inputs under `skills/local-verification/SKILL.md`.

## Per-Task Verification Map

The final plan set has four two-task plans. Wave 1 contains the three disjoint
code batches; Wave 2 audits their ledger and combined gate. The coordinator
serializes shared-checkout compilation, mutations, and Git operations under
`01-REVIEW-PROTOCOL.md`.

| Task ID | Requirements | Automated Command | Threat Ref | Failure signal | Status |
| --- | --- | --- | --- | --- | --- |
| 01-01-01 | SPOT-04, PROC-03 | `npm run build:test && node --test dist-test/test/cloud/auth.test.js` | T-01-02, T-01-03, T-01-04 | Nonzero; joined-caller target must first fail intentionally, then pass | Pass: genuine RED exit 1, classifier OK; GREEN and headers |
| 01-01-02 | SPOT-01, SPOT-04 | `npm run test:coverage:direct -- src/cloud/auth.ts test/cloud/auth.test.ts` | T-01-01, T-01-02, T-01-03, T-01-04 | Nonzero or any direct metric below 100%; collision mutation must fail | Pass: restored isolated 100%; collision mutation exit 1 |
| 01-02-01 | SPOT-02, PROC-03 | `npm run build:test && node --test dist-test/test/accessories/controls.test.js` | T-01-05, T-01-06 | Nonzero on clean tree; same-status wrong-cause mutation must fail named case | Pass: restored tracer 57/57; intended mutation exit 1; header |
| 01-02-02 | SPOT-02 | `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | T-01-05, T-01-06 | Nonzero or any direct metric below 100% | Pass: isolated 100%; final owner 63/63 |
| 01-03-01 | SPOT-03, PROC-03 | `npm run build:test && node --test dist-test/test/device/state.test.js` | T-01-07 | Nonzero on clean tree; missing snapshot and stale-store mutation must fail | Pass: intended mutations exit 1; restored owner 54/54; header |
| 01-03-02 | SPOT-03 | `npm run test:coverage:direct -- src/device/state.ts test/device/state.test.ts` | T-01-07 | Nonzero or any direct metric below 100%; missing nested/released value must fail | Pass: six restored negative controls; isolated 100% |
| 01-04-01 | PROC-01, PROC-02 | `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/01-known-findings-and-loop-proof/01-AUTH-RED-EVIDENCE.json --raw && git diff --check HEAD^ HEAD -- .planning/phases/01-known-findings-and-loop-proof/01-FINDINGS.md` | T-01-08, T-01-09, T-01-10 | Nonzero or missing RED_EVIDENCE_OK; invalid provenance fails artifact audit | Pass: classifier/whitespace exit 0; actual objects, paths and ancestry; clean rounds |
| 01-04-02 | PROC-03, combined tree | `npm run build:test && node --test dist-test/test/packaging/licenseHeaders.test.js && npm run check` | T-01-01, T-01-02, T-01-03, T-01-04, T-01-05, T-01-06, T-01-07, T-01-08, T-01-09, T-01-10 | Nonzero/timeout, license failure, Cucumber failure, or direct metric below 100% | Pass: unchanged-input full/build evidence reused; license rerun 5/5; four headers inspected |

Every runnable plan verify command must state its observable failure direction. RED evidence must identify the intended regression assertion, not environmental `listen EPERM` or missing build output.

## Wave 0 Requirements

Existing infrastructure is installed; no framework scaffold or package install is needed.
The leading auth tracer creates its local controlled transport and active regression
before production edits. Existing auth tests require permission for local loopback
listening; `listen EPERM` cannot supply RED evidence. No vendor access or live
hardware is required. Infrastructure and compiled owners were exercised by the
three completed batches. No installation or new test scaffold was needed.
Reserved T-01-SC repeats across plans by contract; no package install occurred.
The ten numeric threat IDs are unique. Each high threat has measured mitigation
evidence in the batch reports or the findings provenance audit.

## Manual-Only Verifications

| Behavior | Requirement | Instructions |
| --- | --- | --- |
| Committed pre-fix evidence | SPOT-04, BUG-01 | Audited full original patch/TAP; classifier OK; source < evidence < fix with real objects and actual paths. Unchanged-source run is retained, not rerun during this documentation audit. |
| Finding dispositions | PROC-01 | All five stable seeds fixed; no introduced/rejected/open IDs; exact rule/location/evidence in 01-FINDINGS.md. |
| Bounded convergence | PROC-02 | Auth 3→0, controls 1→0, state 1→0; explicit independent round-1 reviews; no D-09 trigger. |
| Touched headers | PROC-03 | All four complete headers inspected; inspection results below. |

## Regression and Mutation Evidence

The maintainer approved committing a planning-only record containing the full regression patch, failure command/output, and source commit before the active test and fix. Keep mutation evidence distinct from production-bug RED evidence. Remove only `flag: 'wx'` to prove the stranded-file case; substitute a same-status wrong cause to prove refusal logs; test missing snapshots and stale-store corruption to prove state assertions. Restore every mutation and verify GREEN.

## Validation Sign-Off

- [x] Every task has an automated verify or an explicit manual evidence check.
- [x] New auth cancellation cases cover one caller leaving and all callers leaving.
- [x] Negative controls fail for their intended assertions and restoration passes.
- [x] Direct coverage is 100% for each changed source/test pair.
- [x] Full combined-tree gate passes.
- [x] Ledger provenance audit, three batch re-reviews, and four-header inspection pass.
- [x] `nyquist_compliant: true` and final task mapping reflect verified evidence.

**Execution sign-off:** Measured checks pass on 2026-10-13. This is ready for
independent phase verification; no independent or human judgment is implied.

## Measured commands, revisions, and scope

All commands below used Node v26.11.1. The batch reviews and summaries retain
full commands, actual code hashes, hook results, failures, and restoration proof.

| Command / observation | Exit / result | Revision and scope |
| --- | --- | --- |
| Auth final compiled TAP owner | 0; 61/61 | `221581c`; offline auth, temporary filesystem and local loopback adapter |
| Controls final compiled owner | 0; 63/63 | `d023bbb`; eight fresh exact-warning cases |
| State final compiled owner | 0; 54/54 | `548f2fa`; public canonical state and frozen values |
| Three isolated `test:coverage:direct` commands in the task map | 0; each 100% lines/functions/branches | Restored final auth/controls/state pairs |
| RED classifier in the task map | 0; RED_EVIDENCE_OK, intended target only | Original `109fda7` production; `919d70d` evidence before `3878103` fix |
| `node --test dist-test/test/packaging/licenseHeaders.test.js` | 0; 5/5 rerun during audit | `218ab0c`; shipped license texts/source classification |
| `npm run check` | 0; all static gates, 104 scenarios/1156 steps, all 43 isolated pairs; merged direct LCOV | Combined source `218ab0cac702c5699ced277aaf499fe5f5194d54`, completed 2026-10-13T20:27:52Z |

The full gate includes `build:test`, unpaired tests, Cucumber, and isolated
coverage for every module. Its log is `/private/tmp/guardian-phase1-full-check.log`.
The coordinator supplied its observed exit 0 in this session; the log confirms
all static gates, scenario/step counts, and the 43-pair LCOV merge.

Before reuse, the current dirty diff was byte-compared with
`/private/tmp/guardian-phase1-verified.diff`. The sole untracked planning lock
was byte-compared with `/private/tmp/guardian-phase1-verified-milestone.lock`.
Both matched exactly. No untracked executable input or changed build input
exists. The generic `git diff 218ab0c -- . ':(exclude,glob).planning/**/*.md'`
shows baseline `.planning/state.json`; that non-executable coordinator metadata
is included in the exact verified diff. It does not require another full gate.
Subsequent changes are owned planning Markdown only. This follows the dirty-tree
reuse contract in `skills/local-verification/SKILL.md`, including build evidence.
No timeout, permission failure, or incremental hook supplies the full pass.

## Four-file header inspection

All four files have line-1 MIT SPDX, a separate exact original-work copyright
block at lines 3-5, a separate fileoverview block at lines 7-9, and imports from
line 11. Each section has exactly one blank separator. No touched file has
template attribution to preserve; the existing Apache-derived files remain
unchanged and pass the license gate. The source-only gate does not inspect test
headers, so the test-file results below come from direct inspection.

| File | Brief nonempty purpose | Result |
| --- | --- | --- |
| `src/cloud/auth.ts` | Manages authentication and the token cache. | Pass |
| `test/cloud/auth.test.ts` | Tests token grants, cancellation, and cache ownership. | Pass |
| `test/accessories/controls.test.ts` | Tests control writes and refusal diagnostics. | Pass |
| `test/device/state.test.ts` | Tests canonical device snapshots and state-store behavior. | Pass |

The copyright in each block is exactly `Copyright (c) 2026 Alessandro Colomba`.
Each overview contains only its purpose sentence. All temporary mutations and
active RED experiments are restored; the verified combined build inputs match.

## Probe and Process Audit

`01-SOURCE-AUDIT.md` accounts for all 18 supplied edge rows: 16 explicit planned
criteria and two unresolved unclassified taxonomy assumptions (SPOT-03/SPOT-04).
Two descriptor-less safety/transparency prohibitions remain flagged-unverified
for phase-end judgment. The phase verifier must surface these flags.

| Flag | Current status / required judgment |
| --- | --- |
| E-07 / SPOT-03 | Unclassified taxonomy assumption; concrete state cases tested; no taxonomy completeness claim |
| E-08 / SPOT-04 | Unclassified taxonomy assumption; concrete cancellation matrix tested; no taxonomy completeness claim |
| P-01 / SPOT-03 | No guessed normal protection telemetry; descriptor-less and flagged-unverified |
| P-02 / PROC-01, PROC-02 | No false completion of paused/skipped/deferred hardware/archived work; descriptor-less and flagged-unverified |

The 16 classified edge criteria have evidence in the task map, batch reports,
header inspection, and [findings ledger](./01-FINDINGS.md). Equality remains
18 surfaced = 16 explicit criteria + 2 unresolved assumptions. Neither remaining
prohibition is dismissed or marked green. These four judgment flags do not
invent new gates. No open accepted finding, outstanding D-09 pause, or unresolved
high/critical mitigation was found. Original WARNINGs remain deferred to
Phases 2, 3, and 5; archived release and real-home results are not current proof.

`01-REVIEW-PROTOCOL.md` is the reusable single-owner ledger, round-stop, approved
RED-evidence, header, and commit contract. The coordinator records the full
combined-tree result after Wave 1 and applies the unchanged-input policy before
reusing it at phase end. Every plan summary requires `## Threat Flags`.
