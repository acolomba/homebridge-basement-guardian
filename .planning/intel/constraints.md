
## DATA_b29f069e_START Basement Guardian protocol reference DATA_b29f069e_END
- source: .planning/intel/constraints.md
- type: protocol
- content: |
    DATA_314b6847_START
    This document defines the cloud protocol that the Homebridge plugin uses.

    See the [ingested operational context](context.md) for runtime behavior. The HomeKit representation is preserved later in this [constraints record](constraints.md).

    ## 1. Protocol overview

    The integration uses three vendor services:

    - An Auth0 tenant authenticates a Basement Guardian account.
    - A REST API supplies device discovery, snapshots, commands, and temporary AWS credentials.
    - An AWS IoT device shadow supplies current state changes.

    The device does not provide a supported local API during normal operation. Thus, the plugin requires the cloud services.

    ## 2. Bundled protocol constants

    The plugin data file contains these public protocol constants:

    | Constant | Purpose |
    | --- | --- |
    | `apiUrl` | Vendor REST API base URL. |
    | `clientId` | Public Auth0 client ID. |
    | `auth0Domain` | Vendor Auth0 tenant. |
    | `auth0Realm` | Auth0 password realm. |
    | `awsRegion` | AWS IoT region. |
    | `protocol` | AWS IoT WebSocket protocol. |

    The public documentation uses placeholders for concrete values. The plugin configuration exposes only the optional `clientId` override.

    The AWS IoT client ID is different. `GET /credentials/aws` supplies it dynamically for each connection.

    ## 3. Authentication

    The vendor Auth0 tenant supports the password-realm grant for the public client ID.

    ```http
    POST https://<vendor-auth0-domain>/oauth/token
    Content-Type: application/json

    {
      "grant_type": "http://auth0.com/oauth/grant-type/password-realm",
      "realm": "<vendor-realm>",
      "client_id": "<bundled-public-client-id>",
      "username": "<account-email>",
      "password": "<account-password>",
      "scope": "openid profile email"
    }
    ```

    The REST API expects the `id_token` in the `Authorization` header:

    ```http
    Authorization: Bearer <id-token>
    ```

    The observed ID-token lifetime is 30 days. The plugin must authenticate again before the cached token expires.

    An unauthenticated request returns HTTP 403 with a token-missing error.

    ## 4. REST API

    The plugin uses these routes:

    | Method | Path | Purpose | Response envelope |
    | --- | --- | --- | --- |
    | `GET` | `/devices` | Discover devices and get snapshots. | `{ "devices": [ <device>, ... ] }` |
    | `GET` | `/devices/{deviceId}` | Get one device and its shadow snapshot. | `{ "device": <device> }` |
    | `PUT` | `/devices/{deviceId}/data` | Send a family-specific device command. | `Not measured.` |
    | `GET` | `/credentials/aws` | Get the AWS IoT endpoint, client ID, and temporary credentials. | `{ endpoint, clientId, credentials }` |

    A measurement against the live vendor API on 2026-08-29 confirmed these envelopes. One `wayneWaterGemini` device was available. The measurement also confirmed the `/credentials/aws` body that section 5 gives.

    The list route wraps its result in the plural key `devices`. The single-device route wraps its result in the singular key `device`. The two routes use different keys on purpose. Neither route answers a bare array or a bare device record.

    The vendor service also defines account, device-management, firmware, location, rule, and contact routes. V1 does not use those routes.

    ### Gemini commands

    The Gemini self-test command is:

    ```http
    PUT /devices/{deviceId}/data
    Content-Type: application/json

    { "desiredData": { "test_running": true } }
    ```

    The Gemini alarm-mute command is:

    ```http
    PUT /devices/{deviceId}/data
    Content-Type: application/json

    { "desiredData": { "alarm_audio_muted": true } }
    ```

    A successful command returns HTTP 200 with `{ "success": true }`.

    This success body is unverified. The measurement of 2026-08-29 sent no command, because a command operates a real sump pump.

    The official Gemini client permits a self-test while equipment faults are present. It disables the command only when the device is offline.

    The official client disables alarm mute when the device is offline or already muted. It exposes no duration selector and no unmute command.

    The HALO self-test uses `{ "desiredData": { "pump_state": "test" } }`. Gemini does not define `pump_state`.

    Do not send `pump_state: "on"` or `pump_state: "off"`. V1 does not expose direct pump control.

    ## 5. AWS IoT device shadow

    `GET /credentials/aws` returns an endpoint, a temporary AWS IoT client ID, and temporary STS credentials:

    ```json
    {
      "endpoint": "<aws-iot-endpoint>",
      "clientId": "<temporary-aws-iot-client-id>",
      "credentials": {
        "AccessKeyId": "<temporary-access-key-id>",
        "SecretAccessKey": "<temporary-secret-access-key>",
        "SessionToken": "<temporary-session-token>",
        "Expiration": "<iso-8601-timestamp>"
      }
    }
    ```

    The credentials expire after approximately one hour. The client ID changes with each credential response.

    The connection uses this configuration:

    ```ts
    new awsIot.thingShadow({
      region: vendorDefaults.awsRegion,
      protocol: vendorDefaults.protocol,
      host: response.endpoint,
      clientId: response.clientId,
      maximumReconnectTimeMs: 8000,
      accessKeyId: response.credentials.AccessKeyId,
      secretKey: response.credentials.SecretAccessKey,
      sessionToken: response.credentials.SessionToken,
    })
    ```

    The AWS IoT thing name equals the vendor `deviceId`:

    ```ts
    shadow.register(deviceId, { persistentSubscribe: true }, () => shadow.get(deviceId));
    shadow.on('foreignStateChange', (_thing, operation, state) => {
      // operation === 'update'
      // state.state.reported.data contains telemetry.
    });
    ```

    The reported shadow has two sections:

    - `reported.data` contains device telemetry.
    - `reported.state` contains device metadata.

    The shadow can include `mcu_target_version` and `wifi_firmware_version` when the REST snapshot omits them.

    The measurement of 2026-08-29 contradicts this sentence on the tested device. The embedded `shadow.state` object omitted both fields too. This claim is unconfirmed. It can still be true on other firmware versions.

    ## 6. Device models

    ### Gemini identity

    Gemini is the dual-pump system with battery backup.

    ```text
    accountId                 <account-id>
    deviceId                  <account-id>_<serial-number>
    deviceTypeId              wayneWaterGemini
    location                  <object>
    name                      <user-selected-name>
    homeId                    null
    roomId                    null
    state                     <object>
    data                      <object>
    timestamp                 <unix-milliseconds>
    shadow                    <object>
    attributes                <object>
    connectivity              { connected: <boolean>, timestamp: <unix-milliseconds> }
    attributes.serialNumber   <serial-number>
    attributes.productLine    wayneWater
    ```

    The measurement of 2026-08-29 read one `wayneWaterGemini` device. The device record returned the 13 top-level keys in the order that the block gives.

    The `deviceId` value is the `accountId` value, then an underscore, then the `attributes.serialNumber` value. Both segments matched byte for byte.

    The `accountId` value is 24 lowercase hexadecimal characters. The `attributes.serialNumber` value was 15 characters on the tested device. The `homeId` and `roomId` values were null on the tested device.

    The `state`, `data`, `shadow`, and `attributes` values are nested objects. The `timestamp` value is a number. The `serialNumber` and `productLine` fields are inside the `attributes` object and are not top-level fields.

    The plugin uses `deviceId` as the stable physical-accessory identifier. The decision of 2026-08-29 records that the vendor `deviceId` is not sensitive. The `<account-id>` segment is an opaque 24-character lowercase hexadecimal key. The segment is not an email address.

    Thus, the plugin can store `deviceId` in accessory context and write it to runtime logs.

    D-027 still governs public artifacts. Committed fixtures, samples, issue reports, and published documents must replace `deviceId` with a placeholder.

    ### Gemini metadata

    These fields are in the `state` object of the device record.

    | Field | Type | Observed on 2026-08-29 |
    | --- | --- | --- |
    | `wifi_signal_dbm` | Number. | Yes |
    | `mcu_firmware_version` | String. | Yes |
    | `wifi_firmware_version` | String. | Not observed |
    | `mcu_target_version` | String. | Not observed |

    The measurement did not find `wifi_firmware_version` or `mcu_target_version` in the REST `state` object. It also did not find them in the embedded `shadow.state` object.

    The measurement covered one device with one firmware version. The absence of these fields on that device does not prove that the fields never appear.

    ### Gemini telemetry

    | Field | Type or domain |
    | --- | --- |
    | `water_level` | Discrete level code. |
    | `primary_pump_running` | Boolean. |
    | `primary_pump_fault` | Boolean. |
    | `backup_pump_running` | Boolean. |
    | `backup_pump_fault` | Boolean. |
    | `backup_pump_fuse_blown` | Boolean. |
    | `backup_pump_timestamp` | Unix seconds. |
    | `ac_power` | Boolean. `true` means that mains power is present. |
    | `battery_charging` | Boolean. |
    | `battery_voltage_low` | Boolean. |
    | `battery_health` | Enum. |
    | `hours_of_protection` | Enum. |
    | `water_sensor_fault` | Boolean. |
    | `serial_communications` | Boolean. `true` means that the controller link is healthy. |
    | `alarm_audio_muted` | Boolean. |
    | `test_running` | Boolean. |
    | `test_timestamp` | Unix seconds. |
    | `offline` | Boolean. |

    The known enum values are:

    ```text
    battery_health       Replace=1  Poor=2  Okay=4  Good=8  NA=16  NotDetected=32
    hours_of_protection  LessThan1=1  Between1And2=2  Between2And4=4  MoreThan4=8
    water_level          Low=1  MidLow=3  Mid=7  MidHigh=15  High=31
    ```

    ### Water-level validation gate

    Only `water_level = 1` has hardware-validation evidence. No other Gemini level has hardware-validation evidence.

    The values `1`, `3`, `7`, `15`, and `31` form a thermometer-code sequence. This pattern suggests five level sensors that fill from the bottom.

    Use an explicit lookup instead of a population count:

    ```ts
    const LEVELS = new Map([
      [0, 0],
      [1, 1],
      [3, 2],
      [7, 3],
      [15, 4],
      [31, 5],
    ]);
    ```

    The value `0` is also unvalidated. Unknown values must create a fault and must not create a guessed level.

    A natural water-level cycle must validate the progression and flood threshold before release.

    ### HALO

    HALO uses a different data model:

    - `pump_state` with `on`, `off`, and `test` values.
    - `pump_cycles` and `pump_on_time` activity values.
    - `halo` power-signature health data.
    - `alerts.crit` and `alerts.warn` fault arrays.
    - `siren_active` and `siren_mute` alarm fields.
    - `systest_period` test configuration.
    - A numeric `water_level` from 0 through 5.

    The HALO model does not have hardware-validation evidence. V1 must identify HALO and report that its family adapter is not implemented.

    ## 7. Gemini email-rule catalog

    The vendor account service can define these Gemini email rules:

    | Code | Attribute | Test | Delay |
    | --- | --- | --- | --- |
    | `WW-GEM-ALERT-1` | `battery_health` | `== 1` (Replace) | 240 min |
    | `WW-GEM-ALERT-2` | `battery_health` | `== 2` (Poor) | 1440 min |
    | `WW-GEM-ALERT-3` | `battery_health` | `== 32` (NotDetected) | 240 min |
    | `WW-GEM-ALERT-4` | `hours_of_protection` | `== 1` (less than 1 hour) | 60 min |
    | `WW-GEM-ALERT-5` | `hours_of_protection` | `== 2` (1–2 hours) | 60 min |
    | `WW-GEM-ALERT-6` | `backup_pump_fuse_blown` | `== true` | 240 min |
    | `WW-GEM-ALERT-7` | `water_level` | `> 15` (High) | 0 min |
    | `WW-GEM-ALERT-8` | `water_sensor_fault` | `== true` | 60 min |
    | `WW-GEM-ALERT-9` | `backup_pump_running` | `== true` | 60 min |
    | `WW-GEM-ALERT-10` | `backup_pump_fault` | `== true` | 60 min |
    | `WW-GEM-ALERT-11` | `battery_voltage_low` | `== true` | 0 min |
    | `WW-GEM-ALERT-12` | `primary_pump_fault` | `== true` | 240 min |
    | `WW-GEM-ALERT-13` | `ac_power` | `== false` | 0 min |
    | `WW-GEM-ALERT-14` | `offline` | `== true` | 480 min |

    These delays apply to the configurable email-rule path. They do not define mobile push timing or HomeKit state timing.

    HomeKit must represent each current condition immediately. Locked decision D-010 defines the special backup-pump notification behavior.

    ## 8. Fault inventory

    Gemini supplies these fault-bearing values:

    | Signal | Type | Vendor email rule |
    | --- | --- | --- |
    | `primary_pump_fault` | Boolean. | `WW-GEM-ALERT-12` |
    | `backup_pump_fault` | Boolean. | `WW-GEM-ALERT-10` |
    | `backup_pump_fuse_blown` | Boolean. | `WW-GEM-ALERT-6` |
    | `water_sensor_fault` | Boolean. | `WW-GEM-ALERT-8` |
    | `battery_health == 32` | Enum. | `WW-GEM-ALERT-3` |
    | `serial_communications` | Inverted Boolean. | None. |

    The hardware has two water-sensing mechanisms. The API combines them in the `water_sensor_fault` value.

    The API does not identify the failed sensor. It also does not report whether the remaining sensor still protects the pit.

    `serial_communications === false` means that the network module lost its connection to the pump controller.

    In this state, other pump values can be stale while cloud connectivity still reports success. The plugin must mark the affected state as untrustworthy.

    ### HALO fault vocabulary

    HALO supplies fault strings in `alerts.warn` and `alerts.crit`:

    | Item | Severity | Email delay |
    | --- | --- | --- |
    | `waterLevel` | Warning. | 60 min |
    | `loVoltage` | Warning. | 60 min |
    | `inflow` | Warning. | 0 min |
    | `obstruction` | Warning. | 0 min |
    | `runTime` | Warning. | 60 min |
    | `thermalTrip` | Warning. | 0 min |
    | `currentLeak` | Critical. | 10080 min |
    | `hiCurrentExceeded` | Critical. | 10080 min |
    | `rotorLocked` | Critical. | 10080 min |
    | `powerFactor` | Critical. | 10080 min |
    | `relayCycleLimit` | Critical. | 0 min |

    Do not implement these values until HALO hardware validation supplies representative payloads and state transitions.

    ## 9. Local access

    The device does not provide a supported local API during normal operation.

    A provisioning interface can exist while the device operates in setup mode. V1 must not depend on setup mode or undocumented local routes.

    Thus, the Homebridge plugin uses the vendor cloud for discovery, state, and commands.
    DATA_314b6847_END

