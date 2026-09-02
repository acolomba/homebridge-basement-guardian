---
phase: 05-degraded-operation-and-recovery
plan: 11
subsystem: api
tags: [homebridge, homekit, shadow, mqtt, rest-polling, telemetry-ownership, degraded-operation]

requires:
  - phase: 05-degraded-operation-and-recovery
    provides: "The accessory-layer publishing predicate that lets a family-valid value on a working transport reach the tile while Status Active alone carries the doubt (05-06)"
  - phase: 01-secure-cloud-foundation
    provides: "The shadow watermark in DeviceSnapshot, releaseShadowSource(), and the disconnection handover that already used it (D-15, SYNC-02, SYNC-03)"
provides:
  - "The silence-triggered telemetry handover: a shadow that has missed two heartbeats stops owning telemetry and the REST poll takes it back, at the head of applyDevices"
  - "The end-to-end case no test covered before: a device whose live path spoke and then went quiet reports a later flood to HomeKit with Status Active still false"
  - "Unit-level proof that the handover fires on the first poll that observes the silence, not the poll after it"
  - "The three ownership boundaries around the handover: inside the window, recovering from a REST blip, and after the live path speaks again"
  - "01-CONTEXT.md D-15 and REQUIREMENTS.md SYNC-03 amended in place, each naming 05-CONTEXT.md D-13 as the ruling"
affects: [phase verification, RES-03 sign-off, SC-2 sign-off, any later work on telemetry ownership]

actuals:
  tokens: 64000
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "A source-ownership handover fires from the projection predicate at the single funnel upstream of the write, never at the reporting site, because the reporting site runs one call too late"
    - "A Cucumber scenario that cannot detect a timing regression says so, and the timing property is asserted in the unit suite instead"

key-files:
  created: []
  modified:
    - src/runtime/accountRuntime.ts
    - src/device/state.ts
    - test/runtime/accountRuntime.test.ts
    - test/device/state.test.ts
    - features/degradedOperation.feature
    - .planning/phases/01-secure-cloud-foundation/01-CONTEXT.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "The release fires at the head of `applyDevices` (accountRuntime.ts:332), gated on `health.trustNow().shadowSilent`. The measured cost of the obvious site is one whole poll: moving it into `reportMonitoringHealth` fails the unit case while leaving the Cucumber scenario green."
  - "Ownership returns through the existing patch path. Nothing was added for recovery; the case proving it is a characterization test, and the mutation that removes `nextShadowVersion`'s restoration breaks 13 cases including the reconnect refresh."
  - "`releaseShadowSource()` idempotence is proven by assertion, not by an added early return."
  - "D-11 holds unchanged: no poll path touches `lastShadowMessageAt`. During silence the flood publishes AND every non-connectivity scope stays untrusted."
  - "MEASURED, and it contradicts the plan: the four affected scenarios use `Given these devices:` (harness.ts), which supplies the FULL valid Gemini telemetry with `water_level: 1`, not the empty `data: {}` the plan attributed to them. The handover reverts telemetry to a legal non-flood level, not to an absence."
  - "MEASURED: the plan's prescribed repair breaks the scenarios it repairs. `Then the canonical snapshot carries these fields:` is doubling as the barrier that waits for the heartbeat to land; giving the REST body the same value makes that step pass immediately, the clock advances before the heartbeat arrives, and the silence never accumulates. Four scenarios failed under the prescribed repair."
  - "The repair that works fixes the SECOND heartbeat, not the first: the republished value must be the one the poll wrote during the silence, which is what makes it identical from the store's point of view again."
  - "Only two of the four heartbeat-then-silence scenarios needed repair, not three. The two the plan named as first and second stay honest unedited; the fourth, which the plan did not name and which ledger entry 8 flagged, did need it."

patterns-established:
  - "Handover-at-the-funnel: read the predicate at the one place every write passes through, upstream of the write, rather than at the place that already reads the same predicate for reporting"
  - "Barrier assertions: a step asserting a value the other transport does not carry is load-bearing twice — it checks the value and it synchronizes the scenario on the message that delivered it"

requirements-completed: []

