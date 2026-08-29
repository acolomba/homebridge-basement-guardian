# Changelog

All notable changes to this project are recorded in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- You can sign in with your Basement Guardian account from the Homebridge settings form.
- The plugin keeps the state of each Basement Guardian system current from the vendor cloud.

### Changed

- The published package contains only the compiled plugin, the settings schema, and this changelog.
- The settings form refuses to save an account that is missing the email or the password.
- The plugin refuses to start on a setting outside its documented range instead of substituting a value.

### Removed

- The plugin no longer adds the example light and the two example motion sensors that came from the Homebridge template.

### Security

- The plugin stores your sign-in token inside the Homebridge storage directory, readable only by the account that runs Homebridge.
- Passwords, tokens, and temporary cloud credentials no longer reach the log.
