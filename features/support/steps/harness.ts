/**
 * @fileoverview Steps that drive the harness fakes directly.
 *
 * These steps exercise the stand-ins themselves rather than the plugin, because the seam that
 * points the plugin at a fake cloud arrives with the account runtime. Proving the harness on its
 * own is what makes it usable as a regression guard for the scenarios that follow.
 */

import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';

import { Given, Then, When } from '@cucumber/cucumber';

import { shadowTopic } from '../fakeShadowBroker.js';
import { SUBSCRIBER_CLIENT_ID } from '../world.js';

import type { FakeAuth0TokenRequest } from '../fakeAuth0.js';
import type { ApiDevice, AwsCredentialsResponse } from '../fakeRestApi.js';
import type { ShadowTopicLeaf } from '../fakeShadowBroker.js';
import type { BasementGuardianWorld } from '../world.js';
import type { DataTable } from '@cucumber/cucumber';

const REQUEST_DEADLINE_MS = 2000;
const AUTHORIZATION_HEADER = 'Bearer fake-id-token';

// A wrong bridge makes the broker go silent rather than fail, so the deadline is what turns that
// silence into a named failure.
const MESSAGE_DEADLINE_MS = 2000;

const DEVICE_ID = 'placeholder-gemini';
const ACCESSORY_NAME = 'Sump Guardian';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';
const SHADOW_VERSION = 7;
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

const RECORDED_GRANT: FakeAuth0TokenRequest = {
  grantType: GRANT.grant_type,
  realm: GRANT.realm,
  clientId: GRANT.client_id,
  username: GRANT.username,
  password: GRANT.password,
  scope: GRANT.scope,
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

function topicNamed(name: string): string {
  const leaf = TOPIC_LEAVES.get(name);

  if (leaf === undefined) {
    throw new Error(`the harness knows no ${name} topic`);
  }

  return shadowTopic(DEVICE_ID, leaf);
}

function toDevice(row: Record<string, string>): ApiDevice {
  return {
    deviceId: row.deviceId ?? '',
    deviceTypeId: 'wayneWaterGemini',
    name: row.name ?? '',
    serialNumber: 'placeholder-serial-number',
    connectivity: { connected: true, timestamp: 0 },
    data: {},
  };
}

async function record(world: BasementGuardianWorld, url: string, init: RequestInit = {}): Promise<void> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_DEADLINE_MS) });
  const body: unknown = await response.json();

  world.recordResponse(response.status, body);
}

async function receivedDocument(world: BasementGuardianWorld, topicName: string): Promise<unknown> {
  const payload = await world.nextMessage(topicNamed(topicName), MESSAGE_DEADLINE_MS);
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

async function devices(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  const service = await this.restApi();

  this.devices = table.hashes().map((row) => toDevice(row));
  service.setDevices(this.devices);
}

Given('these devices:', devices);

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

async function fakeShadowBroker(this: BasementGuardianWorld): Promise<void> {
  await this.broker();
}

Given('the fake shadow broker', fakeShadowBroker);

async function subscriberOnTopic(this: BasementGuardianWorld, topicName: string): Promise<void> {
  await this.subscribe(topicNamed(topicName));
}

Given('a subscriber on the {word} topic', subscriberOnTopic);

async function fakeHomebridgeApi(this: BasementGuardianWorld): Promise<void> {
  await this.homebridge();
}

Given('the fake homebridge api', fakeHomebridgeApi);

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

async function requestDeviceList(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/devices`, { headers: { authorization: AUTHORIZATION_HEADER } });
}

When('the harness requests the device list', requestDeviceList);

async function requestTemporaryCredentials(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  await record(this, `${service.baseUrl}/credentials/aws`, { headers: { authorization: AUTHORIZATION_HEADER } });
}

When('the harness requests the temporary credentials', requestTemporaryCredentials);

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

async function closeEveryConnection(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  broker.disconnectAll();
}

When('the broker closes every connection', closeEveryConnection);

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

async function assertTenantHoldsTheGrant(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepEqual(tenant.requests, [RECORDED_GRANT]);
}

Then('the tenant holds the grant the harness sent', assertTenantHoldsTheGrant);

function assertResponseStatus(this: BasementGuardianWorld, status: number): void {
  assert.equal(this.response().status, status);
}

Then('the response carries status {int}', assertResponseStatus);

function assertResponseError(this: BasementGuardianWorld, error: string): void {
  assert.equal(field(this.response().body, 'error'), error);
}

Then('the response carries the error {string}', assertResponseError);

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
  assert.equal(field(await receivedDocument(this, 'get-rejected'), 'code'), REJECTION_CODE);
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

function assertObservations(this: BasementGuardianWorld, observation: string): void {
  assert.equal(this.observations.at(-1), observation);
}

Then('the world observes that the plugin {string}', assertObservations);

async function assertStoragePathIsAnEmptyDirectory(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  assert.equal(homebridge.api.user.storagePath(), homebridge.storagePath);
  assert.deepEqual(await readdir(homebridge.storagePath), []);
}

Then('the storage path is an empty directory the scenario owns', assertStoragePathIsAnEmptyDirectory);

async function assertApiExposesTheHapNamespace(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  assert.equal(typeof homebridge.api.hap, 'object');
}

Then('the api exposes the hap namespace', assertApiExposesTheHapNamespace);

async function assertAccessoryCarriesTheIdentity(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();
  const accessory = new homebridge.api.platformAccessory(ACCESSORY_NAME, ACCESSORY_UUID);

  assert.equal(accessory.displayName, ACCESSORY_NAME);
  assert.equal(accessory.UUID, ACCESSORY_UUID);
}

Then('the accessory carries the identity the plugin gives it', assertAccessoryCarriesTheIdentity);
