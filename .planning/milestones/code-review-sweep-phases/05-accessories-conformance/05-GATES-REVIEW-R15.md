---
phase: 05-accessories-conformance
batch: GATES
review_round: 15
reviewed: 2026-10-19T07:20:26Z
depth: deep
source_revision: 43c0e4a3a1b22aaba3c0e9aeece5b685412daff7
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

# Phase 5: GATES Code Review, Correction Round 15

**Reviewed:** 2026-10-19T07:20:26Z
**Depth:** deep
**Files Reviewed:** 8
**Status:** issues_found

## Summary

I reviewed every line of the five GATES files, plus the bounded GATES adaptations and their enclosing declarations in the three Phase 7 files. The exact forms reported by opening IDs 072 and 073 are now detected or ignored as intended. Two other valid TypeScript forms still let a real HAP registration escape both static gates. Prettier 3.9.6 preserves each form. The closing open count is two, equal to the opening count. Round 15 is the GATES cap, so the terminal result is **STOP: no progress; open after round 15** under D-03 and D-18. The coordinator owns the ledger counter and must run no round 16.

## Findings

### CR-05-GATES-074 - BLOCKER: A mixed conditional hides a HAP registration on its HAP branch

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (each case must discriminate its named behavior) and `.agents/skills/typescript-unit-tests/rules/review.md` (a false-green gate is a BLOCKER); SAFE-08 direct-set confinement and RES-04 read-handler confinement.
**Location:** `43c0e4a3a1b22aaba3c0e9aeece5b685412daff7:test/accessories/hapImportScope.test.ts:425-432,1540-1581`; `43c0e4a3a1b22aaba3c0e9aeece5b685412daff7:test/accessories/accessoryReadPathScope.test.ts:266-273,881-899`.
**Issue:** Both `isCharacteristicReceiver` functions use `&&` for a conditional's arms. Their new mixed controls expect `false` when one arm yields a HAP characteristic and the other yields an unrelated object. Yet, when the condition selects the HAP arm, `control.on('set', handler)` or `control.on('get', handler)` registers directly on that HAP characteristic. The scanner returns `false`, so a forbidden registration can enter `src/` while the gate stays green. A read-only probe of the current compiled functions returned `setEvent: false` and `registersReadHandler: false` for a mixed selection. The mixed set-event source type-checks against the installed Homebridge types with zero errors, and Prettier keeps its conditional. The 072 repair's two-HAP-arm case remains detected; this is a different branch-reachability cause.
**Fix:** For a registration ban, treat a conditional receiver as HAP-reachable when **either** arm can yield a HAP characteristic. Replace the mixed negative controls with positive controls for `onSet`, set-event and `onGet`, using an unrelated branch that supplies the same callable method. Keep a negative control in which neither arm is HAP-derived.
**Flags:** New false-green cause beyond 072's two-HAP-arm selection. No production bug or exported contract change is claimed.

### CR-05-GATES-075 - BLOCKER: Services retrieved from a platform accessory escape HAP provenance tracking

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (a plausible wrong implementation must fail) and `.agents/skills/typescript-unit-tests/rules/review.md` (false-green gate classification); SAFE-08 and RES-04.
**Location:** `43c0e4a3a1b22aaba3c0e9aeece5b685412daff7:test/accessories/hapImportScope.test.ts:385-423,444-449`; `43c0e4a3a1b22aaba3c0e9aeece5b685412daff7:test/accessories/accessoryReadPathScope.test.ts:241-264,374-379`.
**Issue:** The 073 repair marks a service only when its binding has a direct imported `Service` annotation or a `new hap.Service.*` initializer. `PlatformAccessory.getService()` also returns a real HAP service. In a type-correct function, `const service = accessory.getService(hap.Service.Switch); if (!service) return; service.getCharacteristic(hap.Characteristic.On).on('set', handler);` produces `setEvent: false`; replacing `'set'` with `'get'` produces `registersReadHandler: false`. Both current scanners were probed without changing source, and the source type-checks with zero errors. This path is practical in this repository: `basementGuardian.ts:453` already retrieves a service from an accessory. Prettier preserves the call. The original 073 non-HAP `getCharacteristic()` examples stay ignored, but the new provenance rule fails to recognize another genuine HAP producer.
**Fix:** Track service values returned by `PlatformAccessory.getService()` and `getServiceById()` after an existence guard, or use the TypeScript checker to identify `Service` receivers at registration sites. Add positive controls for an accessory-retrieved service followed by `onSet`, set-event and `onGet`, while preserving the 073 unrelated-producer negatives.
**Flags:** New false-green service-source cause beyond 073's non-HAP producer false positive. No production bug or exported contract change is claimed.

