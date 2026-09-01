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
 */

import assert from 'node:assert/strict';

import { Then, When } from '@cucumber/cucumber';

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
const STEP_TIMEOUT_MS = 15_000;

// The characteristic a controller writes to on a switch.
const ON = 'On';

function onCharacteristicOf(homebridge: FakeHomebridgeApi, displayName: string): FakeHapCharacteristic | undefined {
  return serviceOf(homebridge, displayName)?.characteristics.find((candidate) => candidate.displayName === ON);
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

async function turnOnTheSwitch(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  await this.untilTrue(() => onCharacteristicOf(homebridge, displayName) !== undefined, PUBLISH_DEADLINE_MS, `the plugin published no ${displayName} switch`);

  const characteristic = onCharacteristicOf(homebridge, displayName);

  if (characteristic === undefined) {
    throw new Error(`the plugin published no ${displayName} switch`);
  }

  await characteristic.handleSetRequest(true);
}

When('a controller turns on the {string} switch', { timeout: STEP_TIMEOUT_MS }, turnOnTheSwitch);

async function assertSwitchReadsOn(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  assert.strictEqual(pushedValue(onCharacteristicOf(homebridge, displayName)), true);
}

Then('the {string} switch reads on', assertSwitchReadsOn);

// The measured Gemini self-test body, written out here rather than built from the family, so a
// changed wire shape fails at the boundary the vendor actually reads (CTRL-03, D-018).
async function assertOneSelfTestCommand(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();
  const commands = commandsIn(service.requests);

  assert.strictEqual(commands.length, 1);
  assert.deepStrictEqual(
    commands.map((request) => desiredDataOf(request)),
    [{ test_running: true }],
  );
}

Then('the vendor receives one self-test command', assertOneSelfTestCommand);

// Wider than the window the plugin arms, so the step's own literal states what "past" means rather
// than the scenario depending on a delay declared somewhere else.
const PAST_THE_PENDING_WINDOW_MS = 30_001;

// The plugin holds the request open for a fixed window and then gives up on it. Advancing the
// scenario clock past that window runs the deadline the plugin armed, so a scenario observes the
// window closing without sleeping and without racing a process timer.
function movePastThePendingWindow(this: BasementGuardianWorld): void {
  this.advanceClock(PAST_THE_PENDING_WINDOW_MS);
}

When('the scenario clock moves past the control pending window', movePastThePendingWindow);

async function assertNoCommand(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  assert.deepStrictEqual(
    service.requests.filter((request) => request.method === 'PUT').map((request) => request.path),
    [],
  );
}

Then('the vendor receives no command', assertNoCommand);
