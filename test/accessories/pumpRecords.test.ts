// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests the plugin-observed pump records and their persistence.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createPumpRecords } from '../../src/accessories/pumpRecords.js';

import type { PumpRecordValues, PumpRecords, PumpRecordsContext, PumpRecordsObservation } from '../../src/accessories/pumpRecords.js';
import type { AccessoryStore } from '../../src/runtime/accessoryStore.js';
import type { Logging } from 'homebridge';

// The plugin's own receipt times, deliberately far away from the device's Unix seconds below. A
// case that asserts a recovered activation carries the device time cannot discriminate a
// conversion from a receipt time when the two happen to be the same number.
const OBSERVED_AT = 1_800_000_000_000;
const OBSERVED_NEXT_AT = 1_800_000_060_000;
const OBSERVED_LAST_AT = 1_800_000_120_000;

// The device's own timestamps, in the device's own Unix seconds. The prior pair is what a device
// reports between runs; the new pair is what it reports after a self-test, with the self-test
// timestamp catching up to the backup-pump timestamp a few seconds later.
const PRIOR_BACKUP_SECONDS = 1_700_000_000;
const PRIOR_TEST_SECONDS = 1_700_000_005;
const NEW_BACKUP_SECONDS = 1_700_000_100;
const NEW_TEST_SECONDS = 1_700_000_105;

// What a backup-pump timestamp is worth once it reaches a stored time, which is the one piece of
// arithmetic this module does on a device value.
const NEW_BACKUP_MS = 1_700_000_100_000;

/** The recorder a case reads the module's whole outward behaviour off. */
interface RecordedSubject {
  records: PumpRecords;
  context: PumpRecordsContext;
  persistCount: () => number;
  warnings: readonly string[];
}

// `Logging` is a callable interface carrying seven members, so the recorder is a discarding
// function that carries them. Only `warn` is observed: it is the one level this module writes to.
function recordingLog(): { log: Logging; warnings: string[] } {
  const warnings: string[] = [];
  function discard(): void {
    // the other six levels are not part of any assertion here
  }

  function warn(message: string): void {
    warnings.push(message);
  }

  return { warnings, log: Object.assign(discard, { prefix: 'guardian', debug: discard, error: discard, info: discard, log: discard, success: discard, warn }) };
}

// The one-method port, as a counter. A call means the module asked for exactly one write, which is
// what lets a case assert that an unchanged observation asked for none.
function recordingStore(): { store: AccessoryStore; persistCount: () => number } {
  let calls = 0;

  return {
    store: {
      persist: () => {
        calls += 1;
      },
    },
    persistCount: () => calls,
  };
}

function pumpRecords(context: PumpRecordsContext = {}): RecordedSubject {
  const { store, persistCount } = recordingStore();
  const { log, warnings } = recordingLog();

  return { records: createPumpRecords({ context, store, log }), context, persistCount, warnings };
}

function observation(reported: Partial<PumpRecordsObservation> = {}): PumpRecordsObservation {
  return {
    receivedAt: OBSERVED_AT,
    primaryRunning: undefined,
    backupRunning: undefined,
    backupActivatedAt: undefined,
    testRunning: undefined,
    testedAt: undefined,
    ...reported,
  };
}

function freshRecord(): PumpRecordValues {
  return { observationStartedAt: OBSERVED_AT, activationCount: 0, lastActivationAt: undefined, lastActivationWasTestActivity: undefined };
}

// A context as an already-running installation left it: both pumps observed since `OBSERVED_AT`
// with nothing counted yet, and both device timestamps already accounted for. A case starts here
// so that a device timestamp has a watermark to be compared with. A newer timestamp is then a
// recovered or absorbed run, not the first-seen baseline.
function storedContext(): PumpRecordsContext {
  return {
    primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 0, lastActivationAt: undefined },
    backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 0, lastActivationAt: undefined },
    watermarks: { backupPumpTimestamp: PRIOR_BACKUP_SECONDS, testTimestamp: PRIOR_TEST_SECONDS },
  };
}

