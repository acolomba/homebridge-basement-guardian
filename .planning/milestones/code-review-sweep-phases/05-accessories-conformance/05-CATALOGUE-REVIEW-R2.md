---
phase: 05-accessories-conformance
batch: CATALOGUE
review_round: 2
reviewed: 2026-10-17T15:27:11Z
depth: deep
source_revision: ec755ee2e4e9df8c608f11829085db637a472258
files_reviewed: 2
files_reviewed_list:
  - src/accessories/serviceCatalogue.ts
  - test/accessories/serviceCatalogue.test.ts
findings:
  blocker: 2
  warning: 0
  total: 2
status: issues_found
reviewer: gsd-code-reviewer (correction round 2)
---

# Phase 5 CATALOGUE batch: correction round 2

I read every line of both files fresh and in full at `ec755ee2e4e9df8c608f11829085db637a472258`
(source 1050 lines, test 2580 lines). I did not review a diff. I used diffs only after the full
read, for three checks: preservation against the batch base `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12`
(D-05), the protection of the split case (P-05-03), and whether the two repairs added a new defect.

Inputs read: AGENTS.md; the three `.agents/skills` books (each `SKILL.md` and every `rules/*.md`
file); `05-CONTEXT.md`; `05-REVIEW-PROTOCOL.md`; `05-CATALOGUE-REVIEW.md` and
`05-CATALOGUE-REVIEW-R1.md` (findings, candidates, Coordinator triage, Repair history, Assertion
controls); the CATALOGUE rows of `05-FINDINGS.md`; and, for the two new findings,
`src/device/gemini.ts` (`decodeWater`, `decodeBattery`, `decodeConnectivity`, lines 95-105 and
260-334).

