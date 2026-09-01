/**
 * @fileoverview The vendor-defined characteristics this plugin declares.
 *
 * Apple publishes no characteristic for most of what a sump controller reports
 * -- mains power at the controller, a raw thermometer water-level code, a pump's
 * live running state, a battery health code -- so each exact reported fact needs
 * a type of the plugin's own. Publishing the raw vendor code beside the standard
 * value is what lets anyone check a provisional mapping against a real pit
 * instead of trusting it (D-015).
 *
 * Every one declared here is read-only -- `PAIRED_READ` and `NOTIFY`, never
 * `PAIRED_WRITE` -- because a writable characteristic would offer a controller
 * a path to overwrite reported safety state with a value no device ever sent
 * (SAFE-08). The permission set is built in exactly one place below, so no
 * declaration can grant a write permission by omission.
 *
 * Nothing here carries Wi-Fi signal strength: it is module diagnostics rather
 * than a basement-protection condition, and putting it among safety state would
 * dilute what a tile means (D-016). Nothing here carries filter-maintenance
 * semantics either, for battery health or for anything else (D-021, SAFE-06).
 *
 * The subclasses are declared inside the factory because `api.hap` is a runtime
 * value: HAP-NodeJS is never imported directly, so the base class, the formats,
 * and the permissions all arrive through the injected namespace (D-006).
 *
 * Each `UUID` below is a published identity. It is a hard-coded random v4
 * literal rather than a value derived from a seed string, because a seed a
 * later edit could change would silently orphan the characteristic on every
 * installed accessory while every test stayed green (D-015).
 */

import type { API, Characteristic, CharacteristicProps, WithUUID } from 'homebridge';

/**
 * A characteristic type, in the form HAP's own readers and writers accept one.
 *
 * The zero-argument construct signature is what `updateCharacteristic` and
 * `addOptionalCharacteristic` require; the static `UUID` is what lets a lookup
 * match a characteristic restored from the Homebridge cache, whose class the
 * running code no longer recognises.
 */
export type CharacteristicClass = WithUUID<typeof Characteristic> & (new () => Characteristic);

/** Every vendor-defined characteristic, keyed by the name a catalogue row projects it under. */
export interface CustomCharacteristics {
  /** The vendor `water_level` thermometer code exactly as reported, beside the mapped percentage (D-015). */
  RawWaterLevelCode: CharacteristicClass;
  /** Whether a pump is running right now, exactly as the vendor reports it. */
  PumpRunning: CharacteristicClass;
  /** Whether a pump reports a fault of its own, exactly as the vendor reports it. */
  PumpFault: CharacteristicClass;
  /** Whether a pump's fuse is blown or missing, which the backup pump alone reports. */
  PumpFuseBlown: CharacteristicClass;
  /** The reported water-sensor fault, kept beside the pit level it casts doubt on. */
  WaterSensorFaultReported: CharacteristicClass;
  /** Mains power at the sump controller, exactly as the vendor reports it. */
  MainsPowerPresent: CharacteristicClass;
  /** Whether the backup battery is charging, exactly as the vendor reports it. */
  BatteryCharging: CharacteristicClass;
  /** Whether the backup battery reports a low voltage, exactly as the vendor reports it. */
  BatteryVoltageLow: CharacteristicClass;
  /** The vendor battery-health code exactly as reported, beside the standard low-battery indicator (D-007). */
  BatteryHealthCode: CharacteristicClass;
  /** The vendor protection-hours code exactly as reported, beside the estimated level it bands to (D-008). */
  ProtectionHoursCode: CharacteristicClass;
  /** Whether the network module still has its link to the pump controller, reported rather than inverted. */
  ControllerLinkPresent: CharacteristicClass;
  /** When controller-derived state last carried trustworthy values, or the empty string when it never has (RES-02). */
  ControllerDataLastTrustedAt: CharacteristicClass;
  /** When this plugin began watching one pump, which is what the count below is counted from (CTRL-01, D-020). */
  ObservationStartedAt: CharacteristicClass;
  /** Activations of one pump this plugin watched since that start -- never a device or whole-of-life total (CTRL-01, D-020). */
  ObservedActivationCount: CharacteristicClass;
  /** When the last watched or recovered activation of one pump happened, or the empty string when none has (CTRL-01). */
  LastObservedActivationAt: CharacteristicClass;
  /** Whether that last activation was self-test activity, left unwritten until the plugin has earned the label (CTRL-01, D-013). */
  LastActivationWasTestActivity: CharacteristicClass;
}

