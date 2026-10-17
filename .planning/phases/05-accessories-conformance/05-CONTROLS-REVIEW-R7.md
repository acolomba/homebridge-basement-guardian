---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 7
reviewed: 2026-10-17T22:55:00Z
depth: deep
source_revision: 09727ef76427811f8773b47345046c85ce41d657
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 0
  warning: 1
  total: 1
status: issues_found
reviewer: gsd-code-reviewer (correction round 7)
---

# Phase 5 CONTROLS batch: correction round 7

I read every line of both files in full at `09727ef76427811f8773b47345046c85ce41d657`: all 647 lines
of `src/accessories/controls.ts` and all 1621 lines of `test/accessories/controls.test.ts`. Before I
started, `git rev-parse HEAD` printed that revision and `git status --porcelain` printed nothing.
Since round 6 (`bab4243`), one commit touched `src`, `test` or `features`: `af70160`
(`controls.ts`, JSDoc lines only, 9 insertions and 8 deletions). The test file is byte-identical to
round 6.

I used these inputs:

- AGENTS.md;
- the three `.agents/skills` books, each `SKILL.md` with every `rules/*.md` file (they win over
  `.claude/rules/*.md`);
- `05-CONTEXT.md` and `05-REVIEW-PROTOCOL.md` in full; the CONTROLS rows of `05-FINDINGS.md`
  (findings, counter rows for rounds 0 to 6, genuine bug histories, `### 05-04`);
  `05-CONTROLS-REVIEW.md` and `-R1.md` to `-R6.md` (findings, candidates not filed, triage, repair
  history);
- D-037 and D-038 (`.planning/intel/decisions.md:787-830`), CTRL-03 and CTRL-05
  (`.planning/milestones/v1.0-REQUIREMENTS.md:67, 69`);
- read only: the trust reasons and the binder wiring, `publishRows`, `republishPublishedRows` and
  both `update()` branches (`src/accessories/basementGuardian.ts:300-380, 540-810, 940-1075`); the
  trust functions, `controlValues`, the control rows, `publishedService`, `ensureService` and
  `publishValue` (`src/accessories/serviceCatalogue.ts:215-345, 528-545, 800-835, 860-978`);
  `commandTransportReadyNow` (`src/runtime/accountRuntime.ts:590-612`); the `configureAccessory`
  pass, `refuseRestoredControls`, `applyMonitoringHealth`, `updateDiscoveredDevice` and
  `dispatchDiscoveredDevice` (`src/platform.ts:195-400, 600-670`; `src/accessories/staleMarking.ts:53,
  130-134`);
- `features/lib/hap.ts` exports and the stand-in the test imports.

Opening open set: 1. Confirmed fixed: 1. Still open: 0. Reopened: 0. New: 1 (0 BLOCKER, 1
WARNING). Closing: 1.

## Round status

### Opening ID

- **CR-05-CONTROLS-043** fixed (`af70160`).
  - The overview (18-21) now says the binder attaches to the Switch that `ensureService` answers
    for a control row, either restored from the Homebridge cache or just added by that call. The
    `publishedService` clause is gone.
  - I checked it against the call sites. The only `bind` call is `bindControlRow`
    (`basementGuardian.ts:698-706`), and its one caller is `publishRows`, which passes the service
    `ensureService` answered (`basementGuardian.ts:731-739`). `ensureService` answers
    `publishedService` when the accessory carries the service and otherwise adds it; the control
    rows set `alwaysPublish` (`serviceCatalogue.ts:818, 827, 926-933`). One accessory object, and
    so one binder, exists per UUID for the platform run (`platform.ts:211-222`), and a new
    `PlatformAccessory` is built and updated in the same dispatch (`platform.ts:333-347`). So the
    first `bind` with an effect gets a cached Switch or one the same `ensureService` call added.
    Every later `bind` returns at the guard (`controls.ts:631-633`).
  - The two other restated claims hold. Every `On` write in `src` outside this file is
    `publishValue` (`grep Characteristic.On src`; `setCharacteristic` appears only on
    `AccessoryInformation`, `basementGuardian.ts:457-460`; `publishPersistentFailure` writes
    `StatusActive`). The binder is built only in `createBasementGuardianAccessory`
    (`basementGuardian.ts:658`), which runs only from `registerDiscoveredDevices` through
    `onTrustworthyInventory` (`platform.ts:611-613`).
  - The diff of `af70160` changes JSDoc lines only. No statement, literal, cause or order changed.
    A separate claim in the same JSDoc block is wrong; see CR-05-CONTROLS-044. That is a new cause,
    not a return of 043's defect: 043 was the lookup clause of the overview.

### Earlier fixed IDs

All 42 are still fixed. None reopened. Every fix commit in the dispatch (001 to 043) is an ancestor
of HEAD (`git merge-base --is-ancestor`, all exit 0). The test is unchanged since round 6, so test
anchors keep their round-6 numbers. `af70160` added one line at 40-41, so source anchors after line
41 move down by one.

