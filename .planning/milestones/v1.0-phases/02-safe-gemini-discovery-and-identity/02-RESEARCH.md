# Phase 2: Safe Gemini Discovery and Identity - Research

**Researched:** 2026-08-29
**Domain:** Homebridge dynamic-platform accessory lifecycle, HAP-NodeJS `AccessoryInformation`/service identity, and a family-adapter validation registry
**Confidence:** HIGH for HAP-NodeJS/Homebridge mechanics (verified against pinned typings and compiled source in `node_modules`); MEDIUM for reconciliation/rename architecture (no existing code to read, some choices are genuinely open); LOW/ASSUMED flagged explicitly where training knowledge fills a gap the codebase and docs do not settle.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Identity and privacy — `deviceId` is not sensitive

The vendor `deviceId` has the shape `<account-id>_<serial-number>`, so it embeds the account
identifier. The Phase 1 security audit recorded this as a collision between the Identity
constraint and the Privacy constraint, because `src/persistence/accessoryContext.ts` declares
`deviceId` while its own fileoverview promises the record holds no account identifier.

**Decision (user, 2026-08-29): treat `deviceId` as non-sensitive.** It may be stored in
`accessory.context` and written to logs. The audit finding closes as a documentation fix.

- Correct the `accessoryContext.ts` fileoverview so it no longer claims the record holds no
  account identifier. The promise, not the field, was wrong.
- `D-027` still governs **public artifacts** — fixtures, committed samples, issue reports, and
  anything published. Those keep placeholders. The change is to runtime logs and on-disk
  accessory context only.
- **Caveat to confirm:** this rests on `<account-id>` being an opaque vendor key rather than an
  email address. No captured inventory response exists in the repository; every value in `test/`
  and `features/` is a placeholder such as `account-1_serial-1`. Two indirect signals support the
  assumption — `.planning/intel/decisions.md:623` lists "account IDs" and "emails" as separate
  redaction targets, and `.planning/intel/constraints.md:143` says the AWS IoT thing name equals
  the `deviceId`. Revisit if a real response shows an email.

`DEV-07` is unaffected: `deviceId` still never becomes a **user-visible** value in HomeKit.
Not user-visible and not sensitive are different claims, and only the second one changed.

#### Inventory reconciliation and removal

`DEV-05` and `D-029` describe absence from the account inventory. They do not describe a device
that goes offline. The three conditions stay separate:

| Condition | Requirement | Behavior |
|---|---|---|
| `connectivity.connected === false` | RES-03, RES-01 | Accessory stays, marked. Phase 5. |
| Payload or profile stops validating | DEV-08 | Accessory stays, degraded in place. Never unregistered for that reason. |
| Device absent from the inventory list | DEV-05, D-029 | Removed after confirmation. This phase. |

An offline pump still appears in the inventory with `connected: false`, so it never reaches the
removal path.

**Decision (user, 2026-08-29): a valid empty device list counts toward removal.** An HTTP 200
response carrying a schema-valid but empty list is a legitimate answer — the user removed their
last device — and it counts as one of the two consecutive confirmations. This keeps `D-029`
exactly as locked: only *failed* inventories never count.

The accepted risk is that a vendor account glitch returning an empty list could remove every
accessory. Three things bound it, and the plan must preserve all three:

1. Two consecutive confirmations are required, not one.
2. `D-029` additionally requires a final current-inventory check before the removal commits.
3. At the default 900-second poll from `CONF-05`, that is roughly 30 minutes of sustained
   emptiness, not a transient blip.

Rename the concept in code and documentation. "Healthy inventory" reads as a statement about the
device. It is a statement about the response. Use "trustworthy inventory response" or similar.
A trustworthy response is HTTP 200 with a schema-valid envelope. Transport failures, non-2xx
statuses, and shape violations are not trustworthy and never count.

Confirmed removal ends the observation epoch under `D-020`. A later return starts a new epoch.

#### Family adapter registry — build the full descriptor

`D-003` keeps authentication, transports, state, lifecycle, and reconciliation family-neutral, and
gives each adapter its own validation, decoding, capabilities, services, and commands. Phase 1
already laid the seam in `src/device/family.ts`: `DeviceFamily<TDomainState>`, `DeviceCapability`,
`FamilyValidation`, `FieldViolation`, and `FamilyCommand` exist, with `src/device/gemini.ts` and
`src/device/halo.ts` as the two family modules.

**Decision (user, 2026-08-29): build the full capability-descriptor registry**, as `DEV-02`
words it, rather than a minimal interface plus a lookup map. Capabilities, services, and command
construction are declared per family. Gemini is the only complete implementation in this
milestone; HALO stays deferred to v2 and resolves as an explained, unpublished profile under
`D-002`.

The registry is keyed by `deviceTypeId`. A `deviceTypeId` the registry does not know is an
unknown profile, distinct from HALO, and both are distinct from a valid Gemini. `DEV-01` requires
each of the three to produce its own explanation, and neither non-Gemini case may block
publication of valid Gemini devices in the same inventory.

#### Degradation presentation — inactive, not faulty

`DEV-08` permits "inactive or faulty" and `D-014` permits "faulty/inactive". The user asked for
this to be settled in Phase 2 rather than deferred to Phase 3.

**Decision: set `StatusActive` to false on the affected services. Leave `StatusFault` at
`NO_FAULT`.**

Verified against the pinned typings in
`node_modules/@homebridge/hap-nodejs/dist/lib/definitions/CharacteristicDefinitions.d.ts`:
`StatusActive` is a plain boolean characteristic, and `StatusFault` carries `NO_FAULT = 0` and
`GENERAL_FAULT = 1`.

Rationale — the two characteristics make different claims:

- `StatusActive = false` says *this service is not currently supplying a value the plugin can
  vouch for*. That is exactly true in both `DEV-08` triggers.
- `StatusFault = GENERAL_FAULT` says *the device has a fault*. In both triggers the device may be
  working perfectly; the plugin cannot interpret what it sent. Asserting a device fault would
  invent unsupported meaning, which the project's core value forbids.

`SAFE-04` reserves fault signalling for five vendor-reported conditions — primary pump, backup
pump and fuse, water sensor, controller-link, and confirmed offline. A plugin-side interpretation
failure must never light one of those, because that would be a false alarm about the hardware.

Last family-valid values are retained under `D-014`. Do **not** surface degradation by throwing
`HapStatusError` or returning an error from the characteristic getter. That produces Apple Home's
"No Response", which erases the retained values that `DEV-08` requires the accessory to keep.

**Recorded concern for Phase 3:** Apple Home does not render `StatusActive = false` prominently
for every service type, so a degraded accessory may look ordinary in the UI. The core value asks
for stale or invalid telemetry to be *clearly marked*. The fix is not to mislabel a device fault.
Phase 3 should decide how visibility is achieved within `SAFE-04`, which forbids an aggregate
System Fault adapter.

#### Log cadence for non-Gemini profiles

Not user-specified; decided here. Log an unsupported or unknown profile **once per device per
plugin run**, and log again when that device's `deviceTypeId` changes. `DEV-08` already requires
log-once for a published accessory that degrades. Repeating an explanation on every 900-second
poll would bury real events without adding information.