Opening open set: 2 IDs (0 BLOCKER, 2 WARNING). Result: both fixed, none of 001 to 015 reopened, and
2 new BLOCKERs. Count: 2 opening - 2 fixed - 0 rejected + 2 new + 0 reopened = 2 closing.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-016 | WARNING | fixed | The two-row loop is gone. Test 1651-1670, "keeps publishing the second scope group a row reads through an outage on that scope", uses `reason: 'unreachable'` and expects `{ level: 20, fault: false, status: NO_FAULT }`. Test 1672-1691, "withholds the second scope group a row reads while that scope fails validation", uses `reason: 'invalid'` and expects `{ level: 20, fault: undefined, status: undefined }`. Each title states what its case proves. The expected values are the same as at `700ce9a`. The comment at 1649-1650 states both halves correctly. The case count stays 192. |
| CR-05-CATALOGUE-017 | WARNING | fixed | `grep -n " ? "` finds no ternary anywhere in the test file. Each loop that registers a test now takes its expected value from a field of the row: 491-494 `statusFault`, 519-522 `contactState`, 543-546 `status`, 872-875 `contactState`, 77-90 `verdict`/`status` (the title no longer has a ternary either), 965-968 `chargingState`, 135-172 `contactStates` (written out in `FAULT_ADAPTERS` order, one `CONTACT_NOT_DETECTED` per row), 1021-1024 `primaryStatus`/`waterStatus`, 1118-1121 `contactState`, 1860-1865 `publishes`. Every written-out value matches the expression it replaced. In a loop body, the only `===`/`!==` tokens left are `.filter` callbacks that select actual values (701, 718, 756, 1180, 2365). None of them computes an expected value. |
| CR-05-CATALOGUE-001 | WARNING | still fixed | Source 1-31: SPDX, blank, copyright block 3-5, blank, `@fileoverview` 7-30, blank, imports. Test 1-10: same layout. The tracer prints `ACCESSORIES_HEADERS_OK files=2`. |
| CR-05-CATALOGUE-002 | WARNING | still fixed | `grep "act & assert"` finds nothing. Each case has separate `// act` and `// assert` phases with role-named values. |
| CR-05-CATALOGUE-003 | BLOCKER | still fixed | The matrix rows at 1139-1171 carry all seven groups the decoded-state rows read. In "a group carrying none of its facts" each group is `{}`. In "facts of the wrong type" every fact is a string. The expected value is sixteen `[]` (1184). |
| CR-05-CATALOGUE-004 | BLOCKER | still fixed | The off-ladder cases are at 442-458 (`{ 31, 20, false }`, whole projection) and 462-472 (`{ 1, 20, true }`, `LEAK_DETECTED`). The import case is titled "imports nothing from the water level ladder module" (1769-1775). |
| CR-05-CATALOGUE-005 | BLOCKER | still fixed | No case takes its expected value from `createServiceCatalogue(...).map(...)`. Written-out literals pin the order at 1275-1302 and 1366-1393. |
| CR-05-CATALOGUE-006 | BLOCKER | still fixed | No integer-level case. The ladder rungs are pinned whole at 389-406. The outage cases at 1710-1727 and 1729-1740 each compare `summarise(row.project(input))` whole. |
| CR-05-CATALOGUE-007 | BLOCKER | still fixed | The positive at 198-204 carries all five required members. The negative at 205-206 lacks only `offlineConfirmed`. `npm run typecheck` exits 0. |
| CR-05-CATALOGUE-008 | WARNING | still fixed | Source 244: `function isRowTrusted` has no `export`. `grep isRowTrusted` in the test finds nothing. |
| CR-05-CATALOGUE-009 | WARNING | still fixed | There are 12 top-level `describe()` blocks, one per exported function. The two cases added by the 016 split call `row.project` and sit under `createServiceCatalogue`. `isRowPublishable` (1855-1879) and `isRowFullyTrusted` (1881-2062) call only their own entrypoint. |
| CR-05-CATALOGUE-010 | WARNING | still fixed | `readOf` (2395-2406) is `async` and awaits `held.handleGetRequest()` inside its `try`. The four callers (2431, 2458, 2478, 2495) await it. |
| CR-05-CATALOGUE-011 | WARNING | still fixed | Source 1032-1036 is in the present tense and correct. Code line 1043 has not changed. |
| CR-05-CATALOGUE-012 | WARNING | still fixed | Test 778-779 is in the present tense and has no history narration. |
| CR-05-CATALOGUE-013 | WARNING | still fixed | Test 101 (`TRUST_SCOPES`) and 1136-1137 (`registerAbsentStateCases`, which names the control `On` cases) describe what the code does. |
| CR-05-CATALOGUE-014 | WARNING | still fixed | `clearFaults()` (113-122) returns a new group on each call. `grep CLEAR_FAULTS` finds nothing. |
| CR-05-CATALOGUE-015 | WARNING | still fixed | `grep "(value)"` finds no callback named `value`. The elements are `projected`, `projectedValue` or `published`. |

New IDs: CR-05-CATALOGUE-018 (BLOCKER), CR-05-CATALOGUE-019 (BLOCKER). Neither is a reopen. CR-004
covered the `water` group, and that fix is intact. 018 is the same class of gap in the `battery`
group. 019 is in the offline adapter's input. Both gaps date from before the batch base. The two
round-1 repairs did not cause them.

### Preservation (D-05) and removed-case protection (P-05-03)

- Source diff `ef7578f..ec755ee`: only the header (2-6), the `isRowTrusted` JSDoc paragraph, the
  dropped `export` on `isRowTrusted`, and the `seedConfiguredName` JSDoc paragraph changed. The
  source has not changed since `700ce9a`. Every subtype, display name, characteristic mapping, and
  `trustedGroup`/`isRowPublishable` withholding is the same as at the base. So are the
  `StatusActive`/`StatusFault` projection, the `alwaysPublish` flags, and the single
  `new hap.HapStatusError(status)` push in `publishPersistentFailure` (1005-1009). Literals in the
  test still pin the subtypes (1275-1302), the names and scopes (1304-1336, 1366-1393) and the
  service types (1425-1454), and all of those cases pass.
- The 016 split kept both assertions and changed only the titles. The 017 repair moved each
  expected value into its row, unchanged. No case was removed. The count stays 192 tests in 12
  suites.

## Findings

