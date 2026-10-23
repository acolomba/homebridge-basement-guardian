---
phase: 05-accessories-conformance
batch: CATALOGUE
review_round: 4
reviewed: 2026-10-17T16:48:30Z
depth: deep
source_revision: e790d20da2ce14d82304048c524159b23b7b9293
files_reviewed: 2
files_reviewed_list:
  - src/accessories/serviceCatalogue.ts
  - test/accessories/serviceCatalogue.test.ts
findings:
  blocker: 1
  warning: 1
  total: 2
status: issues_found
reviewer: gsd-code-reviewer (correction round 4)
---

# Phase 5 CATALOGUE batch: correction round 4

I read every line of both files fresh and in full at `e790d20da2ce14d82304048c524159b23b7b9293`
(source 1050 lines, test 2833 lines). I did not review a diff. After the full read I used diffs
for two checks only: preservation against the batch base `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12`
(D-05), and the content of the three round-3 repair commits (`git diff 309d0da..e790d20`).

Inputs read: AGENTS.md; the three `.agents/skills` books (each `SKILL.md` and every `rules/*.md`
file); `05-CONTEXT.md`; `05-REVIEW-PROTOCOL.md`; `05-CATALOGUE-REVIEW.md`, `-R1.md`, `-R2.md` and
`-R3.md` (findings, candidates, Coordinator triage, Repair history, Assertion controls, and the R3
row coverage sweep); the CATALOGUE rows and the dispatch log of `05-FINDINGS.md`;
`src/device/family.ts:77-181` (every decoded group type and `ScopedDomainState`);
`src/device/gemini.ts:260-334` (the scope decoders); and, for the consumer,
`src/accessories/basementGuardian.ts:600-625, 760-795, 990-1015`.

