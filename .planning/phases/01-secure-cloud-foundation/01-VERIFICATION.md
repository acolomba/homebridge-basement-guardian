---
phase: 01-secure-cloud-foundation
verified: 2026-08-29T15:15:27Z
status: human_needed
score: 19/20 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 19/20
  scope: "delta re-verification of the seven files changed since 229e496 (two source, five test)"
  gaps_closed: []
  gaps_remaining: []
  regressions: []
  warnings_closed:
    - "W1 — `ShadowClient.connected` read true after `close()`"
    - "W2 — `monitoringPathNow()` did not derive from `stopped`"
    - "W8 — the 457-unit-test claim in 01-17-SUMMARY.md, corrected in 01-18-SUMMARY.md"
  warnings_opened:
    - "W9 — 01-VALIDATION.md still marks the D-21 packing check manual after test/packedArtifact.test.ts automated it"
deferred:
  - truth: "A user can tell a dead monitoring path apart from a working degraded one"
    addressed_in: "Phase 5"
    evidence: "Phase 5 SC-2: 'Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path'. The representable runtime state and the type contract are delivered in this phase; only the user-facing surfacing defers. `unavailable` now covers four conditions (nothing started, halted for good, shut down, poll failing), which is the complete list Phase 5 inherits."
  - truth: "A heartbeat-only telemetry key survives the first poll after shadow ownership is released, marked stale rather than dropped"
    addressed_in: "Phase 3"
    evidence: "Phase 3 SC-6: 'An invalid, omitted, or stale field preserves the last valid value and faults or deactivates only the narrowest owning scope'. `pollTelemetry` (src/device/state.ts:164-166) still replaces telemetry wholesale when no watermark is held. Not a regression — the pre-fix code clobbered unconditionally. Recorded in 01-17's Deferral Register."
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
    why_human: "`features/support/fakeShadowBroker.ts:173` still uses `verifyClient: () => !refusing` — the harness accepts every signature, so the integration suite would pass unchanged if `presignIotWebsocketUrl` produced garbage. Deliberately deferred here by 01-17's Deferral Register (WR-12 item 1)."
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
**Verified:** 2026-08-29T15:15:27Z
**Status:** human_needed
**Re-verification:** Yes — delta re-verification against commit `229e496`. Previous run: `human_needed`, 19/20.

## Scope of this run

