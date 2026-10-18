---
phase: 05-accessories-conformance
batch: RECORDS
review_round: 0
reviewed: 2026-10-18T00:10:05Z
depth: deep
source_revision: 0c0930e890cb41e74d0d4e854ba45c41a31fea4a
files_reviewed: 6
files_reviewed_list:
  - src/accessories/pumpRecords.ts
  - test/accessories/pumpRecords.test.ts
  - src/accessories/reconciliation.ts
  - test/accessories/reconciliation.test.ts
  - src/accessories/staleMarking.ts
  - test/accessories/staleMarking.test.ts
findings:
  blocker: 10
  warning: 21
  total: 31
status: issues_found
reviewer: gsd-code-reviewer (round 0)
---

# Phase 5 RECORDS batch: round-0 review

Revision `0c0930e890cb41e74d0d4e854ba45c41a31fea4a` equals `git rev-parse HEAD`. The only
uncommitted change is the coordinator's ledger edit (`05-FINDINGS.md`), which is not a build input.
Every line of the six files was read in full. The `.agents/skills/` books (each `SKILL.md` with every
file in `rules/`) were applied; where the tracked `.claude/rules/*.md` copies differ, `.agents/skills/`
wins. Severities follow each book's "Classifying findings" section. There is no Info tier.

Two findings are genuine production bug candidates (D-04). A read-only probe of the compiled module
(`dist-test/src/accessories/pumpRecords.js`, made-up inputs, script kept in the session scratch
directory) observed both. No source or test file was changed, and no mutation experiment ran.

## Findings

### CR-05-RECORDS-001 - BLOCKER: The self-test label is asserted for an activation that the device timestamps do not yet describe

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); D-05 (narrow trust, no guessed values); the module's own contract at `src/accessories/pumpRecords.ts:20-24` and `src/persistence/accessoryContext.ts:57-68` ("Whether the last observed activation was self-test activity")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:175-187, 304-316, 333-337`
**Issue:** `classifiedAsTestActivity` compares the two device timestamps when they are stable and the test is finished. It does not check that those timestamps describe the record's last activation. Two observed results:

- P1, a real backup run after a self-test. Settled self-test values (`backupActivatedAt` 1_700_000_100, `testedAt` 1_700_000_105) set the label to `true`. A watched backup edge then counts a real run and sets `lastActivationAt` to that run's receipt time. While the pump runs, and until the device publishes the new backup timestamp and that value is seen twice, every observation recomputes `true`. The probe printed `activationCount: 1, lastActivationAt: 1800000120000, lastActivationWasTestActivity: true` for the running, still-running, stopped and first-new-timestamp observations. Only the second observation of the new timestamp gives `false`. During a real basement run, HomeKit says that the last activation was a self-test. The module already holds the fact that shows the inputs are not ready: `backupEdgeAwaitingItsTimestamp` is `true` for the whole window.
- P4, no observed activation. A fresh record that sees two settled snapshots gets `lastActivationWasTestActivity: true` with `activationCount: 0` and no `lastActivationAt`. `serviceCatalogue.ts:468` then publishes a label about an activation the record does not hold.

The overview (`:20-24`) says that the label is "a label on the record and nothing more" and that it is left unwritten when it is not earned. Here it is written about the wrong activation.
**Fix:** Withhold classification (return `false` from `reconcileClassification`) while `backupEdgeAwaitingItsTimestamp` is `true`, and while the backup record has no `lastActivationAt`. When a new backup activation is counted (watched edge or recovered timestamp), clear the stored label so that it does not describe the earlier activation. Follow D-04: first an active regression case in `pumpRecords.test.ts`, for example `withholds the self-test label from a watched backup run whose device timestamp has not arrived`, seen RED against unchanged production, then the minimum fix. The measured self-test sequence still gives `[undefined, undefined, undefined, undefined, true]`, because absorption clears the flag before the test reports finished. The coordinator must decide whether clearing the label on a counted activation is in scope under D-05.
**Flags:** D-04

### CR-05-RECORDS-002 - BLOCKER: A restart between a watched backup edge and its device timestamp counts one physical run twice

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); the module's own D-009 and D-010 contract (`src/accessories/pumpRecords.ts:11-18, 264-268`)
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:223, 244, 264-300`
**Issue:** `backupEdgeAwaitingItsTimestamp` lives only in memory. A record resumed from the context always starts with it `false`. Probe P2: a watched backup edge counts the run (`activationCount: 1`, `lastActivationAt` = receipt time). The context goes through a JSON round trip, as Homebridge persists it, and a new instance resumes it. The first observation after the restart sees the pump still running and correctly counts nothing (D-009). When the device then publishes the timestamp for that same run, `reconcileBackupTimestamp` takes it as a missed activation. The probe printed `activationCount: 2, lastActivationAt: 1700000160000`. One run is counted twice, and the last activation moves from the plugin's clock to the device's clock. That is the result that `:11-18` and `:264-268` say the module prevents. The window is the full run plus the delay before the device publishes the timestamp. A restart after the pump stops, but before the new timestamp is seen, has the same result. The module cannot tell these cases apart without stored state. The other possible check, comparing the stored receipt time with the device watermark, compares local time with device time, which `:158-161` forbids.
**Fix:** Persist the awaiting state with the watermarks, for example an optional `backupEdgeAwaitingTimestamp?: boolean` on `ActivationWatermarks` (absent means `false`, so a stored record needs no migration). Validate it in `isActivationWatermarks`, set and clear it where the flag is set and cleared today, and resume it. This changes a persisted type owned by `src/persistence/accessoryContext.ts:85-88` (Phase 3) and `PumpRecordsContext`. Run the D-06 impact commands first. Under D-05 and P-05-01 a new persisted member needs the maintainer's decision. Follow D-04 with a regression case such as `counts a watched backup run once across a restart before its device timestamp arrives`.
**Flags:** D-04, D-06

### CR-05-RECORDS-003 - BLOCKER: No case checks that absorbing or recovering a device timestamp moves the watermark durably and asks for a write

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case discriminates the behavior in its title); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (a case a wrong implementation would pass)
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:192-204, 245-256, 269-286`
**Issue:** `absorbs the device timestamp that follows a watched backup activation` asserts only `count` and `lastActivationAt` after one absorbing observation. "Absorbing" means "moving the watermark without counting" (`pumpRecords.ts:265-266`). Two plausible wrong implementations pass every case in the file:

1. The absorb branch clears the flag and returns before `stored.watermarks.backupPumpTimestamp = reportedAt` (the assignment moved below the flag check). The next poll carries the same timestamp, finds it past the old watermark, and counts the same run again: the D-010 double count.
2. The absorb or the recovery branch returns `false`. The watermark and count then change only in memory, `persist()` is never asked for, and a restart recovers the run again. No case reads `persistCount()` across an absorbing or recovering observation: `:245-256` takes its baseline after the recovery, and `:400-413` drives only a watched edge.

**Fix:** In the absorb case, add a later observation that carries the same `NEW_BACKUP_SECONDS`, then assert `{ count: 1, lastActivationAt: OBSERVED_NEXT_AT, watermark: NEW_BACKUP_SECONDS, persistedForTheAbsorb: 1 }` (take the persist delta around the absorbing observation). In the recovery case, assert the persist delta for the recovering observation (`1`) with the count and time.
**Flags:** none

