---
phase: 05-degraded-operation-and-recovery
plan: 04
subsystem: safety-monitoring
tags: [homebridge, hap, typescript, cucumber, node-test, credential-rejection, fixture-fidelity]

requires:
  - phase: 03-safety-monitoring-in-homekit
    provides: "D-05, the locked decision forbidding `HapStatusError` for degradation reporting, which D-10 amends narrowly"
  - phase: 04-pump-records-and-official-controls
    provides: "`test/accessories/hapWriteFidelity.test.ts` and D-17, the one permitted direct import of the pinned HAP package"
  - phase: 05-degraded-operation-and-recovery
    plan: 01
    provides: "`MonitoringTrust`, `applyMonitoringHealth`, and `markMonitoring` with its store outside the early return"
  - phase: 05-degraded-operation-and-recovery
    plan: 02
    provides: "`src/accessories/staleMarking.ts`, the restart pass this one sits beside, and the harness restore every restart assertion rests on"
  - phase: 05-degraded-operation-and-recovery
    plan: 03
    provides: "`commandTransportReady`, the terminal authentication branch's push, and the three-member unchanged-value comparison this plan grows to four"
provides:
  - "The corrected error path on `features/support/fakeHap.ts`'s `updateCharacteristic`, and the fidelity cases holding it against the pinned real HAP"
  - "`MonitoringTrust.credentialsRejected` — the one condition the plugin can be in that never clears itself"
  - "`publishPersistentFailure` — the single production call site of the act 03-CONTEXT D-05 otherwise forbids"
  - "`markServicesUnreadable` — the whole-accessory pass that reaches restored accessories no `BasementGuardianAccessory` was ever built for"
  - "`Then the {string} service answers no read for {string}` and its positive counterpart, the two steps that tell unreadable from merely marked"
affects: [05-05-documentation]

actuals:
  tokens: 10797
  tasks: 2
  commits: 4
  # `estimateTokens` scale: chars/4 over the realized diff (43 188 chars of added
  # lines across 15 files). The figure is inflated by roughly a fifth because
  # `test/accessories/staleMarking.test.ts` was re-indented wholesale into two
  # `describe` blocks, so 188 unchanged lines count as added. The plan's 95 000
  # projection was taken over the read set rather than the diff. This is the
  # fourth sample in this phase recording the same mismatch (21 112, 7 688,
  # 13 025, 10 797 against 115 000, 85 000, 85 000, 95 000), which is enough to
  # say the projections measure a different thing rather than being wrong by a
  # factor.

tech-stack:
  added: []
  patterns:
    - "A hand-built stand-in's newly reachable branch is corrected and pinned against the real package before anything asserts through it"
    - "A locked prohibition amended by narrowing its gate to a counted, located exception rather than by removing the module from the gate"
    - "A second write verb beside the first, so a search for the forbidden act answers exactly one production call site"

key-files:
  created: []
  modified:
    - features/support/fakeHap.ts
    - features/support/steps/homekit.ts
    - features/degradedOperation.feature
    - src/runtime/monitoringHealth.ts
    - src/runtime/accountRuntime.ts
    - src/accessories/serviceCatalogue.ts
    - src/accessories/staleMarking.ts
    - src/accessories/basementGuardian.ts
    - src/platform.ts
    - test/accessories/hapWriteFidelity.test.ts
    - test/accessories/serviceCatalogue.test.ts
    - test/accessories/staleMarking.test.ts
    - test/accessories/basementGuardian.test.ts
    - test/platform.test.ts
    - test/runtime/accountRuntime.test.ts

key-decisions:
  - "The HAP stand-in defect PA-06 named is real and was fixed first. Four fidelity cases were watched to fail against the unfixed stand-in; the failure message is quoted below."
  - "The Phase 3 static gate forbidding `HapStatusError` under `src/accessories/` was narrowed rather than relaxed: three modules must still name it zero times, and `serviceCatalogue.ts` must name it exactly once, inside `publishPersistentFailure`."
  - "The credential scenario needed `Given the storage holds a token for another account`. Without it the restart reuses the cached token, never authenticates, and the scenario passes on a run the vendor never refused. This was found by watching it fail, not by reasoning."
  - "A positive read step was added beside the negative one, because `reports {string} as {string}` reads the stored value and cannot tell a readable characteristic from an unreadable one."
  - "`RES-04` is NOT marked complete. Plan 05-05 still owes part of it, and `05-CONTEXT.md` rules that requirement rows reconcile at phase close-out."

