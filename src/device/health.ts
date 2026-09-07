// SPDX-License-Identifier: MIT
/**
 * @fileoverview How the plugin is watching one device, and which parts of that
 * device's state it can still vouch for.
 *
 * An unknown, stale, omitted, or invalid vendor value never becomes a guessed
 * measurement or a normal default. The last valid value stays, and the narrowest
 * scope that owns the doubtful value is marked untrustworthy (D-014). This
 * projection carries that marking, so a HomeKit handler reads trust from one
 * place instead of inferring it.
 *
 * Every declaration here has a production consumer except `DeviceHealth`, the
 * aggregate projection nothing assembles yet. The account runtime derives
 * `MonitoringPath`, and the accessory tier reads `TrustScope`, `DistrustReason`,
 * and `UntrustedScope` directly.
 */

/**
 * How the plugin is currently receiving device state.
 *
 * REST polling alone is a working degraded path, not a failure: discovery can
 * succeed while the shadow connection does not, and the plugin keeps reporting
 * from polls while it retries the shadow in the background.
 */
export type MonitoringPath = 'shadow-and-poll' | 'poll-only' | 'unavailable';

/** The parts of a device's state that can lose trust on their own. */
export type TrustScope = 'connectivity' | 'water' | 'pump' | 'power' | 'battery' | 'fault' | 'self-test' | 'alarm-mute';

/**
 * Why one scope stopped being trustworthy.
 *
 * `controller-link-lost` is its own reason because the vendor cloud can answer
 * normally while the network module has lost its link to the pump controller.
 * Cloud success is not evidence that pump values are current.
 */
export type DistrustReason = 'stale' | 'unreachable' | 'invalid' | 'controller-link-lost';

/** One scope the plugin can no longer vouch for, and why. */
export interface UntrustedScope {
  scope: TrustScope;
  reason: DistrustReason;
  /** Local time the scope last carried a value the plugin still trusts. */
  lastTrustedAt: number | undefined;
}

/** What the plugin can currently say about one device. */
export interface DeviceHealth {
  deviceId: string;
  monitoringPath: MonitoringPath;
  /** Empty when every scope is trustworthy. Never a guessed normal default. */
  untrusted: readonly UntrustedScope[];
  /** Local time the plugin last received any state for this device. */
  lastReceivedAt: number | undefined;
}
