---
phase: 06-root-module-conformance
reviewed: 2026-10-19T17:00:41Z
depth: deep
reviewer: gsd-code-reviewer
base_revision: 0696d99c54c932ad992a7b7d90677f11edd96359
node: v26.12.0
files_reviewed: 2
files_reviewed_list:
  - src/platform.ts
  - test/platform.test.ts
findings:
  critical: 7
  warning: 1
  info: 0
  total: 8
status: issues_found
---

# PLATFORM complete-file review: round 0 candidates

## Scope and evidence

This independent review read `src/platform.ts@0696d99` lines **1–673** and `test/platform.test.ts@0696d99` lines **1–3781**, including both headers and comments. The owner test was read in contiguous recorded intervals **1–1000**, **1001–2000**, **2001–3000**, and **3001–3781**; the first interval was reread at 390–590 to replace a truncated tool display. Both files had those exact `git show` line counts. `git status --short` was empty before the report, the reviewed source and test had no diff from the base revision, and `git ls-files --others --exclude-standard` counted zero. No source or test was changed. `npm run --silent test:corresponding` exited 0 with `Corresponding-tests gate passed.` Direct owner coverage and the full check are coordinator gates, not claims of this independent review.

The review followed `AGENTS.md`, `06-CONTEXT.md` D-02–D-06, `06-REVIEW-PROTOCOL.md`, the TypeScript style and unit-test rules, and the existing PLATFORM inventory in `06-FINDINGS.md`. Bounded callers and support read were `src/index.ts`, `src/config.ts`, `src/logging.ts`, `src/settings.ts`, `src/runtime/accountRuntime.ts`, `src/runtime/arrivalAnchors.ts`, `src/device/state.ts`, `src/cloud/types.ts`, `src/accessories/basementGuardian.ts`, `src/accessories/staleMarking.ts`, `test/platformSeeds.ts`, and the installed Homebridge 2.4.0 API type signatures. No finding turns on an undocumented Homebridge behavior, so no external API interpretation was needed. All examples below use synthetic data.

These are **candidates for coordinator triage**, with proposed stable IDs. A passing build or coverage result would not close an assertion that permits the stated wrong behavior. A genuine behavior bug needs the D-05 active RED record before a source fix.

## Critical issues: BLOCKER candidates

### CR-06-PLATFORM-001: One failing accessory aborts monitoring trust for the rest

**Rule and location:** `AGENTS.md` safety semantics and Phase 6 threat T-06-08; `src/platform.ts@0696d99:412–429,450–454,640–642`; bounded caller `src/runtime/accountRuntime.ts@0696d99:655–659,670–703,1221–1238`. **Severity: BLOCKER.**

**Cause and evidence:** `applyMonitoringHealth` calls each instance's `markMonitoring` without isolating a throw. With two registered systems, make the first instance's `markMonitoring` throw a synthetic `Error` and let the second record calls: the function throws before reaching the second. Under `credentialsRejected: true`, the same throw also skips the later pass that makes cached trust reports unreadable, so a cached `StatusActive: true` can remain readable. During Homebridge shutdown, `runtime.stop()` invokes this callback before `root.abort()`; a thrown callback rejects the discarded `void runtime.stop()` promise and prevents the abort. The source comment at lines 622–625 claims stop never rejects, which this path disproves. A malformed or failing HAP service update is a plausible throw source because `markMonitoring` republishes through `Service.updateCharacteristic`.

**Fix:** Isolate each accessory's trust publication and each cached unreadable marking, log a redacted, device-free diagnostic for failures, and continue with all other accessories. Ensure shutdown aborts the runtime in a `finally` path even if presentation fails. Add an active two-accessory regression that makes one publisher throw and checks the healthy neighbor and credential marking.

### CR-06-PLATFORM-002: Token-cache owner case never checks the token bytes

**Rule and location:** `typescript-unit-tests/rules/cases.md` Assertions and `typescript-unit-tests/rules/review.md` BLOCKER; `test/platform.test.ts@0696d99:977–1031`, especially 1021 and 1029. **Severity: BLOCKER.**

**Cause and evidence:** The case named `AUTH-02 caches the granted token under the Homebridge storage directory` reads both generated files and discards their bytes. It asserts only the filenames. An implementation writing `{}` or a different token into `.basement-guardian-token.json` while keeping that filename would pass the stated assertion. The watcher proves a rename occurred, not that the granted synthetic `id-token-1` was cached.

**Fix:** Parse and compare the complete synthetic token cache record, including the granted token, expiry, and account fingerprint against independently stated expectations; retain the directory and filename assertions. Do not print any real credential in evidence.

### CR-06-PLATFORM-003: Shutdown owner cases cannot detect delayed work

**Rule and location:** `typescript-unit-tests/rules/cases.md` Assertions and `typescript-unit-tests/rules/review.md` BLOCKER; `test/platform.test.ts@0696d99:915–975,1374–1392`. **Severity: BLOCKER.**

