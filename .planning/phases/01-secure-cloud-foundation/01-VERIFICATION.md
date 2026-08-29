---
phase: 01-secure-cloud-foundation
verified: 2026-08-29T13:41:43Z
status: human_needed
score: 19/20 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 13/20
  gaps_closed:
    - "No account identifier reaches the Homebridge log"
    - "An omitted-field shadow document cannot corrupt a previously accepted value"
    - "REST snapshots and partial shadow updates produce one current state per device, with neither source reverting the other"
    - "Repeated shadow connection cycles leave no superseded connection driving live state and no connection nothing will close"
    - "The runtime can express that monitoring has stopped, and its monitoring-path contract matches the one its declared consumer uses"
    - "`npm run check` passes typecheck, lint, all three fallow sub-commands, format:check, and both test suites"
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "A user can tell a dead monitoring path apart from a working degraded one"
    addressed_in: "Phase 5"
    evidence: "Phase 5 SC-2: 'Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path'. The representable runtime state and the type contract are now delivered in this phase; only the user-facing surfacing defers."
  - truth: "A heartbeat-only telemetry key survives the first poll after shadow ownership is released, marked stale rather than dropped"
    addressed_in: "Phase 3"
    evidence: "Phase 3 SC-6: 'An invalid, omitted, or stale field preserves the last valid value and faults or deactivates only the narrowest owning scope'. `pollTelemetry` (src/device/state.ts:164-166) still replaces telemetry wholesale when no watermark is held. Not a regression — the pre-fix code clobbered unconditionally — and marking a key stale needs the per-scope trust machinery Phase 3 owns. Recorded in 01-17's Deferral Register."
  - truth: "A rejected complete-shadow request marks the affected device scope untrustworthy"
    addressed_in: "Phase 3"
    evidence: "Phase 3 SC-6, same trust machinery. `src/cloud/shadow.ts:257-261` warns and returns, leaving a per-device blind spot inside a connection the runtime still calls `shadow-and-poll`. Recorded in 01-17's Deferral Register as WR-14 item 3."
behavior_unverified_items:
  - truth: "Administrator can install the dynamic platform and save one valid account through the Homebridge settings form, with the password-storage warning visible (SC-1, CONF-01, CONF-02)"
    test: "Install the built package into a real Homebridge instance, open Plugins -> Basement Guardian -> Settings, and save a valid account."
    expected: "The form renders one account block; the header states that Homebridge stores the password in plain text in config.json and in backups; the password field is masked; a malformed email is refused by the form; saving writes the account and the plugin starts."
    why_human: "No harness renders the Homebridge settings form (ng-formworks inside the Homebridge UI). Plan 01-11 proves the refusal behavior behind the form, not the form itself."
  - truth: "The vendor publishes device heartbeats on the update-accepted topic the client subscribes to"
    test: "Run the plugin against real hardware for at least two heartbeat intervals (~30 minutes) with debug logging on."
    expected: "Partial telemetry arrives on `$aws/things/<deviceId>/shadow/update/accepted` roughly every 898 seconds and merges into the canonical snapshot."
    why_human: "The topic choice is an assumption the fake broker cannot falsify; only real hardware confirms where the vendor publishes."
  - truth: "The presigned AWS IoT WebSocket URL is accepted by the real broker (SYNC-04)"
    test: "Open a shadow connection against the real AWS IoT endpoint with real temporary credentials from `GET /credentials/aws`."
    expected: "The handshake completes rather than returning HTTP 403."
    why_human: "`features/support/fakeShadowBroker.ts:173` still uses `verifyClient: () => !refusing` — the harness accepts every signature, so the integration suite would pass unchanged if `presignIotWebsocketUrl` produced garbage. Deliberately deferred here by 01-17's Deferral Register (WR-12 item 1): a third implementation from the same reading of the specification could not falsify that reading."
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
**Verified:** 2026-08-29T13:41:43Z
**Status:** human_needed
**Re-verification:** Yes — after six gap-closure plans (01-12 through 01-17). Previous run: `gaps_found`, 13/20.

## Summary

All six gaps close. I reproduced each fix against freshly built code with my own probes rather than
reading the summaries, and every one behaves as claimed. The four remaining items are the three
human checks that were already unresolvable here plus a short list of warnings, none of which is a
must-have failure.

The two probes the brief flagged as most likely to be wrong in a way tests would miss are the two I
spent the most effort on, and both hold:

- **Advance-but-never-establish is really implemented.** `nextShadowVersion`
  (`src/device/state.ts:205-211`) returns `undefined` when a patch carries no observation and no
  watermark exists, so an observation-free document cannot take telemetry ownership from the poll.
  Probe A: an empty patch at v42 against a poll-only snapshot left `shadowVersion` undefined and
  `receivedAt` at 1000, and the next poll still replaced telemetry. Probe B: the same patch against a
  snapshot already holding v42 advanced the watermark to 50 and left `receivedAt` at 2000. That is
  exactly the shape the plan-checker's block was about, and the shipped code is on the right side of
  it.
