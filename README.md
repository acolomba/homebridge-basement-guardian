<p align="center">
  <img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150" alt="Homebridge">
</p>

# Homebridge Basement Guardian

A Homebridge dynamic platform plugin for monitoring and protecting basements.

> This plugin is in development and is not released. Some of the values it publishes are estimates, and some are provisional until they are validated against real hardware. The sections that follow name each one.

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

## What the plugin publishes

The plugin publishes one HomeKit accessory for each Basement Guardian system on your account. Every accessory carries these services:

- `Sump Pit Level` reports the water level in the pit, with the raw vendor code beside it.
- `Sump Pit Flood` is a leak sensor. It activates at the highest water level the system reports.
- `Primary Pump` and `Backup Pump` carry the exact conditions the system reports for each pump.
- `Primary Pump Running` and `Backup Pump Activated` are two sensors that follow live pump activity.
- `Sump Mains Power` reports the presence of mains power, with a `Mains Power Lost` sensor beside it.
- `Backup Battery` is a standard battery service. `Backup Battery Facts` carries the exact values the system reports.
- Five sensors report equipment faults: `Primary Pump Fault`, `Backup Pump Fault`, `Water Sensor Fault`, `Pump Controller Link Lost`, and `Basement Guardian Offline`.

The plugin updates these services each time it polls the vendor cloud. It also updates them when the cloud reports a change between two polls. A backup pump run can last as little as 7 seconds. If the message for a short run does not arrive, that run stays unseen until the next poll.

The plugin publishes state to HomeKit. Whether your devices notify you, and how quickly, depends on your home and on Apple rather than on this plugin.

## When the plugin cannot vouch for a value

The plugin never replaces a doubtful value with a normal one. If it cannot vouch for part of what a system reports, it keeps the last value it does trust and marks the affected services inactive.

Most Homebridge plugins substitute a safe default here, such as a not-detected state. This plugin does not. A stale reading shown as a normal one is a false all-clear, which is the failure this plugin exists to prevent.

An inactive service keeps showing its last trusted value. Apple Home shows the inactive state as a `Status Active` row in the accessory details, not on the tile. Controllers such as Eve show it directly.

The network module can lose its link to the pump controller while the vendor cloud still answers normally. The system then still reads as online, but every value that comes through the controller is no longer trustworthy. The plugin marks the water, pump, power, battery, and fault services inactive, activates `Pump Controller Link Lost`, and publishes the time trustworthy controller data last arrived.

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

Those seven names are the only names `ignoredFaults` accepts. Every other service the plugin publishes reports what the system reports, so it cannot be removed. `Sump Pit Flood`, `Sump Pit Level`, `Primary Pump`, `Primary Pump Running`, `Backup Pump`, `Sump Mains Power`, and both backup battery services stay in your home.

## Values that are estimates

Two groups of published numbers are not measurements. The plugin publishes the exact vendor value beside each one, so you can check the mapping yourself.

The backup battery percentage is an estimate. The system reports one of four protection bands, and the plugin publishes them as 25, 50, 75, and 100 percent. This is an estimate of remaining protection, not a measured charge. `Backup Battery Facts` carries the exact values the system reports.

The water level percentages and the flood threshold are provisional. The plugin maps the six water level codes to 0, 20, 40, 60, 80, and 100 percent. Only the code that maps to 20 percent is confirmed against a real pit. Every other step, and the level at which `Sump Pit Flood` activates, stays provisional until validation against a real sump pit is complete. `Sump Pit Level` publishes the raw vendor code beside the percentage.

## Project structure

- [`src/platform.ts`](./src/platform.ts) handles discovery and accessory registration.
- [`src/platformAccessory.ts`](./src/platformAccessory.ts) handles accessory services and characteristics.
- [`config.schema.json`](./config.schema.json) defines the Homebridge UI configuration.

This project is based on the official [Homebridge plugin template](https://github.com/homebridge/homebridge-plugin-template) and should be developed alongside the [Homebridge developer documentation](https://developers.homebridge.io/).

## License

Licensed under the [Apache License 2.0](./LICENSE).
