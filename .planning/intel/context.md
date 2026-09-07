
## DATA_15451641_START Basement Guardian operational behavior DATA_15451641_END
- source: .planning/intel/context.md
- content: |
    DATA_6a257902_START
    This document defines the runtime behavior that affects a long-running Homebridge integration.

    This document assumes the companion protocol contract and HomeKit representation.

    ## 1. Heartbeat cadence

    Gemini sends a state report approximately every 898 seconds when no other event occurs. A state report restarts the heartbeat timer.

    Hardware measurements found consecutive heartbeat intervals of 898 or 899 seconds. The measured mean was 898.3 seconds.

    The heartbeat is timer-based. It occurs even when the device state does not change.

    Short gaps after a new connection do not identify the heartbeat period. Measure only gaps between consecutive heartbeats.

    Approximately 15 minutes of shadow silence is normal. Do not use one missed heartbeat as evidence that the device is offline.

    ### Partial heartbeat payloads

    A heartbeat contains only these fields:

    - `battery_health`
    - `hours_of_protection`
    - `water_level`
    - `serial_communications`
    - `offline`
    - `mcu_target_version`
    - `wifi_signal_dbm`

    Merge each heartbeat into the cached snapshot. Do not replace the complete snapshot with a heartbeat payload.

    A replacement removes pump, power, charging, test, and fault values from the cache.

    ### Measured shadow message shapes

    The probe watched one Gemini account with one device for 90 minutes on 2026-09-03. The device stayed in steady state.

    The probe recorded seven messages: one `get/accepted` and six `update/accepted`. All seven carried a `reported.data` section. None omitted it.

    Each heartbeat carried both sections. `reported.data` held six keys and `reported.state` held `wifi_signal_dbm`. Every heartbeat payload measured 584 bytes. The probe recorded the count of the telemetry keys, not their names.

    The `get/accepted` document held 19 keys under `reported.data`. It held three metadata keys: `mcu_firmware_version`, `wifi_firmware_version` and `wifi_signal_dbm`.

    The seven-field heartbeat list above therefore splits across the two sections. Six fields arrive as telemetry. `wifi_signal_dbm` arrives as device metadata.

    Five consecutive heartbeat gaps measured 898.2, 898.7, 898.6, 898.6 and 897.9 seconds. The mean was 898.4 seconds. This confirms the 898.3-second figure above, from a second independent measurement.

    The probe did not observe a report that carried device metadata and no telemetry. The metadata section never travelled alone.

    These limits apply to the measurement:

    - Six heartbeats is a small sample.
    - The device stayed in steady state. No pump cycle, fault, power event, reconnect or firmware update occurred. Event-driven reports are therefore unmeasured.
    - The account held one device. Nothing about a multi-device account was observable.
    - The plugin subscribes to `get/accepted`, `get/rejected` and `update/accepted` only. A `shadow/update/delta` message cannot reach it, so the probe could not observe one.

    ## 2. AWS credential lifecycle

    `GET /credentials/aws` returns STS credentials with an approximate one-hour lifetime. It also returns a new AWS IoT client ID.

    Refresh the credentials ten minutes before `Expiration`. Schedule the next refresh from the new expiration value.

    `thingShadow.updateWebSocketCredentials()` can replace the SigV4 credentials on the existing connection.

    A 90-minute hardware test completed one in-place rotation without an unplanned disconnect. Heartbeat delivery continued through the rotation.

    Do not reconnect only because the credentials changed. Retry the refresh if the credential request fails.

    ## 3. Gemini system test

    A measured Gemini system test used this sequence:

    | Relative time | Event |
    | --- | --- |
    | 0 s | The desired state sets `test_running: true`. |
    | 0 s | The device acknowledges the desired value and removes it. |
    | About 1 s | The backup pump starts. `battery_charging` becomes false. |
    | About 9 s | The backup pump stops and the primary pump starts. |
    | About 16 s | The primary pump stops. `test_running` becomes false. |

    The test provides these runtime rules:

    - The shadow usually reports the command within about one second.
    - The backup pump runs first for approximately eight seconds.
    - The primary pump then runs for approximately seven seconds.
    - The battery supplies the backup pump during the test.
    - The device removes the desired value after acknowledgement.

    Read device state from `reported`. Treat `desired.*: null` as acknowledgement data, not as device state.

    Do not treat `battery_charging === false` as a fault while `test_running === true`.

    The test does not change the water level. A natural water-level cycle must validate the Gemini level progression.

    ## 4. Liveness and trust

    Use these signals in this order:

    | Signal | Source | Meaning |
    | --- | --- | --- |
    | `connectivity.connected` | REST device snapshot. | The network module reports its cloud connection state. |
    | `data.offline` | REST or shadow data. | The vendor platform reports that the device is offline. |
    | `serial_communications` | Shadow data. | The network module reports its link to the pump controller. |
    | Shadow silence | Local observation. | This is useful only after the permitted heartbeat window. |

    Do not infer an offline device from shadow silence alone. The plugin uses REST snapshots as the liveness backstop.

    `serial_communications === false` means that the network module lost its pump-controller link.

    In that state, `offline` and `connectivity.connected` can still report normal values. Other pump values can be stale.

    The plugin must report the controller-link fault and mark the affected state as untrustworthy.

    ## 5. Measured latency

    | Path | Measured behavior |
    | --- | --- |
    | Device command to shadow delta | Approximately 1 second. |
    | Physical state change to reported shadow | Approximately 1 second. |
    | State change to REST snapshot | Within one 2-second observation poll. |
    | Device timestamp difference | Approximately 3 seconds from the observing host. |

    Compare device timestamps with other device timestamps. Do not require exact agreement with the Homebridge host clock.

    ## 6. Runtime requirements

    The plugin runtime must do these actions:

    1. Authenticate with the account email and password.
    2. Cache the ID token under the Homebridge storage path.
    3. Discover devices with `GET /devices` during startup.
    4. Select the family adapter from `deviceTypeId`.
    5. Get temporary AWS credentials with `GET /credentials/aws`.
    6. Register each `deviceId` with the AWS IoT shadow client.
    7. Merge reported patches into the canonical snapshot.
    8. Refresh temporary credentials before expiration.
    9. Poll the REST snapshot approximately every 15 minutes by default.
    10. Report `serial_communications === false` as a controller-link fault.

    The runtime must continue to report **Backup Pump Activated** during a self-test. The activation is real pump activity.

    A failed REST request is not evidence that the device reported itself offline. The monitoring-path policy handles that condition separately.
    DATA_6a257902_END

