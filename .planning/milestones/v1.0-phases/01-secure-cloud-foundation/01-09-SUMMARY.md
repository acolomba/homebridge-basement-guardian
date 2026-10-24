---
phase: 01-secure-cloud-foundation
plan: 09
subsystem: cloud-transport
tags: [aws-iot, mqtt, device-shadow, sigv4, reconnect, credential-rotation, tdd]

requires:
  - phase: "01-03"
    provides: "ReportedPatch and applyReportedPatch, the merge target this layer produces for"
  - phase: "01-06"
    provides: "src/cloud/types.ts isRecord, the shared narrowing primitive, and the AwsCredentials shape"
  - phase: "01-07"
    provides: "presignIotWebsocketUrl and createRetryPolicy, the signer and the capped reconnect policy"
provides:
  - "`createMqttTransport` and `MqttTransport`, a consumer-declared port over the client library, proven assignable from the real `mqtt.connect`"
  - "`MqttClientLike`, `MqttClientIdentity`, `MqttClientEvents`, `MqttConnect`, `MqttConnectOptions`, `MqttTransportOptions`"
  - "`createShadowClient` and `ShadowClient`, one connection serving every device shadow through a closed topic set"
  - "`SHADOW_TOPICS`, `ShadowCredentials`, `CredentialCache`, `ShadowClientOptions`"
  - "Two transitional `.fallowrc.json` ignoreFindings entries, both measured to be inert and both required by the plan set"
affects: [01-10, 01-11, account-runtime, shadow-client]

actuals:
  tokens: 12200
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "The client port is declared by the consumer and verified assignable from the real library with a throwaway probe, rather than assumed"
    - "The routing table and the subscription list are one map, so a topic that cannot be routed cannot be subscribed to"
    - "Requested state is excluded structurally: the patch type has no member able to hold it, so there is no filter to forget"
    - "Rotation refreshes a cache the next handshake reads; nothing observes the change and nothing touches the live socket"
    - "A declaration cycle between a handler, a schedule, and an opener is broken by passing the opener as a parameter"

key-files:
  created:
    - src/cloud/mqttTransport.ts
    - src/cloud/shadow.ts
    - test/cloud/mqttTransport.test.ts
    - test/cloud/shadow.test.ts
  modified:
    - .fallowrc.json

key-decisions:
  - "`MqttConnect` returns a consumer-declared `MqttClientLike` rather than `unknown`, because `unknown` would force a type assertion the style guide restricts"
  - "The port's event registration is written as four overloads rather than one generic signature, because a narrower generic constraint is measurably not assignable from the library's own generic `on`"
  - "Message routing is a map keyed by the subscribed topics rather than a topic parser, because a parser ships branches the 100 percent branch gate cannot reach"
  - "The shadow test drives the real `createRetryPolicy`, because the one-retry-per-failure property lives in that policy's pending guard and a hand-written fake would re-implement it"
  - "A refused post-connect subscription is logged and not recovered from, because whether a degraded shadow path falls back to polling is the account runtime's decision"

patterns-established:
  - "Verify a consumer-declared port against the real library with a temporary probe file that is type-checked and deleted, never committed"
  - "Assert a signed URL by its stable parts — origin, path, credential scope, security token, signature length — so the case discriminates the inputs without recomputing the signature"
  - "Data-driven absence rows: one case per forbidden token, each asserting the reported reason contains none of it"

requirements-completed: [SYNC-02, SYNC-03, SYNC-04]

