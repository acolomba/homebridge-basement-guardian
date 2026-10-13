---
phase: 05-degraded-operation-and-recovery
plan: 08
subsystem: api
tags: [homekit, hap, shadow, mqtt, trust, cucumber, node-test]

requires:
  - phase: 05-degraded-operation-and-recovery
    plan: 01
    provides: "`createMonitoringHealth`, the arrival stamp `recordShadowMessage`, and `trustNow()`"
  - phase: 05-degraded-operation-and-recovery
    plan: 03
    provides: "`reportMonitoringHealth` and the two poll recorders that called it"
  - phase: 05-degraded-operation-and-recovery
    plan: 06
    provides: "the narrowed row projection, so a value published during a monitoring degradation reaches the tile"
provides:
  - "the arrival-driven monitoring-trust report on `src/runtime/accountRuntime.ts`, guarded by `reportedShadowSilent` so it fires once per recovery"
  - "`holdEveryDeviceRequest` on `features/support/fakeRestApi.ts` -- a standing hold scoped to the inventory route"
  - "the steps `the vendor never answers the device list`, `the plugin stops asking for the device list`, and `the plugin records no poll outcome`"
  - "`A returning heartbeat clears the shadow silence before the next poll` in `features/degradedOperation.feature`"
affects: [05-09, 05-10, 05-11, 06-release-quality]

actuals:
  tokens: 3772
  tasks: 2
  commits: 3
  # `estimateTokens` scale: chars/4 over the realized diff (15 089 chars of added lines across
  # 5 files, 298 insertions). The plan projected 60 000 on the read-set scale every plan of this
  # phase has used. The gap is a difference between two scales, not a 16x over-estimate; both
  # belong on one footing before anyone reads the ratio.

tech-stack:
  added: []
  patterns:
    - "A report driven from the event that is evidence, guarded by the state last reported, so the report fires once per state change rather than once per event"
    - "A latch assigned inside the reporter from the value it is about to push, so the latch and the fact the accessory tier holds cannot drift apart"
    - "A route-scoped standing hold on the fake vendor service, so a scenario parks one loop while every other route keeps answering"
    - "A step that proves a parked state rather than assuming it: one recorded request after arming, then a count unchanged across a window many times the poll interval"
    - "A closing step that asserts the scenario's own premise on the signal a violation would move, so a slow machine fails loudly instead of passing on the wrong mechanism"

key-files:
  created: []
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - features/support/fakeRestApi.ts
    - features/support/steps/runtime.ts
    - features/degradedOperation.feature

key-decisions:
  - "`reportedShadowSilent` is assigned in exactly one place, inside `reportMonitoringHealth`, from the trust it is about to push. The two direct push sites -- the terminal authentication branch and `stop()` -- were left alone, because each deliberately bypasses the reporter and neither describes an observation of the live path."
  - "The arrival callback stamps, applies the patch, then reports. Applying before reporting means the new value is on the tile before the marker says the plugin vouches for it again, so there is no instant in which the accessory claims to vouch for a value it has not published."
  - "No timer was added. The arrival is an event the shadow client already delivers, so detection stays as lazy as D-05 ratified and the whole projection stays drivable from the injected clock and the injected timers."
  - "The scenario parks the poll instead of lengthening the poll interval. A long interval is not buildable: entering the silent state needs a report, and the only reporters are the two poll recorders, so a long interval removes the defect's cover and the test's setup together."
  - "The step that waits for the parking is named `the plugin stops asking for the device list` rather than `the plugin's device polling is parked`. The apostrophe forced a double-quoted step string, which the lint rule refuses; the wording carries the same claim in active present tense."

patterns-established:
  - "Report on the evidence, latch on what was reported: the arrival reports only when the runtime has previously said the live path was silent"
  - "Prove the harness state a scenario depends on, in the scenario, on a signal a violation would move"

requirements-completed: [RES-03]

