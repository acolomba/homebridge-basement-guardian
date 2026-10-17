---
phase: 05-accessories-conformance
batch: DECLARATIONS
review_round: 3
reviewed: 2026-10-17T13:50:12Z
depth: deep
source_revision: 935b29044088a2fc0bd0f4e3e764dc4c21081fb7
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
  blocker: 0
  warning: 1
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 3)
---

# DECLARATIONS correction round 3 review

I read all eight files in full at `935b29044088a2fc0bd0f4e3e764dc4c21081fb7`. I did not review a
diff. I used Git only for three checks: the preservation check against the batch base
`053599a80557aa513b2d354833196408b92a4438`, the ancestry and paths of every fix commit, and the
list of changes since round 2's revision `d9ad727` (only `ae9647d` in
`test/accessories/alarmMute.test.ts` and `c88bcca` in `src/accessories/services.ts` touch a file
outside `.planning/`). The rulebooks are the three `.agents/skills/` books, which take precedence
over the `.claude/rules/` copies. I read `features/lib/hap.ts` where the tests depend on it
(`StandInCharacteristic` at 286-301 assigns the default in its base constructor; `createFakeHap` at
720-722 answers one shared object). No finding in this round depends on HAP semantics.

I checked the alarm-mute scan with read-only `node -e`/`node <scratch script>` runs of the file's
exact three patterns and predicate. The runs used synthetic strings, plus a read of `src/` that
wrote nothing. No repository file was touched.