### CR-05-CATALOGUE-018 - BLOCKER: No case decouples the battery group's derived `low` and `levelPercent` from its raw codes, so a battery row that re-derives them passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate the behavior named in its title; a wrong implementation makes the assertion fail); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: a case a wrong implementation would pass, from weak or missing assertions)
**Location:** `ec755ee2e4e9df8c608f11829085db637a472258:test/accessories/serviceCatalogue.test.ts:75-99, 220-222, 908-963, 986-1002` (production contract at `ec755ee2e4e9df8c608f11829085db637a472258:src/accessories/serviceCatalogue.ts:11-17, 564-581`)
**Issue:** The module says a published value is "read verbatim from decoded state, and no arithmetic reaches a projection" (11-17). It also says `StatusLowBattery` carries the warning while both battery facts publish as reported (564-572). The family derives the battery group's `levelPercent` from `protectionHoursCode` and its `low` from `voltageLow || healthCode ∈ {1, 2, 32}` (`src/device/gemini.ts:105, 310-311`). The water group has the same derivation of `levelPercent` and `flooded` from `levelCode` (`gemini.ts:285`). CR-05-CATALOGUE-004 closed that gap for water with off-ladder cases. No battery case has an equivalent. Every battery input in the suite matches the family's derivation. All 12 `BATTERY_READINGS` rows set `low` to exactly `voltageLow || health ∈ {1,2,32}`. All four `PROTECTION_BANDS` rows pair 1/2/4/8 with 25/50/75/100. The `batteryGroup()` default is `{ healthCode: 8, voltageLow: false, low: false, protectionHoursCode: 8, levelPercent: 100 }`. Line 952 uses `{ healthCode: 32, low: true, protectionHoursCode: 1, levelPercent: 25 }`. The matrix gives only empty or string-typed groups. So two wrong `Backup Battery Level` rows pass all 192 cases. The first computes `StatusLowBattery` from an inline copy of D-07 (`voltageLow === true || [1, 2, 32].includes(healthCode)`, `undefined` when either fact is missing). The second computes `BatteryLevel` from an inline band map over `protectionHoursCode`. The case titles invite both: "reports the backup battery as low for health code N with a low voltage of B" and "publishes protection hours code N as P per cent beside the raw code". This is the class of gap that round 0 rated BLOCKER for water (CR-004). Production is correct today. A read-only probe projects `[StatusLowBattery 0, BatteryLevel 100, ChargingState 1]` for `{ voltageLow: true, healthCode: 1, low: false, protectionHoursCode: 1, levelPercent: 100 }`. For `{ healthCode: 8, voltageLow: false, low: true, protectionHoursCode: 8, levelPercent: 25 }` it projects `[StatusLowBattery 1, BatteryLevel 25, ChargingState 1]`.
**Fix:** In `registerBatteryCases`, add two cases with written-out whole-projection expectations for `Backup Battery Level`, on a battery group that does not follow D-07 or the band map. (1) "reports the decoded low-battery verdict as reported rather than deriving it from the health code and voltage": `batteryGroup({ healthCode: 8, voltageLow: false, low: true })` expects `[StatusLowBattery BATTERY_LEVEL_LOW, BatteryLevel 100, ChargingState CHARGING]`. Add a mirror case with `{ healthCode: 1, voltageLow: true, low: false }` expecting `BATTERY_LEVEL_NORMAL`, so that a verdict derived from either source fails. (2) "publishes the decoded battery level as reported rather than the band of its protection hours code": `batteryGroup({ protectionHoursCode: 8, levelPercent: 25 })` expects `[StatusLowBattery BATTERY_LEVEL_NORMAL, BatteryLevel 25, ChargingState CHARGING]`. Keep every existing case. Assertion control: make `batteryValues` re-derive `low` from `voltageLow`/`healthCode`, then `levelPercent` from `protectionHoursCode`, and observe each new case fail.
**Flags:** none (no D-04 production-bug candidate: production reads both facts verbatim; no D-06, D-10, D-11, D-13, D-14, D-16 or D-17)

