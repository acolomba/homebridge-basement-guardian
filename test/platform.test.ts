// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests platform lifecycle, discovery, and monitoring updates.
 */

import assert from 'node:assert/strict';
import { watch } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { setImmediate as nextEventLoopTurn } from 'node:timers/promises';
import { isDeepStrictEqual } from 'node:util';

import { It, mock, verify, when } from 'strong-mock';

import { createFakeHap } from '../features/support/fakeHap.js';
import { HarnessPlatformAccessory } from '../features/support/fakeHomebridgeApi.js';
import { createBasementGuardianAccessory } from '../src/accessories/basementGuardian.js';
import { createServiceCatalogue } from '../src/accessories/serviceCatalogue.js';
import { markTrustReportsUnreadable } from '../src/accessories/staleMarking.js';
import { isRecord } from '../src/cloud/types.js';
import { createDeviceStateStore } from '../src/device/state.js';
import { createRedactingLogger } from '../src/logging.js';
import { applyMonitoringHealth, BasementGuardianPlatform, registerDiscoveredDevices, removeDiscoveredDevice } from '../src/platform.js';
import { ARRIVAL_ANCHOR_FILENAME } from '../src/runtime/arrivalAnchors.js';
import { systemTimers } from '../src/runtime/timers.js';
import { PLATFORM_NAME, PLUGIN_NAME } from '../src/settings.js';

import {
  accountConfig,
  emptyConfig,
  fakeFamily,
  geminiDevice,
  geminiWireDeviceList,
  implementedRegistry,
  powerRegistry,
  recoveringFamily,
  reportedPatch,
  throwingFamily,
  unknownRegistry,
  unsupportedRegistry,
} from './platformSeeds.js';

import type { FakeCharacteristicClass, FakeHapService, FakeServiceClass } from '../features/support/fakeHap.js';
import type { FakeAccessory } from '../features/support/fakeHomebridgeApi.js';
import type { BasementGuardianAccessory } from '../src/accessories/basementGuardian.js';
import type { NotificationServiceKind } from '../src/accessories/services.js';
import type { HttpFetch } from '../src/cloud/httpDispatcher.js';
import type { FamilyOutcome, FamilyRegistry } from '../src/device/registry.js';
import type { DeviceStateStore } from '../src/device/state.js';
import type { BasementGuardianAccessoryContext, BasementGuardianPlatformAccessory, DiscoveryContext } from '../src/platform.js';
import type { CommandPort } from '../src/runtime/commandPort.js';
import type { MonitoringTrust } from '../src/runtime/monitoringHealth.js';
import type { API, LogLevel, Logging, PlatformAccessory } from 'homebridge';
import type { TestContext } from 'node:test';

// Logging is a callable interface with seven members, so a silent stub is a
// function that carries them rather than an object literal.
function createSilentLog(): Logging {
  return Object.assign(() => undefined, {
    prefix: 'basement guardian',
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
    log: () => undefined,
    success: () => undefined,
    warn: () => undefined,
  });
}

function createRecordingLog(messages: string[]): Logging {
  const record: (message: string) => void = (message: string): void => {
    messages.push(message);
  };

  return Object.assign(record, {
    prefix: 'basement guardian',
    debug: record,
    error: record,
    info: record,
    log: (level: LogLevel, message: string): void => {
      messages.push(`${level} ${message}`);
    },
    success: record,
    warn: record,
  });
}

// Drains the promise chains a lifecycle event starts, so the work it triggered
// has settled before the assertions run.
//
// Positive lifecycle checkpoints await their announced boundary first. This
// drain lets already-triggered continuations run before checking silence or
// advancing the owned clock; it does not wait for filesystem completion.
async function settle(): Promise<void> {
  for (let turn = 0; turn < 8; turn += 1) {
    await nextEventLoopTurn();
  }
}

function completionSignal(): [Promise<void>, () => void] {
  // The promise constructor assigns the resolver synchronously.
  let announce!: () => void;
  const completed = new Promise<void>((resolve) => {
    announce = resolve;
  });

  return [completed, announce];
}

const REFUSAL_ADVICE = 'Fix it in the Homebridge UI (Plugins -> Basement Guardian -> Settings).';

const DEVICE_ID = 'account-1_serial-1';
const SECOND_DEVICE_ID = 'account-1_serial-2';
const DEVICE_TYPE_ID = 'wayneWaterGemini';

// The stored context of an accessory restored from before this release: the device identity and the
// vendor name, and none of the three record members, which is the ordinary first-run state.
void ({
  device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
  lastVendorName: 'Sump System',
} satisfies BasementGuardianAccessoryContext);

// The same context once the plugin has observed both pumps, in the units the persisted record holds:
// milliseconds for everything the plugin timed, and the device's own Unix seconds for the watermarks.
void ({
  device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
  lastVendorName: 'Sump System',
  primaryPump: { observationStartedAt: 1_756_684_800_000, activationCount: 4, lastActivationAt: 1_756_685_800_000 },
  backupPump: { observationStartedAt: 1_756_684_800_000, activationCount: 1, lastActivationAt: undefined, lastActivationWasTestActivity: true },
  watermarks: { backupPumpTimestamp: undefined, testTimestamp: 1_700_000_000 },
} satisfies BasementGuardianAccessoryContext);

// @ts-expect-error a stored pump record is what the plugin observed, never a bare count
void ({ primaryPump: 4 } satisfies BasementGuardianAccessoryContext);
// @ts-expect-error the watermarks hold the device's own timestamps, never a boolean
void ({ watermarks: true } satisfies BasementGuardianAccessoryContext);

const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;

// The one hand-built stand-in of this boundary. The accessory now declares its own HomeKit types by
// subclassing the injected namespace, so `Service` and `Characteristic` have to be constructible
// bases rather than identifier constants; a second stand-in of the same boundary would drift.
const HAP = createFakeHap();

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];

// The fake HAP accessory carries the consumed service behavior; its constructor
// crosses the same nominal HAP boundary as the namespace above.
const PLATFORM_ACCESSORY: API['platformAccessory'] = HarnessPlatformAccessory as unknown as API['platformAccessory'];

// The accessory identifier the plugin derives for this device, taken from the same derivation the
// plugin uses rather than restated as a literal.
const ACCESSORY_UUID = HAP.uuid.generate(DEVICE_ID);

// The status a restored control refuses a press with, written independently of the stand-in so a
// drifted number fails here (D-08).
const NOT_ALLOWED_IN_CURRENT_STATE = -70412;

// What a controller's press answered: the status a refusal threw, or `undefined` for a write HAP
// accepted and stored. The two differ only in that answer.
async function pressOutcomeOf(service: FakeHapService): Promise<unknown> {
  const on = service.getCharacteristic(HAP.Characteristic.On);

  if (on === undefined) {
    throw new Error('the restored control carries no On characteristic');
  }

  try {
    await on.handleSetRequest(true);

    return undefined;
  } catch (error: unknown) {
    return error;
  }
}

const SECOND_ACCESSORY_UUID = HAP.uuid.generate(SECOND_DEVICE_ID);

// A device whose decode raises while a batch also carries a healthy one.
const THROWING_DEVICE_ID = 'account-1_serial-throwing';

interface FakeApiCall {
  pluginIdentifier: string;
  platformName: string;
  accessories: FakeAccessory[];
}

// The compatibility signature keeps existing callers and their recording arrays.
// Each case prescribes and records its own finite API interactions.
function fakeDiscoveryApi(registerCalls: FakeApiCall[], updateCalls?: FakeAccessory[][], unregisterCalls?: FakeApiCall[]): API;
function fakeDiscoveryApi(): API {
  return mock<API>({ exactParams: true, name: 'homebridge discovery api' });
}

interface ContextOptions {
  api: API;
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  registry: FamilyRegistry;
  basementGuardianAccessories?: Map<string, BasementGuardianAccessory>;
  log?: Logging;
  ignoredFaults?: readonly NotificationServiceKind[];
  offlineConfirmationPollCount?: number;
  commands?: CommandPort;
}

// The discovery path never sends a command, so the stand-in every case gets rejects: an accessory
// that reached the command route while merely publishing would fail by name here.
function refusingCommands(): CommandPort {
  return { send: () => Promise.reject(new Error('the discovery path must not send a command')) };
}

// Every DiscoveryContext this suite builds carries the same wiring apart from the members a case is
// about, so the shared parts live here rather than in a literal per case.
function discoveryContext(options: ContextOptions): DiscoveryContext {
  return {
    api: options.api,
    accessories: options.accessories,
    basementGuardianAccessories: options.basementGuardianAccessories ?? new Map<string, BasementGuardianAccessory>(),
    registry: options.registry,
    log: options.log ?? createSilentLog(),
    ignoredFaults: options.ignoredFaults ?? [],
    offlineConfirmationPollCount: options.offlineConfirmationPollCount ?? 2,
    timers: systemTimers,
    commands: options.commands ?? refusingCommands(),
  };
}

// A BasementGuardianAccessory that records the trust it was handed, naming the
// system it belongs to. The fan-out's whole content is which accessory heard
// which answer, so the deviceId in the string is the observation and not
// decoration: two accessories recording into one array is what makes a fan-out
// that resolved the wrong system's answer visible.
function recordingBasementGuardianAccessory(deviceId: string, marks: string[]): BasementGuardianAccessory {
  return {
    deviceId,
    services: [],
    untrusted: [],
    update: () => undefined,
    markMonitoring: (trust: MonitoringTrust): void => {
      marks.push(`${deviceId} rest ${String(trust.restDegraded)} shadow ${String(trust.shadowSilent)}`);
    },
  };
}

// The same stand-in, recording the whole struct instead of two of its members.
//
// The missing-entry rule overrides one member of four and passes the other three
// through untouched, so a case about that rule has to read all four; the string
// above carries two and would call a fan-out correct that had invented the other
// two (D-02).
function trustRecordingBasementGuardianAccessory(deviceId: string, heard: Map<string, MonitoringTrust>): BasementGuardianAccessory {
  return {
    deviceId,
    services: [],
    untrusted: [],
    update: () => undefined,
    markMonitoring: (trust: MonitoringTrust): void => {
      heard.set(deviceId, trust);
    },
  };
}

// The status a refused credential is presented under, and the leak state the restored accessories
// below carry. Both are written independently of the stand-in, so a drifted number fails here
// (D-10).
const COMMUNICATION_FAILURE = -70402;
const LEAK_DETECTED = 1;

// The status a characteristic carries once an ordinary push has cleared a stored failure, written
// independently of the stand-in for the same reason the failure above is.
const READ_SUCCEEDS = 0;

/** Two accessories as a halted restart holds them, with the flood sensor of each held for reading. */
interface RestoredAccessories {
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  floods: readonly FakeHapService[];
}

// Restored from the Homebridge cache, carrying the readings the previous run published, and
// belonging to no `BasementGuardianAccessory` at all -- which is the state a run whose first grant
// the vendor refused leaves the platform in, because it never reaches discovery.
function restoredAccessories(): RestoredAccessories {
  const accessories = new Map<string, BasementGuardianPlatformAccessory>();
  const floods: FakeHapService[] = [];

  for (const uuid of [ACCESSORY_UUID, SECOND_ACCESSORY_UUID]) {
    const accessory = new HarnessPlatformAccessory('Sump Guardian', uuid);
    const flood = accessory.addService(HAP.Service.LeakSensor, 'Sump Pit Flood', 'sump-pit-flood');

    flood.updateCharacteristic(HAP.Characteristic.LeakDetected, LEAK_DETECTED);
    flood.updateCharacteristic(HAP.Characteristic.StatusActive, true);
    accessories.set(uuid, accessory as unknown as BasementGuardianPlatformAccessory);
    floods.push(flood);
  }

  return { accessories, floods };
}

// A cache an older release wrote: services carrying the readings that run published, and no trust
// report on any of them. This is the one restored shape a credential refusal marks nothing on, so it
// is the one shape an operator has to be told about -- every tile keeps answering and HomeKit shows
// no fault at all.
function restoredAccessoryCarryingNoTrustReport(): { accessories: Map<string, BasementGuardianPlatformAccessory>; control: FakeHapService } {
  const accessory = new HarnessPlatformAccessory('Sump Guardian', ACCESSORY_UUID);
  const control = accessory.addService(HAP.Service.Switch, 'Alarm Mute', 'alarm-mute');

  control.updateCharacteristic(HAP.Characteristic.On, true);

  return {
    accessories: new Map<string, BasementGuardianPlatformAccessory>([[ACCESSORY_UUID, accessory as unknown as BasementGuardianPlatformAccessory]]),
    control,
  };
}

/** One restored accessory with the live instance that publishes onto its services. */
interface RepublishingAccessory {
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  basementGuardianAccessories: Map<string, BasementGuardianAccessory>;
  floods: readonly FakeHapService[];
}