Both opening IDs are fixed. No earlier fixed ID has reopened. One new cause, introduced by the 026
repair: CR-05-DECLARATIONS-028 (WARNING), the scan case's title.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-DECLARATIONS-026 | BLOCKER | fixed | `alarmMute.test.ts:29-39` holds three patterns (`const`/`let`/`var`/`enum` names and whole destructuring patterns; field names after `readonly`/`static`/`private`/`protected`/`public`; a line-start name that gets a value from `=`). `:59-62` `declaresMuteValue` keeps a captured name when `name.toLowerCase().includes('mute')`. Synthetic strings run through those exact patterns: flagged are `export const MUTE_DURATION_MS = 300_000;`, a function-local `const muteWindowMs = 300_000;`, `let unmuteAt = 0;`, `private readonly muteWindowSeconds = 30;`, an unmodified class field `muteWindowMs = 300_000;`, a typed field `unmuteTimer: ReturnType<typeof setTimeout> \| undefined = undefined;`, `static readonly MUTE_MS = 1;`, `enum MuteMode`, an enum member `MUTE_FIVE_MINUTES = 300,`, `const { muteWindowMs } = timings;`, `const [muteWindowMs] = values;` and a continuation declarator `  muteMs = 2;`. The three forms 026 named (`const muteDurationMs` in a function, `private readonly muteWindowSeconds`, `const unmuteValue`) are all flagged now. Over today's `src/` (43 modules), only `accessories/alarmMute.ts` is flagged (pattern 1, `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE`), so the expected value holds. The forms that stay unflagged are discussed under "Evasion forms considered and rejected" below. None is a plausible conforming form. The R2 assertion controls A, B and C (`05-DECLARATIONS-REVIEW-R2.md`) recorded the case failing for a lowerCamelCase local, an instance `readonly` field and a destructured name. |
| CR-05-DECLARATIONS-027 | WARNING | fixed | `services.ts:20-24` (overview) and `:60-68` (`NOTIFICATION_SERVICE_KINDS` JSDoc) now say that the configuration check reads the runtime list, and that the settings form keeps its own alphabetical enum in `config.schema.json`, which `test/configSchema.test.ts` pins. Checked: `src/config.ts:2, 130-131, 148` use `isNotificationServiceKind` and the list. `config.schema.json:62-79` is a hand-written alphabetical `enum`/`enumNames` pair of the same seven names. `test/configSchema.test.ts:173-200` writes those names out and pins them. The changes in `c88bcca` are comments only (the non-comment diff against the base is empty). |
| CR-05-DECLARATIONS-001 | BLOCKER | still fixed | `customCharacteristics.test.ts:65-71` (`uuid` on `CharacteristicExpectation`) and `:82-195`. A text diff of the 16 source literals against the 16 row literals is empty, in order, and no literal repeats across the 20 published identifiers. `:272-286` pins `typeUuid` and `instanceUuid` to the row literal in one value. `:304-313` compares the name-to-UUID `Map` with the table. `7bb76e6` is an ancestor. |
| CR-05-DECLARATIONS-002 | BLOCKER | still fixed | `customServices.test.ts:54-61, 68-111`: the 4 row literals equal the source literals in order. `:186` expects the row `uuid`. `:189-201` pins `typeUuid`. `:264-273` compares the map. `:277-287` compares the repeated identifiers of both factories with `[]`. `9fba016` is an ancestor. |
| CR-05-DECLARATIONS-003 | BLOCKER | still fixed | `customCharacteristics.test.ts:57-62` (`DomainExpectation`, all four members required), a `domain` on every row, `:251-270` comparing `{ displayName, format, perms, domain }` as one value, and `:389-398` comparing the literal `{ format: 'uint32', maxValue: undefined, minStep: undefined }`. `9ef87cb` is an ancestor. |
| CR-05-DECLARATIONS-004 | BLOCKER | still fixed | `customCharacteristics.test.ts:197-218`: the one commented widening builds over `NullValueCharacteristic`, which sets `value` to `null` after `super(...)`. It spreads the shared stand-in into a new object, so the shared namespace does not change. The "starts ..." cases `:326-335`, `:339-358` (literal rows 0, 1 and 1), `:360-369` and `:449-458` depend on `customCharacteristics.ts:161`. `features/lib/hap.ts` is unchanged since the base. `637da57` is an ancestor. |
| CR-05-DECLARATIONS-005 | BLOCKER | still fixed | `alarmMute.test.ts:21-23` (`SOURCE_MODULE_FLOOR = 43`; `find src -name '*.ts'` counts 43) and `:89-101`. There is no owner filter. The owning module is the expected planted positive, and the floor is compared in the same whole value. `c0a7b76` is an ancestor. |
| CR-05-DECLARATIONS-006 | WARNING | still fixed | `alarmMute.ts:1-28` and `alarmMute.test.ts:1-11` conform to D-01 (see Header inspection). `f7b6929` is an ancestor. |
| CR-05-DECLARATIONS-007 | WARNING | still fixed | `services.ts:1-27` and `services.test.ts:1-11` conform. The 027 edit lengthened the overview to line 25. Line 26 is empty. `bf0f76d` is an ancestor. |
| CR-05-DECLARATIONS-008 | WARNING | still fixed | `customCharacteristics.ts:1-38` and `customCharacteristics.test.ts:1-11` conform. `4458330` is an ancestor. |
| CR-05-DECLARATIONS-009 | WARNING | still fixed | `customServices.ts:1-51` and `customServices.test.ts:1-11` conform. `0dcd7c2` is an ancestor. |
| CR-05-DECLARATIONS-010 | WARNING | still fixed | `alarmMute.test.ts:78-84`: `// act` binds `requestedValue`, then an empty line, then `// assert`. `b8cbe8c` is an ancestor. |
| CR-05-DECLARATIONS-011 | WARNING | still fixed | `services.test.ts:57-63, 65-73, 75-88` have separate `// act` and `// assert` phases. A grep for `act & assert` in the four test files exits 1 (no match). `9cedd4d` is an ancestor. |
| CR-05-DECLARATIONS-012 | WARNING | still fixed | The case that carried the marker is gone. No marker is in `customCharacteristics.test.ts`. `7bb76e6` is an ancestor. |
| CR-05-DECLARATIONS-013 | WARNING | still fixed | The case that carried the marker is gone. No marker is in `customServices.test.ts`. `9fba016` is an ancestor. |
| CR-05-DECLARATIONS-014 | WARNING | still fixed | `customCharacteristics.test.ts:12` imports only `test`. A grep for `describe(` in the four test files exits 1. The owner run reports `suites 0`. `7cb0069` is an ancestor. |
| CR-05-DECLARATIONS-015 | WARNING | still fixed | `customServices.test.ts:12` imports only `test`, and every case is at the top level. `96d5b19` is an ancestor. |
| CR-05-DECLARATIONS-016 | WARNING | still fixed | `customCharacteristics.ts:153`: `// One class factory, so no declaration repeats a class body.`, with no count. `644df7d` is an ancestor. |
| CR-05-DECLARATIONS-017 | WARNING | still fixed | `customCharacteristics.ts:107-109` gives the rationale in the present tense. The `uint32` paragraph `:111-115` is unchanged. `a9d9c4a` is an ancestor. |
| CR-05-DECLARATIONS-018 | WARNING | still fixed | `services.ts:15-18` says that each subtype is the `ServiceKind` slug verbatim and keeps the `const enum` sentence. `dfcd547` is an ancestor. |
| CR-05-DECLARATIONS-019 | WARNING | still fixed | `customServices.ts:92-96` names the facts that are declared but not constructed, beyond the three shared characteristics. The `customServices.test.ts:167` title matches the asserted order (`:175`). `ef0db0a` is an ancestor. |
| CR-05-DECLARATIONS-020 | WARNING | still fixed | `customServices.ts:25-34` describes the restored-cache repair in the present tense, with no release narration. `5df1dff` is an ancestor. |
| CR-05-DECLARATIONS-021 | WARNING | still fixed | `ae9647d` replaced the pattern with `VALUE_DECLARATIONS` (`alarmMute.test.ts:29-39`). Its comments (`:25-28`, `:30-31`, `:33-34`, `:36-37`) state what each pattern captures. The mute condition is in the separate, named predicate `declaresMuteValue` (`:59-62`). The name and the comments match what the patterns and the predicate do. No name or comment claims that the patterns alone select alarm-mute declarations. `8d4ed4d` and `ae9647d` are ancestors. |
| CR-05-DECLARATIONS-022 | WARNING | still fixed | `alarmMute.test.ts:42-50`: `interface SourceModule`, `Promise<readonly SourceModule[]>` and `SourceModule[]`. The new `readonly RegExp[]` (`:29`) has a simple element type. ESLint exits 0. `69c7801` is an ancestor. |
| CR-05-DECLARATIONS-023 | WARNING | still fixed | `customServices.test.ts:119-135`: `NamedCharacteristic` and `PublishedType`, used as `readonly NamedCharacteristic[]` and `readonly PublishedType[]`. ESLint exits 0. `6472fa9` is an ancestor. |
| CR-05-DECLARATIONS-024 | WARNING | still fixed | `services.test.ts:20`: `const REMOVABLE_SENSOR_NAMES: readonly string[] = [...]`, with the seven literals in the same order. `960f812` is an ancestor. |
| CR-05-DECLARATIONS-025 | BLOCKER | still fixed | The `ALARM` condition is still gone. The predicate (`:61`) keeps any captured name that contains `mute`, so `export const MUTE_DURATION_MS = 300_000;` is flagged (synthetic run). `00f7bd6` is an ancestor. |

