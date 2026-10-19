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

**Cause and evidence:** The case titled `unregisters a confirmed-absent accessory once two trustworthy polls and a final check agree it is gone` increments `deviceListCalls` but never asserts its value or waits for the fourth request. Registration first fetches the present device; the two ordinary absent polls are requests two and three, and the out-of-band final check is request four. A wrong runtime that removes after the two ordinary absent polls without making the final request can still meet `{ unregisteredCount: 1, accessoryCount: 0 }`. The separate restored-device case at 667–818 starts with a cached accessory and has three total requests; it does not make this named case discriminate its own contract.

**Fix:** Capture the request for the final inventory, assert no unregister before its response, answer it with an empty inventory, then assert four total requests (three after registration) and one unregister.

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

## CR-06-PLATFORM-002 repair after round 0

Fix `647ff47` keeps the AUTH-02 storage path and filename assertions and compares the complete parsed token cache record. The test fixes the platform clock at `1_800_000_000_000` ms, expects expiry `1_802_592_000_000` ms and token `id-token-1`, and computes the expected SHA-256 account fingerprint from the stored 32-character hex salt and the synthetic `account@example.test` address. The expected record is stated in the test, not obtained from the cache writer.

For a temporary negative control, only the ignored compiled cache writer at `dist-test/src/cloud/auth.js` stored `wrong-token` instead of the granted token. The named AUTH-02 test exited 1 at the complete-object assertion, showing `wrong-token` against `id-token-1`. `npm run build:test` restored the compiled writer to its original SHA-256 `f752c30c9f3317ba610b6af2c9dfcbf391fa2823f4aa10e6fdc4cecd819c0117`; tracked `src/cloud/auth.ts` remained at blob `45316e0`. No negative-control mutation was committed.

| Gate | Revision and location | Exit | Result |
| --- | --- | ---: | --- |
| `npm run build:test` | test edit before `647ff47`, main checkout, Node v26.12.0 | 0 | Compiled the owner and cache writer. |
| Named AUTH-02 negative control | temporary compiled writer, main checkout with native file-watcher access | 1 | Complete cache-record assertion rejected the wrong token bytes. |
| Named AUTH-02 GREEN | restored compiled writer and test at `647ff47`, same checkout | 0 | One named test passed after byte-for-byte restoration. |
| `npm run test:coverage:direct -- src/platform.ts` | test at `647ff47`, main checkout with native file-watcher access | 0 | Platform owner met 100% direct line, function, and branch coverage. |
| `npm run --silent test:corresponding` | same source/test inputs, main checkout | 0 | Source/test pairing passed. |
| Fallow guard and audit | `test/platform.test.ts`; audit before the fix commit | 0 | No configured boundary zones; audit verdict `pass`. |
| Commit hook `npm run check:commit` | fix `647ff47`, main checkout | 0 | Normal foreground commit hooks passed. |

This repair changes only the owner test. The round-0 count remains historical, and no independent correction round ran here.

## CR-06-PLATFORM-003 repair after round 0

Fix `2e60f69` gives both shutdown cases their own fake timer. Each waits for two launch requests before shutdown, advances 300,000 ms, and checks for later work. The lifecycle case records registration and removal calls as well as requests and accessory state. Its vendor transport is injected through `httpFetch`, the port the platform actually uses. No production defect appeared with these stronger assertions.

Two temporary controls tested the assertions. First, removing `root.abort()` only from ignored `dist-test/src/runtime/accountRuntime.js` left a scheduled wait active. The first named case exited 1 because `verify(httpFetch)` saw an unexpected third Auth0 request after the clock advanced. Second, ignored `dist-test/src/platform.js` scheduled one registration and one removal after shutdown. The second named case exited 1 at its `accessoryChanges` assertion: actual `['registered 1', 'removed 1']` versus expected `[]`. `npm run build:test` restored the compiled runtime and platform to SHA-256 `cc19b08ac2c861c537297e437be73e5f0dbff55715a6e54e29ec208681a7e1e4` and `45d496adabb4ff78c9040207864b21fe8069556dc8169d040a2191f9844f58b1`, respectively. Neither control changed tracked source or entered a commit.

