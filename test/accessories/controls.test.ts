import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { bindRestoredControlRefusal, createControlBinder } from '../../src/accessories/controls.js';

import type { FakeHapCharacteristic, FakeHapService } from '../../features/support/fakeHap.js';
import type { ControlBinder, ControlBinderOptions } from '../../src/accessories/controls.js';
import type { DeviceCapability } from '../../src/device/family.js';
import type { CommandOutcome, CommandPort } from '../../src/runtime/commandPort.js';
import type { Timers } from '../../src/runtime/timers.js';
import type { API, Logging, Service } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const SELF_TEST = 'system-self-test';
const ALARM_MUTE = 'alarm-mute';

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
    // logging is not this module's job; the stub discards every call
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
  commandTransportReady?: () => boolean;
  liveConfirmationObservable?: () => boolean;
}

function binderOptions(overrides: BinderOverrides = {}): ControlBinderOptions {
  return {
    hap: HAP_NAMESPACE,
    log: overrides.log ?? silentLog(),
    timers: overrides.timers ?? recordingTimers().timers,
    commands: overrides.commands ?? recordingCommands().commands,
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

  binder.bind(service as unknown as Service, 'self-test', reported);

  return { binder, service };
}

// The refusal's clearing push, told apart from any other deferral by the delay it was armed at.
function clearingPushesIn(deferrals: readonly Deferral[]): readonly Deferral[] {
  return deferrals.filter((deferral) => deferral.delayMs === 0);
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
    { value: onCharacteristic(service).value, pushed: onCharacteristic(service).pushed, clearingPushes: clearingPushesIn(deferrals).length, republished },
    { value: true, pushed: false, clearingPushes: 0, republished: [] },
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
    clearingPushesIn(deferrals)[0]?.run();

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

test('names the capability, the device and the cause in the one line a refusal logs, and quotes nothing else', async () => {
  // arrange
  const warnings: string[] = [];
  const log = warningLog(warnings);
  const { commands } = recordingCommands({ accepted: false, failure: 'timed-out' });
  const { service } = boundSwitch({ commands, log });

  // act
  await assertRefused(service, true, OPERATION_TIMED_OUT);

  // assert
  assert.deepStrictEqual(warnings, [`The self-test request on ${DEVICE_ID} did not take effect: timed-out. It is not retried.`]);
});

// The eight ways one write can end, in the order the binder evaluates them: six the plugin answers
// by itself and two the vendor answers. Every case below is read off this one table, so a cause
// that stops being refused, or that starts answering a different status, fails by name.
interface RefusalCase {
  cause: string;
  value: unknown;
  reported: boolean | undefined;
  offlineConfirmed: boolean;
  transportReady: boolean;
  confirmationObservable: boolean;
  outcome: CommandOutcome;
  status: number;
}

const LOCAL_REFUSALS: readonly RefusalCase[] = [
  {
    cause: 'a write of anything but on',
    value: false,
    reported: false,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: true,
    outcome: ACCEPTED,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
  },
  {
    cause: 'a runtime with no way to reach the vendor',
    value: true,
    reported: false,
    offlineConfirmed: false,
    transportReady: false,
    confirmationObservable: true,
    outcome: ACCEPTED,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
  },
  {
    cause: 'a live path that cannot carry the device answer',
    value: true,
    reported: false,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: false,
    outcome: ACCEPTED,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
  },
  {
    cause: 'a capability whose reported field has not decoded',
    value: true,
    reported: undefined,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: true,
    outcome: ACCEPTED,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
  },
  {
    cause: 'a device confirmed offline',
    value: true,
    reported: false,
    offlineConfirmed: true,
    transportReady: true,
    confirmationObservable: true,
    outcome: ACCEPTED,
    status: NOT_ALLOWED_IN_CURRENT_STATE,
  },
  {
    cause: 'a duplicate request while the capability already reads active',
    value: true,
    reported: true,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: true,
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
    transportReady: true,
    confirmationObservable: true,
    outcome: { accepted: false, failure: 'vendor-error' },
    status: SERVICE_COMMUNICATION_FAILURE,
  },
  {
    cause: 'an exceeded deadline',
    value: true,
    reported: false,
    offlineConfirmed: false,
    transportReady: true,
    confirmationObservable: true,
    outcome: { accepted: false, failure: 'timed-out' },
    status: OPERATION_TIMED_OUT,
  },
];

const REFUSALS: readonly RefusalCase[] = [...LOCAL_REFUSALS, ...VENDOR_REFUSALS];

// One write against one row of the table, with everything the assertions read back.
async function refuse(
  refusalCase: RefusalCase,
): Promise<{ thrown: unknown; sends: string[]; deferrals: Deferral[]; binder: ControlBinder; service: FakeHapService }> {
  const { commands, sends } = recordingCommands(refusalCase.outcome);
  const { timers, deferrals } = recordingTimers();
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

  return { thrown, sends, deferrals, binder, service };
}

test('answers each of the eight refusal causes with the status that describes it', async () => {
  // act
  const answered = [];

  for (const refusalCase of REFUSALS) {
    answered.push((await refuse(refusalCase)).thrown);
  }

  // assert
  assert.deepStrictEqual(answered, [-70412, -70412, -70412, -70412, -70412, -70403, -70402, -70408]);
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
// what it may not carry is asserted directly: a bearer token, the vendor base URL, or a response
// body (AUTH-02). The device identifier is asserted PRESENT, not absent: a vendor `deviceId` is a
// non-sensitive value, admitted to logs and accessory context, and without it a multi-pump account
// cannot tell which pump refused. `D-027` still keeps it out of public artifacts, which is a
// different channel from this one.
test('names the capability and the device in every refusal line and quotes no token or URL', async () => {
  // arrange
  const warnings: string[] = [];
  const log = warningLog(warnings);

  // act
  for (const refusalCase of REFUSALS) {
    const { commands } = recordingCommands(refusalCase.outcome);
    const { service } = boundSwitch(
      {
        commands,
        log,
        offlineConfirmed: () => refusalCase.offlineConfirmed,
        commandTransportReady: () => refusalCase.transportReady,
        liveConfirmationObservable: () => refusalCase.confirmationObservable,
      },
      () => refusalCase.reported,
    );

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
    Array.from(REFUSALS, () => ({ capability: true, token: false, baseUrl: false, deviceId: true })),
  );
});

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
  const { commands, sends } = recordingCommands();
  const { service } = boundSwitch({ commands, log: warningLog(warnings), commandTransportReady: () => true }, () => undefined);

  // act
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);

  // assert
  assert.deepStrictEqual({ warnings, sends }, { warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_FRESH_STATE_CAUSE}.`], sends: [] });
});

test('names the missing transport when the capability has decoded and there is no way to send', async () => {
  // arrange
  const warnings: string[] = [];
  const { commands, sends } = recordingCommands();
  const { service } = boundSwitch({ commands, log: warningLog(warnings), commandTransportReady: () => false }, () => false);

  // act
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);

  // assert
  assert.deepStrictEqual({ warnings, sends }, { warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_COMMAND_TRANSPORT_CAUSE}.`], sends: [] });
});

