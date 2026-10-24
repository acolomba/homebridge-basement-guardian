# Auth batch review

Live milestone: `code-review-sweep`. Batch owner: plan 01-01.

## Scope and initial triage

Independent reviewer: `auth_review_initial` (`gsd-code-reviewer`). Reviewed
source HEAD `109fda723d684b842e710786ddf08162ee65f816` and the active regression
test diff. Initial triage is not a completed post-fix review round.

| ID | Severity | Location at source HEAD | Rule and evidence | Outcome |
| --- | --- | --- | --- | --- |
| SC-01 | BLOCKER | test/cloud/auth.test.ts:542-563 | SPOT-01; occupied PID-only fixture cannot collide with PID plus random suffix; plausible loss of exclusive creation passes | Fixed in 221581cdd2f1fa370e4e0c515efeba97667d5198 |
| SC-04 | BLOCKER | src/cloud/auth.ts:211-212,246-247 | SPOT-01; hidden temporary-path entropy prevents exact injected collision | Fixed in 3c9327e33457231756d7c765208dc8bb14c5a8c4 |
| SC-05 | BLOCKER | src/cloud/auth.ts:455-460,477,482 | SPOT-04, D-04/D-05; first caller owns shared transport, joined cancellation ignored; API supplies independent deadlines | Fixed in 3878103c489f9042b573e2ac47ce56d582c0b021 |

No introduced findings at initial triage. Seed WARNINGs remain deferred to
Phase 2. The executor traced `createAuthClient` in accountRuntime and `idToken`
in cloud API. Fallow guard found no configured boundaries; type-aware symbol
impact proved accountRuntime as the complete direct consumer.

## Regression evidence

- Source: `109fda723d684b842e710786ddf08162ee65f816`, unchanged production.
- Evidence: `919d70d2c4dd054aa146a5e46e01dd97aa2f5d3c` contains only
  `01-AUTH-RED-EVIDENCE.json`; actual committed paths inspected.
- Named target: `keeps the joined caller grant alive when the first caller aborts`.
- Command: `npm run build:test && node --test --test-reporter=tap dist-test/test/cloud/auth.test.js`.
- Exit: 1; 52 active tests, 51 passed, 1 intended assertion failure, no cancellation.
- Classifier: `RED_EVIDENCE_OK`, `target_test_failed`; semantic assessment
  confirms joined fulfillment fails with unchanged production.
- Full active patch, unmodified native TAP, Node v26.11.1, and timestamp are in
  the committed JSON. Native TAP with nested DOMException had invalid duplicate
  YAML keys; the status-only observation was recaptured as valid native TAP.
- Evidence-only required pre-commit and foreground commit hooks passed.
  Build checks correctly did not select any staged source/test pair.
- Fallow audit before evidence commit: zero findings (base HEAD).

## Review rounds

Independent reviewer: `auth_review_initial` (`gsd-code-reviewer`). Round 1
reviewed HEAD `221581cdd2f1fa370e4e0c515efeba97667d5198` against baseline
`109fda723d684b842e710786ddf08162ee65f816`, including all introduced auth changes.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 3 | 3 | 0 | 0 | 0 | 0 |

Reconciliation: 3 - 3 - 0 + 0 + 0 = 0. Fixed IDs: SC-01, SC-04, SC-05.
No rejected, new, reopened, or unresolved IDs. The reviewer explicitly reports
zero open in-scope findings. No stall, recurrence, or four-round-cap trigger.
Round results were sent to the coordinator before further work.

Current fixed locations: SC-01 `test/cloud/auth.test.ts:847-889`; SC-04
`src/cloud/auth.ts:95,264`; SC-05 `src/cloud/auth.ts:444-484,521-570`.
Headers match D-01/D-02/D-03. All seed WARNINGs remain with Phase 2.

SC-05 and SC-04 production fixes were delegated to `auth_fix`
(`gsd-code-fixer`), with executor-owned regression tests and verification.
The coordinator authorized shared isolation `none`; no branch or worktree was
created or switched. Project feature-branch and commit-title rules govern.

## Verification and mutation evidence

