import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { setImmediate as nextEventLoopTurn } from 'node:timers/promises';

import { It, mock, verify, when } from 'strong-mock';

import { createFakeHap } from '../features/support/fakeHap.js';
import { HarnessPlatformAccessory } from '../features/support/fakeHomebridgeApi.js';
import { createServiceCatalogue } from '../src/accessories/serviceCatalogue.js';
import { TOKEN_CACHE_FILENAME } from '../src/cloud/auth.js';
import { createDeviceStateStore } from '../src/device/state.js';
import { BasementGuardianPlatform, registerDiscoveredDevices, removeDiscoveredDevice } from '../src/platform.js';
import { systemTimers } from '../src/runtime/timers.js';
import { PLATFORM_NAME, PLUGIN_NAME } from '../src/settings.js';

import type { FakeServiceClass } from '../features/support/fakeHap.js';
import type { FakeAccessory } from '../features/support/fakeHomebridgeApi.js';
import type { BasementGuardianAccessory } from '../src/accessories/basementGuardian.js';
import type { NotificationServiceKind } from '../src/accessories/services.js';
import type { ApiDevice } from '../src/cloud/types.js';
import type { DeviceFamily } from '../src/device/family.js';
import type { FamilyOutcome, FamilyRegistry } from '../src/device/registry.js';
import type { DeviceStateStore, ReportedPatch } from '../src/device/state.js';
import type { BasementGuardianPlatformAccessory, DiscoveryContext } from '../src/platform.js';
import type { API, LogLevel, Logging, PlatformAccessory, PlatformConfig } from 'homebridge';
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
  const record = (message: string): void => {
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
// A fixed turn count is sound only for a negative assertion, where draining
// longer can only make the case stricter. For anything the lifecycle reaches
// asynchronously, wait on the condition itself with `until`: eight turns is a
// guess, and a filesystem write behind the token cache needs more of them on a
// slower machine than on the one the constant was chosen on.
async function settle(): Promise<void> {
  for (let turn = 0; turn < 8; turn += 1) {
    await nextEventLoopTurn();
  }
}

// Waits for a condition the lifecycle reaches on its own schedule, rather than
// for a number of turns that happened to be enough locally. Fails with what it
// was waiting for instead of with whatever the assertion would have said.
async function until(reached: () => boolean | Promise<boolean>, what: string): Promise<void> {
  const deadlineMs = Date.now() + 5_000;

  while (Date.now() < deadlineMs) {
    if (await reached()) {
      return;
    }

    await nextEventLoopTurn();
  }

  throw new Error(`timed out waiting for ${what}`);
}

// Every module under `src/` that names a symbol, in path order. A module that wants to defer has to
// take the port by injection, where a test can observe it, so the concrete process timers are wired
// at the composition root and declared in their own module, and nowhere else (SAFE-07, D-18).
async function modulesNaming(symbol: string): Promise<readonly string[]> {
  const root = new URL('../../src/', import.meta.url);
  const entries = await readdir(root, { recursive: true });
  const naming: string[] = [];

  for (const entry of entries.filter((candidate) => candidate.endsWith('.ts')).sort()) {
    const source = await readFile(new URL(entry, root), 'utf8');

    if (source.includes(symbol)) {
      naming.push(entry);
    }
  }

  return naming;
}

const emptyConfig: PlatformConfig = { platform: PLATFORM_NAME };

const accountConfig: PlatformConfig = { platform: PLATFORM_NAME, email: 'account@example.test', password: 'account-password' };

const REFUSAL_ADVICE = 'Fix it in the Homebridge UI (Plugins -> Basement Guardian -> Settings).';

const DEVICE_ID = 'account-1_serial-1';
const DEVICE_TYPE_ID = 'wayneWaterGemini';

const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;

// The one hand-built stand-in of this boundary. The accessory now declares its own HomeKit types by
// subclassing the injected namespace, so `Service` and `Characteristic` have to be constructible
// bases rather than identifier constants; a second stand-in of the same boundary would drift.
const HAP = createFakeHap();

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];

// The accessory identifier the plugin derives for this device, taken from the same derivation the
// plugin uses rather than restated as a literal.
const ACCESSORY_UUID = HAP.uuid.generate(DEVICE_ID);

