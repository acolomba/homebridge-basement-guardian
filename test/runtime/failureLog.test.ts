import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createFailureLog, FAILURE_REMINDER_MS } from '../../src/runtime/failureLog.js';

import type { Clock } from '../../src/runtime/clock.js';
import type { FailureLog } from '../../src/runtime/failureLog.js';
import type { LogLevel, Logging } from 'homebridge';

const ROTATION = 'Credential rotation';
const POLLING = 'Device polling';
const ROTATION_REASON = 'The temporary credentials could not be refreshed.';
const POLLING_REASON = 'The device poll could not be completed.';

const THIRTY_SECONDS_MS = 30_000;
const ONE_HOUR_MS = 3_600_000;

// A clock the case moves by hand, so an hour of failures runs instantly.
function movableClock(): { clock: Clock; advance: (ms: number) => void } {
  let value = 1_700_000_000_000;

  return {
    clock: { now: () => value },
    advance: (ms: number): void => {
      value += ms;
    },
  };
}

function recordingLog(recorded: string[]): Logging {
  function at(level: string): (message: string) => void {
    return (message: string): void => {
      recorded.push(`${level} ${message}`);
    };
  }

  return Object.assign(at('info'), {
    prefix: 'basement guardian',
    debug: at('debug'),
    error: at('error'),
    info: at('info'),
    success: at('success'),
    warn: at('warn'),
    log: (level: LogLevel, message: string): void => {
      recorded.push(`${level} ${message}`);
    },
  });
}

function failureLogWith(recorded: string[], clock: Clock): FailureLog {
  return createFailureLog({ clock, log: recordingLog(recorded), reminderIntervalMs: FAILURE_REMINDER_MS });
}

describe('FAILURE_REMINDER_MS', () => {
  test('D-14 reminds every fifteen minutes', () => {
    // act & assert
    assert.strictEqual(FAILURE_REMINDER_MS, 900_000);
  });
});

describe('recordFailure', () => {
  test('warns once with the supplied reason on the first failure of a kind', () => {
    // arrange
    const recorded: string[] = [];
    const failures = failureLogWith(recorded, movableClock().clock);

    // act
    failures.recordFailure(ROTATION, ROTATION_REASON);

    // assert
    assert.deepStrictEqual(recorded, [`warn ${ROTATION_REASON}`]);
  });

  test('drops the second and third consecutive failures of a kind to debug', () => {
    // arrange
    const recorded: string[] = [];
    const { clock, advance } = movableClock();
    const failures = failureLogWith(recorded, clock);

    // act
    failures.recordFailure(ROTATION, ROTATION_REASON);
    advance(THIRTY_SECONDS_MS);
    failures.recordFailure(ROTATION, ROTATION_REASON);
    advance(THIRTY_SECONDS_MS);
    failures.recordFailure(ROTATION, ROTATION_REASON);

    // assert
    assert.deepStrictEqual(recorded, [`warn ${ROTATION_REASON}`, `debug ${ROTATION_REASON}`, `debug ${ROTATION_REASON}`]);
  });

  test('D-14 warns again once the reminder interval has elapsed', () => {
    // arrange
    const recorded: string[] = [];
    const { clock, advance } = movableClock();
    const failures = failureLogWith(recorded, clock);

    // act
    failures.recordFailure(ROTATION, ROTATION_REASON);
    advance(FAILURE_REMINDER_MS);
    failures.recordFailure(ROTATION, ROTATION_REASON);

    // assert
    assert.deepStrictEqual(recorded, [`warn ${ROTATION_REASON}`, `warn ${ROTATION_REASON}`]);
  });

  test('restarts the reminder interval from the reminder it emitted', () => {
    // arrange
    const recorded: string[] = [];
    const { clock, advance } = movableClock();
    const failures = failureLogWith(recorded, clock);

    // act
    failures.recordFailure(ROTATION, ROTATION_REASON);
    advance(FAILURE_REMINDER_MS);
    failures.recordFailure(ROTATION, ROTATION_REASON);
    advance(FAILURE_REMINDER_MS - THIRTY_SECONDS_MS);
    failures.recordFailure(ROTATION, ROTATION_REASON);

    // assert
    assert.deepStrictEqual(recorded, [`warn ${ROTATION_REASON}`, `warn ${ROTATION_REASON}`, `debug ${ROTATION_REASON}`]);
  });

  test('gives a second kind its own first warning and its own reminder clock', () => {
    // arrange
    const recorded: string[] = [];
    const { clock, advance } = movableClock();
    const failures = failureLogWith(recorded, clock);

    // act
    failures.recordFailure(ROTATION, ROTATION_REASON);
    advance(THIRTY_SECONDS_MS);
    failures.recordFailure(POLLING, POLLING_REASON);
    advance(FAILURE_REMINDER_MS - THIRTY_SECONDS_MS);
    failures.recordFailure(ROTATION, ROTATION_REASON);
    failures.recordFailure(POLLING, POLLING_REASON);

    // assert
    assert.deepStrictEqual(recorded, [`warn ${ROTATION_REASON}`, `warn ${POLLING_REASON}`, `warn ${ROTATION_REASON}`, `debug ${POLLING_REASON}`]);
  });

  test('D-14 warns four times over an hour of failures thirty seconds apart', () => {
    // arrange
    const recorded: string[] = [];
    const { clock, advance } = movableClock();
    const failures = failureLogWith(recorded, clock);

    // act
    for (let elapsed = 0; elapsed < ONE_HOUR_MS; elapsed += THIRTY_SECONDS_MS) {
      failures.recordFailure(ROTATION, ROTATION_REASON);
      advance(THIRTY_SECONDS_MS);
    }

    // assert
    assert.deepStrictEqual(
      { warnings: recorded.filter((line) => line.startsWith('warn ')).length, reports: recorded.length },
      { warnings: 4, reports: ONE_HOUR_MS / THIRTY_SECONDS_MS },
    );
  });
});

