# Phase 2: Safe Gemini Discovery and Identity - Pattern Map

**Mapped:** 2026-08-29
**Files analyzed:** 9 (3 new, 6 modified)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/device/registry.ts` (new) | service | transform (lookup + three-way outcome) | `src/cloud/types.ts` (predicate/normalizer discipline) + `src/device/family.ts` (the type it composes) | role-match |
| `src/device/gemini.ts` (implement `DeviceFamily<TDomainState>`) | service | transform (validate/decode) | `src/cloud/types.ts` (`isWireDevice`/`toApiDevice` predicate + field-by-field builder) | exact |
| `src/device/health.ts` (extend `DistrustReason`, no new file) | model | transform | itself — additive edit only | exact |
| `src/accessories/reconciliation.ts` (new) | service | event-driven (absence tracking, state machine) | `src/device/state.ts` (`createDeviceStateStore` factory-with-closure-state shape) | role-match |
| `src/accessories/basementGuardian.ts` (implement factory) | component | request-response (characteristic push) | `src/device/state.ts` (factory function returning an interface, freeze discipline) + `src/platform.ts` (accessory registration/update calls) | role-match |
| `src/persistence/accessoryContext.ts` (add `lastVendorName`, correct fileoverview) | model | CRUD (persisted record) | itself — additive edit only | exact |
| `src/platform.ts` (discovery loop, register/update/unregister) | controller | request-response + event-driven | `src/runtime/accountRuntime.ts` (`onReportedPatch`/`onConnected` hook composition pattern) + Homebridge template `discoverDevices()` shape cited in RESEARCH.md Pattern 3 | role-match |
| `src/runtime/accountRuntime.ts` (new discovery hook for `platform.ts` to observe) | service | event-driven | itself — existing `ShadowRuntimeOptions` hook style (`onReportedPatch`, `onConnected`, `onDisconnected`) | exact |
| `test/device/registry.test.ts`, `test/accessories/reconciliation.test.ts` (new) | test | transform | `test/device/gemini.test.ts` (type-only `satisfies`/`@ts-expect-error` stub, to be upgraded to behavioral cases) | role-match |

## Pattern Assignments

### `src/device/registry.ts` (service, transform)

**Analog:** `src/device/family.ts` (the type being composed) + `src/cloud/types.ts` (predicate/build discipline)

**Imports pattern** (`src/device/family.ts` lines 17):
```typescript
import type { DeviceSnapshot } from './state.js';
```
Follow this for the registry: `import type { DeviceFamily } from './family.js';` etc., type-only imports for interfaces, and relative `.js`-suffixed paths.

**Core pattern — three-way outcome, keyed lookup, not a switch** (`src/device/family.ts` lines 56-66, the interface being looked up):
```typescript
export interface DeviceFamily<TDomainState> {
  readonly deviceTypeId: string;
  readonly displayName: string;
  readonly implemented: boolean;
  validate(snapshot: DeviceSnapshot): FamilyValidation;
  decode(snapshot: DeviceSnapshot): TDomainState;
  capabilities(state: TDomainState): readonly DeviceCapability[];
  command(capability: DeviceCapability, requested: boolean): FamilyCommand;
}
```
Build a `Map<string, DeviceFamily<unknown>>` populated at module load (per RESEARCH.md Pattern 1), never a switch statement — `DEV-02` requires new families addable without touching callers. Gate every consumer on `implemented === true` before calling `validate`/`decode` (registry miss and `implemented: false` are the same "do not decode" branch with distinct log messages, per RESEARCH.md's HALO pitfall).

**Validation/narrowing discipline to copy** (`src/cloud/types.ts` lines 103-140):
```typescript
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasStringFields(value: Record<string, unknown>, names: readonly string[]): boolean {
  return names.every((name) => typeof value[name] === 'string');
}
```
Gemini's `validate()` should follow this hand-written-predicate style (never `as`/assertion narrowing), reporting `FieldViolation[]` per `src/device/family.ts`'s `FieldViolationReason = 'missing' | 'wrong-type' | 'out-of-domain'` instead of returning a boolean.

**Field-by-field build discipline, never spread** (`src/cloud/types.ts` lines 160-169):
```typescript
export function toApiDevice(device: WireDevice): ApiDevice {
  return {
    deviceId: device.deviceId,
    deviceTypeId: device.deviceTypeId,
    name: device.name,
    serialNumber: device.attributes.serialNumber,
    connectivity: device.connectivity,
    data: device.data,
  };
}
```
Gemini's `decode()` must build its domain state the same way — never `{ ...snapshot.data }` — so an unread vendor field never reaches domain state, `accessory.context`, or a log line (the same discipline the anti-pattern list in RESEARCH.md calls out).

---

### `src/accessories/reconciliation.ts` (service, event-driven — DEV-05 absence tracking)

**Analog:** `src/device/state.ts` (`createDeviceStateStore`)

**Factory-with-injected-options-and-closure-state pattern** (`src/device/state.ts` lines 71-75, 275-330):
```typescript
export interface DeviceStateStoreOptions {
  clock: Clock;
  log: Logging;
}