function geminiDevice(): ApiDevice {
  return {
    deviceId: DEVICE_ID,
    deviceTypeId: DEVICE_TYPE_ID,
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: 0 },
    data: {},
  };
}

function unknownRegistry(): FamilyRegistry {
  return { lookup: (deviceTypeId: string): FamilyOutcome<unknown> => ({ kind: 'unknown', deviceTypeId }), shouldLog: () => true };
}

// A minimal fake family, so `registerDiscoveredDevices` tests exercising the
// `implemented` outcome need not depend on Gemini's own field shapes. Its
// `validate()` reports one scope's field invalid, which is what puts the
// accessory into the degraded state these dispatch-focused cases observe;
// `decode()` then omits that scope, as every family does for a scope whose own
// fields did not validate.
const FAKE_FAMILY: DeviceFamily<unknown> = {
  deviceTypeId: DEVICE_TYPE_ID,
  displayName: 'Fake Family',
  implemented: true,
  validate: () => ({ valid: false, violations: [{ field: 'ac_power', reason: 'missing', scope: 'power' }] }),
  decode: () => ({}),
  capabilities: () => [],
  command: () => ({ desiredData: {} }),
};

// A family that decodes every scope, with the one telemetry field the live-state cases change
// driving the power group, so a shadow patch produces an observable characteristic change rather
// than only a call the suite could have mocked. Every scope decodes because a row publishes no
// service until it has something to vouch for, so a case about the published service set needs a
// family that vouches for every scope.
const POWER_FAMILY: DeviceFamily<unknown> = {
  deviceTypeId: DEVICE_TYPE_ID,
  displayName: 'Power Family',
  implemented: true,
  validate: () => ({ valid: true }),
  decode: (snapshot) => ({
    metadata: {},
    water: { levelCode: 0, levelPercent: 0, flooded: false },
    pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined },
    power: { mainsPresent: snapshot.data.ac_power === true },
    battery: { charging: true, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
    fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
    connectivity: { reportedOffline: false },
  }),
  capabilities: () => [],
  command: () => ({ desiredData: {} }),
};

// A device whose decode raises, so a case can drive one failing device through a batch that also
// carries a healthy one.
const THROWING_DEVICE_ID = 'account-1_serial-throwing';

// A family that raises while decoding one named device and decodes every other one normally. The
// three reachable throws inside the dispatch (the identity guard, the AccessoryInformation guard,
// and a family decode guard) all reach the loop the same way, so one of them stands for all three.
const THROWING_FAMILY: DeviceFamily<unknown> = {
  ...POWER_FAMILY,
  decode: (snapshot) => {
    if (snapshot.identity.deviceId === THROWING_DEVICE_ID) {
      throw new TypeError('decode() expected ac_power to be a boolean');
    }

    return { metadata: {}, power: { mainsPresent: true } };
  },
};

// A family that raises on its first decode and decodes normally afterwards, so a case can drive one
// device through a failed first registration and the inventory that follows it.
function recoveringFamily(): DeviceFamily<unknown> {
  let decodes = 0;

  return {
    ...POWER_FAMILY,
    decode: (snapshot) => {
      decodes += 1;

      if (decodes === 1) {
        throw new TypeError('decode() expected ac_power to be a boolean');
      }

      return POWER_FAMILY.decode(snapshot);
    },
  };
}

function implementedRegistry(): FamilyRegistry {
  return { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: FAKE_FAMILY }), shouldLog: () => true };
}

function powerRegistry(): FamilyRegistry {
  return { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: POWER_FAMILY }), shouldLog: () => true };
}

function unsupportedRegistry(shouldLog: boolean): FamilyRegistry {
  return {
    lookup: (deviceTypeId: string): FamilyOutcome<unknown> => ({ kind: 'unsupported', deviceTypeId, displayName: 'Wayne Water HALO' }),
    shouldLog: () => shouldLog,
  };
}

interface FakeApiCall {
  pluginIdentifier: string;
  platformName: string;
  accessories: FakeAccessory[];
}