describe('recordSuccess', () => {
  test('logs one informational recovery line for a kind that was failing', () => {
    // arrange
    const recorded: string[] = [];
    const failures = failureLogWith(recorded, movableClock().clock);
    failures.recordFailure(ROTATION, ROTATION_REASON);

    // act
    failures.recordSuccess(ROTATION);

    // assert
    assert.deepStrictEqual(recorded, [`warn ${ROTATION_REASON}`, `info ${ROTATION} recovered.`]);
  });

  test('logs nothing for a kind that was not failing', () => {
    // arrange
    const recorded: string[] = [];
    const failures = failureLogWith(recorded, movableClock().clock);

    // act
    failures.recordSuccess(ROTATION);

    // assert
    assert.deepStrictEqual(recorded, []);
  });

  test('logs nothing on a second consecutive success', () => {
    // arrange
    const recorded: string[] = [];
    const failures = failureLogWith(recorded, movableClock().clock);
    failures.recordFailure(ROTATION, ROTATION_REASON);
    failures.recordSuccess(ROTATION);

    // act
    failures.recordSuccess(ROTATION);

    // assert
    assert.deepStrictEqual(recorded, [`warn ${ROTATION_REASON}`, `info ${ROTATION} recovered.`]);
  });

  test('leaves a recovered kind able to warn again rather than continuing at debug', () => {
    // arrange
    const recorded: string[] = [];
    const { clock, advance } = movableClock();
    const failures = failureLogWith(recorded, clock);
    failures.recordFailure(ROTATION, ROTATION_REASON);
    advance(THIRTY_SECONDS_MS);
    failures.recordSuccess(ROTATION);
    advance(THIRTY_SECONDS_MS);

    // act
    failures.recordFailure(ROTATION, ROTATION_REASON);

    // assert
    assert.deepStrictEqual(recorded, [`warn ${ROTATION_REASON}`, `info ${ROTATION} recovered.`, `warn ${ROTATION_REASON}`]);
  });

  test('keeps one kind recovery from clearing another kind that is still failing', () => {
    // arrange
    const recorded: string[] = [];
    const { clock, advance } = movableClock();
    const failures = failureLogWith(recorded, clock);
    failures.recordFailure(ROTATION, ROTATION_REASON);
    failures.recordFailure(POLLING, POLLING_REASON);

    // act
    failures.recordSuccess(ROTATION);
    advance(THIRTY_SECONDS_MS);
    failures.recordFailure(POLLING, POLLING_REASON);

    // assert
    assert.deepStrictEqual(recorded, [`warn ${ROTATION_REASON}`, `warn ${POLLING_REASON}`, `info ${ROTATION} recovered.`, `debug ${POLLING_REASON}`]);
  });
});
