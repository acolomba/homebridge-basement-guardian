/**
 * @fileoverview Steps that start, rotate, and shut down the plugin's account runtime.
 *
 * These steps own the plugin's lifecycle and the questions that span the whole runtime: which
 * sources are feeding state, what reached the log, and whether anything was left unhandled.
 */

import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

import { Given, Then, When } from '@cucumber/cucumber';

import type { FakeRestApi } from '../fakeRestApi.js';
import type { BasementGuardianWorld } from '../world.js';

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

// The inventory-request count read at the moment polling was seen parked, which the closing step
// compares against.
const PARKED_DEVICE_REQUESTS = 'parked device requests';

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

async function fakeCloud(this: BasementGuardianWorld): Promise<void> {
  await this.auth0();
  await this.restApi();
  await this.broker();
  await this.homebridge();
}

Given('the fake cloud', fakeCloud);

function shortPollInterval(this: BasementGuardianWorld): void {
  this.usePollInterval(SHORT_POLL_INTERVAL_SECONDS);
}

Given('a short poll interval', shortPollInterval);

function shortRotationInterval(this: BasementGuardianWorld): void {
  this.useShortRotation();
}

Given('a short rotation interval', shortRotationInterval);

async function heldRequest(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.holdNextRequest();
}

Given('the service holds the next request', heldRequest);

async function heldDeviceRequests(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.holdEveryDeviceRequest();
}

Given('the vendor never answers the device list', heldDeviceRequests);

async function everyRequestFailing(this: BasementGuardianWorld, status: number): Promise<void> {
  const service = await this.restApi();

  service.failEveryRequestWith(status);
}

Given('the service fails every request with status {int}', everyRequestFailing);

async function normalAnswers(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.answerNormally();
}

Given('the service answers normally again', normalAnswers);

async function startPlugin(this: BasementGuardianWorld): Promise<void> {
  this.startPlugin();
  await this.awaitStart();
}

When('the plugin starts', startPlugin);

function startPluginInTheBackground(this: BasementGuardianWorld): void {
  this.startPlugin();
}

When('the plugin starts in the background', startPluginInTheBackground);

async function startPluginAgain(this: BasementGuardianWorld): Promise<void> {
  await this.startPluginAgain();
}

When('the plugin starts again', startPluginAgain);

async function rotateCredentials(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();
  const issued = credentialRequestCount(service);

  await this.untilTrue(() => credentialRequestCount(service) > issued, DEADLINE_MS, 'the plugin requested no fresh credentials');
}

When('the credentials rotate', { timeout: STEP_TIMEOUT_MS }, rotateCredentials);

async function shutDown(this: BasementGuardianWorld): Promise<void> {
  await this.stopPlugin();
  await this.awaitStart();
  await delay(SETTLE_MS);
}

When('homebridge shuts down', shutDown);

function assertMonitoringPath(this: BasementGuardianWorld, path: string): Promise<void> {
  return this.untilTrue(() => this.runtime().monitoringPath === path, DEADLINE_MS, `the monitoring path never reached ${path}`);
}

Then('the monitoring path is {string}', { timeout: STEP_TIMEOUT_MS }, assertMonitoringPath);

function assertNoUnhandledRejection(this: BasementGuardianWorld): void {
  assert.deepEqual(this.rejections, []);
}

Then('the plugin records no unhandled rejection', assertNoUnhandledRejection);

async function assertDegradedPathWarnedOnce(this: BasementGuardianWorld): Promise<void> {
  await this.untilTrue(
    () => countOf(this.logged, ATTEMPT_REFUSED_LINE) >= ATTEMPTS_BEFORE_A_FLOOD,
    DEADLINE_MS,
    'the plugin made too few connection attempts to prove the reporting stays quiet',
  );

  assert.equal(countOf(this.logged, DEGRADED_LINE), 1);
}

Then('the log warns once about the degraded path', { timeout: STEP_TIMEOUT_MS }, assertDegradedPathWarnedOnce);

