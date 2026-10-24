---
phase: 01-secure-cloud-foundation
plan: 13
subsystem: device-state
tags: [merge-reducer, freshness, source-ownership, change-detection, immutability]

requires:
  - phase: 01-secure-cloud-foundation
    provides: "The canonical device state store and its merge reducer (plan 01-03)"
  - phase: 01-secure-cloud-foundation
    provides: "One disconnection notification per connection, raised when the client stops using it (plan 01-14)"
  - phase: 01-secure-cloud-foundation
    provides: "A deterministic Cucumber gate (plan 01-12)"
provides:
  - "A receipt time that means an observation arrived, not that a message did"
  - "A version watermark with one stated meaning: the shadow currently owns telemetry"
  - "A poll that refreshes reachability without reverting telemetry the shadow delivered"
  - "A reconnect refresh that is applied rather than refused as stale"
  - "A change report naming only keys whose values actually moved"
  - "Both opaque records frozen at every depth before any listener sees them"
affects: [01-17, device-health, phase-2-family-adapters, phase-3-homekit-derivations]

actuals:
  tokens: 32668
  tasks: 3
  commits: 7

tech-stack:
  added: []
  patterns:
    - "Source ownership carried by a single field, so two sources cannot both claim the record"
    - "Freshness derived from whether the message observed anything, not from its arrival"
    - "Structural value comparison with reference identity kept as the fast path"

key-files:
  created: []
  modified:
    - src/device/state.ts
    - src/runtime/accountRuntime.ts
    - test/device/state.test.ts
    - test/runtime/accountRuntime.test.ts
    - features/shadowMerge.feature
    - features/shadowLifecycle.feature
    - features/support/steps/shadow.ts
    - features/support/steps/runtime.ts

key-decisions:
  - "A document carrying no observation may advance an existing watermark but may never establish one, so observing nothing cannot take telemetry ownership from the poll"
  - "shadowVersion carries the ownership contract; it is not a second field, so no state can say the shadow owns telemetry and also say it does not"
  - "A poll always refreshes connectivity, identity, device time, and receipt time, because answering at all is a real observation about the device"
  - "Ownership is released on every disconnect reason, including the routine one, so the poll takes over exactly when the shadow stops delivering"
  - "Shutdown still raises no disconnection, so close() releases nothing; a stopped runtime polls nothing, so the held watermark is unobservable"
  - "changedKeys compares by shape only after reference identity fails, so the scalar fields that dominate keep the cheap path"

patterns-established:
  - "One field, one stated meaning: a nullable watermark answers both 'how far' and 'who owns it'"
  - "An observation predicate separates a message arriving from the device being observed"
  - "A recursive freeze over parsed vendor JSON, documented as acyclic rather than cycle-tracked"

requirements-completed: [SYNC-02, SYNC-03]

coverage:
  - id: D1
    description: "A shadow document carrying no reported section leaves the receipt time where it was, so a device that has gone quiet cannot read as freshly reporting"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#leaves the receipt time alone and establishes no watermark for a patch that reports neither section"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#leaves the receipt time alone and advances the watermark it already held for a patch that reports neither section"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#advances the receipt time for a patch that reports telemetry"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#advances the receipt time for a patch that reports only device metadata"
        status: pass
      - kind: integration
        ref: "features/shadowMerge.feature#A requested value becomes neither device state nor a fresh receipt time"
        status: pass
    human_judgment: false
  - id: D2
    description: "A document carrying no observation never establishes shadow ownership, so it cannot switch the poll backstop off"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#leaves the receipt time alone and establishes no watermark for a patch that reports neither section"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#replaces telemetry after a patch that reports neither section left the watermark absent"
        status: pass
      - kind: integration
        ref: "features/shadowMerge.feature#A requested value becomes neither device state nor a fresh receipt time"
        status: pass
    human_judgment: false
  - id: D3
    description: "A REST poll refreshes reachability and identity but cannot revert telemetry the shadow delivered"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#refreshes reachability and leaves telemetry alone while the shadow owns it"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-02 keeps the telemetry and metadata a later poll would overwrite while the shadow owns them"
        status: pass
      - kind: integration
        ref: "features/shadowLifecycle.feature#A poll does not revert the value the live shadow delivered"
        status: pass
    human_judgment: false
  - id: D4
    description: "A lost connection hands telemetry back to the poll, whatever reason the connection reports, and the poll writes telemetry again"
    requirement: SYNC-03
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-03 hands telemetry back to the poll when the connection reports transport-closed"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-03 hands telemetry back to the poll when the connection reports transport-error"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-03 hands telemetry back to the poll when the connection reports subscription-refused"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-03 hands telemetry back to the poll when the connection reports handshake-refused"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-15 lets the poll write telemetry again once the shadow connection is gone"
        status: pass
      - kind: integration
        ref: "features/degradedOperation.feature#The plugin keeps polling while the shadow connection is unavailable"
        status: pass
    human_judgment: false
  - id: D5
    description: "A complete shadow arriving at a version already seen is applied after a degraded period, so the reconnect refresh restores state"
    requirement: SYNC-03
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#applies a shadow patch at a version already seen, so a reconnect refresh is not discarded"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#hands telemetry back to the poll"
        status: pass
    human_judgment: false
  - id: D6
    description: "Two identical polls carrying a structured telemetry value report no change and notify nobody"
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#notifies no listener when two identical polls repeat a structured value"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#reports a structured value that moved as the one key that changed"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#reports a key one record carries and the other omits as changed"
        status: pass
    human_judgment: false
  - id: D7
    description: "A listener cannot edit canonical safety state in place at any depth of either opaque record"
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#freezes a structured value nested inside the telemetry record"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#freezes a structured value nested inside the metadata record"
        status: pass
    human_judgment: false

