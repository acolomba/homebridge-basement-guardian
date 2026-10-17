---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 5
reviewed: 2026-10-17T22:14:00Z
depth: deep
source_revision: 5dd054efc3b9b5c89a336f9e4fd6c04b46a5209e
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 0
  warning: 1
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 5)
---

# Phase 5 CONTROLS batch: correction round 5

I read every line of both files in full at `5dd054efc3b9b5c89a336f9e4fd6c04b46a5209e`: all 642 lines
of `src/accessories/controls.ts` and all 1621 lines of `test/accessories/controls.test.ts`. Before I
started, `git rev-parse HEAD` printed that revision and `git status --porcelain` printed nothing.
Since round 4 (`3605e59`), five commits touched `src` or `test`: `77db333` and `aded73a`
(`controls.ts`, comment lines only), and `f9f2bcd` and `7d1943e` (`controls.test.ts`). No other
`src`, `test` or `features` path changed.

I used these inputs:

- AGENTS.md;
- the three `.agents/skills` books, each `SKILL.md` with every `rules/*.md` file (they win over
  `.claude/rules/*.md`);
- `05-CONTEXT.md` and `05-REVIEW-PROTOCOL.md` in full; the CONTROLS rows of `05-FINDINGS.md`
  (findings, the counter rows for rounds 0 to 4, genuine bug histories, `### 05-04`);
  `05-CONTROLS-REVIEW.md` and `-R1.md` to `-R4.md` (findings, candidates not filed, triage, repair
  history);
- D-027, D-037 and D-038 (`.planning/intel/decisions.md:614-628, 787-830`), CTRL-03 and CTRL-05
  (`.planning/milestones/v1.0-REQUIREMENTS.md:67, 69`), the WR-02 case
  (`test/accessories/basementGuardian.test.ts:2836-2895`, read only);
- `features/lib/hap.ts:286-348` (`StandInCharacteristic`) and
  `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js` (2.2.2): `updateValue`
  (1628-1660), `handleGetRequest` (1683-1735) and `handleSetRequest` (1786-1835);
- the consumers the findings depend on: `src/accessories/serviceCatalogue.ts:215-345` (the trust
  functions), 528-545 (`controlValues`), 803-830 (the control rows), 974-978 (`publishValue`);
  `src/accessories/basementGuardian.ts:315-376` (`monitoringDegradedScopes`, `distrustReasonsOf`),
  545-605 (`decodedControlValue`, `reportedControlValue`, the gate facts), 610-700 (the binder
  wiring); `src/runtime/accountRuntime.ts:580-650, 772-792` (`commandTransportReadyNow`,
  `monitoringTrustNow`, `polling`); `src/runtime/monitoringHealth.ts:39, 60-110, 171-173`
  (`REST_FAILURE_THRESHOLD`, `MonitoringTrust`, `isRestDegraded`);
  `test/runtime/accountRuntime.test.ts:5664-5700` (read only).

Opening open set: 3. Confirmed fixed: 3. Still open: 0. Reopened: 0. New: 1 (0 BLOCKER, 1
WARNING). Closing: 1.

## Round status

### Opening IDs

- **CR-05-CONTROLS-039** fixed (`77db333`, `aded73a`).
  - `bind` JSDoc (153-155): `reported` is `undefined` "when the control's row may not publish it:
    the field did not decode, or its scope is withdrawn for a doubtful reason". That is
    `reportedControlValue` (`basementGuardian.ts:571-573`): `isRowPublishable` is false only for a
    reason outside `SEEING_LESS_REASONS` (`serviceCatalogue.ts:227, 262-266`), and the control rows
    tolerate none (`serviceCatalogue.ts:816, 825`). `decodedControlValue` gives `undefined` for a
    field that is not a boolean (`basementGuardian.ts:549-554`).
  - `hasNoFreshState` (274-279): the same two conditions. "the state the plugin can actually vouch
    for" is gone.
  - `clearRefusal` (400-409): "what the control rows may currently publish". The three conditions
    for `On` are those of `controlValues` (`serviceCatalogue.ts:541-545`): `trustedGroup` through
    `isRowPublishable`, a boolean field, and no pending entry.
  - `expire` (517-523): `StatusActive` "reports whether the row can vouch for what it publishes",
    which `'invalid'`, `'unreachable'` and `'controller-link-lost'` each make false. That is
    `isRowFullyTrusted` through `isRowTrusted` (`serviceCatalogue.ts:244-246, 280-282`), published
    at `basementGuardian.ts:634, 745`. The rationale is kept.
  - The two extra restatements hold. The `timers` JSDoc (66-68): the binder schedules only in
    `answerWrite` (602-607) and `armClearingPush` (537-541, reached only from `refuseLocally` and
    `refuseOutcome`). `reconcile` reaches only `timers.clearTimeout` (509). Above `isConfirmedOffline`
    (288-291), "no refusal rule reads an equipment fault": `ControlRequest` (216-226) has no fault
    field.
  - A search of the source for "vouch" finds only 520, where it names the marking rule correctly.
