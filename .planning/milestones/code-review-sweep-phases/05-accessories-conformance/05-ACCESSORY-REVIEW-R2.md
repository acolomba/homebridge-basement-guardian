---
phase: 05-accessories-conformance
batch: ACCESSORY
review_round: 2
reviewed: 2026-10-18T13:17:44Z
depth: deep
source_revision: 7a169429373d331a96698fc5e8bcefaf5aae4c31
files_reviewed: 2
files_reviewed_list:
  - src/accessories/basementGuardian.ts
  - test/accessories/basementGuardian.test.ts
findings:
  blocker: 1
  warning: 0
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 2)
---

# Phase 5 ACCESSORY batch: correction round 2

I read every line of both batch files at the committed revision above. I also read the context, 05-07 task 03, the review protocol, the ACCESSORY ledger, the prior reports and repair history, and the authoritative TypeScript style, unit-test and verification rules. For the 017 transfer I inspected the moved declarations and all twelve checks in `test/accessories/hapImportScope.test.ts:65-71,103-114,213-259`. The stand-in and pinned HAP behavior considered in round 1 remains consistent with the owner tests. No source or test file was edited.

Opening: **5**. Confirmed fixed: **5**. Still open: **0**. Rejected: **0**. New: **1**. Reopened: **0**. Closing: **1** (`5 - 5 - 0 + 1 + 0`). The closing ID is **CR-05-ACCESSORY-033**. The D-03/D-18 recommendation is **continue**: the count fell from 5 to 1, no previously fixed ID reopened, and round 2 is below the ten-round cap.

## Round status

