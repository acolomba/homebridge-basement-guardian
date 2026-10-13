---
phase: 01-secure-cloud-foundation
reviewed: 2026-08-29T04:44:24Z
depth: standard
files_reviewed: 82
files_reviewed_list:
  - CHANGELOG.md
  - config.schema.json
  - cucumber.json
  - eslint.config.js
  - .fallowrc.json
  - features/authentication.feature
  - features/configuration.feature
  - features/credentialRotation.feature
  - features/degradedOperation.feature
  - features/harness.feature
  - features/lifecycle.feature
  - features/shadowLifecycle.feature
  - features/shadowMerge.feature
  - features/support/fakeAuth0.ts
  - features/support/fakeHomebridgeApi.ts
  - features/support/fakeRestApi.ts
  - features/support/fakeShadowBroker.ts
  - features/support/loopbackServer.ts
  - features/support/steps/authentication.ts
  - features/support/steps/configuration.ts
  - features/support/steps/harness.ts
  - features/support/steps/runtime.ts
  - features/support/steps/shadow.ts
  - features/support/world.ts
  - .gitignore
  - package.json
  - .pre-commit-config.yaml
  - .prettierignore
  - src/accessories/basementGuardian.ts
  - src/accessories/services.ts
  - src/cloud/api.ts
  - src/cloud/auth.ts
  - src/cloud/errors.ts
  - src/cloud/mqttTransport.ts
  - src/cloud/shadow.ts
  - src/cloud/sigv4.ts
  - src/cloud/types.ts
  - src/config.ts
  - src/device/events.ts
  - src/device/family.ts
  - src/device/gemini.ts
  - src/device/halo.ts
  - src/device/health.ts
  - src/device/state.ts
  - src/logging.ts
  - src/persistence/accessoryContext.ts
  - src/platform.ts
  - src/protocol.json
  - src/protocol.ts
  - src/runtime/accountRuntime.ts
  - src/runtime/clock.ts
  - src/runtime/failureLog.ts
  - src/runtime/retryPolicy.ts
  - test/accessories/basementGuardian.test.ts
  - test/accessories/services.test.ts
  - test/cloud/api.test.ts
  - test/cloud/auth.test.ts
  - test/cloud/errors.test.ts
  - test/cloud/mqttTransport.test.ts
  - test/cloud/shadow.test.ts
  - test/cloud/sigv4.test.ts
  - test/cloud/types.test.ts
  - test/configSchema.test.ts
  - test/config.test.ts
  - test/device/events.test.ts
  - test/device/family.test.ts
  - test/device/gemini.test.ts
  - test/device/halo.test.ts
  - test/device/health.test.ts
  - test/device/state.test.ts
  - test/hbConfig/config.example.json
  - test/index.test.ts
  - test/logging.test.ts
  - test/persistence/accessoryContext.test.ts
  - test/platform.test.ts
  - test/protocol.test.ts
  - test/runtime/accountRuntime.test.ts
  - test/runtime/clock.test.ts
  - test/runtime/failureLog.test.ts
  - test/runtime/retryPolicy.test.ts
  - test/settings.test.ts
  - tsconfig.test.json
findings:
  critical: 5
  warning: 13
  info: 0
  total: 18
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-08-29T04:44:24Z
**Depth:** standard
**Files Reviewed:** 82
**Status:** issues_found

## Summary

The build, 384 unit tests, and 32 Cucumber scenarios all pass on this tree, and the
hand-rolled SigV4 presigner (`src/cloud/sigv4.ts`) matches the AWS IoT reference
canonicalization exactly — including the two non-obvious parts (no `X-Amz-Expires`, and the
security token appended *after* signing). Its unit test builds the expected signature
independently rather than echoing the implementation. I found no defect in the signer.

The defects are concentrated where the project said they would hurt most: the merge reducer
and the shadow connection lifecycle. Four of the five blockers are paths where a failure or a
stale value presents as normal or fresh:

- A shadow document that carries **no reported telemetry at all** still lands as a snapshot,
  advancing `receivedAt` and the version watermark (CR-01). An existing accepted scenario
  encodes this behavior as correct.
- A REST poll **overwrites newer shadow telemetry** with no ordering guard, and because the
  version watermark survives the overwrite, the shadow's re-delivery of the correct value is
  then rejected as stale (CR-02). Demonstrated: a running pump reads as not running.
- Shadow connection state lives in **shared closure variables** and stale connections are
  never detached or ended, so a late event from a superseded connection rewrites the live
  connection's health, and duplicate connections can kick each other off (CR-03).
