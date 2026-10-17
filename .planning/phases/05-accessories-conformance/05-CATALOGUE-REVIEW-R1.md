---
phase: 05-accessories-conformance
batch: CATALOGUE
review_round: 1
reviewed: 2026-10-17T15:14:00Z
depth: deep
source_revision: 700ce9ac61885e50bfa39d9f0e0774f6372da749
files_reviewed: 2
files_reviewed_list:
  - src/accessories/serviceCatalogue.ts
  - test/accessories/serviceCatalogue.test.ts
findings:
  blocker: 0
  warning: 1
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 1)
---

# Phase 5 CATALOGUE batch: correction round 1

I read every line of both files fresh, in full, at `700ce9ac61885e50bfa39d9f0e0774f6372da749`
(source 1050 lines, test 2516 lines). I did not review a diff. I used diffs against the batch base
`ef7578f8c86c7f7b65adc3648cd7e404cfee7d12` only for two checks after the full read: the
preservation check (D-05) and the check that each removed, split or moved case still has its
protection somewhere (P-05-03).

Inputs read: AGENTS.md; the three `.agents/skills` books (each `SKILL.md` and every `rules/*.md`
file); `05-CONTEXT.md`; `05-REVIEW-PROTOCOL.md`; the round-0 report `05-CATALOGUE-REVIEW.md`
(findings, Coordinator triage, Repair history, Assertion controls); the CATALOGUE rows of
`05-FINDINGS.md`; `features/lib/hap.ts` (read path and `getCharacteristic`); and
`@homebridge/hap-nodejs` 2.2.2 `Service.js:472-499` and `Characteristic.js:1683`.

