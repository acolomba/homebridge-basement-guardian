---
phase: 05-accessories-conformance
batch: RECORDS
review_round: 2
reviewed: 2026-10-18T03:03:44Z
depth: deep
source_revision: 07a232ebdcd768bc34ada8957753b90a8f498da4
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
  warning: 2
  total: 4
status: issues_found
reviewer: gsd-code-reviewer (correction round 2)
---

# Phase 5 RECORDS batch: correction round 2

Revision `07a232ebdcd768bc34ada8957753b90a8f498da4` equals `git rev-parse HEAD`. `git status --porcelain`
was empty before the review started and after the last command. I read every line of the six core
files fresh and in full at this revision. For the three adaptation rows, I read the hunks changed
since the batch base `0c0930e890cb41e74d0d4e854ba45c41a31fea4a` and their enclosing declarations:
`PumpObservation` and `ActivationWatermarks` in `src/persistence/accessoryContext.ts`; the case
`asks Homebridge to store the accessory whose snapshot counted an activation, and no other` in
`test/platform.test.ts` (`:3300-3345`); and the `createReconciliation` call in `createAccountRuntime`
in `src/runtime/accountRuntime.ts` (`:346`). The rest of those three files belongs to their owning
phases. Since the round-1 revision `8e7a246`, `git diff -U0 8e7a246..HEAD -- src` changes comment
lines only.

I applied the three `.agents/skills/` books (each `SKILL.md` with every file in `rules/`). Where the
`.claude/rules/*.md` copies differ from them, `.agents/skills/` wins. Severities follow each book's
"Classifying findings" section. There is no Info tier.

I ran one read-only probe of the compiled module `dist-test/src/accessories/pumpRecords.js` with
made-up inputs (`same-observation-probe.mjs`, in the session scratch directory, exit 0). I changed no
source or test file, ran no mutation experiment, made no commit and used no stash. The only file I
wrote in the repository is this report. I deleted the ESLint cache under `node_modules/.cache/eslint/`
before the lint run, as `.agents/skills/local-verification/rules/commands.md` directs for a fresh
lint.

## Round status

Opening open IDs: 5 (CR-05-RECORDS-033 to 037). Result: 5 fixed, 0 still open. Earlier fixed IDs
CR-05-RECORDS-001 to 031: all still fixed, 0 reopened. CR-05-RECORDS-032 stays rejected by the
maintainer's decision; I judged only whether the comments describe it truly.

