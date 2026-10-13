---
phase: 04-pump-records-and-official-controls
plan: 02
subsystem: api
tags: [homekit, hap, homebridge, cucumber, node-test, typescript, privacy]

requires:
  - phase: 04-pump-records-and-official-controls
    provides: the control binder, the command port, the pending set, the clearing push, and the System Self-Test row
provides:
  - "four ordered local refusals in the binder, each answering the HAP status that names its cause"
  - "`ControlBinderOptions.offlineConfirmed`, read from the same count the rows publish from"
  - "the 30-second pending window, its expiry, and the idempotent delete both ends share"
  - "`features/support/fakeTimers.ts`: controllable timers driven from the scenario clock"
  - "`src/accessories/alarmMute.ts`: the one home for the provisional mute contract"
  - "the `Alarm Mute` Switch row, sharing the self-test row's projection helper"
  - "`COMMAND_USER_AGENT` and the command-branch header policy in `src/cloud/api.ts`"
affects: [04-03, 04-04, 04-05, 04-06]

actuals:
  tokens: 102580
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "A refusal table: ordered predicates, each with the status it answers and the cause its log line names"
    - "A pending entry carries its own deadline handle, so expiry and confirmation are the same idempotent delete"
    - "The Cucumber harness supplies controllable timers, so a scenario observes deferred work by advancing its own clock"
    - "A gate-blocked contract lives in one module whose every export is `PROVISIONAL_`-named"

key-files:
  created:
    - src/accessories/alarmMute.ts
    - test/accessories/alarmMute.test.ts
    - features/support/fakeTimers.ts
  modified:
    - src/accessories/controls.ts
    - src/accessories/serviceCatalogue.ts
    - src/accessories/basementGuardian.ts
    - src/cloud/api.ts
    - features/support/world.ts
    - features/support/steps/controls.ts
    - features/officialControls.feature
    - test/accessories/controls.test.ts
    - test/accessories/serviceCatalogue.test.ts
    - test/accessories/basementGuardian.test.ts
    - test/cloud/api.test.ts
    - test/platform.test.ts

key-decisions:
  - "The `User-Agent` is the bare `PLUGIN_NAME`, with no version: no runtime version source exists under `src/`, and importing `package.json` would buy a packaging dependency and a drift risk for a fact the vendor cannot use."
  - "A refusal log line no longer names the device. A vendor `deviceId` reads `<account-id>_<serial-number>`, and an account identifier may not enter a log."
  - "The expiry scenario deliberately runs without the short poll interval, because with polls every 50 ms the next poll republishes reported state and the assertion passes whether or not the expiry did anything."
  - "The binder's accepted value is chosen per capability, so `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` governs both the value a write must carry and the value the command port is asked for."
  - "`controlValues` already took the capability as a parameter, so the plan-checker's blocker was pinned rather than fixed; three mutation classes prove the pin."

patterns-established:
  - "Refusal causes: one module-level ordered table, each row a named predicate plus the status and cause it answers"
  - "Deferred work in a scenario: `advanceClock` moves the clock and runs whatever that made due, with no sleep anywhere"
  - "A scenario that must prove work happened at a moment runs without the short poll interval, so a poll cannot supply the same answer later"

requirements-completed: [CTRL-03, CTRL-04, CTRL-05]

