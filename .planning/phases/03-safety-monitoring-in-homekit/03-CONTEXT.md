# Phase 3: Safety Monitoring in HomeKit - Context

**Gathered:** 2026-08-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 turns the validated Gemini domain state that Phase 2 produces into published HomeKit
services and safety adapters. Phase 2 published an accessory with identity and no domain services;
Phase 3 gives that accessory its meaning.

**In scope:** the `Sump Pit Level` service and its legal-value lookup, and the `Sump Pit Flood`
Leak Sensor (`SAFE-01`); truthful primary and backup Pump services with their live activity Contact
Sensors (`SAFE-02`); immediate live backup activation without an invented cause (`SAFE-03`); the
five Apple Home fault adapters and their owning-service status (`SAFE-04`); the `Sump Mains Power`
service and `Mains Power Lost` adapter (`SAFE-05`); the backup battery services and their exact
facts (`SAFE-06`); immediate publish and immediate clear with no delay or latch (`SAFE-07`);
standards-first mapping with read-only vendor-defined characteristics (`SAFE-08`); the
`ignoredFaults` configuration surface (`CONF-06`); the field-validity half of `RES-01`; and
`serial_communications === false` driving `Pump Controller Link Lost` (`RES-02`).

**Out of scope:** durable pump records — observed counts, observation epochs, and recovered
timestamp evidence — and the `System Self-Test` and `Alarm Mute` writable controls (Phase 4). The
time-based half of `RES-01` — the ~898-second heartbeat timer and the two-missed-heartbeat
staleness rule — and cached-state persistence across restart (Phase 5). Packaging, licensing, and
release gates (Phase 6).

The Pump services are **published** in this phase carrying live state. Their read-only record
characteristics — observation epoch, observed count, last-activation timestamp — are added to the
already-published services in Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Water level and the flood threshold

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

### Trust scoping — one bad field faults one scope

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

### Degraded-state visibility in Apple Home

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

### Backup battery

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

### Offline confirmation and the staleness boundary

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

### Services, subtypes, and names

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

### Configuration surface

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

### Proving immediacy

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### HomeKit mapping — the primary specification for this phase

- `docs/research/HOMEKIT.md` — the complete service table, the `CONTACT_NOT_DETECTED = alarm`
  convention, the `hours_of_protection → 25/50/75/100` band mapping, and the value conventions
  block. §1 lists the constraints that eliminate the obvious approaches; §3.1 covers water level,
  §3.2 pump running, §3.3 faults, §3.4 backup activation; §4 covers heartbeat and partial payloads.
- `docs/research/DECISIONS.md` §D-008 — the five equipment-fault adapters, unrevised.

### Locked product decisions governing this phase

- `D-001` — Safety-first monitoring; expose only semantically truthful HomeKit data.
- `D-006` — Standards first; read-only vendor extensions otherwise.
- `D-007` — Water representation; `Sump Pit Flood` as the threshold Leak Sensor and a read-only
  custom Sump Pit service with standard `WaterLevel`; routine level movement is not mislabeled.
- `D-008` — Five distinct fault adapters, never one aggregate.
- `D-009` — Truthful custom Pump services and standard activity Contact Sensors.
- `D-011` — Mains presence on a custom Power service; `Mains Power Lost` as the safety adapter.
- `D-012` — Exact vendor battery facts plus a standard Battery service with documented
  protection-duration estimates.
- `D-014` — Preserve untrusted state; mark only the truthful scope; require fresh valid input to
  recover.
- `D-016` — Distinguish transport degradation from device offline; avoid a Monitoring Unavailable
  adapter; clear degradation only after valid state resumes.
- `D-017` — Publish all safety Contact Sensors by default; `ignoredFaults` removes only enumerated
  adapters while retaining source state, diagnostics, records, and stable subtypes.
- `D-021` — Never represent battery health or replacement as `FilterMaintenance`.
- `D-022` — No simulated notification delays.
- `C-001` — Report every observed backup-pump run immediately, including self-tests, without
  inferring mains loss or primary-pump failure.

### Requirements

- `.planning/REQUIREMENTS.md` — `CONF-06` (line 15), `SAFE-01` through `SAFE-08` (lines 43–50),
  `RES-01` and `RES-02` (lines 62–63).

### Protocol facts

- `.planning/intel/constraints.md:246-249` — the known enum values for `battery_health`,
  `hours_of_protection`, and `water_level`.
- `.planning/intel/constraints.md:252-272` — the water-level validation gate, the thermometer-code
  reading, and the explicit-lookup requirement.
- `.planning/intel/constraints.md:295-308` — the Gemini email-rule catalog, `WW-GEM-ALERT-1`
  through `-14`, which is where every threshold in this phase traces to.

