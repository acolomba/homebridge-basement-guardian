---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 3
reviewed: 2026-10-17T20:46:00Z
depth: deep
source_revision: 207d5460d50789ae04b7b5ecdd712dc7ff5dfa88
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 0
  warning: 2
  total: 2
status: issues_found
reviewer: gsd-code-reviewer (correction round 3)
---

# Phase 5 CONTROLS batch: correction round 3

I read every line of both files in full at `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88`. Before I
started, `git rev-parse HEAD` printed that revision and `git status --porcelain` printed nothing.
Since round 2 (`858fb2c`), `src/accessories/controls.ts` changed only in `3e879b6`, and
`test/accessories/controls.test.ts` changed only in `9627362` and `5f5a828`. No other `src`,
`test` or `features` path changed.

I used these inputs:

- AGENTS.md;
- the three `.agents/skills` books, each `SKILL.md` with every `rules/*.md` file (they win over
  `.claude/rules/*.md`);
- `05-CONTEXT.md`, `05-REVIEW-PROTOCOL.md`, the CONTROLS rows of `05-FINDINGS.md` (findings,
  counter rows for rounds 0 to 2, genuine bug histories and `### 05-04`), and
  `05-CONTROLS-REVIEW.md`, `05-CONTROLS-REVIEW-R1.md` and `05-CONTROLS-REVIEW-R2.md` with their
  triage and repair history;
- D-037 and D-038 (`.planning/intel/decisions.md:787-830`), CTRL-03 and CTRL-05
  (`.planning/milestones/v1.0-REQUIREMENTS.md:67, 69`), and the WR-02 case
  (`test/accessories/basementGuardian.test.ts:2836-2895`, read only);
- `features/lib/hap.ts` (the stand-in's `handleSetRequest` and `handleGetRequest`,
  `features/lib/hap.ts:316-348`);
- the consumers that the findings depend on: `src/accessories/serviceCatalogue.ts:541-545`
  (`controlValues`), `src/accessories/basementGuardian.ts:545-605` (`decodedControlValue`,
  `reportedControlValue`, `commandTransportReady`, `liveConfirmationObservable`), and the runtime
  port `src/runtime/accountRuntime.ts:1137-1158` and `src/runtime/commandPort.ts`.

Opening open set: 3. Confirmed fixed: 3. Still open: 0. Reopened: 0. New: 2 (0 BLOCKER, 2
WARNING). Closing: 2.

## Round status

### Opening IDs

- **CR-05-CONTROLS-034** fixed (`5f5a828`).
  - 'names the capability, the device and the cause in the one line a refusal logs, and quotes
    nothing else' is gone. A search for "quotes nothing else" and "names the capability, the
    device and the cause" in the file finds nothing.
  - The D-04 regression case 'warns that a timed-out request may still have reached the device'
    (792-806) is present, unchanged, and passes.
  - The eight 'logs the exact refusal for <cause>' cases (1022-1044) each compare the whole
    warning line. They keep the protection (P-05-03).
  - The commit removed 17 lines and added none. `warningLog`, `answeringCommands`, `boundSwitch`,
    `writeRejection`, `OPERATION_TIMED_OUT` and `DEVICE_ID` still have other users, and ESLint
    reports no unused symbol.