function fakeDiscoveryApi(registerCalls: FakeApiCall[], updateCalls: FakeAccessory[][] = [], unregisterCalls: FakeApiCall[] = []): API {
  const standIn = {
    hap: HAP_NAMESPACE,
    platformAccessory: HarnessPlatformAccessory,
    registerPlatformAccessories(pluginIdentifier: string, platformName: string, accessories: FakeAccessory[]) {
      registerCalls.push({ pluginIdentifier, platformName, accessories: [...accessories] });
    },
    updatePlatformAccessories(accessories: FakeAccessory[]) {
      updateCalls.push([...accessories]);
    },
    unregisterPlatformAccessories(pluginIdentifier: string, platformName: string, accessories: FakeAccessory[]) {
      unregisterCalls.push({ pluginIdentifier, platformName, accessories: [...accessories] });
    },
  };

  return standIn as unknown as API;
}

interface ContextOptions {
  api: API;
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  registry: FamilyRegistry;
  basementGuardianAccessories?: Map<string, BasementGuardianAccessory>;
  log?: Logging;
  ignoredFaults?: readonly NotificationServiceKind[];
  offlineConfirmationPollCount?: number;
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
  };
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

function reportedPatch(data: Readonly<Record<string, unknown>>): ReportedPatch {
  return { data, state: undefined, version: undefined };
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
    listeners.push(listener);

    return true;
  });
}

// An accepted configuration reaches for the Homebridge storage directory, so
// each such case gets its own, removed when the case ends.
async function expectStoragePath(t: TestContext, api: API): Promise<{ user: API['user']; storagePath: string }> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-platform-'));

  t.after(async () => {
    await rm(storagePath, { recursive: true, force: true });
  });

  const user = mock<API['user']>({ exactParams: true, name: 'homebridge user' });
  when(() => user.storagePath()).thenReturn(storagePath);
  when(() => api.user).thenReturn(user);

  return { user, storagePath };
}