// A restored accessory with a real `BasementGuardianAccessory` built over the same
// `PlatformAccessory`, so the boolean fan-out and the error push touch one set of services.
//
// This is what `recordingBasementGuardianAccessory` cannot be. That stand-in pushes nothing, so the
// services the error push walks are not the services the fan-out touched, and an inverted push order
// leaves every reading exactly where it was. A case that means to observe the clobber has to read a
// characteristic both loops reach, which means an instance that republishes its own rows onto the
// accessory the second loop walks (WR-01).
//
// The row is reached through the subtype the catalogue publishes under, which is the same subtype
// `restoredAccessories` seeds above -- so a rename on either side fails here rather than silently
// handing back a second, unwatched service.
function restoredAccessoryRepublishingItsRows(): RepublishingAccessory {
  const accessory = new HarnessPlatformAccessory('Sump Guardian', ACCESSORY_UUID);

  accessory.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };

  const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
  const built = createBasementGuardianAccessory({
    accessory: accessory as unknown as PlatformAccessory,
    hap: HAP_NAMESPACE,
    registry: powerRegistry(),
    log: createSilentLog(),
    timers: systemTimers,
    store: { persist: () => undefined },
    commands: refusingCommands(),
  });

  built.update(store.applyDiscovery(geminiDevice()), 'poll');

  const flood = accessory.getServiceById(HAP.Service.LeakSensor, 'sump-pit-flood');

  if (flood === undefined) {
    throw new Error('the accessory published no Sump Pit Flood service for this case to read');
  }

  return {
    accessories: new Map<string, BasementGuardianPlatformAccessory>([[ACCESSORY_UUID, accessory as unknown as BasementGuardianPlatformAccessory]]),
    basementGuardianAccessories: new Map<string, BasementGuardianAccessory>([[ACCESSORY_UUID, built]]),
    floods: [flood],
  };
}

// What a characteristic holds, and what a controller read of it answers. The read is the whole
// difference between unreadable and merely marked, so it is driven rather than inferred from the
// stored status.
function readOf(service: FakeHapService, characteristicClass: FakeCharacteristicClass): { value: unknown; threw: unknown } {
  const held = service.getCharacteristic(characteristicClass);
  let threw: unknown = undefined;

  try {
    held?.handleGetRequest();
  } catch (error: unknown) {
    threw = error;
  }

  return { value: held?.value, threw };
}

// The trust row beside a reading the pass must not touch, so preserve-and-erase fails here as
// plainly as an unmarked accessory does.
function trustReadsOf(
  floods: readonly FakeHapService[],
): readonly { statusActive: { value: unknown; threw: unknown }; leakDetected: { value: unknown; threw: unknown } }[] {
  return floods.map((flood) => ({
    statusActive: readOf(flood, HAP.Characteristic.StatusActive),
    leakDetected: readOf(flood, HAP.Characteristic.LeakDetected),
  }));
}

function statusesOf(floods: readonly FakeHapService[]): readonly (number | undefined)[] {
  return floods.map((flood) => flood.getCharacteristic(HAP.Characteristic.StatusActive)?.statusCode);
}

// The accessory the platform built for this device, so a case can watch the calls the store's own
// change notification makes on it rather than infer them.
function builtAccessory(basementGuardianAccessories: Map<string, BasementGuardianAccessory>): BasementGuardianAccessory {
  const built = basementGuardianAccessories.get(ACCESSORY_UUID);

  if (built === undefined) {
    throw new Error('the platform built no BasementGuardianAccessory for this device');
  }

  return built;
}

// The one accessory the platform handed Homebridge, so a case reads what an owner would find in
// their home rather than what the plugin believes it published.
function onlyRegisteredAccessory(registerCalls: readonly FakeApiCall[]): FakeAccessory {
  const registered = registerCalls.flatMap((call) => call.accessories);
  const accessory = registered[0];

  if (accessory === undefined || registered.length !== 1) {
    throw new Error(`the platform registered ${String(registered.length)} accessories rather than one`);
  }

  return accessory;
}

// Every catalogue service that accessory carries, by the name HomeKit shows.
function publishedServiceNames(accessory: FakeAccessory): readonly string[] {
  return createServiceCatalogue(HAP_NAMESPACE)
    .filter((row) => accessory.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype) !== undefined)
    .map((row) => row.displayName);
}

// What a named row currently reports for the trust flag every service carries.
function statusActiveOf(accessory: FakeAccessory, displayName: string): unknown {
  const row = createServiceCatalogue(HAP_NAMESPACE).find((candidate) => candidate.displayName === displayName);
  const service = row === undefined ? undefined : accessory.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);

  return service?.characteristics.find((candidate) => candidate.UUID === HAP.Characteristic.StatusActive.UUID)?.value;
}

function contactStateOf(accessory: FakeAccessory, subtype: string): unknown {
  const service = accessory.getServiceById(HAP.Service.ContactSensor, subtype);

  return service?.characteristics.find((candidate) => candidate.UUID === HAP.Characteristic.ContactSensorState.UUID)?.value;
}

// A device already registered under its own accessory, with the store holding its first snapshot,
// which is the state every live-update case starts from.
function registeredDevice(context: DiscoveryContext, accessories: Map<string, BasementGuardianPlatformAccessory>, store: DeviceStateStore): FakeAccessory {
  const accessory = new HarnessPlatformAccessory('Sump System', ACCESSORY_UUID);
  accessory.context.lastVendorName = 'Sump System';
  accessory.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
  accessories.set(ACCESSORY_UUID, accessory as unknown as BasementGuardianPlatformAccessory);
  store.applyDiscovery(geminiDevice());
  registerDiscoveredDevices(context, [DEVICE_ID], store);

  return accessory;
}

// strong-mock matches a function argument only through It.matches, so the
// matcher doubles as the capture point for the registered listener.
function captureListener(listeners: (() => void)[]): () => void {
  return It.matches((listener: () => void) => {
    if (typeof listener !== 'function' || listener.length !== 0) {
      return false;
    }

    listeners.push(listener);

    return true;
  });
}

