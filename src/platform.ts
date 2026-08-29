import { randomBytes } from 'node:crypto';

import { connect } from 'mqtt';

import { createBasementGuardianAccessory } from './accessories/basementGuardian.js';
import { validateConfig } from './config.js';
import { createFamilyRegistry } from './device/registry.js';
import { createRedactingLogger } from './logging.js';
import { PROTOCOL } from './protocol.js';
import { createAccountRuntimeFromConfig } from './runtime/accountRuntime.js';
import { systemClock } from './runtime/clock.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

import type { FamilyOutcome, FamilyRegistry } from './device/registry.js';
import type { DeviceStateStore } from './device/state.js';
import type { RedactingLogger } from './logging.js';
import type { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, UnknownContext } from 'homebridge';

/** Length of the salt the token cache fingerprints the account email with. */
const SALT_BYTES = 16;

/**
 * Observation data that Homebridge persists alongside one restored accessory.
 *
 * `device` is optional so an accessory restored from before this field
 * existed does not fail its structural type; the platform sets it on every
 * accessory it creates from now on.
 */
export interface BasementGuardianAccessoryContext extends UnknownContext {
  device?: { deviceId: string; deviceTypeId: string };
}

/** A Homebridge accessory carrying this plugin's context. */
export type BasementGuardianPlatformAccessory = PlatformAccessory<BasementGuardianAccessoryContext>;

/** Everything registering newly discovered devices needs. */
export interface DiscoveryContext {
  api: API;
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  registry: FamilyRegistry;
  log: Logging;
}

// A HALO or unknown outcome never becomes an accessory (DEV-01), so the
// explanation is the only trace it leaves. Distinct wording for each kind is
// what lets a reader tell "recognized but unsupported" apart from "never
// seen", and naming the deviceId and deviceTypeId is what makes the line
// actionable rather than merely present.
function explainSkippedDevice(log: Logging, deviceId: string, outcome: Exclude<FamilyOutcome<unknown>, { kind: 'implemented' }>): void {
  if (outcome.kind === 'unsupported') {
    log.info(`Skipping ${deviceId}: ${outcome.displayName} (${outcome.deviceTypeId}) is a recognized but unsupported device family.`);

    return;
  }

  log.info(`Skipping ${deviceId}: ${outcome.deviceTypeId} is not a recognized device family.`);
}

/**
 * Dispatches every discovered device through the family registry, registering
 * one HomeKit accessory for each implemented device this platform has not
 * already registered.
 *
 * The accessory UUID is seeded only from `deviceId`, never a mutable field
 * (C-002), so a `deviceId` already present in `accessories` is left
 * untouched here: only a genuinely new physical device gets a new accessory.
 * A HALO or unknown-`deviceTypeId` device is explained through the registry's
 * log-cadence tracking and never registered (DEV-01); one device's outcome
 * never stops the loop from dispatching the rest. Exported so the harness
 * that proves this end to end drives the identical logic a real platform
 * runs, rather than a parallel copy of it.
 */
export function registerDiscoveredDevices(context: DiscoveryContext, deviceIds: readonly string[], store: DeviceStateStore): void {
  for (const deviceId of deviceIds) {
    const uuid = context.api.hap.uuid.generate(deviceId);

    if (context.accessories.has(uuid)) {
      continue;
    }

    const snapshot = store.snapshot(deviceId);

    if (snapshot === undefined) {
      continue;
    }

    const outcome = context.registry.lookup(snapshot.identity.deviceTypeId);

    if (outcome.kind !== 'implemented') {
      if (context.registry.shouldLog(deviceId, snapshot.identity.deviceTypeId)) {
        explainSkippedDevice(context.log, deviceId, outcome);
      }

      continue;
    }

    const accessory = new context.api.platformAccessory<BasementGuardianAccessoryContext>(snapshot.identity.name, uuid);
    accessory.context.device = { deviceId, deviceTypeId: snapshot.identity.deviceTypeId };

    const basementGuardianAccessory = createBasementGuardianAccessory({ accessory, hap: context.api.hap, registry: context.registry, log: context.log });
    basementGuardianAccessory.update(snapshot);

    context.accessories.set(uuid, accessory);
    context.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }
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

  /** The only logger this plugin writes through, so no secret can reach the log. */
  readonly log: RedactingLogger;

  private readonly registry: FamilyRegistry = createFamilyRegistry();

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
      onTrustworthyInventory: (deviceIds: readonly string[]): void => {
        registerDiscoveredDevices({ api: this.api, accessories: this.accessories, registry: this.registry, log: this.log }, deviceIds, runtime.store);
      },
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
