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
import type { ServiceRow } from '../../src/accessories/serviceCatalogue.js';
import type { API } from 'homebridge';

/**
 * The accessory a scenario's plugin is publishing onto now.
 *
 * Every scenario seeds exactly one physical device, so a step reads state back through the newest
 * accessory the plugin was handed. It is the registered one until a restart, and the one restored
 * from the cache afterwards: reading the registered one after a restart would read a detached
 * object still holding whatever the previous run published to it, which passes an assertion about
 * a value that came back without anything having brought it back.
 *
 * One device is the default shape, not the only one: an account carrying several systems hands over
 * one accessory per system, and a step meaning a particular one reaches for `accessoryNamed`.
 */
export function currentAccessory(homebridge: FakeHomebridgeApi): FakeAccessory | undefined {
  return homebridge.handedAccessories.at(-1);
}

/**
 * The accessory the plugin published for one named system.
 *
 * The name is the vendor name the account carries for that device, which is what the plugin
 * constructs the accessory under, so a scenario names a pump the way its owner does. A name matching
 * none throws rather than answering another accessory: a fallback would let every assertion in a
 * multi-device scenario read one system twice and pass whether or not the other was ever published.
 *
 * The last match is the answer for the reason `currentAccessory` gives -- a restart hands the same
 * name back a second time, and the earlier object is detached and still holding what the previous run
 * left on it.
 */
function accessoryNamed(homebridge: FakeHomebridgeApi, accessoryName: string): FakeAccessory {
  const accessory = homebridge.handedAccessories.filter((candidate) => candidate.displayName === accessoryName).at(-1);

  if (accessory === undefined) {
    const published = homebridge.handedAccessories.map((candidate) => candidate.displayName).join(', ');

    throw new Error(`the plugin published no ${accessoryName} accessory; it published: ${published}`);
  }

  return accessory;
}

// The display name, the service class and the subtype are declared together in the catalogue and
// nowhere else, so both resolutions below read the row from here rather than restating any of the
// three (D-12).
function catalogueRow(homebridge: FakeHomebridgeApi, displayName: string): ServiceRow {
  const row = createServiceCatalogue(homebridge.hap as unknown as API['hap']).find((candidate) => candidate.displayName === displayName);

  if (row === undefined) {
    throw new Error(`the plugin publishes no ${displayName} service`);
  }

  return row;
}

// The catalogue declares its service classes against the real HAP types while the accessory stand-in
// answers its own; the class is one runtime object, so the lookup needs the other view.
function serviceOn(accessory: FakeAccessory | undefined, row: ServiceRow): FakeHapService | undefined {
  return accessory?.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);
}

/** Answers the service the catalogue publishes a named row on, or `undefined` when it is absent. */
export function serviceOf(homebridge: FakeHomebridgeApi, displayName: string): FakeHapService | undefined {
  return serviceOn(currentAccessory(homebridge), catalogueRow(homebridge, displayName));
}

/** The same service on one named system's accessory, for a scenario seeding more than one. */
export function serviceOnNamed(homebridge: FakeHomebridgeApi, accessoryName: string, displayName: string): FakeHapService | undefined {
  return serviceOn(accessoryNamed(homebridge, accessoryName), catalogueRow(homebridge, displayName));
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