## DATA_e57ed2f1_START Architectural lessons from popular Homebridge plugins DATA_e57ed2f1_END
- source: .planning/intel/context.md
- content: |
    DATA_93d27dae_START
    This document compares `homebridge-nest` and `homebridge-unifi-protect`. It applies their architectural lessons to Basement Guardian.

    The name `homebridge-protect` in this analysis refers to the `homebridge-unifi-protect` package and repository.

    This document is design guidance. Separate specifications define the protocol details and HomeKit representation.

    ## Source snapshots

    The review uses fixed commits. This makes each source observation reproducible after either project changes.

    | Project                    | Reviewed revision                                                                                                                              | Source shape                                                                                 |
    | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
    | `homebridge-nest`          | [`70b224b`](https://github.com/chrisjshull/homebridge-nest/tree/70b224b720f165ee05513342226081d1f31c4a43), dated 2025-12-30                    | 9 runtime JavaScript files and 3,291 lines. No automated tests were present.                 |
    | `homebridge-unifi-protect` | [`c8bce2c`](https://github.com/hjdhjd/homebridge-unifi-protect/tree/c8bce2c31df1f84331d015acc2dfa4f4e61b3b32), version 8.1.0, dated 2026-07-19 | 47 production TypeScript files and 21,341 lines. Its 58 test files contain 785 test entries. |
    | Basement Guardian research | This repository, dated 2026-08-27                                                                                                              | A measured cloud protocol, a proposed HomeKit mapping, and the Homebridge template scaffold. |

    The line counts describe scale only. They do not measure quality.

    ## Executive decision

    Basement Guardian needs a design between the two reference projects.

    - Use the small device-adapter model from Nest.
    - Use the state ownership, lifecycle, reconciliation, and test patterns from Protect.
    - Keep the cloud protocol behind typed local interfaces.
    - Keep one canonical merged snapshot for each physical device.
    - Keep the Homebridge platform as a composition root, not a protocol client.
    - Add complexity only when a measured requirement needs it.

    The first release does not need Protect's media stack, feature-option language, diagnostics catalog, or controller health model.

    ## Architecture comparison

    | Concern           | `homebridge-nest`                                                                                                | `homebridge-unifi-protect`                                                                                                 | Lesson for Basement Guardian                                                                              |
    | ----------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
    | Entry point       | One file registers the platform and injects HAP types into module globals.                                       | A small entry point registers a typed platform.                                                                            | Keep `index.ts` limited to registration.                                                                  |
    | Composition       | The platform creates one connection and several accessory classes.                                               | The platform creates controller roots. Each controller creates device classes from a typed descriptor table.               | Let `platform.ts` assemble objects. Keep construction out of device classes.                              |
    | Protocol boundary | One 1,945-line connection file owns authentication, REST, HTTP/2, Protobuf, retries, normalization, and writes.  | The `unifi-protect` dependency owns protocol state. The plugin consumes typed clients, selectors, events, and projections. | Keep authentication, REST, and shadow transport in separate modules behind one account-runtime interface. |
    | State ownership   | Accessories hold mutable device snapshots. The connection replaces these snapshots after each normalized update. | The protocol library owns a reduced state store. Device classes hold live projections into that store.                     | Store device state once. Accessories must read derived domain state, not raw cloud payloads.              |
    | Realtime updates  | REST subscription and Protobuf observation both call one platform update callback.                               | Narrow selectors handle state changes. A typed event stream handles activity occurrences.                                  | Separate persistent state from transient events.                                                          |
    | Writes            | The connection batches writes and overlays optimistic values for eight seconds.                                  | Device commands wait for controller acceptance. Controller events reconcile state later.                                   | Finish a HomeKit write after API acceptance. Reconcile reported device state asynchronously.              |
    | Accessory cache   | The platform restores cached accessories, then unregisters and recreates all accessories after discovery.        | The platform reuses stable accessories. It adds and removes only changed devices.                                          | Rebind cached accessories. Never replace a healthy accessory during normal startup.                       |
    | Device removal    | A successful discovery removes every restored accessory before registration.                                     | Removal needs a stable controller, an optional delay, and a final live-state test.                                         | Require healthy discovery and confirmed absence before removal.                                           |
    | Resource lifetime | Long-running loops and timers have no platform shutdown owner.                                                   | A root abort signal stops loops. Child signals stop device work. Clients implement explicit disposal.                      | Give every timer, subscription, and socket one owner and one stop path.                                   |
    | Configuration     | A static schema accepts authentication fields and a string list of feature options.                              | A typed option catalog feeds runtime decisions, documentation, and a custom web interface.                                 | Start with explicit typed fields. Add a catalog only after options become numerous or device-specific.    |
    | Tests             | The reviewed source has no automated tests.                                                                      | Tests sit beside production modules. Pure policy modules receive extensive table-driven coverage.                          | Put safety rules in pure functions and test them before transport integration.                            |
    | Complexity        | Small, direct, and easy to trace. The connection module contains too many responsibilities.                      | Strong boundaries support a large feature set. The resulting infrastructure is too large for this plugin's first release.  | Copy the boundaries, not the size.                                                                        |

    ## Lessons from `homebridge-nest`

    ### Nest patterns to adopt

    Nest normalizes two different cloud protocols into one device tree. The accessory classes do not know which protocol supplied a field.

    That normalization is an anti-corruption layer. Basement Guardian needs the same boundary between REST, AWS IoT shadows, and domain state.

    Nest also uses one base accessory for common HomeKit behavior. Each device family supplies its services and field conversions.

    This model fits Gemini and HALO. A family adapter can validate and decode fields before an accessory sees them.

    Nest batches related writes and preserves recent local intent during cloud lag. This prevents an old cloud response from reversing a new thermostat setting.

    Do not copy its pre-dispatch success behavior. Wait for vendor API acceptance, then let reported device state reconcile the writable Switch.

    ### Costs to prevent

    The connection module contains authentication, transport, state reduction, retry logic, serialization, and command policy. A change in one area risks every area.

    The platform injects Homebridge types through module globals. This hides dependencies and makes isolated tests difficult.

    The startup path unregisters all cached accessories before it registers replacements. This pattern risks HomeKit room and automation continuity.

    The reviewed source has no shutdown handler. Long-running timers and HTTP/2 work have no platform-level stop signal.

    The reviewed source also has no automated tests. Its most complex module contains retry, merge, and protocol translation logic.

    ## Lessons from `homebridge-unifi-protect`

    ### Protect patterns to adopt

    Protect uses clear composition layers. The entry point registers the platform, the platform creates controller roots, and each root creates device owners.

    The external `unifi-protect` library owns protocol truth. The plugin does not duplicate controller state inside each accessory.

    Each device holds a live projection into the canonical store. Narrow selectors wake only when the data for one reaction changes.

    Protect separates state transitions from activity occurrences. Device observers handle state, while one typed event router handles doorbells, detections, and buttons.

    Its accessory lifecycle uses stable identifiers and cached context. A typed descriptor table maps each protocol category to its device class.

    Removal is deliberately conservative. The controller must remain healthy before a missing device becomes eligible for removal.

    The removal path also waits for a grace period when configured. It tests live membership again before the destructive action.

    Protect gives resource lifetime a hierarchy. Platform shutdown stops controller work, and device cleanup stops only that device's work.

    Pure policy modules hold decisions for retries, removal, reachability, motion, and media. Colocated tests exercise these decisions without live hardware.

    The feature catalog is a single source for defaults, capability gates, generated documentation, and the custom web interface.

    ### Complexity to defer

    Protect supports many device classes, video pipelines, MQTT, multiple controllers, and detailed recovery behavior. Basement Guardian has a much smaller scope.

    The first release does not need a general feature-option language. Explicit configuration fields are easier to understand and validate.

    The first release also does not need a diagnostics event catalog. Scoped logs and injectable clocks provide enough visibility for the initial runtime.

    A separate protocol package is not necessary at first. A strict `src/cloud/` boundary gives the same test seam inside this repository.

    ## Target architecture

    The target uses one account runtime and one canonical state store. Each discovered physical system gets one HomeKit accessory with multiple services.

    ```mermaid
    flowchart TD
      HB[Homebridge lifecycle and accessory cache] --> Platform[BasementGuardianPlatform]
      Platform --> Runtime[AccountRuntime]
      Runtime --> Auth[AuthClient]
      Runtime --> Api[CloudApi]
      Runtime --> Shadow[ShadowClient]
      Api --> Registry[DeviceRegistry]
      Api --> Store[DeviceStateStore]
      Shadow --> Store
      Store --> Family[DeviceFamily adapter and policies]
      Family --> Controller[DeviceController]
      Registry --> Controller
      Controller --> Accessory[BasementGuardianAccessory]
      Accessory --> Commands[CommandService]
      Commands --> Api
      Accessory --> Context[Typed accessory context]
    ```

    ### Component responsibilities

    | Component                   | Responsibility                                                                                                    | Must not own                                                   |
    | --------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
    | `BasementGuardianPlatform`  | Homebridge lifecycle, cached accessories, object construction, and device reconciliation.                         | Authentication details, shadow merge rules, or field decoding. |
    | `AccountRuntime`            | Start and stop authentication, REST discovery, polling, shadow connectivity, credential rotation, and retry work. | HomeKit services or characteristic values.                     |
    | `AuthClient`                | Obtain and cache the Auth0 `id_token`.                                                                            | Device discovery or Homebridge persistence.                    |
    | `CloudApi`                  | Call typed REST endpoints and send family-specific commands.                                                      | Retry loops, HomeKit state, or shadow subscriptions.           |
    | `ShadowClient`              | Connect to AWS IoT, rotate credentials, register device shadows, and emit reported patches.                       | Domain decoding or HomeKit updates.                            |
    | `DeviceStateStore`          | Merge REST snapshots and partial shadow patches into one immutable snapshot per device.                           | Network calls or HomeKit objects.                              |
    | `DeviceFamily`              | Validate a device family, decode its fields, derive domain state, and create command payloads.                    | Sockets, timers, or platform accessory registration.           |
    | `DeviceRegistry`            | Compare successful inventories with cached accessories. Add new devices and confirm removals.                     | Cloud authentication or characteristic handlers.               |
    | `DeviceController`          | Connect one state-store entry to one accessory. Derive events from state transitions.                             | Account-wide connection management.                            |
    | `BasementGuardianAccessory` | Create stable services, answer `onGet` from cached domain state, send commands, and push characteristic updates.  | Raw REST payloads, raw shadow documents, or retry policy.      |
    | Typed accessory context     | Persist stable identity, pump observation records, and event de-duplication watermarks.                           | Credentials, full telemetry snapshots, detailed timelines, or timers. |

    ### Proposed source layout

    ```text
    src/
      index.ts
      settings.ts
      config.ts
      platform.ts
      runtime/
        accountRuntime.ts
        retryPolicy.ts
      cloud/
        auth.ts
        api.ts
        shadow.ts
        types.ts
      device/
        state.ts
        events.ts
        health.ts
        family.ts
        gemini.ts
        halo.ts
      accessories/
        basementGuardian.ts
        services.ts
      persistence/
        accessoryContext.ts
    ```

    Tests can sit beside pure policy modules or under `tests/`. The build must exclude test helpers from the published package.

    ## State model

    The state store is the most important boundary in this plugin. It prevents cloud behavior from leaking into every HomeKit handler.

    The store applies these rules:

    1. A successful REST discovery initializes identity, connectivity, and reported device data.
    2. A shadow `reported` payload merges into the current data object.
    3. A partial heartbeat never removes fields that it does not contain.
    4. A shadow `desired` value never becomes reported device state.
    5. A `desired` value of `null` is an acknowledgement, not a sensor value.
    6. Local receipt time stays separate from device timestamps.
    7. Family validation runs after each merge.
    8. Subscribers receive a new snapshot only when relevant values change.

    The store can expose a small contract:

    ```ts
    interface DeviceStateStore {
      snapshot(deviceId: string): DeviceSnapshot | undefined;
      applyDiscovery(device: ApiDevice): DeviceSnapshot;
      applyReportedPatch(deviceId: string, patch: ReportedPatch): DeviceSnapshot;
      subscribe(deviceId: string, listener: (next: DeviceSnapshot, previous?: DeviceSnapshot) => void): () => void;
    }
    ```

    This contract gives tests direct control over every state transition. It also keeps the AWS SDK out of accessory tests.

    ## State and event separation

    Basement Guardian receives state, not a typed activity stream. The plugin must derive occurrences from consecutive canonical snapshots.

    Examples include these transitions:

    - `primary_pump_running: false -> true` creates a primary-pump start event.
    - `backup_pump_running: false -> true` creates a backup-pump start event.
    - `test_running: false -> true` creates a self-test start event.
    - A new `backup_pump_timestamp` can recover one de-duplicated local activation record after missed live transitions.

    The current snapshot answers HomeKit reads. Derived events update observed counters, timestamps, live notifications, and short-lived service state. HomeKit sensor state is never latched after its source condition recovers.

    This split prevents duplicate activation records after identical heartbeats.

    The plugin does not delay HomeKit alert transitions. Each derived condition change causes an immediate standard-service change. Offline confirmation is part of condition derivation.

    The plugin does not store a detailed pump timeline in V1. It does not implement `fakegato-history` or Eve's private history protocol.

    Standard Contact Sensor transitions can appear in Apple Activity History on supported homes. Apple owns that history and its retention. The plugin cannot backfill missed transitions. Release validation must confirm the bridged pump sensors with a real Apple home hub.

    Each pump has one persistent observation record. This record contains the observation start time, observed activation count, and last-observed-activation time.

    Set the observation start time when the plugin accepts the first valid state for that pump. Use UTC ISO 8601 timestamps.

    The accessory context keeps these records across restarts and upgrades. A confirmed accessory removal deletes the records. Rediscovery starts a new observation epoch.

    The custom Pump service shows each record through read-only custom characteristics. The architecture provides no HomeKit reset control or configuration reset option.

    ## Accessory lifecycle

    Use one accessory for each physical Basement Guardian system. Add the sensor and command services defined by the HomeKit mapping.

    Use the immutable vendor `deviceId` as the Homebridge UUID seed. Never use a display name or a mutable network address.

    The lifecycle has four operations:

    1. Cache restored accessories during `configureAccessory()`.
    2. Start account discovery after `didFinishLaunching`.
    3. Rebind a cached accessory when discovery finds its UUID.
    4. Register a new accessory only when no cached accessory matches.

    Do not remove a cached accessory after one failed request. Do not remove it after one incomplete inventory.

    A safe removal policy uses these gates:

    1. The inventory request completed successfully.
    2. The account runtime is authenticated and healthy.
    3. The device is absent from two consecutive successful inventories.
    4. The removal callback tests the latest inventory again.

    This policy adds one poll interval before removal. That delay is safer than deleting room assignments during a transient cloud problem.

    Persist accessory-context changes with `api.updatePlatformAccessories()`. A context mutation alone does not force a disk write during runtime.

    ## Command path

    Nest uses optimistic overlays because thermostat changes need immediate feedback. Basement Guardian waits for API acceptance but not for reported-state confirmation.

    Use an asynchronous confirmation path:

    1. Validate the command against the device-family adapter.
    2. Refuse duplicate self-test commands while a test is active or pending.
    3. Set pending state and send the command through `CloudApi` with a 2.5-second deadline.
    4. Return an immediate API rejection to the HomeKit setter and clear pending state.
    5. If the deadline expires, return `OPERATION_TIMED_OUT` and keep delivery uncertain.
    6. After API acceptance, complete the HomeKit write.
    7. Clear pending state when a newer report includes the command field.
    8. After 30 seconds from dispatch, restore the last reported Switch value and log the timeout.

    HAP temporarily holds the requested Switch value after API acceptance. Never copy that value into canonical device or safety state.

    Reported state reconciles the Switch. It turns off when the device reports that the test completed.

    Reject an off command while a test is active because the device has no cancel command. An off command while idle has no effect.

    Tests started outside HomeKit also update the Switch through reported state.

    The Alarm Mute Switch uses the same confirmation path. An on command sends `{ "alarm_audio_muted": true }`.

    The Switch follows reported `alarm_audio_muted` state. The API exposes no unmute write, so the plugin rejects an off command while mute is active.

    Do not implement this command until G-001 closes. Do not simulate a duration or an unmute timer.

    Do not use an optimistic telemetry overlay. Only the writable Switch can hold a temporary requested value during command confirmation.

    ## Health and degraded operation

    Keep device health separate from transport connection state. The cloud link and the pump-controller link can disagree.

    Use these facts in order:

    1. `serial_communications` states whether the Wi-Fi module can read the pump controller.
    2. REST connectivity states whether the cloud can reach the Wi-Fi module.
    3. `offline` states the vendor platform view.
    4. Shadow silence is only a secondary signal after two missed heartbeats.

    When transport fails, keep the last-known values and set the applicable HomeKit fault characteristics. Avoid sticky HomeKit `No Response` errors.

    If a published payload fails family validation, keep the accessory and mark it faulty. Remove it only after confirmed inventory absence.

    ## Resource lifetime

    Create one root `AbortController` in `AccountRuntime`. The Homebridge shutdown event aborts this controller before it closes the shadow client.

    Every retry delay, poll delay, credential timer, and subscription must use the root signal. Device-specific work can compose a child signal.

    The stop path uses this order:

    1. Abort future work.
    2. Stop new commands.
    3. Clear timers and subscriptions.
    4. Close the shadow client.
    5. Release device controllers.

    The stop path must be idempotent. A partial startup and a normal shutdown must use the same cleanup code.

    ## Configuration strategy

    Use explicit typed configuration fields for the first release. The schema includes credentials, polling controls, an optional `clientId` override for the bundled public Auth0 client ID, and `ignoredFaults`. The dynamically obtained AWS IoT client ID remains internal and is not configurable.

    Keep the REST API URL, Auth0 domain and realm, AWS region, WebSocket protocol, REST routes, and family command shapes inside the protocol layer. Do not expose them as configuration. Protocol changes require a tested plugin update. `clientId` is the only vendor-constant override.

    `ignoredFaults` contains a fixed set of notification-adapter slugs. The family adapter still decodes ignored conditions and updates their truthful services.

    The accessory controller omits only the selected Contact Sensor services. A later configuration change removes or restores these services with stable service subtypes.

    Do not add a generic string option list yet. A typed field gives the Homebridge interface a clear label, type, default, and validation rule.

    V1 uses the generated Homebridge form. It stores the account email and password in `config.json` for unattended authentication.

    The form masks the password field. The form also states that raw configuration and Homebridge backups contain the password.

    Cache the Auth0 ID token only under the Homebridge storage path. Use owner-only file permissions where the operating system supports them.

    Keep passwords, tokens, and temporary AWS credentials out of accessory context and logs. Redact authentication headers and request bodies before error logging.

    V1 does not use a custom token-only interface. No validated refresh-token flow supports unattended operation without the stored password.

    ## Diagnostics and telemetry

    The runtime writes messages through the Homebridge logger. It does not upload logs, crash reports, usage data, installation data, or diagnostics.

    The plugin has no analytics client or maintainer-operated endpoint. Its operational network allowlist contains only the required vendor Auth0, API, and AWS IoT endpoints.

    Apply secret redaction before data enters the logger. A user must copy redacted information manually for a support request.

    Review direct dependencies for automatic telemetry before release. Replace or configure a dependency that sends data outside the required vendor path.

    ## Release gates

    Publish `0.x` prereleases with the npm `next` tag and the GitHub prerelease label. The npm `latest` tag must identify only a stable release.

    The `1.0.0` release requires completed validation gates G-001, G-002, and G-003. Automated tests and real-home tests must also pass.

    Preserve accessory UUIDs, service subtypes, and valid accessory context during compatible upgrades. A breaking identity or configuration change requires a major version after 1.0.

    Prerelease documentation tells users to keep the vendor alarm and vendor notifications enabled. Release notes state all known limits and validation status.

    ## Test architecture

    Protect shows the value of pure policy modules and fake infrastructure. Nest shows the risk of leaving protocol merge logic without tests.

    The first implementation needs these test groups:

    | Test group          | Required cases                                                                                                                |
    | ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
    | State reducer       | Full bootstrap, partial heartbeat, repeated patch, missing field preservation, and desired-state rejection.                   |
    | Gemini decoder      | Every legal water-level code, unknown codes, required fields, and field type errors.                                          |
    | Backup event policy | Live backup run, self-test sequence, timestamp ordering, missed-event recovery, de-duplication, and restart.                 |
    | Health policy       | Cloud offline, serial link loss, normal heartbeat silence, stale state, and recovery.                                         |
    | Family registry     | Supported Gemini, declared HALO, unknown type, and a family mismatch.                                                         |
    | Reconciliation      | New device, cached device, renamed device, one failed inventory, one missing inventory, confirmed removal, and device return. |
    | Command service     | Self-test and mute confirmation, timeout, transport error, duplicate command, and shutdown with a pending command.            |
    | Accessory contract  | Stable service subtypes, cached `onGet`, push updates, ignored adapters, stale-service removal, and context persistence.     |
    | Secret handling     | Form disclosure, token-cache location, log redaction, error redaction, and exclusion from accessory context.                  |
    | Privacy             | No analytics calls, no diagnostic uploads, vendor-only network destinations, and dependency telemetry review.                 |
    | Runtime lifecycle   | Partial startup, reconnect, credential rotation, capped retry, normal shutdown, and repeated shutdown.                        |

    Recorded fixtures must drive integration tests. Unit tests must not need live credentials, hardware, or network access.

    Use an injectable clock for retries, timeouts, heartbeat age, and alert timestamps. This keeps timing tests fast and deterministic.

    ## Implementation sequence

    Build the architecture in this order:

    1. Remove the template devices and unmanaged `setInterval()` loop.
    2. Add domain types, the Gemini decoder, and reducer tests.
    3. Add typed authentication, REST, and shadow interfaces with recorded fixtures.
    4. Add `AccountRuntime` with one abortable lifecycle and an injectable clock.
    5. Add successful-inventory reconciliation and stable cached accessories.
    6. Add the multi-service Basement Guardian accessory.
    7. Add confirmed self-test commands and persisted backup-event de-duplication.
    8. Add reconnect, credential rotation, and degraded-operation tests.
    9. Add a custom web interface only when live setup validation becomes a requirement.

    ## Patterns not to copy

    Do not copy Nest's connection monolith, module-global Homebridge types, unconditional cache replacement, or missing shutdown ownership.

    Do not copy Protect's full media architecture, general option language, or diagnostics system. Those systems solve requirements that this plugin does not have.

    Do not let raw vendor payloads reach HomeKit handlers. Do not let accessory classes own sockets, account tokens, or retry loops.

    Do not implement HALO behavior without hardware-validation data. Keep HALO as a declared, unimplemented family until that validation is complete.

    ## Source links

    ### `homebridge-nest`

    - [Package and dependencies](https://github.com/chrisjshull/homebridge-nest/blob/70b224b720f165ee05513342226081d1f31c4a43/package.json)
    - [Platform registration and discovery](https://github.com/chrisjshull/homebridge-nest/blob/70b224b720f165ee05513342226081d1f31c4a43/index.js)
    - [Authentication, transport, normalization, retries, and writes](https://github.com/chrisjshull/homebridge-nest/blob/70b224b720f165ee05513342226081d1f31c4a43/lib/nest-connection.js)
    - [Common accessory behavior](https://github.com/chrisjshull/homebridge-nest/blob/70b224b720f165ee05513342226081d1f31c4a43/lib/nest-device-accessory.js)
    - [Nest Protect service mapping](https://github.com/chrisjshull/homebridge-nest/blob/70b224b720f165ee05513342226081d1f31c4a43/lib/nest-protect-accessory.js)

    ### `homebridge-unifi-protect`

    - [Package and scripts](https://github.com/hjdhjd/homebridge-unifi-protect/blob/c8bce2c31df1f84331d015acc2dfa4f4e61b3b32/package.json)
    - [Platform composition](https://github.com/hjdhjd/homebridge-unifi-protect/blob/c8bce2c31df1f84331d015acc2dfa4f4e61b3b32/src/platform.ts)
    - [Controller lifecycle and device reconciliation](https://github.com/hjdhjd/homebridge-unifi-protect/blob/c8bce2c31df1f84331d015acc2dfa4f4e61b3b32/src/nvr/nvr.ts)
    - [Common device state observers](https://github.com/hjdhjd/homebridge-unifi-protect/blob/c8bce2c31df1f84331d015acc2dfa4f4e61b3b32/src/devices/device-base.ts)
    - [Typed event routing](https://github.com/hjdhjd/homebridge-unifi-protect/blob/c8bce2c31df1f84331d015acc2dfa4f4e61b3b32/src/nvr/event-dispatch.ts)
    - [Feature catalog](https://github.com/hjdhjd/homebridge-unifi-protect/blob/c8bce2c31df1f84331d015acc2dfa4f4e61b3b32/src/options.ts)
    - [Typed accessory context and device maps](https://github.com/hjdhjd/homebridge-unifi-protect/blob/c8bce2c31df1f84331d015acc2dfa4f4e61b3b32/src/types.ts)
    - [Test suite](https://github.com/hjdhjd/homebridge-unifi-protect/tree/c8bce2c31df1f84331d015acc2dfa4f4e61b3b32/src)
    DATA_93d27dae_END

## DATA_499f3337_START Building the Homebridge plugin DATA_499f3337_END
- source: .planning/intel/context.md
- content: |
    DATA_569f7d2c_START
    An implementation guide for the plugin described by the HomeKit mapping, against the protocol contract and documented runtime behaviour. Not a Homebridge tutorial -- every section resolves a decision this specific plugin has to make.

    Verified against Homebridge **2.4.0**, `@homebridge/hap-nodejs` **2.2.2/2.2.3**, and the `homebridge/homebridge-plugin-template` repo, all read locally on 2026-08-26. Where a claim is inferred rather than read out of source or primary docs, it says so.

    Legend used below: **VERIFIED** = read from Homebridge/HAP-NodeJS source or the official docs on that date. **UNVERIFIED** = plausible but not confirmed; do not build load-bearing logic on it without testing.

    ## 0. Sources

    | Source                                                                                                                | What it settles                                                              |
    | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
    | `homebridge` 2.4.0 `dist/*.d.ts`, `dist/bridgeService.js`, `dist/cli.js`                                              | Lifecycle, events, cache persistence, shutdown ordering                      |
    | `@homebridge/hap-nodejs` 2.2.2 `dist/lib/{Service,Characteristic}.d.ts`, `dist/lib/definitions/ServiceDefinitions.js` | Push/pull semantics, error states, which characteristics each service allows |
    | `github.com/homebridge/homebridge.github.io` (the source of `developers.homebridge.io`)                               | Official plugin docs, config schema reference, best practices                |
    | `github.com/homebridge/homebridge-plugin-template` @ `latest`                                                         | Project layout, `package.json`, tsconfig, eslint, CI                         |
    | `github.com/homebridge/plugins` wiki → *Verified Plugins*                                                             | The verification checklist, last updated 2026-05-05                          |
    | `github.com/homebridge/HAP-NodeJS` wiki → *Presenting Erroneous Accessory State to the User*                          | The official position on "No Response"                                       |
    | Apple Activity History support documentation                                                                         | Native history ownership, eligibility, retention, and home-hub requirements  |

    Two important facts about the ecosystem as of this writing:

    - **Homebridge 2.x is current** (2.4.0). HAP now ships as `@homebridge/hap-nodejs` (2.2.x), not the old standalone `hap-nodejs` 0.11.x. Target `"homebridge": "^1.8.0 || ^2.0.0"`.
    - **Homebridge 2 added Matter.** `api.matter` exists when the bridge has Matter enabled. It is irrelevant to us -- we publish over HAP only -- but it changes what keywords you declare (§2).

    ______________________________________________________________________

    ## 1. Plugin type: dynamic platform, and nothing else

    **Use `DynamicPlatformPlugin`.** Three independent reasons, any one of which is sufficient:

    1. **Devices are discovered at runtime.** The protocol's `GET /devices` endpoint can return more than one device and two different families. An accessory plugin describes exactly one hard-coded accessory; a static platform must return its full accessory list synchronously at startup, before it could possibly have authenticated against Auth0 and called `/devices`.
    2. **Devices can disappear.** If the user unclaims a pump, the plugin must remove it from HomeKit. Only a dynamic platform can `unregisterPlatformAccessories`.
    3. **Homebridge Verified requires it** (§11). "The plugin must be of type dynamic platform" is the first line of the checklist.

    A static platform also blocks Homebridge startup while it works, which for a cloud login is exactly wrong -- Homebridge logs *"This plugin is taking a long time to load"* and the whole bridge waits on our HTTP round-trip to Auth0. **VERIFIED** (docs: `api/characteristic-warnings.md`).

    ### Registration

    `src/index.ts` -- the whole file:

    ```ts
    import type { API } from 'homebridge';

    import { BasementGuardianPlatform } from './platform.js';
    import { PLATFORM_NAME } from './settings.js';

    export default (api: API) => {
      api.registerPlatform(PLATFORM_NAME, BasementGuardianPlatform);
    };
    ```

    `src/settings.ts`:

    ```ts
    /** What the user writes as `"platform"` in config.json. Changing it orphans every config. */
    export const PLATFORM_NAME = 'BasementGuardian';

    /** Must equal `name` in package.json. Used by register/unregisterPlatformAccessories. */
    export const PLUGIN_NAME = 'homebridge-basement-guardian';
    ```

    `PLUGIN_NAME` and `PLATFORM_NAME` are passed to `registerPlatformAccessories` and `unregisterPlatformAccessories`, and Homebridge stores both on each cached accessory. If either changes after release, cached accessories no longer match and users lose their rooms, names and automations. Pick them once.

    ### Platform skeleton

    ```ts
    import type {
      API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service,
    } from 'homebridge';

    import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

    export interface BgConfig extends PlatformConfig {
      email?: string;
      password?: string;
      pollInterval?: number;   // seconds; REST backstop. Default 900.
      offlineConfirmationPollCount?: number; // consecutive successful disconnected polls. Default 2.
    }

    export class BasementGuardianPlatform implements DynamicPlatformPlugin {
      public readonly Service: typeof Service = this.api.hap.Service;
      public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

      /** Everything Homebridge restored from disk, keyed by UUID. */
      private readonly cached = new Map<string, PlatformAccessory>();
      /** UUIDs this run has claimed, so leftovers can be pruned. */
      private readonly claimed = new Set<string>();

      private readonly cfg: BgConfig;
      private client?: BgCloudClient;      // auth + REST
      private shadow?: ShadowConnection;   // MQTT
      private pollTimer?: NodeJS.Timeout;

      constructor(
        public readonly log: Logging,
        config: PlatformConfig,
        public readonly api: API,
      ) {
        this.cfg = config as BgConfig;

        // Verified requirement: "must successfully install and not start unless it is configured".
        if (!this.cfg.email || !this.cfg.password) {
          this.log.error(
            'Not starting: email and password are required. Set them in the Homebridge UI '
            + '(Plugins → Basement Guardian → Settings).',
          );
          return;                                    // no listeners registered, nothing runs
        }

        this.api.on('didFinishLaunching', () => {
          void this.start();                          // never let a rejection escape
        });

        this.api.on('shutdown', () => {
          this.stop();
        });
      }

      /** Called once per cached accessory, before didFinishLaunching. Only record them. */
      configureAccessory(accessory: PlatformAccessory): void {
        this.log.debug('Restoring from cache:', accessory.displayName);
        this.cached.set(accessory.UUID, accessory);
      }

      private async start(): Promise<void> { /* §4, §9 */ }
      private stop(): void { /* §9 */ }
    }
    ```

    Two things in that skeleton are deliberate and easy to get wrong:

    - **The unconfigured bail-out returns before registering any event listeners.** A plugin that registers `didFinishLaunching` and *then* discovers it has no credentials will still run its handler. Returning early from the constructor is the cleanest way to satisfy "must not start unless configured".
    - **`configureAccessory` does not build handlers.** The template's comment suggests setting up characteristics there. Do not: at that point we have no device state and no idea whether the device still exists on the account. Record the accessory and do all wiring in `discoverDevices` (§4), which runs after `didFinishLaunching` for both restored and new accessories.

    ______________________________________________________________________

    ## 2. Project structure and conventions

    ### What the official template actually contains

    Cloned from `homebridge/homebridge-plugin-template@latest`:

    ```
    .github/ISSUE_TEMPLATE/{bug-report,feature-request,support-request}.md, config.yml
    .github/workflows/build.yml      # matrix: node 20.x, 22.x, 24.x → npm run lint && npm run build
    .npmignore                       # excludes src/, tsconfig, eslint config, .github, test/
    .vscode/{extensions,settings}.json
    config.schema.json               # 12 lines; just `name`
    eslint.config.js                 # flat config, typescript-eslint
    nodemon.json                     # watch src, exec `tsc && homebridge -U ./test/hbConfig -D`
    package.json
    src/index.ts                     # registerPlatform, 11 lines
    src/platform.ts                  # DynamicPlatformPlugin
    src/platformAccessory.ts         # one accessory's services + handlers
    src/settings.ts                  # PLATFORM_NAME, PLUGIN_NAME
    src/@types/homebridge-lib.d.ts   # shim for homebridge-lib/EveHomeKitTypes
    test/hbConfig/{config.json,auth.json}   # a throwaway Homebridge instance for `npm run watch`
    tsconfig.json
    ```

    That is the entire thing. Four source files, no framework. The template also imports `EveHomeKitTypes` from `homebridge-lib`. Drop that dependency. Define only the small vendor service set this plugin needs.

    ### `package.json`

    ```jsonc
    {
      "name": "homebridge-basement-guardian",
      "displayName": "Basement Guardian",
      "type": "module",
      "version": "0.1.0",
      "description": "WAYNE Basement Guardian smart sump pump in HomeKit.",
      "license": "Apache-2.0",
      "homepage": "https://github.com/USER/homebridge-basement-guardian#readme",
      "repository": { "type": "git", "url": "git+https://github.com/USER/homebridge-basement-guardian.git" },
      "bugs": { "url": "https://github.com/USER/homebridge-basement-guardian/issues" },
      "keywords": [
        "homebridge-plugin",      // REQUIRED -- this is how Homebridge and the UI find the plugin
        "supports-hap",           // transport declaration; see below
        "sump-pump", "wayne", "basement-guardian"
      ],
      "main": "dist/index.js",
      "engines": {
        "node": "^22 || ^24",
        "homebridge": "^1.8.0 || ^2.0.0"
      },
      "files": ["dist", "config.schema.json"],
      "scripts": {
        "build": "rimraf ./dist && tsc",
        "lint": "eslint . --max-warnings=0",
        "prepublishOnly": "npm run lint && npm run build",
        "watch": "npm run build && npm link && nodemon"
      },
      "dependencies": {
        "aws-iot-device-sdk": "^2.2.16"
      },
      "devDependencies": {
        "@types/aws-iot-device-sdk": "^2.2.9",
        "@types/node": "^22",
        "homebridge": "^2.4.0",
        "typescript": "^5",
        "typescript-eslint": "^8",
        "eslint": "^9",
        "@eslint/js": "^9",
        "nodemon": "^3",
        "rimraf": "^6"
      }
    }
    ```

    Field-by-field, the ones that matter:

    | Field                             | Why                                                                                                                                                                                                                                                                                                                                                                              |
    | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `name`                            | Must start `homebridge-` (or be scoped, §12). Must equal `PLUGIN_NAME` in `settings.ts`.                                                                                                                                                                                                                                                                                         |
    | `displayName`                     | What the Homebridge UI shows on the plugin tile instead of the npm name.                                                                                                                                                                                                                                                                                                         |
    | `keywords: ["homebridge-plugin"]` | **Without this the plugin is invisible** to Homebridge and to UI search. **VERIFIED** (docs: `getting-started.md`).                                                                                                                                                                                                                                                              |
    | `keywords: ["supports-hap"]`      | Transport declaration read by Homebridge UI ≥ 5.28.0. If you declare one transport keyword you must declare all of them -- the UI treats a declaration as complete. Do **not** add `supports-matter`: that is only for plugins that register Matter accessories themselves, and Homebridge bridges our HAP accessories to Matter regardless. **VERIFIED** (plugins repo README). |
    | `main`                            | Points at the compiled `dist/index.js`.                                                                                                                                                                                                                                                                                                                                          |
    | `engines.homebridge`              | Drives the UI's green "ready for Homebridge 2" tick.                                                                                                                                                                                                                                                                                                                             |
    | `engines.node`                    | Verified requirement: must run on all supported LTS versions -- currently Node 22 and 24.                                                                                                                                                                                                                                                                                        |
    | `files`                           | Publishing docs recommend `files` (or `.npmignore`) so `src/` and maps do not ship. Check with `npm pack --dry-run`.                                                                                                                                                                                                                                                             |
    | `funding`                         | Only renders for verified plugins; add later.                                                                                                                                                                                                                                                                                                                                    |

    The template pins exact-ish versions (`"typescript": "^6.0.3"`, `"eslint": "^10.9.0"`) because it tracks head. Use whatever is current when you start; the CI matrix is the real compatibility test.

    ### TypeScript setup

    Copy the template's `tsconfig.json` unchanged:

    ```jsonc
    {
      "compilerOptions": {
        "target": "ES2022",
        "lib": ["DOM", "ES2022"],
        "rootDir": "src",
        "module": "nodenext",
        "moduleResolution": "nodenext",
        "strict": true,
        "declaration": true,
        "skipLibCheck": true,
        "outDir": "dist",
        "sourceMap": true,
        "allowSyntheticDefaultImports": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true
      },
      "include": ["eslint.config.js", "homebridge-ui", "src"]
    }
    ```

    `module: nodenext` with `"type": "module"` in `package.json` means **ESM, and every relative import needs an explicit `.js` extension** -- `import { PLATFORM_NAME } from './settings.js'`, even though the file on disk is `settings.ts`. This trips everyone once.

    **`aws-iot-device-sdk` is CommonJS.** Verified that both interop forms work from ESM under Node 22+:

    ```ts
    import awsIot from 'aws-iot-device-sdk';           // default keys: device, thingShadow, jobs
    import { thingShadow } from 'aws-iot-device-sdk';  // also resolves
    ```

    Use the default-import form (`new awsIot.thingShadow(...)`). This form does not depend on named-export detection across future CommonJS versions.

    Types: `@types/aws-iot-device-sdk` 2.2.9 exists and covers everything we need, including `updateWebSocketCredentials(accessKeyId, secretKey, sessionToken, expiration: Date): void` and `register(thingName, options?, callback?)` with a typed `RegisterOptions` carrying `persistentSubscribe`. Its `thingShadow.on` overloads cover `status`/`timeout`/`delta`/ `foreignStateChange`; connection-level events (`connect`, `close`, `error`, `offline`, `reconnect`) fall through to the base `EventEmitter` signature, which compiles fine but is untyped. **VERIFIED**.

    ### Build and watch

    ```bash
    npm run build     # rimraf dist && tsc
    npm run watch     # build, npm link, then nodemon: tsc && homebridge -U ./test/hbConfig -D
    npm run lint      # eslint . --max-warnings=0
    ```

    `npm run watch` runs an isolated Homebridge instance from `test/hbConfig/`. It uses a separate bridge username and PIN.

    Put the development configuration in `test/hbConfig/config.json`. Add that file to `.gitignore` because it can contain an account password.

    Always run Homebridge with `-D` while developing; `log.debug` output is otherwise suppressed.

    ### ESLint

    The template's flat config is `@eslint/js` recommended + `typescript-eslint` recommended, plus a house style: single quotes, 2-space indent, semicolons, trailing commas on multiline, `curly: all`, `eqeqeq: smart`, `max-len: 160`. Take it verbatim -- matching the ecosystem's style makes a verification review shorter, and `npm run lint` is a CI gate in the template's `build.yml`.

    ### Recommended layout for this plugin

    ```
    src/
      index.ts                 registerPlatform
      settings.ts              PLATFORM_NAME, PLUGIN_NAME, defaults
      platform.ts              DynamicPlatformPlugin: config, discovery, accessory lifecycle
      cloud/
        auth.ts                Auth0 password-realm grant, token cache on disk (§5)
        api.ts                 vendor REST client
        shadow.ts              thingShadow connection + credential rotation (§9)
      device/
        state.ts               merged shadow cache, deriveation of HomeKit values (§6)
        gemini.ts              wayneWaterGemini field map + command shapes
        halo.ts                wayneWaterHalo field map + command shapes (protocol stub)
      accessories/
        main.ts                pit + power + fault + battery + self-test
        pump.ts                one read-only pump and its standard activity adapter
        backupNotification.ts  live backup notification and recovered-event de-duplication (§5)
    ```

    The `gemini.ts` / `halo.ts` split matters. The protocol contract is explicit that the two families have different data models *and* different command shapes -- a Gemini takes `{"desiredData":{"test_running":true}}` and has no `pump_state` field at all. Branch on `device.deviceTypeId` once, at discovery, and never again.

    ______________________________________________________________________

    ## 3. `config.schema.json`

    Ship `config.schema.json` in the package root. The Homebridge UI reads it and generates the settings form; without it users hand-edit `config.json`, and **verification requires it**.

    The forms are rendered by [ng-formworks](https://github.com/zahmo/ng-formworks) (the maintained fork of Angular JSON Schema Form) using JSON Schema v6/v4/v3. There is a [playground](https://zahmo.github.io/ng-formworks/) -- pick the **bootstrap-5** framework to match what the UI actually renders.

    ### Ours

    ```jsonc
    {
      "pluginAlias": "BasementGuardian",       // MUST equal PLATFORM_NAME in settings.ts
      "pluginType": "platform",
      "singular": true,                        // one account block only; UI hides "add another"
      "strictValidation": true,                // UI refuses to save an invalid config
      "headerDisplay": "Sign in with your Basement Guardian account. Homebridge stores the password in plain text in `config.json` and includes it in backups. The plugin sends the password only to the vendor Auth0 tenant.",
      "schema": {
        "type": "object",
        "required": ["name", "email", "password"],
        "properties": {
          "name": {
            "title": "Name",
            "type": "string",
            "default": "Basement Guardian",
            "description": "Shown in the Homebridge log. Not the accessory name."
          },
          "email": {
            "title": "Account email",
            "type": "string",
            "format": "email",
            "description": "The email address you sign in to the Basement Guardian app with."
          },
          "password": {
            "title": "Account password",
            "type": "string",
            "widget": "password",
            "minLength": 1,
            "description": "The form masks this field. Homebridge stores the value in plain text in `config.json` and backups."
          },
          "clientId": {
            "title": "Authentication client ID",
            "type": "string",
            "minLength": 1,
            "description": "Optional override for the bundled public Auth0 client ID. Leave this unset unless the vendor changes the client ID."
          },
          "pollInterval": {
            "title": "REST poll interval (seconds)",
            "type": "integer",
            "minimum": 300,
            "maximum": 3600,
            "placeholder": "900",
            "description": "Backstop poll of the cloud API. Live state arrives over MQTT; this only catches a silently dead socket and refreshes the reachability flag. The device only reports every ~15 minutes, so polling faster gains nothing."
          },
          "offlineConfirmationPollCount": {
            "title": "Offline confirmation poll count",
            "type": "integer",
            "minimum": 1,
            "maximum": 8,
            "default": 2,
            "description": "Activate the offline condition after this many consecutive successful REST polls report the device disconnected. The default is 2. Polls occur approximately every 15 minutes by default."
          },
          "ignoredFaults": {
            "title": "Ignored Apple Home alerts",
            "type": "array",
            "uniqueItems": true,
            "description": "Remove selected notification adapters. Device state, diagnostics, local counters, and timestamps remain available.",
            "items": {
              "type": "string",
              "enum": [
                "backup-pump-activated",
                "mains-power-lost",
                "primary-pump-fault",
                "backup-pump-fault",
                "water-sensor-fault",
                "pump-controller-link-lost",
                "basement-guardian-offline"
              ]
            }
          }
        }
      }
    }
    ```

    Do not add a notification-delay field. HomeKit does not provide a separate delayed-notification command. A delayed characteristic change also delays state, automations, and Activity History.

    ### The credential fields specifically

    **There is no `"type": "password"` in JSON Schema, and Homebridge does not invent one.** The mechanism is the `widget` attribute, which overrides the input the form generator would otherwise pick from `type`/`format`:

    ```json
    { "password": { "title": "Account password", "type": "string", "widget": "password" } }
    ```

    `widget` accepts `textarea`, `password`, `hidden`, `datetime-local`, `date`, `time`, `color`, `range`, `radios`, `select`. **VERIFIED** (docs: `config-screen/schema.md` → *Choosing A Different Widget*).

    The widget masks the input box only. Homebridge writes the password to `config.json` in plain text. The raw configuration editor and Homebridge backups also contain it.

    State these facts in the form and the user documentation. V1 uses this storage for reliable unattended authentication.

    A custom token-only interface does not meet the V1 reliability requirement. The protocol research found no validated refresh-token flow. A token-only design can require manual login after token expiry.

    For the email field, `"format": "email"` both validates (RFC 5322) and renders a native email input. **VERIFIED**.

    ### Validation attributes worth using

    | Attribute                      | Effect                                                                                                                                                                                                                                                                                                                                                                                                          |
    | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `required` at the schema level | Field must be present. Note: on a *dropdown*, marking it required removes the UI's automatic "None" entry, so the user can never unset it. Irrelevant for text fields.                                                                                                                                                                                                                                          |
    | `minLength` / `maxLength`      | String bounds.                                                                                                                                                                                                                                                                                                                                                                                                  |
    | `minimum` / `maximum`          | Numeric bounds. **Supplying both renders a range slider**, which is the wrong control for a poll interval -- hence `placeholder` rather than `default` below, and consider dropping `maximum` if the slider looks bad.                                                                                                                                                                                          |
    | `pattern`                      | Regex. Not useful for us; `format: email` is better than a hand-rolled regex.                                                                                                                                                                                                                                                                                                                                   |
    | `format`                       | `email`, `hostname`, `ipv4`, `ipv6`, `uri`, `uuid`, `date-time`. Only `color`, `date`, `email`, `uri` change the widget; the rest only validate.                                                                                                                                                                                                                                                                |
    | `strictValidation: true`       | Root-level, not inside `schema`. Makes the UI treat an invalid block as an error (red) rather than a warning (orange) and refuse to save. **VERIFIED** from the homebridge-config-ui-x changelog and source (`plugin-config.component.ts` reads `schema.strictValidation`). The template ships `false`; set it `true` -- a plugin that cannot work without credentials should not let you save it without them. |

    ### `placeholder` vs `default` for `pollInterval`

    Use `placeholder`. A `placeholder` value is shown greyed in the field and **is not written to `config.json` unless the user changes it**; a `default` is written. That keeps the config minimal and lets us change the built-in default later without every user's config pinning the old one. The plugin must therefore carry the default in code:

    ```ts
    const POLL_INTERVAL_MS = Math.max(300, this.cfg.pollInterval ?? 900) * 1000;
    ```

    The built-in `offlineConfirmationPollCount` default is 2. Runtime validation must accept only integers from 1 through 8.

    ### Vendor constants

    `clientId` is the only configurable vendor constant. When omitted, the runtime uses the bundled public Auth0 client ID.

    Keep the REST API URL, Auth0 domain and realm, AWS region, WebSocket protocol, REST routes, and command shapes internal. Do not add configuration fields for them. The AWS IoT client ID, endpoint, and temporary credentials come from `GET /credentials/aws` and must never use configuration values.

    ### `ignoredFaults`

    The runtime default is an empty array. Thus, the plugin publishes all notification adapters when the configuration omits this field.

    The schema uses `uniqueItems: true` and a fixed enum. Strict validation rejects duplicate values, unknown values, and spelling errors.

    The option controls only Contact Sensor adapters. The plugin must continue to decode, store, log, and show each ignored condition through its truthful service.

    **Do not** put `default` on any property inside an array item -- the form renders a blank first row for an empty array, that row picks up the defaults, and it gets saved as a phantom entry. Not an issue for our flat schema, but it is the single most common config-schema bug.

    ### What not to do

    - No `patternProperties` -- unsupported by the form generator.
    - No HTML in `headerDisplay`/`footerDisplay`; markdown only, and remote images only from `raw.githubusercontent.com`.
    - Do not add a `platform` property to `schema.properties` -- the UI adds it automatically from `pluginType`.

    ### Dynamic schemas (not needed, but worth knowing)

    If we later want a dropdown listing the user's actual devices, the mechanism is `dynamicSchemaVersion` in the shipped schema plus a generated `.homebridge-basement-guardian-v1.schema.json` written into `api.user.storagePath()` at runtime. The shipped schema must still stand alone for a first run. We do not need this: the platform discovers devices itself and exposes all of them.

    ______________________________________________________________________

    ## 4. Accessory lifecycle

    `configureAccessory()` is called once per cached accessory at startup, **before** `didFinishLaunching`. Cache them; do not build handlers yet. Discovery happens in `didFinishLaunching`, which then reconciles cached against discovered.

    Use the vendor `deviceId` (`<account-id>_<serial-number>`) as the stable UUID seed. Do not use the mutable display name.

    ```ts
    const uuid = this.api.hap.uuid.generate(device.deviceId)
    const existing = this.accessories.find(a => a.UUID === uuid)

    if (existing) {
      existing.context.device = device
      this.api.updatePlatformAccessories([existing])   // also persists context -- see §5
      new BasementGuardianAccessory(this, existing)
    } else {
      const accessory = new this.api.platformAccessory(device.name, uuid)
      accessory.context.device = device
      new BasementGuardianAccessory(this, accessory)
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
    }
    ```

    Devices that vanish from the account must be unregistered, or they linger in HomeKit forever with no handlers behind them:

    ```ts
    const discovered = new Set(devices.map(d => this.api.hap.uuid.generate(d.deviceId)))
    const stale = this.accessories.filter(a => !discovered.has(a.UUID))
    if (stale.length) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, stale)
    }
    ```

    Be careful doing this on a *transient* API failure -- a failed `GET /devices` would unregister everything and lose the user's room assignments. Only reconcile on a successful discovery response.

    ## 5. `accessory.context` -- persisted, but not automatically

    **VERIFIED** from `homebridge/homebridge` `src/bridgeService.ts`: `saveCachedPlatformAccessoriesOnDisk()` is called from exactly four places -- `handleRegisterPlatformAccessories`, `handleUpdatePlatformAccessories`, `handleUnregisterPlatformAccessories`, and `teardown()`.

    So context **is** durable across restarts, but mutating it does nothing on its own. The only mid-run persist trigger is `api.updatePlatformAccessories([accessory])` -- which is also an upsert, adding the accessory to the cached list if absent.

    This matters for backup-pump activity recovery in the HomeKit mapping. The last recorded device timestamp is a de-duplication watermark. If it is written only during `teardown()`, a hard kill can count the same recovered activation again. After updating the local activation record, set `accessory.context.lastRecordedBackupPumpTimestamp`. Then call `api.updatePlatformAccessories([accessory])` immediately.

    A recovered timestamp proves that at least one activation occurred. It does not provide duration or the number of activations since the prior timestamp. Increment the observed record count once and update the last-observed timestamp. Do not invent start and stop times.

    The alternative -- a JSON file under `api.user.storagePath()` -- is conventional for larger or non-accessory-scoped state (`homebridge-shelly-ng` uses `.shelly-ng.json` with a debounced write; `dgreif/ring` uses `.ring.json`). For one timestamp per accessory, context plus an explicit update is simpler and keeps the value attached to the accessory it describes.

    Do not persist the Auth0 token by rewriting `config.json`. Cache it under `api.user.storagePath()` and use owner-only permissions where supported.

    Never store secrets in `accessory.context`. Redact passwords, tokens, temporary AWS credentials, authentication headers, and authentication request bodies from logs.

    ## 6. Characteristics: push vs pull -- and why the two error idioms are mutually exclusive

    **This is the single most important API detail in this document.**

    From HAP-NodeJS `src/lib/Characteristic.ts` (the `updateValue(error)` overload):

    > Sets the state of the characteristic to an errored state. **If a `onGet` or `CharacteristicEventTypes.GET` handler is set up, the errored state will be ignored and the characteristic will always query the latest state by calling the provided handler.** […] Erroneous state is never *pushed* to the client side.

    So:

    | Your characteristic        | To signal failure                                                                                       |
    | -------------------------- | ------------------------------------------------------------------------------------------------------- |
    | **has** an `onGet` handler | you must **throw** `HapStatusError` from it -- `updateCharacteristic(c, new Error())` is a silent no-op |
    | **has no** `onGet` handler | `updateCharacteristic(c, new Error())` is the only lever                                                |

    Mixing them is a real, shipping bug: `homebridge-resideo`'s `apiError()` pushes an `Error` across its leak sensor's `LeakDetected`, `StatusActive` and `BatteryLevel` -- all of which have `onGet` handlers registered in the same constructor, so the error is discarded on every read.

    **Our pattern.** We hold complete cached state (MQTT push + REST backstop), so `onGet` should return the cache immediately and never touch the network -- a slow `onGet` makes the whole Home app sluggish. Push updates via `updateCharacteristic()` when the shadow moves:

    ```ts
    // pull: instant, from cache
    service.getCharacteristic(Characteristic.LeakDetected)
      .onGet(() => this.state.water_level >= 31 ? 1 : 0)

    // push: on every shadow update
    private onShadowUpdate(reported: Partial<GeminiData>): void {
      Object.assign(this.state, reported)          // MERGE -- heartbeats are partial (§OPERATIONS 1)
      this.leak.updateCharacteristic(Characteristic.LeakDetected, this.state.water_level >= 31 ? 1 : 0)
      // ... every other derived characteristic
    }
    ```

    `Object.assign` rather than replacement is not a style choice: heartbeats omit `primary_pump_running`, `ac_power`, `battery_charging`, `test_running` and every fault bit, so assigning wholesale blanks them every ~15 minutes.

    ## 7. Unreachability: prefer `StatusFault` / `StatusActive` over "No Response"

    Homebridge's own guidance (HAP-NodeJS wiki, *Presenting Erroneous Accessory State*) is blunt:

    > **TL;DR: Your accessory should always be reachable and fully operational.** […] this 'No Response' state will generally persist for a long time (e.g. until the Apple Home app is closed and re-opened), even after you try to return a valid value, **because once in a 'No Response' state, the Apple Home app no longer checks for characteristic updates.**

    It sanctions `HapStatusError` only for *permanent* errors needing user action -- an authentication failure, not a quiet device.

    For this device that settles it. It is silent for ~15 minutes at a time by design, and `serial_communications === false` leaves it "connected" while serving stale data. Blanking every tile on a timing heuristic would be wrong and sticky. Recommended:

    | Condition                                      | Signal                                                                                 |
    | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
    | `serial_communications === false`              | `StatusFault = GENERAL_FAULT` on every service; stop trusting values                   |
    | any pump/sensor/fuse fault bit                 | `StatusFault = GENERAL_FAULT` on the owning service                                    |
    | `offline` / `connectivity.connected === false` | `StatusActive = false` across services                                                 |
    | Auth0 credentials rejected                     | `HapStatusError(SERVICE_COMMUNICATION_FAILURE)` -- genuinely permanent, needs the user |

    This is what `homebridge-flobymoen` (Verified, and the closest analogue -- a cloud water device) does: `StatusFault.GENERAL_FAULT` + `StatusTampered.TAMPERED` when offline, never "No Response". `homebridge-unifi-protect` composes `StatusActive` from a reachability getter for the same reason.

    The HomeKit mapping carries an important caveat: the Apple Home app does not render `StatusFault` and shows `StatusActive` only as "Status Active -- No" on the settings page. Both are mainly for Eve. That is why the design also carries a dedicated aggregate fault `ContactSensor` -- it is the only way a fault becomes visible and automatable in Home.

    ## 8. Services vs accessories

    Two hard constraints, both verified:

    **Same-type services need subtypes.** Our design has eight `ContactSensor` services. Each service needs the three-argument form and a stable subtype.

    Find each service with `getServiceById()`. A call to `getService(Type)` can return the wrong sibling.

    ```ts
    const enum ContactSubtype {
      PRIMARY_PUMP_RUNNING = 'activity.primary-pump-running',
      BACKUP_PUMP_ACTIVATED = 'alert.backup-pump-activated',
      MAINS_POWER_LOST = 'alert.mains-power-lost',
      PRIMARY_PUMP_FAULT = 'fault.primary-pump',
      BACKUP_PUMP_FAULT = 'fault.backup-pump',
      WATER_SENSOR_FAULT = 'fault.water-sensor',
      PUMP_CONTROLLER_LINK_LOST = 'fault.pump-controller-link',
      BASEMENT_GUARDIAN_OFFLINE = 'fault.basement-guardian-offline',
    }
    const svc = this.accessory.getServiceById(
      Service.ContactSensor,
      ContactSubtype.PRIMARY_PUMP_RUNNING,
    ) ?? this.accessory.addService(
      Service.ContactSensor,
      'Primary Pump Running',
      ContactSubtype.PRIMARY_PUMP_RUNNING,
    )
    ```

    Set **both** names: `Characteristic.Name` is the stable HAP identity, `ConfiguredName` is what Home renders and what a user rename writes to (call `addOptionalCharacteristic(Characteristic.ConfiguredName)` first).

    **A room containing only sensors does not appear in Home View.** From the `homebridge-qolsys` README:

    > If a room only contains sensors, and no controllable devices, it won't display the room in the Home View. […] A summary of all currently triggered sensors will be displayed when the Security category is selected in Home View. Sensors that aren't triggered won't display in the summary.

    The accessory includes sensor services and two valid controls. **System Self-Test** and **Alarm Mute** make the room visible in Home View.

    **Use one accessory with many services.** This structure matches one physical system. It also keeps the Battery service attached to the system that it describes.

    Do not add `FilterMaintenance`. The service describes filters and misrepresents battery replacement. Use the standard and custom Battery services from D-012.

    Also: always `removeService()` when a config toggle disables a service, and **look the service up on the accessory, not on a class field** -- `homebridge-resideo` carries two fixed bugs whose comments document exactly that mistake, where the field was still `undefined` at that point in the constructor so the removal branch never ran and an orphaned service stayed in HomeKit permanently.

    ## 9. Long-lived connections and timer hygiene

    Universal across every plugin surveyed: **start the connection in `didFinishLaunching`, never the constructor.** The constructor may kick off auth as a stored promise that `didFinishLaunching` awaits.

    **Register `api.on('shutdown')` and make it the single owner of teardown.** Ring, Tuya and SimpliSafe3 -- all popular -- have no shutdown handler at all; the symptom, per `homebridge-meross`'s own code comment, is intervals that "kept polling every device while Homebridge was tearing down, and kept the process alive".

    ```ts
    constructor(log, config, api) {
      this.shutdown = new AbortController()
      api.on('didFinishLaunching', () => this.start())
      api.on('shutdown', () => {
        this.shutdown.abort('shutdown')          // cancels signal-aware work first
        clearTimeout(this.credentialTimer)       // our rotation timer must not outlive us
        this.shadow?.end(true)
      })
    }
    ```

    The operational measurements define the credential-rotation behavior. Reschedule from the new expiry and clear the old timer before re-arming:

    ```ts
    private scheduleRotation(): void {
      clearTimeout(this.credentialTimer)
      const dueIn = new Date(this.creds.credentials.Expiration).getTime() - Date.now() - 10 * 60_000
      this.credentialTimer = setTimeout(async () => {
        try {
          this.creds = await this.api.awsCredentials()
          this.shadow.updateWebSocketCredentials(
            this.creds.credentials.AccessKeyId,
            this.creds.credentials.SecretAccessKey,
            this.creds.credentials.SessionToken,
            new Date(this.creds.credentials.Expiration))
        } catch (e) {
          this.log.warn('credential rotation failed, retrying in 60s:', e)
        } finally {
          this.scheduleRotation()      // ALWAYS reschedule -- Tuya's bug is returning on error
        }
      }, Math.max(30_000, dueIn))
    }
    ```

    The `finally` matters. `homebridge-tuya-platform` logs and returns on a failed credential fetch with nothing rescheduled, so its push channel stays dead until Homebridge restarts.

    **Cap your backoff.** `homebridge-simplisafe3` uses `2 ** n * 1000` uncapped -- after ~20 failures the next retry is twelve days out. Copy `homebridge-unifi-protect`: `Math.min(30_000, 1000 * 2 ** (attempt - 2))`, with a re-entrancy guard, since `error` and `close` both fire.

    ## 10. Pump activity without a private history protocol

    V1 does not depend on `fakegato-history`. It does not implement Eve's private history service.

    Publish pump activity through standard Contact Sensor state changes:

    - **Primary Pump Running** follows `primary_pump_running`.
    - **Backup Pump Activated** follows `backup_pump_running`.

    Apple Home can retain up to 30 days of activity for eligible accessories. Apple lists contact sensors as supported. A supported home hub and the current Home architecture are required. The controller owns this history, not the plugin. See Apple's [Activity History requirements](https://support.apple.com/en-gb/105011).

    Validate both bridged Contact Sensors with a real Apple home before release. Do not rely on Activity History for safety delivery. The plugin cannot set its retention, read it as an event source, or add a missed transition later.

    Keep only these local pump statistics in typed `accessory.context`:

    - The observation start time.
    - The observed activation count.
    - The last-observed-activation timestamp.
    - The backup timestamp de-duplication watermark.

    Use this record for each pump:

    ```ts
    interface PumpObservationRecord {
      schemaVersion: 1;
      observationStartedAt: string;
      observedActivationCount: number;
      lastObservedActivationAt?: string;
    }
    ```

    Set `observationStartedAt` when the plugin accepts the first valid state for that pump. Store all timestamps as UTC ISO 8601 strings.

    An observed count is not a device lifetime count. A live `false -> true` edge adds one activation. Repeated `true` snapshots do not add more activations.

    A newer backup timestamp can recover one activation record after an outage. It proves at least one activation, not the exact number. It does not create a Contact Sensor pulse.

    Persist each record and watermark update with `api.updatePlatformAccessories([accessory])`. V1 has no detailed local timeline and no history-retention configuration.

    Show the three observation values as read-only custom characteristics on each Pump service. Do not add a HomeKit reset control or configuration reset option.

    Preserve valid records during context migrations. If a record cannot migrate, log a warning and start a new observation epoch.

    Homebridge removes the records when it removes the cached accessory. If the same device returns later, create a new observation epoch.

    ## 11. Homebridge Verified -- the actual checklist

    From the `homebridge/plugins` wiki, *Verified Plugins*, last updated 2026-05-05. Verbatim, grouped as published:

    **General**

    - "The plugin must be of type dynamic platform"
    - "The plugin must not offer the same nor less functionality than that of any existing verified plugin"

    **Repository**

    - "The plugin must be published to NPM and the source code available on a GitHub repository, with issues enabled"
    - "A GitHub release should be created for every new version of your plugin, with release notes"

    **Environment**

    - "The plugin must run on all supported LTS versions of Node.js" (currently v22 and v24)
    - "The plugin must successfully install and not start unless it is configured"
    - "The plugin must not execute post-install scripts that modify the users' system in any way"
    - "The plugin must not require the user to run Homebridge in a TTY or with non-standard startup parameters, even for initial configuration"

    **Codebase**

    - "The plugin must implement the Homebridge Plugin Settings GUI"
    - "The plugin must not contain any analytics or calls that enable you to track the user"
    - "If the plugin needs to write files to disk (cache, keys, etc.), it must store them inside the Homebridge storage directory"
    - "The plugin must not throw unhandled exceptions, the plugin must catch and log its own errors"

    V1 collects no analytics, crash reports, installation data, usage data, or diagnostics. It has no maintainer-operated service.

    The plugin writes redacted messages through the Homebridge logger. A user must copy the required information manually for a support request.

    The current stable release receives best-effort support through GitHub Issues. The project makes no response-time or resolution-time promise.

    Issue templates request versions, reproduction steps, and redacted logs. They must not request credentials or complete configuration files.

    The project receives vulnerability reports through private GitHub Security Advisories. Public issue templates direct security reports to that private channel.

    ### How this design measures up

    | Requirement                                   | Status                                                                                                                                              |
    | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
    | dynamic platform                              | satisfied by design (§1)                                                                                                                            |
    | no duplicate of an existing verified plugin   | no Basement Guardian plugin exists                                                                                                                  |
    | Settings GUI                                  | `config.schema.json` (§3)                                                                                                                           |
    | no analytics or user tracking                 | satisfied by design. No telemetry client, installation ping, crash reporter, or maintainer-operated endpoint                                        |
    | files inside the Homebridge storage directory | **binding on us** -- the cached `id_token` must live under `api.user.storagePath()`, never beside the plugin (§5)                         |
    | must not start unless configured              | **binding on us** -- with no email/password the platform must log and return, not throw. The credential path is the likeliest place to violate this |
    | no unhandled exceptions                       | **binding on us** -- the refusal path in §13 (`continue`, never `throw`) and the rotation `finally` in §9 exist partly for this                     |
    | Node LTS v22 and v24                          | verify `aws-iot-device-sdk` on both before submitting                                                                                               |
    | GitHub release per version, issues enabled    | process, not code                                                                                                                                   |

    Nothing here looks likely to block verification. The two to watch are the storage-directory rule and "must not start unless configured" -- both concern credential handling, which is where a cloud plugin most easily goes wrong.

    ## 12. Publishing

    - Name `homebridge-basement-guardian`, or scope it. The `homebridge-` prefix (or a scope with it in `displayName`) is what the Homebridge UI searches for.
    - `keywords` **must** include `homebridge-plugin` for the UI to discover it.
    - Set `displayName` for a human-readable title in the UI.
    - `engines` must declare both `homebridge` and `node` ranges. Target Homebridge 2.x.
    - Use Semantic Versioning. Publish `0.x` prereleases with the npm `next` tag and the GitHub prerelease label.
    - Do not point npm `latest` to a prerelease build.
    - Publish `1.0.0` only after G-001, G-002, and G-003 pass with the required automated and real-home tests.
    - Tell prerelease users to keep the vendor alarm and vendor notifications enabled.
    - Create release notes for every package. Include changes, configuration migrations, known limits, and validation status.
    - Preserve accessory UUIDs and service subtypes across compatible upgrades.

    ## 13. Supporting more than one device family, safely

    The protocol contract defines two device families. Gemini has hardware-validation evidence. HALO does not.

    The plugin must host both family identifiers but implement only Gemini in v1. It must report a clear unsupported-family message for HALO.

    ### Why this needs real validation, not just a type check

    The vendor does not publish a stable integration contract. A firmware or API update can change fields without notice.

    Strict runtime validation must prevent changed values from becoming plausible but incorrect HomeKit state. Two hazards require explicit checks:

    - **`water_level` means different things per family.** Gemini uses the thermometer code `1/3/7/15/31`; HALO uses a plain ordinal `0-5`. Applying the wrong decoder does not throw -- it produces a plausible-looking, wrong water level. That is the single most safety-relevant value in the system.
    - **Commands differ.** `{desiredData:{test_running:true}}` (Gemini) versus `{desiredData:{pump_state:"test"}}` (HALO). The wrong shape returns `200 {"success":true}` and does nothing.

    Neither mistake announces itself. So validate in three ladders, cheapest first.

    ### The family registry

    ```ts
    export interface DeviceFamily {
      readonly deviceTypeId: string
      readonly displayName: string
      readonly implemented: boolean
      /** Fields that must be present in state.reported.data for this family. */
      readonly requiredFields: readonly string[]
      /** Legal values for water_level; a value outside this set means wrong family. */
      readonly waterLevelDomain: ReadonlySet<number>
      build(platform: Platform, accessory: PlatformAccessory): DeviceHandler
    }

    export const FAMILIES: Record<string, DeviceFamily> = {
      wayneWaterGemini: GeminiFamily,
      wayneWaterHalo:   HaloFamily,     // implemented: false -- a declared stub, not a guess
    }
    ```

    Registering HALO as `implemented: false` is deliberate. An unknown `deviceTypeId` and a known-but-unimplemented one deserve different messages, and only the registry can tell them apart.

    ### Startup validation ladder

    ```ts
    type Verdict =
      | { ok: true; family: DeviceFamily }
      | { ok: false; reason: string; detail: string }

    function validate(device: ApiDevice): Verdict {
      // 1. Declared identity.
      const family = FAMILIES[device.deviceTypeId]
      if (!family) {
        return { ok: false, reason: 'unknown device type',
          detail: `"${device.deviceTypeId}" is not a type this plugin knows about. `
                + 'Please open an issue with this type string.' }
      }
      if (!family.implemented) {
        return { ok: false, reason: 'device type not yet supported',
          detail: `${family.displayName} support is not implemented. This plugin currently `
                + 'supports the Basement Guardian Gemini (dual pump + battery backup) only.' }
      }

      // 2. Payload shape -- catches a vendor schema change on a type we do support.
      const data = device.data ?? {}
      const missing = family.requiredFields.filter(f => !(f in data))
      if (missing.length) {
        return { ok: false, reason: 'unexpected payload shape',
          detail: `expected fields are missing: ${missing.join(', ')}. The vendor API may have `
                + 'changed; refusing to publish possibly-wrong values.' }
      }

      // 3. Value domain -- catches a family mismatch the type string did not.
      if (!family.waterLevelDomain.has(Number(data.water_level))) {
        return { ok: false, reason: 'water_level outside the expected domain',
          detail: `got ${data.water_level}, expected one of `
                + `${[...family.waterLevelDomain].join('/')}. This looks like a different `
                + 'device family than the type string claims.' }
      }

      return { ok: true, family }
    }
    ```

    For Gemini: `waterLevelDomain = new Set([0, 1, 3, 7, 15, 31])`. The value `0` is unvalidated. Only `1` has hardware-validation evidence.

    ### Refusing well

    A refusal must be clear in the log and must not stop the other devices. A new unsupported device remains invisible in HomeKit.

    An existing physical accessory has a different policy. The plugin keeps its HomeKit identity and puts it in a degraded state.

    ```ts
    for (const device of devices) {
      const verdict = validate(device)

      if (!verdict.ok) {
        this.log.warn(
          `Skipping "${device.name}" (${device.deviceId}): ${verdict.reason}.\n  ${verdict.detail}`)

        const cached = this.accessories.find(
          a => a.UUID === this.api.hap.uuid.generate(device.deviceId))
        if (cached) {
          this.log.warn(`  Preserving its HomeKit identity in a degraded state.`)
          this.quarantine(cached, verdict)
        }
        continue          // one bad device must never abort discovery for the others
      }

      this.publish(device, verdict.family)
    }
    ```

    Three properties worth stating explicitly:

    - **`continue`, not `throw`.** An account with a Gemini *and* a HALO must still get a working Gemini. A thrown error inside discovery would leave the platform half-configured.
    - **Quarantine, do not orphan.** A degraded handler preserves cached values, marks services faulty or inactive, and disables commands.
    - **Skip a new unsupported device.** Do not create an accessory from an API profile that the plugin cannot validate.
    - **Only use successful discovery data.** A failed `GET /devices` cannot select an adapter or change accessory state ([§4](#4-accessory-lifecycle)).

    ### Drift after startup is a different problem

    Once an accessory is published, a payload that stops validating should **not** unregister it -- the device is known-good, something is merely wrong right now. Degrade instead:

    | When                                                | Response                                                                                                         |
    | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
    | A new device fails startup validation               | Refuse to publish it and log the reason.                                                                          |
    | A cached device fails startup validation            | Keep the accessory, preserve cached values, mark it degraded, and disable commands.                              |
    | A published device's payload stops validating       | Keep the accessory, set `StatusFault` on every service, keep last-known values, and log once.                    |
    | `deviceTypeId` changes under an existing `deviceId` | Select the supported adapter. If no adapter exists, put the accessory in the degraded state.                     |

    The `deviceId` is `<account-id>_<serial-number>`. A replacement pump has a new serial number and a new accessory identity.

    The `deviceTypeId` selects the API adapter. It does not select the HomeKit accessory identity.

    ### What this buys

    A HALO owner installing this plugin gets one clear log line naming their device type and saying it is not implemented -- and nothing in HomeKit. Not a crashed platform, not an accessory reporting a fabricated water level. When someone with HALO hardware wants to implement it, `HaloFamily` already has a declared shape, a place in the registry, and a protocol field map to verify against.
    DATA_569f7d2c_END

## DATA_4d46c749_START Basement Guardian design research DATA_4d46c749_END
- source: .planning/intel/context.md
- content: |
    DATA_234c548c_START
    This directory contains sanitized design inputs for a Homebridge plugin for the Basement Guardian sump-pump system.

    The documents contain no account-specific identifiers, credentials, raw API responses, network-discovery records, or session logs.

    ## Documents

    | Document | Purpose |
    | --- | --- |
    | [Decision record](decisions.md) | Locked product and architecture decisions, corrections, and release gates. |
    | [Protocol constraints](constraints.md) | Cloud protocol, data models, commands, alert rules, and device-family differences. |
    | [Operational context](context.md) | Timing, credential rotation, state synchronization, command behavior, and liveness. |
    | [HomeKit constraints](constraints.md) | HomeKit services, characteristics, notification adapters, and validation requirements. |
    | [Plugin context](context.md) | Homebridge implementation constraints and ecosystem patterns. |
    | [Architecture context](context.md) | Target component boundaries, data flow, persistence, security, and tests. |

    ## Authority

    `DECISIONS.md` is authoritative for locked product and architecture choices.

    `API.md` and `OPERATIONS.md` define the current protocol contract. The plugin must treat undocumented vendor behavior as changeable.

    `HOMEKIT.md`, `PLUGIN.md`, and `ARCHITECTURE.md` contain implementation guidance. Phase planning can refine details that `DECISIONS.md` does not lock.

    ## Validation status

    The Gemini protocol has hardware-validation evidence for authentication, REST discovery, shadow updates, self-test commands, heartbeat timing, and credential rotation.

    The following items remain release gates:

    - **G-001:** Validate the Gemini alarm-mute acknowledgement, state changes, duration, and failure behavior.
    - **G-002:** Validate every Gemini water-level value and the flood threshold during a natural pump cycle.
    - **G-003:** Validate Apple Activity History for the bridged pump Contact Sensor services.

    HALO remains an unimplemented device family. Its adapter boundary exists so later support is additive.

    ## Publication rules

    Use placeholders for account IDs, device IDs, serial numbers, addresses, tokens, and temporary credentials.

    Do not include raw cloud responses, local-network records, packet captures, session logs, or account data.

    Keep the public Auth0 client ID in the plugin data file. Use a placeholder for that value in documentation and fixtures.
    DATA_234c548c_END
