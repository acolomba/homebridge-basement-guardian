@real @read-only
Feature: Real pump discovery

  The configured real Gemini is discovered through the vendor account within a bounded wait.
  Its initial REST snapshot has a device id; its live shadow supplies state within another bound.
  The suite checks structure without asserting any live measurement (REL-09).

  Scenario: The configured Gemini is discovered within a bounded timeout
    # 30 seconds is long enough for a real Auth0 grant plus one REST inventory round trip, and
    # short enough to fail fast rather than hang a maintainer's terminal.
    When the harness starts
    Then the harness discovers one device within 30 seconds

  Scenario: The discovered device's initial snapshot carries a valid device id
    When the harness starts
    Then the harness discovers one device within 30 seconds
    Then the discovered device snapshot has a valid device id

  Scenario: The discovered device snapshot gains shadow-sourced fields within a bounded timeout
    # 45 seconds, distinct from discovery's 30, because this wait also spans fetching temporary
    # AWS credentials, opening the MQTT connection, and the round trip of the initial shadow "get".
    When the harness starts
    Then the harness discovers one device within 30 seconds
    Then the discovered device snapshot gains shadow-sourced fields within 45 seconds
