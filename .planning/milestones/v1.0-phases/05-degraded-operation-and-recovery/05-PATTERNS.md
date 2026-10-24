# Phase 5: Degraded Operation and Recovery - Pattern Map

**Mapped:** 2026-09-01
**Files analyzed:** 12 (5 new, 7 modified)
**Analogs found:** 12 / 12
**Every path below was verified with `git ls-files` and read in this session.** Line numbers were
re-read from the working tree on `features/phase-04-pump-records-and-official-controls`, not
inherited from `05-RESEARCH.md`.

## File Classification

| New/Modified File | New? | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|------|-----------|----------------|---------------|
| `src/runtime/monitoringHealth.ts` | new | service (state machine) | event-driven | `src/accessories/reconciliation.ts` | exact |
| `src/device/health.ts` | modify | model (type declarations) | — | itself (extend in place) | n/a |
| `src/runtime/accountRuntime.ts` | modify | service (composition + poll loop) | request-response + pub-sub | itself (`recordPollSuccess`/`recordPollFailure`, `monitoringPathNow`) | n/a |
| `src/accessories/basementGuardian.ts` | modify | controller (accessory) | transform | itself (`distrustReasonsOf` / `untrustedScopesOf`) | n/a |
| `src/accessories/controls.ts` | modify | middleware (write gate) | request-response | itself (`LOCAL_REFUSALS`, `isConfirmedOffline`) | exact |
| `src/platform.ts` | modify | provider (composition root) | event-driven | itself (`configureAccessory`, `subscribeToLiveState`) | n/a |
| `src/accessories/staleMarking.ts` (or equivalent export) | new | utility | transform | `src/accessories/serviceCatalogue.ts` `publishValue` | role-match |
| `test/runtime/monitoringHealth.test.ts` | new | test (unit) | — | `test/accessories/reconciliation.test.ts` | exact |
| `test/accessories/cloudImportScope.test.ts` (D-09 gate) | new | test (static gate) | file-I/O | `test/accessories/timerFreedom.test.ts` | exact |
| `features/support/fakeHomebridgeApi.ts` | modify | test harness (fake) | — | itself (`writeToCache` / `restoreCachedAccessories`) | n/a |
| `features/support/world.ts` | modify | test harness (World) | — | itself (`restoredAccessories`) | n/a |
| `features/degradedOperation.feature` + steps | modify | test (e2e) | — | `features/degradedOperation.feature`, `features/support/steps/homekit.ts` | exact |

## Pattern Assignments

### `src/runtime/monitoringHealth.ts` (service, event-driven) — NEW

Holds `consecutiveRestFailures`, `lastShadowMessageAt`, and `credentialsRejected`; answers the trust
projection D-02/D-04/D-05 need. Research recommends a separate module because
`src/runtime/accountRuntime.ts` is already 786 lines and `.fallowrc.json` caps unit size.

**Analog:** `src/accessories/reconciliation.ts` — the existing consecutive-observation counter with
confirmation semantics. Copy its whole shape: fileoverview citing decisions, a `CONFIRMATION_THRESHOLD`
module constant, an interface, an injected-options interface, small named pure predicates above the
factory, and a `create*` factory returning an object literal that closes over mutable state.

**Threshold constant + named predicates** (`src/accessories/reconciliation.ts:20-21, 48-60`):

```typescript
/** How many consecutive trustworthy responses must omit a deviceId before it counts as confirmed absent (D-029). */
const CONFIRMATION_THRESHOLD = 2;

// A deviceId omitted from a trustworthy response advances its count by one;
// D-029 requires two omissions in a row, not one, before a deviceId counts
// as confirmed absent.
function nextAbsenceCount(previousCount: number): number {
  return previousCount + 1;
}

function isConfirmedAbsent(count: number): boolean {
  return count >= CONFIRMATION_THRESHOLD;
}
```

**Injected-options + factory shape** (`src/accessories/reconciliation.ts:42-46, 62-72`):

