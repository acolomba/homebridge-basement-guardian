---
phase: 05-degraded-operation-and-recovery
reviewed: 2026-09-02T00:00:00Z
depth: deep
files_reviewed: 34
files_reviewed_list:
  - CHANGELOG.md
  - README.md
  - features/degradedOperation.feature
  - features/officialControls.feature
  - features/support/fakeAuth0.ts
  - features/support/fakeHap.ts
  - features/support/fakeHomebridgeApi.ts
  - features/support/fakeRestApi.ts
  - features/support/steps/authentication.ts
  - features/support/steps/homekit.ts
  - features/support/steps/runtime.ts
  - features/support/steps/shadow.ts
  - features/support/world.ts
  - src/accessories/basementGuardian.ts
  - src/accessories/controls.ts
  - src/accessories/serviceCatalogue.ts
  - src/accessories/staleMarking.ts
  - src/device/state.ts
  - src/platform.ts
  - src/runtime/accountRuntime.ts
  - src/runtime/monitoringHealth.ts
  - test/accessories/accessoryReadPathScope.test.ts
  - test/accessories/basementGuardian.test.ts
  - test/accessories/controls.test.ts
  - test/accessories/hapImportScope.test.ts
  - test/accessories/hapWriteFidelity.test.ts
  - test/accessories/serviceCatalogue.test.ts
  - test/accessories/staleMarking.test.ts
  - test/accessories/timerFreedom.test.ts
  - test/config.test.ts
  - test/device/state.test.ts
  - test/platform.test.ts
  - test/runtime/accountRuntime.test.ts
  - test/runtime/monitoringHealth.test.ts
findings:
  critical: 4
  warning: 8
  info: 0
  total: 12
status: issues_found
---

# Phase 5: Code Review Report (second pass)

**Reviewed:** 2026-09-02
**Depth:** deep
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Reviewed the whole `bface8d..HEAD` diff as one artifact: `monitoringHealth.ts`, the widened
publishing predicate, the telemetry handover, the auth halt, the accessory restore path, the
harness changes, and the docs. Nothing from `05-REVIEW.md` is re-reported.

Every finding below was reproduced by executing code, not inferred from a summary. Four of them are
false-normal paths — a normal-looking, fully-vouched-for HomeKit reading over data no transport
delivered — which is the class this project exists to prevent.

The three code blockers are all interaction defects between plans that were each verified alone:

- `05-11` handed telemetry to the poll on shadow silence, but the silence predicate `05-01` built is
  **account-wide** while telemetry ownership is **per device**. On a two-pump account, one pump going
  permanently silent is invisible: 40 consecutive polls reporting a flooded pit were discarded and
  every tile stayed `Status Active = true` (CR-01, reproduced).
- `05-12` closed the shadow so no message could clear the credential-refusal marking. The control
  write path still can: one press on either Switch permanently returns **both** control services to
  `Status Active = true` on a runtime that has halted for good (CR-02, reproduced).
- `05-11`'s ownership-return rule reads "carries an observation" as `data || state`, but ownership
  governs `data` alone. A metadata-only reported document takes telemetry ownership without
  delivering telemetry, and the same document keeps `shadowSilent` false, so the poll is locked out
  with nothing releasing it (CR-03, reproduced).

The README and CHANGELOG paragraphs added and corrected twice during the phase now overstate what
HomeKit shows in the exact safety case, and the phase's own unit test pins the opposite behaviour
(CR-04).

Verified sound, contrary to expectation: `ShadowClient.close()` is memoized so the halt's close and
`stop()`'s close cannot double-end a transport; `hasFinished()` correctly gates every reopen site
including the post-`await` one in `attemptShadow`; `closeQuietly` swallows the halt-path rejection so
nothing floats; the `isRowPublishable` widening cannot add a service or invent a value, because
`ensureService` is only reachable from `update()` with a freshly decoded snapshot; the static gates
carry real floors and real planted-violation controls; `onSet` is confirmed a single slot in the
pinned HAP, so the restored refusal is genuinely replaceable; no credential, token, base URL or
account identifier reaches a log on any new path.

Mutation testing of the phase's own claims: reverting the `SEEING_LESS_REASONS` widening fails 8
unit tests; removing the silence-triggered release fails 1 unit test and 3 scenarios; disabling
`bindRestoredControlRefusal` fails 7 unit tests and 1 scenario. Two claims did **not** survive
(WR-01, WR-04).

## Critical Issues

