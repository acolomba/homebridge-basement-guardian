---
phase: 01-secure-cloud-foundation
plan: 14
subsystem: infra
tags: [mqtt, aws-iot, shadow, connection-lifecycle, backoff, deadline]

requires:
  - phase: 01-secure-cloud-foundation
    provides: "The shadow client, its transport adapter, and the capped retry policy (plans 01-08, 01-09, 01-10)"
  - phase: 01-secure-cloud-foundation
    provides: "A deterministic Cucumber gate (plan 01-12)"
provides:
  - "A connection lifecycle where each connection owns its own state and a superseded one drives nothing"
  - "A single disconnection notification per connection, raised when the client stops using it"
  - "An opener that refuses to run once shutdown has begun, so no connection can outlive close()"
  - "A connected report that means a shadow message can actually reach the store"
  - "Transport subscribe and publish that fail on a deadline instead of stalling, leaving no timer pending"
  - "A device identifier that would form an MQTT wildcard topic kept out of the subscription set"
affects: [01-13, 01-17, device-health, phase-5-resilience]

actuals:
  tokens: 17140
  tasks: 2
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Per-connection state record plus an identity predicate, replacing shared closure flags"
    - "Release-once ownership: the first end-of-ownership event reports, later ones find the connection released"
    - "Operation deadline built on node:timers/promises with an abort signal cancelling the loser"

key-files:
  created: []
  modified:
    - src/cloud/shadow.ts
    - src/cloud/mqttTransport.ts
    - test/cloud/shadow.test.ts
    - test/cloud/mqttTransport.test.ts

key-decisions:
  - "A connection is released at the earliest honest moment, so a transport error reports there rather than at the close that follows it; the close then finds the connection released and reports nothing"
  - "onDisconnected is suppressed during close(), because shutdown is not a fault and plan 01-17 owns the shutdown state"
  - "retry.reset() moved with the connected notification: a working socket with no subscription must not restore the first backoff step"
  - "The transport deadline is a required option supplied by the shadow client, not a transport default, so the operation budget stays visible where the connection policy lives"
  - "The deadline refusal is a plain Error with a fixed message; an exported error class reachable from no entry point would be flagged by the dead-code gate"

patterns-established:
  - "Identity guard: every transport notification is checked against the connection it came from before it reaches any state"
  - "Ownership release: one function ends the client's use of a connection and reports it exactly once"
  - "Untrusted identifiers are refused at the point the routing table is built, not escaped"

requirements-completed: [SYNC-04, SYNC-05]

coverage:
  - id: D1
    description: "A superseded connection drives no live state: a late close, error, connect, or message from a replaced connection changes nothing the current connection reports"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#stays connected when a connection it has replaced closes"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#schedules no reconnect when a connection it has replaced fails"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#ignores a connect notification from a connection it has replaced"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#routes no message arriving on a connection it has replaced"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#reports nothing when a subscription belonging to a replaced connection is refused"
        status: pass
    human_judgment: false
  - id: D2
    description: "Superseding a connection ends the one it replaces, and no connection can be opened after close()"
    requirement: SYNC-05
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#ends the connection it replaces when it opens the replacement"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#opens no connection when a reconnect wait elapses after shutdown"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#ends the transport once and schedules no reconnect when closed twice"
        status: pass
    human_judgment: false
  - id: D3
    description: "The client reports connected only once the subscription has resolved, so a socket with nothing on it cannot report a healthy combined path"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#reports nothing connected while the subscription of an open socket is unanswered"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#requests no shadow and gives up the connection when the subscription is refused"
        status: pass
      - kind: integration
        ref: "features/degradedOperation.feature#The combined path returns when the connection recovers"
        status: pass
    human_judgment: false
  - id: D4
    description: "A subscribe or publish callback that never fires becomes a refusal on a deadline, and the losing timer holds no handle open"
    requirement: SYNC-05
    verification:
      - kind: unit
        ref: "test/cloud/mqttTransport.test.ts#refuses a subscribe whose callback never fires once its deadline passes"
        status: pass
      - kind: unit
        ref: "test/cloud/mqttTransport.test.ts#refuses a publish whose callback never fires once its deadline passes"
        status: pass
      - kind: unit
        ref: "test/cloud/mqttTransport.test.ts#leaves no timer pending when a subscribe settles inside its deadline"
        status: pass
      - kind: unit
        ref: "test/cloud/mqttTransport.test.ts#leaves no timer pending when a publish settles inside its deadline"
        status: pass
    human_judgment: false
  - id: D5
    description: "A device identifier that would form a wildcard topic is left out of the routing table and the subscription list, and reported once without being quoted"
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#leaves a device identifier carrying a single-level wildcard out of the subscription and the routing table"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#leaves a device identifier carrying a multi-level wildcard out of the subscription and the routing table"
        status: pass
    human_judgment: false
  - id: D6
    description: "A daily provider-forced reconnect is still not reported as a fault"
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#reports a close with no preceding error at debug, as routine reconnection"
        status: pass
      - kind: integration
        ref: "features/shadowLifecycle.feature#A reconnect requests the complete shadow again"
        status: pass
    human_judgment: false

