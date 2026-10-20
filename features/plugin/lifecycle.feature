Feature: Plugin lifecycle

  Homebridge can stop the plugin during a retry, an active request, or an open connection.
  Shutdown releases each, raises no error, and leaves the plugin stopped.
  The scenarios use a local fake cloud in place of the vendor services.

  Background:
    Given the fake cloud
    Given these gemini devices:
      | device id                            | name        |
      | placeholder-account_placeholder-pump | Sump System |

  Scenario: Shutdown during a pending retry raises nothing
    Given the shadow credentials
    Given the broker refuses connections
    When the plugin starts
    Then the log warns once about the degraded path
    When homebridge shuts down
    Then the stopped plugin makes no later shadow connection attempt
    Then the plugin records no unhandled rejection

  Scenario: Shutdown during a request in flight raises nothing
    Given the shadow credentials
    Given the service holds the next request
    When the plugin starts in the background
    Then the fake service holds 1 vendor request
    When homebridge shuts down
    Then the plugin records no unhandled rejection

  Scenario: Shutdown with an open shadow connection releases it
    Given the shadow credentials
    When the plugin starts
    Then the broker holds 1 handshake
    When homebridge shuts down
    Then the broker holds no live connection
    Then the plugin records no unhandled rejection

  Scenario: Shutdown while a reconnect is pending leaves no live connection
    A refused broker that starts accepting again leaves a reconnect imminent, so this covers the
    window where a retry can open a connection after the shutdown began. The other window, where a
    connection opens while the runtime is recording it, is a race inside one function that a
    scenario cannot steer; a unit case covers that one.

    Given the shadow credentials
    Given the broker refuses connections
    When the plugin starts
    Then the log warns once about the degraded path
    When the broker accepts connections
    When homebridge shuts down
    Then the stopped plugin makes no later shadow connection attempt
    Then the broker holds no live connection
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
    Then the stopped plugin makes no later cloud contact
    Then the plugin records no unhandled rejection
