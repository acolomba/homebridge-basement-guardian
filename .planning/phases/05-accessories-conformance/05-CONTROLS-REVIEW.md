---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 0
reviewed: 2026-10-17T17:54:39Z
depth: deep
source_revision: 4c143ebad681cf602e787b8c2ea09b050d8a9518
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 9
  warning: 20
  total: 29
status: issues_found
reviewer: gsd-code-reviewer (round 0)
---

# Phase 5 CONTROLS batch: round-0 review

I read every line of both files in full at `4c143ebad681cf602e787b8c2ea09b050d8a9518`. Neither
file changed between the batch base `e65382053a264f8003b96b1a4536e061338f07c8` and this revision
(`git diff --stat` is empty), so the ledger's base lines are the current lines. The review used:

- the three `.agents/skills` books (each `SKILL.md` and every `rules/*.md` file);
- `05-CONTEXT.md`, `05-REVIEW-PROTOCOL.md`, and the CONTROLS rows and leads in `05-FINDINGS.md`;
- `01-CONTROLS-REVIEW.md` and `SPOT-CHECK-FINDINGS.md`;
- `features/lib/hap.ts`, `test/accessories/hapWriteFidelity.test.ts:370-396`, and the pinned
  `@homebridge/hap-nodejs` 2.2.2 `Characteristic.js:1346-1360, 1786-1880`;
- the consumers `src/accessories/basementGuardian.ts:549-705` and `src/accessories/staleMarking.ts:132`;
- the locked command decisions D-037 and D-038 (`.planning/intel/decisions.md:787-828`,
  `.planning/PROJECT.md:177-178`) and CTRL-03 and CTRL-05 (`.planning/milestones/v1.0-REQUIREMENTS.md:67, 69`).

Two findings are genuine production-bug candidates (D-04): CR-05-CONTROLS-008 and 009. I
confirmed both with read-only `node --input-type=module -e` runs. Each run imported the compiled
`dist-test/src/accessories/controls.js` and `dist-test/features/lib/hap.js` and used made-up
inputs (see Toolchain evidence). The other seven BLOCKERs are cases that a plausible wrong
binder passes. All seven seeds are confirmed.

## Findings

### CR-05-CONTROLS-001 - WARNING: The late-report case compares a warning count, not the warnings

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Compare whole values with `assert.deepStrictEqual()`. Do not assert existence, length, or one property at a time when the whole value is the promise.")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:817-830` (the assertion is at line 829)
**Issue:** Seed (a) is still present. Line 829 compares `{ warnings: warnings.length, pending: [...binder.pending] }` with `{ warnings: 1, pending: [] }`. The count does not show which line was logged. If the expiry logs a wrong line, this case still passes. The sibling case at 784-813 catches the wrong expiry line. A late reconcile that logs a second line makes the count 2, so no plausible binder breaks the titled "ignores" behavior here undetected. For that reason the severity is WARNING, not BLOCKER.
**Fix:** Compare the whole array: `assert.deepStrictEqual({ warnings, pending: [...binder.pending] }, { warnings: [\`The self-test request on ${DEVICE_ID} was never confirmed by the device. It is not retried.\`], pending: [] });`
**Flags:** none

