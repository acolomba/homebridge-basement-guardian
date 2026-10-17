---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 2
reviewed: 2026-10-17T20:28:55Z
depth: deep
source_revision: 858fb2c550fd4aa10d378f8611961034e7458299
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 1
  warning: 2
  total: 3
status: issues_found
reviewer: gsd-code-reviewer (correction round 2)
---

# Phase 5 CONTROLS batch: correction round 2

I read every line of both files in full at `858fb2c550fd4aa10d378f8611961034e7458299`. Before I
started, `git rev-parse HEAD` printed that revision and `git status --porcelain` printed nothing.
Since round 1 (`b86e6b0`), `src/accessories/controls.ts` changed in `854d5d1` and `7790818`, and
`test/accessories/controls.test.ts` changed in `7790818`, `f96f63c` and `75b9825`. No other
`src`, `test` or `features` path changed.

I used these inputs:

- AGENTS.md;
- the three `.agents/skills` books, each `SKILL.md` with every `rules/*.md` file (they win over
  `.claude/rules/*.md`);
- `05-CONTEXT.md`, `05-REVIEW-PROTOCOL.md`, the CONTROLS rows of `05-FINDINGS.md` (findings, the
  round-0 and round-1 counter rows, the genuine bug histories and `### 05-04`),
  `05-CONTROLS-REVIEW.md` and `05-CONTROLS-REVIEW-R1.md` with their triage and repair history;
- D-037 and D-038 (`.planning/intel/decisions.md:788-830`), and CTRL-03 and CTRL-05
  (`.planning/milestones/v1.0-REQUIREMENTS.md:67, 69`);
- `features/lib/hap.ts`, `src/accessories/serviceCatalogue.ts:541-545, 974-978` (the control row
  and `publishValue`), `src/accessories/basementGuardian.ts:571-705` (the consumer's `reported`
  closure and `republish`), `src/runtime/commandPort.ts` and `src/runtime/timers.ts`, and the
  accessory case 'WR-02 returns the Switch to the value the device reported when a press is
  refused during shadow silence' (`test/accessories/basementGuardian.test.ts:2836-2898`).

Opening open set: 4. Confirmed fixed: 4. Still open: 0. Reopened: 0. New: 3 (1 BLOCKER, 2
WARNING). Closing: 3.

## Round status

### Opening IDs

- **CR-05-CONTROLS-030** fixed (`f96f63c`). Each named comment now matches the file:
  - `PRECEDENCE` (433-434) says "Three other pairs have their own cases: transport over fresh
    state, transport over the quiet path, and the quiet path over fresh state". It names no
    position. Those cases are at 1106, 1148 and 1173.
  - `RefusalCase` (210-218) says "The eight refusals one write against an idle control can meet",
    and limits the table claim to the cases that loop over `REFUSALS`, `LOCAL_REFUSALS` or
    `VENDOR_REFUSALS` (934, 944, 958, 978, 1009, 1037).
  - `refusingRestoredSwitch` (583) says "which most `bindRestoredControlRefusal` cases start from".
    Six of the seven restored cases call it. 'throws a HapStatusError with status -70412 from the
    handler a restored control carries' (1471) does not.
  - `boundSwitch` (166) says "which most `createControlBinder` cases start from". Only 823, 1037
    and 1375 build their own binder.
  - `asService` (52-54) says "where the code under test takes a Service". That also covers
    `bindRestoredControlRefusal` (593, 1479).
  - The fixer's further edits are also true: the statuses note (36), the `Deferral` JSDoc (59), the
    `recordingTimers` note and its `clearInterval` comment (93-94, 110), the cause-text note
    (383-386) and "the `PRECEDENCE` cases" (1104).
  - `grep` finds no "above" or "below" in any test comment.
