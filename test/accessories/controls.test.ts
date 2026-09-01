import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createControlBinder } from '../../src/accessories/controls.js';

import type { FakeHapCharacteristic, FakeHapService } from '../../features/support/fakeHap.js';
import type { ControlBinder, ControlBinderOptions } from '../../src/accessories/controls.js';
import type { DeviceCapability } from '../../src/device/family.js';
import type { CommandOutcome, CommandPort } from '../../src/runtime/commandPort.js';
import type { Timers } from '../../src/runtime/timers.js';
import type { API, Logging, Service } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const SELF_TEST = 'system-self-test';

// The statuses this binder answers, written out here rather than read off the namespace, so a
// drifted mapping fails at the assertion as well as behind it (D-04).
const NOT_ALLOWED_IN_CURRENT_STATE = -70412;
const SERVICE_COMMUNICATION_FAILURE = -70402;
const OPERATION_TIMED_OUT = -70408;
const SUCCESS = 0;

// The namespace holds no per-case state: a service and its characteristics live on the service that
// added them, so one stand-in serves every case.
const HAP = createFakeHap();

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];

/** One deferral the binder asked the injected port for. */
interface Deferral {
  delayMs: number;
  run: () => void;
}

function silentLog(): Logging {
  const noop = (): void => {
    // logging is not this module's job; the stub discards every call
  };

  return Object.assign(noop, { prefix: 'basement guardian', debug: noop, error: noop, info: noop, log: noop, success: noop, warn: noop });
}

// A `Timers` stand-in that records the deferral rather than arming one, so a case reads back the
// delay the binder asked for and runs the handler itself.
function recordingTimers(): { timers: Timers; deferrals: Deferral[] } {
  const deferrals: Deferral[] = [];
  const timers: Timers = {
    setTimeout: (run: () => void, delayMs: number) => {
      deferrals.push({ delayMs, run });

      return undefined;
    },
    setInterval: () => undefined,
    clearTimeout: () => undefined,
    clearInterval: () => undefined,
  };

  return { timers, deferrals };
}

// A `CommandPort` stand-in that records every send and answers a scripted outcome. A refusal that
// sent nothing and one that sent a request and discarded the answer look identical from HomeKit,
// so the recorder is what tells them apart.
function recordingCommands(outcome: CommandOutcome = { accepted: true }): { commands: CommandPort; sends: string[] } {
  const sends: string[] = [];
  const commands: CommandPort = {
    send: (deviceId: string, capability: DeviceCapability, requested: boolean) => {
      sends.push(`${deviceId} ${capability} ${String(requested)}`);

      return Promise.resolve(outcome);
    },
  };

  return { commands, sends };
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
}

function binderOptions(overrides: BinderOverrides = {}): ControlBinderOptions {
  return {
    hap: HAP_NAMESPACE,
    log: overrides.log ?? silentLog(),
    timers: overrides.timers ?? recordingTimers().timers,
    commands: overrides.commands ?? recordingCommands().commands,
    deviceId: DEVICE_ID,
    republish: overrides.republish ?? ((): void => undefined),
  };
}

// A bound Switch, with the binder that owns it, which is the shape every case starts from.
function boundSwitch(overrides: BinderOverrides = {}, reported: () => boolean | undefined = () => false): { binder: ControlBinder; service: FakeHapService } {
  const binder = createControlBinder(binderOptions(overrides));
  const service = switchService();

  binder.bind(service as unknown as Service, 'self-test', reported);

  return { binder, service };
}

async function assertRefused(service: FakeHapService, value: unknown, status: number): Promise<void> {
  await assert.rejects(
    () => onCharacteristic(service).handleSetRequest(value),
    (thrown: unknown) => {
      assert.strictEqual(thrown, status);

      return true;
    },
  );
}

test('refuses a write of false, sends nothing, and leaves the stored value where HAP had it', async () => {
  // arrange
  const { commands, sends } = recordingCommands();
  const { timers, deferrals } = recordingTimers();
  const { service } = boundSwitch({ commands, timers });
  onCharacteristic(service).value = true;

  // act
  await assertRefused(service, false, NOT_ALLOWED_IN_CURRENT_STATE);
  const afterRefusal = { value: onCharacteristic(service).value, statusCode: onCharacteristic(service).statusCode, sends: [...sends] };
  deferrals[0]?.run();

  // assert
  assert.deepStrictEqual(afterRefusal, { value: true, statusCode: NOT_ALLOWED_IN_CURRENT_STATE, sends: [] });
  assert.strictEqual(onCharacteristic(service).statusCode, SUCCESS);
});

test('arms the clearing push as a macrotask at delay 0 rather than running it inline', async () => {
  // arrange
  const { timers, deferrals } = recordingTimers();
  const { service } = boundSwitch({ timers });

  // act
  await assertRefused(service, false, NOT_ALLOWED_IN_CURRENT_STATE);

  // assert
  assert.deepStrictEqual(
    deferrals.map((deferral) => deferral.delayMs),
    [0],
  );
});

