// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Steps that start, rotate, and shut down the plugin's account runtime.
 *
 * These steps own the plugin's lifecycle and the questions that span the whole runtime: which
 * sources are feeding state, what reached the log, and whether anything was left unhandled.
 */

import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

import { Given, Then, When } from '@cucumber/cucumber';

import { createServiceCatalogue } from '../../src/accessories/serviceCatalogue.js';
import { currentAccessory, pushedValue } from '../lib/publishedServices.js';

import type { FakeHapCharacteristic } from '../lib/hap.js';
import type { FakeHomebridgeApi } from '../lib/homebridgeApi.js';
import type { FakeRestApi } from '../lib/vendorRestApi.js';
import type { BasementGuardianWorld } from '../support/world.js';

const CREDENTIALS_PATH = '/credentials/aws';
const DEVICES_PATH = '/devices';
const SHORT_POLL_INTERVAL_SECONDS = 0.05;

// A named step that fails on its deadline is what turns a silent transport stall into a report. The
// step timeout sits above the deadline, so the failure names the condition rather than the runner
// giving up first.
const DEADLINE_MS = 10_000;
const STEP_TIMEOUT_MS = 20_000;

// Long enough for work the plugin had already scheduled to run, so a step asserting that nothing
// more happens is not just asking too early.
const SETTLE_MS = 200;

// Ten short poll intervals. A loop that is still polling advances its request count many times over
// inside this window, so a count that did not move says the loop is parked rather than that the
// reading landed between two polls.
const PARKED_WINDOW_MS = 500;

// After three refused attempts, the next reconnect wait is 2000 ms. Observe beyond it so a
// shutdown that fails to cancel the pending retry cannot pass before that retry runs.
const SHUTDOWN_RETRY_WINDOW_MS = 2500;

// The inventory-request count read at the moment polling was seen parked, which the closing step
// compares against.
const PARKED_DEVICE_REQUESTS = 'parked device requests';
const CLOUD_WORK_BEFORE_RESTART = 'cloud work before restart';

const DEGRADED_LINE = 'warn The shadow connection is unavailable, so device state is coming from polling alone until it returns.';
const RECOVERY_LINE = 'info The shadow connection recovered.';
const ATTEMPT_REFUSED_LINE = 'debug The shadow connection was refused before it was established and will be retried.';
const ATTEMPTS_BEFORE_A_FLOOD = 3;

function countOf(lines: readonly string[], line: string): number {
  return lines.filter((candidate) => candidate === line).length;
}

function credentialRequestCount(service: FakeRestApi): number {
  return service.requests.filter((request) => request.path === CREDENTIALS_PATH).length;
}

function deviceRequestCount(service: FakeRestApi): number {
  return service.requests.filter((request) => request.path === DEVICES_PATH).length;
}

Given('the fake cloud', async function (this: BasementGuardianWorld): Promise<void> {
  await this.auth0();
  await this.restApi();
  await this.broker();
  await this.homebridge();
});

Given('a short poll interval', function (this: BasementGuardianWorld): void {
  this.usePollInterval(SHORT_POLL_INTERVAL_SECONDS);
});

Given('a short rotation interval', function (this: BasementGuardianWorld): void {
  this.useShortRotation();
});

Given('the service holds the next request', async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.holdNextRequest();
});

Given('the vendor never answers the device list', { timeout: STEP_TIMEOUT_MS }, async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();
  const atArming = deviceRequestCount(service);

  service.holdEveryDeviceRequest();
  await this.untilTrue(
    () => deviceRequestCount(service) > atArming,
    DEADLINE_MS,
    `the plugin asked for the device list no further time after the hold was armed; it had asked ${String(atArming)} times`,
  );
  this.remember(PARKED_DEVICE_REQUESTS, deviceRequestCount(service));
});

Given('the service fails every request with status {int}', async function (this: BasementGuardianWorld, status: number): Promise<void> {
  const service = await this.restApi();

  service.failEveryRequestWith(status);
});

When('the plugin starts', async function (this: BasementGuardianWorld): Promise<void> {
  this.startPlugin();
  await this.awaitStart();
});

When('the plugin starts in the background', function (this: BasementGuardianWorld): void {
  this.startPlugin();
});