duration: 39min
completed: 2026-08-29
status: complete
---

# Phase 1 Plan 13: Honest Freshness and Source Ownership Summary

**The merge reducer now says which source owns telemetry and when an observation actually arrived, so a document that observed nothing cannot make a quiet device read as fresh and a poll cannot revert a value the shadow delivered.**

## Performance

- **Duration:** 39 min
- **Started:** 2026-08-29T12:10:00Z
- **Completed:** 2026-08-29T12:49:00Z
- **Tasks:** 3
- **Files modified:** 8

## The two false-normal paths this closes

**CR-01: an observation-free document refreshed freshness.** A shadow document
with no `reported` section passed the staleness guard, merged nothing, advanced
the version watermark and restamped `receivedAt`. That field is the snapshot's
only freshness field and is what `src/device/health.ts` declares as
`lastReceivedAt`, so a device that had gone quiet read as freshly reporting. The
vendor publishes exactly that document, the accepted update for a desired-only
write, every time it delivers a command.

`nextSnapshot` now derives whether the patch carried an observation from whether
either opaque record is present, and takes the new receipt time only when it
did. `features/shadowMerge.feature` asserted the old behaviour as correct; it
now asserts the new one.

**CR-02: a poll reverted newer shadow telemetry and then locked recovery out.**
`toSnapshot` replaced `data` wholesale with no ordering guard and carried
`shadowVersion` forward unchanged, so a poll describing an earlier moment
reverted newer shadow telemetry, and `isStalePatch` then refused the shadow's
re-delivery at the same version. `shadowVersion` now carries one stated meaning:
defined means the shadow currently owns `data`. A poll refreshes connectivity,
identity, device time and receipt time always, and replaces telemetry only when
no watermark is held. `DeviceStateStore.releaseShadowSource()` clears the
watermark on every stored device, and the runtime calls it from
`handleShadowDisconnected`.

That also repairs the second-order effect the verifier recorded: a complete
shadow arriving after a degraded period is no longer discarded as stale, so the
SYNC-03 reconnect refresh restores state again.

**The rule that keeps the fix from creating a worse defect.** A document
carrying no observation may advance a watermark that already exists, because
ordering information is still information, but it may never establish one. With
the ownership rule in place, a document that observed nothing would otherwise
take `data` from the poll, freezing telemetry at whatever the poll last wrote
while receipt time kept advancing. That is reachable in production: after a
release on disconnect there is a window between the socket coming up and
`get/accepted` landing, and it is permanent for any device whose `get` is
rejected. `nextShadowVersion` returns `undefined` when the patch carried no
observation and the snapshot carried no watermark.

Two warnings from the same review are closed alongside them. `changedKeys`
compared by reference, and every poll re-parses the vendor body into fresh
objects, so any structured telemetry value reported as changed on every poll.
It now falls back to `isDeepStrictEqual` when identity fails. `freeze` promised
in its own comment that a consumer could not edit canonical state in place but
stopped at the top level of each record; it now reaches every depth.

## Where releaseShadowSource is called, and why nothing is missed

There is exactly one call site:

| Call site | Fires when |
|---|---|
| `src/runtime/accountRuntime.ts:237`, in `handleShadowDisconnected` | Every disconnection the shadow client reports, including the routine `transport-closed` |

Audited against the merged 01-14 code rather than taken on faith:

