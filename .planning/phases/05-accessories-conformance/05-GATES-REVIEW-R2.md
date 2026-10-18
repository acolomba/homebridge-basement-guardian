---
phase: 05-accessories-conformance
batch: GATES
review_round: 2
reviewed: 2026-10-18T16:03:14Z
depth: deep
source_revision: 18d9a70cb1a3eb3f2bc3097ad012f9bb79e0b82d
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
  warning: 1
  total: 3
status: issues_found
reviewer: gsd-code-reviewer
---

# Phase 5: GATES code review, correction round 2

**Source:** `18d9a70cb1a3eb3f2bc3097ad012f9bb79e0b82d`
**Depth:** deep
**Result:** issues_found

## Summary

I read every line of the four gates and the shared source helper, then reviewed the changed GATES adaptation hunks with their enclosing declarations. All six opening causes are repaired. The shared import parser and the read-handler gate still admit legal source forms their controls do not plant, and one changed Cucumber comment describes a removed wait path. The source counts are `src=43`, `test=69`, `features=22`, total `134`; `src/accessories=10`. The current pinned HAP is 2.2.2, whose known failure statuses span `-70412` through `-70401`.

## Findings

### CR-05-GATES-024 - BLOCKER: Literal dynamic loads bypass the shared import parser

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, a case must fail for a plausible violation; `.agents/skills/typescript-unit-tests/rules/review.md`, weak assertions. The gates promise SAFE-07, SAFE-08 and RES-04 import confinement.
**Location:** `18d9a70cb1a3eb3f2bc3097ad012f9bb79e0b82d:test/accessories/staticGateSources.ts:42-55`; callers at `test/accessories/timerFreedom.test.ts:59-60`, `test/accessories/hapImportScope.test.ts:98-99`, and `test/accessories/accessoryReadPathScope.test.ts:94-95`.
**Issue:** The parser takes a dynamic `import()` argument only when `isStringLiteral(argument)` is true. TypeScript parses `import(\`node:timers\`)`, `import(\`@homebridge/hap-nodejs\`)` and `import(\`../cloud/api.js\`)` as no-substitution template literals. These are runtime loads of fixed, forbidden specifiers, but the shared parser returns `[]`; all three gates can pass. A read-only probe of the compiled helper returned the forbidden specifier for quoted static, side-effect, re-export and dynamic imports, and `[]` for the backtick dynamic form. It also returned `[]` for a literal load through `createRequire(import.meta.url)`, which is usable in this ESM repository. The planted dynamic controls cover quoted arguments only.
**Fix:** Include `isNoSubstitutionTemplateLiteral` for dynamic `import()` and plant one fixed backtick dynamic import per gate. If the invariant includes CommonJS loading, detect literal calls through a `createRequire` binding and plant that form too; preserve the single permitted HAP importer and HAP subpath check.
**Flags:** D-16 static-gate controls; D-17 single-importer boundary.

