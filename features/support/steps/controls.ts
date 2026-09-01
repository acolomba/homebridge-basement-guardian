/**
 * @fileoverview Steps that press a control and read what reached the vendor.
 *
 * These are the write half of a scenario sentence: a controller writes to a published Switch, and
 * the assertions read back what the fake vendor received and what the switch now serves. Nothing
 * here reaches into the plugin -- the write goes through the same HAP entry point a paired
 * controller uses, and the request assertions read the fake service's own record.
 *
 * A named service is resolved through the catalogue, which is the one place a display name, a
 * service type, and a subtype are declared together, so a step never restates a published identity
 * a user's automations attach to (D-12).
 */

import assert from 'node:assert/strict';

import { Then, When } from '@cucumber/cucumber';

import { createServiceCatalogue } from '../../../src/accessories/serviceCatalogue.js';

import type { FakeHapCharacteristic, FakeHapService, FakeServiceClass } from '../fakeHap.js';
import type { FakeAccessory, FakeHomebridgeApi } from '../fakeHomebridgeApi.js';
import type { FakeRestRequest } from '../fakeRestApi.js';
import type { BasementGuardianWorld } from '../world.js';
import type { API } from 'homebridge';

// The command route's own suffix, so a step names what the vendor receives rather than a path this
// module rebuilt.
const COMMAND_SUFFIX = '/data';

// A published value appears only once a poll has applied what a step just set, so every read that
// waits carries a deadline that turns a poll which never ran into a named failure.
const PUBLISH_DEADLINE_MS = 2000;
const STEP_TIMEOUT_MS = 15_000;

// The characteristic a controller writes to on a switch.
const ON = 'On';

// Every scenario here seeds exactly one physical device, so a step reads back through the one
// accessory the plugin ever registers.
function currentAccessory(homebridge: FakeHomebridgeApi): FakeAccessory | undefined {
  return homebridge.registerPlatformAccessoryCalls[0]?.accessories[0];
}

function serviceOf(homebridge: FakeHomebridgeApi, displayName: string): FakeHapService | undefined {
  const row = createServiceCatalogue(homebridge.hap as unknown as API['hap']).find((candidate) => candidate.displayName === displayName);

  if (row === undefined) {
    throw new Error(`the plugin publishes no ${displayName} service`);
  }

  // The catalogue declares its service classes against the real HAP types while the accessory
  // stand-in answers its own; the class is one runtime object, so the lookup needs the other view.
  return currentAccessory(homebridge)?.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);
}

function onCharacteristicOf(homebridge: FakeHomebridgeApi, displayName: string): FakeHapCharacteristic | undefined {
  return serviceOf(homebridge, displayName)?.characteristics.find((candidate) => candidate.displayName === ON);
}

// A value only the plugin can have written. HAP constructs every characteristic at its format
// default, and `false` is also the resting state of a control, so reading the value alone cannot
// tell a published switch from one the plugin never wrote to (D-014).
function pushedValue(characteristic: FakeHapCharacteristic | undefined): unknown {
  return characteristic?.pushed === true ? characteristic.value : undefined;
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

async function assertNoCommand(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  assert.deepStrictEqual(
    service.requests.filter((request) => request.method === 'PUT').map((request) => request.path),
    [],
  );
}

Then('the vendor receives no command', assertNoCommand);
