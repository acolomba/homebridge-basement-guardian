@real @read-only
Feature: Real pump lifecycle

  A Homebridge restart rebuilds the plugin over the storage directory the previous run wrote to.
  The cached Auth0 token file remains unchanged through that restart while the first grant is
  within its renewal margin (AUTH-01). A clean shutdown leaves no
  unhandled rejection behind (SYNC-05, REL-09, D-04).

  Scenario: A restart keeps the cached Auth0 token unchanged
    When the harness starts
    Then the harness discovers one device within 30 seconds
    When the harness remembers the token cache fingerprint as "before the restart" within 10 seconds
    When the harness restarts
    Then the harness discovers one device within 30 seconds
    Then the token cache fingerprint matches "before the restart"

  Scenario: A clean shutdown records no unhandled rejection
    When the harness starts
    Then the harness discovers one device within 30 seconds
    When the harness stops
    Then the harness reports no unhandled rejection
