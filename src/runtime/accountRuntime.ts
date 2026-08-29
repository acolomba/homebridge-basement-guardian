import { CloudRequestError } from '../cloud/errors.js';

import type { Clock } from './clock.js';
import type { FailureLog } from './failureLog.js';
import type { RetryPolicy } from './retryPolicy.js';
import type { CloudApi } from '../cloud/api.js';
import type { CredentialCache, ShadowClient } from '../cloud/shadow.js';
import type { DeviceStateStore, ReportedPatch } from '../device/state.js';
import type { Logging } from 'homebridge';

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
  onDisconnected: (reason: string) => void;
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
   * guard covers the whole policy: one instance would let the shadow client's
   * reconnect swallow the runtime's own retry, or the reverse (SYNC-04).
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
  start(): Promise<void>;
  stop(): Promise<void>;
}

// Failure reporting stays a fixed message plus an HTTP status. An arbitrary
// error's message can name a URL, so it is never repeated into the log.
function describeFailure(error: unknown): string {
  if (error instanceof CloudRequestError) {
    return `Device discovery failed on ${error.route} with HTTP ${String(error.status)}.`;
  }

  return 'Device discovery failed.';
}

async function discover(options: AccountRuntimeOptions, signal: AbortSignal): Promise<void> {
  try {
    const devices = await options.api.devices(signal);

    for (const device of devices) {
      options.store.applyDiscovery(device);
    }

    options.log.info(`Discovered ${String(devices.length)} device(s).`);
  } catch (error: unknown) {
    options.log.error(describeFailure(error));
  }
}

/**
 * Creates the account runtime.
 *
 * One root `AbortController` owns every in-flight request, so a shutdown during
 * discovery cancels the request instead of leaving it pending or raising an
 * unhandled rejection. Creating the runtime opens no connection, reads no file,
 * and starts no timer; only `start` does any work.
 */
export function createAccountRuntime(options: AccountRuntimeOptions): AccountRuntime {
  const root = new AbortController();
  const path: MonitoringPath = 'rest-only';
  let stopped = false;

  return {
    get monitoringPath(): MonitoringPath {
      return path;
    },

    async start(): Promise<void> {
      if (stopped) {
        return;
      }

      await discover(options, root.signal);
    },

    stop(): Promise<void> {
      if (!stopped) {
        stopped = true;
        root.abort();
      }

      return Promise.resolve();
    },
  };
}