| Gate | Revision and location | Exit | Result |
| --- | --- | ---: | --- |
| `npm run build:test` | owner edit before `2e60f69`, main checkout, Node v26.12.0 | 0 | Compiled the owner and runtime. |
| Named abort negative control | temporary compiled runtime, main checkout | 1 | Unexpected third vendor request after fake time advanced. |
| Named accessory negative control | temporary compiled platform, main checkout | 1 | Delayed registration and removal failed the empty call-log assertion. |
| Both named GREEN cases | restored compiled files, owner edit at `2e60f69`, main checkout | 0 each | One test passed in each run. |
| `npm run test:coverage:direct -- src/platform.ts` | owner edit at `2e60f69`, main checkout with native file-watcher access | 0 | Platform owner met 100% direct line, function, and branch coverage. |
| `npm run --silent test:corresponding` | same source/test inputs, main checkout | 0 | Source/test pairing passed. |
| Fallow guard and audit | `test/platform.test.ts`; audit before the fix commit | 0 | No configured boundary zones; audit verdict `pass`. |
| Project pre-step and commit hook | fix `2e60f69`, main checkout | 0 | Pre-commit fixers and the final normal `npm run check:commit` passed. An earlier hook attempt found four lint errors; they were corrected before this commit. |

This is one owner-test cause repair. The historical round-0 count is unchanged, and the first independent correction round has not run here.

## CR-06-PLATFORM-004 repair after round 0

Fix `b7e4670` gives the offline trust case two synthetic systems. It records each system's offline and flood `StatusActive` values and offline contact state before any failed poll, after one failed poll, and after two failed polls. Literal expectations require both offline trust flags to stay active through the first failure and become inactive together on the second. The case also checks that three inventories ran. The initial draft expected a different contact-state value before failure; the named test exposed that test expectation, which was corrected without a production edit.

Two temporary controls verified the new assertions. Changing `REST_FAILURE_THRESHOLD` from 2 to 1 only in ignored `dist-test/src/runtime/monitoringHealth.js` made the named case exit 1: both offline `StatusActive` values were false after the first failed poll, where true was expected. Adding a `break` after the first accessory's trust publication only in ignored `dist-test/src/platform.js` made the same case exit 1: the second accessory still reported offline trust as true after the second failure, where false was expected. `npm run build:test` restored the compiled SHA-256 values `5b8ced1abcf89ffffae50b785a6e11d52c57cf50c3957c588049bac6a39a3dac` and `45d496adabb4ff78c9040207864b21fe8069556dc8169d040a2191f9844f58b1`. No temporary mutation was committed. The stronger case exposed no production bug.

| Gate | Revision and location | Exit | Result |
| --- | --- | ---: | --- |
| `npm run build:test` | owner edit before `b7e4670`, main checkout, Node v26.12.0 | 0 | Compiled the owner and both temporary-control targets. |
| Named early-withdrawal control | temporary compiled monitoring threshold, main checkout | 1 | First-poll trust assertion rejected premature withdrawal for both devices. |
| Named first-only control | temporary compiled platform publication, main checkout | 1 | Second-device trust assertion rejected first-accessory-only withdrawal. |
| Named GREEN owner case | restored compiled files, owner edit at `b7e4670`, main checkout | 0 | One named test passed. |
| `npm run test:coverage:direct -- src/platform.ts` | owner edit at `b7e4670`, main checkout with native file-watcher access | 0 | Platform owner met 100% direct line, function, and branch coverage. |
| `npm run --silent test:corresponding` | same source/test inputs, main checkout | 0 | Source/test pairing passed. |
| Fallow guard and audit | `test/platform.test.ts`; audit before the fix commit | 0 | No configured boundary zones; audit verdict `pass`. |
| Project pre-step and commit hook | fix `b7e4670`, main checkout | 0 | Pre-commit fixers and normal `npm run check:commit` passed. |

This is one owner-test cause repair. The historical round-0 count is unchanged, and the first independent correction round has not run here.

## CR-06-PLATFORM-005 repair after round 0

Fix `7389501` adds a ContactSensor to the same restored accessory as the existing LeakSensor. Both start with `StatusActive: true`; each also carries a distinct measurement. The owner case requires both trust flags to become false after `configureAccessory`, while `LeakDetected` and `ContactSensorState` keep their seeded values. It still confirms that the platform records the restored accessory.

