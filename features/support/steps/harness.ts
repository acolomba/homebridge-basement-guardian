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

import { HALO_DEVICE_TYPE_ID, HALO_DISPLAY_NAME } from '../../../src/device/halo.js';
import { shadowTopic } from '../fakeShadowBroker.js';
import { SUBSCRIBER_CLIENT_ID } from '../world.js';

import type { FakeAuth0TokenRequest } from '../fakeAuth0.js';
import type { FakeAccessory, FakeHomebridgeApi } from '../fakeHomebridgeApi.js';
import type { ApiDevice, AwsCredentialsResponse } from '../fakeRestApi.js';
import type { ShadowTopicLeaf } from '../fakeShadowBroker.js';
import type { BasementGuardianWorld } from '../world.js';
import type { DataTable } from '@cucumber/cucumber';

const REQUEST_DEADLINE_MS = 2000;
const AUTHORIZATION_HEADER = 'Bearer fake-id-token';

// A wrong bridge makes the broker go silent rather than fail, so the deadline is what turns that
// silence into a named failure.
const MESSAGE_DEADLINE_MS = 2000;

// A discovery scenario that changes device data mid-scenario waits for the accessory's stored
// state to reach the value a later step just reported, so the deadline is what turns a poll that
// never picked up the change into a named failure rather than a false pass.
const DISCOVERY_CHANGE_DEADLINE_MS = 2000;

const DEVICE_ID = 'placeholder-gemini';
const ACCESSORY_NAME = 'Sump Guardian';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';
const SHADOW_VERSION = 7;
const REJECTION_CODE = 404;
const REPORTED_PATCH = { water_level: 1, serial_communications: true };

const DEFAULT_DEVICE_TYPE_ID = 'wayneWaterGemini';

// A full, legal Gemini telemetry payload, so a scenario's device validates without stating all 16
// required fields itself. `toDevice` uses this only for the default `wayneWaterGemini` type; a
// scenario naming a different `deviceTypeId` gets no telemetry, because Gemini's fields carry no
// meaning for another family.
const VALID_GEMINI_TELEMETRY: Readonly<Record<string, unknown>> = {
  water_level: 1,
  primary_pump_running: false,
  primary_pump_fault: false,
  backup_pump_running: false,
  backup_pump_fault: false,
  backup_pump_fuse_blown: false,
  ac_power: true,
  battery_charging: false,
  battery_voltage_low: false,
  battery_health: 8,
  hours_of_protection: 8,
  water_sensor_fault: false,
  serial_communications: true,
  alarm_audio_muted: false,
  test_running: false,
  offline: false,
};
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

// The scenarios that change device data after the plugin starts read state
// back through the one accessory the harness ever registers, rather than a
// deviceId lookup, because every discovery scenario in this feature seeds
// exactly one physical device.
function currentAccessory(homebridge: FakeHomebridgeApi): FakeAccessory | undefined {
  return homebridge.registerPlatformAccessoryCalls[0]?.accessories[0];
}

function topicNamed(name: string): string {
  const leaf = TOPIC_LEAVES.get(name);

  if (leaf === undefined) {
    throw new Error(`the harness knows no ${name} topic`);
  }

  return shadowTopic(DEVICE_ID, leaf);
}

// `waterLevel` is an optional column, following the same model `deviceTypeId`
// established: a scenario naming it overrides the one otherwise-valid
// telemetry field, which is what lets a scenario seed an out-of-domain
// `water_level` (DEV-08) without restating the other 15 required fields.
function withWaterLevelOverride(telemetry: Readonly<Record<string, unknown>>, row: Record<string, string>): Readonly<Record<string, unknown>> {
  return row.waterLevel === undefined ? telemetry : { ...telemetry, water_level: Number(row.waterLevel) };
}

