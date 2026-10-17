---
phase: 05-accessories-conformance
batch: CONTROLS
review_round: 4
reviewed: 2026-10-17T21:12:00Z
depth: deep
source_revision: 3605e598f06f8c3068e102dc777272f5f810ce12
files_reviewed: 2
files_reviewed_list:
  - src/accessories/controls.ts
  - test/accessories/controls.test.ts
findings:
  blocker: 1
  warning: 2
  total: 3
status: issues_found
reviewer: gsd-code-reviewer (correction round 4)
---

# Phase 5 CONTROLS batch: correction round 4

I read every line of both files in full at `3605e598f06f8c3068e102dc777272f5f810ce12`. Before I
started, `git rev-parse HEAD` printed that revision and `git status --porcelain` printed nothing.
Since round 3 (`207d546`), only three commits touched `src`, `test` or `features`: `946be0e` and
`a1be90c` (`src/accessories/controls.ts`) and `eb503e5` (`test/accessories/controls.test.ts`). The
diff of both files from `207d546` to HEAD has no non-comment line.

I used these inputs:

- AGENTS.md;
- the three `.agents/skills` books, each `SKILL.md` with every `rules/*.md` file (they win over
  `.claude/rules/*.md`);
- `05-CONTEXT.md` and `05-REVIEW-PROTOCOL.md` in full; the CONTROLS rows of `05-FINDINGS.md`
  (findings, counter rows for rounds 0 to 3, genuine bug histories, `### 05-04`);
  `05-CONTROLS-REVIEW.md` and `-R1.md` to `-R3.md` (findings, candidates not filed, triage,
  repair history);
- D-037 and D-038 (`.planning/intel/decisions.md:787-830`), CTRL-03 and CTRL-05
  (`.planning/milestones/v1.0-REQUIREMENTS.md:67, 69`), the WR-02 case
  (`test/accessories/basementGuardian.test.ts:2836-2895`, read only);
- `features/lib/hap.ts` (`StandInCharacteristic`, 286-348) and
  `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1786-1830` (`handleSetRequest`);
- the consumers the findings depend on: `src/accessories/serviceCatalogue.ts:227-282`
  (`SEEING_LESS_REASONS`, `isRowTrusted`, `isRowPublishable`, `isRowFullyTrusted`), 329-335
  (`trustedGroup`), 528-545 (`controlValues`); `src/accessories/basementGuardian.ts:325-376`
  (`monitoringDegradedScopes`, `distrustReasonsOf`), 545-605 (`decodedControlValue`,
  `reportedControlValue`, the gate facts), 641-760 (the binder wiring, `publishRows`);
  `src/accessories/staleMarking.ts:120-134`.

Opening open set: 2. Confirmed fixed: 2. Still open: 0. Reopened: 0. New: 3 (1 BLOCKER, 2
WARNING). Closing: 3.

## Round status

### Opening IDs

- **CR-05-CONTROLS-037** fixed (`946be0e`, `a1be90c`).
  - `commandTransportReady` JSDoc (89-92): the two-fact split, both examples and "half the time"
    are gone. The paragraph now says that the route can be missing while a reported value is held,
    so the transport rule names its own cause. That is true: `hasNoCommandTransport` (259-261) is
    row 2 and answers before the fresh-state row.
  - `clearRefusal` note (398-406): the claim that a waiting request always pushes the reported
    value is gone. The note says the push publishes the reported value when there is one and the
    held value otherwise, which is `reported ?? heldOn(hap, service)` (410).
  - The order note (329-354): the paragraph `a1be90c` restated says the transport rule is
    evaluated first of the three, and that the quiet live path is named over a missing value
    because `confirmationObservable` is one fact for every capability of the binder (585), while
    `reported` belongs to one bound capability (620). Both rows answer
    `notAllowedInCurrentState` (358-359). The claim "during that silence the state is not missing"
    is gone.
  - A search of the source for "the other half", "the one case", "third fact", "middle rules" and
    "half the time" finds nothing.
  - The same comments still carry a defect of a different kind. `clearRefusal` says that a row
    publishes `On` "only while it can vouch for the reported value" (401). That is a new cause,
    CR-05-CONTROLS-039, and not a reopen: the waiting-request claim that 037 named did not
    return.
- **CR-05-CONTROLS-038** fixed (`eb503e5`).
  - The comment above 'names the missing transport alone when the plugin has neither fresh state
    nor a way to send' (1115-1117) no longer says that the `PRECEDENCE` cases pin the other pairs.
  - The `PRECEDENCE` comment (433-434) names the three pairs it does not hold. I counted the
    pairs: 15 pairs of the six one-write rules, less fresh state with an active reading, gives 14.
    That is the 11 rows at 435-513 plus 1118, 1158 and 1183.
  - The fixer also reflowed the comment at 1178-1182. It is the subject of a new cause,
    CR-05-CONTROLS-040, and not a reopen: no pair count returned.