- **`releaseShadowSource()` covers every path that ends shadow ownership.** All four disconnect
  reasons route through `release()` -> `options.onDisconnected` ->
  `handleShadowDisconnected` -> `store.releaseShadowSource()`, and the unit suite has one case per
  reason (`SYNC-03 hands telemetry back to the poll when the connection reports
  transport-closed / transport-error / subscription-refused / handshake-refused`). The one
  documented exception — nothing releases at `stop()` — is sound for the reason 01-17 gives: `close()`
  sets `closing` before ending the transport, so the teardown close reaches nothing, and `root.abort()`
  has already ended every wait and request, so no later poll exists for the held ownership to hold off.
  I checked that reasoning by tracing the code rather than accepting it.

D-15 survives the ownership rule (probe C: after a release the poll writes `data` again), and the
SYNC-03 reconnect refresh is no longer silently discarded (a full shadow at an unchanged v90 now
applies). 01-17's derivation is consistent because the path is computed from three held facts in one
function rather than assigned wherever something changed; a failing poll reporting `unavailable` even
with a live shadow is the deliberate direction, and it errs toward degraded rather than toward the
false normal the project forbids. 01-16's shared-grant tradeoff is bounded as claimed — `inFlight`
clears in a `finally`, and `fetchGrant` rethrows a caller-requested abort untouched without recording
a transient failure — and it is unreachable this phase, because `sendCommand` has no production caller.

