import { randomBytes } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import { connect } from 'mqtt';

import { createBasementGuardianAccessory } from './accessories/basementGuardian.js';
import { validateConfig } from './config.js';
import { createFamilyRegistry } from './device/registry.js';
import { createRedactingLogger } from './logging.js';
import { PROTOCOL } from './protocol.js';
import { createAccountRuntimeFromConfig } from './runtime/accountRuntime.js';
import { systemClock } from './runtime/clock.js';
import { systemTimers } from './runtime/timers.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

import type { BasementGuardianAccessory } from './accessories/basementGuardian.js';
import type { NotificationServiceKind } from './accessories/services.js';
import type { FamilyOutcome, FamilyRegistry } from './device/registry.js';
import type { DeviceSnapshot, DeviceStateStore } from './device/state.js';
import type { RedactingLogger } from './logging.js';
import type { AccessoryContext } from './persistence/accessoryContext.js';
import type { Timers } from './runtime/timers.js';
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
  /** The vendor name last adopted for this accessory's display name (DEV-06). */
  lastVendorName?: AccessoryContext['lastVendorName'];
}

/** A Homebridge accessory carrying this plugin's context. */
export type BasementGuardianPlatformAccessory = PlatformAccessory<BasementGuardianAccessoryContext>;

/** Everything registering newly discovered devices needs. */
export interface DiscoveryContext {
  api: API;
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  /**
   * One `BasementGuardianAccessory` per physical accessory, reused across
   * every poll.
   *
   * Its closure holds the DEV-08 degrade-in-place state (the last
   * family-valid `receivedAt` and the log-once flag): creating a fresh
   * instance on every poll would silently discard that state instead of
   * carrying it forward, defeating the log-once and last-valid-value
   * guarantees.
   */
  basementGuardianAccessories: Map<string, BasementGuardianAccessory>;
  registry: FamilyRegistry;
  log: Logging;
  /**
   * The validated administrator list of notification sensors to leave
   * unpublished. Empty publishes every adapter (CONF-06, D-017).
   */
  ignoredFaults: readonly NotificationServiceKind[];
  /** The validated run of consecutive disconnected polls before the offline adapter activates (RES-03, D-09). */
  offlineConfirmationPollCount: number;
  /** Deferred execution, taken by injection so a test can prove the accessory never defers (SAFE-07, D-18). */
  timers: Timers;
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

// D-030: a vendor rename is adopted only while the HomeKit display name still
// equals the last vendor name the plugin itself stored; a display name that
// has already diverged is a user's own customization, so it stays untouched
// here even though `lastVendorName` still advances, which is what lets a
// later, matching rename be detected even after a customization.
function resolveVendorName(accessory: BasementGuardianPlatformAccessory, vendorName: string): { displayName: string; lastVendorName: string } {
  const noCustomization = accessory.displayName === accessory.context.lastVendorName;

  return {
    displayName: noCustomization ? vendorName : accessory.displayName,
    lastVendorName: vendorName,
  };
}

// Builds one accessory's HomeKit half over an already-constructed
// `PlatformAccessory`, recording it nowhere. The caller decides when the
// instance becomes the one this `uuid` owns, which is what lets the
// never-registered path publish first and record afterwards.
function createBasementGuardianAccessoryFor(context: DiscoveryContext, accessory: BasementGuardianPlatformAccessory): BasementGuardianAccessory {
  return createBasementGuardianAccessory({
    accessory,
    hap: context.api.hap,
    registry: context.registry,
    log: context.log,
    ignoredFaults: context.ignoredFaults,
    offlineConfirmationPollCount: context.offlineConfirmationPollCount,
    timers: context.timers,
  });
}

// Without this, `update()` is reached only once per successful REST poll. A
// backup pump runs for seven to fifteen seconds and the default poll interval
// is about fifteen minutes, so an activation would almost never be observed
// at all; canonical state that changes between polls has to reach HomeKit on
// the store's own change notification instead (SAFE-03, SAFE-07). The store
// notifies only when a telemetry value actually moved, and it contains a
// failing listener itself, so nothing here filters or guards again.
//
// No unsubscribe handle is kept: `store.remove(deviceId)`, which
// `removeDiscoveredDevice` already calls, drops this device's whole listener
// entry in the same breath as the cached accessory, so a later re-discovery
// builds a fresh instance and subscribes it again.
function subscribeToLiveState(basementGuardianAccessory: BasementGuardianAccessory, deviceId: string, store: DeviceStateStore): void {
  store.subscribe(deviceId, (next) => {
    basementGuardianAccessory.update(next, 'live');
  });
}

// Returns the one `BasementGuardianAccessory` an already-registered accessory
// owns for the life of the plugin run, creating it on the first poll that ever
// sees this `uuid`. A fresh instance per poll would reset the DEV-08
// degrade-in-place closure state (the log-once flag, the last family-valid
// `receivedAt`) on every call, so the same instance is reused for as long as
// the accessory itself stays registered.
//
// Caching before the first `update()` is safe here and only here: the
// `PlatformAccessory` this instance is bound to is one Homebridge already
// holds, either because an earlier inventory registered it or because
// `configureAccessory` restored it, so a throw during that update costs this
// poll and leaves the next one publishing onto the same accessory.
function basementGuardianAccessoryFor(
  context: DiscoveryContext,
  uuid: string,
  accessory: BasementGuardianPlatformAccessory,
  deviceId: string,
  store: DeviceStateStore,
): BasementGuardianAccessory {
  const existing = context.basementGuardianAccessories.get(uuid);

  if (existing !== undefined) {
    return existing;
  }

  const created = createBasementGuardianAccessoryFor(context, accessory);
  context.basementGuardianAccessories.set(uuid, created);
  subscribeToLiveState(created, deviceId, store);

  return created;
}

/**
 * Applies one discovery snapshot to an accessory already present in
 * `accessories`.
 *
 * A `deviceId` already found by its UUID is never re-registered (DEV-04): the
 * lookup that found it already proves physical identity, so this path only
 * ever refreshes what a `deviceTypeId` or vendor-name change reported for the
 * same accessory, never the accessory's identity itself.
 */
function updateDiscoveredDevice(
  context: DiscoveryContext,
  uuid: string,
  accessory: BasementGuardianPlatformAccessory,
  snapshot: DeviceSnapshot,
  store: DeviceStateStore,
): void {
  const rename = resolveVendorName(accessory, snapshot.identity.name);
  const nextDevice = { deviceId: snapshot.identity.deviceId, deviceTypeId: snapshot.identity.deviceTypeId };
  const previousDisplayName = accessory.displayName;
  const previousVendorName = accessory.context.lastVendorName;
  const previousDevice = accessory.context.device;

  // The identity has to be on the accessory before the factory reads it: an
  // accessory Homebridge restored from a cache written before `context.device`
  // existed carries none, and this is the call that supplies it.
  accessory.displayName = rename.displayName;
  accessory.context.lastVendorName = rename.lastVendorName;
  accessory.context.device = nextDevice;

  const basementGuardianAccessory = basementGuardianAccessoryFor(context, uuid, accessory, snapshot.identity.deviceId, store);
  // The published service set is part of what Homebridge persists, so it is
  // compared beside the display name and the context: an adapter an
  // administrator added to `ignoredFaults` removes a service, which has to earn
  // the persistence call the same way a rename does (CONF-06).
  const previousState = {
    displayName: previousDisplayName,
    lastVendorName: previousVendorName,
    device: previousDevice,
    services: basementGuardianAccessory.services,
  };

  basementGuardianAccessory.update(snapshot, 'poll');

  const nextState = {
    displayName: rename.displayName,
    lastVendorName: rename.lastVendorName,
    device: nextDevice,
    services: basementGuardianAccessory.services,
  };

  // A context mutation Homebridge does not know about is invisible on disk
  // until the next full register/unregister cycle, so only a real change
  // earns the call rather than persisting an identical value on every poll.
  if (!isDeepStrictEqual(previousState, nextState)) {
    context.api.updatePlatformAccessories([accessory]);
  }
}

// One device's whole dispatch, so the loop below can hold it in a `try` without
// wrapping the loop itself: a throw here costs this device its turn on this
// inventory and nothing else.
function dispatchDiscoveredDevice(context: DiscoveryContext, deviceId: string, store: DeviceStateStore): void {
  const uuid = context.api.hap.uuid.generate(deviceId);
  const snapshot = store.snapshot(deviceId);

  if (snapshot === undefined) {
    return;
  }

  const existing = context.accessories.get(uuid);

  if (existing !== undefined) {
    updateDiscoveredDevice(context, uuid, existing, snapshot, store);

    return;
  }

  const outcome = context.registry.lookup(snapshot.identity.deviceTypeId);

  if (outcome.kind !== 'implemented') {
    if (context.registry.shouldLog(deviceId, snapshot.identity.deviceTypeId)) {
      explainSkippedDevice(context.log, deviceId, outcome);
    }

    return;
  }

  const accessory = new context.api.platformAccessory<BasementGuardianAccessoryContext>(snapshot.identity.name, uuid);
  accessory.context.device = { deviceId, deviceTypeId: snapshot.identity.deviceTypeId };
  // First registration has no prior HomeKit name to compare against, so the
  // vendor name is adopted outright and the baseline for later rename
  // adoption is set here (DEV-06).
  accessory.context.lastVendorName = snapshot.identity.name;

  const basementGuardianAccessory = createBasementGuardianAccessoryFor(context, accessory);

  // The device publishes before anything records it, and nothing between the
  // four statements below can throw, so a first update that raises leaves no
  // cached instance, no live subscription, and no registration at all: the next
  // inventory rebuilds the device from scratch.
  //
  // Caching first and registering last left exactly the orphan that costs an
  // owner their monitoring. The cached instance stayed bound to a
  // `PlatformAccessory` Homebridge was never handed, `context.accessories` was
  // still empty, so every later inventory took this same new-device path,
  // published all fifteen services onto that orphan, and registered a fresh
  // accessory carrying none. The home then showed a Basement Guardian with no
  // flood sensor, no pump, and no offline sensor for as long as the plugin ran,
  // while the plugin's own state reported fifteen healthy services.
  basementGuardianAccessory.update(snapshot, 'poll');

  context.basementGuardianAccessories.set(uuid, basementGuardianAccessory);
  subscribeToLiveState(basementGuardianAccessory, deviceId, store);
  context.accessories.set(uuid, accessory);
  context.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
}

/**
 * Dispatches every discovered device through the family registry, registering
 * one HomeKit accessory for each implemented device this platform has not
 * already registered, and updating in place every device it has.
 *
 * The accessory UUID is seeded only from `deviceId`, never a mutable field
 * (C-002), so a `deviceId` already present in `accessories` is always the
 * same accessory: only a genuinely new physical device gets a new one, and a
 * `deviceTypeId` or vendor-name change on an existing device never creates or
 * removes an accessory (DEV-04). A HALO or unknown-`deviceTypeId` device that
 * has never been registered is explained through the registry's log-cadence
 * tracking and never registered (DEV-01); one device's outcome never stops
 * the loop from dispatching the rest, and a device that throws is logged by
 * name and costs only its own turn on this inventory. Exported so the harness that proves
 * this end to end drives the identical logic a real platform runs, rather
 * than a parallel copy of it.
 */
export function registerDiscoveredDevices(context: DiscoveryContext, deviceIds: readonly string[], store: DeviceStateStore): void {
  for (const deviceId of deviceIds) {
    try {
      dispatchDiscoveredDevice(context, deviceId, store);
    } catch (error: unknown) {
      // One device's outcome never stops the loop from dispatching the rest: a
      // fleet is several basements, and a single malformed payload must not
      // leave the others unregistered or unrefreshed. The error travels as a
      // parameter so the redacting logger describes it rather than a message
      // built here (D-024).
      context.log.error(`Skipping ${deviceId} on this inventory; every other device still updates.`, error);
    }
  }
}

/**
 * Unregisters a confirmed-absent accessory from HomeKit and drops its stored
 * canonical state.
 *
 * A `deviceId` with no cached accessory is a no-op: it was never registered,
 * or an earlier removal already unregistered it. The UUID is derived the
 * same way discovery derives it, so the same physical device always resolves
 * to the same accessory (DEV-05, D-029). Dropping the cached
 * `BasementGuardianAccessory` alongside the HAP accessory is what starts a
 * fresh observation epoch: a later re-discovery of the same `deviceId`
 * builds a brand-new instance with no memory of a prior degradation (D-020).
 */
export function removeDiscoveredDevice(context: DiscoveryContext, deviceId: string, store: DeviceStateStore): void {
  const uuid = context.api.hap.uuid.generate(deviceId);
  const accessory = context.accessories.get(uuid);

  if (accessory === undefined) {
    return;
  }

  context.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  context.accessories.delete(uuid);
  context.basementGuardianAccessories.delete(uuid);
  // This also drops the live-state listener the accessory was subscribed with,
  // because `remove` deletes the whole listener entry for the device alongside
  // its snapshot. That is why no unsubscribe handle is kept anywhere: the
  // cached accessory and its subscription are discarded in the same call, and a
  // later re-discovery of the same `deviceId` builds and subscribes a new one.
  store.remove(deviceId);
}

/**
 * Composition root of the dynamic platform.
 *
 * An invalid configuration is refused before any listener exists, so the plugin
 * installs and stays quiet rather than starting half-configured (CONF-03). The
 * cloud work begins on `didFinishLaunching` and is released on `shutdown`.
 *
 * A cached accessory the plugin cannot currently explain -- an unsupported or
 * unknown profile, or a payload that stops validating -- is never removed for
 * that reason alone; it stays and, where DEV-08 applies, degrades in place
 * (D-03). Confirmed inventory absence is the one condition that does trigger
 * removal, once two consecutive trustworthy polls and an out-of-band final
 * check all agree the device is gone (DEV-05, D-029).
 */
export class BasementGuardianPlatform implements DynamicPlatformPlugin {
  readonly accessories = new Map<string, BasementGuardianPlatformAccessory>();

  /** The only logger this plugin writes through, so no secret can reach the log. */
  readonly log: RedactingLogger;

  private readonly registry: FamilyRegistry = createFamilyRegistry();

  // One BasementGuardianAccessory per physical accessory, reused across every
  // poll so its DEV-08 degrade-in-place state persists (see DiscoveryContext).
  private readonly basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();

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
        registerDiscoveredDevices(
          {
            api: this.api,
            accessories: this.accessories,
            basementGuardianAccessories: this.basementGuardianAccessories,
            registry: this.registry,
            log: this.log,
            ignoredFaults: validated.config.ignoredFaults,
            offlineConfirmationPollCount: validated.config.offlineConfirmationPollCount,
            timers: systemTimers,
          },
          deviceIds,
          runtime.store,
        );
      },
      onDeviceRemoved: (deviceId: string): void => {
        removeDiscoveredDevice(
          {
            api: this.api,
            accessories: this.accessories,
            basementGuardianAccessories: this.basementGuardianAccessories,
            registry: this.registry,
            log: this.log,
            ignoredFaults: validated.config.ignoredFaults,
            offlineConfirmationPollCount: validated.config.offlineConfirmationPollCount,
            timers: systemTimers,
          },
          deviceId,
          runtime.store,
        );
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
