---
phase: 05-accessories-conformance
batch: ACCESSORY
review_round: 0
reviewed: 2026-10-18T10:49:00Z
depth: deep
source_revision: 9cb164b1299249c2d2083ea81677c83e28e66916
files_reviewed: 2
files_reviewed_list:
  - src/accessories/basementGuardian.ts
  - test/accessories/basementGuardian.test.ts
findings:
  blocker: 7
  warning: 22
  total: 29
status: issues_found
reviewer: gsd-code-reviewer (round 0)
---

# Phase 5 ACCESSORY batch: round-0 review

Revision `9cb164b1299249c2d2083ea81677c83e28e66916` equals `git rev-parse HEAD`. The only
uncommitted change is the coordinator's ledger edit (`05-FINDINGS.md`), which is not a build input.
All 1,066 source lines and all 3,456 test lines were read in full. The `.agents/skills/` books (each
`SKILL.md` with every file in `rules/`) were applied. Where the tracked `.claude/rules/*.md` copies
differ, `.agents/skills/` wins. Severities follow each book's "Classifying findings" section. There
is no Info tier.

Three findings are genuine production bug candidates (D-04): 001, 002 and 003. Two read-only probes
of the compiled modules (`dist-test/`, made-up inputs, scripts kept in the session scratch directory
under `probe/`) observed all three. No source or test file was changed, no mutation experiment ran,
and nothing was committed or stashed.

## Findings

### CR-05-ACCESSORY-001 - BLOCKER: A request whose window closes under a credential halt, a doubtful withdrawal or an undecoded field leaves HAP serving the requested `true`

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); locked D-037 ("If no confirmation arrives within 30 seconds, clear the pending state. Restore the last reported Switch value and log a warning."); D-05 (last valid values; requested state never becomes reported state)
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:637-653, 667-691` (with `src/accessories/controls.ts:533-540, 416-420`, CONTROLS batch, read-only here)
**Issue:** Lead S-05-24 part (2) is confirmed. When the 30-second window closes, `expire` (`controls.ts:533-540`) deletes the entry, calls `republish()` and logs. It does not push `On`; only the clearing push (`clearRefusal`, `controls.ts:416-420`) does that. So the value the Switch shows after expiry is whatever `republish` pushes. Three reachable paths push nothing:

- P1, credential halt. The accessory's `republish` returns early while `monitoring.credentialsRejected` is `true` (`:685-688`).
- P2, a doubtful withdrawal. The row withholds `On` when its scope carries `invalid` or `controller-link-lost` (`isRowPublishable`, `serviceCatalogue.ts:262-266`).
- P3, the field no longer decodes. The row projects no `On` (`booleanOf` answers `undefined`).

Probe (`probe/probe.mjs`): a Gemini accessory reports `test_running: false`, the transports work, and a press of `true` is accepted. Then each path happens and the collected 30 000 ms deadline runs.

- Control P0 (no further event): `afterExpiry: { value: false, read: false }`. This is what D-037 asks for.
- P1 (`markMonitoring(CREDENTIALS_REFUSED)`, then `markTrustReportsUnreadable`): `afterExpiry: { value: true, read: true }`.
- P2 (a poll with `serial_communications: false`, all seven scopes `controller-link-lost`): `{ value: true, read: true }`.
- P3 (a poll with `test_running: 'x'`, `self-test invalid`): `{ value: true, read: true }`.

In each case the warning "was never confirmed by the device" is logged. The Switch then goes on showing the requested state as if the device had reported it. That is requested state presented as reported state, which `controls.ts:46-48` and the WR-02 case comment (test `:2846`) call the defect to avoid. Under P1 nothing ever corrects it, because the runtime has stopped for good. Under P2 and P3 the last valid reported value (`false`, which the row published before the press) is lost until a later valid report. The `On` characteristic carries no trust report. The guard comment (`:673-675`) gives that as the reason the binder's own `On` push may still run under the halt. The expiry path has no such push.
**Fix:** Coordinator decision (D-04). Minimum fix candidate: when a request is accepted, the binder records the value HAP serves before the write is stored. Inside `answerWrite`, `service.getCharacteristic(On).value` is still the pre-press value, because HAP stores the written value only after the handler resolves. After `republish()`, `expire` pushes `publishValue(service, On, reported() ?? previousValue)`. The trust report is untouched, so the credential marking survives. This edits `controls.ts` (CONTROLS, closed) as a bounded consumer task (D-06), and the binder must then know the service in `expire`. RED case in this owner, for example `restores the reported value when the window closes after the credentials are refused`, plus one each for the doubtful and the undecoded paths.
**Flags:** D-04, D-06

### CR-05-ACCESSORY-002 - BLOCKER: A cached accessory whose family does not resolve keeps a restored refusal that blames the transport while the transport is ready

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); the module's own rule at `:799-806` ("a diagnostic naming the wrong cause is worse than none because an owner acts on it"); D-07, D-08 (one condition answers one cause)
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:698-706, 721-750, 776-793, 991-1016`
**Issue:** Lead S-05-25 is confirmed for the accessory part. `bindControlRow` is called only from `publishRows` (`:739`), which only the resolved branch of `update()` reaches. The unresolved branch (`:991-1016`) and `markMonitoring` reach `republishPublishedRows`, which never binds. So the refusal that `bindRestoredControlRefusal` puts on a cached Switch at restart stays for as long as the family does not resolve. That refusal always logs `NO_COMMAND_TRANSPORT_CAUSE`. Probe P4 (`probe/probe.mjs`): a cached `System Self-Test` Switch carries the restored refusal. Then `markMonitoring` reports every transport working (`commandTransportReady: true`), an unresolved `update()` runs, and a press of `true` follows. Result: `thrown: -70412`, and the line is `Refused System Self-Test on Sump: the plugin has no way to reach the vendor right now.`. The transport was ready. If the live binder answered, its own rules would name the true cause: `the plugin has no fresh state for it`, because every non-connectivity scope is `invalid` (`hasNoFreshState`, `controls.ts:287-289`). With a quiet live path or no transport, it would name that cause. Refusing is correct. The named cause is wrong output.
**Fix:** Coordinator decision (D-04). Minimum fix candidate inside this file: in `republishPublishedRows`, call `bindControlRow(row, service)` for a control row whose service is already present. The binder's single-slot `onSet` then replaces the restored refusal (`controls.ts:50-53`). A press can never be sent from that state, because `reportedControlValue` answers `undefined` for an `invalid` scope, so the refusal is kept and only its cause becomes true. D-05 keeps the restored refusal's own line unchanged. What changes is which refusal answers, so P-05-01 requires the D-04 path. The JSDoc at `controls.ts:445-447` ("The refusal also stays, with the same line, while a cached accessory's family does not resolve") then needs the matching edit. The missing-device and no-snapshot variants are in `src/platform.ts` (see Out-of-scope observations).
**Flags:** D-04

### CR-05-ACCESSORY-003 - BLOCKER: The degradation line says AccessoryInformation keeps its last values in the same update that refreshed it

**Rule:** `.agents/skills/typescript-style/SKILL.md` Classifying findings (incorrect behavior); the module's rule at `:803-806` on diagnostics an owner acts on
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:807-823` (with `:1028, 1041-1043`)
**Issue:** `reportDegradation` logs `... AccessoryInformation keeps its last valid values until a family-valid update recovers it.` for every transition into an `invalid` scope. On the resolved branch, one violated field costs only its own scope. The `metadata` group still decodes, so `populateAccessoryInformation` refreshes `AccessoryInformation` in the same update (`:1041-1043`). Probe `probe/probe2.mjs`: the first update has `mcu_firmware_version: '1.0'`. The second has `test_running: 'x'` and `mcu_firmware_version: '2.0'`. Result: `FirmwareRevision` moves `1.0 -> 2.0`, `untrusted: ['self-test invalid']`, and the line printed is the one above. The line is true only for the unresolved branch. No case pins this line (see 005), so the suite cannot see it.
**Fix:** Coordinator decision (D-04; P-05-01 protects log lines). State only what holds on both branches, for example `Degraded ${deviceId}: the profile or payload stopped validating. The affected services keep their last valid values until a family-valid update recovers them.`. Or keep the AccessoryInformation clause for the unresolved branch alone. RED case: the whole warnings array for a per-field violation whose metadata moved.
**Flags:** D-04

### CR-05-ACCESSORY-004 - BLOCKER: No case shows that the accessory hands the binder's pending set to the rows, so a projection with an empty set passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case discriminates); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (missing assertions)
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2746-2776, 2848-2896, 2993-3028, 3034-3064` (against `src/accessories/basementGuardian.ts:610-617, 641-642, 985, 1012, 1060`)
**Issue:** Withholding reaches the catalogue only through `projectionInputOf(..., controls.pending)`. Two plausible wrong implementations pass all 157 cases: `pendingControls: new Set()` in `projectionInputOf`, or `projectionInputOf(decoded, new Set())` at `:1060` and `:985`. No case reads `On` after a publish pass that runs while a request waits:

- `RES-04 refuses the next press ...` (`:2746`) changes the trust while the request waits, but asserts only `sends` and `warnings`.
- `WR-02 returns the Switch ...` (`:2848`) reads `afterTheAcceptedPress` before `markMonitoring(SHADOW_SILENT)` republishes. The final `false` is the same with or without withholding.
- `WR-06 ... first went quiet` (`:2993`) ends with `on: true` after the confirming update. That is also the result when the republish in between snapped the Switch to `false`.
- `WR-06 still warns ...` (`:3034`) runs an update that reports `false` while the request waits, and never reads `On`.

STATE.md (carried W-1) records that Cucumber cannot see a withholding mutation. The v1.0 W-1 mutation was in `controlValues` and was killed by catalogue cases. The accessory's plumbing is not covered anywhere.
**Fix:** Add a case: accept a press (`On` true), run a poll that still reports `test_running: false`, and read `On`. Then run the collected window. Assert `{ duringTheWindow: true, afterTheWindow: false }`. Add a second read after a `markMonitoring` change during the window to cover `:985`.
**Flags:** none

### CR-05-ACCESSORY-005 - BLOCKER: The degradation line is asserted only as a count, and no case pins its text

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Do not assert existence, length, or one property at a time when the whole value is the promise"); precedent CR-05-RECORDS-006
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:957-969, 971-990`
**Issue:** `logs the degradation transition exactly once ...` asserts `warnings.length === 1`. `logs again after recovering ...` asserts `warnings.length === 2`. No case in the file contains the degradation text (`grep Degraded` finds nothing). A line that drops the `deviceId`, names the wrong cause, or states a false consequence passes. 003 is such a line, and it is in the code today. D-05 preserves exact log lines, so this module's lines are a pinned contract.
**Fix:** Add a hand-written `DEGRADATION_WARNING` constant and assert the whole arrays: `[DEGRADATION_WARNING]` and `[DEGRADATION_WARNING, DEGRADATION_WARNING]`. Add a per-field case once 003 is decided.
**Flags:** none

### CR-05-ACCESSORY-006 - BLOCKER: The "leaves AccessoryInformation untouched" cases read Manufacturer alone

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions (whole values); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:846-863 (line 862), 1119-1139 (line 1137)`
**Issue:** The four `leaves AccessoryInformation untouched when the family ...` rows and the unresolved-family case compare only `Manufacturer` before and after. `SerialNumber` comes from `snapshot.identity`, not from the decoded metadata (`:459`). So a plausible wrong implementation pushes it outside the `metadata !== undefined` guard, or on the unresolved branch. All five cases pass. The titles promise the whole service.
**Fix:** Read all four characteristics (`Manufacturer`, `Model`, `SerialNumber`, `FirmwareRevision`) into one record before and after, and compare the records whole, as `refreshes AccessoryInformation from the decoded metadata` (`:1080-1099`) does for the positive case.
**Flags:** none

### CR-05-ACCESSORY-007 - BLOCKER: The union-drift case cannot see a `TrustScope` member that the accessory omits

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings; `.agents/skills/typescript-style/rules/comments.md` (accuracy)
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:245-247, 2427-2440`
**Issue:** The comment says that `EVERY_TRUST_SCOPE` is written out "so the accessory's own list and the union cannot drift apart without a case saying so". Both `EVERY_TRUST_SCOPE` and production `TRUST_SCOPES` are typed `readonly TrustScope[]`. Neither has to change when a member is added to `TrustScope` (`src/device/health.ts:33`). Wrong implementation: a new member is added to the union and `TRUST_SCOPES` is not updated. Typecheck stays green, and `lists one trust scope per member of the union it reports from` stays green, because both lists lack the member. The case also appends `'connectivity'` by hand and sorts, so it pins nothing that `degrades every non-connectivity scope ...` (`:846-863`) does not already pin.
**Fix:** Make the test's list exhaustive at compile time, for example `const TRUST_SCOPE_MEMBERS: Record<TrustScope, true> = { water: true, ... }` and `Object.keys(...)` as the expected set. Then a new union member stops the test from compiling until it is listed, and the case fails while `TRUST_SCOPES` omits it. Correct the comment to match.
**Flags:** none

### CR-05-ACCESSORY-008 - WARNING: Three naming cases read their expected names from the production catalogue, and the reason given is false

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Build expected values independently") and Test data ("Do not compute test data with production code"); `.agents/skills/typescript-style/rules/comments.md`
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:630-640, 2354-2371, 2378-2398, 2404-2425`
**Issue:** `names every published service ...` expects `CATALOGUE.map((row) => row.displayName)`. The two `ConfiguredName` cases expect `rowOfKind(...).displayName`. The comment at `:2356-2357` says that the names are read from the catalogue "because a second list of fifteen names is exactly the drift this case exists to catch". The catalogue has seventeen rows, and the file already holds a second list, `PUBLISHED_SERVICES` (`:61-79`). A catalogue display-name edit passes these three cases. It is caught at `:1016-1030` through `PUBLISHED_SERVICES`. No plausible wrong implementation of this module passes because of the computed expectation, so the severity is WARNING.
**Fix:** Take the expected names from `PUBLISHED_SERVICES` (`descriptor.name`), or write the two names literally. Correct or remove the comment at `:2354-2357` and the `rowOfKind` comment at `:630-631`.
**Flags:** none

### CR-05-ACCESSORY-009 - WARNING: The source/test pair does not have the D-01 header

**Rule:** D-01; `.agents/skills/typescript-style/rules/modules-and-data.md` Files and modules (file order)
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:1-2`; `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:1`
**Issue:** The source has the SPDX line followed directly by the `@fileoverview` JSDoc, with no blank line and no copyright block. The test opens with `import assert ...` and has no SPDX line, copyright block or overview. The tracer reports both (`--headers --batch ACCESSORY`, exit 1).
**Fix:** In each file: `// SPDX-License-Identifier: MIT`, a blank line, `/** Copyright (c) 2026 Alessandro Colomba */` as a block, a blank line, the overview JSDoc (the test needs a new one), a blank line, then the imports. Put this in a header-only commit.
**Flags:** none

### CR-05-ACCESSORY-010 - WARNING: One `describe` wraps the whole owner of a single-entrypoint module

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("A single-entrypoint module keeps cases at the top level.")
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:789, 3456`
**Issue:** Lead S-05-02 is confirmed for this file. The module has one runtime export, `createBasementGuardianAccessory`. The other exports are types. All 157 cases sit under `describe('createBasementGuardianAccessory', ...)`, which is the shape fixed as CR-05-DECLARATIONS-014 and 015. The `STILL_REFUSED` constant (`:2552`) is declared inside that callback.
**Fix:** Remove the wrapper and dedent the cases in a style-only commit, last among this file's causes (protocol step 3). Move `STILL_REFUSED` to module scope beside `trustReportReadsOf`.
**Flags:** none

### CR-05-ACCESSORY-011 - WARNING: Source comments and JSDoc state things the code, its callers or pinned dependencies contradict

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:30-34, 83, 85-94, 99-100, 133-136, 141-143, 268-269, 470-474, 591-596, 626-628, 671-673, 694-697, 708-711, 886-888`
**Issue:** Each clause was checked against the code and its callers:

- `:30-34`: pushing an `Error` or throwing a `HapStatusError` would "erase exactly the retained last-valid values". It would not. Pinned HAP 2.2.2 `updateValue` stores the status and returns before it stores anything (`Characteristic.js:1629-1635`), and `serviceCatalogue.ts:1000-1003` says so ("preserve-and-mark does not become preserve-and-erase").
- `:83`: `services` is "Every service this accessory currently publishes". A new instance over a cached accessory whose family does not resolve answers `[]`, while `republishPublishedRows` pushes onto the restored services (`published` is assigned only at `:1060`).
- `:85-94`: `untrusted` is "Empty while the family registry keeps resolving ... to an implemented, fully validating family". A lost controller link (`:1570-1587`) and a monitoring withdrawal (`:3089-3102`) fill it while the family resolves and validates.
- `:99-100`: "a value the accessory does not receive here is a value HomeKit does not show". After an accepted write, HAP shows the requested value, which no `update()` delivered (D-037, `controls.ts:620-622`).
- `:133-136`: "The write path is the one place a deferral exists, and it exists because HAP requires it". The write path also arms the 30-second window (`controls.ts:607-612`), which D-037 requires and HAP does not.
- `:141-143`: "Homebridge writes the cache only when it is told the accessory changed". The installed Homebridge 2.4.0 also writes it on teardown and on every register or unregister (`node_modules/homebridge/dist/bridgeService.js:418, 439, 567-573`).
- `:268-269`: a scope-less violation "is diagnosable without deactivating anything". Nothing records it. `violatedScopesOf` drops it, no line is logged, `untrusted` leaves it out, and no other `src` module reads `violations`.
- `:470-474`: "no characteristic is pushed until the first `update()` arrives". `markMonitoring` before an update pushes onto restored services. The next clause, "a row still adds no service until it has a value it can vouch for", is false for the two `alwaysPublish` Switches, which `:2442-2458` and `:2617-2633` show added with `StatusActive` false.
- `:591-596`: `commandTransportReady` is read "from the same account-wide trust the rows publish from, so a row and a refused write cannot disagree". No row reads it. `controls.ts:98-101` says that a press can be refused for a missing route while the tile still shows a value, and `:2746-2776` does exactly that.
- `:626-628`: `publishRow` is "The one publish pass a service already on the accessory gets". On the resolved path, a service already present gets the inline pass at `:741-745`.
- `:671-673`: `bindRestoredControlRefusal` "hands the binder a callback that republishes nothing". It involves no binder. It passes `nothingToRepublish` straight to `clearRefusal` (`controls.ts:468-471`).
- `:694-697` (lead S-05-24 part 1): the handler "attaches to the service the row already published". `publishRows` binds the service that `ensureService` answers (`:732, 739`), which on a new accessory it has just added. The binding runs before this pass pushes any value (`:741-745`). `republishPublishedRows` never binds (see 002).
- `:708-711`: "A row that cannot vouch for its scope receives its `StatusActive` push and nothing else". A row withdrawn for `unreachable` still publishes its values (`isRowPublishable`, and `:3226-3245` publishes a flood with `StatusActive` false), and the name seed and the binder run for every row.
- `:886-888`: "The one path that publishes nothing is the unresolved family above". That branch is below (`:991-1016`), and it publishes `StatusActive` and the offline verdict onto every service already present.

**Fix:** Restate each clause as a present-tense fact the code supports, or remove it. Comment and JSDoc lines only, in a `docs(basementGuardian)` commit. The `:671-673` and `:694-697` edits should match the corrected `controls.ts:18-21` overview.
**Flags:** none

### CR-05-ACCESSORY-012 - WARNING: Source comments narrate earlier shapes of the code

**Rule:** `.agents/skills/typescript-style/rules/comments.md` Forbidden ("Narration of code that no longer exists")
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:567-570, 673, 919-925, 955-960`
**Issue:**

- `:567-570`: "A second copy is how the two came to disagree: the row was widened and this was not, so a press was refused ...".
- `:673`: "it is the one refusal path that never erased the marking".
- `:919-925`: "A request confirmed by a report the plugin then discarded stays pending ...", "`update()`'s ordering is not the defect and is left exactly as it is", "what was wrong was reconciliation reading through the gate".
- `:955-960`: "It was not provable until that member began withdrawing scopes of its own: replacing it with a constant left the whole suite green ...".

Each one describes a former defect or a former suite, not the current code.
**Fix:** Keep each rationale as a present-tense fact, for example at `:567-570`: "Reading the row's own rule keeps the write path and the tile from disagreeing." At `:922-925`: "Recomputing the withdrawal before reconciling is required, because the rows published below must reflect it." At `:955-960`: name the case and say what it pins.
**Flags:** none

### CR-05-ACCESSORY-013 - WARNING: Test comments narrate earlier shapes of the code and the suite

**Rule:** `.agents/skills/typescript-style/rules/comments.md` Forbidden ("Narration of code that no longer exists")
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:279, 2544-2548, 2781-2782, 2807-2808, 2843-2846, 2947-2950, 2988-2991, 3314-3316`
**Issue:** Lead S-05-06 is confirmed for the test. Each line records history:

- `:279`: "the cause the accessory named wrongly until the rule behind it existed".
- `:2546-2548`: "one press therefore erased that message from both controls at once".
- `:2781-2782`: "which is what this case asserted before the cause existed".
- `:2807-2808`: "the rule inserted above it".
- `:2843-2846`: "Before the two halves read one rule the write path sampled nothing at all here ...".
- `:2947-2950`: "reconciliation used to read the value through the trust gate ...".
- `:2988-2991`: "which the shared publishing rule already closed", "once both halves read one rule", "the shape `WR-06` was reported against".
- `:3314-3316`: "Replacing that member with a constant left the whole suite green before the withdrawal above existed".

**Fix:** Restate each as what the case pins today. For example at `:2945-2950`: "A request the device confirmed on the snapshot that withdrew the control's scope still resolves, because reconciliation reads the decoded value rather than the vouched one." Comment lines only.
**Flags:** none

### CR-05-ACCESSORY-014 - WARNING: Test comments state things the code under test contradicts

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does)
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:47-50, 159-161, 262-264, 282-285, 352-353, 410-412, 1768-1770, 1824-1827, 2544-2546`
**Issue:**

- `:48-50`: the two backup battery rows "differ only here", meaning only in `serviceUuid`. Their `name`s differ too (`:70-71`).
- `:159-161`: `ACCESSORY_MODULES` is "Every module under `src/accessories/`". It lists four of the ten.
- `:262-264`: the halt is "the shape `haltMonitoring` answers and the only shape this member ever arrives in". No `haltMonitoring` exists. The halt is `haltOnTerminalAuthFailure` (`src/runtime/accountRuntime.ts:746-771`). The pushed trust spreads `health.trustNow()` (`:623-636`), so `restDegraded` can be `true` beside `credentialsRejected`.
- `:282-285`: "A drift between the two numbers ... fails the case on a count of zero". Only `:2956-2986` asserts the count. `:2993-3028` would collect nothing and still pass.
- `:352-353`: "The accessory takes the port and never reaches for it". The accessory hands the port to the binder (`basementGuardian.ts:661`), which arms timers on every press. `:2533` asserts `calls: ['setTimeout 0']`.
- `:410-412`: "A handler whose request was already resolved returns on its own". Only the window handler checks (`controls.ts:533-536`). The clearing push always republishes and pushes (`controls.ts:542-546`).
- `:1768-1770`: "This case is the one that pins the whole rendered line". `:1753`, `:1877` and `:1901` pin the same line.
- `:1824-1827`: "This is the case that catches a join collapsing to the kind alone ... one of these names goes missing or doubles". A kind-only join names both rows, which is what this case expects, so the case passes. The filter runs over the catalogue, so no name can double. `:1848-1873` is the case that catches it, as its own comment says.
- `:2544-2546`: "Every way a control request can end arms a push that returns a refused characteristic to a normal read". A confirmed request arms nothing, and the window's expiry calls `republish` without a push (see 001).

**Fix:** Correct each clause. Comment lines only.
**Flags:** none

### CR-05-ACCESSORY-015 - WARNING: A test comment cites a planning artifact

**Rule:** `.agents/skills/typescript-style/rules/comments.md` Forbidden ("Any other phrasing whose only purpose is to record which planning artifact authored the line"); precedent CR-05-RECORDS-022
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:167-169`
**Issue:** `(03-CONTEXT D-05)` names a phase planning document, not a stable decision ID.
**Fix:** Remove `03-CONTEXT D-05`, or replace it with the stable decision ID it refers to, if one exists. `D-10` stays.
**Flags:** none