No regression surfaced against the original eleven plans. Every truth that passed last time still
passes, the packed artifact is unchanged at 84 files, the dead-code gate still passes on genuine
reachability with the same eight scaffold suppressions, and all 24 trackable CONTEXT decisions are
still honored.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **SC-1** Administrator can install the dynamic platform and save one valid account through the settings form, with the password-storage warning visible | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `config.schema.json` carries `strictValidation`, `singular`, the plaintext-storage `headerDisplay`, `widget: password`, `format: email`. The WR-13 schema/runtime disagreement is closed: `name` now carries `minLength: 1` + `pattern: "\\S"`, and `password`/`clientId` carry the same `\S` pattern the runtime's `trim().length > 0` enforces. Still no harness renders the form. |
| 2 | **SC-2a** Missing configuration leaves the plugin idle with a clear log message | ✓ VERIFIED | `src/platform.ts:62-66` returns before registering any listener; `features/configuration.feature` now four scenarios asserting refusal text, no lifecycle listener, no accessory, no request reaching the fake cloud. |
| 3 | **SC-2b** Valid configuration authenticates without exposing credentials or tokens | ✓ VERIFIED | `features/authentication.feature` 'No credential reaches the log'; `src/logging.ts` wraps all seven `Logging` members; `auth.ts` registers the bearer token on first sight. |
| 4 | No account identifier reaches the log (PROJECT.md Privacy, CLAUDE.md) | ✓ VERIFIED (was FAILED) | `src/config.ts:107-109` now returns `'the account email must be an email address.'` with no interpolation; `src/platform.ts:48-57` records why quoting was rejected rather than leaving the documents in conflict. New scenario `features/configuration.feature:36-45` asserts `no logged line contains the configured account email`. |
| 5 | **SC-3a** A partial shadow `reported` patch merges and removes no field it omits | ✓ VERIFIED | `mergeRecord` at `state.ts:119-121`; `features/shadowMerge.feature` 'A partial heartbeat keeps the fields it omits'. |
| 6 | **SC-3b** A `desired`/requested value never becomes reported device state | ✓ VERIFIED | `ReportedPatch` has no member able to hold it; `toReportedPatch` reads only `state.reported`; no delta or wildcard topic in `SHADOW_TOPICS`. |
| 7 | **SC-3c** An omitted-field document cannot corrupt a previously accepted value | ✓ VERIFIED (was FAILED) | Probe A/B against `dist/device/state.js`: empty patch leaves `receivedAt` unchanged; establishes no watermark from `undefined`; advances one it already held. `carriesObservation` (state.ts:195-197), `nextShadowVersion` (205-211), `nextSnapshot` (218-230). The scenario that encoded the defect is rewritten — `features/shadowMerge.feature:40-50` now asserts `carries no shadow version` and `carries the receipt time the scenario started at`. Unit cases at `test/device/state.test.ts:197, 356, 379, 403, 418`. |
| 8 | **SC-3d** REST snapshots and shadow updates produce one current state per device, neither reverting the other | ✓ VERIFIED (was FAILED) | Probe D: an older REST body against a live v90 watermark left `primary_pump_running` true and the watermark at 90. `pollTelemetry` (state.ts:164-166) keeps `data` shadow-sourced while a watermark is held. Probe C: after `releaseShadowSource()` the poll writes `data` again (D-15 preserved) and a full shadow at the unchanged v90 applies (SYNC-03 refresh no longer discarded). New scenario `features/shadowLifecycle.feature:26-40` runs a short poll interval against a live shadow. |
| 9 | **SC-4a** A complete shadow is requested on the first connection and again after every reconnect | ✓ VERIFIED | `requestEveryShadow` (shadow.ts:340-363) subscribes then publishes a get per device, and only then reports `onConnected`. Two `shadowLifecycle.feature` scenarios assert 1 then 2 requests across a forced reconnect. The prior caveat is gone: the refresh is applied, not discarded. |
| 10 | **SC-4b** Credential rotation refreshes the cache in place without disturbing the live connection | ✓ VERIFIED | `accountRuntime.ts:377-384` calls `cache.replace` only; `signHandshake` (shadow.ts:235-248) re-reads the cache per handshake; `features/credentialRotation.feature` asserts 1 handshake across rotation, then rotated material and identifiers on the next. |
| 11 | **SC-4c** Reconnect backoff is capped and a single transport failure produces exactly one retry chain | ✓ VERIFIED | `retryPolicy.ts` pending guard plus `Math.min(maxDelayMs, ...)`; `reconnectPeriod: 0` disables the library timer; unit cases cover the duplicate-notification case. |
| 12 | **SC-4d** Shutdown during an in-flight retry wait, an in-flight request, and an open shadow connection produces no unhandled rejection; `stop()` is idempotent | ✓ VERIFIED | `accountRuntime.ts:543-551` guards on `stopped`, aborts once, swallows a close rejection; six `features/lifecycle.feature` scenarios. |
| 13 | **SC-4e** Repeated connection cycles leave no superseded connection driving live state and no connection nothing will close | ✓ VERIFIED (was FAILED) | Per-connection `ShadowConnection` record (shadow.ts:103-111) plus the `isCurrent` generation guard (216-218) on all four handlers. Probe 1: a late close and a late error from superseded connection A left `connected` true, emitted nothing, and scheduled nothing while B was live; `previous.transport.end()` (shadow.ts:431) had already ended A. Probe 2: a retry firing after `close()` opened no second transport — `openConnection` refuses once `closing` (406-408). Probe 4: `onConnected` no longer fires at the handshake, only after the subscription resolves. Unit cases at `test/cloud/shadow.test.ts` ('stays connected when a connection it has replaced closes', 'schedules no reconnect when a connection it has replaced fails', 'opens no connection when a reconnect wait elapses after shutdown'). New scenario `features/lifecycle.feature:37-50` shuts down with a reconnect pending and asserts `the broker holds no live connection`. `attemptShadow` re-checks `hasStopped()` after `await client.start()` and closes (accountRuntime.ts:320-324); probe C confirmed the close. WR-11 closed: `OPERATION_DEADLINE_MS` reaches `within()` in `mqttTransport.ts:103-126`. |
| 14 | The runtime can express that monitoring has stopped, and its monitoring-path contract matches its declared consumer's | ✓ VERIFIED (was FAILED) | One `MonitoringPath` declaration, `src/device/health.ts:23`, imported by `accountRuntime.ts:21`. `monitoringPathNow()` (226-232) derives from `halted`, `polling`, `shadowConnected`. Probe: `unavailable` before anything succeeds, `unavailable` after a terminal `AuthRejectedError` with `recordFailure(AUTHENTICATION, …)` recorded, `unavailable` while throttled, `poll-only` after a successful launch, `shadow-and-poll` once the shadow reports connected, back to `unavailable` when the poll starts failing. `features/degradedOperation.feature` uses the renamed values. See W2/W3 below for two design notes. |
| 15 | `npm run check` passes typecheck, lint, all three fallow sub-commands, format:check, and both suites | ✓ VERIFIED (was FAILED) | Exit 0 in this run. 455 unit tests, 0 fail, 0 skipped. 35 scenarios / 299 steps in 12.8 s (was ~40 s). `assertClientIdentifiers` now waits through `this.untilTrue` (`features/support/steps/shadow.ts:296-304`); rotation timing is injected through `rotationLeadMs`/`minRotationDelayMs` on the seam and set by the harness (`features/support/world.ts:494`). |
| 16 | `npm pack --dry-run` lists only the allowlisted files (D-21) | ✓ VERIFIED | 84 files, 67.9 kB: `dist/**`, CHANGELOG.md, LICENSE, README.md, config.schema.json, package.json. |
| 17 | Exactly four typed REST routes exist and no excluded route is constructible (SYNC-01) | ✓ VERIFIED | `ROUTES` closed constant; `devicePath` the only builder; unit test asserts the exact value set. |
| 18 | The token cache lives under the Homebridge storage path with owner-only mode and a salted email fingerprint (AUTH-02, D-08) | ✓ VERIFIED | Unchanged guarantees, plus WR-05 hardening: exclusive create at `0o600` (`flag: 'wx'`), random temporary suffix, cleanup on a failed rename. |
| 19 | Every module of the adopted tree exists, not-yet-wired modules are declaration-only, and the dead-code gate passes on reachability (D-17) | ✓ VERIFIED | `fallow dead-code --fail-on-issues` clean; `health` 0 above threshold, maintainability 92.8; `dupes` 0.0%. `.fallowrc.json` `ignoreFindings` holds exactly the eight scaffold entries. |
| 20 | The deterministic suite runs offline against transport-level fakes naming no client library (D-10, D-11) | ✓ VERIFIED | 35 scenarios green offline; `features/support/` holds loopback Auth0, REST, MQTT broker, and Homebridge stand-ins on ephemeral ports. |

