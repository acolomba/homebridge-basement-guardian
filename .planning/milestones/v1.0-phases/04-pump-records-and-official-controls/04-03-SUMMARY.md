---
phase: 04-pump-records-and-official-controls
plan: 03
subsystem: api
tags: [homekit, hap, homebridge, persistence, node-test, typescript]

requires:
  - phase: 03-safety-monitoring-in-homekit
    provides: the custom characteristic and service factories, the pump service, and the hand-built HAP stand-in
  - phase: 04-pump-records-and-official-controls
    provides: the pinned `@homebridge/hap-nodejs` devDependency and the single-importer fidelity test
provides:
  - "`ObservationStartedAt`, `ObservedActivationCount`, `LastObservedActivationAt`, `LastActivationWasTestActivity`, all read-only and all optional on `PumpService`"
  - "`uint32` in the characteristic declaration format union, and `UINT32` in the HAP stand-in"
  - "a demonstration against the real pinned HAP that a narrow numeric format clamps rather than refuses"
  - "`src/runtime/accessoryStore.ts`: the one-method persist port, with no implementation of its own"
  - "`AccessoryContext.primaryPump`, `.backupPump` and `.watermarks` reconciled to optional, with the stored units written down"
  - "`PumpObservation.lastActivationWasTestActivity`"
  - "`src/accessories/pumpRecords.ts`: the epoch, the watched edge, the de-duplicated recovery, the watermarks, and the self-test label"
affects: [04-04, 04-05, 04-06]

actuals:
  tokens: 35363
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "A published characteristic is looked up in its test by the key it is published under, as a plain string, so the test table pins the declared set instead of following the interface"
    - "A unit a type cannot express is asserted against the source docblock that states it"
    - "A port with no process-wide implementation is gated by asserting its compiled module exports nothing"

key-files:
  created:
    - src/runtime/accessoryStore.ts
    - src/accessories/pumpRecords.ts
    - test/runtime/accessoryStore.test.ts
    - test/accessories/pumpRecords.test.ts
  modified:
    - src/accessories/customCharacteristics.ts
    - src/accessories/customServices.ts
    - src/persistence/accessoryContext.ts
    - features/support/fakeHap.ts
    - test/accessories/customCharacteristics.test.ts
    - test/accessories/customServices.test.ts
    - test/accessories/hapWriteFidelity.test.ts
    - test/persistence/accessoryContext.test.ts

key-decisions:
  - "Classification waits for BOTH device timestamps to be stable, so the label is withheld through the fourth phase of the measured table and lands on the observation after it. The plan's own behaviour spec says both; its acceptance criterion says the fourth phase. The fourth phase is the observation in which the self-test timestamp moves, so it cannot also be the observation at which that value has been stable."
  - "The line about an unreadable stored record names no device. The vendor `deviceId` reads `<account-id>_<serial-number>`, and an account identifier may not enter a log."
  - "Reading a record before the first observation throws rather than answering a zero count and an epoch of 1970. The accessory observes a snapshot before it publishes one, so a read before that is a wiring mistake and answering it would publish both defaults as fact."
  - "The characteristic test looks a class up by the key it is published under, as a plain string, rather than through `keyof CustomCharacteristics`. A renamed interface member now fails the table instead of silently following the rename."
  - "The epoch is the first snapshot's own receipt time, so the module takes no clock at all and no second time source exists for the record to disagree with."

patterns-established:
  - "Look a published type up by its published key as a string, so the test table is what pins the declared set"
  - "State a unit in the docblock of the field that holds it, and assert that docblock from the test, because no type carries a unit"
  - "Prove a port carries no implementation by asserting its compiled module's export list is empty"

requirements-completed: [CTRL-01]

