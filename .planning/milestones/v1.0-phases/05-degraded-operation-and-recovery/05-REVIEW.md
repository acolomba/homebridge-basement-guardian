---
phase: 05-degraded-operation-and-recovery
reviewed: 2026-09-02T03:50:43Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - src/runtime/monitoringHealth.ts
  - src/runtime/accountRuntime.ts
  - src/accessories/basementGuardian.ts
  - src/accessories/staleMarking.ts
  - src/accessories/serviceCatalogue.ts
  - src/accessories/controls.ts
  - src/platform.ts
  - features/support/fakeHap.ts
  - features/support/fakeHomebridgeApi.ts
  - features/support/fakeRestApi.ts
  - features/support/world.ts
  - features/support/steps/homekit.ts
  - features/support/steps/runtime.ts
  - features/support/steps/shadow.ts
  - features/degradedOperation.feature
  - features/officialControls.feature
  - test/runtime/monitoringHealth.test.ts
  - test/runtime/accountRuntime.test.ts
  - test/accessories/basementGuardian.test.ts
  - test/accessories/staleMarking.test.ts
  - test/accessories/serviceCatalogue.test.ts
  - test/accessories/controls.test.ts
  - test/accessories/accessoryReadPathScope.test.ts
  - test/accessories/hapImportScope.test.ts
  - test/accessories/hapWriteFidelity.test.ts
  - test/accessories/timerFreedom.test.ts
  - test/platform.test.ts
  - test/config.test.ts
  - README.md
  - CHANGELOG.md
findings:
  critical: 3
  warning: 8
  info: 3
  total: 14
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-09-02T03:50:43Z
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

The phase's declared machinery is present and mostly well built. `MonitoringTrust` is stored
outside the unchanged-value early return and the comparison covers all four members
(`src/accessories/basementGuardian.ts:807-819`), so the plan checker's one blocker is genuinely
closed. `monitoringPathNow()` is byte-identical to its pre-phase form. Shadow silence is measured
from `onReportedPatch` arrivals against the injected clock and is not cleared by a REST poll. The
static gates carry real enumeration floors and their planted-fixture negative controls are
non-vacuous. `test/accessories/hapWriteFidelity.test.ts` is the strongest artifact in the phase: it
drives one script against the pinned real HAP and the stand-in and compares the whole record.

Three defects reach past that. Two of them are the project's own worst failure class, reached by a
route the design documents did not anticipate: **withdrawing trust from a scope also stops that
scope publishing at all, so a still-working transport's fresh, family-valid flood reading is
decoded and then discarded while HomeKit goes on showing the pre-degradation "no leak".** The third
is that a credential rejection occurring after a successful start never reaches the terminal branch
at all, so the whole D-10 presentation is unreachable in the case a user will actually hit.

Findings CR-01, CR-02 and WR-01 were confirmed empirically by driving the real `Gemini` family
through `createBasementGuardianAccessory` over the built `dist-test` tree, not by reading alone. The
transcripts are quoted in each finding.

## Critical Issues

### CR-01: A withdrawn monitoring scope discards fresh valid data from the transport that is still working, leaving a false normal on the tile

**File:** `src/accessories/basementGuardian.ts:642-671` (with `src/accessories/serviceCatalogue.ts:596-599`)

**Issue:**
`markMonitoring()` puts every affected scope into `untrusted` with reason `unreachable`. Every
subsequent `update()` then runs `row.project(input)`, which is
`isRowTrusted(this, input.untrustedScopes) ? values(input, this) : []`. For a monitoring
degradation the row's `toleratedDistrust` is `[]`, so `project()` returns `[]` and `publishRows()`
pushes nothing but `StatusActive`. The last published value stays where it is.

That is correct when a *field* failed validation, because the value is invalid. It is wrong for a
monitoring degradation, because the values arriving on the transport that is still working are
valid. D-04 and D-02 say shadow silence *marks* the scopes untrustworthy; neither says it stops
publishing what REST is still supplying. The implementation reuses the D-014 withholding mechanism
for a cause whose values are not in doubt.