Seven files changed since the previous report: `src/cloud/shadow.ts`, `src/runtime/accountRuntime.ts`,
and five test files. I confirmed that set myself with `git diff --stat 229e496..HEAD -- src/ test/`
before deciding what to re-check, rather than taking the delta description on trust. The six
gap-closure conclusions from the previous run are carried forward except where the delta touches them,
which it does in two places: the shadow client's connection state (truth 13) and the runtime's
monitoring-path derivation (truth 14). Both were re-checked in full.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **SC-1** Administrator can install the dynamic platform and save one valid account through the settings form, with the password-storage warning visible | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Unchanged by the delta. `config.schema.json` carries `strictValidation`, `singular`, the plaintext-storage `headerDisplay`, `widget: password`, `format: email`; `name`/`password`/`clientId` carry the `\S` pattern the runtime's `trim().length > 0` enforces. Still no harness renders the form. New this run: `test/packageManifest.test.ts` pins the install-side half — `engines.node`, `engines.homebridge`, `type: module`, `main`, the package name against `PLUGIN_NAME`, and the `homebridge-plugin`/`supports-hap` keywords. That closes the silent-drift risk under CONF-01 but not the rendered form. |
| 2 | **SC-2a** Missing configuration leaves the plugin idle with a clear log message | ✓ VERIFIED | `src/platform.ts:62-66` returns before registering any listener; four `features/configuration.feature` scenarios assert refusal text, no lifecycle listener, no accessory, no request reaching the fake cloud. Untouched by the delta. |
| 3 | **SC-2b** Valid configuration authenticates without exposing credentials or tokens | ✓ VERIFIED | `features/authentication.feature` 'No credential reaches the log'; `src/logging.ts` wraps all seven `Logging` members; `auth.ts` registers the bearer token on first sight. Untouched. |
| 4 | No account identifier reaches the log (PROJECT.md Privacy, CLAUDE.md) | ✓ VERIFIED | `src/config.ts:107-109` returns `'the account email must be an email address.'` with no interpolation; `features/configuration.feature:36-45` asserts no logged line contains the configured account email. Untouched. |
| 5 | **SC-3a** A partial shadow `reported` patch merges and removes no field it omits | ✓ VERIFIED | `mergeRecord` at `state.ts:119-121`; `features/shadowMerge.feature` 'A partial heartbeat keeps the fields it omits'. Untouched. |
| 6 | **SC-3b** A `desired`/requested value never becomes reported device state | ✓ VERIFIED | `ReportedPatch` has no member able to hold it; `toReportedPatch` reads only `state.reported`; no delta or wildcard topic in `SHADOW_TOPICS`. Untouched. |
| 7 | **SC-3c** An omitted-field document cannot corrupt a previously accepted value | ✓ VERIFIED | `carriesObservation` (state.ts:195-197), `nextShadowVersion` (205-211), `nextSnapshot` (218-230) unchanged since the previous run's probes A/B. `src/device/state.ts` is not in the delta; the five unit cases at `test/device/state.test.ts:197, 356, 379, 403, 418` and the rewritten `features/shadowMerge.feature:40-50` all ran green in this run's gate. |
| 8 | **SC-3d** REST snapshots and shadow updates produce one current state per device, neither reverting the other | ✓ VERIFIED | `pollTelemetry` (state.ts:164-166) unchanged. The delta's only reach into this area is `handleShadowDisconnected`'s caller, which is untouched (accountRuntime.ts:269-279). The four-reason `releaseShadowSource` loop (`test/runtime/accountRuntime.test.ts:1186-1200`) still runs one case per disconnect reason, all green. |
| 9 | **SC-4a** A complete shadow is requested on the first connection and again after every reconnect | ✓ VERIFIED | `requestEveryShadow` (shadow.ts:340-363) unchanged by the delta; two `shadowLifecycle.feature` scenarios assert 1 then 2 requests across a forced reconnect. |
| 10 | **SC-4b** Credential rotation refreshes the cache in place without disturbing the live connection | ✓ VERIFIED | `accountRuntime.ts:377-384` region unchanged; `signHandshake` (shadow.ts:232-248) re-reads the cache per handshake; `features/credentialRotation.feature` asserts 1 handshake across rotation. |
| 11 | **SC-4c** Reconnect backoff is capped and a single transport failure produces exactly one retry chain | ✓ VERIFIED | `retryPolicy.ts` pending guard plus `Math.min(maxDelayMs, ...)`; `reconnectPeriod: 0` disables the library timer. All nine backoff cases plus the duplicate-notification case green in this run. |
| 12 | **SC-4d** Shutdown during an in-flight retry wait, an in-flight request, and an open shadow connection produces no unhandled rejection; `stop()` is idempotent | ✓ VERIFIED | `accountRuntime.ts:551-559` guards on `stopped`, aborts once, swallows a close rejection; six `features/lifecycle.feature` scenarios. The delta added `stopped` as a *read* in `monitoringPathNow`; the write order in `stop()` is unchanged (`stopped = true` → `root.abort()` → `closeQuietly`). |
| 13 | **SC-4e** Repeated connection cycles leave no superseded connection driving live state and no connection nothing will close | ✓ VERIFIED | Re-checked against the delta. `isCurrent` (shadow.ts:216-218) and `release` (226-230) are byte-for-byte unchanged, so 01-14's one-disconnection-per-connection contract is intact — the delta reads `closing`, it does not write it and raises no notification. The generation guard is still on all four handlers (381, 386, 391, 396), `openConnection` still refuses once `closing` (407-408), and `previous.transport.end()` is still on the supersede path (429). **W1 closed:** `connected` is now `!closing && (connection?.live ?? false)` (shadow.ts:443-444), so a closed client reports itself closed. New unit case `reports not connected once the client itself has been closed` (test/cloud/shadow.test.ts:613-624) calls `client.close()` — the path the runtime uses — rather than closing the transport, which is why the old case did not catch this. |
| 14 | The runtime can express that monitoring has stopped, and its monitoring-path contract matches its declared consumer's | ✓ VERIFIED | Re-checked against the delta. One `MonitoringPath` declaration, `src/device/health.ts:23`, imported by `accountRuntime.ts:21`; `gsd query verify.key-links` on 01-17-PLAN.md reports both links verified. **W2 closed:** `monitoringPathNow()` (accountRuntime.ts:233-239) now reads `if (stopped \|\| halted \|\| !polling)`. The truth's own wording is "can express that monitoring has stopped", and under the old derivation there was exactly one path where it could not. Judgment on the reversal is below. Unit case `SYNC-05 reports monitoring unavailable once the runtime has stopped` (test:929-935) asserts `shadow-and-poll` → `unavailable`; the aborted-poll case was re-aimed at the failure log, which is what it was always about. |
| 15 | `npm run check` passes typecheck, lint, all three fallow sub-commands, format:check, and both suites | ✓ VERIFIED | Exit 0 in this run. **464** unit tests, 0 fail, 0 skipped, 0 todo. 35 scenarios / 299 steps in 12.7 s. `fallow`: dead-code 0 issues, health 0 above threshold / maintainability 92.9, dupes 0.0%. Also ran `npm run test:coverage:all`: exit 0, 100% lines / branches / functions across all files, including both branches the delta added. |
| 16 | `npm pack --dry-run` lists only the allowlisted files (D-21) | ✓ VERIFIED | 84 files, 68.3 kB: `dist/**`, CHANGELOG.md, LICENSE, README.md, config.schema.json, package.json. **Now asserted rather than inspected:** `test/packedArtifact.test.ts` runs `npm pack --dry-run --json` and checks the allowlist as a property. I proved it fails first — see Behavioral Spot-Checks. |
| 17 | Exactly four typed REST routes exist and no excluded route is constructible (SYNC-01) | ✓ VERIFIED | `ROUTES` closed constant; `devicePath` the only builder. **Strengthened:** three new cases in `test/cloud/api.test.ts:509-562` assert the exported operation set, the paths actually reached when all four operations run, and the absence of any excluded account-management path family. I proved both doors — see Behavioral Spot-Checks. |
| 18 | The token cache lives under the Homebridge storage path with owner-only mode and a salted email fingerprint (AUTH-02, D-08) | ✓ VERIFIED | Unchanged. Exclusive create at `0o600` (`flag: 'wx'`), random temporary suffix, cleanup on a failed rename. One qualification recorded by 01-SECURITY finding 2: the cached `id_token` payload carries an `email` claim, so the file does hold the address even though the metadata does not. Low impact (`0o600`, already a bearer token), and the fix is a grant-scope change nobody has confirmed the tenant accepts. |
| 19 | Every module of the adopted tree exists, not-yet-wired modules are declaration-only, and the dead-code gate passes on reachability (D-17) | ✓ VERIFIED | `fallow dead-code --fail-on-issues` clean; `.fallowrc.json` `ignoreFindings` holds exactly the eight scaffold entries, unchanged. |
| 20 | The deterministic suite runs offline against transport-level fakes naming no client library (D-10, D-11) | ✓ VERIFIED | 35 scenarios green offline; `features/support/` holds loopback Auth0, REST, MQTT broker, and Homebridge stand-ins on ephemeral ports. |

