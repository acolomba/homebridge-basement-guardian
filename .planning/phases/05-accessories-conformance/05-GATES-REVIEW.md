---
phase: 05-accessories-conformance
batch: GATES
review_round: 0
reviewed: 2026-10-18T13:55:00Z
depth: deep
source_revision: 379e86772fb2f353abbbe9c35dc3aa502bbb68f9
files_reviewed: 4
files_reviewed_list:
  - test/accessories/timerFreedom.test.ts
  - test/accessories/hapImportScope.test.ts
  - test/accessories/accessoryReadPathScope.test.ts
  - test/accessories/hapWriteFidelity.test.ts
findings:
  blocker: 9
  warning: 8
  total: 17
status: issues_found
reviewer: gsd-code-reviewer
---

# Phase 05: GATES code review, round 0

All four unpaired gate tests were read in full at the recorded batch base. The static gates' source readers, planted controls, and tree floors were checked against the current tree. The fidelity cases were traced through the stand-in, the accessory consumers, and pinned HAP 2.2.2. Passing tests do not settle the findings below.

## Findings

### CR-05-GATES-001 - WARNING: Four gate files lack the approved header

**Rule:** D-01 in `05-CONTEXT.md`; `.agents/skills/typescript-style/rules/modules-and-data.md`, Files and modules.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/timerFreedom.test.ts:1`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:1`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:1`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:1`.
**Issue:** Each starts at its overview; none has the SPDX line or separate copyright block. The header tracer exits 1 for exactly these four paths.
**Fix:** Add the approved SPDX line and separate copyright JSDoc before each existing overview, matching `test/accessories/reconciliation.test.ts:1-9`.
**Flags:** D-01.

### CR-05-GATES-002 - WARNING: Nine cases combine act and assert outside the permitted form

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md`, Case structure (`// act & assert` is only for one `assert.rejects()` or `assert.throws()`).
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/timerFreedom.test.ts:113-135`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:170-210`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:206-235`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:260-267`.
**Issue:** Two, three, three and one cases respectively mark ordinary `deepStrictEqual` or `strictEqual` as `// act & assert`; several also calculate the observed record inside the assertion.
**Fix:** Evaluate each detector or record under `// act`, then compare under `// assert`, keeping all existing expected values.
**Flags:** S-05-01; D-17 does not exempt case structure.

### CR-05-GATES-003 - BLOCKER: HAP importer floor permits omitting the features tree

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every case discriminates its claim; `.agents/skills/typescript-unit-tests/rules/review.md`, weak assertion; D-14.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:57-63,154-168`.
**Issue:** The gate claims to search `src`, `test` and `features`, but the floor is 104 while the current counts are 43, 68 and 22, total 133. A faulty enumeration that omits all 22 feature files still sees 111, passes `>= 104`, and can miss a forbidden importer in `features/`. The comment's exact count is also false.
**Fix:** Recount by this gate's recursive `.ts` enumeration, raise `SOURCE_FILE_FLOOR` to 133, and state the current total accurately. Keep `>=` as D-14 requires.
**Flags:** S-05-09; D-14.

### CR-05-GATES-004 - BLOCKER: Read-path source floor is stale and weak

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every case discriminates its claim; `.agents/skills/typescript-unit-tests/rules/review.md`, weak assertion; D-14.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:69-76,190-204`.
**Issue:** `src` now has 43 recursively enumerated TypeScript files, but the comment says forty and the floor remains 40. An enumeration that misses three production modules passes, so a read handler in those modules can evade this safety gate.
**Fix:** Recount with `typeScriptFilesUnder('src')`, set `SOURCE_MODULE_FLOOR` to 43, update the comment, and preserve `>=`.
**Flags:** S-05-09; D-14.

### CR-05-GATES-005 - WARNING: Deferred-import overview states the wrong scope