The consequence is the exact failure the project exists to prevent. With the shadow quiet and REST
healthy, a poll reporting a flooded pit is decoded, validated by the family, and then thrown away.
Apple Home does not draw `Status Active` on the tile, so the owner sees "no leak" while the plugin
holds "leak". Nothing in HomeKit fires.

Reproduced against the built tree with the real Gemini adapter:

```text
after first dry poll     { leakDetected: 0, statusActive: true }
after shadow goes quiet  { leakDetected: 0, statusActive: false }
after FLOODED poll       { leakDetected: 0, statusActive: false }
   untrusted = water:unreachable,pump:unreachable,power:unreachable,battery:unreachable,
               fault:unreachable,self-test:unreachable,alarm-mute:unreachable
```

(`water_level: 31` is `PROVISIONAL_FLOOD_WATER_LEVEL_CODE`; `leakDetected: 0` is
`LEAK_NOT_DETECTED`.)

The existing tests cannot see this. `test/accessories/basementGuardian.test.ts`'s "keeps a lost
monitoring path withdrawn across the polls that arrive during it" polls with the *same* telemetry
and asserts only `Status Active` and the distrust list; "retains every published value across a lost
monitoring path and moves the trust flag alone" asserts that nothing moved, which is the defect's
own signature. `features/degradedOperation.feature`'s "Shadow silence withdraws trust while polling
continues" asserts `the "Sump Pit Flood" sensor is not activated` after a *dry* poll, which passes
either way.

**Fix:**
Separate "cannot vouch for this scope" from "must not publish this scope". A distrust reason that
means *the plugin is seeing less* should still let a row publish what it did receive, exactly as
`controller-link-lost` already does for the one row that tolerates it. The narrowest change is to
make `unreachable` tolerated by every row's projection while still driving `StatusActive` false,
so the value keeps flowing and the trust flag alone carries the doubt:

```ts
// src/accessories/serviceCatalogue.ts
// A monitoring outage says the plugin is seeing less, never that the value it did
// receive is doubtful, so a row keeps publishing what arrived and only stops
// vouching for it. Withholding here would discard a valid flood reading the
// still-working transport supplied (D-02, D-014).
const MONITORING_DISTRUST: DistrustReason = 'unreachable';

export function isRowTrusted(row: RowTrust, untrustedScopes: readonly UntrustedScope[]): boolean {
  return !untrustedScopes.some(
    (untrusted) =>
      untrusted.scope === row.scope &&
      untrusted.reason !== MONITORING_DISTRUST &&
      !row.toleratedDistrust.includes(untrusted.reason),
  );
}
```

`isRowFullyTrusted()` — which is what `StatusActive` reports — must keep counting `unreachable` as
untrusted, so add the carve-out to `isRowTrusted` alone and give `isRowFullyTrusted` its own
un-narrowed predicate. Add a case that polls a *changed, flooded* payload during shadow silence and
asserts `Leak Detected` reached HomeKit with `Status Active` still `false`; without that assertion
the fix is unprovable.

---

### CR-02: A recovered shadow does not restore publishing until the next poll tick, so up to an hour of fresh live data is discarded

**File:** `src/runtime/accountRuntime.ts:406-444, 508-516`

**Issue:**
`reportMonitoringHealth()` is called from `recordPollSuccess()` and `recordPollFailure()` and
nowhere else. `health.recordShadowMessage()` updates the arrival stamp but reports nothing, and
`handleShadowConnected()` reports nothing either. So the `shadowSilent` latch that the accessory
holds only clears on the next poll tick.

D-05 ratifies *lazy detection* on the poll tick. It does not ratify lazy *clearing*, and D-11 is
explicit that "a single good observation restores it, because a good observation is direct
evidence". Combined with CR-01 the effect is that every live message arriving in the recovery
window is decoded, stored into `lastDecoded`, and then not published:

```text
after shadow goes quiet   { leakDetected: 0, statusActive: false }
after live flood update   { leakDetected: 0, statusActive: false }   <- fresh shadow message
after trust restored      { leakDetected: 1, statusActive: true }    <- only at the poll tick
```

