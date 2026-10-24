// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Minimal Homebridge API stand-in.
 *
 * The stand-in carries what the plugin reads while it registers accessories: the HAP namespace,
 * the storage path, the two lifecycle events, the accessory constructor, and the three
 * accessory-registration calls. The HAP namespace is the shared hand-built stand-in from
 * `./hap.js` rather than the real `@homebridge/hap-nodejs`, matching every other external
 * boundary in this codebase.
 *
 * The accessory answers the real HAP call shapes: `addService(serviceClass, displayName, subtype)`
 * takes the display name second, as the real one does, and refuses a duplicate service in both the
 * ways the real one refuses. A two-argument form whose second parameter was the subtype would
 * record a display name as a subtype, and every scenario built on it would pass while proving
 * nothing about what the plugin published.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createFakeHap, deserializeService, serializeService } from './hap.js';

import type { FakeHap, FakeHapService, FakeServiceClass, SerializedService, ServiceTypeIdentity } from './hap.js';
import type { BasementGuardianPlatformAccessory } from '../../src/platform.js';
import type { API } from 'homebridge';

type LifecycleEvent = 'didFinishLaunching' | 'shutdown';

// A published service is `FakeHapService` from `./hap.js`. This module carries no service type
// of its own: a second name for one boundary is the first step toward a second stand-in of it.

/** A minimal, hand-built stand-in for a HAP `PlatformAccessory`. */
export interface FakeAccessory {
  displayName: string;
  readonly UUID: string;
  readonly context: Record<string, unknown>;
  /** Every service this accessory carries, as the real `PlatformAccessory` exposes its own. */
  readonly services: readonly FakeHapService[];
  getService(serviceClass: ServiceTypeIdentity): FakeHapService | undefined;
  getServiceById(serviceClass: ServiceTypeIdentity, subtype: string): FakeHapService | undefined;
  addService(serviceClass: FakeServiceClass, displayName?: string, subtype?: string): FakeHapService;
  removeService(service: FakeHapService): void;
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

  /**
   * The same HAP namespace `api.hap` carries, under its own type.
   *
   * `api` is deliberately widened to Homebridge's own `API`, which types `hap` as the real
   * HAP-NodeJS namespace, so a step reaching a service class through `api.hap` would hand a real
   * HAP class to a stand-in accessory. This member is that one seam, kept honest.
   */
  readonly hap: FakeHap;

  /** Every lifecycle event a listener was registered for, in registration order. */
  readonly registrations: readonly string[];

  /** Every `registerPlatformAccessories` call the plugin made, in call order. */
  readonly registerPlatformAccessoryCalls: readonly RegisterPlatformAccessoriesCall[];

  /** Every `updatePlatformAccessories` call the plugin made, in call order. */
  readonly updatePlatformAccessoryCalls: readonly UpdatePlatformAccessoriesCall[];

  /** Every `unregisterPlatformAccessories` call the plugin made, in call order. */
  readonly unregisterPlatformAccessoryCalls: readonly UnregisterPlatformAccessoriesCall[];

  /**
   * Every accessory the plugin has been handed, in the order it received them.
   *
   * A registration hands one over, and so does a restore from the cache after a restart.
   * Earlier objects remain here as history even after Homebridge removes or restores them.
   */
  readonly handedAccessories: readonly FakeAccessory[];

  /** Accessories currently published to HomeKit, using the latest restored object for each UUID. */
  readonly activeAccessories: readonly FakeAccessory[];

  /**
   * Rebuilds the accessories a restarted Homebridge would restore from its cache.
   *
   * Homebridge writes an accessory to disk when it is registered and whenever the plugin says it
   * changed, and hands each one back after a restart through `configureAccessory`. This reproduces
   * that: each restored accessory carries the same identity, the context as it survives a round
   * trip through JSON, and the published service surface with every characteristic's last value.
   *
   * Restored values let a scenario check whether the plugin marks stale readings before a fresh
   * update (RES-04, D-12).
   *
   * The restore follows the real one. Homebridge rebuilds through `PlatformAccessory.deserialize`,
   * which replaces the constructed accessory's services with the ones the cache held, and HAP's
   * `Characteristic.serialize` persists each value and its properties but no status -- so a
   * restored characteristic answers its last value and carries no stored status, here as there.
   *
   * The cache holds the surface as of the last registration or update call. A real bridge also
   * saves on teardown, so this restores an older surface than a real restart would, never a fresher
   * one: a value the plugin has since moved comes back at the moment it was persisted.
   */
  restoreCachedAccessories(): readonly FakeAccessory[];

