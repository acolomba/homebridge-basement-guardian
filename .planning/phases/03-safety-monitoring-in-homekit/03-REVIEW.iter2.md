---
phase: 03-safety-monitoring-in-homekit
reviewed: 2026-08-30T22:40:00Z
depth: standard
iteration: 2
files_reviewed: 20
files_reviewed_list:
  - src/accessories/basementGuardian.ts
  - src/accessories/serviceCatalogue.ts
  - src/accessories/services.ts
  - src/config.ts
  - src/device/family.ts
  - src/device/gemini.ts
  - src/platform.ts
  - test/accessories/basementGuardian.test.ts
  - test/accessories/customCharacteristics.test.ts
  - test/accessories/serviceCatalogue.test.ts
  - test/accessories/services.test.ts
  - test/config.test.ts
  - test/platform.test.ts
  - features/support/fakeHap.ts
  - features/support/steps/hap.ts
  - features/support/steps/homekit.ts
  - features/harness.feature
  - features/safetyMonitoring.feature
  - README.md
  - CHANGELOG.md
findings:
  critical: 2
  warning: 6
  info: 0
  total: 8
status: issues_found
---

# Phase 03: Code Review Report (iteration 2)

**Reviewed:** 2026-08-30T22:40:00Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Gate is green and does not hide anything: `tsc --noEmit`, `eslint . --max-warnings=0`, `prettier --check`,
983 unit tests, and 62 Cucumber scenarios (547 steps) all pass. No finding below duplicates a compiler or
linter report.

### Both iteration-1 blockers are closed. I exercised the shipped code rather than reading the diff.

**CR-01 — closed, including the never-resolved path.** Driving `createBasementGuardianAccessory` against
`features/support/fakeHap.ts` with a registry that never answers `implemented`: zero `addService` calls,
zero rows found by `publishedService`, and the accessory carries exactly one service — the
`AccessoryInformation` its own construction supplied. Two consecutive unresolved updates add nothing. The
fix does not over-publish. In the publish-then-degrade direction, all fifteen rows flip
`StatusActive true -> false` while `Leak Detected = 1`, `Water Level = 100`, `Mains Power Present = true`,
`Pump Fault = true`, and `Status Low Battery = 1` are all retained at the values the last trustworthy
snapshot produced. `publishedService()` is lookup-only and correctly tells the two backup-battery rows apart
by service class.

**CR-02 — closed, including the second-update path.** Against the real `geminiFamily`, a first-ever poll
carrying `water_level: 99` publishes no `Sump Pit Flood` and no `Sump Pit Level` service at all (not one
reading "no leak"), while the other thirteen publish normally. The reverse order works too: a good poll
publishes `Leak Detected = 1`, and a following poll with `water_level: 99` keeps the service, keeps
`Leak Detected = 1`, and pushes `Status Active = false` — the row loses neither its service nor its retained
value. A lost controller link on the first-ever poll publishes exactly two services,
`Pump Controller Link Lost` (active, `Controller Link Present = false`) and `Basement Guardian Offline`.

**The three comments now match behaviour.** `basementGuardian.ts:296-299`, `fakeHap.ts:186-194`, and
`steps/hap.ts:103-107` each describe what I observed. One residual inaccuracy in the third is WR-03 below.

**WR-03's correction is right, and I verified it independently against the pinned typings.**
`node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/Characteristic.js:1934-1945` returns
`this.props.validValues[0]` for every numeric format before falling back to `minValue` and then `0`. Real
`BatteryHealthCode` therefore starts at `1`, which is legal; the observed `0` was the stand-in's own
`minValue ?? 0`. The stand-in was the right thing to fix, and no sentinel entered a published domain. The
exposure is now unreachable for a second reason as well: `BackupBatteryService` declares all four codes
required, and `batteryFactsValues` projects all four or none, so the service is never added before they have
values.

**WR-11's shape change is harmless, though not for the stated reason.** `ServiceDescriptor` is *not*
persisted. `AccessoryContext` (`src/persistence/accessoryContext.ts:47-59`) carries `deviceId`,
`deviceTypeId`, `serialNumber`, the two pump observations, the watermarks, and `lastVendorName` — no service
list. `accessory.services` is read only by `updateDiscoveredDevice`'s `isDeepStrictEqual` change detector,
where both sides come from the same live object inside one call. A pre-upgrade cached accessory cannot be
misread, orphaned, or duplicated by the new field, and there is no "one extra `updatePlatformAccessories`
call": a fresh `BasementGuardianAccessory` reports `[]` before its first `update()` on every restart
already, so the first poll after any restart earns the call regardless.