`pollIntervalSeconds` accepts up to 3600, so a flood detected one second after the live path
recovers can go unreported in HomeKit for an hour. `features/degradedOperation.feature`'s "An
identical heartbeat clears the shadow silence" runs under `a short poll interval`, so it passes
without discriminating this.

**Fix:**
Report from the arrival callback when the latch actually moves. No timer and no real-time loop is
introduced, so D-05's testability constraint is untouched:

```ts
// src/runtime/accountRuntime.ts
let reportedShadowSilent = false;

// ... inside createShadow's onReportedPatch, after health.recordShadowMessage():
onReportedPatch: (deviceId: string, patch: ReportedPatch) => {
  health.recordShadowMessage();
  options.store.applyReportedPatch(deviceId, patch);

  // A message is direct evidence that the live path is carrying again, and D-11
  // matches clearing to cause. Waiting for the poll tick would hold the recovery
  // for a whole poll interval -- an hour at the configured maximum.
  if (reportedShadowSilent) {
    reportMonitoringHealth();
  }
},
```

and set `reportedShadowSilent = trust.shadowSilent;` inside `reportMonitoringHealth()` so the
report fires once per recovery rather than on every heartbeat.

---

### CR-03: A credential rejection after a successful start never reaches the terminal branch, so the D-10 presentation is unreachable in the common case

**File:** `src/runtime/accountRuntime.ts:617-635, 657-693`

**Issue:**
`halted = true` is assigned in exactly one place, `launchFailure()` (line 667), and `launchFailure`
is reached only from `launch()`, which runs from `start()` and from `relaunch()`. `relaunch()` runs
only while a launch keeps answering `AuthThrottledError`. Once `startBackgroundWork()` has run, the
only path that sees a vendor error is `runPoll()`'s catch — and that catch does not inspect the
error type at all:

```ts
} catch (error: unknown) {
  if (root.signal.aborted) { return; }
  recordPollFailure(error);
}
```

So when a user changes their vendor password, or the vendor blocks the account, while Homebridge is
running:

- `credentialsRejected` is never pushed, so `applyMonitoringHealth()`'s `markServicesUnreadable`
  branch (`src/platform.ts:376-397`) never runs and no accessory ever presents as No Response.
- `AUTHENTICATION_STOPPED` is never logged. `describeFailure()` answers the generic
  `'Device discovery failed.'` for `AuthHaltedError`, so the log names the wrong cause forever —
  which `05-CONTEXT.md` calls out by name as "the diagnostic half of D-03 failing".
- The user sees only `Status Active — No`, which is precisely the presentation D-10 rejects for this
  cause: "too easy to miss for a failure only the user can resolve".
- The poll loop keeps running forever against a locally-halted auth client. It sends no network
  traffic (`src/cloud/auth.ts:452-453` throws `AuthHaltedError` before the request), so the vendor's
  thirty-day block is not extended — but the runtime never stops either.

Every credential-rejection test in `test/runtime/accountRuntime.test.ts` (lines 594, 994, 1164,
1181, 1459) rejects the **first** `devices` call, so the whole class is untested.

**Fix:**
Route the two terminal auth errors out of the poll loop through the same branch:

```ts
// src/runtime/accountRuntime.ts
// The one failure this project treats as final does not only happen at launch: a
// password changed at the vendor, or a block applied mid-run, arrives here. Without
// this the run keeps polling a halted auth client and reports a generic discovery
// failure, so the owner is never told the one thing only they can fix (D-13, D-10).
function isTerminalAuthFailure(error: unknown): boolean {
  return error instanceof AuthRejectedError || error instanceof AuthHaltedError;
}

// ... in runPoll's catch, before recordPollFailure:
if (isTerminalAuthFailure(error)) {
  halted = true;
  options.failures.recordFailure(AUTHENTICATION, AUTHENTICATION_STOPPED);
  options.onMonitoringHealth(monitoringTrustNow());

  return;
}
```