  /** Runs the handlers registered for a lifecycle event and awaits what each one returns. */
  emit(event: 'didFinishLaunching' | 'shutdown'): Promise<void>;

  /** Removes the temporary storage directory. */
  cleanup(): Promise<void>;
}

const hap = createFakeHap();

// Both refusals the real `Accessory.addService` makes, in its own wording: a second service of one
// type needs a subtype, and that subtype must be unique among the services already carrying that
// type. The get-or-add reconciliation an accessory publishes with leans on them, so a stand-in that
// accepted either duplicate would hide a real defect.
function refuseDuplicateService(services: readonly FakeHapService[], uuid: string, subtype: string | undefined): void {
  const sameType = services.filter((service) => service.UUID === uuid);

  if (sameType.length === 0) {
    return;
  }

  if (subtype === undefined) {
    throw new Error(
      `Cannot add a Service with the same UUID '${uuid}' as another Service in this Accessory without also defining a unique 'subtype' property.`,
    );
  }

  if (sameType.some((service) => service.subtype === subtype)) {
    throw new Error(`Cannot add a Service with the same UUID '${uuid}' and subtype '${subtype}' as another Service in this Accessory.`);
  }
}

/**
 * The accessory identity the plugin supplies, extended with the service surface the accessory
 * adapters need.
 *
 * Exported as the class rather than only through `createFakeAccessory`, because the plugin builds a
 * new accessory with `new api.platformAccessory(name, uuid)`: a caller standing in for that member
 * needs the constructor itself.
 */
export class HarnessPlatformAccessory implements FakeAccessory {
  displayName: string;

  readonly UUID: string;

  readonly context: Record<string, unknown> = {};

  readonly services: FakeHapService[] = [];

  constructor(displayName: string, UUID: string) {
    this.displayName = displayName;
    this.UUID = UUID;

    // Mirrors the real `Accessory` constructor, which always adds one
    // `AccessoryInformation` service before any accessory adapter runs.
    this.addService(hap.Service.AccessoryInformation);
  }

  // The real `Accessory.getService` answers the first service of that type whatever its subtype, so
  // a caller whose service has siblings has to ask `getServiceById` instead.
  getService(serviceClass: ServiceTypeIdentity): FakeHapService | undefined {
    return this.services.find((service) => service.UUID === serviceClass.UUID);
  }

  getServiceById(serviceClass: ServiceTypeIdentity, subtype: string): FakeHapService | undefined {
    return this.services.find((service) => service.UUID === serviceClass.UUID && service.subtype === subtype);
  }

  addService(serviceClass: FakeServiceClass, displayName?: string, subtype?: string): FakeHapService {
    refuseDuplicateService(this.services, serviceClass.UUID, subtype);

    const service = new serviceClass(displayName, subtype);

    this.services.push(service);

    return service;
  }

  removeService(service: FakeHapService): void {
    const index = this.services.indexOf(service);

    if (index >= 0) {
      this.services.splice(index, 1);
    }
  }

  /**
   * Replaces the constructed service surface with the one a cache restore rebuilt.
   *
   * The real `Accessory.deserialize` does exactly this: it constructs the accessory, which adds its
   * own `AccessoryInformation`, then replaces the whole list with the services the cache held.
   * Adding to the list instead would leave a second `AccessoryInformation` behind, which
   * `addService` refuses.
   */
  sideloadServices(services: readonly FakeHapService[]): void {
    this.services.length = 0;
    this.services.push(...services);
  }
}

/** Builds one accessory stand-in, for a scenario that reads the accessory service surface directly. */
export function createFakeAccessory(displayName: string, uuid: string): FakeAccessory {
  return new HarnessPlatformAccessory(displayName, uuid);
}

/**
 * Widens an accessory stand-in to the Homebridge accessory the plugin takes.
 *
 * The real `PlatformAccessory` carries an event emitter and the whole HAP accessory behind it, which
 * no stand-in carries, so no structural type admits one. This is the one place a stand-in stands
 * where the code under test takes a real accessory.
 */
