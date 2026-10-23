# Phase 03: Device and Persistence Conformance - Pattern Map

**Mapped:** 2026-10-14
**Files analyzed:** 18 mandatory files; conditional helpers and required external consumers below.
**Analogs found:** 18 / 18 (including existing-owner preservation patterns).

This is planning guidance, not accepted findings or verification evidence. Existing owners contain review candidates; copy the specified behavior and contract, then apply the complete rulebooks. Preserve D-03 global stopping and D-04 unchanged-production RED evidence policy.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
| --- | --- | --- | --- | --- |
| `src/device/events.ts` | `model` | `event-driven` | `src/device/health.ts` | `role-match` |
| `test/device/events.test.ts` | `test` | `transform` | `test/device/family.test.ts` | `exact` |
| `src/device/family.ts` | `model` | `transform` | `src/device/health.ts` | `exact` |
| `test/device/family.test.ts` | `test` | `transform` | `test/device/events.test.ts` | `exact` |
| `src/device/gemini.ts` | `service` | `transform` | `src/cloud/shadow.ts` | `flow-match` |
| `test/device/gemini.test.ts` | `test` | `transform` | `test/device/gemini.test.ts` | `exact` |
| `src/device/halo.ts` | `config` | `transform` | `src/device/waterLevel.ts` | `role-match` |
| `test/device/halo.test.ts` | `test` | `transform` | `test/device/registry.test.ts` | `role-match` |
| `src/device/health.ts` | `model` | `event-driven` | `src/device/events.ts` | `exact` |
| `test/device/health.test.ts` | `test` | `transform` | `test/device/family.test.ts` | `exact` |
| `src/device/registry.ts` | `service` | `request-response` | `src/device/state.ts` | `role-match` |
| `test/device/registry.test.ts` | `test` | `request-response` | `test/device/registry.test.ts` | `exact` |
| `src/device/state.ts` | `store` | `event-driven` | `src/device/state.ts` | `exact` |
| `test/device/state.test.ts` | `test` | `event-driven` | `test/device/state.test.ts` | `exact` |
| `src/device/waterLevel.ts` | `utility` | `transform` | `src/device/gemini.ts` | `flow-match` |
| `test/device/waterLevel.test.ts` | `test` | `transform` | `test/device/registry.test.ts` | `role-match` |
| `src/persistence/accessoryContext.ts` | `model` | `CRUD` | `src/accessories/pumpRecords.ts` | `flow-match` |
| `test/persistence/accessoryContext.test.ts` | `test` | `transform` | `test/device/family.test.ts` | `exact` |

## Pattern Assignments

### State pair

`src/device/state.ts` is the closest store analog because it already owns opaque canonical snapshots, listeners and watermark refusal. Preserve its closure maps, injected clock, merge and runtime freeze. Do not introduce decoding here.

**Imports** — `test/device/state.test.ts:11-25`:

```typescript
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createDeviceStateStore } from '../../src/device/state.js';

import type { ApiDevice } from '../../src/cloud/types.js';
import type {
  DeviceIdentity,
  DeviceSnapshot,
  DeviceSnapshotListener,
  DeviceStateStore,
  DeviceStateStoreOptions,
  ReportedPatch,
} from '../../src/device/state.js';
import type { Clock } from '../../src/runtime/clock.js';
```

**SC-03 independent complete returns and canonical readback** — `test/device/state.test.ts:342-375`:

```typescript
  for (const { version, waterLevel, applied } of [
    { version: 4, waterLevel: 1, applied: 5 },
    { version: 5, waterLevel: 1, applied: 5 },
    { version: 6, waterLevel: 31, applied: 6 },
  ]) {
    test(`leaves water level at ${String(waterLevel)} and the applied version at ${String(applied)} for a patch at version ${String(version)}`, () => {
      // arrange
      const store = versionedStore();

      // act
      const snapshot = store.applyReportedPatch(DEVICE_ID, { data: { water_level: 31 }, state: undefined, version });

      // assert
      assert.deepStrictEqual(snapshot, {
        identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: DEVICE_TIME },
        data: { water_level: waterLevel, primary_pump_running: false, ac_power: true },
        metadata: {},
        shadowVersion: applied,
        deviceTimestamp: DEVICE_TIME,
        receivedAt: FIRST_RECEIPT,
      });
      assert.strictEqual(snapshot.data.water_level, waterLevel);
      assert.strictEqual(snapshot.shadowVersion, applied);
      assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
        identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: DEVICE_TIME },
        data: { water_level: waterLevel, primary_pump_running: false, ac_power: true },
        metadata: {},
        shadowVersion: applied,
        deviceTimestamp: DEVICE_TIME,
        receivedAt: FIRST_RECEIPT,
      });
    });
```

**Frozen shape and presence proof** — `test/device/state.test.ts:234-256`:

```typescript
  test('returns a snapshot no consumer can modify', () => {
    // arrange
    const store = createDeviceStateStore(fixedStoreOptions());

    // act
    const snapshot: DeviceSnapshot = store.applyDiscovery(geminiDevice());

    // assert
    assert.deepStrictEqual(snapshot, {
      identity: { deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: FIRST_RECEIPT,
    });
    assert.strictEqual(Object.isFrozen(snapshot), true);
    assert.strictEqual(Object.isFrozen(snapshot.identity), true);
    assert.strictEqual(Object.isFrozen(snapshot.connectivity), true);
    assert.strictEqual(Object.isFrozen(snapshot.data), true);
    assert.strictEqual(Object.isFrozen(snapshot.metadata), true);
  });
```

Also preserve nested telemetry 258–276, metadata refusal/readback 497–518, nested metadata 532–552, merged frozen envelope 554–575, and release presence 673–692 in that owner. These exact ranges are preservation targets, not permission to retain unrelated test-style defects. Source `state.ts:167–188` freezes the envelope and nested records; readonly typing cannot replace it. `state.ts:315–330` catches each listener failure and logs only a fixed safe message. Review all six warning categories separately: optional members, readonly snapshot members, JSDoc, local `data` naming, rationale comments, and incomplete assertions. Required explicit undefined keys and vendor `data` names are public contracts.

### Family, events and health declaration pairs

`src/device/health.ts` and `src/device/events.ts` are concrete declaration analogs for family model conventions. Use type imports and documented interfaces/unions; no runtime emitter or new trust scope. `test/device/family.test.ts` is the closest negative compile-contract analog for all four declaration owners, including persistence.

**Type imports** — `src/device/family.ts:15-16`:

```typescript
import type { TrustScope } from './health.js';
import type { DeviceSnapshot } from './state.js';
```

**Required exhaustive scope shape** — `src/device/family.ts:152-165`:

```typescript
export interface ScopedDomainState {
  water: WaterState | undefined;
  pump: PumpState | undefined;
  power: PowerState | undefined;
  battery: BatteryState | undefined;
  fault: FaultState | undefined;
  connectivity: ConnectivityState | undefined;
  // The two control scopes are keyed by the `DeviceCapability` they answer for,
  // so the capability, the trust scope, and the decoded group are one string and
  // no mapping table can drift (D-02).
  'self-test': SelfTestState | undefined;
  'alarm-mute': AlarmMuteState | undefined;
  metadata: DeviceMetadataState | undefined;
}
```

**Meaningful omitted-member negatives** — `test/device/family.test.ts:90-108`:

