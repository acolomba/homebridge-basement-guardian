// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests control writes and refusal diagnostics.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mock, verify, when } from 'strong-mock';

import { createFakeHap } from '../../features/lib/hap.js';
import { bindRestoredControlRefusal, createControlBinder } from '../../src/accessories/controls.js';

import type { FakeHapCharacteristic, FakeHapService, FakeSetHandler } from '../../features/lib/hap.js';
import type { ControlBinder, ControlBinderOptions } from '../../src/accessories/controls.js';
import type { DeviceCapability } from '../../src/device/family.js';
import type { CommandOutcome, CommandPort } from '../../src/runtime/commandPort.js';
import type { Timers } from '../../src/runtime/timers.js';
import type { API, Logging, Service } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const SELF_TEST = 'system-self-test';
const ALARM_MUTE = 'alarm-mute';

// The outcome the command port answers for a write no local rule refuses, fresh on every call. A
// local refusal never reaches it, so the value it carries is irrelevant to those rows.
function acceptedOutcome(): CommandOutcome {
  return { accepted: true };
}

// The statuses this binder answers, written out here rather than read off the namespace, so a
// drifted mapping fails at the assertion as well as behind it (D-04).
const NOT_ALLOWED_IN_CURRENT_STATE = -70412;
const RESOURCE_BUSY = -70403;
const SERVICE_COMMUNICATION_FAILURE = -70402;
const OPERATION_TIMED_OUT = -70408;
const SUCCESS = 0;

// The namespace holds no per-case state: a service and its characteristics live on the service that
// added them, so one stand-in serves every case.
const HAP = createFakeHap();

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];

// The stand-in answers the members the binder reads and nothing else, which no structural type can
// express; this is the one place a stand-in service stands where the binder takes a Service.
function asService(service: FakeHapService): Service {
  return service as unknown as Service;
}

/** One deferral the binder asked the injected port for. */
interface Deferral {
  delayMs: number;
  run: () => void;
  handle: number;
}

// A log stand-in that collects the warnings a case reads back and discards every other level.
function warningLog(warnings: string[]): Logging {
  const noop = (): void => {
    // only the warning channel is read back
  };

  return Object.assign(noop, {
    prefix: 'basement guardian',
    debug: noop,
    error: noop,
    info: noop,
    log: noop,
    success: noop,
    warn: (message: string) => {
      warnings.push(message);
    },
  });
}

function silentLog(): Logging {
  const noop = (): void => {
    // the cases using this stub do not read the log; the stub discards every call
  };

  return Object.assign(noop, { prefix: 'basement guardian', debug: noop, error: noop, info: noop, log: noop, success: noop, warn: noop });
}

// A `Timers` stand-in that records the deferral rather than arming one, so a case reads back the
// delay the binder asked for and runs the handler itself.
function recordingTimers(): { timers: Timers; deferrals: Deferral[]; cancelled: unknown[] } {
  const deferrals: Deferral[] = [];
  const cancelled: unknown[] = [];
  const timers: Timers = {
    setTimeout: (run: () => void, delayMs: number) => {
      const handle = deferrals.length;
      deferrals.push({ delayMs, run, handle });

      return handle;
    },
    setInterval: () => undefined,
    clearTimeout: (handle: unknown) => {
      cancelled.push(handle);
    },
    clearInterval: () => undefined,
  };

  return { timers, deferrals, cancelled };
}

// A `CommandPort` stub for a case whose promise is not what was sent. It answers every send with a
// fresh outcome and records nothing; a case that promises which commands were sent takes a strict
// mock instead.
function answeringCommands(outcome: () => CommandOutcome): CommandPort {
  return { send: () => Promise.resolve(outcome()) };
}

function switchService(): FakeHapService {
  return new HAP.Service.Switch('System Self-Test', SELF_TEST);
}

function onCharacteristic(service: FakeHapService): FakeHapCharacteristic {
  const characteristic = service.getCharacteristic(HAP.Characteristic.On);

  if (characteristic === undefined) {
    throw new Error('the Switch stand-in carries no On characteristic');
  }

  return characteristic;
}

interface BinderOverrides {
  commands?: CommandPort;
  timers?: Timers;
  republish?: () => void;
  log?: Logging;
  offlineConfirmed?: () => boolean;
  commandTransportReady?: () => boolean;
  liveConfirmationObservable?: () => boolean;
}

function binderOptions(overrides: BinderOverrides = {}): ControlBinderOptions {
  return {
    hap: HAP_NAMESPACE,
    log: overrides.log ?? silentLog(),
    timers: overrides.timers ?? recordingTimers().timers,
    commands: overrides.commands ?? answeringCommands(acceptedOutcome),
    deviceId: DEVICE_ID,
    offlineConfirmed: overrides.offlineConfirmed ?? ((): boolean => false),
    commandTransportReady: overrides.commandTransportReady ?? ((): boolean => true),
    liveConfirmationObservable: overrides.liveConfirmationObservable ?? ((): boolean => true),
    republish: overrides.republish ?? ((): void => undefined),
  };
}

// A bound Switch, with the binder that owns it, which is the shape every case starts from.
function boundSwitch(overrides: BinderOverrides = {}, reported: () => boolean | undefined = () => false): { binder: ControlBinder; service: FakeHapService } {
  const binder = createControlBinder(binderOptions(overrides));
  const service = switchService();

  binder.bind(asService(service), 'self-test', reported);

  return { binder, service };
}

// The refusal's clearing push, told apart from any other deferral by the delay it was armed at.
function clearingPushesIn(deferrals: readonly Deferral[]): readonly Deferral[] {
  return deferrals.filter((deferral) => deferral.delayMs === 0);
}

// The rejection one write answers, captured as a value so a case can act first and assert it with
// the rest of the outcome afterwards. A write that resolves answers `undefined`.
async function writeRejection(service: FakeHapService, value: unknown): Promise<unknown> {
  try {
    await onCharacteristic(service).handleSetRequest(value);
  } catch (error: unknown) {
    return error;
  }

  return undefined;
}

/** One call a spy on `onSet` recorded. */
interface OnSetCall {
  readonly arguments: readonly [FakeSetHandler];
}

// The set handler the code under test registered, read off a spy on `onSet`, so a case can call it
// directly and see the error it throws before the stand-in converts that error to a bare status.
function registeredHandler(calls: readonly OnSetCall[]): FakeSetHandler {
  const handler = calls[0]?.arguments[0];

  if (handler === undefined) {
    throw new Error('no set handler was registered');
  }

  return handler;
}