- **CR-05-CONTROLS-040** fixed (`7d1943e`).
  - The comment above the held-value loop (984-987) and its title (989) no longer say "vouch" or
    "untrustworthy". They state the withholding rule as the source states it.
  - The comment above 'names the quiet live connection alone when the reported field has also not
    decoded' (1237-1239) gives the source order note's reason (`controls.ts:345-349`). The silence
    premise is gone.
  - The same-class restatement above 'names the missing transport alone when the plugin has neither
    a route to send on nor a live path to hear back on' (1214-1216) matches `controls.ts:343-345`.
  - The diff of the test from `3605e59` changes one title and comments in this commit, and no
    assertion or literal.
- **CR-05-CONTROLS-041** fixed (`f9f2bcd`).
  - 'refuses a second on request while the first is still being sent, and sends one command'
    (761-792) holds the first send open, presses again, then releases the send. It compares
    `{ thrown, pending, delays, cancelled, warnings }` as one value and calls `verify(commands)`
    last.
  - I traced the finding's wrong binder (`requested.set` below `await commands.send`) through it.
    The second press finds no entry and a clear gate, so it calls `commands.send` a second time. The
    strict mock (one expectation) throws, and the stand-in turns that into `-70402`
    (`features/lib/hap.ts:276-283, 324-332`). The case expects `-70403`, `delays: [30000, 0]` and
    the pending line. It fails. This matches the fixer's control A.
  - The sibling 'clears the request and its window when the device confirms it while the command
    is still being sent' (794-818) catches control B: a re-record after an accepted send leaves
    `pending: ['self-test']` and `delays: [30000, 30000]`.
  - The stand-in calls the handler before its first `await` (`features/lib/hap.ts:316-326`), as
    real HAP does (`Characteristic.js:1786-1805`), so the second press reaches the binder while the
    first send waits.
  - Both cases pass in the owner run (105 tests). The `!` on each resolver has its reason on the
    line above (763, 796).

### Earlier fixed IDs

All 38 are still fixed. None reopened. Every fix commit in the dispatch (001 to 041) is an ancestor
of HEAD (`git merge-base --is-ancestor`, all exit 0). Since round 4 the source changed only in
comments. The test gained two cases, one title and comment lines. I re-read each anchor at HEAD:

- **CR-05-CONTROLS-001** still fixed: 'ignores a confirming report that lands after the window already closed' (1392-1408) compares the whole `warnings` array. The only `.length` in the file is the stub's handle (100).
- **CR-05-CONTROLS-002** still fixed: `describe('createControlBinder')` (626-1462) and `describe('bindRestoredControlRefusal')` (1464-1621), top level, not nested.
- **CR-05-CONTROLS-003** still fixed: no "microtask" in the test. `hapWriteFidelity.test.ts` keeps the protection (D-13).
- **CR-05-CONTROLS-004** still fixed: 882-895 spy with `t.mock.method(characteristic, 'onSet')`. Each `.bind(` hit (171, 890, 891, 1123, 1429, 1451) is `ControlBinder.bind`.
- **CR-05-CONTROLS-005** still fixed: `// act & assert` only at 1126 and 1551, each over one `assert.rejects()`.
- **CR-05-CONTROLS-006** still fixed: `as unknown as` only at 50 (`HAP_NAMESPACE`) and 56 (`asService`), both commented (D-11).
- **CR-05-CONTROLS-007** still fixed: the order note (331-356) is directly above `const LOCAL_REFUSALS` (357).
- **CR-05-CONTROLS-008** still fixed: `pending` (225), `isAwaitingConfirmation` (310-312) and its row, last (364), `pending: requested.has(capability)` (591). The regression case (729-759) passes. 041's case now pins the in-flight press too.
- **CR-05-CONTROLS-009** still fixed: `refuseOutcome` calls `resolvePending` only for `vendor-error` (572-574). 820-849, the row at 347 and the row at 899 expect pending `['self-test']`.
- **CR-05-CONTROLS-010** still fixed: `PRECEDENCE` (11 rows, 435-513) and `PENDING_PRECEDENCE` (6 rows, 518-561) run at 1257-1298. With 1178, 1217 and 1240, every single-write pair that can hold together has a case (14).
- **CR-05-CONTROLS-011** still fixed: 1051-1080 runs every deferral, compares `{ thrown, pending, delays, cancelled }` and calls `verify(commands)`.
- **CR-05-CONTROLS-012** still fixed: 703-727 compare `{ pending, cancelled }`.
- **CR-05-CONTROLS-013** still fixed: 897-932 and 1300-1326 record `republish` before and after the push.
- **CR-05-CONTROLS-014** still fixed: 936-952 and 1599-1620 change the value between the refusal and the push.
- **CR-05-CONTROLS-015** still fixed: `RESTORED_PRESSES` (621-624) drive 1465-1534.
- **CR-05-CONTROLS-016** still fixed: 1110-1139 and 1538-1563 assert `instanceof HAP.HapStatusError` and `hapStatus`.
- **CR-05-CONTROLS-017** still fixed: no `// act` block holds an `assert.` call; `assertRefused` is not in the file.
- **CR-05-CONTROLS-018** still fixed: `readOfSwitch` (605-611) awaits inside its `try`. Every caller awaits it.
- **CR-05-CONTROLS-019** still fixed: 1007-1015, one `test()` per row.
- **CR-05-CONTROLS-020** still fixed: 147-151 state the single slot with no replacement warning.
- **CR-05-CONTROLS-021** still fixed: 101-105 quote the WR-02 title in the present tense (`basementGuardian.test.ts:2848`). 318-322 have no "now".
- **CR-05-CONTROLS-022** still fixed: 1214-1216 and 1237-1239 name "the quiet-live-path rule". No narration of removed code.
- **CR-05-CONTROLS-023** still fixed: each case that promises sends, the two new ones included, makes `mock<CommandPort>({ exactParams: true, name: 'commands' })` inside the case and calls `verify(commands)` last. No `anyTimes`, `It.isAny` or `recordingCommands`.
- **CR-05-CONTROLS-024** still fixed: `acceptedOutcome()` (32-34) and per-row factories. `RefusalCase` fields are `readonly`.
- **CR-05-CONTROLS-025** still fixed: D-01 header at `controls.ts:1-52` (Header inspection).
- **CR-05-CONTROLS-026** still fixed: 26-29 and 331-332.
- **CR-05-CONTROLS-027** still fixed: 87.
- **CR-05-CONTROLS-028** still fixed: 109-111 and 158-162 are block bodies.
- **CR-05-CONTROLS-029** still fixed: 686 and 1044-1047 compare whole delay lists.
- **CR-05-CONTROLS-030** still fixed: the support comments name tables and entrypoints. The position words in the test (1214, 1237) name rules of the table.
- **CR-05-CONTROLS-031** still fixed: `function noop(): void` at 68 and 86.
- **CR-05-CONTROLS-032** still fixed: 481-486, 543-544 and 615-617.
- **CR-05-CONTROLS-033** still fixed: `outcomeWarning` (381-385). The test expects the timed-out line at 339, 845 and 863. "did not take effect" appears only for `vendor-error` (378, 384; test 325).
- **CR-05-CONTROLS-034** still fixed: no case with identical code under two claims. "quotes nothing else" is not in the file.
- **CR-05-CONTROLS-035** still fixed: "the other half", "the one case" and "half the time" are not in the source.
- **CR-05-CONTROLS-036** still fixed: 954-982 is unchanged and passes.
- **CR-05-CONTROLS-037** still fixed: the transport and clearing-push comments make no waiting-request claim (89-94, 400-409). "third fact" and "middle rules" are not in the source.
- **CR-05-CONTROLS-038** still fixed: the `PRECEDENCE` comment (433-434) names exactly the three pairs it does not hold, and 1175-1177 makes no pair count.

Reopened: none.

## Findings

