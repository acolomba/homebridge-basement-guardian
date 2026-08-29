Feature: Discovering a Gemini and publishing its accessory

  A valid Gemini on the account becomes one HomeKit accessory, with a truthful AccessoryInformation
  service populated from validated vendor fields.

  Background:
    Given the fake cloud
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |

  Scenario: A valid Gemini becomes one registered accessory with a populated AccessoryInformation service
    When the plugin starts
    Then the plugin registers one accessory with a truthful accessory information service