Opening open set: 15 IDs (5 BLOCKER, 10 WARNING). Result: all 15 fixed, 1 new WARNING. Closing
count: 15 - 15 fixed - 0 rejected + 1 new + 0 reopened = 1.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-001 | WARNING | fixed | Source lines 1-30: SPDX, blank line, copyright block (3-5), blank line, `@fileoverview` (7-30), blank line, imports. Test lines 1-11: the same layout, with the overview "Tests the service catalogue rows and their publish helpers." The header tracer prints `ACCESSORIES_HEADERS_OK files=2`. |
| CR-05-CATALOGUE-002 | WARNING | fixed | `grep -n "act & assert"` finds nothing. Each former marker case now has a role-named value under `// act` (`unprojected`, `group`, `primaryRunning`, `backupActivatedAt`, `trusted`, `publishable`, `service`, `source`) and the assertion under `// assert`. The expected values match the base. |
| CR-05-CATALOGUE-003 | BLOCKER | fixed | Matrix rows at test 1096-1129 carry every group a decoded-state row reads (`water`, `pump`, `power`, `battery`, `fault`, `self-test`, `alarm-mute`). In "a group carrying none of its facts" each group is `{}`. In "facts of the wrong type" every fact each row reads is a string, including all six battery facts, all five fault facts, `running` and `muted`. The expected value is still sixteen `[]` (1141). A row that defaults a missing fact once its group decodes (`battery['low'] === true`, `On: group['running'] === true`) now projects a non-empty list and fails. The recorded control shows that failure. |
| CR-05-CATALOGUE-004 | BLOCKER | fixed | Two off-ladder cases with whole-projection `deepStrictEqual`. Test 412-428 uses `{ 31, 20, false }` and expects `[WaterLevel 20, RawWaterLevelCode 31, WaterSensorFaultReported false, StatusFault NO_FAULT]`. Test 432-442 uses `{ 1, 20, true }` and expects `[LeakDetected LEAK_DETECTED]`. A row that maps the level code through an inline ladder fails the first. A flood verdict taken from the code or from the percentage fails the second. The source-text case is retitled to what it checks: "imports nothing from the water level ladder module" (1710-1716). `src/device/waterLevel.ts` exists, so the needle `waterLevel.js` matches the real ladder module. |
| CR-05-CATALOGUE-005 | BLOCKER | fixed | "answers the same row order whatever the input carries" is gone. P-05-03: written-out literals pin the order at 1232-1259 (kinds and subtypes, 17 rows) and 1323-1350 (display names). |
| CR-05-CATALOGUE-006 | BLOCKER | fixed | (a) No "publishes an integer water level" case remains. The six ladder cases at 359-376 pin each rung as a whole projection, and 412-428 pins a level that does not follow its code (P-05-03). (b) The outage loop is now two named cases. Each compares `summarise(row.project(input))` whole: link row 1651-1668 (`[CONTACT_DETECTED, NO_FAULT, true, '']`) and offline row 1670-1681 (`[CONTACT_DETECTED]`). The `active: false` half lives at 1973-1997 (P-05-03). A link row that raises `GENERAL_FAULT` during the outage fails 1651. |
| CR-05-CATALOGUE-007 | BLOCKER | fixed | The negative at 175-176 now carries `pendingControls`, so `offlineConfirmed` is the only missing member. The positive at 168-174 has all five required members. If `offlineConfirmed` becomes optional, the `@ts-expect-error` is unused and `npm run typecheck` fails (recorded control). |
| CR-05-CATALOGUE-008 | WARNING | fixed | Source 244: `function isRowTrusted` has no `export`, and the test no longer imports it. Its four cases sit under `describe('isRowFullyTrusted')` at 1866-1912 with their expected values unchanged. The tolerated-reason and untolerated-reason halves that also asserted `row.project` are now 1683-1708 under `createServiceCatalogue`. "distrusts a two-scope row when the second scope it reads stops validating" (1829-1841) compares `isRowFullyTrusted` on the row narrowed to `readScopes: ['pump']` with the full row, `{ own: true, every: false }`. A scope-blind or tolerance-blind `isRowTrusted` still fails 1903, 1877 and 1843. The JSDoc at 229-243 describes the current caller. |
| CR-05-CATALOGUE-009 | WARNING | fixed | 12 top-level `describe()` blocks, one for each of the 12 exported functions. Every case calls the entrypoint of its `describe()`. `isRowPublishable` (1796-1815) holds only `isRowPublishable` calls. `isRowFullyTrusted` (1817-1998) holds only `isRowFullyTrusted` calls. `ensureService` holds the control/sensor case (2173) and the outage-poll case (2190). The `row.project` cases sit under `createServiceCatalogue`. The split pairs match the Repair history, with each half's expected value kept. |
| CR-05-CATALOGUE-010 | WARNING | fixed | `readOf` (2331-2342) is `async` and runs `await held.handleGetRequest()` inside its `try`. A synchronous throw (stand-in) and a rejection (real HAP, `Characteristic.js:1683` `async handleGetRequest`) both land in `threw`. The four callers (2355, 2383, 2403, 2419) are `async` and `await readOf(...)`, and their expected records are unchanged. |
| CR-05-CATALOGUE-011 | WARNING | fixed | Source 1032-1036 now says the read happens only when `testCharacteristic` finds the characteristic, so the read does not depend on `getCharacteristic` for an absent characteristic. It says real HAP adds that characteristic and the stand-in answers `undefined`. Both claims hold: `Service.js:472-499` adds the characteristic, and `features/lib/hap.ts:486-488` returns `find(...)`. Code line 1043 is unchanged. |
| CR-05-CATALOGUE-012 | WARNING | fixed | Test 739-740 reads "The record is additional and displaces nothing, so the live pump and fault values are compared against an inline list". It is present tense and has no history. |
| CR-05-CATALOGUE-013 | WARNING | fixed | (a) Test 99: "Every trust scope a row can read, so a case can untrust each scope in turn or all of them at once." The list equals the `TrustScope` union (`src/device/health.ts:33`), and its three users do exactly that (332, 1307, 1656/1674/1977/1990). (b) Test 1093-1094 now also names the control `On` cases with and without a pending request. |
| CR-05-CATALOGUE-014 | WARNING | fixed | `clearFaults()` (111-120) returns a new group on each call. All 12 uses call it (131-141, 202, 748, 986, 1007, 1028, 1574). `CLEAR_FAULTS` is gone. Each `FAULT_CASES` row is a typed `Readonly` data row that only one loop reads (962). |
| CR-05-CATALOGUE-015 | WARNING | fixed | No callback parameter is named `value`. `ProjectedValue` elements are `projectedValue` (336, 732) or `projected` (313, 317). `summarise()` elements are `published` (662, 679, 698, 717, 754-755, 792-793). |

New IDs: CR-05-CATALOGUE-016 (WARNING).

No ID was confirmed fixed in an earlier round, so nothing could reopen.

### Preservation (D-05) and removed-case protection (P-05-03)

- Source diff `ef7578f..700ce9a`: only the header lines 2-6, the `isRowTrusted` JSDoc paragraph,
  `export` dropped from `isRowTrusted`, and the `seedConfiguredName` JSDoc paragraph changed. Every
  subtype, display name, characteristic mapping, `trustedGroup`/`isRowPublishable` withholding,
  `StatusActive`/`StatusFault` projection, `alwaysPublish` flag, and the single
  `new hap.HapStatusError(status)` push in `publishPersistentFailure` (1005-1009) are
  byte-identical. The test pins the subtypes (1232-1259) and the names (1323-1350) with literals,
  and both cases pass.
- Every removed, split, moved or retitled case in the Repair history is present at the location
  the history names, with the expected value it lists. I compared the title diff (`git diff ...
  | grep test(`) with the history: 6 integer cases removed (protection at 359-376 and 412-428),
  the row-order case removed (protection at 1232-1259 and 1323-1350), the source-text case
  retitled with its assertion unchanged, and 12 split halves added (180 -> 192 cases). Each half
  keeps the assertion it carried in the combined case. No protection was lost.

