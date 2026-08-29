import timers from 'node:timers/promises';

import { createCloudApi } from '../cloud/api.js';
import { createAuthClient } from '../cloud/auth.js';
import { AuthHaltedError, AuthRejectedError, AuthThrottledError, CloudRequestError } from '../cloud/errors.js';
import { createMqttTransport } from '../cloud/mqttTransport.js';
import { createShadowClient } from '../cloud/shadow.js';
import { createDeviceStateStore } from '../device/state.js';

import { createFailureLog, FAILURE_REMINDER_MS } from './failureLog.js';
import { createRetryPolicy, MAX_BACKOFF_MS } from './retryPolicy.js';

import type { Clock } from './clock.js';
import type { FailureLog } from './failureLog.js';
import type { RetryPolicy } from './retryPolicy.js';
import type { CloudApi } from '../cloud/api.js';
import type { MqttConnect } from '../cloud/mqttTransport.js';
import type { CredentialCache, ShadowClient, ShadowCredentials, ShadowDisconnectReason } from '../cloud/shadow.js';
import type { ApiDevice, AwsCredentialsResponse } from '../cloud/types.js';
import type { BgConfig } from '../config.js';
import type { DeviceStateStore, ReportedPatch } from '../device/state.js';
import type { RedactingLogger } from '../logging.js';
import type { ProtocolConstants } from '../protocol.js';
import type { Logging } from 'homebridge';

/** Deadline applied to each vendor request. */
const REQUEST_TIMEOUT_MS = 10_000;

const MILLISECONDS_PER_SECOND = 1_000;

/** How long before a credential expiry the rotation refreshes the cache. */
export const ROTATION_LEAD_MS = 600_000;

/** The floor a rotation delay is held at, so a response already inside the lead window still waits. */
export const MIN_ROTATION_DELAY_MS = 30_000;

/**
 * Which sources are feeding canonical state.
 *
 * A degraded monitoring path is not a device condition: it says the plugin is
 * seeing less, never that a device reported itself disconnected.
 */
export type MonitoringPath = 'rest-and-shadow' | 'rest-only';

// What one failing activity is called. The name reads as the subject of the
// recovery sentence the failure log writes, and each one carries its own
// warning cadence.
const POLLING = 'Device polling';
const ROTATION = 'Credential rotation';
const SHADOW = 'The shadow connection';
const AUTHENTICATION = 'Authentication';

const ROTATION_FAILED = 'The temporary shadow credentials could not be refreshed; the plugin will try again.';
const SHADOW_DEGRADED = 'The shadow connection is unavailable, so device state is coming from polling alone until it returns.';
const THROTTLED = 'Authentication is being throttled, so the plugin is waiting before it tries again.';

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