coverage:
  - id: D1
    description: "One connection serves every device shadow, subscribing per device to exactly the three subscribable topics and to no wildcard"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#subscribes once to the three subscribable topics of every device and to nothing else"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#exposes the get, get-accepted, get-rejected, and update-accepted helpers and no others"
        status: pass
    human_judgment: false
  - id: D2
    description: "A complete shadow is requested after the first connection and again after every reconnect"
    requirement: SYNC-03
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#requests a complete shadow for every device once the subscription succeeds"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#re-subscribes and re-requests every shadow after a reconnect"
        status: pass
    human_judgment: false
  - id: D3
    description: "Requested state never becomes canonical state: no delta subscription exists and the patch has no member able to carry it"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#leaves a requested state section nowhere in the produced patch"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#ignores a message arriving on the delta topic"
        status: pass
    human_judgment: false
  - id: D4
    description: "The reported telemetry and the reported device metadata land in their own halves, and a full shadow and a partial update take one path"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#turns an update-accepted reported data section into a patch carrying the document version"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#puts a reported state section in the metadata half and leaves the telemetry half absent"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#takes a get-accepted full shadow down the same path as a partial update"
        status: pass
    human_judgment: false
  - id: D5
    description: "A rejection and a malformed payload each produce no state, report once, and raise nothing"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#reports a rejected shadow request at warn and produces no patch"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#discards a message whose payload is not json, with one debug report and no patch"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#discards a message whose payload carries a state section that is not an object, with one debug report and no patch"
        status: pass
    human_judgment: false
  - id: D6
    description: "Refreshing the credential cache disturbs neither the signer nor the live connection, and the next handshake reads the fresh value and the new client identifier"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#leaves the live connection alone when the cached credentials are replaced"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#signs the next handshake from the freshly cached credentials and the new client identifier"
        status: pass
      - kind: unit
        ref: "test/cloud/mqttTransport.test.ts#hands the live client to the signer, so the refreshed identifier reaches the handshake"
        status: pass
    human_judgment: false
  - id: D7
    description: "Reconnect goes through the capped, guarded policy, so one failure produces one retry chain and the library's own timer is disabled"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#makes one reconnect attempt for the error and the close reporting a single failure"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#restores the first backoff step after a connection succeeds"
        status: pass
      - kind: unit
        ref: "test/cloud/mqttTransport.test.ts#disables the library reconnect timer and asks for a clean, resubscribing session"
        status: pass
    human_judgment: false
  - id: D8
    description: "A close with no preceding error is reported as routine reconnection at debug, not as a fault"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#reports a close with no preceding error at debug, as routine reconnection"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#reports a close that follows an error at warn rather than as routine"
        status: pass
    human_judgment: false
  - id: D9
    description: "The reason reported outward carries neither the URL nor any credential field name"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#keeps broker.invalid out of the reason reported to the disconnect handler"
        status: pass
      - kind: unit
        ref: "test/cloud/shadow.test.ts#keeps test-session-token out of the reason reported to the disconnect handler"
        status: pass
    human_judgment: false
  - id: D10
    description: "Teardown cannot schedule a reconnect, and a repeated close ends the transport once"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/shadow.test.ts#ends the transport once and schedules no reconnect when closed twice"
        status: pass
      - kind: unit
        ref: "test/cloud/mqttTransport.test.ts#ends the client once and resolves both times when ended twice"
        status: pass
    human_judgment: false
  - id: D11
    description: "The consumer-declared port is faithful: the real mqtt.connect satisfies MqttConnect and the real client satisfies MqttClientLike"
    verification:
      - kind: other
        ref: "temporary probe file type-checked against mqtt 5.15.2 with the project compiler options: the generic form failed, the overloaded form passed, probe deleted"
        status: pass
    human_judgment: false
  - id: D12
    description: "Both new modules carry a transitional ignoreFindings entry and the eight scaffold entries are untouched"
    verification:
      - kind: other
        ref: "the plan's node -e ignoreFindings assertion, exit 0"
        status: pass
      - kind: other
        ref: "npm run fallow: dead-code, health, and dupes all --fail-on-issues, exit 0"
        status: pass
    human_judgment: false
  - id: D13
    description: "No credential material, signed URL, real endpoint, or real device identifier reaches a committed file"
    verification:
      - kind: other
        ref: "trufflehog filesystem scan over every committed path, --results=verified,unknown: verified_secrets 0, unverified_secrets 0 on all six commits"
        status: pass
    human_judgment: false

duration: 35 min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 09: Shadow Transport and Reconnect Lifecycle Summary

**A narrow client port proven against the real library, one connection serving every device shadow through a four-topic surface, and a reconnect owned by the capped retry policy rather than by the transport.**

## Performance

- **Duration:** 35 min
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- The transport library now sits behind a port this project declares. That port is not assumed to
  fit: a throwaway probe type-checked the real `mqtt.connect` and the real client against it. The
  first shape failed, the second passed, and the probe was deleted. Plan 10 therefore wires a port
  that is known to accept the real library rather than one that only looks right.
