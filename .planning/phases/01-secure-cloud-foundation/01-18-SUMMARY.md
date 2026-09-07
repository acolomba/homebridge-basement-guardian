---
phase: 01-secure-cloud-foundation
plan: 18
subsystem: runtime
tags: [monitoring-path, shutdown, shadow, lifecycle, warnings]

requires:
  - phase: 01-secure-cloud-foundation
    provides: "One disconnection per connection, and none during shutdown (plan 01-14)"
  - phase: 01-secure-cloud-foundation
    provides: "A monitoring path derived from facts rather than assigned (plan 01-17)"
provides:
  - "A shadow client that reports itself not connected once it has been closed"
  - "A monitoring path that reads unavailable once the runtime has stopped"
affects: [phase-3-homekit-derivations, phase-5-resilience-presentation]

actuals:
  tokens: 1558
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A derived report reads every fact that can end it, including the shutdown that ends them all"

key-files:
  created: []
  modified:
    - src/cloud/shadow.ts
    - src/runtime/accountRuntime.ts
    - test/cloud/shadow.test.ts
    - test/runtime/accountRuntime.test.ts

key-decisions:
  - "`connected` reads the shutdown flag beside the connection's own liveness, rather than clearing `live` at close, because clearing it would need a write on the path 01-14 deliberately keeps silent"
  - "`unavailable` means no source is feeding canonical state, not that something failed; that reading is what lets a shutdown reach the value without calling a shutdown a fault"
  - "The aborted-poll case now asserts the failure log, because the monitoring path can no longer discriminate the behavior that case is about"

patterns-established:
  - "When a derived value gains a fact, the case that read the old value moves to the fact it was really about"

requirements-completed: []

coverage:
  - id: W1
    description: "A closed shadow client reports itself not connected"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#reports not connected once the client itself has been closed"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#reports connected between the connect notification and the close that follows it (the transport-side case, unchanged)"
        status: pass
    human_judgment: false
  - id: W2
    description: "A runtime that has stopped reports monitoring unavailable rather than the path it last held"
    requirement: SYNC-05
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-05 reports monitoring unavailable once the runtime has stopped"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-05 records no failure when a shutdown aborts a poll already in flight"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 18: Two closed warnings Summary

**A closed shadow client no longer reports itself connected, and a stopped runtime no longer reports
a working monitoring path.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-29T13:50:00Z
- **Completed:** 2026-08-29T14:15:00Z
- **Tasks:** 2
- **Files modified:** 4

## What changed

Both warnings were the same defect in two places: a status that read healthy for something that had
stopped. Neither was observable, because nothing consumes either value yet. That is the reason to
fix them now. Phase 3 and Phase 5 are the phases that will start reading them, and by then the false
normal would be live.

### W1 — `ShadowClient.connected` after `close()`

`close()` sets `closing`, which makes `isCurrent` false, so the transport's close handler returns
before it reaches `release`. Nothing clears `connection.live`, and the getter read it alone.

The getter now reads both facts that decide the answer:

```ts
get connected(): boolean {
  return !closing && (connection?.live ?? false);
}
```

`connection.live` stays the only record of whether a connection can carry a shadow message. Nothing
writes a second flag that could disagree with it. The shutdown flag `close()` already sets supplies
the other half.

Clearing `live` inside `close()` was the alternative. It was rejected: the close path is silent by
design, and adding a write there puts the answer in two places that a later change could separate.

The existing case named `reports connected between the connect notification and the close that
follows it` closes the transport, not the client. That is why the bug survived. The new case calls
`client.close()`, which is the path the runtime uses at shutdown.

### W2 — `monitoringPathNow()` and `stopped`

The path derived from three facts: whether authentication halted, whether the poll is succeeding,
and whether the shadow is connected. Whether the runtime had stopped was not among them, so after
`stop()` the path could still read `shadow-and-poll`.

`stopped` is now one of the facts:

```ts
function monitoringPathNow(): MonitoringPath {
  if (stopped || halted || !polling) {
    return 'unavailable';
  }

  return shadowConnected ? 'shadow-and-poll' : 'poll-only';
}
```

The comment above the function carries the reason rather than leaving the new condition unexplained.
It extends the existing argument instead of replacing it: a halted runtime is unavailable because
nothing will be attempted again, a stopped one for the same reason and no other, and polling stays
the floor below both.

## Reversing 01-17's shutdown decision

Plan 01-17 decided that a shutdown leaves the path where it stood, and wrote a case asserting it:
`SYNC-05 leaves the monitoring path where it stood, because a shutdown is not a monitoring failure`.
That case is replaced.

The two positions differ on what `unavailable` means.

01-17 read it as a fault report. On that reading a shutdown must not produce it, because a shutdown
is not a fault, and the reasoning follows.

The value names which sources are feeding canonical state. That is what the derivation computes and
what `DeviceHealth.monitoringPath` documents. On that reading a shutdown reaches `unavailable`
without being called a fault: `stop()` aborts every wait and request, so nothing is feeding
anything, and `unavailable` is the honest name for it.

The second reading is the one the phase's must-have was verified against: "the runtime can express
that monitoring has stopped". Under 01-17's reading there was one case where it could not.

Nothing is recorded in the failure log at `stop()`. A shutdown still is not a fault. Only the
derived report changes.

## The case that had to move

`SYNC-05 leaves the monitoring path alone when a shutdown aborts a poll already in flight` asserted
the path after a shutdown. With `stopped` in the derivation the path reads `unavailable` either way,
so that assertion no longer discriminates anything: it would pass whether or not the aborted request
was recorded as a poll failure.