coverage:
  - id: D1
    description: "A device whose shadow delivered a versioned heartbeat and then went quiet reports a later flood to HomeKit: Leak Detected reads activated while Status Active stays false"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A pit that floods after the live path went quiet still reaches Apple Home"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 reports the flood a poll found on a device whose live path went quiet"
        status: pass
    human_judgment: false
  - id: D2
    description: "The flood reaches the store on the first poll that observes the silence, not the poll after it — one poll late is up to an hour late at the configured maximum"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 reports the flood a poll found on a device whose live path went quiet (asserted after exactly one qualifying poll tick)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A pump run the live path reported is not erased by a poll arriving while the shadow is still inside the two-heartbeat window"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 keeps a pump run the live path reported when a poll arrives inside the two-heartbeat window"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-02 keeps the telemetry and metadata a later poll would overwrite while the shadow owns them (unedited)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A poll that recovers from a REST-only degradation does not take telemetry from a shadow that is still speaking"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 keeps live telemetry through a poll that recovers from a REST degradation"
        status: pass
    human_judgment: false
  - id: D5
    description: "Once the live path speaks again it owns telemetry again, through the patch path that already exists — nothing was added for recovery"
    requirement: SYNC-03
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 lets the live path own telemetry again on the first message that carries an observation"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-03 hands telemetry back to the poll when the connection reports <4 reasons> (unedited)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Repeating the handover on every poll of a long silence moves no telemetry key, restamps no receipt time, and notifies no listener"
    requirement: SYNC-03
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#moves no value and notifies nobody when it runs again on a later poll of the same silence"
        status: pass
    human_judgment: false
  - id: D7
    description: "A REST poll still does not clear a shadow-silence degradation, so ownership moved without the trust flags moving"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A successful poll does not clear the shadow silence"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#A pit that floods after the live path went quiet still reaches Apple Home (Status Active false on both closing steps)"
        status: pass
    human_judgment: false
  - id: D8
    description: "01-CONTEXT.md D-15 and REQUIREMENTS.md SYNC-03 record in their own text that shadow ownership ends on silence as well as on disconnection, each dated and each naming 05-CONTEXT.md D-13"
    verification:
      - kind: other
        ref: "grep -c \"Amended 2026-09-02\" .planning/phases/01-secure-cloud-foundation/01-CONTEXT.md .planning/REQUIREMENTS.md -> 1, 1"
        status: pass
    human_judgment: false
  - id: D9
    description: "Apple Home draws a flooded leak sensor whose Status Active is false the way this project intends — the leak alert fires, and the untrustworthy marking does not suppress it"
    verification: []
    human_judgment: true
    rationale: "The Cucumber tier reads pushed characteristic values through a fake HAP API. Whether a paired iOS controller raises a leak notification for a Leak Sensor whose Status Active is false, and whether an automation on that sensor fires, has never been observed on a real home. This is the same open question 05-06 recorded for the never-connected case, now reachable on the ordinary device as well."

duration: 43min
completed: 2026-09-02
status: complete
---

# Phase 5 Plan 11: Silence-Triggered Telemetry Handover Summary

**A shadow that has missed two heartbeats now stops owning telemetry, so a healthy REST poll reporting a flooded pit reaches `Leak Detected = 1` in HomeKit on the poll that notices the silence — the gate that sat upstream of 05-06's fix and blocked `CR-01`'s outcome for every device whose live path had ever spoken.**

## Performance

- **Duration:** 43 min
- **Started:** 2026-09-02T15:12:00Z
- **Completed:** 2026-09-02T15:55:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- **Closed the second gate on `CR-01`.** Plan 05-06 fixed the accessory layer so a family-valid value on a working transport reaches the tile. `pollTelemetry` was still returning `previous.data` for the whole duration of any shadow silence, so nothing was delivered to that layer. Both halves are now in place, and the end-to-end scenario for a device that spoke and then stopped passes.
- **Placed the handover where it cannot be one poll late**, and proved the cost of the obvious alternative by measurement rather than by argument.
- **Proved that ownership returns with nothing added.** The recovery case passes against unmodified production code, and the mutation removing `nextShadowVersion`'s restoration breaks it along with 12 other cases.
- **Found and repaired a defect in the plan's own repair instructions.** The prescribed repair broke four scenarios; the reason is recorded below and the working repair is different in kind.
- **Closed ledger entries 5 and 8.**

## Task Commits