| ID | Status at this revision | Evidence |
| --- | --- | --- |
| CR-05-ACCESSORY-001 | still fixed | Pending self-test expiry restores reported or held `On`; the three independent withdrawal cases at `basementGuardian.test.ts:3131-3204` read the result. |
| CR-05-ACCESSORY-002 | still fixed | Unresolved-family republishing binds cached control rows at `basementGuardian.ts:790-792`; the restored-control refusal case remains at test `:1003-1025`. |
| CR-05-ACCESSORY-003 | still fixed | Degradation text at source `:819-823` makes no claim about AccessoryInformation; test `:1075-1099` pins firmware moving. |
| CR-05-ACCESSORY-004 | still fixed | The pending-window test at `basementGuardian.test.ts:3090-3125` checks the held requested value through poll and trust pushes, then expiry. |
| CR-05-ACCESSORY-005 | still fixed | Exact warning arrays remain at test `:1051,1072,1095-1099`. |
| CR-05-ACCESSORY-006 | still fixed | AccessoryInformation comparisons cover all four fields at test `:661-675,906-922,1231-1250`. |
| CR-05-ACCESSORY-007 | still fixed | The exhaustive trust-scope record and reported-set comparison remain at test `:284-294,2516-2529`. |
| CR-05-ACCESSORY-008 | still fixed | Expected service names in test `:2444-2513` use independent descriptors or literals. |
| CR-05-ACCESSORY-009 | still fixed | Both headers conform, as recorded below. |
| CR-05-ACCESSORY-010 | still fixed | Owner cases remain top-level; no `describe()` wrapper returned. |
| CR-05-ACCESSORY-011 | still fixed | Source overview and trust/publication comments still describe current behavior. |
| CR-05-ACCESSORY-012 | still fixed | The cited source regions contain no narration of removed code. |
| CR-05-ACCESSORY-013 | still fixed | The cited test comments describe the current assertions and behavior. |
| CR-05-ACCESSORY-014 | still fixed | Battery, transport, deferral and expiry comments still agree with their code and cases. |
| CR-05-ACCESSORY-015 | still fixed | The test constants have no planning-document authorship citation. |
| CR-05-ACCESSORY-016 | still fixed | Test double assertions remain confined to the documented bounded block; uses stay typed. |
| CR-05-ACCESSORY-017 | **fixed** | The owner now reads only its own source at test `:788-806,2429-2442`. The HAP gate carries all twelve moved checks: three zero-error modules, one constrained persistent-failure occurrence, and direct setter and UUID guards for all four modules at `hapImportScope.test.ts:213-259`. Its 16 tests pass. P-05-03 protection is retained; the GATES file itself awaits its own full review. |
| CR-05-ACCESSORY-018 | still fixed | The owner uses the negative option type check and its own source boundary check at test `:2429-2442`, without member enumeration. |
| CR-05-ACCESSORY-019 | still fixed | No helper-only deferral meta-test or `deferredTransition` returned. |
| CR-05-ACCESSORY-020 | **fixed** | Every remaining `// act & assert` at test `:823,842,861,880,1259,1522` directly precedes one `assert.throws` expression. The multi-action rejection cases now have one `// act` then `// assert` sequence, for example `:2609-2625,2641-2649,2812-2821,2945-2966`. |
| CR-05-ACCESSORY-021 | still fixed | Throw-action and discarded-value callbacks use block bodies. |
| CR-05-ACCESSORY-022 | still fixed | Repeated expected arrays use `Array.from` at test `:1508,1599`. |
| CR-05-ACCESSORY-023 | still fixed | The mains-power data rows at test `:1156-1178` each create a sibling case with no conditional branch. |
| CR-05-ACCESSORY-024 | still fixed | Command and persistence interactions still use strict mocks and verification. |
| CR-05-ACCESSORY-025 | still fixed | `statusActiveReadOf` awaits the HAP read at test `:714-720`; callers await its promise. |
| CR-05-ACCESSORY-026 | still fixed | Test titles use behavior or durable requirement IDs, without phase or review IDs. |
| CR-05-ACCESSORY-027 | still fixed | Timer and sentinel names in the cited owner regions retain production roles. |
| CR-05-ACCESSORY-028 | still fixed | `SnapshotSource` remains private to the source module. |
| CR-05-ACCESSORY-029 | still fixed | The original construction guard cases still check exact `Error` class and full text at test `:819-855,1252-1272`. |
| CR-05-ACCESSORY-030 | **fixed** | Source `:901-906,1023` now advances connectivity's trusted time only for a poll. The live-after-poll regression at test `:3250-3269` checks the complete untrusted entry after REST degradation. |
| CR-05-ACCESSORY-031 | **fixed** | Wrong-type identity cases at test `:857-893` and invalid-threshold rows at `:1512-1536` require the exact `Error` constructor and complete diagnostic. |
| CR-05-ACCESSORY-032 | **fixed** | Each expiry withdrawal row now creates its own named `test()` with fresh accessory, command mock and timer at test `:3131-3204`. |

## Findings

### CR-05-ACCESSORY-033 - BLOCKER: An unresolved-family REST poll never records trusted connectivity time

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); Phase 5 D-05 (distinct local and device observations); `src/device/health.ts:44-49` (`UntrustedScope.lastTrustedAt` is the local time the scope last carried a trusted value).

**Location:** `7a169429373d331a96698fc5e8bcefaf5aae4c31:src/accessories/basementGuardian.ts:981-1005,1020-1031` (with `:897-907,382-396`).

**Issue:** A successful REST poll observes connectivity even when its `deviceTypeId` no longer resolves to an implemented family; the unresolved branch explicitly uses that poll to advance the offline verdict at `:994-1001` and keeps connectivity outside its degraded scopes. But that branch returns at `:1008` without calling `recordTrustedScopes`, which is reached only by the implemented-family branch at `:1023`. After a first unresolved-family poll at time A, `markMonitoring(REST_DEGRADED)` reports `connectivity` as unreachable with `lastTrustedAt: undefined`, although the successful REST poll vouched for connectivity at A. If an earlier implemented-family poll occurred, the timestamp remains at that older poll instead of A. This is the opposite boundary from 030: 030 prevented a live update from falsely advancing connectivity; this path fails to advance it for a genuine REST observation. The existing unresolved-family tests check the offline verdict and service activity, but not this timestamp.