- `monitoringPath` has **no value meaning "nothing is working"** — a refused credential leaves
  it at `'rest-only'`, which `src/device/health.ts` documents as a working degraded path
  (CR-04).

On the privacy axis, the redacting logger, the error classes, and the token cache are careful
work; I could not find a path where a token, a password, or an AWS credential reaches a log or
the packed artifact. The one leak I did find is smaller and different in kind: an *account
email* is quoted verbatim into a refusal message (WR-01).

Findings CR-01 through CR-04 and WR-01 through WR-04 were verified by running the built code,
not by reading alone. Where I am uncertain about real-world reachability I say so in the
finding.

## Critical Issues

### CR-01: A shadow message carrying no reported state still refreshes the snapshot

**Severity:** BLOCKER
**File:** `src/cloud/shadow.ts:139-148`, `src/device/state.ts:141-151`, `src/device/state.ts:210-222`

**Issue:** `toReportedPatch` builds `{ data: undefined, state: undefined, version: n }` for any
shadow document whose `state` has no `reported` section — a `$aws/things/<id>/shadow/update/accepted`
for a **desired-only** write, which is exactly what the vendor cloud publishes every time it
delivers a command to the device. `applyReportedPatch` does not reject an empty patch: it
passes `isStalePatch`, `mergeRecord` returns the previous records unchanged, and
`nextSnapshot` then writes `receivedAt: options.clock.now()` and `shadowVersion: patch.version`.

The snapshot therefore claims it was received *now* while carrying zero new telemetry. Any
downstream staleness rule built on `receivedAt` — which is the only freshness field the
snapshot has, and which `src/device/health.ts:51` (`lastReceivedAt`) is declared to consume —
reads a dead device as freshly reporting. This is the false-normal shape the project's core
value forbids.

Verified against the built code:

```
store.applyDiscovery(device)                                    // receivedAt = 1000
store.applyReportedPatch('dev-1', { data: undefined, state: undefined, version: 42 })
-> { data: {water_level:3, ...unchanged...}, shadowVersion: 42, receivedAt: 999999 }
```

`features/shadowMerge.feature` ("A requested value never becomes device state") already asserts
`the canonical snapshot is at shadow version 1` after publishing a requested value, so the
current suite locks this behavior in rather than catching it.

**Fix:** Treat a patch with no reported content as carrying no observation. Advance the version
watermark if you want ordering, but do not restamp receipt time:

```ts
function nextSnapshot(previous: DeviceSnapshot, patch: ReportedPatch, receivedAt: number): DeviceSnapshot {
  const observed = patch.data !== undefined || patch.state !== undefined;

  return freeze({
    // ...
    shadowVersion: patch.version ?? previous.shadowVersion,
    receivedAt: observed ? receivedAt : previous.receivedAt,
  });
}
```

Add a case asserting that an empty patch leaves `receivedAt` where it was, and amend the
`shadowMerge.feature` scenario to assert the same.

### CR-02: A REST poll overwrites newer shadow telemetry, and the surviving watermark then blocks recovery

**Severity:** BLOCKER
**File:** `src/device/state.ts:120-137`, `src/device/state.ts:201-208`, `src/device/state.ts:213`

**Issue:** `toSnapshot` replaces `data` wholesale from the REST response and carries
`shadowVersion: previous?.shadowVersion` forward. There is no ordering guard of any kind on the
REST path — not the shadow version, not `connectivity.timestamp`, not `receivedAt`. So a poll
response that reflects an older device state than a shadow message already applied silently
reverts the store. Worse, because the watermark survives the revert, the shadow's re-delivery
of the same version is then rejected by `isStalePatch`, so the correct value cannot come back
until a strictly *newer* shadow version arrives.

Concrete sequence, run against the built code:

```
applyDiscovery(device)                                   -> primary_pump_running: false
applyReportedPatch(v90, { primary_pump_running: true })  -> primary_pump_running: true   (pump running)
applyDiscovery(device)   // poll response captured before the pump started
                                                         -> primary_pump_running: false  (FALSE NORMAL)
                                                            shadowVersion still 90
applyReportedPatch(v90, { primary_pump_running: true })  -> rejected as stale; stays false
```

The race is ordinary, not exotic: the poll is issued at T, a shadow message for T+50ms is
applied, and the HTTP response describing T lands at T+200ms. `pollIntervalSeconds` defaults to
900, so a wrong value can persist for the full interval. I cannot prove from this repo that the
vendor's REST snapshot ever lags its shadow, so the frequency is unknown — but nothing in the
store prevents it, and `.planning/PROJECT.md` names "monotonic timestamps" as the recovery
mechanism, which is not implemented here. No scenario covers a short poll interval together
with shadow traffic, so the suite cannot see this.