- The shadow surface is four topic helpers. There is no delta helper and no update-publish helper,
  and a test asserts the exported key set, so adding either fails the suite rather than passing
  review.
- The routing table and the subscription list are the same map. A topic that cannot be routed cannot
  be subscribed to, and a topic that was never subscribed to cannot be routed. The wildcard the
  provider warns against and the delta topic that carries requested state are both excluded by
  construction.
- Requested state has no path into the store. `ReportedPatch` has no member able to hold it, so a
  document carrying a `desired` section produces a patch whose whole value is
  `{ data: undefined, state: undefined, version: 7 }` — asserted as a whole object, so an extra key
  would fail.
- Rotation is doing nothing, correctly. Replacing what the credential cache returns invokes no
  signer, ends no transport, and opens no connection; the next handshake reads the fresh value and
  the new client identifier. Both halves are asserted.
- One transport failure produces one reconnect. The error and the close notification both route into
  one `retry.schedule` call and the policy's pending guard collapses them, proven end to end against
  the real policy under faked timers.
- The daily reconnect reads as routine. A close with no preceding error is reported at debug with a
  message about reconnection; only a close that follows an error is reported at warn.
- Nothing reports a URL, a payload, a topic, or a device identifier outward. Seven data rows assert
  that the reason string handed to the disconnect callback contains none of the host, the scheme
  prefix, the session token, or any credential field name — driven by a transport error whose own
  message carries all of them.

## Task Commits

1. **Task 1: the narrow transport port and the adapter over the client library**
   - `c5a3c6e` (test) — thirteen failing cases, the compiling skeleton, and the ignore entry
   - `4029207` (feat) — fixed connect options, the transform hook, and the three promisified verbs
2. **Task 2: the closed shadow topic set routed into reported patches**
   - `aabc10e` (test) — twenty-five failing cases, the skeleton, and the ignore entry
   - `989ed7e` (feat) — the route map, the payload predicate, the patch builder, the signing closure
3. **Task 3: the credential cache feeding each handshake, and the reconnect**
   - `f1a747b` (test) — eighteen further failing cases for the lifecycle
   - `3160e59` (feat) — the guarded reconnect, the routine-close report, and the idempotent close

No refactor commit was needed for any task.

## Files Created/Modified

- `src/cloud/mqttTransport.ts` — The consumer-declared client port, the fixed connect options, the
  URL-transform hook, and promisified subscribe, publish, and end.
- `src/cloud/shadow.ts` — `SHADOW_TOPICS`, the route map, the payload predicate, the patch builder,
  the signing closure, and the connection lifecycle.
- `test/cloud/mqttTransport.test.ts` — Thirteen cases; 100 percent lines, branches, and functions.
- `test/cloud/shadow.test.ts` — Forty-three cases; 100 percent lines, branches, and functions.
- `.fallowrc.json` — Two transitional `ignoreFindings` entries appended after the two plan 07 added.
  `ignoreDependencies` and `ignorePatterns` untouched.

## Decisions Made

- **`MqttConnect` returns `MqttClientLike`, not `unknown`.** The plan's sketch returns `unknown`,
  which would force the adapter to assert its way back to a usable type. The style guide restricts
  `as` to cases with a stated local reason, and a port the consumer declares is the honest way to say
  what the adapter needs. The acceptance criterion is still met: no type from the client library
  appears in an exported signature.
- **The port's `on` is four overloads, not one generic signature.** This was measured. A generic
  `on<Event extends keyof MqttClientEvents>` is *not* assignable from the library's own
  `on<TEvent extends keyof MqttClientEventCallbacks>`; the compiler reports that
  `MqttClientEvents` is missing `packetsend`, `packetreceive`, `disconnect`, `end`, and three more.
  The overloaded form is assignable. Had this gone uncorrected, plan 10 would have discovered it at
  the moment it first imported `mqtt`.
- **Message routing is a lookup, not a parse.** The plan asks for a topic parser that extracts the
  device identifier from the middle segment. A parser has to defend against a match whose capture
  groups are absent, and those branches cannot be reached once the pattern has matched — which the
  100 percent branch gate rejects. Building one `Map` from the device list, and subscribing to that
  map's keys, removes the failure mode instead of guarding it: the subscribed set and the routable
  set are one object.
