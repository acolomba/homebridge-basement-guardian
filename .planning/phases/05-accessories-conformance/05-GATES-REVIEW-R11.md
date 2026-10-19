---
phase: 05-accessories-conformance
batch: GATES
review_round: 11
reviewed: 2026-10-19T00:00:21Z
depth: deep
source_revision: e9be066e965e4219bdf0dacb616c4aa4c43a2b66
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
  blocker: 4
  warning: 0
  total: 4
status: issues_found
reviewer: gsd-code-reviewer
---

# Phase 5: GATES code review, correction round 11

**Source:** `e9be066e965e4219bdf0dacb616c4aa4c43a2b66`
**Depth:** deep
**Result:** issues_found

## Summary

I read every line of the five GATES test and support files, then reviewed the GATES adaptation hunks and enclosing declarations in the three Phase 7 files. All four opening causes are fixed. Four different valid source forms still escape the static gates. The closing count remains four, so D-03 requires `STOP: no progress` even with the amended fifteen-round GATES cap.

## Findings

### CR-05-GATES-062 - BLOCKER: Parentheses around a creator or loader hide a module load

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate its claim) and `.agents/skills/typescript-unit-tests/rules/review.md` (a false-green gate is a BLOCKER); SAFE-07, SAFE-08 and RES-04.
**Location:** `e9be066e965e4219bdf0dacb616c4aa4c43a2b66:test/accessories/staticGateSources.ts:123-151,234-257,286-301,367-372`; callers at `test/accessories/timerFreedom.test.ts:59-66`, `test/accessories/hapImportScope.test.ts:112-114` and `test/accessories/accessoryReadPathScope.test.ts:116-126`.
**Issue:** Creator alias, creator-call and loader-binding detection does not unwrap `ParenthesizedExpression`. A read-only compiled-helper probe returned only `node:module` for each of `const make = (module.createRequire); const load = make(import.meta.url); load('node:timers/promises')`, `const load = (createRequire(import.meta.url)); load('node:timers/promises')`, and `(createRequire)(import.meta.url)('node:timers/promises')`. A separate Node execution probe confirmed these forms load the timers module. Substituting the HAP package or a relative cloud path makes the other import gates false green too. Cause 058's awaited namespace expression and 059's unwrapped property copy remain detected; these are parentheses at different AST boundaries.
**Fix:** Unwrap parentheses before testing creator members, calls and loader initializers. Plant each form, plus unrelated parenthesized controls, in all three import owners.
**Flags:** New parenthesized-provenance cause; no production bug or exported contract change claimed.

### CR-05-GATES-063 - BLOCKER: A constant operand in a computed event name hides GET or SET

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md` (false-green gate); RES-04 and SAFE-08.
**Location:** `e9be066e965e4219bdf0dacb616c4aa4c43a2b66:test/accessories/accessoryReadPathScope.test.ts:149-179,205-225,266-302`; `e9be066e965e4219bdf0dacb616c4aa4c43a2b66:test/accessories/hapImportScope.test.ts:149-175,177-200,265-284`.
**Issue:** The new fixed-expression logic resolves literal operands but returns `undefined` for an identifier within the expression. Read-only probes of the extracted current detectors returned false for `const prefix = 'g'; const event = prefix + 'et'; characteristic.on(event, handler)` and the corresponding `s` + `et` SET form. Both register actual HAP listeners because the pinned HAP enum maps GET to `get` and SET to `set` (`node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:128-161`). Cause 061's direct literal concatenation is detected; a fixed constant operand is a separate resolution gap.
**Fix:** Resolve fixed identifier operands through their scoped `const` declarations, with cycle and shadowing protection, or fail closed on an unresolved event expression. Add GET and SET positives plus unrelated and shadowed controls.
**Flags:** New constant-operand event cause; no production bug or exported contract change claimed.

### CR-05-GATES-064 - BLOCKER: A computed createRequire member key hides a direct loader call

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md` (false-green import gate); SAFE-07, SAFE-08 and RES-04.
**Location:** `e9be066e965e4219bdf0dacb616c4aa4c43a2b66:test/accessories/staticGateSources.ts:123-135,234-257`.
**Issue:** `isNamespaceCreatorMember` resolves fixed element-access keys, but `callsImportedCreator` accepts only literal or no-substitution-template keys. The valid direct call `module['create' + 'Require'](import.meta.url)` and `module[member](import.meta.url)` with `const member = 'createRequire'` both create a real loader. A read-only compiled-helper probe returned only `node:module`, omitting its `node:timers/promises` load, for static and dynamic module namespaces. Cause 059's copied computed member remains detected because it uses the other predicate; the direct call is a new cause.
**Fix:** Use the existing `fixedSpecifier` resolver for a direct creator-call member key. Add direct-call positives and unrelated-key controls to all three import owners.
**Flags:** New direct computed-member cause; no production bug or exported contract change claimed.