### CR-05-CONTROLS-042 - WARNING: The `commandTransportReady` JSDoc says a transport refusal cannot disagree with what the row publishes, and after one failed poll it does

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does, as it stands); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation (a member's JSDoc is what a user of the code reads). The `typescript-style` "Classifying findings" makes comment findings WARNING.
**Location:** `5dd054efc3b9b5c89a336f9e4fd6c04b46a5209e:src/accessories/controls.ts:95-105`
**Issue:** The JSDoc of `commandTransportReady` says:

> The accessory answers this from the account-wide monitoring trust it also publishes its rows
> from, and it answers `reported` below through the same rule that decides whether the control's
> row may publish that value. So the fact a row publishes from and the fact a write is refused on
> cannot disagree: they are one stored value read through one rule.

The "So" sentence follows both clauses. On this member, a reader takes it to cover the transport
fact too. For the transport fact it is false:

- No row reads `commandTransportReady`. Rows read the monitoring trust through
  `monitoringDegradedScopes`, which reads `credentialsRejected`, `shadowSilent` and `restDegraded`
  only (`basementGuardian.ts:325-335`).
- The runtime builds the transport fact from `!stopped && !halted && polling`
  (`accountRuntime.ts:610-612`). One failed poll sets `polling` to `false`
  (`accountRuntime.ts:788-790`). `restDegraded` needs `REST_FAILURE_THRESHOLD` (2) consecutive
  failures (`monitoringHealth.ts:39, 171-173`). The runtime says the two thresholds differ on
  purpose (`accountRuntime.ts:602-609`).
- The runtime case 'reports the command transport unready after a single failed poll, with
  neither degradation field moved' (`test/runtime/accountRuntime.test.ts:5664`) pins a per-device
  trust of `{ restDegraded: false, shadowSilent: false, commandTransportReady: false }`. For that
  trust, `monitoringDegradedScopes` returns no scope. Every control row then publishes its reported
  `On` with `StatusActive` `true`, and the binder refuses a press with "the plugin has no way to
  reach the vendor right now" (row 2, 359).

So after one failed poll the tile reads active and current, and a press is refused for a missing
route. These are two different stored facts read through two rules. The claim is true only for
`reported`: the row and the write path both read `lastDecoded` through `isRowPublishable`
(`basementGuardian.ts:571-573`, `serviceCatalogue.ts:329-335, 541-545`). The next paragraph
(101-105) and the WR-02 case it quotes are about `reported` alone.

A reader who trusts the JSDoc will expect a transport refusal only while the control tile is marked
inactive. When a user reports a refused press on an active tile, that reader looks for a bug in the
accessory wiring, but this is designed behavior. No behavior is wrong: only the comment is.

Rounds 0 to 4 did not discuss this paragraph. It is unchanged since the batch base
(`4c143eb:src/accessories/controls.ts:91-95`). `b1a7668` (021) rewrote only the paragraph after it,
and `3e879b6` and `946be0e` (035, 037) rewrote only the paragraph before it.

**Fix:** One comment-only `docs(controls)` commit. Change no code, literal, cause or order. Limit
the "cannot disagree" sentence to `reported`, and state the transport fact's own threshold. For
example, replace 95-99 with:

```text
   * The accessory answers this from the account-wide monitoring trust, but no
   * row reads it: one failed poll clears it, while the rows withdraw trust only
   * after a run of failed polls. So a press can be refused for a missing route
   * while the control's tile still reads active.
   *
   * The accessory answers `reported` below through the same rule that decides
   * whether the control's row may publish that value. For the reported value,
   * the fact a row publishes from and the fact a write is refused on cannot
   * disagree: they are one stored value read through one rule.
```

Keep 101-105 as it is, because "they" there now refers to the reported value only.

**Flags:** none. Not a D-04 candidate: the behavior matches the runtime's documented thresholds
(RES-04, D-07) and its pinned case. D-10 does not apply: SC-02 touched no source line. Not a reopen
of CR-05-CONTROLS-021, 035 or 037: each of those fixed a different defect in the neighboring
paragraphs, and none of them returned. No exported contract change (D-06).

## Candidates considered and not filed

- **`bind` JSDoc, "`undefined` when the control's row may not publish it"** (153-155). While a
  request waits, the row does not publish `On` (`controlValues`), but `reported` is still defined.
  The phrase uses the catalogue's word for `isRowPublishable` ("may publish what arrived",
  `serviceCatalogue.ts:248-249`), and the colon names the two conditions exactly. In the catalogue's
  words the sentence is true. Not filed.
