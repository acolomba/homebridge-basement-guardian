/**
 * @fileoverview CTRL-01: what this plugin watched each pump do, and nothing the device reported.
 *
 * The cloud reports a pump's live running state and one timestamp for the
 * backup pump. It reports no activation count and no lifetime history, so the
 * only count that can exist is the one built here, out of what the plugin saw
 * while it was running. That is why every record carries the moment observation
 * began beside its count: the number means nothing without it (D-020).
 *
 * Three things can go quietly wrong in a record of this shape, and each has a
 * rule of its own below. A run already in progress at the first observation
 * would be counted again on every restart that lands mid-cycle (D-009). A
 * device timestamp stored in the device's own Unix seconds would render as a
 * date in 1970 the moment it reached a characteristic (D-011). And a watched
 * activation followed by the device's own timestamp for the same physical run
 * would be counted twice, because the device publishes that timestamp only
 * after the pump stops (D-010).
 *
 * There is exactly one count per pump and every observed run is in it,
 * self-tests included. Whether the last activation was self-test activity is a
 * label on the record and nothing more: it never delays or suppresses a live
 * activation, and it is left unwritten rather than set to `false` when the
 * inputs it needs did not decode (D-013, C-001).
 *
 * Nothing here defers and nothing here reads a clock. Every time it uses
 * arrives on the observation, and the only write to disk is one `persist()` per
 * observation that actually changed something.
 */

import type { ActivationWatermarks, PumpObservation } from '../persistence/accessoryContext.js';
import type { AccessoryStore } from '../runtime/accessoryStore.js';
import type { Logging } from 'homebridge';

/** What one second of a device timestamp is worth in the milliseconds every stored time is in. */
const MILLISECONDS_PER_SECOND = 1000;

/** One decoded snapshot, in the only shape this module reads one. */
export interface PumpRecordsObservation {
  /** The plugin's own receipt time for this snapshot, in milliseconds. */
  receivedAt: number;
  primaryRunning: boolean | undefined;
  backupRunning: boolean | undefined;
  /** The device's own backup-pump timestamp, in the device's own Unix seconds. */
  backupActivatedAt: number | undefined;
  testRunning: boolean | undefined;
  /** The device's own self-test timestamp, in the device's own Unix seconds. */
  testedAt: number | undefined;
}

/** What one pump's record currently says, in the units the accessory publishes from. */
export interface PumpRecordValues {
  /** Milliseconds, local, at which observation of this pump began. */
  observationStartedAt: number;
  activationCount: number;
  /** Milliseconds, local, of the last observed activation, or absent when none has been observed. */
  lastActivationAt: number | undefined;
  /** Absent until the plugin has earned the label, which is a different thing from `false`. */
  lastActivationWasTestActivity: boolean | undefined;
}

/** The persisted members this module holds, as an accessory's stored context carries them. */
export interface PumpRecordsContext {
  primaryPump?: PumpObservation;
  backupPump?: PumpObservation;
  watermarks?: ActivationWatermarks;
}

/** Everything the records module needs, by injection. */
export interface PumpRecordsOptions {
  context: PumpRecordsContext;
  store: AccessoryStore;
  log: Logging;
}

/** Holds each pump's record across observations. */
export interface PumpRecords {
  /**
   * Records one decoded snapshot.
   *
   * It schedules nothing, awaits nothing, and reads no clock, and it asks for
   * one write to disk when a stored value actually changed and none otherwise.
   */
  observe(observation: PumpRecordsObservation): void;
  readonly primary: PumpRecordValues;
  readonly backup: PumpRecordValues;
}

// The three stored members, held together because they are resumed together and replaced together.
interface StoredRecord {
  primaryPump: PumpObservation;
  backupPump: PumpObservation;
  watermarks: ActivationWatermarks;
}

// The two device values as the previous observation reported them, which is what makes "stable
// across two observations" answerable without a clock.
interface PreviousDeviceTimes {
  backupActivatedAt: number | undefined;
  testedAt: number | undefined;
}

function isNumberOrAbsent(value: unknown): boolean {
  return value === undefined || typeof value === 'number';
}

// A record restored from the Homebridge cache is whatever JSON was on disk, whatever its declared
// type promises, so it is checked before it is resumed. The narrowing assertions below are safe
// because every member they reach for is read back through a `typeof` test.
function isPumpObservation(value: unknown): value is PumpObservation {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<PumpObservation>;
  const label = candidate.lastActivationWasTestActivity;

  return (
    typeof candidate.observationStartedAt === 'number' &&
    typeof candidate.activationCount === 'number' &&
    isNumberOrAbsent(candidate.lastActivationAt) &&
    (label === undefined || typeof label === 'boolean')
  );
}

