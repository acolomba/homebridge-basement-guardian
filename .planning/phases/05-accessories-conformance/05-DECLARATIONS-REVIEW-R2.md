---
phase: 05-accessories-conformance
batch: DECLARATIONS
review_round: 2
reviewed: 2026-10-17T12:53:07Z
depth: deep
source_revision: d9ad7272c514a6be2f244a1815266c771b68b57d
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
  warning: 1
  total: 2
status: issues_found
reviewer: gsd-code-reviewer (correction round 2)
---

# DECLARATIONS correction round 2 review

I read all eight files in full at `d9ad7272c514a6be2f244a1815266c771b68b57d`. I did not review a
diff. I used diffs only for three checks: the preservation check against the batch base
`053599a80557aa513b2d354833196408b92a4438`, the content of the 025 fix commit `00f7bd6`, and the
ancestry of every fix commit. The rulebooks are the three `.agents/skills/` books, which take
precedence over the `.claude/rules/` copies. HAP semantics were checked against the pinned
`node_modules/@homebridge/hap-nodejs` 2.2.2: `Characteristic.js` (`setProps` keeps the caller's
`perms` array by reference at 1377-1379; a string update is cut to `maxLen`, default 64, at
2163-2166) and `Service.js` (a display name adds `Name` first, at 377-383). The stand-in
`features/lib/hap.ts` was read where the tests depend on it (`StandInCharacteristic` 286-345 keeps
`props` by reference; `createFakeHap` 720-722 answers one shared plain object literal).

