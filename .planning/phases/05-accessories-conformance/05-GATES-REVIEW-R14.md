---
phase: 05-accessories-conformance
batch: GATES
review_round: 14
reviewed: 2026-10-19T02:00:39Z
depth: deep
source_revision: edc9151041aca0b5f466cfec5ec86fdb6b5ae4bf
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

# Phase 5: GATES code review, correction round 14

**Source:** `edc9151041aca0b5f466cfec5ec86fdb6b5ae4bf`
**Depth:** deep
**Result:** issues_found

## Summary

I read every line of the five GATES files and the bounded GATES adaptations and enclosing declarations in the three Phase 7 files. Opening causes 070 and 071 are fixed at their reported forms. Two different scanner defects remain. Prettier 3.9.6 preserves the relevant syntax, so formatting does not close either gap. With two new open findings, the closing count equals the opening count. The terminal result is **STOP: no progress** under D-03, although round 14 is below the GATES-only fifteen-round cap. The coordinator owns the ledger counter and any maintainer resolution.

## Findings

### CR-05-GATES-072 - BLOCKER: Conditional selection of a HAP characteristic escapes both registration gates

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate its claim) and `.agents/skills/typescript-unit-tests/rules/review.md` (a false-green gate is a BLOCKER); SAFE-08 direct-set confinement and RES-04 read-handler confinement.
**Location:** `edc9151041aca0b5f466cfec5ec86fdb6b5ae4bf:test/accessories/hapImportScope.test.ts:360-385,393-408`; `edc9151041aca0b5f466cfec5ec86fdb6b5ae4bf:test/accessories/accessoryReadPathScope.test.ts:214-229,317-335`.
**Issue:** Both scanners mark a local characteristic only when its `const` initializer is directly a `getCharacteristic()` call or another already marked identifier. A conditional expression returning a characteristic from either of two services is neither shape. For `const control = useBackup ? backupService.getCharacteristic(hap.Characteristic.On) : service.getCharacteristic(hap.Characteristic.On); control.onSet(handler);`, the current `hapUses` returns `onSet: false`. The same selection followed by `control.on("set", handler)` returns `setEvent: false`, and selection followed by `control.onGet(handler)` makes `registersReadHandler` return `false`. These are real HAP registrations, so both production gates stay green after a forbidden handler is added. A read-only probe of the current scanner functions established all three results. Prettier keeps the conditional expression and call.
**Fix:** Resolve both arms of a conditional initializer as characteristics, and mark the binding only when both arms resolve. Add separate positive controls for conditional `onSet`, set-event and `onGet` registrations, plus a mixed HAP/unrelated negative control.
**Flags:** New expression-provenance cause beyond 070's simple constant alias, which remains detected. No production bug or exported contract change is claimed.

### CR-05-GATES-073 - BLOCKER: A non-HAP `getCharacteristic()` result is counted as a HAP characteristic

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (cases must discriminate the named behavior) and `.agents/skills/typescript-unit-tests/rules/review.md` (a gate that breaks on valid unrelated source is a BLOCKER); RES-04 and SAFE-08.
**Location:** `edc9151041aca0b5f466cfec5ec86fdb6b5ae4bf:test/accessories/hapImportScope.test.ts:370-385,393-408`; `edc9151041aca0b5f466cfec5ec86fdb6b5ae4bf:test/accessories/accessoryReadPathScope.test.ts:214-229,324-335`.
**Issue:** Each `isCharacteristicReceiver` accepts any call whose member is spelled `getCharacteristic`, without establishing that the call belongs to a HAP service or returns a HAP characteristic. A read-only probe returned `true` from `registersReadHandler` for `const source = { getCharacteristic: () => new EventEmitter() }; source.getCharacteristic().on("get", handler);`; `hapUses` likewise returned `setEvent: true` when the event was `"set"`. These calls register listeners on an unrelated emitter. The source form type-checks when `EventEmitter` and the handler are declared, and Prettier preserves the call. The read gate scans all `src/`, so an unrelated module with this method name can fail the full gate.
**Fix:** Establish HAP service provenance before treating `getCharacteristic()` as a characteristic producer, and add non-HAP objects with the same method name as negative controls for both read and set registrations.
**Flags:** New producer-provenance cause beyond 071's direct `emitter.on(...)` and `other.onGet(...)` forms, which remain ignored. No production bug or exported contract change is claimed.

## Round status

