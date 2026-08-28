import type { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, UnknownContext } from 'homebridge';

/**
 * Observation data that Homebridge persists alongside one restored accessory.
 * The device fields arrive with the accessory adapters.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- named extension point; it is equivalent to its supertype until the device fields land
export interface BasementGuardianAccessoryContext extends UnknownContext {}

/** A Homebridge accessory carrying this plugin's context. */
export type BasementGuardianPlatformAccessory = PlatformAccessory<BasementGuardianAccessoryContext>;

/**
 * Composition root of the dynamic platform.
 *
 * The platform records the accessories Homebridge restores from its cache and
 * does nothing else. It registers no listener, starts no timer, and opens no
 * connection. It also removes nothing: a cached accessory this build cannot
 * explain still belongs to the user's HomeKit (D-03).
 */
export class BasementGuardianPlatform implements DynamicPlatformPlugin {
  readonly accessories = new Map<string, BasementGuardianPlatformAccessory>();

  constructor(
    readonly log: Logging,
    readonly config: PlatformConfig,
    readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);
  }

  /** Records an accessory that Homebridge restored from its cache. */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }
}
