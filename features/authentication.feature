Feature: Signing in to the vendor account

  The plugin signs in once, reuses the cached token across a restart, and answers each way the
  vendor can refuse with the one response that is safe for it. No credential reaches the log.

  Background:
    Given the fake cloud
    Given these gemini devices:
      | deviceId                             | name        |
      | placeholder-account_placeholder-pump | Sump System |

  Scenario: A first start performs the grant and caches the token
    Given the shadow credentials
    When the plugin starts
    Then the tenant holds 1 token request
    Then the grant carries the account the scenario configured
    Then the token cache is present

  Scenario: A restart reuses the cached token
    Given the shadow credentials
    When the plugin starts
    Then the tenant holds 1 token request
    When the plugin restarts
    Then the tenant holds 1 token request

  Scenario: A refused credential stops authentication and clears the cache
    Given the storage holds a token for another account
    Given the tenant refuses the account credentials
    When the plugin starts
    Then the tenant holds 1 token request
    Then the token cache is absent
    Then the log names how to correct the account
    Then the fake service holds 0 vendor requests

  Scenario: A throttled account waits instead of stopping
    Given the tenant throttles the account
    When the plugin starts
    Then the tenant holds 1 token request
    Then the log names the throttling and how to stop the plugin
    Then the log carries no error

  Scenario: No credential reaches the log
    Given the shadow credentials
    When the plugin starts
    Then the broker holds 1 handshake
    Then the log carries no credential
    When the plugin writes every credential it registered to the log
    Then the log carries a redaction in place of each one
