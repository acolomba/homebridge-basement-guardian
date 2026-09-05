<p align="center">
  <img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150" alt="Homebridge">
</p>

# Homebridge Basement Guardian

A Homebridge dynamic platform plugin for monitoring and protecting basements.

> This plugin is in development and is not released. Some of the values it publishes are estimates, and some are provisional until they are validated against real hardware. The sections that follow name each one. Keep your Basement Guardian vendor alarm and vendor notifications enabled while you run a prerelease build -- this plugin does not yet replace them.

## Requirements

- Node.js 22 or later
- Homebridge 1.8 or 2.x

## Development

Install dependencies and verify the project:

```shell
npm install
npm run lint
npm run build
```

Run the complete quality gate--including type checking, linting, code-health analysis, format verification, build, and tests--with:

```shell
npm run check
```

Link the plugin to a local Homebridge installation:

```shell
npm link
homebridge -D
```

For automatic rebuilding and a dedicated development instance, use:

```shell
npm run watch
```

The development instance reads its configuration from [`test/hbConfig/config.json`](./test/hbConfig/config.json).

## Homebridge configuration

Add the platform through the Homebridge UI, or add it directly to `config.json`:

```json
{
  "platform": "BasementGuardian",
  "name": "Basement Guardian"
}
```

Homebridge stores the account password in plain text in `config.json` and in backups. The plugin sends the password only to the vendor Auth0 tenant.

## Running as a child bridge

Homebridge can run this plugin as a child bridge, which isolates its crashes, startup delays, and restarts from every other plugin on your Homebridge instance. A child bridge is recommended but not required.

A child bridge pairs with the Home app separately from your main bridge. Switching a plugin between main and child bridge mode, in either direction, can recreate its accessories in HomeKit. Recreating an accessory disrupts any room, scene, or automation you built around it, so expect to rebuild those if you change bridge mode after your first pairing.

## What the plugin publishes

The plugin publishes one HomeKit accessory for each Basement Guardian system on your account. Every accessory carries these services:

- `Sump Pit Level` reports the water level in the pit, with the raw vendor code beside it.
- `Sump Pit Flood` is a leak sensor. It activates at the highest water level the system reports.
- `Primary Pump` and `Backup Pump` carry the exact conditions the system reports for each pump.
- `Primary Pump Running` and `Backup Pump Activated` are two sensors that follow live pump activity.
- `Sump Mains Power` reports the presence of mains power, with a `Mains Power Lost` sensor beside it.
- `Backup Battery` is a standard battery service. `Backup Battery Facts` carries the exact values the system reports.
- Five sensors report equipment faults: `Primary Pump Fault`, `Backup Pump Fault`, `Water Sensor Fault`, `Pump Controller Link Lost`, and `Basement Guardian Offline`.
- `System Self-Test` is a switch. Press it on to ask the system to run a self-test. The switch follows the test state the system reports.
- `Alarm Mute` is a switch. Press it on to ask the system to mute its audible alarm. The switch follows the mute state the system reports.

The plugin updates these services each time it polls the vendor cloud. It also updates them when the cloud reports a change between two polls. A backup pump run can last as little as 7 seconds. If the message for a short run does not arrive, that run stays unseen until the next poll.

The plugin publishes state to HomeKit. Whether your devices notify you, and how quickly, depends on your home and on Apple rather than on this plugin.

This plugin makes no guarantee that Apple delivers a Critical Alert for the `Sump Pit Flood` Leak Sensor. Whether a Critical Alert reaches you depends on your home hub, your notification settings, and Apple's own Critical Alerts eligibility rules, not on this plugin.

## What the Home app draws a tile for

The Home app draws a tile only for a service type Apple defines. Five of the services above are vendor-defined. Their type identifiers sit outside the range Apple assigns, so the Home app has no tile to draw for them.

The Home app draws a tile for these services:

- `Sump Pit Flood`
- `Primary Pump Running`
- `Backup Pump Activated`
- `Mains Power Lost`
- `Primary Pump Fault`
- `Backup Pump Fault`
- `Water Sensor Fault`
- `Pump Controller Link Lost`
- `Basement Guardian Offline`
- `System Self-Test`
- `Alarm Mute`

