---
phase: 03-safety-monitoring-in-homekit
plan: 06
subsystem: ui
tags: [homekit, homebridge, hap, timers, shadow, trust-scoping]

requires:
  - phase: 03-04
    provides: The catalogue-driven publish loop, the per-scope trust map, and the offline confirmation counter
  - phase: 03-05
    provides: All fifteen catalogue rows, so a lost controller link has the other fourteen rows present to be observed falling silent
provides:
  - An injected Timers port, mirroring Clock, wired at a composition root and never called by the accessory
  - Controller-link distrust: serial_communications false poisons the five controller-derived scopes and leaves connectivity trusted
  - A SnapshotSource discriminator, so only a poll-sourced update advances the offline confirmation run
  - The store subscription that carries canonical state to HomeKit between polls, closing a gap open since the first milestone
  - The platform pass-through that makes ignoredFaults and offlineConfirmationPollCount reach production
affects: [03-07, 03-08]

actuals:
  tokens: 43274
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - Injected port for a capability a module must be proven not to use, asserted at zero calls
    - Four independent immediacy layers, each shown to catch a defect the other three miss
    - Source discriminator on an entry point, so one caller's evidence cannot be claimed by another

key-files:
  created:
    - src/runtime/timers.ts
    - test/runtime/timers.test.ts
  modified:
    - src/accessories/basementGuardian.ts
    - src/platform.ts
    - test/accessories/basementGuardian.test.ts
    - test/platform.test.ts
    - features/support/world.ts

key-decisions:
  - "A lost controller link is not a degradation: reportDegradation now fires only for a reason other than controller-link-lost, so the log never claims a payload stopped validating when none did"
  - "DEGRADED_SCOPES became NON_CONNECTIVITY_SCOPES and serves both the unresolved-family and lost-link conditions, which are the same five scopes for different reasons"
  - "A scope's lastTrustedAt advances only while nothing untrusts it, so a lost link freezes it at the last link-present receipt, which is what RES-02 publishes"
  - "The store subscription keeps no unsubscribe handle, because store.remove drops the device's whole listener entry alongside the cached accessory"
  - "The composition-root gate for systemTimers is scoped to src/; the Cucumber harness is the second composition root and wires it too"

patterns-established:
  - "Compiling RED commits: pre-commit gates lint, typecheck, format, and fallow but not the test suite, so a test(...) commit holding failing tests over compiling scaffolding is expressible"
  - "Independent immediacy layers: each layer asserts one thing only, so a falsification names which layer caught it"

requirements-completed: [RES-02, RES-03, SAFE-07, SAFE-03, CONF-06]