`runPolls()` should also stop looping once `halted` is set, so the runtime does not keep waking to
do nothing. Add a runtime case that succeeds on the first `devices` call and rejects the second with
`AuthRejectedError`, asserting the pushed `credentialsRejected: true` and the `AUTHENTICATION`
line — and a platform case that the restored accessories go unreadable from it.

## Warnings

### WR-01: `Pump Controller Link Lost` keeps reading trustworthy while the plugin is totally blind

**File:** `src/accessories/basementGuardian.ts:323-345`

**Issue:**
`distrustReasonsOf()` layers `invalid`, then `controller-link-lost`, then `unreachable`, and each
layer only fills scopes the earlier one left empty. The `pump-controller-link-lost` row is the one
row with `toleratedDistrust: ['controller-link-lost']` (`src/accessories/serviceCatalogue.ts:747`).
So once the last decoded snapshot said the link was lost, that reason wins the `fault` scope
permanently and the monitoring layer can never reach it. Under a total blackout the row keeps
publishing an activated sensor and `StatusActive = true`:

```text
link lost, transports fine       { contact: 1, statusActive: true }
link lost, BOTH transports down  { contact: 1, statusActive: true }
   untrusted = water:controller-link-lost,...,connectivity:unreachable
```

D-02 is unambiguous that both transports down "withdraws everything" and that "nothing may read as
trustworthy". This row does. It also mislabels the cause for six scopes: they read
`controller-link-lost` when the plugin is in fact `unreachable`.

**Fix:** Apply the monitoring layer before the controller-link layer, so `unreachable` (which no row
tolerates) beats `controller-link-lost` (which one row does), while `invalid` still wins over both:

```ts
const reasons = reasonsOf(violated, 'invalid');

for (const scope of monitoringDegraded) {
  if (!reasons.has(scope)) {
    reasons.set(scope, 'unreachable');
  }
}

if (controllerLinkLost) {
  for (const scope of NON_CONNECTIVITY_SCOPES) {
    if (!reasons.has(scope)) {
      reasons.set(scope, 'controller-link-lost');
    }
  }
}
```

Add a case asserting `Pump Controller Link Lost` reports `Status Active` as `false` under
`EVERY_TRANSPORT_LOST` when the last snapshot had `serial_communications: false`.

---

### WR-02: A press on a restored control Switch before the first poll is silently accepted and does nothing

**File:** `src/accessories/basementGuardian.ts:619-627, 642-668`; `src/platform.ts:571-576`

**Issue:**
`bindControlRow()` is called only from `publishRows()`, which runs only inside `update()`. After a
restart, `configureAccessory()` marks the restored services stale but binds no handler, and no
`update()` arrives until the first successful REST inventory — unbounded while the cloud is
unreachable, which is the exact window `RES-04` names.

The restored `System Self-Test` and `Alarm Mute` Switches come back from the Homebridge cache
carrying `On`. With no `onSet` handler, HAP stores the written value and answers success. So a press
in that window reads as accepted, no command leaves the plugin, and the toggle snaps back on the
first update. This is the opposite of D-07 and success criterion 3, which require the press to be
*refused* with a named cause. Every other refusal in the phase names its cause; this one is silent.

**Fix:** Bind the control rows to whatever restored services already exist, before the first update.
`markRestoredServicesStale` already walks the restored services; either bind there through an
injected binder, or have the accessory bind published control services in its factory body rather
than only inside `publishRows()`. With `monitoring.commandTransportReady` defaulting to `false`
(line 482), the existing `hasNoCommandTransport` rule already produces the right refusal once a
handler exists.

---

### WR-03: README and CHANGELOG overstate what the degraded and rejected states do

**File:** `README.md:141-149`; `CHANGELOG.md:24-27`

**Issue:** Three claims do not match the shipped behaviour.

1. `README.md`: *"The delay is to the report and never to a safety state. The plugin holds no value
   back while it waits, and it turns nothing normal."* Per CR-01 and CR-02 the plugin does hold
   values back — once a scope is withdrawn, no new value for it reaches HomeKit at all, including
   values from the transport that is still working. The safety state (`Status Active`) *is* what the
   delay applies to, so "never to a safety state" is not accurate either.