// The same installation after one recovered backup activation. Its device timestamp is already
// accounted for and no label is earned yet, so settled self-test values describe that activation
// and only the classification rule decides whether the record gets a label.
function storedContextWithAnActivation(): PumpRecordsContext {
  return {
    ...storedContext(),
    backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 1, lastActivationAt: NEW_BACKUP_MS },
    watermarks: { backupPumpTimestamp: NEW_BACKUP_SECONDS, testTimestamp: PRIOR_TEST_SECONDS },
  };
}

// A restored context holds whatever JSON was on disk, whatever the declared type promises. Taking
// the stored shape as a plain record is what lets a case put a half-written one there, which is
// exactly what the module's structural check exists to survive.
function damagedContext(stored: Record<string, unknown>): PumpRecordsContext {
  return stored;
}

test('seeds a fresh observation start from the first snapshot it ever sees', () => {
  // arrange
  const { records, persistCount } = pumpRecords();

  // act
  records.observe(observation());

  // assert
  assert.deepStrictEqual(
    { primary: records.primary, backup: records.backup, persisted: persistCount() },
    { primary: freshRecord(), backup: freshRecord(), persisted: 1 },
  );
});

test('resumes a stored record and asks for no write of its own', () => {
  // arrange
  const first = pumpRecords();
  first.records.observe(observation({ backupRunning: false }));
  first.records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupRunning: true }));

  // act
  const second = pumpRecords(first.context);
  const resumed = { primary: second.records.primary, backup: second.records.backup };
  second.records.observe(observation({ receivedAt: OBSERVED_LAST_AT }));

  // assert
  assert.deepStrictEqual({ ...resumed, persisted: second.persistCount() }, { primary: first.records.primary, backup: first.records.backup, persisted: 0 });
});

test('counts a watched backup activation once and times it by the plugin own receipt', () => {
  // arrange
  const { records } = pumpRecords();
  records.observe(observation({ backupRunning: false }));

  // act
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupRunning: true }));

  // assert
  assert.deepStrictEqual(
    { count: records.backup.activationCount, lastActivationAt: records.backup.lastActivationAt },
    { count: 1, lastActivationAt: OBSERVED_NEXT_AT },
  );
});

// Counting a run already under way would add a second activation for one physical run on every
// restart that lands mid-cycle, and for the primary pump nothing could ever detect or correct it.
test('does not count a run already in progress at the first snapshot after start', () => {
  // arrange
  const { records } = pumpRecords();

  // act
  records.observe(observation({ primaryRunning: true, backupRunning: true }));

  // assert
  assert.deepStrictEqual({ primary: records.primary, backup: records.backup }, { primary: freshRecord(), backup: freshRecord() });
});

test('counts one activation for a run reported on two consecutive snapshots', () => {
  // arrange
  const { records } = pumpRecords();
  records.observe(observation({ backupRunning: false }));

  // act
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupRunning: true }));
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: true }));

  // assert
  assert.strictEqual(records.backup.activationCount, 1);
});

// An undecoded running value neither counts nor clears, so the `false` before it is still what the
// later `true` is an edge against.
test('counts an activation across a snapshot whose running value did not decode', () => {
  // arrange
  const { records } = pumpRecords();
  records.observe(observation({ primaryRunning: false }));

  // act
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, primaryRunning: undefined }));
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, primaryRunning: true }));

  // assert
  assert.strictEqual(records.primary.activationCount, 1);
});

// One row of the cases below: a pump, and the snapshots that report it stopped, running, and with a
// running value that did not decode.
interface UndecodedRunRow {
  pump: 'primary' | 'backup';
  stopped: Partial<PumpRecordsObservation>;
  running: Partial<PumpRecordsObservation>;
  undecoded: Partial<PumpRecordsObservation>;
}

