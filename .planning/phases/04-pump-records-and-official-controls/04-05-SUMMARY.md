---
phase: 04-pump-records-and-official-controls
plan: 05
subsystem: testing
tags: [cucumber, gherkin, mqtt, aedes, homebridge, hap, fake-vendor-cloud]

requires:
  - phase: 04-pump-records-and-official-controls
    provides: "The control binder, the command port, the pump records module and the accessory store the scenarios drive"
  - phase: 03-safety-monitoring-in-homekit
    provides: "The service catalogue, the fake HAP stand-in and the published-value helpers every assertion reads through"
provides:
  - "Six control outcomes end to end against the fake vendor cloud: accepted, refused, resolved-unsuccessful, never answered, late, and externally initiated"
  - "Command-scoped arming on the fake vendor service, so a scenario cannot arm an outcome and capture an inventory poll instead"
  - "The fake pump's reaction to a command it accepted, published on the accepted-update topic through the broker's existing publish"
  - "A modelled Homebridge accessory cache in the api stand-in, which is what makes a restart scenario mean anything"
  - "Four observation-record scenarios, including survival across a full plugin restart"
affects: [phase-05-monitoring-path, phase-06-release-gates]

actuals:
  tokens: 26663
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Command-scoped arming: an outcome is armed inside the route branch that answers it, never in the generic pre-route gate"
    - "The fake device reacts only to what it accepted, and only where hardware evidence exists"
    - "A restart scenario reads the newest accessory the plugin was handed, not the first one it registered"

key-files:
  created:
    - features/pumpRecords.feature
  modified:
    - features/officialControls.feature
    - features/shadowMerge.feature
    - features/support/fakeRestApi.ts
    - features/support/fakeHomebridgeApi.ts
    - features/support/publishedServices.ts
    - features/support/world.ts
    - features/support/steps/controls.ts
    - features/support/steps/homekit.ts
    - features/support/steps/shadow.ts

key-decisions:
  - "The fake shadow broker needed no change at all: publishReported already publishes on the accepted-update topic, which is the whole of the fake pump's reaction"
  - "onCommandAccepted passes the deviceId the command was addressed to, rather than binding the reaction to the scenario's first device"
  - "The harness restart did NOT carry the accessory context; the api stand-in now models the cache, because without it the survival scenario passed with the record never resuming"
  - "A restored accessory carries its context but not its published services, which makes an assertion after a restart read only what this run published"
  - "The fake pump reacts to a self-test and never to a mute, because no measurement records how a real system acknowledges a mute"

patterns-established:
  - "Absence of a device reaction is asserted through the shadow version the snapshot reached, not through a sleep"
  - "A control scenario that asserts the clearing push takes the default poll interval, so a poll cannot clear the status instead"
  - "A log assertion quotes the whole line, so the deviceId cannot be quietly removed again"

requirements-completed: [CTRL-01, CTRL-03, CTRL-04, CTRL-05]

coverage:
  - id: D1
    description: "All five CTRL-05 outcomes plus the resolved-unsuccessful branch run end to end against the fake vendor cloud"
    requirement: CTRL-05
    verification:
      - kind: e2e
        ref: "npm run test:cucumber -- --name \"vendor never answers\""
        status: pass
      - kind: e2e
        ref: "features/officialControls.feature (11 scenarios)"
        status: pass
    human_judgment: false
  - id: D2
    description: "An accepted self-test makes the fake pump report the test running on the accepted-update topic, and the Switch follows that report rather than the request"
    requirement: CTRL-03
    verification:
      - kind: e2e
        ref: "features/officialControls.feature#An accepted self-test makes the device report the test running"
        status: pass
    human_judgment: false
  - id: D3
    description: "A held command times out, reports the timeout status, and the fake records exactly one request for it"
    requirement: CTRL-05
    verification:
      - kind: e2e
        ref: "features/officialControls.feature#A self-test the vendor never answers times out and is not retried"
        status: pass
    human_judgment: false
  - id: D4
    description: "Requested control state never reaches canonical device state"
    requirement: CTRL-05
    verification:
      - kind: e2e
        ref: "features/shadowMerge.feature#A requested self-test never becomes device state"
        status: pass
    human_judgment: false
  - id: D5
    description: "The alarm-mute command carries exactly the measured mute body and nothing else"
    requirement: CTRL-04
    verification:
      - kind: e2e
        ref: "features/officialControls.feature#A press of the alarm mute switch sends only the measured mute body"
        status: pass
    human_judgment: false
  - id: D6
    description: "The observation record comes back after a full plugin restart with its count, its start and its last activation unchanged"
    requirement: CTRL-01
    verification:
      - kind: e2e
        ref: "npm run test:cucumber -- --name \"observation record\""
        status: pass
    human_judgment: true
    rationale: "The restart is a modelled Homebridge cache, not a real one. It proves the record round-trips through JSON and is re-derived from the restored context, but nobody has watched this survive a real Homebridge restart, and whether a restored accessory adopts the four record characteristics it was published without is still open."
  - id: D7
    description: "A backup run already under way at a fresh start is not counted, and a recovered activation carries the device's own time"
    requirement: CTRL-01
    verification:
      - kind: e2e
        ref: "features/pumpRecords.feature (4 scenarios)"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 05: Control Outcomes and Record Survival Summary

