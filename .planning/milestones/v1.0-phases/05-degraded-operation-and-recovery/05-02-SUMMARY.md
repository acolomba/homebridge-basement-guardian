---
phase: 05-degraded-operation-and-recovery
plan: 02
subsystem: safety-monitoring
tags: [homebridge, hap, typescript, cucumber, node-test, accessory-cache, restart]

requires:
  - phase: 03-safety-monitoring-in-homekit
    provides: "`StatusActive` as the one degradation signal, and `publishValue` as the tier's single write verb"
  - phase: 04-pump-records-and-official-controls
    provides: "the `04-VERIFICATION.md` W-1 warning that the Cucumber tier is blind to this projection path, and the open real-home item about an upgrade over an older cache"
  - phase: 05-degraded-operation-and-recovery
    plan: 01
    provides: "`Given the service fails every request with status 503`, the sustained REST failure that keeps a restart from republishing"
provides:
  - "`src/accessories/staleMarking.ts` — `markRestoredServicesStale`, the exported restart marking pass the platform and the Cucumber harness both call"
  - "`serializeService` / `deserializeService` in `features/support/fakeHap.ts` — the accessory-cache round trip, modelled on HAP's own serializers"
  - "`FakeAccessory.services` and `HarnessPlatformAccessory.sideloadServices` — the restored service surface every later restart assertion rests on"
affects: [05-03-command-gating, 05-04-credential-rejection, 05-05-documentation]

actuals:
  tokens: 7688
  tasks: 2
  commits: 3
  # `estimateTokens` scale: chars/4 over the realized diff (30 750 chars, 9 files,
  # 445 insertions). The plan's 85 000 projection was taken over the read set rather
  # than the diff, so the two are not on the same footing; chars/4 over the full
  # contents of the nine changed files is 49 376. Wave 1 recorded the same mismatch,
  # so a calibration pass now has two samples measuring the same thing.

tech-stack:
  added: []
  patterns:
    - "A restart-time pass exported as a free function, so the platform method and the Cucumber harness drive one implementation rather than two"
    - "A fake that models a real serializer pair (`Service.serialize` / `Service.deserialize`) rather than inventing its own cache shape"
    - "A harness flag carried through the cache instead of asserted on restore, so a value nothing wrote keeps reading as unwritten"

key-files:
  created:
    - src/accessories/staleMarking.ts
    - test/accessories/staleMarking.test.ts
  modified:
    - features/support/fakeHap.ts
    - features/support/fakeHomebridgeApi.ts
    - features/support/world.ts
    - features/degradedOperation.feature
    - src/platform.ts
    - test/platform.test.ts
    - test/accessories/timerFreedom.test.ts

key-decisions:
  - "The harness carries `pushed` through the cache rather than forcing it true on every restore, which is stricter: a characteristic HAP constructed and nothing ever wrote still reads as unwritten after a restart."
  - "The restore rebuilds plain `Service` and `Characteristic` objects and replaces both lists wholesale, which is what `Accessory.deserialize` and `Service.deserialize` do; adding to the constructed list instead would leave a second `AccessoryInformation` behind."
  - "`RES-04` is NOT marked complete. Plans 05-03, 05-04 and 05-05 each own part of it, and `05-CONTEXT.md` rules that requirement rows are reconciled at phase close-out rather than mid-flight."
  - "Deleting the platform call site leaves all 85 scenarios green, because the harness stands in for `configureAccessory`. That gap is structural and is covered by the platform unit case, which fails on the same mutation."

patterns-established:
  - "The marking pass counts what it marked, so a test asserts work happened rather than that an empty enumeration raised nothing"
  - "`testCharacteristic` guards the push, so an upgrade over an older cache adds no characteristic to a service that never carried one"

requirements-completed: []

