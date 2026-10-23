---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 1
reviewed: 2026-10-17T19:59:51Z
depth: deep
source_revision: b86e6b05549e3569ce3e4dae457efb97bd8d6485
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 0
  warning: 4
  total: 4
status: issues_found
reviewer: gsd-code-reviewer (correction round 1)
---

# Phase 5 CONTROLS batch: correction round 1

I read every line of both files in full at `b86e6b05549e3569ce3e4dae457efb97bd8d6485`. Before I
started, `git rev-parse HEAD` printed that revision and `git status --porcelain` printed nothing.
The last commit that touched `src/accessories/controls.ts` is `670ae89`, and the last commit that
touched `test/accessories/controls.test.ts` is `dbcbf07`.

I used these inputs:

- AGENTS.md;
- the three `.agents/skills` books, each `SKILL.md` with every `rules/*.md` file (they win over
  `.claude/rules/*.md`);
- `05-CONTEXT.md`, `05-REVIEW-PROTOCOL.md`, the CONTROLS rows of `05-FINDINGS.md` (the findings,
  the round-0 counter row, the genuine bug histories and `### 05-04`) and `05-CONTROLS-REVIEW.md`
  with its triage and repair history;
- D-037 and D-038 (`.planning/intel/decisions.md:787-828`), and CTRL-03 and CTRL-05
  (`.planning/milestones/v1.0-REQUIREMENTS.md:67, 69`);
- `features/lib/hap.ts` and the pinned `@homebridge/hap-nodejs` `Characteristic.js:1346-1353`
  (`onSet`) and `1786-1832` (`handleSetRequest`).

Opening open set: 29. Confirmed fixed: 29. Still open: 0. Reopened: 0. New: 4 (0 BLOCKER, 4
WARNING). Closing: 4.

## Round status

The source matches the locked decisions:

- D-037: `ControlRequest.pending` (225-226) is sampled as `requested.has(capability)` with the
  other facts (577). `isAwaitingConfirmation` (308-315) is appended last in `LOCAL_REFUSALS` (365).
  It answers `RESOURCE_BUSY` with the cause "an earlier request is still waiting for the device
  to confirm it".
- D-038: `refuseOutcome` (557-566) calls `resolvePending` only for `vendor-error`. A `timed-out`
  outcome keeps its entry and its window, and the window still runs `expire` 30 s after dispatch.
- D-05: `git diff 4c143eb HEAD -- src/accessories/controls.ts` shows that the other six rows of
  `LOCAL_REFUSALS`, their order, statuses and causes, the restored refusal, the three log-line
  templates, the single send and the clearing push did not change.