**Rule:** `.agents/skills/typescript-style/rules/comments.md`, Comments describe current code accurately.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/timerFreedom.test.ts:13-17`.
**Issue:** Three `src/` modules import `node:timers/promises`, but the sentence says three modules in the repository. Test and feature files import it too.
**Fix:** Say "Three production modules under `src/` already import that form" or remove the count.
**Flags:** S-05-10.

### CR-05-GATES-006 - BLOCKER: Microtask parity case leaves two record fields unchecked

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md`, Assertions (compare whole values; standalone negative assertions are weak); `.agents/skills/typescript-unit-tests/rules/review.md`, Classifying findings.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:375-396`.
**Issue:** `notStrictEqual(statusCode, 0)` is redundant with the next assertion. The case compares real and stand-in records but pins only `statusCode`; both could wrongly clear the held value or change `rejectedWith` and still pass.
**Fix:** Compare the full real record with an independently written `{ rejectedWith: undefined, value: true, statusCode: HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE }`, while retaining whole-record real/fake parity.
**Flags:** S-05-11; D-16.

### CR-05-GATES-007 - WARNING: Local require binding uses a suffix forbidden by naming rules

**Rule:** `.agents/skills/typescript-style/rules/naming-and-docs.md`, Naming (no `_` suffix).
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:51,243-246,258`.
**Issue:** `require_` encodes a naming workaround rather than its role.
**Fix:** Rename it `testRequire` or `moduleRequire` at its use sites.
**Flags:** S-05-12.

### CR-05-GATES-008 - WARNING: Manifest search uses an unbound catch

**Rule:** `.agents/skills/typescript-style/rules/functions.md`, Errors (catches read `catch (error: unknown)`); `.agents/skills/typescript-style/SKILL.md`, Classifying findings.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:103-116`.
**Issue:** `catch {}` treats every failure from JSON reading and parsing as absence of a manifest. A malformed installed manifest is silently skipped and reported later as if the package were missing.
**Fix:** Catch `error: unknown`; continue only for a missing file and rethrow malformed JSON or other file errors. Keep the search bounded.
**Flags:** S-05-12.

### CR-05-GATES-009 - BLOCKER: Manifest cast can hide invalid installed metadata

**Rule:** `.agents/skills/typescript-style/rules/types.md`, Types (`as` only with an obvious or commented reason, prefer a runtime check); `.agents/skills/typescript-style/SKILL.md`, Classifying findings.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:85-95`.
**Issue:** JSON is `unknown`, then asserted to `InstalledManifest` with no check or rationale. A wrong shape can make the conditional host-version case disappear, allowing the suite to report green without checking the declared HAP version.
**Fix:** Narrow the parsed object and its `name`, `version`, and `dependencies` fields at runtime, or state and prove a valid reason for the assertion; fail a malformed manifest.
**Flags:** S-05-12; D-16.

### CR-05-GATES-010 - BLOCKER: Host-version case is conditionally absent

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md`, Case structure (do not commit skipped cases); `.agents/skills/typescript-unit-tests/rules/review.md`, Classifying findings (a suite that silently omits a case lies).
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:252-268`.
**Issue:** When Homebridge does not declare the scoped HAP package, no test is registered. This makes the fidelity suite look fully run despite not checking which HAP line the host uses. The project's Homebridge 1.x compatibility makes this reachable.
**Fix:** Always register a case. Assert the applicable contract for each host line inside it, including the explicit legacy-package expectation for 1.x; make an unsupported declaration fail rather than omitting the case.
**Flags:** S-05-13; D-16.

### CR-05-GATES-011 - WARNING: One fidelity case tests only the stand-in

**Rule:** `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md`, test support needs no meta-tests; D-13 and D-16.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:477-494`.
**Issue:** The `pushed` flag has no real-HAP counterpart. This case checks an internal stand-in marker alone, so it cannot establish HAP fidelity and adds a meta-test of test support.
**Fix:** Remove this case with a ledger reason; retain the existing real/fake pushed-error record cases that protect public write behavior.
**Flags:** S-05-14; D-13; D-16.

### CR-05-GATES-012 - BLOCKER: No parity case covers a write without a handler

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every promised behavior gets a discriminating case; D-16.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:270-281` (handler installed in the only accepted-write case); `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:316-322` (read-only reference).
**Issue:** Real HAP's no-handler branch stores the requested value and succeeds (`Characteristic.js:1835-1838`), which restored-control refusal exists to prevent (`src/accessories/staleMarking.ts:34-39`; `src/accessories/controls.ts:43-50`). No parity case detects a stand-in disagreement in this branch.
**Fix:** Add one same-script real/fake no-handler write case comparing both complete records and an independent expected record.
**Flags:** S-05-15 gap 1; D-16.

