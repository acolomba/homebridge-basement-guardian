---
phase: 05-degraded-operation-and-recovery
plan: 17
subsystem: ui
tags: [control-write, refusal-causes, trust-scopes, homekit, reconciliation, gap-closure]

requires:
  - phase: 05-degraded-operation-and-recovery
    provides: "05-06's widened publishing rule, which the write path never read"
  - phase: 05-degraded-operation-and-recovery
    provides: "05-16's guarded republish callback, in the same binder construction this plan extends"
provides:
  - "A third local refusal rule whose cause is true: the live connection is quiet, not the state missing"
  - "One withholding rule read by both the control row and the write path, so the two cannot disagree"
  - "Reconciliation against what the device reported, so a confirmation the device sent resolves the request it confirms"
  - "A binder docblock that states an invariant the code has, and a scenario premise that says what the code does"
  - "A step asserting a control refusal's whole log line"
  - "Closure of `05-REVIEW-2.md` WR-02 and WR-06"
affects: [05-18, control write path, monitoring trust withdrawal, pending request reconciliation]

actuals:
  tokens: 12000
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "A third fact gets its own rule and its own cause rather than being folded into a neighbouring one, because all three fail independently"
    - "A caller that needs a row's trust decision is passed the row, so no second copy of `toleratedDistrust` exists to drift"
    - "A structural reader and a trust-gated reader are two functions, and each caller names which question it is asking"
    - "A case whose subject is a trust rule is built on a reason the decode keeps, because a violated scope's group is dropped one layer below and would answer for the rule"

key-files:
  created: []
  modified:
    - src/accessories/controls.ts
    - src/accessories/basementGuardian.ts
    - features/officialControls.feature
    - features/support/steps/controls.ts
    - test/accessories/controls.test.ts
    - test/accessories/basementGuardian.test.ts
    - test/accessories/staleMarking.test.ts
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
    - .planning/WINDOWS.md

key-decisions:
  - "Took both halves of WR-02's fix rather than either alone. Adding the rule without widening the read would leave the row and the write path answering one question two ways, so the binder docblock would have to be retracted rather than made true. Widening the read without the rule would let a press reach a real sump pump in a state where no confirmation can be observed."
  - "Passed the catalogue row to `reportedControlValue` rather than adding a predicate over a bare scope. `isRowPublishable` already takes a `RowTrust` and `ServiceRow` extends it, so no `toleratedDistrust` list is copied and `serviceCatalogue.ts` needed no edit at all. `SEEING_LESS_REASONS` still has one production location."
  - "Rebuilt the withholding case on a lost controller link after measuring that mutation F left the first draft green. The family drops a violated scope's whole group at `gemini.ts:370`, so a case built on an invalid field finds the value absent whatever the trust rule answers."
  - "Kept the shipped scenario `A press with no valid state is refused locally` for the status and gave the cause its own scenario beside it. The pair is what tells a reworded rule from a reordered table; one scenario asserting both would not."

patterns-established:
  - "The three-fact command gate: no route, no channel to hear back on, no state -- named in that order, each with its own cause"
  - "A refusal's whole log line asserted end to end, so a cause that stops being true fails at the assertion as well as behind it"

requirements-completed: [RES-04]

