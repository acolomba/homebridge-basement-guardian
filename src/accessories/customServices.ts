/**
 * @fileoverview The vendor-defined services this plugin declares.
 *
 * Apple publishes no service that carries a sump pit, a pump, mains power at a
 * sump controller, or a backup battery's exact vendor facts, so each of those
 * needs a service of the plugin's own. Every vendor-defined characteristic they
 * carry is read-only, so no controller can write reported safety state back
 * onto the device (SAFE-08). The one writable member is Apple's own
 * `ConfiguredName`, which names the service for a controller and carries no
 * device state: the plugin registers no set handler for it, HAP stores the
 * write and Homebridge persists it to the accessory cache, and nothing written
 * there reaches the device. The subtype is untouched, so a rename orphans no
 * automation, scene, or notification.
 *
 * The subclasses are declared inside the factory because `api.hap` is a runtime
 * value: HAP-NodeJS is never imported directly, so the base class and every
 * standard characteristic arrive through the injected namespace (D-006).
 *
 * `StatusActive`, `StatusFault`, and `ConfiguredName` are declared optional on
 * every service here rather than added on first use, because HAP warns on every
 * restored accessory when a service receives a characteristic its definition
 * never declared, and because a service restored from the Homebridge cache is a
 * plain `Service` whose class the running code no longer recognises. The same
 * rule is what lets a later release add the pump observation-epoch,
 * observed-count, and last-activation characteristics to an already-published
 * `PumpService` without changing its subtype: the accessory's
 * characteristic-repair guard declares an undeclared characteristic before
 * pushing it, which suppresses the warning HAP otherwise emits, and the subtype
 * -- the one string that must never change -- is untouched.
 *
 * `PumpService` declares `PumpFuseBlown` optional for the same reason: the
 * backup pump reports a fuse fact and the primary pump does not, so one service
 * class under two subtypes carries both without either needing a class of its
 * own.
 *
 * No service here uses filter-maintenance semantics, for battery health or for
 * anything else (D-021, SAFE-06), and none carries Wi-Fi signal strength
 * (D-016).
 *
 * Each `UUID` below is a published identity. It is a hard-coded random v4
 * literal rather than a value derived from a seed string, because a seed a
 * later edit could change would silently orphan the service on every installed
 * accessory while every test stayed green (D-015).
 */

import { createCustomCharacteristics } from './customCharacteristics.js';

import type { CharacteristicClass } from './customCharacteristics.js';
import type { API, Service, WithUUID } from 'homebridge';

/**
 * A service type, in the form HAP's own lookups and `addService` accept one.
 *
 * The two-argument construct signature is the one every service definition
 * carries, so `addService(class, displayName, subtype)` reads as what it is;
 * the static `UUID` is what lets `getServiceById` match a service restored from
 * the Homebridge cache, whose class the running code no longer recognises.
 */
export type ServiceClass = WithUUID<typeof Service> & (new (displayName?: string, subtype?: string) => Service);

/** Every vendor-defined service, keyed by the name a catalogue row publishes it under. */
export interface CustomServices {
  /** The sump pit's mapped level and the raw vendor code it came from, side by side (D-015). */
  SumpPitService: ServiceClass;
  /** One pump's live running state and its own reported faults, under a subtype per pump. */
  PumpService: ServiceClass;
  /** Mains power at the sump controller, carrying the reported fact rather than a derived alarm. */
  SumpMainsPowerService: ServiceClass;
  /** The backup battery's exact vendor codes, beside the standard Battery service's estimates (D-008). */
  BackupBatteryService: ServiceClass;
}

// Fixed published identities: none of them may ever change, and each is
// deliberately outside Apple's assigned base namespace
// (`-0000-1000-8000-0026BB765291`), so no future Apple type can collide with one
// (SAFE-08).
const SUMP_PIT_SERVICE_UUID = 'ed31d704-44c8-4f20-9de0-6f29b33ef607';
const PUMP_SERVICE_UUID = '523f059e-deaa-4674-bbb2-980f9f7da7ec';
const SUMP_MAINS_POWER_SERVICE_UUID = 'fbb41424-0697-4ebe-ba89-7ba8ea254623';
const BACKUP_BATTERY_SERVICE_UUID = 'eb139c1e-aa1d-4318-bee9-60a338d99686';

/** One vendor-defined service, in the form the class factory below builds one from. */
interface ServiceDefinition {
  uuid: string;
  /** The facts the service always carries, so a reader never has to ask whether it declared them. */
  required: readonly CharacteristicClass[];
  /** The facts only some subtypes of the service carry, beyond the two status characteristics every one declares. */
  optional?: readonly CharacteristicClass[];
}

/**
 * Answers the vendor-defined service types, built over one HAP namespace.
 *
 * Building them touches nothing outside itself: no accessory is read, no
 * service is added, and no HomeKit registration happens until a caller asks an
 * accessory for one of these types.
 */
export function createCustomServices(hap: API['hap']): CustomServices {
  const characteristics = createCustomCharacteristics(hap);

  // Every service here declares all three, because the accessory pushes
  // `StatusActive` on every published row, `StatusFault` on the service that
  // owns a condition, and `ConfiguredName` on every service it names.
  const sharedCharacteristics: readonly CharacteristicClass[] = [
    hap.Characteristic.StatusActive,
    hap.Characteristic.StatusFault,
    hap.Characteristic.ConfiguredName,
  ];

  // One class factory, so four near-identical class bodies never exist.
  function define({ uuid, required, optional = [] }: ServiceDefinition): ServiceClass {
    return class extends hap.Service {
      static readonly UUID = uuid;

      constructor(displayName?: string, subtype?: string) {
        super(displayName, uuid, subtype);

        for (const characteristic of required) {
          this.addCharacteristic(characteristic);
        }

        for (const characteristic of [...optional, ...sharedCharacteristics]) {
          this.addOptionalCharacteristic(characteristic);
        }
      }
    };
  }

  return {
    SumpPitService: define({
      uuid: SUMP_PIT_SERVICE_UUID,
      required: [hap.Characteristic.WaterLevel, characteristics.RawWaterLevelCode],
      optional: [characteristics.WaterSensorFaultReported],
    }),
    // The four record characteristics are optional and `PumpRunning` stays the
    // one required fact. `ensureService` gates a row on its projection length,
    // and that gate is sound only while every *required* characteristic of a
    // service class comes from a scope the row is still publishing from. The
    // record values come from the accessory's own observation rather than from
    // the `pump` scope, so a required record characteristic would be
    // constructed the moment the row published its pump boolean and left at
    // HAP's format default -- presenting a count of zero, an empty observation
    // start, and a last activation that was not a self-test as fact
    // (CTRL-01, D-009, SAFE-08).
    PumpService: define({
      uuid: PUMP_SERVICE_UUID,
      required: [characteristics.PumpRunning],
      optional: [
        characteristics.PumpFault,
        characteristics.PumpFuseBlown,
        characteristics.ObservationStartedAt,
        characteristics.ObservedActivationCount,
        characteristics.LastObservedActivationAt,
        characteristics.LastActivationWasTestActivity,
      ],
    }),
    SumpMainsPowerService: define({ uuid: SUMP_MAINS_POWER_SERVICE_UUID, required: [characteristics.MainsPowerPresent] }),
    BackupBatteryService: define({
      uuid: BACKUP_BATTERY_SERVICE_UUID,
      required: [characteristics.BatteryCharging, characteristics.BatteryVoltageLow, characteristics.BatteryHealthCode, characteristics.ProtectionHoursCode],
    }),
  };
}
