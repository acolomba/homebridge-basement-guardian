/**
 * @fileoverview Minimal Homebridge API stand-in.
 *
 * The stand-in carries the four members the plugin reads while it registers no accessory: the HAP
 * namespace, the storage path, the two lifecycle events, and the accessory constructor. The HAP
 * namespace is deliberately empty, because a complete HAP stand-in has nothing to serve until
 * accessories exist. The accessory adapters grow this module when they arrive; that boundary is
 * recorded here so it does not have to be rediscovered.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { API } from 'homebridge';

type LifecycleEvent = 'didFinishLaunching' | 'shutdown';

/** A Homebridge API stand-in whose lifecycle a scenario drives. */
export interface FakeHomebridgeApi {
  readonly api: API;
  readonly storagePath: string;

  /** Every lifecycle event a listener was registered for, in registration order. */
  readonly registrations: readonly string[];

  /** Runs the handlers registered for a lifecycle event and awaits what each one returns. */
  emit(event: 'didFinishLaunching' | 'shutdown'): Promise<void>;

  /** Removes the temporary storage directory. */
  cleanup(): Promise<void>;
}

/** The accessory identity the plugin supplies. It carries nothing else while nothing reads more. */
class HarnessPlatformAccessory {
  readonly context: Record<string, unknown> = {};

  constructor(
    readonly displayName: string,
    readonly UUID: string,
  ) {}
}

/** Starts a Homebridge API stand-in with its own temporary storage directory. */
export async function createFakeHomebridgeApi(): Promise<FakeHomebridgeApi> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-'));
  const handlers = new Map<LifecycleEvent, (() => unknown)[]>();
  const registrations: string[] = [];

  const standIn = {
    hap: {},
    user: { storagePath: () => storagePath },
    platformAccessory: HarnessPlatformAccessory,
    on(event: LifecycleEvent, listener: () => void) {
      const listeners = handlers.get(event) ?? [];

      registrations.push(event);
      listeners.push(listener);
      handlers.set(event, listeners);

      return this;
    },
  };

  return {
    // The stand-in answers the four members the plugin reads and nothing else, which no structural
    // type can express. Reading any other member surfaces as a TypeError that names it, which is
    // the failure this harness wants while the accessory work is still ahead.
    api: standIn as unknown as API,
    storagePath,
    registrations,
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