coverage:
  - id: D1
    description: "A press refused while the live connection is quiet names the quiet connection and not a state the plugin has"
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "features/officialControls.feature#A press while the live connection is quiet names the quiet connection"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#RES-04 names the quiet live connection for a press during shadow silence, and sends nothing"
        status: pass
    human_judgment: false
  - id: D2
    description: "The transport refusal still names the transport, and the state refusal is still reachable and still names the missing state"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#names the missing transport alone when the plugin has neither a route to send on nor a live path to hear back on"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#RES-04 names the missing state for a press whose reported field never decoded, and sends nothing"
        status: pass
      - kind: e2e
        ref: "features/officialControls.feature#A press with no command transport is refused locally"
        status: pass
    human_judgment: false
  - id: D3
    description: "The value a control row publishes and the value the write path reads are one value, read through one rule"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#WR-02 returns the Switch to the value the device reported when a press is refused during shadow silence"
        status: pass
    human_judgment: false
  - id: D4
    description: "A value the plugin calls doubtful stays hidden from the tile and from the write path alike"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#WR-02 keeps a doubtful value absent from both the control row and the write path"
        status: pass
    human_judgment: false
  - id: D5
    description: "A self-test the device confirmed on the snapshot that withdrew the control's scope is resolved by that confirmation, with no warning naming a device failure"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#WR-06 resolves a request the device confirmed on the snapshot that withdrew the control scope"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#WR-06 resolves a request the device confirmed on the snapshot that first went quiet"
        status: pass
    human_judgment: false
  - id: D6
    description: "A request no report ever confirms still expires, still returns the Switch to reported state, and still warns once"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#WR-06 still warns when the window closes on a request no report ever confirmed"
        status: pass
      - kind: e2e
        ref: "features/officialControls.feature#A self-test report that arrives after the window closed still turns the switch on"
        status: pass
    human_judgment: false
  - id: D7
    description: "An owner reading the refusal line in a real Homebridge log understands which of the three conditions blocked the press, and goes to the right place"
    verification: []
    human_judgment: true
    rationale: "Whether a diagnostic sends an owner to the right place cannot be asserted from the plugin side. The plugin-side half is pinned by D1 and D2; the wording judgment rides along with the open `G-003` / `G-004` real-home session."

duration: 29min
completed: 2026-09-02
status: complete
---

# Phase 5 Plan 17: One Fact for the Row and the Write Summary

**A press during shadow silence is still refused, but the reason it gives is now the one that is true, and the value the control tile shows and the value the write path reads come from one rule instead of two that had already drifted apart.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-09-02T22:57Z
- **Completed:** 2026-09-02T23:32Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Closed `05-REVIEW-2.md` WR-02. A press refused while the live connection is quiet now names the quiet connection. The old line told an owner the plugin had no state for the pump while the pit reading on the tile had arrived seconds earlier from a working poll.
- Made the binder's docblock claim true rather than aspirational: the row and the write path read one stored value through one rule, and the case that holds it up is named in the docblock.
- Closed WR-06. A self-test the device confirmed on the snapshot that withdrew the control's scope is resolved by that confirmation instead of expiring thirty seconds later with a line naming a device failure that did not happen.
- Corrected two documents that asserted the opposite of the code, and recorded in the scenario's own comment **why** it stayed green while its premise was false.
- Found and rebuilt one case of my own that would have proved nothing, before crediting it.

## Task Commits

1. **Task 1: the third refusal rule, its cause and the corrected premise** — `f10552b` (fix)
2. **Task 2: one rule for the row and the write path** — `8c064f5` (fix)
3. **Task 2 correction: the withholding case rebuilt** — `02a37a5` (test)
4. **Task 3: reconciliation against the device's report** — `9e99ca4` (fix)
5. **Task 3: the validation rows, the mutation table and the ledger** — `3b26610` (docs)

## The two RED runs

### Task 1, through the repository's own steps

Scenario written, plugin unmodified:

```text
Then the log warns once that the "self-test" press was refused because "the live connection is quiet, ..."
    AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
      [
    +   'warn Refused self-test on placeholder-gemini: the plugin has no fresh state for it.'
    -   'warn Refused self-test on placeholder-gemini: the live connection is quiet, so the plugin
        cannot see the device confirm the command.'
      ]
1 scenario (1 failed)
12 steps (11 passed, 1 failed)
```

**Eleven of twelve steps passed.** The press was already refused with the right status and already sent nothing; only the cause was untrue. That is WR-02's whole user-facing cost, isolated.

A second RED came from the existing suite. Exactly one shipped unit case failed on the source change:

```text
✖ RES-04 refuses a press while a monitoring outage leaves the control unvouched for, and sends nothing
  + actual:   'Refused self-test on account-1_serial-1: the live connection is quiet, ...'
  - expected: 'Refused self-test on account-1_serial-1: the plugin has no fresh state for it.'
```

That case had pinned the untrue cause as an expectation. It is the unit-tier twin of the false scenario premise, and it is now `RES-04 names the quiet live connection for a press during shadow silence, and sends nothing`.

### Task 3, the warning naming a device failure that did not happen

```text
✖ WR-06 resolves a request the device confirmed on the snapshot that withdrew the control scope
  actual:   unconfirmed: [ 'The self-test request on account-1_serial-1 was never confirmed by the
                            device. It is not retried.' ]
  expected: unconfirmed: []
```

