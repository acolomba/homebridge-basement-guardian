---
phase: 05-accessories-conformance
batch: GATES
review_round: 7
reviewed: 2026-10-18T20:09:39Z
depth: deep
source_revision: 459dadd7e7ae51200332d510cdfbf726cc5183b5
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
  blocker: 5
  warning: 0
  total: 5
status: issues_found
reviewer: gsd-code-reviewer
---

# Phase 5: GATES code review, correction round 7

**Source:** `459dadd7e7ae51200332d510cdfbf726cc5183b5`
**Depth:** deep
**Result:** issues_found

## Summary

I read every line of the four gate tests and the shared helper, then checked the bounded HAP stand-in, Cucumber and platform adaptations. The five opening causes are fixed. Five other plausible wrong implementations still pass the gates. The closing count equals the opening count, so the terminal result is **STOP: no progress** under D-03/D-18.

## Findings

### CR-05-GATES-045 - BLOCKER: Nonliteral dynamic loads disappear from all three import gates

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, each case must discriminate its stated behavior; `.agents/skills/typescript-unit-tests/rules/review.md`, a suite a wrong implementation passes is a BLOCKER; SAFE-07, SAFE-08 and RES-04.
**Location:** `459dadd7e7ae51200332d510cdfbf726cc5183b5:test/accessories/staticGateSources.ts:162-193,242-251`; owners at `test/accessories/timerFreedom.test.ts:59-66`, `test/accessories/hapImportScope.test.ts:106-108` and `test/accessories/accessoryReadPathScope.test.ts:108-118`.
**Issue:** `fixedSpecifier` returns `undefined` for a `TemplateExpression` such as `` import(`node:timers/${'promises'}`) `` and for a genuinely variable argument such as `import(process.env.MODULE)`. The visitor silently omits both calls. A read-only call to the compiled helper returned `[]` for each. The first expression deterministically loads a forbidden module; the second can load one at runtime. Equivalent HAP and cloud targets pass their respective gates. The new concatenation cases exercise `BinaryExpression`, not these forms.
**Fix:** Resolve template expressions whose parts are fixed. For a dynamic import or recognized loader whose target cannot be resolved, fail the gate explicitly instead of returning an empty specifier list. Plant a forbidden template-expression positive and an unresolved-load control in each owning gate; keep an unrelated fixed-template negative.
**Flags:** D-14 floors stay; new unhandled expression forms beyond CR-05-GATES-042's concatenation repair.

### CR-05-GATES-046 - BLOCKER: Destructured createRequire from a module namespace bypasses the import gates

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green static assertions; SAFE-07, SAFE-08 and RES-04.
**Location:** `459dadd7e7ae51200332d510cdfbf726cc5183b5:test/accessories/staticGateSources.ts:61-69,96-126,129-159`; callers in the three import gates.
**Issue:** The creator collector records named import bindings and direct namespace member calls, but not `const { createRequire } = module` after `import * as module from 'node:module'`. That destructured function creates a working loader. A read-only call to `importSpecifiers` for a loader created this way and loading `@homebridge/hap-nodejs` returned only `['node:module']`. A timer, HAP or cloud module can therefore be loaded while its gate remains green. The repaired default, computed and identifier aliases do not cover object destructuring.
**Fix:** Track a `createRequire` property destructured from an imported module namespace, including a renamed binding, and then its loader calls. Plant a forbidden load through this binding in each import gate and a destructure from an unrelated object as a negative.
**Flags:** New creator-binding cause beyond CR-05-GATES-030 and CR-05-GATES-035.

### CR-05-GATES-047 - BLOCKER: A fixed computed method name escapes the read-handler gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green read-handler assertion; RES-04.
**Location:** `459dadd7e7ae51200332d510cdfbf726cc5183b5:test/accessories/accessoryReadPathScope.test.ts:135-149,181-188,267-275,453-501`.
**Issue:** `staticMember` accepts an element access only when its argument is a literal node. `const method = 'onGet'; characteristic[method](() => false)` is a valid HAP read-handler registration, but the call's method is `undefined` here and the detector returns false. The same gap applies to `const method = 'on'; characteristic[method]('get', handler)`. Current computed controls put the literal directly inside brackets, and event-alias controls change the argument rather than the method.
**Fix:** Resolve a fixed local method binding for element-access calls, then recognize `onGet` and the EventEmitter listener methods. Plant both method-alias positives and an unrelated method alias negative.
**Flags:** New method-binding cause beyond CR-05-GATES-028's literal computed methods and CR-05-GATES-043's event-argument aliases.