### CR-05-CATALOGUE-019 - BLOCKER: No case sets the device's own `reportedOffline` while the confirmation count is false, so an offline adapter that also fires on `data.offline` passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate the behavior named in its title); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: a case a wrong implementation would pass, from weak or missing assertions)
**Location:** `ec755ee2e4e9df8c608f11829085db637a472258:test/accessories/serviceCatalogue.test.ts:226-238 (233), 1116-1134, 1007-1019 (row 166-171), 1261-1271, 1729-1740` (production contract at `ec755ee2e4e9df8c608f11829085db637a472258:src/accessories/serviceCatalogue.ts:626-632, 833-844`)
**Issue:** The offline adapter promises that it "reads the accessory's own confirmation count, never a reported field: `data.offline` is what the device says about itself, and a physical-device alert raised from it would fire on a transport hiccup (RES-03, D-016)" (626-629). The decoded `connectivity` group carries `reportedOffline` (`src/device/gemini.ts:334`). The offline row is filed under the `connectivity` scope (838). Every other row reads the group its own scope names. In this suite, `reportedOffline` is always `false`: `decodedState()` sets it at 233, and no case overrides it. The matrix inputs carry no `connectivity` group, and the matrix filters out the offline row (1180). A grep of `test/` and `features/` finds `reportedOffline: true` nowhere. The one accessory case that sends a raw `offline: true` (`test/accessories/basementGuardian.test.ts:1464-1476`, "never activates the offline adapter from the device reporting itself offline") uses the fake `powerFamily`, whose `decode` returns `connectivity: { reportedOffline: false }` whatever the raw data says (`basementGuardian.test.ts:500-511, 516-522`). So that case never hands the catalogue a true `reportedOffline` either, and no test anywhere in the repository protects this promise. A row that reads only `reportedOffline` fails "a confirmed offline run" (166-171) and the `offlineConfirmed: true` case at 1122. A row that ORs the two signals passes all 192 cases: `contactState(hap, input.offlineConfirmed || booleanOf(decodedGroup(input.decoded, 'connectivity'), 'reportedOffline') === true)`. That row raises the physical-device alert from the device's own `offline` field, which is the transport-hiccup alarm the comment forbids. Production is correct today. A read-only probe with `offlineConfirmed: false` and `connectivity: { reportedOffline: true }` projects `[ContactSensorState CONTACT_DETECTED]`.
**Fix:** In `registerOfflineCases`, add "activates no Basement Guardian Offline contact from the device's own offline report alone". Use `projectionInput({ decoded: decodedState({ connectivity: { reportedOffline: true } }), offlineConfirmed: false })` and expect the whole projection `[{ uuid: ContactSensorState.UUID, value: CONTACT_DETECTED }]`. Keep the existing cases. Assertion control: make `offlineValues` OR in `reportedOffline` and observe the new case fail.
**Flags:** none (no D-04 production-bug candidate: production ignores `reportedOffline`; no D-06, D-10, D-11, D-13, D-14, D-16 or D-17)

## Candidates considered and not filed

1. **`BatteryReading` carries both `low` and `verdict` (test 66-90).** The two fields encode the
   same fact, and the JSDoc's "the low-battery verdict" could name either one. Not filed. `low`
   is the input given to the decoded group. `verdict` is only the title label, and `status` is the
   expected value. A row whose `low` and `status` disagree makes its case fail, not pass. No rule
   forbids a title-label field.
