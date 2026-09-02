import timers from 'node:timers/promises';

import { createReconciliation } from '../accessories/reconciliation.js';
import { createCloudApi } from '../cloud/api.js';
import { createAuthClient } from '../cloud/auth.js';
import { AuthHaltedError, AuthRejectedError, AuthThrottledError, CloudRequestError } from '../cloud/errors.js';
import { createMqttTransport } from '../cloud/mqttTransport.js';
import { createShadowClient } from '../cloud/shadow.js';
import { createDeviceStateStore } from '../device/state.js';

import { createFailureLog, FAILURE_REMINDER_MS } from './failureLog.js';
import { createMonitoringHealth } from './monitoringHealth.js';
import { createRetryPolicy, MAX_BACKOFF_MS } from './retryPolicy.js';

import type { Clock } from './clock.js';
import type { CommandFailure, CommandOutcome, CommandPort } from './commandPort.js';
import type { FailureLog } from './failureLog.js';
import type { MonitoringTrust } from './monitoringHealth.js';
import type { RetryPolicy } from './retryPolicy.js';
import type { CloudApi } from '../cloud/api.js';
import type { MqttConnect } from '../cloud/mqttTransport.js';
import type { CredentialCache, ShadowClient, ShadowCredentials, ShadowDisconnectReason } from '../cloud/shadow.js';
import type { ApiDevice, AwsCredentialsResponse, DeviceCommand } from '../cloud/types.js';
import type { BgConfig } from '../config.js';
import type { DeviceCapability } from '../device/family.js';
import type { MonitoringPath } from '../device/health.js';
import type { FamilyRegistry } from '../device/registry.js';
import type { DeviceStateStore, ReportedPatch } from '../device/state.js';
import type { RedactingLogger, SecretRole } from '../logging.js';
import type { ProtocolConstants } from '../protocol.js';
import type { Logging } from 'homebridge';

/** Deadline applied to each vendor request. */
const REQUEST_TIMEOUT_MS = 10_000;

const MILLISECONDS_PER_SECOND = 1_000;

/** How long before a credential expiry a bundled runtime refreshes the cache. */
export const ROTATION_LEAD_MS = 600_000;

/** The floor a bundled rotation delay is held at, so a response already inside the lead window still waits. */
export const MIN_ROTATION_DELAY_MS = 30_000;

// What one failing activity is called. The name reads as the subject of the
// recovery sentence the failure log writes, and each one carries its own
// warning cadence.
const POLLING = 'Device polling';
const ROTATION = 'Credential rotation';
const SHADOW = 'The shadow connection';
const AUTHENTICATION = 'Authentication';
const LIVE_REPORTING = 'Live device reporting';

const ROTATION_FAILED = 'The temporary shadow credentials could not be refreshed; the plugin will try again.';
const SHADOW_DEGRADED = 'The shadow connection is unavailable, so device state is coming from polling alone until it returns.';
const LIVE_REPORTING_SILENT =
  'No device message has arrived on the live connection for two heartbeat intervals, so HomeKit is marking what it shows untrustworthy until one does.';
const THROTTLED = 'Authentication is being throttled, so the plugin is waiting before it tries again.';
const AUTHENTICATION_STOPPED =
  'Monitoring has stopped because the vendor refused the account credentials. Correct the account in Homebridge to start the plugin again.';

/**
 * The half of the shadow client's options the runtime owns.
 *
 * The scheme, the region, the transport, and the connect function belong to the
 * composition seam, which closes over them. What is left is what the runtime
 * itself supplies: the cache its rotation keeps fresh, the reconnect policy
 * built for that client alone, and where the connection reports to.
 */
export interface ShadowRuntimeOptions {
  credentials: CredentialCache;
  retry: RetryPolicy;
  onReportedPatch: (deviceId: string, patch: ReportedPatch) => void;
  onConnected: () => void;
  onDisconnected: (reason: ShadowDisconnectReason) => void;
}

/** Every deviceId a trustworthy inventory response named, for a discovery-time listener. */
export type TrustworthyInventoryListener = (deviceIds: readonly string[]) => void;

