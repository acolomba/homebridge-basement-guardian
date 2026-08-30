/**
 * @fileoverview The vendor-defined characteristics this plugin declares.
 *
 * Apple publishes no characteristic for "mains power is present at the sump
 * controller", so the exact reported fact needs a type of the plugin's own.
 * Every one declared here is read-only -- `PAIRED_READ` and `NOTIFY`, never
 * `PAIRED_WRITE` -- because a writable characteristic would offer a controller
 * a path to overwrite reported safety state with a value no device ever sent
 * (SAFE-08).
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

import type { API, Characteristic, WithUUID } from 'homebridge';

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
  /** Mains power at the sump controller, exactly as the vendor reports it. */
  MainsPowerPresent: CharacteristicClass;
}

// A fixed published identity: it must never change, and it is deliberately
// outside Apple's assigned base namespace (`-0000-1000-8000-0026BB765291`), so
// no future Apple type can collide with it (SAFE-08).
const MAINS_POWER_PRESENT_UUID = 'b014b110-41bb-4dec-a681-4a331455425e';

/**
 * Answers the vendor-defined characteristic types, built over one HAP namespace.
 *
 * Building them touches nothing outside itself: no accessory, no service, and
 * no HomeKit registration. A caller that needs the same type twice calls this
 * twice and gets two classes carrying one identifier, which every HAP lookup
 * matches on, so the identifier rather than the class is what stays stable.
 */
export function createCustomCharacteristics(hap: API['hap']): CustomCharacteristics {
  class MainsPowerPresent extends hap.Characteristic {
    static readonly UUID = MAINS_POWER_PRESENT_UUID;

    constructor() {
      super('Mains Power Present', MainsPowerPresent.UUID, {
        format: hap.Formats.BOOL,
        perms: [hap.Perms.PAIRED_READ, hap.Perms.NOTIFY],
      });

      this.value = this.getDefaultValue();
    }
  }

  return { MainsPowerPresent };
}
