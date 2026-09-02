Feature: Degraded monitoring

  A shadow connection the plugin cannot open costs latency, not correctness: the poll is already the
  reconciliation backstop. The plugin stays up, says once that it is seeing less, and says once more
  when the connection returns.

  Background:
    Given the fake cloud
    Given these gemini devices:
      | deviceId                             | name        |
      | placeholder-account_placeholder-pump | Sump System |
    Given the shadow credentials

  Scenario: The plugin keeps polling while the shadow connection is unavailable
    Given a short poll interval
    Given the broker refuses connections
    When the plugin starts
    Then the monitoring path is "poll-only"
    Then the log warns once about the degraded path
    When the vendor changes these device fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |

  Scenario: The combined path returns when the connection recovers
    Given the broker refuses connections
    When the plugin starts
    Then the log warns once about the degraded path
    Then the monitoring path is "poll-only"
    When the broker accepts connections
    Then the monitoring path is "shadow-and-poll"
    Then the log announces the recovery once

  Scenario: Shadow silence withdraws trust while polling continues
    A shadow that stops speaking costs more than a shadow that never opened. Polls keep arriving, so
    every tile still reads normal, while a pump run lasting seconds begins and ends between two of
    them and is never seen at all. The plugin therefore stops vouching for what it can no longer
    watch, and keeps vouching for the one verdict polling still sources.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the "Sump Pit Flood" sensor is not activated
    Then the "Basement Guardian Offline" service reports "Status Active" as "true"
    Then the "Basement Guardian Offline" sensor is not activated

  Scenario: A flooded pit reaches Apple Home while the live path is silent
    The device has said nothing for two heartbeats, so the plugin stops vouching for what it can no
    longer watch. The poll is still answering, and the poll is the reconciliation backstop, so the
    reading it carries is one the family validated on a transport that works. The tile therefore
    shows the flood and the trust row alone carries the doubt. A tile reading "no leak" over a
    plugin holding "leak" is the failure this whole plugin exists to prevent, and Apple Home draws
    no trust row on the tile to hint at it. 31 is the water level the Gemini family calls a
    flooding pit.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Then the "Sump Pit Flood" sensor is not activated
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    When the vendor changes these device fields:
      | water_level | 31 |
    Then the canonical snapshot carries these fields:
      | water_level | 31 |
    Then the "Sump Pit Flood" sensor is activated
    Then the "Sump Pit Flood" service reports "Status Active" as "false"

  Scenario: Polling failure alone leaves the live values trustworthy
    Live pushes still arrive while the poll fails, so the readings a user watches are current and
    only the verdict the poll alone sources goes unfed. The plugin withdraws that one verdict and
    keeps vouching for everything the live connection is still carrying.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Basement Guardian Offline" service reports "Status Active" as "true"
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    Given the service fails every request with status 503
    Then the "Basement Guardian Offline" service reports "Status Active" as "false"
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Then the "Basement Guardian Offline" sensor is not activated

  Scenario: Both monitoring paths lost withdraws every scope
    Neither transport is carrying anything, so the plugin can vouch for nothing at all. Every value
    it last saw stays exactly where it is, and every service says it is no longer current.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Given the service fails every request with status 503
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the "Basement Guardian Offline" service reports "Status Active" as "false"
    Then the "Sump Pit Flood" sensor is not activated
    Then the "Basement Guardian Offline" sensor is not activated

  Scenario: A blind plugin vouches for no controller-link verdict
    The controller link is the one verdict a row keeps publishing while its own scope is untrusted,
    because the network module reports that link state directly. A plugin that has lost both
    transports is not reporting anything directly, so that row stops calling its verdict current
    too. It keeps the verdict: the tile still shows the lost link the last trustworthy observation
    found, marked.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    When the vendor changes these device fields:
      | serial_communications | false |
    Then the "Pump Controller Link Lost" sensor is activated
    Then the "Pump Controller Link Lost" service reports "Status Active" as "true"
    Given the service fails every request with status 503
    When the scenario clock moves forward by 1796 seconds
    Then the "Pump Controller Link Lost" service reports "Status Active" as "false"
    Then the "Pump Controller Link Lost" sensor is activated

  Scenario: A successful poll does not clear the shadow silence
    Shadow silence is the case where the poll keeps working while live signals go unobserved, so a
    poll that succeeds restores trust the plugin has not earned. Recovery is matched to cause.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the plugin polls the vendor at least 8 times
    Then the "Sump Pit Flood" service reports "Status Active" as "false"

  Scenario: An identical heartbeat clears the shadow silence
    The canonical store notifies nobody when no telemetry value moved, which is what keeps a
    repeated heartbeat quiet. A recovery driven from a snapshot listener would therefore never fire,
    and a scenario publishing a changed field would pass against that defect. This one republishes
    the value the device already reported.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the "Sump Pit Flood" service reports "Status Active" as "true"

  Scenario: A returning heartbeat clears the shadow silence before the next poll
    The scenario above runs under a short poll interval, so a poll tick lands within milliseconds of
    the heartbeat and it cannot tell the arrival clearing from the poll-tick clearing. This one parks
    the plugin's device polling at the vendor first, which takes that cover away: no poll can finish
    from then on, so the arriving message is the only event left that could restore the trust. An
    owner whose live connection returns sees the tile stop saying the plugin cannot vouch for it at
    the message that proves the connection, rather than at a poll the configuration lets run an hour
    late.

    The closing step is here because the hold is not indefinite. The client puts a ten-second
    real-clock deadline on every request, and an abort reaches the poll loop's failure branch, which
    reports the monitoring trust and would clear the silence with no message involved. The step reads
    the inventory-request count, which that abort moves, so a run slow enough for the deadline to
    fire fails loudly instead of crediting a poll report to the message.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Given the vendor never answers the device list
    Then the plugin stops asking for the device list
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Then the "Sump Pit Level" service reports "Water Level" as "40"
    Then the plugin records no poll outcome

  Scenario: A restarted plugin marks restored values stale before any poll
    Homebridge serves the values it cached from the moment the bridge publishes, and this plugin
    publishes nothing until a poll succeeds, which never happens while the cloud is unreachable. The
    restored tile therefore says at once that the plugin cannot vouch for what it shows.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Given the service fails every request with status 503
    When the plugin restarts
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the "Sump Pit Flood" service reports "Leak Detected" as "0"

  Scenario: A restart retains the values it marks stale
    Marking withdraws trust and nothing else. Every reading the previous run left is still on the
    tile, so an owner sees the last level the device reported rather than a blank or a fresh zero.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Level" service reports "Water Level" as "20"
    Given the service fails every request with status 503
    When the plugin restarts
    Then the "Sump Pit Level" service reports "Status Active" as "false"
    Then the "Sump Pit Level" service reports "Water Level" as "20"

  Scenario: Credential rejection makes every service unreadable
    A vendor refusal of the account credentials never clears itself, and the plugin must not try
    again: the vendor lifts the block thirty days after the last attempt. The accessory therefore
    stops answering reads until the owner corrects the account, and keeps every reading it had.

    The cached token belongs to another account, so the restart has to ask the tenant for a new one
    and meets the refusal. Without that the restart reuses the cached token, never authenticates, and
    the scenario passes on a run the vendor never refused.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Given the tenant refuses the account credentials
    Given the storage holds a token for another account
    When the plugin restarts
    Then the log names how to correct the account
    Then the "Sump Pit Flood" service answers no read for "Status Active"
    Then the "Sump Pit Flood" service reports "Leak Detected" as "0"

  Scenario: A credential refused after a healthy start makes every service unreadable
    The scenario above drives the refusal through a restart, so it covers the launch path alone. The
    case an owner actually meets is a password changed at the vendor while Homebridge is running,
    and nothing covered it: the refusal arrived at a poll, was reported as a device-discovery
    failure, and no service ever stopped answering.

    The tenant issues a token that lapses just past the client's one-hour renewal margin, so moving
    the clock a little makes the next poll ask for a new one and meet the refusal. The advance stays
    far below two missed heartbeats, so what the tiles say here is about the refused credential
    alone.

    Given a short poll interval
    Given the tenant issues tokens that expire in 3660 seconds
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Given the tenant refuses the account credentials
    When the scenario clock moves forward by 120 seconds
    Then the "Sump Pit Flood" service answers no read for "Status Active"
    Then the log names how to correct the account
    Then the "Sump Pit Flood" service reports "Leak Detected" as "0"

  Scenario: A transport outage leaves every service readable
    Every other failure the plugin can have clears itself once the transport returns, so the tile
    stays readable and says only that the plugin cannot currently vouch for what it shows. Greying
    out an accessory for a condition that fixes itself teaches an owner to ignore the one that does
    not.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    Then the "Sump Pit Flood" service answers a read for "Status Active"
    Then the "Sump Pit Flood" service answers a read for "Leak Detected"