**Every way a control request can end, plus a record that survives a restart, driven through the real plugin against the fake vendor cloud — with the harness's accessory cache modelled, because without it the restart scenario passed while the record never resumed.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-09-01T14:39Z
- **Completed:** 2026-09-01T15:17Z
- **Tasks:** 3
- **Files modified:** 10 (1 created)

## Accomplishments

- The official-controls feature now holds 11 scenarios covering accepted, refused, resolved-unsuccessful, never answered, late, externally initiated, alarm mute, an off write while mute is active, and one-shot arming. The suite went from 65 scenarios / 583 steps to 78 / 753.
- The fake vendor service gained `holdNextCommand`, `rejectNextCommand`, `answerNextCommandWith` and `onCommandAccepted`, all consumed inside the command branch. Arming an outcome can no longer capture a fifteen-minute inventory poll.
- The fake pump now reacts to a command it accepted, using the broker's existing `publishReported` on the accepted-update topic. No shadow topic leaf was added and no desired-state publish is handled.
- The Homebridge accessory cache is modelled in the api stand-in, so `World.restartPlugin()` now hands the plugin its cached accessories the way `configureAccessory` does.
- Eleven defects were reintroduced and each was watched failing the specific scenario that claims to catch it.

## Task Commits

1. **Task 1: Command-scoped arming and the fake pump's reaction** — `3380f16` (test)
2. **Task 2: The five CTRL-05 outcomes plus the success-false branch** — `d6ef450` (test)
3. **Task 3: The observation record survives a full plugin restart** — `400448c` (test)

HEAD is `400448c9abf84097643308c74d4adb47013b8d89`. Every commit was verified non-empty with `git show --name-only --format="" HEAD`.

## Files Created/Modified

- `features/pumpRecords.feature` — four record scenarios, all named so `--name "observation record"` addresses every one
- `features/officialControls.feature` — eight new scenarios beside the three that were there
- `features/shadowMerge.feature` — the requested self-test that never becomes device state
- `features/support/fakeRestApi.ts` — the three one-shot command arms and the accepted-command hook
- `features/support/fakeHomebridgeApi.ts` — the modelled accessory cache and the handed-accessory list
- `features/support/publishedServices.ts` — reads the newest handed accessory rather than the first registered one
- `features/support/world.ts` — the fake pump's reaction, the restore-from-cache path, the write outcome, the remembered values
- `features/support/steps/controls.ts` — the arming steps, the recorded-outcome writes, the record reads
- `features/support/steps/homekit.ts` — a scenario can now state a published ISO-8601 instant
- `features/support/steps/shadow.ts` — the same reported patch under a name that claims nothing about a heartbeat

No file under `src/` changed. `git diff 7ca1b88..HEAD -- src/` is empty.

## The two questions the plan asked to be answered