coverage:
  - id: D1
    description: "A shadow message arriving after a silence restores the monitoring trust immediately, with no clock movement and no poll"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#RES-03 restores the trust on the message that proves the live path is carrying, with no clock movement and no poll"
        status: pass
      - kind: e2e
        ref: "npm run test:cucumber -- --name \"before the next poll\""
        status: pass
    human_judgment: false
  - id: D2
    description: "The recovery is reported once per recovery, not once per heartbeat, so a healthy live path costs no push per message"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#reports once per recovery rather than once per message when two messages arrive together"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#reports nothing when a message arrives on a live path it never reported silent"
        status: pass
    human_judgment: false
  - id: D3
    description: "A heartbeat carrying the values the store already holds still clears the silence, because the report is driven from the arrival and not from a snapshot listener"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#clears the silence on a heartbeat carrying the values the store already holds, which notifies no subscriber"
        status: pass
    human_judgment: false
  - id: D4
    description: "A successful REST poll still does not clear a shadow-silence degradation, so clearing stays matched to cause"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-11 leaves the shadow silence for the successful poll and clears it for the message that follows"
        status: pass
      - kind: e2e
        ref: "npm run test:cucumber -- --name \"A successful poll does not clear the shadow silence\""
        status: pass
    human_judgment: false
  - id: D5
    description: "The recovery scenario cannot be satisfied by a poll tick: device polling is parked at the vendor, and the scenario asserts no poll outcome was recorded while it ran"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "npm run test:cucumber -- --name \"before the next poll\""
        status: pass
    human_judgment: false

duration: 78min
completed: 2026-09-02
status: complete
---

# Phase 5 Plan 08: Report the recovery from the message that proves it Summary

**A returning shadow message now restores the monitoring trust at the message itself, guarded to fire once per recovery, proven by a scenario whose device polling is parked at the vendor so no poll tick can satisfy it.**

## Performance

- **Duration:** 78 min
- **Started:** 2026-09-02T14:31:00Z
- **Completed:** 2026-09-02T15:49:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `CR-02` is closed. `reportMonitoringHealth()` now runs from the reported-patch callback as well as from the two poll recorders, so a live path that returns is vouched for at the message rather than at the next poll tick -- which `pollIntervalSeconds` lets run 3600 seconds long.
- The report is guarded by `reportedShadowSilent`, the silence state the runtime last actually pushed, so a working live path delivering a heartbeat every fifteen minutes costs no push at all and a recovery costs exactly one.
- The Cucumber harness gained a standing hold scoped to the inventory route, and the recovery scenario runs with the poll loop parked inside a request the vendor never answers. The credential rotation keeps answering, so the scenario starves no loop it is not about.
- The scenario asserts its own premise: the inventory-request count when polling parked equals the count at the end, so a run slow enough for the client's ten-second request deadline to fire fails loudly instead of crediting a poll report to the message.
- `D-11` still holds. A successful REST poll during a shadow silence still reports the silence unresolved, at both the unit tier and the end-to-end tier.

## Task Commits

1. **Task 1: Report the recovery from the message that proves it** (tracer, TDD)
   - RED: `53d45e1` `test(05-08): drive the shadow recovery from the arriving message`
   - GREEN: `35c9e0b` `feat(05-08): restore the trust from the message that proves it`
   - REFACTOR: none needed; the change is one boolean and one guarded call.
2. **Task 2: Park the poll, so the scenario cannot pass on a clock tick** - `2f900af` `test(05-08): park the poll so only the message can clear the silence`

## Files Created/Modified

- `src/runtime/accountRuntime.ts` - `reportedShadowSilent`, its assignment inside `reportMonitoringHealth`, and the guarded report at the end of the arrival callback.
- `test/runtime/accountRuntime.test.ts` - six new cases in the degraded-monitoring-path block, all of which hold the clock still across the arrival.
- `features/support/fakeRestApi.ts` - `holdEveryDeviceRequest`, the `holdEveryDevice` service flag, and the route branch that records an inventory request and answers nothing. `route()` now computes the pathname once and passes it to `answer()`.
- `features/support/steps/runtime.ts` - the arming step, the parked-polling step, and the closing step, with `PARKED_WINDOW_MS` and the remembered parked count.
- `features/degradedOperation.feature` - `A returning heartbeat clears the shadow silence before the next poll`.

## TDD Gate Compliance

| Gate     | Commit    | Result |
| -------- | --------- | ------ |
| RED      | `53d45e1` | Five of six new cases failed before the implementation existed |
| GREEN    | `35c9e0b` | All six pass; focused pair at 100 / 100 / 100 |
| REFACTOR | none      | No cleanup was warranted |

One new case, `reports nothing when a message arrives on a live path it never reported silent`, **passed in the RED commit**, and that is correct rather than a gate violation: it asserts the absence of a push, which a runtime that never reports from the arrival trivially satisfies. It is the guard against the unguarded-report mutation, not evidence for the feature, and it fails under that mutation as recorded below.