## Findings

### CR-05-CATALOGUE-016 - WARNING: The second-scope loop titles its `invalid` row "publishes" while that row proves the values are withheld

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (titles describe what the code does); `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("Title each case with a short sentence stating public behavior") and Data-driven cases ("different branches ... or expectations are separate named cases")
**Location:** `700ce9ac61885e50bfa39d9f0e0774f6372da749:test/accessories/serviceCatalogue.test.ts:1606-1632`
**Issue:** The loop registers `publishes the second scope group a row reads while that scope is untrusted for ${reason}` for two rows. For `reason: 'invalid'` the case expects `fault: undefined, status: undefined` (1610, 1629). It proves that `Sump Pit Level` withholds `WaterSensorFaultReported` and `StatusFault` while the `fault` scope fails validation. So the registered title "publishes the second scope group a row reads while that scope is untrusted for invalid" says the opposite of what the case proves. The comment above the loop (1606-1607) states the rule correctly: an outage keeps the values flowing, and a validation failure withholds them. Only the title is wrong. The two rows also run opposite branches of `trustedGroup` (publish versus withhold), and the data-driven rule makes those separate named cases. A reader of the test report cannot tell from this title that `invalid` withholds. The title dates from before the batch base. CR-05-CATALOGUE-009 moved the case to `createServiceCatalogue` and kept the title, so this is a new cause, not a reopen.
**Fix:** Split the loop into two named cases and keep each row's expected value exactly:
`keeps publishing the second scope group a row reads through an outage on that scope` (`reason: 'unreachable'`, expects `{ level: 20, fault: false, status: NO_FAULT }`) and `withholds the second scope group a row reads while that scope fails validation` (`reason: 'invalid'`, expects `{ level: 20, fault: undefined, status: undefined }`). Record the retitle in the Repair history (P-05-03: same assertions, new titles). Make no source change.
**Flags:** none (CR-05-CATALOGUE-009 moved the lines, so this cites it; it is not a D-10 citation of SC-02 or CR-04-ACCOUNT)

## Candidates considered and not filed

1. **Ternary-derived expected values inside data-driven loops.** Examples: 478, 502, 524, 857,
   883, 936, 974, 997, 1087, and `reason === 'unreachable'` at 1812 ("Do not put a conditional in
   the loop body"). Not filed. Each expression maps the row's own parameter to one of two written
   constants of the same expectation shape. The arrange, act and assert steps and the dependencies
   do not branch, so the expression works like a per-row expected field. The constants are written
   apart from production, so an inverted adapter fails. Round 0 read the same lines and read the
   rule the same way. A coordinator who takes the stricter reading would need one cause for all of
   these sites, not one per site.
2. **Boolean-interpolated titles such as "faults ... from a reported water sensor fault of
   false"** (462, 508, 983, 1077). Not filed. These titles describe a mapping from the reported
   value, and both rows of each loop are asserted correctly. Unlike 1612 (CR-05-CATALOGUE-016),
   they do not claim an outcome that one row then contradicts.
3. **"projects the same values twice from one input" (1459-1473) takes its expected value from a
   second production call.** Not filed. The promise is that projection is deterministic and keeps
   no state, so it must compare two calls. A row that keeps state between calls fails it. It is not
   the case that cannot fail, as the removed row-order case was (CR-05-CATALOGUE-005).
4. **"declares every scope whose loss changes what a row publishes" (1299-1321) compares with
   `row.readScopes`.** Not filed. It checks that the declaration agrees with the projection
   behavior. Literals pin the declaration on their own at 1261-1293.
5. **Overlap after the CR-05-CATALOGUE-009 split.** 1914 ("stops vouching for a flooded pit ...")
   asserts the same thing as the `unreachable` row of 1930-1943, and its `decoded` arrange is never
   read by `isRowFullyTrusted`. 1960 nearly duplicates 1866. Not filed. Triage told the fixer to
   keep every half's assertion unchanged, both cases discriminate, and no rule forbids overlapping
   cases.
6. **`isRowTrusted` keeps a `/** */` JSDoc after it lost `export`.** Not filed. The file already
   uses JSDoc on non-exported declarations (`Candidate` 192, `PumpFacts` 198-209, `RowDefinition`
   members 185-188), and `naming-and-docs.md` does not forbid it.
7. **`RowTrust` and `ProjectedValue` are exported but only the paired test imports them**
   (`fallow dead-code --trace`, exit 0 for each, one direct reference each). Not filed. Exported
   signatures use them (`isRowPublishable`, `ServiceRow`, `ensureService`), and `tsconfig.json`
   sets `"declaration": true`, so the module must export them. They are not exported for a test.
8. **`readonly { ... }[]` with an object element type** (test 92, 263, 312) against `types.md`
   `ReadonlyArray<...>`. Not filed. The project lint preset enforces
   `@typescript-eslint/array-type` and rejects `ReadonlyArray`, and lint passes.
9. **`SEEING_LESS_REASONS: ReadonlySet<DistrustReason> = new Set<DistrustReason>(...)`** (source
   227) puts an annotation on a `new` expression. Not filed. The annotation narrows the type to the
   read-only interface, which inference cannot produce. The line is unchanged since the base.
10. **2151-2171 acts through `accessory.getServiceById` on the stand-in (D-13).** Not filed. It
    reads accessory state after two `ensureService` calls. The behavior it proves is
    `ensureService` adding two services of one subtype with different classes, which is
    production behavior and not stand-in behavior alone.
11. **The CR-05-CATALOGUE-011 JSDoc names the test stand-in in production documentation.** Not
    filed. The statement is true and in the present tense, and it gives the guard's only
    observable effect. `comments.md` asks for what the code does and why.
12. **The 2383 title says "makes a read throw" while real HAP rejects.** Not filed. "Throw" fits
    both. `readOf` now handles both forms, and the stand-in difference stays with lead S-05-23.

## Header inspection

- `src/accessories/serviceCatalogue.ts`: conforms. Line 1 `// SPDX-License-Identifier: MIT`;
  2 blank; 3-5 `/**` / ` * Copyright (c) 2026 Alessandro Colomba` / ` */`; 6 blank; 7-30
  `@fileoverview` block; 31 blank; 32 first import.
