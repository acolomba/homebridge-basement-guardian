---
phase: 05-accessories-conformance
batch: CATALOGUE
review_round: 6
reviewed: 2026-10-17T17:14:00Z
depth: deep
source_revision: 9fb85e1194b8b04a0d663fae5e813e8bbd8a57f1
files_reviewed: 2
files_reviewed_list:
  - src/accessories/serviceCatalogue.ts
  - test/accessories/serviceCatalogue.test.ts
findings:
  blocker: 0
  warning: 0
  total: 0
status: clean
reviewer: gsd-code-reviewer (correction round 6)
---

# Phase 5 CATALOGUE batch: correction round 6

I read every line of both files fresh and in full at `9fb85e1194b8b04a0d663fae5e813e8bbd8a57f1`
(source 1050 lines, test 2867 lines). I did not review a diff. After the full read I used diffs
for two checks only: preservation against the batch base `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12`
(D-05), and the content of the round-5 repair commit `46265a6` (`git show 46265a6`).

Inputs read: AGENTS.md; the three `.agents/skills` books (each `SKILL.md` and every `rules/*.md`
file); `05-CONTEXT.md`; `05-REVIEW-PROTOCOL.md`; `05-CATALOGUE-REVIEW.md` and `-R1.md` to `-R5.md`
(findings, candidates, Coordinator triage, Repair history, Assertion controls, and the R3 to R5
row coverage sweeps); the CATALOGUE rows and the 05-03 dispatch log of `05-FINDINGS.md`;
`src/device/family.ts:77-181`; `src/device/gemini.ts:282-376` (the scope decoders and `decode`);
`src/accessories/basementGuardian.ts:600-660, 1015-1066` (how the accessory builds a projection
input); `features/lib/hap.ts:341-348, 484-489`; and `eslint.config.js:237`.

