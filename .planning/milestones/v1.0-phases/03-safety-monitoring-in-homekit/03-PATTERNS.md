# Phase 3: Safety Monitoring in HomeKit - Pattern Map

**Mapped:** 2026-08-30
**Files analyzed:** 21 (7 new source, 5 modified source, 7 new/modified test, 2 harness/feature)
**Analogs found:** 21 / 21 (every new file has an in-repo analog; nothing needs RESEARCH.md as its only source)

All analog paths below were checked with `git ls-files` and are tracked source. This repository has no
gitignored capability mirror.

## Style gates every excerpt already satisfies

Read `./.claude/rules/typescript-style-guide.md` and `./.claude/rules/typescript-comments.md` before
writing. The excerpts in this document are lifted verbatim from files that pass `npm run check`, so
copying them is safe. The rules that bite this phase hardest:

- `@fileoverview` JSDoc at the top of every new module, before the imports.
- No `export default` outside `src/index.ts`; no `var`; no `#private`; no `const enum`.
- `interface` for object types, never a `type` alias of an object literal. `T[]` / `readonly T[]`
  for simple element types.
- No `as` without a stated reason on the line above. Narrow with hand-written predicates.
- `CONSTANT_CASE` for module-level constants; `lowerCamelCase` file names.
- Comments carry decision IDs (`D-01`, `SAFE-04`, `RES-02`) and never phase/plan/wave references.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/accessories/waterLevel.ts` (new) | domain lookup table | transform | `src/device/gemini.ts` (`WATER_LEVEL_VALUES`, `TELEMETRY_CHECKS`) | role-match |
| `src/accessories/serviceCatalogue.ts` (new) | table-driven catalogue + projection | transform | `src/device/gemini.ts` `TELEMETRY_CHECKS` + `src/config.ts` `IntegerBounds` | exact (shape) |
| `src/accessories/customServices.ts` (new) | HAP factory over injected `hap` | request-response | `src/accessories/basementGuardian.ts` `createBasementGuardianAccessory` | role-match |
| `src/accessories/customCharacteristics.ts` (new) | HAP factory over injected `hap` | request-response | same as above | role-match |
| `src/runtime/timers.ts` (new) | injected port | event-driven | `src/runtime/clock.ts` | exact |
| `src/accessories/basementGuardian.ts` (modified) | accessory / HomeKit owner | event-driven push | itself (extend the existing closure) | exact |
| `src/accessories/services.ts` (modified) | type declaration | — | itself (add `'primary-pump-running'`) | exact |
| `src/device/gemini.ts` (modified) | family adapter | transform | itself (`FieldCheck` gains scope metadata) | exact |
| `src/device/family.ts` (modified) | contract declaration | — | itself (`FamilyValidation` / `decode` contract) | exact |
| `src/config.ts` (modified) | config validation | request-response | `integerRefusal` + `firstRefusal` | exact |
| `src/platform.ts` (modified) | composition root | request-response | `DiscoveryContext` + `basementGuardianAccessoryFor` | exact |
| `config.schema.json` (modified) | config surface | — | its existing `offlineConfirmationPollCount` entry | exact |
| `.fallowrc.json` (modified) | build config | — | its own `ignoreFindings` array | exact |
| `test/accessories/waterLevel.test.ts` (new) | unit test, data-driven | — | `test/config.test.ts` `for (const pollInterval of …)` | exact |
| `test/accessories/serviceCatalogue.test.ts` (new) | unit test, data-driven | — | same | exact |
| `test/accessories/customServices.test.ts` (new) | unit test | — | `test/accessories/basementGuardian.test.ts` | role-match |
| `test/accessories/customCharacteristics.test.ts` (new) | unit test | — | same | role-match |
| `test/runtime/timers.test.ts` (new) | unit test, port | — | `test/runtime/clock.test.ts` | exact |
| `test/configSchema.test.ts` (modified) | schema key-set test | — | itself (`CONF-04` key-set case) | exact |
| `features/support/fakeHomebridgeApi.ts` (modified) | test harness fake | — | itself (`HarnessService` / `HarnessPlatformAccessory`) | exact |
| `features/safetyMonitoring.feature` + `features/support/steps/*` (new) | scenarios | — | `features/degradedOperation.feature`, `features/support/steps/shadow.ts` | exact |

## Pattern Assignments

### `src/accessories/serviceCatalogue.ts` (new — table-driven catalogue)

**Analog:** `src/device/gemini.ts` lines 87-156, and `src/config.ts` lines 13-30.

This is the load-bearing analog of the phase. `fallow dupes` has a zero baseline at `minLines: 5` /
`minTokens: 50` (`.fallowrc.json` `duplicates.threshold: 3`), so thirteen inline publish blocks fail
`npm run check`. The repo already solves exactly this shape twice.

**Analog A — closure-returning row factories collected into one `readonly` array** (`src/device/gemini.ts:87-113,137-156`):

```typescript
type FieldCheck = (data: Readonly<Record<string, unknown>>) => FieldViolation | undefined;

function requiredBoolean(field: string): FieldCheck {
  return (data) => {
    if (!(field in data)) {
      return { field, reason: 'missing' };
    }

    return typeof data[field] === 'boolean' ? undefined : { field, reason: 'wrong-type' };
  };
}

const TELEMETRY_CHECKS: readonly FieldCheck[] = [
  requiredEnum('water_level', WATER_LEVEL_VALUES),
  requiredBoolean('primary_pump_running'),
  // ... 16 more rows, one line each
];
```

**Analog B — the loop that consumes the table** (`src/device/gemini.ts:167-179`). Copy this exact
shape for the publish/update/remove loop; it keeps every function well under `maxUnitSize: 60`:

```typescript
function violationsOf(checks: readonly FieldCheck[], data: Readonly<Record<string, unknown>>): FieldViolation[] {
  const violations: FieldViolation[] = [];

  for (const check of checks) {
    const violation = check(data);

    if (violation !== undefined) {
      violations.push(violation);
    }
  }

  return violations;
}
```

**Analog C — a named `interface` for the row, with a `CONSTANT_CASE` instance per row**
(`src/config.ts:13-30`). This is the shape to use when the row is data rather than a closure:

```typescript
/** An integer field, its inclusive bounds, and the value an absent field takes. */
interface IntegerBounds {
  field: string;
  unit: string;
  minimum: number;
  maximum: number;
  documentedDefault: number;
}

