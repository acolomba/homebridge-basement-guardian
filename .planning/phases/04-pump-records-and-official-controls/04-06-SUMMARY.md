---
phase: 04-pump-records-and-official-controls
plan: 06
subsystem: docs
tags: [readme, homekit, apple-home, activity-history, hap-nodejs, static-gate, coverage]

requires:
  - phase: 04-pump-records-and-official-controls
    provides: "The record characteristics, both control Switches, the command lifecycle, and the fake-pump harness that drives them (04-01 through 04-05)"
  - phase: 03-safety-monitoring-in-homekit
    provides: "The published service catalogue and the README sections this plan extends"
provides:
  - "A README an owner can act on: what the activation record counts, what the Home app draws a tile for, what the two controls do, and what the plugin refuses"
  - "The wording CTRL-02 asks for: Activity History is controller-owned, takes no retention setting from this plugin, and cannot be backfilled"
  - "test/accessories/hapImportScope.test.ts — a source-text gate keeping the single permitted HAP import single (D-17)"
  - "The accessories module floor raised to the nine modules that tier now holds"
  - "Three real-home questions raised as questions rather than answered locally"
affects: [phase-05-monitoring-path, phase-06-release, real-home-validation-session]

actuals:
  tokens: 7400
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "A source-text gate declares its specifier once, enumerates directories rather than a fixed list, and asserts a file-count floor so an empty read cannot report the same green as a full read"

key-files:
  created:
    - test/accessories/hapImportScope.test.ts
  modified:
    - README.md
    - test/accessories/timerFreedom.test.ts

key-decisions:
  - "The gate's planted fixtures interpolate the declared specifier rather than spelling it out literally, because a literal importing spelling in the gate's own source would make the gate report itself and the single-importer assertion could then never name exactly one file."
  - "The README states the primary and backup counts are built differently and that neither is a lifetime total, rather than presenting one 'activation count' concept."
  - "The mute description is labelled provisional in the README and names the four behaviours hardware validation must still confirm."

patterns-established:
  - "Tile visibility is documented service by service, with the reason (vendor-defined service types sit outside the range Apple assigns) stated once rather than repeated per service."

requirements-completed: [CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05]

coverage:
  - id: D1
    description: "A source-text gate proves exactly one file under src/, test/ and features/ imports the pinned HAP package, with positive fixtures for three import spellings in both quote styles and negative fixtures for prose mentions"
    verification:
      - kind: unit
        ref: "test/accessories/hapImportScope.test.ts#exactly one file under src, test and features imports the pinned HAP package (D-17, SAFE-08)"
        status: pass
      - kind: unit
        ref: "test/accessories/hapImportScope.test.ts#reports a planted HAP import in every spelling and quote style it is meant to catch (D-17)"
        status: pass
      - kind: unit
        ref: "test/accessories/hapImportScope.test.ts#reports neither a comment naming the package nor an unrelated import (D-17)"
        status: pass
      - kind: unit
        ref: "test/accessories/hapImportScope.test.ts#does not report the hand-built stand-in, whose own file overview names the package (D-17)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The accessories-tier module floor matches the nine modules that tier now holds, so the deferred-execution gate cannot pass by reading the wrong directory"
    verification:
      - kind: unit
        ref: "test/accessories/timerFreedom.test.ts#no module in the accessories tier imports deferred execution from the node standard library (SAFE-07, D-18)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The README explains the observation record: the observation start, the outage gap, the primary and backup asymmetry, and that neither count is a lifetime total"
    requirement: CTRL-01
    verification: []
    human_judgment: true
    rationale: "No assertion can judge whether prose leaves a reader in doubt about what a number means. The plan makes this a human reading."
  - id: D4
    description: "The README states that Activity History is controller-owned, needs a supported hub and the current Home architecture, takes no retention setting from this plugin, cannot be backfilled, and is not how the plugin delivers safety state"
    requirement: CTRL-02
    verification: []
    human_judgment: true
    rationale: "CTRL-02 is satisfied entirely by documentation and adds no runtime behaviour, so no assertion can judge it. Acceptance is a human reading the section against constraints.md:391 and Apple's requirements page."
  - id: D5
    description: "The README names, service by service, which published services the Home app draws a tile for, and states the room consequence"
    verification: []
    human_judgment: true
    rationale: "The list is a claim about what a controller draws. A local test can prove a service was published; only a real paired Apple Home can confirm what is drawn."
  - id: D6
    description: "The README describes both controls truthfully: what a press asks for, what the plugin refuses and why, that the switch follows reported state, and that the mute contract is unconfirmed"
    requirement: CTRL-03
    verification: []
    human_judgment: true
    rationale: "Prose fidelity to the shipped refusal rules is a reading judgment, not an assertion."
  - id: D7
    description: "The whole suite and the whole-project coverage gate both run green from a clean build, with coverage run explicitly because CI does not run it"
    verification:
      - kind: other
        ref: "npm run check"
        status: pass
      - kind: other
        ref: "npm run test:coverage:all"
        status: pass
    human_judgment: false