| ID | Status | Evidence at `07a232ebdcd768bc34ada8957753b90a8f498da4` |
| --- | --- | --- |
| CR-05-RECORDS-033 | fixed | `test/accessories/pumpRecords.test.ts:584-609` starts from a stored activation that carries `lastActivationWasTestActivity: true`, observes one settled snapshot, then recovers `1_700_000_160` and asserts the whole `records.backup` with the label `undefined`. Without `dropTestActivityLabel` at `src/accessories/pumpRecords.ts:333`, the label stays `true`: classification abstains on that observation because the backup timestamp moved (`:203`), so the case fails. The fixer's assertion control saw that failure. |
| CR-05-RECORDS-034 | fixed | `pumpRecords.ts:31-36`, `:291-297`, `:307-318` and `:338-342` state the first-timestamp rule as an assumption with both costs, and `pumpRecords.test.ts:253-259` states the rule that the case pins, with "awaiting mark" and without "genuinely missed". Each clause matches the code (`:303-323`, `:344`) and the maintainer's 032 decision. One new clause in this text gives a reason that does not hold; that is new cause CR-05-RECORDS-040, not the claim that 034 named. The same-observation path in CR-05-RECORDS-038 is a new cause, and its fix changes these comments too. |
| CR-05-RECORDS-035 | fixed | `pumpRecords.test.ts:611-613` keeps the claim on the record ("so it no longer says that the last activation was a self-test"). No HomeKit claim remains in the file. |
| CR-05-RECORDS-036 | fixed | `test/accessories/staleMarking.test.ts:26-28`: the kept reason holds. A pass that marked with an error that names no status reads `-70402` (the stand-in's and HAP's default), not `RESOURCE_BUSY`. `:31-33` states its own reason, and that reason holds: `notAllowedInCurrentState` reads `hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE` (`src/accessories/controls.ts:321-323`), so a drifted stand-in number fails `:446` and `:476`. |
| CR-05-RECORDS-037 | fixed | `src/persistence/accessoryContext.ts:37-40` names the recovered backup runs. `:74-76` names the timestamps accounted for and the awaiting mark. `:96-99` says that the next timestamp "is taken as" the run's own, which is what `pumpRecords.ts:319-329` does. |
| CR-05-RECORDS-001 | still fixed | `pumpRecords.ts:344` withholds classification while the stored mark is set or the record holds no `lastActivationAt`. `:378` and `:333` remove the label on a watched edge and on a recovered timestamp. P1 (`pumpRecords.test.ts:614-641`) and P4 (`:526-546`) pass. The probe shows the same symptom (a real backup run labelled a self-test while it runs) through a different cause: a timestamp that arrives on the edge observation itself is absorbed as the new run's own. I filed that as new cause CR-05-RECORDS-038 and not as a reopen. P1 and P4 do not return, and that path behaved the same way at the batch base: `0c0930e:src/accessories/pumpRecords.ts:329-336` also set the awaiting flag before reconciling that observation's timestamp. |
| CR-05-RECORDS-002 | still fixed | The mark is stored (`pumpRecords.ts:379`), validated (`:148-151`), removed (`:320`, `:326`) and read (`:325`, `:344`). The regression case `pumpRecords.test.ts:335-353` and the damaged-record row `:745-752` pass. The consumer expectation is at `test/platform.test.ts:3319`. |
| CR-05-RECORDS-003 | still fixed | `pumpRecords.test.ts:217-234` and `:308-330`. |
| CR-05-RECORDS-004 | still fixed | `pumpRecords.test.ts:486-521`. I traced each row against its wrong rule, and each row fails. |
| CR-05-RECORDS-005 | still fixed | `pumpRecords.test.ts:551-579`. |
| CR-05-RECORDS-006 | still fixed | `pumpRecords.test.ts:684`, `:755-769`, `:775-784`. |
| CR-05-RECORDS-007 | still fixed | `test/accessories/reconciliation.test.ts:210-224`. |
| CR-05-RECORDS-008 | still fixed | `staleMarking.test.ts:432-448`. |
| CR-05-RECORDS-009 | still fixed | `staleMarking.test.ts:29`, `:357-377`. |
| CR-05-RECORDS-010 | still fixed | `staleMarking.test.ts:453-483`. |
| CR-05-RECORDS-011 | still fixed | The pumpRecords pair has the D-01 layout (`:1-9` in each file). The tracer printed `ACCESSORIES_HEADERS_OK files=6`. |
| CR-05-RECORDS-012 | still fixed | The staleMarking pair has the D-01 layout. The same tracer run covers it. |
| CR-05-RECORDS-013 | still fixed | `src/accessories/reconciliation.ts:48-51` has only `log`. `grep -n "Clock\|clock"` over the pair finds nothing. `accountRuntime.ts:346` passes `{ log: options.log }`. |
| CR-05-RECORDS-014 | still fixed | `reconciliation.ts:11-16`. |
| CR-05-RECORDS-015 | still fixed | `reconciliation.test.ts:226-239` is under `describe('forget')`. |
| CR-05-RECORDS-016 | still fixed | No duplicate. `reconciliation.test.ts:72-83` keeps the empty-list confirmation. |
| CR-05-RECORDS-017 | still fixed | `pumpRecords.ts:47`, `:68-72`, `:178-181`. |
| CR-05-RECORDS-018 | still fixed | `pumpRecords.ts:8-9`, `:11-17`. |
| CR-05-RECORDS-019 | still fixed | `pumpRecords.ts:240-243`. |
| CR-05-RECORDS-020 | still fixed | `pumpRecords.ts:307-309`; `pumpRecords.test.ts:236-238`. |
| CR-05-RECORDS-021 | still fixed | `pumpRecords.test.ts:100-103`. |
| CR-05-RECORDS-022 | still fixed | `grep -n "Ruled\|CONTEXT\|plan as written"` over both test files: no hit (exit 1). |
| CR-05-RECORDS-023 | still fixed | `pumpRecords.test.ts:789-800`. |
| CR-05-RECORDS-024 | still fixed | Only `readonly WithheldLabelRow[]`, `readonly DamagedRecordRow[]`, `string[]` and `Deferral[]`. |
| CR-05-RECORDS-025 | still fixed | `pumpRecords.test.ts:688-753`: each row holds a `stored()` factory. |
| CR-05-RECORDS-026 | still fixed | Every partial observation literal ends in `satisfies Partial<PumpRecordsObservation>`. |
| CR-05-RECORDS-027 | still fixed | `pumpRecords.test.ts:51-57` and `staleMarking.test.ts:108-110` are function declarations. |
| CR-05-RECORDS-028 | still fixed | `as unknown as` appears only at `staleMarking.test.ts:51, 55, 60`, inside the commented block `:46-61`. |
| CR-05-RECORDS-029 | still fixed | `staleMarking.test.ts:214-225` awaits the read, and every caller awaits `readOf`. |
| CR-05-RECORDS-030 | still fixed | `staleMarking.test.ts:141-146`, `:166-171`, `:557-559` are block bodies. The concise `setTimeout` and `setInterval` bodies return the handle that `Timers` declares. |
| CR-05-RECORDS-031 | still fixed | `staleMarking.ts:41-50` names the two restart passes; `:150-153` gives the walk reason only. I checked these against `src/platform.ts:442-454, 661-664` and `features/support/world.ts:23, 631-635`. |