coverage:
  - id: D1
    description: "serial_communications false marks water, pump, power, battery, and fault untrusted with reason controller-link-lost, leaves connectivity trusted, and retains every previously published value"
    requirement: RES-02
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#marks every controller-derived scope untrusted when the controller link is lost"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#leaves connectivity trusted while the controller link is lost, because the cloud still answers"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#retains the last controller-derived values published before the link was lost"
        status: pass
    human_judgment: false
  - id: D2
    description: "Controller-link distrust is distinguishable from a validation failure: a scope that failed its own field keeps reason invalid, and neither reason overwrites the other"
    requirement: RES-02
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#keeps a field violation at reason invalid while the controller link is lost"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#does not call a lost controller link a validation failure"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each poisoned scope's lastTrustedAt is the receipt time of the last snapshot in which it decoded with the link present, and the link adapter publishes it as an ISO-8601 UTC time"
    requirement: RES-02
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#times each poisoned scope at the last snapshot in which the controller link was present"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#publishes the time controller data was last trustworthy beside the lost link state"
        status: pass
    human_judgment: false
  - id: D4
    description: "A restored link clears the distrust on the next family-valid snapshot with no further input, and every affected service returns to active"
    requirement: RES-02
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#clears the controller-link distrust on the first snapshot in which the link returns"
        status: pass
    human_judgment: false
  - id: D5
    description: "The controller-link condition logs once at the transition into it and again only after a recovery and a later re-entry, never on every poll"
    requirement: RES-02
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#reports the controller link condition exactly once across three consecutive lost-link updates"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#reports the controller link condition again after a recovery and a later re-entry"
        status: pass
    human_judgment: false
  - id: D6
    description: "Canonical state that changes between polls reaches HomeKit: a shadow patch that changes a telemetry field publishes the matching characteristic change without waiting for the next REST poll"
    requirement: SAFE-03
    verification:
      - kind: integration
        ref: "test/platform.test.ts#delivers a between-poll shadow change to HomeKit without waiting for the next poll"
        status: pass
      - kind: integration
        ref: "test/platform.test.ts#updates from the poll as poll-sourced and from the store notification as live"
        status: pass
    human_judgment: false
  - id: D7
    description: "Only a poll-sourced update advances or resets the offline confirmation counter, so an interleaved shadow patch cannot double-count or reset a run of disconnected polls"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#leaves the offline confirmation run untouched by ten disconnected live updates"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#leaves a run of disconnected polls unreset by a connected live update between them"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#confirms offline on the configured polls despite a disconnected live update between them"
        status: pass
    human_judgment: false
  - id: D8
    description: "ignoredFaults and offlineConfirmationPollCount reach the accessory from the validated configuration, so an administrator's list actually removes a sensor and their count actually governs offline confirmation"
    requirement: CONF-06
    verification:
      - kind: integration
        ref: "test/platform.test.ts#publishes every adapter but the one an administrator ignored"
        status: pass
      - kind: integration
        ref: "test/platform.test.ts#confirms a device offline on the run of polls an administrator configured"
        status: pass
      - kind: integration
        ref: "test/platform.test.ts#calls updatePlatformAccessories once a suppression changes the published service set"
        status: pass
    human_judgment: false
  - id: D9
    description: "No transition defers: the injected Timers port records zero calls, the four global scheduling spies record zero calls, and the characteristic already carries the new value on the statement after update() returns"
    requirement: SAFE-07
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#records no call on the injected timer port across a source change to a published value"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#calls no global scheduling function across a source change to a published value"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#carries the new value on the statement after update() returns, with no await and no tick"
        status: pass
    human_judgment: false
  - id: D10
    description: "The immediacy gate discriminates: a deliberately deferred variant, private to the test that proves it, fails each of the three layers separately"
    requirement: SAFE-07
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#the timer port layer catches a transition deferred through the injected port"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#the global spy layer catches a transition deferred through the process timers"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#the synchronous-visibility layer catches a transition deferred through the process timers"
        status: pass
    human_judgment: false
  - id: D11
    description: "No plugin-side acknowledgement latch exists: a safety condition that clears in the source clears in HomeKit on the same update"
    requirement: SAFE-07
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#clears a safety condition on the same update that clears it in the source"
        status: pass
    human_judgment: false
  - id: D12
    description: "A real controller's 7-to-15-second backup-pump activation is actually observed and delivered to HomeKit on real hardware"
    requirement: SAFE-03
    verification: []
    human_judgment: true
    rationale: "The wiring is proven against the real store and the real accessory, but whether a shadow message for a short pump run actually arrives from the vendor depends on the device's own publish cadence, which no test in this repository can settle. It needs the real-home session."

duration: 45 min
completed: 2026-08-30
status: complete
---

# Phase 3 Plan 6: Controller-Link Distrust and Live State Summary

