---
phase: 01-secure-cloud-foundation
verified: 2026-08-29T10:15:47Z
status: gaps_found
score: 13/20 must-haves verified
behavior_unverified: 1
overrides_applied: 0
gaps:
  - truth: "No account identifier reaches the Homebridge log (PROJECT.md Privacy constraint, CLAUDE.md)"
    status: failed
    reason: "The malformed-email refusal quotes the configured account email verbatim into an error line. Nothing is registered as a secret at that point (registerSecret for the password runs afterwards, platform.ts:60) and none of the four CREDENTIAL_PATTERNS matches a bare email in prose."
    artifacts:
      - path: "src/config.ts:104-106"
        issue: "`return `the account email must be an email address, but it is ${email}.`` interpolates the raw value."
      - path: "src/platform.ts:52-57"
        issue: "The refusal string is logged through the redacting logger before any secret is registered. The comment at line 48-49 shows the quoting was deliberate (T-01-16), so this is a policy conflict, not an oversight."
    missing:
      - "Either drop the value from the message (`'the account email must be an email address.'`) or register the configured email as a redactable secret in the platform constructor before validateConfig runs."
      - "A scenario in features/configuration.feature covering the malformed-email refusal; none exists, so nothing catches a regression."
      - "If quoting the value is the intended trade, record it as an explicit exception to PROJECT.md's Privacy constraint rather than leaving the two documents in conflict."
  - truth: "An omitted-field shadow document cannot corrupt a previously accepted value (SC-3, SYNC-02, D-014)"
    status: failed
    reason: "A shadow document with no `reported` section still lands as a snapshot: it passes the staleness guard, merges nothing, advances the version watermark, and restamps `receivedAt`. `receivedAt` is the snapshot's only freshness field and is the field `src/device/health.ts:51` declares as `lastReceivedAt`, so a dead device reads as freshly reporting. This is the false-normal shape the project's core value forbids. The vendor publishes exactly this document (`update/accepted` for a desired-only write) every time it delivers a command."
    artifacts:
      - path: "src/device/state.ts:141-151"
        issue: "`nextSnapshot` sets `receivedAt` unconditionally and `shadowVersion: patch.version ?? previous.shadowVersion`, with no test for whether the patch carried any observation."
      - path: "src/device/state.ts:210-222"
        issue: "`applyReportedPatch` does not reject a patch whose `data` and `state` are both undefined."
      - path: "src/cloud/shadow.ts:139-148"
        issue: "`toReportedPatch` builds `{ data: undefined, state: undefined, version: n }` for a document with no `reported` section and hands it straight to the store."
      - path: "features/shadowMerge.feature:44-52"
        issue: "The scenario 'A requested value never becomes device state' asserts `the canonical snapshot is at shadow version 1` after such a document, so the accepted suite encodes the defect as correct."
    missing:
      - "Treat a patch with no reported content as carrying no observation: advance the watermark if ordering needs it, but leave `receivedAt` where it was."
      - "A unit case asserting that an empty patch leaves `receivedAt` unchanged."
      - "Amend the shadowMerge scenario so it asserts the same rather than the current behavior."
  - truth: "REST snapshots and partial shadow updates produce one current state per device, with neither source reverting the other (SC-3, SYNC-02)"
    status: failed
    reason: "The REST poll path has no ordering guard of any kind, and `shadowVersion` survives the overwrite. A poll describing an earlier moment silently reverts newer shadow telemetry, and the surviving watermark then makes the shadow's re-delivery of the correct value stale, so recovery is blocked until a strictly newer version arrives. Reproduced against the built code: primary_pump_running true -> false, and the v90 re-delivery rejected."
    artifacts:
      - path: "src/device/state.ts:120-137"
        issue: "`toSnapshot` replaces `data` wholesale and carries `shadowVersion: previous?.shadowVersion` forward, with no comparison of `connectivity.timestamp`, `receivedAt`, or the shadow version."
      - path: "src/device/state.ts:101-103"
        issue: "`isStalePatch` then rejects the shadow's re-delivery at the same version, so the reverted value cannot come back."
      - path: "features/shadowLifecycle.feature:27-36"
        issue: "'The poll reconciles state the shadow did not carry' runs with `the broker refuses connections`, so `shadowVersion` is undefined throughout. No scenario exercises a poll against a live shadow watermark, which is why the suite cannot see this."
    missing:
      - "An ordering guard on the REST path, or keep `data` shadow-sourced while `shadowVersion !== undefined` and use the poll only for connectivity and identity."
      - "Do not leave the watermark ahead of the data after a REST write."
      - "A case asserting that an older REST snapshot does not revert a newer shadow value, and a scenario combining a short poll interval with live shadow traffic."
      - "Note the second-order effect: because the reconnect full-shadow refresh arrives at an unchanged version after a degraded period, `isStalePatch` discards it, so the SYNC-03 refresh restores nothing that the poll overwrote."
  - truth: "Repeated shadow connection cycles leave no superseded connection driving live state and no connection nothing will close (SC-4, SYNC-04, SYNC-05)"
    status: failed
    reason: "`live`, `established`, `failed`, and `transport` are single closure variables shared by every connection the client opens, and `openConnection` neither detaches the previous connection's handlers nor ends it. Separately, the reconnect work handed to the retry policy is `openConnection`, which has no `closing` guard, and `close()` memoizes `ending` from the transport that existed when it ran. Both reproduced against the built code."
    artifacts:
      - path: "src/cloud/shadow.ts:301-322"
        issue: "`openConnection` reassigns `transport` and resets `established`/`failed` without ending or detaching the previous connection, and has no `closing` guard of its own. Reproduced: with connection B live and connected, a late `close` from superseded connection A flips `connected` to false and emits `disconnected:transport-closed`, which drives `accountRuntime.handleShadowDisconnected` to `path = 'rest-only'` while B is healthy and subscribed."
      - path: "src/cloud/shadow.ts:219-229, 343-348"
        issue: "Reproduced: after `close()`, a retry work item whose wait had already elapsed opened a brand-new connection (1 -> 2 transports) that nothing ever ends, because `ending` was memoized from the previous transport."
      - path: "src/runtime/accountRuntime.ts:233-263"
        issue: "`attemptShadow` assigns `shadow = client` only after `await client.start(deviceIds)`. A `stop()` landing in that window sees `shadow === undefined`, skips `shadow?.close()`, and leaves the socket `start()` already opened with nothing to close it. Narrow window; structural all the same."
      - path: "src/cloud/mqttTransport.ts:79-101"
        issue: "`subscribeOnce` and `publishOnce` have no deadline, so a callback that never fires parks `requestEveryShadow` forever with `live` still true from `handleConnect` — connected and reporting the combined path with nothing subscribed."
    missing:
      - "A generation token on `openConnection`: ignore every callback from a non-current generation, and end the previous transport before replacing it."
      - "A `closing` guard inside `openConnection` itself, not only at schedule time in `scheduleReconnect`."
      - "Re-check `stopped` after `await client.start(...)` in `attemptShadow` and close the client if a shutdown landed."
      - "Move `options.onConnected()` out of `handleConnect` and into `requestEveryShadow` after the subscription resolves, and put a deadline on `subscribeOnce`/`publishOnce`."
      - "A scenario that shuts down while a reconnect is pending and asserts the broker holds no live connection afterwards; `fakeShadowBroker` already exposes `server.clients`."
  - truth: "The runtime can express that monitoring has stopped, and its monitoring-path contract matches the one its declared consumer uses (phase goal: 'trustworthy')"
    status: failed
    reason: "`MonitoringPath` in the runtime is `'rest-and-shadow' | 'rest-only'` with no value meaning 'nothing is working'. Reproduced: after a terminal `AuthRejectedError` — the one failure the project treats as final, after which no poll, no credential refresh, and no shadow will ever run again — `runtime.monitoringPath` reads `'rest-only'`, which `src/device/health.ts:16-22` documents as 'a working degraded path, not a failure'. The terminal branch also records nothing in the failure log. Separately, the same exported name carries two disjoint value sets, so `DeviceHealth.monitoringPath` cannot be fed by `AccountRuntime.monitoringPath` at all."
    artifacts:
      - path: "src/runtime/accountRuntime.ts:43, 181, 372-387"
        issue: "Two-value union, initialized to `'rest-only'`, never changed on a terminal failure; `launchFailure` returns undefined for `AuthRejectedError`/`AuthHaltedError` without calling `options.failures.recordFailure`. `AuthThrottledError` likewise leaves the path at `'rest-only'` for the whole wait."
      - path: "src/device/health.ts:22, 47"
        issue: "Declares `MonitoringPath` as `'shadow-and-poll' | 'poll-only' | 'unavailable'` and types `DeviceHealth.monitoringPath` with it. No member overlaps the runtime's union. This is a scaffold whose declared type is wrong, not one that is merely incomplete — plan 01-03's must-have calls these type-only contracts for the next phase."
    missing:
      - "One exported `MonitoringPath`, three values, imported by the runtime from `src/device/health.ts`."
      - "Set the dead state on every path where the runtime is not receiving anything and will not retry: the terminal authentication branch, and `runPoll`'s catch once polling has failed and the shadow is not connected."
      - "Record the terminal stop in the failure log so `recordSuccess`/`recordFailure` learn the runtime halted."
      - "Update the Cucumber step `Then the monitoring path is \"rest-only\"` in features/degradedOperation.feature with the renamed values."
      - "Partial overlap with Phase 5 (RES-04) noted below under Deferred Items — the user-facing surfacing belongs there, but the representable state and the type contract are this phase's."
  - truth: "`npm run check` passes typecheck, lint, all three fallow sub-commands, format:check, and both test suites (01-01, 01-11, D-12)"
    status: failed
    reason: "The phase-seal gate is not reliably green. `npm run check` exited 1 on the first run in this verification: 32 scenarios, 31 passed, 1 failed. Three subsequent full runs passed, so the gate is flaky rather than broken — but a flaky seal gate cannot certify the phase, and the flake sits on the one scenario proving SYNC-04 credential rotation."
    artifacts:
      - path: "features/support/steps/shadow.ts:246-250"
        issue: "`assertClientIdentifiers` reads `broker.clientIds` with a bare `assert.deepEqual` and no wait, while every sibling assertion (`assertHandshakeCount`, `assertSnapshotFields`) goes through `this.untilTrue`. Observed failure: `['placeholder-shadow-client']` against the expected two."
      - path: "features/support/fakeShadowBroker.ts:165-190"
        issue: "`handshakes` is pushed on the WebSocket upgrade (line 181) while `clientIds` is pushed on the MQTT client connect (line 169). The preceding step waits on `handshakes`, so the assertion can run before the CONNECT packet is processed. That is the race."
      - path: "src/runtime/accountRuntime.ts:35"
        issue: "`MIN_ROTATION_DELAY_MS` (30 000) is a module constant `createAccountRuntime` does not accept by injection, unlike `pollIntervalMs`, so the rotation step waits 30 real seconds under a 45-second deadline. That is most of the suite's 40-second runtime and contradicts the project's own rule that scheduling be driven by an injected clock."
    missing:
      - "Route `assertClientIdentifiers` through `this.untilTrue` like its siblings."
      - "Move `MIN_ROTATION_DELAY_MS` and `ROTATION_LEAD_MS` into `AccountRuntimeOptions` so a scenario can set them to milliseconds."
