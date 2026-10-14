// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests MQTT connection hooks, notifications, and operation completion.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { It, mock, verify, when } from 'strong-mock';

import { createMqttTransport } from '../../src/cloud/mqttTransport.js';

import type {
  MqttClientEvents,
  MqttClientIdentity,
  MqttClientLike,
  MqttConnect,
  MqttConnectOptions,
  MqttTransport,
  MqttTransportOptions,
} from '../../src/cloud/mqttTransport.js';

const BROKER_URL = 'wss://broker.invalid/mqtt';
const SIGNED_URL = 'wss://broker.invalid/mqtt?signed=yes';
const HOOK_URL = 'wss://broker.invalid:443/mqtt';
const DEADLINE_MS = 5_000;
const DEADLINE_REFUSAL = 'The broker did not answer a transport operation within its deadline.';

interface ClientFailures {
  subscribe?: Error;
  publish?: Error;
  /** Withholds the callback, as a client that went down between calls does. */
  withhold?: boolean;
}

// The timers the process is holding open. A deadline whose loser is left to fire
// would show up here as one more than the operation started with.
function pendingTimers(): number {
  return process.getActiveResourcesInfo().filter((resource: string) => resource === 'Timeout').length;
}

interface PreparedConnection {
  options: MqttTransportOptions;
  client: MqttClientLike;
  handlers: Partial<MqttClientEvents>;
  connectOptions: MqttConnectOptions | undefined;
}

interface Harness extends PreparedConnection {
  transport: MqttTransport;
}

// One connection's worth of client behavior. The failures decide whether the
// subscribe and publish callbacks report success or an error.
function prepareConnection(failures: ClientFailures = {}): PreparedConnection {
  const handlers: Partial<MqttClientEvents> = {};
  let connectOptions: MqttConnectOptions | undefined;

  const client: MqttClientLike = {
    options: { clientId: 'client-first' },
    on: <Event extends keyof MqttClientEvents>(event: Event, handler: MqttClientEvents[Event]): void => {
      handlers[event] = handler;
    },
    subscribe: (...request: Parameters<MqttClientLike['subscribe']>): void => {
      if (failures.withhold !== true) {
        request[1](failures.subscribe ?? null);
      }
    },
    publish: (...request: Parameters<MqttClientLike['publish']>): void => {
      if (failures.withhold !== true) {
        request[2](failures.publish);
      }
    },
    end: (...request: Parameters<MqttClientLike['end']>): void => {
      request[1]();
    },
  };

  const options: MqttTransportOptions = {
    connect: (...request: Parameters<MqttConnect>): MqttClientLike => {
      connectOptions = request[1];

      return client;
    },
    url: BROKER_URL,
    clientId: 'client-first',
    deadlineMs: DEADLINE_MS,
    userAgent: 'harness-user-agent',
    signUrl: (): string => SIGNED_URL,
  };

  return {
    options,
    client,
    handlers,
    get connectOptions(): MqttConnectOptions | undefined {
      return connectOptions;
    },
  };
}

function harness(failures: ClientFailures = {}): Harness {
  const connection = prepareConnection(failures);
  const transport = createMqttTransport(connection.options);

  return { ...connection, transport };
}

// The transport records the connection on the notification's way through, so a
// case about ending a connected client registers a handler and raises it.
function connectTransport(harnessed: Harness): void {
  harnessed.transport.onConnect(() => undefined);
  harnessed.handlers.connect?.();
}

test('opens exactly one connection, to the supplied url', () => {
  // arrange
  const connection = prepareConnection();
  const connect = mock<MqttConnect>({ exactParams: true, name: 'connect' });
  when(() =>
    connect(BROKER_URL, {
      clientId: 'client-first',
      protocolVersion: 4,
      reconnectPeriod: 0,
      clean: true,
      resubscribe: true,
      transformWsUrl: It.matches((hook: MqttConnectOptions['transformWsUrl']) => typeof hook === 'function'),
      wsOptions: { headers: { 'User-Agent': 'harness-user-agent' } },
    }),
  ).thenReturn(connection.client);
  connection.options.connect = connect;

  // act
  createMqttTransport(connection.options);

  // assert
  verify(connect);
});

test('disables the library reconnect timer and asks for a clean, resubscribing session', () => {
  // arrange
  const connection = prepareConnection();
  const connect = mock<MqttConnect>({ exactParams: true, name: 'connect' });
  when(() =>
    connect(BROKER_URL, {
      clientId: 'client-first',
      protocolVersion: 4,
      reconnectPeriod: 0,
      clean: true,
      resubscribe: true,
      transformWsUrl: It.matches((hook: MqttConnectOptions['transformWsUrl']) => typeof hook === 'function'),
      wsOptions: { headers: { 'User-Agent': 'harness-user-agent' } },
    }),
  ).thenReturn(connection.client);
  connection.options.connect = connect;

  // act
  createMqttTransport(connection.options);

  // assert
  verify(connect);
});

