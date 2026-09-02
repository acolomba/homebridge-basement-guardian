/**
 * @fileoverview The three passes over an accessory the plugin cannot vouch for,
 * none of which constructs a `BasementGuardianAccessory`.
 *
 * All three run where no fresh data exists and none may be coming: two when
 * Homebridge hands a cached accessory back, the third when the vendor has
 * refused the account credentials and the runtime has stopped for good. None
 * builds a `BasementGuardianAccessory`, because that constructor throws when the
 * accessory context names no device -- the exact shape a cache written by an
 * older release carries -- and because a run whose first grant was refused never
 * reaches discovery and has none to build on.
 *
 * They differ in what they leave behind. The two restart passes withdraw trust
 * and refuse a press while leaving the tile readable, because a restart recovers
 * by itself once a poll succeeds. The credential pass makes the tile unreadable,
 * because a refused credential never recovers by itself and an automatic retry
 * extends the vendor's thirty-day block rather than merely failing (D-10).
 *
 * HAP serializes each characteristic's value into the Homebridge accessory
 * cache and serves it from the moment the bridge publishes. This plugin
 * publishes nothing until the first successful REST inventory, which is
 * unbounded while the vendor cloud is unreachable -- the failed restart
 * `RES-04` names. Between those two moments a controller reads what the
 * previous run left, with `Status Active` still saying the plugin vouches for
 * it. That is the false normal this project exists to prevent, and a restart
 * that never reaches the cloud leaves it standing indefinitely.
 *
 * The same window leaves the control Switches carrying `On` and carrying no
 * write handler, and HAP answers a write with no handler by storing the value
 * and reporting success. So the toggle flips, an automation built on it fires,
 * and nothing was sent. Nothing being sent is correct; reporting success for it
 * is the false normal on the control surface, which is why the second restart
 * pass exists (RES-04, D-07).
 *
 * The passes therefore run where Homebridge hands each cached accessory back
 * rather than on the first update: `configureAccessory` is the only code that
 * runs while a restored accessory exists and no fresh data does, and every
 * publishing path is downstream of an inventory that may never arrive (D-06).
 *
 * They construct no `BasementGuardianAccessory` and read nothing from the
 * accessory context. That constructor throws when the context carries no
 * device, which is exactly what a cache written before that context existed
 * carries, so constructing here would fail on the upgrade path this behaviour
 * protects.
 *
 * The passes are exported rather than written inside the platform method
 * because the Cucumber harness stands in for `configureAccessory` and calls
 * these same functions. A copy inside the platform would leave the harness
 * asserting against its own copy of the behaviour (D-12).
 */

import { bindRestoredControlRefusal } from './controls.js';
import { publishPersistentFailure, publishValue } from './serviceCatalogue.js';

import type { CharacteristicClass } from './customCharacteristics.js';
import type { Timers } from '../runtime/timers.js';
import type { API, Logging, PlatformAccessory, Service } from 'homebridge';

// The one walk all three passes make: every restored service carrying the
// characteristic that decides the pass applies to it, acted on and counted.
//
// It is extracted rather than written out three times because the three differ
// only in that guard and that act, and a guard tightened in one copy and not
// the others would silently change which services a pass reaches. The health
// gate fails a build on a third near-identical block as well, so keeping the
// copies was not an option either.
//
// The guard stays `testCharacteristic` for every pass. A service that never
// carried the characteristic does not gain one, because adding a characteristic
// on upgrade changes a published identity a user's automations may already
// attach to, and a cache an older release wrote is exactly the input these
// passes exist to handle.
function overServicesCarrying(accessory: PlatformAccessory, guard: CharacteristicClass, act: (service: Service) => void): number {
  let reached = 0;

  for (const service of accessory.services) {
    if (service.testCharacteristic(guard)) {
      act(service);
      reached += 1;
    }
  }

  return reached;
}

/**
 * Withdraws trust from every restored service that already reports it, and
 * answers how many it withdrew.
 *
 * The count is the assertable evidence that the pass did work. A pass that
 * walked an empty service list and a pass that marked every service report the
 * same silent success otherwise, which is the failure this tier already pays a
 * module floor to keep out of a static gate.
 *
 * `testCharacteristic` guards each push, so a service that never carried
 * `Status Active` does not gain one. That narrowing is deliberate: adding a
 * characteristic on upgrade changes a published identity a user's automations
 * may already attach to, and a row the plugin never published has nothing stale
 * to mark.
 *
 * The push goes through `publishValue` and never `setCharacteristic`. On a
 * control's `On` the latter routes through the write path and becomes a command
 * this plugin issued to the device, and the accessories tier carries one write
 * verb precisely so that cannot happen by accident.
 */
export function markRestoredServicesStale(accessory: PlatformAccessory, hap: API['hap']): number {
  return overServicesCarrying(accessory, hap.Characteristic.StatusActive, (service) => {
    publishValue(service, hap.Characteristic.StatusActive, false);
  });
}

/**
 * Refuses a press on every restored control, and answers how many controls it
 * armed.
 *
 * The guard is the control write surface itself, so the pass reaches exactly
 * the services a controller can act on and leaves every sensor alone. A sensor
 * that gained a handler would gain a characteristic it never published, which
 * changes a published identity a user's automations may already attach to.
 *
 * The count is the assertable evidence that the pass did work, for the same
 * reason the marking pass answers one: a walk over an empty service list and a
 * walk that armed every control report the same silent success otherwise.
 *
 * The refusal itself lives in the control module, beside every other local
 * refusal, its status table and its clearing push, so a restored control and a
 * live one cannot answer one condition two ways (D-07, D-08).
 */
export function refuseRestoredControls(accessory: PlatformAccessory, hap: API['hap'], log: Logging, timers: Timers): number {
  return overServicesCarrying(accessory, hap.Characteristic.On, (service) => {
    bindRestoredControlRefusal({ hap, log, timers, service, accessoryName: accessory.displayName });
  });
}

/**
 * Makes every service on one accessory unreadable under a named status, and
 * answers how many it marked.
 *
 * A refused credential is account-wide: one account, one authentication, one
 * poll loop. Marking a single service would imply the others are fine, so every
 * service that reports whether the plugin vouches for it is made unreadable
 * together (D-10).
 *
 * The pass lives here, beside the restart pass, for the same two reasons that
 * one does. It walks the accessory's own services and constructs no
 * `BasementGuardianAccessory`: a run whose first grant the vendor refused never
 * reaches discovery, so none exists to walk, and building one would throw on a
 * context that names no device anyway. And it is exported rather than written
 * inside the platform, so the Cucumber harness drives this code rather than a
 * copy of it (D-12).
 *
 * `testCharacteristic` guards each push exactly as it does above, so an upgrade
 * over a cache an older release wrote adds no characteristic to a service that
 * never carried one, and the count is the assertable evidence that the pass did
 * work rather than walk an empty list.
 */
export function markServicesUnreadable(accessory: PlatformAccessory, hap: API['hap'], status: number): number {
  return overServicesCarrying(accessory, hap.Characteristic.StatusActive, (service) => {
    publishPersistentFailure(hap, service, hap.Characteristic.StatusActive, status);
  });
}