## Round status

Opening open IDs: CR-05-GATES-072 and CR-05-GATES-073. Both are confirmed fixed at their exact reported forms. Earlier fixed IDs CR-05-GATES-001 through CR-05-GATES-071 remain fixed at their cited causes; the reviewed code and current owner controls show no return of those causes. New IDs are CR-05-GATES-074 and CR-05-GATES-075. No fixed ID reopened.

| Opening ID | Independent round-15 result |
| --- | --- |
| CR-05-GATES-072 | Fixed by `74e5e1c32c92191fc30047bb0945bb39f4548268`. Both scanners resolve a selection whose two arms are HAP characteristics; the positive controls in `hapImportScope.test.ts:1540-1582` and `accessoryReadPathScope.test.ts:881-899` pass. Finding 074 concerns a distinct mixed-arm behavior. |
| CR-05-GATES-073 | Fixed by `b97ac43987559627a7fb3753b475c2a4f9893923`. Both scanners ignore the original unrelated `getCharacteristic()` producer; negative controls in `hapImportScope.test.ts:1584-1609` and `accessoryReadPathScope.test.ts:901-930` pass. Finding 075 concerns a distinct genuine HAP service producer. |

Counts: opening 2, fixed 2, rejected 0, new 2, reopened 0, closing `2 - 2 - 0 + 2 + 0 = 2`. Terminal result: **STOP: no progress; open after round 15**. This report does not write the coordinator's counter row.

## Seed and lead dispositions

No new Phase 5 seed or research lead is raised. S-05-01's GATES portion remains confirmed and repaired as 002; S-05-09 and S-05-10 as 003-005; S-05-11 through S-05-14 as 006-011; S-05-15 as 012-014; and S-05-23's read-promise portion as 017. S-05-22's bare-characteristic default and S-05-23's absent-characteristic lookup remain rejected under D-16 because no plugin consumer uses those paths. D-14 retains the `>=` enumeration floors; the whole-value rule is N/A for those floors. D-17's mirrored pairing, one `describe()` per exported source entrypoint, and isolated direct coverage are N/A for the unpaired gates; shared test support needs no mirrored meta-test.

## Header inspection

All eight reviewed paths conform to D-01: SPDX first, separate copyright and overview JSDoc blocks, and required spacing. The header tracer exited 0 with `ACCESSORIES_HEADERS_OK files=8`.

## Toolchain evidence

All commands ran at source revision `43c0e4a3a1b22aaba3c0e9aeece5b685412daff7` with Node `v26.12.0`, npm `11.20.0`, and `npm_config_cache=/private/tmp/guardian-npm-cache`. No source, test or ledger file was edited. The first attempt to pass `--no-cache` through `npm run lint --` exited 2 because the npm script already supplies `--cache-strategy`; direct scoped ESLint was then run successfully.

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Source and test TypeScript checks passed. |
| `node_modules/.bin/eslint --max-warnings=0 --no-cache <eight reviewed paths>` | 0 | Fresh scoped lint passed. |
| `npm run build:test` | 0 | Compiled source and tests. |
| `node --test dist-test/test/accessories/timerFreedom.test.js` | 0 | 14 passed. |
| `node --test dist-test/test/accessories/hapImportScope.test.js` | 0 | 62 passed. |
| `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | 0 | 26 passed. |
| `node --test dist-test/test/accessories/hapWriteFidelity.test.js` | 0 | 22 passed. |
| `npm run test:unpaired` | 0 | Unpaired suite passed. |
| `npm run format:check` | 0 | Prettier reported all matched files formatted. |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs` | 0 | `ACCESSORIES_LEDGER_TRACER_OK inventory=31 findings=245 open=2 rounds=46` before this report. |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch GATES` | 0 | `ACCESSORIES_HEADERS_OK files=8`. |

Read-only in-memory probes against the compiled scanner functions returned false for both new forms. Separate in-memory TypeScript programs for the mixed selection and accessory service retrieval had zero errors. `prettier.format(..., { parser: 'typescript' })` preserved both relevant expressions. These probes did not edit the repository.

## Out-of-scope observations

None. The full conformance review of `features/**` remains with Phase 7; this round examined only its declared bounded adaptations.

---

_Reviewed: 2026-10-19T07:20:26Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
