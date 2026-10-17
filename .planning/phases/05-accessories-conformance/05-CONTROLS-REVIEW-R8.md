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

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CONTROLS-045 | `src/accessories/controls.ts` (comment lines only); this report | Node `v26.12.0`: `fallow guard src/accessories/controls.ts` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/controls.test.js` 0 (tests 105, suites 2, pass 105, fail 0); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` 0; `eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 4c143eb --format json --quiet --explain` 0, verdict `pass` | n/a (WARNING) | The 045 fix and every FALSE source clause of the audit below, comment lines only. 045: the note in `bindRestoredControlRefusal` (465-469) keeps its first sentence and drops the second, so it no longer says that `onSet` is what makes the refusal replaceable. The overview (50-53) still says why the binder's handler replaces the refusal. The other seven FALSE source clauses below are fixed in the same commit. No statement, literal, cause, status or order changed. The audit found no FALSE clause in the test file, so there is no test commit. |

## Clause-level comment audit

Scope: every comment and JSDoc block in `src/accessories/controls.ts`, and every comment in
`test/accessories/controls.test.ts` that states a fact about production behavior, another module,
HAP or other cases. Phase markers (`// arrange`, `// act`, `// assert`, `// act & assert`), the
license and copyright headers, and test titles are out of scope, as in the R7 audit.

Method: each sentence is split into its clauses. A clause is each independent claim and each
"because", "so", "also", "only", "every", "never", "until", "first", "same", "one", count or
causal link. Each clause is checked against the code or, for HAP, the pinned package source.
TRUE and FALSE are facts about the code as it stands. "rationale" is a reason for a choice, a
counterfactual or an outside fact (a decision, the vendor, Apple Home); it only has to be
consistent with the code. A FALSE clause is fixed by saying less: the clause is dropped or
narrowed, and no new claim is added that was not checked.

Locations and evidence lines are at `2079eb9`, which is byte-identical to `47b0cb1` for both files
(`git diff --stat 47b0cb1 HEAD -- src test features` printed nothing). "HAP" is
`@homebridge/hap-nodejs` 2.2.2, `dist/lib/Characteristic.js`; "HAP `Service.js`" is
`dist/lib/Service.js` of the same package.

### `src/accessories/controls.ts`