### CR-05-GATES-013 - BLOCKER: No parity case covers replacing an onSet handler

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, discriminating boundary cases; D-16.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:60-83,270-396` (each script installs at most one handler); `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:303-307` (read-only reference).
**Issue:** Real HAP replaces its single handler at `Characteristic.js:1346-1352`. The restored refusal must be replaced by the live binder (`src/accessories/controls.ts:43-53,463-475,634-642`), but no parity case exercises two `onSet` registrations.
**Fix:** Add one same-script case that registers a refusal, then an accepting handler, writes, and compares complete real/fake records and the independent accepted result.
**Flags:** S-05-15 gap 2; D-16.

### CR-05-GATES-014 - BLOCKER: No parity case observes status at write entry

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, discriminating boundary cases; D-16.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:321-350,354-396` (observations only after write settlement); `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:316-335` (read-only reference).
**Issue:** Pinned real HAP resets `statusCode` to zero at entry to `handleSetRequest` (`Characteristic.js:1786-1787`); the stand-in clears it only after handler success. After a prior refusal, a read while the next command is in flight can therefore disagree. The control handler awaits a command (`src/accessories/controls.ts:618-626`), so this interval is reachable. Every existing case observes only settled writes.
**Fix:** Add one parity case with a controlled pending handler and a previously stored refusal; compare the complete in-flight and settled observations on both implementations. Change the stand-in only after the unchanged stand-in fails this confirmed case under D-04.
**Flags:** S-05-15 gap 3; D-04; D-12; D-16.

### CR-05-GATES-015 - WARNING: Recursive TypeScript enumeration is duplicated in two static gates

**Rule:** D-15 in `05-CONTEXT.md` (extract only after confirmed duplication); `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md`, Test support organization.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:89-101`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:118-130`.
**Issue:** The same recursive repository-relative `.ts` walk is copied line for line. These gates depend on identical traversal semantics; a future fix to one can leave the other silently narrower.
**Fix:** Extract only this walker into `test/accessories/staticGateSources.ts`, keeping each gate's own roots, floors, and planted controls.
**Flags:** D-15 confirmed duplication.

### CR-05-GATES-016 - WARNING: Comment stripper leaves trailing line comments in scanned code

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, discriminating controls; `.agents/skills/typescript-style/rules/comments.md`, comments must describe actual behavior.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:103-110,213-233`.
**Issue:** `codeOf` claims to remove comments but `^\s*//.*$` removes only whole-line comments. A valid trailing comment such as `const x = 1; // HapStatusError` remains and increments `occurrences`, producing a false gate failure. Its planted negative controls exercise import prose only.
**Fix:** Strip trailing line comments without changing string literals, preferably by scanning TypeScript tokens, and plant a trailing-comment negative control for this detector.
**Flags:** D-16 does not apply; static-gate robustness.

