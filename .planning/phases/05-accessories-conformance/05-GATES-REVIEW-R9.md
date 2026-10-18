---
phase: 05-accessories-conformance
batch: GATES
review_round: 9
reviewed: 2026-10-18T23:14:49Z
depth: deep
source_revision: 6e4bd6dac1d32f948fd5484b53a20bbcef27f714
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
  blocker: 2
  warning: 0
  total: 2
status: issues_found
reviewer: gsd-code-reviewer
---

# Phase 5: GATES code review, correction round 9

**Source:** `6e4bd6dac1d32f948fd5484b53a20bbcef27f714`
**Depth:** deep
**Result:** issues_found

## Summary

I read all five GATES test and support files afresh. I reviewed the declared changed hunks and their enclosing declarations in the three Phase 7 adaptations. All six opening causes are fixed, and no earlier fixed cause reopened. Two other executable forms still pass gates that promise to reject them. The open count falls from six to two, so this round may continue under D-03/D-18.

## Findings

### CR-05-GATES-056 - BLOCKER: A dynamically imported module namespace hides createRequire loads

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every gate case must discriminate its stated behavior; `.agents/skills/typescript-unit-tests/rules/review.md`, a false-green suite is a BLOCKER; SAFE-07, SAFE-08 and RES-04.
**Location:** `6e4bd6dac1d32f948fd5484b53a20bbcef27f714:test/accessories/staticGateSources.ts:79-85,177-209,212-230`; callers at `test/accessories/timerFreedom.test.ts:59-66`, `test/accessories/hapImportScope.test.ts:107-109` and `test/accessories/accessoryReadPathScope.test.ts:108-117`.
**Issue:** `isDynamicModuleNamespace` recognizes `await import('node:module')` only when a `createRequire` property is destructured immediately. `importedCreators` adds namespace symbols only for static imports, so `const module = await import('node:module'); const load = module.createRequire(import.meta.url); load('node:timers/promises')` makes a real loader while its target is invisible to all three import gates. A read-only call to the compiled `importSpecifiers` and `moduleLoads` returned only `node:module` for that source. The same path can load the HAP package or a cloud module. Round-eight fix 053 tracks immediate dynamic destructuring, which does not cover an intermediate namespace binding.
**Fix:** Record fixed dynamic imports of `node:module` as namespace bindings, then follow their aliases and `createRequire` calls. Plant a forbidden dynamic-namespace load in each owner and a dynamic import of an unrelated module as a negative.
**Flags:** New namespace-provenance cause beyond CR-05-GATES-053; no production bug claimed.

### CR-05-GATES-057 - BLOCKER: Destructured fixed event names bypass the read and set-handler gates

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `.agents/skills/typescript-unit-tests/rules/review.md`, false-green gate assertions; RES-04 and SAFE-08.
**Location:** `6e4bd6dac1d32f948fd5484b53a20bbcef27f714:test/accessories/accessoryReadPathScope.test.ts:164-200,203-210`; `6e4bd6dac1d32f948fd5484b53a20bbcef27f714:test/accessories/hapImportScope.test.ts:144-167,235-267,279-285`.
**Issue:** Both event detectors follow fixed scalar aliases, but neither records a binding produced by object destructuring. The valid TypeScript `const events = { GET: hap.CharacteristicEventTypes.GET }; const { GET } = events; characteristic.on(GET, handler)` installs a read listener while `registersReadHandler` returns false because `recordAlias` accepts identifier declarations only. The analogous `SET` expression installs a direct set listener while `hapUses` records no `setEvent` capability for the destructured name. The pinned HAP package defines `GET = 'get'` and `SET = 'set'` (`Characteristic.js:128-161`); a read-only runtime check returned those values, and a read-only TypeScript check accepted the object-and-destructure form. Earlier fixes 043 and 055 cover scalar event aliases and HAP namespace aliases, not event-value destructuring.
**Fix:** Resolve fixed event members through object-binding elements in each detector, including renamed bindings and shadowing. Plant GET and SET positives using a fixed local object, with unrelated-object and shadowed-binding negatives.
**Flags:** New event-binding cause; D-16 static-gate controls. No production bug claimed.

## Round status

Opening open IDs: CR-05-GATES-050, CR-05-GATES-051, CR-05-GATES-052, CR-05-GATES-053, CR-05-GATES-054, CR-05-GATES-055. Each is fixed at its cited cause. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-049 remain fixed at their cited causes; none reopened. New IDs: CR-05-GATES-056, CR-05-GATES-057. Closing open IDs: CR-05-GATES-056, CR-05-GATES-057. Counts: opening 6, fixed 6, rejected 0, new 2, reopened 0, closing `6 - 6 - 0 + 2 + 0 = 2`. Terminal result: **continue** under D-03/D-18.