// An accepted configuration reaches for the Homebridge storage directory, so
// each such case gets its own, removed when the case ends.
async function expectStoragePath(t: TestContext, api: API): Promise<{ user: API['user']; storagePath: string }> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-platform-'));

  t.after(async () => {
    t.mock.timers.reset();
    await rm(storagePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  const user = mock<API['user']>({ exactParams: true, name: 'homebridge user' });
  when(() => user.storagePath()).thenReturn(storagePath);
  when(() => api.user).thenReturn(user);

  return { user, storagePath };
}

describe('BasementGuardianPlatform', () => {
  test('removes a physical identity once when its cached accessory is restored twice', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const restorationApi = fakeDiscoveryApi([]);
    when(() => restorationApi.hap).thenReturn(HAP_NAMESPACE);
    when(() => restorationApi.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    const cachedAccessory = new restorationApi.platformAccessory<BasementGuardianAccessoryContext>('Cached Sump', ACCESSORY_UUID);
    cachedAccessory.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const removal = mock<API['unregisterPlatformAccessories']>({ exactParams: true, name: 'single physical removal' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    when(() => api.hap)
      .thenReturn(restorationApi.hap)
      .times(3);
    when(() => {
      removal(PLUGIN_NAME, PLATFORM_NAME, [cachedAccessory]);
    }).thenReturn(undefined);
    const removedIds: string[] = [];
    const [removed, announceRemoval] = completionSignal();
    when(() => api.unregisterPlatformAccessories).thenReturn((pluginIdentifier, platformName, accessories) => {
      removal(pluginIdentifier, platformName, accessories);
      removedIds.push(...accessories.map((accessory) => accessory.UUID));
      announceRemoval();
    });
    let inventories = 0;
    const [credentialsRequested, announceCredentialsRequest] = completionSignal();
    const httpFetch: HttpFetch = (input) => {
      const url = input.toString();

      if (url.endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      if (url.endsWith('/devices')) {
        inventories += 1;

        return Promise.resolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
      }

      if (url.endsWith('/credentials/aws')) {
        announceCredentialsRequest();

        return Promise.resolve(new Response('{}', { status: 503 }));
      }

      return Promise.reject(new Error('no response is scripted for this route'));
    };

    const platform = new BasementGuardianPlatform(createSilentLog(), { ...accountConfig(), pollInterval: 300 }, api, { httpFetch });
    const [launch, shutdown] = listeners;

    // act
    platform.configureAccessory(cachedAccessory);
    platform.configureAccessory(cachedAccessory);
    launch?.();
    await credentialsRequested;
    await settle();
    const beforeConfirmation = { cachedIds: [...platform.accessories.keys()], removedIds: [...removedIds] };
    t.mock.timers.tick(300_000);
    await removed;
    await settle();
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(
      { beforeConfirmation, cachedIds: [...platform.accessories.keys()], removedIds, inventories, context: cachedAccessory.context },
      {
        beforeConfirmation: { cachedIds: [ACCESSORY_UUID], removedIds: [] },
        cachedIds: [],
        removedIds: [ACCESSORY_UUID],
        inventories: 3,
        context: { device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID } },
      },
    );
    verify(removal);
    verify(user);
    verify(api);
    verify(restorationApi);
  });

  for (const { identity, contextJson } of [
    { identity: 'missing device', contextJson: '{}' },
    { identity: 'null device', contextJson: '{"device":null}' },
    { identity: 'array device', contextJson: '{"device":[]}' },
    { identity: 'missing deviceId', contextJson: '{"device":{"deviceTypeId":"wayneWaterGemini"}}' },
    { identity: 'numeric deviceId', contextJson: '{"device":{"deviceId":17,"deviceTypeId":"wayneWaterGemini"}}' },
    { identity: 'empty deviceId', contextJson: '{"device":{"deviceId":"","deviceTypeId":"wayneWaterGemini"}}' },
  ]) {
    test(`retains a cached accessory with ${identity} without guessing its identity`, async (t) => {
      // arrange
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const restorationApi = fakeDiscoveryApi([]);
      when(() => restorationApi.hap).thenReturn(HAP_NAMESPACE);
      when(() => restorationApi.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
      const cachedAccessory = new restorationApi.platformAccessory('Cached Sump', ACCESSORY_UUID);
      const context: unknown = JSON.parse(contextJson);

      if (!isRecord(context)) {
        throw new Error('the cached context must be a JSON object');
      }

      cachedAccessory.context = context;
      const expectedContext: unknown = JSON.parse(contextJson);
      const listeners: (() => void)[] = [];
      const api = mock<API>({ exactParams: true, name: 'homebridge api' });
      const { user } = await expectStoragePath(t, api);
      when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
      when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
      when(() => api.hap).thenReturn(restorationApi.hap);
      let inventories = 0;
      const [credentialsRequested, announceCredentialsRequest] = completionSignal();
      const [confirmingInventoryRequested, announceConfirmingInventoryRequest] = completionSignal();
      const httpFetch: HttpFetch = (input) => {
        const url = input.toString();

        if (url.endsWith('/oauth/token')) {
          return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
        }

        if (url.endsWith('/devices')) {
          inventories += 1;

          if (inventories === 2) {
            announceConfirmingInventoryRequest();
          }

          return Promise.resolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
        }

        announceCredentialsRequest();

        return Promise.resolve(new Response('{}', { status: 503 }));
      };

      const platform = new BasementGuardianPlatform(createSilentLog(), { ...accountConfig(), pollInterval: 300 }, api, { httpFetch });
      const [launch, shutdown] = listeners;

      // act
      platform.configureAccessory(cachedAccessory);
      launch?.();
      await credentialsRequested;
      await settle();
      t.mock.timers.tick(300_000);
      await confirmingInventoryRequested;
      await settle();
      shutdown?.();
      await settle();

      // assert
      assert.deepStrictEqual(
        {
          cachedIds: [...platform.accessories.keys()],
          sameAccessory: platform.accessories.get(ACCESSORY_UUID) === cachedAccessory,
          context: cachedAccessory.context,
          inventories,
        },
        { cachedIds: [ACCESSORY_UUID], sameAccessory: true, context: expectedContext, inventories: 2 },
      );
      verify(user);
      verify(api);
      verify(restorationApi);
    });
  }

  test('removes a restored device absent at startup only after healthy confirmations and a final inventory check', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const restorationApi = fakeDiscoveryApi([]);
    when(() => restorationApi.hap).thenReturn(HAP_NAMESPACE);
    when(() => restorationApi.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    const hap = restorationApi.hap;
    const cachedAccessory = new restorationApi.platformAccessory<BasementGuardianAccessoryContext>('Cached Sump', ACCESSORY_UUID);
    cachedAccessory.context = {
      device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
      lastVendorName: 'Cached Sump',
      primaryPump: { observationStartedAt: 1_700_000_000_000, activationCount: 4, lastActivationAt: 1_700_000_100_000 },
    };
    const flood = cachedAccessory.addService(hap.Service.LeakSensor, 'Sump Pit Flood', 'sump-pit-flood');
    flood.updateCharacteristic(hap.Characteristic.LeakDetected, 1);
    flood.updateCharacteristic(hap.Characteristic.StatusActive, true);
    // The promise constructor assigns the resolver synchronously.
    let completeFinalCheck!: (response: Response) => void;
    const finalCheck = new Promise<Response>((resolve) => {
      completeFinalCheck = resolve;
    });
    let inventories = 0;
    const [credentialsRequested, announceCredentialsRequest] = completionSignal();
    const [finalCheckRequested, announceFinalCheckRequest] = completionSignal();
    const [removed, announceRemoval] = completionSignal();
    const httpFetch: HttpFetch = (input) => {
      const url = input.toString();

      if (url.endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      if (url.endsWith('/devices')) {
        inventories += 1;

        if (inventories === 3) {
          announceFinalCheckRequest();
        }

        return inventories === 3 ? finalCheck : Promise.resolve(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
      }

      if (url.endsWith('/credentials/aws')) {
        announceCredentialsRequest();

        return Promise.resolve(
          new Response(
            JSON.stringify({
              endpoint: 'broker.invalid',
              clientId: 'client-1',
              credentials: {
                AccessKeyId: 'test-access-key-id',
                SecretAccessKey: 'test-secret-access-key',
                SessionToken: 'test-session-token',
                Expiration: new Date(Date.now() + 3_600_000).toISOString(),
              },
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.reject(new Error('no response is scripted for this route'));
    };

    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const removal = mock<API['unregisterPlatformAccessories']>({ exactParams: true, name: 'confirmed cached accessory removal' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    when(() => api.hap)
      .thenReturn(hap)
      .times(2);
    when(() => {
      removal(PLUGIN_NAME, PLATFORM_NAME, [cachedAccessory]);
    }).thenReturn(undefined);
    const platform = new BasementGuardianPlatform(createSilentLog(), { ...accountConfig(), pollInterval: 300 }, api, { httpFetch });
    const [launch, shutdown] = listeners;
    const removalStates: unknown[] = [];
    when(() => api.unregisterPlatformAccessories).thenReturn((pluginIdentifier, platformName, accessories) => {
      removal(pluginIdentifier, platformName, accessories);
      removalStates.push({
        inventories,
        cachedIds: [...platform.accessories.keys()],
        sameAccessory: platform.accessories.get(ACCESSORY_UUID) === cachedAccessory,
        removedIds: accessories.map((accessory) => accessory.UUID),
        context: structuredClone(cachedAccessory.context),
        flood: flood.getCharacteristic(hap.Characteristic.LeakDetected).value,
        active: flood.getCharacteristic(hap.Characteristic.StatusActive).value,
      });
      announceRemoval();
    });
    const expectedCached = {
      cachedIds: [ACCESSORY_UUID],
      sameAccessory: true,
      context: {
        device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
        lastVendorName: 'Cached Sump',
        primaryPump: { observationStartedAt: 1_700_000_000_000, activationCount: 4, lastActivationAt: 1_700_000_100_000 },
      },
      flood: 1,
      active: false,
    };

    // act
    platform.configureAccessory(cachedAccessory);
    launch?.();
    await credentialsRequested;
    await settle();
    const afterFirstAbsence = {
      cachedIds: [...platform.accessories.keys()],
      sameAccessory: platform.accessories.get(ACCESSORY_UUID) === cachedAccessory,
      context: structuredClone(cachedAccessory.context),
      flood: flood.getCharacteristic(hap.Characteristic.LeakDetected).value,
      active: flood.getCharacteristic(hap.Characteristic.StatusActive).value,
      removalStates: [...removalStates],
    };
    t.mock.timers.tick(299_999);
    await settle();
    const beforeConfirmation = { cachedIds: [...platform.accessories.keys()], removalStates: [...removalStates] };
    t.mock.timers.tick(1);
    await finalCheckRequested;
    await settle();
    const beforeFinalAnswer = {
      cachedIds: [...platform.accessories.keys()],
      sameAccessory: platform.accessories.get(ACCESSORY_UUID) === cachedAccessory,
      context: structuredClone(cachedAccessory.context),
      flood: flood.getCharacteristic(hap.Characteristic.LeakDetected).value,
      active: flood.getCharacteristic(hap.Characteristic.StatusActive).value,
      removalStates: [...removalStates],
    };
    completeFinalCheck(new Response(JSON.stringify({ devices: [] }), { status: 200 }));
    await removed;
    await settle();
    const afterFinalAnswer = { cachedIds: [...platform.accessories.keys()], removalStates: [...removalStates] };
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(afterFirstAbsence, { ...expectedCached, removalStates: [] });
    assert.deepStrictEqual(beforeConfirmation, { cachedIds: [ACCESSORY_UUID], removalStates: [] });
    assert.deepStrictEqual(beforeFinalAnswer, { ...expectedCached, removalStates: [] });
    assert.deepStrictEqual(afterFinalAnswer, {
      cachedIds: [],
      removalStates: [{ inventories: 3, ...expectedCached, removedIds: [ACCESSORY_UUID] }],
    });
    verify(removal);
    verify(user);
    verify(api);
    verify(restorationApi);
  });

  test('holds no accessory and calls nothing on the API once constructed', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });

    // act
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), api);

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(api);
  });

  test('keeps the accessory map empty and registers no listener when the account email is missing', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });

    // act
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), api);

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(api);
  });

  test('CONF-03 logs the refusal through the redacting wrapper, so a configuration value cannot leak', () => {
    // arrange
    const messages: string[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const refusedReason = 'pollInterval must be a whole number of seconds from 300 to 3600, but it is "Bearer [redacted]".';

    // act
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), { ...accountConfig(), pollInterval: 'Bearer leaked-token' }, api);

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    assert.deepStrictEqual(messages, [`Not starting: ${refusedReason} ${REFUSAL_ADVICE}`]);
    verify(api);
  });

  test('AUTH-02 logs the malformed-email refusal without the account email it rejected', () => {
    // arrange
    const messages: string[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const refusedReason = 'the account email must be an email address.';

    // act
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), { ...accountConfig(), email: 'jane.doe@company' }, api);

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    assert.deepStrictEqual(messages, [`Not starting: ${refusedReason} ${REFUSAL_ADVICE}`]);
    verify(api);
  });

  test('AUTH-02 registers the account password as a secret once the configuration is accepted', async (t) => {
    // arrange
    t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no request expected')));
    const messages: string[] = [];
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), accountConfig(), api);

    // act
    platform.log.info('the grant used account-password');

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    assert.deepStrictEqual(messages, ['the grant used [redacted]']);
    verify(user);
    verify(api);
  });

  test('registers the launch and shutdown listeners once the configuration is valid', async (t) => {
    // arrange
    const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);

    // act
    const platform = new BasementGuardianPlatform(createSilentLog(), accountConfig(), api, { httpFetch });

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    assert.strictEqual(listeners.length, 2);
    verify(httpFetch);
    verify(user);
    verify(api);
  });

  test('starts the cloud work on the launch event and releases it on shutdown', async (t) => {
    // arrange
    const requests: string[] = [];
    const [launchRequestsCompleted, announceLaunchRequests] = completionSignal();
    const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
    when(() =>
      httpFetch('https://connectsense-staging.auth0.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'homebridge-basement-guardian' },
        body: JSON.stringify({
          grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
          realm: 'wayne-water',
          client_id: '6QsGT46CLgeTRGbDDGUwSANLPRA4n5Zs',
          username: 'account@example.test',
          password: 'account-password',
          scope: 'openid profile email',
        }),
        signal: It.matches((signal: AbortSignal) => {
          if (!(signal instanceof AbortSignal) || signal.aborted) {
            return false;
          }

          requests.push('https://connectsense-staging.auth0.com/oauth/token');

          if (requests.length === 2) {
            announceLaunchRequests();
          }

          return true;
        }),
      }),
    )
      .thenReject(new Error('the vendor is unreachable'))
      .times(2);
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    const platform = new BasementGuardianPlatform(createSilentLog(), accountConfig(), api, { httpFetch });
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await launchRequestsCompleted;
    await settle();
    const requestsAfterLaunch = requests.length;
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    assert.deepStrictEqual(
      { requestsAfterLaunch, requestsAfterShutdown: requests.length - requestsAfterLaunch },
      { requestsAfterLaunch: 2, requestsAfterShutdown: 0 },
    );
    assert.deepStrictEqual(requests, ['https://connectsense-staging.auth0.com/oauth/token', 'https://connectsense-staging.auth0.com/oauth/token']);
    verify(httpFetch);
    verify(user);
    verify(api);
  });

  test('AUTH-02 caches the granted token under the Homebridge storage directory', async (t) => {
    // arrange
    const [requestAfterGrant, announceRequestAfterGrant] = completionSignal();
    t.mock.method(globalThis, 'fetch', (input: string | URL) => {
      if (input.toString().endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      announceRequestAfterGrant();

      return Promise.resolve(new Response('{}', { status: 503 }));
    });
    const listeners: (() => void)[] = [];
    let watcher: ReturnType<typeof watch> | undefined;
    // Teardown precedes setup and storage cleanup, including a refused watcher.
    t.after(async () => {
      listeners[1]?.();
      watcher?.close();
      watcher = undefined;
      await settle();
    });
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user, storagePath } = await expectStoragePath(t, api);
    // Atomic renames publish these final files only after their writes finish.
    const stored = [ARRIVAL_ANCHOR_FILENAME, '.basement-guardian-token.json'].sort();
    const pendingFiles = new Set(stored);
    const [filesWritten, announceFilesWritten] = completionSignal();
    watcher = watch(storagePath, { persistent: false }, (event, filename) => {
      if (event === 'rename' && filename !== null) {
        pendingFiles.delete(filename);

        if (pendingFiles.size === 0) {
          announceFilesWritten();
        }
      }
    });
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    new BasementGuardianPlatform(createSilentLog(), accountConfig(), api, { httpFetch: (input, init) => globalThis.fetch(input, init) });
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await filesWritten;
    await Promise.all(stored.map((filename) => readFile(join(storagePath, filename))));
    watcher.close();
    await requestAfterGrant;
    await settle();
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual((await readdir(storagePath)).sort(), stored);
    verify(user);
    verify(api);
  });

  test('registers a newly discovered device once the launch event succeeds', async (t) => {
    // arrange
    const [registered, announceRegistration] = completionSignal();
    t.mock.method(globalThis, 'fetch', (input: string | URL) => {
      const url = input.toString();

      if (url.endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      if (url.endsWith('/devices')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              devices: [
                {
                  accountId: 'account-1',
                  deviceId: DEVICE_ID,
                  deviceTypeId: DEVICE_TYPE_ID,
                  name: 'Sump System',
                  data: {},
                  attributes: { productLine: 'wayneWater', serialNumber: 'serial-1' },
                  connectivity: { connected: true, timestamp: 0 },
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.resolve(new Response('{}', { status: 503 }));
    });
    const registeredAccessories: FakeAccessory[] = [];
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    // `api.hap` is read twice while registering the accessory: once for the
    // UUID derivation, and once by the accessory factory, which declares this
    // plugin's own HomeKit types over the namespace it is given.
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => api.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          const accessory = accessories[0];
          if (
            accessories.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registeredAccessories.push(accessory);
          announceRegistration();
          return true;
        }),
      );
    }).thenReturn(undefined);
    // No `updatePlatformAccessories` expectation: the record the accessory seeds from its first
    // snapshot mutates only the context, because the accessory is not registered yet, and the
    // registration's own cache save is what carries the seeded record to disk. The strict mock
    // fails this case by name if the seed asks Homebridge to update anyway (CTRL-01, D-008).
    new BasementGuardianPlatform(createSilentLog(), accountConfig(), api, { httpFetch: (input, init) => globalThis.fetch(input, init) });
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await registered;
    await settle();
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(
      { count: registeredAccessories.length, device: registeredAccessories[0]?.context.device },
      { count: 1, device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID } },
    );
    verify(user);
    verify(api);
  });

  test('withdraws the offline verdict from every published accessory once polling has failed twice', async (t) => {
    // arrange
    const [registered, announceRegistration] = completionSignal();
    const [offlineWithdrawn, announceOfflineWithdrawal] = completionSignal();
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let deviceListCalls = 0;
    t.mock.method(globalThis, 'fetch', (input: string | URL) => {
      const url = input.toString();

      if (url.endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      if (url.endsWith('/devices')) {
        deviceListCalls += 1;

        return deviceListCalls === 1
          ? Promise.resolve(new Response(JSON.stringify(geminiWireDeviceList()), { status: 200 }))
          : Promise.resolve(new Response('{}', { status: 503 }));
      }

      return Promise.resolve(new Response('{}', { status: 503 }));
    });
    const registeredAccessories: FakeAccessory[] = [];
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    // Twice while registering the accessory: the UUID derivation, then the
    // accessory factory declaring this plugin's own HomeKit types.
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => api.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          const accessory = accessories[0];
          if (
            accessories.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registeredAccessories.push(accessory);
          announceRegistration();
          return true;
        }),
      );
    }).thenReturn(undefined);
    new BasementGuardianPlatform(createSilentLog(), { ...accountConfig(), pollInterval: 300 }, api, {
      httpFetch: (input, init) => globalThis.fetch(input, init),
    });
    const [launch, shutdown] = listeners;
    launch?.();
    await registered;
    await settle();
    const accessory = registeredAccessories[0];

    if (accessory === undefined) {
      throw new Error('the platform registered no accessory');
    }

    const beforeAnyFailure = statusActiveOf(accessory, 'Basement Guardian Offline');
    const offlineService = accessory.getServiceById(HAP.Service.ContactSensor, 'basement-guardian-offline');

    if (offlineService === undefined) {
      throw new Error('the platform published no offline service');
    }

    // Preserve the service receiver while observing its real publication.
    const updateCharacteristic = offlineService.updateCharacteristic.bind(offlineService);
    t.mock.method(offlineService, 'updateCharacteristic', (characteristic: FakeCharacteristicClass, value: unknown) => {
      const result = updateCharacteristic(characteristic, value);

      if (characteristic.UUID === HAP.Characteristic.StatusActive.UUID && value === false) {
        announceOfflineWithdrawal();
      }

      return result;
    });

    // act
    t.mock.timers.tick(300_000);
    await settle();
    t.mock.timers.tick(300_000);
    await settle();
    await offlineWithdrawn;
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(
      {
        beforeAnyFailure,
        offline: statusActiveOf(accessory, 'Basement Guardian Offline'),
        flood: statusActiveOf(accessory, 'Sump Pit Flood'),
        offlineState: contactStateOf(accessory, 'basement-guardian-offline'),
      },
      { beforeAnyFailure: true, offline: false, flood: true, offlineState: CONTACT_DETECTED },
    );
    verify(user);
    verify(api);
  });

  test('unregisters a confirmed-absent accessory once two trustworthy polls and a final check agree it is gone', async (t) => {
    // arrange
    const [registered, announceRegistration] = completionSignal();
    const [removed, announceRemoval] = completionSignal();
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let deviceListCalls = 0;
    t.mock.method(globalThis, 'fetch', (input: string | URL) => {
      const url = input.toString();

      if (url.endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      if (url.endsWith('/devices')) {
        deviceListCalls += 1;

        const wireDevice = {
          accountId: 'account-1',
          deviceId: DEVICE_ID,
          deviceTypeId: DEVICE_TYPE_ID,
          name: 'Sump System',
          data: {},
          attributes: { productLine: 'wayneWater', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
        };
        const body = deviceListCalls === 1 ? { devices: [wireDevice] } : { devices: [] };

        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      }

      return Promise.resolve(new Response('{}', { status: 503 }));
    });
    const registeredAccessories: FakeAccessory[] = [];
    const unregisteredAccessories: FakeAccessory[] = [];
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    // `api.hap` is read three times across this scenario: twice while
    // registering the accessory (the UUID derivation, then the accessory
    // factory), and once more while deriving the same UUID to look the
    // accessory up for removal.
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(3);
    when(() => api.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          const accessory = accessories[0];
          if (
            accessories.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registeredAccessories.push(accessory);
          announceRegistration();
          return true;
        }),
      );
    }).thenReturn(undefined);
    when(() => {
      api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          const accessory = accessories[0];
          if (
            accessories.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          unregisteredAccessories.push(accessory);
          announceRemoval();
          return true;
        }),
      );
    }).thenReturn(undefined);
    const platform = new BasementGuardianPlatform(createSilentLog(), { ...accountConfig(), pollInterval: 300 }, api, {
      httpFetch: (input, init) => globalThis.fetch(input, init),
    });
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await registered;
    await settle();
    t.mock.timers.tick(300_000);
    await settle();
    t.mock.timers.tick(300_000);
    await settle();
    await removed;
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(
      { unregisteredCount: unregisteredAccessories.length, accessoryCount: platform.accessories.size },
      { unregisteredCount: 1, accessoryCount: 0 },
    );
    verify(user);
    verify(api);
  });

  test('reaches no vendor route until Homebridge reports it has finished launching', async (t) => {
    // arrange
    const httpFetch = mock<HttpFetch>({ exactParams: true, name: 'vendor HTTP' });
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);

    // act
    const platform = new BasementGuardianPlatform(createSilentLog(), accountConfig(), api, { httpFetch });
    await settle();

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(httpFetch);
    verify(user);
    verify(api);
  });

  test('registers and removes no accessory across the whole lifecycle', async (t) => {
    // arrange
    t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no request expected')));
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    new BasementGuardianPlatform(createSilentLog(), accountConfig(), api);

    // act
    for (const listener of listeners) {
      listener();
    }

    // assert
    verify(user);
    verify(api);
  });
});

