---
phase: 05-accessories-conformance
batch: GATES
review_round: 8
reviewed: 2026-10-18T22:16:53Z
depth: deep
source_revision: 17be68174a4e21c548fbc49ed689c09338c59a83
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
  blocker: 6
  warning: 0
  total: 6
status: issues_found
reviewer: gsd-code-reviewer
---

# Phase 5: GATES code review, correction round 8

**Source:** `17be68174a4e21c548fbc49ed689c09338c59a83`
**Depth:** deep
**Result:** issues_found

## Summary

I read the four gate tests and `staticGateSources.ts` in full, and reviewed the changed hunks and enclosing declarations of the three Phase 7 adaptations. The five opening causes are fixed. Six other valid source forms still pass a gate they should fail. The closing count is greater than the opening count, so this round is **STOP: no progress** under D-03/D-18.

## Findings

### CR-05-GATES-050 - BLOCKER: An immediately invoked createRequire loader escapes all three import gates

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, each gate case must discriminate its stated behavior; `.agents/skills/typescript-unit-tests/rules/review.md`, a false-green suite is a BLOCKER; SAFE-07, SAFE-08 and RES-04.
**Location:** `17be68174a4e21c548fbc49ed689c09338c59a83:test/accessories/staticGateSources.ts:184-193,289-303`; owners at `test/accessories/timerFreedom.test.ts:59-66`, `test/accessories/hapImportScope.test.ts:106-108` and `test/accessories/accessoryReadPathScope.test.ts:108-118`.
**Issue:** The visitor records a loader only when a variable declaration receives a `createRequire(...)` call. The valid expression `createRequire(import.meta.url)('node:timers/promises')` has no loader variable. Its outer call has a call-expression callee, so `recordLoad` skips it. A read-only call to the compiled `importSpecifiers` returned only `["node:module"]` for that source. Replacing the target with the HAP package or a relative cloud module likewise leaves the forbidden target unseen. The existing alternate-base and loader-alias controls assign the loader to a variable; this is a different call shape.
**Fix:** Recognize a call whose callee is a recognized `createRequire(...)` call and resolve its argument, including the unresolved-target fail-closed rule. Plant direct-invocation positives in each owning gate and an unrelated nested-call negative.
**Flags:** New call-expression shape beyond CR-05-GATES-035; no production bug claimed.

### CR-05-GATES-051 - BLOCKER: An alias of the node:module namespace hides createRequire loads

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green import assertions; SAFE-07, SAFE-08 and RES-04.
**Location:** `17be68174a4e21c548fbc49ed689c09338c59a83:test/accessories/staticGateSources.ts:75-81,129-160,163-181`; callers in the three import gates.
**Issue:** `importedCreators` records the imported namespace symbol, while `callsImportedCreator` accepts only that exact symbol. `import * as module from 'node:module'; const moduleAlias = module; const load = moduleAlias.createRequire(import.meta.url); load('@homebridge/hap-nodejs')` is a working loader. A read-only probe returned only `["node:module"]`. Round 7's destructuring repair covers a direct destructure from `module`, but a namespace value passed through a local alias still disappears.
**Fix:** Propagate the imported module namespace capability through fixed local aliases before detecting `createRequire` calls. Plant a forbidden namespace-alias load in each owner and an alias of an unrelated object as a negative.
**Flags:** New namespace-binding cause beyond CR-05-GATES-046.

### CR-05-GATES-052 - BLOCKER: Cloud import resolution ignores the base passed to createRequire

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green network-confinement assertion; RES-04.
**Location:** `17be68174a4e21c548fbc49ed689c09338c59a83:test/accessories/accessoryReadPathScope.test.ts:108-117,440-444`; loader collection at `test/accessories/staticGateSources.ts:184-193,289-303`.
**Issue:** The helper now records loads made by `createRequire(new URL('../probe.js', import.meta.url))`, but it returns only the specifier. `reachesTheNetworkTier` resolves every relative specifier against the accessory source file, even though Node resolves a `createRequire` load against the base given to `createRequire`. From an accessory module, `createRequire(new URL('../probe.js', import.meta.url))('./cloud/api.js')` reaches `src/cloud/api.js`; the gate resolves `./cloud/api.js` to `src/accessories/cloud/api.js` and returns false. A read-only path calculation confirmed these two targets. The existing alternate-base positive uses `../cloud/api.js`, which is forbidden under either base and therefore cannot catch this mismatch.
**Fix:** Preserve the loader's base with each collected load and resolve its relative target from that base; fail closed when the base cannot be resolved. Plant a base-dependent cloud positive and a neighboring non-cloud negative.
**Flags:** New target-resolution cause beyond CR-05-GATES-035's loader-detection repair.