- **CR-05-CONTROLS-001** still fixed: 'ignores a confirming report that lands after the window already closed' (1392-1408) compares the whole `warnings` array. The only `.length` is the stub's handle (100).
- **CR-05-CONTROLS-002** still fixed: `describe('createControlBinder')` (626-1462) and `describe('bindRestoredControlRefusal')` (1464-1621), top level, not nested.
- **CR-05-CONTROLS-003** still fixed: no "microtask" in the test.
- **CR-05-CONTROLS-004** still fixed: the spy at 887 is `t.mock.method(characteristic, 'onSet')`. Each `.bind(` hit (171, 890, 891, 1123, 1429, 1451) is `ControlBinder.bind`.
- **CR-05-CONTROLS-005** still fixed: `// act & assert` only at 1126 and 1551, each over one `assert.rejects()`.
- **CR-05-CONTROLS-006** still fixed: `as unknown as` only at 50 (`HAP_NAMESPACE`) and 56 (`asService`), both commented (D-11).
- **CR-05-CONTROLS-007** still fixed: the order note (336-361) sits directly above `const LOCAL_REFUSALS` (362).
- **CR-05-CONTROLS-008** still fixed: `pending` (230), `isAwaitingConfirmation` (315-317), its row last (369) and `pending: requested.has(capability)` (596). The cases at 729-759 and 761-792 pass.
- **CR-05-CONTROLS-009** still fixed: `refuseOutcome` calls `resolvePending` only for `vendor-error` (577-579). 820-849, the row at 337-350 and the row at 899 expect pending `['self-test']`.
- **CR-05-CONTROLS-010** still fixed: `PRECEDENCE` (11 rows, 435-513) and `PENDING_PRECEDENCE` (6 rows, 518-561) run at 1257-1298; with 1178, 1217 and 1240 all 14 pairs that can hold together have a case.
- **CR-05-CONTROLS-011** still fixed: 1051-1080 runs every deferral, compares `{ thrown, pending, delays, cancelled }` and calls `verify(commands)`.
- **CR-05-CONTROLS-012** still fixed: 703-727 compare `{ pending, cancelled }`.
- **CR-05-CONTROLS-013** still fixed: 897-932 and 1300-1326 record `republish` before and after the push.
- **CR-05-CONTROLS-014** still fixed: 936-952 and 1599-1620 change the value between the refusal and the push.
- **CR-05-CONTROLS-015** still fixed: `RESTORED_PRESSES` (621-624) drive 1465-1534.
- **CR-05-CONTROLS-016** still fixed: 1110-1139 and 1538-1563 assert `instanceof HAP.HapStatusError` and `hapStatus`.
- **CR-05-CONTROLS-017** still fixed: no `// act` block holds an `assert.` call; `assertRefused` is not in the file.
- **CR-05-CONTROLS-018** still fixed: `readOfSwitch` (605-611) awaits inside its `try`; every caller awaits it.
- **CR-05-CONTROLS-019** still fixed: 1007-1015, one `test()` per row.
- **CR-05-CONTROLS-020** still fixed: 152-156 state the single slot with no replacement warning.
- **CR-05-CONTROLS-021** still fixed: 106-110 quote the WR-02 title in the present tense; 323-327 have no "now".
- **CR-05-CONTROLS-022** still fixed: 1214-1216 and 1237-1239 name "the quiet-live-path rule".
- **CR-05-CONTROLS-023** still fixed: each case that promises sends makes `mock<CommandPort>({ exactParams: true, name: 'commands' })` inside the case and calls `verify(commands)` last. No `anyTimes`, `It.isAny` or `recordingCommands`.
- **CR-05-CONTROLS-024** still fixed: `acceptedOutcome()` (32-34) and per-row factories; `RefusalCase` fields are `readonly`.
- **CR-05-CONTROLS-025** still fixed: D-01 header at `controls.ts:1-53` (Header inspection).
- **CR-05-CONTROLS-026** still fixed: 26-29 and 336-337.
- **CR-05-CONTROLS-027** still fixed: 87.
- **CR-05-CONTROLS-028** still fixed: 109-111 and 158-162 are block bodies.
- **CR-05-CONTROLS-029** still fixed: 686 and 1044-1047 compare whole delay lists.
- **CR-05-CONTROLS-030** still fixed: the support comments name tables and entrypoints.
- **CR-05-CONTROLS-031** still fixed: `function noop(): void` at 68 and 86.
- **CR-05-CONTROLS-032** still fixed: 486-491, 548-552 and 620-622.
- **CR-05-CONTROLS-033** still fixed: `outcomeWarning` (386-390). The test expects the timed-out line at 339, 845 and 863; "did not take effect" appears only for `vendor-error` (389; test 325).
- **CR-05-CONTROLS-034** still fixed: no case with identical code under two claims; "quotes nothing else" is not in the file.
- **CR-05-CONTROLS-035** still fixed: "the other half", "the one case" and "half the time" are not in the source.
- **CR-05-CONTROLS-036** still fixed: 954-982 is unchanged and passes.
- **CR-05-CONTROLS-037** still fixed: the transport and clearing-push comments make no waiting-request claim (88-99, 405-414); "third fact" and "middle rules" are not in the source.
- **CR-05-CONTROLS-038** still fixed: the `PRECEDENCE` comment (433-434) names exactly the three pairs it does not hold.
- **CR-05-CONTROLS-039** still fixed: `bind` JSDoc (158-160), `hasNoFreshState` (279-284), `clearRefusal` (405-414), `expire` (518-532), `timers` JSDoc (67-75) and the note above `isConfirmedOffline` (294-298). "vouch" appears only at 525, for the marking rule.
- **CR-05-CONTROLS-040** still fixed: the test is unchanged since round 5.
- **CR-05-CONTROLS-041** still fixed: 761-792 and 794-818 are unchanged and pass.
- **CR-05-CONTROLS-042** still fixed: 96-104 are unchanged since `3bda590`.

Reopened: none.

## Findings

### CR-05-CONTROLS-044 - WARNING: The restored refusal's JSDoc and the overview say it lasts until an accessory exists and that the plugin then has no route, but it outlives the first inventory and names the transport cause while the transport is ready

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does, as it stands); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation. The `typescript-style` "Classifying findings" makes comment findings WARNING.
**Location:** `09727ef76427811f8773b47345046c85ce41d657:src/accessories/controls.ts:48-52, 428-443`
**Issue:** Three claims set the restored refusal's lifetime and justify its cause:

- 428-430: "Refuses every press on one restored control until an accessory exists to route it."
- 48-52 (overview): "the binder's own handler replaces it on the first publish".
- 440-443: "The status and the cause are the transport rule's own, because the condition is the
  transport rule's own: the plugin has no proven way to reach the vendor."

The code that ends the refusal is `bindControlRow`. Only `publishRows` calls it
(`basementGuardian.ts:731-739`), and `update()` calls `publishRows` only when the registry answers
`implemented` (`basementGuardian.ts:991, 1060`). The other `update()` branch handles a family that
does not resolve. It runs after a successful REST inventory, it builds the accessory and its binder,
and it republishes through `republishPublishedRows` (`basementGuardian.ts:1012`), which never binds.
`updateDiscoveredDevice` takes that branch for a cached accessory whatever its `deviceTypeId`
resolves to (`platform.ts:253-275`; the `implemented` check guards only a new registration,
`platform.ts:324-330`).

So for a restored accessory whose family does not resolve:

- an accessory and its binder exist, so "until an accessory exists" is false;
- the first publish pass after the restart is a republish, and it does not replace the refusal;
- the first inventory has succeeded and the runtime reports `commandTransportReady: true`
  (`accountRuntime.ts:610-612`). The refusal still logs "the plugin has no way to reach the vendor
  right now" for every press. The condition is not the transport rule's own.

A read-only probe of the compiled modules confirmed this (Toolchain evidence). I restored an
accessory with a cached Self-Test Switch, ran `refuseRestoredControls` as `configureAccessory`
does, built the accessory with a registry that answers `unknown`, marked monitoring with
`commandTransportReady: true`, and ran one `poll` update. A press then answered `-70412` and logged
`Refused System Self-Test on Sump Guardian: the plugin has no way to reach the vendor right now.`
No command was sent.