- **`hasNoFreshState` and its cause "the plugin has no fresh state for it"** (280-282, 361). The
  rule reads decode and doubt, not freshness: a value under the seeing-less reason `'unreachable'`
  still passes it. The cause text is a pinned literal (D-05, P-05-01). If you rename only the
  function, it no longer matches its cause. The comment above it states the real condition.
  Not filed.
- **A timed-out outcome after a confirming report already arrived while the send was in flight.**
  No case covers it. The binder has no code path that adds an entry after the send, so a wrong
  binder needs a new re-record that runs only on `timed-out` and only when the entry is missing. An
  unconditional re-record arms a second window and fails the exceeded-deadline rows (`delays`).
  I found no plausible refactor that has this shape. Not filed.
- **`RestoredControlRefusalOptions` is exported, and no module imports it** (170). `.fallowrc.json`
  sets `private-type-leaks` to `error`, so the parameter type of an exported function must be
  exported. `fallow dead-code --trace` reports it as externally accessible. Not filed.
- **'warns that a timed-out request may still have reached the device'** (851-865) still repeats
  'logs the exact refusal for an exceeded deadline' (1083-1103, row 337-350). R2 recorded this
  overlap. The 034 triage kept the D-04 regression case on purpose (P-05-03). There is no new
  evidence. Not filed.
- **The two 041 cases build the held send the same way** (763-767, 796-800). No book rule requires
  a helper, D-15 is about static gates, and each `!` has its reason on the line above. Not filed.
- **The `republish` JSDoc gives only the refusal reason** (124-130), but `expire` also calls it
  (533). The `expire` comment gives its own reason (525-527), and the JSDoc says nothing false.
  Not filed.
- **Round 1 to 4 rejections, rechecked against the current lines and still not filed:**
  - the `bind` guard keyed by service (625-628);
  - JSDoc blocks on members of module-local interfaces (218, 224; test 59, 193, 226, 231, 427);
  - comment line widths (298, 325-328);
  - the `QUIET_LIVE_CONNECTION_CAUSE` table note (325-328);
  - the `liveConfirmationObservable` "naming a device failure" and "could" (118-121);
  - the `republish` JSDoc limit (124-130);
  - 'leaves a restored control answering a read before any press reaches it' (1565-1575);
  - "three middle rules", which the source no longer contains;
  - the comment inside a case (1063, which the coordinator kept);
  - `OnSetCall.arguments` (193-196);
  - the inline `try`/`catch` in the D-04 regression cases (739-745, 829-835);
  - `windowsIn(deferrals)[0]?.handle` (1353);
  - the late `vendor-error` against a newer entry;
  - the per-accessory rows (1442-1461);
  - `refuse()` with no `// arrange` (1007-1015);
  - the subset cases (691-701, 1007-1015, 1328-1341);
  - the three "names the ..." cases (1141-1173, 1197-1212);
  - "it fails independently of the one below" (258-260);
  - the second `assert.strictEqual` at 644;
  - `outcomeWarning` as a noun phrase;
  - `heldOn` annotated `CharacteristicValue` (396-398);
  - a `commands.send` that rejects;
  - the `alarm-mute` constant against a literal `true` (241-243);
  - 'answers the transport refusal status ...' reading `statusCode` (1300-1326);
  - 'holds one independent entry per capability ...' with no `cancelled` (1425-1438);
  - the 036 comment "a requested value never shows as reported state" (954-956);
  - no owner case for a waiting request with no reported value.

## Header inspection

- `src/accessories/controls.ts` conforms to D-01:
  - line 1 is `// SPDX-License-Identifier: MIT` and line 2 is empty;
  - lines 3-5 hold the copyright block (`Copyright (c) 2026 Alessandro Colomba`) and line 6 is
    empty;
  - lines 7-52 hold the `@fileoverview` block and line 53 is empty;
  - the first import is at line 54.
