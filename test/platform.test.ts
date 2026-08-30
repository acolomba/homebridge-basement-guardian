import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { setImmediate as nextEventLoopTurn } from 'node:timers/promises';

import { It, mock, verify, when } from 'strong-mock';

import { TOKEN_CACHE_FILENAME } from '../src/cloud/auth.js';
import { createDeviceStateStore } from '../src/device/state.js';
import { BasementGuardianPlatform, registerDiscoveredDevices, removeDiscoveredDevice } from '../src/platform.js';
import { PLATFORM_NAME, PLUGIN_NAME } from '../src/settings.js';

import type { ApiDevice } from '../src/cloud/types.js';
import type { DeviceFamily } from '../src/device/family.js';
import type { FamilyOutcome, FamilyRegistry } from '../src/device/registry.js';
import type { BasementGuardianPlatformAccessory } from '../src/platform.js';
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

const emptyConfig: PlatformConfig = { platform: PLATFORM_NAME };

const accountConfig: PlatformConfig = { platform: PLATFORM_NAME, email: 'account@example.test', password: 'account-password' };

const REFUSAL_ADVICE = 'Fix it in the Homebridge UI (Plugins -> Basement Guardian -> Settings).';

const DEVICE_ID = 'account-1_serial-1';
const DEVICE_TYPE_ID = 'wayneWaterGemini';

// A minimal, hand-built stand-in for a HAP `Service`, matching the fake `hap` namespace below.
class FakeAccessoryInformationService {
  private readonly characteristics = new Map<string, unknown>();

  setCharacteristic(identifier: { UUID: string }, value: unknown): this {
    this.characteristics.set(identifier.UUID, value);

    return this;
  }

  getCharacteristic(identifier: { UUID: string }): unknown {
    return this.characteristics.get(identifier.UUID);
  }
}

const FAKE_SERVICE_ACCESSORY_INFORMATION = { UUID: 'fake-service-accessory-information' };

// Enough of `hap.Service`/`hap.Characteristic` for `createBasementGuardianAccessory`'s
// `AccessoryInformation` population to run against, mirroring the Cucumber harness's own stand-in.
const fakeHap = {
  Service: { AccessoryInformation: FAKE_SERVICE_ACCESSORY_INFORMATION },
  Characteristic: {
    Manufacturer: { UUID: 'fake-characteristic-manufacturer' },
    Model: { UUID: 'fake-characteristic-model' },
    SerialNumber: { UUID: 'fake-characteristic-serial-number' },
    FirmwareRevision: { UUID: 'fake-characteristic-firmware-revision' },
  },
  uuid: { generate: (data: string): string => `uuid-${data}` },
};

// Mirrors the real `Accessory` constructor, which always carries one `AccessoryInformation`
// service, so the family adapter's `update()` has a service to populate.
class FakeDiscoveryAccessory {
  context: Record<string, unknown> = {};

  private readonly accessoryInformation = new FakeAccessoryInformationService();

  constructor(
    public readonly displayName: string,
    public readonly UUID: string,
  ) {}

  getService(identifier: { UUID: string }): FakeAccessoryInformationService | undefined {
    return identifier.UUID === FAKE_SERVICE_ACCESSORY_INFORMATION.UUID ? this.accessoryInformation : undefined;
  }
}

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
// `validate()` always reports the snapshot invalid, so `decode()` never runs
// and `update()`'s AccessoryInformation population is out of scope for these
// dispatch-focused cases.
const FAKE_FAMILY: DeviceFamily<unknown> = {
  deviceTypeId: DEVICE_TYPE_ID,
  displayName: 'Fake Family',
  implemented: true,
  validate: () => ({ valid: false, violations: [] }),
  decode: () => {
    throw new Error('decode() must not run on an invalid snapshot');
  },
  capabilities: () => [],
  command: () => ({ desiredData: {} }),
};

function implementedRegistry(): FamilyRegistry {
  return { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: FAKE_FAMILY }), shouldLog: () => true };
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
  accessories: FakeDiscoveryAccessory[];
}