coverage:
  - id: D1
    description: "Homebridge hands a cached accessory back and every restored service that already carries `Status Active` reads `false` from that moment, before any poll has run."
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A restarted plugin marks restored values stale before any poll"
        status: pass
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#leaves every marked service reporting that it cannot vouch for its value"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#withdraws trust from every restored service that reports it, and still records the accessory (RES-04, D-06)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A restored accessory keeps every characteristic value the previous run left on it; the pass changes `Status Active` and nothing else."
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A restart retains the values it marks stale"
        status: pass
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#retains every reading on a service it marks, so the tile keeps its last value"
        status: pass
    human_judgment: false
  - id: D3
    description: "A restored service that never carried `Status Active` does not gain one, so an upgrade over a cache written by an older release adds no characteristic."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#adds no trust row to a restored service that never carried one"
        status: pass
    human_judgment: false
  - id: D4
    description: "The marking pass is one exported function that `BasementGuardianPlatform.configureAccessory` and the Cucumber harness both call, so a scenario drives production code."
    verification:
      - kind: unit
        ref: "test/platform.test.ts#withdraws trust from every restored service that reports it, and still records the accessory (RES-04, D-06)"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#A restarted plugin marks restored values stale before any poll"
        status: pass
    human_judgment: false
  - id: D5
    description: "The Cucumber harness restores each cached accessory's services and each characteristic's last value, with the `pushed` flag, so a value the previous run published reads as published."
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A restart retains the values it marks stale"
        status: pass
      - kind: e2e
        ref: "features/pumpRecords.feature#The observation record comes back after a restart with its count and its start"
        status: pass
    human_judgment: false
  - id: D6
    description: "No telemetry snapshot is written into `accessory.context`; the pass reads nothing from the context and constructs no `BasementGuardianAccessory`."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#marks an accessory whose context names no device, and leaves that context alone"
        status: pass
    human_judgment: false
  - id: D7
    description: "The pass reports how many services it marked, so a test asserts it did work rather than that an empty enumeration raised nothing."
    verification:
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#counts every restored service that already reports whether the plugin vouches for it"
        status: pass
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#marks nothing on an accessory the cache restored with no services at all"
        status: pass
    human_judgment: false
  - id: D8
    description: "A restart with the cloud unreachable never presents an unmarked window, because every `configureAccessory` call lands before `didFinishLaunching`."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/platform.test.ts#withdraws trust from every restored service that reports it, and still records the accessory (RES-04, D-06)"
        status: pass
    human_judgment: true
    rationale: "The synchronous half is asserted. The Homebridge call ordering it rests on is the runtime's own and cannot be proven from this repository; it is the backstop truth PA-04 records."
  - id: D9
    description: "An upgrade over a cache a previous release wrote shows the tile present with its last reading and `Status Active - No`, and no service gains a characteristic it did not have."
    verification: []
    human_judgment: true
    rationale: "No test here has met a real Homebridge accessory cache; the harness restores through a JSON round trip of its own design. Extends the open item recorded as human item 1 in `04-UAT.md`."

duration: 14min
completed: 2026-09-01
status: complete
---

# Phase 5 Plan 02: Restart on Cached State Summary

**A restart that never reaches the cloud now shows every cached reading exactly where the last run left it, with every one of them saying plainly that the plugin cannot currently vouch for it.**

## Performance

- **Duration:** 14 min (first commit to last)
- **Started:** 2026-09-02T01:23:21Z
- **Completed:** 2026-09-02T01:37:18Z
- **Tasks:** 2 of 2
- **Files modified:** 9 (2 created, 7 modified)

## Accomplishments

- The Cucumber harness now carries a restart the way Homebridge does. Each cached accessory comes back with its services, each characteristic's last value and properties, and the `pushed` flag, so a stale value exists to be wrong about.
- `markRestoredServicesStale` is one exported function with two call sites. Deleting the marking from it fails four unit cases and both new scenarios at once, which is the proof that Cucumber drives production code rather than a harness copy.
- All 83 pre-existing scenarios passed unchanged against the restoring harness. None failed, and the one that could have been silently weakened was probed and shown not to be.
- Both mutations `05-VALIDATION.md` names for this plan were applied, watched to fail, reverted, and green restored.
- The gate ran green on Node 22.22.2 and Node 26.7.0: 1258 unit tests, 85 scenarios, 846 steps, 100/100/100.

## Task Commits

1. **Task 1: Reverse the harness's dropped service surface** - `ec7c718`
2. **Task 2: Mark every restored service stale at `configureAccessory`** - `e68d112` (test), `3362c62` (feat)

**Plan metadata:** see the `docs(05-02)` commit that follows this file.