coverage:
  - id: D1
    description: "The activation count publishes on `uint32`, and the reason is demonstrated against the real pinned HAP rather than argued: a numeric characteristic declared with the narrow format and a maximum of 255 answers 255 after a push of 256, while one declared wide answers 256."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/hapWriteFidelity.test.ts#clamps a count past 255 on the narrow numeric format and keeps it whole on the wide one"
        status: pass
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#counts observed activations on a format wide enough that HAP cannot clamp the number"
        status: pass
    human_judgment: false
  - id: D2
    description: "Four read-only record characteristics exist, each with a fixed v4 identifier outside Apple's base namespace, each with exactly `pr` and `ev`, and every identifier the factory returns is distinct."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#publishes every pump record read-only and outside the Apple base namespace"
        status: pass
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#identifies every vendor-defined characteristic distinctly"
        status: pass
    human_judgment: false
  - id: D3
    description: "No record display name presents the number as a whole-of-life or device-reported figure, and the count's own name says the number is what the plugin observed."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#claims no whole-of-life or device-reported figure in any pump record name"
        status: pass
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#says in the count name itself that the number is what the plugin observed"
        status: pass
    human_judgment: false
  - id: D4
    description: "All four are optional on `PumpService` and none is constructed before a record writes it; the service's required list still holds `Pump Running` alone."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/customServices.test.ts#declares every pump record optional, so none is constructed before a record writes it"
        status: pass
      - kind: unit
        ref: "test/accessories/customServices.test.ts#carries the exact vendor facts PumpService always reports as required characteristics"
        status: pass
    human_judgment: false
  - id: D5
    description: "The persist port declares one method, carries no implementation, and has no process-wide instance; the compiled module exports nothing."
    verification:
      - kind: unit
        ref: "test/runtime/accessoryStore.test.ts#exports no runtime value, so the port carries no implementation of its own"
        status: pass
    human_judgment: false
  - id: D6
    description: "The three record members are optional, so the context an installation restored from before this release carries typechecks, and the stored units are written down where they are stored."
    verification:
      - kind: unit
        ref: "test/persistence/accessoryContext.test.ts#states the unit of the last observed activation time and both of the sources it comes from"
        status: pass
      - kind: unit
        ref: "test/persistence/accessoryContext.test.ts#states that both watermarks hold the device Unix seconds and are never compared against local time"
        status: pass
    human_judgment: false
  - id: D7
    description: "An activation is a false-to-true transition the module watched. A run already in progress at the first snapshot is not counted, a run reported twice is counted once, and an undecoded running value neither counts nor clears."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#does not count a run already in progress at the first snapshot after start"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#counts one activation for a run reported on two consecutive snapshots"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#counts an activation across a snapshot whose running value did not decode"
        status: pass
    human_judgment: false
  - id: D8
    description: "A device timestamp past the watermark recovers exactly one activation and is converted to milliseconds at that one boundary; a repeated identical timestamp recovers nothing; the primary pump has no recovery path at all."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#recovers one activation from a device timestamp and stores it in milliseconds"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#recovers nothing and asks for no write from a repeated identical device timestamp"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#recovers nothing at all for the primary pump, which the device never timestamps"
        status: pass
    human_judgment: false
  - id: D9
    description: "The device timestamp that follows a watched backup edge is absorbed: the watermark moves, the count does not, and the last activation stays at the receipt time the watched edge recorded."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#absorbs the device timestamp that follows a watched backup activation"
        status: pass
    human_judgment: false
  - id: D10
    description: "The self-test label is computed only once the test reports finished and both device timestamps have settled, comparing the two device values with each other; it abstains and keeps its previous value when an input did not decode."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#withholds the self-test label until both device timestamps have settled"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#labels the last activation as not self-test activity when the backup timestamp stays newer"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#labels the last activation as self-test activity when the self-test timestamp caught up exactly"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#keeps the self-test label it already carries when the self-test timestamp did not decode"
        status: pass
    human_judgment: false
  - id: D11
    description: "One write is asked for when a stored value actually changed and none otherwise, a resumed record asks for no write of its own, and one observation schedules nothing at all."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#asks for one write for a counted activation and none for an unchanged snapshot"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#resumes a stored record and asks for no write of its own"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#schedules nothing at all across one observation"
        status: pass
    human_judgment: false
  - id: D12
    description: "A stored record that fails its structural check is replaced by a fresh observation start and named once in the log, in a line carrying no device or account identifier."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#starts observation again and says so once for <eleven damaged shapes>"
        status: pass
      - kind: unit
        ref: "test/accessories/pumpRecords.test.ts#names no device or account identifier in the line about an unreadable record"
        status: pass
    human_judgment: false
  - id: D13
    description: "What Apple Home draws for a pump service that gained four characteristics after it was already published, and whether a real installation's restored accessory adopts them without a HAP warning."
    requirement: CTRL-01
    verification: []
    human_judgment: true
    rationale: "Nothing here has met a real Homebridge cache. The accessory-side repair guard that suppresses the warning is Phase 3 code and is not exercised by this plan; the wiring that pushes these characteristics is a later plan's work."

duration: 60 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 03: Pump records Summary

**Each pump now carries a persisted observation start, a count of the activations this plugin actually watched, and the time of the last one, on characteristics whose own names say the number is not a device total and on a format wide enough that HAP cannot quietly stop the count advancing.**

