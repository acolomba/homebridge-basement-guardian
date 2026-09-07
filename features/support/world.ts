/**
 * @fileoverview The per-scenario world.
 *
 * Every scenario gets a fresh world. The world owns the lifetime of each fake it hands out, keeps
 * the scenario clock and the observation log, and tears everything down in reverse order once the
 * scenario ends, so no scenario leaks a listening socket, an open connection, or a temporary
 * directory into the next one.
 *
 * The world also builds the plugin's own account runtime against those fakes, through the single
 * composition seam the runtime publishes. The protocol constants are an ordinary injected
 * dependency of that seam, so pointing the plugin at a local cloud costs no production escape
 * hatch: the seam takes the bundled values in Homebridge and the harness values here.
 *
 * The world reports scenario time through `now()`, which is the shape a production clock port
 * expects, so it is handed to the code under test as its clock.
 */

import { setTimeout as delay } from 'node:timers/promises';

import { After, setWorldConstructor, World } from '@cucumber/cucumber';
import { connect, connectAsync } from 'mqtt';

import { markRestoredServicesStale, refuseRestoredControls } from '../../src/accessories/staleMarking.js';
import { httpFetch } from '../../src/cloud/httpDispatcher.js';
import { createFamilyRegistry } from '../../src/device/registry.js';
import { createRedactingLogger } from '../../src/logging.js';
import { applyMonitoringHealth, BasementGuardianPlatform, registerDiscoveredDevices, removeDiscoveredDevice } from '../../src/platform.js';
import { createAccountRuntimeFromConfig } from '../../src/runtime/accountRuntime.js';
import { PLATFORM_NAME } from '../../src/settings.js';

import { createFakeAuth0 } from './fakeAuth0.js';
import { createFakeHomebridgeApi } from './fakeHomebridgeApi.js';
import { createFakeRestApi } from './fakeRestApi.js';
import { createFakeShadowBroker } from './fakeShadowBroker.js';
import { createFakeTimers } from './fakeTimers.js';

import type { FakeAuth0 } from './fakeAuth0.js';
import type { FakeHomebridgeApi } from './fakeHomebridgeApi.js';
import type { ApiDevice, FakeRestApi } from './fakeRestApi.js';
import type { FakeShadowBroker } from './fakeShadowBroker.js';
import type { BasementGuardianAccessory } from '../../src/accessories/basementGuardian.js';
import type { NotificationServiceKind } from '../../src/accessories/services.js';
import type { AwsCredentialsResponse } from '../../src/cloud/types.js';
import type { FamilyRegistry } from '../../src/device/registry.js';
import type { DeviceSnapshot } from '../../src/device/state.js';
import type { RedactingLogger } from '../../src/logging.js';
import type { BasementGuardianPlatformAccessory, DiscoveryContext } from '../../src/platform.js';
import type { ProtocolConstants } from '../../src/protocol.js';
import type { AccountRuntime } from '../../src/runtime/accountRuntime.js';
import type { CommandPort } from '../../src/runtime/commandPort.js';
import type { MonitoringTrust } from '../../src/runtime/monitoringHealth.js';
import type { IWorldOptions } from '@cucumber/cucumber';
import type { API, LogLevel, Logging, PlatformConfig } from 'homebridge';
import type { MqttClient } from 'mqtt';

const POLL_INTERVAL_MS = 10;

// The bundled rotation waits ten minutes before an expiry and never less than thirty seconds, so a
// scenario driving a real rotation would wait thirty real seconds. A scenario that asks for the
// short interval states its own pair through the same seam, which turns that wait into
// milliseconds. Every other scenario keeps the bundled pair, because a rotation firing on this
// cadence would add vendor requests the scenario never asked for.
const HARNESS_ROTATION_LEAD_MS = 20;
const HARNESS_MIN_ROTATION_DELAY_MS = 50;

