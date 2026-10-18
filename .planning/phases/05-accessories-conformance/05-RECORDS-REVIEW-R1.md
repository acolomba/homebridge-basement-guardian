---
phase: 05-accessories-conformance
batch: RECORDS
review_round: 1
reviewed: 2026-10-18T02:13:12Z
depth: deep
source_revision: 8e7a2463c53546cbd80f135ea2974b4ec8d85ef7
files_reviewed: 9
files_reviewed_list:
  - src/accessories/pumpRecords.ts
  - test/accessories/pumpRecords.test.ts
  - src/accessories/reconciliation.ts
  - test/accessories/reconciliation.test.ts
  - src/accessories/staleMarking.ts
  - test/accessories/staleMarking.test.ts
  - src/persistence/accessoryContext.ts
  - test/platform.test.ts
  - src/runtime/accountRuntime.ts
findings:
  blocker: 2
  warning: 4
  total: 6
status: issues_found
reviewer: gsd-code-reviewer (correction round 1)
---

# Phase 5 RECORDS batch: correction round 1

Revision `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7` equals `git rev-parse HEAD`, and
`git status --porcelain` was empty before the review started and after the last command. I read
every line of the six core files fresh and in full at this revision. For the three adaptation rows,
I read the hunks changed since the batch base `0c0930e890cb41e74d0d4e854ba45c41a31fea4a` and their
enclosing declarations: `PumpObservation` and `ActivationWatermarks` in
`src/persistence/accessoryContext.ts`; the case `asks Homebridge to store the accessory whose
snapshot counted an activation, and no other` in `test/platform.test.ts`; and the
`createReconciliation` call in `createAccountRuntime`, with its reconciliation call sites, in
`src/runtime/accountRuntime.ts`. The rest of those three files belongs to their owning phases.

I applied the three `.agents/skills/` books (each `SKILL.md` with every file in `rules/`). Where the
`.claude/rules/*.md` copies that Claude Code loads differ from them, `.agents/skills/` wins. Severities
follow each book's "Classifying findings" section. There is no Info tier.

I used two read-only probes of the compiled module `dist-test/src/accessories/pumpRecords.js` with
made-up inputs (`seed-probe.mjs` and `two-edge-probe.mjs`, both in the session scratch directory,
both exit 0). I changed no source or test file, ran no mutation experiment and made no commit.

## Round status

Opening open IDs: 31 (CR-05-RECORDS-001 to 031). Result: 31 fixed, 0 still open, 0 reopened.