### Claude's Discretion

- Module layout for the registry, and whether it lives beside `src/device/family.ts` or in its own file.
- The exact typed shape of the degradation state and how it names the affected `TrustScope`.
- Whether `DistrustReason` in `src/device/health.ts` gains a member for the unsupported-profile
  case or reuses `invalid`. The four current members are `stale`, `unreachable`, `invalid`, and
  `controller-link-lost`.
- Internal naming for the trustworthy-inventory predicate and the removal state machine.
- How `AccessoryInformation` sources `FirmwareRevision` when `mcu_firmware_version` and
  `wifi_firmware_version` disagree, provided the choice is truthful and documented.
- Whether `wifi_signal_dbm` has a semantically correct HAP representation at all. `DEV-07` says
  expose it read-only *where* one exists, so concluding that none exists is a valid outcome.

### Deferred Ideas (OUT OF SCOPE)

- HALO adapter implementation — v2.
- Visibility of degraded accessories in Apple Home — Phase 3, recorded above.
- Whether `battery_health == 32` earns a sixth fault adapter — Phase 3 discussion.
- Confirming the `<account-id>` format against a real inventory response — pairs naturally with
  the three outstanding Phase 1 UAT items.

### Canonical References

Locked product decisions governing this phase: `D-002` (Gemini-only v1), `D-003` (additive family
boundary), `C-002` (physical identity is not profile identity), `D-014` (preserve untrusted
state), `D-020` (counter lifecycle), `D-027` (sanitized public artifacts), `D-029` (confirm
removal), `D-030` (preserve custom names). Full text quoted where each is used throughout this
document. Requirements: `DEV-01` through `DEV-08` in `.planning/REQUIREMENTS.md:32-39`.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| DEV-01 | Every valid `wayneWaterGemini` is supported; HALO and unknown profiles produce clear distinct explanations, remain unpublished when new, and do not block valid Gemini devices. | Pattern 1 (three-way registry outcome); Pitfall "`implemented: false` HALO adapters accidentally decoded"; Architectural Responsibility Map row 1. |
| DEV-02 | A stable family-adapter registry owns validation, decoding, capabilities, services, and command construction so future families can be added without changing account-wide infrastructure. | Pattern 1; Standard Stack "Alternatives Considered" (registry vs. switch statement); reuses `src/device/family.ts` unchanged. |
| DEV-03 | Strict Gemini identity, required-field, type, and legal-value validation prevents a mismatched or changed payload from becoming plausible but incorrect HomeKit state. | Architectural Responsibility Map row 2; Security Domain V5 row; existing `isWireDevice`-style predicate pattern in `src/cloud/types.ts` as the model to follow. |
| DEV-04 | One physical system produces one multi-service accessory whose UUID derives only from immutable `deviceId`; a `deviceTypeId` change selects an adapter without creating or unregistering the physical identity. | Pattern 3 (identity/discovery); verified `uuid.generate` signature; Anti-Pattern "seeding the UUID from a mutable field." |
| DEV-05 | A cached accessory is removed only after two consecutive successful healthy (trustworthy) inventories omit it and a final current-inventory check confirms absence; confirmed removal ends its observation epoch. | Pattern 3 removal half; Open Question 1; Pitfall "Empty-inventory removal risk understated"; Assumption A1, A4. |
| DEV-06 | A vendor rename updates the accessory only while the HomeKit name still matches the prior vendor name, preserving user-customized names and stable functional service names/subtypes. | Pattern 4 (vendor-rename adoption); `.planning/intel/decisions.md:661-675` D-030 mechanism quoted verbatim. |
| DEV-07 | The accessory publishes a populated `AccessoryInformation` service sourced only from validated vendor identity and metadata fields; `deviceId` never becomes user-visible. | Pattern 2 (service already exists, never `addService`); Open Question 2 (Manufacturer/Model); Assumption A2, A3 (`wifi_signal_dbm`). |
| DEV-08 | A published accessory whose profile/payload stops validating keeps identity and last valid values, marks services inactive, disables commands, logs once, and resumes on fresh valid state. | Pattern 5 (degrade-in-place, `StatusActive`/`StatusFault`); verified `CharacteristicDefinitions.d.ts` excerpt; Anti-Pattern "throwing `HapStatusError`." |

</phase_requirements>

## Summary

Phase 2 turns the Phase 1 account runtime — which already merges REST snapshots and shadow
patches into one `DeviceStateStore` — into published HomeKit accessories with an identity that
survives restarts, renames, and profile changes. Nothing in `src/accessories/`,
`src/device/family.ts`, `src/device/gemini.ts`, `src/device/halo.ts`, or
`src/persistence/accessoryContext.ts` has a production consumer yet; every one of those modules is
declared complete but wired to nothing (`.fallowrc.json` lists all five as `ignoreFindings`
because the dead-code gate would otherwise fail the build). Phase 2 is the first phase that writes
real logic behind those declarations.

Four architecturally distinct problems live inside this phase, and they compose rather than
layer: (1) a `deviceTypeId`-keyed family registry that turns "list of vendor devices" into
"validated-or-explained" (`DEV-01`, `DEV-02`, `DEV-03`); (2) accessory identity seeded from the
immutable `deviceId`, published once and never re-seeded by a `deviceTypeId` or name change
(`DEV-04`); (3) a two-consecutive-confirmation removal state machine that is genuinely new code —
`DeviceStateStore` currently has no removal method and no historical memory of "who used to be
here" (`DEV-05`); and (4) two data-preservation problems that both write into
`accessory.context` — vendor-rename adoption (`DEV-06`) and degrade-in-place (`DEV-08`) — plus the
truthful, standards-only `AccessoryInformation` population (`DEV-07`).

The single highest-value fact this research surfaces is verified directly from the pinned
`@homebridge/hap-nodejs@2.2.2` source: **every `PlatformAccessory` already has an
`AccessoryInformation` service** added in its own constructor, with `Identify` already wired to
the accessory's `identify` event and `Name` already set to `displayName`. `DEV-07`'s
implementation must call `accessory.getService(...)`, never `accessory.addService(...)`, on that
service — `addService` throws when a same-UUID, no-subtype service already exists, and one always
does.

**Primary recommendation:** Build the registry as the full capability-descriptor object `DEV-02`
specifies (per the locked decision), key it by `deviceTypeId`, and keep the "device present but
absent from inventory" state machine (`DEV-05`) as account-runtime-level, family-neutral logic
(per `D-003`) that composes with, but is not owned by, any family adapter. Populate
`AccessoryInformation` by fetching the already-existing service, never adding a second one.
Represent DEV-08 degradation as data flowing through the same `DeviceHealth`/`TrustScope`
machinery Phase 1 already declared in `src/device/health.ts`, not as a parallel state shape.

## Architectural Responsibility Map