- **CR-05-CONTROLS-031** fixed (`75b9825`). `warningLog` (68-70) and `silentLog` (86-88) each
  declare `function noop(): void { ... }`. `Object.assign(noop, ...)` is unchanged (72, 90). The
  file assigns no other named function as an arrow to a `const`.
- **CR-05-CONTROLS-032** fixed (`854d5d1`). The three comments now state the pending entry's life
  as the code runs it:
  - `requested` (481-486) names all three ends: "the device confirms it, the vendor refuses it, or
    the window closes". This matches `reconcile` (634-638), `refuseOutcome` (570-572) and
    `expire` (526-533).
  - `refuseLocally` (541-542) says the write "adds no pending entry and leaves an earlier entry
    and its window as they are". This matches `answerWrite`, which throws at 593 before
    `requested.set` at 600.
  - The accepted path (613-615) says "the device's own report or the window resolves it".
  - The commit changed comment lines only.
- **CR-05-CONTROLS-033** fixed (`11c32d2` RED evidence, `7790818` fix).
  - `outcomeWarning` (382-386) returns the coordinator's wording for `timed-out`: "The
    ${capability} request on ${deviceId} timed out and may still have reached the device. It is
    not retried."
  - The `vendor-error` branch is the earlier line byte for byte: "... did not take effect:
    ${failure}. It is not retried."
  - `refuseOutcome` logs it (575). The status (577), the single send (607), the clearing push
    (574) and the kept entry (570-572) did not change.
  - The comment at 565-566 ("the command may already have reached the device") and the line at
    384 now agree.
  - The test expects the new line at 339 (the exceeded-deadline row), 786 (the 009 regression
    case), 804 (the 033 regression case 'warns that a timed-out request may still have reached
    the device') and 930.
  - The evidence commit `11c32d2` is the parent of `7790818`.
  - In this round, the owner run reports 'warns that a timed-out request may still have reached
    the device' as passed.
  - The fixer's observation about the case at 917-932 is judged in CR-05-CONTROLS-034.

### Earlier fixed IDs

All 29 are still fixed. None reopened. The non-comment source diff from the batch base
`4c143eb` to HEAD is exactly the 008, 009 and 033 changes:

- `pending` in `ControlRequest`;
- `isAwaitingConfirmation` and its `LOCAL_REFUSALS` row;
- the moved cause constants;
- `outcomeWarning`;
- the `vendor-error` condition in `refuseOutcome`;
- `pending: requested.has(capability)`.

The other six refusal rows, their order, statuses and causes, the restored refusal, the expiry
line, the single send and the clearing push are unchanged (D-05).

- **CR-05-CONTROLS-001** still fixed: 'ignores a confirming report that lands after the window already closed' (1325-1341) compares the whole `warnings` array (1337-1340).
- **CR-05-CONTROLS-002** still fixed: line 12 imports `describe`. `describe('createControlBinder')` (626-1395) and `describe('bindRestoredControlRefusal')` (1397-1554) are top level and not nested. Every module-scope declaration (26-624) is above the first `describe`.
- **CR-05-CONTROLS-003** still fixed: `grep -i microtask` finds nothing in the file. `test/accessories/hapWriteFidelity.test.ts:375` 'survives a push queued as a microtask inside the handler, on both implementations' keeps the protection (D-13).
- **CR-05-CONTROLS-004** still fixed: 823-836 spy with `t.mock.method(characteristic, 'onSet')` and assert `onSetSpy.mock.callCount()`. Every `.bind(` hit is `ControlBinder.bind`.
- **CR-05-CONTROLS-005** still fixed: the only `// act & assert` markers are at 1053 and 1484, and each covers one `assert.rejects()`. The restored cases at 1399-1413 and 1498-1508 have separate act and assert phases.
- **CR-05-CONTROLS-006** still fixed: `as unknown as` occurs only at 50 (`HAP_NAMESPACE`) and 56 (inside the commented `asService`). Every call site uses `asService(...)` (D-11).
- **CR-05-CONTROLS-007** still fixed: the order note (334-357) is directly above `const LOCAL_REFUSALS` (358).
- **CR-05-CONTROLS-008** still fixed: production 225-226, 313-315, 365, 589. 'refuses a second on request while the first waits for the device, and sends one command' (729-759) is present and passes. A probe again gave `-70403` for the second press with one send (Toolchain evidence).
- **CR-05-CONTROLS-009** still fixed: `refuseOutcome` (569-578) calls `resolvePending` only for `vendor-error`. 'keeps the request pending when the vendor does not answer in time' (761-790), the row at 347 and the row at 840 expect pending `['self-test']`.
- **CR-05-CONTROLS-010** still fixed: `PRECEDENCE` (435-513, 11 rows) and `PENDING_PRECEDENCE` (518-561, 6 rows) run at 1190-1231. With 1106, 1148 and 1173, all 14 single-write pairs that can hold together, and the pending rule against each of the six other rules, have a case.
- **CR-05-CONTROLS-011** still fixed: 'attempts <cause> exactly once ...' (978-1007) runs every deferral, compares `{ thrown, pending, delays, cancelled }` with the row's hand-written values, and calls `verify(commands)`.
- **CR-05-CONTROLS-012** still fixed: 703-727 compare `{ pending, cancelled }` with `{ ['self-test'], [] }`.
- **CR-05-CONTROLS-013** still fixed: 838-873 (both vendor outcomes) and 1233-1259 (transport refusal) record `republish` before and after the clearing push.
- **CR-05-CONTROLS-014** still fixed: 877-893 changes `reported` between the refusal and the push. 1532-1553 changes the held value between the refusal and the push.
- **CR-05-CONTROLS-015** still fixed: `RESTORED_PRESSES` (621-624) drives presses of `true` and `false` through 1398-1467.
- **CR-05-CONTROLS-016** still fixed: `registeredHandler` (200-208). 1037-1066 cover all eight `REFUSALS` rows and 1471-1496 cover the restored handler. Each asserts `instanceof HAP.HapStatusError` and `hapStatus`.
- **CR-05-CONTROLS-017** still fixed: a scan of every `// act` block finds no `assert.` call. `assertRefused` is gone.
- **CR-05-CONTROLS-018** still fixed: `readOfSwitch` (605-611) is `async` and awaits the read inside its `try`. All callers await it (1453, 1458, 1504, 1525, 1549).
- **CR-05-CONTROLS-019** still fixed: 934-942 has one `test()` per `REFUSALS` row and asserts the row's named status.
- **CR-05-CONTROLS-020** still fixed: 147-153 state HAP's single `setHandler` slot with no replacement warning.
- **CR-05-CONTROLS-021** still fixed: 103-107 are in the present tense and quote the real WR-02 title (`test/accessories/basementGuardian.test.ts:2848`). 321-322 have no "now".
- **CR-05-CONTROLS-022** still fixed: 1143-1147 and 1168-1172 name "the quiet-live-path rule".
- **CR-05-CONTROLS-023** still fixed: every case that promises sends creates `mock<CommandPort>({ exactParams: true, name: 'commands' })` inside the case and calls `verify(commands)` last. `answeringCommands` (117-122) is a stub whose calls no case asserts. No `recordingCommands`, `anyTimes` or `It.isAny` is left.
- **CR-05-CONTROLS-024** still fixed: `acceptedOutcome()` (30-34) and per-row outcome factories. The `RefusalCase` fields are `readonly` (219-233).
- **CR-05-CONTROLS-025** still fixed: `src/accessories/controls.ts:1-8` is the D-01 header (`ACCESSORIES_HEADERS_OK files=2`).
- **CR-05-CONTROLS-026** still fixed: 26-29 say HAP assigns the refusal status after the handler throws. 334-335 say "The rules in the order they are evaluated. The first that applies answers the write".
- **CR-05-CONTROLS-027** still fixed: 87 says "the cases using this stub do not read the log".
- **CR-05-CONTROLS-028** still fixed: 109-111 and 158-162 are block bodies.
- **CR-05-CONTROLS-029** still fixed: 683-686 compare the whole delays `[30000]`. 971-974 compare the whole delays list with each row's `delaysAfterRefusal`.

Reopened: none.

## Findings

### CR-05-CONTROLS-034 - WARNING: Two cases have the same arrange, act and assert

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` ("A planned case names the behavior it proves; a verified case would fail if that behavior broke"). `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` What not to test ("Before writing a case, name the failure it catches ...; ... the case ... is a maintenance cost that proves nothing"). No book rule names duplicated cases word for word, so this is reviewer judgment from those two rules. It is a WARNING because no wrong implementation passes: the two cases fail together.
**Location:** `858fb2c550fd4aa10d378f8611961034e7458299:test/accessories/controls.test.ts:917-932` (the duplicate); `858fb2c550fd4aa10d378f8611961034e7458299:test/accessories/controls.test.ts:792-806` (the CR-05-CONTROLS-033 regression case); `858fb2c550fd4aa10d378f8611961034e7458299:test/accessories/controls.test.ts:337-350, 1009-1031` (the exceeded-deadline row and the exact-log loop)
**Issue:** The fixer of CR-05-CONTROLS-033 reported that the two cases are now the same. I confirmed it line by line:
- 'names the capability, the device and the cause in the one line a refusal logs, and quotes nothing else' (917-932) builds `answeringCommands(() => ({ accepted: false, failure: 'timed-out' }))` and `boundSwitch({ commands, log })` with the default `reported` of `false`. It then calls `writeRejection(service, true)` and compares `{ thrown, warnings }` with `{ thrown: OPERATION_TIMED_OUT, warnings: ['The self-test request on ${DEVICE_ID} timed out and may still have reached the device. It is not retried.'] }`.
- 'warns that a timed-out request may still have reached the device' (792-806) does exactly the same. The only difference is that it passes `warningLog(warnings)` inline instead of through a local `log`.
- 'logs the exact refusal for an exceeded deadline' (the 337-350 row through 1009-1031) runs the same write with the same gate facts (`reported: false`, not offline, transport ready, live path observable). It makes the same whole-value comparison.

No change to `controls.ts` can make one of these cases fail and not the others. Two titles now claim one proof. The broader title promises an AUTH-02 property of "the one line a refusal logs". The eight 'logs the exact refusal for <cause>' cases prove that property for every refusal, because each one compares the whole line. Before 033 the case pinned the old timed-out line, so it already repeated the exact-log row. 033 made it a copy of the new regression case as well.
**Fix:** Remove 917-932 in one `test(controls)` commit. Change no other case. Under P-05-03, record in the ledger where the protection lives:
- 'warns that a timed-out request may still have reached the device' (the active D-04 regression case, which stays byte for byte);
- the eight 'logs the exact refusal for <cause>' cases. Each compares the whole warning line, so a line that quotes anything else fails by name.

Do not remove the 792 case, because D-04 requires the regression case to stay active.
**Flags:** P-05-03 (the removal names where the protection lives). D-10 does not apply: 917-932 are not among the SC-02 lines, which are the refusal rows and the exact-log loop. The exact-log loop that carries the protection stays unchanged. Not a D-04 candidate.

### CR-05-CONTROLS-035 - WARNING: Two source comments give a count that the code exceeds

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does, as it stands); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation. Batch precedent: CR-05-CONTROLS-030 and 032 each grouped comments of one class into one cause. The R1 fixer of 030 also restated the test's "two-predicate gate" note on the same grounds.
**Location:** `858fb2c550fd4aa10d378f8611961034e7458299:src/accessories/controls.ts:89-92, 403-409`
**Issue:** Each comment gives a complete count ("the other half", "the one case"). The code, and the same file, show more:
- 89-92 (`commandTransportReady` JSDoc): "it is the other half of the gate: a press can be impossible either because the plugin cannot vouch for what the device is doing or because it has no route to send on". A half implies that the gate has two facts. Twenty lines later, `liveConfirmationObservable` (113-114) says "A third fact rather than a shade of the other two, because all three fail independently". `LOCAL_REFUSALS` (358-366) evaluates the transport, quiet-live-path and fresh-state facts as three separate rules. A reader of 89-92 alone gets the wrong shape of the gate.
- 403-409 (`clearRefusal`): "The push after it closes the one case a republish cannot: a row publishes `On` only while it can vouch for the reported value ...". A control row also withholds `On` while its capability is pending: `controlValues` publishes `undefined` for `On` when `input.pendingControls.has(capability)` (`src/accessories/serviceCatalogue.ts:544`). So the republish publishes no `On` in that case either.
  - Since CR-05-CONTROLS-008, every refusal by the pending rule (365) and every `PENDING_PRECEDENCE` refusal runs in that second case.
  - There, `reported` is defined, so the push publishes it and not "the value the characteristic already carries". A read-only probe of the compiled module showed this. After an accepted `true`, HAP held `true`. A second press of `true` or `false` was refused. The clearing push then moved `On` to the reported `false` while `pending` stayed `['self-test']` (Toolchain evidence).
  - That push is deliberate under WR-02 (`test/accessories/basementGuardian.test.ts:2836-2846`). The comment still names only one of the two cases it closes.
**Fix:** Comment-only, one `docs(controls)` commit. Change no code or literal:
- 89-92: "it is one fact of the gate: a press can be impossible because the plugin cannot vouch for what the device is doing or because it has no route to send on, and the two fail independently." Keep the rest of the paragraph.
- 403-409: "The push after it closes the cases a republish cannot. A row publishes `On` only while it can vouch for the reported value and while no request for it waits. While a request waits, the push publishes the reported value, so the Switch shows what the device said, not what was asked for (WR-02). While the control's own scope is untrustworthy, there is no reported value to publish. The push then carries the value the characteristic already serves, which states nothing new: HAP returns a stored status to `0` whatever value it is given (D-04, D-014)."
**Flags:** none. D-10 does not apply: SC-02 touched no source line. Not a D-04 candidate: the behavior is right, and only the comments are wrong.

### CR-05-CONTROLS-036 - BLOCKER: No controls case runs the clearing push while a request waits, so a push that keeps the requested value passes

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` ("would a plausible wrong implementation still pass it?"). `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` Pairing and coverage ("That test module owns the source module's exported behavior"). `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: "a case a wrong implementation would pass (weak, missing, or replaced assertions ...)"). WR-02 (the locked accessory behavior: a refused press during a pending request returns the Switch to the device's reported value).
**Location:** `858fb2c550fd4aa10d378f8611961034e7458299:test/accessories/controls.test.ts:729-759, 838-873, 1210-1231` (the cases where a request waits during a refusal); production `858fb2c550fd4aa10d378f8611961034e7458299:src/accessories/controls.ts:410-414, 535-539, 554-559`
**Issue:** When a press is refused while a request waits, `armClearingPush` runs `clearRefusal(hap, service, republish, reported())`. That publishes the reported value over the requested `true` that HAP still holds from the accepted press. The row withholds `On` while pending (`serviceCatalogue.ts:544`), so this push is the only thing that decides what the Switch shows. The accessory relies on that: 'WR-02 returns the Switch to the value the device reported when a press is refused during shadow silence' (`test/accessories/basementGuardian.test.ts:2848-2898`) expects `afterTheAcceptedPress: true` and then `afterTheRefusedPress: false`. Its comment says that a push of the held value "showed a test running that no device had confirmed".

No case in the owner module observes this value:
- 'refuses a second on request while the first waits for the device, and sends one command' (729-759) and the six `PENDING_PRECEDENCE` cases (1210-1231) never run the clearing push.
- The timed-out row of 838-873 runs it while the entry is kept, but HAP holds `false` there (the rejected write did not move it). A push of the held value and a push of the reported value are the same `false`.
- 'pushes the reported value the accessory answers when the clearing push runs' (877-893) and every other push case run with nothing pending.

A plausible wrong binder pushes the held value while the capability is pending, for example `publishValue(service, hap.Characteristic.On, requested.has(capability) ? heldOn(hap, service) : (reported ?? heldOn(hap, service)))`. It passes all 103 controls cases. This is not an idle example. D-037's literal text, "HAP then holds the requested Switch value while confirmation remains pending", and the binder's own note at 596-597 ("the accessory's next update cannot snap the toggle back before the device confirms") both invite this "fix". I nearly classified the current behavior as a bug myself before I found WR-02. Only the consumer's accessory case would catch it. Direct pair coverage, which the project gates on, would not.
**Fix:** One `test(controls)` commit. Change no production line and do not edit the D-04 regression case at 729-759. Add one case in `describe('createControlBinder')`, for example 'returns the Switch to the reported value when a press is refused while a request waits':
- arrange: a strict mock that accepts one `send(DEVICE_ID, 'self-test', true)`, `recordingTimers()`, and `boundSwitch({ commands, timers }, () => false)`; then `await onCharacteristic(service).handleSetRequest(true)`;
- act: `const thrown = await writeRejection(service, true);`, then capture `{ value, statusCode }`, then run `clearingPushesIn(deferrals)`;
- assert one whole value, `{ thrown: RESOURCE_BUSY, pending: ['self-test'], afterTheRefusal: { value: true, statusCode: RESOURCE_BUSY }, afterTheClearingPush: { value: false, statusCode: SUCCESS } }`, then `verify(commands)`.

Optionally, run the same push check over the `PENDING_PRECEDENCE` rows in a sibling loop, with no branch in the body. Control (D-04 assertion control): apply the wrong binder above temporarily, then build. The new case must fail on its `afterTheClearingPush.value`. Then restore the exact source blob.
**Flags:** Not a D-04 production bug: the current behavior is what WR-02 decided. The tension with D-037's literal wording is recorded under Candidates for the coordinator. D-10 does not apply, because the fix adds a new case and touches no SC-02 line. Not D-13 or D-16: the binder's push value is plugin behavior, not stand-in behavior.

## Candidates considered and not filed

- **The clearing push during a pending request moves `On` from the requested `true` to the reported `false`** (`controls.ts:410-414, 535-539`).
  - I first read this as a genuine bug. D-037 says "HAP then holds the requested Switch value while confirmation remains pending". The note at 596-597 says the toggle cannot snap back before the device confirms. A probe showed the snap-back for a refused second `true` and a refused `false` (Toolchain evidence).
  - Not filed as a bug. The accessory case 'WR-02 returns the Switch to the value the device reported when a press is refused during shadow silence' (`test/accessories/basementGuardian.test.ts:2836-2898`) says this is deliberate. It pins `afterTheRefusedPress: false` and calls a push of the held value "requested state presented as reported state (RES-04, D-07, D-037, WR-02)".
  - The note at 596-597 speaks of "the accessory's next update", which does withhold `On`, so it is not false.
  - The missing owner case is CR-05-CONTROLS-036, and the incomplete comment is part of CR-05-CONTROLS-035. The coordinator may want to record that WR-02 is the reading of D-037 that the code follows.
- **Subset cases with narrower titles.**
  - 'arms one 30000 millisecond window when a command is sent' (1261-1274) is a subset of the delays assertion in 'sends one on request, ...' (660-689).
  - 'clears the pending entry on the reported value the request asked for' (691-701) is a subset of 'cancels the window and clears the entry when the device confirms the request' (1276-1287).
  - 'answers <status> for <cause>' (934-942) is a subset of 'logs the exact refusal for <cause>' (1009-1031). The coordinator chose that form under CR-05-CONTROLS-019.
  - Each one names one behavior and fails when that behavior breaks. A narrower case is not a copy, and no rule forbids it. Not filed. CR-05-CONTROLS-034 differs because its two cases have identical code under two different claims.
- **The three "names the ..." cases (1068-1083, 1085-1100, 1126-1141)** repeat the inputs of three `LOCAL_REFUSALS` rows. Each one also combines the exact line with a strict mock that sees no send, and no single row case makes that combination. Their titles are accurate, and they predate this batch. Not filed.
- **"it fails independently of the one below" (`controls.ts:259-261`)**. The rule directly below is the quiet-live-path rule. The example, "a fresh live report can arrive while authentication has not completed", fits it: a live report arriving means the live path is not quiet while the transport is not ready. It also fits the fresh-state rule. True as written. Not filed.
- **`refuses a write of false, ...` (627-646) asserts the status after the push in a second `assert.strictEqual`.** The title promises the stored value at the refusal, and the first whole-value assertion pins it. The status after the push is an extra check, not a split of one promised value. Not filed.
- **The new `outcomeWarning` (382-386).** The name is a noun phrase, like `statusOf` and `heldOn` in the same file. The `vendor-error` branch interpolates `${failure}`, which can only be `'vendor-error'` because `CommandFailure` has two members (`src/runtime/commandPort.ts:22`). Its comment and the `refuseOutcome` comment agree. Not filed.
- **Round-1 rejections, rechecked and still not filed:**
  - "three middle rules" (`controls.ts:337`);
  - the `liveConfirmationObservable` "could" (`controls.ts:120-123`);
  - the comment inside a case (`controls.test.ts:990`, kept by the coordinator);
  - `OnSetCall.arguments` (194-195);
  - the inline `try`/`catch` in the D-04 regression cases (738-745, 769-776);
  - `windowsIn(deferrals)[0]?.handle` (1286);
  - the late `vendor-error` against a newer entry;
  - the per-accessory rows (1375-1394);
  - `refuse()` with no `// arrange` (934-942).

## Header inspection

- `src/accessories/controls.ts`: conforms to D-01. Line 1 is `// SPDX-License-Identifier: MIT`, line 2 is empty, 3-5 hold the copyright block (`Copyright (c) 2026 Alessandro Colomba`), line 6 is empty, 7-52 hold the `@fileoverview` block, line 53 is empty, and the first import is at 54.
- `test/accessories/controls.test.ts`: conforms to D-01. Line 1 is the SPDX line, line 2 is empty, 3-5 hold the copyright block, line 6 is empty, 7-9 hold the `@fileoverview` block, line 10 is empty, and the first import is at 11.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS` printed `ACCESSORIES_HEADERS_OK files=2`, exit 0.

## Toolchain evidence

All commands ran from the repository root at `858fb2c550fd4aa10d378f8611961034e7458299` with a
clean tree, each prefixed with `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. Node
`v26.12.0`, npm `11.20.0`, start 2026-10-17T20:22:48Z. Before linting, I deleted the ESLint cache
(`node_modules/.cache/eslint`), so the lint result is fresh. No command was piped, so each raw
exit below is the command's own exit. The owner run's output went to a file in the session
scratch directory, and I read its summary from that file.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both projects compile |
| `node_modules/.bin/eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | compiled |
| `node --test dist-test/test/accessories/controls.test.js` | 0 | tests 103, suites 2, pass 103, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | 0 | no output (the pair is at 100% alone) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

Read-only probe (no file written, no source changed):

- I ran `node --input-type=module -e ...`. It imported the compiled
  `dist-test/src/accessories/controls.js` and `dist-test/features/lib/hap.js` with made-up inputs:
  `dev-1`, a port that accepts every send, and `reported` fixed at `false`.
- For each second press of `true` and `false`, it made an accepted first `true` write, then the
  second press, then ran the delay-0 deferrals. Exit 0.
- Output, second press `true`: `afterAccepted: true`, `thrown: -70403`, `afterSecond: true`,
  `afterClearingPush: false`, `pending: ["self-test"]`, warning `Refused self-test on dev-1: an
  earlier request is still waiting for the device to confirm it.`
- Output, second press `false`: `thrown: -70412`, `afterSecond: true`, `afterClearingPush: false`,
  `pending: ["self-test"]`, warning `Refused self-test on dev-1: only an on request is supported,
  and the device reports when the condition ends.`
- These results support CR-05-CONTROLS-035 and 036, and CR-05-CONTROLS-008 still holds.

Every check passes. The three findings are a duplicated case, two comments and a missing case.
The checks cannot see these.

## Out-of-scope observations

- `src/runtime/commandPort.ts:21` (Phase 4 PORTS batch, closed): the `CommandFailure` JSDoc still reads "Why a command did not take effect". That union includes `timed-out`, and the binder now logs that a timed-out request may still have reached the device. Round 1 recorded this for the phase verifier, and it is unchanged.
- `test/accessories/basementGuardian.test.ts:2843-2846` (ACCESSORY batch, plans 05-06 and 05-07): "Before the two halves read one rule the write path sampled nothing at all here, and the push fell back to the value HomeKit's own request had left standing" narrates an earlier shape of the code. That is the narration rule of `.agents/skills/typescript-style/rules/comments.md`. The ACCESSORY review should judge it.
- `.planning/intel/decisions.md` D-037 ("HAP then holds the requested Switch value while confirmation remains pending") reads against the WR-02 behavior. Under WR-02, a refusal during a pending request returns the Switch to the reported value. The code and the accessory case follow WR-02. A decision-record note would stop the next reader from treating the WR-02 behavior as a bug. This is for the maintainer and gets no CR-05 ID.

---

_Reviewed: 2026-10-17T20:28:55Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 2)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. Opening 4, fixed 4, rejected 0, new 3, reopened 0,
closing 3. The open count fell from 4 to 3 with no reopen in round 2, so the result is
`continue` (D-03 as amended, D-18). CR-05-CONTROLS-001 to 029 stay fixed.

- **CR-05-CONTROLS-030 to 033:** `fixed`, as the Round status shows.
- **CR-05-CONTROLS-034:** `open`, WARNING. The older case 'names the capability, the device and
  the cause in the one line a refusal logs, and quotes nothing else' goes. The D-04 regression
  case 'warns that a timed-out request may still have reached the device' stays, because a
  regression case is never removed. With the 'logs the exact refusal for ...' rows, it keeps the
  protection (P-05-03).
- **CR-05-CONTROLS-035:** `open`, WARNING.
- **CR-05-CONTROLS-036:** `open`, BLOCKER. The behavior to pin is the decided one. The WR-02 case
  in `test/accessories/basementGuardian.test.ts` says that a refused press while a request waits
  returns the Switch to the device's reported value, not the requested one, because the requested
  value must not show as reported state (RES-04, D-07, D-037). D-037's "HAP then holds the
  requested Switch value while confirmation remains pending" covers an accepted write. A refusal's
  clearing push must publish a value, and WR-02 decides which one. The coordinator therefore
  records the reviewer's D-037 observation without escalating it. The owner case uses the pending
  refusal from 008 and pushes the reported value. Its assertion control is a binder that pushes
  the held requested value while a request waits.
- **Out-of-scope observations:** the history narration at
  `test/accessories/basementGuardian.test.ts:2843-2846` goes to the ACCESSORY batch.
  `src/runtime/commandPort.ts:21` is already recorded in round 1.
- **Repair order:** the source comments (035); then the owner case (036); then the duplicate
  (034).
