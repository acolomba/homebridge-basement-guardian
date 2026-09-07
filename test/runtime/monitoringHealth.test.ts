import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createMonitoringHealth, HEARTBEAT_INTERVAL_MS, MISSED_HEARTBEATS_BEFORE_SILENT, REST_FAILURE_THRESHOLD } from '../../src/runtime/monitoringHealth.js';

import type { ArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';
import type { Clock } from '../../src/runtime/clock.js';
import type { MonitoringHealth } from '../../src/runtime/monitoringHealth.js';
import type { MonotonicClock } from '../../src/runtime/monotonicClock.js';

const START_TIME = 1_700_000_000_000;

// Where the forward-only base starts. It is deliberately unlike START_TIME, and
// small enough that it could not be mistaken for a wall-clock instant, so a case
// that handed one port the other's reading fails loudly rather than agreeing by
// coincidence.
const MONOTONIC_START_TIME = 4_000_000;

// The systems a case is about. Most cases are about one, which is the ordinary
// account, and the two-device cases below are what make silence a fact about a
// controller rather than about the account it sits on.
const DEVICE_ID = 'placeholder-device';
const OTHER_DEVICE_ID = 'placeholder-other-device';

// The two boundary moments, written as the millisecond figures a reader can
// check against the measured heartbeat rather than recomputed from the
// production constants: a projection that halved the window would otherwise
// agree with an expectation built the same wrong way.
const ONE_MISSED_HEARTBEAT_MS = 898_000;
const TWO_MISSED_HEARTBEATS_MS = 1_796_000;

// The wall-clock correction the backwards-jump case makes, written out for the
// same reason: it is deliberately larger than the whole silence window, which is
// the case IN-03 names, and a figure derived from the window would move with it.
const ONE_HOUR_MS = 3_600_000;

// Two clocks a case moves by assignment, so elapsed time is stated rather than
// waited for.
//
// `moveTo` moves both bases by the same displacement, because a case that
// advances time means time passed, and time passing moves both. Only a case
// about a wall-clock correction reaches for `moveWallTo`, which moves the wall
// base alone and leaves the forward-only one where it was. Keeping the pair
// apart at the mover is what makes a backwards jump expressible at all.
interface MovableClock {
  clock: Clock;
  monotonic: MonotonicClock;
  moveTo: (at: number) => void;
  moveWallTo: (at: number) => void;
}

function movableClock(): MovableClock {
  let now = START_TIME;
  let monotonicNow = MONOTONIC_START_TIME;

  return {
    clock: { now: () => now },
    monotonic: { now: () => monotonicNow },
    moveTo: (at: number): void => {
      monotonicNow += at - now;
      now = at;
    },
    moveWallTo: (at: number): void => {
      now = at;
    },
  };
}

// The anchor store, in memory, so a case can pre-load it as a restart would and
// read back what admission and arrival did to it. `stored` is the same map the
// store answers from, which is what lets a case assert an anchor was left where
// it was rather than merely that silence came out right.
interface RecordingAnchors extends ArrivalAnchors {
  stored: Map<string, number>;
}

function recordingAnchors(initial: readonly (readonly [string, number])[] = []): RecordingAnchors {
  const stored = new Map<string, number>(initial);

  return {
    stored,
    get: (deviceId: string): number | undefined => stored.get(deviceId),
    record: (deviceId: string, at: number): void => {
      stored.set(deviceId, at);
    },
    forget: (deviceId: string): void => {
      stored.delete(deviceId);
    },
    restore: (): Promise<void> => Promise.resolve(),
    persist: (): Promise<void> => Promise.resolve(),
  };
}

// An install whose store holds nothing and keeps nothing: the anchor file was
// never written, or was rejected whole. Every lookup answers absent, which is
// the state D-08 is about, and the measurement must rest on the forward-only
// term alone rather than reading the absence as a recent arrival.
function anchorsThatStoreNothing(): ArrivalAnchors {
  return {
    get: (): number | undefined => undefined,
    record: (): void => undefined,
    forget: (): void => undefined,
    restore: (): Promise<void> => Promise.resolve(),
    persist: (): Promise<void> => Promise.resolve(),
  };
}

// A projection carrying one admitted device whose shadow arrival was stamped at
// the scenario's start, which is the state every elapsed-time case measures
// from. Admission comes first because that is the order the runtime uses: a
// poll finds the device, and its messages arrive afterwards.
function healthWithAMessageAtStart(clock: Clock, monotonic: MonotonicClock, anchors: ArrivalAnchors = recordingAnchors()): MonitoringHealth {
  const health = createMonitoringHealth({ clock, monotonic, anchors });
  health.admitDevice(DEVICE_ID);
  health.recordShadowMessage(DEVICE_ID);

  return health;
}

// A projection carrying two admitted systems and no message from either, which
// is the state a two-pump account is in the moment discovery finds it.
function healthWithTwoAdmittedDevices(clock: Clock, monotonic: MonotonicClock, anchors: ArrivalAnchors = recordingAnchors()): MonitoringHealth {
  const health = createMonitoringHealth({ clock, monotonic, anchors });
  health.admitDevice(DEVICE_ID);
  health.admitDevice(OTHER_DEVICE_ID);

  return health;
}

test('publishes the thresholds it measures against', () => {
  // act & assert
  assert.deepStrictEqual(
    { restFailures: REST_FAILURE_THRESHOLD, heartbeatMs: HEARTBEAT_INTERVAL_MS, missedHeartbeats: MISSED_HEARTBEATS_BEFORE_SILENT },
    { restFailures: 2, heartbeatMs: 898_000, missedHeartbeats: 2 },
  );
});

for (const { failures, degraded } of [
  { failures: 0, degraded: false },
  { failures: 1, degraded: false },
  { failures: 2, degraded: true },
  { failures: 3, degraded: true },
]) {
  test(`reports the polling path degraded as ${String(degraded)} after ${String(failures)} consecutive failed poll(s)`, () => {
    // arrange
    const { clock, monotonic } = movableClock();
    const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });

    // act
    for (let failure = 0; failure < failures; failure += 1) {
      health.recordRestFailure();
    }

    // assert
    assert.strictEqual(health.trustNow().restDegraded, degraded);
  });
}

