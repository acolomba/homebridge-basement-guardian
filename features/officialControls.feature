Feature: Operating the official controls from HomeKit

  A controller can press System Self-Test, and the press reaches the vendor exactly once. The
  device's own report is what leaves the switch on: the plugin publishes what the system says it is
  doing, never what somebody asked it to do (CTRL-03, CTRL-05, D-037).

  Every way a command can end is here. A refused one and a resolved one carrying an unsuccessful
  body both return the switch to what the device reports and leave it readable (D-04). A command the
  vendor never answers reaches the device once and is never retried, because a command that outlived
  its deadline may already have operated a real pump (D-038). A report that arrives after the window
  closed is followed on its own merits (D-06).

  Alarm Mute sends only the measured body and nothing else. Nobody has watched a real system
  acknowledge a mute, so no scenario here states what the device does after one (CTRL-04, D-019).

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
    When the vendor changes these device fields:
      | alarm_audio_muted | true |
    When the plugin starts
    Then the "Alarm Mute" service reports "On" as "true"
    When a controller turns off the "Alarm Mute" switch
    Then the write reports that the control is not allowed now
    Then the vendor receives no command
    When the scenario clock does not move
    Then the "Alarm Mute" switch answers a read
    Then the "Alarm Mute" service reports "On" as "true"

  # The state half of the command gate. It fires from the account-wide trust withdrawal rather than
  # from a rule of its own: once the control's own scope is untrusted the row withholds the reported
  # value, and the existing no-fresh-state rule refuses the press (D-02, D-07).
  Scenario: A press with no valid state is refused locally
    Given a short poll interval
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    When the scenario clock moves forward by 1796 seconds
    Then the "System Self-Test" service reports "Status Active" as "false"
    When a controller presses the "System Self-Test" switch
    Then the write reports that the control is not allowed now
    Then the vendor receives no command

  # The transport half, which fails on its own schedule. A command travels on the polling transport,
  # so a poll that has just failed means the plugin has no proven way to send and refuses the press
  # here rather than buying a round trip that ends as a vendor error (RES-04, D-07).
  Scenario: A press with no command transport is refused locally
    Given a short poll interval
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Given the service fails every request with status 503
    Then the monitoring path is "unavailable"
    When a controller presses the "System Self-Test" switch
    Then the write reports that the control is not allowed now
    Then the vendor receives no command