test('signs the WebSocket handshake with the caller-supplied identity header', () => {
  // arrange
  const connection = prepareConnection();
  const connect = mock<MqttConnect>({ exactParams: true, name: 'connect' });
  when(() =>
    connect(BROKER_URL, {
      clientId: 'client-first',
      protocolVersion: 4,
      reconnectPeriod: 0,
      clean: true,
      resubscribe: true,
      transformWsUrl: It.matches((hook: MqttConnectOptions['transformWsUrl']) => typeof hook === 'function'),
      wsOptions: { headers: { 'User-Agent': 'harness-user-agent' } },
    }),
  ).thenReturn(connection.client);
  connection.options.connect = connect;

  // act
  createMqttTransport(connection.options);

  // assert
  verify(connect);
});

test('returns the signed url from the transform hook and ignores the url the hook receives', () => {
  // arrange
  const connection = prepareConnection();
  const signUrl = mock<MqttTransportOptions['signUrl']>({ exactParams: true, name: 'sign URL' });
  when(() => signUrl(It.is(connection.client)))
    .thenReturn(SIGNED_URL)
    .twice();
  connection.options.signUrl = signUrl;
  createMqttTransport(connection.options);
  const { client, connectOptions } = connection;

  // act
  const fromPortedUrl = connectOptions?.transformWsUrl(HOOK_URL, {}, client);
  const fromBareUrl = connectOptions?.transformWsUrl(BROKER_URL, {}, client);

  // assert
  assert.deepStrictEqual([fromPortedUrl, fromBareUrl], [SIGNED_URL, SIGNED_URL]);
  verify(signUrl);
});

test('hands the live client to the signer, so the refreshed identifier reaches the handshake', () => {
  // arrange
  const connection = prepareConnection();
  const signUrl = mock<MqttTransportOptions['signUrl']>({ exactParams: true, name: 'sign URL' });
  when(() => signUrl(It.is(connection.client))).thenReturn(SIGNED_URL);
  connection.options.signUrl = (live: MqttClientIdentity): string => {
    const signedUrl = signUrl(live);
    live.options.clientId = 'client-signed';

    return signedUrl;
  };

  createMqttTransport(connection.options);
  const { client, connectOptions } = connection;

  // act
  const signedUrl = connectOptions?.transformWsUrl(HOOK_URL, {}, client);

  // assert
  assert.strictEqual(signedUrl, SIGNED_URL);
  assert.deepStrictEqual(client.options, { clientId: 'client-signed' });
  verify(signUrl);
});

test('forwards the connect notification to the registered handler', () => {
  // arrange
  const { transport, handlers } = harness();
  const observed: string[] = [];
  const onConnect = mock<MqttClientEvents['connect']>({ exactParams: true, name: 'connect notification' });
  when(() => {
    onConnect();
  }).thenReturn(undefined);

  // act
  transport.onConnect((...notification: Parameters<MqttClientEvents['connect']>) => {
    observed.push('connect');
    onConnect(...notification);
  });
  handlers.connect?.();

  // assert
  assert.deepStrictEqual(observed, ['connect']);
  verify(onConnect);
});

test('forwards the message notification with its topic and payload', () => {
  // arrange
  const { transport, handlers } = harness();
  const messages: { topic: string; payload: Buffer }[] = [];
  const onMessage = mock<MqttClientEvents['message']>({ exactParams: true, name: 'message notification' });
  when(() => {
    onMessage('topic-a', Buffer.from([0x00, 0xff, 0x80, 0x41]));
  }).thenReturn(undefined);

  // act
  transport.onMessage((...notification: Parameters<MqttClientEvents['message']>) => {
    messages.push({ topic: notification[0], payload: notification[1] });
    onMessage(...notification);
  });
  handlers.message?.('topic-a', Buffer.from([0x00, 0xff, 0x80, 0x41]));

  // assert
  assert.deepStrictEqual(messages, [{ topic: 'topic-a', payload: Buffer.from([0x00, 0xff, 0x80, 0x41]) }]);
  verify(onMessage);
});

test('forwards the error notification with its error', () => {
  // arrange
  const { transport, handlers } = harness();
  const observed: unknown[] = [];
  const failure = new Error('socket failed');
  const onError = mock<MqttClientEvents['error']>({ exactParams: true, name: 'error notification' });
  when(() => {
    onError(It.is(failure));
  }).thenReturn(undefined);

  // act
  transport.onError((...notification: Parameters<MqttClientEvents['error']>) => {
    observed.push(notification[0]);
    onError(...notification);
  });
  handlers.error?.(failure);

  // assert
  assert.deepStrictEqual(observed, [failure]);
  verify(onError);
});

test('forwards the close notification to the registered handler', () => {
  // arrange
  const { transport, handlers } = harness();
  const observed: string[] = [];
  const onClose = mock<MqttClientEvents['close']>({ exactParams: true, name: 'close notification' });
  when(() => {
    onClose();
  }).thenReturn(undefined);

  // act
  transport.onClose((...notification: Parameters<MqttClientEvents['close']>) => {
    observed.push('close');
    onClose(...notification);
  });
  handlers.close?.();

  // assert
  assert.deepStrictEqual(observed, ['close']);
  verify(onClose);
});