**A lost pump-controller link now stops the plugin vouching for everything downstream of the controller while the link adapter stays truthful, canonical state that changes between polls reaches HomeKit on the store's own notification rather than waiting fifteen minutes, and the immediacy requirement is gated by three runtime layers each shown to catch a defect the other two miss.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-08-30T18:08:24Z
- **Completed:** 2026-08-30T18:53:05Z
- **Tasks:** 3
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- `src/runtime/timers.ts` declares the `Timers` port and `systemTimers`, mirroring `src/runtime/clock.ts` in shape and comment convention. Handles are `unknown`, so no consumer can depend on the concrete handle type and a stand-in is a plain object.
- `createBasementGuardianAccessory` treats `serial_communications === false` as a reported condition rather than a validation failure: it marks `water`, `pump`, `power`, `battery`, and `fault` untrusted with reason `controller-link-lost`, leaves `connectivity` trusted because the vendor cloud is still answering, retains every published value, and freezes each poisoned scope's `lastTrustedAt` at the last link-present receipt, which the link adapter publishes as `ControllerDataLastTrustedAt`.
- `update()` takes a `SnapshotSource`. Only a `'poll'` update advances or resets the offline confirmation run, so a shadow patch arriving between polls publishes everything a poll publishes and says nothing about reachability.
- `src/platform.ts` subscribes each newly built accessory to the store, closing a gap that had been open since the first milestone: `store.subscribe()` had no production consumer, so `applyReportedPatch` updated canonical state and stopped there. At the default poll interval a seven-to-fifteen-second pump run was not observable at all.
- `DiscoveryContext` now carries `ignoredFaults`, `offlineConfirmationPollCount`, and `timers`, built from `validated.config` at both construction sites, so an administrator's configuration finally reaches the accessory in production rather than taking defaults.

## Task Commits

Each task ran RED then GREEN, and each gate was committed separately:

1. **The Timers port** — `2f5a992` (test, RED) then `fdb25c8` (feat, GREEN)
2. **Controller-link distrust, the snapshot source, the immediacy gate** — `9197216` (test, RED) then `4bc5afc` (feat, GREEN)
3. **Platform configuration routing and live-state wiring** — `17d60bb` (test, RED) then `b97f81b` (feat, GREEN)

## Files Created/Modified

- `src/runtime/timers.ts` — the `Timers` interface and `systemTimers`, plus the one place an opaque handle is narrowed.
- `test/runtime/timers.test.ts` — the module-scope `satisfies` stand-in and five cases driven through `t.mock.timers`.
- `src/accessories/basementGuardian.ts` — `SnapshotSource`, the required `timers` option, `isControllerLinkLost`, `distrustReasonsOf`, the reason-carrying `untrustedScopesOf`, `reportControllerLink`, and the source-guarded offline counter.
- `test/accessories/basementGuardian.test.ts` — the controller-link cases, the poll/live interleavings, the three immediacy layers, and the private deferred negative control.
- `src/platform.ts` — the three new `DiscoveryContext` members, the store subscription, the services-aware persistence guard, and the comment recording why no unsubscribe handle exists.
- `test/platform.test.ts` — a shared `discoveryContext` builder, the live-state cases, the configuration pass-through cases, and the composition-root source condition.
- `features/support/world.ts` — a `discoveryContext` helper so the harness supplies the same members the platform does.

## Decisions Made

- **A lost controller link is not a degradation.** `reportDegradation()` previously fired on any transition from an empty to a non-empty `untrusted` set, and its message says "the profile or payload stopped validating". Under a lost link nothing stopped validating, so that line would have stated a cause that did not happen. It now fires only when some untrusted scope carries a reason other than `controller-link-lost`, and the link has its own report. This is recorded as a deviation below.
- **One constant for two conditions.** `DEGRADED_SCOPES` became `NON_CONNECTIVITY_SCOPES`. The unresolved-family case and the lost-link case poison the same five scopes for different reasons, and the comment now states both. A second identical list would have been two places to change.
- **`lastTrustedAt` advances only while nothing untrusts a scope.** `recordTrustedScopes` takes the full reason map rather than the violation set, so a scope poisoned by a lost link keeps the receipt time of the last snapshot that arrived with the link present. That is exactly the value `RES-02` asks a service to expose, and it is why the same helper serves both.
- **No unsubscribe map.** `store.remove(deviceId)` deletes the device's whole listener entry, and `removeDiscoveredDevice` deletes the cached accessory in the same call, so a later re-discovery builds and subscribes a new instance. The reasoning is recorded in a comment on `removeDiscoveredDevice` so it is not rediscovered as a leak, and both halves are asserted.
- **The composition-root gate is scoped to `src/`.** The Cucumber harness stands in for `BasementGuardianPlatform`, so it is a second composition root and wires `systemTimers` too. The source condition asserts that within `src/`, only `platform.ts` and the port's own module name the symbol.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The degradation warning would have claimed a validation failure that did not happen**

