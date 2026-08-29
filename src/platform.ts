import { randomBytes } from 'node:crypto';

import { connect } from 'mqtt';

import { validateConfig } from './config.js';
import { createRedactingLogger } from './logging.js';
import { PROTOCOL } from './protocol.js';
import { createAccountRuntimeFromConfig } from './runtime/accountRuntime.js';
import { systemClock } from './runtime/clock.js';

import type { RedactingLogger } from './logging.js';
import type { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, UnknownContext } from 'homebridge';

/** Length of the salt the token cache fingerprints the account email with. */
const SALT_BYTES = 16;

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
 * An invalid configuration is refused before any listener exists, so the plugin
 * installs and stays quiet rather than starting half-configured (CONF-03). The
 * cloud work begins on `didFinishLaunching` and is released on `shutdown`.
 *
 * The platform removes nothing: a cached accessory this build cannot explain
 * still belongs to the user's HomeKit (D-03).
 */
export class BasementGuardianPlatform implements DynamicPlatformPlugin {
  readonly accessories = new Map<string, BasementGuardianPlatformAccessory>();

  /** The only logger this plugin writes through, so no secret can reach the log. */
  readonly log: RedactingLogger;

  constructor(
    log: Logging,
    readonly config: PlatformConfig,
    readonly api: API,
  ) {
    // Installed before anything else can log, so no secret reaches the
    // delegate unredacted. The refusal below quotes no configured value: it is
    // logged before any secret is registered, and an account email is an
    // account identifier the Privacy constraint keeps out of the log (WR-01).
    // Registering the configured email as a secret first was considered and
    // rejected, because it would hold the raw identifier in the secret list
    // for the life of the process and still leave a marker where a value was.
    // Recording an exception to the Privacy constraint was considered and
    // rejected too: it would weaken a constraint to keep one diagnostic that
    // the settings form's own email format already gives.
    this.log = createRedactingLogger({ delegate: log, secrets: [] });

    const validated = validateConfig(this.config);

    if (!validated.ok) {
      this.log.error(`Not starting: ${validated.reason} Fix it in the Homebridge UI (Plugins -> Basement Guardian -> Settings).`);

      return;
    }

    this.log.registerSecret(validated.config.password);

    // Every collaborator is built through the one seam. The token cache is
    // written under the Homebridge storage directory, so that path comes from
    // Homebridge itself rather than from any configured value (AUTH-02).
    const runtime = createAccountRuntimeFromConfig({
      config: validated.config,
      constants: PROTOCOL,
      storagePath: this.api.user.storagePath(),
      clock: systemClock,
      log: this.log,
      connect,
      createSalt: () => randomBytes(SALT_BYTES).toString('hex'),
    });

    // The cloud work begins on the launch event, never in this constructor, and
    // the shutdown handler is the sole owner of teardown. Both handlers discard
    // their promise: neither start nor stop rejects, so nothing floats and no
    // exception escapes into Homebridge.
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