duration: 31min
completed: 2026-08-29
status: complete
---

# Phase 1 Plan 14: Shadow Connection Ownership Summary

**Each shadow connection now owns its own state behind an identity guard, is released and reported exactly once when the client stops using it, and can no longer be opened after shutdown; transport operations fail on a ten-second deadline instead of stalling.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-08-29T11:40:00Z
- **Completed:** 2026-08-29T12:11:13Z
- **Tasks:** 2
- **Files modified:** 4

## The onDisconnected contract this plan now guarantees

Plans 01-13 and 01-17 are written against this. Stated precisely:

**Once per connection, not once per event.** A connection is the record created by
one `openConnection` call. `options.onDisconnected(reason)` is called exactly once
for that connection, by `release`, at the moment the client stops using it.

**It fires when ownership ends, at the first of these three:**

| Event | Reason reported | Where |
|---|---|---|
| The transport raises an error under the connection | `transport-error` | `handleError` |
| The transport closes an established connection | `transport-closed` | `handleClose` |
| The transport closes before it ever established | `handshake-refused` | `handleClose` |
| The subscription or the full-shadow request is refused or times out | `subscription-refused` | `requestEveryShadow` catch |

**It does not fire:**

- **Twice for one connection.** `release` sets `released`, and `isCurrent` is false
  from then on, so the close that follows an error, and the close that `end()`
  itself produces after a refused subscription, both report nothing. Previously an
  error/close pair could produce two notifications in production.
- **For a connection the client has replaced.** Every handler checks
  `isCurrent(target)` first. A late close, error, connect, or message from a
  superseded connection is ignored.
- **During or after `close()`.** `closing` makes `isCurrent` false, so shutdown
  raises no disconnection at all. This is a deliberate change: shutdown is not a
  fault, and plan 01-17 owns the state that says monitoring has stopped. Before
  this plan, teardown emitted `transport-closed`, which would have moved
  `monitoringPath` back to `'rest-only'` from whatever 01-17 sets.

**A matching change in `onConnected`:** it is now raised after the subscription
resolves and the complete-shadow requests are published, not when the socket
opens. So the pairing a consumer sees is: `onConnected` means a shadow message can
reach the store; `onDisconnected` means it no longer can. A connection whose
subscription is refused reports `onDisconnected('subscription-refused')` with no
preceding `onConnected`.

**Timing note for 01-17:** the error path now reports at the error rather than at
the close that follows it. There is no longer a window where a failed connection
is superseded by a replacement before its close arrives, which was the case that
could have lost the notification entirely.

## Accomplishments

