---
phase: 05-accessories-conformance
batch: GATES
review_round: 3
reviewed: 2026-10-18T16:21:10Z
depth: deep
source_revision: 03a3dc411303f1d1ce3aa595edccc0e871d7a4b7
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
  warning: 0
  total: 3
status: issues_found
reviewer: gsd-code-reviewer
---

# Phase 5: GATES code review, correction round 3

**Source:** `03a3dc411303f1d1ce3aa595edccc0e871d7a4b7`
**Depth:** deep
**Result:** issues_found

## Summary

I read all four gate tests and the shared helper in full. I reviewed the changed stand-in and Cucumber adaptation declarations, plus the bounded platform read consumer. The three opening causes are repaired at their cited sites. Three other valid TypeScript spellings still bypass import, read-handler, or direct HAP-use gates. With three new causes, this round makes no reduction in open findings.

## Findings

### CR-05-GATES-027 - BLOCKER: Namespace createRequire loads bypass the shared import gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, each case must fail for a plausible wrong implementation; `.agents/skills/typescript-unit-tests/rules/review.md`, weak gate assertions; SAFE-07, SAFE-08 and RES-04 in the three gate overviews.
**Location:** `03a3dc411303f1d1ce3aa595edccc0e871d7a4b7:test/accessories/staticGateSources.ts:55-68,71-90,98-109`; callers at `test/accessories/timerFreedom.test.ts:59-60`, `test/accessories/hapImportScope.test.ts:98-99`, and `test/accessories/accessoryReadPathScope.test.ts:97-99`.
**Issue:** The helper collects only named `createRequire` imports. Valid ESM can use `import * as module from 'node:module'; const load = module.createRequire(import.meta.url); load('@homebridge/hap-nodejs')`. The compiled helper returned only `["node:module"]` for that source, omitting the forbidden HAP load. The same form hides a fixed timer or cloud load from its gate. The new planted controls use named imports only. The helper also collects require-variable names across the whole file without respecting scope: a parameter named `load` shadows a collected loader, but a call to that parameter is reported as a package load. A read-only compiled-helper probe returned the forbidden HAP specifier for this harmless shadowed call.
**Fix:** Resolve namespace `createRequire` member calls and track the actual loader binding at each call, including shadowing. Add a namespace-load positive and shadowed-name negative control, while keeping the named and backtick controls.
**Flags:** New loader form beyond CR-05-GATES-024's repaired named-import and no-substitution-template forms; D-16 static-gate controls.

### CR-05-GATES-028 - BLOCKER: Computed read-handler calls bypass the read-path gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, wrong implementations must fail their gate; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green classification; RES-04 in the read-path gate overview.
**Location:** `03a3dc411303f1d1ce3aa595edccc0e871d7a4b7:test/accessories/accessoryReadPathScope.test.ts:101-128,225-253`.
**Issue:** `registersReadHandler` visits call expressions only when the callee is a `PropertyAccessExpression`. TypeScript parses `characteristic['onGet'](() => false)` and `characteristic['on']('get', callback)` as `ElementAccessExpression` calls, although both register a real HAP read handler. It also accepts only `StringLiteral` for `.on`'s event, so a no-substitution-template `get` event is missed. A read-only TypeScript AST probe confirmed those node kinds. The planted controls exercise dot calls and quoted event arguments, so all can pass after a computed registration is added under `src/`.
**Fix:** Recognize static computed method names and no-substitution-template `get` arguments in the AST detector. Add positive controls for those legal forms and retain the comment-interleaved and diagnostic-string controls.
**Flags:** New call forms beyond CR-05-GATES-025's repaired comment-interleaved calls; D-16 static-gate controls.

### CR-05-GATES-029 - BLOCKER: Direct HAP setter and UUID calls bypass the accessory policy gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every gate case must discriminate the behavior it names; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green classification; the direct HAP-use assertions in `hapImportScope.test.ts`.
**Location:** `03a3dc411303f1d1ce3aa595edccc0e871d7a4b7:test/accessories/hapImportScope.test.ts:123-163,311-327,355-373`.
**Issue:** `hapUses` treats only property access as `onSet`, `uuid.generate`, or `.on('set', ...)`, and its destructuring branch checks the local binding name rather than the property name. Thus `characteristic['onSet'](handler)`, `characteristic.on(CharacteristicEventTypes.SET, handler)`, `hap.uuid['generate'](deviceId)`, and `const { generate: makeUuid } = hap.uuid; makeUuid(deviceId)` evade the direct-use assertions. These are valid JavaScript/TypeScript paths to the same HAP APIs; pinned HAP 2.2.2 declares `CharacteristicEventTypes.SET = 'set'` and dispatches that event in `Characteristic.js`. A read-only AST probe showed element-access callees and a property-access enum argument, neither accepted by the current branches. The planted executable-code case uses only dotted calls and an unaliased destructure.
**Fix:** Match static computed members, the HAP set-event enum, and destructured `generate` by its source property name. Plant each direct-use form and a negative that does not call the HAP API.
**Flags:** Separate policy detector from CR-05-GATES-023's repaired string-literal false positive; D-16 static-gate controls.

