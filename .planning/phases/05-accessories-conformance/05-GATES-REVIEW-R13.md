---
phase: 05-accessories-conformance
batch: GATES
review_round: 13
reviewed: 2026-10-19T01:47:30Z
depth: deep
source_revision: 4158fff22ab884eb4923c48176a390304239f38e
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

# Phase 5: GATES code review, correction round 13

**Source:** `4158fff22ab884eb4923c48176a390304239f38e`
**Depth:** deep
**Result:** issues_found

## Summary

I reviewed every line of the five GATES files and the bounded GATES adaptations with their enclosing declarations in the three Phase 7 files. The four opening causes, 066–069, are fixed. Two different defects remain in the direct HAP-use and read-handler scanners. Both forms survive Prettier 3.9.6, so the full `format:check` does not remove them. The closing count is two, below the opening count of four; the terminal result is **continue** under D-03 and the GATES-only fifteen-round cap.

## Findings

### CR-05-GATES-070 - BLOCKER: An aliased characteristic can register onSet outside the binder unnoticed

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate its claimed behavior) and `.agents/skills/typescript-unit-tests/rules/review.md` (a false-green gate is a BLOCKER); SAFE-08 direct-registration confinement.
**Location:** `4158fff22ab884eb4923c48176a390304239f38e:test/accessories/hapImportScope.test.ts:368-382,1512-1521`.
**Issue:** `isCharacteristicReceiver` recognizes only an identifier spelled `characteristic` or a direct `getCharacteristic()` call. In `const control = service.getCharacteristic(hap.Characteristic.On); control.onSet(handler);`, `control` is the HAP characteristic, but the scanner returns `{ onSet: false, setEvent: false }`. The direct call to `service.getCharacteristic(...).onSet(handler)` returns `onSet: true`. The former can be added to any accessory module outside `controls.ts` while the direct-set gate stays green. A read-only probe of the current `hapUses` function confirmed both results; Prettier preserves the form.
**Fix:** Track characteristic bindings from `getCharacteristic()` through local aliases by binding identity and recognize `onSet` calls on those bindings. Add a positive aliased-characteristic control and an unrelated object's `onSet` negative control.
**Flags:** New false-green gate cause following 069's receiver restriction; 069's non-call false positive remains fixed. No production bug or exported contract change is claimed.

### CR-05-GATES-071 - BLOCKER: Unrelated emitters are mistaken for HAP read and set registrations

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (cases must discriminate the named behavior) and `.agents/skills/typescript-unit-tests/rules/review.md` (a suite that breaks on valid unrelated source is a BLOCKER); RES-04 and SAFE-08.
**Location:** `4158fff22ab884eb4923c48176a390304239f38e:test/accessories/accessoryReadPathScope.test.ts:303-309,674-687`; `4158fff22ab884eb4923c48176a390304239f38e:test/accessories/hapImportScope.test.ts:377-386,1512-1521`.
**Issue:** Both scanners check the event name and listener method without establishing that the receiver is a HAP characteristic. A read-only probe of the current functions returned `true` for `registersReadHandler("emitter.on('get', handler);")` and `hapUses(sourceFileOf("emitter.on('set', handler);")).setEvent`. The read scanner also returns `true` for `other.onGet(handler)`. None of those calls registers a HomeKit handler. An accessory module with an unrelated emitter would fail the gate despite keeping the HomeKit read and write contracts. Prettier preserves these calls.
**Fix:** Resolve the listener receiver to a HAP characteristic, including local aliases, before counting `onGet` or GET/SET event registrations. Add unrelated-emitter and unrelated-`onGet` controls beside the HAP positives.
**Flags:** New false-positive receiver-provenance cause. It is distinct from 069's non-call `onSet` property-read cause, which remains fixed. No production bug or exported contract change is claimed.

## Round status

Opening open IDs: CR-05-GATES-066, CR-05-GATES-067, CR-05-GATES-068 and CR-05-GATES-069. All four are fixed at their exact causes. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-065 remain fixed at their cited causes; none reopened. New IDs: CR-05-GATES-070 and CR-05-GATES-071. Closing open IDs are those two new IDs. Counts: opening 4, fixed 4, rejected 0, new 2, reopened 0, closing `4 - 4 - 0 + 2 + 0 = 2`. Terminal result: **continue**.