- **Gap 3 / CR-03 closed.** `live`, `established`, `failed`, and `transport` are
  gone as shared closure variables. Each connection carries a `ShadowConnection`
  record (`transport`, `established`, `live`, `released`), and `isCurrent(target)`
  gates all four transport notifications plus the post-await paths inside
  `requestEveryShadow`. The verifier's reproduction (a late close from superseded
  connection A flipping `connected` to false while B was live and subscribed) is
  now a passing regression test asserting the opposite.
- **Gap 5, shadow half / CR-05 item 1 closed.** `openConnection` returns early when
  `closing`. The verifier's second reproduction (a post-`close()` retry opening a
  transport nothing would end) is a passing test asserting one transport and one
  end. The memoized `ending` in `close()` is now sound *because* no transport can
  appear after it, and the comment says so.
- **Superseding ends what it replaces.** `openConnection` ends the previous
  transport before wiring the new one. Ending is memoized per adapter, so this is
  safe whether or not the connection had already gone down.
- **CR-03 consequence 3 closed.** `handleConnect` now only sets `established`. The
  `live` flag, `retry.reset()`, and `onConnected()` all moved behind the resolved
  subscription. A socket that is open with nothing subscribed can no longer report
  a healthy combined path.
- **WR-11 closed.** `MqttTransportOptions` gained a required `deadlineMs`, supplied
  by the shadow client as `OPERATION_DEADLINE_MS = 10_000`. `subscribe` and
  `publish` race the client callback against that deadline and reject on expiry,
  which routes into the existing catch that gives the connection up and retries.
  The losing wait is cancelled through an `AbortController`, asserted by comparing
  `process.getActiveResourcesInfo()` before and after a settled operation.
- **WR-14 item 2 closed.** `usableDevices` filters any identifier matching `/[+#]/`
  out of both the routing table and the device list, and reports it once at warn
  without quoting the identifier (it embeds the account identifier). The device
  keeps the poll as its source, and the message says so.
- **Routine reconnection still reads as routine.** A close on an established
  connection with no preceding error is still `transport-closed` at debug, and the
  two shadow-lifecycle scenarios still see one handshake then two across a forced
  reconnect.

## Task Commits

1. **Task 1 (tracer, TDD): A connection owns its own state, and superseding one ends it**
   - RED `6572e29` — `test(shadow)`: four verifier reproductions as failing cases
   - RED `ecfb28f` — `test(shadow)`: three more superseded-connection cases (late connect, late message, late subscription refusal)
   - GREEN `8f05d92` — `fix(shadow)`: per-connection record, identity guard, release-once, guarded opener
2. **Task 2 (TDD): Connected means a message can arrive, and a lost callback is a failure**
   - RED `e43275f` — `test(shadow)`: connected-means-subscribed and wildcard refusal
   - GREEN `1c82446` — `fix(shadow)`: notification moved behind the subscription; wildcard identifiers refused
   - `feaf07c` — `feat(mqtt)`: the operation deadline, with its tests in the same commit (see TDD Gate Compliance)

No REFACTOR commit: the GREEN implementations were written at their final shape and
the health gate (60-line units, cognitive complexity 15) passed without cleanup.

## Files Created/Modified

- `src/cloud/shadow.ts` — Per-connection `ShadowConnection` record, `isCurrent`
  identity predicate, `release` ownership-end reporter, `attach` guarded handler
  registration, shutdown-guarded `openConnection`, `usableDevices` wildcard
  refusal, `OPERATION_DEADLINE_MS`.
- `src/cloud/mqttTransport.ts` — Required `deadlineMs` option; `within` replaces
  `subscribeOnce`/`publishOnce`, racing the client callback against a cancellable
  deadline.
- `test/cloud/shadow.test.ts` — Transport double gained a holdable subscription;
  12 new cases and 2 updated expectations.
- `test/cloud/mqttTransport.test.ts` — Client double gained a withheld callback;
  6 new cases across subscribe and publish.

## Decisions Made