patterns-established:
  - "A fixture's fidelity to the real boundary is established before the first assertion rides on it, not after a scenario looks green"
  - "A prohibition gate is amended by counting and locating the exception, so the exception cannot silently become a second one"

requirements-completed: []

coverage:
  - id: D1
    description: "The hand-built HAP stand-in agrees with the pinned real HAP on the push-an-error path: both store the status, both leave the value and the published flag untouched, and both throw the stored status on a later read."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/hapWriteFidelity.test.ts#keeps the published value and stores the pushed status when an error is pushed, on both implementations"
        status: pass
      - kind: unit
        ref: "test/accessories/hapWriteFidelity.test.ts#converts a plain Error pushed onto a characteristic to a communication failure, on both implementations"
        status: pass
      - kind: unit
        ref: "test/accessories/hapWriteFidelity.test.ts#leaves a pushed status on On when StatusActive is pushed, on both implementations"
        status: pass
      - kind: unit
        ref: "test/accessories/hapWriteFidelity.test.ts#leaves the stand-in published flag where it was when an error is pushed"
        status: pass
    human_judgment: false
  - id: D2
    description: "An unreadable characteristic returns to readable on the next ordinary push, on both implementations, which is what makes the platform's ordering load-bearing rather than incidental."
    verification:
      - kind: unit
        ref: "test/accessories/hapWriteFidelity.test.ts#returns an unreadable characteristic to readable on the next ordinary push, on both implementations"
        status: pass
    human_judgment: false
  - id: D3
    description: "Credential rejection makes a read throw and retains the value the plugin last published."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#makes a read throw the pushed status and leaves the value the plugin last published"
        status: pass
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#makes a read of every marked service throw the status it was given, and leaves the value it held"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#Credential rejection makes every service unreadable"
        status: pass
    human_judgment: false
  - id: D4
    description: "Credential rejection is the only cause that does this: a shadow silence, a REST degradation, an unready command transport, and both transports lost all leave every characteristic readable."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/platform.test.ts#leaves every restored accessory readable for a shadow silence"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#leaves every restored accessory readable for a REST degradation"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#leaves every restored accessory readable for an unready command transport"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#leaves every restored accessory readable for both transports lost"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#A transport outage leaves every service readable"
        status: pass
    human_judgment: false
  - id: D5
    description: "The pass reaches every accessory in the platform's own map, which is where a halted restart's restored accessories live, and the error survives the boolean fan-out that runs before it."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/platform.test.ts#makes every restored accessory unreadable when the vendor has refused the credentials"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#leaves the pushed status standing after the boolean fan-out has run"
        status: pass
    human_judgment: false
  - id: D6
    description: "The terminal authentication branch pushes `credentialsRejected` true with `commandTransportReady` false, and nothing reaches the vendor afterwards."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 pushes a rejected credential and an unready command transport, and never reaches the vendor again"
        status: pass
    human_judgment: false
  - id: D7
    description: "`publishValue` accepts no error, so the narrow exception cannot be taken through the ordinary verb and a search for the forbidden act answers exactly one production call site."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts (module-scope `@ts-expect-error` over `Parameters<typeof publishValue>[2]`)"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#serviceCatalogue.ts names an errored characteristic once, inside publishPersistentFailure"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#basementGuardian.ts signals no untrusted scope through an errored characteristic"
        status: pass
    human_judgment: false
  - id: D8
    description: "The pass adds no characteristic to a restored service that never carried one, and reads nothing from the accessory context."
    verification:
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#counts every service that reports whether the plugin vouches for it, and leaves one that never did alone"
        status: pass
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#marks an accessory whose context names no device, and leaves that context alone"
        status: pass
    human_judgment: false
  - id: D9
    description: "Apple Home draws a No Response accessory in a way that still lets an owner reach cached values, automations built on its sensors survive, and -70402 is the status it renders that way."
    verification: []
    human_judgment: true
    rationale: "Three Apple behaviours, none answerable from this repository or from the pinned packages. `05-RESEARCH.md` A1 and A3 remain open, and `D-10` records that a negative finding reopens the decision, not `RES-04`. Joins the open `G-003` / `G-004` real-home session."

duration: 28min
completed: 2026-09-01
status: complete
---

# Phase 5 Plan 04: Credential Rejection Summary