### Prior phase context

- `.planning/phases/02-safe-gemini-discovery-and-identity/02-CONTEXT.md` — D-04 records the
  degradation presentation this phase carries forward, and its "Recorded concern for Phase 3"
  paragraph is what `D-05` above closes.

### External documentation

- <https://github.com/homebridge/HAP-NodeJS/wiki/Presenting-Erroneous-Accessory-State-to-the-User>
  — the `StatusActive` workaround, the `HapStatusError` restriction, and the safe-default advice
  this project deliberately does not follow.
- <https://github.com/homebridge/HAP-NodeJS/issues/375> — the unconfirmed report that an inactive
  sensor drops out of automations. Verify, do not assume.
- Pinned HAP typings under `node_modules/@homebridge/hap-nodejs/dist/lib/definitions/`. Use
  `api.hap` at runtime; never import HAP-NodeJS directly.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- `src/device/health.ts` — `TrustScope`, `DistrustReason`, `UntrustedScope`, `DeviceHealth`. The
  `D-04` field map targets the existing `TrustScope` union; `UntrustedScope.lastTrustedAt` is what
  `RES-02` needs for "when trustworthy controller data last arrived". `DistrustReason` already
  carries both `invalid` and `controller-link-lost`.
- `src/accessories/services.ts` — `CoreServiceKind`, `NotificationServiceKind`, `ServiceDescriptor`.
  Declaration-only so far; this phase is its first production consumer, so its `ignoreFindings`
  entry in `.fallowrc.json` comes out.
- `src/device/gemini.ts` — `GeminiTelemetryState`, `GeminiMetadataState`, the `FieldCheck`
  functions, `TELEMETRY_CHECKS`, and `METADATA_CHECKS`. The field names the `D-04` map keys off
  are already enumerated here.
- `src/device/family.ts` — `FamilyValidation` and `FieldViolation` already carry the per-field data
  `D-04` needs; the contract change is in what `validate()` and `decode()` return, not in whether
  the information exists.
- `src/accessories/basementGuardian.ts` — `createBasementGuardianAccessory`, whose `services` array
  is currently empty and whose `update()` holds the whole-snapshot degradation logic `D-04`
  replaces. Its closure-held `lastTrustedAt` / `degraded` / `untrusted` state is the pattern to
  extend, not to parallel.
- `src/config.ts` — `validateConfig`, `BgConfig`, `ConfigRefused`, and the `IntegerBounds` refusal
  pattern that `D-17` follows. `offlineConfirmationPollCount` is already parsed and bounded; `D-09`
  is its first consumer.
- `src/device/state.ts` — the merge reducer that makes partial heartbeats safe, and `DeviceSnapshot`
  with its `receivedAt` local-time field.
- `src/runtime/clock.ts` — the injection pattern `D-18`'s timer spy should mirror.

### Established patterns

- Factory with injected options returning a closure-backed object, used by `state.ts`,
  `registry.ts`, `reconciliation.ts`, and `basementGuardian.ts`. New services should follow it.
- Hand-written predicate narrowing (`isRecord` plus named field checks) rather than `as`
  assertions, matching `src/cloud/types.ts`.
- Unit tests under `test/` mirroring `src/`; Cucumber features and step definitions under
  `features/`, with the fake cloud, fake HAP, and plugin harness in `features/support/`.

### Integration points

- `registerDiscoveredDevices` and `basementGuardianAccessoryFor` in `src/platform.ts` — where the
  accessory is created and reused across polls, and where `ignoredFaults` has to reach the service
  set.
- `applyDevices` in `src/runtime/accountRuntime.ts` — the per-poll path `D-09`'s offline counter
  attaches to, beside the existing reconciliation instance.
- `config.schema.json` — gains the `ignoredFaults` array; the existing schema key-set test extends
  to prove no alert-delay setting exists (`D-18`).

</code_context>

<specifics>
## Specific Ideas

- The refusal message for an unknown `ignoredFaults` slug must name the bad slug and enumerate all
  seven valid ones. Under `D-17` the plugin refuses to start, so that message is the user's only
  path back. Treat it as testable behavior, not log text.
- The raw `water_level` code is published beside the mapped percentage specifically so a maintainer
  can validate the `D-01` ladder against a real pit during G-002, without a debug build.
- Keep the provisional constants — the five mapped percentages and the flood threshold — in one
  place, so closing G-002 is a single reviewable edit.

</specifics>

<deferred>
## Deferred Ideas

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

</deferred>

---

*Phase: 3-Safety Monitoring in HomeKit*
*Context gathered: 2026-08-30*
