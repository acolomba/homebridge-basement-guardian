Feature: Merging device state

  A device reports its complete state once and then sends a partial heartbeat about every fifteen
  minutes. The plugin merges each report into what it already holds, so the fields a heartbeat omits
  keep their last reported values and a requested value never becomes device state.

  Background:
    Given the fake cloud
    Given these gemini devices:
      | deviceId                             | name        |
      | placeholder-account_placeholder-pump | Sump System |
    Given these reported device fields:
      | water_level          | 1     |
      | primary_pump_running | true  |
      | ac_power             | true  |
      | battery_charging     | true  |
      | test_running         | false |
      | fault_code           | 0     |
    Given the shadow credentials

  Scenario: A partial heartbeat keeps the fields it omits
    When the plugin starts
    When the device publishes these heartbeat fields:
      | battery_health        | 96    |
      | hours_of_protection   | 12    |
      | water_level           | 2     |
      | serial_communications | true  |
      | offline               | false |
      | mcu_target_version    | 4     |
      | wifi_signal_dbm       | -55   |
    Then the canonical snapshot carries these fields:
      | water_level          | 2     |
      | primary_pump_running | true  |
      | ac_power             | true  |
      | battery_charging     | true  |
      | test_running         | false |
      | fault_code           | 0     |
      | battery_health       | 96    |

  Scenario: A requested value becomes neither device state nor a fresh receipt time
    When the plugin starts
    When the scenario clock moves forward
    When the device publishes a requested value
    Then the canonical snapshot carries no shadow version
    Then the canonical snapshot carries the receipt time the scenario started at
    Then the canonical snapshot carries no "alarm_muted" field
    Then the canonical snapshot carries these fields:
      | water_level          | 1    |
      | primary_pump_running | true |
    Then the plugin reports 0 canonical changes

  Scenario: An identical heartbeat reports no change
    When the plugin starts
    When the device publishes these heartbeat fields:
      | battery_health        | 96    |
      | hours_of_protection   | 12    |
      | water_level           | 2     |
      | serial_communications | true  |
      | offline               | false |
      | mcu_target_version    | 4     |
      | wifi_signal_dbm       | -55   |
    Then the canonical snapshot is at shadow version 1
    When the device publishes these heartbeat fields:
      | battery_health        | 96    |
      | hours_of_protection   | 12    |
      | water_level           | 2     |
      | serial_communications | true  |
      | offline               | false |
      | mcu_target_version    | 4     |
      | wifi_signal_dbm       | -55   |
    Then the canonical snapshot is at shadow version 2
    Then the plugin reports 1 canonical change
