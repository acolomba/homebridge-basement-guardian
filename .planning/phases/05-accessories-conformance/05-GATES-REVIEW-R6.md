---
phase: 05-accessories-conformance
batch: GATES
review_round: 6
reviewed: 2026-10-18T19:35:09Z
depth: deep
source_revision: c08f7aec79882bcb5e9d33561ebd57203adec7ff
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

# Phase 5: GATES code review, correction round 6

**Source:** `c08f7aec79882bcb5e9d33561ebd57203adec7ff`
**Depth:** deep
**Result:** issues_found

## Summary

I read every line of the four gate tests and their shared helper. I reviewed the changed declarations in the HAP stand-in and Cucumber steps, and the bounded platform consumer. The five opening repairs catch the source forms named in round five. Five other valid source forms still pass assertions that claim to exclude them. The count remains five, so this review's terminal result is `STOP: no progress` under D-03/D-18.

## Findings

### CR-05-GATES-040 - BLOCKER: The timer gate omits nested accessory modules

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every case must discriminate the behavior named in its title; `.agents/skills/typescript-unit-tests/rules/review.md`, a suite that a wrong implementation passes is a BLOCKER; SAFE-07 in the timer gate overview.
**Location:** `c08f7aec79882bcb5e9d33561ebd57203adec7ff:test/accessories/timerFreedom.test.ts:182-194`; contrast the recursive enumerator at `test/accessories/staticGateSources.ts:46-57`.
**Issue:** The SAFE-07 owner reads only immediate `.ts` entries returned by `readdirSync(ACCESSORIES_DIRECTORY)`. It excludes any TypeScript module in a nested accessory directory. Adding `src/accessories/nested/monitor.ts` with an import of `node:timers/promises` leaves `modules` at its current ten entries, satisfies the floor, and leaves `importing` empty. The other static gates already use `typeScriptFilesUnder`, so this is a distinct enumeration gap, not one of the opening loader repairs.
**Fix:** Enumerate `src/accessories` with the shared recursive helper. Add a positive control that proves a nested path is read and a missing-tree/floor control; retain the `>=` floor.
**Flags:** D-14 floor remains; new enumeration cause, not a reopening of CR-05-GATES-034.

### CR-05-GATES-041 - BLOCKER: The direct HAP-use cases cover only four of ten accessory modules

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every case must discriminate its claim; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green gate assertion; SAFE-08/direct HAP-use contract in `hapImportScope.test.ts`.
**Location:** `c08f7aec79882bcb5e9d33561ebd57203adec7ff:test/accessories/hapImportScope.test.ts:93-98,673-718`.
**Issue:** `ACCESSORY_MODULES` lists only `basementGuardian.ts`, `customCharacteristics.ts`, `customServices.ts`, and `serviceCatalogue.ts`. The direct setter and UUID cases iterate only that list. `alarmMute.ts`, `pumpRecords.ts`, `reconciliation.ts`, `services.ts`, and `staleMarking.ts` are also under `src/accessories` and can acquire a direct `onSet` or `hap.uuid.generate` call while both cases stay green. `controls.ts` has legitimate binder registrations and requires an explicit exemption or a narrower check; that does not justify omitting the other five files.
**Fix:** Enumerate accessory modules for these assertions and explicitly exclude the authorized control binder, or document and enforce an equivalent per-module allowlist. Plant a forbidden direct use in a currently omitted module as the restored positive control.
**Flags:** New coverage-scope cause; D-14 source enumeration floor is unaffected.

