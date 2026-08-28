# Requirements: Basement Guardian

**Defined:** 2026-08-27
**Core Value:** HomeKit must promptly show trustworthy basement-protection conditions while clearly marking stale or invalid telemetry instead of reporting a false normal state.

## v1 Requirements

### Platform and Configuration

- [ ] **CONF-01**: Administrator can install Basement Guardian as a Homebridge dynamic-platform package implemented as TypeScript ESM for the supported runtime ranges and run it on either the main bridge or a Homebridge-managed child bridge.
- [ ] **CONF-02**: Administrator can configure one singular vendor account in the Homebridge Plugin Settings GUI with strict validation, a masked password field, and clear plaintext-storage disclosure.
- [ ] **CONF-03**: When required credentials are absent, the plugin logs a clear configuration error and starts no network, timer, or accessory work.
- [ ] **CONF-04**: Administrator can omit `clientId` to use the bundled public Auth0 client ID or set the optional override without exposing any other vendor protocol constants.
- [ ] **CONF-05**: Administrator can set the REST poll interval from 300 through 3600 seconds, with approximately 900 seconds by default, and an integer `offlineConfirmationPollCount` from 1 through 8, with 2 by default. The `D-015` worst-case offline confirmation of 105 to 120 minutes assumes the default interval; a 3600-second interval with a count of 8 extends confirmation to approximately eight hours.
- [ ] **CONF-06**: Administrator can use a unique, enumerated `ignoredFaults` list to remove only selected Apple Home notification adapters while all truthful source state remains available. The list enumerates seven slugs rather than eight because `Primary Pump Running` is an activity adapter, not a notification adapter, and it is deliberately not removable.

### Authentication and Secret Handling

- [ ] **AUTH-01**: The configured account authenticates unattended through the vendor Auth0 password-realm flow, reuses a valid cached ID token, and reauthenticates before or after expiry as required.
- [ ] **AUTH-02**: The ID token is stored only under the Homebridge storage path, in a cached file that uses owner-only permissions where the operating system supports them, and passwords, tokens, temporary AWS credentials, authorization headers, and authentication bodies never enter logs or accessory context.

### Cloud Synchronization

- [ ] **SYNC-01**: The account runtime uses typed vendor REST operations for device inventory/snapshots, Gemini commands, and temporary AWS IoT credentials, without using excluded account-management routes.
- [ ] **SYNC-02**: The runtime maintains one canonical snapshot per device by merging REST state and partial shadow `reported` patches while ignoring `desired` values and preserving omitted fields.
- [ ] **SYNC-03**: The runtime requests a complete shadow after startup and reconnect and polls successful REST snapshots as a reconciliation backstop without treating MQTT subscription persistence as event replay.
- [ ] **SYNC-04**: Temporary AWS credentials rotate in place about ten minutes before expiry, failed refreshes remain scheduled, and reconnect retries are capped and protected from duplicate loops.
- [ ] **SYNC-05**: Homebridge shutdown, partial startup failure, timers, subscriptions, retry waits, commands, and the shadow socket share an idempotent abortable lifecycle with no unhandled rejection.

### Device Families and Accessory Lifecycle