### CR-05-GATES-017 - BLOCKER: Fidelity wrapper hides synchronous versus asynchronous read refusal

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every case must discriminate the behavior it names; `.agents/skills/typescript-unit-tests/rules/cases.md`, Assertions (await every promise); D-16.
**Location:** `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:63-67,149-150,183-184,321-334`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:210-211,341-348` (read-only reference).
**Issue:** Pinned HAP declares `async handleGetRequest` and rejects its promise for a stored status (`Characteristic.js:1683,1728-1730`). The stand-in throws synchronously. `fakeSubject.get` wraps the call in `Promise.resolve(...)` inside the `recorded` driver, so existing parity records erase the difference. Cucumber read checks at `features/step_definitions/controls.steps.ts:228-232` and `features/step_definitions/homekit.steps.ts:175-189` use synchronous `doesNotThrow` or `try/catch`; they can report an answered read when real HAP would reject. This is a false-green safety assertion, even though production lets HAP serve reads.
**Fix:** Add one parity case that calls `handleGetRequest` directly on both implementations and asserts that each returns a promise which rejects with the complete expected status; do not normalize a synchronous throw in the parity harness. Apply any stand-in adaptation only after D-04 RED evidence against unchanged support code, and repair the affected Cucumber read assertions in the owning features phase.
**Flags:** S-05-23 read-refusal gap; D-04; D-12; D-16. The Cucumber step definitions are out of this review's edit scope.

## Seed and lead dispositions

| Lead | Disposition | Evidence |
| --- | --- | --- |
| S-05-01 GATES | Confirmed, CR-05-GATES-002 | Nine forbidden `// act & assert` markers: 2 timer, 3 importer, 3 read path, 1 fidelity. |
| S-05-09 | Confirmed, CR-05-GATES-003 and 004 | Recursive counts are src 43, test 68, features 22, all 133; src/accessories 10. Importer 104 and read-path src 40 are stale; accessory floors 10 are current. |
| S-05-10 | Confirmed, CR-05-GATES-005 | The three named imports are in src; repository tests and features also import the promises form. |
| S-05-11 | Confirmed, CR-05-GATES-006 | The redundant negative and partial real-record assertion remain at 394-395. |
| S-05-12 | Confirmed, CR-05-GATES-007 to 009 | All three cited forms remain at 51, 112, and 94. |
| S-05-13 | Confirmed, CR-05-GATES-010 | Registration remains inside the condition at 260-268. |
| S-05-14 | Confirmed, CR-05-GATES-011 | The case reads only `FAKE` and its `pushed` marker. |
| S-05-15 gap 1 | Confirmed, CR-05-GATES-012 | Real no-handler branch and plugin restart behavior are documented; no parity script omits `onSet`. |
| S-05-15 gap 2 | Confirmed, CR-05-GATES-013 | Real setter is a single slot; no parity script installs two handlers. |
| S-05-15 gap 3 | Confirmed, CR-05-GATES-014 | Real HAP resets status at entry; stand-in waits for success; command handler can remain pending. |
| S-05-22 construction default | Rejected under D-16 | The base mismatch exists (`Characteristic.js:1275,1294-1303`; `features/lib/hap.ts:300`), but real generated characteristic classes assign `getDefaultValue()` in their own constructors and every plugin custom characteristic does so at `src/accessories/customCharacteristics.ts:153-163`. No plugin consumer relies on a bare base characteristic's initial value. A base-only parity case would test support behavior outside the plugin's contract. |
| S-05-23 asynchronous read refusal | Confirmed, CR-05-GATES-017 | Real `handleGetRequest` rejects asynchronously; stand-in throws synchronously. Existing fidelity `recorded` normalizes both, while Cucumber read assertions use synchronous exception checks. |
| S-05-23 absent-characteristic lookup | Rejected under D-16 | Real `Service.getCharacteristic` creates a missing class (`Service.js:472-499`) and stand-in returns `undefined` (`features/lib/hap.ts:483-488`). Production callers either use required `On`, guard with `testCharacteristic` (`serviceCatalogue.ts:1043`), or call `declareCharacteristic` before a write (`serviceCatalogue.ts:964-977`). No plugin behavior relies on creation by an unguarded lookup, so this does not justify a parity case. |

No preallocated GATES seeds exist. The new header, duplication, and trailing-comment findings arose from full-file review. The static planted-positive and planted-negative cases pass, but they do not cover the floor omissions or trailing-comment example. The importer gate currently finds exactly `test/accessories/hapWriteFidelity.test.ts`; the read-path gate finds no vendor import or read handler; timerFreedom finds no accessory deferred-execution import.

## Rule applicability

All 16 ledger proposals are confirmed as N/A, with the following row-specific reasons. Other unit test, style, and comment rules continue to apply.