// A running value that did not decode leaves the pump as it was, so a `true` on each side of it is
// one run. Reading the gap as a stop would count a second activation for one physical run.
for (const { pump, stopped, running, undecoded } of [
  { pump: 'primary', stopped: { primaryRunning: false }, running: { primaryRunning: true }, undecoded: { primaryRunning: undefined } },
  { pump: 'backup', stopped: { backupRunning: false }, running: { backupRunning: true }, undecoded: { backupRunning: undefined } },
] satisfies readonly UndecodedRunRow[]) {
  test(`counts one ${pump} activation for a run whose running state fails to decode for one snapshot`, () => {
    // arrange
    const { records } = pumpRecords();
    records.observe(observation(stopped));
    records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...running }));

    // act
    records.observe(observation({ receivedAt: OBSERVED_LAST_AT, ...undecoded }));
    records.observe(observation({ receivedAt: OBSERVED_LAST_AT, ...running }));

    // assert
    assert.deepStrictEqual(records[pump], {
      observationStartedAt: OBSERVED_AT,
      activationCount: 1,
      lastActivationAt: OBSERVED_NEXT_AT,
      lastActivationWasTestActivity: undefined,
    });
  });
}

// The recovered timestamp also moves the stored watermark, and the observation asks for a write.
// Without that write, a restart would recover the same run again.
test('recovers one activation from a device timestamp and stores it in milliseconds', () => {
  // arrange
  const { records, context, persistCount } = pumpRecords(storedContext());

  // act
  records.observe(observation({ backupActivatedAt: NEW_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual(
    {
      count: records.backup.activationCount,
      lastActivationAt: records.backup.lastActivationAt,
      watermark: context.watermarks?.backupPumpTimestamp,
      persisted: persistCount(),
    },
    { count: 1, lastActivationAt: NEW_BACKUP_MS, watermark: NEW_BACKUP_SECONDS, persisted: 1 },
  );
});

// The first timestamp a record ever sees is the baseline, and the record does not count it,
// whichever observation brings it. The plugin cannot tell whether the device timed it before
// observation began, and it never compares a device time with local time, so the count abstains.
test('seeds the first device timestamp as a baseline and counts no activation for it', () => {
  // arrange
  const { records, context } = pumpRecords();

  // act
  records.observe(observation({ backupActivatedAt: PRIOR_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual(
    { count: records.backup.activationCount, lastActivationAt: records.backup.lastActivationAt, watermark: context.watermarks?.backupPumpTimestamp },
    { count: 0, lastActivationAt: undefined, watermark: PRIOR_BACKUP_SECONDS },
  );
});

// The record takes the first device timestamp it sees as the own timestamp of any watched run that
// awaits one, so the seed clears the awaiting mark and a later advance counts. The record cannot
// tell an older timestamp from the run's own without comparing device time with local time. If the
// first timestamp is older, the run's own timestamp counts that run a second time. Keeping the mark
// instead would absorb the next advance when the first timestamp is the run's own, and a missed run
// would go uncounted. The case drives a watched edge before the first timestamp and pins the count
// and the last activation that the rule gives.
test('counts a later advance after a seed that also absorbed a watched edge', () => {
  // arrange
  const { records } = pumpRecords();
  records.observe(observation({ backupRunning: false }));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupRunning: true }));
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: false, backupActivatedAt: PRIOR_BACKUP_SECONDS }));

  // act
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupActivatedAt: NEW_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual(
    { count: records.backup.activationCount, lastActivationAt: records.backup.lastActivationAt },
    { count: 2, lastActivationAt: NEW_BACKUP_MS },
  );
});

test('recovers nothing and asks for no write from a repeated identical device timestamp', () => {
  // arrange
  const { records, persistCount } = pumpRecords(storedContext());
  records.observe(observation({ backupActivatedAt: NEW_BACKUP_SECONDS }));
  const afterTheFirst = persistCount();

  // act
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupActivatedAt: NEW_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual({ count: records.backup.activationCount, persistedAgain: persistCount() - afterTheFirst }, { count: 1, persistedAgain: 0 });
});

test('recovers exactly one activation from a device timestamp one second past the watermark', () => {
  // arrange
  const { records } = pumpRecords(storedContext());

  // act
  records.observe(observation({ backupActivatedAt: PRIOR_BACKUP_SECONDS + 1 }));

  // assert
  assert.strictEqual(records.backup.activationCount, 1);
});