duration: 21 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 6: Documentation, Source Gates, and Real-Home Questions Summary

**A README that tells an owner what the activation counts do and do not mean, which published services the Home app draws no tile for, and what the two controls refuse — plus a source-text gate that keeps the single permitted HAP import single, proven by planting a second one and watching it fail.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-09-01T19:19:23Z
- **Completed:** 2026-09-01T19:40:50Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `test/accessories/hapImportScope.test.ts` enumerates 98 TypeScript files under `src/`, `test/` and `features/` and asserts exactly one of them reaches `@homebridge/hap-nodejs`. It reads a named, a side-effect and a dynamic import in both quote styles, stays quiet on the four files that name the package only in prose, and asserts a file-count floor so a wrong directory read fails by name.
- `ACCESSORIES_MODULE_FLOOR` raised from 7 to 9, the count the accessories tier actually holds after 04-01 and 04-03 added `controls.ts`, `alarmMute.ts` and `pumpRecords.ts`.
- The README now names both control switches in the published-service list and in the list of services that cannot be removed, lists tile visibility service by service, explains the activation record and its two asymmetric counts, states the Activity History limits `CTRL-02` asks for, and describes what the plugin refuses and why.
- `npm run check` and `npm run test:coverage:all` both run green from a clean build. The coverage run was performed explicitly, because reading `.github/workflows/build.yml` confirms the workflow does not run it.
- Three real-home questions are on the record as questions.

## Task Commits

1. **Task 1: The single-import gate for the pinned HAP package, and the accessories module floor** — `5b88c7f` (test)
2. **Task 2: Documentation — the record, the Activity History wording, the tile-visibility list, and both controls** — `cb9e437` (docs)
3. **Task 3: Run the phase gates explicitly and raise the real-home questions** — this summary; it writes no source and changes no file the build reads.

Commit type `test` for Task 1 follows the convention this project recorded in Phase 3: a plan that ships no production code does not use `feat`, because a `feat` commit would claim a feature that does not exist.

## Files Created/Modified

- `test/accessories/hapImportScope.test.ts` — the gate proving exactly one file reaches the pinned HAP package (`D-17`, `SAFE-08`).
- `test/accessories/timerFreedom.test.ts` — module floor raised to nine, with the comment corrected to match.
- `README.md` — the tile-visibility list, the two-controls section, the activation-record section, the Activity History section, the two new entries in the published-service list, and the corrected non-removable list.

## The gate is not vacuous — the defect was planted and watched to fail

Phase 3 learned that an unlisted module and a clean module produce the identical green, and proved its own static gate by planting a dead export. The same discipline was applied here, and the gate is the easiest kind of test to write vacuously.