Opening open set: 3 IDs (3 BLOCKER). Result: all three fixed. None of 001 to 019 reopened. The
fresh row sweep found 1 new BLOCKER (a gap present at the batch base that the R3 sweep did not
see) and 1 new WARNING (a test title that the round-3 repair left overclaiming). Count:
3 opening - 3 fixed - 0 rejected + 2 new + 0 reopened = 2 closing.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-020 | BLOCKER | fixed | `testRunning` is gone from the `decodedState()` pump default (229) and appears only as a loop variable (719-723). "activates the backup pump adapter during a self-test run of T" (719-732) now sets `'self-test': { running: T, testedAt: undefined }` and compares the whole projection with `CONTACT_NOT_DETECTED`. The new four-row loop (734-760) sets `'self-test'.running: true` and compares the whole projections of both activity adapters for every combination of the two running booleans. "leaves the backup pump adapter quiet while every other condition is active" (776-791) now includes a running self-test. Wrong row (1) of the finding (`running && !testing`) fails the `true` row of 719 and three rows of 736. Wrong row (2) (`running \|\| testing`) fails three rows of 736 and 776. The R3 assertion controls (A and B) show both failures. |
| CR-05-CATALOGUE-021 | BLOCKER | fixed | 506-528 compares the whole `Sump Pit Level` projection for both sensor-fault values. The six-row flood loop (530-589) compares the whole `Sump Pit Flood` projection for `flooded: false` and `true` beside a reported sensor fault, a backup run, and `everyOtherConditionActive()` with `offlineConfirmed: true`. The two-row level loop (591-621) compares the whole level projection beside a backup run and beside every other active condition. Wrong row (1) (withhold the flood verdict on a sensor fault) projects `[]` for four flood rows. Wrong row (2) (withhold the level) fails 506 (`true`) and 601. Wrong row (3) (flood OR `backupRunning`) fails the `a backup pump run` / `false` flood row. The R3 controls A and B show the first two. |
| CR-05-CATALOGUE-022 | BLOCKER | fixed | 1354-1386: a two-row loop projects `Basement Guardian Offline` with `decoded: undefined` and the seven non-connectivity scopes written out with reason `invalid`, and compares the whole projection (`true` -> `CONTACT_NOT_DETECTED`, `false` -> `CONTACT_DETECTED`). This is the input `basementGuardian.ts:1010-1012` builds for an unresolved family (`NON_CONNECTIVITY_SCOPES` violated, `projectionInputOf(undefined, ...)`). A row that withholds while the `connectivity` group is absent projects `[]` and fails both rows (R3 control). A row that withholds while any scope is `invalid` fails 1514 too. |
| CR-05-CATALOGUE-001 | WARNING | still fixed | Source 1-31 and test 1-10 have the D-01 layout. The tracer prints `ACCESSORIES_HEADERS_OK files=2`. |
| CR-05-CATALOGUE-002 | WARNING | still fixed | `grep -c "act & assert"` gives 0. Every new case has separate `// arrange`, `// act` and `// assert` phases. |
| CR-05-CATALOGUE-003 | BLOCKER | still fixed | Matrix 1392-1439: all seven read groups in every row, `{}` in "a group carrying none of its facts" (1412), string facts in "facts of the wrong type" (1413-1424). Expected: sixteen `[]` (1437). |
| CR-05-CATALOGUE-004 | BLOCKER | still fixed | Off-ladder cases at 455-473 (`{ 31, 20, false }`, whole) and 475-487 (`{ 1, 20, true }`, `LEAK_DETECTED`). The import case is "imports nothing from the water level ladder module" (2022-2028). |
| CR-05-CATALOGUE-005 | BLOCKER | still fixed | `grep "map((row) => row.kind)"` finds nothing. Literals pin the order at 1528-1555 and 1619-1646. |
| CR-05-CATALOGUE-006 | BLOCKER | still fixed | `grep -c isInteger` gives 0. The outage cases at 1963-1980 and 1982-1993 compare `summarise(row.project(input))` whole. |
| CR-05-CATALOGUE-007 | BLOCKER | still fixed | The positive at 198-204 has all five required members. The negative at 205-206 lacks only `offlineConfirmed`. `npm run typecheck` exits 0. |
| CR-05-CATALOGUE-008 | WARNING | still fixed | Source 244 `function isRowTrusted` has no `export`. `grep -c isRowTrusted` in the test gives 0. |
| CR-05-CATALOGUE-009 | WARNING | still fixed | 12 top-level `describe()` blocks (1527, 2034, 2060, 2084, 2108, 2134, 2317, 2359, 2522, 2560, 2669, 2764), one for each of the 12 exported functions (source 262-1038). The 14 cases the round-3 repairs added call `row.project` inside `register*Cases`, which run under `createServiceCatalogue`. |
| CR-05-CATALOGUE-010 | WARNING | still fixed | `readOf` (2648-2659) is `async` and awaits `handleGetRequest()` inside its `try`. All four callers await it (2684, 2711, 2731, 2748). |
| CR-05-CATALOGUE-011 | WARNING | still fixed | Source 1032-1036 is in the present tense and correct. Line 1043 is unchanged. |
| CR-05-CATALOGUE-012 | WARNING | still fixed | Test 916-917 is in the present tense. |
| CR-05-CATALOGUE-013 | WARNING | still fixed | Test 101 and 1389-1390 describe what the code does. |
| CR-05-CATALOGUE-014 | WARNING | still fixed | `clearFaults()` (113-122) returns a new group on each call. `grep -c CLEAR_FAULTS` gives 0. The new seed `everyOtherConditionActive()` (240-253) also returns a new object on each call, and each data row that holds one is read by one case only. |
| CR-05-CATALOGUE-015 | WARNING | still fixed | `grep -c "(value) =>"` gives 0. |
| CR-05-CATALOGUE-016 | WARNING | still fixed | The two separately titled cases are at 1904-1923 and 1925-1944, and their expected values are unchanged. |
| CR-05-CATALOGUE-017 | WARNING | still fixed | `grep -c " ? "` gives 0. The five new loop bodies (577-588, 603-620, 720-731, 742-759, 1362-1385) take every expected value from a field of the row and hold no conditional. |
| CR-05-CATALOGUE-018 | BLOCKER | still fixed | 1103-1137 (two rows that break D-07, whole projections of both battery rows) and 1139-1167 (`{ protectionHoursCode: 8, levelPercent: 25 }`, whole). |
| CR-05-CATALOGUE-019 | BLOCKER | still fixed | 1339-1352: `connectivity: { reportedOffline: true }` with `offlineConfirmed: false` expects the whole projection `[ContactSensorState CONTACT_DETECTED]`. |

New IDs: CR-05-CATALOGUE-023 (BLOCKER), CR-05-CATALOGUE-024 (WARNING). Neither is a reopen.
023 was already present at the batch base: `git show ef7578f:test/...` has the "on both primary
rows" case (447) and no backup counterpart. 024 is the title of a case that predates the batch;
the round-3 repair for 020 extended that case and added a seed that defines the same phrase
differently, so the mismatch is now inside one file.

### Preservation (D-05)