### CR-05-GATES-048 - BLOCKER: An alias of the injected HAP namespace escapes UUID-call detection

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green direct HAP-use assertion; SAFE-08.
**Location:** `459dadd7e7ae51200332d510cdfbf726cc5183b5:test/accessories/hapImportScope.test.ts:182-219,238-269,602-634,784-792`.
**Issue:** `const hapApi = this.api.hap; hapApi.uuid.generate(deviceId)` invokes the injected HAP UUID generator, but `isHapNamespace` accepts only an identifier spelled `hap` or an immediate member named `hap`. The `hapApi` identifier is not recorded as a HAP-namespace capability, so this direct call sets neither UUID flag and passes every generated module case. The existing alias controls start at `hap.uuid` or destructure `uuid` directly; they do not alias the containing namespace.
**Fix:** Record aliases of the injected HAP namespace and follow them into UUID capabilities, respecting local shadowing. Plant a namespace-alias positive and an unrelated namespace-alias negative.
**Flags:** New preceding binding step beyond CR-05-GATES-032 and CR-05-GATES-044; D-16 static-gate control.

### CR-05-GATES-049 - BLOCKER: Write fidelity never checks the value delivered to onSet

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, a wrong implementation must fail its case; `.agents/skills/typescript-unit-tests/rules/review.md`, weak or missing assertions are BLOCKERs; D-16 parity scope.
**Location:** `459dadd7e7ae51200332d510cdfbf726cc5183b5:test/accessories/hapWriteFidelity.test.ts:66-75,182-187,211-222,321-360`; stand-in consumer at `features/lib/hap.ts:321-343` and control binder at `src/accessories/controls.ts:642`.
**Issue:** `WriteSubject.onSet` accepts a zero-argument handler, and every parity script ignores the value passed by HAP. If the stand-in calls its setter handler with `false` during a `set(true)` request, all current parity records still agree because the handlers return or reject independently of their argument, even though `controls.ts` uses that value to decide a command. Pinned HAP 2.2.2 passes the requested value to `setHandler` (`Characteristic.js:1805`); a read-only probe of a real `Switch.On` write observed `true`. This is a confirmed disagreement the fidelity suite would not detect, distinct from the previously repaired write ordering and handler replacement gaps.
**Fix:** Let `WriteSubject.onSet` receive the requested value and add a same-script real/stand-in assertion that a `set(true)` delivers `true` and a `set(false)` delivers `false`. Assert the exact observed sequence independently of either implementation's stored value.
**Flags:** D-16 confirmed parity gap; no current stand-in defect or production bug is claimed.

## Round status

Opening open IDs: CR-05-GATES-040 through CR-05-GATES-044. All five are fixed at their cited causes. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-039 remain fixed; none reopened. New IDs are CR-05-GATES-045 through CR-05-GATES-049. Closing is `5 - 5 - 0 + 5 + 0 = 5`; terminal result **STOP: no progress** under D-03/D-18.

| Opening ID | Round-seven disposition and evidence |
| --- | --- |
| CR-05-GATES-040 | Fixed: `timerFreedom.test.ts:63-74,211-259` uses the recursive helper and tests a nested module, missing tree and floor. |
| CR-05-GATES-041 | Fixed: `hapImportScope.test.ts:94-101,747-792` enumerates accessory modules for setter and UUID cases, with the binder exemption only for setters. |
| CR-05-GATES-042 | Fixed: `staticGateSources.ts:162-175` resolves fixed concatenations and constant aliases; all three owners plant forbidden computed expressions and unrelated negatives. New 045 concerns template and unresolved expressions. |
| CR-05-GATES-043 | Fixed: `accessoryReadPathScope.test.ts:123-179,249-260,453-511` resolves fixed event aliases and plants GET and non-GET controls. New 047 concerns an alias of the method name. |
| CR-05-GATES-044 | Fixed: `hapImportScope.test.ts:222-247,602-653` tracks `uuid` destructured from `hap` and a renamed binding from `this.api.hap`, with an unrelated-object negative. New 048 aliases the enclosing HAP namespace before extracting `uuid`. |