This is a single-process Homebridge plugin, not a client/server web application, so the
standard browser/CDN/database tiers do not apply. The table below uses this codebase's actual
architectural layers instead, which is the substitution the tier-mapping step exists to produce
when the standard tiers are a poor fit.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Family detection & explanation (`DEV-01`) | Family Registry (`src/device/*`) | Account Runtime | The registry decides Gemini/HALO/unknown; the account runtime (or the layer composing it) owns *when* that decision runs (every discovery) and that it never blocks other devices. |
| Payload/field/domain validation (`DEV-03`) | Family Adapter (`DeviceFamily.validate`) | — | `D-003` locks validation inside the adapter that knows the field meanings; the registry and account runtime stay ignorant of field shapes. |
| Accessory identity & UUID seeding (`DEV-04`) | Accessory/HomeKit Publishing (`src/platform.ts`, `src/accessories/*`) | Persistence | Only the platform composition root touches `api.hap.uuid.generate` and the `accessories` cache Map; the accessory module answers "what services," not "what UUID." |
| Absence/removal reconciliation (`DEV-05`) | Account Runtime (family-neutral, per `D-003`) | Accessory/HomeKit Publishing | Presence tracking needs the *full* discovered device-ID set on every poll — information the account runtime already receives — while the actual `unregisterPlatformAccessories` call needs the Homebridge `api`, which the account runtime does not hold today. This is a two-sided integration point; see Pattern 3 below. |
| Vendor-rename adoption (`DEV-06`) | Persistence (`accessory.context`) | Accessory/HomeKit Publishing | The comparison needs a stored "last known vendor name," which only `accessory.context` can hold; applying the result touches `accessory.displayName` and the HAP `Name`/`ConfiguredName` characteristics. |
| `AccessoryInformation` population (`DEV-07`) | Accessory/HomeKit Publishing | Family Adapter | The HAP service lives on the accessory; the *values* it publishes are validated identity/metadata fields the family adapter already decoded. |
| Degrade-in-place (`DEV-08`) | Accessory/HomeKit Publishing | Family Adapter, Persistence | The accessory sets `StatusActive`/`StatusFault`; the family adapter is what stopped validating; the last-valid values that must survive live in whatever persists across the failed decode (in-memory canonical state, not `accessory.context`, per the existing `D-014` "preserve untrusted state" pattern in `src/device/state.ts`). |

## Standard Stack

### Core

