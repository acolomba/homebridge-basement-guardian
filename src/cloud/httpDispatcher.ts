// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Sends vendor HTTP requests through paired userland undici fetch and Agent.
 * The shared Agent enforces HTTP/1.1 for every request.
 */

import { Agent, fetch as undiciFetch } from 'undici';

/** Fetches one HTTP request. Tests explicitly inject an offline implementation. */
export type HttpFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;

// One shared Agent for every vendor request: undici pools connections per Agent, so a fresh Agent
// per call would defeat that pooling. Forcing allowH2 here is the entire fix; every request that
// carries an AbortSignal deadline still applies it unchanged since that stays on the request init.
const agent = new Agent({ allowH2: false });

/**
 * The vendor HTTP transport: userland undici's own `fetch`, forced to negotiate HTTP/1.1 only.
 *
 * `undiciFetch` returns undici's own `Response`, a structurally equivalent but nominally distinct
 * class from the DOM lib `Response` this plugin's call sites already read (`.ok`, `.status`,
 * `.json()`, `.body`); the double assertion reflects that the runtime shape matches even though the
 * two type declarations do not admit it directly.
 */
export const httpFetch: HttpFetch = (input, init) =>
  undiciFetch(input, { ...init, dispatcher: agent } as Parameters<typeof undiciFetch>[1]) as unknown as Promise<Response>;
