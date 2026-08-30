Feature: Publishing safety state to HomeKit

  A validated vendor field reaches Apple Home as the exact fact the device reported. The plugin
  invents no reading: a field that stops validating leaves the last trustworthy value published and
  marks its service inactive, and the confirmed-offline adapter stays quiet while the vendor keeps
  answering for the device.

  Background:
    Given the fake cloud
    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |

  Scenario: A reported mains power fact reaches both power services
    When the plugin starts
    Then the plugin publishes the "Sump Mains Power" service
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    Then the "Mains Power Lost" sensor is not activated

  Scenario: A mains power loss activates the mains power lost sensor
    When the plugin starts
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    When the vendor changes these device fields:
      | ac_power | false |
    Then the "Sump Mains Power" service reports "Mains Power Present" as "false"
    Then the "Mains Power Lost" sensor is activated

  Scenario: A power field that stops validating keeps its last trustworthy reading
    When the plugin starts
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    When the vendor changes these device fields:
      | ac_power | 12 |
    Then the plugin explains the degradation once
    Then the "Sump Mains Power" service reports "Status Active" as "false"
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"

  Scenario: The offline adapter stays quiet while the vendor answers for the device
    When the plugin starts
    Then the plugin publishes the "Basement Guardian Offline" service
    Then the "Basement Guardian Offline" sensor is not activated
    When the vendor changes these device fields:
      | offline | true |
    Then the canonical snapshot carries these fields:
      | offline | true |
    Then the plugin polls the vendor at least 8 times
    Then the "Basement Guardian Offline" sensor is not activated