The Home app draws no tile for these services:

- `Sump Pit Level`
- `Primary Pump`
- `Backup Pump`
- `Sump Mains Power`
- `Backup Battery Facts`

`Backup Battery` is a standard battery service and is also not a tile. It appears in the accessory details and in the Home app battery list.

The five vendor-defined services still publish every value. You reach them through the accessory details in the Home app. A controller such as Eve shows them directly.

A room that holds only sensors does not appear in the main Home view. You can still select that room from the room list, and the Security summary shows only the sensors that are triggered at that moment. `System Self-Test` is a switch, so it makes the room appear. Keep the switch even if you never press it.

## The two controls

`System Self-Test` and `Alarm Mute` are the only two things this plugin can ask a system to do. Both are official commands of the vendor. The plugin sends one request and waits up to 2.5 seconds for the vendor cloud to accept it. It never sends the request again by itself, because a request that timed out can already have reached the system.

The switch follows what the system reports, not what you asked for. After the vendor accepts a request, the plugin holds the switch at the value you pressed for up to 30 seconds. If the system does not confirm the change in that time, the switch returns to the reported state and the log says so. A self-test started from the vendor application or from an automatic schedule moves the same switch.

The plugin refuses a press and sends nothing in these cases:

- You press the switch off. The system owns when a self-test stops, and the vendor exposes no cancel command and no unmute command.
- The plugin has no fresh state for that control. It cannot tell a running self-test from an idle system, so it does not act on a guess.
- The plugin has confirmed that the system is offline.
- The control already reads on. A second request would run a real pump that the vendor application would have refused.

The plugin does not refuse a self-test while the system reports an equipment fault. The vendor application permits one, and that self-test is the one you run to examine a suspect pump. A self-test runs the backup pump for about 16 seconds, and the system reports when it ends.

The behavior of `Alarm Mute` is provisional. Nobody has yet observed a real system answer a mute request, so four things stay unconfirmed until validation against real hardware is complete: the acknowledgement itself, how long the reported state takes to change, how long the mute lasts, and what the system does when the request fails.

## When the plugin cannot vouch for a value

The plugin never replaces a doubtful value with a normal one. If it cannot vouch for part of what a system reports, it keeps the last value it does trust and marks the affected services inactive.

Most Homebridge plugins substitute a safe default here, such as a not-detected state. This plugin does not. A stale reading shown as a normal one is a false all-clear, which is the failure this plugin exists to prevent.

An inactive service keeps showing its last trusted value. Apple Home shows the inactive state as a `Status Active` row in the accessory details, not on the tile. Controllers such as Eve show it directly.

The network module can lose its link to the pump controller while the vendor cloud still answers normally. The system then still reads as online, but every value that comes through the controller is no longer trustworthy. The plugin marks the water, pump, power, battery, and fault services inactive. It marks both control switches inactive too. It activates `Pump Controller Link Lost` and publishes the time trustworthy controller data last arrived.

The plugin can also lose its own view of a system while the system itself is fine. It watches in two ways. It polls the vendor cloud for a snapshot. It also holds an open connection that carries live changes as they happen. When one of these stops working, the plugin marks the services it can no longer vouch for and keeps their last values.

This is not the same as `Basement Guardian Offline` or `Pump Controller Link Lost`. Those two report something the system says about itself: the vendor confirmed the system is offline, or the network module lost its link to the pump controller. A lost monitoring path reports something about the plugin. The equipment can work perfectly while the plugin no longer sees it.

The live connection is the one that matters most. The vendor cloud can still answer polls while that connection goes quiet. Every tile then reads normally, but a pump run lasts 7 to 15 seconds and can start and finish between two polls. The plugin never sees that run. When the live connection goes quiet, the plugin marks the water, pump, power, battery, and fault services inactive, and both control switches with them. `Basement Guardian Offline` stays trusted, because polling still supplies that one answer.

If polling fails while the live connection still delivers, the plugin marks `Basement Guardian Offline` inactive and nothing else. Polls are the only source of that verdict, and the live values keep arriving.