## Files Created/Modified

- `src/accessories/staleMarking.ts` - the pass: walk `accessory.services`, guard on `testCharacteristic`, push through `publishValue`, return the count.
- `test/accessories/staleMarking.test.ts` - seven cases over the count, the value withdrawn, the values retained, the row not added, the empty surface, and the empty context.
- `features/support/fakeHap.ts` - `SerializedCharacteristic`, `SerializedService`, `serializeService`, `deserializeService`.
- `features/support/fakeHomebridgeApi.ts` - the cache entry gains a serialized surface; `HarnessPlatformAccessory.services` is public and gains `sideloadServices`; the superseded docblock is rewritten.
- `features/support/world.ts` - `restoredAccessories` calls the shared pass, and its comment says why it is deliberately not stood in for.
- `features/degradedOperation.feature` - two scenarios.
- `src/platform.ts` - `configureAccessory` calls the pass before the map insertion and logs the count.
- `test/platform.test.ts` - the new marking case, plus the `services` and `hap` expectations the three existing cases now need.
- `test/accessories/timerFreedom.test.ts` - module floor 9 to 10.

## Pre-existing scenarios against the harness change

**None failed.** The full run reported 83 scenarios and 822 steps, all passing, immediately after the harness change and before a single new scenario existed.

That is a weaker statement than it looks, so it was checked rather than accepted. Only two pre-existing scenarios restart at all: `authentication.feature#A restart reuses the cached token`, which asserts a token-request count and cannot be reached by a service surface, and `pumpRecords.feature#The observation record comes back after a restart with its count and its start`, which asserts three values on the restored `Backup Pump` service. The second one could plausibly have started passing off the restored HAP cache instead of off the accessory context Phase 4 built it to prove.

It was probed directly: the harness was temporarily changed to strip `primaryPump`, `backupPump` and `watermarks` from the restored context while leaving the new service surface intact. The scenario failed, on `Activations Observed Since Observation Start` never reaching `1`. So the assertion still rests on the context restore, not on the cached characteristic. The cause is that `restartPlugin` awaits the whole launch, so the plugin has already republished onto the restored accessory by the time the step reads. The probe was reverted before the commit.

## Mutation Testing

Both mutations `05-VALIDATION.md` names for a behaviour in this plan were applied, watched to fail, reverted, and green restored.

| # | Mutation | What failed | Restored |
|---|---|---|---|
| 1a | Delete the marking from the pass (`publishValue` removed, count kept) | `staleMarking.test.ts` - `leaves every marked service reporting that it cannot vouch for its value`; `platform.test.ts` - `withdraws trust from every restored service that reports it, and still records the accessory`; Cucumber - both `A restarted plugin marks restored values stale before any poll` and `A restart retains the values it marks stale`, each on `Status Active` never reading `false` | green, 1258 unit / 85 scenarios |
| 1b | Delete the `configureAccessory` call site (the row's literal wording) | `platform.test.ts` - `withdraws trust from every restored service that reports it, and still records the accessory`, plus three `verify(api)` failures in the neighbouring cases whose expectations then go unmet. **Cucumber stayed green at 4/4 restart scenarios** | green |
| 2 | Push a format default onto every characteristic of a marked service instead of only `Status Active` | `staleMarking.test.ts` - `retains every reading on a service it marks, so the tile keeps its last value`; `platform.test.ts` - the same marking case, on `Leak Detected`; Cucumber - `A restart retains the values it marks stale`, on `Water Level` never reading `20` | green, 1258 unit / 85 scenarios |

**Mutation 1b is the one worth reading twice.** Removing the platform call site leaves every scenario passing, because `features/support/world.ts` stands in for `configureAccessory` and calls the pass itself. The end-to-end tier therefore proves that the pass behaves correctly, and cannot prove that the platform calls it. That half is carried by `test/platform.test.ts` alone, which fails on the same mutation. This is a structural limit of the harness, not a defect introduced here, and it is the reason D-12 asked for a shared function rather than for a scenario.

Mutation 2 also raises `error TS2445: Property 'getDefaultValue' is protected` against the production tsconfig. `tsc` emitted anyway, so the mutated code ran and the behavioural evidence above stands.

## Decisions Made

- **`pushed` is carried through the cache, not forced true on restore.** The plan's wording was to set it `true` on every restored characteristic. Carrying the stored flag instead serves the same stated purpose - a value the plugin wrote reads as published - and is strictly stricter: `Identify` on `AccessoryInformation`, which HAP constructs and nothing ever writes, comes back reading as unwritten rather than as a published `false`. Forcing the flag would have re-created, in a new place, the exact confusion between a published value and a format default that `pushedValue` exists to draw.
- **The restore models HAP's own serializer pair.** `Characteristic.serialize` persists `value` and `props` and no status; `Service.deserialize` replaces both characteristic lists wholesale; `Accessory.deserialize` replaces the whole service list through `_sideloadServices`. The fake follows all three, which is why a restored accessory carries exactly one `AccessoryInformation` rather than tripping `refuseDuplicateService`.
- **`optionalCharacteristics` are serialized too**, though the plan's enumeration did not list them. The real `Service.serialize` persists them and `declareCharacteristic` reads them, so omitting them would have left the docblock's fidelity claim quietly qualified.
- **`RES-04` is left `Pending`.** Plans 05-03, 05-04 and 05-05 each own part of it. `05-CONTEXT.md` rules that requirement rows are reconciled at phase close-out, and marking a requirement complete while three plans still owe it is the exact misreporting that context flags as pre-existing damage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing correctness] The restored `pushed` flag is carried rather than forced true**