- **CR-05-CONTROLS-001** fixed: 'ignores a confirming report that lands after the window already closed' (1307-1323) compares the whole `warnings` array (1319-1322).
- **CR-05-CONTROLS-002** fixed: line 12 imports `describe`. `describe('createControlBinder')` (624-1377) and `describe('bindRestoredControlRefusal')` (1379-1536) are top level and not nested. Every module-scope declaration (26-622) is above the first `describe`. Three comments that the move made wrong are a new cause, not a reopen (CR-05-CONTROLS-030).
- **CR-05-CONTROLS-003** fixed: the stand-in-only microtask case is gone (`grep microtask` finds nothing). `test/accessories/hapWriteFidelity.test.ts:375` 'survives a push queued as a microtask inside the handler, on both implementations' keeps the protection (D-13).
- **CR-05-CONTROLS-004** fixed: 805-818 spy with `t.mock.method(characteristic, 'onSet')` and assert `onSetSpy.mock.callCount()`. No `Function.prototype.bind` is left (every `.bind(` hit is `ControlBinder.bind`).
- **CR-05-CONTROLS-005** fixed: the only `// act & assert` markers are at 1035 and 1466, and each covers one `assert.rejects()`. The restored cases at 1381-1394 and 1480-1490 have separate act and assert phases.
- **CR-05-CONTROLS-006** fixed: `as unknown as` occurs only at 50 (`HAP_NAMESPACE`) and 55 (inside the commented `asService`, 52-56). Every call site uses `asService(...)` (D-11).
- **CR-05-CONTROLS-007** fixed: the order note (334-357) is directly above `const LOCAL_REFUSALS` (358). The two cause constants and their own comments sit above it (321-332).
- **CR-05-CONTROLS-008** fixed: production 225-226, 308-315, 365, 577. 'refuses a second on request while the first waits for the device, and sends one command' (727-757) asserts `-70403`, pending `['self-test']`, delays `[30000, 0]`, cancelled `[]`, the exact line and one strict-mock send. A read-only probe gave `second: -70403` and `sends ["self-test"]` (Toolchain evidence).
- **CR-05-CONTROLS-009** fixed: production 549-566. 'keeps the request pending when the vendor does not answer in time' (759-788) and the rows at 345-347 and 822 expect pending `['self-test']` and cancelled `[]` after `timed-out`.
- **CR-05-CONTROLS-010** fixed: `PRECEDENCE` (418-511, 11 rows) and `PENDING_PRECEDENCE` (513-559, 6 rows) run at 1172-1213. With 1088, 1130 and 1155, every pair that can hold together has a case, and the pending rule is pinned against all six other rules. The restated comment at 1084-1087 is correct. The position word at 431 is in CR-05-CONTROLS-030.
- **CR-05-CONTROLS-011** fixed: 'attempts <cause> exactly once ...' (960-989) runs every recorded deferral. It compares `{ thrown, pending, delays, cancelled }` with the row's hand-written `delaysAfterRefusal` and `cancelledAfterRefusal` (332-333, 346-347), then calls `verify(commands)`.
- **CR-05-CONTROLS-012** fixed: 701-725 compare `{ pending, cancelled }` with `{ ['self-test'], [] }`.
- **CR-05-CONTROLS-013** fixed: 820-855 (both vendor outcomes) and 1215-1241 (transport refusal) record `republish` before and after the clearing push.
- **CR-05-CONTROLS-014** fixed: 857-875 changes `reported` between the refusal and the push. 1511-1535 changes the held value between the refusal and the push.
- **CR-05-CONTROLS-015** fixed: `RESTORED_PRESSES` (611-622) drives presses of `true` and `false` through 1380-1449.
- **CR-05-CONTROLS-016** fixed: `registeredHandler` (192-207). 1015-1048 cover all eight `REFUSALS` rows and 1451-1478 cover the restored handler. Each asserts `instanceof HAP.HapStatusError` and `hapStatus`.
- **CR-05-CONTROLS-017** fixed: a scan of every `// act` block finds no `assert.` call. `assertRefused` is gone.
- **CR-05-CONTROLS-018** fixed: `readOfSwitch` (598-609) is `async` and awaits the read inside its `try`. All callers await it (1435, 1440, 1486, 1507, 1531).
- **CR-05-CONTROLS-019** fixed: 916-924 has one `test()` per `REFUSALS` row and asserts the row's named status.
- **CR-05-CONTROLS-020** fixed: 147-153 match the pinned `onSet` (`Characteristic.js:1346-1353`, one `setHandler` slot, a warning only for a non-function).
- **CR-05-CONTROLS-021** fixed: 103-107 are in the present tense and quote 'WR-02 returns the Switch to the value the device reported when a press is refused during shadow silence', which exists at `test/accessories/basementGuardian.test.ts:2848`. Lines 321-322 drop "now".
- **CR-05-CONTROLS-022** fixed: 1125-1129 and 1150-1154 name "the quiet-live-path rule". No "new rule" is left.
- **CR-05-CONTROLS-023** fixed: every case that promises sends uses `mock<CommandPort>({ exactParams: true, name: 'commands' })` and calls `verify(commands)` last. `answeringCommands` (116-121) is a stub whose calls no case asserts. No `recordingCommands`, `anyTimes` or `It.isAny` is left.
- **CR-05-CONTROLS-024** fixed: `acceptedOutcome()` (30-34) and per-row outcome factories replace the shared constant. The `RefusalCase` fields are `readonly` (217-237).
- **CR-05-CONTROLS-025** fixed: `src/accessories/controls.ts:1-8` is the D-01 header.
- **CR-05-CONTROLS-026** fixed: 26-29 say that HAP assigns the status after the throw (`Characteristic.js:1818-1832`). 334-335 drop "cheapest and most local first".
- **CR-05-CONTROLS-027** fixed: 86 says "the cases using this stub do not read the log".
- **CR-05-CONTROLS-028** fixed: 108-110 and 159-161 are block bodies. `setInterval: () => undefined` (104) returns the handle that the port answers.
- **CR-05-CONTROLS-029** fixed: 681 and 684 compare whole delays `[30000]`. 953-956 compare the whole delays list with each row's `delaysAfterRefusal`.