| Location | Clause | Evidence | Result |
| --- | --- | --- | --- |
| 8 | The one place a HomeKit write reaches the vendor. | The only `.send(` in `src` is 616 (`grep -rn "\.send(" src`). | TRUE |
| 10-11 | Everything else flows one way: a vendor fact becomes a published characteristic. | No other `onSet`, `onGet` or `set`/`get` listener in `src` (grep); `basementGuardian.ts:27`. | TRUE |
| 11-12 | This module is the only path in the other direction. | As above; `commands.send` only at 616. | TRUE |
| 12-13 | So it is where a controller can cause a physical action for the first time. | - | rationale |
| 13 | It is deliberately narrow. | - | rationale |
| 13-14 | Two capabilities exist. | `family.ts:24`. | TRUE |
| 14 | Only `true` is ever requested. | 616 sends `acceptedValueOf` (247-249); `alarmMute.ts:37`. | TRUE |
| 14-16 | The wire body is built behind the family boundary by whoever implements the port. | `accountRuntime.ts:262-272, 1144-1145` (`family.command`). | TRUE |
| 16 | So nothing here knows what a Gemini calls anything. | The port takes `(deviceId, capability, accepted)` (616); no vendor field name in a code line. | TRUE |
| 18 | The catalogue stays projection-only. | No `onSet` in `serviceCatalogue.ts` (grep). | TRUE |
| 18-19 | The binder attaches to the Switch `ensureService` answers for a control row. | `basementGuardian.ts:705, 732, 739`. | TRUE |
| 19-20 | One the cache restored, or one that call has just added. | `serviceCatalogue.ts:926-933` (`getServiceById`, else `addService`). | TRUE |
| 20-21 | So one service list keeps feeding subtypes, names and descriptors. | - | rationale |
| 23 | "Two HAP behaviours govern the code below" | The file names more HAP behaviours the code below depends on: `setCharacteristic` routing (38-39), success with no handler (45-46), the single set-handler slot (50), the plain `Error` conversion (393-395), the warning for both handler kinds (465-466, 638-639). | FALSE: now "These HAP behaviours govern the code below" |
| 23-24 | Both read out of the pinned package's own source rather than assumed. | - | rationale |
| 26 | A rejected write never moves the stored value. | HAP 1815 assigns `value` only on success; the catch (1819-1832) does not. | TRUE |
| 26-27 | So nothing here restores a refused toggle. | No code writes a pre-write value back; the push (418) carries the reported or the held value. | TRUE |
| 27-28 | A push before the throw would only emit a change nobody asked for. | Counterfactual; HAP 1650-1655. | rationale |
| 28-29 | HAP assigns the refusal status after the handler throws. | HAP 1805, 1819-1831. | TRUE |
| 29 | So the push could not clear it. | Follows from the clause above. | TRUE |
| 30 | A rejected write stores its status on the characteristic. | HAP 1821-1831. | TRUE |
| 30-31 | Later reads answer that status. | HAP 1729-1730; no read handler in `src`. | TRUE |
| 31 | Until a push or an accepted write clears it. | HAP 1650, 1787, 1806; every push onto `On` carries a boolean (418; `basementGuardian.ts:631, 742`). | TRUE |
| 31-33 | Left alone, one refused press can keep the Switch unreadable long after the press. | A row withholds `On` while pending or doubtful (`serviceCatalogue.ts:330-332, 544`). | TRUE |
| 33 | Every refusal therefore arms a clearing push. | 564, 583, 471. | TRUE |
| 33-34 | That push is a macrotask through the injected timer port. | 545-547, 471-473; `timers.ts:45`. | TRUE |
| 34-36 | A microtask queued inside the binder's asynchronous handler runs before HAP's catch assigns the status. | 589, 640; HAP 1805, 1819 (R7 probe). | TRUE |
| 36 | So it would clear a status that has not been set yet. | Follows. | TRUE |
| 38-39 | Once `On` carries a handler, `setCharacteristic` routes through the write path. | HAP `Service.js:517-519`; HAP 1612, 1800-1805. | TRUE |
| 39 | And becomes a command this plugin issued to itself. | The write reaches the plugin's own handler (as above). | TRUE |
| 39-40 | Every writer of `On`, here and in each caller, uses `publishValue`. | 418; `basementGuardian.ts:631, 742`; `staleMarking.ts:109` pushes `StatusActive` only; `setCharacteristic` only on `AccessoryInformation` (`basementGuardian.ts:457-460`). | TRUE |
| 40-41 | `publishValue` updates rather than sets. | `serviceCatalogue.ts:974-977`. | TRUE |
| 43 | The binder is not the only write handler this module owns. | 470. | TRUE |
| 43-45 | A restart the cloud never answers restores the control Switches from the cache. | `platform.ts:661-672`. | TRUE |
| 45 | "long before any accessory exists to route a press" | Accessories are built only from `onTrustworthyInventory` (`platform.ts:611-613`; `accountRuntime.ts:459`). A cloud that never answers never calls it, so no accessory ever exists in that run. | FALSE: now "before any accessory exists to route a press" |
| 45-46 | HAP answers a write with no handler by storing the value and reporting success. | HAP 1834-1838. | TRUE |
| 46-48 | So the toggle flips, an automation fires, and nothing happened. | - | rationale |
| 48-50 | The refusal carries the transport rule's status and cause. | 365 against 474 and 476. | TRUE |
| 50 | A set handler is a single slot in HAP rather than a listener list. | HAP 1346-1352. | TRUE |
| 51-52 | So the binder's own handler replaces the refusal when the publish pass binds the control row. | 640; HAP 1351; `basementGuardian.ts:705, 739`. | TRUE |
| 52-53 | Which happens only once the device's family resolves. | `basementGuardian.ts:991-1016, 1060`. | TRUE |
| 64 | Everything the control binder needs, by injection. | 65-139, 487. | TRUE |
| 69 | Deferred execution, scheduled on the write path and nowhere else. | `setTimeout` only at 545 and 611, both reached from `answerWrite`. | TRUE |
| 69-70 | A confirming report only cancels a deadline that path scheduled. | 517 with the handle from 611, through 645. | TRUE |
| 72-73 | The push has to run after HAP's catch has stored the status. | HAP 1819-1832. | TRUE |
| 73-74 | A microtask queued inside the binder's asynchronous handler runs before that catch. | As 34-36. | TRUE |
| 74-76 | Taking the port lets a test read back the delay instead of watching a clock. | Test 92-114. | rationale |
| 80 | The device every command is addressed to. | 616. | TRUE |
| 83 | Whether the configured run of consecutive disconnected polls has been reached. | `basementGuardian.ts:587-589`. | TRUE |
| 85-86 | The accessory answers this from the same count it hands `ProjectionInput`. | `basementGuardian.ts:587-589, 614`. | TRUE |
| 86-87 | So the fact a row publishes from and the fact a write is refused on cannot disagree. | `offlineCount` changes only in `update()`, which republishes in the same call (`basementGuardian.ts:1007-1012, 1038-1060`). | TRUE |
| 91 | Whether the plugin has a proven way to reach the vendor at all. | `accountRuntime.ts:610-612`. | TRUE |
| 93 | A fact about the plugin, not about the device. | `accountRuntime.ts:634, 645-648`. | TRUE |
| 93-94 | The route can be missing while a reported value is held. | A failed poll changes only `polling` (`accountRuntime.ts:788-792`); `lastDecoded` stays. | TRUE |
| 95 | So the rule that reads this fact names its own cause. | 365. | TRUE |
| 95-96 | A user learns that the plugin had no route to send on. | 329, 565. | TRUE |
| 98 | The accessory answers this from the account-wide monitoring trust. | `basementGuardian.ts:594-596`; `accountRuntime.ts:634, 648`. | TRUE |
| 98-99 | No row reads this fact. | Rows read `credentialsRejected`, `shadowSilent` and `restDegraded` (`basementGuardian.ts:325-334`). | TRUE |
| 99 | One failed poll clears it. | `accountRuntime.ts:789`. | TRUE |
| 99 | And withdraws no row's trust. | Two failures withdraw trust (`accountRuntime.ts:602-609`). | TRUE |
| 100-101 | So a press can be refused for a missing route while the tile shows a value. | Follows. | TRUE |
| 103-104 | `reported` is answered through the same rule that decides whether the row may publish it. | `basementGuardian.ts:571-573`; `serviceCatalogue.ts:329-335, 541-545`; the control row's scope is its capability (`serviceCatalogue.ts:815, 824`). | TRUE |
| 104-106 | For that value the two facts cannot disagree: one rule decides both. | As above. | TRUE |
| 108-109 | If they could disagree, a press would be refused beside a tile showing the state. | - | rationale |
| 109-112 | The quoted WR-02 case reads the write path's own answer. | Title at `basementGuardian.test.ts:2848`. | TRUE |
| 116 | Whether the live path can carry the device's own confirmation. | `basementGuardian.ts:603-605`. | TRUE |
| 118 | A fact of its own, not a shade of the route or the reported value. | - | rationale |
| 119-121 | The plugin can hold a route and a fresh reported value and still be unable to see the answer. | `polling` (`accountRuntime.ts:610-612`) and `shadowSilent` (`basementGuardian.ts:603-605`) are separate; a quiet live path withdraws scopes as `unreachable` (`basementGuardian.ts:330-331, 362-365`), which still publishes (`serviceCatalogue.ts:227, 262-266`). | TRUE |
| 121 | A confirmation travels on the live path. | `update()` reconciles a live snapshot as it does a poll (`basementGuardian.ts:1049`). | TRUE |
| 121-122 | The window is shorter than a poll interval. | 210 (30 s); `config.ts:25` (300 to 3600 s). | TRUE |
| 122-123 | So while that path is quiet the earliest confirmation is a poll that may be an hour away. | `config.ts:25`. | TRUE |
| 125-126 | "would reach a real sump pump and expire with a warning" | Polls run on their own interval (`accountRuntime.ts:1052-1055`), so one can land inside the 30 s window and confirm the request (`basementGuardian.ts:1037-1049`). The expiry is not certain. | FALSE: now "could expire with a warning" |
| 126 | The warning names a device failure that did not happen. | - | rationale |
| 126-128 | The duplicate rule would meanwhile judge a reading up to a poll interval old. | With the live path quiet, `reported` comes from the last poll. | TRUE |
| 128 | So a second press could start a test while one was already running. | A test the vendor app or a schedule started (`constraints.md:543`). | rationale |
| 132 | Republishes no more than the control rows. | `basementGuardian.ts:684-691`. | TRUE |
| 134 | Nothing else changed when a write was refused. | - | rationale |
| 134-136 | A full republish would make the "two updates cannot interleave" claim harder to hold. | The claim is at `basementGuardian.ts:100-102`. | rationale |
| 144 | The capabilities carrying an unresolved request. | 628-630. | TRUE |
| 146-147 | The accessory reads this into `ProjectionInput`. | `basementGuardian.ts:690, 985, 1012, 1060`. | TRUE |
| 147 | The only route requested state reaches a row through. | `serviceCatalogue.ts:544`; this module writes no store. | TRUE |
| 147-148 | No reported patch and no shadow topic carries it. | This module writes no store or topic; `commands.send` is its only outbound call (616). | TRUE |
| 148 | So it can never become canonical safety state. | Follows (D-037). | TRUE |
| 152 | Attaches the handler to a Switch the catalogue already published. | `bind` gets the service `ensureService` answers (`basementGuardian.ts:732, 739`); the catalogue calls a carried service published (`serviceCatalogue.ts:885`). | TRUE |
| 154 | Calling it again on the same service registers no second handler. | 633-635. | TRUE |
| 154-155 | HAP keeps one set handler per characteristic. | HAP 1351. | TRUE |
| 155-156 | A later `onSet` replaces the earlier one without any warning. | HAP 1346-1352. | TRUE |
| 156-157 | So the guard is what keeps `bind` idempotent. | 633-635. | rationale |
| 157-158 | The accessory walks its whole catalogue on every update. | `basementGuardian.ts:721-748, 776-791`. | TRUE |
| 160-161 | `reported` answers what the device itself last said. | `basementGuardian.ts:549-553, 571-573`. | TRUE |
| 161-162 | Or `undefined` when the row may not publish it: the field did not decode, or its scope is withdrawn for a doubtful reason. | `basementGuardian.ts:549-553, 571-573`; `serviceCatalogue.ts:227, 262-266`. | TRUE |
| 166 | Resolves a pending request against what the device reports. | 643-647. | TRUE |
| 168 | A matching reported value clears the entry. | 644-645. | TRUE |
| 168-169 | "and from then on the Switch follows reported state alone" | A later accepted press leaves HAP serving the requested value while the row withholds `On` (HAP 1815; `serviceCatalogue.ts:544`), so "from then on ... alone" does not hold. | FALSE: dropped |
| 169-170 | A capability with no pending entry is a no-op. | 644, then 513-515. | TRUE |
| 170-171 | Which makes an external test and a second confirming report harmless. | Follows. | TRUE |
| 176 | Everything the restored refusal needs, by injection. | 177-200, 463. | TRUE |
| 181 | For the clearing push and nothing else. | Only 471. | TRUE |
| 183 | The same port the binder takes. | `Timers` at 78 and 186; production passes `systemTimers` to both (`platform.ts:593, 664`). | TRUE |
| 183-184 | The push has to land after HAP's catch has stored the status. | HAP 1805, 1819-1832. | TRUE |
| 187 | The restored Switch the refusal is attached to. | 470; `staleMarking.ts:131-132`. | TRUE |
| 190 | The accessory the service came back on. | `staleMarking.ts:132`. | TRUE |
| 192-193 | The display name, because a restored accessory is all the identity there is. | - | rationale |
| 193-194 | The restart passes read nothing from the accessory context. | `staleMarking.ts:74-85, 107-111, 130-134`. | TRUE |
| 194-195 | A cache an older release wrote names no device. | `platform.ts:247-249`. | TRUE |
| 195-196 | Without a name a multi-pump account cannot tell which system refused. | - | rationale |
| 196-197 | The same reason the binder's own line carries the device identifier. | 560-562, 565. | TRUE |
| 203 | How long a request waits for its confirming report. | 611-613. | TRUE |
| 205 | The observed self-test lasts about sixteen seconds. | `constraints.md:539`. | TRUE |
| 205-207 | So the window is wide enough, not a guess. | - | rationale |
| 207-208 | When it closes the row resumes projecting reported state. | 536 deletes the entry, so `pending` drops it (628-630) and `controlValues` stops withholding `On` (`serviceCatalogue.ts:544`). | TRUE |
| 208 | Nothing is retried. | 535-542. | TRUE |
| 212-213 | One request: the value and the deadline handle. | 214-217, 609-614. | TRUE |
| 219 | Everything a local rule reads about one write. | 222-232, 255-318. | TRUE |
| 219-220 | Every fact is sampled once, before the first rule runs. | 591-599. | TRUE |
| 220-221 | So no two rules can disagree about the same press. | Follows. | TRUE |
| 224 | The one value this capability will ever be asked for. | 590, 616. | TRUE |
| 230 | An earlier request for this capability still waits. | 598. | TRUE |
| 234-235 | What decides a local refusal, its status and its cause. | 238-242. | TRUE |
| 235-236 | Nothing reaches the network for any of them. | 601-603 run before 616; 563-568 never returns. | TRUE |
| 236-237 | So a press the official client would refuse never operates a real pump. | D-07, CTRL-03. | rationale |
| 244 | The one value a capability will ever be asked for. | 590, 616. | TRUE |
| 244-245 | Self-test's is the measured `true`. | D-16. | rationale |
| 245-246 | Mute's is the provisional constant. | 248; `alarmMute.ts:37`. | TRUE |
| 246-247 | So the accepted value and the sent value move together. | 590 feeds 593 and 616. | TRUE |
| 251-252 | Anything but the accepted value is a cancel or an unmute. | 256 with `alarmMute.ts:37`. | TRUE |
| 252-253 | The device owns when a test stops; no cancel; no mute off. | D-018, D-019 (`decisions.md:442`). | rationale |
| 253-254 | So this plugin answers neither. | 364. | TRUE |
| 259-261 | No proven way to reach the vendor, for example stopped, halted, or the last poll failed. | `accountRuntime.ts:610-612`. | TRUE |
| 261-263 | Sending buys a round trip that lands as a vendor error and blames the vendor. | - | rationale |
| 263-264 | A fact about the plugin, not about the device. | As 93. | TRUE |
| 264 | It fails independently of the one below. | `polling` against `shadowSilent` (as 119-121). | TRUE |
| 265 | A fresh live report can arrive while authentication has not completed. | Every REST request waits for `auth.idToken` (`api.ts:170`), which renews by a new grant (`auth.ts:557-593`); the open shadow keeps the AWS credentials it holds (`accountRuntime.ts:977-984`); a failed poll changes only `polling` (`accountRuntime.ts:788-792`). | TRUE |
| 265-266 | So it carries its own cause. | 365. | TRUE |
| 271 | The live path has gone quiet. | 277; `basementGuardian.ts:603-605`. | TRUE |
| 272 | "the wait for a confirmation closes long before the next poll could carry it" | Polls run on their own interval (`accountRuntime.ts:1052-1055`), not at an offset from the press, so the next poll can land inside the 30 s window. | FALSE: now "the wait for a confirmation is shorter than a poll interval" (210; `config.ts:25`) |
| 273 | Sending anyway would operate a real sump pump. | - | rationale |
| 273-274 | "and then warn that the device never confirmed it" | A poll inside the window can confirm the request, as 272. | FALSE: now "and could then warn" |
| 274-275 | For a condition on this side of the connection. | - | rationale |
| 280-281 | No reported value: the field did not decode, or its scope is doubtful. | As 161-162. | TRUE |
| 282-283 | Without one the plugin cannot tell a running test from an idle one. | - | rationale |
| 283-284 | Acting would operate a pump on a guess. | - | rationale |
| 284-285 | So this answers the same status a confirmed-offline device does. | 367-368. | TRUE |
| 290 | The device is confirmed offline. | 301. | TRUE |
| 290-291 | The one condition the official client disables both commands on. | D-018 (`decisions.md:446`). | rationale |
| 291-293 | Refusing also stops a press from blocking HomeKit for the command deadline. | - | rationale |
| 295 | Equipment faults are deliberately absent. | `ControlRequest` (222-232) has no fault field. | TRUE |
| 295-297 | The official client permits a self-test with faults present. | D-018. | rationale |
| 297 | So no refusal rule reads an equipment fault. | 364-370. | TRUE |
| 298-299 | Inventing a rule would refuse the test an owner runs. | - | rationale |
| 304 | The capability already reads what was asked for, so the press is a duplicate. | 308. | TRUE |
| 304-306 | The official client refuses one and CTRL-03 requires it. | D-07, CTRL-03 (`decisions.md:444`). | rationale |
| 306 | A second request would operate a pump the vendor would not have. | - | rationale |
| 311-312 | An earlier request still waits for the device. | 317, 598. | TRUE |
| 312 | Only one request per control can wait at a time. | One `Map` entry per capability (500) and the pending rule (370). | TRUE |
| 313-314 | A second command can operate a pump again while the first runs. | - | rationale |
| 314-315 | Nothing is sent, so the earlier request keeps its window. | 601-603 run before 609. | TRUE |
| 324-325 | Declared once because two refusals answer it. | 365, 474. | TRUE |
| 325-326 | A restart the cloud has not answered is the same condition: no route. | `polling` starts `false` (`accountRuntime.ts:354, 610-612`). | TRUE |
| 327-328 | Two wordings would be the blur the table exists to prevent. | - | rationale |
| 331-332 | Declared beside the other so the table reads as a table. | - | rationale |
| 332-334 | The cause names the connection and nothing else. | 335. | TRUE |
| 337 | The rules in the order they are evaluated. | 374. | TRUE |
| 337-338 | The first that applies answers; the rest are never consulted. | `find` (374). | TRUE |
| 340-341 | The order is a decision, not an accident. | - | rationale |
| 341 | Any two of the three can hold at once. | Independent inputs (594-597); test 1177, 1216, 1239. | TRUE |
| 341-342 | Then this order decides which cause the user is told. | 374. | TRUE |
| 342-345 | Naming the missing state to someone with no route is less actionable. | - | rationale |
| 345 | So the missing transport is named first. | 365 before 367. | TRUE |
| 345-346 | A unit case pins that with both conditions set. | Test 1177. | TRUE |
| 346-347 | Because a reorder would change the cause silently. | - | rationale |
| 349 | The quiet-live-path rule sits between them. | 366. | TRUE |
| 349-351 | The transport rule is evaluated first, because no route is the more fundamental truth. | 365 (the reason is rationale). | TRUE |
| 351-352 | Quiet path and missing value: the quiet path is named. | 366 before 367. | TRUE |
| 352-353 | It blocks a press of any capability. | 597 reads one fact for the whole accessory. | TRUE |
| 353-354 | The missing value blocks only presses of that capability. | 594 reads the bound capability's `reported`. | TRUE |
| 354-355 | So naming the state would leave the wider condition unnamed. | Follows. | TRUE |
| 355-356 | Both answer the same status, so the order changes only the cause. | 366-367. | TRUE |
| 359 | The pending rule comes last. | 370. | TRUE |
| 359-360 | When a request also waits, every other rule that applies names its own cause. | `find` order (374). | TRUE |
| 360-362 | The pending rule answers only an otherwise-unrefused press, which would reach the vendor again. | 370, 609-616. | TRUE |
| 377 | The status each cause answers. | 380. | TRUE |
| 377-378 | So a log line and an Eve-class controller read true. | D-04. | rationale |
| 378 | Apple Home shows a generic failure for both. | D-04. | rationale |
| 383-384 | A vendor error is the vendor's answer, so its line says "did not take effect". | 390. | TRUE |
| 384-385 | A timeout is no answer; delivery is uncertain. | D-038. | rationale |
| 385-386 | So its line states the uncertainty and claims no outcome. | 389. | TRUE |
| 393 | Only a `HapStatusError` is ever thrown. | The only `throw` in the module is 397. | TRUE |
| 393-395 | A plain `Error` becomes a communication failure with a warning quoting its message. | HAP 1828-1830. | TRUE |
| 395 | Which would put a plugin cause into a channel it does not control. | - | rationale |
| 400-401 | The value HAP is serving, read back rather than guessed. | 403. | TRUE |
| 406 | The push returns the stored status to `0`. | 418; `serviceCatalogue.ts:977`; HAP `Service.js:522-523`; HAP 1650. | TRUE |
| 408 | The republish re-asserts no more than the control rows. | `basementGuardian.ts:684-691`. | TRUE |
| 408-410 | A row publishes `On` only while decoded, not doubtful and not pending. | `serviceCatalogue.ts:329-335, 541-545`. | TRUE |
| 410-411 | So the push after the republish clears the status in the other cases. | 416-418. | TRUE |
| 411-412 | It publishes the reported value when there is one, so the Switch shows what the device said. | 418. | TRUE |
| 412-414 | With none it carries the held value, which states nothing new and still returns the status to `0`. | 403, 418; HAP 1650. | TRUE |
| 421 | The restored refusal is handed no rows to re-assert. | 472. | TRUE |
| 421-422 | So it republishes nothing. | 424-426. | TRUE |
| 422-423 | The push alone is what it needs, the half of `clearRefusal` that does the work. | 418. | rationale |
| 425 | The restored refusal is handed no rows to re-assert. | 472. | TRUE |
| 429 | Refuses every press on one restored control. | 470-477 refuse every value. | TRUE |
| 429-431 | Until the publish pass binds the row, which happens only once the family resolves. | As 51-53. | TRUE |
| 433-434 | A restart the cloud never answers is the window RES-04 names. | RES-04. | rationale |
| 434 | And it is unbounded. | No timer ends the refusal (470-477). | TRUE |
| 434-435 | No binder exists until the first REST inventory succeeds. | `basementGuardian.ts:658`; `platform.ts:611-613`; `accountRuntime.ts:459`. | TRUE |
| 435 | The cached Switches are served from the moment the bridge publishes. | `platform.ts:650-652`. | TRUE |
| 436-437 | With no handler HAP stores the value and answers success. | HAP 1834-1838. | TRUE |
| 437-438 | So a press reports success, an automation fires, and nothing is sent. | - | rationale |
| 438-439 | Nothing reaching the vendor is correct; the owner is told. | 474. | rationale |
| 441 | The status and the cause are the transport rule's own. | 365 against 474 and 476. | TRUE |
| 441-443 | Because the window is a restart the cloud has not answered, with no proven route. | `accountRuntime.ts:354, 610-612`. | TRUE |
| 443-444 | Reusing both keeps one condition, one status, one wording. | - | rationale |
| 444-446 | It also stays while a cached accessory's family does not resolve, because only a resolved publish pass binds. | `basementGuardian.ts:739, 991-1016, 1060`. | TRUE |
| 448 | The clearing push is not optional. | - | rationale |
| 448-449 | HAP stores a thrown status and answers it to later reads. | HAP 1819-1832, 1729-1730. | TRUE |
| 449-450 | Apple Home draws "No Response" for the whole accessory. | D-10. | rationale |
| 450-451 | The presentation this project reserves for a refused credential. | `serviceCatalogue.ts:984-990`. | TRUE |
| 451-452 | Which never clears itself and which a retry makes worse. | D-10. | rationale |
| 452-453 | A restart with the cloud down clears itself when a poll succeeds. | `accountRuntime.ts:781-782`. | rationale |
| 453 | So it must not borrow that presentation. | - | rationale |
| 453-455 | The push carries the served value, because there is no reported value to restore. | 472, 418. | TRUE |
| 455-456 | A push of that value still returns the status to `0`. | HAP 1650. | TRUE |
| 458 | A write handler and nothing else. | 470. | TRUE |
| 458-459 | RES-04 asks that reads answer from memory. | RES-04. | rationale |
| 459 | The one path from HomeKit to the vendor is a write. | As 8. | TRUE |
| 459-460 | So no read handler is registered here or anywhere in this tier. | No `onGet` in `src` (grep). | TRUE |
| 465 | `onSet` rather than `on('set', ...)`, matching the binder. | 640. | TRUE |
| 465-466 | HAP warns when a characteristic carries both and ignores the event listener. | HAP 1800-1802. | TRUE |
| 466-467 | "It is also what makes this refusal replaceable rather than permanent" | HAP calls `setHandler` whenever one exists and only warns about `set` listeners (HAP 1800-1805), so the binder's `onSet` (640) would take over an `on('set')` refusal too (R8 probe). | FALSE (045): sentence dropped |
| 467-468 | `setHandler` is one slot. | HAP 1351. | TRUE; dropped with the 045 sentence (the overview, 50-53, keeps it) |
| 468-469 | So the binder's own handler takes it over when the publish pass binds the row. | As 51-52. | TRUE; dropped with the 045 sentence |
| 481 | Builds the write half of the control Switches. | 486-649. | TRUE |
| 483 | Building it registers no handler and sends nothing. | 487-501, 627-648. | TRUE |
| 483-484 | `bind` attaches one, called with a service the catalogue already published. | 640; as 152. | TRUE |
| 489 | What was asked for, per capability. | 500, 609-610. | TRUE |
| 489-491 | An entry exists from acceptance for sending until confirmation, vendor refusal or window close. | 609; 645, 580, 536. | TRUE |
| 491-493 | The value is kept because reconciliation compares; a mismatch resolves nothing. | 644. | TRUE |
| 493-494 | The handle is kept so a confirming report or a vendor refusal can cancel the deadline. | 517 through 645 and 580. | TRUE |
| 496 | One binder per accessory, one entry per capability. | `basementGuardian.ts:658`; `platform.ts:212-219`; 500. | TRUE |
| 496-498 | So the window is per capability per accessory by construction. | Follows. | TRUE |
| 498-499 | No process-wide or cross-accessory state exists. | The module-level values are `const` and read-only (210, 329, 335, 363). | TRUE |
| 503 | Drops the entry and cancels the deadline. | 517-518. | TRUE |
| 505 | A capability with no entry is a no-op. | 513-515. | TRUE |
| 505-506 | So this and the expiry are idempotent deletes of the same thing. | 536-538. | TRUE |
| 507-508 | Whichever runs first wins; the second changes nothing. | 513-515, 536-538, 644. | TRUE |
| 507-509 | So a report at the closing instant needs no ordering rule. | - | rationale |
| 509-510 | It also covers a report that resolved the request during the send. | 645, then 580 or 618 (test 793-817). | TRUE |
| 521 | The window closed with no confirming report. | A confirming report cancels the window (517), so 535 runs only without one. | TRUE |
| 521-522 | The entry goes, the binder calls `republish`, one warning names the capability. | 536, 540, 541. | TRUE |
| 524 | Nothing is retried. | 535-542. | TRUE |
| 524-526 | A late command may have reached the device; a second would operate twice. | D-038. | rationale |
| 526 | `StatusActive` is not used to mark this. | 535-542. | TRUE |
| 526-529 | It reports vouching, which a failed field, a lost monitoring path or a lost link can make false. | `serviceCatalogue.ts:244-246, 280-282`; `basementGuardian.ts:325-334, 355-377`. | TRUE |
| 529-530 | One more meaning would leave a user unable to tell. | - | rationale |
| 532 | The republish is no more than the control rows, as `republish` documents. | 132; `basementGuardian.ts:684-691`. | TRUE |
| 533-534 | Nothing else changed; a timer-driven full republish would strain the claim. | - | rationale |
| 550 | A refusal the plugin answers by itself. | 563-568. | TRUE |
| 550-551 | Nothing is sent, so no new entry, and the earlier entry stays. | 601-603 run before 609; 563-568 never touch `requested`. | TRUE |
| 552 | The push is armed before the throw. | 564, 567. | TRUE |
| 552-554 | HAP answers the status to later reads until a push or an accepted write clears it. | As 30-31. | TRUE |
| 556-557 | The line names the device, the capability and a cause, and nothing else. | 565. | TRUE |
| 557-558 | The `deviceId` is deliberate. | - | rationale |
| 558 | It reads `<account-id>_<serial-number>`. | `constraints.md:176`. | TRUE |
| 558-560 | Non-sensitive, admitted to logs and context; D-027 keeps it out of public artifacts. | `constraints.md:200`; `platform.ts:334`; D-027. | rationale |
| 560-562 | Without it a multi-pump account cannot tell which pump refused. | - | rationale |
| 570 | The vendor refused or never answered; nothing is retried. | 578-587. | TRUE |
| 572 | The two failures treat the entry differently. | 579-581. | TRUE |
| 572-573 | A refusal ends the request, so the entry and its window go. | 580, 517-518. | TRUE |
| 573-574 | And the row resumes publishing reported state. | `pending` drops it (628-630); the push publishes `reported` (418). | TRUE |
| 574-575 | A timeout leaves delivery uncertain. | D-038. | rationale |
| 575-577 | So the entry stays until the report or the window, and a second press is refused. | 579-581; 370. | TRUE |
| 605 | From here the row withholds `On`. | 609; `serviceCatalogue.ts:544`. | TRUE |
| 605-606 | "so the accessory's next update cannot snap the toggle back before the device confirms" | When the window closes first, `expire` republishes (540; `basementGuardian.ts:690`) and the next update publishes the reported value (`serviceCatalogue.ts:544`), though the device never confirmed. | FALSE: now "while the request waits" |
| 606-608 | The entry is created immediately before the request leaves, with its own deadline. | 609-616. | TRUE |
| 608 | So no path can leave one behind with no way out. | Every entry carries a deadline (611-613). | TRUE |
| 622 | Accepted; nothing is pushed. | 618-625. | TRUE |
| 622-623 | HAP keeps serving the value this write left. | HAP 1815. | TRUE |
| 623-624 | The entry stays until the report or the window resolves it. | 645, 536. | TRUE |
| 638-639 | `onSet`, because HAP warns and ignores the listener when a characteristic carries both. | HAP 1800-1802. | TRUE |