The device reported `test_running: true` on that very snapshot. The plugin read the value through a trust gate, saw nothing, never matched the request, and thirty seconds later said the device had not answered.

## The case that would have proved nothing

The first draft of `WR-02 keeps a doubtful value absent from both the control row and the write path` withdrew the control's scope with a wrong-typed `test_timestamp`, which marks the scope `invalid`. **Mutation F left it green.**

The reason is one layer below the accessory: `src/device/gemini.ts:370` reads

```ts
'self-test': untrusted.has('self-test') ? undefined : decodeSelfTest(data),
```

The family drops a violated scope's whole group before the accessory ever sees it, so the value was already absent for a second reason and the case agreed with a rule that withheld nothing.

Rebuilt on a lost pump controller link — a valid boolean the decode keeps, so every group still decodes and the trust rule is the only thing holding the value back. Mutation F now fails it with `Missing expected rejection`: **the press is not refused at all**, so a command would reach a real sump pump on a value the plugin calls doubtful. Committed separately as `02a37a5` rather than folded into task 2, because the correction is a finding of its own.

An earlier draft of the task 2 agreement case failed the same way and was caught before it was credited: the timer wrapper collected every deferral, so running them also expired the request, and the row's own republish then set the value the case was checking the write path arrived at independently. It passed against the defect. Narrowed to the clearing push alone, it produced a real RED.

## Mutations

Each was applied after its task was committed, run, and reverted only once `git status` showed the mutated file was the only changed one, with `npm run build:test` after each.

| Mutation | What it does | What fails |
|---|---|---|
| **A** | Delete the new rule's row from `LOCAL_REFUSALS` | The new scenario at `features/officialControls.feature:191`, on the log line, reporting the no-fresh-state cause. Plus **7 unit cases**. **Both shipped refusal scenarios stay green** |
| **B** | Move the new rule above the transport rule | **No scenario at all.** Exactly one unit case: `names the missing transport alone when the plugin has neither a route to send on nor a live path to hear back on` at `test/accessories/controls.test.ts:696` |
| **C** | Answer the predicate from `commandTransportReady` instead of `!shadowSilent` | The new scenario on the log line, and `RES-04 names the quiet live connection for a press during shadow silence` |
| **D** | Restore `reportedControlValue`'s own guard over every untrusted scope | `WR-02 returns the Switch to the value the device reported...`, on `afterTheRefusedPress: true` against `false` |
| **E** | Make `isRowPublishable` ignore the reason and withhold for every untrusted scope | The agreement case **plus 8 shipped cases**, among them `publishes a scope untrusted for unreachable only while the value itself is not in doubt` |
| **F** | Fill `SEEING_LESS_REASONS` with every reason | `WR-02 keeps a doubtful value absent...` with `Missing expected rejection`. **Failed nothing on the case's first draft** — see above |
| **G** | Point `reconcileControls` back at the vouched-for value | `WR-06 resolves a request the device confirmed on the snapshot that withdrew the control scope`, on the "never confirmed" warning. **Nothing else**, which is what says the gate belonged to reconciliation alone |
| **H** | Make the decoded reader answer `undefined` for every control | **10 cases**: all three `WR-06` cases, the agreement case, and six shipped ones including `CTRL-04 answers -70403 for a write of true while alarm_audio_muted reads true` and `CR-02 leaves both controls refusing reads when a request that outlived its window runs its clearing push` |

### The two mutations that failed less than expected

**Mutation B fails no Cucumber scenario.** No shipped scenario sets a quiet live path and an unready transport together, so the end-to-end tier cannot see the insertion point at all. It is pinned by one unit case, and **that case was written by this plan for this mutation — without it, mutation B would have failed nothing whatsoever.** That is the shape of blindness `04-VERIFICATION.md` W-1 records, caught this time by the mutation rather than by a reviewer. Recorded in the ledger.

**Mutation F failed nothing until the case was rebuilt**, as above.

## The case pinning which cause is named when two rules both hold

Unchanged by this plan, byte for byte. `git diff 5d1af48..HEAD -- test/accessories/controls.test.ts` shows it only as a hunk-header context line, never as a modified one.

**Before and after, identical:**