- [ ] **DEV-01**: Every valid `wayneWaterGemini` returned for the configured account is supported, while HALO and unknown profiles produce clear distinct explanations, remain unpublished when new, and do not block valid Gemini devices.
- [ ] **DEV-02**: A stable family-adapter registry owns payload validation, value-domain decoding, capabilities, services, and command construction so future families can be added without changing account-wide infrastructure.
- [ ] **DEV-03**: Strict Gemini identity, required-field, type, and legal-value validation prevents a mismatched or changed vendor payload from becoming plausible but incorrect HomeKit state.
- [ ] **DEV-04**: One physical system produces one multi-service accessory whose UUID derives only from immutable `deviceId`; a `deviceTypeId` change selects an adapter without creating or unregistering the physical identity.
- [ ] **DEV-05**: A cached accessory is removed only after two consecutive successful healthy inventories omit it and a final current-inventory check confirms absence; confirmed removal also ends its observation epoch.
- [ ] **DEV-06**: A vendor rename updates the accessory only while the HomeKit name still matches the prior vendor name, preserving user-customized names and stable functional service names/subtypes.
- [ ] **DEV-07**: The accessory publishes a populated `AccessoryInformation` service with Manufacturer, Model, SerialNumber, and FirmwareRevision, sourced only from validated vendor identity and the metadata fields `mcu_firmware_version`, `wifi_firmware_version`, and `mcu_target_version`. It exposes remaining truthful metadata such as `wifi_signal_dbm` read-only where a semantically correct representation exists. The vendor `deviceId` never becomes a user-visible value, and `D-027` privacy rules continue to control logs, fixtures, and public artifacts.
- [ ] **DEV-08**: A published accessory whose `deviceTypeId` changes to an unsupported family, or whose payload stops validating after publication, keeps its HomeKit identity and last valid values, marks its services inactive or faulty, disables commands, logs the condition once, and is never unregistered for that reason alone. It resumes normal operation when a supported profile and fresh family-valid state return (`C-002`).

### Safety Monitoring and HomeKit Representation

- [ ] **SAFE-01**: The `Sump Pit Level` service maps every legal Gemini water-level code (`0`, `1`, `3`, `7`, `15`, `31`) through an explicit lookup and never through a population count; an unknown value faults the service instead of guessing a level, and `Sump Pit Flood` activates only at the flood threshold. The flood-threshold constant and every level mapping other than `1` stay provisional until G-002 closes, and G-002 blocks only the `1.0.0` release.
- [ ] **SAFE-02**: Primary and backup Pump services truthfully expose live running state, and `Primary Pump Running` plus `Backup Pump Activated` Contact Sensors follow their respective device booleans.
- [ ] **SAFE-03**: Every live backup-pump activation, including self-test activity, updates immediately without inventing a cause; recovered timestamp evidence adds one de-duplicated record without a late sensor pulse or notification.
- [ ] **SAFE-04**: Primary pump, backup pump/fuse, water sensor, controller-link, and confirmed-offline faults update owning-service status plus five distinct Apple Home adapters, with exact raw causes retained and no aggregate System Fault adapter.
- [ ] **SAFE-05**: Mains presence appears truthfully on the read-only `Sump Mains Power` service and `Mains Power Lost` follows `ac_power === false` independently of pump health.
- [ ] **SAFE-06**: Backup battery services expose exact charging, low-voltage, health, and protection-band facts plus clearly labeled 25/50/75/100 estimated standard levels, without misusing filter-maintenance semantics.
- [ ] **SAFE-07**: Current-condition and adapter transitions publish immediately and clear immediately on valid source recovery, with no plugin alert-delay setting or durable acknowledgement latch.
- [ ] **SAFE-08**: Standard HomeKit semantics are used wherever truthful, vendor-defined characteristics are read-only, and no device value is mislabeled as an unrelated standard measurement or control merely for Apple Home visibility.

### Pump Records and Official Controls

- [ ] **CTRL-01**: Each pump exposes a persisted read-only observation start, observed activation count, and last-observed-activation UTC timestamp that survives normal restarts/upgrades and never claims to be a lifetime total.
- [ ] **CTRL-02**: Documentation makes clear that Activity History is controller-owned, is not safety delivery, has no configurable retention, and is not a source of missed-event backfill.
- [ ] **CTRL-03**: `System Self-Test` follows reported `test_running`, accepts one valid on request, rejects cancellation and duplicates, permits tests during physical faults, and reflects tests started outside HomeKit.
- [ ] **CTRL-04**: `Alarm Mute` follows reported `alarm_audio_muted`, sends only the official `{"alarm_audio_muted": true}` boolean on command, and provides no duration, timer, simulated unmute, or off write while mute is active. G-001 blocks only the `1.0.0` release.
- [ ] **CTRL-05**: Each HomeKit command waits at most 2.5 seconds for vendor acceptance, keeps reported state authoritative, tracks one 30-second pending/uncertain request, returns appropriate HAP errors, and never automatically retries or writes requested state into safety data.

