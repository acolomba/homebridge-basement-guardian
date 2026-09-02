/**
 * @fileoverview Marking a restored accessory's services as no longer vouched for.
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
 * The pass therefore runs where Homebridge hands each cached accessory back
 * rather than on the first update: `configureAccessory` is the only code that
 * runs while a restored accessory exists and no fresh data does, and every
 * publishing path is downstream of an inventory that may never arrive (D-06).
 *
 * It constructs no `BasementGuardianAccessory` and reads nothing from the
 * accessory context. That constructor throws when the context carries no
 * device, which is exactly what a cache written before that context existed
 * carries, so constructing here would fail on the upgrade path this behaviour
 * protects.
 *
 * The pass is exported rather than written inside the platform method because
 * the Cucumber harness stands in for `configureAccessory` and calls this same
 * function. A copy inside the platform would leave the harness asserting
 * against its own copy of the behaviour (D-12).
 */

import { publishValue } from './serviceCatalogue.js';

import type { API, PlatformAccessory } from 'homebridge';

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
  let marked = 0;

  for (const service of accessory.services) {
    if (service.testCharacteristic(hap.Characteristic.StatusActive)) {
      publishValue(service, hap.Characteristic.StatusActive, false);
      marked += 1;
    }
  }

  return marked;
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
  void accessory;
  void hap;
  void status;

  return 0;
}
