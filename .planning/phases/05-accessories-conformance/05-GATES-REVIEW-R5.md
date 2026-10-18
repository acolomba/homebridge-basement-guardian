---
phase: 05-accessories-conformance
batch: GATES
review_round: 5
reviewed: 2026-10-18T18:07:45Z
depth: deep
source_revision: c02e242b83c449b76f3addebbaa3166aa06a561c
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

# Phase 5: GATES code review, correction round 5

**Source:** `c02e242b83c449b76f3addebbaa3166aa06a561c`
**Depth:** deep
**Result:** issues_found

## Summary

I read every line of the four gates and their shared helper. I reviewed the changed declarations in the HAP stand-in and Cucumber steps, and the bounded platform consumer. The five opening repairs catch their planted forms. Five other valid source forms still pass gates whose assertions claim to exclude them. The open count stays at five, so this round is `STOP: no progress` under D-03/D-18.

## Findings

### CR-05-GATES-035 - BLOCKER: Alternate createRequire bases and loader aliases bypass import confinement

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every gate case must fail for a plausible violation; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green assertion; SAFE-07, SAFE-08 and RES-04 in the three import-gate overviews.
**Location:** `c02e242b83c449b76f3addebbaa3166aa06a561c:test/accessories/staticGateSources.ts:126-167,179-208`; callers at `test/accessories/timerFreedom.test.ts:58-60`, `test/accessories/hapImportScope.test.ts:101-103`, and `test/accessories/accessoryReadPathScope.test.ts:103-111`.
**Issue:** `requireBinding` accepts a loader only when `createRequire` receives the exact AST shape `import.meta.url`; `visit` recognizes a load only through that first variable's symbol. Both `createRequire(new URL('./probe.js', import.meta.url))` and `createRequire(join(process.cwd(), 'probe.js'))` create working loaders for this repository's installed HAP package, but the compiled `importSpecifiers` returned only `['node:module']` for an alternate-base fixed load. Likewise, `const loadModule = createRequire(import.meta.url); const load = loadModule; load('@homebridge/hap-nodejs')` returned only `['node:module']`. A fixed timer or cloud load through these forms also escapes its gate. Round four's 030 controls cover creator aliases and computed/default imports, not alternate loader bases or aliases of the resulting loader.
**Fix:** Track loader values through local aliases and accept valid `createRequire` bases, or conservatively flag an unrecognized loader construction. Plant fixed forbidden loads through an alternate base and through a loader alias in each affected gate, with an unrelated function-call negative.
**Flags:** New loader-construction and loader-value forms beyond CR-05-GATES-030's repaired creator bindings; D-16 static-gate controls.

### CR-05-GATES-036 - BLOCKER: Nonliteral dynamic loads are invisible to every import gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, a wrong implementation must fail a gate; `.agents/skills/typescript-unit-tests/rules/review.md`, weak gate assertion; SAFE-07, SAFE-08 and RES-04.
**Location:** `c02e242b83c449b76f3addebbaa3166aa06a561c:test/accessories/staticGateSources.ts:193-208`; callers in all three import gates at `test/accessories/timerFreedom.test.ts:58-60`, `test/accessories/hapImportScope.test.ts:101-103`, and `test/accessories/accessoryReadPathScope.test.ts:103-111`.
**Issue:** The shared collector records a dynamic import or loader call only when its argument is a string literal or a no-substitution template. Valid ESM such as `const target = 'node:timers/promises'; await import(target)` returned `[]` from the compiled helper; the same source with `@homebridge/hap-nodejs` returned `[]`. `const target = '@homebridge/hap-nodejs'; loadModule(target)` after a recognized `createRequire` returned only `['node:module']`. Each gate therefore passes a deterministic forbidden load written through a local constant. All planted positives use literal arguments.
**Fix:** Resolve fixed local string constants at the call site or fail closed on a nonliteral dynamic import/load in a monitored source file. Plant a constant-driven forbidden load in each owner and a dynamic load of an unrelated module as the negative control for whichever policy is chosen.
**Flags:** New specifier-expression cause, separate from the creator-binding and loader-value gaps; D-16 static-gate controls.

### CR-05-GATES-037 - BLOCKER: EventEmitter listener methods bypass read and write handler gates

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green gate assertions; RES-04 read-path and direct HAP-use assertions.
**Location:** `c02e242b83c449b76f3addebbaa3166aa06a561c:test/accessories/accessoryReadPathScope.test.ts:135-155,324-359`; `c02e242b83c449b76f3addebbaa3166aa06a561c:test/accessories/hapImportScope.test.ts:202-215,558-576`.
**Issue:** The read gate recognizes `onGet` and `on('get', ...)`, and the direct-write gate recognizes `onSet` and `on('set', ...)`. Pinned HAP `Characteristic` extends Node `EventEmitter` and dispatches through its `get`/`set` listeners. A read-only pinned-HAP probe registered a `get` listener with each of `addListener`, `once`, `prependListener`, and `prependOnceListener`; `listeners('get').length` was one each time. The detectors ignore these methods, so an accessory can register a network-backed read handler, or a direct set handler, without failing either gate. The new 031/032 controls cover alternate event expressions and HAP aliases but still call `.on`.
**Fix:** Match the EventEmitter methods that register listeners when the event is statically `get` or `set`, preserving the read/write scopes. Plant a positive for each applicable method and a different-event negative.
**Flags:** New listener-method cause beyond CR-05-GATES-031's GET event-expression forms and 032's HAP capability aliases; D-16 static-gate controls.

