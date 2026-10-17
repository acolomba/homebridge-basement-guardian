---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 8
reviewed: 2026-10-17T23:16:00Z
depth: deep
source_revision: 47b0cb1e8e95c0cbe796825142e92b3bc91e151e
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 0
  warning: 1
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 8)
---

# Phase 5 CONTROLS batch: correction round 8

I read every line of both files in full at `47b0cb1e8e95c0cbe796825142e92b3bc91e151e`: all 649 lines
of `src/accessories/controls.ts` and all 1620 lines of `test/accessories/controls.test.ts`. Before I
started, `git rev-parse HEAD` printed that revision and `git status --porcelain` printed nothing.
Since round 7 (`09727ef`), two commits touched `src`, `test` or `features`: `dda7a47`
(`controls.ts`) and `52f33bf` (`controls.test.ts`). `git diff 09727ef HEAD -- src test` changes
comment and JSDoc lines only: no `+`/`-` line outside a `//`, `*` or `/**` line.

I used these inputs:

- AGENTS.md;
- the three `.agents/skills` books, each `SKILL.md` with every `rules/*.md` file (they win over
  `.claude/rules/*.md`);
- `05-CONTEXT.md` and `05-REVIEW-PROTOCOL.md` in full; the CONTROLS rows of `05-FINDINGS.md`
  (findings, counter rows for rounds 0 to 7, leads S-05-24 and S-05-25);
  `05-CONTROLS-REVIEW.md` and `-R1.md` to `-R7.md`, with the R7 `## Comment claims audit` in full;
- D-037 and D-038 (`.planning/intel/decisions.md`), CTRL-03 and CTRL-05;
- read only: `src/accessories/basementGuardian.ts` (`reportedControlValue` 571-573, the transport
  and live-path facts 594-605, `republishControlRows` 641-653, the binder and its `republish`
  callback 658-692, `bindControlRow` 698-706, `publishRows` 721-748, `republishPublishedRows`
  776-791, `reconcileControls` 925-930, both `update()` branches 984-1067);
  `src/accessories/serviceCatalogue.ts` (`isRowPublishable` 262-266, `controlValues` 541-545,
  `publishedService` 885-887, `ensureService` 926-934, `publishValue` 974-978);
  `src/accessories/staleMarking.ts` (`refuseRestoredControls` 130-134); `src/platform.ts`
  (`updateDiscoveredDevice`, `dispatchDiscoveredDevice` 296-367, `registerDiscoveredDevices`
  380-391, `configureAccessory` 662-672); `src/runtime/accountRuntime.ts`
  (`commandTransportReadyNow` 610-612); `src/runtime/commandPort.ts`; `src/runtime/timers.ts`;
- `features/lib/hap.ts` (the stand-in the test imports) and
  `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js` (`onSet` 1346-1352,
  `updateValue` 1627-1650, `handleGetRequest` 1683-1735, `handleSetRequest` 1786-1872).

Opening open set: 1. Confirmed fixed: 1. Still open: 0. Reopened: 0. New: 1 (0 BLOCKER, 1
WARNING). Closing: 1.

## Round status

### Opening ID