coverage:
  - id: D1
    description: "Every refusal cause answers the HAP status that describes it: -70412 for a non-on value, an undecoded reported field, and a confirmed-offline device; -70403 for a duplicate; -70402 for a vendor error; -70408 for an exceeded deadline."
    requirement: CTRL-05
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#answers each of the six refusal causes with the status that describes it"
        status: pass
    human_judgment: false
  - id: D2
    description: "A locally refused write sends no request at all, for all four local causes."
    requirement: CTRL-03
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#sends nothing at all for <each of four causes>"
        status: pass
      - kind: integration
        ref: "test/accessories/basementGuardian.test.ts#CTRL-03 refuses a self-test on a confirmed-offline device and sends nothing"
        status: pass
    human_judgment: false
  - id: D3
    description: "A self-test is permitted while every reported equipment fault is active; the binder reads confirmed-offline state and the capability's own reported value and nothing else."
    requirement: CTRL-03
    verification:
      - kind: integration
        ref: "test/accessories/basementGuardian.test.ts#CTRL-03 sends a self-test while every reported equipment fault is active"
        status: pass
    human_judgment: false
  - id: D4
    description: "A command is attempted exactly once; a refused, timed-out, or expired request produces no second request."
    requirement: CTRL-05
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#attempts <a vendor error | an exceeded deadline> exactly once and drops the pending entry"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#resumes reported state with one warning and no second request when the window closes"
        status: pass
      - kind: e2e
        ref: "features/officialControls.feature#A self-test the device never confirms returns the switch to what the device reports"
        status: pass
    human_judgment: false
  - id: D5
    description: "The 30-second window is per capability per accessory: one accessory's pending self-test withholds neither the other accessory's self-test nor mute on the same accessory."
    requirement: CTRL-05
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#holds one independent entry per capability, so clearing one leaves the other pending"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#sends <self-test | alarm-mute> on a second accessory while the first carries a pending request"
        status: pass
    human_judgment: false
  - id: D6
    description: "Withholding happens in the row: with only 'self-test' pending the alarm-mute row still projects On, with only 'alarm-mute' pending the self-test row still projects On, and each row does withhold for its own capability."
    requirement: CTRL-05
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#projects the reported On on the <system-self-test | alarm-mute> row while only <other> is pending"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#projects no On at all while <system-self-test | alarm-mute> carries an unresolved request"
        status: pass
    human_judgment: false
  - id: D7
    description: "Both control Switches publish from the first update even when their reported field has never decoded, each carrying StatusActive = false until its own field decodes."
    requirement: CTRL-04
    verification:
      - kind: integration
        ref: "test/accessories/basementGuardian.test.ts#D-03 publishes the alarm mute switch on the first update even though alarm_audio_muted never decoded"
        status: pass
    human_judgment: false
  - id: D8
    description: "When the window closes with no confirming report the row resumes projecting reported state, one warning names the capability, and nothing is retried. StatusActive is not used to mark it."
    requirement: CTRL-05
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#resumes reported state with one warning and no second request when the window closes"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#ignores a confirming report that lands after the window already closed"
        status: pass
      - kind: e2e
        ref: "features/officialControls.feature#A self-test the device never confirms returns the switch to what the device reports"
        status: pass
    human_judgment: false
  - id: D9
    description: "Alarm Mute follows the reported alarm_audio_muted, the only value ever sent for it is the provisional constant, and no duration, timer, schedule, or unmute exists anywhere in the mute path."
    requirement: CTRL-04
    verification:
      - kind: unit
        ref: "test/accessories/alarmMute.test.ts#requests exactly true and nothing else for alarm mute"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes no row, subtype, or display name naming <Duration | Timer | Schedule | Unmute>"
        status: pass
      - kind: integration
        ref: "test/accessories/basementGuardian.test.ts#CTRL-04 answers <-70412 | -70403> for a write of <false | true> ... and sends nothing"
        status: pass
    human_judgment: false
  - id: D10
    description: "Every mute constant is PROVISIONAL_-named and lives in one module, so closing G-001 is a single reviewable edit."
    requirement: CTRL-04
    verification:
      - kind: unit
        ref: "test/accessories/alarmMute.test.ts#names every export it declares as provisional"
        status: pass
      - kind: unit
        ref: "test/accessories/alarmMute.test.ts#is the only module under src that declares a constant governing alarm mute"
        status: pass
    human_judgment: false
  - id: D11
    description: "A command request declares exactly Authorization, Content-Type, User-Agent, and Accept; a read request declares exactly Authorization; the User-Agent is the plugin name alone and reveals nothing about the installation."
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#declares exactly four headers on a command request"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#declares only the bearer token on a read request"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#identifies the plugin by its own name and nothing else"
        status: pass
    human_judgment: false
  - id: D12
    description: "A refusal log line names the capability and a cause and carries no token, URL, or device identifier."
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#names the capability in every refusal line and quotes no token, URL, or device identifier"
        status: pass
    human_judgment: false
  - id: D13
    description: "What Apple Home draws for a refused Alarm Mute press, and whether a real Gemini acknowledges a mute at all, how fast it reports the state, how long the mute lasts, and what it does on failure."
    requirement: CTRL-04
    verification: []
    human_judgment: true
    rationale: "G-001. Nobody has observed a real Gemini's mute behaviour. Nothing in this environment can observe it, and the plugin ships the whole contract as named provisional constants because of that."

