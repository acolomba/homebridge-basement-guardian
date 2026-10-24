---
phase: 05-accessories-conformance
batch: DECLARATIONS
review_round: 1
reviewed: 2026-10-17T12:40:14Z
depth: deep
source_revision: 6a769c548826e4eefdfa809a5e1721ac5224a8e2
files_reviewed: 8
files_reviewed_list:
  - src/accessories/alarmMute.ts
  - test/accessories/alarmMute.test.ts
  - src/accessories/services.ts
  - test/accessories/services.test.ts
  - src/accessories/customCharacteristics.ts
  - test/accessories/customCharacteristics.test.ts
  - src/accessories/customServices.ts
  - test/accessories/customServices.test.ts
findings:
  blocker: 1
  warning: 0
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 1)
---

# DECLARATIONS correction round 1 review

I read all eight files in full at `6a769c548826e4eefdfa809a5e1721ac5224a8e2`. I did not review a
diff. I used diffs against the round-0 base `053599a80557aa513b2d354833196408b92a4438` only for two
checks: the preservation check, and the P-05-03 check of removed and folded cases against the
base-revision test bodies. The rulebooks are the three `.agents/skills/` books, which take
precedence over the `.claude/rules/` copies. I checked HAP semantics against the pinned
`node_modules/@homebridge/hap-nodejs` 2.2.2 `dist/lib/Characteristic.js`: the base field
`value = null` is at line 1274, and the constructor at 1294-1303 assigns no default. In
`getDefaultValue` (1906-1950), the numeric order is the first `validValues` entry, then a finite
`minValue`, then 0. That order matches `features/lib/hap.ts` `getDefaultValue`.