**Cause and evidence:** The first case checks the request count only after eight event-loop turns; it never advances the later retry or poll timer after shutdown. A `stop()` that fails to abort the scheduled retry passes before its timer fires. The second case invokes launch and shutdown listeners synchronously, then calls `verify(api)` without awaiting either background path or an observable lifecycle boundary. It would pass if a wrong implementation registered an accessory in a later promise continuation. The two titles promise that cloud work is released and that no accessory is registered or removed across the lifecycle, respectively.

**Fix:** Use a case-owned fake clock and an explicit completion signal for the launched work; after shutdown, advance beyond the next scheduled retry/poll and assert no request, registration, or removal. Await the relevant boundary before the negative assertion.

### CR-06-PLATFORM-004: Offline trust case observes neither the first failure nor a fleet

**Rule and location:** `typescript-unit-tests/rules/cases.md` Assertions and `typescript-unit-tests/rules/review.md` BLOCKER; `test/platform.test.ts@0696d99:1125–1235`, especially 1189–1232. **Severity: BLOCKER.**

**Cause and evidence:** The title says the offline verdict is withdrawn from **every** published accessory **once polling has failed twice**. The fixture publishes only one accessory, and the case records `beforeAnyFailure` and the final state but no state after the first failed poll. A wrong implementation that withdraws trust on the first failure, or only from the first accessory, still meets the assertions after the second tick.

**Fix:** Register two synthetic devices, capture both trust reports before any failure, after exactly one failed poll, and after exactly two, and compare all six observations to literal expected values.

### CR-06-PLATFORM-005: Restored-service case cannot distinguish first-only marking

**Rule and location:** `typescript-unit-tests/rules/cases.md` Assertions and `typescript-unit-tests/rules/review.md` BLOCKER; `test/platform.test.ts@0696d99:1448–1470`. **Severity: BLOCKER.**

**Cause and evidence:** The title promises trust withdrawal from every restored service that reports it, but the accessory has one LeakSensor service. A `markRestoredServicesStale` implementation that marks only its first matching service passes. The `recorded: true` assertion proves map insertion, not full service traversal.

**Fix:** Put two distinct services carrying `StatusActive` on the same restored accessory, seed both true, and assert both false while their other characteristic values remain unchanged.

### CR-06-PLATFORM-006: Restored-control case cannot distinguish first-only refusal

**Rule and location:** `typescript-unit-tests/rules/cases.md` Assertions and `typescript-unit-tests/rules/review.md` BLOCKER; `test/platform.test.ts@0696d99:1475–1492`. **Severity: BLOCKER.**

**Cause and evidence:** The title promises refusal on every restored control before the first poll. The fixture has one Switch, so an implementation that binds only the first control passes. The current assertion says nothing about a second control press being accepted without a vendor command.

**Fix:** Restore both control Switches with distinct subtypes, press each, and compare both refusal statuses and unchanged `On` values.

### CR-06-PLATFORM-007: Confirmed-removal case does not prove the final check occurred

**Rule and location:** `typescript-unit-tests/rules/cases.md` Assertions and `typescript-unit-tests/rules/review.md` BLOCKER; `test/platform.test.ts@0696d99:1237–1352`, especially 1250–1264 and 1333–1350. **Severity: BLOCKER.**

**Cause and evidence:** The case titled `unregisters a confirmed-absent accessory once two trustworthy polls and a final check agree it is gone` increments `deviceListCalls` but never asserts its value or waits for the third request. A wrong runtime that removes after the two ordinary inventories without making the out-of-band final request can still meet `{ unregisteredCount: 1, accessoryCount: 0 }`. The separate restored-device case at 667–818 does observe its final request; that does not make this named case discriminate its own contract.

**Fix:** Capture the request for the final inventory, assert no unregister before its response, answer it with an empty inventory, then assert the exact three request count and one unregister.

## Warnings

### CR-06-PLATFORM-008: Named local functions use arrows without the allowed reason

**Rule and location:** `typescript-style/rules/functions.md` Functions; `test/platform.test.ts@0696d99:2095,2276–2277,2303–2304`. **Severity: WARNING.**

**Cause and evidence:** `context` and `restoredContext` are named `const` arrows without an explicit function type or outer `this` requirement. These are local helpers for repeated context construction, so this is a direct project-style violation rather than a claim about runtime behavior.

**Fix:** Use local `function context(): DiscoveryContext` and `function restoredContext(): DiscoveryContext` declarations with the same bodies.

## Rejected concerns