## Named mutations, applied and watched

Every mutation `05-VALIDATION.md`'s gap-closure table names for a behaviour in this plan was applied to the working tree, run, and reverted, and the suite was confirmed green after each revert.

| Mutation | Assertion it broke | Result |
| --- | --- | --- |
| Delete the report from the arrival callback | `RES-03 restores the trust on the message that proves the live path is carrying, with no clock movement and no poll` -- the pushed list stopped at three entries instead of four. Also broke `reports once per recovery...`, `announces the live connection recovered once...`, `clears the silence on a heartbeat...`, and `D-11 leaves the shadow silence...` | 5 failed / 100 passed. Reverted; 105 passed |
| Report from the arrival unconditionally, with no latch guard | `reports nothing when a message arrives on a live path it never reported silent` -- the push count moved from 1 to 3 across two heartbeats. Also broke `reports once per recovery...` and the pre-existing `reports the shadow trusted over the same span once a message reached the reported-patch callback` | 3 failed / 102 passed. Reverted; 105 passed |
| Drive the report from a snapshot subscription instead of the arrival callback | `clears the silence on a heartbeat carrying the values the store already holds, which notifies no subscriber` -- the store notified nobody, so nothing reported. Also broke the four other new cases | 5 failed / 100 passed. Reverted; 105 passed |

**The first mutation's deleting form needed one extra edit to compile.** Removing only the guarded call leaves `reportedShadowSilent` written and never read, which the project's `noUnusedLocals` refuses. The mutation was therefore applied as "delete the arrival report and the latch it reads", which is the same behaviour and the same revert.

### The pair that proves the new scenario is not blind

| Scenario | Under the deleting mutation |
| --- | --- |
| `A returning heartbeat clears the shadow silence before the next poll` (new) | **FAILED** -- `Then the "Sump Pit Flood" service reports "Status Active" as "true"`: `the Sump Pit Flood service never reported Status Active as true within 2000 ms` |
| `An identical heartbeat clears the shadow silence` (pre-existing) | **PASSED** -- 13 steps, 0.4 s |

That is the whole point of the plan in one row. The pre-existing scenario runs under a 50 ms poll interval, so the poll tick that follows the heartbeat clears the silence and the scenario cannot tell which mechanism did it. The new one parks the poll, so nothing but the message can.

### The mutation against the closing step

The named mutation is "drop the standing hold from the scenario so the inventory keeps answering and polls keep completing, and watch the closing step fail on the count having advanced". Applied literally, the parked-polling step fails first and the closing step never runs, so it was run in two forms and both are recorded.

| Form | Failing step | Message |
| --- | --- | --- |
| Drop the `Given the vendor never answers the device list` line only | `Then the plugin stops asking for the device list` | `the plugin kept polling: it asked for the device list 4 times, then 6 times` |
| Drop that line **and** relax the parked step to a plain reading, so the closing step is reached | `Then the plugin records no poll outcome` | `the run was slow enough for the request deadline to fire: the plugin had asked for the device list 4 times when polling parked, and 6 times now` |

The second form is the one the criterion asks for: it proves the closing step can see a poll outcome at all, and that it names both counts when it does. Both were reverted and the scenario confirmed green.

### The inventory-request counts the closing step compared

In the passing run the count is **4** when polling parks and **4** at the end. Under the mutation above it is 4 and then 6. The count is what an aborted request moves, because the poll loop asks again after the abort, so equality is the proof that the loop is still sitting inside the original held request and recorded no poll outcome.

## Race check -- not a mutation, and not evidence of correctness

The plan asks for the parked-polling wait to be removed and the scenario run ten times. Two wait-less forms exist and both were run ten times, because the result differs between them and the difference is the finding.

| Form | Runs | Outcome |
| --- | --- | --- |
| The window observation removed, the "one request recorded after arming" wait kept | 10 | 10 passed, 0 failed |
| The **whole** wait removed -- the count read the instant the step starts | 10 | **0 passed, 10 failed**, every one on `the plugin records no poll outcome`, e.g. `... 4 times when polling parked, and 5 times now` |

The second row is the useful one and it is stronger than the plan anticipated. The wait is not merely narrowing a race: it is what makes the recorded baseline the **held** request rather than the one issued before the hold was armed. Without it the closing step's baseline is a count the loop is about to advance one more time, and it fails deterministically.

