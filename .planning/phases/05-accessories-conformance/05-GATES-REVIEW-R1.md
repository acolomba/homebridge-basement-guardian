---
phase: 05-accessories-conformance
batch: GATES
review_round: 1
reviewed: 2026-10-18T15:26:11Z
depth: deep
source_revision: 37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069
files_reviewed: 8
files_reviewed_list:
  - test/accessories/timerFreedom.test.ts
  - test/accessories/hapImportScope.test.ts
  - test/accessories/accessoryReadPathScope.test.ts
  - test/accessories/hapWriteFidelity.test.ts
  - test/accessories/staticGateSources.ts
  - features/lib/hap.ts
  - features/step_definitions/controls.steps.ts
  - features/step_definitions/homekit.steps.ts
findings:
  blocker: 3
  warning: 3
  total: 6
status: issues_found
reviewer: gsd-code-reviewer
---

# Phase 5: GATES code review, correction round 1

**Source:** `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069`
**Depth:** deep
**Result:** issues_found

## Summary

Fresh full-file review covered the four gates, the new walker, and the three GATES adaptations. All 17 round-0 causes are repaired at their original sites. Six new causes remain: three can let a wrong implementation or failed read pass, and three violate the case or comment rules. The pinned real HAP is `@homebridge/hap-nodejs` 2.2.2; its `Characteristic.js:1683,1728-1733,1786-1787,1835-1838` confirms the repaired read and write behavior. The bounded `test/platform.test.ts` consumer hunk and enclosing `readOf`/`trustReadsOf` declarations were checked without adding that RECORDS path to `files_reviewed_list`.

## Findings

### CR-05-GATES-018 - BLOCKER: Importer floor again permits a missing file

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every case discriminates its claim; `.agents/skills/typescript-unit-tests/rules/review.md`, weak assertions; D-14 in `05-CONTEXT.md`.
**Location:** `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069:test/accessories/hapImportScope.test.ts:70-73,150-163`; `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069:test/accessories/staticGateSources.ts:18-27`.
**Issue:** The new walker raises the current `test` tree to 69 files. Its own enumeration reports `src=43`, `test=69`, `features=22`, total **134**, but the comment and `SOURCE_FILE_FLOOR` still say 133. An enumerator that omits one source file, including one with a forbidden HAP import, can pass the floor and single-importer assertion. This is a new count change caused by the helper addition, not a reopening of 003's omitted-features cause.
**Fix:** Recount after the helper addition, set the documented floor to 134, and retain the D-14 `>=` assertion. Plant a control that omits one enumerated file and fails the floor.
**Flags:** D-14; D-15.

### CR-05-GATES-019 - BLOCKER: Text import detectors miss valid forbidden imports

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, a plausible wrong implementation must fail; `.agents/skills/typescript-unit-tests/rules/review.md`, weak assertion; SAFE-07, SAFE-08 and RES-04 as stated in the gate overviews.
**Location:** `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069:test/accessories/timerFreedom.test.ts:57-71`; `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069:test/accessories/hapImportScope.test.ts:83-97`; `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069:test/accessories/accessoryReadPathScope.test.ts:94-107`.
**Issue:** All three detectors require whitespace immediately between `from` and the quote. TypeScript also accepts `from /* comment */ 'specifier'`. A read-only detector probe returned `false` for `import { Characteristic } from /* valid comment */ '@homebridge/hap-nodejs';`; the same syntax hides a timer or cloud import from the other gates. The HAP detector also returned `false` for the loadable subpath `@homebridge/hap-nodejs/dist/lib/Characteristic.js`, although Node resolved that subpath to `Characteristic`. Existing planted cases use only the regex's preferred spelling. A production module can therefore import the forbidden dependency while the gate stays green.
**Fix:** Parse import and re-export specifiers (and dynamic imports) with TypeScript, then compare the decoded specifier or package prefix. Add planted comment-interleaved imports for all three gates and a resolvable HAP subpath control.
**Flags:** D-16 static-gate controls; D-17 single-importer boundary.