| Gate | Rule | Decision and reason |
| --- | --- | --- |
| timerFreedom | Mirrored source pairing | N/A: unpaired repository gate with no source module; `repositoryTests` lists it. |
| timerFreedom | One `describe()` per exported entrypoint | N/A: it exports no production entrypoint. |
| timerFreedom | Isolated direct coverage | N/A: it owns no `src/` module; the pair selector rejects it. |
| hapImportScope | Mirrored source pairing | N/A: unpaired repository gate with no source module; `repositoryTests` lists it. |
| hapImportScope | One `describe()` per exported entrypoint | N/A: it exports no production entrypoint. |
| hapImportScope | Isolated direct coverage | N/A: it owns no `src/` module; the pair selector rejects it. |
| accessoryReadPathScope | Mirrored source pairing | N/A: unpaired repository gate with no source module; `repositoryTests` lists it. |
| accessoryReadPathScope | One `describe()` per exported entrypoint | N/A: it exports no production entrypoint. |
| accessoryReadPathScope | Isolated direct coverage | N/A: it owns no `src/` module; the pair selector rejects it. |
| hapWriteFidelity | Mirrored source pairing | N/A: unpaired repository gate with no source module; `repositoryTests` lists it. |
| hapWriteFidelity | One `describe()` per exported entrypoint | N/A: it exports no production entrypoint. |
| hapWriteFidelity | Isolated direct coverage | N/A: it owns no `src/` module; the pair selector rejects it. |
| timerFreedom | Whole-value assertion for `ACCESSORIES_MODULE_FLOOR` | N/A: D-14 deliberately uses a `>=` lower bound, current count 10 and floor 10. |
| hapImportScope | Whole-value assertion for `SOURCE_FILE_FLOOR` | N/A: D-14 deliberately uses a `>=` lower bound; its current floor 104 is separately defective against count 133 (003). |
| accessoryReadPathScope | Whole-value assertion for `ACCESSORIES_MODULE_FLOOR` | N/A: D-14 deliberately uses a `>=` lower bound, current count 10 and floor 10. |
| accessoryReadPathScope | Whole-value assertion for `SOURCE_MODULE_FLOOR` | N/A: D-14 deliberately uses a `>=` lower bound; its current floor 40 is separately defective against count 43 (004). |

## Header inspection

All four reviewed files begin with the overview JSDoc at line 1. Each lacks the D-01 SPDX and separate copyright blocks. `05-ledger-tracer.mjs --headers --batch GATES` exits 1 and reports all four at line 1. CR-05-GATES-001 covers the four-file repair.

## Toolchain evidence

At batch base `379e86772fb2f353abbbe9c35dc3aa502bbb68f9` (current HEAD `c2198a49477e8b69067bf28bfd1c3eba2d0a21c0` differs only by a planning-record commit for the gates), with Node `v26.12.0`, npm `11.20.0`, PATH prefixed by `/opt/homebrew/opt/node/bin`, and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Result |
| --- | ---: | --- |
| `npm run build:test` | 0 | Compiled test tree. |
| `node --test dist-test/test/accessories/timerFreedom.test.js` | 0 | 3/3 passed. |
| `node --test dist-test/test/accessories/hapImportScope.test.js` | 0 | 16/16 passed. |
| `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | 0 | 5/5 passed. |
| `node --test dist-test/test/accessories/hapWriteFidelity.test.js` | 0 | 18/18 passed. |
| `npm run test:unpaired` | 0 | Unpaired suite passed; quiet reporter emitted no per-case count. |
| `npm run typecheck` | 0 | Source and test TypeScript passed. |
| `npm exec -- eslint . --max-warnings=0 --no-cache` | 0 | Fresh uncached lint passed. |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch GATES` | 1 | Expected RED: four missing headers. |

The initial combined owner invocation also exited 0 with 42/42 cases passed. An initial shell loop failed before executing its intended per-owner list because `status` is a read-only zsh variable; the corrected loop above ran and recorded every raw owner exit. No direct coverage selector was run for these four repository tests, in accordance with D-17.

## Out-of-scope observations

`features/lib/hap.ts:316-335` differs from pinned HAP at write entry. This is a bounded Phase 7 stand-in adaptation only if the new gap-3 parity case first fails against unchanged stand-in under D-04 and the coordinator records the D-12 inventory and RED evidence. No source or support file was changed in this review.

## Repair history