```typescript
/** Everything the reconciliation state machine needs, by injection. */
export interface ReconciliationOptions {
  clock: Clock;
  log: Logging;
}

export function createReconciliation(options: ReconciliationOptions): Reconciliation {
  const absenceCounts = new Map<string, number>();

  return {
    observe(deviceIds: readonly string[]): readonly string[] { /* ... */ },
    forget(deviceId: string): void { absenceCounts.delete(deviceId); },
  };
}
```

**Clock injection** — copy the port verbatim from `src/runtime/clock.ts:7-15`. Do **not** read
`Date.now()`; D-05 requires shadow silence to be evaluated lazily against the injected `Clock` on the
poll tick so `advanceClock()` can drive it (`features/support/world.ts:237-240`).

**Do not** import `node:timers` or `node:timers/promises` if this module ever moves under
`src/accessories/` — `test/accessories/timerFreedom.test.ts:38, 98-111` is a static gate on that.
Also do not reuse `reconciliation.ts` itself: it counts per-`deviceId` absence
(`src/accessories/reconciliation.ts:70-96`) and a REST failure is account-wide.

---

### `src/device/health.ts` (model) — MODIFY

Where `MonitoringPath`, `TrustScope`, `DistrustReason`, and `UntrustedScope` already live. D-04's
second projection type belongs here beside them.

**Type-declaration convention** (`src/device/health.ts:17-24, 26-44`) — every exported type carries a
doc comment that states the safety reasoning, not the mechanics:

```typescript
/**
 * How the plugin is currently receiving device state.
 *
 * REST polling alone is a working degraded path, not a failure: discovery can
 * succeed while the shadow connection does not, and the plugin keeps reporting
 * from polls while it retries the shadow in the background.
 */
export type MonitoringPath = 'shadow-and-poll' | 'poll-only' | 'unavailable';

/** One scope the plugin can no longer vouch for, and why. */
export interface UntrustedScope {
  scope: TrustScope;
  reason: DistrustReason;
  /** Local time the scope last carried a value the plugin still trusts. */
  lastTrustedAt: number | undefined;
}
```

`DistrustReason` already carries `'unreachable'` (`:36`) — D-02's global withdrawal reuses it and
needs no new reason. The file overview at `:11-14` claims `DeviceHealth` has no production consumer;
if this phase assembles it, update that sentence.

---

### `src/runtime/accountRuntime.ts` (service) — MODIFY

**Do not edit `monitoringPathNow()` in place** (D-04). Add a second projection beside it.

**The existing projection and its derived-not-assigned discipline** (`:337-355`):

```typescript
  function monitoringPathNow(): MonitoringPath {
    if (stopped || halted || !polling) {
      return 'unavailable';
    }

    return shadowConnected ? 'shadow-and-poll' : 'poll-only';
  }

  // Whether the poll is succeeding is one of the facts the path is derived
  // from, so the fact and the report move together and cannot disagree.
  function recordPollSuccess(): void {
    polling = true;
    options.failures.recordSuccess(POLLING);
  }

  function recordPollFailure(error: unknown): void {
    polling = false;
    options.failures.recordFailure(POLLING, describeFailure(error));
  }
```

`recordPollSuccess` / `recordPollFailure` (called from `runPoll` at `:522-540`) are the two seams the
REST-failure counter hooks into. D-11's clearing rule ("a successful REST poll clears the REST
degradation") is `recordPollSuccess`.

**Shadow arrival stamp** — the only place every message is observed (`:415-424`):

```typescript
      const client = options.createShadow({
        credentials: cache,
        retry: shadowRetry,
        onReportedPatch: (deviceId: string, patch: ReportedPatch) => {
          options.store.applyReportedPatch(deviceId, patch);
        },
        onConnected: handleShadowConnected,
        onDisconnected: handleShadowDisconnected,
      });
```

Stamp `lastShadowMessageAt` here. Do **not** use `shadowConnected` (socket state) or
`snapshot.receivedAt` — CONTEXT D-05 rules both out.

