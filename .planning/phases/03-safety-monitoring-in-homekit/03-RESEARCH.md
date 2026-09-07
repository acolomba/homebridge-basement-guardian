# Phase 3: Safety Monitoring in HomeKit - Research

**Researched:** 2026-08-30
**Domain:** HomeKit / HAP service and characteristic modelling in a Homebridge dynamic platform, over an existing validated device-state pipeline
**Confidence:** HIGH for everything read out of the pinned HAP typings and proved by executable probe; LOW for Apple Home's own rendering and automation behaviour, which no source in this session could settle and which needs a real Apple home.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Water level and the flood threshold

- **D-01 — Even five-step level ladder:** Map every legal `water_level` code to a `WaterLevel`
  percentage through an explicit `Map`, never a population count: `0→0, 1→20, 3→40, 7→60, 15→80,
  31→100`. Five equal steps for five stacked sensors, with `31` as 100% of the range the device
  can report. — **Reversibility:** costly — the percentages are user-visible values that HomeKit
  automations compare against, so changing a row later silently changes when a user's automation
  fires.

- **D-02 — Code `0` reports 0% with no fault:** `SAFE-01` requires every legal code, `0` included,
  to pass through the explicit lookup. Under the thermometer reading, `0` means no sensor is wet.
  It reports `WaterLevel = 0` and leaves `StatusFault` at `NO_FAULT`.

- **D-03 — Flood threshold is `31` only:** `Sump Pit Flood` activates on `waterLevel >= 31`, which
  matches vendor rule `WW-GEM-ALERT-7` (`water_level > 15`) exactly — `31` is the only legal code
  above `15`. The plugin makes no independent claim about when a pit is flooding.

**Every row of `D-01` except `1`, and the `D-03` threshold, are provisional constants until G-002
closes.** `SAFE-01` requires this and G-002 blocks only the `1.0.0` release, never phase
completion. Name them so a reader can see they are provisional, and keep them in one place.

An out-of-domain `water_level` code is a validation failure, not a lookup miss. It never reaches
the lookup: it faults the `water` scope under `D-04` below.

#### Trust scoping — one bad field faults one scope

- **D-04 — Per-field trust-scope map:** Add a field→`TrustScope` map and a decode path that
  tolerates a partly-invalid snapshot. An invalid field faults only the scope that owns it; every
  other scope keeps publishing current values. Whole-accessory degradation is reserved for an
  unresolvable family. — **Reversibility:** costly — this changes the `DeviceFamily` validate and
  decode contract that Phase 2 established and that `basementGuardian.update()` consumes, so
  undoing it touches the family seam, the accessory, and every family test.

This is the largest piece of work in the phase and it reworks a Phase 2 seam.

`geminiFamily.validate()` is currently all-or-nothing: one out-of-domain field returns
`{ valid: false }` for the whole snapshot, and `createBasementGuardianAccessory`'s `update()` then
degrades all five scopes together. That conflicts with two things this phase must satisfy —
success criterion 6 ("faults or deactivates only the narrowest owning scope") and locked `D-014`
("mark only the truthful scope faulty/inactive").

The data needed already exists. `validate()` returns `FieldViolation[]` with `{ field, reason }`
per `src/device/family.ts`. What is new is the field→scope map and a `decode()` path that returns
usable state for the scopes that did validate.

The mapping follows field ownership:

| Field | Scope |
|---|---|
| `water_level` | `water` |
| `primary_pump_running`, `backup_pump_running`, `backup_pump_timestamp` | `pump` |
| `ac_power` | `power` |
| `battery_charging`, `battery_voltage_low`, `battery_health`, `hours_of_protection` | `battery` |
| `primary_pump_fault`, `backup_pump_fault`, `backup_pump_fuse_blown`, `water_sensor_fault` | `fault` |
| `serial_communications` | see `D-11` |
| `offline` | `connectivity` |
| `alarm_audio_muted`, `test_running`, `test_timestamp` | Phase 4 controls; not a Phase 3 scope |

A `missing` violation maps to its owning scope the same way a `wrong-type` or `out-of-domain` one
does. Only an unresolvable family degrades the whole accessory, which is the `DEV-08` trigger
Phase 2 built for and which stays unchanged.

Phase 1's merge reducer folds partial heartbeats into cached state key by key, so `snapshot.data`
always carries the full record and a heartbeat never presents as a wave of missing fields. This
was verified in `src/device/state.ts`; the planner should not re-derive it.

#### Degraded-state visibility in Apple Home

- **D-05 — `StatusActive` plus documentation, no new adapter:** A degraded scope sets
  `StatusActive = false` on its services, retains its last valid values, logs one warning, and is
  documented in the README. No ADR is revised and no adapter is added.

This closes the concern Phase 2 recorded for Phase 3 (`02-CONTEXT.md`, D-04 section).

HAP-NodeJS's own guidance names `StatusActive = false` as the recommended workaround: it does not
disrupt HomeKit and displays "Status Active — No" in the Apple Home accessory settings. So the
state is visible in Details, not on the tile. Eve-class controllers show it directly.

The alternatives were both rejected. A dedicated untrusted-data adapter is blocked by locked
`D-016` ("avoid a Monitoring Unavailable adapter") and would need an ADR revision plus a `CONF-06`
change from seven slugs to eight. `HapStatusError` is forbidden: HAP-NodeJS reserves it for a
permanent condition requiring user action, and it produces Apple Home's "No Response", which
erases the retained values `D-014` requires the accessory to keep.

HAP-NodeJS's default advice — return a safe default such as a not-detected state — is deliberately
**not** followed. `D-014` preserves the last valid value instead, precisely so a stale reading
never becomes a false normal. The README should say so, because it is a visible departure from
common plugin behavior.