**Fix:** Give the REST path an ordering guard, and do not let a rejected/superseded write leave
the watermark ahead of the data. The simplest correct form is to record the source and the
device time a value came from and refuse an older one:

```ts
function toSnapshot(device: ApiDevice, previous: DeviceSnapshot | undefined, receivedAt: number): DeviceSnapshot {
  // A poll that describes an older moment than what is already stored is not news.
  if (previous !== undefined && device.connectivity.timestamp < (previous.deviceTimestamp ?? Number.NEGATIVE_INFINITY)) {
    return previous;
  }
  // ...
}
```

If the vendor's `connectivity.timestamp` cannot be trusted for this, the alternative is to keep
`data` sourced from the shadow whenever `shadowVersion !== undefined` and use the poll only for
`connectivity` and identity. Either way, add a case asserting that an older REST snapshot does
not revert a newer shadow value.

### CR-03: Shadow connection state is shared across connections; superseded connections are never detached or ended

**Severity:** BLOCKER
**File:** `src/cloud/shadow.ts:159-322` (specifically 161-167, 276-291, 293-299, 301-322)

**Issue:** `live`, `established`, `failed`, and `transport` are single closure variables shared
by every connection the client ever opens, and `openConnection` (line 301) neither detaches the
previous connection's handlers nor ends it — it just reassigns `transport = connection`
(line 309) and resets `established`/`failed` (lines 310-311). Every handler is bound to
`openConnection` as its reopener, so a superseded connection can still drive the live one's
state and can still start a reconnect chain.

Three consequences, all reachable:

1. **False degraded.** Connection A errors, a retry opens B, B connects (`live = true`,
   `path = 'rest-and-shadow'`), then A's `close` arrives (mqtt.js emits `error` and `close`
   separately). `handleClose` sets `live = false` and calls `onDisconnected(...)`, which drives
   `accountRuntime.handleShadowDisconnected` to `path = 'rest-only'` — while B is healthy and
   subscribed.

2. **Duplicate connections that kick each other off.** `requestEveryShadow` (line 276) is
   `async` and its `catch` mutates the same shared flags. If A's `subscribe` callback rejects
   *after* B has connected — which is what mqtt.js does to outstanding callbacks when a client
   goes down — the catch sets `live = false; failed = true`, reports `subscription-refused`,
   and calls `scheduleReconnect` again, opening C alongside the live B. Because
   `signHandshake` (line 172) assigns the *same* cached `clientId` to both, the broker
   disconnects the older of the two. The module's own comment at `mqttTransport.ts:9-12`
   describes this exact self-inflicted disconnect as the thing to avoid.

3. **Live but not listening.** `handleConnect` (line 293) sets `live = true`,
   `established = true`, and calls `onConnected()` *before* the subscription is confirmed, then
   fires `requestEveryShadow` with `void`. If that connection is already dead, its `subscribe`
   callback may never fire at all (`subscribeOnce` in `mqttTransport.ts:79-89` has no deadline),
   in which case the client is left reporting `connected === true` and the runtime reports
   `rest-and-shadow` with nothing subscribed and no shadow message able to arrive. That is a
   silently dead monitoring path reporting healthy.

**Fix:** Make a connection own its own state and make superseding one explicit. Give
`openConnection` a generation token, ignore every callback from a non-current generation, and
end the previous transport before replacing it:

```ts
let generation = 0;

function openConnection(): void {
  if (closing) { return; }

  const mine = ++generation;
  const previous = transport;
  void previous?.end();

  const isCurrent = (): boolean => mine === generation && !closing;
  const connection = options.createTransport({ /* ... */ });

  transport = connection;
  established = false;
  failed = false;
  connection.onConnect(() => { if (isCurrent()) { handleConnect(connection, openConnection); } });
  connection.onError(() => { if (isCurrent()) { handleError(openConnection); } });
  connection.onClose(() => { if (isCurrent()) { handleClose(openConnection); } });
  connection.onMessage((topic, payload) => { if (isCurrent()) { handleMessage(topic, payload); } });
}
```

Also move `options.onConnected()` out of `handleConnect` and into `requestEveryShadow` after
the subscription resolves, so `rest-and-shadow` is never reported before the plugin can
actually receive a message; and put a deadline on `subscribeOnce`/`publishOnce` so a callback
that never fires is a failure rather than a stall.

### CR-04: The runtime has no state meaning "monitoring is dead"; a refused credential reads as the working degraded path

