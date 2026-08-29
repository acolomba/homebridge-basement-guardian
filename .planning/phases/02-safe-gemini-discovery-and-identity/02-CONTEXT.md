# Phase 2: Safe Gemini Discovery and Identity - Context

**Gathered:** 2026-08-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 turns the account-level runtime from Phase 1 into published accessories with stable identity. It stops before HomeKit semantics.

**In scope:** family detection and the adapter registry (DEV-01, DEV-02); strict Gemini identity, required-field, type, and legal-value validation (DEV-03); one multi-service accessory per physical system with a UUID seeded only from `deviceId` (DEV-04); confirmed-removal reconciliation and observation-epoch lifecycle (DEV-05); vendor-rename adoption that preserves user-customized names (DEV-06); the `AccessoryInformation` service and read-only metadata (DEV-07); and degrade-in-place for a published accessory that stops validating (DEV-08).

**Out of scope:** water-level decoding, fault adapters, pump-running semantics, and the five Apple Home notification adapters (Phase 3); commands and self-test (Phase 4); offline confirmation and recovery (Phase 5). Phase 2 publishes services and sets identity; it does not decide what a water level or a fault means.

</domain>

<decisions>
## Implementation Decisions

### Identity and privacy — `deviceId` is not sensitive

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

### Inventory reconciliation and removal

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

### Family adapter registry — build the full descriptor

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

### Degradation presentation — inactive, not faulty

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

### Log cadence for non-Gemini profiles

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

</decisions>

<canonical_refs>
## Canonical References

### Locked product decisions governing this phase

- `D-002` — Gemini-only v1; explain and skip new HALO or unknown profiles.
- `D-003` — Additive family boundary; adapters own validation, decoding, capabilities, services, commands.
- `C-002` — Physical identity is not profile identity; seed from `deviceId`, select adapter by `deviceTypeId`.
- `D-014` — Preserve untrusted state; mark only the truthful scope; require fresh valid input to recover.
- `D-020` — Counter lifecycle; one UTC observation epoch per pump; new epoch after confirmed removal.
- `D-027` — Sanitized public artifacts; placeholders for account and device identifiers.
- `D-029` — Confirm removal; two consecutive successful inventories plus a final check; failures never count.
- `D-030` — Preserve custom names; adopt a vendor rename only while the HomeKit name still matches the prior vendor name.

### Requirements

`DEV-01` through `DEV-08` in `.planning/REQUIREMENTS.md:32-39`.

### Protocol facts

- `.planning/intel/constraints.md:162-183` — Gemini identity fields and the metadata table.
- `.planning/intel/constraints.md:143` — the AWS IoT thing name equals the vendor `deviceId`.
- `.planning/intel/context.md:1033` — `deviceId` is the UUID seed; the display name is mutable.

### External documentation

- Homebridge plugin documentation for `AccessoryInformation`, dynamic platform accessory
  registration, and `configureAccessory` restore ordering.
- Pinned HAP typings under `node_modules/@homebridge/hap-nodejs/dist/lib/definitions/`. Use
  `api.hap` at runtime; do not import HAP-NodeJS directly.

</canonical_refs>

<existing_code>
## Existing Code Insights

### Reusable assets from Phase 1

- `src/device/family.ts` — `DeviceFamily<TDomainState>`, `DeviceCapability`, `FamilyValidation`,
  `FieldViolation`, `FamilyCommand`. The registry extends this seam rather than replacing it.
- `src/device/health.ts` — `MonitoringPath`, `TrustScope`, `DistrustReason`, `UntrustedScope`,
  `DeviceHealth`. Degradation state should compose with these, not parallel them.
- `src/device/gemini.ts` — `GeminiDeviceTypeId`, `GeminiTelemetryField`, `GeminiMetadataField`.
- `src/device/halo.ts` — `HaloDeviceTypeId` only. HALO stays a recognized-but-unpublished profile.
- `src/persistence/accessoryContext.ts` — declaration-only so far. Phase 2 is the first writer,
  so its `ignoreFindings` entry in `.fallowrc.json` should come out when a real consumer lands.
- `src/runtime/accountRuntime.ts` — the account-level lifecycle Phase 2 attaches reconciliation to.

### Known contradictions to correct in this phase

1. The `accessoryContext.ts` fileoverview claims the record holds no account identifier. Given the
   decision above, correct the claim.
2. `.fallowrc.json` carries an `ignoreFindings` entry for `accessoryContext.ts` that exists only
   because nothing consumed the module. Remove it once Phase 2 writes the record.

</existing_code>

<hazards>
## Execution Hazards Carried From Phase 1

These cost real time in Phase 1 and apply unchanged here.

- **A passing test is not evidence.** Two Phase 1 tests asserted defects as correct and passed.
  When a plan closes a defect, it must name the test that encodes it and verify each new
  assertion fails against the pre-fix build.
- **A single green run is not a green gate.** `npm run check` exited 1 on one run in four while
  every report said green. Run the suite at least three consecutive times before claiming it
  passes. The Phase 1 race is fixed and verified 6/6, so a failure now is a real regression.
- **`test:coverage:direct` needs two arguments** — the include value *and* the test path.
  A single argument leaves `node --test` globbing unbuilt `.ts`.
- **Shared config files serialize a wave.** The dead-code gate forces undeclared edits to
  `.fallowrc.json` from any `src/**/*.ts` change, so overlap is invisible in `files_modified`.
  Phase 2 will touch that file (see above), so treat it as a serialization signal.
- **Worktree cleanup blocks on any deletion.** Merge when every deleted path is declared in the
  plan's `files_modified`; halt and ask if anything undeclared is deleted.

</hazards>

<deferred>
## Deferred Ideas

- HALO adapter implementation — v2.
- Visibility of degraded accessories in Apple Home — Phase 3, recorded above.
- Whether `battery_health == 32` earns a sixth fault adapter — Phase 3 discussion.
- Confirming the `<account-id>` format against a real inventory response — pairs naturally with
  the three outstanding Phase 1 UAT items.

</deferred>

---

**Phase 1 remains open.** It is implementation-complete and gate-complete, but three human UAT
items in `01-UAT.md` must pass before it can be marked complete: Homebridge settings form
rendering, the vendor heartbeat topic on real hardware, and a real SigV4 handshake against AWS
IoT. The last one matters most — the fake broker accepts every signature, so the automated suite
structurally cannot falsify the signer.