const POLL_INTERVAL_BOUNDS: IntegerBounds = { field: 'pollInterval', unit: 'seconds', minimum: 300, maximum: 3600, documentedDefault: 900 };
```

The catalogue row should be a hybrid: named `interface ServiceRow` fields (`kind`, `subtype`,
`displayName`, `scope`, HAP service class) plus one `project(state)` closure per row, in a single
`readonly ServiceRow[]`. `ServiceDescriptor` already exists in `src/accessories/services.ts:47-53`
and gives `kind` / `subtype` / `name`; extend it rather than declaring a parallel triple.

---

### `src/accessories/waterLevel.ts` (new — the provisional D-01 ladder)

**Analog:** `src/device/gemini.ts` lines 79-85.

The legal-value set already lives there with the exact "provisional, and why" comment convention the
context asks for. Mirror both the naming and the comment:

```typescript
// The known enum codes, read from hardware-observed vendor values. `water_level`
// includes 0 even though no hardware evidence validates it as a level yet: this
// is a shape check on what the vendor can legally send, not the level lookup
// itself, which stays out of this module (D-014).
const WATER_LEVEL_VALUES: ReadonlySet<number> = new Set([0, 1, 3, 7, 15, 31]);
const BATTERY_HEALTH_VALUES: ReadonlySet<number> = new Set([1, 2, 4, 8, 16, 32]);
const HOURS_OF_PROTECTION_VALUES: ReadonlySet<number> = new Set([1, 2, 4, 8]);
```

Also copy the `@fileoverview` of `src/device/gemini.ts:1-11`, which already states why the ladder was
withheld — the new module's `@fileoverview` is where it now lands, and it is what makes closing G-002
a single reviewable edit. Use `ReadonlyMap<number, number>` for the ladder (D-01 says an explicit
`Map`), declared with an annotation, not `as const`.

---

### `src/runtime/timers.ts` (new — the D-18 injected port)

**Analog:** `src/runtime/clock.ts` — the whole file, 15 lines:

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

Note the two conventions to carry over: the interface JSDoc explains *why the port exists*, and the
concrete implementation's JSDoc says "Wire this at the composition root only." For `Timers` the
composition root is `src/platform.ts`, where `systemClock` is already imported
(`src/platform.ts:12`).

**Its test analog:** `test/runtime/clock.test.ts` — the `satisfies` stand-in declaration at the top is
the pattern for proving the port is injectable, and it is what a hand-built zero-call spy should
`satisfies`-check against:

```typescript
// Every module that needs the time takes a Clock by injection, so a fixed stub
// of this shape stands in for the process clock throughout the suite.
void ({ now: () => 1_700_000_000_000 } satisfies Clock);
```

---

### `src/accessories/customServices.ts` and `customCharacteristics.ts` (new — factories over `hap`)

**Analog:** `src/accessories/basementGuardian.ts` lines 55-61 and 147-159.

`api.hap` is a runtime value, so the subclass declarations live inside a factory. The injected-options
interface and the factory signature are the established shape:

```typescript
/** Everything the accessory factory needs, by injection. */
export interface BasementGuardianAccessoryOptions {
  accessory: PlatformAccessory;
  hap: API['hap'];
  registry: FamilyRegistry;
  log: Logging;
}

