---
phase: 05-accessories-conformance
batch: CATALOGUE
review_round: 3
reviewed: 2026-10-17T15:56:17Z
depth: deep
source_revision: 309d0da49c4866bef00d793477e4603b5c6146e4
files_reviewed: 2
files_reviewed_list:
  - src/accessories/serviceCatalogue.ts
  - test/accessories/serviceCatalogue.test.ts
findings:
  blocker: 3
  warning: 0
  total: 3
status: issues_found
reviewer: gsd-code-reviewer (correction round 3)
---

# Phase 5 CATALOGUE batch: correction round 3

I read every line of both files fresh and in full at `309d0da49c4866bef00d793477e4603b5c6146e4`
(source 1050 lines, test 2661 lines). I did not review a diff. After the full read I used diffs
for two checks only: preservation against the batch base `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12`
(D-05), and the content of the two repair commits `8a10ce9` and `ae2ab2c`.

Inputs read: AGENTS.md; the three `.agents/skills` books (each `SKILL.md` and every `rules/*.md`
file); `05-CONTEXT.md`; `05-REVIEW-PROTOCOL.md`; `05-CATALOGUE-REVIEW.md`, `-R1.md` and `-R2.md`
(findings, candidates, Coordinator triage, Repair history, Assertion controls); the CATALOGUE rows
of `05-FINDINGS.md`; `src/device/gemini.ts` and `src/device/family.ts` in full; and, for the
consumers of the catalogue, `src/accessories/basementGuardian.ts:418-432, 575-800, 975-1015` and
`test/accessories/basementGuardian.test.ts:860-925, 2487-2499`.

Opening open set: 2 IDs (2 BLOCKER). Result: both fixed. None of 001 to 017 reopened. The
systematic sweep found 3 new BLOCKERs, each a new cause that was already present at the batch
base. Count: 2 opening - 2 fixed - 0 rejected + 3 new + 0 reopened = 3 closing.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-018 | BLOCKER | fixed | Test 965-999: a two-row loop with written-out rows. `{ healthCode: 8, voltageLow: false, low: true }` expects `BATTERY_LEVEL_LOW`. `{ healthCode: 1, voltageLow: true, low: false }` expects `BATTERY_LEVEL_NORMAL`. Each case compares the whole projections of both battery rows. Test 1001-1029: `{ protectionHoursCode: 8, levelPercent: 25 }` expects `BatteryLevel` 25 and `ProtectionHoursCode` 8, also whole on both rows. These wrong rows each fail at least one case: `low` derived from D-07 (either direction); `low` that ORs or ANDs D-07 into the decoded verdict; `levelPercent` from the band map; `ProtectionHoursCode` from `levelPercent`; `BatteryVoltageLow` from `low`; `StatusLowBattery` from `levelPercent <= 25`. The comments at 965-967 and 1001-1002 are true for their rows. The assertion controls in R2 show both failure modes. |
| CR-05-CATALOGUE-019 | BLOCKER | fixed | Test 1201-1214: `decodedState({ connectivity: { reportedOffline: true } })` with `offlineConfirmed: false` expects the whole projection `[ContactSensorState CONTACT_DETECTED]`. A row that ORs `reportedOffline` in fails it. A row that reads only `reportedOffline`, or ANDs the two, fails 1188 (`offlineConfirmed: true` while `reportedOffline` keeps its `false` default). Production probe: `[ContactSensorState 0]`. |
| CR-05-CATALOGUE-001 | WARNING | still fixed | Source 1-31 and test 1-10 have the D-01 layout. The tracer prints `ACCESSORIES_HEADERS_OK files=2`. |
| CR-05-CATALOGUE-002 | WARNING | still fixed | `grep -c "act & assert"` gives 0. |
| CR-05-CATALOGUE-003 | BLOCKER | still fixed | Matrix 1220-1267: "a group carrying none of its facts" gives all seven read groups as `{}` (1240). "facts of the wrong type" (1241-1252) makes every fact a string. Expected: sixteen `[]` (1265). |
| CR-05-CATALOGUE-004 | BLOCKER | still fixed | Off-ladder cases at 440-458 (`{ 31, 20, false }`, whole) and 460-472 (`{ 1, 20, true }`, `LEAK_DETECTED`). The import case title is "imports nothing from the water level ladder module" (1850-1856). |
| CR-05-CATALOGUE-005 | BLOCKER | still fixed | `grep "map((row) => row.kind)"` finds nothing. Literals pin the order at 1364-1382 and 1455-1473. |
| CR-05-CATALOGUE-006 | BLOCKER | still fixed | `grep -c isInteger` gives 0. The outage cases at 1791-1808 and 1810-1821 compare `summarise(row.project(input))` whole. |
| CR-05-CATALOGUE-007 | BLOCKER | still fixed | The positive at 198-204 has all five required members. The negative at 205-206 lacks only `offlineConfirmed`. `npm run typecheck` exits 0. |
| CR-05-CATALOGUE-008 | WARNING | still fixed | Source 244 `function isRowTrusted` has no `export`. `grep -c isRowTrusted` in the test gives 0. |
| CR-05-CATALOGUE-009 | WARNING | still fixed | There are 12 top-level `describe()` blocks (1355, 1862, 1888, 1912, 1936, 1962, 2145, 2187, 2350, 2388, 2497, 2592), one for each export. The three cases added for 018 and 019 call `row.project` inside `register*Cases`, which run under `createServiceCatalogue`. |
| CR-05-CATALOGUE-010 | WARNING | still fixed | `readOf` (2476-2487) is `async` and awaits `handleGetRequest()` inside its `try`. All four callers await it (2512, 2539, 2559, 2576). |
| CR-05-CATALOGUE-011 | WARNING | still fixed | Source 1032-1036 is in the present tense and correct. Line 1043 is unchanged. |
| CR-05-CATALOGUE-012 | WARNING | still fixed | Test 778-779 is in the present tense. |
| CR-05-CATALOGUE-013 | WARNING | still fixed | Test 101 and 1217-1218 describe what the code does. |
| CR-05-CATALOGUE-014 | WARNING | still fixed | `clearFaults()` (113-122) returns a new group on each call. `grep -c CLEAR_FAULTS` gives 0. |
| CR-05-CATALOGUE-015 | WARNING | still fixed | `grep "(value) =>"` finds nothing. |
| CR-05-CATALOGUE-016 | WARNING | still fixed | The two separately titled cases are at 1732-1751 and 1753-1772, and their expected values are unchanged. |
| CR-05-CATALOGUE-017 | WARNING | still fixed | `grep " ? "` finds no ternary in the test file. No loop body computes an expected value. |