No new external package is required for this phase. Every capability above is built on
`@homebridge/hap-nodejs` (a transitive dependency of the pinned `homebridge@2.4.0` devDependency,
already in `node_modules`, consumed only through `api.hap` per the project's runtime constraint)
and on the `DeviceFamily<TDomainState>` / `DeviceHealth` seams Phase 1 already declared.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@homebridge/hap-nodejs` (via `api.hap`, never imported directly) | `2.2.2` [VERIFIED: `node_modules/@homebridge/hap-nodejs/package.json`] | `Service`, `Characteristic`, `uuid.generate`, `HapStatusError`, `HAPStatus` | The only HAP implementation Homebridge ships; the project constraint already forbids a direct import, so every reference in this document assumes `this.api.hap.*`. |
| `homebridge` | `2.4.0` [VERIFIED: `node_modules/homebridge/package.json`] | `DynamicPlatformPlugin`, `PlatformAccessory`, `API.register/update/unregisterPlatformAccessories` | Already the pinned devDependency; `REL-01` requires validating against `^1.8.0 \|\| ^2.0.0`, and 2.4.0 is the currently installed 2.x baseline this research verified typings against. |

### Supporting

No supporting packages. `src/persistence/accessoryContext.ts` is a plain TypeScript interface —
Homebridge itself serializes `accessory.context` to `cachedAccessories.json`; the plugin never
touches a file directly (per `AccessoryContext`'s own fileoverview and the `AUTH-02`/persistence
constraint already governing `src/runtime/accountRuntime.ts`'s token cache).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A `Map<string, DeviceFamily<unknown>>` registry keyed by `deviceTypeId` | A `switch` statement over `deviceTypeId` in `platform.ts` | The switch is simpler for two families but violates `DEV-02`'s explicit requirement that "future families can be added without changing account-wide infrastructure" — a switch statement *is* account-wide infrastructure that must change per family. |
| In-memory absence-counter for `DEV-05` | Persisting the pending-absence count in `accessory.context` | Persisting survives a plugin restart mid-confirmation, but nothing in `D-029`/`D-020` requires that durability, and a restart already re-runs the two-poll window from zero at low cost (worst case ~30 min at the default interval, matching `CONF-05`'s own math). Flagged as `[ASSUMED]` below — confirm with the user if a restart-proof counter is actually wanted. |

**Installation:** None. No `npm install` step for this phase.

## Package Legitimacy Audit

Not applicable — this phase installs no new packages. `@homebridge/hap-nodejs` and `homebridge`
are pre-existing, already-audited devDependencies from Phase 1's package.json; nothing new enters
`package.json` or `package-lock.json`.

## Architecture Patterns

### System Architecture Diagram

```text
 REST poll (Phase 1, every ~900s)          Shadow patches (Phase 1, push)
        │                                          │
        ▼                                          ▼
 ┌──────────────────────── DeviceStateStore (src/device/state.ts) ───────────────────────┐
 │ snapshot(deviceId) -> DeviceSnapshot { identity, connectivity, data, metadata }        │
 │ deviceIds() -> readonly string[]           <- current known set only, never absentees  │
 └───────────────────────────────────┬────────────────────────────────────────────────────┘
                                      │ discovered device IDs, every successful poll
                                      ▼
                     ┌─────────────────────────────────────┐
                     │  Family Registry (DEV-01, DEV-02)    │
                     │  deviceTypeId -> DeviceFamily | HALO │
                     │              | unknown               │
                     └───────────────────┬───────────────────┘
                      valid Gemini       │        HALO / unknown / invalid
                      + validate() ok    │        (log once, no accessory,
                                         │         does not block other devices)
                                         ▼
                     ┌─────────────────────────────────────┐
                     │  Accessory Registry / Reconciliation │
                     │  (DEV-04 identity, DEV-05 removal,   │
                     │   DEV-06 rename, DEV-08 degrade)     │
                     │  - api.hap.uuid.generate(deviceId)   │
                     │  - accessories Map (from             │
                     │    configureAccessory, pre-existing) │
                     │  - register / update / unregister    │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌─────────────────────────────────────┐
                     │  BasementGuardianAccessory           │
                     │  (src/accessories/basementGuardian)  │
                     │  - AccessoryInformation (DEV-07)     │
                     │  - update(snapshot) pushes            │
                     │    characteristics                    │
                     └─────────────────────────────────────┘
                                         │
                                         ▼
                              accessory.context
                     (AccessoryContext: deviceId, deviceTypeId,
                      serialNumber, pump observations, watermarks,
                      + DEV-06's stored vendor name)
```

### Recommended Project Structure

```
src/
├── device/
│   ├── family.ts          # existing seam — unchanged
│   ├── gemini.ts           # existing identity — gains the DeviceFamily<GeminiState> implementation
│   ├── halo.ts              # existing identity — stays identity-only per D-002 (v2 defers HALO)
│   ├── registry.ts          # NEW — deviceTypeId -> DeviceFamily lookup, three-way outcome
│   └── health.ts            # existing — DEV-08 composes into UntrustedScope/DistrustReason
├── accessories/
│   ├── basementGuardian.ts  # existing declaration — gains the accessory factory + AccessoryInformation
│   ├── services.ts          # existing declaration — unchanged this phase (no CoreServiceKind beyond identity yet)
│   └── reconciliation.ts    # NEW (name is Claude's discretion) — DEV-05 absence tracking + removal
└── persistence/
    └── accessoryContext.ts  # existing declaration — gains a lastVendorName-shaped field for DEV-06
```

### Pattern 1: Family registry with a three-way outcome

**What:** A `deviceTypeId`-keyed lookup that returns exactly one of: a known, implemented adapter
(`DeviceFamily<T>` with `implemented: true`); a known-but-unsupported profile (HALO, `implemented:
false`); or a registry miss (an unknown `deviceTypeId` never seen before). `DEV-01` requires all
three to log distinctly and none to block the others.

**When to use:** Every discovery pass, once per device, before any decode is attempted.

**Example (illustrative; module layout is Claude's discretion per `02-CONTEXT.md`):**
```typescript
// src/device/registry.ts — illustrative sketch, not verified against a real implementation
import type { DeviceFamily } from './family.js';
import type { GeminiDeviceTypeId } from './gemini.js';
import type { HaloDeviceTypeId } from './halo.js';

export type FamilyOutcome<T> =
  | { kind: 'implemented'; family: DeviceFamily<T> }
  | { kind: 'unsupported'; deviceTypeId: HaloDeviceTypeId; displayName: string }
  | { kind: 'unknown'; deviceTypeId: string };

// A `Map<string, DeviceFamily<unknown> | UnsupportedProfile>` populated at module load,
// not a switch statement — DEV-02 requires new families to add without touching callers.
```

The existing `DeviceFamily.implemented: boolean` field (already declared in `src/device/family.ts`)
is exactly the seam that separates "known but unsupported" (HALO) from "never heard of"
(unknown `deviceTypeId`) — a registry miss on the `Map` itself is the third case. Nothing new needs
adding to `family.ts` for this; the registry is purely a lookup structure over the existing type.

### Pattern 2: `AccessoryInformation` is already present — never `addService` it again

**What:** Every `Accessory`/`PlatformAccessory` constructor already adds an `AccessoryInformation`
service and sets its `Name` and `Identify` handler.

**Verified, not assumed** — read directly from the compiled, pinned source:

```javascript
// Source: node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js:229-251
constructor(displayName, UUID) {
    super();
    this.displayName = displayName;
    this.UUID = UUID;
    // ...
    this.controllerStorage = new ControllerStorage_1.ControllerStorage(this);
    // create our initial "Accessory Information" Service that all Accessories are expected to have
    (0, checkName_1.checkName)(this.displayName, "Name", displayName);
    this.addService(Service_1.Service.AccessoryInformation)
        .setCharacteristic(Characteristic_1.Characteristic.Name, displayName);
    // sign up for when iOS attempts to "set" the `Identify` characteristic ...
    this.getService(Service_1.Service.AccessoryInformation)
        .getCharacteristic(Characteristic_1.Characteristic.Identify)
        .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => { /* ... */ });
}
```

And `addService` on a same-UUID, subtype-less service throws:

```javascript
// Source: node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js:272-279
for (const existing of this.services) {
    if (existing.UUID === service.UUID) {
        if (!service.subtype) {
            throw new Error("Cannot add a Service with the same UUID '" + existing.UUID +
                "' as another Service in this Accessory without also defining a unique 'subtype' property.");
        }
        // ...
    }
}
```

**When to use:** `DEV-07`'s implementation must retrieve the service with
`accessory.getService(this.api.hap.Service.AccessoryInformation)` (never `undefined` — it always
exists) and call `.setCharacteristic(...)` / `.updateCharacteristic(...)` on it, exactly the
pattern the homebridge-plugin-template uses for `Manufacturer`/`Model`/`SerialNumber`.

### Pattern 3: Identity, discovery, and reconciliation (verified project intel + template pattern)

**What:** Seed the UUID from `deviceId` only; look the accessory up in the `configureAccessory`-
populated cache before deciding whether to register or update; unregister only on confirmed
absence.

`src/platform.ts` already implements the `configureAccessory` half of this (storing every
restored accessory into `this.accessories`, keyed by UUID, *before* `didFinishLaunching` fires —
Homebridge's own contract). `DEV-04`'s missing half is the `didFinishLaunching`-time discovery
loop:

```typescript
// Source: .planning/intel/context.md:1035-1049 — project intel captured from Homebridge's own
// dynamic-platform documentation and cross-checked against the plugin template; not re-verified
// against upstream this session, so treated as [CITED] rather than [VERIFIED].
const uuid = this.api.hap.uuid.generate(device.deviceId) // deviceId only — never the mutable name
const existing = this.accessories.get(uuid)              // this.accessories is a Map in this codebase

if (existing) {
  existing.context.device = device
  this.api.updatePlatformAccessories([existing])   // context changes need this call to persist
  new BasementGuardianAccessory(this, existing)
} else {
  const accessory = new this.api.platformAccessory(device.name, uuid)
  accessory.context.device = device
  new BasementGuardianAccessory(this, accessory)
  this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
}
```

This matches [CITED: developers.homebridge.io — `DynamicPlatformPlugin`] general guidance
("accessories must only be registered once; previously created accessories must not be registered
again to prevent 'duplicate UUID' errors") and the homebridge-plugin-template's own
`discoverDevices()` shape.

**`DEV-05`'s removal half is new code, not a documented recipe.** `DeviceStateStore.deviceIds()`
only ever reports the *current* successful discovery's device IDs — it has no memory of who used
to be present, so nothing today can answer "was this device missing from the last two polls."
Whoever implements `DEV-05` must:

1. Receive the full discovered ID list on every *trustworthy* inventory response (HTTP 200,
   schema-valid — including a valid empty list, per the locked Phase 2 decision) — this is
   already the shape `accountRuntime.ts`'s internal `applyDevices(devices)` receives, but nothing
   external observes it today; a new hook or listener is needed.
2. Track, per previously-known `deviceId`, a consecutive-trustworthy-absence counter, incrementing
   only on a trustworthy response that omits the device and resetting to zero the instant a
   trustworthy response includes it again.
3. At count `2`, run **one more current-inventory check** (per `D-029`'s "final current-inventory
   check" requirement) before calling `api.unregisterPlatformAccessories` — this closes the race
   where the device reappeared in the interval between the second confirming poll and the removal
   decision.
4. On confirmed removal: unregister the accessory, drop it from `DeviceStateStore` (a new store
   method — none exists today), and start a fresh observation epoch per `D-020` (which in practice
   means the `AccessoryContext`'s pump observation records for that device are gone with the
   accessory; a later re-discovery of the same `deviceId` creates a brand-new context from
   scratch, which already satisfies "new epoch after confirmed removal or unmigratable data").

### Pattern 4: Vendor-rename adoption (D-030)

**What:** Store the vendor name the plugin last acted on; on every discovery, adopt the new vendor
name only if the accessory's current name still equals that stored value.

```typescript
// Illustrative — exact field name/shape is Claude's discretion
if (accessory.context.lastVendorName === accessory.displayName) {
  // no user customization detected — safe to adopt the new vendor name
  accessory.displayName = device.name;
  accessory.context.lastVendorName = device.name;
  this.api.updatePlatformAccessories([accessory]); // persists both the name and the context change
} else {
  // the HomeKit name diverged from what the plugin last set — treat as a user customization,
  // keep accessory.displayName untouched, but still remember the new vendor name for next time
  accessory.context.lastVendorName = device.name;
  this.api.updatePlatformAccessories([accessory]);
}
```

`AccessoryContext` (`src/persistence/accessoryContext.ts`) does not yet have a field for this —
`DEV-06` requires adding one. `D-030`'s exact mechanism, read from project intel: "The plugin uses
the vendor device name when it creates a HomeKit accessory. It stores that vendor name in the
typed accessory context. If the vendor name changes, the plugin compares the HomeKit name with the
prior vendor name. It applies the new vendor name only when both names match. ... it treats the
HomeKit name as a user customization ... and stores the new vendor name for later comparisons."
[CITED: `.planning/intel/decisions.md:661-675`, itself sourced from `.planning/intel/decisions.md`
per its own `source:` field — a prior-session capture of a locked project decision, not an
external doc].

The functional per-service names ("Primary Pump Running", "Sump Pit Flood", etc. — arriving in
Phase 3) are explicitly **not** touched by this mechanism; `D-030` locks those as stable regardless
of vendor renames.

### Pattern 5: Degrade-in-place without `HapStatusError`

**What:** A published accessory whose payload stops validating keeps its last family-valid values
and sets `StatusActive = false` (never `StatusFault`, per the locked Phase 2 decision) on the
affected services — it never throws from a characteristic getter.

**Verified from pinned typings** (`node_modules/@homebridge/hap-nodejs/dist/lib/definitions/CharacteristicDefinitions.d.ts:1494-1506`):
```typescript
export declare class StatusActive extends Characteristic {
    static readonly UUID: string;
    constructor();
}
export declare class StatusFault extends Characteristic {
    static readonly UUID: string;
    static readonly NO_FAULT = 0;
    static readonly GENERAL_FAULT = 1;
    constructor();
}
```

The reason `HapStatusError` is wrong here (not merely a style preference) is corroborated by two
independent sources: the locked `02-CONTEXT.md` decision, and project intel citing the HAP-NodeJS
wiki directly: "once in a 'No Response' state, the Apple Home app no longer checks for
characteristic updates" [CITED: `.planning/intel/context.md:1113-1119`, itself quoting the
HAP-NodeJS wiki page *Presenting Erroneous Accessory State*]. A characteristic with an `onGet`
handler ignores a pushed error entirely (`updateCharacteristic(c, new Error())` is a silent no-op
when `onGet` exists) — the only way to signal degradation to a getter-backed characteristic is to
have the getter itself return the last-valid cached value while a separate `StatusActive`
characteristic reports `false`.

**Important scope note:** this pattern is for `DEV-08` (a plugin-side interpretation failure —
the payload/profile stopped validating). It does **not** contradict the older intel guidance
recommending `StatusFault = GENERAL_FAULT` for genuine vendor-reported fault conditions
(`serial_communications === false`, pump/sensor fault bits) — those are `SAFE-04`'s five
Apple-Home fault adapters, a Phase 3 concern, and remain a legitimate use of `StatusFault`. The
two are different claims about different things: `DEV-08` is "the plugin cannot interpret what
the device sent," `SAFE-04` is "the device reported a fault." Locked Phase 2 decision text: "In
both triggers the device may be working perfectly; the plugin cannot interpret what it sent.
Asserting a device fault would invent unsupported meaning, which the project's core value
forbids."

### Anti-Patterns to Avoid

- **Seeding the UUID from `device.name` or any mutable field.** `deviceId` is the only immutable
  identifier; `C-002` and `DEV-04` both lock this, and it is independently confirmed at
  `.planning/intel/context.md:1033`, `[CITED]`.
- **Calling `accessory.addService(Service.AccessoryInformation)`.** Throws — see Pattern 2, `[VERIFIED]`.
- **Throwing `HapStatusError` for `DEV-08` degradation.** Produces Apple Home's sticky "No
  Response," which is exactly the erased-last-valid-value outcome `DEV-08` forbids. See Pattern 5.
- **Treating a failed inventory poll as an absence signal for `DEV-05`.** `D-029` is explicit that
  failed inventories never count, and the locked Phase 2 decision renames the healthy/trustworthy
  distinction specifically to prevent this conflation in code and docs.
- **Conflating `CONF-05`'s `offlineConfirmationPollCount` with `DEV-05`'s removal-confirmation
  count.** They are unrelated numbers governing unrelated things: `offlineConfirmationPollCount`
  (1–8, default 2) is `RES-03`'s device-offline-alert threshold, arriving in Phase 5; `DEV-05`'s
  removal count is fixed at exactly two per `D-029`, not configurable, and applies to inventory
  *absence*, not device *offline* connectivity state. `02-CONTEXT.md`'s own table makes clear
  these are three separate conditions.
- **Spreading a raw vendor/wire object into `accessory.context` or a log line.** Every existing
  normalizer in this codebase (`toApiDevice` in `src/cloud/types.ts`) builds its result field by
  field for exactly this reason — the wire record carries eight more keys than the plugin reads,
  including the account identifier. The registry and reconciliation code should follow the same
  discipline for anything reaching persistence or logs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stable per-device UUID | A custom hash or the vendor's own identifiers reformatted | `this.api.hap.uuid.generate(deviceId)` | HAP requires a specific UUID v5-style derivation; hand-rolling risks a collision or an unstable value across plugin versions. |
| Accessory Manufacturer/Model/Serial/Firmware exposure | A custom "device info" service | The pre-existing `AccessoryInformation` service (Pattern 2) | It already exists on every accessory; adding a second one throws. |
| Duplicate-service disambiguation | Ad hoc keys or array indices | HAP `subtype` + `getServiceById` | Multiple same-`kind` services (arriving in Phase 3, but the identity discipline starts now) need a stable subtype string or automations silently detach on restart, per `.planning/intel/context.md:1138-1161`, `[CITED]`. |
| Absence/removal confirmation | A single-poll "not in the list, remove it" check | The two-consecutive-trustworthy-poll-plus-final-check state machine (`D-029`) | A single-poll removal is exactly the false-normal failure mode `02-CONTEXT.md`'s accepted-risk analysis exists to bound; skipping the final check reopens the race the requirement explicitly closes. |

**Key insight:** every "don't hand-roll" item above already has a locked decision or a verified
HAP mechanism behind it. The genuinely open design work in this phase is not decoding vendor
JSON or building HAP primitives — Phase 1 and HAP-NodeJS already solved those — it is composing
existing seams (`DeviceFamily`, `DeviceHealth`, `AccessoryContext`) into the four patterns above
without introducing a parallel state shape next to ones that already exist.

## Common Pitfalls

### Pitfall: Registering an accessory that is already cached

**What goes wrong:** Calling `registerPlatformAccessories` for a `deviceId` whose UUID is already
in `this.accessories` (restored via `configureAccessory`) throws a duplicate-UUID error at the HAP
layer.
**Why it happens:** `configureAccessory` runs once per cached accessory *before*
`didFinishLaunching`; a discovery loop that does not check the cache first assumes every discovered
device is new.
**How to avoid:** Always look the UUID up in `this.accessories` first (Pattern 3); only the
register-vs-update branch differs.
**Warning signs:** A Homebridge log line naming "duplicate UUID" on every restart with a populated
cache.

### Pitfall: Context mutation with no persistence call

**What goes wrong:** Writing to `accessory.context` (a `lastVendorName`, a pump-observation
update) and assuming Homebridge persists it automatically.
**Why it happens:** Nothing in the `PlatformAccessory` type signals that context is a live-write
cache; it looks like a plain mutable object.
**How to avoid:** Call `this.api.updatePlatformAccessories([accessory])` immediately after any
context write that must survive an unclean shutdown — verified in project intel from
`homebridge/homebridge`'s own `bridgeService.ts`: `saveCachedPlatformAccessoriesOnDisk()` runs from
exactly four call sites (`handleRegisterPlatformAccessories`, `handleUpdatePlatformAccessories`,
`handleUnregisterPlatformAccessories`, `teardown()`) — a context mutation with no corresponding
call to one of these four is invisible on disk until the next full unregister/register cycle or a
clean shutdown. `[CITED: .planning/intel/context.md:1063-1069]`.
**Warning signs:** A pump-observation count or a rename decision that "forgets itself" after a hard
kill of the Homebridge process, reproducible only under `RES-04`-style failure-mode testing.

### Pitfall: `implemented: false` HALO adapters accidentally decoded

**What goes wrong:** A registry entry for HALO that satisfies the full `DeviceFamily<T>` interface
(because the type requires `validate`/`decode`/`capabilities`/`command`) gets its `decode()` called
by code that only checks "is there an entry" rather than "is `implemented` true."
**Why it happens:** `DeviceFamily.implemented` is a data field, not a type-level discriminant — the
compiler will not stop a caller from ignoring it.
**How to avoid:** Gate every registry lookup consumer on `implemented === true` before calling
`validate`/`decode`; treat `implemented: false` and "registry miss" as the same "do not decode"
branch with different log messages (Pattern 1).
**Warning signs:** A HALO device producing decoded telemetry or a published accessory despite
`D-002` explicitly deferring HALO to v2.

### Pitfall: Empty-inventory removal risk understated in the plan

**What goes wrong:** A plan that implements "two consecutive trustworthy responses omit the
device" without the "final current-inventory check" `D-029` also requires, or without naming the
distinct trustworthy-vs-healthy vocabulary `02-CONTEXT.md` mandates.
**Why it happens:** The two-poll check alone reads as sufficient; the final check exists
specifically to close a narrow race the two-poll check does not cover on its own.
**How to avoid:** Implement all three bounds `02-CONTEXT.md` lists together — two confirmations,
the final check, and the ~30-minute floor at the default poll interval — and rename the concept
from "healthy" to "trustworthy inventory response" throughout the code, not just in comments.
**Warning signs:** A test that only exercises "device missing from exactly two polls, in a row,
with nothing in between" and never exercises "device reappears between confirmation two and the
final check."

### Pitfall: Manufacturer/Model with no truthful vendor-supplied value

**What goes wrong:** Hardcoding a Manufacturer/Model string that is not, itself, sourced from a
validated vendor field, in a way that reads as more authoritative than it is.
**Why it happens:** The vendor payload has no literal `manufacturer` or `model` field — only
`deviceTypeId` (`wayneWaterGemini`) and `attributes.productLine` (`wayneWater`) `[VERIFIED:
.planning/intel/constraints.md:170-198]`, quoted verbatim above in this document's earlier read.
**How to avoid:** `DEV-07` requires the values be "sourced only from validated vendor identity ...
fields" but does not require them to be *literally copied* — a documented, truthful constant
(e.g., Manufacturer derived from the known product line, Model derived from `deviceTypeId`) is
consistent with the requirement as long as it is not presented as vendor-reported when it is a
plugin-side literal. This is genuinely unresolved; see Open Questions.
**Warning signs:** A hardcoded Manufacturer/Model that silently diverges from the vendor's own
branding without anyone deciding it should.

## Code Examples

### Verified: pinned `StatusActive`/`StatusFault` shape

```typescript
// Source: node_modules/@homebridge/hap-nodejs/dist/lib/definitions/CharacteristicDefinitions.d.ts:1494-1506
export declare class StatusActive extends Characteristic {
    static readonly UUID: string;
    constructor();
}
export declare class StatusFault extends Characteristic {
    static readonly UUID: string;
    static readonly NO_FAULT = 0;
    static readonly GENERAL_FAULT = 1;
    constructor();
}
```

### Verified: `AccessoryInformation` already added at construction, and duplicate-add throws

```javascript
// Source: node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js:229-251, 266-279 (quoted in full above under Pattern 2)
```

### Cited: `uuid.generate` signature

```typescript
// Source: node_modules/@homebridge/hap-nodejs/dist/lib/util/uuid.d.ts:4 [VERIFIED]
export declare function generate(data: BinaryLike): string;
```

### Cited: `API` accessory-registration signatures

```typescript
// Source: node_modules/homebridge/dist/api.d.ts:612-615 [VERIFIED]
publishExternalAccessories(pluginIdentifier: PluginIdentifier, accessories: PlatformAccessory[]): void;
registerPlatformAccessories(pluginIdentifier: PluginIdentifier, platformName: PlatformName, accessories: PlatformAccessory[]): void;
updatePlatformAccessories(accessories: PlatformAccessory[]): void;
unregisterPlatformAccessories(pluginIdentifier: PluginIdentifier, platformName: PlatformName, accessories: PlatformAccessory[]): void;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Reporting vendor faults or unreachability with `HapStatusError` / "No Response" | `StatusActive`/`StatusFault` characteristics that stay live and queryable | Long-standing HAP-NodeJS guidance, not a recent change | `DEV-08`'s degrade-in-place requirement is the current best practice, not a project-specific deviation from it — corroborated by the HAP-NodeJS wiki citation already captured in project intel. |

**Deprecated/outdated:** None specific to this phase; the HAP mechanisms verified above
(`AccessoryInformation`, `StatusActive`/`StatusFault`, `uuid.generate`) are all current in the
pinned `2.2.2`/`2.4.0` versions and show no deprecation markers in the typings read this session.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `DEV-05` pending-absence counter (consecutive trustworthy polls that omitted a device) is in-memory runtime state, not persisted in `accessory.context`, and safely resets to zero on a plugin restart. | Alternatives Considered; Pattern 3 | If a restart-proof counter is actually required, a restart during the confirmation window silently extends the effective removal delay rather than violating a correctness requirement — low severity, but worth a locked decision before planning. |
| A2 | `AccessoryInformation` Manufacturer/Model should be documented, truthful plugin-side literals (not literal vendor field copies, since none exist) derived from `deviceTypeId`/`productLine`. | Pitfall: Manufacturer/Model with no truthful vendor-supplied value | If the user intends something else (e.g., a fixed literal unrelated to `productLine`, or omitting Manufacturer/Model entirely — not viable, HAP expects non-empty strings), the plan would need revision after this phase starts. `02-CONTEXT.md` leaves this open ("Claude's Discretion" does not cover Manufacturer/Model explicitly — only `FirmwareRevision` sourcing and `wifi_signal_dbm`). |
| A3 | `wifi_signal_dbm` has no semantically correct HAP representation, because the one plausible characteristic (`ReceivedSignalStrengthIndication`) is not declared as an optional/required characteristic of any standard `Service` in the pinned typings, meaning attaching it would require a non-standard service. | Standard Stack / DEV-07 discretion note | If a later HAP version or a vendor-neutral service does support it, omitting `wifi_signal_dbm` would under-deliver on `DEV-07`'s "expose it read-only where a semantically correct representation exists" clause — but `02-CONTEXT.md` already accepts "concluding that none exists is a valid outcome," so this is a documented, not silent, gap. |
| A4 | The reconciliation/removal logic (`DEV-05`) needs a new `DeviceStateStore` method (or an equivalent new module) to remove a device — no such method exists today. | Pattern 3 | If the planner instead tries to bolt removal onto `applyDiscovery`/`applyReportedPatch`, it will fight the store's existing invariant that discovery only ever adds/updates, never removes — better surfaced now than mid-implementation. |

**If this table is empty:** N/A — see rows above.

## Open Questions

1. **Where does `DEV-05`'s absence-tracking state live, architecturally?**
   - What we know: it needs the full discovered-ID list on every trustworthy poll (available
     inside `accountRuntime.ts` today, but not exposed to any external listener), and it needs to
     call Homebridge's `api.unregisterPlatformAccessories` (which `accountRuntime.ts` does not
     hold — only `platform.ts` does).
   - What's unclear: whether the cleanest seam is a new hook on `AccountRuntimeOptions` (e.g., an
     `onDiscoverySucceeded` callback alongside the existing `onReportedPatch`/`onConnected`
     pattern already used for the shadow client) or a separate reconciliation module that
     `platform.ts` composes directly against `DeviceStateStore.deviceIds()` polled on its own
     schedule.
   - Recommendation: prefer the hook — it reuses the existing "account runtime reports facts,
     platform reacts" shape already established for `onConnected`/`onDisconnected`, and it
     guarantees the absence check runs exactly once per real poll rather than on a second,
     possibly-skewed timer.

