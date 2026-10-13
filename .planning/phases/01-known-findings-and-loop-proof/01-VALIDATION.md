---
phase: "01"
slug: "known-findings-and-loop-proof"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-13"
---

# Phase 1 — Validation Strategy

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
| 01-01-01 | SPOT-04, PROC-03 | `npm run build:test && node --test dist-test/test/cloud/auth.test.js` | T-01-02, T-01-03, T-01-04 | Nonzero; joined-caller target must first fail intentionally, then pass | Pending |
| 01-01-02 | SPOT-01, SPOT-04 | `npm run test:coverage:direct -- src/cloud/auth.ts test/cloud/auth.test.ts` | T-01-01, T-01-02, T-01-03, T-01-04 | Nonzero or any direct metric below 100%; collision mutation must fail | Pending |
| 01-02-01 | SPOT-02, PROC-03 | `npm run build:test && node --test dist-test/test/accessories/controls.test.js` | T-01-05, T-01-06 | Nonzero on clean tree; same-status wrong-cause mutation must fail named case | Pending |
| 01-02-02 | SPOT-02 | `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | T-01-05, T-01-06 | Nonzero or any direct metric below 100% | Pending |
| 01-03-01 | SPOT-03, PROC-03 | `npm run build:test && node --test dist-test/test/device/state.test.js` | T-01-07 | Nonzero on clean tree; missing snapshot and stale-store mutation must fail | Pending |
| 01-03-02 | SPOT-03 | `npm run test:coverage:direct -- src/device/state.ts test/device/state.test.ts` | T-01-07 | Nonzero or any direct metric below 100%; missing nested/released value must fail | Pending |
| 01-04-01 | PROC-01, PROC-02 | `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/01-known-findings-and-loop-proof/01-AUTH-RED-EVIDENCE.json --raw && git diff --check HEAD^ HEAD -- .planning/phases/01-known-findings-and-loop-proof/01-FINDINGS.md` | T-01-08, T-01-09, T-01-10 | Nonzero or missing RED_EVIDENCE_OK; invalid provenance fails artifact audit | Pending |
| 01-04-02 | PROC-03, combined tree | `npm run build:test && node --test dist-test/test/packaging/licenseHeaders.test.js && npm run check` | T-01-01 through T-01-10 | Nonzero/timeout, license failure, Cucumber failure, or direct metric below 100% | Pending |

Every runnable plan verify command must state its observable failure direction. RED evidence must identify the intended regression assertion, not environmental `listen EPERM` or missing build output.

## Wave 0 Requirements

Existing infrastructure is installed; no framework scaffold or package install is needed.
The leading auth tracer creates its local controlled transport and active regression
before production edits. Existing auth tests require permission for local loopback
listening; `listen EPERM` cannot supply RED evidence. No vendor access or live
hardware is required. Execution evidence remains pending, so the frontmatter has
not been marked compliant or complete.

## Manual-Only Verifications

| Behavior | Requirement | Instructions |
| --- | --- | --- |
| Committed pre-fix evidence | SPOT-04, BUG-01 | Confirm a complete regression patch and observed failure were committed before the production fix; run the regression against pre-fix source. |
| Finding dispositions | PROC-01 | Confirm every seed and introduced finding has rule, location, severity, outcome, and evidence. |
| Bounded convergence | PROC-02 | Confirm per-round counts and no-open-findings result, or a maintainer pause at stall, recurrence, or round cap. |
| Touched headers | PROC-03 | Inspect all touched TypeScript files for separate blocks, attribution, and brief purpose. |

## Regression and Mutation Evidence

The maintainer approved committing a planning-only record containing the full regression patch, failure command/output, and source commit before the active test and fix. Keep mutation evidence distinct from production-bug RED evidence. Remove only `flag: 'wx'` to prove the stranded-file case; substitute a same-status wrong cause to prove refusal logs; test missing snapshots and stale-store corruption to prove state assertions. Restore every mutation and verify GREEN.

## Validation Sign-Off

- [ ] Every task has an automated verify or an explicit manual evidence check.
- [ ] New auth cancellation cases cover one caller leaving and all callers leaving.
- [ ] Negative controls fail for their intended assertions and restoration passes.
- [ ] Direct coverage is 100% for each changed source/test pair.
- [ ] Full combined-tree gate passes.
- [ ] Ledger and headers pass review.
- [ ] `nyquist_compliant: true` and final task mapping reflect verified evidence.

**Approval:** Decisions approved 2026-10-13; validation evidence pending execution.

## Probe and Process Audit

`01-SOURCE-AUDIT.md` accounts for all 18 supplied edge rows: 16 explicit planned
criteria and two unresolved unclassified taxonomy assumptions (SPOT-03/SPOT-04).
Two descriptor-less safety/transparency prohibitions remain flagged-unverified
for phase-end judgment. The phase verifier must surface these flags.

`01-REVIEW-PROTOCOL.md` is the reusable single-owner ledger, round-stop, approved
RED-evidence, header, and commit contract. The coordinator records the full
combined-tree result after Wave 1 and applies the unchanged-input policy before
reusing it at phase end. Every plan summary requires `## Threat Flags`.