- **Found during:** Task 1, writing the restore.
- **Issue:** the plan says to set every restored characteristic's `pushed` to `true`. Applied literally, a characteristic HAP constructed and the plugin never wrote comes back reading as a value the plugin published, which is the distinction `pushedValue` exists to draw and the shape of every false green this project has paid for.
- **Fix:** the flag is serialized into the cache entry beside the value and restored as it was stored. Every value the plugin wrote still comes back `pushed: true`, which is what the plan's own stated reason asks for.
- **Files modified:** `features/support/fakeHap.ts`
- **Verification:** a direct probe over the compiled harness shows `Status Active` and `Leak Detected` restored with `pushed: true` and `statusCode: 0`, and `Identify` restored with `pushed: false`.
- **Committed in:** `ec7c718`

**2. [Rule 3 - Blocking] Three existing `configureAccessory` cases had strict mocks that touched nothing**

- **Found during:** Task 2 GREEN.
- **Issue:** `records a restored accessory under its UUID`, `keeps one entry when the same accessory is restored twice` and `D-03 removes nothing from HomeKit on cache-restore alone` each build a `mock<PlatformAccessory>` and a `mock<API>` with no expectations, which was the assertion that `configureAccessory` reads nothing else. It now reads `accessory.services` and `this.api.hap`, so all three failed with `accessory.services is not iterable`.
- **Fix:** each case gained `when(() => accessory.services).thenReturn([])` and `when(() => api.hap).thenReturn(HAP_NAMESPACE)`, with `.times(2)` on the case that calls the method twice. The "touched nothing else" property is preserved: every other member is still unstubbed and `verify()` still runs.
- **Files modified:** `test/platform.test.ts`
- **Verification:** mutation 1b above - deleting the call site makes all three fail again on unmet expectations, so the expectations are load-bearing rather than decoration.
- **Committed in:** `3362c62`

**3. [Rule 2 - Missing correctness] `optionalCharacteristics` added to the serialized surface**

- **Found during:** Task 1.
- **Issue:** the plan enumerated `UUID`, `displayName`, `subtype` and each characteristic's `UUID`, `displayName` and `value`. `props` is required to construct a stand-in characteristic at all, and the real `Service.serialize` persists the optional declarations that `declareCharacteristic` reads before adding one.
- **Fix:** both are serialized and restored.
- **Files modified:** `features/support/fakeHap.ts`
- **Verification:** the probe shows a restored `LeakSensor` carrying its four optional declarations.
- **Committed in:** `ec7c718`

---

**Total deviations:** 3 auto-fixed (2 x Rule 2, 1 x Rule 3)
**Impact on plan:** none on scope. All three are inside the plan's own files, and the first is a narrowing of one plan instruction in the direction the instruction's stated reason points.

## Issues Encountered