- **CR-05-CONTROLS-044** fixed (`dda7a47`, `52f33bf`).
  - The three claims 044 named are gone. The overview (43-53) now says the binder's handler
    replaces the refusal "when the accessory's publish pass binds the control row, which happens
    only once the device's family resolves". The JSDoc's first sentence (428-431) says the same.
    The cause paragraph (441-446) names the window the refusal exists for (a restart the cloud has
    not answered) and adds that the refusal stays, with the same line, while a cached accessory's
    family does not resolve.
  - Checked against the code. Only `bindControlRow` calls `bind`, and only `publishRows` calls it
    (`basementGuardian.ts:705, 739`). `update()` reaches `publishRows` only when the registry
    answers `implemented` (`basementGuardian.ts:991, 1060`); the other branch calls
    `republishPublishedRows` (`basementGuardian.ts:1012`), which never binds. So "only once the
    device's family resolves" is a true necessary condition, and the binder's `onSet` takes the
    one `setHandler` slot (HAP 1346-1352).
  - Both commits change comment lines only (diff above). No literal, cause, status, order or
    statement changed (D-05, P-05-01).
  - The 21 other source rows and the 9 test rows the R7 audit marked FALSE now read as the audit's
    "now" column says. I re-checked the audit's TRUE and FALSE results against the current lines
    and the pinned HAP source, and each still holds, with one exception: the audit did not rate the
    clause "It is also what makes this refusal replaceable rather than permanent" (465-469; R7
    rows 462-463 and 463-465 rate the clauses around it). That clause is false. It is a separate
    cause, not a return of 044's lifetime claims; see CR-05-CONTROLS-045.
  - The rewritten comments I checked in detail:
    - 30-32: "later reads answer that status until a push or an accepted write clears it". True:
      `handleGetRequest` throws a stored status when there is no get handler (HAP 1729-1731);
      `updateValue` with a non-`Error` value sets it to `0` (HAP 1650); an accepted write sets it
      to `0` (HAP 1787, 1806).
    - 33-36 and 72-74: "a microtask queued inside the binder's asynchronous handler runs before
      HAP's own catch assigns the status". True. `answerWrite` is `async` (589), the handler
      returns its promise (640), and HAP's catch runs only after `await this.setHandler(...)`
      settles (HAP 1805, 1818).
    - 181-184: the restored refusal's timer reason now claims only the order ("after HAP's own
      catch"). True: the restored handler throws synchronously, so HAP's catch runs before any
      timer.
    - 103-106: "one rule decides both". True: `reportedControlValue` and the row both read
      `isRowPublishable` (`basementGuardian.ts:571-573`; `serviceCatalogue.ts:333-335, 541-545`).
    - 131, 408, 532: "no more than the control rows". True: the accessory's callback republishes
      the control rows or nothing (`basementGuardian.ts:685-691`), and the restored refusal passes
      `nothingToRepublish`.
    - 414 and 455-457: "still returns the stored status to `0`". True: `heldOn` answers a boolean
      (403), so `updateValue` takes the non-`Error` branch (HAP 1650).
    - 421-426: "handed no rows to re-assert". True: 472 passes `nothingToRepublish`.
    - 521-522: "the binder calls `republish`". True: 540.
    - 552-553: "until a push or an accepted write clears it". True, as 30-32.
    - 259-266: "for example because". The list is no longer presented as complete.
    - Test 44-45, 48-49, 52-54, 209-217, 390-392, 405-406, 1105-1108, 1481-1483, 1506: each now
      says what the R7 audit's "now" column says, and each is true against `features/lib/hap.ts`
      (73-79, 280-347, 422-523), `controls.ts:589-599` and HAP 1818-1830.

### Earlier fixed IDs

All 43 are still fixed. None reopened. Every fix commit in the dispatch (001 to 044) is an ancestor
of HEAD (`git merge-base --is-ancestor`, each exit 0). Test anchors after line 54 are one line
lower than in round 7; source anchors moved by up to three lines after 50.

