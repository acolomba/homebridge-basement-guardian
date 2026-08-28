
## DATA_b892df22_START D-001: Safety-first monitoring with standards-compliant breadth DATA_b892df22_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_678af706_START
    The plugin's primary purpose is safety-first monitoring. It must promptly surface flood risk, backup-pump operation, power loss, equipment faults, loss of trustworthy telemetry, and other conditions that affect basement protection.
    
    Within that safety-first purpose, expose as much trustworthy device information as the HomeKit Accessory Protocol supports. Information does not have to appear in Apple's Home app to be useful; standard characteristics visible in third-party HomeKit clients such as Eve are in scope.
    
    Use HomeKit services and characteristics according to their defined semantics. Do not mislabel device data as an unrelated standard measurement merely to make it visible in Apple Home.
    DATA_678af706_END
- scope: DATA_fb8c4aa2_START 1. Product purpose and release boundary DATA_fb8c4aa2_END

## DATA_eab7a8b4_START D-002: Gemini is the only supported v1 device family DATA_eab7a8b4_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_83f0b7f9_START
    The first release supports every `wayneWaterGemini` device discovered on the configured account.
    
    `wayneWaterHalo` and unknown API profiles are not implemented in v1. The runtime must identify them and log a clear explanation.
    
    The plugin does not publish a newly discovered device with an unsupported profile. C-002 defines the different policy for an existing physical accessory whose profile changes.
    DATA_83f0b7f9_END
- scope: DATA_39a985e1_START 1. Product purpose and release boundary DATA_39a985e1_END

## DATA_0bf3742d_START D-003: Device-family support must be additive DATA_0bf3742d_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_75527c67_START
    The architecture must define a stable device-family boundary. Gemini, HALO, and any future third device standard must be separate adapters behind that boundary. Adding a family must not require rewriting account authentication, cloud transports, canonical state storage, Homebridge lifecycle management, or reconciliation.
    
    An adapter owns its family's payload validation, domain decoding, capabilities, HomeKit service mapping, and command construction. No HALO behavior may be inferred into the Gemini adapter or vice versa.
    DATA_75527c67_END
- scope: DATA_227e6323_START 1. Product purpose and release boundary DATA_227e6323_END

## DATA_6c7f5515_START D-004: V1 commands are limited to official device controls DATA_6c7f5515_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_b76ecf64_START
    The first release includes monitoring plus the device controls presented to users by the official mobile app:
    
    - Run the Gemini system self-test.
    - Mute the Gemini audible alarm.
    
    The first release excludes direct pump on/off commands, device rename, provisioning, claiming or unclaiming, notification contacts, vendor email-rule management, and other account-administration operations.
    DATA_b76ecf64_END
- scope: DATA_5b62952c_START 1. Product purpose and release boundary DATA_5b62952c_END

## DATA_be172ef4_START G-001: Gemini alarm-mute protocol DATA_be172ef4_END
- source: docs/research/DECISIONS.md
- status: proposed
- decision: |
    DATA_a4794277_START
    The Gemini exposes `alarm_audio_muted`. The official BGSP50 manual establishes the local user-facing behavior: mute is selected in one-hour increments from one through eight hours.
    
    The official web application version 1.82.2 sends `{ "alarm_audio_muted": true }`. Its button is disabled while the device is offline or already muted.
    
    The application has no duration selector and sends no unmute command. Its muted-state message says **Run a system test to unmute**.
    
    The cloud acknowledgement, actual mute duration, timeout behavior, and alarm interactions still require hardware validation. The official client defines no command that can implement `muteDurationHours`.
    
    Do not copy HALO's different `siren_mute` model. Do not simulate a duration or unmute operation that the Gemini API does not expose.
    
    Alarm mute remains a required v1 capability. Implementation cannot start until official-client behavior or safe hardware measurements close this gate.
    DATA_a4794277_END
- scope: DATA_88061891_START 1. Product purpose and release boundary DATA_88061891_END

## DATA_615ca8a1_START C-001: Backup-pump activation notification and meaning DATA_615ca8a1_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_2131b11f_START
    The official application notifies the user immediately when the backup pump activates, including when activation occurs during a user-initiated self-test. The server-side rule with a 60-minute duration does not describe the complete application-notification path; it applies to a separate configured rule/action path such as email.
    
    Backup-pump activation does not by itself indicate AC power loss or primary-pump failure. During normal operation it indicates that inflow reached the backup-pump activation threshold or exceeded the primary pump's current capacity. The plugin must report the observed event without inventing a cause. AC power and primary-pump health remain separate signals.
    DATA_2131b11f_END
- scope: DATA_927e8f7e_START Corrections established during discussion DATA_927e8f7e_END

## DATA_3e9348bf_START C-002: Physical identity is separate from the API profile DATA_3e9348bf_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_7780cb37_START
    A physical device keeps one HomeKit identity for its service life. The vendor `deviceId` supplies this identity and remains the Homebridge UUID seed.
    
    The vendor `deviceId` includes the account identifier and hardware serial number. A hardware replacement has a different serial number and a different `deviceId`.
    
    The reported `deviceTypeId` selects an API adapter. A firmware or vendor API change can cause the same physical device to report a different profile.
    
    If the plugin supports the new profile, it binds the applicable adapter to the existing accessory. It preserves all semantically equivalent HomeKit services and their stable subtypes.
    
    The adapter reconciles profile-specific services from validated capabilities. It does not assume that Gemini and HALO expose identical raw fields or commands.
    
    If the plugin does not support the new profile, it preserves the cached accessory and its last valid values. It marks services inactive or faulty and disables commands.
    
    The plugin does not create a second accessory or unregister the existing accessory only because its API profile changed. A supported profile can resume the same accessory later.
    DATA_7780cb37_END
- scope: DATA_332d75c5_START Corrections established during discussion DATA_332d75c5_END