### CR-05-ACCESSORY-016 - WARNING: Seven inline `as unknown as` casts sit outside the one commented widening

**Rule:** `.agents/skills/typescript-style/rules/types.md` ("`as` and `!` only with an obvious or commented reason"); `.agents/skills/typescript-unit-tests/rules/cases.md` Types and isolation; D-11
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:480, 646, 676, 746, 813, 1278, 1279` (the widening is at 176-178)
**Issue:** `HAP_NAMESPACE` (`:178`) carries the reason D-11 requires (`:176-177`). The other seven casts do not use a helper. `:480` and `:746` cast `FakeAccessory` to `PlatformAccessory`, and `:813` casts `{ context: null }`. `:646`, `:676`, `:1278` and `:1279` cast a catalogue `serviceClass` to `FakeServiceClass`. Only `:646` (comment `:644-645`) and `:813` (comment `:811-812`) give a reason at the site. One finding covers all seven.
**Fix:** Next to `HAP_NAMESPACE`, add commented helpers `asPlatformAccessory(accessory: FakeAccessory)`, `asStandInServiceClass(serviceClass)` and `contextlessAccessory()`, and replace the seven casts. Change no production type.
**Flags:** D-11

### CR-05-ACCESSORY-017 - WARNING: The source-text cases read three other modules, and the read-handler loop repeats a gate with a weaker pattern

**Rule:** `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` ("Do not ... test one source module from another module's test"; "Do not test what a gate already enforces"); `.agents/skills/typescript-style/rules/comments.md`
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:159-170, 315-319, 760-766, 3401-3455`
**Issue:** Lead S-05-17 is confirmed for this file:

- `ACCESSORY_MODULES` and `MODULES_ERRORING_NO_CHARACTERISTIC` make this owner read `customCharacteristics.ts`, `customServices.ts` and `serviceCatalogue.ts`. That includes the `publishPersistentFailure` location case (`:3415-3425`), which belongs to `serviceCatalogue`.
- `${module} registers no get handler` (`:3428-3434`) repeats `accessoryReadPathScope.test.ts:190-204`. That gate scans every `src` module above a floor of 40, and matches four spellings including `.on(CharacteristicEventTypes.GET`. This case checks four files with two spellings.
- `${module} registers no set handler, so a controller write never reaches the device` (`:3440-3446`) and its comment (`:3436-3439`: "`ConfiguredName` is the one paired-write characteristic this plugin publishes ... there is none") are false for this module. `On` on both Switches is paired-write (`CharacteristicDefinitions.js:2139`), and `basementGuardian.ts:698-706` binds a set handler through `controls.bind`, which sends commands.
- The `uuid.generate` substring check (`:3448-3454`) misses `const { generate } = hap.uuid`.

**Fix:** Delete the get-handler loop, because the gate holds it. Move the cross-module `HapStatusError` and identifier checks to the GATES batch (a gate under D-15, or the existing `hapImportScope` gate) or to each module's own test. Keep the D-05 rule ("`HapStatusError` thrown only by the binder and pushed only by `publishPersistentFailure`") pinned, and record in the ledger where it now lives (P-05-03). Retitle or drop the set-handler case for `basementGuardian.ts`.
**Flags:** none

### CR-05-ACCESSORY-018 - WARNING: A source-text case pins the options member list, and its helper says a type cannot be asked

**Rule:** `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` What not to test ("wrong: pins the member list so a new member 'cannot be added silently'"); `.agents/skills/typescript-style/rules/comments.md`
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:779-787, 2338-2344`
**Issue:** `declares exactly the collaborators the accessory takes by injection` parses the interface out of the source and compares all nine member names. That is the book's "wrong" example. The helper comment says "a type cannot be asked what it refuses to carry". For the named member it can: `// @ts-expect-error` over `void ({ ...validOptions, api } satisfies BasementGuardianAccessoryOptions)` fails on the excess property.
**Fix:** Remove the member-list case. Replace the `api` part with the type-level negative above, in a `boundaries.md` style `satisfies` check. Keep or reword `declares no injected option typed API` (`:2346-2352`), which states a boundary that no plain type check expresses, and correct the helper comment.
**Flags:** none

### CR-05-ACCESSORY-019 - WARNING: Three cases test the test's own deferral helpers, not the accessory

**Rule:** `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` ("Test modules and test support ... need no meta-tests"; "the case cannot fail and is a maintenance cost"); `.agents/skills/typescript-unit-tests/rules/cases.md` (titles state public behavior)
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:419-424, 2080-2131`
**Issue:** `the timer port layer catches ...`, `the global spy layer catches ...` and `the synchronous-visibility layer catches ...` call `deferredTransition`, a test-private helper, and assert what the recorder, the global spy or a read sees. The deferred `update` is never run (it is cleared or never scheduled). No change to `basementGuardian.ts` can fail them. The titles name test layers, not module behavior.
**Fix:** Remove the three cases and `deferredTransition`, with a ledger reason. The absence-of-deferral cases (`:2027-2078`, `:2185-2212`) keep their protection.
**Flags:** none

### CR-05-ACCESSORY-020 - WARNING: Eleven cases assert a rejection under `// act`, and two `// assert` markers carry prose

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure; precedent CR-05-CONTROLS-017
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2520-2528, 2560-2568, 2601-2609, 2661-2669, 2726-2735, 2754-2765, 2790-2799, 2817-2826, 2871-2882, 2916-2925, 3075-3083; 2828-2829, 2927-2928`
**Issue:** Each listed `// act` holds an `assert.rejects(...)` whose callback asserts the status. That mixes the act and assert phases. Where other statements follow in the same phase, it is not one `// act & assert` expression either. `// assert. A payload carrying ...` and `// assert. A lost link ...` are not the lowercase phase marker the rule names.
**Fix:** Capture the rejection under `// act` (for example `const thrown = await rejectionOf(() => ...)`) and compare it in the `// assert` record with the other values. Or, where the rejection is the only act and assert, use `// act & assert`. Move the explanations to a comment above `// assert`.
**Flags:** none

### CR-05-ACCESSORY-021 - WARNING: Concise arrow bodies return values that nothing reads

**Rule:** `.agents/skills/typescript-style/rules/functions.md` ("Concise arrow body only when the return value is used; a discarded value gets a block body or `void`"); precedent CR-05-CONTROLS-028
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:195-196, 200, 202, 208-209, 216-217, 220, 322-329, 337-343, 806, 816, 824, 832, 1398`
**Issue:** `update: () => undefined` and `markMonitoring: () => undefined` implement `void` members. The `silentLog` and `recordingLog` callables and the `debug`/`error`/`info`/`log`/`success` members implement `void` logging members. The `assert.throws(() => accessoryWith(...), Error)` callbacks return an accessory that `assert.throws` discards. `:1149-1151` already uses the block form.
**Fix:** Use block bodies with a short `//` comment where empty, and `() => { accessoryWith(accessory, {}); }` in the throws callbacks.
**Flags:** none

### CR-05-ACCESSORY-022 - WARNING: Two expected arrays are built with the `Array` constructor

**Rule:** `.agents/skills/typescript-style/rules/modules-and-data.md` ("Arrays built with `[]`"); `.agents/skills/typescript-style/rules/review.md` quick scan (`Array(`)
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:1388, 1461`
**Issue:** `Array<unknown>(threshold - 1).fill(CONTACT_DETECTED)` and `Array<unknown>(7).fill(CONTACT_DETECTED)` call the constructor.
**Fix:** `Array.from({ length: threshold - 1 }, () => CONTACT_DETECTED)`. Or carry the expected readings on typed rows (see 023).
**Flags:** none

### CR-05-ACCESSORY-023 - WARNING: A data-driven loop computes its expectation with a conditional

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Data-driven cases ("Do not put a conditional in the loop body"; typed rows carrying the outcome)
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:1047-1066`
**Issue:** `for (const mainsPresent of [true, false])` picks the expected adapter state with `mainsPresent ? CONTACT_DETECTED : CONTACT_NOT_DETECTED` inside the case.
**Fix:** Loop over typed rows `{ mainsPresent, adapter }`: `{ mainsPresent: true, adapter: CONTACT_DETECTED }` and `{ mainsPresent: false, adapter: CONTACT_NOT_DETECTED }`.
**Flags:** none