duration: 290 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 02: The rest of the command lifecycle Summary

**Every way a control write can end now answers the HAP status that names it and sends nothing it should not, an unconfirmed request returns its Switch to reported state after thirty seconds without retrying, the `Alarm Mute` Switch ships with its whole unverified contract in one `PROVISIONAL_`-named module, and the plugin's first body-carrying request identifies itself by name and says nothing else about the installation.**

## Performance

- **Duration:** 290 min
- **Tasks:** 3
- **Files created:** 3
- **Files modified:** 12

## Accomplishments

- The binder answers six refusal causes. Four are local and reach nothing: a value that is not the capability's one accepted value, a capability whose reported field has not decoded, a confirmed-offline device, and a duplicate. Two are the vendor's. Each is a named predicate in one ordered table carrying the status it answers and the cause its log line states.
- `offlineConfirmed` is now injected into the binder from the same `offlineCount >= offlineThreshold` expression the rows publish from, extracted into one named function in the accessory, so a row and a write cannot disagree about reachability.
- A pending entry carries the handle of its own 30000 ms deadline. Expiry and confirmation are the same idempotent delete, so whichever runs first wins and the second changes nothing. The expiry republishes the control rows, warns once, and retries nothing.
- `features/support/fakeTimers.ts` gives the Cucumber harness controllable timers measured against the scenario clock. `advanceClock` moves the clock and runs whatever that made due, so a scenario observes the window closing with no sleep and no race against a process timer.
- `src/accessories/alarmMute.ts` holds the one thing the plugin assumes about alarm mute. The binder reads it for both the value a write must carry and the value it sends, so closing `G-001` is one edit.
- The catalogue publishes an `Alarm Mute` Switch through the same `controlValues` helper the self-test row uses, parameterised by capability, and a command request now declares `User-Agent` and `Accept` on the body-carrying branch alone.

## Task Commits

1. **Task 1: every remaining refusal cause and the status that describes it**
   - `0bf99fd` `test(04): require the local control refusals` — RED, 2 failing cases
   - `2dcae2f` `feat(04): refuse every remaining control cause locally` — GREEN
2. **Task 2: the 30-second pending window, its expiry, and the controllable timers**
   - `e4c5c36` `test(04): require the pending window and its expiry` — RED, 3 failing cases
   - `d7dc3f0` `feat(04): close an unconfirmed control request after 30 seconds` — GREEN
3. **Task 3: the Alarm Mute Switch, its provisional constants, and the header policy**
   - `198526e` `test(04): require the alarm mute row and the command headers` — RED, 6 failing cases
   - `d80b13a` `feat(04): publish the alarm mute switch and identify the plugin` — GREEN

Every commit was verified non-empty with `git show --name-only --format="" HEAD`. Each was made with a plain `git commit` after `pre-commit run --files <changed files>` came back clean; the GSD commit handler was not used, per the tooling hazard recorded in STATE.md.

## Files Created/Modified

Created:

- `src/accessories/alarmMute.ts` — `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE`, and the file overview naming `G-001` and the four unobserved behaviours
- `test/accessories/alarmMute.test.ts` — the export-naming rule, the value, and the source scan that keeps the contract in one module
- `features/support/fakeTimers.ts` — `createFakeTimers`, a `Timers` implementation measured against an injected clock

Modified:

- `src/accessories/controls.ts` — `offlineConfirmed`, the four local refusals and their table, `acceptedValueOf`, `PENDING_WINDOW_MS`, the pending map, `resolvePending`, `expire`
- `src/accessories/serviceCatalogue.ts` — the `alarm-mute` row and the strengthened comment on `controlValues`
- `src/accessories/basementGuardian.ts` — the `offlineConfirmed` function and its two consumers, the `alarm-mute` entry in `CONTROLS`
- `src/cloud/api.ts` — `COMMAND_USER_AGENT` and the command-branch headers
- `features/support/world.ts` — the controllable timers, `advanceClock` running due handlers, the revised `discoveryContext` comment
- `features/support/steps/controls.ts` — the step that moves past the pending window
- `features/officialControls.feature` — the expiry scenario, and `a short poll interval` moved from the Background to the two scenarios that need it
- `test/accessories/controls.test.ts` — the six-cause table and every case read off it, the window cases, the isolation cases
- `test/accessories/serviceCatalogue.test.ts` — the `CONTROL_ROWS` table and the cross-capability projection cases
- `test/accessories/basementGuardian.test.ts` — the equipment-fault case, the confirmed-offline case, and the four `Alarm Mute` cases
- `test/cloud/api.test.ts` — the header-recording stub and the four header cases
- `test/platform.test.ts` — one line in the published-service-name list

## Decisions Made

**The header policy, and why.** `COMMAND_USER_AGENT` is `PLUGIN_NAME` and nothing else, so exactly one product string exists in the codebase and no second one can drift from it. It carries no version, because no runtime version source exists under `src/`: `package.json` is imported nowhere at run time, and adding that import would create a packaging dependency and a drift risk in exchange for a fact the vendor cannot act on. It carries no hostname, operating-system detail, bridge name, account identifier, or device identifier, and it does not present the plugin as the official vendor application. `Accept: application/json` joins it, because the plugin does read the answer as JSON.

Both headers are declared on the body-carrying branch of `requestInit` alone. Adding either to the read branch would change every read request's wire shape as a side effect of a decision about commands. The Auth0 token exchange and the AWS IoT SigV4 WebSocket handshake gained nothing and stay out of scope.

**A refusal log line no longer names the device.** Wave 1 shipped `Refused ${capability} on ${deviceId}: ...`. A vendor `deviceId` reads `<account-id>_<serial-number>`, so that line put an account identifier into a log, which `CLAUDE.md`'s privacy constraint forbids. The lines now name the capability and a cause. The trade is real: an owner with two systems cannot tell from the line which one refused. The privacy constraint is the harder rule, and the plan's own acceptance criterion asks for exactly this.

**The expiry scenario runs without the short poll interval.** See "Defect reintroduction" below — with polls every 50 ms the scenario passed with the expiry's republish removed, because the next poll supplied the same answer a moment later. Without the short interval the next poll is fifteen minutes away and the closing window is the only thing that can push the value, which is what makes the assertion mean what it says.

**The blocker the plan-checker raised was already pinned, not fixed.** Wave 1's `controlValues` already took `capability` as a parameter and read it on every call. Nothing needed changing; what was missing was the evidence. Three mutation classes now fail against the three criteria — see the table.

## Defect reintroduction — what was watched to fail

Phase constraint: a green suite is not evidence. Each claim below was proven by putting the defect back and watching the named case fail, then restoring and re-running.

| Claim | Defect reintroduced | Cases that failed |
|---|---|---|
| An **undecoded** reported field is refused | `hasNoFreshState` narrowed so it never applies | 4, incl. `sends nothing at all for a capability whose reported field has not decoded` |
| A **confirmed-offline** device is refused | `isConfirmedOffline` narrowed so it never applies | 4, incl. `sends nothing at all for a device confirmed offline` |
| A **duplicate** request is refused | `isAlreadyActive` narrowed so it never applies | 4, incl. `sends nothing at all for a duplicate request while the capability already reads active` |
| A local refusal **sends nothing** | the local refusal moved to after `commands.send` | 5, incl. all four `sends nothing at all for …` |
| The accessory hands the binder its **real** offline state | `offlineConfirmed: () => false` at the binder wiring | `CTRL-03 refuses a self-test on a confirmed-offline device and sends nothing` |
| A refusal line quotes **no device identifier** | `deviceId` put back into the log line | `names the capability in every refusal line and quotes no token, URL, or device identifier` |
| The closed window **republishes** | `republish()` removed from `expire` | `resumes reported state with one warning and no second request when the window closes`; the expiry scenario |
| The closed window **drops the entry** | `requested.delete` → `requested.has` in `expire` | the same unit case and the expiry scenario |
| Withholding reads the **row's own** capability | `pendingControls.has('self-test')` hard-coded | `projects no On at all while alarm-mute…`, `projects the reported On on the alarm-mute row while only self-test is pending` |
| Withholding is **not** "any control pending" | `pendingControls.size > 0` | both `projects the reported On on the … row while only … is pending` cases |
| Withholding **happens at all** | the pending check removed entirely | both `projects no On at all while … carries an unresolved request` cases |
| The command headers are **command-only** | `User-Agent` and `Accept` added to the read branch | `declares only the bearer token on a read request` |
| The user agent carries **no version** | `${PLUGIN_NAME}/1.0.0` | `identifies the plugin by its own name and nothing else`, `declares exactly four headers on a command request` |
| The **provisional constant** governs both the accepted and the sent value | the constant set to `false` | `requests exactly true and nothing else for alarm mute` plus both `CTRL-04 answers …` cases |
| The mute contract lives in **one module** | a second `PROVISIONAL_ALARM_MUTE_DURATION_MS` declared in `controls.ts` | `is the only module under src that declares a constant governing alarm mute` |