/** The moment every scenario's clock starts from. It moves only when a step moves it. */
export const SCENARIO_START_TIME = Date.parse('2026-08-28T12:00:00.000Z');

/**
 * Where every scenario's forward-only base starts.
 *
 * It has no relation to `SCENARIO_START_TIME`, and that is the point: the two bases are not
 * comparable, so a step or a plugin path that handed one port the other's reading fails loudly
 * rather than agreeing by coincidence.
 */
const SCENARIO_MONOTONIC_START_TIME = 4_000_000;

/** The account a scenario signs in with. Neither value names a real account. */
export const ACCOUNT_EMAIL = 'account@example.test';

/** The password a scenario signs in with. */
export const ACCOUNT_PASSWORD = 'placeholder-password';

/** The poll interval a scenario takes unless it asks for a shorter one, in seconds. */
const DEFAULT_POLL_INTERVAL_SECONDS = 900;

/** The Auth0 client identifier the harness signs in with. */
export const HARNESS_CLIENT_ID = 'placeholder-client-id';

/** The Auth0 password realm the harness signs in against. */
export const HARNESS_REALM = 'placeholder-realm';

const HARNESS_REGION = 'placeholder-region';
const HARNESS_SALT = 'placeholder-salt';
const CONFIRMATION_POLL_COUNT = 2;

// The signer builds the handshake URL from this scheme, and the local broker speaks the unsecured
// one. Nothing here disables certificate verification; there is no certificate to verify.
const UNSECURED_WEBSOCKET = 'ws';

/** One set of credential values the fake vendor issues. Not one of them is real. */
export interface ShadowCredentialMaterial {
  clientId: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

/** The credential material the fake vendor issues for the first handshake. */
export const SHADOW_CREDENTIALS: ShadowCredentialMaterial = {
  clientId: 'placeholder-shadow-client',
  accessKeyId: 'placeholder-access-key-id',
  secretAccessKey: 'placeholder-secret-access-key',
  sessionToken: 'placeholder-session-token',
};

/** The credential material the fake vendor rotates to. Every value differs from the first set. */
export const ROTATED_SHADOW_CREDENTIALS: ShadowCredentialMaterial = {
  clientId: 'placeholder-next-shadow-client',
  accessKeyId: 'placeholder-next-access-key-id',
  secretAccessKey: 'placeholder-next-secret-access-key',
  sessionToken: 'placeholder-next-session-token',
};

/** Every credential value the fake vendor can issue across one scenario. */
export const EVERY_ISSUED_CREDENTIAL: readonly string[] = [
  SHADOW_CREDENTIALS.accessKeyId,
  SHADOW_CREDENTIALS.secretAccessKey,
  SHADOW_CREDENTIALS.sessionToken,
  ROTATED_SHADOW_CREDENTIALS.accessKeyId,
  ROTATED_SHADOW_CREDENTIALS.secretAccessKey,
  ROTATED_SHADOW_CREDENTIALS.sessionToken,
];

/**
 * The client identifier the scenario's subscriber connects under.
 *
 * The subscriber stands in for the plugin's shadow client in the harness scenarios, which prove the
 * fakes themselves. It never reconnects on its own, so a scenario can observe a close as the event
 * it is.
 */
export const SUBSCRIBER_CLIENT_ID = 'harness-subscriber';

/** The scenario state and the fakes one scenario runs against. */
export class BasementGuardianWorld extends World {
  /** What the scenario observed, in arrival order. */
  readonly observations: string[] = [];

  /** Every line the plugin logged, its level first. */
  readonly logged: string[] = [];

  /** Every unhandled rejection the process reported while the scenario ran. */
  readonly rejections: string[] = [];

  /** One entry per canonical state change the store reported, naming the keys that moved. */
  readonly changes: string[] = [];

  /** The account settings the scenario configures the platform with. */
  settings: Record<string, unknown> = {};