### CR-05-CONTROLS-002 - WARNING: The test module has no `describe()` per exported entrypoint

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("When a module has several exported entrypoints, use one top-level `describe()` per entrypoint")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:12` (imports only `test`); cases at 184-881 (`createControlBinder`) and 921-1001 (`bindRestoredControlRefusal`)
**Issue:** Seed (b) is still present. `src/accessories/controls.ts` has two runtime exports, `bindRestoredControlRefusal` (421) and `createControlBinder` (445). Every case sits at the top level. The module-scope helpers and constants for the second entrypoint (883-919) and for the window (744-752) are mixed in between the cases.
**Fix:** Import `describe` from `node:test`. Put the binder cases in `describe('createControlBinder', ...)` and the restored-refusal cases in `describe('bindRestoredControlRefusal', ...)`. Do not nest them. Move the module-scope helpers and constants (623-629, 744-752, 883-919) above the first `describe`. Keep every title and assertion.
**Flags:** none

### CR-05-CONTROLS-003 - WARNING: A case drives only the HAP stand-in and calls no `controls` export

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` (every case must discriminate the behavior of the module under test); `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` ("Test modules and test support ... need no meta-tests"); D-13
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:216-243`
**Issue:** Seed (c) is still present. `'leaves a sticky status when the clearing push is queued as a microtask instead'` registers its own `onSet` handler on a stand-in characteristic, and so tests `features/lib/hap.ts` alone. No change to `controls.ts` can make it fail. `hapWriteFidelity.test.ts:375-396`, `'survives a push queued as a microtask inside the handler, on both implementations'`, runs the same ordering against real HAP 2.2.2 and the stand-in. The comment inside the case (231-233) is also a non-phase comment inside a case.
**Fix:** Remove the case and its comment block (216-221). Record in the ledger that the protection now lives in `hapWriteFidelity.test.ts` 'survives a push queued as a microtask inside the handler, on both implementations' (D-13, P-05-03). The binder's own macrotask choice stays pinned by 201-214, 569-584 and 953-973.
**Flags:** D-13

### CR-05-CONTROLS-004 - WARNING: The one-handler case builds a spy by hand through `.bind`

**Rule:** `.agents/skills/typescript-unit-tests/rules/test-doubles.md` Spies and Scope ("`t.mock.method(orders, "put")` with no replacement ... Every double comes from the current test context"); `.agents/skills/typescript-style/rules/functions.md` ("no `bind`/`call`/`apply` where an arrow or an explicit parameter works"); `.agents/skills/typescript-style/rules/review.md` Quick scan (`.bind(`)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:321-340` (the spy is at 326-332)
**Issue:** Seed (d) is still present. The case keeps `characteristic.onSet.bind(characteristic)` and assigns a counting wrapper to `characteristic.onSet`. That wrapper is an own property that no test context restores.
**Fix:** Make the case `async (t) =>` or `(t) =>`. Create `const onSetSpy = t.mock.method(characteristic, 'onSet');` under `// arrange`. Assert `onSetSpy.mock.callCount()` equals `1` under `// assert`. Remove `registrations`, `declared` and the reassignment.
**Flags:** none

### CR-05-CONTROLS-005 - WARNING: Two `// act & assert` markers do not cover one `assert.rejects()` or `assert.throws()` expression

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("Use `// act & assert` only when one `assert.rejects()` or `assert.throws()` expression performs both the action and assertion.")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:926-931, 980-981`
**Issue:** Seed (e) is still present. At 926-931 the marker covers two statements: `assertRefused(...)` and then a separate `assert.deepStrictEqual` of the stored value and status. At 980-981 the marker covers a plain `assert.deepStrictEqual(readOfSwitch(service), ...)`, which contains no `assert.rejects` or `assert.throws`.
**Fix:** 921-932: under `// act`, capture the write's rejection into a value (see CR-05-CONTROLS-017). Under `// assert`, compare `{ thrown, value, statusCode }` with `{ thrown: NOT_ALLOWED_IN_CURRENT_STATE, value: false, statusCode: NOT_ALLOWED_IN_CURRENT_STATE }`. 975-982: write `const read = readOfSwitch(service);` under `// act` and assert it under `// assert`. Keep the expected values.
**Flags:** none

### CR-05-CONTROLS-006 - WARNING: Six inline `as unknown as Service` casts sit outside the one documented widening

**Rule:** `.agents/skills/typescript-style/rules/types.md` ("`as` and `!` only with an obvious or commented reason"); `.agents/skills/typescript-unit-tests/rules/cases.md` Types and isolation; D-11
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:163, 335, 336, 851, 872, 903` (the documented widening is at 44-46)
**Issue:** Seed (f) is still present. Each call site double-asserts a `FakeHapService` to `Service` inline, with no comment. The reason is stated only for `HAP_NAMESPACE` at 44-46.
**Fix:** Next to `HAP_NAMESPACE`, add one commented helper: `function asService(service: FakeHapService): Service { return service as unknown as Service; }`, with a comment saying that the stand-in service answers the members the plugin reads. Replace the six casts with `asService(...)`. Change no production type.
**Flags:** D-11

### CR-05-CONTROLS-007 - WARNING: The `LOCAL_REFUSALS` ordering comment sits on `NO_COMMAND_TRANSPORT_CAUSE`

**Rule:** `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation; `.agents/skills/typescript-style/rules/comments.md` (comments describe the code they sit on)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:304-336`
**Issue:** Seed (g) is still present. The 19-line comment about the order of the rules (304-322) has no blank line before the next comment. It runs straight into the `NO_COMMAND_TRANSPORT_CAUSE` comment (323-327) and the constant at 328. The `QUIET_LIVE_CONNECTION_CAUSE` comment and constant (330-334) come next. `const LOCAL_REFUSALS` at 336, the table the comment describes, has no comment directly above it.
**Fix:** Move lines 304-322 so they sit directly above `const LOCAL_REFUSALS` (336). Leave the two cause constants and their own comments above it. Change no literal.
**Flags:** none

### CR-05-CONTROLS-008 - BLOCKER: A second on-request while one is pending is sent, and the first window then expires the second request early

**Rule:** D-037 (locked: "Reject another command for the same control while this pending state exists."); CTRL-03 ("rejects ... duplicates"); CTRL-05 ("tracks one 30-second pending/uncertain request"); `.agents/skills/typescript-unit-tests/SKILL.md` (a case must exist that a wrong implementation fails); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:336-343, 492-499, 537-571` (no rule reads `requested`; `requested.set` at 556-561 overwrites an existing entry without clearing its handle; `expire` at 492-499 is keyed by capability alone); `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:245-304, 754-881` (no case presses twice)
**Issue:** `answerWrite` never checks whether `requested` already holds the capability. The only duplicate rule, `isAlreadyActive` (296-298), reads the reported value. While a request is pending, the device has not yet reported it, so that rule does not apply. The accessory's `reported` closure (`basementGuardian.ts:705`, `reportedControlValue`) does not check pending state either. I observed this with a read-only run on the compiled module. Two `true` writes with the default stub sent `["dev-1 self-test true","dev-1 self-test true"]` and armed two 30000 ms windows (handles 0 and 1), and nothing was cancelled. Running the first window then emptied `pending` and logged "The self-test request on dev-1 was never confirmed by the device. It is not retried." That warning came 30 s after the first press, not 30 s after the second. A HomeKit automation, a scene or Siri can issue the second write. When it does, a real sump pump receives a second command, and the second request's window ends early with a false device-failure warning.
**Fix:** This is a D-04 genuine-bug candidate. It changes the preserved refusal table (it adds a refusal, so it adds a status and a cause), so the coordinator must route it through the RED-to-GREEN procedure, and the maintainer must approve the new row's position, status and cause. Minimum shape:
1. Add `pending: boolean` to `ControlRequest`, sampled as `requested.has(capability)` with the other facts at 539-546.
2. Add a `LocalRefusal` that applies on `request.pending` and answers `RESOURCE_BUSY`, which is D-04's status for a duplicate on.
3. RED regression test in `controls.test.ts`, for example `'refuses a second on request while the first waits for the device, and sends one command'`. It writes `true` twice and asserts that the second write rejects with `-70403`, `sends` holds one element, `pending` is `['self-test']`, and `cancelled` is `[]`.
4. Optionally, `expire` deletes the entry only when its handle is the one that fired. Once the refusal exists no path overwrites an entry, but this removes the capability-keyed coupling.
**Flags:** D-04 (genuine production bug candidate; changes the preserved refusal order and causes by adding a row, and names that behavior)

### CR-05-CONTROLS-009 - BLOCKER: A timed-out command drops its pending entry, although D-038 says to keep it

**Rule:** D-038 (locked: "If the deadline expires, return `HapStatusError(OPERATION_TIMED_OUT)`. Treat command delivery as uncertain and keep the pending state from D-037. ... Otherwise, the pending state expires 30 seconds after the original dispatch began."); D-037 (pending clears "on rejection/report/expiry"); CTRL-05; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (the cases pin the wrong expectation)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:526-535` (`refuseOutcome` calls `resolvePending` for both `CommandFailure` values; the comment at 526-528 states this); `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:342-361, 505-515, 586-597` (the `timed-out` rows assert `pending: []`)
**Issue:** For `timed-out`, `refuseOutcome` clears the entry and cancels its window. I observed this with a read-only run: one press with a `{ accepted: false, failure: 'timed-out' }` outcome rejected with `-70408`, left `pending` as `[]` with `cancelled` `[0]`, and a second press straight after was sent (`sends` `["self-test","self-test"]`). D-038 says delivery is uncertain after a timeout and the pending state stays until a report or the 30-second expiry. The press that timed out may already be running a test, and dropping the entry is what lets a second press operate the pump again (see 008). The tests `'answers -70408 for a timed-out outcome, drops the pending entry, ...'` and `'attempts an exceeded deadline exactly once and drops the pending entry'` pin the behavior D-038 forbids. A vendor refusal (`vendor-error`) clears the entry correctly under D-037.
**Fix:** This is a D-04 genuine-bug candidate. In `refuseOutcome`, call `resolvePending` only for `vendor-error`. For `timed-out`, keep the entry and its window, still arm the clearing push (HAP still stores the status), keep the same warning line and throw `OPERATION_TIMED_OUT`. The log line, the status and the single attempt stay unchanged. Restate the comment at 526-528. RED regression test, for example `'keeps the request pending when the vendor does not answer in time'`, asserting `pending: ['self-test']` and `cancelled: []` after a `timed-out` outcome. Then change the `timed-out` row's expected pending in 342-361 and 586-597 (for example a row field `pendingAfter`) instead of a branch in the loop body. Coordinate with 008 so that a second press during this kept window is refused.
**Flags:** D-04 (genuine production bug candidate); D-10 (cites SC-02: the `VENDOR_REFUSALS` rows at 493-516 are lines the SC-02 fix touched)

### CR-05-CONTROLS-010 - BLOCKER: Ten of the fourteen refusal pairs that can hold together have no precedence case, so most reorderings of the table pass

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` ("would a plausible wrong implementation still pass it?"); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings; D-05 preservation (refusal order)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:409-411, 631-725` (precedence cases and the comments that claim them); the table under test is `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:336-343`
**Issue:** Each row of the refusal table (424-516) sets exactly one condition, so no row shows which rule wins when two apply. Only four pairs have a case: transport over fresh state (661-672), transport over quiet path (694-708), quiet path over fresh state (714-725), and, incidentally, not-on over already-active (363-374, through its `-70412` status). Fresh state and already-active cannot hold together (`undefined` against `true`). The other ten pairs that can hold together have no case: not-on with transport, quiet, fresh or offline; transport with offline or active; quiet with offline or active; fresh with offline; offline with active. A plausible reordering passes every case. One example moves `isConfirmedOffline` to the top, which is the official client's one rule (283-291). That binder tells an owner whose plugin has no route that "the device is confirmed offline". Another puts `isAlreadyActive` above `isConfirmedOffline`. That binder answers `-70403` instead of `-70412` for an offline device whose last report was active. The comments at 409-411 ("in the order the binder evaluates them") and 657-660 ("this case is what stops an unrelated reordering of the table") claim more than the cases pin.
**Fix:** Add one data-driven block of typed precedence rows. Each row sets exactly two conditions and carries the expected exact warning line and status, written out by hand. Rows at least for the adjacent pairs not-on/transport, fresh/offline and offline/active. That pins the order of the six rules, because 694 and 714 pin transport/quiet and quiet/fresh. All ten missing pairs are preferred. Use one sibling `test()` per row with no conditional in the body. Restate 409-411 and 657-660 to say what the cases pin. Change no production order, status or cause.
**Flags:** none

### CR-05-CONTROLS-011 - BLOCKER: The vendor-refusal cases never look at the binder's timers, so a delayed retry and an uncancelled window both pass

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions (whole values); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings; D-05 preservation (one command attempt, no retry)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:342-361, 586-597`
**Issue:** `'attempts <cause> exactly once and drops the pending entry'` asserts `{ thrown, sends, pending }` straight after the write. It never runs the recorded deferrals and never reads `deferrals` or `cancelled`. `'answers <status> for a <failure> outcome, ... and sends nothing further'` runs only the delay-0 push. Two plausible wrong binders pass every case:
- (a) A binder that retries a failed command on its own timer (for example `timers.setTimeout(() => commands.send(...), 5000)`). The retry is recorded and never run.
- (b) A `refuseOutcome` that removes the entry with `requested.delete` and leaves its 30000 ms window armed. That window later ends a newer request for the same capability early, with a false "never confirmed" warning. No case reads `cancelled` after a vendor refusal.
**Fix:** In the vendor-refusal case, give each row its expected timer record, written out by hand. For example, `delays: [30000, 0]` and `cancelled: [0]` for `vendor-error`. For `timed-out` after 009's fix: `cancelled: []`, `pending: ['self-test']`. Assert `{ thrown, sends, pending, delays: deferrals.map(...), cancelled }` as one value. Then run every recorded deferral and assert again that `sends` holds exactly one element. Keep the values in the rows, with no branch in the loop body.
**Flags:** D-10 (cites SC-02 if the expected timer fields are added to the `VENDOR_REFUSALS` rows at 493-516)

### CR-05-CONTROLS-012 - BLOCKER: A non-matching report is never shown to leave the window armed

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions (whole values); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:282-304`
**Issue:** `'keeps the capability pending while the device still reports the old value'` and `'... while the scope carrying its reported value has not decoded'` assert only `[...binder.pending]`. Consider a `reconcile` that cancels the entry's window before it compares the values, for example `timers.clearTimeout(entry.handle); if (entry.value === reported) requested.delete(capability);`. That binder passes both cases. With it, any non-matching poll leaves the request pending with no deadline. The row then withholds `On` until the next restart, and the D-037 expiry never happens. No other case reconciles a mismatch and then reads `cancelled` or runs the window.
**Fix:** In both cases, record `cancelled` and assert `{ pending: [...binder.pending], cancelled }` with `{ pending: ['self-test'], cancelled: [] }`. Optionally, run the window afterwards and assert the entry expires.
**Flags:** none

### CR-05-CONTROLS-013 - BLOCKER: No case shows that the binder's clearing push republishes the control rows

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (missing assertion)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:184-199, 342-393, 569-584, 727-742` (every case that runs a binder clearing push uses the default `republish` stub at 154); production `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:377-381, 501-505`
**Issue:** `clearRefusal` calls `republish()` before it pushes `On`, and the binder's options say `republish` re-asserts the control rows (123-129, 370-376). The accessory uses it to re-project `StatusActive` and the row once a vendor refusal drops the pending entry (`basementGuardian.ts:641-690`). Only two cases record `republish`: the accepted send (245-268, asserts `[]`) and the window expiry (784-813). A binder that skips `republish()` in the clearing push passes every case. So does a binder that hands the binder's push `nothingToRepublish`, as the restored path does.
**Fix:** In one local-refusal case and one vendor-refusal case, pass a `republish` recorder. Assert that the recorder holds `[]` after the write and `['republish']` after the clearing push runs, as one whole value with the status code.
**Flags:** none

### CR-05-CONTROLS-014 - BLOCKER: No case changes the pushed value between the refusal and the push, so a push of a value sampled at write time passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:363-374` (also 379-393 and 987-1001 for the held value); production `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:501-505, 429-432`
**Issue:** The title promises "the reported value the accessory answers when the clearing push runs", and `armClearingPush` calls `reported()` inside the timer callback. The stub `() => true` answers the same value at write time and at push time. Consider a binder that pushes `request.reported`, the value already sampled into `ControlRequest` at 539-546. That is a likely refactor, and it passes. Such a binder can push a reading older than the one `republish()` has just published. The restored path has the same gap: `heldOn` is read when the push runs, but 987-1001 never changes the held value before the push.
**Fix:** Drive `reported` from a `let` the case changes between the refusal and the push. For example, write `false` while `reported` is `false`, set it to `true`, run the push, and assert `{ value: true, statusCode: SUCCESS }`. For the restored path, update the held value between the refusal and the push, and assert that the push carries the new value.
**Flags:** none

### CR-05-CONTROLS-015 - BLOCKER: The restored refusal is only ever pressed with `true`, so a refusal that lets `false` through passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md`; `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:921-1001`; production `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:390-436`
**Issue:** The JSDoc promises "Refuses every press on one restored control". Every restored case writes `true`. Consider a restored handler that returns early for any value other than `true` (for example `if (value !== true) { return; }`). In Apple Home, toggling off a Switch the cache restored as on writes `false`. That write would then succeed: HAP stores `false`, nothing is sent, and the owner is not told. This is the exact RES-04 window the function exists to close. Every case still passes.
**Fix:** Run the refusal, the log line and the clearing-push cases over typed rows `[true, false]`, one sibling `test()` per row. Each asserts the rejection status, the unchanged stored value and the exact warning line.
**Flags:** none

### CR-05-CONTROLS-016 - BLOCKER: No case looks at the error the binder throws, so a plain `Error` for a vendor error passes

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Assert errors by class and structured fields"); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings; D-05 preservation ("`HapStatusError` thrown only by the binder")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:173-182, 521-545` (both helpers read only HAP's re-thrown bare number); production `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:355-360`
**Issue:** Every case observes the bare status that the stand-in's `handleSetRequest` re-throws after converting the handler's error (`features/lib/hap.ts:279-284, 323-331`). Real HAP converts the same way (`Characteristic.js:1818-1832`). Both map any non-`HapStatusError` to `-70402`. A binder that throws `new Error('vendor-error')` therefore passes every `vendor-error` case. So does a binder that throws a bare number. Real HAP would then emit a characteristic warning quoting the message. The comment at 355-357 says the binder exists to prevent exactly that. `HapStatusError` appears in this test file only inside the stand-in-only case at 234.
**Fix:** In a case per binder refusal kind, capture the handler the binder registers with `t.mock.method(characteristic, 'onSet')`. Read the handler from `onSetSpy.mock.calls[0].arguments[0]` and call it directly. Assert with `assert.rejects` that the error is an instance of `HAP.HapStatusError` and that `hapStatus` is the row's status, as in the errors example in cases.md. Do the same for the restored handler.
**Flags:** none

### CR-05-CONTROLS-017 - WARNING: Eighteen cases put an `assert.rejects` assertion under `// act`

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure ("Mark phases with lowercase `// arrange`, `// act`, `// assert` comments, in that order ... Use `// act & assert` only when one `assert.rejects()` or `assert.throws()` expression performs both the action and assertion.")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:192, 207, 238, 353, 369, 387, 403, 616, 638, 651, 668, 684, 704, 721, 733, 943, 960, 995`
**Issue:** Each site is `await assertRefused(...)`, which is an `assert.rejects` (173-182), under a `// act` marker. The status assertion therefore runs in the act phase, before the `// assert` phase that follows. The file's own `refuse()` helper (521-545) shows the other way to do it: capture the rejection under act and assert it later.
**Fix:** Add a helper that returns the rejection value, for example `async function writeRejection(service, value): Promise<unknown>` using the same `try`/`catch` as `refuse()`. Bind `const thrown = await writeRejection(...)` under `// act`, and add `thrown` to the whole-value assertion under `// assert`. Remove `assertRefused` when no caller is left. Line 238 goes away with CR-05-CONTROLS-003.
**Flags:** D-10 (cites SC-02: line 616 is inside the SC-02 repair at 599-620)

### CR-05-CONTROLS-018 - WARNING: `readOfSwitch` depends on the stand-in's synchronous read and would miss real HAP's rejection

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Await every promise and asynchronous assertion"); D-16 (precedent CR-05-CATALOGUE-010)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:910-919` (used at 961, 966, 981, 999)
**Issue:** `readOfSwitch` calls `handleGetRequest()` inside a synchronous `try`/`catch`. It catches a stored status only because `features/lib/hap.ts:341-348` throws synchronously. Real HAP 2.2.2 `handleGetRequest` is `async` and rejects. The comment at 910-912 says the read is "driven rather than inferred", but the helper drives the stand-in's form of the read, not the one HAP has.
**Fix:** Make it `async function readOfSwitch(...)` with `await onCharacteristic(service).handleGetRequest()` inside the `try`. Make the callers `await` it, and keep their expected records. The stand-in's synchronous read is the GATES lead S-05-23.
**Flags:** D-16

### CR-05-CONTROLS-019 - WARNING: The status case loops all eight rows inside one `test()`

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Data-driven cases ("Do not loop rows inside one case; it stops at the first failure.")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:547-557`
**Issue:** Lead S-05-04 is confirmed. `'answers each of the eight refusal causes with the status that describes it'` iterates `REFUSALS` inside one case and stops at the first failure. Each write goes through `refuse()`, so the arrange happens inside `// act`. The expected list repeats the statuses as bare numbers instead of the named constants at 34-37. Every row's status is already asserted per row: 559-566 for the local rows, 586-597 for the vendor rows, and 599-621 (through `assertRefused`) for all eight.
**Fix:** Remove the case and record that 599-621 `'logs the exact refusal for <cause>'` and 559-566 / 586-597 carry each row's status (P-05-03). Or replace it with one sibling `test()` per row that asserts `thrown` against `refusalCase.status`.
**Flags:** none

### CR-05-CONTROLS-020 - WARNING: The `bind` JSDoc says HAP warns about earlier handlers; pinned HAP does not

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does and why); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:143-147`
**Issue:** Lead S-05-05 is confirmed. The JSDoc says HAP "keeps only the last handler registered while warning about the ones before it". Pinned HAP 2.2.2 `onSet` (`Characteristic.js:1346-1352`) assigns `this.setHandler` and warns only when the handler is not a function. The only other warning is for ignored `on('set')` listeners (1801-1803). A second `onSet` replaces the first without a warning. The reason given for the guard is therefore false.
**Fix:** Restate the reason as a fact. For example: "HAP keeps one set handler per characteristic, so a second registration would only replace the first; the guard keeps `bind` idempotent as the accessory walks its catalogue on every update."
**Flags:** none

### CR-05-CONTROLS-021 - WARNING: Two source comments narrate code history

**Rule:** `.agents/skills/typescript-style/rules/comments.md` Forbidden ("Narration of code that no longer exists. A comment describes the code as it stands, not the shape it replaced.")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:97-103, 323-324`
**Issue:** Lead S-05-06 is confirmed for the source. 97-100: "That was written here as an invariant before it was one. The row was widened to keep publishing what a working transport delivered and the write path was not, so a press was refused ..." describes an earlier shape of the code. 323-324: "declared once because two refusals now answer it". The word "now" records a change. The test title quoted at 100-102 also differs from the real title, which is `'WR-02 returns the Switch ...'` at `basementGuardian.test.ts:2848`.
**Fix:** 97-103: state the present invariant and its anchor, for example "The case 'WR-02 returns the Switch to the value the device reported when a press is refused during shadow silence' reads the write path's own answer where a controller can see it (RES-04, D-07, WR-02)." 323-324: "declared once because two refusals answer it". Change no literal.
**Flags:** none