- **The shadow test uses the real retry policy.** The requirement is that one failure produces one
  retry chain, and the mechanism that delivers it is the policy's pending guard. A hand-written fake
  policy would have to re-implement that guard, at which point the test would prove the fake works.
  The policy is pure and takes faked timers, so using it costs nothing.
- **A refused post-connect subscription is reported and not recovered from.** Catching the rejection
  is required — an unhandled rejection in a message-driven module surfaces in the Homebridge
  process — but recovery policy is not this module's to make. See "Deferred Items".
- **The module headers name the wiring commit, not a plan number.** `.claude/rules/typescript-comments.md`
  forbids planning-artifact references in source comments, and a repository rule outranks the plan's
  acceptance wording. Each header states the same fact by its condition. This matches what plan 07
  did for the same reason.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The declared port was not assignable from the real client library**

- **Found during:** Task 1
- **Issue:** `MqttConnect` as sketched returns `unknown`, and the first port shape declared a generic
  event registration. Nothing in this plan imports `mqtt`, so neither problem would surface here —
  both would surface in plan 10, as a type error at the composition root.
- **Fix:** `MqttConnect` returns a consumer-declared `MqttClientLike`; the event registration became
  four overloads. Verified with a temporary probe file compiled against `mqtt` 5.15.2 under the
  project's compiler options, which failed on the generic form and passed on the overloaded one. The
  probe was deleted and never staged.
- **Files modified:** `src/cloud/mqttTransport.ts`
- **Verification:** `npx tsc --noEmit` on the probe, exit 0; `git status` clean of the probe.
- **Committed in:** `c5a3c6e`, `4029207`

**2. [Rule 3 - Blocking] The module headers may not name a plan**

- **Found during:** Tasks 1 and 2
- **Issue:** Both acceptance criteria ask each module header to name plan 10 as the plan that removes
  the ignore entry. The repository comment policy forbids `Plan NN` in source comments.
- **Fix:** Each header states the condition instead: the entry and the note are removed together, in
  the commit that wires the shadow client into the account runtime and makes the module reachable.
  Plan 10's own check is a removal check, so it is unaffected.
- **Files modified:** `src/cloud/mqttTransport.ts`, `src/cloud/shadow.ts`
- **Verification:** `pre-commit run --files ...` clean; no planning artifact named in either header.
- **Committed in:** `c5a3c6e`, `aabc10e`

**3. [Rule 2 - Missing Critical] The topic parser was replaced by a route map**

- **Found during:** Task 2
- **Issue:** A parser that matches the three subscribable forms must still handle a matched pattern
  whose device-identifier group is absent. That branch is unreachable, and the plan requires 100
  percent branch coverage for the pair.
- **Fix:** One `Map<string, ShadowRoute>` is built from the device list and the subscription list is
  its key set. Routing is a lookup; an unrouted topic returns `undefined` and is ignored. Every
  behavior the plan names is still asserted, including the underscore-bearing device identifier and
  the ignored delta topic.
- **Files modified:** `src/cloud/shadow.ts`
- **Verification:** 100 percent lines, branches, and functions for the pair run alone.
- **Committed in:** `989ed7e`

**4. [Rule 3 - Blocking] A declaration cycle between the close handler, the schedule, and the opener**

- **Found during:** Task 3
- **Issue:** `openConnection` registers `handleClose`, `handleClose` calls `scheduleReconnect`, and
  `scheduleReconnect` calls `openConnection`. `@typescript-eslint/no-use-before-define` rejects the
  cycle whichever order the three are written in.
- **Fix:** The reopener is a parameter of `scheduleReconnect`, `handleError`, and `handleClose`, and
  `openConnection` passes itself. The three named units the plan asks for are preserved, and the
  parameter names the one thing a retry does.
- **Files modified:** `src/cloud/shadow.ts`
- **Verification:** `npx eslint --max-warnings=0` clean on all four files.
- **Committed in:** `3160e59`

**5. [Rule 2 - Missing Critical] The post-connect subscription needed a rejection path**

- **Found during:** Task 2
- **Issue:** The plan specifies the success path only. An unhandled rejection from the subscribe or
  publish chain would surface as an unhandled rejection in the Homebridge process, which is the same
  failure the plan forbids for the message handler.