A temporary first-service-only control added `break` after the first action in ignored `dist-test/src/accessories/staleMarking.js`. The named test exited 1 at its complete-object assertion: the first service's trust was false, but the second stayed true instead of false; both measurements and accessory ownership matched expectations. `npm run build:test` restored the compiled file to SHA-256 `04897d6c0287d87d90f8f1bbd549d533918fd58c908fbddc673115f428d0efc8`. No control mutation was committed, and the stronger case exposed no production bug.

| Gate | Revision and location | Exit | Result |
| --- | --- | ---: | --- |
| `npm run build:test` | owner edit before `7389501`, main checkout, Node v26.12.0 | 0 | Compiled the owner and marking helper. |
| Named first-only control | temporary compiled marking helper, main checkout | 1 | Second service's `StatusActive` remained true, where false was expected. |
| Named GREEN owner case | restored compiled helper, owner edit at `7389501`, main checkout | 0 | One named test passed. |
| `npm run test:coverage:direct -- src/platform.ts` | owner edit at `7389501`, main checkout with native file-watcher access | 0 | Platform owner met 100% direct line, function, and branch coverage. |
| `npm run --silent test:corresponding` | same source/test inputs, main checkout | 0 | Source/test pairing passed. |
| Fallow guard and audit | `test/platform.test.ts`; audit before the fix commit | 0 | No configured boundary zones; audit verdict `pass`. |
| Project pre-step and commit hook | fix `7389501`, main checkout | 0 | Pre-commit fixers and normal `npm run check:commit` passed. |

This is one owner-test cause repair. The historical round-0 count is unchanged, and the first independent correction round has not run here.

## CR-06-PLATFORM-006 repair after round 0

Fix `59ff8f0` restores two Switches on one accessory: System Self-Test and Alarm Mute have distinct subtypes and start with `On: false`. The named owner case presses each and requires refusal status `-70412` and unchanged `On: false` for both. A strict vendor HTTP mock verifies no transport request. The platform uses empty configuration here, so this case establishes the local refusal behavior before discovery or a vendor command port exists.

A temporary control added `break` after the first action in ignored `dist-test/src/accessories/staleMarking.js`, leaving only the first control bound. The named test exited 1 at its complete-object assertion: Self-Test refused the press, while Alarm Mute returned `undefined` and changed `On` to true instead of refusing and staying false. `npm run build:test` restored the compiled helper to SHA-256 `04897d6c0287d87d90f8f1bbd549d533918fd58c908fbddc673115f428d0efc8`. No control mutation was committed, and the stronger case exposed no production bug.

| Gate | Revision and location | Exit | Result |
| --- | --- | ---: | --- |
| `npm run build:test` | owner edit before `59ff8f0`, main checkout, Node v26.12.0 | 0 | Compiled the owner and binding helper. |
| Named first-only control | temporary compiled binding helper, main checkout | 1 | Second press succeeded and flipped `On`, where refusal and unchanged `On` were expected. |
| Named GREEN owner case | restored compiled helper, owner edit at `59ff8f0`, main checkout | 0 | One named test passed. |
| `npm run test:coverage:direct -- src/platform.ts` | owner edit at `59ff8f0`, main checkout with native file-watcher access | 0 | Platform owner met 100% direct line, function, and branch coverage. |
| `npm run --silent test:corresponding` | same source/test inputs, main checkout | 0 | Source/test pairing passed. |
| Fallow guard and audit | `test/platform.test.ts`; audit before the fix commit | 0 | No configured boundary zones; audit verdict `pass`. |
| Project pre-step and commit hook | fix `59ff8f0`, main checkout | 0 | Pre-commit fixers and normal `npm run check:commit` passed. |

This is one owner-test cause repair. The historical round-0 count is unchanged, and the first independent correction round has not run here.

## CR-06-PLATFORM-007 repair after round 0

