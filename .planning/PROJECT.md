# Basement Guardian

## What This Is

Basement Guardian is a safety-first Homebridge dynamic-platform plugin for owners of Basement Guardian Gemini sump-pump systems. It connects one vendor account to HomeKit, publishes every supported physical system as one stable multi-service accessory, and surfaces trustworthy flood, pump, power, battery, fault, connectivity, and official-control state without inventing unsupported meaning.

## Core Value

HomeKit must promptly show trustworthy basement-protection conditions while clearly marking stale or invalid telemetry instead of reporting a false normal state.

## Success Metric

An npm-ready v1 release candidate passes repository quality checks on Node.js 22 and 24 and supported Homebridge 1.x/2.x runtimes, with hardware and real-home gates G-001, G-002, and G-003 closed before `1.0.0` can be published.

## Requirements

### Validated

(None yet — ship and validate the plugin to establish this list.)

### Active

- [ ] A Homebridge administrator can configure one Basement Guardian account without exposing secrets in logs or accessory state.
- [ ] Every valid Gemini on that account appears as one stable HomeKit accessory; unsupported or invalid profiles never produce fabricated state.
- [ ] Flood risk, pump activity, mains power, battery condition, equipment faults, and connectivity health use truthful HomeKit semantics.
- [ ] Self-test and alarm-mute controls follow only the official Gemini command contract and reported device state.
- [ ] Cached accessories preserve safety state and identity through restarts, transport failures, profile drift, and transient discovery failures.
- [ ] The package, tests, licensing, privacy controls, support paths, and real-home validation are ready for a safe `1.0.0` release.

### Out of Scope

- HALO behavior — the family is declared but remains unimplemented until representative hardware validation exists.
- Direct pump on/off, provisioning, claiming, device rename, notification-contact, email-rule, and account-administration commands — v1 exposes only official Gemini self-test and alarm-mute controls.
- Multiple vendor accounts in one Homebridge instance — v1 uses one singular platform configuration; separate bridge instances can isolate accounts.
- A supported local-device API — normal operation depends on vendor Auth0, REST, and AWS IoT services.
- Eve private history, `fakegato-history`, detailed local timelines, history-retention settings, and history backfill — Apple owns eligible Activity History; the plugin keeps only observation summaries.
- Simulated alert delays, alarm-mute duration/unmute controls, and direct pump controls — the vendor protocol and HomeKit semantics do not support them truthfully.
- A custom setup web application — the generated Homebridge Plugin Settings GUI is sufficient for v1.
- Automatic `1.0.0` publication or an unapproved Homebridge Verified claim — publication and the later verification request remain explicit maintainer actions after all gates pass.

## Context

- The planning snapshot contains the sanitized protocol, operations, HomeKit, plugin, and architecture research. The [ingested decision record](./intel/decisions.md) is authoritative for locked product and architecture choices.
- Hardware evidence already covers Auth0 authentication, REST discovery, AWS IoT shadow updates, self-test commands, heartbeat timing, and in-place AWS credential rotation for Gemini.
- G-001 still requires alarm-mute acknowledgement, state, duration, latency, and failure validation before mute implementation begins.
- G-002 still requires a natural pump cycle to validate every Gemini water-level code and the flood threshold before that mapping is releaseable.
- G-003 still requires both bridged pump Contact Sensors to be checked in a real Apple home with a supported hub and current Home architecture.
- AWS IoT shadows synchronize current state rather than replaying missed events. Full-shadow refresh, REST reconciliation, and monotonic timestamps provide bounded recovery.
- Ingest found no blockers or warnings. Three lower-authority suggestions were auto-resolved in favor of the ADR: subsystem-specific fault adapters, two-inventory removal confirmation, and the mixed MIT/Apache licensing boundary.

## Constraints