The comment matters because it is the stated reason that the cause text is correct. A maintainer
who trusts it has no reason to look for the window where the line is false. The project's own
diagnostic rule (`basementGuardian.ts:797-806`) says a line that names the wrong cause is worse than
none, because an owner acts on it. This is new evidence. No earlier round report or ledger row
discusses the unresolved-family branch against the restored refusal
(`grep -i "unresolved\|until an accessory exists\|transport rule's own"` over
`05-CONTROLS-REVIEW*.md` and `05-FINDINGS.md` finds only the round-6 repair history row, which
checks "replaced on the first publish" against `publishRows` and does not test the cause claim).

**Fix:** One comment-only `docs(controls)` commit in `src/accessories/controls.ts`. Change no
code, literal, cause, status or order (D-05, P-05-01). State what ends the refusal and where the
cause claim stops holding. For example:

- 428-430: "Refuses every press on one restored control until the accessory binds the control row."
- 48-52: "...and the binder's own handler replaces it when the accessory first publishes the
  control row".
- 440-443: keep the D-07/D-08 reason, but say it is the condition the refusal exists for: a restart
  the cloud has not answered. Add one sentence that the refusal also stays, with the same line,
  while a cached accessory's family does not resolve, because only a resolved publish binds.

Whether that log line should stay is a behavior decision for the coordinator. See Flags.

**Flags:** possible D-04 candidate for the coordinator. The user-facing refusal names a false cause
after the transport has recovered. The behavior lives in `src/accessories/basementGuardian.ts`, the
`update()` branch for an unresolved family (ACCESSORY batch), and the log literal is pinned (D-05,
P-05-01). So this controls finding is the comment only (see Out-of-scope observations). No D-10:
SC-02 touched no source line. This is not a reopen of CR-05-CONTROLS-043, which was the overview's
lookup clause, or of 026, which was the HAP bullet. No exported contract change (D-06).

## Candidates considered and not filed

- **The new overview's "one the Homebridge cache restored, or one that call has just added"**
  (18-21). Later passes on a new accessory get a Switch an earlier call added, but those `bind`
  calls return at the guard, so the sentence holds for the bind that attaches. The other case is a
  restored accessory without a cached Switch whose first resolved pass throws between
  `ensureService` and `bindControlRow`. Only `seedConfiguredName` runs there. I found no realistic
  throw, so I did not file it.
- **"Every writer of `On`, here and in each caller"** (39-41). The module's callers are
  `basementGuardian.ts` and `staleMarking.ts`. Neither writes `On` except through `publishValue`.
  True. Not filed.
- **Ragged rewrap at 433-436** ("With no handler on `On`, HAP stores the written value and" is a short
  line after the `af70160` edit). This is formatting only, and no book rule sets comment wrapping.
  Not filed.
- **The restored refusal's line names the accessory's display name, not the `deviceId`, after the
  accessory exists** (probe output). The `accessoryName` JSDoc (189-197) gives the reason for the
  restart window. Past that window this is part of the behavior that CR-05-CONTROLS-044 flags for
  the coordinator. Not filed separately.
- **Round 1 to 6 rejections, rechecked against the current lines and still not filed:**
  - the `commandTransportReady` JSDoc ending with two paragraphs about `reported` (101-110);
  - "one failed poll clears it and withdraws no row's trust" (97);
  - `reconcile` clearing only on a matching value;
  - the `bind` guard "keeps `bind` idempotent" (152-156);
  - `SELF_TEST` subtype against the `'self-test'` capability;
  - 'arms one clearing push ...' phases (1031-1049);
  - the `RefusalCase` "idle control" (210);
  - `nothingToRepublish`'s "belongs to no accessory yet" (421) against `accessoryName` (189);
  - the `isAlreadyActive` "would not have" (303-305);
  - the `bind` JSDoc "`undefined` when the control's row may not publish it" (158-160) and its
    "already published" wording, kept as round 6 said;
  - `hasNoFreshState` and its pinned cause (279-287, 366);
  - a timed-out outcome after a confirming report while the send was in flight;
  - `RestoredControlRefusalOptions` exported with no importer (175; `private-type-leaks`);
  - 'warns that a timed-out request may still have reached the device' (851-865), kept under
    P-05-03;
  - the two 041 cases' held sends (763-767, 796-800);
  - the `republish` JSDoc (129-136) against `expire`'s call (538);
  - the `bind` guard keyed by service (631-634);
  - JSDoc on members of module-local interfaces (223, 229; test 59, 193, 226, 231, 427);
  - comment line widths (303, 330-333) and the `QUIET_LIVE_CONNECTION_CAUSE` note;
  - the `liveConfirmationObservable` "naming a device failure" and "could" (123-126);
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
  - "it fails independently of the one below" (263-265);
  - the second `assert.strictEqual` at 644;
  - `outcomeWarning` as a noun phrase;
  - `heldOn` annotated `CharacteristicValue` (401-403);
  - a `commands.send` that rejects;
  - the `alarm-mute` constant against a literal `true` (246-248);
  - 'answers the transport refusal status ...' reading `statusCode` (1300-1326);
  - 'holds one independent entry per capability ...' with no `cancelled` (1425-1438);
  - the 036 comment "a requested value never shows as reported state" (954-956);
  - no owner case for a waiting request with no reported value.

## Header inspection

- `src/accessories/controls.ts` conforms to D-01:
  - line 1 is `// SPDX-License-Identifier: MIT` and line 2 is empty;
  - lines 3-5 hold the copyright block (`Copyright (c) 2026 Alessandro Colomba`) and line 6 is
    empty;
  - lines 7-53 hold the `@fileoverview` block and line 54 is empty;
  - the first import is at line 55.