### CR-01: Shadow silence is measured account-wide, so one silent device among several freezes its telemetry with every tile still vouched for

**File:** `src/runtime/monitoringHealth.ts:141,152-154,159` · `src/runtime/accountRuntime.ts:332-334,639` · `src/device/state.ts:195-197,350-354`

**Issue:** `createMonitoringHealth` holds a single `lastShadowMessageAt`, and
`onReportedPatch` calls `health.recordShadowMessage()` while discarding the `deviceId` it was handed
(`accountRuntime.ts:613,639`). Telemetry ownership, however, is per device: `pollTelemetry` consults
`previous?.shadowVersion` on that device's own snapshot.

So on a multi-device account any one device's heartbeat re-stamps the account-wide arrival clock.
A device whose controller stops speaking never trips `shadowSilent`, `applyDevices` never calls
`releaseShadowSource()`, its `shadowVersion` stays set, and every subsequent poll body is discarded
by `pollTelemetry`. `markMonitoring` is never told anything is wrong, so `Status Active` stays `true`
on all of that device's services while its readings are frozen at the last live message.

Both the `releaseShadowSource` doc (`state.ts:114-118`) and `pollTelemetry`'s comment
(`state.ts:186-191`) state the rule in per-device language — "a **device** the monitoring-trust
projection reports silent, with its socket still open" — a claim the account-level projection cannot
make. D-05's own wording is per device too. The account-wide implementation is the drift.

Reproduced against the built modules (two devices, `pumpB` heartbeating, `pumpA` silent, 40 polls
each reporting a flooded pit):

```text
after 10 hours of pumpA silence with pumpB healthy:
  account shadowSilent = false
  pumpA stored water_level = 3   (the poll reported 31 on every one of 40 polls)
  pumpA shadowVersion = 1
```

This is D-04's headline case — the invisible one — made strictly worse, because the marking that was
supposed to be the consolation prize never fires either.

**Fix:** Track arrivals per `deviceId` and answer silence per device. Minimum shape:

```ts
// monitoringHealth.ts
export interface MonitoringHealth {
  recordShadowMessage(deviceId: string): void;
  /** Every deviceId whose live path has been silent for two heartbeats. */
  silentDevices(knownDeviceIds: readonly string[]): readonly string[];
  trustNow(knownDeviceIds: readonly string[]): TransportTrust; // shadowSilent = any device silent
}
```

then in `applyDevices`, release per device rather than for the whole store:

```ts
for (const deviceId of health.silentDevices(options.store.deviceIds())) {
  options.store.releaseShadowSource(deviceId);
}
```

and seed a device's arrival stamp when `applyDiscovery` first admits it, so a device added later
does not inherit the runtime's construction stamp. Prune stamps in `onDeviceRemoved` so the map
cannot grow without bound. Add a unit case with two devices where only one goes quiet, and a
Cucumber scenario with two `deviceId` rows in the background table — no current scenario uses more
than one device, which is why the whole suite is blind to this.

---

### CR-02: A press on a control Switch after a refused credential permanently restores `Status Active = true` on both controls

**File:** `src/accessories/controls.ts:323-327,447-451,465-470` · `src/accessories/basementGuardian.ts:582-588,594-606` · `src/platform.ts:395-397`

**Issue:** `05-12` closed the shadow at the halt so no arriving message could clear the
`HapStatusError` that makes a credential refusal present as No Response. The control write path is a
second door into the same defect and it is still open.

After the halt, `commandTransportReady()` is `false`, so a press is refused locally — correctly. But
`refuseLocally` calls `armClearingPush`, whose macrotask runs `clearRefusal` → `republish()` →
`republishControlRows` → `publishRow`, and `publishRow` ends with
`publishValue(service, StatusActive, isRowFullyTrusted(...))`. An ordinary value push clears a stored
status (pinned against real HAP in `test/accessories/hapWriteFidelity.test.ts:329-343`), so the
refusal marking on both control services is erased. Worse, `credentialsRejected` withdraws no trust
scope (see WR-03), so the value pushed is `true` — the accessory actively claims it vouches for what
it shows, on a runtime that will never observe anything again. Nothing pushes afterwards, so it stays
that way until the owner restarts.

Reproduced against the built modules:

```text
--- after credential refusal
flood StatusActive: refused(-70402)
selftest StatusActive: refused(-70402)
alarmmute StatusActive: refused(-70402)
WARN: Refused self-test on account-1_serial-1: the plugin has no way to reach the vendor right now.
press refused with status -70412
--- after a press on the self-test control
flood StatusActive: refused(-70402)
selftest StatusActive: answered(true)      <-- vouched for, on a halted plugin
selftest On:         answered(false)
alarmmute StatusActive: answered(true)
alarmmute On:        answered(false)
```

