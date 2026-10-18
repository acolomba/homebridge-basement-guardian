// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Steps about the accessory each vendor device becomes: the inventory the vendor
 * reports, what the plugin registers, remembers, and unregisters, and what it explains in the log.
 */

import assert from 'node:assert/strict';

import { Given, Then, When } from '@cucumber/cucumber';

import { HALO_DEVICE_TYPE_ID, HALO_DISPLAY_NAME } from '../../src/device/halo.js';
import { currentAccessory } from '../lib/publishedServices.js';

import type { FakeAccessory } from '../lib/homebridgeApi.js';
import type { ApiDevice } from '../lib/vendorRestApi.js';
import type { BasementGuardianWorld } from '../support/world.js';
import type { DataTable } from '@cucumber/cucumber';

const DEVICE_ID = 'placeholder-gemini';

// A discovery scenario that changes device data mid-scenario waits for the accessory's stored
// state to reach the value a later step just reported, so the deadline is what turns a poll that
// never picked up the change into a named failure rather than a false pass.
const DISCOVERY_CHANGE_DEADLINE_MS = 2000;

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

// The accessory context is whatever the plugin stored, so the device record is read without
// assuming its shape.
function rememberedDeviceTypeId(accessory: FakeAccessory | undefined): unknown {
  const device = accessory?.context.device;

  return typeof device === 'object' && device !== null && 'deviceTypeId' in device ? device.deviceTypeId : undefined;
}

async function applyDevicesFromTable(world: BasementGuardianWorld, table: DataTable): Promise<void> {
  const service = await world.restApi();

  world.devices = table.hashes().map((row) => toDevice(row));
  service.setDevices(world.devices);
}

async function devices(this: BasementGuardianWorld, table: DataTable): Promise<void> {
  await applyDevicesFromTable(this, table);
}

Given('these devices:', devices);

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
    () => rememberedDeviceTypeId(currentAccessory(homebridge)) === deviceTypeId,
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
  'The affected services keep their last valid values until a family-valid update recovers them.';

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