Arithmetic: opening 5 - fixed 5 - rejected 0 + new 4 + reopened 0 = closing 4.

## Findings

### CR-05-RECORDS-038 - BLOCKER: A device timestamp that arrives with a watched backup edge is absorbed as that new run's own, so an earlier run's self-test pair labels the real run, and a fresh record counts one run twice

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); D-05 (no guessed values, narrow trust); the module's own D-010 contract at `src/accessories/pumpRecords.ts:24-26` and `:291-295` ("The device publishes a new backup-pump timestamp only after the pump stops"), and its C-001 contract at `:28-34`
**Location:** `07a232ebdcd768bc34ada8957753b90a8f498da4:src/accessories/pumpRecords.ts:376-384` (with `:291-297`, `:319-329`, `:31-36`)
**Issue:** `observe` marks the backup edge (`:376-381`, `backupEdgeAwaitingTimestamp = true`) before it reconciles the same observation's backup timestamp (`:383`). So a new timestamp that arrives on the edge observation itself satisfies the mark at once (`:319-329`). By the module's own premise, that timestamp cannot be the new run's own: the observation reports the pump running, and the device publishes a run's timestamp only after that run stops. It belongs to an earlier run that ended between two observations. The module can tell this from the observation itself, without any comparison of device time with local time. The probe printed these results:

- S-A, a record with a stored watermark (`1_700_000_000`, test `1_700_000_005`). Observation 1 is idle. Observation 2 shows `backupRunning: true` (a real run B starts) with an earlier self-test A's settled pair (`backupActivatedAt 1_700_000_100`, `testedAt 1_700_000_105`, `testRunning: false`). Result: `activationCount: 1`, `lastActivationAt: 1800000060000`, the watermark moved to `1_700_000_100` and the mark cleared. A was absorbed as B's own timestamp. Observation 3 shows B still running with the same pair. Result: `lastActivationWasTestActivity: true`. While a real basement run is in progress, the record says that the last activation was a self-test. That is the symptom of CR-05-RECORDS-001, and the mark that `:344` relies on is already clear. Observation 4 shows B stopped with its own `1_700_000_160`. Result: `activationCount: 2, lastActivationAt: 1700000160000`. The total is right, but B's record is written from two clocks. `:294-295` says that absorbing prevents exactly that.
- S-B, a fresh record. `backupRunning: false`, then `backupRunning: true` with the first-ever timestamp `1_700_000_000`, then `false` with the run's own `1_700_000_100`. Result: `activationCount: 2, lastActivationAt: 1700000100000` for one physical run. This shares CR-05-RECORDS-032's precondition (no timestamp before the edge). It is not 032's trade-off: that decision rests on the record being unable to tell an older first timestamp from the run's own, and here the observation that carries the timestamp also reports the run in progress.

The order is the batch base's (`0c0930e:src/accessories/pumpRecords.ts:329-336`), and the lines `:378-379` came from the 001 and 002 fixes (`e93758e`, `5e753ca`). No case drives a new timestamp on an edge observation: in every case where an edge sees a backup timestamp (`pumpRecords.test.ts:339`, `:384`, `:624`), that timestamp equals the watermark. The overview (`:35-36`) says that "the backup timestamp rule below states when and why" the record takes an older timestamp, and `:291-292` says that it takes "the first advance following a watched backup edge". The same-observation case is neither stated nor following.
**Fix:** The coordinator decides this under D-04. The minimum change reconciles the backup timestamp before the backup edge is marked. Move `changed = reconcileBackupTimestamp(stored, observation.backupActivatedAt) || changed;` above the backup-edge block, and keep classification last. Then S-A recovers A (count 1, its device time, label removed), and B's edge counts B and sets the mark that B's own timestamp later clears (count 2, `lastActivationAt` B's receipt time, no label while B runs). S-B seeds the first timestamp before the edge, and the run counts once. No case in `pumpRecords.test.ts` changes its expectation, because none has an edge observation whose timestamp moves. Other suites were not traced, so the fixer runs every unit module and the Cucumber suite, as the ledger requires of a production fix. First write an active regression case in `pumpRecords.test.ts` and see it RED against unchanged production. For example: `withholds the self-test label from a watched backup run whose edge arrives with an earlier run's timestamp`, from `storedContext()`, with the edge observation at `OBSERVED_NEXT_AT`, asserting the whole `records.backup` after S-A's observation 3: `{ observationStartedAt: OBSERVED_AT, activationCount: 2, lastActivationAt: OBSERVED_NEXT_AT, lastActivationWasTestActivity: undefined }` (today: `activationCount: 1` and label `true`). In the same fix, state the rule at `:291-297` and `:31-36` as the code then applies it.
**Flags:** D-04 (genuine production bug candidate; new cause, not a reopen of CR-05-RECORDS-001; lines `:378-379` were touched by the 001 and 002 fixes; coordinator to judge its relation to the rejected CR-05-RECORDS-032 for the S-B variant)

### CR-05-RECORDS-039 - BLOCKER: No case shows that an undecoded running value leaves a running pump running, so treating it as stopped passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case discriminates the behavior it covers); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (a case a wrong implementation would pass)
**Location:** `07a232ebdcd768bc34ada8957753b90a8f498da4:test/accessories/pumpRecords.test.ts:200-213` (against `src/accessories/pumpRecords.ts:164-168`)
**Issue:** The source comment at `:164-165` says that an undecoded running value "neither counts nor clears", and that keeping the previous value "is what stops an undecoded snapshot followed by a `true` from manufacturing an edge". The test comment at `:200` repeats "neither counts nor clears". The one case for this rule, `counts an activation across a snapshot whose running value did not decode`, drives `false, undefined, true` and asserts a count of 1. That covers only the half where the `false` before the gap survives. Plausible wrong implementation: `rememberedRunning` returns `reportedRunning ?? false`, so an undecoded value clears to "not running". `false, undefined(→false), true` still counts 1, so the case passes. I traced every other case in the file. None drives `true`, then an undecoded value, then `true` on the same pump. The default `observation()` leaves both running values undecoded, but no case puts that default between two `true` snapshots. So every case passes, and the coverage of `:167` stays 100%. In production, a decode gap in the middle of one run then counts a second activation for it. For the primary pump, nothing can detect or correct that, because the device reports no primary timestamp (`:155-159`, D-009). The probe confirms that the current code counts 1 for `false, true, undefined, true`.
**Fix:** Add a case such as `counts no second activation when a running pump's state fails to decode for one snapshot`: `primaryRunning` `false`, then `true` at `OBSERVED_NEXT_AT`, then `undefined`, then `true` at `OBSERVED_LAST_AT`. Assert the whole `records.primary`: `{ observationStartedAt: OBSERVED_AT, activationCount: 1, lastActivationAt: OBSERVED_NEXT_AT, lastActivationWasTestActivity: undefined }`. Run the assertion control with `reportedRunning ?? false` at `:167`.
**Flags:** none

### CR-05-RECORDS-040 - WARNING: The seeding comment gives a reason for removing the awaiting mark that the stored type does not support

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does and, when non-obvious, why)
**Location:** `07a232ebdcd768bc34ada8957753b90a8f498da4:src/accessories/pumpRecords.ts:317-318`
**Issue:** "The mark is removed rather than set to `false`, because the stored shape declares it optional." `tsconfig.json:9` sets `exactOptionalPropertyTypes`. Under it, `backupEdgeAwaitingTimestamp?: boolean` (`accessoryContext.ts:101`) accepts `false`, and `isActivationWatermarks` accepts `false` too (`pumpRecords.ts:151`). So the optional declaration permits the removal but does not require it. The parallel sentence at `:230-232` is sound, because `undefined` is the value that `exactOptionalPropertyTypes` rejects for an optional member. Here the reason is borrowed, and it does not apply. A reader learns a type rule that does not exist. The fix commit `fab1c46` (CR-05-RECORDS-034) added the sentence.
**Fix:** Give the reason that holds, or remove the sentence. For example: "The mark is removed rather than set to `false`, because absence is the stored shape's 'no run waits' state (`ActivationWatermarks.backupEdgeAwaitingTimestamp`), so a record with no waiting run is stored like one that never had a mark." Change the comment lines only.
**Flags:** none