## Performance

- **Duration:** 60 min
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 8

## Accomplishments

- Four read-only record characteristics now sit on the existing `PumpService` as optional members, under its unchanged subtype. `ensureService` gates a row on its projection length, and that gate is sound only while every required characteristic comes from a scope the row still publishes from. The record values come from the accessory's own observation rather than from the `pump` scope, so declaring one required would have constructed it at HAP's format default the moment the row published its pump boolean, presenting a count of zero and an empty observation start as fact.
- The count publishes on `uint32`, and the reason is now a case rather than an argument. Against the real pinned package, a characteristic declared `uint8` with a maximum of 255 answers **255** after a push of 256; one declared `uint32` answers 256. HAP clamps rather than refuses, so a too-narrow count would have stopped advancing and kept reading as a fact about the basement.
- `src/runtime/accessoryStore.ts` is one interface with one method and no implementation, and it deliberately has no process-wide instance to go with it, unlike the clock and the timers. Its test asserts the compiled module's export list is empty, which is what proves no consumer can reach a shared store through it.
- `AccessoryContext`'s three record members became optional, which is what an installation restored from before this release actually carries. Every observation member is new in this release, so the only migration that exists is absent to seeded.
- `src/accessories/pumpRecords.ts` holds the whole runtime behaviour behind those types: the epoch taken from the first snapshot's own receipt time, the watched false-to-true edge, the de-duplicated recovery from the device timestamp, the absorption that keeps one physical run from being counted twice, and the self-test label that abstains rather than asserting.
- The device's Unix seconds are converted to milliseconds at exactly one place, and the test that pins it uses receipt times two decades away from the device values, so a mutation that stored the receipt time instead of the converted device time fails rather than coinciding.

## The published identities

Generated once with `node -e "console.log(require('node:crypto').randomUUID())"` and hard-coded. None may ever change.

| Key | UUID | Format | Display name |
|---|---|---|---|
| `ObservationStartedAt` | `f36376db-47a7-4c59-a76f-6bdc234d5634` | `string` | `Observation Start` |
| `ObservedActivationCount` | `88734156-8e55-4697-af69-68e9576d1352` | `uint32` | `Activations Observed Since Observation Start` |
| `LastObservedActivationAt` | `39226a7e-0b92-4f41-b9a4-a602cdc8cca3` | `string` | `Last Observed Activation At` |
| `LastActivationWasTestActivity` | `217042ab-ad7e-481b-8e7e-2510e9ad74d9` | `bool` | `Last Activation Was Self-Test` |

Two further v4 identifiers, `951ad4d2-c092-4ec6-ab9f-f024662219e5` and `f0e7799e-4687-4bb7-b594-6fd52a084625`, exist inside the clamping case alone. Neither is a published identity and neither reaches an accessory.

## Task Commits

1. **Task 1: the four record characteristics, the `uint32` format, and their optional place on `PumpService`**
   - `8cb08b2` `test(04): require the pump record characteristics` — RED, 22 failing cases
   - `2392526` `feat(04): publish the pump record characteristics` — GREEN
2. **Task 2: the persist port and the record types**
   - `8cced52` `test(04): require the record types to state their units` — RED, 4 failing cases
   - `c9e456f` `feat(04): add the persist port and reconcile the record types` — GREEN
3. **Task 3: the records module**
   - `98d7858` `feat(04): count what the plugin watched each pump do`

Every commit was verified non-empty with `git show --name-only --format="" HEAD`. Each was made with a plain `git commit` after `pre-commit run --files <changed files>` came back clean; the GSD commit handler was not used, per the tooling hazard recorded in STATE.md.

**The TDD commit shape.** Tasks 1 and 2 got a real `test(04):` → `feat(04):` pair. Task 1's RED works because the test table names each characteristic by the plain string key it is published under rather than through `keyof CustomCharacteristics`, so the cases compile before the members exist. Task 2's RED works because the claims a type cannot carry — the unit a stored time is in — are asserted against the source docblock. Task 3 could not have a compiling RED: its test file names a module that did not exist, and `npm typecheck` is a pre-commit hook. It shipped as one `feat` commit and was proven by mutation instead, as recorded below.

## Defect reintroduction — what was watched to fail

A green suite is not evidence. Each claim was proven by putting the defect back, watching the named case fail, restoring, and re-running.

