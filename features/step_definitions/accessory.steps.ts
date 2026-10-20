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

import { createServiceCatalogue } from '../../src/accessories/serviceCatalogue.js';
import { HALO_DEVICE_TYPE_ID, HALO_DISPLAY_NAME } from '../../src/device/halo.js';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../src/settings.js';
import { currentAccessory, pushedValue, serviceOf } from '../lib/publishedServices.js';

import type { FakeServiceClass } from '../lib/hap.js';
import type { FakeAccessory } from '../lib/homebridgeApi.js';
import type { ApiDevice } from '../lib/vendorRestApi.js';
import type { BasementGuardianWorld } from '../support/world.js';
import type { DataTable } from '@cucumber/cucumber';
import type { API } from 'homebridge';

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

interface DeviceRow {
  deviceId: string;
  name: string;
  deviceTypeId?: string;
  waterLevel?: string;
}

const DEVICE_COLUMNS: ReadonlyMap<string, keyof DeviceRow> = new Map([
  ['deviceId', 'deviceId'],
  ['device id', 'deviceId'],
  ['name', 'name'],
  ['deviceTypeId', 'deviceTypeId'],
  ['device type id', 'deviceTypeId'],
  ['waterLevel', 'waterLevel'],
  ['water level', 'waterLevel'],
]);

function parseDevices(table: DataTable): readonly ApiDevice[] {
  const [headers, ...rows] = table.raw();

  if (headers === undefined) {
    throw new Error('a device table needs a header');
  }

  const fields = headers.map((header) => {
    const field = DEVICE_COLUMNS.get(header);

    if (field === undefined) {
      throw new Error(`unknown device column: ${header}`);
    }

    return field;
  });

  if (new Set(fields).size !== fields.length || !fields.includes('deviceId') || !fields.includes('name')) {
    throw new Error('a device table needs one device id and one name column, with no repeated field');
  }

  return rows.map((cells, index) => {
    if (cells.length !== fields.length) {
      throw new Error(`device row ${String(index + 1)} has ${String(cells.length)} cells; expected ${String(fields.length)}`);
    }

    const values: Partial<Record<keyof DeviceRow, string>> = {};

    for (const [column, field] of fields.entries()) {
      const value = cells[column];

      if (value === undefined || value.trim() === '') {
        throw new Error(`device row ${String(index + 1)} needs a value for ${field}`);
      }

      values[field] = value;
    }

    if (values.deviceId === undefined || values.name === undefined) {
      throw new Error(`device row ${String(index + 1)} needs a device id and a name`);
    }

    const row: DeviceRow = { deviceId: values.deviceId, name: values.name };

    if (values.deviceTypeId !== undefined) {
      row.deviceTypeId = values.deviceTypeId;
    }

    if (values.waterLevel !== undefined) {
      row.waterLevel = values.waterLevel;
    }

    return toDevice(row);
  });
}

// An optional water level overrides one otherwise valid field, so a scenario can supply an
// out-of-domain value without repeating every required telemetry field.
function withWaterLevelOverride(telemetry: Readonly<Record<string, unknown>>, row: DeviceRow): Readonly<Record<string, unknown>> {
  if (row.waterLevel === undefined) {
    return telemetry;
  }

  const level = Number(row.waterLevel);

  if (!Number.isFinite(level)) {
    throw new Error(`water level must be numeric: ${row.waterLevel}`);
  }

  return { ...telemetry, water_level: level };
}