### CR-05-CONTROLS-022 - WARNING: Two test comments narrate "the new rule"

**Rule:** `.agents/skills/typescript-style/rules/comments.md` Forbidden (narration of code history)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:690-693, 710-713`
**Issue:** Lead S-05-06 is confirmed for the test. "the pair the new rule's placement decides" (690), "an edit moving the new rule above it" (693) and "an edit moving the new rule below the state rule" (713) call the quiet-live-path rule "new". That is a fact about when it was added, not about the code.
**Fix:** Name the rule: "the quiet-live-path rule". For example: "this case stops an edit that moves the quiet-live-path rule above the transport rule".
**Flags:** none

### CR-05-CONTROLS-023 - WARNING: Command issuing is asserted through a hand-built recorder, not a `strong-mock` mock

**Rule:** `.agents/skills/typescript-unit-tests/rules/test-doubles.md` Mocks ("`strong-mock`, only when the interaction is public behavior: ... issuing a command"; "Use the tool that matches the role")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:104-118` (asserted at 262, 357, 565, 594, 641, 654, 671, 687, 707, 724, 810, 879; built at 524 and 603)
**Issue:** Lead S-05-18 is confirmed. Sending a command to the vendor is the interaction the controls module promises, so the role is Mock. `recordingCommands` hand-builds that mock and stringifies the arguments. `strong-mock` is a project dependency used by ten test modules. A `mock<CommandPort>({ exactParams: true, name: 'commands' })` with no expectation also proves that a local refusal does not touch the port, and it throws on any later call, including a deferred one.
**Fix:** In each case that asserts sends, create the mock inside the case. Add `when(() => commands.send(DEVICE_ID, 'self-test', true)).thenResolve(...)` once per promised send and `verify(commands)` last. In the local-refusal cases, use a mock with no expectations. Keep the result assertions first. This is a large mechanical change, so give it its own `test(controls)` commit.
**Flags:** D-10 (cites SC-02: `refuse()` and the exact-log loop at 599-620 build the command port)

