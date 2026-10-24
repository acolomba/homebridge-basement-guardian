---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 9
reviewed: 2026-10-17T23:49:21Z
depth: deep
source_revision: 3f5fefeb92bf57132da4d03909956691528882e8
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 0
  warning: 0
  total: 0
status: clean
reviewer: gsd-code-reviewer (correction round 9)
---

# Phase 5 CONTROLS batch: correction round 9

I read every line of both files in full at `3f5fefeb92bf57132da4d03909956691528882e8`: all 647 lines
of `src/accessories/controls.ts` and all 1620 lines of `test/accessories/controls.test.ts`. Before I
started, `git rev-parse HEAD` printed that revision and `git status --porcelain` printed nothing.
Since round 8 (`47b0cb1`), one commit touched `src`, `test` or `features`: `23ebcc1`
(`src/accessories/controls.ts` only). `git diff 47b0cb1 HEAD -- src test`, filtered to changed lines
that are not `//`, `*` or `/**` lines, prints nothing, so the commit changes comment and JSDoc
lines only. The test file is byte-identical to round 8.

I used these inputs:

- AGENTS.md;
- the three `.agents/skills` books, each `SKILL.md` with every `rules/*.md` file (they win over
  `.claude/rules/*.md`);
- `05-CONTEXT.md` and `05-REVIEW-PROTOCOL.md` in full; the CONTROLS rows of `05-FINDINGS.md`
  (findings, counter rows for rounds 0 to 8, leads S-05-24 and S-05-25);
- `05-CONTROLS-REVIEW.md` and `-R1.md` to `-R8.md`: findings, candidates, coordinator triage and
  repair history, with the R7 `## Comment claims audit` and the R8 `## Clause-level comment audit`
  in full;
- D-037 and D-038 (`.planning/intel/decisions.md:787-830`), CTRL-03 and CTRL-05
  (`.planning/milestones/v1.0-REQUIREMENTS.md:67, 69`);
- read only: `src/accessories/basementGuardian.ts` (`decodedControlValue` and
  `reportedControlValue` 549-573, the three write-path facts 587-605, `republishControlRows`
  641-653, the binder and its `republish` callback 658-692, `bindControlRow` 698-706, `publishRows`
  721-748, `republishPublishedRows` 776-791, `reconcileControls` 925-930, both `update()` branches);
  `src/accessories/serviceCatalogue.ts` (`SEEING_LESS_REASONS` and `isRowPublishable` 215-266,
  `trustedGroup` 326-332, `controlValues` 537-545, `publishValue` 970-978);
  `src/accessories/staleMarking.ts` (`refuseRestoredControls` 130-134); `src/platform.ts`
  (`configureAccessory` 661-672); `src/runtime/accountRuntime.ts` (`commandTransportReadyNow`
  590-612, `recordPollSuccess`/`recordPollFailure` 773-793, `commands.send` 1137-1159);
  `src/runtime/commandPort.ts`; `src/runtime/timers.ts`; `src/config.ts` (poll bounds 25);
  `src/accessories/alarmMute.ts:37`;
- `features/lib/hap.ts` (the stand-in the test imports: characteristic 280-348, service
  `updateCharacteristic` 511-525, `createFakeHap` 690-722) and the pinned
  `@homebridge/hap-nodejs` 2.2.2: `dist/lib/Characteristic.js` (`onSet` 1346-1352, `updateValue`
  1627-1658, `handleSetRequest` 1786-1872) and `dist/lib/Accessory.js`
  (`handleCharacteristicChangeEvent` 1409-1434).

Opening open set: 1. Confirmed fixed: 1. Still open: 0. Reopened: 0. New: 0. Closing: 0.

## Round status

### Opening ID