### CR-05-GATES-020 - BLOCKER: Any read exception counts as the intended HomeKit refusal

**Rule:** `.agents/skills/cucumber/SKILL.md`, a scenario must fail when its named behavior breaks; `.agents/skills/cucumber/rules/steps.md`, `Then` asserts the observable outcome; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green classification.
**Location:** `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069:features/step_definitions/homekit.steps.ts:181-195,217-233`.
**Issue:** The adapted `readOutcome` now awaits the promise but catches **every** rejection and returns `refused`. If `handleGetRequest` rejects with a programming `TypeError` or another non-HAP failure, both "answers no read" steps can pass as though the plugin had deliberately marked the characteristic unavailable. Real HAP 2.2.2 rejects this stored-status branch with a numeric HAP status (`Characteristic.js:1728-1730`).
**Fix:** Catch `error: unknown`, return `refused` only for a numeric HAP status, and rethrow other failures. Add a discriminating scenario or focused test for a non-status rejection.
**Flags:** D-16; CR-05-GATES-017 adaptation, new cause rather than the former unawaited read.

### CR-05-GATES-021 - WARNING: New direct-read case asserts during arrange and act

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md`, Case structure (`// arrange`, `// act`, `// assert` in order; `// act & assert` only for one `assert.rejects()` or `assert.throws()`).
**Location:** `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069:test/accessories/hapWriteFidelity.test.ts:454-479`.
**Issue:** The new 017 parity case executes `assert.ok` and two `assert.rejects` calls in arrange, then `assert.doesNotThrow` in act. Its phase markers do not describe what the case actually does, even though the nine older 002 sites now have separate phases.
**Fix:** Put fixture writes in arrange, invoke `handleGetRequest()` directly under act (a synchronous throw already fails the test), and check both returned promises and their status rejections under assert.
**Flags:** S-05-01 recurrence at new lines; D-17 does not exempt case structure.

### CR-05-GATES-022 - WARNING: Read-step comment still describes a removed callback

**Rule:** `.agents/skills/typescript-style/rules/comments.md`, comments describe current code, not removed code.
**Location:** `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069:features/step_definitions/controls.steps.ts:231-237`.
**Issue:** The comment says an absent switch "raises from inside the callback", but 017 replaced the callback assertion with a direct awaited call. `publishedSwitch` throws before `handleGetRequest` is invoked.
**Fix:** State that `publishedSwitch` throws for an absent switch and the awaited read rejects for a stored HAP refusal.
**Flags:** CR-05-GATES-017 adaptation.

### CR-05-GATES-023 - WARNING: HAP source checks count string literals as executable use

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, discriminating controls; `.agents/skills/typescript-unit-tests/rules/review.md`, test reliability.
**Location:** `37d7db76bd2bbd5ff262ae6a083a3f05c0cb3069:test/accessories/hapImportScope.test.ts:99-110,209-218,220-265`.
**Issue:** `codeOf` now removes comments but deliberately retains string literals. The new planted case proves the output still contains `"HapStatusError"`. The later `occurrences(code, 'HapStatusError')` and `code.includes('onSet')` treat such a literal as executable use, so a harmless diagnostic string in an accessory module fails the safety gate. The planted case checks only printer output and never passes that output to the detectors.
**Fix:** Inspect TypeScript identifiers/member calls instead of substring counts, or exclude literal tokens while retaining the strings needed to identify `.on('set', ...)`. Add a planted string-literal negative control.
**Flags:** D-16 static-gate reliability.

## Round status

Opening open IDs: 17. Earlier fixed IDs from prior correction rounds: none. At this source revision, 17 are fixed, none rejected, six new IDs were found, and none reopened. Closing is `17 - 17 - 0 + 6 + 0 = 6`, so the D-03/D-18 result is **continue**. Open IDs are CR-05-GATES-018 through CR-05-GATES-023.

