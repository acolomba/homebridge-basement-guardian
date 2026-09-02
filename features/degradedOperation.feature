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

  Scenario: Two pumps on one account publish two accessories that read apart
    An owner with a Basement Guardian in each basement gets a tile for each one, and each tile is
    about its own basement. A level from the front basement appearing under the back one would be
    worse than no level at all, because it sends the owner down the wrong stairs. Each pump here
    carries its own water level, and every assertion names the pump it is about.

    Given these devices:
      | deviceId                 | name            | waterLevel |
      | placeholder-front-gemini | Front Sump Pump | 1          |
      | placeholder-back-gemini  | Back Sump Pump  | 7          |
    When the plugin starts
    Then the "Sump Pit Flood" service on "Front Sump Pump" reports "Status Active" as "true"
    Then the "Sump Pit Flood" service on "Back Sump Pump" reports "Status Active" as "true"
    Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "20"
    Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "60"

  Scenario: A heartbeat from one pump moves only that pump's readings
    A message from the pump in the front basement must never move the tile for the pump in the back
    one. An owner acting on a level needs to know which basement it is about, and a reading that
    arrives under the wrong tile sends them to the wrong stairs while the real pit keeps filling.

    Each pair below asserts the pump that moved before the pump that did not. The moved assertion
    waits for the change to land, so by the time the second assertion runs the message has already
    been delivered and merged. Reversed, the second assertion would read before the delivery and
    pass whatever the routing did, which is what gives the pair its meaning.

    Given a short poll interval
    Given these devices:
      | deviceId                 | name            | waterLevel |
      | placeholder-front-gemini | Front Sump Pump | 1          |
      | placeholder-back-gemini  | Back Sump Pump  | 7          |
    When the plugin starts
    Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "20"
    Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "60"
    When the vendor changes the "Front Sump Pump" device fields:
      | water_level | 15 |
    Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "80"
    Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "60"
    When the "Front Sump Pump" device publishes these heartbeat fields:
      | water_level | 3 |
    Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "40"
    Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "60"
    When the "Back Sump Pump" device publishes these heartbeat fields:
      | water_level | 15 |
    Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "80"
    Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "40"

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

  Scenario: A pit that floods after the live path went quiet still reaches Apple Home
    The scenario above is built on a device whose live path never delivered, which was the only
    shape it could take: while a shadow that had spoken owned telemetry, no poll refreshed it and
    the flood never arrived at all. Every real system heartbeats, so a live path that spoke and then
    stopped is the ordinary case rather than an unusual one. Two missed heartbeats end the shadow's
    ownership, the poll takes telemetry back, and the reading the poll found reaches the tile with
    the trust row still carrying the doubt. 31 is the water level the Gemini family calls a flooding
    pit; 3 and 7 are ordinary rungs of the same ladder, and the heartbeat carries the rung the
    vendor's own body does not, so the step below cannot pass until the live path has really spoken.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          | waterLevel |
      | placeholder-gemini | Sump Guardian | 3          |
    When the plugin starts
    When the device publishes these heartbeat fields:
      | water_level | 7 |
    Then the canonical snapshot carries these fields:
      | water_level | 7 |
    When the scenario clock moves forward by 1796 seconds
    Then the "Sump Pit Flood" service reports "Status Active" as "false"
    When the vendor changes these device fields:
      | water_level | 31 |
    Then the canonical snapshot carries these fields:
      | water_level | 31 |
    Then the "Sump Pit Flood" sensor is activated
    Then the "Sump Pit Flood" service reports "Status Active" as "false"

  Scenario: A poll finds a flood on the pump that went quiet while its neighbour keeps reporting
    Two basements, two Basement Guardians, one account. The controller in the front basement stops
    speaking while the one in the back basement goes on heartbeating. The pit in the front basement
    is filling. A tile that goes on reading "no leak" while claiming the plugin vouches for it is
    the exact failure this plugin exists to prevent, and it is the one an owner cannot see: nothing
    on that tile says the plugin stopped watching that basement.

    Silence belongs to a device, so a heartbeat from the back basement is no evidence about the
    front one. The poll answers for both pumps throughout, so once the quiet pump's live path stops
    owning its telemetry the poll refreshes it and the flood arrives. The pump beside it keeps the
    level its own heartbeat delivered, because its own live path never stopped, and 80 is a level
    only that heartbeat could have written -- its vendor body still reads the 60 its inventory row
    seeded.

    The heartbeats before the silence are the premise: both pumps' live messages moved both pumps'
    readings, so the freeze afterwards belongs to the quiet controller rather than to a harness that
    stopped delivering. 31 is the water level the Gemini family calls a flooding pit; 1, 3, 7 and 15
    are ordinary rungs of the same ladder.

    The clock moves in two heartbeat-length steps with a message from the back basement between
    them, rather than in one jump, because that is what makes the account clock a lie. Every step
    leaves the newest message on the account under a single heartbeat old, so an account-wide
    silence never trips at all, while the front basement's own last message ages past two. A single
    jump would trip the account-wide rule as well and release the quiet pump by accident, which
    reads as a pass and measures nothing.

    Each pair asserts the pump that moved before the pump that did not, for the reason the two-pump
    scenarios above give: the moved assertion waits for the delivery to land, so the assertion after
    it reads afterwards rather than before.

    Given a short poll interval
    Given these devices:
      | deviceId                 | name            | waterLevel |
      | placeholder-front-gemini | Front Sump Pump | 1          |
      | placeholder-back-gemini  | Back Sump Pump  | 7          |
    When the plugin starts
    When the "Front Sump Pump" device publishes these heartbeat fields:
      | water_level | 3 |
    Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "40"
    When the "Back Sump Pump" device publishes these heartbeat fields:
      | water_level | 3 |
    Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "40"
    When the scenario clock moves forward by 898 seconds
    When the "Back Sump Pump" device publishes these heartbeat fields:
      | water_level | 1 |
    Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "20"
    When the scenario clock moves forward by 898 seconds
    When the "Back Sump Pump" device publishes these heartbeat fields:
      | water_level | 15 |
    Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "80"
    When the vendor changes the "Front Sump Pump" device fields:
      | water_level | 31 |
    Then the "Sump Pit Flood" service on "Front Sump Pump" reports "Leak Detected" as "1"
    Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "100"
    Then the "Sump Pit Flood" service on "Front Sump Pump" reports "Status Active" as "false"
    Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "80"

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
    the value the store already holds.

    Two missed heartbeats hand telemetry back to the poll, so by the time the second heartbeat is
    published the store holds the vendor's level, not the first heartbeat's. Republishing the first
    heartbeat's level here would be a change, a snapshot listener would fire on it, and the scenario
    would pass against the very defect it exists to catch. The step below therefore reads the level
    the poll wrote and republishes that one.

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
    Then the canonical snapshot carries these fields:
      | water_level | 1 |
    When the device publishes these heartbeat fields:
      | water_level | 1 |
    Then the "Sump Pit Flood" service reports "Status Active" as "true"

  Scenario: A returning heartbeat clears the shadow silence before the next poll
    The scenario above runs under a short poll interval, so a poll tick lands within milliseconds of
    the heartbeat and it cannot tell the arrival clearing from the poll-tick clearing. This one parks
    the plugin's device polling at the vendor first, which takes that cover away: no poll can finish
    from then on, so the arriving message is the only event left that could restore the trust. An
    owner whose live connection returns sees the tile stop saying the plugin cannot vouch for it at
    the message that proves the connection, rather than at a poll the configuration lets run an hour
    late.

    The returning heartbeat republishes the level the poll wrote during the silence, for the reason
    the scenario above gives: the shadow stopped owning telemetry two heartbeats in, so a heartbeat
    carrying the earlier level would be a change rather than a repeat.

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
    Then the canonical snapshot carries these fields:
      | water_level | 1 |
    Given the vendor never answers the device list
    Then the plugin stops asking for the device list
    When the device publishes these heartbeat fields:
      | water_level | 1 |
    Then the "Sump Pit Flood" service reports "Status Active" as "true"
    Then the "Sump Pit Level" service reports "Water Level" as "20"
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

  Scenario: A press on a restored control is refused rather than silently accepted
    The tile comes back and stays readable, and so does the control on it. Pressing that control
    while the vendor cloud is unreachable tells the owner the plugin has no way to reach the vendor,
    rather than flipping the toggle, reporting success, and doing nothing. A switch that reports
    success for an act that never happened is a false normal on the control surface, and an
    automation built on that switch would fire on the strength of it.

    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    Then the plugin publishes the "System Self-Test" service
    Given the service fails every request with status 503
    When the plugin restarts
    When a controller presses the "System Self-Test" switch
    Then the write reports that the control is not allowed now
    Then the vendor receives no command
    # The clearing push is a macrotask on the harness timers, so the scenario runs it rather than
    # relying on incidental timing. Without it the refused switch would answer its status to every
    # later read and Apple Home would grey the whole accessory out.
    When the scenario clock does not move
    Then the "System Self-Test" switch answers a read

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

  Scenario: A credential refused mid-run stays refused when the next heartbeat lands
    The scenario above reads the accessory at the instant the refusal lands and then stops. It
    publishes nothing afterwards, so it cannot see what an owner meets next. The device keeps
    sending. Its live connection is signed with temporary cloud credentials that outlive the account
    password the vendor just refused, so a message arrives after the plugin has stopped for good.

    A value push clears the refusal it lands on. One message therefore returned every service to a
    normal, fully vouched-for read, and it stayed that way, because a stopped plugin never pushes
    again. The plugin is dead until the owner corrects the account, and a vendor block lifts only 30
    days after the last attempt, so an accessory that looks normal in the meantime is the false
    all-clear this plugin exists to prevent.

    The plugin now ends the live connection when it stops, so no later message reaches the accessory.
    The heartbeat before the refusal proves the live path was carrying messages, which is what makes
    the silence after it belong to the plugin rather than to a broker that delivered nothing. The
    three services read here are a leak sensor, a contact sensor, and a switch, so "every service"
    rests on more than one kind. 31 is the water level the Gemini family calls a flooding pit: a
    stopped plugin reports no flood, and the refusal an owner must act on is the louder signal.

    Given a short poll interval
    Given the tenant issues tokens that expire in 3660 seconds
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |
    When the plugin starts
    When the device publishes these heartbeat fields:
      | water_level | 3 |
    Then the canonical snapshot carries these fields:
      | water_level | 3 |
    Given the tenant refuses the account credentials
    When the scenario clock moves forward by 120 seconds
    Then the "Sump Pit Flood" service answers no read for "Status Active"
    Then the broker holds no live connection
    When the device publishes these heartbeat fields:
      | water_level | 7 |
    Then the "Sump Pit Flood" service still answers no read for "Status Active"
    Then the "Basement Guardian Offline" service still answers no read for "Status Active"
    Then the "System Self-Test" service still answers no read for "Status Active"
    Then the "Sump Pit Flood" service reports "Leak Detected" as "0"
    When the scenario clock moves forward by 7200 seconds
    When the device publishes these heartbeat fields:
      | water_level | 31 |
    Then the "Sump Pit Flood" service still answers no read for "Status Active"
    Then the "Basement Guardian Offline" service still answers no read for "Status Active"
    Then the "System Self-Test" service still answers no read for "Status Active"
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