Reopened: none.

## Findings

### CR-05-CONTROLS-030 - WARNING: Five test-support comments claim a position or scope the file contradicts

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does; "A comment describes the code as it stands"); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation
**Location:** `b86e6b05549e3569ce3e4dae457efb97bd8d6485:test/accessories/controls.test.ts:52-53, 165, 209-216, 431-432, 581-583`
**Issue:** Each comment states which cases come before or after a declaration, or which cases use it. In each one, the statement does not match the file:
- 431-432 (`PRECEDENCE`): "Three other pairs have their own cases above". Those cases (1088, 1130, 1155) now come after the table. The CR-05-CONTROLS-002 fixer reported this word.
- 215 (`RefusalCase`): "Every case below is read off this one table". Every case in the file is now below the table, and most are not read off it (for example 625-818 and 1243-1376). The CR-05-CONTROLS-002 fixer reported this word. Line 209 also says "The eight ways one write against an idle control can end". An accepted write is a ninth ending. The eight are the refusals.
- 581 (`refusingRestoredSwitch`): "the shape every case below starts from". This is a third position word that the 002 move made wrong, and the fixer did not report it. At the base, the helper sat at 893, directly above the restored cases. Now it sits above both `describe` blocks, so "every case below" includes all 36 `createControlBinder` `test()` calls, and none of them uses it. In its own `describe`, 'throws a HapStatusError with status -70412 from the handler a restored control carries' (1453-1478) also builds its own service.
- 165 (`boundSwitch`): "the shape every case starts from". Many cases do not use it: 805-818, 1019-1048, the second binder at 1364-1366 and every `bindRestoredControlRefusal` case.
- 52-53 (`asService`): "the one place a stand-in service stands where the binder takes a Service". It also widens the service that `bindRestoredControlRefusal` takes (591, 1461), and that function is not the binder.
This is a new cause and not a reopen of CR-05-CONTROLS-002. That finding was about the missing `describe()` blocks, which are present now.
**Fix:** Comment-only, in one `docs(controls)` commit. Change no code, title or literal:
- 431: "Three other pairs have their own cases: transport over fresh state, transport over the quiet path, and the quiet path over fresh state."
- 209-216: start with "The eight refusals one write against an idle control can meet". Replace "Every case below is read off this one table, so ..." with "The cases that loop over `REFUSALS`, `LOCAL_REFUSALS` or `VENDOR_REFUSALS` read this one table, so ...".
- 581: "A restored control carrying the refusal, which most `bindRestoredControlRefusal` cases start from."
- 165: "A bound Switch, with the binder that owns it, which most `createControlBinder` cases start from."
- 52-53: say that this is the one place a stand-in service stands where the code under test takes a `Service`.
**Flags:** none (D-10 does not apply; SC-02 did not touch these comment lines)

### CR-05-CONTROLS-031 - WARNING: Both log stand-ins define `noop` as an arrow assigned to `const`