**Planted defect 1 — a second importer.** A side-effect import was appended to `src/accessories/customCharacteristics.ts` (the very module carrying the runtime ban) and a double-quoted dynamic import to `features/support/fakeHap.ts`. Two of the four cases failed:

```
✖ exactly one file under src, test and features imports the pinned HAP package (D-17, SAFE-08)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
  +   'features/support/fakeHap.ts',
  +   'src/accessories/customCharacteristics.ts',
      'test/accessories/hapWriteFidelity.test.ts'
    ]

✖ does not report the hand-built stand-in, whose own file overview names the package (D-17)
```

The assertion names each offender by repository-relative path rather than reporting a bare `true`. Both files were restored and the four cases returned green.

**Planted defect 2 — a wrong directory read.** `SOURCE_DIRECTORIES` was narrowed to `['src/accessories']` in the compiled case, which is a directory that exists and holds nine TypeScript files. Without the floor that read would have found no importer and reported the same green as a full read. With it:

```
AssertionError [ERR_ASSERTION]: the gate enumerated 9 TypeScript files under src/accessories,
fewer than the 98 this repository holds
```

**The negative controls are load-bearing, not decoration.** Four files in this repository name `@homebridge/hap-nodejs` in prose without importing it: `features/support/fakeHap.ts` (twice, once in a sentence that says it imports the package nowhere), `features/support/fakeHomebridgeApi.ts`, `test/accessories/hapWriteFidelity.test.ts` in its own overview, and this gate's overview, which names the package seven times. A detector that read the package name wherever it appeared would report five files instead of one and would be deleted within a week for crying wolf.

## The gates, and their real output

### `npm run check` — exit 0

```
> npm run typecheck && npm run lint && npm run fallow && npm run format:check && npm test
...
■ Metrics: 30,915 LOC · dead files 0.0% · dead exports 0.0% · avg cyclomatic 1.3 ·
  p90 cyclomatic 2 · maintainability 92.6 (good) · 3 churn hotspots (since 6 months) ·
  duplication 0.2%
● Duplicates (1 clone groups)
    features/support/steps/hap.ts:113-124
    features/support/steps/hap.ts:168-181
✗ 26 lines (0.2%) duplicated across 1 file (0.07s)
...
ℹ tests 1207
ℹ suites 61
ℹ pass 1207
ℹ fail 0
...
78 scenarios (78 passed)
753 steps (753 passed)
```

The one clone group is the pre-existing self-clone inside `features/support/steps/hap.ts`. It is not this plan's, it does not fail the gate, and it was not touched.

The unit count moved from 1203 to 1207: the four cases this plan added.

### `npm run test:coverage:all` — exit 0

Every module under `src/` reports 100.00 for lines, branches and functions:

```
ℹ file                        | line % | branch % | funcs % | uncovered lines
ℹ  src
ℹ   accessories
ℹ    alarmMute.js             | 100.00 |   100.00 |  100.00 |
ℹ    basementGuardian.js      | 100.00 |   100.00 |  100.00 |
ℹ    controls.js              | 100.00 |   100.00 |  100.00 |
ℹ    customCharacteristics.js | 100.00 |   100.00 |  100.00 |
ℹ    customServices.js        | 100.00 |   100.00 |  100.00 |
ℹ    pumpRecords.js           | 100.00 |   100.00 |  100.00 |
ℹ    reconciliation.js        | 100.00 |   100.00 |  100.00 |
ℹ    serviceCatalogue.js      | 100.00 |   100.00 |  100.00 |
ℹ    services.js              | 100.00 |   100.00 |  100.00 |
...
ℹ all files                   | 100.00 |   100.00 |  100.00 |
```