The case now asserts what it was always about. `runPoll` returns early when `root.signal.aborted`,
so no failure is recorded and no warning is written. The case asserts the empty warning list, and it
still reaches that branch. Retitled `SYNC-05 records no failure when a shutdown aborts a poll
already in flight`.

## Contracts checked, not broken

**01-14's `onDisconnected` contract.** Untouched. `release` is still the only caller, `isCurrent`
still gates every path into it, and `closing` still suppresses a disconnection at shutdown. The
change reads `closing`; it does not write it and adds no notification. 01-14's own next-plan note
says `client.connected` should be false from the moment ownership ends, so this closes a gap in that
contract rather than working against it.

**01-17's derivation.** Kept and extended. The path is still computed from facts held by the runtime
rather than assigned wherever something changed. One fact joined the set. Its shutdown _conclusion_
is reversed, as recorded above; its _method_ is what made the reversal one line.

## Task Commits

1. **Task 1: A closed client reports itself closed** (TDD)
   - RED `6380e05` (test)
   - GREEN `ba945e0` (fix)
2. **Task 2: A stopped runtime reports monitoring gone** (TDD)
   - RED `9848c01` (test)
   - GREEN `2cbe227` (fix)

## Files Created/Modified

- `src/cloud/shadow.ts` — `connected` derives from `closing` and `connection.live` together, with the
  reason for reading the shutdown flag stated
- `src/runtime/accountRuntime.ts` — `monitoringPathNow` derives from `stopped` as well, with the
  existing comment extended to shutdown; `runPoll`'s abort comment now names the fact it protects
  rather than the path, which the shutdown now pins
- `test/cloud/shadow.test.ts` — one case added, closing the client
- `test/runtime/accountRuntime.test.ts` — one case rewritten for the new behavior, one re-aimed at
  the failure log

## Decisions Made

- **No user-facing surface was added.** Telling a user a dead monitoring path from a working degraded
  one is RES-04, in Phase 5. Both changes are runtime state only.
- **No new value in `MonitoringPath`.** `unavailable` now covers three conditions: nothing has started
  yet, the runtime halted for good, and the runtime shut down. 01-17 already flagged the first two as
  a distinction Phase 5 must make deliberately if it needs one. This adds a third to that same note
  rather than pre-deciding a type change Phase 5 owns.

## Deviations from Plan

There was no PLAN.md; the specification was inline. Against it:

**1. A second existing case had to change**

- **Found during:** Task 2 RED.
- **Issue:** The specification named the one case that asserts the old shutdown behavior. A second,
  `SYNC-05 leaves the monitoring path alone when a shutdown aborts a poll already in flight`, also
  asserts the path after a shutdown. Leaving it would have left a case whose title claims to cover
  the aborted poll while its assertion is satisfied by the shutdown alone.
- **Fix:** Re-aimed at the failure log and retitled, as described above. Its arrange and act are
  unchanged, so `runPoll`'s abort branch is still reached.
- **Files modified:** `test/runtime/accountRuntime.test.ts` (in scope).
- **Committed in:** `9848c01`

**2. One comment adjusted for truth**

- **Found during:** Task 2 GREEN.
- **Issue:** `runPoll`'s catch says an aborted request leaves "the path where it stood". After the
  change the path is pinned by the shutdown, so that sentence describes something else's doing.
- **Fix:** The comment now names what the early return actually protects: nothing is recorded and the
  poll keeps whichever answer it last gave.
- **Committed in:** `2cbe227`

---

**Total deviations:** 2, both inside the four files the specification allows.

## Verification note

The reported unit-test count before this work was 455, not the 457 that `01-17-SUMMARY.md` claims.
This confirms warning W8 in `01-VERIFICATION.md`. The count is now 456: two cases were rewritten in
place and one was added.

## Known Stubs

None. No stub, placeholder, or skipped test was introduced.

## Gate Results

| Gate                                 | Result                                    |
| ------------------------------------ | ----------------------------------------- |
| `npm run check`                      | exit 0, run twice                         |
| Unit tests                           | 456 pass, 0 fail (455 before, +1)         |
| Cucumber                             | 35 scenarios, 299 steps, all pass         |
| Cucumber, three consecutive runs     | exit 0, 0, 0                              |
| `fallow dead-code` / `health` / `dupes` | clean; duplication 0.0%                |
| `test:coverage:direct`, shadow pair  | 100% lines, branches, functions           |
| `test:coverage:direct`, runtime pair | 100% lines, branches, functions           |
| `npm run test:coverage:all`          | 100% lines, branches, functions           |
| Files touched                        | the four allowed, and no others           |

## User Setup Required

None.

## Next Phase Readiness

**Phase 5 (RES-04).** `unavailable` now covers a third condition. A surface that must separate
"starting", "stopped for good", and "shut down" needs facts the runtime holds but does not publish.
That remains a deliberate type change for Phase 5, not a translation layer, and the list of
conditions to separate is now complete.

**Phase 3.** Nothing changed for it. `src/device/health.ts` was not touched.

---

_Phase: 01-secure-cloud-foundation_
_Completed: 2026-08-29_

## Self-Check: PASSED

- All four modified source and test files exist on disk.
- All four commit hashes resolve: `6380e05`, `ba945e0`, `9848c01`, `2cbe227`.
- `git diff --stat` against the base commit lists those four files and no others.
