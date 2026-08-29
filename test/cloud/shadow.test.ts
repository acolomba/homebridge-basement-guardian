import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createShadowClient, SHADOW_TOPICS } from '../../src/cloud/shadow.js';

import type { MqttTransport, MqttTransportOptions } from '../../src/cloud/mqttTransport.js';
import type { ShadowClient, ShadowClientOptions, ShadowCredentials } from '../../src/cloud/shadow.js';
import type { ReportedPatch } from '../../src/device/state.js';
import type { LogLevel, Logging } from 'homebridge';

const DEVICE_A = 'account-1_serial-a';
const DEVICE_B = 'account-1_serial-b';
const DEVICE_C = 'account-1_serial-c';

const clock = { now: () => Date.parse('2026-08-28T12:00:00.000Z') };

interface PatchRecord {
  deviceId: string;
  patch: ReportedPatch;
}

interface TransportRecorder {
  transport: MqttTransport;
  options: MqttTransportOptions;
  connect: () => void;
  message: (topic: string, payload: Buffer) => void;
  subscribed: string[][];
  published: { topic: string; payload: string }[];
  ends: () => number;
}

interface Harness {
  client: ShadowClient;
  transports: TransportRecorder[];
  patches: PatchRecord[];
  logged: string[];
}

function credentials(): ShadowCredentials {
  return {
    endpoint: 'broker.invalid',
    clientId: 'client-first',
    accessKeyId: 'test-access-key-id',
    secretAccessKey: 'test-secret-access-key',
    sessionToken: 'test-session-token',
  };
}

function recordingLog(recorded: string[]): Logging {
  function at(level: string): (message: string) => void {
    return (message: string): void => {
      recorded.push(`${level} ${message}`);
    };
  }

  const write = at('info');

  return Object.assign(write, {
    prefix: 'shadow',
    debug: at('debug'),
    error: at('error'),
    info: at('info'),
    success: at('success'),
    warn: at('warn'),
    log: (level: LogLevel, message: string): void => {
      recorded.push(`${level} ${message}`);
    },
  });
}

// One connection's worth of transport behavior. The failures decide whether the
// subscribe and publish calls resolve or reject.
function fakeTransport(options: MqttTransportOptions, failures: { subscribe?: Error; publish?: Error }): TransportRecorder {
  const subscribed: string[][] = [];
  const published: { topic: string; payload: string }[] = [];
  const noop = (): void => undefined;
  let connect = noop;
  let message: (topic: string, payload: Buffer) => void = noop;
  let ends = 0;

  const transport: MqttTransport = {
    onConnect: (handler: () => void): void => {
      connect = handler;
    },
    onMessage: (handler: (topic: string, payload: Buffer) => void): void => {
      message = handler;
    },
    onError: noop,
    onClose: noop,
    subscribe: (topics: readonly string[]): Promise<void> => {
      subscribed.push([...topics]);

      return failures.subscribe === undefined ? Promise.resolve() : Promise.reject(failures.subscribe);
    },
    publish: (topic: string, payload: string): Promise<void> => {
      published.push({ topic, payload });

      return failures.publish === undefined ? Promise.resolve() : Promise.reject(failures.publish);
    },
    end: (): Promise<void> => {
      ends += 1;

      return Promise.resolve();
    },
  };

  return {
    transport,
    options,
    connect: () => {
      connect();
    },
    message: (topic: string, payload: Buffer) => {
      message(topic, payload);
    },
    subscribed,
    published,
    ends: () => ends,
  };
}