### CR-05-CONTROLS-024 - WARNING: The module-level `ACCEPTED` outcome object is shared by six rows and every case that reads them

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Test data ("Seeds reused across cases ... as functions that return fresh values, never shared mutable constants"); Case structure ("Each case gets fresh state")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:28-30, 433, 444, 455, 466, 477, 488`
**Issue:** Lead S-05-19 is confirmed. `ACCEPTED: CommandOutcome` is a mutable object. Every `LOCAL_REFUSALS` row holds it by reference, and the recorder resolves that same object to the binder in every case that sends. The vendor rows' `outcome` literals (502, 513) are also single objects shared by the five loops over `REFUSALS`.
**Fix:** Replace `ACCEPTED` with a function `function acceptedOutcome(): CommandOutcome { return { accepted: true }; }`. Then either have the recorder take an outcome factory, or give each row a fresh inline literal, and mark the `RefusalCase` fields `readonly`. Change no expected value.
**Flags:** D-10 (cites SC-02: the rows at 433-488 are lines the SC-02 fix touched)

### CR-05-CONTROLS-025 - WARNING: The source module lacks the D-01 header

**Rule:** D-01; `.agents/skills/typescript-style/rules/modules-and-data.md` Files and modules (file order: copyright JSDoc, `@fileoverview` JSDoc, imports, each separated by exactly one blank line)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:1-2`
**Issue:** The `/** @fileoverview` block starts on line 2, directly after the SPDX line. There is no blank line and no `Copyright (c) 2026 Alessandro Colomba` block. The ledger tracer reports `HEADER_VIOLATION src/accessories/controls.ts: 2 expected an empty line after the SPDX line`.
**Fix:** Insert an empty line 2, then lines 3-5 `/**` / ` * Copyright (c) 2026 Alessandro Colomba` / ` */`, and an empty line 6. The existing overview starts at line 7 (`/**`), with ` * @fileoverview The one place a HomeKit write reaches the vendor.` on line 8. Keep the rest of the overview text, then one empty line and the first import. Make this a header-only `style(controls)` commit.
**Flags:** none