// The device publishes a new backup-pump timestamp only after the pump stops, so the record takes
// the advance that follows a watched edge as the run that edge already counted. Counting both would
// report one physical run as two, and taking the device time would write one run's record from two
// clocks. The record starts with a stored watermark, so the advance is absorbed and is not the
// baseline.
// Absorbing moves the stored watermark and asks for a write, so the same timestamp on the next poll
// counts nothing.
test('absorbs the device timestamp that follows a watched backup activation', () => {
  // arrange
  const { records, context, persistCount } = pumpRecords(storedContext());
  records.observe(observation({ backupRunning: false }));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupRunning: true }));
  const beforeTheAbsorb = persistCount();

  // act
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS }));
  const persistedForTheAbsorb = persistCount() - beforeTheAbsorb;
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual(
    {
      count: records.backup.activationCount,
      lastActivationAt: records.backup.lastActivationAt,
      watermark: context.watermarks?.backupPumpTimestamp,
      persistedForTheAbsorb,
    },
    { count: 1, lastActivationAt: OBSERVED_NEXT_AT, watermark: NEW_BACKUP_SECONDS, persistedForTheAbsorb: 1 },
  );
});

// A restart can land after a watched backup edge and before the device timestamp for that run. The
// resumed record must still read that timestamp as the run it already counted. Otherwise one
// physical run counts twice, and its last activation moves to the device clock.
test('counts a watched backup run once across a restart before its device timestamp arrives', () => {
  // arrange
  const first = pumpRecords(storedContext());
  first.records.observe(observation({ backupRunning: false, backupActivatedAt: PRIOR_BACKUP_SECONDS }));
  first.records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupRunning: true, backupActivatedAt: PRIOR_BACKUP_SECONDS }));

  // act
  // Homebridge persists the context as JSON. `JSON.parse` answers `any`, and the text is the context
  // the first instance wrote, so it has that shape.
  const second = pumpRecords(JSON.parse(JSON.stringify(first.context)) as PumpRecordsContext);
  second.records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: true, backupActivatedAt: PRIOR_BACKUP_SECONDS }));
  second.records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual(
    { activationCount: second.records.backup.activationCount, lastActivationAt: second.records.backup.lastActivationAt },
    { activationCount: 1, lastActivationAt: OBSERVED_NEXT_AT },
  );
});