### CR-05-GATES-065 - BLOCKER: A computed HAP enum key hides GET and SET listeners

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md` (false-green event gates); RES-04 and SAFE-08.
**Location:** `e9be066e965e4219bdf0dacb616c4aa4c43a2b66:test/accessories/accessoryReadPathScope.test.ts:191-225,227-251`; `e9be066e965e4219bdf0dacb616c4aa4c43a2b66:test/accessories/hapImportScope.test.ts:137-147,177-200`.
**Issue:** Event-member recognition accepts `['GET']` and `['SET']` but not a fixed computed key. Read-only probes of the extracted current detectors returned false for `characteristic.on(hap.CharacteristicEventTypes['G' + 'ET'], handler)` and the corresponding `['S' + 'ET']` form. The pinned HAP enum defines those members as `get` and `set` (`node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:128-161`), so both calls register real listeners. Cause 060's enum-object aliases and 061's computed event *values* are fixed; this is a computed enum *key*.
**Fix:** Resolve fixed property keys on the HAP event enum, including constant aliases, in both detectors. Add computed-key positives and unrelated-key controls.
**Flags:** New computed-enum-key cause; no production bug or exported contract change claimed.

## Round status

Opening open IDs: CR-05-GATES-058, CR-05-GATES-059, CR-05-GATES-060 and CR-05-GATES-061. All four are fixed at their cited causes. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-057 remain fixed at their cited causes; no exact cause reopened. New IDs: CR-05-GATES-062, CR-05-GATES-063, CR-05-GATES-064 and CR-05-GATES-065. Closing open IDs are those four new IDs. Counts: opening 4, fixed 4, rejected 0, new 4, reopened 0, closing `4 - 4 - 0 + 4 + 0 = 4`. Terminal result: **STOP: no progress** under D-03. The GATES-only cap is now fifteen, but it does not override this stop.

| Opening ID | Round-eleven disposition and current evidence |
| --- | --- |
| CR-05-GATES-058 | Fixed: `staticGateSources.ts:79-90,234-254` recognizes the immediate creator call on a parenthesized awaited `node:module` namespace; all three owners plant the detected form and an unrelated import. New 062 concerns parentheses around the creator or loader call itself. |
| CR-05-GATES-059 | Fixed: `staticGateSources.ts:123-151` registers copied creator members from tracked static and dynamic namespaces and follows named aliases; all three owners cover property and literal computed members with unrelated-object controls. New 064 concerns a direct call with a computed key. |
| CR-05-GATES-060 | Fixed: `accessoryReadPathScope.test.ts:227-263,778-809` and `hapImportScope.test.ts:240-263,928-959` follow HAP event-enum aliases and direct destructuring, including renamed and shadowed controls. New 065 concerns a computed member key. |
| CR-05-GATES-061 | Fixed: `accessoryReadPathScope.test.ts:149-179,811-836` and `hapImportScope.test.ts:149-175,961-986` resolve direct concatenated and interpolated literal event names, with unrelated and unresolved controls. New 063 concerns a constant identifier *inside* a computed name. |

## Seed and lead dispositions

There are no new Phase 5 seeds or leads. The GATES part of S-05-01 remains confirmed and repaired as 002: cases separate act and assert except permitted single `assert.throws` expressions. S-05-09 and S-05-10 remain confirmed and repaired as 003-005: enumeration-floor comments and the timer overview describe the current enumerated trees. S-05-11 through S-05-14 remain confirmed and repaired as 006-011: fidelity uses whole records, named imports and catches, unconditional registration and real-HAP comparison. S-05-15 remains confirmed and repaired as 012-014: parity cases cover no-handler writes, replacement handlers and in-flight status. S-05-22 remains rejected under D-16 because no consumer constructs a bare custom characteristic without its definition defaults. S-05-23's read-promise portion remains confirmed and repaired as 017; its absent-characteristic portion remains rejected under D-16 because plugin consumers guard or declare it. D-14's enumeration floors remain `>=`, so the whole-value rule is N/A for those floors. Under D-17, mirrored pairing, one `describe()` per exported source entrypoint and isolated direct coverage are N/A for these unpaired gates; `staticGateSources.ts` is test support and needs no mirrored meta-test.

## Header inspection

Each reviewed path has the D-01 SPDX line, copyright block and overview block: `test/accessories/timerFreedom.test.ts`, `test/accessories/hapImportScope.test.ts`, `test/accessories/accessoryReadPathScope.test.ts`, `test/accessories/hapWriteFidelity.test.ts`, `test/accessories/staticGateSources.ts`, `features/lib/hap.ts`, `features/step_definitions/controls.steps.ts` and `features/step_definitions/homekit.steps.ts`. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `e9be066e965e4219bdf0dacb616c4aa4c43a2b66`, Node `v26.12.0`, npm `11.20.0`, with `/opt/homebrew/opt/node/bin` first on PATH and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <the eight reviewed paths> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Tests and features compiled. |
| `node --test` on the four compiled gate owners | 0 | 98 passed, zero failed, cancelled, skipped or todo. |
| `npm run test:unpaired:compiled` | 0 | Repository unpaired suite passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |
| Read-only compiled `importSpecifiers` and `moduleLoads` probes | 0 | Parenthesized creator/loader and direct computed creator keys returned only `node:module`, omitting their load target. |
| Read-only Node loader execution probe | 0 | Parenthesized creator and loader forms loaded `node:timers/promises` and exposed `setTimeout`. |
| Read-only extracted current detector probes | 0 | Constant-operand GET/SET names and computed HAP enum keys returned false in their respective gates. |

The four gates are unpaired, so no source/test pair command or direct pair coverage applies. No full `npm run check` or Cucumber run is claimed for this correction review. Passing current tests do not exercise the four source forms above.

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS adaptation, excluded from this report's YAML scope. The unchanged parts of `features/lib/hap.ts` and both step files remain in Phase 7. I found no defect in their bounded GATES adaptation hunks or enclosing declarations.

No source or test file was edited. No mutation experiment or commit was performed.


## Coordinator triage

Accepted CR-05-GATES-062 through CR-05-GATES-065 as four distinct BLOCKER
causes: parenthesized creator/loader expressions, constant operands in event
names, computed direct creator keys, and computed HAP enum keys. Confirmed 058
through 061 fixed and 001 through 057 still fixed; none reopened. Opening 4,
fixed 4, rejected 0, new 4, reopened 0, closing 4: `STOP: no progress`
under D-03. The maintainer authorized continuation after the stop was reported;
that resolution is recorded in the ledger STOP cell before repairs begin.

## Repair history

| ID | Change | Evidence |
| --- | --- | --- |
| CR-05-GATES-062 | Unwrap parenthesized creator members, calls and loader initializers in the shared module-load scanner; add positive and unrelated-source controls in all three import owners. | Three new cases failed on unchanged helper (raw exit 1), then passed after the fix (raw exit 0). A planted no-unwrap source caused the same three intended assertion failures (raw exit 1); the source SHA-256 returned to `71006347daedba4003da8806007834303cbede876cf77087e25476a0206fd440` before GREEN. |

---

_Reviewed: 2026-10-19T00:00:21Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