deferred:
  - truth: "A user can tell a dead monitoring path apart from a working degraded one"
    addressed_in: "Phase 5"
    evidence: "Phase 5 success criterion 2: 'Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path'; RES-04: 'only explicit credential rejection yields a persistent communication failure requiring user action'. Only the user-facing surfacing is deferred. The representable runtime state and the `MonitoringPath` type collision stay in this phase's gap list, because D-15's own reversibility note says the set of runtime states Phase 5 consumes is shaped here."
behavior_unverified_items:
  - truth: "Administrator can install the dynamic platform and save one valid account through the Homebridge settings form, with the password-storage warning visible (SC-1, CONF-01, CONF-02)"
    test: "Install the built package into a real Homebridge instance, open Plugins -> Basement Guardian -> Settings, and save a valid account."
    expected: "The form renders one account block; the header states that Homebridge stores the password in plain text in config.json and in backups; the password field is masked; a malformed email is refused by the form; saving writes the account and the plugin starts."
    why_human: "No harness renders the Homebridge settings form (ng-formworks inside the Homebridge UI). Plan 01-11 proves the refusal behavior behind the form, not the form itself."
  - truth: "The vendor publishes device heartbeats on the update-accepted topic the client subscribes to"
    test: "Run the plugin against real hardware for at least two heartbeat intervals (~30 minutes) and confirm partial telemetry arrives on `$aws/things/<deviceId>/shadow/update/accepted`."
    expected: "Partial heartbeat fields merge into the canonical snapshot roughly every 898 seconds."
    why_human: "The topic choice is an assumption the fake broker cannot falsify; only real hardware confirms where the vendor publishes."
  - truth: "The presigned AWS IoT WebSocket URL is accepted by the real broker (SYNC-04)"
    test: "Open a shadow connection against the real AWS IoT endpoint with real temporary credentials."
    expected: "The handshake completes rather than returning HTTP 403."
    why_human: "`features/support/fakeShadowBroker.ts:165` uses `verifyClient: () => !refusing` — the harness accepts every signature, so the integration suite would pass unchanged if `presignIotWebsocketUrl` produced garbage. The unit test in `test/cloud/sigv4.test.ts` derives the expected signature independently and is good work, but it and the harness share one reading of the spec, so nothing in the repo is an external check of this security-critical path."