Fix `38c8a77` makes the confirmed-removal case hold its out-of-band final inventory response. It observes four inventory requests in total: the initial present-device registration, two ordinary absent polls, and the final confirmation request. Before that response, the case requires the final `/devices` request to exist, the accessory to remain registered, and zero unregister calls. After an empty final response, it requires exactly one unregister and an empty accessory map. The separate cached-restoration case begins with an absent inventory and therefore has three total requests; its count does not apply to this case.

A temporary control in ignored `dist-test/src/runtime/accountRuntime.js` bypassed `options.api.devices(root.signal)` for the final check. The named test exited 1: it saw only three total requests (two after registration), no final request, and an early unregister. `npm run build:test` restored the compiled runtime to SHA-256 `cc19b08ac2c861c537297e437be73e5f0dbff55715a6e54e29ec208681a7e1e4`. No control mutation was committed, and the stronger case exposed no production bug.

| Gate | Revision and location | Exit | Result |
| --- | --- | ---: | --- |
| `npm run build:test` | owner edit before `38c8a77`, main checkout, Node v26.12.0 | 0 | Compiled the owner and runtime. |
| Named skipped-final-check control | temporary compiled runtime, main checkout | 1 | Exact before-response assertion rejected early unregister and the missing fourth request. |
| Named GREEN owner case | restored compiled runtime, owner edit at `38c8a77`, main checkout | 0 | One named test passed. |
| `npm run test:coverage:direct -- src/platform.ts` | owner edit at `38c8a77`, main checkout with native file-watcher access | 0 | Platform owner met 100% direct line, function, and branch coverage. |
| `npm run --silent test:corresponding` | same source/test inputs, main checkout | 0 | Source/test pairing passed. |
| Fallow guard and audit | `test/platform.test.ts`; audit before the fix commit | 0 | No configured boundary zones; audit verdict `pass`. |
| Project pre-step and commit hook | fix `38c8a77`, main checkout | 0 | Pre-commit fixers and normal `npm run check:commit` passed. |

This is one owner-test cause repair. The historical round-0 count is unchanged, and the first independent correction round has not run here.

## CR-06-PLATFORM-008 repair after round 0

Fix `47bf976` replaces three named local arrows with `function context(): DiscoveryContext` and `function restoredContext(): DiscoveryContext` declarations in the two registration owner cases. Their bodies, captured values, and call sites are unchanged. The two parameterized uncertain-registration cases and the fresh-run/restored-accessory case passed. This is a style repair; no production source or behavior changed.

The first normal commit hook found three missing blank lines after the new declarations. Adding those lines made `npm run --silent check:static` and the normal commit hook pass. No other function was changed.

| Gate | Revision and location | Exit | Result |
| --- | --- | ---: | --- |
| `npm run build:test` | final owner edit at `47bf976`, main checkout, Node v26.12.0 | 0 | TypeScript test build passed. |
| Named registration owner cases | same test input, main checkout | 0 | Three cases passed. |
| `npm run test:coverage:direct -- src/platform.ts` | final owner edit at `47bf976`, main checkout with native file-watcher access | 0 | Platform owner met 100% direct line, function, and branch coverage. |
| `npm run --silent test:corresponding` | same source/test inputs, main checkout | 0 | Source/test pairing passed. |
| Fallow guard and audit | `test/platform.test.ts`; audit before the fix commit | 0 | No configured boundary zones; audit verdict `pass`. |
| Project pre-step and commit hook | fix `47bf976`, main checkout | 0 | Pre-commit fixers and normal `npm run check:commit` passed after the blank-line correction. |

The historical round-0 count is unchanged, and the first independent correction round has not run here.

---

_Reviewed: 2026-10-19T17:00:41Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep; round 0 candidates only_

## Independent correction round 1 — 2026-10-19T17:39:44Z

**Reviewer:** `gsd-code-reviewer` (`platform_round1_review`). **Reviewed revision:** `7558443628973b82f04e9b43ce989989a1d82f93` on Node v26.12.0. I read the complete `src/platform.ts@7558443` lines **1–681** and `test/platform.test.ts@7558443` lines **1–3999** in contiguous spans: source 1–240, 241–480, 481–681; test 1–250, 251–500, 501–750, 751–1000, 1001–1350, 1351–1650, 1651–2000, 2001–2300, 2301–2600, 2601–2900, 2901–3200, 3201–3500, 3501–3800, 3801–3999. I reread overlapping boundaries and exact finding lines. The review covered the entire current owner pair, not only the repair diff. The tracked tree and untracked-input list were clean before this report edit; `git diff 7558443 -- src/platform.ts test/platform.test.ts` and the executable-input diff were empty. `npm run --silent test:corresponding` exited 0. Previous fix commits provide direct-coverage and hook evidence; this read-only reviewer did not rebuild or mutate `dist-test` while the checkout was shared.

