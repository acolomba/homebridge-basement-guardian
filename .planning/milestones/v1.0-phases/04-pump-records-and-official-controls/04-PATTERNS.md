# Phase 4: Pump Records and Official Controls - Pattern Map

**Mapped:** 2026-09-01
**Files analyzed:** 17 new/modified
**Analogs found:** 13 / 17

All analog paths below were confirmed git-tracked with `git ls-files`. No gitignored mirror paths appear in this document.

## Honest headline

This phase adds the codebase's **first HomeKit write path**. There is no `onSet`, no `HapStatusError`, no `setHandler`, and no writable characteristic anywhere in `src/` today — `git grep -n "onSet\|HapStatusError\|HAPStatus"` over `src/` returns nothing, and `customCharacteristics.ts` deliberately makes every declaration read-only through one `readOnlyPerms()` helper. So `src/accessories/controls.ts`, `test/accessories/controls.test.ts`, `test/accessories/hapWriteFidelity.test.ts`, and the `Switch`/`On`/`onSet` half of `features/support/fakeHap.ts` have **no analog at all**. For those, the planner must work from `04-RESEARCH.md`'s probed HAP source excerpts, not from an in-repo pattern.

Everything else in the phase — the records module, the persist port, the two catalogue rows, the three record characteristics, the trust-scope extension, the fake harness arming — has a strong, exact analog.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/accessories/controls.ts` (NEW) | binder / controller | request-response (write) | — | **none** |
| `src/accessories/pumpRecords.ts` (NEW) | service (state machine) | event-driven / transform | `src/accessories/reconciliation.ts` | exact |
| `src/runtime/accessoryStore.ts` (NEW) | port (interface) | file-I/O | `src/runtime/clock.ts`, `src/runtime/timers.ts` | exact |
| `src/runtime/commandPort.ts` (NEW) | port (interface) | request-response | `src/runtime/timers.ts` (shape); `src/cloud/api.ts` `sendCommand` (impl) | role-match |
| `src/accessories/serviceCatalogue.ts` (MOD) | catalogue / projection | transform | itself — `pumpDefinitions` / `pumpActivityValues` / `ensureService` | exact (self) |
| `src/accessories/customCharacteristics.ts` (MOD) | config / declarations | — | itself — `ControllerDataLastTrustedAt`, `BatteryHealthCode` | exact (self) |
| `src/accessories/customServices.ts` (MOD) | config / declarations | — | itself — `PumpService.optional` | exact (self) |
| `src/accessories/basementGuardian.ts` (MOD) | accessory / orchestrator | event-driven | itself — `publishRows`, `projectionInputOf`, `TRUST_SCOPES` | exact (self) |
| `src/device/health.ts` (MOD) | model / type | — | itself — `TrustScope` union | exact (self) |
| `src/device/gemini.ts` (MOD) | adapter | transform | itself — `TELEMETRY_CHECKS` rows 182-184 | exact (self) |
| `src/cloud/api.ts` (MOD, header policy) | service | request-response | itself — `requestInit` lines 112-117 | exact (self) |
| `src/runtime/accountRuntime.ts` (MOD) | runtime / composition | request-response | itself — `store` member on `AccountRuntime` | exact (self) |
| `src/platform.ts` (MOD) | config / composition root | — | itself — `createBasementGuardianAccessoryFor`, `updatePlatformAccessories` at :230 | exact (self) |
| `test/accessories/pumpRecords.test.ts` (NEW) | test | — | `test/accessories/reconciliation.test.ts` | exact |
| `test/accessories/controls.test.ts` (NEW) | test | — | `test/accessories/reconciliation.test.ts` (structure only) | partial |
| `test/accessories/hapWriteFidelity.test.ts` (NEW) | test | — | — | **none** |
| `features/support/fakeHap.ts` (MOD) | test harness | — | itself — `StandInCharacteristic` / `FakeServiceNamespace` for the *shape*; nothing for the write path | partial |
| `features/support/fakeRestApi.ts` (MOD) | test harness | request-response | itself — `failNextWith` / `holdNextRequest` / `armDevicesAnswer` | exact (self) |
| `features/support/world.ts` (MOD, controllable timers) | test harness | — | itself — `clock: this` / `advanceClock` | role-match |
| `features/support/steps/controls.ts` (NEW) | test harness (steps) | — | `features/support/steps/homekit.ts` | exact |
| `features/officialControls.feature`, `features/pumpRecords.feature` (NEW) | test | — | `features/safetyMonitoring.feature` | exact |

## Pattern Assignments

### `src/accessories/pumpRecords.ts` (NEW — service / state machine)

**Analog:** `src/accessories/reconciliation.ts` — the closest module in the repo. It is a closure-backed factory over an injected `Clock` + `Logging`, holding per-key counters across calls, with the domain rule pulled into named module-level helpers. Copy its whole skeleton.

**Docblock + imports pattern** (`reconciliation.ts:1-20`):

```typescript
/**
 * @fileoverview DEV-05: the two-consecutive-trustworthy-absence removal
 * state machine.
 * ...
 */

