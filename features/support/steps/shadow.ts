/**
 * @fileoverview Steps about the devices on the account and the shadow that carries their state.
 *
 * A scenario states what the vendor reports and then asks what the plugin holds. Nothing here names
 * the transport library: a device speaks through the local broker and the plugin answers through
 * its canonical snapshot.
 */

import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

import { Given, Then, When } from '@cucumber/cucumber';

import { SHADOW_TOPICS } from '../../../src/cloud/shadow.js';
import { ROTATED_SHADOW_CREDENTIALS, SCENARIO_START_TIME, SHADOW_CREDENTIALS } from '../world.js';

import type { DeviceSnapshot } from '../../../src/device/state.js';
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

// How far a step moves the scenario clock, so a later moment is distinguishable from the one the
// plugin started at.
const CLOCK_STEP_MS = 60_000;

// A scenario states a longer span in seconds, because that is the unit the measured heartbeat
// interval is quoted in.
const MILLISECONDS_PER_SECOND = 1000;

// A document that changes nothing leaves no trace a step can wait on, so a step asserting that it
// changed nothing gives the delivery and the merge it would have made time to land first.
const DELIVERY_SETTLE_MS = 200;

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

// A scenario names a system by the vendor name its account carries for it, not by its `deviceId`.
// The identifier is a placeholder a reader cannot tell one of from another at a glance, while the
// name is what the same scenario already reads the tile by, so one word identifies the system on
// both halves of the assertion. A name the scenario never seeded throws rather than falling back to
// position zero: a fallback would move a message onto a system the scenario was not talking about
// and still let the assertion pass.
function deviceIdNamed(world: BasementGuardianWorld, deviceName: string): string {
  const device = world.devices.find((candidate) => candidate.name === deviceName);

  if (device === undefined) {
    const seeded = world.devices.map((candidate) => candidate.name).join(', ');

    throw new Error(`no step has given the scenario a ${deviceName} device; it seeded: ${seeded}`);
  }

  return device.deviceId;
}