// Both conditions at once, which is the case the table's order decides. Naming the missing state to
// a user who has no way to send anything is the less actionable of the two truths, so the transport
// rule is evaluated first -- and this case is what stops an unrelated reordering of the table from
// changing the answer silently (D-07).
test('names the missing transport alone when the plugin has neither fresh state nor a way to send', async () => {
  // arrange
  const warnings: string[] = [];
  const { commands, sends } = recordingCommands();
  const { service } = boundSwitch({ commands, log: warningLog(warnings), commandTransportReady: () => false }, () => undefined);

  // act
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);

  // assert
  assert.deepStrictEqual({ warnings, sends }, { warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_COMMAND_TRANSPORT_CAUSE}.`], sends: [] });
});

// The third fact of the gate, on its own. The route is proven and the capability's reported value is
// right there, so neither of the other two rules can be what refused this press: what the plugin
// lacks is the channel the device answers on (D-07, D-08, WR-02).
test('names the quiet live connection when the route and the reported value are both there', async () => {
  // arrange
  const warnings: string[] = [];
  const { commands, sends } = recordingCommands();
  const { service } = boundSwitch({ commands, log: warningLog(warnings), liveConfirmationObservable: () => false }, () => false);

  // act
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);

  // assert
  assert.deepStrictEqual({ warnings, sends }, { warnings: [`Refused self-test on ${DEVICE_ID}: ${QUIET_LIVE_CONNECTION_CAUSE}.`], sends: [] });
});

// The quiet live path and no route at all, which is the pair the new rule's placement decides. A
// plugin with no route to send on cannot be helped by a channel to hear back on, so the more
// fundamental truth keeps its place at the top of the table and this case is what stops an edit
// moving the new rule above it from changing the answer silently (D-07, D-08).
test('names the missing transport alone when the plugin has neither a route to send on nor a live path to hear back on', async () => {
  // arrange
  const warnings: string[] = [];
  const { commands, sends } = recordingCommands();
  const { service } = boundSwitch(
    { commands, log: warningLog(warnings), commandTransportReady: () => false, liveConfirmationObservable: () => false },
    () => false,
  );

  // act
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);

  // assert
  assert.deepStrictEqual({ warnings, sends }, { warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_COMMAND_TRANSPORT_CAUSE}.`], sends: [] });
});

// The other side of the placement. Here the state genuinely has not decoded and the live path is
// also quiet, and the quiet path is named because it is the condition an owner can act on: a
// reported field that never decoded is a symptom of the same silence more often than a fault of its
// own. This case is what stops an edit moving the new rule below the state rule (D-07, D-08, WR-02).
test('names the quiet live connection alone when the reported field has also not decoded', async () => {
  // arrange
  const warnings: string[] = [];
  const { commands, sends } = recordingCommands();
  const { service } = boundSwitch({ commands, log: warningLog(warnings), liveConfirmationObservable: () => false }, () => undefined);

  // act
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);

  // assert
  assert.deepStrictEqual({ warnings, sends }, { warnings: [`Refused self-test on ${DEVICE_ID}: ${QUIET_LIVE_CONNECTION_CAUSE}.`], sends: [] });
});