1. **Task 1 (tracer, TDD): A pit that floods after the live path went quiet reaches Apple Home** — `ade3e27` (test, RED) → `6230709` (feat, GREEN)
2. **Task 2 (TDD): The ownership boundaries** — `f8aea0c` (test + doc comments)
3. **Task 3: Amend D-15 and SYNC-03 in place** — `ec606ac` (docs)

## The release site, as it turned out in the code

`src/runtime/accountRuntime.ts:332-334`, the first statement of `applyDevices`, which plans 05-07 and 05-08 had moved to line 317 by the time this plan ran:

```typescript
    if (health.trustNow().shadowSilent) {
      options.store.releaseShadowSource();
    }

    for (const device of devices) {
      options.store.applyDiscovery(device);
    }
```

The ordering argument held exactly as the plan stated it. `runPoll` still calls `await applyDevices(...)` before `recordPollSuccess()`, and `applyDiscovery` is still called from this one loop and nowhere else in the runtime, reached from both `runPoll` and `launch`. The reconciliation final check below the loop is untouched. `monitoringPathNow`, `commandTransportReadyNow`, `monitoringTrustNow`, `reportMonitoringHealth`, `recordPollSuccess`, `recordPollFailure`, `onReportedPatch` and `monitoringHealth.ts` are all unedited.

`handleShadowDisconnected` keeps its own `releaseShadowSource()` call at line 547. The new site is an addition.

## Mutations applied, watched, and reverted

Every mutation `05-VALIDATION.md` names for a behaviour in this plan, with the assertion it broke.

| # | Mutation | Result |
|---|---|---|
| 1 | Delete the `releaseShadowSource()` call from the head of `applyDevices` | **Both fail.** Unit: `D-13 reports the flood a poll found on a device whose live path went quiet`. Scenario: `A pit that floods after the live path went quiet still reaches Apple Home`, on `Then the canonical snapshot carries these fields: \| water_level \| 31 \|`, `the canonical snapshot never carried the fields the scenario expects within 5000 ms`. Reverted, green. |
| 2 | Move the release out of `applyDevices` into `reportMonitoringHealth` | **The pair, both halves observed.** Unit `D-13 reports the flood a poll found on a device whose live path went quiet` **fails** — the store still holds the heartbeat's `water_level: 3` after the qualifying poll. `npm run test:cucumber -- --name "went quiet"` reports **`1 scenario (1 passed)`, 15 steps passed**, because a 50 ms poll interval hides a one-poll delay inside a 5000 ms step deadline. This is why the timing property lives in the unit suite. Reverted, green. |
| 3 | Drop the predicate and release on every poll | **Fails** the existing `SYNC-02 keeps the telemetry and metadata a later poll would overwrite while the shadow owns them`. Reverted, green. |
| 4 | Read `restDegraded \|\| shadowSilent` at the release site | **Fails** `D-13 keeps live telemetry through a poll that recovers from a REST degradation` — the shadow is alive there and still owns telemetry. Reverted, green. |
| 5 | Lower `MISSED_HEARTBEATS_BEFORE_SILENT` to 1 | **Fails** `D-13 keeps a pump run the live path reported when a poll arrives inside the two-heartbeat window`, together with `SYNC-02 keeps the telemetry...`, `D-13 lets the live path own telemetry again...` and four `monitoringHealth`-facing cases. Reverted; `grep` confirmed the constant back at `2` before the next command ran. |
| 6 | Make `nextShadowVersion` return `undefined` whenever `previous.shadowVersion` is undefined | **Fails** `D-13 lets the live path own telemetry again on the first message that carries an observation`, and **12 others fall with it** (recorded below). Reverted, green. |
| 7 | Make `releaseShadowSource` also clear `receivedAt` | **Fails on the receipt time**: `moves no value and notifies nobody when it runs again on a later poll of the same silence`, and the existing `clears the watermark on every stored device and leaves the rest of each snapshot alone`. Reverted, green. |
| 8 | The repaired scenarios assert their own premise | **Recorded as a pair against a real defect** — see the section below. |

### Mutation 6: what else falls with the restoration

The guard `nextShadowVersion` skips is what the reconnect refresh depends on, so the blast radius is worth recording. Thirteen cases fail:

- `test/device/state.test.ts`: `keeps shadow metadata and the applied version when a later poll refreshes telemetry`; `refreshes reachability and leaves telemetry alone while the shadow owns it`; `leaves water level at 1 and the applied version at 5 for a patch at version 4`; `... at version 5`; `leaves water level at 31 and the applied version at 6 for a patch at version 6`; `applies an unversioned patch and leaves the applied version where the last versioned patch set it`; `applies the first versioned patch to a device the shadow has not yet versioned`; `leaves the receipt time alone and advances the watermark it already held for a patch that reports neither section`; `notifies no listener for a patch the version watermark discards`.
- `test/runtime/accountRuntime.test.ts`: `SYNC-02 keeps the telemetry and metadata a later poll would overwrite while the shadow owns them`; `D-13 keeps a pump run the live path reported when a poll arrives inside the two-heartbeat window`; `D-13 keeps live telemetry through a poll that recovers from a REST degradation`; `D-13 lets the live path own telemetry again on the first message that carries an observation`.

## Mutation 8, in full: the repaired scenarios against a real defect

The validation row asks for proof that the repair is load-bearing. A bare reversion proves nothing, because an unrepaired scenario still passes against a correct implementation. The proof is a pair, run against the defect the identical-heartbeat scenario exists to catch — a recovery report driven by a telemetry change rather than by the arrival itself. Stand-in mutation in `onReportedPatch`: report only when the patch moved a value.

| Scenario state | Result under the defect |
|---|---|
| **Repaired** `A returning heartbeat clears the shadow silence before the next poll` | **Fails** on `Then the "Sump Pit Flood" service reports "Status Active" as "true"` — `never reported Status Active as true within 2000 ms` |
| **Unrepaired** (second heartbeat republishing the pre-silence `water_level 3`) | **Passes.** `1 scenario (1 passed)`, 17 steps passed |

That is the whole hazard, measured: without the repair the scenario passes against the defect it was written to catch. Both the mutation and the reversion were undone; the suite is green.

`An identical heartbeat clears the shadow silence` passed under the same defect in both states, because its polls keep running and `recordShadowMessage()` still fires, so the next poll tick reports the cleared silence within the step deadline. That is precisely the cover the parked-poll scenario was added to remove, and it means the parked-poll scenario is the one carrying this property. Recorded rather than papered over.

## The scenario sweep, scenario by scenario

Every scenario in the repository that crosses 1796 seconds, with whether the handover reaches it.

| Scenario | File:line (before edits) | Publishes a heartbeat first? | Affected? |
|---|---|---|---|
| `Shadow silence withdraws trust while polling continues` | degradedOperation:50 | Yes, `water_level 3` | **Yes, but not repaired.** Its assertions stay honest: the poll writes `water_level 1` from the full valid body, a legal non-flood rung, so `the "Sump Pit Flood" sensor is not activated` holds because 1 is not a flood, not because a value went absent. The heartbeat step is no longer what that assertion rests on. Recorded as ledger entry 9 rather than repaired, because repairing it costs the heartbeat barrier (below) and its subject is the trust withdrawal, not the value. |
| `A flooded pit reaches Apple Home while the live path is silent` | degradedOperation:72 | No | No. No watermark is ever held, so `pollTelemetry` was already the source. This is why 05-06 could only build the flood case on a device whose live path never delivered. |
| `Both monitoring paths lost withdraws every scope` | degradedOperation:112 | No | No. No watermark, and the REST service is failing every request, so no poll writes anything either. |
| `A blind plugin vouches for no controller-link verdict` | degradedOperation:135 | No. `When the vendor changes these device fields:` is a REST change, not a heartbeat | No. |
| `A successful poll does not clear the shadow silence` | degradedOperation:152 | Yes, `water_level 3` | **Yes, but not repaired.** Every assertion in it is about `Status Active` and the poll count; no assertion reads a telemetry value. Its prose claim — the poll keeps working while live signals go unobserved — is unaffected by which source owns telemetry. |
| `An identical heartbeat clears the shadow silence` | degradedOperation:172 | Yes, `water_level 3` | **Yes, repaired.** Premise directly broken: after the handover the store holds 1, so republishing 3 is a change and a snapshot listener would fire. |
| `A returning heartbeat clears the shadow silence before the next poll` | degradedOperation:202 | Yes, `water_level 3` | **Yes, repaired.** Same premise break, and it is the scenario that actually carries the property (see mutation 8). This is **ledger entry 8**, now closed. The plan did not name it; the ledger did. |
| `A transport outage leaves every service readable` | degradedOperation:325 | No | No. |
| `A press with no valid state is refused locally` | officialControls:180 | No | No. |