**Did the shadow broker need any change? No.** `features/support/fakeShadowBroker.ts` is untouched by this plan. `publishReported(deviceId, reported, version)` already publishes `{ state: { reported }, version }` on `$aws/things/{deviceId}/shadow/update/accepted`, which is the whole of the fake pump's reaction. `ShadowTopicLeaf` still declares exactly its three members, no `update/rejected` leaf exists, and the broker handles no desired-state publish. The narrowed `D-15` is satisfied by adding nothing.

**Did the harness restart path already carry the accessory context? No, and this was the plan's most important finding.** `World.launch()` built a fresh `accessories` map on every launch, so a restart constructed a brand-new `PlatformAccessory` with an empty context and registered it again. The record could not possibly have survived. The scenario passed anyway, because `currentAccessory` read `registerPlatformAccessoryCalls[0].accessories[0]` — the *pre-restart* accessory, a detached object still holding everything the previous run had pushed onto it. **This was proven, not reasoned:** with `resumedRecord()` forced to return `undefined` — the record never resuming at all — the restart scenario still passed 17/17 steps.

The harness was extended rather than worked around:

- `fakeHomebridgeApi` keeps a cache keyed by UUID. `registerPlatformAccessories` and `updatePlatformAccessories` write the accessory's context to it as JSON text; `unregisterPlatformAccessories` deletes it. That mirrors when real Homebridge writes its cache.
- `restoreCachedAccessories()` rebuilds a fresh accessory per cached entry, with the same identity and the context as it survives a JSON round trip.
- `World.launch()` seeds its `accessories` map from that restore, which is exactly what `BasementGuardianPlatform.configureAccessory` does.
- `currentAccessory` now answers the newest accessory the plugin was handed — registered, or restored.

## What the record-survival scenario does NOT prove

Stated plainly, because the phase has been burned by green runs four times already:

1. **This is not a real Homebridge cache.** It is a JSON round trip through an in-memory map. It proves the context is serializable, that only persisted state comes back, and that the plugin re-derives the published record from the restored context. It does not prove Homebridge writes, reads, or migrates the file the way the stand-in does.
2. **A restored accessory here carries no services.** The real cache serializes services and their last values, so a real restored accessory answers reads before the plugin republishes anything. Leaving them out makes the assertion strictly stricter — the value must be published by *this* run — but it means the scenario says nothing about what a real restored accessory answers in the window before the first poll.
3. **The open Phase 3/4 human-judgment item is untouched.** Whether a restored accessory adopts four record characteristics it was published without is still a question for a real paired Apple Home. Nothing here answers it.
4. **`updatePlatformAccessories` is still a recorder.** 04-04's persist claim is exercised against a call recorder; this plan adds a cache behind that recorder, which is closer to a restart but is not one.

## Mutation testing: the defects reintroduced and what failed

A green run of a scenario nobody has seen fail is not evidence. Each of these was applied to the shipped code, run, and reverted.

| # | Defect reintroduced | Scenario that failed | Failing step |
|---|---|---|---|
| 1 | `commands.send` retries once on a timeout and returns the retry's result | A self-test the vendor never answers times out and is not retried | `Then the write reports a timeout` (`undefined !== -70408`) |
| 2 | `commands.send` retries silently and still reports the timeout | same | `Then the vendor receives 1 self-test command` (two bodies recorded) |
| 3 | An accepted command writes its `desiredData` into the store | A requested self-test never becomes device state | `Then the canonical snapshot carries these fields: test_running false` |
| 4 | The deferred clearing after a refusal does nothing | A self-test the vendor refuses returns the switch to what the device reports | `Then the "System Self-Test" switch answers a read` (unwanted exception) |
| 5 | `expire()` does not republish | A self-test report that arrives after the window closed still turns the switch on | `Then the "System Self-Test" service reports "On" as "false"` |
| 6 | `holdNextCommand` consumed in the generic pre-route gate | A self-test the vendor never answers times out and is not retried | `When the plugin starts` timed out — the poll was held instead, which is the pitfall itself |
| 7 | `rejectNextCommand` not cleared, so the arming is not one-shot | An armed refusal applies to one command and the next press reaches the vendor | `When a controller turns on the "System Self-Test" switch` raised `-70402` |
| 8 | The fake pump reacts to commands it held or refused | A self-test the vendor refuses / never answers | `Then the canonical snapshot carries no shadow version` (`1 !== undefined`) |
| 9 | The record never resumes from the stored context | The observation record comes back after a restart | `Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "1"` |
| 10 | A run already under way counts as an activation | The observation record does not count a backup run already under way at a fresh start | same characteristic, expected `0` |
| 11 | `persist()` never calls `updatePlatformAccessories` | The observation record comes back after a restart | same characteristic, expected `1` |