- **Runtime**: TypeScript ESM on Node.js `^22.10.0 || ^24.0.0`; relative ESM imports use `.js` extensions.
- **Homebridge compatibility**: Support `^1.8.0 || ^2.0.0`, validate against current Homebridge 2.x, and use only HAP objects supplied by `api.hap`; do not import HAP-NodeJS directly at runtime.
- **Cloud dependency**: Discovery, state, credentials, and commands require the vendor Auth0, REST, and AWS IoT endpoints; no supported local API exists during normal operation.
- **Safety semantics**: Unknown, stale, omitted, or invalid values never become guessed measurements or normal defaults. Preserve the last valid value and mark the narrowest affected scope untrustworthy.
- **Identity**: Vendor `deviceId` is the immutable Homebridge UUID seed; `deviceTypeId` selects an adapter and never changes physical identity.
- **Privacy**: Credentials, tokens, temporary AWS credentials, raw responses, account identifiers, and local-network data cannot enter public artifacts, accessory context, or logs.
- **Persistence**: Auth0 tokens live under `api.user.storagePath()`; accessory-scoped observation data lives in typed `accessory.context` and is explicitly persisted.
- **Release**: `1.0.0` is blocked until G-001, G-002, G-003, automated tests, real-home tests, package inspection, secret scans, and compatibility checks pass.

## ADR-Locked Decisions

The following blocks preserve all 40 locked decisions from the [ingested decision record](./intel/decisions.md). Validation-gated findings G-001 through G-003 and F-001 through F-004 inform requirements but are not labeled as locked.

<decisions status="locked" source=".planning/intel/decisions.md" scope="product-and-family">

- **D-001 — Safety-first monitoring with standards-compliant breadth:** Prioritize basement-protection conditions and expose only semantically truthful standard or custom HomeKit data.
- **D-002 — Gemini-only v1:** Support every `wayneWaterGemini` on the configured account; explain and skip new HALO or unknown profiles.
- **D-003 — Additive family boundary:** Keep authentication, transports, state, lifecycle, and reconciliation family-neutral; each adapter owns validation, decoding, capabilities, services, and commands.
- **D-004 — Official controls only:** V1 commands are Gemini system self-test and audible-alarm mute; all other device and account administration stays excluded.
- **C-001 — Backup activation meaning:** Report every observed backup-pump run immediately, including self-tests, without inferring mains loss or primary-pump failure.
- **C-002 — Physical identity is not profile identity:** Seed HomeKit identity from `deviceId`; use `deviceTypeId` only to select an adapter and preserve an existing accessory through profile changes.

</decisions>

<decisions status="locked" source=".planning/intel/decisions.md" scope="homekit-representation">

- **D-005 — One accessory per system:** Put all stable services for one physical Basement Guardian system on one HomeKit accessory.
- **D-006 — Standards first:** Use standard HAP semantics when correct and read-only vendor extensions otherwise; notification adapters are documented exceptions beside truthful domain state.
- **D-007 — Water representation:** Use `Sump Pit Flood` as the threshold Leak Sensor and a read-only custom Sump Pit service with standard `WaterLevel`; do not mislabel routine level movement.
- **D-008 — Equipment faults:** Set service-owned status and publish separate Primary Pump, Backup Pump, Water Sensor, Pump Controller Link, and Basement Guardian Offline adapters; never one aggregate fault adapter.
- **D-009 — Pump state and records:** Use truthful custom Pump services and standard activity Contact Sensors, with observed counts and timestamps rather than lifetime or private-history claims.
- **D-010 — Backup activity:** Drive `Backup Pump Activated` from live running state, persist de-duplicated recovered evidence, never synthesize a late pulse, latch, or cause.
- **D-011 — Mains power:** Expose exact mains presence on a custom Power service and `Mains Power Lost` as the safety adapter.
- **D-012 — Backup battery:** Expose exact vendor battery facts plus a standard Battery service whose 25/50/75/100 levels are documented protection-duration estimates.
- **D-021 — No filter misuse:** Never represent battery health or replacement as `FilterMaintenance`.
- **D-022 — No simulated notification delays:** Apply source-condition transitions immediately; offline confirmation is detection, not a delayed HomeKit update.

</decisions>

<decisions status="locked" source=".planning/intel/decisions.md" scope="configuration-security-and-privacy">