// The companion to the case above, and the reason the push is a macrotask. The binder's handler is
// asynchronous, so HAP's own catch resumes as a microtask of its own: a push queued as a microtask
// before the throw is queued first, runs first, and clears a status that has not been set yet. The
// refusal then outlives it and every later read answers the error. This drives that ordering
// directly rather than asserting it about the binder, so the claim rests on observed behaviour and
// the case fails if the ordering is ever the other way round (D-04).
test('leaves a sticky status when the clearing push is queued as a microtask instead', async () => {
  // arrange
  const service = switchService();
  const characteristic = onCharacteristic(service);
  characteristic.onSet(() => {
    queueMicrotask(() => {
      service.updateCharacteristic(HAP.Characteristic.On, false);
    });

    // The binder's handler is asynchronous, so its refusal reaches HAP as a rejected promise and
    // HAP's own catch resumes a microtask later than this push. Writing the rejection out rather
    // than throwing keeps that ordering exactly as the binder produces it.
    return Promise.reject(new HAP.HapStatusError(NOT_ALLOWED_IN_CURRENT_STATE));
  });

  // act
  await assertRefused(service, false, NOT_ALLOWED_IN_CURRENT_STATE);
  await Promise.resolve();

  // assert
  assert.strictEqual(characteristic.statusCode, NOT_ALLOWED_IN_CURRENT_STATE);
});

test('sends one on request, holds the capability pending, and pushes nothing back', async () => {
  // arrange
  const { commands, sends } = recordingCommands({ accepted: true });
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
  assert.deepStrictEqual(sends, [`${DEVICE_ID} self-test true`]);
  assert.deepStrictEqual([...binder.pending], ['self-test']);
  assert.deepStrictEqual(
    { value: onCharacteristic(service).value, pushed: onCharacteristic(service).pushed, deferrals: deferrals.length, republished },
    { value: true, pushed: false, deferrals: 0, republished: [] },
  );
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
  const { binder, service } = boundSwitch();
  await onCharacteristic(service).handleSetRequest(true);

  // act
  binder.reconcile('self-test', false);

  // assert
  assert.deepStrictEqual([...binder.pending], ['self-test']);
});

test('keeps the capability pending while the scope carrying its reported value has not decoded', async () => {
  // arrange
  const { binder, service } = boundSwitch();
  await onCharacteristic(service).handleSetRequest(true);

  // act
  binder.reconcile('self-test', undefined);

  // assert
  assert.deepStrictEqual([...binder.pending], ['self-test']);
});

test('reconciles a capability that was never pending without raising and without creating one', () => {
  // arrange
  const { binder } = boundSwitch();

  // act
  binder.reconcile('self-test', true);
  binder.reconcile('self-test', true);

  // assert
  assert.deepStrictEqual([...binder.pending], []);
});

test('registers one handler however many times a service is bound', () => {
  // arrange
  const binder = createControlBinder(binderOptions());
  const service = switchService();
  const characteristic = onCharacteristic(service);
  let registrations = 0;
  const declared = characteristic.onSet.bind(characteristic);
  characteristic.onSet = (handler) => {
    registrations += 1;

    return declared(handler);
  };

  // act
  binder.bind(service as unknown as Service, 'self-test', () => false);
  binder.bind(service as unknown as Service, 'self-test', () => false);

  // assert
  assert.strictEqual(registrations, 1);
});

for (const { failure, status } of [
  { failure: 'vendor-error', status: SERVICE_COMMUNICATION_FAILURE },
  { failure: 'timed-out', status: OPERATION_TIMED_OUT },
] as const) {
  test(`answers ${String(status)} for a ${failure} outcome, drops the pending entry, and sends nothing further`, async () => {
    // arrange
    const { commands, sends } = recordingCommands({ accepted: false, failure });
    const { timers, deferrals } = recordingTimers();
    const { binder, service } = boundSwitch({ commands, timers });

    // act
    await assertRefused(service, true, status);
    deferrals[0]?.run();

    // assert
    assert.deepStrictEqual(sends, [`${DEVICE_ID} self-test true`]);
    assert.deepStrictEqual([...binder.pending], []);
    assert.strictEqual(onCharacteristic(service).statusCode, SUCCESS);
  });
}

test('pushes the reported value the accessory answers when the clearing push runs', async () => {
  // arrange
  const { timers, deferrals } = recordingTimers();
  const { service } = boundSwitch({ timers }, () => true);

  // act
  await assertRefused(service, false, NOT_ALLOWED_IN_CURRENT_STATE);
  deferrals[0]?.run();

  // assert
  assert.deepStrictEqual({ value: onCharacteristic(service).value, statusCode: onCharacteristic(service).statusCode }, { value: true, statusCode: SUCCESS });
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
    await assertRefused(service, false, NOT_ALLOWED_IN_CURRENT_STATE);
    deferrals[0]?.run();

    // assert
    assert.deepStrictEqual({ value: onCharacteristic(service).value, statusCode: onCharacteristic(service).statusCode }, { value: held, statusCode: SUCCESS });
  });
}

test('names the capability and the cause in the one line a refusal logs, and quotes nothing else', async () => {
  // arrange
  const warnings: string[] = [];
  const log = Object.assign(() => undefined, {
    prefix: 'basement guardian',
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
    log: () => undefined,
    success: () => undefined,
    warn: (message: string) => {
      warnings.push(message);
    },
  });
  const { commands } = recordingCommands({ accepted: false, failure: 'timed-out' });
  const { service } = boundSwitch({ commands, log });

  // act
  await assertRefused(service, true, OPERATION_TIMED_OUT);

  // assert
  assert.deepStrictEqual(warnings, [`The self-test request on ${DEVICE_ID} did not take effect: timed-out. It is not retried.`]);
});