| Claim | Defect reintroduced | Cases that failed |
|---|---|---|
| The count sits on a format HAP **cannot clamp** | `ObservedActivationCount` declared `uint8` | `declares ObservedActivationCount as a read-only uint32 …`, `counts observed activations on a format wide enough that HAP cannot clamp the number` |
| The stand-in's `UINT32` **matches** the real enum | `FakeFormats.UINT32` set to `'uint-32'` | `carries the same format names the real enum carries` |
| The records are **optional** on the pump service | `ObservationStartedAt` moved into `required` | `carries the exact vendor facts PumpService always reports as required characteristics`, `declares the characteristics only some PumpService subtypes carry as optional`, `declares every pump record optional, …` |
| A run **already in progress** is not counted | `watchedAnActivation` widened to `previousRunning !== true` | `does not count a run already in progress at the first snapshot after start` |
| The watermark comparison is **strictly** greater-than | `>` changed to `>=` | `recovers nothing and asks for no write from a repeated identical device timestamp`, `advances the self-test watermark when the label it computes is the one already stored` |
| A watched edge and its later timestamp are **one** activation | the absorption branch removed from `reconcileBackupTimestamp` | `absorbs the device timestamp that follows a watched backup activation` |
| An undecoded self-test input **does not assert** not-a-test | `classifiedAsTestActivity` returns `false` instead of `undefined` | 15 cases, incl. `keeps the self-test label it already carries when the self-test timestamp did not decode` |
| The device timestamp is **converted** to milliseconds | `millisecondsOf(reportedAt)` replaced by `reportedAt` | `recovers one activation from a device timestamp and stores it in milliseconds` |
| A write happens **only on a change** | `store.persist()` called unconditionally | 4 cases, incl. `asks for one write for a counted activation and none for an unchanged snapshot`, `resumes a stored record and asks for no write of its own` |
| An undecoded running value **neither counts nor clears** | `rememberedRunning` returns the reported value | `counts an activation across a snapshot whose running value did not decode` |
| Classification waits for **both** device values to settle | the self-test stability check removed | `withholds the self-test label until both device timestamps have settled` |
| The epoch is the **first snapshot's own receipt time** | the backup epoch seeded at `0` | 13 cases, incl. `seeds a fresh observation start from the first snapshot it ever sees` |
| The self-test timestamp **catching up exactly** is test activity | `>=` changed to `>` | `labels the last activation as self-test activity when the self-test timestamp caught up exactly` |

**One of these found a real hole rather than confirming one.** The `>=` to `>` mutation on the self-test comparison **survived** the first run of the suite at 100% line, branch, and function coverage: no fixture had the two device timestamps landing on the same second, which is the exact case the word "catches up" names in the measured hardware notes. A run misclassified there would be labelled ordinary basement activity for a self-test. The case `labels the last activation as self-test activity when the self-test timestamp caught up exactly` was added, and the same mutation now fails it.

## Files Created/Modified

Created:

- `src/runtime/accessoryStore.ts` — `AccessoryStore`, one method, no implementation and no process-wide instance
- `src/accessories/pumpRecords.ts` — `createPumpRecords` and the five rules behind it: `watchedAnActivation`, `rememberedRunning`, `evidencesAMissedActivation`, `millisecondsOf`, `classifiedAsTestActivity`
- `test/runtime/accessoryStore.test.ts` — the architectural gate over the port's empty export list
- `test/accessories/pumpRecords.test.ts` — 31 cases, hand-written stand-ins for the store and the log, no mocking library

Modified:

- `src/accessories/customCharacteristics.ts` — `'uint32'` in the format union and the format record, four identity constants, four interface members, four declarations
- `src/accessories/customServices.ts` — the four on `PumpService`'s optional list, and the comment stating why none may be required
- `src/persistence/accessoryContext.ts` — the three members optional, the unit and both sources on `lastActivationAt`, the new classification member, Unix seconds and the never-against-local-time rule on the watermarks
- `features/support/fakeHap.ts` — `UINT32` on `FakeFormats` and on `FORMATS`
- `test/accessories/customCharacteristics.test.ts` — the four table rows, the string-key lookup, and five record-scoped cases
- `test/accessories/customServices.test.ts` — the four display names on `PumpService`'s optional list, and the never-constructed case
- `test/accessories/hapWriteFidelity.test.ts` — the clamping demonstration and the format-name pin
- `test/persistence/accessoryContext.test.ts` — the four docblock cases and the first-run context that must typecheck

## Decisions Made

