---
phase: 05-accessories-conformance
batch: DECLARATIONS
review_round: 0
reviewed: 2026-10-17T11:29:11Z
depth: deep
source_revision: 053599a80557aa513b2d354833196408b92a4438
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
  blocker: 5
  warning: 19
  total: 24
status: issues_found
reviewer: gsd-code-reviewer (round 0)
---

# DECLARATIONS round 0 review

All eight files were read in full at `053599a80557aa513b2d354833196408b92a4438`. The rulebooks
used are the three `.agents/skills/` books, and they take precedence over the `.claude/rules/`
copies. HAP semantics were checked against the pinned
`node_modules/@homebridge/hap-nodejs` 2.2.2 `dist/lib/Characteristic.js`.

No production module in this batch shows wrong observable behavior. Every BLOCKER is a case that
a plausible wrong implementation passes. The largest gap: no case anywhere in the repository pins
any of the 16 characteristic UUID literals. The 4 service UUID literals are pinned only in
another module's test.

## Findings

### CR-05-DECLARATIONS-001 - BLOCKER: No case pins the 16 published characteristic UUID literals

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case discriminates the behavior in its title; "would a plausible wrong implementation still pass it?"); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: a case a wrong implementation would pass); `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions (compare whole values)
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:43-69, 124-145, 163-173`; production literals at `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:85-100`
**Issue:** The case `identifies ${name} with a fixed v4 identifier outside Apple's namespace` checks only that the UUID is v4-shaped and outside Apple's namespace. `answers the same ${name} identifier to every caller` checks only that two factory calls in one process agree. `identifies every vendor-defined characteristic distinctly` compares a set size with a key count. No test in `test/` or `features/` contains any of the 16 literals (a repository-wide grep for each literal finds only the source and old planning files). Three plausible wrong implementations pass every case:
(a) swapping two literals, for example `PUMP_RUNNING_UUID` with `PUMP_FAULT_UUID`, so a cached accessory reads a running pump as a pump fault;
(b) regenerating any literal as a different random v4;
(c) `const PUMP_RUNNING_UUID = randomUUID();` at module scope, which is stable within one process but changes at every Homebridge restart.
Each of these orphans the characteristic on every installed accessory. The source fileoverview (lines 27-30) names this exact risk: "silently orphan the characteristic ... while every test stayed green". The title says "fixed", but nothing tests that the identifier is fixed.
**Fix:** Add a `uuid` field to `CharacteristicExpectation` and write the 16 literals into the `CHARACTERISTICS` rows, copied by hand from `customCharacteristics.ts:85-100`. Do not import them from the source. Then assert the whole identity in the per-row case, for example `assert.strictEqual(declaredAs(characteristics, name).UUID, uuid)`, or fold the UUID into the row's whole-value comparison. Replace the set-size case with one `deepStrictEqual` of the name-to-UUID map against the table. The `same identifier to every caller` case then adds nothing and can go. Do not change any literal (D-05).
**Flags:** none

### CR-05-DECLARATIONS-002 - BLOCKER: The owner test does not pin the 4 published service UUID literals

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` ("would a plausible wrong implementation still pass it?"); `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` Pairing and coverage (the paired test module owns the source module's exported behavior; do not test one source module from another module's test); `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions (build expected values independently)
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:44-93, 151-186, 249-259`; production literals at `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:78-81`
**Issue:** `identifies ${name} with a fixed v4 identifier outside Apple's namespace` checks only shape and namespace. `answers the same ${name} identifier to every caller` checks stability within one process. The size check in `gives every published type of either factory its own identifier` checks only that the identifiers are distinct. `keeps the display name and the subtype ${name} is constructed with` takes its expected `uuid` from production (`services[name].UUID`, line 161). So a swapped, regenerated, or module-scope `randomUUID()` service identifier passes every case in the owner test and in the pair's direct-coverage run. The only pins are in `test/accessories/basementGuardian.test.ts:54-57`, which is another module's test, and it protects this module only through the catalogue and accessory path.
**Fix:** Add a `uuid` field with the hand-copied literal to each `SERVICES` row. Assert it in the per-row identity case, and use it as the expected `uuid` at line 161 in place of `services[name].UUID`. Replace the size check with a `deepStrictEqual` of the name-to-UUID map. Do not change any literal (D-05).
**Flags:** none

### CR-05-DECLARATIONS-003 - BLOCKER: The value domain is not compared as a whole, so a clamping domain passes

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions (compare whole values; build expected values independently, do not ask a harness for the answer); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER)
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:43-69, 109-122, 199-208, 279-293`
**Issue:** The per-row case compares only `displayName`, `format` and `perms`. A whole-domain check (`minValue`, `maxValue`, `minStep`, `validValues`) exists only for `RawWaterLevelCode` (188-197) and `MainsPowerPresent` (210-222). `bounds the two battery codes ...` compares `validValues` alone. `counts observed activations on a format wide enough that HAP cannot clamp the number` compares only the format, and it reads the expected value from the stand-in (`hap.Formats.UINT32`) rather than writing `'uint32'`. Pinned HAP clamps every numeric update to `maxValue` and rounds it to `minStep` (Characteristic.js:2105-2128). So a plausible copy-paste domain such as `domain: { maxValue: 255 }` on `ObservedActivationCount` passes every case. That is the "count past 255 would silently stop advancing" false normal that the source comment at `customCharacteristics.ts:106-110` warns about. Likewise, `maxValue: 16` on `BatteryHealthCode` would clamp the legal NotDetected code 32 to 16 and still pass.
**Fix:** Add a `domain` field to every `CharacteristicExpectation` row, written out by hand: `{ minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined }` for the 13 rows with no domain, and the declared values for the three coded rows. Compare it in the per-row case together with display name, format and perms, as one whole value. In the `uint32` case, assert the literal `{ format: 'uint32', maxValue: undefined, minStep: undefined }`. Do not change production.
**Flags:** none

### CR-05-DECLARATIONS-004 - BLOCKER: The construction-default cases test the stand-in base, not the module's own default assignment

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` ("would a plausible wrong implementation still pass it?"); `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions (do not compute the expected value with production code); D-13; D-16
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:224-233, 235-252, 254-263, 341-353`; production line `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:156`; stand-in `053599a80557aa513b2d354833196408b92a4438:features/lib/hap.ts:295-301`
**Issue:** The pinned real HAP base `Characteristic` leaves `value = null` (Characteristic.js:1274 field and constructor 1294-1303). Each real definition sets `this.value = this.getDefaultValue()` itself (CharacteristicDefinitions.js:23). `customCharacteristics.ts:156` does the same, so with real HAP it is the only thing that gives a vendor characteristic its construction default. The stand-in's base constructor (`hap.ts:300`) already assigns the default. If someone deletes line 156, all four "starts ..." cases still pass: the boolean default, the uint8 `validValues` defaults, the empty controller timestamp and the four pump-record defaults. In production every vendor characteristic would then start at `null`. `starts ${name} at a value its own validValues admits` also takes its expected value from production (`validValues[0]` read off `characteristic.props`, line 249). So it proves only the stand-in's `getDefaultValue` order, which holds for any non-empty `validValues`. No real-HAP case constructs the plugin's characteristics: `hapWriteFidelity.test.ts` never calls `createCustomCharacteristics`. This is a confirmed stand-in/real-HAP disagreement that hides a production line.
**Fix:** Move the protection to where real HAP runs (D-13, D-16). Add one parity case to `test/accessories/hapWriteFidelity.test.ts` (GATES batch) that builds `createCustomCharacteristics` over the real namespace and the stand-in, and compares each `.value` with hand-written literals (`false`, `0`, `1`, `1`, `''`). Alternatively, as a declared D-12 bounded task, make the stand-in base leave `value` as `null` and set the default in `defineCharacteristic`, as real HAP does. In `customCharacteristics.test.ts`, replace `validValues[0]` at line 249 with the literals 0, 1 and 1. Then record in the ledger where the "starts ..." protection now lives (P-05-03).
**Flags:** D-13, D-16 (stand-in disagreement; `features/lib/hap.ts` edits only as a D-12 bounded task)

