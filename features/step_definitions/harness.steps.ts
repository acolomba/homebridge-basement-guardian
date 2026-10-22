// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Steps that check the local harness stand-ins.
 *
 * They check the fake Auth0, REST, broker, timer, and Homebridge contracts used by the offline
 * plugin scenarios.
 */

import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname } from 'node:path';
import { setImmediate as nextTurn } from 'node:timers/promises';

import { Given, Then, When } from '@cucumber/cucumber';

import { createFakeHomebridgeApi } from '../lib/homebridgeApi.js';
import { shadowTopic } from '../lib/shadowBroker.js';
import { createFakeTimers } from '../lib/timers.js';
import { BasementGuardianWorld, SUBSCRIBER_CLIENT_ID } from '../support/world.js';

import type { FakeHomebridgeApi } from '../lib/homebridgeApi.js';
import type { ShadowTopicLeaf } from '../lib/shadowBroker.js';
import type { AwsCredentialsResponse } from '../lib/vendorRestApi.js';

const REQUEST_DEADLINE_MS = 2000;
const AUTHORIZATION_HEADER = 'Bearer fake-id-token';

// A wrong bridge makes the broker go silent rather than fail, so the deadline is what turns that
// silence into a named failure.
const MESSAGE_DEADLINE_MS = 2000;

const DEVICE_ID = 'placeholder-gemini';
const ACCESSORY_NAME = 'Sump Guardian';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';
const SHADOW_VERSION = 7;
const OTHER_HOMEBRIDGE_STORAGE_PATH = 'other fake homebridge storage path';
const REJECTION_CODE = 404;
const REPORTED_PATCH = { water_level: 1, serial_communications: true };

const FULL_SHADOW = { reported: { data: { water_level: 1 }, state: { offline: false } } };

const GRANT = {
  grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
  realm: 'fake-realm',
  client_id: 'fake-client-id',
  username: 'harness@example.test',
  password: 'placeholder-password',
  scope: 'openid profile email',
};

const HARNESS_CREDENTIALS: AwsCredentialsResponse = {
  endpoint: 'fake-shadow-endpoint',
  clientId: 'fake-shadow-client-id',
  credentials: {
    AccessKeyId: 'fake-access-key-id',
    SecretAccessKey: 'fake-secret-access-key',
    SessionToken: 'fake-session-token',
    Expiration: '2000-01-01T00:00:00.000Z',
  },
};

class StartupFailingWorld extends BasementGuardianWorld {
  override async homebridge(): Promise<FakeHomebridgeApi> {
    await nextTurn();
    this.onRelease(() => {
      this.observations.push('startup release ran');
      return Promise.resolve();
    });

    throw new Error('startup failed');
  }
}

const TOPIC_LEAVES = new Map<string, ShadowTopicLeaf>([
  ['update-accepted', 'update/accepted'],
  ['get-accepted', 'get/accepted'],
  ['get-rejected', 'get/rejected'],
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function field(document: unknown, name: string): unknown {
  return isRecord(document) ? document[name] : undefined;
}

// The service answers the vendor's wire shape, so a record carries its serial number under
// `attributes` rather than at the top level.
function wireIdentity(wireDevice: unknown): Record<string, unknown> {
  return {
    deviceId: field(wireDevice, 'deviceId'),
    name: field(wireDevice, 'name'),
    serialNumber: field(field(wireDevice, 'attributes'), 'serialNumber'),
  };
}

// The device is a parameter rather than a closure over the module constant, so a caller states
// which system its topic is about instead of inheriting one silently.
function topicNamed(deviceId: string, name: string): string {
  const leaf = TOPIC_LEAVES.get(name);

  if (leaf === undefined) {
    throw new Error(`the harness knows no ${name} topic`);
  }

  return shadowTopic(deviceId, leaf);
}

async function record(world: BasementGuardianWorld, url: string, init: RequestInit = {}): Promise<void> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_DEADLINE_MS) });
  const body: unknown = await response.json();

  world.recordResponse(response.status, body);
}