| Opening ID | Round-1 disposition and current evidence |
| --- | --- |
| CR-05-GATES-001 | Fixed: all four gate headers have SPDX, separate copyright and overview blocks at lines 1-9; header tracer exits 0. |
| CR-05-GATES-002 | Fixed: the nine original ordinary cases use separate act and assert phases. New case-structure cause 021 is at later added lines. |
| CR-05-GATES-003 | Fixed at its original 133-file tree: importer floor was raised from 104 and the omitted-features control was recorded. The subsequent helper addition makes today's count 134; new cause 018 records that change. |
| CR-05-GATES-004 | Fixed: read-path source floor and stated source count are 43, matching fresh recursive enumeration. |
| CR-05-GATES-005 | Fixed: timer overview now says three production modules under `src/`. |
| CR-05-GATES-006 | Fixed: microtask parity checks whole independently pinned record at lines 539-544. |
| CR-05-GATES-007 | Fixed: local resolver is `testRequire` at lines 57, 280-283 and 294-310. |
| CR-05-GATES-008 | Fixed: `manifestOwning` continues only on `ENOENT` and rethrows other errors at lines 138-151. |
| CR-05-GATES-009 | Fixed: `readManifest` narrows object, name, version and every dependency value at lines 97-129. |
| CR-05-GATES-010 | Fixed: host-declaration case is always registered and checks the 1.x legacy or 2.x scoped declaration at lines 289-319. Current installed host declares scoped 2.2.2. |
| CR-05-GATES-011 | Fixed: the stand-in-only `pushed` case is gone; real/fake push records remain at lines 521-624. |
| CR-05-GATES-012 | Fixed: no-handler parity checks real/fake and independent expected record at lines 334-345. |
| CR-05-GATES-013 | Fixed: two `onSet` registrations and independent accepted record are checked at lines 347-360. |
| CR-05-GATES-014 | Fixed: pending write parity checks prior, in-flight and settled records at lines 362-399; stand-in resets status at write entry, line 322. |
| CR-05-GATES-015 | Fixed: both source gates import the single walker in `staticGateSources.ts:18-27` and keep their own roots and detectors. |
| CR-05-GATES-016 | Fixed: TypeScript printer removes trailing comments, and planted control checks the resulting code at lines 209-218. New literal-token cause 023 is distinct. |
| CR-05-GATES-017 | Fixed: parity case checks direct read promises and their numeric refusal at lines 454-480; stand-in returns promises at `features/lib/hap.ts:348-355`; both Cucumber readers and the bounded platform consumer await reads. New 020 concerns overbroad rejection classification. |

The round-0 GATES seed and lead dispositions remain: S-05-01, 09-15 and the asynchronous part of 23 were confirmed and repaired; S-05-22 and the absent-characteristic part of 23 remain rejected under D-16 for the recorded consumer reasons. There were no preallocated GATES seeds. New 018 follows the later helper addition, while 019, 020 and 023 concern gate behaviors the prior controls did not discriminate.

## Header inspection

All eight inventory paths conform to D-01. The four gate headers and the new helper have SPDX, separate copyright and overview blocks. The three GATES feature adaptations have the same blocks. `05-ledger-tracer.mjs --headers --batch GATES` reports `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At the clean source revision above, with Node `v26.12.0` and `/opt/homebrew/opt/node/bin` first on PATH:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run build:test` | 0 | Compiled the current test and feature tree. |
| `npm run typecheck` | 0 | Source and test TypeScript checks. |
| `npm exec -- eslint <eight inventory paths plus test/platform.test.ts> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint. |
| `node --test dist-test/test/accessories/timerFreedom.test.js` | 0 | 3/3. |
| `node --test dist-test/test/accessories/hapImportScope.test.js` | 0 | 17/17. |
| `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | 0 | 5/5. |
| `node --test dist-test/test/accessories/hapWriteFidelity.test.js` | 0 | 21/21 against pinned real HAP 2.2.2. |
| `npm run --silent test:unpaired:compiled` | 0 | Repository unpaired suite; quiet reporter. |
| `node --test dist-test/test/platform.test.js` | 0 | 70/70 bounded consumer owner tests; run with loopback access. |
| `cucumber-js --format progress` | 0 | 104/104 scenarios and 1156/1156 steps; run with loopback access. |
| `cucumber-js --dry-run --format usage` | 0 | Usage scan found no `UNUSED`, undefined or ambiguous step. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | `ACCESSORIES_HEADERS_OK files=8`. |