**Score:** 19/20 truths verified (1 present, behavior-unverified)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | A user can tell a dead monitoring path apart from a working degraded one | Phase 5 | Phase 5 SC-2. The representable state and the type contract are now delivered here; only the surfacing defers. |
| 2 | A heartbeat-only telemetry key survives the first poll after ownership release, marked stale rather than dropped | Phase 3 | Phase 3 SC-6. `pollTelemetry` still replaces telemetry wholesale when no watermark is held (`state.ts:164-166`). Not a regression — the pre-fix code clobbered unconditionally. 01-17 Deferral Register. |
| 3 | A rejected complete-shadow request marks the affected device scope untrustworthy | Phase 3 | Phase 3 SC-6. `shadow.ts:257-261` warns and returns. 01-17 Deferral Register (WR-14 item 3). |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `config.schema.json` | Settings GUI for one account, agreeing with the runtime | ✓ VERIFIED | `name` gained `minLength: 1` + `pattern: "\\S"`; `password` and `clientId` carry `pattern: "\\S"`. WR-13 closed. |
| `src/platform.ts` | Composition root, records restored accessories only | ✓ VERIFIED | 101 lines; refusal returns before listeners; quoting rationale recorded at 48-57. |
| `src/config.ts` | Refuse-never-clamp validation, no identifier in the message | ✓ VERIFIED | 154 lines; the email refusal names the field and the rule and quotes nothing. |
| `src/logging.ts` | Redacting wrapper, bounded over uptime | ✓ VERIFIED | 179 lines; `SecretRole` makes a rotated value replace its predecessor (WR-09); `describeObject` no longer reads `constructor.name` (WR-10). Probed both. |
| `src/cloud/auth.ts` | Grant, owner-only cache, failure policy, one grant per lapse | ✓ VERIFIED | 484 lines; shared `cacheRead` promise and shared `inFlight` grant (WR-04); exclusive create + cleanup (WR-05). |
| `src/cloud/api.ts` | Four routes, deadline-first composition, typed parse failures | ✓ VERIFIED | 176 lines; `readBody`/`unreadable` replace an escaping `SyntaxError` (WR-02); the deadline is built before `idToken` (WR-03). |
| `src/cloud/sigv4.ts` | Presigned AWS IoT WebSocket URL | ✓ VERIFIED | Unchanged; independently derived unit test. External check remains human item 3. |
| `src/cloud/mqttTransport.ts` | Consumer-declared transport port with an operation deadline | ✓ VERIFIED (was ORPHANED-BEHAVIOR) | `within()` bounds `subscribe` and `publish` and cancels the timer on settle; `endOnce` force-drops a client that never connected. |
| `src/cloud/shadow.ts` | Topic layer, signing hook, generation-guarded reconnect lifecycle | ✓ VERIFIED (was DEFECTIVE) | 458 lines. Per-connection state, `isCurrent` on all four handlers, `closing` guard inside `openConnection`, previous transport ended on supersede, `requestFullShadow` removed, wildcard identifiers refused. |
| `src/device/state.ts` | Merge reducer, source ownership, change notification | ✓ VERIFIED (was DEFECTIVE) | 330 lines. `carriesObservation`, `nextShadowVersion`, `pollTelemetry`, `releaseShadowSource`, `freezeDeep`, `isSameValue`. |
| `src/runtime/accountRuntime.ts` | Rotation, poll backstop, shadow wiring, derived monitoring path | ✓ VERIFIED (was DEFECTIVE) | 633 lines. Path derived from three facts; terminal auth halts and records; shutdown window closed; rotation timing injectable. |
| `src/device/health.ts` | Single `MonitoringPath` declaration and the trust projection | ✓ VERIFIED | 53 lines; `'shadow-and-poll' \| 'poll-only' \| 'unavailable'`, one declaration in the repo, consumed by the runtime. The four declarations below it stay scaffolds for Phase 3. |
| `src/runtime/retryPolicy.ts`, `src/runtime/failureLog.ts` | Capped backoff, rate-limited failure discipline | ✓ VERIFIED | Unchanged; both unit-tested. |
| `src/device/{events,family,gemini,halo}.ts`, `src/accessories/*`, `src/persistence/*` | Declaration-only scaffolds | ✓ VERIFIED (intended) | Zero runtime declarations each; eight `.fallowrc.json` entries. |
| `features/support/*` | Loopback fakes and per-scenario world | ✓ VERIFIED | Rotation timing injectable; `clientIds` assertion now waits. `verifyClient` still accepts every signature — human item 3. |
| `.gitignore` | No tracked credential file | ✓ VERIFIED (was WARNING) | `/test/hbConfig/*` ignored with only `config.example.json` exempted; `auth.json` is gone from the index. |
| `eslint.config.js` | Floating-promise exemption scoped to the unit tree | ✓ VERIFIED (was WARNING) | `files: ['test/**/*.ts']`; the Cucumber harness is no longer exempt. WR-14.4 closed. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/index.ts` | `src/platform.ts` | `registerPlatform(PLATFORM_NAME, …)` | ✓ WIRED | One platform, no `api.hap` read. |
| `src/platform.ts` | `src/config.ts` | refusal returns before listener registration | ✓ WIRED | Lines 60-66. |
| `src/platform.ts` | `src/logging.ts` | redacting logger installed before the first log call | ✓ WIRED | Line 58. |
| `src/platform.ts` | `src/runtime/accountRuntime.ts` | `createAccountRuntimeFromConfig`; launch -> start, shutdown -> stop | ✓ WIRED | Lines 73-93. |
| `src/cloud/api.ts` | `src/cloud/auth.ts` | the operation deadline is built first and handed to `idToken` | ✓ WIRED | `send()` line 128-130. WR-03 closed. |
| `src/cloud/shadow.ts` | `src/cloud/mqttTransport.ts` | the client supplies the operation deadline the transport enforces | ✓ WIRED | `deadlineMs: OPERATION_DEADLINE_MS` at shadow.ts:418, consumed at mqttTransport.ts:187/191. |
| `src/cloud/shadow.ts` | `src/runtime/retryPolicy.ts` | reconnect stays owned by the capped policy; the opener refuses once closing | ✓ WIRED | `options.retry.schedule` at shadow.ts:287; `closing` guard at 406-408. **Note:** `gsd query verify.key-links` reports this link unverified — 01-14's YAML pattern is double-escaped (`retry\\.schedule`), so the tool matches a literal backslash. Tool false negative; the wiring is present. |
| `src/cloud/shadow.ts` | `src/device/state.ts` | an accepted document is forwarded as a `ReportedPatch` and claims an observation only when it carries one | ✓ WIRED | `toReportedPatch` (185-194) -> `carriesObservation` (195-197). No longer hollow. |
| `src/runtime/accountRuntime.ts` | `src/device/state.ts` | a lost connection releases shadow ownership so the poll takes telemetry back over | ✓ WIRED | `handleShadowDisconnected` -> `store.releaseShadowSource()` at accountRuntime.ts:268; four unit cases, one per disconnect reason. |
| `src/runtime/accountRuntime.ts` | `src/device/health.ts` | `MonitoringPath` contract | ✓ WIRED (was NOT_WIRED) | `import type { MonitoringPath } from '../device/health.js'` at line 21; one declaration in the repo. |
| `src/runtime/accountRuntime.ts` | `src/cloud/shadow.ts` | the cache rotation refreshes is the cache the signing hook reads | ✓ WIRED | `createCredentialCache` / `cache.replace`. |
| `config.schema.json` | `src/config.ts` | the form's non-blank rule and required list match the validator's | ✓ WIRED | `pattern: "\\S"` against `trim().length > 0`. |
| `features/support/world.ts` | `src/runtime/accountRuntime.ts` | the world builds through `createAccountRuntimeFromConfig`, now carrying injected rotation timing | ✓ WIRED | Line 494. Production seam, no test hook. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/device/state.ts` | `snapshot.data` | `reported.data` while a watermark is held, `ApiDevice.data` otherwise | Yes | ✓ FLOWING — ownership is single-valued and released on disconnect; the revert is gone. |
| `src/device/state.ts` | `snapshot.receivedAt` | `clock.now()` only when a patch carried an observation, or on any successful poll | Yes | ✓ FLOWING — an observation-free document no longer restamps it. |
| `src/device/state.ts` | `snapshot.shadowVersion` | `patch.version`, advanced but never established by an observation-free patch; cleared by `releaseShadowSource` | Yes | ✓ FLOWING — one meaning: defined means the shadow owns `data`. |
| `src/runtime/accountRuntime.ts` | `monitoringPath` | derived from `halted`, `polling`, `shadowConnected` | Yes | ✓ FLOWING — three values, computed not assigned; see W2/W3. |
| `src/cloud/shadow.ts` | `connection.live` | the current connection alone, through `isCurrent` | Yes | ✓ FLOWING — cross-talk removed. |
| `src/cloud/auth.ts` | `cached.idToken` | Auth0 grant or the on-disk cache, shared through one promise | Yes | ✓ FLOWING |
| `src/cloud/shadow.ts` | signed handshake URL | `credentials.current()` re-read per handshake | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Observation-free patch against no watermark establishes none and leaves `receivedAt` | node probe on `dist/device/state.js` | `shadowVersion` undefined, `receivedAt` 1000, next poll wrote telemetry | ✓ PASS |
| Observation-free patch against an existing watermark advances it, `receivedAt` frozen | node probe | v42 -> v50, `receivedAt` 2000 -> 2000 | ✓ PASS |
| D-15: poll writes telemetry after ownership release | node probe | `pump` false after release + poll | ✓ PASS |
| SYNC-03: full shadow at an unchanged version is applied after release | node probe | v90 re-delivery applied, `pump` true | ✓ PASS |
| Older REST poll against a live watermark does not revert | node probe | `pump` stayed true, watermark 90, connectivity refreshed | ✓ PASS |
| Deep freeze protects a nested telemetry value | node probe | `TypeError` on write, value unchanged | ✓ PASS (WR-08 closed) |
| Identical repeated poll with a structured value reports no change | node probe | no listener notified | ✓ PASS (WR-07 closed) |
| Superseded connection cannot drive live state or schedule a retry | node probe on `dist/cloud/shadow.js` | late close + error from A: `connected` still true, 0 events, 0 retries; A ended | ✓ PASS |
| No reopen after `close()` | node probe | transports stayed at 1 after close + retry fire | ✓ PASS |
| `onConnected` waits for the subscription | node probe | `connected` false while subscribe pending; true after it resolves | ✓ PASS |
| Wildcard device identifier refused from the topic set | node probe | only `d1` topics subscribed | ✓ PASS (WR-14.2 closed) |
| `monitoringPath` after a terminal `AuthRejectedError` | node probe on `dist/runtime/accountRuntime.js` | `'unavailable'`, `recordFailure('Authentication', …)` recorded | ✓ PASS |
| `monitoringPath` with a live shadow and a failing poll | node probe | `shadow-and-poll` -> `unavailable` | ✓ PASS |
| Shadow disconnect releases store ownership | node probe | `shadowVersion` 7 -> undefined, path `shadow-and-poll` -> `poll-only` | ✓ PASS |
| Shutdown landing while `client.start()` resolves closes the client | node probe | `close()` called once | ✓ PASS |
| Circular null-prototype object logged as a parameter | node probe on `dist/logging.js` | `[unserializable object]`, no throw | ✓ PASS (WR-10 closed) |
| Role-scoped secret registration stays bounded | node probe | 50 rotations, newest redacted, superseded not retained | ✓ PASS (WR-09 closed) |
| Full phase gate | `npm run check` | exit 0 | ✓ PASS |
| Unit suite | inside `check` | 455 tests, 455 pass, 0 fail, 0 skipped | ✓ PASS |
| Acceptance suite | inside `check` | 35 scenarios, 299 steps, all pass, 12.8 s | ✓ PASS |
| Dead-code / health / dupes gate | `fallow` | 0 issues; 0 above threshold; maintainability 92.8; duplication 0.0% | ✓ PASS |
| Packed artifact | `npm pack --dry-run` | 84 files, allowlist only | ✓ PASS |
| Decision coverage | `gsd query check.decision-coverage-verify` | 24 honored / 24 total | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist in this repository and no plan or summary declares one. Probe
execution: N/A. Behavioral evidence came from the built-code probes above and from the project's own
`npm run check`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CONF-01 | 01-01, 01-02 | Dynamic-platform package, TypeScript ESM, supported runtimes, child bridge | ✓ SATISFIED | Unchanged and still true. |
| CONF-02 | 01-04, 01-15 | Settings GUI, strict validation, masked password, plaintext disclosure | ⚠️ NEEDS HUMAN | Schema artifacts correct and now in agreement with the runtime; the rendered form is unverifiable here. |
| CONF-03 | 01-02, 01-04, 01-11, 01-15 | Absent or invalid credentials -> clear error, no network/timer/accessory work | ✓ SATISFIED | Four `configuration.feature` scenarios, including the malformed-email refusal, each asserting no listener and no request. |
| CONF-04 | 01-02, 01-04 | Optional `clientId` override, no other constant exposed | ✓ SATISFIED | Single precedence rule against `PROTOCOL.clientId`. |
| CONF-05 | 01-04, 01-10 | `pollInterval` 300-3600 default ~900; `offlineConfirmationPollCount` 1-8 default 2 | ✓ SATISFIED | Bounds in `config.ts` and the schema; `offlineConfirmationPollCount` validated and carried for Phase 5. |
| AUTH-01 | 01-02, 01-05, 01-08, 01-10, 01-11, 01-16 | Unattended password-realm grant, cached token reuse, reauthentication | ✓ SATISFIED | Plus one grant per lapse however many callers want it (WR-04 closed). |
| AUTH-02 | 01-04, 01-05, 01-11, 01-15, 01-16 | Token under storage path, owner-only, no secret in logs or context | ✓ SATISFIED | Owner-only guaranteed by exclusive create; the account email no longer reaches the log, closing the PROJECT.md Privacy conflict. |
| SYNC-01 | 01-02, 01-06, 01-08, 01-16 | Four typed routes, no excluded route | ✓ SATISFIED | Closed `ROUTES`; every failure now a typed vendor error. |
| SYNC-02 | 01-02, 01-03, 01-09, 01-11, 01-13 | One canonical snapshot per device, ignore `desired`, preserve omitted | ✓ SATISFIED (was BLOCKED) | Truths 5-8. One source owns telemetry at a time; an observation-free document corrupts nothing. |
| SYNC-03 | 01-09, 01-10, 01-11, 01-13 | Complete shadow after startup and reconnect; poll as backstop; no replay | ✓ SATISFIED (was PARTIAL) | `releaseShadowSource` on every disconnect reason makes the reconnect refresh apply rather than be discarded. |
| SYNC-04 | 01-07..01-12, 01-14 | Rotate in place ~10 min early, failed refresh stays scheduled, capped retries free of duplicate loops | ✓ SATISFIED (was BLOCKED) | Rotation unchanged; the duplicate-loop clause now holds — superseded connections are ended and cannot schedule a retry. |
| SYNC-05 | 01-02, 01-06, 01-07, 01-10, 01-11, 01-14, 01-17 | Idempotent abortable lifecycle, no unhandled rejection, no leaked work | ✓ SATISFIED (was PARTIAL) | No reopen after close; the `attemptShadow` stop window is closed; a scenario asserts the broker holds no live connection after a shutdown with a reconnect pending. |