### CR-05-RECORDS-004 - BLOCKER: Three of the classification gates have no case that isolates them

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:301-375` (against `src/accessories/pumpRecords.ts:175-187`)
**Issue:** These wrong `classifiedAsTestActivity` implementations pass all 33 cases:

1. The `previous.backupActivatedAt !== backupActivatedAt` half of the stability check is removed. In `withholds the self-test label until both device timestamps have settled`, the test-running flag (index 2) or a moving `testedAt` (index 3) always decides. The backup timestamp never moves alone while the test is finished and `testedAt` is stable. The title promises "both".
2. The `backupActivatedAt === undefined` gate is removed. With an undecoded backup timestamp on two settled snapshots, the rule returns `testedAt >= undefined`, which is `false`, and writes the label `false` from an input that did not decode. That is the C-001 claim that `:357-358` and `pumpRecords.ts:23-24, 172-174` forbid. The only undecoded-input case (`:359-375`) leaves `testedAt` out.
3. `testRunning !== false` is changed to `testRunning === true`. An undecoded running flag is then taken as finished. No case has an undecoded `testRunning` with both timestamps decoded and stable.

**Fix:** Add three cases from `storedContext()`, each with two settled snapshots: (a) `backupActivatedAt` moves while the test is finished and `testedAt` is stable, so the label is withheld on that observation; (b) `backupActivatedAt` undefined, so the label stays `undefined`; (c) `testRunning` undefined, so the label stays `undefined`. Use whole-value assertions.
**Flags:** none

### CR-05-RECORDS-005 - BLOCKER: The watermark-advance case cannot fail for change detection that ignores the watermark

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:377-396`
**Issue:** The title is `advances the self-test watermark when the label it computes is the one already stored`. The comment says that classification "consumed a self-test timestamp the record had not accounted for". In this case, the second arrange observation changes the label from absent to `true` and moves the watermark at the same time. The act observation then finds both already stored, so nothing advances. A wrong `reconcileClassification` that computes `changed` from the label alone (`stored.backupPump.lastActivationWasTestActivity !== classified`) passes, because the label change in the arrange step already asked for the write. The path that the title names, where only the watermark changes, is never driven.
**Fix:** Arrange a stored context whose backup record already carries `lastActivationWasTestActivity: true` and whose `testTimestamp` watermark is `PRIOR_TEST_SECONDS`. Observe the settled `NEW_*` values twice, and assert `{ watermark: NEW_TEST_SECONDS, label: true, persistedForTheClassification: 1 }` across the classifying observation. Correct the comment to match.
**Flags:** none

### CR-05-RECORDS-006 - BLOCKER: The unreadable-record cases compare a warning count, and the identifier case filters a context that has no identifier

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions (whole values; "A standalone negative assertion ... passes for any value; assert what the value is")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:492-506, 508-523`
**Issue:** The eleven `starts observation again and says so once for ...` rows assert `warnings: warnings.length`. A line with a different meaning, for example one that says the count was kept, passes. `names no device or account identifier in the line about an unreadable record` asserts that `warnings.filter(/account-|serial-|_/)` is empty. The case's context is `{ primaryPump: 'primary' }`, with no `deviceId` or `serialNumber`, but the production context is `accessory.context`, which carries both (`basementGuardian.ts:536`). An implementation that adds the stored context, or the identifiers read from it, to the line passes, because there is nothing in this context to leak. A line with no warning at all also passes this case.
**Fix:** Assert the whole warnings array in both places: `['The stored pump observation record could not be read, so observation starts again from now.']`. In the identifier case, use a damaged context that also carries `deviceId: 'account-1_serial-1'` and `serialNumber: 'serial-1'`, as a real accessory context does. If the maintainer takes `test-doubles.md` ("assert log calls only in a module whose job is logging") to apply, retitle the rows and remove the identifier case with a ledger reason. Do not keep titles that promise the line.
**Flags:** none

### CR-05-RECORDS-007 - BLOCKER: The `forget` cases pass for a `forget` that suppresses a deviceId forever

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:227-256` (especially 242-255); also 211-224
**Issue:** `forget` is documented as "as if this module had never seen it" (`reconciliation.ts:46`). A wrong `forget` that deletes the count and also keeps a tombstone, so that `observe` and `present` skip that deviceId from then on, passes all 14 cases. `starts a fresh count from zero for a deviceId observed present afterward` acts with one omission after re-presence and expects `[]`. That is also the result when the deviceId is never tracked again, and when `forget` does nothing at all, because presence alone resets the count. The other two cases that call `forget` also expect only `[]`. In production the runtime calls `forget` after a removal (`accountRuntime.ts:535`). A system that later returns to the account and is removed again would then never be confirmed absent.
**Fix:** In the fresh-count case, after `forget` and `observe([DEVICE_ID])`, act with two omissions and assert `{ afterFirstOmission: [], afterSecondOmission: [DEVICE_ID] }`.
**Flags:** none

### CR-05-RECORDS-008 - BLOCKER: `refuseRestoredControls` only ever meets one control, so arming the first control alone passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:341-353, 391-401, 441-451`
**Issue:** The title says `refuses a press on every restored control and counts the controls it armed`, but every accessory in this `describe` has exactly one Switch. A wrong pass that arms only the first control, for example `accessory.getService(hap.Service.Switch)` (which returns the first service of a type, as `features/lib/homebridgeApi.ts:178-182` notes), or a `find` in place of the walk, returns `1` and refuses the one press. A real accessory has two controls (`alarm-mute` and `system-self-test`). The second control would keep HAP's store-and-succeed answer: the false normal on the control surface that the module exists to prevent (`staleMarking.ts:29-34`).
**Fix:** Add both `switchCarryingNoTrust` and `selfTestControl` to one accessory, then assert `{ armed: 2, alarmMute: NOT_ALLOWED_IN_CURRENT_STATE, selfTest: NOT_ALLOWED_IN_CURRENT_STATE }` with `pressOutcomeOf` on each.
**Flags:** none

### CR-05-RECORDS-009 - BLOCKER: The unreadable-status case uses the one status that the stand-in gives for any error, so ignoring `status` passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:16-18, 114-116, 265-288`
**Issue:** `makes a read of every marked service throw the status it was given` passes `COMMUNICATION_FAILURE = -70402`. That is `SERVICE_COMMUNICATION_FAILURE`, the status that `features/lib/hap.ts:279-284` (`thrownStatusOf`) gives to any pushed error that is not a `HapStatusError`. Real HAP does the same (`extractHAPStatusFromError`). Two wrong passes give the same read: one that ignores its `status` parameter and pushes `new hap.HapStatusError(hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE)`, and one that pushes `new Error(...)`. The comment at `:16-17` says that the constant is "written independently of the stand-in so a drifted number fails here", but the number cannot be told apart from the stand-in's default.
**Fix:** Give `markUnreadable` (or a dedicated case) a status that no default mapping produces, for example `-70403` (`RESOURCE_BUSY`). Assert `threw: -70403` for each marked service. Keep a case at `-70402` only if it names the production status as its subject.
**Flags:** none

### CR-05-RECORDS-010 - BLOCKER: No case shows that a restored control's refusal is the control module's, so a local refusal without the clearing push passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:84-89, 341-353` (against `src/accessories/staleMarking.ts:126-134`)
**Issue:** The JSDoc of `refuseRestoredControls` says that the refusal "lives in the control module, beside every other local refusal, its status table and its clearing push, so a restored control and a live one cannot answer one condition two ways (D-07, D-08)". The cases observe only the thrown status. `heldTimers()` records nothing and runs nothing, and `silentLog()` drops the line. A wrong pass that binds its own `onSet(() => { throw new hap.HapStatusError(-70412); })` passes every case. That refusal arms no clearing push, so the stored `-70412` stays on `On` and Apple Home shows the accessory as "No Response" (`controls.ts:448-456`), the presentation reserved for a refused credential. Its line also has no `accessoryName` and no transport cause. The comment at `:84-86` says that the clearing push is driven in the control module's own cases. That is true for `bindRestoredControlRefusal`, but nothing here shows that this pass calls it.
**Fix:** Replace `heldTimers()` in the press case with a recorder that keeps each deferral. After the refused press, assert one deferral of `0` ms. Run it, then assert that a read of `On` answers the stored value with no status (`{ value: true, threw: undefined }`), where the read before the run threw `-70412`.
**Flags:** none

