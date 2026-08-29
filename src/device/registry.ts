/**
 * @fileoverview Looks up which family adapter, if any, answers for one vendor
 * `deviceTypeId`.
 *
 * The registry is the family-neutral seam D-003 requires: it owns only the
 * deviceTypeId-to-adapter lookup, never a field decision, so account-wide
 * infrastructure never changes when a family is added. A lookup miss and a
 * known-but-unimplemented family are distinct outcomes, because they deserve
 * distinct explanations to the user (DEV-01).
 */

import { geminiFamily } from './gemini.js';
import { HALO_DEVICE_TYPE_ID, HALO_DISPLAY_NAME } from './halo.js';

import type { DeviceFamily } from './family.js';

/** The verdict on one vendor `deviceTypeId`. */
export type FamilyOutcome<T> =
  | { kind: 'implemented'; family: DeviceFamily<T> }
  | { kind: 'unsupported'; deviceTypeId: string; displayName: string }
  | { kind: 'unknown'; deviceTypeId: string };

/** Looks up the family adapter for one vendor `deviceTypeId`. */
export interface FamilyRegistry {
  lookup(deviceTypeId: string): FamilyOutcome<unknown>;
  /**
   * Records that a non-implemented outcome for `deviceId` was just explained,
   * and reports whether the caller should actually log it.
   *
   * Answers `true` the first time this `deviceId`/`deviceTypeId` pair is seen,
   * and `true` again if `deviceId` was last seen with a different
   * `deviceTypeId` (D-05). Answers `false` on every repeat of the same pair,
   * so a caller that logs only on `true` never repeats the same explanation
   * on every poll.
   */
  shouldLog(deviceId: string, deviceTypeId: string): boolean;
}

/**
 * Builds the family registry.
 *
 * The registry is a `Map` populated once at build time, never a switch
 * statement, so a future family is added here alone (DEV-02). Every
 * `deviceTypeId` neither map recognises answers `unknown`.
 *
 * `lookup` itself never logs and has no side effect: the log-cadence tracking
 * lives in `shouldLog`'s own closure-held map, a separate concern a caller
 * drives explicitly once per device per registry-observed change.
 */
export function createFamilyRegistry(): FamilyRegistry {
  const families = new Map<string, DeviceFamily<unknown>>([[geminiFamily.deviceTypeId, geminiFamily]]);
  const unsupportedFamilies = new Map<string, string>([[HALO_DEVICE_TYPE_ID, HALO_DISPLAY_NAME]]);
  const lastLoggedDeviceTypeId = new Map<string, string>();

  return {
    lookup(deviceTypeId: string): FamilyOutcome<unknown> {
      const family = families.get(deviceTypeId);

      if (family !== undefined) {
        return { kind: 'implemented', family };
      }

      const displayName = unsupportedFamilies.get(deviceTypeId);

      if (displayName !== undefined) {
        return { kind: 'unsupported', deviceTypeId, displayName };
      }

      return { kind: 'unknown', deviceTypeId };
    },

    shouldLog(deviceId: string, deviceTypeId: string): boolean {
      if (lastLoggedDeviceTypeId.get(deviceId) === deviceTypeId) {
        return false;
      }

      lastLoggedDeviceTypeId.set(deviceId, deviceTypeId);

      return true;
    },
  };
}
