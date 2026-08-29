---
phase: 01-secure-cloud-foundation
plan: 11
subsystem: behavior-scenarios
tags: [cucumber, transport-level, fake-cloud, degraded-path, redaction, changelog, packaging, phase-gate]
status: complete

requires:
  - phase: "01-08"
    provides: "The loopback Auth0 tenant, REST service, MQTT broker, Homebridge stand-in, and the per-scenario world"
  - phase: "01-09"
    provides: "createShadowClient and createMqttTransport, the transport the scenarios drive"
  - phase: "01-10"
    provides: "createAccountRuntimeFromConfig, the single composition seam the world builds through"
provides:
  - "Seven behavior feature files driving the real plugin against a loopback fake vendor cloud"
  - "A world that builds the production account runtime through its own seam, with constants pointed at the fakes"
  - "Four step modules grouped by function: configuration, authentication, shadow, runtime"
  - "`ShadowDisconnectReason`, a typed four-value union the runtime discriminates on"
  - "The phase's user-visible changes in the `Unreleased` changelog section"
affects: [02, 05, cucumber-harness, cloud-transport, account-runtime]

actuals:
  tokens: 56000
  tasks: 3
  commits: 7

tech-stack:
  added: []
  patterns:
    - "A production constant that names a scheme is injected at the seam, so a harness reaches a local service without any escape hatch in production code"
    - "A module that sees one event logs at debug; the consumer that sees the whole stream owns the warning cadence"
    - "Every scenario wait carries a deadline below its step timeout, so a stalled transport fails as a named step rather than as the runner giving up"
    - "A negative assertion is anchored to a synchronization point that proves the message arrived, never to a fixed sleep"

key-files:
  created:
    - features/configuration.feature
    - features/authentication.feature
    - features/shadowMerge.feature
    - features/shadowLifecycle.feature
    - features/credentialRotation.feature
    - features/degradedOperation.feature
    - features/lifecycle.feature
    - features/support/steps/configuration.ts
    - features/support/steps/authentication.ts
    - features/support/steps/shadow.ts
    - features/support/steps/runtime.ts
  modified:
    - features/support/world.ts
    - features/support/fakeAuth0.ts
    - features/support/fakeRestApi.ts
    - features/support/fakeShadowBroker.ts
    - features/support/fakeHomebridgeApi.ts
    - src/protocol.ts
    - src/protocol.json
    - src/cloud/auth.ts
    - src/cloud/shadow.ts
    - src/runtime/accountRuntime.ts
    - test/protocol.test.ts
    - test/cloud/auth.test.ts
    - test/cloud/shadow.test.ts
    - test/runtime/accountRuntime.test.ts
    - CHANGELOG.md

key-decisions:
  - "`auth0Domain` became `auth0Url` and carries its scheme, because the grant builder hardcoded https and left no way to reach a local tenant"
  - "A shadow connection that closes without ever becoming established is a refused handshake, not the provider connection ceiling"
  - "The shadow client reports a failed attempt at debug and the runtime owns the rate-limited warning, matching what the authentication client already does"
  - "The account runtime hands out the canonical store it maintains, so nothing outside has to keep a second copy"
  - "Configuration refusal drives the real platform; every other scenario builds through the runtime seam, so no scenario can reach the bundled vendor endpoints"
  - "One rotation scenario covers both rotation properties, because each rotation costs the runtime's own thirty-second floor in real time"

patterns-established:
  - "Point the composition seam at loopback fakes by supplying the protocol constants, which are an ordinary injected dependency rather than a test hook"
  - "Prove a repeated-attempt policy by waiting for the third diagnostic line and then asserting exactly one warning"

requirements-completed: [CONF-03, AUTH-01, AUTH-02, SYNC-02, SYNC-03, SYNC-04, SYNC-05]

metrics:
  duration: ~75 minutes
  completed: 2026-08-29
---

# Phase 01 Plan 11: Behavior Scenarios Summary

The whole plugin now runs against a loopback fake vendor cloud, and driving it there found two defects that every unit test in the phase had missed.

## What Was Built

**`features/support/world.ts`** builds the production account runtime through `createAccountRuntimeFromConfig`, with the protocol constants assembled from the running fakes: the REST base URL from the fake service, the tenant origin from the fake tenant, and the unsecured WebSocket scheme so the signer produces a URL the local broker accepts. The broker endpoint and the vendor client identifier need no override at all — both arrive as data in the fake credentials response, exactly as they do from the real vendor. The world also loads the real `BasementGuardianPlatform`, which is what decides whether an account is usable.

The world records what the steps ask about: every log line with its level, every canonical state change with the keys that moved, and every unhandled rejection. The rejection recorder is a process listener registered in the constructor and removed in cleanup, so a shutdown scenario asserts the absence of a rejection rather than hoping the process would have crashed on one.

**Four step modules grouped by function**, not by feature file. `configuration.ts` loads the platform and asks what it refused. `authentication.ts` arms the tenant and asks what the tenant received, what the cache holds, and what the log said. `shadow.ts` states what the vendor reports and asks what the plugin holds. `runtime.ts` owns the lifecycle and the questions that span the whole runtime. Every then-step method name begins with `assert`, and each module orders its definitions given, then when, then then.

