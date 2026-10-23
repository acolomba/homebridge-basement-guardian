---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 6
reviewed: 2026-10-17T22:40:00Z
depth: deep
source_revision: bab42433952af1ffc3f83653537f78d1e8bdde40
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 0
  warning: 1
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 6)
---

# Phase 5 CONTROLS batch: correction round 6

I read every line of both files in full at `bab42433952af1ffc3f83653537f78d1e8bdde40`: all 646 lines
of `src/accessories/controls.ts` and all 1621 lines of `test/accessories/controls.test.ts`. Before I
started, `git rev-parse HEAD` printed that revision and `git status --porcelain` printed nothing.
Since round 5 (`5dd054e`), one commit touched `src`, `test` or `features`: `3bda590`
(`controls.ts`, JSDoc lines 95-103 only). The test file is byte-identical to round 5.

I used these inputs:

- AGENTS.md;
- the three `.agents/skills` books, each `SKILL.md` with every `rules/*.md` file (they win over
  `.claude/rules/*.md`);
- `05-CONTEXT.md` and `05-REVIEW-PROTOCOL.md` in full; the CONTROLS rows of `05-FINDINGS.md`
  (findings, counter rows for rounds 0 to 5, genuine bug histories, `### 05-04`);
  `05-CONTROLS-REVIEW.md` and `-R1.md` to `-R5.md` (findings, candidates not filed, triage, repair
  history);
- D-037 and D-038 (`.planning/intel/decisions.md:787-830`), CTRL-03 and CTRL-05
  (`.planning/milestones/v1.0-REQUIREMENTS.md:67, 69`), the self-test reconciliation contract
  (`.planning/intel/constraints.md:534-542`) and the v1.0 controls decisions D-05 and D-06
  (`.planning/milestones/v1.0-phases/04-pump-records-and-official-controls/04-CONTEXT.md:106-125`);
- read only: the WR-02 case (`test/accessories/basementGuardian.test.ts:2836-2895`); the trust
  functions, `controlValues`, the control rows, `publishedService` and `ensureService`
  (`src/accessories/serviceCatalogue.ts:215-345, 528-545, 803-830, 866-934`); the reasons,
  `reportedControlValue`, the gate facts, the binder wiring and the publish pass
  (`src/accessories/basementGuardian.ts:315-385, 540-745`); `commandTransportReadyNow` and
  `recordPollFailure` (`src/runtime/accountRuntime.ts:595-625, 780-795`); the poll interval bounds
  (`src/config.ts:25`);
- `features/lib/hap.ts:170-360, 686-722` (`StandInCharacteristic`, `createFakeHap`).

Opening open set: 1. Confirmed fixed: 1. Still open: 0. Reopened: 0. New: 1 (0 BLOCKER, 1
WARNING). Closing: 1.

## Round status

### Opening ID

- **CR-05-CONTROLS-042** fixed (`3bda590`).
  - The `commandTransportReady` JSDoc (95-98) now says that the accessory answers the fact from the
    account-wide monitoring trust, that no row reads it, and that one failed poll clears it without
    withdrawing a row's trust, so a press can be refused for a missing route while the tile still
    shows a value.
  - I checked each part against the code. The only reader of `commandTransportReady` in `src` is
    the binder (`basementGuardian.ts:594-596` answers it, and 665 passes it to `createControlBinder`). Rows read the
    monitoring trust through `monitoringDegradedScopes`, which reads `credentialsRejected`,
    `shadowSilent` and `restDegraded` only (`basementGuardian.ts:325-335`). One failed poll sets
    `polling` to `false` (`accountRuntime.ts:788-789`, read at 610-611), while `restDegraded` needs
    two consecutive failures (`accountRuntime.ts:602-609` states the two thresholds on purpose).
  - The "cannot disagree" sentence (100-103) now covers only `reported`. That claim holds:
    `reportedControlValue` reads `decodedControlValue` through `isRowPublishable`
    (`basementGuardian.ts:571-573`), and the row reads `booleanOf(trustedGroup(...))`, where
    `trustedGroup` asks the same `isRowPublishable` (`serviceCatalogue.ts:329-335, 541-545`).
  - The diff of `3bda590` changes JSDoc lines only. No statement, literal, cause or order changed.

### Earlier fixed IDs

All 41 are still fixed. None reopened. Every fix commit in the dispatch (001 to 042) is an ancestor
of HEAD (`git merge-base --is-ancestor`, all exit 0). Since round 5 only the JSDoc above changed, so
the test anchors keep their round-5 line numbers and the source anchors after line 99 move down by
four lines.

