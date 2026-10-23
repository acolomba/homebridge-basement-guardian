---
phase: 05-accessories-conformance
batch: ACCESSORY
review_round: 1
reviewed: 2026-10-18T12:53:12Z
depth: deep
source_revision: 27a959e638209f6956e4715328ebcd89ee818aea
files_reviewed: 2
files_reviewed_list:
  - src/accessories/basementGuardian.ts
  - test/accessories/basementGuardian.test.ts
findings:
  blocker: 1
  warning: 4
  total: 5
status: issues_found
reviewer: gsd-code-reviewer (correction round 1)
---

# Phase 5 ACCESSORY batch: correction round 1

I read every line of both batch files at `27a959e638209f6956e4715328ebcd89ee818aea`, together with the Phase 5 context, protocol, plan task 03, all ACCESSORY ledger rows and fix hashes, the round-0 report and repair history, and every rule in the three authoritative `.agents/skills/` books. I traced the relevant calls into `controls.ts`, `serviceCatalogue.ts`, the HAP stand-in, the pinned HAP implementation, `platform.ts`, and `device/state.ts`. No source or test file was edited.

Opening: 29 open IDs. Confirmed fixed: 27. Still open: 2. Rejected: 0. New: 3. Reopened: 0. Closing: **5** (`29 - 27 - 0 + 3 + 0`). No ID had been confirmed fixed by a prior correction round, so no reopen is possible in this round. The five closing IDs are **CR-05-ACCESSORY-017, -020, -030, -031, and -032**.

## Round status

All locations below are at the source revision in the frontmatter. Every opening ID had a candidate fix commit in the ledger.

