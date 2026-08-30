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

import type { FakeHapService, FakeServiceClass } from '../fakeHap.js';
import type { FakeAccessory, FakeHomebridgeApi } from '../fakeHomebridgeApi.js';
import type { BasementGuardianWorld } from '../world.js';
import type { API } from 'homebridge';

// A published value appears only once a poll has applied the vendor state a step just set, so every
// read carries a deadline that turns a poll which never ran into a named failure.
const PUBLISH_DEADLINE_MS = 2000;
const STEP_TIMEOUT_MS = 15_000;

// `CONTACT_NOT_DETECTED` is the activated state for every "is something wrong" sensor, so an Apple
// Home tile reads "Open" when there is something to act on.
const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;

const CONTACT_SENSOR_STATE = 'Contact Sensor State';

// Every scenario here seeds exactly one physical device, so a step reads state back through the one
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

function characteristicValue(service: FakeHapService | undefined, displayName: string): unknown {
  return service?.characteristics.find((candidate) => candidate.displayName === displayName)?.value;
}

// A scenario states a published boolean as the value the vendor would have sent, so it reads `true`
// rather than the text of it.
function booleanValue(text: string): boolean {
  if (text !== 'true' && text !== 'false') {
    throw new Error(`a scenario states a published boolean as "true" or "false", not ${text}`);
  }

  return text === 'true';
}

function untilPublished(world: BasementGuardianWorld, read: () => unknown, expected: unknown, failure: string): Promise<void> {
  return world.untilTrue(() => read() === expected, PUBLISH_DEADLINE_MS, failure);
}

async function untilContactState(world: BasementGuardianWorld, displayName: string, state: number, failure: string): Promise<void> {
  const homebridge = await world.homebridge();

  await untilPublished(world, () => characteristicValue(serviceOf(homebridge, displayName), CONTACT_SENSOR_STATE), state, failure);
}

async function assertServicePublished(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  await this.untilTrue(() => serviceOf(homebridge, displayName) !== undefined, PUBLISH_DEADLINE_MS, `the plugin never published the ${displayName} service`);
}

Then('the plugin publishes the {string} service', { timeout: STEP_TIMEOUT_MS }, assertServicePublished);

async function assertServiceNotPublished(this: BasementGuardianWorld, displayName: string): Promise<void> {
  const homebridge = await this.homebridge();

  assert.equal(serviceOf(homebridge, displayName), undefined);
}

Then('the plugin publishes no {string} service', assertServiceNotPublished);

async function assertCharacteristicValue(this: BasementGuardianWorld, serviceName: string, characteristicName: string, text: string): Promise<void> {
  const homebridge = await this.homebridge();
  const failure = `the ${serviceName} service never reported ${characteristicName} as ${text}`;

  await untilPublished(this, () => characteristicValue(serviceOf(homebridge, serviceName), characteristicName), booleanValue(text), failure);
}

Then('the {string} service reports {string} as {string}', { timeout: STEP_TIMEOUT_MS }, assertCharacteristicValue);

function assertSensorActivated(this: BasementGuardianWorld, displayName: string): Promise<void> {
  return untilContactState(this, displayName, CONTACT_NOT_DETECTED, `the ${displayName} sensor never activated`);
}

Then('the {string} sensor is activated', { timeout: STEP_TIMEOUT_MS }, assertSensorActivated);

function assertSensorNotActivated(this: BasementGuardianWorld, displayName: string): Promise<void> {
  return untilContactState(this, displayName, CONTACT_DETECTED, `the ${displayName} sensor never reported a quiet state`);
}

Then('the {string} sensor is not activated', { timeout: STEP_TIMEOUT_MS }, assertSensorNotActivated);