### CR-05-GATES-053 - BLOCKER: createRequire obtained from a dynamic module import escapes all three import gates

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green import assertions; SAFE-07, SAFE-08 and RES-04.
**Location:** `17be68174a4e21c548fbc49ed689c09338c59a83:test/accessories/staticGateSources.ts:129-160,184-193,289-303`; callers in the three import gates.
**Issue:** `importedCreators` records creator bindings only from static `ImportDeclaration` nodes. `const { createRequire } = await import('node:module'); const load = createRequire(import.meta.url); load('node:timers/promises')` creates a working loader, but a read-only `importSpecifiers` call returned only `["node:module"]`. The dynamic import itself is recognized, yet the creator and its subsequent forbidden load are not.
**Fix:** Track a `createRequire` binding destructured from a fixed dynamic import of `node:module`, or fail closed when that namespace is used to make an untracked loader. Plant forbidden dynamic-destructure positives in each import gate and an unrelated dynamic-destructure negative.
**Flags:** New creator-provenance cause; no earlier fixed ID covered a dynamic import of the module namespace.

### CR-05-GATES-054 - BLOCKER: A renamed destructure of injected hap bypasses UUID-call detection

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green direct HAP-use assertion; SAFE-08.
**Location:** `17be68174a4e21c548fbc49ed689c09338c59a83:test/accessories/hapImportScope.test.ts:182-203,234-260,873-881`.
**Issue:** `recordDestructuredAlias` records `uuid` or `generate`, but never a `hap` property destructured from `this.api`. The valid `const { hap: h } = this.api; h.uuid.generate(deviceId)` is therefore not treated as an injected HAP UUID call. A read-only execution of the current `hapUses` function returned `memberCall: false`; the repaired `const hapApi = this.api.hap; hapApi.uuid.generate(deviceId)` returned true. This is a distinct binding path from CR-05-GATES-048.
**Fix:** Record a renamed `hap` property destructured from the injected API as a HAP-namespace capability, honoring shadowing. Plant that UUID-call positive and an unrelated-object destructure negative.
**Flags:** New destructuring cause beyond CR-05-GATES-048.

### CR-05-GATES-055 - BLOCKER: A HAP namespace alias hides a set-event registration

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green direct setter assertion; SAFE-08.
**Location:** `17be68174a4e21c548fbc49ed689c09338c59a83:test/accessories/hapImportScope.test.ts:143-165,186-192,262-281,861-870`.
**Issue:** The UUID detector follows `const hapApi = this.api.hap`, but `isSetEvent` still recognizes `CharacteristicEventTypes.SET` only under an identifier spelled `hap` or an immediate member named `hap`. A read-only execution of `hapUses` returned `setEvent: false` for `const hapApi = this.api.hap; characteristic.on(hapApi.CharacteristicEventTypes.SET, handler)` and true for the same call through `hap.CharacteristicEventTypes.SET`. A non-binder accessory could register a direct set handler while its gate stays green.
**Fix:** Resolve the containing HAP namespace in `isSetEvent` through the existing alias capability, then plant an alias-based set-event positive and an unrelated enum negative.
**Flags:** New event-consumer cause after CR-05-GATES-048 repaired UUID consumers of the namespace alias.

## Round status

Opening open IDs: CR-05-GATES-045, CR-05-GATES-046, CR-05-GATES-047, CR-05-GATES-048, CR-05-GATES-049. Each is fixed at its cited cause. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-044 remain fixed; none reopened. New IDs: CR-05-GATES-050 through CR-05-GATES-055. Closing open IDs: CR-05-GATES-050 through CR-05-GATES-055. Counts: opening 5, fixed 5, rejected 0, new 6, reopened 0, closing `5 - 5 - 0 + 6 + 0 = 6`. Terminal result: **STOP: no progress** under D-03/D-18.