export function createDeviceStateStore(options: DeviceStateStoreOptions): DeviceStateStore {
  const snapshots = new Map<string, DeviceSnapshot>();
  const listeners = new Map<string, Set<DeviceSnapshotListener>>();

  return {
    snapshot(deviceId: string): DeviceSnapshot | undefined {
      return snapshots.get(deviceId);
    },
    // ...
  };
}
```
Build the reconciliation module the same way: an options object taking injected `clock`/`log` (never `Date.now()` or a bare `Homebridge` singleton inline), a `Map<string, number>` closure for the per-device consecutive-absence counter, and a returned interface exposing only the methods callers need (e.g. `observeTrustworthyInventory(deviceIds)` returning which device IDs are now confirmed-absent). This mirrors `DeviceStateStore`'s shape: canonical mutable state lives in one closure, never a module-level `let`.

**Small, well-named pure helpers above the factory** (`src/device/state.ts` lines 116-127, 192-230) — model the counter transition and "is this a trustworthy response" predicate as small top-level functions with a one-line rationale comment, the way `isStalePatch`, `carriesObservation`, and `nextShadowVersion` are written, rather than inlining the logic in the factory body.

---

### `src/device/gemini.ts` (service, transform — DeviceFamily<GeminiState> implementation)

**Analog:** `src/cloud/types.ts` predicate/build pair (above), composed with the existing `src/device/family.ts` interface and `src/device/gemini.ts`'s own existing field-name unions (`GeminiTelemetryField`, `GeminiMetadataField`, lines 15-40) which the new `validate`/`decode` must read from `snapshot.data`/`snapshot.metadata` by exactly those keys.

**Existing declaration to extend, not replace** (`src/device/gemini.ts` lines 15-40) — the type-only field-name unions stay; `DeviceFamily<GeminiDomainState>` is implemented alongside them in the same file, matching `implemented: true`.

---

### `src/persistence/accessoryContext.ts` (model, CRUD — DEV-06 rename field + DEV-01 fileoverview fix)

**Analog:** itself. Two edits, both additive:

1. Correct the fileoverview (lines 4-7) — remove the claim that the record "holds no account identifier"; `deviceId` embeds `<account-id>_<serial-number>` and the Phase 2 CONTEXT.md decision treats it as non-sensitive, storable in context and logs.
2. Add a field for `DEV-06`'s stored vendor name, following the existing interface style (lines 46-56):
```typescript
export interface AccessoryContext {
  deviceId: string;
  deviceTypeId: string;
  serialNumber: string;
  primaryPump: PumpObservation;
  backupPump: PumpObservation;
  watermarks: ActivationWatermarks;
}
```
Add `lastVendorName: string;` (or the discretionary name chosen) in the same flat, non-nested style — no new nested type needed, matching how `serialNumber` sits as a plain field beside the structured `PumpObservation`/`ActivationWatermarks` members.

Also remove the `.fallowrc.json` `ignoreFindings` entry for this file once Phase 2 writes a real consumer (per CONTEXT.md's "Known contradictions to correct").

---

### `src/accessories/basementGuardian.ts` (component, request-response — DEV-04/DEV-07/DEV-08)

**Analog:** `src/device/state.ts`'s factory shape (freeze discipline, injected options) + `src/platform.ts`'s registration call pattern for how the accessory factory is invoked from the composition root.

**Existing declaration to implement, not replace** (`src/accessories/basementGuardian.ts` lines 20-32):
```typescript
export interface BasementGuardianAccessory {
  readonly deviceId: string;
  readonly services: readonly ServiceDescriptor[];
  update(snapshot: DeviceSnapshot): void;
}
```
Implement a factory function, e.g. `createBasementGuardianAccessory(options): BasementGuardianAccessory`, mirroring `createDeviceStateStore`'s options-object-plus-closure shape. The factory receives the Homebridge `PlatformAccessory` and `api.hap` (never HAP-NodeJS imported directly, per project constraint) and must call `accessory.getService(this.api.hap.Service.AccessoryInformation)` — never `addService` — per RESEARCH.md Pattern 2, since every `PlatformAccessory` already carries one.

**Registration/update call pattern to copy** (`src/platform.ts` lines 96-100, extend for `didFinishLaunching`):
```typescript
configureAccessory(accessory: PlatformAccessory): void {
  this.log.info('Loading accessory from cache:', accessory.displayName);
  this.accessories.set(accessory.UUID, accessory);
}
```
The new discovery loop in `platform.ts` follows RESEARCH.md's verified Pattern 3 shape: look the UUID up in `this.accessories` (populated by `configureAccessory` above) before deciding register vs. update, seed the UUID only from `device.deviceId` via `this.api.hap.uuid.generate(device.deviceId)`, and call `this.api.updatePlatformAccessories([existing])` after any `accessory.context` mutation (context writes are otherwise invisible on disk — see RESEARCH.md's "Context mutation with no persistence call" pitfall).

**Degrade-in-place (DEV-08):** compose degradation as `DeviceHealth`/`UntrustedScope` data (see `src/device/health.ts` pattern below), setting `StatusActive = false` and leaving `StatusFault` untouched — never throw `HapStatusError` from a characteristic getter (verified in RESEARCH.md against `node_modules/@homebridge/hap-nodejs/dist/lib/definitions/CharacteristicDefinitions.d.ts`).

---

### `src/device/health.ts` (model, transform — DEV-08 degradation composition)

**Analog:** itself, additive only.

**Existing shape to compose into, not parallel** (`src/device/health.ts` lines 25-53):
```typescript
export type TrustScope = 'connectivity' | 'water' | 'pump' | 'power' | 'battery' | 'fault';
export type DistrustReason = 'stale' | 'unreachable' | 'invalid' | 'controller-link-lost';

