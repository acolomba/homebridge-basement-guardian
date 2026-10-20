Feature: HomeKit safety state

  Validated device facts reach Apple Home without invented readings.
  Invalid fields keep their last trusted values and mark affected services inactive.
  The scenarios use a fake vendor to check safety state and offline behavior.

  Background:
    Given the fake cloud
    Given a short poll interval
    Given these devices:
      | deviceId           | name          |
      | placeholder-gemini | Sump Guardian |

  Scenario: A reported mains power fact reaches both power services
    When the plugin starts
    Then the plugin publishes the "Sump Mains Power" service
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    Then the "Mains Power Lost" sensor is not activated

  Scenario: A mains power loss activates the mains power lost sensor
    When the plugin starts
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    When the vendor changes these device fields:
      | ac_power | false |
    Then the "Sump Mains Power" service reports "Mains Power Present" as "false"
    Then the "Mains Power Lost" sensor is activated

  Scenario: A power field that stops validating keeps its last trustworthy reading
    When the plugin starts
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    When the vendor changes these device fields:
      | ac_power | 12 |
    Then the plugin explains the degradation once
    Then the "Sump Mains Power" service reports "Status Active" as "false"
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"

  Scenario: An invalid pit level leaves both pit services unpublished
    A service added before its row has a value to vouch for sits at the hap format defaults, and
    those read as an empty pit that reports no leak.

    Given these devices:
      | deviceId           | name          | water level |
      | placeholder-gemini | Sump Guardian | 12          |
    When the plugin starts
    Then the plugin publishes no "Sump Pit Flood" service
    Then the plugin publishes no "Sump Pit Level" service
    Then the plugin publishes the "Sump Mains Power" service

  Scenario: The offline adapter stays quiet while the vendor answers for the device
    When the plugin starts
    Then the plugin publishes the "Basement Guardian Offline" service
    Then the "Basement Guardian Offline" sensor is not activated
    When the vendor changes these device fields:
      | offline | true |
    Then the canonical snapshot carries these fields:
      | offline | true |
    Then the plugin polls the vendor at least 8 times
    Then the "Basement Guardian Offline" sensor is not activated

  Scenario: A rising water level reaches the flood sensor and the pit level
    When the plugin starts
    When the vendor changes these device fields:
      | water_level | 15 |
    Then the "Sump Pit Level" service reports "Raw Water Level Code" as "15"
    Then the "Sump Pit Level" service reports "Water Level" as "80"
    Then the "Sump Pit Flood" sensor is not activated
    When the vendor changes these device fields:
      | water_level | 31 |
    Then the "Sump Pit Level" service reports "Raw Water Level Code" as "31"
    Then the "Sump Pit Level" service reports "Water Level" as "100"
    Then the "Sump Pit Flood" sensor is activated

  Scenario: A flooding pit reaches the flood sensor with no elapsed scenario time
    When the plugin starts
    Then the "Sump Pit Flood" sensor is not activated
    When the vendor changes these device fields:
      | water_level | 31 |
    When the scenario clock does not move
    Then the "Sump Pit Flood" sensor is activated

  Scenario: A backup pump activation publishes while a self test runs
    When the plugin starts
    Then the "Backup Pump Running" sensor is not activated
    When the vendor changes these device fields:
      | test_running        | true |
      | backup_pump_running | true |
    Then the "Backup Pump Running" sensor is activated
    Then the "Backup Pump" service reports "Pump Running" as "true"
    Then the "Mains Power Lost" sensor is not activated
    Then the "Primary Pump Fault" sensor is not activated

  Scenario: A partial heartbeat leaves every scope it does not carry trusted
    Given the shadow credentials
    When the plugin starts
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    Then the "Primary Pump" service reports "Pump Running" as "false"
    Then the "Backup Pump" service reports "Pump Running" as "false"
    Then the "System Self-Test" service reports "On" as "false"
    Then the "Alarm Mute" service reports "On" as "false"
    When the device publishes these heartbeat fields:
      | battery_health        | 16    |
      | hours_of_protection   | 4     |
      | water_level           | 7     |
      | serial_communications | true  |
      | offline               | false |
      | mcu_target_version    | 1.2.3 |
      | wifi_signal_dbm       | -55   |
    Then the "Sump Pit Level" service reports "Raw Water Level Code" as "7"
    Then the "Sump Mains Power" service reports "Status Active" as "true"
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    Then the "Primary Pump" service reports "Status Active" as "true"
    Then the "Primary Pump" service reports "Pump Running" as "false"
    Then the "Backup Pump" service reports "Status Active" as "true"
    Then the "Backup Pump" service reports "Pump Running" as "false"
    Then the "System Self-Test" service reports "Status Active" as "true"
    Then the "System Self-Test" service reports "On" as "false"
    Then the "Alarm Mute" service reports "Status Active" as "true"
    Then the "Alarm Mute" service reports "On" as "false"

  Scenario: A lost pump controller link deactivates the services derived from it
    When the plugin starts
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    Then the "Pump Controller Link Lost" sensor is not activated
    When the vendor changes these device fields:
      | serial_communications | false |
    Then the "Pump Controller Link Lost" sensor is activated
    Then the "Sump Mains Power" service reports "Status Active" as "false"
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
    Then the "Basement Guardian Offline" sensor is not activated
    When the vendor changes these device fields:
      | serial_communications | true |
    Then the "Pump Controller Link Lost" sensor is not activated
    Then the "Sump Mains Power" service reports "Status Active" as "true"

  Scenario: A primary pump fault activates its own adapter alone
    When the plugin starts
    When the vendor changes these device fields:
      | primary_pump_fault | true |
    Then the "Primary Pump Fault" sensor is activated
    Then the "Primary Pump" service reports "Status Fault" as "1"
    Then the "Backup Pump Fault" sensor is not activated
    Then the "Water Sensor Fault" sensor is not activated
    Then the "Pump Controller Link Lost" sensor is not activated
    Then the "Basement Guardian Offline" sensor is not activated

  Scenario: An ignored fault adapter removes its own sensor alone
    Given the plugin ignores these fault adapters:
      | mains-power-lost |
    When the plugin starts
    Then the plugin publishes the "Sump Mains Power" service
    Then the plugin publishes no "Mains Power Lost" service
    Then the plugin publishes the "Backup Pump Running" service
    Then the plugin publishes the "Primary Pump Fault" service
    Then the plugin publishes the "Backup Pump Fault" service
    Then the plugin publishes the "Water Sensor Fault" service
    Then the plugin publishes the "Pump Controller Link Lost" service
    Then the plugin publishes the "Basement Guardian Offline" service
    Then the "Sump Mains Power" service reports "Status Active" as "true"
    Then the "Sump Mains Power" service reports "Mains Power Present" as "true"
