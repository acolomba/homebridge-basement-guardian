Feature: Shadow credential rotation

  The temporary shadow credentials last about an hour. An established connection is not re-signed.
  The plugin refreshes the cache for the next handshake and leaves the live connection alone.
  The following handshake uses the material and client identifier the vendor issued last.

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
    Then the newest handshake carries the rotated credentials
    Then the broker holds the first and the rotated client identifier