**Severity:** BLOCKER
**File:** `src/runtime/accountRuntime.ts:43`, `src/runtime/accountRuntime.ts:181`, `src/runtime/accountRuntime.ts:372-387`, `src/device/health.ts:22`

**Issue:** `MonitoringPath` in the runtime is `'rest-and-shadow' | 'rest-only'`, initialized to
`'rest-only'` (line 181) and never set to anything else on a failure. When `launch()` fails
with `AuthRejectedError` or `AuthHaltedError`, `launchFailure` (line 373) returns `undefined`
without starting background work and **without calling `options.failures.recordFailure`**. The
runtime then does nothing forever: no polls, no credential refresh, no shadow — and
`monitoringPath` reads `'rest-only'`.

`src/device/health.ts:16-22` — the scaffold that is going to consume this — documents
`'poll-only'` as "a working degraded path, not a failure" and declares a separate
`'unavailable'` for the dead case. The runtime cannot produce it. So the single value the rest
of the plugin is meant to read trust from cannot distinguish "polling works, the socket is
down" from "nothing works and nothing will be retried." That is a false normal at the
composition seam, and it is the state the plugin is left in after the one failure the project
treats as terminal.

Two aggravating details in the same function: the terminal branch is silent in the failure log,
so `recordSuccess`/`recordFailure` never learn the runtime stopped; and `AuthThrottledError`
returns `error.retryAfterMs` without starting background work, which is right, but again leaves
`monitoringPath` at `'rest-only'` for the whole 30-minute wait.

**Fix:** Add the third state and set it on every path where the runtime is not actually
receiving anything, and reconcile the two `MonitoringPath` declarations into one exported type
(see WR-06):

```ts
export type MonitoringPath = 'rest-and-shadow' | 'rest-only' | 'unavailable';

function launchFailure(error: unknown): number | undefined {
  if (root.signal.aborted) { return undefined; }

  if (error instanceof AuthRejectedError || error instanceof AuthHaltedError) {
    path = 'unavailable';
    options.failures.recordFailure(AUTHENTICATION, HALTED_NOTICE);

    return undefined;
  }
  // ...
}
```

`runPoll`'s catch should also move `path` to `'unavailable'` once polling has failed and the
shadow is not connected, and back to `'rest-only'`/`'rest-and-shadow'` on the next success.

### CR-05: Shutdown can leave a live MQTT connection that nothing will ever close

**Severity:** BLOCKER
**File:** `src/cloud/shadow.ts:219-229`, `src/cloud/shadow.ts:301-322`, `src/cloud/shadow.ts:343-348`, `src/runtime/accountRuntime.ts:233-263`, `src/runtime/accountRuntime.ts:445-460`

**Issue:** Two windows leave an open socket behind, both contradicting the SYNC-05 claim at
`accountRuntime.ts:165-167` that shutdown "leaves no timer holding the process open."

1. `scheduleReconnect` checks `closing` at *schedule* time (line 220), but the work it hands to
   the retry policy is `reopen()` — that is `openConnection`, which has **no `closing` guard of
   its own**. If the retry's timer has already resolved when `stop()` runs, `root.abort()`
   cannot cancel it (`timers.setTimeout` has already settled), and `runGuarded` then calls
   `openConnection()` after `closing = true`, opening a brand-new connection. `close()` (line
   343) memoized `ending` from the *previous* transport, so nothing ever ends the new one.

2. `attemptShadow` checks `stopped` on entry (line 237) but assigns `shadow = client` only
   *after* `await client.start(deviceIds)` (lines 251-252). A `stop()` landing in that window
   sees `shadow === undefined` and skips `shadow?.close()` entirely, while `start()` has already
   opened the socket through `openConnection`.

`features/lifecycle.feature` asserts "records no unhandled rejection" on shutdown, which is a
different property — a leaked connection raises nothing.

**Fix:** Guard the opener itself and re-check after every await:

```ts
function openConnection(): void {
  if (closing) { return; }
  // ...
}
```

```ts
await client.start(deviceIds);

if (stopped) {
  await client.close();

  return false;
}

shadow = client;
```

Add a scenario that shuts down while a reconnect is pending and asserts the broker holds no
live connection afterwards (`fakeShadowBroker` already exposes `server.clients`).

## Warnings

### WR-01: An invalid account email is written verbatim to the Homebridge log

**Severity:** WARNING
**File:** `src/config.ts:104-106`, `src/platform.ts:52-57`