2. **What are the truthful values for `AccessoryInformation.Manufacturer` and `.Model`?**
   - What we know: the vendor payload supplies `deviceTypeId` (`wayneWaterGemini`) and
     `attributes.productLine` (`wayneWater`), never a literal manufacturer/model string.
   - What's unclear: whether the plugin should present something derived from those fields (e.g.,
     Manufacturer "Wayne", Model "Gemini") as a documented, truthful plugin-side literal, or
     whether the user wants a different framing given the product is sold as "Basement Guardian."
   - Recommendation: surface this as a discuss-phase-adjacent question before planning locks
     specific string literals — it is a genuinely unresolved product-labeling choice, not a
     research gap.

3. **Does `AccessoryContext` need a schema version or migration marker before it gains new fields
   this phase?**
   - What we know: `AccessoryContext` today has no version field; Phase 2 is its first real
     consumer, so there is no existing on-disk data to migrate.
   - What's unclear: whether a future phase's field addition to the same interface needs a
     migration story that Phase 2 should establish the pattern for now, or whether that is
     premature given `AccessoryContext` has zero production writers before this phase.
   - Recommendation: no migration concern for Phase 2 itself (nothing has ever been written to
     `accessory.context` by this plugin), but note it for whichever phase next extends the shape.

## Environment Availability