- `options.onDisconnected` is called from one place, `release` in
  `src/cloud/shadow.ts:230`. Nothing else raises it.
- `release` is called from four sites: `handleError` (`transport-error`),
  `handleClose` for an established connection (`transport-closed`),
  `handleClose` before establishment (`handshake-refused`), and the
  `requestEveryShadow` catch (`subscription-refused`). Those are every way the
  client stops being able to deliver a document.
- `openConnection` supersedes a previous connection at
  `src/cloud/shadow.ts:432`. It is reached from `start()`, where `connection` is
  undefined and nothing is superseded, and from `scheduleReconnect(reopen)`.
  Every `scheduleReconnect` call (lines 305, 327, 353) sits immediately after a
  `release`, so a superseded generation has always reported already. The
  plan-checker's enumeration holds against the merged code.
- The four runtime cases drive each reason through
  `ShadowRuntimeOptions.onDisconnected` and assert the watermark is gone
  afterwards, so the wiring is asserted rather than assumed.

**One ownership-ending path deliberately raises nothing:** `close()` sets
`closing`, which makes `isCurrent` false, so shutdown reports no disconnection.
That is 01-14's decision 2 and it is left alone. The watermark therefore stays
set through shutdown. Nothing observes it: `stop()` aborts every wait and
request first, so no poll runs afterwards, and the store is discarded with the
runtime. Recorded here because it is the one gap in the otherwise complete
pairing, and because plan 01-17 owns what `stop()` sets.

## The shadowMerge assertion change

The scenario `A requested value never becomes device state` asserted
`Then the canonical snapshot is at shadow version 1` after a requested-value
publish. That assertion **is** the establishing behaviour this plan removes, so
it could not be kept. The scenario is now:

```gherkin
  Scenario: A requested value becomes neither device state nor a fresh receipt time
    When the plugin starts
    When the scenario clock moves forward
    When the device publishes a requested value
    Then the canonical snapshot carries no shadow version
    Then the canonical snapshot carries the receipt time the scenario started at
    Then the canonical snapshot carries no "alarm_muted" field
    Then the canonical snapshot carries these fields:
      | water_level          | 1    |
      | primary_pump_running | true |
    Then the plugin reports 0 canonical changes
```

The version assertion became `carries no shadow version`, a clock step was
inserted before the publish, and a receipt-time assertion was added. Both new
assertions were checked against the pre-fix reducer and each one fails there:
`1 !== undefined` for the version, and `1787918460000` against the expected
`1787918400000` for the receipt time.

**The two neighbouring real-heartbeat scenarios are untouched.**
`A partial heartbeat keeps the fields it omits` and
`An identical heartbeat reports no change` are byte-for-byte what they were; the
latter still asserts shadow version 1 and then 2, because a real heartbeat
carries an observation and does establish ownership.

## Task Commits

1. **Task 1 (tracer, TDD): a document carrying no telemetry does not restamp freshness**
   - RED `926639b` — `test(state)`: two failing cases for the receipt time and the establish-versus-advance rule
   - GREEN `676a6c7` — `fix(state)`: `carriesObservation`, `nextShadowVersion`, and the amended merge scenario
2. **Task 2 (TDD): the poll and the shadow cannot revert each other**
   - RED `c5d90ea` — `test(state)`: the verifier's revert reproduced, plus four connection-reason cases
   - GREEN `e93001a` — `fix(state)`: `pollTelemetry`, `releaseShadowSource`, the runtime call, and the new lifecycle scenario
3. **Task 3 (TDD): a reported change is a real change, and the freeze reaches the whole record**
   - RED `7b856ee` — `test(state)`: three failing cases for structural comparison and the nested freeze
   - GREEN `3fc6749` — `fix(state)`: `isSameValue` and `freezeDeep`

No REFACTOR commit. Both health gates (60-line units, cognitive complexity 15)
passed on the GREEN implementations without cleanup.

## Files Created/Modified

- `src/device/state.ts` — `carriesObservation`, `nextShadowVersion`,
  `pollTelemetry`, `releaseShadowSource`, `isSameValue`, `freezeDeep`; the
  `shadowVersion` doc comment now states the ownership contract.
- `src/runtime/accountRuntime.ts` — `handleShadowDisconnected` releases the
  shadow source before it decides whether to report a fault.
- `test/device/state.test.ts` — a new `releaseShadowSource` describe block and
  16 new cases; the seeding helper `versionedStore` now establishes its
  watermark with a real observation; one case that asserted the restamped
  receipt time amended.