### Earlier fixed IDs

All 36 are still fixed. None reopened. Every fix commit in the dispatch is an ancestor of HEAD
(`git merge-base --is-ancestor`, all exit 0). Since round 3, both files changed only in comments,
so every non-comment check from round 3 still holds. I re-read each anchor at HEAD:

- **CR-05-CONTROLS-001** still fixed: 'ignores a confirming report that lands after the window already closed' (1335-1351) compares the whole `warnings` array. No `.length` assertion is in the file (the one `.length` at 100 is the stub's handle).
- **CR-05-CONTROLS-002** still fixed: `describe('createControlBinder')` (626-1405) and `describe('bindRestoredControlRefusal')` (1407-1564), top level, not nested.
- **CR-05-CONTROLS-003** still fixed: no "microtask" in the file. `hapWriteFidelity.test.ts` keeps the protection (D-13).
- **CR-05-CONTROLS-004** still fixed: 823-836 spy with `t.mock.method(characteristic, 'onSet')`. Each `.bind(` hit (171, 831, 832, 1063, 1372, 1394) is `ControlBinder.bind`.
- **CR-05-CONTROLS-005** still fixed: `// act & assert` only at 1066 and 1494, each over one `assert.rejects()`.
- **CR-05-CONTROLS-006** still fixed: `as unknown as` only at 50 (`HAP_NAMESPACE`) and 56 (`asService`), both commented (D-11).
- **CR-05-CONTROLS-007** still fixed: the order note (329-354) is directly above `const LOCAL_REFUSALS` (355).
- **CR-05-CONTROLS-008** still fixed: `pending` (223), `isAwaitingConfirmation` (308-310) and its row (362), `pending: requested.has(capability)` (586). The regression case (729-759) passes. See CR-05-CONTROLS-041: a separate gap in the cases, not the return of the defect. A probe shows the binder refuses a second press while the first is still being sent.
- **CR-05-CONTROLS-009** still fixed: `refuseOutcome` calls `resolvePending` only for `vendor-error` (567-569). 761-790, the row at 347 and the row at 840 expect pending `['self-test']`.
- **CR-05-CONTROLS-010** still fixed: `PRECEDENCE` (11 rows) and `PENDING_PRECEDENCE` (6 rows) run at 1200-1241. With 1118, 1158 and 1183, every single-write pair that can hold together has a case.
- **CR-05-CONTROLS-011** still fixed: 991-1020 runs every deferral, compares `{ thrown, pending, delays, cancelled }` and calls `verify(commands)`.
- **CR-05-CONTROLS-012** still fixed: 703-727 compare `{ pending, cancelled }`.
- **CR-05-CONTROLS-013** still fixed: 838-873 and 1243-1269 record `republish` before and after the push.
- **CR-05-CONTROLS-014** still fixed: 877-893 and 1542-1563 change the value between the refusal and the push.
- **CR-05-CONTROLS-015** still fixed: `RESTORED_PRESSES` (621-624) drive 1408-1477.
- **CR-05-CONTROLS-016** still fixed: 1050-1079 and 1481-1506 assert `instanceof HAP.HapStatusError` and `hapStatus`.
- **CR-05-CONTROLS-017** still fixed: no `// act` block holds an `assert.` call.
- **CR-05-CONTROLS-018** still fixed: `readOfSwitch` (605-611) awaits inside its `try`. Every caller awaits it.
- **CR-05-CONTROLS-019** still fixed: 947-955, one `test()` per row.
- **CR-05-CONTROLS-020** still fixed: 146-150 state the single slot with no replacement warning (`Characteristic.js:1801-1803` warns only about ignored `on('set')` listeners).
- **CR-05-CONTROLS-021** still fixed: 100-104 quote the WR-02 title in the present tense. 316-321 have no "now".
- **CR-05-CONTROLS-022** still fixed: 1154-1157 and 1178-1182 name "the quiet-live-path rule". No narration of removed code.
- **CR-05-CONTROLS-023** still fixed: each case that promises sends makes `mock<CommandPort>({ exactParams: true, name: 'commands' })` inside the case and calls `verify(commands)` last. No `anyTimes`, `It.isAny` or `recordingCommands`.
- **CR-05-CONTROLS-024** still fixed: `acceptedOutcome()` (32-34) and per-row factories. `RefusalCase` fields are `readonly`.
- **CR-05-CONTROLS-025** still fixed: D-01 header at `controls.ts:1-52` (Header inspection).
- **CR-05-CONTROLS-026** still fixed: 26-29 and 329-330.
- **CR-05-CONTROLS-027** still fixed: 87.
- **CR-05-CONTROLS-028** still fixed: 109-111 and 158-162 are block bodies.
- **CR-05-CONTROLS-029** still fixed: 686 and 984-987 compare whole delay lists.
- **CR-05-CONTROLS-030** still fixed: the five named comments match the file. The only position words in the test (1156, 1181) name rows of the rule table.
- **CR-05-CONTROLS-031** still fixed: `function noop(): void` at 68 and 86.
- **CR-05-CONTROLS-032** still fixed: 478-483, 538-539 and 610-612.
- **CR-05-CONTROLS-033** still fixed: `outcomeWarning` (379-383). The test expects the timed-out line at 339, 786 and 804.
- **CR-05-CONTROLS-034** still fixed: no duplicate case. "quotes nothing else" is not in the file.
- **CR-05-CONTROLS-035** still fixed: "the other half" and "the one case" are not in the source.
- **CR-05-CONTROLS-036** still fixed: 895-923 is unchanged and passes.

Reopened: none.

## Findings

### CR-05-CONTROLS-039 - WARNING: Source comments state the accessory's trust rules wrongly: what `undefined` means, when a row publishes `On`, and what `StatusActive` means

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments describe what the code does, as it stands; Prose: "Use the domain word the code uses"); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation. Batch precedent: CR-05-CONTROLS-030, 032, 035 and 037 each grouped one class of comment in one file into one cause.
**Location:** `3605e598f06f8c3068e102dc777272f5f810ce12:src/accessories/controls.ts:152-153, 272-276, 400-402, 516-518`
**Issue:** The catalogue has two trust rules with defined words.

