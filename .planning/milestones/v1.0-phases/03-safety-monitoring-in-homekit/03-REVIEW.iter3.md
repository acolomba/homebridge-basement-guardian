---
phase: 03-safety-monitoring-in-homekit
reviewed: 2026-08-30T00:00:00Z
depth: standard
iteration: 3
files_reviewed: 12
files_reviewed_list:
  - src/accessories/basementGuardian.ts
  - src/accessories/serviceCatalogue.ts
  - src/platform.ts
  - test/accessories/basementGuardian.test.ts
  - test/accessories/serviceCatalogue.test.ts
  - test/platform.test.ts
  - features/support/fakeHap.ts
  - features/support/steps/hap.ts
  - features/support/steps/homekit.ts
  - features/harness.feature
  - features/safetyMonitoring.feature
  - README.md
findings:
  critical: 0
  warning: 3
  info: 0
  total: 3
status: issues_found
---

# Phase 03: Code Review Report (iteration 3)

**Reviewed:** 2026-08-30
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found (0 blockers)

## Summary

Every iteration-2 finding was reproduced against the repo's own HAP stand-in and the compiled
`dist-test` output, not read off the diff. All four are genuinely fixed, and the fixes hold in the
inverse direction as well.

Three defects remain, none of them a safety-invariant break. The one that matters is that
`ignoredFaults` is silently not applied while a device's profile does not resolve, and that
`republishPublishedRows()` actively drives a sensor the administrator configured away.

### What was confirmed by execution

**iter2 CR-01 (cross-scope trust) — fixed, both directions.** Reproduced the original defect shape:
quiet system, then one wrong-typed `backup_pump_fault`. `Primary Pump`, `Backup Pump`, and
`Sump Pit Level` now read `Status Active = false` alongside `Backup Pump Fault`; their retained
values (`Pump Fault = false`, `Status Fault = NO_FAULT`, `Water Sensor Fault Reported = false`,
`Contact Sensor State = 0`) stay exactly where they were. The inverse holds too: `Sump Pit Flood`,
`Primary Pump Running`, `Backup Pump Activated`, both power rows, both battery rows, and
`Basement Guardian Offline` all stay active, because none of them reads `fault`.

I swept all five failing scopes at the accessory level and compared `Status Active` against each
row's declared `readScopes`. Zero mismatches in either direction — no row goes inactive for a scope
it does not read, and no row that reads a failing scope stays active.

The wider consequence of `Sump Pit Level` going inactive on a fresh water level is the correct
trade. HomeKit has no per-characteristic trust marker, so the choice is between over-marking doubt
on one fresh value and publishing the retained `Water Sensor Fault Reported` as the device's current
report. `D-014` picks doubt, and the code picks doubt.

**iter2 CR-02 (the swallowed throw) — fixed, no orphan reachable.** Drove a device whose first
`decode()` throws through `registerDiscoveredDevices`. After the failing inventory:
`accessories.size = 0`, `basementGuardianAccessories.size = 0`, `registerPlatformAccessories`
calls = 0, one logged error. A live store notification while unregistered caused zero decodes, so
no subscription survived either. The next inventory registered exactly one accessory carrying all
fifteen services, and a subsequent real live change (`ac_power` true → false) moved
`mains-power-lost` to `CONTACT_NOT_DETECTED` on that same registered accessory — one subscription,
wired to the object Homebridge holds.

The fixer's claim about the already-registered path also checks out. With an accessory restored
through `configureAccessory`, a throwing first update leaves the cached instance bound to an
accessory Homebridge already holds, and `registerPlatformAccessories` is never called. No orphan.
(A separate, smaller consequence of that path is WR-02 below.)

**iter2 WR-01/WR-02 (`republishPublishedRows`) — fixed, `D-014` holds.** Published a flooding pit
with the primary running and mains lost, then drove two unresolved-family polls and diffed every
characteristic on all fifteen services. The only decoded value that moved was none: fourteen rows
changed `Status Active` true → false and nothing else. `Basement Guardian Offline` kept its
`Status Active = true` and advanced `Contact Sensor State` 0 → 1 on the second disconnected poll,
which is the accessory's own count and not a decode. An accessory that never published stays at
zero services after ten unresolved disconnected polls. `D-11` also holds: with
`serial_communications === false`, `connectivity` stays trusted and `Basement Guardian Offline`
stays active and quiet.

