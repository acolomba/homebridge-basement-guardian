@real @read-only
Feature: Restarting and shutting down against the real Gemini

  A Homebridge restart rebuilds the plugin over the storage directory the previous run wrote to.
  The cached Auth0 token survives that rebuild whenever the first grant is still inside its renewal
  margin, so a restart costs no fresh vendor authentication (AUTH-01). A clean shutdown leaves no
  unhandled rejection behind (SYNC-05, REL-09, D-04).

  Scenario: A restart reuses the cached Auth0 token rather than granting a fresh one
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
    Then the harness recorded no unhandled rejection
