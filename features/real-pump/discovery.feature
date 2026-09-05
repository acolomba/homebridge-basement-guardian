@real @read-only
Feature: Discovering the real Gemini and its initial state

  The one real Gemini on the configured account is discovered within a bounded timeout, its
  initial REST snapshot carries a valid deviceId, and its snapshot gains shadow-sourced fields
  within its own bounded timeout once the first shadow "get" response arrives. No scenario asserts
  a specific water level, pump state, or other live value: only that state of a valid shape
  arrives (REL-09, D-04).

  Scenario: The configured Gemini is discovered within a bounded timeout
    # 30 seconds is long enough for a real Auth0 grant plus one REST inventory round trip, and
    # short enough to fail fast rather than hang a maintainer's terminal.
    When the harness starts
    Then the harness discovers one device within 30 seconds

  Scenario: The discovered device initial snapshot carries a valid deviceId
    When the harness starts
    Then the harness discovers one device within 30 seconds
    Then the discovered device snapshot has a valid deviceId

  Scenario: The discovered device snapshot gains shadow-sourced fields within a bounded timeout
    # 45 seconds, distinct from discovery's 30, because this wait also spans fetching temporary
    # AWS credentials, opening the MQTT connection, and the round trip of the initial shadow "get".
    When the harness starts
    Then the harness discovers one device within 30 seconds
    Then the discovered device snapshot gains shadow-sourced fields within 45 seconds