test('refuses a write of false, sends nothing, and leaves the stored value where HAP had it', async () => {
  // arrange
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  const { timers, deferrals } = recordingTimers();
  const { service } = boundSwitch({ commands, timers });
  onCharacteristic(service).value = true;

  // act
  const thrown = await writeRejection(service, false);
  const afterRefusal = { value: onCharacteristic(service).value, statusCode: onCharacteristic(service).statusCode };
  deferrals[0]?.run();

  // assert
  assert.deepStrictEqual(
    { thrown, afterRefusal },
    { thrown: NOT_ALLOWED_IN_CURRENT_STATE, afterRefusal: { value: true, statusCode: NOT_ALLOWED_IN_CURRENT_STATE } },
  );
  assert.strictEqual(onCharacteristic(service).statusCode, SUCCESS);
  verify(commands);
});

test('arms the clearing push as a macrotask at delay 0 rather than running it inline', async () => {
  // arrange
  const { timers, deferrals } = recordingTimers();
  const { service } = boundSwitch({ timers });

  // act
  const thrown = await writeRejection(service, false);

  // assert
  assert.deepStrictEqual({ thrown, delays: deferrals.map((deferral) => deferral.delayMs) }, { thrown: NOT_ALLOWED_IN_CURRENT_STATE, delays: [0] });
});

test('sends one on request, holds the capability pending, and pushes nothing back', async () => {
  // arrange
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  when(() => commands.send(DEVICE_ID, 'self-test', true)).thenResolve(acceptedOutcome());
  const { timers, deferrals } = recordingTimers();
  const republished: string[] = [];
  const { binder, service } = boundSwitch({
    commands,
    timers,
    republish: () => {
      republished.push('republish');
    },
  });

  // act
  await onCharacteristic(service).handleSetRequest(true);

  // assert
  assert.deepStrictEqual([...binder.pending], ['self-test']);
  assert.deepStrictEqual(
    {
      value: onCharacteristic(service).value,
      pushed: onCharacteristic(service).pushed,
      delays: deferrals.map((deferral) => deferral.delayMs),
      republished,
    },
    { value: true, pushed: false, delays: [30000], republished: [] },
  );
  verify(commands);
});

test('clears the pending entry on the reported value the request asked for', async () => {
  // arrange
  const { binder, service } = boundSwitch();
  await onCharacteristic(service).handleSetRequest(true);

  // act
  binder.reconcile('self-test', true);

  // assert
  assert.deepStrictEqual([...binder.pending], []);
});

test('keeps the capability pending while the device still reports the old value', async () => {
  // arrange
  const { timers, cancelled } = recordingTimers();
  const { binder, service } = boundSwitch({ timers });
  await onCharacteristic(service).handleSetRequest(true);

  // act
  binder.reconcile('self-test', false);

  // assert
  assert.deepStrictEqual({ pending: [...binder.pending], cancelled }, { pending: ['self-test'], cancelled: [] });
});

test('keeps the capability pending while the scope carrying its reported value has not decoded', async () => {
  // arrange
  const { timers, cancelled } = recordingTimers();
  const { binder, service } = boundSwitch({ timers });
  await onCharacteristic(service).handleSetRequest(true);

  // act
  binder.reconcile('self-test', undefined);

  // assert
  assert.deepStrictEqual({ pending: [...binder.pending], cancelled }, { pending: ['self-test'], cancelled: [] });
});

test('refuses a second on request while the first waits for the device, and sends one command', async () => {
  // arrange
  const warnings: string[] = [];
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  when(() => commands.send(DEVICE_ID, 'self-test', true)).thenResolve(acceptedOutcome());
  const { timers, deferrals, cancelled } = recordingTimers();
  const { binder, service } = boundSwitch({ commands, timers, log: warningLog(warnings) });
  await onCharacteristic(service).handleSetRequest(true);

  // act
  let thrown: unknown = undefined;

  try {
    await onCharacteristic(service).handleSetRequest(true);
  } catch (error: unknown) {
    thrown = error;
  }

  // assert
  assert.deepStrictEqual(
    { thrown, pending: [...binder.pending], delays: deferrals.map((deferral) => deferral.delayMs), cancelled, warnings },
    {
      thrown: RESOURCE_BUSY,
      pending: ['self-test'],
      delays: [30000, 0],
      cancelled: [],
      warnings: [`Refused self-test on ${DEVICE_ID}: an earlier request is still waiting for the device to confirm it.`],
    },
  );
  verify(commands);
});

test('keeps the request pending when the vendor does not answer in time', async () => {
  // arrange
  const warnings: string[] = [];
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  when(() => commands.send(DEVICE_ID, 'self-test', true)).thenResolve({ accepted: false, failure: 'timed-out' });
  const { timers, deferrals, cancelled } = recordingTimers();
  const { binder, service } = boundSwitch({ commands, timers, log: warningLog(warnings) });

  // act
  let thrown: unknown = undefined;

  try {
    await onCharacteristic(service).handleSetRequest(true);
  } catch (error: unknown) {
    thrown = error;
  }

  // assert
  assert.deepStrictEqual(
    { thrown, pending: [...binder.pending], delays: deferrals.map((deferral) => deferral.delayMs), cancelled, warnings },
    {
      thrown: OPERATION_TIMED_OUT,
      pending: ['self-test'],
      delays: [30000, 0],
      cancelled: [],
      warnings: [`The self-test request on ${DEVICE_ID} did not take effect: timed-out. It is not retried.`],
    },
  );
  verify(commands);
});

for (const reported of [true, false, undefined]) {
  test(`reconciles a capability that was never pending against a reported ${String(reported)} without creating one`, () => {
    // arrange
    const { timers, cancelled } = recordingTimers();
    const { binder } = boundSwitch({ timers });

    // act
    binder.reconcile('self-test', reported);
    binder.reconcile('self-test', reported);

    // assert
    assert.deepStrictEqual({ pending: [...binder.pending], cancelled }, { pending: [], cancelled: [] });
  });
}

test('registers one handler however many times a service is bound', (t) => {
  // arrange
  const binder = createControlBinder(binderOptions());
  const service = switchService();
  const characteristic = onCharacteristic(service);
  const onSetSpy = t.mock.method(characteristic, 'onSet');

  // act
  binder.bind(asService(service), 'self-test', () => false);
  binder.bind(asService(service), 'self-test', () => false);

  // assert
  assert.strictEqual(onSetSpy.mock.callCount(), 1);
});