function toDevice(row: DeviceRow): ApiDevice {
  const deviceTypeId = row.deviceTypeId ?? DEFAULT_DEVICE_TYPE_ID;
  const telemetry = deviceTypeId === DEFAULT_DEVICE_TYPE_ID ? VALID_GEMINI_TELEMETRY : {};

  return {
    deviceId: row.deviceId,
    deviceTypeId,
    name: row.name,
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

  world.devices = parseDevices(table);
  service.setDevices(world.devices);
}

Given('these devices:', async function (this: BasementGuardianWorld, table: DataTable): Promise<void> {
  await applyDevicesFromTable(this, table);
});

When('the vendor reports these devices:', async function (this: BasementGuardianWorld, table: DataTable): Promise<void> {
  await applyDevicesFromTable(this, table);
});

When('the vendor reports no devices', async function (this: BasementGuardianWorld): Promise<void> {
  const service = await this.restApi();

  service.setDevices([]);
});

// Arms exactly the next N `/devices` GET responses as an empty inventory,
// then falls back to the standing device list a scenario already set. This
// scripts the confirming poll and its own out-of-band final-check fetch
// (DEV-05) independently: the two happen back to back with no
// scenario-controllable gap between them, so only request order -- not real
// time -- can distinguish them.
When('the vendor omits the device from the next {int} inventory checks', async function (this: BasementGuardianWorld, count: number): Promise<void> {
  const service = await this.restApi();

  for (let check = 0; check < count; check += 1) {
    service.armDevicesAnswer([]);
  }
});

// Arms exactly the next `/devices` GET response with these devices, then falls back to the
// standing device list a scenario already set. This lands a chosen inventory on one specific poll
// regardless of how many polls a short interval has already run in the background, so a scenario
// can prove what a later, distinct poll sees rather than racing a real poll timer.
When('the vendor reports these devices for the next inventory check:', async function (this: BasementGuardianWorld, table: DataTable): Promise<void> {
  const service = await this.restApi();

  service.armDevicesAnswer(parseDevices(table));
});

When('the user renames the accessory to {string} in the home app', async function (this: BasementGuardianWorld, name: string): Promise<void> {
  const homebridge = await this.homebridge();
  const accessory = currentAccessory(homebridge);

  if (accessory === undefined) {
    throw new Error('no accessory has been registered yet');
  }

  accessory.displayName = name;
});

const EXPECTED_MANUFACTURER = 'Wayne';
const EXPECTED_MODEL = 'Gemini';
const EXPECTED_SERIAL_NUMBER = 'placeholder-serial-number';
const EXPECTED_FIRMWARE_REVISION = 'unknown';
const EXPECTED_GEMINI_SERVICE_KINDS: readonly string[] = [
  'sump-pit-flood',
  'sump-pit-level',
  'primary-pump',
  'primary-pump-running',
  'backup-pump',
  'backup-pump-running',
  'sump-mains-power',
  'mains-power-lost',
  'backup-battery',
  'backup-battery',
  'primary-pump-fault',
  'backup-pump-fault',
  'water-sensor-fault',
  'pump-controller-link-lost',
  'system-self-test',
  'alarm-mute',
  'basement-guardian-offline',
];

async function assertOneAccessoryWithTruthfulAccessoryInformation(world: BasementGuardianWorld): Promise<void> {
  const homebridge = await world.homebridge();

  assert.equal(homebridge.registerPlatformAccessoryCalls.length, 1);

  const call = homebridge.registerPlatformAccessoryCalls[0];
  const accessories = call?.accessories ?? [];

  assert.equal(call?.pluginIdentifier, PLUGIN_NAME);
  assert.equal(call.platformName, PLATFORM_NAME);
  assert.equal(accessories.length, 1);
  assert.equal(accessories[0]?.UUID, homebridge.hap.uuid.generate(DEVICE_ID));
  assert.deepEqual(accessories[0].context.device, {
    deviceId: DEVICE_ID,
    deviceTypeId: world.devices.find((device) => device.deviceId === DEVICE_ID)?.deviceTypeId,
  });

  const accessoryInformation = accessories[0].getService(homebridge.hap.Service.AccessoryInformation);
  const catalogue = createServiceCatalogue(homebridge.hap as unknown as API['hap']);
  assert.deepEqual(
    catalogue.map((row) => row.kind),
    EXPECTED_GEMINI_SERVICE_KINDS,
  );
  assert.deepEqual(
    accessories[0].services.map((service) => [service.displayName, service.UUID, service.subtype]),
    [['', homebridge.hap.Service.AccessoryInformation.UUID, undefined], ...catalogue.map((row) => [row.displayName, row.serviceClass.UUID, row.subtype])],
  );

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

Then('the plugin registers one accessory with a truthful accessory information service', async function (this: BasementGuardianWorld): Promise<void> {
  await assertOneAccessoryWithTruthfulAccessoryInformation(this);
});

const HALO_ROW_DEVICE_ID = 'placeholder-halo';
const UNKNOWN_ROW_DEVICE_ID = 'placeholder-other';
const UNKNOWN_ROW_DEVICE_TYPE_ID = 'wayneWaterUnknown';

const EXPECTED_HALO_EXPLANATION =
  `info Skipping ${HALO_ROW_DEVICE_ID}: ${HALO_DISPLAY_NAME} (${HALO_DEVICE_TYPE_ID}) ` + 'is a recognized but unsupported device family.';
const EXPECTED_UNKNOWN_EXPLANATION = `info Skipping ${UNKNOWN_ROW_DEVICE_ID}: ${UNKNOWN_ROW_DEVICE_TYPE_ID} is not a recognized device family.`;

// Asserted after every poll a scenario forces, so a repeat proves the explanation logs once per
// device per run rather than once per poll (D-05).
function assertHaloAndUnknownExplainedOnceEach(world: BasementGuardianWorld): void {
  assert.deepEqual(
    world.logged.filter((line) => line === EXPECTED_HALO_EXPLANATION || line === EXPECTED_UNKNOWN_EXPLANATION),
    [EXPECTED_HALO_EXPLANATION, EXPECTED_UNKNOWN_EXPLANATION],
  );
}

Then('the plugin explains the halo and the unknown device once each', function (this: BasementGuardianWorld): void {
  assertHaloAndUnknownExplainedOnceEach(this);
});

// Waits for the accessory's stored vendor name to advance to what a scenario just reported, which
// only happens once a discovery poll has actually applied the new device data (D-030). A scenario
// asserts this before reading `displayName`, so that read is never a race against the poll.
async function assertAccessoryRemembersVendorName(world: BasementGuardianWorld, name: string): Promise<void> {
  const homebridge = await world.homebridge();

  await world.untilTrue(
    () => currentAccessory(homebridge)?.context.lastVendorName === name,
    DISCOVERY_CHANGE_DEADLINE_MS,
    `the accessory never remembered the vendor name ${name}`,
  );
}

Then('the accessory remembers the vendor name {string}', async function (this: BasementGuardianWorld, name: string): Promise<void> {
  await assertAccessoryRemembersVendorName(this, name);
});

async function assertAccessoryDisplayName(world: BasementGuardianWorld, name: string): Promise<void> {
  const homebridge = await world.homebridge();

  assert.equal(currentAccessory(homebridge)?.displayName, name);
}

Then('the accessory is named {string}', async function (this: BasementGuardianWorld, name: string): Promise<void> {
  await assertAccessoryDisplayName(this, name);
});

// Waits for the accessory's stored deviceTypeId to advance to what a scenario just reported, which
// only happens once a discovery poll has refreshed the context of the same, already-cached
// accessory (DEV-04). Also proves the accessory context was actually refreshed rather than left
// untouched, which a bare register-count assertion cannot tell apart.
async function assertAccessoryRemembersDeviceType(world: BasementGuardianWorld, deviceTypeId: string): Promise<void> {
  const homebridge = await world.homebridge();

  await world.untilTrue(
    () => rememberedDeviceTypeId(currentAccessory(homebridge)) === deviceTypeId,
    DISCOVERY_CHANGE_DEADLINE_MS,
    `the accessory never remembered the device type ${deviceTypeId}`,
  );
}

Then('the accessory remembers the device type {string}', async function (this: BasementGuardianWorld, deviceTypeId: string): Promise<void> {
  await assertAccessoryRemembersDeviceType(this, deviceTypeId);
});

async function assertCachedGeminiServicesInactive(world: BasementGuardianWorld): Promise<void> {
  const homebridge = await world.homebridge();
  const accessory = currentAccessory(homebridge);
  const rows = createServiceCatalogue(homebridge.hap as unknown as API['hap']).filter((row) => row.kind !== 'basement-guardian-offline');

  assert.deepEqual(
    rows.map((row) =>
      pushedValue(
        accessory?.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype)?.getCharacteristic(homebridge.hap.Characteristic.StatusActive),
      ),
    ),
    rows.map(() => false),
  );
}

Then('the cached Gemini services are inactive', async function (this: BasementGuardianWorld): Promise<void> {
  await assertCachedGeminiServicesInactive(this);
});

async function assertPluginUnregistersTheAccessory(world: BasementGuardianWorld): Promise<void> {
  const homebridge = await world.homebridge();

  await world.untilTrue(
    () => homebridge.unregisterPlatformAccessoryCalls.length > 0,
    DISCOVERY_CHANGE_DEADLINE_MS,
    'the plugin never unregistered the accessory',
  );

  assert.deepEqual(
    homebridge.unregisterPlatformAccessoryCalls.map((call) => ({
      pluginIdentifier: call.pluginIdentifier,
      platformName: call.platformName,
      uuids: call.accessories.map((accessory) => accessory.UUID),
    })),
    [{ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, uuids: [homebridge.hap.uuid.generate(DEVICE_ID)] }],
  );
  assert.equal(currentAccessory(homebridge), undefined);
  assert.equal(serviceOf(homebridge, 'Sump Pit Flood'), undefined);
}

Then('the plugin unregisters the accessory', async function (this: BasementGuardianWorld): Promise<void> {
  await assertPluginUnregistersTheAccessory(this);
});

async function assertPluginNeverUnregistersTheAccessory(world: BasementGuardianWorld): Promise<void> {
  const homebridge = await world.homebridge();

  assert.equal(homebridge.unregisterPlatformAccessoryCalls.length, 0);
}

Then('the plugin never unregisters the accessory', async function (this: BasementGuardianWorld): Promise<void> {
  await assertPluginNeverUnregistersTheAccessory(this);
});

const EXPECTED_DEGRADATION_EXPLANATION =
  `warn Degraded ${DEVICE_ID}: the profile or payload stopped validating. ` +
  'The affected services keep their last valid values until a family-valid update recovers them.';

// Waits for the poll that carries the out-of-domain telemetry to actually run, then asserts the
// degradation transition logged exactly once (DEV-08) -- not once per poll.
async function assertPluginExplainsTheDegradationOnce(world: BasementGuardianWorld): Promise<void> {
  await world.untilTrue(
    () => world.logged.includes(EXPECTED_DEGRADATION_EXPLANATION),
    DISCOVERY_CHANGE_DEADLINE_MS,
    'the plugin never logged the degradation explanation',
  );

  assert.deepEqual(
    world.logged.filter((line) => line === EXPECTED_DEGRADATION_EXPLANATION),
    [EXPECTED_DEGRADATION_EXPLANATION],
  );
}

Then('the plugin explains the degradation once', async function (this: BasementGuardianWorld): Promise<void> {
  await assertPluginExplainsTheDegradationOnce(this);
});