| ID | Status | Evidence at `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7` |
| --- | --- | --- |
| CR-05-RECORDS-001 | fixed | `src/accessories/pumpRecords.ts:336` withholds classification while the stored awaiting mark is set or the backup record holds no `lastActivationAt`. `:370` and `:325` remove the label when a watched edge or a recovered timestamp counts a backup activation. The two filed scenarios stay fixed: P1 is `test/accessories/pumpRecords.test.ts:580-607` and P4 is `:522-542`, and both pass. The seeding branch at `:311-315` was not part of either filed scenario, and the 001 fix did not change it. A probe shows that it can still produce a label about the wrong activation. I filed that as a new cause, CR-05-RECORDS-032, and not as a reopen: P1 and P4 do not return, and the seeding branch behaves as it did at the batch base. The gap in the test of the recovered-activation half of the fix is CR-05-RECORDS-033. |
| CR-05-RECORDS-002 | fixed | The awaiting state is the optional stored `watermarks.backupEdgeAwaitingTimestamp` (`src/persistence/accessoryContext.ts:90-99`). `pumpRecords.ts:371` sets it, `:312` and `:318` remove it, `:146-149` validate it, and `:317` and `:336` read it. The regression case `pumpRecords.test.ts:331-349` and the damaged-record row `:711-718` pass. The consumer expectation `test/platform.test.ts:3319` carries the stored mark. A restart on a record that has no backup watermark yet still double counts, but through the seeding branch. That is part of CR-05-RECORDS-032. |
| CR-05-RECORDS-003 | fixed | `pumpRecords.test.ts:217-234` asserts the watermark and `persisted: 1` for the recovery. `:304-326` starts from `storedContext()`, takes the persist delta around the absorbing observation and repeats the timestamp. |
| CR-05-RECORDS-004 | fixed | `pumpRecords.test.ts:474-517`: three `withholds the self-test label when ...` rows from `storedContextWithAnActivation()`, each with a whole-value assertion. I traced each row against the three wrong rules, and each makes its row fail. |
| CR-05-RECORDS-005 | fixed | `pumpRecords.test.ts:544-575`: the stored label equals the computed label, so only the watermark moves, and the case asserts `persistedForTheClassification: 1`. |
| CR-05-RECORDS-006 | fixed | `pumpRecords.test.ts:649-750`: the exact `UNREADABLE_RECORD_WARNING` array in every row and in the identifier case. That case's context carries `deviceId` and `serialNumber`. |
| CR-05-RECORDS-007 | fixed | `reconciliation.test.ts:210-224` acts with two omissions after `forget` and asserts `{ afterFirstOmission: [], afterSecondOmission: [DEVICE_ID] }`. |
| CR-05-RECORDS-008 | fixed | `staleMarking.test.ts:428-447`: one accessory carries both control Switches, and the case asserts `armed: 2` and `-70412` from each press. |
| CR-05-RECORDS-009 | fixed | `staleMarking.test.ts:29, 356-376`: the trust reports are marked under `-70403`, which no default mapping produces. A pass that ignores `status` now reads `-70402`. The comment clause that the fix kept is a new cause, CR-05-RECORDS-036. |
| CR-05-RECORDS-010 | fixed | `staleMarking.test.ts:449-482`: it records each deferral, asserts `delays: [0]`, and reads `-70412` before the push and no status after it. |
| CR-05-RECORDS-011 | fixed | `pumpRecords.ts:1-9` and `pumpRecords.test.ts:1-9` have the D-01 layout. The tracer printed `ACCESSORIES_HEADERS_OK files=6` (exit 0). |
| CR-05-RECORDS-012 | fixed | `staleMarking.ts:1-9` and `staleMarking.test.ts:1-9` have the D-01 layout. The same tracer run covers them. |
| CR-05-RECORDS-013 | fixed | `reconciliation.ts:48-51` has only `log`, and the file has no `Clock` import. `accountRuntime.ts:346` calls `createReconciliation({ log: options.log })`. `reconciliation.test.ts:40-42` builds no clock. |
| CR-05-RECORDS-014 | fixed | `reconciliation.ts:11-16` names all three inputs. "successful (2xx)" matches the client's `response.ok` check. |
| CR-05-RECORDS-015 | fixed | `reconciliation.test.ts:226-239` is under `describe('forget')`. |
| CR-05-RECORDS-016 | fixed | The duplicate is gone. `reconciliation.test.ts:72-83` keeps the empty-list confirmation. |
| CR-05-RECORDS-017 | fixed | `pumpRecords.ts:45`, `:66-70` and `:176-181` give the units correctly. |
| CR-05-RECORDS-018 | fixed | `pumpRecords.ts:8-9`, `:11-17` and `:28-29` name the recovered activations. |
| CR-05-RECORDS-019 | fixed | `pumpRecords.ts:235-242` names the one warning at creation. |
| CR-05-RECORDS-020 | fixed | The baseline rule is stated as the code applies it: `pumpRecords.ts:305-307` in the source and `pumpRecords.test.ts:236-238` in the test. The next sentence (`:307-310`) is a different claim: that the baseline stands for an awaited run's timestamp. It is not the claim that 020 named, so it is filed as new cause CR-05-RECORDS-034. |
| CR-05-RECORDS-021 | fixed | `pumpRecords.test.ts:100-103` gives a reason that matches the module. |
| CR-05-RECORDS-022 | fixed | `grep -n "Ruled\|CONTEXT\|plan as written"` over both test files: no hit. |
| CR-05-RECORDS-023 | fixed | `pumpRecords.test.ts:755-766`: one `assert.throws` case per getter, with the full message. |
| CR-05-RECORDS-024 | fixed | Only simple element types remain (`readonly WithheldLabelRow[]`, `readonly DamagedRecordRow[]`, `string[]`, `Deferral[]`). The two label arrays are inferred. |
| CR-05-RECORDS-025 | fixed | `pumpRecords.test.ts:654-724`: each row holds a `stored()` factory, and each case calls it. |
| CR-05-RECORDS-026 | fixed | All twelve partial observation literals end in `satisfies Partial<PumpRecordsObservation>` (`:371-394, 413-418, 434-439, 454-459, 526-531, 554-559, 584-591`). |
| CR-05-RECORDS-027 | fixed | `pumpRecords.test.ts:51-57` and `staleMarking.test.ts:108-110` are function declarations. |
| CR-05-RECORDS-028 | fixed | `as unknown as` appears only at `staleMarking.test.ts:50, 54, 59`, inside the commented widening block `:45-60`. |
| CR-05-RECORDS-029 | fixed | `staleMarking.test.ts:213-224`: `readOf` is `async` and awaits the read. Every caller awaits it. |
| CR-05-RECORDS-030 | fixed | `staleMarking.test.ts:140-145, 165-170, 556-558` are block bodies. The concise `setTimeout` and `setInterval` bodies return the handle that `Timers` declares (`src/runtime/timers.ts:27-29`). |
| CR-05-RECORDS-031 | fixed | `staleMarking.ts:41-50` says "the two restart passes", `:150-153` gives the walk reason only, and the repeated paragraph is gone. I checked these against `src/platform.ts:448-454, 661-664` and `features/support/world.ts:23, 634-635`. |