**Result: four affected, not three. Two repaired, two left honest.** The plan named three; one of its three (`A successful poll does not clear the shadow silence`) needed nothing, and one it did not name (`A returning heartbeat...`) did.

## The repairs, quoted

Both repairs change the **second** heartbeat, not the first, for the reason in "Issues encountered" below.

**`An identical heartbeat clears the shadow silence`** — one assertion added as a barrier, one table value changed:

```gherkin
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the canonical snapshot carries these fields:
      | water_level | 1 |
    When the device publishes these heartbeat fields:
      | water_level | 1 |
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
```

The premise it keeps: **its heartbeat is once again identical from the store's point of view.** The store holds the level the poll wrote during the silence, and the republished heartbeat carries that same level, so no telemetry value moves, the store notifies nobody, and only `onReportedPatch` can clear the silence. Two paragraphs of prose were added saying so. The new `carries these fields: water_level 1` step is load-bearing twice: it asserts the handover happened, and it makes the scenario wait for it.

**`A returning heartbeat clears the shadow silence before the next poll`** — same shape, plus the published value it asserts across the parked window:

```gherkin
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the canonical snapshot carries these fields:
      | water_level | 1 |
    Given the vendor never answers the device list
    Then the plugin stops asking for the device list
    When the device publishes these heartbeat fields:
      | water_level | 1 |
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Then the "Sump Pit Level" service reports "Water Level" as "20"
    Then the plugin records no poll outcome
```

`Water Level` moved from `40` to `20` because the value the poll wrote is `water_level 1`, which the ladder maps to 20%. The assertion still says what it said: the tile keeps the value it had across the parked window, with no poll answering. **This is ledger entry 8, re-checked against the change rather than assumed, and closed.**

## Comments corrected, before and after

**1. `src/runtime/accountRuntime.ts`, `handleShadowDisconnected`.** The claim that had become incomplete: that a connection ending is *the* moment the shadow stops being the source.

Before:

```text
// The shadow stops being the source of telemetry the moment the connection
// ends, whatever ended it, so the poll takes it back over until the
// reconnect's complete-shadow request re-establishes ownership (D-15,
// SYNC-03).
```

After:

```text
// A connection ending is one of the two ways the shadow stops being the
// source of telemetry, and this handler owns that one: whatever ended it,
// the poll takes over until the reconnect's complete-shadow request
// re-establishes ownership. Two missed heartbeats are the other way, and
// `applyDevices` owns it, because a socket that is still open says nothing
// about a device that has stopped speaking (D-15, D-13, SYNC-03).
```

**2. `src/device/state.ts`, `pollTelemetry`.** The claim that had become incomplete: that "with no watermark held" is the reconciliation backstop *a shadow outage* runs on — which reads as if an outage is the only way the watermark comes off. The paragraph below was appended; nothing was deleted.

```text
// The watermark comes off in two ways, and a reader who knows only the first
// will misread this function. The connection ending is one: the shadow is gone,
// so the poll takes over. A device whose messages have stopped for long enough
// that the monitoring-trust projection calls it silent, with its socket still
// open, is the other, and it is the ordinary one: the provider closes an
// established connection daily by design, while a device that has stopped
// speaking says nothing about its socket at all (D-13).
```

**3. `src/device/state.ts`, the `releaseShadowSource` doc comment.** The claim that had become incomplete: that a *reconnect* is the thing that re-establishes ownership, and that a reconnect is what the out-of-order cost is paid for. Two paragraphs added, and the out-of-order paragraph's opening amended from "after a reconnect" to "after a release, which silence triggers on the same terms as a reconnect rather than on new ones". The existing paragraph explaining why a silently discarded refresh would be worse is untouched.