| Proposed ID | Concern and exact evidence | Rejection rationale |
| --- | --- | --- |
| CR-06-PLATFORM-009 | `src/platform.ts@0696d99:112–120,334,390` includes `deviceId` in local diagnostics and context. | D-14/D-027 explicitly scope permission for the vendor composite `deviceId` in local logs and accessory context, while public evidence must use placeholders. `src/runtime/accountRuntime.ts:76–85` records that decision. A generic account-identifier prohibition alone would contradict this specific project decision; no unscoped value is proven here. |
| CR-06-PLATFORM-010 | `src/platform.ts@0696d99:304–307` reaches an already registered accessory before the new-device family gate at 323–330. | `src/accessories/basementGuardian.ts:995–1034` performs a fresh `registry.lookup(snapshot.identity.deviceTypeId)` on every update and degrades unresolved profiles in place. The existing accessory keeps its immutable `deviceId` UUID while current `deviceTypeId` still selects the adapter. |
| CR-06-PLATFORM-011 | `src/platform.ts@0696d99:127–133` does not adopt a vendor rename for an old cache with no `lastVendorName`. | Without that baseline the platform cannot distinguish the old vendor name from a HomeKit customization. The D-030 rule adopts a rename only when the display name equals a stored vendor name, so preserving the old display name is a documented conservative outcome, not a proven defect. |

## Threat Flags

T-06-08 remains open for coordinator triage because CR-06-PLATFORM-001 can leave a neighbor's trust unchanged and can interrupt shutdown. No new credential, identity, or package threat was proven. No production or test fix was made in this review.

## Coordinator triage and round 0

The coordinator checked all eleven candidate locations against the reviewed `0696d99` files and the cited project rules. CR-06-PLATFORM-001 through 008 are accepted and open: 001 is a safety behavior bug requiring active RED evidence before a source change; 002 through 007 are owner assertions that let the described wrong behavior pass; 008 is a direct named-function style warning. No source or test edit occurred. CR-06-PLATFORM-009 through 011 are rejected for the concrete project-policy and source reasons in the table above. Those IDs remain assigned to preserve the review record.

Round 0 has opening 0, fixed 0, rejected 3, new candidates 11, reopened 0, and closing 8: `0 - 0 - 3 + 11 + 0 = 8`. Open IDs are 001–008. The historical ENTRY correction cap and post-debug closure are separate from this PLATFORM counter. Plans 06-06 and 06-07 own repairs and subsequent independent rounds.

On Node v26.12.0, the corresponding-test gate passed. The first two restricted `npm run test:coverage:direct -- src/platform.ts` attempts failed with `EMFILE` when the token-cache case opened `fs.watch`; both were unchanged-input environment failures. The same direct owner command then exited 0 with filesystem-watcher access and met 100% line, function, and branch coverage. It is the round-0 owner baseline, not evidence that the eight accepted causes are fixed.

## CR-06-PLATFORM-001 repair after round 0

The active two-accessory regression `continues trust updates and cached marking when one accessory fails` failed against unchanged `src/platform.ts` blob `8f48e05` at source commit `658b1f0`. Its first publisher threw a synthetic error before the second accessory or cached trust reports were reached. `06-PLATFORM-RED-EVIDENCE.json` contains the complete TAP, command, timestamps, source and test blobs, and the exact active test patch. The validator returned `RED_EVIDENCE_OK`. The final evidence-only commit is `08b97e9`; `e426052`, `fc78103`, and `658b1f0` are earlier evidence-only corrections to the same record before the source fix.

Fix `37e2fb7` catches failures per live accessory and per cached accessory, logs fixed messages without device IDs or error bodies, and continues each walk. The active case confirms that the healthy neighbor receives its exact trust and that its cached `StatusActive` becomes unreadable while a failing cached service does not stop the pass. These caught presentation failures now let the existing `runtime.stop()` path reach `root.abort()`. The shutdown path was traced in `src/runtime/accountRuntime.ts:1212–1238`; this dispatch did not change that module. This logic repair remains subject to the independent correction review and human verification.

| Gate | Revision and location | Exit | Result |
| --- | --- | ---: | --- |
| RED owner test | unchanged source at `658b1f0`, main checkout, Node v26.12.0 | 1 | Named TAP failed on the intended synthetic publisher throw. |
| RED validator | evidence at `08b97e9`, main checkout | 0 | `RED_EVIDENCE_OK`; one target test failed, no report errors. |
| GREEN named owner test | source/test at `37e2fb7`, main checkout, Node v26.12.0 | 0 | One named test passed. |
| `npm run test:coverage:direct -- src/platform.ts` | source/test at `37e2fb7`, main checkout with native file-watcher access | 0 | Platform owner passed 100% direct line, function, and branch coverage. Two restricted attempts hit unrelated `FSWatcher` `EMFILE`. |
| `npm run --silent test:corresponding` | same source/test, main checkout | 0 | Source/test pairing passed. |
| Fallow guard and audit | `src/platform.ts`, `test/platform.test.ts`; audit before the fix commit | 0 | No configured boundary zones; audit verdict `pass`. |
| Commit hook `npm run check:commit` | fix `37e2fb7`, main checkout | 0 | Normal foreground commit hooks passed. |

This is a repair record for one accepted cause. The round-0 review and its count remain historical; the next independent correction round has not run here.

---

_Reviewed: 2026-10-19T17:00:41Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep; round 0 candidates only_
