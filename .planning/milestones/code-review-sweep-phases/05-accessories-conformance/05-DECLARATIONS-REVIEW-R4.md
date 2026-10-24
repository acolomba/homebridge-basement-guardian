---
phase: 05-accessories-conformance
batch: DECLARATIONS
review_round: 4
reviewed: 2026-10-17T13:58:30Z
depth: deep
source_revision: 6fcd1c3aa8f98f9a2e02d1d351c62087b348668f
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
  warning: 0
  total: 0
status: clean
reviewer: gsd-code-reviewer (correction round 4)
---

# DECLARATIONS correction round 4 review

I read all eight files in full at `6fcd1c3aa8f98f9a2e02d1d351c62087b348668f`. I did not review a
diff. I used Git for four checks only:

- the preservation check against the batch base `053599a80557aa513b2d354833196408b92a4438`;
- the ancestry of every fix commit;
- the content of the 028 fix commit `bd39257`;
- the list of changes since round 3's revision `935b290`. Outside `.planning/`, the only change is
  `bd39257`, one line in `test/accessories/alarmMute.test.ts`.

The rulebooks are the three `.agents/skills/` books, with every file in their `rules/`
directories. They take precedence over the `.claude/rules/` copies. I read `features/lib/hap.ts`
where the tests depend on it. `StandInCharacteristic` (286-301) keeps `props` by reference, and
its base constructor assigns the default. I read the pinned
`node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js` for the base constructor
(1294-1303: no default is assigned) and for `setProps` (1377-1379: `perms` is kept by reference).

I checked these cross-file claims made by comments in the batch against the current tree, and
each one holds:

- `ensureService` gates on `projected.length` (`serviceCatalogue.ts:921-929`).
- The repair guard `declareCharacteristic` exists (`serviceCatalogue.ts:950-962`).
- No set handler is registered on `ConfiguredName`: the only `onSet` calls are on `On` in
  `controls.ts`.
- The settings form keeps an alphabetical `enum`/`enumNames` pair of the same seven names
  (`config.schema.json:62-79`).
- The "fidelity case" named at `customCharacteristics.test.ts:385-388` exists:
  `hapWriteFidelity.test.ts:227`, `clamps a count past 255 on the narrow numeric format and keeps
  it whole on the wide one`.
- `src/` holds 43 `.ts` modules, which equals `SOURCE_MODULE_FLOOR`.

The opening ID, CR-05-DECLARATIONS-028, is fixed. All 27 earlier fixed IDs are still fixed. No ID
has reopened, and this round found no new cause.

## Round status

