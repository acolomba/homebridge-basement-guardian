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
const SHORT_POLL_INTERVAL_SECONDS = 0.05;

// A named step that fails on its deadline is what turns a silent transport stall into a report.
const DEADLINE_MS = 5000;

// The runtime holds a rotation to a thirty-second floor, however soon the vendor expiry falls, so a
// scenario that waits for a real rotation waits at least that long.
const ROTATION_DEADLINE_MS = 45_000;
const ROTATION_STEP_TIMEOUT_MS = 60_000;

// Long enough for work the plugin had already scheduled to run, so a step asserting that nothing
// more happens is not just asking too early.
const SETTLE_MS = 200;

const DEGRADED_LINE = 'warn The shadow connection is unavailable, so device state is coming from polling alone until it returns.';
const RECOVERY_LINE = 'info The shadow connection recovered.';
const ATTEMPT_FAILED_LINE = 'debug The shadow connection failed and will reconnect.';
const ATTEMPTS_BEFORE_A_FLOOD = 3;

function countOf(lines: readonly string[], line: string): number {
  return lines.filter((candidate) => candidate === line).length;
}

function credentialRequestCount(service: FakeRestApi): number {
  return service.requests.filter((request) => request.path === CREDENTIALS_PATH).length;
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

async function heldRequest(this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.holdNextRequest();
}

Given('the service holds the next request', heldRequest);

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

  await this.untilTrue(() => credentialRequestCount(service) > issued, ROTATION_DEADLINE_MS, 'the plugin requested no fresh credentials');
}

When('the credentials rotate', { timeout: ROTATION_STEP_TIMEOUT_MS }, rotateCredentials);

async function shutDown(this: BasementGuardianWorld): Promise<void> {
  await this.stopPlugin();
  await this.awaitStart();
  await delay(SETTLE_MS);
}

When('homebridge shuts down', shutDown);

function assertMonitoringPath(this: BasementGuardianWorld, path: string): Promise<void> {
  return this.untilTrue(() => this.runtime().monitoringPath === path, DEADLINE_MS, `the monitoring path never reached ${path}`);
}

Then('the monitoring path is {string}', assertMonitoringPath);

function assertNoUnhandledRejection(this: BasementGuardianWorld): void {
  assert.deepEqual(this.rejections, []);
}

Then('the plugin records no unhandled rejection', assertNoUnhandledRejection);

async function assertDegradedPathWarnedOnce(this: BasementGuardianWorld): Promise<void> {
  await this.untilTrue(
    () => countOf(this.logged, ATTEMPT_FAILED_LINE) >= ATTEMPTS_BEFORE_A_FLOOD,
    DEADLINE_MS,
    'the plugin made too few connection attempts to prove the reporting stays quiet',
  );

  assert.equal(countOf(this.logged, DEGRADED_LINE), 1);
}

Then('the log warns once about the degraded path', assertDegradedPathWarnedOnce);

function assertRecoveryAnnouncedOnce(this: BasementGuardianWorld): void {
  assert.equal(countOf(this.logged, RECOVERY_LINE), 1);
}

Then('the log announces the recovery once', assertRecoveryAnnouncedOnce);

function assertNoErrorLogged(this: BasementGuardianWorld): void {
  assert.deepEqual(
    this.logged.filter((line) => line.startsWith('error ')),
    [],
  );
}

Then('the log carries no error', assertNoErrorLogged);

async function assertVendorRequestCount(this: BasementGuardianWorld, count: number): Promise<void> {
  const service = await this.restApi();

  assert.equal(service.requests.length, count);
}

Then('the fake service holds {int} vendor request(s)', assertVendorRequestCount);

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
