/**
 * @fileoverview The vendor-defined services this plugin declares.
 *
 * Apple publishes no service that carries mains power at a sump controller, so
 * the exact reported fact needs a service of the plugin's own. It carries only
 * read-only characteristics, so no controller can write reported safety state
 * back onto the device (SAFE-08).
 *
 * The subclasses are declared inside the factory because `api.hap` is a runtime
 * value: HAP-NodeJS is never imported directly, so the base class and every
 * standard characteristic arrive through the injected namespace (D-006).
 *
 * `StatusActive` and `StatusFault` are declared optional here rather than added
 * on first use, because HAP warns on every restored accessory when a service
 * receives a characteristic its definition never declared, and because a
 * service restored from the Homebridge cache is a plain `Service` whose class
 * the running code no longer recognises.
 *
 * The `UUID` below is a published identity. It is a hard-coded random v4
 * literal rather than a value derived from a seed string, because a seed a
 * later edit could change would silently orphan the service on every installed
 * accessory while every test stayed green (D-015).
 */

import { createCustomCharacteristics } from './customCharacteristics.js';

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
  /** Mains power at the sump controller, carrying the reported fact rather than a derived alarm. */
  SumpMainsPowerService: ServiceClass;
}

// A fixed published identity: it must never change, and it is deliberately
// outside Apple's assigned base namespace (`-0000-1000-8000-0026BB765291`), so
// no future Apple type can collide with it (SAFE-08).
const SUMP_MAINS_POWER_SERVICE_UUID = 'fbb41424-0697-4ebe-ba89-7ba8ea254623';

/**
 * Answers the vendor-defined service types, built over one HAP namespace.
 *
 * Building them touches nothing outside itself: no accessory is read, no
 * service is added, and no HomeKit registration happens until a caller asks an
 * accessory for one of these types.
 */
export function createCustomServices(hap: API['hap']): CustomServices {
  const { MainsPowerPresent } = createCustomCharacteristics(hap);

  class SumpMainsPowerService extends hap.Service {
    static readonly UUID = SUMP_MAINS_POWER_SERVICE_UUID;

    constructor(displayName?: string, subtype?: string) {
      super(displayName, SumpMainsPowerService.UUID, subtype);

      this.addCharacteristic(MainsPowerPresent);
      this.addOptionalCharacteristic(hap.Characteristic.StatusActive);
      this.addOptionalCharacteristic(hap.Characteristic.StatusFault);
    }
  }

  return { SumpMainsPowerService };
}