2. **The comment at 1649-1650 sits above the first of the two split cases.** Not filed. It
   correctly describes both adjacent cases ("an outage ... keeps its values flowing while a
   validation failure ... still withholds them"). No rule requires one comment per case.
3. **"faults the adapter service alongside its contact state, given a primary pump fault of B"
   (1025) interpolates one of the two parameters its rows vary.** Not filed. This is the class R1
   rejected as candidate 2 (boolean-interpolated titles). Both rows assert both statuses against
   written-out row fields, and the title does not contradict either row.
4. **"names a service carrying the characteristic at its construction default" (2547-2560)
   asserts only `.value` from `carriedName`.** Not filed. The title promises the name. The
   declaration count is pinned whole at 2514-2542, and in this case `addCharacteristic` already
   carries the characteristic, so the guard cannot add a declaration.
5. **Swapped pump fields on the two activity adapters.** I checked whether `primary-pump-running`
   reading `backupRunning`, or the reverse, would pass. It would not: 523-540 (`backupRunning:
   false`, `primaryRunning: true`) and 612-637 (`primaryRunning: false`, `backupRunning: true`)
   each fail the swap. No gap.
6. **The widening helpers are named `hapNamespace` and `accessoryStandIn`, not `as*` (210-216).**
   Not filed. D-11 requires one commented widening block, and the file has one (208-216). The
   context leaves helper names to the coordinator.
7. **R1 candidates 2 to 12**, accepted as reasoned rejections in R1's Coordinator triage. Not
   re-filed. I re-read each cited region at this revision and found no concrete reason to reverse
   any of them. In particular, R1 candidate 3 ("projects the same values twice", 1502-1516) and
   candidate 4 (the declared-scopes case, 1342-1364) are unchanged, and the reasoning still holds.

## Header inspection

- `src/accessories/serviceCatalogue.ts`: conforms. Line 1 is `// SPDX-License-Identifier: MIT`,
  line 2 is blank, 3-5 are `/**` / ` * Copyright (c) 2026 Alessandro Colomba` / ` */`, 6 is
  blank, 7-30 are the `@fileoverview` block, 31 is blank and 32 is the first import.
- `test/accessories/serviceCatalogue.test.ts`: conforms. Line 1 is SPDX, 2 is blank, 3-5 are the
  copyright block, 6 is blank, 7-9 are
  `@fileoverview Tests the service catalogue rows and their publish helpers.`, 10 is blank and 11
  is the first import.
- Tracer: `ACCESSORIES_HEADERS_OK files=2`, exit 0.

## Toolchain evidence

I ran every command from the repository root at HEAD `ec755ee2e4e9df8c608f11829085db637a472258`
with a clean tree (`git status --porcelain` was empty before and after). Node `v26.12.0`, npm
`11.20.0`, started 2026-10-17T15:25:48Z. Every command had the prefix
`export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both `tsc --noEmit` passes are clean |
| `node_modules/.bin/eslint src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | |
| `node --test dist-test/test/accessories/serviceCatalogue.test.js` | 0 | tests 192, suites 12, pass 192, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` | 0 | printed only the npm banner (100% direct pair coverage) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CATALOGUE` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

Supporting read-only probe (made-up inputs, no source change): `node --input-type=module -e` against
`dist-test/src/accessories/serviceCatalogue.js` and `dist-test/features/lib/hap.js`. Results:
`Backup Battery Level` with `{ voltageLow: true, healthCode: 1, low: false, protectionHoursCode: 1,
levelPercent: 100 }` gives `[StatusLowBattery 0, BatteryLevel 100, ChargingState 1]`. With
`{ healthCode: 8, voltageLow: false, low: true, protectionHoursCode: 8, levelPercent: 25 }` it
gives `[StatusLowBattery 1, BatteryLevel 25, ChargingState 1]`. `Basement Guardian Offline` with
`offlineConfirmed: false` and `connectivity: { reportedOffline: true }` gives
`[ContactSensorState 0]`. I ran no mutation experiment.

## Out-of-scope observations

- `features/lib/hap.ts:341-348` and `486-488` (Phase 7 under D-12, GATES parity under D-16): the
  stand-in `handleGetRequest` still throws synchronously, and `getCharacteristic` still returns
  `undefined` for an absent characteristic. Lead S-05-23 tracks both. This batch handles both
  forms.
- `test/accessories/basementGuardian.test.ts:1464-1476` (ACCESSORY batch, Phase 5): the case
  "never activates the offline adapter from the device reporting itself offline" sends a raw
  `offline: true` through `powerFamily(true)`. That fake's `decode` (`516-522`, through
  `decodedState` at `500-511`) always returns `connectivity: { reportedOffline: false }`, so the
  device's own report never reaches the accessory or the catalogue. An accessory or catalogue that
  raised the alert from `reportedOffline` would still pass. The ACCESSORY batch owns this case. It
  is the same promise as CR-05-CATALOGUE-019, seen from the accessory's side.