- `test/runtime/accountRuntime.test.ts` — four connection-reason cases, one
  degraded-path composition case, one amended poll-backstop expectation.
- `features/shadowMerge.feature` — the requested-value scenario amended.
- `features/shadowLifecycle.feature` — a new scenario running a short poll
  interval against a live shadow.
- `features/support/steps/shadow.ts` — three new steps: the clock advance, the
  absent-watermark assertion, the starting-receipt-time assertion.
- `features/support/steps/runtime.ts` — one new step waiting on a floor of
  device polls (see deviations).

## Decisions Made

1. **One field carries the ownership contract.** `shadowVersion` answers both
   "how far has the shadow been applied" and "does the shadow own `data`". A
   second boolean would allow a state saying the shadow owns telemetry and also
   does not.
2. **A poll always takes the new receipt time.** A successful poll is a real
   observation about the device even when it adds no telemetry, so this is not
   the freshness lie task 1 removes. Only a document that observed nothing is
   refused a restamp.
3. **Ownership is released on every reason, including the routine close.**
   Losing the connection is exactly the moment the shadow stops being the
   source. The reconnect's complete-shadow request re-establishes it.
4. **Reference identity kept as the fast path in `isSameValue`.** Every
   enumerated Gemini field is scalar today, so the deep comparison should be the
   fallback rather than the rule.
5. **The recursive freeze does no cycle tracking.** Both records are parsed
   vendor JSON and are acyclic by construction; the comment says so rather than
   the code carrying a guard no input can exercise.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A new step definition added in task 2, in a file outside `files_modified`**

- **Found during:** Task 2
- **Issue:** The plan said to use only existing steps for the new lifecycle
  scenario, and the only step that waits for polls is
  `Then the fake service holds {int} vendor request(s)`. That step asserts an
  exact equality after waiting on a floor. Under the short poll interval the
  count keeps growing between the wait and the assertion, so the scenario would
  have been flaky. This phase already failed verification once on a flaky
  Cucumber gate; adding a second race was not acceptable.
- **Fix:** Added `Then the plugin polls the vendor at least {int} times`, which
  waits on a floor and asserts nothing more.
- **File modified:** `features/support/steps/runtime.ts`, which is **not** in
  the plan's `files_modified`. It is the right home: `features/CLAUDE.md`
  requires step definitions to be organised by function rather than by the
  feature file that needed them, and the sibling `assertVendorRequestCount` and
  `credentialRequestCount` already live there. Putting it in
  `features/support/steps/shadow.ts` to stay inside the declared file list would
  have broken the project rule.
- **Verification:** The new scenario passes, and fails against a reducer whose
  poll overwrites shadow-owned telemetry.
- **Committed in:** `e93001a`

**2. [Rule 1 - Bug] An existing runtime case asserted the CR-02 defect as correct**

- **Found during:** Task 2 GREEN
- **Issue:** `SYNC-03 keeps the shadow metadata a later poll does not carry`
  asserted `data: { water_level: 4 }` after a poll landed on a snapshot holding
  watermark 7. That is the poll replacing shadow-owned telemetry, which is the
  defect. The plan named the shadowMerge scenario as the accepted artifact
  locking the behaviour in; this runtime case does the same thing and the plan
  did not mention it.
- **Fix:** Amended to assert the merged shadow telemetry survives, and retitled
  `SYNC-02 keeps the telemetry and metadata a later poll would overwrite while
  the shadow owns them`. Its metadata claim, which was correct, is unchanged.
  Added `D-15 lets the poll write telemetry again once the shadow connection is
  gone` so the degraded direction stays covered end to end.
- **Files modified:** `test/runtime/accountRuntime.test.ts`
- **Committed in:** `e93001a`

**3. [Rule 3 - Blocking] The seeding helper established a watermark with an observation-free patch**

- **Found during:** Task 1 RED
- **Issue:** `versionedStore()` in `test/device/state.test.ts` seeded shadow
  version 5 with `{ data: undefined, state: undefined, version: 5 }`, which
  under the new rule establishes nothing. Every out-of-order case is built on
  it.
- **Fix:** The seeding patch now repeats the discovered water level, so it
  establishes the watermark without moving a value or notifying anyone. The
  change is compatible with the reducer before and after the fix, so it did not
  weaken the RED observation.
- **Files modified:** `test/device/state.test.ts`
- **Committed in:** `926639b`

**4. [Rule 3 - Blocking] The plan's coverage commands as written find no tests**