The review applied `AGENTS.md` safety, privacy, and persistence constraints; `06-CONTEXT.md` D-03–D-06; `06-REVIEW-PROTOCOL.md`; TypeScript style and unit-test rules, especially `cases.md` assertions and `review.md` classification. Bounded call-chain reads were `src/config.ts`, `src/runtime/accountRuntime.ts`, `src/accessories/basementGuardian.ts`, `src/accessories/staleMarking.ts`, `src/accessories/pumpRecords.ts`, and `src/accessories/serviceCatalogue.ts`. No finding depends on a new Homebridge API interpretation.

### Opening IDs and repair dispositions

| Opening ID | Round-1 result at `7558443` | Evidence |
| --- | --- | --- |
| CR-06-PLATFORM-001 | **Fixed** in code; human workflow verification remains a separate gate | `src/platform.ts:428–432,456–461` isolates live and cached accessory failures. `test/platform.test.ts:1675–1725` makes the first live publisher and first cached service throw, then checks the healthy neighbor and cached marking. The runtime stop path can reach `root.abort()` at `src/runtime/accountRuntime.ts:1212–1238` after these presentation failures. |
| CR-06-PLATFORM-002 | **Fixed** | `test/platform.test.ts:982–1050` now checks the complete parsed token cache record, including token, expiry, salt shape, and independently computed synthetic account fingerprint. The recorded temporary wrong-token control failed. |
| CR-06-PLATFORM-003 | **Open**; the attempted assertion repair does not cover the next poll | `test/platform.test.ts:919,965–968,1478,1514–1517` advances only 300,000 ms. Both cases call `accountConfig()` without `pollInterval`; `src/config.ts:40,211` supplies 900 seconds and `src/runtime/accountRuntime.ts:1052–1054,1333` waits 900,000 ms before a poll. A runtime that cancels credential refresh but leaves the poll timer active passes both cases. The recorded removal-of-`root.abort()` control exercised the 30-second credential retry (`src/runtime/accountRuntime.ts:58,966–1007`), not that selective poll leak. **Rule:** `typescript-unit-tests/rules/cases.md` Assertions and `rules/review.md` BLOCKER. **Fix:** Set `pollInterval: 300` in both case configurations or advance past 900,000 ms; keep the exact post-shutdown request and accessory-call assertions and prove a selective leaked-poll control fails. |
| CR-06-PLATFORM-004 | **Fixed** | `test/platform.test.ts:1145–1305` observes two accessories before failure, after one failure, and after two, with literal trust and contact expectations. The threshold-one and first-accessory-only controls failed. |
| CR-06-PLATFORM-005 | **Fixed** | `test/platform.test.ts:1584–1617` checks two distinct restored services, each trust flag and preserved measurement; the first-service-only control failed. |
| CR-06-PLATFORM-006 | **Fixed** | `test/platform.test.ts:1624–1650` presses both restored Switches, checks refusal and unchanged `On`, and forbids vendor requests; the first-control-only control failed. |
| CR-06-PLATFORM-007 | **Fixed** | `test/platform.test.ts:1310–1453` holds the fourth inventory response, checks no unregister before that answer, and checks exactly one after; the skipped-final-check control failed. |
| CR-06-PLATFORM-008 | **Fixed** | The three cited named context builders are declarations at `test/platform.test.ts:2306,2490,2519`; bodies and call sites retain their prior behavior and affected owner cases passed. |

The round-0 rejected candidates **009–011 remain rejected** for their recorded project-decision and source reasons. Their cited behavior has not changed; no duplicate ID is assigned.

### New BLOCKER findings

#### CR-06-PLATFORM-012: A failed cached service leaves later trust reports readable

