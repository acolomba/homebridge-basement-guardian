// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Defines tenant sign-in and token-cache scenario steps.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { Given, Then, When } from '@cucumber/cucumber';

import { DEFAULT_ID_TOKEN } from '../lib/auth0.js';
import {
  ACCOUNT_EMAIL,
  ACCOUNT_PASSWORD,
  EVERY_ISSUED_CREDENTIAL,
  HARNESS_CLIENT_ID,
  HARNESS_REALM,
  SCENARIO_START_TIME,
  SHADOW_CREDENTIALS,
} from '../support/world.js';

import type { BasementGuardianWorld } from '../support/world.js';

const REDACTED = '[redacted]';
const REFUSED_STATUS = 403;
const THROTTLED_STATUS = 429;
const TOKEN_LIFETIME_MS = 2_592_000_000;
const CACHE_SALT = 'placeholder-salt';
const FOREIGN_CACHE_SALT = 'placeholder-cache-salt';
const FOREIGN_ACCOUNT_EMAIL = 'foreign@example.test';

const GRANT_TYPE = 'http://auth0.com/oauth/grant-type/password-realm';
const GRANT_SCOPE = 'openid profile email';

// The granted token and three AWS credential values this scenario writes through the plugin logger.
const WRITTEN_CREDENTIALS: readonly string[] = [
  DEFAULT_ID_TOKEN,
  SHADOW_CREDENTIALS.accessKeyId,
  SHADOW_CREDENTIALS.secretAccessKey,
  SHADOW_CREDENTIALS.sessionToken,
];

const THROTTLE_WARNING =
  'warn Authentication answered HTTP 429: the vendor is throttling it. The plugin will try again in 30 minutes. ' +
  'If the account is genuinely blocked, the block lifts only 30 days after the last attempt, so every retry postpones it. ' +
  'Disable this plugin, or remove its platform block from config.json, to let a real block clear.';

const REJECTION_ERROR =
  'error Authentication stopped after HTTP 403: the vendor refused the account credentials. ' +
  'Correct the account email and password in the Homebridge UI (Plugins -> Basement Guardian -> Settings); saving there restarts the plugin. ' +
  'No further attempt will be made, because each one extends the vendor block on the account.';

const MONITORING_STOPPED_WARNING =
  'warn Monitoring has stopped because the vendor refused the account credentials. Correct the account in Homebridge to start the plugin again.';

const THROTTLE_RETRY_WARNING = 'warn Authentication is being throttled, so the plugin is waiting before it tries again.';

// The lines an operator acts on. Debug and info lines vary with what each scenario ran before the
// failure, while the warnings and errors are the whole account of what went wrong and what to do.
function operatorLines(logged: readonly string[]): readonly string[] {
  return logged.filter((line) => line.startsWith('warn ') || line.startsWith('error '));
}

// A cache naming a different account: the fingerprint cannot match the one the plugin computes for
// the configured account, so the plugin has to authenticate again and then act on the answer.
const FOREIGN_CACHE = {
  idToken: 'placeholder-cached-token',
  expiresAt: SCENARIO_START_TIME + TOKEN_LIFETIME_MS,
  emailFingerprint: createHash('sha256').update(`${FOREIGN_CACHE_SALT}${FOREIGN_ACCOUNT_EMAIL}`).digest('hex'),
  salt: FOREIGN_CACHE_SALT,
};

const EXPIRED_ACCOUNT_CACHE = {
  idToken: FOREIGN_CACHE.idToken,
  expiresAt: SCENARIO_START_TIME - 1000,
  emailFingerprint: createHash('sha256').update(`${CACHE_SALT}${ACCOUNT_EMAIL}`).digest('hex'),
  salt: CACHE_SALT,
};

async function tokenCachePath(world: BasementGuardianWorld): Promise<string> {
  const homebridge = await world.homebridge();

  return join(homebridge.storagePath, '.basement-guardian-token.json');
}

// Arms the tenant to refuse every grant, before the plugin starts or while it runs.
async function refuseAccountCredentials(world: BasementGuardianWorld): Promise<void> {
  const tenant = await world.auth0();

  tenant.failWith(REFUSED_STATUS, 'invalid_grant');
}