New IDs: CR-05-CATALOGUE-020 (BLOCKER), CR-05-CATALOGUE-021 (BLOCKER), CR-05-CATALOGUE-022
(BLOCKER). None is a reopen. Each gap was already there at the batch base: `git show
ef7578f:test/...` has the `testRunning` pump fixture (181, 532-536) and the offline-row matrix
filter (1074). The 018 and 019 repairs did not add any of them.

### Preservation (D-05)

Source diff `ef7578f..309d0da`: the header (2-6), the `isRowTrusted` JSDoc paragraph, the
dropped `export` on `isRowTrusted`, and the `seedConfiguredName` JSDoc paragraph. Nothing else
changed. The source has not changed since `700ce9a`. These are all the same as at the base: every
subtype (`subtype: kind`, 639), every display name, every characteristic mapping, the
`trustedGroup`/`isRowPublishable` withholding, the `StatusActive` source (`isRowFullyTrusted`) and
the `StatusFault` projections. So are the `alwaysPublish` flags and the single
`new hap.HapStatusError(status)` push in `publishPersistentFailure` (1008). In the test, literals
pin the subtypes (1364-1382), the names and scopes (1398-1416, 1455-1473) and the service types
(1516-1534), and every one of those cases passes. Both repairs only added cases (192 -> 196) and
removed none.

## Row coverage sweep

Columns: (a) each value the row publishes and the decoded fact it reads; (b) whether a case
feeds a fact that differs from what a plausible re-derivation from other facts would give; (c)
whether each input the row must ignore is exercised in the state that would change the output if
the row read it. "Rejected" points to `## Candidates considered and not filed`.