Arithmetic: opening 31 - fixed 31 - rejected 0 + new 6 + reopened 0 = closing 6.

## Findings

### CR-05-RECORDS-032 - BLOCKER: First-timestamp seeding removes the awaiting mark, so a watched backup run can count twice and get a self-test label from older timestamps

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); D-05 (no guessed values, narrow trust); the module's own D-010 and C-001 contract at `src/accessories/pumpRecords.ts:23-26` (a watched run and its own timestamp are not counted twice) and `:31-34` (the label "stays unwritten ... until the device timestamps describe that activation")
**Location:** `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/accessories/pumpRecords.ts:301-315` (with `:336`); `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:253-272`
**Issue:** `reconcileBackupTimestamp` treats the first timestamp a record ever sees as the baseline. It also deletes `backupEdgeAwaitingTimestamp` at `:312`. That is correct only when this first timestamp is the watched run's own. The Gemini decoder treats `backup_pump_timestamp` as optional (`src/device/gemini.ts:251-253, 292`). So a decoded pump group can carry a watched `backupRunning` edge while the timestamp is absent, and the next payload can carry the device's older timestamp. The probe printed these results:

- S1, a fresh record. `backupRunning: false` with no timestamp, then the edge (count 1, mark set), then the older `1_700_000_000` (seeded, mark removed), then the run's own `1_700_000_100`. Result: `activationCount: 2, lastActivationAt: 1700000100000`. One physical run is counted twice, and its last activation moves to the device clock. That is the D-010 result that `:23-26` says the module prevents. The existing case `counts a later advance after a seed that also absorbed a watched edge` (`pumpRecords.test.ts:257-272`) drives the same sequence (no timestamp, edge, `PRIOR_BACKUP_SECONDS` at the stop, then `NEW_BACKUP_SECONDS`), and it pins `count: 2` as correct.
- S3, a restart variant. The context is persisted with the mark set and no backup watermark, then resumed, then the same two timestamps arrive. Result: `activationCount: 2`. The 002 fix does not cover this path.
- S5, a wrong label. The S1 sequence, where the older timestamp arrives with a settled older self-test pair (`testedAt: 1_700_000_005`, `testRunning: false`). After the second settled observation, the result is `activationCount: 1, lastActivationAt: 1800000060000, lastActivationWasTestActivity: true`. The watched real run gets the self-test label from device timestamps that predate it, because the seed removed the only fact (`:336`) that withholds classification. This is the symptom of CR-05-RECORDS-001, through a path that the 001 fix did not change. The branch behaved the same way at the batch base, so this is not a regression.

The alternative, keeping the mark through seeding, has its own failure. If the first timestamp is the run's own, which is the usual case for a device that never ran its backup pump before (probe S4), the next timestamp is absorbed. That timestamp is a second run if the plugin missed that run. The module cannot tell these two cases apart without comparing device time with local time, which `:176-181` and `accessoryContext.ts:80-85` forbid. So the choice is a behavior decision, and the case at `:257-272` pins the current choice.
**Fix:** The coordinator and maintainer decide this under D-04. One option keeps the awaiting mark when the first-ever timestamp arrives while it is set. It deletes the mark only at absorption, so the count abstains on the next advance, and classification stays withheld until a timestamp arrives that the module treats as the run's own. The cost is a possible undercount of one missed run directly after a first-ever timestamp. Under this option, `counts a later advance after a seed that also absorbed a watched edge` changes its expectation, and an active regression case such as `counts a watched backup run once when the first device timestamp arrives after its edge` is seen RED first. If the maintainer keeps the current trade-off, record the reason, and restate the comments in CR-05-RECORDS-034 so that they do not promise the opposite.
**Flags:** D-04