**Issue:** `firstRefusal` returns `` `the account email must be an email address, but it is ${email}.` ``
and `platform.ts:55` logs that string through the redacting logger. At that point nothing has
been registered as a secret (`registerSecret` for the password runs at line 60, only after a
*successful* validation), and none of the four `CREDENTIAL_PATTERNS` in `src/logging.ts:15-18`
matches a bare email in prose — `AUTHENTICATION_BODY_PATTERN` needs a `username:`/`password:`
prefix. So the value lands unredacted.

An account email is an account identifier, which `.planning/PROJECT.md` ("Privacy") says cannot
enter logs. A typo like `jane.doe@company` (no TLD) fails the pattern and is real PII. No
scenario in `features/configuration.feature` covers the malformed-email refusal, so nothing
catches this.

**Fix:** Do not quote the value:

```ts
return 'the account email must be an email address.';
```

If a hint is wanted, register the email as a redactable secret in the platform constructor
before validation runs, or quote only the shape (`'it contains no "@"'`).

### WR-02: `narrow()` lets a JSON parse failure escape as a raw `SyntaxError`

**Severity:** WARNING
**File:** `src/cloud/api.ts:74-86` (line 79)

**Issue:** `await response.json()` sits outside any `try`. A `200` response whose body is not
JSON — a captive portal or a proxy error page, exactly what `auth.ts:344-354` already defends
against — rejects with a `SyntaxError`, not a `CloudRequestError`. Every caller that branches on
`error instanceof CloudRequestError` (`accountRuntime.ts:118-124`) falls through to the generic
"Device discovery failed." with no route and no status, and `AuthThrottledError`/
`AuthRejectedError` routing in `launchFailure` is unaffected but the operator loses the route
label the module promises.

V8's parse message also embeds the first ~10 bytes of the body
(`Unexpected token '<', "<html><bod"... is not valid JSON`). That is a bounded leak and the
redacting logger plus `describeFailure`'s fixed string currently keep it out of the log, so the
privacy impact is small — the typing defect is the real problem.

**Fix:**

```ts
let body: unknown;

try {
  body = await response.json();
} catch {
  throw new CloudRequestError(`${call.route} returned a response the plugin cannot read.`, response.status, call.route);
}
```

### WR-03: The 2.5-second command deadline excludes the token fetch

**Severity:** WARNING
**File:** `src/cloud/api.ts:100-105`, `src/cloud/api.ts:14`

**Issue:** `send` awaits `options.auth.idToken(signal)` on line 101 and only *then* builds
`AbortSignal.timeout(call.deadlineMs)` on line 102. When the cached token has lapsed, the token
grant runs first under `requestTimeoutMs` (10 000 ms), so `sendCommand` can take up to ~12.5 s
before its own 2.5 s clock even starts. D-038 states the plugin returns an operation timeout
after 2.5 seconds; a HomeKit write will instead hang well past HomeKit's own patience.

**Fix:** Start the deadline before the token is fetched and pass it into `idToken`:

```ts
const deadline = AbortSignal.any([signal, AbortSignal.timeout(call.deadlineMs)]);
const idToken = await options.auth.idToken(deadline);
const response = await fetch(new URL(call.path, options.baseUrl), requestInit(call.method, call.body, `Bearer ${idToken}`, deadline));
```

Note this makes a lapsed token abort the command rather than silently extend it, which is the
behavior D-038 describes.

### WR-04: Concurrent `idToken()` calls skip a valid cache and issue duplicate grants

**Severity:** WARNING
**File:** `src/cloud/auth.ts:403-421`, `src/cloud/auth.ts:197-216`

**Issue:** `currentToken` sets `cacheRead = true` on line 409 *before* awaiting
`readCachedToken` on line 410. A second concurrent call sees `cacheRead === true` and
`cached === undefined`, skips the cache entirely, and goes straight to `requestGrant`. There is
no in-flight-grant promise either, so two callers whose token has lapsed both hit
`POST /oauth/token`.

`runPolls()` and `runCredentials()` are started together by `startBackgroundWork`
(`accountRuntime.ts:358-361`) and both reach `idToken` through the REST client, so this is
reachable whenever the token expires between two background activities. The module's own
documentation is emphatic that every attempt extends a vendor block by thirty days — doubling
the attempt rate against a throttling tenant is the wrong direction.

The same concurrency also collides in `writeCachedToken`: both grants build the identical
temporary path `${target}.${process.pid}.tmp` (line 199), so the two non-atomic `writeFile`
calls interleave on one file and the second `rename` fails with `ENOENT`. The comment on
lines 195-196 claims the pid makes collision impossible; it only rules out collision *between
processes*.

**Fix:** Serialize on one in-flight promise, and read the cache before publishing the flag:

```ts
let inFlight: Promise<CachedToken> | undefined;

async function currentToken(signal: AbortSignal): Promise<CachedToken> {
  // ...
  if (!cacheRead) {
    cached = await readCachedToken(options);
    cacheRead = true;
  }

  if (cached !== undefined && isCurrent(cached.expiresAtMs, options.clock)) {
    return cached;
  }

  inFlight ??= requestGrant(options, policy, signal).then(async (granted) => {
    await writeCachedToken(options, granted);

    return granted;
  }).finally(() => { inFlight = undefined; });

  return inFlight;
}
```

Give the temporary file a per-call suffix (`randomBytes(8).toString('hex')`) as well.

### WR-05: The token cache temp file is orphaned on failure and can be written without its 0600 mode

**Severity:** WARNING
**File:** `src/cloud/auth.ts:197-216`

**Issue:** Two problems in the same block. First, if `rename` (line 210) fails after `writeFile`
(line 209) succeeded, the `catch` logs and returns without removing the temporary file, so a
file containing the bearer token is left in the Homebridge storage directory indefinitely.
Second, `writeFile`'s `mode` option applies **only when the file is created**. If
`${target}.${pid}.tmp` already exists — a crashed prior run with a recycled pid, or the
concurrent-write case in WR-04 — the existing file is truncated and rewritten under whatever
mode it already had, defeating the `OWNER_ONLY_MODE` guarantee the comment on lines 191-194
asserts.

**Fix:** Use an exclusive create and clean up:

```ts
try {
  await writeFile(temporary, JSON.stringify(cache), { mode: OWNER_ONLY_MODE, flag: 'wx' });
  await rename(temporary, target);
} catch {
  await rm(temporary, { force: true });
  options.log.debug(CACHE_NOT_WRITTEN);
}
```

### WR-06: `MonitoringPath` is exported twice with disjoint value sets

**Severity:** WARNING
**File:** `src/device/health.ts:22`, `src/runtime/accountRuntime.ts:43`

**Issue:** `src/device/health.ts` declares `'shadow-and-poll' | 'poll-only' | 'unavailable'`;
`src/runtime/accountRuntime.ts` declares `'rest-and-shadow' | 'rest-only'`. Same exported name,
no overlapping member. `DeviceHealth.monitoringPath` (health.ts:47) is typed with the first and
will be fed by `AccountRuntime.monitoringPath` (accountRuntime.ts:97), which produces the
second. Nothing catches this today because the health scaffold has no implementation, which is
precisely why it should be fixed now rather than discovered as a translation layer in phase 2.

This is a scaffold whose declared type is wrong, not a scaffold that is merely incomplete.

**Fix:** Delete one declaration and import the other. Given CR-04 needs the third state, keep
health.ts's three-value union as the single source and have the runtime import it:

```ts
// src/runtime/accountRuntime.ts
import type { MonitoringPath } from '../device/health.js';
```

and rename the runtime's values to `'shadow-and-poll' | 'poll-only' | 'unavailable'`. Note the
Cucumber step `Then the monitoring path is "rest-only"` in
`features/degradedOperation.feature` will need updating with it.

### WR-07: `changedKeys` compares by reference, so any nested telemetry value reports as changed on every poll

**Severity:** WARNING
**File:** `src/device/state.ts:156-160`

**Issue:** `Object.is(previous[key], next[key])` is reference equality for objects, and
`toSnapshot` re-parses every poll into fresh objects. Any telemetry field whose value is an
object or array therefore appears in `changedKeys` on every single poll even when nothing moved.
Verified against the built code: two identical `applyDiscovery` calls with `data: { nested: { a: 1 } }`
produce `changedKeys === ['nested']`.

The doc comment on `DeviceSnapshotListener` (lines 53-60) says consumers should filter on this
list *instead of* comparing snapshots again, "because comparing again is where duplicate
activation records come from" (D-19). A key that always reports as changed pushes that hazard
onto the consumer.

**Uncertainty:** every field enumerated in `src/device/gemini.ts:19-40` looks scalar, so this
may be unreachable for the only implemented family. It becomes reachable the moment a vendor
adds a structured field or HALO lands, and the failure mode is silent.

**Fix:** Either compare structurally for non-primitive values, or document the contract as
"scalar telemetry only" and reject a non-scalar value in the reducer so the assumption is
enforced rather than assumed.

### WR-08: `freeze()` is shallow but its comment promises otherwise

**Severity:** WARNING
**File:** `src/device/state.ts:106-114`