### Degraded Operation and Recovery

- [ ] **RES-01**: Communication or field-validation failure preserves the last valid value and marks only the narrowest affected service stale, inactive, or faulty; omitted partial fields and invalid updates never clear active safety conditions. The device heartbeat is approximately 898 seconds, and approximately 15 minutes of shadow silence is normal. Shadow silence is a secondary staleness signal only after two missed heartbeats, and one missed heartbeat is never evidence that the device is offline.
- [ ] **RES-02**: `serial_communications === false` immediately activates `Pump Controller Link Lost`, faults controller-derived services, preserves their values, and exposes when trustworthy controller data was last received.
- [ ] **RES-03**: `Basement Guardian Offline` activates only after the configured number of successful REST snapshots report `connectivity.connected === false`. `data.offline === true` is corroboration and diagnostics only and never activates the adapter by itself (`D-016`). Failed REST requests or monitoring-path loss are logged and diagnosed separately without a false physical-device alert.
- [ ] **RES-04**: After a failed restart, getters return cached values without network calls, accessories remain present and visibly stale, commands stay disabled until fresh valid state returns, and only explicit credential rejection yields a persistent communication failure requiring user action.

### Release Quality, Privacy, and Distribution

- [ ] **REL-01**: Package engines and CI validate Node.js `^22.10.0 || ^24.0.0` with Homebridge `^1.8.0 || ^2.0.0`, including minimum/latest Homebridge 1.x and current Homebridge 2.x combinations, without a runtime `homebridge-lib` or direct HAP-NodeJS import.
- [ ] **REL-02**: Deterministic automated tests with recorded sanitized fixtures cover reducer/decoder, family, event, health, reconciliation, commands, accessory, secret, privacy, and runtime-lifecycle policies without live credentials, hardware, or network access.
- [ ] **REL-03**: Runtime traffic is limited to required vendor services; the plugin collects no analytics, crash reports, installation/usage data, tracking identifiers, or automatic diagnostics, and direct dependencies pass a telemetry review.
- [ ] **REL-04**: Public, planning, fixture, log, and packed-package checks exclude secrets and account/local-network identifiers and use stable placeholders, while the bundled data file alone may contain required public vendor constants.
- [ ] **REL-05**: The packed package consistently preserves MIT licensing for original standalone work, Apache 2.0 licensing and notices for template-derived material, required file headers, full license texts, and aligned `SEE LICENSE IN LICENSE` metadata while both remain.
- [ ] **REL-06**: The repository provides best-effort current-release support through issue templates that request versions, reproduction steps, and redacted logs, directs vulnerabilities to private GitHub Security Advisories, promises no SLA, and meets current Homebridge Verified criteria without claiming approval.
- [ ] **REL-07**: An npm-ready release candidate passes all automated and real-home checks including G-001, G-002, G-003, and G-004; prereleases use SemVer `0.x`, npm `next`, GitHub prerelease labels, safe-user warnings, and release notes, while `latest` and `1.0.0` remain blocked until the required gates pass. G-004 covers `Sump Pit Flood` Leak Sensor notification delivery, validated in a real eligible Apple home with a current home hub and the current Home architecture, and confirms that no documentation claims a Critical Alerts guarantee.
- [ ] **REL-08**: User-facing documentation states that Homebridge stores the account password in plain text in `config.json` and in backups (`D-023`), recommends a child bridge while warning that a child bridge needs separate HomeKit pairing and that a bridge-mode change can recreate accessories and disrupt rooms, scenes, and automations (`D-036`), marks prerelease builds experimental and tells users to keep the vendor alarm and vendor notifications enabled (`D-026`), identifies the 25/50/75/100 battery percentages as documented estimates rather than measured charge (`D-012`), and makes no Critical Alerts guarantee for the flood Leak Sensor.