## Seed and lead dispositions

No new seed or research lead belongs to round seven. Round-zero dispositions remain recorded. Under D-17, mirrored pairing, one `describe()` per exported source entrypoint and isolated direct coverage are N/A for the four gates because they have no source module. The helper is test support and needs no mirrored meta-test. D-14 retains the `>=` floors and its whole-value exception.

## Header inspection

The four gates, `staticGateSources.ts`, `features/lib/hap.ts` and both Cucumber step files retain the D-01 SPDX, copyright and overview sections. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `459dadd7e7ae51200332d510cdfbf726cc5183b5`, Node `v26.12.0`, npm `11.20.0`, with `/opt/homebrew/opt/node/bin` first on PATH and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <eight inventory paths plus test/platform.test.ts> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Current tests and features compiled. |
| `node --test` on the four compiled gate owners | 0 | 72 passed; zero failed, cancelled, skipped or todo. |
| `npm run test:unpaired` | 0 | Repository unpaired suite passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |

No full `npm run check`, isolated pair coverage or Cucumber run is claimed for this correction review. The current tests do not exercise the five source forms above.

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS adaptation excluded from this report's YAML list. Its bounded `readOf` and `trustReadsOf` helpers and affected assertions await the stand-in's read promise. I found no defect in that bounded hunk. The remainder of the platform file and unmodified feature declarations belong to their owning phases.

No source or test file was edited. No mutation experiment or commit was performed.


## Coordinator triage

Accepted CR-05-GATES-045 through CR-05-GATES-049 as new BLOCKERs. Unresolved
dynamic module expressions, destructured `createRequire`, method and HAP namespace
aliases, and the missing write-value parity assertion are distinct false-green
causes. Confirmed 040 through 044 fixed and 001 through 039 still fixed; none
reopened. Opening 5, fixed 5, rejected 0, new 5, reopened 0, closing 5:
`STOP: no progress` under D-03. The maintainer authorized continuation in this
task after the stop was reported; the resolution is recorded in the ledger STOP
cell before any round-7 repair begins.

## Repair history

| ID | Change | Evidence |
| --- | --- | --- |
| CR-05-GATES-045 | Resolved fixed template spans and made unresolved dynamic imports and recognized `createRequire` loads throw. Added fixed forbidden templates, unresolved loads, and unrelated fixed templates to all three owning gates. | The three owners had nine intended RED failures (exit 1) before the helper change. After the change, `npm run build:test` exited 0, all four compiled gate owners passed 78/78, `npm run test:unpaired` exited 0, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` passed. Node `v26.12.0`. |
| CR-05-GATES-046 | Tracked `createRequire` destructured from an imported `node:module` namespace, including a renamed binding. Each import gate now tests both forms and an unrelated-object destructure. | Before the helper change, all three owners had one intended RED failure (exit 1) on the planted imports. A temporary namespace-check mutation made the timer owner's planted case fail (exit 1); restoring the helper's recorded blob made it pass (exit 0). `npm run build:test` exited 0, all four compiled gate owners passed 78/78, `npm run test:unpaired` exited 0, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` passed. Node `v26.12.0`. |
| CR-05-GATES-047 | Resolved fixed local method names in element-access read-handler calls, including `onGet`, `on`, and `addListener`. A planted `emit` alias stays negative. | The planted positives made the read-path owner fail on the intended assertion (exit 1) before the detector change. `npm run build:test` exited 0, the owner passed 9/9, all four compiled gate owners passed 78/78, `npm run test:unpaired` exited 0, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` returned verdict `pass` (exit 0). Node `v26.12.0`. |
| CR-05-GATES-048 | Tracked local aliases of the injected HAP namespace through UUID member calls and destructuring, while rejecting unrelated and shadowed bindings. | The planted alias case failed on its intended assertion before the detector change (owner exit 1). Temporarily removing the namespace capability made that case fail again (owner exit 1); restoring the exact file blob `a0eb581c2f9e079384455724f7a0dc9c6f67af04` restored a passing owner (42/42). `npm run build:test` exited 0, all four compiled gate owners passed 79/79, `npm run test:unpaired` exited 0, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 --format json --quiet --explain` returned verdict `pass` (exit 0). Node `v26.12.0`. |

---

_Reviewed: 2026-10-18T20:09:39Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