### CR-05-GATES-042 - BLOCKER: Computed module expressions still bypass all three import gates

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, every gate case must fail for a plausible violation; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green assertion; SAFE-07, SAFE-08, and RES-04.
**Location:** `c08f7aec79882bcb5e9d33561ebd57203adec7ff:test/accessories/staticGateSources.ts:160-180,230-239`; callers at `test/accessories/timerFreedom.test.ts:58-60`, `test/accessories/hapImportScope.test.ts:102-104`, and `test/accessories/accessoryReadPathScope.test.ts:104-113`.
**Issue:** Round-five fix 036 resolves a `const` identifier whose initializer is a literal, but `fixedSpecifier` returns `undefined` for a binary expression. A read-only call of the compiled helper returned `[]` for both `await import('node:timers/' + 'promises')` and `const name = 'node:timers/' + 'promises'; await import(name)`. It returned only `['node:module']` for `load('node:' + 'timers')` through a recognized `createRequire` binding. These are deterministic, valid Node module loads, and an equivalent HAP or cloud expression bypasses its owner too. This is a new expression shape beyond 036's fixed local literal binding.
**Fix:** Resolve statically computable string expressions, including concatenation, or fail closed on an unresolved dynamic import or recognized loader call. Plant a computed forbidden specifier in each gate and a computed unrelated specifier as a negative control.
**Flags:** New specifier-expression cause beyond CR-05-GATES-036; D-16 static-gate controls.

### CR-05-GATES-043 - BLOCKER: A constant get-event alias escapes the read-handler gate

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green read-handler assertion; RES-04.
**Location:** `c08f7aec79882bcb5e9d33561ebd57203adec7ff:test/accessories/accessoryReadPathScope.test.ts:116-167,362-421`.
**Issue:** `registersReadHandler` recognizes the literal `'get'` and a direct `CharacteristicEventTypes.GET` member, but it does not resolve an identifier passed as the event. `const event = 'get'; characteristic.on(event, handler)` registers the same HAP listener and returns false from this detector, so a read handler in `src/` passes the RES-04 case. The fixtures cover quoted literals and direct enum syntax only. Pinned HAP dispatches through the EventEmitter `get` listener; its `Characteristic` class extends `EventEmitter` (`node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:250,1683-1742`).
**Fix:** Resolve a fixed local event binding at the registration call, including an alias of the enum member. Plant a positive for the alias and a different-event alias as a negative.
**Flags:** New event-argument cause beyond CR-05-GATES-037's listener-method forms; D-16 static-gate controls.