## DATA_c8d38157_START D-005: One accessory for each physical system DATA_c8d38157_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_351a5c19_START
    Publish one HomeKit accessory for each physical Basement Guardian system. Represent its capabilities as multiple stable services on that accessory. Do not split one pump system into unrelated HomeKit accessories solely to create more Apple Home tiles.
    DATA_351a5c19_END
- scope: DATA_9eb9bab4_START 2. HomeKit representation DATA_9eb9bab4_END

## DATA_ff94e625_START D-006: Standards first, explicit extensions second DATA_ff94e625_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_90a7b4c1_START
    Use a standard HomeKit service or characteristic when its defined meaning matches the Basement Guardian value. When HomeKit has no semantically correct representation, use a read-only, vendor-defined service or characteristic rather than mislabeling the value.
    
    Apple Home safety-notification adapters are allowed only as explicit, documented exceptions selected below. They must accompany a truthful domain representation and must not replace it.
    DATA_90a7b4c1_END
- scope: DATA_27b1e3d2_START 2. HomeKit representation DATA_27b1e3d2_END

## DATA_c5889e9f_START D-007: Water-level representation DATA_c5889e9f_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_fc0d84a6_START
    Expose:
    
    - A standard `LeakSensor` named **Sump Pit Flood**, active only at the validated top-level flood threshold.
    - A vendor-defined, read-only Sump Pit service carrying the standard `WaterLevel` percentage characteristic for capable third-party clients.
    
    Do not represent pit level as humidity, air quality, or another unrelated measurement. Do not expose a separate rising-water alarm. Routine water-level movement below the flood threshold is status, not an alert.
    DATA_fc0d84a6_END
- scope: DATA_63d82529_START 2. HomeKit representation DATA_63d82529_END

## DATA_b2e2a209_START G-002: Water-level encoding and thresholds DATA_b2e2a209_END
- source: docs/research/DECISIONS.md
- status: proposed
- decision: |
    DATA_c161f21a_START
    Only `water_level = 1` has hardware-validation evidence. Numeric conversion and the flood threshold remain gated until a natural cycle confirms the progression.
    
    The implementation must use an explicit legal-value lookup. Unknown values produce a fault and never produce a guessed level.
    DATA_c161f21a_END
- scope: DATA_7b3cf0e7_START 2. HomeKit representation DATA_7b3cf0e7_END

## DATA_a4ab6960_START D-008: Equipment-fault representation DATA_a4ab6960_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_7ae10461_START
    Expose equipment failures with standard `StatusFault` and `StatusActive` characteristics on the service that owns the condition, plus truthful read-only diagnostic details where needed.
    
    Also expose explicit Apple Home safety-notification adapters grouped by actionable subsystem:
    
    - **Primary Pump Fault**
    - **Backup Pump Fault**, including a blown or missing fuse
    - **Water Sensor Fault**
    - **Pump Controller Link Lost**
    - **Basement Guardian Offline**
    
    Exact raw causes remain available through the truthful domain services and diagnostics. Do not collapse all failures into one generic System Fault adapter, and do not split a subsystem into one adapter per raw bit.
    
    Device-reported pump, sensor, fuse, and pump-controller-link failures activate their notification adapters immediately. The plugin does not apply an alert delay.
    
    The offline adapter requires the confirmed condition from D-015. This confirmation is part of condition detection, not a delayed HomeKit notification.
    
    The offline confirmation count remains configurable. When a source condition recovers, its adapter clears immediately.
    
    High water, mains loss, backup-pump activation, equipment faults, and connectivity health remain distinct conditions.
    DATA_7ae10461_END
- scope: DATA_4f9da9bc_START 2. HomeKit representation DATA_4f9da9bc_END

## DATA_b480e38b_START D-009: Pump state and activity records DATA_b480e38b_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_30a456e1_START
    Primary and backup pumps each receive a truthful, read-only custom Pump service. Expose live operation through standard HAP characteristics where they fit.
    
    Also expose standard Contact Sensor activity adapters. Name the primary adapter **Primary Pump Running**. The **Backup Pump Activated** adapter defined in D-010 serves as the backup activity adapter.
    
    Persist an observed activation count and a last-observed-activation timestamp for each pump. These values describe activity that the plugin detected. They are not device lifetime totals and can be incomplete after a monitoring outage.
    
    Expose the observation start time for each pump as a read-only custom characteristic. D-020 defines the counter lifecycle.
    
    V1 must not depend on `fakegato-history` or emulate Eve's private history protocol. It must not include a detailed-history retention setting. Apple Home can record eligible Contact Sensor transitions in Activity History, but the home hub owns that record. The plugin cannot set its retention period or insert a missed event into it.
    
    Normal primary-pump cycles and routine rain-driven activity are status and activity, not safety alerts.
    DATA_30a456e1_END
- scope: DATA_7277871e_START 2. HomeKit representation DATA_7277871e_END

## DATA_ee3ad85e_START G-003: Apple Activity History for bridged pump sensors DATA_ee3ad85e_END
- source: docs/research/DECISIONS.md
- status: proposed
- decision: |
    DATA_3529a5d2_START
    Apple documents up to 30 days of Activity History for supported accessories, including contact sensors. This requires a supported home hub and the current Home architecture. Validate both bridged pump Contact Sensors with a real Apple home before release.
    
    Do not use Apple Activity History as a safety-delivery mechanism. Do not claim that it contains events missed while Homebridge or the home hub was offline. See Apple's [Activity History requirements](https://support.apple.com/en-gb/105011).
    DATA_3529a5d2_END
- scope: DATA_e8b7ec0d_START 2. HomeKit representation DATA_e8b7ec0d_END