When('the plugin starts again', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();
  const service = await this.restApi();
  const broker = await this.broker();
  this.remember(CLOUD_WORK_BEFORE_RESTART, {
    grants: tenant.requests.length,
    requests: service.requests.length,
    handshakes: broker.handshakes.length,
  });
  await this.startPluginAgain();
});

When('the credentials rotate', { timeout: STEP_TIMEOUT_MS }, async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();
  const issued = credentialRequestCount(service);

  await this.untilTrue(() => credentialRequestCount(service) > issued, DEADLINE_MS, 'the plugin requested no fresh credentials');
});

When('homebridge shuts down', async function (this: BasementGuardianWorld): Promise<void> {
  await this.stopPlugin();
  await this.awaitStart();
  await delay(SETTLE_MS);
});

// Polls run in sequence. A second new request proves the first post-observation poll completed.
When('the plugin completes another vendor poll', { timeout: STEP_TIMEOUT_MS }, async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();
  const before = deviceRequestCount(service);

  await this.untilTrue(() => deviceRequestCount(service) >= before + 2, DEADLINE_MS, 'the plugin completed no later vendor poll');
});

Then('the monitoring path is {string}', { timeout: STEP_TIMEOUT_MS }, function (this: BasementGuardianWorld, path: string): Promise<void> {
  return this.untilTrue(() => this.runtime().monitoringPath === path, DEADLINE_MS, `the monitoring path never reached ${path}`);
});

function publishedTrustReports(homebridge: FakeHomebridgeApi): readonly { service: string; characteristic: FakeHapCharacteristic }[] {
  const accessory = currentAccessory(homebridge);

  if (accessory === undefined) {
    throw new Error('the plugin published no accessory');
  }

  const statusActiveUuid = homebridge.hap.Characteristic.StatusActive.UUID;
  const reports = createServiceCatalogue(homebridge.api.hap).flatMap((row) => {
    const service = accessory.getServiceById(row.serviceClass, row.subtype);

    if (service === undefined) {
      return [];
    }

    const characteristic = service.characteristics.find((candidate) => candidate.UUID === statusActiveUuid);

    if (characteristic === undefined) {
      throw new Error(`the ${row.displayName} service carries no trust report`);
    }

    return [{ service: row.displayName, characteristic }];
  });

  assert.notEqual(reports.length, 0);

  return reports;
}

Then('every published service reports "Status Active" as "false"', async function (this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();
  const statuses = publishedTrustReports(homebridge).map(({ service, characteristic }) => ({ service, active: pushedValue(characteristic) }));

  assert.deepStrictEqual(
    statuses,
    statuses.map(({ service }) => ({ service, active: false })),
  );
});

Then('every published service refuses its trust read', async function (this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();
  for (const { service, characteristic } of publishedTrustReports(homebridge)) {
    await assert.rejects(
      async () => {
        await characteristic.handleGetRequest();
      },
      (error: unknown) => error === homebridge.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
      `the ${service} service answered its trust read`,
    );
  }
});

Then('every published service answers its trust read', async function (this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();
  for (const { service, characteristic } of publishedTrustReports(homebridge)) {
    await assert.doesNotReject(async () => {
      await characteristic.handleGetRequest();
    }, `the ${service} service refused its trust read`);
  }
});

Then('the plugin records no unhandled rejection', function (this: BasementGuardianWorld): void {
  assert.deepEqual(this.rejections, []);
});

Then('the stopped plugin makes no later shadow connection attempt', { timeout: STEP_TIMEOUT_MS }, async function (this: BasementGuardianWorld): Promise<void> {
  const broker = await this.broker();
  const refusedAtShutdown = countOf(this.logged, ATTEMPT_REFUSED_LINE);
  const handshakesAtShutdown = broker.handshakes.length;

  await delay(SHUTDOWN_RETRY_WINDOW_MS);

  assert.equal(countOf(this.logged, ATTEMPT_REFUSED_LINE), refusedAtShutdown, 'the stopped plugin tried a refused shadow connection');
  assert.equal(broker.handshakes.length, handshakesAtShutdown, 'the stopped plugin opened a shadow connection');
});

Then('the stopped plugin makes no later cloud contact', { timeout: STEP_TIMEOUT_MS }, async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();
  const service = await this.restApi();
  const broker = await this.broker();
  const beforeRestart = this.recall(CLOUD_WORK_BEFORE_RESTART);

  await delay(SHUTDOWN_RETRY_WINDOW_MS);

  assert.deepStrictEqual({ grants: tenant.requests.length, requests: service.requests.length, handshakes: broker.handshakes.length }, beforeRestart);
});

