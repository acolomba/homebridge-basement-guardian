---
phase: 03-safety-monitoring-in-homekit
reviewed: 2026-08-30T20:25:36Z
depth: standard
files_reviewed: 40
files_reviewed_list:
  - src/accessories/basementGuardian.ts
  - src/accessories/customCharacteristics.ts
  - src/accessories/customServices.ts
  - src/accessories/serviceCatalogue.ts
  - src/accessories/services.ts
  - src/config.ts
  - src/device/family.ts
  - src/device/gemini.ts
  - src/device/health.ts
  - src/device/waterLevel.ts
  - src/platform.ts
  - src/runtime/timers.ts
  - test/accessories/basementGuardian.test.ts
  - test/accessories/customCharacteristics.test.ts
  - test/accessories/customServices.test.ts
  - test/accessories/serviceCatalogue.test.ts
  - test/accessories/services.test.ts
  - test/accessories/timerFreedom.test.ts
  - test/config.test.ts
  - test/configSchema.test.ts
  - test/device/family.test.ts
  - test/device/gemini.test.ts
  - test/device/waterLevel.test.ts
  - test/platform.test.ts
  - test/runtime/accountRuntime.test.ts
  - test/runtime/timers.test.ts
  - features/support/fakeHap.ts
  - features/support/fakeHomebridgeApi.ts
  - features/support/steps/configuration.ts
  - features/support/steps/hap.ts
  - features/support/steps/harness.ts
  - features/support/steps/homekit.ts
  - features/support/steps/shadow.ts
  - features/support/world.ts
  - features/harness.feature
  - features/safetyMonitoring.feature
  - config.schema.json
  - .fallowrc.json
  - README.md
  - CHANGELOG.md
findings:
  critical: 2
  warning: 12
  info: 0
  total: 14
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-08-30T20:25:36Z
**Depth:** standard
**Files Reviewed:** 40
**Status:** issues_found

## Summary

The toolchain gate is green: `npx tsc --noEmit` and `npx eslint . --max-warnings=0` both pass, so no finding
below duplicates a compiler or linter report.

Most of the safety invariants this phase was asked to uphold do hold, and I confirmed each by reading the
shipped code rather than the plan:

- **SAFE-01** holds. `waterLevelPercentage()` is a `Map` lookup that throws on any code outside
  `{0,1,3,7,15,31}`, and `gemini.ts` refuses the field before the lookup is reached
  (`test/device/gemini.test.ts:283-306` proves the illegal-code path, which is the only path that
  distinguishes the ladder from a population count).
- **D-11 / RES-02** holds. `distrustReasonsOf()` poisons exactly the five non-connectivity scopes with
  `controller-link-lost`, leaves `connectivity` trusted, and does not overwrite an existing `invalid`
  reason.
- **D-12** holds. Every subtype is the `ServiceKind` slug verbatim, every custom UUID is a hard-coded v4
  literal outside `-0000-1000-8000-0026BB765291`, and no accessories module contains `uuid.generate`.
- **D-17 / CONF-06** holds. The refusal names the offending entry and enumerates all seven valid slugs, and
  `test/config.test.ts:288-317` proves each of the seven appears.
- **SAFE-07** holds. `update()` is synchronous end to end; the four immediacy layers (injected port, global
  spies, synchronous read, source-text import gate) each have a proven negative control.
- **HAP clamping (mechanism 1)** is handled. Every projected value is either a characteristic constant or a
  value read verbatim from decoded state; no arithmetic reaches a projection, so no out-of-range value can
  be clamped into an alarm.
- `ProjectionInput.controllerDataLastTrustedAt` now has a real reader (`controllerLinkValues`,
  `serviceCatalogue.ts:411`); it is no longer a stub.

The **format-default false normal (mechanism 2) is not handled**, and there is a second, worse false-normal
path nobody tested. Both are below as blockers, and both are demonstrated rather than argued: I ran the
shipped code against the repository's own HAP stand-in and captured the published characteristic values.
The remaining warnings are a contract-order inversion, a loop that a single throwing device can abort, and a
cluster of documentation and test-double claims that overstate the coverage that actually exists.