// The client subscribes to every route of every device in one awaited call before it publishes any
// complete-shadow request, so a subscription the connection now open holds is what says a message
// for that device can arrive. Reading a cumulative record instead answers from a connection that
// may already have ended: the plugin reconnects by opening a fresh connection and subscribing
// again, and a wait satisfied by the previous connection's history returns before the new one can
// carry anything.
async function awaitSubscription(world: BasementGuardianWorld, deviceId: string): Promise<void> {
  const broker = await world.broker();
  const topic = SHADOW_TOPICS.updateAccepted(deviceId);

  await world.untilTrue(() => broker.currentSubscriptions().includes(topic), DEADLINE_MS, `the live connection subscribed to no ${topic}`);
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

// The vendor carries telemetry under `reported.data` and device metadata under `reported.state`, so
// a report's fields go into one of those two sections rather than directly under `reported`. Each
// step below composes the whole reported record, which is how one of them sends a telemetry section
// that is not an object. Nothing upstream refuses such a section: the plugin's shadow validation
// reads two levels, the payload and its `state` wrapper, and says nothing about the sections under
// `reported`. So a truncated or corrupt heartbeat parses, passes validation, and reaches the store
// with its telemetry half empty, and a store reading that as a telemetry delivery stops accepting
// readings from the one transport still working (CR-03, SYNC-02).
async function publishReported(world: BasementGuardianWorld, deviceId: string, reported: Record<string, unknown>): Promise<void> {
  const broker = await world.broker();
  await awaitSubscription(world, deviceId);

  broker.publishReported(deviceId, reported, world.nextShadowVersion());
}

function publishReportedFields(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  return publishReported(this, theDeviceId(this), { data: fieldsOf(table) });
}

When('the device publishes these heartbeat fields:', { timeout: STEP_TIMEOUT_MS }, publishReportedFields);

// The same reported patch under a name that claims nothing about a heartbeat. A heartbeat carries
// seven fields and `test_running` is not among them, so a scenario driving a control's reported
// state says what it means: the device reported a state change.
When('the device reports these fields:', { timeout: STEP_TIMEOUT_MS }, publishReportedFields);

// The same heartbeat from one named system, for a scenario seeding more than one. The step above
// publishes for position zero of the device table, which is right while an account carries one
// system and cannot say which of several spoke.
function publishNamedReportedFields(this: BasementGuardianWorld, deviceName: string, table: DataTable): Promise<void> {
  return publishReported(this, deviceIdNamed(this, deviceName), { data: fieldsOf(table) });
}

When('the {string} device publishes these heartbeat fields:', { timeout: STEP_TIMEOUT_MS }, publishNamedReportedFields);

// A report about the device that delivers no reading. The table lands in the metadata section, and
// the telemetry section travels beside it as `null`. That is the corruption shape rather than an
// omission: the reading is present on the wire and cannot be read. The account-wide form is enough,
// because the scenario that needs it runs one system; a named variant would be a step no scenario
// calls.
function publishReportedMetadataFields(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  return publishReported(this, theDeviceId(this), { data: null, state: fieldsOf(table) });
}

When(
  'the device reports these device metadata fields and a telemetry section that cannot be read:',
  { timeout: STEP_TIMEOUT_MS },
  publishReportedMetadataFields,
);

async function publishRequestedState(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();
  const deviceId = theDeviceId(this);

  await awaitSubscription(this, deviceId);

  broker.publishGetAccepted(deviceId, REQUESTED_STATE, this.nextShadowVersion());
}

When('the device publishes a requested value', { timeout: STEP_TIMEOUT_MS }, publishRequestedState);

function advanceTheScenarioClock(this: BasementGuardianWorld): void {
  this.advanceClock(CLOCK_STEP_MS);
}

When('the scenario clock moves forward', advanceTheScenarioClock);

function advanceTheScenarioClockBySeconds(this: BasementGuardianWorld, seconds: number): void {
  this.advanceClock(seconds * MILLISECONDS_PER_SECOND);
}

When('the scenario clock moves forward by {int} seconds', advanceTheScenarioClockBySeconds);

// SAFE-07 forbids any plugin-added delay, so a scenario asserting a transition after zero elapsed
// scenario time is one of the layers proving the transition was not deferred (D-18).
function theScenarioClockDoesNotMove(this: BasementGuardianWorld): void {
  this.advanceClock(0);
}

When('the scenario clock does not move', theScenarioClockDoesNotMove);

// A vendor-side change rewrites the data of the devices the caller selects and leaves every other
// seeded device's data exactly as it was, so the two steps below differ only in what they select.
function changeFieldsOf(world: BasementGuardianWorld, table: DataTable, rewrites: (device: ApiDevice) => boolean): Promise<void> {
  const fields = fieldsOf(table);

  return setDevices(
    world,
    world.devices.map((device) => (rewrites(device) ? withData(device, { ...device.data, ...fields }) : device)),
  );
}

function changeDeviceFields(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  return changeFieldsOf(this, table, () => true);
}

When('the vendor changes these device fields:', changeDeviceFields);

// The same change to one named system. The step above says every pump on the account reports the
// new body, so on a two-pump account it cannot say that one pit is filling while its neighbour is
// not, which is the sentence a scenario about per-device state has to be able to write.
function changeNamedDeviceFields(this: BasementGuardianWorld, deviceName: string, table: DataTable): Promise<void> {
  const deviceId = deviceIdNamed(this, deviceName);

  return changeFieldsOf(this, table, (device) => device.deviceId === deviceId);
}

When('the vendor changes the {string} device fields:', changeNamedDeviceFields);

// The snapshot keeps telemetry and device metadata in two records, so an assertion about one must
// not be able to read the other. The two steps below therefore differ in the record they read and in
// the words their deadline reports: a scenario failing on metadata that read as failing on telemetry
// would cost a diagnosis.
function assertSnapshotRecord(world: BasementGuardianWorld, section: 'data' | 'metadata', held: string, table: DataTable): Promise<void> {
  const expected = fieldsOf(table);
  const holds = (): boolean => {
    const record = world.snapshot(theDeviceId(world))[section];

    return Object.entries(expected).every(([name, value]) => record[name] === value);
  };

  return world.untilTrue(holds, DEADLINE_MS, `the canonical snapshot never carried the ${held} the scenario expects`);
}

function assertSnapshotFields(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  return assertSnapshotRecord(this, 'data', 'fields', table);
}

Then('the canonical snapshot carries these fields:', { timeout: STEP_TIMEOUT_MS }, assertSnapshotFields);

// The metadata twin of the assertion above. Nothing in the suite could read `snapshot.metadata`
// before this step, so a scenario publishing a document whose only readable section is device
// metadata had no way to say the document arrived, and would have read the same green against a
// harness that published nothing at all.
function assertSnapshotMetadataFields(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  return assertSnapshotRecord(this, 'metadata', 'device metadata fields', table);
}

Then('the canonical snapshot carries these device metadata fields:', { timeout: STEP_TIMEOUT_MS }, assertSnapshotMetadataFields);

function assertSnapshotOmitsField(this: BasementGuardianWorld, name: string): void {
  assert.equal(Object.hasOwn(this.snapshot(theDeviceId(this)).data, name), false);
}

Then('the canonical snapshot carries no {string} field', assertSnapshotOmitsField);

async function settledSnapshot(world: BasementGuardianWorld): Promise<DeviceSnapshot> {
  await delay(DELIVERY_SETTLE_MS);

  return world.snapshot(theDeviceId(world));
}

async function assertNoShadowVersion(this: BasementGuardianWorld): Promise<void> {
  const snapshot = await settledSnapshot(this);

  assert.equal(snapshot.shadowVersion, undefined);
}

Then('the canonical snapshot carries no shadow version', { timeout: STEP_TIMEOUT_MS }, assertNoShadowVersion);

async function assertStartingReceiptTime(this: BasementGuardianWorld): Promise<void> {
  const snapshot = await settledSnapshot(this);

  assert.equal(snapshot.receivedAt, SCENARIO_START_TIME);
}

Then('the canonical snapshot carries the receipt time the scenario started at', { timeout: STEP_TIMEOUT_MS }, assertStartingReceiptTime);

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

async function assertNoLiveConnection(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  await this.untilTrue(() => broker.liveConnectionCount() === 0, DEADLINE_MS, 'the broker kept holding a live connection');
}

Then('the broker holds no live connection', { timeout: STEP_TIMEOUT_MS }, assertNoLiveConnection);

// The plugin subscribes to every route of every device in one awaited call, before it publishes any
// complete-shadow request, so a subscription the connection now open holds is what says a message
// for that device can arrive. A scenario that reconnected leaves a predecessor whose subscriptions
// the broker still remembers; asserting on the live connection is what tells the two apart.
async function assertLiveSubscriptions(this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();

  // Every device of an empty list is subscribed vacuously, so an unseeded scenario would pass this
  // without any connection at all. The seed is the premise of the assertion, not what it measures.
  if (this.devices.length === 0) {
    throw new Error('no step has seeded a device, so this assertion would hold without any subscription at all');
  }

  const expected = this.devices.map((device) => SHADOW_TOPICS.updateAccepted(device.deviceId));

  await this.untilTrue(
    () => expected.every((topic) => broker.currentSubscriptions().includes(topic)),
    DEADLINE_MS,
    `the live connection never subscribed to every one of ${expected.join(', ')}`,
  );
}

Then('the live connection is subscribed to every seeded device', { timeout: STEP_TIMEOUT_MS }, assertLiveSubscriptions);

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