### CR-05-ACCESSORY-024 - WARNING: Command issuing and the persist request are asserted through hand-built recorders

**Rule:** `.agents/skills/typescript-unit-tests/rules/test-doubles.md` Mocks ("`strong-mock`, only when the interaction is public behavior: ... issuing a command"); precedent CR-05-CONTROLS-023
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:378-391, 393-408, 2591-2598` (asserted at, among others, 2533, 2572, 2586, 2614, 2672, 2686, 2714, 2738, 2768-2775, 2278-2281, 2302-2308, 2332-2335)
**Issue:** `recordingCommands` and the inline vendor-refusal recorder push sends into an array, and `recordingStore` counts `persist` calls. The sends and the asks are the promised interactions ("sends nothing", "asks for one write"), so the book gives them to `strong-mock`.
**Fix:** Use `mock<CommandPort>({ exactParams: true, name: 'commands' })` with `when(() => commands.send(DEVICE_ID, 'self-test', true)).thenResolve({ accepted: true })` and `verify(commands)` where a send is promised. A mock with no expectations covers "sends nothing". For `persist`, use the same pattern with exact counts. Or record a maintainer decision to keep the recorders, as for CONTROLS.
**Flags:** none

### CR-05-ACCESSORY-025 - WARNING: `statusActiveReadOf` relies on the stand-in's synchronous read

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Await every promise"); D-16; precedents CR-05-CONTROLS-018 and CR-05-RECORDS-029
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:692-702` (used at 707-713)
**Issue:** The helper wraps `handleGetRequest()` in a synchronous `try`/`catch`. It catches a stored status only because the stand-in throws synchronously (`features/lib/hap.ts:341-345`). Pinned HAP 2.2.2 `handleGetRequest` is `async` (`Characteristic.js:1683`), so with real HAP the helper would return a pending Promise and never say `refused`.
**Fix:** Make the helper `async`, `await` the read inside the `try`, and `await` it in `trustReportReadsOf` and its callers. The stand-in side is lead S-05-23 (GATES).
**Flags:** D-16

### CR-05-ACCESSORY-026 - WARNING: Sixteen test titles carry review-finding or phase-local decision IDs

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("A durable requirement ID may appear; plan, phase, or ticket references may not"); `.agents/skills/typescript-style/rules/comments.md` ("Test titles state behavior and carry no ticket references")
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2442, 2460, 2472, 2554, 2575, 2589, 2617, 2848, 2909, 2956, 2993, 3034, 3254, 3276, 3295, 3317`
**Issue:** `CR-02`, `WR-02`, `WR-03`, `WR-04` and `WR-06` are review-finding numbers, which restart in every review. `D-02` and `D-03` are two-digit phase-local decision IDs, not durable requirement IDs. The requirement IDs `CTRL-03`, `CTRL-04` and `RES-04` may stay.
**Fix:** Remove the prefixes from the titles, and keep the IDs in the comments above the cases. `controls.ts:109-111` quotes the `WR-02` title, so that JSDoc needs the same edit as a bounded consumer task.
**Flags:** D-06

### CR-05-ACCESSORY-027 - WARNING: Five timer doubles are named after their kind, and a user-name constant stands in for a `StatusActive` value

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Naming values ("Test double: the production role only ... Do not add `mock`, `fake`, or `stub` to the name"; "Name values after their production role"); `.agents/skills/typescript-unit-tests/rules/review.md` ("a double named after its kind")
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2510, 2858, 2963, 3000, 3041; 155-157, 3340`
**Issue:** `const recording: Timers` names the double after what it is, not its role (`timers`). `USER_RENAME` is documented as "A name a user typed" (`:155-156`), but `:3340` pushes it into `StatusActive` as a sentinel.
**Fix:** Name the wrapper `timers` and the inner recorder `recordedTimers` (or inline the recorder). Use a named sentinel for `:3340`, for example `const UNREPUBLISHED_STATUS = 'left by the case'`.
**Flags:** none

### CR-05-ACCESSORY-028 - WARNING: `SnapshotSource` is exported and no other module uses it