test('clears the polling degradation on the first successful poll after three failures', () => {
  // arrange
  const { clock, monotonic } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });
  health.recordRestFailure();
  health.recordRestFailure();
  health.recordRestFailure();

  // act
  health.recordRestSuccess();

  // assert
  assert.strictEqual(health.trustNow().restDegraded, false);
});

test('starts a fresh run after a success, so one later failure does not degrade again', () => {
  // arrange
  const { clock, monotonic } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });
  health.recordRestFailure();
  health.recordRestFailure();
  health.recordRestSuccess();

  // act
  health.recordRestFailure();

  // assert
  assert.strictEqual(health.trustNow().restDegraded, false);
});

for (const { elapsedMs, silent } of [
  { elapsedMs: 897_999, silent: false },
  { elapsedMs: 898_000, silent: false },
  { elapsedMs: 1_795_999, silent: false },
  { elapsedMs: 1_796_000, silent: true },
  { elapsedMs: 1_796_001, silent: true },
]) {
  test(`reports the shadow silent as ${String(silent)} ${String(elapsedMs)} ms after the last message`, () => {
    // arrange
    const { clock, monotonic, moveTo } = movableClock();
    const health = healthWithAMessageAtStart(clock, monotonic);

    // act
    moveTo(START_TIME + elapsedMs);

    // assert
    assert.strictEqual(health.silentDevices().includes(DEVICE_ID), silent);
  });
}

test('measures the silence from the newest message, so a late arrival restarts the window', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock, monotonic);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1);
  health.recordShadowMessage(DEVICE_ID);

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1 + TWO_MISSED_HEARTBEATS_MS - 1);

  // assert
  assert.deepStrictEqual(health.silentDevices(), []);
});

test('goes silent a full window after a late arrival rather than a full window after the first', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock, monotonic);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1);
  health.recordShadowMessage(DEVICE_ID);

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1 + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

