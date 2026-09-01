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
  const discard = (): void => {
    // the other six levels are not part of any assertion here
  };

  const warn = (message: string): void => void warnings.push(message);

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
// with nothing counted yet, and both device timestamps already accounted for. Starting the
// self-test cases here is what keeps the very first device timestamp from being recovered as an
// activation and confusing what those cases measure.
function storedContext(): PumpRecordsContext {
  return {
    primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 0, lastActivationAt: undefined },
    backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 0, lastActivationAt: undefined },
    watermarks: { backupPumpTimestamp: PRIOR_BACKUP_SECONDS, testTimestamp: PRIOR_TEST_SECONDS },
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

test('recovers one activation from a device timestamp and stores it in milliseconds', () => {
  // arrange
  const { records } = pumpRecords(storedContext());

  // act
  records.observe(observation({ backupActivatedAt: NEW_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual(
    { count: records.backup.activationCount, lastActivationAt: records.backup.lastActivationAt },
    { count: 1, lastActivationAt: NEW_BACKUP_MS },
  );
});

// The first timestamp a record ever sees establishes the baseline rather than recovering a run. The
// device timed it from before the observation start that the same first observation seeded, so
// counting it would report an activation from before the plugin was watching -- a number an owner
// reads describing something nobody observed. Ruled 2026-09-01, reversing the plan as written.
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

// The seed absorbs whatever the device was reporting, so an edge already awaiting its timestamp is
// accounted for by that same seed and its flag must clear with it. Were the flag left set, the NEXT
// advance would be absorbed too and a genuinely missed run would go uncounted -- so this case drives
// a watched edge FIRST, which is the only way the flag is ever set when the seed arrives.
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

// The device publishes a new backup-pump timestamp only after the pump stops, so the advance that
// follows a watched edge describes the run that edge already counted. Counting both would report
// one physical run as two, and taking the device time would write one run's record from two clocks.
test('absorbs the device timestamp that follows a watched backup activation', () => {
  // arrange
  const { records } = pumpRecords();
  records.observe(observation({ backupRunning: false }));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, backupRunning: true }));

  // act
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual(
    { count: records.backup.activationCount, lastActivationAt: records.backup.lastActivationAt },
    { count: 1, lastActivationAt: OBSERVED_NEXT_AT },
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
  const idle = { backupRunning: false, testRunning: false, backupActivatedAt: PRIOR_BACKUP_SECONDS, testedAt: PRIOR_TEST_SECONDS };
  const running = { backupRunning: true, testRunning: true, backupActivatedAt: PRIOR_BACKUP_SECONDS, testedAt: PRIOR_TEST_SECONDS };
  const stopped = { backupRunning: false, testRunning: true, backupActivatedAt: NEW_BACKUP_SECONDS, testedAt: PRIOR_TEST_SECONDS };
  const completed = { backupRunning: false, testRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS, testedAt: NEW_TEST_SECONDS };

  // act
  const labels: (boolean | undefined)[] = [];

  for (const phase of [idle, running, stopped, completed, completed]) {
    records.observe(observation({ receivedAt: OBSERVED_AT, ...phase }));
    labels.push(records.backup.lastActivationWasTestActivity);
  }

  // assert
  assert.deepStrictEqual(labels, [undefined, undefined, undefined, undefined, true]);
});

// Catching up is what the self-test timestamp does, so the two device values landing on the same
// second is the exact case the label exists for. Reading it as a run the self-test does not account
// for would label a self-test as ordinary basement activity.
test('labels the last activation as self-test activity when the self-test timestamp caught up exactly', () => {
  // arrange
  const { records } = pumpRecords(storedContext());
  const settled = { backupRunning: false, testRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS, testedAt: NEW_BACKUP_SECONDS };

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
  const settled = { backupRunning: false, testRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS, testedAt: PRIOR_TEST_SECONDS };

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
  const settled = { backupRunning: false, testRunning: false, backupActivatedAt: PRIOR_BACKUP_SECONDS, testedAt: PRIOR_TEST_SECONDS };
  records.observe(observation(settled));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...settled }));
  const beforeTheUndecodedSnapshot = records.backup.lastActivationWasTestActivity;

  // act
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, backupRunning: false, testRunning: false, backupActivatedAt: PRIOR_BACKUP_SECONDS }));

  // assert
  assert.deepStrictEqual(
    { beforeTheUndecodedSnapshot, after: records.backup.lastActivationWasTestActivity },
    { beforeTheUndecodedSnapshot: true, after: true },
  );
});