**Rule:** `.agents/skills/typescript-style/rules/modules-and-data.md` ("Every export is used outside its module")
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:67-77`
**Issue:** `fallow dead-code --trace src/accessories/basementGuardian.ts:SnapshotSource` reports `UNUSED SnapshotSource ... No internal references`. `src/platform.ts:189, 275, 347` passes the string literals, and no file imports the alias.
**Fix:** Either import the alias where the platform names a source, which is a Phase 6 file (bounded consumer task), or stop exporting it and keep the JSDoc on the module-local alias. Run the D-06 impact commands first.
**Flags:** D-06

### CR-05-ACCESSORY-029 - WARNING: Two throw cases accept any `Error`, so a guard that has been dropped still passes

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Assert errors by class and structured fields")
**Location:** `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:801-817, 1141-1152`
**Issue:** `assert.throws(..., Error)` also matches `TypeError`. Removing the identity guard (`basementGuardian.ts:243-245`) lets `{ context: null }` and a missing `device` throw a `TypeError` from the property read. Removing the AccessoryInformation guard (`:452-454`) throws a `TypeError` from `.setCharacteristic` on `undefined`. All three cases still pass, and the owner-facing diagnostic is lost. The titled behavior ("throws") still holds, and a guard that does not throw fails these cases, so the severity is WARNING.
**Fix:** Assert the class exactly and the whole message, for example `(error: unknown) => { assert.ok(error instanceof Error && error.constructor === Error); assert.strictEqual(error.message, 'the accessory context carries no device identity; ...'); return true; }`. Or give the module a named `Error` subclass, which needs a coordinator decision.
**Flags:** none

## Seed and lead dispositions

| Lead | Disposition | Evidence |
| --- | --- | --- |
| S-05-02 (ACCESSORY part) | **Confirmed as CR-05-ACCESSORY-010** (WARNING) | One runtime export (`createBasementGuardianAccessory`). The other exports (`SnapshotSource`, `BasementGuardianAccessory`, `BasementGuardianAccessoryOptions`) are types. `cases.md` Case structure: "A single-entrypoint module keeps cases at the top level." The wrapper is at `:789-3456`. |
| S-05-06 (ACCESSORY part) | **Confirmed as CR-05-ACCESSORY-013** (test) | `:2947` "reconciliation used to read the value", `:2843-2846`, and six more history clauses. The same rule found four source narrations, filed as the new cause CR-05-ACCESSORY-012. |
| S-05-17 (ACCESSORY part) | **Confirmed as CR-05-ACCESSORY-017** | The get-handler loop is covered by `accessoryReadPathScope.test.ts:190-204` with a stronger pattern and an src-wide floor. The `HapStatusError` and `uuid.generate` cases read three modules that are not this pair's source (pairing rule). The set-handler title and comment are false for this module. The member-list source case is the separate cause CR-05-ACCESSORY-018. |
| S-05-20 | **Rejected** | No book rule forbids a documented default repeated beside its consumer, and the comment at `:177-179` is true. `src/config.ts:27-33` resolves `documentedDefault: 2`. The only production caller always passes the resolved value (`src/platform.ts:147`), as does the harness (`features/support/world.ts:654, 729`), so the default is reached only by unit cases (`:1402-1417`). Making the option required is a D-06 change to an exported interface whose consumers belong to Phases 6 and 7. Recorded under Out-of-scope observations. |
| S-05-24 | **Part (1) confirmed in CR-05-ACCESSORY-011; part (2) confirmed as CR-05-ACCESSORY-001** (BLOCKER, D-04) | (1) `:694-697` against `:732, 739, 741-745`. (2) Probe P1 to P3 (`probe/probe.mjs`): after the window closes, `On` value and read are `true` for the credential halt, the controller-link withdrawal and the undecoded field. Control P0 restores `false`. |
| S-05-25 | **Confirmed as CR-05-ACCESSORY-002** (BLOCKER, D-04) for the unresolved family | Probe P4: transport ready, unresolved `update()`, press: `-70412` with the transport cause. The live binder would name `the plugin has no fresh state for it`. The missing-device and no-snapshot variants live in `src/platform.ts:296-302, 380-391` (Phase 6) and are recorded under Out-of-scope observations. |

## Answers to the dispatch's review questions

- **StatusActive withdrawn on a broader scope than the untrusted one:** caught on both publish loops by `:865-885` (unresolved, offline row stays `true`), `:1200-1219`, `:1221-1237`, `:1609-1624` and `:3203-3220`.
- **Blanked last valid value:** caught by `:922-942`, `:1171-1198`, `:1239-1261`, `:1664-1682`, `:2218-2238` and the whole-surface comparison at `:3295-3309`.
- **A value published for a capability with a pending request:** not caught (CR-05-ACCESSORY-004).
- **StatusFault set for a degraded scope:** caught on the update path by `:1239-1261` (`primaryStatus`) and on the shared `publishRow` path by `:3295-3309`. No narrower plausible variant was found.
- **Pending-window withholding cases:** in this owner, none. The plumbing through `projectionInputOf` is unpinned (004).
- **Seven inline casts and the `HAP_NAMESPACE` reason:** the widening at `:176-178` carries the reason. The seven casts do not meet D-11 (016).
- **D-01:** neither file conforms (009).
- **Comment claims:** checked clause by clause. False claims are in 011, 014, 007, 008, 017 and 018. Narration is in 012 and 013.
- **Production bug candidates:** 001, 002 and 003, each probed.

## Candidates considered and not filed

- **`publishRows` repeats `publishRow`'s push loop (`:741-745` against `:630-634`).** The resolved path projects once to decide `ensureService` and reuses the projection, so calling `publishRow` would project twice. No book rule is broken. The comment claim it contradicts is in 011.
- **The 590-line factory closure and the private `isRecord` that repeats `serviceCatalogue`'s.** No book rule sets a length. The helper is module-private.
- **`ReadonlyMap`/`ReadonlySet` annotations on `new` expressions (`:195, 209, 227-229`).** The annotation narrows to the read-only view, so it is not the redundant annotation `types.md` forbids.
- **Substring checks at `:1819, 1841-1842, 1868-1869, 1916, 1931`.** Each title is about one name or one absence, and the whole line is pinned by `:1744, 1765, 1782, 1914`.
- **`declares no injected option typed API` (`:2346-2352`).** No plain type check states "no member of type `API`" without a mapped type. Kept, see 018.
- **Module-level `HAP` and `CATALOGUE`.** Both are stateless namespaces or rows. Each service lives on its own case's accessory.
- **The unresolved branch never reconciles.** A request pending when the profile stops resolving expires with "never confirmed by the device". This is rare, needs a profile change inside a 30-second window, and has the same remedy family as 001. Noted for the 001 fixer.
- **`movedSince` reduces moved characteristics to their display names in a `Set` (`:3241-3243, 3306-3307`).** It hides which service moved. I found no plausible wrong implementation that passes, because the per-service `StatusActive` is pinned through the shared `republishPublishedRows` by `:865-885`.
- **`services` answering `[]` for a new instance over an unresolved cached accessory.** The JSDoc claim is in 011. A suppressed service removed on that path reaches disk only on the next Homebridge save, because the platform's change comparison (`src/platform.ts:259-289`) sees `[]` before and after. Homebridge saves on teardown, so this is not filed as a bug.
- **Log assertions in a module whose job is not logging (`test-doubles.md`).** D-05 pins this module's exact lines. Same position as CR-05-RECORDS-006.
- **`:1146` `accessoryInformation ?? serviceOf(accessory, 'Sump Mains Power')`.** An odd fallback that avoids `!`. The fallback cannot run (`AccessoryInformation` always exists on the stand-in), and the case's assertion is unaffected.
- **Type-level `satisfies` and `@ts-expect-error` checks at `:191-220`.** Each negative removes or mistypes exactly one member, which pins requiredness. That is allowed.

## Header inspection

| File | Result |
| --- | --- |
| `src/accessories/basementGuardian.ts` | Gap: SPDX at line 1, `@fileoverview` JSDoc at line 2 with no blank line, and no copyright block (CR-05-ACCESSORY-009). Tracer: `HEADER_VIOLATION src/accessories/basementGuardian.ts: 2 expected an empty line after the SPDX line`. |
| `test/accessories/basementGuardian.test.ts` | Gap: opens with imports, and has no SPDX line, copyright block or overview (CR-05-ACCESSORY-009). Tracer: `HEADER_VIOLATION test/accessories/basementGuardian.test.ts: 1 expected "// SPDX-License-Identifier: MIT"`. |

## Toolchain evidence

All commands ran in the worktree at `9cb164b1299249c2d2083ea81677c83e28e66916`, with `node --version` = `v26.12.0` and `npm --version` = `11.20.0`. The run started at 2026-10-18T10:37:14Z and ended at 2026-10-18T10:47:55Z. Raw output is in the session scratch directory.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | Both `tsc --noEmit` passes (src and test projects) are clean. |
| `node_modules/.bin/eslint src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts --max-warnings=0` | 0 | No output. Run without `--cache`, so the result is fresh. |
| `npm run build:test` | 0 | Clean compile to `dist-test`. |
| `node --test dist-test/test/accessories/basementGuardian.test.js` | 0 | tests 157, suites 1, pass 157, fail 0, cancelled 0, skipped 0, todo 0. |
| `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | 0 | The selector prints nothing on success (100% lines, functions and branches for the pair). |
| `node_modules/.bin/fallow guard src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | 0 | No rule violation. |
| `node_modules/.bin/fallow dead-code --trace src/accessories/basementGuardian.ts:SnapshotSource` | 0 | `UNUSED SnapshotSource` (CR-05-ACCESSORY-028). |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch ACCESSORY` | 1 | The two header violations above (CR-05-ACCESSORY-009). An expected RED, not a toolchain failure. |
| `node probe/probe.mjs <repo>` (session scratch) | 0 | P0 to P4 as quoted in 001 and 002. It imports only `dist-test/` modules and writes nothing. |
| `node probe/probe2.mjs <repo>` (session scratch) | 0 | `{"before":"1.0","after":"2.0","untrusted":["self-test invalid"],"warnings":["Degraded account-1_serial-1: the profile or payload stopped validating. AccessoryInformation keeps its last valid values until a family-valid update recovers it."]}` (003). |

No required check failed, so no toolchain finding is filed.

## Out-of-scope observations

- `src/accessories/controls.ts:533-540` (`expire`, CONTROLS, closed). The window's expiry pushes no `On`. Together with this module's `republish` guard and row withholding, that produces 001. The minimum fix probably edits this function as a bounded D-06 consumer task. `controls.ts:445-447` documents the 002 behavior as intended and needs the matching edit if 002 is accepted.
- `src/platform.ts:296-302, 380-391` (Phase 6). A cached accessory whose device is missing from the inventory, or has no stored snapshot, never gets an `update()`. Its restored refusal keeps naming the transport cause while the transport is ready (the platform part of S-05-25).
- `src/config.ts:27-33` (Phase 6). `documentedDefault: 2` is the source that `basementGuardian.ts:177-180` repeats (S-05-20). Making `offlineConfirmationPollCount` required on the accessory options would remove the copy. It is a D-06 change whose consumers are in Phases 6 and 7.
- `features/lib/hap.ts:341-345` (Phase 7 under D-12). The stand-in's synchronous `handleGetRequest` is what lets 025's helper work. Lead S-05-23 (GATES).
- `test/accessories/accessoryReadPathScope.test.ts:72-76` (GATES). Its comment says "the production tree forty". That is lead S-05-09 and is not re-judged here.

## Coordinator triage

Triaged 2026-10-18 by the coordinator. All 29 findings are accepted as `open`; none is rejected.
Counts: opening 0, fixed 0, rejected 0, new 29, reopened 0, closing 29 (7 BLOCKER, 22 WARNING).

- **Owning plan.** 05-06 takes the causes located in `src/accessories/basementGuardian.ts` and the
  pair header: 001, 002, 003, 009, 011, 012 and 028. 05-07 takes the causes located in the test:
  004 to 008, 010, 013 to 027 and 029.