**Read the table honestly: it lists 36 of the 38 `.ts` modules under `src/`, and five modules are absent from it.** `src/device/family.ts`, `src/device/health.ts`, `src/device/events.ts`, `src/persistence/accessoryContext.ts` and `src/runtime/commandPort.ts` each compile to exactly `export {};` — they are type-only modules with no executable statement, so V8 reports nothing for them and the reporter omits the row. That is not an uncovered branch hiding behind a green summary, and it is not an exclusion anyone configured; it is what a type-only module compiles to. No coverage threshold was lowered and no path was excluded on this plan.

### The continuous-integration workflow does not run coverage — read, not inherited

`.github/workflows/build.yml` was read rather than remembered. On Node 22.x and 24.x it runs, in order: `npm install`, `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run fallow`, `npm test`, `npm run build`, then a dependency `list`/`audit`/`audit fix` step and a second `npm run build`.

`npm run test:coverage:all` is not among them, and `npm test` is `test:unit && test:cucumber` with no coverage flags. The 100/100/100 gate is local discipline. A branch that lost coverage would go green in CI, which is why this plan runs the command explicitly rather than assuming the workflow did.

## The three questions only a real paired home can answer

These are raised, not answered. Each keeps two claims apart: **a test can prove a characteristic was declared and pushed; only a real home can say what a controller draws.** Nothing below was settled from a local run.

### Question 1 — Does a `Switch` marked inactive still render, and still accept a press? (`D-03`)

*Proven locally:* both control rows publish from the first update through the `alwaysPublish` waiver, and `StatusActive` is declared on each `Switch` through the `declareCharacteristic` guard. 04-01 proved the waiver is honoured by removing it and watching three cases fail.

*Not provable locally, and the whole premise of `D-03`:* with the system reporting a self-test field the plugin cannot decode, does the `System Self-Test` tile render at all in Apple Home, and does a press still reach the plugin? Report what the tile looks like while the service is marked inactive. **A negative answer reopens `D-03`**, which is what keeps a room holding this accessory visible in the main Home view.

### Question 2 — What does a controller draw between a refused write and the push that follows it? (`D-04` residual)

*Proven locally:* a refusal answers a per-cause `HAPStatus`, arms a clearing push as a macrotask at delay 0, and the push returns the characteristic's stored status to zero. 04-01 proved the macrotask requirement by changing it to a microtask and watching seven of fifteen cases fail, and 04-05 proved the push happens at all by removing it and watching a scenario fail on an unwanted exception.

*Not provable locally:* press a control the plugin will refuse — a duplicate on request while a self-test is already running. What does the tile do between the failure and the moment the value comes back? Does any other service on the same accessory read as unreachable at any point? No hook exists earlier than HAP's own catch, so a controller re-read inside that window cannot be observed from this repository.

### Question 3 — Which published services does the Home app actually draw a tile for?

*Proven locally:* every service in the catalogue publishes under a fixed subtype with its declared characteristics, and the vendor-defined service UUIDs are hard-coded v4 literals outside Apple's base namespace `-0000-1000-8000-0026BB765291`.

*Not provable locally, and now a published claim:* walk the accessory's services and report which ones the Home app draws a tile for and which appear only in the accessory details. Put the accessory in a room of its own and report whether that room appears in the main view. The README now states a service-by-service answer; a wrong entry there is a false assurance about what an owner can look at, which is exactly the failure the folded todo was filed about.

### These belong to one session, together with work this plan does not adopt

Phase 3's check 1 — **a flood automation survives a degraded `water` scope** — is still open and belongs to the same real-home session. It is not this phase's work and is not adopted here. It gates `1.0.0`, along with `G-001`, `G-002`, `G-003` and `G-004`. `G-001` in particular is the gate behind this plan's `Alarm Mute` prose.

One visit with a paired Apple Home and a supported home hub answers all of them.

**Expect the build to have erased any scaffold left in the distribution directory.** The pre-commit gate runs `npm run fallow`, whose `prefallow` script runs `npm run build`, and `build` begins with `rimraf ./dist`. Anything hand-placed under `dist/` for a real-home run is gone the moment a source file is committed.

## Every safety-bearing claim across the phase, and the defect watched to fail

