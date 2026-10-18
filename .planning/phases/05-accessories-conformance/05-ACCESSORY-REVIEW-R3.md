---
phase: 05-accessories-conformance
batch: ACCESSORY
review_round: 3
reviewed: 2026-10-18T13:26:30Z
depth: deep
source_revision: 530da8016ae53d470b226fde15b29e40be9836dc
files_reviewed: 2
files_reviewed_list:
  - src/accessories/basementGuardian.ts
  - test/accessories/basementGuardian.test.ts
findings:
  blocker: 1
  warning: 0
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 3)
---

# Phase 5 ACCESSORY batch: correction round 3

I read every line of both batch files at the committed revision above. I read the Phase 5 context, 05-07 plan, review protocol, ACCESSORY ledger, prior reports, and the authoritative TypeScript style, unit-test, and verification books and rules. I inspected the moved HAP gate and its stand-in as context for 017, and traced the runtime's poll and monitoring callback order for the finding below. No source or test file was edited.

Opening: **1**. Confirmed fixed: **1**. Still open: **0**. Rejected: **0**. New: **1**. Reopened: **0**. Closing: **1** (`1 - 1 - 0 + 1 + 0`). The closing ID is **CR-05-ACCESSORY-034**. The D-03 recommendation is **STOP ALL WORK**: this round has an open finding and did not lower the open count. Round 3 is below the D-18 cap, but the cap does not override D-03.

## Round status

| ID | Status at this revision | Evidence |
| --- | --- | --- |
| CR-05-ACCESSORY-001 | still fixed | Pending expiry still restores the reported or held control value; three withdrawal cases independently read it. |
| CR-05-ACCESSORY-002 | still fixed | Unresolved-family republishing still binds restored control rows at source `:790-792`. |
| CR-05-ACCESSORY-003 | still fixed | The degradation line at source `:819-823` names only the affected services, not AccessoryInformation. |
| CR-05-ACCESSORY-004 | still fixed | The pending-window case reads the held value through poll and trust republishing, then expiry. |
| CR-05-ACCESSORY-005 | still fixed | The degradation tests still compare complete warning arrays. |
| CR-05-ACCESSORY-006 | still fixed | AccessoryInformation assertions still compare manufacturer, model, serial number, and firmware revision. |
| CR-05-ACCESSORY-007 | still fixed | The expected trust-scope record is exhaustive at the type boundary and compared to the reported set. |
| CR-05-ACCESSORY-008 | still fixed | Naming expectations use independent service descriptors or literal names. |
| CR-05-ACCESSORY-009 | still fixed | Both headers conform, as recorded below. |
| CR-05-ACCESSORY-010 | still fixed | Cases remain top-level under the module's single runtime entry point. |
| CR-05-ACCESSORY-011 | still fixed | Source overview and trust/publication comments retain their corrected claims. |
| CR-05-ACCESSORY-012 | still fixed | The cited source regions contain no narration of removed code. |
| CR-05-ACCESSORY-013 | still fixed | The cited test comments describe their current assertions. |
| CR-05-ACCESSORY-014 | still fixed | Battery, transport, deferral, and expiry comments still agree with their cases. |
| CR-05-ACCESSORY-015 | still fixed | Test constants have no planning-document authorship citation. |
| CR-05-ACCESSORY-016 | still fixed | The four double assertions remain in the one documented widening block at test `:181-201`. |
| CR-05-ACCESSORY-017 | still fixed | The owner reads only its own source; the 12 moved checks remain in `hapImportScope.test.ts:213-259`, and all 16 gate cases pass. |
| CR-05-ACCESSORY-018 | still fixed | The owner checks the negative option type boundary without enumerating option members. |
| CR-05-ACCESSORY-019 | still fixed | No helper-only deferral meta-test or `deferredTransition` returned. |
| CR-05-ACCESSORY-020 | still fixed | Each remaining `// act & assert` precedes one `assert.throws`; multi-action cases use one ordered `// act` and `// assert`. |
| CR-05-ACCESSORY-021 | still fixed | Throw-action and discarded-value callbacks use block bodies. |
| CR-05-ACCESSORY-022 | still fixed | Repeated expected arrays use `Array.from`. |
| CR-05-ACCESSORY-023 | still fixed | Both mains-power data rows create separate cases without branch selection. |
| CR-05-ACCESSORY-024 | still fixed | Command and persistence interactions use strict mocks and end with verification. |
| CR-05-ACCESSORY-025 | still fixed | `statusActiveReadOf` awaits the HAP read, and its callers await the promise. |
| CR-05-ACCESSORY-026 | still fixed | Case titles use behavior or durable requirement IDs rather than process IDs. |
| CR-05-ACCESSORY-027 | still fixed | Timer and sentinel names retain their production roles. |
| CR-05-ACCESSORY-028 | still fixed | `SnapshotSource` remains module-local at source `:72-82`. |
| CR-05-ACCESSORY-029 | still fixed | The construction guard cases check exact `Error` class and full text. |
| CR-05-ACCESSORY-030 | still fixed | Source `:901-905` prevents live updates from advancing connectivity time; test `:3276-3292` pins the complete value after a later live update. |
| CR-05-ACCESSORY-031 | still fixed | Wrong-type identity and invalid-threshold cases check exact `Error` class and diagnostic. |
| CR-05-ACCESSORY-032 | still fixed | Each expiry withdrawal row creates a fresh named case, accessory, command mock, and timer. |
| CR-05-ACCESSORY-033 | **fixed** | The unresolved-family branch now calls `recordTrustedScopes` at source `:1003-1006`; test `:924-945` observes a successful REST poll at A and checks the complete untrusted list after REST degradation, including connectivity `lastTrustedAt: A`. The prior live-update regression still passes. |