### CR-05-RECORDS-011 - WARNING: The pumpRecords pair lacks the D-01 header

**Rule:** D-01; `.agents/skills/typescript-style/rules/modules-and-data.md` Files and modules ("copyright JSDoc, `@fileoverview` JSDoc, imports ... each present section separated by exactly one blank line")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:1-2`; `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:1`
**Issue:** The source puts `@fileoverview` directly under the SPDX line, with no blank line and no copyright block. The test opens with imports and has no SPDX line, copyright block or overview. The coordinator's tracer printed the same two violations.
**Fix:** Header-only commit: SPDX line, blank, `/** Copyright (c) 2026 Alessandro Colomba */` block, blank, overview, blank, imports. Give the test a one-sentence overview, as `reconciliation.test.ts:7-9` has.
**Flags:** none

### CR-05-RECORDS-012 - WARNING: The staleMarking pair lacks the D-01 header

**Rule:** D-01; `.agents/skills/typescript-style/rules/modules-and-data.md` Files and modules
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/staleMarking.ts:1-2`; `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:1`
**Issue:** The gaps are the same as in CR-05-RECORDS-011: the source has no blank line and no copyright block, and the test has no header.
**Fix:** As CR-05-RECORDS-011.
**Flags:** none

### CR-05-RECORDS-013 - WARNING: `ReconciliationOptions.clock` is required and never read (S-05-07)

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does: the interface JSDoc says "Everything the reconciliation state machine needs"); `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` Design production code for its tests (dependencies are explicit; an injected port the module does not use makes the test fabricate one)
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/reconciliation.ts:23, 50-54`; `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:17, 22, 42-46`
**Issue:** No line of `reconciliation.ts` reads `options.clock`. The module reads only `options.log` (`:99`). The JSDoc says that the interface is everything the module needs. The test builds a `Clock` returning `NOW` that cannot affect any case. The only production consumer passes `clock: options.clock` (`src/runtime/accountRuntime.ts:346`), and the runtime still needs `options.clock` for `createMonitoringHealth` (`:347`). Read-only impact evidence: `fallow dead-code --type-aware --symbol-impact src/accessories/reconciliation.ts:ReconciliationOptions` with `tsconfig.json` gave exit 0, `no-consumers-found`, complete (the runtime reaches the type only through `createReconciliation`'s parameter). With `tsconfig.test.json` it gave exit 0, `consumers-found`, complete: `test/accessories/reconciliation.test.ts`.
**Fix:** Remove `clock` from `ReconciliationOptions` and remove the `Clock` import. Edit the consumer to `createReconciliation({ log: options.log })` at `accountRuntime.ts:346` as a bounded D-06 task (Phase 4 file; this does not reopen Phase 4's ACCOUNT counter). In the test, remove `Clock`, `NOW` and the clock from `reconciliationOptions()`.
**Flags:** D-06

### CR-05-RECORDS-014 - WARNING: The reconciliation overview says that the module's sole input is one trustworthy deviceId list

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does)
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/reconciliation.ts:11-17`
**Issue:** The overview says that "`observe` takes a caller-verified-trustworthy inventory response" and that "its sole input is a deviceId list, so a failed ... response can never reach it and can never advance or reset a count". The module also has `present(deviceId)`, which resets a count, and `forget(deviceId)`. The runtime calls `present` for every cached deviceId at start (`accountRuntime.ts:1191-1193`), and these IDs come from the Homebridge cache, not from an inventory response. It also calls `present` for a final-check reappearance (`:496`). So a deviceId can become a removal candidate without being in any trustworthy list. The claim became stale when `020498a` (CR-04-ACCOUNT-021) added `present`. The lines themselves were not touched.
**Fix:** Describe all three inputs. For example: "Its inputs are deviceIds only: the full list one trustworthy poll reported (`observe`), and single deviceIds the caller records present or forgets. No response object reaches it, so ...".
**Flags:** none (the cause came from `020498a`, CR-04-ACCOUNT-021, but these lines were not touched)

### CR-05-RECORDS-015 - WARNING: A case that acts on `forget` sits under `describe('present')`

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure (one `describe()` per entrypoint; do not group by anything else)
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:211-224`
**Issue:** `lets forget remove the eligibility of a device recorded present` arranges with `present` and acts with `tracker.forget(DEVICE_ID)`. Its title names `forget`. It is the fourth case in which `forget` is the act, but it is grouped under `present`. The `020498a` change for CR-04-ACCOUNT-021 added it.
**Fix:** Move the case unchanged into `describe('forget', ...)`.
**Flags:** D-10 (CR-04-ACCOUNT-021)

### CR-05-RECORDS-016 - WARNING: One `observe` case duplicates another and names a property that the module never sees

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure (titles state public behavior); `.agents/skills/typescript-unit-tests/SKILL.md` (a case costs maintenance and must add protection)
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:103-114` (duplicate of 76-87)
**Issue:** `treats a schema-valid empty list as a trustworthy response that can confirm absence` has the same arrange, act and expected value as `reports a deviceId confirmed absent on its second consecutive absence`. "Schema-valid" and "trustworthy" are properties of the caller's response. The module receives only a `readonly string[]` and cannot tell (`reconciliation.ts:14-17`).
**Fix:** Remove the duplicate with a ledger reason (the D-02 empty-list rule is already the act of `:76-87`). Or keep one case and title it with the module's behavior, for example `confirms absence from an empty list on the second consecutive omission`.
**Flags:** none

### CR-05-RECORDS-017 - WARNING: Three comments say that every stored time is local milliseconds

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does)
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:35, 56, 158-159`
**Issue:**

- `:35` says "the milliseconds every stored time is in", and `:158-159` says "every stored time is milliseconds". The stored watermarks (`context.watermarks.backupPumpTimestamp`, `testTimestamp`) hold the device's own Unix seconds, unconverted (`:276, 313`; `accessoryContext.ts:79-83` "Both members hold the device's own Unix seconds").
- `:56` documents `lastActivationAt` as "Milliseconds, local". A recovered activation stores `millisecondsOf(reportedAt)` (`:297`), which is the device's clock in milliseconds and not local time. `accessoryContext.ts:44-55` names both sources correctly.

**Fix:** `:35`: "What one second of a device timestamp is worth in milliseconds." `:158-159`: "...and every stored activation time is milliseconds; the watermarks stay in device seconds." `:56`: "Milliseconds of the last observed activation: the plugin's receipt time for a watched edge, or the device's converted timestamp for a recovered one; absent when none has been observed."
**Flags:** none

### CR-05-RECORDS-018 - WARNING: The pumpRecords overview says that the record holds nothing the device reported

**Rule:** `.agents/skills/typescript-style/rules/comments.md`
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:3, 5-8`
**Issue:** `:3` says "what this plugin watched each pump do, and nothing the device reported". `:7-8` says that the count is built "out of what the plugin saw while it was running". The record also counts a backup activation that only the device's timestamp shows (`:296-297`), timed by the device's clock. This includes a run while the plugin was stopped, which is recovered after a restart. The self-test label comes only from the device's two timestamps (`:175-187`).
**Fix:** For example: "CTRL-01: each pump's activations as this plugin observed them, plus backup activations the device's own timestamp shows the plugin missed." Change `:7-8` to the same meaning.
**Flags:** none