import type { Clock } from '../runtime/clock.js';
import type { Logging } from 'homebridge';

/** How many consecutive trustworthy responses must omit a deviceId before it counts as confirmed absent (D-029). */
const CONFIRMATION_THRESHOLD = 2;
```

Note the two conventions to copy verbatim: relative ESM imports carry `.js`; a domain constant is module-level with the decision ID in its docblock.

**Interface + options pattern** (`reconciliation.ts:23-47`):

```typescript
/** Tracks per-deviceId consecutive-absence counts across trustworthy inventory responses. */
export interface Reconciliation {
  observe(deviceIds: readonly string[]): readonly string[];
  forget(deviceId: string): void;
}

/** Everything the reconciliation state machine needs, by injection. */
export interface ReconciliationOptions {
  clock: Clock;
  log: Logging;
}
```

`PumpRecordsOptions` follows exactly: `clock`, `log`, plus the new `store: AccessoryStore` and the `accessory.context` record it owns (D-08).

**Named-rule helpers pattern** (`reconciliation.ts:49-62`) — the rule is a tiny named function with the rationale above it, never inlined:

```typescript
// A deviceId omitted from a trustworthy response advances its count by one;
// D-029 requires two omissions in a row, not one, before a deviceId counts
// as confirmed absent.
function nextAbsenceCount(previousCount: number): number {
  return previousCount + 1;
}
```

D-09 (rising edge only), D-11 (recovered activation), and D-13 (classification) each get one such function.

**Timestamp formatting — do not reimplement.** `src/accessories/basementGuardian.ts:280-284`:

```typescript
// The empty string, never a fabricated time, is what a scope that has never
// decoded reports (RES-02).
function isoTimestamp(at: number | undefined): string {
  return at === undefined ? '' : new Date(at).toISOString();
}
```

This is `private` to `basementGuardian.ts` today. Either export it or move it to a shared spot — it must not be copy-pasted, and D-11's Unix-seconds→milliseconds conversion happens **before** this call, at the record boundary.

**Context types it fills** — `src/persistence/accessoryContext.ts:21-46` (`PumpObservation`, `ActivationWatermarks`). D-11 requires rewording `lastActivationAt`'s docblock (currently `/** Local time of the last observed activation. */`) to state milliseconds and the two sources.

---

### `src/runtime/accessoryStore.ts` (NEW — port)

**Analog:** `src/runtime/clock.ts` — the whole file, 15 lines. It is the minimum-shape port in this codebase: one interface, one docblock stating *why* injection rather than a global, one `system*` implementation with "Wire this at the composition root only."

```typescript
/**
 * Source of the current time.
 *
 * Scheduling, timeout, and receipt-time code takes a clock by injection rather
 * than reading `Date.now()`, so a test drives time without faking a global.
 */
export interface Clock {
  /** Returns the current time in milliseconds since the Unix epoch. */
  now(): number;
}

/** The process clock. Wire this at the composition root only. */
export const systemClock: Clock = {
  now: () => Date.now(),
};
```

**Stronger rationale pattern for the docblock** — `src/runtime/timers.ts:1-13` explains injection as *evidence about an absence*. `AccessoryStore`'s docblock should carry the D-10 equivalent: a test hands in a recorder and asserts `persist()` was **not** called on an unchanged update.

**Composition-root wiring analog** — `src/platform.ts:230`, inside `updateDiscoveredDevice`'s change-detection block:

```typescript
    // A context mutation Homebridge does not know about is invisible on disk
    // until the next full register/unregister cycle, so only a real change
    // earns the call rather than persisting an identical value on every poll.
    if (!isDeepStrictEqual(previousState, nextState)) {
      context.api.updatePlatformAccessories([accessory]);
    }