```text
   * Two conditions call for it. A connection that ended is one. A device the
   * monitoring-trust projection reports silent, with its socket still open, is
   * the other, and it is the one an owner meets: silence is not a
   * disconnection, and a poll that cannot refresh telemetry during it leaves a
   * flooding pit unreported (D-13). It is therefore reachable on every poll of
   * a silence that can last hours, which it is written to cost nothing.
   *
   * Ownership returns on the next document carrying an observation, through
   * `applyReportedPatch`: with no watermark held the patch is not stale, and
   * `nextShadowVersion` establishes the watermark again. Nothing else restores
   * it, and a document that observed nothing does not, so REST keeps feeding
   * telemetry until a real report arrives.
```

Neither comment restates the threshold as a number. The first draft of both said "missed two heartbeats"; that restates `MISSED_HEARTBEATS_BEFORE_SILENT` in prose, so both were changed to name the projection instead.

## The D-13 naming collision, checked rather than assumed

`.planning/phases/01-secure-cloud-foundation/01-CONTEXT.md:43` — Phase 1's own D-13, read in full before a word of the amendment was written:

> **D-13:** An Auth0 credential rejection (`invalid_grant`) stops authentication. Log one actionable error naming the fix, delete the cached token, and make no further attempt until Homebridge restarts or the configuration changes. Rationale, verified during discussion: Auth0 brute-force blocks persist for 30 days from the *last* failed attempt, so a retrying plugin permanently prevents the block from clearing. Saving config in the Homebridge UI restarts the bridge, so the user's natural fix already re-triggers a start.

It is two bullets above D-15 in the same file. A bare `D-13` written into that file names it. Both amendment notes therefore spell the ruling `05-CONTEXT.md` D-13, and the D-15 note says outright that it is not this file's D-13.

## The two amendments, beside the originals

### `01-CONTEXT.md` D-15

Original line, unchanged and undeleted:

> **D-15:** If REST discovery succeeds but the shadow connection does not, the runtime stays up and runs degraded on REST only. REST polling is the state source, the shadow is retried on capped backoff in the background, and the degraded monitoring path is logged once. `SYNC-03` already treats REST as the reconciliation backstop. — **Reversibility:** costly — the set of runtime states Phase 5 consumes for `RES-03`/`RES-04` is shaped here.

Note added below it:

> **Amended 2026-09-02.** The shadow now stops owning telemetry on silence as well as on a lost connection. This decision describes a shadow connection that never came up. It does not describe a shadow that is connected and has stopped speaking. The implementation applied "the shadow owns telemetry" to that state anyway. No REST poll refreshed telemetry while the silence lasted, so a flooding pit could not reach HomeKit. Two missed heartbeats now hand telemetry back to the poll, in the same way a lost connection already does. The trigger is the silence measure, not socket state, because the provider closes an established connection once a day by design. The shadow owns telemetry again on its next message that carries an observation, through the path a reconnect already uses. The trust flags did not change. A REST poll still does not clear a shadow-silence degradation, so the poll's reading reaches the tile while every non-connectivity scope stays untrusted. The ruling is `05-CONTEXT.md` D-13. It is not this file's D-13, which is the Auth0 credential rejection two decisions above.

The reversibility note stands as it was.

### `REQUIREMENTS.md` SYNC-03

Original row, unchanged and undeleted, checkbox state untouched:

> - [ ] **SYNC-03**: The runtime requests a complete shadow after startup and reconnect and polls successful REST snapshots as a reconciliation backstop without treating MQTT subscription persistence as event replay.

Note added below it:

> **Amended 2026-09-02.** The reconciliation backstop also carries telemetry while the live path is silent, not only while it is disconnected. A shadow that has missed two heartbeats no longer owns telemetry, so the poll takes it back and its readings reach HomeKit. The shadow owns telemetry again on its next message that carries an observation. The trust flags did not change: a REST poll still does not clear a shadow-silence degradation, so the readings arrive marked untrustworthy. Ruling: `05-CONTEXT.md` D-13.

**`git diff` before committing, file-level line counts:** `.planning/REQUIREMENTS.md | 2 ++` and `.planning/phases/01-secure-cloud-foundation/01-CONTEXT.md | 2 ++` — four insertions, zero deletions, across both files. No other requirement row is modified and no checkbox state changes; `git diff .planning/REQUIREMENTS.md | grep -E "^[-+]- \["` returns nothing. `RES-04` was not touched; 05-10 owns that close-out.