**Both guards discriminate — neither passes vacuously.** The derived-vs-declared `readScopes` check
(`serviceCatalogue.test.ts:886`) agrees with the shipped catalogue, and I broke it in both
directions: under-declaring `Sump Pit Level` as `['water']` yields observed `['water','fault']` and
fails; over-declaring `Sump Pit Flood` as `['water','battery']` yields observed `['water']` and
fails. The `ensureService` required-characteristic check answers `[]` for the shipped catalogue and
names both missing characteristics for the deliberately drifted row, so its negative control is
real. I also verified the precondition that check protects: `PumpService` requires only
`PumpRunning` and `SumpPitService` requires only `WaterLevel` and `RawWaterLevelCode`, all from
each row's own scope, so no required characteristic can be left at a HAP format default.

**Gates.** `tsc --noEmit`, `eslint --max-warnings=0`, 995 unit tests, 62 Cucumber scenarios / 548
steps, and `fallow` all pass. Direct coverage of `basementGuardian.js`, `serviceCatalogue.js`, and
`platform.js` is 100% line, branch, and function. No comment or test title in the changed files
carries a GSD phase, plan, wave, or task reference; no line exceeds 160 columns. The one `fallow`
duplicate (`features/support/steps/hap.ts:108-119` / `163-176`) predates this iteration and is
below threshold.

**Rewritten tests.** The two connectivity rewrites are stronger, not merely different. The changed
expectation in `deactivates every service it already published...` is accompanied by two new cases
that pin the offline run advancing on the unresolved poll path and staying frozen across ten live
updates — behaviour the old `map(() => false)` expectation could not have expressed. The README
claims about what survives each `ignoredFaults` removal were checked field by field against the
catalogue and are all accurate, and the seven names match `NOTIFICATION_SERVICE_KINDS` exactly.

## Warnings

### WR-01: `ignoredFaults` is not applied while the family does not resolve, and the suppressed sensor is actively driven

**File:** `src/accessories/basementGuardian.ts:397-411` (`republishPublishedRows`), reached from
`src/accessories/basementGuardian.ts:517`

**Issue:** `publishRows()` calls `isSuppressed(row.kind)` and `removeServiceIfPresent()`.
`republishPublishedRows()` does neither. It walks the whole catalogue, and for every row the
accessory carries a service for — suppressed or not — it projects values and pushes
`Status Active`. So on the unresolved-family path, `ignoredFaults` is silently a no-op.

Reproduced through `registerDiscoveredDevices`, not by reading the code. Run 1: no `ignoredFaults`,
family resolves, Homebridge caches an accessory carrying `Basement Guardian Offline` and
`Mains Power Lost`. Run 2 (a restart): the owner has added both to `ignoredFaults` and the device's
`deviceTypeId` no longer resolves. `configureAccessory` restores the same accessory, so
`dispatchDiscoveredDevice` takes the already-registered branch and `update()` takes the unresolved
path. After two polls:

```
basement-guardian-offline still in HomeKit: true
  { Name: 'Basement Guardian Offline', 'Contact Sensor State': 0, 'Status Active': true }
mains-power-lost still in HomeKit: true
  { Name: 'Mains Power Lost', 'Contact Sensor State': 0, 'Status Fault': 0, 'Status Active': false }
```

`Basement Guardian Offline` is not merely a leftover: it is republished every poll with a live
verdict and `Status Active = true`. An owner who removed that sensor gets it back, still firing, and
any automation attached to it fires with it. That is the opposite of what `serviceCatalogue.ts:723`
promises for `CONF-06` / `D-017`.

100% branch coverage does not catch this, because the branch is absent rather than uncovered. No
unit case and no Cucumber scenario drives suppression through an unresolved family — the one
suppression scenario (`safetyMonitoring.feature:140`) only exercises the resolved path.

