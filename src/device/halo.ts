// SPDX-License-Identifier: MIT
/**
 * @fileoverview The HALO system's identity, and nothing else.
 *
 * HALO has no hardware-validation evidence behind it. Its data model, its
 * fault vocabulary, and its command shapes all differ from Gemini's, and its
 * `water_level` is a plain ordinal where Gemini's is a thermometer code. The
 * plugin therefore identifies a HALO and reports that it cannot drive one; it
 * does not decode a HALO field or send a HALO command. Declaring only the
 * identity is what keeps a known-but-unsupported device apart from a device
 * type nobody has ever seen, which is a different message to the user.
 *
 * The type stays declaration-only, but `HALO_DEVICE_TYPE_ID` and
 * `HALO_DISPLAY_NAME` are runtime values: the family registry needs a value it
 * can compare a discovered `deviceTypeId` against, which a type alone cannot
 * do.
 */

/** The vendor `deviceTypeId` the plugin recognises as a HALO. */
export type HaloDeviceTypeId = 'wayneWaterHalo';

/** The runtime value of {@link HaloDeviceTypeId}, for comparing a discovered `deviceTypeId`. */
export const HALO_DEVICE_TYPE_ID: HaloDeviceTypeId = 'wayneWaterHalo';

/** The product name the registry's `unsupported` outcome shows a user in a log line. */
export const HALO_DISPLAY_NAME = 'Wayne Water HALO';