for (const { failure, status, pendingAfterRefusal } of [
  { failure: 'vendor-error', status: SERVICE_COMMUNICATION_FAILURE, pendingAfterRefusal: [] },
  { failure: 'timed-out', status: OPERATION_TIMED_OUT, pendingAfterRefusal: ['self-test'] },
] as const) {
  test(`answers ${String(status)} for a ${failure} outcome, leaves pending [${pendingAfterRefusal.join(', ')}], and sends nothing further`, async () => {
    // arrange
    const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
    when(() => commands.send(DEVICE_ID, 'self-test', true)).thenResolve({ accepted: false, failure });
    const { timers, deferrals } = recordingTimers();
    const republished: string[] = [];
    const { binder, service } = boundSwitch({
      commands,
      timers,
      republish: () => {
        republished.push('republish');
      },
    });

    // act
    const thrown = await writeRejection(service, true);
    const afterTheRefusal = { statusCode: onCharacteristic(service).statusCode, republished: [...republished] };
    clearingPushesIn(deferrals)[0]?.run();

    // assert
    assert.deepStrictEqual(
      { thrown, pending: [...binder.pending], afterTheRefusal, afterTheClearingPush: { statusCode: onCharacteristic(service).statusCode, republished } },
      {
        thrown: status,
        pending: pendingAfterRefusal,
        afterTheRefusal: { statusCode: status, republished: [] },
        afterTheClearingPush: { statusCode: SUCCESS, republished: ['republish'] },
      },
    );
    verify(commands);
  });
}

// The reported value changes between the refusal and the push, so a push of the value read at the
// write fails here.
test('pushes the reported value the accessory answers when the clearing push runs', async () => {
  // arrange
  const { timers, deferrals } = recordingTimers();
  let reported = false;
  const { service } = boundSwitch({ timers }, () => reported);

  // act
  const thrown = await writeRejection(service, false);
  reported = true;
  deferrals[0]?.run();

  // assert
  assert.deepStrictEqual(
    { thrown, value: onCharacteristic(service).value, statusCode: onCharacteristic(service).statusCode },
    { thrown: NOT_ALLOWED_IN_CURRENT_STATE, value: true, statusCode: SUCCESS },
  );
});

// A row publishes `On` only while it can vouch for the reported value, so a refusal answered while
// the control's own scope is untrustworthy would leave the status standing. The push falls back to
// the value the characteristic already carries, which clears the status and states nothing new.
for (const held of [true, false]) {
  test(`clears the refusal status from the held value of ${String(held)} when no reported value can be vouched for`, async () => {
    // arrange
    const { timers, deferrals } = recordingTimers();
    const { service } = boundSwitch({ timers }, () => undefined);
    onCharacteristic(service).value = held;

    // act
    const thrown = await writeRejection(service, false);
    deferrals[0]?.run();

    // assert
    assert.deepStrictEqual(
      { thrown, value: onCharacteristic(service).value, statusCode: onCharacteristic(service).statusCode },
      { thrown: NOT_ALLOWED_IN_CURRENT_STATE, value: held, statusCode: SUCCESS },
    );
  });
}

test('names the capability, the device and the cause in the one line a refusal logs, and quotes nothing else', async () => {
  // arrange
  const warnings: string[] = [];
  const log = warningLog(warnings);
  const commands = answeringCommands(() => ({ accepted: false, failure: 'timed-out' }));
  const { service } = boundSwitch({ commands, log });

  // act
  const thrown = await writeRejection(service, true);

  // assert
  assert.deepStrictEqual(
    { thrown, warnings },
    { thrown: OPERATION_TIMED_OUT, warnings: [`The self-test request on ${DEVICE_ID} did not take effect: timed-out. It is not retried.`] },
  );
});

// The eight ways one write against an idle control can end: six the plugin answers by itself and two
// the vendor answers. The local rows follow the binder's table order, but each row sets one
// condition, so these rows pin each cause, status and log line, not the order. The precedence cases
// pin the order: each sets two conditions and names the rule that must answer. A press while an
// earlier request waits is the binder's other local refusal. It needs that earlier press, so its own
// case, 'refuses a second on request while the first waits for the device, and sends one command',
// covers it. Every case below is read off this one table, so a cause that stops being refused, or
// that starts answering a different status, fails by name.
interface RefusalCase {
  readonly cause: string;
  readonly value: unknown;
  readonly reported: boolean | undefined;
  readonly offlineConfirmed: boolean;
  readonly transportReady: boolean;
  readonly confirmationObservable: boolean;
  /** Builds the outcome the command port answers, fresh for every send. */
  readonly outcome: () => CommandOutcome;
  readonly status: number;
  readonly expectedWarning: string;
  readonly pendingAfterRefusal: readonly DeviceCapability[];
  /** The delays the binder armed for the write, in order. */
  readonly delaysAfterRefusal: readonly number[];
}

// A vendor row also carries the handles the refusal cancelled, the rest of the timer record it
// leaves.
interface VendorRefusalCase extends RefusalCase {
  readonly cancelledAfterRefusal: readonly number[];
}

const LOCAL_REFUSALS: readonly RefusalCase[] = [
  {
    cause: 'a write of anything but on',
    expectedWarning: 'Refused self-test on account-1_serial-1: only an on request is supported, and the device reports when the condition ends.',
    value: false,
    reported: false,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: true,
    outcome: acceptedOutcome,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    pendingAfterRefusal: [],
    delaysAfterRefusal: [0],
  },
  {
    cause: 'a runtime with no way to reach the vendor',
    expectedWarning: 'Refused self-test on account-1_serial-1: the plugin has no way to reach the vendor right now.',
    value: true,
    reported: false,
    offlineConfirmed: false,
    transportReady: false,
    confirmationObservable: true,
    outcome: acceptedOutcome,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    pendingAfterRefusal: [],
    delaysAfterRefusal: [0],
  },
  {
    cause: 'a live path that cannot carry the device answer',
    expectedWarning: 'Refused self-test on account-1_serial-1: the live connection is quiet, so the plugin cannot see the device confirm the command.',
    value: true,
    reported: false,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: false,
    outcome: acceptedOutcome,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    pendingAfterRefusal: [],
    delaysAfterRefusal: [0],
  },
  {
    cause: 'a capability whose reported field has not decoded',
    expectedWarning: 'Refused self-test on account-1_serial-1: the plugin has no fresh state for it.',
    value: true,
    reported: undefined,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: true,
    outcome: acceptedOutcome,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    pendingAfterRefusal: [],
    delaysAfterRefusal: [0],
  },
  {
    cause: 'a device confirmed offline',
    expectedWarning: 'Refused self-test on account-1_serial-1: the device is confirmed offline.',
    value: true,
    reported: false,
    offlineConfirmed: true,
    transportReady: true,
    confirmationObservable: true,
    outcome: acceptedOutcome,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    pendingAfterRefusal: [],
    delaysAfterRefusal: [0],
  },
  {
    cause: 'a duplicate request while the capability already reads active',
    expectedWarning: 'Refused self-test on account-1_serial-1: it already reads active.',
    value: true,
    reported: true,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: true,
    outcome: acceptedOutcome,
    status: RESOURCE_BUSY,
    pendingAfterRefusal: [],
    delaysAfterRefusal: [0],
  },
];

