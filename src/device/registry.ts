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

import type { DeviceFamily } from './family.js';

/** The verdict on one vendor `deviceTypeId`. */
export type FamilyOutcome<T> =
  | { kind: 'implemented'; family: DeviceFamily<T> }
  | { kind: 'unsupported'; deviceTypeId: string; displayName: string }
  | { kind: 'unknown'; deviceTypeId: string };

/** Looks up the family adapter for one vendor `deviceTypeId`. */
export interface FamilyRegistry {
  lookup(deviceTypeId: string): FamilyOutcome<unknown>;
}

/**
 * Builds the family registry.
 *
 * The registry is a `Map` populated once at build time, never a switch
 * statement, so a future family is added here alone (DEV-02). Every
 * `deviceTypeId` this build does not recognise answers `unknown`; HALO's
 * `unsupported` branch arrives with its own adapter.
 */
export function createFamilyRegistry(): FamilyRegistry {
  const families = new Map<string, DeviceFamily<unknown>>([[geminiFamily.deviceTypeId, geminiFamily]]);

  return {
    lookup(deviceTypeId: string): FamilyOutcome<unknown> {
      const family = families.get(deviceTypeId);

      if (family === undefined) {
        return { kind: 'unknown', deviceTypeId };
      }

      return { kind: 'implemented', family };
    },
  };
}