### CR-05-CONTROLS-026 - WARNING: Two source comments state things the code and pinned HAP contradict

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does and why); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:21-23, 304-305`
**Issue:**
- (a) 21-23: "A push before the throw would clear the status HAP is about to set". Pinned HAP resets `statusCode` to `0` on entry (`Characteristic.js:1787`). It assigns the refusal status only in its catch, after the handler has thrown (1818-1832). A push before the throw therefore cannot clear that status. The same overview says this correctly at 28-30 ("would clear a status that has not been set yet").
- (b) 304-305: "The rules in the order they are evaluated, cheapest and most local first." The facts are all sampled once before the first rule runs (208-219, 539-546), so the rules cost the same. Two plugin-wide rules (transport, quiet path) come before the capability-local fresh-state rule. The order expresses which cause the user is told, as 307-322 explain, not cost or locality.
**Fix:** (a) Say what a push before the throw does: it stores a value and emits a change nobody asked for, and HAP still sets the status afterwards. (b) "The rules in the order they are evaluated. The first that applies answers the write; the rest are never consulted." Keep the rationale paragraphs.
**Flags:** none

### CR-05-CONTROLS-027 - WARNING: The `silentLog` comment says logging is not this module's job

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does and why)
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:74-80` (comment at 76)
**Issue:** "logging is not this module's job; the stub discards every call". The refusal and expiry lines are a preserved contract of this module: D-05 lists the exact log lines, and SC-02 is about them. The cases at 395-407, 599-621, 631-725, 784-845 and 937-947 assert those lines.
**Fix:** "the cases using this stub do not read the log; the stub discards every call".
**Flags:** none