Opening open set: 1 ID (CR-05-CATALOGUE-024, WARNING). Result: 024 is fixed. None of 001 to 023
reopened. No new cause. Count: 1 opening - 1 fixed - 0 rejected + 0 new + 0 reopened = 0 closing.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-024 | WARNING | fixed | Test 811-825 arranges `decodedState({ ...everyOtherConditionActive(), water: { levelCode: 31, levelPercent: 100, flooded: true }, pump: { primaryRunning: true, backupRunning: false, backupActivatedAt: 1_700_000_000 } })` with `offlineConfirmed: true`. Every decoded group is now in its active state: a flooding pit, every equipment fault and the fuse, a lost controller link, the primary pump running with an activation time, mains lost, a low battery, a self-test running, the alarm muted, and the device reporting itself offline, with a confirmed offline run. Only `backupRunning` is `false`. The title "leaves the backup pump adapter quiet while every other condition is active" is now true, and the phrase has one meaning in the file: in the water cases (562-575, 601) it means every group but the water subject, and here every group but the backup pump's own running fact. The expected value `[ContactSensorState CONTACT_DETECTED]` is unchanged, so the assertion is not weakened. A read-only probe gives `[0]` for this input. Side effect: R5 candidate 1 (an adapter `running \|\| flooded`) now fails this case too. |
| CR-05-CATALOGUE-001 | WARNING | still fixed | Source 1-32 and test 1-11 have the D-01 layout (see `## Header inspection`). The tracer prints `ACCESSORIES_HEADERS_OK files=2`. |
| CR-05-CATALOGUE-002 | WARNING | still fixed | `grep -c "act & assert"` gives 0. Every case has separate `// act` and `// assert` phases, with `// arrange` where it has setup. |
| CR-05-CATALOGUE-003 | BLOCKER | still fixed | Matrix 1426-1473: all seven read groups in every row. "a group carrying none of its facts" gives `{}` for each (1446). "facts of the wrong type" (1447-1458) makes every fact a string. Expected value: sixteen `[]` (1471). |
| CR-05-CATALOGUE-004 | BLOCKER | still fixed | Off-ladder cases at 457-473 (`{ 31, 20, false }`, whole projection) and 477-487 (`{ 1, 20, true }`, `LEAK_DETECTED`). The import case is "imports nothing from the water level ladder module" (2056-2062). |
| CR-05-CATALOGUE-005 | BLOCKER | still fixed | `grep "map((row) => row.kind)"` finds nothing. Written-out literals pin the order at 1562-1589 (kinds and subtypes) and 1653-1680 (names). |
| CR-05-CATALOGUE-006 | BLOCKER | still fixed | `grep -c isInteger` gives 0. The outage cases at 1997-2014 and 2016-2027 compare `summarise(row.project(input))` whole. |
| CR-05-CATALOGUE-007 | BLOCKER | still fixed | The positive at 198-204 has all five required members. The negative at 205-206 lacks only `offlineConfirmed`. `npm run typecheck` exits 0, so the `@ts-expect-error` is consumed. |
| CR-05-CATALOGUE-008 | WARNING | still fixed | Source 244: `function isRowTrusted` has no `export`. `grep -c isRowTrusted` in the test gives 0. |
| CR-05-CATALOGUE-009 | WARNING | still fixed | 12 top-level `describe()` blocks (1561, 2068, 2094, 2118, 2142, 2168, 2351, 2393, 2556, 2594, 2703, 2798), one for each of the 12 exported functions (source 262, 280, 298, 308, 318, 854, 885, 926, 944, 974, 1005, 1038). The `register*Cases` functions run inside `describe('createServiceCatalogue')` (1805-1819) and call only `row.project`. |
| CR-05-CATALOGUE-010 | WARNING | still fixed | `readOf` (2682-2693) is `async` and awaits `held.handleGetRequest()` inside its `try`. All four callers await it (2718, 2745, 2765, 2782). |
| CR-05-CATALOGUE-011 | WARNING | still fixed | Source 1032-1036 is in the present tense and correct. Code line 1043 is unchanged. |
| CR-05-CATALOGUE-012 | WARNING | still fixed | Test 950-951 is in the present tense and narrates no history. |
| CR-05-CATALOGUE-013 | WARNING | still fixed | Test 101 (`TRUST_SCOPES`) and 1423-1424 (`registerAbsentStateCases`) describe what the code does. |
| CR-05-CATALOGUE-014 | WARNING | still fixed | `clearFaults()` (114-122) returns a new group on each call. `grep -c CLEAR_FAULTS` gives 0. `everyOtherConditionActive()` (243-253) also returns a new object on each call. |
| CR-05-CATALOGUE-015 | WARNING | still fixed | `grep -c "(value) =>"` gives 0. |
| CR-05-CATALOGUE-016 | WARNING | still fixed | The two separately titled cases are at 1938-1957 (outage, `{ 20, false, NO_FAULT }`) and 1959-1978 (`invalid`, `{ 20, undefined, undefined }`). |
| CR-05-CATALOGUE-017 | WARNING | still fixed | `grep -c " ? "` gives 0. Every data loop takes its expected value from a field of the row. |
| CR-05-CATALOGUE-018 | BLOCKER | still fixed | 1140-1171 (two rows that break D-07, whole projections of both battery rows) and 1175-1201 (`{ protectionHoursCode: 8, levelPercent: 25 }`, whole). |
| CR-05-CATALOGUE-019 | BLOCKER | still fixed | 1375-1386: `connectivity: { reportedOffline: true }` with `offlineConfirmed: false` expects the whole projection `[ContactSensorState CONTACT_DETECTED]`. |
| CR-05-CATALOGUE-020 | BLOCKER | still fixed | The `decodedState()` pump default (229) has no `testRunning`; the token appears only as the loop variable at 754-758. 754-767 drives `'self-test'.running` for both values. 771-795 compares both activity adapters whole during a test. 811-825 still has a running self-test, through the seed (250). |
| CR-05-CATALOGUE-021 | BLOCKER | still fixed | 506-528 compares the whole level projection for both sensor-fault values. 533-589 compares the whole flood projection for both verdicts beside each condition. 593-621 compares the whole level projection beside a backup run and beside every other active condition. |
| CR-05-CATALOGUE-022 | BLOCKER | still fixed | 1392-1420: `decoded: undefined`, with the seven non-connectivity scopes written out as `invalid`. The whole projection is compared for both confirmation values. |
| CR-05-CATALOGUE-023 | BLOCKER | still fixed | 652-683: the pumps in opposite states. Each case compares the whole `{ pump, adapter }` value of `Backup Pump` (seven written-out entries) and `Backup Pump Running`. |

New IDs: none. No new findings.

No fixed ID reopened.

### Preservation (D-05)