- **Found during:** Task 2
- **Issue:** The plan adds controller-link distrust without touching `reportDegradation()`, which fires whenever `untrusted` becomes non-empty and logs "the profile or payload stopped validating". A lost controller link makes `untrusted` non-empty while the payload validates perfectly, so every lost link would have produced a second, false diagnostic line naming a cause that did not occur. In a safety plugin whose whole point is not reporting things it cannot vouch for, a log line asserting a wrong cause is a defect.
- **Fix:** `reportDegradation()` now returns early unless some untrusted scope carries a reason other than `controller-link-lost`. The controller-link condition has its own log-once report with its own wording.
- **Files modified:** `src/accessories/basementGuardian.ts`
- **Verification:** *does not call a lost controller link a validation failure* asserts no warning contains "stopped validating" under a lost link; reverting the guard to `untrusted.length === 0` fails 3 of 73 cases. The 54 Cucumber scenarios, which include *A payload that stops validating degrades the accessory in place*, still pass, so the real degradation path is unchanged.
- **Committed in:** `4bc5afc`

**2. [Rule 1 - Bug] Creating the accessory before setting `context.device` broke a restored accessory**

- **Found during:** Task 3
- **Issue:** Capturing the published service set before `update()` needs the `BasementGuardianAccessory` to exist first, so the first draft moved `basementGuardianAccessoryFor` above the three `accessory.context` assignments. `createBasementGuardianAccessory` reads `context.device` at construction and throws when it is absent, which is exactly the state of an accessory Homebridge restored from a cache written before that field existed.
- **Fix:** The context mutations run first, then the accessory is built, then the previous service list is captured from it. The three previous scalar values are saved into locals beforehand so the comparison is still against the pre-update state.
- **Files modified:** `src/platform.ts`
- **Verification:** The pre-existing case *updates a deviceId already present in accessories in place instead of registering it again* failed on the first draft and passes now; `src/platform.js` is back to 100% branch coverage.
- **Committed in:** `b97f81b`

### Adjustments to the plan's letter

**3. Task 2's signature changes reached `src/platform.ts` one task early.** Adding a required `timers` option and a second `update` parameter breaks `src/platform.ts` compilation immediately, and `.pre-commit-config.yaml` typechecks the whole tree. The minimal call-site fix therefore landed in task 2's RED commit rather than task 3. `src/platform.ts` is inside the plan's `files_modified`, so nothing outside the declared set was touched.

**4. The poll/live source discrimination is observed by spying the accessory the platform built, not a pre-seeded stand-in.** The acceptance criterion asks for "a recording accessory stand-in". A stand-in can only be injected by pre-seeding `basementGuardianAccessories`, and `basementGuardianAccessoryFor` returns early for a pre-seeded entry without subscribing, so that route cannot observe the listener at all. Instead the case reads the accessory the platform built out of the map and installs `t.mock.method(built, 'update')`; both the poll path and the listener reach `update` through a property lookup, so the spy sees both, and it asserts `['live', 'poll']`. This runs through production wiring rather than around it.

**5. `features/support/world.ts` imports `systemTimers`, so the composition-root test is scoped to `src/`.** The harness drives the real `registerDiscoveredDevices` and therefore has to supply a real `DiscoveryContext`; it is a composition root in the same sense the platform is. The assertion is that within `src/`, exactly `platform.ts` and `runtime/timers.ts` name the symbol.

---

**Total deviations:** 2 auto-fixed (2 bugs), 3 documented adjustments to the plan's letter.
**Impact on plan:** No scope creep. Both bugs were caught by gates rather than by inspection — one by a new assertion, one by a pre-existing case. Every file changed is inside the plan's declared `files_modified`.

## Falsification Results

Every new gate was falsified by patching its defect back in and watching the suite fail. Counts are over the affected test module.