### CR-05-RECORDS-019 - WARNING: The `createPumpRecords` JSDoc says that creation touches nothing outside itself, but creation can log

**Rule:** `.agents/skills/typescript-style/rules/comments.md`
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:209-216` (against `:236, 244`)
**Issue:** "Creating them touches nothing outside itself: nothing is read from disk, nothing is scheduled, and no value is written until the first observation arrives." `resumedRecord()` runs during creation (`:244`) and calls `log.warn(...)` for an unreadable stored record (`:236`). The `DAMAGED_RECORDS` rows observe that warning.
**Fix:** "Creating them reads nothing from disk, schedules nothing and writes no value until the first observation arrives; an unreadable stored record is reported once, at creation."
**Flags:** none

### CR-05-RECORDS-020 - WARNING: The baseline comment says that the first timestamp always comes with the seeding observation

**Rule:** `.agents/skills/typescript-style/rules/comments.md`
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:278-283`; `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:206-208`
**Issue:** "The device times it from before the observation start that the same first observation seeded, so counting it would report a run from before the plugin was watching." The code treats the first timestamp the record ever sees as a baseline (`seedingTheFirstWatermark = stored.watermarks.backupPumpTimestamp === undefined`, `:274`), on any observation. This includes a resumed record whose watermark is still undefined. Probe P3: a fresh record saw two snapshots with no backup timestamp, then a timestamp of `1_800_000_100` seconds. That is later than the observation start (`1_800_000_000_000` ms), but the result was `activationCount: 0` and the watermark became that timestamp. The comment's reason holds only when the timestamp comes with the seeding observation. The behavior is the maintainer's ruling and is not in question. The comment states the reason as always true.
**Fix:** State the rule as the code applies it, for example: "The first timestamp this record ever sees establishes the baseline and is never counted. The plugin cannot tell whether the device timed it before observation began, and comparing it with local time is forbidden, so it abstains." Change the test comment to the same meaning.
**Flags:** none

### CR-05-RECORDS-021 - WARNING: The `storedContext` comment gives a reason that the module contradicts

**Rule:** `.agents/skills/typescript-style/rules/comments.md`
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:88-91`
**Issue:** "Starting the self-test cases here is what keeps the very first device timestamp from being recovered as an activation." The module never recovers the very first device timestamp: it seeds it as a baseline (`pumpRecords.ts:284-288`), and `:210-222` asserts this. The stored watermarks are needed so that a later timestamp is compared with a known watermark and not taken as the baseline.
**Fix:** For example: "Starting here gives the device timestamps a watermark to be compared against, so a newer one is a recovery rather than the first-seen baseline."
**Flags:** none

### CR-05-RECORDS-022 - WARNING: Two test comments cite planning history and planning artifacts

**Rule:** `.agents/skills/typescript-style/rules/comments.md` Forbidden in comments ("Any other phrasing whose only purpose is to record which planning artifact authored the line"; narration of a former shape)
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:209`; `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:17`
**Issue:** `pumpRecords.test.ts:209` says "Ruled 2026-09-01, reversing the plan as written." This records a planning decision and the plan that it replaced. `staleMarking.test.ts:17` cites "04-CONTEXT D-04", the file name of a phase planning document (from the v1.0 milestone), and not a decision ID.
**Fix:** Remove the sentence at `pumpRecords.test.ts:209`. At `staleMarking.test.ts:17`, keep `D-10` and either remove "04-CONTEXT D-04" or replace it with the stable decision ID that it refers to, if one exists.
**Flags:** none

### CR-05-RECORDS-023 - WARNING: `// act & assert` covers two `assert.throws()` calls that match a message substring

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("Use `// act & assert` only when one `assert.rejects()` or `assert.throws()` expression performs both") and Assertions ("Assert errors by class and structured fields, not by message substring")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:528-535`
**Issue:** One marker covers two `assert.throws()` statements, and each matches `/before anything was observed/`. The production error is a plain `Error` (`pumpRecords.ts:191`), so its class and full message are the only fields it has.
**Fix:** Write one data-driven sibling case per getter (`primary`, `backup`), each with one `assert.throws()` under `// act & assert`, that compares `{ name: 'Error', message: '<the full message>' }`.
**Flags:** none

### CR-05-RECORDS-024 - WARNING: Two array types with non-simple element types use `T[]`

**Rule:** `.agents/skills/typescript-style/rules/types.md` ("`T[]`/`readonly T[]` for simple element types, `Array<...>`/`ReadonlyArray<...>` otherwise")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:314, 441`
**Issue:** `(boolean | undefined)[]` is a union element type, and `readonly { readonly cause: string; readonly stored: Record<string, unknown> }[]` is an object-literal element type.
**Fix:** `Array<boolean | undefined>` and `ReadonlyArray<{ readonly cause: string; readonly stored: Record<string, unknown> }>` (or a named row interface).
**Flags:** none

### CR-05-RECORDS-025 - WARNING: The module-level `DAMAGED_RECORDS` rows are handed to the module as context, and the module writes into them

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("Each case gets fresh state ... Only a stateless stub ... may live at module scope") and Test data ("never shared mutable constants")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:441-506`
**Issue:** Each row's `stored` object is passed by reference as the context (`damagedContext(stored)`). The first observation's `seed()` then assigns `primaryPump`, `backupPump` and `watermarks` on that module-level object (`pumpRecords.ts:256-258`). Each row is used once, so no case reads another's mutation today. The table is still shared mutable state that the module under test changes.
**Fix:** Make `stored` a factory (`stored: () => ({ ... })`) and call it in the case, or `structuredClone(stored)` at the call.
**Flags:** none

### CR-05-RECORDS-026 - WARNING: Partial observation literals are not checked with `satisfies`

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Test data ("Typed literals, checked with `satisfies` when they stand in for a production type")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:308-311, 331, 347, 362, 383`
**Issue:** `idle`, `running`, `stopped`, `completed` and the `settled` literals stand in for `Partial<PumpRecordsObservation>`. They are passed as variables or spread into a literal, so no excess-property check reaches them. A misspelled key such as `testedat` compiles, and the field silently defaults to `undefined`, which changes what the case measures.
**Fix:** Add `satisfies Partial<PumpRecordsObservation>` to each literal.
**Flags:** none

### CR-05-RECORDS-027 - WARNING: Named local functions are arrows assigned to `const` without a function type

**Rule:** `.agents/skills/typescript-style/rules/functions.md` ("A named function is a function declaration; an arrow assigned to `const` only for an explicit function type or a nested function needing the outer `this`")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:41, 45`; `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:77`
**Issue:** `const discard = (): void => {...}`, `const warn = (message: string): void => void warnings.push(message)` and `const noop = (): void => {...}` are named local functions. They have no explicit function type and do not need an outer `this`. `reconciliation.test.ts:27` (after CR-04-ACCOUNT-032) and `controls.test.ts:67` show the two conforming forms.
**Fix:** Use `function discard(): void { ... }`, `function warn(message: string): void { warnings.push(message); }` and `function noop(): void { ... }`.
**Flags:** none

### CR-05-RECORDS-028 - WARNING: Four inline `as unknown as` casts sit outside one commented widening, and the namespace widening gives no reason

