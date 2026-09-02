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

import type { API, PlatformAccessory } from 'homebridge';

// The implementation lands in the commit after this one. Both parameters are
// named already so the signature the tests drive is the signature that ships.
export function markRestoredServicesStale(accessory: PlatformAccessory, hap: API['hap']): number {
  void accessory;
  void hap;

  return 0;
}
