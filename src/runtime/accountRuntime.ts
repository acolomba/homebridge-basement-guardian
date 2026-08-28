import { CloudRequestError } from '../cloud/errors.js';

import type { Clock } from './clock.js';
import type { CloudApi } from '../cloud/api.js';
import type { DeviceStateStore } from '../device/state.js';
import type { Logging } from 'homebridge';

/** Everything the account runtime needs, by injection. */
export interface AccountRuntimeOptions {
  api: CloudApi;
  store: DeviceStateStore;
  clock: Clock;
  log: Logging;
}

/** One account's cloud work, started and stopped by the Homebridge lifecycle. */
export interface AccountRuntime {
  start(): Promise<void>;
  stop(): Promise<void>;
}

// Failure reporting stays a fixed message plus an HTTP status. An arbitrary
// error's message can name a URL, so it is never repeated into the log until
// the redacting wrapper exists (AUTH-02).
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
  let stopped = false;

  return {
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