**Rule:** `.agents/skills/typescript-style/rules/functions.md` Functions ("A named function is a function declaration; an arrow assigned to `const` only for an explicit function type or a nested function needing the outer `this`."). Precedent: CR-02-SHADOW-009 fixed the same pattern as a WARNING.
**Location:** `b86e6b05549e3569ce3e4dae457efb97bd8d6485:test/accessories/controls.test.ts:67-69, 85-87`
**Issue:** `warningLog` and `silentLog` each declare `const noop = (): void => { ... };`. The `const` has no function type, because `(): void` is only the arrow's return annotation. The function does not read `this`. Neither exception applies, so each is a named function that must be a declaration. ESLint does not enforce this rule, so the green lint run does not cover it. `test/cloud/shadow.test.ts:106` shows the repaired form (`function noop(): void { ... }`).
**Fix:** In both helpers, write `function noop(): void { // <the existing comment> }` and keep `Object.assign(noop, { ... })` unchanged. One `style(controls)` commit, with no change to any value.
**Flags:** none

### CR-05-CONTROLS-032 - WARNING: Three source comments misstate when the pending entry exists or ends

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does, as it stands); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation
**Location:** `b86e6b05549e3569ce3e4dae457efb97bd8d6485:src/accessories/controls.ts:471-475, 530-533, 601-602`
**Issue:** The CR-05-CONTROLS-008 and 009 fixes made the life of the pending entry a deliberate, per-path contract. The comments at 308-312 and 549-556 describe it correctly, but three other comments still contradict it:
- 530-531 (`refuseLocally`): "Nothing was sent, so nothing is pending to drop". The pending refusal (365) is a local refusal, and it only applies while an entry is pending. Every `PENDING_PRECEDENCE` refusal also answers while an entry waits. Both keep that entry on purpose: "Nothing is sent, so the earlier request keeps its own window" (311-312), and the test asserts `pending: ['self-test']` and `cancelled: []` (746-755). So something can be pending during a local refusal. The point is that this write creates no entry and the binder does not drop the one that exists.
- 471-473 (`requested`): the entry lives "from the moment a write is accepted for sending until the device confirms it or the window closes". A `vendor-error` outcome also ends it (558-560, D-037).
- 601-602 (accepted path): "the entry stays until the device's own report resolves it". When the window closes, `expire` (515-522) also ends it.
**Fix:** Comment-only, one `docs(controls)` commit, with no change to any literal:
- 530-531: "A refusal the plugin answered by itself. Nothing was sent, so this write adds no pending entry and leaves an earlier one, and its window, where they are; ..."
- 471-473: "... until the device confirms it, the vendor refuses it, or the window closes."
- 601-602: "... and the entry stays until the device's own report or the window resolves it."
**Flags:** none

### CR-05-CONTROLS-033 - WARNING: A timed-out command logs that it "did not take effect", which D-038 says the plugin cannot know