The plugin looks for a silent connection each time it polls. A report is never faster than your poll interval. The system sends a message about every 898 seconds, so a short quiet gap is normal. `pollInterval` accepts 300 to 3600 seconds, and the default is 900. At 3600 seconds a lost live connection can go unreported for up to an hour. A lower poll interval shortens that delay.

The delay is to the report and to the reading. While the live connection still owns the readings, a poll does not replace them. The tile shows the last reading that connection sent, and the affected services still say the plugin vouches for them. Two missed heartbeats end the ownership, and polling takes the readings back. From then on each successful poll updates the tile. If a poll finds a flooded pit, `Sump Pit Flood` reports it, and the trust row alone carries the doubt. The plugin ends the ownership one system at a time, so a quiet system does not take another system's readings away. The marking is also one system at a time. While one system is quiet, the plugin stops vouching for that system alone. A system that still reports goes on vouching for its own services.

A restart shows the same rule from a cold start. Homebridge keeps its own copy of each accessory, so your rooms, automations, and scenes come back at once. The plugin marks every restored service inactive before its first poll, and it changes nothing else. Each accessory is in place. It shows the reading the last run left on it, and it is marked. If the cloud is unreachable, the accessories stay that way until a poll succeeds.

One failure is different from every other one here. If the vendor refuses your account email or password, the plugin stops and never tries again on its own. A vendor block of this kind lifts only 30 days after the last attempt, so each retry postpones it. The refusal has the same effect whenever it arrives, at the first sign-in or during a run. The plugin also closes the connection that carries live changes, so your system cannot send it anything more.

Every service that reports whether the plugin vouches for it then stops answering. Apple Home shows the whole accessory as `No Response`, not the inactive state the other failures use. Each service keeps the value it last published, and a controller that reads one of those values directly still gets it. This state does not clear itself. The log names what happened. You must correct the email and the password in the Homebridge settings and then restart the plugin.

## Removing a notification sensor

The `ignoredFaults` setting removes notification sensors you do not want in your home. It accepts these seven names:

- `backup-pump-activated`
- `mains-power-lost`
- `primary-pump-fault`
- `backup-pump-fault`
- `water-sensor-fault`
- `pump-controller-link-lost`
- `basement-guardian-offline`

Add a name to remove that one sensor:

```json
{
  "platform": "BasementGuardian",
  "name": "Basement Guardian",
  "ignoredFaults": ["basement-guardian-offline"]
}
```

CAUTION: Removing a sensor also removes whatever you attached to it in your home. Its automations, its scenes, and its Activity History go with it. Apple Home does not move them to another service.

A removed sensor is the only thing you lose. The plugin still reads the condition and still uses it. How much of the condition stays visible depends on which sensor you remove.

Five of the seven conditions stay on the service that owns them:

- `primary-pump-fault` stays on `Primary Pump`, as `Pump Fault` and `Status Fault`.
- `backup-pump-fault` stays on `Backup Pump`, as `Pump Fault`, `Pump Fuse Blown`, and `Status Fault`.
- `water-sensor-fault` stays on `Sump Pit Level`, as `Water Sensor Fault Reported` and `Status Fault`.
- `mains-power-lost` stays on `Sump Mains Power`, as `Mains Power Present`. That service reports no `Status Fault`, because a mains loss is a condition the system reports and not a fault of the service.
- `backup-pump-activated` stays on `Backup Pump`, as `Pump Running`.

Two do not:

- `pump-controller-link-lost` is the only service that reports the controller link state. The plugin also writes that condition to the log, so you keep a record of it.
- `basement-guardian-offline` is the only service that reports a confirmed offline system, and the plugin writes nothing about it to the log. Remove it and you lose that signal completely.

CAUTION: If `ignoredFaults` holds a name the plugin does not publish, or holds the same name twice, the plugin refuses the configuration and does not start. The log names the entry that is wrong and lists all seven valid names. A typo therefore leaves your pump unmonitored until you correct it.

Those seven names are the only names `ignoredFaults` accepts. Every other service either reports what the system reports or carries an official control, so you cannot remove it. `Sump Pit Flood`, `Sump Pit Level`, `Primary Pump`, `Primary Pump Running`, `Backup Pump`, `Sump Mains Power`, both backup battery services, `System Self-Test`, and `Alarm Mute` stay in your home.