### CR-05-RECORDS-033 - BLOCKER: No case shows that a recovered backup activation removes a stored self-test label

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case discriminates the behavior it covers); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (a case a wrong implementation would pass)
**Location:** `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/accessories/pumpRecords.ts:323-325`; `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:217-234, 486-517, 544-575, 580-607`
**Issue:** The 001 fix removes the label at two sites: a watched edge (`:370`) and a recovered timestamp (`:325`). The overview and `accessoryContext.ts:66` promise both ("each newly counted backup activation removes it"). The edge site is discriminated: in `withholds the self-test label from a watched backup run ...`, the label must be `undefined` right after the edge. No case recovers an activation while a label is stored. I traced every case that runs `:323-325`: the cases at `:217`, `:257`, `:287`, `:353`, `:410`, `:431`, `:451`, row 1 at `:486`, and the first observation at `:580`. Each starts from a record with no label. The one case that stores a label (`:547-575`) observes the timestamp that is already the watermark, so it recovers nothing. Plausible wrong implementation: the 001 fix without `dropTestActivityLabel(stored.backupPump)` at `:325`. A missed run recovered from the device timestamp then keeps the earlier activation's `true`. Classification is withheld on that observation, because the backup timestamp moved, so nothing replaces the label. HomeKit then reports a real missed basement run as a self-test. Every case passes, and `:325` stays covered, because the line runs.
**Fix:** Add a case from a context like the one at `:549-552`: `storedContextWithAnActivation()` with `lastActivationWasTestActivity: true`. Observe one settled snapshot, then a snapshot whose backup timestamp is past the watermark (for example `1_700_000_160`). Assert the whole `records.backup`: `{ observationStartedAt: OBSERVED_AT, activationCount: 2, lastActivationAt: 1_700_000_160_000, lastActivationWasTestActivity: undefined }`. For example, the title is `removes the stored self-test label when a device timestamp recovers a missed backup run`. Run the assertion control with `:325` removed.
**Flags:** none

### CR-05-RECORDS-034 - WARNING: Comments state as fact that the first-seen baseline is the timestamp of an awaited run

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does)
**Location:** `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/accessories/pumpRecords.ts:31-34, 293-295, 307-310, 331-334`; `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:253-256`
**Issue:**

- `:307-310` says that "The baseline also stands for the timestamp of any watched edge that awaits one". The module cannot know that. The first-seen timestamp can predate the edge (CR-05-RECORDS-032, probe S1).
- `:293-295` says that a record resumed after a restart "still absorbs the timestamp of the run it already counted". A resumed record that has no backup watermark seeds that timestamp and counts the next advance (probe S3).
- `:331-334` says that classification "runs only when the record holds a backup activation and that activation's device timestamp has arrived". `:336` checks only the stored mark and `lastActivationAt`. After seeding removes the mark, classification runs on timestamps that are not that activation's (probe S5).
- `:31-34` says that the label "stays unwritten ... until the device timestamps describe that activation". Probe S5 writes it from older timestamps.
- In the test, `:253-256` says that "an edge already awaiting its timestamp is accounted for by that same seed", and that the later advance in the case is "a genuinely missed run". In the case's own sequence, `PRIOR_BACKUP_SECONDS` comes before the stop and `NEW_BACKUP_SECONDS` after it. By `:298-300`'s own D-010 reasoning, `NEW_BACKUP_SECONDS` is the watched run's timestamp. The comment also still says "flag", but the state is now a stored mark.

These sentences are false whatever the decision on CR-05-RECORDS-032. If the behavior stays, they promise the opposite. If the behavior changes, they change with it.
**Fix:** If CR-05-RECORDS-032 keeps the current behavior, state the assumption and its limit. For example, at `:307-310`: "The module cannot tell whether the first timestamp is an awaited run's own or an older one, and it assumes it is the run's own: the mark clears here and the next advance counts. If the first timestamp is older, the run's own timestamp counts it a second time." Narrow `:293-295`, `:331-334` and `:31-34` in the same way, and restate the test comment as the rule the case pins, without "genuinely missed". If CR-05-RECORDS-032 changes the behavior, rewrite these sentences in that fix.
**Flags:** none

