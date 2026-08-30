/**
 * @fileoverview Minimal Homebridge API stand-in.
 *
 * The stand-in carries what the plugin reads while it registers accessories: the HAP namespace,
 * the storage path, the two lifecycle events, the accessory constructor, and the three
 * accessory-registration calls. The HAP namespace is a hand-built stand-in rather than the real
 * `@homebridge/hap-nodejs`, matching every other external boundary in this codebase: it carries
 * only the `Service`/`Characteristic` identifiers and the `uuid.generate` behavior a scenario
 * needs, not a faithful reimplementation of HAP-NodeJS itself.
 */

import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { API } from 'homebridge';

type LifecycleEvent = 'didFinishLaunching' | 'shutdown';

/** A fake `Service`/`Characteristic` identifier. Stable and unique per kind, never per instance. */
export interface FakeIdentifier {
  readonly UUID: string;
}

/** A minimal, hand-built stand-in for a HAP `Service`. */
export interface FakeService {
  readonly UUID: string;
  readonly subtype: string | undefined;
  setCharacteristic(identifier: FakeIdentifier, value: unknown): FakeService;
  getCharacteristic(identifier: FakeIdentifier): unknown;
}

/** A minimal, hand-built stand-in for a HAP `PlatformAccessory`. */
export interface FakeAccessory {
  displayName: string;
  readonly UUID: string;
  readonly context: Record<string, unknown>;
  getService(identifier: FakeIdentifier): FakeService | undefined;
  getServiceById(identifier: FakeIdentifier, subtype: string): FakeService | undefined;
  addService(identifier: FakeIdentifier, subtype?: string): FakeService;
}

/** One call a scenario's plugin made to `registerPlatformAccessories`. */
export interface RegisterPlatformAccessoriesCall {
  readonly pluginIdentifier: string;
  readonly platformName: string;
  readonly accessories: readonly FakeAccessory[];
}

/** One call a scenario's plugin made to `updatePlatformAccessories`. */
export interface UpdatePlatformAccessoriesCall {
  readonly accessories: readonly FakeAccessory[];
}

/** One call a scenario's plugin made to `unregisterPlatformAccessories`. */
export interface UnregisterPlatformAccessoriesCall {
  readonly pluginIdentifier: string;
  readonly platformName: string;
  readonly accessories: readonly FakeAccessory[];
}

/** A Homebridge API stand-in whose lifecycle a scenario drives. */
export interface FakeHomebridgeApi {
  readonly api: API;
  readonly storagePath: string;

  /** Every lifecycle event a listener was registered for, in registration order. */
  readonly registrations: readonly string[];

  /** Every `registerPlatformAccessories` call the plugin made, in call order. */
  readonly registerPlatformAccessoryCalls: readonly RegisterPlatformAccessoriesCall[];

  /** Every `updatePlatformAccessories` call the plugin made, in call order. */
  readonly updatePlatformAccessoryCalls: readonly UpdatePlatformAccessoriesCall[];

  /** Every `unregisterPlatformAccessories` call the plugin made, in call order. */
  readonly unregisterPlatformAccessoryCalls: readonly UnregisterPlatformAccessoriesCall[];

  /** Runs the handlers registered for a lifecycle event and awaits what each one returns. */
  emit(event: 'didFinishLaunching' | 'shutdown'): Promise<void>;

  /** Removes the temporary storage directory. */
  cleanup(): Promise<void>;
}

const SERVICE_ACCESSORY_INFORMATION: FakeIdentifier = { UUID: 'fake-service-accessory-information' };

const CHARACTERISTIC_MANUFACTURER: FakeIdentifier = { UUID: 'fake-characteristic-manufacturer' };
const CHARACTERISTIC_MODEL: FakeIdentifier = { UUID: 'fake-characteristic-model' };
const CHARACTERISTIC_SERIAL_NUMBER: FakeIdentifier = { UUID: 'fake-characteristic-serial-number' };
const CHARACTERISTIC_FIRMWARE_REVISION: FakeIdentifier = { UUID: 'fake-characteristic-firmware-revision' };
const CHARACTERISTIC_NAME: FakeIdentifier = { UUID: 'fake-characteristic-name' };
const CHARACTERISTIC_IDENTIFY: FakeIdentifier = { UUID: 'fake-characteristic-identify' };

/**
 * The fake `hap` namespace: enough of `Service`, `Characteristic`, and `uuid` for the accessory
 * adapters to run against, hand-built rather than imported from `@homebridge/hap-nodejs`.
 */
