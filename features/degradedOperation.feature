Feature: Degraded monitoring

  A shadow connection the plugin cannot open costs latency, not correctness: the poll is already the
  reconciliation backstop. The plugin stays up, says once that it is seeing less, and says once more
  when the connection returns.

  Background:
    Given the fake cloud
    Given these gemini devices:
      | deviceId                             | name        |
      | placeholder-account_placeholder-pump | Sump System |
    Given the shadow credentials

  Scenario: The plugin keeps polling while the shadow connection is unavailable
    Given a short poll interval
    Given the broker refuses connections
    When the plugin starts
    Then the monitoring path is "poll-only"
    Then the log warns once about the degraded path
    When the vendor changes these device fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |

  Scenario: The combined path returns when the connection recovers
    Given the broker refuses connections
    When the plugin starts
    Then the log warns once about the degraded path
    Then the monitoring path is "poll-only"
    When the broker accepts connections
    Then the monitoring path is "shadow-and-poll"
    Then the log announces the recovery once

  Scenario: Shadow silence withdraws trust while polling continues
    A shadow that stops speaking costs more than a shadow that never opened. Polls keep arriving, so
    every tile still reads normal, while a pump run lasting seconds begins and ends between two of
    them and is never seen at all. The plugin therefore stops vouching for what it can no longer
    watch, and keeps vouching for the one verdict polling still sources.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the "Sump Pit Flood" sensor is not activated
    Then the "Basement Guardian Offline" service reports "Status Active" as "true"
    Then the "Basement Guardian Offline" sensor is not activated

  Scenario: Polling failure alone leaves the live values trustworthy
    Live pushes still arrive while the poll fails, so the readings a user watches are current and
    only the verdict the poll alone sources goes unfed. The plugin withdraws that one verdict and
    keeps vouching for everything the live connection is still carrying.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Basement Guardian Offline" service reports "Status Active" as "true"
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    Given the service fails every request with status 503
    Then the "Basement Guardian Offline" service reports "Status Active" as "false"
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Then the "Basement Guardian Offline" sensor is not activated

  Scenario: Both monitoring paths lost withdraws every scope
    Neither transport is carrying anything, so the plugin can vouch for nothing at all. Every value
    it last saw stays exactly where it is, and every service says it is no longer current.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Given the service fails every request with status 503
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the "Basement Guardian Offline" service reports "Status Active" as "false"
    Then the "Sump Pit Flood" sensor is not activated
    Then the "Basement Guardian Offline" sensor is not activated

  Scenario: A successful poll does not clear the shadow silence
    Shadow silence is the case where the poll keeps working while live signals go unobserved, so a
    poll that succeeds restores trust the plugin has not earned. Recovery is matched to cause.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the plugin polls the vendor at least 8 times
    Then the "Sump Pit Flood" service reports "Status Active" as "false"

  Scenario: An identical heartbeat clears the shadow silence
    The canonical store notifies nobody when no telemetry value moved, which is what keeps a
    repeated heartbeat quiet. A recovery driven from a snapshot listener would therefore never fire,
    and a scenario publishing a changed field would pass against that defect. This one republishes
    the value the device already reported.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