**A vendor refusal of the account credentials now presents in HomeKit as a failure an owner has to act on, still carrying every reading the plugin last vouched for — and the harness that asserts it was first corrected to model the real HAP rather than its opposite.**

## Performance

- **Duration:** 28 min (first commit to last)
- **Started:** 2026-09-02T02:39:20Z
- **Completed:** 2026-09-02T03:07:50Z
- **Tasks:** 2 of 2
- **Files modified:** 15 (0 created, 15 modified)

## Accomplishments

- The HAP stand-in modelled the inverse of production on the push-an-error path and nothing had ever noticed. It is corrected, and four cases hold it against the pinned real package. All four were watched to fail against the unfixed version.
- A refused credential now reaches HomeKit as an unreadable accessory that still carries its last readings. Every other failure the plugin can have still leaves the tile readable and marked, asserted directly against four separate degradation shapes.
- The Phase 3 gate that forbids `HapStatusError` under `src/accessories/` was narrowed rather than relaxed. Three modules must still name it zero times; `serviceCatalogue.ts` must name it exactly once, inside `publishPersistentFailure`. A second construction anywhere in the catalogue fails the gate.
- Both mutations `05-VALIDATION.md` names for this plan were applied, watched to fail their named tests, reverted, and green restored.
- The credential scenario was passing for the wrong reason before it was fixed, and the fix came from watching it fail rather than from reading it. See "The scenario that would have proven nothing" below.
- The gate ran green on Node 22.22.2 and Node 26.7.0: 1294 unit tests, 89 scenarios, 894 steps, 100/100/100.

## Task Commits

1. **Task 1: Make the HAP stand-in model the push-an-error path** — `5643aaf` (test), `70f310b` (fix)
2. **Task 2: Make a refused credential a persistent, user-actionable failure** — `ca9993b` (test), `068e0d8` (feat)

**Plan metadata:** see the `docs(05-04)` commit that follows this file.

## The stand-in defect, and the message it produced

`PA-06` was right, and the divergence is exactly the one it named. `features/support/fakeHap.ts`'s
`updateCharacteristic` cleared the stored status and assigned whatever it was handed — including an
`Error` object — as the characteristic's value. The pinned real `Characteristic.updateValue` does the
opposite: it short-circuits on `value instanceof Error`, assigns `statusCode`, and returns **before**
it validates or stores anything
`[node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1628-1635]`.

Four new fidelity cases were watched to fail against the unfixed stand-in. The first one's message,
quoted verbatim (`+ actual` is the real HAP, `- expected` is the stand-in):

```
✖ keeps the published value and stores the pushed status when an error is pushed, on both implementations
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    {
  +   rejectedWith: -70402,
  +   statusCode: -70402,
  +   value: true
  -   rejectedWith: undefined,
  -   statusCode: 0,
  -   value: StandInHapStatusError: status code: -70402
  -     hapStatus: -70402
    }
```

The stand-in stored the error **as the value**, cleared the status to `0`, and went on answering
reads. Every D-10 assertion in this plan would have run against that. The other three that failed
were the plain-`Error` conversion, the per-characteristic status isolation, and the `pushed` flag.

The fix reuses the stand-in's existing `thrownStatusOf` mapping rather than writing a second one, so
its write path and its push path cannot disagree about what a given error means. Two comments were
corrected: the one above `updateCharacteristic`, which asserted that the real `updateValue` clears
the status *unconditionally*, and the one on `FakeHapCharacteristic.statusCode`, which said any push
clears it. Both were true only on the non-error path.

## The scenario that would have proven nothing

Written as the plan specified, `Credential rejection makes every service unreadable` failed — and it
failed on the step *before* the one that mattered:

```
Then the log names how to correct the account
    AssertionError: false !== true
```

The vendor had never refused anything. `When the plugin restarts` reuses the cached token
(`features/authentication.feature#A restart reuses the cached token` asserts exactly that), so the
restart never asked the tenant for a grant and never met the refusal. Had the read assertion been
weaker, the scenario would have gone green on a run in which nothing was rejected.

`Given the storage holds a token for another account` was added, which is the mechanism
`features/authentication.feature`'s own refusal scenario already uses: a foreign cache forces a fresh
grant, and the fresh grant is refused. The scenario carries a paragraph saying so, because the step
would otherwise read as unmotivated and a later editor would remove it.