### CR-05-GATES-025 - BLOCKER: Read-handler gate misses comment-interleaved registrations

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`, a wrong implementation must fail; `.agents/skills/typescript-unit-tests/rules/review.md`, false-green gate; RES-04 in the gate overview.
**Location:** `18d9a70cb1a3eb3f2bc3097ad012f9bb79e0b82d:test/accessories/accessoryReadPathScope.test.ts:98-113,121-136,179-205`.
**Issue:** `registersReadHandler` searches raw source with regular expressions that permit whitespace, but not comments, between a method/event token and `(` or between `(` and `'get'`. A read-only probe using the gate's patterns reported `false` for valid `characteristic.onGet /* comment */ (() => false)` and `characteristic.on(/* comment */ 'get', callback)`. Either registers a HomeKit read handler while the RES-04 gate stays green. The same raw-text matching reports `true` for a diagnostic string containing `characteristic.onGet(() => false)`, so it can also block harmless code. Existing planted controls cover ordinary spacing and one comment that merely names the tokens.
**Fix:** Parse calls with TypeScript syntax nodes and check `onGet` and `on('get', ...)`/the event enum by expression and argument. Add comment-interleaved positive controls and a string-literal negative control.
**Flags:** D-16 static-gate controls.

### CR-05-GATES-026 - WARNING: Read-outcome comment describes a wait that no longer runs

**Rule:** `.agents/skills/typescript-style/rules/comments.md`, comments describe current code, not removed code.
**Location:** `18d9a70cb1a3eb3f2bc3097ad012f9bb79e0b82d:features/step_definitions/homekit.steps.ts:203-219`.
**Issue:** The comment says the deadline failure carries the wait's error as its cause. The 017 adaptation replaced `world.untilTrue` with a local polling loop; the cause is now a newly constructed `Error` at line 219. There is no wait error to preserve, so the comment gives a false account of the diagnostic.
**Fix:** Describe the current deadline and last observed outcome, or restore a real caught cause if the step needs one.
**Flags:** CR-05-GATES-017 bounded adaptation; distinct from the corrected controls-step comment in 022.

## Round status

Opening open IDs: six (`018`–`023`). All six are fixed at their cited causes, none rejected. Three new causes (`024`–`026`) were found. Earlier fixed IDs `001`–`017` remain fixed; none reopened. Closing is `6 - 6 - 0 + 3 + 0 = 3`. This is **continue** under D-03/D-18 because the open count fell and no fixed cause reopened.

| Opening ID | Round-2 disposition and evidence |
| --- | --- |
| CR-05-GATES-018 | Fixed: documented floor is now 134 at `hapImportScope.test.ts:85-88`; fresh enumeration is 43 + 69 + 22 = 134 and the `>=` check remains at lines 222-225. |
| CR-05-GATES-019 | Fixed at the reported comment-interleaving and HAP subpath causes: `staticGateSources.ts:42-61` parses static imports, re-exports and quoted dynamic imports; planted cases are at `timerFreedom.test.ts:76-87,114-136`, `hapImportScope.test.ts:181-201,229-257`, and `accessoryReadPathScope.test.ts:145-150,208-219`. New 024 concerns other runtime load syntax. |
| CR-05-GATES-020 | Fixed: `homekit.steps.ts:190-200` awaits the read, accepts only integer HAP failure statuses in the pinned `-70412` to `-70401` range, and rethrows other failures. HAP 2.2.2 defines those exact bounds in `HAPServer.js:101-106`; the repair's recorded TypeError control failed the named scenario. |
| CR-05-GATES-021 | Fixed: the direct-read case sets up the two refused writes in arrange, starts both reads in act, then checks the two write statuses, promise shape and rejections in assert (`hapWriteFidelity.test.ts:454-487`). |
| CR-05-GATES-022 | Fixed: `controls.steps.ts:231-236` now says `publishedSwitch` throws before the awaited read when absent and a stored HAP status rejects the read. |
| CR-05-GATES-023 | Fixed: `hapImportScope.test.ts:115-163` uses syntax nodes rather than literal substrings; the planted string negative and executable positive are at lines 289-317. New 025 concerns the separate read-handler source detector. |

| Earlier fixed IDs | Regression check |
| --- | --- |
| 001 | Fixed: all four gate files retain the D-01 header; header tracer passes. |
| 002 | Fixed: the original case sites and the later direct-read case have separate act/assert phases. |
| 003 | Fixed: the importer gate still walks three roots and retains the corrected floor, now 134. |
| 004 | Fixed: read-path source floor remains 43, matching enumeration. |
| 005 | Fixed: timer overview says three production modules under `src/`. |
| 006 | Fixed: microtask case asserts the whole pinned record (`hapWriteFidelity.test.ts:545-551`). |
| 007 | Fixed: local resolver remains `testRequire` (`hapWriteFidelity.test.ts:57,280-283,294-310`). |
| 008 | Fixed: manifest walk catches only `ENOENT` and rethrows other errors (`hapWriteFidelity.test.ts:135-156`). |
| 009 | Fixed: installed manifest and dependency values receive runtime checks (`hapWriteFidelity.test.ts:97-129`). |
| 010 | Fixed: host-declaration case is unconditional and branches by major version (`hapWriteFidelity.test.ts:292-319`). |
| 011 | Fixed: no stand-in-only `pushed` case returned; real/fake push parity cases remain. |
| 012 | Fixed: no-handler write compares real and stand-in with an independent record (`hapWriteFidelity.test.ts:334-345`). |
| 013 | Fixed: latest `onSet` handler is compared on both implementations (`hapWriteFidelity.test.ts:347-360`). |
| 014 | Fixed: in-flight write checks prior, pending and settled records; stand-in clears status on entry (`hapWriteFidelity.test.ts:362-399`, `features/lib/hap.ts:321-343`). |
| 015 | Fixed: both recursive source gates use the one `typeScriptFilesUnder` helper (`staticGateSources.ts:29-40`). |
| 016 | Fixed: the printer strips trailing comments and its planted control checks that output (`hapImportScope.test.ts:278-287`). |
| 017 | Fixed: real and stand-in refused reads return rejecting promises, and both Cucumber readers plus the bounded platform helper await them (`hapWriteFidelity.test.ts:454-487`, `features/lib/hap.ts:346-355`, `controls.steps.ts:233-237`, `homekit.steps.ts:183-200`, `test/platform.test.ts:378-402`). |

## Header inspection

`timerFreedom.test.ts`, `hapImportScope.test.ts`, `accessoryReadPathScope.test.ts`, `hapWriteFidelity.test.ts`, `staticGateSources.ts`, `features/lib/hap.ts`, `controls.steps.ts` and `homekit.steps.ts` each have an SPDX line, separate copyright block and overview block. `05-ledger-tracer.mjs --headers --batch GATES` exited 0: `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At the source revision above, Node `v26.12.0` with `/opt/homebrew/opt/node/bin` first on PATH:

| Check | Raw exit | Result |
| --- | ---: | --- |
| `npm run build:test` | 0 | Compiled current test and feature sources. |
| `npm run typecheck` | 0 | Source and test type checks. |
| `npm exec -- eslint <eight inventory paths plus test/platform.test.ts> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint. |
| `node --test` on the four compiled gate owners | 0 | 48 tests passed, none failed. |
| `npm run --silent test:unpaired:compiled` with temporary `npm_config_cache` | 0 | Repository unpaired suite passed. |
| `npm exec -- cucumber-js --dry-run --format usage` | 0 | Step registration and usage report generated. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight conforming headers. |

The first unpaired run exited 1 only in `packedArtifact.test.js`: its child `npm pack --dry-run --json` could not write the default user npm cache (`EPERM`). Repeating with `/private/tmp/codex-gates-r2-npm-cache` exited 0. This is an environment failure, not a source finding. No full `npm run check` is claimed for this review. D-17 makes isolated pair coverage N/A for these unpaired gates.

## Repair history

| Cause | Verification | Repair |
| --- | --- | --- |
| CR-05-GATES-024 | Node v26.12.0: `fallow guard` 0; `npm run build:test` 0; four compiled GATES owners 0 (48 passed); `npm run test:unpaired` 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` 0, verdict pass. The temporary old detector built and made the named timer control fail on `backtickDynamic` and `createRequire`; restoring the helper's recorded blob `099c9d27c4d41bab442a83290f3dc4a71a8c432a` returned it to green. | The shared AST parser reads fixed backtick imports and literal calls through an imported `createRequire(import.meta.url)` binding. Each of the three gates plants both forms. The static, quoted, side-effect and re-export controls, HAP subpath check, and single permitted HAP importer remain in force. |
| CR-05-GATES-025 | Node v26.12.0: `fallow guard` 0; `npm run build:test` 0; four compiled GATES owners 0 (49 passed); `npm run test:unpaired` 0; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` 0, verdict pass. Two temporary wrong detectors built and failed the intended assertions: one missed both comment-interleaved calls, and one counted a diagnostic string. The recorded source blob `b5b438ed3be64e5d38fcc5f01e170800e04a9a91` was restored before the green run. | The read-handler gate now recognizes AST call expressions for `onGet` and `on` with a literal `get` or `CharacteristicEventTypes.GET` argument. Positive controls insert comments inside both call forms; a negative control puts the method text in a string. Write handlers remain outside this gate. |
| CR-05-GATES-026 | Node v26.12.0: `fallow guard` 0; `npm run build:test` 0; `npm run test:cucumber` 0 with loopback access (104 scenarios, 1156 steps passed); Cucumber dry-run usage 0 with no unused definitions; `fallow audit --base 379e86772fb2f353abbbe9c35dc3aa502bbb68f9` 0, verdict pass. The sandboxed Cucumber attempt could not bind its local fake cloud (`listen EPERM`); the host rerun passed. | The comment above `untilReadOutcome` now describes the polling deadline, last observed outcome, and newly constructed time-limit cause. No executable code changed. |

## Out-of-scope observations

`test/platform.test.ts` is the RECORDS adaptation, so it is excluded from the YAML review list. Its bounded `readOf` and `trustReadsOf` declarations and all six changed call sites await the new read promise. The repair history records the platform owner passing; this round did not rerun it. The GATES adaptations and the platform consumer were inspected only at changed hunks and enclosing declarations.

No source or test file was edited. No mutation experiment or commit was performed.

## Coordinator triage

Accepted CR-05-GATES-024 through CR-05-GATES-026 as open. Literal template imports and
`createRequire` loads can cross the same import boundaries, so 024 covers both fixed-specifier
forms. The comment-interleaved read-handler registrations and stale wait comment have direct
current-tree evidence. Confirmed 018 through 023 fixed and 001 through 017 still fixed;
none reopened. Opening 6, fixed 6, rejected 0, new 3, reopened 0, closing 3: continue.

---

_Reviewed: 2026-10-18T16:03:14Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