- **Found during:** Task 3
- **Issue:** `npm run test:coverage:direct -- "<src path>"` passes the source
  path as the value of `--test-coverage-include` and leaves the runner with no
  test path, so it globs the repository and fails on unbuilt TypeScript. Plan
  01-14 reported the same defect.
- **Fix:** Ran each with the test path appended. No file changed.
- **Committed in:** n/a (command usage only)

### Two settled steps, recorded rather than fixed

The two new shadowMerge assertions each wait 200 ms before reading the snapshot.
An observation-free document leaves no trace in the store, so there is nothing
positive for a step to wait on, and asserting immediately would pass against the
defect. A settled read is the same shape `features/support/steps/runtime.ts`
already uses for `homebridge shuts down`. Both assertions were checked against
the pre-fix reducer and both fail there, so the wait is long enough.

---

**Total deviations:** 4 auto-fixed (1 x Rule 1, 3 x Rule 3)
**Impact on plan:** One file outside `files_modified`
(`features/support/steps/runtime.ts`, 15 lines, one step definition and one
counting helper). Nothing else was touched. `src/cloud/shadow.ts` was read for
the ownership audit and not modified. Plan 01-17's work was not pre-empted: the
dead monitoring state, the `MonitoringPath` type reconciliation, and the
`attemptShadow` assign-after-await window are all untouched.

## Known Stubs

None. Nothing was left placeholder or unwired.

## Knowingly Deferred

**Heartbeat-only keys vanish for one poll after every release.** `toSnapshot`
still replaces telemetry wholesale from the vendor body when no watermark is
held, so the first poll after each release erases the keys a heartbeat carries
and the REST body does not, until the next heartbeat up to about fifteen minutes
later. The provider forces at least one reconnect a day, so this happens at
least daily. It is not a regression, since today's polls clobber
unconditionally, and it is not on the gap list. D-014 would rather those keys
survived as stale than vanished, but marking a key stale needs the per-scope
trust machinery that belongs to Phase 3.

## Threat Flags

None. No new network endpoint, auth path, file access, or trust-boundary schema
was introduced; the change is confined to the reducer and one runtime call.

## Issues Encountered

- **TruffleHog's git-mode scan cannot run from a linked worktree**, exactly as
  `CLAUDE.md` documents. Every commit was preceded by the documented filesystem
  route (`trufflehog filesystem <changed paths> --results=verified,unknown
  --fail`), clean each time with `verified_secrets: 0` and
  `unverified_secrets: 0`, and only then committed with `SKIP=trufflehog`. No
  other hook was skipped and `--no-verify` was never used.
- **The worktree has no `node_modules`.** It was symlinked from the main
  checkout for the duration and removed before returning. No package was
  installed, added, or upgraded (T-01-68).

## Verification Results

| Gate | Result |
|---|---|
| `npm run check` | exit 0 |
| `npm run test:unit` | 446 tests, 446 pass, 0 fail (was 424 at the wave base; 22 added, none removed) |
| `npm run test:cucumber` | 34 scenarios / 287 steps, 4 consecutive runs, exit 0 each (~11.1s) |
| `test:coverage:direct` on `src/device/state.ts` | 100.00 lines / 100.00 branches / 100.00 functions |
| `test:coverage:direct` on `src/runtime/accountRuntime.ts` | 100.00 lines / 100.00 branches / 100.00 functions |
| `fallow dead-code` | 0 issues |
| `fallow health` | 0 above threshold, maintainability 92.8 |
| `fallow dupes` | 0% |
| Amended merge scenario fails against the pre-fix reducer | yes, on both new assertions, checked separately |
| New lifecycle scenario fails against a poll that overwrites shadow telemetry | yes |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for plan 01-17.** Two things it should know:

1. `DeviceStateStore` gained `releaseShadowSource()`, called from
   `handleShadowDisconnected`. If 01-17 adds a terminal state at `stop()`, note
   that `close()` raises no disconnection, so nothing releases the shadow source
   at shutdown and nothing needs to.
2. `handleShadowDisconnected` now does two things rather than one. A change to
   its reason handling has to keep the release unconditional; releasing only for
   the fault reasons would leave the routine daily reconnect with the shadow
   still owning telemetry it can no longer deliver.

**Ready for Phase 2 and Phase 3.** `changedKeys` is now safe to filter on for a
structured field, which is what D-19 promises its consumers, and a snapshot
handed to a listener cannot be edited at any depth.

---

_Phase: 01-secure-cloud-foundation_
_Completed: 2026-08-29_

## Self-Check: PASSED

All eight modified source files and this summary exist on disk, and all six
commit hashes are present in `git log`.