| ID | Opening severity | Result | Evidence |
| --- | --- | --- | --- |
| CR-05-DECLARATIONS-028 | WARNING | fixed | `alarmMute.test.ts:89` reads `test('is the only module under src that declares a value governing alarm mute', ...)`. The title now uses the file's own word: the comment at `:25` says a module "declares a mute value", the pattern list is `VALUE_DECLARATIONS` (`:29`) and the predicate is `declaresMuteValue` (`:60`). It no longer claims "constant" for a scan that also flags `let`/`var` variables and mutable fields. `bd39257` changes exactly that one line, plus its report row. The floor, the three patterns, the predicate and the expected `{ declaring: ['accessories/alarmMute.ts'], readsTheSourceTree: true }` are unchanged. The owner run lists the case under its new title and passes. `bd39257` is an ancestor of HEAD. |
| CR-05-DECLARATIONS-001 | BLOCKER | still fixed | `customCharacteristics.test.ts:65-71`: `CharacteristicExpectation` has `uuid` (`:68`). Each row of `:82-195` has a hand-written literal. A text diff of the 16 base source literals against the 16 test literals is empty and in order. None of the 20 published literals repeats. `:272-286` pins `typeUuid` and `instanceUuid` to the row literal in one value. `:304-313` compares the name-to-UUID `Map` with the table. `7bb76e6` is an ancestor. |
| CR-05-DECLARATIONS-002 | BLOCKER | still fixed | `customServices.test.ts:54-61` (`uuid` at `:58`) and `:68-111`. The 4 test literals equal the base source literals in order. `:186` expects the row literal `uuid`, not `services[name].UUID`. `:189-201` pins `typeUuid`. `:264-273` compares the map. `:277-287` compares the repeated identifiers of both factories with `[]`. `9fba016` is an ancestor. |
| CR-05-DECLARATIONS-003 | BLOCKER | still fixed | `customCharacteristics.test.ts:57-62`: `DomainExpectation` has all four members required. Every row carries a hand-written `domain`. `:251-270` compares `{ displayName, format, perms, domain }` as one value. `:389-398` compares the literal `{ format: 'uint32', maxValue: undefined, minStep: undefined }`. `9ef87cb` is an ancestor. |
| CR-05-DECLARATIONS-004 | BLOCKER | still fixed | `customCharacteristics.test.ts:197-218`: the one commented widening builds over `NullValueCharacteristic`, which sets `value` to `null` after `super(...)`, as the real HAP base leaves it. It spreads the shared stand-in into a new object, so the shared namespace is unchanged. The "starts ..." cases depend on `customCharacteristics.ts:161` (`this.value = this.getDefaultValue();`): `:326-335`, `:339-358` (literal rows 0, 1 and 1, with no `validValues[0]` read), `:360-369` and `:449-458`. `features/lib/hap.ts` has no diff since the base. `637da57` is an ancestor. |
| CR-05-DECLARATIONS-005 | BLOCKER | still fixed | `alarmMute.test.ts:21-23` (`SOURCE_MODULE_FLOOR = 43`; `find src -name '*.ts'` counts 43) and `:89-101`. There is no owner filter. The owning module is the expected planted positive, and the floor is in the same whole value. `c0a7b76` is an ancestor. |
| CR-05-DECLARATIONS-006 | WARNING | still fixed | `alarmMute.ts:1-28` and `alarmMute.test.ts:1-11` conform to D-01 (see Header inspection). `f7b6929` is an ancestor. |
| CR-05-DECLARATIONS-007 | WARNING | still fixed | `services.ts:1-27` and `services.test.ts:1-11` conform. `bf0f76d` is an ancestor. |
| CR-05-DECLARATIONS-008 | WARNING | still fixed | `customCharacteristics.ts:1-38` and `customCharacteristics.test.ts:1-11` conform. `4458330` is an ancestor. |
| CR-05-DECLARATIONS-009 | WARNING | still fixed | `customServices.ts:1-51` and `customServices.test.ts:1-11` conform. `0dcd7c2` is an ancestor. |
| CR-05-DECLARATIONS-010 | WARNING | still fixed | `alarmMute.test.ts:78-84`: `// act` binds `requestedValue`, then an empty line, then `// assert`. `b8cbe8c` is an ancestor. |
| CR-05-DECLARATIONS-011 | WARNING | still fixed | `services.test.ts:57-63, 65-73, 75-88`: each case has separate `// act` and `// assert` phases. A grep for `act & assert` in the four test files exits 1 (no match). `9cedd4d` is an ancestor. |
| CR-05-DECLARATIONS-012 | WARNING | still fixed | The case that carried the marker is gone, and no marker is in `customCharacteristics.test.ts`. `7bb76e6` is an ancestor. |
| CR-05-DECLARATIONS-013 | WARNING | still fixed | The case that carried the marker is gone, and no marker is in `customServices.test.ts`. `9fba016` is an ancestor. |
| CR-05-DECLARATIONS-014 | WARNING | still fixed | `customCharacteristics.test.ts:12` imports only `test`. A grep for `describe(` in the four test files finds nothing. The owner run reports `suites 0`. `7cb0069` is an ancestor. |
| CR-05-DECLARATIONS-015 | WARNING | still fixed | `customServices.test.ts:12` imports only `test`, and every case is at the top level. `96d5b19` is an ancestor. |
| CR-05-DECLARATIONS-016 | WARNING | still fixed | `customCharacteristics.ts:153`: `// One class factory, so no declaration repeats a class body.`, with no count. `644df7d` is an ancestor. |
| CR-05-DECLARATIONS-017 | WARNING | still fixed | `customCharacteristics.ts:107-109` gives the present-tense rationale. The `uint32` paragraph at `:111-115` is unchanged. `a9d9c4a` is an ancestor. |
| CR-05-DECLARATIONS-018 | WARNING | still fixed | `services.ts:15-18` says that each subtype is the `ServiceKind` slug verbatim, and it keeps the `const enum` sentence. `dfcd547` is an ancestor. |
| CR-05-DECLARATIONS-019 | WARNING | still fixed | `customServices.ts:92-96` names the facts declared but not constructed, beyond the three shared characteristics. The `customServices.test.ts:167` title matches the order asserted at `:175`. `ef0db0a` is an ancestor. |
| CR-05-DECLARATIONS-020 | WARNING | still fixed | `customServices.ts:25-34` states the restored-cache repair in the present tense, with no release narration. The repair guard it names is `declareCharacteristic` (`serviceCatalogue.ts:950-962`). `5df1dff` is an ancestor. |
| CR-05-DECLARATIONS-021 | WARNING | still fixed | `alarmMute.test.ts:25-39`: `VALUE_DECLARATIONS`, with a comment on each pattern that states what it captures. The mute condition is in the separate, named predicate `declaresMuteValue` (`:59-62`). Names and comments match behavior. `8d4ed4d` and `ae9647d` are ancestors. |
| CR-05-DECLARATIONS-022 | WARNING | still fixed | `alarmMute.test.ts:42-50`: `interface SourceModule`, `Promise<readonly SourceModule[]>` and `SourceModule[]`. `readonly RegExp[]` (`:29`) has a simple element type. ESLint exits 0. `69c7801` is an ancestor. |
| CR-05-DECLARATIONS-023 | WARNING | still fixed | `customServices.test.ts:119-135`: `NamedCharacteristic` and `PublishedType`, used as `readonly NamedCharacteristic[]` and `readonly PublishedType[]`. ESLint exits 0. `6472fa9` is an ancestor. |
| CR-05-DECLARATIONS-024 | WARNING | still fixed | `services.test.ts:20`: `const REMOVABLE_SENSOR_NAMES: readonly string[] = [...]`, with the seven literals in the same order. `960f812` is an ancestor. |
| CR-05-DECLARATIONS-025 | BLOCKER | still fixed | The predicate (`alarmMute.test.ts:61`) keeps any captured name that contains `mute`, with no `ALARM` condition. Through the file's exact patterns, `export const MUTE_DURATION_MS = 300_000;` and `const ALARM_MUTE_SECONDS = 30;` are both flagged (synthetic `node -e` run). `00f7bd6` is an ancestor. |
| CR-05-DECLARATIONS-026 | BLOCKER | still fixed | `alarmMute.test.ts:29-39, 59-62`. Through the exact patterns and predicate (synthetic `node -e`, no repository file touched), these are all flagged: the three forms 026 named (`function handleMute() { const muteDurationMs = 300_000; }`, `private readonly muteWindowSeconds = 30;`, `const unmuteValue = false;`), plus `const { muteWindowMs } = timings;`, `let unmuteAt = 0;` and `unmuteTimer: ReturnType<typeof setTimeout> \| undefined = undefined;`. Over today's 43 modules, only `accessories/alarmMute.ts` is kept, and the case passes. `ae9647d` is an ancestor. |
| CR-05-DECLARATIONS-027 | WARNING | still fixed | `services.ts:20-24` (overview) and `:60-68` (`NOTIFICATION_SERVICE_KINDS` JSDoc) say that the configuration check reads the runtime list, and that the settings form keeps its own alphabetical enum in `config.schema.json` (`:62-79`, re-read: alphabetical, the same seven names), which `test/configSchema.test.ts` pins. `c88bcca` is an ancestor. |