**Rule:** D-038 (locked: "Treat command delivery as uncertain ... A timed-out request can still have reached the vendor and device."). D-037. CTRL-05 ("keeps reported state authoritative"). `.agents/skills/typescript-style/rules/comments.md` is the closest book rule, applied by analogy: text written for a reader states what is true of the code. Severity is WARNING by the style book's own analogy ("they mislead readers but do not change behavior"). What is sent, stored and published is correct; only the owner-facing line is wrong.
**Location:** `b86e6b05549e3569ce3e4dae457efb97bd8d6485:src/accessories/controls.ts:553-556, 563`; the pinned expectations are at `b86e6b05549e3569ce3e4dae457efb97bd8d6485:test/accessories/controls.test.ts:337, 784, 912`
**Issue:** `refuseOutcome` logs `The ${capability} request on ${deviceId} did not take effect: ${failure}. It is not retried.` for both failures. For `vendor-error`, that is true. For `timed-out`, the comment four lines above says "A timeout leaves delivery uncertain: the command may already have reached the device". Since CR-05-CONTROLS-009, the code acts on that: it keeps the entry, refuses a second press, and a confirming report resolves the request. The log line still tells the owner the opposite. I ran a read-only probe of the compiled module with made-up inputs. It made one `true` write with a `timed-out` outcome, a second `true` write, then `reconcile('self-test', true)`, and logged these two lines in order:
`The self-test request on dev-1 did not take effect: timed-out. It is not retried.` and `Refused self-test on dev-1: an earlier request is still waiting for the device to confirm it.`
The device then confirmed the request (`pendingAfterReport: []`). The owner is told that nothing happened and, in the next line, that the request is still waiting for confirmation. Then the Switch turns on. The plugin presents its own uncertainty as a fact, which is what the core value forbids. The round-0 triage kept this line because of the minimum-fix scope of CR-05-CONTROLS-009 ("A timed-out outcome keeps its warning line"). It did not judge whether the line is true.
**Fix:** The line is a preserved literal (D-05, P-05-01). It changes only if the coordinator classifies it as a genuine bug, with D-04 RED evidence and maintainer approval of the wording. Minimum shape: keep the `vendor-error` line byte for byte, and give `timed-out` its own line that states the uncertainty and keeps the device and capability. For example: `The ${capability} request on ${deviceId} got no answer from the vendor in time: it may still reach the device. It is not retried.` RED: in 'keeps the request pending when the vendor does not answer in time', expect the new line. Then update the `an exceeded deadline` row's `expectedWarning` (337) and the line at 912. Keep the status, the single attempt, the clearing push and the kept entry. If the coordinator rejects the change, record the reason. In both cases, the comment at 553-556 and the line at 563 must stop contradicting each other.
**Flags:** D-04 (genuine production bug candidate: an owner-facing log line that the locked D-038 contradicts; changes a preserved log line, so it needs RED-to-GREEN and maintainer approval). D-10 (cites SC-02: the `VENDOR_REFUSALS` `expectedWarning` row at 337 and the 'logs the exact refusal for ...' loop at 991-1013 are lines that SC-02 touched).

## Candidates considered and not filed