### CR-05-GATES-038 - BLOCKER: UUID generation through an aliased function escapes the direct-use gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every case must discriminate its claim; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green direct HAP-use assertion.
**Location:** `c02e242b83c449b76f3addebbaa3166aa06a561c:test/accessories/hapImportScope.test.ts:177-198,202-231,491-513,569-576`.
**Issue:** `hapUses` recognizes `uuidApi.generate(deviceId)` after `const uuidApi = hap.uuid`, but records no `generate` function value. `const generate = hap.uuid.generate; generate(deviceId)` reaches the real HAP function (a read-only pinned-HAP call returned a UUID), yet sets neither `memberCall` nor `destructuredCall`. `const uuidApi = hap.uuid; const { generate } = uuidApi; generate(deviceId)` also passes because the destructuring branch requires an immediate `.uuid` initializer. Conversely, that branch sets `destructuredCall` on a declaration without checking whether its binding is called, and on `other.uuid`; it can report a direct HAP call that did not occur. The 032 fixture only covers an object alias followed by a member call.
**Fix:** Track `generate` bindings back to the HAP UUID object and set the flag at actual calls. Plant direct-function and aliased-destructure calls, plus unused and unrelated `generate` bindings as negatives.
**Flags:** New function-value and destructuring-origin cause beyond CR-05-GATES-032's repaired object alias; D-16 static-gate controls.

### CR-05-GATES-039 - BLOCKER: A query-suffixed account-runtime import bypasses cloud confinement

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, a gate must fail for a plausible wrong implementation; RES-04 in the read-path gate overview.
**Location:** `c02e242b83c449b76f3addebbaa3166aa06a561c:test/accessories/accessoryReadPathScope.test.ts:103-111,220-228,370-403`.
**Issue:** `reachesTheNetworkTier` resolves a relative specifier with `node:path` and compares the account runtime to one exact filename. Node ESM accepts `import('../runtime/accountRuntime.js?probe')` as a load of that file; a read-only import probe of a local compiled module with a query succeeded. `resolve` retains `?probe` in the resulting path, so this valid account-runtime import fails the equality check and the gate passes. The 033 repair correctly normalizes equivalent relative path segments, but none of its fixtures has a query or fragment suffix.
**Fix:** Parse the relative module specifier as a URL and compare its decoded pathname, or strip a valid search/fragment suffix before path resolution. Plant query- and fragment-suffixed account-runtime imports and a neighbouring runtime import negative.
**Flags:** New specifier-suffix cause beyond CR-05-GATES-033's repaired relative-path spellings; D-16 static-gate controls.

## Round status

Opening open IDs: CR-05-GATES-030, CR-05-GATES-031, CR-05-GATES-032, CR-05-GATES-033, CR-05-GATES-034. Each is fixed at its cited cause. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-029 remain fixed; none reopened. New IDs are CR-05-GATES-035 through CR-05-GATES-039. Closing is `5 - 5 - 0 + 5 + 0 = 5`, so the terminal result is **STOP: no progress** under D-03/D-18.

| Opening ID | Round-5 disposition and evidence |
| --- | --- |
| CR-05-GATES-030 | Fixed: `staticGateSources.ts:58-123,137-153` resolves named, computed namespace, default-import and local creator-alias bindings. The three gate owners plant those positive forms and a shadowed creator alias. New 035 and 036 concern loader values and arguments, not creator binding. |
| CR-05-GATES-031 | Fixed: `accessoryReadPathScope.test.ts:135-147` accepts bare, qualified and computed `CharacteristicEventTypes.GET` expressions; `184-195,324-359` plant each. New 037 concerns other listener methods. |
| CR-05-GATES-032 | Fixed: `hapImportScope.test.ts:177-198,202-215` follows a local UUID object alias and a SET event alias; `491-513` plant positives and an unrelated negative. New 038 concerns a `generate` function value and destructuring from an alias. |
| CR-05-GATES-033 | Fixed: `accessoryReadPathScope.test.ts:103-111` resolves canonical, alternate and nested relative paths; `216-237,370-403` plant cloud and account-runtime imports. New 039 concerns the URL suffix left on an otherwise identical filename. |
| CR-05-GATES-034 | Fixed: `timerFreedom.test.ts:39-45,69-86,161-199` forbids and plants both bare Node timer module names; no regression found. |

## Seed and lead dispositions