| # | Row | (a) Publishes <- reads | (b) Fact off its derivation | (c) Ignored inputs exercised | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | Sump Pit Flood | `LeakDetected` <- `water.flooded` | `flooded` is derived from `levelCode` (`gemini.ts:282-286`). 460-472 `{1, 20, true}` expects `LEAK_DETECTED`, so a pure re-derivation fails. The opposite direction (`flooded: false` on the top rung) is not covered: rejected, candidate 1. | `levelCode`/`levelPercent`: 460-472. Own-scope outage, invalid and doubled reasons: 1647, 1663, 1712. Other scopes untrusted: 1423. A reported water sensor fault, pump runs, mains loss, offline: never active in any flood case. | **Gap: CR-05-CATALOGUE-021** |
| 2 | Sump Pit Level | `WaterLevel` <- `water.levelPercent`; `RawWaterLevelCode` <- `water.levelCode`; `WaterSensorFaultReported` <- `fault.waterSensorFault`; `StatusFault` <- the same fact | 440-458 `{31, 20, false}`, whole: the percentage from the code and the code from the percentage both fail. | `fault` scope invalid: 474, 1753. Outage: 1732. `waterSensorFault: true` is set in 491-514, but that case picks two values and does not assert `WaterLevel` or `RawWaterLevelCode`. Other fault facts: only an `=== true` any-fault aggregate passes, rejected (candidate 2). Pump, power and offline conditions: never active. | **Gap: CR-05-CATALOGUE-021** |
| 3 | Primary Pump | `PumpRunning` <- `pump.primaryRunning`; `PumpFault`/`StatusFault` <- `fault.primaryPumpFault`; no fuse; record from `primaryPumpRecord`, only while running decoded | No family derivation; the booleans are read verbatim. | Backup record: 658 (a swap fails). Fuse absent: 543. Undecoded running: 843. `fault` invalid: 1423, 1974. Backup running: a swap fails 523; an OR is rejected (candidate 3). Sibling faults: only an `=== true` aggregate passes, rejected (candidate 2). | Covered |
| 4 | Primary Pump Running | `ContactSensorState` <- `pump.primaryRunning` | n/a | `backupRunning`: a swap fails 523; an OR is rejected (candidate 3). Faults, mains and offline: never active for this row; no comment or neighbouring signal invites them, rejected (candidate 4). | Covered (rejections listed) |
| 5 | Backup Pump | `PumpRunning` <- `pump.backupRunning`; `PumpFault` <- `backupPumpFault`; `PumpFuseBlown` <- `backupPumpFuseBlown`; `StatusFault` <- fault OR fuse, nothing while either is missing; record and label from `backupPumpRecord` | n/a; the merge is pinned at 568-593 (four rows) and the missing fuse at 595-609. | Label from the record only: 706-740. Primary record: 671. The real self-test signal (`'self-test'.running`) is never `true` for this row. | Gap is part of **CR-05-CATALOGUE-020** (optional half of its fix) |
| 6 | Backup Pump Running | `ContactSensorState` <- `pump.backupRunning` | n/a | Activation timestamp: 625-637. Primary running, mains loss, primary and water faults, offline confirmed: 639-653. A self-test in progress: 611-623 sets `pump.testRunning`, a key no family decodes, so the real `'self-test'.running` stays `false` in every case. | **Gap: CR-05-CATALOGUE-020** |
| 7 | Sump Mains Power | `MainsPowerPresent` <- `power.mainsPresent` | n/a | Own scope invalid: 1330, 1423. Controller-link-lost: 1679. Battery and offline: never active; implausible, rejected (candidate 4). | Covered |
| 8 | Mains Power Lost | `ContactSensorState` <- NOT `mainsPresent`; `StatusFault` is always `NO_FAULT` while `mainsPresent` decoded | n/a | 876-903 compares the whole projection in both states. Same ignored-input note as row 7. | Covered |
| 9 | Backup Battery Level | `StatusLowBattery` <- `battery.low`; `BatteryLevel` <- `battery.levelPercent`; `ChargingState` <- `battery.charging` | `low`: 965-999, both directions (018). `levelPercent`: 1001-1029 (018). | Health code against the level: 948-963. Level against the low verdict: 1003 and 969. Mains against charging: 1031-1050 (`charging: false` while mains is present). Never `NOT_CHARGEABLE`: 1052. | Covered |
| 10 | Backup Battery | `BatteryCharging`, `BatteryVoltageLow`, `BatteryHealthCode`, `ProtectionHoursCode` <- the same-named facts | The inverse derivations fail: `voltageLow` from `low` (both 965-999 rows), the code from `levelPercent` (1003), the health code from `low` (969). | As row 9. | Covered |
| 11 | Primary Pump Fault | `ContactSensorState`, `StatusFault` <- `fault.primaryPumpFault` | n/a | Every sibling condition alone, offline included, against all five adapters: 1073-1085. `StatusFault` against an active water fault: 1087-1108. | Covered |
| 12 | Backup Pump Fault | the same pair <- fault OR fuse | n/a | 1073-1085: fault and fuse separately, and siblings. A group with one of the two facts missing: unreachable from the decoder, rejected (candidate 5). | Covered |
| 13 | Water Sensor Fault | the same pair <- `fault.waterSensorFault` | n/a | 1073-1085, 1087-1108. | Covered |
| 14 | Pump Controller Link Lost | the pair <- NOT `controllerLinkPresent`; `ControllerLinkPresent`; `ControllerDataLastTrustedAt` <- the input string, only while the link fact decoded; tolerates `controller-link-lost` | n/a | Siblings and offline: 1073-1085. Whole projections: 1110, 1163, 1791. Invalid: 1148. | Covered |
| 15 | System Self-Test | `On` <- `'self-test'.running`, nothing while `self-test` is pending | n/a | Both values: 1269-1281. Own pending: 1286. The other control pending: 1304. Invalid: 1318. | Covered |
| 16 | Alarm Mute | `On` <- `'alarm-mute'.muted`, nothing while pending | n/a | 1286, 1304 (`muted: true`). `muted: false` is pinned only as "publishes something" (1423); rejected (candidate 6). | Covered (rejection listed) |
| 17 | Basement Guardian Offline | `ContactSensorState` <- `offlineConfirmed` | n/a | `reportedOffline: true`: 1203 (019). Siblings: 1073-1085. Unrelated scope invalid: 1342. Outage: 1810. A decoded state without a `connectivity` group (the unresolved-family input, `decoded: undefined`): never projected; the matrix filters this row out (1261). | **Gap: CR-05-CATALOGUE-022** |