describe('BasementGuardianPlatform', () => {
  test('holds no accessory and calls nothing on the API once constructed', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });

    // act
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, api);

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(api);
  });

  test('logs one actionable refusal and registers no listener when the account email is missing', () => {
    // arrange
    const messages: string[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });

    // act
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), emptyConfig, api);

    // assert
    assert.deepStrictEqual(messages, [`Not starting: the account email is missing. ${REFUSAL_ADVICE}`]);
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(api);
  });

  test('CONF-03 logs the refusal through the redacting wrapper, so a configuration value cannot leak', () => {
    // arrange
    const messages: string[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const refusedReason = 'pollInterval must be a whole number of seconds from 300 to 3600, but it is "Bearer [redacted]".';

    // act
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), { ...accountConfig, pollInterval: 'Bearer leaked-token' }, api);

    // assert
    assert.deepStrictEqual(messages, [`Not starting: ${refusedReason} ${REFUSAL_ADVICE}`]);
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(api);
  });

  test('AUTH-02 logs the malformed-email refusal without the account email it rejected', () => {
    // arrange
    const messages: string[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const refusedReason = 'the account email must be an email address.';

    // act
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), { ...accountConfig, email: 'jane.doe@company' }, api);

    // assert
    assert.deepStrictEqual(messages, [`Not starting: ${refusedReason} ${REFUSAL_ADVICE}`]);
    assert.deepStrictEqual(platform.accessories, new Map());
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
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), accountConfig, api);

    // act
    platform.log.info('the grant used account-password');

    // assert
    assert.deepStrictEqual(messages, ['the grant used [redacted]']);
    verify(user);
    verify(api);
  });

  test('registers the launch and shutdown listeners once the configuration is valid', async (t) => {
    // arrange
    const requestSpy = t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no request expected')));
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);

    // act
    const platform = new BasementGuardianPlatform(createSilentLog(), accountConfig, api);

    // assert
    assert.strictEqual(listeners.length, 2);
    assert.strictEqual(requestSpy.mock.callCount(), 0);
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(user);
    verify(api);
  });

  test('starts the cloud work on the launch event and releases it on shutdown', async (t) => {
    // arrange
    const requestSpy = t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('the vendor is unreachable')));
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await until(() => requestSpy.mock.callCount() >= 2, 'the launch event to reach the vendor');
    const requestsAfterLaunch = requestSpy.mock.callCount();
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(
      { requestsAfterLaunch, requestsAfterShutdown: requestSpy.mock.callCount() - requestsAfterLaunch },
      { requestsAfterLaunch: 2, requestsAfterShutdown: 0 },
    );
    verify(user);
    verify(api);
  });

  test('AUTH-02 caches the granted token under the Homebridge storage directory', async (t) => {
    // arrange
    t.mock.method(globalThis, 'fetch', (input: string | URL) =>
      input.toString().endsWith('/oauth/token')
        ? Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }))
        : Promise.resolve(new Response('{}', { status: 503 })),
    );
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user, storagePath } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await until(async () => (await readdir(storagePath)).includes(TOKEN_CACHE_FILENAME), 'the token cache file to be written');
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(await readdir(storagePath), [TOKEN_CACHE_FILENAME]);
    verify(user);
    verify(api);
  });

  test('registers a newly discovered device once the launch event succeeds', async (t) => {
    // arrange
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
    when(() => api.platformAccessory).thenReturn(HarnessPlatformAccessory as unknown as API['platformAccessory']);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          registeredAccessories.push(...(accessories as unknown as FakeAccessory[]));

          return true;
        }),
      );
    }).thenReturn(undefined);
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await until(() => registeredAccessories.length > 0, 'the platform to register the discovered accessory');
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

  test('unregisters a confirmed-absent accessory once two trustworthy polls and a final check agree it is gone', async (t) => {
    // arrange
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
    when(() => api.platformAccessory).thenReturn(HarnessPlatformAccessory as unknown as API['platformAccessory']);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          registeredAccessories.push(...(accessories as unknown as FakeAccessory[]));

          return true;
        }),
      );
    }).thenReturn(undefined);
    when(() => {
      api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          unregisteredAccessories.push(...(accessories as unknown as FakeAccessory[]));

          return true;
        }),
      );
    }).thenReturn(undefined);
    const platform = new BasementGuardianPlatform(createSilentLog(), { ...accountConfig, pollInterval: 300 }, api);
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await until(() => registeredAccessories.length > 0, 'the platform to register the discovered accessory');
    t.mock.timers.tick(300_000);
    await settle();
    t.mock.timers.tick(300_000);
    await settle();
    await until(() => unregisteredAccessories.length > 0, 'the platform to unregister the confirmed-absent accessory');
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
    const requestSpy = t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('the vendor is unreachable')));
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);

    // act
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);
    await settle();

    // assert
    assert.strictEqual(requestSpy.mock.callCount(), 0);
    verify(user);
    verify(api);
  });

  test('wires the concrete process timers at the composition root alone', async () => {
    // act
    const wiring = await modulesNaming('systemTimers');

    // assert
    assert.deepStrictEqual(wiring, ['platform.ts', 'runtime/timers.ts']);
  });

  test('registers and removes no accessory across the whole lifecycle', async (t) => {
    // arrange
    t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no request expected')));
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);

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
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, api);

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
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, api);

    // act
    platform.configureAccessory(restoredAccessory);
    platform.configureAccessory(restoredAccessory);

    // assert
    assert.deepStrictEqual([...platform.accessories.keys()], ['accessory-uuid-1']);
    assert.strictEqual(platform.accessories.get('accessory-uuid-1'), restoredAccessory);
    verify(restoredAccessory);
    verify(api);
  });

  test('D-03 removes nothing from HomeKit on cache-restore alone', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const staleAccessory = mock<PlatformAccessory>({ exactParams: true, name: 'stale accessory' });
    when(() => staleAccessory.UUID).thenReturn('accessory-uuid-gone');
    when(() => staleAccessory.displayName).thenReturn('Retired Pump');
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, api);

    // act
    platform.configureAccessory(staleAccessory);

    // assert
    verify(api);
    verify(staleAccessory);
  });
});

