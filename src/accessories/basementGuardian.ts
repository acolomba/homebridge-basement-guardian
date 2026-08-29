/**
 * @fileoverview One physical Basement Guardian system, published to HomeKit as
 * one accessory carrying several services.
 *
 * The accessory owns HomeKit and nothing else. It answers reads from cached
 * domain state and pushes characteristic updates; it never sees a raw vendor
 * payload, a shadow document, or a retry policy. Its identity is seeded by the
 * vendor `deviceId`, which is immutable: a device that starts reporting a
 * different `deviceTypeId` selects a different adapter but stays the same
 * physical accessory, so the user's automations survive.
 *
 * `update()` never calls a family's `decode()` on a snapshot whose
 * `validate()` returned invalid, and it never adds a second
 * `AccessoryInformation` service: every `PlatformAccessory` already carries
 * one from its own construction.
 */

import type { ServiceDescriptor } from './services.js';
import type { FamilyRegistry } from '../device/registry.js';
import type { DeviceSnapshot } from '../device/state.js';
import type { API, Logging, PlatformAccessory } from 'homebridge';

/** One physical system as HomeKit sees it. */
export interface BasementGuardianAccessory {
  /** The vendor identifier that seeds the accessory UUID. It never changes. */
  readonly deviceId: string;
  /** Every service this accessory publishes, in a stable order. */
  readonly services: readonly ServiceDescriptor[];
  /**
   * Applies one canonical snapshot to the published characteristics.
   *
   * This is the only way state reaches HomeKit, so a value the accessory does
   * not receive here is a value HomeKit does not show.
   */
  update(snapshot: DeviceSnapshot): void;
}

/** Everything the accessory factory needs, by injection. */
export interface BasementGuardianAccessoryOptions {
  accessory: PlatformAccessory;
  hap: API['hap'];
  registry: FamilyRegistry;
  log: Logging;
}

// No literal manufacturer or model string exists on the wire, so these are
// documented plugin-side literals derived from the vendor's `deviceTypeId`
// (`wayneWaterGemini`) and `attributes.productLine` (`wayneWater`), not a
// vendor-reported value.
const MANUFACTURER = 'Wayne';
const MODEL = 'Gemini';

// `mcu_firmware_version` is the only source for `FirmwareRevision`: the MCU
// governs pump control and is the safety-relevant firmware, so it is never
// compared against or blended with `wifi_firmware_version`.
const UNKNOWN_FIRMWARE = 'unknown';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDeviceContext(value: unknown): value is { deviceId: string; deviceTypeId: string } {
  return isRecord(value) && typeof value.deviceId === 'string' && typeof value.deviceTypeId === 'string';
}

function deviceIdOf(accessory: PlatformAccessory): string {
  const context: unknown = accessory.context;
  const device = isRecord(context) ? context.device : undefined;

  if (!isDeviceContext(device)) {
    throw new Error('the accessory context carries no device identity; the platform must set context.device before creating the accessory');
  }

  return device.deviceId;
}

// `decode()` is generic over the family, so the decoded value arrives here as
// `unknown`. Reading `metadata.mcuFirmwareVersion` structurally, rather than
// importing Gemini's own type, keeps this module ignorant of any one
// family's shape (D-003); a family without that shape simply reports
// `undefined` here rather than throwing.
function firmwareRevisionOf(decoded: unknown): string {
  const metadata = isRecord(decoded) ? decoded.metadata : undefined;
  const mcuFirmwareVersion = isRecord(metadata) ? metadata.mcuFirmwareVersion : undefined;

  return typeof mcuFirmwareVersion === 'string' ? mcuFirmwareVersion : UNKNOWN_FIRMWARE;
}

// Every `PlatformAccessory` already carries this service from its own
// construction, so it is fetched here and never added again.
function populateAccessoryInformation(accessory: PlatformAccessory, hap: API['hap'], snapshot: DeviceSnapshot, decoded: unknown): void {
  const accessoryInformation = accessory.getService(hap.Service.AccessoryInformation);

  if (accessoryInformation === undefined) {
    throw new Error('the accessory carries no AccessoryInformation service, which every constructed PlatformAccessory provides');
  }

  accessoryInformation
    .setCharacteristic(hap.Characteristic.Manufacturer, MANUFACTURER)
    .setCharacteristic(hap.Characteristic.Model, MODEL)
    .setCharacteristic(hap.Characteristic.SerialNumber, snapshot.identity.serialNumber)
    .setCharacteristic(hap.Characteristic.FirmwareRevision, firmwareRevisionOf(decoded));
}

/**
 * Builds one Basement Guardian accessory over an already-constructed
 * `PlatformAccessory`.
 *
 * The factory reads no vendor payload itself: `update()` reaches the family
 * registry for validation and decoding, and every value it publishes traces
 * to a field the family adapter already confirmed.
 */
export function createBasementGuardianAccessory(options: BasementGuardianAccessoryOptions): BasementGuardianAccessory {
  const { accessory, hap, registry } = options;
  const deviceId = deviceIdOf(accessory);

  return {
    deviceId,
    services: [],

    update(snapshot: DeviceSnapshot): void {
      const outcome = registry.lookup(snapshot.identity.deviceTypeId);

      if (outcome.kind !== 'implemented') {
        return;
      }

      const validation = outcome.family.validate(snapshot);

      if (!validation.valid) {
        return;
      }

      const decoded = outcome.family.decode(snapshot);
      populateAccessoryInformation(accessory, hap, snapshot, decoded);
    },
  };
}