| Defect reintroduced | Result |
|---|---|
| `systemTimers.setTimeout` does not delegate | 1 of 5 fails |
| `systemTimers.setTimeout` ignores the delay | 1 of 5 fails |
| `systemTimers.setInterval` delegates to `setTimeout` | 1 of 5 fails |
| `clearTimeout` is a no-op | 1 of 5 fails |
| `clearInterval` is a no-op | 1 of 5 fails |
| Poison `connectivity` along with the other five | 4 of 73 fail |
| Overwrite an existing `invalid` reason with `controller-link-lost` | 1 of 73 fails |
| Read the controller link flag uninverted | 13 of 73 fail |
| Advance the offline run on any source | 3 of 73 fail |
| Refresh `lastTrustedAt` from the violations alone | 4 of 73 fail |
| Report the lost link on every update | 1 of 73 fails |
| Never clear the lost-link flag on recovery | 1 of 73 fails |
| Degrade on a controller-link-only distrust | 3 of 73 fail |
| Call the injected timer port once in the factory | 1 of 73 fails |
| Defer through a global `setTimeout` | 1 of 73 fails |
| Defer the publish through `node:timers/promises` | 20 of 73 fail |
| Make the deferred negative control not defer | 3 of 73 fail |
| Drop the store subscription | 3 of 36 fail |
| Subscribe with a `'poll'` source | 2 of 36 fail |
| Pass the poll snapshot as `'live'` | 2 of 36 fail |
| Revert the persistence guard to its pre-plan literals | 1 of 36 fails |
| Ignore the administrator's `ignoredFaults` | 1 of 36 fails |
| Ignore the configured offline poll count | 1 of 36 fails |
| Leave the store entry, and its listener, in place on removal | 2 of 36 fail |
| Wire `systemTimers` in a second `src/` module | 1 of 36 fails |

### The four layers are demonstrably not redundant

The plan's central claim is that a single immediacy assertion is insufficient. That was tested directly, one defect at a time, reading which of the three runtime layers caught it:

| Defect | Layer 1, injected port | Layer 2, global spies | Layer 3, synchronous visibility |
|---|---|---|---|
| A call on the injected port | **fails** | passes | passes |
| A bare `globalThis.setTimeout` call | passes | **fails** | passes |
| The publish deferred through `node:timers/promises` | passes | passes | **fails** |

The third row is the research prediction confirmed against this codebase: the four global spies record **zero** calls while the publish is genuinely deferred, so a gate built on `D-18`'s injected spy plus global spies alone would have reported green against a real deferral written in this project's own house style. Layer 3 is the only runtime layer that catches it. Layer 4, the static import gate over `src/accessories/`, belongs to plan 03-07 and is not part of this evidence.

Two falsifications could not be expressed in a form that builds, and are reported as compiler catches rather than as test coverage:

- Removing the `source === 'poll'` guard entirely leaves the `source` parameter unread, which fails `noUnusedParameters`. It was re-run as `source === 'poll' || source === 'live'`, and that is the number in the table.
- Removing the log-once early return leaves `controllerLinkLost` assigned and never read, which fails `noUnusedLocals`. It was re-run with a condition that reads the flag and never returns, and that is the number in the table.

## Issues Encountered

- The first draft of the platform's persistence guard reordered accessory construction ahead of the context assignments and broke the restored-accessory path. It surfaced immediately as a thrown identity error in a pre-existing case rather than as a subtle behaviour change, which is what kept it to one fix.
- `new URL('../../src/', import.meta.url)` written with the interpolation idiom that 03-05 adopted for `fallow dead-code` is rejected by `@typescript-eslint/no-unnecessary-template-expression` when the interpolated part is a plain literal. The plain form passes both gates here because the path names a directory with no module extension, so `fallow` does not read it as an import.

## Known Stubs

- **Resolved from 03-04 and 03-05:** `src/platform.ts` now passes `ignoredFaults` and `offlineConfirmationPollCount` to the accessory, so neither takes its default in production. Both are asserted through the platform rather than only through the accessory.
- **No new stubs.** Every value this plan introduces has a reader, and every declared member of `Timers` has both a delegating implementation and a test.
- **`DistrustReason` still ships `'stale'` and `'unreachable'` unused.** That is `D-10`'s deliberate split: the time-based half of `RES-01` belongs to Phase 5. No module written here imports the clock port, reads the current time to judge freshness, or compares `receivedAt` against an interval. `timers` is in scope only as the injected port the `SAFE-07` gate measures.