export function createBasementGuardianAccessory(options: BasementGuardianAccessoryOptions): BasementGuardianAccessory {
  const { accessory, hap, registry, log } = options;
  const deviceId = deviceIdOf(accessory);
  ...
  return { deviceId, services: [], get untrusted() { ... }, update(snapshot) { ... } };
}
```

`API['hap']` is already the house spelling for the HAP namespace type — reuse it rather than
introducing a new `type Hap` alias. `createReconciliation` in `src/accessories/reconciliation.ts:69`
is the second instance of the same factory-returning-closure-object shape if a second reference helps.

---

### `src/accessories/basementGuardian.ts` (modified — trust state, offline counter, publish loop)

**Analog:** itself. The closure state to extend, not parallel (lines 148-198):

```typescript
  const { accessory, hap, registry, log } = options;
  const deviceId = deviceIdOf(accessory);

  // Local to this accessory: the receipt time of the last snapshot that
  // decoded successfully, whether the accessory is currently degraded (so a
  // repeated degraded `update()` logs nothing further), and the currently
  // exposed untrusted scopes.
  let lastTrustedAt: number | undefined;
  let degraded = false;
  let untrusted: readonly UntrustedScope[] = [];
```

The D-09 offline counter is a fourth `let` in this closure. The log-once `degraded` flag is the
precedent for D-05's "logs one warning" — do not log on every degraded poll.

**The `update()` body this phase reworks** (lines 167-196) — the all-or-nothing branch D-04 replaces:

```typescript
    update(snapshot: DeviceSnapshot): void {
      const outcome = registry.lookup(snapshot.identity.deviceTypeId);

      if (outcome.kind === 'implemented') {
        const validation = outcome.family.validate(snapshot);

        if (validation.valid) {
          const decoded = outcome.family.decode(snapshot);
          populateAccessoryInformation(accessory, hap, snapshot, decoded);
          lastTrustedAt = snapshot.receivedAt;
          untrusted = [];
          degraded = false;

          return;
        }
      }

      untrusted = computeUntrustedScopes(lastTrustedAt);

      if (!degraded) {
        log.warn(`Degraded ${deviceId}: ...`);
        degraded = true;
      }
    },
```

**Scope-set construction to generalise** (lines 79 and 115-117). The `DEGRADED_SCOPES` array is also
exactly the D-11 `serial_communications === false` poison set, so reuse the constant rather than
declaring a second identical list:

```typescript
const DEGRADED_SCOPES: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault'];

