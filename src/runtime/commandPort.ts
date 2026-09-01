/**
 * The one thing a HomeKit control may ask the vendor to do.
 *
 * The HomeKit tier takes this by injection rather than reaching for the cloud
 * client, so a test hands in a recorder and asserts what a write did or did not
 * send, which is evidence about an absence that watching behaviour alone cannot
 * give: a refusal that sent nothing and a refusal that sent one request and
 * discarded the answer look identical from HomeKit. It also keeps the accessory
 * free of family knowledge -- the port takes a capability, and whoever
 * implements it builds the wire body (D-004, CTRL-05).
 */

import type { DeviceCapability } from '../device/family.js';

/** Why a command did not take effect, in the vocabulary the HomeKit tier maps to a HAP status. */
export type CommandFailure = 'vendor-error' | 'timed-out';

/** What one command attempt answered. */
export type CommandOutcome = { accepted: true } | { accepted: false; failure: CommandFailure };

/** The command surface a HomeKit control reaches the vendor through. */
export interface CommandPort {
  /**
   * Requests one capability change and answers whether the vendor accepted it.
   *
   * Exactly one attempt is made. A command that outlived its deadline may
   * already have reached the device, so nothing here retries it and nothing
   * here reports a failure as an acceptance (D-038).
   */
  send(deviceId: string, capability: DeviceCapability, requested: boolean): Promise<CommandOutcome>;
}