const VENDOR_REFUSALS: readonly VendorRefusalCase[] = [
  {
    cause: 'a vendor error',
    expectedWarning: 'The self-test request on account-1_serial-1 did not take effect: vendor-error. It is not retried.',
    value: true,
    reported: false,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: true,
    outcome: () => ({ accepted: false, failure: 'vendor-error' }),
    status: SERVICE_COMMUNICATION_FAILURE,
    pendingAfterRefusal: [],
    delaysAfterRefusal: [30000, 0],
    cancelledAfterRefusal: [0],
  },
  {
    cause: 'an exceeded deadline',
    expectedWarning: 'The self-test request on account-1_serial-1 did not take effect: timed-out. It is not retried.',
    value: true,
    reported: false,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: true,
    outcome: () => ({ accepted: false, failure: 'timed-out' }),
    status: OPERATION_TIMED_OUT,
    pendingAfterRefusal: ['self-test'],
    delaysAfterRefusal: [30000, 0],
    cancelledAfterRefusal: [],
  },
];

const REFUSALS: readonly RefusalCase[] = [...LOCAL_REFUSALS, ...VENDOR_REFUSALS];

// One write against one row of the table through the command port the case hands in, with
// everything the assertions read back.
async function refuse(
  refusalCase: RefusalCase,
  commands: CommandPort,
): Promise<{ thrown: unknown; deferrals: Deferral[]; cancelled: unknown[]; binder: ControlBinder; service: FakeHapService }> {
  const { timers, deferrals, cancelled } = recordingTimers();
  const { binder, service } = boundSwitch(
    {
      commands,
      timers,
      offlineConfirmed: () => refusalCase.offlineConfirmed,
      commandTransportReady: () => refusalCase.transportReady,
      liveConfirmationObservable: () => refusalCase.confirmationObservable,
    },
    () => refusalCase.reported,
  );
  let thrown: unknown = undefined;

  try {
    await onCharacteristic(service).handleSetRequest(refusalCase.value);
  } catch (error: unknown) {
    thrown = error;
  }

  return { thrown, deferrals, cancelled, binder, service };
}

for (const refusalCase of REFUSALS) {
  test(`answers ${String(refusalCase.status)} for ${refusalCase.cause}`, async () => {
    // act
    const { thrown } = await refuse(refusalCase, answeringCommands(refusalCase.outcome));

    // assert
    assert.strictEqual(thrown, refusalCase.status);
  });
}

for (const refusalCase of LOCAL_REFUSALS) {
  test(`sends nothing at all for ${refusalCase.cause}`, async () => {
    // arrange
    const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });

    // act
    const { thrown, binder } = await refuse(refusalCase, commands);

    // assert
    assert.deepStrictEqual({ thrown, pending: [...binder.pending] }, { thrown: refusalCase.status, pending: [] });
    verify(commands);
  });
}

for (const refusalCase of REFUSALS) {
  test(`arms one clearing push for ${refusalCase.cause} and leaves the characteristic readable`, async () => {
    // arrange
    const { deferrals, service } = await refuse(refusalCase, answeringCommands(refusalCase.outcome));

    // act
    const pushes = clearingPushesIn(deferrals);

    for (const push of pushes) {
      push.run();
    }

    // assert
    assert.deepStrictEqual(
      { delays: deferrals.map((deferral) => deferral.delayMs), statusCode: onCharacteristic(service).statusCode },
      { delays: refusalCase.delaysAfterRefusal, statusCode: SUCCESS },
    );
  });
}

for (const refusalCase of VENDOR_REFUSALS) {
  test(`attempts ${refusalCase.cause} exactly once and leaves pending [${refusalCase.pendingAfterRefusal.join(', ')}]`, async () => {
    // arrange
    const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
    when(() => commands.send(DEVICE_ID, 'self-test', true)).thenResolve(refusalCase.outcome());

    // act
    const { thrown, binder, deferrals, cancelled } = await refuse(refusalCase, commands);
    const pending = [...binder.pending];
    const delays = deferrals.map((deferral) => deferral.delayMs);
    const cancelledAtRefusal = [...cancelled];

    // Every deferral the refusal armed runs, so a send from any of them reaches the strict mock.
    for (const deferral of deferrals) {
      deferral.run();
    }

    // assert
    assert.deepStrictEqual(
      { thrown, pending, delays, cancelled: cancelledAtRefusal },
      {
        thrown: refusalCase.status,
        pending: refusalCase.pendingAfterRefusal,
        delays: refusalCase.delaysAfterRefusal,
        cancelled: refusalCase.cancelledAfterRefusal,
      },
    );
    verify(commands);
  });
}

for (const refusalCase of REFUSALS) {
  test(`logs the exact refusal for ${refusalCase.cause}`, async () => {
    // arrange
    const warnings: string[] = [];
    const commands = answeringCommands(refusalCase.outcome);
    const { service } = boundSwitch(
      {
        commands,
        log: warningLog(warnings),
        offlineConfirmed: () => refusalCase.offlineConfirmed,
        commandTransportReady: () => refusalCase.transportReady,
        liveConfirmationObservable: () => refusalCase.confirmationObservable,
      },
      () => refusalCase.reported,
    );

    // act
    const thrown = await writeRejection(service, refusalCase.value);

    // assert
    assert.deepStrictEqual({ thrown, warnings }, { thrown: refusalCase.status, warnings: [refusalCase.expectedWarning] });
  });
}

// HAP converts any error but a `HapStatusError` to a communication failure, and warns with its
// message. The stand-in converts the same way, so a case that writes through it reads the same
// status for a plain `Error` as for a vendor error. These cases call the registered handler
// directly and read the error it throws.
for (const refusalCase of REFUSALS) {
  test(`throws a HapStatusError with status ${String(refusalCase.status)} from the bound handler for ${refusalCase.cause}`, async (t) => {
    // arrange
    const binder = createControlBinder(
      binderOptions({
        commands: answeringCommands(refusalCase.outcome),
        offlineConfirmed: () => refusalCase.offlineConfirmed,
        commandTransportReady: () => refusalCase.transportReady,
        liveConfirmationObservable: () => refusalCase.confirmationObservable,
      }),
    );
    const service = switchService();
    const onSetSpy = t.mock.method(onCharacteristic(service), 'onSet');
    binder.bind(asService(service), 'self-test', () => refusalCase.reported);
    const handler = registeredHandler(onSetSpy.mock.calls);

    // act & assert
    await assert.rejects(
      async () => {
        await handler(refusalCase.value);
      },
      (error: unknown) => {
        assert.ok(error instanceof HAP.HapStatusError);
        assert.strictEqual(error.hapStatus, refusalCase.status);

        return true;
      },
    );
  });
}