- **Fix:** The chain is wrapped and a failure reports once at debug. Recovery is deliberately not
  attempted here; see "Deferred Items".
- **Files modified:** `src/cloud/shadow.ts`
- **Verification:** `test/cloud/shadow.test.ts#requests no shadow and reports at debug when the
  subscription is refused`.
- **Committed in:** `989ed7e`

**6. [Rule 3 - Blocking] The signing closure needed a case in task 2**

- **Found during:** Task 2
- **Issue:** The transport cannot be constructed without a `signUrl`, so the signing closure had to
  exist in task 2, but the fake transport never invokes it, leaving the closure uncovered and the
  task's own coverage gate failing.
- **Fix:** One case drives the signer through the recorded transport options and asserts the URL's
  stable parts plus the refreshed identifier. Task 3's cases then cover rotation and reconnect.
- **Files modified:** `test/cloud/shadow.test.ts`
- **Verification:** 100 percent for the pair at the task 2 commit.
- **Committed in:** `989ed7e`

**7. [Rule 1 - Bug] The backoff-reset expectation was off by one**

- **Found during:** Task 3
- **Issue:** The case expected `retry.attempt` to read 1 after a successful connection reset the
  policy. `reset()` sets it to 0, and `nextDelayMs()` — evaluated later in the same literal — moves
  it to 1.
- **Fix:** The expectation reads `{ attempt: 0, delayMs: 500 }`, which still discriminates: without
  the reset the values would be 1 and 1000.
- **Files modified:** `test/cloud/shadow.test.ts`
- **Verification:** the case passes and fails if `retry.reset()` is removed.
- **Committed in:** `3160e59`

______________________________________________________________________

**Total deviations:** 7 auto-fixed (4 blocking, 2 missing critical, 1 bug).
**Impact on plan:** No scope change and no acceptance criterion weakened. One published contract
differs from the plan's sketch — `MqttConnect` returns `MqttClientLike` — and that difference is the
one that keeps plan 10 compiling. Two deviations resolve a conflict between the plan text and a
binding repository rule; two are the coverage and rejection-handling the plan's own gates require.

## Issues Encountered

- **Both new `ignoreFindings` entries are inert.** Measured, not assumed. `fallow dead-code` passes
  with neither entry present, and with both present it names them in its
  `ignoreFindings patterns matched no finding this run` note alongside the eight scaffolds. The
  reason is visible in plan 07's measurement: the gate reports an unconsumed *value* export, and the
  only value exports these two modules publish — `createMqttTransport`, `createShadowClient`, and
  `SHADOW_TOPICS` — are all imported by their mirrored tests. The `sigv4.ts` and `retryPolicy.ts`
  entries remain load-bearing and are still absent from that note. Both entries were added anyway:
  the plan set requires all four, plan 03's check permits exactly these paths, and plan 10 asserts
  their removal.
- **The trufflehog hook cannot run in a linked worktree.** It aborts with `failed to read index
  file`, exactly as `CLAUDE.md` documents. Every commit ran `pre-commit run --files <changed files>`
  first, then a filesystem scan over the same paths with `--results=verified,unknown --fail`, which
  reported zero verified and zero unverified findings each time. Only then was `SKIP=trufflehog`
  used, never extended to another hook, and `--no-verify` was never used.
- **The unicode-dash hook rewrote two em dashes in a module header.** The hook changed the file after
  staging, so the commit was re-staged and the hooks re-run to a clean pass rather than amended.
- **Seven cases pass against the RED skeleton.** The reason-string absence rows hold trivially while
  nothing calls the disconnect callback. They exist to discriminate a *leaky* reason string, and they
  became discriminating in GREEN; the cases that discriminate the lifecycle itself all failed in RED.
- **`node_modules` is absent from the worktree.** Resolution falls through to the parent repository,
  so every script runs. `fallow` prints its `node_modules directory not found` warning and passes,
  matching every prior plan in this phase.

## TDD Gate Compliance

All three tasks ran RED then GREEN. `test(01-09)` precedes `feat(01-09)` in every pair. No `refactor`
commit was needed, because no implementation had an obvious cleanup left after GREEN.