**One of these caught a false positive in my own work.** Mutation 8 initially did *not* fail: the "no shadow version" assertion was passing because the spurious reaction was published before the plugin had subscribed, so the message was simply lost at QoS 0. The scenarios now wait on `Then the plugin publishes 1 complete shadow request` — which the shadow client publishes only after its subscription is established — before the press. With that step in place the mutation fails as it should. This is the fifth instance on this phase of an assertion passing for the wrong reason, and the first that was caught before it shipped.

## Decisions Made

- **The broker was left untouched.** Read first, as the plan directed. `publishReported` expresses the reaction exactly, so no helper was added for symmetry.
- **`onCommandAccepted` carries the deviceId.** The plan's interface sketch passed only `desiredData`, which would have forced the World to react on "the device under test" — that is, the scenario's first device. Wave 3 already shipped one defect of exactly that shape. The fake knows which device the command was addressed to; passing it costs nothing and makes a multi-pump scenario possible later.
- **`answerNextCommandWith` suppresses the reaction.** A scenario that needs an acceptance whose confirming report arrives on its own schedule (the late case) arms the body itself. Documented on the method.
- **Only a self-test is reacted to.** A mute reaction would state a timing and an acknowledgement nobody has measured, which `G-001` exists to close.
- **The clearing-push and expiry scenarios take the default poll interval.** With a short interval the next poll republishes a moment later and satisfies the waiting step, which is exactly the false green wave 2 shipped.
- **The unconfirmed-warning assertion quotes the whole line, deviceId included.** The maintainer restored that identifier in `263cae0` after an executor removed it; an assertion that tolerated its absence would let the same removal happen again quietly.

## Deviations from Plan

### 1. [Rule 2 — Missing critical] `onCommandAccepted` takes the deviceId

- **Found during:** Task 1
- **Issue:** The plan's interface sketch was `(desiredData) => void`. Without the device, the World must assume the reaction belongs to the scenario's first device — the same process-wide-state defect wave 3 shipped and the orchestrator flagged.
- **Fix:** The handler signature is `(deviceId, desiredData) => void`, and the fake passes the device the command's path named.
- **Files modified:** `features/support/fakeRestApi.ts`, `features/support/world.ts`
- **Committed in:** `3380f16`

### 2. [Rule 3 — Blocking] Three files outside the plan's per-task file lists were touched

- **Found during:** Tasks 2 and 3
- **Issue:** Three assertions had nowhere honest to live.
  - `features/support/steps/shadow.ts` — the late scenario needs the device to report `test_running`, and `constraints.md:533` says a heartbeat carries seven fields of which `test_running` is not one. Writing it through a step named "heartbeat fields" would have stated a wire shape the device does not send.
  - `features/support/steps/homekit.ts` — `publishedValue` accepted only `true`, `false` and whole numbers, so no scenario could state a published ISO-8601 instant or the empty string a record with no activation publishes.
  - `features/support/publishedServices.ts` — `currentAccessory` had to stop reading the first registered accessory, or the restart scenario proves nothing (see above).
- **Fix:** A second Gherkin phrase, `the device reports these fields:`, registered on the same function as the heartbeat step (no duplicated body); `publishedValue` extended to accept an ISO instant and the empty string; `currentAccessory` reads the newest handed accessory.
- **Files modified:** as listed. All three are named in the plan's `files_modified` neighbourhood and none is production code.
- **Committed in:** `d6ef450`, `400448c`

### 3. [Rule 3 — Blocking] Two record scenarios raced their own fixture

