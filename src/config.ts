import { PROTOCOL } from './protocol.js';

import type { PlatformConfig } from 'homebridge';

/** Name shown in the Homebridge log when the configuration omits one. */
const DEFAULT_NAME = 'Basement Guardian';

/** Backstop REST poll interval, in seconds, when the configuration omits one. */
const DEFAULT_POLL_INTERVAL_SECONDS = 900;

/** Consecutive disconnected snapshots that confirm the offline condition. */
const DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT = 2;

/** The account settings the runtime works from, with every default resolved. */
export interface BgConfig {
  name: string;
  email: string;
  password: string;
  clientId: string;
  pollIntervalSeconds: number;
  offlineConfirmationPollCount: number;
}

/** A configuration the plugin will not start from, with the reason to log. */
export interface ConfigRefused {
  ok: false;
  reason: string;
}

/** A configuration the plugin will start from. */
export interface ConfigAccepted {
  ok: true;
  config: BgConfig;
}

/** The verdict on one account configuration block. */
export type ConfigResult = ConfigRefused | ConfigAccepted;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

// Returns the supplied number, the documented default when the field is absent,
// or undefined when the supplied value is not a number. An out-of-range value is
// still accepted here; refusing on range is a separate concern.
function resolveNumber(value: unknown, documentedDefault: number): number | undefined {
  if (value === undefined) {
    return documentedDefault;
  }

  return typeof value === 'number' ? value : undefined;
}

/**
 * Validates one account configuration block and resolves its defaults.
 *
 * The plugin refuses to start on a structurally invalid configuration rather
 * than clamping or substituting a default for a supplied value (D-16). An
 * absent optional field still takes its documented default.
 */
export function validateConfig(raw: PlatformConfig): ConfigResult {
  // PlatformConfig indexes as `any`, so read the fields as unknown and narrow.
  const { name, email, password, clientId, pollInterval, offlineConfirmationPollCount }: Record<string, unknown> = raw;

  if (!isNonEmptyString(email)) {
    return { ok: false, reason: 'the account email is missing.' };
  }

  if (!isNonEmptyString(password)) {
    return { ok: false, reason: 'the account password is missing.' };
  }

  const pollIntervalSeconds = resolveNumber(pollInterval, DEFAULT_POLL_INTERVAL_SECONDS);

  if (pollIntervalSeconds === undefined) {
    return { ok: false, reason: `pollInterval must be a number of seconds, but it is ${String(pollInterval)}.` };
  }

  const pollCount = resolveNumber(offlineConfirmationPollCount, DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT);

  if (pollCount === undefined) {
    return { ok: false, reason: `offlineConfirmationPollCount must be a number of polls, but it is ${String(offlineConfirmationPollCount)}.` };
  }

  return {
    ok: true,
    config: {
      name: isNonEmptyString(name) ? name : DEFAULT_NAME,
      email,
      password,
      clientId: isNonEmptyString(clientId) ? clientId : PROTOCOL.clientId,
      pollIntervalSeconds,
      offlineConfirmationPollCount: pollCount,
    },
  };
}