- Repository-wide, no test sets `reportedOffline: true`. Only `false` appears, in
  `test/platformSeeds.ts:116`, `test/accessories/basementGuardian.test.ts:507, 557`,
  `test/device/family.test.ts` and `test/device/gemini.test.ts`. I did not judge whether the
  decoder's `offline` mapping is pinned elsewhere. That belongs to the phase that owns
  `src/device/**`.

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action. Evidence re-read: `src/device/gemini.ts:308-311` (`levelPercent` from the
protection-hours code, `low` from `voltageLow` and the health code), `src/accessories/serviceCatalogue.ts:626-631`
(the offline adapter reads only the confirmation count, never `data.offline`), and the test,
where `reportedOffline` appears once, as `false`.

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-016 | WARNING | fixed | Confirmed fixed by this round. |
| CR-05-CATALOGUE-017 | WARNING | fixed | Confirmed fixed by this round. |
| CR-05-CATALOGUE-001 to 015 | as opened | fixed | Confirmed still fixed by this round. |
| CR-05-CATALOGUE-018 | BLOCKER | open | Accepted: a new cause present at the batch base (the battery counterpart of 004). |
| CR-05-CATALOGUE-019 | BLOCKER | open | Accepted: a new cause present at the batch base. |

The reviewer's other candidates are accepted as reasoned rejections.

Counter (D-03 as amended, D-18): opening 2, fixed 2, rejected 0, new 2, reopened 0, closing 2.
The round has open findings and closing (2) is not below opening (2), so the result is
`STOP: no progress`. Per the protocol the counter row stays uncommitted, nothing else runs, and
the plan waits for a maintainer resolution recorded in the STOP cell.

Maintainer resolution (2026-10-17): "Resolve and continue". The STOP cell reads
`STOP: no progress; resolved by maintainer`; 018 and 019 are repaired before correction round 3.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CATALOGUE-018 | `test/accessories/serviceCatalogue.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/serviceCatalogue.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 0 (195 tests, 12 suites, 195 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` exit 0 (no output); `node_modules/.bin/eslint test/accessories/serviceCatalogue.test.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base ef7578f8c86c7f7b65adc3648cd7e404cfee7d12 --format json --quiet --explain` exit 0, verdict pass | see `## Assertion controls` | Three cases added in `registerBatteryCases`, each comparing the whole projections of both battery rows (`Backup Battery Level` and `Backup Battery`) against written-out values. A two-row loop, "reports a decoded low verdict L, not one derived from health code H and low voltage V": `{ healthCode: 8, voltageLow: false, low: true }` expects `StatusLowBattery` `BATTERY_LEVEL_LOW`, and `{ healthCode: 1, voltageLow: true, low: false }` expects `BATTERY_LEVEL_NORMAL`. Each row carries its `status`, and both expect `BatteryLevel` 100 and `ChargingState` `CHARGING`. "publishes the decoded battery level as reported rather than the band of its protection hours code": `{ protectionHoursCode: 8, levelPercent: 25 }` expects `BATTERY_LEVEL_NORMAL`, `BatteryLevel` 25, `CHARGING`, and the facts row `[true, false, 8, 8]`. Every existing case is kept. The count grows from 192 to 195. No source change. |
| CR-05-CATALOGUE-019 | `test/accessories/serviceCatalogue.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/serviceCatalogue.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 0 (196 tests, 12 suites, 196 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` exit 0 (no output); `node_modules/.bin/eslint test/accessories/serviceCatalogue.test.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base ef7578f8c86c7f7b65adc3648cd7e404cfee7d12 --format json --quiet --explain` exit 0, verdict pass | see `## Assertion controls` | One case added in `registerOfflineCases`: "activates no Basement Guardian Offline contact from the device reporting itself offline alone". The input is `decodedState({ connectivity: { reportedOffline: true } })` with `offlineConfirmed: false`. The case compares the whole projection with `[{ uuid: ContactSensorState.UUID, value: CONTACT_DETECTED }]`. It is the first case in the suite with `reportedOffline: true`. Every existing case is kept. The count grows from 195 to 196. No source change. |

## Assertion controls