### CR-05-DECLARATIONS-005 - BLOCKER: The alarm-mute source scan has no enumeration floor and no planted positive

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` ("a verified case would fail if that behavior broke"; "would a plausible wrong implementation still pass it?"); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: weak assertions); the static-gate pattern of a documented floor plus a planted positive (05-CONTEXT.md code_context)
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:14-29, 50-64`
**Issue:** `is the only module under src that declares a constant governing alarm mute` asserts only that the filtered list is `[]`. Nothing proves that `sourceModules()` read any file, or that `MUTE_CONSTANT_DECLARATION` plus the `ALARM`/`MUTE` filter can match a real declaration. If the URL resolves to a directory with no `.ts` files (for example after a build-layout change), or the pattern stops matching (an edited regex, or a `const`/`readonly` form it does not cover), the case passes with no evidence. The owning module, the one real positive in the tree, is filtered out before matching (line 58), so the suite never sees the matcher fire. The case also reads every other module under `src/` from a paired test.
**Fix:** Drop the owner filter, and make the owning module the planted positive and floor: `assert.deepStrictEqual(declaring, ['accessories/alarmMute.ts'])`. This fails on an empty read, on a pattern that matches nothing, and on a second declaring module. Keep the title. Alternatively, keep the filter and add both an explicit floor (`modules.some(({ path }) => path === OWNING_MODULE)`) and a planted source string that the matcher must flag.
**Flags:** none

### CR-05-DECLARATIONS-006 - WARNING: The alarmMute pair lacks the D-01 header

**Rule:** D-01; `.agents/skills/typescript-style/rules/modules-and-data.md` Files and modules (file order: copyright JSDoc, `@fileoverview` JSDoc, imports, implementation, one blank line between them)
**Location:** `053599a80557aa513b2d354833196408b92a4438:src/accessories/alarmMute.ts:1-22`; `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:1`
**Issue:** In the source, the overview `/**` starts on line 2, directly after SPDX. There is no empty line 2, no copyright block on lines 3-5 and no empty line 6. The test opens with `import assert` on line 1. It has no SPDX line, no copyright block and no `@fileoverview`.
**Fix:** Source: insert an empty line, the three-line `Copyright (c) 2026 Alessandro Colomba` block and an empty line after SPDX, and keep the existing overview text. Test: prepend SPDX, an empty line, the copyright block, an empty line, and a `/** @fileoverview <purpose> */` block, then one empty line before the first import. Make it a header-only commit.
**Flags:** none

### CR-05-DECLARATIONS-007 - WARNING: The services pair lacks the D-01 header

**Rule:** D-01; `.agents/skills/typescript-style/rules/modules-and-data.md` Files and modules
**Location:** `053599a80557aa513b2d354833196408b92a4438:src/accessories/services.ts:1-19`; `053599a80557aa513b2d354833196408b92a4438:test/accessories/services.test.ts:1`
**Issue:** In the source, the overview starts on line 2 with no empty line and no copyright block. The test opens with an import on line 1, with no SPDX, copyright or `@fileoverview`.
**Fix:** As CR-05-DECLARATIONS-006, for both files, in a header-only commit.
**Flags:** none

### CR-05-DECLARATIONS-008 - WARNING: The customCharacteristics pair lacks the D-01 header

**Rule:** D-01; `.agents/skills/typescript-style/rules/modules-and-data.md` Files and modules
**Location:** `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:1-33`; `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:1`
**Issue:** In the source, the overview starts on line 2 with no empty line and no copyright block. The overview closes on line 31, line 32 is empty and the first import is on line 33, which is correct. The test opens with an import on line 1, with no SPDX, copyright or `@fileoverview`.
**Fix:** As CR-05-DECLARATIONS-006, for both files, in a header-only commit.
**Flags:** none

### CR-05-DECLARATIONS-009 - WARNING: The customServices pair lacks the D-01 header

**Rule:** D-01; `.agents/skills/typescript-style/rules/modules-and-data.md` Files and modules
**Location:** `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:1-47`; `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:1`
**Issue:** In the source, the overview starts on line 2 with no empty line and no copyright block. The overview closes on line 45, line 46 is empty and the import is on line 47. The test opens with an import on line 1, with no SPDX, copyright or `@fileoverview`.
**Fix:** As CR-05-DECLARATIONS-006, for both files, in a header-only commit.
**Flags:** none