All 24 opening IDs are fixed. One new cause was found: CR-05-DECLARATIONS-025 (BLOCKER), in the
alarm-mute scan's name filter. The filter predates the repairs, and no opening ID covers it.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-DECLARATIONS-001 | BLOCKER | fixed | `customCharacteristics.test.ts:65-71, 82-195`: each `CHARACTERISTICS` row has a hand-written `uuid`. A script extracted the 16 literals from the source and the 16 from the test: they are equal, in the same order, and all 16 are distinct. `:272-286` compares `{ typeUuid, instanceUuid, shape, appleNamespace }` with the row literal as one value. `:304-313` compares the name-to-UUID `Map` with the table. Swapped, regenerated and per-start (`randomUUID()`) identifiers now all fail. P-05-03: the 16 removed `answers the same ${name} identifier to every caller` cases are covered by the per-row literal pin, because two calls that each equal one literal agree. The old set-size case is covered by the map case over 16 distinct literals. |
| CR-05-DECLARATIONS-002 | BLOCKER | fixed | `customServices.test.ts:54-61, 68-111`: each `SERVICES` row has a hand-written `uuid`, equal to the 4 source literals in order. `:186` expects the row `uuid` and no longer reads `services[name].UUID`. `:189-201` pins `typeUuid`. `:264-273` compares the name-to-UUID map. `:277-287` compares the repeated identifiers of both factories with `[]` as one whole value. P-05-03: the 4 removed `answers the same ...` cases are covered by `:189-201`, `:178-187` and `:264-273`. |
| CR-05-DECLARATIONS-003 | BLOCKER | fixed | `customCharacteristics.test.ts:57-62` (`DomainExpectation`, every member required) and a `domain` on every row. `:251-270` compares `{ displayName, format, perms, domain }` as one value. `:389-398` compares the literal `{ format: 'uint32', maxValue: undefined, minStep: undefined }`. P-05-03: the three folded base cases (base `:188-197`, `:199-208`, `:210-222`) each compared exactly `{ minValue, maxValue, minStep, validValues }` or a subset. The per-row domain for `RawWaterLevelCode`, `BatteryHealthCode`, `ProtectionHoursCode` and every boolean row now compares all four members, so no protection is lost. |
| CR-05-DECLARATIONS-004 | BLOCKER | fixed | `customCharacteristics.test.ts:197-218`: the one commented widening, `hapNamespace()`, builds over `NullValueCharacteristic`. That class sets `value = null` after `super(...)`, as the real HAP base leaves it. It spreads the plain `HAP` object literal (`features/lib/hap.ts:688-697`), not a class instance, so the shared namespace is not mutated. The only cast is `:217` (D-11). Removing `customCharacteristics.ts:161` (`this.value = this.getDefaultValue();`) now leaves every vendor value `null`, and these cases fail: `:326-335`, `:339-358` (rows 0, 1 and 1 are written as literals, and `validValues[0]` is no longer read from production), `:360-369` and `:449-458`. The round-0 control A recorded 6 failures. `features/lib/hap.ts` is unchanged (D-12). The stand-in disagreement itself stays with S-05-22 (GATES). |
| CR-05-DECLARATIONS-005 | BLOCKER | fixed | `alarmMute.test.ts:21-23, 73-87`: there is no owner filter. The case compares `{ declaring, readsTheSourceTree: modules.length >= SOURCE_MODULE_FLOOR }` with `{ declaring: ['accessories/alarmMute.ts'], readsTheSourceTree: true }` as one value. `find src -name '*.ts' \| wc -l` is 43, which equals the floor. An empty read, a pattern that matches nothing, and a second declaring module now all fail (round-0 controls A and B). The filter is too narrow, which is a separate cause: see CR-05-DECLARATIONS-025. |
| CR-05-DECLARATIONS-006 | WARNING | fixed | `alarmMute.ts:1-27` and `alarmMute.test.ts:1-11` conform to D-01 (see Header inspection). |
| CR-05-DECLARATIONS-007 | WARNING | fixed | `services.ts:1-25` and `services.test.ts:1-11` conform. |
| CR-05-DECLARATIONS-008 | WARNING | fixed | `customCharacteristics.ts:1-38` and `customCharacteristics.test.ts:1-11` conform. |
| CR-05-DECLARATIONS-009 | WARNING | fixed | `customServices.ts:1-51` and `customServices.test.ts:1-11` conform. |
| CR-05-DECLARATIONS-010 | WARNING | fixed | `alarmMute.test.ts:62-68`: `// act` binds `requestedValue`, then an empty line, then `// assert`. |
| CR-05-DECLARATIONS-011 | WARNING | fixed | `services.test.ts:57-63, 65-73, 75-88`: each case has separate `// act` and `// assert` phases. A grep finds no `act & assert` in any of the four test files. |
| CR-05-DECLARATIONS-012 | WARNING | fixed | The case that carried the marker is removed (commit 7bb76e6). Its protection is covered as described under 001. No marker remains in `customCharacteristics.test.ts`. |
| CR-05-DECLARATIONS-013 | WARNING | fixed | The case that carried the marker is removed (commit 9fba016). Its protection is covered as described under 002. No marker remains in `customServices.test.ts`. |
| CR-05-DECLARATIONS-014 | WARNING | fixed | `customCharacteristics.test.ts:12` imports only `test`, and every case is at the top level. The owner run reports `suites 0`. |
| CR-05-DECLARATIONS-015 | WARNING | fixed | `customServices.test.ts:12` imports only `test`, and every case is at the top level. |
| CR-05-DECLARATIONS-016 | WARNING | fixed | `customCharacteristics.ts:153` reads `// One class factory, so no declaration repeats a class body.`, with no count. |
| CR-05-DECLARATIONS-017 | WARNING | fixed | `customCharacteristics.ts:107-109` gives the rationale in the present tense: each definition names its format as plain data, and the factory resolves the name. The `uint32` paragraph (`:111-115`) is unchanged. |
| CR-05-DECLARATIONS-018 | WARNING | fixed | `services.ts:15-18` says that each subtype is the `ServiceKind` slug verbatim. This matches `serviceCatalogue.ts:21, 132-133, 634` (`subtype: kind`). The `const enum` sentence is kept. |
| CR-05-DECLARATIONS-019 | WARNING | fixed | The `customServices.ts:92-96` JSDoc names the facts that are declared but not constructed, beyond the **three** shared characteristics. The `customServices.test.ts:167` title, `declares the ${name}-specific facts, then the three shared characteristics, as optional`, matches the asserted order (`:175`). |
| CR-05-DECLARATIONS-020 | WARNING | fixed | `customServices.ts:25-34` describes the restored-cache repair in the present tense, with no release narration. |
| CR-05-DECLARATIONS-021 | WARNING | fixed | `alarmMute.test.ts:25-28`: the pattern is now `CONSTANT_DECLARATION`. Its comment says that it matches any CONSTANT_CASE declaration, and that the scan keeps only the names that contain both `ALARM` and `MUTE`. That matches `:79`. |
| CR-05-DECLARATIONS-022 | WARNING | fixed | `alarmMute.test.ts:30-46`: `interface SourceModule`, `Promise<readonly SourceModule[]>` and `SourceModule[]`. |
| CR-05-DECLARATIONS-023 | WARNING | fixed | `customServices.test.ts:119-135`: `NamedCharacteristic` and `PublishedType`, used as `readonly NamedCharacteristic[]` and `readonly PublishedType[]`. ESLint on the file exits 0. |
| CR-05-DECLARATIONS-024 | WARNING | fixed | `services.test.ts:20`: `const REMOVABLE_SENSOR_NAMES: readonly string[] = [...]`, with the seven literals in the same order. |