- **Two position words reported by the CR-05-CONTROLS-002 fixer** (431, 215): judged under the comment rules and filed in CR-05-CONTROLS-030, with a third one the fixer missed (581).
- **The order note's "three middle rules" (`controls.ts:337`)**: transport, quiet and fresh sit at positions 2-4 of 7, between the first rule and the last three. The sentence names which three it means in the next lines, and every pair among them can hold at once. The wording is loose but not false. Not filed.
- **`liveConfirmationObservable` JSDoc, "a second press could start a test while one was already running" (`controls.ts:120-123`)**: the pending rule now refuses a second press inside the 30 s window. After the window, the duplicate rule still judges a reading up to a poll interval old, so a second mute, or a test longer than 30 s, can still be sent. The "could" still holds. Not filed.
- **Comment inside a case at `controls.test.ts:972`** ("Every deferral the refusal armed runs, ..."): `cases.md` allows no other comments "unless setup is not obvious". The line explains why the act step runs every timer, which is not obvious: it exposes a delayed retry to the strict mock. I read it as within the exception. A strict reading would move it above `test(`. Not filed. The coordinator may decide otherwise.
- **`OnSetCall.arguments` (`controls.test.ts:194, 200`)**: this is a Quick-scan token. The name is node:test's `MockFunctionCall.arguments`, so the spy's `mock.calls` can be passed structurally. It is not the `arguments` object. Justified by the external API. Not filed.
- **The test comment "HAP converts any error but a `HapStatusError` ..." (`controls.test.ts:1015-1016`)**: real HAP honours a thrown bare number as a status (`Characteristic.js:1820-1823`), but a number is not an `Error`, and the sentence is about errors that carry a message. True as written. Not filed.
- **Inline `try`/`catch` in the two regression cases (727-743, 759-774)** instead of `writeRejection`: this duplicates a helper, but no rule in the books requires the helper. D-04 kept these regression tests byte for byte. Not filed.
- **`expected cancelled: [windowsIn(deferrals)[0]?.handle]` (1268)**: the handle comes from the test's own timer stub, not from production. A wrong handle, `undefined`, or a window armed at another delay fails the comparison. Not filed.
- **No case runs the kept window after a `timed-out` outcome and asserts that it expires**: `expire` is keyed by capability and never reads the outcome. A timed-out path that clears or re-arms the window fails 'keeps the request pending ...' (`cancelled: []`, `delays: [30000, 0]`) and 'attempts an exceeded deadline ...'. I found no plausible wrong binder that passes, so this is not a BLOCKER. Not filed.
- **A late `vendor-error` outcome for request A could resolve request B's entry** (`resolvePending` is keyed by capability). This needs A's entry to end while A's send is still in flight and B to be accepted after that. The pending rule refuses B while A's entry exists. A's entry ends early only through `expire` (30 s, far past the 2.5 s send deadline of D-038) or through `reconcile` with the requested value. In that case `reported()` reads active and `isAlreadyActive` refuses B. Not reachable with the port's deadline. Not filed.
- **The `'sends alarm-mute on a second accessory ...'` row**: the first accessory is pending on `self-test`, so this row alone does not show per-accessory isolation for mute. The `self-test` row of the same loop does: a shared map would refuse it. Not filed.
- **`refuse()` with no `// arrange` in 'answers <status> for <cause>' (916-924)**: this is the coordinator's chosen form for CR-05-CONTROLS-019, and the helper performs the write. The phases are in order. Not filed.
- **Duplicate inline status arrows in `LOCAL_REFUSALS` (364-365)**: style preference only. No rule. Not filed.

## Header inspection

- `src/accessories/controls.ts`: conforms to D-01. Line 1 is `// SPDX-License-Identifier: MIT`, line 2 is empty, 3-5 hold the copyright block (`Copyright (c) 2026 Alessandro Colomba`), line 6 is empty, 7-52 hold the `@fileoverview` block, line 53 is empty, and the first import is at 54.
- `test/accessories/controls.test.ts`: conforms to D-01. Line 1 is the SPDX line, line 2 is empty, 3-5 hold the copyright block, line 6 is empty, 7-9 hold the `@fileoverview` block, line 10 is empty, and the first import is at 11.

## Toolchain evidence

All commands ran from the repository root at `b86e6b05549e3569ce3e4dae457efb97bd8d6485` with a
clean tree, each prefixed with `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. Node
`v26.12.0`, npm `11.20.0`, start 2026-10-17T19:52:27Z. I deleted the ESLint cache
(`node_modules/.cache/eslint`) before linting, so the lint result is fresh. No command was piped,
so each raw exit below is the command's own exit.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both projects compile |
| `node_modules/.bin/eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | compiled |
| `node --test dist-test/test/accessories/controls.test.js` | 0 | tests 102, suites 2, pass 102, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | 0 | no output (the pair is at 100% alone) |

Read-only probe (no file written, no source changed): `node --input-type=module -e ...` imported
the compiled `dist-test/src/accessories/controls.js` and `dist-test/features/lib/hap.js` with
made-up inputs (`dev-1`, a port that answers `{ accepted: false, failure: 'timed-out' }`). Exit
0. Output: `first: -70408`, `second: -70403`, `sends ["self-test"]`, `pendingAfterReport []`,
and the warnings `The self-test request on dev-1 did not take effect: timed-out. It is not
retried.` and `Refused self-test on dev-1: an earlier request is still waiting for the device to
confirm it.` (CR-05-CONTROLS-008, 009 and 033).

Every check passes. The four findings are about comments, one function form and a log line. The
checks cannot see these.

## Out-of-scope observations