**Rule and location:** `AGENTS.md` safety semantics; D-06 and D-10 account-wide credential refusal; `src/platform.ts@7558443:454–461,481–485`; bounded `src/accessories/staleMarking.ts@7558443:74–85,168–172`; `test/platform.test.ts@7558443:1675–1725`. **Severity: BLOCKER.**

**Issue:** The new catch isolates accessories, but `markTrustReportsUnreadable` walks all services inside one call. If an early service's `updateCharacteristic` throws, the helper exits and later services on that *same* accessory are never visited. Those later `StatusActive` reports remain readable even though credentials were rejected. The existing regression uses one trust service per accessory, so it proves cross-accessory continuation only. A two-service cached accessory with the first service throwing and the second initially readable exposes the failure. The compound `marked += helper()` also loses any count of services marked before a later throw, so the zero-count diagnostic can falsely say that no accessory shows the refusal.

**Fix:** Isolate each service's unreadable marking within the service walk, retain a count of successful marks, and continue to sibling services. Add an owner case with two trust-bearing services on one cached accessory, one synthetic failure, and an exact read/status assertion for the healthy sibling.

#### CR-06-PLATFORM-013: A restored-service failure prevents the accessory from being owned

**Rule and location:** `AGENTS.md` safety, identity, and persistence constraints; D-06 and RES-04; `src/platform.ts@7558443:669–679`; bounded `src/accessories/staleMarking.ts@7558443:74–85,108–111,130–134`; `test/platform.test.ts@7558443:1584–1619`. **Severity: BLOCKER.**

**Issue:** `configureAccessory` records the restored accessory only after both service passes and logging. If a cached service throws during stale marking or control binding, the method exits before `this.accessories.set`. Other services remain trusted or controls stay writable; the launch path at `src/platform.ts:637–645` then cannot include this cached accessory's identity, and later credential-failure marking also cannot reach it. The owner case exercises only successful services. This is distinct from 012: this path can lose ownership of the whole restored accessory before cloud work starts.

**Fix:** Record the restored accessory before fallible presentation work, isolate service failures so remaining trust reports and controls are handled, and log a fixed redacted failure. Add an owner case with an early synthetic service failure that checks map ownership, a later service's stale trust, and control refusal.

#### CR-06-PLATFORM-014: A failed cache write permanently loses a counted pump observation

**Rule and location:** `AGENTS.md` persistence and safety semantics; D-06 and CTRL-01; `src/platform.ts@7558443:163–169,240–290`; bounded `src/accessories/pumpRecords.ts@7558443:365–401` and `src/accessories/basementGuardian.ts@7558443:1054`. **Severity: BLOCKER.**

**Issue:** After a pump activation, `pumpRecords.observe` mutates the in-memory context and its previous-running state before `store.persist()` calls `api.updatePlatformAccessories`. If that cache write throws, the outer dispatch logs and continues. An identical next poll sees no new activation, so `changed` is false and `persist()` is never retried. `updateDiscoveredDevice`'s `finally` comparison excludes observation records; absent a simultaneous rename or service change, it also makes no persistence call. A restart then reloads the old count and loses a real observed activation. The existing test at `test/platform.test.ts:3429–3550` proves successful writes to the correct accessory but does not make the first cache write fail.

**Fix:** Keep a pending-persist flag until `updatePlatformAccessories` succeeds and retry it on a later observation, including an unchanged one. Add an active regression with a first synthetic cache-write failure, a repeated identical poll, and a successful second write that carries the counted record.

### Round-1 counter and decision

Opening **8** (001–008), fixed **7** (001, 002, 004–008), rejected **0**, new **3** (012–014), reopened **0**, closing **4** (003, 012–014): `8 - 7 - 0 + 3 + 0 = 4`. CR-06-PLATFORM-003 was never accepted as fixed by an independent round, so its incomplete attempted repair is **open**, not a reopened fixed finding. All four closing IDs are BLOCKER. Round one makes progress (`4 < 8`), no fixed ID reopened, and the four-round cap has not been reached. **D-04 decision: CONTINUE** with these exact open IDs in plan 06-07 after the coordinator commits the report and ledger; this reviewer dispatches no fixes. If a later round fails to reduce its opening count, reopens a fixed ID, or reaches round four, stop under D-04.