function toDevice(row: Record<string, string>): ApiDevice {
  const deviceTypeId = row.deviceTypeId ?? DEFAULT_DEVICE_TYPE_ID;
  const telemetry = deviceTypeId === DEFAULT_DEVICE_TYPE_ID ? VALID_GEMINI_TELEMETRY : {};

  return {
    deviceId: row.deviceId ?? '',
    deviceTypeId,
    name: row.name ?? '',
    serialNumber: 'placeholder-serial-number',
    connectivity: { connected: true, timestamp: 0 },
    data: withWaterLevelOverride(telemetry, row),
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

async function applyDevicesFromTable(world: BasementGuardianWorld, table: DataTable): Promise<void> {
  const service = await world.restApi();

  world.devices = table.hashes().map((row) => toDevice(row));
  service.setDevices(world.devices);
}

async function devices(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  await applyDevicesFromTable(this, table);
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

async function devicesReported(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  await applyDevicesFromTable(this, table);
}

When('the vendor reports these devices:', devicesReported);

async function devicesOmitted(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.setDevices([]);
}

When('the vendor reports no devices', devicesOmitted);

// Arms exactly the next N `/devices` GET responses as an empty inventory,
// then falls back to the standing device list a scenario already set. This
// scripts the confirming poll and its own out-of-band final-check fetch
// (DEV-05) independently: the two happen back to back with no
// scenario-controllable gap between them, so only request order -- not real
// time -- can distinguish them.
async function deviceOmittedFromNextChecks(this: BasementGuardianWorld, count: number): Promise<void> {
  const service = await this.restApi();

  for (let check = 0; check < count; check += 1) {
    service.armDevicesAnswer([]);
  }
}

When('the vendor omits the device from the next {int} inventory checks', deviceOmittedFromNextChecks);

// Arms exactly the next `/devices` GET response with these devices, then falls back to the
// standing device list a scenario already set. This lands a chosen inventory on one specific poll
// regardless of how many polls a short interval has already run in the background, so a scenario
// can prove what a later, distinct poll sees rather than racing a real poll timer.
async function devicesReportedForNextCheck(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  const service = await this.restApi();

  service.armDevicesAnswer(table.hashes().map((row) => toDevice(row)));
}

When('the vendor reports these devices for the next inventory check:', devicesReportedForNextCheck);

async function userRenamesAccessory(this: BasementGuardianWorld, name: string): Promise<void> {
  const homebridge = await this.homebridge();
  const accessory = currentAccessory(homebridge);

  if (accessory === undefined) {
    throw new Error('no accessory has been registered yet');
  }

  accessory.displayName = name;
}

When('the user renames the accessory to {string} in the home app', userRenamesAccessory);

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

const EXPECTED_MANUFACTURER = 'Wayne';
const EXPECTED_MODEL = 'Gemini';
const EXPECTED_SERIAL_NUMBER = 'placeholder-serial-number';
const EXPECTED_FIRMWARE_REVISION = 'unknown';

async function assertOneAccessoryWithTruthfulAccessoryInformation(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  assert.equal(homebridge.registerPlatformAccessoryCalls.length, 1);

  const call = homebridge.registerPlatformAccessoryCalls[0];
  const accessories = call?.accessories ?? [];

  assert.equal(accessories.length, 1);

  const accessoryInformation = accessories[0]?.getService(homebridge.hap.Service.AccessoryInformation);

  assert.deepEqual(
    {
      manufacturer: accessoryInformation?.getCharacteristic(homebridge.hap.Characteristic.Manufacturer)?.value,
      model: accessoryInformation?.getCharacteristic(homebridge.hap.Characteristic.Model)?.value,
      serialNumber: accessoryInformation?.getCharacteristic(homebridge.hap.Characteristic.SerialNumber)?.value,
      firmwareRevision: accessoryInformation?.getCharacteristic(homebridge.hap.Characteristic.FirmwareRevision)?.value,
    },
    {
      manufacturer: EXPECTED_MANUFACTURER,
      model: EXPECTED_MODEL,
      serialNumber: EXPECTED_SERIAL_NUMBER,
      firmwareRevision: EXPECTED_FIRMWARE_REVISION,
    },
  );
}

Then('the plugin registers one accessory with a truthful accessory information service', assertOneAccessoryWithTruthfulAccessoryInformation);

const HALO_ROW_DEVICE_ID = 'placeholder-halo';
const UNKNOWN_ROW_DEVICE_ID = 'placeholder-other';
const UNKNOWN_ROW_DEVICE_TYPE_ID = 'wayneWaterUnknown';

const EXPECTED_HALO_EXPLANATION =
  `info Skipping ${HALO_ROW_DEVICE_ID}: ${HALO_DISPLAY_NAME} (${HALO_DEVICE_TYPE_ID}) ` + 'is a recognized but unsupported device family.';
const EXPECTED_UNKNOWN_EXPLANATION = `info Skipping ${UNKNOWN_ROW_DEVICE_ID}: ${UNKNOWN_ROW_DEVICE_TYPE_ID} is not a recognized device family.`;

// Asserted after every poll a scenario forces, so a repeat proves the explanation logs once per
// device per run rather than once per poll (D-05).
function assertHaloAndUnknownExplainedOnceEach(this: BasementGuardianWorld): void {
  assert.deepEqual(
    this.logged.filter((line) => line === EXPECTED_HALO_EXPLANATION || line === EXPECTED_UNKNOWN_EXPLANATION),
    [EXPECTED_HALO_EXPLANATION, EXPECTED_UNKNOWN_EXPLANATION],
  );
}

Then('the plugin explains the halo and the unknown device once each', assertHaloAndUnknownExplainedOnceEach);

// Waits for the accessory's stored vendor name to advance to what a scenario just reported, which
// only happens once a discovery poll has actually applied the new device data (D-030). A scenario
// asserts this before reading `displayName`, so that read is never a race against the poll.
async function assertAccessoryRemembersVendorName(this: BasementGuardianWorld, name: string): Promise<void> {
  const homebridge = await this.homebridge();

  await this.untilTrue(
    () => currentAccessory(homebridge)?.context.lastVendorName === name,
    DISCOVERY_CHANGE_DEADLINE_MS,
    `the accessory never remembered the vendor name ${name}`,
  );
}

Then('the accessory remembers the vendor name {string}', assertAccessoryRemembersVendorName);

async function assertAccessoryDisplayName(this: BasementGuardianWorld, name: string): Promise<void> {
  const homebridge = await this.homebridge();

  assert.equal(currentAccessory(homebridge)?.displayName, name);
}

Then('the accessory is named {string}', assertAccessoryDisplayName);

// Waits for the accessory's stored deviceTypeId to advance to what a scenario just reported, which
// only happens once a discovery poll has refreshed the context of the same, already-cached
// accessory (DEV-04). Also proves the accessory context was actually refreshed rather than left
// untouched, which a bare register-count assertion cannot tell apart.
async function assertAccessoryRemembersDeviceType(this: BasementGuardianWorld, deviceTypeId: string): Promise<void> {
  const homebridge = await this.homebridge();

  await this.untilTrue(
    () => field(currentAccessory(homebridge)?.context.device, 'deviceTypeId') === deviceTypeId,
    DISCOVERY_CHANGE_DEADLINE_MS,
    `the accessory never remembered the device type ${deviceTypeId}`,
  );
}

Then('the accessory remembers the device type {string}', assertAccessoryRemembersDeviceType);

async function assertPluginUnregistersTheAccessory(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  await this.untilTrue(
    () => homebridge.unregisterPlatformAccessoryCalls.length > 0,
    DISCOVERY_CHANGE_DEADLINE_MS,
    'the plugin never unregistered the accessory',
  );
}

Then('the plugin unregisters the accessory', assertPluginUnregistersTheAccessory);

async function assertPluginNeverUnregistersTheAccessory(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  assert.equal(homebridge.unregisterPlatformAccessoryCalls.length, 0);
}

Then('the plugin never unregisters the accessory', assertPluginNeverUnregistersTheAccessory);

const EXPECTED_DEGRADATION_EXPLANATION =
  `warn Degraded ${DEVICE_ID}: the profile or payload stopped validating. ` +
  'AccessoryInformation keeps its last valid values until a family-valid update recovers it.';

// Waits for the poll that carries the out-of-domain telemetry to actually run, then asserts the
// degradation transition logged exactly once (DEV-08) -- not once per poll.
async function assertPluginExplainsTheDegradationOnce(this: BasementGuardianWorld): Promise<void> {
  await this.untilTrue(
    () => this.logged.includes(EXPECTED_DEGRADATION_EXPLANATION),
    DISCOVERY_CHANGE_DEADLINE_MS,
    'the plugin never logged the degradation explanation',
  );

  assert.deepEqual(
    this.logged.filter((line) => line === EXPECTED_DEGRADATION_EXPLANATION),
    [EXPECTED_DEGRADATION_EXPLANATION],
  );
}

Then('the plugin explains the degradation once', assertPluginExplainsTheDegradationOnce);