### CR-05-RECORDS-035 - WARNING: A test comment says that HomeKit stops reporting the self-test label when the record holds none

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does)
**Location:** `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:577-579`
**Issue:** "Until the device publishes the timestamp of that run, the record holds no label, so HomeKit does not report a real basement run as a self-test." The first half is true of the record. The "so HomeKit does not report" half is false. `recordCandidates` (`src/accessories/serviceCatalogue.ts:466-475`) gives an absent label as `undefined`, and `published` (`:340-350`) drops every `undefined` candidate. So no push happens, and HAP keeps serving the last published `true` for the whole window. The coordinator recorded this presentation as a question outside the batch. This batch comment claims that the question does not exist.
**Fix:** Keep the claim on the record. For example: "Until the device publishes the timestamp of that run, the record holds no label, so it no longer says that the last activation was a self-test."
**Flags:** none

### CR-05-RECORDS-036 - WARNING: The `RESOURCE_BUSY` comment gives a protection that this constant does not give

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does)
**Location:** `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/staleMarking.test.ts:26-29, 31-33`
**Issue:** `:26-27` says that the status is "written independently of the stand-in so a drifted number fails here". `RESOURCE_BUSY` goes in as `markTrustReportsUnreadable`'s `status` argument. It reaches `new hap.HapStatusError(status)` (`serviceCatalogue.ts:1005-1008`), and the stand-in keeps any number it is given (`features/lib/hap.ts:115-118, 278-283`). The assertion compares the same constant. No path reads the stand-in's `HAPStatus.RESOURCE_BUSY`, so a drifted number on either side fails nothing. The clause stayed when CR-05-RECORDS-009 replaced `-70402`, and its referent is now different. The real protection is the second sentence (a pass that ignores its argument reads `-70402`). `:31-32` (`NOT_ALLOWED_IN_CURRENT_STATE`) borrows "the same reason as the one above". That reason does hold for `-70412`, because `notAllowedInCurrentState` reads `hap.HAPStatus` (`controls.ts:321-323`). But it refers to a sentence that is false for its own constant.
**Fix:** At `:26-28`, remove "written independently of the stand-in so a drifted number fails here" and keep the second sentence as the reason. At `:31-32`, state the reason in full: "Written out rather than read from the stand-in, because the refusal reads the status from the injected namespace, so a drifted number there fails here."
**Flags:** none

### CR-05-RECORDS-037 - WARNING: Two declarations that the batch changed in `accessoryContext.ts` keep claims that the record contradicts

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does); `.agents/skills/typescript-style/rules/naming-and-docs.md` (every export is documented)
**Location:** `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/persistence/accessoryContext.ts:37-39, 73-74`
**Issue:**

- `PumpObservation` (the 001 follow-up changed this declaration at `:63-68`). Its `observationStartedAt` JSDoc says: "so it reports what it watched rather than a lifetime total the device never supplied". The count also holds backup activations that the plugin did not watch and that it recovered from the device timestamp. Those include a run while the plugin was stopped (`pumpRecords.ts:323-324`). CR-05-RECORDS-018 corrected the same claim in `pumpRecords.ts:8-17`.
- `ActivationWatermarks` (the 002 fix added a member at `:90-99`). Its summary says: "The highest device timestamp already turned into an activation record." The interface now holds a boolean mark beside two timestamps. The backup member can also hold the first-seen baseline, which is never counted (`pumpRecords.ts:305-315`). The self-test member holds a self-test timestamp that classification consumed (`pumpRecords.ts:348`), not an activation.
**Fix:** `:37-39`: "...so it reports what it watched, plus backup runs that the device timestamp shows it missed, rather than a lifetime total the device never supplied." `:73-74`: "The device timestamps already accounted for, and whether a counted backup run still awaits its own timestamp." Change the comment lines only, in this adaptation row.
**Flags:** none

## Candidates considered and not filed