No new findings.

No fixed ID has reopened. All 26 distinct fix commits (`7bb76e6`, `9fba016`, `9ef87cb`,
`637da57`, `c0a7b76`, `f7b6929`, `bf0f76d`, `4458330`, `0dcd7c2`, `b8cbe8c`, `9cedd4d`, `7cb0069`,
`96d5b19`, `644df7d`, `a9d9c4a`, `dfcd547`, `ef0db0a`, `5df1dff`, `8d4ed4d`, `ae9647d`, `69c7801`,
`6472fa9`, `960f812`, `00f7bd6`, `c88bcca`, `bd39257`) are ancestors of HEAD
(`git merge-base --is-ancestor`, each exit 0). They cover the 28 IDs: `7bb76e6` closes 001 and 012,
`9fba016` closes 002 and 013, `ae9647d` fixes 026 and completes 021, and every other ID has one
commit of its own.

Counts for the coordinator: opening 1, fixed 1, rejected 0, new 0, reopened 0, closing 0.

### Candidates considered and not filed

I tried each of these against the rules. None is a defect a rule names, so none becomes a
finding. I did not re-file any form that round 3 rejected: parameter defaults, object-literal
keys, function and method names, synonyms, style-forbidden field forms, per-branch fixtures, and
false positives.

- **The scan comment says function names stay out, but `const muteFor = () => 1;` and a
  reassignment `muted = next;` are flagged** (`alarmMute.test.ts:27-28, 36-38`). These are false
  positives. They fail loudly and cannot hide a defect. Round 3 rejected this class with reasons,
  and the coordinator accepted that rejection. The comment is still true for what it names: a
  `function` declaration, a method or getter name (synthetic run: `export function muteFor() {}`,
  `private muteFor(): void {` and `get muted(): boolean {` are not flagged), a `type` name, and an
  object-literal key.
