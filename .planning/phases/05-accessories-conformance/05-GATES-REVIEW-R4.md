---
phase: 05-accessories-conformance
batch: GATES
review_round: 4
reviewed: 2026-10-18T17:05:57Z
depth: deep
source_revision: e238e0bfb45ce1e77c632c1acde88c5b189ac782
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

# Phase 5: GATES code review, correction round 4

**Source:** `e238e0bfb45ce1e77c632c1acde88c5b189ac782`
**Depth:** deep
**Result:** issues_found

## Summary

I read every line of the four gates and their shared helper, then reviewed the changed declarations in the stand-in and step adaptations. The three opening repairs work for the cases they target. Five other valid source forms still pass gates that claim to forbid them. The open count rises from three to five, so this round is `STOP: no progress` under D-03/D-18.

## Findings

### CR-05-GATES-030 - BLOCKER: Other createRequire bindings bypass the import scanner

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, each case must fail for a plausible wrong implementation; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green gate assertion.
**Location:** `e238e0bfb45ce1e77c632c1acde88c5b189ac782:test/accessories/staticGateSources.ts:67-94,108-132,147-173`; callers at `test/accessories/timerFreedom.test.ts:59-60`, `test/accessories/hapImportScope.test.ts:99-100`, and `test/accessories/accessoryReadPathScope.test.ts:99-100`.
**Issue:** `importedCreators` records named and namespace imports from `node:module`, but `callsImportedCreator` recognizes only an imported identifier or a dotted namespace member. Valid ESM forms such as `module['createRequire'](import.meta.url)`, `import module from 'node:module'; module.createRequire(import.meta.url)`, and `const make = createRequire; make(import.meta.url)` create working loaders whose subsequent fixed loads are omitted. A read-only call to the compiled `importSpecifiers` returned only `['node:module']` for each form, omitting the planted HAP, timer, or cloud specifier. The three gates plant only the named and dotted-namespace forms.
**Fix:** Resolve the actual creator binding and its static computed/default-import and local-alias forms before collecting loader symbols. Plant a forbidden load for each form in the three owning gates, with a harmless shadowed-name control.
**Flags:** New creator-binding forms beyond CR-05-GATES-027's repaired dotted namespace and lexical-shadowing forms; D-16 static-gate controls.

### CR-05-GATES-031 - BLOCKER: Qualified HAP read-event constants bypass the read-handler gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, a gate must fail for a plausible wrong implementation; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green assertion; RES-04 in the gate overview.
**Location:** `e238e0bfb45ce1e77c632c1acde88c5b189ac782:test/accessories/accessoryReadPathScope.test.ts:103-141,162-179,259-289`.
**Issue:** The `.on(...)` detector accepts `CharacteristicEventTypes.GET` only when the enum owner is a bare identifier. `characteristic.on(hap.CharacteristicEventTypes.GET, handler)` uses the injected HAP namespace and registers the same read handler, but `event.expression` is a property access and the detector returns false. The static computed enum form `CharacteristicEventTypes['GET']` also returns false. Pinned HAP declares `GET = 'get'` and dispatches that event in `Characteristic.js`; `api.hap` is the host HAP namespace. The planted controls cover a bare enum reference and computed method names, not these event references.
**Fix:** Recognize static qualified and computed `CharacteristicEventTypes.GET` event expressions, and plant both registrations while retaining the diagnostic-string negative.
**Flags:** New event-expression forms beyond CR-05-GATES-028's repaired computed callee and backtick-string forms; D-16 static-gate controls.

### CR-05-GATES-032 - BLOCKER: Aliased HAP API calls bypass the direct-use gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every gate case must discriminate the behavior it names; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green assertion.
**Location:** `e238e0bfb45ce1e77c632c1acde88c5b189ac782:test/accessories/hapImportScope.test.ts:136-187,370-404,432-450`.
**Issue:** `hapUses` recognizes a UUID generation call only when the callee's immediate receiver has the literal member name `uuid`, or when `generate` is destructured directly from such an initializer. `const uuidApi = hap.uuid; uuidApi.generate(deviceId)` is a real call to the same HAP function but sets neither `memberCall` nor `destructuredCall`. Likewise, `const readEvent = hap.CharacteristicEventTypes.SET; characteristic.on(readEvent, handler)` sets no `setEvent` flag because `isSetEvent` does not resolve the local alias. A read-only runtime probe confirmed the HAP `uuid.generate` function works through an object alias. The planted cases exercise direct member and direct destructuring forms only.
**Fix:** Follow local aliases of the forbidden HAP capabilities through their call sites, and plant UUID and set-event alias controls. Keep a negative alias that points to an unrelated API.
**Flags:** New alias-propagation cause beyond CR-05-GATES-029's repaired computed members and aliased destructuring property; D-16 static-gate controls.