- `isRowTrusted` "answers whether a row can still vouch for what it publishes". Every reason
  counts, the seeing-less reason `'unreachable'` included, and `StatusActive` reports it
  (`serviceCatalogue.ts:229-246, 280-282`).
- `isRowPublishable` "answers whether a row may publish what arrived, which is a different
  question from whether it can vouch for it". It ignores `'unreachable'`
  (`serviceCatalogue.ts:248-266`).

The control rows tolerate no reason (`serviceCatalogue.ts:816, 825`). `controlValues` reads
through `trustedGroup`, which is `isRowPublishable` (329-335, 541-545). The accessory answers
`reported` through the same rule (`basementGuardian.ts:572-574`). Four comments in the binder
contradict this:

- **152-153 (`bind` JSDoc)** says that `reported` is `undefined` "when the scope owning it did
  not decode". **272-276 (`hasNoFreshState`)** starts "The capability's own reported field has not
  decoded". `reported` is also `undefined` when the field decoded and the scope is withdrawn as
  doubtful. A lost controller link sets `'controller-link-lost'` on every non-connectivity scope
  (`basementGuardian.ts:369-375`). That reason is not seeing-less, so `isRowPublishable` is
  false and `reportedControlValue` answers `undefined` for a field that decoded.
- **400-402 (`clearRefusal`)** says "The republish re-asserts what the control rows can currently
  vouch for. A row publishes `On` only while it can vouch for the reported value". That is the
  marking rule's word for the withholding rule. During shadow silence the control scopes carry
  `'unreachable'` (`basementGuardian.ts:325-332, 362-366`). The row cannot vouch
  (`StatusActive` false) and still publishes `On`. The WR-02 case says the reported `false` "is
  what the row publishes throughout the same withdrawal"
  (`test/accessories/basementGuardian.test.ts:2841-2842`).