/** Everything the account runtime needs, by injection. */
export interface AccountRuntimeOptions {
  api: CloudApi;
  store: DeviceStateStore;
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
  failures: FailureLog;
  /** Registers credential material with the redacting logger as it arrives (AUTH-02). */
  registerSecret: (secret: string) => void;
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
  start(): Promise<void>;
  stop(): Promise<void>;
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
function rotationDelayMs(expiration: string, now: number): number {
  const expiresAt = Date.parse(expiration);

  if (!Number.isFinite(expiresAt)) {
    return MIN_ROTATION_DELAY_MS;
  }

  return Math.max(MIN_ROTATION_DELAY_MS, expiresAt - now - ROTATION_LEAD_MS);
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
  let credentials: MutableCredentialCache | undefined;
  let shadow: ShadowClient | undefined;
  let path: MonitoringPath = 'rest-only';
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

  function applyDevices(devices: readonly ApiDevice[]): void {
    for (const device of devices) {
      options.store.applyDiscovery(device);
    }
  }

  function handleShadowConnected(): void {
    path = 'rest-and-shadow';
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
    path = 'rest-only';

    if (reason !== 'transport-closed') {
      options.failures.recordFailure(SHADOW, SHADOW_DEGRADED);
    }
  }

  // Opens the connection once there is both a credential cache to sign from and
  // a device to subscribe for, and reports whether it was refused so the caller
  // can decide whether a retry chain needs starting.
  async function attemptShadow(): Promise<boolean> {
    const cache = credentials;
    const deviceIds = options.store.deviceIds();

    if (stopped || shadow !== undefined || cache === undefined || deviceIds.length === 0) {
      return false;
    }

    try {
      const client = options.createShadow({
        credentials: cache,
        retry: shadowRetry,
        onReportedPatch: (deviceId: string, patch: ReportedPatch) => {
          options.store.applyReportedPatch(deviceId, patch);
        },
        onConnected: handleShadowConnected,
        onDisconnected: handleShadowDisconnected,
      });
      await client.start(deviceIds);
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
      // arrives, so each is registered before anything can quote it (AUTH-02).
      options.registerSecret(response.credentials.AccessKeyId);
      options.registerSecret(response.credentials.SecretAccessKey);
      options.registerSecret(response.credentials.SessionToken);

      const cache = credentials;

      if (cache === undefined) {
        credentials = createCredentialCache(toShadowCredentials(response));
        await openShadow();
      } else {
        cache.replace(toShadowCredentials(response));
      }

      options.failures.recordSuccess(ROTATION);

      return rotationDelayMs(response.credentials.Expiration, options.clock.now());
    } catch {
      if (!root.signal.aborted) {
        options.failures.recordFailure(ROTATION, ROTATION_FAILED);
      }

      return MIN_ROTATION_DELAY_MS;
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
      applyDevices(await options.api.devices(root.signal));
      options.failures.recordSuccess(POLLING);
      await openShadow();
    } catch (error: unknown) {
      if (root.signal.aborted) {
        return;
      }

      // A failed request changes no stored snapshot and marks nothing
      // disconnected: a monitoring-path failure and a device-reported
      // disconnection are separate conditions (D-014).
      options.failures.recordFailure(POLLING, describeFailure(error));
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
    if (root.signal.aborted || error instanceof AuthRejectedError || error instanceof AuthHaltedError) {
      return undefined;
    }

    if (error instanceof AuthThrottledError) {
      options.failures.recordFailure(AUTHENTICATION, THROTTLED);

      return error.retryAfterMs;
    }

    options.failures.recordFailure(POLLING, describeFailure(error));
    startBackgroundWork();

    return undefined;
  }

  async function launch(): Promise<number | undefined> {
    try {
      const devices = await options.api.devices(root.signal);
      applyDevices(devices);
      options.failures.recordSuccess(POLLING);
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

  return {
    get monitoringPath(): MonitoringPath {
      return path;
    },

    store: options.store,

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
    async stop(): Promise<void> {
      if (stopped) {
        return;
      }

      stopped = true;
      root.abort();

      try {
        await shadow?.close();
      } catch {
        // A connection that fails while it is being closed has still stopped
        // being used, and an escaping rejection during shutdown would surface
        // as an unhandled exception in the Homebridge process (D-20).
      }
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
 */
export interface AccountRuntimeDeps {
  config: BgConfig;
  constants: ProtocolConstants;
  /** The Homebridge storage directory; the token cache lives there and nowhere else. */
  storagePath: string;
  clock: Clock;
  log: RedactingLogger;
  connect: MqttConnect;
  createSalt: () => string;
}

/**
 * Builds one account's runtime and every collaborator it needs.
 *
 * This is the only place the real adapters are wired together. None of these
 * factories opens a connection, reads a file, or starts a timer, so building
 * them costs nothing until the runtime starts.
 */
export function createAccountRuntimeFromConfig(deps: AccountRuntimeDeps): AccountRuntime {
  const registerSecret = (secret: string): void => {
    deps.log.registerSecret(secret);
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
    failures: createFailureLog({ clock: deps.clock, log: deps.log, reminderIntervalMs: FAILURE_REMINDER_MS }),
    registerSecret,
    clock: deps.clock,
    log: deps.log,
  });
}