function harness(failures: { subscribe?: Error; publish?: Error } = {}): Harness {
  const transports: TransportRecorder[] = [];
  const patches: PatchRecord[] = [];
  const logged: string[] = [];

  const clientOptions: ShadowClientOptions = {
    scheme: 'wss',
    region: 'us-east-1',
    credentials: { current: () => credentials() },
    clock,
    log: recordingLog(logged),
    createTransport: (transportOptions: MqttTransportOptions): MqttTransport => {
      const recorder = fakeTransport(transportOptions, failures);
      transports.push(recorder);

      return recorder.transport;
    },
    connect: () => {
      throw new Error('the fake transport never opens a socket');
    },
    onReportedPatch: (deviceId: string, patch: ReportedPatch): void => {
      patches.push({ deviceId, patch });
    },
  };

  return { client: createShadowClient(clientOptions), transports, patches, logged };
}

// Drains the promise chain the connect notification starts, so the subscription
// and the shadow request have both settled before the assertions run.
async function connected(recorder: TransportRecorder | undefined): Promise<void> {
  recorder?.connect();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function body(document: unknown): Buffer {
  return Buffer.from(JSON.stringify(document), 'utf8');
}

describe('SHADOW_TOPICS', () => {
  test('exposes the get, get-accepted, get-rejected, and update-accepted helpers and no others', () => {
    // act & assert
    assert.deepStrictEqual(Object.keys(SHADOW_TOPICS), ['get', 'getAccepted', 'getRejected', 'updateAccepted']);
  });

  for (const { helper, topic } of [
    { helper: 'get' as const, topic: `$aws/things/${DEVICE_A}/shadow/get` },
    { helper: 'getAccepted' as const, topic: `$aws/things/${DEVICE_A}/shadow/get/accepted` },
    { helper: 'getRejected' as const, topic: `$aws/things/${DEVICE_A}/shadow/get/rejected` },
    { helper: 'updateAccepted' as const, topic: `$aws/things/${DEVICE_A}/shadow/update/accepted` },
  ]) {
    test(`builds the ${helper} topic for a device identifier carrying an underscore`, () => {
      // act & assert
      assert.strictEqual(SHADOW_TOPICS[helper](DEVICE_A), topic);
    });
  }
});

describe('start', () => {
  test('subscribes once to the three subscribable topics of every device and to nothing else', async () => {
    // arrange
    const { client, transports } = harness();

    // act
    await client.start([DEVICE_A, DEVICE_B, DEVICE_C]);
    await connected(transports[0]);

    // assert
    assert.deepStrictEqual(transports[0]?.subscribed, [
      [
        `$aws/things/${DEVICE_A}/shadow/get/accepted`,
        `$aws/things/${DEVICE_A}/shadow/get/rejected`,
        `$aws/things/${DEVICE_A}/shadow/update/accepted`,
        `$aws/things/${DEVICE_B}/shadow/get/accepted`,
        `$aws/things/${DEVICE_B}/shadow/get/rejected`,
        `$aws/things/${DEVICE_B}/shadow/update/accepted`,
        `$aws/things/${DEVICE_C}/shadow/get/accepted`,
        `$aws/things/${DEVICE_C}/shadow/get/rejected`,
        `$aws/things/${DEVICE_C}/shadow/update/accepted`,
      ],
    ]);
  });

  test('requests a complete shadow for every device once the subscription succeeds', async () => {
    // arrange
    const { client, transports } = harness();

    // act
    await client.start([DEVICE_A, DEVICE_B]);
    await connected(transports[0]);

    // assert
    assert.deepStrictEqual(transports[0]?.published, [
      { topic: `$aws/things/${DEVICE_A}/shadow/get`, payload: '' },
      { topic: `$aws/things/${DEVICE_B}/shadow/get`, payload: '' },
    ]);
  });

  test('opens the connection to the cached endpoint under the injected scheme', async () => {
    // arrange
    const { client, transports } = harness();

    // act
    await client.start([DEVICE_A]);

    // assert
    assert.deepStrictEqual(
      { url: transports[0]?.options.url, clientId: transports[0]?.options.clientId },
      { url: 'wss://broker.invalid/mqtt', clientId: 'client-first' },
    );
  });

  test('requests no shadow and reports at debug when the subscription is refused', async () => {
    // arrange
    const { client, transports, logged } = harness({ subscribe: new Error('subscribe refused') });

    // act
    await client.start([DEVICE_A]);
    await connected(transports[0]);

    // assert
    assert.deepStrictEqual(
      { published: transports[0]?.published, logged },
      { published: [], logged: ['debug The shadow subscription could not be established.'] },
    );
  });
});

describe('handshake signing', () => {
  test('signs the handshake from the cached credentials and refreshes the client identifier', async () => {
    // arrange
    const { client, transports } = harness();
    const live = { options: { clientId: 'client-stale' } };
    await client.start([DEVICE_A]);

    // act
    const signed = new URL(transports[0]?.options.signUrl(live) ?? 'wss://unsigned.invalid/');

    // assert
    assert.deepStrictEqual(
      {
        origin: signed.origin,
        path: signed.pathname,
        credential: signed.searchParams.get('X-Amz-Credential'),
        date: signed.searchParams.get('X-Amz-Date'),
        token: signed.searchParams.get('X-Amz-Security-Token'),
        signatureLength: signed.searchParams.get('X-Amz-Signature')?.length,
        clientId: live.options.clientId,
      },
      {
        origin: 'wss://broker.invalid',
        path: '/mqtt',
        credential: 'test-access-key-id/20260828/us-east-1/iotdevicegateway/aws4_request',
        date: '20260828T120000Z',
        token: 'test-session-token',
        signatureLength: 64,
        clientId: 'client-first',
      },
    );
  });
});

describe('requestFullShadow', () => {
  test('publishes an empty payload to the device get topic', async () => {
    // arrange
    const { client, transports } = harness();
    await client.start([DEVICE_A]);

    // act
    await client.requestFullShadow(DEVICE_A);

    // assert
    assert.deepStrictEqual(transports[0]?.published, [{ topic: `$aws/things/${DEVICE_A}/shadow/get`, payload: '' }]);
  });

  test('resolves without publishing when no connection has been opened', async () => {
    // arrange
    const { client, transports } = harness();

    // act
    await client.requestFullShadow(DEVICE_A);

    // assert
    assert.deepStrictEqual(transports, []);
  });
});

describe('message routing', () => {
  test('turns an update-accepted reported data section into a patch carrying the document version', async () => {
    // arrange
    const { client, transports, patches } = harness();
    await client.start([DEVICE_A]);
    await connected(transports[0]);

    // act
    transports[0]?.message(`$aws/things/${DEVICE_A}/shadow/update/accepted`, body({ state: { reported: { data: { water_level: 2 } } }, version: 4 }));

    // assert
    assert.deepStrictEqual(patches, [{ deviceId: DEVICE_A, patch: { data: { water_level: 2 }, state: undefined, version: 4 } }]);
  });

  test('puts a reported state section in the metadata half and leaves the telemetry half absent', async () => {
    // arrange
    const { client, transports, patches } = harness();
    await client.start([DEVICE_A]);
    await connected(transports[0]);

    // act
    transports[0]?.message(
      `$aws/things/${DEVICE_A}/shadow/update/accepted`,
      body({ state: { reported: { state: { mcu_target_version: '1.2' } } }, version: 5 }),
    );

    // assert
    assert.deepStrictEqual(patches, [{ deviceId: DEVICE_A, patch: { data: undefined, state: { mcu_target_version: '1.2' }, version: 5 } }]);
  });

  test('takes a get-accepted full shadow down the same path as a partial update', async () => {
    // arrange
    const { client, transports, patches } = harness();
    await client.start([DEVICE_A]);
    await connected(transports[0]);

    // act
    transports[0]?.message(
      `$aws/things/${DEVICE_A}/shadow/get/accepted`,
      body({ state: { reported: { data: { water_level: 1 }, state: { mcu_target_version: '1.2' } } }, version: 6 }),
    );

    // assert
    assert.deepStrictEqual(patches, [{ deviceId: DEVICE_A, patch: { data: { water_level: 1 }, state: { mcu_target_version: '1.2' }, version: 6 } }]);
  });

  test('leaves a requested state section nowhere in the produced patch', async () => {
    // arrange
    const { client, transports, patches } = harness();
    await client.start([DEVICE_A]);
    await connected(transports[0]);

    // act
    transports[0]?.message(`$aws/things/${DEVICE_A}/shadow/update/accepted`, body({ state: { desired: { test_running: true } }, version: 7 }));

    // assert
    assert.deepStrictEqual(patches, [{ deviceId: DEVICE_A, patch: { data: undefined, state: undefined, version: 7 } }]);
  });

  test('reports a missing document version as absent rather than guessing one', async () => {
    // arrange
    const { client, transports, patches } = harness();
    await client.start([DEVICE_A]);
    await connected(transports[0]);

    // act
    transports[0]?.message(`$aws/things/${DEVICE_A}/shadow/update/accepted`, body({ state: { reported: { data: { water_level: 3 } } } }));

    // assert
    assert.deepStrictEqual(patches, [{ deviceId: DEVICE_A, patch: { data: { water_level: 3 }, state: undefined, version: undefined } }]);
  });

  test('reports a rejected shadow request at warn and produces no patch', async () => {
    // arrange
    const { client, transports, patches, logged } = harness();
    await client.start([DEVICE_A]);
    await connected(transports[0]);

    // act
    transports[0]?.message(`$aws/things/${DEVICE_A}/shadow/get/rejected`, body({ code: 404, message: 'No shadow exists' }));

    // assert
    assert.deepStrictEqual({ patches, logged }, { patches: [], logged: ['warn The shadow service rejected a state request for one device.'] });
  });

  for (const { shape, payload } of [
    { shape: 'is not json', payload: Buffer.from('not-json', 'utf8') },
    { shape: 'is not an object', payload: Buffer.from('[]', 'utf8') },
    { shape: 'carries no state section', payload: Buffer.from(JSON.stringify({ version: 8 }), 'utf8') },
    { shape: 'carries a state section that is not an object', payload: Buffer.from(JSON.stringify({ state: 'reported' }), 'utf8') },
  ]) {
    test(`discards a message whose payload ${shape}, with one debug report and no patch`, async () => {
      // arrange
      const { client, transports, patches, logged } = harness();
      await client.start([DEVICE_A]);
      await connected(transports[0]);

      // act
      transports[0]?.message(`$aws/things/${DEVICE_A}/shadow/update/accepted`, payload);

      // assert
      assert.deepStrictEqual({ patches, logged }, { patches: [], logged: ['debug A shadow message was discarded because its document could not be read.'] });
    });
  }

  for (const { name, topic } of [
    { name: 'the delta topic', topic: `$aws/things/${DEVICE_A}/shadow/update/delta` },
    { name: 'an unknown device', topic: `$aws/things/${DEVICE_B}/shadow/update/accepted` },
  ]) {
    test(`ignores a message arriving on ${name}`, async () => {
      // arrange
      const { client, transports, patches, logged } = harness();
      await client.start([DEVICE_A]);
      await connected(transports[0]);

      // act
      transports[0]?.message(topic, body({ state: { reported: { data: { water_level: 9 } } }, version: 9 }));

      // assert
      assert.deepStrictEqual({ patches, logged }, { patches: [], logged: [] });
    });
  }
});

describe('close', () => {
  test('ends the transport', async () => {
    // arrange
    const { client, transports } = harness();
    await client.start([DEVICE_A]);

    // act
    await client.close();

    // assert
    assert.strictEqual(transports[0]?.ends(), 1);
  });

  test('resolves when no connection has been opened', async () => {
    // arrange
    const { client, transports } = harness();

    // act
    await client.close();

    // assert
    assert.deepStrictEqual(transports, []);
  });
});
