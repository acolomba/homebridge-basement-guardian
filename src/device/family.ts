// SPDX-License-Identifier: MIT
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
 */

import type { TrustScope } from './health.js';
import type { DeviceSnapshot } from './state.js';

/** Something a family can ask its device to do. */
export type DeviceCapability = 'self-test' | 'alarm-mute';

/** How one field failed its family's contract. */
export type FieldViolationReason = 'missing' | 'wrong-type' | 'out-of-domain';

/** One field a snapshot did not supply in the form the family requires. */
export interface FieldViolation {
  field: string;
  reason: FieldViolationReason;
  /**
   * The scope that stops being trustworthy while this field is invalid.
   *
   * One bad field deactivates one scope, never the whole device (D-014).
   * `undefined` marks a field no published service reads, so a violation on it
   * is still recorded and diagnosable without deactivating anything.
   */
  scope: TrustScope | undefined;
}

/**
 * The verdict on one snapshot.
 *
 * A verdict is reached before the same snapshot is decoded, and it names the
 * scopes that stop being trustworthy rather than refusing the whole payload:
 * one bad field costs one scope. `decode()` therefore runs on snapshots that
 * did not fully validate and is self-guarding, so a vendor schema change never
 * becomes a confidently wrong reading (D-014).
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

/** How full the sump pit is. */
export interface WaterState {
  /** The vendor code exactly as reported, published beside the percentage so the mapping stays checkable against a real pit. */
  levelCode: number;
  levelPercent: number;
  flooded: boolean;
}

/** What the two pumps are doing right now. */
export interface PumpState {
  primaryRunning: boolean;
  backupRunning: boolean;
  /**
   * The device's own time of the last reported backup activation, in Unix
   * seconds, or `undefined` when the device reports none.
   *
   * The unit is the device's, carried through unconverted: a consumer that
   * renders it converts at its own boundary, so no two readers can disagree
   * about which unit this member holds.
   */
  backupActivatedAt: number | undefined;
}

/** Mains power at the device. */
export interface PowerState {
  mainsPresent: boolean;
}

/** The backup battery's exact reported facts, and the two values a family derives from them. */
export interface BatteryState {
  charging: boolean;
  voltageLow: boolean;
  /** The vendor health code exactly as reported; its meaning lives behind the family boundary. */
  healthCode: number;
  /** The vendor protection-hours code exactly as reported. */
  protectionHoursCode: number;
  /** The documented protection-duration estimate, not a measured charge (D-012). */
  levelPercent: number;
  low: boolean;
}

/** The equipment faults a device reports, one member per fault adapter. */
export interface FaultState {
  primaryPumpFault: boolean;
  backupPumpFault: boolean;
  backupPumpFuseBlown: boolean;
  waterSensorFault: boolean;
  /** Reported rather than inverted: `true` means the network module still has its link to the pump controller. */
  controllerLinkPresent: boolean;
}

/** What the system self-test is doing, and when the device last ran one. */
export interface SelfTestState {
  running: boolean;
  /**
   * The device's own `test_timestamp`, in Unix seconds, carried through
   * unconverted, or `undefined` when the device has reported none.
   *
   * It is the device's clock, never the plugin's, so it is compared only
   * against other device timestamps and never against local time.
   */
  testedAt: number | undefined;
}

/** Whether the device's audible alarm is currently muted. */
export interface AlarmMuteState {
  muted: boolean;
}

/** What a device says about its own connection to the vendor cloud. */
export interface ConnectivityState {
  reportedOffline: boolean;
}

/** Device identification and radio diagnostics, which no safety scope owns. */
export interface DeviceMetadataState {
  mcuFirmwareVersion: string | undefined;
  wifiFirmwareVersion: string | undefined;
  mcuTargetVersion: string | undefined;
  wifiSignalDbm: number | undefined;
}

/**
 * One device's decoded state, one member per scope a published service reads.
 *
 * `undefined` means "this scope did not validate", never "this scope reported
 * nothing". The family reports the absence; only the accessory decides what a
 * consumer sees while a scope is absent, and it retains the last valid values
 * rather than publishing a default (D-014, RES-01).
 *
 * Every member is `| undefined` rather than optional, so a family that forgets a
 * scope fails to typecheck instead of silently omitting one.
 */
export interface ScopedDomainState {
  water: WaterState | undefined;
  pump: PumpState | undefined;
  power: PowerState | undefined;
  battery: BatteryState | undefined;
  fault: FaultState | undefined;
  connectivity: ConnectivityState | undefined;
  // The two control scopes are keyed by the `DeviceCapability` they answer for,
  // so the capability, the trust scope, and the decoded group are one string and
  // no mapping table can drift (D-02).
  'self-test': SelfTestState | undefined;
  'alarm-mute': AlarmMuteState | undefined;
  metadata: DeviceMetadataState | undefined;
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
  /**
   * Decodes every scope whose own fields all validated, and omits every scope
   * that did not.
   *
   * A partly-invalid snapshot still publishes current values for the scopes
   * that are still trustworthy. An omitted scope is never a default, a zero, or
   * a remembered value the adapter guessed at (D-014, RES-01).
   *
   * The caller passes the snapshot as it arrived, so an implementation checks
   * each scope's own fields itself rather than trusting the caller to have
   * refused an invalid payload first. Reading a field directly here would raise
   * on the first malformed value the vendor sends.
   */
  decode(snapshot: DeviceSnapshot): TDomainState;
  capabilities(state: TDomainState): readonly DeviceCapability[];
  command(capability: DeviceCapability, requested: boolean): FamilyCommand;
}