test('subscribes to the complete topic list in one call', async () => {
  // arrange
  const { transport, client } = harness();
  let completeSubscribe: ((error: Error | null) => void) | undefined;
  const subscribe = mock<MqttClientLike['subscribe']>({ exactParams: true, name: 'subscribe' });
  when(() => {
    subscribe(
      ['topic-a', 'topic-b', 'topic-c'],
      It.matches((callback: (error: Error | null) => void) => {
        completeSubscribe = callback;

        return typeof callback === 'function';
      }),
    );
  }).thenReturn(undefined);
  client.subscribe = subscribe;

  // act
  const subscribing = transport.subscribe(['topic-a', 'topic-b', 'topic-c']);
  completeSubscribe?.(null);
  await subscribing;

  // assert
  verify(subscribe);
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
  const { transport, client } = harness();
  let completePublish: ((error?: Error) => void) | undefined;
  const publish = mock<MqttClientLike['publish']>({ exactParams: true, name: 'publish' });
  when(() => {
    publish(
      'topic-a',
      '',
      It.matches((callback: (error?: Error) => void) => {
        completePublish = callback;

        return typeof callback === 'function';
      }),
    );
  }).thenReturn(undefined);
  client.publish = publish;

  // act
  const publishing = transport.publish('topic-a', '');
  completePublish?.();
  await publishing;

  // assert
  verify(publish);
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
  const harnessed = harness();
  connectTransport(harnessed);
  let completeEnd: (() => void) | undefined;
  const end = mock<MqttClientLike['end']>({ exactParams: true, name: 'end' });
  when(() => {
    end(
      false,
      It.matches((callback: (error?: Error) => void) => {
        completeEnd = callback;

        return typeof callback === 'function';
      }),
    );
  }).thenReturn(undefined);
  harnessed.client.end = end;
  const completions: string[] = [];

  // act
  const firstEnd = harnessed.transport.end();
  const secondEnd = harnessed.transport.end();
  const firstCompletion = firstEnd.then(() => {
    completions.push('first');
  });
  const secondCompletion = secondEnd.then(() => {
    completions.push('second');
  });
  await Promise.resolve();
  const beforeCallback = [...completions];
  completeEnd?.();
  const completed = await Promise.all([firstCompletion, secondCompletion]);
  const repeatedEnd = harnessed.transport.end();
  await repeatedEnd;

  // assert
  assert.deepStrictEqual(
    { beforeCallback, completions, completed },
    {
      beforeCallback: [],
      completions: ['first', 'second'],
      completed: [undefined, undefined],
    },
  );
  assert.strictEqual(firstEnd, secondEnd);
  assert.strictEqual(firstEnd, repeatedEnd);
  verify(end);
});

test('SYNC-05 drops a client that never connected, because a graceful end would never close its socket', async () => {
  // arrange
  const { transport, client } = harness();
  let completeEnd: (() => void) | undefined;
  const end = mock<MqttClientLike['end']>({ exactParams: true, name: 'end' });
  when(() => {
    end(
      true,
      It.matches((callback: (error?: Error) => void) => {
        completeEnd = callback;

        return typeof callback === 'function';
      }),
    );
  }).thenReturn(undefined);
  client.end = end;
  const completions: string[] = [];

  // act
  const ending = transport.end().then(() => {
    completions.push('finished');
  });
  await Promise.resolve();
  const beforeCallback = [...completions];
  completeEnd?.();
  await ending;

  // assert
  assert.deepStrictEqual({ beforeCallback, completions }, { beforeCallback: [], completions: ['finished'] });
  verify(end);
});

for (const { operation, run } of [
  { operation: 'subscribe', run: (transport: MqttTransport): Promise<void> => transport.subscribe(['topic-a']) },
  { operation: 'publish', run: (transport: MqttTransport): Promise<void> => transport.publish('topic-a', '') },
]) {
  test(`refuses a ${operation} whose callback never fires once its deadline passes`, async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { transport } = harness({ withhold: true });

    // act
    const operating = run(transport);
    t.mock.timers.tick(DEADLINE_MS);

    // assert
    await assert.rejects(
      () => operating,
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.strictEqual(error.message, DEADLINE_REFUSAL);

        return true;
      },
    );
  });

  test(`holds a ${operation} open until its deadline arrives`, async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { transport } = harness({ withhold: true });
    const settled: string[] = [];
    const operating = run(transport).then(
      () => {
        settled.push('resolved');
      },
      () => {
        settled.push('refused');
      },
    );

    // act
    t.mock.timers.tick(DEADLINE_MS - 1);
    await Promise.resolve();
    const beforeDeadline = [...settled];
    t.mock.timers.tick(1);
    await operating;

    // assert
    assert.deepStrictEqual({ beforeDeadline, settled }, { beforeDeadline: [], settled: ['refused'] });
  });

  test(`leaves no timer pending when a ${operation} settles inside its deadline`, async () => {
    // arrange
    const { transport } = harness();
    const before = pendingTimers();

    // act
    await run(transport);

    // assert
    assert.strictEqual(pendingTimers(), before);
  });
}