**Orphaned requirements:** none. All twelve IDs the roadmap assigns to Phase 1 appear in at least one
plan's `requirements` field.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts: **24 honored / 24 total**, none
missing. Spot-checked by hand after the gap set: D-13 (terminal rejection halts, records, and reports
`unavailable`), D-15 (release on disconnect, poll as source, one warn), D-16 (refuse never clamp),
D-22 (throttle waits on the long interval and is not terminal), D-24 (all four local pre-commit hooks
still match `(src|test|features)/`).

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `test/device/state.test.ts` | SYNC-02, SYNC-03 | yes | 0 | No | Value | ✓ Strong — the establish-vs-advance rule has four dedicated cases plus a release suite of five; the previously missing empty-patch and REST-against-watermark cases both exist now. |
| `features/shadowMerge.feature` | SYNC-02 | yes | 0 | No | Behavioral | ✓ Fixed — 'A requested value becomes neither device state nor a fresh receipt time' now asserts `carries no shadow version` and `carries the receipt time the scenario started at`. The scenario that encoded the defect asserts the correction. |
| `features/shadowLifecycle.feature` | SYNC-03 | yes | 0 | No | Behavioral | ✓ Strong — a new scenario runs a short poll interval against a live shadow, which is the interaction the previous suite could not see. |
| `features/lifecycle.feature` | SYNC-05 | yes | 0 | No | Behavioral | ✓ Strong — 'Shutdown while a reconnect is pending leaves no live connection' asserts `the broker holds no live connection`, not just the absence of a rejection. |
| `features/credentialRotation.feature` | SYNC-04 | yes | 0 | No | Behavioral | ✓ Deterministic — the client-identifier assertion waits through `untilTrue`; rotation timing is injected, so the scenario no longer burns 30 real seconds. |
| `test/cloud/shadow.test.ts` | SYNC-04, SYNC-05 | yes | 0 | No | Behavioral | ✓ Strong — six cases specifically on a replaced connection, plus 'opens no connection when a reconnect wait elapses after shutdown'. |
| `test/runtime/accountRuntime.test.ts` | SYNC-05, D-13 | yes | 0 | No | Behavioral | ✓ Strong — four monitoring-path cases including both terminal-authentication branches, and the stop-window close. |
| `test/cloud/sigv4.test.ts` | SYNC-04 | yes | 0 | No | Value | ✓ Strong, with the standing caveat that it and the harness share one reading of the specification — human item 3. |
| `features/support/fakeShadowBroker.ts` | SYNC-04 | n/a | 0 | No | n/a | ⚠️ `verifyClient: () => !refusing` still accepts every signature. Deliberately deferred by 01-17 to human item 3, with a reason I accept. |
| all other `test/**` | mixed | yes | 0 | No | Value / Behavioral | ✓ 455 unit tests, none skipped, no fixture-generation script. |