/** Everything the account runtime needs, by injection. */
export interface AccountRuntimeOptions {
  api: CloudApi;
  store: DeviceStateStore;
  /**
   * The family lookup a command body is built through.
   *
   * The runtime holds it because it is the only object holding the cloud client
   * and the root abort controller as well, and the wire body for one intent
   * differs per family (CTRL-05).
   */
  registry: FamilyRegistry;
  createShadow: (options: ShadowRuntimeOptions) => ShadowClient;
  /**
   * Builds one reconnect policy over the root signal.
   *
   * The runtime builds two and never shares one, because a policy's pending
   * guard covers the whole policy: a single instance would let the shadow
   * client's reconnect swallow the runtime's own retry, or the reverse
   * (SYNC-04).
   */
  createRetry: (signal: AbortSignal) => RetryPolicy;
  pollIntervalMs: number;
  /** How long before a credential expiry the rotation refreshes the cache. */
  rotationLeadMs: number;
  /** The floor a rotation delay is held at, so a response already inside the lead window still waits. */
  minRotationDelayMs: number;
  failures: FailureLog;
  /**
   * Registers credential material with the redacting logger as it arrives.
   *
   * A rotated value carries its role, so it replaces the value that role held
   * rather than joining it (AUTH-02).
   */
  registerSecret: (secret: string, role?: SecretRole) => void;
  /**
   * Reports every deviceId a trustworthy inventory response named, right after
   * each one has been applied to the store.
   *
   * A trustworthy response is HTTP 200 with a schema-valid envelope, including
   * a valid empty list; a failed or malformed response never reaches this
   * listener (D-029).
   */
  onTrustworthyInventory: TrustworthyInventoryListener;
  /**
   * Reports a deviceId confirmed absent by two consecutive trustworthy
   * inventory responses and by one further out-of-band final-check fetch run
   * immediately before this call (D-029).
   */
  onDeviceRemoved: (deviceId: string) => void;
  /**
   * Reports what the plugin can currently say about its own ability to observe
   * this account, on every poll outcome.
   *
   * This is the trust decision; `monitoringPath` stays the diagnostic. The path
   * names which sources are feeding state and collapses a failing poll with a
   * lost shadow into one value, while these two facts are what the HomeKit tier
   * needs kept apart: a shadow that has gone quiet while polls still succeed is
   * the expensive case, because a pump run lasts seconds and begins and ends
   * between two polls, and it reads as the healthier value on the path (D-04).
   */
  onMonitoringHealth: (trust: MonitoringTrust) => void;
  clock: Clock;
  log: Logging;
}

