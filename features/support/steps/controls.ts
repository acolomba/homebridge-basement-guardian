/**
 * @fileoverview Steps that press a control and read what reached the vendor.
 *
 * These are the write half of a scenario sentence: a controller writes to a published Switch, and
 * the assertions read back what the fake vendor received and what the switch now serves. Nothing
 * here reaches into the plugin -- the write goes through the same HAP entry point a paired
 * controller uses, and the request assertions read the fake service's own record.
 *
 * A named service is resolved through the shared catalogue lookup, so a step never restates a
 * published identity a user's automations attach to (D-12).
 *
 * Every published value is read through the pushed gate. HAP constructs a `Switch` with `On` at
 * `false`, which is also the quiet state, so reading the value alone cannot tell a switch the
 * plugin published from one it never wrote to.
 */

import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

import { pushedValue, serviceOf } from '../publishedServices.js';

import type { FakeHapCharacteristic } from '../fakeHap.js';
import type { FakeHomebridgeApi } from '../fakeHomebridgeApi.js';
import type { FakeRestRequest } from '../fakeRestApi.js';
import type { BasementGuardianWorld } from '../world.js';

// The command route's own suffix, so a step names what the vendor receives rather than a path this
// module rebuilt.
const COMMAND_SUFFIX = '/data';

// A published value appears only once a poll has applied what a step just set, so every read that
// waits carries a deadline that turns a poll which never ran into a named failure.
const PUBLISH_DEADLINE_MS = 2000;

// A press the vendor never answers spends the client's own 2.5-second deadline in real time, which
// is the one wait these scenarios make. It fits inside this timeout with room to spare; shortening
// this below three seconds would turn that scenario into a runner timeout on the wrong condition.
const STEP_TIMEOUT_MS = 15_000;

// The characteristic a controller writes to on a switch.
const ON = 'On';

// The status the fake vendor refuses a command with. Every non-2xx reaches the client as the same
// request error, so one states the branch rather than a list restating it.
const REFUSED_COMMAND_STATUS = 500;

// A resolved answer that is not an acceptance. `constraints.md:103` records the success body; this
// is that same shape carrying the flag the plugin has to read rather than assume (CTRL-05).
const UNSUCCESSFUL_COMMAND_BODY = { success: false };

// An acceptance the fake pump does not react to, so a scenario can decide for itself when the
// device's confirming report arrives (CTRL-05, D-06).
const ACCEPTED_COMMAND_BODY = { success: true };

// The two measured command bodies, written out here rather than built from the family, so a changed
// wire shape fails at the boundary the vendor actually reads (CTRL-03, CTRL-04, D-018, D-019).
const SELF_TEST_COMMAND = { test_running: true };
const ALARM_MUTE_COMMAND = { alarm_audio_muted: true };

// Wider than the window the plugin arms, so the step's own literal states what "past" means rather
// than the scenario depending on a delay declared somewhere else.
const PAST_THE_PENDING_WINDOW_MS = 30_001;

function characteristicOf(homebridge: FakeHomebridgeApi, serviceName: string, characteristicName: string): FakeHapCharacteristic | undefined {
  return serviceOf(homebridge, serviceName)?.characteristics.find((candidate) => candidate.displayName === characteristicName);
}

function onCharacteristicOf(homebridge: FakeHomebridgeApi, displayName: string): FakeHapCharacteristic | undefined {
  return characteristicOf(homebridge, displayName, ON);
}

function publishedSwitch(homebridge: FakeHomebridgeApi, displayName: string): FakeHapCharacteristic {
  const characteristic = onCharacteristicOf(homebridge, displayName);

  if (characteristic === undefined) {
    throw new Error(`the plugin published no ${displayName} switch`);
  }

  return characteristic;
}

