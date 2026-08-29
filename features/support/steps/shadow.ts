/**
 * @fileoverview Steps about the devices on the account and the shadow that carries their state.
 *
 * A scenario states what the vendor reports and then asks what the plugin holds. Nothing here names
 * the transport library: a device speaks through the local broker and the plugin answers through
 * its canonical snapshot.
 */

import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

import { SHADOW_TOPICS } from '../../../src/cloud/shadow.js';
import { ROTATED_SHADOW_CREDENTIALS, SHADOW_CREDENTIALS } from '../world.js';

import type { ApiDevice } from '../fakeRestApi.js';
import type { BasementGuardianWorld } from '../world.js';
import type { DataTable } from '@cucumber/cucumber';

const DEVICE_TYPE_ID = 'wayneWaterGemini';
const SERIAL_NUMBER = 'placeholder-serial-number';
const DEVICE_TIME = 1_700_000_000_000;

// A subscription that never completes makes the broker go silent rather than fail, so every wait
// carries a deadline and reports on a named step. The step timeout sits above the deadline, so the
// failure names the condition that was never met rather than the runner giving up first.
const DEADLINE_MS = 5000;
const STEP_TIMEOUT_MS = 15_000;

// The requested value a device carries while it acknowledges a command. It is not device state and
// must never reach the canonical snapshot.
const REQUESTED_STATE = { desired: { data: { alarm_muted: true } } };

// The identifier of each connection one rotation produces, in the order the vendor issued them.
const EXPECTED_CLIENT_IDS: readonly string[] = [SHADOW_CREDENTIALS.clientId, ROTATED_SHADOW_CREDENTIALS.clientId];

// A table cell reads as the JSON value the vendor would have sent, so a scenario states `false`
// and `2` rather than the text of either.
function fieldValue(text: string): unknown {
  if (text === 'true' || text === 'false') {
    return text === 'true';
  }

  return /^-?\d+$/.test(text) ? Number(text) : text;
}

function fieldsOf(table: DataTable): Record<string, unknown> {
  return Object.fromEntries(Object.entries(table.rowsHash()).map(([name, text]) => [name, fieldValue(text)]));
}

function toDevice(row: Record<string, string>): ApiDevice {
  return {
    deviceId: row.deviceId ?? '',
    deviceTypeId: DEVICE_TYPE_ID,
    name: row.name ?? '',
    serialNumber: SERIAL_NUMBER,
    connectivity: { connected: true, timestamp: DEVICE_TIME },
    data: {},
  };
}

function withData(device: ApiDevice, data: Record<string, unknown>): ApiDevice {
  return { ...device, data };
}

function theDeviceId(world: BasementGuardianWorld): string {
  const deviceId = world.devices.at(0)?.deviceId;

  if (deviceId === undefined) {
    throw new Error('no step has given the scenario a device');
  }

  return deviceId;
}

// The client publishes the complete-shadow request only after its subscription is established, so
// the first published topic is what says a device message can now arrive.
async function awaitSubscription(world: BasementGuardianWorld): Promise<void> {
  const broker = await world.broker();

  await world.untilTrue(() => broker.publishedTopics.length > 0, DEADLINE_MS, 'the plugin subscribed to no shadow topic');
}

async function setDevices(world: BasementGuardianWorld, devices: readonly ApiDevice[]): Promise<void> {
  const service = await world.restApi();

  world.devices = devices;
  service.setDevices(devices);
}

async function geminiDevices(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  await setDevices(
    this,
    table.hashes().map((row) => toDevice(row)),
  );
}

Given('these gemini devices:', geminiDevices);

async function reportedDeviceFields(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  const fields = fieldsOf(table);

  await setDevices(
    this,
    this.devices.map((device) => withData(device, fields)),
  );
}

Given('these reported device fields:', reportedDeviceFields);

async function shadowCredentials(this: BasementGuardianWorld): Promise<void> {
  await this.issueShadowCredentials(SHADOW_CREDENTIALS);
}

Given('the shadow credentials', shadowCredentials);

async function refusedConnections(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  broker.refuseConnections();
}

Given('the broker refuses connections', refusedConnections);

async function rotatedShadowCredentials(this: BasementGuardianWorld): Promise<void> {
  await this.issueShadowCredentials(ROTATED_SHADOW_CREDENTIALS);
}

When('the vendor issues the rotated shadow credentials', rotatedShadowCredentials);

async function acceptedConnections(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  broker.acceptConnections();
}

When('the broker accepts connections', acceptedConnections);

async function publishHeartbeat(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  const broker = await this.broker();
  await awaitSubscription(this);

  // The vendor carries telemetry under `reported.data`, so a heartbeat's fields go there rather
  // than directly under `reported`.
  broker.publishReported(theDeviceId(this), { data: fieldsOf(table) }, this.nextShadowVersion());
}