describe('configureAccessory', () => {
  test('records a restored accessory under its UUID', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const restoredAccessory = mock<PlatformAccessory>({ exactParams: true, name: 'restored accessory' });
    when(() => restoredAccessory.UUID).thenReturn('accessory-uuid-1');
    when(() => restoredAccessory.displayName).thenReturn('Sump Pump');
    when(() => restoredAccessory.services)
      .thenReturn([])
      .times(2);
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), api);

    // act
    platform.configureAccessory(restoredAccessory);

    // assert
    assert.deepStrictEqual([...platform.accessories.keys()], ['accessory-uuid-1']);
    const cachedAccessory: BasementGuardianPlatformAccessory | undefined = platform.accessories.get('accessory-uuid-1');
    assert.strictEqual(cachedAccessory, restoredAccessory);
    verify(restoredAccessory);
    verify(api);
  });

  test('keeps one entry when the same accessory is restored twice', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const restoredAccessory = mock<PlatformAccessory>({ exactParams: true, name: 'restored accessory' });
    when(() => restoredAccessory.UUID)
      .thenReturn('accessory-uuid-1')
      .times(2);
    when(() => restoredAccessory.displayName)
      .thenReturn('Sump Pump')
      .times(2);
    when(() => restoredAccessory.services)
      .thenReturn([])
      .times(4);
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), api);

    // act
    platform.configureAccessory(restoredAccessory);
    platform.configureAccessory(restoredAccessory);

    // assert
    assert.deepStrictEqual([...platform.accessories.keys()], ['accessory-uuid-1']);
    assert.strictEqual(platform.accessories.get('accessory-uuid-1'), restoredAccessory);
    verify(restoredAccessory);
    verify(api);
  });

  test('withdraws trust from every restored service that reports it, and still records the accessory (RES-04, D-06)', () => {
    // arrange
    const restoredAccessory = new HarnessPlatformAccessory('Sump Guardian', ACCESSORY_UUID);
    const flood = restoredAccessory.addService(HAP.Service.LeakSensor, 'Sump Pit Flood', 'sump-pit-flood');
    flood.updateCharacteristic(HAP.Characteristic.LeakDetected, HAP.Characteristic.LeakDetected.LEAK_DETECTED);
    flood.updateCharacteristic(HAP.Characteristic.StatusActive, true);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), fakeDiscoveryApi([]));
    when(() => platform.api.hap).thenReturn(HAP_NAMESPACE);

    // act
    platform.configureAccessory(restoredAccessory as unknown as PlatformAccessory);

    // assert
    assert.deepStrictEqual(
      {
        statusActive: flood.getCharacteristic(HAP.Characteristic.StatusActive)?.value,
        leakDetected: flood.getCharacteristic(HAP.Characteristic.LeakDetected)?.value,
        recorded: platform.accessories.get(ACCESSORY_UUID) === (restoredAccessory as unknown as BasementGuardianPlatformAccessory),
      },
      { statusActive: false, leakDetected: HAP.Characteristic.LeakDetected.LEAK_DETECTED, recorded: true },
    );
    verify(platform.api);
  });

  // The window the restart passes exist for. HAP answers a write with no handler by storing the
  // value and reporting success, so before this pass a press on a restored control flipped the
  // toggle, reported that it worked, and sent nothing (RES-04, D-07).
  test('refuses a press on every restored control, so a press before the first poll is not silently accepted (RES-04, D-07)', async () => {
    // arrange
    const restoredAccessory = new HarnessPlatformAccessory('Sump Guardian', ACCESSORY_UUID);
    const control = restoredAccessory.addService(HAP.Service.Switch, 'System Self-Test', 'system-self-test');
    control.updateCharacteristic(HAP.Characteristic.On, false);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), fakeDiscoveryApi([]));
    when(() => platform.api.hap).thenReturn(HAP_NAMESPACE);

    // act
    platform.configureAccessory(restoredAccessory as unknown as PlatformAccessory);

    // assert
    assert.deepStrictEqual(
      { press: await pressOutcomeOf(control), on: control.getCharacteristic(HAP.Characteristic.On)?.value },
      { press: NOT_ALLOWED_IN_CURRENT_STATE, on: false },
    );
    verify(platform.api);
  });

  test('D-03 removes nothing from HomeKit on cache-restore alone', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const staleAccessory = mock<PlatformAccessory>({ exactParams: true, name: 'stale accessory' });
    when(() => staleAccessory.UUID).thenReturn('accessory-uuid-gone');
    when(() => staleAccessory.displayName).thenReturn('Retired Pump');
    when(() => staleAccessory.services)
      .thenReturn([])
      .times(2);
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), api);

    // act
    platform.configureAccessory(staleAccessory);

    // assert
    verify(api);
    verify(staleAccessory);
  });
});