The phase constraint is that a green suite is not evidence. Fifty-two defects were reintroduced across the six plans and each was watched failing the specific case that claims to catch it. The tables live in the five plan summaries; this is the phase-level index.

| Plan | Claim | Defect reintroduced | Watched to fail |
|---|---|---|---|
| 04-01 | The clearing push is a macrotask (`D-04`) | `timers.setTimeout(fn, 0)` → `queueMicrotask(fn)` | 7 of 15 in `controls.test.ts` |
| 04-01 | A pending row withholds rather than publishes (`D-05`) | the `pendingControls.has` check dropped | `projects no On at all while the control carries an unresolved request` |
| 04-01 | The control fields own their own trust scopes (`D-02`) | three `TELEMETRY_CHECKS` rows kept `scope: undefined` | 9 cases in `gemini.test.ts` |
| 04-01 | `TRUST_SCOPES` lists every union member | `alarm-mute` removed from the list | 6 cases |
| 04-01 | The `alwaysPublish` exemption is honoured | `ensureService` ignores `row.alwaysPublish` | 3 cases |
| 04-01 | Reconciliation clears a confirmed request | `reconcile` only clears on a reported `false` | the end-to-end self-test scenario |
| 04-01 | The port tells a timeout from a vendor error | `commandFailureOf` always answers `vendor-error` | 2 cases |
| 04-01 | The stand-in leaves the value on a refused write | fake resets to the format default | 6 of 11 fidelity cases |
| 04-01 | The stand-in answers the stored status to a later read | `handleGetRequest` never throws | 1 case |
| 04-01 | A push clears the stored status | `updateCharacteristic` no longer resets `statusCode` | 1 case |
| 04-01 | Status stickiness is per characteristic | the push clears every characteristic's status | 1 case |
| 04-01 | A plain `Error` becomes a communication failure | fake converts it to `NOT_ALLOWED_IN_CURRENT_STATE` | 1 case |
| 04-02 | An undecoded reported field is refused | `hasNoFreshState` narrowed so it never applies | 4 cases |
| 04-02 | A confirmed-offline device is refused | `isConfirmedOffline` narrowed so it never applies | 4 cases |
| 04-02 | A duplicate request is refused | `isAlreadyActive` narrowed so it never applies | 4 cases |
| 04-02 | A local refusal sends nothing | the refusal moved to after `commands.send` | 5 cases |
| 04-02 | The accessory hands the binder its real offline state | `offlineConfirmed: () => false` at the wiring | 1 scenario |
| 04-02 | A refusal line quotes no token or URL | `deviceId` put back into the log line | 1 case |
| 04-02 | The closed window republishes | `republish()` removed from `expire` | 1 case and the expiry scenario |
| 04-02 | The closed window drops the entry | `requested.delete` → `requested.has` | the same case and scenario |
| 04-02 | Withholding reads the row's own capability | `pendingControls.has('self-test')` hard-coded | 2 cases |
| 04-02 | Withholding is not "any control pending" | `pendingControls.size > 0` | 2 cases |
| 04-02 | Withholding happens at all | the pending check removed | 2 cases |
| 04-02 | The command headers are command-only | `User-Agent` and `Accept` added to the read branch | 1 case |
| 04-02 | The user agent carries no version | `${PLUGIN_NAME}/1.0.0` | 2 cases |
| 04-02 | The provisional constant governs both values | the constant set to `false` | 3 cases |
| 04-02 | The mute contract lives in one module | a second `PROVISIONAL_` constant in `controls.ts` | 1 case |
| 04-03 | The count sits on a format HAP cannot clamp | `ObservedActivationCount` declared `uint8` | 2 cases |
| 04-03 | The stand-in's `UINT32` matches the real enum | `FakeFormats.UINT32` set to `'uint-32'` | 1 case |
| 04-03 | The records are optional on the pump service | `ObservationStartedAt` moved into `required` | 3 cases |
| 04-03 | A run already in progress is not counted (`D-09`) | `watchedAnActivation` widened | 1 case |
| 04-03 | The watermark comparison is strictly greater-than | `>` changed to `>=` | 2 cases |
| 04-03 | A watched edge and its later timestamp are one activation | the absorption branch removed | 1 case |
| 04-03 | An undecoded self-test input does not assert not-a-test | `classifiedAsTestActivity` returns `false` | 15 cases |
| 04-03 | The device timestamp is converted to milliseconds (`D-11`) | `millisecondsOf(reportedAt)` → `reportedAt` | 1 case |
| 04-03 | A write happens only on a change (`D-10`) | `store.persist()` called unconditionally | 4 cases |
| 04-03 | An undecoded running value neither counts nor clears | `rememberedRunning` returns the reported value | 1 case |
| 04-03 | Classification waits for both device values to settle | the stability check removed | 1 case |
| 04-03 | The epoch is the first snapshot's own receipt time | the backup epoch seeded at `0` | 13 cases |
| 04-03 | A self-test timestamp catching up exactly is test activity | `>=` changed to `>` | 1 case |
| 04-04 | The record rides with the pump's own reported running state | the `facts.running === undefined` gate removed | 8 cases |
| 04-04 | The primary pump carries no self-test label | `publishesTestActivity: true` on the primary row | 1 case |
| 04-04 | The last activation publishes, empty string included | the candidate deleted | 3 cases |
| 04-04 | `decodedGroup` narrows the group, not only the state | the inner `isRecord(group)` replaced by an assertion | 1 case |
| 04-04 | An unresolved family drives no observation | `records.observe(...)` added to that branch | 1 case |
| 04-04 | An undecoded running value neither counts nor clears | `booleanOf(pump, 'backupRunning') ?? false` | 1 case |
| 04-04 | The accessory formats the stored milliseconds | `String(...)` in place of `isoTimestamp` | 3 cases |
| 04-04 | A record with nothing observed publishes the empty string | `'never'` in place of `isoTimestamp(undefined)` | 2 cases |
| 04-04 | The record instance is created once per accessory | a fresh `createPumpRecords` per `update()` | 6 cases |
| 04-04 | The store actually asks Homebridge to store the accessory | `persist: () => undefined` | 4 cases |
| 04-04 | The record is absent from the change comparison | `primaryPump` added to both state objects | 1 case |
| 04-04 | The store is per accessory, never process-wide | a module-level store closed over the first accessory | *survived the first run — see below* |
| 04-05 | A timed-out command is never retried (`D-038`) | `commands.send` retries once | `Then the write reports a timeout` |
| 04-05 | A retry is not hidden behind a correct-looking status | `commands.send` retries silently | `Then the vendor receives 1 self-test command` |
| 04-05 | Requested state never becomes device state (`D-037`) | an accepted command writes `desiredData` into the store | `Then the canonical snapshot carries these fields: test_running false` |
| 04-05 | The deferred clearing makes the Switch readable again | the deferred clearing does nothing | `Then the "System Self-Test" switch answers a read` |
| 04-05 | The closed window republishes | `expire()` does not republish | `Then the "System Self-Test" service reports "On" as "false"` |
| 04-05 | Command arming does not leak into the poll route | `holdNextCommand` consumed in the generic pre-route gate | `When the plugin starts` timed out |
| 04-05 | Arming is one-shot | `rejectNextCommand` not cleared | `When a controller turns on the "System Self-Test" switch` raised `-70402` |
| 04-05 | A held or refused command produces no device reaction | the fake pump reacts anyway | `Then the canonical snapshot carries no shadow version` |
| 04-05 | The record resumes from the stored context | the record never resumes | `Activations Observed Since Observation Start` = `1` |
| 04-05 | A run already under way is not counted at a fresh start | it counts as an activation | the same characteristic, expected `0` |
| 04-05 | `persist()` reaches Homebridge | it never calls `updatePlatformAccessories` | the same characteristic, expected `1` |
| 04-06 | Exactly one file reaches the pinned HAP package (`D-17`) | a side-effect import in `customCharacteristics.ts` and a dynamic import in `fakeHap.ts` | 2 of 4 cases, naming both offenders by path |
| 04-06 | The enumeration read the tree it claims to read | `SOURCE_DIRECTORIES` narrowed to `['src/accessories']` | the floor assertion, naming the wrong directory |

