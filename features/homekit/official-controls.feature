Feature: HomeKit official controls

  A controller's self-test and alarm mute presses reach the vendor once with the measured commands.
  The switches follow device reports through acceptance, refusal, and timeout.
  The scenarios use a fake vendor and do not assume a real device confirms alarm mute.

  Background:
    Given the fake cloud
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |

  Scenario: A press of the self-test switch reaches the vendor and the device's report leaves it on
    Given a short poll interval
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Then the "System Self-Test" service reports "On" as "false"
    When a controller turns on the "System Self-Test" switch
    Then the vendor receives 1 self-test command
    Then the "System Self-Test" switch reads on
    When the vendor changes these device fields:
      | test_running | true |
    Then the canonical snapshot carries these fields:
      | test_running | true |
    Then the "System Self-Test" service reports "On" as "true"
    When the vendor changes these device fields:
      | test_running | false |
    Then the "System Self-Test" service reports "On" as "false"

  Scenario: A self-test started outside HomeKit turns the switch on with no command behind it
    Given a short poll interval
    When the plugin starts
    Then the "System Self-Test" service reports "On" as "false"
    When the vendor changes these device fields:
      | test_running | true |
    Then the "System Self-Test" service reports "On" as "true"
    Then the vendor receives no command

  # No short poll interval here. The next poll is fifteen minutes away, so the only thing that can
  # return the switch to reported state inside the scenario is the closing window itself.
  Scenario: A self-test the device never confirms returns the switch to what the device reports
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    When a controller turns on the "System Self-Test" switch
    Then the vendor receives 1 self-test command
    Then the "System Self-Test" switch reads on
    When the scenario clock moves past the control pending window
    Then the "System Self-Test" service reports "On" as "false"
    Then the vendor receives 1 self-test command

  # The device reacting to a command it accepted. It reports the test on the accepted-update topic,
  # which is where it reports everything else, and the switch follows that report.
  Scenario: An accepted self-test makes the device report the test running
    Given the shadow credentials
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Then the plugin publishes 1 complete shadow request
    When a controller turns on the "System Self-Test" switch
    Then the vendor receives 1 self-test command
    Then the canonical snapshot carries these fields:
      | test_running | true |
    Then the canonical snapshot is at shadow version 1
    Then the "System Self-Test" service reports "On" as "true"

  # No short poll interval: the clearing push is the only thing that can return the switch to a
  # readable state inside the scenario, so a push that never happened fails the read.
  Scenario: A self-test the vendor refuses returns the switch to what the device reports
    Given the shadow credentials
    Given the vendor refuses the next command
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Then the plugin publishes 1 complete shadow request
    When a controller presses the "System Self-Test" switch
    Then the vendor receives 1 self-test command
    Then the write reports a communication failure
    When the scenario clock does not move
    Then the "System Self-Test" switch answers a read
    Then the "System Self-Test" service reports "On" as "false"
    Then the canonical snapshot carries no shadow version

  Scenario: A self-test answered with an unsuccessful body is refused the same way
    Given the shadow credentials
    Given the vendor answers the next command unsuccessfully
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Then the plugin publishes 1 complete shadow request
    When a controller presses the "System Self-Test" switch
    Then the vendor receives 1 self-test command
    Then the write reports a communication failure
    When the scenario clock does not move
    Then the "System Self-Test" switch answers a read
    Then the "System Self-Test" service reports "On" as "false"
    Then the canonical snapshot carries no shadow version

  # A short poll interval here on purpose: the held command must not capture the inventory poll. The
  # water level changing after the press proves a later inventory request was answered while the one
  # command request sat unanswered.
  Scenario: A self-test the vendor never answers times out and is not retried
    Given a short poll interval
    Given the shadow credentials
    Given the vendor never answers the next command
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Then the plugin publishes 1 complete shadow request
    When a controller presses the "System Self-Test" switch
    Then the write reports a timeout
    Then the vendor receives 1 self-test command
    Then the canonical snapshot carries no shadow version
    When the vendor changes these device fields:
      | water_level | 15 |
    Then the "Sump Pit Level" service reports "Raw Water Level Code" as "15"
    Then the vendor receives 1 self-test command

  Scenario: An armed refusal applies to one command and the next press reaches the vendor
    Given the shadow credentials
    Given the vendor refuses the next command
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Then the plugin publishes 1 complete shadow request
    When a controller presses the "System Self-Test" switch
    Then the write reports a communication failure
    When the scenario clock does not move
    When a controller turns on the "System Self-Test" switch
    Then the vendor receives 2 self-test commands
    Then the canonical snapshot carries these fields:
      | test_running | true |
    Then the canonical snapshot is at shadow version 1

  # No short poll interval: after the window closes only the device's own late report can turn the
  # switch back on.
  Scenario: A self-test report that arrives after the window closed still turns the switch on
    Given the shadow credentials
    Given the vendor accepts the next command with no device report
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Then the plugin publishes 1 complete shadow request
    When a controller turns on the "System Self-Test" switch
    Then the "System Self-Test" switch reads on
    When the scenario clock moves past the control pending window
    Then the log warns once that the device never confirmed the "self-test" request
    Then the "System Self-Test" service reports "On" as "false"
    When the device reports these fields:
      | test_running | true |
    Then the "System Self-Test" service reports "On" as "true"
    Then the vendor receives 1 self-test command

  Scenario: A press of the alarm mute switch sends only the measured mute body
    When the plugin starts
    Then the plugin publishes the "Alarm Mute" service
    Then the "Alarm Mute" service reports "On" as "false"
    When a controller turns on the "Alarm Mute" switch
    Then the vendor receives 1 alarm mute command

  Scenario: An off write while mute is active reaches no vendor command
    Given these reported device fields:
      | alarm_audio_muted | true |
    When the plugin starts
    Then the "Alarm Mute" service reports "On" as "true"
    When a controller turns off the "Alarm Mute" switch
    Then the write reports that the control is not allowed now
    Then the vendor receives no command
    When the scenario clock does not move
    Then the "Alarm Mute" switch answers a read
    Then the "Alarm Mute" service reports "On" as "true"

  # The live connection stays available, but the self-test field no longer validates. The plugin
  # cannot use the previous value to decide whether another test is safe to start.
  Scenario: A press with no valid state is refused locally
    Given a short poll interval
    Given the shadow credentials
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Then the plugin publishes 1 complete shadow request
    When the vendor changes these device fields:
      | test_running | 12 |
    Then the "System Self-Test" service reports "Status Active" as "false"
    When a controller presses the "System Self-Test" switch
    Then the write reports that the control is not allowed now
    Then the vendor receives no command
    Then the log warns once that the "self-test" press was refused because "the plugin has no fresh state for it"

  # The live-confirmation half, and the one an owner is most likely to meet. Polling is healthy here,
  # so the pit reading on the tile is real and arrived seconds ago; what the plugin lost is the fast
  # channel the device answers a command on. Telling the owner the plugin has no state for the pump
  # would send them to look at equipment that is fine, which this plugin treats as worse than saying
  # nothing, so the refusal names the connection that actually went quiet (RES-04, D-07, D-08, WR-02).
  Scenario: A press while the live connection is quiet names the quiet connection
    Given a short poll interval
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    When the scenario clock moves forward by 1796 seconds
    Then the "System Self-Test" service reports "Status Active" as "false"
    When a controller presses the "System Self-Test" switch
    Then the write reports that the control is not allowed now
    Then the vendor receives no command
    Then the log warns once that the "self-test" press was refused because "the live connection is quiet, so the plugin cannot see the device confirm the command"

  # The transport half, which fails on its own schedule. A command travels on the polling transport,
  # so a poll that has just failed means the plugin has no proven way to send and refuses the press
  # here rather than buying a round trip that ends as a vendor error (RES-04, D-07).
  Scenario: A press with no command transport is refused locally
    Given a short poll interval
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    When the vendor starts failing every request with status 503
    Then the monitoring path is "unavailable"
    When a controller presses the "System Self-Test" switch
    Then the write reports that the control is not allowed now
    Then the vendor receives no command