New IDs: CR-05-DECLARATIONS-025 (BLOCKER).

No fixed ID has reopened. This is the first correction round, so there was no earlier fixed ID to
recheck.

## Findings

### CR-05-DECLARATIONS-025 - BLOCKER: The alarm-mute scan ignores a mute constant whose name does not also say ALARM

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` ("would a plausible wrong implementation still pass it?"); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: a case a wrong implementation would pass)
**Location:** `6a769c548826e4eefdfa809a5e1721ac5224a8e2:test/accessories/alarmMute.test.ts:25-28, 73-87` (the filter predicate is at line 79)
**Issue:** The case `is the only module under src that declares a constant governing alarm mute` keeps a declared CONSTANT_CASE name only when it contains both `ALARM` and `MUTE` (`name.includes('ALARM') && name.includes('MUTE')`, line 79). The alarm-mute overview (`src/accessories/alarmMute.ts:21-25`) names the assumptions this gate exists to keep out of other modules: a duration, a timer, a schedule and an unmute value. The most plausible names for those, such as `MUTE_DURATION_MS`, `MUTE_TIMEOUT_SECONDS` or `UNMUTE_VALUE`, do not contain `ALARM`. So a second module (for example `controls.ts`, the only consumer) can declare `const MUTE_DURATION_MS = 300_000;`, and the case still passes. I ran the file's exact regex and filter on synthetic strings with `node -e`, with no repository file touched. `const MUTE_DURATION_MS = 300_000;` gives `flagged: false`. `const ALARM_MUTE_SECONDS = 30;` gives `flagged: true`, and that is the only shape that round-0 control A tried. This mute is the only one in the domain: `alarm-mute` is the only mute `CoreServiceKind`. So a `MUTE` constant anywhere under `src/` is an assumption about alarm mute, which is exactly what the title says no other module declares (D-16, G-001). This cause is separate from CR-05-DECLARATIONS-005, which covered an empty read and a matcher that could never fire. It is also separate from CR-05-DECLARATIONS-021, which covered the pattern's name. The filter is unchanged from the round-0 base.
**Fix:** Keep every declared CONSTANT_CASE name that contains `MUTE`. That covers `UNMUTE` too, and the `ALARM` condition is dropped, for example `.some(([, name = '']) => name.includes('MUTE'))`. Update the comment at lines 25-27 to say that the scan keeps names that contain `MUTE`. Today the result does not change: the only CONSTANT_CASE declaration under `src/` that contains `MUTE` is `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` in `accessories/alarmMute.ts`, because `controls.ts:48, 235` only import and read it. So the expected `{ declaring: ['accessories/alarmMute.ts'], readsTheSourceTree: true }` stays as it is. Keep the title. Assertion control: add a temporary untracked `src/accessories/temporaryMuteWindow.ts` holding `export const MUTE_DURATION_MS = 300_000;`, then rebuild. The case must fail with `declaring` listing both modules. Delete the file and rebuild to GREEN.
**Flags:** none. The source is not wrong. The lines were last touched by the CR-05-DECLARATIONS-005 repair (`c0a7b76`), but the predicate is from the round-0 base, so no D-10 citation applies.

## Header inspection

D-01 layout checked: line 1 `// SPDX-License-Identifier: MIT`; line 2 empty; lines 3-5 the
copyright block; line 6 empty; line 7 `/**`; line 8 ` * @fileoverview ...`; the overview closed by
` */`; then exactly one empty line and the first code line.