Sweep result: 14 rows fully covered. 3 gaps filed: rows 1 and 2 as one cause (021), rows 5 and 6
as one cause (020), and row 17 (022). 6 gaps rejected (candidates 1 to 6).

## Findings

### CR-05-CATALOGUE-020 - BLOCKER: The self-test case sets a `pump.testRunning` key that no family decodes, so a backup adapter that reacts to a real self-test passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate the behavior named in its title); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: a case a wrong implementation would pass); `.agents/skills/typescript-unit-tests/rules/cases.md` Test data ("Typed literals, checked with `satisfies` when they stand in for a production type")
**Location:** `309d0da49c4866bef00d793477e4603b5c6146e4:test/accessories/serviceCatalogue.test.ts:229, 611-623, 639-653` (production contract at `309d0da49c4866bef00d793477e4603b5c6146e4:src/accessories/serviceCatalogue.ts:516-527`)
**Issue:** The source promises that "a self-test in progress, an absent activation timestamp, a mains loss, and a primary-pump fault all leave this adapter exactly where the running boolean puts it (C-001, SAFE-03)" (516-522). The case "activates the backup pump adapter during a self-test run of ${testRunning}" (611-623) is the one meant to prove the self-test half. It puts `testRunning` into the decoded `pump` group (615), and `decodedState()` carries `testRunning: false` there by default (229). No family decodes such a key. `PumpState` has only `primaryRunning`, `backupRunning` and `backupActivatedAt` (`src/device/family.ts:85-97`), and `decodePump` emits only those (`src/device/gemini.ts:288-294`). The real self-test state is the `'self-test'` group's `running` (`gemini.ts:325-327`). The accessory reads it from there too (`basementGuardian.ts:429`, `testRunning: booleanOf(selfTest, 'running')`). In every case of this suite, `'self-test'.running` stays `false` for the backup rows. So the case cannot fail for a row that reacts to the real signal, and 639-653 ("while every other condition is active") never activates a self-test either. Two plausible wrong `Backup Pump Running` rows pass all 196 cases. (1) One that suppresses the alert during a test, which an author could add because a self-test runs the backup pump: `running === undefined ? undefined : running && booleanOf(decodedGroup(input.decoded, 'self-test'), 'running') !== true`. (2) One that activates on a test with no pump run: `... : running || booleanOf(..., 'running') === true`. The declared-scope case (1423) does not catch either one, because untrusting `self-test` leaves both outputs unchanged on the all-clear default. Production is correct today. A probe with `'self-test': { running: true }` gives `[ContactSensorState 0]` when `backupRunning` is `false` and `[ContactSensorState 1]` when it is `true`.
**Fix:** In 611-623, drive the real signal. Use `decodedState({ pump: { primaryRunning: false, backupRunning: true }, 'self-test': { running: testRunning, testedAt: undefined } })` and keep the whole-projection expectation `CONTACT_NOT_DETECTED` for both rows. In 639-653, add `'self-test': { running: true, testedAt: undefined }` to the decoded state, so "every other condition" includes a test in progress. Keep the expectation `CONTACT_DETECTED`. Remove `testRunning: false` from the `decodedState()` pump default (229). Optionally, add `satisfies` checks so that a default group carrying a key its production type lacks fails to compile. Optionally, also assert `Backup Pump`'s `PumpRunning` under a test in progress. Assertion control: apply wrong row (1) and observe the self-test-true row of 611-623 fail; apply wrong row (2) and observe 639-653 fail.
**Flags:** none (no D-04 candidate: production reads only `backupRunning`; no D-06, D-10, D-11, D-13, D-14, D-16 or D-17)

