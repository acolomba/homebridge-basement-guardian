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
const OTHER_HOMEBRIDGE = 'other fake homebridge api';
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

async function fakeAuth0Tenant(this: BasementGuardianWorld): Promise<void> {
  await this.auth0();
}

Given('the fake auth0 tenant', fakeAuth0Tenant);

async function armedGrantFailure(this: BasementGuardianWorld, status: number, error: string): Promise<void> {
  const tenant = await this.auth0();

  tenant.failWith(status, error);
}

Given('the tenant fails the next grant with status {int} and error {string}', armedGrantFailure);

async function fakeRestService(this: BasementGuardianWorld): Promise<void> {
  await this.restApi();
}

Given('the fake rest service', fakeRestService);

async function temporaryCredentials(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.setAwsCredentials(HARNESS_CREDENTIALS);
}

Given('the temporary credentials', temporaryCredentials);

async function armedRequestFailure(this: BasementGuardianWorld, status: number): Promise<void> {
  const service = await this.restApi();

  service.failNextWith(status);
}

Given('the service fails the next request with status {int}', armedRequestFailure);

async function recordAcceptedCommands(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.onCommandAccepted(() => {
    this.observations.push('accepted command');
  });
}

Given('the fake service records accepted commands', recordAcceptedCommands);

async function fakeShadowBroker(this: BasementGuardianWorld): Promise<void> {
  await this.broker();
}

Given('the fake shadow broker', fakeShadowBroker);

async function subscriberOnTopic(this: BasementGuardianWorld, topicName: string): Promise<void> {
  await this.subscribe(topicNamed(DEVICE_ID, topicName));
}

Given('a subscriber on the {word} topic', subscriberOnTopic);

async function fakeHomebridgeApi(this: BasementGuardianWorld): Promise<void> {
  await this.homebridge();
}

Given('the fake homebridge api', fakeHomebridgeApi);

Given('another fake homebridge api', async function (this: BasementGuardianWorld): Promise<void> {
  const other = await createFakeHomebridgeApi();

  this.onRelease(() => other.cleanup());
  this.remember(OTHER_HOMEBRIDGE, other);
});

async function listenerOnEachLifecycleEvent(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  homebridge.api.on('didFinishLaunching', () => {
    this.observations.push('launched');
  });

  homebridge.api.on('shutdown', () => {
    this.observations.push('shut down');
  });
}

Given('a listener on each lifecycle event', listenerOnEachLifecycleEvent);

async function requestIdentityToken(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  await record(this, `${tenant.origin}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(GRANT),
  });
}

When('the harness requests an identity token', requestIdentityToken);

async function requestExtraGrant(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  await record(this, `${tenant.origin}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...GRANT, client_secret: 'unexpected-credential', scope: 7 }),
  });
}

When('the harness requests an identity token with an extra credential and a numeric scope', requestExtraGrant);

async function requestUnknownTenantRoute(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  await record(this, `${tenant.origin}/unknown`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"unexpected":true}',
  });
}

When('the harness requests an unknown tenant route', requestUnknownTenantRoute);

async function sendMalformedGrant(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  await record(this, `${tenant.origin}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
}

When('the harness sends malformed grant json', sendMalformedGrant);

async function requestDeviceList(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/devices`, { headers: { authorization: AUTHORIZATION_HEADER } });
}

When('the harness requests the device list', requestDeviceList);

async function requestDeviceWithId(this: BasementGuardianWorld, deviceId: string): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/devices/${encodeURIComponent(deviceId)}`, {
    headers: { authorization: AUTHORIZATION_HEADER },
  });
}

When('the harness requests the device with id {string}', requestDeviceWithId);

async function requestTemporaryCredentials(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/credentials/aws`, { headers: { authorization: AUTHORIZATION_HEADER } });
}

When('the harness requests the temporary credentials', requestTemporaryCredentials);