### CR-05-DECLARATIONS-010 - WARNING: alarmMute.test.ts uses a combined act-and-assert marker without assert.throws or assert.rejects

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure (`// act & assert` only when one `assert.rejects()`/`assert.throws()` expression does both)
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:45-48`
**Issue:** `requests exactly true and nothing else for alarm mute` marks `assert.strictEqual(alarmMute.PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE, true)` as `// act & assert`.
**Fix:** Split the case into `// act` (`const requestedValue = alarmMute.PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE;`), an empty line, and `// assert` (`assert.strictEqual(requestedValue, true);`).
**Flags:** none

### CR-05-DECLARATIONS-011 - WARNING: services.test.ts uses three combined act-and-assert markers without assert.throws or assert.rejects

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure (data rows still use separate phases)
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/services.test.ts:47-50, 52-57, 59-69`
**Issue:** `CONF-06 lists the seven removable notification sensors in declaration order` (a `deepStrictEqual`) and the two data-row loops `recognises ...` and `refuses ...` (each a `strictEqual` on `isNotificationServiceKind`) use `// act & assert`.
**Fix:** In each case, bind the result under `// act` (for example `const recognised = isNotificationServiceKind(sensorName);`), add an empty line, and assert under `// assert`.
**Flags:** none

### CR-05-DECLARATIONS-012 - WARNING: customCharacteristics.test.ts uses a combined act-and-assert marker without assert.throws or assert.rejects

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:138-145`
**Issue:** `answers the same ${name} identifier to every caller` marks a `strictEqual` of two `declaredAs(...).UUID` reads as `// act & assert`.
**Fix:** Split the case into separate `// act` and `// assert` phases. If CR-05-DECLARATIONS-001 removes the case, this finding is closed by that removal.
**Flags:** none

### CR-05-DECLARATIONS-013 - WARNING: customServices.test.ts uses a combined act-and-assert marker without assert.throws or assert.rejects

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:179-186`
**Issue:** `answers the same ${name} identifier to every caller` marks `assert.strictEqual(first[name].UUID, second[name].UUID)` as `// act & assert`.
**Fix:** Split the case into separate `// act` and `// assert` phases. If CR-05-DECLARATIONS-002 removes the case, this finding is closed by that removal.
**Flags:** none

### CR-05-DECLARATIONS-014 - WARNING: A single-entrypoint module's cases are wrapped in a describe (customCharacteristics)

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("A single-entrypoint module keeps cases at the top level.")
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:2, 94-354`
**Issue:** `customCharacteristics.ts` exports one runtime entrypoint, `createCustomCharacteristics`. Its other exports, `CharacteristicClass` and `CustomCharacteristics`, are types. Every case still sits inside `describe('createCustomCharacteristics', ...)`.
**Fix:** Remove the `describe` wrapper, move the cases to the top level, and drop `describe` from the `node:test` import. Put the reindent in its own style-only commit, recorded with `git diff -w`.
**Flags:** none

### CR-05-DECLARATIONS-015 - WARNING: A single-entrypoint module's cases are wrapped in a describe (customServices)

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:2, 113-260`
**Issue:** `customServices.ts` exports one runtime entrypoint, `createCustomServices`. `ServiceClass` and `CustomServices` are types. Every case still sits inside `describe('createCustomServices', ...)`.
**Fix:** As CR-05-DECLARATIONS-014.
**Flags:** none

### CR-05-DECLARATIONS-016 - WARNING: The class-factory comment states the wrong count

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does; no narration of a former shape)
**Location:** `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:148`
**Issue:** The comment says "so twelve near-identical class bodies never exist", but the factory defines 16 characteristics (lines 162-223). Twelve was the count before the four pump-record types were added.
**Fix:** Write the count that is true, or remove it: `// One class factory, so no declaration repeats a class body.`
**Flags:** none

### CR-05-DECLARATIONS-017 - WARNING: The format-names comment describes a module-level definition table that does not exist

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe the code as it stands; no narration of code that no longer exists)
**Location:** `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:102-104`
**Issue:** The comment says the formats are named "rather than read from `hap.Formats` so the definition table stays a plain module-level value". The module has no module-level definition table. The 16 definitions are inline `define(...)` calls inside `createCustomCharacteristics` (lines 161-224). The rationale points to a shape that the code does not have.
**Fix:** Restate the rationale as a present-tense fact, for example: `// The four HAP formats these declarations use, named so each definition reads as plain data; the factory resolves each name against the injected namespace.` Keep the `uint32` paragraph.
**Flags:** none

### CR-05-DECLARATIONS-018 - WARNING: The services.ts overview describes a subtype object that does not exist

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does as it stands)
**Location:** `053599a80557aa513b2d354833196408b92a4438:src/accessories/services.ts:10-13`
**Issue:** The overview says "The stable subtype strings themselves arrive with the accessory adapters, as an `as const` object that derives its union from these types." No such object exists. The subtype of every row is the `ServiceKind` slug itself (`serviceCatalogue.ts:21-22, 132, 634` `subtype: kind`), and `src/accessories` has no `as const`. The sentence describes a planned shape, not the current code.
**Fix:** Replace the sentence with the present fact, for example: `Each published service's subtype is its \`ServiceKind\` slug verbatim, so the unions below are the subtype strings.` Keep the `const enum` sentence.
**Flags:** none

### CR-05-DECLARATIONS-019 - WARNING: The doc for `optional` and its test title misstate what makes a characteristic optional

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments and test titles describe what the code does); `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure (title states public behavior)
**Location:** `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:88`; `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:140`
**Issue:** The JSDoc defines `optional` as "The facts only some subtypes of the service carry, beyond the two status characteristics every one declares". This is wrong in two ways. First, every service declares three shared characteristics (`StatusActive`, `StatusFault`, `ConfiguredName`, lines 105-109), not two. Second, the four pump-record characteristics are optional on `PumpService` even though both pump subtypes carry them. They are optional so that none is constructed before a record writes it (lines 136-145). The test title `declares the characteristics only some ${name} subtypes carry as optional` repeats the error. For `SumpMainsPowerService` and `BackupBatteryService`, the optional list is only the three shared characteristics, which every subtype carries.
**Fix:** JSDoc: `/** The facts declared but not constructed with the service, beyond the three shared characteristics every one declares. */`. Title: `declares the characteristics ${name} adds only on first write as optional`, or similar wording that states the observed behavior.
**Flags:** none

### CR-05-DECLARATIONS-020 - WARNING: The customServices overview narrates release history

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (narration of code that no longer exists; restate the rationale as a present-tense fact)
**Location:** `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:24-30`
**Issue:** "The same rule is what lets a later release add the pump observation-epoch, observed-count, and last-activation characteristics to an already-published `PumpService` ..." describes an addition that has already shipped, as a future release. The records are now declared optional in `PumpService` (lines 149-156). The fact that still holds today is about restored caches: a service restored from a cache written before those declarations existed lacks them, and the repair guard declares them before pushing.
**Fix:** Restate it in the present tense, for example: `A \`PumpService\` restored from an older cache can lack the record declarations; the accessory's characteristic-repair guard declares an undeclared characteristic before pushing it, which suppresses HAP's warning, and the subtype is untouched.`
**Flags:** none