- **CR-05-CONTROLS-035** fixed (`3e879b6`).
  - `commandTransportReady` JSDoc (89-95): "the other half of the gate" is gone. The text now says
    "it is one fact of the gate".
  - `clearRefusal` note (401-412): "closes the one case a republish cannot" is gone. The note now
    names a waiting request (the push publishes the reported value, WR-02) and an untrustworthy
    scope (the push carries the held value). It also matches the catalogue row:
    `src/accessories/serviceCatalogue.ts:544` withholds `On` while
    `input.pendingControls.has(capability)`.
  - The commit changed comment lines only: the non-comment diff from the batch base to HEAD is
    the same as at round 2 (see Earlier fixed IDs).
  - The 035 edit left two defects of a different kind in the same two comments. They are a new
    cause, CR-05-CONTROLS-037, not a reopen: the counts that 035 named ("the other half", "the one
    case") did not return.
- **CR-05-CONTROLS-036** fixed (`9627362`).
  - 'returns the Switch to the reported value when a press is refused while a request waits'
    (895-923) is in `describe('createControlBinder')`.
  - A strict mock accepts exactly one `send(DEVICE_ID, 'self-test', true)`. The case captures
    `afterTheAcceptedPress`, refuses a second `true` through the pending rule, and runs only the
    delay-0 push. It compares one whole value
    `{ thrown: RESOURCE_BUSY, afterTheAcceptedPress: true, afterThePush: false, statusCode: SUCCESS, pending: ['self-test'] }`
    and then calls `verify(commands)`.
  - The wrong binder from round 2 (a push of the held value while a request waits) gives
    `afterThePush: true` and fails this case. The fixer's control in the R2 repair history shows
    this failure, with the blob restored.
  - The case passes in this round's owner run. The D-04 regression case at 729-759 is unchanged.

### Earlier fixed IDs

All 33 are still fixed. None reopened. The non-comment source diff from the batch base `4c143eb`
to HEAD is exactly the 008, 009 and 033 changes:

- `pending` in `ControlRequest`;
- `isAwaitingConfirmation` and its `LOCAL_REFUSALS` row;
- the moved cause constants;
- `outcomeWarning`;
- the `vendor-error` condition in `refuseOutcome`;
- `pending: requested.has(capability)`.

The other six refusal rows, their order, statuses and causes, the restored refusal, the expiry
line, the single send and the clearing push are unchanged (D-05). Every fix commit listed in the
dispatch is an ancestor of HEAD (`git merge-base --is-ancestor`).

- **CR-05-CONTROLS-001** still fixed: 'ignores a confirming report that lands after the window already closed' (1338-1354) compares the whole `warnings` array (1350-1353).
- **CR-05-CONTROLS-002** still fixed: line 12 imports `describe`. `describe('createControlBinder')` (626-1408) and `describe('bindRestoredControlRefusal')` (1410-1567) are top level and not nested. Every module-scope declaration (26-624) is above the first `describe`.
- **CR-05-CONTROLS-003** still fixed: the file contains no "microtask". `test/accessories/hapWriteFidelity.test.ts:375` 'survives a push queued as a microtask inside the handler, on both implementations' keeps the protection (D-13).
- **CR-05-CONTROLS-004** still fixed: 823-836 spy with `t.mock.method(characteristic, 'onSet')` and assert `onSetSpy.mock.callCount()`. Every `.bind(` hit is `ControlBinder.bind` (171, 831, 832, 1063, 1375, 1397).
- **CR-05-CONTROLS-005** still fixed: the only `// act & assert` markers are at 1066 and 1497, and each covers one `assert.rejects()`.
- **CR-05-CONTROLS-006** still fixed: `as unknown as` occurs only at 50 (`HAP_NAMESPACE`) and 56 (inside the commented `asService`). Every call site uses `asService(...)` (D-11).
- **CR-05-CONTROLS-007** still fixed: the order note (334-357) is directly above `const LOCAL_REFUSALS` (358).
- **CR-05-CONTROLS-008** still fixed: production 225-226, 313-315, 365 and 592. 'refuses a second on request while the first waits for the device, and sends one command' (729-759) is present and passes.
- **CR-05-CONTROLS-009** still fixed: `refuseOutcome` (572-581) calls `resolvePending` only for `vendor-error` (573-575). 'keeps the request pending when the vendor does not answer in time' (761-790), the row at 347 and the row at 840 expect pending `['self-test']`.
- **CR-05-CONTROLS-010** still fixed: `PRECEDENCE` (435-513, 11 rows) and `PENDING_PRECEDENCE` (518-561, 6 rows) run at 1203-1244. With 1119, 1161 and 1186, all 14 single-write pairs that can hold together, and the pending rule against each of the six other rules, have a case.
- **CR-05-CONTROLS-011** still fixed: 'attempts <cause> exactly once ...' (991-1020) runs every deferral, compares `{ thrown, pending, delays, cancelled }` with the row's hand-written values, and calls `verify(commands)`.
- **CR-05-CONTROLS-012** still fixed: 703-727 compare `{ pending, cancelled }` with `{ ['self-test'], [] }`.
- **CR-05-CONTROLS-013** still fixed: 838-873 (both vendor outcomes) and 1246-1272 (transport refusal) record `republish` before and after the clearing push.
- **CR-05-CONTROLS-014** still fixed: 877-893 changes `reported` between the refusal and the push. 1545-1566 changes the held value between the refusal and the push.
- **CR-05-CONTROLS-015** still fixed: `RESTORED_PRESSES` (621-624) drives presses of `true` and `false` through 1411-1480.
- **CR-05-CONTROLS-016** still fixed: `registeredHandler` (200-208). 1050-1079 cover all eight `REFUSALS` rows and 1484-1509 cover the restored handler. Each asserts `instanceof HAP.HapStatusError` and `hapStatus`.
- **CR-05-CONTROLS-017** still fixed: a scan of every `// act` block finds no `assert.` call. `assertRefused` is gone.
- **CR-05-CONTROLS-018** still fixed: `readOfSwitch` (605-611) is `async` and awaits the read inside its `try`. All callers await it (1466, 1471, 1517, 1538, 1562).
- **CR-05-CONTROLS-019** still fixed: 947-955 has one `test()` per `REFUSALS` row and asserts the row's named status.
- **CR-05-CONTROLS-020** still fixed: 147-153 state HAP's single `setHandler` slot with no replacement warning.
- **CR-05-CONTROLS-021** still fixed: 103-107 are in the present tense and quote the real WR-02 title (`test/accessories/basementGuardian.test.ts:2848`). 321-322 have no "now".
- **CR-05-CONTROLS-022** still fixed: 1156-1160 and 1181-1185 name "the quiet-live-path rule".
- **CR-05-CONTROLS-023** still fixed: every case that promises sends creates `mock<CommandPort>({ exactParams: true, name: 'commands' })` inside the case and calls `verify(commands)` last, the new 036 case included (900, 922). `answeringCommands` (117-122) is a stub whose calls no case asserts. No `recordingCommands`, `anyTimes` or `It.isAny` is left.
- **CR-05-CONTROLS-024** still fixed: `acceptedOutcome()` (30-34) and per-row outcome factories. The `RefusalCase` fields are `readonly` (219-233).
- **CR-05-CONTROLS-025** still fixed: `src/accessories/controls.ts:1-8` is the D-01 header (`ACCESSORIES_HEADERS_OK files=2`).
- **CR-05-CONTROLS-026** still fixed: 26-29 say that HAP assigns the refusal status after the handler throws. 334-335 say "The rules in the order they are evaluated. The first that applies answers the write".
- **CR-05-CONTROLS-027** still fixed: 87 says "the cases using this stub do not read the log".
- **CR-05-CONTROLS-028** still fixed: 109-111 and 158-162 are block bodies.
- **CR-05-CONTROLS-029** still fixed: 683-686 compare the whole delays `[30000]`. 984-987 compare the whole delays list with each row's `delaysAfterRefusal`.
- **CR-05-CONTROLS-030** still fixed: `PRECEDENCE` (433-434), `RefusalCase` (210-218), `refusingRestoredSwitch` (583), `boundSwitch` (166) and `asService` (52-54) still match the file. No test comment uses "above" or "below" for a file position. The two hits at 1159 and 1184 name positions in the rule table. The 030 fixer also restated the comment at 1117-1118, which was not one of the five named comments. Its new defect is CR-05-CONTROLS-038, a new cause and not a reopen (see that finding).
- **CR-05-CONTROLS-031** still fixed: `warningLog` (68-70) and `silentLog` (86-88) each declare `function noop(): void { ... }`.
- **CR-05-CONTROLS-032** still fixed: `requested` (484-489) names all three ends of an entry. `refuseLocally` (544-545) says the write adds no entry and leaves an earlier one. The accepted path (616-618) says "the device's own report or the window resolves it".
- **CR-05-CONTROLS-033** still fixed: `outcomeWarning` (382-386) gives the timed-out line "timed out and may still have reached the device", and `refuseOutcome` logs it (578). The `vendor-error` line is the earlier text byte for byte. The test expects the new line at 339, 786 and 804.

Reopened: none.

## Findings

### CR-05-CONTROLS-037 - WARNING: Two source comments restated by the 035 fix still describe a case the code handles differently

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does, as it stands); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation. Batch precedent: CR-05-CONTROLS-030, 032 and 035 each grouped comments of one class into one cause.
**Location:** `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88:src/accessories/controls.ts:89-95, 404-412`
**Issue:** Each comment gives a claim that the same file, or the code under it, contradicts.