- **516-518 (`expire`)** says that `StatusActive` "already means the reported field did not
  decode". On a control Switch, `StatusActive` is `isRowFullyTrusted` (`basementGuardian.ts:745`).
  It is `false` for each of `'invalid'`, `'unreachable'` and `'controller-link-lost'`. During shadow
  silence it is `false` while the field decoded and is published. The rationale ("one signal
  carrying two meanings") still holds, but the meaning it names is wrong.

A reader who trusts these comments thinks the held-value fallback runs during a lost transport,
and that an inactive control Switch means a decode failure. Both are wrong. No behavior is wrong:
only the comments are.

**Fix:** One comment-only `docs(controls)` commit. Change no code, literal, cause or order. For
example:

- 152-153: "`reported` answers what the device itself last said about this capability, or
  `undefined` when the accessory cannot act on it: the field did not decode, or its scope is
  withdrawn as doubtful."
- 272-273: "The capability has no reported value the plugin can act on: its field did not decode,
  or its scope is withdrawn as doubtful. Without one the plugin cannot tell ..." Keep the rest.
- 400-402: "The republish re-asserts what the control rows may currently publish. A row publishes
  `On` only while its scope is not withdrawn as doubtful and no request for it waits, so ..."
  Keep the rest.
- 516-518: "`StatusActive` is deliberately not used to mark this either. It already reports that
  the row cannot vouch for its scope (a field that did not decode, a lost transport or a lost
  controller link), and one more meaning would leave a user unable to tell which happened
  (D-038, D-06)."

**Flags:** none. D-10 does not apply: SC-02 touched no source line. Lines 400-402 were restated by
the CR-05-CONTROLS-037 fix (`946be0e`), and "can vouch" was already there. This is a new cause, not
a reopen of 037: the waiting-request claim did not return. 152-153, 272-276 and 516-518 are as at
the batch base. Not a D-04 candidate: the behavior matches D-014, D-037 and WR-02.

### CR-05-CONTROLS-040 - WARNING: Test comments say a lost or quiet transport leaves no reported value, which the accessory's withholding rule contradicts

**Rule:** `.agents/skills/typescript-style/rules/comments.md` (comments and test titles describe what the code does, as it stands); `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation. The `typescript-style` "Classifying findings" makes comment and test-title findings WARNING.
**Location:** `3605e598f06f8c3068e102dc777272f5f810ce12:test/accessories/controls.test.ts:925-927, 929, 1178-1182`
**Issue:** Two test comments and one title give the same wrong model of the system. In that model, a
lost or quiet transport is what leaves the binder with no reported value. The accessory does the
opposite. A seeing-less withdrawal (`'unreachable'`, set for shadow silence and a degraded poll,
`basementGuardian.ts:325-332, 362-366`) keeps the decoded value publishable
(`serviceCatalogue.ts:248-266`). `reportedControlValue` answers it (`basementGuardian.ts:572-574`).
Only a field that did not decode, or a scope withdrawn as doubtful, gives `undefined`.

- **925-927** says that "a refusal answered while the control's own scope is untrustworthy would
  leave the status standing". In the catalogue's words, a scope under `'unreachable'` is
  untrustworthy. The row still publishes `On` there, so a republish clears the status. The WR-02
  case is that refusal (`basementGuardian.test.ts:2836-2895`), and its push publishes the reported
  `false`, not the held value. The title at **929** ("... when no reported value can be vouched
  for") uses the same marking word for the `undefined` that the case drives (`() => undefined`,
  932).
- **1178-1182** gives the reason the quiet live path is named over a missing value: "it is the
  condition an owner can act on: a reported field that never decoded is a symptom of the same
  silence more often than a fault of its own". Silence never removes a reported value: the poll
  delivered it and the row keeps publishing it. The source's order note gives a different reason
  (`controls.ts:341-349`: the quiet live path blocks a press of any capability, and the missing
  value blocks only that one). `a1be90c` restated the source note to drop exactly this premise. So
  the case and the rule it guards now give two different reasons for one order.

Round 3 did not file the 1183-1184 sentence: it read the sentence as a rationale, not a claim
about the code. The new evidence is `a1be90c`. The source note no longer gives that rationale, and
the fixer's record states "no claim that the silence causes the missing value"
(`05-CONTROLS-REVIEW-R3.md` Repair history). So the test comment now contradicts the comment on
the code it pins.

**Fix:** One comment-and-title-only `test(controls)` commit. Change no assertion or literal. For
example:

- 925-927: "A row withholds `On` while its scope is withdrawn as doubtful, and the accessory then
  answers no reported value, so a republish would leave the status standing. The push falls back
  to the value the characteristic already carries, which clears the status and states nothing
  new."
- 929: `clears the refusal status from the held value of ${String(held)} when the accessory answers no reported value`.
- 1178-1182: "The quiet live path and a missing state. The quiet path is named because it blocks a
  press of either control, while the missing value blocks only this one. This case stops an edit
  that moves the quiet-live-path rule below the state rule (D-07, D-08, WR-02)."

**Flags:** none. D-10 does not apply: 925-929 and 1178-1182 are not SC-02 lines (the refusal rows
and the exact-log loop). The CR-05-CONTROLS-038 fix (`eb503e5`) reflowed 1178-1182. This is a new
cause, not a reopen of 038, because no pair count returned. Not a D-04 candidate.

### CR-05-CONTROLS-041 - BLOCKER: No case presses a second time while the first command is still being sent, so a binder that records the request after the send passes the whole suite

**Rule:** `.agents/skills/typescript-unit-tests/SKILL.md` ("would a plausible wrong implementation still pass it?"); `.agents/skills/typescript-unit-tests/rules/review.md` Classifying findings (BLOCKER: a case a wrong implementation would pass); `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md` Pairing and coverage (the test module owns the source module's exported behavior); D-037 ("Set pending state before dispatch ... Reject another command for the same control while this pending state exists"); CTRL-03 (rejects duplicates); CTRL-05 (one pending request); D-05 (one command attempt).
**Location:** `3605e598f06f8c3068e102dc777272f5f810ce12:test/accessories/controls.test.ts:729-759, 1220-1241` (the cases that make a second press); `3605e598f06f8c3068e102dc777272f5f810ce12:src/accessories/controls.ts:593-604` (the entry made before the send)
**Issue:** The binder makes the pending entry before it awaits `commands.send` (597-604). The
comment says "The entry is created immediately before the request leaves". D-037 requires this,
because a send may wait up to 2.5 s (D-038). In that time `reported` still reads the old value, so
only the pending rule stops a second press. HAP does not serialize writes: `handleSetRequest`
awaits each handler on its own (`Characteristic.js:1786-1805`). A double tap, two controllers, or
an automation that fires during a press can therefore reach the handler while the first send is
still waiting.

Every case that makes a second press first awaits the whole first press:

- 'refuses a second on request while the first waits for the device, and sends one command'
  (729-759, at 736);
- the `PENDING_PRECEDENCE` loop (1220-1241, at 1228);
- 'returns the Switch to the reported value when a press is refused while a request waits'
  (895-923, at 904).

None presses while the first send is still waiting.

**Plausible wrong implementation that passes:** move `requested.set(capability, { value: accepted,
handle: timers.setTimeout(...) })` below `const outcome = await commands.send(...)`, above
`if (!outcome.accepted)`. A refactor that keeps pending only after the vendor answers looks like
this. I traced each case under that binder:

- An accepted send still leaves `pending ['self-test']` and `delays [30000]` (660-689, 1271-1284).
- A timed-out send still arms the window first, so `delays [30000, 0]`, `cancelled []` and
  pending `['self-test']` hold (761-790, 838-873, the row at 338-350).
- A vendor error still cancels handle 0, the window, before the push takes handle 1, so
  `cancelled [0]` holds (991-1020, the row at 323-336).
- Every second-press case awaits the first press, so the entry exists when the second press is
  judged.

That binder passes all 103 cases. In use, a second press while the first send waits finds no
entry and no active reading, so it sends a second self-test to a real sump pump: the duplicate
that CTRL-03 and D-037 forbid. I did not apply this mutation (the dispatch forbids it). The trace
above is the evidence.

A read-only probe of the compiled module (Toolchain evidence) shows the current binder is correct.
With the first send held open, the second press is refused with `-70403` and the line "an earlier
request is still waiting for the device to confirm it", and exactly one send is made. So this is a
gap in the cases, not a production bug, and not a reopen of CR-05-CONTROLS-008.
**Fix:** One `test(controls)` commit that adds a case to `describe('createControlBinder')`. For
example:

```ts
test('refuses a second on request while the first is still being sent, and sends one command', async () => {
  // arrange
  const warnings: string[] = [];
  const firstSend = Promise.withResolvers<CommandOutcome>();
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  when(() => commands.send(DEVICE_ID, 'self-test', true)).thenReturn(firstSend.promise);
  const { timers, deferrals, cancelled } = recordingTimers();
  const { binder, service } = boundSwitch({ commands, timers, log: warningLog(warnings) });
  const firstPress = onCharacteristic(service).handleSetRequest(true);

  // act
  const thrown = await writeRejection(service, true);
  firstSend.resolve(acceptedOutcome());
  await firstPress;

  // assert
  assert.deepStrictEqual(
    { thrown, pending: [...binder.pending], delays: deferrals.map((deferral) => deferral.delayMs), cancelled, warnings },
    {
      thrown: RESOURCE_BUSY,
      pending: ['self-test'],
      delays: [30000, 0],
      cancelled: [],
      warnings: [`Refused self-test on ${DEVICE_ID}: an earlier request is still waiting for the device to confirm it.`],
    },
  );
  verify(commands);
});
```

Under the wrong binder, the second press reaches `commands.send` a second time. The strict mock
throws at once, and `verify(commands)` fails. The `thrown`, `delays` and `warnings` values also
differ. Record the control (D-04 assertion controls): apply the move, build, see this case fail,
then restore the exact blob.
**Flags:** BLOCKER test finding; the plausible wrong implementation is named above. Not a D-04
genuine bug candidate: the production behavior is correct (probe). No exported contract change
(D-06). D-10 does not apply: no SC-02 line is involved. Not a reopen of CR-05-CONTROLS-008: the
defect (a second press while one is pending is sent) has not returned, and its regression case is
unchanged and passes.

## Candidates considered and not filed

- **`bind` guard keyed by service, not tested against a guard keyed by capability** (`controls.ts:620-628`).
  - A guard keyed by capability passes 823-836 (same service twice) and 1368-1381 (two
    capabilities).
  - It differs only when a second, different service object for the same capability is bound to
    one binder. Control rows are `alwaysPublish` and never suppressed (`serviceCatalogue.ts:810-830`,
    `basementGuardian.ts:725-728` removes only suppressible kinds). So no consumer path makes that
    second object.
  - The JSDoc says "on the same service". Not filed.
- **JSDoc blocks on members of module-local interfaces** (`controls.ts:216, 222`; test 59, 193, 226,
  231, 427). The interfaces carry `//` notes and some members carry `/** */`. The rule gives JSDoc
  to "what a user of the code reads", and an editor shows a member's JSDoc where the type is used.
  The use is the same through each file, and no earlier round filed it. Not filed.
- **Comment line widths** (`controls.ts:296` at 91 columns, 323-326 at about 100, the rest at 80).
  No book rule sets a comment width, and the 160-column limit holds. Not filed.
- **`QUIET_LIVE_CONNECTION_CAUSE` comment, "so the table below reads as a table rather than as one
  wrapped line among short ones"** (323-327). The not-on row keeps an 81-character cause inline
  (356). The quiet cause is 87 characters, so its inline row would pass 160 columns and wrap.
  The claim holds for the constant it is on. Not filed.
- **`liveConfirmationObservable` "expire with a warning naming a device failure that did not
  happen"** (117-118). The expiry line says "was never confirmed by the device"
  (`controls.ts:529`). That line reads as a device failure. Loose, not false. Not filed.
- **`republish` JSDoc "Republishes the control rows, and only those"** (123-130) while the accessory's
  callback republishes nothing under a refused credential (`basementGuardian.ts:685-691`). The JSDoc
  sets a limit on what a republish may touch, and the consumer documents why it does less. Not a
  controls finding.
- **'leaves a restored control answering a read before any press reaches it'** (1508-1518). The
  stand-in has no `onGet` (`features/lib/hap.ts:180-212`), so a binder that registered a read handler
  would throw in every restored case. A binder that pushed a status at bind fails this case. It
  discriminates. Not filed.
- **Round 1 to 3 rejections, rechecked against the current lines and still not filed:**
  - "a value the poll delivered" and "Nothing the plugin holds is missing here": the `037` fix
    removed both;
  - the `liveConfirmationObservable` "could" (119-120);
  - the comment inside a case (1003, kept by the coordinator);
  - `OnSetCall.arguments` (193-196);
  - the inline `try`/`catch` in the D-04 regression cases (739-745, 770-776);
  - `windowsIn(deferrals)[0]?.handle` (1296);
  - the late `vendor-error` against a newer entry;
  - the per-accessory rows (1385-1404);
  - `refuse()` with no `// arrange` (947-955);
  - the subset cases (691-701, 947-955, 1271-1284);
  - the three "names the ..." cases (1081-1113, 1137-1152);
  - "it fails independently of the one below" (256-257);
  - the second `assert.strictEqual` at 644;
  - `outcomeWarning` as a noun phrase;
  - `heldOn` annotated `CharacteristicValue` (394-396);
  - a `commands.send` that rejects (the port answers an outcome);
  - the `alarm-mute` constant against a literal `true` (239-241);
  - 'answers the transport refusal status ...' reading `statusCode` (1243-1269);
  - 'holds one independent entry per capability ...' with no `cancelled` (1368-1381);
  - the 036 comment "a requested value never shows as reported state" (895-897);
  - no owner case for a waiting request with no reported value (the round-3 candidate the
    coordinator kept).

## Header inspection

- `src/accessories/controls.ts`: conforms to D-01. Line 1 is `// SPDX-License-Identifier: MIT`,
  line 2 is empty, 3-5 hold the copyright block (`Copyright (c) 2026 Alessandro Colomba`), line 6
  is empty, 7-52 hold the `@fileoverview` block, line 53 is empty, and the first import is at 54.
- `test/accessories/controls.test.ts`: conforms to D-01. Line 1 is the SPDX line, line 2 is empty,
  3-5 hold the copyright block, line 6 is empty, 7-9 hold the `@fileoverview` block, line 10 is
  empty, and the first import is at 11.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS`
  printed `ACCESSORIES_HEADERS_OK files=2`, exit 0.

## Toolchain evidence

All commands ran from the repository root at `3605e598f06f8c3068e102dc777272f5f810ce12`, with a
clean tree. Each command had the prefix `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&`. Node
`v26.12.0`, npm `11.20.0`. The main run started at 2026-10-17T21:07:14Z and ended at
2026-10-17T21:07:27Z. Before linting, I deleted `node_modules/.cache/eslint`, so the lint is
fresh. No command was piped, so each exit below is the command's own. The output went to files in
the session scratch directory, and I read the summaries from those files.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | both projects compile |
| `node_modules/.bin/eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` | 0 | no output |
| `npm run build:test` | 0 | compiled |
| `node --test dist-test/test/accessories/controls.test.js` | 0 | tests 103, suites 2, pass 103, fail 0, cancelled 0, skipped 0, todo 0 |
| `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | 0 | only the npm banner, no failure (the pair is at 100% alone) |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS` | 0 | `ACCESSORIES_HEADERS_OK files=2` |

Read-only probe for CR-05-CONTROLS-041. I wrote no file and changed no source:

- `node --input-type=module -e ...` imported the compiled `dist-test/src/accessories/controls.js`
  and `dist-test/features/lib/hap.js` with made-up inputs: `dev-1`, every gate fact clear,
  `reported` `false`, and a port whose `send` records the call and returns a promise the probe
  resolves later.
- It started a press of `true` and did not await it. It then awaited a second press of `true`,
  resolved the first send, and awaited the first press. Exit 0.
- Output:
  `{"sends":[["dev-1","self-test",true]],"thrown":-70403,"delays":[30000,0],"warnings":["Refused self-test on dev-1: an earlier request is still waiting for the device to confirm it."],"pending":["self-test"]}`
  (one field of the printed object, which only named this list, is left out here).
- The current binder is correct. No owner case pins this.

Every check passes. Two findings are comments that the checks cannot see. The third is a case
that the suite does not have.

## Out-of-scope observations

- `src/accessories/serviceCatalogue.ts:337` (CATALOGUE batch, plan 05-03): "A row publishes only
  the facts it can vouch for" uses the marking rule's word ("vouch", `isRowTrusted`, 229-246) for
  the withholding rule (`isRowPublishable`, 248-266). This is the same mix-up as
  CR-05-CONTROLS-039. The catalogue owns the words, so the CATALOGUE owner or the phase verifier
  should judge it.
- `src/runtime/commandPort.ts:21` (Phase 4 PORTS batch, closed): the `CommandFailure` JSDoc still
  reads "Why a command did not take effect". The union includes `timed-out`, which the binder logs
  as possibly delivered. This is unchanged from rounds 1 to 3.
- `test/accessories/basementGuardian.test.ts:2844-2847` (ACCESSORY batch): the history narration
  ("Before the two halves read one rule ...") is unchanged. Round 2 routed it to ACCESSORY.
- `src/accessories/basementGuardian.ts:566-569` (ACCESSORY batch): "A second copy is how the two
  came to disagree: the row was widened and this was not" narrates an earlier shape of the code.
  This is unchanged from round 3.

---

_Reviewed: 2026-10-17T21:12:00Z_
_Reviewer: Claude (gsd-code-reviewer, correction round 4)_
_Depth: deep_

## Coordinator triage

Triaged 2026-10-17 by the coordinator. Opening 2, fixed 2, rejected 0, new 3, reopened 0,
closing 3. The round has open findings and closing (3) is at least opening (2), so the result is
`STOP: no progress` (D-03 as amended, D-18). CR-05-CONTROLS-001 to 036 stay fixed.

- **CR-05-CONTROLS-037 and 038:** `fixed`, as the Round status shows.
- **CR-05-CONTROLS-039:** `open`, WARNING. The coordinator checked the claims against the code.
  `isRowPublishable` ignores only the seeing-less reasons (`serviceCatalogue.ts:248-266`), and
  `reportedControlValue` answers through it (`basementGuardian.ts:572-574`). So a lost controller
  link, a doubtful reason, gives `undefined` for a field that decoded. During shadow silence a
  control row publishes `On` while `StatusActive` (`isRowFullyTrusted`, `basementGuardian.ts:745`)
  is false.
- **CR-05-CONTROLS-040:** `open`, WARNING. The test comments carry the same wrong model, and the
  case comment on the quiet-path order now gives a different reason from the source note that
  `a1be90c` restated.
- **CR-05-CONTROLS-041:** `open`, BLOCKER. No case presses again while the first send is still in
  flight. A binder that records the request after `await commands.send(...)` passes all 103 cases
  and would send a second self-test (D-037, CTRL-03). The current code refuses that press, as the
  reviewer's read-only probe showed, so this is a test gap and not a production bug.
- **Stop:** the counter row is written with `STOP: no progress` and left uncommitted, with this
  report, until the maintainer resolves it.
- **Maintainer resolution (2026-10-17):** "Resolve and continue". The counter row now reads
  `STOP: no progress; resolved by maintainer`. The coordinator repairs 039, 040 and 041 (041 with
  an assertion control that moves the request record after the send) and runs correction round 5.

## Repair history

| ID | Paths | Checks (raw exits, Node) | Control | Note |
| --- | --- | --- | --- | --- |
| CR-05-CONTROLS-039 | `src/accessories/controls.ts` | Node v26.12.0. `fallow guard src/accessories/controls.ts` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/controls.test.js` 0 (tests 103, suites 2, pass 103, fail 0); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` 0; `eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 4c143eb` 0, verdict pass | n/a (WARNING) | Comment lines only. `bind` JSDoc: `reported` is `undefined` when the control's row may not publish it (the field did not decode, or its scope is withdrawn for a doubtful reason). `hasNoFreshState`: the same two conditions; "the state the plugin can actually vouch for" becomes "the current state". `clearRefusal`: the republish re-asserts what the rows may publish, and a row publishes `On` only while its field decoded, its scope is not withdrawn for a doubtful reason and no request waits (`controlValues`, `isRowPublishable`); paragraph reflowed. `expire`: `StatusActive` reports whether the row can vouch for what it publishes, which a failed field, a lost monitoring path or a lost controller link can make false (`isRowFullyTrusted`). Same class, same file: `expire` "the Switch returns to what the device says" becomes "shows the reported value again wherever its row may publish one"; the order note's "a stale reading" becomes "a missing reading" (the fresh-state rule answers a missing value, and nothing assigns `'stale'`). |
| CR-05-CONTROLS-041 | `test/accessories/controls.test.ts` | Node v26.12.0. `fallow guard test/accessories/controls.test.ts` 0; `npm run build:test` 0; `node --test dist-test/test/accessories/controls.test.js` 0 (tests 105, suites 2, pass 105, fail 0); `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` 0; `eslint src/accessories/controls.ts test/accessories/controls.test.ts --max-warnings=0` 0; `npm run typecheck` 0; `fallow audit --base 4c143eb` 0, verdict pass | Recorded blob `ce37d2a80a9f639ef3d60463b02a61340556cd90`. Control A (the finding's wrong binder): `requested.set(...)` moved below `await commands.send(...)` (blob `e9a9bb0e`); build 0; owner test 1 (tests 105, pass 103, fail 2). 'refuses a second on request while the first is still being sent, and sends one command' fails on its `deepStrictEqual`: actual `{ thrown: -70402, delays: [30000], warnings: [] }`, expected `{ thrown: -70403, delays: [30000, 0], warnings: [<pending line>] }` (the second press reached the strict mock a second time). The sibling fails too: actual `{ pending: ['self-test'], cancelled: [] }`, expected `{ pending: [], cancelled: [0] }`. Control B (the sibling's own wrong binder): after an accepted send, re-record the request when it is missing (blob `b7d04c77`); build 0; owner test 1 (tests 105, pass 104, fail 1). Only 'clears the request and its window when the device confirms it while the command is still being sent' fails: actual `{ pending: ['self-test'], delays: [30000, 30000], cancelled: [0] }`, expected `{ pending: [], delays: [30000], cancelled: [0] }`. After each control, `git checkout -- src/accessories/controls.ts`, `git hash-object` printed `ce37d2a8...` and `git diff --exit-code` exited 0; rebuilt GREEN (105 pass). | Two cases added to `describe('createControlBinder')`. The press case holds the first send open with a resolver captured from `new Promise<CommandOutcome>` (`Promise.withResolvers` is not in the project's `ES2022` lib), presses again, then releases the send; it compares `{ thrown, pending, delays, cancelled, warnings }` and calls `verify(commands)` last. Sibling (same class, a report while a send is in flight): a confirming `reconcile` while the send is held must drop the entry and cancel the window; it compares `{ pending, delays, cancelled }` and calls `verify(commands)` last. Control B passes every other case, so the sibling is the only case that catches it. Other interleavings checked: a non-matching report in flight (a no-op under both binders); a press of the other capability in flight (separate `Map` entries; no plausible shared lock); the window closing in flight (the send deadline is shorter than the window); a vendor error after an in-flight report (`resolvePending` is a no-op). |