### CR-05-GATES-033 - BLOCKER: Equivalent relative paths bypass cloud confinement

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, a gate must fail for a plausible wrong implementation; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green assertion; RES-04 in the gate overview.
**Location:** `e238e0bfb45ce1e77c632c1acde88c5b189ac782:test/accessories/accessoryReadPathScope.test.ts:61-70,99-100,184-215,227-241,299-321`.
**Issue:** `reachesTheNetworkTier` compares raw specifier text against `../cloud/` and one `../runtime/accountRuntime.js` spelling. From `src/accessories`, `../../src/cloud/api.js` resolves to the same cloud client, and `../../src/runtime/accountRuntime.js` resolves to the same account runtime, but neither text matches. A read-only path-resolution and compiled-helper probe confirmed the first path resolves to `src/cloud/api.js` and is returned verbatim by `importSpecifiers`. The gate can therefore pass after an accessory imports either forbidden module through an equivalent path.
**Fix:** Resolve local specifiers against each source file's directory before applying the forbidden-target rule. Plant canonical and equivalent-path imports for both targets.
**Flags:** Separate path-classification cause; D-16 static-gate controls.

### CR-05-GATES-034 - BLOCKER: Bare Node timer specifiers bypass the deferred-execution gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, each gate case must fail for a plausible wrong implementation; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green assertion; SAFE-07 in the gate overview.
**Location:** `e238e0bfb45ce1e77c632c1acde88c5b189ac782:test/accessories/timerFreedom.test.ts:39-46,59-60,67-105,117-160`.
**Issue:** `DEFERRED_EXECUTION_MODULES` lists `node:timers` and `node:timers/promises` only. Node also accepts the bare built-in specifiers `timers` and `timers/promises`. A read-only Node probe confirmed `timers/promises` is a built-in and `importSpecifiers` returns that bare string. An accessory can await `import('timers/promises')` or import its `setTimeout` and defer a safety publish while this gate stays green. Every planted timer fixture uses the `node:` prefix.
**Fix:** Include both bare built-in names in the forbidden set and plant at least one static and one dynamic bare-import control.
**Flags:** Separate module-name cause; D-16 static-gate controls.

## Round status

Opening open IDs: CR-05-GATES-027, CR-05-GATES-028, CR-05-GATES-029. All three are fixed at their cited causes. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-026 remain fixed; none reopened. New IDs are CR-05-GATES-030 through CR-05-GATES-034. Closing is `3 - 3 - 0 + 5 + 0 = 5`, so the terminal result is **STOP: no progress** under D-03/D-18.

| Opening ID | Round-4 disposition and evidence |
| --- | --- |
| CR-05-GATES-027 | Fixed: `staticGateSources.ts:67-132,147-173` now uses TypeScript symbols for named and dotted namespace `createRequire` bindings and distinguishes a shadowing parameter. All three gate owners plant namespace-load and shadowed-call controls. New 030 concerns other creator bindings. |
| CR-05-GATES-028 | Fixed: `accessoryReadPathScope.test.ts:107-132` accepts static computed `onGet` and `on` calls, plus backtick event strings; `171-179,259-289` plant those controls. New 031 concerns qualified/computed enum event expressions. |
| CR-05-GATES-029 | Fixed: `hapImportScope.test.ts:124-187` recognizes static computed setter and UUID members, a direct `CharacteristicEventTypes.SET` reference, and `generate` destructured with a renamed local binding. `370-404` plant positives and a negative. New 032 concerns aliases of the HAP object or event value. |

IDs 001-026 retain the headers, case structure, enumeration floors, parity scripts, literal import scanning, direct-read phases, stand-in and Cucumber read behavior, and comments verified in the earlier correction reports. The new issues are separate source forms and target classifications; none is a recurrence of a fixed spelling.

