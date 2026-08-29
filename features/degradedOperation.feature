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
    Then the monitoring path is "rest-only"
    Then the log warns once about the degraded path
    When the vendor changes these device fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |

  Scenario: The combined path returns when the connection recovers
    Given the broker refuses connections
    When the plugin starts
    Then the log warns once about the degraded path
    Then the monitoring path is "rest-only"
    When the broker accepts connections
    Then the monitoring path is "rest-and-shadow"
    Then the log announces the recovery once
