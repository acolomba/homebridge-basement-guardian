---
phase: 05-accessories-conformance
batch: GATES
review_round: 10
reviewed: 2026-10-18T23:32:20Z
depth: deep
source_revision: d6d80989ad6e993f676b7468ef5f8c48bddfe0d2
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

# Phase 5: GATES code review, correction round 10

**Source:** `d6d80989ad6e993f676b7468ef5f8c48bddfe0d2`
**Depth:** deep
**Result:** issues_found

## Summary

I read all five GATES test and support files afresh, and reviewed the changed hunks and enclosing declarations in the three Phase 7 adaptations. The two opening causes are fixed. Four other valid source forms escape the gates' stated restrictions. The closing count is four, which requires a stop under both the no-progress rule and the round-ten cap.

## Findings

### CR-05-GATES-058 - BLOCKER: An immediate creator call on an awaited module namespace hides a module load

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every gate case must discriminate its stated behavior; `.agents/skills/typescript-unit-tests/rules/review.md`, a false-green suite is a BLOCKER; SAFE-07, SAFE-08 and RES-04.
**Location:** `d6d80989ad6e993f676b7468ef5f8c48bddfe0d2:test/accessories/staticGateSources.ts:215-233,332-350`; callers at `test/accessories/timerFreedom.test.ts:59-66`, `test/accessories/hapImportScope.test.ts:109-110` and `test/accessories/accessoryReadPathScope.test.ts:112-122`.
**Issue:** `callsImportedCreator` accepts a `createRequire` member only when its receiver is an identifier registered as a namespace. The valid expression `const load = (await import('node:module')).createRequire(import.meta.url); load('node:timers/promises')` calls the real creator without an intermediate namespace binding. A read-only call to the compiled `importSpecifiers` and `moduleLoads` returned only `node:module`; the deferred-execution load was invisible. The same expression can load the HAP package or a cloud module. Round-nine cause 056 records a *bound* dynamic namespace and is fixed; this expression never creates that binding.
**Fix:** Resolve a fixed `await import('node:module')` receiver in `callsImportedCreator`, including parentheses. Add a planted load and an unrelated dynamic-import control to each import owner.
**Flags:** New direct-expression provenance cause; no production bug or exported contract change claimed.

### CR-05-GATES-059 - BLOCKER: Extracting createRequire through a property binding hides a module load

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md`, false-green import gates; SAFE-07, SAFE-08 and RES-04.
**Location:** `d6d80989ad6e993f676b7468ef5f8c48bddfe0d2:test/accessories/staticGateSources.ts:119-132,209-233,263-279`.
**Issue:** `addCreatorAliases` follows only identifier initializers, and `addDestructuredCreator` follows object binding patterns. A normal property extraction, `import * as module from 'node:module'; const makeRequire = module.createRequire; const load = makeRequire(import.meta.url); load('node:timers/promises')`, runs the real loader but `importSpecifiers` returns only `node:module`. The same omission occurs after a dynamic namespace import. This is distinct from 058: the receiver is already a tracked namespace, but its `createRequire` member is not registered as a named creator when copied to a variable.
**Fix:** Register a fixed `createRequire` property or element access from a tracked namespace as a creator binding, then follow its aliases. Add static and dynamic namespace positives and unrelated-object negatives to all three import owners.
**Flags:** New member-extraction cause; no production bug or exported contract change claimed.

### CR-05-GATES-060 - BLOCKER: An alias of the HAP event enum hides GET and SET listeners

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md`, false-green gate assertions; RES-04 and SAFE-08.
**Location:** `d6d80989ad6e993f676b7468ef5f8c48bddfe0d2:test/accessories/accessoryReadPathScope.test.ts:169-223,225-251`; `d6d80989ad6e993f676b7468ef5f8c48bddfe0d2:test/accessories/hapImportScope.test.ts:146-168,209-269,254-288`.
**Issue:** The new object-binding logic recognizes a literal object carrying a fixed GET or SET value, but neither gate recognizes `hap.CharacteristicEventTypes` itself as an event object. Read-only probes returned false for all four valid forms: `const events = hap.CharacteristicEventTypes; characteristic.on(events.GET, handler)`, `const { GET } = hap.CharacteristicEventTypes; characteristic.on(GET, handler)`, and the analogous SET forms. The pinned HAP package defines GET as `get` and SET as `set` (`node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:128-161`). These register real listeners. Cause 057's fixed local literal-object binding is not the enum-container alias used here.
**Fix:** Track event-enum object provenance through fixed aliases and direct destructuring, with renamed-binding and shadowed or unrelated-object controls in both gates.
**Flags:** New enum-container provenance cause; no production bug claimed.