Scope note: `test/platform.test.ts`, `test/runtime/accountRuntime.test.ts`, and `test/device/gemini.test.ts`
are 1177, 1696, and 528 lines and were reviewed by targeted inspection of the sections this phase touched
rather than line by line.

## Critical Issues

### CR-01: A `deviceTypeId` that stops resolving leaves every published service reading `StatusActive = true`

**File:** `src/accessories/basementGuardian.ts:413-426`

**Issue:** When `registry.lookup()` stops answering `implemented`, `update()` sets `untrusted` to all five
non-connectivity scopes and returns before `publishRows()` runs. Nothing pushes `StatusActive = false` onto
the services already on the accessory. Apple Home therefore keeps showing the last values *and* keeps
reporting them as active and trustworthy, forever, while the accessory's own `untrusted` getter says it can
vouch for nothing.

This contradicts three statements the code makes about itself:

- `serviceCatalogue.ts:136-141` — "an untrustworthy row projects nothing, and the accessory publishes
  `StatusActive = false` for it (D-014, D-05)".
- `basementGuardian.ts:14-16` — "degrades the whole accessory in place".
- `README.md` — "If it cannot vouch for part of what a system reports, it keeps the last value it does trust
  and marks the affected services inactive."

Demonstrated against the repository's own `features/support/fakeHap.ts`: one good poll, then one poll whose
`deviceTypeId` no longer resolves.

```text
AFTER GOOD POLL
  Sump Pit Flood     | Leak Detected       = 1      Status Active = true
  Primary Pump Fault | Contact Sensor State = 1     Status Active = true
  Backup Battery     | Status Low Battery  = 1      Status Active = true
untrusted after unresolved family:
  [{"scope":"water","reason":"invalid",...},{"scope":"pump",...},{"scope":"power",...},
   {"scope":"battery",...},{"scope":"fault",...}]
AFTER FAMILY STOPS RESOLVING
  Sump Pit Flood     | Leak Detected       = 1      Status Active = true   <-- unchanged
  Primary Pump Fault | Contact Sensor State = 1     Status Active = true   <-- unchanged
  Backup Battery     | Status Low Battery  = 1      Status Active = true   <-- unchanged
```

The inverse case is equally bad: a system that was quiet when the adapter stopped resolving keeps publishing
"no leak, pump normal, battery fine, active" indefinitely, which is the false all-clear this plugin exists to
prevent.

The path is reachable. The accessory re-resolves the registry on every `update()` precisely so a changed
`deviceTypeId` is honoured (`basementGuardian.ts:12-18`, DEV-04), and a vendor firmware release that renames
a device type is exactly the scenario the re-resolution exists for.

No test covers it. `test/accessories/basementGuardian.test.ts:412-429` only exercises the *first-ever*
update with an unresolved family, where the correct answer is `services: []`; there is no case that publishes
first and degrades second. `grep` for `StatusActive` across `test/` and `features/` confirms no assertion
reaches this path.

**Fix:** In the non-implemented branch, deactivate the rows the accessory has already published, without
adding any service (an accessory that has *never* resolved a family must still publish nothing at all):

```ts
// Deactivates every row already on the accessory. `getServiceById` only: a row that was never
// published stays unpublished, so a device that has never resolved a family still shows no service.
function deactivatePublishedRows(): void {
  for (const row of catalogue) {
    const service = accessory.getServiceById(row.serviceClass, row.subtype);

    if (service !== undefined) {
      publishValue(service, hap.Characteristic.StatusActive, false);
    }
  }
}

// ... inside update():
if (outcome.kind !== 'implemented') {
  untrusted = untrustedScopesOf(reasonsOf(NON_CONNECTIVITY_SCOPES, 'invalid'), lastTrustedAt);
  deactivatePublishedRows();
  reportDegradation();

  return;
}
```

Add a case that publishes a flood through a resolving family, then degrades, and asserts every
`StatusActive` is `false` while the last values are retained.

