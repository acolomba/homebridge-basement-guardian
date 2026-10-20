Feature: Account sign-in

  The plugin signs in once, reuses its cached token after a restart, and handles vendor refusals
  safely without leaking credentials to the log. A local fake cloud replaces the vendor services.

  Background:
    Given the fake cloud
    Given these gemini devices:
      | deviceId                             | name        |
      | placeholder-account_placeholder-pump | Sump System |

  Scenario: A first start performs the grant and caches the token
    Given the shadow credentials
    When the plugin starts
    Then the tenant holds 1 token request
    Then the grant carries the configured account
    Then the token cache holds the granted token for the configured account

  Scenario: A restart reuses the cached token
    Given the shadow credentials
    When the plugin starts
    Then the tenant holds 1 token request
    When the plugin restarts
    Then the tenant holds 1 token request
    Then the vendor receives a second device list request with the cached token

  Scenario: A refused credential clears the cache and reports how to correct the account
    Given the storage holds a token for another account
    Given the tenant refuses the account credentials
    When the plugin starts
    Then the tenant holds 1 token request
    Then the token cache is absent
    Then the log names how to correct the account
    Then the log carries no credential
    Then the fake service holds 0 vendor requests

  Scenario: A 429 response prompts a throttling warning and stop advice
    Given the tenant throttles the account
    When the plugin starts
    Then the tenant holds 1 token request
    Then the log names the throttling and how to stop the plugin
    Then the log carries no error
    Then the log carries no credential

  Scenario: The log redacts the granted token and issued AWS credentials
    Given the shadow credentials
    When the plugin starts
    Then the broker holds 1 handshake
    Then the log carries no credential
    When the plugin writes the granted token and issued AWS credentials to the log
    Then the log carries a redaction in place of each one