## Threat Flags

None. Neither module opens a network path this phase had not already declared, and no new trust
boundary appears. The registered mitigations were implemented as specified: the delta topic is
absent from the routing map (T-01-45), every payload is parsed from `unknown` (T-01-46), the client
identifier is refreshed inside the signing hook (T-01-47), the error and close notifications share
one guarded schedule (T-01-48), the outward reason carries a classification only (T-01-49), a
routine close reports at debug (T-01-50), and the closing flag is set before the transport is ended
(T-01-51).

## Known Stubs

- **A refused post-connect subscription is reported and not recovered from.** `src/cloud/shadow.ts`,
  the `requestEveryShadow` catch. The connection stays open and `connected` still reads `true`, but
  no shadow message will arrive. This is intentional for this plan: the client owns transport, and
  the plan states that whether a failed shadow path degrades the runtime to polling is the account
  runtime's decision. It does not block this plan's goal — every path that produces state is covered
  — but plan 10 should decide the recovery.

## Deferred Items

- **Decide the recovery for a refused subscription.** Plan 10 owns the degraded-path policy. The
  cheapest correct option is to route that failure into the same guarded reconnect the transport
  notifications use; the guard already prevents a doubled chain. Doing it here would have left a
  second live transport with no owner, which is why it was not done blind.
- **Confirm the heartbeat topic against hardware.** The plan records this assumption and it is
  unchanged: if the vendor publishes device updates on the documents topic rather than
  update-accepted, the subscription set is wrong and no heartbeat arrives. Only a real-hardware
  scenario can settle it.
- **Retire all four transitional `ignoreFindings` entries.** Plan 10 removes them in the commit that
  wires the shadow client into the account runtime. Two of the four are currently inert and two are
  load-bearing; the removal is correct for all four either way.

## User Setup Required

None.

## Verification

Re-run at the end of the plan, all from the worktree:

- `node --test dist-test/test/cloud/mqttTransport.test.js` — 13 pass, 0 fail.
- `node --test dist-test/test/cloud/shadow.test.js` — 43 pass, 0 fail.
- `npm run test:coverage:direct` — 100 percent lines, branches, and functions for each pair alone.
- `npm run typecheck` clean; the four changed files pass `npx eslint --max-warnings=0` and
  `npx prettier --check`.
- `npm run fallow` exits 0 across dead-code, health, and dupes; `fallow dupes` reports no
  duplication.
- The plan's `node -e` `.fallowrc.json` assertion exits 0: no duplicate entry, all four transitional
  paths present, the eight scaffolds still leading the list in their established order, and no
  unexpected entry.
- `npm run check` exits 0 end to end: type check, lint, all three `fallow` sub-commands, format
  check, **322 unit tests** (up from 266), and **10 Cucumber scenarios over 61 steps**.

## Next Phase Readiness

Plan 10 can construct both modules directly. Three contract notes:

- `ShadowClientOptions` requires `createTransport` and `connect` as separate members. `createTransport`
  is `createMqttTransport`; `connect` is the library's `mqtt.connect`, which is assignable to
  `MqttConnect` as verified above.
- `ShadowClientOptions.retry` should be a `RetryPolicy` created for the shadow connection alone. Plan
  10's `AccountRuntimeOptions` carries a single `retry`; sharing one instance between the poll path
  and the shadow reconnect would let one path's pending guard swallow the other's retry.
- `ShadowClient` exposes `connected`, `start`, `requestFullShadow`, and `close`. Reconnect needs no
  caller: the client owns it. Rotation needs no caller either — refreshing what `CredentialCache.current()`
  returns is the whole of it.

## Self-Check: PASSED

- All four created files exist on disk, and `.fallowrc.json` carries both new entries.
- All six commits are present in `git log`.
- Every task `<acceptance_criteria>` was re-run and passes, including the port-assignability probe
  and the `.fallowrc.json` assertion.
- The plan-level `<verification>` block was re-run in full, and `npm run check` exits 0.
- No skipped test and no unrun verification step remains. One known stub is recorded above with the
  reason it is intentional and the plan that owns it.
- `STATE.md` and `ROADMAP.md` were deliberately left untouched; the orchestrator owns them after the
  wave merges.

---

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-28*
