// SPDX-License-Identifier: MIT
/**
 * @fileoverview Transient device occurrences, derived from consecutive canonical
 * snapshots.
 *
 * The vendor sends state, not an activity stream, so an occurrence is something
 * the plugin derives rather than something it receives. Occurrences are kept
 * apart from state on purpose: the current snapshot answers HomeKit reads,
 * while an occurrence updates a counter, a timestamp, or a notification. Two
 * identical heartbeats produce state twice and an occurrence never, which is
 * what stops duplicate activation records.
 *
 * This module is a declaration only. Its entry in the `ignoreFindings` list of
 * `.fallowrc.json` goes away when a production consumer arrives.
 */

/** What every device occurrence carries. */
export interface DeviceEventBase {
  /** The vendor identifier of the device the occurrence belongs to. */
  deviceId: string;
  /** Local time the plugin derived the occurrence. Never a device time. */
  observedAt: number;
}

/** The primary pump began running. */
export interface PrimaryPumpStarted extends DeviceEventBase {
  type: 'primary-pump-started';
}

/** The backup pump began running, which means the primary pump did not cope. */
export interface BackupPumpStarted extends DeviceEventBase {
  type: 'backup-pump-started';
}

/** A system self-test began, whether HomeKit or the vendor app started it. */
export interface SelfTestStarted extends DeviceEventBase {
  type: 'self-test-started';
}

/**
 * The device reported a backup-pump activation the plugin did not watch happen.
 *
 * A device timestamp can recover one activation that fell between polls. The
 * timestamp is the device's own, so it is what de-duplicates the record.
 */
export interface BackupPumpActivationRecovered extends DeviceEventBase {
  type: 'backup-pump-activation-recovered';
  /** Device time of the activation, as the device reported it. */
  deviceTimestamp: number;
}

/** Every occurrence the plugin derives from a state transition. */
export type DeviceEvent = PrimaryPumpStarted | BackupPumpStarted | SelfTestStarted | BackupPumpActivationRecovered;