- `test/accessories/controls.test.ts` conforms to D-01:
  - line 1 is the SPDX line and line 2 is empty;
  - lines 3-5 hold the copyright block and line 6 is empty;
  - lines 7-9 hold the `@fileoverview` block and line 10 is empty;
  - the first import is at line 11.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS`
  printed `ACCESSORIES_HEADERS_OK files=2` and exited 0.

## Toolchain evidence

- All commands ran from the repository root at `5dd054efc3b9b5c89a336f9e4fd6c04b46a5209e`, with a
  clean tree.
- Each command had the prefix `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.
- Versions: Node `v26.12.0`, npm `11.20.0`.
- The run started at 2026-10-17T22:10:58Z and ended at 2026-10-17T22:11:13Z.
- Before linting, I deleted `node_modules/.cache/eslint`, so the lint is fresh.
- No command was piped, so each exit below is the command's own. Output went to files in the
  session scratch directory, and I read the summaries from those files.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both projects compile, no diagnostics |
| `node_modules/.bin/eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | compiled |
| `node --test dist-test/test/accessories/controls.test.js` | 0 | tests 105, suites 2, pass 105, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | 0 | only the npm banner, no failure (the pair is at 100% alone) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

Read-only commands only:

- `node_modules/.bin/fallow dead-code --trace src/accessories/controls.ts:RestoredControlRefusalOptions --quiet`
  reported `UNUSED ... No internal references, but file is an entry point (export is externally
  accessible)`. `.fallowrc.json` sets `private-type-leaks` to `error`.
- `git merge-base --is-ancestor <commit> HEAD` exited 0 for every fix commit from 001 to 041.

I made no source or test edit, ran no mutation experiment and made no commit. `git status
--porcelain` was still empty at 2026-10-17T22:13:43Z. Every check passes. The one finding is a
comment, and the checks cannot see comment content.

## Out-of-scope observations

- `src/accessories/basementGuardian.ts:591-593` (ACCESSORY batch): the `commandTransportReady`
  comment says that the fact is read "from the same account-wide trust the rows publish from, so a
  row and a refused write cannot disagree about the same account". This is the same claim as
  CR-05-CONTROLS-042, and it is false for the same reason: one failed poll refuses a press while
  the rows stay trusted.
- `src/accessories/serviceCatalogue.ts:337` (CATALOGUE batch, plan 05-03): "A row publishes only
  the facts it can vouch for" still uses the marking word for the withholding rule. This is unchanged
  from round 4.
- `src/runtime/commandPort.ts:21` (Phase 4 PORTS batch, closed): "Why a command did not take
  effect" still covers `timed-out`, which the binder logs as possibly delivered. This is unchanged
  from rounds 1 to 4.
- `test/accessories/basementGuardian.test.ts:2844-2847` (ACCESSORY batch): the history narration
  "Before the two halves read one rule ..." is unchanged.
- `src/accessories/basementGuardian.ts:567-570` (ACCESSORY batch): "A second copy is how the two
  came to disagree: the row was widened and this was not" still narrates an earlier shape of the
  code.
- Privacy policy against the logged `deviceId` (policy, no batch): AGENTS.md says account
  identifiers "cannot enter ... logs". The binder logs `deviceId`, which the code describes as
  `<account-id>_<serial-number>` (`controls.ts:551-555`). D-027 governs only public and planning
  artifacts, and the Phase 5 preservation list pins "`deviceId` identity and its presence in log
  lines" (`05-REVIEW-PROTOCOL.md`, Preservation). So this is not a controls finding. The
  maintainer should reconcile the AGENTS.md sentence with that decision.

---

_Reviewed: 2026-10-17T22:14:00Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 5)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. Opening 3, fixed 3, rejected 0, new 1, reopened 0,
closing 1. The open count fell from 3 to 1 with no reopen in round 5, so the result is
`continue` (D-03 as amended, D-18). CR-05-CONTROLS-001 to 038 stay fixed.

- **CR-05-CONTROLS-039 to 041:** `fixed`, as the Round status shows.
- **CR-05-CONTROLS-042:** `open`, WARNING, comment-only, as reported. The coordinator confirmed
  that the transport fact clears after one failed poll, while the row's monitoring trust drops
  only after two. So the "cannot disagree" claim holds for `reported` only.
- **Out-of-scope observations:** the same claim in `src/accessories/basementGuardian.ts:591-593`
  goes to the ACCESSORY batch. The reviewer also notes that the control log lines carry
  `deviceId`, while AGENTS.md keeps account identifiers out of logs. The line content is
  preserved here (D-05; the earlier ruling `263cae0` put `deviceId` in all three control lines),
  so the coordinator records this for the maintainer and the phase verifier. It is not a CONTROLS
  finding.