// Fixed published identities: none of them may ever change, and each is
// deliberately outside Apple's assigned base namespace
// (`-0000-1000-8000-0026BB765291`), so no future Apple type can collide with one
// (SAFE-08).
const RAW_WATER_LEVEL_CODE_UUID = 'f5c6e2da-7a4f-46c0-b02e-b501e90877cf';
const PUMP_RUNNING_UUID = '5b3a4ee5-cb3f-4fd5-ab25-13c886fd0ad6';
const PUMP_FAULT_UUID = 'c4f90c81-f8a4-43b1-a12f-c3eba16f9bba';
const PUMP_FUSE_BLOWN_UUID = 'c33321c4-f8c8-4d85-ba22-16a2c282fec2';
const WATER_SENSOR_FAULT_REPORTED_UUID = '1d73fac4-3921-42e3-8d90-69065ab9c959';
const MAINS_POWER_PRESENT_UUID = 'b014b110-41bb-4dec-a681-4a331455425e';
const BATTERY_CHARGING_UUID = 'bc8b71e7-bbce-4fd7-aa00-fcd451cb451f';
const BATTERY_VOLTAGE_LOW_UUID = '8278fb37-28fc-4550-a684-73000dcecf53';
const BATTERY_HEALTH_CODE_UUID = '89ff0a75-adab-4ec2-9254-446681dd5fa2';
const PROTECTION_HOURS_CODE_UUID = '72432447-f7ae-4d5e-b551-7da3538267d0';
const CONTROLLER_LINK_PRESENT_UUID = '39f9112e-cdad-41f5-9247-f5379b0d6c11';
const CONTROLLER_DATA_LAST_TRUSTED_AT_UUID = 'd4d0209b-1472-4a39-8d1b-1c48d94efc7f';
const OBSERVATION_STARTED_AT_UUID = 'f36376db-47a7-4c59-a76f-6bdc234d5634';
const OBSERVED_ACTIVATION_COUNT_UUID = '88734156-8e55-4697-af69-68e9576d1352';
const LAST_OBSERVED_ACTIVATION_AT_UUID = '39226a7e-0b92-4f41-b9a4-a602cdc8cca3';
const LAST_ACTIVATION_WAS_TEST_ACTIVITY_UUID = '217042ab-ad7e-481b-8e7e-2510e9ad74d9';

// The four HAP formats these declarations use, named here rather than read from
// `hap.Formats` so the definition table stays a plain module-level value; the
// factory resolves each name against the injected namespace.
//
// `uint32` exists for the activation count alone. `uint8` caps at 255 and HAP
// *clamps* a larger value into the domain rather than refusing it, so a count
// past 255 would silently stop advancing while still reading as a fact about
// the basement. That is a false normal a pump running a few times a day reaches
// in months, not years (D-12, CTRL-01).
type CharacteristicFormat = 'bool' | 'uint8' | 'uint32' | 'string';

/** The value domain one declaration adds, beside the format and permissions every one shares. */
type CharacteristicDomain = Pick<CharacteristicProps, 'minValue' | 'maxValue' | 'minStep' | 'validValues'>;

/** One vendor-defined characteristic, in the form the class factory below builds one from. */
interface CharacteristicDefinition {
  displayName: string;
  uuid: string;
  format: CharacteristicFormat;
  domain?: CharacteristicDomain;
}

/**
 * Answers the vendor-defined characteristic types, built over one HAP namespace.
 *
 * Building them touches nothing outside itself: no accessory, no service, and
 * no HomeKit registration. A caller that needs the same type twice calls this
 * twice and gets two classes carrying one identifier, which every HAP lookup
 * matches on, so the identifier rather than the class is what stays stable.
 */