**Disabled tests on requirements:** 0.
**Circular patterns detected:** 0.
**Insufficient assertions:** 0 blocking. One harness limitation deferred to human verification.
**Tests asserting a defect as correct:** 0 (was 1).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | `TBD` / `FIXME` / `XXX` in phase files | none | 0 found across `src/`, `test/`, `features/`, `config.schema.json`, `.fallowrc.json`. |
| — | — | `TODO` / `HACK` | none | 0 found. Every `placeholder` hit is a deliberate stand-in identifier in a fixture, not a stub. |
| — | — | Skipped or todo tests | none | 0 found. |
| `src/cloud/shadow.ts` | 91, 436-438 | `ShadowClient.connected` has no production consumer, and `close()` never clears `connection.live` | ⚠️ W1 | Dead production surface. After `close()` the getter still reads `true` because `closing` short-circuits the close handler through `isCurrent`. Nothing in `src/` reads it — the runtime uses `onConnected`/`onDisconnected` — so it is unobservable today, but it is a boolean that says "connected" about a closed client. |
| `src/runtime/accountRuntime.ts` | 226-232, 543-551 | `stopped` is not one of the facts the monitoring path is derived from | ⚠️ W2 | After `stop()` the path keeps its last value, so a runtime that has shut down can still read `shadow-and-poll`. This is deliberate and tested (`SYNC-05 leaves the monitoring path where it stood, because a shutdown is not a monitoring failure`), and the process is exiting when it happens. Worth a human decision because truth 14's wording is "can express that monitoring has stopped", and this is one case where it does not. One line closes it. |
| `src/runtime/accountRuntime.ts` | 227 | A failing poll reports `unavailable` even while the shadow is live and delivering | ⚠️ W3 | Deliberate: polling is the reconciliation backstop, so the plugin will not vouch for what it holds without it. The direction errs toward degraded rather than toward a false normal, which is the right way to be wrong here. Recorded so Phase 5 knows this is the contract it inherits, not an accident. |
| `src/cloud/auth.ts` | `sharedGrant` | A joining caller inherits the opening caller's cancellation | ⚠️ W4 | Bounded and self-correcting as 01-16 claims: `inFlight` clears in a `finally`, and `fetchGrant` rethrows a caller-requested abort untouched without recording a transient failure. Unreachable this phase — `sendCommand` has no production caller. One thing for Phase 4: `runPoll`'s catch exempts only `root.signal.aborted`, so a poll cancelled by a command's 2.5 s deadline would be recorded as a poll failure and would flip the path to `unavailable`. |
| `src/device/state.ts` | 164-166 | The first poll after ownership release drops heartbeat-only telemetry keys | ⚠️ W5 | Deferred to Phase 3 (SC-6) and recorded in 01-17's Deferral Register. Not a regression: the pre-fix code clobbered on every poll. |
| `src/cloud/shadow.ts` | 257-261 | A rejected complete-shadow request leaves a per-device blind spot | ⚠️ W6 | Deferred to Phase 3 (SC-6). The device keeps the poll, so the scope is narrowed rather than lost. |
| `.planning/phases/01-secure-cloud-foundation/01-14-PLAN.md` | 45 | Key-link pattern is double-escaped (`retry\\.schedule`) | ⚠️ W7 | `gsd query verify.key-links` reports the link unverified even though `options.retry.schedule` is at `shadow.ts:287`. Planning-artifact defect, not a code defect. Confirmed by matching the literal and the intended pattern separately. |
| `.planning/phases/01-secure-cloud-foundation/01-17-SUMMARY.md` | Gate Results table | Reports 457 unit tests | ⚠️ W8 | Measured 455 in this run. Two-test discrepancy in a summary claim. No test is skipped or missing; the count is simply wrong. Noted because summary numbers are what a later reader trusts. |