- **CR-05-CONTROLS-001** still fixed: 'ignores a confirming report that lands after the window already closed' (1391-1407) compares the whole `warnings` array. The only `.length` is the stub's handle (99).
- **CR-05-CONTROLS-002** still fixed: `describe('createControlBinder')` (625-1461) and `describe('bindRestoredControlRefusal')` (1463-1620), top level, not nested.
- **CR-05-CONTROLS-003** still fixed: no "microtask" in the test.
- **CR-05-CONTROLS-004** still fixed: the spies at 886, 1121 and 1540 are `t.mock.method(..., 'onSet')`. Each `.bind(` hit (170, 889, 890, 1122, 1428, 1450) is `ControlBinder.bind`.
- **CR-05-CONTROLS-005** still fixed: `// act & assert` only at 1125 and 1550, each over one `assert.rejects()`.
- **CR-05-CONTROLS-006** still fixed: `as unknown as` only at 50 (`HAP_NAMESPACE`) and 55 (`asService`), both commented (D-11).
- **CR-05-CONTROLS-007** still fixed: the order note (337-362) sits directly above `const LOCAL_REFUSALS` (363).
- **CR-05-CONTROLS-008** still fixed: `pending` (231), `isAwaitingConfirmation` (316-318), its row last (370) and `pending: requested.has(capability)` (598). The cases at 728-758 and 760-791 pass.
- **CR-05-CONTROLS-009** still fixed: `refuseOutcome` calls `resolvePending` only for `vendor-error` (579-581). 819-848, the row at 336-349 and the row at 898 expect pending `['self-test']`.
- **CR-05-CONTROLS-010** still fixed: `PRECEDENCE` (11 rows, 434-512) and `PENDING_PRECEDENCE` (6 rows, 517-560) run at 1256-1297; with 1177, 1216 and 1239 all 14 pairs that can hold together have a case.
- **CR-05-CONTROLS-011** still fixed: 1050-1079 runs every deferral, compares `{ thrown, pending, delays, cancelled }` and calls `verify(commands)`.
- **CR-05-CONTROLS-012** still fixed: 702-726 compare `{ pending, cancelled }`.
- **CR-05-CONTROLS-013** still fixed: 896-931 and 1299-1325 record `republish` before and after the push.
- **CR-05-CONTROLS-014** still fixed: 935-951 and 1598-1619 change the value between the refusal and the push.
- **CR-05-CONTROLS-015** still fixed: `RESTORED_PRESSES` (620-623) drive 1464-1533.
- **CR-05-CONTROLS-016** still fixed: 1109-1138 and 1537-1562 assert `instanceof HAP.HapStatusError` and `hapStatus`.
- **CR-05-CONTROLS-017** still fixed: no `// act` block holds an `assert.` call; `assertRefused` is not in the file.
- **CR-05-CONTROLS-018** still fixed: `readOfSwitch` (604-610) awaits inside its `try`; every caller awaits it.
- **CR-05-CONTROLS-019** still fixed: 1006-1014, one `test()` per row.
- **CR-05-CONTROLS-020** still fixed: 153-158 state the single slot with no replacement warning.
- **CR-05-CONTROLS-021** still fixed: 108-112 quote the WR-02 title in the present tense; 324-328 have no "now".
- **CR-05-CONTROLS-022** still fixed: 1213-1215 and 1236-1238 name "the quiet-live-path rule".
- **CR-05-CONTROLS-023** still fixed: each case that promises sends makes `mock<CommandPort>({ exactParams: true, name: 'commands' })` inside the case and calls `verify(commands)` last. No `anyTimes`, `It.isAny` or `recordingCommands`.
- **CR-05-CONTROLS-024** still fixed: `acceptedOutcome()` (32-34) and per-row factories; `RefusalCase` fields are `readonly`.
- **CR-05-CONTROLS-025** still fixed: D-01 header at `controls.ts:1-54` (Header inspection).
- **CR-05-CONTROLS-026** still fixed: 26-29 and 337-338.
- **CR-05-CONTROLS-027** still fixed: 86.
- **CR-05-CONTROLS-028** still fixed: 108-110 and 157-161 are block bodies.
- **CR-05-CONTROLS-029** still fixed: 685 and 1043-1046 compare whole delay lists.
- **CR-05-CONTROLS-030** still fixed: the support comments name tables and entrypoints.
- **CR-05-CONTROLS-031** still fixed: `function noop(): void` at 67 and 85.
- **CR-05-CONTROLS-032** still fixed: 489-494, 550-554 and 622-624.
- **CR-05-CONTROLS-033** still fixed: `outcomeWarning` (387-391). The test expects the timed-out line at 338, 844 and 862; "did not take effect" appears only for `vendor-error` (390; test 324).
- **CR-05-CONTROLS-034** still fixed: no case with identical code under two claims; "quotes nothing else" is not in the file.
- **CR-05-CONTROLS-035** still fixed: "the other half", "the one case" and "half the time" are not in the source.
- **CR-05-CONTROLS-036** still fixed: 953-981 is unchanged and passes.
- **CR-05-CONTROLS-037** still fixed: the transport and clearing-push comments make no waiting-request claim (90-101, 406-414); "third fact" and "middle rules" are not in the source.
- **CR-05-CONTROLS-038** still fixed: the `PRECEDENCE` comment (432-433) names exactly the three pairs it does not hold.
- **CR-05-CONTROLS-039** still fixed: `bind` JSDoc (160-162), `hasNoFreshState` (280-285), `clearRefusal` (406-414), `expire` (521-534), `timers` JSDoc (68-77) and the note above `isConfirmedOffline` (295-299). "vouch" appears only at 527, for the marking rule.
- **CR-05-CONTROLS-040** still fixed: the test's code lines are unchanged since round 5; `52f33bf` changed comments only.
- **CR-05-CONTROLS-041** still fixed: 760-791 and 793-817 are unchanged and pass.
- **CR-05-CONTROLS-042** still fixed: 98-106 make no `reported`-scope claim beyond what round 6 accepted; `dda7a47` changed only 104-105 ("one rule decides both").
- **CR-05-CONTROLS-043** still fixed: the overview (18-21) still names the Switch that `ensureService` answers; the `publishedService` clause has not returned.