## Round status

Opening open IDs: CR-05-GATES-024, CR-05-GATES-025, CR-05-GATES-026. All three are fixed at their reported causes. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-023 remain fixed; none reopened. Three new causes are CR-05-GATES-027 through CR-05-GATES-029. Closing is `3 - 3 - 0 + 3 + 0 = 3`. This is **STOP: no progress** under D-03/D-18 because the closing count equals the opening count.

| Opening ID | Round-3 disposition and evidence |
| --- | --- |
| CR-05-GATES-024 | Fixed: `staticGateSources.ts:98-109` accepts no-substitution-template dynamic imports and calls through a named `createRequire(import.meta.url)` binding. The three import gates plant both forms. New 027 concerns namespace loading and lexical shadowing. |
| CR-05-GATES-025 | Fixed: `accessoryReadPathScope.test.ts:101-128` parses calls, including comments between tokens, and `225-253` plants both comment-interleaved positives and a diagnostic-string negative. New 028 concerns computed calls and backtick event arguments. |
| CR-05-GATES-026 | Fixed: `homekit.steps.ts:203-219` now describes the current polling deadline, last outcome and constructed cause. |

Earlier fixed IDs `001`-`017` retain the headers, split case phases, current floors, parity scripts, stand-in read and write semantics, and awaited Cucumber/platform reads recorded in rounds 1 and 2. IDs `018`-`023` retain the 134-file floor, comment-interleaved and subpath import controls, numeric HAP refusal classifier, direct-read case phases, corrected controls comment, and AST-based HAP identifier checks. The new findings address other source spellings; no fixed defect returned.

## Seed and lead dispositions

No new seed or lead was allocated to this round. The round-0 dispositions remain as recorded. The four gates have no source module, so mirrored pairing, entrypoint `describe()` structure, and isolated direct coverage remain N/A under D-17. Their documented `>=` floors remain the D-14 exception to whole-value assertions.

## Header inspection

The four gates, `staticGateSources.ts`, `features/lib/hap.ts`, and both Cucumber step files retain the approved SPDX, separate copyright and overview blocks. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `03a3dc411303f1d1ce3aa595edccc0e871d7a4b7`, Node `v26.12.0`, npm `11.20.0`, with `/opt/homebrew/opt/node/bin` first on PATH and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run build:test` | 0 | Current tests and features compiled. |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <eight inventory paths plus test/platform.test.ts> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `node --test` on the four compiled gate owners | 0 | 49 passed, 0 failed or skipped. |
| `npm run --silent test:unpaired:compiled` | 0 | Repository unpaired tests passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |

No full `npm run check` or Cucumber run is claimed for this correction review. The preceding repair history records the Cucumber result for 026. Isolated pair coverage does not apply to the four unpaired gates (D-17). Toolchain success does not cover the newly identified source forms.

## Repair history

| Cause | Verification | Repair |
| --- | --- | --- |
| CR-05-GATES-027 | Node v26.12.0: `fallow guard` 0. The planted namespace-load and shadowed-name controls compiled, then failed all six intended assertions before the helper changed (`node --test` on three gate owners exited 1). After the repair, `npm run test:unpaired` exited 0, including `build:test`; the four compiled GATES owners exited 0 with 49 passed; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exited 0 with verdict pass. | The shared scanner resolves imported `createRequire` names, namespace members and loader calls through their local TypeScript symbols. Each import gate plants a forbidden namespace load and a harmless call through a shadowing parameter. Existing named and backtick controls and the single permitted HAP importer remain in force. |
| CR-05-GATES-028 | Node v26.12.0: the new computed-method, computed-event, and backtick-event assertions compiled and failed with the intended false results before the detector changed (targeted `node --test` exit 1). After the repair, the targeted case passed (exit 0); `npm run build:test` exited 0; four compiled GATES owners passed 49/49 (exit 0); `npm run test:unpaired` exited 0; `fallow guard` and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exited 0, audit verdict pass. | The read-handler AST detector accepts dotted and static computed method calls. It reads quoted and no-substitution-template method and event names. Five planted forms cover computed and backtick spellings; the existing comment-interleaved positives and diagnostic-string negative remain. |

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS inventory adaptation, excluded from this report's YAML file list. Its changed `readOf`/`trustReadsOf` declarations and their call sites await the read promise. No additional platform finding arose from the bounded hunk. The rest of that file and the rest of the feature adaptations remain with their owning phases.

No source or test file was edited. No mutation experiment or commit was performed.


## Coordinator triage

Accepted CR-05-GATES-027 through CR-05-GATES-029 as new BLOCKERs. The namespace
`createRequire` binding and its shadowing gap, computed read-handler calls, and alternate
HAP setter and UUID spellings are valid distinct causes. Confirmed 024 through 026 fixed;
001 through 023 remain fixed, with no reopen. Opening 3, fixed 3, rejected 0, new 3,
reopened 0, closing 3: `STOP: no progress` under D-03. The maintainer authorized
continuation in this task after the stop was reported, and that resolution is recorded in
the ledger STOP cell before any round-3 repair begins.

---

_Reviewed: 2026-10-18T16:21:10Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