### CR-05-GATES-061 - BLOCKER: Computed fixed event names hide GET and SET listeners

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md`, false-green gate assertions; RES-04 and SAFE-08.
**Location:** `d6d80989ad6e993f676b7468ef5f8c48bddfe0d2:test/accessories/accessoryReadPathScope.test.ts:169-189,225-251`; `d6d80989ad6e993f676b7468ef5f8c48bddfe0d2:test/accessories/hapImportScope.test.ts:146-168,209-251`.
**Issue:** Both detectors recognize a string literal and scalar alias, but neither evaluates a fixed string expression. A read-only probe returned false for `const event = 'g' + 'et'; characteristic.on(event, handler)` and for `const event = 's' + 'et'; characteristic.on(event, handler)`. At runtime those expressions are `get` and `set`, so each registers a forbidden listener while the corresponding gate passes. This is a constant-expression gap, separate from 060's enum-object provenance.
**Fix:** Resolve fixed event strings through constant concatenation and fixed template expressions, or fail closed for an event expression the gate cannot resolve. Add positive computed-name and negative unrelated-name controls to both gates.
**Flags:** New fixed-expression cause; no production bug claimed.

## Round status

Opening open IDs: CR-05-GATES-056 and CR-05-GATES-057. Both are fixed at their cited causes. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-055 remain fixed at their cited causes; no exact cause reopened. New IDs: CR-05-GATES-058, CR-05-GATES-059, CR-05-GATES-060 and CR-05-GATES-061. Closing open IDs are those four new IDs. Counts: opening 2, fixed 2, rejected 0, new 4, reopened 0, closing `2 - 2 - 0 + 4 + 0 = 4`. Terminal result: **STOP: no progress; open after round 10** under D-03/D-18. No correction round 11 is permitted.

| Opening ID | Round-ten disposition and current evidence |
| --- | --- |
| CR-05-GATES-056 | Fixed: `staticGateSources.ts:135-169,180-212` records a fixed dynamic `node:module` namespace and follows a bound alias; all three import owners plant direct and aliased dynamic-namespace loads with unrelated-import controls. New 058 and 059 use different expression forms. |
| CR-05-GATES-057 | Fixed: `accessoryReadPathScope.test.ts:191-251,709-735` and `hapImportScope.test.ts:230-289,801-826` resolve fixed GET and SET members through literal-object bindings, including renamed and shadowed controls. New 060 starts from the HAP enum object itself. |

## Seed and lead dispositions

There are no new Phase 5 seeds or leads in this round. The GATES part of S-05-01 remains confirmed and repaired as CR-05-GATES-002: current cases use separate act and assert phases except permitted single `assert.throws` cases. S-05-09 and S-05-10 remain confirmed and repaired as 003-005: the timer overview and enumeration-floor comments describe the enumerated trees. S-05-11 through S-05-14 remain confirmed and repaired as 006-011: fidelity uses whole-record assertions, named imports and catches, unconditional registration and real-HAP comparison. S-05-15 remains confirmed and repaired as 012-014: parity cases cover no-handler writes, replacement handlers and in-flight status. S-05-22 remains rejected under D-16 because no consumer constructs a bare custom characteristic without its definition defaults. S-05-23's read-promise portion remains confirmed and repaired as 017; its absent-characteristic portion remains rejected under D-16 because plugin consumers guard or declare it. D-14's enumeration floors remain `>=`, so the whole-value rule is N/A for those documented floors. Under D-17, mirrored pairing, one `describe()` per exported source entrypoint and isolated direct coverage are N/A for these unpaired gates; `staticGateSources.ts` is test support and needs no mirrored meta-test.

## Header inspection

Each of the eight reviewed paths has the D-01 SPDX line, copyright block and overview block: `test/accessories/timerFreedom.test.ts`, `test/accessories/hapImportScope.test.ts`, `test/accessories/accessoryReadPathScope.test.ts`, `test/accessories/hapWriteFidelity.test.ts`, `test/accessories/staticGateSources.ts`, `features/lib/hap.ts`, `features/step_definitions/controls.steps.ts` and `features/step_definitions/homekit.steps.ts`. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `d6d80989ad6e993f676b7468ef5f8c48bddfe0d2`, Node `v26.12.0`, npm `11.20.0`, with `/opt/homebrew/opt/node/bin` first on PATH and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <the eight reviewed paths> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Tests and features compiled. |
| `node --test` on the four compiled gate owners | 0 | 88 passed, zero failed, cancelled, skipped or todo. |
| `npm run test:unpaired` | 0 | Repository unpaired suite passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |
| read-only compiled `importSpecifiers`/`moduleLoads` probes | 0 | An immediate awaited namespace creator call and a creator member extraction returned only `node:module`, omitting the working loader target. |
| read-only Node loader execution probe | 0 | Both creator forms loaded `node:timers/promises`; each exposed a `setTimeout` function. |
| read-only extracted gate-detector probes | 0 | Enum-object aliases and fixed concatenated GET/SET event names returned false in both detectors. |

The four gates are unpaired, so no source/test pair command or direct pair coverage applies. No full `npm run check` or Cucumber run is claimed for this correction review. Passing current tests do not exercise the four source forms above.

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS adaptation, excluded from this report's YAML scope. The unchanged parts of `features/lib/hap.ts` and both step files remain in Phase 7. I found no defect in their bounded GATES adaptation hunks or enclosing declarations.

No source or test file was edited. No mutation experiment or commit was performed.


## Coordinator triage

Accepted CR-05-GATES-058 through CR-05-GATES-061 as four distinct BLOCKER causes.
Confirmed 056 and 057 fixed and 001 through 055 still fixed; none reopened.
Opening 2, fixed 2, rejected 0, new 4, reopened 0, closing 4: the review's
result was `STOP: no progress; open after round 10` under the policy then in force.
The maintainer authorized an amendment extending GATES alone to fifteen rounds.
The historical STOP remains in the report; its resolution is recorded in the ledger
before any round-10 repair begins. The other batches retain their ten-round cap.

## Repair history

| ID | Change | Evidence |
| --- | --- | --- |

---

_Reviewed: 2026-10-18T23:32:20Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