**One of these found a real hole rather than confirming one.** The first form of the expiry scenario kept the Background's `a short poll interval`. Removing `republish()` from `expire` left it **green**: the entry was still deleted, so the next 50 ms poll published `On = false` and the waiting step was satisfied a moment later than it should have been. The scenario proved the entry was dropped and nothing about the republish. It now runs on the default fifteen-minute poll interval, and the same defect fails it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] A refusal log line carried an account identifier**

- **Found during:** Task 1
- **Issue:** Wave 1's refusal lines read `Refused ${capability} on ${deviceId}: …`. A vendor `deviceId` is `<account-id>_<serial-number>`, and `CLAUDE.md` forbids an account identifier entering a log. The plan's own log-content criterion asks that no line contain the device identifier used in the fixture.
- **Fix:** Both refusal lines name the capability and a cause only. The wave-1 case asserting the old text was updated.
- **Files modified:** `src/accessories/controls.ts`, `test/accessories/controls.test.ts`
- **Verification:** Putting `deviceId` back fails `names the capability in every refusal line and quotes no token, URL, or device identifier`.
- **Committed in:** `2dcae2f`

**2. [Rule 3 - Blocking] The `Alarm Mute` row needed accessory wiring the plan's task-3 file list omitted**

- **Found during:** Task 3
- **Issue:** Task 3's `<files>` names the catalogue and the binder but not `src/accessories/basementGuardian.ts`. Without an `alarm-mute` entry in the accessory's `CONTROLS` map the Switch publishes but accepts no write, and the plan's own criteria for a refused mute write cannot be met.
- **Fix:** One entry, `['alarm-mute', { capability: 'alarm-mute', field: 'muted' }]`. Both files are in the plan's `files_modified`.
- **Files modified:** `src/accessories/basementGuardian.ts`, `test/accessories/basementGuardian.test.ts`
- **Verification:** The four `CTRL-04` accessory cases.
- **Committed in:** `d80b13a`

**3. [Rule 3 - Blocking] `test/platform.test.ts` asserts the published service-name list**

- **Found during:** Task 3
- **Issue:** A seventeenth published service fails a whole-list assertion in a file the plan does not name. It is not in plan 04-03's declared file list either, so there is no collision.
- **Fix:** One line added to the expected list.
- **Files modified:** `test/platform.test.ts`
- **Verification:** `npm run check` green.
- **Committed in:** `d80b13a`

**4. [Rule 1 - Bug] The expiry scenario passed with the expiry's republish removed**

- **Found during:** Task 2, mutation checking
- **Issue:** With the Background's 50 ms poll interval the next poll published the same value, so the scenario could not tell a working expiry from one that only deleted the entry.
- **Fix:** `Given a short poll interval` moved out of the Background into the two scenarios that need it; the expiry scenario runs on the default interval, where no second poll occurs.
- **Files modified:** `features/officialControls.feature`
- **Verification:** The defect now fails the scenario by name.
- **Committed in:** `d7dc3f0`

**5. [Rule 3 - Blocking] `resolvePending`'s no-op branch was uncovered**