- **D-013 — `clientId` default and override:** Bundle the public Auth0 client ID and permit only an optional `clientId` override; keep AWS connection values and all other protocol constants internal.
- **D-015 — Poll and offline defaults:** Poll REST about every 15 minutes and confirm offline after two successful disconnected snapshots by default; accept confirmation counts 1 through 8.
- **D-016 — Monitoring-path failure:** Distinguish transport degradation from device offline, avoid a Monitoring Unavailable adapter, and clear degradation only after valid state resumes.
- **D-017 — Configurable adapters:** Publish all safety Contact Sensors by default and let `ignoredFaults` remove only enumerated adapters while retaining source state, diagnostics, records, and stable subtypes.
- **D-023 — Unattended credentials:** Store email/password in Homebridge configuration with explicit plaintext disclosure; cache the ID token only in Homebridge storage and keep all secrets out of logs and context.
- **D-024 — Local diagnostics only:** Collect no telemetry or automatic diagnostics, call no maintainer service, and log only redacted messages through Homebridge.
- **D-028 — One account:** Accept one singular account configuration and let that runtime own its credentials, inventory, and shared transports.

</decisions>

<decisions status="locked" source=".planning/intel/decisions.md" scope="state-commands-and-resilience">

- **D-014 — Preserve untrusted state:** Retain the last family-valid values through invalid data or communication loss, mark only the truthful scope faulty/inactive, and require fresh valid input for recovery.
- **D-018 — Self-test Switch:** Let reported `test_running` own the Switch, accept only valid on requests, reject cancellation/duplicates/stale paths, and do not invent physical eligibility rules.
- **D-019 — Alarm Mute Switch:** Let reported `alarm_audio_muted` own the Switch, support only the validated boolean on command, and expose no duration, timer, or unmute write.
- **D-020 — Counter lifecycle:** Persist one UTC observation epoch, count, and last-activation time per pump; provide no reset and start a new epoch after confirmed removal or unmigratable data.
- **D-029 — Confirm removal:** Remove an absent device only after two consecutive successful healthy inventories and a final current-inventory check; failed inventories never count.
- **D-030 — Preserve custom names:** Adopt vendor renames only while the HomeKit name still matches the prior vendor name; keep user customizations and functional service names.
- **D-031 — Failed restart behavior:** Preserve cached accessories and safety values, mark them stale, answer getters locally, disable commands until fresh, and reserve communication failure for rejected credentials.
- **D-036 — Main or child bridge:** Work on either Homebridge bridge mode, recommend but do not guarantee a child bridge, and do not implement a parallel bridge mechanism.
- **D-037 — Complete writes after API acceptance:** Keep reported state authoritative, track a 30-second pending request, clear on rejection/report/expiry, and never copy requested control state into safety data.
- **D-038 — 2.5-second API deadline:** Return an operation timeout after 2.5 seconds, retain uncertain pending state, and never automatically retry a potentially delivered command.

</decisions>

<decisions status="locked" source=".planning/intel/decisions.md" scope="release-and-governance">

- **D-025 — Best-effort current-release support:** Use public GitHub Issues without an SLA, request only versions/reproduction/redacted logs, and route vulnerabilities to private Security Advisories.
- **D-026 — Staged releases:** Publish experimental `0.x` builds on npm `next` with GitHub prerelease labels and release notes; block `1.0.0` on all gates and tests while preserving compatible identities.
- **D-027 — Sanitized artifacts:** Use stable placeholders, exclude raw/account/local-network data, and run secret and identifier scans before release.
- **D-032 — Node support:** Support and test Node.js 22 and 24, with package engines and CI aligned; do not promise Node.js 20.
- **D-033 — Homebridge support:** Support Homebridge `^1.8.0 || ^2.0.0`, remove `homebridge-lib`, use `api.hap`, and test minimum/latest 1.x plus current 2.x on applicable Node versions.
- **D-034 — Verified after 1.0:** Build against current Homebridge Verified criteria, request approval only after the validated 1.0 release, and never claim status before approval.
- **D-035 — Mixed license boundary:** License original standalone work under MIT, retain Apache 2.0 for template-derived material, preserve notices/headers, and align package metadata with the complete root license.

</decisions>

## Evolution

- Revisit active requirements and decision outcomes after each phase.
- Move a requirement to Validated only after implementation and verification pass.
- Record newly discovered protocol facts as proposed until hardware or authoritative evidence closes them.
- Never change an ADR-locked decision implicitly; revise the authoritative ADR first.

---
*Last updated: 2026-08-27 after ingested-document synthesis and initial roadmap creation*
