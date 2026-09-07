Feature: Credential rotation

  The temporary credentials the shadow connection signs with last about an hour, and nothing
  re-signs a connection that is already established. The plugin refreshes the cache the next
  handshake reads, leaves the live connection alone, and signs the following handshake with the
  material and the client identifier the vendor issued last.

  Background:
    Given the fake cloud
    Given a short rotation interval
    Given these gemini devices:
      | deviceId                             | name        |
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