| Opening ID | Round-eight disposition and current evidence |
| --- | --- |
| CR-05-GATES-045 | Fixed: `staticGateSources.ts:196-245,297-301` resolves fixed templates and throws for unresolved dynamic or recognized loader targets; all three owners carry positive and unresolved-target controls. |
| CR-05-GATES-046 | Fixed: `staticGateSources.ts:75-103,158-159` tracks `createRequire` destructured directly from an imported module namespace, including a renamed binding; all three owners carry positives and an unrelated-object negative. New 051 concerns a preceding namespace alias. |
| CR-05-GATES-047 | Fixed: `accessoryReadPathScope.test.ts:140-159,186-200,299-313,537-539` resolves fixed local method names for `onGet`, `on` and `addListener`, with an `emit` negative. |
| CR-05-GATES-048 | Fixed: `hapImportScope.test.ts:186-260,679-742` tracks direct local aliases of the injected HAP namespace for UUID calls, including forwarding and shadowing controls. New 054 uses an object destructure; new 055 concerns set-event detection. |
| CR-05-GATES-049 | Fixed: `hapWriteFidelity.test.ts:66-75,334-355` records the values supplied to `onSet` by both implementations and independently checks `[true, false]`. |

The earlier 001–044 repairs remain represented by current full-file controls and the passing owner run. I found no return of their exact cited causes.

## Seed and lead dispositions

No new Phase 5 seed or research lead belongs to round eight. The GATES outcomes for S-05-01, S-05-09 through S-05-15, S-05-22 and S-05-23 remain as recorded in `05-FINDINGS.md`: the confirmed leads have repair controls and the rejected parts remain outside D-16 or without a relevant consumer. D-14's enumeration floors remain `>=`; the whole-value rule is N/A for those documented floors. Under D-17, mirrored pairing, one `describe()` per exported entrypoint and isolated direct coverage are N/A for the four unpaired gates; `staticGateSources.ts` is test support and needs no mirrored meta-test.

## Header inspection

Each reviewed path retains the D-01 SPDX line, copyright block and overview block: `test/accessories/timerFreedom.test.ts`, `test/accessories/hapImportScope.test.ts`, `test/accessories/accessoryReadPathScope.test.ts`, `test/accessories/hapWriteFidelity.test.ts`, `test/accessories/staticGateSources.ts`, `features/lib/hap.ts`, `features/step_definitions/controls.steps.ts` and `features/step_definitions/homekit.steps.ts`. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `17be68174a4e21c548fbc49ed689c09338c59a83`, Node `v26.12.0`, with `/opt/homebrew/opt/node/bin` first on PATH and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <the eight reviewed paths> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Current tests and features compiled. |
| `node --test` on the four compiled gate owners | 0 | 80 passed, zero failed, cancelled, skipped or todo. |
| `npm run test:unpaired` | 0 | Repository unpaired suite passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |

The four gates are unpaired, so no source/test pair command or direct pair coverage applies to them. No full `npm run check` or Cucumber run is claimed for this correction review. Passing current tests does not exercise the six source forms above.

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS adaptation, excluded from this report's YAML scope. The unchanged parts of `features/lib/hap.ts` and both step files remain in Phase 7. I found no defect in their bounded round-eight adaptation hunks.

No source or test file was edited. No mutation experiment or commit was performed.


## Coordinator triage

Accepted CR-05-GATES-050 through CR-05-GATES-055 as six distinct BLOCKER causes:
immediate loader invocation, imported namespace aliasing, loader-base resolution,
dynamic module destructuring, renamed injected-HAP destructuring, and set-event
registration through a HAP alias. Confirmed 045 through 049 fixed and 001 through
044 still fixed; none reopened. Opening 5, fixed 5, rejected 0, new 6, reopened 0,
closing 6: `STOP: no progress` under D-03. The maintainer authorized continuation
in this task after the stop was reported; the resolution is recorded in the ledger
STOP cell before any round-8 repair begins.

## Repair history

| ID | Change | Evidence |
| --- | --- | --- |

---

_Reviewed: 2026-10-18T22:16:53Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