## DATA_45c64f08_START Mapping a sump pump onto HomeKit DATA_45c64f08_END
- source: .planning/intel/constraints.md
- type: protocol
- content: |
    DATA_8f3e6a9e_START
    The authoritative protocol specification defines the protocol and data model. The [ingested implementation context](context.md) preserves the companion guidance for cadence, latency, liveness, and plugin construction.

    HomeKit has no standard pump service or generic numeric-level tile. The design uses standard services and characteristics where they are truthful. It uses vendor-defined services for the remaining device facts.

    Source of truth for services/characteristics: HAP-NodeJS `ServiceDefinitions.ts` and `CharacteristicDefinitions.ts` (V=888).

    ## 1. Constraints that drive the whole design

    These are the findings that eliminate the obvious approaches.

    **Apple Home ignores `StatusFault`.** It is defined on nearly every sensor service and is simply not rendered by the Home app; only Eve and similar third-party controllers show it. *Consequence: a fault that only sets `StatusFault` is invisible to you. Anything you actually want to be told about needs its own service with its own tile.*

    **`Valve.Active` is read/write** (`PAIRED_READ, PAIRED_WRITE, NOTIFY`). The Valve service is the semantically perfect fit for a pump -- it even has a read-only `InUse` companion -- but because `Active` is writable, Home renders it as a control the user can tap. For a pump we can only observe, that's a button that lies. *Valve is out.*

    **Home has no generic numeric display.** The only characteristics it will show as a number/label on a tile are temperature (°C), relative humidity (%), ambient light (lux), air quality (a 0-5 enum), and the gas-density ones. A 0-100 "level" has to borrow one of these or not be visible at all.

    **`Battery` is not a tile.** It attaches to an accessory and surfaces as the battery indicator in accessory details and the Home battery list -- correct, but not glanceable.

    **A room containing only sensors does not appear in Home View.** From the `homebridge-qolsys` README: such a room is still selectable from the room list, but it does not render in the main view, and the Security summary shows only *currently triggered* sensors -- untriggered ones appear nowhere. **The Self-Test `Switch` is what makes the room visible at all.** Keep it even if you never press it. *Consequence: do not put these accessories in a room by themselves unless that room also holds something controllable.*

    **"No Response" is a trap, not a tool.** Homebridge's own guidance is that once the Home app shows "No Response" it stops checking for characteristic updates until the app is closed and reopened -- so a device that is merely quiet must never be marked unreachable. Reserve it for permanent, user-actionable failures such as rejected credentials. See the [ingested plugin guidance](context.md), section 7.

    **Apple Activity History is controller-owned.** Apple documents up to 30 days for eligible accessories, including contact sensors. It requires a supported home hub and the current Home architecture. The plugin cannot set retention or backfill missed events. Validate bridged sensors on a real Apple home before release. See Apple's [Activity History requirements](https://support.apple.com/en-gb/105011).

    ## 2. Recommended mapping

    Publish one accessory for each physical Basement Guardian system. Add these stable services to that accessory.

    | Name | Service | Characteristic or source |
    | --- | --- | --- |
    | **Sump Pit Flood** | Standard `LeakSensor` | `LeakDetected` from the highest validated `water_level` state |
    | **Sump Pit Level** | Custom Sump Pit service | Standard `WaterLevel` from a validated legal-value lookup |
    | **Primary Pump** | Custom read-only Pump service and standard `ContactSensor` | Live state from `primary_pump_running`; local observed count and timestamp |
    | **Backup Pump** | Custom read-only Pump service | Live state from `backup_pump_running`; local observed count and timestamp |
    | **Backup Pump Activated** | Standard `ContactSensor` | Live state from `backup_pump_running` |
    | **Sump Mains Power** | Custom read-only Power service | Exact state from `ac_power` |
    | **Mains Power Lost** | Standard `ContactSensor` | Active when `ac_power === false` |
    | **Equipment faults** | Five standard `ContactSensor` adapters | Primary Pump Fault, Backup Pump Fault, Water Sensor Fault, Pump Controller Link Lost, and Basement Guardian Offline |
    | **Backup Battery** | Custom Battery service and standard `BatteryService` | Exact vendor facts plus documented estimated charge bands |
    | **System Self-Test** | Standard `Switch` | Command and reported state from `test_running` |
    | **Alarm Mute** | Standard `Switch` | Command and reported state from `alarm_audio_muted` |

    Value conventions:

    ```
    LeakDetected        0 = LEAK_NOT_DETECTED   1 = LEAK_DETECTED
    ContactSensorState  0 = CONTACT_DETECTED    1 = CONTACT_NOT_DETECTED
    StatusLowBattery    0 = NORMAL              1 = LOW
    ChargingState       0 = NOT_CHARGING  1 = CHARGING  2 = NOT_CHARGEABLE
    ```

    For every "is something wrong" sensor, use **`CONTACT_NOT_DETECTED` (1) as the alarm state**, so the Home tile reads "Open" when there is a problem and "Closed" when all is well. It is the same convention a door sensor uses and it keeps automations readable.

    `hours_of_protection` → `BatteryLevel`: `1→25, 2→50, 4→75, 8→100`.

    ### Optional notification adapters

    The plugin publishes the explicit Contact Sensor adapters by default. Users can remove selected adapters with the global `ignoredFaults` configuration array.

    The supported slugs are `backup-pump-activated`, `mains-power-lost`, `primary-pump-fault`, `backup-pump-fault`, `water-sensor-fault`, `pump-controller-link-lost`, and `basement-guardian-offline`.

    This configuration removes only the related Contact Sensor. It does not remove the condition, diagnostic state, local counters, timestamps, or truthful service.

    Removing an adapter can remove its Apple Activity History view. Apple builds that view from the published HomeKit service.

    The plugin does not delay an adapter transition. HomeKit state, automations, Activity History, and notification eligibility use the same transition time.

    The **Sump Pit Flood** Leak Sensor and the standard Battery service are not optional fault adapters.

    Do not add a `FilterMaintenance` service for battery replacement. Filter characteristics have the wrong meaning. Use the standard and custom Battery services only.

    ## 3. The four hard ones

    ### 3.1 Water level

    The vendor field defines several discrete water states. Only `water_level = 1` has hardware-validation evidence.

    Use a custom Sump Pit service with the standard `WaterLevel` characteristic. This keeps the meaning correct for third-party clients. Do not mislabel the value as humidity or air quality.

    Use an explicit lookup for legal raw values. Unknown values mark the Sump Pit service as faulty. They never produce a guessed percentage.

    The standard **Sump Pit Flood** Leak Sensor becomes active only at the validated highest level. Do not expose a separate rising-water alert. Lower water movement is status, not a notification.

    ### 3.2 Pump running

    Both pumps are read-only booleans that are true for 7-15 seconds at a time.

    - `Switch` -- renders a toggle that does nothing. Rejected.
    - `Valve` -- semantically ideal, but `Active` is writable. Rejected (§1).
    - `MotionSensor` -- works, but Home files motion into security-flavoured UI and "Motion Detected" reads oddly for a pump.
    - `OccupancySensor` -- neutral "Detected / Not Detected", fine.
    - A custom read-only Pump service is truthful and can expose standard status characteristics plus vendor-defined activity statistics.
    - A standard `ContactSensor` provides a live activity adapter without a false control.

    Name the primary activity adapter **Primary Pump Running**. It is informational and does not become a plugin-defined safety alert.

    The **Backup Pump Activated** adapter also serves as the backup activity adapter. It is notable, but it does not establish mains loss or primary-pump failure.

    Persist an observation start time, observed activation count, and last-observed timestamp for each pump. Show them as read-only custom Pump characteristics.

    These statistics can be incomplete after an outage. They are not device lifetime totals. The plugin provides no HomeKit reset control.

    ### 3.3 Faults

    Set `StatusFault` and `StatusActive` on the service that owns each condition. Third-party HomeKit clients can show these standard details.

    Apple Home does not present enough detail there. Publish five standard Contact Sensor adapters: **Primary Pump Fault**, **Backup Pump Fault**, **Water Sensor Fault**, **Pump Controller Link Lost**, and **Basement Guardian Offline**.

    The Backup Pump Fault adapter includes a blown or missing fuse. Keep exact raw causes on the custom services. Do not publish one aggregate System Fault contact.

    `serial_communications === false` deserves care: it means the Wi-Fi module has lost its link to the pump controller, so every other value is stale even though the device still looks "online" -- `offline` stays `false` and `connectivity.connected` stays `true`. It is also the **only** fault the vendor has no alert rule for, so nothing else will tell you. Treat it as a fault *and* stop trusting the rest of the payload.

    **`water_sensor_fault` covers two physical sensors.** The hardware has a Solid State Air Switch plus a redundant reed float switch, and the API reports a single boolean for both. You cannot tell whether one failed (degraded, still protected) or both did (pit unmonitored). Treat it as urgent -- the conservative reading is the safe one, and the vendor's own 60-minute email delay is not adequate for the bad case.

    ### 3.4 Backup pump activation

    A backup-pump run is important, but it does not establish that mains power was lost or that the primary pump failed. During normal operation it shows that water reached the backup-pump activation threshold or that inflow exceeded the primary pump's current capacity. Report the event without inventing a cause; power and primary-pump health have their own signals.

    The truthful Backup Pump service and **Backup Pump Activated** adapter track `backup_pump_running` live. They become active when the pump starts and return to normal when it stops. Every observed activation, including a self-test activation, updates the local observed count and timestamp.

    #### Classifying a run as self-test activity

    The self-test runs the backup pump. That activation remains real activity and must not be suppressed.

    The device gives two timestamps that can classify a recovered activation. The timestamps update at different points in the test.

    ```
    phase                 backup timestamp   test timestamp   backup running   test running
    idle                  prior value        prior value      false            false
    backup pump active    prior value        prior value      true             true
    backup pump stops     new value          prior value      false            true
    test completes        new value          new value        false            false
    ```

    `backup_pump_timestamp` updates several seconds before `test_timestamp`. Wait until `test_running` is false and both values are stable before classifying a recovered activation.

    If the test timestamp catches up to the backup timestamp, classify the activation as test activity. If the backup timestamp remains newer, classify it as non-test activity.

    This classification can label local statistics. It must never delay or suppress a live **Backup Pump Activated** state change.

    **Compare the two device timestamps with each other, not with local time.** They come from the same device clock.

    Hardware measurements found an approximate three-second difference from the observing host. Do not build exact-second logic on that difference.

    #### Recovery after a missed activation

    If reconciliation finds a newer `backup_pump_timestamp` after the pump stopped, update one de-duplicated local activation record. The timestamp proves at least one activation. It does not prove the number of missed cycles or their duration.

    Do not pulse the live sensor or send a late notification. Either action would claim a current activation that no longer exists. Apple Activity History cannot be backfilled.

    Do not add an acknowledgement latch. The local observed count and last-activation timestamp preserve evidence without making the current sensor state false.

    ## 4. Behaviours the data forces

    **Do not treat `battery_charging === false` as a fault.** The self-test stops charging for about eight seconds. Report the charging state truthfully. Use battery health, low-voltage state, and protection duration for battery warnings.

    **Reachability is not silence.** The device heartbeats about every 898 seconds. MQTT silence alone does not prove that the device is offline.

    Poll REST about every 15 minutes by default. Activate **Basement Guardian Offline** after the configured number of successful disconnected snapshots.

    The `offlineConfirmationPollCount` field accepts integers from 1 through 8 and defaults to 2. A failed REST request does not count as a disconnected snapshot.

    If both monitoring paths become stale, preserve the last valid values and mark the narrowest affected scope as untrustworthy. Do not reset safety conditions to normal.

    **Heartbeats are partial payloads.** They carry only `battery_health`, `hours_of_protection`, `water_level`, `serial_communications`, `offline`, `mcu_target_version` and `wifi_signal_dbm`. Merge into cached state -- a plugin that replaces state wholesale will drop `primary_pump_running`, `ac_power`, `battery_charging` and `test_running` to `undefined` every 15 minutes.

    **The System Self-Test Switch reconciles with device state.** An on command requests a test and waits for vendor API acceptance.

    After acceptance, HAP can show the requested on state before `test_running === true` arrives. Reported state remains authoritative.

    The Switch turns off when `test_running` becomes false. The observed test duration is approximately 16 seconds.

    The device has no cancel command. The plugin rejects an off command during a test. The plugin also rejects duplicate on commands.

    A test from the vendor application or an automatic schedule updates the same Switch. Requested state never changes canonical device or safety state.

    ## 5. Release validation

    1. **Flood notifications.** Validate Leak Sensor notification behavior with the supported Apple Home architecture and a current home hub. Do not claim a Critical Alerts guarantee.
    2. **Muting the alarm.** Use a standard Alarm Mute Switch that follows `alarm_audio_muted`.

       An on command sends `alarm_audio_muted: true`. The Gemini API exposes no duration selector or unmute write.

       The plugin rejects an off command while mute is active. It does not simulate a duration or copy the different HALO `siren_mute` command.

       Hardware validation must confirm acknowledgement, reported-state timing, actual duration, and failure behavior.
    DATA_8f3e6a9e_END