function computeUntrustedScopes(lastTrustedAt: number | undefined): readonly UntrustedScope[] {
  return DEGRADED_SCOPES.map((scope): UntrustedScope => ({ scope, reason: 'invalid', lastTrustedAt }));
}
```

Note the `.map((scope): UntrustedScope => …)` return-type annotation on the arrow — that is how this
codebase pins a mapped literal's type without an `as`.

**Structural narrowing, never `as`** (lines 81-87, 105-110) — the pattern for reading decoded state
generically:

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firmwareRevisionOf(decoded: unknown): string {
  const metadata = isRecord(decoded) ? decoded.metadata : undefined;
  const mcuFirmwareVersion = isRecord(metadata) ? metadata.mcuFirmwareVersion : undefined;

  return typeof mcuFirmwareVersion === 'string' ? mcuFirmwareVersion : UNKNOWN_FIRMWARE;
}
```

---

### `src/device/gemini.ts` + `src/device/family.ts` (modified — field→scope map, partial decode)

**Analog:** the existing `FieldCheck` closure factories (`gemini.ts:87-133`, quoted above) and the
`FamilyValidation` union (`family.ts:22-37`):

```typescript
/** How one field failed its family's contract. */
export type FieldViolationReason = 'missing' | 'wrong-type' | 'out-of-domain';

/** One field a snapshot did not supply in the form the family requires. */
export interface FieldViolation {
  field: string;
  reason: FieldViolationReason;
}

export type FamilyValidation = { valid: true } | { valid: false; violations: readonly FieldViolation[] };
```

The discretion item ("a `Map`, a record, or per-field metadata on the existing `FieldCheck`
functions") maps cleanly onto Analog A: give each `FieldCheck` row a `scope` alongside its closure —
i.e. turn `readonly FieldCheck[]` into `readonly TelemetryCheck[]` where
`interface TelemetryCheck { scope: TrustScope; check: FieldCheck; }`. That keeps one table, keeps
`violationsOf` a five-line loop, and does not duplicate the field list.

**Decode guard convention to preserve** (`gemini.ts:187-208`) — decode throws rather than guessing,
and the message names the broken contract:

```typescript
// `decode()` runs only after `validate()` confirms every field's shape, so a
// mismatch here means that contract was broken rather than a value this
// module should guess at.
function booleanField(data: Readonly<Record<string, unknown>>, field: string): boolean {
  const value = data[field];

  if (typeof value !== 'boolean') {
    throw new TypeError(`decode() expected ${field} to be a boolean; validate() must reject this snapshot first`);
  }

  return value;
}
```

A partial decode must keep this property per scope: a scope that validated decodes strictly; a scope
that did not is simply absent from the result, never filled with a default.

---

### `src/config.ts` (modified — `ignoredFaults` refusal, D-17)

**Analog:** `src/config.ts` lines 68-83 and 91-120. Copy the "returns the reason, or `undefined`"
signature and join the existing `??` chain:

```typescript
// Returns the reason to refuse this field, or undefined when it is acceptable.
// An absent field is acceptable and takes its documented default later; a
// supplied value is never clamped and never replaced by that default (D-16).
function integerRefusal(value: unknown, bounds: IntegerBounds): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < bounds.minimum || value > bounds.maximum) {
    const range = `from ${String(bounds.minimum)} to ${String(bounds.maximum)}`;

    return `${bounds.field} must be a whole number of ${bounds.unit} ${range}, but it is ${describeValue(value)}.`;
  }

  return undefined;
}
```

```typescript
// Checks the fields in one fixed order and returns on the first failure, so a
// configuration with several problems always produces the same message.
function firstRefusal(fields: Record<string, unknown>): string | undefined {
  ...
  return integerRefusal(fields.pollInterval, POLL_INTERVAL_BOUNDS) ?? integerRefusal(fields.offlineConfirmationPollCount, POLL_COUNT_BOUNDS);
}
```

`describeValue` (lines 61-66) is what quotes the bad slug safely; D-17's "name the slug and enumerate
all seven" is a template literal built the same way. Add `ignoredFaults: readonly string[]` (or
`readonly NotificationServiceKind[]`) to `BgConfig` (lines 32-40) and resolve its default in the
`ConfigAccepted` literal at lines 143-153, mirroring `resolveInteger`.

---

### `src/platform.ts` (modified — routing `ignoredFaults` to the accessory)

**Analog:** `src/platform.ts` lines 42-58 and 95-106. `DiscoveryContext` is the only seam; add one
field and pass it through at the single construction site:

```typescript
export interface DiscoveryContext {
  api: API;
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  basementGuardianAccessories: Map<string, BasementGuardianAccessory>;
  registry: FamilyRegistry;
  log: Logging;
}

function basementGuardianAccessoryFor(context: DiscoveryContext, uuid: string, accessory: BasementGuardianPlatformAccessory): BasementGuardianAccessory {
  const existing = context.basementGuardianAccessories.get(uuid);

  if (existing !== undefined) {
    return existing;
  }

  const created = createBasementGuardianAccessory({ accessory, hap: context.api.hap, registry: context.registry, log: context.log });
  context.basementGuardianAccessories.set(uuid, created);

  return created;
}
```

**The `updatePlatformAccessories` guard** (lines 130-135) is the precedent for "call it only when the
set actually changed", which the phase needs when a service is added or removed:

```typescript
  // A context mutation Homebridge does not know about is invisible on disk
  // until the next full register/unregister cycle, so only a real change
  // earns the call rather than persisting an identical value on every poll.
  if (!isDeepStrictEqual(previousState, nextState)) {
    context.api.updatePlatformAccessories([accessory]);
  }
```

---

### `features/support/fakeHomebridgeApi.ts` (modified — must be extended first)

**Analog:** itself. Its current shape, which cannot express this phase (lines 26-42 and 161-180):

```typescript
/** A minimal, hand-built stand-in for a HAP `Service`. */
export interface FakeService {
  readonly UUID: string;
  readonly subtype: string | undefined;
  setCharacteristic(identifier: FakeIdentifier, value: unknown): FakeService;
  getCharacteristic(identifier: FakeIdentifier): unknown;
}

export interface FakeAccessory {
  displayName: string;
  readonly UUID: string;
  readonly context: Record<string, unknown>;
  getService(identifier: FakeIdentifier): FakeService | undefined;
  getServiceById(identifier: FakeIdentifier, subtype: string): FakeService | undefined;
  addService(identifier: FakeIdentifier, subtype?: string): FakeService;
}
```

```typescript
  addService(identifier: FakeIdentifier, subtype?: string): FakeService {
    const collision = subtype === undefined && this.services.some((service) => service.UUID === identifier.UUID);

    if (collision) {
      throw new Error(`Cannot add a Service with the same UUID '${identifier.UUID}' without also defining a unique 'subtype' property.`);
    }

    const service = new HarnessService(identifier, subtype);
    this.services.push(service);

    return service;
  }
```

Gaps to close before any scenario depends on it: the two-argument `addService` must become
`addService(identifier, displayName?, subtype?)`; `FakeService` needs `updateCharacteristic`,
`testCharacteristic`, `addOptionalCharacteristic`, and `optionalCharacteristics`; `FakeAccessory`
needs `removeService`. Keep the hand-built approach and the `@fileoverview` rationale at lines 1-10 —
the file's whole point is that it is not the real HAP. The duplicate-throw message above is copied
from real HAP wording; extend it with the same-UUID-*and*-subtype variant.

Also extend the fake `hap` namespace object (lines 100-120), which currently carries only
`AccessoryInformation` and six characteristics. The `FakeIdentifier` constants at lines 87-94 are the
row shape to add to.

---

### Test files (new and modified)

**Data-driven case analog** — `test/config.test.ts:164-185`. Use this for the D-01 ladder rows, the
D-07 `StatusLowBattery` sources, the D-08 battery bands, and the D-17 refusal rows. One `test()` per
row, never a loop inside one case:

```typescript
for (const pollInterval of [300, 900, 3600]) {
  test(`CONF-05 accepts a poll interval of ${String(pollInterval)}`, () => {
    // act
    const configResult = validateConfig(accountConfig({ pollInterval }));

    // assert
    assert.deepStrictEqual(configResult, acceptedConfig({ pollIntervalSeconds: pollInterval }));
  });
}

for (const pollInterval of [299, 3601, 3.5, '900', null]) {
  test(`CONF-05 refuses a poll interval of ${JSON.stringify(pollInterval)}`, () => {
    // arrange
    const expectedRefusal: ConfigRefused = { ok: false, reason: `${POLL_INTERVAL_REFUSAL} ${String(pollInterval)}.` };

    // act
    const configResult = validateConfig(accountConfig({ pollInterval }));

    // assert
    assert.deepStrictEqual(configResult, expectedRefusal);
  });
}
```