No new seed or lead was allocated to this round. Round-0 dispositions remain recorded. The four gates have no source module, so mirrored pairing, entrypoint `describe()` structure, and isolated direct coverage remain N/A under D-17. Their documented `>=` floors remain the D-14 exception to whole-value assertions.

## Header inspection

All four gates, `staticGateSources.ts`, `features/lib/hap.ts`, and both step files retain the approved SPDX, separate copyright and overview blocks. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `c02e242b83c449b76f3addebbaa3166aa06a561c`, Node `v26.12.0`, npm `11.20.0`, with `/opt/homebrew/opt/node/bin` first on PATH and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run build:test` | 0 | Current tests and features compiled. |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <eight inventory paths plus test/platform.test.ts> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `node --test` on four compiled gate owners | 0 | 53 passed, 0 failed, skipped or cancelled. |
| `npm run test:unpaired` | 0 | Repository unpaired tests passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |

No full `npm run check`, isolated pair coverage or Cucumber run is claimed for this correction review. The four gates are unpaired under D-17. Passing toolchain checks do not exercise the five source forms above. The installed HAP 2.2.2 source (`Characteristic.js:250,1692,1742,1801,1843`) establishes the EventEmitter and event-dispatch behavior; current [Homebridge HAP documentation](https://developers.homebridge.io/HAP-NodeJS/classes/Characteristic.html) also names the GET/SET handler semantics. No difference relevant to these findings was observed.

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS inventory adaptation and is excluded from the YAML file list. Its bounded `readOf`/`trustReadsOf` declarations and call sites await the read promises. The rest of that file and the unmodified feature code belong to their owning phases. I found no new defect in the bounded platform hunk.

No source or test file was edited. No mutation experiment or commit was performed.

## Repair history

| Cause | Verification | Repair |
| --- | --- | --- |
| CR-05-GATES-035 | Node v26.12.0: `fallow guard` exited 0. The three owners' planted load cases failed on the intended alternate-base and loader-alias assertions before the helper changed (`node --test` exit 1). After the repair, `npm run build:test`, the four compiled GATES owners (53/53), `npm run test:unpaired`, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exited 0; audit verdict pass. D-04 control: disabling loader-alias propagation made the timer case fail on `loaderAlias` (exit 1). Restoring source blob `af59b3fdccb4ed6858e34d333c169c9029febd10` made that case pass (exit 0). | The shared scanner recognizes imported `createRequire` calls with alternate URL or path bases and follows local aliases of their loaders by TypeScript symbol. Each import gate plants a forbidden alternate-base load and a loader-alias load, plus an unrelated function-call negative. The timer gate also covers a `join(process.cwd(), 'probe.js')` base. |
| CR-05-GATES-036 | Node v26.12.0: `fallow guard` exited 0. The three owners' planted constant-driven dynamic and loader cases failed on their intended assertions before the helper changed (`node --test` exit 1). After the repair, `npm run build:test`, the four compiled GATES owners (53/53), `npm run test:unpaired`, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exited 0; audit verdict pass. D-04 control: disabling the `target` binding made the timer case fail on `constantDynamic` and `constantCreateRequire` (exit 1). Restoring source blob `86a919212751032452d52c143fd11cceaf61308f` made all four owners pass again (exit 0). | The shared scanner resolves fixed local string constants by TypeScript symbol at dynamic import and recognized loader calls. Each import gate plants both constant-driven forbidden forms and an unrelated constant-driven dynamic import negative. |
| CR-05-GATES-037 | Node v26.12.0: both planted listener cases failed on the four new method assertions before the detector edits (`node --test` exit 1). After the repair, `npm run build:test`, the four compiled GATES owners (56/56), `npm run test:unpaired`, `fallow guard`, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exited 0; audit verdict pass. D-04 control: restricting both listener method sets to `on` made both planted cases fail (exit 1). Restoring blobs `fd50cc081f9178fa43f000a01b3c564d38ce2d16` and `6758dfff9f5c0bea1942398a3710ce20ab1f1ba2` made the named cases pass (exit 0). | The read and direct-set gates recognize `addListener`, `once`, `prependListener`, and `prependOnceListener` with their respective `get` or `set` events. Each gate plants all four methods and checks that registrations for another event stay unreported. |


## Coordinator triage

Accepted CR-05-GATES-035 through CR-05-GATES-039 as new BLOCKERs. Alternate
loader bases and aliases, nonliteral dynamic loads, EventEmitter listener methods,
UUID function aliases, and query-suffixed account-runtime imports each provide a
valid distinct bypass. Confirmed 030 through 034 fixed and 001 through 029 still
fixed; none reopened. Opening 5, fixed 5, rejected 0, new 5, reopened 0,
closing 5: `STOP: no progress` under D-03. The maintainer authorized
continuation in this task after the stop was reported; the resolution is recorded
in the ledger STOP cell before any round-5 repair begins.

---

_Reviewed: 2026-10-18T18:07:45Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