- `src/accessories/alarmMute.ts`: conforms. The overview closes on line 26, line 27 is empty, and
  line 28 opens the export's JSDoc. The module has no imports.
- `test/accessories/alarmMute.test.ts`: conforms. The overview is lines 7-9, line 10 is empty, and
  line 11 is the first import.
- `src/accessories/services.ts`: conforms. The overview closes on line 23, line 24 is empty, and
  line 25 opens the first export's JSDoc.
- `test/accessories/services.test.ts`: conforms. The overview is lines 7-9, line 10 is empty, and
  line 11 is the first import.
- `src/accessories/customCharacteristics.ts`: conforms. The overview closes on line 36, line 37 is
  empty, and line 38 is the import.
- `test/accessories/customCharacteristics.test.ts`: conforms. The overview is lines 7-9, line 10
  is empty, and line 11 is the first import.
- `src/accessories/customServices.ts`: conforms. The overview closes on line 49, line 50 is empty,
  and line 51 is the first import.
- `test/accessories/customServices.test.ts`: conforms. The overview is lines 7-9, line 10 is empty,
  and line 11 is the first import.

The tracer agrees: `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

All commands ran from the repository root at HEAD `6a769c548826e4eefdfa809a5e1721ac5224a8e2`, with
a clean working tree (`git status --porcelain` printed nothing before and after). Each command was
prefixed with `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. `node --version` was
`v26.12.0` and `npm --version` was `11.20.0`. The runs took place from 2026-10-17T12:38:49Z to
2026-10-17T12:39:34Z.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | `tsc --noEmit` for `tsconfig.json` and `tsconfig.test.json`, no diagnostics |
| `node_modules/.bin/eslint src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts src/accessories/services.ts test/accessories/services.test.ts src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts src/accessories/customServices.ts test/accessories/customServices.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | `rimraf ./dist-test && tsc -p tsconfig.test.json` |
| `node --test dist-test/test/accessories/alarmMute.test.js dist-test/test/accessories/services.test.js dist-test/test/accessories/customCharacteristics.test.js dist-test/test/accessories/customServices.test.js` | 0 | tests 87, suites 0, pass 87, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` | 0 | the selector printed nothing |
| `npm run test:coverage:direct -- src/accessories/services.ts test/accessories/services.test.ts` | 0 | the selector printed nothing |
| `npm run test:coverage:direct -- src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` | 0 | the selector printed nothing |
| `npm run test:coverage:direct -- src/accessories/customServices.ts test/accessories/customServices.test.ts` | 0 | the selector printed nothing |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch DECLARATIONS` | 0 | `ACCESSORIES_HEADERS_OK files=8` |

Every required check passed, so no finding comes from a failed or missing check. The total is 87
tests: 3 alarmMute, 12 services, 47 customCharacteristics and 25 customServices. That matches the
last counts in the repair history. The passing checks do not clear CR-05-DECLARATIONS-025: that
defect is a false negative that no current input exercises.

Preservation (D-05, P-05-01): I diffed the four sources against `053599a…` with comment and
blank lines filtered out, and no line changed. Every source change is a header or a comment line.
The 16 characteristic UUID literals and the 4 service UUID literals are byte-identical. Display
names, formats, domains, `ServiceKind` slugs, subtypes and
`PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE = true` are unchanged. All 22 distinct fix commits are
ancestors of HEAD, and each touches only its listed paths plus the round-0 report.

## Out-of-scope observations

- **Phase 7 (`features/lib/hap.ts`, D-12):** the four observations from round 0 are still present.
  The base `StandInCharacteristic` assigns the default at line 300, which is now tracked as S-05-22
  (GATES). The JSDoc blocks before `FakeHapStatusError` are doubled (lines 97-110). The comment at
  line 375 says "fourteen near-identical class bodies", but there are 16 definitions. The file has
  no SPDX line or copyright header. No Phase 5 edit touched the file.

---

_Reviewed: 2026-10-17T12:40:14Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 1)_
_Depth: deep_

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action. The coordinator re-ran the file's exact `CONSTANT_DECLARATION` regex and filter on
`const MUTE_DURATION_MS = 300_000;` (not flagged) and `const ALARM_MUTE_SECONDS = 30;` (flagged),
and confirmed that `src/accessories/alarmMute.ts:21-23` names a duration, a timer and an unmute
value as what must not exist, and that `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` is today the only
CONSTANT_CASE `MUTE` declaration under `src/`.

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-DECLARATIONS-001 to 024 | as opened | fixed | Confirmed fixed by this independent round. |
| CR-05-DECLARATIONS-025 | BLOCKER | open | A new cause (it predates the repairs; not a reopen of 005 or 021). Fix as the report says: keep every CONSTANT_CASE name that contains `MUTE`, keep the expected `['accessories/alarmMute.ts']`, and correct the pattern's comment to match. Control: plant a temporary module declaring `MUTE_DURATION_MS` and observe the case fail, then delete it. |

Counter (D-03 as amended, D-18): opening 24, fixed 24, rejected 0, new 1, reopened 0, closing 1.
The round has open findings, closing (1) is below opening (24), no ID reopened and the round is
below 10, so the result is `continue`.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-DECLARATIONS-025 | `test/accessories/alarmMute.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/alarmMute.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/alarmMute.test.js` exit 0 (3 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` exit 0 (no output from the selector); `node_modules/.bin/eslint test/accessories/alarmMute.test.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | see ## Assertion controls | the filter keeps every declared CONSTANT_CASE name that contains `MUTE` (`.some(([, name = '']) => name.includes('MUTE'))`), so the `ALARM` condition is gone; the `CONSTANT_DECLARATION` comment says so; the title, `SOURCE_MODULE_FLOOR = 43` and the expected `{ declaring: ['accessories/alarmMute.ts'], readsTheSourceTree: true }` are unchanged |

## Assertion controls

| ID | Control | Plausible wrong behavior | Mutation | Blob before | Failing assertion of the named case | Blob after, restoration |
| --- | --- | --- | --- | --- | --- | --- |
| CR-05-DECLARATIONS-025 | A | A second module under `src/` declares its own mute duration, a name without `ALARM` | With the fix in the working tree (`test/accessories/alarmMute.test.ts` blob `06323345b87bbb1ab890e2eb647dec293d9267e2`), a temporary untracked `src/accessories/temporaryMuteControl.ts` holding `export const MUTE_DURATION_MS = 300_000;` (blob `eb81c2d0850202fbd07bd23940ffa666c7b56d71`); `npm run build:test` exit 0. Before the edit, the same planted file and build let the case pass (exit 0, 1 test, 0 failures) on the committed blob `6db988bc6a136f896cdb1c6d8eb4ff9755054d4b`. A `node -e` run of the old and new predicates on `export const MUTE_DURATION_MS = 300_000;` gave `oldFlagged: false`, `fixedFlagged: true` | `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0` | `node --test --test-name-pattern='is the only module under src that declares a constant governing alarm mute' dist-test/test/accessories/alarmMute.test.js` exit 1 (1 test, 1 failure): `AssertionError [ERR_ASSERTION]`, actual `{ declaring: [ 'accessories/alarmMute.ts', 'accessories/temporaryMuteControl.ts' ], readsTheSourceTree: true }`, expected `{ declaring: [ 'accessories/alarmMute.ts' ], readsTheSourceTree: true }` | File deleted; `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0`, equal to the recorded blob; `git diff --exit-code -- src` exit 0; rebuilt (exit 0), the case passes (exit 0) |