### Five positives passed for the wrong reason on this phase, and all five had the same shape

This is the phase's most important finding and it is recorded plainly rather than buried:

1. **04-01** — the fake-resets-the-value mutation passed, because every refusal case started at `On = false`, which is also the `bool` format default. Fixed by pushing `On = true` first.
2. **04-02** — the missing-republish mutation passed, because the scenario kept a 50 ms poll interval and the next poll supplied the same answer a moment later. Fixed by running it on the default fifteen-minute interval.
3. **04-03** — the `>=` to `>` self-test mutation survived a suite at 100% line, branch and function coverage, because no fixture had the two device timestamps landing on the same second. Fixed by adding that case.
4. **04-04** — the process-wide-store mutation passed, because the case ran the *first* registered device's pump and a store that always named the first accessory named the right one by coincidence. Fixed by running the second device's pump.
5. **04-05** — the spurious-reaction mutation passed, because the reaction was published before the plugin had subscribed and was lost at QoS 0. Fixed by waiting on the plugin's own shadow `get` publish before the press.

**The pattern in all five is identical: the fixture happened to sit at the value the defect produces.** Coverage did not catch any of them. Only reintroducing the defect did. A sixth instance — 04-05's restart scenario, which passed 17/17 with `resumedRecord()` forced to `undefined` — was a false green in the harness rather than in a fixture, and is described in 04-05's summary.