**Score:** 19/20 truths verified (1 present, behavior-unverified)

### Judgment on the W2 reversal

The brief asks me to judge whether `unavailable` should be reachable by a clean shutdown, since I wrote
the truth it was measured against. **The reversal is correct, and I would have asked for it.**

Three reasons, in order of weight.

1. **The type's own documentation already picks the second reading.** `src/device/health.ts:17-23`
   defines `MonitoringPath` as "How the plugin is currently receiving device state", and
   `DeviceHealth.monitoringPath` is a state-source field beside `untrusted` and `lastReceivedAt`, not a
   fault field. Nothing in that file calls `unavailable` a fault. 01-17's reading — that `unavailable`
   reports a fault, so a shutdown must not produce it — was never written down in the type it was
   reading. The executor took the reading the declaration supports.
2. **The direction of the error is the one this project forbids.** Before the change, a runtime that
   had called `stop()`, aborted every wait and request, and closed its socket could still answer
   `shadow-and-poll` — a healthy combined path, from a runtime feeding nothing. That is the false
   normal PROJECT.md's safety semantics rule out, and it is the one direction the runtime cannot
   correct afterwards, because nothing runs again. The old behavior errs toward normal; the new one
   errs toward degraded.
3. **A shutdown is still not called a fault.** I checked this rather than accepting it. `stop()`
   (accountRuntime.ts:551-559) sets `stopped`, calls `root.abort()`, and awaits `closeQuietly` — it
   touches `options.failures` nowhere. `close()` sets `closing`, which makes `isCurrent` false, so the
   teardown raises no `onDisconnected` and `handleShadowDisconnected` never records `SHADOW_DEGRADED`.
   The retitled unit case `SYNC-05 records no failure when a shutdown aborts a poll already in flight`
   asserts the empty warning list directly, and the earlier stop case asserts `warnings: []` too. Only
   the derived report moved.

The reversal is also the thing 01-14 anticipated. Its next-plan note (01-14-SUMMARY.md:398-400) says
that if 01-17 wants `monitoringPath` to move to a terminal state at `stop()`, it must set it there,
because nothing from the shadow client will. 01-17 chose not to; 01-18 did. And 01-17's *method* — a
value computed from held facts in one function — is what made the reversal a one-line change instead
of an audit of every assignment site. The method stands; only its conclusion moved.

One consequence, recorded rather than fixed: `unavailable` now covers four conditions — nothing has
started, halted for good, shut down, and the poll is failing. 01-17 already flagged the first two as a
distinction Phase 5 must make deliberately. The list is now complete, which is the useful form for
Phase 5 to inherit. It stays deferred item 1 below.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | A user can tell a dead monitoring path apart from a working degraded one | Phase 5 | Phase 5 SC-2. The representable state and the type contract are delivered here; only the surfacing defers. `unavailable` now covers four conditions and the list is complete. |
| 2 | A heartbeat-only telemetry key survives the first poll after ownership release, marked stale rather than dropped | Phase 3 | Phase 3 SC-6. `pollTelemetry` still replaces telemetry wholesale when no watermark is held (`state.ts:164-166`). Not a regression. 01-17 Deferral Register. |
| 3 | A rejected complete-shadow request marks the affected device scope untrustworthy | Phase 3 | Phase 3 SC-6. `shadow.ts:257-261` warns and returns. 01-17 Deferral Register (WR-14 item 3). |

### Required Artifacts

