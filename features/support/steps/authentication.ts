/**
 * @fileoverview Steps about signing in to the vendor tenant.
 *
 * These steps arm the tenant, drive a restart, and ask what the tenant received, what the token
 * cache holds, and what the log said. Nothing here names the HTTP client the plugin uses.
 */

import assert from 'node:assert/strict';
import { access, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Given, Then, When } from '@cucumber/cucumber';

import { TOKEN_CACHE_FILENAME } from '../../../src/cloud/auth.js';
import { DEFAULT_ID_TOKEN } from '../fakeAuth0.js';
import {
  ACCOUNT_EMAIL,
  ACCOUNT_PASSWORD,
  EVERY_ISSUED_CREDENTIAL,
  HARNESS_CLIENT_ID,
  HARNESS_REALM,
  SCENARIO_START_TIME,
  SHADOW_CREDENTIALS,
} from '../world.js';

import type { BasementGuardianWorld } from '../world.js';

const REDACTED = '[redacted]';
const REFUSED_STATUS = 403;
const THROTTLED_STATUS = 429;
const TOKEN_LIFETIME_MS = 2_592_000_000;

const GRANT_TYPE = 'http://auth0.com/oauth/grant-type/password-realm';
const GRANT_SCOPE = 'openid profile email';

// What one start registers with the redacting logger: the granted token and the three values of the
// credential set the vendor issued for the shadow connection.
const REGISTERED_CREDENTIALS: readonly string[] = [
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

// A cache naming a different account: the fingerprint cannot match the one the plugin computes for
// the configured account, so the plugin has to authenticate again and then act on the answer.
const FOREIGN_CACHE = {
  idToken: 'placeholder-cached-token',
  expiresAt: SCENARIO_START_TIME + TOKEN_LIFETIME_MS,
  emailFingerprint: 'placeholder-fingerprint-of-another-account',
  salt: 'placeholder-cache-salt',
};

async function tokenCachePath(world: BasementGuardianWorld): Promise<string> {
  const homebridge = await world.homebridge();

  return join(homebridge.storagePath, TOKEN_CACHE_FILENAME);
}

async function isPresent(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  );
}

async function refusedCredentials(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  tenant.failWith(REFUSED_STATUS, 'invalid_grant');
}

Given('the tenant refuses the account credentials', refusedCredentials);

async function throttledAccount(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  tenant.failWith(THROTTLED_STATUS, 'too_many_attempts');
}

Given('the tenant throttles the account', throttledAccount);

async function cachedTokenOfAnotherAccount(this: BasementGuardianWorld): Promise<void> {
  await writeFile(await tokenCachePath(this), JSON.stringify(FOREIGN_CACHE), 'utf8');
}

Given('the storage holds a token for another account', cachedTokenOfAnotherAccount);

async function restartPlugin(this: BasementGuardianWorld): Promise<void> {
  await this.restartPlugin();
}

When('the plugin restarts', restartPlugin);

function logEveryRegisteredCredential(this: BasementGuardianWorld): void {
  for (const credential of REGISTERED_CREDENTIALS) {
    this.logger().info(credential);
  }
}

When('the plugin writes every credential it registered to the log', logEveryRegisteredCredential);

async function assertTokenRequestCount(this: BasementGuardianWorld, count: number): Promise<void> {
  const tenant = await this.auth0();

  assert.equal(tenant.requests.length, count);
}

Then('the tenant holds {int} token request(s)', assertTokenRequestCount);

async function assertGrantCarriesTheAccount(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();

  assert.deepEqual(tenant.requests.at(-1), {
    grantType: GRANT_TYPE,
    realm: HARNESS_REALM,
    clientId: HARNESS_CLIENT_ID,
    username: ACCOUNT_EMAIL,
    password: ACCOUNT_PASSWORD,
    scope: GRANT_SCOPE,
  });
}

Then('the grant carries the account the scenario configured', assertGrantCarriesTheAccount);

async function assertTokenCachePresent(this: BasementGuardianWorld): Promise<void> {
  assert.equal(await isPresent(await tokenCachePath(this)), true);
}

Then('the token cache is present', assertTokenCachePresent);

async function assertTokenCacheAbsent(this: BasementGuardianWorld): Promise<void> {
  assert.equal(await isPresent(await tokenCachePath(this)), false);
}

Then('the token cache is absent', assertTokenCacheAbsent);

function assertRefusalReported(this: BasementGuardianWorld): void {
  assert.equal(this.logged.includes(REJECTION_ERROR), true);
}

Then('the log names how to correct the account', assertRefusalReported);

function assertThrottleReported(this: BasementGuardianWorld): void {
  assert.equal(this.logged.includes(THROTTLE_WARNING), true);
}

Then('the log names the throttling and how to stop the plugin', assertThrottleReported);

function assertNoCredentialInTheLog(this: BasementGuardianWorld): void {
  const leaked = [DEFAULT_ID_TOKEN, ACCOUNT_PASSWORD, ...EVERY_ISSUED_CREDENTIAL].filter((credential) => this.logged.some((line) => line.includes(credential)));

  assert.deepEqual(leaked, []);
}

Then('the log carries no credential', assertNoCredentialInTheLog);

function assertEveryWrittenCredentialIsRedacted(this: BasementGuardianWorld): void {
  const expected = REGISTERED_CREDENTIALS.map(() => `info ${REDACTED}`);

  assert.deepEqual(this.logged.slice(-expected.length), expected);
}

Then('the log carries a redaction in place of each one', assertEveryWrittenCredentialIsRedacted);