async function receivedDocument(world: BasementGuardianWorld, topicName: string): Promise<unknown> {
  const payload = await world.nextMessage(topicNamed(DEVICE_ID, topicName), MESSAGE_DEADLINE_MS);
  const document: unknown = JSON.parse(payload);

  return document;
}

Given('the fake auth0 tenant', async function (this: BasementGuardianWorld): Promise<void> {
  await this.auth0();
});

Given(
  'the tenant fails the next grant with status {int} and error {string}',
  async function (this: BasementGuardianWorld, status: number, error: string): Promise<void> {
    const tenant = await this.auth0();

    tenant.failWith(status, error);
  },
);

Given('the fake rest service', async function (this: BasementGuardianWorld): Promise<void> {
  await this.restApi();
});

Given('the temporary credentials', async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.setAwsCredentials(HARNESS_CREDENTIALS);
});

Given('the service fails the next request with status {int}', async function (this: BasementGuardianWorld, status: number): Promise<void> {
  const service = await this.restApi();

  service.failNextWith(status);
});

Given('the fake service records accepted commands', async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.onCommandAccepted(() => {
    this.observations.push('accepted command');
  });
});

Given('the fake shadow broker', async function (this: BasementGuardianWorld): Promise<void> {
  await this.broker();
});

Given('a subscriber on the {word} topic', async function (this: BasementGuardianWorld, topicName: string): Promise<void> {
  await this.subscribe(topicNamed(DEVICE_ID, topicName));
});

Given('the fake homebridge api', async function (this: BasementGuardianWorld): Promise<void> {
  await this.homebridge();
});

Given('another fake homebridge api', async function (this: BasementGuardianWorld): Promise<void> {
  const other = await createFakeHomebridgeApi();

  this.onRelease(() => other.cleanup());
  assert.equal(other.api.user.storagePath(), other.storagePath);
  this.remember(OTHER_HOMEBRIDGE_STORAGE_PATH, other.storagePath);
});

Given('a listener on each lifecycle event', async function (this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  homebridge.api.on('didFinishLaunching', () => {
    this.observations.push('launched');
  });

  homebridge.api.on('shutdown', () => {
    this.observations.push('shut down');
  });
});

When('the harness requests an identity token', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  await record(this, `${tenant.origin}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(GRANT),
  });
});

When('the harness requests an identity token with an extra credential and a numeric scope', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  await record(this, `${tenant.origin}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...GRANT, client_secret: 'unexpected-credential', scope: 7 }),
  });
});

When('the harness requests an unknown tenant route', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  await record(this, `${tenant.origin}/unknown`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"unexpected":true}',
  });
});

When('the harness sends malformed grant json', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  await record(this, `${tenant.origin}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
});

When('the harness requests the device list', async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/devices`, { headers: { authorization: AUTHORIZATION_HEADER } });
});

When('the harness requests the device with id {string}', async function (this: BasementGuardianWorld, deviceId: string): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/devices/${encodeURIComponent(deviceId)}`, {
    headers: { authorization: AUTHORIZATION_HEADER },
  });
});

When('the harness requests the temporary credentials', async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/credentials/aws`, { headers: { authorization: AUTHORIZATION_HEADER } });
});

