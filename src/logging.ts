// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Redacts secrets from Homebridge log messages and parameters.
 */

import type { LogLevel, Logging } from 'homebridge';

/** Stands in for every value the wrapper substitutes. */
const REDACTED = '[redacted]';

/** Stands in for a parameter the wrapper cannot serialize. */
const UNSERIALIZABLE = '[unserializable object]';

// Credential material the plugin never holds as a registered string. Each
// pattern keeps the credential name. An unquoted authentication value has no
// reliable comma boundary, so its pattern redacts the remaining unquoted text,
// including possible later fields, to avoid exposing a password suffix.
const AWS_SESSION_CREDENTIAL_FIELDS = 'AccessKeyId|SecretAccessKey|SessionToken';
const PRESIGNED_URL_PARAMETERS = 'X-Amz-Credential|X-Amz-Security-Token|X-Amz-Signature';
const AUTHENTICATION_BODY_FIELDS = 'password|username';

// A token carries dots, so the class holds one, but the match may not end on a
// dot: a token at the end of a sentence would otherwise swallow the full stop.
const AUTHORIZATION_PATTERN = /(Bearer\s+)[\w+/=~-](?:[\w.+/=~-]*[\w+/=~-])?/gi;
const AWS_SESSION_CREDENTIAL_PATTERN = new RegExp(String.raw`("?(?:${AWS_SESSION_CREDENTIAL_FIELDS})"?\s*[:=]\s*"?)[^",\s}]+`, 'g');
const PRESIGNED_URL_PATTERN = new RegExp(String.raw`((?:${PRESIGNED_URL_PARAMETERS})=)[^&\s"]+`, 'g');
const AUTHENTICATION_QUOTED_BODY_PATTERN = new RegExp(String.raw`("?(?:${AUTHENTICATION_BODY_FIELDS})"?\s*[:=]\s*")(?:\\.|[^"\\])+`, 'gi');
const AUTHENTICATION_BODY_PATTERN = new RegExp(String.raw`("?(?:${AUTHENTICATION_BODY_FIELDS})"?\s*[:=]\s*)([^"\s][\s\S]*)`, 'gi');

const CREDENTIAL_PATTERNS: readonly RegExp[] = [
  AUTHORIZATION_PATTERN,
  AWS_SESSION_CREDENTIAL_PATTERN,
  PRESIGNED_URL_PATTERN,
  AUTHENTICATION_QUOTED_BODY_PATTERN,
  AUTHENTICATION_BODY_PATTERN,
];

/** The delegate to write through, and the secret values known at build time. */
export interface RedactingLoggerOptions {
  delegate: Logging;
  secrets: readonly string[];
}

/**
 * Which rotated credential a registered value is.
 *
 * The vendor issues a fresh set of these about every hour, over a run that
 * lasts months. A value registered under its role replaces the value that role
 * held before, so the superseded one is neither scanned for nor retained
 * (AUTH-02).
 */
export type SecretRole = 'aws-access-key-id' | 'aws-secret-access-key' | 'aws-session-token';

/**
 * A `Logging` that also accepts secrets discovered after it was built.
 *
 * A value registered with no role is kept for the life of the logger, which is
 * what the account password and the cached bearer token need.
 */
export interface RedactingLogger extends Logging {
  registerSecret(secret: string, role?: SecretRole): void;
}

/** The five members that carry their level in their own name. */
type LevelledMember = 'debug' | 'error' | 'info' | 'success' | 'warn';

function redactText(text: string, secrets: readonly string[]): string {
  const spans: { start: number; end: number }[] = [];

  for (const pattern of CREDENTIAL_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Every credential pattern captures group 1.
      const prefix = match[1]!;
      spans.push({ start: match.index + prefix.length, end: match.index + match[0].length });
    }
  }

  for (const secret of secrets) {
    let start = text.indexOf(secret);

    while (start !== -1) {
      spans.push({ start, end: start + secret.length });
      start = text.indexOf(secret, start + 1);
    }
  }

  spans.sort((left, right) => left.start - right.start || right.end - left.end);

  let redacted = '';
  let end = 0;

  for (const span of spans) {
    if (span.end <= end) {
      continue;
    }

    if (span.start >= end) {
      redacted += text.slice(end, span.start) + REDACTED;
    }

    end = span.end;
  }

  return redacted + text.slice(end);
}

