/**
 * @fileoverview Steps that drive the harness fakes directly.
 *
 * These steps exercise the stand-ins themselves rather than the plugin, because the seam that
 * points the plugin at a fake cloud arrives with the account runtime. Proving the harness on its
 * own is what makes it usable as a regression guard for the scenarios that follow.
 */

import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

import type { FakeAuth0TokenRequest } from '../fakeAuth0.js';
import type { ApiDevice, AwsCredentialsResponse } from '../fakeRestApi.js';
import type { BasementGuardianWorld } from '../world.js';
import type { DataTable } from '@cucumber/cucumber';

const REQUEST_DEADLINE_MS = 2000;
const AUTHORIZATION_HEADER = 'Bearer fake-id-token';

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
  const body = this.response().body;

  assert.equal(typeof body === 'object' && body !== null && 'error' in body ? body.error : undefined, error);
}

Then('the response carries the error {string}', assertResponseError);

function assertDeviceListHoldsTheDevices(this: BasementGuardianWorld): void {
  assert.deepEqual(this.response().body, this.devices);
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