**Rule:** D-11 (`05-REVIEW-PROTOCOL.md` Test-double and gate rules: one commented block with `asService` and `asPlatformAccessory` helpers; no inline cast at a call site); `.agents/skills/typescript-style/rules/types.md` ("`as` ... only with an obvious or commented reason")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:26-29, 110-120, 431`
**Issue:** `accessory as unknown as PlatformAccessory` appears three times, once in each of `markStale`, `markUnreadable` and `refuseControls`, with no comment. `control as unknown as Service` is inline at the `binder.bind` call. The `HAP_NAMESPACE` comment ("widened where the pass takes the namespace the plugin is injected with") says where the cast is used, not why it is needed. The pattern at `controls.test.ts:48-56` says why: the stand-in carries only part of the real type, so no structural type admits it.
**Fix:** Next to `HAP_NAMESPACE`, add `asPlatformAccessory(accessory: HarnessPlatformAccessory): PlatformAccessory` and `asService(service: FakeHapService): Service`, each with a one-line reason. Give the namespace widening a reason in the same form. Replace the four casts with the helpers.
**Flags:** D-11

### CR-05-RECORDS-029 - WARNING: `readOf` depends on the stand-in's synchronous `handleGetRequest`

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Await every promise and asynchronous assertion"); D-16
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:122-136` (used at 260, 280-281, 302-303, 400)
**Issue:** Real HAP's `handleGetRequest` is `async` and rejects with the stored status (`Characteristic.js`). The stand-in throws synchronously (`features/lib/hap.ts:341-345`). `readOf` calls it in a synchronous `try`, so the "unreadable" assertions (`threw: COMMUNICATION_FAILURE`) are true only for the stand-in. Against real HAP, `threw` would always be `undefined`, and the rejection would go unhandled. The same cause was filed as CR-05-CATALOGUE-010 and CR-05-CONTROLS-018. Status parity for a pushed error is pinned against real HAP in `hapWriteFidelity.test.ts`, so no production line is hidden.
**Fix:** Make `readOf` `async`, `await held?.handleGetRequest()` in the `try`, and make the calling cases `async` with `await readOf(...)`. Keep the expected values.
**Flags:** D-16

### CR-05-RECORDS-030 - WARNING: Concise arrow bodies return a value that nothing reads

**Rule:** `.agents/skills/typescript-style/rules/functions.md` ("Concise arrow body only when the return value is used; a discarded value gets a block body or `void`")
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:88, 427`
**Issue:** `clearTimeout: () => undefined` and `clearInterval: () => undefined` implement `void` members (`src/runtime/timers.ts:31-33`), and `republish: () => undefined` implements `() => void` (`controls.ts:139`). `setTimeout`/`setInterval: () => undefined` return the handle, so they are not affected. This is the same cause as CR-05-CONTROLS-028.
**Fix:** Use block bodies with a `//` comment, as `silentLog` does.
**Flags:** none

### CR-05-RECORDS-031 - WARNING: Overview and JSDoc claims about where the passes run and who calls them are false for the credential pass

**Rule:** `.agents/skills/typescript-style/rules/comments.md`
**Location:** `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/staleMarking.ts:36-39, 41-45, 47-50, 150-156`
**Issue:**

- `:36-39`: "The passes therefore run where Homebridge hands each cached accessory back ... `configureAccessory` is the only code that runs ...". `markTrustReportsUnreadable` runs from `applyMonitoringHealth` when the credentials are rejected (`src/platform.ts:431-454`), not from `configureAccessory` (`:661-664`).
- `:47-50`: "the Cucumber harness stands in for `configureAccessory` and calls these same functions". `features/support/world.ts:23, 634-635` imports and calls only the two restart passes.
- `:150-156`: the credential pass "is exported rather than written inside the platform, so the Cucumber harness drives this code rather than a copy of it (D-12)". The harness never imports it. It drives the pass only through `applyMonitoringHealth` (`world.ts:694`), which would run the same code if the pass were written inside the platform. Its only direct importers are `src/platform.ts:17` and `test/platform.test.ts:26`.
- `:41-45` repeats `:8-12` almost word for word.

**Fix:** Say "the two restart passes" at `:36-39` and `:47-50`. At `:150-156`, give the reason that holds, or remove the export reason. Remove the repeated paragraph at `:41-45`.
**Flags:** none

## Seed and lead dispositions