- **The redundant first assertion in `names every export it declares as provisional`**
  (`alarmMute.test.ts:69-73`). `exported.filter(...)` compared with `[]` is implied by the
  whole-value assertion on the next line. The whole value is asserted, as `cases.md` requires,
  and an extra weaker assertion lets no wrong implementation pass. The lines are unchanged since
  the batch base.
- **Module-level expectation tables with mutable row members.** `CHARACTERISTICS`
  (`customCharacteristics.test.ts:82`) and `SERVICES` (`customServices.test.ts:68`) are `readonly`
  arrays of interfaces whose members are not `readonly`. They are the data rows that `cases.md`
  "Data-driven cases" puts in a module-level `for`. No case writes to a row. The CR-05-DECLARATIONS-024
  rule ("never shared mutable constants") targets seeds and shared state. The round-0 review that
  opened 024 judged these sibling tables conforming, and its accepted fix covered only the list
  binding.
- **No `describe()` per exported entrypoint in `services.test.ts`.** `services.ts` exports one
  operation, `isNotificationServiceKind`. `NOTIFICATION_SERVICE_KINDS` is a constant list, not an
  entrypoint in the book's sense, where the examples `place` and `cancel` are operations. A
  single-entrypoint module keeps its cases at the top level.
- **The `typeof value === 'string'` guard in `isNotificationServiceKind`** (`services.ts:90`) is
  not discriminated by the `a number` and `an absent value` rows (`services.test.ts:78-79`).
  Without it the function answers the same: `Array.prototype.includes` compares with
  SameValueZero over a list of strings, so no non-string input can match. The guard exists for
  type narrowing, not for observable behavior, so no plausible wrong implementation differs.
- **`readdir(..., { recursive: true })` answers OS-native separators**
  (`alarmMute.test.ts:49, 99`). On Windows the expected `'accessories/alarmMute.ts'` would not
  match. Every CI job runs on `ubuntu-latest` (`.github/workflows/*.yml`), and no rule requires a
  test to be portable across operating systems.
