/**
 * @fileoverview One physical Basement Guardian system, published to HomeKit as
 * one accessory carrying several services.
 *
 * The accessory owns HomeKit and nothing else. It answers reads from cached
 * domain state and pushes characteristic updates; it never sees a raw vendor
 * payload, a shadow document, or a retry policy. Its identity is seeded by the
 * vendor `deviceId`, which is immutable: a device that starts reporting a
 * different `deviceTypeId` selects a different adapter but stays the same
 * physical accessory, so the user's automations survive.
 *
 * This module is a declaration only. Its entry in the `ignoreFindings` list of
 * `.fallowrc.json` goes away when a production consumer arrives.
 */

import type { ServiceDescriptor } from './services.js';
import type { DeviceSnapshot } from '../device/state.js';

/** One physical system as HomeKit sees it. */
export interface BasementGuardianAccessory {
  /** The vendor identifier that seeds the accessory UUID. It never changes. */
  readonly deviceId: string;
  /** Every service this accessory publishes, in a stable order. */
  readonly services: readonly ServiceDescriptor[];
  /**
   * Applies one canonical snapshot to the published characteristics.
   *
   * This is the only way state reaches HomeKit, so a value the accessory does
   * not receive here is a value HomeKit does not show.
   */
  update(snapshot: DeviceSnapshot): void;
}