- **CR-05-ACCESSORY-001:** `open`, BLOCKER, a genuine production bug candidate (D-04). After an
  unconfirmed press expires under a credential halt, a doubtful withdrawal or an undecoded field,
  HAP keeps serving the requested `true`, against D-037. The reviewer's minimal fix edits
  `src/accessories/controls.ts` (the closed CONTROLS batch). The coordinator asked the maintainer
  whether to fix it now or defer it. The maintainer paused the session before answering, so the
  fix shape waits for that decision.
- **CR-05-ACCESSORY-002 and 003:** `open`, BLOCKER, classified as genuine production bugs (D-04),
  each with a fix inside `src/accessories/basementGuardian.ts`.
  - 002: an unresolved family keeps a restored refusal that names the transport while it is
    ready. Binding the controls in the republish path lets the binder name the true cause, and no
    command can be sent from that state. The matching JSDoc at `controls.ts:445-447` is a
    comment-only cross-batch edit.
  - 003: the degradation line claims AccessoryInformation kept its values in an update that
    refreshed it. The fix states only what holds on both branches.
  - Both follow the D-04 sequence with `05-BASEMENT-GUARDIAN-RED-EVIDENCE.json`.
- **CR-05-ACCESSORY-004 to 029:** `open`, as reported. 016 carries D-11, 025 carries D-16, and 026
  and 028 carry D-06.
- **Leads:**
  - S-05-02 is confirmed as 010.
  - S-05-06 is confirmed as 013 (test), with the source narration filed as 012.
  - S-05-17 is confirmed as 017.
  - S-05-20 is rejected on the reviewer's evidence: no rule forbids the repeated default, its
    comment is true, and the only production caller always passes the value.
  - S-05-24 is confirmed, part 1 inside 011 and part 2 as 001.
  - S-05-25 is confirmed as 002 for the unresolved family. The missing-device and no-snapshot
    variants live in `src/platform.ts` (Phase 6) and are recorded as out of scope.
