---
phase: 05-accessories-conformance
batch: CATALOGUE
review_round: 5
reviewed: 2026-10-17T17:03:19Z
depth: deep
source_revision: ddc645b1329990f3e9a652cfaa48767532d85186
files_reviewed: 2
files_reviewed_list:
  - src/accessories/serviceCatalogue.ts
  - test/accessories/serviceCatalogue.test.ts
findings:
  blocker: 0
  warning: 1
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 5)
---

# Phase 5 CATALOGUE batch: correction round 5

I read every line of both files fresh and in full at `ddc645b1329990f3e9a652cfaa48767532d85186`
(source 1050 lines, test 2863 lines). I did not review a diff. After the full read I used diffs
for two checks only: preservation against the batch base `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12`
(D-05), and the content of the two round-4 repair commits (`git diff e790d20..ddc645b`).

Inputs read: AGENTS.md; the three `.agents/skills` books (each `SKILL.md` and every `rules/*.md`
file); `05-CONTEXT.md`; `05-REVIEW-PROTOCOL.md`; `05-CATALOGUE-REVIEW.md` and `-R1.md` to `-R4.md`
(findings, candidates, Coordinator triage, Repair history, Assertion controls, and the R3 and R4
row coverage sweeps); the CATALOGUE rows and the dispatch log of `05-FINDINGS.md`; and, for the
out-of-scope check, `features/lib/hap.ts:341-348, 484-488`.