- **CR-05-CONTROLS-001** still fixed: 'ignores a confirming report that lands after the window already closed' (1392-1408) compares the whole `warnings` array. The only `.length` in the test is the stub's handle (100).
- **CR-05-CONTROLS-002** still fixed: `describe('createControlBinder')` (626-1462) and `describe('bindRestoredControlRefusal')` (1464-1621), top level, not nested.
- **CR-05-CONTROLS-003** still fixed: no "microtask" in the test; `hapWriteFidelity.test.ts` keeps the protection (D-13).
- **CR-05-CONTROLS-004** still fixed: the spy at 887 is `t.mock.method(characteristic, 'onSet')`. Each `.bind(` hit (171, 890, 891, 1123, 1429, 1451) is `ControlBinder.bind`.
- **CR-05-CONTROLS-005** still fixed: `// act & assert` only at 1126 and 1551, each over one `assert.rejects()`.
- **CR-05-CONTROLS-006** still fixed: `as unknown as` only at 50 (`HAP_NAMESPACE`) and 56 (`asService`), both commented (D-11).
- **CR-05-CONTROLS-007** still fixed: the order note (335-360) sits directly above `const LOCAL_REFUSALS` (361).
- **CR-05-CONTROLS-008** still fixed: `pending` (229), `isAwaitingConfirmation` (314-316), its row last (368) and `pending: requested.has(capability)` (595). The regression case (729-759) and 041's in-flight case (761-792) pass.
- **CR-05-CONTROLS-009** still fixed: `refuseOutcome` calls `resolvePending` only for `vendor-error` (576-578). 820-849, the row at 337-350 and the row at 899 expect pending `['self-test']`.
- **CR-05-CONTROLS-010** still fixed: `PRECEDENCE` (11 rows, 435-513) and `PENDING_PRECEDENCE` (6 rows, 518-561) run at 1257-1298. With 1178, 1217 and 1240, every single-write pair that can hold together (14) has a case, and the pending rule meets all six others.
- **CR-05-CONTROLS-011** still fixed: 1051-1080 runs every deferral, compares `{ thrown, pending, delays, cancelled }` and calls `verify(commands)`.
- **CR-05-CONTROLS-012** still fixed: 703-727 compare `{ pending, cancelled }`.
- **CR-05-CONTROLS-013** still fixed: 897-932 and 1300-1326 record `republish` before and after the push.
- **CR-05-CONTROLS-014** still fixed: 936-952 and 1599-1620 change the value between the refusal and the push.
- **CR-05-CONTROLS-015** still fixed: `RESTORED_PRESSES` (621-624) drive 1465-1534.
- **CR-05-CONTROLS-016** still fixed: 1110-1139 and 1538-1563 assert `instanceof HAP.HapStatusError` and `hapStatus`.
- **CR-05-CONTROLS-017** still fixed: no `// act` block holds an `assert.` call; `assertRefused` is not in the file.
- **CR-05-CONTROLS-018** still fixed: `readOfSwitch` (605-611) awaits inside its `try`; every caller awaits it.
- **CR-05-CONTROLS-019** still fixed: 1007-1015, one `test()` per row.
- **CR-05-CONTROLS-020** still fixed: 151-155 state the single slot with no replacement warning.
- **CR-05-CONTROLS-021** still fixed: 105-109 quote the WR-02 title in the present tense (`basementGuardian.test.ts:2848`); 322-326 have no "now".
- **CR-05-CONTROLS-022** still fixed: 1214-1216 and 1237-1239 name "the quiet-live-path rule"; no narration of removed code.
- **CR-05-CONTROLS-023** still fixed: each case that promises sends makes `mock<CommandPort>({ exactParams: true, name: 'commands' })` inside the case and calls `verify(commands)` last. No `anyTimes`, `It.isAny` or `recordingCommands`.
- **CR-05-CONTROLS-024** still fixed: `acceptedOutcome()` (32-34) and per-row factories; `RefusalCase` fields are `readonly`.
- **CR-05-CONTROLS-025** still fixed: D-01 header at `controls.ts:1-52` (Header inspection).
- **CR-05-CONTROLS-026** still fixed: 26-29 and 335-336.
- **CR-05-CONTROLS-027** still fixed: 87.
- **CR-05-CONTROLS-028** still fixed: 109-111 and 158-162 are block bodies.
- **CR-05-CONTROLS-029** still fixed: 686 and 1044-1047 compare whole delay lists.
- **CR-05-CONTROLS-030** still fixed: the support comments name tables and entrypoints.
- **CR-05-CONTROLS-031** still fixed: `function noop(): void` at 68 and 86.
- **CR-05-CONTROLS-032** still fixed: 485-490, 547-551 and 619-621.
- **CR-05-CONTROLS-033** still fixed: `outcomeWarning` (385-389). The test expects the timed-out line at 339, 845 and 863; "did not take effect" appears only for `vendor-error` (388; test 325).
- **CR-05-CONTROLS-034** still fixed: no case with identical code under two claims; "quotes nothing else" is not in the file.
- **CR-05-CONTROLS-035** still fixed: "the other half", "the one case" and "half the time" are not in the source.
- **CR-05-CONTROLS-036** still fixed: 954-982 is unchanged and passes.
- **CR-05-CONTROLS-037** still fixed: the transport and clearing-push comments make no waiting-request claim (88-98, 404-413); "third fact" and "middle rules" are not in the source.
- **CR-05-CONTROLS-038** still fixed: the `PRECEDENCE` comment (433-434) names exactly the three pairs it does not hold; 1175-1177 make no pair count.
- **CR-05-CONTROLS-039** still fixed: `bind` JSDoc (157-159), `hasNoFreshState` (278-283), `clearRefusal` (404-413), `expire` (517-531), `timers` JSDoc (66-75) and the note above `isConfirmedOffline` (293-297) say what the round-5 report confirmed. "vouch" appears only at 524, for the marking rule.
- **CR-05-CONTROLS-040** still fixed: the test is unchanged since round 5; 984-989, 1214-1216 and 1237-1239 read as confirmed then.
- **CR-05-CONTROLS-041** still fixed: 761-792 and 794-818 are unchanged and pass.