// The device reports no primary timestamp at all, so the primary count holds watched edges and
// nothing else. A backup timestamp reaching the primary record would be evidence out of thin air.
test('recovers nothing at all for the primary pump, which the device never timestamps', () => {
  // arrange
  const { records } = pumpRecords(storedContext());

  // act
  records.observe(observation({ backupActivatedAt: NEW_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual({ primary: records.primary, backupCount: records.backup.activationCount }, { primary: freshRecord(), backupCount: 1 });
});

// The measured self-test sequence, driven in order, then one further snapshot carrying the settled
// values. The label is withheld through the fourth phase because that phase is the one in which the
// self-test timestamp moves: a value seen once has not been stable across two observations, and
// classifying there would be classifying from a value still in flight.
test('withholds the self-test label until both device timestamps have settled', () => {
  // arrange
  const { records } = pumpRecords(storedContext());
  const idle = {
    backupRunning: false,
    testRunning: false,
    backupActivatedAt: PRIOR_BACKUP_SECONDS,
    testedAt: PRIOR_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;
  const running = {
    backupRunning: true,
    testRunning: true,
    backupActivatedAt: PRIOR_BACKUP_SECONDS,
    testedAt: PRIOR_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;
  const stopped = {
    backupRunning: false,
    testRunning: true,
    backupActivatedAt: NEW_BACKUP_SECONDS,
    testedAt: PRIOR_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;
  const completed = {
    backupRunning: false,
    testRunning: false,
    backupActivatedAt: NEW_BACKUP_SECONDS,
    testedAt: NEW_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;

  // act
  const labels = [idle, running, stopped, completed, completed].map((phase) => {
    records.observe(observation({ receivedAt: OBSERVED_AT, ...phase }));

    return records.backup.lastActivationWasTestActivity;
  });

  // assert
  assert.deepStrictEqual(labels, [undefined, undefined, undefined, undefined, true]);
});

// Catching up is what the self-test timestamp does, so the two device values landing on the same
// second is the exact case the label exists for. Reading it as a run the self-test does not account
// for would label a self-test as ordinary basement activity.
test('labels the last activation as self-test activity when the self-test timestamp caught up exactly', () => {
  // arrange
  const { records } = pumpRecords(storedContext());
  const settled = {
    backupRunning: false,
    testRunning: false,
    backupActivatedAt: NEW_BACKUP_SECONDS,
    testedAt: NEW_BACKUP_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;

  // act
  records.observe(observation(settled));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...settled }));

  // assert
  assert.strictEqual(records.backup.lastActivationWasTestActivity, true);
});

// The two device values are compared with each other and never against local time: a backup-pump
// timestamp that stays newer than the self-test timestamp is a run the self-test does not account
// for.
test('labels the last activation as not self-test activity when the backup timestamp stays newer', () => {
  // arrange
  const { records } = pumpRecords(storedContext());
  const settled = {
    backupRunning: false,
    testRunning: false,
    backupActivatedAt: NEW_BACKUP_SECONDS,
    testedAt: PRIOR_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;

  // act
  records.observe(observation(settled));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...settled }));

  // assert
  assert.strictEqual(records.backup.lastActivationWasTestActivity, false);
});

// Asserting that the last activation was not a test from inputs that did not decode is a claim the
// plugin has not earned; abstaining keeps whatever label it had.
test('keeps the self-test label it already carries when the self-test timestamp did not decode', () => {
  // arrange
  const { records } = pumpRecords(storedContext());
  const settled = {
    backupRunning: false,
    testRunning: false,
    backupActivatedAt: NEW_BACKUP_SECONDS,
    testedAt: NEW_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;
  records.observe(observation(settled));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...settled }));
  const beforeTheUndecodedSnapshot = records.backup.lastActivationWasTestActivity;

  // act
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: false, testRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual(
    { beforeTheUndecodedSnapshot, after: records.backup.lastActivationWasTestActivity },
    { beforeTheUndecodedSnapshot: true, after: true },
  );
});

// One row of the cases below: two snapshots and the backup record that the second leaves.
interface WithheldLabelRow {
  cause: string;
  first: Partial<PumpRecordsObservation>;
  second: Partial<PumpRecordsObservation>;
  backup: PumpRecordValues;
}

// Each row breaks one input that the classification rule checks. The other inputs are decoded,
// the test is finished, and the values are stable. A rule that skips the broken check writes a
// label from inputs that do not support it, which is a claim the plugin has not earned. In the
// first row, the moving timestamp is also a new run, so the record counts it.
for (const { cause, first, second, backup } of [
  {
    cause: 'the backup-pump timestamp moves while the test is finished and the self-test timestamp holds still',
    first: { testRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS, testedAt: NEW_TEST_SECONDS },
    second: { testRunning: false, backupActivatedAt: 1_700_000_160, testedAt: NEW_TEST_SECONDS },
    backup: { observationStartedAt: OBSERVED_AT, activationCount: 2, lastActivationAt: 1_700_000_160_000, lastActivationWasTestActivity: undefined },
  },
  {
    cause: 'the backup-pump timestamp did not decode',
    first: { testRunning: false, backupActivatedAt: undefined, testedAt: NEW_TEST_SECONDS },
    second: { testRunning: false, backupActivatedAt: undefined, testedAt: NEW_TEST_SECONDS },
    backup: { observationStartedAt: OBSERVED_AT, activationCount: 1, lastActivationAt: NEW_BACKUP_MS, lastActivationWasTestActivity: undefined },
  },
  {
    cause: 'the test-running flag did not decode',
    first: { testRunning: undefined, backupActivatedAt: NEW_BACKUP_SECONDS, testedAt: NEW_TEST_SECONDS },
    second: { testRunning: undefined, backupActivatedAt: NEW_BACKUP_SECONDS, testedAt: NEW_TEST_SECONDS },
    backup: { observationStartedAt: OBSERVED_AT, activationCount: 1, lastActivationAt: NEW_BACKUP_MS, lastActivationWasTestActivity: undefined },
  },
] satisfies readonly WithheldLabelRow[]) {
  test(`withholds the self-test label when ${cause}`, () => {
    // arrange
    const { records } = pumpRecords(storedContextWithAnActivation());
    records.observe(observation(first));

    // act
    records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...second }));

    // assert
    assert.deepStrictEqual(records.backup, backup);
  });
}