**Issue:** The comment says the freeze exists "so a consumer cannot edit canonical safety state
in place," but `Object.freeze` on `snapshot.data` only stops top-level key writes. Any nested
object inside `data` or `metadata` stays mutable, so a listener can silently rewrite stored
safety state. `notify` (line 172) hands the snapshot to arbitrary listeners, which is exactly the
surface the freeze is defending.

**Fix:** Freeze recursively, or state the limitation in the comment. A bounded recursive freeze
over the two opaque records is a few lines and matches the stated intent.

### WR-09: The redacting logger's secret list grows without bound

**Severity:** WARNING
**File:** `src/logging.ts:103-111`, `src/logging.ts:36-48`, `src/runtime/accountRuntime.ts:297-299`

**Issue:** `registerSecret` pushes onto an array that is never pruned, and `refreshCredentials`
registers three new values on every rotation — roughly hourly, forever. `redactText` runs
`split(secret).join(REDACTED)` once per registered secret **for every log message and every log
parameter**. A bridge running for a month accumulates ~2 000 entries, each of which is a full
string scan on every debug line the plugin writes.

Beyond the cost, the retained strings are expired credential material held in memory for the
life of the process, which the privacy constraint would rather not have.

**Fix:** Give the logger a bounded, replace-by-role registration instead of an append-only list:

```ts
const secrets = new Map<string, string>();          // role -> value
registerSecret('aws-access-key-id', value);         // replaces the previous one
```

Keep the id token and password permanently; let each rotated AWS value replace its predecessor.

### WR-10: `describeObject`'s fallback can itself throw

**Severity:** WARNING
**File:** `src/logging.ts:52-58`

**Issue:** The `catch` branch reads `value.constructor.name`. For an object created with
`Object.create(null)`, `value.constructor` is `undefined` and the property read throws a
`TypeError` **out of the logger**. `JSON.stringify` reaches that catch on a circular graph, so a
circular null-prototype object logged as a parameter takes down the calling log statement — and
`shadow.ts`/`accountRuntime.ts` call the log from inside `catch` blocks and message handlers,
where a throw is the exact thing those blocks exist to prevent.

**Fix:**

```ts
} catch {
  return '[unserializable object]';
}
```

### WR-11: `subscribe` and `publish` have no deadline, so a lost callback stalls silently

**Severity:** WARNING
**File:** `src/cloud/mqttTransport.ts:79-101`, `src/cloud/shadow.ts:276-291`

**Issue:** `subscribeOnce` and `publishOnce` resolve only when the library invokes the callback.
`requestEveryShadow` awaits `subscribe`, then awaits `publish` once per device in a sequential
loop (lines 278-282). A callback that never fires — a client that went down between connect and
subscribe — leaves the loop parked forever with no error, no timeout, and `live` still `true`
from `handleConnect`. The remaining devices never get their full-shadow request, and the plugin
reports a healthy combined path. This is the mechanism behind consequence 3 of CR-03; it is
listed separately because the fix belongs in the transport.

**Fix:** Race each callback against a deadline and reject on expiry, so the existing
`catch` in `requestEveryShadow` runs:

```ts
function withDeadline<T>(work: Promise<T>, deadlineMs: number, label: string): Promise<T> {
  return Promise.race([work, timers.setTimeout(deadlineMs).then(() => { throw new Error(label); })]);
}
```

### WR-12: The harness cannot detect a broken signer, and one scenario burns 30 real seconds

**Severity:** WARNING
**File:** `features/support/fakeShadowBroker.ts:237-259`, `src/runtime/accountRuntime.ts:35`, `features/support/steps/runtime.ts:26-27`

**Issue:** Two test-reliability gaps.

`createFakeShadowBroker` records `queryStringOf(request)` and accepts every handshake
(`verifyClient: () => !refusing`). No scenario ever validates the SigV4 signature, so the
integration suite would pass unchanged if `presignIotWebsocketUrl` produced garbage. The unit
test in `test/cloud/sigv4.test.ts` is good — it builds the expected signature independently —
but it and the harness share the same assumptions, so nothing in the repo is an independent
check of the security-critical path the project chose to own.

Separately, `MIN_ROTATION_DELAY_MS` (30 000) is a module constant that
`createAccountRuntime` does not accept by injection, unlike `pollIntervalMs`. So
`features/credentialRotation.feature`'s "the credentials rotate" step waits 30 real seconds
under a 45-second deadline (`ROTATION_DEADLINE_MS`), which is most of the suite's 40-second
runtime and is a flake waiting for a loaded CI box. This also contradicts the project's own
testing rule that scheduling be driven by an injected clock or fake timers rather than a real
wait.

