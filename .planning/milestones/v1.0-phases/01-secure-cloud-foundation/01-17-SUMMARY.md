---
phase: 01-secure-cloud-foundation
plan: 17
subsystem: runtime
tags: [monitoring-path, shutdown, mqtt, lifecycle, dead-code]

requires:
  - phase: 01-secure-cloud-foundation
    provides: "One disconnection per connection, and no disconnection during shutdown (plan 01-14)"
  - phase: 01-secure-cloud-foundation
    provides: "Source ownership released on every disconnection (plan 01-13)"
  - phase: 01-secure-cloud-foundation
    provides: "A deterministic Cucumber gate (plan 01-12)"
provides:
  - "One MonitoringPath type, declared once and imported by the runtime that produces it"
  - "A runtime state meaning monitoring has stopped, reached by a refused credential and by a failed poll with no shadow"
  - "A terminal authentication stop recorded in the failure log"
  - "A shutdown that closes a connection opened while it was landing"
  - "An mqtt client that never connected dropped rather than ended politely, so its socket cannot survive shutdown"
  - "A broker live-connection count two scenarios assert on after a shutdown"
affects: [phase-3-homekit-derivations, phase-5-resilience-presentation]

actuals:
  tokens: 9255
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "A published state derived from the facts that produce it, rather than assigned at each site"
    - "A shutdown flag read through a function, so a check after an await asks again"
    - "A graceful transport teardown chosen only where it can complete"

key-files:
  created: []
  modified:
    - src/runtime/accountRuntime.ts
    - src/device/health.ts
    - src/cloud/shadow.ts
    - src/cloud/mqttTransport.ts
    - test/runtime/accountRuntime.test.ts
    - test/cloud/shadow.test.ts
    - test/cloud/mqttTransport.test.ts
    - features/degradedOperation.feature
    - features/lifecycle.feature
    - features/support/fakeShadowBroker.ts
    - features/support/steps/shadow.ts

key-decisions:
  - "The monitoring path is derived from three facts rather than assigned, so the dead state is reachable from every path that should reach it and no path that should not"
  - "Polling is the floor: a poll that is not succeeding reports unavailable even while the shadow is live, because naming the combined path there would be the false normal the project refuses"
  - "A shutdown leaves the path where it stood; an aborted signal is not a monitoring failure"
  - "Nothing releases the store's shadow source at stop(), and nothing needs to; the reasoning is written into stop() rather than inherited"
  - "An mqtt client that never connected is dropped rather than ended gracefully, because the library queues the disconnect packet and never closes the socket while still reporting the end as finished"

patterns-established:
  - "One declaration, imported by its producer: a type collision becomes a compile error rather than a translation layer"
  - "Assert the resource, not the silence: a shutdown scenario asks the broker for its live connections instead of reading the absence of a rejection"

requirements-completed: [AUTH-01, SYNC-03, SYNC-04, SYNC-05]

coverage:
  - id: D1
    description: "One MonitoringPath type exists, exported once and imported by its producer, so the declared consumer's field can be fed by the runtime that produces it"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/device/health.test.ts (satisfies checks over the single declaration)"
        status: pass
      - kind: other
        ref: "grep -rn 'export type MonitoringPath' src -- one declaration, in src/device/health.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "A refused credential, a halted authentication, and a failed poll with no shadow all reach a state meaning nothing is working"
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 reports monitoring unavailable and records the stop when the vendor refuses the account credentials"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 reports monitoring unavailable and records the stop when authentication has halted"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#reports monitoring unavailable while the poll is failing and the shadow is down, and the polling-only path once a poll succeeds"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#reports monitoring unavailable before anything has succeeded"
        status: pass
    human_judgment: false
  - id: D3
    description: "A terminal authentication stop is recorded in the failure log, so the recovery discipline learns the runtime halted"
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 reports monitoring unavailable and records the stop when the vendor refuses the account credentials"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-22 recovers the combined path after a throttled answer rather than claiming the runtime stopped for good"
        status: pass
    human_judgment: false
  - id: D4
    description: "A shutdown that lands between opening a connection and recording it still closes that connection"
    requirement: SYNC-05
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-05 closes a shadow connection whose start resolved only after the shutdown began"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-05 raises nothing when the connection opened during a shutdown cannot be closed"
        status: pass
    human_judgment: false
  - id: D5
    description: "After a shutdown the broker holds no live connection, asked of the broker rather than inferred from the absence of a rejection"
    requirement: SYNC-05
    verification:
      - kind: integration
        ref: "features/lifecycle.feature#Shutdown with an open shadow connection releases it"
        status: pass
      - kind: integration
        ref: "features/lifecycle.feature#Shutdown while a reconnect is pending leaves no live connection"
        status: pass
      - kind: unit
        ref: "test/cloud/mqttTransport.test.ts#SYNC-05 drops a client that never connected, because a graceful end would never close its socket"
        status: pass
    human_judgment: false
  - id: D6
    description: "The shadow client publishes no surface without a production caller"
    requirement: SYNC-03
    verification:
      - kind: unit
        ref: "npm run fallow (dead-code, health, dupes) exits 0 with the ignore list unchanged"
        status: pass
      - kind: integration
        ref: "features/shadowLifecycle.feature (the per-connection complete-shadow request still covers SYNC-03)"
        status: pass
    human_judgment: false