**Failure-log `kind` constants** (`:42-54`) — the naming convention for D-03's new kinds:

```typescript
// What one failing activity is called. The name reads as the subject of the
// recovery sentence the failure log writes, and each one carries its own
// warning cadence.
const POLLING = 'Device polling';
const ROTATION = 'Credential rotation';
const SHADOW = 'The shadow connection';
const AUTHENTICATION = 'Authentication';

const SHADOW_DEGRADED = 'The shadow connection is unavailable, so device state is coming from polling alone until it returns.';
```

**Facade getter** (`:645-648`) — the new projection is exposed the same way:

```typescript
  return {
    get monitoringPath(): MonitoringPath {
      return monitoringPathNow();
    },
```

**Options-interface doc convention** (`:110-126`) — every injected callback carries a paragraph
naming the decision it enforces (`onTrustworthyInventory`, `onDeviceRemoved`, `clock`, `log`). A new
`onMonitoringHealth` push follows that shape.

---

### `src/accessories/basementGuardian.ts` (controller, transform) — MODIFY

Two changes: D-02's global trust withdrawal, and D-10's credential-rejection push.

**Scope set to reuse for shadow silence** (`:185-194`) — D-02's narrowing says shadow-only silence
withdraws exactly this set and spares `connectivity`:

```typescript
const NON_CONNECTIVITY_SCOPES: ReadonlySet<TrustScope> = new Set(TRUST_SCOPES.filter((scope) => scope !== 'connectivity'));
```

**Reason-merge pattern to copy for the new cause** (`:251-289`) — note that an existing reason is
never overwritten; the new cause fills only scopes nothing else claimed:

```typescript
function reasonsOf(scopes: Iterable<TrustScope>, reason: DistrustReason): Map<TrustScope, DistrustReason> {
  const reasons = new Map<TrustScope, DistrustReason>();

  for (const scope of scopes) {
    reasons.set(scope, reason);
  }

  return reasons;
}

function distrustReasonsOf(violated: ReadonlySet<TrustScope>, controllerLinkLost: boolean): ReadonlyMap<TrustScope, DistrustReason> {
  const reasons = reasonsOf(violated, 'invalid');

  if (controllerLinkLost) {
    for (const scope of NON_CONNECTIVITY_SCOPES) {
      if (!reasons.has(scope)) {
        reasons.set(scope, 'controller-link-lost');
      }
    }
  }

  return reasons;
}
```

Add the monitoring-degradation scopes with reason `'unreachable'` in the same `if (!reasons.has())`
shape. The two assignment sites are `:725` (unresolved family) and `:739-743` (normal path).

**The command-gating half is free** (`:442-455`) — D-07's "valid state" predicate already exists:

```typescript
  function reportedControlValue(control: ControlDefinition): boolean | undefined {
    if (untrusted.some((scope) => scope.scope === control.capability)) {
      return undefined;
    }
    // ...
  }
```

**Injected-predicate pattern for the new command-transport gate** (`:457-462, 512-525`):

```typescript
  function offlineConfirmed(): boolean {
    return offlineCount >= offlineThreshold;
  }

  const controls = createControlBinder({
    hap, log, timers: options.timers, commands: options.commands, deviceId,
    offlineConfirmed,
    republish: () => { republishControlRows(controls.pending); },
  });
```

**Per-service publish pass** — where D-10's `HapStatusError` push has to reach (`:483-492`):

```typescript
  function publishRow(row: ServiceRow, service: Service, input: ProjectionInput): void {
    for (const value of row.project(input)) {
      publishValue(service, value.characteristic, value.value);
    }

    publishValue(service, hap.Characteristic.StatusActive, isRowFullyTrusted(row, input.untrustedScopes));
  }
```

**Log-once discipline for a sustained condition, and the line CONTEXT says is wrong** (`:625-646`):

