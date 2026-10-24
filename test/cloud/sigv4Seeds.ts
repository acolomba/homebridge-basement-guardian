// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Supplies fresh synthetic AWS IoT signing inputs.
 */

import type { PresignInput } from '../../src/cloud/sigv4.js';

const HOST = 'broker.example';
const REGION = 'us-test-1';
const ACCESS_KEY_ID = 'test-access-key-id';
const SECRET_ACCESS_KEY = 'test-secret-access-key';
const SESSION_TOKEN = 'test/session+token==';
const SIGNED_AT = '2026-08-28T12:00:00.000Z';

/** Creates signing inputs with synthetic credentials and a fresh fixed-time Date. */
export function baseInput(): PresignInput {
  return {
    scheme: 'wss',
    host: HOST,
    region: REGION,
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    sessionToken: SESSION_TOKEN,
    now: new Date(SIGNED_AT),
  };
}