// The exact cause text each half of the command gate writes. They are written out here rather than
// read off the module, so a reworded line fails at the assertion as well as behind it: the whole
// content of the two-predicate gate is that a user diagnosing a refused press learns which of the
// two blocked it (D-07, D-08).
const NO_FRESH_STATE_CAUSE = 'the plugin has no fresh state for it';
const NO_COMMAND_TRANSPORT_CAUSE = 'the plugin has no way to reach the vendor right now';
const QUIET_LIVE_CONNECTION_CAUSE = 'the live connection is quiet, so the plugin cannot see the device confirm the command';

test('names the missing state when the capability has not decoded and there is a way to send', async () => {
  // arrange
  const warnings: string[] = [];
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  const { service } = boundSwitch({ commands, log: warningLog(warnings), commandTransportReady: () => true }, () => undefined);

  // act
  const thrown = await writeRejection(service, true);

  // assert
  assert.deepStrictEqual(
    { thrown, warnings },
    { thrown: NOT_ALLOWED_IN_CURRENT_STATE, warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_FRESH_STATE_CAUSE}.`] },
  );
  verify(commands);
});

test('names the missing transport when the capability has decoded and there is no way to send', async () => {
  // arrange
  const warnings: string[] = [];
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  const { service } = boundSwitch({ commands, log: warningLog(warnings), commandTransportReady: () => false }, () => false);

  // act
  const thrown = await writeRejection(service, true);

  // assert
  assert.deepStrictEqual(
    { thrown, warnings },
    { thrown: NOT_ALLOWED_IN_CURRENT_STATE, warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_COMMAND_TRANSPORT_CAUSE}.`] },
  );
  verify(commands);
});

// Both conditions at once, which is the case the table's order decides. Naming the missing state to
// a user who has no way to send anything is the less actionable of the two truths, so the transport
// rule is evaluated first. This case pins that one pair; the precedence cases below pin the other
// pairs that can hold together (D-07).
test('names the missing transport alone when the plugin has neither fresh state nor a way to send', async () => {
  // arrange
  const warnings: string[] = [];
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  const { service } = boundSwitch({ commands, log: warningLog(warnings), commandTransportReady: () => false }, () => undefined);

  // act
  const thrown = await writeRejection(service, true);

  // assert
  assert.deepStrictEqual(
    { thrown, warnings },
    { thrown: NOT_ALLOWED_IN_CURRENT_STATE, warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_COMMAND_TRANSPORT_CAUSE}.`] },
  );
  verify(commands);
});

// The third fact of the gate, on its own. The route is proven and the capability's reported value is
// right there, so neither of the other two rules can be what refused this press: what the plugin
// lacks is the channel the device answers on (D-07, D-08, WR-02).
test('names the quiet live connection when the route and the reported value are both there', async () => {
  // arrange
  const warnings: string[] = [];
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  const { service } = boundSwitch({ commands, log: warningLog(warnings), liveConfirmationObservable: () => false }, () => false);

  // act
  const thrown = await writeRejection(service, true);

  // assert
  assert.deepStrictEqual(
    { thrown, warnings },
    { thrown: NOT_ALLOWED_IN_CURRENT_STATE, warnings: [`Refused self-test on ${DEVICE_ID}: ${QUIET_LIVE_CONNECTION_CAUSE}.`] },
  );
  verify(commands);
});

// The quiet live path and no route at all, which is the pair the placement of the quiet-live-path
// rule decides. A plugin with no route to send on cannot be helped by a channel to hear back on, so
// the more fundamental truth keeps its place at the top of the table. This case stops an edit that
// moves the quiet-live-path rule above the transport rule from changing the answer silently (D-07,
// D-08).
test('names the missing transport alone when the plugin has neither a route to send on nor a live path to hear back on', async () => {
  // arrange
  const warnings: string[] = [];
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  const { service } = boundSwitch(
    { commands, log: warningLog(warnings), commandTransportReady: () => false, liveConfirmationObservable: () => false },
    () => false,
  );

  // act
  const thrown = await writeRejection(service, true);

  // assert
  assert.deepStrictEqual(
    { thrown, warnings },
    { thrown: NOT_ALLOWED_IN_CURRENT_STATE, warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_COMMAND_TRANSPORT_CAUSE}.`] },
  );
  verify(commands);
});

// The other side of the placement. Here the state genuinely has not decoded and the live path is
// also quiet, and the quiet path is named because it is the condition an owner can act on: a
// reported field that never decoded is a symptom of the same silence more often than a fault of its
// own. This case stops an edit that moves the quiet-live-path rule below the state rule (D-07, D-08,
// WR-02).
test('names the quiet live connection alone when the reported field has also not decoded', async () => {
  // arrange
  const warnings: string[] = [];
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  const { service } = boundSwitch({ commands, log: warningLog(warnings), liveConfirmationObservable: () => false }, () => undefined);

  // act
  const thrown = await writeRejection(service, true);

  // assert
  assert.deepStrictEqual(
    { thrown, warnings },
    { thrown: NOT_ALLOWED_IN_CURRENT_STATE, warnings: [`Refused self-test on ${DEVICE_ID}: ${QUIET_LIVE_CONNECTION_CAUSE}.`] },
  );
  verify(commands);
});

// The facts the gate reads for one write. A clear gate sets no refusal condition: an on request, a
// decoded reported value of off, a device not confirmed offline, a route to the vendor and a live
// path to hear back on.
interface GateConditions {
  readonly value: boolean;
  readonly reported: boolean | undefined;
  readonly offlineConfirmed: boolean;
  readonly transportReady: boolean;
  readonly confirmationObservable: boolean;
}

function clearGate(): GateConditions {
  return { value: true, reported: false, offlineConfirmed: false, transportReady: true, confirmationObservable: true };
}

// A bound Switch whose gate reads every fact from `gate` at each write, so a case can change a
// condition between two writes.
function gatedSwitch(gate: () => GateConditions, overrides: BinderOverrides): { binder: ControlBinder; service: FakeHapService } {
  return boundSwitch(
    {
      ...overrides,
      offlineConfirmed: () => gate().offlineConfirmed,
      commandTransportReady: () => gate().transportReady,
      liveConfirmationObservable: () => gate().confirmationObservable,
    },
    () => gate().reported,
  );
}

// Two refusal conditions that hold at once, and the rule that must answer. The binder evaluates its
// rules in a fixed order and the first that applies answers the write, so each row pins the order of
// one pair. A missing fresh state and an active reading cannot hold together: one is an undefined
// reported value and the other is a reported `true`.
interface PrecedenceCase {
  readonly winner: string;
  readonly loser: string;
  /** The conditions the row sets on a clear gate. */
  readonly set: Partial<GateConditions>;
  readonly status: number;
  readonly expectedWarning: string;
}