### CR-05-DECLARATIONS-021 - WARNING: The source-scan pattern's name and comment claim it matches only alarm-mute declarations

**Rule:** `.agents/skills/typescript-style/rules/naming-and-docs.md` Naming (names descriptive to a new reader); `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does)
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:14-17, 59`
**Issue:** The comment says the pattern is "A constant *declaration* naming alarm mute", and the name is `MUTE_CONSTANT_DECLARATION`. But the regex matches every CONSTANT_CASE `const`/`let`/`var`/`enum`/`readonly` declaration. The alarm-mute restriction is the separate `name.includes('ALARM') && name.includes('MUTE')` filter at line 59. A reader who trusts the name or comment misreads what the scan checks.
**Fix:** Rename the pattern to `CONSTANT_DECLARATION` and describe it as "any CONSTANT_CASE declaration; the case keeps those naming both ALARM and MUTE", or move the `ALARM`/`MUTE` condition into a named predicate next to it.
**Flags:** none

### CR-05-DECLARATIONS-022 - WARNING: alarmMute.test.ts writes an array of object literal type as `T[]`

**Rule:** `.agents/skills/typescript-style/rules/types.md` (`T[]`/`readonly T[]` for simple element types, `Array<...>`/`ReadonlyArray<...>` otherwise)
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:19, 22`
**Issue:** `Promise<readonly { path: string; source: string }[]>` and `const modules: { path: string; source: string }[]` use the short array form with an object-literal element type. ESLint has no `array-type` rule (`eslint.config.js`), so the toolchain does not gate this.
**Fix:** Write `Promise<ReadonlyArray<{ path: string; source: string }>>` and `const modules: Array<{ path: string; source: string }> = [];`, or declare a small `interface SourceModule` and use `readonly SourceModule[]`.
**Flags:** none

### CR-05-DECLARATIONS-023 - WARNING: customServices.test.ts writes arrays of object literal types as `T[]`

**Rule:** `.agents/skills/typescript-style/rules/types.md`
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:101, 105`
**Issue:** `readonly { displayName: string }[]` (the parameter of `displayNamesOf`) and `readonly { readonly UUID: string }[]` (the return of `publishedTypesOf`) use the short form with object-literal element types.
**Fix:** Use `ReadonlyArray<{ displayName: string }>` and `ReadonlyArray<{ readonly UUID: string }>`.
**Flags:** none

### CR-05-DECLARATIONS-024 - WARNING: A mutable module-level list is shared across eight cases as expected value and row source

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Test data (values reused across cases are fresh or immutable, never shared mutable constants); Case structure (only a stateless stub may live at module scope)
**Location:** `053599a80557aa513b2d354833196408b92a4438:test/accessories/services.test.ts:10-18`
**Issue:** `REMOVABLE_SENSOR_NAMES` is inferred as a mutable `string[]`. It is the expected value of the `CONF-06` case and the row source of seven `recognises ...` cases. Any case could mutate it and change what the others compare against. The sibling files in this batch declare the same kind of list as `readonly string[]`.
**Fix:** Annotate it as `const REMOVABLE_SENSOR_NAMES: readonly string[] = [...]`.
**Flags:** none

## Seed and lead dispositions

- **S-05-01:** confirmed for this batch's four files as CR-05-DECLARATIONS-010 (alarmMute.test.ts, 1 marker at line 46), CR-05-DECLARATIONS-011 (services.test.ts, 3 markers at lines 48, 54, 66), CR-05-DECLARATIONS-012 (customCharacteristics.test.ts, 1 marker at line 143) and CR-05-DECLARATIONS-013 (customServices.test.ts, 1 marker at line 184). The counts match the lead. None of these markers is followed by `assert.rejects` or `assert.throws`. I used one ID per pair because each repair is a single-module `test(<module>)` commit.
- **S-05-02:** confirmed as CR-05-DECLARATIONS-014 (customCharacteristics.test.ts:94) and CR-05-DECLARATIONS-015 (customServices.test.ts:113). Each module exports exactly one runtime function, and its other exports are types.
- **S-05-08:** confirmed as CR-05-DECLARATIONS-016. Line 148 says "twelve", and the factory defines 16 (customCharacteristics.ts:162-223). The neighboring stale comment at lines 102-104 is a separate cause, CR-05-DECLARATIONS-017.
- **S-05-16:** confirmed as CR-05-DECLARATIONS-005 (BLOCKER). Nothing proves the read is non-empty, and the matcher never meets a positive because the owning module is filtered out at line 58.
- **S-05-21:** rejected. `.agents/skills/typescript-style/rules/types.md` "Object types declared with `interface`, not a `type` alias of an object literal" does not apply: `CharacteristicDomain` (customCharacteristics.ts:114) is a `Pick` of an external interface, not an object-literal alias. "Interface extension over `Pick` and friends" needs a base interface the project owns, but `CharacteristicProps` is imported from `homebridge` (line 33). The available rewrites are worse. An empty `interface CharacteristicDomain extends Pick<...> {}` still uses `Pick` and adds an empty interface. Re-declaring `minValue`/`maxValue`/`minStep`/`validValues` by hand cuts the link to HAP's prop types, which can then drift apart silently. For a single local use, the alias is "the simplest construct that expresses the code" (same rule).

## Header inspection