- `test/accessories/staleMarking.test.ts:77` (Phase 5 RECORDS batch, plan 05-05): the same `const noop = (): void => { ... }` form as CR-05-CONTROLS-031. The RECORDS review should judge it.
- `src/runtime/commandPort.ts:21` (Phase 4, PORTS batch, closed): the `CommandFailure` JSDoc says "Why a command did not take effect". That union includes `timed-out`, which D-038 says may have taken effect. If CR-05-CONTROLS-033 is accepted, this wording has the same defect. It is a type comment in a closed phase, so it gets no CR-05 ID.
- `features/lib/hap.ts:97-110` (Phase 7 under D-12): two JSDoc blocks are stacked above `FakeHapStatusError`. The first ("The error a write handler throws ...") documents nothing, because the second block is the one attached to the interface.

---

_Reviewed: 2026-10-17T19:59:51Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 1)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. Opening 29, fixed 29, rejected 0, new 4, reopened 0,
closing 4. The open count fell from 29 to 4 with no reopen in round 1, so the result is
`continue` (D-03 as amended, D-18).

- **CR-05-CONTROLS-001 to 029:** `fixed`, as the Round status shows at their current lines.
- **CR-05-CONTROLS-030, 031 and 032:** `open`, WARNING, as reported.
- **CR-05-CONTROLS-033:** `open`, WARNING, and classified as a genuine production bug (D-04). The
  owner-facing line is wrong output: since CR-05-CONTROLS-009 the binder treats a timed-out
  command as possibly delivered (D-038), keeps it pending and accepts the device's confirmation,
  yet the line tells the owner the request "did not take effect". The finding names the line, so
  D-04 evidence covers the change to the preserved log line (D-05).
  - The coordinator chose the wording. Only the timed-out line changes, to: "The
    ${capability} request on ${deviceId} timed out and may still have reached the device. It is
    not retried." It keeps the capability, the device identifier and the no-retry statement, and
    it states the uncertainty without guessing either way.
  - The `vendor-error` line stays byte for byte: "The ${capability} request on ${deviceId} did not
    take effect: vendor-error. It is not retried." The status, the single attempt, the clearing
    push and the kept entry do not change.
  - The fix follows the D-04 sequence with `05-CONTROLS-RED-EVIDENCE.json`; its record carries
    the 009 record, which already holds the 008 record, in `priorEvidence`.
  - D-10: the exceeded-deadline row's `expectedWarning` and the exact-log loop are SC-02 lines.
- **Not filed:** the coordinator keeps the reviewer's rejection of the comment inside the case at
  `test/accessories/controls.test.ts:972`. The rule's exception for setup that is not obvious
  applies.
- **Out-of-scope observations:** the `noop` form in `test/accessories/staleMarking.test.ts:77`
  goes to RECORDS. The "did not take effect" JSDoc at `src/runtime/commandPort.ts:21` describes
  the `CommandFailure` union for both failures. It belongs to the closed Phase 4 RUNTIME scope and
  is recorded for the phase verifier. The stacked JSDoc in `features/lib/hap.ts:97-110` goes to
  Phase 7.
