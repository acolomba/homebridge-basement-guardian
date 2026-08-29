/**
 * @fileoverview Steps that load the platform from one account configuration block.
 *
 * The platform is what decides whether an account is usable, so these steps drive the real
 * platform rather than the runtime seam the other scenarios build through. A refused configuration
 * registers no lifecycle listener, so nothing can start and nothing can reach the vendor.
 */

import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

import type { BasementGuardianWorld } from '../world.js';
import type { DataTable } from '@cucumber/cucumber';

const REFUSAL_ADVICE = 'Fix it in the Homebridge UI (Plugins -> Basement Guardian -> Settings).';

// A hand-edited config.json carries numbers as numbers, so a table cell that reads as a whole
// number becomes one. Every other cell stays the text it is.
function settingValue(text: string): unknown {
  return /^-?\d+$/.test(text) ? Number(text) : text;
}

function accountSettings(this: BasementGuardianWorld, table: DataTable): void {
  this.settings = Object.fromEntries(Object.entries(table.rowsHash()).map(([name, text]) => [name, settingValue(text)]));
}

Given('these account settings:', accountSettings);

async function loadPlugin(this: BasementGuardianWorld): Promise<void> {
  await this.loadPlatform();
}

When('the plugin loads', loadPlugin);

function assertRefusal(this: BasementGuardianWorld, reason: string): void {
  assert.deepEqual(this.logged, [`error Not starting: ${reason} ${REFUSAL_ADVICE}`]);
}

Then('the plugin refuses to start because {string}', assertRefusal);

async function assertNoLifecycleListener(this: BasementGuardianWorld): Promise<void> {
  const homebridge = await this.homebridge();

  assert.deepEqual(homebridge.registrations, []);
}

Then('the plugin registers no lifecycle listener', assertNoLifecycleListener);

function assertNoAccessory(this: BasementGuardianWorld): void {
  assert.equal(this.accessoryCount(), 0);
}

Then('the plugin holds no accessory', assertNoAccessory);
