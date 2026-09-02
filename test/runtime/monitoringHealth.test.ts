import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createMonitoringHealth, HEARTBEAT_INTERVAL_MS, MISSED_HEARTBEATS_BEFORE_SILENT, REST_FAILURE_THRESHOLD } from '../../src/runtime/monitoringHealth.js';

import type { Clock } from '../../src/runtime/clock.js';
import type { MonitoringHealth } from '../../src/runtime/monitoringHealth.js';

const START_TIME = 1_700_000_000_000;

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

// One clock a case moves by assignment, so elapsed time is stated rather than
// waited for.
interface MovableClock {
  clock: Clock;
  moveTo: (at: number) => void;
}

function movableClock(): MovableClock {
  let now = START_TIME;

  return {
    clock: { now: () => now },
    moveTo: (at: number): void => {
      now = at;
    },
  };
}

// A projection carrying one admitted device whose shadow arrival was stamped at
// the scenario's start, which is the state every elapsed-time case measures
// from. Admission comes first because that is the order the runtime uses: a
// poll finds the device, and its messages arrive afterwards.
function healthWithAMessageAtStart(clock: Clock): MonitoringHealth {
  const health = createMonitoringHealth({ clock });
  health.admitDevice(DEVICE_ID);
  health.recordShadowMessage(DEVICE_ID);

  return health;
}

// A projection carrying two admitted systems and no message from either, which
// is the state a two-pump account is in the moment discovery finds it.
function healthWithTwoAdmittedDevices(clock: Clock): MonitoringHealth {
  const health = createMonitoringHealth({ clock });
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
    const health = createMonitoringHealth({ clock: movableClock().clock });

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
  const health = createMonitoringHealth({ clock: movableClock().clock });
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
  const health = createMonitoringHealth({ clock: movableClock().clock });
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
    const { clock, moveTo } = movableClock();
    const health = healthWithAMessageAtStart(clock);

    // act
    moveTo(START_TIME + elapsedMs);

    // assert
    assert.strictEqual(health.trustNow().shadowSilent, silent);
  });
}

test('measures the silence from the newest message, so a late arrival restarts the window', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1);
  health.recordShadowMessage(DEVICE_ID);

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1 + TWO_MISSED_HEARTBEATS_MS - 1);

  // assert
  assert.strictEqual(health.trustNow().shadowSilent, false);
});

test('goes silent a full window after a late arrival rather than a full window after the first', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1);
  health.recordShadowMessage(DEVICE_ID);

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1 + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.strictEqual(health.trustNow().shadowSilent, true);
});

test('leaves the shadow silent when a poll succeeds, because a poll observed no live message', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // act
  health.recordRestSuccess();

  // assert
  assert.strictEqual(health.trustNow().shadowSilent, true);
});

test('leaves the polling path degraded when a shadow message arrives, because a message answered no request', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock });
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
  const { clock, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS - 1);

  // act
  health.recordRestFailure();

  // assert
  assert.strictEqual(health.trustNow().shadowSilent, false);
});

test('answers both facts together, so one degradation never reports the other', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = healthWithAMessageAtStart(clock);
  health.recordRestFailure();
  health.recordRestFailure();

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual(health.trustNow(), { restDegraded: true, shadowSilent: true });
});

test('vouches for a shadow over a device it has only just admitted', () => {
  // arrange
  const { clock } = movableClock();
  const health = createMonitoringHealth({ clock });

  // act
  health.admitDevice(DEVICE_ID);

  // assert
  assert.deepStrictEqual(health.trustNow(), { restDegraded: false, shadowSilent: false });
});

// The false normal guarded here is a broker the plugin can never reach reading
// as permanently trusted. Admission is the clock it is guarded by: a device
// discovery found and nothing ever heard from goes silent two heartbeats later,
// so a shadow that never connects never vouches for anything for long.
test('goes silent two heartbeats after admission when no message ever arrives', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock });
  health.admitDevice(DEVICE_ID);

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.strictEqual(health.trustNow().shadowSilent, true);
});

// One pump's heartbeat is no evidence about the pump beside it. An account
// stamp re-armed by whichever system spoke last leaves a controller that has
// stopped speaking fully vouched for, and every poll of that basement discarded
// (D-05, D-13).
test('names only the pump that stopped speaking when the pump beside it is still heartbeating', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = healthWithTwoAdmittedDevices(clock);
  health.recordShadowMessage(DEVICE_ID);
  moveTo(START_TIME + ONE_MISSED_HEARTBEAT_MS);
  health.recordShadowMessage(OTHER_DEVICE_ID);

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

// The marking every accessory hears is one answer, so any system the plugin has
// stopped watching costs the account its claim to be watching. Which one it was
// is the failure log's line, not this verdict (D-02, D-03).
test('stops vouching for the account while one pump is quiet and vouches again once it speaks', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = healthWithTwoAdmittedDevices(clock);
  moveTo(START_TIME + ONE_MISSED_HEARTBEAT_MS);
  health.recordShadowMessage(OTHER_DEVICE_ID);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);
  const whileOneIsQuiet = health.trustNow().shadowSilent;

  // act
  health.recordShadowMessage(DEVICE_ID);

  // assert
  assert.deepStrictEqual({ whileOneIsQuiet, afterItSpeaks: health.trustNow().shadowSilent }, { whileOneIsQuiet: true, afterItSpeaks: false });
});

// Nothing is watched before discovery admits it, so a projection told about no
// device reports no silence however long it is left. Silence is the absence of
// messages from a system the plugin knows it should be hearing from.
test('reports no silence for a system it has never been told about', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock });

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.deepStrictEqual({ silent: health.silentDevices(), account: health.trustNow().shadowSilent }, { silent: [], account: false });
});

// An account whose systems come and go over months would otherwise accumulate a
// stamp per system for the life of the process, and go on withdrawing trust for
// a pump that was sold with the house.
test('stops reporting a system the account no longer carries', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock });
  health.admitDevice(DEVICE_ID);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);
  const whileItIsCarried = health.silentDevices();

  // act
  health.forgetDevice(DEVICE_ID);

  // assert
  assert.deepStrictEqual(
    { whileItIsCarried, afterRemoval: health.silentDevices(), account: health.trustNow().shadowSilent },
    { whileItIsCarried: [DEVICE_ID], afterRemoval: [], account: false },
  );
});

// Every poll admits every device it found, so a re-stamp here would restart the
// window of a pump that has been quiet for hours on every poll and the silence
// would never be reached -- the same false normal on a slower clock.
test('leaves a quiet pump quiet when a later poll admits it again', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock });
  health.admitDevice(DEVICE_ID);
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // act
  health.admitDevice(DEVICE_ID);

  // assert
  assert.deepStrictEqual(health.silentDevices(), [DEVICE_ID]);
});

// Whether a command can currently be sent depends on whether the runtime is stopped and whether
// authentication has halted for good, and this module sees neither. Answering it here would mean
// answering it by guess, so the projection stops at what its own two recorded facts support and the
// runtime assembles the rest (RES-04, D-07).
test('answers the two transport facts and nothing about the command transport', () => {
  // arrange
  const { clock } = movableClock();
  const health = createMonitoringHealth({ clock });

  // act
  const trust = health.trustNow();

  // assert
  assert.deepStrictEqual(Object.keys(trust).sort(), ['restDegraded', 'shadowSilent']);
});