The first row shows only that the remaining race is usually won, which is what a race produces, and is **not** recorded as a satisfied mutation. The wait was restored in both cases.

## Three consecutive runs of the finished scenario

| Run | Result |
| --- | --- |
| 1 | 1 scenario (1 passed), 17 steps (17 passed) |
| 2 | 1 scenario (1 passed), 17 steps (17 passed) |
| 3 | 1 scenario (1 passed), 17 steps (17 passed) |

## Why the two existing arrival unit cases were left as they are

`announces the live connection recovered once a message arrives after the silence` and `reports the shadow trusted over the same span once a message reached the reported-patch callback` both advance the clock after the arrival. That is exactly the shape that hid this defect: a poll tick lands inside the advance and does the clearing, so neither case can tell an arrival-driven recovery from a poll-driven one.

They were kept because each asserts something true and separate. The first asserts the failure log's rate limiting -- one warning and one recovery line across the whole span -- and the second asserts that a message inside the window keeps the silence from ever being reported at all, which is about the arrival stamp rather than the report. Deleting them would trade one blindness for another. The new cases are shaped differently on purpose: the clock does not move between the arrival and the assertion in any of them, and the recorded call list is asserted unchanged, so no poll can be the thing that reported.

The unguarded-report mutation broke the second of the two, which is a useful side effect: it holds the runtime to one push per poll across a span in which a message arrived.

## Decisions Made