/** One account's cloud work, started and stopped by the Homebridge lifecycle. */
export interface AccountRuntime {
  readonly monitoringPath: MonitoringPath;
  /**
   * The canonical device state both sources land in.
   *
   * The runtime owns the single store, so whatever renders device state reads
   * and subscribes here rather than keeping a second copy that can disagree.
   */
  readonly store: DeviceStateStore;
  /**
   * The command surface a HomeKit control reaches the vendor through.
   *
   * The runtime owns it because it holds both the cloud client and the root
   * abort controller, so a shutdown cancels a command in flight through the one
   * mechanism every other wait and request already ends on (CTRL-05, SYNC-05).
   */
  readonly commands: CommandPort;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// The vendor deadline aborts with a `TimeoutError`; every other rejection -- a
// non-2xx answer, an unreadable body, a shutdown -- is a vendor error. The two
// are told apart here, at the only place that can still see which happened,
// because the HomeKit tier answers a different HAP status for each (D-04,
// D-038).
function commandFailureOf(error: unknown): CommandFailure {
  return error instanceof Error && error.name === 'TimeoutError' ? 'timed-out' : 'vendor-error';
}

// The wire body for one intent differs per family and the wrong shape is
// accepted and ignored rather than refused, so the family the device's own
// `deviceTypeId` selects is what builds it. A device the store never held, or
// one whose family this version cannot drive, yields no body at all rather than
// a guessed one.
function commandBodyOf(options: AccountRuntimeOptions, deviceId: string, capability: DeviceCapability, requested: boolean): DeviceCommand | undefined {
  const deviceTypeId = options.store.snapshot(deviceId)?.identity.deviceTypeId;

  if (deviceTypeId === undefined) {
    return undefined;
  }

  const outcome = options.registry.lookup(deviceTypeId);

  return outcome.kind === 'implemented' ? outcome.family.command(capability, requested) : undefined;
}

// The cache the signing hook reads, plus the one write the rotation makes.
// Replacing the held value is the whole of rotating in place: the next
// handshake reads it, and nothing re-signs an established socket (SYNC-04).
interface MutableCredentialCache extends CredentialCache {
  replace(next: ShadowCredentials): void;
}

// Failure reporting stays a fixed message plus an HTTP status. An arbitrary
// error's message can name a URL, so it is never repeated into the log.
function describeFailure(error: unknown): string {
  if (error instanceof CloudRequestError) {
    return `Device discovery failed on ${error.route} with HTTP ${String(error.status)}.`;
  }

  return 'Device discovery failed.';
}

function createCredentialCache(initial: ShadowCredentials): MutableCredentialCache {
  let held = initial;

  return {
    current: () => held,
    replace: (next: ShadowCredentials): void => {
      held = next;
    },
  };
}

// The vendor's capitalized field names are kept as they arrive elsewhere; the
// connection needs them under its own.
function toShadowCredentials(response: AwsCredentialsResponse): ShadowCredentials {
  return {
    endpoint: response.endpoint,
    clientId: response.clientId,
    accessKeyId: response.credentials.AccessKeyId,
    secretAccessKey: response.credentials.SecretAccessKey,
    sessionToken: response.credentials.SessionToken,
  };
}

// The expiry is an untyped vendor string, so one that does not parse must not
// become a NaN delay: a timer armed with NaN fires at once and spins.
function rotationDelayMs(expiration: string, now: number, options: AccountRuntimeOptions): number {
  const expiresAt = Date.parse(expiration);

  if (!Number.isFinite(expiresAt)) {
    return options.minRotationDelayMs;
  }

  return Math.max(options.minRotationDelayMs, expiresAt - now - options.rotationLeadMs);
}

/**
 * Creates the account runtime.
 *
 * One root `AbortController` owns every wait, request, and connection, so a
 * shutdown cancels them all through one mechanism and leaves no timer holding
 * the process open (SYNC-05). Creating the runtime opens no connection, reads
 * no file, and starts no timer; only `start` does any work.
 *
 * Both long-running activities are loops rather than self-rearming callbacks.
 * A loop keeps the next attempt scheduled no matter how the last one ended,
 * which is the property a failed credential refresh most needs: the surveyed
 * defect is a plugin that logs and returns, leaving its push channel dead until
 * the bridge restarts.
 */
export function createAccountRuntime(options: AccountRuntimeOptions): AccountRuntime {
  const root = new AbortController();
  const connectRetry = options.createRetry(root.signal);
  const shadowRetry = options.createRetry(root.signal);
  const reconciliation = createReconciliation({ clock: options.clock, log: options.log });
  const health = createMonitoringHealth({ clock: options.clock });
  let credentials: MutableCredentialCache | undefined;
  let shadow: ShadowClient | undefined;
  // The three facts the monitoring path is derived from. Holding them, rather
  // than the answer, is what keeps the derivation from depending on which
  // assignment ran last.
  let polling = false;
  let shadowConnected = false;
  let halted = false;
  let started = false;
  let stopped = false;
  let retryingShadow = false;

  // Every wait ends on the root signal. A rejection here means a shutdown
  // cancelled the wait, which is reported as a false rather than raised: an
  // escaping rejection would surface as an unhandled exception in the
  // Homebridge process (D-20).
  async function waitFor(delayMs: number): Promise<boolean> {
    try {
      await timers.setTimeout(delayMs, undefined, { signal: root.signal });

      return true;
    } catch {
      return false;
    }
  }

  // The final check re-fetches the inventory once more, immediately before a
  // removal commits, closing the race where a device reappears between the
  // second confirming poll and the removal decision (D-029). Its own failure
  // is a monitoring-path failure, not a device fact (D-014): it removes
  // nothing and leaves the pending deviceIds for the next successful poll's
  // own confirmedAbsent computation, with no separate retry state.
  async function applyDevices(devices: readonly ApiDevice[]): Promise<void> {
    for (const device of devices) {
      options.store.applyDiscovery(device);
    }

    const deviceIds = devices.map((device) => device.deviceId);
    options.onTrustworthyInventory(deviceIds);

    const confirmedAbsent = reconciliation.observe(deviceIds);

    if (confirmedAbsent.length === 0) {
      return;
    }

    try {
      const freshDevices = await options.api.devices(root.signal);
      const stillPresent = new Set(freshDevices.map((device) => device.deviceId));

      // Only the deviceIds actually under confirmation are re-observed here
      // (CR-01): replaying the whole fleet through `reconciliation.observe()`
      // let a transient omission on this extra request advance an unrelated,
      // otherwise-healthy deviceId's absence count.
      for (const deviceId of confirmedAbsent) {
        if (stillPresent.has(deviceId)) {
          // Reappeared since the confirming poll: forget it so a future
          // absence starts a fresh epoch.
          reconciliation.forget(deviceId);
        } else {
          // Confirmed and about to be removed: stop tracking it so it can
          // never re-trigger this final check again once it is gone.
          reconciliation.forget(deviceId);
          options.onDeviceRemoved(deviceId);
        }
      }
    } catch {
      // Deliberately silent, for the reason above.
    }
  }

  // Which sources are feeding canonical state, derived from what is working
  // rather than assigned wherever something changed.
  //
  // A halted runtime is unavailable whatever else once held, because nothing
  // will be attempted again (D-13). A stopped one is unavailable for the same
  // reason and no other: the value names which sources are feeding state, not
  // whether something went wrong, and a shutdown that has aborted every wait
  // and request is feeding nothing. Reporting the path the runtime last held
  // would be the false normal this plugin refuses, from the one direction the
  // runtime cannot correct afterwards.
  //
  // Polling is the floor below both: it is the reconciliation backstop, so a
  // poll that is not succeeding means the plugin cannot vouch for what it holds
  // even while the shadow is live, and naming the combined path there would be
  // the same false normal.
  //
  // A degraded path is not a device condition: it says the plugin is seeing
  // less, never that a device reported itself disconnected (D-15).
  function monitoringPathNow(): MonitoringPath {
    if (stopped || halted || !polling) {
      return 'unavailable';
    }

    return shadowConnected ? 'shadow-and-poll' : 'poll-only';
  }

  // The trust is computed once and reported from that one value, so what the
  // plugin says about its own sight and what HomeKit marks cannot disagree.
  //
  // It runs on every poll outcome rather than from the poll loop alone, because
  // `launch()` records its own first inventory outcome without going through
  // that loop, and a report wired only into the loop would arrive a whole poll
  // interval late -- an hour at the configuration maximum. A poll a shutdown
  // aborted returns before both recorders, so it advances nothing and reports
  // nothing.
  // Whether the plugin currently has a proven way to reach the vendor, derived
  // from the same three flags the monitoring path is derived from and storing
  // nothing of its own.
  //
  // A stopped runtime has aborted every request, and a halted one will never
  // attempt another, so neither can send. Below both sits the poll: it is what
  // a command travels on, so a runtime whose last poll did not succeed has no
  // proven route -- which is also why this is false before the first inventory
  // has landed, when nothing has yet reached the vendor at all.
  //
  // One failed poll is enough here while two are needed to withdraw trust,
  // because the two thresholds answer different questions. Withdrawing trust
  // says a displayed value may be stale, and a blip must not flap a tile.
  // Refusing a press says the plugin has no way to reach the vendor right now,
  // and sending into a route that has just failed buys a round trip that ends
  // as a vendor error -- which is exactly the blur between a vendor refusal and
  // a local one that the per-cause status table exists to prevent (RES-04,
  // D-07).
  function commandTransportReadyNow(): boolean {
    return !stopped && !halted && polling;
  }

  // What the runtime pushes: the two facts the projection tracks, plus the two
  // it cannot answer because it sees neither the lifecycle nor authentication.
  //
  // `credentialsRejected` is `halted` and nothing else. `halted` is set in
  // exactly one place -- the terminal branch in `launchFailure` -- so reading it
  // here rather than raising a second flag beside it is what keeps the fact
  // HomeKit presents and the fact the runtime acts on from ever drifting apart
  // (D-13, D-10).
  function monitoringTrustNow(): MonitoringTrust {
    return { ...health.trustNow(), commandTransportReady: commandTransportReadyNow(), credentialsRejected: halted };
  }

  function reportMonitoringHealth(): void {
    const trust = monitoringTrustNow();

    // The condition is reported and pushed from the one value, so the cause the
    // log names and the condition HomeKit marks cannot disagree. The rate
    // limiting is the failure log's own: a silence that lasts an afternoon
    // says so once and then on the reminder cadence, and there is no second
    // warn-once flag beside it. A failing poll is not reported here, because
    // `Device polling` already owns that line (D-03).
    if (trust.shadowSilent) {
      options.failures.recordFailure(LIVE_REPORTING, LIVE_REPORTING_SILENT);
    } else {
      options.failures.recordSuccess(LIVE_REPORTING);
    }

    options.onMonitoringHealth(trust);
  }

  // Whether the poll is succeeding is one of the facts the path is derived
  // from, so the fact and the report move together and cannot disagree.
  //
  // `polling` keeps its single-failure meaning, because the monitoring path is
  // derived from it and answers a different question: which sources are feeding
  // state. The run of consecutive failures the trust projection counts is a
  // separate fact for a separate projection, so one blip cannot withdraw trust
  // while the path still reports it honestly (D-04, D-05).
  function recordPollSuccess(): void {
    polling = true;
    options.failures.recordSuccess(POLLING);
    health.recordRestSuccess();
    reportMonitoringHealth();
  }

  function recordPollFailure(error: unknown): void {
    polling = false;
    options.failures.recordFailure(POLLING, describeFailure(error));
    health.recordRestFailure();
    reportMonitoringHealth();
  }

  function handleShadowConnected(): void {
    shadowConnected = true;
    connectRetry.reset();
    options.failures.recordSuccess(SHADOW);
  }

  // A clean close is not a fault. The provider closes a signed connection at a
  // ceiling it publishes no knob for, so at least one reconnect a day is
  // ordinary, and the client's own guarded retry owns getting back. Only the
  // path changes, and it changes because the plugin is seeing less, not because
  // a device said anything.
  //
  // A failed connection and a refused subscription are the degraded path, and
  // this is the one place that sees the whole stream of them, so the reader is
  // told once and then on the reminder cadence rather than on every
  // capped-backoff attempt (D-14, D-15).
  function handleShadowDisconnected(reason: ShadowDisconnectReason): void {
    shadowConnected = false;
    // The shadow stops being the source of telemetry the moment the connection
    // ends, whatever ended it, so the poll takes it back over until the
    // reconnect's complete-shadow request re-establishes ownership (D-15,
    // SYNC-03).
    options.store.releaseShadowSource();

    if (reason !== 'transport-closed') {
      options.failures.recordFailure(SHADOW, SHADOW_DEGRADED);
    }
  }

  // Whether a shutdown has begun. It is asked through a function so that a
  // check after an await asks again rather than reusing the answer from before
  // it, which is the whole point of checking twice.
  function hasStopped(): boolean {
    return stopped;
  }

  // Closing reports nothing. A connection that fails while it is being closed
  // has still stopped being used, and an escaping rejection during shutdown
  // would surface as an unhandled exception in the Homebridge process (D-20).
  async function closeQuietly(client: ShadowClient | undefined): Promise<void> {
    try {
      await client?.close();
    } catch {
      // Deliberately silent, for the reason above.
    }
  }

  // Opens the connection once there is both a credential cache to sign from and
  // a device to subscribe for, and reports whether it was refused so the caller
  // can decide whether a retry chain needs starting.
  async function attemptShadow(): Promise<boolean> {
    const cache = credentials;
    const deviceIds = options.store.deviceIds();

    if (hasStopped() || shadow !== undefined || cache === undefined || deviceIds.length === 0) {
      return false;
    }

    try {
      const client = options.createShadow({
        credentials: cache,
        retry: shadowRetry,
        onReportedPatch: (deviceId: string, patch: ReportedPatch) => {
          // This callback fires for every routed message, upstream of the
          // store's change filter, which is why it and not a snapshot listener
          // is the arrival signal: a heartbeat carrying values identical to the
          // last one notifies no subscriber and still proves the live path is
          // carrying messages (D-05, D-11).
          health.recordShadowMessage();
          options.store.applyReportedPatch(deviceId, patch);
        },
        onConnected: handleShadowConnected,
        onDisconnected: handleShadowDisconnected,
      });
      await client.start(deviceIds);

      // The start has already opened the socket, so a shutdown that landed
      // while it was resolving found no client to close and would leave that
      // socket with nothing to close it. It is closed here and never recorded
      // (SYNC-05).
      if (hasStopped()) {
        await closeQuietly(client);

        return false;
      }

      shadow = client;

      return false;
    } catch {
      // The polling path is already the reconciliation backstop, so a shadow
      // outage costs latency rather than correctness. The runtime stays up and
      // says so once (D-15).
      options.failures.recordFailure(SHADOW, SHADOW_DEGRADED);

      return true;
    }
  }

  // The chain is its own schedule rather than work handed back to the policy:
  // the policy clears its pending guard only after the work it is running
  // settles, so a retry scheduled from inside that work would be dropped and
  // the chain would stop after one attempt. The policy still owns the capped
  // shape of the delays.
  async function retryShadow(): Promise<void> {
    retryingShadow = true;

    while (shadow === undefined && !stopped && (await waitFor(connectRetry.nextDelayMs()))) {
      await attemptShadow();
    }

    retryingShadow = false;
  }

  // A pending chain owns reconnecting, so a poll landing in the middle of one
  // neither opens a competing attempt nor starts a second chain.
  async function openShadow(): Promise<void> {
    if (retryingShadow) {
      return;
    }

    if (await attemptShadow()) {
      void retryShadow();
    }
  }

  async function refreshCredentials(): Promise<number> {
    try {
      const response = await options.api.awsCredentials(root.signal);
      // Every one of the three values is credential material the moment it
      // arrives, so each is registered before anything can quote it. Each
      // carries its role, so this set replaces the one the previous rotation
      // registered instead of adding to it (AUTH-02).
      options.registerSecret(response.credentials.AccessKeyId, 'aws-access-key-id');
      options.registerSecret(response.credentials.SecretAccessKey, 'aws-secret-access-key');
      options.registerSecret(response.credentials.SessionToken, 'aws-session-token');

      const cache = credentials;

      if (cache === undefined) {
        credentials = createCredentialCache(toShadowCredentials(response));
        await openShadow();
      } else {
        cache.replace(toShadowCredentials(response));
      }

      options.failures.recordSuccess(ROTATION);

      return rotationDelayMs(response.credentials.Expiration, options.clock.now(), options);
    } catch {
      if (!root.signal.aborted) {
        options.failures.recordFailure(ROTATION, ROTATION_FAILED);
      }

      return options.minRotationDelayMs;
    }
  }

  // The first pass fills the cache and opens the connection; every later one
  // refreshes ahead of the expiry the previous response carried.
  async function runCredentials(): Promise<void> {
    let delayMs = await refreshCredentials();

    while (await waitFor(delayMs)) {
      delayMs = await refreshCredentials();
    }
  }

  // The shadow synchronizes current state rather than replaying what was
  // missed, so the poll is what reconciles anything the socket did not carry
  // (SYNC-03).
  async function runPoll(): Promise<void> {
    try {
      await applyDevices(await options.api.devices(root.signal));
      recordPollSuccess();
      await openShadow();
    } catch (error: unknown) {
      // A shutdown aborted the request. That is not a monitoring failure, so
      // nothing is recorded and the poll keeps whichever answer it last gave
      // (SYNC-05).
      if (root.signal.aborted) {
        return;
      }

      // A failed request changes no stored snapshot and marks nothing
      // disconnected: a monitoring-path failure and a device-reported
      // disconnection are separate conditions (D-014).
      recordPollFailure(error);
    }
  }

  async function runPolls(): Promise<void> {
    while (await waitFor(options.pollIntervalMs)) {
      await runPoll();
    }
  }

  function startBackgroundWork(): void {
    void runPolls();
    void runCredentials();
  }

  // Returns how long to wait before launching again, or undefined when the
  // runtime is up or has stopped trying.
  //
  // The two terminal authentication answers are routed apart. A refused
  // credential stops the runtime for good, because the vendor's block lifts
  // only thirty days after the last attempt and saving the configuration in the
  // Homebridge UI already restarts the bridge (D-13). A throttling response is
  // retried on the long interval the error carries rather than on the capped
  // backoff (D-22).
  function launchFailure(error: unknown): number | undefined {
    if (root.signal.aborted) {
      return undefined;
    }

    // Nothing polls, refreshes, or connects after this, so the runtime says
    // monitoring has stopped rather than leaving a working degraded path
    // standing, and records the stop so the recovery discipline learns of the
    // one failure the project treats as final (D-13).
    if (error instanceof AuthRejectedError || error instanceof AuthHaltedError) {
      halted = true;
      options.failures.recordFailure(AUTHENTICATION, AUTHENTICATION_STOPPED);
      // The one failure this project treats as final, so this is the only push
      // the accessory tier will ever get from this run: no poll loop starts
      // after it and nothing reports again. Without it the tier would go on
      // answering a press from whatever the last report left, and a run that
      // halted at its first grant left nothing at all. The trust is pushed
      // rather than reported, because the live-reporting line describes an
      // observation this run never made (D-13, D-07).
      options.onMonitoringHealth(monitoringTrustNow());

      return undefined;
    }

    // The runtime is waiting rather than finished, so nothing is marked
    // terminal here (D-22).
    if (error instanceof AuthThrottledError) {
      options.failures.recordFailure(AUTHENTICATION, THROTTLED);

      return error.retryAfterMs;
    }

    recordPollFailure(error);
    startBackgroundWork();

    return undefined;
  }

  async function launch(): Promise<number | undefined> {
    try {
      const devices = await options.api.devices(root.signal);
      await applyDevices(devices);
      recordPollSuccess();
      options.log.info(`Discovered ${String(devices.length)} device(s).`);
    } catch (error: unknown) {
      return launchFailure(error);
    }

    startBackgroundWork();

    return undefined;
  }

  async function relaunch(firstDelayMs: number): Promise<void> {
    let delayMs = firstDelayMs;

    while (await waitFor(delayMs)) {
      const next = await launch();

      if (next === undefined) {
        return;
      }

      delayMs = next;
    }
  }

  // Exactly one attempt, under the root signal, with no retry anywhere: a
  // command that outlived its deadline may already have reached the device, and
  // a second attempt would operate a real sump pump twice (D-038). A resolved
  // body carrying `success: false` is the vendor refusing the command, not the
  // route failing, so it is answered as a refusal rather than falling out of the
  // rejection path.
  const commands: CommandPort = {
    async send(deviceId: string, capability: DeviceCapability, requested: boolean): Promise<CommandOutcome> {
      const command = commandBodyOf(options, deviceId, capability, requested);

      if (command === undefined) {
        return { accepted: false, failure: 'vendor-error' };
      }

      try {
        const result = await options.api.sendCommand(deviceId, command, root.signal);

        return result.success ? { accepted: true } : { accepted: false, failure: 'vendor-error' };
      } catch (error: unknown) {
        return { accepted: false, failure: commandFailureOf(error) };
      }
    },
  };

  return {
    get monitoringPath(): MonitoringPath {
      return monitoringPathNow();
    },

    store: options.store,

    commands,

    // Resolves once the first attempt has been made. A launch that must be
    // tried again waits in the background, so the Homebridge launch event is
    // never held open by a vendor that is not answering.
    async start(): Promise<void> {
      if (started || stopped) {
        return;
      }

      started = true;

      const retryInMs = await launch();

      if (retryInMs !== undefined) {
        void relaunch(retryInMs);
      }
    },

    // Aborting first cancels every wait and request before anything else is
    // released; the socket is closed last (SYNC-05). Calling this twice, or
    // after a partial start, resolves and raises nothing.
    //
    // Nothing releases the store's shadow source here, and nothing needs to.
    // Closing raises no disconnection, so the store keeps the shadow as the
    // owner of telemetry, but the abort above has already ended every wait and
    // request: no poll follows that the ownership could hold off, and the store
    // is discarded with the runtime. A start after a stop performs no work
    // either, so the held ownership is unobservable (SYNC-03).
    async stop(): Promise<void> {
      if (stopped) {
        return;
      }

      stopped = true;
      root.abort();
      await closeQuietly(shadow);
    },
  };
}

/**
 * Everything the composition seam builds the runtime from.
 *
 * `constants` is an injected dependency rather than an import inside the seam:
 * production passes the bundled values, and the transport-level harness passes
 * its own so it can point the runtime at a local fake cloud. That is a genuine
 * dependency made explicit, not a hook added for testing, and it is what keeps
 * the harness from needing a production escape hatch.
 *
 * The rotation lead and floor travel the same way. The seam is where the
 * bundled numbers are chosen, so a caller that omits them gets production
 * timing and a caller that states them drives the schedule itself.
 */
export interface AccountRuntimeDeps {
  config: BgConfig;
  constants: ProtocolConstants;
  /**
   * The one family registry this plugin run holds.
   *
   * The composition root passes the same instance the discovery path uses, so a
   * command and the accessory it came from can never resolve two different
   * families for one device.
   */
  registry: FamilyRegistry;
  /** The Homebridge storage directory; the token cache lives there and nowhere else. */
  storagePath: string;
  clock: Clock;
  log: RedactingLogger;
  connect: MqttConnect;
  createSalt: () => string;
  /** How long before a credential expiry the rotation refreshes the cache. Bundled lead when absent. */
  rotationLeadMs?: number;
  /** The floor a rotation delay is held at. Bundled floor when absent. */
  minRotationDelayMs?: number;
  /** Reports every deviceId a trustworthy inventory response named. A no-op when absent. */
  onTrustworthyInventory?: TrustworthyInventoryListener;
  /** Reports a deviceId confirmed absent by DEV-05's removal protocol. A no-op when absent. */
  onDeviceRemoved?: (deviceId: string) => void;
  /** Reports the account-wide monitoring trust on every poll outcome. A no-op when absent. */
  onMonitoringHealth?: (trust: MonitoringTrust) => void;
}

/**
 * Builds one account's runtime and every collaborator it needs.
 *
 * This is the only place the real adapters are wired together. None of these
 * factories opens a connection, reads a file, or starts a timer, so building
 * them costs nothing until the runtime starts.
 */
export function createAccountRuntimeFromConfig(deps: AccountRuntimeDeps): AccountRuntime {
  // The auth client registers one value that must be kept for the life of the
  // process, so it calls this with no role and keeps its own single-argument
  // signature.
  const registerSecret = (secret: string, role?: SecretRole): void => {
    deps.log.registerSecret(secret, role);
  };

  const auth = createAuthClient({
    constants: deps.constants,
    clientId: deps.config.clientId,
    email: deps.config.email,
    password: deps.config.password,
    storagePath: deps.storagePath,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    clock: deps.clock,
    createSalt: deps.createSalt,
    registerSecret,
    log: deps.log,
  });

  return createAccountRuntime({
    api: createCloudApi({ baseUrl: deps.constants.apiUrl, auth, requestTimeoutMs: REQUEST_TIMEOUT_MS }),
    store: createDeviceStateStore({ clock: deps.clock, log: deps.log }),
    registry: deps.registry,
    createShadow: (shadowOptions: ShadowRuntimeOptions) =>
      createShadowClient({
        ...shadowOptions,
        scheme: deps.constants.protocol,
        region: deps.constants.awsRegion,
        createTransport: createMqttTransport,
        connect: deps.connect,
        clock: deps.clock,
        log: deps.log,
      }),
    createRetry: (signal: AbortSignal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: deps.log }),
    pollIntervalMs: deps.config.pollIntervalSeconds * MILLISECONDS_PER_SECOND,
    rotationLeadMs: deps.rotationLeadMs ?? ROTATION_LEAD_MS,
    minRotationDelayMs: deps.minRotationDelayMs ?? MIN_ROTATION_DELAY_MS,
    failures: createFailureLog({ clock: deps.clock, log: deps.log, reminderIntervalMs: FAILURE_REMINDER_MS }),
    registerSecret,
    onTrustworthyInventory: deps.onTrustworthyInventory ?? (() => undefined),
    onDeviceRemoved: deps.onDeviceRemoved ?? (() => undefined),
    onMonitoringHealth: deps.onMonitoringHealth ?? (() => undefined),
    clock: deps.clock,
    log: deps.log,
  });
}