- **The `silentLog` comment "logging is not this module's job" (`staleMarking.test.ts:109`).** Not filed. The comment uses the book's own wording ("assert log calls only in a module whose job is logging", `test-doubles.md`). `staleMarking` writes no line itself. Its `log` parameter goes only to `bindRestoredControlRefusal`, whose `log.warn` (`controls.ts:472`) is the control module's preserved refusal line (D-05). The one case that reads the line (`:452-482`) says why at `:449-451`: the refusal is the control module's. The rest of the comment ("the stub discards every call") is true for every case that uses `silentLog`. So the comment and the restart pass do not conflict.
- **Asserting the refusal warning in `staleMarking.test.ts:476`, in a module whose job is not logging.** Not filed. The title promises "the transport status and cause". The cause appears only in that line. The line is a D-05-preserved refusal line. Reading it through the public pass shows that the pass uses the control module's refusal, which was CR-05-RECORDS-010's point.
- **The same comment in `reconciliation.test.ts:26`.** Not filed. `reconciliation` writes one debug line (`:96`), which `ReconciliationOptions` now documents (`:48`). It is not a logging module, and no case reads the line.
- **Two watched backup edges before either device timestamp.** I probed a record with a stored watermark: edge, stop, edge, then `…100` at the second stop, then `…200`. Result: `activationCount: 3` for two runs. The mark is a boolean, so it absorbs one timestamp only. Not filed. It needs the device to publish a run's timestamp only after the next run's edge. The measured sequence that `pumpRecords.ts:186-188` and `pumpRecords.test.ts:383-388` record has the new backup timestamp on the stop observation itself. The behavior is the same as at the batch base. The coordinator may want to record it beside CR-05-RECORDS-032.
- **A record that an earlier release stored inside the awaiting window.** On resume it has no mark, so the 002 double count still happens once after the upgrade. Not filed. `accessoryContext.ts:96-97` defines absent as "no counted run waits". No migration was the maintainer's condition for 002.
- **`accessoryContext.ts:64-66` ("The label is computed only once the test is reported finished and both device timestamps have been stable").** It does not list the two new withholding conditions. Not filed. "Only once" states necessary conditions and does not say "whenever".
- **`accessoryContext.ts:94-95` ("the next backup timestamp past the watermark describes that same run").** This is the module's D-010 assumption, and it states it as such. The case where the assumption fails is CR-05-RECORDS-032.
- **`staleMarking.ts:25-32` ("This plugin publishes nothing until the first successful REST inventory").** This paragraph describes the hazard that the first restart pass closes, and `:41`'s "therefore" makes the restart passes its answer. It does not say that the hazard stays. Not filed.
- **`staleMarking.test.ts:149` ("One deferral the pass asked the injected port for") and `:166` ("the pass arms one deferral").** The handler that the pass installs arms the deferral on a press. The pass does not arm it at call time. The wording is loose but not false about what the port records. Not filed.
- **`staleMarking.ts:63-67` (the health-gate sentence).** Round 0 judged it, and `package.json:39` has not changed since then. Not filed again.
- **`resumes a stored record and asks for no write of its own` compares with the first instance's records (`pumpRecords.test.ts:144-157`).** Round 0 judged it. The first instance now also holds a stored awaiting mark, and the resume keeps it. I found no plausible wrong implementation that passes.
- **`WithheldLabelRow` members are mutable while `DamagedRecordRow` members are `readonly`.** No book rule covers this.
- **The `test/platform.test.ts:3319` hunk.** The expectation is correct: a watched backup edge with no timestamp stores `backupEdgeAwaitingTimestamp: true`, and `expectedFirstContext` and the seeds count no run. No other line of the case changed.
- **The `src/runtime/accountRuntime.ts:346` hunk.** Correct. The runtime keeps `options.clock` for `createMonitoringHealth` (`:347`). Its reconciliation call sites (`:461, 496, 535, 1192`) match the overview `reconciliation.ts:11-16`.

## Header inspection

| File | Result |
| --- | --- |
| `src/accessories/pumpRecords.ts` | Conforms: SPDX, blank, copyright block, blank, overview, blank, imports. |
| `test/accessories/pumpRecords.test.ts` | Conforms (same layout). |
| `src/accessories/reconciliation.ts` | Conforms. |
| `test/accessories/reconciliation.test.ts` | Conforms. |
| `src/accessories/staleMarking.ts` | Conforms. |
| `test/accessories/staleMarking.test.ts` | Conforms. |
| `src/persistence/accessoryContext.ts` | Conforms (adaptation; `:1-30`). |
| `test/platform.test.ts` | Conforms (adaptation; `:1-9`). |
| `src/runtime/accountRuntime.ts` | Conforms (adaptation; `:1-9`). |

`node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths` over the six core files printed `ACCESSORIES_HEADERS_OK files=6` (exit 0).

## Toolchain evidence