The first sandboxed Cucumber invocation encountered `listen EPERM 127.0.0.1` in fake local servers (98 failed, six passed), then required interruption (raw exit 130). The read-only rerun with loopback access exited 0; this is an environment restriction, not a source finding. No isolated pair coverage applies to the four repository gates (D-17). The three feature adaptations and platform consumer passed their owner checks, but this round did not claim a full `npm run check` gate.

## Out-of-scope observations

`test/platform.test.ts` is the RECORDS adaptation listed as inventory row 26. Its changed `readOf`, `trustReadsOf` and seven callers now await the HAP read; the bounded owner test passes. The rest of that file remains outside this GATES sweep. The current fidelity suite executes against the pinned 2.x host/HAP pair; its 1.x manifest branch validates declarations but does not establish HAP 1.x behavioral parity, which belongs to the compatibility gate.

No source or test file was edited in this review. No mutation experiment or commit was performed.

## Coordinator triage

Accepted CR-05-GATES-018 through CR-05-GATES-023 as open. The file count, import syntax,
read-refusal classification, case phases, comment, and literal-token evidence each matches the
cited rule and a concrete current-tree behavior. Confirmed CR-05-GATES-001 through 017 fixed at
their original causes; the six new IDs describe later or distinct causes and none reopens a fixed
ID. Opening 17, fixed 17, rejected 0, new 6, reopened 0, closing 6: continue under D-03/D-18.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-GATES-018 | `test/accessories/hapImportScope.test.ts`, this report | Node v26.12.0: `fallow guard` on both paths exit 0; recursive counts `src=43`, `test=69`, `features=22`, total 134; initial and restored `npm run build:test` exit 0; four compiled owners exit 0 (3, 17, 5, and 21 passed); `npm run test:unpaired` exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` exit 0, verdict pass | Omitting `test/accessories/staticGateSources.ts` left 133 enumerated files. The named importer case exited 1 on the intended `files.length >= SOURCE_FILE_FLOOR` assertion; before and after the control, the post-fix source hash was `d2f722d7fb9e4e7688ec3e69c9a4529edbe6f931`. The restored named case exited 0. | Raised the floor and count comment to 134 while retaining `>=`. Verification ran in the main checkout. |
| CR-05-GATES-019 | Three import gates, `test/accessories/staticGateSources.ts`, this report | Node v26.12.0: `fallow guard` on five paths exit 0; `npm run build:test` exit 0; four compiled owners exit 0 (46 passed); restored planted controls exit 0 (3 passed); `npm run test:unpaired` with temporary npm cache exit 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` exit 0, verdict pass | The old whitespace-only import detector made all three planted comment-interleaved import assertions fail (build 0, named tests 1). Restored helper hash `12327d3d629cf3628ab6fa7b4cd00ae1d2dd84c7`; named tests passed. An exact-only HAP package comparison made only the planted subpath assertion fail (build 0, named test 1). Restored HAP gate hash `86c094cf8f2a18ec83d5496f00cf9acb88fec811`; named test passed. Controls were never staged. | Shared TypeScript parser reads static import, re-export and dynamic import specifiers. Each gate matches its own forbidden paths. Verification ran in the main checkout. |

---

_Reviewed: 2026-10-18T15:26:11Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