**Type-only test analog** — `test/accessories/services.test.ts` (whole file). `services.ts` gains
`'primary-pump-running'` (D-13); its test grows one positive `satisfies` and keeps the existing
`@ts-expect-error` negatives:

```typescript
void ('sump-pit-flood' satisfies CoreServiceKind);
void ({ kind: 'sump-pit-flood', subtype: 'sump-pit-flood', name: 'Sump Pit Flood' } satisfies ServiceDescriptor);

// @ts-expect-error a removable notification sensor is not a truthful service
void ('mains-power-lost' satisfies CoreServiceKind);
// @ts-expect-error a truthful service cannot be removed, so it is not a notification adapter
void ('sump-pit-level' satisfies NotificationServiceKind);
```

**Schema key-set test to extend** — `test/configSchema.test.ts:131-140`. This is the D-18 "prove no
alert-delay setting exists" gate; it is already a whole-key-set `deepStrictEqual`, so adding
`ignoredFaults` to `expectedFields` keeps it exhaustive. The `SettingsFormFields` interface at lines
21-29 (comment: "The six fields the settings form offers, and no others") must gain the field too:

```typescript
test('CONF-04 exposes no vendor protocol constant other than the client identifier', () => {
  // arrange
  const expectedFields = ['name', 'email', 'password', 'clientId', 'pollInterval', 'offlineConfirmationPollCount'];

  // act
  const settingsSchema = readSettingsSchema();

  // assert
  assert.deepStrictEqual(Object.keys(settingsSchema.schema.properties), expectedFields);
});
```

**Fake-timer / clock test analog** — `test/runtime/clock.test.ts` (quoted in full under
`src/runtime/timers.ts` above). Note it uses `t.mock.timers.enable({ apis: [...] })` from the test
context, never the process-wide `mock`.

---

### Cucumber scenarios

**Feature analog:** `features/degradedOperation.feature`. Note the `Background` block, the
`Given the fake cloud` / `Given these gemini devices:` / `Given the shadow credentials` opening, the
lower-case steps, no `And`, and sentence-case scenario titles:

```gherkin
  Background:
    Given the fake cloud
    Given these gemini devices:
      | deviceId                             | name        |
      | placeholder-account_placeholder-pump | Sump System |
    Given the shadow credentials

  Scenario: The plugin keeps polling while the shadow connection is unavailable
    Given a short poll interval
    Given the broker refuses connections
    When the plugin starts
    Then the monitoring path is "poll-only"
    When the vendor changes these device fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
```

**Step-definition analog:** `features/support/steps/shadow.ts:169-173` — the named-function-then-bind
form, and the exact seam D-18's "advance by zero" step reuses:

```typescript
function advanceTheScenarioClock(this: BasementGuardianWorld): void {
  this.advanceClock(CLOCK_STEP_MS);
}

When('the scenario clock moves forward', advanceTheScenarioClock);
```

`features/support/world.ts:206-209` is the world method it calls:

```typescript
  /** Moves the scenario clock forward. */
  advanceClock(milliseconds: number): void {
    this.scenarioTime += milliseconds;
  }
```

`features/CLAUDE.md` orders step definitions `Given()`, `When()`, `Then()` within a module and groups
them by function rather than by feature file. The `When the vendor changes these device fields:` step
already exists in `features/support/steps/shadow.ts` and drives every telemetry transition this phase
needs; the new steps are `Then`-side service assertions and belong in a new module.

## Shared Patterns

### Module header

**Source:** `src/accessories/basementGuardian.ts:1-21`, `src/device/family.ts:1-15`.
**Apply to:** every new source module.

Each `@fileoverview` states what the module owns, then the safety rule that constrains it, with
decision IDs inline (`D-014`, `DEV-08`, `D-003`). It never mentions phases or plans. Where a module is
declaration-only it says so and names its `.fallowrc.json` `ignoreFindings` entry — remove that
sentence from `src/accessories/services.ts:14-16` when this phase gives it a production consumer.