### CR-05-CATALOGUE-021 - BLOCKER: No case asserts a water row's whole projection while another group reports an active condition, so a flood or level row that gates on a reported water sensor fault passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate the behavior named in its title); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: weak or missing assertions); `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Compare whole values ... Do not assert ... one property at a time when the whole value is the promise")
**Location:** `309d0da49c4866bef00d793477e4603b5c6146e4:test/accessories/serviceCatalogue.test.ts:388-515 (491-514), 1647-1661, 1774-1785` (production contract at `309d0da49c4866bef00d793477e4603b5c6146e4:src/accessories/serviceCatalogue.ts:11-24, 155-162, 429-452`)
**Issue:** The module says each value is "read verbatim from decoded state" (15-17). It says the flood verdict and the level come from the decoded `water` group (429-432). It says `Sump Pit Level` "withholds only the fault-sourced values" (158-162). The README defines the flood sensor by the water level alone. The same module also says "A row whose fact is in doubt projects nothing for it at all" (19). An author who reads a *reported* water sensor fault as "the water fact is in doubt" would plausibly withhold the flood verdict or the level while the device reports that fault. Nothing in the suite stops that. Every flood case and every level case that asserts `WaterLevel` uses the all-clear siblings of `decodedState()`: `clearFaults()`, both pumps idle, mains present, not offline. The only level case with `waterSensorFault: true` (491-514) picks `WaterSensorFaultReported` and `StatusFault` and leaves `WaterLevel` and `RawWaterLevelCode` unasserted. These wrong rows pass all 196 cases. (1) `Sump Pit Flood`: `booleanOf(trustedGroup(input, trust, 'fault'), 'waterSensorFault') === true ? undefined : leakState(hap, flooded)`. It suppresses a flood alarm whenever the sensor also reports a fault, which is the worst outcome this plugin exists to prevent. (2) `Sump Pit Level` with the same guard on `WaterLevel` and `RawWaterLevelCode`, which leaves a stale level standing while the device still reports one. (3) A flood row that also activates on `backupRunning`, which the comment at 516-518 invites ("a backup run shows that water reached the backup-pump threshold"); it would raise a flood alarm on every self-test. The declared-scope case (1423) does not catch (1) or (2): untrusting `fault` makes the guard read `undefined`, so the row's output does not change. This is the sibling-group half of the class 004 closed for the water group's own facts. Fault adapters have this protection (1073-1085), and so does the backup adapter (639-653). The water rows, which carry the reading an owner acts on, do not. Production is correct today. A probe with `flooded: false`, `backupRunning: true` projects `[LeakDetected 0]`.
**Fix:** In `registerWaterCases`, add one case per water row, modelled on 639-653, with written-out whole-projection expectations. Keep the `water` group fixed at `{ levelCode: 1, levelPercent: 20, flooded: false }`. Make every other group report its active condition: `fault` with all four fault facts `true` and `controllerLinkPresent: false`, both pumps running, `mainsPresent: false`, a low battery, `'self-test': { running: true }`, `muted: true`, `reportedOffline: true`, and `offlineConfirmed: true`. (a) "leaves the flood sensor at the reported water verdict while every other condition is active": expect `[{ LeakDetected, LEAK_NOT_DETECTED }]`. Wrong rows (1) and (3) fail it: (1) projects `[]` and (3) projects `LEAK_DETECTED`. (b) "publishes the reported pit level beside an active water sensor fault while every other condition is active": expect `[WaterLevel 20, RawWaterLevelCode 1, WaterSensorFaultReported true, StatusFault GENERAL_FAULT]`. Wrong row (2) fails it. Alternatively, make 491-514 compare the whole projection. That closes (2) but not (1) or (3). Keep every existing case. Assertion control: apply wrong row (1), then (2), and observe (a) and (b) fail. The same fixture can be applied to the other non-adapter rows if the coordinator wants the class closed beyond the plausible cases (see candidates 2 to 4).
**Flags:** none (no D-04 candidate: production reads only the `water` group for flood and level; no D-06, D-10, D-11, D-13, D-14, D-16 or D-17)

### CR-05-CATALOGUE-022 - BLOCKER: The offline row is never projected from a decoded state without a `connectivity` group, the input the accessory hands it for an unresolved family

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate the behavior named in its title); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: missing assertions); `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` Pairing and coverage ("That test module owns the source module's exported behavior"; "Aggregate coverage does not count")
**Location:** `309d0da49c4866bef00d793477e4603b5c6146e4:test/accessories/serviceCatalogue.test.ts:1183-1215, 1219-1267 (1261), 1342-1352` (production contract at `309d0da49c4866bef00d793477e4603b5c6146e4:src/accessories/serviceCatalogue.ts:626-632, 833-844`; consumer at `309d0da49c4866bef00d793477e4603b5c6146e4:src/accessories/basementGuardian.ts:760-769, 987-1015`)
**Issue:** The offline row "reads the accessory's own confirmation count, never a reported field" (626-629). The accessory depends on that. For a family that stops resolving, it calls `republishPublishedRows(projectionInputOf(undefined, ...))` with every non-connectivity scope distrusted (`basementGuardian.ts:1011-1012`). It expects the offline row to "keep publishing its current verdict" from the count, so that a device that "stopped resolving and then went offline" still raises the alert RES-03 exists for (760-769, 1000-1004). In this suite the offline row is never handed a decoded state that lacks a `connectivity` group. The absent-state matrix covers `null`, `[]`, `{}`, undecoded groups and wrong types, but it filters the offline row out (1261). It asserts only that the other sixteen rows project nothing and never says what the offline row projects. Every offline case uses `decodedState()`, which always carries `connectivity`. A plausible wrong row follows the module's own pattern for a non-decoded input. `ControllerDataLastTrustedAt` publishes only while the link fact decoded (622). The same pattern here is: `const connectivity = trustedGroup(input, trust, 'connectivity'); ... value: connectivity === undefined ? undefined : contactState(hap, input.offlineConfirmed)`. This row also matches "every other row reads the group its scope names". It passes all 196 cases (1073-1085, 1188, 1203, 1342, 1423, 1810), and it never activates the offline adapter for an unresolved family. The case `test/accessories/basementGuardian.test.ts:887-904` ("confirms the device offline on the configured polls while the family does not resolve") would catch it through the real catalogue. That case belongs to another pair, under review in the ACCESSORY batch. The pairing rule makes this module's test the owner of the row's behavior, and protection held only by another pair is the aggregate protection the rule does not count. Production is correct today. Probes: `decoded: undefined` with all seven non-connectivity scopes `invalid` and `offlineConfirmed: true` gives `[ContactSensorState 1]`; `decoded: {}` gives the same.
**Fix:** In `registerOfflineCases`, add "activates Basement Guardian Offline from a confirmed run while no decoded state exists". Use `projectionInput({ decoded: undefined, offlineConfirmed: true, untrustedScopes: <each of 'water', 'pump', 'power', 'battery', 'fault', 'self-test', 'alarm-mute' with reason 'invalid'> })` and expect `[{ uuid: ContactSensorState.UUID, value: CONTACT_NOT_DETECTED }]`. Write the scope list out; do not filter `TRUST_SCOPES`. A second case with `offlineConfirmed: false` expecting `CONTACT_DETECTED` makes the case independent of the confirmation's direction. Keep the matrix filter, because the offline row is not a decoded-state row, and change the matrix comment (1217-1218) if it should name where the offline row's absent-state behavior is pinned. Assertion control: apply the wrong row above and observe the new case fail.
**Flags:** none (no D-04 candidate: production ignores the decoded state on this row; no D-06, D-10, D-11, D-13, D-14, D-16 or D-17; the accessory-level case at `basementGuardian.test.ts:887-904` is noted for the ACCESSORY batch, not edited)