1. **Release at the earliest honest moment.** `handleError` releases and reports
   `transport-error` itself rather than setting a `failed` flag for the close to
   read. This removed the `failed` field entirely, collapses the mqtt.js
   error-then-close pair into one notification, and closes the race where a
   replacement could supersede a failed connection before its close arrived.
2. **Shutdown raises no disconnection.** Suppressing `onDisconnected` while
   `closing` keeps teardown from overwriting whatever terminal state plan 01-17
   sets. Called out here because it changes observable behavior.
3. **`retry.reset()` moved with the connected notification** — see deviations.
4. **`scheduleReconnect` lost its `closing` check.** Every caller now reaches it
   only by releasing a connection it still owned, which `closing` makes impossible,
   and the opener has its own guard. Keeping the check would have left a branch no
   test could reach, and the 100% branch requirement forbids unreachable branches.
5. **Plain `Error` for the deadline refusal, not an exported class.** An error class
   exported from `mqttTransport.ts` and reachable from no entry point risks the
   dead-code gate. The tests assert `instanceof Error` plus the complete message
   rather than a substring.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] `retry.reset()` moved behind the subscription**

- **Found during:** Task 2
- **Issue:** The plan named the `live` flag and the connected notification as the
  two things to move behind the resolved subscription. `options.retry.reset()` sat
  between them in `handleConnect`. Leaving it there means a broker that accepts
  sockets but never answers `subscribe` resets the backoff on every attempt, so the
  new deadline would produce a fixed ~10.5-second retry loop against the vendor
  forever instead of backing off to the 30-second ceiling. That is a hot loop
  against a third party, created by this plan's own deadline.
- **Fix:** `retry.reset()` moved into `requestEveryShadow`'s success path alongside
  `target.live = true` and `options.onConnected()`. Reset now means "this
  connection is genuinely working", which is the same meaning as connected.
- **Files modified:** `src/cloud/shadow.ts`
- **Verification:** `test/cloud/shadow.test.ts#restores the first backoff step after
  a connection succeeds` and `#reconnects through the guarded policy after a refused
  subscription` both still pass; the full suite and Cucumber are green.
- **Committed in:** `1c82446`

**2. [Rule 1 - Bug] The `failed` flag removed rather than carried per connection**

- **Found during:** Task 1
- **Issue:** With the error path releasing the connection directly, nothing read
  `failed` any more. Carrying it as unread per-connection state would have been
  dead state in the very record the plan asked to make honest.
- **Fix:** Removed; `handleClose` now distinguishes only `transport-closed` from
  `handshake-refused`, which is the socket-level question it was always asking.
- **Files modified:** `src/cloud/shadow.ts`
- **Verification:** `#reports a close that follows an error apart from a routine
  one` and `#makes one reconnect attempt for the error and the close reporting a
  single failure` both still pass unchanged.
- **Committed in:** `8f05d92`

**3. [Rule 3 - Blocking] The plan's Task 1 verification command as written finds no tests**

- **Found during:** Task 1
- **Issue:** `npm run test:coverage:direct -- "dist-test/src/cloud/shadow.js"` passes
  the source path to `--test-coverage-include` and leaves node with no test path, so
  the runner globs the repository and fails on unbuilt `test/**/*.ts` imports.
- **Fix:** Ran it with the test path appended:
  `npm run test:coverage:direct -- "dist-test/src/cloud/shadow.js" "dist-test/test/cloud/shadow.test.js"`.
  No file changed; recording it so the next reader of the plan does not repeat it.
- **Verification:** Reports 100.00 / 100.00 / 100.00 for `shadow.js`.
- **Committed in:** n/a (command usage only)

---

**Total deviations:** 3 auto-fixed (1 × Rule 1, 1 × Rule 2, 1 × Rule 3)
**Impact on plan:** All three follow directly from the plan's own changes. No scope
creep: nothing outside the four declared `files_modified` was touched, and
`src/runtime/accountRuntime.ts` was read but not modified.

## TDD Gate Compliance