- `test/accessories/serviceCatalogue.test.ts`: conforms. Line 1 SPDX; 2 blank; 3-5 copyright
  block; 6 blank; 7-9 `@fileoverview Tests the service catalogue rows and their publish helpers.`;
  10 blank; 11 first import.
- Tracer: `ACCESSORIES_HEADERS_OK files=2`, exit 0.

## Toolchain evidence

Run from the repository root at HEAD `700ce9ac61885e50bfa39d9f0e0774f6372da749` with a clean
tree (`git status --porcelain` empty before and after). Node `v26.12.0`, npm `11.20.0`, from
2026-10-17T15:11:16Z to 2026-10-17T15:11:35Z. Every command had the prefix
`export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both `tsc --noEmit` passes clean |
| `node_modules/.bin/eslint src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | |
| `node --test dist-test/test/accessories/serviceCatalogue.test.js` | 0 | tests 192, suites 12, pass 192, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` | 0 | printed only the npm banner (100% direct pair coverage) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CATALOGUE` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

Supporting read-only commands: `node_modules/.bin/fallow dead-code --trace
src/accessories/serviceCatalogue.ts:RowTrust` and `...:ProjectedValue` (exit 0 each; candidate 7).
I ran no mutation experiment.

## Out-of-scope observations

- `features/lib/hap.ts:341-348` and `486-488` (Phase 7 under D-12, GATES parity under D-16): the
  stand-in `handleGetRequest` still throws synchronously, and `getCharacteristic` still returns
  `undefined` for an absent characteristic. Real HAP 2.2.2 is `async` (`Characteristic.js:1683`)
  and adds the characteristic (`Service.js:472-499`). Lead S-05-23 tracks both. This batch now
  handles both forms (`readOf`, and the `seedConfiguredName` guard documentation).
- No other new out-of-scope defect was observed.

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action.

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-CATALOGUE-001 to 015 | as opened | fixed | Confirmed fixed by this round. |
| CR-05-CATALOGUE-016 | WARNING | open | Accepted as the report says: split the misleading `invalid` row into its own named case. |
| CR-05-CATALOGUE-017 | WARNING | open | Coordinator-accepted from the reviewer's "Candidates considered and not filed" item 1. `.agents/skills/typescript-unit-tests/rules/cases.md` Data-driven cases says: "Do not put a conditional in the loop body; different branches, dependencies, or expectations are separate named cases." The data loops at `700ce9ac61885e50bfa39d9f0e0774f6372da749:test/accessories/serviceCatalogue.test.ts` lines 478, 502, 524, 857, 883, 936, 974, 997, 1087 and 1812 compute each row's expected value with a conditional (`x ? A : B`, `reason === 'unreachable'`) inside the loop body. Fix: carry each row's expected value as a hand-written field of the row (or split the loop into separate named cases), with no conditional in the body; keep every expected value. One cause, one commit. |

The reviewer's other candidates (items 2 to 12) are accepted as reasoned rejections.

Counter (D-03 as amended, D-18): opening 15, fixed 15, rejected 0, new 2, reopened 0, closing 2.
Closing (2) is below opening (15), no ID reopened and the round is below 10: `continue`.