| Lead | Disposition | Evidence |
| --- | --- | --- |
| S-05-03 | **Rejected** | `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure: "When a module has several exported entrypoints, use one top-level `describe()` per entrypoint (`describe("place")`, `describe("cancel")`)". The book's own reference case (same file, "Reference case") has a module whose one runtime export is the factory `createOrderService(...)`, and it groups its cases under `describe("place", ...)`, which is a method of the returned service (`orderService.place(cart())`). So the book counts the operations of a factory's returned object as the entrypoints. `reconciliation.test.ts:52, 144, 227` follow that shape exactly (`describe('observe')`, `describe('present')`, `describe('forget')` over `createReconciliation(...)`'s three methods), with no nesting. This differs from CR-05-DECLARATIONS-014 and 015, where the one `describe` repeated the single factory's name. One case sits in the wrong group; that is filed as CR-05-RECORDS-015, not under this lead. |
| S-05-07 | **Confirmed as CR-05-RECORDS-013** (WARNING, D-06) | `reconciliation.ts:77-114` reads only `options.log`. `clock` is required (`:51-54`), and the interface JSDoc says that it is "Everything the reconciliation state machine needs". Consumer: `src/runtime/accountRuntime.ts:346` (bounded D-06 edit; the runtime keeps `options.clock` for `createMonitoringHealth` at `:347`). Read-only impact runs: `tsconfig.json` exit 0, complete, no named-type consumer; `tsconfig.test.json` exit 0, complete, `test/accessories/reconciliation.test.ts`. |

## Candidates considered and not filed

- **`T | undefined` members of `PumpRecordValues` (`pumpRecords.ts:55-59`), `PumpRecordsObservation` (`:42-48`) and `PreviousDeviceTimes` (`:99-100`).** Not filed. `types.md` forbids `| undefined` "inside a type alias", and these are interfaces. Its "optionals over `| undefined`" preference does not fit here. `tsconfig.json:9` sets `exactOptionalPropertyTypes`, so `x?: T` and `x: T | undefined` are different contracts. The required-key form makes every producer state each member: `observationOf` (`basementGuardian.ts:420-432`) must state each undecoded field as `undefined`, and that is how "absent rather than defaulted" (`basementGuardian.ts:417-419`) is enforced at compile time. `recordValues` copies the persisted `PumpObservation`, whose `lastActivationAt` is also `number | undefined` (`accessoryContext.ts:56`, frozen by D-05). The consumer types (`PumpRecordProjection.lastActivationWasTestActivity: boolean | undefined`, `serviceCatalogue.ts:67`) match it. With `?:`, `recordValues` would need conditional spreads, and the whole-value assertions (`freshRecord()` states `lastActivationAt: undefined`) would change meaning. The only mismatch is that the persisted label is `?: boolean` while the value type is `: boolean | undefined`, and that is the correct translation of an optional stored member into a total value.
- **`reports nothing for a deviceId never observed present` (`reconciliation.test.ts:53-62`).** IDs enter only through presence (`observe` or `present`), so no plausible implementation can report an ID it never received. The case is cheap and correct, and I could not name a wrong implementation it misses that another case catches.
- **`resumes a stored record ...` compares with `first.records.primary`/`backup` (`pumpRecords.test.ts:121-134`).** The expected value comes from production output, which is not independent (`cases.md` Assertions). A resume that reseeds, drops `lastActivationAt` or swaps the pumps still fails, because the first instance holds distinct values (backup count 1 at `OBSERVED_NEXT_AT`). I found no plausible wrong implementation that passes, so this is not a BLOCKER. Writing the expected record literally would be better; I left this to the fixer of CR-05-RECORDS-003 rather than giving it its own ID.
- **`silentLog`/`createSilentLog` comments, "logging is not this module's job" (`staleMarking.test.ts:78`, `reconciliation.test.ts:28`).** `staleMarking` writes no line of its own; it passes `log` on. `reconciliation` writes one debug line (`:99`) that is not a preserved D-05 line, and no case reads it. This differs from CR-05-CONTROLS-027, where the module's own lines are a preserved contract.
- **`reconciliation.ts:99` hardcodes "two consecutive" beside `CONFIRMATION_THRESHOLD`, and repeats the line on every later poll.** The debug text is true (at least two consecutive omissions). No rule violation.
- **`pumpRecords.ts` interface members `primary`/`backup` (`:85-86`) have no JSDoc for their throw before the first observation.** Their purpose is clear from the name and type. The precondition is in the error message and at the one consumer (`basementGuardian.ts:525-527, 619-621`).
- **`ActivationWatermarks.testTimestamp` is written (`pumpRecords.ts:313`) but no rule reads it.** It is a persisted member of the `watermarks` key, preserved by D-05. Removing it is a persistence change and out of scope.
- **`staleMarking.ts:63-67` "The health gate fails a build on a third near-identical block".** `package.json:39` runs `fallow dupes --threshold 3`, which is part of the same `fallow` script as `fallow health`. The wording is loose ("health" versus "dupes"), and "keeping the copies was not an option" refers to a shape the code never kept. I could not show it false against the pinned fallow semantics, so it is not filed.
- **`lets the accessory own binder replace the refusal ...` (`staleMarking.test.ts:403-436`).** It depends on the stand-in's one-slot `onSet`. Parity for that is lead S-05-15 (GATES, D-16), not a RECORDS finding.
- **Test titles without the possessive ("the plugin own receipt", "another device absence count", "the accessory own binder").** Grammar only. Not a rule in the books.
- **`pumpRecords.test.ts:417-436` spies only the four timer APIs.** A `process.nextTick` or promise deferral escapes the spies, but every such deferral is caught by the synchronous result assertions in other cases (for example `persisted: 1` in `:107-119`).

## Header inspection

| File | Result |
| --- | --- |
| `src/accessories/pumpRecords.ts` | Gap: SPDX at line 1, `@fileoverview` JSDoc at line 2 with no blank line; no copyright block (CR-05-RECORDS-011). |
| `test/accessories/pumpRecords.test.ts` | Gap: opens with imports; no SPDX, copyright or overview (CR-05-RECORDS-011). |
| `src/accessories/reconciliation.ts` | Conforms (SPDX, blank, copyright block, blank, overview, blank, imports; from `e914a62`). |
| `test/accessories/reconciliation.test.ts` | Conforms (same layout; from `e914a62`). |
| `src/accessories/staleMarking.ts` | Gap: SPDX at line 1, `@fileoverview` at line 2 with no blank line; no copyright block (CR-05-RECORDS-012). |
| `test/accessories/staleMarking.test.ts` | Gap: opens with imports; no SPDX, copyright or overview (CR-05-RECORDS-012). |

## Toolchain evidence

All commands ran in the worktree at `0c0930e890cb41e74d0d4e854ba45c41a31fea4a`, `node --version` = `v26.12.0`. Start was 2026-10-17T23:57:47Z, and the end of the batch run was 2026-10-17T23:58:10Z. Raw output is in the session scratch directory.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | Both `tsc --noEmit` passes (src and test projects) are clean. |
| `npx eslint --max-warnings=0 <the six files>` | 0 | No output. Run without `--cache`, so the result is fresh. |
| `npm run build:test` | 0 | Clean compile to `dist-test`. |
| `node --test dist-test/test/accessories/pumpRecords.test.js` | 0 | TAP rerun: tests 33, suites 0, pass 33, fail 0, cancelled 0, skipped 0, todo 0. |
| `node --test dist-test/test/accessories/reconciliation.test.js` | 0 | TAP rerun: tests 14, suites 3, pass 14, fail 0, cancelled 0, skipped 0, todo 0. |
| `node --test dist-test/test/accessories/staleMarking.test.js` | 0 | TAP rerun: tests 18, suites 3, pass 18, fail 0, cancelled 0, skipped 0, todo 0. |
| `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` | 0 | Selector silent on success (100% lines, functions, branches). |
| `npm run test:coverage:direct -- src/accessories/reconciliation.ts test/accessories/reconciliation.test.ts` | 0 | Selector silent on success. |
| `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` | 0 | Selector silent on success. |

The owner tests first ran with the default reporter (exit 0, failures-only output). To record counts, they ran again with `--test-reporter=tap` (exit 0 each). No check failed, so no toolchain finding is filed. The probe script (`records-probe.mjs`, in the session scratch directory) imported only the compiled module and exited 0. It wrote no repository file.

## Out-of-scope observations

- `src/accessories/serviceCatalogue.ts:466-475` (`recordCandidates`, Phase 5 CATALOGUE, closed) publishes `LastActivationWasTestActivity` whenever the backup record carries a label, also when `lastActivationAt` is empty. That is the consumer side of CR-05-RECORDS-001. The cause and the fix belong in `pumpRecords.ts`, so this file needs no CR-05 ID.
- `src/persistence/accessoryContext.ts:85-88` (`ActivationWatermarks`, Phase 3). The fix for CR-05-RECORDS-002 needs an optional member here, as a bounded D-06 consumer task if the maintainer accepts it.
- `src/runtime/accountRuntime.ts:346` (Phase 4). The bounded consumer edit for CR-05-RECORDS-013. It does not reopen Phase 4's ACCOUNT counter.
- `features/lib/hap.ts:279-284` (`thrownStatusOf`, Phase 7 under D-12) maps every non-`HapStatusError` error to `-70402`, as real HAP does. This is not a defect. It is the reason why CR-05-RECORDS-009 needs a different status in the test.

## Coordinator triage

Triaged 2026-10-18 by the coordinator. All 31 findings are accepted as `open`; none is
rejected. Counts: opening 0, fixed 0, rejected 0, new 31, reopened 0, closing 31 (10 BLOCKER, 21
WARNING).

- **CR-05-RECORDS-001 and 002:** `open`, BLOCKER, and classified as genuine production bugs
  (D-04). The reviewer's read-only probes show both. The maintainer chose on 2026-10-18 to fix
  both in this batch ("Fix both now").
  - 001: the record must not hold a self-test label about an activation its device timestamps do
    not yet describe. The fix withholds classification while a counted backup run waits for its
    device timestamp and while the record holds no activation, and it clears the stored label
    when a new backup activation is counted. The catalogue drops an absent label, so HAP keeps
    serving the last published value until a new label is earned. That presentation question is
    out of this batch and goes to the phase verifier as an observation.
  - 002: the fix persists one optional member, the awaiting state, beside the watermarks. Absent
    means `false`, so a stored record needs no migration. The type is owned by
    `src/persistence/accessoryContext.ts` (Phase 3), so the fixer runs both D-06 impact commands
    first, and that edit is a bounded consumer edit. The persisted context keys `primaryPump`,
    `backupPump` and `watermarks` do not change (P-05-01).
  - Each runs the D-04 sequence with `05-PUMP-RECORDS-RED-EVIDENCE.json`; 002's record carries
    001's record in `priorEvidence`.
- **CR-05-RECORDS-003 to 010:** `open`, BLOCKER, as reported.
- **CR-05-RECORDS-011 and 012:** `open`, WARNING: one header finding per pair. The tracer output
  is in the ledger's `### 05-05` evidence.