export function createCustomCharacteristics(hap: API['hap']): CustomCharacteristics {
  const formats: Readonly<Record<CharacteristicFormat, string>> = {
    bool: hap.Formats.BOOL,
    uint8: hap.Formats.UINT8,
    uint32: hap.Formats.UINT32,
    string: hap.Formats.STRING,
  };

  // The read-only permission set, in the one place every declaration reads it
  // from, so no row can grant a write permission by omission (SAFE-08). It
  // answers a fresh array each time, because `CharacteristicProps.perms` is a
  // mutable member and two characteristics must not share one.
  function readOnlyPerms(): CharacteristicProps['perms'] {
    return [hap.Perms.PAIRED_READ, hap.Perms.NOTIFY];
  }

  // One class factory, so twelve near-identical class bodies never exist.
  function define({ displayName, uuid, format, domain = {} }: CharacteristicDefinition): CharacteristicClass {
    return class extends hap.Characteristic {
      static readonly UUID = uuid;

      constructor() {
        super(displayName, uuid, { format: formats[format], perms: readOnlyPerms(), ...domain });

        this.value = this.getDefaultValue();
      }
    };
  }

  return {
    RawWaterLevelCode: define({
      displayName: 'Raw Water Level Code',
      uuid: RAW_WATER_LEVEL_CODE_UUID,
      format: 'uint8',
      // The legal thermometer codes, which is the domain the family adapter
      // already refuses anything outside of.
      domain: { minValue: 0, maxValue: 31, minStep: 1, validValues: [0, 1, 3, 7, 15, 31] },
    }),
    PumpRunning: define({ displayName: 'Pump Running', uuid: PUMP_RUNNING_UUID, format: 'bool' }),
    PumpFault: define({ displayName: 'Pump Fault', uuid: PUMP_FAULT_UUID, format: 'bool' }),
    PumpFuseBlown: define({ displayName: 'Pump Fuse Blown', uuid: PUMP_FUSE_BLOWN_UUID, format: 'bool' }),
    WaterSensorFaultReported: define({ displayName: 'Water Sensor Fault Reported', uuid: WATER_SENSOR_FAULT_REPORTED_UUID, format: 'bool' }),
    MainsPowerPresent: define({ displayName: 'Mains Power Present', uuid: MAINS_POWER_PRESENT_UUID, format: 'bool' }),
    BatteryCharging: define({ displayName: 'Battery Charging', uuid: BATTERY_CHARGING_UUID, format: 'bool' }),
    BatteryVoltageLow: define({ displayName: 'Battery Voltage Low', uuid: BATTERY_VOLTAGE_LOW_UUID, format: 'bool' }),
    BatteryHealthCode: define({
      displayName: 'Battery Health Code',
      uuid: BATTERY_HEALTH_CODE_UUID,
      format: 'uint8',
      // Replace, Poor, Okay, Good, NA, and NotDetected: the codes the vendor can
      // legally send, published as reported and never arbitrated (D-008).
      domain: { validValues: [1, 2, 4, 8, 16, 32] },
    }),
    ProtectionHoursCode: define({
      displayName: 'Protection Hours Code',
      uuid: PROTECTION_HOURS_CODE_UUID,
      format: 'uint8',
      domain: { validValues: [1, 2, 4, 8] },
    }),
    ControllerLinkPresent: define({ displayName: 'Controller Link Present', uuid: CONTROLLER_LINK_PRESENT_UUID, format: 'bool' }),
    ControllerDataLastTrustedAt: define({
      displayName: 'Controller Data Last Trusted At',
      uuid: CONTROLLER_DATA_LAST_TRUSTED_AT_UUID,
      format: 'string',
    }),
    // The four pump record types. The plugin cannot see an activation from
    // before it ran, so the count is what it watched and the start is what the
    // count is counted from; both display names say so, because a controller
    // showing one characteristic and nothing else must still read true
    // (CTRL-01, D-12, D-020). Both timestamps follow
    // `ControllerDataLastTrustedAt`: an ISO-8601 string, with the empty string
    // meaning none observed rather than a fabricated time.
    ObservationStartedAt: define({
      displayName: 'Observation Start',
      uuid: OBSERVATION_STARTED_AT_UUID,
      format: 'string',
    }),
    ObservedActivationCount: define({
      displayName: 'Activations Observed Since Observation Start',
      uuid: OBSERVED_ACTIVATION_COUNT_UUID,
      format: 'uint32',
    }),
    LastObservedActivationAt: define({
      displayName: 'Last Observed Activation At',
      uuid: LAST_OBSERVED_ACTIVATION_AT_UUID,
      format: 'string',
    }),
    LastActivationWasTestActivity: define({
      displayName: 'Last Activation Was Self-Test',
      uuid: LAST_ACTIVATION_WAS_TEST_ACTIVITY_UUID,
      format: 'bool',
    }),
  };
}