### CR-05-CONTROLS-028 - WARNING: Concise arrow bodies return a value that is discarded

**Rule:** `.agents/skills/typescript-style/rules/functions.md` ("Concise arrow body only when the return value is used; a discarded value gets a block body or `void`.")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:98, 154`
**Issue:** `clearInterval: () => undefined` implements a `void` member (`src/runtime/timers.ts:33`), and `((): void => undefined)` is the default `republish` (`() => void`). Both are concise bodies whose value nothing reads. `setInterval: () => undefined` at 94 returns the handle, so it is not affected.
**Fix:** Use block bodies with a comment, as `warningLog` and `silentLog` do: `clearInterval: () => { /* no interval is armed in these cases */ }` written as `//` lines, and the same for the `republish` default.
**Flags:** none

### CR-05-CONTROLS-029 - WARNING: Two cases count filtered deferrals where the whole deferral list is the promise

**Rule:** `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions ("Do not assert existence, length, or one property at a time when the whole value is the promise.")
**Location:** `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:265-266, 575-582`
**Issue:** The accepted-send case compares `clearingPushes: clearingPushesIn(deferrals).length` with `0`. The clearing-push loop compares `pushes: pushes.length` with `1`. Both reduce the recorded deferrals to the length of the delay-0 subset. A binder that arms an extra deferral at any other delay passes both.
**Fix:** Compare the delays as a whole: `delays: deferrals.map((deferral) => deferral.delayMs)`. That is `[30000]` for the accepted send. In the loop, carry a hand-written `expectedDelays` on each row: `[0]` for the local rows, and `[30000, 0]` for the vendor rows (after 009, the `timed-out` row's own value). Keep the status-code assertion.
**Flags:** none

## Seed and lead dispositions

- **CR-05-CONTROLS-001 (seed a):** confirmed, WARNING, at 817-830 (line 829).
- **CR-05-CONTROLS-002 (seed b):** confirmed, WARNING (no `describe`; two runtime exports at `controls.ts:421, 445`).
- **CR-05-CONTROLS-003 (seed c):** confirmed, WARNING, D-13, at 216-243. `hapWriteFidelity.test.ts:375-396` keeps the protection on both implementations.
- **CR-05-CONTROLS-004 (seed d):** confirmed, WARNING, at 321-340.
- **CR-05-CONTROLS-005 (seed e):** confirmed, WARNING, at 926-931 and 980-981.
- **CR-05-CONTROLS-006 (seed f):** confirmed, WARNING, D-11, at 163, 335, 336, 851, 872 and 903.
- **CR-05-CONTROLS-007 (seed g):** confirmed, WARNING, at `controls.ts:304-336`.
- **S-05-01 (CONTROLS part):** confirmed as CR-05-CONTROLS-005. The two markers are at 926 and 980. The file has no other `// act & assert`.
- **S-05-04:** confirmed as CR-05-CONTROLS-019.
- **S-05-05:** confirmed as CR-05-CONTROLS-020.
- **S-05-06 (CONTROLS part):** confirmed as CR-05-CONTROLS-021 (source 97-103, 323-324) and CR-05-CONTROLS-022 (test 690, 693, 713). The ACCESSORY part (`basementGuardian.test.ts:2947`) is not judged here.
- **S-05-18:** confirmed as CR-05-CONTROLS-023.
- **S-05-19:** confirmed as CR-05-CONTROLS-024.