## DATA_103af21d_START D-010: Backup-pump notification and activity records DATA_103af21d_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_e6ef70f2_START
    Expose backup-pump activation in two truthful layers:
    
    - The truthful Backup Pump service reports live operation, timestamps, and observed counters.
    - A standard Apple Home safety-notification adapter named **Backup Pump Activated** reports activation prominently.
    
    Every live backup-pump activation, including activation during a self-test, activates **Backup Pump Activated** immediately. It also updates the local observed count and timestamp. The service and notification adapter return to normal when the pump stops.
    
    If reconciliation finds a newer `backup_pump_timestamp` after the pump stopped, update one de-duplicated local activation record. Do not synthesize a HomeKit sensor pulse or a late **Backup Pump Activated** notification. Either action would misrepresent the current state.
    
    Do not expose a durable acknowledgement latch or control. HomeKit has no standard acknowledgement model. The persistent observed count and last-activation timestamp preserve evidence without corrupting current state. See Apple's [standard service catalog](https://developer.apple.com/documentation/homekit/accessory-service-types) and [characteristic model](https://developer.apple.com/documentation/homekit/hmcharacteristic).
    
    Do not attribute a cause to the activation. AC power and primary-pump health are separate signals.
    DATA_e6ef70f2_END
- scope: DATA_d619e31a_START 2. HomeKit representation DATA_d619e31a_END

## DATA_165d899e_START D-011: Mains-power representation DATA_165d899e_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_152131d7_START
    Expose mains presence truthfully in a vendor-defined, read-only Power service. Also expose a standard `ContactSensor` named **Mains Power Lost** as an explicit Apple Home safety-notification adapter.
    DATA_152131d7_END
- scope: DATA_45a1dde9_START 2. HomeKit representation DATA_45a1dde9_END

## DATA_386ea854_START D-012: Backup-battery representation DATA_386ea854_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_853efb95_START
    Expose exact vendor battery facts in a truthful custom battery service: charging state, voltage-low state, health enum, and estimated protection-duration band.
    
    Also expose a standard HomeKit Battery service. Because the device provides duration bands rather than a true charge percentage, map the four bands to documented estimated percentages of 25, 50, 75, and 100. Expose standard low-battery and charging state alongside the exact vendor values. The UI and documentation must identify the percentage as an estimate, not a measured state of charge.
    DATA_853efb95_END
- scope: DATA_268c2d9b_START 2. HomeKit representation DATA_268c2d9b_END

## DATA_ee62672c_START D-013: `clientId` default and override DATA_ee62672c_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_b961a472_START
    Ship the public Auth0 client ID as a bundled data default so ordinary users do not need to provide it. The optional plugin configuration field is named `clientId`. It overrides the bundled default without requiring a source change or plugin release. This provides an operational recovery path if the vendor rotates or replaces its public client ID.
    
    `clientId` is the only client ID exposed in plugin configuration. The AWS IoT client ID is an internal connection value obtained dynamically from `GET /credentials/aws`; it must not be configurable or use the bundled Auth0 default.
    
    The other vendor bootstrap constants remain internal and are not configurable: the REST API URL, Auth0 domain and realm, AWS region, and WebSocket protocol. REST route templates and family-specific command shapes are also internal protocol details. A compatible change to any of these values requires a plugin update so it can be tested and released with the related protocol changes.
    
    The effective authentication client ID is `config.clientId` when provided and otherwise the bundled `clientId`. No other user-provided value overrides the vendor protocol definition.
    
    The effective client ID must never be confused with a secret. Credentials and tokens remain sensitive and must not be logged.
    DATA_b961a472_END
- scope: DATA_2e005499_START 3. Configuration decisions DATA_2e005499_END

## DATA_ebfb7c22_START D-015: REST polling and offline confirmation defaults DATA_ebfb7c22_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_550589a9_START
    Poll the REST device snapshot approximately every 15 minutes by default. The interval must be configurable and documented as approximate because request duration, retry backoff, and scheduler jitter can move an individual poll.
    
    Activate **Basement Guardian Offline** after two consecutive successful REST snapshots report `connectivity.connected === false` by default.
    
    The `offlineConfirmationPollCount` configuration field sets the required count. It accepts integers from 1 through 8 and defaults to 2.
    
    With the default, detection takes approximately 15–30 minutes. A value of 1 takes 0–15 minutes, and a value of 8 takes 105–120 minutes.
    
    A successful snapshot reporting `connectivity.connected === true` resets a pending confirmation and clears an active offline condition without requiring two recovery polls. A failed REST request is not evidence that the device itself reported disconnected and does not count as a negative snapshot; loss of the monitoring path requires a separate policy decision.
    DATA_550589a9_END
- scope: DATA_11995261_START 3. Configuration decisions DATA_11995261_END

## DATA_01a0e092_START D-016: Monitoring-path failure changes status but does not create an alert adapter DATA_01a0e092_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_aece2321_START
    A REST request failure does not activate **Basement Guardian Offline**, because the device did not report `connectivity.connected === false`. Do not publish a separate **Monitoring Unavailable** safety-notification adapter.
    
    Apply the narrowest truthful degradation:
    
    - If MQTT continues to deliver valid device state, keep the device services active and report only that REST reconciliation or cloud-status verification is degraded in diagnostics.
    - If both the push path and REST reconciliation cease providing trustworthy state, preserve the last valid values and mark affected services stale, inactive, or faulty under D-014. Do not generate a separate HomeKit safety notification.
    - Log and expose the transport problem without relabeling it as a physical device failure.
    - Clear the degraded transport status after the relevant path successfully resumes and supplies valid data.
    
    **Basement Guardian Offline** remains tied exclusively to confirmed successful REST snapshots reporting that the device is disconnected.
    DATA_aece2321_END
- scope: DATA_4ba87ec7_START 3. Configuration decisions DATA_4ba87ec7_END

