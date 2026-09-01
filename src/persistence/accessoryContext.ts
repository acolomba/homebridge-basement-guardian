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
 *
 * Every observation member below is new in this release, so the only migration
 * that exists is absent to seeded: there is no earlier record shape to read,
 * convert, or version. That is why each is optional rather than defaulted --
 * an installation restored from before this release carries the device
 * identity and the vendor name and nothing else, and the plugin must be able
 * to tell "never observed" from "observed nothing" (D-08, D-020).
 */

/** What the plugin has observed about one pump since it started watching it. */
export interface PumpObservation {
  /**
   * Milliseconds, local, at which the plugin began observing this pump.
   *
   * The count below is meaningless without it: the plugin cannot see
   * activations from before it ran, so it reports what it watched rather than
   * a lifetime total the device never supplied.
   */
  observationStartedAt: number;
  /** Activations observed since `observationStartedAt`. */
  activationCount: number;
  /**
   * Milliseconds at which the last observed activation happened, from one of
   * exactly two sources.
   *
   * A watched edge -- a reported running value the plugin saw move from
   * `false` to `true` -- carries the plugin's own receipt time for the
   * snapshot that carried the `true`. A recovered activation, which the device
   * evidenced through a timestamp newer than the stored watermark, carries the
   * device's own value converted from Unix seconds. Both are milliseconds by
   * the time they are stored, because the characteristic that publishes this
   * renders it as an ISO-8601 date and a value left in seconds renders as 1970
   * (D-11).
   */
  lastActivationAt: number | undefined;
  /**
   * Whether the last observed activation was self-test activity.
   *
   * Absent means the plugin has not earned a label, which is a different thing
   * from a label of `false`: `false` asserts the last activation was not a
   * test, and asserting that from inputs which did not decode is a claim the
   * plugin cannot make. The label is computed only once the test is reported
   * finished and both device timestamps have been stable across two
   * observations; anything else leaves the previous label where it was
   * (D-13, D-014).
   */
  lastActivationWasTestActivity?: boolean;
}

/**
 * The highest device timestamp already turned into an activation record.
 *
 * A device timestamp can recover an activation that fell between polls, and
 * the same timestamp arrives again on every later payload. Keeping the
 * watermark per field is what stops one activation from being counted twice.
 *
 * Both members hold the device's own Unix seconds, exactly as the device sent
 * them and unconverted. A watermark is compared only against a later value
 * from the same device clock, and the two are compared only with each other --
 * never against local time, whose measured offset from the device is a few
 * seconds, and on which no exact-second logic may be built (D-11, D-13).
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
  /**
   * What the plugin observed about the primary pump, absent until it has
   * observed anything.
   *
   * Absent is the ordinary first-run state rather than an error: an
   * installation restored from before this release carries no observation at
   * all, so there is nothing to migrate from and the seeding path is the only
   * one that has ever existed.
   */
  primaryPump?: PumpObservation;
  /** What the plugin observed about the backup pump, absent on a first run for the same reason. */
  backupPump?: PumpObservation;
  /** The device timestamps already accounted for, absent on a first run for the same reason. */
  watermarks?: ActivationWatermarks;
  /** The vendor name last adopted for this accessory's display name (D-030). */
  lastVendorName: string;
}
