Feature: Shadow connection lifecycle

  The shadow service reports current state rather than replaying what a disconnected plugin missed,
  so the plugin asks for the complete shadow after every connection and lets the poll reconcile
  whatever the connection did not carry.

  Background:
    Given the fake cloud
    Given these gemini devices:
      | deviceId                             | name        |
      | placeholder-account_placeholder-pump | Sump System |
    Given the shadow credentials

  Scenario: The plugin requests the complete shadow on the first connection
    When the plugin starts
    Then the broker holds 1 handshake
    Then the plugin publishes 1 complete shadow request

  Scenario: A reconnect requests the complete shadow again
    When the plugin starts
    Then the plugin publishes 1 complete shadow request
    When the broker closes every connection
    Then the broker holds 2 handshakes
    Then the plugin publishes 2 complete shadow requests

  Scenario: The poll reconciles state the shadow did not carry
    Given a short poll interval
    Given the broker refuses connections
    When the plugin starts
    When the vendor changes these device fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    Then the plugin publishes no complete shadow request