function fakeDiscoveryApi(registerCalls: FakeApiCall[], updateCalls: FakeDiscoveryAccessory[][] = [], unregisterCalls: FakeApiCall[] = []): API {
  const standIn = {
    hap: fakeHap,
    platformAccessory: FakeDiscoveryAccessory,
    registerPlatformAccessories(pluginIdentifier: string, platformName: string, accessories: FakeDiscoveryAccessory[]) {
      registerCalls.push({ pluginIdentifier, platformName, accessories: [...accessories] });
    },
    updatePlatformAccessories(accessories: FakeDiscoveryAccessory[]) {
      updateCalls.push([...accessories]);
    },
    unregisterPlatformAccessories(pluginIdentifier: string, platformName: string, accessories: FakeDiscoveryAccessory[]) {
      unregisterCalls.push({ pluginIdentifier, platformName, accessories: [...accessories] });
    },
  };

  return standIn as unknown as API;
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
    const refusedReason = 'pollInterval must be a whole number of seconds from 300 to 3600, but it is Bearer [redacted].';

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
    const registeredAccessories: FakeDiscoveryAccessory[] = [];
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    when(() => api.hap).thenReturn(fakeHap as unknown as API['hap']);
    when(() => api.platformAccessory).thenReturn(FakeDiscoveryAccessory as unknown as API['platformAccessory']);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          registeredAccessories.push(...(accessories as unknown as FakeDiscoveryAccessory[]));

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
    const registeredAccessories: FakeDiscoveryAccessory[] = [];
    const unregisteredAccessories: FakeDiscoveryAccessory[] = [];
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
      .thenReturn(fakeHap as unknown as API['hap'])
      .times(3);
    when(() => api.platformAccessory).thenReturn(FakeDiscoveryAccessory as unknown as API['platformAccessory']);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          registeredAccessories.push(...(accessories as unknown as FakeDiscoveryAccessory[]));

          return true;
        }),
      );
    }).thenReturn(undefined);
    when(() => {
      api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          unregisteredAccessories.push(...(accessories as unknown as FakeDiscoveryAccessory[]));

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
    registerDiscoveredDevices({ api, accessories, registry: implementedRegistry(), log: createSilentLog() }, [DEVICE_ID], store);

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
    const updateCalls: FakeDiscoveryAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = `uuid-${DEVICE_ID}`;
    const existing = new FakeDiscoveryAccessory('Sump System', uuid);
    existing.context.lastVendorName = 'Sump System';
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }, [DEVICE_ID], store);

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
    const updateCalls: FakeDiscoveryAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = `uuid-${DEVICE_ID}`;
    const existing = new FakeDiscoveryAccessory('Sump System', uuid);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), name: 'Sump Sentry' });

    // act
    registerDiscoveredDevices({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { displayName: existing.displayName, lastVendorName: existing.context.lastVendorName, updatedAccessoryCount: updateCalls.length },
      { displayName: 'Sump Sentry', lastVendorName: 'Sump Sentry', updatedAccessoryCount: 1 },
    );
  });

  test('keeps a customized display name but still advances the stored vendor name', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeDiscoveryAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = `uuid-${DEVICE_ID}`;
    const existing = new FakeDiscoveryAccessory('Basement Pump', uuid);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), name: 'Sump Sentry' });

    // act
    registerDiscoveredDevices({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { displayName: existing.displayName, lastVendorName: existing.context.lastVendorName, updatedAccessoryCount: updateCalls.length },
      { displayName: 'Basement Pump', lastVendorName: 'Sump Sentry', updatedAccessoryCount: 1 },
    );
  });

  test('calls updatePlatformAccessories no times when nothing about the cached accessory changed', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeDiscoveryAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = `uuid-${DEVICE_ID}`;
    const existing = new FakeDiscoveryAccessory('Sump System', uuid);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }, [DEVICE_ID], store);

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
    registerDiscoveredDevices({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }, [DEVICE_ID], store);

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
    registerDiscoveredDevices({ api, accessories, registry: unsupportedRegistry(true), log: createRecordingLog(messages) }, [DEVICE_ID], store);

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
    registerDiscoveredDevices({ api, accessories, registry: unknownRegistry(), log: createRecordingLog(messages) }, [DEVICE_ID], store);

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
    registerDiscoveredDevices({ api, accessories, registry: unsupportedRegistry(false), log: createRecordingLog(messages) }, [DEVICE_ID], store);

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
    registerDiscoveredDevices({ api, accessories, registry, log: createSilentLog() }, [haloDeviceId, DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryCount: accessories.size,
        registeredDeviceIds: registerCalls.flatMap((call) => call.accessories.map((accessory) => accessory.context.device)),
      },
      { accessoryCount: 1, registeredDeviceIds: [{ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }] },
    );
  });
});

describe('removeDiscoveredDevice', () => {
  test('unregisters a cached accessory, drops it from accessories, and removes its stored state', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const unregisterCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls, [], unregisterCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = `uuid-${DEVICE_ID}`;
    const existing = new FakeDiscoveryAccessory('Sump System', uuid);
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    removeDiscoveredDevice({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }, DEVICE_ID, store);

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
    removeDiscoveredDevice({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }, DEVICE_ID, store);

    // assert
    assert.deepStrictEqual(
      { accessoryCount: accessories.size, unregisterCalls, storedSnapshot: store.snapshot(DEVICE_ID) },
      { accessoryCount: 0, unregisterCalls: [], storedSnapshot: expectedSnapshot },
    );
  });
});