2. `README.md`: *"Every service then answers `No Response` in Apple Home"* on credential rejection.
   `markServicesUnreadable` pushes the status onto `StatusActive` alone. The project's own test
   asserts the rest still answer normally:
   `leakDetected: { value: LEAK_DETECTED, threw: undefined }` (`test/platform.test.ts`,
   "makes every restored accessory unreadable..."). Apple Home's accessory-wide No Response follows
   from the failing characteristic in a bulk read, but a controller or automation reading
   `LeakDetected` directly still gets a stale value under a success status.
3. `CHANGELOG.md`: *"marks its services inactive when the vendor cloud stops sending live changes"*
   omits that those services also stop updating.

**Fix:** After CR-01 and CR-02 are fixed, claim 1 becomes true; until then it must not ship. Restate
claim 2 as what the code does — every service that reports whether the plugin vouches for it stops
answering that report, which Apple Home draws as No Response for the accessory. Run the rewrite
through the `simple-english` skill, as the surrounding prose already is.

---

### WR-04: A load-bearing comment in `basementGuardian.ts` now states the opposite of what the code does

**File:** `src/accessories/basementGuardian.ts:682-687`

**Issue:** `republishPublishedRows`'s header says: *"The connectivity row is the one this leaves
alone, because nothing about it stopped being knowable... it keeps publishing its current verdict
and stays active -- which is what `untrusted` has always reported for that scope."* That was true
when the only caller was the unresolved-family branch. `markMonitoring` is now a second caller, and
a REST degradation puts `connectivity` into `untrusted` with reason `unreachable`, so the row
withholds and goes inactive — which is what the phase's own scenario "Polling failure alone leaves
the live values trustworthy" asserts. On this codebase a comment is treated as load-bearing; a
future reader trusting this one would conclude a real behaviour is a bug.

**Fix:** Scope the sentence to the unresolved-family caller and state the `markMonitoring` case
separately.

---

### WR-05: The nine-member `DiscoveryContext` literal is written out three times in the composition root

**File:** `src/platform.ts:496-545`

**Issue:** `onTrustworthyInventory`, `onMonitoringHealth` and `onDeviceRemoved` each build a
byte-identical nine-property `DiscoveryContext`. A member added to `DiscoveryContext` compiles only
after all three are updated, but a member whose *value* is wrong in one of the three is silent —
and one of the three now drives the account-wide trust fan-out that every accessory reads. This
tripled literal was introduced in this phase (`onMonitoringHealth` is the third copy).

**Fix:** Build it once and close over it:

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

A function, not a const, because `runtime` is still in its temporal dead zone at this point.
`features/support/world.ts` already uses exactly this shape (`this.discoveryContext(...)`).

---

### WR-06: The "answers a read" step passes when the characteristic does not exist

**File:** `features/support/steps/homekit.ts:127-160`

**Issue:** `readThrows()` returns `false` for an absent characteristic, deliberately, so that
`assertNoReadAnswered` fails by name rather than passing on an absence. But `assertReadAnswered`
inverts the same predicate, so an absent characteristic reads as "answers a read" and the step
passes. In `features/degradedOperation.feature`'s "A transport outage leaves every service
readable", `Then the "Sump Pit Flood" service answers a read for "Leak Detected"` has no preceding
value assertion for that characteristic, so it would pass if the service never published
`Leak Detected` at all — which is exactly the state CR-01 produces on a first run.

**Fix:** Have `readThrows` distinguish absent from answering, and make `assertReadAnswered` require
the characteristic to be present *and* answer:

```ts
type ReadOutcome = 'answered' | 'refused' | 'absent';

function readOutcome(service: FakeHapService | undefined, displayName: string): ReadOutcome {
  const characteristic = service?.characteristics.find((candidate) => candidate.displayName === displayName);

  if (characteristic === undefined) {
    return 'absent';
  }

  try {
    characteristic.handleGetRequest();
  } catch {
    return 'refused';
  }

  return 'answered';
}
```