- **Found during:** Task 2, the coverage gate
- **Issue:** `reconcile` reaches `resolvePending` for a never-pending capability only when the reported value is `undefined`, which no case drove, leaving the pair at 97.44% branches.
- **Fix:** The never-pending reconcile case became three sibling cases, one per reported value, each also asserting no cancel was issued. `resolvePending` returns `void` rather than an unused boolean.
- **Files modified:** `src/accessories/controls.ts`, `test/accessories/controls.test.ts`
- **Verification:** 100% direct line, branch, and function coverage on the pair.
- **Committed in:** `d7dc3f0`

**6. [Rule 3 - Blocking] Two log stand-ins were byte-identical**

- **Found during:** Task 2
- **Issue:** The warning-collecting `Logging` stub was written out twice in `controls.test.ts`, which is the shape `fallow dupes` reports at a zero baseline.
- **Fix:** One `warningLog(warnings)` helper, used by both.
- **Files modified:** `test/accessories/controls.test.ts`
- **Verification:** `npm run fallow` reports only the pre-existing `steps/hap.ts` clone group.
- **Committed in:** `d7dc3f0`

---

**Total deviations:** 6 auto-fixed (3 blocking, 1 missing critical, 1 bug, 1 blocking gate). **Impact:** every one was needed for the plan's own claims to hold or for a repository gate to pass. No scope creep: the pump records, the accessory store, and the remaining `CTRL-05` cloud outcomes stay where the later plans put them.

## Issues Encountered

**Two acceptance criteria could not be met at the layer they name.** Task 1 asks for a binder-level test that "resolves the underlying cloud call with a body whose `success` is `false`" and one that "aborts the underlying cloud call through the deadline". The binder does not see a cloud call; it sees a `CommandPort`. Reproducing the cloud-answer-to-failure mapping inside `controls.test.ts` would be a second copy of production logic asserting against itself.

What was done instead: the mapping is pinned where it lives, in `test/runtime/accountRuntime.test.ts` — `reports a vendor error for a resolved body the vendor refused` and `reports a timeout when the deadline aborted the attempt`, both shipped in wave 1 and both still green. The binder-level halves — that a `vendor-error` outcome answers -70402, that a `timed-out` outcome answers -70408, and that exactly one request was attempted in each case — are `attempts a vendor error exactly once and drops the pending entry` and its companion. The end-to-end composition through a real refused or slow vendor response is `D-15`'s work in a later plan, which is where `fakeRestApi.ts` gains `rejectNextCommand` and `holdNextCommand`.

**One task-2 criterion was already satisfied.** "A test asserts the control row projects the reported boolean for `On` after the expiry handler has run, using the same `ProjectionInput` shape but a pending set that no longer holds the capability" is `projects the reported test_running of <true|false> onto On while nothing is pending`, which wave 1 shipped. No duplicate was added.

**The TDD commit shape.** All three tasks got a real `test(04):` → `feat(04):` pair, with 2, 3, and 6 genuinely failing cases respectively. The parts that could not compile before their declarations existed — `alarmMute.test.ts`, and the `COMMAND_USER_AGENT` cases — landed with the `feat` commit and were proven by mutation instead, as recorded in the table.

## Follow-ups for the phase owner

- `.planning/todos/pending/2026-08-31-define-cloud-request-header-policy.md` is still on disk. The policy it asks for is now decided, implemented, and asserted; the todo can be closed.
- `src/platform.ts:82` and `src/accessories/reconciliation.ts:91` log a `deviceId`, which carries an account identifier for the same reason the binder's lines no longer do. Both are outside this plan's scope and were left alone.
- `CHANGELOG.md` was not touched. `CLAUDE.md` asks for that before a PR, not per plan, and `04-01` did the same.

## Self-Check: PASSED

- `src/accessories/alarmMute.ts`, `test/accessories/alarmMute.test.ts`, `features/support/fakeTimers.ts` — all present on disk.
- Commits `0bf99fd`, `2dcae2f`, `e4c5c36`, `d7dc3f0`, `198526e`, `d80b13a` — all present in `git log`, all non-empty.
- Gates at `d80b13a`: `npm run check` green (1106 unit tests, 65 Cucumber scenarios, 583 steps); `npm run test:coverage:all` at 100/100/100 over every `src/` module; the four focused pairs named in the plan's verify blocks each at 100/100/100; `npm run fallow` reports no health or dead-code finding and only the pre-existing `features/support/steps/hap.ts` clone group.
