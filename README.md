<p align="center">
  <img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150" alt="Homebridge">
</p>

# Homebridge Basement Guardian

[![CI](https://github.com/acolomba/homebridge-basement-guardian/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/acolomba/homebridge-basement-guardian/actions/workflows/build.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=alert_status)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=coverage)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=bugs)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=code_smells)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=sqale_rating)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=reliability_rating)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=security_rating)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![GitHub](https://img.shields.io/badge/GitHub-acolomba%2Fhomebridge--basement--guardian-181717?logo=github&logoColor=white)](https://github.com/acolomba/homebridge-basement-guardian) [![npm](https://img.shields.io/badge/npm-homebridge--basement--guardian-cb3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/homebridge-basement-guardian)

A [Homebridge](https://homebridge.io) plugin to adopt [Wayne Basemenet Guardian](https://basement-guardian.com) sump pumps in Apple HomeKit. Monitor pump activity, battery status, water level, faults from HomeKit.

## Features

Currently only ["Gemini"](https://basement-guardian.com/collections/iot-pumps/products/copy-of-wayne-basement-guardian-system-battery) pumps are supported, but not [Halo](https://basement-guardian.com/collections/iot-pumps/products/halo50).

### Gemini

This plugin publishes these accessories:

- *Sump Pit Flood*: Mapped as leak sensor, it activates at the highest water level the system reports.
- *Sump Pit Level*: Water level in the pit. [\*]
- *Primary Pump Running* and *Backup Pump Running*: Two sensors that follow live pump activity.
- *Primary Pump* and *Backup Pump*: Carry the exact conditions the system reports for each pump. [\*]
- *Sump Mains Power* and *Mains Power Lost*: Report the presence of mains power. [\*]
- *Backup Battery Level* and *Backup Battery*: The battery level is an estimate: the system reports one of four protection bands, and the plugin publishes them as 25, 50, 75, and 100 percent. *Backup Battery* [\*] carries the exact values the system reports.
- *Primary Pump Fault*, *Backup Pump Fault*, *Water Sensor Fault*, *Pump Controller Link Lost*, and *Basement Guardian Offline*: Report system faults.
- *System Self-Test*: A switch to run the system self-test.
- *Alarm Mute*: A switch to mute an audible alarm.

> [!NOTE]
> Marked entries [\*] are visible only in the [Eve](https://www.evehome.com/en-us/eve-app) app.

## Prerequisites

- Node.js 22 or later
- Homebridge 1.8 or 2.x

## Homebridge configuration

Add the platform through the Homebridge UI, or add it directly to `config.json`:

```json
{
  "platform": "BasementGuardian",
  "name": "Basement Guardian",
  "email": "you@example.com",
  "password": "your-account-password"
}
```

### Running as a child bridge

Homebridge can run this plugin as a child bridge, which isolates its crashes, startup delays, and restarts from every other plugin on your Homebridge instance. A child bridge is recommended but not required.

### Removing a notification sensor

The `ignoredFaults` setting removes notification sensors you do not want in your home. It accepts these seven names:

- `backup-pump-running`
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

## Contributing

Read [CONTRIBUTING](CONTRIBUTING.md) and [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md).

## License

The MIT License covers original work in this project. For details, read the [COPYING](COPYING) file.

Two files carried forward from the Homebridge plugin template (`src/index.ts`, `src/settings.ts`) remain licensed under the Apache License 2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE) for the complete boundary and license texts.