New IDs: CR-05-DECLARATIONS-028 (WARNING).

No fixed ID has reopened. All 26 distinct fix commits, `ae9647d` and `c88bcca` included, are
ancestors of HEAD. Each commit touches only its listed test or source paths plus a review report.

Counts for the coordinator: opening 2, fixed 2, rejected 0, new 1, reopened 0, closing 1.

### Evasion forms considered and rejected (alarm-mute scan)

I judged the scan against the book's standard for a source-text gate. It has a floor
(`SOURCE_MODULE_FLOOR = 43`, compared in the whole value). It has a planted positive: the owning
module's declaration must be found, so an empty read or a matcher that matches nothing fails. A
plausible wrong production implementation fails it: the conforming forms of a mute value in
another module are all flagged (see the 026 row). I ran each form below through the exact
patterns. None of them is a BLOCKER, for the reasons given:

- **A parameter, or a parameter default** (`function f(muteWindowMs = 300_000)`, arrow and
  constructor parameters, `function f({ muteWindowMs = 300_000 }: Options = {})`): not flagged.
  Rejected. A parameter with no default carries no assumption: its value comes from a caller's
  declaration, which is flagged when it has a name. The style rules allow a literal default, but
  this codebase never writes a tunable that way. All 25-odd numeric tunables under `src/` are
  named CONSTANT_CASE module constants (for example `controls.ts:199 PENDING_WINDOW_MS`,
  `accountRuntime.ts:49 REQUEST_TIMEOUT_MS`). The three parameter defaults in `src/` are `= {}` or
  `= []`. An optional dependency falls back to a named constant (`basementGuardian.ts:180
  DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT`). An author who follows these patterns writes a
  `MUTE_...` or `DEFAULT_MUTE_...` constant, and the scan flags it.