## Counts, before and after

| | `05-09-SUMMARY.md` recorded | After this plan |
|---|---|---|
| Unit tests | 1340 | **1345** (+5: one in task 1, three runtime and one store case in task 2) |
| Cucumber scenarios | 94 | **95** (exactly one greater) |
| Cucumber steps | 969 | **986** |

## Verification

- `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` — 100.00 / 100.00 / 100.00.
- `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` — 100.00 / 100.00 / 100.00.
- `npm run test:coverage:all` — exit 0, `all files 100.00 | 100.00 | 100.00`, 1345 tests.
- `npm run check` — exit 0 (typecheck, lint, fallow, format:check, 1345 unit tests, 95 scenarios).
- `npm run fallow` — the one pre-existing clone group on `features/support/steps/hap.ts:113-124` / `:168-181`, unchanged and not a regression. Maintainability 92.6.
- **Both installed Node versions.** Default `node` **v26.7.0**: `npm run test:coverage:all` exit 0 at 100/100/100, 95 scenarios passing. `/usr/bin/node` **v22.22.2**: the same coverage invocation exit 0 at 100/100/100 with 1345 tests, and `npx cucumber-js` 95 scenarios / 986 steps passing. Node 24.x is not installed locally. `npm run test:coverage:all` is not in CI, so it was run here deliberately.
- `grep -c "Amended 2026-09-02" .planning/phases/01-secure-cloud-foundation/01-CONTEXT.md .planning/REQUIREMENTS.md` — `1` and `1`.

**The existing `SYNC-02` case and the four `SYNC-03 hands telemetry back to the poll when the connection reports <reason>` cases pass unedited.** No existing assertion needed a change to stay green.

## Decisions Made

Recorded in the frontmatter. The four the plan settled were checked and held; the plan's account of the Cucumber fixture did not, and that is documented below.

## Deviations from Plan

### 1. [Rule 1 - Bug] The plan's prescribed scenario repair breaks the scenarios it repairs

- **Found during:** Task 1
- **Issue:** Two compounding errors in the plan's repair instruction.
  1. **Wrong fixture.** The plan states that `toDevice` gives every device `data: {}`. That is true of `features/support/steps/shadow.ts`'s `toDevice`, used by the Background's `Given these gemini devices:`. Every one of the four affected scenarios overrides it with `Given these devices:` from `features/support/steps/harness.ts:153`, whose `toDevice` supplies `VALID_GEMINI_TELEMETRY` — sixteen fields including `water_level: 1`. The handover therefore reverts telemetry to a legal non-flood rung of the ladder, not to an absence. Two of the plan's three predicted failure modes rest on the absence and do not occur.
  2. **The repair destroys a barrier.** `Then the canonical snapshot carries these fields:` is doing two jobs in these scenarios: it asserts a value, and it makes the scenario wait for the heartbeat to land. Giving the REST body the heartbeat's value — by either mechanism, the plan's `Given these reported device fields:` or the narrower `waterLevel` column — makes that step pass on the REST poll alone. The scenario then advances the clock **before** the heartbeat arrives, the arriving heartbeat stamps `lastShadowMessageAt` to the post-advance time, and the silence never accumulates.
- **Measured:** with the `waterLevel` column applied to all four scenarios and no production change, `npx cucumber-js` reported **5 failed** — the four repaired scenarios all failing at `Then the "Sump Pit Flood" service reports "Status Active" as "false"` with `never reported Status Active as false within 2000 ms`, plus the intended RED failure.
- **Fix:** The repair moves to the **second** heartbeat. The first heartbeat keeps a value the REST body does not carry, so the barrier stands; the second heartbeat carries the value the poll wrote during the silence, which is what makes it identical from the store's point of view. A `Then the canonical snapshot carries these fields: | water_level | 1 |` step sits between them, asserting the handover and providing the barrier for what follows.
- **Also:** the plan's `Given these reported device fields:` mechanism is unusable here for a second reason — it replaces the whole `data` record with only the listed fields, which would invalidate the pump, power, battery and fault scopes these scenarios assert on.
- **Files modified:** `features/degradedOperation.feature`
- **Verification:** 95 scenarios passing; mutation 8's pair proves the repair is load-bearing.
- **Committed in:** `ade3e27`