## What the activation record counts

`Primary Pump` and `Backup Pump` each carry a record of what this plugin watched. `Observation Start` is the time the plugin first observed that pump. `Activations Observed Since Observation Start` counts the runs it saw after that time. `Last Observed Activation At` is when it saw the most recent one.

The count is not a figure the system reports about its own life. The system publishes no such total. The count holds the runs this plugin watched, and nothing else.

If the plugin stops, or the vendor cloud stops answering, the pump keeps running and the plugin does not see it. The record does not fill that gap afterward. The count and the last-activation time both stay where the outage left them.

The two counts are not built the same way:

- The primary count holds only the runs the plugin watched live. The system reports no timestamp for the primary pump, so a missed primary run is lost.
- The backup count holds the runs the plugin watched live plus runs it recovered afterward. The system reports the time of the last backup run. When that time moves past the last one the plugin recorded, the plugin adds exactly one run.

A recovered timestamp proves that at least one run happened. It does not prove how many. Neither count is a lifetime total for the pump.

A backup pump run lasts about 7 to 15 seconds. The plugin polls the vendor cloud about every 15 minutes by default. A run that starts and ends between two polls is invisible to polling. The vendor cloud also pushes a change as it happens, and that live push is what makes a count of primary runs possible at all.

On a fresh install the plugin does not count a run from before it started to watch. The first backup timestamp it sees becomes the starting point rather than an activation. `Observation Start` records that moment.

The plugin publishes no measure of how complete a count is. A count of 4 does not tell you whether the plugin watched for a day or for a year without a break. `Observation Start` tells you when the record began, and nothing tells you how much of the time since then the plugin was watching.

`Backup Pump` also carries `Last Activation Was Self-Test`. A self-test runs the backup pump, so a self-test run is in the count like any other run. This value records whether the last run was a self-test. `Primary Pump` does not carry it, because the system reports no timestamp that can classify a primary run.

## Apple's Activity History

Apple Home keeps its own Activity History for eligible accessories, including contact sensors. Apple documents up to 30 days. It needs a supported home hub and the current Home architecture. See Apple's [Activity History requirements](https://support.apple.com/en-gb/105011).

Activity History belongs to your controller, not to this plugin. The plugin cannot give it a retention setting. The plugin cannot put a missed event into it afterward. If the plugin did not see a pump run, no history shows that run.

Activity History is not how this plugin delivers safety state. The plugin publishes state to HomeKit. Whether your devices notify you, and how quickly, depends on your home and on Apple rather than on this plugin.

## Values that are estimates

Two groups of published numbers are not measurements. The plugin publishes the exact vendor value beside each one, so you can check the mapping yourself.

The backup battery percentage is an estimate. The system reports one of four protection bands, and the plugin publishes them as 25, 50, 75, and 100 percent. This is an estimate of remaining protection, not a measured charge. `Backup Battery Facts` carries the exact values the system reports.

The water level percentages and the flood threshold are provisional. The plugin maps the six water level codes to 0, 20, 40, 60, 80, and 100 percent. Only the code that maps to 20 percent is confirmed against a real pit. Every other step, and the level at which `Sump Pit Flood` activates, stays provisional until validation against a real sump pit is complete. `Sump Pit Level` publishes the raw vendor code beside the percentage.

## Project structure

- [`src/platform.ts`](./src/platform.ts) handles discovery and accessory registration.
- [`src/accessories/basementGuardian.ts`](./src/accessories/basementGuardian.ts) handles accessory services and characteristics.
- [`config.schema.json`](./config.schema.json) defines the Homebridge UI configuration.

This project is based on the official [Homebridge plugin template](https://github.com/homebridge/homebridge-plugin-template) and should be developed alongside the [Homebridge developer documentation](https://developers.homebridge.io/).

## License

Original work is licensed under the MIT License; two files carried forward from the Homebridge plugin template (`src/index.ts`, `src/settings.ts`) remain licensed under the Apache License 2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE) for the complete boundary and license texts.