// Settled self-test values describe a run only when the record holds one. A record with no
// activation gives the label nothing to describe, so the values change nothing, not even the
// self-test watermark.
test('withholds the self-test label from a record that holds no activation even when the self-test values have settled', () => {
  // arrange
  const context = storedContext();
  const { records, persistCount } = pumpRecords(context);
  const settled = {
    backupRunning: false,
    testRunning: false,
    backupActivatedAt: PRIOR_BACKUP_SECONDS,
    testedAt: NEW_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;

  // act
  records.observe(observation(settled));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...settled }));

  // assert
  assert.deepStrictEqual(
    { backup: records.backup, watermark: context.watermarks?.testTimestamp, persisted: persistCount() },
    { backup: freshRecord(), watermark: PRIOR_TEST_SECONDS, persisted: 0 },
  );
});

// The record already carries the label that classification computes, so only the self-test
// watermark changes. Classification consumed a self-test timestamp the record had not accounted
// for, so the watermark moves and that move alone asks for a write.
test('advances the self-test watermark when the label it computes is the one already stored', () => {
  // arrange
  const context: PumpRecordsContext = {
    ...storedContextWithAnActivation(),
    backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 1, lastActivationAt: NEW_BACKUP_MS, lastActivationWasTestActivity: true },
  };
  const { records, persistCount } = pumpRecords(context);
  const settled = {
    backupRunning: false,
    testRunning: false,
    backupActivatedAt: NEW_BACKUP_SECONDS,
    testedAt: NEW_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;
  records.observe(observation(settled));
  const beforeTheClassification = persistCount();

  // act
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...settled }));

  // assert
  assert.deepStrictEqual(
    {
      watermark: context.watermarks?.testTimestamp,
      label: records.backup.lastActivationWasTestActivity,
      persistedForTheClassification: persistCount() - beforeTheClassification,
    },
    { watermark: NEW_TEST_SECONDS, label: true, persistedForTheClassification: 1 },
  );
});

// A device timestamp past the watermark counts a backup run the record did not watch, and the
// stored label describes the activation before it. Classification abstains on that observation,
// because the backup timestamp moved, so only the removal keeps the earlier label off the new run.
test('removes the stored self-test label when a device timestamp recovers a missed backup run', () => {
  // arrange
  const context: PumpRecordsContext = {
    ...storedContextWithAnActivation(),
    backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 1, lastActivationAt: NEW_BACKUP_MS, lastActivationWasTestActivity: true },
  };
  const { records } = pumpRecords(context);
  const settled = {
    backupRunning: false,
    testRunning: false,
    backupActivatedAt: NEW_BACKUP_SECONDS,
    testedAt: NEW_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;
  records.observe(observation(settled));

  // act
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...settled, backupActivatedAt: 1_700_000_160 }));

  // assert
  assert.deepStrictEqual(records.backup, {
    observationStartedAt: OBSERVED_AT,
    activationCount: 2,
    lastActivationAt: 1_700_000_160_000,
    lastActivationWasTestActivity: undefined,
  });
});

// A real backup run after a self-test is a new activation, and the settled self-test timestamps do
// not describe it. Until the device publishes the timestamp of that run, the record holds no label,
// so it no longer says that the last activation was a self-test.
test('withholds the self-test label from a watched backup run whose device timestamp has not arrived', () => {
  // arrange
  const { records } = pumpRecords(storedContext());
  const laterBackupSeconds = 1_700_000_160;
  const settled = {
    backupRunning: false,
    testRunning: false,
    backupActivatedAt: NEW_BACKUP_SECONDS,
    testedAt: NEW_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;
  const running = { ...settled, backupRunning: true } satisfies Partial<PumpRecordsObservation>;
  const timestamped = { ...settled, backupActivatedAt: laterBackupSeconds } satisfies Partial<PumpRecordsObservation>;
  records.observe(observation(settled));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...settled }));
  const labels = [records.backup.lastActivationWasTestActivity];

  // act
  for (const phase of [running, running, settled, timestamped]) {
    records.observe(observation({ receivedAt: OBSERVED_LAST_AT, ...phase }));
    labels.push(records.backup.lastActivationWasTestActivity);
  }

  // assert
  assert.deepStrictEqual(
    { activationCount: records.backup.activationCount, lastActivationAt: records.backup.lastActivationAt, labels },
    { activationCount: 2, lastActivationAt: OBSERVED_LAST_AT, labels: [true, undefined, undefined, undefined, undefined] },
  );
});