// A wall clock can be corrected by hand, stepped by NTP, or restored from a
// dead battery at boot, and a correction larger than the window would otherwise
// hand a pump that stopped speaking hours ago a fresh certificate of health.
// The window is measured against the forward-only base, so the correction moves
// nothing the verdict rests on (IN-03, D-06, D-07).
test('holds a pump silent when the wall clock is set back further than the whole window', () => {
  // arrange
  const { clock, monotonic, moveTo, moveWallTo } = movableClock();
  const health = healthWithAMessageAtStart(clock, monotonic);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // act
  moveWallTo(START_TIME - ONE_HOUR_MS);

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

// The forward-only source does not advance across a system suspend, so a home
// server that sleeps through the night wakes with that counter hours short and
// a pump that said nothing all night reads as recently heard. The wall term is
// the second opinion that covers it, and the larger of the two terms is what
// counts -- the smaller would be the exact inversion that hides the dead pump.
// The suspend behaviour itself is cited rather than observed; what this case
// pins is the arithmetic that answers it (D-07).
test('reports a pump silent on the wall term alone when the forward-only base has barely moved', () => {
  // arrange
  const { clock, monotonic, moveWallTo } = movableClock();
  const health = healthWithAMessageAtStart(clock, monotonic);

  // act
  moveWallTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

test('leaves the shadow silent when a poll succeeds, because a poll observed no live message', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock, monotonic);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // act
  health.recordRestSuccess();

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

test('leaves the polling path degraded when a shadow message arrives, because a message answered no request', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });
  health.recordRestFailure();
  health.recordRestFailure();
  moveTo(START_TIME + ONE_MISSED_HEARTBEAT_MS);

  // act
  health.recordShadowMessage(DEVICE_ID);

  // assert
  assert.strictEqual(health.trustNow().restDegraded, true);
});

test('leaves the silence window where it was when a poll fails, because a failed request observed no message', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock, monotonic);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1);

  // act
  health.recordRestFailure();

  // assert
  assert.deepStrictEqual(health.silentDevices(), []);
});

test('answers both facts together, so one degradation never reports the other', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock, monotonic);
  health.recordRestFailure();
  health.recordRestFailure();

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual({ ...health.trustNow(), silent: health.silentDevices() }, { restDegraded: true, silent: [DEVICE_ID] });
});

test('vouches for a shadow over a device it has only just admitted', () => {
  // arrange
  const { clock, monotonic } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });

  // act
  health.admitDevice(DEVICE_ID);

  // assert
  assert.deepStrictEqual({ ...health.trustNow(), silent: health.silentDevices() }, { restDegraded: false, silent: [] });
});

// The false normal guarded here is a broker the plugin can never reach reading
// as permanently trusted. Admission is the clock it is guarded by: a device
// discovery found and nothing ever heard from goes silent two heartbeats later,
// so a shadow that never connects never vouches for anything for long.
test('goes silent two heartbeats after admission when no message ever arrives', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });
  health.admitDevice(DEVICE_ID);

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

// One pump's heartbeat is no evidence about the pump beside it. An account
// stamp re-armed by whichever system spoke last leaves a controller that has
// stopped speaking fully vouched for, and every poll of that basement discarded
// (D-05, D-13).
test('names only the pump that stopped speaking when the pump beside it is still heartbeating', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = healthWithTwoAdmittedDevices(clock, monotonic);
  health.recordShadowMessage(DEVICE_ID);
  moveTo(START_TIME + ONE_MISSED_HEARTBEAT_MS);
  health.recordShadowMessage(OTHER_DEVICE_ID);

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

// The recovery, read on the same account the case above reads the withdrawal
// on. The quiet pump leaves the list the moment its own message arrives, and its
// heartbeating neighbour was never on it, so no report about either pump was
// ever spent on the other (D-03, D-04).
test('stops naming the quiet pump the moment it speaks, while the pump beside it was never named', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = healthWithTwoAdmittedDevices(clock, monotonic);
  moveTo(START_TIME + ONE_MISSED_HEARTBEAT_MS);
  health.recordShadowMessage(OTHER_DEVICE_ID);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);
  const whileOneIsQuiet = health.silentDevices();

  // act
  health.recordShadowMessage(DEVICE_ID);

  // assert
  assert.deepStrictEqual({ whileOneIsQuiet, afterItSpeaks: health.silentDevices() }, { whileOneIsQuiet: [DEVICE_ID], afterItSpeaks: [] });
});

// Nothing is watched before discovery admits it, so a projection told about no
// device reports no silence however long it is left. Silence is the absence of
// messages from a system the plugin knows it should be hearing from.
test('reports no silence for a system it has never been told about', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual(health.silentDevices(), []);
});

// An account whose systems come and go over months would otherwise accumulate a
// stamp per system for the life of the process, and go on withdrawing trust for
// a pump that was sold with the house.
test('stops reporting a system the account no longer carries', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });
  health.admitDevice(DEVICE_ID);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);
  const whileItIsCarried = health.silentDevices();

  // act
  health.forgetDevice(DEVICE_ID);

  // assert
  assert.deepStrictEqual({ whileItIsCarried, afterRemoval: health.silentDevices() }, { whileItIsCarried: [DEVICE_ID], afterRemoval: [] });
});

