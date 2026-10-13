---
phase: 01-secure-cloud-foundation
plan: 10
subsystem: account-runtime
tags: [credential-rotation, polling, degraded-path, lifecycle, composition-root, redaction, tdd]
status: complete

requires:
  - phase: "01-03"
    provides: "DeviceStateStore, the synchronous per-device merge both sources land through"
  - phase: "01-04"
    provides: "RedactingLogger and registerSecret, the seam this plan finally feeds"
  - phase: "01-05"
    provides: "AuthClient and the three terminal authentication errors this plan routes apart"
  - phase: "01-06"
    provides: "CloudApi, the typed devices and credentials routes"
  - phase: "01-07"
    provides: "createRetryPolicy, the capped backoff shape, and presignIotWebsocketUrl"
  - phase: "01-09"
    provides: "createShadowClient and createMqttTransport, the transport this plan wires and owns the degraded policy for"
provides:
  - "`createFailureLog` and `FailureLog`, the rate-limited transient-failure discipline D-14 describes, reminder cadence included"
  - "`createAccountRuntime`, with the rotation loop, the poll backstop, the degraded monitoring path, and one abortable stop"
  - "`createAccountRuntimeFromConfig`, the single composition seam, with protocol constants injected"
  - "`MonitoringPath`, the first runtime signal that distinguishes a degraded monitoring path from a device-reported disconnection"
  - "A `.fallowrc.json` carrying only the eight D-17 scaffold entries; every transitional transport entry is retired"
affects: [01-11, 02, 05, account-runtime, cloud-transport]

actuals:
  tokens: 71000
  tasks: 3
  commits: 7

tech-stack:
  added: []
  patterns:
    - "A long-running activity is a loop over an abortable wait, not a self-rearming callback: the loop keeps the next attempt scheduled however the last one ended"
    - "One injected `createRetry` builds every policy, so 'two instances, never one' is structural rather than a comment"
    - "A pending retry chain owns reconnecting; other callers check the flag and stand down instead of competing"
    - "A declaration cycle between two mutually recursive units is broken by making one return its outcome rather than calling back"
    - "Credential material is registered with the redacting logger at the moment it arrives, once per distinct value"

key-files:
  created:
    - src/runtime/failureLog.ts
    - test/runtime/failureLog.test.ts
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - src/platform.ts
    - test/platform.test.ts
    - src/cloud/shadow.ts
    - test/cloud/shadow.test.ts
    - src/cloud/auth.ts
    - test/cloud/auth.test.ts
    - src/cloud/mqttTransport.ts
    - src/cloud/sigv4.ts
    - src/runtime/retryPolicy.ts
    - .fallowrc.json

key-decisions:
  - "A refused shadow subscription now gives up the connection and retries through the guarded policy, because a socket that reads as connected while no message can arrive is the false-normal this project exists to prevent"
  - "The rotation and poll timers are `while` loops over an abortable wait rather than the plan's self-rearming `finally`, because a loop cannot be deleted the way a `finally` can"
  - "`AccountRuntimeOptions` takes `createRetry` rather than one or two `RetryPolicy` members, so two instances are built by construction and the root signal stays owned by the runtime"
  - "The shadow factory port is narrowed to what the runtime owns; scheme, region, transport, and connect belong to the seam"
  - "`IOT_SERVICE_NAME` was un-exported rather than suppressed: it had no consumer outside its own module, not even a test"
  - "A shadow disconnection changes only the monitoring path and logs nothing at warn, so the daily reconnect the provider ceiling forces is never reported as a fault"
  - "The auth client gained a narrow `registerSecret` port rather than taking the whole `RedactingLogger`"

patterns-established:
  - "Drive an hour of behavior by advancing an injected clock alongside the runner's fake timers, so a cadence test runs instantly and deterministically"
  - "Prove a re-entrancy guard by making its effect observable at the seam (no competing attempt) rather than counting internal calls"

requirements-completed: [CONF-05, AUTH-01, SYNC-03, SYNC-04, SYNC-05]

metrics:
  duration: ~40 minutes
  completed: 2026-08-28
---

# Phase 01 Plan 10: Account Runtime Summary

The account runtime now keeps its own credentials fresh, polls as a reconciliation backstop, degrades to polling alone without pretending it is healthy, and releases everything on shutdown through one abortable lifecycle.

## What Was Built

**`src/runtime/failureLog.ts`** holds the whole `D-14` discipline in about thirty lines and owns no timer. The first failure of a kind warns with the supplied reason, consecutive repeats drop to debug, a reminder warns again every fifteen minutes while the kind is still failing, and a recovery says so once at info. Each kind carries its own state, so a failing poll and a failing rotation do not share a counter. A simulated hour of thirty-second failures produces four warnings rather than a hundred and twenty.

**`src/runtime/accountRuntime.ts`** gained the rotation loop, the poll backstop, the shadow wiring, the degraded path, and the composition seam.