- `test/accessories/controls.test.ts` conforms to D-01:
  - line 1 is the SPDX line and line 2 is empty;
  - lines 3-5 hold the copyright block and line 6 is empty;
  - lines 7-9 hold the `@fileoverview` block and line 10 is empty;
  - the first import is at line 11.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS`
  printed `ACCESSORIES_HEADERS_OK files=2` and exited 0.

## Toolchain evidence

- All commands ran from the repository root at `09727ef76427811f8773b47345046c85ce41d657`, with a
  clean tree.
- Each command had the prefix `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`.
- Versions: Node `v26.12.0`, npm `11.20.0`.
- The run started at 2026-10-17T22:39:38Z and ended at 2026-10-17T22:39:51Z.
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

Probe (read-only, made-up inputs, script in the session scratch directory, not in the repository):
`node <scratch>/probe-unresolved.mjs <repo>`, exit 0, on the compiled `dist-test` modules
(`features/lib/hap.js`, `features/lib/homebridgeApi.js`, `src/accessories/staleMarking.js`,
`src/accessories/basementGuardian.js`). The output was `refusing: 1`, `thrown: -70412`, `sends: []`
and two warnings. The first was the accessory's own degradation line for the unresolved family. The
second was `Refused System Self-Test on Sump Guardian: the plugin has no way to reach the vendor
right now.`, logged after `markMonitoring({ ..., commandTransportReady: true })` and one `poll`
update.

Other read-only commands: `git merge-base --is-ancestor <commit> HEAD` exited 0 for every fix commit
from 001 to 043; `git show af70160 -- src/accessories/controls.ts`; `git diff --stat bab4243 HEAD --
src test features` (only `controls.ts`, 9 insertions and 8 deletions).

I made no source or test edit, ran no mutation experiment and made no commit or stash. Every check
passes. The one finding is a comment, and the checks cannot see comment content.

## Out-of-scope observations

- `src/accessories/basementGuardian.ts:988-1015` (ACCESSORY batch): the unresolved-family branch
  of `update()` never binds the control rows. A restored accessory whose family does not resolve
  therefore keeps the restored refusal after the first successful inventory. Every press logs
  `...: the plugin has no way to reach the vendor right now.` while `commandTransportReady` is
  true, and the line names the accessory's display name instead of the `deviceId` (probe above).
  If the binder were bound there, it would answer the fresh-state cause, because the branch
  withdraws every non-connectivity scope as `invalid`. The coordinator can decide whether this is a
  D-04 genuine bug for ACCESSORY or an accepted limit to document (CR-05-CONTROLS-044).
- Unchanged from round 6:
  - `src/accessories/basementGuardian.ts:694-697`: the `bindControlRow` comment "the service the
    row already published" (lead S-05-24);
  - `src/accessories/basementGuardian.ts:685-691` with `controls.ts:533-540`: expiry under a
    refused credential (lead S-05-24);
  - `src/accessories/basementGuardian.ts:591-593`: the transport comment repeats the claim that
    CR-05-CONTROLS-042 fixed in `controls.ts`;
  - `src/accessories/serviceCatalogue.ts:337`: "vouch" names the withholding rule;
  - `src/runtime/commandPort.ts:21`: "did not take effect" also covers `timed-out`;
  - `test/accessories/basementGuardian.test.ts:2844-2847` and
    `src/accessories/basementGuardian.ts:567-570`: history narration;
  - the AGENTS.md privacy sentence conflicts with `deviceId` in log lines (maintainer).

---

_Reviewed: 2026-10-17T22:55:00Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 7)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. Opening 1, fixed 1, rejected 0, new 1, reopened 0,
closing 1. The round has an open finding and closing (1) is at least opening (1), so the result
is `STOP: no progress` (D-03 as amended, D-18). CR-05-CONTROLS-001 to 042 stay fixed.

- **CR-05-CONTROLS-043:** `fixed`, as the Round status shows.
- **CR-05-CONTROLS-044:** `open`, WARNING, comment-only in this batch. The coordinator checked the
  branch. For a family that does not resolve, `update()` republishes and returns
  (`basementGuardian.ts:991-1012`). It never calls `publishRows`, so a restored Switch keeps
  `bindRestoredControlRefusal`'s handler after a successful inventory. The JSDoc's "until an
  accessory exists" and the overview's "replaces it on the first publish" are therefore true only
  for a family that resolves.
- **Behavior outside this batch:** in that branch a press is refused with the transport cause
  ("the plugin has no way to reach the vendor right now") while the transport is ready. Refusing
  is right, because no command can be built for an unresolved family. Whether the named cause is
  wrong output is an ACCESSORY question about `basementGuardian.ts`. It goes there as lead
  S-05-25, a possible D-04 candidate. The line is preserved here (D-05).
- **Stop:** the counter row is written with `STOP: no progress` and left uncommitted, with this
  report, until the maintainer resolves it.
- **Maintainer resolution (2026-10-17):** "Resolve and continue". The counter row now reads
  `STOP: no progress; resolved by maintainer`. The coordinator repairs 044 with an audit of every
  comment claim in `src/accessories/controls.ts`, recorded as a table, and runs correction round 8.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CONTROLS-044 | `src/accessories/controls.ts` (comment lines only); this report | Node `v26.12.0`: `fallow guard src/accessories/controls.ts` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/controls.test.js` 0 (tests 105, suites 2, pass 105, fail 0); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` 0; `eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 4c143eb --format json --quiet --explain` 0, verdict `pass` | n/a (WARNING) | The 044 fix and every FALSE source claim of the audit below, comment lines only. 044: the overview (48-52), the `bindRestoredControlRefusal` JSDoc (428-443) and the note in its body (462-466) now say the binder's handler replaces the refusal when the accessory's publish pass binds the control row, which happens only once the device's family resolves (`basementGuardian.ts:739, 991-1015, 1060`). The JSDoc names the window the refusal exists for (a restart the cloud has not answered) and says the refusal stays, with the same line, while a cached accessory's family does not resolve. It does not call the logged cause wrong (lead S-05-25). The other source rows marked FALSE below are fixed in the same commit. No statement, literal, cause, status or order changed. |

## Comment claims audit

Scope: every comment and JSDoc block in `src/accessories/controls.ts`, and every comment in
`test/accessories/controls.test.ts` that states a fact about production behavior, another module,
HAP or other cases. Phase markers (`// arrange`, `// act`, `// assert`, `// act & assert`), the
license and copyright headers, and test titles are out of scope: each title is pinned by its own
assertions. Locations are lines at `f1e7bee` (byte-identical to `09727ef` for both files). Evidence
lines are at the same revision. "HAP" is `@homebridge/hap-nodejs` 2.2.2,
`dist/lib/Characteristic.js`.

A read-only probe of the real HAP package (session scratch directory, not in the repository)
checked three HAP claims:

- With an `async` handler, a microtask queued inside it runs before HAP's catch stores the status.
  With a synchronous handler that throws, HAP's catch runs first: the microtask sees `-70412`.
- A later accepted write returns a stored status to `0` (`-70412`, then `0`).
- `updateValue` with an `Error` stores a status (`-70412`) instead of returning it to `0`.

The FALSE rows give the fix. Each fix says less: it keeps the reason the code needs and drops the
detail that was not exactly true.

### `src/accessories/controls.ts`