### CR-05-RECORDS-041 - WARNING: The credential pass JSDoc says that the pass does not grey out the tile, and the file overview says that it makes the tile unreadable

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does)
**Location:** `07a232ebdcd768bc34ada8957753b90a8f498da4:src/accessories/staleMarking.ts:142-143` (against `:19-23`)
**Issue:** The `markTrustReportsUnreadable` JSDoc says: "The name says so, because 'unreadable service' would describe a pass that greys out the whole tile and this one does not." The overview of the same file says: "The credential pass makes the tile unreadable" (`:21`). Its only caller says the same thing three times. `src/platform.ts:435-439` says that this condition "presents as unreadable rather than as marked", unlike the degradations that leave "the tile readable", because "greying out an accessory for something that will fix itself" teaches an owner to ignore the signal. `:456-458` says: "the tiles it marked stop answering, which is the whole presentation". The batch's own test reasons in the same way (`staleMarking.test.ts:450-452`): one characteristic that answers a status is drawn as "No Response". So the JSDoc contradicts the file overview and the caller about the one thing that the pass is for. The characteristic-level facts at `:140-142` are true: only `Status Active` fails its read, and every other characteristic answers (`staleMarking.test.ts:379-399`).
**Fix:** Keep the characteristic-level fact and drop the tile claim. For example: "The name says so, because 'unreadable service' would describe a pass that makes every characteristic of the service fail its read, and this one makes only the trust report fail." Change the comment lines only.
**Flags:** none