Coordinator and fixers append cause-specific repair commits, checks, and correction-round results here after triage. No repair was performed in round 0.

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-GATES-001 | `test/accessories/timerFreedom.test.ts`, `test/accessories/hapImportScope.test.ts`, `test/accessories/accessoryReadPathScope.test.ts`, `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard` on the five paths exit 0; `npm run build:test` exit 0; four owner tests exit 0 (3, 16, 5, and 18 passed); `npm run test:unpaired` exit 0; `node_modules/.bin/fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` exit 0, verdict pass; `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch GATES` exit 0 (`ACCESSORIES_HEADERS_OK files=4`) | n/a (WARNING) | Added the approved SPDX line and separate copyright block above each unchanged overview. Verification ran in the main checkout. |
| CR-05-GATES-002 | `test/accessories/timerFreedom.test.ts`, `test/accessories/hapImportScope.test.ts`, `test/accessories/accessoryReadPathScope.test.ts`, `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard` on the five paths exit 0; `npm run build:test` exit 0; four owner tests exit 0 (3, 16, 5, and 18 passed); `npm run test:unpaired` exit 0; `node_modules/.bin/fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` first exit 2 in the sandbox, then exit 0 with verdict pass outside it | n/a (WARNING) | Separated action from assertion in nine cases and observed each calculated value before comparing it. The audit needed access to Git metadata to create its temporary base snapshot. Verification ran in the main checkout. |
| CR-05-GATES-005 | `test/accessories/timerFreedom.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard` on both paths exit 0; `npm run build:test` exit 0; four owner tests exit 0 (3, 16, 5, and 18 passed); `npm run test:unpaired` exit 0; `node_modules/.bin/fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | Corrected the overview to count the three production imports under `src/`. Test logic is unchanged. Verification ran in the main checkout. |
| CR-05-GATES-003 | `test/accessories/hapImportScope.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard` on both paths exit 0; recursive counts `src=43`, `test=68`, `features=22`, total 133; control `npm run build:test` exit 0 and named importer test exit 1 at 111 files; restored `npm run build:test` exit 0; four owner tests exit 0 (3, 16, 5, and 18 passed); `npm run test:unpaired` exit 0; `node_modules/.bin/fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` exit 0, verdict pass | Omitting `features` from enumeration failed the intended file-floor assertion. Restored file hash `a9b575acfdb7c7729fbd4725f5daae98f91ade84` matched the pre-control hash. The restored owner test passed. | Raised the lower bound to 133 and corrected its count comment. Verification ran in the main checkout. |
| CR-05-GATES-004 | `test/accessories/accessoryReadPathScope.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard` on both paths exit 0; recursive `src` count 43; initial `npm run build:test` exit 0; control build exit 0 and named read-handler test exit 1 at 40 files; restored build exit 0; four owner tests exit 0 (3, 17, 5, and 18 passed); `npm run test:unpaired` exit 0; `node_modules/.bin/fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` exit 0, verdict pass | Omitting three `src/runtime/` modules failed the intended floor assertion. Restored file hash `5c34460a49073b8b65de639a6af7a64d3689de31` matched the pre-control hash, and the restored owner test passed. | Raised the source floor to 43 and corrected its count comment. Verification ran in the main checkout. |
| CR-05-GATES-015 | `test/accessories/hapImportScope.test.ts`, `test/accessories/accessoryReadPathScope.test.ts`, `test/accessories/staticGateSources.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard` on the four paths exit 0; `npm run build:test` exit 0; four compiled owners exit 0 (3, 17, 5, and 18 passed); `npm run test:unpaired` exit 0; `node_modules/.bin/fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | Moved the identical recursive TypeScript path walk into one D-01 test helper. Both gates retain their roots, floors, detectors and planted cases. Verification ran in the main checkout. |
| CR-05-GATES-016 | `test/accessories/hapImportScope.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard` on both paths exit 0; `npm run build:test` exit 0; planted named case exit 0; old-stripper control first build exit 2 due unused parser import, then build exit 0 after removing that import and named case exit 1 on its intended assertion; restored build exit 0; four owner tests exit 0 (3, 17, 5, and 18 passed); `npm run test:unpaired` exit 0; `node_modules/.bin/fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` exit 0, verdict pass | The planted case rejects the old stripper because it leaves a trailing comment. Restored file hash `b606a885c562eb2a1dcc4e5b248b095348dc0d5a` matched the pre-control hash. | Used the TypeScript parser to remove comments while preserving string literals. Verification ran in the main checkout. |
| CR-05-GATES-006 | `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `fallow guard` exit 0; `npm run build:test` exit 0; four compiled owners exit 0; `npm run test:unpaired` exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exit 0, verdict pass | The expected record is independently pinned and whole real/fake parity remains. | Removed the redundant negative and compared all three fields after the microtask. Verification ran in the main checkout. |
| CR-05-GATES-007 | `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `fallow guard` exit 0; `npm run build:test` exit 0; four compiled owners exit 0; `npm run test:unpaired` exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exit 0, verdict pass | n/a (WARNING) | Renamed the local module resolver to `testRequire` at every use. Verification ran in the main checkout. |
| CR-05-GATES-008 | `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `fallow guard` exit 0; `npm run build:test` exit 0; four compiled owners exit 0; `npm run test:unpaired` exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exit 0, verdict pass | n/a (WARNING) | The manifest walk continues only for `ENOENT`; it rethrows malformed JSON and other read failures. Verification ran in the main checkout. |
| CR-05-GATES-009 | `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: initial `npm run build:test` exit 2 and `npm run test:unpaired` exit 2 from exact optional property typing; source rolled back. Corrected attempt: `fallow guard` exit 0; `npm run build:test` exit 0; four compiled owners exit 0; `npm run test:unpaired` exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exit 0, verdict pass | Whole parsed object, `name`, `version`, and every dependency declaration are checked before use. | Replaced the unchecked manifest assertion with runtime narrowing; the failed first attempt was rolled back before retry. Verification ran in the main checkout. |
| CR-05-GATES-010 | `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `fallow guard` exit 0; `npm run build:test` exit 0; four compiled owners exit 0; `npm run test:unpaired` exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exit 0, verdict pass | A registered case checks the installed 2.x scoped declaration, the 1.x legacy declaration, and rejects other host lines. | Removed conditional case registration so an unsupported host cannot silently omit this check. Verification ran in the main checkout. |
| CR-05-GATES-011 | `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `fallow guard` exit 0; `npm run build:test` exit 0; four compiled owners exit 0; `npm run test:unpaired` exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exit 0, verdict pass | The four surrounding real/fake error-push cases remain and pass. | Removed the private `pushed` flag case, which had no real HAP counterpart. Verification ran in the main checkout. |
| CR-05-GATES-012 | `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `fallow guard` exit 0; `npm run build:test` exit 0; four compiled owners exit 0 (3, 17, 5, and 18 passed); `npm run test:unpaired` exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exit 0, verdict pass | Inverting the value passed to the stand-in write made the named case exit 1 on its whole-record comparison (`false` versus `true`). The restored source hash matched the pre-control hash `5ab8e7315730c218fe4991603357aa592858c9ed`; the named case then passed. | A write with no handler now checks complete real and stand-in records and an independently stated successful result. Verification ran in the main checkout. |
| CR-05-GATES-013 | `test/accessories/hapWriteFidelity.test.ts`, `.planning/phases/05-accessories-conformance/05-GATES-REVIEW.md` | Node v26.12.0: `fallow guard` exit 0; `npm run build:test` exit 0; four compiled owners exit 0 (3, 17, 5, and 19 passed); `npm run test:unpaired` exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exit 0, verdict pass | Making the stand-in wrapper keep only its first handler made the named case exit 1 on its whole-record comparison (real accepted `true` with status `0`; stand-in refused with `-70412` and held `false`). The restored source hash matched the pre-control hash `db24a381d3dd197566d69ea6bd1e9392fa3dcf1f`; the named case then passed. | A refusal handler followed by an accepting handler now checks complete real and stand-in records and an independently stated accepted result. Verification ran in the main checkout. |

## Coordinator triage

Accepted CR-05-GATES-001 through CR-05-GATES-017 as open. Each cites an applicable unit-test or TypeScript rule, the batch-base location, and a concrete repair. The four missing headers are one cause under 001. The three S-05-15 gaps are separately confirmed as 012, 013, and 014. S-05-22 is rejected under D-16 because the plugin does not rely on bare base-characteristic defaults. S-05-23 is split: asynchronous read refusal is confirmed as 017; absent-characteristic lookup is rejected under D-16 because the plugin guards or declares that lookup. All other GATES leads are confirmed by the IDs in the lead table. The 16 proposed rule-applicability rows are confirmed as N/A for the row-specific reasons above.
