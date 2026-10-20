Feature: Shadow credential rotation

  Temporary shadow credentials last about an hour, while a live connection keeps its handshake.
  A fake cloud and broker show that rotation refreshes the next handshake's key, token, and client
  identifier without replacing the live connection.

  Background:
    Given the fake cloud
    Given a short rotation interval
    Given these gemini devices:
      | device id                            | name        |
      | placeholder-account_placeholder-pump | Sump System |
    Given the shadow credentials

  Scenario: A rotation refreshes the next handshake and leaves the live one alone
    When the plugin starts
    Then the broker holds 1 handshake
    When the vendor issues the rotated shadow credentials
    When the credentials rotate
    Then the broker holds 1 handshake
    When the device publishes these heartbeat fields:
      | water_level | 2 |
    Then the canonical snapshot carries these fields:
      | water_level | 2 |
    When the broker closes every connection
    Then the broker holds 2 handshakes
    Then the newest handshake carries the rotated key and token
    Then the broker holds the first and the rotated client identifier