// The pairs one write can carry. Three other pairs have their own cases above: transport over fresh
// state, transport over the quiet path, and the quiet path over fresh state.
const PRECEDENCE: readonly PrecedenceCase[] = [
  {
    winner: 'a write of anything but on',
    loser: 'a capability that already reads active',
    set: { value: false, reported: true },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: only an on request is supported, and the device reports when the condition ends.',
  },
  {
    winner: 'a write of anything but on',
    loser: 'a missing route to the vendor',
    set: { value: false, transportReady: false },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: only an on request is supported, and the device reports when the condition ends.',
  },
  {
    winner: 'a write of anything but on',
    loser: 'a quiet live connection',
    set: { value: false, confirmationObservable: false },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: only an on request is supported, and the device reports when the condition ends.',
  },
  {
    winner: 'a write of anything but on',
    loser: 'a missing fresh state',
    set: { value: false, reported: undefined },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: only an on request is supported, and the device reports when the condition ends.',
  },
  {
    winner: 'a write of anything but on',
    loser: 'a device confirmed offline',
    set: { value: false, offlineConfirmed: true },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: only an on request is supported, and the device reports when the condition ends.',
  },
  {
    winner: 'a missing route to the vendor',
    loser: 'a device confirmed offline',
    set: { transportReady: false, offlineConfirmed: true },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the plugin has no way to reach the vendor right now.',
  },
  {
    winner: 'a missing route to the vendor',
    loser: 'a capability that already reads active',
    set: { transportReady: false, reported: true },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the plugin has no way to reach the vendor right now.',
  },
  {
    winner: 'a quiet live connection',
    loser: 'a device confirmed offline',
    set: { confirmationObservable: false, offlineConfirmed: true },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the live connection is quiet, so the plugin cannot see the device confirm the command.',
  },
  {
    winner: 'a quiet live connection',
    loser: 'a capability that already reads active',
    set: { confirmationObservable: false, reported: true },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the live connection is quiet, so the plugin cannot see the device confirm the command.',
  },
  {
    winner: 'a missing fresh state',
    loser: 'a device confirmed offline',
    set: { reported: undefined, offlineConfirmed: true },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the plugin has no fresh state for it.',
  },
  {
    winner: 'a device confirmed offline',
    loser: 'a capability that already reads active',
    set: { offlineConfirmed: true, reported: true },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the device is confirmed offline.',
  },
];

for (const precedenceCase of PRECEDENCE) {
  test(`answers ${String(precedenceCase.status)} and names ${precedenceCase.winner} over ${precedenceCase.loser}`, async () => {
    // arrange
    const warnings: string[] = [];
    const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
    const conditions: GateConditions = { ...clearGate(), ...precedenceCase.set };
    const { binder, service } = gatedSwitch(() => conditions, { commands, log: warningLog(warnings) });

    // act
    const thrown = await writeRejection(service, conditions.value);

    // assert
    assert.deepStrictEqual(
      { thrown, pending: [...binder.pending], warnings },
      { thrown: precedenceCase.status, pending: [], warnings: [precedenceCase.expectedWarning] },
    );
    verify(commands);
  });
}

// The pending rule against each rule that can hold with it. The first press is accepted with a
// clear gate, so the capability is pending; each row then sets one more condition for the second
// press, and that condition's own rule must answer it.
const PENDING_PRECEDENCE: readonly PrecedenceCase[] = [
  {
    winner: 'a write of anything but on',
    loser: 'an earlier request that still waits',
    set: { value: false },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: only an on request is supported, and the device reports when the condition ends.',
  },
  {
    winner: 'a missing route to the vendor',
    loser: 'an earlier request that still waits',
    set: { transportReady: false },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the plugin has no way to reach the vendor right now.',
  },
  {
    winner: 'a quiet live connection',
    loser: 'an earlier request that still waits',
    set: { confirmationObservable: false },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the live connection is quiet, so the plugin cannot see the device confirm the command.',
  },
  {
    winner: 'a missing fresh state',
    loser: 'an earlier request that still waits',
    set: { reported: undefined },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the plugin has no fresh state for it.',
  },
  {
    winner: 'a device confirmed offline',
    loser: 'an earlier request that still waits',
    set: { offlineConfirmed: true },
    status: NOT_ALLOWED_IN_CURRENT_STATE,
    expectedWarning: 'Refused self-test on account-1_serial-1: the device is confirmed offline.',
  },
  {
    winner: 'a capability that already reads active',
    loser: 'an earlier request that still waits',
    set: { reported: true },
    status: RESOURCE_BUSY,
    expectedWarning: 'Refused self-test on account-1_serial-1: it already reads active.',
  },
];

for (const precedenceCase of PENDING_PRECEDENCE) {
  test(`refuses a second press with ${String(precedenceCase.status)} and names ${precedenceCase.winner} over ${precedenceCase.loser}`, async () => {
    // arrange
    const warnings: string[] = [];
    const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
    when(() => commands.send(DEVICE_ID, 'self-test', true)).thenResolve(acceptedOutcome());
    let conditions = clearGate();
    const { binder, service } = gatedSwitch(() => conditions, { commands, log: warningLog(warnings) });
    await onCharacteristic(service).handleSetRequest(conditions.value);
    conditions = { ...clearGate(), ...precedenceCase.set };

    // act
    const thrown = await writeRejection(service, conditions.value);

    // assert
    assert.deepStrictEqual(
      { thrown, pending: [...binder.pending], warnings },
      { thrown: precedenceCase.status, pending: ['self-test'], warnings: [precedenceCase.expectedWarning] },
    );
    verify(commands);
  });
}

test('answers the transport refusal status to every read until the clearing push lands', async () => {
  // arrange
  const { timers, deferrals } = recordingTimers();
  const republished: string[] = [];
  const { service } = boundSwitch({
    timers,
    commandTransportReady: () => false,
    republish: () => {
      republished.push('republish');
    },
  });

  // act
  const thrown = await writeRejection(service, true);
  const afterTheRefusal = { statusCode: onCharacteristic(service).statusCode, republished: [...republished] };
  clearingPushesIn(deferrals)[0]?.run();

  // assert
  assert.deepStrictEqual(
    { thrown, afterTheRefusal, afterTheClearingPush: { statusCode: onCharacteristic(service).statusCode, republished } },
    {
      thrown: NOT_ALLOWED_IN_CURRENT_STATE,
      afterTheRefusal: { statusCode: NOT_ALLOWED_IN_CURRENT_STATE, republished: [] },
      afterTheClearingPush: { statusCode: SUCCESS, republished: ['republish'] },
    },
  );
});