When('the device publishes these heartbeat fields:', { timeout: STEP_TIMEOUT_MS }, publishHeartbeat);

async function publishRequestedState(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();
  await awaitSubscription(this);

  broker.publishGetAccepted(theDeviceId(this), REQUESTED_STATE, this.nextShadowVersion());
}

When('the device publishes a requested value', { timeout: STEP_TIMEOUT_MS }, publishRequestedState);

async function changeDeviceFields(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  const fields = fieldsOf(table);

  await setDevices(
    this,
    this.devices.map((device) => withData(device, { ...device.data, ...fields })),
  );
}

When('the vendor changes these device fields:', changeDeviceFields);

function assertSnapshotFields(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  const expected = fieldsOf(table);
  const holds = (): boolean => {
    const data = this.snapshot(theDeviceId(this)).data;

    return Object.entries(expected).every(([name, value]) => data[name] === value);
  };

  return this.untilTrue(holds, DEADLINE_MS, 'the canonical snapshot never carried the fields the scenario expects');
}

Then('the canonical snapshot carries these fields:', { timeout: STEP_TIMEOUT_MS }, assertSnapshotFields);

function assertSnapshotOmitsField(this: BasementGuardianWorld, name: string): void {
  assert.equal(Object.hasOwn(this.snapshot(theDeviceId(this)).data, name), false);
}

Then('the canonical snapshot carries no {string} field', assertSnapshotOmitsField);

function assertShadowVersion(this: BasementGuardianWorld, version: number): Promise<void> {
  return this.untilTrue(
    () => this.snapshot(theDeviceId(this)).shadowVersion === version,
    DEADLINE_MS,
    `the canonical snapshot never reached shadow version ${String(version)}`,
  );
}

Then('the canonical snapshot is at shadow version {int}', { timeout: STEP_TIMEOUT_MS }, assertShadowVersion);

async function assertCanonicalChangeCount(this: BasementGuardianWorld, count: number): Promise<void> {
  await this.untilTrue(() => this.changes.length >= count, DEADLINE_MS, `the plugin reported fewer than ${String(count)} canonical changes`);
  assert.equal(this.changes.length, count);
}

Then('the plugin reports {int} canonical change(s)', { timeout: STEP_TIMEOUT_MS }, assertCanonicalChangeCount);

async function assertCompleteShadowRequests(this: BasementGuardianWorld, count: number): Promise<void> {
  const broker = await this.broker();
  const topic = SHADOW_TOPICS.get(theDeviceId(this));
  const requested = (): number => broker.publishedTopics.filter((candidate) => candidate === topic).length;

  await this.untilTrue(() => requested() >= count, DEADLINE_MS, `the plugin published fewer than ${String(count)} complete shadow requests`);
  assert.equal(requested(), count);
}

Then('the plugin publishes {int} complete shadow request(s)', { timeout: STEP_TIMEOUT_MS }, assertCompleteShadowRequests);

async function assertNoCompleteShadowRequest(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  assert.deepEqual(broker.publishedTopics, []);
}

Then('the plugin publishes no complete shadow request', assertNoCompleteShadowRequest);

async function assertHandshakeCount(this: BasementGuardianWorld, count: number): Promise<void> {
  const broker = await this.broker();

  await this.untilTrue(() => broker.handshakes.length >= count, DEADLINE_MS, `the broker saw fewer than ${String(count)} handshakes`);
  assert.equal(broker.handshakes.length, count);
}

Then('the broker holds {int} handshake(s)', { timeout: STEP_TIMEOUT_MS }, assertHandshakeCount);

async function assertHandshakeCarriesTheRotatedCredentials(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();
  const handshake = broker.handshakes.at(-1) ?? '';

  assert.deepEqual(
    {
      key: handshake.includes(ROTATED_SHADOW_CREDENTIALS.accessKeyId),
      token: handshake.includes(ROTATED_SHADOW_CREDENTIALS.sessionToken),
      stale: handshake.includes(SHADOW_CREDENTIALS.accessKeyId),
    },
    { key: true, token: true, stale: false },
  );
}

Then('the newest handshake carries the rotated credentials', assertHandshakeCarriesTheRotatedCredentials);

async function assertClientIdentifiers(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  // The broker records a client identifier when it reads the MQTT connect packet, which is a later
  // moment than the WebSocket upgrade a handshake count waits on. Waiting on the identifiers
  // themselves is what keeps the assertion from reading one packet early.
  await this.untilTrue(() => broker.clientIds.length >= EXPECTED_CLIENT_IDS.length, DEADLINE_MS, `the broker never held ${EXPECTED_CLIENT_IDS.join(' and ')}`);
  assert.deepEqual([...broker.clientIds], EXPECTED_CLIENT_IDS);
}

Then('the broker holds the first and the rotated client identifier', { timeout: STEP_TIMEOUT_MS }, assertClientIdentifiers);