Opening open IDs: CR-05-GATES-070 and CR-05-GATES-071. Both are fixed at their exact reported causes. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-069 remain fixed at their cited causes; none reopened. New IDs: CR-05-GATES-072 and CR-05-GATES-073. Closing open IDs are those two new IDs. Counts: opening 2, fixed 2, rejected 0, new 2, reopened 0, closing `2 - 2 - 0 + 2 + 0 = 2`. Terminal result: **STOP: no progress** under D-03. This report does not write the coordinator's counter row.

| Opening ID | Independent round-14 result |
| --- | --- |
| CR-05-GATES-070 | Fixed by `4610cf4429bc3c13843717b9c945f8524e8b81af`. `hapImportScope.test.ts:363-385` now tracks scoped constant aliases. The current-function probe returns `onSet: true` for the original `control` to `alias` registration, and the owner test at lines 1096-1115 asserts the positive and unrelated negatives. |
| CR-05-GATES-071 | Fixed by `4e95f5f3c248a2e2376634f8f7d03f517e54680d`. The scanners at `accessoryReadPathScope.test.ts:214-335` and `hapImportScope.test.ts:393-409` now require a characteristic receiver. The current-function probe returns `false` for the original direct `emitter.on("get")`, `emitter.on("set")` and `other.onGet` forms; the controls at read-gate lines 788-806 and set-gate lines 1446-1462 assert these distinctions. |

The diff from round 13's source revision changes only the two scanner owners and the round 13 repair-history text among reviewed paths. The 119 current owner cases, including prior fixed-cause controls, pass. That establishes no observed return of IDs 001-069 at their exact causes; 072 and 073 describe new input shapes.

## Seed and lead dispositions

No new Phase 5 seed or research lead is raised. S-05-01's GATES portion remains confirmed and repaired as 002; S-05-09 and S-05-10 as 003-005; S-05-11 through S-05-14 as 006-011; S-05-15 as 012-014; and S-05-23's read-promise portion as 017. S-05-22's bare-characteristic default and S-05-23's absent-characteristic lookup remain rejected under D-16 because no plugin consumer uses those paths. D-14 retains the `>=` enumeration floors; the whole-value rule is N/A for those floors. D-17's mirrored pairing, one `describe()` per exported source entrypoint, and isolated direct coverage are N/A for the unpaired gates; shared test support needs no mirrored meta-test.

## Header inspection

All eight reviewed paths conform to D-01: SPDX first, separate copyright and overview JSDoc blocks, and required spacing. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

All commands ran at source revision `edc9151041aca0b5f466cfec5ec86fdb6b5ae4bf` with Node `v26.12.0` and npm `11.20.0`.

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <eight reviewed paths> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Tests and features compiled. |
| `node --test dist-test/test/accessories/timerFreedom.test.js` | 0 | 14 passed, none failed, skipped or cancelled. |
| `node --test dist-test/test/accessories/hapImportScope.test.js` | 0 | 59 passed, none failed, skipped or cancelled. |
| `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | 0 | 24 passed, none failed, skipped or cancelled. |
| `node --test dist-test/test/accessories/hapWriteFidelity.test.js` | 0 | 22 passed, none failed, skipped or cancelled. |
| `npm_config_cache=/private/tmp/guardian-npm-cache npm run test:unpaired:compiled` | 0 | Unpaired suite passed with the specified scratch cache. |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |
| Read-only current-function probes | 0 | Original 070 and 071 forms detected or ignored as intended; conditional HAP selections were missed, and unrelated `getCharacteristic()` emitters were counted. |
| Prettier 3.9.6 API formatting of representative TypeScript | 0 | Preserved conditional selection and non-HAP `getCharacteristic()` call forms. |

These gates are unpaired, so no direct source/test pair coverage command applies. No full `npm run check` or Cucumber result is claimed for this review. Passing owner tests do not cover 072 or 073.

## Out-of-scope observations

No new defect was found in the bounded GATES adaptations to `features/lib/hap.ts`, `features/step_definitions/controls.steps.ts` or `features/step_definitions/homekit.steps.ts`. The unchanged portions of these files belong to Phase 7. The pinned `Characteristic.js` read and write paths were checked for the parity claims used by this review; their full review is outside GATES.

No source or test file was edited. No mutation experiment or commit was performed.

## Coordinator triage

The maintainer authorized continuation after the no-progress stop. Round 14
confirms 070 and 071 fixed. IDs 072 and 073 are accepted: the reported forms
survive Prettier and the scanners misclassify them. Both remain open for repair.
Neither finding establishes a plugin runtime bug. Round 15 is the GATES cap.

## Repair history

Pending.

---

_Reviewed: 2026-10-19T02:00:39Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
