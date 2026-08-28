/**
 * @fileoverview The per-scenario world.
 *
 * Every scenario gets a fresh world. The world owns the lifetime of each fake it hands out, keeps
 * the scenario clock and the observation log, and tears everything down in reverse order once the
 * scenario ends, so no scenario leaks a listening socket, an open connection, or a temporary
 * directory into the next one.
 *
 * The world reports scenario time through `now()`, which is the shape a production clock port
 * expects, so a later scenario can hand the world itself to the code under test as its clock.
 */

import { setTimeout as delay } from 'node:timers/promises';

import { After, setWorldConstructor, World } from '@cucumber/cucumber';
import { connectAsync } from 'mqtt';

import { createFakeAuth0 } from './fakeAuth0.js';
import { createFakeHomebridgeApi } from './fakeHomebridgeApi.js';
import { createFakeRestApi } from './fakeRestApi.js';
import { createFakeShadowBroker } from './fakeShadowBroker.js';

import type { FakeAuth0 } from './fakeAuth0.js';
import type { FakeHomebridgeApi } from './fakeHomebridgeApi.js';
import type { ApiDevice, FakeRestApi } from './fakeRestApi.js';
import type { FakeShadowBroker } from './fakeShadowBroker.js';
import type { IWorldOptions } from '@cucumber/cucumber';
import type { MqttClient } from 'mqtt';

const POLL_INTERVAL_MS = 10;

/**
 * The client identifier the scenario's subscriber connects under.
 *
 * The subscriber stands in for the plugin's shadow client until the composition seam exists. It
 * never reconnects on its own, so a scenario can observe a close as the event it is.
 */
export const SUBSCRIBER_CLIENT_ID = 'harness-subscriber';

/** The scenario state and the fakes one scenario runs against. */
export class BasementGuardianWorld extends World {
  /** What the scenario observed, in arrival order. */
  readonly observations: string[] = [];

  /** The devices the scenario handed to the fake REST service. */
  devices: readonly ApiDevice[] = [];

  private readonly cleanups: (() => Promise<void>)[] = [];

  private scenarioTime = 0;

  private auth0Tenant: FakeAuth0 | undefined = undefined;

  private restService: FakeRestApi | undefined = undefined;

  private shadowBroker: FakeShadowBroker | undefined = undefined;

  private homebridgeApi: FakeHomebridgeApi | undefined = undefined;

  private subscriber: MqttClient | undefined = undefined;

  private subscriberClosed = false;

  private readonly received: { topic: string; payload: string }[] = [];

  private lastResponse: { status: number; body: unknown } | undefined = undefined;

  constructor(readonly options: IWorldOptions) {
    super(options);
  }

  /** The scenario's current time in milliseconds. It moves only when a step moves it. */
  now(): number {
    return this.scenarioTime;
  }

  /** Moves the scenario clock forward. */
  advanceClock(milliseconds: number): void {
    this.scenarioTime += milliseconds;
  }

  /** Registers a teardown step. The world runs registered steps in reverse order. */
  own(cleanup: () => Promise<void>): void {
    this.cleanups.push(cleanup);
  }

  /** The fake Auth0 tenant, started on first use. */
  async auth0(): Promise<FakeAuth0> {
    if (this.auth0Tenant === undefined) {
      const tenant = await createFakeAuth0();
      this.own(() => tenant.close());
      this.auth0Tenant = tenant;
    }

    return this.auth0Tenant;
  }

  /** The fake vendor REST service, started on first use. */
  async restApi(): Promise<FakeRestApi> {
    if (this.restService === undefined) {
      const service = await createFakeRestApi();
      this.own(() => service.close());
      this.restService = service;
    }

    return this.restService;
  }

  /** The fake shadow broker, started on first use. */
  async broker(): Promise<FakeShadowBroker> {
    if (this.shadowBroker === undefined) {
      const broker = await createFakeShadowBroker();
      this.own(() => broker.close());
      this.shadowBroker = broker;
    }

    return this.shadowBroker;
  }

  /** The Homebridge API stand-in, started on first use. */
  async homebridge(): Promise<FakeHomebridgeApi> {
    if (this.homebridgeApi === undefined) {
      const homebridge = await createFakeHomebridgeApi();
      this.own(() => homebridge.cleanup());
      this.homebridgeApi = homebridge;
    }

    return this.homebridgeApi;
  }

  /** Subscribes the scenario's subscriber to a topic, connecting it on first use. */
  async subscribe(topic: string): Promise<void> {
    const subscriber = await this.connectSubscriber();

    await subscriber.subscribeAsync(topic);
  }

  /** The payload of the first message on a topic, or a failure once the deadline passes. */
  async nextMessage(topic: string, timeoutMs: number): Promise<string> {
    const message = await this.waitFor(() => this.received.find((candidate) => candidate.topic === topic), timeoutMs, `no message arrived on ${topic}`);

    return message.payload;
  }

  /** Resolves once the subscriber's connection closes, or fails once the deadline passes. */
  async awaitSubscriberClose(timeoutMs: number): Promise<void> {
    await this.waitFor(() => (this.subscriberClosed ? this.subscriberClosed : undefined), timeoutMs, 'the subscriber connection stayed open');
  }

  /** Records the status and parsed body of a response a step received. */
  recordResponse(status: number, body: unknown): void {
    this.lastResponse = { status, body };
  }

  /** The most recent response a step recorded. */
  response(): { status: number; body: unknown } {
    if (this.lastResponse === undefined) {
      throw new Error('no step has recorded a response yet');
    }

    return this.lastResponse;
  }

  /** Runs every registered teardown step in reverse order. */
  async cleanUp(): Promise<void> {
    const cleanups = this.cleanups.splice(0).reverse();

    for (const cleanup of cleanups) {
      await cleanup();
    }
  }

  private async connectSubscriber(): Promise<MqttClient> {
    if (this.subscriber === undefined) {
      const broker = await this.broker();
      const subscriber = await connectAsync(`ws://${broker.host}/mqtt`, { clientId: SUBSCRIBER_CLIENT_ID, protocolVersion: 4, reconnectPeriod: 0 });

      subscriber.on('message', (topic, payload) => {
        this.received.push({ topic, payload: payload.toString('utf8') });
      });

      subscriber.on('close', () => {
        this.subscriberClosed = true;
      });

      this.own(() => subscriber.endAsync(true));
      this.subscriber = subscriber;
    }

    return this.subscriber;
  }

  // Polls until the reader answers a value, because the harness watches transports it does not own.
  private async waitFor<T>(read: () => T | undefined, timeoutMs: number, failure: string): Promise<T> {
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const value = read();

      if (value !== undefined) {
        return value;
      }

      if (Date.now() >= deadline) {
        throw new Error(`${failure} within ${String(timeoutMs)} ms`);
      }

      await delay(POLL_INTERVAL_MS);
    }
  }
}

setWorldConstructor(BasementGuardianWorld);

After(async function (this: BasementGuardianWorld) {
  await this.cleanUp();
});
