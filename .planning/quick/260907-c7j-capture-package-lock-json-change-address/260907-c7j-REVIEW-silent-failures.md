# Silent-failure review -- `homebridge-basement-guardian`

Whole-codebase review of `src/**/*.ts` (43 files) against the project's stated
safety invariant:

> Unknown, stale, omitted, or invalid values never become guessed measurements or
> normal defaults. Preserve the last valid value and mark the narrowest affected
> scope untrustworthy.

Scope: every `catch`, every `??` / `||` / destructuring default applied to
telemetry, every optional chain that could turn an absent field into a normal
value, the freshness/staleness machinery, and the reconnect and token-refresh
paths.

**Result: 1 BLOCKING, 5 ADVISORY.**

The safety invariant is designed for, not retrofitted. The great majority of the
fallbacks in this codebase are deliberate, documented, and correct -- see
"Verified correct" at the end for the specific ones I checked and cleared, so a
later reader does not re-litigate them.

---

## BLOCKING

### B-1 -- Empty catch spans the device-removal loop, leaving an orphaned accessory permanently vouched for

**Severity:** BLOCKING
**Location:** `src/runtime/accountRuntime.ts:416-464` (the catch is at `:462-464`)

#### What is wrong

`applyDevices` wraps both the out-of-band final-check fetch **and** the whole
removal loop in one `try`, and the `catch` body is empty:

```ts
try {
  const freshDevices = await options.api.devices(root.signal);
  const stillPresent = new Set(freshDevices.map((device) => device.deviceId));

  for (const deviceId of confirmedAbsent) {
    if (stillPresent.has(deviceId)) {
      reconciliation.forget(deviceId);
    } else {
      reconciliation.forget(deviceId);
      health.forgetDevice(deviceId);
      options.anchors.forget(deviceId);
      options.failures.forget(liveReportingKind(deviceId));
      options.onDeviceRemoved(deviceId);      // <- can throw
    }
  }
} catch {
  // Deliberately silent, for the reason above.
}
```

The documented justification (the JSDoc at `:368-372`) covers exactly one
statement -- the `await options.api.devices(...)` fetch -- and the reasoning it
gives is sound *for that statement only*: "it removes nothing and leaves the
pending deviceIds for the next successful poll". That reasoning does not hold
once the loop has begun mutating state.

Two problems follow.

1. **Scope.** The catch also swallows anything thrown by the four prune calls and
   by `options.onDeviceRemoved`. The project's own style rule
   (`.claude/rules/typescript-style-guide.md`, *Errors*) says "Keep a `try` block
   to the statements that can throw; move the rest out."
2. **Ordering.** The per-device silence tracking (`health.forgetDevice`), the
   persisted arrival anchor (`options.anchors.forget`) and the reconciliation
   entry (`reconciliation.forget`) are all dropped **before**
   `options.onDeviceRemoved` unregisters the accessory. A throw between those two
   points leaves the accessory in place with every mechanism that could have
   distrusted it already dismantled.

#### Concrete failure scenario

The throw is reachable, not hypothetical. Homebridge's
`handleUnregisterPlatformAccessories`
(`node_modules/homebridge/dist/bridgeService.js:430-440`) forwards to HAP's
`Accessory.removeBridgedAccessory`
(`node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js:397-401`), which
throws `Cannot find the bridged Accessory to remove.` for an accessory the bridge
never bridged. An accessory reaches exactly that state when
`handleRegisterPlatformAccessories` hits a UUID collision with an accessory
another plugin already bridged
(`bridgeService.js:400-401`, "Skipping duplicate"): it is neither bridged nor
cached, and it returns `undefined`. This plugin has already recorded it as its
own, because `dispatchDiscoveredDevice` does
`context.accessories.set(uuid, accessory)` **before**
`registerPlatformAccessories` (`src/platform.ts:334-335`).

State and inputs:

1. A Gemini system is discovered whose `hap.uuid.generate(deviceId)` collides with
   an accessory another plugin has bridged. Homebridge logs "Skipping duplicate";
   this plugin records it in `accessories` and in `basementGuardianAccessories`
   and publishes its rows.
2. Months later the owner removes that system from the vendor account. Two
   consecutive trustworthy inventories omit it, the final check confirms it, and
   the removal branch runs.
3. `reconciliation.forget`, `health.forgetDevice`, `anchors.forget` and
   `failures.forget` all run. Then `onDeviceRemoved` ->
   `removeDiscoveredDevice` -> `unregisterPlatformAccessories` **throws**.
4. The throw is swallowed. Nothing is logged at any level.

Wrong outcome in HomeKit, permanently and until the bridge is restarted:

- `context.accessories.delete(uuid)`, `basementGuardianAccessories.delete(uuid)`
  and `store.remove(deviceId)` (`src/platform.ts:477-484`) never run, so the
  accessory and its live subscription stay.
- The device is gone from the inventory, so `dispatchDiscoveredDevice` is never
  called for it again -- its characteristics keep the last values that were ever
  published.
- `monitoringTrustByDevice` is keyed off `options.store.deviceIds()`
  (`accountRuntime.ts:557-561`), which still contains the deviceId, so the
  accessory **is** in `byDevice` -- it does not fall through to
  `applyMonitoringHealth`'s `?? { ...account, shadowSilent: true }` safety
  default (`src/platform.ts:401`).
- Its `shadowSilent` is computed from `health.silentDevices()`, and
  `health.forgetDevice` already deleted its `lastShadowArrival` entry, so it is
  **never** listed as silent. With polls succeeding, `restDegraded` is `false`
  too.
- `markMonitoring` therefore receives `{ restDegraded: false, shadowSilent:
  false, commandTransportReady: true, credentialsRejected: false }`,
  `monitoringDegradedScopes` returns `NO_SCOPES`, `untrusted` is empty, and every
  service publishes `StatusActive = true`.
- `reconciliation.forget` already ran, so the removal is never retried on any
  later poll.

Net effect: a tile for a sump-pump system that no longer exists shows "Leak Not
Detected, pump normal, battery fine", marked as fully vouched for by the plugin,
for the life of the process, with nothing in the log. That is precisely the false
normal the project exists to prevent.

A second, milder consequence of the same over-broad catch: if the final-check
`options.api.devices()` rejects with `AuthRejectedError` / `AuthHaltedError`, the
terminal act is swallowed here and `recordPollSuccess()` runs immediately
afterwards (`runPoll`, `accountRuntime.ts:921-922`), so `credentialsRejected`
is not raised until the next poll's main inventory -- up to
`pollIntervalSeconds` (max 3600) later.

#### Fix

Narrow the `try` to the fetch it was written for, move the loop out, and guard
each device's own removal so one failure costs one device and is reported.
Prune the device-scoped state **after** the accessory has actually gone.

```ts
let freshDevices: readonly ApiDevice[];

try {
  freshDevices = await options.api.devices(root.signal);
} catch {
  // A failed final check removes nothing and leaves the pending deviceIds for
  // the next successful poll's own confirmedAbsent computation (D-029, D-014).
  return;
}

const stillPresent = new Set(freshDevices.map((device) => device.deviceId));

for (const deviceId of confirmedAbsent) {
  if (stillPresent.has(deviceId)) {
    reconciliation.forget(deviceId);

    continue;
  }

  try {
    // The accessory goes first: everything below it is the state that decides
    // whether this system can still be distrusted, so nothing is pruned until
    // there is nothing left to distrust.
    options.onDeviceRemoved(deviceId);
  } catch (error: unknown) {
    // The system stays tracked and stays distrustable, and the next poll's own
    // confirmedAbsent computation tries the removal again.
    options.log.error(`Could not remove ${deviceId} from HomeKit; it stays published and stays tracked.`, error);

    continue;
  }

  reconciliation.forget(deviceId);
  health.forgetDevice(deviceId);
  options.anchors.forget(deviceId);
  options.failures.forget(liveReportingKind(deviceId));
}
```

A regression test worth adding: an `onDeviceRemoved` that throws must leave the
deviceId in `health.silentDevices()`'s tracked set (so a later trust push still
reports `shadowSilent`) and must leave `reconciliation` still tracking it (so the
next poll retries).

---

## ADVISORY

### A-1 -- Snapshot-listener failures are logged at `debug` with the error and the device discarded

**Severity:** ADVISORY
**Location:** `src/device/state.ts:318-324`

```ts
for (const listener of listeners) {
  try {
    listener(next, previous, changed);
  } catch {
    log.debug('A device snapshot listener failed.');
  }
}
```

The only production listener is
`basementGuardianAccessory.update(next, 'live')` (`src/platform.ts:173-177`),
which is how a seven-to-fifteen-second pump run reaches HomeKit between polls. A
listener that throws loses that update, and the report names no device, carries
no error object, and sits at `debug`.

Why this is advisory rather than blocking: `update()` differs between the `live`
and `poll` sources only in the `offlineCount` branch, so anything that throws on
the live path throws on the poll path too, where
`registerDiscoveredDevices` catches it and logs at `error` with the deviceId and
the error (`src/platform.ts:359-366`). The failure is therefore visible; it is
just visible from the wrong place and with a worse message.

**Fix:** take `catch (error: unknown)` and log at `error` with the deviceId and
the error object -- the redacting logger already describes an `Error` parameter
safely (`src/logging.ts:89-91`). Keep the containment (other listeners still run).