- **89-95 (`commandTransportReady` JSDoc).** The paragraph says that a press can be impossible
  "because the plugin cannot vouch for what the device is doing or because it has no route to
  send on, and the two fail independently". It gives two examples. The second example, "a poll
  can keep succeeding while the live path has gone quiet", shows a working route while the plugin
  "cannot vouch for what the device is doing". That is not what the code or the file says
  happens:
  - `liveConfirmationObservable` (113-115) names this exact condition as "A third fact rather than
    a shade of the other two ... The plugin can hold a route to send on and a freshly reported
    value to act from and still be unable to see the answer".
  - The order note (347-349) says "during that silence the state is not missing: the poll
    delivered it and the tile is showing it".
  - The consumer agrees: `reportedControlValue` keeps the decoded value for a scope withdrawn
    because the plugin is seeing less (`src/accessories/basementGuardian.ts:558-572`), and
    `liveConfirmationObservable` answers `!monitoring.shadowSilent` (603-605). The WR-02 case
    pushes the reported `false` during shadow silence
    (`test/accessories/basementGuardian.test.ts:2885-2893`).

  So the example describes the quiet-live-path rule (`cannotSeeAConfirmation`, 361), not the
  fresh-state rule. A reader of 89-95 alone files the quiet live path under the wrong fact.
  "The wrong thing half the time" also rests on the two-way split. The 035 fix replaced "the
  other half" and kept the rest of the paragraph, as round 2 proposed. This defect was already in
  the paragraph at the batch base. It is not the count that 035 named.