**The five rewritten tests strengthened rather than weakened.** The removed
`serviceCatalogue.test.ts` case that asserted CR-02's defect is replaced by three that pin the three
distinct outcomes (`[]` -> no service, `[]` then a value -> service added once, existing service answered
for an empty projection). Both `basementGuardian.test.ts` cases now publish through a good poll first and
degrade second, and the retention case reads real retained values rather than only `StatusActive`.
`assertOptionalCharacteristicsAppend` moved to `Battery`, which genuinely declares neither status
characteristic, and it now filters by UUID so the service's own declarations cannot be mistaken for the two
appended. `powerFamily` and `POWER_FAMILY` decode every scope. `homekit.ts`'s `pushed` flag closes WR-05:
a quiet sensor the plugin never wrote to now reads absent.

### What is still open

Two blockers. One is a false-normal path the fix pass did not introduce and did not close — three services
publish `fault`-scope data while marking themselves `Status Active = true` after that scope stops
validating. The other is a regression the WR-02 fix introduced: swallowing a throw during first
registration now leaves a device permanently blank in HomeKit instead of failing loudly. Both are
demonstrated with captured output, not argued. Six warnings follow, including one place where a rewritten
test encodes a doc/behaviour contradiction as correct.

Scope note: `test/platform.test.ts` and `test/accessories/basementGuardian.test.ts` are 1200 and 1484 lines;
I read the changed regions line by line and the rest by targeted inspection.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Three services keep publishing `fault`-scope values as trustworthy after the `fault` scope stops validating

**File:** `src/accessories/serviceCatalogue.ts:278-288`, `:290-321`, `:434-437`;
`src/accessories/basementGuardian.ts:367`

**Issue:** `isRowTrusted()` judges a row by `row.scope` alone, and `publishRows()` pushes
`StatusActive = isRowTrusted(row, input.untrustedScopes)`. But three rows read a *second* scope group:
`sumpPitLevelValues()` reads `fault.waterSensorFault`, and `primaryPumpValues()` / `backupPumpValues()` read
`fault.primaryPumpFault`, `fault.backupPumpFault`, and `fault.backupPumpFuseBlown`. When the `fault` scope
becomes untrusted, `trustedGroup(input, trust, 'fault')` correctly withholds those values — so the service
keeps the values from the last valid poll — but `StatusActive` still reads `true`, because the row's own
scope (`water` / `pump`) is fine.

The result is stale fault telemetry published as current. Demonstrated against the real `geminiFamily` and
the repository's own HAP stand-in: one quiet poll, then a poll whose `backup_pump_fault` arrives with the
wrong type (one field, one scope — exactly the D-014 narrowing this design exists for):

```text
poll 1: everything valid, no faults reported
poll 2: backup_pump_fault has the wrong type -> untrusted = [{"scope":"fault","reason":"invalid", ...}]

  Sump Pit Level  | Water Sensor Fault Reported=false  Status Fault=0  Status Active=true   <-- stale
  Primary Pump    | Pump Fault=false                   Status Fault=0  Status Active=true   <-- stale
  Backup Pump     | Pump Fault=false  Pump Fuse Blown=false  Status Fault=0  Status Active=true  <-- stale
  Backup Pump Fault  | Contact Sensor State=0  Status Fault=0  Status Active=false   <-- correct
  Water Sensor Fault | Contact Sensor State=0  Status Fault=0  Status Active=false   <-- correct
```

The same fact is published twice with contradictory trust markings. The narrow adapters go inactive as
D-05 requires; the three services carrying the same fact stay active and reassuring. `Status Fault` on
`Primary Pump` and `Backup Pump` is the reading an owner acts on, and it says `NO_FAULT` for a scope the
plugin has told itself it cannot vouch for. This is the core-value failure stated for this project:
stale telemetry reported as a normal state rather than marked stale.

The trigger is one malformed or missing field among `primary_pump_fault`, `backup_pump_fault`,
`backup_pump_fuse_blown`, `water_sensor_fault`, or `serial_communications`
(`src/device/gemini.ts:170-181`) — the same class of vendor drift the whole scoped-validation design was
built for. It is reachable on the first poll too: with `serial_communications` absent, `Primary Pump` and
`Backup Pump` publish with `Status Active = true` and no fault characteristic at all.

This predates the fix pass — `isRowTrusted` and the cross-scope reads are unchanged by this diff — but it
lives in two of the submitted files and iteration 1 did not catch it.

**Fix:** Judge `StatusActive` by every scope the row actually read, not by `row.scope` alone. Have the row
declare its read scopes and gate on all of them:

```ts
export interface ServiceRow extends RowTrust {
  // ...
  /** Every scope this row reads, so `StatusActive` answers for all of them, not only the owning one. */
  readScopes: readonly TrustScope[];
}

// in publishRows():
const trustworthy = row.readScopes.every((scope) => isRowTrusted({ scope, toleratedDistrust: row.toleratedDistrust }, input.untrustedScopes));

publishValue(service, hap.Characteristic.StatusActive, trustworthy);
```

`sump-pit-level` declares `['water', 'fault']`, `primary-pump` and `backup-pump` declare `['pump', 'fault']`,
and every other row declares `[row.scope]`. Add a case that publishes a quiet system, invalidates one
`fault` field, and asserts `Status Active` is `false` on all three services while their retained
`Status Fault` is unchanged.

---

### CR-02: A throw during first registration leaves the device permanently blank in HomeKit

**File:** `src/platform.ts:107-148`, `:211-249`, `:268-281`

**Issue:** The WR-02 fix wraps `dispatchDiscoveredDevice()` in a `try`. But that function caches the
`BasementGuardianAccessory` (`basementGuardianAccessoryFor` -> `context.basementGuardianAccessories.set`,
`platform.ts:129`) and subscribes it to the store *before* `basementGuardianAccessory.update(snapshot,
'poll')` runs, and only registers the `PlatformAccessory` after. If that first `update()` throws, the catch
swallows it and leaves the cache holding a `BasementGuardianAccessory` bound to a `PlatformAccessory`
Homebridge was never handed.

Every later inventory then takes the new-device path again (`context.accessories` is still empty), builds a
*fresh* `PlatformAccessory`, gets the *cached* accessory back — still closed over the first, orphaned one —
publishes all fifteen services onto the orphan, and registers the new, empty one.

Demonstrated by driving the exported `registerDiscoveredDevices` with a family that throws on its first
`decode()` and succeeds thereafter:

```text
--- inventory 1 (decode throws)
  registerCalls = 0   cached bg accessories = 1   accessories map = 0
  messages = ['error Skipping account-1_serial-1 on this inventory; every other device still updates.']
--- inventory 2 (decode works)
  registerCalls = 1

services on the accessory Homebridge was actually handed:
  Sump Pit Flood ... Basement Guardian Offline   -> (no service)   [all fifteen]

total services on registered accessory = 1        (AccessoryInformation only)
bg.services (what the accessory thinks it published) = 15
```

HomeKit shows a Basement Guardian accessory with no flood sensor, no pump, no battery, and no offline
sensor, indefinitely, while the plugin's own state reports fifteen healthy published services and logs
nothing further. Before the fix the throw at least escaped loudly; now it is swallowed and the device
silently monitors nothing. `test/platform.test.ts:997-1023` covers only that the *other* device in the batch
still registers, so this path is green.

Reachable throws in that window: any family `decode()` guard (`gemini.ts:225`, `:236`, `:253`, `:263`), the
`AccessoryInformation` guard (`basementGuardian.ts:278`), and `addService` refusing a duplicate on a
cache-restored accessory.

**Fix:** Do not leave a cached accessory bound to a `PlatformAccessory` that was never registered. The
smallest correct change is to roll the cache back when the first registration fails:

```ts
const basementGuardianAccessory = basementGuardianAccessoryFor(context, uuid, accessory, deviceId, store);

try {
  basementGuardianAccessory.update(snapshot, 'poll');
} catch (error: unknown) {
  // The accessory below was never registered, so the cached instance is bound to an object
  // Homebridge will never see. Dropping it lets the next inventory build one over an
  // accessory it does register, rather than publishing into an orphan forever.
  context.basementGuardianAccessories.delete(uuid);
  store.remove(deviceId);

  throw error;
}

context.accessories.set(uuid, accessory);
context.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
```

Add a case that throws on the first `decode()` only, runs two inventories, and asserts the registered
accessory carries the full published set.

## Warnings

### WR-01: `deactivatePublishedRows()` deactivates the connectivity row, which the module says it never touches

**File:** `src/accessories/basementGuardian.ts:136-142`, `:381-389`, `:471-472`;
`test/accessories/basementGuardian.test.ts:459-479`

**Issue:** `NON_CONNECTIVITY_SCOPES`'s comment states that `connectivity` "is governed by the
separately-validated wire envelope rather than by family validation, so a profile failure never touches
it (D-014, DEV-08)", and `untrusted` honours that — after an unresolved family it lists the five
non-connectivity scopes only. But `deactivatePublishedRows()` walks the whole catalogue and pushes
`StatusActive = false` onto `Basement Guardian Offline` as well. Observed:

```text
untrusted = [water, pump, power, battery, fault]        (connectivity absent, as documented)
Basement Guardian Offline | Contact Sensor State=0  Status Active=false   (contradicts it)
```

The two public surfaces disagree about the same scope. The rewritten case at
`test/accessories/basementGuardian.test.ts:471-478` asserts `PUBLISHED_SERVICES.map(() => false)` — it
encodes the contradiction as the expectation, which is the pattern this review pass exists to catch.

**Fix:** Skip the connectivity row, so the deactivation set matches the scopes `untrusted` reports:

```ts
function deactivatePublishedRows(): void {
  for (const row of catalogue) {
    // `connectivity` is judged by the wire envelope, not by family validation, so an unresolved
    // profile says nothing about it and it keeps whatever the last poll established (D-014).
    if (!NON_CONNECTIVITY_SCOPES.has(row.scope)) {
      continue;
    }

    const service = publishedService(accessory, row);

    if (service !== undefined) {
      publishValue(service, hap.Characteristic.StatusActive, false);
    }
  }
}
```

Then change the test expectation to `PUBLISHED_SCOPES.map((scope) => scope === 'connectivity' ? true : false)`.

---

### WR-02: The offline confirmation run freezes while the family does not resolve

**File:** `src/accessories/basementGuardian.ts:463-476`, `:495-497`

**Issue:** The non-implemented branch returns before the `source === 'poll'` block, so `offlineCount` never
advances. A device whose `deviceTypeId` stopped resolving and then goes offline never activates
`Basement Guardian Offline`. Observed with one good poll followed by ten disconnected unresolved polls:
`Contact Sensor State = 0` throughout. Nothing observed about vendor reachability changed — the REST
inventory still succeeded or failed as before, and `snapshot.connectivity.connected` is still the
separately-validated fact RES-03 counts. Combined with WR-01, the one sensor that stays factually knowable
in this state is both frozen and marked inactive.

**Fix:** Advance the run in the unresolved branch too, and republish the connectivity row from it, or state
in the comment at `:463-470` that the confirmation run is deliberately suspended and why. The first is
closer to RES-03:

```ts
if (outcome.kind !== 'implemented') {
  if (source === 'poll') {
    offlineCount = nextOfflineCount(offlineCount, snapshot.connectivity.connected, offlineThreshold);
  }

  untrusted = untrustedScopesOf(reasonsOf(NON_CONNECTIVITY_SCOPES, 'invalid'), lastTrustedAt);
  deactivatePublishedRows();
  reportDegradation();

  return;
}
```

---

### WR-03: The stand-in's string default still diverges from the pinned HAP, in a comment that now claims exactness

**File:** `features/support/fakeHap.ts:186-205`

**Issue:** The rewritten comment states "The real HAP answers `false` for a bool, the empty string for a
string, and for a numeric format the first declared valid value, then the declared minimum, then zero." The
numeric half is now exactly right. The string half is not:
`@homebridge/hap-nodejs@2.2.2/dist/lib/Characteristic.js:1911-1923` special-cases four identifiers —
`Manufacturer` -> `'Default-Manufacturer'`, `Model` -> `'Default-Model'`, `SerialNumber` ->
`'Default-SerialNumber'`, `FirmwareRevision` -> `'0.0.0'` — and the stand-in answers `''` for all four. Real
HAP also guards the numeric fallback with `Number.isFinite(this.props.minValue)`; the stand-in does not.

Nothing depends on this today (the `leaves AccessoryInformation untouched` cases compare against a value
read from the same stand-in), so the impact is fidelity rather than a false green. But the file's own
`@fileoverview` says it answers "the real format defaults", and the review standard in this codebase is that
a comment stating a property the code does not have is a defect.

**Fix:** Reproduce the four, or narrow the claim to what the stand-in gives:

```ts
if (this.props.format === FORMATS.STRING) {
  return ACCESSORY_INFORMATION_DEFAULTS.get(this.UUID) ?? '';
}
```

---

### WR-04: `the plugin publishes no {string} service` passes vacuously when nothing has been registered

**File:** `features/support/steps/homekit.ts:99-113`, `features/safetyMonitoring.feature:38-47`

**Issue:** Every other read in this module goes through `untilPublished`/`untilTrue` with a deadline,
because a published value appears only once a poll has applied the state a step just set.
`assertServiceNotPublished` asserts immediately. `serviceOf()` returns
`currentAccessory(homebridge)?.getServiceById(...)`, and `currentAccessory` is `undefined` until the plugin
registers its first accessory — so before any poll completes, the step passes for every service name,
including ones the plugin does publish.