## What this phase did NOT prove — the honest limits

These are limitations the earlier plans recorded. None of them is documented away here, and nothing in the README implies more than was proven.

1. **Nothing has met a real Homebridge cache.** 04-04's restart claim ran against a stand-in that recorded a persist call. 04-05 then found its own restart scenario was a false green and rebuilt the stand-in to model the cache — but it remains a JSON round trip through an in-memory map. A restored accessory there carries its context and **no services**. Whether a real restored accessory adopts four record characteristics it was published without is still open, and only a real Homebridge instance can answer it.
2. **`Alarm Mute` has no hardware evidence at all.** Nobody has observed a real Gemini's mute acknowledgement, reported-state timing, actual duration, latency or failure behaviour. That is what `G-001` exists for. The constants ship `PROVISIONAL_` and the README now says so in four named parts.
3. **Classification can carry a stale label for up to two poll intervals during a live run.** The heuristic waits until `test_running` is false and both device timestamps are stable, which is correct and is also why the label lags.
4. **Neither activation count is a device total.** The primary count holds only runs observed live; the backup count additionally recovers missed runs from the device timestamp. A run lasts 7 to 15 seconds against a ~15-minute REST poll, so live shadow delivery is what makes primary counting work at all.
5. **The first device timestamp seeds the watermark and counts nothing** (maintainer ruling, `69c203d`). On a fresh install the record does not report an activation from before the plugin was watching. The README states this.
6. **Several published services are ones the Home app draws no tile for.** Confirmed against a real Homebridge instance on 2026-08-30. The README now says which. Whether the list is complete and correct is Question 3 above.

## Decisions Made