Task 1 and Task 2's shadow half both ran a clean RED → GREEN cycle with the RED
committed separately (`6572e29`, `ecfb28f` → `8f05d92`; `e43275f` → `1c82446`).

The transport deadline in `feaf07c` carries its tests and its implementation in one
commit. RED was observed before implementing — `npm run build:test` failed with
`TS2353: 'deadlineMs' does not exist in type 'MqttTransportOptions'` on both test
files — but that RED could not be *committed* on its own: `deadlineMs` is a new
required option, so the tests do not typecheck until the option exists, and
`CLAUDE.md` requires `pre-commit` (which runs `npm run typecheck`) to pass before
every commit and forbids `--no-verify`. Splitting it would have required either a
commit that fails the mandatory gate or a test that hangs forever against the
unimplemented deadline, since `node --test` has no default timeout. The RED
observation is recorded here in place of a commit.

## Issues Encountered

- **The `fix-unicode-dashes` pre-commit hook rewrote an em dash in a new comment.**
  Rather than accept the mechanical `--` substitution, the sentence was rewritten
  without the dash, which also matches the surrounding comment style and the
  project's `humanizer` guidance.
- **TruffleHog's git-mode scan cannot run from a linked worktree**, exactly as
  `CLAUDE.md` documents. Every commit was preceded by the documented filesystem
  route (`trufflehog filesystem <changed paths> --results=verified,unknown --fail`),
  clean each time with `verified_secrets: 0` and `unverified_secrets: 0`, and only
  then committed with `SKIP=trufflehog`. No other hook was skipped.
- **The worktree has no `node_modules`.** It was symlinked from the main checkout
  for the duration and removed before returning. No package was installed, added,
  or upgraded (T-01-68).

## Verification Results

| Gate | Result |
|---|---|
| `npm run check` | exit 0 |
| `npm run test:unit` | 404 tests, 404 pass, 0 fail (was 394 at the wave base; 10 added, none removed) |
| `npm run test:cucumber` | 32 scenarios / 266 steps, 4 consecutive runs, exit 0 each (~10.5s) |
| `test:coverage:direct` on `src/cloud/shadow.ts` | 100.00 lines / 100.00 branches / 100.00 functions |
| `test:coverage:direct` on `src/cloud/mqttTransport.ts` | 100.00 lines / 100.00 branches / 100.00 functions |
| `fallow dead-code` | 0 issues |
| `fallow health` | 0 above threshold, maintainability 92.8 |
| `fallow dupes` | 0% |
| Process exits promptly after `test:unit` | yes — no timer left pending by the deadline |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for plan 01-17 (next wave).** The `onDisconnected` contract above is the
thing 01-17's shutdown scenario and its `attemptShadow` assign-after-await fix are
written on top of. Two points 01-17 should know:

1. Shutdown now raises no `onDisconnected`. If 01-17 wants `monitoringPath` to move
   to a terminal state at `stop()`, it must set it there; nothing from the shadow
   client will overwrite it afterwards.
2. `handleShadowConnected` is now called later than it used to be — after the
   subscription resolves rather than at the socket handshake. `path =
   'rest-and-shadow'` therefore means the plugin can actually receive shadow
   messages, which is what `health.ts` needs it to mean.

**Ready for plan 01-13 (wave 3).** `releaseShadowSource` can rely on exactly one
`onDisconnected` per connection, and on `client.connected` being false from the
moment ownership ends.

**Out of scope, still open (not this plan's gaps):** CR-05 item 2 (the
`attemptShadow` assign-after-await window in `src/runtime/accountRuntime.ts`) is
01-17's. WR-14 item 3 (a `get/rejected` marks no device untrustworthy) and WR-15
(`requestFullShadow` is dead production surface) were both read and deliberately
left alone; neither is in this plan's `files_modified` scope or its must-haves.

---

_Phase: 01-secure-cloud-foundation_
_Completed: 2026-08-29_

## Self-Check: PASSED

All five files exist on disk and all six commit hashes are present in `git log`.