describe('applyMonitoringHealth', () => {
  // Two systems, one account, and each accessory hears the answer for its own controller. The map is
  // keyed by deviceId while the accessory map is keyed by the UUID that deviceId seeds, so this also
  // holds the join: keying the pushed map by the generated UUID makes both accessories miss, both
  // take the missing-entry rule, and the two recorded values stop differing. One accessory could not
  // catch that (D-01, D-01a).
  test('hands each accessory the answer for its own system', () => {
    // arrange
    const heard = new Map<string, MonitoringTrust>();
    const firstAccessory = trustRecordingBasementGuardianAccessory(DEVICE_ID, heard);
    const firstNotification = mock<BasementGuardianAccessory['markMonitoring']>({ exactParams: true, name: 'first accessory trust' });
    when(() => {
      firstNotification({ restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false });
    }).thenReturn(undefined);
    const secondAccessory = trustRecordingBasementGuardianAccessory(SECOND_DEVICE_ID, heard);
    const secondNotification = mock<BasementGuardianAccessory['markMonitoring']>({ exactParams: true, name: 'second accessory trust' });
    when(() => {
      secondNotification({ restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false });
    }).thenReturn(undefined);
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>([
      [
        ACCESSORY_UUID,
        {
          ...firstAccessory,
          markMonitoring: (trust) => {
            firstNotification(trust);
            firstAccessory.markMonitoring(trust);
          },
        },
      ],
      [
        SECOND_ACCESSORY_UUID,
        {
          ...secondAccessory,
          markMonitoring: (trust) => {
            secondNotification(trust);
            secondAccessory.markMonitoring(trust);
          },
        },
      ],
    ]);
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: new Map<string, BasementGuardianPlatformAccessory>(),
      registry: unknownRegistry(),
      basementGuardianAccessories,
    });
    const account = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false } satisfies MonitoringTrust;

    // act
    applyMonitoringHealth(
      context,
      account,
      new Map<string, MonitoringTrust>([
        [DEVICE_ID, { ...account, shadowSilent: true }],
        [SECOND_DEVICE_ID, { ...account, shadowSilent: false }],
      ]),
    );

    // assert
    assert.deepStrictEqual(
      heard,
      new Map<string, MonitoringTrust>([
        [DEVICE_ID, { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false }],
        [SECOND_DEVICE_ID, { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false }],
      ]),
    );
    verify(firstNotification);
    verify(secondNotification);
    verify(context.api);
  });

  // A system the push never named does not vouch. A pump the account gained since the last push, and
  // an accessory Homebridge restored from cache before discovery completed, are both systems nobody
  // has answered for, and an unknown never becomes a normal default in this plugin (D-02).
  //
  // What it resolves to is the account struct with that one member overridden, and not a literal
  // written at the lookup. `MonitoringTrust` has four members and `markMonitoring` compares all four
  // (`src/accessories/basementGuardian.ts:908-912`), so a fresh object built here would assert three
  // facts nobody supplied -- a degraded poll reported as healthy, a refused credential reported as
  // accepted. The three account-wide answers are real and travel through; only the per-device
  // question the push left open is defaulted, which is why this case reads all four members and not
  // just the one it is about.
  test('makes an accessory the push never named decline to vouch, and hands it the account facts unchanged', () => {
    // arrange
    const heard = new Map<string, MonitoringTrust>();
    const firstAccessory = trustRecordingBasementGuardianAccessory(DEVICE_ID, heard);
    const firstNotification = mock<BasementGuardianAccessory['markMonitoring']>({ exactParams: true, name: 'first accessory trust' });
    when(() => {
      firstNotification({ restDegraded: true, shadowSilent: false, commandTransportReady: false, credentialsRejected: false });
    }).thenReturn(undefined);
    const secondAccessory = trustRecordingBasementGuardianAccessory(SECOND_DEVICE_ID, heard);
    const secondNotification = mock<BasementGuardianAccessory['markMonitoring']>({ exactParams: true, name: 'second accessory trust' });
    when(() => {
      secondNotification({ restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: false });
    }).thenReturn(undefined);
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: new Map<string, BasementGuardianPlatformAccessory>(),
      registry: unknownRegistry(),
      basementGuardianAccessories: new Map<string, BasementGuardianAccessory>([
        [
          ACCESSORY_UUID,
          {
            ...firstAccessory,
            markMonitoring: (trust) => {
              firstNotification(trust);
              firstAccessory.markMonitoring(trust);
            },
          },
        ],
        [
          SECOND_ACCESSORY_UUID,
          {
            ...secondAccessory,
            markMonitoring: (trust) => {
              secondNotification(trust);
              secondAccessory.markMonitoring(trust);
            },
          },
        ],
      ]),
    });
    // The account's shadowSilent=false makes the missing entry's override to true observable.
    // Both accessories retain restDegraded=true, commandTransportReady=false and
    // credentialsRejected=false from the account. The named accessory keeps shadowSilent=false;
    // the unnamed accessory defaults to shadowSilent=true because no device entry vouches for it.
    const account = { restDegraded: true, shadowSilent: false, commandTransportReady: false, credentialsRejected: false } satisfies MonitoringTrust;

    // act
    applyMonitoringHealth(context, account, new Map<string, MonitoringTrust>([[DEVICE_ID, account]]));

    // assert
    assert.deepStrictEqual(
      { named: heard.get(DEVICE_ID), unnamed: heard.get(SECOND_DEVICE_ID) },
      {
        named: { restDegraded: true, shadowSilent: false, commandTransportReady: false, credentialsRejected: false },
        unnamed: { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: false },
      },
    );
    verify(firstNotification);
    verify(secondNotification);
    verify(context.api);
  });

  test('reaches nothing when this run has published no accessory yet', () => {
    // arrange
    const noDeviceAnswered = new Map<string, MonitoringTrust>();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: new Map<string, BasementGuardianPlatformAccessory>(),
      registry: unknownRegistry(),
    });

    // act & assert
    assert.doesNotThrow(() => {
      applyMonitoringHealth(context, { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }, noDeviceAnswered);
    });
    verify(context.api);
  });

  // The walk is over the platform's own accessory map rather than over the `BasementGuardianAccessory`
  // instances, because a run whose first grant the vendor refused never reaches discovery and has
  // none of the latter. These two accessories are exactly what a halted restart holds: restored,
  // carrying the values the previous run published, and belonging to no accessory instance at all
  // (RES-04, D-10).
  test('makes every restored accessory unreadable when the vendor has refused the credentials', () => {
    // arrange
    const noDeviceAnswered = new Map<string, MonitoringTrust>();
    const restored = restoredAccessories();
    const context = discoveryContext({ api: fakeDiscoveryApi([]), accessories: restored.accessories, registry: unknownRegistry() });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);

    // act
    applyMonitoringHealth(context, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }, noDeviceAnswered);

    // assert
    assert.deepStrictEqual(trustReadsOf(restored.floods), [
      { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
      { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
    ]);
    verify(context.api);
  });

  // A refusal that arrives after a successful start reaches the accessories this run built, not only
  // the ones a halted launch found in the cache. Both kinds are in the platform's own accessory map,
  // which is what the unreadable pass walks, and the built one is here as well -- so the pass that
  // reaches a restored accessory is proven to reach a discovered one in the same call (CR-03, D-10).
  test('makes an accessory a successful inventory built unreadable in the same pass as a restored one', () => {
    // arrange
    const marks: string[] = [];
    const restored = restoredAccessories();
    const firstAccessory = recordingBasementGuardianAccessory(DEVICE_ID, marks);
    const firstNotification = mock<BasementGuardianAccessory['markMonitoring']>({ exactParams: true, name: 'first accessory trust' });
    when(() => {
      firstNotification({ restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true });
    }).thenReturn(undefined);
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: restored.accessories,
      registry: unknownRegistry(),
      basementGuardianAccessories: new Map<string, BasementGuardianAccessory>([
        [
          ACCESSORY_UUID,
          {
            ...firstAccessory,
            markMonitoring: (trust) => {
              firstNotification(trust);
              firstAccessory.markMonitoring(trust);
            },
          },
        ],
      ]),
    });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);

    const account = { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true } satisfies MonitoringTrust;

    // act
    // The map names this case's own device, rather than being left empty, because the refusal here
    // followed a successful start: that run discovered the device and heard from it, so an empty map
    // would say the plugin had stopped hearing a controller that was speaking, and the case would
    // have to have its expectation edited to match. The subject is the credential branch reaching a
    // built accessory and a restored one in the same pass, and it stays that.
    applyMonitoringHealth(context, account, new Map<string, MonitoringTrust>([[DEVICE_ID, account]]));

    // assert
    assert.deepStrictEqual(
      { marks, reads: trustReadsOf(restored.floods) },
      {
        marks: [`${DEVICE_ID} rest false shadow false`],
        reads: [
          { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
          { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
        ],
      },
    );
    verify(firstNotification);
    verify(context.api);
  });

  // The recording instance observes the account-wide fan-out beside the restored services' failure
  // status. It publishes no characteristic values, so either push order leaves those statuses
  // unchanged. The republishing instance in the next case makes ordering observable (WR-01).
  test('leaves the pushed status standing after the boolean fan-out has run', () => {
    // arrange
    const noDeviceAnswered = new Map<string, MonitoringTrust>();
    const marks: string[] = [];
    const restored = restoredAccessories();
    const firstAccessory = recordingBasementGuardianAccessory(DEVICE_ID, marks);
    const firstNotification = mock<BasementGuardianAccessory['markMonitoring']>({ exactParams: true, name: 'first accessory trust' });
    when(() => {
      firstNotification({ restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: true });
    }).thenReturn(undefined);
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: restored.accessories,
      registry: unknownRegistry(),
      basementGuardianAccessories: new Map<string, BasementGuardianAccessory>([
        [
          ACCESSORY_UUID,
          {
            ...firstAccessory,
            markMonitoring: (trust) => {
              firstNotification(trust);
              firstAccessory.markMonitoring(trust);
            },
          },
        ],
      ]),
    });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);

    // act
    applyMonitoringHealth(context, { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, noDeviceAnswered);

    // assert
    assert.deepStrictEqual(
      { marks, statuses: statusesOf(restored.floods) },
      { marks: [`${DEVICE_ID} rest true shadow true`], statuses: [COMMUNICATION_FAILURE, COMMUNICATION_FAILURE] },
    );
    verify(firstNotification);
    verify(context.api);
  });

  // The ordering inside the fan-out is load-bearing and this is what pins it: an ordinary push clears
  // a stored status, so an error pushed before `markMonitoring` republished its rows would be
  // silently undone by the boolean that followed it. The accessory here is real and publishes onto
  // the same flood service the error push walks, so an inverted order is observable as a readable
  // value where a status should stand.
  //
  // Credential refusal withdraws every trust scope, so this real accessory republishes its trust
  // report as `false` before the error lands. The recording-only fixture retains the `true` seeded
  // by `restoredAccessories`, because it has no instance publishing onto those services (D-10).
  test('leaves the pushed status standing over an accessory that republishes its own rows', () => {
    // arrange
    const noDeviceAnswered = new Map<string, MonitoringTrust>();
    const live = restoredAccessoryRepublishingItsRows();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: live.accessories,
      registry: powerRegistry(),
      basementGuardianAccessories: live.basementGuardianAccessories,
    });
    when(() => context.api.hap).thenReturn(HAP_NAMESPACE);

    // act
    applyMonitoringHealth(context, { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, noDeviceAnswered);

    // assert
    assert.deepStrictEqual(trustReadsOf(live.floods), [
      { statusActive: { value: false, threw: COMMUNICATION_FAILURE }, leakDetected: { value: 0, threw: undefined } },
    ]);
    verify(context.api);
  });

  // Two identically built republishing fixtures distinguish the push orders: the plugin's order
  // leaves the failure status standing, and the inverted order restores a readable value.
  // Calling the collaborators directly checks that fixture property without copying
  // `applyMonitoringHealth`'s body (WR-01).
  test('reads a different trust report under each push order, which is what makes the ordering case able to fail', () => {
    // arrange
    const inPluginOrder = restoredAccessoryRepublishingItsRows();
    const inverted = restoredAccessoryRepublishingItsRows();
    const refusal = { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: true } satisfies MonitoringTrust;
    const markUnreadable: (accessories: Map<string, BasementGuardianPlatformAccessory>) => void = (
      accessories: Map<string, BasementGuardianPlatformAccessory>,
    ): void => {
      for (const accessory of accessories.values()) {
        markTrustReportsUnreadable(accessory, HAP_NAMESPACE, HAP_NAMESPACE.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
      }
    };

    // act
    for (const built of inPluginOrder.basementGuardianAccessories.values()) {
      built.markMonitoring(refusal);
    }

    markUnreadable(inPluginOrder.accessories);
    markUnreadable(inverted.accessories);

    for (const built of inverted.basementGuardianAccessories.values()) {
      built.markMonitoring(refusal);
    }

    // assert
    assert.notDeepStrictEqual(statusesOf(inPluginOrder.floods), statusesOf(inverted.floods));
    assert.deepStrictEqual(
      { pluginOrder: statusesOf(inPluginOrder.floods), inverted: statusesOf(inverted.floods) },
      { pluginOrder: [COMMUNICATION_FAILURE], inverted: [READ_SUCCEEDS] },
    );
  });

  test('retains a cached control without inventing a trust characteristic when credentials are refused', () => {
    // arrange
    const noDeviceAnswered = new Map<string, MonitoringTrust>();
    const restored = restoredAccessoryCarryingNoTrustReport();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: restored.accessories,
      registry: unknownRegistry(),
      log: createSilentLog(),
    });
    when(() => context.api.hap).thenReturn(HAP_NAMESPACE);

    // act
    applyMonitoringHealth(context, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }, noDeviceAnswered);

    // assert
    assert.deepStrictEqual(
      {
        accessoryIds: [...context.accessories.keys()],
        instanceIds: [...context.basementGuardianAccessories.keys()],
        carriesTrust: restored.control.testCharacteristic(HAP.Characteristic.StatusActive),
        on: readOf(restored.control, HAP.Characteristic.On),
      },
      { accessoryIds: [ACCESSORY_UUID], instanceIds: [], carriesTrust: false, on: { value: true, threw: undefined } },
    );
    verify(context.api);
  });

  test('retains both cached accessories and their readings while refused credentials make trust unreadable', () => {
    // arrange
    const noDeviceAnswered = new Map<string, MonitoringTrust>();
    const restored = restoredAccessories();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: restored.accessories,
      registry: unknownRegistry(),
      log: createSilentLog(),
    });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);

    // act
    applyMonitoringHealth(context, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }, noDeviceAnswered);

    // assert
    assert.deepStrictEqual(
      {
        accessoryIds: [...context.accessories.keys()],
        instanceIds: [...context.basementGuardianAccessories.keys()],
        reads: trustReadsOf(restored.floods),
      },
      {
        accessoryIds: [ACCESSORY_UUID, SECOND_ACCESSORY_UUID],
        instanceIds: [],
        reads: [
          { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
          { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
        ],
      },
    );
    verify(context.api);
  });

  test('creates no accessory or live instance when credentials are refused before discovery', () => {
    // arrange
    const noDeviceAnswered = new Map<string, MonitoringTrust>();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: new Map<string, BasementGuardianPlatformAccessory>(),
      registry: unknownRegistry(),
      log: createSilentLog(),
    });

    // act
    applyMonitoringHealth(context, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }, noDeviceAnswered);

    // assert
    assert.deepStrictEqual(
      { accessories: context.accessories, instances: context.basementGuardianAccessories },
      { accessories: new Map(), instances: new Map() },
    );
    verify(context.api);
  });

  // Credential rejection is the only cause in this plugin that makes a characteristic unreadable.
  // Every row here is a degradation that clears itself once its transport returns, and greying out an
  // accessory for one of those teaches an owner to ignore the one signal that needs them
  // (D-10).
  for (const { cause, trust } of [
    { cause: 'a shadow silence', trust: { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false } },
    { cause: 'a REST degradation', trust: { restDegraded: true, shadowSilent: false, commandTransportReady: false, credentialsRejected: false } },
    { cause: 'an unready command transport', trust: { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false } },
    { cause: 'both transports lost', trust: { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: false } },
  ] satisfies readonly { cause: string; trust: MonitoringTrust }[]) {
    test(`leaves every restored accessory readable for ${cause}`, () => {
      // arrange
      const noDeviceAnswered = new Map<string, MonitoringTrust>();
      const restored = restoredAccessories();
      const context = discoveryContext({ api: fakeDiscoveryApi([]), accessories: restored.accessories, registry: unknownRegistry() });

      // act
      applyMonitoringHealth(context, trust, noDeviceAnswered);

      // assert
      assert.deepStrictEqual(trustReadsOf(restored.floods), [
        { statusActive: { value: true, threw: undefined }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
        { statusActive: { value: true, threw: undefined }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
      ]);
      verify(context.api);
    });
  }
});