- **Repair order:** the source comments (032); then the D-04 bug (033); then the test comments
  (030) and the `noop` declarations (031).

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CONTROLS-032 | `src/accessories/controls.ts` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/controls.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/controls.test.js` exit 0 (102 tests, 2 suites, 0 failures); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/controls.ts --max-warnings=0` exit 0; `node_modules/.bin/fallow audit --base 4c143ebad681cf602e787b8c2ea09b050d8a9518 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | comment-only: the `requested` note says an entry ends when the device confirms it, the vendor refuses it, or the window closes, and that a confirming report or a vendor refusal cancels the deadline; the `refuseLocally` note says this write adds no entry and leaves an earlier entry and its window as they are; the accepted-path note says the device's report or the window resolves the entry |
| CR-05-CONTROLS-033 | `src/accessories/controls.ts`, `test/accessories/controls.test.ts`, `.planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R1.md` | Node v26.12.0: `node_modules/.bin/fallow guard src/accessories/controls.ts test/accessories/controls.test.ts` exit 0; `npm run build:test` exit 0; `node --test --test-reporter=tap --test-name-pattern='^warns that a timed-out request may still have reached the device$' dist-test/test/accessories/controls.test.js` exit 0 (tests 1, pass 1, fail 0); `node --test dist-test/test/accessories/controls.test.js` exit 0 (103 tests, 2 suites, 0 failures); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` exit 0; `node_modules/.bin/eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; consumers: `node --test dist-test/test/accessories/basementGuardian.test.js` exit 0 (157 tests, 1 suite, 0 failures), `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` exit 0, `npx cucumber-js` exit 0 (104 scenarios, 1156 steps, all passed); `node_modules/.bin/fallow audit --base 4c143ebad681cf602e787b8c2ea09b050d8a9518 --format json --quiet --explain` exit 0, verdict pass | RED evidence 11c32d2 (D-04) | production: a module-local `outcomeWarning` beside `statusOf` picks the line per failure; `timed-out` now logs "The <capability> request on <deviceId> timed out and may still have reached the device. It is not retried." and `vendor-error` keeps its line byte for byte; the pending handling, clearing push, status, single attempt and throw are unchanged; tests: the active regression case is kept, and the three timed-out expectations are updated (the exceeded-deadline `VENDOR_REFUSALS` `expectedWarning`, an SC-02 line under D-10; 'keeps the request pending when the vendor does not answer in time'; 'names the capability, the device and the cause in the one line a refusal logs, and quotes nothing else') |
| CR-05-CONTROLS-030 | `test/accessories/controls.test.ts`, `.planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R1.md` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/controls.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/controls.test.js` exit 0 (103 tests, 2 suites, 0 failures); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` exit 0; `node_modules/.bin/eslint test/accessories/controls.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; `node_modules/.bin/fallow audit --base 4c143ebad681cf602e787b8c2ea09b050d8a9518 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | comment-only, no code, title or literal changed. The five named comments: `PRECEDENCE` drops "above"; `RefusalCase` says "The eight refusals one write against an idle control can meet" and that the cases looping over `REFUSALS`, `LOCAL_REFUSALS` or `VENDOR_REFUSALS` read the table; `refusingRestoredSwitch` and `boundSwitch` say most `bindRestoredControlRefusal` or `createControlBinder` cases start from them; `asService` says "the code under test". Further instances of the same class: the status constants note, the `Deferral` JSDoc, the `recordingTimers` note and its `clearInterval` comment said "the binder" for stand-ins the restored cases also use, and now say "the code under test"; the cause-text note described a two-predicate gate above three causes and now names the fresh-state, transport and quiet-live-path rules; the transport-over-fresh-state case's "the precedence cases below" now reads "the `PRECEDENCE` cases" |
| CR-05-CONTROLS-031 | `test/accessories/controls.test.ts`, `.planning/phases/05-accessories-conformance/05-CONTROLS-REVIEW-R1.md` | Node v26.12.0: `node_modules/.bin/fallow guard test/accessories/controls.test.ts` exit 0; `npm run build:test` exit 0; `node --test dist-test/test/accessories/controls.test.js` exit 0 (103 tests, 2 suites, 0 failures); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` exit 0; `node_modules/.bin/eslint test/accessories/controls.test.ts --max-warnings=0` exit 0; `npm run typecheck` exit 0; `node_modules/.bin/fallow audit --base 4c143ebad681cf602e787b8c2ea09b050d8a9518 --format json --quiet --explain` exit 0, verdict pass | n/a (WARNING) | declaration form only: `warningLog` and `silentLog` each declare `function noop(): void { ... }` with the existing comment in the body, and `Object.assign(noop, { ... })` is unchanged. A search of the file found no other named function written as an arrow assigned to a `const`; every other arrow is a callback argument or an object member |