This is the third finding of hazard 1's shape in this phase, after wave 1's out-of-domain
`water_level: 2` and wave 3's `REPOSITORY_ROOT` resolving into `dist-test/`.

## Mutation Testing

Both mutations `05-VALIDATION.md` names for a behaviour in this plan were applied, watched, reverted,
and green restored. Neither left a tier green.

| # | Mutation | What failed | Restored |
|---|---|---|---|
| 1 | Push `false` instead of a `HapStatusError` in `publishPersistentFailure` | 5 unit cases — `serviceCatalogue.test.ts` `declares an undeclared characteristic and makes it answer the pushed status` and `makes a read throw the pushed status and leaves the value the plugin last published`; `staleMarking.test.ts` `makes a read of every marked service throw the status it was given, and leaves the value it held`; `platform.test.ts` `makes every restored accessory unreadable when the vendor has refused the credentials` and `leaves the pushed status standing after the boolean fan-out has run`. Cucumber — `Credential rejection makes every service unreadable`, on `Status Active` going on answering a read. The readable-transport scenario stayed green | green, 1294 unit / 89 scenarios |
| 2 | Make the shadow-silence path push an error too (`if (!trust.credentialsRejected && !trust.shadowSilent) return;`) | 2 unit cases — `platform.test.ts` `leaves every restored accessory readable for a shadow silence` and `leaves every restored accessory readable for both transports lost`. Cucumber — `A transport outage leaves every service readable`, on `Status Active` having stopped answering a read. The credential scenario stayed green | green, 1294 unit / 89 scenarios |

The two rows are each other's control: mutation 1 fails the credential scenario alone and mutation 2
fails the readable scenario alone, so neither scenario is standing in for the other.

## `markMonitoring`'s unchanged-value check, read rather than tested

The plan asked for this to be recorded, and for no test to be written, because nothing inside the
accessory reads `credentialsRejected` — `applyMonitoringHealth` consumes it from its own argument, so
any assertion over the stored copy would agree with itself.

Read back from `src/accessories/basementGuardian.ts` after the change:

```ts
const unchanged =
  trust.restDegraded === monitoring.restDegraded &&
  trust.shadowSilent === monitoring.shadowSilent &&
  trust.commandTransportReady === monitoring.commandTransportReady &&
  trust.credentialsRejected === monitoring.credentialsRejected;

monitoring = trust;   // outside the early return

if (unchanged) {
  return;
}
```

Both halves hold: the comparison enumerates all four members of `MonitoringTrust`, and the store sits
outside the early return where plan 05-01 put it and plan 05-03 kept it. The comment above it now
says that any member left out of the list is a fact the runtime pushed and the accessory silently
ignored, so the rule does not have to be rediscovered when the type grows a fifth member.

## Files Created/Modified

- `features/support/fakeHap.ts` — the error branch in `updateCharacteristic`, and the two corrected comments.
- `test/accessories/hapWriteFidelity.test.ts` — `pushErrorOn` on the shared write surface, four new cases (three comparative, one stand-in-only for `pushed`).
- `src/runtime/monitoringHealth.ts` — `MonitoringTrust.credentialsRejected`, with the thirty-day rationale on it.
- `src/runtime/accountRuntime.ts` — `monitoringTrustNow()` assembles it from `halted`, with a comment naming the single place `halted` is set.
- `src/accessories/serviceCatalogue.ts` — `publishPersistentFailure` beside `publishValue`, with the doc comment naming the decision it excepts, the decision that grants the exception, and why it is a separate verb.
- `src/accessories/staleMarking.ts` — `markServicesUnreadable`, and a rewritten `@fileoverview` describing both passes and the difference between what they leave behind.
- `src/accessories/basementGuardian.ts` — the four-member comparison and the initial stored trust.
- `src/platform.ts` — the credential branch in `applyMonitoringHealth`, ordered after the fan-out, walking `context.accessories`.
- `features/support/steps/homekit.ts` — `readThrows`, and the two steps that drive a read.
- `features/degradedOperation.feature` — two scenarios.
- `test/accessories/serviceCatalogue.test.ts` — the `publishPersistentFailure` describe (4 cases), the `readOf` helper, and the module-scope type negative over `publishValue`'s parameter.
- `test/accessories/staleMarking.test.ts` — restructured into two `describe` blocks, one per exported entrypoint, with 5 new cases.
- `test/accessories/basementGuardian.test.ts` — the errored-characteristic gate narrowed to a count and a location.
- `test/platform.test.ts` — the restored-accessory fixture, the read helpers, and 6 new `applyMonitoringHealth` cases.
- `test/runtime/accountRuntime.test.ts` — the terminal-branch case widened to assert the whole recorded call list, plus the widened contract in four expectations.