## Header inspection

- `src/accessories/controls.ts`: does not conform. Line 1 is the SPDX line, and line 2 opens the `@fileoverview` block. The empty line and the copyright block are missing (CR-05-CONTROLS-025).
- `test/accessories/controls.test.ts`: conforms. Line 1 is `// SPDX-License-Identifier: MIT`, line 2 is empty, and lines 3-5 hold the copyright block. Line 6 is empty, lines 7-9 hold `/**`, ` * @fileoverview Tests control writes and refusal diagnostics.` and ` */`, line 10 is empty, and the first import is at line 11.

## Toolchain evidence

All commands ran from the repository root at `4c143ebad681cf602e787b8c2ea09b050d8a9518`, each prefixed with `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. Node `v26.12.0`, npm `11.20.0`. The working tree had only the coordinator's uncommitted `05-FINDINGS.md` edit, which is not a build input.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both projects compile |
| `node_modules/.bin/eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | compiled |
| `node --test dist-test/test/accessories/controls.test.js` | 0 | tests 63, suites 0, pass 63, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | 0 | no output (pair at 100% alone) |

Read-only probes (no file written, no source changed). Each one imported the compiled
`dist-test/src/accessories/controls.js` and `dist-test/features/lib/hap.js` with made-up inputs
(`dev-1`):

- Two `true` writes with an accepting port: `sends ["dev-1 self-test true","dev-1 self-test true"]`, deferrals `[[0,30000],[1,30000]]`, cancelled `[]`. Running the first window gave `pending []` and logged one "never confirmed" warning (CR-05-CONTROLS-008).
- One `true` write with a `timed-out` outcome: rejected with `-70408`, then `pending []` and `cancelled [0]`. A second `true` write straight after was sent: `sends ["self-test","self-test"]` (CR-05-CONTROLS-009).