## Findings

### CR-05-ACCESSORY-034 - BLOCKER: The first recovered REST poll does not advance the connectivity trust time

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); Phase 5 D-05 (distinct local and device observations); `src/device/health.ts:44-49` (`UntrustedScope.lastTrustedAt` is the local time the scope last carried a trusted value).

**Location:** `530da8016ae53d470b226fde15b29e40be9836dc:src/accessories/basementGuardian.ts:897-906,1003-1006,1020-1026,971-978` (call-order context: `src/runtime/accountRuntime.ts:1014-1028,781-785`, `src/platform.ts:274-275,412-428`).

**Issue:** After two failed REST polls, the accessory holds `monitoring.restDegraded: true`. A successful recovery poll applies discovery and calls `update(snapshot, 'poll')` **before** `accountRuntime.recordPollSuccess()` clears that flag and pushes `markMonitoring` with recovered trust. Both update branches call `reasonsNow()` first. Its stale monitoring reason marks connectivity `unreachable`, so `recordTrustedScopes` skips the recovery poll's receipt time B. The subsequent `markMonitoring` clears the reason but does not backfill the timestamp. If REST degrades again, `untrusted` reports the earlier successful poll time A (or `undefined`) although REST successfully observed connectivity at B. The tests for 030 and 033 both poll while monitoring is initially healthy; no case exercises a recovery poll after an existing REST withdrawal. This cause is distinct from 033's missing call in the unresolved-family branch: it affects both branches even with that call present.

**Fix:** Let a successful REST poll record connectivity's receipt time when its own connectivity observation is valid, even while the accessory still holds the previous REST-degraded monitoring flag. Keep live updates unable to advance it, and keep device-level connectivity validation failures from doing so. Add a regression through the public accessory API: poll at A, mark REST degraded, poll at B, mark monitoring healthy, then degrade REST again; assert the complete untrusted connectivity entry has `lastTrustedAt: B`. Follow D-04 RED evidence before editing production.

**Flags:** D-04, D-05; distinct from CR-05-ACCESSORY-030 and CR-05-ACCESSORY-033.

## Coordinator triage and continuation

Accepted 033 as fixed and 034 as a new genuine production bug. The counter is opening 1,
fixed 1, rejected 0, new 1, reopened 0, closing 1. D-03 therefore stopped the batch with
034 open, and the report and ledger were left uncommitted. The maintainer subsequently
instructed "go for it" in this thread. Under the bounded 05-07 amendment, the coordinator
will commit this stopped round as a resume point, use D-04 to repair 034, and run round 4.

## Seed and lead dispositions

Round-0 seed and lead dispositions remain supported. S-05-02, S-05-06, S-05-17, S-05-24, and the ACCESSORY part of S-05-25 remain fixed; the moved S-05-17 checks are present in the GATES owner. S-05-20 remains rejected for the round-0 rule and caller reasons. The Phase 6 platform variants of S-05-25 remain outside this batch. Finding 034 comes from the recovery call path, not a seed.

## Header inspection

| File | Result |
| --- | --- |
| `src/accessories/basementGuardian.ts` | Conforms: SPDX line 1, copyright block lines 3-5, overview block lines 7-40, imports from line 42. |
| `test/accessories/basementGuardian.test.ts` | Conforms: SPDX line 1, copyright block lines 3-5, overview block lines 7-10, imports from line 12. |

## Toolchain evidence

At HEAD `530da8016ae53d470b226fde15b29e40be9836dc`, `node --version` printed `v26.12.0`. Every shell check used the required `/opt/homebrew/opt/node/bin` PATH prefix. The worktree was clean before this report was written. These focused checks do not constitute the full project gate.

| Command | Raw exit | Observation |
| --- | --- | --- |
| `npm run typecheck` | 0 | Source and test TypeScript projects passed. |
| `npm run build:test` | 0 | Rebuilt `dist-test` for this revision. |
| `node --test dist-test/test/accessories/basementGuardian.test.js` | 0 | 145 tests, 145 passed, 0 failed, 0 skipped. |
| `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | 0 | The pair passed its isolated 100% line, function, and branch threshold. |
| `node_modules/.bin/eslint src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts --max-warnings=0` | 0 | Fresh invocation without `--cache`; no warnings or errors. |
| `node --test dist-test/test/accessories/hapImportScope.test.js` | 0 | 16 tests passed, including all moved checks for 017. |
| `npm_config_cache=/private/tmp/guardian-npm-cache npm run test:unpaired` | 0 | Unpaired suite passed with a writable temporary npm cache. |

## Out-of-scope observations

The `accountRuntime.ts` and `platform.ts` ordering above was read to establish reachability of the accessory defect; those paths were not added to `files_reviewed_list` or assigned independent findings. `test/accessories/hapImportScope.test.ts` retains the 017 safety checks and belongs to the GATES batch's full review. The HAP stand-in under `features/lib/hap.ts` belongs to Phase 7. No source or test file was modified in this review.