## DATA_5e8e8ecb_START D-017: Configurable Apple Home notification adapters DATA_5e8e8ecb_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_16157ad7_START
    Keep the explicit Contact Sensor adapters as safety-first exceptions. Publish all adapters by default.
    
    The plugin configuration accepts an optional `ignoredFaults` string array. Each value removes one Apple Home notification adapter from every discovered device.
    
    Valid values are:
    
    - `backup-pump-activated`
    - `mains-power-lost`
    - `primary-pump-fault`
    - `backup-pump-fault`
    - `water-sensor-fault`
    - `pump-controller-link-lost`
    - `basement-guardian-offline`
    
    The option name includes events that are not equipment faults. The values identify the optional notification adapters, not the source conditions.
    
    An ignored value removes only its Contact Sensor adapter. The plugin must keep source data, truthful service state, status flags, local counters, timestamps, and logs.
    
    Removing an adapter can also remove its Apple Activity History view. Apple builds that view from the published HomeKit service. This effect does not remove local counters or timestamps.
    
    The configuration defaults to an empty array. The schema must reject duplicate and unknown values. Adapter service subtypes must stay stable when users change this configuration.
    
    The native **Sump Pit Flood** Leak Sensor and the standard Battery service are not part of `ignoredFaults`.
    DATA_16157ad7_END
- scope: DATA_fde2e399_START 3. Configuration decisions DATA_fde2e399_END