- **Found during:** Task 3
- **Issue:** Setting `backup_pump_timestamp` and then immediately setting a later one let the plugin poll only once, so it never observed the first value, seeded the watermark from the second, and counted nothing.
- **Fix:** The scenarios wait on `Then the canonical snapshot carries these fields: backup_pump_timestamp 1700000000` before advancing the device's timestamp, so the first value is provably observed.
- **Committed in:** `400448c`

### 4. Task 1's scenario-shaped acceptance criteria are satisfied by Task 2 and Task 3

Four of Task 1's acceptance criteria describe scenarios ("a scenario arms a held command while an inventory poll is pending…"). Task 1's `<files>` list contains no feature file, so those scenarios were written in Task 2 and are listed in the mutation table above. Nothing was skipped; the criteria are met one commit later than the plan numbered them.

---

**Total deviations:** 4 (1 missing critical, 3 blocking/sequencing)
**Impact on plan:** No scope creep. Every deviation makes an assertion mean more than it would have, and none touches production code.

## Issues Encountered

- **The false green in the restart scenario** — described in full above. Found by running the harness rather than reading it, exactly as the plan required.
- **The subscription race in the "no reaction" assertions** — found by mutation 8, fixed by waiting on the plugin's own shadow `get` publish before pressing.
- **A wrong assertion of my own:** the mute scenario originally also asserted "0 self-test commands", but the command-count step asserts the *whole* recorded command list, so the mute command failed it. The mute scenario's own step already asserts that exactly one command reached the vendor and that it is the mute body; the redundant line was removed.

## Gates

| Gate | Result |
|---|---|
| `npm run check` (typecheck, lint, fallow, format:check, tests) | pass |
| `npm test` — unit | 1203 tests, 1203 pass |
| `npm test` — cucumber | 78 scenarios, 753 steps, all pass (was 65 / 583) |
| `npm run test:cucumber -- --name "vendor never answers"` | 1 scenario, pass |
| `npm run test:cucumber -- --name "observation record"` | 4 scenarios, pass |
| `pre-commit run --files <changed>` | pass on every commit |
| `npm run fallow` | pass — the pre-existing clone finding on `features/support/steps/hap.ts` is unchanged and is not from this plan |

**No gate failed.** Nothing was skipped, no test is marked `skip` or `todo`, and every `<verify>` block in the plan was run.

## Prohibitions

| Prohibition | Held |
|---|---|
| No `update/rejected` leaf, no desired-state publish handled | Yes — `fakeShadowBroker.ts` is byte-identical to its state at the base commit |
| No invented wire shape | Yes — the accepted body is the one the fake already answered, the refusal body is `failNextWith`'s, and both command bodies are the measured ones |
| No command arming in the generic pre-route gate | Yes — proven by mutation 6 |
| No change to `failNextWith` or `holdNextRequest` | Yes — both keep their behaviour and their consumption point; all 65 pre-existing scenarios pass unchanged |
| No sleep in a scenario | Yes — `grep` finds no `delay`, `setTimeout` or sleep in the new steps. The pending window is advanced on the scenario clock; the only real time spent is the vendor's own 2.5-second deadline, by design |
| No published value asserted that the plugin never wrote | Yes — every control and record read goes through `pushedValue` |
| No `And` step keyword in any feature file | Yes |

## Known Stubs

None.

## Next Phase Readiness

- `CTRL-01`, `CTRL-03`, `CTRL-04` and `CTRL-05` all have end-to-end coverage against the fake vendor cloud.
- `CTRL-02` adds no runtime behaviour and therefore no scenario, as the plan's probe-edge assumption states. It is documentation, reviewed by a human, and carried by a later plan.
- Two items remain open for the `1.0.0` release and neither is a phase blocker: `G-001` (nobody has watched a real Gemini acknowledge a mute — no scenario here claims otherwise) and the human-judgment item on whether a real restored accessory adopts the four record characteristics.

---
*Phase: 04-pump-records-and-official-controls*
*Completed: 2026-09-01*

## Self-Check: PASSED

Every file this summary names exists on disk. All three task commits resolve in `git log`.
`features/support/fakeShadowBroker.ts`, `src/`, `.planning/STATE.md` and `.planning/ROADMAP.md`
show an empty diff against the base commit `7ca1b88`.