- **CR-05-RECORDS-013:** `open`, WARNING, D-06. It confirms lead S-05-07. The consumer edit is
  bounded to `src/runtime/accountRuntime.ts:346`, after both impact commands.
- **CR-05-RECORDS-014 to 031:** `open`, WARNING, as reported. 015 cites CR-04-ACCOUNT-021 (D-10).
- **Leads:** S-05-03 is rejected on the reviewer's evidence. The book's reference case groups the
  operations of a factory's returned object under one `describe` each, as `reconciliation.test.ts`
  does. S-05-07 is confirmed as 013.
- **Repair order:** the pumpRecords header (011); then the D-04 bugs (001, then 002); then the
  remaining source causes and the test causes, file by file; any reindent goes last in its file.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-RECORDS-011 | `src/accessories/pumpRecords.ts`, `test/accessories/pumpRecords.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/pumpRecords.test.js` exit 0 (33 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts --max-warnings=0` exit 0; `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` exit 0 (`ACCESSORIES_HEADERS_OK files=2`); `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | header-only |
| CR-05-RECORDS-001 | `src/accessories/pumpRecords.ts`, `test/accessories/pumpRecords.test.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` exit 0; `npm run build:test` exit 0; target `node --test --test-reporter=tap --test-name-pattern='^withholds the self-test label from a watched backup run whose device timestamp has not arrived$' dist-test/test/accessories/pumpRecords.test.js` exit 0 (tests 1, pass 1); owner `node --test dist-test/test/accessories/pumpRecords.test.js` exit 0 (35 tests, 35 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; consumers: `node --test dist-test/test/accessories/basementGuardian.test.js` exit 0 (157 tests, 157 pass), `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` exit 0, `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 0 (212 tests, 212 pass), `npx cucumber-js` exit 0 (104 scenarios, 1156 steps, all passed); `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | RED evidence 9701899 (D-04). P4 control: wrong behavior = classification withheld only while a watched edge awaits its timestamp, not when the record holds no activation; recorded blob `fb9026b29d1c7fe5f341339734067da7531969fb`; with the mutation, build exit 0 and the P4 case exit 1 (`lastActivationWasTestActivity: true`, `persisted: 1`, `watermark: 1700000105` against expected absent label, `0` and `1700000005`); bytes restored (`git hash-object` = recorded blob, no-index diff against the saved copy exit 0), rebuild exit 0, P4 case exit 0 | `pumpRecords.ts`: a newly counted backup activation (watched edge or recovered timestamp) removes the stored label; `reconcileClassification` changes nothing while a watched edge awaits its timestamp or the backup record holds no activation; classification comments restated. Tests: added `withholds the self-test label from a record that holds no activation even when the self-test values have settled` (P4); the undecoded-timestamp case now earns its label from a recovered activation, since its old setup labelled a record with no activation |
| CR-05-RECORDS-002 | `src/accessories/pumpRecords.ts`, `test/accessories/pumpRecords.test.ts`, `src/persistence/accessoryContext.ts` (adaptation, inventory row 25), `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts src/persistence/accessoryContext.ts` exit 0; D-06 rerun at fb0a1d1: `fallow dead-code --type-aware --symbol-impact src/persistence/accessoryContext.ts:ActivationWatermarks` with `tsconfig.json` exit 0 (complete; accessoryContext.ts, pumpRecords.ts) and with `tsconfig.test.json` exit 0 (complete; adds test/persistence/accessoryContext.test.ts), stderr empty; `npm run build:test` exit 0; target `node --test --test-reporter=tap --test-name-pattern='^counts a watched backup run once across a restart before its device timestamp arrives$' dist-test/test/accessories/pumpRecords.test.js` exit 0 (tests 1, pass 1); owner `node --test dist-test/test/accessories/pumpRecords.test.js` exit 0 (37 tests, 37 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` exit 0; `node --test dist-test/test/persistence/accessoryContext.test.js` exit 0 (1 test, 1 pass); `npm run test:coverage:direct -- src/persistence/accessoryContext.ts test/persistence/accessoryContext.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts src/persistence/accessoryContext.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; consumers: `node --test dist-test/test/accessories/basementGuardian.test.js` exit 0 (157 tests, 157 pass), `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` exit 0, `npx cucumber-js` exit 0 (104 scenarios, 1156 steps, all passed); `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | RED evidence fb0a1d1 (D-04) | `accessoryContext.ts`: `ActivationWatermarks` gains the optional `backupEdgeAwaitingTimestamp?: boolean` (absent means no counted run waits, so stored records need no migration); the timestamp-members JSDoc is restated for three members. `pumpRecords.ts`: the in-memory flag is gone; a watched backup edge sets the stored mark, first-timestamp seeding and absorption `delete` it, and absorption and `reconcileClassification` read it; `isActivationWatermarks` accepts it only as a boolean or absent; the absorption and seeding comments say the mark is stored. Tests: the active regression case is committed unchanged; a damaged-record row with a non-boolean mark covers the new validation branch. The top-level context keys `primaryPump`, `backupPump` and `watermarks` are unchanged, as are seeding, absorption, the classification rule, the absence of a clock, the one persist per changed observation and every log line |
| CR-05-RECORDS-001 | `src/persistence/accessoryContext.ts` (adaptation, inventory row 25), `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/persistence/accessoryContext.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/persistence/accessoryContext.test.js` exit 0 (1 test, 1 pass); `npm run test:coverage:direct -- src/persistence/accessoryContext.ts test/persistence/accessoryContext.test.ts` exit 0; `node_modules/.bin/eslint src/persistence/accessoryContext.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | n/a | Comment follow-up of the 001 fix: the `lastActivationWasTestActivity` JSDoc now says that a newly counted backup activation removes the label, and that only an observation that neither counts an activation nor computes a label leaves it where it was. Comment lines only |
| CR-05-RECORDS-012 | `src/accessories/staleMarking.ts`, `test/accessories/staleMarking.test.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/staleMarking.test.js` exit 0 (18 tests, 18 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; `node --test dist-test/test/platform.test.js` exit 1 (70 tests, 69 pass, 1 fail: `asks Homebridge to store the accessory whose snapshot counted an activation, and no other`, whose expected `watermarks` lack `backupEdgeAwaitingTimestamp: true`; the same case fails at 090ead6 with these edits removed, so it is not caused here; it is outside this dispatch's paths); `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0 (`ACCESSORIES_HEADERS_OK files=2`); `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | Header-only. The source gains the blank line and the copyright block and keeps its SPDX line and overview text; the test gains the SPDX line, the copyright block and a one-sentence overview |
| CR-05-RECORDS-031 | `src/accessories/staleMarking.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/staleMarking.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/staleMarking.test.js` exit 0 (18 tests, 18 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; `node --test dist-test/test/platform.test.js` exit 1 (70 tests, 69 pass, 1 fail: the same case as in the CR-05-RECORDS-012 row, which also fails at 090ead6); `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | Comment lines only. Checked against `src/platform.ts` (`configureAccessory` calls the two restart passes; `applyMonitoringHealth` calls the credential pass) and `features/support/world.ts` (imports and calls only the two restart passes). The overview now says "the two restart passes" where it names `configureAccessory` and the Cucumber harness; the paragraph that repeated the constructor reason is removed; the credential pass JSDoc keeps the walk reason and drops the false export reason |
| CR-05-RECORDS-008 | `test/accessories/staleMarking.test.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/staleMarking.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/staleMarking.test.js` exit 0 (18 tests, 18 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | Wrong behavior: the pass still walks and counts every control but arms only the first. Recorded blob `4c26ae9fa332ff0ba0c026bd4cb3e6aa5aa7aa10`; with the mutation, build exit 0 and `node --test --test-reporter=tap --test-name-pattern='^refuses a press on every restored control and counts the controls it armed$'` exit 1 (`selfTest: undefined` against expected `-70412`, with `armed: 2` and `alarmMute: -70412` matching); restored with `git checkout`, `git hash-object` = recorded blob, `git diff --exit-code` exit 0; rebuild exit 0, the case exit 0 (1 pass) | The press case now carries both control Switches (`alarm-mute` and `system-self-test`) and asserts `armed: 2` and a `-70412` refusal from each press |
| CR-05-RECORDS-009 | `test/accessories/staleMarking.test.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/staleMarking.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/staleMarking.test.js` exit 0 (18 tests, 18 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | Wrong behavior: the pass ignores its `status` argument and pushes `SERVICE_COMMUNICATION_FAILURE`. Recorded blob `4c26ae9fa332ff0ba0c026bd4cb3e6aa5aa7aa10`; with the mutation, build exit 0 and `node --test --test-reporter=tap --test-name-pattern='^makes a read of every marked service throw the status it was given, and leaves the value it held$'` exit 1 (`threw: -70402` against expected `-70403` on both services); restored with `git checkout`, `git hash-object` = recorded blob, `git diff --exit-code` exit 0; rebuild exit 0, the case exit 0 (1 pass) | The test marks the trust reports under `RESOURCE_BUSY` (`-70403`) in place of `-70402`, the status HAP and the stand-in give any error that names no status, and asserts `threw: -70403` on each marked service |
| CR-05-RECORDS-010 | `test/accessories/staleMarking.test.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/staleMarking.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/staleMarking.test.js` exit 0 (19 tests, 19 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts --max-warnings=0` exit 0 (after one blank-line fix in the new case; the first run exited 1 on `@stylistic/padding-line-between-statements`); `npm run typecheck` exit 0; `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | Wrong behavior: the pass binds its own `onSet` that logs `Refused <service>: the accessory was restored.`, throws `HapStatusError(-70412)` and arms no push, in place of calling `bindRestoredControlRefusal`. Recorded blob `4c26ae9fa332ff0ba0c026bd4cb3e6aa5aa7aa10`; with the mutation, build exit 0 and `node --test --test-reporter=tap --test-name-pattern='^refuses a restored press with the transport status and cause, and clears the status once the push runs$'` exit 1 (`delays: []` against `[0]`, `readAfterPush.threw: -70412` against `undefined`, and the warning line differs; `press: -70412` matches); restored with `git checkout`, `git hash-object` = recorded blob, `git diff --exit-code` exit 0; rebuild exit 0, the case exit 0 (1 pass) | New case `refuses a restored press with the transport status and cause, and clears the status once the push runs`: it arms through a warning-collecting log and a deferral recorder, then asserts the `-70412` press, the exact warning line with the transport cause (written out in the test), one `0` ms deferral, a read that throws `-70412` before the push and a read that answers `true` with no status after it. `refuseControls` delegates to the new `refuseControlsWith`, so the inline cast count stays four |
| CR-05-RECORDS-028 | `test/accessories/staleMarking.test.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/staleMarking.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/staleMarking.test.js` exit 0 (19 tests, 19 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; `grep -n 'as unknown as' test/accessories/staleMarking.test.ts` lists lines 50, 54 and 59 only, all inside the widening block; `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | D-11: one commented widening block beside `HAP_NAMESPACE` holds the namespace widening and the new `asPlatformAccessory(accessory: HarnessPlatformAccessory): PlatformAccessory` and `asService(service: FakeHapService): Service`, with the reason no structural type admits a stand-in. The three `PlatformAccessory` casts in `markStale`, `markUnreadable` and `refuseControlsWith` and the `Service` cast at `binder.bind` now call the helpers. No production type changes |
| CR-05-RECORDS-029 | `test/accessories/staleMarking.test.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/staleMarking.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/staleMarking.test.js` exit 0 (19 tests, 19 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | D-16: `readOf` is `async` and awaits `handleGetRequest()` inside its `try`, so a rejected read is caught as real HAP answers it. Its five callers are `async` and await it; every expected record is unchanged |
| CR-05-RECORDS-030 | `test/accessories/staleMarking.test.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/staleMarking.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/staleMarking.test.js` exit 0 (19 tests, 19 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | `heldTimers`' `clearTimeout` and `clearInterval` and the binder case's `republish` get block bodies with a `//` comment saying why they do nothing. `setTimeout` and `setInterval` keep their concise bodies, because they answer the handle. The deferral recorder added for CR-05-RECORDS-010 already used block bodies |
| CR-05-RECORDS-002 | `test/platform.test.ts` (adaptation, inventory row 26), `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard test/platform.test.ts` exit 0; `npm run build:test` exit 0; before the edit, `node --test --test-name-pattern='asks Homebridge to store the accessory whose snapshot counted an activation, and no other' dist-test/test/platform.test.js` exit 1 (1 test, 0 pass, 1 fail; the diff adds only `backupEdgeAwaitingTimestamp: true` to the `watermarks` in `currentContexts` and `persistedContexts`); after the edit, `npm run build:test` exit 0; the same case exit 0 (1 test, 1 pass); owner `node --test dist-test/test/platform.test.js` exit 0 (70 tests, 70 pass, 0 fail); `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` exit 0; `node_modules/.bin/eslint test/platform.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; every unit module `node --test $(find dist-test/test -name '*.test.js' \| sort)` exit 0 (59 modules, 1631 tests, 1631 pass, 0 fail); `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | n/a (consumer expectation) | Consumer follow-up of the 002 fix `5e753ca`. `expectedSecondContext` (the stored context of the accessory that counted the watched backup run) gains `backupEdgeAwaitingTimestamp: true` in its `watermarks`, because that run's device timestamp has not arrived and the fix now stores the mark. The first accessory's context and the seed expectations count no run, so they are unchanged. No other line of the case or the file changes. The fix's own consumer checks ran `basementGuardian` and Cucumber, but not this Phase 6 test, so they missed it |
| CR-05-RECORDS-017 | `src/accessories/pumpRecords.ts`, `.planning/phases/05-accessories-conformance/05-RECORDS-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/pumpRecords.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/pumpRecords.test.js` exit 0 (37 tests, 37 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/pumpRecords.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base 0c0930e890cb41e74d0d4e854ba45c41a31fea4a --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | Comment lines only. `MILLISECONDS_PER_SECOND` JSDoc: "worth in milliseconds", without the claim that every stored time is milliseconds. `PumpRecordValues.lastActivationAt` JSDoc: the plugin's receipt time for a watched edge or the device's converted timestamp for a recovered one, not "local". `millisecondsOf` comment: a stored activation time is milliseconds, a recovered activation's time is converted here and nowhere else in this module, and the watermarks stay in device seconds; the rest of that comment is rewrapped with the same words. The finding cites `src/persistence/accessoryContext.ts:44-55, 79-83` as correct references only; no line outside the owned paths needs a change |