## DATA_413d7969_START F-001: The device shadow is current state, not an event log DATA_413d7969_END
- source: docs/research/DECISIONS.md
- status: proposed
- decision: |
    DATA_bcf846c2_START
    The plugin must treat MQTT shadow messages as state synchronization. A reconnecting client can request the latest complete shadow document, but it cannot request a replay of every transition that occurred while it was disconnected.
    
    Consequences:
    
    - A missed update for a condition that remains active is recoverable through a shadow `get` or the REST snapshot.
    - A condition that starts and clears while the plugin is disconnected can be lost unless another durable field records the event.
    - The implementation must request the complete shadow after startup and reconnect.
    - The REST device snapshot must be polled as a recovery backstop. The initial target interval is approximately 15 minutes and remains configurable.
    - MQTT subscription persistence must not be treated as proof of event replay.
    
    AWS documentation: [Retaining device state](https://docs.aws.amazon.com/iot/latest/developerguide/iot-shadows-tutorial.html), [Using shadows in apps and services](https://docs.aws.amazon.com/iot/latest/developerguide/device-shadow-comms-app.html).
    DATA_bcf846c2_END
- scope: DATA_ddb8f421_START 4. Alert delivery and recovery facts DATA_ddb8f421_END

## DATA_54a56609_START F-002: Alert-source delivery characteristics DATA_54a56609_END
- source: docs/research/DECISIONS.md
- status: proposed
- decision: |
    DATA_973ee061_START
    The observed device heartbeat is approximately 898 seconds. It repeats only a subset of the shadow. Other fields are change-driven and are not known to repeat periodically.
    
    | HomeKit condition | Vendor server timer | Authoritative device field(s) | Live delivery | Periodically repeated by device | REST or full-shadow recovery | If one MQTT update is lost |
    |---|---:|---|---|---|---|---|
    | Sump Pit Flood | 0 min | `data.water_level` | Change push | Yes, about every 898 seconds | Yes | An active high-water state is recovered. A brief high-water interval can be lost. |
    | Mains Power Lost | 0 min | `data.ac_power` | Change push | No observed repeat | Yes | An outage still in progress is recovered. An outage that starts and ends during the blind interval can be lost. |
    | Low Battery — voltage flag | 0 min | `data.battery_voltage_low` | Change push | No observed repeat | Yes | A persistent low-voltage condition is recovered. A brief asserted-and-cleared interval can be lost. |
    | Low Battery — health/protection | 60–1440 min by condition | `data.battery_health`, `data.hours_of_protection` | Change push | Yes, about every 898 seconds | Yes | The next heartbeat, full-shadow request, or REST poll repairs the state. |
    | Backup Pump Activated | App push is immediate; email rule is 60 min | `data.backup_pump_running`, `data.backup_pump_timestamp`, `data.test_timestamp` | Change push | No observed repeat | Yes, including the latest timestamps | A live start/stop interval can be missed. A changed backup-pump timestamp can recover that an activation occurred, but not its duration. |
    | Primary Pump Fault | 240 min | `data.primary_pump_fault` | Change push | No observed repeat | Yes | A fault that remains active is recovered. A fault that clears during the blind interval can be lost. |
    | Backup Pump Fault | 60 min | `data.backup_pump_fault` | Change push | No observed repeat | Yes | A fault that remains active is recovered. A fault that clears during the blind interval can be lost. |
    | Backup Pump Fuse Fault | 240 min | `data.backup_pump_fuse_blown` | Change push | No observed repeat | Yes | A fault that remains active is recovered. A fault that clears during the blind interval can be lost. |
    | Water Sensor Fault | 60 min | `data.water_sensor_fault` | Change push | No observed repeat | Yes | A fault that remains active is recovered. A fault that clears during the blind interval can be lost. |
    | Pump Controller Link Lost | No vendor rule | `data.serial_communications` | Change push | Yes, about every 898 seconds | Yes | The next heartbeat, full-shadow request, or REST poll repairs the state. |
    | Basement Guardian Offline — device view | 480 min | `data.offline` | Change push | Yes, about every 898 seconds while the device can report | Yes | Useful corroboration, but it cannot report after connectivity is lost. |
    | Basement Guardian Offline — cloud view | Same condition; no separate rule | `connectivity.connected` | REST snapshot | Not MQTT push in the observed protocol | Yes; polling is the source | Detection is subject to the configured REST polling and confirmation intervals. |
    
    The vendor timer is a delay applied by the vendor's server-side email rule after it observes the condition. It is not a polling cadence. The official app's backup-pump notification is independently observed to be immediate.
    
    The heartbeat evidence is recorded in [OPERATIONS.md](./OPERATIONS.md), and the field inventory is recorded in [API.md](./API.md).
    DATA_973ee061_END
- scope: DATA_10d3a5da_START 4. Alert delivery and recovery facts DATA_10d3a5da_END

## DATA_d4457270_START F-003: “Repeated push” does not mean queued delivery DATA_d4457270_END
- source: docs/research/DECISIONS.md
- status: proposed
- decision: |
    DATA_1864d524_START
    A repeated heartbeat is another current-state report. It is not a retry of a specific notification and does not preserve event ordering. Missing one heartbeat is harmless for the fields included in the next heartbeat. Missing a change-only transition can lose the event if the state changes back before recovery.
    
    The plugin must therefore separate:
    
    1. live MQTT synchronization,
    2. complete shadow synchronization after startup or reconnect,
    3. periodic REST reconciliation, and
    4. durable event detection from monotonic timestamps where available.
    DATA_1864d524_END
- scope: DATA_88678cca_START 4. Alert delivery and recovery facts DATA_88678cca_END

## DATA_b22e8990_START F-004: Alert adapters return to normal with source recovery DATA_b22e8990_END
- source: docs/research/DECISIONS.md
- status: proposed
- decision: |
    DATA_f67117b7_START
    The observed shadow fields represent current state, so their HomeKit representations must follow both transitions. For example, `ac_power: true -> false` activates **Mains Power Lost**. The recovery transition clears it.
    
    When a source fault returns to `false`, its fault adapter clears. When an unsafe condition ends, its water or battery service clears.
    
    The plugin does not delay these HomeKit transitions. Thus, HomeKit state, automations, Activity History, and notification eligibility use the same transition time.
    
    **Backup Pump Activated** has two representations:
    
    - The live Pump service and transient notification adapter follow `backup_pump_running` in both directions and return to inactive when the pump stops.
    - If reconciliation finds a newer `backup_pump_timestamp` after both live edges were missed, the plugin updates one de-duplicated local activation record. It does not synthesize a notification-adapter transition.
    
    No alert adapter remains active after its underlying condition has recovered.
    DATA_f67117b7_END
- scope: DATA_9d7bfa74_START 4. Alert delivery and recovery facts DATA_9d7bfa74_END

## DATA_df08c393_START D-014: Preserve last known state and mark it untrustworthy DATA_df08c393_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_6c2d860d_START
    When communication fails or a payload value is invalid, preserve the last successfully validated value. Do not replace it with a normal default, an invented alarm value, `0`, or `false`.
    
    Apply the failure at the narrowest truthful scope:
    
    - If `serial_communications` becomes `false`, preserve pump-controller-derived values, set `StatusFault = GENERAL_FAULT` on affected services, activate **Pump Controller Link Lost**, and expose when trustworthy controller data was last received.
    - If cloud connectivity is confirmed lost, preserve the last valid snapshot, set `StatusActive = false` on cloud-dependent services, activate **Basement Guardian Offline**, and expose the last successful cloud-update time.
    - If an individual field fails family validation, reject that field update, preserve its last valid value, and mark the owning service faulty. Other valid fields in the same partial payload may still update.
    - A partial heartbeat that omits a field never clears or resets that field.
    - An existing flood, fault, or power-loss state never clears merely because communication was lost or an input became invalid.
    
    Clear stale or fault status only after receiving fresh, family-valid data from the failed source. A socket reconnect or successful authentication alone is not recovery. HomeKit safety sensors continue to represent their last known condition while the separate status and alert characteristics make the loss of trust explicit.
    DATA_6c2d860d_END
- scope: DATA_b2f657d5_START 5. Stale and invalid telemetry DATA_b2f657d5_END

## DATA_b5ede49e_START D-018: The System Self-Test Switch reconciles with device state DATA_b5ede49e_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_7e5f0567_START
    Expose the Gemini system test as a standard Switch named **System Self-Test**. The reported `test_running` value is its long-term state authority.
    
    An on command requests one system test. D-037 controls command acceptance, temporary requested state, and asynchronous confirmation.
    
    The Switch remains on for the reported test duration. It returns to off when the device reports `test_running === false`.
    
    The device does not expose a cancel command. Reject an off command while a test is active. An off command while idle has no effect.
    
    Reject an on command when another test is active or pending. Reject the command when state is stale, the device is offline, or the authenticated command path is unavailable.
    
    The official web application, version 1.82.2, disables its Gemini test button only when `deviceData.offline` is true. It replaces the button while `test_running` is true.
    
    The official command handler does not examine equipment faults, water level, AC power, battery state, or current pump activity. Live user experience confirms that faults do not prevent a test.
    
    Match this eligibility policy. Do not block a test only because a physical fault or alarm is active.
    
    The plugin also requires fresh device state and an authenticated command path. These requirements make command delivery trustworthy. They do not add a physical eligibility policy.
    
    If confirmation does not arrive within 30 seconds, restore the last reported Switch state. A later valid report still updates the Switch.
    
    A test started by the vendor application or an automatic schedule also changes the Switch state. Never copy requested state into canonical device or safety state.
    DATA_7e5f0567_END
- scope: DATA_848c8d2e_START 6. Command behavior DATA_848c8d2e_END

## DATA_94187b57_START D-019: Alarm Mute follows the official boolean control DATA_94187b57_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_25dd597f_START
    Expose the Gemini alarm mute state as a standard Switch named **Alarm Mute**. The reported `alarm_audio_muted` value is its long-term state authority.
    
    An on command sends `{ "alarm_audio_muted": true }`. D-037 controls command acceptance, temporary requested state, and asynchronous confirmation.
    
    Reject an on command when mute is active or pending. Reject the command when state is stale, the device is offline, or the authenticated command path is unavailable.
    
    The Gemini API exposes no unmute write. Reject an off command while mute is active. An off command while the Switch is already off has no effect.
    
    The Switch returns to off only when the device reports `alarm_audio_muted === false`. A system test is the only explicit unmute action in the official application.
    
    Do not add `muteDurationHours`. Do not expose a configured or remaining duration. Do not simulate an unmute timer.
    
    G-001 requires hardware validation of command acknowledgement, state confirmation, actual duration, and failure behavior before release.
    DATA_25dd597f_END
- scope: DATA_f26372c3_START 6. Command behavior DATA_f26372c3_END

## DATA_083e69f8_START D-020: Observed pump counter lifecycle DATA_083e69f8_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_fa58cbcb_START
    Create a separate observation record for each pump. Set its observation start time when the plugin accepts the first valid pump state.
    
    Each observation record contains these values:
    
    - The observation start time.
    - The observed activation count.
    - The last-observed-activation time, if an activation occurred.
    
    Use UTC ISO 8601 timestamps. Expose all three values as read-only custom characteristics on the applicable Pump service.
    
    Store these records in the typed accessory context. Preserve them across Homebridge restarts, plugin upgrades, configuration changes, credential changes, and temporary monitoring outages.
    
    Do not expose a HomeKit reset control or a configuration reset option. Removal of the cached physical accessory removes its observation records.
    
    If the same device returns after confirmed removal, create a new accessory context and observation epoch. Do not join counts from the old epoch.
    
    If stored counter data is invalid and cannot migrate, log a warning and create a new observation epoch. Never guess or silently reuse invalid values.
    DATA_fa58cbcb_END
- scope: DATA_8ad5a284_START 6. Command behavior DATA_8ad5a284_END

## DATA_b562110f_START D-021: Do not represent battery maintenance as filter maintenance DATA_b562110f_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_30f9404d_START
    Do not expose a `FilterMaintenance` service for battery health or replacement. `FilterChangeIndication` and `FilterLifeLevel` describe a filter, not a battery.
    
    The battery representation remains the standard Battery service and the custom read-only Battery service from D-012. These services provide the applicable standard states and exact vendor facts.
    
    Do not misuse an unrelated standard service to obtain a tile, status label, or notification.
    DATA_30f9404d_END
- scope: DATA_84ffff79_START 6. Command behavior DATA_84ffff79_END

## DATA_3d34e8fe_START D-022: HomeKit notification adapters do not simulate delays DATA_3d34e8fe_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_9da9eb58_START
    HomeKit has no accessory setting that requests a notification after a condition remains active for a specified duration.
    
    Each derived source change must update its standard alert service immediately. Do not delay a characteristic update to simulate a delayed notification.
    
    Do not add `alertDelays` or an equivalent plugin configuration field. Apple Home users can apply its supported time and presence filters.
    
    Offline confirmation remains part of the derived offline condition. When that condition becomes true, update **Basement Guardian Offline** immediately.
    
    This rule keeps HomeKit state, automations, Activity History, and notification eligibility on the same timeline. Vendor email timers do not change this rule.
    
    See Apple's [accessory notification settings](https://support.apple.com/en-ca/105042) and the HAP-NodeJS [`updateCharacteristic` behavior](https://github.com/homebridge/HAP-NodeJS/blob/latest/src/lib/Service.ts).
    DATA_9da9eb58_END
- scope: DATA_02d82f70_START 6. Command behavior DATA_02d82f70_END

## DATA_df4abf87_START D-023: Store account credentials for unattended authentication DATA_df4abf87_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_cfb0631a_START
    V1 stores the vendor account email and password in the Homebridge `config.json` file. This choice permits unattended authentication after token expiry.
    
    The Homebridge form uses a password widget. This widget masks the field, but it does not encrypt the stored value.
    
    The raw configuration editor and Homebridge backups contain the password. Show this fact in the setup form and the user documentation.
    
    Cache the Auth0 `id_token` under `api.user.storagePath()`. Do not write the token into `config.json` or an accessory context.
    
    Treat the password, ID token, and temporary AWS credentials as secrets. Do not write them to logs, error messages, diagnostics, or telemetry.
    
    Redact authentication headers and request bodies before error logging. The plugin sends the password only to the vendor Auth0 tenant.
    
    V1 does not require a custom token-only setup interface. No validated refresh-token flow supports reliable unattended operation without the stored password.
    DATA_cfb0631a_END
- scope: DATA_b20cec3b_START 6. Command behavior DATA_b20cec3b_END

## DATA_ef50b861_START D-024: Keep diagnostics local and collect no telemetry DATA_ef50b861_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_27d78634_START
    Do not add analytics, usage telemetry, crash reporting, installation pings, tracking identifiers, or automatic diagnostic uploads.
    
    Operational network calls must go only to the vendor services that provide authentication, device state, and commands. The plugin must not call a maintainer-operated service.
    
    Write runtime messages through the Homebridge logger. Apply the secret-redaction rules from D-023 before each message enters the logger.
    
    The plugin does not upload logs or diagnostics. A user can choose to copy redacted information into a support request.
    
    Review direct dependencies for telemetry behavior before release. If a dependency sends data outside the vendor path, disable its telemetry or replace it.
    DATA_27d78634_END
- scope: DATA_cbe8a63a_START 6. Command behavior DATA_cbe8a63a_END

## DATA_fe734573_START D-025: Provide best-effort support for the current release DATA_fe734573_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_a3b808d3_START
    Use the public GitHub Issues tracker for bug reports, feature requests, and user support for the current stable release.
    
    Support is best effort. Do not promise a response time, resolution time, continued compatibility, or a service-level agreement.
    
    Ask reporters for the plugin version, Homebridge version, Node.js version, reproduction steps, and redacted logs. Never ask for passwords, tokens, or complete configuration files.
    
    Use private GitHub Security Advisories for vulnerability reports. The public issue templates must direct security reporters to that private channel.
    
    Do not backport routine fixes to older release lines. Ask users to reproduce a problem on the current stable release before investigation.
    
    The support policy does not create automatic diagnostic collection. D-024 continues to control all diagnostic sharing.
    DATA_a3b808d3_END
- scope: DATA_af927a6f_START 6. Command behavior DATA_af927a6f_END

## DATA_658b10d9_START D-026: Use staged prereleases before version 1.0 DATA_658b10d9_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_34d144e5_START
    Use Semantic Versioning for package releases. Publish prerelease builds under version `0.x` with the npm `next` distribution tag.
    
    Mark each corresponding GitHub release as a prerelease. Do not point the npm `latest` tag to a prerelease build.
    
    Prerelease documentation must identify the build as experimental. It must tell users to keep the vendor alarm and vendor notifications enabled.
    
    Publish version `1.0.0` only after validation gates G-001, G-002, and G-003 pass. The required automated and real-home tests must also pass.
    
    Create release notes for every published package. Record user-visible changes, configuration migrations, known limitations, and validation status.
    
    After version 1.0, use major versions for breaking configuration or HomeKit identity changes. Preserve accessory UUIDs and service subtypes across compatible upgrades.
    DATA_34d144e5_END
- scope: DATA_ed284269_START 6. Command behavior DATA_ed284269_END

## DATA_9fe342c8_START D-027: Sanitize public and planning artifacts DATA_9fe342c8_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_8fafcf14_START
    Public files and committed planning artifacts must use sanitized examples and stable placeholder identifiers.
    
    Do not publish raw cloud responses, local-network records, packet captures, session logs, or account data.
    
    Remove account IDs, emails, tokens, temporary credentials, serial numbers, hardware addresses, hostnames, and local addresses.
    
    The plugin data file can contain the required public Auth0 client ID and vendor endpoints. Documentation and fixtures must use placeholders.
    
    Run automated secret and identifier scans before each public release.
    DATA_8fafcf14_END
- scope: DATA_640b602c_START 6. Command behavior DATA_640b602c_END

## DATA_a964255d_START D-028: Use one vendor account per Homebridge instance DATA_a964255d_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_ddb8d04b_START
    V1 accepts one Basement Guardian vendor account in one singular platform configuration. It discovers and publishes every supported Gemini device returned for that account.
    
    Do not add an accounts array or permit multiple Basement Guardian platform blocks in one Homebridge instance. Each account runtime owns one credential set, one authentication lifecycle, one discovered inventory, and the shared transports for that account.
    
    Users who must isolate different vendor accounts can run separate Homebridge instances or child-bridge processes. Multi-account orchestration within one plugin instance is outside the v1 scope. The device-family boundary from D-003 remains independent of this account boundary.
    DATA_ddb8d04b_END
- scope: DATA_a1e6c694_START 6. Command behavior DATA_a1e6c694_END

## DATA_f7d0982c_START D-029: Remove an absent device after two successful inventories DATA_f7d0982c_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_00a2dfd0_START
    The plugin removes a cached accessory after the device is absent from two consecutive successful inventories. The account runtime must be authenticated and healthy.
    
    A failed or incomplete inventory does not count as an absence. It also does not clear an absence that a prior successful inventory reported.
    
    If a successful inventory contains the device, the plugin clears the pending absence immediately. The removal callback examines the latest successful inventory before it unregisters the accessory.
    
    This policy adds at least one poll interval between the first reported absence and removal. With the default interval, the minimum confirmation time is approximately 15 minutes.
    
    The removal interval is not configurable in v1. A confirmed removal deletes the cached accessory and its observation records, as specified in D-020.
    DATA_00a2dfd0_END
- scope: DATA_e0dbeac2_START 6. Command behavior DATA_e0dbeac2_END

## DATA_0173b421_START D-030: Preserve a customized HomeKit accessory name DATA_0173b421_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_95fb45ec_START
    The plugin uses the vendor device name when it creates a HomeKit accessory. It stores that vendor name in the typed accessory context.
    
    If the vendor name changes, the plugin compares the HomeKit name with the prior vendor name. It applies the new vendor name only when both names match.
    
    If the names do not match, the plugin treats the HomeKit name as a user customization. It preserves the customized name and stores the new vendor name for later comparisons.
    
    The functional service names remain stable. A vendor device rename does not rename services such as **Primary Pump Running** or **Sump Pit Flood**.
    
    V1 does not include a name template or a name-synchronization configuration field.
    DATA_95fb45ec_END
- scope: DATA_59bcce32_START 6. Command behavior DATA_59bcce32_END

## DATA_26ae4951_START D-031: Preserve cached values after a failed restart DATA_26ae4951_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_02f616db_START
    If fresh state is unavailable after a restart, the plugin keeps each cached accessory and its cached HomeKit values. It does not persist a complete vendor snapshot.
    
    The plugin preserves active safety conditions. It marks the affected services inactive or faulty until it receives fresh, family-valid state.
    
    Characteristic getters return cached values without a network request. A transient cloud or monitoring error does not produce a `HapStatusError` or a HomeKit **No Response** state.
    
    The plugin disables commands until the command path and applicable device state are fresh. Fresh, valid state updates the characteristics and clears the applicable stale status.
    
    If Auth0 explicitly rejects the configured credentials, getters can return `SERVICE_COMMUNICATION_FAILURE`. This permanent error requires user action and follows HAP-NodeJS guidance.
    
    If no cached accessory exists, the plugin publishes nothing until a successful inventory supplies valid device state. The plugin does not create an alarm transition from cached startup values.
    DATA_02f616db_END
- scope: DATA_abffd36e_START 6. Command behavior DATA_abffd36e_END

## DATA_0f902e00_START D-032: Support the current Homebridge Node.js runtimes DATA_0f902e00_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_a192eba6_START
    V1 supports Node.js 22 and Node.js 24. These versions are the Homebridge-supported LTS releases as of August 2026.
    
    Do not declare or promise Node.js 20 support. Node.js 20 reached the end of Homebridge support in April 2026.
    
    The package `engines.node` field and CI matrix must contain the same supported versions. Remove Node.js 20 from CI during implementation.
    
    Reexamine the supported Node.js versions before each major release and before a Homebridge verification request.
    DATA_a192eba6_END
- scope: DATA_4d6de091_START 6. Command behavior DATA_4d6de091_END

## DATA_189ba3e8_START D-033: Support Homebridge 1.8 and Homebridge 2 DATA_189ba3e8_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_f5d50f33_START
    V1 supports Homebridge `^1.8.0 || ^2.0.0`. The implementation uses the plugin and HAP APIs that both major versions provide.
    
    Remove the `homebridge-lib` runtime dependency. Version 8 requires Homebridge 2.2.1 or later and conflicts with the Homebridge 1 support policy.
    
    Define the required custom services and characteristics with the HAP objects from `api.hap`. Do not import `hap-nodejs` or `@homebridge/hap-nodejs` directly at runtime.
    
    Use the Homebridge 2 forms of APIs that remain available in Homebridge 1.8. Examples include `Service.Battery`, `Characteristic.value`, and `Accessory.getServiceById()`.
    
    Do not use removed reachability APIs. Continue to represent health with `StatusActive`, `StatusFault`, and the explicit safety-notification adapters.
    
    CI must include the minimum Homebridge 1.8 release, the latest Homebridge 1 release, and the current Homebridge 2 release. Test these runtimes on applicable Node.js 22 and 24 versions.
    DATA_f5d50f33_END
- scope: DATA_1269cdbf_START 6. Command behavior DATA_1269cdbf_END

## DATA_adfe4f90_START D-034: Request Homebridge Verified status after version 1.0 DATA_adfe4f90_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_a9f5c060_START
    Design, implement, document, and test each prerelease against the current Homebridge Verified criteria. Do not claim verified status before Homebridge approves the plugin.
    
    After all version 1.0 validation gates pass, publish version 1.0 and request verification. Resolve applicable review findings before advertising the plugin as verified.
    
    Reexamine the verification criteria before each prerelease and immediately before the request. The Homebridge project can change these criteria.
    
    Verification does not replace the safety validation gates, security review, real-home tests, or support policy in this document.
    DATA_a9f5c060_END
- scope: DATA_54919f66_START 6. Command behavior DATA_54919f66_END

## DATA_05dd1820_START D-035: License original project work under MIT DATA_05dd1820_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_dc47b780_START
    License original project work under the MIT License. Do not claim that the MIT License replaces the license on material from the Homebridge plugin template.
    
    The template uses the Apache License 2.0. Preserve the complete Apache License 2.0 text in the distributed source and package while template-derived material remains.
    
    Identify the Homebridge plugin template and its Apache license in the public third-party notices. Preserve applicable copyright, patent, trademark, and attribution notices.
    
    Mark modified template files as changed, as Apache License 2.0 section 4 requires. Use file-level license identifiers to distinguish Apache-derived files from original MIT files.
    
    Keep modified template files under Apache License 2.0 for a clear file-level boundary. Use MIT for new standalone files that do not contain template material.
    
    While both sets remain, set `package.json` to `SEE LICENSE IN LICENSE`. The root `LICENSE` must explain the boundary and include both complete license texts.
    
    Before the first public package, make the root license, package metadata, file headers, and third-party notices describe the same licensing boundary. Examine the packed npm artifact to make sure that it contains these files.
    
    If the implementation replaces all material from the template, reexamine the Apache preservation requirement. Do not remove its license or attribution based only on a rewritten file or changed Git history.
    DATA_dc47b780_END
- scope: DATA_737649ca_START 6. Command behavior DATA_737649ca_END

## DATA_96a01bff_START D-036: Support the main bridge and a child bridge DATA_96a01bff_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_c07886cc_START
    The plugin supports operation on the main Homebridge bridge and on a child bridge. Do not require either mode.
    
    Recommend a child bridge in the public documentation. Its separate process isolates plugin crashes, startup delays, dependencies, and restarts from other plugins.
    
    The recommendation is not a safety or availability guarantee. A child bridge does not protect against host, network, HomeKit, or vendor-service failures.
    
    One dynamic platform instance publishes all supported devices for its vendor account on the same bridge. The plugin does not split devices across child bridges.
    
    Homebridge owns the child-bridge configuration, process, HAP identity, and pairing flow. The plugin must accept Homebridge-owned bridge metadata and must not implement a parallel bridge mechanism.
    
    Document that the child bridge needs a separate HomeKit pairing. Warn that changing bridge mode can recreate accessories and disrupt rooms, scenes, and automations.
    DATA_c07886cc_END
- scope: DATA_c86c6928_START 6. Command behavior DATA_c86c6928_END

## DATA_27b15f63_START D-037: Complete HomeKit writes after vendor API acceptance DATA_27b15f63_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_7be6c2d7_START
    For self-test and alarm mute, wait for the vendor API response. Do not wait for reported state inside the HomeKit write handler.
    
    Set pending state before dispatch. This state expires 30 seconds after dispatch begins.
    
    If the vendor API rejects the request, clear pending state and return the applicable HAP error. Do not mark the command as accepted.
    
    If the vendor API accepts the request, complete the HomeKit write. HAP then holds the requested Switch value while confirmation remains pending.
    
    Reject another command for the same control while this pending state exists.
    
    Reported device state remains authoritative. A newer report that includes the command field clears pending state and updates the Switch immediately.
    
    If no confirmation arrives within 30 seconds, clear the pending state. Restore the last reported Switch value and log a warning.
    
    The original HomeKit write cannot receive an error after it completes. A valid late report still updates the Switch through the normal state path.
    
    Never apply the temporary requested value to canonical device state, safety conditions, counters, timestamps, or notification adapters.
    DATA_7be6c2d7_END
- scope: DATA_d6d00d4a_START 6. Command behavior DATA_d6d00d4a_END

## DATA_17445ce8_START D-038: Limit the vendor API wait to 2.5 seconds DATA_17445ce8_END
- source: docs/research/DECISIONS.md
- status: locked
- decision: |
    DATA_811b4691_START
    Inside a HomeKit write handler, wait at most 2.5 seconds for the vendor API to accept or reject a command.
    
    If the deadline expires, return `HapStatusError(OPERATION_TIMED_OUT)`. Treat command delivery as uncertain and keep the pending state from D-037.
    
    Do not retry the command automatically. A timed-out request can still have reached the vendor and device.
    
    Cancel the local HTTP request when the transport supports cancellation. Cancellation does not prove that the vendor rejected or ignored the request.
    
    A newer reported-state event can resolve the uncertain command. Otherwise, the pending state expires 30 seconds after the original dispatch began.
    
    The 2.5-second deadline is not configurable. G-001 must measure command response latency and report whether this deadline works with real hardware.
    DATA_811b4691_END
- scope: DATA_ed3db298_START 6. Command behavior DATA_ed3db298_END