## Candidates considered and not filed

- **`staleMarking.ts:42-44`, "`configureAccessory` is the only code that runs while a restored accessory exists and no fresh data does".** The credential pass can also run in that state, from `applyMonitoringHealth` after a refused first grant (`platform.ts:442-454`). Not filed. After the CR-05-RECORDS-031 fix, the sentence explains where the two restart passes are placed. The credential path runs only on a refusal and is not a place to hand a restored accessory back. `platform.ts:650-651` makes the same claim, and Phase 6 owns that file. This is not a reopen of 031: the passes' placement claim that 031 corrected stays correct.
- **`accessoryContext.ts:67-69`, "An observation that neither counts an activation nor computes a label leaves the previous label where it was".** A seeding observation over an unreadable context drops whatever label the unreadable context held. Not filed. That context was never resumed, so the record had no previous label.
- **`accessoryContext.ts:82-87`, "the two are compared only with each other".** The self-test watermark is compared with a reported `testedAt` only for change detection (`pumpRecords.ts:354`), which is the same device clock. Not filed.
- **`pumpRecords.ts:164-165`, the `rememberedRunning` reason.** It is true when "clears" means "becomes not running", which is how `:164` uses it. The probe confirms the behavior. The missing case is CR-05-RECORDS-039.
- **`pumpRecords.test.ts:368-371`, "The label is withheld through the fourth phase because that phase is the one in which the self-test timestamp moves".** The first three phases are withheld for other reasons: no activation (phase 1), the awaiting mark (phase 2) and a running test (phases 2 and 3). Not filed. The sentence explains why the fourth phase is withheld, which is what the case is about. A rule that ignores stability fails at index 3.
- **`staleMarking.test.ts:42`, "The one hand-built stand-in of this boundary".** `HAP` is the shared namespace from `features/lib/hap.ts:702-722`. That namespace holds no per-scenario state, so it may live at module scope (`cases.md`). Not filed.
- **`staleMarking.test.ts:63-65`, "`restoreCachedAccessories` rebuilds".** The method exists (`features/lib/homebridgeApi.ts:293`) and is what the harness calls (`features/support/world.ts:631`). The claim holds.
- **`staleMarking.ts:34-36`, "HAP answers a write with no handler by storing the value and reporting success".** Checked against `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1835-1838`. It holds.
- **`staleMarking.test.ts:533-535`, "A set handler is one slot in HAP".** `Characteristic.onSet` assigns one `setHandler`. It holds.
- **Earlier rounds' candidates** (the `silentLog` comment, the refusal warning assertion, the two-edge sequence, the upgrade record inside the awaiting window, `accessoryContext.ts:64-66` and `:94-95`, `staleMarking.ts:25-32` and `:63-67`, `staleMarking.test.ts:149` and `:166`, the resume comparison, the row member mutability, and the two adaptation hunks). I found no new evidence for any of them. CR-05-RECORDS-038 is a different input sequence from the two-edge candidate: there, each run's timestamp arrives on its own stop observation, and here the earlier run's timestamp arrives on the next run's edge observation.
- **The `test/platform.test.ts:3319` hunk.** It is correct. The second system counts a watched backup edge with no timestamp, so its context stores the mark.
- **The `src/runtime/accountRuntime.ts:346` hunk.** It is correct. The runtime keeps `options.clock` for `createMonitoringHealth` (`:347`).

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

`node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths` over the six
core files printed `ACCESSORIES_HEADERS_OK files=6` (exit 0).

## Toolchain evidence