- `src/accessories/alarmMute.ts`: gap. Line 1 SPDX is correct, but line 2 is `/**` (overview), not empty. The copyright block (lines 3-5) and empty line 6 are missing. The overview closes on line 21 and line 22 is empty. There are no imports. (CR-05-DECLARATIONS-006)
- `test/accessories/alarmMute.test.ts`: gap. Line 1 is `import assert ...`. There is no SPDX, copyright block or `@fileoverview`. (CR-05-DECLARATIONS-006)
- `src/accessories/services.ts`: gap. Line 1 SPDX is correct, but the overview starts on line 2. The empty line 2, copyright block 3-5 and empty line 6 are missing. The overview closes on line 18 and line 19 is empty. (CR-05-DECLARATIONS-007)
- `test/accessories/services.test.ts`: gap. Line 1 is an import. There is no SPDX, copyright block or `@fileoverview`. (CR-05-DECLARATIONS-007)
- `src/accessories/customCharacteristics.ts`: gap. Line 1 SPDX is correct, but the overview starts on line 2 and the empty line plus copyright block are missing. The overview closes on line 31, line 32 is empty and the first import is on line 33, which is correct. (CR-05-DECLARATIONS-008)
- `test/accessories/customCharacteristics.test.ts`: gap. Line 1 is an import. There is no SPDX, copyright block or `@fileoverview`. (CR-05-DECLARATIONS-008)
- `src/accessories/customServices.ts`: gap. Line 1 SPDX is correct, but the overview starts on line 2 and the empty line plus copyright block are missing. The overview closes on line 45, line 46 is empty and the import is on line 47, which is correct. (CR-05-DECLARATIONS-009)
- `test/accessories/customServices.test.ts`: gap. Line 1 is an import. There is no SPDX, copyright block or `@fileoverview`. (CR-05-DECLARATIONS-009)

No file in this batch conforms to D-01. The gaps match the ledger's 05-02 RED header check for the alarmMute pair and the inventory's header-at-base column.

## Toolchain evidence

All commands ran from the repository root at HEAD `053599a80557aa513b2d354833196408b92a4438`. The working tree was dirty only in `.planning/phases/05-accessories-conformance/05-FINDINGS.md`, which is uncommitted planning text from the coordinator. Every command was prefixed with `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. `node --version` was `v26.12.0` and `npm --version` was `11.20.0`. The runs started at 2026-10-17T11:26:50Z.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | `tsc --noEmit` for `tsconfig.json` and `tsconfig.test.json`, no diagnostics |
| `npm run build:test` | 0 | `rimraf ./dist-test && tsc -p tsconfig.test.json` |
| `node --test dist-test/test/accessories/alarmMute.test.js dist-test/test/accessories/services.test.js dist-test/test/accessories/customCharacteristics.test.js dist-test/test/accessories/customServices.test.js` | 0 | tests 109, suites 2, pass 109, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` | 0 | the selector printed nothing |
| `npm run test:coverage:direct -- src/accessories/services.ts test/accessories/services.test.ts` | 0 | the selector printed nothing |
| `npm run test:coverage:direct -- src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` | 0 | the selector printed nothing |
| `npm run test:coverage:direct -- src/accessories/customServices.ts test/accessories/customServices.test.ts` | 0 | the selector printed nothing |

Every required check passed. So no finding comes from a failed or missing check. These checks passed while five BLOCKER-class weaknesses exist: passing tests and 100% direct coverage are not evidence that the cases discriminate. Lint was not in the required command list and was not run. The `array-type` observations (022, 023) are not lint-gated, because `eslint.config.js` configures no `@typescript-eslint/array-type` rule.

## Out-of-scope observations

- **Phase 7 (`features/lib/hap.ts`, D-12):** `StandInCharacteristic`'s constructor (line 300) assigns `this.value = this.getDefaultValue()` in the base class. Real HAP 2.2.2 leaves the base `value` as `null` (Characteristic.js:1274, 1294-1303), and each definition subclass assigns the default. This disagreement hides `customCharacteristics.ts:156` (CR-05-DECLARATIONS-004). Its parity case belongs in `hapWriteFidelity.test.ts` (GATES batch, D-16), or in a D-12 bounded edit.
- **Phase 7 (`features/lib/hap.ts`):** lines 97-110 hold two consecutive JSDoc blocks before `FakeHapStatusError`. The first ("The error a write handler throws ...") documents nothing, because it is followed at once by a second block.
- **Phase 7 (`features/lib/hap.ts`):** the comment at line 375 says "so fourteen near-identical class bodies never exist", but `CHARACTERISTIC` defines 16 standard characteristics (lines 387-418). This is the same stale-count defect as CR-05-DECLARATIONS-016.
- **Phase 7 (`features/lib/hap.ts`):** the file opens with `@fileoverview` on line 1 and has no SPDX line or copyright block. Under D-12 it gets the D-01 header in its own commit when it is first touched.

---

_Reviewed: 2026-10-17T11:29:11Z_
_Reviewer: Claude (gsd-code-reviewer, round 0)_
_Depth: deep_

## Coordinator triage

Triaged on 2026-10-17 by the coordinator, who re-read every cited region at
`053599a80557aa513b2d354833196408b92a4438` and, for CR-05-DECLARATIONS-004, the pinned
`node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js` (base field `value = null` at
line 1274; the constructor at 1294-1303 assigns no default) against `features/lib/hap.ts:300`
(the stand-in base assigns `this.value = this.getDefaultValue()`). All 24 findings are accepted
as `open`; none is rejected. No finding is a genuine production bug (D-04): each BLOCKER is a case
that a plausible wrong implementation passes, so each BLOCKER repair carries the protocol's
assertion control. No accepted fix changes an exported name, type or signature, so no D-06
impact trace is due unless a fixer finds otherwise.