## Decisions Made

- **The Phase 3 gate was narrowed, not relaxed.** Deleting `serviceCatalogue.ts` from
  `ACCESSORY_MODULES` would have permitted the module wholesale, which is exactly the "general
  licence" `D-10` refuses to grant. Instead the gate now asserts a count and a location: three modules
  name `HapStatusError` zero times, and `serviceCatalogue.ts` names it once, inside
  `publishPersistentFailure`. A second construction anywhere in the catalogue fails.
- **`publishValue`'s parameter type is pinned by a compile-time negative rather than a call.** Making
  the call would push the very error the type exists to refuse, so the check is a module-scope
  `@ts-expect-error` over `Parameters<typeof publishValue>[2]`, which fails the build if the
  assignment ever starts type-checking. `CharacteristicValue` is
  `PrimitiveTypes | PrimitiveTypes[] | { [key: string]: PrimitiveTypes }`, and `Error` is an
  interface, so it gets no implicit index signature and the negative is genuine.
- **A positive read step was added beside the negative one.** The plan's interface list named only
  `answers no read for`. The existing `reports {string} as {string}` reads the *stored* value through
  `pushedValue`, so it cannot tell a readable characteristic from an unreadable one, and the plan's
  own behaviour line for the second scenario says the tile "still answers a read". Without the
  positive step the distinction between the two presentations would have been assumed at the
  end-to-end tier rather than asserted. Both steps drive `handleGetRequest` through one shared
  `readThrows`.
- **`markServicesUnreadable` walks the accessory's services rather than reusing the restart pass's
  loop through a shared helper.** The two loops are six lines each and differ in the verb they push
  through; `npm run fallow` reports no clone group for them. Extracting a `mark(service)` callback
  would have been an abstraction for two callers whose whole difference is the one line it would
  parameterise.
- **`applyMonitoringHealth` discards the count.** The restart pass logs its count because
  `configureAccessory` already writes a per-accessory line; the credential branch runs once per push
  over every accessory, and the runtime has already written `AUTHENTICATION_STOPPED`. A second line
  per accessory per push would be noise on a condition that never changes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The Phase 3 errored-characteristic gate failed on `serviceCatalogue.ts`**

- **Found during:** Task 2 GREEN, first `npm run check`.
- **Issue:** `test/accessories/basementGuardian.test.ts` asserts that no module in `ACCESSORY_MODULES` contains the string `HapStatusError`. That is the locked Phase 3 decision `D-10` amends, expressed as a gate, and the plan did not name it.
- **Fix:** the gate was narrowed rather than removed. `MODULES_ERRORING_NO_CHARACTERISTIC` holds the three modules that must name it zero times, and a new dedicated case asserts `serviceCatalogue.ts` names it exactly once and that the one occurrence sits inside `publishPersistentFailure`'s body.
- **Files modified:** `test/accessories/basementGuardian.test.ts`
- **Verification:** the new case fails if a second construction is added anywhere in the catalogue, and the three zero-count cases are unchanged in strength.
- **Committed in:** `068e0d8`

**2. [Rule 1 - Bug] The credential scenario never reached a refusal**

- **Found during:** Task 2 GREEN, first full Cucumber run.
- **Issue:** the scenario as the plan specified it starts the plugin, sets the tenant to refuse, and restarts. A restart reuses the cached token, so no grant is requested and no refusal happens. The scenario failed on `Then the log names how to correct the account`.
- **Fix:** `Given the storage holds a token for another account` was added before the restart, which is the mechanism `features/authentication.feature`'s own refusal scenario uses, together with a paragraph in the scenario saying why the step is there.
- **Files modified:** `features/degradedOperation.feature`
- **Verification:** with the step, the log assertion and both read assertions pass; mutation 1 fails the scenario, so it is asserting the push rather than the restart.
- **Committed in:** `068e0d8`

**3. [Rule 2 - Missing correctness] A positive read step beside the negative one**