| ID | Wrong behavior | Mutation and blobs | Failing assertion output | Restoration |
| --- | --- | --- | --- | --- |
| CR-05-CATALOGUE-018 (A) | The `Backup Battery Level` row derives `StatusLowBattery` from `voltageLow` and `healthCode` (an inline copy of `D-07`) instead of reading the decoded `low` | In `src/accessories/serviceCatalogue.ts` `batteryValues`, the `StatusLowBattery` value became `lowBatteryState(hap, booleanOf(battery, 'voltageLow') === undefined \|\| numberOf(battery, 'healthCode') === undefined ? undefined : booleanOf(battery, 'voltageLow') === true \|\| [1, 2, 32].includes(numberOf(battery, 'healthCode') ?? 0))`. Blob before `cef0ebf54fdb34c06e069609b325db919e591718`, mutated `f1c74f2c62085cacf6ba07f75759f13bbc0710e1`; `npm run build:test` exit 0 | `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 1 (195 tests, 193 pass, 2 fail; every `BATTERY_READINGS` case passes). Both failures are on the whole `{ battery, facts }` `deepStrictEqual`: `reports a decoded low verdict true, not one derived from health code 8 and low voltage false` `AssertionError [ERR_ASSERTION]`, `00000079-0000-1000-8000-0026BB765291` (`StatusLowBattery`) actual `value: 0`, expected `value: 1`; `reports a decoded low verdict false, not one derived from health code 1 and low voltage true`, the same element actual `value: 1`, expected `value: 0` | `git checkout -- src/accessories/serviceCatalogue.ts` exit 0; blob `cef0ebf54fdb34c06e069609b325db919e591718`, equal to the recorded one; `git diff --exit-code -- src/accessories/serviceCatalogue.ts` exit 0 |
| CR-05-CATALOGUE-018 (B) | The `Backup Battery Level` row maps `protectionHoursCode` through an inline band map instead of reading the decoded `levelPercent` | In `src/accessories/serviceCatalogue.ts` `batteryValues`, the `BatteryLevel` value became `new Map([[1, 25], [2, 50], [4, 75], [8, 100]]).get(numberOf(battery, 'protectionHoursCode') ?? -1)`. Blob before `cef0ebf54fdb34c06e069609b325db919e591718`, mutated `a43ef834a03646237ab4b42442c5ab778e6b72da`; `npm run build:test` exit 0 | `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 1 (195 tests, 194 pass, 1 fail; every `PROTECTION_BANDS` case passes): `publishes the decoded battery level as reported rather than the band of its protection hours code` `AssertionError [ERR_ASSERTION]` on the whole `{ battery, facts }` `deepStrictEqual`, `00000068-0000-1000-8000-0026BB765291` (`BatteryLevel`) actual `value: 100`, expected `value: 25` | `git checkout -- src/accessories/serviceCatalogue.ts` exit 0; blob `cef0ebf54fdb34c06e069609b325db919e591718`, equal to the recorded one; `git diff --exit-code -- src/accessories/serviceCatalogue.ts` exit 0; rebuilt (exit 0), the owner test passes (exit 0, 195 tests, 0 failures) |
| CR-05-CATALOGUE-019 | The `Basement Guardian Offline` row also activates on the device's own `data.offline` (`connectivity.reportedOffline`), which raises the physical-device alert on a transport hiccup | In `src/accessories/serviceCatalogue.ts` `offlineValues`, the `ContactSensorState` value became `contactState(hap, input.offlineConfirmed \|\| booleanOf(decodedGroup(input.decoded, 'connectivity'), 'reportedOffline') === true)`. Blob before `cef0ebf54fdb34c06e069609b325db919e591718`, mutated `81e9904c18554ebb52f242c15278d8c8de959e8f`; `npm run build:test` exit 0 | `node --test dist-test/test/accessories/serviceCatalogue.test.js` exit 1 (196 tests, 195 pass, 1 fail; both confirmed-offline cases and the outage case pass): `activates no Basement Guardian Offline contact from the device reporting itself offline alone` `AssertionError [ERR_ASSERTION]` on the whole-projection `deepStrictEqual`, actual `[ { uuid: '0000006A-0000-1000-8000-0026BB765291', value: 1 } ]`, expected `[ { uuid: '0000006A-0000-1000-8000-0026BB765291', value: 0 } ]` (`ContactSensorState`) | `git checkout -- src/accessories/serviceCatalogue.ts` exit 0; blob `cef0ebf54fdb34c06e069609b325db919e591718`, equal to the recorded one; `git diff --exit-code -- src/accessories/serviceCatalogue.ts` exit 0; rebuilt (exit 0), the owner test passes (exit 0, 196 tests, 0 failures) |