---

### CR-02: A service is created at HAP's good-news format defaults on the first update in which its scope is untrusted

**File:** `src/accessories/serviceCatalogue.ts:631-633`, `src/accessories/basementGuardian.ts:321-342`

**Issue:** `publishRows()` calls `ensureService()` for every non-suppressed row unconditionally, *then* asks
the row what to publish. A row whose scope is untrusted projects nothing, so the freshly added service is
left at HAP's construction defaults — which, for this plugin's alarm convention, are the good-news values.
`StatusActive = false` is the only marker, and the README itself records that Apple Home does not show
`StatusActive` on the tile.

Demonstrated with a family whose first-ever snapshot fails validation on every scope:

```text
Sump Pit Flood        -> Leak Detected=0            Status Active=false   ("no leak")
Sump Pit Level        -> Water Level=0, Raw Water Level Code=0            ("empty pit")
Primary Pump          -> Pump Running=false
Sump Mains Power      -> Mains Power Present=false
Backup Battery        -> Status Low Battery=0                             ("battery normal")
Backup Battery Facts  -> Battery Health Code=0, Protection Hours Code=0
Primary Pump Fault    -> Contact Sensor State=0                           (quiet)
Backup Pump Fault     -> Contact Sensor State=0                           (quiet)
Water Sensor Fault    -> Contact Sensor State=0                           (quiet)
Pump Controller Link Lost -> Contact Sensor State=0                       (quiet)
```

Every one of those is a reassuring value the device never reported. This is exactly the second false-normal
mechanism the phase was supposed to close, and the code's own commentary asserts it is closed:

- `basementGuardian.ts:286-288` — "an accessory that has never heard from its device shows no service at all
  rather than a board of format defaults". True only before the first `update()`; the first update publishes
  the board.
- `features/support/fakeHap.ts:176-179` — "reproducing them exactly is what lets a scenario prove the
  accessory never leaves a service sitting there (D-014)". No such scenario exists (see WR-07).
- `features/support/steps/hap.ts:101-105` — "`StatusActive` defaults to false, the one default that is
  honest, which is why the accessory leaves it there until a valid decode arrives". The accessory does not
  wait for a valid decode; it creates the service regardless.