human_verification:
  - test: "Install the built package into a real Homebridge instance, open Plugins -> Basement Guardian -> Settings, and save a valid account."
    expected: "One account block; plaintext-storage warning in the header; masked password; malformed email refused by the form; saving starts the plugin."
    why_human: "No harness renders the Homebridge settings form."
  - test: "Run against real hardware for two heartbeat intervals and watch which shadow topic carries the partial heartbeat."
    expected: "Partial telemetry arrives on update-accepted roughly every 898 seconds."
    why_human: "Only real hardware confirms where the vendor publishes."
  - test: "Open a shadow connection against the real AWS IoT endpoint with real temporary credentials."
    expected: "Handshake completes; no HTTP 403."
    why_human: "The fake broker accepts every signature, so the suite cannot detect a broken signer."
---

# Phase 1: Secure Cloud Foundation Verification Report

**Phase Goal:** Administrator can securely connect one Basement Guardian account and the plugin can maintain trustworthy current cloud state over a long-running Homebridge lifecycle.
**Verified:** 2026-08-29T10:15:47Z
**Status:** gaps_found
**Re-verification:** No — initial verification. Phase 1 is the first phase, so there is no regression baseline.

## Summary

Most of this phase is solid, and the parts that are solid are genuinely solid rather than
present-and-unwired. The dynamic platform loads with `mqtt` as its only runtime dependency, the
template scaffold is gone, configuration refusal reaches no vendor service, the redacting logger
covers all seven `Logging` members, the token cache lives under the Homebridge storage path with a
salted email fingerprint instead of the raw address, the REST client can construct exactly four
routes, the hand-rolled SigV4 presigner is checked against an independently derived signature, the
packed artifact carries six files, and the dead-code gate passes on genuine reachability with the
`ignoreFindings` list back at exactly the eight declaration-only scaffolds. All 24 trackable CONTEXT
decisions are honored, and all twelve requirement IDs are claimed by at least one plan.

The phase fails on the two success criteria that carry the goal's word "trustworthy". I reproduced
each of the code review's five blockers against the built code rather than inheriting them, and I
confirm four outright and qualify the fifth:

- **CR-01 confirmed.** A shadow document with no `reported` section restamps `receivedAt` from 1000
  to 999999 while carrying zero new telemetry. `receivedAt` is the snapshot's only freshness field.
  The reviewer is also right that `features/shadowMerge.feature` asserts this behavior as correct,
  which means the 32-scenario pass count is not evidence for SC-3.
