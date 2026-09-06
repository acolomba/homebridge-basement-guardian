<p align="center">
  <img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150" alt="Homebridge">
</p>

# Homebridge Basement Guardian

[![CI](https://github.com/acolomba/homebridge-basement-guardian/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/acolomba/homebridge-basement-guardian/actions/workflows/build.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=alert_status)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=coverage)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=bugs)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=code_smells)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=sqale_rating)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=reliability_rating)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=acolomba_homebridge-basement-guardian&metric=security_rating)](https://sonarcloud.io/summary/overall?id=acolomba_homebridge-basement-guardian) [![GitHub](https://img.shields.io/badge/GitHub-acolomba%2Fhomebridge--basement--guardian-181717?logo=github&logoColor=white)](https://github.com/acolomba/homebridge-basement-guardian) [![npm](https://img.shields.io/badge/npm-homebridge--basement--guardian-cb3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/homebridge-basement-guardian)

A [Homebridge](https://homebridge.io) plugin that brings [Wayne Basement Guardian](https://basement-guardian.com) sump pumps into Apple HomeKit. It monitors pump activity, battery status, water level, and faults.

## Features

This plugin supports only ["Gemini"](https://basement-guardian.com/collections/iot-pumps/products/copy-of-wayne-basement-guardian-system-battery) pumps. It does not support [Halo](https://basement-guardian.com/collections/iot-pumps/products/halo50).

### Gemini

This plugin publishes these accessories:

- **Sump Pit Flood**: Mapped as a leak sensor, it activates at the highest water level the system reports.
- **Sump Pit Level**: The water level in the pit. [^1]
- **Primary Pump Running** and **Backup Pump Running**: Two sensors that follow live pump activity.
- **Primary Pump** and **Backup Pump**: These carry the exact conditions the system reports for each pump. [^1]
- **Sump Mains Power** and **Mains Power Lost**: These report the presence of mains power. [^1]
- **Backup Battery Level** and **Backup Battery**: The battery level is an estimate. The system reports one of four protection bands, and the plugin publishes them as 25, 50, 75, and 100 percent. **Backup Battery** [^1] carries the exact values the system reports.
- **Primary Pump Fault**, **Backup Pump Fault**, **Water Sensor Fault**, **Pump Controller Link Lost**, and **Basement Guardian Offline**: These report system faults.
- **System Self-Test**: A switch that starts the self-test.
- **Alarm Mute**: A switch to mute an audible alarm.

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

Homebridge can run this plugin as a child bridge, which isolates its crashes, startup delays, and restarts from every other plugin on your Homebridge instance. We recommend a child bridge, but it is not required.

The Homebridge UI can turn on child bridge mode for you. If you edit `config.json` by hand instead, add a `_bridge` entry with a unique `username` and `port`:

```json
{
  "platform": "BasementGuardian",
  "name": "Basement Guardian",
  "email": "you@example.com",
  "password": "your-account-password",
  "_bridge": {
    "username": "0E:83:FD:29:58:C9",
    "port": 55197
  }
}
```

Both values must differ from your main bridge's and from any other child bridge's.

### Removing a notification sensor

The `ignoredFaults` entry removes notification sensors you do not want in your home. It accepts these names:

- `backup-pump-fault`
- `backup-pump-running`
- `basement-guardian-offline`
- `mains-power-lost`
- `primary-pump-fault`
- `pump-controller-link-lost`
- `water-sensor-fault`

Add a name to remove that one sensor:

```json
{
  "platform": "BasementGuardian",
  "name": "Basement Guardian",
  "email": "you@example.com",
  "password": "your-account-password",
  "ignoredFaults": ["backup-pump-running"]
}
```

> [!CAUTION]
> If you remove a sensor, you also remove whatever you attached to it in your home. Its automations, its scenes, and its Activity History go with it. Apple Home does not move them to another service.

A removed sensor is the only thing you lose. The plugin still reads and uses the condition. Which sensor you remove decides how much of the condition stays visible.

## Contributing

Read [CONTRIBUTING](CONTRIBUTING.md) and [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md).

## License

The MIT License covers original work in this project. For details, read the [COPYING](COPYING) file.

Two files carried forward from the Homebridge plugin template (`src/index.ts`, `src/settings.ts`) remain licensed under the Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for the complete boundary and license texts.

[^1]: Only available in the [Eve](https://www.evehome.com/en-us/eve-app) app.