test('answers the transport refusal status to every read until the clearing push lands', async () => {
  // arrange
  const { timers, deferrals } = recordingTimers();
  const { service } = boundSwitch({ timers, commandTransportReady: () => false });

  // act
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);
  const afterTheRefusal = onCharacteristic(service).statusCode;
  clearingPushesIn(deferrals)[0]?.run();

  // assert
  assert.deepStrictEqual(
    { afterTheRefusal, afterTheClearingPush: onCharacteristic(service).statusCode },
    { afterTheRefusal: NOT_ALLOWED_IN_CURRENT_STATE, afterTheClearingPush: SUCCESS },
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
  const { commands, sends } = recordingCommands();
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
    { pending: [...binder.pending], republished, warnings, sends },
    {
      pending: [],
      republished: ['republish'],
      warnings: [`The self-test request on ${DEVICE_ID} was never confirmed by the device. It is not retried.`],
      sends: [`${DEVICE_ID} self-test true`],
    },
  );
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
  assert.deepStrictEqual({ warnings: warnings.length, pending: [...binder.pending] }, { warnings: 1, pending: [] });
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
  binder.bind(muteService as unknown as Service, 'alarm-mute', () => false);
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
    const { commands, sends } = recordingCommands();
    const other = createControlBinder(binderOptions({ commands }));
    const otherService = new HAP.Service.Switch('Control', capability);
    other.bind(otherService as unknown as Service, capability, () => false);
    const beforeTheWrite = [...other.pending];

    // act
    await onCharacteristic(otherService).handleSetRequest(true);

    // assert
    assert.deepStrictEqual({ beforeTheWrite, sends }, { beforeTheWrite: [], sends: [`${DEVICE_ID} ${capability} true`] });
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
    service: service as unknown as Service,
    accessoryName: RESTORED_ACCESSORY_NAME,
  });

  return service;
}

// What a controller read of the control answers: the value, or the status a refusal left standing.
// The read is the whole difference between a tile that is merely marked and one Apple Home greys
// out, so it is driven rather than inferred from the stored status.
function readOfSwitch(service: FakeHapService): { value: unknown; threw: unknown } {
  try {
    return { value: onCharacteristic(service).handleGetRequest(), threw: undefined };
  } catch (error: unknown) {
    return { value: undefined, threw: error };
  }
}

test('refuses a press on a restored control and leaves the toggle where the cache left it', async () => {
  // arrange
  const service = refusingRestoredSwitch();
  service.updateCharacteristic(HAP.Characteristic.On, false);

  // act & assert
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);
  assert.deepStrictEqual(
    { value: onCharacteristic(service).value, statusCode: onCharacteristic(service).statusCode },
    { value: false, statusCode: NOT_ALLOWED_IN_CURRENT_STATE },
  );
});

// The same cause the transport rule gives a live accessory, because it is the same condition: after
// a restart the cloud has not answered, so the plugin has no route to send on. One condition with
// two wordings is what the per-cause table exists to prevent (D-07, D-08).
test('names the service, the accessory and the cause in the one line a restored refusal logs', async () => {
  // arrange
  const warnings: string[] = [];
  const service = refusingRestoredSwitch({ log: warningLog(warnings) });

  // act
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);

  // assert
  assert.deepStrictEqual(warnings, [`Refused System Self-Test on ${RESTORED_ACCESSORY_NAME}: ${NO_COMMAND_TRANSPORT_CAUSE}.`]);
});

// Without the clearing push the refused characteristic answers its status to every later read, which
// Apple Home draws as "No Response" for the whole accessory -- the presentation this project
// reserves for a refused credential, which never clears itself. A restart with the cloud down clears
// itself the moment a poll succeeds (D-04, D-10).
test('returns the refused control to a readable state once the clearing push has run', async () => {
  // arrange
  const { timers, deferrals } = recordingTimers();
  const service = refusingRestoredSwitch({ timers });
  service.updateCharacteristic(HAP.Characteristic.On, false);

  // act
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);
  const afterTheRefusal = readOfSwitch(service);
  clearingPushesIn(deferrals)[0]?.run();

  // assert
  assert.deepStrictEqual(
    { delays: deferrals.map((deferral) => deferral.delayMs), afterTheRefusal, afterTheClearingPush: readOfSwitch(service) },
    {
      delays: [0],
      afterTheRefusal: { value: undefined, threw: NOT_ALLOWED_IN_CURRENT_STATE },
      afterTheClearingPush: { value: false, threw: undefined },
    },
  );
});

test('leaves a restored control answering a read before any press reaches it', () => {
  // arrange
  const service = refusingRestoredSwitch();
  service.updateCharacteristic(HAP.Characteristic.On, true);

  // act & assert
  assert.deepStrictEqual(readOfSwitch(service), { value: true, threw: undefined });
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
    await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);
    clearingPushesIn(deferrals)[0]?.run();

    // assert
    assert.deepStrictEqual(readOfSwitch(service), { value: held, threw: undefined });
  });
}