The checks pass. The BLOCKERs above are gaps the checks cannot see, not check failures.

## Out-of-scope observations

- `src/accessories/basementGuardian.ts:698-705` (ACCESSORY batch): the `reported` closure passed to `bind` reads the decoded value only. It is not the place to fix CR-05-CONTROLS-008, because the binder owns the pending set. The ACCESSORY review should check that no accessory case relies on a second press during a pending window being sent.
- `features/homekit/official-controls.feature:105-119` (Phase 7, `features/**`): the timeout scenario presses once and checks one command. No scenario presses again within the 30-second window after an accepted or timed-out command. That is the end-to-end form of 008 and 009.
- `features/lib/hap.ts:279-284, 323-331` (Phase 7 under D-12; GATES lead S-05-15): the stand-in records no characteristic warnings. A handler that throws a plain `Error` therefore cannot be told apart from `HapStatusError(-70402)` through the stand-in (CR-05-CONTROLS-016 works around this by capturing the handler). The stand-in also clears `statusCode` only on success, while real HAP clears it on entry (`Characteristic.js:1787`). That gap is S-05-15 (3).
- `features/lib/hap.ts:341-348` (GATES lead S-05-23; Phase 7): the stand-in's `handleGetRequest` is synchronous, while real HAP's is `async`. CR-05-CONTROLS-018 is the consumer-side fix.

---

_Reviewed: 2026-10-17T17:54:39Z_
_Reviewer: Claude (gsd-code-reviewer, round 0)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. All 29 findings are accepted as `open`; none is rejected.

- **Seeds CR-05-CONTROLS-001 to 007:** `open`, WARNING, at the lines above. After 003's case is
  removed, `test/accessories/hapWriteFidelity.test.ts` 'survives a push queued as a microtask
  inside the handler, on both implementations' carries its protection (D-13).
- **CR-05-CONTROLS-008 and 009:** `open`, BLOCKER, and classified as genuine production bugs
  (D-04).
  - D-037 (locked) says to reject another command for the same control while the pending state
    exists. The binder sends it (008).
  - D-038 (locked) says to treat a timed-out command as uncertain and keep the pending state. The
    binder drops it (009). The original design read D-038 the same way: the timed-out row of
    `.planning/milestones/v1.0-phases/04-pump-records-and-official-controls/04-RESEARCH.md:768`
    expects "pending is retained per D-038". No later decision replaces D-037 or D-038.
  - The locked decisions name the behavior change, so D-04 evidence covers the change to the
    preserved refusal table (D-05). The new pending refusal goes last in `LOCAL_REFUSALS` and
    answers `RESOURCE_BUSY` (-70403), the status the table already gives a duplicate on request.
    Every existing refusal keeps its precedence, status, cause and log line, so the only change is
    that a press the binder used to send is now refused. The cause names the condition in plain
    words, with no internal term: "an earlier request is still waiting for the device to confirm
    it".
  - A timed-out outcome keeps its warning line, its -70408 status, the single attempt and the
    clearing push. Only the pending entry and its 30-second window stay.
  - Order: 008, then 009. Each runs the protocol's D-04 sequence with
    `05-CONTROLS-RED-EVIDENCE.json`; 009's record carries 008's record in `priorEvidence`.
- **CR-05-CONTROLS-010 to 016:** `open`, BLOCKER. When 008 lands, 010 also pins the pending rule
  against every rule that can hold at the same time.
- **CR-05-CONTROLS-017 to 029:** `open`, WARNING. For 019 the coordinator takes the plan's option:
  one sibling `test()` per `REFUSALS` row, with a title that interpolates the row.
- **D-10:** SC-02 touched `test/accessories/controls.test.ts` lines 421, 427, 438, 449, 460, 471,
  482, 496, 507, 599-602, 607, 615 and 618-621 at the batch base (`git blame` of `d023bbb` and
  `906daa9`). 009, 011, 017, 023 and 024 cite SC-02 as reported. The coordinator adds the citation
  to 029, because its fix adds a field to the `REFUSALS` rows that hold those lines.
- **Leads:** S-05-01 (CONTROLS part) is confirmed as 005, S-05-04 as 019, S-05-05 as 020, S-05-06
  (CONTROLS part) as 021 and 022, S-05-18 as 023 and S-05-19 as 024.
- **Repair order:** the header (025); the source comments (007, 020, 021, 026); the D-04 bugs (008,
  then 009); then the test causes (003, 004, 006, 005, 001, 019, 024, 023, then 010 to 018, 022,
  027, 028 and 029), with the reindent (002) last.
- **Counts:** opening 7, fixed 0, rejected 0, new 22, reopened 0, closing 29 (9 BLOCKER, 20
  WARNING).

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CONTROLS-025 | `src/accessories/controls.ts` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/controls.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/controls.test.js` exit 0 (63 tests, 0 suites, 0 failures); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/controls.ts --max-warnings=0` exit 0; `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS` exit 0 (`ACCESSORIES_HEADERS_OK files=2`); `node_modules/.bin/fallow audit --base 4c143ebad681cf602e787b8c2ea09b050d8a9518 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | header-only |
| CR-05-CONTROLS-007 | `src/accessories/controls.ts` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/controls.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/controls.test.js` exit 0 (63 tests, 0 suites, 0 failures); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/controls.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base 4c143ebad681cf602e787b8c2ea09b050d8a9518 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | comment moved byte for byte: the 19-line refusal order note now sits directly above `const LOCAL_REFUSALS`, below the two cause constants |
