import { EveHomeKitTypes } from 'homebridge-lib/EveHomeKitTypes';

import { BasementGuardianAccessory } from './platformAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service, UnknownContext, WithUUID } from 'homebridge';

export interface BasementGuardianDevice {
  customService?: string;
  exampleDisplayName: string;
  exampleUniqueId: string;
}

export interface BasementGuardianAccessoryContext extends UnknownContext {
  device: BasementGuardianDevice;
}

export type BasementGuardianPlatformAccessory = PlatformAccessory<BasementGuardianAccessoryContext>;

export type CustomServiceConstructor = WithUUID<typeof Service> & (new (displayName?: string, subtype?: string) => Service);

const EXAMPLE_DEVICES: readonly BasementGuardianDevice[] = [
  {
    exampleUniqueId: 'ABCD',
    exampleDisplayName: 'Bedroom',
  },
  {
    exampleUniqueId: 'EFGH',
    exampleDisplayName: 'Kitchen',
  },
  {
    exampleUniqueId: 'IJKL',
    exampleDisplayName: 'Backyard',
    customService: 'AirPressureSensor',
  },
];

/**
 * Main Homebridge dynamic platform. Device discovery and registration belong here.
 */
export class BasementGuardianPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly accessories = new Map<string, BasementGuardianPlatformAccessory>();
  public readonly discoveredCacheUUIDs: string[] = [];
  public readonly CustomServices: Record<string, CustomServiceConstructor>;
  public readonly CustomCharacteristics: Record<string, WithUUID<typeof Characteristic>>;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    const eveHomeKitTypes = new EveHomeKitTypes(this.api);
    this.CustomServices = eveHomeKitTypes.Services as Record<string, CustomServiceConstructor>;
    this.CustomCharacteristics = eveHomeKitTypes.Characteristics as Record<string, WithUUID<typeof Characteristic>>;

    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  /** Restore an accessory cached by Homebridge. */
  public configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    const basementAccessory = accessory as BasementGuardianPlatformAccessory;
    this.accessories.set(accessory.UUID, basementAccessory);
  }

  /** Discover devices, register new accessories, and remove stale cached accessories. */
  public discoverDevices(): void {
    for (const device of EXAMPLE_DEVICES) {
      this.discoverDevice(device);
    }

    this.removeStaleAccessories();
  }

  private discoverDevice(device: BasementGuardianDevice): void {
    const uuid = this.api.hap.uuid.generate(device.exampleUniqueId);
    const existingAccessory = this.accessories.get(uuid);

    if (existingAccessory === undefined) {
      this.registerAccessory(device, uuid);
    } else {
      this.restoreAccessory(device, existingAccessory);
    }

    this.discoveredCacheUUIDs.push(uuid);
  }

  private registerAccessory(device: BasementGuardianDevice, uuid: string): void {
    this.log.info('Adding new accessory:', device.exampleDisplayName);

    const accessory = new this.api.platformAccessory<BasementGuardianAccessoryContext>(device.exampleDisplayName, uuid);
    accessory.context.device = device;

    new BasementGuardianAccessory(this, accessory);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }

  private restoreAccessory(device: BasementGuardianDevice, accessory: BasementGuardianPlatformAccessory): void {
    this.log.info('Restoring existing accessory from cache:', accessory.displayName);
    accessory.context.device = device;
    this.api.updatePlatformAccessories([accessory]);
    new BasementGuardianAccessory(this, accessory);
  }

  private removeStaleAccessories(): void {
    for (const [uuid, accessory] of this.accessories) {
      if (!this.discoveredCacheUUIDs.includes(uuid)) {
        this.log.info('Removing existing accessory from cache:', accessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
