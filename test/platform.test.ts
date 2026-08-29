import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { setImmediate as nextEventLoopTurn } from 'node:timers/promises';

import { It, mock, verify, when } from 'strong-mock';

import { TOKEN_CACHE_FILENAME } from '../src/cloud/auth.js';
import { BasementGuardianPlatform } from '../src/platform.js';
import { PLATFORM_NAME } from '../src/settings.js';

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
async function settle(): Promise<void> {
  for (let turn = 0; turn < 8; turn += 1) {
    await nextEventLoopTurn();
  }
}

const emptyConfig: PlatformConfig = { platform: PLATFORM_NAME };

const accountConfig: PlatformConfig = { platform: PLATFORM_NAME, email: 'account@example.test', password: 'account-password' };

const REFUSAL_ADVICE = 'Fix it in the Homebridge UI (Plugins -> Basement Guardian -> Settings).';

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
    await settle();
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
    await settle();
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(await readdir(storagePath), [TOKEN_CACHE_FILENAME]);
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

  test('D-03 removes nothing from HomeKit while restoring cached accessories', () => {
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