describe('registerDiscoveredDevices', () => {
  test('registers one accessory for a newly discovered device not already in accessories', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
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
  });

  test('updates a deviceId already present in accessories in place instead of registering it again', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
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
  });

  test('adopts a vendor rename when the display name still matches the stored vendor name', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
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
  });

  test('keeps a customized display name but still advances the stored vendor name', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
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
  });

  test('calls updatePlatformAccessories no times when nothing about the cached accessory changed', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
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
  });

  test('does nothing for a deviceId the store holds no snapshot for', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual({ accessoryCount: accessories.size, registerCalls }, { accessoryCount: 0, registerCalls: [] });
  });

  test('explains and skips an unsupported device, registering nothing for it', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];

    // act
    registerDiscoveredDevices(
      discoveryContext({ api, accessories, registry: unsupportedRegistry(true), log: createRecordingLog(messages) }),
      [DEVICE_ID],
      store,
    );

    // assert
    const expectedMessage = `Skipping ${DEVICE_ID}: Wayne Water HALO (${DEVICE_TYPE_ID}) is a recognized but unsupported device family.`;
    assert.deepStrictEqual(
      { accessoryCount: accessories.size, registerCalls, messages },
      { accessoryCount: 0, registerCalls: [], messages: [expectedMessage] },
    );
  });

  test('explains and skips an unknown device, registering nothing for it', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createRecordingLog(messages) }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { accessoryCount: accessories.size, registerCalls, messages },
      { accessoryCount: 0, registerCalls: [], messages: [`Skipping ${DEVICE_ID}: ${DEVICE_TYPE_ID} is not a recognized device family.`] },
    );
  });

  test('says nothing for a skipped device once the registry reports it already logged', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];

    // act
    registerDiscoveredDevices(
      discoveryContext({ api, accessories, registry: unsupportedRegistry(false), log: createRecordingLog(messages) }),
      [DEVICE_ID],
      store,
    );

    // assert
    assert.deepStrictEqual({ accessoryCount: accessories.size, registerCalls, messages }, { accessoryCount: 0, registerCalls: [], messages: [] });
  });

  test('registers a valid device after skipping an unsupported device earlier in the same batch', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const haloDeviceId = 'halo-device';
    store.applyDiscovery({ ...geminiDevice(), deviceId: haloDeviceId, deviceTypeId: 'wayneWaterHalo' });
    store.applyDiscovery(geminiDevice());
    const registry: FamilyRegistry = {
      lookup: (deviceTypeId: string): FamilyOutcome<unknown> =>
        deviceTypeId === DEVICE_TYPE_ID ? { kind: 'implemented', family: FAKE_FAMILY } : { kind: 'unsupported', deviceTypeId, displayName: 'Wayne Water HALO' },
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
  });

  test('registers a healthy device after an earlier device in the same batch throws', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), deviceId: THROWING_DEVICE_ID });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];
    const registry: FamilyRegistry = { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: THROWING_FAMILY }), shouldLog: () => true };

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry, log: createRecordingLog(messages) }), [THROWING_DEVICE_ID, DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        registeredDeviceIds: registerCalls.flatMap((call) => call.accessories.map((accessory) => accessory.context.device)),
        messages,
      },
      {
        registeredDeviceIds: [{ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }],
        messages: [`Skipping ${THROWING_DEVICE_ID} on this inventory; every other device still updates.`],
      },
    );
  });

  test('publishes onto the accessory it registered after a first update on a new device throws', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
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
      'Backup Pump Activated',
      'Sump Mains Power',
      'Mains Power Lost',
      'Backup Battery',
      'Backup Battery Facts',
      'Primary Pump Fault',
      'Backup Pump Fault',
      'Water Sensor Fault',
      'Pump Controller Link Lost',
      'Basement Guardian Offline',
    ]);
    assert.strictEqual(contactStateOf(registered, 'mains-power-lost'), CONTACT_NOT_DETECTED);
  });

  test('reuses the same BasementGuardianAccessory across polls so the DEV-08 log-once state persists', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];
    const context = discoveryContext({ api, accessories, basementGuardianAccessories, registry: implementedRegistry(), log: createRecordingLog(messages) });

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    const expectedMessage =
      `Degraded ${DEVICE_ID}: the profile or payload stopped validating. ` +
      'AccessoryInformation keeps its last valid values until a family-valid update recovers it.';
    assert.deepStrictEqual(messages, [expectedMessage]);
  });

  test('delivers a between-poll shadow change to HomeKit without waiting for the next poll', () => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, registry: powerRegistry() });
    const accessory = registeredDevice(context, accessories, store);
    const beforePatch = contactStateOf(accessory, 'mains-power-lost');

    // act
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));

    // assert
    assert.deepStrictEqual(
      { beforePatch, afterPatch: contactStateOf(accessory, 'mains-power-lost') },
      { beforePatch: CONTACT_NOT_DETECTED, afterPatch: CONTACT_DETECTED },
    );
  });

  test('updates from the poll as poll-sourced and from the store notification as live', (t) => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, basementGuardianAccessories, registry: powerRegistry() });
    registeredDevice(context, accessories, store);
    const updateSpy = t.mock.method(builtAccessory(basementGuardianAccessories), 'update');

    // act
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      updateSpy.mock.calls.map((call) => call.arguments[1]),
      ['live', 'poll'],
    );
  });

  test('calls updatePlatformAccessories once a suppression changes the published service set', () => {
    // arrange
    const updateCalls: FakeAccessory[][] = [];
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const context = discoveryContext({ api: fakeDiscoveryApi([], updateCalls), accessories, registry: powerRegistry(), ignoredFaults });
    registeredDevice(context, accessories, store);
    const afterFirstPoll = updateCalls.length;

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual({ afterFirstPoll, afterSecondPoll: updateCalls.length }, { afterFirstPoll: 1, afterSecondPoll: 1 });
  });

  test('publishes every adapter but the one an administrator ignored', () => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, registry: powerRegistry(), ignoredFaults });

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
  });

  test('confirms a device offline on the run of polls an administrator configured', () => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, registry: powerRegistry(), offlineConfirmationPollCount: 1 });
    const accessory = new HarnessPlatformAccessory('Sump System', ACCESSORY_UUID);
    accessory.context.lastVendorName = 'Sump System';
    accessory.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(ACCESSORY_UUID, accessory as unknown as BasementGuardianPlatformAccessory);
    store.applyDiscovery({ ...geminiDevice(), connectivity: { connected: false, timestamp: 0 } });

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.strictEqual(contactStateOf(accessory, 'basement-guardian-offline'), CONTACT_NOT_DETECTED);
  });
});