// The device publishes a backup run's timestamp only after that run stops. A timestamp advance that
// arrives with a backup edge therefore belongs to an earlier run, here a self-test that ended between
// two observations. The record counts that earlier run on the device clock and the watched run at
// its receipt time. The watched run still awaits its own timestamp, so the settled self-test values
// of the earlier run do not label it while it runs.
test('reads a timestamp advance that arrives with a backup edge as an earlier run', () => {
  // arrange
  const { records, context } = pumpRecords(storedContext());
  const earlierSelfTest = {
    testRunning: false,
    backupActivatedAt: NEW_BACKUP_SECONDS,
    testedAt: NEW_TEST_SECONDS,
  } satisfies Partial<PumpRecordsObservation>;
  records.observe(observation({ backupRunning: false, testRunning: false, backupActivatedAt: PRIOR_BACKUP_SECONDS, testedAt: PRIOR_TEST_SECONDS }));

  // act
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupRunning: true, ...earlierSelfTest }));
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: true, ...earlierSelfTest }));

  // assert
  assert.deepStrictEqual(
    { backup: records.backup, awaitingTimestamp: context.watermarks?.backupEdgeAwaitingTimestamp },
    {
      backup: { observationStartedAt: OBSERVED_AT, activationCount: 2, lastActivationAt: OBSERVED_NEXT_AT, lastActivationWasTestActivity: undefined },
      awaitingTimestamp: true,
    },
  );
});

// A write per poll would be a write while the basement is dry. Change detection is what keeps it to
// a few small writes per pump cycle.
test('asks for one write for a counted activation and none for an unchanged snapshot', () => {
  // arrange
  const { records, persistCount } = pumpRecords();
  records.observe(observation({ backupRunning: false }));
  const beforeTheEdge = persistCount();

  // act
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupRunning: true }));
  const afterTheEdge = persistCount();
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: true }));

  // assert
  assert.deepStrictEqual({ forTheEdge: afterTheEdge - beforeTheEdge, forTheUnchanged: persistCount() - afterTheEdge }, { forTheEdge: 1, forTheUnchanged: 0 });
});

// Nothing here defers. A delay shorter than whatever a harness advances would survive a purely
// behavioural test, so the recorders are what make the absence provable.
test('schedules nothing at all across one observation', (t) => {
  // arrange
  const { records } = pumpRecords();
  const setTimeoutSpy = t.mock.method(globalThis, 'setTimeout');
  const setIntervalSpy = t.mock.method(globalThis, 'setInterval');
  const setImmediateSpy = t.mock.method(globalThis, 'setImmediate');
  const queueMicrotaskSpy = t.mock.method(globalThis, 'queueMicrotask');

  // act
  records.observe(observation({ backupRunning: true, backupActivatedAt: PRIOR_BACKUP_SECONDS, testRunning: false, testedAt: PRIOR_TEST_SECONDS }));
  const scheduled = {
    setTimeout: setTimeoutSpy.mock.callCount(),
    setInterval: setIntervalSpy.mock.callCount(),
    setImmediate: setImmediateSpy.mock.callCount(),
    queueMicrotask: queueMicrotaskSpy.mock.callCount(),
  };

  // assert
  assert.deepStrictEqual(scheduled, { setTimeout: 0, setInterval: 0, setImmediate: 0, queueMicrotask: 0 });
});

// The one line the module writes about an unreadable record.
const UNREADABLE_RECORD_WARNING = 'The stored pump observation record could not be read, so observation starts again from now.';