Then('the log warns once about the degraded path', { timeout: STEP_TIMEOUT_MS }, async function (this: BasementGuardianWorld): Promise<void> {
  await this.untilTrue(
    () => countOf(this.logged, ATTEMPT_REFUSED_LINE) >= ATTEMPTS_BEFORE_A_FLOOD,
    DEADLINE_MS,
    'the plugin made too few connection attempts to prove the reporting stays quiet',
  );

  assert.equal(countOf(this.logged, DEGRADED_LINE), 1);
});

Then(
  'the log records at least {int} refused shadow connections',
  { timeout: STEP_TIMEOUT_MS },
  async function (this: BasementGuardianWorld, count: number): Promise<void> {
    await this.untilTrue(
      () => countOf(this.logged, ATTEMPT_REFUSED_LINE) >= count,
      DEADLINE_MS,
      `the log recorded fewer than ${String(count)} refused shadow connections`,
    );
  },
);

// The runtime moves the monitoring path before it reports the recovery, so a step that waited on
// the path alone can read the log between the two.
Then('the log announces the recovery once', { timeout: STEP_TIMEOUT_MS }, async function (this: BasementGuardianWorld): Promise<void> {
  await this.untilTrue(() => countOf(this.logged, RECOVERY_LINE) >= 1, DEADLINE_MS, 'the log never announced the recovery');
  assert.equal(countOf(this.logged, RECOVERY_LINE), 1);
});

Then('the log carries no error', function (this: BasementGuardianWorld): void {
  assert.deepEqual(
    this.logged.filter((line) => line.startsWith('error ')),
    [],
  );
});

Then(
  'the fake service holds {int} vendor request(s)',
  { timeout: STEP_TIMEOUT_MS },
  async function (this: BasementGuardianWorld, count: number): Promise<void> {
    const service = await this.restApi();

    await this.untilTrue(() => service.requests.length >= count, DEADLINE_MS, `the fake service saw fewer than ${String(count)} requests`);
    assert.equal(service.requests.length, count);
  },
);

// A running poll loop has no final count, so a scenario that needs the polls to have certainly run
// waits on a floor rather than pinning an exact number that keeps growing under it.
Then(
  'the plugin polls the vendor at least {int} times',
  { timeout: STEP_TIMEOUT_MS },
  async function (this: BasementGuardianWorld, count: number): Promise<void> {
    const service = await this.restApi();

    await this.untilTrue(() => deviceRequestCount(service) >= count, DEADLINE_MS, `the plugin polled the vendor fewer than ${String(count)} times`);
  },
);

// The Given saves the first request count after the hold was armed. This step proves the count
// stays there across a window long enough for a running poll loop to ask again.
Then('the plugin stops asking for the device list', { timeout: STEP_TIMEOUT_MS }, async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();
  const held = this.recall(PARKED_DEVICE_REQUESTS);
  await delay(PARKED_WINDOW_MS);
  const afterTheWindow = deviceRequestCount(service);

  assert.equal(afterTheWindow, held, `the plugin kept polling: it asked for the device list ${String(held)} times, then ${String(afterTheWindow)} times`);
});

// The held request is finite: the client puts a ten-second real-clock deadline on every request, and
// an abort reaches the poll loop's failure branch, which reports the monitoring trust and would clear
// a shadow silence with no message involved. The inventory count is the signal that abort moves,
// because the loop asks again after it, so a count still standing where it stood when polling parked
// proves the loop recorded no poll outcome across the window.
Then('the plugin records no poll outcome', { timeout: STEP_TIMEOUT_MS }, async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();
  const whenParked = this.recall(PARKED_DEVICE_REQUESTS);

  await delay(PARKED_WINDOW_MS);
  const now = deviceRequestCount(service);

  assert.equal(
    now,
    whenParked,
    `the run was slow enough for the request deadline to fire: the plugin had asked for the device list ${String(whenParked)} times ` +
      `when polling parked, and ${String(now)} times now`,
  );
});

Then('no request reaches the fake cloud', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();
  const service = await this.restApi();
  const broker = await this.broker();

  assert.deepEqual(
    { grants: tenant.requests.length, requests: service.requests.length, handshakes: broker.handshakes.length },
    { grants: 0, requests: 0, handshakes: 0 },
  );
});