- **The gate's fixtures interpolate the declared specifier instead of spelling it out.** `timerFreedom.test.ts` writes its fixtures out literally, and copying that exactly here would have made this gate report itself: it enumerates `test/`, so a fixture holding `from '@homebridge/hap-nodejs'` as source text is an import as far as the detector is concerned, and the single-importer assertion could then never name exactly one file. Each spelling is still written out by hand, one constant per spelling, with only the package name coming from the single declared specifier — which is what the plan's "built from one declared specifier so the rule and its own negative controls cannot drift" asks for anyway. The reason is stated in the file so the next author does not "fix" it back.
- **A type-only import counts.** `import type { CharacteristicProps } from '@homebridge/hap-nodejs'` does not reach the module at run time, but it still binds this repository to the pinned copy's type surface, and the permitted file carries one. The detector reports it and a fixture proves it.
- **The floor is 98, today's exact count.** A floor above the truth fails on a correct tree; a floor far below it stops guarding. It fails on a deletion, which is the intended behaviour: a gate that reads less than it did yesterday should say so.

## Deviations from Plan

None. All three tasks executed as written, and every acceptance criterion was checked by running the command that proves it rather than by inspection.

Two notes that are not deviations but are worth recording:

- The plan's `<interfaces>` block says "the tier now holds nine modules" while the code comment said seven. Nine is correct and was confirmed by enumerating `src/accessories/` (`alarmMute`, `basementGuardian`, `controls`, `customCharacteristics`, `customServices`, `pumpRecords`, `reconciliation`, `serviceCatalogue`, `services`).
- The `actuals.tokens` figure above is chars/4 over the three files this plan changed, which is 7,400. The plan's `estimate.tokens` of 85,000 is plainly not on that scale, so the pair does not calibrate cleanly and should not be read as a 91% underrun.

## Issues Encountered

One, and it was mechanical. ESLint's `max-len` rejected the floor assertion's message template at 173 columns. The message was not shortened at the cost of naming the wrong-directory failure clearly; the directory list was lifted into a local `searched` binding instead, which brought the line to 152 columns and left the message intact.

## Requirements

`CTRL-01` through `CTRL-05` are all declared by this plan and are complete across the phase.

`CTRL-02` deserves a note: it is satisfied **entirely by documentation** and adds no runtime behaviour, so no assertion can judge it. The plan's own truth statement says as much. Its acceptance is a human reading the Activity History section against `.planning/intel/constraints.md:391` and Apple's requirements page, and it is recorded above as `D4` with `human_judgment: true`.

## Known Stubs

None. This plan added no production code and left no placeholder.

## Threat Flags

None. This plan added one test file and edited prose. It introduced no network endpoint, no auth path, no file access pattern and no schema change. No package was installed on this plan or anywhere in this phase.

## Next Phase Readiness

Phase 4 is implementation-complete and gate-complete. `npm run check` and `npm run test:coverage:all` both pass from a clean build, at 1207 unit cases, 78 scenarios and 753 steps, with 100/100/100 over every executable module under `src/`.

Ready for the verification pass. Two things the verifier should carry forward:

- **Four manual rows are open**, not four gaps. Three are the questions above; the fourth is the `CTRL-02` documentation reading. None can be closed from this repository.
- **Phase 3's check 1 and the four release gates ride the same real-home session.** `G-001` is the one that bears directly on this phase's prose: until it closes, `Alarm Mute` is provisional and the README says so.

Phase 5 owns the heartbeat timer, the staleness rule, cached safety state across restart, and telling a confirmed-offline system from a degraded monitoring path. The monitoring-completeness indicator this phase deliberately does not publish belongs there.

---

## Self-Check: PASSED

- `test/accessories/hapImportScope.test.ts` — FOUND
- `README.md` — FOUND
- `test/accessories/timerFreedom.test.ts` — FOUND
- Commit `5b88c7f` — FOUND, non-empty (2 files)
- Commit `cb9e437` — FOUND, non-empty (1 file)
- `npm run check` — exit 0
- `npm run test:coverage:all` — exit 0
- Both gates re-run after the last edit — 7 of 7 cases pass

---

*Phase: 04-pump-records-and-official-controls*
*Completed: 2026-09-01*