describe('removeDiscoveredDevice', () => {
  test('leaves no live listener behind, so a later patch reaches no accessory', (t) => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], [], []), accessories, basementGuardianAccessories, registry: powerRegistry() });
    registeredDevice(context, accessories, store);
    const updateSpy = t.mock.method(builtAccessory(basementGuardianAccessories), 'update');

    // act
    removeDiscoveredDevice(context, DEVICE_ID, store);
    store.applyDiscovery({ ...geminiDevice(), data: { ac_power: true } });
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: false }));

    // assert
    assert.strictEqual(updateSpy.mock.callCount(), 0);
  });

  test('subscribes again when the same deviceId is discovered after a removal', (t) => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], [], []), accessories, basementGuardianAccessories, registry: powerRegistry() });
    registeredDevice(context, accessories, store);
    removeDiscoveredDevice(context, DEVICE_ID, store);
    store.applyDiscovery(geminiDevice());
    registerDiscoveredDevices(context, [DEVICE_ID], store);
    const updateSpy = t.mock.method(builtAccessory(basementGuardianAccessories), 'update');

    // act
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));

    // assert
    assert.deepStrictEqual(
      updateSpy.mock.calls.map((call) => call.arguments[1]),
      ['live'],
    );
  });

  test('unregisters a cached accessory, drops it from accessories, and removes its stored state', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const unregisterCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls, [], unregisterCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
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
  });

  test('does nothing for a deviceId with no cached accessory', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const unregisterCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls, [], unregisterCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const expectedSnapshot = store.applyDiscovery(geminiDevice());

    // act
    removeDiscoveredDevice(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), DEVICE_ID, store);

    // assert
    assert.deepStrictEqual(
      { accessoryCount: accessories.size, unregisterCalls, storedSnapshot: store.snapshot(DEVICE_ID) },
      { accessoryCount: 0, unregisterCalls: [], storedSnapshot: expectedSnapshot },
    );
  });
});