Source diff `ef7578f..e790d20`: the header (2-6), the `isRowTrusted` JSDoc paragraph, the dropped
`export` on `isRowTrusted`, and the `seedConfiguredName` JSDoc paragraph. Nothing else changed.
The source was last touched by `b70716f`; its blob is `cef0ebf54fdb34c06e069609b325db919e591718`,
the blob every recorded assertion control restored. These are the same as at the base: every
subtype (`subtype: kind`, 639), every display name, every characteristic mapping, the
`trustedGroup`/`isRowPublishable` withholding, the `StatusActive` source (`isRowFullyTrusted`),
the `StatusFault` projections, the `alwaysPublish` flags, and the single
`new hap.HapStatusError(status)` push in `publishPersistentFailure` (1008). In the test, literals
pin the subtypes (1528-1555), the names and scopes (1557-1589, 1619-1646) and the service types
(1678-1707), and every one of those cases passes. The round-3 repairs only added cases (196 ->
210) and changed one assertion from picked values to the whole projection (506-528). They
removed no case.

## Row coverage sweep

Columns: (a) each value the row publishes and the decoded fact it reads; (b) whether a case feeds
a fact that differs from what a re-derivation from other facts would give; (c) whether each input
the row must ignore is set, in some case that asserts the row, to the state that would change the
output if the row read it. That includes the sibling field a copy-paste error would read.
"Candidate N" points to `## Candidates considered and not filed`.

| # | Row | (a) Publishes <- reads | (b) Fact off its derivation | (c) Ignored inputs exercised | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | Sump Pit Flood | `LeakDetected` <- `water.flooded` | 475-487 `{1, 20, true}` expects `LEAK_DETECTED`. The opposite direction stays rejected (R3 candidate 1). | Sensor fault, backup run, every other condition, each with both verdicts, whole: 530-589 (021). Own scope `unreachable` 1819, `invalid` 1835, both 1884. Other scopes: 1595. | Covered |
| 2 | Sump Pit Level | `WaterLevel` <- `levelPercent`; `RawWaterLevelCode` <- `levelCode`; `WaterSensorFaultReported` and `StatusFault` <- `fault.waterSensorFault` | 455-473 `{31, 20, false}`, whole. | `fault` scope `invalid`: 489-504 (whole), 1925. Outage: 1904. Sensor fault both values, whole: 506-528 (021). Backup run and every other condition, whole: 591-621 (021). A sibling-fault `.some()` aggregate: still rejected (R3 candidate 2). The every-other row has `waterSensorFault: true`, so it does not separate the aggregate. | Covered |
| 3 | Primary Pump | `PumpRunning` <- `pump.primaryRunning`; `PumpFault`, `StatusFault` <- `fault.primaryPumpFault`; no fuse; record from `primaryPumpRecord` | n/a | Running swap: 626-648 (`backupRunning: false` beside `primaryRunning: true`). Fault swap: 650-673 (group carries only `primaryPumpFault`). Backup fuse: 918-949, 981-1005. Backup record: 796 (count 7 vs 0). Undecoded running: 981. OR with `backupRunning`: still rejected (R3 candidate 3, service half). | Covered |
| 4 | Primary Pump Running | `ContactSensorState` <- `pump.primaryRunning` | n/a | 626-648 (value), 734-760 (whole, all four combinations during a test). The `{false, true}` row of 736 now fails both a swap and an OR with `backupRunning`, so R3 candidate 3's adapter half is closed. Faults, mains and offline: still rejected (R3 candidate 4). | Covered |
| 5 | Backup Pump | `PumpRunning` <- `pump.backupRunning`; `PumpFault` <- `backupPumpFault`; `PumpFuseBlown` <- `backupPumpFuseBlown`; `StatusFault` <- fault OR fuse; record and label from `backupPumpRecord` | n/a | Fault and fuse swaps and the merge: 675-700, 702-716. Records and label: 809, 844-878, 883-898, 954. **`PumpRunning` is never asserted in a state where `primaryRunning` and `backupRunning` differ:** 918 sets both `true`, 981 sets neither, and every other case that projects this row uses the default (both `false`) and asserts other values. A self-test under this row: rejected (candidate 1). | **Gap: CR-05-CATALOGUE-023** |
| 6 | Backup Pump Running | `ContactSensorState` <- `pump.backupRunning` | n/a | Self-test both values: 719-732; all four running combinations during a test: 734-760; activation time: 762-774; primary running, mains loss, primary and water faults, a test in progress, offline confirmed: 776-791 (020). | Covered (the title of 776 is CR-05-CATALOGUE-024, a WARNING, not a coverage gap) |
| 7 | Sump Mains Power | `MainsPowerPresent` <- `power.mainsPresent` | n/a | Both values, whole: 1014. Own scope `invalid` 1502, `controller-link-lost` 1851, tolerance 1995/2009. Battery and offline: still rejected (R3 candidate 4). | Covered |
| 8 | Mains Power Lost | `ContactSensorState` <- NOT `mainsPresent`; `StatusFault` `NO_FAULT` while `mainsPresent` decoded | n/a | 1027-1040 whole in both states; 1502. | Covered |
| 9 | Backup Battery Level | `StatusLowBattery` <- `battery.low`; `BatteryLevel` <- `levelPercent`; `ChargingState` <- `charging` | `low`: 1103-1137 both directions. `levelPercent`: 1139-1167. | Health and voltage against the verdict: 1046, 1106. Charging against mains: 1169-1188 (`charging: false` while mains is present). `NOT_CHARGEABLE`: 1190. | Covered |
| 10 | Backup Battery | `BatteryCharging`, `BatteryVoltageLow`, `BatteryHealthCode`, `ProtectionHoursCode` <- the same-named facts | The inverse derivations fail 1106 and 1141. | Charging/voltage swap fails the first row of 1106; health/protection swap fails its second row. | Covered |
| 11 | Primary Pump Fault | `ContactSensorState`, `StatusFault` <- `fault.primaryPumpFault` | n/a | Every sibling condition alone, offline included: 1211-1223. `StatusFault` against an active water fault: 1225-1246. Link-lost and `invalid` scope: 1270, 1286. | Covered |
| 12 | Backup Pump Fault | the same pair <- fault OR fuse | n/a | 1211-1223 (fault and fuse separately, and siblings). One missing fact: unreachable, still rejected (R3 candidate 5). | Covered |
| 13 | Water Sensor Fault | the same pair <- `fault.waterSensorFault` | n/a | 1211-1223, 1225-1246, 1270, 1286. | Covered |
| 14 | Pump Controller Link Lost | the pair <- NOT `controllerLinkPresent`; `ControllerLinkPresent`; `ControllerDataLastTrustedAt` <- the input string while the link fact decoded; tolerates `controller-link-lost` | n/a | Siblings and offline: 1211-1223. Whole: 1248, 1301, 1963. `invalid`: 1286. | Covered |
| 15 | System Self-Test | `On` <- `'self-test'.running`, nothing while pending | n/a | Both values, whole: 1441-1453. Own pending: 1458. Other pending: 1476. `invalid`: 1490. | Covered |
| 16 | Alarm Mute | `On` <- `'alarm-mute'.muted`, nothing while pending | n/a | 1458, 1476 (`muted: true`). A capability or field swap fails 1458 or 1476. `muted: false` not asserted: still rejected (R3 candidate 6). | Covered |
| 17 | Basement Guardian Offline | `ContactSensorState` <- `offlineConfirmed` | n/a | Both values: 1322-1337. `reportedOffline: true`: 1339-1352. No decoded state, other scopes `invalid`: 1354-1386 (022). Unrelated scope `invalid`: 1514. Outage: 1982. Siblings: 1211-1223. | Covered |