All commands ran in the worktree at `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7`. `node --version` printed `v26.12.0`. The first command started at 2026-10-18T02:05:27Z, and the coverage command ended at 2026-10-18T02:06:00Z. Raw output is in the session scratch directory. No command was piped.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | Both `tsc --noEmit` passes (src and test projects) are clean. |
| `node_modules/.bin/eslint --max-warnings=0 <the nine files>` | 0 | No output. Run without `--cache`. |
| `npm run build:test` | 0 | Clean compile to `dist-test`. |
| `node --test dist-test/test/accessories/pumpRecords.test.js dist-test/test/accessories/reconciliation.test.js dist-test/test/accessories/staleMarking.test.js` | 0 | tests 73, suites 6, pass 73, fail 0, cancelled 0, skipped 0, todo 0 (pumpRecords 41, reconciliation 13, staleMarking 19). The same command with `--test-reporter=tap` also exited 0 with the same counts. |
| `node --test dist-test/test/platform.test.js dist-test/test/runtime/accountRuntime.test.js dist-test/test/persistence/accessoryContext.test.js` | 0 | tests 240, suites 7, pass 240, fail 0, cancelled 0, skipped 0, todo 0 (platform 70, accountRuntime 169, accessoryContext 1). The same command with `--test-reporter=tap` also exited 0 with the same counts. |
| `npm run test:coverage:direct -- src/accessories/pumpRecords.ts src/accessories/reconciliation.ts src/accessories/staleMarking.ts src/runtime/accountRuntime.ts src/persistence/accessoryContext.ts src/platform.ts` | 0 | The selector prints nothing on success (each of the six pairs is at 100% lines, functions and branches when it runs alone). |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths <the six core files>` | 0 | `ACCESSORIES_HEADERS_OK files=6` |
| `node <scratch>/seed-probe.mjs <worktree>/dist-test/src/accessories/pumpRecords.js` | 0 | Read-only probe, made-up inputs, S1 to S5 as quoted in CR-05-RECORDS-032. |
| `node <scratch>/two-edge-probe.mjs <worktree>/dist-test/src/accessories/pumpRecords.js` | 0 | Read-only probe: `activationCount: 3` for two runs (see candidates). |

No check failed, so this round has no toolchain finding.

## Out-of-scope observations

- `src/accessories/serviceCatalogue.ts:466-475` and `:340-350` (Phase 5 CATALOGUE, closed). An absent label is not pushed, so HAP keeps serving the last published `LastActivationWasTestActivity` while the record holds none. The coordinator already recorded this as a presentation question for the phase verifier. CR-05-RECORDS-035 is only about the batch comment that claims otherwise.
- `src/persistence/accessoryContext.ts:18-23, 120` (Phase 3 file, outside the changed declarations). The overview's list of what survives a restart does not mention the stored awaiting mark. The `watermarks` member JSDoc ("The device timestamps already accounted for") does not mention it either. If the coordinator wants these lines changed under the same adaptation row, the CR-05-RECORDS-037 fix can include them.

## Coordinator triage

Triaged 2026-10-18 by the coordinator. Opening 31, fixed 31, rejected 1, new 6, reopened 0,
closing 5. The open count fell from 31 to 5 with no reopen in round 1, so the result is `continue`
(D-03 as amended, D-18).

- **CR-05-RECORDS-001 to 031:** `fixed`, as the Round status shows.
- **CR-05-RECORDS-032:** `rejected`. The maintainer decided on 2026-10-18 to keep today's
  trade-off. A record cannot tell whether its first device timestamp, arriving after a watched
  backup run, is that run's own timestamp or an older one, unless it compares device time with
  local time, which the module forbids. Clearing the awaiting mark at seeding (today) risks one run
  counting twice. In the rarer case where an older settled self-test pair arrives with it, it also
  risks a self-test label on the watched run. Keeping the mark would instead leave the next
  genuinely missed run uncounted. Both need the optional device timestamp to be absent at first.
  The comments must state the trade-off as it is (034). The behavior and the case that pins it stay.
- **CR-05-RECORDS-033:** `open`, BLOCKER, as reported.
- **CR-05-RECORDS-034:** `open`, WARNING. The comments must state 032's trade-off as an assumption
  with both of its consequences, not as a fact.
- **CR-05-RECORDS-035, 036 and 037:** `open`, WARNING, as reported. 037 edits comment lines in the
  declared adaptation `src/persistence/accessoryContext.ts` (row 25).
- **Not filed:** the coordinator keeps the reviewer's rejections, including the two-edge probe
  candidate (each run's timestamp arrives on its own stop observation in the measured sequence) and
  the `silentLog` comment (the test book's own wording, and staleMarking writes no line itself).
- **Repair order:** the source comments (034's source half and 037), then the tests (033, 034's
  test half, 035, 036).

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-RECORDS-034 (source half) | `src/accessories/pumpRecords.ts` | Node v26.12.0: `fallow guard` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/pumpRecords.test.js` 0 (tests 41, pass 41, fail 0); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` 0; `eslint --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 0c0930e` 0, verdict pass | n/a (WARNING) | Comment lines only. The overview label sentence (`:33-36`) and the seeding comment (`:311-318`) state the maintainer's kept trade-off as an assumption: the first timestamp is taken as the waiting run's own; if older, the run counts twice and an older settled self-test pair can label it; keeping the mark would leave a missed run uncounted. The classification comment (`:340-342`) names the awaiting mark as the condition. Same kind of claim fixed nearby: `:171` ("a timestamp it takes as a counted run's own") and `:291-297` (the record takes the first advance after an edge as that run, and a resumed record counts nothing for the next new timestamp). |
| CR-05-RECORDS-037 | `src/persistence/accessoryContext.ts` | Node v26.12.0: `fallow guard` 0; `npm run build:test` 0; `node --test dist-test/test/persistence/accessoryContext.test.js` 0 (tests 1, pass 1, fail 0); `npm run test:coverage:direct -- src/persistence/accessoryContext.ts test/persistence/accessoryContext.test.ts` 0; `eslint --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 0c0930e` 0, verdict pass | n/a (WARNING) | Comment lines only, in adaptation row 25. `PumpObservation.observationStartedAt` (`:37-40`): the count holds what the plugin watched plus backup runs it recovered from the device timestamp, and "before it ran" becomes "before it began observing", because a recovered run can fall while the plugin was stopped. `ActivationWatermarks` summary (`:75-76`): the timestamps already accounted for and the awaiting mark. Same kind of claim fixed nearby: `backupEdgeAwaitingTimestamp` (`:96-97`) says the next timestamp "is taken as" the run's own. Left as they are: the overview (`:18-23`) and the `watermarks` member (`:122`), which are outside the declarations the batch changed and leave the mark out without a false claim. |
| CR-05-RECORDS-033 | `test/accessories/pumpRecords.test.ts` | Node v26.12.0: `fallow guard` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/pumpRecords.test.js` 0 (tests 42, pass 42, fail 0); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` 0; `eslint --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 0c0930e` 0, verdict pass | Wrong behavior: the recovery branch keeps the stored label (`dropTestActivityLabel(stored.backupPump)` deleted at `src/accessories/pumpRecords.ts:333`). Recorded blob `1dca0e3162dd9d74e1baa63fc55d6cd13170bb55`; mutated build 0; the case alone with `--test-reporter=tap --test-name-pattern` exited 1 (tests 1, fail 1) on the case's `deepStrictEqual`, actual `lastActivationWasTestActivity: true`, expected `undefined`, other members equal. Restored: `git hash-object` equals the recorded blob, `git diff --exit-code` 0; rebuild 0, the case 0 (pass 1), owner 0 (42 pass), pair coverage 0. Not staged or committed. | New case `removes the stored self-test label when a device timestamp recovers a missed backup run` (`:577-605`): from `storedContextWithAnActivation()` with `lastActivationWasTestActivity: true`, one settled snapshot, then the same snapshot with backup timestamp `1_700_000_160`; it asserts the whole `records.backup`. |
| CR-05-RECORDS-034 (test half) | `test/accessories/pumpRecords.test.ts` | Node v26.12.0: `fallow guard` 0 (run after the edit, not before it); `npm run build:test` 0; `node --test dist-test/test/accessories/pumpRecords.test.js` 0 (tests 42, pass 42, fail 0); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` 0; `eslint --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 0c0930e` 0, verdict pass | n/a (WARNING) | Comment lines only. The comment on `counts a later advance after a seed that also absorbed a watched edge` (`:253-259`) states the kept trade-off as an assumption with both costs, says "awaiting mark" for "flag", and drops "genuinely missed" and "the only way the flag is ever set" (a restored mark is also set when the seed arrives). Same kind of claim fixed nearby: the comment on `absorbs the device timestamp that follows a watched backup activation` (`:301-305`) says the record takes the advance as the counted run. The case and its expectation are unchanged. |
| CR-05-RECORDS-035 | `test/accessories/pumpRecords.test.ts` | Node v26.12.0: `fallow guard` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/pumpRecords.test.js` 0 (tests 42, pass 42, fail 0); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` 0; `eslint --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 0c0930e` 0, verdict pass | n/a (WARNING) | Comment line only. The comment on `withholds the self-test label from a watched backup run whose device timestamp has not arrived` (`:613`) keeps the claim on the record ("so it no longer says that the last activation was a self-test") and drops the HomeKit claim, because `recordCandidates` drops an absent label and HAP keeps the last published value. No other comment in the file makes a HomeKit claim. |