| Location | Claim | Evidence | Result |
| --- | --- | --- | --- |
| 8 | The one place a HomeKit write reaches the vendor. | The only `.send(` call in `src` is 614 (`grep -rn "\.send(" src`). | TRUE |
| 10-12 | Every other flow is vendor to HomeKit; this module is the only path back. | No `onSet`, `onGet` or `on('set'` outside this file in `src` (grep). | TRUE |
| 12-13 | Where a controller can cause a physical action for the first time. | - | rationale |
| 13-14 | Two capabilities exist. | `DeviceCapability = 'self-test' \| 'alarm-mute'` (`family.ts:24`). | TRUE |
| 14 | Only `true` is ever requested. | 614 sends `acceptedValueOf` (246-248); `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE = true` (`alarmMute.ts:37`). | TRUE |
| 14-16 | The wire body is built behind the port; nothing here knows Gemini names. | `send(deviceId, capability, accepted)` (614); type-only imports from the family and the port (58-61). | TRUE |
| 18-20 | The binder attaches to the Switch `ensureService` answers: cached or just added. | The only `bind` call is `bindControlRow` in `publishRows`, with the service `ensureService` answered (`basementGuardian.ts:698-706, 731-739`; `serviceCatalogue.ts:926-933`). | TRUE |
| 20-21 | So one service list keeps feeding subtypes, names, descriptors. | The binder adds no service. | rationale |
| 23-24 | Both behaviours were read from the pinned package's source. | - | rationale |
| 26-27 | A rejected write never moves the stored value. | HAP 1805-1832: `this.value` is assigned only on success. | TRUE |
| 27-29 | HAP assigns the status after the handler throws, so an earlier push could not clear it. | HAP 1787 (reset on entry), 1818-1832 (assigned in the catch). | TRUE |
| 30-31 | Every later read answers that status until something pushes a value. | A later accepted write also returns it to `0` (HAP 1787, 1806; probe). | FALSE: now "later reads answer that status until a push or an accepted write clears it" |
| 31-32 | Left alone, one refused press makes the Switch unreadable until the next poll. | A poll pushes no `On` while the row withholds it (pending or doubtful scope, `serviceCatalogue.ts:329-335, 541-545`) or in the unresolved-family branch (`basementGuardian.ts:1012`, decoded `undefined`). | FALSE: now "can keep the Switch unreadable long after the press" |
| 32-34 | Every refusal arms a clearing push, a macrotask through the timer port. | 468-470 (restored); 542-546 through 562 and 581. | TRUE |
| 34-36 | A microtask queued inside the handler runs before HAP's catch assigns the status (said of every refusal). | True for the binder's `async` handler (587, 638). The restored handler throws synchronously (467-474), so HAP's catch runs first (HAP 1805, 1818; probe). | FALSE: now limited to "the binder's asynchronous handler" |
| 38-39 | With a handler on `On`, `setCharacteristic` routes through the write path. | `setValue` calls `handleSetRequest`, which calls the set handler (HAP 1590-1612, 1800-1805). | TRUE |
| 39-41 | Every writer of `On`, here and in each caller, uses `publishValue`. | 418; `basementGuardian.ts:631-634, 741-743`; `setCharacteristic` only on `AccessoryInformation` (`basementGuardian.ts:457-460`); `staleMarking.ts` pushes `StatusActive` only (107-111). | TRUE |
| 43 | The binder is not the only write handler this module owns. | 459-475. | TRUE |
| 43-45 | A restart the cloud never answers restores the Switches long before any accessory exists. | `configureAccessory` (`platform.ts:661-672`); accessories are built only from `onTrustworthyInventory` (`platform.ts:611-613`). | TRUE |
| 45-46 | HAP answers a write with no handler by storing the value and reporting success. | HAP 1868-1872. | TRUE |
| 46-48 | So the toggle flips, an automation fires, and nothing happened. | - | rationale |
| 48-50 | The refusal carries the transport rule's status and cause. | 364 against 471 and 473. | TRUE |
| 50 | The binder's own handler replaces it on the first publish. | The unresolved-family branch republishes and returns without `publishRows` (`basementGuardian.ts:991-1015`); only `publishRows` binds (739). | FALSE (044): now "replaces the refusal when the accessory's publish pass binds the control row, which happens only once the device's family resolves" |
| 51-52 | A set handler is a single slot in HAP. | HAP 1346-1352. | TRUE |
| 63 | Everything the binder needs, by injection. | 64-137, 484. | TRUE |
| 68-69 | Timers are scheduled on the write path only; a confirming report only cancels a deadline that path scheduled. | `setTimeout` only at 543 and 609 (`answerWrite`); `clearTimeout` at 514 with the handle from 609. | TRUE |
| 71-72 | The push has to run after HAP's catch has stored the status. | HAP 1818-1832. | TRUE |
| 72 | "which is the next macrotask and no earlier" | HAP's catch runs in a microtask of the same task, and a microtask queued after it would also land later (probe). | FALSE: now "a microtask queued inside the binder's asynchronous handler runs before that catch" |
| 72-74 | The port lets a test read back the delay. | - | rationale |
| 78 | The device every command is addressed to. | 614. | TRUE |
| 81 | Whether the configured run of disconnected polls is reached. | `basementGuardian.ts:587-589`. | TRUE |
| 83-85 | Answered from the same count as `ProjectionInput`, so the two cannot disagree. | One function (`basementGuardian.ts:587-589, 614, 664`). | TRUE |
| 89 | Whether the plugin has a proven way to reach the vendor. | `accountRuntime.ts:610-612`. | TRUE |
| 91 | A fact about the plugin, not the device. | The per-device struct copies the account value (`accountRuntime.ts:634, 645-648`). | TRUE |
| 91-94 | The route can be missing while a reported value is held, so the rule names its own cause. | A failed poll leaves `lastDecoded` as it was; 364 has its own cause. | TRUE |
| 96-97 | Answered from the account-wide trust, and no row reads it. | `basementGuardian.ts:594-596`; rows read the other three members (`basementGuardian.ts:324-334`). | TRUE |
| 97-99 | One failed poll clears it and withdraws no row's trust. | `accountRuntime.ts:788-790`; two failures withdraw trust (`accountRuntime.ts:602-609`). | TRUE |
| 101-102 | `reported` is answered through the rule that decides whether the row may publish it. | `basementGuardian.ts:571-573`; `serviceCatalogue.ts:329-335, 541-545`. | TRUE |
| 103-104 | "they are one stored value read through one rule" | The unresolved-family branch hands the rows `undefined` (`basementGuardian.ts:1012`) while `reported` reads `lastDecoded`; one rule withholds both. | FALSE: now "one rule decides both" |
| 106-107 | If they could disagree, a press would be refused beside a tile showing the state. | - | rationale |
| 107-110 | The quoted WR-02 case reads the write path's answer. | Title at `basementGuardian.test.ts:2848`. | TRUE |
| 114 | Whether the live path can carry the confirmation. | `basementGuardian.ts:603-605`. | TRUE |
| 116 | A fact of its own. | - | rationale |
| 117-121 | The window is shorter than a poll interval, which may be an hour. | 209 (30 s); `config.ts:25` (300 to 3600 s). | TRUE |
| 123-126 | An accepted press would expire with a warning; the duplicate rule would judge an old reading. | Rechecked in rounds 1 to 7. | rationale |
| 130 | Republishes the control rows, and only those. | The accessory's callback republishes nothing while credentials are rejected (`basementGuardian.ts:684-687`). | FALSE: now "Republishes no more than the control rows." |
| 132-134 | Nothing else changed; a full republish would strain the "cannot interleave" claim. | The claim exists (`basementGuardian.ts:96-103`). | rationale |
| 142 | The capabilities with an unresolved request. | 626-628. | TRUE |
| 144-146 | `ProjectionInput` is the only route requested state reaches a row; it never becomes canonical. | `basementGuardian.ts:985, 1012, 1060`; `serviceCatalogue.ts:544`; this module writes no store. | TRUE |
| 150 | Attaches to a Switch the catalogue already published. | 739 runs after `ensureService` (731). | TRUE |
| 152 | A second call registers no second handler. | 631-635. | TRUE |
| 153-154 | A later `onSet` replaces the earlier one without a warning. | HAP 1346-1352. | TRUE |
| 155-156 | The accessory walks its whole catalogue on every update. | Both `update()` branches loop over the catalogue (`basementGuardian.ts:721-748, 776-791`). | TRUE |
| 158-160 | `reported` is the last report, or `undefined` when the row may not publish it. | `basementGuardian.ts:550-555, 571-573`; `serviceCatalogue.ts:258-266`. | TRUE |
| 164-169 | `reconcile` clears on a match; with no entry it is a no-op. | 641-645, 507-516. | TRUE |
| 174 | Everything the restored refusal needs, by injection. | 175-199. | TRUE |
| 179 | Timers serve the clearing push and nothing else. | Only 468. | TRUE |
| 181-183 | "for the same reason: ... which is the next macrotask and no earlier" | The restored handler throws synchronously, so HAP's catch stores the status before any microtask it queued (probe). | FALSE: now "The same port the binder takes: the push has to land after HAP's own catch has stored the refusal status" |
| 186 | The restored Switch the refusal is attached to. | `staleMarking.ts:132`. | TRUE |
| 189 | The accessory the service came back on. | `accessoryName: accessory.displayName` (`staleMarking.ts:132`). | TRUE |
| 191-194 | The restart passes read nothing from the context; an older cache names no device. | `staleMarking.ts:107-111, 129-134`; `platform.ts:247-249`. | TRUE |
| 194-196 | A multi-pump account needs a name, as the binder's line does. | 554-560. | rationale |
| 202 | How long a request waits for a confirming report. | 609-611. | TRUE |
| 204 | The observed self-test lasts about sixteen seconds. | `.planning/intel/constraints.md:539`. | TRUE |
| 204-206 | A window wide enough, not a guess. | - | rationale |
| 206-207 | When it closes the row resumes projecting reported state; nothing is retried. | 533-540; `serviceCatalogue.ts:544`. | TRUE |
| 211-212 | One request: the value and the deadline handle. | 213-216, 607-612. | TRUE |
| 218-220 | Every fact is sampled once, before the first rule. | 589-597. | TRUE |
| 223, 229 | `accepted` is the one value; `pending` is an earlier waiting request. | 588, 596. | TRUE |
| 233-235 | A local refusal's parts; nothing reaches the network. | 600 and 561-566 run before 614. | TRUE |
| 235-236 | A press the official client refuses never operates a pump. | D-07, CTRL-03. | rationale |
| 243-245 | The accepted value and the sent value move together. | 588, 614. | TRUE |
| 250-253 | Anything else is a cancel or an unmute; the vendor offers neither. | D-018, D-019. | rationale |
| 258-260 | "no proven way to reach the vendor at all: the runtime is stopped, authentication has halted for good, or the last poll did not succeed" | Not exhaustive: the accessory starts unready until its first trust push (`basementGuardian.ts:506-514`), and the runtime calls `onTrustworthyInventory` before `recordPollSuccess` (`accountRuntime.ts:459, 1028, 1112`). | FALSE: now "for example because" |
| 260-262 | Sending buys a round trip into a failed route that lands as a vendor error. | Same reasoning as `accountRuntime.ts:602-609`. | rationale |
| 262-265 | A fact about the plugin that fails independently of the live-path fact. | The transport reads `polling` (`accountRuntime.ts:610-612`); the live fact reads the device's shadow silence (`basementGuardian.ts:603-605`). | TRUE |
| 270-271 | The wait closes long before the next poll. | 30 s against at least 300 s (`config.ts:25`). | TRUE |
| 272-274 | Sending would operate a pump and then warn falsely. | - | rationale |
| 279-280 | No reported value: the field did not decode, or the scope is doubtful. | As 158-160. | TRUE |
| 280-282 | Acting would operate a pump on a guess. | - | rationale |
| 282-284 | The same status as a confirmed-offline device. | 366-367. | TRUE |
| 289-292 | The official client disables both commands only when offline; refusing avoids a blocked HomeKit. | D-018 (`decisions.md:438-447`). | rationale |
| 294-298 | No refusal rule reads an equipment fault. | `ControlRequest` (221-231) has no fault field. | TRUE |
| 303-305 | The press is a duplicate; the official client and CTRL-03 refuse it. | 307; D-07. | TRUE |
| 310-312 | Only one request per control can wait. | One `Map` entry per capability (497) and the pending rule (369). | TRUE |
| 313-314 | Nothing is sent; the earlier request keeps its window. | 600 runs before 607. | TRUE |
| 323-324 | Declared once because two refusals answer it. | 364, 471. | TRUE |
| 324-327 | A restart the cloud has not answered is the same condition; two wordings would blur it. | Before the first inventory `polling` is `false` (`accountRuntime.ts:354, 610-612`). | TRUE |
| 330-331 | Declared beside the other so the table reads as a table. | - | rationale |
| 331-333 | The cause names the connection and nothing else. | Literal at 334. | TRUE |
| 336-337 | The first rule that applies answers the write. | 373 (`find`). | TRUE |
| 339-346 | Any two of the three can hold; the order decides the cause; a unit case pins it. | Test 1175-1193. | TRUE |
| 348-356 | The quiet rule sits between; the transport rule comes first; the quiet path blocks any capability; both answer one status. | 362-370. | TRUE |
| 358-361 | The pending rule comes last and answers only an otherwise-unrefused press. | 369. | TRUE |
| 376-377 | A log line and an Eve-class controller read true; Apple Home shows a generic failure. | 378-380; D-04. | rationale |
| 382-385 | A vendor error says "did not take effect"; a timeout claims no outcome. | 386-390. | TRUE |
| 392-394 | Only a `HapStatusError` is thrown; a plain `Error` becomes a communication failure with a warning. | 395-397; HAP 1828-1830. | TRUE |
| 399-400 | The value HAP is serving, read back. | 401-403. | TRUE |
| 405 | The push returns the stored status to `0`. | HAP 1650. | TRUE |
| 407 | "The republish re-asserts what the control rows may currently publish." | Under a refused credential the accessory's callback re-asserts nothing (`basementGuardian.ts:684-687`); the restored refusal passes `nothingToRepublish`. | FALSE: now "re-asserts no more than the control rows" |
| 407-410 | A row publishes `On` only while decoded, not doubtful and not pending. | `serviceCatalogue.ts:329-335, 541-545`. | TRUE |
| 410-411 | The push publishes the reported value when there is one. | 418. | TRUE |
| 413-414 | "HAP returns a stored status to `0` whatever value it is given" | An `Error` value stores a status instead (HAP 1627-1633; probe). | FALSE: now "still returns the stored status to `0`" |
| 421-422 | "A restored service belongs to no accessory yet, so there are no control rows to re-assert" | For an unresolved family the accessory and its rows exist while the refusal stays (`basementGuardian.ts:1012`). | FALSE: now "The restored refusal is handed no rows to re-assert" |
| 422-423 | The push alone is what the refusal needs. | 415-419. | rationale |
| 425 | "no accessory exists to publish rows from" | As 421-422. | FALSE: now "the restored refusal is handed no rows to re-assert" |
| 429-430 | Refuses every press "until an accessory exists to route it". | As 50. | FALSE (044): now "until the accessory's publish pass binds the control row, which happens only once the device's family resolves" |
| 432-434 | The RES-04 window is unbounded; no binder exists until the first REST inventory. | `basementGuardian.ts:658`; `platform.ts:611-613`. | TRUE |
| 435-437 | With no handler HAP stores the value and answers success. | HAP 1868-1872. | TRUE |
| 437-438 | Nothing reaching the vendor is correct; the owner is told. | - | rationale |
| 440-442 | "because the condition is the transport rule's own: the plugin has no proven way to reach the vendor" | For an unresolved family the refusal stays while `commandTransportReady` is `true` (R7 probe; `accountRuntime.ts:610-612`). | FALSE (044): now names the window the refusal exists for and adds that it stays, with the same line, while a cached accessory's family does not resolve |
| 442-443 | One condition, one status, one wording. | - | rationale |
| 446-447 | HAP "answers it to every later read". | A later push returns it to `0` (HAP 1650), for example the publish pass. | FALSE: now "answers it to later reads" |
| 447-451 | Apple Home draws "No Response"; reserved for a refused credential; a restart clears itself when a poll succeeds. | D-10; `decisions.md:687`; `accountRuntime.ts:781-785`. | rationale |
| 451-453 | "HAP returns a stored status to `0` whatever value it is given" | As 413-414. | FALSE: now "a push of that value still returns the stored status to `0`" |
| 455-457 | No read handler here or anywhere in this tier. | No `onGet` in `src` (grep). | TRUE |
| 462-463 | HAP warns when both exist and ignores the listener. | HAP 1800-1803. | TRUE |
| 463-465 | The binder's handler "takes it over on the first publish". | As 50. | FALSE (044): now "when the accessory's publish pass binds the control row" |
| 465-466 | "a recovered plugin operates its controls normally" | Not for an unresolved family (`basementGuardian.ts:991-1015`). | FALSE: dropped |
| 478, 480-481 | Builds the write half; registers nothing until `bind`, called with a published service. | 483-498; `basementGuardian.ts:739`. | TRUE |
| 486-491 | The entry's lifetime, value and handle. | 607-612, 577-579, 642-644, 533-536. | TRUE |
| 493-496 | One binder per accessory, one entry per capability, no shared state. | `basementGuardian.ts:658`; `platform.ts:211-222`; 497-498. | TRUE |
| 500-506 | Drops and cancels; idempotent with the expiry; covers an in-flight report. | 510-516, 534-536; test 794-818. | TRUE |
| 518-520 | "the control rows republish so the Switch shows the reported value again wherever its row may publish one" | Under a refused credential `republish` does nothing (`basementGuardian.ts:684-687`; lead S-05-24). | FALSE: now "the binder calls `republish`" |
| 522-524 | Nothing is retried. | 533-540. | TRUE |
| 524-528 | `StatusActive` reports vouching, which a failed field, a lost monitoring path or a lost link can make false. | `serviceCatalogue.ts:235-249, 280-282`. | TRUE |
| 530 | "The republish is the control rows alone" | As 130. | FALSE: now "no more than the control rows" |
| 530-532 | Nothing else changed; a timer-driven full republish would strain the interleave claim. | - | rationale |
| 548-550 | Nothing is sent; no new entry; the push is armed before the throw. | 561-566. | TRUE |
| 550-552 | HAP answers the status "to every later read until something pushes a value". | As 30-31. | FALSE: now "to later reads until a push or an accepted write clears it" |
| 554-555 | The line names the device, the capability and a cause only. | 563. | TRUE |
| 555-560 | The `deviceId` form and D-027. | D-027. | rationale |
| 568-575 | Nothing is retried; a vendor error ends the request; a timeout keeps it. | 576-585. | TRUE |
| 603-606 | The row withholds `On`; the entry is created before the send, with a deadline. | `serviceCatalogue.ts:544`; 607-614. | TRUE |
| 620-622 | Accepted: nothing pushed; HAP keeps the written value; the entry stays. | HAP 1815-1817; 616-623. | TRUE |
| 636-637 | `onSet`, because HAP warns and ignores the listener when both exist. | HAP 1800-1803. | TRUE |