**Classification waits for both device timestamps, so the label lands after the fourth phase.** The plan's `<behavior>` says the rule runs when both device values "were the same numbers on the immediately preceding observation"; its acceptance criterion says the label is `true` "at" the fourth phase. Those cannot both hold: the fourth phase of the measured table is precisely the observation in which the self-test timestamp moves, so it is the first observation carrying that value rather than the second. The behaviour spec was followed, because it is the conservative reading and it matches `constraints.md:501` verbatim ("Wait until `test_running` is false and both values are stable"). The case drives all four phases and one further snapshot carrying the settled values, and asserts the label is withheld through the fourth and appears at the fifth. The cost is one poll interval of delay on a label that decorates a record; the alternative would classify from a value the module has seen once.

**The unreadable-record line names no device.** The plan asks for "one line ... naming the device". A vendor `deviceId` reads `<account-id>_<serial-number>`, and `CLAUDE.md`'s privacy constraint forbids an account identifier entering a log — the same correction wave 2 made to the control refusal lines. The options this module takes carry no identifier at all, so the line states the fact and nothing more, and a case asserts the line quotes nothing identifier-shaped. The trade is real: an owner with two systems cannot tell from the line which one lost its record.

**A record read before the first observation throws.** The plan's `PumpRecords` interface declares `primary` and `backup` as total values, and the module cannot produce one before a snapshot has given it an epoch. Answering a zero count and an epoch of `0` would publish 1970 and a count of zero as fact, which is the whole class of defect this plan exists to prevent. The accessory observes a snapshot before it publishes one, so a read before that is a wiring mistake and is reported as one.

**The test table looks a characteristic up by its published key as a string.** `keyof CustomCharacteristics` made the table follow the interface, so a renamed member would have renamed the expectation with it. The lookup is now by plain string, which is also what let task 1 have a compiling RED commit.

**The epoch comes from the observation rather than a clock.** Observation began at the first snapshot, so its receipt time is the epoch by definition. Taking it from the observation means this module injects no clock at all and there is no second time source for the record to disagree with.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The acceptance criterion for the self-test label contradicts the behaviour it is a criterion for**

- **Found during:** Task 3
- **Issue:** The criterion asks the label to be `true` at the fourth phase of the measured table. The behaviour spec asks the rule to run only when both device values matched the immediately preceding observation. The fourth phase is where the self-test timestamp changes, so a rule obeying the behaviour spec cannot fire there.
- **Fix:** The behaviour spec was implemented. The case drives the four phases plus one settled snapshot and asserts `[undefined, undefined, undefined, undefined, true]`.
- **Files modified:** `src/accessories/pumpRecords.ts`, `test/accessories/pumpRecords.test.ts`
- **Verification:** Removing the self-test half of the stability check fails `withholds the self-test label until both device timestamps have settled`.
- **Committed in:** `98d7858`

**2. [Rule 2 - Missing Critical] The unreadable-record log line would have carried an account identifier**

- **Found during:** Task 3
- **Issue:** The plan's action text asks the line to name the device. A vendor `deviceId` embeds the account identifier, which `CLAUDE.md` forbids in a log.
- **Fix:** The line names the fact and nothing else, and a case asserts it quotes nothing identifier-shaped.
- **Files modified:** `src/accessories/pumpRecords.ts`, `test/accessories/pumpRecords.test.ts`
- **Verification:** `names no device or account identifier in the line about an unreadable record`
- **Committed in:** `98d7858`

**3. [Rule 2 - Missing Critical] The exact-catch-up self-test case was missing**

- **Found during:** Task 3, mutation checking
- **Issue:** At 100% line, branch, and function coverage, changing `testedAt >= backupActivatedAt` to `>` broke nothing. No fixture had the two device values on the same second, which is the exact case "catches up" names.
- **Fix:** One case with both device values equal, asserting the label is `true`.
- **Files modified:** `test/accessories/pumpRecords.test.ts`
- **Verification:** The same mutation now fails `labels the last activation as self-test activity when the self-test timestamp caught up exactly`.
- **Committed in:** `98d7858`

**4. [Rule 3 - Blocking] The characteristic test table could not name a member that did not exist yet**

- **Found during:** Task 1
- **Issue:** `CharacteristicExpectation.name` was `keyof CustomCharacteristics`, so a RED commit naming the four new characteristics could not typecheck, and `npm typecheck` is a pre-commit hook.
- **Fix:** The table names each characteristic by its published key as a plain string and a `declaredAs` helper resolves it. The RED commit compiles and 22 cases fail in it.
- **Files modified:** `test/accessories/customCharacteristics.test.ts`
- **Verification:** `8cb08b2` shows 20 failing cases in that file and 2 in the service file.
- **Committed in:** `8cb08b2`