- **CR-05-CONTROLS-045** fixed (`23ebcc1`).
  - The note in `bindRestoredControlRefusal` (466-467) now reads only "`onSet` rather than
    `on('set', ...)`, matching the binder: HAP warns when a characteristic carries both and ignores
    the event listener." The clause "It is also what makes this refusal replaceable rather than
    permanent", and the two clauses after it, are gone. `grep -n -i "replaceable\|permanent"
    src/accessories/controls.ts` finds nothing.
  - What remains is true. When a set handler exists, `handleSetRequest` warns once per write if
    `set` listeners are also attached ("Ignoring on('set') handler as onSet handler was defined
    instead") and calls only the handler (HAP `Characteristic.js:1800-1805`).
  - The overview (50-53) still gives the true reason the binder's handler replaces the refusal: a
    set handler is one slot (HAP 1351), and the binder's `bind` calls `onSet` (638) from the
    accessory's publish pass (`basementGuardian.ts:705, 739`).
  - No code line changed (diff filter above). No literal, cause, status or rule order changed
    (D-05, P-05-01).
- **The seven other clauses the R8 clause-level audit narrowed.** Each now says less, and each is
  true at HEAD:
  - 23-24: "These HAP behaviours govern the code below, both read out of the pinned package's own
    source". "These" points at the two-bullet list that follows, so "both" counts the list. The
    sentence no longer says that only two HAP behaviours matter to the file.
  - 43-46: "restores the control Switches from the Homebridge cache before any accessory exists to
    route a press". `configureAccessory` (`platform.ts:661-672`) runs while no accessory exists.
    Accessories are built only from a trustworthy inventory (`platform.ts:611-613`). The duration
    claim "long" is gone.
  - 125-129: "could expire with a warning". Polls run on their own interval, so one can land inside
    the 30 s window and confirm the request through `update()` (`basementGuardian.ts:1037-1049`).
  - 168-172: the `reconcile` JSDoc keeps "A reported value matching what was asked for clears the
    entry" (642-644, 508-517). The unbounded "from then on" is gone.
  - 272-276: "the wait for a confirmation is shorter than a poll interval" (30 s at 211 against a
    300 s minimum at `config.ts:25`), and "could then warn".
  - 603-606: "so the accessory's next update cannot snap the toggle back while the request waits".
    While an entry exists, `controlValues` withholds `On` (`serviceCatalogue.ts:544`) on every
    path that publishes rows: `publishRows`, `republishPublishedRows`, `republishControlRows` and
    `markMonitoring` all hand in `controls.pending`. The binder's own clearing push can still move
    the toggle while a request waits (WR-02, the 036 case at test 953-981). The sentence speaks
    only of "the accessory's next update", so it stays true.
- **The R8 clause-level audit still holds.** The only source change since R8 is the eight
  narrowed clauses above. I re-read the clauses around each edit and the other rows whose evidence
  lines moved. The rows fall by two lines after 466 and by one between 126 and 168. No TRUE row
  became false. The test file is unchanged, so the 112 test clauses keep their R8 results.

### Earlier fixed IDs

All 44 are still fixed. None reopened. Every fix commit in the dispatch, from `7929ddb303` (001) to
`52f33bf519` (044) and `23ebcc1759` (045), is an ancestor of HEAD (`git merge-base --is-ancestor`,
each exit 0). Test anchors are the same lines as in round 8. Source anchors after 126 are one line
lower than in round 8, and anchors after 468 are two lines higher.

- **CR-05-CONTROLS-001** still fixed: 'ignores a confirming report that lands after the window already closed' (1391-1407) compares the whole `warnings` array. The only `.length` in the test is the stub's handle (99).
- **CR-05-CONTROLS-002** still fixed: `describe('createControlBinder')` (625-1461) and `describe('bindRestoredControlRefusal')` (1463-1620), both top level, neither nested.
- **CR-05-CONTROLS-003** still fixed: no "microtask" in the test; the stand-in-only case has not returned.
- **CR-05-CONTROLS-004** still fixed: the spies at 886, 1121 and 1540 are `t.mock.method(..., 'onSet')`. Each `.bind(` hit (170, 889, 890, 1122, 1428, 1450) is `ControlBinder.bind`.
- **CR-05-CONTROLS-005** still fixed: `// act & assert` only at 1125 and 1550, each over one `assert.rejects()`.
- **CR-05-CONTROLS-006** still fixed: `as unknown as` only at 50 (`HAP_NAMESPACE`) and 55 (`asService`), both commented (D-11).
- **CR-05-CONTROLS-007** still fixed: the order note (338-363) sits directly above `const LOCAL_REFUSALS` (364).
- **CR-05-CONTROLS-008** still fixed: `pending` (232), `isAwaitingConfirmation` (317-319), its row last (371) and `pending: requested.has(capability)` (596). The cases at 728-758 and 760-791 pass.
- **CR-05-CONTROLS-009** still fixed: `refuseOutcome` calls `resolvePending` only for `vendor-error` (577-579). 819-848, the row at 336-349 and the row at 898 expect pending `['self-test']`.
- **CR-05-CONTROLS-010** still fixed: `PRECEDENCE` (11 rows, 434-512) and `PENDING_PRECEDENCE` (6 rows, 517-560) run at 1256-1297; with 1177, 1216 and 1239, all 14 pairs that can hold together have a case.
- **CR-05-CONTROLS-011** still fixed: 1050-1079 runs every deferral, compares `{ thrown, pending, delays, cancelled }` and calls `verify(commands)`.
- **CR-05-CONTROLS-012** still fixed: 702-726 compare `{ pending, cancelled }`.
- **CR-05-CONTROLS-013** still fixed: 896-931 and 1299-1325 record `republish` before and after the push.
- **CR-05-CONTROLS-014** still fixed: 935-951 and 1598-1619 change the value between the refusal and the push.
- **CR-05-CONTROLS-015** still fixed: `RESTORED_PRESSES` (620-623) drive 1464-1533.
- **CR-05-CONTROLS-016** still fixed: 1109-1138 and 1537-1562 assert `instanceof HAP.HapStatusError` and `hapStatus`.
- **CR-05-CONTROLS-017** still fixed: a scan of every `// act` block finds no `assert.` call; `assertRefused` is not in the file.
- **CR-05-CONTROLS-018** still fixed: `readOfSwitch` (604-610) awaits inside its `try`; every caller awaits it.
- **CR-05-CONTROLS-019** still fixed: 1006-1014, one `test()` per row.
- **CR-05-CONTROLS-020** still fixed: the `bind` JSDoc (155-159) states the single slot and no replacement warning.
- **CR-05-CONTROLS-021** still fixed: 108-112 quote the WR-02 title in the present tense (`basementGuardian.test.ts:2848`); 325-329 have no "now".
- **CR-05-CONTROLS-022** still fixed: 1213-1215 and 1236-1238 name "the quiet-live-path rule".
- **CR-05-CONTROLS-023** still fixed: each case that promises sends builds `mock<CommandPort>({ exactParams: true, name: 'commands' })` inside the case and calls `verify(commands)` last. No `anyTimes`, `It.isAny` or `recordingCommands`.
- **CR-05-CONTROLS-024** still fixed: `acceptedOutcome()` (32-34) and per-row outcome factories; `RefusalCase` fields are `readonly`.
- **CR-05-CONTROLS-025** still fixed: D-01 header at `controls.ts:1-54` (Header inspection).
- **CR-05-CONTROLS-026** still fixed: 26-29 (a push before the throw only emits a change) and 338-339.
- **CR-05-CONTROLS-027** still fixed: 86.
- **CR-05-CONTROLS-028** still fixed: 108-110 and 157-161 are block bodies.
- **CR-05-CONTROLS-029** still fixed: 685 and 1043-1046 compare whole delay lists.
- **CR-05-CONTROLS-030** still fixed: the support comments name tables and entrypoints, not positions.
- **CR-05-CONTROLS-031** still fixed: `function noop(): void` at 67 and 85.
- **CR-05-CONTROLS-032** still fixed: 487-492, 548-552 and 620-622.
- **CR-05-CONTROLS-033** still fixed: `outcomeWarning` (388-392). The test expects the timed-out line at 338, 844 and 862; "did not take effect" appears only for `vendor-error` (391; test 324).
- **CR-05-CONTROLS-034** still fixed: no two cases have identical code under two claims; "quotes nothing else" is not in the file.
- **CR-05-CONTROLS-035** still fixed: "the other half", "the one case" and "half the time" are not in the source.
- **CR-05-CONTROLS-036** still fixed: 953-981 is unchanged and passes.
- **CR-05-CONTROLS-037** still fixed: the transport JSDoc (90-114) and the clearing-push note (407-415) make no waiting-request claim beyond the row's withholding rule; "third fact" and "middle rules" are not in the source.
- **CR-05-CONTROLS-038** still fixed: the `PRECEDENCE` comment (432-433) names exactly the three pairs it does not hold.
- **CR-05-CONTROLS-039** still fixed: `bind` JSDoc (161-163), `hasNoFreshState` (281-286), `clearRefusal` (407-415), `expire` (519-532), `timers` JSDoc (68-77) and the note above `isConfirmedOffline` (296-300). "vouch" appears only at 525, for the marking rule.
- **CR-05-CONTROLS-040** still fixed: the test file is byte-identical to round 8.
- **CR-05-CONTROLS-041** still fixed: 760-791 and 793-817 are unchanged and pass.
- **CR-05-CONTROLS-042** still fixed: 98-106 make no `reported`-scope claim beyond what rounds 6 to 8 accepted.
- **CR-05-CONTROLS-043** still fixed: the overview (18-21) still names the Switch that `ensureService` answers; the `publishedService` clause has not returned.
- **CR-05-CONTROLS-044** still fixed: the overview (43-53) and the JSDoc (429-447) bound the refusal by the publish pass that binds the control row, "which happens only once the device's family resolves", and say it stays while a cached accessory's family does not resolve. "until an accessory exists", "on the first publish" and "operates its controls normally" are not in the source.

Reopened: none.

## Findings

None.

## Candidates considered and not filed

- **Test titles were outside both comment audits, so I audited all 46 titles against their own
  assertions.** 45 hold. The one that claims more than its case observes is the candidate below.
- **'arms the clearing push as a macrotask at delay 0 rather than running it inline' (647-657)
  asserts `{ thrown, delays }` only.** A binder that ran the push before the throw *and* also armed
  it at delay 0 would leave both values unchanged. A read-only probe of the compiled binder (Toolchain
  evidence) shows the stand-in's `pushed` flag reads `false` after the refusal and `true` after the
  push. So adding `pushed` to this assertion would let the case see an inline push. I did not file
  it, for three reasons:
  - Every variant of an inline push that changes what a controller sees fails elsewhere. An inline
    `clearRefusal` moves the value to the reported `false` before the throw. 'refuses a write of
    false, sends nothing, and leaves the stored value where HAP had it' (626-645) pins
    `afterRefusal.value: true`. The inline `republish` also fails 896-931 and 1299-1325, which pin
    `republished: []` after the refusal.
  - The only variant that passes the suite pushes the value HAP already holds. Pinned HAP then sends
    no notification: `handleCharacteristicChangeEvent` drops a non-event change whose old and new
    values are equal (`Accessory.js:1425`). HAP's catch then sets the refusal status again
    (`Characteristic.js:1819-1831`). So a controller cannot see that variant.
  - The title reads as "deferred instead of inline", and the case fails an inline-only push
    (`delays: []`). The R2 precedent on narrower cases applies.

  The coordinator may still want `pushed: false` in this assertion as a cheap tightening.
- **'sends nothing at all for <cause>' (1016-1028) does not run the clearing push.** A send from
  inside the deferred push would not reach that case's strict mock. A uniform send from the push
  fails 626-645, which runs the push under a strict mock with no expectations. A send from the
  waiting-request push fails 956-981 (one expected send). A retry armed at any other delay changes
  the whole delay list that 1030-1048 pins for every row. A wrong binder would need a send inside
  the 0 ms push, only for the transport, quiet-path, fresh-state, offline or already-active causes.
  I found no plausible refactor with that shape. Not filed.
- **`const other = createControlBinder(...)` (1448).** `cases.md` asks that values be named for
  their production role, and `other` drops the role that the sibling `otherService` keeps. The name
  is not one of the forbidden tokens, and the use sites (`other.bind`, `other.pending`) and the
  title make the role plain. The name dates from `b19ea58`. This is the same kind of name judgment
  that round 6 did not file for `SELF_TEST`. Not filed. The coordinator may rename it to
  `otherBinder` in a style-only change.
- **`boundSwitch(overrides = {}, reported = () => false)` (166) has two optional parameters.**
  `functions.md` turns *several* optional parameters with no natural order into an options object.
  This helper has two, in a fixed order: the binder options first, then the per-case reported value.
  No caller passes an empty `{}` to reach the second one. Not filed.
- **The narrowed overview "These HAP behaviours ..., both read out of" (23-24)** still counts two.
  "These" points at the two-bullet list that follows, so the count is the list's count, and the
  sentence no longer says that only two behaviours matter. Not filed.
- **The narrowed "before any accessory exists" (45).** In a run the cloud never answers, no
  accessory ever exists. "before" here means "while none exists". That reading is true, and the R8
  audit removed only the claim of a long gap. Not filed.
- **"this tier" (461) is not defined in the file.** The word is the project's own: `commandPort.ts`
  says "the HomeKit tier", and `accountRuntime.ts` says "The accessory tier". The claim (no read
  handler) is true for all of `src` (`grep -rn "onGet\|on('get'" src` finds only the
  `basementGuardian.ts:27` comment). Not filed.
- **The bare `0` delay at 471 and 545.** `naming-and-docs.md` asks for a parameter-name comment only
  when a literal's meaning is unclear. The second argument of `setTimeout` is the delay, and the
  port's own signature names it `delayMs` (`timers.ts`). Not filed.
- **Round 1 to 8 rejections, rechecked against the current lines and still not filed:** the
  cause paragraph naming one window past the restart (441-447); "Reusing both keeps one condition
  answering one status with one wording" (444-445); the macrotask reason given only for the
  binder's handler (33-36, 181-185); "HAP warns when a characteristic carries both" (466-467);
  `refuse()` repeating `writeRejection` (356-380); the `commandTransportReady` JSDoc ending with
  paragraphs about `reported`; "one failed poll clears it"; `reconcile` clearing only on a
  matching value; the `bind` guard "keeps `bind` idempotent"; the `SELF_TEST` subtype; 'arms one
  clearing push ...' phases; `nothingToRepublish` against `accessoryName`; the `isAlreadyActive`
  "would not have"; the `bind` JSDoc "already published" wording; `hasNoFreshState` and its pinned
  cause; a timed-out outcome after an in-flight confirming report; `RestoredControlRefusalOptions`
  exported with no importer; 'warns that a timed-out request may still have reached the device'
  (P-05-03); the two held sends in the 041 cases; the `republish` JSDoc against `expire`; the
  `bind` guard keyed by service; JSDoc on members of module-local interfaces; comment line widths;
  the `liveConfirmationObservable` wording; 'leaves a restored control answering a read before any
  press reaches it'; the comment inside the case at 1062; `OnSetCall.arguments`; the inline
  `try`/`catch` in the D-04 regression cases; `windowsIn(deferrals)[0]?.handle`; the late
  `vendor-error` against a newer entry (unreachable under the 2.5 s send deadline, R1); the
  per-accessory rows; `refuse()` with no `// arrange`; the subset cases; the three "names the ..."
  cases; "it fails independently of the one below"; the second `assert.strictEqual` at 643;
  `outcomeWarning` as a noun phrase; `heldOn` annotated `CharacteristicValue`; a `commands.send`
  that rejects; the `alarm-mute` constant; 'answers the transport refusal status to every read ...'
  reading `statusCode`; 'holds one independent entry per capability ...' with no `cancelled`; the
  036 comment "a requested value never shows as reported state"; no owner case for a waiting
  request with no reported value; the overview's "cached or just added" (18-21); "Every writer of
  `On`" (38-41); the ragged rewrap in the JSDoc (437-438); the display name rather than the
  `deviceId` in the restored line.

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

- All commands ran from the repository root at `3f5fefeb92bf57132da4d03909956691528882e8`, with a
  clean tree before and after.
- Each command had the prefix `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.
- Versions: Node `v26.12.0` (`node --version`), npm `11.20.0`.
- The run started at 2026-10-17T23:41:27Z and ended at 2026-10-17T23:41:40Z.
- ESLint was called directly without `--cache`, so the run did not read the ESLint cache.
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

Probe for the 647 candidate. It is read-only and uses made-up inputs. The script is in the session
scratch directory, not in the repository. Command: `node <scratch>/probe-647.mjs <repo>`, exit 0.
The script imports the compiled `dist-test/src/accessories/controls.js` and
`dist-test/features/lib/hap.js`. It binds a stand-in Switch with reported `false` and a recording
timer port, writes `false`, reads the characteristic, runs the recorded deferral and reads it again.
Output:
`{"thrown":-70412,"delays":[0],"beforePush":{"value":false,"pushed":false,"statusCode":-70412},"afterPush":{"value":false,"pushed":true,"statusCode":0}}`.

Other read-only commands: `git merge-base --is-ancestor <commit> HEAD` exited 0 for every fix
commit from 001 to 045; `git show 23ebcc1 -- src test`; `git diff 47b0cb1 HEAD -- src test`,
filtered to changed lines that are not comment lines (none); `git diff --stat 47b0cb1 HEAD -- src
test features` (`controls.ts` only); `git show 4c143eb:test/accessories/controls.test.ts` and
`git log -S` for the `other` name, the push-before-the-throw sentence and the 647 title (all
`b19ea58`).

I made no source or test edit, ran no mutation experiment and made no commit or stash. Every check
passes.

## Out-of-scope observations

- `src/accessories/basementGuardian.ts:685-691` with `src/accessories/serviceCatalogue.ts:262-266,
  537-545` (ACCESSORY, with CATALOGUE): this widens lead S-05-24 (2). D-037 says that when no
  confirmation arrives within 30 seconds the plugin should "Restore the last reported Switch
  value". The binder's `expire` (`controls.ts:533-540`) clears the entry and calls `republish`, and
  that republish publishes `On` only while the row may publish its scope. S-05-24 names one path
  where it publishes nothing: a refused credential. There is a second path. A scope withdrawn for a
  doubtful reason (`invalid` or `controller-link-lost`, outside `SEEING_LESS_REASONS`), or a field
  that stops decoding, during the window has the same effect. Then `controlValues` drops `On`,
  nothing is pushed, and HAP keeps serving the requested `true` the accepted write left
  (`Characteristic.js:1815`). The value stays until the scope may publish again. The tile is marked
  inactive meanwhile. No `controls.ts` comment claims that the expiry restores the value: the
  `PENDING_WINDOW_MS` JSDoc says only that the row "resumes projecting reported state", which is
  what the row does. So this is the same behavior question as S-05-24, not a CONTROLS finding.
- `src/accessories/serviceCatalogue.ts:537-538` (CATALOGUE): "Withholding rather than publishing is
  what stops the accessory's per-update push from snapping the toggle back before the device
  confirms". This is the unbounded lifetime that the R8 audit narrowed in `controls.ts` (603-604,
  now "while the request waits"). When the window closes first, the row stops withholding although
  the device never confirmed.
- Unchanged from round 8:
  - S-05-25 (`src/accessories/basementGuardian.ts:991-1012`; `src/platform.ts:296-302, 380-391`):
    the restored refusal stays, with the transport line, for an unresolved family and for a cached
    device missing from the inventory or the store;
  - S-05-24 (`src/accessories/basementGuardian.ts:694-697`, and expiry under a refused credential);
  - `src/accessories/basementGuardian.ts:591-593`: the transport comment repeats the claim that
    CR-05-CONTROLS-042 fixed in `controls.ts`;
  - `src/accessories/serviceCatalogue.ts:337`: "vouch" names the withholding rule;
  - `src/runtime/commandPort.ts:21`: "did not take effect" also covers `timed-out`;
  - `test/accessories/basementGuardian.test.ts:2844-2847` and
    `src/accessories/basementGuardian.ts:567-570`: history narration;
  - the AGENTS.md privacy sentence conflicts with `deviceId` (`<account-id>_<serial-number>`) in
    log lines (maintainer);
  - `features/lib/hap.ts:316-336` (Phase 7, D-12; GATES lead S-05-15 (3)): the stand-in's
    `handleSetRequest` does not reset `statusCode` to `0` on entry as the real one does (HAP 1787).

---

_Reviewed: 2026-10-17T23:49:21Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 9)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. Opening 1, fixed 1, rejected 0, new 0, reopened 0,
closing 0. The round is `clean` (D-03 as amended, D-18), and it closes the CONTROLS batch at
correction round 9. CR-05-CONTROLS-001 to 045 are all `fixed`.

- **CR-05-CONTROLS-045:** `fixed`, as the Round status shows.
- **Not filed:** the coordinator keeps the reviewer's two candidates as rejected.
  - 'arms the clearing push as a macrotask at delay 0 rather than running it inline' passes for a
    binder that also pushes the value HAP already holds. Pinned HAP sends no notification for an
    unchanged value, so no controller can see that push.
  - The name `other` is a naming judgment. It is not a rule violation.
- **Out-of-scope observations:**
  - Lead S-05-24 (ACCESSORY) now also covers the following. A window that closes while the control's
    scope is withdrawn for a doubtful reason, or while its field no longer decodes, leaves HAP
    serving the requested `true`. D-037 says expiry restores the last reported value.
  - `src/accessories/serviceCatalogue.ts:537-538` makes the unbounded "before the device confirms"
    claim that round 8 narrowed in `controls.ts`. The CATALOGUE batch is closed, so this goes to
    the phase verifier as an observation.