### CR-05-GATES-044 - BLOCKER: Destructuring uuid from the HAP namespace escapes direct-call detection

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` and `rules/review.md`, false-green direct HAP-use assertion.
**Location:** `c08f7aec79882bcb5e9d33561ebd57203adec7ff:test/accessories/hapImportScope.test.ts:178-232,699-717`.
**Issue:** `recordAlias` records an object-binding `generate` only when the initializer is already recognized as a UUID API. It does not record the intermediate valid binding in `const { uuid } = hap; uuid.generate(deviceId)` (or `const { uuid: ids } = this.api.hap; ids.generate(deviceId)`). `isUuidApi` sees the local `uuid` identifier with no recorded capability, so `memberCall` stays false. A read-only pinned-HAP probe confirmed that destructuring its `uuid` namespace yields a callable `generate` function. Round-five fix 038 tracks `generate` extracted from a recognized UUID object, a different binding step.
**Fix:** Track destructured UUID object bindings from the injected HAP namespace before following `generate` calls. Plant direct and renamed destructures as positives, plus a destructure from an unrelated object as a negative.
**Flags:** New UUID-object binding cause beyond CR-05-GATES-038; D-16 static-gate controls.

## Round status

Opening open IDs: CR-05-GATES-035, CR-05-GATES-036, CR-05-GATES-037, CR-05-GATES-038, CR-05-GATES-039. All five are fixed at their cited causes. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-034 remain fixed; none reopened. New IDs are CR-05-GATES-040 through CR-05-GATES-044. Closing is `5 - 5 - 0 + 5 + 0 = 5`; the terminal result is **STOP: no progress** under D-03/D-18.

| Opening ID | Round-six disposition and evidence |
| --- | --- |
| CR-05-GATES-035 | Fixed: `staticGateSources.ts:148-158,193-223` recognizes alternate `createRequire` bases and propagates loader aliases by symbol. All three import owners plant the reported forms and an unrelated-call negative. |
| CR-05-GATES-036 | Fixed: `staticGateSources.ts:160-180,230-239` resolves fixed local literal constants at dynamic import and recognized loader calls. All three owners plant constant-driven positives and unrelated negatives. New 042 uses a computed expression. |
| CR-05-GATES-037 | Fixed: `accessoryReadPathScope.test.ts:77,151-160` and `hapImportScope.test.ts:100,243-254` include `addListener`, `once`, `prependListener`, and `prependOnceListener`. The owner cases plant each method with the relevant event and an unrelated-event negative. |
| CR-05-GATES-038 | Fixed: `hapImportScope.test.ts:190-255` follows `generate` values and marks actual calls, with positives and unrelated/unused negatives at lines 575-605. New 044 concerns extracting the UUID object from HAP first. |
| CR-05-GATES-039 | Fixed: `accessoryReadPathScope.test.ts:104-113` strips query and fragment suffixes before resolving account-runtime imports; lines 238-246 and 440-485 plant positives and a neighbouring-runtime negative. |

## Seed and lead dispositions

No new seed or research lead belongs to round six. Round-zero dispositions remain recorded. The four gates have no source module, so mirrored pairing, entrypoint `describe()` structure, and isolated direct coverage remain N/A under D-17. Their `>=` enumeration floors retain the D-14 whole-value exception. The helper is test support and needs no mirrored meta-test.

## Header inspection

All four gates, `staticGateSources.ts`, `features/lib/hap.ts`, and both step files retain the approved SPDX line and separate copyright and overview blocks. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `c08f7aec79882bcb5e9d33561ebd57203adec7ff`, Node `v26.12.0`, npm `11.20.0`, with `/opt/homebrew/opt/node/bin` first on PATH and `npm_config_cache=/private/tmp/guardian-npm-cache`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <eight inventory paths plus test/platform.test.ts> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Current tests and features compiled. |
| `node --test` on the four compiled gate owners | 0 | 58 passed; zero failed, cancelled, skipped or todo. |
| `npm run test:unpaired` | 0 | Repository unpaired suite passed. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |

No full `npm run check`, isolated pair coverage or Cucumber run is claimed for this correction review. Passing toolchain checks do not exercise the five source forms above. [Current Homebridge HAP documentation](https://developers.homebridge.io/HAP-NodeJS/classes/Characteristic.html) identifies `Characteristic` as an `EventEmitter` and documents the `onGet`/`onSet` handlers; the pinned HAP 2.2.2 implementation was used for the event and UUID claims. No relevant documentation/type difference was found.

## Out-of-scope observations

`test/platform.test.ts` is a RECORDS inventory adaptation and is excluded from the YAML file list. Its bounded `readOf`/`trustReadsOf` declarations and adapted call sites await the read promises. The remainder of that file and unmodified feature code belong to their owning phases. I found no new defect in the bounded platform hunk.

No source or test file was edited. No mutation experiment or commit was performed.


## Coordinator triage

Accepted CR-05-GATES-040 through CR-05-GATES-044 as new BLOCKERs. Nested and
omitted accessory modules, computed module expressions, GET event aliases, and
UUID object destructuring each leave a distinct false-green path. Confirmed 035
through 039 fixed and 001 through 034 still fixed; none reopened. Opening 5,
fixed 5, rejected 0, new 5, reopened 0, closing 5: `STOP: no progress` under
D-03. The maintainer authorized continuation in this task after the stop was
reported; the resolution is recorded in the ledger STOP cell before any round-6
repair begins.

## Repair history

| Finding | Cause and control | Checks | Commit |
| --- | --- | --- | --- |
| CR-05-GATES-040 | The timer owner now uses the shared recursive enumerator. A temporary nested module with a deferred import failed the focused case against the one-level scan (RED exit 1; original test blob `4734d8869774484a758eacbd3f6e40f4e22a2ef2`). The same case passes after the repair. A missing directory throws, and an empty list fails the retained floor. | `npm run build:test` 0; four compiled gates 0 (60/60); `npm run test:unpaired` 0; Fallow audit pass; Node v26.12.0. | This report is in the cause commit. |

---

_Reviewed: 2026-10-18T19:35:09Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