Sweep result: 16 rows covered and 1 gap filed (row 5, CR-05-CATALOGUE-023). R3 rejections 1, 2,
4, 5 and 6 still hold. R3 candidate 3 is now closed for the adapter by 736 and stays rejected
for the service. One new gap was considered and rejected (candidate 1 below).

## Findings

### CR-05-CATALOGUE-023 - BLOCKER: No case gives the two pumps different running states while it reads the Backup Pump service, so a backup row that reads `primaryRunning` passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate the behavior named in its title; a wrong implementation makes the assertion fail); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: a case a wrong implementation would pass, from missing assertions); `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Compare whole values")
**Location:** `e790d20da2ce14d82304048c524159b23b7b9293:test/accessories/serviceCatalogue.test.ts:626-648, 675-716, 900-1005` (production contract at `e790d20da2ce14d82304048c524159b23b7b9293:src/accessories/serviceCatalogue.ts:15-17, 488-514`)
**Issue:** `backupPumpValues` publishes `PumpRunning` from `pump.backupRunning` (507), one line apart from `primaryPumpValues`, which reads `pump.primaryRunning` (492). The primary side has "publishes the reported primary pump running state of B on both primary rows" (626-648). Its rows set `backupRunning: false` beside `primaryRunning: true`, so a primary service that read the backup field fails. The backup side has no counterpart. I traced every case that projects the `backup-pump` row. 681-700, 702-716, 809-823, 844-860, 865-878, 883-898, 900-914, 1595, 1755 and 1787 all use the default pump group (both pumps `false`). Each one asserts other values, a filtered subset, record presence, or a comparison with a second production call. 918-949 sets both pumps `true`. 981-1005 decodes neither. The matrix (1426) gives only malformed groups. So no case reads the backup service's `PumpRunning` while `primaryRunning` and `backupRunning` differ. These wrong rows pass all 210 cases: (1) `running: booleanOf(trustedGroup(input, trust, 'pump'), 'primaryRunning')` in `backupPumpValues`, a copy-paste of line 492 directly above it, and the field-swap mistake the earlier rounds call the plausible one (R2 candidate 5, R3 candidate 3); (2) `primaryRunning || backupRunning`. Row (1) reports the backup pump idle while only the backup pump runs. That is the state an owner most needs to see: the primary pump failed or was overwhelmed, and the backup is running on battery. Row (1) also reports the backup pump running whenever the primary runs. The declared-scope case (1595) does not catch either row, because both still read through the `pump` scope. The adapter-level cases (719-760) project only `Backup Pump Running`, which reads through the separate `pumpActivityValues`. Production is correct today. A read-only probe gives the `Backup Pump` service `PumpRunning true` for `{ primaryRunning: false, backupRunning: true }` and `PumpRunning false` for `{ primaryRunning: true, backupRunning: false }`. The R3 sweep listed row 5's other inputs, but it did not check which pump field this row's `PumpRunning` reads. The gap was already there at the batch base (`ef7578f`: the primary case at 447, no backup counterpart).
**Fix:** In `registerPumpCases`, add the backup counterpart of 626-648 as a two-row loop with written-out rows, and compare whole projections. Rows: `{ primaryRunning: false, backupRunning: true, contactState: CONTACT_NOT_DETECTED }` and `{ primaryRunning: true, backupRunning: false, contactState: CONTACT_DETECTED }`. Title: `publishes the reported backup pump running state of ${String(backupRunning)} on both backup rows`. Arrange `projectionInput({ decoded: decodedState({ pump: { primaryRunning, backupRunning } }) })`. Expect `Backup Pump` to be `[PumpRunning backupRunning, PumpFault false, PumpFuseBlown false, StatusFault NO_FAULT, ObservationStartedAt OBSERVATION_START, ObservedActivationCount 0, LastObservedActivationAt '']` and `Backup Pump Running` to be `[ContactSensorState contactState]`. A probe of production with those inputs gives exactly those values. Keep every existing case. Assertion control: change `'backupRunning'` to `'primaryRunning'` in `backupPumpValues` and observe both new rows fail. Then apply the OR and observe the `{ true, false }` row fail.
**Flags:** none (no D-04 candidate: production reads `backupRunning`; no D-06, D-10, D-11, D-13, D-14, D-16 or D-17)

