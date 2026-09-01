/**
 * @fileoverview Reaching a service the plugin published, and reading a value only the plugin can
 * have written.
 *
 * Every step module that reads HomeKit state resolves a named service the same way, through the
 * service catalogue, which is the one place a display name, a service type, and a subtype are
 * declared together. A step that restated any of the three would be asserting against an identity
 * a user's automations do not attach to (D-12).
 */

import { createServiceCatalogue } from '../../src/accessories/serviceCatalogue.js';

import type { FakeHapCharacteristic, FakeHapService, FakeServiceClass } from './fakeHap.js';
import type { FakeAccessory, FakeHomebridgeApi } from './fakeHomebridgeApi.js';
import type { API } from 'homebridge';

/**
 * The accessory a scenario's plugin is publishing onto now.
 *
 * Every scenario seeds exactly one physical device, so a step reads state back through the newest
 * accessory the plugin was handed. It is the registered one until a restart, and the one restored
 * from the cache afterwards: reading the registered one after a restart would read a detached
 * object still holding whatever the previous run published to it, which passes an assertion about
 * a value that came back without anything having brought it back.
 */
export function currentAccessory(homebridge: FakeHomebridgeApi): FakeAccessory | undefined {
  return homebridge.handedAccessories.at(-1);
}

/** Answers the service the catalogue publishes a named row on, or `undefined` when it is absent. */
export function serviceOf(homebridge: FakeHomebridgeApi, displayName: string): FakeHapService | undefined {
  const row = createServiceCatalogue(homebridge.hap as unknown as API['hap']).find((candidate) => candidate.displayName === displayName);

  if (row === undefined) {
    throw new Error(`the plugin publishes no ${displayName} service`);
  }

  // The catalogue declares its service classes against the real HAP types while the accessory
  // stand-in answers its own; the class is one runtime object, so the lookup needs the other view.
  return currentAccessory(homebridge)?.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);
}

/**
 * Answers a value only the plugin can have written, and `undefined` for anything else.
 *
 * HAP constructs every characteristic at its format default, and for both alarm characteristics and
 * for a control's `On` that default is the quiet state, so reading the value alone cannot tell a
 * published service from one the plugin never wrote to. Anything not pushed reads as absent, which
 * fails a step by name rather than passing on a default (D-014).
 */
export function pushedValue(characteristic: FakeHapCharacteristic | undefined): unknown {
  return characteristic?.pushed === true ? characteristic.value : undefined;
}