- Credentials refresh ten minutes before the expiry the response carries, and the next refresh is scheduled from the **new** expiry. A response already inside the lead window falls to a thirty-second floor, and an expiry that does not parse as a date also falls to that floor rather than arming a timer with `NaN`.
- Rotation replaces the cache the next handshake reads. It does not end or reconnect the live connection, because nothing re-signs an established socket.
- The REST poll runs at the configured interval. A failed poll changes no stored snapshot, leaves connectivity exactly where the last successful response set it, and schedules the next poll.
- A refused shadow connection leaves the runtime up on `rest-only`, reports the degraded path once, and retries on capped backoff. A later success restores `rest-and-shadow` and announces the recovery once.
- An explicit credential rejection schedules nothing at all. A throttling response waits the long interval the error carries rather than the capped backoff.
- `stop()` aborts the root controller, then closes the connection. It resolves however many times it is called, after a partial start, during a pending wait, and with a request in flight.

**`createAccountRuntimeFromConfig`** is the single place the real adapters meet. Protocol constants are injected rather than imported inside it, so the transport-level harness can point the runtime at a local broker without any production escape hatch.

**`src/platform.ts`** now builds through that seam, starts on `didFinishLaunching`, and makes the `shutdown` handler the sole owner of teardown. It still registers and removes no accessory under any sequence of lifecycle events.

## The Refused-Subscription Stub, Decided

Plan 01-09 left this deliberately: a post-connect subscription that the broker refuses was reported once at debug and never recovered from. The socket stayed open and `connected` still read `true`.

**Decision: give up the connection and retry it through the existing guarded reconnect.** The catch now clears the live flag, warns once, reports `subscription-refused` outward, ends the transport, and schedules a reconnect through the same policy a transport error uses. The policy's pending guard collapses the close notification that ending produces into the same chain.

The reasoning is the project's core value, not convenience. A connection that reads as healthy while no shadow message can reach the store is a silent monitoring failure that presents as normal operation. That is precisely the false-normal this plugin exists to prevent, so it could not be inherited. Plan 01-09's own suggestion — route it into the guarded reconnect — was the cheapest correct option and is what was done.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The transitional `ignoreFindings` entry the plan required for `failureLog.ts` was measurably unnecessary**

- **Found during:** Task 1
- **Issue:** The plan states the entry is required because "without the entry this task cannot commit." Measured with `npm run fallow` on the real tree: `fallow dead-code` reports **no issue** for a new module whose only consumer is its own test. The entry would have matched no finding, and the module header would have carried a false statement about being parked.
- **Fix:** The entry was not added. Task 2's removal list shrank from five to four accordingly, which is what the orchestrator's measured brief already said.
- **Verification:** `npm run fallow` exits 0 at the task 1 commit with no entry present.
- **Committed in:** `fb53892`, `d4f0f33`

**2. [Rule 2 - Missing Critical] A refused shadow subscription reported healthy**

- **Found during:** Task 2
- **Issue:** Inherited from plan 01-09 and assigned here. See the section above.
- **Fix:** The connection is given up and retried through the guarded policy.
- **Files modified:** `src/cloud/shadow.ts`, `test/cloud/shadow.test.ts`
- **Verification:** Three new cases cover the report, `connected` reading `false`, and the scheduled retry; the pair holds 100 percent.
- **Committed in:** `a4f8f15`

**3. [Rule 2 - Missing Critical] The bearer token was never registered as a secret**

- **Found during:** Task 3 groundwork
- **Issue:** Plan 01-04 explicitly deferred "registering tokens and AWS credentials as secrets" to this plan. The temporary credentials pass through the runtime and were straightforward, but the ID token never leaves the auth client, so no amount of runtime work could register it.
- **Fix:** `AuthClientOptions` gained a narrow `registerSecret` port, called once per distinct token rather than once per request. A long-running bridge therefore does not accumulate one registered secret per call.
- **Files modified:** `src/cloud/auth.ts`, `test/cloud/auth.test.ts`, `src/platform.ts`
- **Verification:** Three new auth cases; the auth pair holds 100 percent. A seam case logs the token and both credential values through the wrapper and asserts all three come back `[redacted]`.
- **Committed in:** `27bbbd9`

**4. [Rule 1 - Bug] An unparseable vendor expiry would have spun the rotation timer**

- **Found during:** Task 2
- **Issue:** `Expiration` is narrowed only as a string. `Date.parse` on a value that is not a date yields `NaN`, and `Math.max(floor, NaN)` is `NaN`. A timer armed with `NaN` fires immediately, which would have turned one malformed field into a request loop against the vendor.
- **Fix:** `rotationDelayMs` checks `Number.isFinite` and falls to the floor.
- **Committed in:** `02669ea`

**5. [Rule 3 - Blocking] A declaration cycle between opening and retrying the shadow**

- **Found during:** Task 2
- **Issue:** `openShadow` scheduled the retry and the retry called `openShadow`. `@typescript-eslint/no-use-before-define` rejects the cycle in either order — the same shape plan 01-09 hit.
- **Fix:** `attemptShadow` returns whether it was refused, and the caller decides. No callback, no cycle.
- **Committed in:** `751c89c`