### `test/accessories/controls.test.ts`

| Location | Clause | Evidence | Result |
| --- | --- | --- | --- |
| 8 | Tests control writes and refusal diagnostics. | Both `describe` blocks (625, 1463). | TRUE |
| 30 | The outcome for a write no local rule refuses, fresh on every call. | 32-34. | TRUE |
| 30-31 | A local refusal never reaches it. | `controls.ts:601-603` run before 616. | TRUE |
| 31 | So the value it carries is irrelevant to those rows. | Follows. | TRUE |
| 36 | The statuses the code under test answers. | The four refusal statuses (`controls.ts:321, 369-370, 380`) and the `0` the clearing push leaves (`controls.ts:418`; `features/lib/hap.ts:522`). | TRUE |
| 36-37 | Written out rather than read off the namespace, so a drifted mapping fails at the assertion. | 38-42 match HAP's `HAPStatus`; the cases compare with these literals. | TRUE |
| 44 | The namespace holds no per-case state. | `features/lib/hap.ts:702-711` holds classes and constant tables only. | TRUE |
| 44-45 | Each case builds its own services. | 123-125, 1427, 1449; no service at module level. | TRUE |
| 45 | A characteristic lives on the service that carries it. | `features/lib/hap.ts:459, 475-481`. | TRUE |
| 45 | So one stand-in serves every case. | Follows. | TRUE |
| 48 | The stand-in carries only part of the real namespace. | `features/lib/hap.ts:691-700`. | TRUE |
| 48 | So no structural type admits it. | The assertion through `unknown` at 50. | TRUE |
| 48-49 | The widening lets it stand where the plugin takes the real namespace. | 50, 149, 589. | TRUE |
| 52 | The stand-in service carries only part of a real `Service`, so no structural type admits it. | `features/lib/hap.ts:422-434`; 55. | TRUE |
| 52-53 | The one place a stand-in service stands where the code takes a `Service`. | `as unknown as` only at 50 and 55. | TRUE |
| 58 | One deferral the code under test asked the port for. | 98-103. | TRUE |
| 65 | Collects the warnings a case reads, discards every other level. | 66-82. | TRUE |
| 68 | Only the warning channel is read back. | 78-80. | TRUE |
| 86 | The cases using this stub do not read the log; it discards every call. | 84-90. | TRUE |
| 92-93 | Records the deferral rather than arming one, so a case reads the delay and runs the handler. | 97-111. | TRUE |
| 109 | The code under test arms no interval. | No `setInterval` in `controls.ts` (grep). | TRUE |
| 116 | A stub for a case whose promise is not what was sent. | Callers 152, 853, 1009, 1033, 1085, 1114; none asserts a send. | TRUE |
| 116-117 | It answers every send with a fresh outcome and records nothing. | 120. | TRUE |
| 117-118 | A case that promises which commands were sent takes a strict mock. | R7 row 117-119. | TRUE |
| 160 | The cases that take this default do not read the republish. | The four that read it pass their own (668, 909, 1306, 1368). | TRUE |
| 165 | Most `createControlBinder` cases start from it. | Every case in that block reaches `boundSwitch`, directly or through `refuse` and `gatedSwitch`, except 881 and the eight at 1109-1138. | TRUE |
| 175 | The clearing push, told apart by its delay. | `controls.ts:545-547` (0) against 611-613 (30000). | TRUE |
| 180-181 | The rejection is a value, so a case acts first and asserts later; a resolved write answers `undefined`. | 182-190. | TRUE |
| 192 | One call a spy on `onSet` recorded. | 193-195. | TRUE |
| 197-198 | Read off a spy, so a case calls the handler and sees the error before the stand-in converts it. | 199-207; `features/lib/hap.ts:324-332`. | TRUE |
| 209 | The eight refusals one write can meet while no earlier request waits. | Six local rules other than the pending rule (`controls.ts:364-369`) and the two `CommandFailure` members (`commandPort.ts:22`). | TRUE |
| 209-210 | Six the plugin answers by itself and two the vendor answers. | 240-319, 321-350. | TRUE |
| 210-211 | The local rows follow the binder's table order. | 240-319 against `controls.ts:364-369`. | TRUE |
| 211 | Each row sets one condition. | Each row differs from the clear gate (402) in one field. | TRUE |
| 211-212 | So these rows pin each cause, status and log line, not the order. | 1006-1103. | TRUE |
| 212 | The precedence cases pin the order. | 1177, 1216, 1239, 1256-1297. | TRUE |
| 212-213 | Each sets two conditions and names the rule that must answer. | `PRECEDENCE` rows set two (434-512); `PENDING_PRECEDENCE` rows set one beside the waiting request (517-560, 1284-1285). | TRUE |
| 213-214 | A press while a request waits is the binder's other local refusal. | `controls.ts:370`. | TRUE |
| 214-215 | It needs the earlier press, so its own case covers it. | 728-758. | TRUE |
| 215-217 | The looping cases read these rows, so a changed cause or status fails by name. | 1006-1103; each title carries `cause`. | TRUE |
| 225 | Builds the outcome the port answers, fresh for every send. | 120 calls it per send; 1054 calls it once for the one expected send. | TRUE |
| 230 | The delays the binder armed, in order. | 1044-1045, 1059. | TRUE |
| 234-235 | A vendor row also carries the cancelled handles, the rest of the timer record. | 94-113, 1060, 1074. | TRUE |
| 354-355 | One write through the given port, with everything the assertions read. | 356-380. | TRUE |
| 382 | The exact cause text the three rules write. | `controls.ts:329, 335, 367`. | TRUE |
| 382-384 | Written out, so a reworded line fails at the assertion. | 386-388; 1152, 1169, 1208. | TRUE |
| 384-385 | The whole content of these causes is which fact blocked the press. | D-07, D-08. | rationale |
| 390 | The facts a case sets on the gate for one write. | 393-399. | TRUE |
| 390-392 | A clear gate sets no refusal condition: the five facts listed. | 402. | TRUE |
| 405-406 | Reads the reported value and three facts from `gate` at each write, so a case can change one between writes. | 407-417; 1282-1285. | TRUE |
| 419 | Two conditions that hold at once, and the rule that must answer. | 423-430. | TRUE |
| 419-420 | Fixed order; the first rule that applies answers the write. | `controls.ts:363-375`. | TRUE |
| 420-421 | So each row pins the order of one pair. | 1256-1274. | TRUE |
| 421-422 | Missing fresh state and an active reading cannot hold together. | `controls.ts:287, 308`. | TRUE |
| 426 | The conditions the row sets on a clear gate. | 1261. | TRUE |
| 432-433 | The pairs one write can carry, but for three with their own cases. | 11 rows; with 1177, 1216 and 1239 they make the 14 pairs that can hold together. | TRUE |
| 514 | The pending rule against each rule that can hold with it. | Six rows (517-560), one per other local rule. | TRUE |
| 514-516 | The first press is accepted with a clear gate; each row then sets one more condition. | 1282-1285. | TRUE |
| 516 | That condition's own rule must answer it. | 1293. | TRUE |
| 562 | The window a request waits in. | `controls.ts:210`. | TRUE |
| 562-563 | Thirty seconds against an observed sixteen. | `constraints.md:539`. | TRUE |
| 563-564 | Long enough to answer, short enough that the Switch never stops following reported state for long. | D-037, D-06. | rationale |
| 567 | The window's deferral, told apart by its delay. | 568-570. | TRUE |
| 572-574 | All the identity the refusal has: the restart passes read no context, and an older cache names no device. | As source 193-195. | TRUE |
| 582 | Most `bindRestoredControlRefusal` cases start from it. | Every case in that block calls it except 1537. | TRUE |
| 582-583 | No command port reaches it. | `RestoredControlRefusalOptions` has no port (`controls.ts:177-200`). | TRUE |
| 583-584 | So a press cannot reach the vendor by any route. | Follows. | TRUE |
| 599 | A read answers the value, or the status a refusal left standing. | 604-610; `features/lib/hap.ts:341-348`. | TRUE |
| 600-601 | The read is the difference between a marked tile and a greyed-out one. | D-10. | rationale |
| 601-602 | HAP's read is asynchronous and rejects with the status. | HAP 1683, 1729-1730. | TRUE |
| 602-603 | So the read is awaited inside the `try`, which also catches a read that throws at once. | 605-609. | TRUE |
| 612 | A press of either value, and the held value before it. | 615-623. | TRUE |
| 612-613 | The held value is always the other one. | 621-622. | TRUE |
| 613 | So a press that went through would show in the stored value. | 1474-1477. | TRUE |
| 613-614 | A press of false is what Apple Home writes to switch off a toggle restored as on. | - | rationale |
| 762, 795 | The promise constructor assigns its resolver synchronously. | ECMAScript `Promise` executor. | TRUE |
| 933-934 | The reported value changes between refusal and push, so a write-time push fails. | 938-944. | TRUE |
| 953 | A row withholds `On` while a request waits. | `serviceCatalogue.ts:544`. | TRUE |
| 953-954 | So this push alone decides what the Switch shows after the refusal. | `controls.ts:416-418`. | TRUE |
| 954-955 | HAP holds the accepted `true`; the push must replace it with the reported `false`. | 962-963, 978. | TRUE |
| 955 | A requested value never shows as reported state. | D-037, WR-02. | rationale |
| 983-984 | With no reported value the row publishes no `On`: undecoded, or doubtful. | `serviceCatalogue.ts:329-335, 337-340, 541-545`. | TRUE |
| 984-985 | A republish alone would then leave the status standing. | Follows; `features/lib/hap.ts:522`. | TRUE |
| 985-986 | So the push falls back to the held value, which clears the status and states nothing new. | `controls.ts:418`; 1001. | TRUE |
| 1062 | Every deferral runs, so a send from any of them reaches the strict mock. | 1063-1065, 1077. | TRUE |
| 1105 | HAP converts a plain `Error` to a communication failure and warns with its message. | HAP 1828-1830. | TRUE |
| 1105-1107 | The stand-in converts the same way, so a plain `Error` reads as a vendor error's status. | `features/lib/hap.ts:278-284`; `controls.ts:380`. | TRUE |
| 1107-1108 | These cases call the handler directly and read the error. | 1121-1136. | TRUE |
| 1174 | Both conditions at once, the case the order decides. | 1181. | TRUE |
| 1174-1176 | Less actionable, so the transport rule is evaluated first. | `controls.ts:365, 367` (the reason is rationale). | TRUE |
| 1194-1195 | The route and the reported value are there, so what is missing is the answer channel. | 1200; 155. | TRUE |
| 1213-1214 | The transport rule is evaluated first, because no route is more fundamental. | `controls.ts:365-366` (the reason is rationale). | TRUE |
| 1214-1215 | This case stops an edit that moves the quiet rule above transport. | 1221, 1231. | TRUE |
| 1236-1237 | The quiet path is named because it blocks any capability, the missing value only this one. | `controls.ts:594, 597`. | TRUE |
| 1237-1238 | This case stops an edit that moves the quiet rule below the state rule. | 1243, 1251. | TRUE |
| 1355 | Nothing is retried when the window closes. | `controls.ts:535-542`; 1386. | TRUE |
| 1355-1356 | A late command may have reached the device; a second would operate twice. | D-038. | rationale |
| 1389 | Whichever runs first wins; the second is a no-op. | `controls.ts:513-515, 536-538, 644`. | TRUE |
| 1389-1390 | So no ordering rule is needed. | - | rationale |
| 1439 | One binder exists per accessory. | `basementGuardian.ts:658`. | TRUE |
| 1439-1440 | So no state outside a binder's closure records that anything is pending. | `controls.ts:500`; no mutable module-level state. | TRUE |
| 1481 | The same cause the transport rule gives a live accessory. | 1500; `controls.ts:365, 474`. | TRUE |
| 1481-1482 | The refusal exists for a restart the cloud has not answered, with no route. | `accountRuntime.ts:354, 610-612`. | TRUE |
| 1482-1483 | One condition with two wordings is what the table prevents. | D-08. | rationale |
| 1506 | Without the clearing push the characteristic answers its status to later reads. | HAP 1729-1730; `features/lib/hap.ts:341-345`. | TRUE |
| 1506-1508 | Apple Home draws "No Response", reserved for a refused credential, which never clears itself. | D-10. | rationale |
| 1508-1509 | A restart with the cloud down clears itself when a poll succeeds. | `accountRuntime.ts:781-782`. | rationale |
| 1535-1536 | Called directly for the same reason: the stand-in reads a plain `Error` as a status too. | 1105-1108; `features/lib/hap.ts:283`. | TRUE |
| 1576-1577 | The push carries the held value, because there is no reported value. | `controls.ts:472, 418`. | TRUE |
| 1577-1578 | Both held values are driven, so a hard-coded push fails. | 1579. | TRUE |
| 1595-1596 | The held value changes between refusal and push, so a refusal-time push fails. | 1606-1611. | TRUE |
| 1596-1597 | Set directly, because a publish would also clear the status. | `features/lib/hap.ts:522`. | TRUE |

Totals:

- `src/accessories/controls.ts`: 280 clauses. 212 TRUE, 8 FALSE, 60 rationale. The 8 FALSE
  clauses are 045 and seven new ones: a count the file exceeds (23), a presupposition (45), three
  claims that a poll cannot land inside the 30 s window (125-126, 272, 273-274), and two
  unbounded lifetimes (168-169, 605-606). Each is fixed by saying less in the 045 commit.
- `test/accessories/controls.test.ts`: 112 clauses. 102 TRUE, 0 FALSE, 10 rationale. No test
  comment changes, so there is no test commit.