## Seed and lead dispositions

No new seed or lead was allocated to this round. Round-0 dispositions remain recorded. The four gates have no source module, so mirrored pairing, entrypoint `describe()` structure, and isolated direct coverage remain N/A under D-17. Their documented `>=` floors remain D-14 exceptions to whole-value assertions.

## Header inspection

All four gates, `staticGateSources.ts`, `features/lib/hap.ts`, and both step files retain the approved SPDX, copyright and separate overview blocks. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `e238e0bfb45ce1e77c632c1acde88c5b189ac782`, Node `v26.12.0`, npm `11.20.0`, with `/opt/homebrew/opt/node/bin` first on PATH and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run build:test` | 0 | Current tests and features compiled. |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <eight inventory paths plus test/platform.test.ts> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `node --test` on the four compiled gate owners | 0 | 51 passed; 0 failed, skipped or cancelled. |
| `npm run --silent test:unpaired:compiled` | 0 | Unpaired repository tests passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |

No full `npm run check`, direct pair coverage, or Cucumber run is claimed for this correction review. The four gates are unpaired under D-17; the feature and platform adaptations have their prior bounded verification. Passing toolchain checks do not exercise the five source forms above.

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS inventory adaptation, excluded from this report's YAML file list. Its bounded `readOf` and `trustReadsOf` changes still await the read promises at their call sites. The rest of the platform file and the unmodified feature code belong to their owning phases. I found no new defect in the bounded platform hunk.

No source or test file was edited. No mutation experiment or commit was performed.


## Coordinator triage

Accepted CR-05-GATES-030 through CR-05-GATES-034 as new BLOCKERs. The alternate
`createRequire` bindings, GET event expressions, HAP capability aliases, equivalent
relative paths, and bare Node timer names each provide a distinct valid bypass.
Confirmed 027 through 029 fixed and 001 through 026 still fixed; none reopened.
Opening 3, fixed 3, rejected 0, new 5, reopened 0, closing 5:
`STOP: no progress` under D-03. The maintainer authorized continuation in this
task after the stop was reported; the resolution is recorded in the ledger STOP
cell before any round-4 repair begins.

## Repair history

| Cause | Verification | Repair |
| --- | --- | --- |
| CR-05-GATES-030 | Node v26.12.0: `fallow guard` exited 0. The three gate owners' planted-positive cases failed as intended before the helper changed (each `node --test` exit 1). After the repair, `npm run build:test`, four compiled GATES owners (51/51), `npm run test:unpaired`, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exited 0; audit verdict pass. D-04 control: changing alias registration from named to namespace made the timer owner fail on `aliasedCreateRequire` (exit 1); restoring the source blob `f93d1c07b1d2d1828da386a51411bc6191d79560` made it pass (exit 0). | The shared scanner resolves computed and default `node:module` creator access and local aliases using TypeScript symbols. All three import gates plant each forbidden load plus a harmless shadowed creator alias. |
| CR-05-GATES-031 | Node v26.12.0: `fallow guard` exited 0. D-04 control: the existing scanner at blob `3dd149dc315cc158f830708a7cbd73a82fe1ad81` missed all three new GET event expressions; the planted case failed as intended (`node --test --test-name-pattern` exit 1) before the detector changed. After the repair, `npm run build:test`, four compiled GATES owners (51/51), `npm run test:unpaired`, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exited 0; audit verdict pass. | The AST scanner recognizes qualified and computed `CharacteristicEventTypes.GET` expressions. Three registrations and a diagnostic-string negative guard the behavior. |
| CR-05-GATES-033 | Node v26.12.0: `fallow guard` exited 0. D-04 control: the raw-specifier check at blob `0792e15042807821e553295e6c51d7568de01c1e` missed both equivalent paths; the planted import case failed as intended (`node --test --test-name-pattern` exit 1) before the detector changed. After the repair, `npm run build:test`, four compiled GATES owners (51/51), `npm run test:unpaired`, and `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` exited 0; audit verdict pass. | The gate resolves each relative import from its source file before checking cloud and account-runtime targets. Canonical, alternate, and nested-source fixtures guard the path classification. |

---

_Reviewed: 2026-10-18T17:05:57Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