// An object can carry a secret in any field and its graph can be circular, so
// it is described defensively rather than walked. The fallback reads nothing
// off the value: an object made with no prototype has no constructor to name,
// and that read would raise out of the logger, which the plugin calls from
// inside catch blocks and message handlers (WR-10).
function describeObject(value: object): string {
  try {
    const description: unknown = JSON.stringify(value);

    return typeof description === 'string' ? description : UNSERIALIZABLE;
  } catch {
    return UNSERIALIZABLE;
  }
}

// An error's own message can quote a response body, so the error becomes a
// redacted description rather than reaching the delegate as an object.
function redactParameter(parameter: unknown, secrets: readonly string[]): unknown {
  if (typeof parameter === 'string') {
    return redactText(parameter, secrets);
  }

  if (parameter instanceof Error) {
    return `${parameter.constructor.name}: ${redactText(parameter.message, secrets)}`;
  }

  if (typeof parameter === 'object' && parameter !== null) {
    const escapedSecrets = secrets.map((secret) => JSON.stringify(secret).slice(1, -1));

    return redactText(describeObject(parameter), [...secrets, ...escapedSecrets]);
  }

  return parameter;
}

function redactParameters(parameters: unknown[], secrets: readonly string[]): unknown[] {
  return parameters.map((parameter) => redactParameter(parameter, secrets));
}

// The member is named rather than passed as a function so the delegate keeps
// its own `this`, which a Homebridge logger may rely on.
function wrapMember(delegate: Logging, member: LevelledMember, secrets: readonly string[]): Logging[LevelledMember] {
  return (message: string, ...parameters: unknown[]): void => {
    delegate[member](redactText(message, secrets), ...redactParameters(parameters, secrets));
  };
}

/**
 * Wraps a Homebridge logger so no secret can reach it.
 *
 * `Logging` is a callable interface with seven members, so the wrapper is a
 * function carrying those members rather than a class. Every one of the seven
 * paths redacts, including the bare callable form and `log(level, ...)`
 * (D-18, AUTH-02).
 *
 * Redaction works two ways: exact substitution of every registered secret, and
 * pattern substitution for credential material the plugin never holds as a
 * registered string.
 *
 * The registered list stays bounded over a long-running bridge: a rotated value
 * replaces the one its role held, so the per-line scan cost and the retained
 * credential material both stay flat instead of growing with uptime.
 */
export function createRedactingLogger(options: RedactingLoggerOptions): RedactingLogger {
  const secrets: string[] = [];
  const roleIndexes = new Map<SecretRole, number>();

  // A value with no role is kept for the life of the logger; a value with one
  // takes the place its role already holds, so a rotation supersedes its
  // predecessor rather than joining it. Nothing is evicted by age or by count:
  // guessing which held value has expired is how a password stops being
  // redacted.
  function registerSecret(secret: string, role?: SecretRole): void {
    // An empty or whitespace-only value would match everywhere, so it is not a
    // secret this wrapper can act on.
    if (secret.trim().length === 0) {
      return;
    }

    if (role === undefined) {
      secrets.push(secret);

      return;
    }

    const held = roleIndexes.get(role);

    if (held === undefined) {
      roleIndexes.set(role, secrets.length);
      secrets.push(secret);
    } else {
      secrets[held] = secret;
    }
  }

  for (const secret of options.secrets) {
    registerSecret(secret);
  }

  function write(message: string, ...parameters: unknown[]): void {
    options.delegate(redactText(message, secrets), ...redactParameters(parameters, secrets));
  }

  return Object.assign(write, {
    prefix: options.delegate.prefix,
    registerSecret,
    debug: wrapMember(options.delegate, 'debug', secrets),
    error: wrapMember(options.delegate, 'error', secrets),
    info: wrapMember(options.delegate, 'info', secrets),
    success: wrapMember(options.delegate, 'success', secrets),
    warn: wrapMember(options.delegate, 'warn', secrets),
    log: (level: LogLevel, message: string, ...parameters: unknown[]): void => {
      options.delegate.log(level, redactText(message, secrets), ...redactParameters(parameters, secrets));
    },
  });
}