Skipped — this phase adds no new external tool, service, or runtime dependency. Everything it
needs (`homebridge`, `@homebridge/hap-nodejs` via `api.hap`, `node:test`, `@cucumber/cucumber`) is
already installed and already exercised by Phase 1's test suite.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (unit, Node `^22.10.0 \|\| ^24.0.0` built-in) + `@cucumber/cucumber@13.2.1` (feature/integration) [VERIFIED: `package.json`] |
| Config file | `cucumber.json` (profiles: `default`, `real`); unit tests run via `tsconfig.test.json` build + `node --test`, no separate runner config |
| Quick run command | `npm run test:unit` (build `dist-test/` then `node --test "dist-test/test/**/*.test.js"`) |
| Full suite command | `npm test` (`test:unit` then `test:cucumber`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|---------------|
| DEV-01 | Registry returns implemented/unsupported/unknown for a `deviceTypeId`; non-Gemini never blocks Gemini publication | unit | `npm run test:coverage:direct -- dist-test/src/device/registry.js dist-test/test/device/registry.test.js` | ❌ Wave 0 (new module + test) |
| DEV-01 | End-to-end: a HALO and an unknown-type device alongside a valid Gemini in one inventory | feature | `npm run test:cucumber` (new scenario) | ❌ Wave 0 (new feature file; `toDevice()` needs a `deviceTypeId` column) |
| DEV-02 | Registry is keyed by `deviceTypeId`, not a switch/if-chain | unit | same registry test file as DEV-01 | ❌ Wave 0 |
| DEV-03 | Missing/wrong-type/out-of-domain fields produce `{valid: false, violations}` before decode | unit | `npm run test:coverage:direct -- dist-test/src/device/gemini.js dist-test/test/device/gemini.test.js` | ✅ exists, currently a type-only stub — needs upgrade to real `validate()`/`decode()` behavior cases |
| DEV-04 | UUID seeded only from `deviceId`; `deviceTypeId` change reuses the same accessory | unit + feature | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js`; `npm run test:cucumber` | ✅ `platform.test.ts` exists (Phase 1), needs discovery/reconciliation cases; feature scenario is ❌ Wave 0 |
| DEV-05 | Two consecutive trustworthy absences + final check removes the accessory and ends the epoch; a failed poll never counts; an empty-but-valid list counts | unit + feature | new reconciliation module's direct-coverage command; `npm run test:cucumber` | ❌ Wave 0 (module, unit test, and feature scenario all new) |
| DEV-06 | Vendor rename adopted only when the HomeKit name still equals the stored prior vendor name | unit | `npm run test:coverage:direct -- <module path>.js <module path>.test.js` (module TBD — see Open Question 1 area / Claude's Discretion) | ❌ Wave 0 |
| DEV-07 | `AccessoryInformation` gets `Manufacturer`/`Model`/`SerialNumber`/`FirmwareRevision` from validated fields; `deviceId` never reaches a HAP characteristic value | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ✅ exists, currently a type-only stub — needs upgrade |
| DEV-08 | Degraded accessory sets `StatusActive=false`, leaves `StatusFault=NO_FAULT`, keeps last valid values, logs once | unit + feature | same `basementGuardian` test pair; `npm run test:cucumber` | ✅/❌ mixed — unit pair exists as a stub; feature scenario is Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:unit` (fast; skips the Cucumber process-spawn cost).
- **Per wave merge:** `npm test` (unit + Cucumber, matching `REL-02`'s combined-suite requirement).
- **Phase gate:** Full suite green, run three consecutive times before claiming pass — Phase 1's
  own hazard record notes `npm run check` failed 1 run in 4 while every report claimed green; a
  single green run is not a green gate for this codebase.

### Wave 0 Gaps

- [ ] `features/support/fakeHomebridgeApi.ts` — `hap` is currently `{}` and the accessory stand-in
      has no `addService`/`getService`/`getServiceById`; the `API` stand-in has no
      `registerPlatformAccessories`/`updatePlatformAccessories`/`unregisterPlatformAccessories`.
      The module's own fileoverview already flags this: "The accessory adapters grow this module
      when they arrive."
- [ ] `features/support/steps/harness.ts`'s `toDevice()` hardcodes `deviceTypeId:
      'wayneWaterGemini'` — needs a `deviceTypeId` table column so a scenario can seed a HALO or
      unknown-profile device.
- [ ] `test/device/registry.test.ts` (or wherever the registry module lands) — new, covers DEV-01/DEV-02.
- [ ] New feature file (e.g. `features/discovery.feature`) covering registration, the two-poll
      removal window, vendor-rename adoption, and degrade-in-place — none of these scenarios exist
      today; `features/lifecycle.feature` only covers start/shutdown.
- [ ] `test/device/gemini.test.ts`, `test/accessories/basementGuardian.test.ts`,
      `test/accessories/services.test.ts`, `test/persistence/accessoryContext.test.ts` — all four
      exist today as type-only `satisfies`/`@ts-expect-error` stub tests with zero runtime cases;
      each needs real behavioral coverage once its module gains a production implementation.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Out of scope — Phase 1 owns Auth0/token handling entirely. |
| V3 Session Management | No | No session concept in this phase. |
| V4 Access Control | No | Single local account, no multi-tenant boundary. |
| V5 Input Validation | Yes | `DeviceFamily.validate()` — strict required-field/type/legal-value checks before decode, exactly matching `DEV-03`'s intent and the existing hand-written-predicate pattern already used in `src/cloud/types.ts` (`isWireDevice`, `isApiConnectivity`, etc.), never `as`/assertion-based narrowing. |
| V6 Cryptography | No | No cryptographic material touched in this phase. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| A vendor payload with a `deviceTypeId` matching a known family but a field of the wrong runtime type (e.g., `water_level` as a string) is decoded anyway, producing a plausible-but-wrong HomeKit value. | Tampering | `DEV-03`'s strict field/type/legal-value validation runs *before* `decode()`, never after; a `FamilyValidation` of `{ valid: false }` blocks decode entirely — this is the exact scenario `src/device/family.ts`'s own fileoverview names as the reason the family boundary exists. |
| Spreading a raw wire/vendor object into `accessory.context` or a log line, leaking the eight unread top-level keys (including the account identifier embedded structure) past the normalization boundary. | Information Disclosure | Field-by-field construction only, following the existing `toApiDevice` pattern in `src/cloud/types.ts` — never `{ ...wireDevice }`. |
| A HALO or unknown `deviceTypeId` silently decoded because a caller checks "is there a registry entry" instead of "is `implemented === true`." | Tampering (plausible-wrong state), Denial of Service (if it crashes on an unexpected shape) | Gate every registry consumer on the `implemented` flag explicitly (Pitfall above). |
| Removal logic that trusts a single ambiguous signal (a failed request, or a transient connectivity blip) as evidence of a genuinely absent device, over-deleting accessories and their persisted pump-observation history. | Repudiation (loses the pump activity record the user relied on), Denial of Service (accessory vanishes from HomeKit) | The full `D-029` three-part bound: two consecutive trustworthy (not merely successful-looking) confirmations, plus a final current-inventory check, plus the ~30-minute floor at the default poll interval. |

## Sources

### Primary (HIGH confidence)
- `node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js` — read directly this session; `AccessoryInformation` construction and duplicate-service-add behavior.
- `node_modules/@homebridge/hap-nodejs/dist/lib/definitions/CharacteristicDefinitions.d.ts` — `StatusActive`, `StatusFault`, `Manufacturer`, `Model`, `SerialNumber`, `FirmwareRevision`, `ConfiguredName`, `ReceivedSignalStrengthIndication`.
- `node_modules/@homebridge/hap-nodejs/dist/lib/definitions/ServiceDefinitions.d.ts` — `AccessoryInformation` service class.
- `node_modules/@homebridge/hap-nodejs/dist/lib/util/uuid.d.ts` — `generate` signature.
- `node_modules/homebridge/dist/api.d.ts`, `node_modules/homebridge/dist/platformAccessory.d.ts` — `API`/`PlatformAccessory` accessory-registration and context signatures.
- `node_modules/@homebridge/hap-nodejs/package.json`, `node_modules/homebridge/package.json` — pinned versions.
- `src/device/family.ts`, `src/device/gemini.ts`, `src/device/halo.ts`, `src/device/health.ts`, `src/device/state.ts`, `src/persistence/accessoryContext.ts`, `src/runtime/accountRuntime.ts`, `src/platform.ts`, `src/accessories/basementGuardian.ts`, `src/accessories/services.ts`, `src/cloud/types.ts`, `src/config.ts`, `src/settings.ts` — read directly this session.
- `.planning/phases/02-safe-gemini-discovery-and-identity/02-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/PROJECT.md` — locked project decisions.

### Secondary (MEDIUM confidence)
- `.planning/intel/context.md` (lines 1000-1163, 130-198) and `.planning/intel/decisions.md` (D-029, D-030 sections) — prior-session project intel, itself citing `homebridge/homebridge` source, the HAP-NodeJS wiki, and the plugin template; treated as `[CITED]` since this session did not re-fetch the underlying upstream sources directly.
- `features/support/fakeHomebridgeApi.ts`, `features/support/fakeRestApi.ts`, `features/support/steps/harness.ts`, `features/lifecycle.feature`, `features/CLAUDE.md` — existing test-harness conventions this phase's new tests must extend.
- WebSearch: "Homebridge dynamic platform plugin configureAccessory didFinishLaunching registerPlatformAccessories" — confirmed general community/official guidance on the register-once, duplicate-UUID pitfall (`developers.homebridge.io/homebridge/interfaces/DynamicPlatformPlugin.html`, `github.com/homebridge/homebridge-plugin-template`).
- WebSearch: "HAP AccessoryInformation service required characteristics" — corroborated the `Identify`/`Manufacturer`/`Model`/`Name`/`SerialNumber`/`FirmwareRevision` set already verified directly from the pinned typings.

### Tertiary (LOW confidence)
- None used as the basis for a stated recommendation; every `[ASSUMED]` claim is listed in the Assumptions Log above rather than presented as settled.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, every mechanism verified against pinned `node_modules` source/typings.
- Architecture: MEDIUM — `DEV-04`/`DEV-06`/`DEV-07` patterns are well-grounded; `DEV-05`'s exact module seam is a genuine open design question (Open Question 1), not a research gap that more reading would close.
- Pitfalls: HIGH — every pitfall traces to either a verified HAP-NodeJS throw/behavior or a locked `02-CONTEXT.md` decision.

**Research date:** 2026-08-29
**Valid until:** 30 days (stable HAP-NodeJS/Homebridge mechanics; re-verify if `@homebridge/hap-nodejs` or `homebridge` are upgraded before this phase is planned).