### CR-05-CATALOGUE-024 - WARNING: "leaves the backup pump adapter quiet while every other condition is active" leaves six other conditions inactive, and the same phrase means all of them in the seed beside it

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments and test titles describe what the code does); `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("Title each case with a short sentence stating public behavior")
**Location:** `e790d20da2ce14d82304048c524159b23b7b9293:test/accessories/serviceCatalogue.test.ts:776-791` (the seed with the other definition at `240-253`, used at `562-575` and `601`)
**Issue:** The title promises that the backup activity adapter stays quiet "while every other condition is active". The decoded state (779-784) sets the primary pump running, mains lost, a primary pump fault, a water sensor fault and a self-test running, with `offlineConfirmed: true`. It leaves these inactive: the backup pump fault and the fuse (`false`), the controller link (`controllerLinkPresent: true`), the battery (the default healthy group), the alarm mute (`muted: false`), and the device's own offline report (`reportedOffline: false`). The round-3 repair for 020 extended this case so that "every other condition" includes a test in progress. In the same round, `everyOtherConditionActive()` (240-253) was added. Its comment defines the phrase as every decoded group but `water` in its active state, and the water cases use it under the label "every other active condition" (562-575, 601). The file now gives one phrase two meanings. A reader of the test report can believe the backup adapter is pinned against a backup pump fault, a blown fuse, a lost link, a low battery, a mute and the device's own offline report, and none of those is set in this case. No plausible wrong row passes because of this gap. The finding is about a misleading title, so its severity is WARNING.
**Fix:** Arrange the case from the seed, so that the title is true and the phrase has one meaning: `decodedState({ ...everyOtherConditionActive(), pump: { primaryRunning: true, backupRunning: false, backupActivatedAt: 1_700_000_000 } })` with `offlineConfirmed: true`. Keep the expected value `[ContactSensorState CONTACT_DETECTED]`. A production probe with that input gives `[ContactSensorState 0]`. Alternatively, keep the arrange and retitle the case to name the conditions it sets. The seed is the smaller change and also closes R3 candidate 4 for this row. Keep the title if the arrange changes.
**Flags:** none (cites CR-05-CATALOGUE-020, whose repair edited these lines; it is not a D-10 citation of SC-02 or CR-04-ACCOUNT)

## Candidates considered and not filed

1. **Backup Pump service `PumpRunning` during a self-test** (the "optional half" of 020 in the R3
   sweep, row 5). No case asserts the service's `PumpRunning` while `'self-test'.running` is
   `true`. Not filed, and 020 is not held open for it. 020's required fix concerned the alert
   adapter. R3 marked this half optional, and the coordinator accepted that sweep. The motive
   that makes the adapter mistake plausible is to silence a notification during a routine
   test. That motive is C-001's subject (source 516-522), and it does not apply to a status
   characteristic. The same service already publishes `LastActivationWasTestActivity`
   (466-475), which is the design's channel for test activity. A shared "real run" helper used
   by both backup rows would fail the adapter cases at 719-760. The service-only suppression that
   remains needs an author who contradicts the label on the same service. Once
   CR-05-CATALOGUE-023 is fixed, the field this value reads is pinned too.
2. **`everyOtherConditionActive()` and the other decoded seeds are not checked with `satisfies`**
   against the family group types (`cases.md` Test data). Not filed. `ProjectionInput.decoded` is
   `unknown`, and the suite deliberately builds partial and malformed groups through
   `decodedState()` (514, 658, 685, 706, 985). Every key of the new seed matches
   `src/device/family.ts` (`PumpState` 85-97 including `backupActivatedAt` in seconds,
   `PowerState`, `BatteryState`, `FaultState`, `ConnectivityState`, `SelfTestState`,
   `AlarmMuteState`). R3 offered `satisfies` as optional for 020, and the coordinator did not
   require it. A coordinator who takes the stricter reading would need one cause for all four
   seeds (`clearFaults`, `batteryGroup`, `decodedState`, `everyOtherConditionActive`).
3. **The comment at 718 ("The device reports a self-test in the `self-test` group, not in the
   `pump` group.")** Not filed. It is a present-tense fact about the decoded shape
   (`ScopedDomainState`), it does not describe the removed key, and it explains a setup that is
   not obvious.
4. **The title "activates the backup pump adapter during a self-test run of false" (720).** Not
   filed. This is the boolean-interpolated title class that R1 rejected as candidate 2. Both rows
   assert correctly, and the comment above the loop says what the parameter is.
5. **`backupActivatedAt: 1_700_000_000_000` (762) is in milliseconds** while `PumpState` documents
   Unix seconds and the new seeds use seconds. Not filed. This is pre-existing. No row reads the
   timestamp, so the case only needs a number, and the source says the adapter ignores it.
6. **The fault-adapter cases (1211-1246) pick `ContactSensorState` or `StatusFault` rather than the
   whole projection.** Not filed. All five adapters build their pair through one helper,
   `faultAdapterValues` (599-605). 1248, 1301 and 1963 compare that output whole for the link
   row. R3 accepted these rows as covered.
7. **The matrix comment and filter (1389-1390, 1433) do not name where the offline row's
   absent-state behavior is pinned.** R3 offered that change as optional. Not filed. The title
   "projects nothing on any decoded-state row" correctly excludes the offline row, and the 022
   cases sit in `registerOfflineCases` beside the other offline cases.
8. **R3 candidates 1, 2, 4, 5, 6, 7 and 8, and R1 and R2 candidates.** Accepted earlier as
   reasoned rejections. Not re-filed: I re-read each cited region at this revision and found no
   concrete reason to reverse any of them. R3 candidate 3 is now partly closed (the adapter half
   by 736). Its service half still holds, because no text invites an OR across the two pumps. The
   field swap that it called "the plausible mistake" is caught on the primary service by 626. On
   the backup service no case catches it, and that is CR-05-CATALOGUE-023.

## Header inspection

- `src/accessories/serviceCatalogue.ts`: conforms. Line 1 is `// SPDX-License-Identifier: MIT`,
  2 is blank, 3-5 are `/**` / ` * Copyright (c) 2026 Alessandro Colomba` / ` */`, 6 is blank,
  7-30 are the `@fileoverview` block, 31 is blank and 32 is the first import.
