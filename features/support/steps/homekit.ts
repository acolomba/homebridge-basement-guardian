/**
 * @fileoverview Steps that read what the plugin published to HomeKit.
 *
 * A scenario states what the vendor reports and then asks what Apple Home would show. These steps
 * are the second half of that sentence: they reach the one accessory the plugin registered and read
 * a published service and characteristic back off it, so a scenario proves the whole path rather
 * than the plugin's own opinion of it.
 *
 * The service catalogue is the one place a display name, a service type, and a subtype are declared
 * together, so a step resolves a named service through the catalogue rather than restating the
 * published identity that a user's automations attach to (D-12).
 */

import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

import { Then } from '@cucumber/cucumber';

import { createServiceCatalogue } from '../../../src/accessories/serviceCatalogue.js';
import { currentAccessory, pushedValue, serviceOf, serviceOnNamed } from '../publishedServices.js';

import type { FakeHapService, FakeServiceClass } from '../fakeHap.js';
import type { FakeHomebridgeApi } from '../fakeHomebridgeApi.js';
import type { BasementGuardianWorld } from '../world.js';
import type { API } from 'homebridge';

// A published value appears only once a poll has applied the vendor state a step just set, so every
// read carries a deadline that turns a poll which never ran into a named failure.
const PUBLISH_DEADLINE_MS = 2000;
const STEP_TIMEOUT_MS = 15_000;

// A message the plugin ignores leaves no trace a step can wait on, so a step asserting that the
// refusal survived one gives the delivery, and the update it would have made, time to land first.
const DELIVERY_SETTLE_MS = 200;

// The two characteristics this plugin raises an alarm through, and the states they raise it in.
// `ContactSensorState.CONTACT_NOT_DETECTED` and `LeakDetected.LEAK_DETECTED` are both 1, so an
// Apple Home tile reads "Open" or "Leak" when there is something to act on, and 0 is the quiet
// state of either. A service carries exactly one of the two, so a step names the sensor and the
// read finds whichever characteristic that sensor raises its alarm through.
const ALARM_CHARACTERISTICS: readonly string[] = ['Contact Sensor State', 'Leak Detected'];
const ALARM_ACTIVATED = 1;
const ALARM_QUIET = 0;

function characteristicValue(service: FakeHapService | undefined, displayName: string): unknown {
  return pushedValue(service?.characteristics.find((candidate) => candidate.displayName === displayName));
}

// A published time is an ISO-8601 instant, and a record that has observed nothing publishes the
// empty string rather than a fabricated one.
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// A scenario states a published value as the value HomeKit carries, so it reads `true`, `80`, and
// the instant itself rather than the text of any of them. Anything else is a scenario naming a
// value no service can publish.
function publishedValue(text: string): boolean | number | string {
  if (text === 'true' || text === 'false') {
    return text === 'true';
  }

  if (text === '' || ISO_INSTANT.test(text)) {
    return text;
  }

  if (!/^-?\d+$/.test(text)) {
    throw new Error(`a scenario states a published value as "true", "false", a whole number, or an instant, not ${text}`);
  }

  return Number(text);
}

function alarmValue(service: FakeHapService | undefined): unknown {
  return pushedValue(service?.characteristics.find((candidate) => ALARM_CHARACTERISTICS.includes(candidate.displayName)));
}

function untilPublished(world: BasementGuardianWorld, read: () => unknown, expected: unknown, failure: string): Promise<void> {
  return world.untilTrue(() => read() === expected, PUBLISH_DEADLINE_MS, failure);
}

async function untilAlarmState(world: BasementGuardianWorld, displayName: string, state: number, failure: string): Promise<void> {
  const homebridge = await world.homebridge();

  await untilPublished(world, () => alarmValue(serviceOf(homebridge, displayName)), state, failure);
}

async function assertServicePublished(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  await this.untilTrue(() => serviceOf(homebridge, displayName) !== undefined, PUBLISH_DEADLINE_MS, `the plugin never published the ${displayName} service`);
}

Then('the plugin publishes the {string} service', { timeout: STEP_TIMEOUT_MS }, assertServicePublished);

// How many catalogue services the one registered accessory carries. Nothing is registered until the
// first poll completes, and an unregistered accessory answers `undefined` for every service name, so
// an absence read before then is satisfied by every name including the ones the plugin does publish.
// Waiting on this count is what makes the absence evidence: a run that published nothing at all
// fails the step by name rather than passing it fifteen times over.
function publishedServiceCount(homebridge: FakeHomebridgeApi): number {
  const accessory = currentAccessory(homebridge);

  if (accessory === undefined) {
    return 0;
  }

  return createServiceCatalogue(homebridge.hap as unknown as API['hap']).filter(
    (row) => accessory.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype) !== undefined,
  ).length;
}

async function assertServiceNotPublished(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  await this.untilTrue(() => publishedServiceCount(homebridge) > 0, PUBLISH_DEADLINE_MS, 'the plugin never published a service');

  assert.equal(serviceOf(homebridge, displayName), undefined);
}

Then('the plugin publishes no {string} service', { timeout: STEP_TIMEOUT_MS }, assertServiceNotPublished);

async function assertCharacteristicValue(this: BasementGuardianWorld, serviceName: string, characteristicName: string, text: string): Promise<void> {
  const homebridge = await this.homebridge();
  const failure = `the ${serviceName} service never reported ${characteristicName} as ${text}`;

  await untilPublished(this, () => characteristicValue(serviceOf(homebridge, serviceName), characteristicName), publishedValue(text), failure);
}