**Why this is a warning and not a blocker:** no safety invariant breaks. The values
`republishPublishedRows` writes onto the other suppressed rows are the same retained values an
unsuppressed row keeps, marked inactive, so there is no false normal; and the offline row's verdict
is correct, merely unwanted. Reaching the state also requires a profile that stopped resolving,
which the accessory already warns about once. It is still a configuration contract the plugin
silently drops.

**Fix:** apply the same gate the publishing path applies. In `republishPublishedRows`:

```ts
for (const row of catalogue) {
  if (isSuppressed(row.kind)) {
    removeServiceIfPresent(accessory, row);

    continue;
  }

  const service = publishedService(accessory, row);
  // ... unchanged
}
```

Add a case that drives a suppressed adapter through an unresolved-family update and asserts
`accessory.getServiceById(...)` is `undefined`, and a Cucumber scenario that restarts with
`ignoredFaults` set against a device whose profile no longer resolves.

### WR-02: a context mutation that precedes a throwing `update()` never earns its persistence call

**File:** `src/platform.ts:192-222`

**Issue:** `updateDiscoveredDevice` mutates `accessory.displayName`, `accessory.context.lastVendorName`,
and `accessory.context.device` (lines 192-194), then calls `basementGuardianAccessory.update()`
(line 208), then compares `previousState` against `nextState` to decide whether to call
`api.updatePlatformAccessories` (line 220). When `update()` throws, the mutation has already
happened but the comparison never runs. On the next poll `previousState` is read back off the
already-mutated accessory, so it equals `nextState` and the persistence call is skipped for good.

Reproduced. Poll 0 publishes and persists (`updatePlatformAccessories` carries `'Old Name'`). The
vendor renames the device; poll 1 applies the rename and then throws inside `decode()`. Poll 2 has
the same name, the same context, and the same fifteen services, so nothing differs and nothing is
persisted:

```
poll 0 persists: 1
poll 1 (rename, update throws): errors 1  displayName now 'New Vendor Name'  persists 1
poll 2 (same name, update works): persists 1
poll 3 idle: persists 1   -> [ [ 'Old Name' ] ]
```

The Homebridge cache keeps `'Old Name'` and the stale `lastVendorName` for the rest of the run. It
self-heals on the next restart (the restored accessory's `displayName` still equals its
`lastVendorName`, so the rename is re-detected and this time persisted), so the blast radius is a
wrong HomeKit display name until restart. No telemetry, identity, or safety state is affected —
`context.device` is rewritten identically on every poll.

**Fix:** compute `nextState` from local values rather than from the accessory, and move the
mutation after the update — or, more simply, do not read the baseline off an object this function
has already written to:

```ts
const previousState = { displayName: previousDisplayName, lastVendorName: previousVendorName, device: previousDevice, services: basementGuardianAccessory.services };

try {
  basementGuardianAccessory.update(snapshot, 'poll');
} finally {
  const nextState = { displayName: rename.displayName, lastVendorName: rename.lastVendorName, device: nextDevice, services: basementGuardianAccessory.services };

  if (!isDeepStrictEqual(previousState, nextState)) {
    context.api.updatePlatformAccessories([accessory]);
  }
}
```

A `finally` keeps the throw travelling to the loop's handler while still persisting the identity the
function already committed to the accessory.

### WR-03: a test title now contradicts its own assertion

**File:** `test/accessories/basementGuardian.test.ts:473-493`

**Issue:** The case is titled `deactivates every service it already published when the family stops
resolving`, but its assertion (line 489-492) is
`PUBLISHED_SCOPES.map((scope) => scope === 'connectivity')` — that is, every service *except*
`Basement Guardian Offline`, which the same iteration deliberately made stay active. The title now
states a rule the code does not follow and the case does not check.

This matters more than a typo here. Iteration 1 rewrote five tests that had encoded bugs, and
iteration 2 found one of those rewrites had encoded a new contradiction. A title that overstates its
assertion is how the next reader concludes the connectivity exception is a regression rather than a
decision — and `.claude/rules/typescript-unit-testing.md` requires a title to state the public
behaviour.

**Fix:**

```ts
test('deactivates every service derived from the profile, and leaves the offline sensor active, when the family stops resolving', () => {
```

Nothing else in the case needs to change; the assertion is already the right one.

---

_Reviewed: 2026-08-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
