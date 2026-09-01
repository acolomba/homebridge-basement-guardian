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

// Fixture secrets a log line must never quote. Neither reaches this module, which is the point: the
// assertion states what may not appear rather than trusting that nothing passes it in.
const BEARER_TOKEN = 'id-token-1';
const BASE_URL = 'https://api.example.test';

// The outcome the command port answers for a write no local rule refuses. A local refusal never
// reaches it, so the value it carries is irrelevant to those rows.
const ACCEPTED: CommandOutcome = { accepted: true };

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
  offlineConfirmed?: () => boolean;
}

function binderOptions(overrides: BinderOverrides = {}): ControlBinderOptions {
  return {
    hap: HAP_NAMESPACE,
    log: overrides.log ?? silentLog(),
    timers: overrides.timers ?? recordingTimers().timers,
    commands: overrides.commands ?? recordingCommands().commands,
    deviceId: DEVICE_ID,
    offlineConfirmed: overrides.offlineConfirmed ?? ((): boolean => false),
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
  assert.deepStrictEqual(warnings, ['The self-test request did not take effect: timed-out. It is not retried.']);
});

// The six ways one write can end, in the order the binder evaluates them: four the plugin answers
// by itself and two the vendor answers. Every case below is read off this one table, so a cause
// that stops being refused, or that starts answering a different status, fails by name.
interface RefusalCase {
  cause: string;
  value: unknown;
  reported: boolean | undefined;
  offlineConfirmed: boolean;
  outcome: CommandOutcome;
  status: number;
}

const LOCAL_REFUSALS: readonly RefusalCase[] = [
  { cause: 'a write of anything but on', value: false, reported: false, offlineConfirmed: false, outcome: ACCEPTED, status: NOT_ALLOWED_IN_CURRENT_STATE },
  {
    cause: 'a capability whose reported field has not decoded',
    value: true,
    reported: undefined,
    offlineConfirmed: false,
    outcome: ACCEPTED,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
  },
  { cause: 'a device confirmed offline', value: true, reported: false, offlineConfirmed: true, outcome: ACCEPTED, status: NOT_ALLOWED_IN_CURRENT_STATE },
  {
    cause: 'a duplicate request while the capability already reads active',
    value: true,
    reported: true,
    offlineConfirmed: false,
    outcome: ACCEPTED,
    status: RESOURCE_BUSY,
  },
];

const VENDOR_REFUSALS: readonly RefusalCase[] = [
  {
    cause: 'a vendor error',
    value: true,
    reported: false,
    offlineConfirmed: false,
    outcome: { accepted: false, failure: 'vendor-error' },
    status: SERVICE_COMMUNICATION_FAILURE,
  },
  {
    cause: 'an exceeded deadline',
    value: true,
    reported: false,
    offlineConfirmed: false,
    outcome: { accepted: false, failure: 'timed-out' },
    status: OPERATION_TIMED_OUT,
  },
];

const REFUSALS: readonly RefusalCase[] = [...LOCAL_REFUSALS, ...VENDOR_REFUSALS];

// The refusal's clearing push, told apart from any other deferral by the delay it was armed at.
function clearingPushesIn(deferrals: readonly Deferral[]): readonly Deferral[] {
  return deferrals.filter((deferral) => deferral.delayMs === 0);
}

// One write against one row of the table, with everything the assertions read back.
async function refuse(
  refusalCase: RefusalCase,
): Promise<{ thrown: unknown; sends: string[]; deferrals: Deferral[]; binder: ControlBinder; service: FakeHapService }> {
  const { commands, sends } = recordingCommands(refusalCase.outcome);
  const { timers, deferrals } = recordingTimers();
  const { binder, service } = boundSwitch({ commands, timers, offlineConfirmed: () => refusalCase.offlineConfirmed }, () => refusalCase.reported);
  let thrown: unknown = undefined;

  try {
    await onCharacteristic(service).handleSetRequest(refusalCase.value);
  } catch (error: unknown) {
    thrown = error;
  }

  return { thrown, sends, deferrals, binder, service };
}

test('answers each of the six refusal causes with the status that describes it', async () => {
  // act
  const answered = [];

  for (const refusalCase of REFUSALS) {
    answered.push((await refuse(refusalCase)).thrown);
  }

  // assert
  assert.deepStrictEqual(answered, [-70412, -70412, -70412, -70403, -70402, -70408]);
});

for (const refusalCase of LOCAL_REFUSALS) {
  test(`sends nothing at all for ${refusalCase.cause}`, async () => {
    // act
    const { thrown, sends, binder } = await refuse(refusalCase);

    // assert
    assert.deepStrictEqual({ thrown, sends, pending: [...binder.pending] }, { thrown: refusalCase.status, sends: [], pending: [] });
  });
}

for (const refusalCase of REFUSALS) {
  test(`arms one clearing push for ${refusalCase.cause} and leaves the characteristic readable`, async () => {
    // arrange
    const { deferrals, service } = await refuse(refusalCase);

    // act
    const pushes = clearingPushesIn(deferrals);

    for (const push of pushes) {
      push.run();
    }

    // assert
    assert.deepStrictEqual({ pushes: pushes.length, statusCode: onCharacteristic(service).statusCode }, { pushes: 1, statusCode: SUCCESS });
  });
}

for (const refusalCase of VENDOR_REFUSALS) {
  test(`attempts ${refusalCase.cause} exactly once and drops the pending entry`, async () => {
    // act
    const { thrown, sends, binder } = await refuse(refusalCase);

    // assert
    assert.deepStrictEqual(
      { thrown, sends, pending: [...binder.pending] },
      { thrown: refusalCase.status, sends: [`${DEVICE_ID} self-test true`], pending: [] },
    );
  });
}

// Every line a refusal writes, across all six causes. A log is a channel the plugin controls, so
// what it may not carry is asserted directly: a bearer token, the vendor base URL, or the device
// identifier, which reads `<account-id>_<serial-number>` and so carries an account identifier
// (AUTH-02).
test('names the capability in every refusal line and quotes no token, URL, or device identifier', async () => {
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

  // act
  for (const refusalCase of REFUSALS) {
    const { commands } = recordingCommands(refusalCase.outcome);
    const { service } = boundSwitch({ commands, log, offlineConfirmed: () => refusalCase.offlineConfirmed }, () => refusalCase.reported);

    await assertRefused(service, refusalCase.value, refusalCase.status);
  }

  // assert
  assert.deepStrictEqual(
    warnings.map((warning) => ({
      capability: warning.includes('self-test'),
      token: warning.includes(BEARER_TOKEN),
      baseUrl: warning.includes(BASE_URL),
      deviceId: warning.includes(DEVICE_ID),
    })),
    Array.from(REFUSALS, () => ({ capability: true, token: false, baseUrl: false, deviceId: false })),
  );
});