duration: 44min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 17: Monitoring-path truth and shutdown release Summary

**The runtime can now say monitoring has stopped, through the one `MonitoringPath` declaration its
consumer already uses, and no shutdown leaves a socket the plugin opened.**

## Performance

- **Duration:** 44 min
- **Started:** 2026-08-29T08:56:00Z
- **Completed:** 2026-08-29T09:40:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- **Gap 4 (CR-04) closed.** A refused or halted credential now sets a terminal flag and reports
  `unavailable`, and records the stop under the authentication subject. Before this, the one failure
  the project treats as final left the path reading `poll-only`, which `src/device/health.ts`
  documents as a working degraded path, with nothing at all in the failure log.
- **WR-06 closed.** The runtime's own two-value `MonitoringPath` is gone. It imports the three-value
  declaration from `src/device/health.ts`, so producer and declared consumer are the same type and a
  future divergence is a compile error.
- **The path is derived, not assigned.** Three facts are held (whether polling succeeded, whether the
  shadow is connected, whether the runtime halted) and one small unit answers from them. The dead
  state is therefore reachable from every path that should reach it, instead of depending on which
  assignment ran last.
- **Gap 5, runtime half (CR-05 item 2) closed.** `attemptShadow` re-checks the shutdown flag after
  `client.start` resolves and closes the client it never recorded.
- **A third shutdown leak found and closed.** See "Deviations" — a graceful mqtt end issued before the
  connection established never closed the socket, while reporting itself finished.
- **The suite asks the broker.** `FakeShadowBroker.liveConnectionCount()` exposes the WebSocket
  service's own client set, and two lifecycle scenarios assert it reaches zero after a shutdown.
- **WR-15, shadow half closed.** `ShadowClient.requestFullShadow` and its cases are gone.

## Task Commits

1. **Task 1: One monitoring-path type, and a state that means nothing is working** (tracer, TDD)
   - RED `6ac79db` (test)
   - GREEN `d4938df` (feat)
2. **Task 2: A shutdown closes what it opened, and the broker proves it** (TDD)
   - RED `4094679` (test)
   - GREEN `99b1c1c` (fix)
3. **Task 3: Remove the shadow surface no production caller uses** — `cf1b491` (refactor)

## Files Created/Modified

- `src/runtime/accountRuntime.ts` — imports the single `MonitoringPath`; derives the path from three
  facts; marks a terminal authentication answer and records it; closes a connection opened during a
  shutdown; states in `stop()` why nothing releases the shadow source there
- `src/device/health.ts` — the fileoverview no longer claims the module is a declaration only; no type
  changed
- `src/cloud/mqttTransport.ts` — records the connection on the way through `onConnect` and drops a
  client that never connected instead of ending it gracefully
- `src/cloud/shadow.ts` — `requestFullShadow` removed from the interface and the implementation
- `test/runtime/accountRuntime.test.ts` — eleven new cases; the shadow double can hold its start open
- `test/cloud/mqttTransport.test.ts` — the client double records how each end was asked for
- `test/cloud/shadow.test.ts` — the removed member's cases deleted
- `features/degradedOperation.feature` — the two path values renamed to the declared ones
- `features/lifecycle.feature` — one scenario gained the live-connection assertion; one scenario added
  for a shutdown with a reconnect pending