## Candidates considered and not filed

1. **Sump Pit Flood: no case gives `flooded: false` on the top rung (code 31 or 100 per cent).**
   Only one direction of the off-derivation is pinned (460-472, `flooded: true` at code 1). R0's
   proposed `{31, 20, false}` flood case was not added. Not filed. A pure re-derivation from the
   code or the percentage fails 460-472, and so does an AND with the ladder. A threshold below the
   top rung fails the ladder cases (408-418) and "exactly one legal water level code" (421-438).
   The only row that passes is an OR with the exact top rung (`flooded || levelCode === 31`), and
   it publishes a wrong value on no reachable input: 31 is the highest rung and the family always
   decodes it as flooded. CR-05-CATALOGUE-021's fixture (`flooded: false` at code 1) does not
   change this.
2. **Pump services and Sump Pit Level: `StatusFault` aggregating sibling fault facts.** No case
   sets a sibling fault active while the row's own fault fact is `false`. Not filed. Each fault
   loop carries only the row's own facts (491-514, 543-566, 568-593), so `booleanOf` makes a plain
   OR with a sibling evaluate to `undefined` and withhold, and the `false` row then fails. A
   field-swap copy of `backupPumpFaulted` also fails 543-566. Only a deliberate
   `[...].some((fact) => fact === true)` aggregation passes. The module rejects aggregation in
   terms (594-598, SAFE-04), and the row already reads a named field.
3. **Primary Pump and Primary Pump Running ORing in `backupRunning`.** No primary case has
   `backupRunning: true` with `primaryRunning: false`. Not filed. The plausible mistake is a field
   swap, and 519-541 catches it. The backup adapter's OR with the primary pump fails 639-653. No
   text invites a "this pump or the other one" OR.
4. **Primary Pump Running, both mains rows, and the battery rows against active sibling
   conditions** (faults, offline, mains loss against `ChargingState`). Not filed. No comment or
   neighbouring signal invites a cross-group read. `ChargingState` against mains is pinned by
   1031-1050 (`charging: false` while mains is present). The 021 fixture can be extended to these
   rows if the coordinator wants the class closed beyond the plausible cases.
5. **Backup Pump Fault adapter given a fault group that carries only one of `backupPumpFault` and
   `backupPumpFuseBlown`.** The service row has this case (595-609). The adapter does not. Not
   filed. The adapter and the service share `backupPumpFaulted`. The decoder emits all five fault
   facts or no group (`gemini.ts:314-322`), so this input is unreachable.
6. **Alarm Mute: no case asserts `On = false` for `muted: false`.** Not filed. 1423 fails a row
   that projects nothing for `false`. An inverted mapping (`On = !muted`) fails 1304-1316. A
   field or capability swap fails 1286-1298 or 1304-1316. Only a constant `true` passes, and no
   author would write it.
7. **`decodedGroup` and the matrix never use `decoded: undefined`; they use `null`.** Not filed as
   its own cause. `isRecord` treats both the same way. A null-only guard cannot index `unknown`
   without a cast that lint and review would reject. CR-05-CATALOGUE-022's new case passes
   `undefined` through the offline row anyway.
