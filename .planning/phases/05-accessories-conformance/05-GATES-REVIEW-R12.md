---
phase: 05-accessories-conformance
batch: GATES
review_round: 12
reviewed: 2026-10-19T00:24:48Z
depth: deep
source_revision: dee7bf86e3ef0449e80c093224c5847c3d8c1667
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

# Phase 5: GATES code review, correction round 12

**Source:** `dee7bf86e3ef0449e80c093224c5847c3d8c1667`
**Depth:** deep
**Result:** issues_found

## Summary

I read the five GATES test and support files in full and reviewed the GATES adaptation hunks and enclosing declarations in the three Phase 7 files. The four opening causes are fixed. Three additional valid import or event forms escape the gates, and one unrelated property read is treated as a setter registration. Four findings remain open, so D-03 requires `STOP: no progress` at round 12.

## Findings

### CR-05-GATES-066 - BLOCKER: Parenthesized module namespace references hide createRequire loads

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate its claim) and `.agents/skills/typescript-unit-tests/rules/review.md` (a false-green gate is a BLOCKER); SAFE-07, SAFE-08 and RES-04.
**Location:** `dee7bf86e3ef0449e80c093224c5847c3d8c1667:test/accessories/staticGateSources.ts:97-100,163-181,250-260`; callers at `test/accessories/timerFreedom.test.ts:59-66`, `test/accessories/hapImportScope.test.ts:113-115` and `test/accessories/accessoryReadPathScope.test.ts:116-126`.
**Issue:** The round-11 fix unwraps the creator member or call, but provenance checks still require the module namespace operand or alias initializer to be a bare identifier. A read-only compiled-helper probe returned only `['node:module']` for three working loaders: `const alias = (module); alias.createRequire(...)`, `(module).createRequire(...)`, and `const { createRequire } = (module); createRequire(...)`. It also missed `await (import('node:module'))`. Each can load a forbidden timer, HAP, or cloud module without the corresponding gate seeing it.
**Fix:** Unwrap parentheses at namespace provenance boundaries, including direct member receivers, alias initializers, destructuring sources, and the awaited import call. Plant positive and unrelated-object controls in all three import owners.
**Flags:** New namespace-provenance cause; no production bug or exported contract change claimed.

### CR-05-GATES-067 - BLOCKER: Parenthesized HAP event expressions hide read and set listeners

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md` (false-green event gate); RES-04 and SAFE-08.
**Location:** `dee7bf86e3ef0449e80c093224c5847c3d8c1667:test/accessories/accessoryReadPathScope.test.ts:213-245`; `dee7bf86e3ef0449e80c093224c5847c3d8c1667:test/accessories/hapImportScope.test.ts:182-211`.
**Issue:** Both event detectors resolve parenthesized *text*, but neither unwraps a parenthesized enum member or enum owner. Read-only probes of the current functions returned true for `characteristic.on(hap.CharacteristicEventTypes.GET, handler)` and false for `characteristic.on((hap.CharacteristicEventTypes.GET), handler)` and `characteristic.on((hap.CharacteristicEventTypes)['GET'], handler)`. The SET detector gave the same true/false pattern for SET. Parentheses do not change the HAP event (`Characteristic.js:128-161`), so production listeners can escape both gates.
**Fix:** Unwrap parentheses before testing the event member and its owner in both detectors. Cover direct and computed GET/SET members, with unrelated-event controls.
**Flags:** New event-expression cause beyond 065's computed key; no production bug or exported contract change claimed.

### CR-05-GATES-068 - BLOCKER: A computed destructuring key hides a copied createRequire function

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md` (false-green import gate); SAFE-07, SAFE-08 and RES-04.
**Location:** `dee7bf86e3ef0449e80c093224c5847c3d8c1667:test/accessories/staticGateSources.ts:92-110`.
**Issue:** `addDestructuredCreator` accepts only identifier or string-literal property names. A read-only compiled-helper probe returned only `['node:module']` for `const { ['create' + 'Require']: make } = module; const load = make(import.meta.url); load('node:timers/promises')`. A separate Node execution probe confirmed that this syntax loads the timers module. A fixed key in a destructuring pattern therefore bypasses all three import gates. The round-11 direct computed-member repair does not cover this pattern.
**Fix:** Resolve the binding property's fixed computed name with the existing fixed-specifier logic; retain namespace provenance and add positive and unrelated-key controls to all three owners.
**Flags:** New destructured-key cause; no production bug or exported contract change claimed.

