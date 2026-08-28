/**
 * @fileoverview The contract one device family implements to turn an opaque
 * snapshot into meaning.
 *
 * The canonical snapshot decodes nothing, so every field meaning lives behind
 * this boundary. The boundary matters because two families disagree about the
 * same field name: `water_level` is a thermometer code on one and a plain
 * ordinal on the other, and the wrong decoder does not fail. It produces a
 * plausible, wrong water level, which is the most safety-relevant value in the
 * system. The `deviceTypeId` selects the adapter once, at discovery, and never
 * changes the physical identity of the device.
 *
 * This module is a declaration only. Its entry in the `ignoreFindings` list of
 * `.fallowrc.json` goes away when a production consumer arrives.
 */

import type { DeviceSnapshot } from './state.js';

/** Something a family can ask its device to do. */
export type DeviceCapability = 'self-test' | 'alarm-mute';

/** How one field failed its family's contract. */
export type FieldViolationReason = 'missing' | 'wrong-type' | 'out-of-domain';

/** One field a snapshot did not supply in the form the family requires. */
export interface FieldViolation {
  field: string;
  reason: FieldViolationReason;
}

/**
 * The verdict on one snapshot.
 *
 * A snapshot that does not validate is never decoded. Refusing is what keeps a
 * vendor schema change from becoming a confidently wrong reading.
 */
export type FamilyValidation = { valid: true } | { valid: false; violations: readonly FieldViolation[] };

/**
 * The request body the vendor device-data route accepts.
 *
 * The payload differs per family for the same intent, and the wrong shape is
 * accepted and ignored rather than refused, so each family builds its own.
 */
export interface FamilyCommand {
  desiredData: Readonly<Record<string, unknown>>;
}

/**
 * One family adapter.
 *
 * `implemented` separates a device type this plugin knows about but cannot
 * drive from one it has never heard of. The two deserve different messages,
 * and only the adapter can tell them apart.
 */
export interface DeviceFamily<TDomainState> {
  /** The vendor `deviceTypeId` this adapter answers for. */
  readonly deviceTypeId: string;
  /** The product name to show a user in a log line. */
  readonly displayName: string;
  readonly implemented: boolean;
  validate(snapshot: DeviceSnapshot): FamilyValidation;
  decode(snapshot: DeviceSnapshot): TDomainState;
  capabilities(state: TDomainState): readonly DeviceCapability[];
  command(capability: DeviceCapability, requested: boolean): FamilyCommand;
}