## CR-06-PLATFORM-003 repair after round 1

Fix `965c300` advances each shutdown case's own fake clock by 900,001 ms after shutdown. Both cases use `accountConfig()` without an interval override, so `src/config.ts` resolves a 900-second poll interval and `runPolls` waits 900,000 ms. This advance crosses the next poll deadline while retaining the existing exact request and accessory-call assertions. The earlier `2e60f69` repair advanced only 300,000 ms and remains recorded as an incomplete attempt. No production source was changed.

A temporary control changed only ignored `dist-test/src/runtime/accountRuntime.js`: its poll wait ignored abort, and its poll used a fresh signal after waking. `root.abort()` and the credential rotation wait were unchanged, so credential retry still canceled. Both named shutdown cases exited 1 after the poll deadline. The first strict vendor HTTP mock rejected an unexpected third Auth0 call. The second case's exact request assertion saw one post-shutdown request instead of zero. `npm run build:test` restored the compiled runtime byte for byte to SHA-256 `cc19b08ac2c861c537297e437be73e5f0dbff55715a6e54e29ec208681a7e1e4`; both named cases then passed. The control was not committed. The stronger tests exposed no production defect.

| Gate | Revision and location | Exit | Result |
| --- | --- | ---: | --- |
| `npm run build:test` | test edit at `965c300`, main checkout, Node v26.12.0 | 0 | Compiled the owner and runtime. |
| Named selective poll-leak control | temporary compiled runtime, main checkout | 1 | Both shutdown owners failed on an unexpected post-shutdown request. |
| Named GREEN shutdown owners | restored compiled runtime, test edit at `965c300`, main checkout | 0 | Two named cases passed. |
| `npm run test:coverage:direct -- src/platform.ts` | same executable inputs, main checkout with native file-watcher access | 0 | Platform owner met 100% direct line, function, and branch coverage. |
| `npm run --silent test:corresponding` | same source/test inputs, main checkout | 0 | Source/test pairing passed. |
| Fallow guard and audit | `test/platform.test.ts`; audit before fix commit | 0 | No configured boundary zones; audit verdict `pass`. |
| Project pre-step and normal commit hook | fix `965c300`, main checkout | 0 | Pre-commit fixers and `npm run check:commit` passed. |

This record repairs one round-1 open cause. The round-1 counter remains historical; an independent correction review has not yet accepted the repair.

## CR-06-PLATFORM-012 repair after round 1

The active `marks later cached trust on the same accessory when an earlier service fails` regression uses two trust-bearing services on one restored accessory. Against unchanged `src/platform.ts` blob `07b3a747` and `src/accessories/staleMarking.ts` blob `f12a6dc5`, the first service's synthetic `updateCharacteristic` throw stopped the helper. The second service remained readable and the platform logged the false zero-mark diagnostic. The complete TAP and active patch are in the evidence-only commit `5a55c3b`; the validator returned `RED_EVIDENCE_OK` before any source edit.

Fix `f22d73f` isolates failures per cached service. `markTrustReportsUnreadable` returns separate successful and failed counts so `applyMonitoringHealth` can retain successful marks and emit its existing fixed, device-free error line for a failure. The owner test checks that the second service becomes unreadable and that the false zero-mark line is absent. A focused helper case checks `{ marked: 1, failed: 1 }`; the earlier PLATFORM-001 diagnostic case also passes. A service-list failure still uses the outer per-accessory catch and allows the next accessory to be marked. This repair does not change restored-accessory ownership, which remains CR-06-PLATFORM-013.

On Node v26.12.0, the named RED exited 1 on its intended assertion; the validated evidence-only commit changed only `06-PLATFORM-RED-EVIDENCE.json`. After GREEN, `npm run build:test`, four focused cases, pairing, Fallow symbol impact/guard/audit, the project pre-step, and normal hooks exited 0. `npm run test:coverage:direct -- src/platform.ts src/accessories/staleMarking.ts` exited 0 with each owner at 100% line, function, and branch coverage. The tree was clean at `f22d73f`. This cause remains pending the next independent complete-file correction review; round one is unchanged.