Then('the {string} service reports {string} as {string}', { timeout: STEP_TIMEOUT_MS }, assertCharacteristicValue);

// The same assertion about one named system among several. The account-wide read above answers
// through the newest accessory, which is right while an account carries one device and cannot state
// a fact about one pump among two -- so no scenario could tell a per-device rule from an
// account-wide one, and every per-device rule in this feature went unobserved end to end. The
// accessory name is the vendor name the account carries, which is what a scenario already seeds and
// what an owner reads on the tile.
async function assertCharacteristicValueOn(
  this: BasementGuardianWorld,
  serviceName: string,
  accessoryName: string,
  characteristicName: string,
  text: string,
): Promise<void> {
  const homebridge = await this.homebridge();
  const failure = `the ${serviceName} service on ${accessoryName} never reported ${characteristicName} as ${text}`;

  await untilPublished(
    this,
    () => characteristicValue(serviceOnNamed(homebridge, accessoryName, serviceName), characteristicName),
    publishedValue(text),
    failure,
  );
}

Then('the {string} service on {string} reports {string} as {string}', { timeout: STEP_TIMEOUT_MS }, assertCharacteristicValueOn);

/** What a controller read of one characteristic met. */
type ReadOutcome = 'answered' | 'refused' | 'absent';

// How a step names each outcome when it reports the one it met. An absent characteristic and a
// refusing one are different diagnoses -- a service that never published the value, against one
// answering No Response -- and a message merging them sends the reader the wrong way.
const READ_OUTCOMES: Readonly<Record<ReadOutcome, string>> = {
  answered: 'answered a read',
  refused: 'refused a read',
  absent: 'carried no such characteristic',
};

// Which of the three a controller read of this characteristic meets. A characteristic made
// unreadable throws the status the plugin stored on it ahead of the value, which is what Apple Home
// draws as No Response, and reading the stored value alone cannot tell that apart from a value the
// service answered. A characteristic the service does not carry answers neither, and that is its own
// outcome rather than a shade of either: a step asserting an answer and a step asserting a refusal
// both fail on an absence, because a service that never published the characteristic is a scenario
// examining nothing (WR-06).
function readOutcome(service: FakeHapService | undefined, displayName: string): ReadOutcome {
  const characteristic = service?.characteristics.find((candidate) => candidate.displayName === displayName);

  if (characteristic === undefined) {
    return 'absent';
  }

  try {
    characteristic.handleGetRequest();
  } catch {
    return 'refused';
  }

  return 'answered';
}

// The wait's own message can only name the outcome the step wanted, because it is built before the
// first read. The deadline failure is restated here with the outcome the last read met, and carries
// the wait's error as its cause so nothing about the timing is lost.
async function untilReadOutcome(world: BasementGuardianWorld, serviceName: string, characteristicName: string, expected: ReadOutcome): Promise<void> {
  const homebridge = await world.homebridge();
  const read = (): ReadOutcome => readOutcome(serviceOf(homebridge, serviceName), characteristicName);
  const failure = `the ${serviceName} service never ${READ_OUTCOMES[expected]} for ${characteristicName}`;

  try {
    await world.untilTrue(() => read() === expected, PUBLISH_DEADLINE_MS, failure);
  } catch (thrown) {
    throw new Error(`${failure}: it ${READ_OUTCOMES[read()]}`, { cause: thrown });
  }
}

function assertNoReadAnswered(this: BasementGuardianWorld, serviceName: string, characteristicName: string): Promise<void> {
  return untilReadOutcome(this, serviceName, characteristicName, 'refused');
}

Then('the {string} service answers no read for {string}', { timeout: STEP_TIMEOUT_MS }, assertNoReadAnswered);

// The same assertion about a later moment, and the settle above it is the whole difference. The wait
// behind the step above reads its condition before its first delay, so a plain refusal step placed
// straight after a publish answers from the marking that was already in place and passes whether or
// not the message was ever delivered. This one lets the message arrive first, which is what makes a
// scenario able to see a refusal that a later value push undid (D-10).
async function assertNoReadStillAnswered(this: BasementGuardianWorld, serviceName: string, characteristicName: string): Promise<void> {
  await delay(DELIVERY_SETTLE_MS);
  await untilReadOutcome(this, serviceName, characteristicName, 'refused');
}

Then('the {string} service still answers no read for {string}', { timeout: STEP_TIMEOUT_MS }, assertNoReadStillAnswered);

function assertReadAnswered(this: BasementGuardianWorld, serviceName: string, characteristicName: string): Promise<void> {
  return untilReadOutcome(this, serviceName, characteristicName, 'answered');
}

Then('the {string} service answers a read for {string}', { timeout: STEP_TIMEOUT_MS }, assertReadAnswered);

function assertSensorActivated(this: BasementGuardianWorld, displayName: string): Promise<void> {
  return untilAlarmState(this, displayName, ALARM_ACTIVATED, `the ${displayName} sensor never activated`);
}

Then('the {string} sensor is activated', { timeout: STEP_TIMEOUT_MS }, assertSensorActivated);

function assertSensorNotActivated(this: BasementGuardianWorld, displayName: string): Promise<void> {
  return untilAlarmState(this, displayName, ALARM_QUIET, `the ${displayName} sensor never reported a quiet state`);
}

Then('the {string} sensor is not activated', { timeout: STEP_TIMEOUT_MS }, assertSensorNotActivated);