async function isPresent(path: string): Promise<boolean> {
  try {
    await access(path);

    return true;
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

Given('the tenant refuses the account credentials', async function (this: BasementGuardianWorld): Promise<void> {
  await refuseAccountCredentials(this);
});

Given('the tenant throttles the account', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  tenant.failWith(THROTTLED_STATUS, 'too_many_attempts');
});

// The lifetime is stated by the scenario rather than derived here, because the derivation belongs
// where a reader meets it: the client renews a token that expires inside its one-hour renewal
// margin, so a lifetime a little over 3600 seconds leaves the token current at issue and stale
// after a small clock advance. That is what makes a running plugin ask the tenant again.
Given('the tenant issues tokens that expire in {int} seconds', async function (this: BasementGuardianWorld, seconds: number): Promise<void> {
  const tenant = await this.auth0();

  tenant.expireTokenIn(seconds);
});

Given('the storage holds an expired token for the configured account', async function (this: BasementGuardianWorld): Promise<void> {
  const path = await tokenCachePath(this);

  await writeFile(path, JSON.stringify(EXPIRED_ACCOUNT_CACHE), 'utf8');
  assert.equal(await isPresent(path), true, 'the configured account cache was not seeded');
});

When('the plugin restarts', async function (this: BasementGuardianWorld): Promise<void> {
  await this.restartPlugin();
});

When('the tenant starts refusing the account credentials', async function (this: BasementGuardianWorld): Promise<void> {
  await refuseAccountCredentials(this);
});

When('the owner replaces the token cache with one for another account', async function (this: BasementGuardianWorld): Promise<void> {
  await writeFile(await tokenCachePath(this), JSON.stringify(FOREIGN_CACHE), 'utf8');
});

When('the plugin writes the granted token and issued AWS credentials to the log', function (this: BasementGuardianWorld): void {
  for (const credential of WRITTEN_CREDENTIALS) {
    this.logger().info(credential);
  }
});

Then('the tenant holds {int} token request(s)', async function (this: BasementGuardianWorld, count: number): Promise<void> {
  const tenant = await this.auth0();

  assert.equal(tenant.requests.length, count);
});

Then('the vendor receives a second device list request with the cached token', async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();
  const deviceRequests = service.requests
    .filter((request) => request.path === '/devices')
    .map(({ method, path, authorization, body }) => ({ method, path, authorization, body }));
  const expected = { method: 'GET', path: '/devices', authorization: `Bearer ${DEFAULT_ID_TOKEN}`, body: '' };

  assert.deepEqual(deviceRequests, [expected, expected]);
});

Then('the grant carries the configured account', async function (this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepEqual(tenant.requests.at(-1), {
    grant_type: GRANT_TYPE,
    realm: HARNESS_REALM,
    client_id: HARNESS_CLIENT_ID,
    username: ACCOUNT_EMAIL,
    password: ACCOUNT_PASSWORD,
    scope: GRANT_SCOPE,
  });
});

Then('the token cache holds the granted token for the configured account', async function (this: BasementGuardianWorld): Promise<void> {
  const contents = await readFile(await tokenCachePath(this), 'utf8');
  let cache: unknown;

  try {
    cache = JSON.parse(contents);
  } catch {
    throw new Error('the token cache is not valid JSON');
  }

  const expected = {
    idToken: DEFAULT_ID_TOKEN,
    expiresAt: SCENARIO_START_TIME + TOKEN_LIFETIME_MS,
    emailFingerprint: createHash('sha256').update(`${CACHE_SALT}${ACCOUNT_EMAIL}`).digest('hex'),
    salt: CACHE_SALT,
  };

  assert.equal(isDeepStrictEqual(cache, expected), true, 'the token cache does not match the granted account token');
});

Then('the token cache is absent', async function (this: BasementGuardianWorld): Promise<void> {
  assert.equal(await isPresent(await tokenCachePath(this)), false);
});

Then('the log names how to correct the account', function (this: BasementGuardianWorld): void {
  assert.deepEqual(operatorLines(this.logged), [REJECTION_ERROR, MONITORING_STOPPED_WARNING]);
});

Then('the log names the throttling and how to stop the plugin', function (this: BasementGuardianWorld): void {
  assert.deepEqual(operatorLines(this.logged), [THROTTLE_WARNING, THROTTLE_RETRY_WARNING]);
});

Then('the log carries no credential', function (this: BasementGuardianWorld): void {
  const leaked = [DEFAULT_ID_TOKEN, FOREIGN_CACHE.idToken, ACCOUNT_EMAIL, ACCOUNT_PASSWORD, ...EVERY_ISSUED_CREDENTIAL].filter((credential) =>
    this.logged.some((line) => line.includes(credential)),
  );

  assert.deepEqual(leaked, []);
});

Then('the log carries a redaction in place of each one', function (this: BasementGuardianWorld): void {
  const expected = WRITTEN_CREDENTIALS.map(() => `info ${REDACTED}`);

  assert.deepEqual(this.logged.slice(-expected.length), expected);
});