- **404-407 (`clearRefusal`).** "While a request waits, the push publishes the reported value, so
  the Switch shows what the device said, not what was asked for (WR-02)." This is not true when a
  request waits and the control's scope has no reported value. `clearRefusal` then publishes
  `heldOn` (416). The held value is the requested `true` that the accepted press left, so the
  Switch shows what was asked for. A read-only probe of the compiled module showed this (Toolchain
  evidence):
  - a press of `true` was accepted;
  - `reported` then answered `undefined`;
  - a second `true` was refused by the fresh-state rule (`-70412`);
  - after the clearing push, `On` was still `true`, the status was `0`, and `pending` was
    `['self-test']`.

  The next sentence ("While the control's own scope is untrustworthy ... carries the value the
  characteristic already serves") describes the fallback. However, the first sentence gives no
  exception, and the two sentences disagree where they overlap. The behavior is consistent with
  D-037 ("HAP then holds the requested Switch value while confirmation remains pending") and
  invents no value. Only the comment is wrong.

**Fix:** One comment-only `docs(controls)` commit. Change no code, literal or order.

- 89-95: give the second example the fresh-state fact and name the live path as the third fact.
  For example: "... and the two fail independently. A fresh live report can arrive while REST
  authentication has not completed, and a poll can succeed while the capability's own reported
  field has not decoded, so a single readiness answer would tell a user diagnosing a refused press
  the wrong thing. A quiet live path is a third fact, `liveConfirmationObservable`." Keep the rest
  of the JSDoc.
- 404-412: make the first case conditional on a reported value. For example: "While a request
  waits and the control's scope still carries a reported value, the push publishes that value, so
  the Switch shows what the device said, not what was asked for (WR-02). While the control's own
  scope is untrustworthy, there is no reported value to publish, and without a push the status
  would stand and the Switch would stay unreadable. The push then carries the value the
  characteristic already serves. While a request waits, that is the value the accepted press
  left. It states nothing new: HAP returns a stored status to `0` whatever value it is given
  (D-04, D-014)."

**Flags:** none. D-10 does not apply, because SC-02 touched no source line. It is a new cause on lines that the CR-05-CONTROLS-035 fix (`3e879b6`) touched, not a reopen of 035: "the other half" and "the one case" did not return. Not a D-04 candidate, because the behavior matches D-037 and WR-02.

### CR-05-CONTROLS-038 - WARNING: A test comment says the `PRECEDENCE` cases pin every other pair, and the `PRECEDENCE` comment says two pairs have their own cases

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does, as it stands); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation
**Location:** `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88:test/accessories/controls.test.ts:1115-1118` (the claim); `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88:test/accessories/controls.test.ts:433-434, 1156-1201` (what contradicts it)
**Issue:** The comment above 'names the missing transport alone when the plugin has neither fresh
state nor a way to send' ends: "This case pins that one pair; the `PRECEDENCE` cases pin the other
pairs that can hold together (D-07)." The file contradicts it:

- `PRECEDENCE` (435-513) has 11 rows. The other single-write pairs that can hold together are 13.
- The `PRECEDENCE` comment (433-434) itself says "Three other pairs have their own cases:
  transport over fresh state, transport over the quiet path, and the quiet path over fresh
  state."