- `test/accessories/serviceCatalogue.test.ts`: conforms. Line 1 is SPDX, 2 is blank, 3-5 are the
  copyright block, 6 is blank, 7-9 are
  `@fileoverview Tests the service catalogue rows and their publish helpers.`, 10 is blank and 11
  is the first import.
- Tracer: `ACCESSORIES_HEADERS_OK files=2`, exit 0.

## Toolchain evidence

I ran every command from the repository root at HEAD `e790d20da2ce14d82304048c524159b23b7b9293`
with a clean tree (`git status --porcelain` was empty before and after). Node `v26.12.0`, npm
`11.20.0`, 2026-10-17T16:44:30Z to 16:44:54Z. Every command had the prefix
`export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both `tsc --noEmit` passes are clean |
| `node_modules/.bin/eslint src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | |
| `node --test dist-test/test/accessories/serviceCatalogue.test.js` | 0 | tests 210, suites 12, pass 210, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` | 0 | printed only the npm banner (100% direct pair coverage) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CATALOGUE` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

Supporting read-only probes (made-up inputs, no source or test change):
`node --input-type=module -e` against `dist-test/src/accessories/serviceCatalogue.js` and
`dist-test/features/lib/hap.js`. `Backup Pump` gives `PumpRunning true` for
`{ primaryRunning: false, backupRunning: true }` and `PumpRunning false` for
`{ primaryRunning: true, backupRunning: false }`, and `Primary Pump` gives the opposite. With the
default record, the whole `Backup Pump` projection is
`[PumpRunning B, PumpFault false, PumpFuseBlown false, StatusFault 0, ObservationStartedAt
'2026-08-01T00:00:00.000Z', ObservedActivationCount 0, LastObservedActivationAt '']` (023's fix
values). `Backup Pump Running` with every other condition active and `backupRunning: false` gives
`[ContactSensorState 0]` (024's fix value). The test output's only repeated titles are the three
"answers nothing for ..." cases, which sit in two different suites (`booleanOf`, `numberOf`). I
ran no mutation experiment. Each claim that a wrong row passes comes from tracing every case that
projects the row.

## Out-of-scope observations

- `test/accessories/basementGuardian.test.ts` (ACCESSORY batch, Phase 5): `grep PumpRunning`
  finds no assertion on either pump service's `PumpRunning`. The `backup_pump_running: true`
  snapshots (2138-2327) drive the pump record cases. So no test at the accessory level protects
  the `Backup Pump` service against reading the primary pump either. This is the accessory-side
  view of CR-05-CATALOGUE-023.
- `test/accessories/basementGuardian.test.ts:887-904` (ACCESSORY batch): R3 noted that this case
  protected the offline row for an unresolved family. 1354-1386 now pins that behavior in the
  owning pair, so the accessory case is no longer the only protection.
- `features/lib/hap.ts:341-348` and `486-488` (Phase 7 under D-12, GATES parity under D-16): the
  stand-in read-path differences from real HAP that lead S-05-23 tracks are unchanged. This batch
  handles both forms.

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action. Evidence re-read: the `Backup Pump` service's `PumpRunning` value in
`src/accessories/serviceCatalogue.ts` reads `backupRunning`, and no case asserts it while the two
pumps differ; the round-3 seed `everyOtherConditionActive()` and the case titled "leaves the
backup pump adapter quiet while every other condition is active".

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-020 to 022 | BLOCKER | fixed | Confirmed fixed by this round. |
| CR-05-CATALOGUE-001 to 019 | as opened | fixed | Confirmed still fixed by this round. |
| CR-05-CATALOGUE-023 | BLOCKER | open | Accepted: a new cause present at the batch base. Fix as the report says (a two-row loop with the pumps in opposite states, whole projections), with an assertion control that reads the wrong pump field. |
| CR-05-CATALOGUE-024 | WARNING | open | Accepted: a new cause introduced by the round-3 repairs. Arrange the case from `everyOtherConditionActive()` with `backupRunning: false`, keeping its expected value, or retitle it to what it sets. |

The updated row sweep (16 of 17 rows covered) and the other candidates are accepted as reasoned.

Counter (D-03 as amended, D-18): opening 3, fixed 3, rejected 0, new 2, reopened 0, closing 2.
Closing (2) is below opening (3), no ID reopened and the round is below 10: `continue`.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CATALOGUE-023 | `test/accessories/serviceCatalogue.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/serviceCatalogue.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 0 (212 tests, 12 suites, 212 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` exit 0 (no output); `node_modules/.bin/eslint test/accessories/serviceCatalogue.test.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base ef7578f8c86c7f7b65adc3648cd7e404cfee7d12 --format json --quiet --explain` exit 0, verdict pass | see `## Assertion controls` (A and B) | In `registerPumpCases`, directly after the primary loop, a new two-row loop, "publishes the reported backup pump running state of B on both backup rows", arranges `projectionInput({ decoded: decodedState({ pump: { primaryRunning, backupRunning } }) })` with the pumps in opposite states. It compares the whole `{ pump, adapter }` value of the `Backup Pump` and `Backup Pump Running` projections with written-out rows. `{ primaryRunning: false, backupRunning: true }` expects `pump: [PumpRunning true, PumpFault false, PumpFuseBlown false, StatusFault NO_FAULT, ObservationStartedAt OBSERVATION_START, ObservedActivationCount 0, LastObservedActivationAt '']` and `adapter: [ContactSensorState CONTACT_NOT_DETECTED]`. `{ primaryRunning: true, backupRunning: false }` expects the same `pump` list with `PumpRunning false`, and `adapter: [ContactSensorState CONTACT_DETECTED]`. Each row carries its expected `pumpRunning` and `contactState`. Every existing case is kept. The count grows from 210 to 212. No source change. |
| CR-05-CATALOGUE-024 | `test/accessories/serviceCatalogue.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/serviceCatalogue.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 0 (212 tests, 12 suites, 212 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` exit 0 (no output); `node_modules/.bin/eslint test/accessories/serviceCatalogue.test.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base ef7578f8c86c7f7b65adc3648cd7e404cfee7d12 --format json --quiet --explain` exit 0, verdict pass | none (WARNING: a title that overclaimed, no wrong row passed) | "leaves the backup pump adapter quiet while every other condition is active" now arranges `decodedState({ ...everyOtherConditionActive(), pump: { primaryRunning: true, backupRunning: false, backupActivatedAt: 1_700_000_000 } })` with `offlineConfirmed: true`. Every group but `water` is in its active state: every equipment fault and the fuse, a lost controller link, the primary pump running with a backup activation time, mains lost, a low battery, a self-test running, the alarm muted and the device reporting itself offline. Only `backupRunning` is `false`. The title and the expected value `[ContactSensorState CONTACT_DETECTED]` are unchanged, so the phrase "every other condition" has the seed's meaning throughout the file. The count stays 212. No source change. |

## Assertion controls

| ID | Wrong behavior | Mutation and blobs | Failing assertion output | Restoration |
| --- | --- | --- | --- | --- |
| CR-05-CATALOGUE-023 (A) | The `Backup Pump` service publishes `PumpRunning` from the primary pump's field (wrong row 1 of the finding, a copy of the line above it) | In `src/accessories/serviceCatalogue.ts` `backupPumpValues`, `running` became `booleanOf(trustedGroup(input, trust, 'pump'), 'primaryRunning')`. Blob before `cef0ebf54fdb34c06e069609b325db919e591718`, mutated `cb0eb44b07afb9370a5e219a73cef2699b60dc6a`; `npm run build:test` exit 0 | `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 1 (212 tests, 210 pass, 2 fail). Only the two new rows fail, each with `AssertionError [ERR_ASSERTION]` on the whole `{ pump, adapter }` value. In `publishes the reported backup pump running state of true on both backup rows`, the `PumpRunning` entry (`uuid: '5b3a4ee5-cb3f-4fd5-ab25-13c886fd0ad6'`) has actual `value: false`, expected `value: true`. In `... of false on both backup rows`, it has actual `value: true`, expected `value: false`. The `adapter` half matches in both rows | `git checkout -- src/accessories/serviceCatalogue.ts` exit 0; blob `cef0ebf54fdb34c06e069609b325db919e591718`, equal to the recorded one; `git diff --exit-code -- src/accessories/serviceCatalogue.ts` exit 0 |
| CR-05-CATALOGUE-023 (B) | The `Backup Pump` service reports running while either pump runs (wrong row 2 of the finding) | In `src/accessories/serviceCatalogue.ts` `backupPumpValues`, `running` became `booleanOf(trustedGroup(input, trust, 'pump'), 'primaryRunning') \|\| booleanOf(trustedGroup(input, trust, 'pump'), 'backupRunning')`. Blob before `cef0ebf54fdb34c06e069609b325db919e591718`, mutated `e1aa51d1395ae1df6c038a77f3c33da3ec2580fc`; `npm run build:test` exit 0 | `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 1 (212 tests, 211 pass, 1 fail). `publishes the reported backup pump running state of false on both backup rows` (primary running, backup idle) fails with `AssertionError [ERR_ASSERTION]` on the whole `{ pump, adapter }` value: the `PumpRunning` entry (`uuid: '5b3a4ee5-cb3f-4fd5-ab25-13c886fd0ad6'`) has actual `value: true`, expected `value: false` | `git checkout -- src/accessories/serviceCatalogue.ts` exit 0; blob `cef0ebf54fdb34c06e069609b325db919e591718`, equal to the recorded one; `git diff --exit-code -- src/accessories/serviceCatalogue.ts` exit 0; rebuilt (exit 0), the owner test passes (exit 0, 212 tests, 12 suites, 0 failures) |
