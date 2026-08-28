import { createCloudApi } from './cloud/api.js';
import { createAuthClient } from './cloud/auth.js';
import { validateConfig } from './config.js';
import { createDeviceStateStore } from './device/state.js';
import { PROTOCOL } from './protocol.js';
import { createAccountRuntime } from './runtime/accountRuntime.js';
import { systemClock } from './runtime/clock.js';

import type { BgConfig } from './config.js';
import type { AccountRuntime } from './runtime/accountRuntime.js';
import type { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, UnknownContext } from 'homebridge';

/** Deadline applied to each vendor request. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Observation data that Homebridge persists alongside one restored accessory.
 * The device fields arrive with the accessory adapters.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- named extension point; it is equivalent to its supertype until the device fields land
export interface BasementGuardianAccessoryContext extends UnknownContext {}

/** A Homebridge accessory carrying this plugin's context. */
export type BasementGuardianPlatformAccessory = PlatformAccessory<BasementGuardianAccessoryContext>;

// Manual constructor injection: every collaborator is built here and nowhere
// else. None of these factories opens a connection, reads a file, or starts a
// timer, so building them costs nothing until the runtime starts.
function createRuntime(config: BgConfig, log: Logging): AccountRuntime {
  const clock = systemClock;
  const auth = createAuthClient({
    constants: PROTOCOL,
    clientId: config.clientId,
    email: config.email,
    password: config.password,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    clock,
    log,
  });
  const api = createCloudApi({ baseUrl: PROTOCOL.apiUrl, auth, requestTimeoutMs: REQUEST_TIMEOUT_MS });

  return createAccountRuntime({ api, store: createDeviceStateStore({ clock, log }), clock, log });
}

/**
 * Composition root of the dynamic platform.
 *
 * An invalid configuration is refused before any listener exists, so the plugin
 * installs and stays quiet rather than starting half-configured (CONF-03). The
 * cloud work begins on `didFinishLaunching` and is released on `shutdown`.
 *
 * The platform removes nothing: a cached accessory this build cannot explain
 * still belongs to the user's HomeKit (D-03).
 */
export class BasementGuardianPlatform implements DynamicPlatformPlugin {
  readonly accessories = new Map<string, BasementGuardianPlatformAccessory>();

  constructor(
    readonly log: Logging,
    readonly config: PlatformConfig,
    readonly api: API,
  ) {
    const validated = validateConfig(this.config);

    if (!validated.ok) {
      this.log.error(`Not starting: ${validated.reason} Fix it in the Homebridge UI (Plugins -> Basement Guardian -> Settings).`);

      return;
    }

    const runtime = createRuntime(validated.config, this.log);

    // Both handlers discard their promise: neither start nor stop rejects, so
    // nothing floats and no exception escapes into Homebridge.
    this.api.on('didFinishLaunching', () => {
      void runtime.start();
    });

    this.api.on('shutdown', () => {
      void runtime.stop();
    });
  }

  /** Records an accessory that Homebridge restored from its cache. */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }
}