Only the artifacts the delta touched, or whose status changed, carry new detail. Everything else is
carried forward from the previous run and re-confirmed present and substantive.

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/cloud/shadow.ts` | Topic layer, signing hook, generation-guarded reconnect lifecycle | ✓ VERIFIED | 465 lines (+7). `connected` derives from `closing` and `connection.live` together (443-444). `connection.live` stays the only record of whether a connection can carry a message — no second flag was introduced, so the two cannot drift. `isCurrent`, `release`, `openConnection`, and `close` are unchanged. |
| `src/runtime/accountRuntime.ts` | Rotation, poll backstop, shadow wiring, derived monitoring path | ✓ VERIFIED | 641 lines (+8, all comment except one condition). `monitoringPathNow` derives from four facts (233-239). `runPoll`'s abort comment now names what the early return protects rather than the path, which the shutdown pins. |
| `src/device/health.ts` | Single `MonitoringPath` declaration and the trust projection | ✓ VERIFIED | 53 lines, untouched by the delta. One declaration in the repo, consumed by the runtime. |
| `src/cloud/api.ts` | Four routes, deadline-first composition, typed parse failures | ✓ VERIFIED | 176 lines, untouched. `CloudApi` (47-52) declares exactly four operations; `createCloudApi` returns exactly four keys. |
| `test/cloud/api.test.ts` | SYNC-01 closed-door prohibition cases | ✓ VERIFIED — genuine | 562 lines (+79). `invocations()` is annotated `Record<keyof CloudApi, () => Promise<unknown>>` and `reachedRoutes()` reads `stubFetch`'s recorded traffic, not `ROUTES`. Both doors proved by mutation — see spot-checks. |
| `test/packedArtifact.test.ts` | An assertion over the packed file list (T-01-60) | ✓ VERIFIED — genuine | 54 lines, new. Property assertion over `npm pack --dry-run --json`, not a 84-path fixture. Refuses to run against an unbuilt `dist/` rather than passing vacuously. Proved to fail on a widened allowlist. |
| `test/packageManifest.test.ts` | Declared runtime ranges (CONF-01) | ✓ VERIFIED | 53 lines, new. Asserts the whole `engines` object, `type`, `main`, the name against `PLUGIN_NAME`, and the Homebridge keywords. |
| `test/cloud/shadow.test.ts` | Connection-lifecycle cases | ✓ VERIFIED | +14 lines: one case closing the client rather than the transport. |
| `test/runtime/accountRuntime.test.ts` | Monitoring-path and shutdown cases | ✓ VERIFIED | +14/-6: one case rewritten for the new shutdown behavior, one re-aimed at the failure log with its arrange and act unchanged, so `runPoll`'s abort branch is still reached. |
| `config.schema.json`, `src/platform.ts`, `src/config.ts`, `src/logging.ts`, `src/cloud/auth.ts`, `src/cloud/sigv4.ts`, `src/cloud/mqttTransport.ts`, `src/device/state.ts`, `src/runtime/{retryPolicy,failureLog}.ts` | As previously verified | ✓ VERIFIED (carried forward) | Not in the delta. Re-confirmed present, substantive, and green under this run's gate. |
| `src/device/{events,family,gemini,halo}.ts`, `src/accessories/*`, `src/persistence/*` | Declaration-only scaffolds | ✓ VERIFIED (intended) | Zero runtime declarations each; eight `.fallowrc.json` entries, count unchanged. |
| `features/support/*` | Loopback fakes and per-scenario world | ✓ VERIFIED | Untouched. `verifyClient` still accepts every signature — human item 3. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/cloud/shadow.ts` | itself — `closing` and `connection.live` | `connected` reads both facts that decide it | ✓ WIRED | shadow.ts:443-444. Single source of truth preserved: `close()` writes `closing`, `release`/`attach` write `live`, and neither writes the other. |
| `src/runtime/accountRuntime.ts` | itself — `stopped`, `halted`, `polling`, `shadowConnected` | `monitoringPathNow()` derives from four held facts | ✓ WIRED | accountRuntime.ts:233-239. `stopped` is written in exactly one place (556) and read in three. |
| `src/runtime/accountRuntime.ts` | `src/device/health.ts` | `MonitoringPath` contract | ✓ WIRED | `import type { MonitoringPath }` at line 21; `gsd query verify.key-links` on 01-17-PLAN.md: 2/2 verified. |
| `src/runtime/accountRuntime.ts` | `src/device/state.ts` | a lost connection releases shadow ownership so the poll takes telemetry back over | ✓ WIRED | `handleShadowDisconnected` → `store.releaseShadowSource()` at accountRuntime.ts:274; four unit cases, one per disconnect reason (test:1186-1200), all green. Unaffected by the delta. |
| `src/cloud/shadow.ts` | consumer via `options.onDisconnected` | `release` is the only caller and `isCurrent` gates every path into it | ✓ WIRED | shadow.ts:216-230. 01-14's contract intact: the delta reads `closing` and adds no notification. |
| `src/cloud/shadow.ts` | `src/runtime/retryPolicy.ts` | reconnect stays owned by the capped policy; the opener refuses once closing | ✓ WIRED | `options.retry.schedule` at shadow.ts:287; `closing` guard at 407-408. **Note:** `gsd query verify.key-links` still reports this link unverified — 01-14-PLAN.md's YAML pattern is double-escaped (`retry\\.schedule`), so the tool matches a literal backslash. Tool false negative confirmed again this run; the wiring is present. |
| `test/cloud/api.test.ts` | `src/cloud/api.ts` | `Record<keyof CloudApi, …>` makes a fifth operation a compile error | ✓ WIRED | Proved by mutation. `tsconfig.test.json` includes `test/`, and `npm test` runs `build:test` first, so the door is inside the gate. |
| `test/packedArtifact.test.ts` | `package.json` `files` | `npm pack --dry-run --json` over the real working tree | ✓ WIRED | Proved by mutation. |
| Everything else | — | as previously verified | ✓ WIRED (carried forward) | Not in the delta. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/cloud/shadow.ts` | `connected` | `closing` and the current connection's `live` | Yes | ✓ FLOWING — derived from two writers, neither of which writes the other. No cached boolean. |
| `src/runtime/accountRuntime.ts` | `monitoringPath` | `stopped`, `halted`, `polling`, `shadowConnected` | Yes | ✓ FLOWING — four values, computed not assigned; see W3. |
| `test/cloud/api.test.ts` | `routesReached` | `stubFetch` recording real `globalThis.fetch` calls | Yes | ✓ FLOWING — observes traffic, does not read `ROUTES`. |
| `test/packedArtifact.test.ts` | `packedPaths()` | `execFileSync('npm', ['pack', '--dry-run', '--json'])` | Yes | ✓ FLOWING — real subprocess against the real tree; throws rather than returning an empty list. |
| `src/device/state.ts` | `snapshot.data` / `receivedAt` / `shadowVersion` | as previously traced | Yes | ✓ FLOWING (carried forward) |
| `src/cloud/auth.ts` | `cached.idToken` | Auth0 grant or the on-disk cache, shared through one promise | Yes | ✓ FLOWING (carried forward) |

### Behavioral Spot-Checks

Every mutation below ran in an isolated copy of the tree under the scratch directory, with
`node_modules` symlinked. The working tree was never modified; `git status --porcelain` over `src/`
and `test/` is clean.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full phase gate | `npm run check` | exit 0 | ✓ PASS |
| Unit suite | inside `check` | 464 tests, 464 pass, 0 fail, 0 skipped, 0 todo | ✓ PASS |
| Acceptance suite | inside `check` | 35 scenarios, 299 steps, all pass, 12.7 s | ✓ PASS |
| Coverage gate | `npm run test:coverage:all` | exit 0; 100% lines / branches / functions all files; `shadow.js` and `accountRuntime.js` each 100/100/100 | ✓ PASS |
| Dead-code / health / dupes | `fallow` inside `check` | 0 issues; 0 above threshold; maintainability 92.9; duplication 0.0% | ✓ PASS |
| W1: a closed client reports itself closed | `test/cloud/shadow.test.ts#reports not connected once the client itself has been closed` | `{ whileUp: true, afterClose: false }` | ✓ PASS |
| W2: a stopped runtime reports monitoring gone | `test/runtime/accountRuntime.test.ts#SYNC-05 reports monitoring unavailable once the runtime has stopped` | `shadow-and-poll` → `unavailable` | ✓ PASS |
| W2: shutdown still records no failure | `…#SYNC-05 records no failure when a shutdown aborts a poll already in flight` | warning list empty | ✓ PASS |
| **SYNC-01 closed door, type level** | added a fifth operation `accounts()` to `CloudApi` + an implementation, then `tsc -p tsconfig.test.json --noEmit` | 3 errors, two of them `TS2741: Property 'accounts' is missing … but required in type 'Record<keyof CloudApi, …>'` at `api.test.ts:492` and `:503` | ✓ PASS — the door is real, and `npm test` runs `build:test` first, so it is inside the gate |
| **SYNC-01 closed door, traffic level** | added `void fetch(\`${options.baseUrl}/users\`, …)` inside `devices()`, leaving `ROUTES` untouched, then ran the api suite | `reaches only the four declared routes…` ✖ and `touches no excluded account-management path family…` ✖ | ✓ PASS — the test observes real traffic, not the declared constants; a bypass that never touches `ROUTES` still fails it |
| SYNC-01 operation-set case under the same mutation | same run | `offers exactly four operations…` ✔ (runtime key set unchanged) | ℹ Expected — that case is the runtime half; the type half is what catches an added-and-implemented operation |
| **T-01-60 pack gate, vacuous-pass guard** | ran `packedArtifact.test.js` against a tree with no `dist/` | both cases ✖ with `Error: the packed artifact carries no dist/index.js … run \`npm run build\` first` | ✓ PASS — cannot pass vacuously |
| **T-01-60 pack gate, widened allowlist** | added `"src"` to `package.json` `files`, with `dist/` present | `packs nothing beyond the compiled output…` ✖, listing all 27 leaked `src/**` paths | ✓ PASS — genuine fail-first |
| Packed artifact | `npm pack --dry-run` | 84 files, 68.3 kB, allowlist only | ✓ PASS |
| Unit count reconciles | 456 (01-18) + 3 api + 3 manifest + 2 packed = 464 | measured 464 | ✓ PASS — the delta's test additions account for the count exactly, with nothing unexplained |
| Anti-pattern scan | `grep -rnE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` over `src/ test/ features/ config.schema.json .fallowrc.json` | 0 matches | ✓ PASS |
| Skipped / todo tests | grep for `.skip` / `todo:` in `test/` and `features/` | 0 matches | ✓ PASS |
| Tracked credential file | `git ls-files test/hbConfig/` | `config.example.json` only | ✓ PASS |
| Previous run's probes (state store, logging, superseded connections, wildcard refusal, rotation) | carried forward | not re-run — the files are not in the delta and all their cases are green in this run's gate | ℹ Carried forward |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist in this repository and no plan or summary declares one. Probe
execution: N/A. Behavioral evidence came from the mutation experiments above and from the project's
own `npm run check` and `npm run test:coverage:all`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CONF-01 | 01-01, 01-02 | Dynamic-platform package, TypeScript ESM, supported runtimes, child bridge | ✓ SATISFIED | Strengthened: `test/packageManifest.test.ts` now pins `engines`, `type`, `main`, name, and keywords, so a dependency bump cannot drift them silently. The child-bridge clause stays Manual-Only by 01-VALIDATION's own routing — a child bridge is a Homebridge process feature the plugin can only supply a precondition for. |
| CONF-02 | 01-04, 01-15 | Settings GUI, strict validation, masked password, plaintext disclosure | ⚠️ NEEDS HUMAN | Schema artifacts correct and in agreement with the runtime; the rendered form is unverifiable here. |
| CONF-03 | 01-02, 01-04, 01-11, 01-15 | Absent or invalid credentials → clear error, no network/timer/accessory work | ✓ SATISFIED | Four `configuration.feature` scenarios, each asserting no listener and no request. |
| CONF-04 | 01-02, 01-04 | Optional `clientId` override, no other constant exposed | ✓ SATISFIED | Single precedence rule against `PROTOCOL.clientId`. |
| CONF-05 | 01-04, 01-10 | `pollInterval` 300-3600 default ~900; `offlineConfirmationPollCount` 1-8 default 2 | ✓ SATISFIED | Bounds in `config.ts` and the schema. |
| AUTH-01 | 01-02, 01-05, 01-08, 01-10, 01-11, 01-16 | Unattended password-realm grant, cached token reuse, reauthentication | ✓ SATISFIED | Unchanged; one grant per lapse however many callers want it. |
| AUTH-02 | 01-04, 01-05, 01-11, 01-15, 01-16 | Token under storage path, owner-only, no secret in logs or context | ✓ SATISFIED | Owner-only by exclusive create; the account email does not reach the log. Qualified by 01-SECURITY finding 2 (the `id_token` payload carries an `email` claim) — recorded, low impact, no register row. |
| SYNC-01 | 01-02, 01-06, 01-08, 01-16 | Four typed routes, no excluded route | ✓ SATISFIED | Now with a real prohibition test on both the type surface and the observed traffic, proved fail-first this run. |
| SYNC-02 | 01-02, 01-03, 01-09, 01-11, 01-13 | One canonical snapshot per device, ignore `desired`, preserve omitted | ✓ SATISFIED | Truths 5-8, untouched by the delta. |
| SYNC-03 | 01-09, 01-10, 01-11, 01-13 | Complete shadow after startup and reconnect; poll as backstop; no replay | ✓ SATISFIED | `releaseShadowSource` on every disconnect reason; the four-reason loop still green. |
| SYNC-04 | 01-07..01-12, 01-14, 01-18 | Rotate in place ~10 min early, failed refresh stays scheduled, capped retries free of duplicate loops | ✓ SATISFIED | Plus a `connected` report that can no longer describe a closed client as connected. |
| SYNC-05 | 01-02, 01-06, 01-07, 01-10, 01-11, 01-14, 01-17, 01-18 | Idempotent abortable lifecycle, no unhandled rejection, no leaked work | ✓ SATISFIED | Plus a monitoring path that reads `unavailable` after `stop()` rather than the healthy path it last held. |
| REL-04 | 01-19 (early) | Packed-package checks exclude secrets and identifiers | ℹ EARLY COVERAGE | REQUIREMENTS.md maps REL-04 to Phase 6. `test/packedArtifact.test.ts` closes the Phase 1 decision D-21 and the Phase 1 threat T-01-60 ahead of it. Not a Phase 1 obligation; noted so Phase 6 knows the assertion already exists. |

**Orphaned requirements:** none. All twelve IDs the roadmap assigns to Phase 1 appear in at least one
plan's `requirements` field.

### Security Posture

`01-SECURITY.md` is `status: verified`, `threats_open: 0`: 103 declared threats, 99 closed by control,
4 accepted risks (AR-01..AR-04), 1 opened by audit and closed by remediation.

I checked the one that moved. **T-01-60** was open at high severity because plan 01-11's register
declared a positive assertion over the packed file list and no such assertion existed — the check had
been run once by hand and then described in a summary as asserted. That is the exact failure mode this
verifier is built to catch, and the audit caught it correctly. `test/packedArtifact.test.ts` closes it,
and I proved the closure fail-first twice rather than reading the claim.

**AR-04** deserves a line here because it is new and it is not one of the findings the brief lists as
settled. `test/hbConfig/auth.json` is gone from the index (`git ls-files test/hbConfig/` returns
`config.example.json` alone, dropped in `cc8e8d0`) but remains in published history. Accepted by the
maintainer on the grounds that it is a salted `homebridge-config-ui-x` password hash for a throwaway
local dev admin on no reachable host, and that a history rewrite on a pushed public branch breaks every
clone and violates the project's own no-rewrite rule. I record the residual action rather than
re-litigating the acceptance: treat that dev password as burned.

The five findings recorded without a register row are carried forward unchanged and are not re-raised.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | `TBD` / `FIXME` / `XXX` / `TODO` / `HACK` in phase files | none | 0 found across `src/`, `test/`, `features/`, `config.schema.json`, `.fallowrc.json`. |
| — | — | Skipped or todo tests | none | 0 found. 464 unit tests, none skipped. |
| `src/cloud/shadow.ts` | 91, 443 | `ShadowClient.connected` still has no production consumer | ℹ W1 (reduced) | The false-status half is closed and unit-tested. What remains is a public boolean nothing in `src/` reads — the runtime uses `onConnected`/`onDisconnected`. `fallow dead-code` passes on it because the unit suite consumes it. Not a defect; it is the surface 01-14 wrote for a consumer that has not arrived. Phase 3 or Phase 5 will either read it or it should go. |
| `src/runtime/accountRuntime.ts` | 237 | A failing poll reports `unavailable` even while the shadow is live and delivering | ⚠️ W3 | Unchanged and deliberate: polling is the reconciliation backstop, so the plugin will not vouch for what it holds without it. Errs toward degraded rather than toward a false normal. Recorded so Phase 5 inherits it as a contract, not a surprise. |
| `src/cloud/auth.ts` | `sharedGrant` | A joining caller inherits the opening caller's cancellation | ⚠️ W4 | Unchanged. Bounded and self-correcting: `inFlight` clears in a `finally`, `fetchGrant` rethrows a caller-requested abort untouched. Unreachable this phase — `sendCommand` has no production caller. Phase 4 note: `runPoll`'s catch exempts only `root.signal.aborted`, so a poll cancelled by a command's 2.5 s deadline would be recorded as a poll failure and would flip the path to `unavailable`. |
| `src/device/state.ts` | 164-166 | The first poll after ownership release drops heartbeat-only telemetry keys | ⚠️ W5 | Deferred to Phase 3 (SC-6), 01-17 Deferral Register. Not a regression. |
| `src/cloud/shadow.ts` | 257-261 | A rejected complete-shadow request leaves a per-device blind spot | ⚠️ W6 | Deferred to Phase 3 (SC-6). The device keeps the poll, so the scope is narrowed rather than lost. |
| `.planning/phases/01-secure-cloud-foundation/01-14-PLAN.md` | 45 | Key-link pattern is double-escaped (`retry\\.schedule`) | ⚠️ W7 | Unchanged. `gsd query verify.key-links` reports 01-14's second link unverified even though `options.retry.schedule` is at `shadow.ts:287`. Planning-artifact defect, not a code defect. Re-confirmed this run. |
| `.planning/phases/01-secure-cloud-foundation/01-VALIDATION.md` | 36, 80 | The D-21 packing check is still marked `manual (packaging inspection)` / `⬜ manual` | ⚠️ W9 (new) | `test/packedArtifact.test.ts` automated it after the validation audit was signed off, so the phase's own validation contract now understates its coverage. `nyquist_compliant: true` is unaffected — the row moved from manual to automated, which is the safe direction. One row edit closes it. |

**W2 and W8 are closed.** W2 by the derivation change verified above. W8 (01-17-SUMMARY.md's 457-test
claim against a measured 455) is recorded and corrected in 01-18-SUMMARY.md's Verification note; the
arithmetic reconciles cleanly from there to today's 464.

### Test Quality Audit

Only rows that changed. Everything else is carried forward from the previous run.

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `test/cloud/api.test.ts` | SYNC-01 | yes | 0 | No | Behavioral + type-level | ✓ Strong. The prohibition is enforced twice over: `Record<keyof CloudApi, …>` breaks the build on a fifth operation, and `reachedRoutes()` asserts observed fetch traffic so a path that bypasses `ROUTES` still fails. Both proved fail-first by mutation this run. This is the opposite of a constant-restating test. |
| `test/packedArtifact.test.ts` | REL-04 / T-01-60 / D-21 | yes | 0 | No | Behavioral | ✓ Strong. Asserts the allowlist property rather than an 84-path fixture, so a legitimate `dist/` change does not teach anyone to edit the test. The unbuilt-`dist/` guard is the detail that makes it non-vacuous, and it fires. |
| `test/packageManifest.test.ts` | CONF-01 | yes | 0 | No | Value | ✓ Adequate. It does restate declared values, which is the right shape for a manifest pin — the property under test is "these did not drift", and there is no behavior to exercise. |
| `test/cloud/shadow.test.ts` | SYNC-04, SYNC-05 | yes | 0 | No | Behavioral | ✓ Strong. The added case closes the *client*, not the transport, which is precisely why the pre-existing case did not catch W1. |
| `test/runtime/accountRuntime.test.ts` | SYNC-05, D-13 | yes | 0 | No | Behavioral | ✓ Strong. The rewritten case asserts the new behavior; the re-aimed case keeps its arrange and act so `runPoll`'s abort branch is still reached, and now asserts the failure log — the thing it was always about — rather than a path the shutdown pins either way. That is the right correction, not an assertion weakened to fit. |
| `features/support/fakeShadowBroker.ts` | SYNC-04 | n/a | 0 | No | n/a | ⚠️ `verifyClient: () => !refusing` still accepts every signature. Deferred to human item 3, unchanged. |
| all other `test/**` and `features/**` | mixed | yes | 0 | No | Value / Behavioral | ✓ 464 unit tests, 35 scenarios, none skipped, 100% branch coverage. |

**Disabled tests on requirements:** 0.
**Circular patterns detected:** 0.
**Insufficient assertions:** 0 blocking. One harness limitation deferred to human verification.
**Tests asserting a defect as correct:** 0.

### Human Verification Required

Carried forward unchanged, and unchanged in `01-UAT.md` (`status: testing`, 3 pending, 0 passed).

### 1. Homebridge settings form renders and saves

**Test:** Install the built package into a real Homebridge instance. Open Plugins → Basement Guardian → Settings. Fill in an account and save.
**Expected:** One account block; the header states that Homebridge stores the password in plain text in `config.json` and includes it in backups; the password field is masked; a malformed email is refused by the form; saving writes the account and the plugin starts.
**Why human:** No harness renders the Homebridge settings form (ng-formworks inside the Homebridge UI). While you are there, try a cleared Name field and a single-space password — the schema/runtime disagreement is closed, so the form should refuse both rather than accepting and failing at runtime.

### 2. Heartbeat topic assumption

**Test:** Run the plugin against real hardware for at least two heartbeat intervals (~30 minutes) with debug logging on.
**Expected:** Partial telemetry arrives on `$aws/things/<deviceId>/shadow/update/accepted` roughly every 898 seconds and merges into the canonical snapshot.
**Why human:** The topic choice is an assumption the fake broker cannot falsify. Only real hardware confirms where the vendor publishes.

### 3. Real SigV4 handshake

**Test:** Open a shadow connection against the real AWS IoT endpoint using real temporary credentials from `GET /credentials/aws`.
**Expected:** The WebSocket handshake completes rather than returning HTTP 403.
**Why human:** `features/support/fakeShadowBroker.ts:173` still uses `verifyClient: () => !refusing`, so the harness accepts any signature. 01-SECURITY finding 4 sharpens the reason: the golden-vector test derives the crypto chain independently but hand-writes the canonical query and canonical request from the same reading of the specification as the signer, so the whole suite would pass against a signer that is wrong in the way the reading is wrong. Only a real handshake can falsify it.

### Gaps Summary

No gaps, and no regression from the delta.

**W1 and W2 are closed in the shipped code, not just in the summary.** `connected` is
`!closing && (connection?.live ?? false)` at `src/cloud/shadow.ts:443-444`, and `monitoringPathNow()`
opens with `if (stopped || halted || !polling)` at `src/runtime/accountRuntime.ts:234`. Both fixes took
the conservative shape: neither introduced a second flag that could drift from the record it duplicates,
and both are exercised by cases that reach the exact path the old ones missed. `connection.live` is
still written only by `attach` and `release`; `closing` still only by `close()`; `stopped` still only by
`stop()`.

**The delta disturbed nothing it touched.** `isCurrent` and `release` are unchanged, so 01-14's
one-disconnection-per-connection contract holds and shutdown still raises no disconnection — the new
code reads `closing`, it does not write it. 01-13's `releaseShadowSource` coverage is intact: the
four-reason loop at `test/runtime/accountRuntime.test.ts:1186-1200` still runs one case per disconnect
reason and all four are green. `monitoringPath` has no production consumer to disturb; the runtime
computes it and no `src/` module reads it yet.

**On the W2 reasoning: I agree with the reversal, and my truth 14 is the reason.** The full argument is
in the section above. Briefly: `MonitoringPath` documents itself as how state is arriving, not as a
fault report; a stopped runtime that answers `shadow-and-poll` is the false normal this project forbids,
in the one direction it can never correct; and nothing is written to the failure log at `stop()`, which
I confirmed by reading `stop()` rather than by accepting the claim. 01-17's method survives — the value
is still computed from held facts in one function, which is what made the reversal one line.

**The two prohibition tests are real, not restatements.** I mutated the source in an isolated copy and
watched both doors close. Adding a fifth `CloudApi` operation produces `TS2741: Property 'accounts' is
missing … but required in type 'Record<keyof CloudApi, …>'` at `api.test.ts:492` and `:503`, and
`npm test` runs `build:test` first, so the door is inside the gate rather than beside it. Adding a
stray `fetch` to `/users` inside `devices()` — touching `ROUTES` not at all — fails both traffic cases.
The pack gate refuses to run against an unbuilt `dist/` and fails loudly on a widened allowlist. Each
of the three tests would have caught the thing it claims to prohibit.

**Three things stay open and none is a code defect:** the Homebridge settings form no harness renders,
the vendor heartbeat topic only real hardware confirms, and the fake broker that accepts every
handshake signature. All three are pending in `01-UAT.md`. That is the whole of `human_needed`.

Six warnings remain, one new. W3 and W4 are design contracts written down for Phases 4 and 5. W5 and W6
are recorded deferrals to Phase 3 with a matching success criterion. W7 is the double-escaped key-link
pattern in `01-14-PLAN.md` that makes a wired link report unverified. W9 is new and small: the phase's
own `01-VALIDATION.md` still marks the D-21 packing check manual, one row behind the test that
automated it. W1 is reduced to informational — the status lie is gone; only an unread public boolean
remains.

---

_Verified: 2026-08-29T15:15:27Z_
_Verifier: Claude (gsd-verifier)_