| ID | Severity | Disposition | Coordinator direction |
| --- | --- | --- | --- |
| CR-05-DECLARATIONS-001 | BLOCKER | open | Fix as the report says: a hand-copied `uuid` per `CHARACTERISTICS` row (never imported, never changed: D-05, P-05-01), the whole identity compared per row, and the set-size case replaced by one name-to-UUID `deepStrictEqual`. Control: swap two literals in a scratch edit and observe the case fail. |
| CR-05-DECLARATIONS-002 | BLOCKER | open | Fix as the report says, including the expected `uuid` at test line 161. Control: swap two service literals and observe the case fail. |
| CR-05-DECLARATIONS-003 | BLOCKER | open | Fix as the report says: a hand-written `domain` per row compared with display name, format and perms as one value; the `uint32` case compares literals. Control: add `maxValue: 255` to `ObservedActivationCount` and observe the case fail. |
| CR-05-DECLARATIONS-004 | BLOCKER | open | Fix inside this batch, without touching `features/lib/hap.ts` (D-12): make the file's one `hapNamespace()` widening build over a base `Characteristic` that leaves `value` null as real HAP's base does, stated in its comment (D-11 single place), so the four "starts ..." cases fail when `customCharacteristics.ts:156` is removed; write the expected defaults as literals (0, 1 and 1 in place of `validValues[0]`). Control: delete line 156, observe the "starts ..." cases fail, restore the exact bytes. The stand-in/real-HAP disagreement itself goes to the GATES batch as lead S-05-22 (D-16). |
| CR-05-DECLARATIONS-005 | BLOCKER | open | Drop the owner filter and require exactly `['accessories/alarmMute.ts']` (the planted positive), plus an enumeration floor named `SOURCE_MODULE_FLOOR` set to a documented count at or below today's `src/` module count, compared in one whole value. Control: make the scan read no files (or break the pattern) and observe the case fail. |
| CR-05-DECLARATIONS-006 | WARNING | open | Header-only commit `style(alarmMute): add the approved file headers`; the test overview reads like "Tests the provisional alarm-mute contract." |
| CR-05-DECLARATIONS-007 | WARNING | open | Header-only commit for the services pair. |
| CR-05-DECLARATIONS-008 | WARNING | open | Header-only commit for the customCharacteristics pair. |
| CR-05-DECLARATIONS-009 | WARNING | open | Header-only commit for the customServices pair. |
| CR-05-DECLARATIONS-010 | WARNING | open | Separate `// act` and `// assert` phases with a named value. |
| CR-05-DECLARATIONS-011 | WARNING | open | As 010, for all three markers. |
| CR-05-DECLARATIONS-012 | WARNING | open | Closed by the 001 repair if that repair removes the "same identifier to every caller" case; otherwise split the phases. The fixer states which. |
| CR-05-DECLARATIONS-013 | WARNING | open | As 012, through the 002 repair. |
| CR-05-DECLARATIONS-014 | WARNING | open | Remove the `describe` wrapper in a style-only reindent commit, last among this file's causes, recorded with `git diff -w`. |
| CR-05-DECLARATIONS-015 | WARNING | open | As 014, for customServices.test.ts. |
| CR-05-DECLARATIONS-016 | WARNING | open | State the true count or no count. |
| CR-05-DECLARATIONS-017 | WARNING | open | Present-tense rationale; keep the `uint32` paragraph unchanged. |
| CR-05-DECLARATIONS-018 | WARNING | open | Present-tense fact about subtypes; keep the `const enum` sentence. |
| CR-05-DECLARATIONS-019 | WARNING | open | Correct the `optional` JSDoc and the test title together. |
| CR-05-DECLARATIONS-020 | WARNING | open | Present-tense restatement; no release narration. |
| CR-05-DECLARATIONS-021 | WARNING | open | Rename the pattern or move the ALARM/MUTE condition into a named predicate; coordinate with 005, which edits the same case. |
| CR-05-DECLARATIONS-022 | WARNING | open | `ReadonlyArray<...>`/`Array<...>` or a named interface. |
| CR-05-DECLARATIONS-023 | WARNING | open | As 022. |
| CR-05-DECLARATIONS-024 | WARNING | open | `readonly string[]` annotation. |

Lead dispositions: S-05-01 (this batch's part) confirmed as 010 to 013; S-05-02 (this batch's
part) confirmed as 014 and 015; S-05-08 confirmed as 016; S-05-16 confirmed as 005; S-05-21
rejected with the reviewer's reason, which the coordinator accepts: `CharacteristicDomain` picks
from homebridge's external `CharacteristicProps`, interface extension needs a base the project
owns, and both alternatives (an empty `extends Pick` interface, or hand-copied member types that
can drift from HAP) are worse than the alias (`.agents/skills/typescript-style/rules/types.md`,
simplest construct).

New lead for another batch: S-05-22 (GATES, D-16): the stand-in's base `Characteristic` assigns
the default value (`features/lib/hap.ts:300`) while real HAP 2.2.2's base leaves `value` null
(Characteristic.js:1274, 1294-1303) and each definition assigns its own; no fidelity case diffs
construction defaults. The four `features/lib/hap.ts` observations above stay out of scope for
Phase 7 (D-12).