- `features/support/fakeShadowBroker.ts` — `liveConnectionCount()`
- `features/support/steps/shadow.ts` — `Then the broker holds no live connection`

## The reconciled MonitoringPath

**Single declaration:** `src/device/health.ts`. `src/runtime/accountRuntime.ts` imports it as a type
and declares none of its own.

**Value set:** `'shadow-and-poll' | 'poll-only' | 'unavailable'`.

**How the runtime derives it:**

| halted | polling succeeded | shadow connected | Path |
|---|---|---|---|
| yes | any | any | `unavailable` |
| no | no | any | `unavailable` |
| no | yes | no | `poll-only` |
| no | yes | yes | `shadow-and-poll` |

A poll that is not succeeding reports `unavailable` even while the shadow is live. That is deliberate:
the poll is the reconciliation backstop, so with it down the plugin cannot vouch for what it holds,
and naming the combined path there would be a false normal. Erring toward the failing answer is the
safe direction for a safety monitor; the reverse is not.

Values the Cucumber steps use were renamed with the type; the step takes the value as a string, so no
step definition changed.

## The 01-13 open item: nothing releases the shadow source at `stop()`

**Decision: confirmed unobservable, left as it is, and the reasoning is now written into `stop()`
rather than carried in a summary.**

Reasoning, checked against the merged code:

1. `close()` sets `closing`, which makes `isCurrent` false, so shutdown raises no disconnection. That
   is 01-14's decision 2, and it is what keeps the shadow client from knocking the monitoring path
   back after this plan sets it. Confirmed still true: `release` is the only caller of
   `onDisconnected`, and every path into it is gated by `isCurrent`.
2. Therefore `handleShadowDisconnected` does not run at shutdown, so `releaseShadowSource()` is not
   called and the store keeps the shadow as the owner of telemetry.
3. Nothing can observe that ownership. `stop()` aborts the root controller before anything else, which
   ends every wait and request, so no poll follows that the ownership could hold off. `start()` after
   `stop()` performs no work. The store dies with the runtime; a Homebridge restart builds both afresh.

Releasing it anyway would have added a call whose effect no test could discriminate, which is a worse
outcome than a stated reason. If a future phase gives the store a life beyond its runtime, this becomes
observable and must be revisited — the comment in `stop()` says so.

## Decisions Made

- **The dead state is runtime-only.** No user-facing message, log line, or HomeKit distinction was
  added for it. Telling a user a dead path from a degraded one is RES-04 in Phase 5.
- **`hasStopped()` rather than a bare flag read.** The compiler kept the entry guard's narrowing across
  the `await` and reported the second check as always false. Reading through a function makes the
  second check ask again, which is the whole point of checking twice.
- **`closeQuietly` is shared by `stop()` and the shutdown window.** Two identical try/catch blocks
  would have been duplication the gate flags, and one named unit states the rule once.
- **The unit case owns the assign-after-await window; the scenario owns the reconnect window.** The
  first is a race inside one function that a scenario cannot steer. The new scenario's own description
  says which window it covers, so neither is described as covering both.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A graceful mqtt end before the connection established never closed the socket**

- **Found during:** Task 2, while proving the new broker assertion was not vacuous.
- **Issue:** With the plan's two windows closed, `features/lifecycle.feature` still failed about one
  run in three on `Then the broker holds no live connection`. Root cause, read out of the pinned
  `mqtt` build: `MqttClient._cleanUp(false, done)` sends the disconnect packet through `_sendPacket`,
  which queues it while the client is still connecting, so `stream.end()` is never reached. It then
  runs `if (done && !this.connected) { ...; done(); }`, so the transport's `end()` promise resolves and
  the shutdown reports success while the WebSocket stays open forever. The scenario's step
  `Then the broker holds 1 handshake` returns at the WebSocket upgrade, which is before the MQTT
  CONNACK, so the shutdown routinely landed inside exactly that window.
- **Fix:** `src/cloud/mqttTransport.ts` records the connection on its way through `onConnect` and asks
  for a forceful end when the client never connected. An established client still gets the graceful
  disconnect. Two cases in `test/cloud/mqttTransport.test.ts` assert which end each client gets.