// The runtime moves the monitoring path before it reports the recovery, so a step that waited on
// the path alone can read the log between the two.
async function assertRecoveryAnnouncedOnce(this: BasementGuardianWorld): Promise<void> {
  await this.untilTrue(() => countOf(this.logged, RECOVERY_LINE) >= 1, DEADLINE_MS, 'the log never announced the recovery');
  assert.equal(countOf(this.logged, RECOVERY_LINE), 1);
}

Then('the log announces the recovery once', { timeout: STEP_TIMEOUT_MS }, assertRecoveryAnnouncedOnce);

function assertNoErrorLogged(this: BasementGuardianWorld): void {
  assert.deepEqual(
    this.logged.filter((line) => line.startsWith('error ')),
    [],
  );
}

Then('the log carries no error', assertNoErrorLogged);

async function assertVendorRequestCount(this: BasementGuardianWorld, count: number): Promise<void> {
  const service = await this.restApi();

  await this.untilTrue(() => service.requests.length >= count, DEADLINE_MS, `the fake service saw fewer than ${String(count)} requests`);
  assert.equal(service.requests.length, count);
}

Then('the fake service holds {int} vendor request(s)', { timeout: STEP_TIMEOUT_MS }, assertVendorRequestCount);

// A running poll loop has no final count, so a scenario that needs the polls to have certainly run
// waits on a floor rather than pinning an exact number that keeps growing under it.
async function assertPollCount(this: BasementGuardianWorld, count: number): Promise<void> {
  const service = await this.restApi();

  await this.untilTrue(() => deviceRequestCount(service) >= count, DEADLINE_MS, `the plugin polled the vendor fewer than ${String(count)} times`);
}

Then('the plugin polls the vendor at least {int} times', { timeout: STEP_TIMEOUT_MS }, assertPollCount);

// Proves the parked state rather than assuming it. The poll loop issues one inventory request at a
// time and waits for it, so a request recorded after the hold was armed proves the poll before it
// completed and reported, and a count that then stops advancing proves the loop is sitting inside
// the held request. The failure message names what it saw, so a scenario that times out here says
// whether the polling never parked or never started.
async function assertPollingParked(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();
  const atArming = deviceRequestCount(service);

  await this.untilTrue(
    () => deviceRequestCount(service) > atArming,
    DEADLINE_MS,
    `the plugin asked for the device list no further time after the hold was armed; it had asked ${String(atArming)} times`,
  );

  const held = deviceRequestCount(service);
  await delay(PARKED_WINDOW_MS);
  const afterTheWindow = deviceRequestCount(service);

  assert.equal(afterTheWindow, held, `the plugin kept polling: it asked for the device list ${String(held)} times, then ${String(afterTheWindow)} times`);
  this.remember(PARKED_DEVICE_REQUESTS, held);
}

Then('the plugin stops asking for the device list', { timeout: STEP_TIMEOUT_MS }, assertPollingParked);

// The held request is finite: the client puts a ten-second real-clock deadline on every request, and
// an abort reaches the poll loop's failure branch, which reports the monitoring trust and would clear
// a shadow silence with no message involved. The inventory count is the signal that abort moves,
// because the loop asks again after it, so a count still standing where it stood when polling parked
// proves the loop recorded no poll outcome across the window.
async function assertNoPollOutcomeRecorded(this: BasementGuardianWorld): Promise<void> {
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
}

Then('the plugin records no poll outcome', { timeout: STEP_TIMEOUT_MS }, assertNoPollOutcomeRecorded);

async function assertNoRequestReachesTheCloud(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();
  const service = await this.restApi();
  const broker = await this.broker();

  assert.deepEqual(
    { grants: tenant.requests.length, requests: service.requests.length, handshakes: broker.handshakes.length },
    { grants: 0, requests: 0, handshakes: 0 },
  );
}

Then('no request reaches the fake cloud', assertNoRequestReachesTheCloud);