### CR-05-GATES-069 - BLOCKER: A property read is counted as an onSet registration

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md` (a suite that breaks on valid unrelated source is a BLOCKER); SAFE-08.
**Location:** `dee7bf86e3ef0449e80c093224c5847c3d8c1667:test/accessories/hapImportScope.test.ts:360-363,1407-1416`.
**Issue:** `recordUse` marks any AST node whose member text is `onSet`, without checking for a call or HAP receiver. A read-only probe returned `onSet: true` for both `const fn = other.onSet;` and `other.onSet;`, although neither registers a HAP setter. Such an unrelated property access in an accessory module would fail the direct-registration gate and block a valid change.
**Fix:** Count an `onSet` registration only when it is the callee of a call on a relevant characteristic; add non-call and unrelated-receiver controls alongside the registration positives.
**Flags:** New false-positive gate cause; no production bug or exported contract change claimed.

## Round status

Opening open IDs: CR-05-GATES-062, CR-05-GATES-063, CR-05-GATES-064 and CR-05-GATES-065. All four are fixed at their cited causes. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-061 remain fixed at their cited causes; no exact cause reopened. New IDs: CR-05-GATES-066, CR-05-GATES-067, CR-05-GATES-068 and CR-05-GATES-069. Closing open IDs are those four new IDs. Counts: opening 4, fixed 4, rejected 0, new 4, reopened 0, closing `4 - 4 - 0 + 4 + 0 = 4`. Terminal result: **STOP: no progress** under D-03, even with the GATES-only fifteen-round cap.

| Opening ID | Round-twelve disposition and current evidence |
| --- | --- |
| CR-05-GATES-062 | Fixed: `staticGateSources.ts:123-149,243-245,303-305,370-375` unwraps the creator member, callee and loader initializer; all three owners cover the previously missed parenthesized forms and unrelated controls. New 066 concerns the namespace operand, not these boundaries. |
| CR-05-GATES-063 | Fixed: `accessoryReadPathScope.test.ts:150-179,274-292,838-881` and `hapImportScope.test.ts:150-179,345-355,1120-1163` resolve constant operands in GET and SET names with shadowed, mutable, cyclic and unrelated controls. |
| CR-05-GATES-064 | Fixed: `staticGateSources.ts:250-260` resolves a direct computed creator member through `fixedSpecifier`; all three owners cover static and dynamic namespaces, constant keys and unrelated controls. New 068 concerns a destructuring binding key. |
| CR-05-GATES-065 | Fixed: `accessoryReadPathScope.test.ts:213-245,883-923` and `hapImportScope.test.ts:182-211,1165-1205` resolve computed HAP enum keys, including constant aliases, with unrelated and shadowed controls. New 067 concerns parentheses around the event expression or enum owner. |

## Seed and lead dispositions

No new Phase 5 seed or lead is raised. S-05-01's GATES portion remains confirmed and repaired as 002. S-05-09 and S-05-10 remain confirmed and repaired as 003-005. S-05-11 through S-05-14 remain confirmed and repaired as 006-011. S-05-15 remains confirmed and repaired as 012-014, and S-05-23's read-promise portion as 017. S-05-22's bare-characteristic default and S-05-23's absent-characteristic lookup remain rejected under D-16 because no plugin consumer uses those paths. D-14 keeps the `>=` enumeration floors; the whole-value rule is N/A for those floors. D-17's mirrored pairing, one `describe()` per exported source entrypoint and isolated direct coverage are N/A for the unpaired gates; the shared test support needs no mirrored meta-test.

## Header inspection

All eight reviewed paths have the D-01 SPDX line, copyright block and overview block: `test/accessories/timerFreedom.test.ts`, `test/accessories/hapImportScope.test.ts`, `test/accessories/accessoryReadPathScope.test.ts`, `test/accessories/hapWriteFidelity.test.ts`, `test/accessories/staticGateSources.ts`, `features/lib/hap.ts`, `features/step_definitions/controls.steps.ts` and `features/step_definitions/homekit.steps.ts`. The header tracer exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `dee7bf86e3ef0449e80c093224c5847c3d8c1667`, Node `v26.12.0`, npm `11.20.0`, `/opt/homebrew/opt/node/bin` first on PATH, and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <the eight reviewed paths> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Tests and features compiled. |
| `node --test` on the four compiled gate owners | 0 | 108 passed, zero failed, cancelled, skipped or todo. |
| `npm run test:unpaired:compiled` | 0 | Repository unpaired suite passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |
| Read-only compiled `importSpecifiers` probes | 0 | Parenthesized namespace and computed-destructuring forms returned only `node:module`, omitting the load target. |
| Read-only extracted current event-detector probes | 0 | Parenthesized GET/SET expressions returned false while direct equivalents returned true. |
| Read-only extracted current `hapUses` probe | 0 | Uncalled `other.onSet` property reads returned `onSet: true`. |
| Read-only Node execution probe | 0 | Computed destructuring created a working loader for `node:timers/promises`. |

The gates are unpaired, so no source/test pair command or direct pair coverage applies. No full `npm run check` or Cucumber run is claimed for this correction review. Passing current tests do not exercise the four causes above.

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS adaptation and outside this report's YAML scope. The unchanged portions of `features/lib/hap.ts` and the two step-definition files belong to Phase 7. Their bounded GATES adaptation hunks and enclosing declarations reveal no new defect.

No source or test file was edited. No mutation experiment or commit was performed.

## Coordinator triage

The maintainer authorized continuation after the no-progress stop. The four
opening IDs, 062-065, are fixed as the reviewer confirmed. IDs 066-069 remain
open. Prettier 3.9.6 removes the specific parentheses in 066 and 067, and
`format:check` is part of the full repository gate. Their standalone scanner
gaps are real, but the integrated risk is narrower than the finding text
suggests. Prettier preserves the computed key in 068. ID 069 is a false
positive on valid source. No production bug is claimed.

## Repair history

Pending.

---

_Reviewed: 2026-10-19T00:24:48Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