### A-2 -- The reason the shadow client could not be built or started is discarded entirely

**Severity:** ADVISORY
**Location:** `src/runtime/accountRuntime.ts:834-841`

```ts
} catch {
  options.failures.recordFailure(SHADOW, SHADOW_DEGRADED);

  return true;
}
```

`SHADOW_DEGRADED` is a fixed sentence ("the shadow connection is unavailable, so
device state is coming from polling alone until it returns"). It is honest and it
is rate-limited, so the degradation itself is not silent -- but the error from
`options.createShadow(...)` or `client.start(deviceIds)` is thrown away at every
level. A permanently misconfigured or unreachable broker produces a run of
identical warnings and nothing an operator can act on.

The safety invariant holds: the runtime stays up, `shadowConnected` stays
`false`, the path reports `poll-only`, and two missed heartbeats later every
device reads `shadowSilent`.

**Fix:** `catch (error: unknown)` and add
`options.log.debug('The shadow connection could not be started.', error)` beside
the rate-limited warning. The redacting logger handles the error object.

### A-3 -- A synchronous throw from `openConnection` permanently kills the shadow reconnect chain

**Severity:** ADVISORY
**Location:** `src/cloud/shadow.ts:295-301` and `:415-443`, with
`src/runtime/retryPolicy.ts:52-58`

`scheduleReconnect` hands `reopen` (which is `openConnection`) to the retry
policy. `runGuarded` catches whatever `reopen` throws and logs
`'A scheduled retry attempt failed.'` at `debug`. `openConnection` can throw
synchronously: `options.createTransport(...)` calls `createMqttTransport`, whose
first act is `options.connect(options.url, ...)` -- the real `mqtt.connect`,
which throws on a malformed URL built from the vendor-supplied
`credentials.endpoint`.

When it does, `connection` is not reassigned (the throw happens inside the object
literal), no handlers are attached, and no further retry is scheduled --
`waitThenRun`'s `finally` clears `pending` and the chain simply ends. The runtime
does not rebuild either: `attemptShadow` returns early on `shadow !== undefined`
(`accountRuntime.ts:756`), because the `ShadowClient` object still exists. The
live path is dead until the bridge restarts, and the only trace is one
device-less `debug` line.

The safety invariant holds -- `connected` reads `false`, the path drops to
`poll-only`, and every device reads `shadowSilent` after two heartbeats -- so
HomeKit marks rather than lies. That is why this is advisory.

**Fix:** wrap the transport construction in `openConnection` so a synchronous
failure to open is treated like any other failed connection: report it, and
`scheduleReconnect(openConnection)` so the capped backoff keeps trying. Log the
error rather than a generic sentence in `retryPolicy.runGuarded`.

### A-4 -- `ControllerDataLastTrustedAt` advances on a poll that deliberately applied no telemetry

**Severity:** ADVISORY
**Location:** `src/device/state.ts:206-232` (`pollTelemetry` / `toSnapshot`) and
`src/accessories/basementGuardian.ts:900-906, 1030`

While the shadow owns telemetry (`shadowVersion !== undefined`), `pollTelemetry`
deliberately returns `previous.data` and discards the fresher REST body -- the
documented D-15 / SYNC-03 behaviour, and correct. But `toSnapshot` still stamps
`receivedAt` with the poll's own receipt time, and `recordTrustedScopes` writes
that value into `lastTrustedAt` for every scope not currently untrusted, which
the accessory then formats and publishes as `ControllerDataLastTrustedAt`
(RES-02).

So during the window between the shadow going quiet and the two-heartbeat
release, that characteristic reads "now" while the telemetry behind it is up to
thirty minutes old. Every other consequence of that window is intended and
bounded by `MISSED_HEARTBEATS_BEFORE_SILENT`; this one value is the single place
where it is stated as a freshness claim to the user.

**Fix:** stamp `lastTrustedAt` from the receipt time of the snapshot that
actually carried this scope's telemetry, not from `receivedAt` of any successful
observation. The narrowest form is to have `toSnapshot` leave `receivedAt`
unchanged when `pollTelemetry` returned `previous.data` unchanged -- but that
conflicts with the documented "a successful poll is a real observation" rule, so
the safer form is a second field (`telemetryReceivedAt`) that only advances when
`data` changed identity, read by `recordTrustedScopes`.

### A-5 -- A locally-unbuildable command is reported to HomeKit as a vendor error

**Severity:** ADVISORY
**Location:** `src/runtime/accountRuntime.ts:1029-1033`

```ts
const command = commandBodyOf(options, deviceId, capability, requested);

if (command === undefined) {
  return { accepted: false, failure: 'vendor-error' };
}
```

`commandBodyOf` returns `undefined` for two purely local conditions -- the store
holds no snapshot for the deviceId, or the family registry does not resolve an
implemented adapter. Both are answered as `'vendor-error'`, which
`controls.refuseOutcome` renders as
`"The <capability> request on <deviceId> did not take effect: vendor-error"` and
`HAPStatus.SERVICE_COMMUNICATION_FAILURE`. Nothing ever left the plugin. That is
exactly the blur between a vendor refusal and a local one that the per-cause
`LOCAL_REFUSALS` table in `src/accessories/controls.ts:336-343` exists to
prevent.

This is advisory because both conditions are shadowed in practice: a device whose
family stops resolving withdraws its control scopes with reason `invalid`, so
`reportedControlValue` answers `undefined` and `hasNoFreshState` refuses locally
first with the right cause; and a device with no snapshot has had its accessory
unregistered. The path is defensive rather than reachable.

**Fix:** widen `CommandFailure` with a third member (e.g. `'unsupported'`) or
have the accessory tier answer this condition locally, so a refusal that never
reached the network is never described as one that did.

---

## Verified correct -- checked and deliberately not reported

Listing these so a later reviewer does not re-open them.

- **Telemetry defaults.** There are none. `published()`
  (`serviceCatalogue.ts:335-345`) drops every `undefined` candidate rather than
  substituting; `contactState`, `faultState`, `lowBatteryState`, `chargingState`,
  `leakState` and `inverted` all propagate `undefined` unchanged; `booleanOf` /
  `numberOf` answer `undefined` for a wrong-typed or absent field.
  `ensureService` refuses to add a service a row cannot yet populate, precisely
  so HAP format defaults (which are this project's good-news values) never
  publish.
- **`??` on telemetry.** The only `??` reaching a published value is
  `clearRefusal`'s `reported ?? heldOn(...)` (`controls.ts:377-381`), which pushes
  the value HAP is already serving purely to clear a stored HAP status -- it
  states nothing new. `nextShadowVersion`'s `patch.version ?? previous.shadowVersion`
  is ordering information, not a measurement. `applyMonitoringHealth`'s
  `?? { ...account, shadowSilent: true }` (`platform.ts:401`) defaults toward
  *distrust*, which is the correct direction.
- **`decode()` on a partly-invalid payload.** `gemini.ts:360-375` omits each
  scope whose own fields failed rather than defaulting it, and every strict field
  reader throws `TypeError` rather than guessing if `validate()` is bypassed.
  `waterLevelPercentage` throws on an out-of-domain code rather than computing
  one.
- **Freshness / staleness.** `silenceElapsedMs` (`monitoringHealth.ts:209-213`)
  takes `Math.max` of the monotonic and wall terms, which can only ever report
  silence *sooner*. `admitDevice` refuses to overwrite a restored anchor, and
  `restore()` is awaited before `launch()` (`accountRuntime.ts:1069`), so a
  restart after hours of silence does not re-vouch. Expiry marks the narrowest
  scope rather than retaining a comfortable last-good value forever.
- **Token refresh / permanent failure.** `AuthRejectedError` and
  `AuthHaltedError` route through the single `haltOnTerminalAuthFailure`, which
  stops every loop, pushes `credentialsRejected`, closes the socket, and makes
  restored trust reports unreadable. Nothing retries into the vendor's
  thirty-day block. `AuthThrottledError` gets its own long interval. The
  "retries forever while HomeKit shows the last good state" failure mode is
  explicitly closed.
- **MQTT reconnect.** `reconnectPeriod: 0` hands timing to the capped, guarded
  policy; `within()` (`mqttTransport.ts:108-131`) turns a callback that never
  fires into a rejection, closing the "connection reports healthy while nothing
  can arrive" hole; `requestEveryShadow` sets `live = true` only after the
  subscription *and* every get-publish succeeded; `isCurrent` gates every
  notification so a superseded connection cannot rewrite the live one's health.
- **Parse-failure catches** in `auth.ts:150-159` / `:381-391`,
  `arrivalAnchors.ts:89-98` and `shadow.ts:173-183` all return `undefined`
  ("there is no usable cache / no usable anchors / the document cannot be read"),
  never a fabricated value, and each is followed by an explicit debug note. The
  anchor file is rejected whole rather than in part. These are deliberate and
  correct.
- **`logging.ts` redaction** is a documented substitution of credential values,
  not a swallowed failure; `describeObject`'s catch answers
  `'[unserializable object]'` rather than raising out of a logger the plugin
  calls from inside catch blocks and message handlers.
- **Cache-write failure** (`auth.ts:246-252`) and **anchor-write failure**
  (`arrivalAnchors.ts:200-207`) both cost only a re-grant / a shorter measured
  silence, both in the safe direction, both noted at debug.

BLOCKING_COUNT: 1