## v2 Requirements

### Additional Device Families

- **FAM-01**: HALO hardware can be supported through its own validated adapter without changing account-wide authentication, transport, store, lifecycle, or reconciliation behavior.

### Optional Setup Enhancements

- **SETUP-01**: A custom setup interface can validate credentials or enumerate devices if generated-schema setup proves insufficient after v1.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Direct pump on/off | Unsafe and absent from the official Gemini control surface |
| Provisioning, claiming, rename, contacts, and email-rule administration | Vendor account administration is not required for safety monitoring |
| Multiple accounts in one plugin instance | V1 uses one singular platform block and one account runtime |
| HALO runtime behavior | No representative hardware-validation evidence exists |
| Unsupported local/provisioning APIs | Normal device operation exposes no supported local integration contract |
| Eve private history or `fakegato-history` | Apple owns eligible Activity History; local summaries meet v1 needs |
| Pump-count reset controls | Counts describe one accessory observation epoch and must not imply device lifetime data |
| Alert-delay settings | Delaying characteristics would also delay state, automations, and history |
| Alarm-mute duration or unmute command | Gemini exposes neither capability |
| Automatic diagnostic uploads | Privacy and Homebridge Verified constraints require local, user-selected sharing |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONF-01 | Phase 1 | Pending |
| CONF-02 | Phase 1 | Pending |
| CONF-03 | Phase 1 | Pending |
| CONF-04 | Phase 1 | Pending |
| CONF-05 | Phase 1 | Pending |
| CONF-06 | Phase 3 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| SYNC-01 | Phase 1 | Pending |
| SYNC-02 | Phase 1 | Pending |
| SYNC-03 | Phase 1 | Pending |
| SYNC-04 | Phase 1 | Pending |
| SYNC-05 | Phase 1 | Pending |
| DEV-01 | Phase 2 | Pending |
| DEV-02 | Phase 2 | Pending |
| DEV-03 | Phase 2 | Pending |
| DEV-04 | Phase 2 | Pending |
| DEV-05 | Phase 2 | Pending |
| DEV-06 | Phase 2 | Pending |
| DEV-07 | Phase 2 | Pending |
| DEV-08 | Phase 2 | Pending |
| SAFE-01 | Phase 3 | Pending |
| SAFE-02 | Phase 3 | Pending |
| SAFE-03 | Phase 3 | Pending |
| SAFE-04 | Phase 3 | Pending |
| SAFE-05 | Phase 3 | Pending |
| SAFE-06 | Phase 3 | Pending |
| SAFE-07 | Phase 3 | Pending |
| SAFE-08 | Phase 3 | Pending |
| CTRL-01 | Phase 4 | Pending |
| CTRL-02 | Phase 4 | Pending |
| CTRL-03 | Phase 4 | Pending |
| CTRL-04 | Phase 4 | Pending |
| CTRL-05 | Phase 4 | Pending |
| RES-01 | Phase 3 | Pending |
| RES-02 | Phase 3 | Pending |
| RES-03 | Phase 5 | Pending |
| RES-04 | Phase 5 | Pending |
| REL-01 | Phase 6 | Pending |
| REL-02 | Phase 6 | Pending |
| REL-03 | Phase 6 | Pending |
| REL-04 | Phase 6 | Pending |
| REL-05 | Phase 6 | Pending |
| REL-06 | Phase 6 | Pending |
| REL-07 | Phase 6 | Pending |
| REL-08 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-27*
*Last updated: 2026-08-28 after removing gate preconditions, adding DEV-07, DEV-08, REL-08 and gate G-004, and moving RES-01 and RES-02 to Phase 3*