| Opening ID | Round-nine disposition and current evidence |
| --- | --- |
| CR-05-GATES-050 | Fixed: `staticGateSources.ts:329-347,391-408` records a direct `createRequire(...)('target')` load; all three import owners have a direct-call positive and unresolved-target control. |
| CR-05-GATES-051 | Fixed: `staticGateSources.ts:135-167,206-208` propagates statically imported `node:module` namespace aliases; all three owners test the alias and an unrelated-object negative. New 056 starts with a *dynamic* namespace import. |
| CR-05-GATES-052 | Fixed: `staticGateSources.ts:243-258,428-434` carries the loader base, and `accessoryReadPathScope.test.ts:108-117,464-473,675-676,709-710` resolves a base-dependent cloud path and keeps a neighboring path negative. |
| CR-05-GATES-053 | Fixed: `staticGateSources.ts:79-108,206-209` tracks `createRequire` immediately destructured from a fixed dynamic `node:module` import; all three owners have positive and unrelated-import controls. New 056 retains the namespace value first. |
| CR-05-GATES-054 | Fixed: `hapImportScope.test.ts:235-267,774-789` tracks a renamed `hap` destructure from `this.api`, with unrelated and shadowed UUID negatives. |
| CR-05-GATES-055 | Fixed: `hapImportScope.test.ts:144-167,738-755` resolves `CharacteristicEventTypes.SET` through an injected HAP namespace alias, with unrelated and shadowed negatives. New 057 extracts the event value itself. |

The earlier 001-049 controls remain in the current files and the owner run passed. I found no return of an earlier ID's exact cited cause.

## Seed and lead dispositions

There are no new Phase 5 seeds or leads in this round. The GATES part of S-05-01 remains confirmed and repaired as CR-05-GATES-002: the current case markers use separate act and assert phases, except permitted single `assert.throws` cases. S-05-09 and S-05-10 remain confirmed and repaired as 003-005: the current floor comments and timer overview describe the enumerated trees. S-05-11 through S-05-14 remain confirmed and repaired as 006-011: the fidelity test uses whole-record assertions, named imports and catches, unconditional registration, and real-HAP comparison. S-05-15 remains confirmed and repaired as 012-014: the parity cases cover no-handler writes, replacement handlers and in-flight status. S-05-22 remains rejected under D-16 because no consumer constructs a bare custom characteristic without its definition defaults. S-05-23's read-promise portion remains confirmed and repaired as 017; its absent-characteristic portion remains rejected under D-16 because plugin consumers guard or declare it. D-14's enumeration floors remain `>=`, so the whole-value rule is N/A for those documented floors. Under D-17, mirrored pairing, one `describe()` per exported source entrypoint and isolated direct coverage are N/A for these unpaired gates; `staticGateSources.ts` is test support and needs no mirrored meta-test.

## Header inspection

Each reviewed path has the D-01 SPDX line, copyright block and overview block: `test/accessories/timerFreedom.test.ts`, `test/accessories/hapImportScope.test.ts`, `test/accessories/accessoryReadPathScope.test.ts`, `test/accessories/hapWriteFidelity.test.ts`, `test/accessories/staticGateSources.ts`, `features/lib/hap.ts`, `features/step_definitions/controls.steps.ts` and `features/step_definitions/homekit.steps.ts`. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `6e4bd6dac1d32f948fd5484b53a20bbcef27f714`, Node `v26.12.0`, npm `11.20.0`, with `/opt/homebrew/opt/node/bin` first on PATH and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <the eight reviewed paths> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Tests and features compiled. |
| `node --test` on the four compiled gate owners | 0 | 86 passed, zero failed, cancelled, skipped or todo. |
| `npm run test:unpaired` | 0 | Repository unpaired suite passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |
| read-only `importSpecifiers`/`moduleLoads` dynamic-namespace probe | 0 | Both returned only `node:module`, omitting the working `node:timers/promises` loader target. |
| read-only pinned-HAP event-value and TypeScript probes | 0 | `GET` was `get`; `SET` was `set`; the fixed-object destructure compiled without diagnostics. |

The four gates are unpaired, so no source/test pair command or direct pair coverage applies. No full `npm run check` or Cucumber run is claimed for this correction review. Passing current tests do not exercise the two source forms above.

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS adaptation, excluded from this report's YAML scope. The unchanged parts of `features/lib/hap.ts` and both step files remain in Phase 7. I found no defect in their bounded GATES adaptation hunks or enclosing declarations.

No source or test file was edited. No mutation experiment or commit was performed.


## Coordinator triage

Accepted CR-05-GATES-056 and CR-05-GATES-057 as distinct BLOCKER causes.
The first loses a dynamic `node:module` namespace before `createRequire`; the second
loses fixed event values through object destructuring in the read and set gates.
Confirmed 050 through 055 fixed and 001 through 049 still fixed; none reopened.
Opening 6, fixed 6, rejected 0, new 2, reopened 0, closing 2: `continue`
under D-03/D-18.

## Repair history

| ID | Change | Evidence |
| --- | --- | --- |

---

_Reviewed: 2026-10-18T23:14:49Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