  /**
   * The notification sensors the scenario configures the plugin to leave unpublished.
   *
   * The harness `launch()` path builds its own runtime configuration and its own `DiscoveryContext`,
   * so a scenario-configured suppression reaches the accessory through this field rather than
   * through `settings`, which only `loadPlatform()` reads (CONF-06).
   */
  ignoredFaults: readonly NotificationServiceKind[] = [];

  /** The devices the scenario handed to the fake REST service. */
  devices: readonly ApiDevice[] = [];

  private readonly cleanups: (() => Promise<void>)[] = [];

  private scenarioTime = SCENARIO_START_TIME;

  private monotonicTime = SCENARIO_MONOTONIC_START_TIME;

  // The deferred work the plugin arms, held against this world's own clock rather than a process
  // timer, so `advanceClock` is the only thing that ever runs it.
  private readonly timers = createFakeTimers(this);

  private pollIntervalSeconds = DEFAULT_POLL_INTERVAL_SECONDS;

  private shortRotation = false;

  private auth0Tenant: FakeAuth0 | undefined = undefined;

  private restService: FakeRestApi | undefined = undefined;

  private shadowBroker: FakeShadowBroker | undefined = undefined;

  private homebridgeApi: FakeHomebridgeApi | undefined = undefined;

  private subscriber: MqttClient | undefined = undefined;

  private redactingLog: RedactingLogger | undefined = undefined;

  private accountRuntime: AccountRuntime | undefined = undefined;

  private starting: Promise<void> | undefined = undefined;

  private loadedPlatform: BasementGuardianPlatform | undefined = undefined;

  private subscriberClosed = false;

  private readonly received: { topic: string; payload: string }[] = [];

  private readonly watchedDeviceIds = new Set<string>();

  // Published values a step read, so a later step can assert the same value came back.
  private readonly remembered = new Map<string, unknown>();

  private lastResponse: { status: number; body: unknown } | undefined = undefined;

  // What the last controller write answered. The wrapper distinguishes an accepted write, which
  // carries no status, from a scenario in which no step has written to a control at all.
  private lastWrite: { status: number | undefined } | undefined = undefined;

  private publishedVersion = 0;

  // A stable bound reference, because the listener has to be removed again at the end of the
  // scenario. Recording is what lets a shutdown scenario assert the absence of a rejection rather
  // than hope the process would have crashed on one.
  private readonly recordRejection = (reason: unknown): void => {
    this.rejections.push(String(reason));
  };

  constructor(readonly options: IWorldOptions) {
    super(options);
    process.on('unhandledRejection', this.recordRejection);
    this.own(() => {
      process.off('unhandledRejection', this.recordRejection);

      return Promise.resolve();
    });
  }

  /** The scenario's current time in milliseconds. */
  now(): number {
    return this.scenarioTime;
  }

  /** The scenario's forward-only elapsed time in milliseconds, on a base of its own. */
  monotonicNow(): number {
    return this.monotonicTime;
  }

  /**
   * Moves both of the scenario's time bases forward and runs whatever that made due.
   *
   * The plugin's deferred work is armed against the wall base through the controllable timers the
   * harness supplies, so advancing past a deadline is how a scenario observes the work behind it.
   * A scenario never sleeps and never races a process timer.
   *
   * It moves both bases because a scenario that advances time means time passed, and time passing
   * moves both. A scenario that means a wall-clock correction, which is a different event, reaches
   * for `jumpWallClock` instead. Moving only one base here would leave every silence scenario
   * passing for a new wrong reason.
   */
  advanceClock(milliseconds: number): void {
    this.scenarioTime += milliseconds;
    this.monotonicTime += milliseconds;
    this.timers.runDue();
  }

