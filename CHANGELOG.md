# Changelog

All notable changes to this project are recorded in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-10-24

- The plugin no longer shows old or failed data as a normal state in several cases that a full code review found. (#23)

  - A second control press while a request waits is refused, and a press that times out stays pending.
  - Older live data no longer replaces newer data for a system that went silent.
  - Backup pump records keep their timestamps across a restart.
  - Systems that left your account are now removed from the Home app.
  - Logs hide more forms of passwords and tokens.

- Development checks now run static analysis in parallel and require isolated coverage for staged source changes.

- If the plugin cannot remove a system that left your account, it now marks that system untrustworthy and reports the error.

- The plugin reports a system it cannot remove right away, then repeats that report every 15 minutes instead of once per poll.

## [0.1.1] - 2026-09-07

- Internal code quality fixes, with no change to plugin behavior.
- The lockfile now agrees with the declared Node.js version range.

## [0.1.0] - 2026-09-05

- Initial release.
- Support for "Gemini" Basement Guardian in HomeKit.
