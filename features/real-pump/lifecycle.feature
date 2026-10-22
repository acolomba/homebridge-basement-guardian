@real @read-only
Feature: Real pump lifecycle

  Against the configured real account, a restart rebuilds the plugin over the same storage.
  The cached Auth0 token file stays unchanged within its renewal margin (AUTH-01).
  A clean shutdown leaves no unhandled rejection (SYNC-05, REL-09).

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
    When the harness stops within 5 seconds
    Then the harness reports no unhandled rejection for 1 second