8. **"never reports the backup battery as not chargeable, for any reading in this suite" (1052-1068)
   asserts an absence.** Not filed. The absence of `NOT_CHARGEABLE` is the promise (D-008), and
   1031-1050 pins the two values that are published.
9. **R1 candidates 2 to 12 and R2 candidates 1 to 7**, all accepted as reasoned rejections. Not
   re-filed. I re-read each cited region at this revision and found no concrete reason to reverse
   any of them. R2 candidate 5 (swapped pump fields) still holds. It did not consider a
   self-test signal, which is the separate cause CR-05-CATALOGUE-020.

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

I ran every command from the repository root at HEAD `309d0da49c4866bef00d793477e4603b5c6146e4`
with a clean tree (`git status --porcelain` was empty before and after). Node `v26.12.0`, npm
`11.20.0`, 2026-10-17T15:47:32Z to 15:47:52Z, with a rerun of the owner test after that. Every
command had the prefix `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both `tsc --noEmit` passes are clean |
| `node_modules/.bin/eslint src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | |
| `node --test dist-test/test/accessories/serviceCatalogue.test.js` | 0 | tests 196, suites 12, pass 196, fail 0, cancelled 0, skipped 0, todo 0. The first run piped through `tail` lost its exit under zsh, so I reran it alone and recorded that exit. |
| `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` | 0 | printed only the npm banner (100% direct pair coverage) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CATALOGUE` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

Supporting read-only probe (made-up inputs, no source or test change):
`node --input-type=module -e` against `dist-test/src/accessories/serviceCatalogue.js` and
`dist-test/features/lib/hap.js`. `Backup Pump Running` with `'self-test': { running: true }`
gives `[ContactSensorState 0]` when `backupRunning` is `false` and `[ContactSensorState 1]` when it
is `true` (020). `Basement Guardian Offline` with `decoded: undefined`, the seven non-connectivity
scopes `invalid` and `offlineConfirmed: true` gives `[ContactSensorState 1]`, and with
`decoded: {}` gives the same (022). `Sump Pit Flood` with `flooded: false` and
`backupRunning: true` gives `[LeakDetected 0]` (021). I ran no mutation experiment. Each "a wrong
row passes" claim above comes from tracing every case that projects the row.

## Out-of-scope observations

- `test/accessories/basementGuardian.test.ts` (ACCESSORY batch, Phase 5): no case runs a real
  self-test (`test_running: true`) while it reads `Backup Pump Running`. The `test_running: true`
  cases (2487-2499, 2978, 3016) assert the Switch and the request state only. So the C-001 promise
  for the backup adapter during a self-test is not pinned at the accessory level either. It is the
  accessory-side view of CR-05-CATALOGUE-020.
- `test/accessories/basementGuardian.test.ts:887-904` (ACCESSORY batch) is currently the only
  case that would catch the wrong offline row in CR-05-CATALOGUE-022. Any change to it in the
  ACCESSORY batch should keep that protection (P-05-03).
- `features/lib/hap.ts:341-348` and `486-488` (Phase 7 under D-12, GATES parity under D-16): the
  stand-in read-path differences from real HAP that lead S-05-23 tracks are unchanged. This batch
  handles both forms.

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action. Evidence re-read: `test/accessories/serviceCatalogue.test.ts:229` sets `pump.testRunning`,
a key no family decodes (self-test state lives in the `'self-test'` group, `gemini.ts:188, 374`);
`src/accessories/serviceCatalogue.ts:516-522` promises that a self-test in progress leaves the
activity adapter where the running boolean puts it; `src/accessories/basementGuardian.ts:1012`
projects with `decoded: undefined` when a device's family stops resolving.

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-018 | BLOCKER | fixed | Confirmed fixed by this round. |
| CR-05-CATALOGUE-019 | BLOCKER | fixed | Confirmed fixed by this round. |
| CR-05-CATALOGUE-001 to 017 | as opened | fixed | Confirmed still fixed by this round. |
| CR-05-CATALOGUE-020 | BLOCKER | open | Accepted: a new cause present at the batch base. |
| CR-05-CATALOGUE-021 | BLOCKER | open | Accepted: a new cause present at the batch base; a flood row that withholds during a reported sensor fault would suppress a flood alarm. |
| CR-05-CATALOGUE-022 | BLOCKER | open | Accepted: the pairing rule makes the catalogue test the owner of the offline row's behavior, so an accessory-level case does not close it. |

The reviewer's row coverage sweep (14 of 17 rows fully covered, 3 gaps filed, 6 gaps rejected)
and its other candidates are accepted as reasoned.

Counter (D-03 as amended, D-18): opening 2, fixed 2, rejected 0, new 3, reopened 0, closing 3.
The round has open findings and closing (3) is not below opening (2), so the result is
`STOP: no progress`. Per the protocol the counter row stays uncommitted, nothing else runs, and
the plan waits for a maintainer resolution recorded in the STOP cell.

Maintainer resolution (2026-10-17): "Resolve and continue". The STOP cell reads
`STOP: no progress; resolved by maintainer`; 020, 021 and 022 are repaired before correction
round 4.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CATALOGUE-020 | `test/accessories/serviceCatalogue.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/serviceCatalogue.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 0 (200 tests, 12 suites, 200 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` exit 0 (no output); `node_modules/.bin/eslint test/accessories/serviceCatalogue.test.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base ef7578f8c86c7f7b65adc3648cd7e404cfee7d12 --format json --quiet --explain` exit 0, verdict pass | see `## Assertion controls` | The `decodedState()` pump default no longer carries `testRunning`, a key no family decodes. "activates the backup pump adapter during a self-test run of T" now drives the real signal, `'self-test': { running: T, testedAt: undefined }`, with `pump: { primaryRunning: false, backupRunning: true }`, and keeps its whole expectation `[ContactSensorState CONTACT_NOT_DETECTED]`. A new four-row loop, "follows primary running P and backup running B on both activity adapters during a self-test", sets `'self-test'.running` to `true` and compares the whole projections of `Primary Pump Running` and `Backup Pump Running` with written-out rows: `{ P: false, B: false }` expects `{ CONTACT_DETECTED, CONTACT_DETECTED }`; `{ false, true }` expects `{ CONTACT_DETECTED, CONTACT_NOT_DETECTED }`; `{ true, false }` expects `{ CONTACT_NOT_DETECTED, CONTACT_DETECTED }`; `{ true, true }` expects `{ CONTACT_NOT_DETECTED, CONTACT_NOT_DETECTED }`. "leaves the backup pump adapter quiet while every other condition is active" now also has `'self-test': { running: true, testedAt: undefined }` and keeps `CONTACT_DETECTED`. Every existing case is kept. The count grows from 196 to 200. No source change. |

## Assertion controls

| ID | Wrong behavior | Mutation and blobs | Failing assertion output | Restoration |
| --- | --- | --- | --- | --- |
| CR-05-CATALOGUE-020 (A) | Both activity adapters hide their alert while a self-test runs (wrong row 1 of the finding) | In `src/accessories/serviceCatalogue.ts` `pumpActivityValues`, a line `const testing = booleanOf(decodedGroup(input.decoded, 'self-test'), 'running') === true;` was added and the value became `contactState(hap, running === undefined ? undefined : running && !testing)`. Blob before `cef0ebf54fdb34c06e069609b325db919e591718`, mutated `834b559e4cb18003979d752a4c199ce80647e73d`; `npm run build:test` exit 0 | `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 1 (200 tests, 196 pass, 4 fail). `activates the backup pump adapter during a self-test run of true`: `AssertionError [ERR_ASSERTION]` on the whole projection, actual `[ { uuid: '0000006A-0000-1000-8000-0026BB765291', value: 0 } ]`, expected `[ { uuid: '0000006A-0000-1000-8000-0026BB765291', value: 1 } ]`. The `{ false, true }`, `{ true, false }` and `{ true, true }` rows of `follows primary running P and backup running B on both activity adapters during a self-test` fail on the whole `{ primary, backup }` value: each running adapter has actual `value: 0`, expected `value: 1` | `git checkout -- src/accessories/serviceCatalogue.ts` exit 0; blob `cef0ebf54fdb34c06e069609b325db919e591718`, equal to the recorded one; `git diff --exit-code -- src/accessories/serviceCatalogue.ts` exit 0 |
| CR-05-CATALOGUE-020 (B) | Both activity adapters raise their alert while a self-test runs, with no pump run (wrong row 2 of the finding) | The same added line, and the value became `contactState(hap, running === undefined ? undefined : running \|\| testing)`. Blob before `cef0ebf54fdb34c06e069609b325db919e591718`, mutated `db8e4d27836be9ea16ac92907e704644a2fb2487`; `npm run build:test` exit 0 | `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 1 (200 tests, 196 pass, 4 fail). The `{ false, false }`, `{ false, true }` and `{ true, false }` rows of `follows primary running P and backup running B on both activity adapters during a self-test` fail on the whole `{ primary, backup }` value: each idle adapter has actual `value: 1`, expected `value: 0`. `leaves the backup pump adapter quiet while every other condition is active`: `AssertionError [ERR_ASSERTION]`, actual `[ { uuid: '0000006A-0000-1000-8000-0026BB765291', value: 1 } ]`, expected `[ { uuid: '0000006A-0000-1000-8000-0026BB765291', value: 0 } ]` | `git checkout -- src/accessories/serviceCatalogue.ts` exit 0; blob `cef0ebf54fdb34c06e069609b325db919e591718`, equal to the recorded one; `git diff --exit-code -- src/accessories/serviceCatalogue.ts` exit 0; rebuilt (exit 0), the owner test passes (exit 0, 200 tests, 0 failures) |
