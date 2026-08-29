import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createMqttTransport } from '../../src/cloud/mqttTransport.js';

import type { MqttClientEvents, MqttClientIdentity, MqttClientLike, MqttConnectOptions, MqttTransport } from '../../src/cloud/mqttTransport.js';

const BROKER_URL = 'wss://broker.invalid/mqtt';
const SIGNED_URL = 'wss://broker.invalid/mqtt?signed=yes';
const HOOK_URL = 'wss://broker.invalid:443/mqtt';

interface ClientFailures {
  subscribe?: Error;
  publish?: Error;
}

interface Harness {
  transport: MqttTransport;
  client: MqttClientLike;
  handlers: Partial<MqttClientEvents>;
  connectUrls: string[];
  connectOptions: MqttConnectOptions | undefined;
  signed: MqttClientIdentity[];
  subscribed: string[][];
  published: { topic: string; payload: string }[];
  ends: () => number;
}

// One connection's worth of client behavior. The failures decide whether the
// subscribe and publish callbacks report success or an error.
function harness(failures: ClientFailures = {}): Harness {
  const handlers: Partial<MqttClientEvents> = {};
  const connectUrls: string[] = [];
  const signed: MqttClientIdentity[] = [];
  const subscribed: string[][] = [];
  const published: { topic: string; payload: string }[] = [];
  let connectOptions: MqttConnectOptions | undefined;
  let ends = 0;

  const client: MqttClientLike = {
    options: { clientId: 'client-first' },
    on: <Event extends keyof MqttClientEvents>(event: Event, handler: MqttClientEvents[Event]): void => {
      handlers[event] = handler;
    },
    subscribe: (topics: string[], callback: (error: Error | null) => void): void => {
      subscribed.push(topics);
      callback(failures.subscribe ?? null);
    },
    publish: (topic: string, payload: string, callback: (error?: Error) => void): void => {
      published.push({ topic, payload });
      callback(failures.publish);
    },
    end: (_force: boolean, callback: (error?: Error) => void): void => {
      ends += 1;
      callback();
    },
  };

  const transport = createMqttTransport({
    connect: (url: string, options: MqttConnectOptions): MqttClientLike => {
      connectUrls.push(url);
      connectOptions = options;

      return client;
    },
    url: BROKER_URL,
    clientId: 'client-first',
    signUrl: (live: MqttClientIdentity): string => {
      signed.push(live);
      live.options.clientId = 'client-signed';

      return SIGNED_URL;
    },
  });

  return { transport, client, handlers, connectUrls, connectOptions, signed, subscribed, published, ends: () => ends };
}

test('opens exactly one connection, to the supplied url', () => {
  // arrange & act
  const { connectUrls } = harness();

  // assert
  assert.deepStrictEqual(connectUrls, [BROKER_URL]);
});

test('disables the library reconnect timer and asks for a clean, resubscribing session', () => {
  // arrange & act
  const { connectOptions } = harness();

  // assert
  assert.deepStrictEqual(
    {
      clientId: connectOptions?.clientId,
      protocolVersion: connectOptions?.protocolVersion,
      reconnectPeriod: connectOptions?.reconnectPeriod,
      clean: connectOptions?.clean,
      resubscribe: connectOptions?.resubscribe,
    },
    { clientId: 'client-first', protocolVersion: 4, reconnectPeriod: 0, clean: true, resubscribe: true },
  );
});

test('returns the signed url from the transform hook and ignores the url the hook receives', () => {
  // arrange
  const { client, connectOptions } = harness();

  // act
  const fromPortedUrl = connectOptions?.transformWsUrl(HOOK_URL, {}, client);
  const fromBareUrl = connectOptions?.transformWsUrl(BROKER_URL, {}, client);

  // assert
  assert.deepStrictEqual([fromPortedUrl, fromBareUrl], [SIGNED_URL, SIGNED_URL]);
});

test('hands the live client to the signer, so the refreshed identifier reaches the handshake', () => {
  // arrange
  const { client, connectOptions, signed } = harness();

  // act
  connectOptions?.transformWsUrl(HOOK_URL, {}, client);

  // assert
  assert.deepStrictEqual({ identifier: client.options.clientId, seen: signed.length }, { identifier: 'client-signed', seen: 1 });
});

test('forwards the connect notification to the registered handler', () => {
  // arrange
  const { transport, handlers } = harness();
  const observed: string[] = [];

  // act
  transport.onConnect(() => {
    observed.push('connect');
  });
  handlers.connect?.();

  // assert
  assert.deepStrictEqual(observed, ['connect']);
});

test('forwards the message notification with its topic and payload', () => {
  // arrange
  const { transport, handlers } = harness();
  const observed: string[] = [];

  // act
  transport.onMessage((topic: string, payload: Buffer) => {
    observed.push(`${topic} ${payload.toString('utf8')}`);
  });
  handlers.message?.('topic-a', Buffer.from('body-a', 'utf8'));

  // assert
  assert.deepStrictEqual(observed, ['topic-a body-a']);
});

test('forwards the error notification with its error', () => {
  // arrange
  const { transport, handlers } = harness();
  const observed: unknown[] = [];
  const failure = new Error('socket failed');

  // act
  transport.onError((error: Error) => {
    observed.push(error);
  });
  handlers.error?.(failure);

  // assert
  assert.deepStrictEqual(observed, [failure]);
});

test('forwards the close notification to the registered handler', () => {
  // arrange
  const { transport, handlers } = harness();
  const observed: string[] = [];

  // act
  transport.onClose(() => {
    observed.push('close');
  });
  handlers.close?.();

  // assert
  assert.deepStrictEqual(observed, ['close']);
});

test('subscribes to the complete topic list in one call', async () => {
  // arrange
  const { transport, subscribed } = harness();

  // act
  await transport.subscribe(['topic-a', 'topic-b', 'topic-c']);

  // assert
  assert.deepStrictEqual(subscribed, [['topic-a', 'topic-b', 'topic-c']]);
});

test('rejects with the error the subscribe callback reports', async () => {
  // arrange
  const failure = new Error('subscribe refused');
  const { transport } = harness({ subscribe: failure });

  // act & assert
  await assert.rejects(
    () => transport.subscribe(['topic-a']),
    (error: unknown) => {
      assert.strictEqual(error, failure);

      return true;
    },
  );
});

test('publishes the payload to the topic', async () => {
  // arrange
  const { transport, published } = harness();

  // act
  await transport.publish('topic-a', '');

  // assert
  assert.deepStrictEqual(published, [{ topic: 'topic-a', payload: '' }]);
});

test('rejects with the error the publish callback reports', async () => {
  // arrange
  const failure = new Error('publish refused');
  const { transport } = harness({ publish: failure });

  // act & assert
  await assert.rejects(
    () => transport.publish('topic-a', ''),
    (error: unknown) => {
      assert.strictEqual(error, failure);

      return true;
    },
  );
});

test('ends the client once and resolves both times when ended twice', async () => {
  // arrange
  const { transport, ends } = harness();

  // act
  await transport.end();
  await transport.end();

  // assert
  assert.strictEqual(ends(), 1);
});
