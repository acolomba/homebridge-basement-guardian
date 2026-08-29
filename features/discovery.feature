Feature: Discovering a Gemini and publishing its accessory

  A valid Gemini on the account becomes one HomeKit accessory, with a truthful AccessoryInformation
  service populated from validated vendor fields. A HALO or unrecognized device is explained and
  skipped, and never blocks a valid Gemini in the same inventory.

  Background:
    Given the fake cloud
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |

  Scenario: A valid Gemini becomes one registered accessory with a populated AccessoryInformation service
    When the plugin starts
    Then the plugin registers one accessory with a truthful accessory information service

  Scenario: A HALO and an unknown device do not block a valid Gemini in the same inventory
    Given a short poll interval
    Given these devices:
      | deviceId           | name          | deviceTypeId      |
      | placeholder-gemini | Sump Guardian | wayneWaterGemini  |
      | placeholder-halo   | Guardian HALO | wayneWaterHalo    |
      | placeholder-other  | Mystery Box   | wayneWaterUnknown |
    When the plugin starts
    Then the plugin registers one accessory with a truthful accessory information service
    Then the plugin explains the halo and the unknown device once each
    Then the plugin polls the vendor at least 2 times
    Then the plugin explains the halo and the unknown device once each