**Fix:** Have the broker recompute the signature from the recorded query string and the
credential material it issued, and reject a mismatch — that makes `refuseConnections` a real
authorization test rather than a switch. Move `MIN_ROTATION_DELAY_MS` and `ROTATION_LEAD_MS`
into `AccountRuntimeOptions` alongside `pollIntervalMs` so a scenario can set them to
milliseconds.

### WR-13: `config.schema.json` and `validateConfig` disagree on blank strings and on required `name`

**Severity:** WARNING
**File:** `config.schema.json:9-35`, `src/config.ts:96-115`

**Issue:** Two real disagreements, not just duplication:

- The schema lists `name` in `required` (line 9) with no `minLength`; `validateConfig` treats an
  absent `name` as fine (defaults to `'Basement Guardian'`, line 143) but **refuses** an empty
  one (line 97). So the settings form accepts `"name": ""` and the plugin then refuses to start
  with "the platform name must not be empty when it is set."
- `password` and `clientId` carry `minLength: 1`, but `isConfiguredText` requires
  `trim().length > 0`. A value of `" "` passes the form and is refused at runtime.

`test/configSchema.test.ts` exists but evidently does not cross-check these cases.

**Fix:** Drop `name` from `required` and add `"minLength": 1` plus
`"pattern": "\\S"` to `name`, `password`, and `clientId` so the form enforces the same
non-blank rule the runtime does.

### WR-14: `.gitignore` force-includes a committed credential file; and three smaller items

**Severity:** WARNING
**File:** `.gitignore:~/test/hbConfig` block, `test/hbConfig/config.example.json:6`, `src/cloud/shadow.ts:24-29`, `src/cloud/shadow.ts:194-198`, `eslint.config.js:89-96`

**Issue:** Grouped because each is small:

1. `.gitignore` ignores `/test/hbConfig/*` and then re-includes `!/test/hbConfig/auth.json`.
   That file is tracked and contains a `hashedPassword` + `salt` for a `homebridge-config-ui-x`
   admin user. It predates this phase (added in the initial import) and is dev-only, but it is
   an offline-crackable credential in a public repo, and `config.example.json` pairs it with
   `"auth": "none"`. Delete it and let the UI generate one on first run.

2. `SHADOW_TOPICS` interpolates `deviceId` into MQTT topics with no escaping. A vendor id
   containing `+` or `#` would create wildcard subscriptions whose incoming topics cannot be
   found in the `routes` map, so every message for that device is silently dropped by
   `handleMessage`'s `route === undefined` early return. Vendor ids look like
   `<account>_<pump>` so this is likely unreachable, but the failure is silent.

3. `handleMessage`'s `rejected` branch logs a warning and returns. A `get/rejected` means that
   device's shadow could not be read, yet nothing marks the device untrustworthy and the
   connection continues to report healthy — a per-device blind spot inside a connection the
   runtime calls `rest-and-shadow`.

4. `eslint.config.js` disables `@typescript-eslint/no-floating-promises` for **all** of
   `features/**/*.ts`. The stated rationale is `node:test`'s `test()` return value, which does
   not apply in Cucumber files. The harness starts servers and clients, so this exemption hides
   exactly the class of bug the lifecycle scenarios exist to catch. Narrow it to `test/**`.

### WR-15: Dead production surface: `requestFullShadow`, `BgConfig.name`, `offlineConfirmationPollCount`

**Severity:** WARNING
**File:** `src/cloud/shadow.ts:85`, `src/cloud/shadow.ts:337-339`, `src/config.ts:37-39`, `src/config.ts:147-148`

**Issue:** `ShadowClient.requestFullShadow` has no production caller — only
`test/cloud/shadow.test.ts` and a stub in `test/runtime/accountRuntime.test.ts`. Its stated job
(SYNC-03, request a complete shadow after connecting) is already done by `requestEveryShadow`.
As written it also publishes on whatever `transport` currently holds, which after CR-03 may be
a superseded connection, and its rejection would be unhandled at the call site since it returns
a promise nobody awaits.

`BgConfig.name` and `BgConfig.offlineConfirmationPollCount` are validated, defaulted, and
carried through `createAccountRuntimeFromConfig` but read by nothing. `.fallowrc.json` does not
list `src/cloud` or `src/config.ts` among its declaration-only exemptions, so the dead-code gate
is not catching these.

**Fix:** Remove `requestFullShadow` until a caller exists (the reconnect path already covers the
requirement). Leave the two config fields if phase 2 consumes them, but add them to the
`.fallowrc.json` rationale so the exemption is deliberate rather than a gap.

---

_Reviewed: 2026-08-29T04:44:24Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