```typescript
  // The transition into a degraded state logs once; recovery clears the flag,
  // so a sustained degradation says nothing further while a later relapse still
  // reports itself (D-05).
  function reportDegradation(): void {
    if (!untrusted.some((scope) => scope.reason !== 'controller-link-lost')) {
      degraded = false;

      return;
    }

    if (degraded) {
      return;
    }

    log.warn(
      `Degraded ${deviceId}: the profile or payload stopped validating. ` +
        'AccessoryInformation keeps its last valid values until a family-valid update recovers it.',
    );
    degraded = true;
  }
```

CONTEXT's incidental finding: that message names the wrong cause for a transport outage. `:653-660`
(`reportControllerLink`) is the same shape and shows how a second cause gets its own flag and line.

---

### `src/accessories/controls.ts` (middleware, request-response) — MODIFY

D-07's new command-transport predicate and D-08's `-70412` answer.

**The refusal table and its predicates** (`:163-205`) — add one row:

```typescript
function hasNoFreshState(request: ControlRequest): boolean {
  return request.reported === undefined;
}

function isConfirmedOffline(request: ControlRequest): boolean {
  return request.offlineConfirmed;
}

function notAllowedInCurrentState(hap: API['hap']): number {
  return hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE;
}

// The rules in the order they are evaluated, cheapest and most local first. The
// first that applies answers the write; the rest are never consulted.
const LOCAL_REFUSALS: readonly LocalRefusal[] = [
  { applies: isNotAnOnRequest, status: notAllowedInCurrentState, cause: 'only an on request is supported, and the device reports when the condition ends' },
  { applies: hasNoFreshState, status: notAllowedInCurrentState, cause: 'the plugin has no fresh state for it' },
  { applies: isConfirmedOffline, status: notAllowedInCurrentState, cause: 'the device is confirmed offline' },
  { applies: isAlreadyActive, status: (hap) => hap.HAPStatus.RESOURCE_BUSY, cause: 'it already reads active' },
];
```

`LocalRefusal` is declared at `:142-146`; `ControlRequest` at `:130-136`. The new
command-transport fact is sampled into `ControlRequest` once before the first rule runs, per the
comment at `:127-129`.

**Injected-predicate option shape** (`:60-67`) — copy this doc discipline for the new one:

```typescript
  /**
   * Whether the configured run of consecutive disconnected polls has been reached.
   *
   * The accessory answers this from the same count it hands `ProjectionInput`,
   * so the fact a row publishes from and the fact a write is refused on cannot
   * disagree (RES-03, D-09).
   */
  offlineConfirmed: () => boolean;
```

**Refusal + clearing-push residual** (`:307-330`) — D-08 says this residual applies unchanged:

```typescript
  function armClearingPush(service: Service, reported: () => boolean | undefined): void {
    timers.setTimeout(() => {
      clearRefusal(hap, service, republish, reported());
    }, 0);
  }

  function refuseLocally(service: Service, capability: DeviceCapability, reported: () => boolean | undefined, refusal: LocalRefusal): never {
    armClearingPush(service, reported);
    log.warn(`Refused ${capability} on ${deviceId}: ${refusal.cause}.`);

    return refuse(hap, refusal.status(hap));
  }
```

The `cause` string is what D-07 requires to name which predicate blocked.

---

### `src/platform.ts` (provider, event-driven) — MODIFY

**The method D-06 hooks** (`:500-504`) — currently a two-line record:

```typescript
  /** Records an accessory that Homebridge restored from its cache. */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }
```

D-12 forbids putting the marking pass inline here — it must be an exported function both this method
and `features/support/world.ts:579-587` call.

**Module-scope exported helper convention** (`:158-162`) — the file already keeps its logic in
free functions outside the class, which is exactly the shape the marking pass wants:

```typescript
function subscribeToLiveState(basementGuardianAccessory: BasementGuardianAccessory, deviceId: string, store: DeviceStateStore): void {
  store.subscribe(deviceId, (next) => {
    basementGuardianAccessory.update(next, 'live');
  });
}
```

