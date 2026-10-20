Feature: Pump records

  The plugin counts observed pump runs and publishes when observation began (CTRL-01, D-020).
  It skips runs active at startup and recovers missed backup runs once at device time (D-009 to D-011).
  The scenarios use a local fake cloud in place of vendor services.

  Background:
    Given the fake cloud
    Given a short poll interval
    Given these devices:
      | device id          | name          |
      | placeholder-gemini | Sump Guardian |

  Scenario: The observation record comes back after a restart with its count and its start
    When the plugin starts
    Then the plugin publishes the "Backup Pump" service
    Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "0"
    When the vendor changes these device fields:
      | backup_pump_running | true |
    Then the "Backup Pump Running" sensor is activated
    Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "1"
    When the scenario reads "Observation Start" on the "Backup Pump" service
    When the scenario reads "Last Observed Activation At" on the "Backup Pump" service
    When the scenario clock moves forward
    When the plugin restarts
    Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "1"
    Then the "Backup Pump" service reports "Observation Start" as the value the scenario read
    Then the "Backup Pump" service reports "Last Observed Activation At" as the value the scenario read

  Scenario: The observation record does not count a backup run already under way at a fresh start
    When the vendor changes these device fields:
      | backup_pump_running | true |
    When the plugin starts
    Then the "Backup Pump Running" sensor is activated
    Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "0"

  # The two instants below are the device's own, and they are years before the scenario clock. A
  # record that stored the moment the plugin heard about the run would publish 2026 here.
  Scenario: The observation record recovers a missed activation at the device's own time
    When the plugin starts
    Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "0"
    When the vendor changes these device fields:
      | backup_pump_timestamp | 1700000000 |
    Then the canonical snapshot carries these fields:
      | backup_pump_timestamp | 1700000000 |
    Then the "Backup Pump" service reports "Last Observed Activation At" as ""
    Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "0"
    When the vendor changes these device fields:
      | backup_pump_timestamp | 1700003600 |
    Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "1"
    Then the "Backup Pump" service reports "Last Observed Activation At" as "2023-11-14T23:13:20.000Z"

  Scenario: The observation record does not count a repeated device activation timestamp
    When the plugin starts
    When the vendor changes these device fields:
      | backup_pump_timestamp | 1700000000 |
    Then the canonical snapshot carries these fields:
      | backup_pump_timestamp | 1700000000 |
    When the vendor changes these device fields:
      | backup_pump_timestamp | 1700003600 |
    Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "1"
    When the plugin completes another vendor poll
    Then the "Backup Pump" service reports "Activations Observed Since Observation Start" as "1"
    Then the "Backup Pump" service reports "Last Observed Activation At" as "2023-11-14T23:13:20.000Z"
