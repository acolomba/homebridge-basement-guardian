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

import { Then } from '@cucumber/cucumber';

import { createServiceCatalogue } from '../../../src/accessories/serviceCatalogue.js';
import { currentAccessory, pushedValue, serviceOf } from '../publishedServices.js';

import type { FakeHapService, FakeServiceClass } from '../fakeHap.js';
import type { FakeHomebridgeApi } from '../fakeHomebridgeApi.js';
import type { BasementGuardianWorld } from '../world.js';
import type { API } from 'homebridge';

// A published value appears only once a poll has applied the vendor state a step just set, so every
// read carries a deadline that turns a poll which never ran into a named failure.
const PUBLISH_DEADLINE_MS = 2000;
const STEP_TIMEOUT_MS = 15_000;

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

function assertSensorActivated(this: BasementGuardianWorld, displayName: string): Promise<void> {
  return untilAlarmState(this, displayName, ALARM_ACTIVATED, `the ${displayName} sensor never activated`);
}

Then('the {string} sensor is activated', { timeout: STEP_TIMEOUT_MS }, assertSensorActivated);

function assertSensorNotActivated(this: BasementGuardianWorld, displayName: string): Promise<void> {
  return untilAlarmState(this, displayName, ALARM_QUIET, `the ${displayName} sensor never reported a quiet state`);
}

Then('the {string} sensor is not activated', { timeout: STEP_TIMEOUT_MS }, assertSensorNotActivated);