function isActivationWatermarks(value: unknown): value is ActivationWatermarks {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ActivationWatermarks>;

  return isNumberOrAbsent(candidate.backupPumpTimestamp) && isNumberOrAbsent(candidate.testTimestamp);
}

// An activation is a `false` this module saw become a `true`. A run already in progress at the
// first observation is not counted: counting it would add a second activation for one physical run
// on every restart that lands mid-cycle, and for the primary pump nothing could ever detect or
// correct that, because the device reports no primary timestamp. The live sensor still reports the
// pump running truthfully; only the count abstains (D-009).
function watchedAnActivation(previousRunning: boolean | undefined, reportedRunning: boolean | undefined): boolean {
  return previousRunning === false && reportedRunning === true;
}

// An undecoded running value neither counts nor clears. Leaving the previous reported value where
// it was is what stops an undecoded snapshot followed by a `true` from manufacturing an edge.
function rememberedRunning(previousRunning: boolean | undefined, reportedRunning: boolean | undefined): boolean | undefined {
  return reportedRunning ?? previousRunning;
}

// The device evidences an activation the plugin never watched when it reports a timestamp past the
// one already accounted for. The comparison is strictly greater-than, so the same timestamp
// arriving again on every later payload recovers nothing (D-010).
function evidencesAMissedActivation(watermark: number | undefined, reportedAt: number | undefined): reportedAt is number {
  return reportedAt !== undefined && (watermark === undefined || reportedAt > watermark);
}

// The device's timestamps are its own Unix seconds and every stored time is milliseconds, so the
// one conversion happens here and nowhere else. The rule forbidding arithmetic on a device
// timestamp is about comparing it against local time, whose measured offset from the device is a
// few seconds; a unit conversion compares nothing. Left unconverted, the published characteristic
// renders a date in 1970 (D-011).
function millisecondsOf(deviceSeconds: number): number {
  return deviceSeconds * MILLISECONDS_PER_SECOND;
}

// The measured self-test sequence publishes the backup-pump timestamp several seconds before the
// self-test timestamp, so a comparison made while the test is still running reads a backup
// timestamp against a test timestamp that has not caught up, and labels a self-test as ordinary
// activity. The label is therefore computed only once the test reports finished and both device
// values have stopped moving, and the two device values are compared with each other and never
// against local time. `undefined` here means the rule did not run, so the caller keeps whatever
// label it already had: asserting that the last activation was not a test from inputs that did not
// decode is a claim the plugin has not earned (D-013, C-001).
function classifiedAsTestActivity(observation: PumpRecordsObservation, previous: PreviousDeviceTimes): boolean | undefined {
  const { backupActivatedAt, testedAt, testRunning } = observation;

  if (testRunning !== false || backupActivatedAt === undefined || testedAt === undefined) {
    return undefined;
  }

  if (previous.backupActivatedAt !== backupActivatedAt || previous.testedAt !== testedAt) {
    return undefined;
  }

  return testedAt >= backupActivatedAt;
}

function recordValues(pump: PumpObservation | undefined): PumpRecordValues {
  if (pump === undefined) {
    throw new Error('a pump record was read before anything was observed; the accessory observes a snapshot before it publishes one');
  }

  return {
    observationStartedAt: pump.observationStartedAt,
    activationCount: pump.activationCount,
    lastActivationAt: pump.lastActivationAt,
    lastActivationWasTestActivity: pump.lastActivationWasTestActivity,
  };
}

/**
 * Creates the pump records over one accessory's stored context.
 *
 * Creating them touches nothing outside itself: nothing is read from disk,
 * nothing is scheduled, and no value is written until the first observation
 * arrives. A context carrying a readable record is resumed as it stands and
 * asks for no write of its own.
 */