- **The inline `{ readonly UUID: string }` at `customServices.test.ts:266`** repeats the shape of
  `PublishedType`. It is an inline object type in an annotation, not a `type` alias or a
  declaration, so `types.md` does not apply. The CR-05-DECLARATIONS-023 repair history records
  the same judgment.

## Findings

None.

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
  line 27 opens the first export's JSDoc. The module has no imports.
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

All commands ran from the repository root at HEAD `6fcd1c3aa8f98f9a2e02d1d351c62087b348668f`. The
working tree was clean: `git status --porcelain` printed nothing before and after the runs. Each
command was prefixed with `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. `node --version` was
`v26.12.0` and `npm --version` was `11.20.0`. The runs took place from 2026-10-17T13:56:08Z to
2026-10-17T13:56:53Z.

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
rounds 1 to 3. The alarm-mute scan case runs under its new title,
`is the only module under src that declares a value governing alarm mute`, and passes.

Preservation (D-05, P-05-01): I diffed the four sources against `053599a…` with comment and blank
lines filtered out. Each diff exits 0, so no code line changed. `git diff --stat 053599a HEAD --
src features config.schema.json` lists only the four batch sources, and their changes are headers
and comments. These are unchanged:

- The 16 characteristic UUID literals and the 4 service UUID literals are byte-identical to the
  base and in the same order. They equal the hand-copied test tables in order, and none of the 20
  repeats.
- The display names, formats and domains are unchanged.
- The service kinds and the `ServiceKind` unions are unchanged. Their slugs are the subtypes, and
  `src/accessories/serviceCatalogue.ts` has no diff since the base.
- `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE = true` is unchanged (`alarmMute.ts:37`).
- `features/lib/hap.ts` and `config.schema.json` have no diff since the base.

## Out-of-scope observations

- **Phase 7 (`features/lib/hap.ts`, D-12):** the four observations from rounds 0 to 3 are still
  present, and no Phase 5 edit touched the file:
  - the base `StandInCharacteristic` assigns the default value at line 300 (tracked as S-05-22,
    GATES);
  - the two JSDoc blocks before `FakeHapStatusError` (lines 97-110) are consecutive, so the first
    documents nothing;
  - line 375 says "fourteen near-identical class bodies", but there are 16 definitions;
  - the file opens with `@fileoverview` and has no SPDX line or copyright block.
- **Phase 7 (`features/lib/hap.ts`):** two constructors use parameter properties: the
  `hapStatus` constructor at line 116, and `StandInCharacteristic` at lines 295-299
  (`readonly displayName`, `readonly UUID`, `readonly props`). The style book's `classes.md`
  requires an injected value to be a `readonly` field assigned in the constructor, not a parameter
  property. The book gives `erasableSyntaxOnly` as the reason, but no `tsconfig*.json` sets that
  flag, so the compiler does not catch this. The fix belongs to the phase that owns
  `features/**`.
- **Phase 6 (`test/configSchema.test.ts`):** lines 175-176 still say that the order "no longer
  tracks NOTIFICATION_SERVICE_KINDS". That narrates a removed link, the same defect class as
  CR-05-DECLARATIONS-027, in a file outside this batch.

---

_Reviewed: 2026-10-17T13:58:30Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 4)_
_Depth: deep_

## Coordinator triage

Triaged on 2026-10-17 by the coordinator on the reviewer's final result, before any other
action. The round reports no open, reopened or new finding; the coordinator accepts the
reviewer's "Candidates considered and not filed" reasons, and none becomes a finding.

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-DECLARATIONS-028 | WARNING | fixed | Confirmed fixed by this round. |
| CR-05-DECLARATIONS-001 to 027 | as opened | fixed | Confirmed still fixed by this round. |

Counter (D-03 as amended, D-18): opening 1, fixed 1, rejected 0, new 0, reopened 0, closing 0.
Closing 0 is `clean` and closes the DECLARATIONS batch at correction round 4.