Reopened: none.

## Findings

### CR-05-CONTROLS-045 - WARNING: The restored refusal's body comment says `onSet` is what makes the refusal replaceable, but an `on('set')` refusal would also stop answering once the binder binds

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments say what the code does and, when it is not obvious, why; the why must be true of the code as it stands). The `typescript-style` "Classifying findings" makes comment findings WARNING.
**Location:** `47b0cb1e8e95c0cbe796825142e92b3bc91e151e:src/accessories/controls.ts:465-469`
**Issue:** The comment above the restored refusal's `onSet` call gives two reasons for `onSet`.
The first is true: "HAP warns when a characteristic carries both and ignores the event listener."
The second is false: "It is also what makes this refusal replaceable rather than permanent --
`setHandler` is one slot, so the binder's own handler takes it over when the accessory's publish
pass binds the control row."

The refusal can be replaced because the binder uses `onSet` (640). Whether the refusal itself uses
`onSet` does not matter. `handleSetRequest` calls `setHandler` whenever one exists. It only warns
about `set` listeners and never calls them (HAP 1800-1805). So a refusal registered with
`on('set', ...)` would also stop answering when the binder binds. The only difference is that the
ignored listener would stay attached and HAP would warn on every later write. The comment's own
first sentence says that HAP ignores the listener, so the second sentence contradicts it.

A read-only probe of the real package confirms this (Toolchain evidence). An `On` characteristic got
a refusing `on('set')` listener, and a write answered `-70412`. Then it got an accepting `onSet`
handler, and the next write was accepted: `value` became `true`, `statusCode` became `0`, and HAP
emitted one `characteristic-warning` of type `warn-message`.