```

The new `store.persist()` is a second, independent caller of the same API. The comment above already states D-10's rule in this codebase's own words — reuse the phrasing.

**Injection site analog** — `src/platform.ts:105-116` `createBasementGuardianAccessoryFor`, the one call site where the `PlatformAccessory` and `context.api` are both in scope. `store` is added to this object literal beside `timers`.

---

### `src/runtime/commandPort.ts` (NEW) + `src/runtime/accountRuntime.ts` (MOD)

**Analog for the interface shape:** `src/runtime/timers.ts` `Timers` (a pure port with per-method docblocks, no implementation coupling).

**Analog for the `AccountRuntime` member** — `accountRuntime.ts:118-130`:

```typescript
/** One account's cloud work, started and stopped by the Homebridge lifecycle. */
export interface AccountRuntime {
  readonly monitoringPath: MonitoringPath;
  /**
   * The canonical device state both sources land in.
   *
   * The runtime owns the single store, so whatever renders device state reads
   * and subscribes here rather than keeping a second copy that can disagree.
   */
  readonly store: DeviceStateStore;
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

`readonly commands: CommandPort;` goes beside `store`, with a docblock in the same voice (a claim about ownership plus the requirement ID).

**Root abort signal analog** — `accountRuntime.ts:199` `const root = new AbortController();` is the signal every command must pass through, so a shutdown cancels an in-flight command.

**The send-with-deadline implementation already exists** — `src/cloud/api.ts:129-140`:

```typescript
async function send<T>(options: CloudApiOptions, call: VendorCall<T>, signal: AbortSignal): Promise<T> {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(call.deadlineMs)]);
  const idToken = await options.auth.idToken(deadline);
  const response = await fetch(new URL(call.path, options.baseUrl), requestInit(call.method, call.body, `Bearer ${idToken}`, deadline));

  return narrow(call, response);
}
```

and `sendCommand` at `api.ts:167-177` already sets `deadlineMs: COMMAND_DEADLINE_MS`. Do not rebuild the deadline.

**Header policy lands here** — `api.ts:107-117`, the branch that already distinguishes a body-carrying request:

```typescript
// A read carries no body and so declares no content type; a command declares
// one, because the vendor reads its command bodies as JSON.
function requestInit(method: string, body: string | undefined, authorization: string, deadline: AbortSignal): RequestInit {
  if (body === undefined) {
    return { method, headers: { Authorization: authorization }, signal: deadline };
  }

  return { method, headers: { Authorization: authorization, 'Content-Type': JSON_CONTENT_TYPE }, body, signal: deadline };
}
```

The folded header todo is scoped to the command path, which is exactly the second branch. Adding to both branches would change every read's wire shape.

---

### `src/accessories/serviceCatalogue.ts` (MOD — two control rows, `alwaysPublish`, `pendingControls`)

**Analog: the file itself.** Every seam the phase touches has an in-file precedent.

**Row definition pattern** (`serviceCatalogue.ts:495-520`, `pumpDefinitions`) — the two control rows copy this literal shape:

```typescript
    {
      kind: 'primary-pump-running',
      displayName: 'Primary Pump Running',
      scope: 'pump',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input, trust) => pumpActivityValues(hap, input, trust, 'primaryRunning'),
    },
```

The control rows use `serviceClass: hap.Service.Switch`, `scope: 'self-test'` / `'alarm-mute'` (D-02), `toleratedDistrust: []`, and `kind: 'system-self-test'` / `'alarm-mute'` — both already in `src/accessories/services.ts:33`.

**`values` function pattern** (`serviceCatalogue.ts:353-364`) — read the trusted group, then hand candidates to `published()`:

```typescript
function pumpActivityValues(hap: API['hap'], input: ProjectionInput, trust: RowTrust, field: string): readonly ProjectedValue[] {
  const running = booleanOf(trustedGroup(input, trust, 'pump'), field);

  return published([{ characteristic: hap.Characteristic.ContactSensorState, value: contactState(hap, running) }]);
}
```

**Withholding pattern for D-05** — `published()` at `serviceCatalogue.ts:203-218` is the whole mechanism; a control row passes `value: undefined` while pending and nothing is published:

```typescript
// A row publishes only the facts it can vouch for: an absent one is omitted
// rather than defaulted, so the last trustworthy value stays published and no
// service ever reads as a normal the device never reported (D-014, RES-01).
function published(candidates: readonly Candidate[]): readonly ProjectedValue[] {
  const values: ProjectedValue[] = [];

  for (const candidate of candidates) {
    if (candidate.value !== undefined) {
      values.push({ characteristic: candidate.characteristic, value: candidate.value });
    }
  }

  return values;
}
```

**`ProjectionInput` extension pattern** (`serviceCatalogue.ts:38-69`) — every member carries a docblock naming the requirement it serves, e.g.:

```typescript
  /** Whether the configured number of consecutive disconnected polls has been reached (RES-03, D-09). */
  offlineConfirmed: boolean;
```

`pendingControls` (and the pump record values) follow that one-line-with-IDs form.

**`ServiceRow` optional-member pattern** for `alwaysPublish` — `RowDefinition.readScopes` at `serviceCatalogue.ts:120-127` shows an optional definition member defaulted in `toRow`:

```typescript
  /** Absent for a row that reads its own scope and nothing else, which is most of them. */
  readScopes?: readonly TrustScope[];
```

and `toRow` at `:453-471` is where the default is applied:

```typescript
function toRow(definition: RowDefinition): ServiceRow {
  const { kind, displayName, scope, toleratedDistrust, serviceClass, readScopes = [scope], values } = definition;
```

**`ensureService` — the line that changes** (`serviceCatalogue.ts:705-714`):

```typescript
export function ensureService(accessory: PlatformAccessory, row: ServiceRow, projected: readonly ProjectedValue[]): Service | undefined {
  const service = publishedService(accessory, row);

  if (service !== undefined) {
    return service;
  }

  return projected.length === 0 ? undefined : accessory.addService(row.serviceClass, row.displayName, row.subtype);
}
```

Its docblock (`:678-704`) states the invariant as absolute. Research Pattern 6 is right that the docblock must be revised, not just the code.

**`publishedService` — the binder's lookup** (`serviceCatalogue.ts:660-676`). Its docblock already names the D-01 use case verbatim: *"This is the one lookup an accessory reaches for when it must act on what it already published without publishing anything new."*

```typescript
export function publishedService(accessory: PlatformAccessory, row: ServiceRow): Service | undefined {
  return accessory.getServiceById(row.serviceClass, row.subtype);
}
```

**Declare-before-push** (`serviceCatalogue.ts:736-756`) — the route `StatusActive` on a `Switch` travels (D-03):

```typescript
function declareCharacteristic(service: Service, characteristic: CharacteristicClass): void {
  if (!service.testCharacteristic(characteristic) && !service.optionalCharacteristics.some((declared) => declared.UUID === characteristic.UUID)) {
    service.addOptionalCharacteristic(characteristic);
  }
}

export function publishValue(service: Service, characteristic: CharacteristicClass, value: CharacteristicValue): void {
  declareCharacteristic(service, characteristic);

  service.updateCharacteristic(characteristic, value);
}
```

`publishValue` is also the exact call the D-04 clearing push must make.

**Verb discipline** — `seedConfiguredName`'s docblock (`:766-784`) states: *"The verb is the contract: this seeds where `publishValue` publishes, and the two must not be confused."* Once `On` has an `onSet`, `setCharacteristic` becomes a self-inflicted command; the binder docblock should carry the equivalent warning.

---

### `src/accessories/customCharacteristics.ts` (MOD — three/four record characteristics, `'uint32'` per D-12)

**Analog: the file itself.**

**UUID constant pattern** (`customCharacteristics.ts:74-90`):

```typescript
// Fixed published identities: none of them may ever change, and each is
// deliberately outside Apple's assigned base namespace
// (`-0000-1000-8000-0026BB765291`), so no future Apple type can collide with one
// (SAFE-08).
const RAW_WATER_LEVEL_CODE_UUID = 'f5c6e2da-7a4f-46c0-b02e-b501e90877cf';
...
const CONTROLLER_DATA_LAST_TRUSTED_AT_UUID = 'd4d0209b-1472-4a39-8d1b-1c48d94efc7f';
```

**The `'uint32'` edit D-12 mandates** — `customCharacteristics.ts:91-93` and the `formats` map at `:117-121`:

```typescript
type CharacteristicFormat = 'bool' | 'uint8' | 'string';
```

```typescript
  const formats: Readonly<Record<CharacteristicFormat, string>> = {
    bool: hap.Formats.BOOL,
    uint8: hap.Formats.UINT8,
    string: hap.Formats.STRING,
  };
```

Both lines change together — the `Record` type makes the compiler enforce it. Add `uint32: hap.Formats.UINT32`.

**ISO-8601 string precedent D-12 follows** (`customCharacteristics.ts:172-176`):

```typescript
    ControllerDataLastTrustedAt: define({
      displayName: 'Controller Data Last Trusted At',
      uuid: CONTROLLER_DATA_LAST_TRUSTED_AT_UUID,
      format: 'string',
    }),
```

**Domain-constrained precedent** (`:157-165`) for anything needing `minValue`/`validValues`:

```typescript
    BatteryHealthCode: define({
      displayName: 'Battery Health Code',
      uuid: BATTERY_HEALTH_CODE_UUID,
      format: 'uint8',
      // Replace, Poor, Okay, Good, NA, and NotDetected: the codes the vendor can
      // legally send, published as reported and never arbitrated (D-008).
      domain: { validValues: [1, 2, 4, 8, 16, 32] },
    }),
```

**Do not touch `readOnlyPerms()`** (`customCharacteristics.ts:126-131`) — the two writable controls use HAP's own `On`, never a custom characteristic:

```typescript
  // The read-only permission set, in the one place every declaration reads it
  // from, so no row can grant a write permission by omission (SAFE-08). It
  // answers a fresh array each time, because `CharacteristicProps.perms` is a
  // mutable member and two characteristics must not share one.
  function readOnlyPerms(): CharacteristicProps['perms'] {
    return [hap.Perms.PAIRED_READ, hap.Perms.NOTIFY];
  }
```

---

### `src/accessories/customServices.ts` (MOD — record characteristics as optional on `PumpService`)

**Analog: the `PumpService` entry itself** (`customServices.ts:133-137`):

```typescript
    PumpService: define({
      uuid: PUMP_SERVICE_UUID,
      required: [characteristics.PumpRunning],
      optional: [characteristics.PumpFault, characteristics.PumpFuseBlown],
    }),
```

The record characteristics extend `optional` only. `define`'s body at `:109-126` shows why that is the safe list — `required` entries go through `addCharacteristic` (constructed at a format default), `optional` entries only through `addOptionalCharacteristic`:

```typescript
        for (const characteristic of required) {
          this.addCharacteristic(characteristic);
        }

        for (const characteristic of [...optional, ...sharedCharacteristics]) {
          this.addOptionalCharacteristic(characteristic);
        }
```

`customServices.ts:24-29` already pre-authorises this exact addition in prose.

---

### `src/accessories/basementGuardian.ts` (MOD — records call, pending read, binder call)

**Analog: the file itself.**

**`TRUST_SCOPES` extension** (`basementGuardian.ts:142-154`) — this list and `TrustScope` must be extended in the same task (Pitfall 3):

```typescript
// Every scope that can lose trust, in the order `untrusted` reports them.
const TRUST_SCOPES: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault', 'connectivity'];
```

`NON_CONNECTIVITY_SCOPES` at `:154` derives from it by filter, so both new scopes are picked up automatically.

**`ProjectionInput` assembly point** (`basementGuardian.ts:498-506`) — the one place the new `pendingControls` and record values are added:

```typescript
  function projectionInputOf(decoded: unknown): ProjectionInput {
    return {
      decoded,
      untrustedScopes: untrusted,
      offlineConfirmed: offlineCount >= offlineThreshold,
      controllerDataLastTrustedAt: isoTimestamp(lastTrustedAt.get('fault')),
    };
  }
```

**`publishRows` — where the binder attaches** (`basementGuardian.ts:363-390`):

```typescript
    for (const row of catalogue) {
      if (isSuppressed(row.kind)) {
        removeServiceIfPresent(accessory, row);

        continue;
      }

      const projected = row.project(input);
      const service = ensureService(accessory, row, projected);

      if (service === undefined) {
        continue;
      }

      seedConfiguredName(hap, service, row.displayName);

      for (const value of projected) {
        publishValue(service, value.characteristic, value.value);
      }

      publishValue(service, hap.Characteristic.StatusActive, isRowFullyTrusted(row, input.untrustedScopes));
      descriptors.push({ kind: row.kind, subtype: row.subtype, serviceUuid: row.serviceClass.UUID, name: row.displayName });
    }
```

Note the `StatusActive` push already happens unconditionally for every published row, so D-03 needs no new push — only the `ensureService` exemption.

**Options-injection pattern for `store` / `commands`** (`basementGuardian.ts:96-111`):

```typescript
export interface BasementGuardianAccessoryOptions {
  accessory: PlatformAccessory;
  hap: API['hap'];
  registry: FamilyRegistry;
  log: Logging;
  /**
   * Deferred execution, taken and never called.
   * ...
   */
  timers: Timers;
```

**That `timers` docblock is now false** and must be reworded, not left. D-04's clearing push is the first call. Reword to state the D-10 boundary precisely: timer-free *across `update()`*, not timer-free as a whole.

**Local mutable state pattern** (`basementGuardian.ts:334-340`) — the pending map and the records instance follow it:

```typescript
  const lastTrustedAt = new Map<TrustScope, number>();
  let degraded = false;
  let controllerLinkLost = false;
  let untrusted: readonly UntrustedScope[] = [];
  let offlineCount = 0;
  let published: readonly ServiceDescriptor[] = [];
```

---

### `src/device/health.ts` + `src/device/gemini.ts` (MOD — D-02 trust scopes)

**Current text** (`health.ts:27`):

```typescript
export type TrustScope = 'connectivity' | 'water' | 'pump' | 'power' | 'battery' | 'fault';
```

**The three rows to re-scope** (`gemini.ts:182-184`) — currently `scope: undefined`, the shape 03-CONTEXT D-04 left for this phase.

**Command shape already built** (`gemini.ts:368-374`) — do not rebuild:

```typescript
function command(capability: DeviceCapability, requested: boolean): FamilyCommand {
  if (capability === 'self-test') {
    return { desiredData: { test_running: requested } };
  }

  return { desiredData: { alarm_audio_muted: requested } };
}
```

`CAPABILITIES` at `gemini.ts:360` is `['self-test', 'alarm-mute']`, matching the two new scope names exactly — worth keeping identical so no mapping table is needed.

---

### `src/accessories/controls.ts` (NEW) — **NO ANALOG**

There is no write path in this repository. The nearest structural relatives, and what each does and does not give:

| Related file | Gives | Does not give |
|---|---|---|
| `src/accessories/reconciliation.ts` | the factory + injected options + named-rule shape | anything about HAP, `onSet`, or async |
| `src/accessories/serviceCatalogue.ts:660-676, 736-756` | `publishedService`, `publishValue` — the two calls the binder makes | the handler registration itself |
| `src/runtime/timers.ts` | the port used for the D-04 macrotask push | no existing caller to copy |

The planner must take the binder skeleton from `04-RESEARCH.md`'s "The control binder skeleton" section, which is grounded in probed `@homebridge/hap-nodejs@2.2.2` source (`Characteristic.js:1799-1833`, `:1727-1731`), not from any in-repo pattern. Flag this as the phase's highest-uncertainty file.

Two in-repo hard constraints still bind it:
- `test/accessories/timerFreedom.test.ts` reads the source text of `src/accessories/` and fails on any `node:timers` import. The injected `Timers` port is the only route.
- `basementGuardian.test.ts:1482-1517` asserts zero deferrals across `update()`. The binder's push is on the `onSet` path, so the assertion stands — do not weaken it.

---

### `test/accessories/pumpRecords.test.ts` and `test/accessories/controls.test.ts` (NEW)

**Analog:** `test/accessories/reconciliation.test.ts` — the exact test idiom for a factory-with-injected-ports module.

**Imports + stand-in pattern** (`reconciliation.test.ts:1-40`):

```typescript
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createReconciliation } from '../../src/accessories/reconciliation.js';

import type { Reconciliation, ReconciliationOptions } from '../../src/accessories/reconciliation.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { Logging } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const NOW = 1_700_000_000_000;

// Logging is a callable interface with seven members, so the stub is a
// no-op function that carries them rather than an object literal.
function createSilentLog(): Logging {
  const noop = (): void => {
    // logging is not this module's job; the stub discards every call
  };

  return Object.assign(noop, {
    prefix: 'basement guardian',
    debug: noop, error: noop, info: noop, log: noop, success: noop, warn: noop,
  });
}

function reconciliationOptions(): ReconciliationOptions {
  const clock: Clock = { now: () => NOW };

  return { clock, log: createSilentLog() };
}
```

Copy `createSilentLog` verbatim (or hoist it — it is currently duplicated across test files), and follow the `// arrange` comment convention inside each `test()`. Hand-written stand-ins, never `strong-mock`, even though it is a devDependency.

For `controls.test.ts` this analog covers only structure; the HAP stand-in comes from `features/support/fakeHap.ts` per the established pattern (new accessories unit tests import the fake rather than growing their own).

---

### `test/accessories/hapWriteFidelity.test.ts` (NEW) — **NO ANALOG**

Per D-17 this is the sole file permitted to `import '@homebridge/hap-nodejs'`. Nothing in the repository imports it today, so there is no import-style precedent to copy. Two things it must respect:

- `src/accessories/customCharacteristics.ts:21-25` and `CLAUDE.md` scope the ban to **runtime**; the test must say so in its own `@fileoverview`, naming D-17, so a later reader does not read it as a licence.
- `test/accessories/timerFreedom.test.ts` is the precedent for a test that enforces a source-level rule by reading text. A sibling test asserting no *other* file imports the package would fit that precedent naturally.

---

### `features/support/fakeHap.ts` (MOD) — partial analog only

**Analog for the shape:** the file itself. `FakeCharacteristicNamespace` (`fakeHap.ts:169-190`) and `FakeServiceNamespace` (`:296-300`) are flat lists of declared classes; adding `Switch` and `On` follows those literally.

```typescript
export interface FakeServiceNamespace {
  new (displayName: string | undefined, UUID: string, subtype?: string): FakeHapService;
  readonly AccessoryInformation: FakeServiceClass;
  readonly LeakSensor: FakeServiceClass;
  readonly ContactSensor: FakeServiceClass;
  readonly Battery: FakeServiceClass;
}
```

**No analog for the write path.** `FakeHapCharacteristic` (`fakeHap.ts:116-131`) has `displayName`, `UUID`, `props`, `value`, `pushed`, `getDefaultValue()` and nothing else — no `statusCode`, no `onSet`, no `handleSetRequest`. Every write semantic is newly authored here, which is exactly what `hapWriteFidelity.test.ts` exists to police.

The `pushed` flag docblock is the convention worth extending — it explains precisely why the fake carries a member real HAP does not:

```typescript
  /**
   * Whether anything ever wrote this value, as against HAP having constructed it.
   *
   * The real HAP carries no such member, and no production code reads it. ...
   */
  pushed: boolean;
```

Any new fake-only member (`statusCode`, an armed refusal) needs the same kind of justification.

---

### `features/support/fakeRestApi.ts` (MOD — command-scoped arming)

**Analog: the file's own arming primitives** (`fakeRestApi.ts:41-66`):

```typescript
  /**
   * Arms the next `/devices` GET response with these devices.
   *
   * Queued answers apply in call order, one per request, before the service
   * falls back to the standing device list `setDevices` holds. ...
   */
  armDevicesAnswer(devices: readonly ApiDevice[]): void;

  /** Arms exactly one subsequent request to fail with this status. */
  failNextWith(status: number): void;

  /**
   * Records the next request and never answers it.
   * ...
   */
  holdNextRequest(): void;
```

with the matching `ServiceState` members at `:70-79` (`queuedDeviceAnswers`, `armedStatus`, `holdNext`). The new command-scoped trio copies this exactly: one interface method with a docblock, one `ServiceState` member, one consumption point.

**Where the new arming is evaluated** — inside the existing command branch (`fakeRestApi.ts:154-158`), **not** in the generic pre-route gate at `:170-175` where `holdNext` lives (Pitfall 6):

```typescript
  if (method === 'PUT' && deviceIdIn(pathname, COMMAND_SUFFIX) !== undefined) {
    respondJson(response, 200, { success: true });

    return;
  }
```

**Request recording, already present** — `route()` at `:167-169` pushes `{ method, path, authorization, body }` for every request, which is what the header-policy assertions and the "no retry" assertion read.

---

### `features/support/world.ts` (MOD — controllable timers)

**Analog:** the World's existing clock role (`world.ts:213-221`, `:509`):

```typescript
  /** The scenario's current time in milliseconds. */
  now(): number {
    return this.scenarioTime;
  }

  /** Moves the scenario clock forward. */
  advanceClock(milliseconds: number): void {
    this.scenarioTime += milliseconds;
  }
```

and `clock: this` at `:509`. The controllable `Timers` follows the same idea, replacing `timers: systemTimers` in `discoveryContext()` (`world.ts:540-556`):

```typescript
  // The harness stands in for `BasementGuardianPlatform`, so it is the one other place the concrete
  // process timers are wired, and it supplies the same validated configuration members the platform
  // reads from `validateConfig`.
  private discoveryContext(...): DiscoveryContext {
    return {
      api, accessories, basementGuardianAccessories, registry,
      log: this.logger(),
      ignoredFaults: this.ignoredFaults,
      offlineConfirmationPollCount: CONFIRMATION_POLL_COUNT,
      timers: systemTimers,
    };
  }
```

That comment names the harness's contract with `platform.ts` — if the harness stops wiring the process timers, the comment must change with it.

---

### `features/support/steps/controls.ts` (NEW)

**Analog:** `features/support/steps/homekit.ts` — exact match in role and idiom.

**Fileoverview convention** (`homekit.ts:1-12`) — states what half of the scenario sentence these steps are, and why they resolve through the catalogue rather than restating identities.

**Catalogue-resolved lookup** (`homekit.ts:46-56`) — copy this whole helper shape for reaching the two Switches:

```typescript
function serviceOf(homebridge: FakeHomebridgeApi, displayName: string): FakeHapService | undefined {
  const row = createServiceCatalogue(homebridge.hap as unknown as API['hap']).find((candidate) => candidate.displayName === displayName);

  if (row === undefined) {
    throw new Error(`the plugin publishes no ${displayName} service`);
  }

  // The catalogue declares its service classes against the real HAP types while the accessory
  // stand-in answers its own; the class is one runtime object, so the lookup needs the other view.
  return currentAccessory(homebridge)?.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);
}
```

**`pushedValue` gate** (`homekit.ts:57-70`) — a control step asserting `On` must go through this, otherwise a `Switch` the plugin never wrote to satisfies the assertion at HAP's `false` default:

```typescript
function pushedValue(characteristic: FakeHapCharacteristic | undefined): unknown {
  return characteristic?.pushed === true ? characteristic.value : undefined;
}
```

**Deadline constants** (`homekit.ts:26-28`) — `PUBLISH_DEADLINE_MS = 2000`, `STEP_TIMEOUT_MS = 15_000`. The 2.5-second command deadline and the 30-second window both interact with these; the timeout scenario needs a deliberate look at the 15 s step timeout.

**Feature file analog:** `features/safetyMonitoring.feature` for `officialControls.feature` and `pumpRecords.feature`.

---

## Shared Patterns

### Injected narrow port
**Source:** `src/runtime/clock.ts` (whole file), `src/runtime/timers.ts:1-24`
**Apply to:** `src/runtime/accessoryStore.ts`, `src/runtime/commandPort.ts`
One interface, per-method docblocks, a `system*` const marked "Wire this at the composition root only", and a docblock explaining injection as *provability* rather than convenience.

### Closure-backed factory with an options interface
**Source:** `src/accessories/reconciliation.ts:23-47`, `src/accessories/basementGuardian.ts:313-340`, `src/device/state.ts`, `src/device/registry.ts`
**Apply to:** `pumpRecords.ts`, `controls.ts`
`create<Thing>(options: <Thing>Options): <Thing>` — mutable state as `let`/`Map` in the closure, never on `this`.

### Publish only what the row can vouch for
**Source:** `serviceCatalogue.ts:203-218` (`published`), `:181-190` (`trustedGroup`)
**Apply to:** both control rows, all record characteristics
`undefined` is dropped rather than defaulted. This is the whole of D-05 and of D-13's "cannot classify".

### Declare before push
**Source:** `serviceCatalogue.ts:736-756`
**Apply to:** `StatusActive` on both Switches, all four record characteristics, and the D-04 clearing push.

### Decision IDs in comments
**Source:** everywhere — e.g. `reconciliation.ts:22`, `serviceCatalogue.ts:203-205`, `customCharacteristics.ts:74-77`
**Apply to:** every new module. A comment states the rule *and* the ID that decided it (`D-04`, `SAFE-08`, `CTRL-05`). The phase should treat this as required, not stylistic — it is how the codebase currently carries its safety rationale.

### Hand-written stand-ins in tests
**Source:** `test/accessories/reconciliation.test.ts:14-35`
**Apply to:** every new unit test. `strong-mock` is present but unused; do not introduce it.

### Optional context members, absent on first run
**Source:** `src/persistence/accessoryContext.ts:48-62`, `src/platform.ts:34-38`
**Apply to:** `primaryPump`, `backupPump`, `watermarks`, and D-13's classification field. Note `AccessoryContext` currently declares `primaryPump`/`backupPump`/`watermarks` **non-optional** while nothing writes them — the phase must reconcile that with the absent-on-first-run reality.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/accessories/controls.ts` | binder | request-response (write) | No `onSet`, no `HapStatusError`, no writable characteristic exists anywhere in `src/`. Every declaration is read-only by construction (`readOnlyPerms`). Use `04-RESEARCH.md`'s probed HAP excerpts. |
| `test/accessories/hapWriteFidelity.test.ts` | test | — | First and only permitted direct `@homebridge/hap-nodejs` import (D-17). No import precedent; `timerFreedom.test.ts` is the nearest relative only in the sense of being a rule-enforcing test. |
| `features/support/fakeHap.ts` write path (`Switch`, `On`, `onSet`, `statusCode`, `HAPStatus`, `HapStatusError`) | test harness | request-response | The fake is read-only projection today. Every write semantic is newly authored — the exact self-confirming-fake risk D-15 and `.continue-here.md` warn about. |
| Controllable `Timers` in `features/support/` | test harness | — | Both `platform.ts:429` and `world.ts:554` wire `systemTimers`; no fake timer implementation exists. The World's `clock: this` is the closest idea, not an implementation to copy. |

## Metadata

**Analog search scope:** `src/accessories/`, `src/runtime/`, `src/device/`, `src/cloud/`, `src/persistence/`, `src/platform.ts`, `test/accessories/`, `test/runtime/`, `features/`, `features/support/`, `features/support/steps/`
**Files scanned:** 40 (read in full or by targeted range): 20 confirmed git-tracked via `git ls-files`
**Pattern extraction date:** 2026-09-01