```ts
test('names the missing transport alone when the plugin has neither fresh state nor a way to send', async () => {
  const { service } = boundSwitch({ commands, log: warningLog(warnings), commandTransportReady: () => false }, () => undefined);
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);
  assert.deepStrictEqual({ warnings, sends }, { warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_COMMAND_TRANSPORT_CAUSE}.`], sends: [] });
});
```

It still asserts the same two rules against each other. The new rule was inserted between them and moved neither.

## The cause string

```text
the live connection is quiet, so the plugin cannot see the device confirm the command
```

**Fifteen words**, one sentence, active voice, simple present. Through the `simple-english` skill, three changes from the reviewer's candidate `the live connection has gone quiet, so a confirmation cannot be observed`:

- `has gone quiet` → `is quiet`. Rule 3.4 bans present perfect.
- `a confirmation cannot be observed` → `the plugin cannot see the device confirm the command`. Rule 3.6, an agentless passive, repaired with the plugin as subject; and Rule 3.7, an action described with a noun rather than a verb.
- `confirm` kept rather than routed to `make sure that`. Rules 1.11 and 9.4: three shipped lines already use "confirm" for this act, and a synonym here would be a rotation.

The plugin is the subject deliberately. The device may well be confirming normally; what changed is that the plugin cannot see it. A line naming the device would be the same class of untrue cause this plan exists to remove.

It carries no threshold, no interval, no URL, header value, token or response body. The `deviceId` is in the line's existing prefix under the 2026-08-29 ruling.

## The corrected premise comment

`features/officialControls.feature`, above `A press with no valid state is refused locally`:

> A press refused after the live path goes quiet, asserted at the status. This comment used to say the row withholds the reported value once the control's own scope is untrusted, and that the no-fresh-state rule then refuses the press. Neither half was true of the code: the row goes on publishing what the working poll delivered, and the rule that refuses this press names the quiet live connection. The scenario stayed green through all of it because it asserts the status and never the cause, and one status answers every local refusal — which is exactly how a premise can be wrong for a whole phase without a test saying so. The scenario below asserts the cause; this one is kept for the status, and the two together are what tell a reworded rule from a reordered table (D-07, D-08, WR-02).

**Measured, not assumed.** Mutation A fails the new scenario and leaves this one green, which is the direct demonstration that this scenario cannot tell the two rules apart.

## The corrected binder docblock

`src/accessories/controls.ts`, on `commandTransportReady`:

> The accessory answers this from the account-wide monitoring trust it also publishes its rows from, and it answers `reported` below through the same rule that decides whether the control's row may publish that value. So the fact a row publishes from and the fact a write is refused on cannot disagree: they are one stored value read through one rule.
>
> That was written here as an invariant before it was one. The row was widened to keep publishing what a working transport delivered and the write path was not, so a press was refused for a missing state while the tile beside it showed that state. The case holding this up is "returns the Switch to the value the device reported when a press is refused during shadow silence", which reads the write path's own answer where a controller can see it (RES-04, D-07, WR-02).

Task 1 shipped the first paragraph without the invariant sentence, because the invariant was not true until task 2.

## The factoring, and the count

`isRowPublishable` takes a `RowTrust`, and `ServiceRow extends RowTrust`. Both callers of `reportedControlValue` reach it holding a row — `bindControlRow` is handed one, and reconciliation walked the catalogue for the one commit where it needed one — so **the row itself is passed and no `toleratedDistrust` list is copied anywhere.** No new predicate was added, and `src/accessories/serviceCatalogue.ts` was not edited at all, though the plan listed it.

A search answers **one production location**:

```text
$ grep -rn "SEEING_LESS_REASONS" src/
src/accessories/serviceCatalogue.ts:221:const SEEING_LESS_REASONS: ... = new Set<DistrustReason>(['unreachable']);
src/accessories/serviceCatalogue.ts:258:    ... && !SEEING_LESS_REASONS.has(untrusted.reason) && ...
```

The declaration and the single rule that reads it, in the file that owns both. **One member, unchanged.**

## Gates, on both installed Node versions

Node 24 is not installed locally and is not claimed.

| Gate | node v26.7.0 | /usr/bin/node v22.22.2 |
|---|---|---|
| Unit tests | 1378 passed, 0 failed | 1378 passed, 0 failed |
| Cucumber | 102 scenarios, 1120 steps, all passed | 102 scenarios, 1120 steps, all passed |
| Coverage over `src/` | 100.00 / 100.00 / 100.00 | 100.00 / 100.00 / 100.00 |
| `npm run check` | exit 0 | — |
| `npm run fallow` | exit 0 | — |

Against the baseline of **1367 unit tests, 101 scenarios and 1108 steps**: **+11 unit cases** and **+1 scenario carrying +12 steps**. Every unit of movement is accounted for:

| Task | Cases | What they are |
|---|---|---|
| 1 | +6 | 3 named cause cases in `controls.test.ts`; 2 table-driven cases from the new `LOCAL_REFUSALS` row; 1 accessory case for the still-reachable state rule |
| 2 | +2 | The agreement case and the withholding case |
| 3 | +3 | The two resolution cases and the still-warns case |

Nothing was lost. `npm run fallow` reports the one pre-existing clone group at `features/support/steps/hap.ts:113-124` against `168-181`, and no dead-code finding.

## `05-VALIDATION.md`: the measured baseline and the floor

`grep -c "05-17"` answered **3** immediately before appending, on lines 523 to 525 — three seeded table rows and no subsection heading. **That is the number the plan derived its floor of 12 from, so the floor stands as written.** After appending it answers **14**: eight behaviour rows, two corrected-record rows, the two subsection headings and the three seeded rows.

## Decisions Made

Recorded in the frontmatter. The load-bearing one is taking both halves of WR-02's fix rather than choosing between them, because the two answer different questions. The refusal is about the transport, so the rule is added; the published value and the read value are the same value, so they read one rule. Either alone leaves a document that has to be retracted rather than made true.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two test files outside the plan's file set needed the new binder option**

- **Found during:** Task 1, at the first `npm run build:test`.
- **Issue:** `ControlBinderOptions` gained a required member, so every construction of it had to compile. `test/accessories/staleMarking.test.ts:412` builds one directly, and `test/accessories/controls.test.ts` builds one through `binderOptions`. `npm run test:cucumber` compiles the whole test tsconfig, so nothing could be verified until both compiled.
- **Fix:** Added `liveConfirmationObservable: () => true` to the `staleMarking` construction and to the `binderOptions` default. One line each; no assertion changed.
- **Verification:** `npm run build:test` clean, and both files' own cases still pass.
- **Committed in:** `f10552b` (Task 1 commit).

**2. [Rule 1 - Bug] A shipped unit case had pinned the untrue cause as an expectation**

- **Found during:** Task 1, at the first full unit run after the source change.
- **Issue:** `RES-04 refuses a press while a monitoring outage leaves the control unvouched for, and sends nothing` asserted `the plugin has no fresh state for it` under `SHADOW_SILENT`. It is the unit-tier twin of the false scenario premise, and it would have blocked the fix while looking like a regression.
- **Fix:** Renamed to `RES-04 names the quiet live connection for a press during shadow silence, and sends nothing`, and its comment rewritten to record what it asserted before and why that was wrong. Its old comment also claimed the write gate "reads the withdrawn scopes directly rather than through the row projection, and it must stay that way" — which task 2 deliberately reverses.
- **Verification:** Mutations A and C both fail it.
- **Committed in:** `f10552b` (Task 1 commit).

**3. [Rule 1 - Bug] The comment count above the refusal table was already wrong and my row made it worse**

- **Found during:** Task 1, adding a row to `LOCAL_REFUSALS` in the test file.
- **Issue:** The comment read "The six ways one write can end ... four the plugin answers by itself and two the vendor answers", over a table of five local and two vendor rows. Pre-existing.
- **Fix:** Corrected to eight and six, which are the counts after this plan.
- **Committed in:** `f10552b`. Scope note: the number I made wrong is the number I corrected; nothing else in that comment moved.

**4. [Rule 1 - Bug] The task 2 withholding case was vacuous and mutation F said so**

- **Found during:** Task 2 mutation run, after the task was committed.
- **Issue:** Detailed above. `gemini.ts:370` drops a violated scope's group, so the case could not fail.
- **Fix:** Rebuilt on a lost pump controller link.
- **Verification:** Mutation F now fails it with `Missing expected rejection`.
- **Committed in:** `02a37a5`. **Ledger:** appended, with the rule a later author needs.

**5. [Rule 3 - Blocking] `serviceCatalogue.ts` needed no edit**

- **Found during:** Task 2, choosing the factoring.
- **Issue:** The plan listed the file in `files_modified` and in `artifacts`, expecting a possible new exported predicate over a scope and the untrusted list.
- **Fix:** None needed. `isRowPublishable` already accepts a `RowTrust` and both callers hold a row. Passing the row is strictly better than a scope-and-list predicate: it copies no `toleratedDistrust`.
- **Committed in:** n/a — the absence of a diff is the fix. **Ledger:** appended.

---

**Total deviations:** 5 auto-fixed (2 blocking, 3 bugs).
**Impact on plan:** Every one was inside the plan's own declared scope or was a correction of something the plan's own criteria demanded be measured. No scope creep. Deviations 2, 3 and 4 are each an instance of the defect class this phase exists to close, found by this plan's own gates.

## Plan premises that did not survive measurement

**One, and it is the useful kind.**

The plan's task 2 asked for cases proving "the published `On` and the sampled value agree during a seeing-less withdrawal", and expected the disagreement to be observable through the refusal. **It is not.** After task 1, every seeing-less withdrawal of a control scope — shadow silence, or a refused credential — is refused before the state rule is ever consulted, so the write path's sampled value cannot change any refusal outcome during exactly the withdrawal task 2 is about. The disagreement is observable in one place only: the clearing push, which publishes `reported() ?? heldOn(service)` and is therefore where the write path's own answer reaches a controller. That is where the case reads it, and it is why the case has to keep a request pending — otherwise the row's own republish makes the two agree before the push is taken.

**Two premises were checked and held:**

- The plan said the row already publishes the device's reported state during a seeing-less withdrawal while the write path calls it absent. **Confirmed by measurement**, not by reading: the task 2 RED reported `afterTheRefusedPress: true` — HomeKit's own requested value standing where the device's reported `false` belonged.
- The plan said the shipped scenario `A press with no valid state is refused locally` would keep passing under a different rule. **It does**, and mutation A demonstrates it directly by killing the new scenario and leaving that one green.

## Issues Encountered

None unresolved. Two draft cases would have proved nothing and both were caught before being credited — one by a mutation, one before it was ever run. Both are recorded above rather than quietly repaired.

## Threat Flags

None. This plan added no network endpoint, no auth path, no file access and no schema change. `package.json` and `package-lock.json` are not in the diff and no package was installed, which closes `T-05-17-SC`. `T-05-17-06` holds: the new cause string carries no URL, header value, token or response body, and the shipped privacy case `names the capability and the device in every refusal line and quotes no token or URL` now covers it through the extended refusal table.

## Locked control semantics

`D-018`, `D-019`, `D-037` and `D-038` are intact. Reported state stays authoritative throughout: the new rule refuses a press rather than allowing an optimistic one, reconciliation resolves only from what the device reported and from nothing the plugin decided, and the one behaviour change visible to a controller — the Switch returning to the device's reported value after a refusal during silence instead of to the value HomeKit's own request left — moves the plugin toward reported state, not away from it.

## Known Stubs

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- WR-02 and WR-06 are closed. `05-REVIEW-2.md`'s remaining code findings for this phase are WR-01, WR-07 and WR-08 (plan 05-18), and CR-04, which is documentation.
- Plan 05-18 touches `src/platform.ts` and `src/accessories/staleMarking.ts`. This plan added one line to `test/accessories/staleMarking.test.ts` — a binder option in the restored-refusal case — which is worth knowing before that file is edited.
- `reportedControlValue` and `decodedControlValue` are now two functions with two different callers, and a later author reaching for "what the device says about a control" must pick deliberately: the write path and the row want the gated one, and only a confirmation of a request the plugin issued wants the ungated one.

## Self-Check: PASSED

All nine modified files exist on disk. All five commits (`f10552b`, `8c064f5`, `02a37a5`, `9e99ca4`, `3b26610`) are in the branch history and were each verified by `git show --name-only --format="" HEAD` naming only this plan's own paths. The plan's `contains` claims are present: `LOCAL_REFUSALS` in `src/accessories/controls.ts`, `decodedControlValue` in `src/accessories/basementGuardian.ts`, `live connection` in `features/officialControls.feature`, and `05-17` in `05-VALIDATION.md` fourteen times. `SEEING_LESS_REASONS` remains in `src/accessories/serviceCatalogue.ts` alone, which the plan's artifact claim for that file asserts and which required no edit to keep true.

---

_Phase: 05-degraded-operation-and-recovery_
_Completed: 2026-09-02_