This is new evidence. The R7 comment claims audit rated 462-463 (the warning) and 463-465 ("takes
it over on the first publish") but did not rate this clause. No earlier report or ledger row
discusses it (`grep -i "replaceable\|permanent"` over `05-CONTROLS-REVIEW*.md` and
`05-FINDINGS.md` finds nothing). The clause dates from `b19ea58`, before the batch base. It is not
a return of CR-05-CONTROLS-044, which was about when the refusal ends and which cause it names, not
about which HAP API makes it replaceable. A maintainer who trusts the clause could think that the
binder's own `onSet` (640) is not needed for the replacement, or that changing the refusal to
`on('set')` would make it permanent. Neither is true.
**Fix:** One comment-only `docs(controls)` commit in `src/accessories/controls.ts`. Change no
code, literal, cause, status or order (D-05, P-05-01). Keep the first sentence. Replace the second
sentence with the true reason, for example: "It also leaves nothing behind: `setHandler` is one
slot, so the binder's own `onSet` replaces this handler when the accessory's publish pass binds the
control row, and no ignored `set` listener remains for HAP to warn about on every later write."
You can also delete the second sentence. The overview (50-53) already says, correctly, that the
single slot is why the binder's handler replaces the refusal.
**Flags:** no genuine production bug (D-04): the handler and its replacement behave correctly. No
D-10: SC-02 touched no source line. Not a reopen of CR-05-CONTROLS-044, 026 or 043. No exported
contract change (D-06).

## Candidates considered and not filed

- **The cause paragraph names only one window past the restart (441-446).** The refusal also stays,
  with the transport line, for a cached accessory whose `deviceId` is missing from the inventory
  (`registerDiscoveredDevices` walks only the inventory's IDs, `platform.ts:380-381`; removal
  needs confirmed absence, `platform.ts:533-538`). It also stays when the store has no snapshot
  for that device (`platform.ts:300-302`). The sentence "The refusal also stays ... while a cached
  accessory's family does not resolve" does not say that this is the only case. The lifetime
  sentence (428-431, "until the accessory's publish pass binds the control row") is true in every
  case. So no claim is false. Not filed. The behavior goes in Out-of-scope observations, with
  S-05-25.
- **"Reusing both keeps one condition answering one status with one wording" (443-444) next to the
  new admission that the same line answers an unresolved family.** One condition still has one
  wording. The reverse (one wording, two conditions) is the behavior question in S-05-25. Not
  filed.
- **The overview justifies the macrotask only for the binder's asynchronous handler (33-36), but
  the restored refusal also uses one.** The restored timer JSDoc (181-184) claims only the order,
  and that order is true. The overview does not claim that the restored handler needs a macrotask.
  Not filed.
- **"HAP warns when a characteristic carries both" (466).** HAP warns on each write while both
  exist (HAP 1800-1802), not when the listener is added. The claim is still accurate. Not filed.
- **`refuse()` (356-380) repeats `writeRejection`'s `try`/`catch`.** This is test-support
  duplication, and no rule in the books covers it. D-15 is about static gates. Not filed.
- **Round 1 to 7 rejections, rechecked against the current lines and still not filed:** the
  `commandTransportReady` JSDoc ending with paragraphs about `reported`; "one failed poll clears
  it"; `reconcile` clearing only on a matching value; the `bind` guard "keeps `bind` idempotent";
  the `SELF_TEST` subtype; 'arms one clearing push ...' phases; `nothingToRepublish` against
  `accessoryName`; the `isAlreadyActive` "would not have"; the `bind` JSDoc "already published"
  wording; `hasNoFreshState` and its pinned cause; a timed-out outcome after an in-flight
  confirming report; `RestoredControlRefusalOptions` exported with no importer; 'warns that a
  timed-out request may still have reached the device' (P-05-03); the two held sends in the 041
  cases; the `republish` JSDoc against `expire`; the `bind` guard keyed by service; JSDoc on members
  of module-local interfaces; comment line widths; the `liveConfirmationObservable` wording; 'leaves
  a restored control answering a read before any press reaches it'; the comment inside the case at
  1062; `OnSetCall.arguments`; the inline `try`/`catch` in the D-04 regression cases;
  `windowsIn(deferrals)[0]?.handle`; the late `vendor-error` against a newer entry; the
  per-accessory rows; `refuse()` with no `// arrange`; the subset cases; the three "names the ..."
  cases; "it fails independently of the one below"; the second `assert.strictEqual` at 643;
  `outcomeWarning` as a noun phrase; `heldOn` annotated `CharacteristicValue`; a `commands.send`
  that rejects; the `alarm-mute` constant; 'answers the transport refusal status to every read ...'
  reading `statusCode`; 'holds one independent entry per capability ...' with no `cancelled`; the
  036 comment "a requested value never shows as reported state"; no owner case for a waiting
  request with no reported value; the overview's "cached or just added" (18-21); "Every writer of
  `On`" (38-41); the ragged rewrap in the JSDoc; the display name rather than the `deviceId` in the
  restored line.

## Header inspection

- `src/accessories/controls.ts` conforms to D-01:
  - line 1 is `// SPDX-License-Identifier: MIT` and line 2 is empty;
  - lines 3-5 hold the copyright block (`Copyright (c) 2026 Alessandro Colomba`) and line 6 is
    empty;
  - lines 7-54 hold the `@fileoverview` block and line 55 is empty;
  - the first import is at line 56.
- `test/accessories/controls.test.ts` conforms to D-01:
  - line 1 is the SPDX line and line 2 is empty;
  - lines 3-5 hold the copyright block and line 6 is empty;
  - lines 7-9 hold the `@fileoverview` block and line 10 is empty;
  - the first import is at line 11.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS`
  printed `ACCESSORIES_HEADERS_OK files=2` and exited 0.

## Toolchain evidence

- All commands ran from the repository root at `47b0cb1e8e95c0cbe796825142e92b3bc91e151e`, with a
  clean tree before and after.
- Each command had the prefix `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.
- Versions: Node `v26.12.0`, npm `11.20.0`.
- The run started at 2026-10-17T23:07:46Z and ended at 2026-10-17T23:08:00Z.
- Before linting, I deleted `node_modules/.cache/eslint`, so the lint is fresh.
- No command was piped. Each command's output went to a file in the session scratch directory,
  and `$?` was read straight after it, so each exit below is the command's own.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both projects compile, no diagnostics |
| `node_modules/.bin/eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | compiled |
| `node --test dist-test/test/accessories/controls.test.js` | 0 | tests 105, suites 2, pass 105, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | 0 | only the npm banner, no failure (the pair is at 100% alone) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

Probe for CR-05-CONTROLS-045 (read-only, made-up inputs, script in the session scratch directory,
not in the repository). Command: `node <scratch>/probe-onset.mjs <repo>`, exit 0. The script loads
the real `@homebridge/hap-nodejs` through `createRequire`. It builds `new Characteristic.On()` and
adds an `on('set')` listener that calls back with `HapStatusError(-70412)`. It calls
`handleSetRequest(true)`, then registers `onSet(async () => {})` and calls `handleSetRequest(true)`
again. Output: `{"before":-70412,"after":"accepted","value":true,"statusCode":0,"warnings":["\"warn-message\""]}`.

Other read-only commands: `git merge-base --is-ancestor <commit> HEAD` exited 0 for every fix
commit from 001 to 044; `git show dda7a47 -- src test`; `git show 52f33bf -- test`;
`git diff 09727ef HEAD -- src test` filtered to non-comment changed lines (none);
`git log -S"replaceable rather than permanent" -- src/accessories/controls.ts` (`b19ea58`).

I made no source or test edit, ran no mutation experiment and made no commit or stash. Every check
passes. The one finding is a comment, and the checks cannot see comment content.

## Out-of-scope observations

- `src/platform.ts:296-302, 380-391` (Phase 6) with `src/accessories/staleMarking.ts:130-134`:
  the restored refusal also outlives the restart window for a cached accessory whose `deviceId` is
  missing from a successful inventory, or that has no store snapshot. Nothing builds or binds that
  accessory until removal is confirmed (two trustworthy polls and a final check, `platform.ts:533-538`),
  or ever, if the removal is refused. Every press during that time logs `...: the plugin has no way to
  reach the vendor right now.` while `commandTransportReady` is true. This widens lead S-05-25,
  which names only the unresolved-family branch. Refusing is right; the named cause is the same
  behavior question.
- Unchanged from round 7:
  - S-05-25 (`src/accessories/basementGuardian.ts:991-1012`): the unresolved-family branch never
    binds the control rows;
  - S-05-24 (`src/accessories/basementGuardian.ts:694-697`, and expiry under a refused credential);
  - `src/accessories/basementGuardian.ts:591-593`: the transport comment repeats the claim that
    CR-05-CONTROLS-042 fixed in `controls.ts`;
  - `src/accessories/serviceCatalogue.ts:337`: "vouch" names the withholding rule;
  - `src/runtime/commandPort.ts:21`: "did not take effect" also covers `timed-out`;
  - `test/accessories/basementGuardian.test.ts:2844-2847` and
    `src/accessories/basementGuardian.ts:567-570`: history narration;
  - the AGENTS.md privacy sentence conflicts with `deviceId` (`<account-id>_<serial-number>`) in
    log lines (maintainer).
- `features/lib/hap.ts:316-336` (Phase 7, D-12): the stand-in's `handleSetRequest` does not reset
  `statusCode` to `0` on entry as the real one does (HAP 1787). No controls case depends on this,
  because a refusal sets the status again and an accepted write clears it on both paths.

---

_Reviewed: 2026-10-17T23:16:00Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 8)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. Opening 1, fixed 1, rejected 0, new 1, reopened 0,
closing 1. The round has an open finding and closing (1) is at least opening (1), so the result
is `STOP: no progress` (D-03 as amended, D-18). CR-05-CONTROLS-001 to 043 stay fixed, and the R7
comment-claims audit's results hold.

- **CR-05-CONTROLS-044:** `fixed`, as the Round status shows.
- **CR-05-CONTROLS-045:** `open`, WARNING, comment-only. The coordinator checked pinned HAP: when
  a `setHandler` exists, `handleSetRequest` calls it and only warns about `set` listeners
  (`Characteristic.js:1800-1805`). So the binder's `onSet` would take over an `on('set')` refusal
  too, and "It is also what makes this refusal replaceable rather than permanent" is false. The
  clause dates from the first release, and the R7 audit rated the sentences around it but not
  this clause.
- **Out-of-scope observations:** the reviewer found that a restored refusal also stays for a cached
  accessory whose device is missing from the inventory or has no stored snapshot
  (`src/platform.ts:296-302, 380-391`). It logs the transport cause while the transport is ready.
  Lead S-05-25 now covers that path as well. The stand-in's `handleSetRequest` reset gap is GATES
  lead S-05-15 (3).
- **Stop:** the counter row is written with `STOP: no progress` and left uncommitted, with this
  report, until the maintainer resolves it.
- **Maintainer resolution (2026-10-17):** "Resolve and continue". The counter row now reads
  `STOP: no progress; resolved by maintainer`. The coordinator repairs 045 with a clause-level
  audit of the comments in `src/accessories/controls.ts` and runs correction round 9.
