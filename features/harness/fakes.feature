Feature: Harness fakes

  The deterministic suite uses local stand-ins for vendor services, the hap namespace, and the
  Homebridge accessory surface. No scenario needs an account, hardware, or the public network.

  Scenario: The fake tenant records the grant it receives
    Given the fake auth0 tenant
    When the harness requests an identity token
    Then the tenant holds the grant the harness sent

  Scenario: The fake tenant preserves extra fields and value types in a grant
    Given the fake auth0 tenant
    When the harness requests an identity token with an extra credential and a numeric scope
    Then the tenant holds the exact grant the harness sent

  Scenario: The fake tenant answers an armed failure
    Given the fake auth0 tenant
    Given the tenant fails the next grant with status 403 and error "invalid_grant"
    When the harness requests an identity token
    Then the response carries status 403
    Then the response contains only the error "invalid_grant" and its description
    When the harness requests an identity token
    Then the response carries status 200
    Then the response carries the issued identity token

  Scenario: The fake tenant records a request to an unknown route
    Given the fake auth0 tenant
    When the harness requests an unknown tenant route
    Then the response carries status 404
    Then the tenant records the unknown route request

  Scenario: The fake tenant refuses malformed grant json without losing the request
    Given the fake auth0 tenant
    When the harness sends malformed grant json
    Then the response carries status 400
    Then the tenant records the malformed grant request
    Then the harness observes no unhandled rejection

  Scenario: The fake service answers the device list
    Given the fake rest service
    Given these devices:
      | device id          | name          |
      | placeholder-gemini | Sump Guardian |
      | placeholder-backup | Backup System |
    When the harness requests the device list
    Then the response carries status 200
    Then the device list holds the devices the scenario sets
    Then the service records only the authorized device-list request

  Scenario: The fake service answers a device whose id needs encoding
    Given the fake rest service
    Given these devices:
      | device id          | name          |
      | placeholder-first  | First System  |
      | placeholder gemini | Sump Guardian |
    When the harness requests the device with id "placeholder gemini"
    Then the response carries status 200
    Then the device answer holds the device with id "placeholder gemini"

  Scenario: The fake service answers the temporary credentials
    Given the fake rest service
    Given the temporary credentials
    When the harness requests the temporary credentials
    Then the response carries status 200
    Then the credentials response carries the endpoint and the client identifier

  Scenario: The fake service fails one armed request
    Given the fake rest service
    Given these devices:
      | device id          | name          |
      | placeholder-gemini | Sump Guardian |
      | placeholder-backup | Backup System |
    Given the service fails the next request with status 503
    When the harness requests the device list
    Then the response carries status 503
    When the harness requests the device list
    Then the response carries status 200
    Then the device list holds the devices the scenario sets

  Scenario: The fake service refuses malformed command JSON
    Given the fake rest service
    Given the fake service records accepted commands
    When the harness sends malformed command json
    Then the response carries status 400
    Then the fake service records no accepted command
    Then the harness observes no unhandled rejection

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
    Then the broker holds no current subscriptions

  Scenario: A due timer does not run after another due timer cancels it
    When the first due timer cancels the second due timeout
    Then only the first due timer runs

  Scenario: A due interval does not run or repeat after another due timer cancels it
    When the first due timer cancels the second due interval
    Then only the first due timer runs

  Scenario: Every release runs after earlier releases fail
    When scenario releases fail before another release runs
    Then the world reports both failures after running every release

  Scenario: A failed startup still releases scenario resources
    When startup fails after a scenario release is registered
    Then the world runs the release and reports the startup failure

  Scenario: The fake hap namespace carries the standard identifiers
    Then the hap stand-in carries the standard service and characteristic identifiers

  Scenario: The fake hap namespace carries the standard state and status values
    Then the hap stand-in carries the standard state and status values

  Scenario: The fake hap namespace carries the formats, perms, and units
    Then the hap stand-in carries the formats, perms, and units the plugin reads

  Scenario: A plugin type extends the fake hap bases
    Then a plugin type extends the hap service and the hap characteristic

  Scenario: Fake hap characteristics keep separate properties
    Then two fake hap characteristics keep separate properties

  Scenario: Fresh hap characteristics have the real format defaults
    Then fresh hap characteristics read at their format defaults

  Scenario: A fresh accessory information service has the real hap string defaults
    Then a fresh accessory information service reads at the hap string defaults

  Scenario: The standard hap services declare their optional characteristics
    Then the standard hap services declare their optional characteristics

  Scenario: A service update adds the named characteristic
    Then the service adds the characteristic an update names

  Scenario: A service appends every optional characteristic declaration
    Then the service appends an optional characteristic on every call

  Scenario: The fake hap normalizes error statuses
    Then the fake hap answers the real status for each error form

  Scenario: The fake hap refuses a duplicate characteristic
    Then the service refuses a duplicate characteristic

  Scenario: The fake hap adds a missing characteristic on lookup
    Then a service lookup adds the missing characteristic

  Scenario: The fake hap routes a service set through its write handler
    Then setting a service characteristic calls its write handler

  Scenario: The fake hap preserves a value after a refused service set
    Then a refused service set preserves the prior value and stores its status

  Scenario: The fake hap names an unnamed accessory information service
    Then the accessory information service carries its unnamed service name

  Scenario: The fake accessory carries several services of one type
    Then the accessory holds each contact sensor under its own subtype

  Scenario: The fake accessory refuses a duplicate service
    Then the accessory refuses a second service with the same type and subtype
    Then the accessory refuses a second service of one type without a subtype

  Scenario: The fake accessory removes one service
    Then the accessory removes only the service it is given

  Scenario: The fake homebridge api delivers lifecycle events in order
    Given the fake homebridge api
    Given a listener on each lifecycle event
    When the api finishes launching
    Then the world observes that the plugin "launched"
    When the api shuts down
    Then the world observes that the plugin "shut down"

  Scenario: The fake homebridge api gives the scenario temporary storage
    Given the fake homebridge api
    Given another fake homebridge api
    Then the storage path is an empty directory the scenario owns

  Scenario: The fake homebridge api exposes its hap namespace
    Given the fake homebridge api
    Then the api exposes the hap namespace

  Scenario: The fake homebridge api constructs an accessory with its supplied identity
    Given the fake homebridge api
    Then the accessory carries the identity the plugin gives it
