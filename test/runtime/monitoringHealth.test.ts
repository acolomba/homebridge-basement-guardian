import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createMonitoringHealth, HEARTBEAT_INTERVAL_MS, MISSED_HEARTBEATS_BEFORE_SILENT, REST_FAILURE_THRESHOLD } from '../../src/runtime/monitoringHealth.js';

import type { Clock } from '../../src/runtime/clock.js';
import type { MonitoringHealth } from '../../src/runtime/monitoringHealth.js';

const START_TIME = 1_700_000_000_000;

// The one system on the account every single-device case is about.
const DEVICE_ID = 'placeholder-device';

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

// A projection whose shadow arrival was stamped at the scenario's start, which
// is the state every elapsed-time case measures from.
function healthWithAMessageAtStart(clock: Clock): MonitoringHealth {
  const health = createMonitoringHealth({ clock });
  health.recordShadowMessage(DEVICE_ID);

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

test('vouches for a shadow it has only just been built over', () => {
  // arrange
  const { clock } = movableClock();

  // act
  const health = createMonitoringHealth({ clock });

  // assert
  assert.deepStrictEqual(health.trustNow(), { restDegraded: false, shadowSilent: false });
});

test('goes silent two heartbeats after construction when no message ever arrives', () => {
  // arrange
  const { clock, moveTo } = movableClock();
  const health = createMonitoringHealth({ clock });

  // act
  moveTo(START_TIME + TWO_MISSED_HEARTBEATS_MS);

  // assert
  assert.strictEqual(health.trustNow().shadowSilent, true);
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