- Transport over the quiet path is 1161-1179, and the quiet path over fresh state is 1186-1201.
  Neither one is a `PRECEDENCE` row. A reader who trusts 1117-1118 and edits only the table can
  think that both pairs are covered there.

`git blame` attributes line 1117 to `f96f63c`, the CR-05-CONTROLS-030 fix. That fix changed "the
precedence cases below" to "the `PRECEDENCE` cases" as a further instance of the position-word
class. This turned a general phrase into the name of one table that does not hold two of the
pairs. It is a new cause and not a reopen of 030: the five comments that 030 named still match the
file, and no position word returned. It is also not a reopen of CR-05-CONTROLS-010, because every
pair still has a case. Only the attribution is wrong.
**Fix:** One comment-only `docs(controls)` commit. Change no code, title or literal. For example,
for 1117-1118: "This case pins that one pair. The `PRECEDENCE` cases and the two quiet-live-path
cases pin the other pairs one write can carry, and the `PENDING_PRECEDENCE` cases pin the pending
rule against each of the others (D-07)."
**Flags:** none. D-10 does not apply, because 1115-1118 are not SC-02 lines (the refusal rows and the exact-log loop). It is a new cause on a line that the CR-05-CONTROLS-030 fix touched, not a reopen.

## Candidates considered and not filed

- **No owner case runs the clearing push while a request waits and the scope has no reported
  value** (`controls.ts:416`; probe in Toolchain evidence).
  - The push publishes `heldOn`, which is the requested `true`. 'clears the refusal status from the held value of <held> when no reported value can be vouched for' (925-945) pins the same `reported ?? heldOn(...)` expression with nothing pending, and 036 pins the waiting case with a reported value.
  - A wrong binder that passes needs a branch only for a waiting request with no reported value, and that branch must push something other than the held value. The only candidate is an invented value such as `!accepted`. That would make an unknown value a guessed one, which the project's safety semantics forbid outright.
  - After CR-05-CONTROLS-037 restates 404-407, no comment invites it. Not filed. The coordinator may want an owner case if it wants the D-037 hold pinned for this overlap.
- **The 036 case comment "a requested value never shows as reported state (WR-02, D-037)"** (895-897).
  - The same case asserts `afterTheAcceptedPress: true`, which is a requested value. That is D-037's held value, and the row withholds `On` there, so it is not presented as reported state.
  - The phrase quotes WR-02's principle (`test/accessories/basementGuardian.test.ts:2843-2846`) for the push this case checks. True for the case it sits on. Not filed.
- **'answers the transport refusal status to every read until the clearing push lands'** (1246-1272) reads `statusCode` and makes no read.
  - The stand-in's read throws exactly when `statusCode` is not `0` (`features/lib/hap.ts:341-348`), and real HAP does the same. So the stored status and a read give the same answer.
  - The restored cases drive a read because a restored control's push carries the held value. Here the binder's part is only the push and its timing, and the assertion pins both. Not filed.
- **'holds one independent entry per capability, so clearing one leaves the other pending'** (1371-1384) does not read `cancelled`.
  - A `reconcile` that cancels every window would leave `alarm-mute` pending with no deadline.
  - That binder must iterate all entries to clear the wrong handle while it deletes only one key. I found no plausible refactor that does this: `resolvePending` reads one entry by key. 012's defect was a cancel before the compare on the same entry, which is a different shape. Not filed.
- **No owner case shows that `alarm-mute` sends `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` rather than a literal `true`** (243).
  - The constant is `true` (`src/accessories/alarmMute.ts:37`). No case can tell the two apart without module replacement, which `test-doubles.md` forbids.
  - The `alarmMute` pair owns the constant. Both branches of 243 are covered. Not filed.
- **"which is the pair the placement of the quiet-live-path rule decides"** (1156) and **"a symptom of the same silence more often than a fault of its own"** (1183-1184).
  - The first is read with "The other side of the placement" (1181). The two cases together are the two neighbours that the placement decides.
  - The second is a rationale for the order. It is not a claim about what the code does. Not filed.