describe('registerDiscoveredDevices', () => {
  for (const { location, accept, acceptedUuids } of [
    { location: 'before acceptance', accept: () => undefined, acceptedUuids: [] },
    {
      location: 'after acceptance',
      accept: (uuid: string, accepted: string[]) => {
        accepted.push(uuid);
      },
      acceptedUuids: [ACCESSORY_UUID],
    },
  ]) {
    test(`suspends uncertain registration ${location} across rebuilt contexts and reappearance`, (t) => {
      // arrange
      const accessories = new Map<string, BasementGuardianPlatformAccessory>();
      const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
      const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
      const subscribeSpy = t.mock.method(store, 'subscribe');
      const accepted: string[] = [];
      const registrations: { plugin: string; platform: string; uuids: string[]; cached: boolean[]; listeners: string[] }[] = [];
      const diagnostics: unknown[][] = [];
      const registration = mock<Pick<API, 'registerPlatformAccessories'>>({ exactParams: true, name: 'registration' });
      const removal = mock<API['unregisterPlatformAccessories']>({ exactParams: true, name: 'removal' });
      const diagnostic = mock<Pick<Logging, 'error'>>({ exactParams: true, name: 'restart diagnostic' });
      const registrationError = new Error('private-response-body account-private credential-private token-private');
      const log = createRedactingLogger({
        delegate: Object.assign(createSilentLog(), {
          error: (message: string, ...parameters: unknown[]) => {
            diagnostic.error(message, ...parameters);
            diagnostics.push([message, ...parameters]);
          },
        }),
        secrets: ['account-private', 'credential-private'],
      });
      log.registerSecret('token-private');
      when(() => {
        diagnostic.error('Accessory registration outcome is uncertain. Restart Homebridge before this device can be registered again.');
      }).thenReturn(undefined);
      when(() => {
        registration.registerPlatformAccessories(
          PLUGIN_NAME,
          PLATFORM_NAME,
          It.matches((candidates: PlatformAccessory[]) => {
            const accessory = candidates[0];
            if (
              candidates.length !== 1 ||
              !(accessory instanceof HarnessPlatformAccessory) ||
              accessory.UUID !== ACCESSORY_UUID ||
              accessory.displayName !== 'Sump System' ||
              !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
            ) {
              return false;
            }

            registrations.push({
              plugin: PLUGIN_NAME,
              platform: PLATFORM_NAME,
              uuids: candidates.map((candidate) => candidate.UUID),
              cached: candidates.map((candidate) => accessories.has(candidate.UUID)),
              listeners: subscribeSpy.mock.calls.map((call) => call.arguments[0]),
            });
            accept(ACCESSORY_UUID, accepted);
            return true;
          }),
        );
      }).thenThrow(registrationError);
      when(() => {
        registration.registerPlatformAccessories(
          PLUGIN_NAME,
          PLATFORM_NAME,
          It.matches((candidates: PlatformAccessory[]) => {
            const accessory = candidates[0];
            if (
              candidates.length !== 1 ||
              !(accessory instanceof HarnessPlatformAccessory) ||
              accessory.UUID !== SECOND_ACCESSORY_UUID ||
              accessory.displayName !== 'Second System' ||
              !isDeepStrictEqual(accessory.context.device, { deviceId: SECOND_DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
            ) {
              return false;
            }

            registrations.push({
              plugin: PLUGIN_NAME,
              platform: PLATFORM_NAME,
              uuids: candidates.map((candidate) => candidate.UUID),
              cached: candidates.map((candidate) => accessories.has(candidate.UUID)),
              listeners: subscribeSpy.mock.calls.map((call) => call.arguments[0]),
            });
            return true;
          }),
        );
      }).thenReturn(undefined);
      const api: API = fakeDiscoveryApi([]);
      when(() => api.hap)
        .thenReturn(HAP_NAMESPACE)
        .times(9);
      when(() => api.platformAccessory)
        .thenReturn(PLATFORM_ACCESSORY)
        .times(2);
      when(() => api.registerPlatformAccessories)
        .thenReturn((...parameters) => {
          registration.registerPlatformAccessories(...parameters);
        })
        .times(2);
      when(() => api.unregisterPlatformAccessories)
        .thenReturn(removal)
        .atMost(1);
      const context = (): DiscoveryContext => discoveryContext({ api, accessories, basementGuardianAccessories, registry: powerRegistry(), log });
      store.applyDiscovery({ ...geminiDevice(), data: { ac_power: false } });
      store.applyDiscovery({ ...geminiDevice(), deviceId: SECOND_DEVICE_ID, name: 'Second System', serialNumber: 'serial-2', data: { ac_power: false } });

      // act
      registerDiscoveredDevices(context(), [DEVICE_ID, SECOND_DEVICE_ID], store);
      const initialOwnership = structuredClone({
        accessoryOwners: [...accessories].map(([uuid, accessory]) => [uuid, accessory.context.device]),
        instanceOwners: [...basementGuardianAccessories].map(([uuid, accessory]) => [uuid, accessory.deviceId]),
        listenerOwners: subscribeSpy.mock.calls.map((call) => call.arguments[0]),
        accepted,
      });
      const healthyAccessory = accessories.get(SECOND_ACCESSORY_UUID);
      const healthyInstance = basementGuardianAccessories.get(SECOND_ACCESSORY_UUID);

      if (healthyAccessory === undefined || healthyInstance === undefined) {
        throw new Error('the healthy device has no public owner');
      }

      const updateSpy = t.mock.method(healthyInstance, 'update');
      registerDiscoveredDevices(context(), [DEVICE_ID, SECOND_DEVICE_ID], store);
      registerDiscoveredDevices(context(), [], store);
      removeDiscoveredDevice(context(), DEVICE_ID, store);
      store.remove(DEVICE_ID);
      registerDiscoveredDevices(context(), [], store);
      store.applyDiscovery({ ...geminiDevice(), data: { ac_power: false } });
      registerDiscoveredDevices(context(), [DEVICE_ID, SECOND_DEVICE_ID], store);
      store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));
      store.applyReportedPatch(SECOND_DEVICE_ID, reportedPatch({ ac_power: true }));
      const laterOwnership = structuredClone({
        accessoryOwners: [...accessories].map(([uuid, accessory]) => [uuid, accessory.context.device]),
        instanceOwners: [...basementGuardianAccessories].map(([uuid, accessory]) => [uuid, accessory.deviceId]),
        sameAccessory: accessories.get(SECOND_ACCESSORY_UUID) === healthyAccessory,
        sameInstance: basementGuardianAccessories.get(SECOND_ACCESSORY_UUID) === healthyInstance,
        listenerOwners: subscribeSpy.mock.calls.map((call) => call.arguments[0]),
        healthyUpdates: updateSpy.mock.calls.map((call) => ({ deviceId: call.arguments[0].identity.deviceId, source: call.arguments[1] })),
        mainsLost: healthyAccessory
          .getServiceById(HAP_NAMESPACE.Service.ContactSensor, 'mains-power-lost')
          ?.getCharacteristic(HAP_NAMESPACE.Characteristic.ContactSensorState).value,
        canonical: [store.snapshot(DEVICE_ID), store.snapshot(SECOND_DEVICE_ID)],
        accepted,
      });

      // assert
      assert.deepStrictEqual(initialOwnership, {
        accessoryOwners: [[SECOND_ACCESSORY_UUID, { deviceId: SECOND_DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }]],
        instanceOwners: [[SECOND_ACCESSORY_UUID, SECOND_DEVICE_ID]],
        listenerOwners: [SECOND_DEVICE_ID],
        accepted: acceptedUuids,
      });
      assert.deepStrictEqual(laterOwnership, {
        accessoryOwners: [[SECOND_ACCESSORY_UUID, { deviceId: SECOND_DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }]],
        instanceOwners: [[SECOND_ACCESSORY_UUID, SECOND_DEVICE_ID]],
        sameAccessory: true,
        sameInstance: true,
        listenerOwners: [SECOND_DEVICE_ID],
        healthyUpdates: [
          { deviceId: SECOND_DEVICE_ID, source: 'poll' },
          { deviceId: SECOND_DEVICE_ID, source: 'poll' },
          { deviceId: SECOND_DEVICE_ID, source: 'live' },
        ],
        mainsLost: CONTACT_DETECTED,
        canonical: [
          {
            identity: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
            connectivity: { connected: true, timestamp: 0 },
            data: { ac_power: true },
            metadata: {},
            shadowVersion: undefined,
            deviceTimestamp: 0,
            receivedAt: 0,
          },
          {
            identity: { deviceId: SECOND_DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Second System', serialNumber: 'serial-2' },
            connectivity: { connected: true, timestamp: 0 },
            data: { ac_power: true },
            metadata: {},
            shadowVersion: undefined,
            deviceTimestamp: 0,
            receivedAt: 0,
          },
        ],
        accepted: acceptedUuids,
      });
      assert.deepStrictEqual(registrations, [
        { plugin: PLUGIN_NAME, platform: PLATFORM_NAME, uuids: [ACCESSORY_UUID], cached: [false], listeners: [] },
        { plugin: PLUGIN_NAME, platform: PLATFORM_NAME, uuids: [SECOND_ACCESSORY_UUID], cached: [false], listeners: [] },
      ]);
      assert.deepStrictEqual(diagnostics, [['Accessory registration outcome is uncertain. Restart Homebridge before this device can be registered again.']]);
      verify(registration);
      verify(removal);
      verify(diagnostic);
      verify(api);
    });
  }

  test('owns a fresh run independently and honors an accessory restored through configureAccessory', (t) => {
    // arrange
    const registration = mock<Pick<API, 'registerPlatformAccessories'>>({ exactParams: true, name: 'fresh registration' });
    const registrations: { plugin: string; platform: string; uuids: string[]; mainsLost: unknown }[] = [];
    when(() => {
      registration.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    }).thenThrow(new Error('uncertain prior run'));
    when(() => {
      registration.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registrations.push({
            plugin: PLUGIN_NAME,
            platform: PLATFORM_NAME,
            uuids: candidates.map((candidate) => candidate.UUID),
            mainsLost: accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost')?.getCharacteristic(HAP.Characteristic.ContactSensorState)?.value,
          });
          return true;
        }),
      );
    }).thenReturn(undefined);
    const api: API = fakeDiscoveryApi([]);
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(9);
    when(() => api.platformAccessory)
      .thenReturn(PLATFORM_ACCESSORY)
      .times(2);
    when(() => api.registerPlatformAccessories)
      .thenReturn((...parameters) => {
        registration.registerPlatformAccessories(...parameters);
      })
      .times(2);
    when(() => {
      api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    }).thenReturn(undefined);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), api);
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const subscribeSpy = t.mock.method(store, 'subscribe');
    store.applyDiscovery({ ...geminiDevice(), data: { ac_power: false } });
    const context = (): DiscoveryContext =>
      discoveryContext({ api, accessories: platform.accessories, basementGuardianAccessories, registry: powerRegistry() });
    const priorPlatform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), api);
    const priorStore = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const priorInstances = new Map<string, BasementGuardianAccessory>();
    priorStore.applyDiscovery({ ...geminiDevice(), data: { ac_power: false } });

    // act
    registerDiscoveredDevices(
      discoveryContext({ api, accessories: priorPlatform.accessories, basementGuardianAccessories: priorInstances, registry: powerRegistry() }),
      [DEVICE_ID],
      priorStore,
    );
    registerDiscoveredDevices(context(), [DEVICE_ID], store);
    const registered = platform.accessories.get(ACCESSORY_UUID);

    if (registered === undefined) {
      throw new Error('the first run did not register its accessory');
    }

    registerDiscoveredDevices(context(), [DEVICE_ID], store);
    const restartedPlatform = new BasementGuardianPlatform(createSilentLog(), emptyConfig(), api);
    const restoredInstances = new Map<string, BasementGuardianAccessory>();
    const restoredStore = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const restoredSubscribeSpy = t.mock.method(restoredStore, 'subscribe');
    restartedPlatform.configureAccessory(registered);
    restoredStore.applyDiscovery({ ...geminiDevice(), data: { ac_power: false } });
    const restoredContext = (): DiscoveryContext =>
      discoveryContext({ api, accessories: restartedPlatform.accessories, basementGuardianAccessories: restoredInstances, registry: powerRegistry() });
    registerDiscoveredDevices(restoredContext(), [DEVICE_ID], restoredStore);
    registerDiscoveredDevices(restoredContext(), [DEVICE_ID], restoredStore);
    restoredStore.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));

    // assert
    assert.deepStrictEqual(
      {
        firstOwners: [...platform.accessories.keys()],
        firstInstances: [...basementGuardianAccessories].map(([uuid, accessory]) => [uuid, accessory.deviceId]),
        restoredOwners: [...restartedPlatform.accessories.keys()],
        restoredInstances: [...restoredInstances].map(([uuid, accessory]) => [uuid, accessory.deviceId]),
        restoredIdentity: restartedPlatform.accessories.get(ACCESSORY_UUID) === registered,
        firstListeners: subscribeSpy.mock.calls.map((call) => call.arguments[0]),
        restoredListeners: restoredSubscribeSpy.mock.calls.map((call) => call.arguments[0]),
        mainsLost: registered
          .getServiceById(HAP_NAMESPACE.Service.ContactSensor, 'mains-power-lost')
          ?.getCharacteristic(HAP_NAMESPACE.Characteristic.ContactSensorState).value,
      },
      {
        firstOwners: [ACCESSORY_UUID],
        firstInstances: [[ACCESSORY_UUID, DEVICE_ID]],
        restoredOwners: [ACCESSORY_UUID],
        restoredInstances: [[ACCESSORY_UUID, DEVICE_ID]],
        restoredIdentity: true,
        firstListeners: [DEVICE_ID],
        restoredListeners: [DEVICE_ID],
        mainsLost: CONTACT_DETECTED,
      },
    );
    assert.deepStrictEqual(registrations, [{ plugin: PLUGIN_NAME, platform: PLATFORM_NAME, uuids: [ACCESSORY_UUID], mainsLost: CONTACT_NOT_DETECTED }]);
    verify(registration);
    verify(api);
  });

  test('registers one accessory for a newly discovered device not already in accessories', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => api.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registerCalls.push({ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, accessories: [accessory] } satisfies FakeApiCall);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: implementedRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryCount: accessories.size,
        registerCalls: registerCalls.map((call) => ({
          pluginIdentifier: call.pluginIdentifier,
          platformName: call.platformName,
          deviceIds: call.accessories.map((accessory) => accessory.context.device),
        })),
      },
      {
        accessoryCount: 1,
        registerCalls: [{ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, deviceIds: [{ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }] }],
      },
    );
    verify(api);
  });

  test('updates a deviceId already present in accessories in place instead of registering it again', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => {
      api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          updateCalls.push([accessory]);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Sump System', uuid);
    existing.context.lastVendorName = 'Sump System';
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryCount: accessories.size,
        registerCalls,
        displayName: existing.displayName,
        device: existing.context.device,
        updatedAccessoryCount: updateCalls.length,
      },
      {
        accessoryCount: 1,
        registerCalls: [],
        displayName: 'Sump System',
        device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
        updatedAccessoryCount: 1,
      },
    );
    verify(api);
  });

  test('adopts a vendor rename when the display name still matches the stored vendor name', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => {
      api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump Sentry' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          updateCalls.push([accessory]);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Sump System', uuid);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), name: 'Sump Sentry' });

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { displayName: existing.displayName, lastVendorName: existing.context.lastVendorName, updatedAccessoryCount: updateCalls.length },
      { displayName: 'Sump Sentry', lastVendorName: 'Sump Sentry', updatedAccessoryCount: 1 },
    );
    verify(api);
  });

  test('keeps a customized display name but still advances the stored vendor name', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => {
      api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Basement Pump' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          updateCalls.push([accessory]);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Basement Pump', uuid);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), name: 'Sump Sentry' });

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { displayName: existing.displayName, lastVendorName: existing.context.lastVendorName, updatedAccessoryCount: updateCalls.length },
      { displayName: 'Basement Pump', lastVendorName: 'Sump Sentry', updatedAccessoryCount: 1 },
    );
    verify(api);
  });

  test('calls updatePlatformAccessories no times when nothing about the cached accessory changed', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Sump System', uuid);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { displayName: existing.displayName, lastVendorName: existing.context.lastVendorName, updatedAccessoryCount: updateCalls.length },
      { displayName: 'Sump System', lastVendorName: 'Sump System', updatedAccessoryCount: 0 },
    );
    verify(api);
  });

  // The first poll on a new device runs before registration for throw-safety, and it always seeds
  // the pump records, which fires the persist port. An update call for a never-registered accessory
  // poisons Homebridge's cached-accessory list and voids the registration that follows, so the port
  // must stay silent until the platform has recorded the accessory as its own (DEV-01, CTRL-01).
  test('registers a newly discovered device without asking Homebridge to update a never-registered accessory', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => api.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registerCalls.push({ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, accessories: [accessory] } satisfies FakeApiCall);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: powerRegistry() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { registered: registerCalls.map((call) => call.accessories.map((accessory) => accessory.UUID)), updated: updateCalls },
      { registered: [[ACCESSORY_UUID]], updated: [] },
    );
    verify(api);
  });

  test('persists a vendor rename it already applied when the update that follows it throws', () => {
    // arrange
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi([], updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => {
      api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump Sentry' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          updateCalls.push([accessory]);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const existing = new HarnessPlatformAccessory('Sump System', ACCESSORY_UUID);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(ACCESSORY_UUID, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), name: 'Sump Sentry' });
    const family = recoveringFamily();
    const registry: FamilyRegistry = { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family }), shouldLog: () => true };

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry, log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        displayName: existing.displayName,
        persisted: updateCalls.map((call) => call.map((persistedAccessory) => persistedAccessory.displayName)),
      },
      { displayName: 'Sump Sentry', persisted: [['Sump Sentry']] },
    );
    verify(api);
  });

  test('does nothing for a deviceId the store holds no snapshot for', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual({ accessoryCount: accessories.size, registerCalls }, { accessoryCount: 0, registerCalls: [] });
    verify(api);
  });

  test('retains an unsupported device in canonical state without publishing an accessory', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const context = discoveryContext({ api, accessories, registry: unsupportedRegistry(true), log: createSilentLog() });

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { accessories, instances: context.basementGuardianAccessories, canonical: store.snapshot(DEVICE_ID) },
      {
        accessories: new Map(),
        instances: new Map(),
        canonical: {
          identity: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
          data: {},
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: 0,
          receivedAt: 0,
        },
      },
    );
    assert.deepStrictEqual(registerCalls, []);
    verify(api);
  });

  test('retains an unknown device in canonical state without publishing an accessory', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const context = discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() });

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { accessories, instances: context.basementGuardianAccessories, canonical: store.snapshot(DEVICE_ID) },
      {
        accessories: new Map(),
        instances: new Map(),
        canonical: {
          identity: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
          data: {},
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: 0,
          receivedAt: 0,
        },
      },
    );
    assert.deepStrictEqual(registerCalls, []);
    verify(api);
  });

  test('keeps an already explained unsupported device unregistered without removing canonical state', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const context = discoveryContext({ api, accessories, registry: unsupportedRegistry(false), log: createSilentLog() });

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { accessories, instances: context.basementGuardianAccessories, canonical: store.snapshot(DEVICE_ID) },
      {
        accessories: new Map(),
        instances: new Map(),
        canonical: {
          identity: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
          data: {},
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: 0,
          receivedAt: 0,
        },
      },
    );
    assert.deepStrictEqual(registerCalls, []);
    verify(api);
  });

  test('registers a valid device after skipping an unsupported device earlier in the same batch', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(3);
    when(() => api.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registerCalls.push({ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, accessories: [accessory] } satisfies FakeApiCall);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const haloDeviceId = 'halo-device';
    store.applyDiscovery({ ...geminiDevice(), deviceId: haloDeviceId, deviceTypeId: 'wayneWaterHalo' });
    store.applyDiscovery(geminiDevice());
    const registry: FamilyRegistry = {
      lookup: (deviceTypeId: string): FamilyOutcome<unknown> =>
        deviceTypeId === DEVICE_TYPE_ID
          ? { kind: 'implemented', family: fakeFamily() }
          : { kind: 'unsupported', deviceTypeId, displayName: 'Wayne Water HALO' },
      shouldLog: () => true,
    };

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry, log: createSilentLog() }), [haloDeviceId, DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryCount: accessories.size,
        registeredDeviceIds: registerCalls.flatMap((call) => call.accessories.map((accessory) => accessory.context.device)),
      },
      { accessoryCount: 1, registeredDeviceIds: [{ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }] },
    );
    verify(api);
  });

  test('registers a healthy device after an earlier device in the same batch throws', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(4);
    when(() => api.platformAccessory)
      .thenReturn(PLATFORM_ACCESSORY)
      .times(2);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registerCalls.push({ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, accessories: [accessory] } satisfies FakeApiCall);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), deviceId: THROWING_DEVICE_ID });
    store.applyDiscovery(geminiDevice());
    const registry: FamilyRegistry = { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: throwingFamily() }), shouldLog: () => true };
    const context = discoveryContext({ api, accessories, registry, log: createSilentLog() });

    // act
    registerDiscoveredDevices(context, [THROWING_DEVICE_ID, DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryOwners: [...accessories].map(([uuid, accessory]) => [uuid, accessory.context.device]),
        instanceOwners: [...context.basementGuardianAccessories].map(([uuid, accessory]) => [uuid, accessory.deviceId]),
        canonical: store.deviceIds().map((deviceId) => store.snapshot(deviceId)),
      },
      {
        accessoryOwners: [[ACCESSORY_UUID, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }]],
        instanceOwners: [[ACCESSORY_UUID, DEVICE_ID]],
        canonical: [
          {
            identity: { deviceId: THROWING_DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
            connectivity: { connected: true, timestamp: 0 },
            data: {},
            metadata: {},
            shadowVersion: undefined,
            deviceTimestamp: 0,
            receivedAt: 0,
          },
          {
            identity: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
            connectivity: { connected: true, timestamp: 0 },
            data: {},
            metadata: {},
            shadowVersion: undefined,
            deviceTimestamp: 0,
            receivedAt: 0,
          },
        ],
      },
    );
    assert.deepStrictEqual(
      registerCalls.flatMap((call) => call.accessories.map((accessory) => accessory.context.device)),
      [{ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }],
    );
    verify(api);
  });

  test('publishes onto the accessory it registered after a first update on a new device throws', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(4);
    when(() => api.platformAccessory)
      .thenReturn(PLATFORM_ACCESSORY)
      .times(2);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registerCalls.push({ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, accessories: [accessory] } satisfies FakeApiCall);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), data: { ac_power: false } });
    const family = recoveringFamily();
    const registry: FamilyRegistry = { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family }), shouldLog: () => true };
    const context = discoveryContext({ api, accessories, registry, log: createSilentLog() });
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    const registered = onlyRegisteredAccessory(registerCalls);
    assert.deepStrictEqual(publishedServiceNames(registered), [
      'Sump Pit Flood',
      'Sump Pit Level',
      'Primary Pump',
      'Primary Pump Running',
      'Backup Pump',
      'Backup Pump Running',
      'Sump Mains Power',
      'Mains Power Lost',
      'Backup Battery Level',
      'Backup Battery',
      'Primary Pump Fault',
      'Backup Pump Fault',
      'Water Sensor Fault',
      'Pump Controller Link Lost',
      'System Self-Test',
      'Alarm Mute',
      'Basement Guardian Offline',
    ]);
    assert.strictEqual(contactStateOf(registered, 'mains-power-lost'), CONTACT_NOT_DETECTED);
    verify(api);
  });

  test('reuses the same accessory and live instance across repeated polls', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(3);
    when(() => api.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          registerCalls.push({ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, accessories: [accessory] } satisfies FakeApiCall);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const context = discoveryContext({ api, accessories, basementGuardianAccessories, registry: implementedRegistry(), log: createSilentLog() });

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);
    const firstAccessory = accessories.get(ACCESSORY_UUID);
    const firstInstance = builtAccessory(basementGuardianAccessories);
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryOwners: [...accessories].map(([uuid, accessory]) => [uuid, accessory.context.device]),
        instanceOwners: [...basementGuardianAccessories].map(([uuid, accessory]) => [uuid, accessory.deviceId]),
        canonical: store.snapshot(DEVICE_ID),
      },
      {
        accessoryOwners: [[ACCESSORY_UUID, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }]],
        instanceOwners: [[ACCESSORY_UUID, DEVICE_ID]],
        canonical: {
          identity: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
          data: {},
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: 0,
          receivedAt: 0,
        },
      },
    );
    assert.strictEqual(accessories.get(ACCESSORY_UUID), firstAccessory);
    assert.strictEqual(builtAccessory(basementGuardianAccessories), firstInstance);
    verify(api);
  });

  test('delivers a between-poll shadow change to HomeKit without waiting for the next poll', () => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, registry: powerRegistry() });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => {
      context.api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    })
      .thenReturn(undefined)
      .times(2);
    const accessory = registeredDevice(context, accessories, store);
    const beforePatch = contactStateOf(accessory, 'mains-power-lost');

    // act
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));

    // assert
    assert.deepStrictEqual(
      { beforePatch, afterPatch: contactStateOf(accessory, 'mains-power-lost') },
      { beforePatch: CONTACT_NOT_DETECTED, afterPatch: CONTACT_DETECTED },
    );
    verify(context.api);
  });

  test('updates from the poll as poll-sourced and from the store notification as live', (t) => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, basementGuardianAccessories, registry: powerRegistry() });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(3);
    when(() => {
      context.api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    })
      .thenReturn(undefined)
      .times(2);
    const accessory = registeredDevice(context, accessories, store);
    const updateSpy = t.mock.method(builtAccessory(basementGuardianAccessories), 'update');

    // act
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { canonical: store.snapshot(DEVICE_ID), owners: [...accessories.keys()], mainsLost: contactStateOf(accessory, 'mains-power-lost') },
      {
        canonical: {
          identity: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
          data: { ac_power: true },
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: 0,
          receivedAt: 0,
        },
        owners: [ACCESSORY_UUID],
        mainsLost: CONTACT_DETECTED,
      },
    );
    assert.deepStrictEqual(
      updateSpy.mock.calls.map((call) => call.arguments[1]),
      ['live', 'poll'],
    );
    verify(context.api);
  });

  test('calls updatePlatformAccessories once a suppression changes the published service set', () => {
    // arrange
    const updateCalls: FakeAccessory[][] = [];
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const context = discoveryContext({ api: fakeDiscoveryApi([], updateCalls), accessories, registry: powerRegistry(), ignoredFaults });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(3);
    when(() => {
      context.api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          updateCalls.push([accessory]);
          return true;
        }),
      );
    })
      .thenReturn(undefined)
      .times(2);
    registeredDevice(context, accessories, store);
    const afterFirstPoll = updateCalls.length;

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    // Two calls on the first poll: the record the accessory seeded from that snapshot, and the
    // service set the suppression changed. The second poll changes neither, so it adds none.
    assert.deepStrictEqual({ afterFirstPoll, afterSecondPoll: updateCalls.length }, { afterFirstPoll: 2, afterSecondPoll: 2 });
    verify(context.api);
  });

  // The store is built per accessory at the one call site that builds an accessory, so no shared or
  // process-wide store exists. The pump that runs here is deliberately the second device's: a store
  // that closed over one accessory for the whole process would name the first one, and a case that
  // ran the first device's pump would pass against exactly that defect (CTRL-01, D-008).
  //
  // The first-poll seeds mutate only the context: neither accessory is registered while its seed
  // runs, so the persist port makes no call, and registration's own cache save is what carries the
  // seeded records to disk. Only the activation counted after registration asks Homebridge to store.
  test('asks Homebridge to store the accessory whose snapshot counted an activation, and no other', () => {
    // arrange
    const updateCalls: FakeAccessory[][] = [];
    const persistedContexts: unknown[] = [];
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    let receivedAt = 1000;
    const store = createDeviceStateStore({ clock: { now: () => receivedAt }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], updateCalls), accessories, registry: powerRegistry() });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(6);
    when(() => context.api.platformAccessory)
      .thenReturn(PLATFORM_ACCESSORY)
      .times(2);
    when(() => {
      context.api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    }).thenReturn(undefined);
    when(() => {
      context.api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== SECOND_ACCESSORY_UUID ||
            accessory.displayName !== 'Second System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: SECOND_DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    }).thenReturn(undefined);
    when(() => {
      context.api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== SECOND_ACCESSORY_UUID ||
            accessory.displayName !== 'Second System' ||
            accessories.get(SECOND_ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: SECOND_DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          persistedContexts.push(structuredClone(accessory.context));
          updateCalls.push([accessory]);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const secondDevice = { ...geminiDevice(), deviceId: SECOND_DEVICE_ID, serialNumber: 'serial-2', name: 'Second System' };
    store.applyDiscovery(geminiDevice());
    store.applyDiscovery(secondDevice);
    registerDiscoveredDevices(context, [DEVICE_ID, SECOND_DEVICE_ID], store);
    const afterTheSeeds = updateCalls.length;
    const seededContexts = [...accessories.values()].map((accessory) => structuredClone(accessory.context));
    const expectedFirstContext = {
      device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
      lastVendorName: 'Sump System',
      primaryPump: { observationStartedAt: 1000, activationCount: 0, lastActivationAt: undefined },
      backupPump: { observationStartedAt: 1000, activationCount: 0, lastActivationAt: undefined },
      watermarks: { backupPumpTimestamp: undefined, testTimestamp: undefined },
    };
    const expectedSecondSeed = {
      device: { deviceId: SECOND_DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
      lastVendorName: 'Second System',
      primaryPump: { observationStartedAt: 1000, activationCount: 0, lastActivationAt: undefined },
      backupPump: { observationStartedAt: 1000, activationCount: 0, lastActivationAt: undefined },
      watermarks: { backupPumpTimestamp: undefined, testTimestamp: undefined },
    };
    const expectedSecondContext = {
      device: { deviceId: SECOND_DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
      lastVendorName: 'Second System',
      primaryPump: { observationStartedAt: 1000, activationCount: 0, lastActivationAt: undefined },
      backupPump: { observationStartedAt: 1000, activationCount: 1, lastActivationAt: 2000 },
      watermarks: { backupPumpTimestamp: undefined, testTimestamp: undefined },
    };

    // act
    receivedAt = 2000;
    store.applyDiscovery({ ...secondDevice, data: { backup_pump_running: true } });
    registerDiscoveredDevices(context, [DEVICE_ID, SECOND_DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        seeds: afterTheSeeds,
        sinceTheSeeds: updateCalls.slice(afterTheSeeds).map((call) => call.map((persisted) => persisted.UUID)),
      },
      { seeds: 0, sinceTheSeeds: [[SECOND_ACCESSORY_UUID]] },
    );
    assert.deepStrictEqual(
      { seededContexts, currentContexts: [...accessories.values()].map((accessory) => accessory.context), persistedContexts },
      {
        seededContexts: [expectedFirstContext, expectedSecondSeed],
        currentContexts: [expectedFirstContext, expectedSecondContext],
        persistedContexts: [expectedSecondContext],
      },
    );
    verify(context.api);
  });

  test('publishes every adapter but the one an administrator ignored', () => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, registry: powerRegistry(), ignoredFaults });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => {
      context.api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    })
      .thenReturn(undefined)
      .times(2);

    // act
    const accessory = registeredDevice(context, accessories, store);

    // assert
    assert.deepStrictEqual(
      {
        ignored: accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost') === undefined,
        sibling: accessory.getServiceById(HAP.Service.ContactSensor, 'primary-pump-fault') !== undefined,
      },
      { ignored: true, sibling: true },
    );
    verify(context.api);
  });

  test('removes an adapter added to ignoredFaults on a restart whose profile no longer resolves', () => {
    // arrange
    const api = fakeDiscoveryApi([], []);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(4);
    when(() => {
      api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    })
      .thenReturn(undefined)
      .times(2);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const accessory = registeredDevice(discoveryContext({ api, accessories, registry: powerRegistry() }), accessories, store);
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), ignoredFaults }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        ignored: accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost'),
        sibling: contactStateOf(accessory, 'primary-pump-fault'),
      },
      { ignored: undefined, sibling: CONTACT_DETECTED },
    );
    verify(api);
  });

  test('confirms a device offline on the run of polls an administrator configured', () => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, registry: powerRegistry(), offlineConfirmationPollCount: 1 });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => {
      context.api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    })
      .thenReturn(undefined)
      .times(2);
    const accessory = new HarnessPlatformAccessory('Sump System', ACCESSORY_UUID);
    accessory.context.lastVendorName = 'Sump System';
    accessory.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(ACCESSORY_UUID, accessory as unknown as BasementGuardianPlatformAccessory);
    store.applyDiscovery({ ...geminiDevice(), connectivity: { connected: false, timestamp: 0 } });

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.strictEqual(contactStateOf(accessory, 'basement-guardian-offline'), CONTACT_NOT_DETECTED);
    verify(context.api);
  });
});