`expire()` (`controls.ts:438-445`) and `refuseOutcome()` (`controls.ts:475-481`) reach the same
`republish()` and leak identically. The restored-accessory path does **not** leak, because
`bindRestoredControlRefusal` passes `nothingToRepublish` and pushes only `On`, which carries no
status — which is exactly the shape the fix should take.

`features/degradedOperation.feature:355` ("A credential refused mid-run stays refused when the next
heartbeat lands") closes the message route and asserts the switch service still answers no read. The
press route is uncovered.

**Fix:** Make the halt a state the accessory tier holds, so a republish cannot contradict it. Either:

1. Have `markMonitoring` record `credentialsRejected` and make `publishRow` push the persistent
   failure instead of a boolean while it is set:

   ```ts
   function publishRow(row: ServiceRow, service: Service, input: ProjectionInput): void {
     for (const value of row.project(input)) {
       publishValue(service, value.characteristic, value.value);
     }

     if (monitoring.credentialsRejected) {
       publishPersistentFailure(hap, service, hap.Characteristic.StatusActive, hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

       return;
     }

     publishValue(service, hap.Characteristic.StatusActive, isRowFullyTrusted(row, input.untrustedScopes));
   }
   ```

2. Or gate the whole write path earlier: when `monitoring.credentialsRejected` is set, refuse with the
   refusal status and arm **no** clearing push at all — the No Response presentation is already the
   answer the owner must act on, and D-10 reserves it for exactly this cause.

Add a Cucumber step to `features/degradedOperation.feature:355` that presses the switch after the
refusal and asserts `the "System Self-Test" service still answers no read for "Status Active"`.

---

### CR-03: A metadata-only shadow document takes telemetry ownership without delivering telemetry, and locks the poll out permanently

**File:** `src/device/state.ts:226-228,236-242,250` · `src/runtime/accountRuntime.ts:639`

**Issue:** `nextShadowVersion` refuses to *establish* a watermark from a document that observed
nothing, and its comment states the hazard exactly: "a document carrying no observation would take
ownership from the poll on the strength of having seen nothing, freezing telemetry at whatever the
poll last wrote."

The guard is one field short. `carriesObservation` answers `patch.data !== undefined || patch.state
!== undefined`, but ownership governs `data` alone — `state` is device metadata, merged into
`snapshot.metadata` and read by nothing safety-relevant except `FirmwareRevision`. A `state`-only
document is therefore treated as an observation, establishes the watermark, and freezes telemetry.

The plugin subscribes to `$aws/things/<id>/shadow/update/accepted` (`src/cloud/shadow.ts:36,158`),
which is the delta the device just reported. A device updating only its `state` section — wifi
signal, firmware, uptime — produces exactly this patch.

It compounds: the same message runs `health.recordShadowMessage()`
(`accountRuntime.ts:639`), so `shadowSilent` stays false, `applyDevices` never releases, and there is
no route back to the poll short of a disconnection. Every tile reads normal with `Status Active =
true`.

Reproduced against the built store:

```text
released, v = undefined
after state-only doc, v = 9   data { water_level: 31 }
--- freeze proof: poll now reports 7
after poll reporting 7: { water_level: 31 } v 9
```

No unit case covers a `state`-only patch reaching `nextShadowVersion`; every D-13 case at
`test/runtime/accountRuntime.test.ts:965-1060` sends `data`.

**Fix:** Split the two questions. Ownership is about telemetry; the watermark is about ordering:

```ts
// A watermark may still advance on any document, because ordering is ordering. It may only be
// *established* by a document that carried telemetry, because establishing it is what takes
// ownership of `data` from the poll.
function nextShadowVersion(previous: DeviceSnapshot, patch: ReportedPatch): number | undefined {
  if (patch.data === undefined && previous.shadowVersion === undefined) {
    return undefined;
  }

  return patch.version ?? previous.shadowVersion;
}
```

`receivedAt` should keep using the wider `carriesObservation` — a metadata report *is* a report about
the device. Add a case: release, deliver `{ data: undefined, state: {...}, version: n }`, then poll a
changed telemetry value and assert the poll won.

---

### CR-04: README and CHANGELOG promise that poll readings reach HomeKit during shadow silence; for the first ~30 minutes they are discarded, and a unit test pins that

**File:** `README.md:145` · `CHANGELOG.md:24` · `src/device/state.ts:195-197` · `test/runtime/accountRuntime.test.ts:987-1002`

**Issue:** README:145 reads:

> The delay is to the report, never to a reading. The plugin holds no value back while it waits, and
> it turns nothing normal. It still sends the readings from each successful poll to HomeKit. **If a
> poll finds a flooded pit while the live connection is quiet, `Sump Pit Flood` reports it.**

That is false for the whole window the paragraph is about. `applyDevices` releases the watermark only
once `health.trustNow().shadowSilent` is already true — 1,796,000 ms, roughly 30 minutes, after the
last message. Until then `pollTelemetry` returns `previous.data` and the poll body is dropped. The
phase ratified this and tests it deliberately: `test/runtime/accountRuntime.test.ts:987` — "D-13 keeps
a pump run the live path reported when a poll arrives inside the two-heartbeat window". Reproduced:

```text
after heartbeat            { water_level: 3 }   v 5
after poll (shadow owns)   { water_level: 3 }   <-- the poll reported 31
after release + poll       { water_level: 31 }  v undefined
```

The paragraph even admits the marking is late ("Until that poll, the affected services still say the
plugin vouches for them") while asserting the reading is not — the inverse of what the code does. An
owner reading this concludes a flooded pit will always show. CHANGELOG:24's "successful polls keep
their readings current" carries the same claim.

README:151 has a second, smaller overstatement: "Every service then stops answering whether the
plugin vouches for it" — `markServicesUnreadable` only errors services that already carry
`Status Active` (see WR-08).

**Fix:** Rewrite README:145 to say what happens, in Simplified Technical English:

```markdown
The delay is to the report and to the reading. While the live connection still owns the readings, a
poll does not replace them. The plugin gives the readings back to polling after two missed
heartbeats, which is about 30 minutes. From that point, each successful poll updates the tile: if a
poll finds a flooded pit, `Sump Pit Flood` reports it, and the trust row alone carries the doubt.
Before that point, the tile shows the last reading the live connection sent.
```

Correct CHANGELOG:24 the same way, and soften README:151 to "Every service that reports whether the
plugin vouches for it stops answering."

## Warnings

### WR-01: The unit test that claims to pin the credential-refusal push ordering passes with the ordering inverted

**File:** `test/platform.test.ts:1246-1266`

**Issue:** The comment above the case says the ordering "is load-bearing and this is what pins it".
It does not. The case installs `recordingBasementGuardianAccessory`, a stand-in that appends a string
and pushes nothing, and reads statuses off `restored.floods`, which are not in the
`basementGuardianAccessories` map. So the boolean fan-out never touches the services the error push
touches, and the case cannot observe the clobber it names.

Verified by mutation: inverting the two loops in `applyMonitoringHealth` leaves **all 54 platform
unit tests and all 1348 unit tests green**. Only the Cucumber tier catches it (2 scenarios). The
protection exists, but not where the comment says it does — and the unit tier is the one that runs on
every edit.

**Fix:** Drive the fan-out through a real `BasementGuardianAccessory` bound to the same accessory the
error push walks, so an inverted ordering leaves `Status Active` answering a value:

```ts
const accessory = restored.accessories.values().next().value;
const bg = createBasementGuardianAccessory({ accessory, hap, registry: geminiRegistry(), ... });
bg.update(snapshot, 'poll');
const context = discoveryContext({ accessories: restored.accessories, basementGuardianAccessories: new Map([[ACCESSORY_UUID, bg]]) });

applyMonitoringHealth(context, { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: true });

assert.deepStrictEqual(statusesOf(restored.floods), [COMMUNICATION_FAILURE, COMMUNICATION_FAILURE]);
```

---

### WR-02: During shadow silence the control row publishes the reported value while the write path refuses with "the plugin has no fresh state for it"

**File:** `src/accessories/serviceCatalogue.ts:535-539` · `src/accessories/basementGuardian.ts:526-535` · `src/accessories/controls.ts:86-92` · `features/officialControls.feature:173-176`

**Issue:** `05-06` widened `isRowPublishable` so an `unreachable` distrust no longer withholds. It
did not widen `reportedControlValue`, which still returns `undefined` for any untrusted scope. The two
now disagree about the same fact.

Reproduced (REST healthy, shadow silent, self-test scope untrusted for `unreachable`):

```text
healthy:       On = false  StatusActive = true
shadow silent: On = false (published: true)  StatusActive = false
press refused -70412
warn: Refused self-test on a_b: the plugin has no fresh state for it.
```

Two documents now assert the opposite of the code:

- `controls.ts:86-92`: "The accessory answers this from the same account-wide monitoring trust its
  rows publish from, so the fact a row publishes from and the fact a write is refused on cannot
  disagree."
- `features/officialControls.feature:174-175`: "once the control's own scope is untrusted the row
  withholds the reported value". It does not; the scenario passes for a different reason than the
  one it states.

The user-facing cost is a diagnostic naming a cause that did not happen — the failure
`reportDegradation`'s own comment (`basementGuardian.ts:733-736`) calls "worse than none because an
owner acts on it". The plugin has fresh state; what it lacks is a fast confirmation channel.

**Fix:** Decide which fact the refusal is about and make both halves read it.

- If the refusal is genuinely about the transport, add a distinct rule and cause between
  `hasNoCommandTransport` and `hasNoFreshState`, e.g.
  `cause: 'the live connection has gone quiet, so a confirmation cannot be observed'`, driven from
  `monitoring.shadowSilent` directly.
- If it is about state, make `reportedControlValue` tolerate `unreachable` the same way the row does,
  so a press during shadow silence is allowed and confirmed by the next poll.

Either way, correct `controls.ts:86-92` and the scenario comment, and add a unit case that asserts the
published `On` and the refusal cause agree.

---

### WR-03: `credentialsRejected` withdraws no trust scope, so the halt marking rests entirely on a status any push erases

**File:** `src/accessories/basementGuardian.ts:306-312,819-823`

**Issue:** `monitoringDegradedScopes` reads only `shadowSilent` and `restDegraded`. A halted runtime
whose last poll succeeded therefore produces an empty `untrusted` set, and `republishPublishedRows`
pushes `Status Active = true` on every row. The only thing that says anything is wrong is the
`HapStatusError` the platform pushes afterwards — a single, erasable byte of state on each
characteristic, with no in-memory fact behind it.

That is the structural reason CR-02 exists, and it makes any future value-push path a re-occurrence.
It is also why the halt marking is not idempotent under a republish: it survives only because
`applyMonitoringHealth` re-marks after every fan-out, and only the platform does that.

**Fix:** Give the halt a scope withdrawal as well as the status, so the two agree:

```ts
function monitoringDegradedScopes(trust: MonitoringTrust): ReadonlySet<TrustScope> {
  // A refused credential ends every observation this runtime will ever make, so nothing it holds is
  // current whatever the transports last reported (D-10, D-13).
  if (trust.credentialsRejected) {
    return EVERY_SCOPE;
  }

  ...
}
```

`Status Active = false` under the error is then the truthful value if the status is ever cleared,
rather than `true`.

---

### WR-04: `credentialsRejected` in the `unchanged` comparison is unproven and, as written, unreachable as a distinct change

**File:** `src/accessories/basementGuardian.ts:819-823`

**Issue:** The comment claims "Any member left out of this list is a fact the runtime has pushed and
this accessory silently ignored". Verified by mutation: replacing
`trust.credentialsRejected === monitoring.credentialsRejected` with `true` leaves **1348 unit tests
and 96 Cucumber scenarios green**. Neither tier can see it.

Tracing the runtime, that is because `halted` is assigned in exactly one place and
`commandTransportReadyNow()` reads `!halted`, so the two members move together in every reachable
path except one (two failed polls, then a halt) — where the republish it triggers has no observable
effect either, since the platform's error push follows it.

The member is not wrong, but the comment asserting each member is load-bearing is, and a reader will
trust it. Once WR-03 is applied the member becomes genuinely load-bearing and testable.

**Fix:** Either add a case that reaches the state — a `commandTransportReady: false` trust followed by
the same trust with `credentialsRejected: true`, asserting a republish happened — or narrow the
comment to say which members are proven and which are defensive.

---

### WR-05: The account-wide release strips ownership from healthy devices too

**File:** `src/device/state.ts:350-354` · `src/runtime/accountRuntime.ts:332-334`

**Issue:** `releaseShadowSource()` takes no argument and clears the watermark on every stored
snapshot. When the account-wide predicate does trip (single-device accounts, or a whole-broker
outage), it also strips ownership from any device whose live path is fine. Their fresher shadow
telemetry is then overwritten by the poll's snapshot on **every poll of the silence**, and ownership
flaps back on each device's next message — the "ownership ping-pong" this phase set out to avoid.

Harmless on a single-device account, which is why no test sees it. It is the same per-device /
per-account confusion as CR-01, from the other end.

**Fix:** Take the fix in CR-01 — `releaseShadowSource(deviceId)` — and release only the devices whose
own arrival stamp is stale.

---

### WR-06: A control confirmation arriving on the poll that crosses into shadow silence is dropped, and the request expires with a false "never confirmed" warning

**File:** `src/accessories/basementGuardian.ts:793-797,526-535,882-904`

**Issue:** In `update()`, `untrusted` is recomputed at line 886 and `reconcileControls()` runs at line
904. On the poll that first observes shadow silence, the control's scope becomes untrusted before
reconciliation runs, so `reportedControlValue` returns `undefined` and
`requested.get(capability)?.value === reported` is `true === undefined`, which never matches.

An accepted self-test that the device confirmed on that very snapshot therefore stays pending, and 30
seconds later `expire()` logs "The self-test request on `<deviceId>` was never confirmed by the
device. It is not retried." — naming a device failure for a plugin-side trust withdrawal. Reachable
whenever a press lands within one pending window of the silence threshold.

**Fix:** Reconcile against what the device reported, not against what the accessory currently vouches
for. Reconciliation is a confirmation of a request the plugin itself issued; the trust gate belongs on
publishing and on the write, not here:

```ts
function reconcileControls(): void {
  for (const control of CONTROLS.values()) {
    // The device's own report resolves the request. A scope the accessory cannot vouch for still
    // reported something, and a request confirmed by a report the plugin then discarded expires with
    // a message naming a device failure that did not happen (CTRL-03).
    controls.reconcile(control.capability, decodedControlValue(control));
  }
}
```

where `decodedControlValue` is `reportedControlValue` without the `untrusted` guard.

---

### WR-07: The `DiscoveryContext` literal is built three times in the platform constructor

**File:** `src/platform.ts:496-546`

**Issue:** `onTrustworthyInventory`, `onMonitoringHealth` and `onDeviceRemoved` each construct an
identical eight-field `DiscoveryContext` inline. `onMonitoringHealth` is new in this phase and made a
two-way duplication a three-way one. A field added to `DiscoveryContext` must now be added in three
places, and a field added to only two produces a silent behavioural difference between the discovery
path and the monitoring path — exactly the class of drift D-12 exists to prevent. The Cucumber harness
already solves this with a `discoveryContext()` helper (`features/support/world.ts`), so the platform
is the outlier. `fallow dupes` does not flag it because module wiring is excluded from clone
detection.

**Fix:** Build it once:

```ts
const discoveryContext = (): DiscoveryContext => ({
  api: this.api,
  accessories: this.accessories,
  basementGuardianAccessories: this.basementGuardianAccessories,
  registry: this.registry,
  log: this.log,
  ignoredFaults: validated.config.ignoredFaults,
  offlineConfirmationPollCount: validated.config.offlineConfirmationPollCount,
  timers: systemTimers,
  commands: runtime.commands,
});
```

and pass `discoveryContext()` from each of the three callbacks. It must stay a function, not a
constant: `runtime.commands` is not available until the seam returns.

---

### WR-08: `markServicesUnreadable`'s name, doc and README claim more than the pass does

**File:** `src/accessories/staleMarking.ts:135-161` · `README.md:151`

**Issue:** The function is documented as "Makes every service on one accessory unreadable" and the
README as "Every service then stops answering whether the plugin vouches for it". Both overstate two
ways:

1. The walk is guarded by `testCharacteristic(hap.Characteristic.StatusActive)`, so a service that
   never carried `Status Active` — a cache written by a release before the row published it, which is
   precisely the upgrade path the module header says these passes exist to handle — is skipped
   entirely and stays fully readable through a credential refusal.
2. Only `Status Active` is made unreadable. Every other characteristic still answers, which the
   README correctly says one sentence later ("a controller that reads one of those values directly
   still gets it") and which contradicts "every service ... stops answering".

The narrowing in (1) is deliberate and correct — adding a characteristic on upgrade changes a
published identity. The naming is what is wrong, and the count the function returns is the only thing
that would tell an operator the pass reached nothing.

**Fix:** Rename to `markServicesNotVouchedFor` or `markTrustReportsUnreadable`, restate the doc as
"Makes the trust report on every service that carries one unreadable", and log a distinguishable line
when the count is zero, since a cache with no `Status Active` anywhere is the one case where a
credential refusal produces no visible signal at all.

---

_Reviewed: 2026-09-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