## Verification Status

- `npm run test:coverage:direct` for all three source-test pairs: `timers.js`, `basementGuardian.js`, and `platform.js` each at 100% line, branch, and function coverage.
- `npm run test:unit`: 955 tests, all passed.
- `npm run test:cucumber`: 54 scenarios, 444 steps, all passed.
- `npm run check`: exit 0 on three consecutive runs.
- `.fallowrc.json` was not touched; plan 03-08 owns it.

## TDD Gate Compliance

**Every task in this plan has a genuine `test(...)` RED commit followed by a `feat(...)` GREEN commit**, which is a change from 03-04 and 03-05.

Those plans recorded that a RED commit was not expressible because `.pre-commit-config.yaml` gates the whole tree. That reasoning was checked rather than inherited: the local hooks are `npm lint`, `npm format:check`, `npm typecheck`, and `npm fallow`. **The test suite is not among them.** A commit whose tests fail therefore passes the hooks as long as it compiles, so RED is expressible whenever the test module can be made to typecheck against scaffolding.

Each task was staged that way:

| Task | RED commit | What failed, and why it was the right failure |
|---|---|---|
| 1 | `2f5a992` | The port's four members declared, `systemTimers` scheduling nothing. 2 of 5 cases failed on behaviour. The three cancellation cases passed vacuously against an object that never schedules — noted rather than counted as evidence. |
| 2 | `9197216` | `SnapshotSource`, the `timers` option, and the second `update` parameter, with the parameter ignored. 11 of 73 cases failed, exactly the new behaviour; the other 62 passed. |
| 3 | `17d60bb` | `DiscoveryContext`'s three new members and the configuration routing, with no store subscription. 4 of 36 cases failed, all of them the live-wiring behaviour. |

In every case the test module was written before the source that satisfies it, and the failure was observed and read before the implementation was written. The gate sequence `test(03-06)` then `feat(03-06)` is present three times in `git log`.

One honest limit: the RED commits contain scaffolding that is knowingly incomplete — `systemTimers` schedules nothing at `2f5a992`, and `update()` ignores its `source` at `9197216`. Nothing consumes either at those commits, so no shipped behaviour is wrong at any point in the history, but a bisect landing on `2f5a992` would find a port that does not work.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03-07 owns the fourth immediacy layer, the static import gate over `src/accessories/`, and the configuration-schema key-set test proving no alert-delay setting exists. The three runtime layers and the negative control are in place and the table above records exactly what each one catches, so 03-07 knows which residue is left.
- Plan 03-08 still owns `.fallowrc.json`; `src/accessories/services.ts` remains in `ignoreFindings` and was not touched. `src/device/health.ts` also still has its entry, and it is still warranted: `DistrustReason` now has three of its four members consumed, but `MonitoringPath`'s siblings are unchanged.
- The `SAFE-07` and `RES-02` `unclassified` edge probes the plan flagged remain exactly as flagged. `SAFE-07`'s residue is a deferral through a mechanism none of the layers watches, narrowed further by 03-07's static gate. `RES-02`'s residue is that `serial_communications` is the one fault the vendor raises no alert rule for, so the plugin's handling is asserted but the field's meaning has no second source.
- The delivery-cadence half of 03-05's `SAFE-02` and `SAFE-03` coverage entries is now wired and asserted against the real store; whether a real controller's short pump run is actually published by the vendor remains for the real-home session.

## Self-Check: PASSED

- `src/runtime/timers.ts` and `test/runtime/timers.test.ts` exist on disk; all five modified files exist and are tracked in `HEAD`.
- All six commit hashes (`2f5a992`, `fdb25c8`, `9197216`, `4bc5afc`, `17d60bb`, `b97f81b`) resolve in `git log`, and `git show --name-only` on each confirms the files it claims.
- `git diff --stat 2f5a992~1..HEAD` lists exactly the seven files named above and no others; no `.fallowrc.json` change is present.

---
*Phase: 03-safety-monitoring-in-homekit*
*Completed: 2026-08-30*