- **Found during:** Task 2, writing the second scenario.
- **Issue:** the plan's interface list named only `answers no read for`, while its behaviour line for the transport-outage scenario says the service "still answers a read for `Leak Detected`". Asserting that with `reports {string} as {string}` would have read the stored value and proven nothing about readability.
- **Fix:** `Then the {string} service answers a read for {string}` was added, sharing `readThrows` with the negative step.
- **Files modified:** `features/support/steps/homekit.ts`, `features/degradedOperation.feature`
- **Verification:** mutation 2 fails the scenario on that step, so it is load-bearing rather than decoration.
- **Committed in:** `ca9993b` (the step), `068e0d8` (the scenario line)

**4. [Rule 3 - Blocking] Nine `MonitoringTrust` literals across four test modules**

- **Found during:** Task 2 RED.
- **Issue:** widening the interface broke every literal and every whole-object comparison against a pushed trust.
- **Fix:** each fixture and expectation gained `credentialsRejected`, `false` everywhere except the terminal-branch expectation, which is the one push in the codebase that carries `true`.
- **Files modified:** `test/accessories/basementGuardian.test.ts`, `test/platform.test.ts`, `test/runtime/accountRuntime.test.ts`
- **Verification:** the runtime expectations are exact whole-object comparisons, so a wrong assembled value fails them.
- **Committed in:** `ca9993b`

---

**Total deviations:** 4 auto-fixed (2 × Rule 3, 1 × Rule 1, 1 × Rule 2)
**Impact on plan:** none on scope. Deviation 1 is the gate form of the very decision this plan amends, and deviation 2 is a defect in the plan's own scenario found by watching it fail.

## Issues Encountered

- **Seven of the new cases passed at RED.** In task 1, `returns an unreadable characteristic to readable on the next ordinary push` passed, because the unfixed stand-in stored the following ordinary value over the error and answered it — the assertion is satisfied by the broken implementation for an unrelated reason. In task 2, `leaves every other characteristic on the service readable and holding its value`, `returns the characteristic to readable on the next ordinary push`, `retains every other reading on a service it marks`, `marks nothing on an accessory the cache restored with no services at all` and all four `leaves every restored accessory readable for ...` rows passed, because each asserts that something does *not* happen and the stubs did nothing. All seven are pinned by mutations 1 and 2 rather than by having been watched to fail first. Nine cases and one scenario did fail at RED.
- **The RED commits carry more wiring than a pure RED would.** Adding a required interface member is a compile error at every literal, and `noUnusedParameters` rejects an empty stub, so `ca9993b` includes the interface, the two production signatures with `void`-discarded parameters, and `credentialsRejected: false` hardcoded in the runtime. The behaviour — the error push, the walk, the platform branch, the real assembly and the widened comparison — all landed in `068e0d8`.
- **`test/accessories/staleMarking.test.ts` was restructured.** The module now has two exported entrypoints, so the unit-testing rules require one top-level `describe` per entrypoint. The seven existing cases were re-indented into `describe('markRestoredServicesStale')` with no change to any assertion. This is why the `actuals` figure above is inflated.
- **Node 24.x was not available on this machine.** The gate ran green on Node 22.22.2 (`/usr/bin/node`, a CI target) and on the local Node 26.7.0. Node 24.x is covered by CI only, unchanged from waves 1, 2 and 3.
- **The read-path gate floors were not raised.** This plan created no file and no module under `src/`, so `SOURCE_MODULE_FLOOR`, `ACCESSORIES_MODULE_FLOOR` and `SOURCE_FILE_FLOOR` are all still correct and all three gates pass unmodified.
- **`npm run fallow` reports one pre-existing clone group** in `features/support/steps/hap.ts:113-124` / `:168-181`. It predates this phase and was left alone.

## Known Stubs

None. `publishPersistentFailure` and `markServicesUnreadable` each carried a deliberate no-op for
exactly one commit (`ca9993b`, the RED half of the TDD pair) and were implemented in the next one.
No hardcoded or placeholder value reaches a characteristic.

## Threat Flags

None. This plan adds no network endpoint, no auth path, no file access pattern, and no schema at a
trust boundary. The four mitigations it owns hold:

- **T-05-14** (a self-inflicted denial of service against the user's own vendor account) — structural, and now asserted: `D-13 pushes a rejected credential and an unready command transport, and never reaches the vendor again` compares the whole recorded call list, so any request after the halt fails it.
- **T-05-15** (a fixture modelling the opposite of production) — the stand-in's error path is corrected and held against the pinned real HAP by four cases, all watched to fail against the previous behaviour.
- **T-05-16** (a denial of service against the user's own monitoring) — the unreadable presentation is reachable from the one terminal cause only, asserted against four separate self-clearing degradation shapes and pinned by mutation 2. The residual, what Apple Home draws and what happens to automations, is unverifiable locally and is raised as a real-home item that can reopen `D-10`.
- **T-05-17** (an error pushed onto an arbitrary row) — `publishValue`'s parameter type is unchanged and pinned by a compile-time negative, and the static gate now counts and locates the one permitted construction.

`T-05-18` and `T-05-SC` were accepted as planned and are unchanged: this plan adds no log content on
the halt path and installs no package.

## Verification

Run on Node 22.22.2 and Node 26.7.0. Node 24.x unavailable locally.

| Gate | Result |
|---|---|
| `node --test` — `hapWriteFidelity` | 18/18 (was 14) |
| `npm run test:coverage:direct` — `staleMarking` pair | 12/12, 100 lines / 100 branches / 100 functions |
| `npm run test:coverage:direct` — `serviceCatalogue` pair | 170/170, 100 / 100 / 100 |
| `npm run test:cucumber -- --name "unreadable"` | 1 scenario, 14 steps, all passing |
| `npm run check` | green (typecheck, lint, fallow, format:check, unit + Cucumber) |
| `npm run test:coverage:all` | 1294 tests, 100 / 100 / 100 over `dist-test/src/**/*.js` |
| `npm run fallow` | exit 0 |
| Node 22.22.2 unit + coverage | 1294 tests, 100 / 100 / 100 |
| Node 22.22.2 Cucumber | 89 scenarios, 894 steps, all passing |

## TDD Gate Compliance

Two RED/GREEN pairs, in order:

- `5643aaf` `test(05-04)` → `70f310b` `fix(05-04)`. The GREEN half is a `fix` rather than a `feat`
  because it corrects a defect in an existing stand-in rather than adding behaviour. Four cases were
  watched to fail before it.
- `ca9993b` `test(05-04)` → `068e0d8` `feat(05-04)`. Nine unit cases and one scenario were watched to
  fail before it.

No refactor commit was needed. The cases that passed at RED are recorded under Issues Encountered
with the mutation that pins each.

## User Setup Required

None — no external service configuration.

## Human Verification Outstanding

One item, carrying all three of `PA-07`'s open assumptions into the phase's verification session
beside the open `G-003` / `G-004` real-home items:

Configure the plugin with credentials the vendor will refuse, restart Homebridge, then open an
accessory this plugin publishes and any automation or scene built on one of its sensors. Report:

1. Whether Apple Home greys the accessory out, and whether the cached values are still reachable under Details.
2. Whether an automation built on one of its sensors still runs, or is disabled.
3. Whether `-70402` is in fact the status Apple Home renders as No Response.

`D-10` records that a negative finding on any of the three reopens `D-10`, not `RES-04`. None is
answerable from this repository or from the pinned packages.

## Next Phase Readiness

Ready for plan 05-05. Four things a later plan must not undo:

- **`publishValue`'s parameter type stays as it is.** The compile-time negative in
  `test/accessories/serviceCatalogue.test.ts` and the counting gate in
  `test/accessories/basementGuardian.test.ts` are the two halves that keep the exception narrow.
  Widening the parameter would make both pass while reopening the locked decision for every row.
- **`markMonitoring`'s comparison covers every member of `MonitoringTrust` and its store stays outside
  the early return.** The type now has four members and the same failure shape is waiting for a fifth.
- **The stand-in's error branch is now load-bearing for every `D-10` assertion in the repository.**
  `test/accessories/hapWriteFidelity.test.ts` is what keeps it honest; weakening that file would make
  the whole presentation unverified again without failing anything.
- **The credential scenario's `Given the storage holds a token for another account` is not
  decoration.** Removing it makes the scenario pass on a run in which the vendor refused nothing.

`REQUIREMENTS.md` still shows `RES-04` `Pending`, which is correct: this plan delivers the credential-
rejection half, and plan 05-05 owes the documentation.

---

*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-01*

## Self-Check: PASSED

Every file listed under `key-files` exists on disk, as does this summary. All four task commits
(`5643aaf`, `70f310b`, `ca9993b`, `068e0d8`) are reachable from `HEAD`, and each was confirmed
non-empty with `git show --name-only --format=""` at the moment it was made.