Reopened: none.

## Findings

### CR-05-CONTROLS-043 - WARNING: The file overview says the binder is reached through the no-publish lookup, but the accessory binds the service `ensureService` answers, which on a new accessory is the one it just added

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does, as it stands); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation. The `typescript-style` "Classifying findings" makes comment findings WARNING.
**Location:** `bab42433952af1ffc3f83653537f78d1e8bdde40:src/accessories/controls.ts:18-21`
**Issue:** The `@fileoverview` says:

> The catalogue stays projection-only. This binder attaches to a service the catalogue already
> published, through the one lookup an accessory reaches for when it must act on what it already
> published, so one service list keeps feeding subtypes, names, and descriptors (D-01).

"The one lookup an accessory reaches for when it must act on what it already published" is the
catalogue's own description of `publishedService`, nearly word for word: "This is the one lookup an
accessory reaches for when it must act on what it already published without publishing anything
new" (`serviceCatalogue.ts:881-882`). That is not how the binder is reached:

- The only `bind` call site is `bindControlRow` (`basementGuardian.ts:698-706`). Its one caller is
  the publish pass `publishRows`, which passes the service `ensureService` answered
  (`basementGuardian.ts:731-739`).
- `ensureService` is the get-or-add: it answers `publishedService` when the accessory carries the
  service, and otherwise calls `accessory.addService` (`serviceCatalogue.ts:926-933`). The control
  rows set `alwaysPublish: true` (`serviceCatalogue.ts:818, 827`), so on a new accessory it adds
  both Switches.
- `bindControlRow` runs before the pass pushes any value onto the service (739, then 741-743). So
  on a new accessory the handler attaches to a Switch that `addService` created a moment earlier,
  in the pass that publishes something new, which is the opposite of the case the quoted lookup is
  for.
- The `bound` guard (`controls.ts:630-634`) makes that first `bind` the only one with an effect.
  Every later pass finds the same object through the lookup and returns at the guard. So for a new
  accessory, the one bind that attaches the handler never goes through the lookup the overview
  names.

The claim is true only for a restored accessory, where `publishedService` answers the cached
Switch on the first pass. A reader who follows the overview to `publishedService` finds its other
callers, `republishControlRows` and `removeServiceIfPresent`, and none of them binds. A maintainer
who trusts the sentence and moves `bind` to the lookup-only republish path leaves a new accessory's
Switches with no handler. HAP then stores a press and reports success, which is the silent
success `bindRestoredControlRefusal` exists to prevent.