**Seven feature files, 22 scenarios**, on top of the 10 harness scenarios that already existed:

| File | Scenarios | What it proves |
|------|-----------|----------------|
| `configuration.feature` | 3 | A missing email, a missing password, and an out-of-range poll interval each refuse startup, register no lifecycle listener, and let nothing reach the fake cloud |
| `authentication.feature` | 5 | The grant, the cache write, the cache reuse across a restart, the refusal that deletes the cache, the throttle that waits, and the log that carries no credential |
| `shadowMerge.feature` | 3 | A partial heartbeat keeps pump, power, charging, test, and fault values; a requested value never becomes device state; an identical heartbeat reports no change |
| `shadowLifecycle.feature` | 3 | A complete-shadow request on the first connection and again after a reconnect, and a poll that reconciles what the shadow did not carry |
| `credentialRotation.feature` | 1 | A rotation leaves the live socket alone and the next handshake carries the rotated material and the new client identifier |
| `degradedOperation.feature` | 2 | The runtime stays up on the polling-only path, says so once across repeated attempts, and announces the recovery once |
| `lifecycle.feature` | 5 | Shutdown during a pending retry, during a request in flight, and with an open connection; a second shutdown; and a start after a shutdown that does no work |

**`CHANGELOG.md`** gained the phase's `Added`, `Changed`, and `Security` entries, written through the `simple-english` and `humanizer` rules: one user-visible change per bullet, one sentence, active voice, no mechanism and no planning artifact.

## What Driving the Real Runtime Found

Two defects, both invisible to unit tests because both live in the gap between what a stub reports and what a real transport does.

**1. A refused WebSocket handshake read as the routine daily reconnect.** Measured against the local broker: when the server rejects the upgrade, the client emits `close` and nothing else, while a dead TCP port emits `error` first. The plugin's `handleClose` treated any close without a preceding error as the provider connection ceiling, which the phase deliberately reports as normal operation. So an expired or mis-signed credential — the exact failure a signed WebSocket produces, an HTTP 403 on the upgrade — left the shadow permanently dead with nothing above debug to say so. A connection that closes without ever becoming established is now reported as `handshake-refused`.

**2. A failing connection warned on every attempt and never reported the degraded path.** The degraded reporting in the account runtime fired only when *building* the shadow client threw, which a real transport never does: `start()` resolves and the failure arrives later as an event. Meanwhile the shadow client warned on every single transport error, so a broker outage wrote two warnings a minute forever at the capped backoff. That is precisely the flood `D-14` exists to prevent, and the one actionable line `D-15` requires never appeared. The client now notes an attempt at debug and the runtime reports the degraded path through the failure log, which holds it to one warning and a fifteen-minute reminder.

Both are the same shape of mistake: a stub that fails synchronously does not behave like a socket that fails later.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The authentication client could not be pointed at a local tenant**

- **Found during:** Task 1
- **Issue:** The plan directs the world to take "the Auth0 origin from the fake tenant", but `ProtocolConstants.auth0Domain` held a bare host and `src/cloud/auth.ts` built `https://${domain}/oauth/token`. The scheme was decided inside the client, so no injected constant could reach a loopback HTTP tenant. The alternatives were all worse: a TLS stand-in needs a certificate in the repository, and a custom dispatcher or a verification bypass is forbidden by this phase's own threat register.
- **Fix:** `auth0Domain` became `auth0Url` and carries its scheme, mirroring `apiUrl`, which was already a full base URL. The grant builder concatenates. The bundled value is unchanged and the constant count stays six.
- **Files modified:** `src/protocol.ts`, `src/protocol.json`, `src/cloud/auth.ts`, and the three tests naming the constant
- **Commit:** `bf4ec38`

**2. [Rule 2 - Missing critical] A failed shadow connection reported nothing actionable and flooded the log**

- **Found during:** Task 2 groundwork
- **Issue:** See "What Driving the Real Runtime Found" above.
- **Fix:** `handleError` and the subscription refusal drop to debug; `handleShadowDisconnected` takes the reason and reports the degraded path through the failure log for anything that is not a clean close. `ShadowDisconnectReason` became a union type, so the runtime's split over it is checked by the compiler.
- **Verification:** Two new runtime cases and the `degradedOperation.feature` scenarios; both changed pairs hold 100 percent.
- **Commit:** `9d8161a`

**3. [Rule 1 - Bug] A refused handshake was indistinguishable from the provider connection ceiling**

- **Found during:** Task 2
- **Issue:** See above. Confirmed with an isolated probe before changing anything: refused upgrade produced `["close"]`, dead port produced `["error:connect ECONNREFUSED …","close"]`.
- **Fix:** The client tracks whether a connection ever became established and reports `handshake-refused` for one that did not.
- **Verification:** One new shadow case plus both degraded scenarios; `shadow.ts` holds 100 percent.
- **Commit:** `2511969`

**4. [Rule 3 - Blocking] No scenario could read canonical device state**