`test/accessories/serviceCatalogue.test.ts:1089-1106` ("leaves a freshly added service at its construction
defaults, with no value pushed") records the behaviour as intended, and
`test/accessories/basementGuardian.test.ts:635-648` asserts only the `StatusActive` half of the outcome — no
case asserts what the *other* characteristics on those newly created services read.

This is not merely a startup transient. A device whose water field is out of domain from the moment the
plugin is installed shows "Leak Not Detected" on a real Apple Home tile until that field validates once,
which may be never.

**Fix:** Do not create a service until the row has something real to publish. Keep publishing (and
deactivating) any service that already exists:

```ts
for (const row of catalogue) {
  if (isSuppressed(row.kind)) {
    removeServiceIfPresent(accessory, row);

    continue;
  }

  const projected = row.project(input);
  // A row with nothing to vouch for never earns a new service: HAP's construction defaults are this
  // plugin's good-news values, so an added-but-unpublished service reads as a healthy sump pit (D-014).
  const service = accessory.getServiceById(row.serviceClass, row.subtype)
    ?? (projected.length === 0 ? undefined : accessory.addService(row.serviceClass, row.displayName, row.subtype));

  if (service === undefined) {
    continue;
  }

  for (const value of projected) {
    publishValue(service, value.characteristic, value.value);
  }

  publishValue(service, hap.Characteristic.StatusActive, isRowTrusted(row, input.untrustedScopes));
  descriptors.push({ kind: row.kind, subtype: row.subtype, name: row.displayName });
}
```

Then add the scenario `features/support/fakeHap.ts:176-179` already claims: seed a device whose water fields
never validate, start the plugin, and assert the plugin publishes no `Sump Pit Flood` service — rather than
one reading "no leak".

## Warnings

### WR-01: `decode()` is called before `validate()`, inverting the documented family contract

**File:** `src/accessories/basementGuardian.ts:428-430`

**Issue:** `src/device/family.ts:37-43` states "A snapshot that does not validate is never decoded", and every
`decode()` guard in `gemini.ts` says `validate() must reject this snapshot first`. The accessory decodes
first and validates second. Gemini survives only because its `decode()` re-runs the whole check table
internally (`gemini.ts:345-358`); a future family written to the published contract — trusting the caller and
reading fields directly — throws a `TypeError` out of `update()` on the first malformed payload.

**Fix:** Validate first and pass the verdict down, or amend `DeviceFamily.decode`'s documentation to state
that decode is called on unvalidated snapshots and must therefore be self-guarding.

```ts
const validation = outcome.family.validate(snapshot);
const decoded = outcome.family.decode(snapshot);
const linkLost = isControllerLinkLost(decoded);
const reasons = distrustReasonsOf(violatedScopesOf(validation), linkLost);
```

---

### WR-02: One throwing device aborts the whole inventory loop

**File:** `src/platform.ts:224-263`

**Issue:** The doc comment promises "one device's outcome never stops the loop from dispatching the rest",
but the `for` body has no `try`. Three reachable throws sit inside it: `deviceIdOf()`
(`basementGuardian.ts:148`), `populateAccessoryInformation()` (`basementGuardian.ts:269`), and any family
`decode()` guard (WR-01). A single bad device therefore silently stops every later device in the same
inventory response from being registered or updated — for a fleet, that means other basements stop being
monitored with no log line naming why.

**Fix:** Wrap the per-device body and log the failure, so the promise the comment makes is the behaviour the
code has:

```ts
for (const deviceId of deviceIds) {
  try {
    dispatchDiscoveredDevice(context, deviceId, store);
  } catch (error: unknown) {
    context.log.error(`Skipping ${deviceId} on this inventory: ${String(error)}`);
  }
}
```

---

### WR-03: `BatteryHealthCode` and `ProtectionHoursCode` start at a value their own `validValues` forbids

**File:** `src/accessories/customCharacteristics.ts:129-138`, `157-170`

**Issue:** `define()` assigns `this.value = this.getDefaultValue()`, which for a `uint8` with no `minValue`
is `0`. Both codes declare `validValues` that exclude `0` (`[1,2,4,8,16,32]` and `[1,2,4,8]`). Both are
*required* characteristics of `BackupBatteryService`, so they are constructed the moment the service is
added and stay at `0` until the battery scope is first trustworthy — HomeKit is handed a code the plugin
itself declares impossible. `RawWaterLevelCode` avoids this only by including `0` in its domain.
`test/accessories/customCharacteristics.test.ts` asserts the initial value for the boolean and string cases
(lines 185-205) but for neither `uint8` code.

**Fix:** Either add a documented "not yet reported" sentinel to each domain, or (preferred, and consistent
with CR-02) do not construct the service until the battery scope has decoded once. Add a case asserting the
initial value of every `uint8` characteristic is inside its own declared `validValues`.

---

### WR-04: Comments and test annotations reference GSD planning artifacts

**File:** `src/device/gemini.ts:363`, `test/accessories/basementGuardian.test.ts:85`, `:275`

**Issue:** `./.claude/rules/typescript-comments.md` is a hard rule: comments and test titles must not record
which plan, phase, wave, or task produced a line. Three violations:

- `gemini.ts:363` — "no state-dependent gating exists at this phase"
- `basementGuardian.test.ts:85` — "Every module this plan writes under `src/accessories/`"
- `basementGuardian.test.ts:275` — "the one per-field failure this plan's rows read"

**Fix:** Drop the planning reference and keep the rationale.

```ts
// gemini.ts
// Gemini always reports both capability-backing fields, so no state-dependent
// gating exists yet; the decoded state the interface passes here goes unread.

// basementGuardian.test.ts:85
// Every module under `src/accessories/`, read as source so a prohibited idiom
// fails here by name rather than through some downstream symptom.
```

---

### WR-05: The `is not activated` steps pass on a value that was never published

**File:** `features/support/steps/homekit.ts:121-125`

**Issue:** `assertSensorNotActivated` polls until the alarm characteristic reads `0`. Because `0` is also the
HAP construction default for both `ContactSensorState` and `LeakDetected` (CR-02), the step is satisfied by a
service the plugin created and never wrote to. Every `Then the "X" sensor is not activated` line in
`safetyMonitoring.feature` — nine of them — would pass against an implementation that publishes nothing at
all for that row. A wrong implementation passes these cases, which the unit-testing rules classify as the
highest-value defect a review can find.

**Fix:** Assert on evidence that a value was pushed, not on the value alone — for instance require
`Status Active` to be `true` on the same service before accepting a quiet alarm, or have the step read the
characteristic through a recorder that distinguishes "written" from "constructed".

---

### WR-06: The HAP stand-in's standard services declare no optional characteristics, so `publishValue`'s guard takes a branch real HAP would not

**File:** `features/support/fakeHap.ts:327-352`, `test/accessories/serviceCatalogue.test.ts:1200-1217`

**Issue:** `defineService()` adds required characteristics only. Real `LeakSensor`, `ContactSensor`, and
`Battery` all declare `StatusActive`, `StatusFault`, and `Name` in `optionalCharacteristics`. So in every
test and scenario, `publishValue()` pushing `StatusActive` onto a standard service takes the
`addOptionalCharacteristic` branch, while in production it takes the already-declared branch. The guard's
whole purpose — never double-declaring on a service that already declares the characteristic — is exercised
only through the plugin's own custom services. `serviceCatalogue.test.ts:1213` even encodes the divergence as
the expectation (`declared: 0` for a `ContactSensor`).

**Fix:** Give `defineService()` an `optional` list and populate it for the three standard services the
plugin uses, matching HAP's own definitions. Then the `declared: 0` expectation becomes `declared: 1` and
the guard is proven on the service type it actually runs against.

---

### WR-07: Two comments claim scenario coverage that does not exist

**File:** `features/support/fakeHap.ts:176-179`, `features/support/steps/hap.ts:101-105`

**Issue:** Both say the reproduced format defaults are what "lets a scenario prove the accessory never
leaves a service sitting there". `features/safetyMonitoring.feature` and `features/harness.feature` contain
no such scenario; `harness.feature:73-76` proves only that the *stand-in* carries those defaults. CR-02
shows the missing scenario would fail. A comment asserting a guarantee that no case checks is worse than
silence — it tells the next reader the hazard is closed.

**Fix:** Either add the scenario (see CR-02's fix) or reword both comments to state what the stand-in
actually gives: faithful defaults, so a future scenario *can* prove it.

---

### WR-08: README and CHANGELOG claim only two services cannot be removed

**File:** `README.md` ("Removing a notification sensor" section), `CHANGELOG.md` (Unreleased → Added)

**Issue:** "Two services cannot be removed. `Sump Pit Flood` is the flood sensor, and `Backup Battery` is
the standard battery service." Eight published services across seven kinds cannot be removed:
`sump-pit-flood`, `sump-pit-level`, `primary-pump`, `primary-pump-running`, `backup-pump`,
`sump-mains-power`, and both `backup-battery` services (`src/accessories/services.ts:25-34`). The CHANGELOG
repeats the claim. An administrator reading this expects `ignoredFaults: ["primary-pump-running"]` to work;
it refuses the configuration and stops the plugin.

**Fix:** State the rule rather than an enumeration that drifts: only the seven names listed above are
accepted; every other published service reports what the system reports and cannot be removed.

---

### WR-09: A non-aliasing test uses a standalone negative assertion

**File:** `test/accessories/customCharacteristics.test.ts:207-216`

**Issue:** `assert.notStrictEqual(perms.mainsPower, perms.pumpRunning)` passes for any two distinct objects,
including two arrays holding the wrong permissions. The project's testing rules name standalone negative
assertions as a finding: the case must assert what the value *is*. The property under test — that one
characteristic cannot mutate another's permission array — is also not proven, because distinct references
are necessary but not sufficient evidence.

**Fix:** Mutate one and assert the other is intact.

```ts
// act
const mainsPower = new MainsPowerPresent().props.perms;
const pumpRunning = new PumpRunning().props.perms;
mainsPower.push(hapNamespace().Perms.PAIRED_WRITE);

// assert
assert.deepStrictEqual(pumpRunning, ['pr', 'ev']);
```

---

### WR-10: `offlineConfirmationPollCount: 0` is accepted by the accessory factory and permanently activates the offline sensor

**File:** `src/accessories/basementGuardian.ts:295`, `:451`

**Issue:** `options.offlineConfirmationPollCount ?? DEFAULT_...` uses `??`, so an explicit `0` is kept.
`offlineConfirmed: offlineCount >= offlineThreshold` is then `0 >= 0`, permanently `true`: the
`Basement Guardian Offline` sensor reads activated on every update, including the very first, and including
while the vendor is answering normally — a permanent false alarm that teaches the owner to ignore the one
sensor RES-03 exists for. `src/config.ts` bounds the field at `minimum: 1`, so the platform never passes `0`;
but the factory is an exported public API and the harness (`features/support/world.ts:553`) wires it
independently of `validateConfig`.

**Fix:** Refuse a non-positive threshold at construction, so the factory's contract does not depend on its
one current caller having validated first:

```ts
const offlineThreshold = options.offlineConfirmationPollCount ?? DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT;

if (!Number.isInteger(offlineThreshold) || offlineThreshold < 1) {
  throw new Error(`offlineConfirmationPollCount must be a whole number of at least 1, not ${String(offlineThreshold)}`);
}
```

---

### WR-11: `ServiceDescriptor` no longer uniquely identifies a service

**File:** `src/accessories/serviceCatalogue.ts:522-541`, `src/accessories/basementGuardian.ts:338`

**Issue:** The two backup-battery rows share one `kind` *and* one `subtype`, differing only in service class,
so `accessory.services` contains two descriptors that are identical except for `name`
(`test/accessories/basementGuardian.test.ts:46-47` encodes this). `ServiceDescriptor.subtype` is documented
as "The stable HomeKit subtype. It never changes for a given service", which reads as a key. Any consumer
that dedupes or maps by `kind`/`subtype` — the natural reading of the type — silently drops one of the two
battery services. `updateDiscoveredDevice`'s `isDeepStrictEqual` comparison happens to be order-preserving
and so is unaffected today; the next consumer may not be.

**Fix:** Carry the discriminator the rows already have, so the descriptor is keyable:

```ts
export interface ServiceDescriptor {
  kind: ServiceKind;
  subtype: string;
  /** The HAP service type identifier, which is what tells two rows of one kind and subtype apart. */
  serviceUuid: string;
  name: string;
}
```

---

### WR-12: The `ignoredFaults` refusal quotes an offending string without delimiters

**File:** `src/config.ts:72-74`, `:119`, `:123`

**Issue:** `describeValue()` stringifies objects with `JSON.stringify` but returns a bare `String(value)` for
text, so the refusal reads `... but it names mains-power-lst.` with nothing marking where the value begins
and ends. D-17 makes this message the administrator's only route back from a typo that leaves a pump
unmonitored, and the two typo classes it is least able to help with are exactly the ones delimiters would
expose: a stray space (`" mains-power-lost"` renders as a double space nobody sees) and a trailing newline
from a copy-paste.

**Fix:** Delimit text, and leave every other branch exactly as it is. Do not reach for a bare
`JSON.stringify(value)` on the whole value: `integerRefusal` shares this helper, and `JSON.stringify(NaN)`
answers `'null'`, which would turn `pollInterval must be ... but it is NaN.` into a message naming a value
the administrator never wrote.

```ts
function describeValue(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
}
```

Update the affected expectations in `test/config.test.ts:269-317` and `:330-346`.

---

_Reviewed: 2026-08-30T20:25:36Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