  /**
   * Moves the wall clock alone, forward or back, and runs whatever that made due.
   *
   * This is the step a system-clock correction reaches for, and it is separate from `advanceClock`
   * because a correction is not the same event as time passing. A backwards move makes nothing newly
   * due -- the harness's controllable timers hold absolute deadlines read from this clock -- and the
   * call stays because every clock mover in this file holds one contract: move, then run what that
   * made due.
   *
   * The plugin's own poll loop waits on real timers rather than on the injected port, so a scenario
   * still observes a poll landing after a jump. That is what lets a scenario read an answer the
   * plugin computed after the clock moved rather than the one it was already holding.
   */
  jumpWallClock(milliseconds: number): void {
    this.scenarioTime += milliseconds;
    this.timers.runDue();
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
      service.onCommandAccepted((deviceId, desiredData) => {
        this.reactToAcceptedCommand(deviceId, desiredData);
      });
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

  /** The logger the plugin writes through. Every registered secret is redacted before it lands. */
  logger(): RedactingLogger {
    this.redactingLog ??= createRedactingLogger({ delegate: this.recordingLog(), secrets: [] });

    return this.redactingLog;
  }

  /**
   * Points the temporary-credentials route at the local broker with this credential material.
   *
   * The expiry is the scenario's own start time, which is already inside the refresh lead window,
   * so the runtime rotates on its shortest permitted delay rather than an hour from now.
   */
  async issueShadowCredentials(material: ShadowCredentialMaterial): Promise<void> {
    const broker = await this.broker();
    const service = await this.restApi();
    const response: AwsCredentialsResponse = {
      endpoint: broker.host,
      clientId: material.clientId,
      credentials: {
        AccessKeyId: material.accessKeyId,
        SecretAccessKey: material.secretAccessKey,
        SessionToken: material.sessionToken,
        Expiration: new Date(SCENARIO_START_TIME).toISOString(),
      },
    };

    service.setAwsCredentials(response);
  }

  /** The version the next shadow document a scenario publishes carries. */
  nextShadowVersion(): number {
    this.publishedVersion += 1;

    return this.publishedVersion;
  }

  /** Shortens the poll interval so a scenario can observe the REST backstop reconcile. */
  usePollInterval(seconds: number): void {
    this.pollIntervalSeconds = seconds;
  }

  /** Shortens the rotation lead and floor so a scenario can observe a rotation without a real wait. */
  useShortRotation(): void {
    this.shortRotation = true;
  }

  /** Loads the platform against the fake Homebridge API, which is all a refusal needs. */
  async loadPlatform(): Promise<void> {
    const homebridge = await this.homebridge();
    const config: PlatformConfig = { platform: PLATFORM_NAME, ...this.settings };

    this.loadedPlatform = new BasementGuardianPlatform(this.recordingLog(), config, homebridge.api);
  }

  /** How many accessories the loaded platform holds. */
  accessoryCount(): number {
    if (this.loadedPlatform === undefined) {
      throw new Error('no step has loaded the platform yet');
    }

    return this.loadedPlatform.accessories.size;
  }

  /** Builds the account runtime against the fakes and starts it, without waiting for the launch. */
  startPlugin(): void {
    this.starting = this.launch();
  }

  /** Resolves once the launch attempt has finished, however it finished. */
  async awaitStart(): Promise<void> {
    await this.starting;
  }

  /** Stops the running account runtime. */
  async stopPlugin(): Promise<void> {
    await this.accountRuntime?.stop();
  }

  /** Stops the account runtime and builds a fresh one, as a Homebridge restart does. */
  async restartPlugin(): Promise<void> {
    await this.stopPlugin();
    this.accountRuntime = undefined;
    this.starting = this.launch();
    await this.starting;
  }

  /** Starts the account runtime a second time, which a stopped runtime must decline. */
  async startPluginAgain(): Promise<void> {
    await this.runtime().start();
  }

  /** The account runtime a scenario started. */
  runtime(): AccountRuntime {
    if (this.accountRuntime === undefined) {
      throw new Error('no step has started the plugin yet');
    }

    return this.accountRuntime;
  }

  /** The canonical snapshot the plugin holds for one device. */
  snapshot(deviceId: string): DeviceSnapshot {
    const held = this.runtime().store.snapshot(deviceId);

    if (held === undefined) {
      throw new Error(`the plugin holds no snapshot for ${deviceId}`);
    }

    return held;
  }

  /** Subscribes the scenario's subscriber to a topic, connecting it on first use. */
  async subscribe(topic: string): Promise<void> {
    const subscriber = await this.connectSubscriber();

    await subscriber.subscribeAsync(topic);
  }

  /** The payload of the first message on a topic, or a failure once the deadline passes. */
  async nextMessage(topic: string, timeoutMs: number): Promise<string> {
    const message = await this.until(() => this.received.find((candidate) => candidate.topic === topic), timeoutMs, `no message arrived on ${topic}`);

    return message.payload;
  }

  /** Resolves once the subscriber's connection closes, or fails once the deadline passes. */
  async awaitSubscriberClose(timeoutMs: number): Promise<void> {
    await this.until(() => (this.subscriberClosed ? this.subscriberClosed : undefined), timeoutMs, 'the subscriber connection stayed open');
  }

  /**
   * Resolves with the first value the reader answers, or fails once the deadline passes.
   *
   * The harness watches transports it does not own, so it polls. Every wait carries a deadline, so
   * a transport regression fails as a timeout on a named step rather than as a silent stall.
   */
  async until<T>(read: () => T | undefined, timeoutMs: number, failure: string): Promise<T> {
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

  /** Resolves once the condition holds, or fails once the deadline passes. */
  async untilTrue(condition: () => boolean, timeoutMs: number, failure: string): Promise<void> {
    await this.until(() => (condition() ? true : undefined), timeoutMs, failure);
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

  /**
   * Remembers a published value a step read, under a name a later step names it by.
   *
   * A record assertion across a restart compares what the plugin published before with what it
   * published after, rather than recomputing the expected value: a scenario that recomputed one
   * would assert its own arithmetic instead of the record that came back.
   */
  remember(name: string, value: unknown): void {
    this.remembered.set(name, value);
  }

  /** The value a step read under that name earlier in the scenario. */
  recall(name: string): unknown {
    if (!this.remembered.has(name)) {
      throw new Error(`no step has read ${name} yet`);
    }

    return this.remembered.get(name);
  }

  /** Records how a controller write ended: the HAP status that refused it, or nothing when it was accepted. */
  recordWriteOutcome(status: number | undefined): void {
    this.lastWrite = { status };
  }

  /** The status the last controller write was refused with, or `undefined` when it was accepted. */
  writeStatus(): number | undefined {
    if (this.lastWrite === undefined) {
      throw new Error('no step has written to a control yet');
    }

    return this.lastWrite.status;
  }

  /** Runs every registered teardown step in reverse order. */
  async cleanUp(): Promise<void> {
    await this.starting;

    const cleanups = this.cleanups.splice(0).reverse();

    for (const cleanup of cleanups) {
      await cleanup();
    }
  }

  // The fake pump reacting to a command it accepted: the device starts the test it was asked for
  // and says so where it says everything else, on the accepted-update topic through the broker's
  // existing publish (D-15, SYNC-02).
  //
  // No shadow topic leaf is added and no desired-state publish is handled, because neither has a
  // real counterpart. The plugin makes exactly one MQTT publish in its whole life and it is a
  // shadow get with an empty payload, so the service never has one of the plugin's updates to
  // reject, and the plugin does not subscribe to that leaf either. The `desiredData` body reaches
  // the vendor over the command route as an HTTP body, never as an MQTT message.
  //
  // Only a self-test is reacted to. Nobody has observed a real Gemini acknowledge a mute request,
  // report the resulting state, or time either, which is what `G-001` exists for, so a fake mute
  // acknowledgement would be this harness answering its own design (D-16).
  //
  // A scenario that started no broker gets no reaction, because there is no device to react: the
  // assertion that expected one then fails by name.
  private reactToAcceptedCommand(deviceId: string, desiredData: Record<string, unknown>): void {
    if (this.shadowBroker === undefined || desiredData.test_running !== true) {
      return;
    }

    this.shadowBroker.publishReported(deviceId, { data: { test_running: true } }, this.nextShadowVersion());
  }

  private recordingLog(): Logging {
    const at = (level: string) => (message: string) => {
      this.logged.push(`${level} ${message}`);
    };

    return Object.assign(at('info'), {
      prefix: 'basement guardian',
      debug: at('debug'),
      error: at('error'),
      info: at('info'),
      success: at('success'),
      warn: at('warn'),
      log: (level: LogLevel, message: string): void => {
        this.logged.push(`${level} ${message}`);
      },
    });
  }

  // The constants the seam takes. The REST base and the tenant origin come from the running fakes;
  // the endpoint and the vendor client identifier need no override at all, because both reach the
  // plugin as data in the credentials response.
  private async harnessConstants(): Promise<ProtocolConstants> {
    const tenant = await this.auth0();
    const service = await this.restApi();

    return {
      apiUrl: service.baseUrl,
      clientId: HARNESS_CLIENT_ID,
      auth0Url: tenant.origin,
      auth0Realm: HARNESS_REALM,
      awsRegion: HARNESS_REGION,
      protocol: UNSECURED_WEBSOCKET,
    };
  }

  // What `BasementGuardianPlatform.configureAccessory` does, which is the one thing the harness
  // stands in for that a restart depends on: Homebridge hands every cached accessory back before
  // the launch event, and the platform puts each one in the map discovery then finds it in. On a
  // first start the cache is empty and this is the empty map it was before.
  //
  // Neither restart pass is stood in for. Both are the same exported functions the platform method
  // calls, because a copy here would be a copy this harness then asserted against, and the restart
  // behaviour is exactly the one no scenario could otherwise see (D-12).
  //
  // The refusal takes the harness timers rather than the process ones, so the clearing push it arms
  // is a deferral a scenario runs by moving its own clock.
  //
  // The accessory stand-in answers the members the plugin reads and no structural type expresses
  // that, which is the same seam the widened `api` member documents.
  private restoredAccessories(homebridge: FakeHomebridgeApi): Map<string, BasementGuardianPlatformAccessory> {
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();

    for (const accessory of homebridge.restoreCachedAccessories()) {
      const restored = accessory as unknown as BasementGuardianPlatformAccessory;

      markRestoredServicesStale(restored, homebridge.api.hap);
      refuseRestoredControls(restored, homebridge.api.hap, this.logger(), this.timers);
      accessories.set(accessory.UUID, restored);
    }

    return accessories;
  }

  private async launch(): Promise<void> {
    const homebridge = await this.homebridge();
    const registry = createFamilyRegistry();
    const accessories = this.restoredAccessories(homebridge);
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const runtime = createAccountRuntimeFromConfig({
      config: {
        name: 'Basement Guardian',
        email: ACCOUNT_EMAIL,
        password: ACCOUNT_PASSWORD,
        clientId: HARNESS_CLIENT_ID,
        pollIntervalSeconds: this.pollIntervalSeconds,
        offlineConfirmationPollCount: CONFIRMATION_POLL_COUNT,
        ignoredFaults: this.ignoredFaults,
      },
      constants: await this.harnessConstants(),
      registry,
      storagePath: homebridge.storagePath,
      clock: this,
      // The World cannot satisfy both ports with one `now()`, so the forward-only one arrives as a
      // small object over `monotonicNow()`. Two ports, two bases, no call site that could confuse
      // them.
      monotonic: { now: () => this.monotonicNow() },
      log: this.logger(),
      connect,
      httpFetch,
      createSalt: () => HARNESS_SALT,
      // Drives the same registration logic `BasementGuardianPlatform` runs, so a scenario proves
      // the real discovery pipeline rather than a parallel copy of it.
      onTrustworthyInventory: (deviceIds: readonly string[]): void => {
        registerDiscoveredDevices(
          this.discoveryContext(homebridge.api, accessories, basementGuardianAccessories, registry, runtime.commands),
          deviceIds,
          runtime.store,
        );
        this.watchDevices(runtime);
      },
      onDeviceRemoved: (deviceId: string): void => {
        removeDiscoveredDevice(
          this.discoveryContext(homebridge.api, accessories, basementGuardianAccessories, registry, runtime.commands),
          deviceId,
          runtime.store,
        );
        // The store deletes this deviceId's whole listener registry entry on removal, so a later
        // re-discovery needs watchDevices() to subscribe it again rather than skip it as already
        // watched (WR-03).
        this.watchedDeviceIds.delete(deviceId);
      },
      // The same exported fan-out the platform calls, over the same
      // DiscoveryContext the two callbacks above build, so a scenario proves
      // the marking path a bridge runs rather than a harness copy of it (D-12).
      onMonitoringHealth: (account: MonitoringTrust, byDevice: ReadonlyMap<string, MonitoringTrust>): void => {
        applyMonitoringHealth(this.discoveryContext(homebridge.api, accessories, basementGuardianAccessories, registry, runtime.commands), account, byDevice);
      },
      // A scenario that did not ask for the short interval leaves both members absent, so the seam
      // supplies the bundled pair rather than the harness overriding it with a production value.
      ...(this.shortRotation ? { rotationLeadMs: HARNESS_ROTATION_LEAD_MS, minRotationDelayMs: HARNESS_MIN_ROTATION_DELAY_MS } : {}),
    });

    this.accountRuntime = runtime;
    this.own(() => runtime.stop());
    await runtime.start();
    this.watchDevices(runtime);
  }

  // The harness stands in for `BasementGuardianPlatform`, so it wires the runtime's command port and
  // supplies the same validated configuration members the platform reads from `validateConfig`.
  //
  // Where the platform wires the process timers, this supplies the controllable ones instead. The
  // accessory tier's one deferral is the control write path's, and a scenario has to observe both
  // the clearing push and the pending window closing; on process timers the first would race the
  // step that reads it and the second would cost a real thirty seconds. Driven from the scenario
  // clock, both are observed by advancing it.
  private discoveryContext(
    api: API,
    accessories: Map<string, BasementGuardianPlatformAccessory>,
    basementGuardianAccessories: Map<string, BasementGuardianAccessory>,
    registry: FamilyRegistry,
    commands: CommandPort,
  ): DiscoveryContext {
    return {
      api,
      accessories,
      basementGuardianAccessories,
      registry,
      log: this.logger(),
      ignoredFaults: this.ignoredFaults,
      offlineConfirmationPollCount: CONFIRMATION_POLL_COUNT,
      timers: this.timers,
      commands,
    };
  }

  // Re-scanned after every trustworthy inventory response (WR-01), so a device discovered only on
  // a later poll still gets a listener rather than silently recording nothing for it. Already
  // watched deviceIds are skipped, so a repeated scan never double-subscribes one.
  private watchDevices(runtime: AccountRuntime): void {
    for (const deviceId of runtime.store.deviceIds()) {
      if (this.watchedDeviceIds.has(deviceId)) {
        continue;
      }

      this.watchedDeviceIds.add(deviceId);

      // The listener signature fixes the position of the two snapshots, which this recorder has no
      // use for. The leading underscore is the compiler's marker for a parameter it may drop.
      const unsubscribe = runtime.store.subscribe(deviceId, (_next, _previous, changedKeys) => {
        this.changes.push(`${deviceId} ${changedKeys.join(' ')}`);
      });

      this.own(() => {
        unsubscribe();

        return Promise.resolve();
      });
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
}

setWorldConstructor(BasementGuardianWorld);

After(async function (this: BasementGuardianWorld) {
  await this.cleanUp();
});