The rest of the paragraph holds. The binder makes no service of its own, the service comes from the
catalogue's row (subtype, display name), and `publishedService` names a service the accessory
carries "a service a row already publishes on" (`serviceCatalogue.ts:872`). So "a service the
catalogue already published" can stand in that sense. Only the lookup clause is wrong.

The sentence dates from the initial release (`b19ea58`) and is unchanged at the batch base
(`4c143eb:src/accessories/controls.ts:13-16`). No earlier round report or ledger row discusses it:
`grep -n "one lookup\|projection-only"` over `05-CONTROLS-REVIEW*.md` and `05-FINDINGS.md` finds
nothing. CR-05-CONTROLS-026 fixed the HAP bullet below it, not this sentence.

**Fix:** One comment-only `docs(controls)` commit. Change no code, literal, cause or order. Name the
path the accessory takes, for example replace 18-21 with:

```text
 * The catalogue stays projection-only. This binder attaches to the service the
 * accessory publishes a control row on, the one `ensureService` answers in the
 * publish pass, so one service list keeps feeding subtypes, names, and
 * descriptors (D-01).
```

Keep the `bind` JSDoc (149) and the `createControlBinder` JSDoc (479-480) as they are: "a Switch
the catalogue already published" is true in the catalogue's sense of a service the accessory
carries, and by the time `bind` runs, `ensureService` has added it.

**Flags:** none. Not a D-04 candidate: no behavior is wrong; only the comment is. D-10 does not
apply, because SC-02 touched no source line. Not a reopen of CR-05-CONTROLS-026 (a different
sentence) or 042 (a different JSDoc). No exported contract change (D-06). The same claim appears in
`basementGuardian.ts:694-697`, which belongs to the ACCESSORY batch (Out-of-scope observations).

## Candidates considered and not filed

- **The `commandTransportReady` JSDoc ends with two paragraphs about `bind`'s `reported`** (100-109).
  After `3bda590` these paragraphs no longer speak about the transport fact. They set up a contrast:
  this fact can disagree with the tile (95-98), and `reported` cannot (100-103). They also explain why
  that matters (105-109). The `bind` JSDoc (157-159), where a user of `reported` reads, does not
  carry the agreement claim. Nothing in them is false, and the round-5 fix text kept 101-105 on
  purpose. Moving them to `bind` would be a better place, but no book rule requires it. Not filed.
- **"One failed poll clears it and withdraws no row's trust"** (96). A terminal authentication failure
  halts the runtime and sets `credentialsRejected`, which withdraws every scope
  (`basementGuardian.ts:326-328`). That path is the halt (`haltOnTerminalAuthFailure`, `accountRuntime.ts:746`), not the
  failed-poll record (`accountRuntime.ts:788-793`). The sentence is about an ordinary failed poll,
  and for that it is true. Not filed.