**Fix:** In the unresolved-family branch, record the connectivity receipt time for a poll when connectivity is not already untrusted, before calculating `untrusted`; leave controller-derived timestamps unchanged. Add a public regression with an unresolved-family poll at A followed by REST degradation, asserting the full resulting scope list includes `connectivity` with `lastTrustedAt: A`. Follow the protocol's D-04 RED-to-GREEN procedure for this production bug.

**Flags:** D-04, D-05; distinct from CR-05-ACCESSORY-030.

## Coordinator triage

Accepted the round result: all five opening IDs are confirmed fixed, with new 033 accepted as
a distinct genuine production bug. Its regression must be observed RED before the source edit
(D-04). No ID reopened. The counter is opening 5, fixed 5, rejected 0, new 1, reopened 0,
closing 1. Since 1 is less than 5 and round 2 is below the cap, D-03/D-18 result is `continue`.

## Seed and lead dispositions

Round-0 dispositions remain supported. S-05-02, S-05-06, S-05-17, S-05-24 and the ACCESSORY part of S-05-25 were confirmed there; their associated fixed causes remain fixed, including S-05-17's P-05-03 gate transfer. S-05-20 remains rejected for the recorded rule and caller reasons. The Phase 6 platform variants of S-05-25 remain outside this batch. The new 033 cause arose from the full-file call-path review rather than a seed.

## Header inspection

| File | Result |
| --- | --- |
| `src/accessories/basementGuardian.ts` | Conforms: SPDX line 1, copyright block lines 3-5, overview block lines 7-40, imports from line 42. |
| `test/accessories/basementGuardian.test.ts` | Conforms: SPDX line 1, copyright block lines 3-5, overview block lines 7-10, imports from line 12. |

## Toolchain evidence

At HEAD `7a169429373d331a96698fc5e8bcefaf5aae4c31`, `node --version` printed `v26.12.0`. Every shell command used the required `/opt/homebrew/opt/node/bin` PATH prefix. The worktree was clean before this report was written. These are focused checks, not the full project gate.

| Command | Raw exit | Observation |
| --- | --- | --- |
| `npm run typecheck` | 0 | Source and test TypeScript projects passed. |
| `npm run build:test` | 0 | Rebuilt `dist-test` at this revision. |
| `node --test dist-test/test/accessories/basementGuardian.test.js` | 0 | 144 tests, 144 passed, 0 failed, 0 skipped. |
| `node --test dist-test/test/accessories/hapImportScope.test.js` | 0 | 16 tests, 16 passed, including all moved checks. |
| `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | 0 | The direct pair selector passed its isolated 100% threshold. |
| `node_modules/.bin/eslint src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts --max-warnings=0` | 0 | Fresh invocation without `--cache`; no warnings or errors. |
| `npm run test:unpaired` | 1 | 90 passed, 2 packaging tests failed because `npm pack` could not use the root-owned default npm cache (`EPERM`), as in round 1. |
| `npm_config_cache=/private/tmp/guardian-npm-cache npm run test:unpaired` | 0 | Same committed inputs passed with a writable temporary npm cache. |

## Out-of-scope observations

The bounded 017 transfer in `test/accessories/hapImportScope.test.ts:65-71,103-114,213-259` retains the source-text protections and is listed here only as context. Its own header and unrelated cases belong to the GATES batch's later full review. The `features/lib/hap.ts` stand-in belongs to Phase 7. The missing-device and missing-snapshot restored-refusal variants in `src/platform.ts` remain Phase 6 observations from round 0. No ID is assigned to those paths in this batch.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Note |
| --- | --- | --- | --- |
| CR-05-ACCESSORY-033 | `src/accessories/basementGuardian.ts`, `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R2.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; named GREEN exit 0 (1 pass); prior live-update regression exit 0 (1 pass); accessory owner exit 0 (145 tests, 145 pass; before 144); direct pair exit 0 (100%); unpaired suite with writable temporary npm cache exit 0; Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | After standalone RED evidence commit `8fc2983`, the unresolved-family branch records trusted connectivity only for a successful REST poll while connectivity is trusted. It derives the full untrusted scope list from those same reasons; controller-derived scopes remain untrusted, and live updates still do not advance connectivity. |