- **Found during:** Task 1
- **Issue:** The plan requires the world to expose "the store", but `AccountRuntime` published only `monitoringPath`, `start`, and `stop`. The store was private to the runtime. Rebuilding the seam inside the harness would have meant the scenarios no longer drive the real composition, which is the whole point of the plan.
- **Fix:** `AccountRuntime` hands out the store it maintains. This is not a test hook: the accessory adapters in the next phase read and subscribe to exactly this store, and a second copy is a copy that can disagree.
- **Commit:** `d69c7f6`

### Deliberate design departures

**One rotation scenario instead of three.** The runtime holds a rotation to a thirty-second floor no matter how soon the vendor expiry falls, and that wait is real wall-clock time with no injection point. Three rotation scenarios would have cost ninety seconds of suite time to prove properties that sit on one timeline anyway, so the single scenario asserts all of them in order: the handshake count does not change, shadow messages keep arriving, and the handshake after a forced reconnect carries the rotated material and the new client identifier. The plan's third rotation scenario — a failed credential request followed by a later rotation — is already owned by a unit case with a fake clock, which the phase validation map itself assigns to the unit suite rather than to Cucumber.

**Configuration refusal drives the platform; everything else drives the seam.** `BasementGuardianPlatform` imports the bundled `PROTOCOL` directly, so a platform-driven scenario with a *valid* account would reach the real vendor endpoints. The configuration scenarios are safe because a refused account registers no lifecycle listener and the constructor performs no request, which is the behavior under test. Every scenario that actually starts cloud work builds through `createAccountRuntimeFromConfig` with the harness constants, so no scenario can reach a live service.

**A separate `logged` array rather than reusing `observations`.** The world's existing `observations` array records what the harness scenarios saw. The plugin's log is a different stream with its own level prefix, and mixing the two would have made both assertions vaguer.

### Files touched beyond the plan's declared list

- `src/protocol.ts`, `src/protocol.json`, `src/cloud/auth.ts`, `src/cloud/shadow.ts`, `src/runtime/accountRuntime.ts` and their four unit-test files — deviations 1 through 4 above.
- `features/support/fakeAuth0.ts`, `fakeRestApi.ts`, `fakeShadowBroker.ts`, `fakeHomebridgeApi.ts` — the fakes gained exactly what the scenarios ask about: the issued token as an export, a request the service holds in flight, the topics a client published, a broker that can refuse and then accept handshakes, and the lifecycle registrations the Homebridge stand-in received.
- `.fallowrc.json` was **not** modified. Its `ignoreFindings` list is exactly the eight `D-17` scaffold entries.

## The Phase Gate

`npm run check` exits 0 across the type check, the lint at zero warnings, all three code-health sub-commands, the format check, and both suites.

- `node --test` — 384 unit tests, 0 failures, up from 380.
- Cucumber — 32 scenarios, 265 steps, all passing, up from 10 and 61. The process exits on its own.
- `npm run fallow` — dead code clean, 0 files above the health threshold, duplication 0.0 percent.
- `.fallowrc.json` `ignoreFindings` deep-equals the eight `D-17` scaffolds.
- `npm pack --dry-run --json` — 84 paths, every one of them under `dist/` or one of the five allowlisted root files. `dist/protocol.json` is present and the feature directory is absent.
- `trufflehog filesystem` over `features`, `src`, and `test` — 0 verified and 0 unverified findings.

The suite takes about 40 seconds, 30 of which is the rotation scenario waiting out the runtime's own floor.

## Known Stubs

None.

## Deferred Items

- **The heartbeat topic is still an unconfirmed assumption.** Carried forward unchanged. The scenarios publish on the update-accepted topic because that is what the plugin subscribes to; only real hardware can confirm the vendor publishes there.
- **A rotation costs thirty seconds of real time in any scenario that waits for one.** If the suite grows more rotation cases, the runtime needs an injectable wait rather than `node:timers/promises` read through a default import.
- **`ShadowClient.requestFullShadow` still has no production caller.** Unchanged from the previous plan.

## Threat Flags

None. No file in this plan opens a network path outside loopback, disables certificate verification, or holds a real credential. `T-01-59` through `T-01-63` are each mitigated: every fixture value is a self-describing placeholder, the packed file list is asserted positively, every dependency is a loopback stand-in the scenario tears down, every wait carries a deadline below its step timeout, and the Cucumber process exits on its own.

## Verification

Re-run at the end of the plan, all from the worktree:

- `npm run check` — exit 0.
- The plan's structural feature-file check — all seven files present, no conjunction step keyword, no discouraged modal verb.
- The plan's changelog check — a non-empty `Unreleased` section, 8 entries, every one under 40 words.
- The plan's packaging check — only allowlisted paths, bundled protocol data file present.
- The plan's `ignoreFindings` check — exactly the eight scaffolds.
- `npm run test:coverage:direct` — 100 percent lines, branches, and functions for `shadow` and `accountRuntime` run alone.

## Self-Check: PASSED

All eleven created files exist on disk. All seven commits are reachable from `HEAD`.