- **`reconcile` clears only on a matching value, while D-037 says "a newer report that includes the
  command field clears pending state".** The v1.0 controls design reads D-037 as the confirming
  report (`04-CONTEXT.md:118-125`; `constraints.md:536-538`: HAP shows the requested state "before
  `test_running === true` arrives"). Clearing on any report would snap the toggle back on the first
  unrelated report, and D-05 exists to prevent that. 'keeps the capability pending while the device
  still reports the old value' (703-714) pins the chosen reading. Not filed.
- **The `bind` JSDoc's "so the guard is what keeps `bind` idempotent"** (151-155). With HAP's single
  slot, a second `onSet` would also leave one handler. The guard is what keeps the first binding's
  `reported` closure and capability, and the sentence's "without any warning" reads as that reason.
  Not filed.
- **`SELF_TEST` holds the service subtype `'system-self-test'`, and the capability is the literal
  `'self-test'`** (27, 125; 171, 1429). At each use site the role is clear from the argument
  position (`new HAP.Service.Switch(name, subtype)` against `bind(service, capability, ...)`). This
  is reviewer judgment on a name, and no earlier round raised it. Not filed.
- **'arms one clearing push for <cause> and leaves the characteristic readable'** (1031-1049) puts the
  write in `// arrange` through `refuse()` and running the pushes in `// act`. The act produces the
  "readable" half of the title, and the phases are in order. Not filed.
- **The `RefusalCase` comment's "one write against an idle control"** (210). The 'already reads
  active' row has a reported `true`. The comment then contrasts "a press while an earlier request
  waits", so "idle" means nothing pending. Loose, not false. Not filed.
- **`nothingToRepublish`'s "A restored service belongs to no accessory yet"** (420) against
  `accessoryName`'s "The accessory the service came back on" (188). The first means the plugin's
  accessory object and the second means the Homebridge `PlatformAccessory`. Each sentence makes its
  meaning clear. Not filed.
- **The `isAlreadyActive` clause "a real sump pump the vendor would not have"** (302-304). This is an
  elliptical "would not have operated". It is awkward, but not false. Not filed.
- **Round 1 to 5 rejections, rechecked against the current lines and still not filed:**
  - the `bind` JSDoc "`undefined` when the control's row may not publish it" (157-159);
  - `hasNoFreshState` and its pinned cause text (278-286, 365);
  - a timed-out outcome after a confirming report while the send was in flight;
  - `RestoredControlRefusalOptions` exported with no importer (174; `private-type-leaks`);
  - 'warns that a timed-out request may still have reached the device' (851-865), kept under P-05-03;
  - the two 041 cases' held sends (763-767, 796-800);
  - the `republish` JSDoc's reason (128-135) against `expire`'s call (537);
  - the `bind` guard keyed by service (630-634);
  - JSDoc blocks on members of module-local interfaces (223, 228; test 59, 193, 226, 231, 427);
  - comment line widths (302, 329-332);
  - the `QUIET_LIVE_CONNECTION_CAUSE` note (329-332);
  - the `liveConfirmationObservable` "naming a device failure" and "could" (122-125);
  - 'leaves a restored control answering a read before any press reaches it' (1565-1575);
  - the comment inside a case (1063, kept by the coordinator);
  - `OnSetCall.arguments` (193-196);
  - the inline `try`/`catch` in the D-04 regression cases (739-745, 829-835);
  - `windowsIn(deferrals)[0]?.handle` (1353);
  - the late `vendor-error` against a newer entry;
  - the per-accessory rows (1442-1461);
  - `refuse()` with no `// arrange` (1007-1015);
  - the subset cases (691-701, 1007-1015, 1328-1341);
  - the three "names the ..." cases (1141-1173, 1197-1212);
  - "it fails independently of the one below" (262-263);
  - the second `assert.strictEqual` at 644;
  - `outcomeWarning` as a noun phrase;
  - `heldOn` annotated `CharacteristicValue` (400-402);
  - a `commands.send` that rejects;
  - the `alarm-mute` constant against a literal `true` (245-247);
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

- All commands ran from the repository root at `bab42433952af1ffc3f83653537f78d1e8bdde40`, with a
  clean tree.
- Each command had the prefix `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.
- Versions: Node `v26.12.0`, npm `11.20.0`.
- The run started at 2026-10-17T22:25:05Z and ended at 2026-10-17T22:25:23Z.
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

Other read-only commands: `git merge-base --is-ancestor <commit> HEAD` exited 0 for every fix commit
from 001 to 042; `git show 3bda590`; `git log -S'the one lookup an accessory reaches for' --
src/accessories/controls.ts` (only `b19ea58`); `git diff --stat 5dd054e HEAD -- src test features`
(only `controls.ts`, 9 insertions and 5 deletions).

I made no source or test edit, ran no mutation experiment and made no commit or stash. Every check
passes. The one finding is a comment, and the checks cannot see comment content.

## Out-of-scope observations

- `src/accessories/basementGuardian.ts:694-697` (ACCESSORY batch): the `bindControlRow` comment
  says "The handler attaches to the service the row already published". On a new accessory the
  Switch is added by `ensureService` in the same pass (731-739), as CR-05-CONTROLS-043 describes.
- `src/accessories/basementGuardian.ts:685-691` with `controls.ts:532-539` (ACCESSORY batch;
  please confirm): `expire` restores the Switch only through `republish`. The accessory's callback
  answers nothing while `credentialsRejected` holds. A request accepted shortly before a terminal
  authentication halt would therefore expire with HAP still serving the requested `true`. D-037
  says "Restore the last reported Switch value". The accessory comment chooses this on purpose for
  the halt presentation (`StatusActive` through `publishPersistentFailure`,
  `staleMarking.ts:172`), which may hide the tile anyway. I did not probe it. The coordinator can
  decide whether the ACCESSORY batch should look at it.
- Unchanged from round 5:
  - `src/accessories/basementGuardian.ts:591-593` (the comment above `commandTransportReady`): the transport comment repeats the claim
    that CR-05-CONTROLS-042 fixed in `controls.ts`;
  - `src/accessories/serviceCatalogue.ts:337`: "vouch" names the withholding rule;
  - `src/runtime/commandPort.ts:21`: "did not take effect" also covers `timed-out`;
  - `test/accessories/basementGuardian.test.ts:2844-2847` and
    `src/accessories/basementGuardian.ts:567-570`: history narration;
  - the AGENTS.md privacy sentence conflicts with `deviceId` in log lines (maintainer).

---

_Reviewed: 2026-10-17T22:40:00Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 6)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. Opening 1, fixed 1, rejected 0, new 1, reopened 0,
closing 1. The round has an open finding and closing (1) is at least opening (1), so the result
is `STOP: no progress` (D-03 as amended, D-18). CR-05-CONTROLS-001 to 041 stay fixed.

- **CR-05-CONTROLS-042:** `fixed`, as the Round status shows.
- **CR-05-CONTROLS-043:** `open`, WARNING, comment-only. The coordinator checked the claim. The
  only bind path is `publishRows` -> `ensureService` -> `bindControlRow`
  (`basementGuardian.ts:731-739`). On a new accessory, `ensureService` adds the control service
  (`serviceCatalogue.ts:926-945`), so the overview's "through the one lookup an accessory reaches
  for when it must act on what it already published" (`publishedService`) holds only for a
  restored accessory. The rule applies whatever the round count, so the coordinator does not
  reject the finding to avoid the stop.
- **Out-of-scope observations:** the same "already published" claim in
  `src/accessories/basementGuardian.ts:694-697`, and the reviewer's unprobed concern that a request
  accepted just before a terminal authentication halt could expire while HAP still serves the
  requested `true` (the accessory's `republish` does nothing while credentials are rejected), go
  to the ACCESSORY batch as lead S-05-24.
- **Stop:** the counter row is written with `STOP: no progress` and left uncommitted, with this
  report, until the maintainer resolves it.
- **Maintainer resolution (2026-10-17):** "Resolve and continue". The counter row now reads
  `STOP: no progress; resolved by maintainer`. The coordinator repairs 043 and runs correction
  round 7.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CONTROLS-043 | `src/accessories/controls.ts` (comment lines only); this report | Node `v26.12.0`: `fallow guard src/accessories/controls.ts` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/controls.test.js` 0 (tests 105, suites 2, pass 105, fail 0); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` 0; `eslint src/accessories/controls.ts --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 4c143eb --format json --quiet --explain` 0, verdict `pass` | n/a (WARNING) | Three comment changes. (1) `@fileoverview` 18-21: the binder attaches to the Switch `ensureService` answers for a control row, restored or just added; the `publishedService` clause is gone (`basementGuardian.ts:731-739`, `serviceCatalogue.ts:926-933`). (2) `@fileoverview` 39-41: "every caller uses `publishValue`" now covers writers of `On` only, because the accessory uses `setCharacteristic` on the information service (`basementGuardian.ts:457-460`); every `On` write outside this file is a `publishValue` (`grep Characteristic.On src`). (3) `bindRestoredControlRefusal` JSDoc 433-434: "this plugin publishes nothing until the first REST inventory succeeds" is now "no binder exists until ...", because `configureAccessory` already publishes `StatusActive = false` through `markRestoredServicesStale` (`platform.ts:662-664`, `staleMarking.ts:107-110`), and accessories are created only in `registerDiscoveredDevices` (`platform.ts:218, 340, 380-383`). Checked and true, so unchanged: one write path (`onSet` only in this file); the wire body built by the port's implementer (`accountRuntime.ts:262-272, 1143-1158`); the restored refusal replaced on the first publish (`publishRows` -> `bindControlRow`; the unresolved branch only republishes); `offlineConfirmed` from the `ProjectionInput` count (`basementGuardian.ts:587-589, 614`); `commandTransportReady` read by no row (`basementGuardian.ts:325-335, 594-596`; `accountRuntime.ts:610-611, 782-789`; `REST_FAILURE_THRESHOLD = 2`); window shorter than a poll and an hour at most (`config.ts:25`); `republish` re-asserts the control rows only (`basementGuardian.ts:641-653, 685-691`) and the "two updates cannot interleave" claim exists (`basementGuardian.ts:101-102`); `pending` reaches rows only through `ProjectionInput` (`serviceCatalogue.ts:544`); the `bind` JSDoc's "walks its whole catalogue on every update" (both `update()` branches walk it), and the "already published" wording of `bind` and `createControlBinder` kept as the finding says; the restored options' timers, name and "read nothing from the accessory context" (`platform.ts:593, 661-664`; `staleMarking.ts:130-133`); no read handler in the tier. |