CR-05-DECLARATIONS-025 is fixed. No earlier fixed ID has reopened. Two new causes were found:
CR-05-DECLARATIONS-026 (BLOCKER), a second blind spot of the alarm-mute scan, and
CR-05-DECLARATIONS-027 (WARNING), a false claim in `services.ts` about the settings form. Both
predate the repairs. Neither is the defect of an earlier ID.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-DECLARATIONS-025 | BLOCKER | fixed | `alarmMute.test.ts:79` keeps every captured name that contains `MUTE` (`.some(([, name = '']) => name.includes('MUTE'))`), and the `ALARM` condition is gone. The comment at `:25-27` says this, with `UNMUTE` included. The title, `SOURCE_MODULE_FLOOR = 43` and the expected `{ declaring: ['accessories/alarmMute.ts'], readsTheSourceTree: true }` are unchanged. I ran the file's exact regex and predicate with `node -e` on synthetic strings only: `export const MUTE_DURATION_MS = 300_000;`, `const UNMUTE_VALUE = false;` and `static readonly MUTE_WINDOW_SECONDS = 30;` are each flagged. `find src -name '*.ts'` counts 43. The only declaration under `src/` whose name contains `mute` in any case is `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` (`alarmMute.ts:37`), so the expected value is right. The scan's separate CONSTANT_CASE-only capture is a new cause: see CR-05-DECLARATIONS-026. |
| CR-05-DECLARATIONS-001 | BLOCKER | still fixed | `customCharacteristics.test.ts:65-71, 82-195`: each row has a hand-written `uuid`. A script found the 16 test literals equal to the 16 source literals, in order, and all distinct. `:272-286` pins `typeUuid` and `instanceUuid` to the row literal in one value. `:304-313` compares the name-to-UUID `Map` with the table. Fix commit `7bb76e6` is an ancestor of HEAD. |
| CR-05-DECLARATIONS-002 | BLOCKER | still fixed | `customServices.test.ts:54-61, 68-111`: each row has a hand-written `uuid`, equal to the 4 source literals in order. `:186` expects the row literal. `:189-201` pins `typeUuid`. `:264-273` compares the map. `:277-287` compares the repeated identifiers of both factories with `[]`. All 20 identifiers are distinct. `9fba016` is an ancestor. |
| CR-05-DECLARATIONS-003 | BLOCKER | still fixed | `customCharacteristics.test.ts:57-62` (`DomainExpectation`, all four members required), a `domain` on every row, `:251-270` comparing `{ displayName, format, perms, domain }` as one value, and `:389-398` comparing the literal `{ format: 'uint32', maxValue: undefined, minStep: undefined }`. `9ef87cb` is an ancestor. |
| CR-05-DECLARATIONS-004 | BLOCKER | still fixed | `customCharacteristics.test.ts:197-218`: the one commented widening builds over `NullValueCharacteristic`, which sets `value` to `null` after `super(...)`, as the real HAP base leaves it. It spreads the shared plain `HAP` object into a new object, so the shared namespace is not changed. The "starts ..." cases `:326-335`, `:339-358` (literal rows 0, 1 and 1), `:360-369` and `:449-458` depend on `customCharacteristics.ts:161`. `features/lib/hap.ts` is unchanged. `637da57` is an ancestor. |
| CR-05-DECLARATIONS-005 | BLOCKER | still fixed | `alarmMute.test.ts:21-23, 73-87`: no owner filter; the owning module is the expected planted positive; the floor is compared in the same whole value. `c0a7b76` is an ancestor. |
| CR-05-DECLARATIONS-006 | WARNING | still fixed | `alarmMute.ts:1-28` and `alarmMute.test.ts:1-11` conform to D-01 (see Header inspection). `f7b6929` is an ancestor. |
| CR-05-DECLARATIONS-007 | WARNING | still fixed | `services.ts:1-25` and `services.test.ts:1-11` conform. `bf0f76d` is an ancestor. |
| CR-05-DECLARATIONS-008 | WARNING | still fixed | `customCharacteristics.ts:1-38` and `customCharacteristics.test.ts:1-11` conform. `4458330` is an ancestor. |
| CR-05-DECLARATIONS-009 | WARNING | still fixed | `customServices.ts:1-51` and `customServices.test.ts:1-11` conform. `0dcd7c2` is an ancestor. |
| CR-05-DECLARATIONS-010 | WARNING | still fixed | `alarmMute.test.ts:62-68`: `// act` binds `requestedValue`, then an empty line, then `// assert`. `b8cbe8c` is an ancestor. |
| CR-05-DECLARATIONS-011 | WARNING | still fixed | `services.test.ts:57-63, 65-73, 75-88`: separate `// act` and `// assert` phases in each case. A grep for `act & assert` in the four test files finds nothing (exit 1). `9cedd4d` is an ancestor. |
| CR-05-DECLARATIONS-012 | WARNING | still fixed | The case that carried the marker is gone, and no marker is in `customCharacteristics.test.ts`. `7bb76e6` is an ancestor. |
| CR-05-DECLARATIONS-013 | WARNING | still fixed | The case that carried the marker is gone, and no marker is in `customServices.test.ts`. `9fba016` is an ancestor. |
| CR-05-DECLARATIONS-014 | WARNING | still fixed | `customCharacteristics.test.ts:12` imports only `test`. A grep for `describe(` in the four test files finds nothing. The owner run reports `suites 0`. `7cb0069` is an ancestor. |
| CR-05-DECLARATIONS-015 | WARNING | still fixed | `customServices.test.ts:12` imports only `test`, and every case is at the top level. `96d5b19` is an ancestor. |
| CR-05-DECLARATIONS-016 | WARNING | still fixed | `customCharacteristics.ts:153`: `// One class factory, so no declaration repeats a class body.`, with no count. `644df7d` is an ancestor. |
| CR-05-DECLARATIONS-017 | WARNING | still fixed | `customCharacteristics.ts:107-109` gives the present-tense rationale; the `uint32` paragraph `:111-115` is unchanged. `a9d9c4a` is an ancestor. |
| CR-05-DECLARATIONS-018 | WARNING | still fixed | `services.ts:15-18` says each subtype is the `ServiceKind` slug verbatim and keeps the `const enum` sentence. `dfcd547` is an ancestor. The false settings-form claim in the same overview (`:20-22`) is a different sentence and a different cause: see CR-05-DECLARATIONS-027. |
| CR-05-DECLARATIONS-019 | WARNING | still fixed | `customServices.ts:92-96` names the facts declared but not constructed, beyond the three shared characteristics. The `customServices.test.ts:167` title matches the asserted order (`:175`). `ef0db0a` is an ancestor. |
| CR-05-DECLARATIONS-020 | WARNING | still fixed | `customServices.ts:25-34` states the restored-cache repair in the present tense, with no release narration. `5df1dff` is an ancestor. |
| CR-05-DECLARATIONS-021 | WARNING | still fixed | `alarmMute.test.ts:25-28`: the pattern is `CONSTANT_DECLARATION`, and its comment says it matches any CONSTANT_CASE declaration and what the scan keeps. The comment matches `:79`. `8d4ed4d` is an ancestor. |
| CR-05-DECLARATIONS-022 | WARNING | still fixed | `alarmMute.test.ts:30-46`: `interface SourceModule`, `Promise<readonly SourceModule[]>` and `SourceModule[]`. `69c7801` is an ancestor. |
| CR-05-DECLARATIONS-023 | WARNING | still fixed | `customServices.test.ts:119-135`: `NamedCharacteristic` and `PublishedType`, used as `readonly NamedCharacteristic[]` and `readonly PublishedType[]`. ESLint on the file exits 0. `6472fa9` is an ancestor. |
| CR-05-DECLARATIONS-024 | WARNING | still fixed | `services.test.ts:20`: `const REMOVABLE_SENSOR_NAMES: readonly string[] = [...]`, with the seven literals in the same order. `960f812` is an ancestor. |