### 2. [Rule 3 - Blocking] Only two of the four affected scenarios needed repair

- **Found during:** Task 1 sweep
- **Issue:** The plan named three scenarios and asked for a sweep for a fourth. The sweep found four affected, and the membership differs from the plan's list in both directions: `A successful poll does not clear the shadow silence` needs nothing (no assertion in it reads a telemetry value), and `A returning heartbeat clears the shadow silence before the next poll` — which the plan did not name, and which ledger entry 8 flagged — does.
- **Fix:** Repaired the two that need it. `Shadow silence withdraws trust while polling continues` was left unrepaired with its weakening recorded as a new ledger entry, because repairing it costs the barrier and its subject is the trust withdrawal rather than the value.
- **Files modified:** `features/degradedOperation.feature`, `.planning/WINDOWS.md`
- **Verification:** the sweep table above, scenario by scenario.
- **Committed in:** `ade3e27`

### 3. [Rule 3 - Blocking] Task 2 has no reachable RED phase

- **Found during:** Task 2
- **Issue:** Task 2 carries `tdd="true"` but its own action says to change no production behaviour beyond comments, and its recovery case is explicitly a proof that existing code already works. All four cases pass against unmodified production code, so a failing-first commit is not reachable without writing a defect on purpose.
- **Fix:** Committed the four cases as one `test(...)` commit and drove the discrimination proof through the four mutations task 2 names instead. Each mutation was applied, watched to fail its named assertion, and reverted.
- **Files modified:** none beyond the task's own
- **Verification:** mutations 4-7 in the table above.
- **Committed in:** `f8aea0c`

---

**Total deviations:** 3 (1 × Rule 1, 2 × Rule 3). **Impact:** no scope creep. Deviation 1 corrects a factual error in the plan that would have shipped four broken scenarios; deviations 2 and 3 are the plan's own instructions meeting facts the plan did not have.

## Issues Encountered

**Two mutation reverts destroyed uncommitted work.** `git checkout -- <file>` after a mutation reverts to `HEAD`, which for an uncommitted implementation means reverting the implementation as well. It happened twice — once with `accountRuntime.ts` before the `feat` commit and once with `state.ts`'s doc comments before their commit — and both were re-applied and re-verified. The working rule for the rest of the plan: commit the implementation before mutating it, so the revert target is the intended one.

## Known Stubs

None.

## Broken-windows ledger

- **Entry 5** (`src/device/state.ts:173` — a shadow that goes silent never hands telemetry back) — **fixed.** This plan is its fix.
- **Entry 8** (`features/degradedOperation.feature` — `A returning heartbeat...` asserts Water Level 40 on a premise this change moves) — **fixed.** Re-checked against the change rather than assumed: it was affected, it was repaired, and the assertion now reads `20`, the value the poll wrote.
- **Entry 9** added (deviation): `Shadow silence withdraws trust while polling continues` now rests its `sensor is not activated` assertion on the polled `water_level 1` rather than the retained heartbeat `3`.
- **Entry 10** added (deviation): the plan's prescribed scenario repair does not work, with the two reasons, so a later reader does not re-derive it.

## Threat Flags

None. This plan adds no network endpoint, no auth path, no file access and no schema change at a trust boundary. `package.json` and `package-lock.json` are unchanged; no package was installed.

## Next Plan Readiness

`RES-03`'s telemetry clause is now delivered end to end, and `SC-2` has an executable case on the ordinary device shape. Deliberately **not** marked complete here: `RES-03`, `RES-04` and `SYNC-03` rows all stay as they are — 05-10 owns the requirement close-out, on clause-by-clause evidence.

One thing a later reader should know: `An identical heartbeat clears the shadow silence` does not, on its own, discriminate the snapshot-listener defect, because its polls keep running and a poll tick reports the cleared silence inside the step deadline. `A returning heartbeat clears the shadow silence before the next poll` is the scenario carrying that property. Do not delete it as a duplicate.

---
*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-02*

## Self-Check: PASSED

Every file this summary names exists on disk, and every commit hash it names is reachable in `git log`.
Checked 2026-09-02: 8 files, 5 commits (`ade3e27`, `6230709`, `f8aea0c`, `ec606ac`, `2d09b10`).