### Injected options object

**Source:** `src/accessories/basementGuardian.ts:55-61`, `src/accessories/reconciliation.ts:42-46`,
`src/device/registry.ts`.
**Apply to:** every new factory.

```typescript
/** Everything the reconciliation state machine needs, by injection. */
export interface ReconciliationOptions {
  clock: Clock;
  log: Logging;
}

export function createReconciliation(options: ReconciliationOptions): Reconciliation {
  const absenceCounts = new Map<string, number>();

  return {
    observe(deviceIds: readonly string[]): readonly string[] { ... },
    forget(deviceId: string): void { ... },
  };
}
```

The JSDoc convention on the factory is worth copying too: "Creating it touches nothing outside itself:
no HTTP call, no timer, no accessory." That is the same claim `SAFE-07` needs to make.

### Consecutive-count confirmation (D-09)

**Source:** `src/accessories/reconciliation.ts:20-21, 48-60, 72-96`.
**Apply to:** the offline-confirmation counter.

This is the same state machine with a different threshold source: a named threshold constant, a
`nextCount` helper, an `isConfirmed` predicate, `Map`-held counts, and a reset on the positive
observation.

```typescript
/** How many consecutive trustworthy responses must omit a deviceId before it counts as confirmed absent (D-029). */
const CONFIRMATION_THRESHOLD = 2;

function nextAbsenceCount(previousCount: number): number {
  return previousCount + 1;
}

function isConfirmedAbsent(count: number): boolean {
  return count >= CONFIRMATION_THRESHOLD;
}
```

The difference: `offlineConfirmationPollCount` is configured, so the threshold arrives through the
options object rather than as a module constant.

### Trust-scope types

**Source:** `src/device/health.ts:25-43`.
**Apply to:** the D-04 field map, the D-11 poison set, and every `StatusActive` decision.

```typescript
/** The parts of a device's state that can lose trust on their own. */
export type TrustScope = 'connectivity' | 'water' | 'pump' | 'power' | 'battery' | 'fault';

export type DistrustReason = 'stale' | 'unreachable' | 'invalid' | 'controller-link-lost';

/** One scope the plugin can no longer vouch for, and why. */
export interface UntrustedScope {
  scope: TrustScope;
  reason: DistrustReason;
  /** Local time the scope last carried a value the plugin still trusts. */
  lastTrustedAt: number | undefined;
}
```

Both reasons D-04 and D-11 need already exist; `lastTrustedAt` is what `RES-02` publishes. No new
member is required unless planning finds one.

### Log-once on a sustained condition

**Source:** `src/accessories/basementGuardian.ts:155,189-195`; `src/accessories/reconciliation.ts:91`.
**Apply to:** the D-05 degradation warning and the D-11 controller-link warning.

A closure-held boolean gates the `log.warn`, and the message names the `deviceId` and says what
happens to the retained values. `log.debug` is the level for routine state-machine transitions.

## No Analog Found

None. Every file this phase creates has a same-role, same-data-flow analog in tracked source. The one
area with no in-repo precedent is the HAP subclass body itself (`extends hap.Service`,
`addOptionalCharacteristic`, custom UUID literals) — the codebase has never declared one. For that
*body only*, use `03-RESEARCH.md` § Architecture Patterns 2 and 3, which were verified against the
pinned typings by executable probe. The surrounding factory, options interface, and module header
still come from `src/accessories/basementGuardian.ts`.

## Notes for the planner

- `.fallowrc.json` is edited by at most one plan (`ignoreFindings` loses
  `src/accessories/services.ts`; `src/device/health.ts` only if every declaration gains a consumer).
  Put that plan alone in its wave.
- `features/support/fakeHomebridgeApi.ts` must be extended before any scenario plan depends on it.
- The service catalogue being table-driven is a `npm run check` correctness constraint, not a
  preference: `fallow dupes` is at a zero baseline and the gate is `--fail-on-issues`.

## Metadata

**Analog search scope:** `src/`, `test/`, `features/`, `.claude/rules/`, repository-root config.
**Files scanned:** 84 tracked files listed; 14 read in full or in targeted ranges.
**Pattern extraction date:** 2026-08-30