- **An object-literal key** (`const TIMINGS = { muteWindowMs: 300_000 };`, or an options object at
  a call site): not flagged. Rejected. The comment (`:27-28`) documents the exclusion, and the
  current tree forces it: `device/gemini.ts:330` (`{ muted: ... }`) and `:393`
  (`{ alarm_audio_muted: requested }`) are legitimate state and wire keys, so a scan that flagged
  keys would fail on correct code. The tunable-object pattern in this codebase names the object
  after its field (`config.ts:25 POLL_INTERVAL_BOUNDS`), so a mute bound is a `MUTE_...` constant,
  and the scan flags it.
- **A function, method or getter name** (`function muteWindowMs()`, `get muteWindowMs()`): not
  flagged. The comment documents this exclusion, and `gemini.ts:329 decodeAlarmMute` forces it. A
  getter is the style book's form over a module-local binding, and the scan flags that binding.
- **A synonym** (`ALARM_SILENCE_MS`, `quietWindowMs`): not flagged. Rejected, because a name-based
  gate cannot see a synonym. The domain's vocabulary is "mute" throughout (`alarm_audio_muted`,
  `'alarm-mute'`, `AlarmMuteState`, `PROVISIONAL_ALARM_MUTE_...`).
- **An optional class field with no initializer** (`unmuteAt?: number;`), or an `override`,
  `accessor` or `declare` field without `readonly`: not flagged. Rejected. `classes.md` requires
  that every field initializes at its declaration (the flagged form) and that a field which is
  never reassigned is `readonly` (flagged). The codebase defines no decorators or auto-accessors.
- **Several declarators on one line** (`const a = 1, muteMs = 2;`): not flagged. Rejected, because
  `modules-and-data.md` allows one variable per declaration. The multi-line form is flagged.
- **`this.unmuteAt = ...` with no field declaration**, a `catch` parameter, an import alias or a
  `using` binding: rejected. TypeScript requires the field declaration, and its conforming forms
  are flagged. The other three are not places that hold a mute assumption.
- **No in-suite positive for patterns 2 and 3 or the destructuring branch.** The owning module
  exercises only pattern 1's identifier branch, so a later edit that narrowed the other branches
  would not fail any case. I do not file this. The book's standard is met: a floor, a planted
  positive that proves the read-and-match pipeline, and plausible wrong production code that
  fails. A fixture per regex branch would guard the test against its own later edits, which is the
  meta-test the book says test modules do not need. The R2 controls A to C recorded each new
  branch failing the case.
- **False positives**: the substring rule also flags `mutex`, `commute` or `permute`, prose such
  as `// we let muted alarms ring`, and a destructuring rename such as
  `const { muted: isOn } = state` (the key is inside the captured pattern, and the comment says
  every name in the pattern counts). I do not file these. Each one fails loudly and cannot hide a
  defect. None of these words has ever appeared under `src/`: `git log --all -S mutex -- src` is
  empty, and a grep of `src/`, `test/`, `features/` and `scripts/` finds none of them.

## Findings