- **Maintainer decision (2026-10-18, on resume):** fix CR-05-ACCESSORY-001 now. The binder keeps the
  value HAP served before an accepted press, and expiry pushes the reported value or, when none can
  be vouched for, that pre-press value. This is a bounded edit to `src/accessories/controls.ts`
  (closed CONTROLS batch). Because the tracer allows one inventory row per path, the ACCESSORY
  correction rounds read that hunk as a reference outside `files_reviewed_list`. It follows the D-04
  sequence with `05-BASEMENT-GUARDIAN-RED-EVIDENCE.json`.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-ACCESSORY-009 | `src/accessories/basementGuardian.ts`, `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` exit 0; `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch ACCESSORY` exit 0 (`ACCESSORIES_HEADERS_OK files=2`); `npm run build:test` exit 0; `node --test dist-test/test/accessories/basementGuardian.test.js` exit 0 (157 tests, 157 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` exit 0 (pair at 100%); `node_modules/.bin/fallow audit --base 9cb164b1299249c2d2083ea81677c83e28e66916 --format json --quiet --explain` exit 0, verdict pass; `SKIP=npm-check pre-commit run --files` on the three named paths exit 0 | n/a (WARNING) | Header-only: source overview and code unchanged; test gains an overview above unchanged imports. The first audit attempt exited 2 because the sandbox denied its temporary Git worktree; the permitted rerun exited 0. |
| CR-05-ACCESSORY-011 | `src/accessories/basementGuardian.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/basementGuardian.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/basementGuardian.test.js` exit 0 (157 tests, 157 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` exit 0 (pair at 100%); `node_modules/.bin/fallow audit --base 9cb164b1299249c2d2083ea81677c83e28e66916 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | Corrected false claims about stored HAP values, published descriptors, monitoring trust, writes, persistence, scope withdrawal, publication, control binding and the unresolved-family path. Comment and JSDoc lines only. |
| CR-05-ACCESSORY-012 | `src/accessories/basementGuardian.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/basementGuardian.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/basementGuardian.test.js` exit 0 (157 tests, 157 pass, 0 fail); `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` exit 0 (pair at 100%); `node_modules/.bin/fallow audit --base 9cb164b1299249c2d2083ea81677c83e28e66916 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | Replaced four passages about former defects and former suite behavior with present-tense rules for control publication, refusal clearing, reconciliation and monitoring trust. Comment lines only. |
| CR-05-ACCESSORY-028 | `src/accessories/basementGuardian.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: D-06 complete `fallow dead-code --type-aware --symbol-impact` for `SnapshotSource` with `tsconfig.json` exit 0 and `tsconfig.test.json` exit 0 (no consumers); for `BasementGuardianAccessory` with both projects exit 0 (complete; production consumer `src/platform.ts`; test consumers `features/support/world.ts`, `src/platform.ts`, `test/accessories/basementGuardian.test.ts`, `test/platform.test.ts`); `fallow guard src/accessories/basementGuardian.ts` exit 0; `npm run build:test` exit 0; accessory owner exit 0 (157 tests, 0 failures); platform owner exit 0 (70 tests, 0 failures); isolated pair coverage exit 0 (100%); `npm run test:unit` exit 0; `npx cucumber-js` exit 0 (104 scenarios, 1156 steps); `fallow audit --base 9cb164b1299249c2d2083ea81677c83e28e66916 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | Kept the documented `SnapshotSource` alias local for the implementation and placed its equivalent `'poll' | 'live'` union in the exported interface. The first two sandboxed platform-owner runs exited 1 with `EMFILE: too many open files, watch`; the permitted host-resource run exited 0. |
| CR-05-ACCESSORY-002 | `src/accessories/basementGuardian.ts`, `test/accessories/basementGuardian.test.ts`, `src/accessories/controls.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: fallow guard on the four paths exit 0; `npm run build:test` exit 0; named GREEN regression exit 0 (1 test); accessory owner exit 0 (158 tests); accessory pair exit 0 (100%); controls owner exit 0 (105 tests); controls pair exit 0 (100%); platform owner exit 0 (70 tests, host-resource rerun); `npm run test:unit` exit 0 (host-resource rerun); `npx cucumber-js` exit 0 (104 scenarios, 1156 steps, host-resource rerun); fallow audit against batch base exit 0, verdict pass | Optional projection control for already-open 004: the first empty-set mutation failed to compile (exit 2, unused parameter); a compiling empty-set mutation built (exit 0) and the 158 accessory tests still passed (exit 0). Restored the exact post-fix source blob `678b67e7c0b67f910a8c29b01e80616058843e6a`; rebuild and 158 owner tests exited 0. Finding 004 remains open for 05-07. | Bound each existing control row during republish, so a cached Switch uses the live binder's current refusal cause. Updated only the matching controls JSDoc. Sandboxed platform owner and unit runs exited 1 due watcher or npm-cache limits; sandboxed Cucumber failed to bind a local server and was interrupted (exit 130). Their host-resource reruns exited 0. |
| CR-05-ACCESSORY-003 | `src/accessories/basementGuardian.ts`, `test/accessories/basementGuardian.test.ts`, `features/step_definitions/accessory.steps.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: fallow guard on the four paths exit 0; `npm run build:test` exit 0; named GREEN regression exit 0 (1 test); accessory owner exit 0 (159 tests); accessory pair exit 0 (100%); `CI=1 npm run test:unit` exit 0 (1640 tests); `npx cucumber-js` and `npm run test:cucumber` exit 0 (104 scenarios, 1156 steps each); `npx cucumber-js --dry-run --format usage` exit 0 (no `UNUSED` definitions); fallow audit against batch base `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass; `SKIP=npm-check pre-commit run --files` on the four paths exit 0 on clean rerun | RED evidence committed at `e8af5d2` and classified `RED_EVIDENCE_OK`; the active regression proves that valid firmware metadata advances from 1.0 to 2.0 while an invalid telemetry field degrades service trust. | Changed only the warning's false AccessoryInformation clause to describe affected services. Updated the shared Cucumber step expectation under the bounded Phase 7 consumer amendment `c3c0f28`; no feature scenario changed. Initial pre-commit exit 1 was Prettier formatting the new test case; its rerun passed. |
| CR-05-ACCESSORY-001 | `src/accessories/controls.ts`, `test/accessories/basementGuardian.test.ts`, `test/accessories/controls.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: fallow guard on four paths exit 0; `npm run build:test` exit 0; named GREEN regression exit 0 (1 test covering three paths); accessory owner exit 0 (160 tests); accessory pair exit 0 (100%); controls owner exit 0 (106 tests); controls pair exit 0 (100%); platform owner host-resource rerun exit 0 (70 tests); `CI=1 npm run test:unit` exit 0 (1642 tests); `npm run test:cucumber` exit 0 (104 scenarios, 1156 steps); fallow audit against batch base `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | RED evidence committed at `41b2ba7` with production blobs unchanged. The first controls pair run exited 1 at BRH/BRF 55/56 because its owner lacked the undefined-reported expiry branch. The direct controls test was authorized by coverage amendment `fdea7de`; both pairs then passed at 100%. | The binder captures HAP's pre-press `On` value for an accepted write. At expiry it republishes, then pushes the current report or that captured value, keeping requested `true` from posing as device state when republish withholds `On`. Existing warning, status, trust and command behavior remain. The initial sandboxed platform owner run exited 1 with `EMFILE: too many open files, watch`; its host-resource rerun passed. The first commit hook exited 1 on three linted void-expression arrows in the new accessory test; braces fixed them before all changed-input checks were repeated. |
| CR-05-ACCESSORY-016 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard on both paths exit 0; `npm run build:test` exit 0; accessory owner exit 0 (160 tests, 160 pass); accessory pair exit 0 (100%); Fallow audit against batch base `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | Kept all four necessary stand-in widenings in one commented block. Replaced seven inline casts with helper calls; the null-context test still passes null and all assertions and titles are unchanged. |
| CR-05-ACCESSORY-013 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; accessory owner exit 0 (160 tests, 160 pass); accessory pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | Replaced eight passages about earlier code or suite behavior with present-tense descriptions of the refusal, clearing push, reconciliation and trust checks. Comment lines only; assertions and titles unchanged. |
| CR-05-ACCESSORY-014 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; accessory owner exit 0 (160 tests, 160 pass); accessory pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | Corrected nine test comments about service descriptors, module scope, credential trust, timer selection, command timers, deferred callbacks, warning coverage, shared kinds and refusal clearing. Comment lines only; assertions and titles unchanged. |
| CR-05-ACCESSORY-015 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; accessory owner exit 0 (160 tests, 160 pass); accessory pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | Removed the planning-artifact citation from the source-idiom test comment. Kept the stable `D-10` decision ID; assertions and titles unchanged. |
| CR-05-ACCESSORY-004 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; named case GREEN exit 0 (1 test); accessory owner exit 0 (161 tests, 161 pass); accessory pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | Wrong behavior: `projectionInputOf` hands rows an empty pending set. A literal empty set first made `build:test` exit 2 because the parameter became unused. A compiling empty-set mutation built with exit 0; the named case exited 1 at its whole `On` assertion (`duringPoll` and `duringTrustChange` were false, expected true). Source blob `9f82c7640ad68639f788bf1fe37d0a1b50c28eab` was restored; `git diff --exit-code -- src/accessories/basementGuardian.ts` exited 0. Rebuild and named GREEN both exited 0. | Added one case that reads `On` after a poll and a monitoring change while a self-test request waits, then after its deadline. |
| CR-05-ACCESSORY-005 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; named GREEN exit 0 (1 test); accessory owner exit 0 (161 tests, 161 pass); accessory pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | Wrong behavior: degradation warning omits the device identity. Temporary source mutation built with exit 0; the named case exited 1 at the whole warning-array assertion (actual `Degraded device`, expected `Degraded account-1_serial-1`). Restored source blob `9f82c7640ad68639f788bf1fe37d0a1b50c28eab`; source diff exit 0, rebuild and named GREEN exit 0. | Added an independent full-warning constant and compared whole arrays for one degradation and a degrade-recover-degrade sequence. |
| CR-05-ACCESSORY-006 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; named GREEN exit 0 (1 test); accessory owner exit 0 (161 tests, 161 pass); accessory pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | Wrong behavior: `update` writes SerialNumber outside the metadata guard. Temporary mutation built with exit 0; the named unresolved-family case exited 1 at the whole AccessoryInformation assertion (actual serial `serial-1`, expected `Default-SerialNumber`). Source blob `9f82c7640ad68639f788bf1fe37d0a1b50c28eab` restored; source diff exit 0, rebuild and named GREEN exit 0. | Added a four-characteristic reader and compared before/after records in the unresolved-family and four undecoded-metadata cases. |
| CR-05-ACCESSORY-007 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; named GREEN exit 0 (1 test); accessory owner exit 0 (161 tests, 161 pass); accessory pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | Wrong behavior: production `TRUST_SCOPES` omits `fault`. Temporary mutation built with exit 0; the named case exited 1 because the whole reported set lacked `fault`. Restored source blob `9f82c7640ad68639f788bf1fe37d0a1b50c28eab`; source diff exit 0, rebuild and named GREEN exit 0. | Replaced the partial test list with an exhaustive `Record<TrustScope, true>` and compared its keys. A new union member now requires a test expectation at compile time. |
| CR-05-ACCESSORY-029 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; two named GREEN cases each exited 0 (1 test each); accessory owner exit 0 (161 tests, 161 pass); accessory pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass; scoped pre-commit first exit 1 (Prettier formatting), rerun exit 0 | Wrong behavior: identity or AccessoryInformation guard throws `TypeError` with the same text. Each temporary mutation built with exit 0 and its named case exited 1 at the exact-class assertion (actual `TypeError`, expected `Error`). Restored source blob `9f82c7640ad68639f788bf1fe37d0a1b50c28eab`; source diff exit 0, rebuild and both named GREEN cases exited 0. | Pinned exact `Error` class and whole diagnostic text for the two identity cases and missing AccessoryInformation service. |
| CR-05-ACCESSORY-008 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; owner exit 0 (161 tests, 161 pass); direct pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | The all-service name expectation comes from independent `PUBLISHED_SERVICES` descriptors. Two ConfiguredName cases use literal expected names. Corrected the lookup comments; no case or protection was removed. |
| CR-05-ACCESSORY-018 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; initial `npm run build:test` exit 0 but owner exit 1 at import initialization (`NO_DEVICE_CONTEXT` temporal dead zone); moved the type check inside the case, then build exit 0, owner exit 0 (160 tests, 160 pass), direct pair exit 0 (100%), Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | Removed the nine-member source-text case. Required option shape remains checked by TypeScript at every options construction; excess `api` is rejected by `@ts-expect-error` in the retained no-API boundary case. The source-text typed-API check remains there. |
| CR-05-ACCESSORY-019 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; owner exit 0 (157 tests, 157 pass); direct pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | Removed the three cases that scheduled a test-private `deferredTransition` and did not execute the accessory update, plus that helper and its orphan import. The retained injected timer-port, global scheduling-spy, and immediate-value cases check actual `update()` behavior; the existing all-values synchronous publication case also remains. |
| CR-05-ACCESSORY-020 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; owner exit 0 (157 tests, 157 pass); direct pair exit 0 (100%); Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | Marked each rejection expression as `// act & assert`, restored `// act` before later actions, and moved the two explanatory sentences above plain `// assert` markers. No assertion, expected value, title, or protection changed. |
| CR-05-ACCESSORY-021 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; owner exit 0 (157 tests, 157 pass); direct pair exit 0 (100%); initial commit hook exit 1 for missing blank line, corrected and all changed-input checks repeated; Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | Compile-only accessory methods and silent loggers now use named block-body void callbacks. Throw callbacks use block bodies so the accessory return is discarded. Assertions, titles and expected values remain. |
| CR-05-ACCESSORY-022 | `test/accessories/basementGuardian.test.ts`, `.planning/phases/05-accessories-conformance/05-ACCESSORY-REVIEW.md` | Node v26.12.0: Fallow guard exit 0; `npm run build:test` exit 0; owner exit 0 (157 tests, 157 pass); direct pair exit 0 (100%); initial scoped pre-commit exit 1 after Prettier formatted the second assertion, rerun exit 0; changed-input checks repeated; Fallow audit against `9cb164b1299249c2d2083ea81677c83e28e66916` exit 0, verdict pass | n/a (WARNING) | Replaced the two `Array<unknown>(...).fill(...)` expected arrays with `Array.from` builders. Expected readings and assertions remain the same. |
