Feature: Harness fakes

  The deterministic suite runs against a local stand-in for every vendor service, so no scenario
  needs an account, hardware, or the public network.

  Scenario: The fake tenant records the grant it receives
    Given the fake auth0 tenant
    When the harness requests an identity token
    Then the tenant holds the grant the harness sent

  Scenario: The fake tenant answers an armed failure
    Given the fake auth0 tenant
    Given the tenant fails the next grant with status 403 and error "invalid_grant"
    When the harness requests an identity token
    Then the response carries status 403
    Then the response carries the error "invalid_grant"

  Scenario: The fake service answers the device list
    Given the fake rest service
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the harness requests the device list
    Then the response carries status 200
    Then the device list holds the devices the scenario sets
    Then the recorded request carries the authorization header

  Scenario: The fake service answers the temporary credentials
    Given the fake rest service
    Given the temporary credentials
    When the harness requests the temporary credentials
    Then the response carries status 200
    Then the credentials response carries the endpoint and the client identifier

  Scenario: The fake service fails one armed request
    Given the fake rest service
    Given the service fails the next request with status 503
    When the harness requests the device list
    Then the response carries status 503
    When the harness requests the device list
    Then the response carries status 200

  Scenario: The fake broker delivers a reported patch
    Given the fake shadow broker
    Given a subscriber on the update-accepted topic
    When the broker publishes the reported patch
    Then the subscriber receives the reported patch
    Then the broker holds the handshake of the subscriber

  Scenario: The fake broker delivers the full shadow document
    Given the fake shadow broker
    Given a subscriber on the get-accepted topic
    When the broker publishes the full shadow document
    Then the subscriber receives the full shadow document

  Scenario: The fake broker rejects the shadow request
    Given the fake shadow broker
    Given a subscriber on the get-rejected topic
    When the broker rejects the shadow request
    Then the subscriber receives the rejection

  Scenario: The fake broker closes every live connection
    Given the fake shadow broker
    Given a subscriber on the update-accepted topic
    When the broker closes every connection
    Then the subscriber observes the close