- **CR-02 confirmed, and worse than a race.** I reproduced the revert (`primary_pump_running`
  true -> false) and the recovery lockout (the shadow's v90 re-delivery rejected). The part that
  needs no assumption about vendor lag is the internal inconsistency: after a REST write, the
  watermark still claims shadow content is applied. That also silently defeats the SYNC-03 reconnect
  refresh, because a full shadow at an unchanged version is discarded — and a poll writing `data`
  during a shadow outage is the designed behavior under D-15, not an edge case.
- **CR-03 confirmed, with the direction qualified.** I reproduced consequence 1: with connection B
  live and connected, a late `close` from superseded connection A flips `connected` to false and
  drives the runtime to `rest-only`. That is a false *degraded*, which errs safe. What I did not
  reproduce is consequence 2 (duplicate connections); the retry policy's pending guard absorbs the
  common ordering, so it needs a subscribe callback that rejects more than a backoff later, which is
  plausible but unproven. Consequence 3 rests on WR-11 and is the false-normal direction. The part
  that is unconditional and belongs to SC-4's own words is that a superseded connection is never
  detached and never ended.
- **CR-04 confirmed, severity qualified.** After a terminal `AuthRejectedError` the runtime reads
  `'rest-only'` and records nothing. Nothing in production consumes `monitoringPath` this phase, so
  the false normal is latent rather than user-visible today. It is still a shipped, broken contract:
  `health.ts` and `accountRuntime.ts` export the same type name with disjoint value sets, so the
  scaffold plan 01-03 calls a type-only contract for the next phase cannot be satisfied by its own
  producer.
- **CR-05 confirmed structurally, reachability qualified.** I reproduced the reopen-after-close leak
  with an injected transport. In production the timing is narrow: once the retry's timer resolves,
  its continuation runs before the next macrotask, so a `stop()` from the shutdown event has little
  room to interleave. The defect is real and the fix is one line; the exploitability claim in the
  review is stronger than what I could demonstrate.

One finding the review did not connect to a gate: **`npm run check` is not reliably green.** It
exited 1 on my first run — the credential-rotation scenario's client-identifier assertion, the one
assertion in that file that skips `untilTrue`. Three re-runs passed. The task brief states the
measured state is exit 0; that holds only some of the time.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **SC-1** Administrator can install the dynamic platform and save one valid account through the settings form, with the password-storage warning visible | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `config.schema.json` carries `strictValidation: true`, `singular: true`, the plaintext-storage `headerDisplay`, `widget: password`, and `format: email`; `pluginAlias` = `PLATFORM_NAME` = package `name`. No harness renders the form. |
| 2 | **SC-2a** Missing configuration leaves the plugin idle with a clear log message | ✓ VERIFIED | `src/platform.ts:52-58` returns before registering any listener; `features/configuration.feature` three scenarios assert the refusal text, no lifecycle listener, no accessory, and no request reaching the fake cloud. |
| 3 | **SC-2b** Valid configuration authenticates without exposing credentials or tokens | ✓ VERIFIED | `features/authentication.feature` 'No credential reaches the log' plus the write-every-registered-credential probe; `src/logging.ts` wraps all seven `Logging` members with exact-value and pattern redaction; `auth.ts:428-433` registers the bearer token on first sight. |
| 4 | No account identifier reaches the log (PROJECT.md Privacy, CLAUDE.md) | ✗ FAILED | `src/config.ts:104-106` interpolates the raw email; `src/platform.ts:55` logs it before any secret is registered; no `CREDENTIAL_PATTERNS` entry matches a bare email. |
| 5 | **SC-3a** A partial shadow `reported` patch merges and removes no field it omits | ✓ VERIFIED | `mergeRecord` at `src/device/state.ts:95-97`; `features/shadowMerge.feature` 'A partial heartbeat keeps the fields it omits' passes and asserts the preserved fields. |
| 6 | **SC-3b** A `desired`/requested value never becomes reported device state | ✓ VERIFIED | `ReportedPatch` has no member able to hold it (`state.ts:44-51`); `toReportedPatch` reads only `state.reported` (`shadow.ts:139-148`); no delta or wildcard topic in `SHADOW_TOPICS`; scenario asserts no `alarm_muted` field and 0 canonical changes. |
| 7 | **SC-3c** An omitted-field document cannot corrupt a previously accepted value | ✗ FAILED | Reproduced: empty patch at v42 restamped `receivedAt` 1000 -> 999999 and advanced the watermark. `state.ts:141-151`, `state.ts:210-222`, `shadow.ts:139-148`. Locked in by `features/shadowMerge.feature:44-52`. |
| 8 | **SC-3d** REST snapshots and shadow updates produce one current state per device, neither reverting the other | ✗ FAILED | Reproduced: `primary_pump_running` true -> false on a poll describing an earlier moment, watermark left at 90, shadow re-delivery at v90 rejected. `state.ts:120-137`, `state.ts:101-103`. |
| 9 | **SC-4a** A complete shadow is requested on the first connection and again after every reconnect | ✓ VERIFIED | `requestEveryShadow` in `shadow.ts:276-291` called from `handleConnect`; `features/shadowLifecycle.feature` two scenarios assert 1 then 2 complete-shadow requests across a forced reconnect. Caveat recorded under gap SC-3d: a refresh at an unchanged version is discarded. |
| 10 | **SC-4b** Credential rotation refreshes the cache in place without disturbing the live connection, and the next handshake carries the rotated material | ✓ VERIFIED | `accountRuntime.ts:292-320` calls `cache.replace` only; `shadow.ts:169-185` re-reads the cache per handshake; `features/credentialRotation.feature` asserts 1 handshake across rotation, then rotated credentials on the next handshake. |
| 11 | **SC-4c** Reconnect backoff is capped and a single transport failure produces exactly one retry chain | ✓ VERIFIED | `retryPolicy.ts:38-89` pending guard plus `Math.min(maxDelayMs, ...)`; `reconnectPeriod: 0` disables the library's own timer (`mqttTransport.ts:124`); `test/runtime/retryPolicy.test.ts` covers the duplicate-notification case. |
| 12 | **SC-4d** Shutdown during an in-flight retry wait, an in-flight request, and an open shadow connection produces no unhandled rejection; `stop()` is idempotent | ✓ VERIFIED | `accountRuntime.ts:445-460` guards on `stopped`, aborts once, swallows a close rejection; `features/lifecycle.feature` five scenarios including a double shutdown and a start-after-shutdown. |
| 13 | **SC-4e** Repeated connection cycles leave no superseded connection driving live state and no connection nothing will close | ✗ FAILED | Reproduced both: a late close from superseded connection A flipped `connected` to false while B was live; a post-`close()` retry opened a second transport nothing ends. `shadow.ts:301-322`, `shadow.ts:343-348`, `accountRuntime.ts:251-252`. |
| 14 | The runtime can express that monitoring has stopped, and its monitoring-path contract matches its declared consumer's | ✗ FAILED | Reproduced: `monitoringPath === 'rest-only'` after a terminal `AuthRejectedError` with nothing scheduled and no failure recorded. `accountRuntime.ts:43/181/372-387` vs `health.ts:22/47`. |
| 15 | `npm run check` passes typecheck, lint, all three fallow sub-commands, format:check, and both suites | ✗ FAILED | Exit 1 on first run: 32 scenarios, 31 passed, 1 failed (`features/credentialRotation.feature:15`). Three re-runs passed. `features/support/steps/shadow.ts:246-250` asserts without `untilTrue`. |
| 16 | `npm pack --dry-run` lists only the allowlisted files (D-21) | ✓ VERIFIED | 84 files: `dist/**`, `CHANGELOG.md`, `LICENSE`, `README.md`, `config.schema.json`, `package.json`. `dist/protocol.json` present. No `.npmignore`; `files` allowlist in `package.json`. |
| 17 | Exactly four typed REST routes exist and no excluded route is constructible (SYNC-01) | ✓ VERIFIED | `ROUTES` closed constant at `api.ts:26-31`; the only path builders are `DEVICES_PATH`, `CREDENTIALS_PATH`, and `devicePath(..., COMMAND_SUFFIX)`; `test/cloud/api.test.ts` asserts the exact value set. |
| 18 | The token cache lives under the Homebridge storage path with owner-only mode and a salted email fingerprint (AUTH-02, D-08) | ✓ VERIFIED | `auth.ts:108-109` joins `options.storagePath`; `OWNER_ONLY_MODE = 0o600` on a temp file renamed over the target; the file holds `idToken`, `expiresAt`, `emailFingerprint`, `salt` — never the raw email or the password. `platform.ts:68` supplies `api.user.storagePath()`. |
| 19 | Every module of the adopted tree exists, not-yet-wired modules are declaration-only, and the dead-code gate passes on reachability (D-17) | ✓ VERIFIED | All eight scaffolds contain zero runtime declarations; `fallow dead-code --fail-on-issues` reports 0 issues over 70 entry points; `.fallowrc.json` `ignoreFindings` holds exactly the eight D-17 entries, with every transitional entry removed. |
| 20 | The deterministic suite runs offline against transport-level fakes naming no client library (D-10, D-11) | ✓ VERIFIED | `features/support/` holds loopback Auth0, REST, MQTT broker, and Homebridge stand-ins on ephemeral ports; no scenario or step names `mqtt`; `features/harness.feature` proves each fake answers its contract. Coverage weakness recorded as WR-12 below. |

**Score:** 13/20 truths verified (1 present, behavior-unverified)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | A user can tell a dead monitoring path apart from a working degraded one | Phase 5 | SC-2: "Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path"; RES-04: "only explicit credential rejection yields a persistent communication failure requiring user action". Only the user-facing surfacing defers. The representable runtime state and the type collision stay in truth 14's gap, because D-15's reversibility note says the state set Phase 5 consumes is shaped in Phase 1. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `config.schema.json` | Settings GUI for one account | ✓ VERIFIED | `strictValidation`, `singular`, `headerDisplay` warning, `widget: password`, `format: email`, `placeholder` 900, `default` 2. See WR-13 below for a schema/runtime disagreement. |
| `src/platform.ts` | Composition root, records restored accessories only | ✓ VERIFIED | 93 lines; refusal returns before listeners; `configureAccessory` only writes the map; no `unregisterPlatformAccessories` anywhere in `src/`. |
| `src/config.ts` | Refuse-never-clamp validation | ✓ VERIFIED | Fixed field order, explicit `null` refused, absent optionals defaulted, no clamping. Carries the WR-01 leak. |
| `src/logging.ts` | Redacting wrapper over all seven `Logging` members | ✓ VERIFIED | Bare callable, `log(level, ...)`, and the five levelled members all route through `redactText`/`redactParameters`. |
| `src/cloud/auth.ts` | Grant, owner-only cache, failure policy | ✓ VERIFIED | 439 lines; `AuthRejectedError` halts, `AuthThrottledError` retries long, cache invalidated on fingerprint mismatch. Carries WR-04/WR-05. |
| `src/cloud/api.ts` | Four routes, composed abort signals, narrowed bodies | ✓ VERIFIED | 147 lines; `AbortSignal.any([signal, timeout])`. Carries WR-02/WR-03. |
| `src/cloud/types.ts` | Wire types and hand-written predicates | ✓ VERIFIED | All eight declared exports present and consumed by `api.ts`. |
| `src/cloud/sigv4.ts` | Presigned AWS IoT WebSocket URL | ✓ VERIFIED | 86 lines; token appended after signing; `createHmac`/`createHash` from `node:crypto`. |
| `src/cloud/mqttTransport.ts` | Consumer-declared transport port and adapter | ⚠️ ORPHANED-BEHAVIOR | Exists, substantive, wired. `subscribeOnce`/`publishOnce` carry no deadline (WR-11), which is the mechanism behind truth 13's third consequence. |
| `src/cloud/shadow.ts` | Topic layer, signing hook, reconnect lifecycle | ✗ STUB-FREE BUT DEFECTIVE | 350 lines, fully wired. Connection state shared across connections; superseded connections never detached or ended; `openConnection` unguarded on `closing`. See truth 13. |
| `src/device/state.ts` | Merge reducer, watermark, change notification | ✗ DEFECTIVE | 234 lines, fully wired. Empty patch restamps freshness; REST path has no ordering guard. See truths 7 and 8. |
| `src/runtime/accountRuntime.ts` | Rotation, poll backstop, shadow wiring, seam | ✗ DEFECTIVE | 529 lines, fully wired. No dead-monitoring state; terminal branch silent in the failure log. See truth 14. |
| `src/runtime/retryPolicy.ts` | Capped backoff, re-entrancy guard, abortable wait | ✓ VERIFIED | 90 lines; guard and cap both unit-tested. |
| `src/runtime/failureLog.ts` | Rate-limited transient-failure discipline | ✓ VERIFIED | 70 lines; `FAILURE_REMINDER_MS` consumed at the seam. |
| `src/device/{events,health,family,gemini,halo}.ts`, `src/accessories/*`, `src/persistence/*` | Declaration-only scaffolds | ✓ VERIFIED (intended) | Zero runtime declarations each; deliberate per plan 01-03. `health.ts` carries the wrong `MonitoringPath` contract — see truth 14. |
| `features/support/*` | Loopback fakes and per-scenario world | ✓ VERIFIED | Ephemeral ports, per-scenario teardown, no client library named. |
| `.fallowrc.json` | `ignoreFindings` at exactly the eight D-17 entries | ✓ VERIFIED | Eight entries, all declaration-only scaffolds. |
| `CHANGELOG.md` | Keep a Changelog with an Unreleased section | ✓ VERIFIED | Present and in the packed artifact. |
| `package.json` | `files` allowlist, `mqtt` as only runtime dependency | ✓ VERIFIED | `files: ["dist","config.schema.json","CHANGELOG.md"]`; `dependencies: {"mqtt":"^5.15.2"}`; `type: module`; engines `^22.10.0 \|\| ^24.0.0`. `homebridge-lib` gone. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/index.ts` | `src/platform.ts` | `registerPlatform(PLATFORM_NAME, BasementGuardianPlatform)` | ✓ WIRED | One platform, no `api.hap` read. |
| `src/platform.ts` | `src/config.ts` | `validateConfig` refusal returns before listener registration | ✓ WIRED | Line 52-58. |
| `src/platform.ts` | `src/logging.ts` | `createRedactingLogger` installed before the first log call | ✓ WIRED | Line 50, before validation. |
| `src/platform.ts` | `src/runtime/accountRuntime.ts` | `createAccountRuntimeFromConfig`; `didFinishLaunching` -> start, `shutdown` -> stop | ✓ WIRED | Lines 65-85. |
| `src/cloud/api.ts` | `src/cloud/auth.ts` | `options.auth.idToken(signal)` per request | ✓ WIRED | Line 101. Deadline starts after the token fetch (WR-03). |
| `src/cloud/api.ts` | `src/cloud/types.ts` | each route narrows through its predicate | ✓ WIRED | `isApiDeviceList`, `isApiDevice`, `isAwsCredentialsResponse`, `isCommandResult`. |
| `src/cloud/shadow.ts` | `src/cloud/sigv4.ts` | `presignIotWebsocketUrl` in the URL-transform hook | ✓ WIRED | Lines 172-185. |
| `src/cloud/shadow.ts` | `src/runtime/retryPolicy.ts` | `options.retry.schedule` owns reconnect timing | ✓ WIRED | Line 224. |
| `src/cloud/shadow.ts` | `src/device/state.ts` | accepted document forwarded as `ReportedPatch` | ⚠️ WIRED, HOLLOW | Connected, but an empty document is forwarded as a real observation (truth 7). |
| `src/runtime/accountRuntime.ts` | `src/cloud/shadow.ts` | the cache rotation refreshes is the cache the signing hook reads | ✓ WIRED | `createCredentialCache` / `cache.replace`. |
| `src/runtime/accountRuntime.ts` | `src/device/state.ts` | discovery through `applyDiscovery`, patches through `applyReportedPatch` | ⚠️ WIRED, ORDERING BROKEN | Both land, but with no ordering guard between them (truth 8). |
| `src/runtime/accountRuntime.ts` | `src/device/health.ts` | `MonitoringPath` contract | ✗ NOT_WIRED | Same exported name, disjoint value sets. `DeviceHealth.monitoringPath` cannot accept `AccountRuntime.monitoringPath`. |
| `features/support/world.ts` | `src/runtime/accountRuntime.ts` | the world builds through `createAccountRuntimeFromConfig` | ✓ WIRED | Production seam, no test hook. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/device/state.ts` | `snapshot.data` | `ApiDevice.data` (REST) merged with `reported.data` (shadow) | Yes | ⚠️ FLOWING BUT REVERSIBLE — an older REST body overwrites a newer shadow value (truth 8). |
| `src/device/state.ts` | `snapshot.receivedAt` | `options.clock.now()` on every applied patch | Yes | ✗ FALSE FRESHNESS — advanced by a document carrying no observation (truth 7). |
| `src/device/state.ts` | `snapshot.shadowVersion` | `patch.version` | Yes | ⚠️ INCONSISTENT — survives a REST overwrite that replaced the data it describes. |
| `src/runtime/accountRuntime.ts` | `monitoringPath` | `handleShadowConnected` / `handleShadowDisconnected` | Yes | ✗ INCOMPLETE — no dead state; also settable by a superseded connection (truths 13, 14). |
| `src/cloud/shadow.ts` | `live` (`ShadowClient.connected`) | `handleConnect` / `handleClose` | Yes | ✗ CROSS-TALK — written by every connection the client ever opened. |
| `src/cloud/auth.ts` | `cached.idToken` | Auth0 grant or the on-disk cache | Yes | ✓ FLOWING |
| `src/cloud/shadow.ts` | signed handshake URL | `credentials.current()` re-read per handshake | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Empty shadow patch restamps freshness | `node` probe against `dist/device/state.js` | `receivedAt` 1000 -> 999999, `shadowVersion` -> 42, `data` unchanged | ✗ FAIL (defect reproduced) |
| Older REST poll reverts newer shadow value | `node` probe against `dist/device/state.js` | `primary_pump_running` true -> false; v90 re-delivery rejected | ✗ FAIL (defect reproduced) |
| Superseded connection drives live state | `node` probe against `dist/cloud/shadow.js` with injected transports | late close from A -> `connected=false`, `disconnected:transport-closed`, while B live | ✗ FAIL (defect reproduced) |
| Reopen after `close()` | `node` probe against `dist/cloud/shadow.js` | transports 1 -> 2 after close; new one never ended | ✗ FAIL (defect reproduced) |
| `monitoringPath` after terminal auth rejection | `node` probe against `dist/runtime/accountRuntime.js` | `'rest-only'`; no `recordFailure` call | ✗ FAIL (defect reproduced) |
| Nested telemetry reports changed on an identical poll | `node` probe against `dist/device/state.js` | `changedKeys === ['nested']` | ✗ FAIL (WR-07 reproduced) |
| `freeze()` protects nested state | `node` probe against `dist/device/state.js` | nested value mutated to 99 without throwing | ✗ FAIL (WR-08 reproduced) |
| Build emits the bundled protocol constants | `npm run build` then inspect `dist/` | `dist/protocol.json` present | ✓ PASS |
| Packed artifact holds only allowlisted files | `npm pack --dry-run` | `dist/**`, CHANGELOG, LICENSE, README, config.schema.json, package.json | ✓ PASS |
| Dead-code gate passes on reachability | `fallow dead-code --fail-on-issues` | 0 issues, 70 entry points, dupes 0.0% | ✓ PASS |
| Full phase gate | `npm run check` | exit 1 on run 1 (31/32 scenarios); exit 0 on runs 2-4 | ✗ FAIL (flaky) |
| Unit suite | `npm run test:unit` (inside `check`) | passed on every run | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist in this repository and no plan or summary declares one. Probe
execution: N/A. Behavioral evidence came from the built-code probes above and from the project's own
`npm run check`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CONF-01 | 01-01, 01-02 | Dynamic-platform package, TypeScript ESM, supported runtimes, child bridge | ✓ SATISFIED | `type: module`, engines `^22.10.0 \|\| ^24.0.0`, homebridge `^1.8.0 \|\| ^2.0.0`, `registerPlatform` in `src/index.ts`, `singular: true`. |
| CONF-02 | 01-04 | Settings GUI, strict validation, masked password, plaintext disclosure | ⚠️ NEEDS HUMAN | Schema artifacts all present and correct; the rendered form is unverifiable here. WR-13 (schema/runtime disagreement) noted below. |
| CONF-03 | 01-02, 01-04, 01-11 | Absent credentials -> clear error, no network/timer/accessory work | ✓ SATISFIED | `platform.ts:52-58`; three `configuration.feature` scenarios assert no listener and no request. |
| CONF-04 | 01-02, 01-04 | Optional `clientId` override, no other constant exposed | ✓ SATISFIED | `config.ts` single precedence rule against `PROTOCOL.clientId`; only `clientId` appears in `config.schema.json`. |
| CONF-05 | 01-04, 01-10 | `pollInterval` 300-3600 default ~900; `offlineConfirmationPollCount` 1-8 default 2 | ✓ SATISFIED | Bounds in `config.ts` and in the schema; boundary cases unit-tested; `pollIntervalSeconds` consumed at the seam. `offlineConfirmationPollCount` is validated and carried but not yet read — expected, Phase 5 consumes it. |
| AUTH-01 | 01-02, 01-05, 01-08, 01-10, 01-11 | Unattended password-realm grant, cached token reuse, reauthentication | ✓ SATISFIED | `auth.ts`; `authentication.feature` first-start and restart-reuse scenarios. WR-04 (concurrent duplicate grant) noted below. |
| AUTH-02 | 01-04, 01-05, 01-11 | Token under storage path, owner-only, no secret in logs or context | ✓ SATISFIED | `auth.ts:108-109` + `OWNER_ONLY_MODE`; `logging.ts` seven-member redaction; 'No credential reaches the log' scenario. The email leak (truth 4) breaches PROJECT.md's Privacy constraint but not AUTH-02's own wording, which does not list account identifiers. |
| SYNC-01 | 01-02, 01-06, 01-08 | Four typed routes, no excluded route | ✓ SATISFIED | `ROUTES` closed object; unit test asserts the exact set; `01-COVERAGE.md` records every opt-out. |
| SYNC-02 | 01-02, 01-03, 01-09, 01-11 | One canonical snapshot per device, ignore `desired`, preserve omitted | ✗ BLOCKED | Omission and `desired` exclusion hold, but truths 7 and 8 show previously accepted values being corrupted — by a document carrying no observation, and by an out-of-order REST write. |
| SYNC-03 | 01-09, 01-10, 01-11 | Complete shadow after startup and reconnect; poll as backstop; no replay | ⚠️ PARTIAL | The requests are issued and the scenarios pass. The refresh is silently discarded when the version has not advanced, which is precisely the case after a degraded period where polls wrote `data` (see truth 8's missing item). |
| SYNC-04 | 01-07, 01-08, 01-09, 01-10, 01-11 | Rotate in place ~10 min early, failed refresh stays scheduled, capped retries free of duplicate loops | ✗ BLOCKED | Rotation, the lead time, the reschedule-on-failure loop, and the cap are all correct and tested. The duplicate-loop clause fails: superseded connections are never detached or ended and can still drive state and start a reconnect (truth 13). |
| SYNC-05 | 01-02, 01-06, 01-07, 01-10, 01-11 | Idempotent abortable lifecycle, no unhandled rejection | ⚠️ PARTIAL | Idempotence and the no-unhandled-rejection property are proven by five scenarios. The leaked-work half fails: a post-`close()` reopen and an unclosed superseded transport (truth 13). |

**Orphaned requirements:** none. All twelve IDs the roadmap assigns to Phase 1 appear in at least one
plan's `requirements` field, and no additional Phase 1 ID exists in REQUIREMENTS.md.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts: **24 honored / 24 total**, none
missing. Spot-checked by hand: D-05 (`mqtt ^5.15.2` sole runtime dependency plus an in-house SigV4
presigner on `node:crypto`), D-14 (`failureLog.ts` warn-once, debug-repeat, 15-minute reminder,
info-on-recovery), D-15 (`handleShadowDisconnected` -> `rest-only` with a single warn, background
capped retry), D-16 (`config.ts` refuses rather than clamps; explicit `null` refused), D-21 (`files`
allowlist, `.npmignore` gone), D-24 (all four local pre-commit hooks now match
`(src|test|features)/`).

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `test/cloud/sigv4.test.ts` | SYNC-04 | yes | 0 | No | Value | ✓ Strong — expected signature derived independently through the four-step HMAC chain and a literal canonical request, not echoed from the module. |
| `test/device/state.test.ts` | SYNC-02 | yes | 0 | No | Value | ⚠️ Insufficient — no case for an empty patch's effect on `receivedAt`, none for a REST write against a live watermark. |
| `features/shadowMerge.feature` | SYNC-02 | yes | 0 | No | Behavioral | 🛑 **Encodes the defect.** 'A requested value never becomes device state' asserts `the canonical snapshot is at shadow version 1` after a document carrying no reported telemetry. The behavior truth 7 calls wrong is the behavior this scenario calls correct. The 32-scenario pass count is therefore not evidence for SC-3. |
| `features/shadowLifecycle.feature` | SYNC-03 | yes | 0 | No | Behavioral | ⚠️ Insufficient — the poll-reconciliation scenario runs with the broker refusing, so `shadowVersion` is undefined and the poll/shadow interaction is never exercised. |
| `features/lifecycle.feature` | SYNC-05 | yes | 0 | No | Behavioral | ⚠️ Insufficient — asserts 'records no unhandled rejection', which a leaked connection does not violate. No scenario asserts the broker holds no live connection after shutdown. |
| `features/credentialRotation.feature` | SYNC-04 | yes | 0 | No | Behavioral | ⚠️ Flaky — one assertion skips the `untilTrue` wait its siblings use; failed once in four runs. Also burns 30 real seconds. |
| `features/support/fakeShadowBroker.ts` | SYNC-04 | n/a | 0 | No | n/a | ⚠️ `verifyClient: () => !refusing` accepts every signature, so the suite would pass unchanged with a broken signer. `refuseConnections` is a switch, not an authorization test. |
| all other `test/**` | mixed | yes | 0 | No | Value / Behavioral | ✓ 384 unit tests, none skipped, no fixture-generation script found. |

**Disabled tests on requirements:** 0.
**Circular patterns detected:** 0.
**Insufficient assertions:** 4 (state, shadowLifecycle, lifecycle, fakeShadowBroker).
**Tests asserting a defect as correct:** 1 → BLOCKER, contributes to truth 7.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | `TBD` / `FIXME` / `XXX` in phase-modified files | none | 0 found across `src/`, `test/`, `features/`. |
| — | — | `TODO` / `HACK` | none | 0 found. |
| — | — | Skipped or todo tests | none | 0 found. |
| `src/device/state.ts` | 156-160 | Reference-equality `changedKeys` on a re-parsed record | ⚠️ Warning | WR-07 reproduced: two identical polls with `data: { nested: { a: 1 } }` yield `changedKeys === ['nested']`. Every non-scalar field reports as changed on every poll, pushing the duplicate-activation hazard D-19 exists to remove onto the Phase 3 consumer. Currently unreachable for Gemini's all-scalar fields; silent when it becomes reachable. |
| `src/device/state.ts` | 106-114 | Shallow `Object.freeze` with a comment promising in-place protection | ⚠️ Warning | WR-08 reproduced: a listener mutated `snapshot.data.nested.a` to 99. `notify` hands the snapshot to arbitrary listeners, which is the surface the freeze defends. |
| `src/cloud/api.ts` | 79 | `await response.json()` outside any `try` | ⚠️ Warning | WR-02: a 200 with a non-JSON body rejects with a raw `SyntaxError`, so `error instanceof CloudRequestError` branches miss and the operator loses the route label. |
| `src/cloud/api.ts` | 100-105 | Deadline built after the token fetch | ⚠️ Warning | WR-03: with a lapsed token, `sendCommand` can take ~12.5 s before its own 2.5 s clock starts, against D-038's stated 2.5 s. Latent until Phase 4 uses commands. |
| `src/cloud/auth.ts` | 403-421 | `cacheRead = true` set before the `await` that fills `cached` | ⚠️ Warning | WR-04: a concurrent caller skips a valid cache and issues a second grant. The module's own docs stress that each attempt extends a 30-day block. Also collides on the shared `${target}.${pid}.tmp` name. |
| `src/cloud/auth.ts` | 197-216 | `writeFile` without `flag: 'wx'`; no temp-file cleanup on a failed rename | ⚠️ Warning | WR-05: an existing temp file is rewritten under its current mode, defeating the 0600 guarantee; a failed rename orphans a file holding the bearer token. |
| `src/logging.ts` | 52-58 | `catch` branch reads `value.constructor.name` | ⚠️ Warning | WR-10: a circular `Object.create(null)` object logged as a parameter throws a `TypeError` out of the logger — from inside `catch` blocks that exist to prevent exactly that. |
| `src/logging.ts` | 103-111 | Append-only secret array | ⚠️ Warning | WR-09: `refreshCredentials` registers three values hourly forever. ~2 000 full string scans per log line after a month, and expired credential material retained for the process lifetime. |
| `src/cloud/shadow.ts` | 24-29 | `deviceId` interpolated into MQTT topics unescaped | ⚠️ Warning | WR-14.2: an id containing `+` or `#` creates wildcard subscriptions whose messages cannot be routed and are silently dropped. Likely unreachable for `<account>_<pump>` ids; silent if not. |
| `src/cloud/shadow.ts` | 194-198 | `get/rejected` logs a warning and returns | ⚠️ Warning | WR-14.3: a per-device blind spot inside a connection the runtime still calls `rest-and-shadow`. Nothing marks that device untrustworthy. |
| `src/cloud/shadow.ts` | 85, 337-339 | `requestFullShadow` has no production caller | ⚠️ Warning | WR-15: dead production surface. It also publishes on whatever `transport` currently holds, which after truth 13 may be a superseded connection, and its rejection would be unhandled. |
| `config.schema.json` | 9, 15-35 | Schema and `validateConfig` disagree | ⚠️ Warning | WR-13: `name` is `required` with no `minLength`, so the form accepts `""` and the plugin then refuses to start; `password`/`clientId` carry `minLength: 1` while the runtime requires `trim().length > 0`, so `" "` passes the form and is refused at runtime. Directly against SC-1's "save one valid account through the form". |
| `.gitignore` + `test/hbConfig/auth.json` | — | Force-included committed credential file | ⚠️ Warning | WR-14.1: a tracked `hashedPassword` + `salt` for a `homebridge-config-ui-x` admin. Predates this phase and is dev-only, but it is offline-crackable material in a repository intended to go public. |
| `eslint.config.js` | 89-96 | `no-floating-promises` disabled for all of `features/**` | ⚠️ Warning | WR-14.4: the stated rationale (`node:test`'s return value) does not apply to Cucumber files. The harness starts servers and clients, so the exemption hides the class of bug the lifecycle scenarios exist to catch. |

### Human Verification Required

### 1. Homebridge settings form renders and saves

**Test:** Install the built package into a real Homebridge instance. Open Plugins -> Basement Guardian -> Settings. Fill in an account and save.
**Expected:** One account block; the header states that Homebridge stores the password in plain text in `config.json` and includes it in backups; the password field is masked; a malformed email is refused by the form; saving writes the account and the plugin starts.
**Why human:** No harness renders the Homebridge settings form (ng-formworks inside the Homebridge UI). Plan 01-11 proves the refusal behavior behind the form, not the form itself. While you are there, please also try saving with the Name field cleared and with a single space in the password — WR-13 predicts the form accepts both and the plugin then refuses to start.

### 2. Heartbeat topic assumption

**Test:** Run the plugin against real hardware for at least two heartbeat intervals (~30 minutes) with debug logging on.
**Expected:** Partial telemetry arrives on `$aws/things/<deviceId>/shadow/update/accepted` roughly every 898 seconds and merges into the canonical snapshot.
**Why human:** The topic choice is an assumption the fake broker cannot falsify. Only real hardware confirms where the vendor publishes.

### 3. Real SigV4 handshake

**Test:** Open a shadow connection against the real AWS IoT endpoint using real temporary credentials from `GET /credentials/aws`.
**Expected:** The WebSocket handshake completes rather than returning HTTP 403.
**Why human:** `features/support/fakeShadowBroker.ts:165` uses `verifyClient: () => !refusing`, so the harness accepts any signature. The unit test derives the expected signature independently and is good work, but it and the harness share one reading of the spec — nothing in the repo is an external check of this path.

### Gaps Summary

Six must-haves are unmet. Four of them are one shape of failure: **a source that has stopped
carrying truth still presents as healthy.**

The merge reducer is where two of them live. A shadow document with no reported telemetry restamps
the snapshot's only freshness field, so a device that has gone quiet reads as freshly reporting —
and the vendor publishes that exact document every time it delivers a command. A REST poll
describing an earlier moment overwrites newer shadow telemetry with no ordering guard at all, and
because the version watermark survives the overwrite, the shadow's own re-delivery of the correct
value is then refused as stale. I reproduced both against the built code: a running pump reads as
not running, and it stays that way until a strictly newer version arrives, which for a quiet field
can be the next heartbeat or the next command. That second defect also quietly disables the SYNC-03
reconnect refresh, because a full shadow at an unchanged version is discarded — and a poll writing
`data` during a shadow outage is the designed D-15 behavior, not an edge case.

The shadow connection lifecycle holds the third. Connection state is four closure variables shared
by every connection the client ever opens, and superseding a connection neither detaches its
handlers nor ends it. I reproduced a late close from a superseded connection flipping the live
connection's health to disconnected. That particular consequence errs safe — it reports degraded
while healthy — but the same structure supports the unsafe direction, and "superseded connection
never ended" is literally SC-4's "leaked work". I also reproduced a reconnect opening a brand-new
connection after `close()` that nothing will ever close, though I could not demonstrate that the
production timing is reachable and I say so rather than inheriting the review's stronger claim.

The fourth is the composition seam. `MonitoringPath` has no value meaning "monitoring is dead", so a
refused credential — the one failure this project treats as terminal, after which no poll, no
credential refresh, and no shadow will ever run again — leaves the runtime reporting `'rest-only'`,
which `health.ts` documents as a working degraded path. Nothing consumes it in production yet, so
today the false normal is latent. It is still a shipped contract that is wrong: the same exported
type name carries disjoint value sets in the producer and in the declaration-only consumer plan
01-03 shipped for the next phase.

The fifth gap is smaller in mechanism and larger in policy: the malformed-email refusal quotes the
configured account email into the log. AUTH-02's own wording does not list account identifiers, but
PROJECT.md's Privacy constraint and CLAUDE.md both do, and the platform comment shows the quoting
was deliberate. That is a conflict between two project documents and wants a decision, not just a
patch.

The sixth is the phase seal itself. `npm run check` exited 1 on my first run — the credential
rotation scenario, whose client-identifier assertion is the only one in that file that skips the
`untilTrue` wait its siblings use. Three re-runs passed. A gate that certifies the phase four times
out of five certifies nothing, and it sits on the scenario proving SYNC-04.

What is genuinely good is worth saying plainly, because the fixes above should not disturb it: the
SigV4 presigner and its independently derived test, the seven-member redacting logger, the
refuse-never-clamp configuration validation, the closed four-route REST surface with its recorded
opt-out matrix, the owner-only token cache with a salted email fingerprint, the six-file packed
artifact, and a dead-code gate that passes on genuine reachability with the transitional
suppressions all removed. Twenty-four of twenty-four context decisions are honored, all twelve
requirement IDs are claimed, and no debt marker or skipped test exists anywhere in the phase's files.

---

_Verified: 2026-08-29T10:15:47Z_
_Verifier: Claude (gsd-verifier)_