- **`heldOn` is annotated `CharacteristicValue` but returns a boolean** (397-399). No book rule requires the narrowest annotation, and the annotation is not wrong. Not filed.
- **`commands.send` could reject instead of answering an outcome.** If it did, the handler would throw a non-`HapStatusError` and leave the entry pending with no clearing push. The port's contract answers an outcome. The only implementation catches every error into `{ accepted: false, failure }` (`src/runtime/accountRuntime.ts:1143-1158`). Not a controls finding.
- **Round-1 and round-2 rejections, rechecked and still not filed:** "three middle rules" (337); the `liveConfirmationObservable` "could" (120-123); the comment inside a case (1003, kept by the coordinator); `OnSetCall.arguments` (194-195); the inline `try`/`catch` in the D-04 regression cases (738-745, 769-776); `windowsIn(deferrals)[0]?.handle` (1299); the late `vendor-error` against a newer entry; the per-accessory rows (1388-1407); `refuse()` with no `// arrange` (947-955); the subset cases (691-701, 947-955, 1274-1287); the three "names the ..." cases (1081-1113, 1139-1154); "it fails independently of the one below" (259-261); the second `assert.strictEqual` at 644; `outcomeWarning` as a noun phrase.

## Header inspection

- `src/accessories/controls.ts`: conforms to D-01. Line 1 is `// SPDX-License-Identifier: MIT`, line 2 is empty, 3-5 hold the copyright block (`Copyright (c) 2026 Alessandro Colomba`), line 6 is empty, 7-52 hold the `@fileoverview` block, line 53 is empty, and the first import is at 54.
- `test/accessories/controls.test.ts`: conforms to D-01. Line 1 is the SPDX line, line 2 is empty, 3-5 hold the copyright block, line 6 is empty, 7-9 hold the `@fileoverview` block, line 10 is empty, and the first import is at 11.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS` printed `ACCESSORIES_HEADERS_OK files=2`, exit 0.

## Toolchain evidence

All commands ran from the repository root at `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88` with a
clean tree. Each command had the prefix `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. Node
`v26.12.0`, npm `11.20.0`, start 2026-10-17T20:40:59Z, end of the main run 2026-10-17T20:41:12Z.
Before linting, I deleted the ESLint cache (`node_modules/.cache/eslint`), so the lint result is
fresh. No command was piped, so each raw exit below is the command's own exit. The typecheck,
build and owner output went to files in the session scratch directory, and I read the summaries
from those files.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both projects compile |
| `node_modules/.bin/eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | compiled |
| `node --test dist-test/test/accessories/controls.test.js` | 0 | tests 103, suites 2, pass 103, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | 0 | only the npm banner, no failure (the pair is at 100% alone) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

The file has 44 `test(` calls. The loops expand them to 103 cases (103 before 036 and 034, then
104, then 103 again).

Read-only probe (no file written, no source changed):

- I ran `node --input-type=module -e ...`. It imported the compiled
  `dist-test/src/accessories/controls.js` and `dist-test/features/lib/hap.js` with made-up inputs:
  `dev-1`, a port that accepts every send, and gate facts that are all clear.
- It made an accepted press of `true` with `reported` at `false`. It then set `reported` to
  `undefined`, made a second press of `true`, and ran the delay-0 deferrals. Exit 0.
- Output: `{"afterAccepted":true,"thrown":-70412,"afterPush":true,"statusCode":0,"pending":["self-test"],"warnings":["Refused self-test on dev-1: the plugin has no fresh state for it."]}`.
- This supports the `clearRefusal` part of CR-05-CONTROLS-037 and the first candidate above.

Every check passes. The two findings are comments that the checks cannot see.

## Out-of-scope observations

- `src/runtime/commandPort.ts:21` (Phase 4 PORTS batch, closed): the `CommandFailure` JSDoc still reads "Why a command did not take effect". That union includes `timed-out`, which the binder now logs as possibly delivered. Rounds 1 and 2 recorded this for the phase verifier, and it is unchanged.
- `test/accessories/basementGuardian.test.ts:2843-2846` (ACCESSORY batch, plans 05-06 and 05-07): the history narration ("Before the two halves read one rule ...") is unchanged. Round 2 routed it to ACCESSORY.
- `src/accessories/basementGuardian.ts:566-569` (ACCESSORY batch): "A second copy is how the two came to disagree: the row was widened and this was not" narrates an earlier shape of the code, which is the narration rule of `.agents/skills/typescript-style/rules/comments.md`. The ACCESSORY review should judge it.

---

_Reviewed: 2026-10-17T20:46:00Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 3)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. Opening 3, fixed 3, rejected 0, new 2, reopened 0,
closing 2. The open count fell from 3 to 2 with no reopen in round 3, so the result is
`continue` (D-03 as amended, D-18). CR-05-CONTROLS-001 to 033 stay fixed.

- **CR-05-CONTROLS-034 to 036:** `fixed`, as the Round status shows.
- **CR-05-CONTROLS-037 and 038:** `open`, WARNING, comment-only, as reported. Each is a new
  cause in a comment that an earlier fix restated, not the return of a fixed defect.
- **Not filed:** the coordinator keeps the reviewer's rejection of an owner case for a clearing
  push while a request waits and no reported value exists. 'clears the refusal status from the
  held value of <held> when no reported value can be vouched for' already pins
  `reported ?? heldOn(...)` for both held values. A binder that passes it and still fails the
  overlap needs a branch for that overlap that pushes an invented value. No plausible change makes
  that branch.
- **Repair order:** 037 (source comments), then 038 (test comment).

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CONTROLS-037 | `src/accessories/controls.ts` | Node v26.12.0. `fallow guard src/accessories/controls.ts` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/controls.test.js` 0 (tests 103, suites 2, pass 103, fail 0); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` 0; `eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` 0 (fresh cache); `fallow audit --base 4c143eb` 0, verdict pass | n/a (WARNING) | Comment lines only. `commandTransportReady` JSDoc: drops the two-fact split, both examples and "half the time"; keeps one true reason (the route can be missing while a reported value is held, so the rule names its own cause). `clearRefusal` note: states what `reported ?? heldOn(...)` pushes (the reported value when there is one, else the held value) and drops the waiting-request claim. Same class, same file: `liveConfirmationObservable` "A third fact rather than a shade of the other two, because all three fail independently" becomes "A fact of its own rather than a shade of the route or the reported value" (the gate reads more than three facts); `cannotSeeAConfirmation` drops "a value the poll delivered" and "Nothing the plugin holds is missing here" (the rule also answers with no reported value, as the owner case 'names the quiet live connection alone when the reported field has also not decoded' shows); the order note's "three middle rules" names the transport, quiet-live-path and fresh-state rules (they are rows 2-4 of 7), with its paragraph reflowed. |
| CR-05-CONTROLS-038 | `test/accessories/controls.test.ts` | Node v26.12.0. `fallow guard test/accessories/controls.test.ts` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/controls.test.js` 0 (tests 103, suites 2, pass 103, fail 0); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` 0; `eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` 0 (fresh cache); `fallow audit --base 4c143eb` 0, verdict pass | n/a (WARNING) | Comment lines only. The comment on 'names the missing transport alone when the plugin has neither fresh state nor a way to send' drops "This case pins that one pair; the `PRECEDENCE` cases pin the other pairs that can hold together" and keeps its reason. Same class, same file: the `PRECEDENCE` comment "The pairs one write can carry. Three other pairs have their own cases" becomes "The pairs one write can carry, but for three that have their own cases" (the table holds 11 of 14); the `RefusalCase` comment's "read this one table" becomes "read these rows" (two arrays and their concatenation); "The third fact of the gate, on its own" and "neither of the other two rules" become "The quiet live path on its own" (the gate reads more than three facts); "which is the pair the placement of the quiet-live-path rule decides" and "keeps its place at the top of the table" (the not-on rule is the top row) become "the transport rule is evaluated first"; "The other side of the placement" becomes "The quiet live path and a missing state", with its paragraph reflowed. |
| CR-05-CONTROLS-037 | `src/accessories/controls.ts` | Node v26.12.0. `fallow guard src/accessories/controls.ts` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/controls.test.js` 0 (tests 103, suites 2, pass 103, fail 0); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` 0; `eslint src/accessories/controls.ts --max-warnings=0` 0; `fallow audit --base 4c143eb` 0, verdict pass | n/a (WARNING) | Second commit, comment lines only. The order note's quiet-live-path paragraph is restated. The order between the quiet-live-path and fresh-state rules decides a press only when both apply, and then the reported value is missing, so "during that silence the state is not missing: the poll delivered it and the tile is showing it" described a case the order never decides. "keeps its place at the top" becomes "Of the three, the transport rule is evaluated first" (the not-on rule is the top row). The paragraph now says why the quiet live path is named when both hold: `confirmationObservable` is one binder-wide fact that blocks a press of any capability whatever the reading says, while `reported` is the capability's own field. It adds that both rules answer the same status, so the order changes only the cause. Anchors D-07, D-08 and WR-02 kept; no claim that the silence causes the missing value. |
