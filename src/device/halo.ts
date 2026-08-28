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
 * This module is a declaration only, and it stays that way until HALO hardware
 * supplies representative payloads. Its entry in the `ignoreFindings` list of
 * `.fallowrc.json` goes away when a production consumer arrives.
 */

/** The vendor `deviceTypeId` the plugin recognises as a HALO. */
export type HaloDeviceTypeId = 'wayneWaterHalo';