All commands ran in the worktree at `07a232ebdcd768bc34ada8957753b90a8f498da4`. `node --version` printed
`v26.12.0` and `npm --version` printed `11.20.0`. The first command started at 2026-10-18T03:00:17Z, and
the coverage command ended at 2026-10-18T03:00:51Z. Raw output is in the session scratch directory. No
command whose exit is reported was piped.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | Both `tsc --noEmit` passes (src and test projects) are clean. |
| `node_modules/.bin/eslint --max-warnings=0 <the nine files>` | 0 | No output. The ESLint cache was deleted first, so the result is fresh. |
| `npm run build:test` | 0 | Clean compile to `dist-test`. |
| `node --test dist-test/test/accessories/pumpRecords.test.js dist-test/test/accessories/reconciliation.test.js dist-test/test/accessories/staleMarking.test.js` | 0 | Default reporter, exit 0. With `--test-reporter=tap`, also exit 0: tests 74, suites 6, pass 74, fail 0, cancelled 0, skipped 0, todo 0. Each module alone: pumpRecords 42, reconciliation 13, staleMarking 19, each exit 0 with fail 0. |
| `node --test dist-test/test/platform.test.js dist-test/test/runtime/accountRuntime.test.js dist-test/test/persistence/accessoryContext.test.js` | 0 | Default reporter, exit 0. With `--test-reporter=tap`, also exit 0: tests 240, suites 7, pass 240, fail 0, cancelled 0, skipped 0, todo 0. Each module alone: platform 70, accountRuntime 169, accessoryContext 1, each exit 0 with fail 0. |
| `npm run test:coverage:direct -- src/accessories/pumpRecords.ts src/accessories/reconciliation.ts src/accessories/staleMarking.ts src/runtime/accountRuntime.ts src/persistence/accessoryContext.ts src/platform.ts` | 0 | The selector prints nothing after the npm banner on success. Each of the six pairs is at 100% lines, functions and branches when it runs alone. |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths <the six core files>` | 0 | `ACCESSORIES_HEADERS_OK files=6` |
| `node <scratch>/same-observation-probe.mjs <worktree>/dist-test/src/accessories/pumpRecords.js` | 0 | Read-only probe, made-up inputs: S-A and S-B as quoted in CR-05-RECORDS-038, and S-C (`false, true, undefined, true` on the primary pump: `activationCount: 1`) as cited in CR-05-RECORDS-039. |

No check failed, so this round has no toolchain finding. Passing coverage does not answer
CR-05-RECORDS-039: `:167` runs in every case, so a wrong body is covered as well.

## Out-of-scope observations

- `src/platform.ts:66` (Phase 6). The `watermarks` member JSDoc of `BasementGuardianAccessoryContext`
  still says "The device timestamps already turned into an activation record". That is the claim that
  CR-05-RECORDS-037 corrected in `ActivationWatermarks`: the member also holds the never-counted
  baseline, the consumed self-test timestamp and the awaiting mark.
- `src/persistence/accessoryContext.ts:104-110` (outside the declarations this batch changed; owned by
  the file's own phase). `AccessoryContext` declares top-level `deviceId`, `deviceTypeId` and
  `serialNumber`. The context that the platform stores carries `device: { deviceId, deviceTypeId }`
  and no `serialNumber` (`src/platform.ts:59`; `test/platform.test.ts:3301`), and the accessory
  constructor's message asks for `context.device` (`src/accessories/basementGuardian.ts:244`). The
  platform indexes only the record members of `AccessoryContext` (`platform.ts:61-67`), so the
  mismatch has no compile effect, but the type does not describe what is stored.
- `src/persistence/accessoryContext.ts:18-23, 122` (as R1 reported). The overview and the `watermarks`
  member still do not mention the stored awaiting mark.
- `src/accessories/serviceCatalogue.ts:340-350, 466-475` (Phase 5 CATALOGUE, closed). An absent label
  is not pushed, so HAP keeps serving the last published label. This is still the coordinator's
  presentation question for the phase verifier. CR-05-RECORDS-038's S-A window is one more way to
  publish `true` for a real run.

## Coordinator triage

Triaged 2026-10-18 by the coordinator. Opening 5, fixed 5, rejected 0, new 4, reopened 0,
closing 4. The open count fell from 5 to 4 with no reopen in round 2, so the result is `continue`
(D-03 as amended, D-18). CR-05-RECORDS-001 to 031 stay fixed; 032 stays rejected.

- **CR-05-RECORDS-033 to 037:** `fixed`, as the Round status shows.
- **CR-05-RECORDS-038:** `open`, BLOCKER, classified as a genuine production bug (D-04). A backup
  edge and a timestamp advance in the same observation: by the module's own rule the device
  publishes a run's timestamp only after the run stops, so that advance belongs to an earlier run.
  The code marks the edge before it reconciles the timestamp, takes the advance as the new run's
  own, and can label a real run a self-test from an earlier self-test's timestamps. On a fresh
  record it can count one run twice. This is the class the maintainer chose to fix with 001
  (2026-10-18: a label must not describe the wrong activation). It does not touch the 032 trade-off,
  which concerns a first timestamp that arrives in a later observation, when the record cannot tell
  whose it is. Here the running pump in the same observation shows whose it is not. The minimum fix
  reconciles the timestamp before marking the edge. It runs the D-04 sequence with
  `05-PUMP-RECORDS-RED-EVIDENCE.json`, whose `priorEvidence` keeps the 002 record (which holds the
  001 record).
- **CR-05-RECORDS-039:** `open`, BLOCKER, as reported.
- **CR-05-RECORDS-040 and 041:** `open`, WARNING, as reported.
- **Out-of-scope observations:** the stale `watermarks` JSDoc at `src/platform.ts:66`, and the
  `AccessoryContext` top-level identity members against the `device` object the platform stores,
  go to Phase 6 (the platform). They are recorded for the phase verifier.
- **Repair order:** the D-04 bug (038); then 040 and 041 (comments); then 039 (test).

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-RECORDS-038 | `src/accessories/pumpRecords.ts`, `test/accessories/pumpRecords.test.ts` | Node v26.12.0: `fallow guard` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/pumpRecords.test.js` 0 (tests 43, pass 43, fail 0); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` 0; `eslint --max-warnings=0` 0; `npm run typecheck` 0; every unit module `node --test $(find dist-test/test -name '*.test.js' \| sort)` 0 (59 files, tests 1636, pass 1636, fail 0); `npx cucumber-js` 0 (104 scenarios, 1156 steps, all passed); `fallow audit --base 0c0930e` 0, verdict pass | RED evidence 5105051 (D-04) | `observe` reconciles the backup timestamp before it marks a watched backup edge, so an advance that arrives with the edge is read as an earlier run's timestamp (recovered on the device clock, absorbed for an earlier awaiting edge, or seeded as the baseline) and the edge's run then awaits its own timestamp. The active regression case `reads a timestamp advance that arrives with a backup edge as an earlier run` is committed byte for byte and passes. No existing case changed its expectation. Comments: the `reconcileBackupTimestamp` rule (`:291-299`) now says "the first advance in a later observation" and states the same-observation rule, and the call site carries the order reason. Kept: the persisted keys, the 032 first-timestamp trade-off, absorption of a later advance, the classification rule and every log line. |
| CR-05-RECORDS-040 | `src/accessories/pumpRecords.ts` | Node v26.12.0: `fallow guard` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/pumpRecords.test.js` 0 (tests 43, pass 43, fail 0); `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` 0; `eslint --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 0c0930e` 0, verdict pass | n/a (WARNING) | Comment lines only. The seeding comment (`:319-321`) now gives the reason that holds: the stored shape uses the mark's absence to say that no run waits (`ActivationWatermarks.backupEdgeAwaitingTimestamp`), so a record with no waiting run is stored like one that never had a mark. Checked nearby: the label sentence at `:230-232` holds, because `exactOptionalPropertyTypes` rejects `undefined` for the optional `lastActivationWasTestActivity`; no other comment makes the same kind of claim. |