`registerDiscoveredDevices` (`:340`) is the existing exported example the harness already calls.

**Lifecycle wiring** (`:491-497`) — where a monitoring-health subscription would be attached.

---

### `src/accessories/staleMarking.ts` (utility, transform) — NEW

The exported D-06 marking pass. It walks a restored accessory's existing services and pushes
`StatusActive = false`.

**Analog:** `src/accessories/serviceCatalogue.ts:923-927` — the single write verb:

```typescript
export function publishValue(service: Service, characteristic: CharacteristicClass, value: CharacteristicValue): void {
  declareCharacteristic(service, characteristic);

  service.updateCharacteristic(characteristic, value);
}
```

Use `publishValue`, never `setCharacteristic` — `src/accessories/controls.ts:31-33` records that
`setCharacteristic` on `On` routes through the write path and becomes a self-issued command. Contrast
with `seedConfiguredName` (`serviceCatalogue.ts:929-943`), which is the deliberately-different
seed-once verb; the marking pass is a publish, not a seed.

---

### `test/runtime/monitoringHealth.test.ts` (test, unit) — NEW

**Analog:** `test/accessories/reconciliation.test.ts:1-45`. Copy the import ordering, the
`createSilentLog()` helper, the fixed `NOW` constant with an inline `Clock`, the options/factory
helper pair, and `describe`/`test` with `// arrange` `// act` `// assert` comment bands:

```typescript
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createReconciliation } from '../../src/accessories/reconciliation.js';

import type { Reconciliation, ReconciliationOptions } from '../../src/accessories/reconciliation.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { Logging } from 'homebridge';

const NOW = 1_700_000_000_000;

function reconciliationOptions(): ReconciliationOptions {
  const clock: Clock = { now: () => NOW };

  return { clock, log: createSilentLog() };
}
```

Note the relative-ESM `.js` extension on every import, required by the project's ESM constraint.

---

### `test/accessories/cloudImportScope.test.ts` (test, static gate) — NEW

D-09's gate: no module under `src/accessories/` imports anything under `src/cloud/`, and no `onGet`
handler exists in `src/`.

**Analog:** `test/accessories/timerFreedom.test.ts` — the same class of gate, and the one whose
non-vacuity discipline D-09 demands. Copy all four parts:

1. **The forbidden set declared once** (`:31-38`), consumed by both the real case and the controls,
   "so the two spellings cannot drift apart".
2. **The root walk plus an enumeration floor** (`:40-49`) — a gate that reads nothing must not report
   the same green as a gate that read everything:

```typescript
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ACCESSORIES_DIRECTORY = join(REPOSITORY_ROOT, 'src', 'accessories');

// The accessories tier holds nine modules. A gate that enumerated fewer than
// this read the wrong directory, and every assertion built on that read would
// pass without examining a single accessory module.
const ACCESSORIES_MODULE_FLOOR = 9;
```

3. **The three-spelling detector** (`:60-66`), which distinguishes an import from a prose mention:

```typescript
function importsModule(source: string, specifier: string): boolean {
  return new RegExp(`(\\bfrom\\s+|\\bimport\\s+|\\bimport\\s*\\(\\s*)['"]${specifier}['"]`, 'u').test(source);
}
```

4. **The planted-fixture positive and negative controls** (`:72-96, 113-135`) — one fixture per
   spelling caught, one per way the detector must stay quiet. This is how D-09's "plant a violating
   read path, watch the gate fail" is satisfied in-repo rather than by hand.

`test/accessories/hapImportScope.test.ts:83-93` adds the recursive `typeScriptFilesUnder` walk and
the repository-relative POSIX path formatting, needed if the new gate spans more than one directory.

---

### `features/support/fakeHomebridgeApi.ts` (test harness) — MODIFY

D-12 requires services and their values to survive a restart. The current cache is name + JSON
context only.

**What exists** (`:214-218`):

```typescript
  function writeToCache(accessories: readonly FakeAccessory[]): void {
    for (const accessory of accessories) {
      cached.set(accessory.UUID, { displayName: accessory.displayName, context: JSON.stringify(accessory.context) });
    }
  }
```

**What restores** (`:263-274`):

```typescript
    restoreCachedAccessories(): readonly FakeAccessory[] {
      const restored = [...cached.entries()].map(([uuid, entry]) => {
        const accessory = new HarnessPlatformAccessory(entry.displayName, uuid);
        Object.assign(accessory.context, JSON.parse(entry.context) as Record<string, unknown>);

        return accessory;
      });

      handedAccessories.push(...restored);

      return restored;
    },
```

**The doc comment that must be rewritten, not just the code** (`:97-111`) — it currently argues the
omission is deliberate and stricter. D-12 supersedes that argument; the replacement must say why.

Restored characteristics must come back with `pushed = true` and `statusCode = SUCCESS`, because
`features/support/publishedServices.ts:51-53` reads `pushed` to tell a published value from a HAP
format default. `features/support/fakeHap.ts:188, 197, 288-290, 495-504` is where those two members
live and where `updateCharacteristic` clears the stored status — the same real-HAP behaviour D-10
depends on.

**All 78 existing scenarios must be re-run immediately after this change** (D-12).

---

### `features/support/world.ts` (test harness) — MODIFY

**The stand-in D-12 names** (`:572-587`):

```typescript
  // What `BasementGuardianPlatform.configureAccessory` does, which is the one thing the harness
  // stands in for that a restart depends on: Homebridge hands every cached accessory back before
  // the launch event, and the platform puts each one in the map discovery then finds it in.
  private restoredAccessories(homebridge: FakeHomebridgeApi): Map<string, BasementGuardianPlatformAccessory> {
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();

    for (const accessory of homebridge.restoreCachedAccessories()) {
      accessories.set(accessory.UUID, accessory as unknown as BasementGuardianPlatformAccessory);
    }

    return accessories;
  }
```

This loop is where the shared exported marking pass gets called, so Cucumber drives real code.

**Controllable clock** (`:225-240`) — the only time source a scenario can move. D-05's lazy
poll-tick evaluation exists so the shadow-silence check is reachable from here:

```typescript
  now(): number {
    return this.scenarioTime;
  }

  advanceClock(milliseconds: number): void {
    this.scenarioTime += milliseconds;
    this.timers.runDue();
  }
```

---

### `features/degradedOperation.feature` + steps (test, e2e) — MODIFY

**Scenario shape to copy** (`features/degradedOperation.feature:1-32`) — a prose header stating the
safety claim, a `Background` seeding the fake cloud and one device, then Given/When/Then in the
harness's existing step vocabulary (`the monitoring path is "poll-only"`, `the log warns once about
the degraded path`).

**HomeKit read steps** (`features/support/steps/homekit.ts:14-46`) — the deadline discipline and the
read-through-the-catalogue rule:

```typescript
const PUBLISH_DEADLINE_MS = 2000;
const STEP_TIMEOUT_MS = 15_000;

function characteristicValue(service: FakeHapService | undefined, displayName: string): unknown {
  return pushedValue(service?.characteristics.find((candidate) => candidate.displayName === displayName));
}
```

**Never restate a published identity in a step** — resolve through the catalogue
(`features/support/publishedServices.ts:26-41`), and read the *newest* handed accessory after a
restart, per the comment at `:17-25`.

## Shared Patterns

### Rate-limited failure reporting (D-03)
**Source:** `src/runtime/failureLog.ts:15-26, 41-69`
**Apply to:** every new degradation cause in `src/runtime/`

```typescript
export interface FailureLog {
  recordFailure(kind: string, reason: string): void;
  recordSuccess(kind: string): void;
}
```

A `kind` is a capitalized noun phrase reading as the subject of the recovery sentence
(`Credential rotation`, `Device polling`, `The shadow connection`). A `reason` is the whole line and
carries no URL, response body, or credential material (AUTH-02). The module owns no timer; its
callers own the scheduling (`:36-39`). Do **not** add a second warn-once flag beside `degraded`.

### Clock injection
**Source:** `src/runtime/clock.ts:7-15` — the fifteen-line port template

```typescript
export interface Clock {
  /** Returns the current time in milliseconds since the Unix epoch. */
  now(): number;
}

/** The process clock. Wire this at the composition root only. */
export const systemClock: Clock = {
  now: () => Date.now(),
};
```

Every port in this project is one interface plus a `system*` const, wired at the composition root
only.

### The one trust rule
**Source:** `src/accessories/serviceCatalogue.ts:206-232`
**Apply to:** every consumer of the new degradation

```typescript
export function isRowTrusted(row: RowTrust, untrustedScopes: readonly UntrustedScope[]): boolean {
  return !untrustedScopes.some((untrusted) => untrusted.scope === row.scope && !row.toleratedDistrust.includes(untrusted.reason));
}

export function isRowFullyTrusted(row: ServiceRow, untrustedScopes: readonly UntrustedScope[]): boolean {
  return row.readScopes.every((scope) => isRowTrusted({ scope, toleratedDistrust: row.toleratedDistrust }, untrustedScopes));
}
```

Every row and `StatusActive` already read `untrustedScopes` and nothing else
(`ProjectionInput.untrustedScopes`, `:72-81`). Do not add a parallel "globally degraded" boolean —
the consumption point cannot tell a global cause from a field violation and must not.

### The one write verb
**Source:** `src/accessories/serviceCatalogue.ts:923-927` (`publishValue`)
**Apply to:** every new push, including the D-06 marking pass

### Log-line content rule
**Source:** `src/accessories/controls.ts:318-324`
A line names the `deviceId`, the capability and a cause, and nothing else: no URL, header value,
token, or response body (AUTH-02). The `deviceId` is admitted by the 2026-08-29 ruling.

### Doc comment carries the reasoning
Every non-obvious function in `src/` opens with a comment naming the decision ID it enforces and the
false-normal it prevents (`basementGuardian.ts:261-264, 271-276`; `accountRuntime.ts:320-336`;
`reconciliation.ts:1-15`). This is the strongest single convention in the codebase; new code that
omits it will not match.

## No Analog Found

None. Every file this phase touches has a close in-repo analog. Two notes on partial fits:

| File | Role | Data Flow | Note |
|------|------|-----------|------|
| `src/accessories/staleMarking.ts` | utility | transform | No existing module is *only* a publish helper; `publishValue` supplies the verb, `platform.ts:158-162` supplies the free-function shape. Compose the two. |
| `src/accessories/basementGuardian.ts` (D-10 branch) | controller | request-response | No existing `src/` code constructs `HapStatusError` outside the write path (`controls.ts:220-222`). D-10 is a deliberate first: reuse `refuse`'s construction form but reach it through `updateValue`, not a throw from a getter. |

## Metadata

**Analog search scope:** `src/`, `test/`, `features/` (full `git ls-files` enumeration)
**Files read this session:** `src/device/health.ts`, `src/runtime/failureLog.ts`,
`src/runtime/clock.ts`, `src/accessories/reconciliation.ts`, `src/runtime/accountRuntime.ts`
(targeted ranges), `src/accessories/basementGuardian.ts` (targeted ranges),
`src/accessories/controls.ts`, `src/accessories/serviceCatalogue.ts` (targeted ranges),
`src/platform.ts` (targeted ranges), `test/accessories/timerFreedom.test.ts`,
`test/accessories/hapImportScope.test.ts`, `test/accessories/reconciliation.test.ts` (head),
`features/support/fakeHomebridgeApi.ts` (targeted ranges), `features/support/world.ts` (targeted
ranges), `features/support/publishedServices.ts` (head), `features/support/steps/homekit.ts` (head),
`features/degradedOperation.feature`
**Pattern extraction date:** 2026-09-01