### `test/accessories/controls.test.ts`

| Location | Claim | Evidence | Result |
| --- | --- | --- | --- |
| 8 | Tests control writes and refusal diagnostics. | Both `describe` blocks. | TRUE |
| 30-31 | A fresh outcome per call; a local refusal never reaches it. | 32-34; `controls.ts:600` runs before 614. | TRUE |
| 36-37 | The statuses are written out so a drifted mapping fails. | Values match HAP's `HAPStatus`. | TRUE |
| 44-45 | "a service and its characteristics live on the service that added them" | The services here are standalone objects each case builds (124-126, 1428, 1450); a characteristic lives on the service that carries it (`features/lib/hap.ts:452-480`). | FALSE: now "each case builds its own services, and a characteristic lives on the service that carries it" |
| 48-49 | The stand-in "answers the members the plugin reads and nothing else". | It carries `HAPStatus.SUCCESS`, which no `src` file reads (`features/lib/hap.ts:73-79`; grep). | FALSE: now "carries only part of the real namespace" |
| 52-54 | The stand-in service "answers the members the code under test reads and nothing else". | It carries `setCharacteristic`, `addCharacteristic`, `UUID`, `subtype` and `characteristics`, which neither `controls.ts` nor `publishValue` reads (`features/lib/hap.ts:422-434`). | FALSE: now "carries only part of a real `Service`" |
| 53-54 | The one place a stand-in service is widened. | `as unknown as` only at 50 and 56. | TRUE |
| 59, 66, 69, 87, 93-94 | The deferral record, the log stand-ins and the recording timers. | 60-115. | TRUE |
| 110 | The code under test arms no interval. | No `setInterval` in `controls.ts`. | TRUE |
| 117-119 | A case that promises which commands were sent takes a strict mock. | Every such case builds `mock<CommandPort>` (for example 629, 662, 732, 1020, 1054, 1447). | TRUE |
| 161 | The cases that take this default do not read the republish. | The four that do pass their own (669, 910, 1307, 1369). | TRUE |
| 166 | Most `createControlBinder` cases start from it. | - | TRUE |
| 176 | The clearing push is told apart by its delay. | `controls.ts:543-545` (0) and 609-611 (30000). | TRUE |
| 181-182, 193 | `writeRejection` and the spy record. | 183-196. | TRUE |
| 198-199 | The stand-in converts a thrown error to a bare status. | `features/lib/hap.ts:325-332`. | TRUE |
| 210 | "The eight refusals one write against an idle control can meet" | The duplicate row (307-319) presses a control that reads active; the source calls a control that is not running idle (`controls.ts:281`). Considered and not filed in earlier rounds; reclassified here by the domain word. | FALSE: now "one write can meet while no earlier request waits" |
| 210-211 | Six local and two vendor refusals. | 241-320, 322-351; `CommandFailure` has two members (`commandPort.ts:22`). | TRUE |
| 211-213 | The local rows follow the table order and set one condition each. | `controls.ts:362-370`. | TRUE |
| 213-218 | The precedence cases pin the order; the pending press has its own case; the loops read these rows. | 435-561, 729-759, 1007-1139. | TRUE |
| 226, 231, 235-236 | Row field descriptions. | 219-239. | TRUE |
| 355-356 | One write through the given port, with everything read back. | 357-381. | TRUE |
| 383-386 | The cause texts are written out; they match the module. | `controls.ts:328, 334, 366`. | TRUE |
| 391 | "The facts the gate reads for one write." | The gate also reads whether a request waits (`controls.ts:596`), which `GateConditions` does not hold. | FALSE: now "The facts a case sets on the gate for one write." |
| 391-393 | A clear gate sets no refusal condition. | 402-404. | TRUE |
| 406-407 | "whose gate reads every fact from `gate`" | The written value comes from the case (1266, 1289) and the pending fact from the binder. | FALSE: now names the four facts it reads from `gate` |
| 420-423 | Fixed order; one pair per row; fresh state and active cannot hold together. | `controls.ts:373`. | TRUE |
| 427 | The row's conditions are set on a clear gate. | 1262, 1286. | TRUE |
| 433-434 | The pairs one write can carry, but for three with their own cases. | 11 rows plus 1178, 1217 and 1240 make the 14 pairs. | TRUE |
| 515-517 | The pending rule against each rule that can hold with it. | 518-561; 1277-1298. | TRUE |
| 563-565 | Thirty seconds against about sixteen. | `controls.ts:209`; `constraints.md:539`. | TRUE |
| 568 | The window is told apart by its delay. | 569-571. | TRUE |
| 573-575 | The accessory name is all the identity the refusal has. | As source 191-194. | TRUE |
| 583-585 | Most restored cases start from it; the refusal takes no command port. | `controls.ts:175-199`; 1538-1563 builds its own. | TRUE |
| 600-602 | The read is the difference between a marked tile and a greyed-out one. | D-10. | rationale |
| 602-604 | HAP's read is asynchronous and rejects; the stand-in throws at once. | HAP 1683, 1729-1731; `features/lib/hap.ts:341-345`. | TRUE |
| 613-615 | The held value is always the other one. | 621-624. | TRUE |
| 763, 796 | The promise constructor assigns its resolver synchronously. | ECMAScript `Promise` executor. | TRUE |
| 934-935 | The reported value changes between the refusal and the push. | 943-945. | TRUE |
| 954-956 | A row withholds `On` while a request waits; the push replaces the held `true`. | `serviceCatalogue.ts:544`; `controls.ts:418`; D-037. | TRUE |
| 984-987 | With no reported value the push falls back to the held value. | `controls.ts:418`. | TRUE |
| 1063 | Every deferral runs, so any send reaches the strict mock. | 1064-1066. | TRUE |
| 1106 | "HAP converts any error but a `HapStatusError` to a communication failure" | A thrown status number keeps its status (HAP 1819-1823; `features/lib/hap.ts:279-281`). | FALSE: now "a plain `Error`" |
| 1106-1109 | HAP warns with the message; the stand-in converts the same way. | HAP 1828-1830; `features/lib/hap.ts:283`. | TRUE |
| 1175-1177, 1195-1196, 1214-1216, 1237-1239 | Each named precedence case and its reason. | `controls.ts:339-356`. | TRUE |
| 1356-1357 | Nothing is retried when the window closes. | `controls.ts:533-540`. | TRUE |
| 1390-1391 | Whichever runs first wins. | `controls.ts:507-516, 533-536`. | TRUE |
| 1440-1441 | One binder per accessory; no state outside the closure. | `basementGuardian.ts:658`; `controls.ts:497-498`. | TRUE |
| 1482-1483 | The same cause "because it is the same condition". | The refusal stays while a cached accessory's family does not resolve and the transport is ready (`basementGuardian.ts:991-1015`). | FALSE: now names the window the refusal exists for |
| 1483-1484 | One condition with two wordings is what the table prevents. | - | rationale |
| 1507 | The refused characteristic "answers its status to every later read". | A later push returns it to `0` (HAP 1650; `features/lib/hap.ts:522`). | FALSE: now "answers its status to later reads" |
| 1507-1510 | "No Response"; reserved for a refused credential; a restart clears itself. | D-10. | rationale |
| 1536-1537 | The restored handler is called directly for the same reason. | 1106-1109. | TRUE |
| 1577-1579 | The push carries the held value; both values are driven. | `controls.ts:469`; 1580-1594. | TRUE |
| 1596-1598 | A publish would also clear the status. | `features/lib/hap.ts:522`. | TRUE |

Totals:

- `src/accessories/controls.ts`: 136 rows. 89 TRUE, 22 FALSE, 25 rationale. Every FALSE claim is
  fixed in the 044 commit.
- `test/accessories/controls.test.ts`: 54 rows. 42 TRUE, 9 FALSE, 3 rationale. Every FALSE claim is
  fixed in the test commit (second CR-05-CONTROLS-044 row).
