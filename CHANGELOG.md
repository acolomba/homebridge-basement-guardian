# Changelog

All notable changes to this project are recorded in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- You can sign in with your Basement Guardian account from the Homebridge settings form.
- The plugin keeps the state of each Basement Guardian system current from the vendor cloud.
- Each Basement Guardian system now appears in HomeKit as one accessory carrying the pit level, both pumps, mains power, the battery, and the fault sensors.
- The new `ignoredFaults` setting removes a notification sensor you do not want. The flood sensor and the battery service cannot be removed.
- The plugin now updates HomeKit when the vendor cloud reports a change between polls, instead of waiting for the next poll.

### Changed

- The published package contains only the compiled plugin, the settings schema, and this changelog.
- The settings form refuses to save an account that is missing the email or the password.
- The plugin refuses to start on a setting outside its documented range instead of substituting a value.
- The plugin refuses to start when `ignoredFaults` names a sensor it does not publish, and the log lists every valid name.
- When the plugin cannot vouch for part of what a system reports, it marks the affected services inactive and keeps their last trusted value. It never substitutes a normal reading.

### Removed

- The plugin no longer adds the example light and the two example motion sensors that came from the Homebridge template.

### Security

- The plugin stores your sign-in token inside the Homebridge storage directory, readable only by the account that runs Homebridge.
- Passwords, tokens, and temporary cloud credentials no longer reach the log.
