/**
 * @fileoverview What Homebridge stores alongside one restored accessory.
 *
 * Homebridge writes this record to disk in plain text and keeps it in backups,
 * so it holds no credential, no token, no temporary AWS credential, and no raw
 * vendor response. It does hold the vendor `deviceId`, which embeds the
 * account identifier; that value is treated as non-sensitive here, and only
 * public artifacts (fixtures, committed samples, and anything published)
 * still keep it out (D-01, D-027).
 *
 * It also holds no telemetry snapshot and no timer. A stored snapshot would be
 * a second source of safety state that nothing refreshes, and it would read as
 * current after a restart. What survives a restart is what the plugin observed
 * over time, which the cloud does not report: how many times each pump ran and
 * when it last ran, plus the vendor name last adopted for the display name
 * (D-030).
 */

/** What the plugin has observed about one pump since it started watching it. */
export interface PumpObservation {
  /**
   * Local time the plugin began observing this pump.
   *
   * The count below is meaningless without it: the plugin cannot see
   * activations from before it ran, so it reports what it watched rather than
   * a lifetime total the device never supplied.
   */
  observationStartedAt: number;
  /** Activations observed since `observationStartedAt`. */
  activationCount: number;
  /** Local time of the last observed activation. */
  lastActivationAt: number | undefined;
}

/**
 * The highest device timestamp already turned into an activation record.
 *
 * A device timestamp can recover an activation that fell between polls, and
 * the same timestamp arrives again on every later payload. Keeping the
 * watermark per field is what stops one activation from being counted twice.
 */
export interface ActivationWatermarks {
  backupPumpTimestamp: number | undefined;
  testTimestamp: number | undefined;
}

/** Everything Homebridge persists for one accessory. */
export interface AccessoryContext {
  /** The immutable vendor identifier this accessory was created for. */
  deviceId: string;
  /** The adapter selector last seen. It never changes physical identity. */
  deviceTypeId: string;
  serialNumber: string;
  primaryPump: PumpObservation;
  backupPump: PumpObservation;
  watermarks: ActivationWatermarks;
  /** The vendor name last adopted for this accessory's display name (D-030). */
  lastVendorName: string;
}