- **Files modified:** `src/cloud/mqttTransport.ts`, `test/cloud/mqttTransport.test.ts` — **both outside
  the plan's declared `files_modified`.**
- **Verification:** `features/lifecycle.feature` five consecutive clean runs, where it failed one run in
  three before. A temporary probe asserting `liveConnectionCount() > 0` while a connection was open,
  run and then removed, proved the new assertion is not vacuous: it passed on the open side and reached
  zero after the shutdown. `test:coverage:direct` on the transport pair is 100 percent.
- **Committed in:** `99b1c1c` (part of the task 2 commit)

This is the same defect class the plan set out to close — a shutdown leaving a live connection nothing
will close — through a third mechanism the review did not name. The plan's own instruction settled it:
"If the count does not reach zero, that is the defect, not the harness."

**2. [Rule 3 - Blocking] `no-unnecessary-condition` on the post-await shutdown check**

- **Found during:** Task 2.
- **Issue:** The compiler carried the entry guard's narrowing of `stopped` across the `await`, so lint
  refused the second check as always false and the commit could not pass its hooks.
- **Fix:** Both checks in `attemptShadow` now read through `hasStopped()`.
- **Files modified:** `src/runtime/accountRuntime.ts` (in scope).
- **Verification:** `npm run lint` clean; the shutdown-window case still passes.
- **Committed in:** `99b1c1c`

**3. [Rule 2 - Missing coverage] A case for the shutdown-aborted launch**

- **Found during:** Task 1 GREEN.
- **Issue:** Splitting `launchFailure`'s aborted check out of the `||` chain made it a branch no case
  reached, dropping the pair below 100 percent.
- **Fix:** Added `SYNC-05 schedules nothing and reports no failure when a shutdown aborts the launch`,
  which is a real behaviour rather than a coverage filler.
- **Committed in:** `d4938df`

---

**Total deviations:** 3 auto-fixed (1 × Rule 1, 1 × Rule 2, 1 × Rule 3)
**Impact on plan:** Deviation 1 was required by a must-have that could not otherwise hold. No scope
creep otherwise; nothing user-facing was built, and the dead-code ignore list is untouched.

## Files touched outside the declared scope

- `src/cloud/mqttTransport.ts`
- `test/cloud/mqttTransport.test.ts`

Both for deviation 1 above. No other file outside `files_modified` was changed.

## Issues Encountered

The plan's `<verify>` blocks were not run as written. `npm run test:coverage:direct -- "<src>"` passes a
single argument, but the npm script ends in `--test-coverage-include`, so that argument becomes the
include value and leaves `node --test` with no test glob. Both the include value and the test path were
passed instead. Three earlier executors reported the same defect; it is a plan-document issue, not a
project one.

## Deferral Register

Every review finding this gap-closure set did not close, with the reason. Two rows changed from the
plan's copy, as instructed: WR-09 is recorded closed rather than deferred, and WR-14 item 1 is recorded
done. Row count: **7**.