export function asPlatformAccessory(accessory: FakeAccessory): BasementGuardianPlatformAccessory {
  // The stand-in carries only the members the plugin reads; see the note above.
  return accessory as unknown as BasementGuardianPlatformAccessory;
}

/** Starts a Homebridge API stand-in with its own temporary storage directory. */
export async function createFakeHomebridgeApi(): Promise<FakeHomebridgeApi> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-'));
  const handlers = new Map<LifecycleEvent, (() => unknown)[]>();
  const registrations: string[] = [];
  const registerPlatformAccessoryCalls: RegisterPlatformAccessoriesCall[] = [];
  const updatePlatformAccessoryCalls: UpdatePlatformAccessoriesCall[] = [];
  const unregisterPlatformAccessoryCalls: UnregisterPlatformAccessoriesCall[] = [];
  const handedAccessories: FakeAccessory[] = [];
  const activeAccessories: FakeAccessory[] = [];
  // What the cache on disk would hold, keyed the way Homebridge keys it. Both the context and the
  // service surface are stored as the text a cache file carries rather than as the live objects, so
  // a later mutation the plugin never persisted cannot reach a restored accessory through a shared
  // reference.
  const cached = new Map<string, { displayName: string; context: string; services: string }>();

  function writeToCache(accessories: readonly FakeAccessory[]): void {
    for (const accessory of accessories) {
      cached.set(accessory.UUID, {
        displayName: accessory.displayName,
        context: JSON.stringify(accessory.context),
        services: JSON.stringify(accessory.services.map(serializeService)),
      });
    }
  }

  function activate(accessory: FakeAccessory): void {
    const previous = activeAccessories.findIndex((candidate) => candidate.UUID === accessory.UUID);

    if (previous >= 0) {
      activeAccessories.splice(previous, 1);
    }

    activeAccessories.push(accessory);
  }

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
      handedAccessories.push(...accessories);
      for (const accessory of accessories) {
        activate(accessory);
      }

      writeToCache(accessories);
    },
    updatePlatformAccessories(accessories: FakeAccessory[]) {
      updatePlatformAccessoryCalls.push({ accessories: [...accessories] });
      writeToCache(accessories);
    },
    unregisterPlatformAccessories(pluginIdentifier: string, platformName: string, accessories: FakeAccessory[]) {
      unregisterPlatformAccessoryCalls.push({ pluginIdentifier, platformName, accessories: [...accessories] });

      for (const accessory of accessories) {
        cached.delete(accessory.UUID);
        const index = activeAccessories.findIndex((candidate) => candidate.UUID === accessory.UUID);

        if (index >= 0) {
          activeAccessories.splice(index, 1);
        }
      }
    },
  };

  return {
    // The stand-in answers the members the plugin reads and nothing else, which no structural type
    // can express. Reading any other member surfaces as a TypeError that names it, which is the
    // failure this harness wants while more of the accessory work is still ahead.
    api: standIn as unknown as API,
    storagePath,
    hap,
    registrations,
    registerPlatformAccessoryCalls,
    updatePlatformAccessoryCalls,
    unregisterPlatformAccessoryCalls,
    handedAccessories,
    activeAccessories,
    restoreCachedAccessories(): readonly FakeAccessory[] {
      const restored = [...cached.entries()].map(([uuid, entry]) => {
        const accessory = new HarnessPlatformAccessory(entry.displayName, uuid);
        Object.assign(accessory.context, JSON.parse(entry.context) as Record<string, unknown>);
        accessory.sideloadServices((JSON.parse(entry.services) as readonly SerializedService[]).map(deserializeService));

        return accessory;
      });

      handedAccessories.push(...restored);
      for (const accessory of restored) {
        activate(accessory);
      }

      return restored;
    },
    async emit(event: 'didFinishLaunching' | 'shutdown'): Promise<void> {
      for (const listener of handlers.get(event) ?? []) {
        await listener();
      }
    },
    async cleanup(): Promise<void> {
      // Retried, because teardown races a write the plugin is entitled to make. The runtime fires
      // its arrival-anchor write and does not await it, so the file can land in this directory
      // between `rm`'s listing of it and its `rmdir`, and the removal fails with `ENOTEMPTY`. That
      // is a harness problem rather than a plugin one -- nothing deletes the Homebridge storage
      // directory under a running plugin -- so the scenario waits the write out instead of the
      // runtime waiting on a disk.
      await rm(storagePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
    },
  };
}
