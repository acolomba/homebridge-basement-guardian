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