// One row of the cases below: what is wrong with the stored record, and a function that builds the
// stored members. The module writes into the context it is given, so each case builds its own.
interface DamagedRecordRow {
  readonly cause: string;
  readonly stored: () => Record<string, unknown>;
}

// Every way a restored record can fail to be readable. A half-read record is repaired by nobody:
// it is replaced by a fresh observation start, because a count assembled out of a broken record is
// a number an owner would read as a fact about their basement.
const DAMAGED_RECORDS: readonly DamagedRecordRow[] = [
  { cause: 'a pump record that is not an object at all', stored: () => ({ primaryPump: 'primary' }) },
  { cause: 'a pump record that is null', stored: () => ({ primaryPump: null }) },
  { cause: 'a pump record missing its observation start', stored: () => ({ primaryPump: { activationCount: 4 } }) },
  { cause: 'a pump record missing its count', stored: () => ({ primaryPump: { observationStartedAt: OBSERVED_AT } }) },
  {
    cause: 'a pump record whose last activation is not a time',
    stored: () => ({ primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4, lastActivationAt: 'recently' } }),
  },
  {
    cause: 'a pump record whose self-test label is not a boolean',
    stored: () => ({ primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4, lastActivationWasTestActivity: 'yes' } }),
  },
  {
    cause: 'a second pump record that is unreadable while the first is fine',
    stored: () => ({ primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 } }),
  },
  {
    cause: 'a watermark pair that is not an object at all',
    stored: () => ({
      primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      watermarks: 7,
    }),
  },
  {
    cause: 'a watermark pair that is null',
    stored: () => ({
      primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      watermarks: null,
    }),
  },
  {
    cause: 'a backup watermark that is not a device time',
    stored: () => ({
      primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      watermarks: { backupPumpTimestamp: 'lately', testTimestamp: undefined },
    }),
  },
  {
    cause: 'a self-test watermark that is not a device time',
    stored: () => ({
      primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      watermarks: { backupPumpTimestamp: PRIOR_BACKUP_SECONDS, testTimestamp: 'lately' },
    }),
  },
  {
    cause: 'a mark of a backup run awaiting its timestamp that is not a boolean',
    stored: () => ({
      primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      watermarks: { backupPumpTimestamp: PRIOR_BACKUP_SECONDS, testTimestamp: PRIOR_TEST_SECONDS, backupEdgeAwaitingTimestamp: 'yes' },
    }),
  },
];

for (const { cause, stored } of DAMAGED_RECORDS) {
  test(`starts observation again and says so once for ${cause}`, () => {
    // arrange
    const { records, persistCount, warnings } = pumpRecords(damagedContext(stored()));

    // act
    records.observe(observation());

    // assert
    assert.deepStrictEqual(
      { primary: records.primary, backup: records.backup, persisted: persistCount(), warnings },
      { primary: freshRecord(), backup: freshRecord(), persisted: 1, warnings: [UNREADABLE_RECORD_WARNING] },
    );
  });
}

// The warning names a capability and a cause. That is everything the reader needs, so the line
// carries no identifier. The reason is what the sentence has to say, not sensitivity: a vendor
// device identifier is admitted to runtime logs. The damaged context carries the identifiers that a
// real accessory context carries, so a line that took them from the context would show them.
test('names no device or account identifier in the line about an unreadable record', () => {
  // arrange
  const { records, warnings } = pumpRecords(damagedContext({ deviceId: 'account-1_serial-1', serialNumber: 'serial-1', primaryPump: 'primary' }));

  // act
  records.observe(observation());

  // assert
  assert.deepStrictEqual(warnings, [UNREADABLE_RECORD_WARNING]);
});

// The accessory observes a snapshot before it publishes one, so a read before the first observation
// is a wiring mistake rather than a record with nothing in it. Answering a zero count and an epoch
// of 1970 instead would publish both as fact.
for (const pump of ['primary', 'backup'] as const) {
  test(`refuses to answer the ${pump} record before it has observed anything`, () => {
    // arrange
    const { records } = pumpRecords();

    // act & assert
    assert.throws(() => records[pump], {
      name: 'Error',
      message: 'a pump record was read before anything was observed; the accessory observes a snapshot before it publishes one',
    });
  });
}