| Opening ID | Independent round-13 result |
| --- | --- |
| CR-05-GATES-066 | Fixed by `663664b0b9982361bcec756a7ade67b4604ccfc4`. `staticGateSources.ts:88-103,106-126,146-159,179-198,260-277` unwraps namespace receivers, aliases, destructuring sources and awaited imports. A read-only compiled-helper probe now includes `node:timers/promises` for a parenthesized namespace loader. |
| CR-05-GATES-067 | Fixed by `302b4f6d384773ce8fcfa7032a5506b031d0ac17`. `accessoryReadPathScope.test.ts:213-241` and `hapImportScope.test.ts:182-218` unwrap the parenthesized event and enum owner. Read-only current-function probes return true for parenthesized GET and SET. |
| CR-05-GATES-068 | Fixed by `b3a112a1c35b52e97959e7f83c6efde591d8dcce`. `staticGateSources.ts:80-85,117-126` resolves a computed destructuring key. A read-only compiled-helper probe now includes `node:timers/promises` for the fixed computed key. |
| CR-05-GATES-069 | Fixed by `27a203f85b98eae8270d6e5302b93b4bb3cffc0b`. `hapImportScope.test.ts:368-382` counts a characteristic `onSet` call and ignores both an uncalled property read and an unrelated object's call. Current-function probes confirm those distinctions. New 070 is the separate alias gap. |

## Seed and lead dispositions

No new Phase 5 seed or lead is raised. S-05-01's GATES portion remains confirmed and repaired as 002; S-05-09 and S-05-10 as 003–005; S-05-11 through S-05-14 as 006–011; S-05-15 as 012–014; and S-05-23's read-promise portion as 017. S-05-22's bare-characteristic default and S-05-23's absent-characteristic lookup remain rejected under D-16 because no plugin consumer uses those paths. D-14 keeps the `>=` enumeration floors; the whole-value rule is N/A for those floors. D-17's mirrored pairing, one `describe()` per exported source entrypoint and isolated direct coverage are N/A for the unpaired gates; shared test support needs no mirrored meta-test.

## Header inspection

All eight reviewed paths conform to D-01: SPDX first, separate copyright and overview JSDoc blocks, and the required spacing. `05-ledger-tracer.mjs --headers --batch GATES` exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

At source revision `4158fff22ab884eb4923c48176a390304239f38e`, Node `v26.12.0` and npm `11.20.0`:

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `npm exec -- eslint <eight reviewed paths> --max-warnings=0 --no-cache` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Tests and features compiled. |
| `node --test` on the four compiled gate owners | 0 | 117 passed, none failed, cancelled, skipped or todo. |
| `npm run test:unpaired:compiled` with the default npm cache | 1 | Two package-artifact cases could not run `npm pack` because `/Users/acolomba/.npm` contains root-owned files; 165 other cases passed. This is an environment error, not a GATES source failure. |
| `npm run test:unpaired:compiled` with `npm_config_cache=/private/tmp/guardian-npm-cache` | 0 | The unpaired suite passed with the same scratch cache used in the prior round. |
| `05-ledger-tracer.mjs --headers --batch GATES` | 0 | Eight headers conformed. |
| Read-only compiled-helper and current-function probes | 0 | Confirmed all four opening repairs and the two new scanner defects. |
| Prettier 3.9.6 on representative source through stdin | 0 | Preserved the aliased setter and unrelated GET/SET emitter forms. |

The gates are unpaired, so no source/test pair command or direct pair coverage applies. No full `npm run check` or Cucumber run is claimed for this correction review. Passing owner tests do not cover 070 or 071.

## Out-of-scope observations

No new defect was found in the bounded GATES adaptations to `features/lib/hap.ts`, `features/step_definitions/controls.steps.ts` or `features/step_definitions/homekit.steps.ts`. Their unchanged portions belong to Phase 7.

No source or test file was edited. No mutation experiment or commit was performed.

## Coordinator triage

The independent review confirms 066-069 fixed. IDs 070 and 071 are accepted:
the reported source forms survive Prettier, and the direct gates misclassify
them. The count falls from four to two, so the batch continues under D-03.
Neither finding identifies a production runtime bug.

## Repair history

| Cause | Repair | Verification | Commit |
| --- | --- | --- | --- |
| CR-05-GATES-070 | Track scoped, constant characteristic aliases for `onSet` calls. The control counts an alias chain and rejects unrelated receivers and property reads. | Node v26.12.0; Fallow guard, `npm run build:test`, the `hapImportScope` owner test, `npm run test:unpaired`, and Fallow audit against `379e86772fb2f353abbbe9c35dc3aa502bbb68f9` each exited 0. | Committed with this report row. |

---

_Reviewed: 2026-10-19T01:47:30Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