// Classification consumed a self-test timestamp the record had not accounted for, so the watermark
// moves even though the label it computed is the one already stored.
test('advances the self-test watermark when the label it computes is the one already stored', () => {
  // arrange
  const context = storedContext();
  const { records, persistCount } = pumpRecords(context);
  const settled = { backupRunning: false, testRunning: false, backupActivatedAt: NEW_BACKUP_SECONDS, testedAt: NEW_TEST_SECONDS };
  records.observe(observation(settled));
  records.observe(observation({ receivedAt: OBSERVED_NEXT_AT, ...settled }));
  const afterTheLabel = persistCount();

  // act
  records.observe(observation({ receivedAt: OBSERVED_LAST_AT, ...settled }));

  // assert
  assert.deepStrictEqual(
    { watermark: context.watermarks?.testTimestamp, label: records.backup.lastActivationWasTestActivity, persistedAgain: persistCount() - afterTheLabel },
    { watermark: NEW_TEST_SECONDS, label: true, persistedAgain: 0 },
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

// Every way a restored record can fail to be readable. A half-read record is repaired by nobody:
// it is replaced by a fresh observation start, because a count assembled out of a broken record is
// a number an owner would read as a fact about their basement.
const DAMAGED_RECORDS: readonly { readonly cause: string; readonly stored: Record<string, unknown> }[] = [
  { cause: 'a pump record that is not an object at all', stored: { primaryPump: 'primary' } },
  { cause: 'a pump record that is null', stored: { primaryPump: null } },
  { cause: 'a pump record missing its observation start', stored: { primaryPump: { activationCount: 4 } } },
  { cause: 'a pump record missing its count', stored: { primaryPump: { observationStartedAt: OBSERVED_AT } } },
  {
    cause: 'a pump record whose last activation is not a time',
    stored: { primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4, lastActivationAt: 'recently' } },
  },
  {
    cause: 'a pump record whose self-test label is not a boolean',
    stored: { primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4, lastActivationWasTestActivity: 'yes' } },
  },
  {
    cause: 'a second pump record that is unreadable while the first is fine',
    stored: { primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 } },
  },
  {
    cause: 'a watermark pair that is not an object at all',
    stored: {
      primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      watermarks: 7,
    },
  },
  {
    cause: 'a watermark pair that is null',
    stored: {
      primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      watermarks: null,
    },
  },
  {
    cause: 'a backup watermark that is not a device time',
    stored: {
      primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      watermarks: { backupPumpTimestamp: 'lately', testTimestamp: undefined },
    },
  },
  {
    cause: 'a self-test watermark that is not a device time',
    stored: {
      primaryPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      backupPump: { observationStartedAt: OBSERVED_AT, activationCount: 4 },
      watermarks: { backupPumpTimestamp: PRIOR_BACKUP_SECONDS, testTimestamp: 'lately' },
    },
  },
];

for (const { cause, stored } of DAMAGED_RECORDS) {
  test(`starts observation again and says so once for ${cause}`, () => {
    // arrange
    const { records, persistCount, warnings } = pumpRecords(damagedContext(stored));

    // act
    records.observe(observation());

    // assert
    assert.deepStrictEqual(
      { primary: records.primary, backup: records.backup, persisted: persistCount(), warnings: warnings.length },
      { primary: freshRecord(), backup: freshRecord(), persisted: 1, warnings: 1 },
    );
  });
}

// A log line names a capability or a fact, never an identifier: the vendor device identifier
// carries the account identifier inside it.
test('names no device or account identifier in the line about an unreadable record', () => {
  // arrange
  const { records, warnings } = pumpRecords(damagedContext({ primaryPump: 'primary' }));

  // act
  records.observe(observation());

  // assert
  assert.deepStrictEqual(
    warnings.filter((warning) => /account-|serial-|_/.test(warning)),
    [],
  );
});

// The accessory observes a snapshot before it publishes one, so a read before the first observation
// is a wiring mistake rather than a record with nothing in it. Answering a zero count and an epoch
// of 1970 instead would publish both as fact.
test('refuses to answer a record before it has observed anything', () => {
  // arrange
  const { records } = pumpRecords();

  // act & assert
  assert.throws(() => records.primary, { message: /before anything was observed/ });
  assert.throws(() => records.backup, { message: /before anything was observed/ });
});