**Open hazard, must be verified rather than assumed.** A HAP-NodeJS issue report
(homebridge/HAP-NodeJS#375) states that a sensor marked inactive is greyed out in Apple Home *and
drops out of automations*. If that holds on current iOS, `StatusActive = false` on the
`Sump Pit Flood` sensor would silently disable a user's flood automation at exactly the moment the
plugin is least sure of itself. Research must confirm or refute this against current HAP and iOS
behavior before the phase ships. If it is true, the finding reopens `D-05` rather than being
worked around quietly, and it belongs in the phase's human-verification items.

#### Backup battery

- **D-06 — No sixth fault adapter:** `battery_health == 32` (NotDetected) does **not** earn a
  sixth Apple Home adapter. `D-008` stays locked at five. The condition surfaces through the
  standard Battery service's `StatusLowBattery`, which Apple Home renders in accessory details and
  the Home battery list, and the exact `battery_health` value stays on the custom Battery service.

This resolves the open proposal recorded in `.planning/PROJECT.md` under "Open Proposals". It
resolves **against** the sixth adapter, so no revision to `D-008` in `docs/research/DECISIONS.md`
is required and `CONF-06` keeps seven slugs. Remove the proposal from PROJECT.md when this phase
completes.

Accepted trade: `StatusLowBattery` is an indicator, not a tile, and driving a characteristic named
"low" from a "not detected" condition is a small semantic stretch. It was preferred over inventing
a tile that locked decisions forbid.

- **D-07 — `StatusLowBattery` sources:** `LOW` when `battery_voltage_low === true`, or
  `battery_health` is `1` (Replace), `2` (Poor), or `32` (NotDetected). `NORMAL` for `4` (Okay),
  `8` (Good), and `16` (NA). This covers vendor rules `WW-GEM-ALERT-1`, `-2`, `-3`, and `-11`.

- **D-08 — No cross-field arbitration on the battery:** `BatteryLevel` publishes the
  `hours_of_protection` band as reported (`1→25, 2→50, 4→75, 8→100`), even when `battery_health`
  reports `16` (NA) or `32` (NotDetected). The plugin does not arbitrate between two vendor fields
  it has no hardware evidence about; correcting one from the other would be exactly the guess
  `D-014` forbids. `StatusLowBattery` already carries the warning and the custom service carries
  the exact facts.

`battery_charging === false` is never a fault. The self-test stops charging for roughly eight
seconds. Report `ChargingState` truthfully from `battery_charging`; `NOT_CHARGEABLE` has no source
and is never published. Never represent battery health or replacement through
`FilterMaintenance` (`D-021`).

#### Offline confirmation and the staleness boundary

- **D-09 — Phase 3 owns the offline-confirmation counter:** This phase consumes
  `offlineConfirmationPollCount` from `src/config.ts` (default `2`, range `1`–`8`) and activates
  `Basement Guardian Offline` only after N consecutive successful snapshots reporting
  disconnected. A failed REST request is not a snapshot and never counts. Any connected snapshot
  resets the count to zero. Phase 5 layers restart persistence and the degraded-path distinction
  on top.

This ships a stable adapter rather than one that flaps on a single transient disconnect, which is
what `D-015`'s confirmation policy exists to prevent.

**This moves `RES-03`'s counter into Phase 3.** `RES-03` was assigned to Phase 5 alone, but
`SAFE-04` publishes `Basement Guardian Offline` among its five adapters in Phase 3, and an adapter
without the counter would flap. `.planning/REQUIREMENTS.md` now records `RES-03` as spanning Phase
3 and Phase 5: the counter and adapter here, and separating a lost monitoring path from a
confirmed-offline device in Phase 5.

- **D-10 — `RES-01` splits across Phase 3 and Phase 5:** Phase 3 owns the field-validity half —
  an invalid or omitted field preserves the last valid value and faults the narrowest scope, and
  neither omitted partial fields nor invalid updates ever clear an active safety condition. Phase
  5 owns the time-based half — the ~898-second heartbeat, the two-missed-heartbeat rule, and
  shadow silence as a secondary staleness signal — alongside the monitoring-path work it already
  scopes.

**`.planning/REQUIREMENTS.md` must record `RES-01` as spanning Phase 3 and Phase 5** so its
coverage does not silently drop when Phase 3 completes. The traceability table currently lists it
under Phase 3 alone. Building the heartbeat timer here would mean building it before Phase 5
defines the degraded-path versus confirmed-offline distinction it has to serve.

- **D-11 — `serial_communications === false` poisons every controller-derived scope:** `water`,
  `pump`, `power`, `battery`, and `fault` all become untrusted with reason `controller-link-lost`.
  Values are retained, `StatusActive` goes false on the affected services, and
  `Pump Controller Link Lost` activates. Only `connectivity` stays trusted, because the vendor
  cloud is still answering normally.

This is what `RES-02` and `HOMEKIT.md` §3.3 require: treat it as a fault *and* stop trusting the
rest of the payload. The Wi-Fi module knows its own link state directly, so the
`Pump Controller Link Lost` adapter itself stays trustworthy while everything downstream of the
controller does not. `RES-02` also requires exposing when trustworthy controller data last
arrived — the `lastTrustedAt` field already on `UntrustedScope` in `src/device/health.ts` carries
this.

`serial_communications === false` is a *reported condition*, not a validation failure, so it is
distinct from `D-04`. Both produce untrusted scopes; only the reason differs, and the existing
`DistrustReason` union already has both members.

#### Services, subtypes, and names

- **D-12 — Subtype is the `ServiceKind` slug verbatim:** `'sump-pit-flood'`, `'primary-pump'`,
  `'mains-power-lost'`, and so on. No prefix and no version segment. — **Reversibility:** one-way —
  HomeKit identifies a service by type plus subtype, so a changed subtype orphans the service and
  every automation, scene, and notification a user attached to it. There is no migration path;
  `src/accessories/services.ts` already states these are a user-facing contract from the first
  release.

Subtypes are scoped within one accessory, so nothing can collide and a namespace buys nothing. A
version prefix would advertise an intent to change the one string that must never change. Using
the same token the user types into `ignoredFaults` also keeps Homebridge's `cachedAccessories`
file readable during support.

- **D-13 — Add the missing `primary-pump-running` kind:** Add `'primary-pump-running'` to
  `CoreServiceKind`, not to `NotificationServiceKind`.

`src/accessories/services.ts` declares `'primary-pump'` (the custom Pump service) but no kind for
the `Primary Pump Running` ContactSensor, while the backup side has both `'backup-pump'` and
`'backup-pump-activated'`. `HOMEKIT.md` §3.2 names the primary activity adapter explicitly, and
`CONF-06` states the slug list has seven entries rather than eight *because* `Primary Pump Running`
is a non-removable activity adapter. Adding it as a core kind matches that reasoning, leaves
`ignoredFaults` at seven slugs, and gives the ContactSensor its own subtype so it coexists with the
custom Pump service on the same accessory.

- **D-14 — Display names verbatim from `HOMEKIT.md`:** `Sump Pit Flood`, `Sump Pit Level`,
  `Primary Pump`, `Primary Pump Running`, `Backup Pump`, `Backup Pump Activated`,
  `Sump Mains Power`, `Mains Power Lost`, `Primary Pump Fault`, `Backup Pump Fault`,
  `Water Sensor Fault`, `Pump Controller Link Lost`, `Basement Guardian Offline`. No device-name
  prefix.

Apple Home already groups tiles under their accessory and users rename tiles freely. Prefixing
would bake the vendor name into thirteen service names that `D-030`'s rename logic does not
reach, leaving them stale after a vendor rename.

- **D-15 — Mirror every exact vendor fact on a read-only vendor-defined characteristic:** Each
  custom service carries the raw vendor value beside the standard one, including the raw
  `water_level` code (`0`/`1`/`3`/`7`/`15`/`31`) next to the mapped `WaterLevel` percentage.

This matters specifically because the `D-01` ladder is provisional until G-002. Publishing the raw
code is what lets anyone check the mapping against a real pit instead of trusting it. It also
satisfies `SAFE-08` and success criterion 5 directly.

- **D-16 — `wifi_signal_dbm` is not published to HomeKit:** It is Wi-Fi module diagnostics, not a
  basement-protection condition, and it belongs to no `TrustScope`. Nothing in HomeKit renders
  dBm, and inventing a service to host it would put diagnostics among safety state. It stays
  available through Homebridge debug logging.

Phase 2 left "whether `wifi_signal_dbm` has a semantically correct HAP representation at all" to
discretion and named concluding that none exists as a valid outcome. This is that conclusion.

#### Configuration surface

- **D-17 — An unknown `ignoredFaults` slug refuses the configuration:** Validation refuses, and
  the refusal message names the unrecognized slug **and** lists all seven valid slugs so the fix is
  obvious from the log alone. Duplicate entries also refuse, since `CONF-06` specifies a unique
  list.

**Decided by the user against the recommendation, with the trade understood.** The consistency
argument carried it: `validateConfig` in `src/config.ts` already refuses an out-of-range
`pollInterval` or `offlineConfirmationPollCount`, and a typo means the user did not get the
configuration they asked for — quietly publishing an adapter they meant to remove is its own
surprise.

**Accepted risk:** a typo in a cosmetic list leaves the sump pump entirely unmonitored until the
user notices and edits the configuration. The mitigation is entirely in the message quality, which
is why naming the bad slug and enumerating the valid ones is a requirement of this decision and
not a nicety. The planner must treat that message as testable behavior.

Adding a slug to `ignoredFaults` removes only that Contact Sensor. The condition, the owning
service's status characteristics, the diagnostics, the counters, the timestamps, and the truthful
service all remain. `Sump Pit Flood` and the standard Battery service are not removable.

#### Proving immediacy

- **D-18 — Gate `SAFE-07` with an injected timer spy, not behavior alone:** Inject the timer
  factory the way `Clock` is already injected in `src/runtime/clock.ts`, and assert it records zero
  calls across a full source-change-to-characteristic-update transition. Pair it with Cucumber
  scenarios that advance the fake clock by zero and assert the adapter already transitioned, and
  extend the existing configuration-schema key-set test to prove no alert-delay setting exists.

`SAFE-07` forbids something from existing, and absence is not provable by observing behavior — a
debounce shorter than whatever the harness advances would survive a behavioral test. The timer spy
is falsifiable: adding a debounce breaks it. This directly answers the Phase 1 hazard that a
passing test is not evidence.

### Claude's Discretion

- Custom service and characteristic UUID allocation, and the module layout that holds them.
- How the field→`TrustScope` map from `D-04` is expressed — a `Map`, a record, or per-field
  metadata on the existing `FieldCheck` functions in `src/device/gemini.ts`.
- Whether the partly-valid decode path returns a partial domain state, a per-scope result, or
  something else, provided no scope ever receives a guessed value.
- The shape of the custom Pump service so that Phase 4 can add its record characteristics without
  changing the subtype.
- Exact wording of every log line, subject to `D-17`'s content requirement.
- Whether `DistrustReason` gains members or the four existing ones suffice.
- Naming of the provisional water-level constants, provided a reader can see they are provisional.

### Deferred Ideas (OUT OF SCOPE)

- Durable pump records: observation epoch, observed activation count, last-activation timestamp,
  and de-duplicated recovered timestamp evidence — Phase 4, added to the Pump services this phase
  publishes.
- `System Self-Test` and `Alarm Mute` writable controls — Phase 4.
- The ~898-second heartbeat timer, the two-missed-heartbeat staleness rule, and shadow silence as
  a secondary signal — Phase 5, per `D-10`.
- Cached safety state across restart, and telling a confirmed-offline device apart from a degraded
  monitoring path — Phase 5.
- A dedicated untrusted-data notification adapter — rejected in `D-05`; it would need `D-016`
  revised first. Recorded so a later phase does not rediscover it as new.
- Confirming the `<account-id>` format against a real inventory response — still open from Phase 2,
  unchanged by this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONF-06 | Unique enumerated `ignoredFaults` list removes only selected Apple Home notification adapters; seven slugs, not eight. | `src/config.ts` `IntegerBounds` refusal pattern and `firstRefusal()` ordering (read this session); `config.schema.json` array-of-enum shape; `test/configSchema.test.ts` key-set case that must grow from six keys to seven; verified `accessory.removeService()` semantics for un-publishing an adapter. |
| SAFE-01 | Explicit legal-value lookup for `water_level`; unknown value faults instead of guessing; `Sump Pit Flood` only at the flood threshold. | Verified `WaterLevel` props (`float`, `percentage`, 0–100, `minStep 1`) and the verified HAP clamping behaviour that makes an out-of-range value a plausible wrong reading; verified `LeakDetected` valid values; custom-service pattern for hosting `WaterLevel`. |
| SAFE-02 | Truthful primary and backup Pump services plus their activity Contact Sensors. | Verified same-UUID-plus-subtype rules for multiple `ContactSensor` services on one accessory; verified custom `Service` subclass pattern through `api.hap`; verified forward-compatible characteristic repair path so Phase 4 can add record characteristics without changing the subtype. |
| SAFE-03 | Every live backup-pump activation, self-test included, updates immediately without an invented cause. | Push-only `updateCharacteristic` pattern with no `onGet` handler; verified synchronous value visibility after a push. |
| SAFE-04 | Five distinct Apple Home fault adapters plus owning-service status; no aggregate adapter. | Verified `ContactSensorState`, `StatusFault`, `StatusActive` props; the `fallow` clone gate that forces a table-driven adapter loop instead of five copy-pasted blocks. |
| SAFE-05 | `Sump Mains Power` custom service and `Mains Power Lost` adapter independent of pump health. | Custom read-only boolean characteristic pattern (`Formats.BOOL`, `[PAIRED_READ, NOTIFY]`). |
| SAFE-06 | Exact battery facts plus documented 25/50/75/100 estimated levels, no filter-maintenance misuse. | Verified `Service.Battery` required/optional characteristic set on both pinned HAP lines; verified `Service.BatteryService` alias is absent from HAP 2.x. |
| SAFE-07 | Immediate publish and immediate clear; no alert-delay setting or acknowledgement latch. | Verified that `node:timers/promises` bypasses a `globalThis.setTimeout` spy, which changes what the `D-18` gate has to look like; verified `t.mock.method(globalThis, 'setTimeout')` works as a spy. |
| SAFE-08 | Standard semantics where truthful; read-only vendor-defined characteristics otherwise. | Verified custom `Characteristic` subclass through `api.hap` with read-only perms; verified custom UUIDs survive the `cachedAccessories` round trip; `WaterLevel` is optional only on `HumidifierDehumidifier`, which confirms the custom Sump Pit service. |
| RES-01 (field-validity half) | Invalid or omitted field preserves the last valid value and faults the narrowest scope. | `src/device/family.ts` `FieldViolation` shape; `src/device/gemini.ts` `TELEMETRY_CHECKS` field list; `src/device/state.ts` merge reducer; verified HAP characteristic default values that would otherwise read as a false normal. |
| RES-02 | `serial_communications === false` activates `Pump Controller Link Lost`, faults controller-derived services, exposes when trustworthy data last arrived. | `UntrustedScope.lastTrustedAt` already on `src/device/health.ts`; custom read-only timestamp characteristic pattern. |
</phase_requirements>

## Summary

This phase writes almost no new infrastructure. It writes a mapping layer between state that
Phase 1 and Phase 2 already validate and a set of HomeKit services. Nearly every risk in it is
therefore a HAP behaviour risk, and nearly every HAP behaviour question in the phase brief could be
settled this session by reading the pinned typings and running the real HAP library against a real
`PlatformAccessory`. Section by section, the results are in the tables below; the executable probes
are described so the planner can re-run them.

**The flagged hazard in `D-05` is refuted at its source.** `homebridge/HAP-NodeJS#375` does not say
what `03-CONTEXT.md` and `STATE.md` say it says. It is a January 2017 thread titled "Temperature
sensor not working in Apple homekit automation", opened and closed within four minutes, and its
subject is that Apple Home offered no numeric-value automation triggers at the time. The single
`StatusActive` mention in it is a 2018 drive-by comment whose own report contradicts the hazard: the
commenter set `StatusActive` to *true* and the tile stayed greyed out anyway. Nothing in that issue,
and nothing else found this session, shows that `StatusActive = false` removes a sensor from Apple
Home automations. The one first-hand `StatusActive` discussion found — with ebaauw, who maintains
`homebridge-hue` and `homebridge-lib` — reports the opposite shape: Apple Home does nothing with the
characteristic except add a "Status Active" row in accessory settings. `D-05` stands on the evidence
available. What could **not** be established is Apple Home's behaviour on current iOS, because no
authoritative source describes it and this session had no Apple home to probe; that residual belongs
in the phase's human-verification items alongside `G-003` and `G-004`, which already require one.

The two things this phase must not get wrong are both about false normals, and both are now
concrete rather than theoretical. First, HAP **silently clamps** an out-of-range characteristic
value instead of refusing it: pushing `150` to `WaterLevel` publishes `100`, pushing `7` to
`ContactSensorState` publishes `1` (the alarm state under the project's own convention). A mapping
bug therefore does not fail loudly, it publishes a confident wrong reading — so the plugin must
validate before it publishes and can never treat HAP as a backstop. Second, a freshly constructed
service's characteristics carry format defaults, and those defaults are exactly the "all is well"
values: `LeakDetected = 0`, `ContactSensorState = 0`, `StatusLowBattery = 0`. A service added before
the first family-valid decode therefore reads as a healthy sump pit. `StatusActive` defaults to
`false`, which happens to be the right starting point, so the honest construction order is: add the
service, leave `StatusActive` false, and let the first valid decode turn it true along with the real
values.

**Primary recommendation:** Build one declarative service catalogue — one row per published service
carrying its kind, subtype, display name, HAP service constructor, and the projection from decoded
Gemini state to characteristic values — and drive publish, update, and `ignoredFaults` removal from
that one table. Look every service up with `getServiceById(ServiceClass, subtype)` and never by UUID
string, push every value with `updateCharacteristic` and register no `onGet` handler, validate every
value against its own domain before pushing it, and gate `SAFE-07` with three independent layers
because the injected timer spy alone is provably insufficient in this codebase.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Legal-value lookup for `water_level` → `WaterLevel` percentage | Device family adapter (`src/device/gemini.ts`) | — | `D-003` puts every field meaning behind the family boundary; a HomeKit module that knew the thermometer code would be the wrong decoder for a second family. |
| Per-field validation and the field→`TrustScope` map | Device family adapter (`src/device/gemini.ts`, `src/device/family.ts`) | — | The violation data already exists there (`FieldViolation.field`); only the family knows which field belongs to which scope. |
| Untrusted-scope computation from validation and from `serial_communications` | Accessory (`src/accessories/basementGuardian.ts`) | Device family | The family reports violations; the accessory owns the current trust state and its `lastTrustedAt` closure, which already lives there. |
| Offline confirmation counter | Account runtime (`src/runtime/accountRuntime.ts`) or accessory | Platform | `D-09` says a failed REST request must not count; only the poll path knows a request succeeded. The counter must sit where "a successful snapshot arrived" is observable, which is the per-poll `applyDevices` path, not the accessory. |
| HAP service creation, lookup, removal, and characteristic push | Accessory (`src/accessories/basementGuardian.ts` plus a new services module) | — | `basementGuardian.ts` already states "the accessory owns HomeKit and nothing else". |
| Custom service and characteristic definitions | New module under `src/accessories/` | — | They are HAP objects built from `api.hap`; nothing outside the HomeKit tier needs them. |
| `ignoredFaults` parsing and refusal | Configuration (`src/config.ts`) | Settings form (`config.schema.json`) | `validateConfig` already owns every refusal and already has the `IntegerBounds` message pattern `D-17` follows. |
| Routing `ignoredFaults` to the accessory | Platform (`src/platform.ts`) | — | `DiscoveryContext` is the only seam that reaches `createBasementGuardianAccessory`, and the platform is where the validated config already lives. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `homebridge` | `2.4.0` pinned as devDependency, supported range `^1.8.0 \|\| ^2.0.0` | Plugin host; `api.hap` is the only permitted HAP surface | Project constraint and `D-033`. `api.hap` is typed `readonly hap: typeof hapNodeJs` [VERIFIED: node_modules/homebridge/dist/api.d.ts:523], so the whole HAP module namespace is reachable without a direct import. |
| `@homebridge/hap-nodejs` | `2.2.2` (transitive, via `homebridge@2.4.0`) | Service and characteristic definitions | Bundled by Homebridge 2.x. Homebridge 1.x bundles `hap-nodejs@0.12.3` (1.8.5) / `0.13.1` (1.11.4) [VERIFIED: `npm view homebridge@1.8.5 dependencies`, `npm view homebridge@1.11.4 dependencies`]. |
| `node:test` + `node:assert/strict` | Node `^22.10.0 \|\| ^24.0.0` | Unit tests | Already the project's only runner (`.claude/rules/typescript-unit-testing.md`). |
| `@cucumber/cucumber` | `^13.2.1` | Fake-pump behaviour scenarios | Already wired under `features/`. |
| `strong-mock` | `^9.2.2` | Strict interaction mocks | Already the project's only mocking library. |

### Supporting

Nothing new. This phase adds **no dependency**.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `Service`/`Characteristic` subclasses built from `api.hap` | Direct `@homebridge/hap-nodejs` import, as `homebridge-homematicip` originally attempted | Forbidden by the project constraint and by Homebridge itself. Homebridge exports the classes as types only, so the import resolves to a second HAP copy at runtime and the plugin fails to load with `Cannot find module 'hap-nodejs'` [CITED: https://github.com/homebridge/homebridge-plugin-template/issues/20]. |
| Subclassing `hap.Service` / `hap.Characteristic` | `new hap.Characteristic(name, uuid, props)` instances added ad hoc, the shape in Homebridge's own linked example | Works and is simpler, but loses the static `UUID` that makes `getServiceById(Class, subtype)` and `getCharacteristic(Class)` type-safe and lookup-safe. The subclass form is verified to typecheck under this project's exact `strict` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` settings. |
| `LeakSensor` for the pit level | `HumiditySensor` / `AirQualitySensor` borrowing a renderable numeric | Forbidden by `D-007`, `SAFE-08`, and `HOMEKIT.md` §3.1. `WaterLevel` is declared optional on exactly one standard service, `HumidifierDehumidifier` [VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js:555-571], which is a writable control service and therefore also out. The custom Sump Pit service is the only truthful host. |

**Installation:** none. No package is added, so no registry command is needed.

## Package Legitimacy Audit

This phase installs **no external packages**. Every library it touches is already a direct or
transitive dependency verified in earlier phases.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | No package added this phase |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
 vendor REST poll ─┐
                   ├──> DeviceStateStore.applyDiscovery / applyReportedPatch   (Phase 1, unchanged)
 AWS IoT shadow ───┘                    │
                                        │ one frozen DeviceSnapshot
                                        v
                        registerDiscoveredDevices (src/platform.ts)
                                        │
                                        │ same BasementGuardianAccessory instance every poll
                                        v
        ┌───────────────── BasementGuardianAccessory.update(snapshot) ─────────────────┐
        │                                                                              │
        │  1. registry.lookup(deviceTypeId)                                            │
        │        ├── not implemented ──> whole-accessory degradation (DEV-08, D-04)    │
        │        └── implemented                                                       │
        │                │                                                             │
        │  2. family.validate(snapshot) -> FieldViolation[]                            │
        │                │                                                             │
        │  3. violations ─map by field──> untrusted TrustScope set   (reason 'invalid') │
        │                                                                              │
        │  4. family.decode(snapshot) over the scopes that validated                   │
        │                │                                                             │
        │  5. serialCommunications === false                                           │
        │        └──> water|pump|power|battery|fault untrusted                         │
        │             (reason 'controller-link-lost')            (D-11, RES-02)        │
        │                │                                                             │
        │  6. offline counter: connectivity.connected === false, N in a row  (D-09)    │
        │                │                                                             │
        │                v                                                             │
        │  7. SERVICE CATALOGUE  (one row per published service)                       │
        │       row = { kind, subtype, displayName, hapServiceClass, project(state) }  │
        │                │                                                             │
        │       for each row not suppressed by ignoredFaults:                          │
        │         ensureService(accessory, row)   getServiceById ?? addService         │
        │         ensureCharacteristics(service, row)                                  │
        │         updateCharacteristic(...) for every projected value                  │
        │         updateCharacteristic(StatusActive, !scopeUntrusted(row.scope))        │
        │         updateCharacteristic(StatusFault, rowFaultState)                     │
        │                                                                              │
        │       for each row suppressed by ignoredFaults:                              │
        │         getServiceById(...) -> removeService(...)  if present                │
        │                │                                                             │
        │  8. service set changed? -> api.updatePlatformAccessories([accessory])       │
        └──────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        v
                       HAP push to every subscribed controller
```

Everything from step 1 to step 8 runs synchronously inside `update()`. That is what `SAFE-07`
requires and what the `D-18` gate proves.

### Recommended Project Structure

```
src/
├── accessories/
│   ├── basementGuardian.ts   # extended: owns update(), trust state, offline counter wiring
│   ├── services.ts           # extended: + 'primary-pump-running' CoreServiceKind (D-13)
│   ├── serviceCatalogue.ts   # new: one row per published service, the single source of truth
│   ├── customServices.ts     # new: custom Service subclasses built from api.hap
│   ├── customCharacteristics.ts # new: custom Characteristic subclasses, read-only
│   └── waterLevel.ts         # new: the provisional D-01 ladder and D-03 threshold, one place
├── device/
│   ├── gemini.ts             # extended: field -> TrustScope map, partial decode
│   ├── family.ts             # extended: validate/decode contract for partial validity
│   └── health.ts             # unchanged types, first full production consumer
├── config.ts                 # extended: ignoredFaults parsing and D-17 refusal
├── platform.ts               # extended: route ignoredFaults into DiscoveryContext
└── runtime/
    ├── clock.ts              # unchanged
    └── timers.ts             # new: the Timers port D-18 injects
```

`waterLevel.ts` as its own module is what makes closing `G-002` a single reviewable edit, which
`03-CONTEXT.md` asks for under "Specific Ideas".

### Pattern 1: Read `Formats`, `Perms`, and `Units` off `api.hap`

**What:** The three enums are reachable through the injected `api.hap` namespace, so no direct
HAP-NodeJS import is needed.

**When to use:** Every custom characteristic definition.

**Why it works:** They are declared `export declare const enum` in the typings
[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.d.ts:12-78, quoted below]
*and* exist as real runtime objects on the module namespace, on both pinned HAP lines:

```
export declare const enum Formats {
    BOOL = "bool",
    ...
    UINT8 = "uint8",
```
```
export declare const enum Units {
    CELSIUS = "celsius",
    PERCENTAGE = "percentage",
    ARC_DEGREE = "arcdegrees",
    LUX = "lux",
    SECONDS = "seconds"
}
export declare const enum Perms {
    PAIRED_READ = "pr",
    PAIRED_WRITE = "pw",
    NOTIFY = "ev",
    EVENTS = "ev",
    ADDITIONAL_AUTHORIZATION = "aa",
    TIMED_WRITE = "tw",
    HIDDEN = "hd",
    WRITE_RESPONSE = "wr"
}
```

Runtime presence probe on the pinned 2.2.2 build printed `Formats: { BOOL: 'bool', … UINT8:
'uint8', … }`, `Perms: { PAIRED_READ: 'pr', … }`, `Units: { … PERCENTAGE: 'percentage', … }`
[VERIFIED: probe against node_modules/@homebridge/hap-nodejs]. The 0.12.3 build exports them the
same way [VERIFIED: hap-nodejs@0.12.3 package/dist/lib/Characteristic.js:3 —
`exports.Characteristic = exports.CharacteristicEventTypes = exports.ChangeReason = exports.Access = exports.Perms = exports.Units = exports.Formats = void 0;`].

`tsconfig.json` sets no `isolatedModules` and no `verbatimModuleSyntax`, so the ambient const enum
resolves. A probe file using `hap.Formats.UINT8`, `hap.Perms.PAIRED_READ`, and
`hap.Units.PERCENTAGE` compiled clean under the project's `strict` + `exactOptionalPropertyTypes` +
`noUncheckedIndexedAccess` settings [VERIFIED: `tsc --noEmit` exit 0 on the probe].

### Pattern 2: Custom `Service` and `Characteristic` subclasses through `api.hap`

**What:** Declare the subclass inside a factory that receives `hap`, because `api.hap` is a value
available only at runtime.

**Example (this exact code typechecked and ran this session):**

```typescript
// Source: verified against node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.d.ts
//         and node_modules/@homebridge/hap-nodejs/dist/lib/Service.d.ts
type Hap = API['hap'];

export function createSumpPitDefinitions(hap: Hap) {
  class RawWaterLevelCode extends hap.Characteristic {
    static readonly UUID = '…a random v4 UUID, hard-coded…';

    constructor() {
      super('Raw Water Level Code', RawWaterLevelCode.UUID, {
        format: hap.Formats.UINT8,
        perms: [hap.Perms.PAIRED_READ, hap.Perms.NOTIFY],
        minValue: 0,
        maxValue: 31,
        minStep: 1,
        validValues: [0, 1, 3, 7, 15, 31],
      });
      this.value = this.getDefaultValue();
    }
  }

  class SumpPitService extends hap.Service {
    static readonly UUID = '…a random v4 UUID, hard-coded…';

    constructor(displayName?: string, subtype?: string) {
      super(displayName, SumpPitService.UUID, subtype);
      this.addCharacteristic(hap.Characteristic.WaterLevel);
      this.addCharacteristic(RawWaterLevelCode);
      this.addOptionalCharacteristic(hap.Characteristic.StatusActive);
      this.addOptionalCharacteristic(hap.Characteristic.StatusFault);
    }
  }

  return { RawWaterLevelCode, SumpPitService };
}
```

**Why the class form over the instance form:** Homebridge's own linked example uses
`new api.hap.Characteristic(name, uuid, props)` and looks the characteristic up by display-name
string [CITED: https://github.com/jeff-winn/homebridge-example-characteristic]. The class form
carries a static `UUID`, which is what makes `getServiceById(Class, subtype)` and
`getCharacteristic(Class)` work — including on accessories restored from the Homebridge cache,
where the object is no longer an instance of the class (see Pitfall 4).

**UUID allocation (Claude's discretion in `D-15`):** generate random v4 UUIDs once and hard-code
them as literals. Do **not** build them in the Apple base namespace `-0000-1000-8000-0026BB765291`
[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/util/uuid.d.ts:3 —
`export declare const BASE_UUID = "-0000-1000-8000-0026BB765291";`], because that namespace is
Apple's assigned space and a future Apple type could collide. `hap.uuid.generate(seed)` produces a
deterministic v4-shaped UUID **outside** the Apple base
[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/util/uuid.js:13-29 — it SHA-1s the input and
fills the template `"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"`], so it is a valid fallback, but a
hard-coded literal is auditable in review and cannot drift if someone edits the seed string.

### Pattern 3: Idempotent get-or-add service reconciliation

**What:** On every `update()`, resolve each catalogue row to its service, creating it if absent and
removing it if `ignoredFaults` now suppresses it.

```typescript
// Source: verified against node_modules/homebridge/dist/platformAccessory.d.ts:33-38
//         and node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js:266-354
function ensureService(accessory: PlatformAccessory, row: ServiceRow): Service {
  return accessory.getServiceById(row.serviceClass, row.subtype)
    ?? accessory.addService(row.serviceClass, row.displayName, row.subtype);
}

function removeIfPresent(accessory: PlatformAccessory, row: ServiceRow): boolean {
  const service = accessory.getServiceById(row.serviceClass, row.subtype);

  if (service === undefined) {
    return false;
  }

  accessory.removeService(service);

  return true;
}
```

`addService` throws when the same UUID and subtype already exist, and throws when a second service
of the same UUID has no subtype at all, so the `??` is load-bearing rather than defensive
[VERIFIED: probe output — `DUP throws: Cannot add a Service with the same UUID
'00000080-0000-1000-8000-0026BB765291' and subtype 'mains-power-lost' as another Service in this
Accessory.` and `NOSUB throws: Cannot add a Service with the same UUID
'00000080-0000-1000-8000-0026BB765291' as another Service in this Accessory without also defining a
unique 'subtype' property.`].

### Pattern 4: Push-only characteristics, no `onGet`

**What:** Never register an `onGet` or `CharacteristicEventTypes.GET` handler. Push every value with
`service.updateCharacteristic(Type, value)`.

**Why:** `PLUGIN.md` §6 documents that the two error idioms are mutually exclusive and that mixing
them is a real shipping bug. Registering no getter removes the trap entirely: with no get handler,
HAP serves `characteristic.value` directly
[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:2258-2263 — the ternary
falls through to `: this.value;` when no handler is set]. It also satisfies `RES-04`'s "getters
return cached values without network calls" for free, because there are no getters.

`updateCharacteristic` also adds an optional characteristic that is not yet present
[VERIFIED: probe — `leak has StatusActive before? false` then `leak has StatusActive after
updateCharacteristic? true value= false`], so pushing `StatusActive` to a standard sensor service
needs no prior `addCharacteristic` call.

### Pattern 5: Table-driven fault adapters

**What:** Express the five fault adapters, the two activity adapters, and `Mains Power Lost` as rows
in one array with a `project(state): boolean` function per row, then loop.

**Why it is not optional:** `.fallowrc.json` runs `fallow dupes --fail-on-issues` inside
`npm run check`, and the current repository baseline is `✓ No code duplication found`
[VERIFIED: `npx fallow dupes --format human` this session]. Clone detection defaults to
`minTokens: 50`, `minLines: 5`, `minOccurrences: 2`
[VERIFIED: node_modules/fallow/schema.json:124-134]. Eight near-identical five-line adapter blocks
would be a clone family and would fail the gate.

### Anti-Patterns to Avoid

- **`getServiceById('<uuid-string>', subtype)`.** The string overload does **not** match by UUID; it
  matches only `service.displayName` or `service.name`
  [VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js:341-354, and probe output
  `getServiceById(uuid string) -> undefined`]. It compiles, because the declared signature is
  `getServiceById<T extends WithUUID<typeof Service>>(uuid: string | T, subType: string)`, and it
  silently returns `undefined` at runtime — which the get-or-add pattern would turn into an
  `addService` throw. Always pass the class.
- **`getService(Type)` for a service that has siblings.** The string overload of `getService` also
  matches on `service.subtype`, and the constructor overload returns the *first* service of that
  UUID regardless of subtype [VERIFIED: Accessory.js:327-340]. With eight `ContactSensor` services
  on one accessory this returns the wrong sibling. `PLUGIN.md` §8 says the same.
- **Publishing a service before the first family-valid decode.** Format defaults are the false
  normals: `LeakDetected` default `0`, `ContactSensorState` default `0`, `StatusLowBattery` default
  `0` [VERIFIED: probe output]. See Pitfall 1.
- **Relying on HAP to reject a bad value.** It clamps. See Pitfall 2.
- **`HapStatusError` or `updateCharacteristic(c, new Error())` for untrusted data.** Forbidden by
  `D-05` and by HAP-NodeJS's own guidance; it produces the sticky "No Response" state and erases the
  retained values `D-014` requires [CITED: https://github.com/homebridge/HAP-NodeJS/wiki/Presenting-Erroneous-Accessory-State-to-the-User].
- **`Service.BatteryService`.** Absent from `@homebridge/hap-nodejs@2.2.2`
  [VERIFIED: grep of node_modules/@homebridge/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js
  and Service.d.ts returned no match]. It exists only as a deprecated alias on the Homebridge 1.x
  line [VERIFIED: hap-nodejs@0.12.3 package/dist/lib/definitions/ServiceDefinitions.js:241 —
  `Service_1.Service.BatteryService = Battery;`]. `HOMEKIT.md` §2 names it "standard
  `BatteryService`"; the class to use is `Service.Battery`, present on both lines.
- **Building the D-01 ladder as a population count.** Explicitly forbidden by `SAFE-01` and
  `.planning/intel/constraints.md`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multiple services of the same HAP type on one accessory | A per-service wrapper class keyed by your own map | `addService(Class, displayName, subtype)` + `getServiceById(Class, subtype)` | HAP already enforces subtype uniqueness and serialises the pair into `cachedAccessories`; a parallel map would drift from what HomeKit actually published. |
| Setting the service's HomeKit name | `setCharacteristic(Characteristic.Name, displayName)` | Pass `displayName` to `addService` | The `Service` constructor already creates and sets `Name` from `displayName` [VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Service.js:368-384]. |
| Detecting whether a characteristic exists on a restored service | Reading `service.characteristics` and comparing UUIDs by hand | `service.testCharacteristic(Class)` | It already matches by `instanceof` **or** static UUID [VERIFIED: Service.js:502-514], which is exactly what a restored plain `Characteristic` needs. |
| Deriving the accessory UUID | Any hash of your own | `api.hap.uuid.generate(deviceId)` | Already in use in `src/platform.ts`; `D-004` and `DEV-04` fix the seed. |
| Cache persistence of the published service set | Writing your own JSON beside `cachedAccessories` | `api.updatePlatformAccessories([accessory])` | It replaces the cached entry and writes the file [VERIFIED: node_modules/homebridge/dist/bridgeService.js:420-428]. |
| A clock or scheduler for "immediate" transitions | Anything | Nothing at all — `update()` is synchronous | `SAFE-07` forbids a delay; the correct implementation has no timer, and `D-18` proves it. |

**Key insight:** every service-lifecycle question this phase has is already answered inside HAP, and
answered *differently* for a freshly created accessory than for one Homebridge restored from cache.
Hand-rolling around that difference is how a plugin ends up with duplicate services after a
restart.

## Runtime State Inventory

This is not a rename phase, but it changes the set of services a published accessory carries, and
that set is persisted outside the repository. The categories that matter:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Homebridge `cachedAccessories` under `api.user.storagePath()` holds, per accessory, every service (`UUID`, `subtype`, `constructorName`) and every characteristic (`UUID`, `displayName`, `props`, `value`) [VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Service.js:721-736 and Characteristic.js serialize]. | Code edit only, plus one `api.updatePlatformAccessories([accessory])` call when the service set changes. No migration script: the reconcile loop in `update()` re-adds a missing service and removes a suppressed one on the first poll after restart. |
| Live service config | Apple Home / HomeKit controller state: user automations, scenes, Activity History, and per-tile renames attached to a `serviceId` (`UUID + subtype`). Not in git, not readable by the plugin. | Removing a service through `ignoredFaults` orphans whatever the user attached to it. `HOMEKIT.md` already says Activity History goes with the service. Document it in the README; treat `ignoredFaults` as a destructive setting. |
| OS-registered state | None. The plugin registers nothing with the operating system. | None — verified by reading `src/platform.ts` and `src/runtime/accountRuntime.ts`; the only external handles are the poll timer, the MQTT socket, and the token cache file. |
| Secrets / env vars | Unchanged. `ignoredFaults` is a cosmetic list and is not a secret. The redacting logger's secret list is untouched. | None. |
| Build artifacts | `dist/` and `dist-test/` are rebuilt by `npm run build` / `npm run build:test`; `.fallowrc.json` `ignoreFindings` entries for `src/accessories/services.ts` and `src/device/health.ts` become stale as production consumers appear. | Remove `src/accessories/services.ts` from `ignoreFindings`. **Check before removing `src/device/health.ts`:** `MonitoringPath` already has a consumer (`src/runtime/accountRuntime.ts`) and `TrustScope`/`UntrustedScope` are consumed by `src/accessories/basementGuardian.ts`, but `DeviceHealth` and `DistrustReason` have no production consumer today [VERIFIED: grep across `src`, `test`, `features`]. Removing the entry before this phase gives them one fails `npm run fallow`. |

## Common Pitfalls

### Pitfall 1: A newly added service reads as a healthy sump pit

**What goes wrong:** `addService` creates characteristics at their format defaults, and for this
phase the defaults are the good-news values.

**Evidence** [VERIFIED: executable probe against `@homebridge/hap-nodejs@2.2.2`]:

```
LeakDetected default: 0            // LEAK_NOT_DETECTED
ContactSensorState default: 0      // CONTACT_DETECTED -> "all is well" under the project convention
StatusLowBattery default: 0        // BATTERY_LEVEL_NORMAL
StatusActive default (fresh): false
```

**Why it happens:** `getDefaultValue()` returns `false` for `bool` and the minimum for numeric
formats [VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1906-1935], and
every definition constructor ends with `this.value = this.getDefaultValue();`.

**How to avoid:** either create the services only inside the first family-valid `update()`, or
create them and leave `StatusActive` at its `false` default until the first valid decode sets both
the real value and `StatusActive = true`. The second is simpler and matches `D-05`'s marking
exactly. Never push a "normal" value that no snapshot produced.

**Warning signs:** an accessory that shows a full green board immediately after a Homebridge start,
before the first poll returns.

### Pitfall 2: HAP silently clamps an out-of-range value into a plausible wrong reading

**What goes wrong:** a mapping bug does not throw. It publishes a confident, wrong number.

**Evidence** [VERIFIED: executable probe]:

```
WARN: warn-message characteristic was supplied illegal value: number 150 exceeded maximum of 100
WaterLevel after 150 -> 100
WARN: warn-message characteristic value expected valid finite number and received "NaN" (number)
WaterLevel after NaN -> 100
WARN: warn-message characteristic was supplied illegal value: number -5 exceeded minimum of 0
WaterLevel after -5 -> 0
WARN2: warn-message characteristic was supplied illegal value: number 7 exceeded maximum of 1
ContactSensorState after 7 -> 1
```

`ContactSensorState = 7` becoming `1` is the worst case: under the project's own
`CONTACT_NOT_DETECTED = alarm` convention it publishes an alarm nobody reported. `NaN` is the one
value HAP refuses outright, leaving the previous value in place.

**How to avoid:** validate against the value's own domain in the mapping layer and never push a
value the lookup did not produce. `WaterLevel` also carries `minStep: 1`, so `33.3` is published as
`33` [VERIFIED: probe] — the `D-01` ladder is integral, so this is harmless here, but it means the
characteristic will never round-trip a fractional value.

**Warning signs:** `characteristic was supplied illegal value` in the Homebridge log. Treat every
occurrence as a defect, not noise.

### Pitfall 3: `getServiceById` with a UUID string always returns `undefined`

**What goes wrong:** the call compiles and returns nothing, so the get-or-add pattern falls through
to `addService`, which then throws on the duplicate.

**Evidence** [VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js:341-354]:

```js
getServiceById(uuid, subType) {
    for (const service of this.services) {
        if (typeof uuid === "string" && (service.displayName === uuid || service.name === uuid) && service.subtype === subType) {
            return service;
        }
        else {
            if (typeof uuid === "function" && ((service instanceof uuid) || (uuid.UUID === service.UUID)) && service.subtype === subType) {
                return service;
            }
        }
    }
    return undefined;
}
```

Probe confirmation: `getServiceById(custom class) -> true`, `getServiceById(uuid string) ->
undefined`.

**How to avoid:** always pass a class with a static `UUID`. This is identical on both HAP lines
[VERIFIED: hap-nodejs@0.12.3 package/dist/lib/Accessory.js:360-374, same body].

### Pitfall 4: A restored accessory's custom services are plain `Service` objects

**What goes wrong:** after a Homebridge restart, `instanceof SumpPitService` is `false`, and a
Phase 4 characteristic added to the class is not on the restored service.

**Evidence** [VERIFIED: executable probe round-tripping through
`PlatformAccessory.serialize` / `deserialize`]:

```
restored custom service found? true
restored is instanceof SumpPitService? false
restored ctor name: Service
getCharacteristic(RawWaterLevelCode) -> 15
getCharacteristic(WaterLevel) -> 60
restored char props raw: {"format":"uint8","perms":["pr","ev"],"minValue":0,"maxValue":31,"minStep":1,"validValues":[0,1,3,7,15,31]}
restored chars: [ 'Name:Name', 'Water Level:WaterLevel', 'Raw Water Level Code:Characteristic', 'Status Active:StatusActive' ]
restored contact instanceof ContactSensor? true ContactSensor
```

The cause is `Service.deserialize`, which reconstructs the subclass only when
`Service[json.constructorName]` exists — true for `ContactSensor`, false for a plugin's own class
[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Service.js:740-758; identical at
hap-nodejs@0.12.3 package/dist/lib/Service.js:582-600]. `Characteristic.deserialize` behaves the
same way [VERIFIED: Characteristic.js:2317-2331].

Three consequences the planner must design for:

1. Lookup still works, because `getServiceById` falls back to `uuid.UUID === service.UUID`. Good.
2. **The restored characteristic keeps the props from the cache file, not from current code.**
   Changing `validValues` or `maxValue` in a later release will not reach an already-cached
   accessory unless the code calls `setProps` on it. Note it now; it will bite when `G-002` closes
   and the ladder changes.
3. **Adding a characteristic in Phase 4 logs a warning on every restored accessory** unless the code
   declares it first. Probe:

```
has PumpObservedCount before? false
[BG@Primary Pump@Observed Activations] Characteristic not in required or optional characteristic section for service Service. Adding anyway.
WARNING EMITTED: warn-message | Characteristic not in required or optional characteristic section for service Service. Adding anyway.
```

The fix is verified and belongs in the Phase 3 shape of the custom Pump service, which is exactly
the discretion item `03-CONTEXT.md` names ("the shape of the custom Pump service so that Phase 4 can
add its record characteristics without changing the subtype"):

```typescript
// Verified: this suppresses the warning entirely.
if (!service.testCharacteristic(CharacteristicClass)
    && !service.optionalCharacteristics.some((c) => c.UUID === CharacteristicClass.UUID)) {
  service.addOptionalCharacteristic(CharacteristicClass);
}
service.updateCharacteristic(CharacteristicClass, value);
```

Probe result: `FIX: warned? false value= 9 optionalCount= 1`. **`addOptionalCharacteristic` is not
idempotent** — calling it twice pushes two entries (`after 2nd addOptionalCharacteristic,
optionalCount= 2`), so the `some(...)` guard is required, not cosmetic.

### Pitfall 5: An injected timer spy alone does not prove `SAFE-07`

**What goes wrong:** `D-18` asks for an injected timer factory recording zero calls. That catches a
debounce written through the injected port and a debounce written through `globalThis.setTimeout`.
It does **not** catch a debounce written the way this codebase already writes every other wait.

**Evidence** [VERIFIED: executable `node --test` probe]: `node:timers/promises` does not route
through the global. Spying `globalThis.setTimeout` and then awaiting `timers.setTimeout(1)` printed
`global setTimeout callCount after timers/promises: 0`. `src/runtime/accountRuntime.ts:221`,
`src/runtime/retryPolicy.ts:60`, and `src/cloud/mqttTransport.ts:107` all use exactly that import,
so it is the house style a future author would reach for.

**How to avoid:** gate `SAFE-07` with all four layers. Each is independently falsifiable:

1. **Injected `Timers` port** mirroring `src/runtime/clock.ts`, asserting zero calls. This is what
   `D-18` names.
2. **Global timer spies.** `t.mock.method(globalThis, 'setTimeout' | 'setInterval' | 'setImmediate'
   | 'queueMicrotask')`, all asserting zero calls. Verified to work, and verified to *detect* a
   planted `setTimeout` call [VERIFIED: probe — the negative-control case asserted
   `setTimeoutSpy.mock.callCount() === 1` and passed].
3. **Synchronous-visibility assertion.** Read the characteristic value on the statement immediately
   after `update()` returns, with no `await` and no tick. This is the layer that catches the
   `node:timers/promises` escape and any promise-based deferral, because an awaited delay cannot
   have written the characteristic before `update()` returned.
4. **Static import gate.** A test that reads every file under `src/accessories/` and asserts none
   imports `node:timers` or `node:timers/promises`. Cheap, and it names the failure precisely.

Because "a passing test is not evidence" is a carried hazard, the plan must include a
**negative control** for this gate: a deliberately debounced variant of the transition, shown to
fail each layer, kept private to the test that proves it.

### Pitfall 6: The clone gate and the unit-size gate both bite a thirteen-service publisher

**What goes wrong:** `npm run check` fails on style gates rather than behaviour.

**Constraints** [VERIFIED: `.fallowrc.json`]: `health.maxCyclomatic: 20`, `maxCognitive: 15`,
`maxUnitSize: 60`, `maxCrap: 0`, `duplicates.threshold: 3`, and the pipeline is
`fallow dead-code --fail-on-issues && fallow health --fail-on-issues && fallow dupes
--fail-on-issues`. Current duplication baseline is zero [VERIFIED: `npx fallow dupes` this session].

**How to avoid:** one catalogue array plus one small loop, not thirteen inline blocks. Keep every
function under sixty lines.

### Pitfall 7: `.fallowrc.json` serialises a parallel wave

**What goes wrong:** two plans in the same wave both edit `.fallowrc.json` `ignoreFindings` and
collide. This is the carried Phase 1/2 hazard and it applies here: `src/accessories/services.ts`
comes out of `ignoreFindings`, and `src/device/health.ts` may or may not (see Runtime State
Inventory).

**How to avoid:** put every `.fallowrc.json` edit in a single plan, and place that plan in a wave of
its own or last in its wave.

### Pitfall 8: `npm run check` is not a green gate on one run

Carried from Phase 1. Run it at least three consecutive times before claiming it passes. And
`npm run test:coverage:direct` takes **two** arguments, the include value and the test path:

```bash
npm run test:coverage:direct -- "dist-test/src/accessories/serviceCatalogue.js" "dist-test/test/accessories/serviceCatalogue.test.js"
```

### Pitfall 9: The Cucumber fake HAP cannot express this phase

**What goes wrong:** production code calls `addService(Class, displayName, subtype)` and the harness
fake has a different signature.

**Evidence** [VERIFIED: features/support/fakeHomebridgeApi.ts:41,169-180]: the fake declares
`addService(identifier: FakeIdentifier, subtype?: string): FakeService`, a two-argument form whose
second parameter is the subtype. Called with the real three-argument form it would record the
display name as the subtype. The fake also has no `updateCharacteristic`, no `removeService`, no
`testCharacteristic`, no `addOptionalCharacteristic`, and no `optionalCharacteristics`.

**How to avoid:** budget a plan for extending `features/support/fakeHomebridgeApi.ts` to the real
signatures before the scenario plans depend on it. Keep the hand-built approach — the file's own
`@fileoverview` explains why it is not the real HAP — but match the real API shape exactly, or the
scenarios prove nothing about production behaviour.

## Code Examples

### Reading every characteristic this phase needs, from the pinned typings

Verbatim from `node_modules/@homebridge/hap-nodejs/dist/lib/definitions/CharacteristicDefinitions.js`
[VERIFIED, line numbers given per entry]:

```js
// :1568
class LeakDetected extends Characteristic {
    static UUID = "00000070-0000-1000-8000-0026BB765291";
    static LEAK_NOT_DETECTED = 0;
    static LEAK_DETECTED = 1;
    constructor() {
        super("Leak Detected", LeakDetected.UUID, {
            format: "uint8", perms: ["ev", "pr"],
            minValue: 0, maxValue: 1, minStep: 1, validValues: [0, 1],
        });
```
```js
// :647
class ContactSensorState extends Characteristic {
    static UUID = "0000006A-0000-1000-8000-0026BB765291";
    static CONTACT_DETECTED = 0;
    static CONTACT_NOT_DETECTED = 1;
    constructor() {
        super("Contact Sensor State", ContactSensorState.UUID, {
            format: "uint8", perms: ["ev", "pr"],
            minValue: 0, maxValue: 1, minStep: 1, validValues: [0, 1],
        });
```
```js
// :4452
class WaterLevel extends Characteristic {
    static UUID = "000000B5-0000-1000-8000-0026BB765291";
    constructor() {
        super("Water Level", WaterLevel.UUID, {
            format: "float", perms: ["ev", "pr"], unit: "percentage",
            minValue: 0, maxValue: 100, minStep: 1,
        });
```
```js
// :3318
class StatusActive extends Characteristic {
    static UUID = "00000075-0000-1000-8000-0026BB765291";
    constructor() {
        super("Status Active", StatusActive.UUID, {
            format: "bool", perms: ["ev", "pr"],
        });
```
```js
// :3333
class StatusFault extends Characteristic {
    static UUID = "00000077-0000-1000-8000-0026BB765291";
    static NO_FAULT = 0;
    static GENERAL_FAULT = 1;
    constructor() {
        super("Status Fault", StatusFault.UUID, {
            format: "uint8", perms: ["ev", "pr"],
            minValue: 0, maxValue: 1, minStep: 1, validValues: [0, 1],
        });
```
```js
// :3375
class StatusLowBattery extends Characteristic {
    static UUID = "00000079-0000-1000-8000-0026BB765291";
    static BATTERY_LEVEL_NORMAL = 0;
    static BATTERY_LEVEL_LOW = 1;
    constructor() {
        super("Status Low Battery", StatusLowBattery.UUID, {
            format: "uint8", perms: ["ev", "pr"],
            minValue: 0, maxValue: 1, minStep: 1, validValues: [0, 1],
        });
```
```js
// :290
class BatteryLevel extends Characteristic {
    static UUID = "00000068-0000-1000-8000-0026BB765291";
    constructor() {
        super("Battery Level", BatteryLevel.UUID, {
            format: "uint8", perms: ["ev", "pr"], unit: "percentage",
            minValue: 0, maxValue: 100, minStep: 1,
        });
```
```js
// :540
class ChargingState extends Characteristic {
    static UUID = "0000008F-0000-1000-8000-0026BB765291";
    static NOT_CHARGING = 0;
    static CHARGING = 1;
    static NOT_CHARGEABLE = 2;
    constructor() {
        super("Charging State", ChargingState.UUID, {
            format: "uint8", perms: ["ev", "pr"],
            minValue: 0, maxValue: 2, minStep: 1, validValues: [0, 1, 2],
        });
```
```js
// :1972
class Name extends Characteristic {
    static UUID = "00000023-0000-1000-8000-0026BB765291";
    constructor() {
        super("Name", Name.UUID, { format: "string", perms: ["pr"], maxLen: 64 });
```
```js
// :617
class ConfiguredName extends Characteristic {
    static UUID = "000000E3-0000-1000-8000-0026BB765291";
    constructor() {
        super("Configured Name", ConfiguredName.UUID, {
            format: "string", perms: ["ev", "pr", "pw"],
        });
```

Summarised, with the service membership read from
`node_modules/@homebridge/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js`
[VERIFIED: LeakSensor :640-653, ContactSensor :334-347, Battery :198-209,
HumidifierDehumidifier :555-571]:

| Characteristic | Format | Perms | Valid values / range | Required on | Optional on (this phase) |
|---|---|---|---|---|---|
| `LeakDetected` | `uint8` | `ev`, `pr` | `[0, 1]`, step 1 | `LeakSensor` | — |
| `ContactSensorState` | `uint8` | `ev`, `pr` | `[0, 1]`, step 1 | `ContactSensor` | — |
| `WaterLevel` | `float`, `percentage` | `ev`, `pr` | 0–100, step 1 | — | `HumidifierDehumidifier` only; hence the custom Sump Pit service |
| `StatusFault` | `uint8` | `ev`, `pr` | `[0, 1]`, step 1 | — | `LeakSensor`, `ContactSensor` (and 9 other sensor services) |
| `StatusActive` | `bool` | `ev`, `pr` | `true` / `false`, default `false` | — | `LeakSensor`, `ContactSensor` (11 services declare it) |
| `StatusLowBattery` | `uint8` | `ev`, `pr` | `[0, 1]`, step 1 | **`Battery`** | `LeakSensor`, `ContactSensor` |
| `BatteryLevel` | `uint8`, `percentage` | `ev`, `pr` | 0–100, step 1 | — | `Battery` |
| `ChargingState` | `uint8` | `ev`, `pr` | `[0, 1, 2]`, step 1 | — | `Battery` |
| `Name` | `string`, `maxLen 64` | `pr` (read-only) | — | added automatically by the `Service` constructor from `displayName` | `LeakSensor`, `ContactSensor`, `Battery` |
| `ConfiguredName` | `string` | `ev`, `pr`, **`pw`** | — | `InputSource`, `Television` | not needed here; it is writable, so it is a user-rename surface, not a plugin fact |

`Service.Battery` requires only `StatusLowBattery` and declares `BatteryLevel`, `ChargingState`,
and `Name` optional [VERIFIED: ServiceDefinitions.js:198-209] — identical on the 1.x line
[VERIFIED: hap-nodejs@0.12.3 package/dist/lib/definitions/ServiceDefinitions.js:225-241].

### Publishing one fault adapter, end to end

```typescript
// Source: composed from the verified HAP behaviours above.
const service = accessory.getServiceById(hap.Service.ContactSensor, 'water-sensor-fault')
  ?? accessory.addService(hap.Service.ContactSensor, 'Water Sensor Fault', 'water-sensor-fault');

// CONTACT_NOT_DETECTED (1) is the alarm state, per HOMEKIT.md §2.
service.updateCharacteristic(
  hap.Characteristic.ContactSensorState,
  telemetry.waterSensorFault
    ? hap.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
    : hap.Characteristic.ContactSensorState.CONTACT_DETECTED,
);

// D-05: the scope this adapter reads from is untrusted, so mark it inactive and keep the value.
service.updateCharacteristic(hap.Characteristic.StatusActive, !untrustedScopes.has('fault'));

// D-008: the owning service also carries StatusFault for Eve-class controllers.
service.updateCharacteristic(
  hap.Characteristic.StatusFault,
  telemetry.waterSensorFault
    ? hap.Characteristic.StatusFault.GENERAL_FAULT
    : hap.Characteristic.StatusFault.NO_FAULT,
);
```

Note the interaction the planner has to decide: when a scope is untrusted, `StatusActive` goes
false but the retained `ContactSensorState` value stays. That is exactly `D-014` and `D-05`
together, and it is the reason no `StatusFault` change is made for an *untrusted* scope —
`StatusFault` stays reserved for the five vendor-reported conditions, per the Phase 2 decision
recorded in `STATE.md`.

### The `ignoredFaults` refusal message shape

`src/config.ts` already has the pattern `D-17` follows [VERIFIED: src/config.ts:71-83]:

```typescript
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

`firstRefusal` checks fields in one fixed order and returns on the first failure, so the new check
joins the existing `??` chain at `src/config.ts:119`. The message must name the bad slug and
enumerate all seven valid ones, per `D-17`.

### The `Timers` port, mirroring `Clock`

`src/runtime/clock.ts` is eleven lines [VERIFIED: read this session]:

```typescript
export interface Clock {
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};
```

The `D-18` port follows the same shape, and the accessory takes it by injection and never calls it:

```typescript
/** Source of deferred execution. Injected so a test can prove nothing defers. */
export interface Timers {
  setTimeout(handler: () => void, delayMs: number): unknown;
  setInterval(handler: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
  clearInterval(handle: unknown): void;
}
```

### Cucumber: advancing the clock by zero

`features/support/world.ts:206-209` already exposes `advanceClock(milliseconds)`, and
`features/support/steps/shadow.ts:169-173` binds `When('the scenario clock moves forward', …)` to a
60-second step [VERIFIED: read this session]. `D-18`'s "advance by zero" scenario adds one sibling
step in the same module:

```gherkin
When the vendor changes these device fields:
  | water_level | 31 |
When the scenario clock does not move
Then the sump pit flood sensor reports a leak
```

with the step definition calling `this.advanceClock(0)` — the same seam, a different amount.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Service.BatteryService` | `Service.Battery` | Alias removed on the `@homebridge/hap-nodejs` 1.x/2.x line; still present in `hap-nodejs@0.12.3` | Use `Service.Battery`; `HOMEKIT.md` §2's "standard `BatteryService`" wording is stale [VERIFIED: absent from 2.2.2, present at 0.12.3 ServiceDefinitions.js:241]. |
| No name validation | `checkName()` warns on a name that does not start and end with a Unicode letter or number | Added on the HAP 2.x line; absent from `hap-nodejs@0.12.3` [VERIFIED: `util/checkName.js` exists in 2.2.2, no such file in 0.12.3] | Benign here: all thirteen `D-14` names plus `Backup Battery` and `Raw Water Level Code` pass the regex [VERIFIED: all fifteen names tested against `/^[\p{L}\p{N}][\p{L}\p{N}\p{Zs}’'&!._:;()\/,-]*[\p{L}\p{N}]$/u`, all `OK`]. A single-character service name would warn. |
| Plugins importing `hap-nodejs` directly for custom characteristics | Subclass through `api.hap` | Long-standing; Homebridge links the workaround from its plugin template README | Matches the project constraint already [CITED: https://github.com/homebridge/homebridge-plugin-template/issues/20]. |

**Deprecated / outdated:**

- Homebridge 1.x's `getServiceByUUIDAndSubType` — marked `@deprecated use getServiceById directly`
  and absent from the Homebridge 2.x typings [VERIFIED: homebridge@1.11.4
  package/lib/platformAccessory.d.ts:45-48 vs node_modules/homebridge/dist/platformAccessory.d.ts].
  Do not use it.
- `homebridge-lib` — still a runtime dependency per `STATE.md`, removal scheduled for Phase 6, and
  `D-033` forbids relying on it. Nothing in this phase should reach for it.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Apple Home on current iOS still leaves a `StatusActive = false` sensor usable as an automation trigger, and shows the state only as a "Status Active" row in accessory settings. | Summary, `D-05` | If wrong, `D-05` is reopened and a user's flood automation would silently stop firing exactly when the plugin distrusts its data. No source found this session supports the failure mode, and the source `03-CONTEXT.md` cites does not say it, but no source proves the safe behaviour on current iOS either. **This is the phase's top human-verification item.** |
| A2 | Removing a HomeKit service orphans the user automations, scenes, and Activity History attached to it, and Apple Home does not migrate them. | Runtime State Inventory | If wrong, the README overstates how destructive `ignoredFaults` is. Low harm. Verified structurally on the plugin side (`removeService` splices the service and emits a configuration change); the controller-side consequence is inferred, not observed. |
| A3 | Apple Home renders nothing for a custom (non-Apple) service or characteristic UUID, while Eve and Controller for HomeKit show them. | Standard Stack, `D-15` | If wrong in the permissive direction, no harm. If Apple Home renders a custom service badly, the tile list gets noisier than `HOMEKIT.md` predicts. Widely stated in the Homebridge community; no first-party Apple documentation found. |
| A4 | `duplicates.threshold: 3` in `.fallowrc.json` means a maximum duplication percentage of 3, so a clone family introduced by this phase fails `fallow dupes --fail-on-issues`. | Pitfall 6 | If the flag is more permissive than read, the table-driven design is still the right one; only the urgency changes. Read from `node_modules/fallow/schema.json:125`, which describes `threshold` as "max duplication percentage, 0 = no limit". |
| A5 | An `ignoredFaults` array expressed as `{ type: 'array', uniqueItems: true, items: { type: 'string', enum: [...seven slugs] } }` renders acceptably in the Homebridge Plugin Settings GUI under `strictValidation: true`. | Architecture Patterns | If the GUI renders it poorly, administrators fall back to editing `config.json`, which `D-17`'s refusal message already supports. The runtime validation in `src/config.ts` is authoritative either way. Not verified against a running Homebridge UI. |
| A6 | The `Sump Pit Flood` `LeakSensor` remains eligible for Apple Home flood notifications while `StatusActive` is false. | `D-05` | Same failure mode as A1, and covered by the same real-home check. `G-004` already requires validating Leak Sensor notification delivery in a real eligible Apple home, so this rides along at no extra cost. |

## Open Questions

1. **Does `StatusActive = false` change Apple Home automation eligibility on current iOS?**
   - What we know: the cited source (`homebridge/HAP-NodeJS#375`) does not claim this; its actual
     subject is that Apple Home offered no numeric-value automation triggers in 2017, and its one
     `StatusActive` comment reports the tile staying greyed with `StatusActive` set to *true*.
     ebaauw, maintainer of `homebridge-hue` and `homebridge-lib`, wrote "I don't think Home does
     anything with it"; the reporter in that thread confirmed it appears as a settings row and
     cannot itself be an automation trigger. HAP-NodeJS's own wiki recommends `StatusActive = false`
     as the non-disruptive way to present untrusted state.
   - What's unclear: Apple Home's behaviour in 2026. No authoritative source describes it, and no
     Apple home was available this session.
   - Recommendation: keep `D-05` as decided and **add a human-verification item** to this phase:
     in a real Apple home with a current home hub, build an automation on the `Sump Pit Flood` Leak
     Sensor, force the plugin into a degraded scope, and confirm the automation still exists and
     still fires. Fold it into the `G-003` / `G-004` real-home session that the project already
     requires, so it costs one extra check rather than a separate trip.

2. **Where does the `D-09` offline-confirmation counter live?**
   - What we know: it must not count a failed REST request, and only the poll path knows a request
     succeeded. `applyDevices` in `src/runtime/accountRuntime.ts:235` runs once per successful
     inventory, and `updateDiscoveredDevice` in `src/platform.ts:117` runs once per device inside
     it. `DeviceSnapshot.connectivity` carries `connected`.
   - What's unclear: whether the counter belongs beside the existing `reconciliation` instance in
     the runtime, or in the accessory's closure beside `lastTrustedAt` and `degraded`.
   - Recommendation: the accessory closure, because `update(snapshot)` is only ever called from a
     successful poll or a shadow patch, and the accessory already owns per-device state that must
     survive across polls and be discarded on confirmed removal (`removeDiscoveredDevice` deletes
     the instance, `src/platform.ts:218`). Shadow patches would also need to be excluded from the
     count, since `D-09` says "successful snapshots" from polls; confirm this in planning.

3. **Does `src/device/health.ts` come out of `.fallowrc.json` `ignoreFindings` this phase?**
   - What we know: `DeviceHealth` and `DistrustReason` have no production consumer today; the other
     three declarations do.
   - What's unclear: whether the `D-11` work gives `DistrustReason` a production consumer (likely
     yes — `reason: 'controller-link-lost'` must be constructed somewhere) and whether anything
     constructs a `DeviceHealth`.
   - Recommendation: leave the entry in place unless the phase genuinely gives every declaration a
     consumer, and verify with `npm run fallow` before removing it. A speculative removal fails the
     gate and serialises a wave for nothing.

4. **`HOMEKIT.md` §8 in `PLUGIN.md` proposes namespaced subtypes (`fault.water-sensor`).**
   - What we know: `D-12` locks the bare slug (`'water-sensor-fault'`), and `D-12` is a one-way
     decision.
   - What's unclear: nothing. `D-12` wins; the `PLUGIN.md` snippet predates it.
   - Recommendation: note the discrepancy in the plan so a reviewer reading `PLUGIN.md` does not
     file it as a defect, and consider correcting `PLUGIN.md` §8 as a documentation task.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, tests, runtime | ✓ | v26.7.0 locally; CI must exercise `^22.10.0 \|\| ^24.0.0` | — |
| `homebridge` (dev) | Typecheck, `api.hap` typings | ✓ | 2.4.0 | — |
| `@homebridge/hap-nodejs` | Service/characteristic definitions | ✓ | 2.2.2 (transitive) | — |
| `hap-nodejs` 0.12.x / 0.13.x (Homebridge 1.x line) | `REL-01` compatibility claim | ✗ not installed | — | Behaviour differences for this phase were checked by unpacking `hap-nodejs@0.12.3` from the registry and diffing the relevant definitions; a real Homebridge 1.x run is a Phase 6 concern. |
| `@cucumber/cucumber` | Scenario tests | ✓ | 13.x | — |
| `fallow` | `npm run check` gates | ✓ | 3.x | — |
| Real Apple home with current home hub | A1, A6 verification | ✗ | — | **No fallback.** The `StatusActive` automation question cannot be settled without one. It is a human-verification item, not a blocker on writing the code. |
| Real Gemini hardware | `G-002` water-level ladder | ✗ | — | Constants stay provisional; `SAFE-01` explicitly permits this and `G-002` blocks only `1.0.0`. |

**Missing dependencies with no fallback:**

- A real Apple home. Every Apple-Home-rendering claim in this document is `[ASSUMED]` for that
  reason, and each one is routed to a human-verification item rather than a code decision.

**Missing dependencies with fallback:**

- Homebridge 1.x runtime. Substituted by reading the published `hap-nodejs@0.12.3` package from the
  registry, which settled every 1.x-vs-2.x question this phase raises.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (Node `^22.10.0 \|\| ^24.0.0`) + `node:assert/strict` + `strong-mock@^9.2.2`; `@cucumber/cucumber@^13.2.1` for scenarios |
| Config file | `package.json` scripts; `cucumber.json`; `tsconfig.test.json` (compiles `src`, `test`, `features` into `dist-test/`) |
| Quick run command | `node --test dist-test/test/accessories/<module>.test.js` (after `npm run build:test`) |
| Full suite command | `npm run check` (`typecheck` → `lint` → `fallow` → `format:check` → `test`) |

Focused coverage, which the project requires at 100% lines/branches/functions per source-test pair,
takes **two** arguments:

```bash
npm run test:coverage:direct -- "dist-test/src/<path>.js" "dist-test/test/<path>.test.js"
```

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAFE-01 | Every legal code maps through the explicit ladder; `31` → 100; `0` → 0 with `NO_FAULT` | unit (data-driven, one `test()` per row) | `node --test dist-test/test/accessories/waterLevel.test.js` | ❌ Wave 0 |
| SAFE-01 | An out-of-domain code never reaches the lookup; it faults the `water` scope only | unit | `node --test dist-test/test/device/gemini.test.js` | ✅ exists, extend |
| SAFE-01 | `Sump Pit Flood` reports `LEAK_DETECTED` only at `31` | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ❌ Wave 0 |
| SAFE-02 | Both Pump services and both activity ContactSensors follow their booleans | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ❌ Wave 0 |
| SAFE-02 | Eight `ContactSensor` services coexist on one accessory under distinct subtypes | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ exists, extend |
| SAFE-03 | A backup-pump activation during `test_running` still publishes immediately | integration (Cucumber) | `npm run test:cucumber` | ❌ Wave 0 (new `.feature`) |
| SAFE-04 | Five adapters transition independently; no aggregate adapter exists | unit (data-driven) | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ❌ Wave 0 |
| SAFE-04 | Owning-service `StatusFault` moves with its adapter | unit | same | ❌ Wave 0 |
| SAFE-05 | `Mains Power Lost` follows `ac_power === false` independently of pump faults | unit | same | ❌ Wave 0 |
| SAFE-06 | `StatusLowBattery` is `LOW` for `battery_voltage_low` or health `1`/`2`/`32`, `NORMAL` for `4`/`8`/`16` | unit (data-driven, 6 health rows × 2 voltage states) | same | ❌ Wave 0 |
| SAFE-06 | `BatteryLevel` publishes `1→25, 2→50, 4→75, 8→100` with no cross-field arbitration | unit (data-driven) | same | ❌ Wave 0 |
| SAFE-06 | `ChargingState` never publishes `NOT_CHARGEABLE` | unit | same | ❌ Wave 0 |
| SAFE-06 | No `FilterMaintenance` service is ever added | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ exists, extend |
| SAFE-07 | The injected `Timers` port records zero calls across a source-change transition | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ exists, extend |
| SAFE-07 | `globalThis.setTimeout`/`setInterval`/`setImmediate`/`queueMicrotask` record zero calls | unit | same | ✅ exists, extend |
| SAFE-07 | The characteristic already carries the new value on the statement after `update()` returns | unit | same | ✅ exists, extend |
| SAFE-07 | No file under `src/accessories/` imports `node:timers` or `node:timers/promises` | unit (static gate) | `node --test dist-test/test/accessories/timerFreedom.test.js` | ❌ Wave 0 |
| SAFE-07 | Negative control: a deliberately debounced variant fails each of the four layers | unit | same files, private control | ❌ Wave 0 |
| SAFE-07 | The settings form carries no alert-delay key | unit | `node --test dist-test/test/configSchema.test.js` | ✅ exists, extend the key-set case from six to seven keys |
| SAFE-07 | The adapter has already transitioned when the scenario clock moves by zero | integration (Cucumber) | `npm run test:cucumber` | ❌ Wave 0 (new step + `.feature`) |
| SAFE-08 | Every custom characteristic is read-only (`perms` exactly `['pr', 'ev']`) | unit | `node --test dist-test/test/accessories/customCharacteristics.test.js` | ❌ Wave 0 |
| SAFE-08 | The raw `water_level` code is published beside the mapped percentage | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ❌ Wave 0 |
| SAFE-08 | No custom UUID falls in the Apple base namespace `-0000-1000-8000-0026BB765291` | unit | `node --test dist-test/test/accessories/customCharacteristics.test.js` | ❌ Wave 0 |
| CONF-06 | An unknown slug refuses, and the message names the bad slug and lists all seven valid ones | unit | `node --test dist-test/test/config.test.js` | ✅ exists, extend |
| CONF-06 | A duplicate slug refuses | unit | same | ✅ exists, extend |
| CONF-06 | An accepted slug un-publishes only that ContactSensor; the condition, the owning service's status, and the Battery service all remain | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ exists, extend |
| CONF-06 | `Sump Pit Flood` and the Battery service cannot be suppressed | unit | same | ✅ exists, extend |
| CONF-06 | The settings form offers `ignoredFaults` with the seven-slug enum and `uniqueItems` | unit | `node --test dist-test/test/configSchema.test.js` | ✅ exists, extend |
| RES-01 | One invalid field faults exactly one scope; every other scope keeps publishing | unit (data-driven, one row per field) | `node --test dist-test/test/device/gemini.test.js` | ✅ exists, extend |
| RES-01 | An invalid update never clears an already-active safety condition | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ exists, extend |
| RES-01 | A partial heartbeat leaves untouched scopes trusted | integration (Cucumber) | `npm run test:cucumber` | ✅ `features/shadowMerge.feature` exists, extend |
| RES-02 | `serial_communications === false` activates `Pump Controller Link Lost` and marks five scopes `controller-link-lost` while `connectivity` stays trusted | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ exists, extend |
| RES-02 | `lastTrustedAt` reports when trustworthy controller data last arrived | unit | same | ✅ exists, extend |
| RES-03 (Phase 3 half) | `Basement Guardian Offline` activates only after N consecutive successful disconnected snapshots; a failed request never counts; any connected snapshot resets | unit (data-driven over N = 1, 2, 8) | same | ✅ exists, extend |

### Sampling Rate

- **Per task commit:** `node --test dist-test/test/<the touched pair>.test.js`, then
  `npm run test:coverage:direct -- "dist-test/src/<module>.js" "dist-test/test/<module>.test.js"`.
- **Per wave merge:** `npm run test` (unit + Cucumber).
- **Phase gate:** `npm run check` green **three consecutive times** before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `test/accessories/waterLevel.test.ts` — covers SAFE-01
- [ ] `test/accessories/serviceCatalogue.test.ts` — covers SAFE-01, SAFE-02, SAFE-04, SAFE-05, SAFE-06, SAFE-08
- [ ] `test/accessories/customServices.test.ts` — covers SAFE-08
- [ ] `test/accessories/customCharacteristics.test.ts` — covers SAFE-08
- [ ] `test/accessories/timerFreedom.test.ts` — covers SAFE-07 (static import gate + negative control)
- [ ] `test/runtime/timers.test.ts` — pairs the new `src/runtime/timers.ts` port
- [ ] Extend `features/support/fakeHomebridgeApi.ts` to the real HAP signatures: three-argument
      `addService(Class, displayName, subtype)`, `updateCharacteristic`, `removeService`,
      `testCharacteristic`, `addOptionalCharacteristic`, `optionalCharacteristics`, and a
      characteristic store a step can read back. **Do this before any scenario plan depends on it.**
- [ ] New step in `features/support/steps/shadow.ts`: `When the scenario clock does not move`
- [ ] New feature file for safety-condition transitions (`features/safetyConditions.feature`)
- [ ] No framework install needed — `node:test` and Cucumber are already wired.

## Security Domain

`security_enforcement` is `true` with `security_asvs_level: 1`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Unchanged by this phase; Auth0 handling is Phase 1 and untouched here. |
| V3 Session Management | no | No session surface. |
| V4 Access Control | no | The plugin exposes no server of its own; HAP pairing is Homebridge's. |
| V5 Input Validation | **yes** | Two untrusted inputs: the vendor telemetry payload and the administrator's `config.json`. Telemetry is validated by the existing hand-written predicate narrowing in `src/device/gemini.ts` (`requiredBoolean`, `requiredEnum`, `optionalNumber`, `optionalString`) — extend that, never add `as` assertions. `ignoredFaults` is validated in `src/config.ts` against a closed seven-value set, refusing anything else (`D-17`). |
| V6 Cryptography | no | No new cryptography. `api.hap.uuid.generate` is not used as a security primitive. |
| V7 Error Handling & Logging | **yes** | `D-027` and `AUTH-02` keep credentials, tokens, account identifiers, and raw responses out of logs. Every new log line goes through `createRedactingLogger`. The `D-17` refusal message quotes the *slug*, which is administrator-authored text, so it must be handled the way `describeValue` already handles a bad `pollInterval` — and it must never quote the account email, which `src/config.ts:107` deliberately avoids. |
| V8 Data Protection | **yes** | `accessory.context` and `cachedAccessories` are written to disk in plain text. This phase adds no field to `accessory.context`; every new value lives in HAP characteristics. Keep it that way: `D-027` forbids account identifiers in context, and the vendor `deviceId` is already the only identifier there. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A hostile or changed vendor payload becomes a plausible HomeKit reading | Tampering | Fail-closed field validation before decode; explicit legal-value lookup; never publish a value the lookup did not produce. Already the project's core invariant. |
| HAP clamps an out-of-range value into a believable one | Tampering / Information Disclosure (false assurance) | Validate before pushing; treat `characteristic was supplied illegal value` in the log as a defect. See Pitfall 2. |
| A newly created service publishes format defaults that read as "all is well" | Spoofing (of device state) | Leave `StatusActive` false until the first family-valid decode. See Pitfall 1. |
| A configuration typo silently unmonitors the sump pump | Denial of Service (of the safety function) | `D-17` refuses the configuration and names the offending slug plus all valid ones. |
| An administrator-supplied string reaches a log line | Information Disclosure / log injection | Route through `createRedactingLogger`; reuse the existing `describeValue` treatment; never interpolate a credential or an account email. |
| A prototype-polluting vendor JSON key reaches domain state | Tampering | Already mitigated: `src/device/gemini.ts` reads every field by name and never spreads `snapshot.data`, and `src/device/state.ts` deep-freezes both opaque records. Preserve both properties in the new decode path. |

## Project Constraints (from CLAUDE.md)

Directives the planner must honour, extracted from `CLAUDE.md` and `.claude/rules/`:

**Process**

- Read a file before editing it; trace a function's callers before modifying it.
- Never commit to `main`. Feature branches are `features/*`; worktrees under `.worktrees/`.
- Run `pre-commit run --all-files` (or `--files <changed>`) **before** `git commit`. Never
  `--no-verify`. Never `--amend` to recover from a hook failure.
- From a worktree, prefix with `SKIP=trufflehog` only after a clean filesystem scan
  (`trufflehog filesystem <paths> --results=verified,unknown --fail`).
- Never rebase or rewrite history. Merge to update.
- Conventional Commits; title 5–72 characters; body lines ≤ 80. No milestone or phase references.
- Do not make repo edits outside a GSD workflow.

**Runtime and compatibility**

- TypeScript ESM on Node `^22.10.0 || ^24.0.0`; relative imports carry `.js`.
- Homebridge `^1.8.0 || ^2.0.0`. Use only HAP objects supplied by `api.hap`. **Never import
  HAP-NodeJS directly at runtime.**
- Safety semantics: an unknown, stale, omitted, or invalid value never becomes a guessed
  measurement or a normal default. Preserve the last valid value; mark the narrowest affected
  scope untrustworthy.
- Identity: vendor `deviceId` is the immutable UUID seed; `deviceTypeId` selects an adapter only.
- Privacy: credentials, tokens, temporary AWS credentials, raw responses, account identifiers, and
  local-network data never reach public artifacts, `accessory.context`, or logs.

**Code style** (`.claude/rules/typescript-style-guide.md`, hard rules)

- 2-space indent, LF, ≤ 160 columns, semicolons, single quotes, trailing commas, spaces inside
  object braces.
- `//` comments only, never `/* */` blocks. `/** JSDoc */` for every top-level export.
- No `const enum` (banned), no `export default` outside `src/index.ts`, no `namespace`, no
  `#private`, no `as`/`!` without a stated local reason, no `{}` or `Object` as a type, no
  `@ts-ignore`.
- Prefer function declarations; use `interface` for object types; `T[]` for simple element types
  and `Array<...>` otherwise.
- Module-level constants in `CONSTANT_CASE`; files in `lowerCamelCase`.
- Throw only `Error` instances; `catch (error: unknown)`.
- Every `switch` has a `default`, last.

**Comment policy** (`.claude/rules/typescript-comments.md`, hard rules)

- Comments and test titles must not reference GSD phases, plans, waves, tasks, or milestones.
- Decision and requirement IDs (`D-01`, `SAFE-04`, `RES-02`, `#1234`) are the permitted anchors.
- Bare `Pitfall N` / `Pattern N` references to this document are **forbidden** in code comments.
  Carry the rationale in prose instead.

**Test policy** (`.claude/rules/typescript-unit-testing.md`, hard rules)

- One `.test.ts` under `test/` per production `.ts` under `src/`, at the mirrored path. No
  exclusions, including for type-only modules.
- 100% function, line, and branch coverage per pair when run alone. No coverage exceptions.
- `node:test` + `node:assert/strict` + `strong-mock` only. No other runner or library.
- `// arrange` / `// act` / `// assert` phase comments. `describe()` only per exported entrypoint,
  never nested.
- Data-driven cases are one `test()` per row inside a `for` loop, never a loop inside one case.
- Never export a symbol, add a reset hook, or reach a private member for a test. Change the
  production design instead.
- Test support lives beside the concern's tests. No `test/helpers/` or `test/utils/`.

**Cucumber policy** (`features/CLAUDE.md`)

- Sentence case for scenarios; lower case for steps; no `And`; present tense; no "should"; "these"
  before a data table.
- Step definitions organised by function, not by feature file, ordered `Given`, `When`, `Then`.
- Do not catch exceptions defensively in test code.

## Sources

### Primary (HIGH confidence)

- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/definitions/CharacteristicDefinitions.js`
  — every characteristic definition quoted in Code Examples, read at the cited line numbers.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/definitions/ServiceDefinitions.js`
  — `LeakSensor` :640, `ContactSensor` :334, `Battery` :198, `HumidifierDehumidifier` :555.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/Accessory.js` :266-354 — `addService`,
  `removeService`, `getService`, `getServiceById`.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/Service.js` :368-384, :396-416, :472-514,
  :721-758 — constructor, `addCharacteristic`, `getCharacteristic`, `testCharacteristic`,
  serialise/deserialise.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/Characteristic.js` :1906-1935, :2258-2263,
  :2317-2331 — defaults, HAP representation without a get handler, deserialise.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/Characteristic.d.ts` :12-78 — `Formats`,
  `Units`, `Perms`.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/util/uuid.js` / `.d.ts` — `BASE_UUID`,
  `generate`.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/util/checkName.js` — the HAP 2.x name rule.
- `node_modules/homebridge@2.4.0/dist/api.d.ts` :523, `dist/platformAccessory.d.ts`,
  `dist/bridgeService.js` :420-428 — `api.hap` typing, accessory API, cache persistence.
- `hap-nodejs@0.12.3` (unpacked from the registry) — the Homebridge 1.x comparison for `Battery` /
  `BatteryService`, `getServiceById`, `addService`, `Service.deserialize`, `Formats`/`Perms`/`Units`
  exports, `WaterLevel` and `StatusActive` props, and the absence of `checkName`.
- `homebridge@1.11.4` (unpacked from the registry) — `platformAccessory.d.ts` signatures and the
  deprecated `getServiceByUUIDAndSubType`.
- Repository sources read this session: `src/accessories/basementGuardian.ts`,
  `src/accessories/services.ts`, `src/config.ts`, `src/device/family.ts`, `src/device/gemini.ts`,
  `src/device/health.ts`, `src/device/state.ts`, `src/platform.ts`, `src/runtime/clock.ts`,
  `src/runtime/accountRuntime.ts`, `config.schema.json`, `.fallowrc.json`, `package.json`,
  `tsconfig.json`, `test/accessories/basementGuardian.test.ts`, `test/accessories/services.test.ts`,
  `test/configSchema.test.ts`, `features/support/fakeHomebridgeApi.ts`, `features/support/world.ts`,
  `features/support/steps/shadow.ts`, `features/degradedOperation.feature`,
  `docs/research/HOMEKIT.md`, `docs/research/PLUGIN.md` §6-§8, `docs/research/DECISIONS.md` D-008,
  `.planning/intel/constraints.md` :240-320, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`,
  `.planning/STATE.md`.
- Executable probes run this session against the pinned libraries: TypeScript compile of the
  custom service/characteristic pattern (`tsc --noEmit`, exit 0); HAP runtime probe (service
  add/remove/lookup, duplicate-subtype throws, default values, clamping); `PlatformAccessory`
  serialise/deserialise round trip; the restored-service characteristic-repair probe; the
  `node:test` timer-spy probes; `npx fallow dupes` baseline.
- `gh api repos/homebridge/HAP-NodeJS/issues/375` and its comments — read verbatim, the basis for
  refuting the `D-05` hazard's citation.
- `gh api repos/ebaauw/homebridge-hue/issues/656` and its comments — the only first-hand
  `StatusActive` discussion found.
- `gh api repos/homebridge/homebridge-plugin-template/issues/20` — why custom characteristics go
  through `api.hap`.

### Secondary (MEDIUM confidence)

- <https://github.com/homebridge/HAP-NodeJS/wiki/Presenting-Erroneous-Accessory-State-to-the-User>
  — `StatusActive`, `HapStatusError`, and the safe-default advice this project does not follow.
- <https://github.com/jeff-winn/homebridge-example-characteristic> — the custom-characteristic
  example Homebridge links from its plugin template.

### Tertiary (LOW confidence)

- WebSearch results on Apple Home automation behaviour and `StatusActive` rendering. Nothing
  authoritative was found in either direction; this is why A1 and A6 are `[ASSUMED]` and routed to
  human verification.
- <https://github.com/ebaauw/homebridge-hue/wiki/Characteristics> — mentions `Status Active` only in
  the Hue-mapping sense.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no package is added; every library is pinned and was read directly.
- HAP behaviour (services, subtypes, characteristics, defaults, clamping, cache round trip): HIGH —
  read from the pinned typings and confirmed by executable probe on both supported HAP lines.
- Architecture and module layout: HIGH — derived from code read this session and from locked
  decisions, not from memory.
- Pitfalls: HIGH for 1–9, every one of which has probe output or a cited source line.
- `SAFE-07` gate design: HIGH — the insufficiency of a global-timer spy was demonstrated, not
  assumed.
- Apple Home rendering and automation behaviour: LOW — no authoritative source exists in reach and
  no Apple home was available. Every such claim is tagged `[ASSUMED]` and routed to a
  human-verification item.

**Research date:** 2026-08-30
**Valid until:** 2026-09-29 for the HAP findings (stable, version-pinned). The Apple Home questions
have no expiry because they were never resolved; they close only in a real home.