---

### WR-07: `stop()` pushes no final monitoring trust, so the accessory tier keeps answering a stopped runtime

**File:** `src/runtime/accountRuntime.ts:784-792`

**Issue:** `commandTransportReadyNow()` is documented as answering `!stopped && !halted && polling`,
and `src/runtime/monitoringHealth.ts:61-70` says `commandTransportReady` exists precisely because it
"depends on facts this module has no sight of: whether the runtime is stopped". But `stop()` sets
`stopped = true` and pushes nothing, so every accessory keeps `commandTransportReady: true` from the
last successful poll. A press arriving during shutdown is accepted by the local gate and travels to
`commands.send`, where the aborted root signal turns it into a `vendor-error` — a HomeKit failure
that names the vendor for a refusal that was entirely local, which is the blur
`04-CONTEXT.md` D-04's per-cause table exists to prevent. `test/runtime/accountRuntime.test.ts`'s
"reports nothing for a poll a shutdown aborted" pins the current behaviour rather than questioning
it.

**Fix:** Push once from `stop()`, after `stopped = true` and before the abort, so the tier answers
the same fact the runtime acts on.

---

### WR-08: The trust report lands after the accessories have already updated, so a scope recovering this tick is republished only over services that already exist

**File:** `src/runtime/accountRuntime.ts:617-621`

**Issue:** `runPoll()` awaits `applyDevices()` — which fans out to `registerDiscoveredDevices` and
every `update()` — *before* `recordPollSuccess()` reports the new trust. So every `update()` in a
poll runs against the previous tick's `MonitoringTrust`. `markMonitoring` then repairs it, but
through `republishPublishedRows`, which walks `publishedService()` and adds nothing. A row whose
service was never created because its scope was untrusted at creation time therefore stays absent
for one extra poll after recovery. With `pollIntervalSeconds` at its 3600 maximum that is an hour
during which `Basement Guardian Offline` does not exist in HomeKit after a REST recovery.

**Fix:** Record and report the poll outcome before applying the inventory, or have `markMonitoring`
use the publishing pass rather than the republish pass when a degradation clears.

## Info

### IN-01: `markRestoredServicesStale` and `markServicesUnreadable` are the same walk twice

**File:** `src/accessories/staleMarking.ts:70-116`

**Issue:** The two functions are identical apart from the push verb and one extra parameter. The
duplication is small but it is the kind that drifts: a guard tightened in one and not the other
would silently change which services a credential rejection reaches.

**Fix:** Extract the guarded walk and pass the push as a callback, keeping both named exports so the
two call sites still read as two distinct acts.

---

### IN-02: The unconditional `monitoring = trust` store is a no-op under the comparison above it

**File:** `src/accessories/basementGuardian.ts:807-819`

**Issue:** The comment argues the store must sit outside the early return because "the write path
reads the stored value directly... and a store skipped by an unchanged-looking report would leave it
answering a fact the runtime has already superseded". Since `unchanged` compares all four members of
`MonitoringTrust`, the assignment cannot change anything when `unchanged` is true. The placement is
right as future-proofing against a fifth member, but the stated reason does not hold today and a
reader checking it will conclude one of the two is wrong.

**Fix:** Restate the reason as what it is — the store is unconditional so a member added to
`MonitoringTrust` and forgotten in the comparison still reaches the write path.

---

### IN-03: Shadow silence is measured against a wall clock that can jump

**File:** `src/runtime/monitoringHealth.ts:123-125`

**Issue:** `isShadowSilent` compares `now - lastMessageAt` against a fixed window using
`systemClock`. On a host with no RTC — a Raspberry Pi, the common Homebridge deployment — the first
NTP sync after boot can jump the clock forward by hours, which reports a healthy shadow as silent
until the next message arrives, or backwards, which suppresses a real silence for the size of the
jump. Neither is a false normal that persists, and both self-clear.

**Fix:** No change required for this release. Worth a note in the intel document so a later
monotonic-clock decision has the reason recorded.

---

_Reviewed: 2026-09-02T03:50:43Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