| Opening ID | Status | Current evidence |
| --- | --- | --- |
| CR-05-ACCESSORY-001 | fixed | `controls.ts:534-541, 605-615` retains pre-press `On` and pushes reported or held state on expiry. `basementGuardian.test.ts:3183-3279` checks credential, controller-link, and undecoded-field withdrawals, with reads after expiry. |
| CR-05-ACCESSORY-002 | fixed | `basementGuardian.ts:790-792` binds existing control rows on the unresolved republish path; `basementGuardian.test.ts:991-1020` asserts the fresh-state refusal when transport is ready. |
| CR-05-ACCESSORY-003 | fixed | `basementGuardian.ts:819-823` names affected services and omits the false AccessoryInformation claim; `basementGuardian.test.ts:1070-1094` shows firmware moving while the warning is exact. |
| CR-05-ACCESSORY-004 | fixed | `basementGuardian.test.ts:3144-3178` reads `On` after both a poll and a monitoring republish during the pending window, then after expiry. `basementGuardian.ts:977-978, 1053` passes `controls.pending`. |
| CR-05-ACCESSORY-005 | fixed | `basementGuardian.test.ts:167-170, 1035-1068` compares complete warning arrays; the per-field case at `:1090-1093` also pins the text. |
| CR-05-ACCESSORY-006 | fixed | `basementGuardian.test.ts:673-687, 894-910, 1226-1245` compares all four AccessoryInformation values across unresolved and undecoded updates. |
| CR-05-ACCESSORY-007 | fixed | `basementGuardian.test.ts:284-294` gives an exhaustive `Record<TrustScope, true>`; `:2497-2510` compares the reported scope set with its keys. |
| CR-05-ACCESSORY-008 | fixed | `basementGuardian.test.ts:2425-2441, 2448-2495` uses independent descriptor names or literal names as expectations. |
| CR-05-ACCESSORY-009 | fixed | Both files have SPDX, separate copyright and overview blocks, and blank lines (`basementGuardian.ts:1-42`, test `:1-12`). |
| CR-05-ACCESSORY-010 | fixed | Tests are top-level from `basementGuardian.test.ts:814` through `:3665`; no `describe()` wraps the single runtime entrypoint. |
| CR-05-ACCESSORY-011 | fixed | Source overview and comments at `basementGuardian.ts:32-39, 88-106, 132-150, 627-640, 667-716, 752-768` now agree with storage, publication and trust behavior. |
| CR-05-ACCESSORY-012 | fixed | Source comments at `basementGuardian.ts:558-571, 909-921, 939-970` state present behavior without former-code narration. |
| CR-05-ACCESSORY-013 | fixed | Former-shape narration is absent from the named test regions; `basementGuardian.test.ts:2813-2817, 2846-2850, 3020-3028, 3437-3440` states current assertions. |
| CR-05-ACCESSORY-014 | fixed | The named test comments now match the source and tests, including battery rows (`:59-62`), transport fixtures (`:309-325`), deferred pushes (`:745-746`), and control expiry (`:3180-3182`). |
| CR-05-ACCESSORY-015 | fixed | The planning-document citation is gone from the test constants and comments at `:167-189`. |
| CR-05-ACCESSORY-016 | fixed | All four double assertions are inside the commented widening block at `basementGuardian.test.ts:191-213`; call sites use helpers. |
| CR-05-ACCESSORY-017 | **still open** | The get-handler loop was removed, but `basementGuardian.test.ts:179-189, 3615-3665` still reads `customCharacteristics.ts`, `customServices.ts`, and `serviceCatalogue.ts` and asserts their source text from this owner. See below. |
| CR-05-ACCESSORY-018 | fixed | The option-member enumeration is gone. `basementGuardian.test.ts:2410-2423` uses a negative type check and the remaining API-type boundary check. |
| CR-05-ACCESSORY-019 | fixed | Deferral-helper-only cases and `deferredTransition` are gone. Public transition cases remain at `basementGuardian.test.ts:2146-2197, 2251-2278`. |
| CR-05-ACCESSORY-020 | **still open** | Prose was moved off phase markers, but cases still put `// act & assert` before another `// act` or `// assert`, for example `basementGuardian.test.ts:2590-2604, 2629-2643, 2827-2843, 2943-2969`. See below. |
| CR-05-ACCESSORY-021 | fixed | Void callbacks and `assert.throws` action callbacks use block bodies at `basementGuardian.test.ts:226-228, 366-402, 825-881, 1507-1517`. |
| CR-05-ACCESSORY-022 | fixed | Expected repeated arrays use `Array.from` at `basementGuardian.test.ts:1503, 1580`; no `Array(...)` constructor remains. |
| CR-05-ACCESSORY-023 | fixed | Typed rows at `basementGuardian.test.ts:1151-1173` carry `mainsPresent` and expected adapter state; there is no conditional in the loop body. |
| CR-05-ACCESSORY-024 | fixed | Command and persistence interaction cases use `mock<CommandPort>` and `mock<AccessoryStore>` with exact arguments and `verify` (`basementGuardian.test.ts:998-1019, 2331-2408, 2574-3302`); the asserted recorders are gone. |
| CR-05-ACCESSORY-025 | fixed | `statusActiveReadOf` awaits `handleGetRequest` at `basementGuardian.test.ts:726-732`; `trustReportReadsOf` and its callers await it. |
| CR-05-ACCESSORY-026 | fixed | The review and phase-local IDs are absent from test titles. Titles at `basementGuardian.test.ts:2557, 2574, 2818, 2919, 3029, 3066` use behavior or durable requirements. |
| CR-05-ACCESSORY-027 | fixed | Timer variables use their production role (`basementGuardian.test.ts:2577-2587, 2922-2939, 3032-3046`), and `UNREPUBLISHED_STATUS` at `:176-177, 3554` names its sentinel role. |
| CR-05-ACCESSORY-028 | fixed | `SnapshotSource` is module-local at `basementGuardian.ts:72-82`; the exported interface at `:108` carries the equivalent literal union. |
| CR-05-ACCESSORY-029 | fixed | The two original guard cases now check exact `Error` class and message at `basementGuardian.test.ts:825-861, 1247-1267`. Other cases still use a broad `Error` matcher; that distinct set is CR-05-ACCESSORY-031. |

## Findings

### CR-05-ACCESSORY-017 - WARNING: Cross-module source-text assertions remain in the accessory owner