export interface UntrustedScope {
  scope: TrustScope;
  reason: DistrustReason;
  lastTrustedAt: number | undefined;
}
```
Per CONTEXT.md's "Claude's Discretion," decide whether the unsupported-profile case gets a new `DistrustReason` member or reuses `'invalid'` — either way, DEV-08 degradation must flow through `UntrustedScope`/`DeviceHealth`, not a new parallel degradation type, matching the doc comment's own instruction ("This projection carries that marking, so a HomeKit handler reads trust from one place instead of inferring it").

---

### `src/platform.ts` (controller, request-response + event-driven — DEV-04/DEV-05 discovery loop)

**Analog:** `src/runtime/accountRuntime.ts`'s hook-composition style for wiring the DEV-05 absence signal.

**Hook interface pattern to copy for the new discovery/removal hook** (`src/runtime/accountRuntime.ts` lines 60-66):
```typescript
export interface ShadowRuntimeOptions {
  credentials: CredentialCache;
  retry: RetryPolicy;
  onReportedPatch: (deviceId: string, patch: ReportedPatch) => void;
  onConnected: () => void;
  onDisconnected: (reason: ShadowDisconnectReason) => void;
}
```
RESEARCH.md's Open Question 1 recommends the same shape for `DEV-05`: add an `onDiscoverySucceeded` (or similarly named) callback to `AccountRuntimeOptions` alongside the existing `onReportedPatch`/`onConnected` hooks, so `platform.ts` reacts to "account runtime reports facts" the same way it already would for shadow events, rather than polling `DeviceStateStore.deviceIds()` on a second timer.

**Composition-root wiring style to copy** (`src/platform.ts` lines 43-93) — every collaborator built through one `createAccountRuntimeFromConfig` call inside the constructor; the accessory registry/reconciliation module should be composed the same way, injected rather than reached through a singleton, and the discovery loop itself runs from the `didFinishLaunching` handler already present:
```typescript
this.api.on('didFinishLaunching', () => {
  void runtime.start();
});
```

---

## Shared Patterns

### Hand-written predicate narrowing (never `as`/assertion)
**Source:** `src/cloud/types.ts` lines 103-149 (`isRecord`, `hasStringFields`, `isWireDevice`, `isWireDeviceListResponse`)
**Apply to:** `src/device/registry.ts`, `src/device/gemini.ts`'s `validate()`. Every "is this shape valid" check is a named boolean-returning function reading one field at a time; no `as Type` assertions on untrusted input.

### Field-by-field construction, never spread of untrusted/raw data
**Source:** `src/cloud/types.ts` lines 160-169 (`toApiDevice`)
**Apply to:** `src/device/gemini.ts`'s `decode()`, `src/accessories/basementGuardian.ts`'s `AccessoryInformation` population, and anything writing to `accessory.context`. Never `{ ...raw }`; list every field explicitly so an unread vendor key (including the account identifier structure) cannot reach persistence or a log line.

### Factory-with-injected-options-object, closure-held mutable state
**Source:** `src/device/state.ts` lines 71-75, 275-330 (`DeviceStateStoreOptions`, `createDeviceStateStore`)
**Apply to:** `src/device/registry.ts`, `src/accessories/reconciliation.ts`, `src/accessories/basementGuardian.ts`. All state lives in one closure returned as a narrow interface; dependencies (`clock`, `log`) are injected, never read from a global or constructed inline.

### Deep-freeze before returning canonical state
**Source:** `src/device/state.ts` lines 129-154 (`freezeDeep`, `freeze`)
**Apply to:** any new factory returning a snapshot-like object a consumer might mutate in place — reconciliation's absence-state records and any new domain-state shape `gemini.ts` decodes.

### Homebridge accessory registration/context-persistence discipline
**Source:** `src/platform.ts` lines 96-100; RESEARCH.md Pattern 3 (verified against `node_modules/homebridge/dist/api.d.ts`)
**Apply to:** `src/platform.ts`'s new discovery loop. Always check `this.accessories` (populated by `configureAccessory`) before registering; always call `this.api.updatePlatformAccessories([accessory])` immediately after any `accessory.context` write; only call `unregisterPlatformAccessories` on confirmed absence per `DEV-05`.

### `AccessoryInformation`: fetch, never add
**Source:** RESEARCH.md Pattern 2, verified against `node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js:229-251, 266-279`
**Apply to:** `src/accessories/basementGuardian.ts`. `accessory.getService(this.api.hap.Service.AccessoryInformation)` only; `addService` on the same UUID throws.

## No Analog Found

None. Every file in scope for Phase 2 has an existing declaration-only module to extend (`family.ts`, `gemini.ts`, `halo.ts`, `health.ts`, `basementGuardian.ts`, `accessoryContext.ts`) or a same-codebase structural analog for its role (`state.ts` for factory shape, `types.ts` for narrowing/build discipline, `accountRuntime.ts` for hook composition, `platform.ts` for registration calls). The two genuinely new modules (`src/device/registry.ts`, `src/accessories/reconciliation.ts`) compose existing seams rather than introducing an unprecedented shape, per RESEARCH.md's own primary recommendation.

## Metadata

**Analog search scope:** `src/device/`, `src/accessories/`, `src/persistence/`, `src/cloud/`, `src/runtime/`, `src/platform.ts`, `test/device/`, `test/accessories/`, `features/support/`
**Files scanned:** `src/device/family.ts`, `src/device/gemini.ts`, `src/device/halo.ts`, `src/device/health.ts`, `src/device/state.ts`, `src/cloud/types.ts`, `src/persistence/accessoryContext.ts`, `src/runtime/accountRuntime.ts`, `src/platform.ts`, `src/accessories/basementGuardian.ts`, `src/accessories/services.ts`, `test/device/gemini.test.ts`, `test/accessories/basementGuardian.test.ts`, `features/support/fakeHomebridgeApi.ts`
**Pattern extraction date:** 2026-08-29
