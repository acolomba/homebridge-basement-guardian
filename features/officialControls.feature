Feature: Operating the official controls from HomeKit

  A controller can press System Self-Test, and the press reaches the vendor exactly once. The
  device's own report is what leaves the switch on: the plugin publishes what the system says it is
  doing, never what somebody asked it to do.

  Background:
    Given the fake cloud
    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |

  Scenario: A press of the self-test switch reaches the vendor and the device's report leaves it on
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Then the "System Self-Test" service reports "On" as "false"
    When a controller turns on the "System Self-Test" switch
    Then the vendor receives one self-test command
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
    When the plugin starts
    Then the "System Self-Test" service reports "On" as "false"
    When the vendor changes these device fields:
      | test_running | true |
    Then the "System Self-Test" service reports "On" as "true"
    Then the vendor receives no command