export function createPumpRecords(options: PumpRecordsOptions): PumpRecords {
  const { context, store, log } = options;

  let previousPrimaryRunning: boolean | undefined = undefined;
  let previousBackupRunning: boolean | undefined = undefined;
  let previousDeviceTimes: PreviousDeviceTimes = { backupActivatedAt: undefined, testedAt: undefined };
  let backupEdgeAwaitingItsTimestamp = false;

  // The stored record is resumed whole or not at all. A context carrying two readable pumps beside
  // an unreadable watermark pair cannot be repaired into a coherent record, and a half-read count
  // is a number an owner would read as a fact about their basement.
  function resumedRecord(): StoredRecord | undefined {
    const { primaryPump, backupPump, watermarks } = context;

    if (primaryPump === undefined && backupPump === undefined && watermarks === undefined) {
      return undefined;
    }

    if (!isPumpObservation(primaryPump) || !isPumpObservation(backupPump) || !isActivationWatermarks(watermarks)) {
      log.warn('The stored pump observation record could not be read, so observation starts again from now.');

      return undefined;
    }

    return { primaryPump, backupPump, watermarks };
  }

  let record = resumedRecord();

  // Observation began at the first snapshot, so the epoch is that snapshot's own receipt time
  // rather than a clock reading. Taking it from the observation introduces no second time source
  // the record could disagree with, and it is why this module needs no clock at all.
  function seed(receivedAt: number): StoredRecord {
    const seeded: StoredRecord = {
      primaryPump: { observationStartedAt: receivedAt, activationCount: 0, lastActivationAt: undefined },
      backupPump: { observationStartedAt: receivedAt, activationCount: 0, lastActivationAt: undefined },
      watermarks: { backupPumpTimestamp: undefined, testTimestamp: undefined },
    };

    context.primaryPump = seeded.primaryPump;
    context.backupPump = seeded.backupPump;
    context.watermarks = seeded.watermarks;
    record = seeded;

    return seeded;
  }

  // A watched activation takes this observation's own receipt time, because it is something the
  // plugin saw rather than something the device timed.
  function countWatchedActivation(pump: PumpObservation, receivedAt: number): void {
    pump.activationCount += 1;
    pump.lastActivationAt = receivedAt;
  }

  // The device publishes a new backup-pump timestamp only after the pump stops, so the first
  // advance following a watched backup edge describes the run that edge already counted. Absorbing
  // it -- moving the watermark without counting and without moving the last activation -- is what
  // keeps one physical run from being reported as two, and leaves that run's record written from
  // one clock rather than two (D-010).
  function reconcileBackupTimestamp(stored: StoredRecord, reportedAt: number | undefined): boolean {
    if (!evidencesAMissedActivation(stored.watermarks.backupPumpTimestamp, reportedAt)) {
      return false;
    }

    stored.watermarks.backupPumpTimestamp = reportedAt;

    if (backupEdgeAwaitingItsTimestamp) {
      backupEdgeAwaitingItsTimestamp = false;

      return true;
    }

    stored.backupPump.activationCount += 1;
    stored.backupPump.lastActivationAt = millisecondsOf(reportedAt);

    return true;
  }

  // Classification labels the record and touches nothing else: no count, no last activation, and no
  // watermark but the self-test one it consumed.
  function reconcileClassification(stored: StoredRecord, observation: PumpRecordsObservation): boolean {
    const classified = classifiedAsTestActivity(observation, previousDeviceTimes);

    if (classified === undefined) {
      return false;
    }

    const changed = stored.backupPump.lastActivationWasTestActivity !== classified || stored.watermarks.testTimestamp !== observation.testedAt;
    stored.backupPump.lastActivationWasTestActivity = classified;
    stored.watermarks.testTimestamp = observation.testedAt;

    return changed;
  }

  return {
    observe(observation: PumpRecordsObservation): void {
      let stored = record;
      let changed = false;

      if (stored === undefined) {
        stored = seed(observation.receivedAt);
        changed = true;
      }

      if (watchedAnActivation(previousPrimaryRunning, observation.primaryRunning)) {
        countWatchedActivation(stored.primaryPump, observation.receivedAt);
        changed = true;
      }

      if (watchedAnActivation(previousBackupRunning, observation.backupRunning)) {
        countWatchedActivation(stored.backupPump, observation.receivedAt);
        backupEdgeAwaitingItsTimestamp = true;
        changed = true;
      }

      changed = reconcileBackupTimestamp(stored, observation.backupActivatedAt) || changed;
      changed = reconcileClassification(stored, observation) || changed;

      previousPrimaryRunning = rememberedRunning(previousPrimaryRunning, observation.primaryRunning);
      previousBackupRunning = rememberedRunning(previousBackupRunning, observation.backupRunning);
      previousDeviceTimes = { backupActivatedAt: observation.backupActivatedAt, testedAt: observation.testedAt };

      // A context mutation Homebridge does not know about is invisible on disk, so only a real
      // change earns the call rather than persisting an identical record on every poll (D-010).
      if (changed) {
        store.persist();
      }
    },

    get primary(): PumpRecordValues {
      return recordValues(record?.primaryPump);
    },

    get backup(): PumpRecordValues {
      return recordValues(record?.backupPump);
    },
  };
}