### Human Verification Required

### 1. Homebridge settings form renders and saves

**Test:** Install the built package into a real Homebridge instance. Open Plugins -> Basement Guardian -> Settings. Fill in an account and save.
**Expected:** One account block; the header states that Homebridge stores the password in plain text in `config.json` and includes it in backups; the password field is masked; a malformed email is refused by the form; saving writes the account and the plugin starts.
**Why human:** No harness renders the Homebridge settings form (ng-formworks inside the Homebridge UI). The WR-13 disagreement is closed, so the previous ask — try a cleared Name field and a single-space password — should now be refused by the form rather than accepted and then refused at runtime. Worth confirming that while you are there.

### 2. Heartbeat topic assumption

**Test:** Run the plugin against real hardware for at least two heartbeat intervals (~30 minutes) with debug logging on.
**Expected:** Partial telemetry arrives on `$aws/things/<deviceId>/shadow/update/accepted` roughly every 898 seconds and merges into the canonical snapshot.
**Why human:** The topic choice is an assumption the fake broker cannot falsify. Only real hardware confirms where the vendor publishes.

### 3. Real SigV4 handshake

**Test:** Open a shadow connection against the real AWS IoT endpoint using real temporary credentials from `GET /credentials/aws`.
**Expected:** The WebSocket handshake completes rather than returning HTTP 403.
**Why human:** `features/support/fakeShadowBroker.ts:173` still uses `verifyClient: () => !refusing`, so the harness accepts any signature. 01-17 deliberately did not close this, and the reason is sound: a third implementation written from the same reading of the specification cannot falsify that reading. Only a real handshake can.