function commandsIn(requests: readonly FakeRestRequest[]): readonly FakeRestRequest[] {
  return requests.filter((request) => request.method === 'PUT' && new URL(request.path, 'http://vendor.test').pathname.endsWith(COMMAND_SUFFIX));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function desiredDataOf(request: FakeRestRequest): unknown {
  const body: unknown = JSON.parse(request.body);

  return isRecord(body) ? body.desiredData : undefined;
}

// A controller write, with its outcome recorded rather than raised. The real HAP rejects a refused
// write with a bare status number and the stand-in reproduces that, so anything else thrown is a
// defect and travels on rather than being read as a refusal.
async function writeToSwitch(world: BasementGuardianWorld, displayName: string, value: boolean): Promise<void> {
  const homebridge = await world.homebridge();

  await world.untilTrue(() => onCharacteristicOf(homebridge, displayName) !== undefined, PUBLISH_DEADLINE_MS, `the plugin published no ${displayName} switch`);

  try {
    await publishedSwitch(homebridge, displayName).handleSetRequest(value);
    world.recordWriteOutcome(undefined);
  } catch (thrown: unknown) {
    if (typeof thrown !== 'number') {
      throw thrown;
    }

    world.recordWriteOutcome(thrown);
  }
}

async function assertCommandBodies(world: BasementGuardianWorld, count: number, desiredData: Record<string, unknown>): Promise<void> {
  const service = await world.restApi();
  const commands = commandsIn(service.requests);

  assert.deepStrictEqual(
    commands.map((request) => desiredDataOf(request)),
    Array.from({ length: count }, () => desiredData),
  );
}

async function assertWriteRefusedWith(world: BasementGuardianWorld, status: (statuses: FakeHomebridgeApi['hap']['HAPStatus']) => number): Promise<void> {
  const homebridge = await world.homebridge();

  assert.strictEqual(world.writeStatus(), status(homebridge.hap.HAPStatus));
}

async function refusedCommand(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.rejectNextCommand(REFUSED_COMMAND_STATUS);
}

Given('the vendor refuses the next command', refusedCommand);

async function unsuccessfulCommand(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.answerNextCommandWith(UNSUCCESSFUL_COMMAND_BODY);
}

Given('the vendor answers the next command unsuccessfully', unsuccessfulCommand);

async function unansweredCommand(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.holdNextCommand();
}

Given('the vendor never answers the next command', unansweredCommand);

// The acceptance the fake pump stays quiet after. It is what lets a scenario hold the device's
// confirming report until after the pending window has closed.
async function acceptedCommandWithNoReport(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.answerNextCommandWith(ACCEPTED_COMMAND_BODY);
}

Given('the vendor accepts the next command with no device report', acceptedCommandWithNoReport);

// The write a scenario expects to be accepted. A refusal here raises rather than being recorded, so
// a scenario about an accepted press fails on the press instead of on a later assertion.
async function turnOnTheSwitch(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  await this.untilTrue(() => onCharacteristicOf(homebridge, displayName) !== undefined, PUBLISH_DEADLINE_MS, `the plugin published no ${displayName} switch`);

  await publishedSwitch(homebridge, displayName).handleSetRequest(true);
}

When('a controller turns on the {string} switch', { timeout: STEP_TIMEOUT_MS }, turnOnTheSwitch);

// The same write, for a scenario that asserts how it ended.
function pressTheSwitch(this: BasementGuardianWorld, displayName: string): Promise<void> {
  return writeToSwitch(this, displayName, true);
}

When('a controller presses the {string} switch', { timeout: STEP_TIMEOUT_MS }, pressTheSwitch);

function turnOffTheSwitch(this: BasementGuardianWorld, displayName: string): Promise<void> {
  return writeToSwitch(this, displayName, false);
}

When('a controller turns off the {string} switch', { timeout: STEP_TIMEOUT_MS }, turnOffTheSwitch);

// A published record value, read through the pushed gate and kept for a later step to compare
// against. Reading it is what makes the comparison after a restart a comparison of two published
// values rather than of a value against the scenario's own arithmetic (CTRL-01).
async function readPublishedValue(this: BasementGuardianWorld, characteristicName: string, serviceName: string): Promise<void> {
  const homebridge = await this.homebridge();
  const value = pushedValue(characteristicOf(homebridge, serviceName, characteristicName));

  if (value === undefined) {
    throw new Error(`the ${serviceName} service published no ${characteristicName}`);
  }

  this.remember(`${serviceName} ${characteristicName}`, value);
}

When('the scenario reads {string} on the {string} service', { timeout: STEP_TIMEOUT_MS }, readPublishedValue);

// The plugin holds the request open for a fixed window and then gives up on it. Advancing the
// scenario clock past that window runs the deadline the plugin armed, so a scenario observes the
// window closing without sleeping and without racing a process timer.
function movePastThePendingWindow(this: BasementGuardianWorld): void {
  this.advanceClock(PAST_THE_PENDING_WINDOW_MS);
}

When('the scenario clock moves past the control pending window', movePastThePendingWindow);

async function assertSwitchReadsOn(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  assert.strictEqual(pushedValue(onCharacteristicOf(homebridge, displayName)), true);
}

Then('the {string} switch reads on', assertSwitchReadsOn);

// A refused write leaves its status on the characteristic and HAP answers that status to every
// later read, so a switch that stopped answering reads is the failure this asserts the absence of
// (D-04). An absent switch raises from inside the callback and fails the step by name.
async function assertSwitchAnswersARead(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  assert.doesNotThrow(() => publishedSwitch(homebridge, displayName).handleGetRequest());
}

Then('the {string} switch answers a read', assertSwitchAnswersARead);

function assertSelfTestCommands(this: BasementGuardianWorld, count: number): Promise<void> {
  return assertCommandBodies(this, count, SELF_TEST_COMMAND);
}

Then('the vendor receives {int} self-test command(s)', assertSelfTestCommands);

function assertAlarmMuteCommands(this: BasementGuardianWorld, count: number): Promise<void> {
  return assertCommandBodies(this, count, ALARM_MUTE_COMMAND);
}

Then('the vendor receives {int} alarm mute command(s)', assertAlarmMuteCommands);

async function assertNoCommand(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  assert.deepStrictEqual(
    service.requests.filter((request) => request.method === 'PUT').map((request) => request.path),
    [],
  );
}

Then('the vendor receives no command', assertNoCommand);

function assertCommunicationFailure(this: BasementGuardianWorld): Promise<void> {
  return assertWriteRefusedWith(this, (statuses) => statuses.SERVICE_COMMUNICATION_FAILURE);
}

Then('the write reports a communication failure', assertCommunicationFailure);

function assertOperationTimedOut(this: BasementGuardianWorld): Promise<void> {
  return assertWriteRefusedWith(this, (statuses) => statuses.OPERATION_TIMED_OUT);
}

Then('the write reports a timeout', assertOperationTimedOut);

function assertNotAllowedNow(this: BasementGuardianWorld): Promise<void> {
  return assertWriteRefusedWith(this, (statuses) => statuses.NOT_ALLOWED_IN_CURRENT_STATE);
}

Then('the write reports that the control is not allowed now', assertNotAllowedNow);

// The value the plugin published after a restart, against the one it published before it. The read
// waits, because a restarted plugin publishes nothing until its first poll has landed.
async function assertPublishedValueCameBack(this: BasementGuardianWorld, serviceName: string, characteristicName: string): Promise<void> {
  const homebridge = await this.homebridge();
  const expected = this.recall(`${serviceName} ${characteristicName}`);
  const failure = `the ${serviceName} service never published ${characteristicName} again`;

  await this.untilTrue(() => pushedValue(characteristicOf(homebridge, serviceName, characteristicName)) === expected, PUBLISH_DEADLINE_MS, failure);
}

Then('the {string} service reports {string} as the value the scenario read', { timeout: STEP_TIMEOUT_MS }, assertPublishedValueCameBack);

// The whole line, not a fragment of it. The vendor deviceId is in it deliberately: without it a
// multi-pump account cannot tell which pump never confirmed a control, so an assertion that
// tolerated its absence would let a later reading of the privacy rule quietly remove it again.
function assertUnconfirmedWarning(this: BasementGuardianWorld, capability: string): void {
  const deviceId = this.devices.at(0)?.deviceId;
  const warnings = this.logged.filter((line) => line.startsWith('warn ') && line.includes('never confirmed'));

  assert.deepStrictEqual(warnings, [`warn The ${capability} request on ${String(deviceId)} was never confirmed by the device. It is not retried.`]);
}

Then('the log warns once that the device never confirmed the {string} request', assertUnconfirmedWarning);

// The whole line, like the unconfirmed-request assertion above and for the same reason: the cause is
// the whole content of a per-cause refusal table, so an assertion matching a fragment would pass on a
// line naming a different condition. The `deviceId` is asserted present for the reason recorded there.
function assertRefusalWarning(this: BasementGuardianWorld, capability: string, cause: string): void {
  const deviceId = this.devices.at(0)?.deviceId;
  const warnings = this.logged.filter((line) => line.startsWith('warn Refused '));

  assert.deepStrictEqual(warnings, [`warn Refused ${capability} on ${String(deviceId)}: ${cause}.`]);
}

Then('the log warns once that the {string} press was refused because {string}', assertRefusalWarning);