### CR-05-DECLARATIONS-028 - WARNING: The alarm-mute scan's title says "constant", but the case flags any mute value declaration

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments and test titles describe what the code does); `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure (title each case with a short sentence stating public behavior); `.agents/skills/typescript-style/SKILL.md` Classifying findings (test-title findings are WARNING)
**Location:** `935b29044088a2fc0bd0f4e3e764dc4c21081fb7:test/accessories/alarmMute.test.ts:89` (title); the scope it misstates is defined at `:25-39` and `:59-62`
**Issue:** The title is `is the only module under src that declares a constant governing alarm mute`. After the 026 repair (`ae9647d`), the case flags any value declaration whose name contains `mute`. That includes forms that are not constants: `let` and `var` variables (`let unmuteAt = 0;`), mutable class fields without `readonly` (`muteWindowMs = 300_000;`, `unmuteTimer: ReturnType<typeof setTimeout> | undefined = undefined;`) and `let` destructured names. The file's own vocabulary is "value": the comment at `:25` ("A module declares a mute value when ..."), the pattern list `VALUE_DECLARATIONS` and the predicate `declaresMuteValue`. The source overview (`alarmMute.ts:21-25`) lists a timer and a schedule among the things that must not exist, and a timer handle is a variable, not a constant. Suppose another module adds `let unmuteTimer = ...`. The failing case then reports that the module "declares a constant", and the reader sees no constant. A maintainer who trusts the title could narrow the scan back to constants, which reopens the class of blind spot that 026 closed. The R2 fix direction said "Keep the title". That direction predates the widened scope, and it does not make the title accurate. This is a new cause that the 026 repair introduced. It is not a reopen of 021, which concerned the pattern's name and comment.
**Fix:** Retitle the case for what it checks, in the file's own word, for example `test('is the only module under src that declares a value governing alarm mute', ...)`. Change only the title: the floor, the patterns, the predicate and the expected `{ declaring: ['accessories/alarmMute.ts'], readsTheSourceTree: true }` stay. The planning records that quote the old title in `--test-name-pattern` commands are history and need no edit. Commit as `test(alarmMute)`.
**Flags:** none. No production bug (D-04), no exported contract change (D-06), and no D-10 citation (the lines were touched only by Phase 5 repairs).

## Header inspection

D-01 layout checked: line 1 `// SPDX-License-Identifier: MIT`; line 2 empty; lines 3-5 the
copyright block ` * Copyright (c) 2026 Alessandro Colomba`; line 6 empty; line 7 `/**`; line 8
` * @fileoverview ...`; the overview closed by ` */`; then exactly one empty line and the first code
line.

- `src/accessories/alarmMute.ts`: conforms. The overview is lines 7-26, line 27 is empty, and
  line 28 opens the export's JSDoc. The module has no imports.
- `test/accessories/alarmMute.test.ts`: conforms. The overview is lines 7-9, line 10 is empty, and
  line 11 is the first import.
- `src/accessories/services.ts`: conforms. The overview is lines 7-25, line 26 is empty, and
  line 27 opens the first export's JSDoc.
- `test/accessories/services.test.ts`: conforms. The overview is lines 7-9, line 10 is empty, and
  line 11 is the first import.
- `src/accessories/customCharacteristics.ts`: conforms. The overview is lines 7-36, line 37 is
  empty, and line 38 is the import.
- `test/accessories/customCharacteristics.test.ts`: conforms. The overview is lines 7-9, line 10
  is empty, and line 11 is the first import.
- `src/accessories/customServices.ts`: conforms. The overview is lines 7-49, line 50 is empty, and
  line 51 is the first import.
- `test/accessories/customServices.test.ts`: conforms. The overview is lines 7-9, line 10 is
  empty, and line 11 is the first import.

