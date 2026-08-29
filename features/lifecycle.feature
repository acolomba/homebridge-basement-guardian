Feature: Starting and shutting down

  Homebridge starts and stops the plugin on its own schedule, so a shutdown can land on a pending
  retry, a request already in flight, or an open connection. Each one releases what it holds and
  raises nothing, and a stopped plugin stays stopped.

  Background:
    Given the fake cloud
    Given these gemini devices:
      | deviceId                             | name        |
      | placeholder-account_placeholder-pump | Sump System |

  Scenario: Shutdown during a pending retry raises nothing
    Given the shadow credentials
    Given the broker refuses connections
    When the plugin starts
    Then the log warns once about the degraded path
    When homebridge shuts down
    Then the plugin records no unhandled rejection

  Scenario: Shutdown during a request in flight raises nothing
    Given the shadow credentials
    Given the service holds the next request
    When the plugin starts in the background
    Then the fake service holds 1 vendor request
    When homebridge shuts down
    Then the plugin records no unhandled rejection

  Scenario: Shutdown with an open shadow connection raises nothing
    Given the shadow credentials
    When the plugin starts
    Then the broker holds 1 handshake
    When homebridge shuts down
    Then the plugin records no unhandled rejection

  Scenario: A second shutdown completes
    Given the shadow credentials
    When the plugin starts
    Then the broker holds 1 handshake
    When homebridge shuts down
    When homebridge shuts down
    Then the plugin records no unhandled rejection

  Scenario: A start after a shutdown performs no work
    Given the shadow credentials
    When the plugin starts
    Then the broker holds 1 handshake
    Then the fake service holds 2 vendor requests
    When homebridge shuts down
    When the plugin starts again
    Then the fake service holds 2 vendor requests
    Then the plugin records no unhandled rejection