```typescript
// @ts-expect-error a rejected snapshot says which fields failed and why
void ({ valid: false } satisfies FamilyValidation);
// @ts-expect-error the command body reaches the vendor as requested data, not as reported state
void ({ reportedData: { test_running: true } } satisfies FamilyCommand);
// @ts-expect-error a field violation names the field it is about
void ({ reason: 'missing', scope: 'water' } satisfies FieldViolation);
// @ts-expect-error a field violation names the scope that stops being trustworthy while it is invalid
void ({ field: 'water_level', reason: 'missing' } satisfies FieldViolation);
// @ts-expect-error a family that forgets a scope states its absence rather than omitting the member
void ({ water: undefined, pump: undefined, power: undefined, battery: undefined, fault: undefined, connectivity: undefined } satisfies ScopedDomainState);
// @ts-expect-error the self-test scope carries the device's own timestamp beside the running flag
void ({ running: true } satisfies SelfTestState);
// @ts-expect-error the alarm mute scope reports what the device says about its audible alarm
void ({} satisfies AlarmMuteState);

const { implemented, ...withoutSupportFlag } = geminiAdapter;
void (implemented satisfies boolean);
// @ts-expect-error an adapter states whether it can drive the device type it names
void (withoutSupportFlag satisfies DeviceFamily<SumpState>);
```

For `test/device/events.test.ts`, preserve discriminant/device/local-time negatives at 26–33; recovered activation keeps distinct device timestamp. For `test/device/health.test.ts`, preserve absent-list versus empty-list and narrow scope negatives at 19–26. Type-only pairs may correctly run zero runtime cases. Do not add assertions to mirror compiler or static gates. Events are an intentional declaration contract, not authorization to remove unused events or add emitters.

### Gemini pair

The closest external transform analog is `src/cloud/shadow.ts:197–205`: guard untrusted input and construct the complete typed result, including explicit absence. It is not a family decoder; keep Gemini's own scope gating and field domains.

**Complete guarded transform** — `src/cloud/shadow.ts:197-205`:

```typescript
function toReportedPatch(document: ShadowDocument): ReportedPatch {
  const reported = document.state.reported;
  const sections = isRecord(reported) ? reported : {};

  return {
    data: isRecord(sections.data) ? sections.data : undefined,
    state: isRecord(sections.state) ? sections.state : undefined,
    version: typeof document.version === 'number' && Number.isFinite(document.version) ? document.version : undefined,
  };
```

**Narrow self-guarding decoded scopes** — `src/device/gemini.ts:360-374`:

```typescript
function decode(snapshot: DeviceSnapshot): GeminiDomainState {
  const { data, metadata } = snapshot;
  const untrusted = untrustedScopesOf(data);

  return {
    water: untrusted.has('water') ? undefined : decodeWater(data),
    pump: untrusted.has('pump') ? undefined : decodePump(data),
    power: untrusted.has('power') ? undefined : decodePower(data),
    battery: untrusted.has('battery') ? undefined : decodeBattery(data),
    fault: untrusted.has('fault') ? undefined : decodeFault(data),
    connectivity: untrusted.has('connectivity') ? undefined : decodeConnectivity(data),
    'self-test': untrusted.has('self-test') ? undefined : decodeSelfTest(data),
    'alarm-mute': untrusted.has('alarm-mute') ? undefined : decodeAlarmMute(data),
    metadata: isMetadataTrustworthy(metadata) ? decodeMetadata(metadata) : undefined,
  };
```

**Independent whole invalid-scope expectation** — `test/device/gemini.test.ts:285-302`:

```typescript
  test('SAFE-01 omits the water scope for an out-of-domain water_level while every other scope keeps its current values', () => {
    // arrange
    const snapshot = buildSnapshot({ ...validTelemetry(), water_level: 2 }, validMetadata());
    const expectedState: GeminiDomainState = {
      water: undefined,
      pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined },
      power: { mainsPresent: true },
      battery: { charging: false, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
      fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
      connectivity: { reportedOffline: false },
      'self-test': { running: false, testedAt: undefined },
      'alarm-mute': { muted: false },
      metadata: { mcuFirmwareVersion: '1.2.3', wifiFirmwareVersion: '4.5.6', mcuTargetVersion: '1.3.0', wifiSignalDbm: -60 },
    };

    // act & assert
    assert.deepStrictEqual(geminiFamily.decode(snapshot), expectedState);
  });
```