Counter: round 0 opens at 0 (no seeds), adds 24 new, rejects 0, closes at 24: `initial`.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-DECLARATIONS-006 | `src/accessories/alarmMute.ts`, `test/accessories/alarmMute.test.ts` | Node v26.12.0: `npm run build:test` exit 0; `node --test dist-test/test/accessories/alarmMute.test.js` exit 0 (3 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` exit 0; `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` exit 0 (`ACCESSORIES_HEADERS_OK files=2`); `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | header-only |
| CR-05-DECLARATIONS-007 | `src/accessories/services.ts`, `test/accessories/services.test.ts` | Node v26.12.0: `npm run build:test` exit 0; `node --test dist-test/test/accessories/services.test.js` exit 0 (12 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/services.ts test/accessories/services.test.ts` exit 0; `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths src/accessories/services.ts test/accessories/services.test.ts` exit 0 (`ACCESSORIES_HEADERS_OK files=2`); `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | header-only |
| CR-05-DECLARATIONS-008 | `src/accessories/customCharacteristics.ts`, `test/accessories/customCharacteristics.test.ts` | Node v26.12.0: `npm run build:test` exit 0; `node --test dist-test/test/accessories/customCharacteristics.test.js` exit 0 (66 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` exit 0; `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` exit 0 (`ACCESSORIES_HEADERS_OK files=2`); `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | header-only |
| CR-05-DECLARATIONS-009 | `src/accessories/customServices.ts`, `test/accessories/customServices.test.ts` | Node v26.12.0: `npm run build:test` exit 0; `node --test dist-test/test/accessories/customServices.test.js` exit 0 (28 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/customServices.ts test/accessories/customServices.test.ts` exit 0; `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths src/accessories/customServices.ts test/accessories/customServices.test.ts` exit 0 (`ACCESSORIES_HEADERS_OK files=2`); `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | header-only |
| CR-05-DECLARATIONS-016 | `src/accessories/customCharacteristics.ts` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/customCharacteristics.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/customCharacteristics.test.js` exit 0 (66 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | comment only: the class-factory comment states no count |
| CR-05-DECLARATIONS-017 | `src/accessories/customCharacteristics.ts` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/customCharacteristics.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/customCharacteristics.test.js` exit 0 (66 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | comment only: the format-names rationale is present tense; `uint32` paragraph unchanged |
| CR-05-DECLARATIONS-018 | `src/accessories/services.ts` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/services.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/services.test.js` exit 0 (12 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/services.ts test/accessories/services.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | comment only: the overview states that each subtype is its `ServiceKind` slug; `const enum` sentence kept |
| CR-05-DECLARATIONS-019 | `src/accessories/customServices.ts`, `test/accessories/customServices.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/customServices.ts test/accessories/customServices.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/customServices.test.js` exit 0 (28 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/customServices.ts test/accessories/customServices.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | JSDoc and one test title only: `optional` holds the facts declared but not constructed, beyond the three shared characteristics; case body unchanged |
| CR-05-DECLARATIONS-020 | `src/accessories/customServices.ts` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/customServices.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/customServices.test.js` exit 0 (28 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/customServices.ts test/accessories/customServices.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | comment only: the overview states the restored-cache repair in the present tense, with no release narration |
| CR-05-DECLARATIONS-005 | `test/accessories/alarmMute.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/alarmMute.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/alarmMute.test.js` exit 0 (3 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | A and B, see ## Assertion controls | owner filter dropped; the case compares `{ declaring, readsTheSourceTree }` with `{ declaring: ['accessories/alarmMute.ts'], readsTheSourceTree: true }`; `SOURCE_MODULE_FLOOR = 43` (measured: 43 `.ts` modules under `src/`); `OWNING_MODULE` removed as unused; title kept |
| CR-05-DECLARATIONS-010 | `test/accessories/alarmMute.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/alarmMute.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/alarmMute.test.js` exit 0 (3 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | `requests exactly true and nothing else for alarm mute` binds `requestedValue` under `// act` and asserts it under `// assert`; the expected `true` is unchanged |
| CR-05-DECLARATIONS-021 | `test/accessories/alarmMute.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/alarmMute.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/alarmMute.test.js` exit 0 (3 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | not resolved by the 005 commit; the pattern is renamed `CONSTANT_DECLARATION` and its comment states that it matches any CONSTANT_CASE declaration and that the scan keeps the names containing both `ALARM` and `MUTE`; regex and filter unchanged |
| CR-05-DECLARATIONS-022 | `test/accessories/alarmMute.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/alarmMute.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/alarmMute.test.js` exit 0 (3 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | a module-local `interface SourceModule { path; source }`; `sourceModules()` returns `Promise<readonly SourceModule[]>` and builds a `SourceModule[]` |
| CR-05-DECLARATIONS-011 | `test/accessories/services.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/services.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/services.test.js` exit 0 (12 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/services.ts test/accessories/services.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | all three markers split: the CONF-06 case binds `removableKinds`, and both data-row loops bind `recognised`, each under `// act`, then assert under `// assert`; expected values and titles unchanged |
| CR-05-DECLARATIONS-024 | `test/accessories/services.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/services.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/services.test.js` exit 0 (12 tests, 0 failures); `npm run test:coverage:direct -- src/accessories/services.ts test/accessories/services.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | `REMOVABLE_SENSOR_NAMES` is annotated `readonly string[]`; the seven literals and their order unchanged |
| CR-05-DECLARATIONS-001 | `test/accessories/customCharacteristics.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/customCharacteristics.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/customCharacteristics.test.js` exit 0 (50 tests, 0 failures; 66 before); `npm run test:coverage:direct -- src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | A, see ## Assertion controls | `CharacteristicExpectation` gains `uuid`; the 16 literals are copied by hand into `CHARACTERISTICS` (a text diff against the source literals is empty); `identifies ${name} with a fixed v4 identifier outside Apple's namespace` compares `{ typeUuid, instanceUuid, shape, appleNamespace }` with `{ typeUuid: uuid, instanceUuid: uuid, shape: true, appleNamespace: false }`; the set-size case becomes `identifies every vendor-defined characteristic distinctly by its published identifier`, one `deepStrictEqual` of the name-to-UUID `Map` against the table; the 16 `answers the same ${name} identifier to every caller` cases are removed (P-05-03: a pinned literal proves stability across calls and restarts, so their protection now lives in the per-row identity case and the map case); source literals unchanged (D-05) |
| CR-05-DECLARATIONS-012 | `test/accessories/customCharacteristics.test.ts` | as CR-05-DECLARATIONS-001 (same commit) | n/a (WARNING) | closed by the CR-05-DECLARATIONS-001 commit, which removes the `answers the same ${name} identifier to every caller` case that carried the combined marker; no other `// act & assert` marker remains in the file |
| CR-05-DECLARATIONS-003 | `test/accessories/customCharacteristics.test.ts` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/customCharacteristics.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/customCharacteristics.test.js` exit 0 (47 tests, 0 failures; 50 before); `npm run test:coverage:direct -- src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` exit 0; `node_modules/.bin/fallow audit --base 053599a80557aa513b2d354833196408b92a4438 --format json --quiet --explain` exit 0, verdict pass | A, see ## Assertion controls | every `CHARACTERISTICS` row gains a hand-written `domain` (`DomainExpectation`, all four members required): all four `undefined` on the 13 rows that declare none, and the declared values on `RawWaterLevelCode`, `BatteryHealthCode` and `ProtectionHoursCode`; the per-row case, retitled `declares ${name} as a read-only ${format} named ${displayName} with its exact value domain`, compares `{ displayName, format, perms, domain }` as one value; the `uint32` case compares `{ format, maxValue, minStep }` with `{ format: 'uint32', maxValue: undefined, minStep: undefined }` instead of reading `hap.Formats.UINT32`; three cases are folded away (P-05-03): `bounds the raw water level to the legal thermometer codes` and `bounds the two battery codes to the values the vendor can legally send` now live in the per-row case for `RawWaterLevelCode`, `BatteryHealthCode` and `ProtectionHoursCode`, and `declares no domain at all on a boolean characteristic` now lives in the per-row case for `MainsPowerPresent` and every other boolean row; the "legal codes" rationale moves to the table comment |

## Assertion controls

| ID | Control | Plausible wrong behavior | Mutation | Blob before | Failing assertion of the named case | Blob after, restoration |
| --- | --- | --- | --- | --- | --- | --- |
| CR-05-DECLARATIONS-005 | A | A second module under `src/` declares its own alarm-mute constant | Temporary untracked `src/accessories/temporaryMuteControl.ts` holding `export const ALARM_MUTE_SECONDS = 30;` (blob `773f14e4f0471ae448f3bf8dffeb8f4971e1b209`); `npm run build:test` exit 0 | `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0` | `node --test --test-name-pattern='is the only module under src that declares a constant governing alarm mute' dist-test/test/accessories/alarmMute.test.js` exit 1: `AssertionError [ERR_ASSERTION]`, actual `{ declaring: [ 'accessories/alarmMute.ts', 'accessories/temporaryMuteControl.ts' ], readsTheSourceTree: true }`, expected `{ declaring: [ 'accessories/alarmMute.ts' ], readsTheSourceTree: true }` | File deleted; `git status --porcelain -- src` empty; `src/accessories/alarmMute.ts` `d635ddde5e0ad1396941ba54e078b37a511697a0`; `git diff --exit-code -- src` exit 0; rebuilt (exit 0), the case passes (exit 0) |
| CR-05-DECLARATIONS-005 | B | The scan reads a tree with no `.ts` modules, so it examines nothing | In `test/accessories/alarmMute.test.ts` (the fixed, uncommitted bytes), the scan root `new URL('../../../src/', import.meta.url)` became `new URL('../../../.github/', import.meta.url)`, a directory with no `.ts` files; `npm run build:test` exit 0 | `test/accessories/alarmMute.test.ts` `8c4cb53358d9027f3dc7e0addf508a301a7929cc` | Same command, exit 1: `AssertionError [ERR_ASSERTION]`, actual `{ declaring: [], readsTheSourceTree: false }`, expected `{ declaring: [ 'accessories/alarmMute.ts' ], readsTheSourceTree: true }` | Fixed bytes copied back; `test/accessories/alarmMute.test.ts` `8c4cb53358d9027f3dc7e0addf508a301a7929cc`, equal to the recorded blob, so the committed bytes are the fixed version (`git diff --exit-code` does not apply before the commit; after commit `git diff --exit-code -- test/accessories/alarmMute.test.ts` exit 0); rebuilt (exit 0), the case passes (exit 0) |
| CR-05-DECLARATIONS-001 | A | Two published identifiers are swapped, so a cached accessory reads a running pump as a pump fault | In `src/accessories/customCharacteristics.ts`, the `PUMP_RUNNING_UUID` and `PUMP_FAULT_UUID` literals swapped (mutated blob `358f4b05658a5f48a90abefef7ac547e0ea04b8a`); `npm run build:test` exit 0 | `src/accessories/customCharacteristics.ts` `f9da27e6e8e9cf1ddd8931b6e087a488122df7b6` | `node --test dist-test/test/accessories/customCharacteristics.test.js` exit 1 (50 tests, 3 failures, each the intended `deepStrictEqual`): `identifies PumpRunning with a fixed v4 identifier outside Apple's namespace` `AssertionError [ERR_ASSERTION]`, actual `{ appleNamespace: false, instanceUuid: 'c4f90c81-f8a4-43b1-a12f-c3eba16f9bba', shape: true, typeUuid: 'c4f90c81-f8a4-43b1-a12f-c3eba16f9bba' }`, expected `{ appleNamespace: false, instanceUuid: '5b3a4ee5-cb3f-4fd5-ab25-13c886fd0ad6', shape: true, typeUuid: '5b3a4ee5-cb3f-4fd5-ab25-13c886fd0ad6' }`; the PumpFault case fails the mirror way; `identifies every vendor-defined characteristic distinctly by its published identifier` actual `'PumpRunning' => 'c4f90c81-f8a4-43b1-a12f-c3eba16f9bba'`, `'PumpFault' => '5b3a4ee5-cb3f-4fd5-ab25-13c886fd0ad6'`, expected the reverse | `git checkout -- src/accessories/customCharacteristics.ts`; blob `f9da27e6e8e9cf1ddd8931b6e087a488122df7b6`, equal to the recorded one; `git diff --exit-code -- src/accessories/customCharacteristics.ts` exit 0; rebuilt (exit 0), the owner test passes (exit 0, 50 tests, 0 failures) |
| CR-05-DECLARATIONS-003 | A | A copy-pasted clamping domain on the activation count, so HAP clamps a count past 255 and it stops advancing while it still reads as a fact | In `src/accessories/customCharacteristics.ts`, `domain: { maxValue: 255 },` added to the `ObservedActivationCount` definition (mutated blob `24f5686ee81a51b2332b49ec9f913d05e31e2f0e`); `npm run build:test` exit 0 | `src/accessories/customCharacteristics.ts` `f9da27e6e8e9cf1ddd8931b6e087a488122df7b6` | `node --test dist-test/test/accessories/customCharacteristics.test.js` exit 1 (47 tests, 2 failures, each the intended `deepStrictEqual`): `declares ObservedActivationCount as a read-only uint32 named Activations Observed Since Observation Start with its exact value domain` `AssertionError [ERR_ASSERTION]`, actual `{ displayName: 'Activations Observed Since Observation Start', format: 'uint32', perms: [ 'pr', 'ev' ], domain: { minValue: undefined, maxValue: 255, minStep: undefined, validValues: undefined } }`, expected `{ displayName: 'Activations Observed Since Observation Start', format: 'uint32', perms: [ 'pr', 'ev' ], domain: { minValue: undefined, maxValue: undefined, minStep: undefined, validValues: undefined } }`; `counts observed activations on a format wide enough that HAP cannot clamp the number` actual `{ format: 'uint32', maxValue: 255, minStep: undefined }`, expected `{ format: 'uint32', maxValue: undefined, minStep: undefined }` | `git checkout -- src/accessories/customCharacteristics.ts`; blob `f9da27e6e8e9cf1ddd8931b6e087a488122df7b6`, equal to the recorded one; `git diff --exit-code -- src/accessories/customCharacteristics.ts` exit 0; rebuilt (exit 0), the owner test passes (exit 0, 47 tests, 0 failures) |