The new scenario is safe only because the preceding `Then the plugin publishes the "Sump Mains Power"
service` waits first. That ordering dependency is undocumented, and the next scenario to put the negative
step first will pass against an implementation that publishes nothing at all. The suite already has a
warning about this exact failure mode (WR-05 in iteration 1).

**Fix:** Establish that a poll landed before accepting the absence:

```ts
async function assertServiceNotPublished(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  // An unregistered accessory answers `undefined` for every name, so the absence is only evidence
  // once the plugin has published something.
  await this.untilTrue(() => currentAccessory(homebridge) !== undefined, PUBLISH_DEADLINE_MS, 'the plugin never registered an accessory');

  assert.equal(serviceOf(homebridge, displayName), undefined);
}
```

---

### WR-05: README overstates what survives an `ignoredFaults` removal

**File:** `README.md:108`

**Issue:** "A removed sensor is the only thing you lose. The plugin still reads the condition, still reports
it on the status characteristics of the service that owns it, and still writes it to the log." Two of the
three clauses are false for the shipped code:

- **The log.** `src/accessories/` contains exactly two `log.warn` calls
  (`basementGuardian.ts:407` and `:430`): the degradation transition and the lost controller link. No
  removable condition other than the controller link is written to the log at all.
- **The status characteristics.** Removing `basement-guardian-offline` removes the *only* publication of
  the confirmed-offline state — no other row reads `input.offlineConfirmed`
  (`serviceCatalogue.ts:419-421`). Removing `mains-power-lost` leaves mains loss on
  `Sump Mains Power`'s custom `MainsPowerPresent`, not on a status characteristic:
  `mainsPowerValues()` publishes no `StatusFault` at all (`serviceCatalogue.ts:336-340`).

The paragraph sits directly above the sentence this fix pass rewrote, and it is the paragraph an
administrator reads to decide whether removing a sensor is safe. Removing `basement-guardian-offline` costs
the RES-03 signal outright, with nothing compensating.

**Fix:** State the rule per sensor rather than as a blanket promise:

```markdown
A removed sensor is the only thing you lose. The plugin still reads the condition and still uses it. Five
of the seven conditions also stay visible on the service that owns them: pump faults on `Primary Pump` and
`Backup Pump`, a water sensor fault on `Sump Pit Level`, mains power on `Sump Mains Power`, and a backup
pump run on `Backup Pump`. Two do not. `basement-guardian-offline` is the only place the plugin reports a
confirmed offline system, and `pump-controller-link-lost` is the only place it reports the link state,
though that one is also written to the log.
```

---

### WR-06: Nothing guards the invariant CR-02's fix silently depends on

**File:** `src/accessories/serviceCatalogue.ts:656-664`, `src/accessories/customServices.ts:119-133`

**Issue:** `ensureService()` gates on "the row projected at least one value". That is only sufficient
because every *required* characteristic of every row's service class happens to be sourced from the row's
own scope: `SumpPitService` requires `WaterLevel` + `RawWaterLevelCode` (both `water`), `PumpService`
requires `PumpRunning` (`pump`), `BackupBatteryService` requires all four codes (`battery`), and the
standard `LeakSensor` / `ContactSensor` / `Battery` require one characteristic each, also from the row's own
scope. Every cross-scope value is declared optional, so HAP never constructs it.

Break that alignment — make `StatusFault` required on `PumpService`, or add a required characteristic
sourced from `fault` — and the CR-02 false normal returns in full: the service is added because the row
projected its own-scope value, and the required cross-scope characteristic sits at HAP's format default
(`0` = `NO_FAULT`) having never been written. No test or scenario asserts the alignment, and neither module
comment names it as a precondition.

**Fix:** Pin it. A case over the catalogue asserting that every required characteristic of a row's service
class appears in the row's projection from a fully trustworthy input would fail the moment the invariant
breaks:

```ts
test('sources every required characteristic of a row from the scope that row owns', () => {
  // arrange
  const hap = hapNamespace();
  const input = projectionInput();

  // act
  const unwritten = createServiceCatalogue(hap).map((row) => {
    const projected = new Set(row.project(input).map((value) => value.characteristic.UUID));

    return new row.serviceClass().characteristics.filter((required) => !projected.has(required.UUID) && required.displayName !== 'Name').length;
  });

  // assert
  assert.deepStrictEqual(unwritten, createServiceCatalogue(hap).map(() => 0));
});
```

Record the precondition in `ensureService`'s doc comment as well: the length gate is sound only while no
required characteristic reads a scope other than the row's own.

---

_Reviewed: 2026-08-30T22:40:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Iteration: 2_