Use `gemini.ts:121–164` field guards and 169–203 scope mapping as existing behavior references. Guard comments at 225–227 and changing-read fixtures in its test are review candidates, not approved copying patterns. Split arrange/act/assert in the shown case when applying the writer rules. Preserve last-valid-value retention at the accessory boundary; the decoder returns required undefined groups. Preserve legal water/battery/hour domains, official command payloads, capability limits, and metadata use. Do not infer timestamp domains or HALO telemetry from style repairs.

### Registry and HALO pairs

`src/device/state.ts:341–351` is the closest closure-state factory analog for `registry.ts`: construction owns private maps and performs no external work. Preserve registry's distinct implemented/unsupported/unknown outcomes and per-device/profile log cadence. `test/device/registry.test.ts:20–40` is the concrete whole-outcome test analog; HALO constant tests retain literal expectations rather than obtaining expected identity from production constants.

**Whole public outcome** — `test/device/registry.test.ts:20-40`:

```typescript
  test('resolves the Gemini deviceTypeId to the implemented Gemini family', () => {
    // arrange
    const registry = createFamilyRegistry();

    // act
    const outcome = registry.lookup('wayneWaterGemini');

    // assert
    assert.deepStrictEqual(outcome, { kind: 'implemented', family: geminiFamily });
  });

  test('resolves a deviceTypeId it has never seen to unknown', () => {
    // arrange
    const registry = createFamilyRegistry();

    // act
    const outcome = registry.lookup('somethingElse');

    // assert
    assert.deepStrictEqual(outcome, { kind: 'unknown', deviceTypeId: 'somethingElse' });
  });
```

For `src/device/halo.ts`, use documented constant exports as in `src/device/waterLevel.ts:19–43`; HALO remains identity-only and unsupported, with literal `wayneWaterHalo` and `Wayne Water HALO`. `test/device/halo.test.ts:15–23` already pins those literals; apply AAA rules without inventing behavior. The registry's HALO case must independently expect unsupported and the exact identity/name. Extra kind/length assertions cannot replace its whole result.

### Water-level pair

`src/device/gemini.ts:86–95` is the closest explicit domain lookup analog. Preserve `waterLevel.ts:27–34` six legal mappings and threshold 31 at 43. Never replace the ladder with a population count/formula or turn provisional values into validated hardware claims. For the owner, copy fresh construction and whole-value assertions from `test/device/registry.test.ts:20–40`; write the complete independently specified map entries when that map is the public promise. Scalar code→percentage or code→flood promises remain scalar assertions. Keep sibling cases per row and separate AAA. Do not copy message-substring error assertions as the preferred rulebook pattern.

### Persistence pair

`src/accessories/pumpRecords.ts` is the concrete CRUD/mutation consumer analog; `test/device/family.test.ts` supplies the compile-contract pattern. Persisted observation fields are deliberately writable, unlike public snapshots. Context has optional first-run records and an optional unearned test label; undefined watermark members are required.

**Device-clock watermark declaration** — `src/persistence/accessoryContext.ts:80-83`:

```typescript
export interface ActivationWatermarks {
  backupPumpTimestamp: number | undefined;
  testTimestamp: number | undefined;
}
```

**Required writable observation mutation** — `src/accessories/pumpRecords.ts:204-207`:

```typescript
function countWatchedActivation(pump: PumpObservation, receivedAt: number): void {
  pump.activationCount += 1;
  pump.lastActivationAt = receivedAt;
}
```

**Invalid-record recovery and initial epoch** — `src/accessories/pumpRecords.ts:235-258`:

```typescript
    if (!isPumpObservation(primaryPump) || !isPumpObservation(backupPump) || !isActivationWatermarks(watermarks)) {
      log.warn('The stored pump observation record could not be read, so observation starts again from now.');

      return undefined;
    }

    return { primaryPump, backupPump, watermarks };
  }

  let record = resumedRecord();

  // Observation began at the first snapshot, so the epoch is that snapshot's own receipt time
  // rather than a clock reading. Taking it from the observation introduces no second time source
  // the record could disagree with, and it is why this module needs no clock at all.
  function seed(receivedAt: number): StoredRecord {
    const seeded: StoredRecord = {
      primaryPump: { observationStartedAt: receivedAt, activationCount: 0, lastActivationAt: undefined },
      backupPump: { observationStartedAt: receivedAt, activationCount: 0, lastActivationAt: undefined },
      watermarks: { backupPumpTimestamp: undefined, testTimestamp: undefined },
    };

    context.primaryPump = seeded.primaryPump;
    context.backupPump = seeded.backupPump;
    context.watermarks = seeded.watermarks;
```

Preserve local millisecond observation/activation times and device Unix-second watermarks. `pumpRecords.ts:269–313` owns timestamp recovery/de-duplication and label writes; persistence stays typed accessory context, not a new storage service or migration. Context excludes tokens/raw telemetry. Existing runtime docblock scans in `test/persistence/accessoryContext.test.ts:68–144` require a recorded disposition against the type-only rule and their actual documentation contract; do not automatically delete them or treat them as the preferred analog.

## Shared Patterns

### Approved header and imports

Apply the original-work header to every touched source, owner, and concern helper. Preserve third-party attribution/template boundaries. Copy separation from the reviewed cloud helper below; adjust overview to its actual purpose.

```typescript
// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Supplies fresh synthetic cloud wire, device and credential records.
 */
```

Source: `test/cloud/apiSeeds.ts:1–9`. Relative imports keep `.js`; type-only usage uses `import type`. Public JSDoc describes contract; implementation `//` notes describe rationale, without GSD history.

### Conditional concern seeds

| Conditional file | Role / flow | Concrete analog | Condition |
| --- | --- | --- | --- |
| `test/device/stateSeeds.ts` | utility / transform | `test/cloud/apiSeeds.ts:13–22` | Reused state/device seeds confirmed by review |
| `test/device/geminiSeeds.ts` | utility / transform | `test/cloud/apiSeeds.ts:13–22` | Reused synthetic telemetry/snapshot seeds confirmed by review |
| `test/persistence/accessoryContextSeeds.ts` | utility / transform | `test/cloud/apiSeeds.ts:13–22` | Reused context seeds remain after justified owner triage |

```typescript
export function geminiDevice(telemetry?: Readonly<Record<string, unknown>>): ApiDevice {
  return {
    deviceId: 'account-1_serial-1',
    deviceTypeId: 'wayneWaterGemini',
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: 1_700_000_000_000 },
    data: structuredClone(telemetry ?? { water_level: 1 }),
  };
}
```

Source: `test/cloud/apiSeeds.ts:14–22`. Fresh literals/clone at boundaries; expected values remain independently written. Do not create generic helper directories, add meta-tests, or export production internals. Seeds are conditional and trigger full staged pair selection; serialize shared support work.

### Conditional exact external consumer ownership

These are bounded compatibility targets, not permission for later subsystem sweeps. Each edited production file brings its mirrored owner/direct coverage. Trace exact symbol consumers with Fallow in production and `tsconfig.test.json` before deciding edits; text matches below only orient that analysis.