| Finding | Disposition | Reason |
|---------|-------------|--------|
| WR-09 — unbounded registered-secret list | **Closed**, in plan 01-15 task 3 | Not deferred. A structure that degrades with uptime is the phase goal's own subject matter, and the fix came down to one optional argument plus three call sites once permanently-registered values were left alone. |
| WR-12 item 1 — the fake broker accepts every handshake signature | Deferred to human verification | Making the harness verify the signature means writing a third implementation from the same reading of the specification that the signer and its unit test already share, so it cannot falsify that reading. The verifier's human item — one handshake against the real AWS IoT endpoint with real temporary credentials — is the only check that can. It is already recorded in `01-VERIFICATION.md` under human verification and stays there. |
| WR-14 item 1 — committed credential file under the test configuration directory | **Done before this set was planned** | `test/hbConfig/auth.json` and its `.gitignore` force-include were deleted. No task exists for it; recorded so it is not re-opened as an unaddressed finding. |
| WR-14 item 2 — wildcard-bearing device identifier | **Closed**, in plan 01-14 task 2 | Not deferred. |
| WR-14 item 3 — a rejected complete-shadow request leaves a per-device blind spot | Deferred to Phase 3 | The honest fix is marking that device's affected scope untrustworthy, which needs the per-scope trust machinery in `src/device/health.ts`. That module is a declaration-only scaffold this phase is fenced off from implementing, and inventing a partial version here would ship a second contract for Phase 3 to unpick. Raising the log level instead would report noise without marking anything, which is not what D-014 asks for. |
| WR-15, configuration half — `name` and `offlineConfirmationPollCount` carried but unread | Deferred by design | Both are validated and carried through the seam for a later phase, and `offlineConfirmationPollCount` is CONF-05's own contract with Phase 5 as its consumer. Removing either would break a stated requirement. The shadow half of WR-15 is closed by task 3. |
| Heartbeat-only telemetry keys erased by the first poll after shadow ownership is released | Deferred to Phase 3 | Raised while planning 01-13 task 2 rather than by the review. `toSnapshot` still replaces telemetry wholesale when no watermark is held, so the first poll after each release drops the keys the REST body does not carry, until the next heartbeat. Not a regression — today's polls clobber unconditionally — but D-014 says those keys should survive as stale rather than vanish, and marking a key stale needs the same Phase 3 trust machinery as WR-14 item 3. |

## Requirement note for SYNC-03

Removing `requestFullShadow` does not weaken SYNC-03. The complete-shadow-after-reconnect obligation is
carried by `requestEveryShadow`, which subscribes and then publishes a get request for every device
after each connection, and reports `onConnected` only once both have succeeded. `requestFullShadow` had
no production caller, published on whatever connection the client currently held — which after plan
01-14 may belong to a superseded generation — and returned a promise nobody awaited, so a rejection
from it would have been unhandled.

## Known Stubs

None. No stub, placeholder, or skipped test was introduced.

## Gate Results

| Gate | Result |
|---|---|
| `npm run check` | exit 0, run twice |
| Unit tests | 457 pass, 0 fail (446 before, +11) |
| Cucumber | 35 scenarios, 299 steps, all pass |
| Cucumber, three consecutive runs | exit 0, 0, 0 |
| `fallow dead-code` / `health` / `dupes` | clean; duplication 0.0% |
| `.fallowrc.json` ignore list | unchanged, 8 scaffold entries |
| `test:coverage:direct`, runtime pair | 100% lines, branches, functions |
| `test:coverage:direct`, shadow pair | 100% lines, branches, functions |
| `test:coverage:direct`, transport pair | 100% lines, branches, functions |
| `npm run test:coverage:all` | 100% lines, branches, functions |

## User Setup Required

None.

## Next Phase Readiness

**Ready for Phase 5 (RES-03, RES-04).** The runtime publishes one honest value from
`'shadow-and-poll' | 'poll-only' | 'unavailable'`, and `DeviceHealth.monitoringPath` accepts it as-is.
What is still missing there, deliberately, is the user-facing separation of a dead path from a degraded
one; that is RES-04's own work.

Two things Phase 5 should know:

1. `unavailable` currently means both "nothing has started yet" and "the runtime halted for good". A
   user-facing surface that must distinguish "starting" from "stopped" needs a fact the runtime holds
   but does not publish. Adding a fourth value is a type change Phase 5 should make deliberately, not
   a translation layer.
2. A shutdown leaves the path where it stood rather than moving it to `unavailable`, because an aborted
   signal is not a monitoring failure. A consumer that reads the path after `stop()` reads the last
   working answer.

**Ready for Phase 3.** Two register rows above (WR-14 item 3 and the heartbeat-key carve-out) both wait
on the same per-scope trust machinery in `src/device/health.ts`, which is Phase 3's to build.

---

_Phase: 01-secure-cloud-foundation_
_Completed: 2026-08-29_

## Self-Check: PASSED

- Every file named in `key-files.modified` exists on disk.
- Every commit hash cited resolves: `6ac79db`, `d4938df`, `4094679`, `99b1c1c`, `cf1b491`.
- `grep -rn 'export type MonitoringPath' src` returns exactly one line, in `src/device/health.ts`.
- `grep -rn 'requestFullShadow' src test features` returns nothing.
- `.fallowrc.json` has no diff against the plan's base commit.