Source diff `ef7578f..9fb85e1`: the header (2-6), the `isRowTrusted` JSDoc paragraph, the dropped
`export` on `isRowTrusted`, and the `seedConfiguredName` JSDoc paragraph. Nothing else changed.
The source was last touched by `b70716f`. Its blob is `cef0ebf54fdb34c06e069609b325db919e591718`,
the blob every recorded assertion control restored. The round-5 commits (`64c57c7`, `46265a6`,
`9fb85e1`) touch only the test, the R5 report and the ledger. These are all the same as at the
base: every subtype (`subtype: kind`, 639), every display name, every characteristic mapping, the
`trustedGroup`/`isRowPublishable` withholding of an undecoded or untrusted scope, the
`StatusActive` source (`isRowFullyTrusted`), the `StatusFault` projections (including
`mainsPowerLostValues`' `NO_FAULT`), the `alwaysPublish` flags, and the single
`new hap.HapStatusError(status)` push in `publishPersistentFailure` (1008). In the test, literals
pin the subtypes (1562-1589), the names and scopes (1591-1623, 1653-1680) and the service types
(1712-1741), and every one of those cases passes. The round-5 repair changed one arrange (it added
the `water` group) and kept the title and the whole-projection expectation. It removed no case and
weakened no assertion. The count stays 212.

## Row coverage sweep

Columns as in R4 and R5: (a) each value the row publishes and the decoded fact it reads; (b)
whether a case feeds a fact that differs from what a re-derivation from other facts would give;
(c) whether each input the row must ignore is set, in some case that asserts the row, to the state
that would change the output if the row read it. That includes the sibling field a copy-paste
error would read. Line numbers are at `9fb85e1`. "R<n> c<m>" points to an earlier accepted
rejection.

| # | Row | (a) Publishes <- reads | (b) Fact off its derivation | (c) Ignored inputs exercised | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | Sump Pit Flood | `LeakDetected` <- `water.flooded` | 477-487 `{1, 20, true}`. The opposite direction stays rejected (R3 c1). | Sensor fault, backup run, every other condition, each with both verdicts, whole: 533-589. Own scope `unreachable` 1853, `invalid` 1869, both 1918. Other scopes: 1629. | Covered |
| 2 | Sump Pit Level | `WaterLevel` <- `levelPercent`; `RawWaterLevelCode` <- `levelCode`; `WaterSensorFaultReported`, `StatusFault` <- `fault.waterSensorFault` | 457-473 `{31, 20, false}`, whole. | `fault` invalid: 489-504 (whole), 1959. Outage: 1938. Sensor fault both values with a one-fact group, whole: 506-528. Backup run and every other condition, whole: 593-621. A `.some()` fault aggregate: R3 c2. | Covered |
| 3 | Primary Pump | `PumpRunning` <- `primaryRunning`; `PumpFault`, `StatusFault` <- `primaryPumpFault`; no fuse; record from `primaryPumpRecord` while running decoded | n/a | Running swap: 626-648. Fault swap and fuse absent: 685-708 (one-fact group, `fuseBlown: undefined`). Backup record: 830-841. Self-test label: 862-876. Undecoded running: 1015-1039. An OR with `backupRunning`: R5 c2. | Covered |
| 4 | Primary Pump Running | `ContactSensorState` <- `primaryRunning` | n/a | 626-648; 771-795 (all four running combinations during a test, whole). Faults, mains, offline: R3 c4. | Covered |
| 5 | Backup Pump | `PumpRunning` <- `backupRunning`; `PumpFault`, `PumpFuseBlown`; `StatusFault` <- fault OR fuse; record and label from `backupPumpRecord` | n/a | Pumps in opposite states, whole: 652-683. Fault and fuse swaps and the merge: 710-735, 737-751. Records and label: 843-857, 878-894, 899-912, 917-932, 952-983. Undecoded running: 1015-1039. Self-test under the service: R4 c1. | Covered |
| 6 | Backup Pump Running | `ContactSensorState` <- `backupRunning` | n/a | Self-test both values: 754-767. All four running combinations during a test: 771-795. Opposite states: 652-683. Activation time: 797-809. Every other condition active, now including a flooding pit, with `offlineConfirmed: true`: 811-825. | Covered |
| 7 | Sump Mains Power | `MainsPowerPresent` <- `mainsPresent` | n/a | Both values, whole: 1048. Own scope `invalid` 1536, `controller-link-lost` 1885, tolerance 2029/2043. Battery and offline: R3 c4. | Covered |
| 8 | Mains Power Lost | `ContactSensorState` <- NOT `mainsPresent`; `StatusFault` `NO_FAULT` while `mainsPresent` decoded | n/a | 1061-1074 whole in both states; 1536. | Covered |
| 9 | Backup Battery Level | `StatusLowBattery` <- `low`; `BatteryLevel` <- `levelPercent`; `ChargingState` <- `charging` | `low`: 1140-1171, both directions. `levelPercent`: 1175-1201. | Health against the level: 1120-1135. Charging: 1203-1222. `NOT_CHARGEABLE`: 1224-1240. | Covered |
| 10 | Backup Battery | `BatteryCharging`, `BatteryVoltageLow`, `BatteryHealthCode`, `ProtectionHoursCode` | Inverse derivations fail 1140-1171 and 1175-1201. | Voltage/low swap fails the first row of 1140; health/protection swap fails its second row. | Covered |
| 11 | Primary Pump Fault | `ContactSensorState`, `StatusFault` <- `primaryPumpFault` | n/a | Every sibling condition alone, offline included: 1245-1257. `StatusFault` against an active water fault: 1259-1280. Link-lost and `invalid`: 1304, 1320. | Covered |
| 12 | Backup Pump Fault | the same pair <- fault OR fuse | n/a | 1245-1257 (fault and fuse separately, and siblings). One missing fact: R3 c5. `StatusFault` picked-only: R4 c6. | Covered |
| 13 | Water Sensor Fault | the same pair <- `waterSensorFault` | n/a | 1245-1257, 1259-1280, 1304, 1320. | Covered |
| 14 | Pump Controller Link Lost | the pair <- NOT `controllerLinkPresent`; `ControllerLinkPresent`; `ControllerDataLastTrustedAt` while the link fact decoded; tolerates `controller-link-lost` | n/a | Siblings and offline: 1245-1257. Whole: 1282, 1335, 1997. `invalid`: 1320. Link fact absent: matrix 1446. | Covered |
| 15 | System Self-Test | `On` <- `'self-test'.running`, nothing while pending | n/a | Both values, whole: 1475-1487 (an `alarm-mute` field or group swap fails the `true` row). Own pending: 1492. Other pending: 1510. `invalid`: 1524. | Covered |
| 16 | Alarm Mute | `On` <- `'alarm-mute'.muted`, nothing while pending | n/a | 1492 (a capability swap fails), 1510 (a field swap withholds and fails). A hard-coded `'self-test'.running` read would leave `field` unused, which lint fails, and would change the declared-scope case 1629. `muted: false`: R3 c6. | Covered |
| 17 | Basement Guardian Offline | `ContactSensorState` <- `offlineConfirmed` | n/a | Both values: 1356-1371. `reportedOffline: true`: 1375-1386. No decoded state, other scopes `invalid`: 1392-1420. Unrelated scope `invalid`: 1548. Outage: 2016. Siblings: 1245-1257. | Covered |

Sweep result: all 17 rows covered, no gap. The R3 to R5 rejections still hold, and R5 candidate 1
is now also closed by 811-825.

## Findings

None.

## Candidates considered and not filed

1. **811-825 leaves `pendingControls` and `untrustedScopes` empty and `controllerDataLastTrustedAt`
   at `''`.** Not filed. None of these is a device condition that "every other condition" names.
   A pending request is HomeKit request state (D-05). A distrust reason is trust state, and a
   distrusted `pump` scope would make the adapter withhold, so the case could not keep its
   expected value. The adapter does not read the formatted time. Every decoded group, and the
   confirmed offline run, is now in its active state.
2. **"publishes every required characteristic of a service it earns, in every trust state"
   (1821-1830) runs nine inputs** (all trusted, and each scope `invalid` alone, 374-378). It does
   not run `unreachable`, `controller-link-lost`, `stale` or a combination. Not filed. For the
   current catalogue, the nine inputs already produce every distinct projection set.
   `unreachable` withholds nothing, so it gives the trusted projection. `controller-link-lost` and
   `stale` withhold exactly as `invalid` does on every row that does not tolerate them. The one
   tolerant row reads only its own scope, and the reason it tolerates gives its trusted
   projection. On a two-scope row, a combination of withheld scopes gives `[]` or the own-scope
   subset, and both are already produced. No plausible wrong row passes because of the narrower
   input set, and the negative control at 1835-1848 proves that the helper detects drift.
3. **`Sump Pit Level` given a decoded state with no `water` group, while `water` is trusted,
   projects only its fault values.** A read-only probe gives `[WaterSensorFaultReported false,
   StatusFault 0]`, so `ensureService` would add a `SumpPitService` with `WaterLevel` at its
   default. Not filed. That input is unreachable under the family contract. `decode` leaves a
   group `undefined` exactly when that scope's own validation untrusts it (`gemini.ts:368-375`).
   `ScopedDomainState` documents `undefined` as "this scope did not validate" (`family.ts`). The
   accessory computes `untrusted` from the same validation in the same update
   (`basementGuardian.ts:1021-1029`, then 1060). The unresolved-family path passes
   `decoded: undefined`, which also drops `fault`. With `water` `invalid`, the row's own gate
   gives `[]` (probe). The scope-based precondition in the `ensureService` JSDoc holds under that
   contract, and the matrix (1426-1473) pins the all-groups-missing inputs.
4. **The four `publishPersistentFailure` cases all push `SERVICE_COMMUNICATION_FAILURE`**, so a
   body that hard-codes that status would pass them. Not filed. Such a body leaves the trailing
   `status` parameter unused, and `@typescript-eslint/no-unused-vars`
   (`eslint.config.js:237`, default `args: 'after-used'`) fails it. The naming rules forbid an
   `_status` escape. The only production caller (`staleMarking.ts:172`) forwards its own
   `status`.
5. **"A blackout marks; it raises no alarm" (1993) against the prose rule "Use the domain word the
   code uses".** Not filed. "Blackout" is a domain word that this codebase already uses for an
   all-scope outage (`basementGuardian.ts:346-347`), and the same comment restates it as "an
   outage".
6. **R1 to R5 candidates.** These were accepted earlier as reasoned rejections. Not re-filed. I
   re-read each cited region at this revision and found no concrete reason to reverse any of them.
   R5 candidate 1 is now closed outright by the 024 repair.

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

I ran every command from the repository root at HEAD `9fb85e1194b8b04a0d663fae5e813e8bbd8a57f1`
with a clean tree (`git status --porcelain` was empty before and after). Node `v26.12.0`, npm
`11.20.0`, 2026-10-17T17:09:43Z to 17:10:04Z. Every command had the prefix
`export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both `tsc --noEmit` passes are clean |
| `node_modules/.bin/eslint src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | |
| `node --test dist-test/test/accessories/serviceCatalogue.test.js` | 0 | tests 212, suites 12, pass 212, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` | 0 | printed only the npm banner (100% direct pair coverage) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CATALOGUE` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

I ran these read-only probes with made-up inputs and changed no source or test file. Each was a
`node --input-type=module -e` against `dist-test/src/accessories/serviceCatalogue.js` and
`dist-test/features/lib/hap.js`. For the 024 input (a flooding pit, the primary pump running, the
backup pump idle, mains lost, `offlineConfirmed: true`), `Backup Pump Running` gives `[0]`.
`Sump Pit Level` with `decoded: { fault: { waterSensorFault: false } }` and nothing untrusted gives
`[WaterSensorFaultReported false, StatusFault 0]`. With `water` `invalid`, it gives `[]`
(candidate 3). I also ran these read-only greps on the test, and each found nothing: `act & assert`,
a ternary, `isRowTrusted`, `CLEAR_FAULTS`, `(value) =>`, `isInteger`, `map((row) => row.kind)`, and
`only`, `skip` or `todo`. None of the style quick-scan tokens appear in either file. Every
`no longer` and `replac...` hit is a present-tense domain statement. I ran no mutation experiment.
Each claim that a wrong row fails or passes comes from tracing every case that projects the row.

## Out-of-scope observations

- `features/lib/hap.ts:341-348` and `486-488` (Phase 7 under D-12, GATES parity under D-16): the
  stand-in `handleGetRequest` still throws synchronously, and `getCharacteristic` still returns
  `find(...)` (`undefined` for an absent characteristic). Lead S-05-23 tracks both. This batch
  handles both forms (`readOf`, and the `seedConfiguredName` guard).
- `test/accessories/basementGuardian.test.ts` (ACCESSORY batch, Phase 5): `grep -c PumpRunning`
  still gives 0. This is the accessory-side view that R4 and R5 recorded. The owning pair pins
  both services' running fields (626-648, 652-683).
- No other new out-of-scope defect was observed.

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action. The round reports no open, reopened or new finding; the coordinator accepts the
reviewer's candidates as reasoned rejections.

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-024 | WARNING | fixed | Confirmed fixed by this round. |
| CR-05-CATALOGUE-001 to 023 | as opened | fixed | Confirmed still fixed by this round. |

Counter (D-03 as amended, D-18): opening 1, fixed 1, rejected 0, new 0, reopened 0, closing 0.
Closing 0 is `clean` and closes the CATALOGUE batch at correction round 6.