Opening open set: 2 IDs (CR-05-CATALOGUE-023 BLOCKER, CR-05-CATALOGUE-024 WARNING). Result: 023 is
fixed. 024 is still open, because one condition the title names is still inactive in the
arrange. None of 001 to 022 reopened. No new cause. Count: 2 opening - 1 fixed - 0 rejected + 0
new + 0 reopened = 1 closing.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-023 | BLOCKER | fixed | Test 650-683: a two-row loop, "publishes the reported backup pump running state of B on both backup rows". The rows `{ primaryRunning: false, backupRunning: true }` and `{ primaryRunning: true, backupRunning: false }` put the pumps in opposite states. Each case compares the whole `{ pump, adapter }` value of `Backup Pump` (seven written-out entries: `PumpRunning`, `PumpFault false`, `PumpFuseBlown false`, `StatusFault NO_FAULT`, `ObservationStartedAt OBSERVATION_START`, `ObservedActivationCount 0`, `LastObservedActivationAt ''`) and `Backup Pump Running` (`ContactSensorState`). Each row carries its expected `pumpRunning` and `contactState`, so the loop body holds no conditional. A backup service that reads `primaryRunning` fails both rows. One that ORs both pumps fails the second row, and one that ANDs them fails the first. The R4 assertion controls A and B show the first two failures. |
| CR-05-CATALOGUE-024 | WARNING | still open | Test 811-821 is now arranged from `everyOtherConditionActive()` with `backupRunning: false` and `offlineConfirmed: true`. This closes the six inactive conditions that R4 listed (backup pump fault, fuse, controller link, battery, mute, the device's own offline report). The seed is "every decoded group but `water`" (240-253), so the `water` group stays at the `decodedState()` default `{ levelCode: 1, levelPercent: 20, flooded: false }` (228). The title "while every other condition is active" therefore still claims a condition the case does not set: a flooding pit. See `## Findings`. |
| CR-05-CATALOGUE-001 | WARNING | still fixed | Source 1-31 and test 1-10 have the D-01 layout. The tracer prints `ACCESSORIES_HEADERS_OK files=2`. |
| CR-05-CATALOGUE-002 | WARNING | still fixed | `grep -c "act & assert"` gives 0. Each case has separate `// act` and `// assert` phases, and the two round-4 cases also have `// arrange`. |
| CR-05-CATALOGUE-003 | BLOCKER | still fixed | Matrix 1422-1469: all seven read groups in every row, `{}` in "a group carrying none of its facts" (1442), string facts in "facts of the wrong type" (1443-1454). Expected value: sixteen `[]` (1467). |
| CR-05-CATALOGUE-004 | BLOCKER | still fixed | Off-ladder cases at 455-473 (`{ 31, 20, false }`, whole projection) and 475-487 (`{ 1, 20, true }`, `LEAK_DETECTED`). The import case is "imports nothing from the water level ladder module" (2052-2058). |
| CR-05-CATALOGUE-005 | BLOCKER | still fixed | `grep "map((row) => row.kind)"` finds nothing. Written-out literals pin the order at 1558-1585 and 1649-1676. |
| CR-05-CATALOGUE-006 | BLOCKER | still fixed | `grep -c isInteger` gives 0. The outage cases at 1993-2010 and 2012-2023 compare `summarise(row.project(input))` whole. |
| CR-05-CATALOGUE-007 | BLOCKER | still fixed | The positive at 198-204 has all five required members. The negative at 205-206 lacks only `offlineConfirmed`. `npm run typecheck` exits 0. |
| CR-05-CATALOGUE-008 | WARNING | still fixed | Source 244 `function isRowTrusted` has no `export`. `grep -c isRowTrusted` in the test gives 0. |
| CR-05-CATALOGUE-009 | WARNING | still fixed | There are 12 top-level `describe()` blocks (1557, 2064, 2090, 2114, 2138, 2164, 2347, 2389, 2552, 2590, 2699, 2794), one for each exported function. The round-4 cases call `row.project` inside `registerPumpCases`, which runs under `createServiceCatalogue`. |
| CR-05-CATALOGUE-010 | WARNING | still fixed | `readOf` (2678-2689) is `async` and awaits `handleGetRequest()` inside its `try`. All four callers await it (2714, 2741, 2761, 2778). |
| CR-05-CATALOGUE-011 | WARNING | still fixed | Source 1032-1036 is in the present tense and correct. Code line 1043 is unchanged. |
| CR-05-CATALOGUE-012 | WARNING | still fixed | Test 946-947 is in the present tense. |
| CR-05-CATALOGUE-013 | WARNING | still fixed | Test 101 (`TRUST_SCOPES`) and 1419-1420 (`registerAbsentStateCases`) describe what the code does. |
| CR-05-CATALOGUE-014 | WARNING | still fixed | `clearFaults()` (113-122) returns a new group on each call. `grep -c CLEAR_FAULTS` gives 0. `everyOtherConditionActive()` also returns a new object on each call. |
| CR-05-CATALOGUE-015 | WARNING | still fixed | `grep -c "(value) =>"` gives 0. |
| CR-05-CATALOGUE-016 | WARNING | still fixed | The two separately titled cases are at 1934-1953 and 1955-1974, and their expected values are unchanged. |
| CR-05-CATALOGUE-017 | WARNING | still fixed | `grep -c " ? "` gives 0. The new loop (652-683) takes `pumpRunning` and `contactState` from row fields. |
| CR-05-CATALOGUE-018 | BLOCKER | still fixed | 1133-1167 (two rows that break D-07, whole projections of both battery rows) and 1169-1197 (`{ protectionHoursCode: 8, levelPercent: 25 }`, whole). |
| CR-05-CATALOGUE-019 | BLOCKER | still fixed | 1369-1382: `connectivity: { reportedOffline: true }` with `offlineConfirmed: false` expects the whole projection `[ContactSensorState CONTACT_DETECTED]`. |
| CR-05-CATALOGUE-020 | BLOCKER | still fixed | The `decodedState()` pump default (229) carries no `testRunning`. 754-767 drives `'self-test'.running` for both values. 771-795 compares both activity adapters whole during a test. 811-821 still has a running self-test (through the seed). |
| CR-05-CATALOGUE-021 | BLOCKER | still fixed | 506-528 compares the whole level projection for both sensor-fault values. 533-589 compares the whole flood projection for both verdicts beside each condition. 593-621 compares the whole level projection beside a backup run and beside every other active condition. |
| CR-05-CATALOGUE-022 | BLOCKER | still fixed | 1384-1416: `decoded: undefined` with the seven non-connectivity scopes written out as `invalid`. The whole projection is compared for both confirmation values. |

New IDs: none. No new findings.

No fixed ID reopened. 024 was never confirmed fixed, so its unresolved remainder keeps its ID and
is not a reopen.

### Preservation (D-05)

Source diff `ef7578f..ddc645b`: the header (2-6), the `isRowTrusted` JSDoc paragraph, the dropped
`export` on `isRowTrusted`, and the `seedConfiguredName` JSDoc paragraph. Nothing else changed.
The source was last touched by `b70716f`. Its blob is `cef0ebf54fdb34c06e069609b325db919e591718`,
the blob every recorded assertion control restored. The round-4 commits (`b87ee68`, `da8ff2c`)
touch only the test and the R4 report. These are all the same as at the base: every subtype
(`subtype: kind`, 639), every display name, every characteristic mapping, the
`trustedGroup`/`isRowPublishable` withholding of an undecoded or untrusted scope, the
`StatusActive` source (`isRowFullyTrusted`), the `StatusFault` projections, the `alwaysPublish`
flags, and the single `new hap.HapStatusError(status)` push in `publishPersistentFailure` (1008).
In the test, literals pin the subtypes (1558-1585), the names and scopes (1587-1619, 1649-1676)
and the service types (1708-1737), and every one of those cases passes. The round-4 repairs added
two cases (210 -> 212) and changed one arrange. They removed no case and weakened no assertion:
811-821 keeps its whole-projection expectation `[ContactSensorState CONTACT_DETECTED]`.

## Row coverage sweep

Columns: (a) each value the row publishes and the decoded fact it reads; (b) whether a case feeds
a fact that differs from what a re-derivation from other facts would give; (c) whether each input
the row must ignore is set, in some case that asserts the row, to the state that would change the
output if the row read it, including the sibling field that a copy-paste error would read.
"Candidate N" points to `## Candidates considered and not filed`. Line numbers are at
`ddc645b`.

| # | Row | (a) Publishes <- reads | (b) Fact off its derivation | (c) Ignored inputs exercised | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | Sump Pit Flood | `LeakDetected` <- `water.flooded` | 475-487 `{1, 20, true}` expects `LEAK_DETECTED`. The opposite direction stays rejected (R3 candidate 1). | Sensor fault, backup run, every other condition, each with both verdicts, whole: 533-589. Own scope `unreachable` 1849, `invalid` 1865, both 1914. Other scopes: 1625. | Covered |
| 2 | Sump Pit Level | `WaterLevel` <- `levelPercent`; `RawWaterLevelCode` <- `levelCode`; `WaterSensorFaultReported` and `StatusFault` <- `fault.waterSensorFault` | 455-473 `{31, 20, false}`, whole. | `fault` invalid: 489-504 (whole), 1955. Outage: 1934. Sensor fault both values, whole: 506-528 (a group with only `waterSensorFault`, so a sibling-field read withholds and fails). Backup run and every other condition, whole: 593-621. A `.some()` fault aggregate: still rejected (R3 candidate 2). | Covered |
| 3 | Primary Pump | `PumpRunning` <- `pump.primaryRunning`; `PumpFault`, `StatusFault` <- `fault.primaryPumpFault`; no fuse; record from `primaryPumpRecord` while running decoded | n/a | Running swap: 626-648 (`backupRunning: false` beside `primaryRunning: true`). Fault swap: 685-708 (group carries only `primaryPumpFault`). Fuse absent: 685-708 asserts `fuseBlown: undefined`. Backup record: 826-837 (count 7 against 0). Self-test label: 858-872. Undecoded running: 1011-1035. An OR with `backupRunning`: still rejected (candidate 2). | Covered |
| 4 | Primary Pump Running | `ContactSensorState` <- `pump.primaryRunning` | n/a | 626-648 (value); 771-795 (whole, all four running combinations during a test, so a swap or an OR with `backupRunning` fails). Faults, mains and offline: still rejected (R3 candidate 4). | Covered |
| 5 | Backup Pump | `PumpRunning` <- `pump.backupRunning`; `PumpFault` <- `backupPumpFault`; `PumpFuseBlown` <- `backupPumpFuseBlown`; `StatusFault` <- fault OR fuse; record and label from `backupPumpRecord` | n/a | **Pumps in opposite states, whole: 652-683 (023).** Fault and fuse swaps and the merge: 710-735, 737-751. Records and label: 839-853, 874-890, 895-908, 914-928, 984-1005. Undecoded running: 1011-1035. Self-test under the service: still rejected (R4 candidate 1); R4 noted that once 023 is fixed the field this value reads is pinned too, and it is. | Covered |
| 6 | Backup Pump Running | `ContactSensorState` <- `pump.backupRunning` | n/a | Self-test both values: 754-767. All four running combinations during a test: 771-795. Pumps in opposite states: 652-683. Activation time: 797-809. Every non-water condition active with `offlineConfirmed: true`: 811-821. A flooding pit is never set in a case that projects this row: rejected as a coverage gap (candidate 1); the title of 811 is the CR-05-CATALOGUE-024 remainder. | Covered (title remainder is CR-05-CATALOGUE-024, a WARNING) |
| 7 | Sump Mains Power | `MainsPowerPresent` <- `power.mainsPresent` | n/a | Both values, whole: 1044. Own scope `invalid` 1532, `controller-link-lost` 1881, tolerance 2025/2039. Battery and offline: still rejected (R3 candidate 4). | Covered |
| 8 | Mains Power Lost | `ContactSensorState` <- NOT `mainsPresent`; `StatusFault` `NO_FAULT` while `mainsPresent` decoded | n/a | 1057-1070 whole in both states; 1532. | Covered |
| 9 | Backup Battery Level | `StatusLowBattery` <- `battery.low`; `BatteryLevel` <- `levelPercent`; `ChargingState` <- `charging` | `low`: 1133-1167, both directions. `levelPercent`: 1169-1197. | Health and voltage against the verdict: 1076, 1136. Charging: 1199-1218. `NOT_CHARGEABLE`: 1220. | Covered |
| 10 | Backup Battery | `BatteryCharging`, `BatteryVoltageLow`, `BatteryHealthCode`, `ProtectionHoursCode` <- the same-named facts | The inverse derivations fail 1136 and 1171. | Voltage/low swap fails the first row of 1136. Health/protection swap fails its second row. | Covered |
| 11 | Primary Pump Fault | `ContactSensorState`, `StatusFault` <- `fault.primaryPumpFault` | n/a | Every sibling condition alone, offline included: 1241-1253. `StatusFault` against an active water fault: 1255-1276. Link-lost and `invalid`: 1300, 1316. | Covered |
| 12 | Backup Pump Fault | the same pair <- fault OR fuse | n/a | 1241-1253 (fault and fuse separately, and siblings). One missing fact: unreachable, still rejected (R3 candidate 5). | Covered |
| 13 | Water Sensor Fault | the same pair <- `fault.waterSensorFault` | n/a | 1241-1253, 1255-1276, 1300, 1316. | Covered |
| 14 | Pump Controller Link Lost | the pair <- NOT `controllerLinkPresent`; `ControllerLinkPresent`; `ControllerDataLastTrustedAt` <- the input string while the link fact decoded; tolerates `controller-link-lost` | n/a | Siblings and offline: 1241-1253. Whole: 1278, 1331, 1993. `invalid`: 1316. | Covered |
| 15 | System Self-Test | `On` <- `'self-test'.running`, nothing while pending | n/a | Both values, whole: 1471-1483. Own pending: 1488. Other pending: 1506. `invalid`: 1520. | Covered |
| 16 | Alarm Mute | `On` <- `'alarm-mute'.muted`, nothing while pending | n/a | 1488, 1506 (`muted: true`). `muted: false` not asserted: still rejected (R3 candidate 6). | Covered |
| 17 | Basement Guardian Offline | `ContactSensorState` <- `offlineConfirmed` | n/a | Both values: 1352-1367. `reportedOffline: true`: 1369-1382. No decoded state, other scopes `invalid`: 1384-1416. Unrelated scope `invalid`: 1544. Outage: 2012. Siblings: 1241-1253. | Covered |

Sweep result: all 17 rows covered. Row 5 is now covered by 652-683 (023). No coverage gap is
filed. One gap was considered and rejected (candidate 1), and the R3 and R4 rejections still
hold. Row 6's only open item is the title remainder of CR-05-CATALOGUE-024, a WARNING with no
wrong row behind it.

## Findings

### CR-05-CATALOGUE-024 - WARNING: "leaves the backup pump adapter quiet while every other condition is active" still leaves the pit at its quiet default

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments and test titles describe what the code does); `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("Title each case with a short sentence stating public behavior")
**Location:** `ddc645b1329990f3e9a652cfaa48767532d85186:test/accessories/serviceCatalogue.test.ts:811-821` (the seed at `240-253`; the `water` default at `228`)
**Issue:** This is the unresolved remainder of the round-4 finding, so it keeps its ID. The round-4 repair (`da8ff2c`) arranges the case as `decodedState({ ...everyOtherConditionActive(), pump: { primaryRunning: true, backupRunning: false, ... } })` with `offlineConfirmed: true`. That closes the six inactive conditions R4 listed. But the seed is, by its own comment, "Every decoded group but `water` reporting its active condition" (240-242). The seed was written for the water cases, where "every other" means every group but `water`. In this case, "every other condition" is relative to the backup pump running. So it includes the condition that matters most to a sump-pump owner: a flooding pit. `decodedState()` fills the missing `water` group with its default, `{ levelCode: 1, levelPercent: 20, flooded: false }` (228). The title therefore still claims a condition that the case leaves inactive. The source comment on the activity adapters ties a backup run to water reaching the backup-pump threshold (`src/accessories/serviceCatalogue.ts:516-518`). A reader of the test report can therefore believe that this case pins the adapter against a high or flooding pit, and no case in the file projects `Backup Pump Running` with `flooded: true` (`grep "flooded: true"` lists 190, 483, 543, 557, 571, 1854, 1870 and 2266, none of which projects this row). No plausible wrong row passes because of this gap (candidate 1), so this is a misleading title, a WARNING.
**Fix:** Make the arrange match the title by adding the flooding rung: `decodedState({ ...everyOtherConditionActive(), water: { levelCode: 31, levelPercent: 100, flooded: true }, pump: { primaryRunning: true, backupRunning: false, backupActivatedAt: 1_700_000_000 } })` with `offlineConfirmed: true`. Keep the title and the expected value `[ContactSensorState CONTACT_DETECTED]`. A read-only production probe with that input gives `[ContactSensorState 0]`. Alternatively, keep the arrange and retitle the case to what it sets, for example "leaves the backup pump adapter quiet while every condition but the pit level is active". Make no source change.
**Flags:** none (cites CR-05-CATALOGUE-020 and CR-05-CATALOGUE-024, whose repairs edited these lines; not a D-10 citation of SC-02 or CR-04-ACCOUNT; no D-04 candidate, because production reads only `backupRunning`; no D-06, D-11, D-13, D-14, D-16 or D-17)

## Candidates considered and not filed

1. **`Backup Pump Running` (and `Primary Pump Running`) never projected with `flooded: true`.** A
   wrong adapter `running || flooded`, which reasons that a flooding pit means the backup pump
   must be running, passes every case. The declared-scope case (1625) does not catch it either,
   because untrusting `water` turns `flooded` into `undefined` and the output does not change on
   the quiet default. Not filed as a coverage gap. The source states the rule directly ("The two
   live activity adapters read one pump boolean and nothing else", 516). The comment that ties the
   two signals together runs the other way (a backup run shows that water reached the threshold),
   and 021 already pins that direction on the flood row (533-589). The opposite inference is not in
   the source, and it would report a pump run the device did not report. It is the same class of
   cross-group read that R3 candidate 4 rejected for the other rows. The CR-05-CATALOGUE-024 fix
   above sets `flooded: true` in 811-821, so it closes this case anyway at no extra cost.
2. **Primary Pump service ORing in `backupRunning`.** No case projects `Primary Pump` with
   `primaryRunning: false` and `backupRunning: true`. A read-only probe gives `PumpRunning false`
   for that input. The 023 fix pins the OR on the backup service, so the two services are now
   pinned unevenly. Not re-filed. R3 candidate 3 and R4 candidate 8 rejected the service half
   because no text invites an OR across the two pumps, and that reasoning still holds. The OR in
   023 was a by-product of fixing the plausible mistake (the field swap), not the reason for the
   finding. The field swap on the primary service is caught by 626-648, and the adapter half of
   the OR is caught by 771-795. A coordinator who wants symmetry can add the
   `{ primaryRunning: false, backupRunning: true }` row to 626-648.
3. **626-648 picks `PumpRunning` and `ContactSensorState`, while its backup counterpart (652-683)
   compares whole projections.** Not filed. The title's promise is the running state on both
   rows, and those two values are that promise. R1 to R4 accepted this case. The difference in
   style is not a rule violation.
4. **The 023 rows carry `pumpRunning`, which always equals `backupRunning`.** Not filed. CR-017
   requires a hand-written expected field instead of computing the expected value from the input.
   The redundant field follows that rule.
5. **The 023 title interpolates only `backupRunning`, while the rows also vary `primaryRunning`.**
   Not filed. This is the boolean-interpolated title class that R1 rejected as candidate 2. The
   title does not contradict either row, and the comment above the loop (650-651) states the
   opposite states.
6. **`decodedState({ pump: { primaryRunning, backupRunning } })` in 661 omits `backupActivatedAt`.**
   Not filed. No row reads the timestamp, and 797-809 pins that the adapter ignores it. The
   primary loop (634) uses the same shape.
7. **R1 to R4 candidates.** Accepted earlier as reasoned rejections. Not re-filed: I re-read each
   cited region at this revision and found no concrete reason to reverse any of them. Two notes.
   R4 candidate 1 (service `PumpRunning` during a self-test) stays rejected, and the field this
   value reads is now pinned by 652-683, as R4 expected. `ProjectedValue` and `RowTrust` still have
   no consumer outside this module and its test, but they appear in exported signatures (R1
   candidate 7). Every other export has a production or `features/` consumer.

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

I ran every command from the repository root at HEAD `ddc645b1329990f3e9a652cfaa48767532d85186`
with a clean tree (`git status --porcelain` was empty before and after). Node `v26.12.0`, npm
`11.20.0`, 2026-10-17T17:00:31Z to 17:00:53Z. Every command had the prefix
`export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both `tsc --noEmit` passes are clean |
| `node_modules/.bin/eslint src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | |
| `node --test dist-test/test/accessories/serviceCatalogue.test.js` | 0 | tests 212, suites 12, pass 212, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` | 0 | printed only the npm banner (100% direct pair coverage) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CATALOGUE` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

Supporting read-only probes (made-up inputs, no source or test change):
`node --input-type=module -e` against `dist-test/src/accessories/serviceCatalogue.js` and
`dist-test/features/lib/hap.js`. `Backup Pump Running` with every non-water group active,
`backupRunning: false`, `water: { levelCode: 31, levelPercent: 100, flooded: true }` and
`offlineConfirmed: true` gives `[ContactSensorState 0]` (024's fix value). `Primary Pump` with
`{ primaryRunning: false, backupRunning: true }` gives `PumpRunning false`, `PumpFault false`,
`StatusFault 0` (candidate 2). Read-only greps: no `act & assert`, ternary, `isRowTrusted`,
`CLEAR_FAULTS`, `(value) =>`, `isInteger` or `map((row) => row.kind)` in the test. No `only`,
`skip` or `todo`. None of the style quick-scan tokens appear. The two `no longer` hits (source 21
and 880, test titles 1849 and 2261) are present-tense domain statements, not history narration.
I ran no mutation experiment. Each claim that a wrong row passes comes from tracing every case
that projects the row.

## Out-of-scope observations

- `test/accessories/basementGuardian.test.ts` (ACCESSORY batch, Phase 5): `grep -c PumpRunning`
  still gives 0. No accessory-level case asserts either pump service's `PumpRunning`. The owning
  pair now pins the backup service's field (652-683), so this is no longer the only gap. R4
  recorded it as the accessory-side view of CR-05-CATALOGUE-023.
- `features/lib/hap.ts:341-348` and `484-488` (Phase 7 under D-12, GATES parity under D-16): the
  stand-in `handleGetRequest` still throws synchronously, and `getCharacteristic` still returns
  `find(...)` (`undefined` for an absent characteristic). Lead S-05-23 tracks both. This batch
  handles both forms (`readOf`, and the `seedConfiguredName` guard).
- No other new out-of-scope defect was observed.

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action.

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-023 | BLOCKER | fixed | Confirmed fixed by this round. |
| CR-05-CATALOGUE-024 | WARNING | open | Still open: the case's arrange leaves the pit at its dry default, so "every other condition" is still not true. Add the flooding water group (`{ levelCode: 31, levelPercent: 100, flooded: true }`) to the arrange, keeping the title and the expected value. |
| CR-05-CATALOGUE-001 to 022 | as opened | fixed | Confirmed still fixed by this round. |

The row sweep (all 17 rows covered) and the candidates are accepted as reasoned.

Counter (D-03 as amended, D-18): opening 2, fixed 1, rejected 0, new 0, reopened 0, closing 1.
Closing (1) is below opening (2), no ID reopened and the round is below 10: `continue`.