The tracer agrees: `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

All commands ran from the repository root at HEAD `935b29044088a2fc0bd0f4e3e764dc4c21081fb7`. The
working tree was clean: `git status --porcelain` printed nothing before and after the runs. Each
command was prefixed with `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. `node --version` was
`v26.12.0` and `npm --version` was `11.20.0`. The runs took place from 2026-10-17T13:47:39Z to
2026-10-17T13:48:24Z.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | `tsc --noEmit` for `tsconfig.json` and `tsconfig.test.json`, no diagnostics |
| `node_modules/.bin/eslint src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts src/accessories/services.ts test/accessories/services.test.ts src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts src/accessories/customServices.ts test/accessories/customServices.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | `rimraf ./dist-test && tsc -p tsconfig.test.json` |
| `node --test dist-test/test/accessories/alarmMute.test.js dist-test/test/accessories/services.test.js dist-test/test/accessories/customCharacteristics.test.js dist-test/test/accessories/customServices.test.js` | 0 | tests 87, suites 0, pass 87, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` | 0 | the selector printed nothing after the npm banner |
| `npm run test:coverage:direct -- src/accessories/services.ts test/accessories/services.test.ts` | 0 | the selector printed nothing after the npm banner |
| `npm run test:coverage:direct -- src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` | 0 | the selector printed nothing after the npm banner |
| `npm run test:coverage:direct -- src/accessories/customServices.ts test/accessories/customServices.test.ts` | 0 | the selector printed nothing after the npm banner |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch DECLARATIONS` | 0 | `ACCESSORIES_HEADERS_OK files=8` |

Every required check passed, so no finding comes from a failed or missing check. The total is 87
tests: 3 alarmMute, 12 services, 47 customCharacteristics and 25 customServices. That matches
rounds 1 and 2. CR-05-DECLARATIONS-028 is a title finding, so the passing checks have no bearing
on it.

Preservation (D-05, P-05-01): I diffed the four sources against `053599a…` with comment and
blank lines filtered out, and no line differs. The 16 characteristic UUID literals and the 4
service UUID literals are byte-identical to the base, in the same order. They equal the
hand-copied test tables in order, and none of the 20 repeats. Display names, formats and domains
are unchanged. The `ServiceKind` unions are unchanged; their slugs are the subtypes. The service
kinds are unchanged, and `src/accessories/serviceCatalogue.ts` has no diff since the base.
`PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE = true` is unchanged (`alarmMute.ts:37`).

## Out-of-scope observations

- **Phase 7 (`features/lib/hap.ts`, D-12):** the four observations from rounds 0 to 2 are still
  present. No Phase 5 edit touched the file. The base `StandInCharacteristic` assigns the default
  value at line 300, which is tracked as S-05-22 (GATES). Two JSDoc blocks before
  `FakeHapStatusError` (lines 97-110) are consecutive, so the first documents nothing. Line 375
  says "fourteen near-identical class bodies", but there are 16 definitions. The file opens with
  `@fileoverview` and has no SPDX line or copyright block.
- **Phase 6 (`test/configSchema.test.ts`):** lines 175-176 still say that the order "no longer
  tracks NOTIFICATION_SERVICE_KINDS". This narrates a removed link, the same defect class as
  CR-05-DECLARATIONS-027, in a file outside this batch.

---

_Reviewed: 2026-10-17T13:50:12Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 3)_
_Depth: deep_

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action. Evidence re-read: `test/accessories/alarmMute.test.ts` (the title at line 89 says
"constant", while `VALUE_DECLARATIONS`, `declaresMuteValue` and the comment above them define the
scope as value declarations, including `let`/`var` variables and mutable fields).

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-DECLARATIONS-026 | BLOCKER | fixed | Confirmed fixed by this round. |
| CR-05-DECLARATIONS-027 | WARNING | fixed | Confirmed fixed by this round. |
| CR-05-DECLARATIONS-001 to 025 | as opened | fixed | Confirmed still fixed by this round. |
| CR-05-DECLARATIONS-028 | WARNING | open | Accepted: a new cause introduced by the 026 repair. Change only the title so it names a value, as the report says. |

The reviewer's rejected evasion forms (parameter defaults, object-literal keys, function and
method names, synonyms, style-forbidden field forms, per-branch fixtures, false positives) are
accepted as reasoned rejections; none becomes a finding.

Counter (D-03 as amended, D-18): opening 2, fixed 2, rejected 0, new 1, reopened 0, closing 1.
Closing (1) is below opening (2), no ID reopened and the round is below 10: `continue`.