### Gaps Summary

No gaps. All six previously failing must-haves now pass, verified by reproduction against freshly
built code rather than by reading the summaries.

The four gap fixes that carried the goal's word "trustworthy" all landed on the correct side of the
tradeoffs they had to make. `shadowVersion` now carries one meaning — defined means the shadow owns
`data` — and everything else follows from it: a poll cannot revert newer shadow telemetry, a
disconnect hands telemetry back to the poll on all four reasons, and the reconnect refresh applies at
an unchanged version instead of being silently dropped. The advance-but-never-establish rule that the
plan-checker blocked the first draft over is present and correct in the shipped code, and it has four
dedicated unit cases plus a rewritten scenario. Connection state is per-connection behind a generation
guard, superseded transports are ended, the opener refuses to run during shutdown, and transport
operations carry a deadline, so both halves of SC-4's "leaked work" clause hold. `MonitoringPath` has
one declaration with a value meaning nothing is working, derived from three facts rather than assigned
wherever something changed.

Three things stay open and none is a code defect. The Homebridge settings form cannot be rendered by
any harness here; the vendor's heartbeat topic is an assumption only real hardware can confirm; and
the fake broker accepts every handshake signature, which 01-17 declined to change for a reason I
accept. Those three are the whole of `human_needed`.

Eight warnings are recorded above. W2, W3, and W4 are design contracts rather than bugs, and each is
written down so Phase 4 and Phase 5 inherit them knowingly rather than by surprise. W1 is a dead
`connected` getter that reports true about a closed client — unobservable today, and either wire it or
drop it before something starts reading it. W5 and W6 are recorded deferrals to Phase 3 with a
matching success criterion. W7 and W8 are planning-artifact defects: a double-escaped key-link pattern
that makes a wired link report unverified, and a summary that claims two more unit tests than exist.

---

_Verified: 2026-08-29T13:41:43Z_
_Verifier: Claude (gsd-verifier)_