Node version for all checks: v26.11.1. Scope: owned auth pair; offline fixtures,
real temporary filesystem, and local loopback adapter case.

| Command | Exit | Evidence |
| --- | --- | --- |
| `npm run build:test && node --test --test-reporter=tap dist-test/test/cloud/auth.test.js` | 0 | Final clean owner: 61 tests passed, no failures/cancellation/skips |
| `npm run test:coverage:direct -- src/cloud/auth.ts test/cloud/auth.test.ts` | 0 | Restored final auth pair: 100% lines, functions, branches |
| `npm run build:test && node --test dist-test/test/cloud/auth.test.js dist-test/test/packaging/licenseHeaders.test.js` | 0 | Header/tracer gate: 65 passed (60 auth plus 5 license cases) |
| `node_modules/.bin/eslint src/cloud/auth.ts test/cloud/auth.test.ts --max-warnings=0` | 0 | Focused lint after final test repair |
| `git diff --exit-code HEAD -- src/cloud/auth.ts` | 0 | Exclusive-create mutation restored exactly to source HEAD 3c9327e |
| `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/01-known-findings-and-loop-proof/01-AUTH-RED-EVIDENCE.json --raw` | 0 | `passed: true`, `RED_EVIDENCE_OK`; original production RED retained |

Negative control: removed only `flag: 'wx'` from `storeCache`, rebuilt, and ran
the complete auth owner with native TAP. Exit 1: 60 passed, one failed, none
cancelled. Named target: `AUTH-02 preserves an occupied injected temporary file
and the prior cache bytes`. Failure: intended `ERR_ASSERTION` comparing the
complete earlier-target Buffer, which was replaced by the newly granted token.
Restored exclusive creation immediately, proved source equality, rebuilt and
passed direct coverage. No mutation was committed. Complete native TAP, test
patch, command, timestamp, source revision, and assessment are in the JSON's
separate `mutationEvidence` field. This assertion repair is not a production
bug RED.

The cancellation matrix covers first and joined caller cancellation, all
callers/root cancellation, already-aborted input, cancellation during shared
cache read and cache writing, late abort teardown, transient settlement and a
later explicit grant, listener removal, abort-silent logs, token registration,
and retained deadline composition. No automatic retry or concurrent replacement
grant is observed. Occupied-path checks compare complete Buffer bytes without
decoding, modes, exact directory contents, full diagnostics, and one full grant
for concurrent callers. Empty injected and entropy fallback writes remain
covered, including interrupted-rename cleanup and owner-only creation.

## Hook and commit evidence

Each code commit passed its required `SKIP=npm-check pre-commit run --files`
step and its enabled foreground commit hook (`npm run check:commit`). Each
actual committed path was inspected. No file deletions occurred. Fallow audits
before each commit returned exit 0 and zero changed-file findings.

| Commit | Cause | Actual paths |
| --- | --- | --- |
| 919d70d2c4dd054aa146a5e46e01dd97aa2f5d3c | Approved production RED evidence | 01-AUTH-RED-EVIDENCE.json only |
| 3878103c489f9042b573e2ac47ce56d582c0b021 | SC-05 caller cancellation | src/cloud/auth.ts; test/cloud/auth.test.ts |
| bb879a7f8e62437bf03c0af804ff3677d706cae1 | Separate required headers | src/cloud/auth.ts; test/cloud/auth.test.ts |
| 3c9327e33457231756d7c765208dc8bb14c5a8c4 | SC-04 optional full-path injection | src/cloud/auth.ts; test/cloud/auth.test.ts |
| 221581cdd2f1fa370e4e0c515efeba97667d5198 | SC-01 discriminating collision assertion | test/cloud/auth.test.ts only |

The initial test setup used a Promise API outside this project's compiler lib;
it was replaced with a local deferred before valid RED capture. Source lint
issues introduced during implementation were corrected before the functional
commit. Neither setup nor lint failures are claimed as RED.

Loopback owner verification uses escalated execution; local listen permission
failures never count as RED evidence. No package install, real vendor account,
or hardware test was used. The coordinator owns the combined `npm run check`
wave/phase gate and shared planning-state updates.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.