When('the harness sends malformed command json', async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/devices/${DEVICE_ID}/data`, {
    method: 'PUT',
    headers: { authorization: AUTHORIZATION_HEADER, 'content-type': 'application/json' },
    body: '{',
  });
});

When('the broker publishes the reported patch', async function (this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  broker.publishReported(DEVICE_ID, REPORTED_PATCH, SHADOW_VERSION);
});

When('the broker publishes the full shadow document', async function (this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  broker.publishGetAccepted(DEVICE_ID, FULL_SHADOW, SHADOW_VERSION);
});

When('the broker rejects the shadow request', async function (this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  broker.publishGetRejected(DEVICE_ID, REJECTION_CODE);
});

When('the api finishes launching', async function (this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  await homebridge.emit('didFinishLaunching');
});

When('the api shuts down', async function (this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  await homebridge.emit('shutdown');
});

When('the first due timer cancels the second due {word}', function (this: BasementGuardianWorld, kind: string): void {
  if (kind !== 'timeout' && kind !== 'interval') {
    throw new Error(`unknown due timer kind: ${kind}`);
  }

  let now = 0;
  const timers = createFakeTimers({ now: () => now });
  const runSecond = (): void => {
    this.observations.push('second');
  };

  const second = kind === 'interval' ? timers.setInterval(runSecond, 2) : timers.setTimeout(runSecond, 2);

  timers.setTimeout(() => {
    this.observations.push('first');
    if (kind === 'interval') {
      timers.clearInterval(second);
    } else {
      timers.clearTimeout(second);
    }
  }, 1);

  now = 2;
  timers.runDue();
  timers.runDue();
  now = 4;
  timers.runDue();
});

When('scenario releases fail before another release runs', async function (this: BasementGuardianWorld): Promise<void> {
  const scratch = new BasementGuardianWorld({ attach: this.attach, log: this.log, link: this.link, parameters: {} });

  scratch.onRelease(() => {
    this.observations.push('later release');
    return Promise.resolve();
  });
  scratch.onRelease(() => {
    this.observations.push('second failed release');
    return Promise.reject(new Error('second release failed'));
  });
  scratch.onRelease(() => {
    this.observations.push('first failed release');
    return Promise.reject(new Error('first release failed'));
  });

  try {
    await scratch.cleanUp();
    this.observations.push('no failure');
  } catch (error) {
    this.observations.push(error instanceof AggregateError ? error.errors.map(String).join(', ') : 'other failure');
  }
});

When('startup fails after a scenario release is registered', async function (this: BasementGuardianWorld): Promise<void> {
  const scratch = new StartupFailingWorld({ attach: this.attach, log: this.log, link: this.link, parameters: {} });
  scratch.onRelease(() => {
    scratch.observations.push('release ran');
    return Promise.resolve();
  });
  scratch.startPlugin();

  try {
    await scratch.cleanUp();
    scratch.observations.push('no failure');
  } catch (error) {
    scratch.observations.push(error instanceof AggregateError ? error.errors.map(String).join(', ') : 'other failure');
  }

  this.observations.push(...scratch.observations);
});

Then('the world reports both failures after running every release', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, [
    'first failed release',
    'second failed release',
    'later release',
    'Error: first release failed, Error: second release failed',
  ]);
});

Then('the world runs the release and reports the startup failure', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, ['startup release ran', 'release ran', 'Error: startup failed']);
});

Then('the tenant holds the grant the harness sent', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepEqual(tenant.requests, [GRANT]);
});

Then('the tenant holds the exact grant the harness sent', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepStrictEqual(tenant.requests, [{ ...GRANT, client_secret: 'unexpected-credential', scope: 7 }]);
});

Then('the tenant records the unknown route request', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepStrictEqual(tenant.receivedRequests, [{ method: 'POST', path: '/unknown', body: '{"unexpected":true}' }]);
  assert.deepStrictEqual(tenant.requests, []);
});

Then('the tenant records the malformed grant request', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepStrictEqual(tenant.receivedRequests, [{ method: 'POST', path: '/oauth/token', body: '{' }]);
  assert.deepStrictEqual(tenant.requests, []);
});

Then('only the first due timer runs', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, ['first']);
});

Then('the response carries status {int}', function (this: BasementGuardianWorld, status: number): void {
  assert.equal(this.response().status, status);
});

Then('the response carries the issued identity token', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.response().body, { id_token: 'fake-id-token', expires_in: 2592000, token_type: 'Bearer' });
});

Then('the fake service records no accepted command', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, []);
});

Then('the harness observes no unhandled rejection', async function (this: BasementGuardianWorld): Promise<void> {
  await nextTurn();
  assert.deepStrictEqual(this.rejections, []);
});

Then('the response contains only the error {string} and its description', function (this: BasementGuardianWorld, error: string): void {
  assert.deepStrictEqual(this.response().body, {
    error,
    error_description: 'the scenario armed this failure',
  });
});

Then('the device list holds the devices the scenario sets', function (this: BasementGuardianWorld): void {
  const wireDevices = field(this.response().body, 'devices');

  if (!isUnknownArray(wireDevices)) {
    assert.fail('the device list answer carries no devices array');
  }

  assert.deepEqual(
    wireDevices.map((wireDevice) => wireIdentity(wireDevice)),
    this.devices.map((device) => ({ deviceId: device.deviceId, name: device.name, serialNumber: device.serialNumber })),
  );
});

Then('the device answer holds the device with id {string}', function (this: BasementGuardianWorld, deviceId: string): void {
  const device = this.devices.find((candidate) => candidate.deviceId === deviceId);

  if (device === undefined) {
    assert.fail(`the scenario has no device with id ${deviceId}`);
  }

  assert.deepStrictEqual(wireIdentity(field(this.response().body, 'device')), {
    deviceId: device.deviceId,
    name: device.name,
    serialNumber: device.serialNumber,
  });
});

Then('the service records only the authorized device-list request', async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  assert.deepStrictEqual(service.requests, [{ method: 'GET', path: '/devices', authorization: AUTHORIZATION_HEADER, body: '' }]);
});

Then('the credentials response carries the endpoint, client identifier, and temporary AWS credentials', function (this: BasementGuardianWorld): void {
  assert.deepEqual(this.response().body, HARNESS_CREDENTIALS);
});

Then('the subscriber receives the reported patch', async function (this: BasementGuardianWorld): Promise<void> {
  assert.deepEqual(await receivedDocument(this, 'update-accepted'), { state: { reported: REPORTED_PATCH }, version: SHADOW_VERSION });
});

Then('the subscriber receives the full shadow document', async function (this: BasementGuardianWorld): Promise<void> {
  assert.deepEqual(await receivedDocument(this, 'get-accepted'), { state: FULL_SHADOW, version: SHADOW_VERSION });
});

Then('the subscriber receives the rejection', async function (this: BasementGuardianWorld): Promise<void> {
  assert.deepStrictEqual(await receivedDocument(this, 'get-rejected'), {
    code: REJECTION_CODE,
    message: 'the scenario rejected the shadow request',
  });
});

Then('the broker holds the handshake of the subscriber', async function (this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  assert.equal(broker.handshakes.length, 1);
  assert.deepEqual(broker.clientIds, [SUBSCRIBER_CLIENT_ID]);
});

Then('the subscriber observes the close', async function (this: BasementGuardianWorld): Promise<void> {
  await this.awaitSubscriberClose(MESSAGE_DEADLINE_MS);
});

Then('the broker holds no current subscriptions', async function (this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  await this.untilTrue(() => broker.currentSubscriptions().length === 0, MESSAGE_DEADLINE_MS, 'the broker kept a closed connection subscription');
  assert.deepStrictEqual(broker.currentSubscriptions(), []);
});

Then('the world observes that the plugin "launched"', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, ['launched']);
});

Then('the world observes that the plugin "shut down"', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, ['launched', 'shut down']);
});

Then('the storage path is an empty directory the scenario owns', async function (this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();
  const otherStoragePath = this.recall(OTHER_HOMEBRIDGE_STORAGE_PATH);

  if (typeof otherStoragePath !== 'string') {
    assert.fail('the other fake homebridge storage path is missing');
  }

  assert.equal(homebridge.api.user.storagePath(), homebridge.storagePath);
  assert.equal(dirname(homebridge.storagePath), tmpdir());
  assert.equal(dirname(otherStoragePath), tmpdir());
  assert.notEqual(homebridge.storagePath, otherStoragePath);
  assert.deepEqual(await readdir(homebridge.storagePath), []);
  assert.deepEqual(await readdir(otherStoragePath), []);
});

Then('the api exposes the hap namespace', async function (this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  assert.strictEqual(homebridge.api.hap, homebridge.hap);
});

Then('the accessory carries the identity the plugin gives it', async function (this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();
  const accessory = new homebridge.api.platformAccessory(ACCESSORY_NAME, ACCESSORY_UUID);

  assert.equal(accessory.displayName, ACCESSORY_NAME);
  assert.equal(accessory.UUID, ACCESSORY_UUID);
});