New IDs: CR-05-DECLARATIONS-026 (BLOCKER), CR-05-DECLARATIONS-027 (WARNING).

No fixed ID has reopened. All 23 distinct fix commits, `00f7bd6` included, are ancestors of HEAD,
and each touches only its test or source paths plus a review report. Since round 1's source
revision `6a769c5`, the only change outside `.planning/` is `00f7bd6` in
`test/accessories/alarmMute.test.ts`: the comment at lines 26-27 and the predicate at line 79.

Counts for the coordinator: opening 1, fixed 1, rejected 0, new 2, reopened 0, closing 2.

## Findings

### CR-05-DECLARATIONS-026 - BLOCKER: The alarm-mute scan cannot see a mute constant written in lowerCamelCase

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` ("would a plausible wrong implementation still pass it?"); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: a case a wrong implementation would pass); `.agents/skills/typescript-style/rules/naming-and-docs.md` Naming ("`CONSTANT_CASE` only for a value that exists once per program; a function-local is `lowerCamelCase`")
**Location:** `d9ad7272c514a6be2f244a1815266c771b68b57d:test/accessories/alarmMute.test.ts:25-28, 70-87` (the capture group is at line 28, and the predicate is at line 79)
**Issue:** The case `is the only module under src that declares a constant governing alarm mute` captures a declared name only when it is CONSTANT_CASE (`([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)\b`, line 28). It then keeps the names that contain `MUTE` (line 79). The project's naming rule makes CONSTANT_CASE wrong for two of the three places a mute assumption is most likely to appear. A constant declared inside a function must be lowerCamelCase. An instance `readonly` field is also lowerCamelCase: the table limits CONSTANT_CASE to module-level constants, `static readonly` fields and enum members. The regex lists `readonly`, so it is meant to cover class fields, but it sees only the static ones. `controls.ts` is the only consumer of this module, and it handles mute in plain functions (`controls.ts:232-240`). A conforming edit such as `const muteWindowMs = 300_000;` inside its write handler, or `private readonly muteWindowSeconds = 30;` on a class, therefore passes this case. That is exactly what the comment at lines 70-72 says must not exist: another module declaring "an assumption of its own about mute (D-16)". The source overview (`alarmMute.ts:21-25`) names a duration, a timer, a schedule and an unmute value as such assumptions. I ran the file's exact regex and predicate with `node -e` on synthetic strings, and no repository file was touched. `function handleMute() { const muteDurationMs = 300_000; }`, `private readonly muteWindowSeconds = 30;` and `const unmuteValue = false;` each give `flagged: false`. `export const MUTE_DURATION_MS = 300_000;` and `static readonly MUTE_WINDOW_SECONDS = 30;` give `flagged: true`. This cause is not CR-05-DECLARATIONS-025. That ID was about the `ALARM` condition in the name filter, and its fix (keep every CONSTANT_CASE name that contains `MUTE`) is complete. The CONSTANT_CASE-only capture group has not changed since the batch base, and CR-05-DECLARATIONS-021 only documented it.
**Fix:** Capture any declared identifier and match `mute` case-insensitively, for example `const DECLARATION = /\b(?:const|let|var|readonly)\s+([A-Za-z_$][\w$]*)/g;` with `.some(([, name = '']) => /mute/i.test(name))`. Rename the pattern for what it now matches, and update the comment at lines 25-27 to say that the scan keeps every declared name containing `mute` in any case, with lowerCamelCase locals and instance fields included. The expected value does not change today: a grep of `src/` for any `const`, `let`, `var` or `readonly` declaration whose name contains `mute` in any case finds only `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` in `accessories/alarmMute.ts`. If a broad match would also catch a derived read such as `const muted = reported.alarmAudioMuted`, keep only declarations initialized by a literal (a number, boolean or string), and state that limit in the comment. Keep the title, the floor and the expected value. Assertion control: add a temporary untracked `src/accessories/temporaryMuteWindow.ts` that holds `export function muteWindow(): number { const muteWindowMs = 300_000; return muteWindowMs; }`, rebuild, and observe the case fail with `declaring` listing both modules. Then delete the file and rebuild to GREEN.
**Flags:** none. The production module is not wrong. The lines were last touched by the CR-05-DECLARATIONS-025 repair (`00f7bd6`) and the CR-05-DECLARATIONS-021 repair (`8d4ed4d`), but the capture group is from the round-0 base, so this is a new cause and not a reopen. No D-10 citation applies.

### CR-05-DECLARATIONS-027 - WARNING: services.ts says the settings form reads the runtime notification list, but the form has its own hand-written copy

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does; no narration of code that no longer exists; restate the rationale as a present-tense fact)
**Location:** `d9ad7272c514a6be2f244a1815266c771b68b57d:src/accessories/services.ts:20-22, 58-64`
**Issue:** The overview (lines 20-22) says that "the configuration check and the shipped settings form both read them at run time". The `NOTIFICATION_SERVICE_KINDS` JSDoc (lines 61-63) says: "This is the one runtime source the configuration refusal and the shipped settings-form enum both trace to, so neither can offer a name the type does not declare." Only the configuration refusal uses this list (`src/config.ts:2, 131`, through `isNotificationServiceKind` and the list itself). The shipped settings form is the static `config.schema.json:62-79`. It holds its own `enum` and `enumNames`, written by hand and sorted alphabetically, not in declaration order. No module, script or test ties that `enum` to this list. A grep of `scripts/`, `src/`, `features/` and `test/` finds no reader of `NOTIFICATION_SERVICE_KINDS` for the schema. The schema's own test says the reverse of this comment (`test/configSchema.test.ts:173-177`): the names are "written out here rather than imported from NOTIFICATION_SERVICE_KINDS", and the order "no longer tracks NOTIFICATION_SERVICE_KINDS ... so the two are free to differ". So the comment describes a link that no longer exists. The guarantee it states is also false for the form: an edit that changes `config.schema.json` together with `configSchema.test.ts` can offer a name the type does not declare, and no case in this pair or in that test fails. A maintainer who trusts this JSDoc would believe a new notification name reaches the form by itself, or that the form cannot drift.
**Fix:** Restate both passages as present-tense facts. Overview, for example: `The removable notification names appear twice, once as a type and once as a runtime list, because an administrator supplies them as text and the configuration check reads them at run time.` JSDoc, for example: `The removable notification names, in the order the type declares them. The configuration refusal checks each supplied name against this list. The shipped settings form keeps its own copy in \`config.schema.json\`, sorted for a person to read, and its test pins that copy.` Change only comments: `docs(services)`.
**Flags:** none

## Header inspection

D-01 layout checked: line 1 `// SPDX-License-Identifier: MIT`; line 2 empty; lines 3-5 the
copyright block ` * Copyright (c) 2026 Alessandro Colomba`; line 6 empty; line 7 `/**`; line 8
` * @fileoverview ...`; the overview closed by ` */`; then exactly one empty line and the first code
line.

- `src/accessories/alarmMute.ts`: conforms. The overview is lines 7-26, line 27 is empty, and
  line 28 opens the export's JSDoc. The module has no imports.
- `test/accessories/alarmMute.test.ts`: conforms. The overview is lines 7-9, line 10 is empty, and
  line 11 is the first import.
- `src/accessories/services.ts`: conforms. The overview is lines 7-23, line 24 is empty, and
  line 25 opens the first export's JSDoc.
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

All commands ran from the repository root at HEAD `d9ad7272c514a6be2f244a1815266c771b68b57d`. The
working tree was clean (`git status --porcelain` printed nothing before and after the runs). Each
command was prefixed with `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. `node --version` was
`v26.12.0` and `npm --version` was `11.20.0`. The runs took place from 2026-10-17T12:51:59Z to
2026-10-17T12:52:41Z.

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
round 1. The passing checks do not clear CR-05-DECLARATIONS-026: that defect is a false negative
that no current input exercises.

Preservation (D-05, P-05-01): I diffed the four sources against `053599a…` and dropped comment and
blank lines. No code line changed. The 16 characteristic UUID literals and the 4 service UUID
literals are byte-identical to the base, in the same order. Display names, formats, domains,
`ServiceKind` slugs (the subtypes), service kinds and
`PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE = true` are unchanged.

## Out-of-scope observations

- **Phase 7 (`features/lib/hap.ts`, D-12):** the four observations from rounds 0 and 1 are still
  present. The base `StandInCharacteristic` assigns the default value at line 300; that is
  tracked as S-05-22 (GATES). The JSDoc blocks before `FakeHapStatusError` are doubled. The
  comment at line 375 gives a count of fourteen class bodies, but there are 16 definitions. The
  file has no SPDX line or copyright header. No Phase 5 edit touched the file.
- **Phase 6, root module tests (`test/configSchema.test.ts`):** the comment at lines 173-177 says that the order "no
  longer tracks NOTIFICATION_SERVICE_KINDS". That is narration of a removed link, the same class of
  defect as CR-05-DECLARATIONS-027, in a file outside this batch.

---

_Reviewed: 2026-10-17T12:53:07Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 2)_
_Depth: deep_

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action. Evidence re-read: `src/accessories/services.ts:20-22` and `:58-64` against
`config.schema.json:62-79` (a hand-written alphabetical enum, not generated from
`NOTIFICATION_SERVICE_KINDS`) and `test/configSchema.test.ts:173-177`; and
`.agents/skills/typescript-style/rules/naming-and-docs.md` Naming (`CONSTANT_CASE` only for a
module-level constant or `static readonly` field; a function-local constant is `lowerCamelCase`),
which makes a function-local or instance mute constant a plausible form the CONSTANT_CASE-only
capture cannot see.

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-DECLARATIONS-025 | BLOCKER | fixed | Confirmed fixed by this round. |
| CR-05-DECLARATIONS-001 to 024 | as opened | fixed | Confirmed still fixed by this round. |
| CR-05-DECLARATIONS-026 | BLOCKER | open | Accepted: a new cause (the CONSTANT_CASE capture predates the repairs; not 025's remainder). |
| CR-05-DECLARATIONS-027 | WARNING | open | Accepted: a new cause in comments present at the batch base. |

Counter (D-03 as amended, D-18): opening 1, fixed 1, rejected 0, new 2, reopened 0, closing 2.
The round has open findings and closing (2) is not below opening (1), so the result is
`STOP: no progress`. Per the protocol the counter row stays uncommitted, nothing else runs, and
the plan ends with a blocking report until a maintainer resolution is recorded in the STOP cell.

Maintainer resolution (2026-10-17): "Resolve and continue". The STOP cell reads
`STOP: no progress; resolved by maintainer`; 026 and 027 are repaired before correction round 3.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-DECLARATIONS-026 | `test/accessories/alarmMute.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/alarmMute.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/alarmMute.test.js` exit 0 (3 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` exit 0 (no output from the selector); `node_modules/.bin/eslint test/accessories/alarmMute.test.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | see ## Assertion controls | `CONSTANT_DECLARATION` is replaced by `VALUE_DECLARATIONS`, three patterns read by the predicate `declaresMuteValue`, which keeps a captured name when `name.toLowerCase().includes('mute')`. The patterns capture the name after `const`, `let`, `var`, `enum` (and `const enum`), a whole destructuring pattern, a field name after `readonly`, `static`, `private`, `protected` or `public` (not a method), and a name at the start of a line that gets a value from `=` (a class field with no modifier). Type names, function and method names, object-literal keys and string literals stay out, and the comment says so. Read-only evidence before the edit: the same three patterns over the 43 `.ts` modules of `src/` keep only `accessories/alarmMute.ts` (`PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE`). `interface AlarmMuteState`, its member `muted`, `function decodeAlarmMute`, the keys `muted` and `alarm_audio_muted`, and the literals `'alarm-mute'` and `'alarm_audio_muted'` are not kept. Synthetic strings checked with `node -e`: 21 in-scope forms are flagged and 9 out-of-scope forms are not. The title, `SOURCE_MODULE_FLOOR = 43` and the expected `{ declaring: ['accessories/alarmMute.ts'], readsTheSourceTree: true }` are unchanged |

## Assertion controls

| ID | Control | Plausible wrong behavior | Mutation | Blob before | Failing assertion of the named case | Blob after, restoration |
| --- | --- | --- | --- | --- | --- | --- |
| CR-05-DECLARATIONS-026 | A | A second module under `src/` declares a mute window as a function-local constant, in lowerCamelCase | With the fix in the working tree (`test/accessories/alarmMute.test.ts` blob `1a10fd02b529ac0e966de1567a0576c5ffd283d1`, the committed bytes; the three controls first ran, with the same results, on the blob `4534f2c661db6d00ae5f99471d531f58e1001eb9` before Prettier joined the `declaring` chain onto one line), a temporary untracked `src/accessories/temporaryMuteControl.ts` holding `export function windowFor(): number { const muteWindowMs = 300_000; return muteWindowMs; }` (blob `a198d9b5f5f3fc1b93d4024d782023b57102d336`); `npm run build:test` exit 0. A `node -e` run of the old CONSTANT_CASE pattern and predicate on the same text gave `oldFlagged: false` | `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0` | `node --test --test-name-pattern='is the only module under src that declares a constant governing alarm mute' dist-test/test/accessories/alarmMute.test.js` exit 1 (1 test, 1 failure): `AssertionError [ERR_ASSERTION]`, actual `{ declaring: [ 'accessories/alarmMute.ts', 'accessories/temporaryMuteControl.ts' ], readsTheSourceTree: true }`, expected `{ declaring: [ 'accessories/alarmMute.ts' ], readsTheSourceTree: true }` | File deleted; `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0`, equal to the recorded blob; `git diff --exit-code -- src` exit 0 |
| CR-05-DECLARATIONS-026 | B | A second module under `src/` declares a mute window as an instance `readonly` field, in lowerCamelCase | Same fixed test blob; the temporary file holds `export class MuteTimer { private readonly muteWindowSeconds = 30; read(): number { return this.muteWindowSeconds; } }` (blob `cb2d8667900aff9f517099a3f7c173760c72701b`); `npm run build:test` exit 0. The old pattern gave `oldFlagged: false` | `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0` | Same command, exit 1 (1 test, 1 failure): `AssertionError [ERR_ASSERTION]`, actual `{ declaring: [ 'accessories/alarmMute.ts', 'accessories/temporaryMuteControl.ts' ], readsTheSourceTree: true }`, expected `{ declaring: [ 'accessories/alarmMute.ts' ], readsTheSourceTree: true }` | File deleted; `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0`; `git diff --exit-code -- src` exit 0 |
| CR-05-DECLARATIONS-026 | C | A second module under `src/` declares a mute window through a destructuring pattern | Same fixed test blob; the temporary file holds `const timings = { muteWindowMs: 300_000 }; export const { muteWindowMs } = timings;` (blob `7fe132276375ff9cedf2f03f8307ba4910a2505b`); `npm run build:test` exit 0. The old pattern gave `oldFlagged: false` | `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0` | Same command, exit 1 (1 test, 1 failure): `AssertionError [ERR_ASSERTION]`, actual `{ declaring: [ 'accessories/alarmMute.ts', 'accessories/temporaryMuteControl.ts' ], readsTheSourceTree: true }`, expected `{ declaring: [ 'accessories/alarmMute.ts' ], readsTheSourceTree: true }` | File deleted; `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0`; `git diff --exit-code -- src` exit 0; after the three controls, rebuilt (exit 0), the case passes (exit 0) |
