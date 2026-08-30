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

  Scenario: An already-cached device is updated on a second poll
    Given a short poll interval
    When the plugin starts
    Then the plugin registers one accessory with a truthful accessory information service
    Then the plugin polls the vendor at least 3 times
    Then the plugin registers one accessory with a truthful accessory information service

  Scenario: A deviceTypeId change keeps the same accessory
    Given a short poll interval
    When the plugin starts
    Then the plugin registers one accessory with a truthful accessory information service
    When the vendor reports these devices:
      | deviceId           | name          | deviceTypeId   |
      | placeholder-gemini | Sump Guardian | wayneWaterHalo |
    Then the accessory remembers the device type "wayneWaterHalo"
    Then the plugin registers one accessory with a truthful accessory information service

  Scenario: A vendor rename is adopted when there is no prior customization
    Given a short poll interval
    When the plugin starts
    Then the plugin registers one accessory with a truthful accessory information service
    When the vendor reports these devices:
      | deviceId           | name        |
      | placeholder-gemini | Sump Sentry |
    Then the accessory remembers the vendor name "Sump Sentry"
    Then the accessory is named "Sump Sentry"

  Scenario: A vendor rename is not adopted after a user customization
    Given a short poll interval
    When the plugin starts
    Then the plugin registers one accessory with a truthful accessory information service
    When the user renames the accessory to "Basement Pump" in the home app
    When the vendor reports these devices:
      | deviceId           | name        |
      | placeholder-gemini | Sump Sentry |
    Then the accessory remembers the vendor name "Sump Sentry"
    Then the accessory is named "Basement Pump"

  Scenario: A device omitted from two trustworthy polls and a final check is removed
    Given a short poll interval
    When the plugin starts
    Then the plugin registers one accessory with a truthful accessory information service
    When the vendor reports no devices
    Then the plugin unregisters the accessory

  Scenario: A device that reappears before the final check is not removed
    Given a short poll interval
    When the plugin starts
    Then the plugin registers one accessory with a truthful accessory information service
    When the vendor omits the device from the next 2 inventory checks
    Then the plugin polls the vendor at least 6 times
    Then the plugin registers one accessory with a truthful accessory information service
    Then the plugin never unregisters the accessory