**Rule:** `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` Pairing and coverage (do not test one source module from another module's test); What not to test (do not duplicate a gate)
**Location:** `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:179-189, 3615-3665`
**Issue:** The repair removed the redundant get-handler loop but retained the same cause in three loops and one case. They read three other production modules and make this pair's result depend on those modules' source spellings. The `HapStatusError` count for `serviceCatalogue.ts` and the direct setter/UUID checks are still here. The original claim that this owner confined itself to its own source is therefore untrue.
**Fix:** Move the cross-module safety checks into the owning modules' tests or the declared GATES batch, retaining their protection in the ledger; keep this owner responsible only for `basementGuardian.ts`. Remove helpers and imports made orphaned by the move.
**Flags:** P-05-03

### CR-05-ACCESSORY-020 - WARNING: Rejection cases still break the arrange, act, assert phase order

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure (arrange, act, assert in order; `// act & assert` only for one rejection expression)
**Location:** `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:2590-2604, 2629-2643, 2827-2843, 2943-2969`
**Issue:** Changing each rejection marker to `// act & assert` did not settle the cases that do more work afterward. They now alternate `act & assert`, `act`, and `assert` within one test; some put `verify(commands)` under `// act` before a later assertion. The book permits the combined marker for a single rejection expression that completes the action and assertion, not as an intermediate phase before more action.
**Fix:** Capture the rejection under the single `// act` block and assert its status with the other outcomes under the final `// assert`; keep one phase sequence per case. Use `// act & assert` only where the rejection is the complete action and assertion.
**Flags:** none

### CR-05-ACCESSORY-030 - BLOCKER: A live telemetry update advances the connectivity scope's last trusted time without a REST observation

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); Phase 5 D-05 (distinct local and device observations; unknown or stale values remain marked); `src/device/health.ts` `UntrustedScope.lastTrustedAt` contract
**Location:** `27a959e638209f6956e4715328ebcd89ee818aea:src/accessories/basementGuardian.ts:897-907, 1015-1032`
**Issue:** `recordTrustedScopes(reasons, snapshot.receivedAt)` runs for both `'poll'` and `'live'` at line 1023 and includes `connectivity` whenever that scope has no current distrust. But `device/state.ts:260-270` copies the previous `connectivity` into a live snapshot while advancing `receivedAt` for any reported state change. The source itself says only a REST inventory observes reachability (`:75-80`, `:1026-1029`). Sequence: poll at local time A, live telemetry update at B>A, then mark REST degraded. `untrusted` now reports connectivity `lastTrustedAt: B`, although no connectivity observation occurred after A. This falsely dates the last trustworthy cloud-view connectivity state, and the existing live tests check only the offline count, not this timestamp.
**Fix:** In the scope-recording step, leave connectivity's `lastTrustedAt` unchanged for a live update; update it only from a successful REST poll. Add a regression that polls at A, applies a live state change at B, withdraws connectivity, and asserts A in the complete `untrusted` value. Follow D-04 before changing production.
**Flags:** D-04, D-05

### CR-05-ACCESSORY-031 - WARNING: Other validation throw cases still accept any Error subclass and message

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions (assert errors by class and structured fields)
**Location:** `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:863-881, 1507-1517`
**Issue:** The two original cases in 029 were strengthened, but the `deviceId` and `deviceTypeId` wrong-type cases and the four invalid threshold rows still use `assert.throws(..., Error)`. A different `Error` subclass or an unrelated error message passes them, so the test does not pin the guard's promised diagnostic. These lines are distinct from 029's original target locations.
**Fix:** Use an error predicate that checks the exact class and the complete expected message for each row, as the fixed cases at `:825-861` and `:1247-1267` do.
**Flags:** none

### CR-05-ACCESSORY-032 - WARNING: Three withdrawal rows run inside one test case

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Data-driven cases (one sibling `test()` per row; do not loop rows inside a case)
**Location:** `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:3183-3279`
**Issue:** The new expiry regression loops credential refusal, controller-link loss, and undecoded state inside a single `test()`, then compares one accumulated array. If an earlier row throws or fails mock verification, the later paths never run. The rule requires independently named cases for these distinct withdrawal conditions.
**Fix:** Move the typed withdrawal rows outside the case and create a sibling `test()` for each, with its own accessory, command mock, deadline recorder, and complete expected value.
**Flags:** none

## Coordinator triage

Accepted the round result: 27 opening IDs confirmed fixed, 017 and 020 still open, and new
030, 031 and 032 accepted. The 030 timestamp error is a genuine production bug (D-04); its
regression must be observed RED before a production edit. No ID reopened. The counter is
opening 29, fixed 27, rejected 0, new 3, reopened 0, closing 5. Since 5 is less than 29 and
round 1 is below the cap, D-03/D-18 result is `continue`.

## Seed and lead dispositions

The round-0 dispositions remain supported. S-05-02, S-05-06, S-05-17, S-05-24 and the ACCESSORY part of S-05-25 were confirmed in round 0. The single-entrypoint wrapper, historical comments, and expiry behavior are fixed. S-05-17 remains partly open under 017 because its cross-module source-text checks remain. S-05-20 remains rejected for the round-0 rule and caller reasons. The Phase 6 platform variants of S-05-25 remain outside this batch.