// Every poll admits every device it found, so a re-stamp here would restart the
// window of a pump that has been quiet for hours on every poll and the silence
// would never be reached -- the same false normal on a slower clock.
test('leaves a quiet pump quiet when a later poll admits it again', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });
  health.admitDevice(DEVICE_ID);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // act
  health.admitDevice(DEVICE_ID);

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

// The restart case, and the whole reason the anchor is persisted (D-07). The
// forward-only base restarts with the process, so on its own it says this pump
// was heard from an instant ago. The stored anchor is the second opinion that
// remembers the pump has been quiet since before the restart, and the larger of
// the two terms is what the verdict rests on.
test('holds a pump silent across a restart, when the stored anchor is older than the whole window', () => {
  // arrange
  const { clock, monotonic } = movableClock();
  const anchors = recordingAnchors([[DEVICE_ID, START_TIME - TWO_MISSED_HEARTBEATS_MS]]);
  const health = createMonitoringHealth({ clock, monotonic, anchors });

  // act
  health.admitDevice(DEVICE_ID);

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

// An install carrying no anchor invents nothing: the absence is not read as
// a recent arrival, and it is not read as silence either. The device is judged
// from its admission, on the forward-only term alone, exactly as it was before
// any anchor existed.
test('rests on the forward-only term alone when the store holds no anchor, rather than reading the absence as a recent arrival', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: anchorsThatStoreNothing() });
  health.admitDevice(DEVICE_ID);
  const atAdmission = health.silentDevices();

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual({ atAdmission, afterTwoHeartbeats: health.silentDevices() }, { atAdmission: [], afterTwoHeartbeats: [DEVICE_ID] });
});

// Admission is the right zero for a device the plugin has never heard from,
// and only for that device. Overwriting a restored anchor with the current
// instant is exactly how a restart comes to vouch for a pump that has been quiet
// for hours, so admission leaves a stored anchor alone. A message is different:
// something really did arrive, so it moves the anchor.
test('leaves a stored anchor where it is when a device is admitted, and moves it when a message arrives', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const restored = START_TIME - TWO_MISSED_HEARTBEATS_MS;
  const anchors = recordingAnchors([[DEVICE_ID, restored]]);
  const health = createMonitoringHealth({ clock, monotonic, anchors });
  moveTo(START_TIME + ONE_MISSED_HEARTBEAT_MS);
  health.admitDevice(DEVICE_ID);
  const afterAdmission = anchors.stored.get(DEVICE_ID);

  // act
  health.recordShadowMessage(DEVICE_ID);

  // assert
  assert.deepStrictEqual(
    { afterAdmission, afterAMessage: anchors.stored.get(DEVICE_ID) },
    { afterAdmission: restored, afterAMessage: START_TIME + ONE_MISSED_HEARTBEAT_MS },
  );
});

// The other half of the admission rule: a device the store has never held is
// anchored at its admission, so the very first run of a fresh install carries a
// wall term as well as a forward-only one.
test('anchors a device the store has never held at its admission', () => {
  // arrange
  const { clock, monotonic, moveTo } = movableClock();
  const anchors = recordingAnchors();
  const health = createMonitoringHealth({ clock, monotonic, anchors });

  // act
  moveTo(START_TIME + ONE_MISSED_HEARTBEAT_MS);
  health.admitDevice(DEVICE_ID);

  // assert
  assert.deepStrictEqual([...anchors.stored], [[DEVICE_ID, START_TIME + ONE_MISSED_HEARTBEAT_MS]]);
});

// The verdict answers the account-wide fact and nothing else. Silence is per
// controller and `silentDevices()` is where it is read, so a second member here
// would be one pump's answer handed to every pump (D-03). Whether a command can
// currently be sent depends on whether the runtime is stopped and whether
// authentication has halted for good, and this module sees neither; answering it
// here would mean answering it by guess, so the projection stops at what its own
// recorded facts support and the runtime assembles the rest (RES-04, D-07).
test('answers the one account-wide fact and nothing about silence or the command transport', () => {
  // arrange
  const { clock, monotonic } = movableClock();
  const health = createMonitoringHealth({ clock, monotonic, anchors: recordingAnchors() });

  // act
  const trust = health.trustNow();

  // assert
  assert.deepStrictEqual(Object.keys(trust), ['restDegraded']);
});