**6. [Rule 1 - Bug] The first retry chain would have stopped after one attempt**

- **Found during:** Task 2
- **Issue:** The obvious implementation calls `retry.schedule()` from inside the work the policy is already running. The policy clears its pending guard only after that work settles, so the re-schedule is silently dropped and the chain dies after a single attempt — a degraded shadow would then never recover.
- **Fix:** The chain is its own loop over the abortable wait and takes only the capped delay sequence from the policy.
- **Committed in:** `02669ea`

### Deliberate design departures

**`while` loops instead of the plan's self-rearming `finally`.** The plan asks for `scheduleRotation` to re-arm inside a `finally`, calling that "the single most commonly missed line in this pattern." That is exactly the argument against it: a line whose absence is invisible. A loop cannot be deleted the same way — the next iteration is the control flow, not a statement someone must remember. The property the plan wants is preserved and asserted.

**`createRetry` instead of a `retry` member.** The plan's `AccountRuntimeOptions` carries one `RetryPolicy`; the orchestrator's brief requires two instances, because a policy's pending guard is global to the policy. Passing a factory makes two instances structural, and it keeps the root signal owned by the runtime rather than by whoever built the policies. A case asserts the shadow client's policy sits at attempt 0 while the runtime's own has already advanced — that case fails if the instances are shared.

**A narrowed shadow factory port.** The plan's `AccountRuntimeOptions` sketch carries `shadowScheme` and `region` and takes a full `ShadowClientOptions` factory, which would have put five pass-through members on the runtime and forced every unit test to supply a transport and a connect function. The runtime now supplies only what it owns.

### Interface corrections applied

All four corrections in the orchestrator's brief were real and were followed rather than the plan's `<interfaces>` sketch: `createRetryPolicy` has no `clock`, `CloudApiOptions` has no `log`, `MqttConnect` returns `MqttClientLike` through four overloads, and `ShadowClientOptions` needs `createTransport` and `connect` separately. The port that plan 01-09 declared and probed is assignable from the real `mqtt.connect` — `npm run typecheck` passes with the live library wired at the seam, which is the first time that has been proven outside a throwaway probe.

## The Dead-Code Gate

`.fallowrc.json` `ignoreFindings` is now exactly the eight `D-17` scaffold entries, in their established order. `ignoreDependencies` and `ignorePatterns` are untouched. All four transitional transport entries are gone, and the module-header note promising their removal is gone from each of the four modules.

Removing them surfaced one genuine finding the suppression had been hiding: `IOT_SERVICE_NAME` was exported from `src/cloud/sigv4.ts` with no consumer anywhere — not in production, not in its own test. It is now a module-local constant. Its value is still covered, through the credential scope of the signed URL that `test/cloud/sigv4.ts` already asserts. The gate now passes on genuine reachability rather than on a suppression.

## Known Stubs

None.

## Deferred Items

- **The heartbeat topic is still an unconfirmed assumption.** Carried forward from plan 01-09 and unchanged by this plan. If the vendor publishes device updates on the documents topic rather than update-accepted, the subscription set is wrong and no heartbeat arrives. Only a real-hardware scenario can settle it.
- **`offlineConfirmationPollCount` is validated but unused.** Confirming a device offline from consecutive successful polls is a later requirement; this plan deliberately marks nothing disconnected.
- **`ShadowClient.requestFullShadow` has no production caller.** It is reachable and covered through the shadow client's own tests, and `fallow dead-code` is satisfied. Its production consumer arrives with the accessory adapters.

## Threat Flags

None. Every register row this plan owns is mitigated and covered: `T-01-52` (shutdown during a wait, a request, and an open connection), `T-01-53` (the reschedule after a failed refresh), `T-01-54` (nothing scheduled after a credential rejection), `T-01-55` (four warnings an hour, not a hundred and twenty), `T-01-56` (a failed poll changes no snapshot and marks nothing disconnected), `T-01-57` (a short classification, never an error object or a response body), and `T-01-58` (zero accessory registration or removal across every lifecycle sequence).

## Verification

Re-run at the end of the plan, all from the worktree:

- `npm run check` exits 0.
- `node --test` — 380 unit tests pass, up from 322, with 0 failures.
- Cucumber — 10 scenarios, 61 steps, all passing. No regression.
- `npm run test:coverage:direct` — 100 percent lines, branches, and functions for each changed pair run alone: `failureLog`, `accountRuntime`, `platform`, `shadow`, and `auth`.
- `npm run fallow` — dead-code clean with no transport module parked, health 0 above threshold with every named unit inside the sixty-line cap, dupes 0 percent.
- `node -e` assertion on `.fallowrc.json` — `ignoreFindings` deep-equals the eight scaffolds exactly.
- The lifecycle cases run on the runner's default timeout and complete without hanging, which is what proves no timer survives `stop()`.

## Self-Check: PASSED

All seven declared files exist on disk. All seven commits are reachable from `HEAD`.