---

**Total deviations:** 4 auto-fixed (1 bug, 2 missing critical, 1 blocking). **Impact:** each one was needed for a claim of this plan to actually hold, or for a repository rule to be respected. No scope creep: nothing wires these characteristics to an accessory, nothing projects them through the catalogue, and no README text was written — all of that stays where the later plans put it.

## Issues Encountered

**One planned behaviour is worth a ruling before this ships.** On a genuinely fresh install the watermarks are seeded absent, and the recovery rule treats an absent watermark as "anything the device reports is newer". So the very first snapshot carrying a `backup_pump_timestamp` recovers one activation and records it as the last activation, even though that device timestamp almost certainly predates the observation start the same snapshot just seeded. The record then reads "1 activation observed since <a moment ago>" with a last activation from before that moment.

This is what the plan specifies — the behaviour list, the truth statements, and the acceptance criterion "observes a `backupActivatedAt` of 1700000000 **with the watermark absent** and no watched edge, and asserts `backup.activationCount` is `1`" all say it plainly, so it was implemented that way and is pinned by `recovers one activation from a device timestamp and stores it in milliseconds`. It is nonetheless the one place in this module where a number an owner reads can describe something that happened before the plugin was watching, which is the claim `D-020` and the characteristic display names exist to deny. Reversing it is a one-line change — seed `watermarks.backupPumpTimestamp` from the first observation's device value instead of leaving it absent — plus that one case and its sibling. **Flagged for the phase owner rather than decided here.**

> **RULED 2026-09-01 — reversed.** The maintainer chose to seed rather than count. The first
> timestamp a record ever sees now establishes the baseline and counts no activation, so the count
> only ever describes runs the plugin watched. The seed also clears the pending-edge flag, because
> it absorbs whatever the device was reporting and a flag left set would absorb the next advance too
> and lose a genuinely missed run. Applied by the orchestrator in `69c203d`, after this plan closed.
> Both halves are mutation-checked: removing the seeding branch fails two cases by name, and leaving
> the flag set fails `counts a later advance after a seed that also absorbed a watched edge`.
> The acceptance criterion quoted above, and the case that pinned it, no longer describe the shipped
> behaviour — `seeds the first device timestamp as a baseline and counts no activation for it` does.

**Classification can relabel a live run from stale timestamps.** Between a backup activation starting and the device publishing its new timestamp, the stability rule is satisfied by the *previous* pair, so the label computed describes the previous run while the count already advanced for the new one. It self-corrects within two observations, which on the default fifteen-minute poll is up to half an hour. The plan does not ask for a guard and none was invented; the label decorates a record and never touches a live sensor.

**Nothing here is wired to an accessory yet.** `createPumpRecords` has no caller under `src/`, `AccessoryStore` has no implementation, and the four characteristics are declared but never pushed. `npm run fallow`'s dead-code pass is satisfied because the test modules reach both. That wiring is a later plan's work, and until it lands no owner sees any of this in Apple Home.

**`CHANGELOG.md` was not touched.** `CLAUDE.md` asks for that before a PR rather than per plan, and `04-01` and `04-02` did the same.

## Gates

At `98d7858`:

- `npm run check` green — 1162 unit tests, 65 Cucumber scenarios, 583 steps.
- `npm run test:coverage:all` at 100/100/100 over every module under `src/`.
- The three focused pairs named in the plan's verify blocks each at 100/100/100: `customCharacteristics`, `customServices`, `pumpRecords`.
- `node --test dist-test/test/accessories/hapWriteFidelity.test.js` — 13 pass, 0 fail, the clamping case among them.
- `node --test dist-test/test/runtime/accessoryStore.test.js` — 2 pass, 0 fail.
- `npm run fallow` reports no dead-code and no health finding, and only the pre-existing `features/support/steps/hap.ts` clone group.

## Self-Check: PASSED

- `src/runtime/accessoryStore.ts`, `src/accessories/pumpRecords.ts`, `test/runtime/accessoryStore.test.ts`, `test/accessories/pumpRecords.test.ts` — all present on disk.
- Commits `8cb08b2`, `2392526`, `8cced52`, `c9e456f`, `98d7858` — all present in `git log`, all non-empty.
- No file declared by plan 04-02 was touched. `STATE.md` and `ROADMAP.md` were not written.
