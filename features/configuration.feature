Feature: Account configuration

  The plugin refuses an account it cannot use and stays idle, so a half-configured install reaches
  no vendor service and says what to fix.

  Scenario: The plugin starts nothing when the account email is missing
    Given the fake cloud
    Given these account settings:
      | password | placeholder-password |
    When the plugin loads
    Then the plugin refuses to start because "the account email is missing."
    Then the plugin registers no lifecycle listener
    Then the plugin holds no accessory
    Then no request reaches the fake cloud

  Scenario: The plugin starts nothing when the account password is missing
    Given the fake cloud
    Given these account settings:
      | email | account@example.test |
    When the plugin loads
    Then the plugin refuses to start because "the account password is missing."
    Then the plugin registers no lifecycle listener
    Then no request reaches the fake cloud

  Scenario: The plugin starts nothing on an out-of-range poll interval
    Given the fake cloud
    Given these account settings:
      | email        | account@example.test |
      | password     | placeholder-password |
      | pollInterval | 60                   |
    When the plugin loads
    Then the plugin refuses to start because "pollInterval must be a whole number of seconds from 300 to 3600, but it is 60."
    Then the plugin registers no lifecycle listener
    Then no request reaches the fake cloud
