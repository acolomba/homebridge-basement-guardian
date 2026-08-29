import { PROTOCOL } from './protocol.js';

import type { PlatformConfig } from 'homebridge';

/** Name shown in the Homebridge log when the configuration omits one. */
const DEFAULT_NAME = 'Basement Guardian';

// The practical RFC-5322 shape the settings form already enforces through
// `format: "email"`. A hand-edited config.json bypasses the form, so the
// runtime checks the same shape again.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An integer field, its inclusive bounds, and the value an absent field takes. */
interface IntegerBounds {
  field: string;
  unit: string;
  minimum: number;
  maximum: number;
  documentedDefault: number;
}

const POLL_INTERVAL_BOUNDS: IntegerBounds = { field: 'pollInterval', unit: 'seconds', minimum: 300, maximum: 3600, documentedDefault: 900 };

const POLL_COUNT_BOUNDS: IntegerBounds = {
  field: 'offlineConfirmationPollCount',
  unit: 'polls',
  minimum: 1,
  maximum: 8,
  documentedDefault: 2,
};

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

function isConfiguredText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// A refusal quotes the value it rejected, so an object has to be stringified;
// String({}) reports nothing the administrator can act on. The value arrives
// from config.json, so it is acyclic.
function describeValue(value: unknown): string {
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
}

// Returns the reason to refuse this field, or undefined when it is acceptable.
// An absent field is acceptable and takes its documented default later; a
// supplied value is never clamped and never replaced by that default (D-16).
function integerRefusal(value: unknown, bounds: IntegerBounds): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < bounds.minimum || value > bounds.maximum) {
    const range = `from ${String(bounds.minimum)} to ${String(bounds.maximum)}`;

    return `${bounds.field} must be a whole number of ${bounds.unit} ${range}, but it is ${describeValue(value)}.`;
  }

  return undefined;
}

// Only an acceptable value reaches here, so anything that is not a number is
// an absent field taking its documented default.
function resolveInteger(value: unknown, bounds: IntegerBounds): number {
  return typeof value === 'number' ? value : bounds.documentedDefault;
}

// Checks the fields in one fixed order and returns on the first failure, so a
// configuration with several problems always produces the same message.
function firstRefusal(fields: Record<string, unknown>): string | undefined {
  const { name, email, password, clientId } = fields;

  if (name !== undefined && !isConfiguredText(name)) {
    return 'the platform name must not be empty when it is set.';
  }

  if (!isConfiguredText(email)) {
    return 'the account email is missing.';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return `the account email must be an email address, but it is ${email}.`;
  }

  if (!isConfiguredText(password)) {
    return 'the account password is missing.';
  }

  if (clientId !== undefined && !isConfiguredText(clientId)) {
    return 'clientId must not be empty when it is set.';
  }

  return integerRefusal(fields.pollInterval, POLL_INTERVAL_BOUNDS) ?? integerRefusal(fields.offlineConfirmationPollCount, POLL_COUNT_BOUNDS);
}

/**
 * Validates one account configuration block and resolves its defaults.
 *
 * The plugin refuses to start on a structurally invalid or out-of-range
 * configuration rather than clamping or substituting a default for a supplied
 * value (D-16). An absent optional field still takes its documented default,
 * while an explicit `null` is a supplied value and is refused.
 */
export function validateConfig(raw: PlatformConfig): ConfigResult {
  // PlatformConfig indexes as `any`, so read the fields as unknown and narrow.
  const fields: Record<string, unknown> = raw;
  const reason = firstRefusal(fields);

  if (reason !== undefined) {
    return { ok: false, reason };
  }

  const { name, email, password, clientId } = fields;

  // The refusal check above already proved the email and the password are
  // non-empty strings; String() restores that type without a second branch.
  return {
    ok: true,
    config: {
      name: isConfiguredText(name) ? name : DEFAULT_NAME,
      email: String(email),
      password: String(password),
      clientId: isConfiguredText(clientId) ? clientId : PROTOCOL.clientId,
      pollIntervalSeconds: resolveInteger(fields.pollInterval, POLL_INTERVAL_BOUNDS),
      offlineConfirmationPollCount: resolveInteger(fields.offlineConfirmationPollCount, POLL_COUNT_BOUNDS),
    },
  };
}