async function sendMalformedCommand(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/devices/${DEVICE_ID}/data`, {
    method: 'PUT',
    headers: { authorization: AUTHORIZATION_HEADER, 'content-type': 'application/json' },
    body: '{',
  });
}

When('the harness sends malformed command json', sendMalformedCommand);

async function publishTheReportedPatch(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  broker.publishReported(DEVICE_ID, REPORTED_PATCH, SHADOW_VERSION);
}

When('the broker publishes the reported patch', publishTheReportedPatch);

async function publishTheFullShadow(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  broker.publishGetAccepted(DEVICE_ID, FULL_SHADOW, SHADOW_VERSION);
}

When('the broker publishes the full shadow document', publishTheFullShadow);

async function rejectTheShadowRequest(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  broker.publishGetRejected(DEVICE_ID, REJECTION_CODE);
}

When('the broker rejects the shadow request', rejectTheShadowRequest);

async function finishLaunching(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  await homebridge.emit('didFinishLaunching');
}

When('the api finishes launching', finishLaunching);

async function shutDown(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  await homebridge.emit('shutdown');
}

When('the api shuts down', shutDown);

function cancelTheSecondDueTimer(this: BasementGuardianWorld, kind: string): void {
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
}

When('the first due timer cancels the second due {word}', cancelTheSecondDueTimer);

When('scenario releases fail before another release runs', async function (this: BasementGuardianWorld): Promise<void> {
  this.onRelease(() => {
    this.observations.push('later release');
    return Promise.resolve();
  });
  this.onRelease(() => {
    this.observations.push('second failed release');
    return Promise.reject(new Error('second release failed'));
  });
  this.onRelease(() => {
    this.observations.push('first failed release');
    return Promise.reject(new Error('first release failed'));
  });

  try {
    await this.cleanUp();
    this.observations.push('no failure');
  } catch (error) {
    this.observations.push(error instanceof AggregateError ? error.errors.map(String).join(', ') : 'other failure');
  }
});

Then('the world reports both failures after running every release', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, [
    'first failed release',
    'second failed release',
    'later release',
    'Error: first release failed, Error: second release failed',
  ]);
});

When('startup fails after a scenario release is registered', async function (this: BasementGuardianWorld): Promise<void> {
  const scratch = new BasementGuardianWorld({ attach: this.attach, log: this.log, link: this.link, parameters: {} });

  scratch.homebridge = () => Promise.reject(new Error('startup failed'));
  scratch.onRelease(() => {
    this.observations.push('release ran');
    return Promise.resolve();
  });
  scratch.startPlugin();
  await scratch.awaitStart().catch(() => undefined);

  try {
    await scratch.cleanUp();
    this.observations.push('no failure');
  } catch (error) {
    this.observations.push(error instanceof AggregateError ? error.errors.map(String).join(', ') : 'other failure');
  }
});

Then('the world runs the release and reports the startup failure', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, ['release ran', 'Error: startup failed']);
});

async function assertTenantHoldsTheGrant(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepEqual(tenant.requests, [GRANT]);
}

Then('the tenant holds the grant the harness sent', assertTenantHoldsTheGrant);

async function assertExactGrant(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepStrictEqual(tenant.requests, [{ ...GRANT, client_secret: 'unexpected-credential', scope: 7 }]);
}

Then('the tenant holds the exact grant the harness sent', assertExactGrant);

async function assertUnknownRouteRecorded(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepStrictEqual(tenant.receivedRequests, [{ method: 'POST', path: '/unknown', body: '{"unexpected":true}' }]);
  assert.deepStrictEqual(tenant.requests, []);
}

Then('the tenant records the unknown route request', assertUnknownRouteRecorded);

async function assertMalformedGrantRecorded(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepStrictEqual(tenant.receivedRequests, [{ method: 'POST', path: '/oauth/token', body: '{' }]);
  assert.deepStrictEqual(tenant.requests, []);
}

Then('the tenant records the malformed grant request', assertMalformedGrantRecorded);

function assertOnlyFirstDueTimerRuns(this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, ['first']);
}

Then('only the first due timer runs', assertOnlyFirstDueTimerRuns);

function assertResponseStatus(this: BasementGuardianWorld, status: number): void {
  assert.equal(this.response().status, status);
}

Then('the response carries status {int}', assertResponseStatus);

function assertNoAcceptedCommand(this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, []);
}

Then('the fake service records no accepted command', assertNoAcceptedCommand);

async function assertNoUnhandledRejection(this: BasementGuardianWorld): Promise<void> {
  await nextTurn();
  assert.deepStrictEqual(this.rejections, []);
}

Then('the harness observes no unhandled rejection', assertNoUnhandledRejection);

function assertResponseError(this: BasementGuardianWorld, error: string): void {
  assert.deepStrictEqual(this.response().body, {
    error,
    error_description: 'the scenario armed this failure',
  });
}

Then('the response contains only the error {string} and its description', assertResponseError);

function assertDeviceListHoldsTheDevices(this: BasementGuardianWorld): void {
  const wireDevices = field(this.response().body, 'devices');

  if (!isUnknownArray(wireDevices)) {
    assert.fail('the device list answer carries no devices array');
  }

  assert.deepEqual(
    wireDevices.map((wireDevice) => wireIdentity(wireDevice)),
    this.devices.map((device) => ({ deviceId: device.deviceId, name: device.name, serialNumber: device.serialNumber })),
  );
}

Then('the device list holds the devices the scenario sets', assertDeviceListHoldsTheDevices);

function assertDeviceAnswerHoldsTheDevice(this: BasementGuardianWorld, deviceId: string): void {
  const device = this.devices.find((candidate) => candidate.deviceId === deviceId);

  if (device === undefined) {
    assert.fail(`the scenario has no device with id ${deviceId}`);
  }

  assert.deepStrictEqual(wireIdentity(field(this.response().body, 'device')), {
    deviceId: device.deviceId,
    name: device.name,
    serialNumber: device.serialNumber,
  });
}

Then('the device answer holds the device with id {string}', assertDeviceAnswerHoldsTheDevice);

async function assertRequestCarriesTheAuthorizationHeader(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  assert.equal(service.requests.at(-1)?.authorization, AUTHORIZATION_HEADER);
}

Then('the recorded request carries the authorization header', assertRequestCarriesTheAuthorizationHeader);

function assertCredentialsResponseCarriesTheConnectionFacts(this: BasementGuardianWorld): void {
  assert.deepEqual(this.response().body, HARNESS_CREDENTIALS);
}

Then('the credentials response carries the endpoint and the client identifier', assertCredentialsResponseCarriesTheConnectionFacts);

async function assertSubscriberReceivesTheReportedPatch(this: BasementGuardianWorld): Promise<void> {
  assert.deepEqual(await receivedDocument(this, 'update-accepted'), { state: { reported: REPORTED_PATCH }, version: SHADOW_VERSION });
}

Then('the subscriber receives the reported patch', assertSubscriberReceivesTheReportedPatch);

async function assertSubscriberReceivesTheFullShadow(this: BasementGuardianWorld): Promise<void> {
  assert.deepEqual(await receivedDocument(this, 'get-accepted'), { state: FULL_SHADOW, version: SHADOW_VERSION });
}

Then('the subscriber receives the full shadow document', assertSubscriberReceivesTheFullShadow);

async function assertSubscriberReceivesTheRejection(this: BasementGuardianWorld): Promise<void> {
  assert.deepStrictEqual(await receivedDocument(this, 'get-rejected'), {
    code: REJECTION_CODE,
    message: 'the scenario rejected the shadow request',
  });
}

Then('the subscriber receives the rejection', assertSubscriberReceivesTheRejection);

async function assertBrokerHoldsTheHandshake(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  assert.equal(broker.handshakes.length, 1);
  assert.deepEqual(broker.clientIds, [SUBSCRIBER_CLIENT_ID]);
}

Then('the broker holds the handshake of the subscriber', assertBrokerHoldsTheHandshake);

async function assertSubscriberObservesTheClose(this: BasementGuardianWorld): Promise<void> {
  await this.awaitSubscriberClose(MESSAGE_DEADLINE_MS);
}

Then('the subscriber observes the close', assertSubscriberObservesTheClose);

async function assertNoCurrentSubscriptions(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  await this.untilTrue(() => broker.currentSubscriptions().length === 0, MESSAGE_DEADLINE_MS, 'the broker kept a closed connection subscription');
  assert.deepStrictEqual(broker.currentSubscriptions(), []);
}

Then('the broker holds no current subscriptions', assertNoCurrentSubscriptions);

Then('the world observes that the plugin "launched"', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, ['launched']);
});

Then('the world observes that the plugin "shut down"', function (this: BasementGuardianWorld): void {
  assert.deepStrictEqual(this.observations, ['launched', 'shut down']);
});

async function assertStoragePathIsAnEmptyDirectory(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();
  const other = this.recall(OTHER_HOMEBRIDGE) as FakeHomebridgeApi;

  assert.equal(homebridge.api.user.storagePath(), homebridge.storagePath);
  assert.equal(other.api.user.storagePath(), other.storagePath);
  assert.equal(dirname(homebridge.storagePath), tmpdir());
  assert.equal(dirname(other.storagePath), tmpdir());
  assert.notEqual(homebridge.storagePath, other.storagePath);
  assert.deepEqual(await readdir(homebridge.storagePath), []);
  assert.deepEqual(await readdir(other.storagePath), []);
}

Then('the storage path is an empty directory the scenario owns', assertStoragePathIsAnEmptyDirectory);

async function assertApiExposesTheHapNamespace(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  assert.strictEqual(homebridge.api.hap, homebridge.hap);
}

Then('the api exposes the hap namespace', assertApiExposesTheHapNamespace);

async function assertAccessoryCarriesTheIdentity(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();
  const accessory = new homebridge.api.platformAccessory(ACCESSORY_NAME, ACCESSORY_UUID);

  assert.equal(accessory.displayName, ACCESSORY_NAME);
  assert.equal(accessory.UUID, ACCESSORY_UUID);
}

Then('the accessory carries the identity the plugin gives it', assertAccessoryCarriesTheIdentity);