| Target and role / flow | Concrete existing analog / anchor | Required contract |
| --- | --- | --- |
| `src/cloud/shadow.ts`, `test/cloud/shadow.test.ts` — service/test, event-driven | `src/cloud/shadow.ts:197–205`; `test/device/state.test.ts:342–375` | Complete `ReportedPatch`, reported-only sections |
| `src/runtime/accountRuntime.ts`, `test/runtime/accountRuntime.test.ts` — service/test, event-driven | runtime ingress 825–866; `src/cloud/shadow.ts:197–205` | Feed opaque patch/store; per-device watermark release; separate clocks |
| `src/accessories/basementGuardian.ts`, `test/accessories/basementGuardian.test.ts` — service/test, transform | projection 988–1057; `src/device/gemini.ts:360–374` | Retain last values for missing groups; narrow invalid trust; unsupported cache preservation |
| `src/accessories/pumpRecords.ts`, `test/accessories/pumpRecords.test.ts` — store/test, CRUD | `src/accessories/pumpRecords.ts:235–258` | Writable observations, recovery, explicit persistence |
| `src/accessories/serviceCatalogue.ts`, `test/accessories/serviceCatalogue.test.ts` — utility/test, transform | decodedGroup 293; `src/device/family.ts:152–165` | Same existing TrustScope vocabulary and absence |
| `src/platform.ts`, `test/platform.test.ts` — controller/test, CRUD | context indexed types 48–57; `src/persistence/accessoryContext.ts:80–108` | deviceId UUID seed; deviceTypeId adapter; explicit context update |
| `features/support/world.ts`, `features/support/steps/shadow.ts`, `features/real-pump/support/realWorld.ts` — provider/test support, event-driven | store contract `src/device/state.ts:82–145`; `src/cloud/shadow.ts:197–205` | Snapshot shape compatibility only; read Cucumber rules; no live profile |

Do not edit these simply because they appear in the table. Semantic impact for DeviceSnapshot, ReportedPatch, ScopedDomainState, PumpObservation, AccessoryContext and TrustScope determines required scope. Family/Gemini share ownership of any scoped-shape cause; state owns snapshot/patch compatibility edits.

### Review, provenance and verification

Use serial batches: state; family/Gemini/waterLevel; events/health/HALO/registry/persistence; coordinator seal. No shared build, mutation control, helper, Git or ledger overlap. Phase 1 `01-STATE-REVIEW.md` is the SC-03 preservation/proof reference; Phase 2 `02-REVIEW-PROTOCOL.md`, `02-FINDINGS.md`, `02-VERIFICATION.md` provide provenance/ledger analogs, not automatic Phase 3 acceptance.

For every genuine bug, preserve an active intended failure against unchanged production; coordinator commits complete planning-only patch/native output/command/exit/source/version evidence before GREEN source plus active-test commit. Keep all earlier evidence and actual ancestry. Assertion controls are separate and restore exact source bytes before rebuilt GREEN. D-03 pauses ALL work for a reopened finding, non-reducing round with open findings, or round four even clean; a new cause never resets the batch counter. Phase 2 human judgments are bounded to that phase.

Execution commands: serial `npm run build:test`, `node --test dist-test/test/<concern>/<owner>.test.js`, and `npm run test:coverage:direct -- src/<path>.ts test/<path>.test.ts` for each changed pair. Declaration-only handling follows the direct runner, without invented numeric coverage. Combined wave and phase gates run `npm run check`. Reuse evidence only for exact unchanged same-session inputs. Coordinator owns approved pre-step, normal foreground hooks, Git, ledger and final gate; this mapping ran none of them.

## No Analog Found

No mandatory file lacks a concrete preservation or role/flow analog. No new HALO adapter, event emitter, persistence migration or storage service is in scope. External consumer adaptations have existing owners; their complete independent review remains required if changed.

## Metadata

**Analog search scope:** tracked `src/device`, `src/persistence`, `src/cloud`, `src/accessories`, runtime/platform consumer imports, corresponding tests and existing phase research.
**Tracked-source gate:** `git ls-files` confirmed named core source/test/seed analogs. No installed/ignored capability mirror is an analog.
**Pattern extraction date:** 2026-10-14.
**Limitations:** No source/test edit, install, build, test, live vendor/hardware call or Git write. Lines describe the planning-time tree; revalidate at dispatch. External consumer anchors are bounded research/grep orientation, not fresh complete-file reviews or semantic impact proof. Review acceptance and all required test/provenance evidence remain execution responsibilities.