describe('removeDiscoveredDevice', () => {
  test('leaves no live listener behind, so a later patch reaches no accessory', (t) => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], [], []), accessories, basementGuardianAccessories, registry: powerRegistry() });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(3);
    when(() => {
      context.api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      context.api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    }).thenReturn(undefined);
    registeredDevice(context, accessories, store);
    const updateSpy = t.mock.method(builtAccessory(basementGuardianAccessories), 'update');

    // act
    removeDiscoveredDevice(context, DEVICE_ID, store);
    store.applyDiscovery({ ...geminiDevice(), data: { ac_power: true } });
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: false }));

    // assert
    assert.deepStrictEqual(
      { canonical: store.snapshot(DEVICE_ID), accessories, basementGuardianAccessories },
      {
        canonical: {
          identity: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
          data: { ac_power: false },
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: 0,
          receivedAt: 0,
        },
        accessories: new Map(),
        basementGuardianAccessories: new Map(),
      },
    );
    assert.strictEqual(updateSpy.mock.callCount(), 0);
    verify(context.api);
  });

  test('subscribes again when the same deviceId is discovered after a removal', (t) => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], [], []), accessories, basementGuardianAccessories, registry: powerRegistry() });
    when(() => context.api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(5);
    when(() => context.api.platformAccessory).thenReturn(PLATFORM_ACCESSORY);
    when(() => {
      context.api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    }).thenReturn(undefined);
    when(() => {
      context.api.updatePlatformAccessories(
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    })
      .thenReturn(undefined)
      .times(2);
    when(() => {
      context.api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory ||
            !isDeepStrictEqual(accessory.context.device, { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID })
          ) {
            return false;
          }

          return true;
        }),
      );
    }).thenReturn(undefined);
    registeredDevice(context, accessories, store);
    removeDiscoveredDevice(context, DEVICE_ID, store);
    store.applyDiscovery(geminiDevice());
    registerDiscoveredDevices(context, [DEVICE_ID], store);
    const accessory = accessories.get(ACCESSORY_UUID);
    if (!(accessory instanceof HarnessPlatformAccessory)) {
      throw new Error('the rediscovered device has no public accessory');
    }

    const updateSpy = t.mock.method(builtAccessory(basementGuardianAccessories), 'update');

    // act
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));

    // assert
    assert.deepStrictEqual(
      { canonical: store.snapshot(DEVICE_ID), owners: [...accessories.keys()], mainsLost: contactStateOf(accessory, 'mains-power-lost') },
      {
        canonical: {
          identity: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID, name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
          data: { ac_power: true },
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: 0,
          receivedAt: 0,
        },
        owners: [ACCESSORY_UUID],
        mainsLost: CONTACT_DETECTED,
      },
    );
    assert.deepStrictEqual(
      updateSpy.mock.calls.map((call) => call.arguments[1]),
      ['live'],
    );
    verify(context.api);
  });

  test('unregisters a cached accessory, drops it from accessories, and removes its stored state', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const unregisterCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls, [], unregisterCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    when(() => {
      api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((candidates: PlatformAccessory[]) => {
          const accessory = candidates[0];
          if (
            candidates.length !== 1 ||
            !(accessory instanceof HarnessPlatformAccessory) ||
            accessory.UUID !== ACCESSORY_UUID ||
            accessory.displayName !== 'Sump System' ||
            accessories.get(ACCESSORY_UUID) !== accessory
          ) {
            return false;
          }

          unregisterCalls.push({ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, accessories: [accessory] } satisfies FakeApiCall);
          return true;
        }),
      );
    }).thenReturn(undefined);
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Sump System', uuid);
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    removeDiscoveredDevice(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), DEVICE_ID, store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryCount: accessories.size,
        unregisterCalls: unregisterCalls.map((call) => ({
          pluginIdentifier: call.pluginIdentifier,
          platformName: call.platformName,
          uuids: call.accessories.map((accessory) => accessory.UUID),
        })),
        storedSnapshot: store.snapshot(DEVICE_ID),
      },
      {
        accessoryCount: 0,
        unregisterCalls: [{ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, uuids: [uuid] }],
        storedSnapshot: undefined,
      },
    );
    verify(api);
  });

  test('does nothing for a deviceId with no cached accessory', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const unregisterCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls, [], unregisterCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    removeDiscoveredDevice(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), DEVICE_ID, store);

    // assert
    assert.deepStrictEqual(
      { accessoryCount: accessories.size, unregisterCalls, storedSnapshot: store.snapshot(DEVICE_ID) },
      {
        accessoryCount: 0,
        unregisterCalls: [],
        storedSnapshot: {
          identity: { deviceId: 'account-1_serial-1', deviceTypeId: 'wayneWaterGemini', name: 'Sump System', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
          data: {},
          metadata: {},
          shadowVersion: undefined,
          deviceTimestamp: 0,
          receivedAt: 0,
        },
      },
    );
    verify(api);
  });
});