const hap = {
  Service: {
    AccessoryInformation: SERVICE_ACCESSORY_INFORMATION,
  },
  Characteristic: {
    Manufacturer: CHARACTERISTIC_MANUFACTURER,
    Model: CHARACTERISTIC_MODEL,
    SerialNumber: CHARACTERISTIC_SERIAL_NUMBER,
    FirmwareRevision: CHARACTERISTIC_FIRMWARE_REVISION,
    Name: CHARACTERISTIC_NAME,
    Identify: CHARACTERISTIC_IDENTIFY,
  },
  uuid: {
    // Deterministic (same input -> same output, different input -> different output), never HAP's
    // real v5 derivation: the harness needs a stable, injectable stand-in, not the production
    // algorithm.
    generate(data: string): string {
      return createHash('sha1').update(data).digest('hex');
    },
  },
};

/** A minimal, hand-built stand-in for a HAP `Service`, backed by a `Map` a test can read back. */
class HarnessService implements FakeService {
  readonly UUID: string;

  readonly subtype: string | undefined;

  private readonly characteristics = new Map<string, unknown>();

  constructor(identifier: FakeIdentifier, subtype?: string) {
    this.UUID = identifier.UUID;
    this.subtype = subtype;
  }

  setCharacteristic(identifier: FakeIdentifier, value: unknown): FakeService {
    this.characteristics.set(identifier.UUID, value);

    return this;
  }

  getCharacteristic(identifier: FakeIdentifier): unknown {
    return this.characteristics.get(identifier.UUID);
  }
}

/** The accessory identity the plugin supplies, extended with the service surface the accessory adapters need. */
class HarnessPlatformAccessory implements FakeAccessory {
  readonly context: Record<string, unknown> = {};

  private readonly services: HarnessService[] = [];

  constructor(
    public displayName: string,
    readonly UUID: string,
  ) {
    // Mirrors the real `Accessory` constructor, which always adds one
    // `AccessoryInformation` service before any accessory adapter runs.
    this.addService(hap.Service.AccessoryInformation);
  }

  getService(identifier: FakeIdentifier): FakeService | undefined {
    return this.services.find((service) => service.UUID === identifier.UUID && service.subtype === undefined);
  }

  getServiceById(identifier: FakeIdentifier, subtype: string): FakeService | undefined {
    return this.services.find((service) => service.UUID === identifier.UUID && service.subtype === subtype);
  }

  addService(identifier: FakeIdentifier, subtype?: string): FakeService {
    const collision = subtype === undefined && this.services.some((service) => service.UUID === identifier.UUID);

    if (collision) {
      throw new Error(`Cannot add a Service with the same UUID '${identifier.UUID}' without also defining a unique 'subtype' property.`);
    }

    const service = new HarnessService(identifier, subtype);
    this.services.push(service);

    return service;
  }
}

/** Starts a Homebridge API stand-in with its own temporary storage directory. */
export async function createFakeHomebridgeApi(): Promise<FakeHomebridgeApi> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-'));
  const handlers = new Map<LifecycleEvent, (() => unknown)[]>();
  const registrations: string[] = [];
  const registerPlatformAccessoryCalls: RegisterPlatformAccessoriesCall[] = [];
  const updatePlatformAccessoryCalls: UpdatePlatformAccessoriesCall[] = [];
  const unregisterPlatformAccessoryCalls: UnregisterPlatformAccessoriesCall[] = [];

  const standIn = {
    hap,
    user: { storagePath: () => storagePath },
    platformAccessory: HarnessPlatformAccessory,
    on(event: LifecycleEvent, listener: () => void) {
      const listeners = handlers.get(event) ?? [];

      registrations.push(event);
      listeners.push(listener);
      handlers.set(event, listeners);

      return this;
    },
    registerPlatformAccessories(pluginIdentifier: string, platformName: string, accessories: FakeAccessory[]) {
      registerPlatformAccessoryCalls.push({ pluginIdentifier, platformName, accessories: [...accessories] });
    },
    updatePlatformAccessories(accessories: FakeAccessory[]) {
      updatePlatformAccessoryCalls.push({ accessories: [...accessories] });
    },
    unregisterPlatformAccessories(pluginIdentifier: string, platformName: string, accessories: FakeAccessory[]) {
      unregisterPlatformAccessoryCalls.push({ pluginIdentifier, platformName, accessories: [...accessories] });
    },
  };

  return {
    // The stand-in answers the members the plugin reads and nothing else, which no structural type
    // can express. Reading any other member surfaces as a TypeError that names it, which is the
    // failure this harness wants while more of the accessory work is still ahead.
    api: standIn as unknown as API,
    storagePath,
    registrations,
    registerPlatformAccessoryCalls,
    updatePlatformAccessoryCalls,
    unregisterPlatformAccessoryCalls,
    async emit(event: 'didFinishLaunching' | 'shutdown'): Promise<void> {
      for (const listener of handlers.get(event) ?? []) {
        await listener();
      }
    },
    async cleanup(): Promise<void> {
      await rm(storagePath, { recursive: true, force: true });
    },
  };
}