- **Three of the seven unit cases passed at RED.** `adds no trust row to a restored service that never carried one`, `retains every reading on a service it marks` and `marks nothing on an accessory the cache restored with no services at all` all assert that something does *not* happen, and the stub did nothing, so all three were satisfied by a pass that had not been written. They are pinned by mutation 2 rather than by having been watched to fail first. The four cases that assert a positive - the count and the withdrawn value - did fail at RED.
- **The end-to-end tier cannot see the platform call site.** See mutation 1b above.
- **Node 24.x was not available on this machine.** The gate ran green on Node 22.22.2 (`/usr/bin/node`, a CI target) and on the local Node 26.7.0. Node 24.x is covered by CI only, unchanged from wave 1.

## Known Stubs

None. `src/accessories/staleMarking.ts` carried a deliberate no-op for exactly one commit (`e68d112`, the RED half of the TDD pair) and was implemented in the next one. No hardcoded or placeholder value reaches a characteristic.

## Threat Flags

None. No new network endpoint, auth path, file access pattern, or schema at a trust boundary. The one new log line names a display name Homebridge already logs and a count.

Both mitigations this plan owns hold structurally: `T-05-08` because the pass reads nothing from `accessory.context` and the context interface is unchanged, asserted by `marks an accessory whose context names no device, and leaves that context alone`; and `T-05-09` because `testCharacteristic` guards the push, asserted by `adds no trust row to a restored service that never carried one`.

## Verification

Run on Node 22.22.2 and Node 26.7.0. Node 24.x unavailable locally.

| Gate | Result |
|---|---|
| `npm run test:coverage:direct` - `staleMarking` pair | 7/7, 100 lines / 100 branches / 100 functions |
| `npm run test:cucumber` (after the harness change, before any new scenario) | 83 scenarios, 822 steps, all passing |
| `npm run test:cucumber` (final) | 85 scenarios, 846 steps, all passing |
| `npm run check` | green (typecheck, lint, fallow, format:check, unit + Cucumber) |
| `npm run test:coverage:all` | 1258 tests, 100 / 100 / 100 over `dist-test/src/**/*.js` |
| Node 22.22.2 unit + coverage | 1258 tests, 100 / 100 / 100 |
| Node 22.22.2 Cucumber | 85 scenarios, 846 steps, all passing |

`npm run fallow` reports one pre-existing clone group in `features/support/steps/hap.ts:113-124` / `:168-181`. It predates this plan and was left alone.

## TDD Gate Compliance

`e68d112` is the RED commit (`test(05-02)`), `3362c62` the GREEN one (`feat(05-02)`), in that order. No refactor was needed. Four unit cases and one platform case were watched to fail before the implementation existed; the caveat about the three negative cases is recorded under Issues Encountered.

## User Setup Required

None - no external service configuration.

## Human Verification Outstanding

One item, extending `04-UAT.md` human item 1: install this build over an accessory cache written by a release that predates it, restart Homebridge with the vendor cloud unreachable, and open the accessory in Apple Home. Expect the tile present, showing the reading the previous run left, with `Status Active - No` under Details, and no service carrying a characteristic it did not have before the upgrade. No test in this repository has met a real Homebridge accessory cache.

## Next Phase Readiness

Ready for plans 05-03 and 05-04. Two things a later plan must not undo:

- **The harness restore is now load-bearing for every restart assertion in this phase.** Weakening it back toward an empty service surface would make those assertions vacuous again without failing anything.
- **`markRestoredServicesStale` must stay the only implementation.** Plan 05-04 pushes a `HapStatusError` for credential rejection and `05-VALIDATION.md` routes one of its unit rows through `test/accessories/staleMarking.test.ts`; that push belongs beside this one as a separate narrowly named function, never inside `publishValue`.

`REQUIREMENTS.md` still shows `RES-04` `Pending`, which is correct: this plan delivers the "accessories remain present and visibly stale" sentence, and plans 05-03, 05-04 and 05-05 owe the rest.

---

*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-01*

## Self-Check: PASSED

Both created source files exist on disk, as does this summary. All three task commits (`ec7c718`, `e68d112`, `3362c62`) are reachable from `HEAD`, and each was confirmed non-empty with `git show --name-only --format=""` at the moment it was made.