// The window a request waits in for the device's own confirming report. Thirty seconds against an
// observed test duration of about sixteen: long enough for the device to answer, short enough that
// a Switch never stops following reported state for long (D-037, D-06).
const PENDING_WINDOW_MS = 30_000;

// The deferral the pending window is armed with, told apart from the clearing push by its delay.
function windowsIn(deferrals: readonly Deferral[]): readonly Deferral[] {
  return deferrals.filter((deferral) => deferral.delayMs === PENDING_WINDOW_MS);
}

test('arms one 30000 millisecond window when a command is sent', async () => {
  // arrange
  const { timers, deferrals } = recordingTimers();
  const { service } = boundSwitch({ timers });

  // act
  await onCharacteristic(service).handleSetRequest(true);

  // assert
  assert.deepStrictEqual(
    deferrals.map((deferral) => deferral.delayMs),
    [PENDING_WINDOW_MS],
  );
});

test('cancels the window and clears the entry when the device confirms the request', async () => {
  // arrange
  const { timers, deferrals, cancelled } = recordingTimers();
  const { binder, service } = boundSwitch({ timers });
  await onCharacteristic(service).handleSetRequest(true);

  // act
  binder.reconcile('self-test', true);

  // assert
  assert.deepStrictEqual({ cancelled, pending: [...binder.pending] }, { cancelled: [windowsIn(deferrals)[0]?.handle], pending: [] });
});

// Nothing is retried when the window closes: a command that outlived its deadline may already have
// reached the device, and a second attempt would operate a real sump pump twice (D-038).
test('resumes reported state with one warning and no second request when the window closes', async () => {
  // arrange
  const warnings: string[] = [];
  const republished: string[] = [];
  const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
  when(() => commands.send(DEVICE_ID, 'self-test', true)).thenResolve(acceptedOutcome());
  const { timers, deferrals } = recordingTimers();
  const { binder, service } = boundSwitch({
    commands,
    timers,
    log: warningLog(warnings),
    republish: () => {
      republished.push('republish');
    },
  });
  await onCharacteristic(service).handleSetRequest(true);

  // act
  windowsIn(deferrals)[0]?.run();

  // assert
  assert.deepStrictEqual(
    { pending: [...binder.pending], republished, warnings },
    {
      pending: [],
      republished: ['republish'],
      warnings: [`The self-test request on ${DEVICE_ID} was never confirmed by the device. It is not retried.`],
    },
  );
  verify(commands);
});

// Whichever of the two runs first wins and the second is a no-op, so a confirming report landing at
// the instant the window closes needs no ordering rule beyond that (D-06).
test('ignores a confirming report that lands after the window already closed', async () => {
  // arrange
  const warnings: string[] = [];
  const { timers, deferrals } = recordingTimers();
  const { binder, service } = boundSwitch({ timers, log: warningLog(warnings) });
  await onCharacteristic(service).handleSetRequest(true);
  windowsIn(deferrals)[0]?.run();

  // act
  binder.reconcile('self-test', true);

  // assert
  assert.deepStrictEqual(
    { warnings, pending: [...binder.pending] },
    { warnings: [`The self-test request on ${DEVICE_ID} was never confirmed by the device. It is not retried.`], pending: [] },
  );
});

test('ignores a window that closes after the device already confirmed the request', async () => {
  // arrange
  const warnings: string[] = [];
  const { timers, deferrals } = recordingTimers();
  const { binder, service } = boundSwitch({ timers, log: warningLog(warnings) });
  await onCharacteristic(service).handleSetRequest(true);
  binder.reconcile('self-test', true);

  // act
  windowsIn(deferrals)[0]?.run();

  // assert
  assert.deepStrictEqual({ warnings, pending: [...binder.pending] }, { warnings: [], pending: [] });
});

test('holds one independent entry per capability, so clearing one leaves the other pending', async () => {
  // arrange
  const { binder, service } = boundSwitch();
  const muteService = new HAP.Service.Switch('Alarm Mute', ALARM_MUTE);
  binder.bind(asService(muteService), 'alarm-mute', () => false);
  await onCharacteristic(service).handleSetRequest(true);
  await onCharacteristic(muteService).handleSetRequest(true);

  // act
  binder.reconcile('self-test', true);

  // assert
  assert.deepStrictEqual([...binder.pending], ['alarm-mute']);
});

// One binder exists per accessory, so this is the whole of the per-accessory claim: no state outside
// a binder's own closure records that anything is pending (D-05, D-06).
for (const capability of ['self-test', 'alarm-mute'] as const) {
  test(`sends ${capability} on a second accessory while the first carries a pending request`, async () => {
    // arrange
    const { service } = boundSwitch();
    await onCharacteristic(service).handleSetRequest(true);
    const commands = mock<CommandPort>({ exactParams: true, name: 'commands' });
    when(() => commands.send(DEVICE_ID, capability, true)).thenResolve(acceptedOutcome());
    const other = createControlBinder(binderOptions({ commands }));
    const otherService = new HAP.Service.Switch('Control', capability);
    other.bind(asService(otherService), capability, () => false);
    const beforeTheWrite = [...other.pending];

    // act
    await onCharacteristic(otherService).handleSetRequest(true);

    // assert
    assert.deepStrictEqual(beforeTheWrite, []);
    verify(commands);
  });
}

// The accessory a restored control came back on, which is all the identity the refusal has to work
// with: the restart passes read nothing from the accessory context, and a cache an older release
// wrote names no device in it at all.
const RESTORED_ACCESSORY_NAME = 'Sump Guardian';

interface RestoredOverrides {
  log?: Logging;
  timers?: Timers;
}

// A restored control carrying the refusal, which is the shape every case below starts from. No
// command port reaches it, and that is deliberate: the refusal takes none, so a press cannot reach
// the vendor by any route rather than by a rule that has to hold.
function refusingRestoredSwitch(overrides: RestoredOverrides = {}): FakeHapService {
  const service = switchService();

  bindRestoredControlRefusal({
    hap: HAP_NAMESPACE,
    log: overrides.log ?? silentLog(),
    timers: overrides.timers ?? recordingTimers().timers,
    service: asService(service),
    accessoryName: RESTORED_ACCESSORY_NAME,
  });

  return service;
}

// What a controller read of the control answers: the value, or the status a refusal left standing.
// The read is the whole difference between a tile that is merely marked and one Apple Home greys
// out, so it is driven rather than inferred from the stored status. HAP's read is asynchronous and
// rejects with the status, so the read is awaited inside the `try`; that also catches a read that
// throws at once.
async function readOfSwitch(service: FakeHapService): Promise<{ value: unknown; threw: unknown }> {
  try {
    return { value: await onCharacteristic(service).handleGetRequest(), threw: undefined };
  } catch (error: unknown) {
    return { value: undefined, threw: error };
  }
}