- **The latch keeps one assignment site.** `reportedShadowSilent` is written only inside `reportMonitoringHealth`, from the trust it is about to push. The terminal authentication branch and `stop()` both push directly and deliberately, because neither made an observation of the live path, and giving either a second assignment site would let the latch and the pushed fact drift.
- **Order inside the arrival callback is part of the contract.** Stamp, apply, report. Stamping first is what makes the recomputed trust see this arrival; applying before reporting is what keeps the accessory from claiming to vouch for a value it has not yet published. The reason is in the comment, because the next reader will ask.
- **The step wording changed from the plan's suggestion.** `the plugin's device polling is parked` needs a double-quoted step string in TypeScript, which the project's `quotes` lint rule refuses. `the plugin stops asking for the device list` carries the same claim in active present tense, and the "parked" vocabulary survives in `assertPollingParked`, `PARKED_WINDOW_MS`, and the comments.

## Deviations from Plan

**1. [Rule 3 - Blocking] The deleting mutation did not compile in its literal form**

- **Found during:** Task 1, mutation pass
- **Issue:** Removing only the guarded call from the arrival callback leaves `reportedShadowSilent` assigned and never read, which `tsc` rejects under `noUnusedLocals`, so the mutation could not be run.
- **Fix:** The mutation was applied as "delete the arrival report and the latch it reads". Same behaviour, same revert.
- **Files modified:** none permanently; the mutation was reverted.
- **Verification:** 5 named cases failed under it, 105 pass after the revert.

**2. [Rule 3 - Blocking] The named mutation against the closing step is unreachable in its literal form**

- **Found during:** Task 2, mutation pass
- **Issue:** Dropping the standing hold makes the parked-polling step fail first, so the closing step never runs and cannot be watched.
- **Fix:** Both forms were run and both recorded above. The second reaches the closing step and fails it naming both counts, which is what the criterion is after.
- **Files modified:** none permanently; both forms were reverted.
- **Verification:** the scenario is green after the revert, three runs in a row.

**3. [Rule 3 - Blocking] The step name the plan suggested does not lint**

- **Found during:** Task 2
- **Issue:** `Then("the plugin's device polling is parked", ...)` needs double quotes for the apostrophe; `eslint`'s `quotes` rule refuses them and the project runs `--max-warnings=0`.
- **Fix:** Renamed the step to `the plugin stops asking for the device list`. The plan's `contains: "parked"` artifact check still holds through `assertPollingParked` and `PARKED_WINDOW_MS`.
- **Files modified:** `features/support/steps/runtime.ts`, `features/degradedOperation.feature`
- **Verification:** `pre-commit run --files` clean; 93 scenarios pass.

**4. [Rule 3 - Blocking] A 183-character failure message exceeded the line limit**

- **Found during:** Task 2
- **Issue:** The closing step's failure message ran past the 160-column limit as one template literal.
- **Fix:** Split across two interpolated template literals, so neither is a substitution-free backtick string the `quotes` rule would also reject.
- **Files modified:** `features/support/steps/runtime.ts`
- **Verification:** `npm run lint` clean.

---

**Total deviations:** 4 auto-fixed (4 x Rule 3). **Impact:** none on behaviour. Three are mechanical -- a mutation that had to be made compilable, a step name that had to lint, a line that had to wrap. One, the closing-step mutation, is recorded as two forms with both results rather than as a clean single row, because a single row would have hidden that the literal form never reaches the step it is meant to test.

## Issues Encountered

**The race check produced a stronger result than the plan expected, and it is worth reading.** Removing the whole parked-polling wait fails the scenario ten times out of ten, not intermittently. The reason is that the wait does two jobs, and only one of them is narrowing a race: it also fixes *which* request the baseline count refers to. Without the wait the baseline is taken before the loop has issued the request the hold will catch, so the closing step always sees one more request than it recorded. That makes the wait load-bearing in a way a race check cannot show, and the partial form -- which passed ten times out of ten -- is exactly the "usually wins" result the plan warned would prove nothing.

**A known upstream defect was not touched.** `pollTelemetry` (`src/device/state.ts:173-175`) freezes telemetry while a versioned shadow has gone quiet, which `05-CONTEXT.md` D-13 rules on and plan 05-11 implements. It did not block this scenario -- it helps it, in fact, because the heartbeat's `water_level: 3` stays on the tile across the parked window instead of being reverted by a poll. The scenario's `Then the "Sump Pit Level" service reports "Water Level" as "40"` therefore rests on behaviour 05-11 is about to change. If 05-11 makes the poll take telemetry back during silence, that assertion should be re-checked: the parked poll never completes, so no poll body can reach the store, but the handover itself runs on a poll and the interaction deserves one look rather than an assumption.

## Verification

| Gate | Node v26.7.0 (default) | Node v22.22.2 (`/usr/bin/node`) |
| --- | --- | --- |
| `npm run check` | exit 0 | exit 0 |
| `npm run test:unit` | 1327 tests, 1327 pass, 0 fail | 1327 tests, 1327 pass, 0 fail |
| `npm run test:cucumber` | 93 scenarios, 954 steps, all pass | 93 scenarios, 954 steps, all pass |
| `npm run test:coverage:all` | exit 0, 100 / 100 / 100 | exit 0, 100 / 100 / 100 |
| `npm run test:coverage:direct` on the runtime pair | 100 / 100 / 100 | -- |
| `npm run fallow` | one clone group, `features/support/steps/hap.ts:113-124` and `:168-181`, pre-existing and unchanged | -- |

Node 24.x is not installed on this machine, so the gate ran on the two versions that are.

Baseline before this plan: 1321 unit tests, 92 scenarios, 937 steps. After: 1327, 93, 954.

## Known Stubs

None.

## Threat Flags

None. The plan installs no package; `package.json` and `package-lock.json` are unchanged. The three threats this plan carries dispositions for are covered: `T-05-29` by the arrival report and its no-clock-movement assertion, `T-05-30` by the latch and the mutation that removes it, `T-05-32` by the parked poll and the deleting mutation's pair result. `T-05-31` is re-asserted by the unchanged `A successful poll does not clear the shadow silence` scenario and the new `D-11` unit case. `T-05-33` holds: no timer was added, and the runtime's timer-freedom cases (`SYNC-05 arms no timer that outlives it`, `builds every collaborator without opening a connection, reading a file, or starting a timer`) still pass.

## User Setup Required

None.

## Next Phase Readiness

`SC-4`'s first half is delivered: a matching degradation now clears promptly, on the evidence that proves it. `CR-02` can be re-verified.

Two things the following plans should carry:

- **05-10 (documentation).** `WR-05` says the README's "the plugin holds no value back while it waits" becomes true once `CR-01` and `CR-02` are both closed. Both are now closed, so the claim is available -- but the second half of that finding, the `No Response` restatement, is untouched here.
- **05-11 (telemetry ownership).** See the issue noted above about the new scenario's `Water Level` assertion.

`REQUIREMENTS.md`'s `RES-03` row is marked complete by this plan's requirement list. The reconciliation `05-CONTEXT.md` flags for `RES-01` and `RES-03` is still a phase close-out item and was not touched here.

## Self-Check: PASSED

Every file this summary names exists on disk, and every commit hash it names is in `git log`. Checked below.

---

_Phase: 05-degraded-operation-and-recovery_
_Completed: 2026-09-02_