## Header inspection

| File | Result |
| --- | --- |
| `src/accessories/basementGuardian.ts` | Conforms: SPDX at line 1, separate copyright and overview blocks at lines 3-40, imports from line 42. |
| `test/accessories/basementGuardian.test.ts` | Conforms: SPDX at line 1, separate copyright and overview blocks at lines 3-10, imports from line 12. |

## Toolchain evidence

At HEAD `27a959e638209f6956e4715328ebcd89ee818aea`, `node --version` printed `v26.12.0`. Every command below used the required `/opt/homebrew/opt/node/bin` PATH prefix. The worktree was clean before this report was written. No result here is a full project gate.

| Command | Raw exit | Observation |
| --- | --- | --- |
| `npm run typecheck` | 0 | Both source and test TypeScript projects passed. |
| `npm run build:test` | 0 | Rebuilt `dist-test` for the current source. |
| `node --test dist-test/test/accessories/basementGuardian.test.js` | 0 | 153 tests, 153 passed, 0 failed, 0 skipped. |
| `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | 0 | Direct pair selector succeeded; it prints nothing after its build on success. |
| `node_modules/.bin/eslint src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts --max-warnings=0` | 0 | Fresh invocation without `--cache`; no warnings or errors. |

## Out-of-scope observations

`src/accessories/controls.ts:534-541, 605-615` is the bounded CONTROLS edit that implements 001; it was read as context, not added to `files_reviewed_list`. `features/lib/hap.ts:316-347` remains a Phase 7 stand-in: its synchronous read differs from pinned HAP's async `handleGetRequest`, and this owner now awaits either implementation. The missing-device and missing-snapshot restored-refusal variants in `src/platform.ts` remain Phase 6 observations from round 0. No finding is assigned to those files here.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Note |
| --- | --- | --- | --- |
| CR-05-ACCESSORY-020 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R1.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; accessory owner exit 0 (153 tests, 153 pass; before 153); direct pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | Captured twelve write refusals during each case's single `// act` phase and asserted their exact HAP status in its final `// assert` phase. Moved one early command verification to the final assertion phase. The five standalone construction rejections retain `// act & assert`. Titles, command behavior and expected values remain unchanged. |
| CR-05-ACCESSORY-031 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R1.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; accessory owner exit 0 (153 tests, 153 pass; before 153); direct pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | The two wrong-type context cases now require the exact `Error` class and full identity diagnostic. Four invalid-threshold rows each carry an independent literal expected message and require the exact class and full text. All six cases and titles remain. |
| CR-05-ACCESSORY-032 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R1.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; accessory owner exit 0 (155 tests, 155 pass; before 153); direct pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | Split the three expiry withdrawals into independently named sibling cases. Each case constructs its own accessory, exact command mock, timer and deadline, then compares the full state and warning record and verifies one send. The previous three outcomes remain covered; no production behavior changed. |
| CR-05-ACCESSORY-030 | `src/accessories/basementGuardian.ts`, `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R1.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; named GREEN exit 0 (1 pass); accessory owner exit 0 (156 tests, 156 pass; before 155); direct pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | After RED evidence commit `fd1368b`, a valid live water-level update no longer advances connectivity's last trusted time beyond the last REST poll. The active regression checks the complete untrusted value after REST degrades; controller-derived scopes retain their existing update behavior. |
| CR-05-ACCESSORY-017 | `test/accessories/basementGuardian.test.ts`, `test/accessories/hapImportScope.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW-R1.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; accessory owner exit 0 (156 before, 144 after); HAP gate exit 0 (4 before, 16 after), including its import-positive and negative controls; accessory direct pair exit 0 (100%); `npm run test:unpaired` exit 1 due to npm cache `EPERM`, retry with `npm_config_cache=/private/tmp/guardian-npm-cache` exit 0 (92 tests); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | Moved all twelve HAP source checks to `hapImportScope.test.ts`: zero `HapStatusError` occurrences in `basementGuardian.ts`, `customCharacteristics.ts` and `customServices.ts`; exactly one in `serviceCatalogue.ts`, inside `publishPersistentFailure`; and no direct `onSet` or set-event registration or either UUID generation spelling in all four modules. The accessory owner retains its own options boundary and its source reader for that case. Removed only the moved constants and orphaned occurrence helper. |