// A press of either value on a restored control, and the value the cache holds before it. The held
// value is always the other one, so a press that went through would show in the stored value. A
// press of false is what Apple Home writes to switch off a toggle the cache restored as on.
interface RestoredPressCase {
  readonly pressed: boolean;
  readonly held: boolean;
}

const RESTORED_PRESSES: readonly RestoredPressCase[] = [
  { pressed: true, held: false },
  { pressed: false, held: true },
];

for (const { pressed, held } of RESTORED_PRESSES) {
  test(`refuses a press on a restored control and leaves the toggle where the cache left it, for a press of ${String(pressed)}`, async () => {
    // arrange
    const service = refusingRestoredSwitch();
    service.updateCharacteristic(HAP.Characteristic.On, held);

    // act
    const thrown = await writeRejection(service, pressed);

    // assert
    assert.deepStrictEqual(
      { thrown, value: onCharacteristic(service).value, statusCode: onCharacteristic(service).statusCode },
      { thrown: NOT_ALLOWED_IN_CURRENT_STATE, value: held, statusCode: NOT_ALLOWED_IN_CURRENT_STATE },
    );
  });
}

// The same cause the transport rule gives a live accessory, because it is the same condition: after
// a restart the cloud has not answered, so the plugin has no route to send on. One condition with
// two wordings is what the per-cause table exists to prevent (D-07, D-08).
for (const { pressed, held } of RESTORED_PRESSES) {
  test(`names the service, the accessory and the cause in the one line a restored refusal logs, for a press of ${String(pressed)}`, async () => {
    // arrange
    const warnings: string[] = [];
    const service = refusingRestoredSwitch({ log: warningLog(warnings) });
    service.updateCharacteristic(HAP.Characteristic.On, held);

    // act
    const thrown = await writeRejection(service, pressed);

    // assert
    assert.deepStrictEqual(
      { thrown, value: onCharacteristic(service).value, warnings },
      {
        thrown: NOT_ALLOWED_IN_CURRENT_STATE,
        value: held,
        warnings: [`Refused System Self-Test on ${RESTORED_ACCESSORY_NAME}: ${NO_COMMAND_TRANSPORT_CAUSE}.`],
      },
    );
  });
}

// Without the clearing push the refused characteristic answers its status to every later read, which
// Apple Home draws as "No Response" for the whole accessory -- the presentation this project
// reserves for a refused credential, which never clears itself. A restart with the cloud down clears
// itself the moment a poll succeeds (D-04, D-10).
for (const { pressed, held } of RESTORED_PRESSES) {
  test(`returns the refused control to a readable state once the clearing push has run, for a press of ${String(pressed)}`, async () => {
    // arrange
    const { timers, deferrals } = recordingTimers();
    const service = refusingRestoredSwitch({ timers });
    service.updateCharacteristic(HAP.Characteristic.On, held);

    // act
    const thrown = await writeRejection(service, pressed);
    const afterTheRefusal = await readOfSwitch(service);
    clearingPushesIn(deferrals)[0]?.run();

    // assert
    assert.deepStrictEqual(
      { thrown, delays: deferrals.map((deferral) => deferral.delayMs), afterTheRefusal, afterTheClearingPush: await readOfSwitch(service) },
      {
        thrown: NOT_ALLOWED_IN_CURRENT_STATE,
        delays: [0],
        afterTheRefusal: { value: undefined, threw: NOT_ALLOWED_IN_CURRENT_STATE },
        afterTheClearingPush: { value: held, threw: undefined },
      },
    );
  });
}

// The restored refusal's own handler, called directly, for the same reason as the bound handler's
// cases: a write through the stand-in reads a plain `Error` as a status too.
test('throws a HapStatusError with status -70412 from the handler a restored control carries', async (t) => {
  // arrange
  const service = switchService();
  const onSetSpy = t.mock.method(onCharacteristic(service), 'onSet');
  bindRestoredControlRefusal({
    hap: HAP_NAMESPACE,
    log: silentLog(),
    timers: recordingTimers().timers,
    service: asService(service),
    accessoryName: RESTORED_ACCESSORY_NAME,
  });
  const handler = registeredHandler(onSetSpy.mock.calls);

  // act & assert
  await assert.rejects(
    async () => {
      await handler(true);
    },
    (error: unknown) => {
      assert.ok(error instanceof HAP.HapStatusError);
      assert.strictEqual(error.hapStatus, NOT_ALLOWED_IN_CURRENT_STATE);

      return true;
    },
  );
});

test('leaves a restored control answering a read before any press reaches it', async () => {
  // arrange
  const service = refusingRestoredSwitch();
  service.updateCharacteristic(HAP.Characteristic.On, true);

  // act
  const read = await readOfSwitch(service);

  // assert
  assert.deepStrictEqual(read, { value: true, threw: undefined });
});

// The push carries the value the characteristic is already serving, because a restored control has
// no reported value behind it to restore. Both held values are driven, so a push that hard-coded
// either one fails here.
for (const held of [true, false]) {
  test(`returns a restored control holding ${String(held)} to that same value when the clearing push runs`, async () => {
    // arrange
    const { timers, deferrals } = recordingTimers();
    const service = refusingRestoredSwitch({ timers });
    service.updateCharacteristic(HAP.Characteristic.On, held);

    // act
    const thrown = await writeRejection(service, true);
    clearingPushesIn(deferrals)[0]?.run();

    // assert
    assert.deepStrictEqual({ thrown, read: await readOfSwitch(service) }, { thrown: NOT_ALLOWED_IN_CURRENT_STATE, read: { value: held, threw: undefined } });
  });
}

// The held value changes between the refusal and the push, so a push of the value read at the
// refusal fails here. The value is set on the characteristic directly, because a publish would
// also clear the refusal status that the push exists to clear.
for (const { heldAtRefusal, heldAtPush } of [
  { heldAtRefusal: false, heldAtPush: true },
  { heldAtRefusal: true, heldAtPush: false },
]) {
  test(`pushes ${String(heldAtPush)}, the value a restored control holds when the push runs, not ${String(heldAtRefusal)} from the refusal`, async () => {
    // arrange
    const { timers, deferrals } = recordingTimers();
    const service = refusingRestoredSwitch({ timers });
    service.updateCharacteristic(HAP.Characteristic.On, heldAtRefusal);

    // act
    const thrown = await writeRejection(service, true);
    onCharacteristic(service).value = heldAtPush;
    clearingPushesIn(deferrals)[0]?.run();

    // assert
    assert.deepStrictEqual(
      { thrown, read: await readOfSwitch(service) },
      { thrown: NOT_ALLOWED_IN_CURRENT_STATE, read: { value: heldAtPush, threw: undefined } },
    );
  });
}
