// SPDX-License-Identifier: MIT
/**
 * @fileoverview The vendor HTTP transport, routed through userland undici end to end.
 *
 * Node's built-in global `fetch()` bundles its own copy of undici, and that copy's `allowH2`
 * default has changed across Node majors: Node 22 and 24 default to HTTP/1.1, Node 26 defaults to
 * HTTP/2. Once undici negotiates HTTP/2, an upstream teardown race in its idle-session handling
 * (the `stream.once('error', noop)` guard it leaves on a released-but-still-open stream fires only
 * once) can let a socket-idle-timeout destroy escape as an uncaught `InformationalError` with no
 * listener left to catch it.
 *
 * Forcing `allowH2: false` removes this plugin from that code path entirely, but only when the
 * `Agent` enforcing it comes from the SAME undici copy as the `fetch()` dispatching through it:
 * passing a userland `Agent` as `dispatcher` to Node's BUILT-IN `fetch()` throws on Node 22 and 24,
 * because the built-in fetch's dispatch handler is shaped for ITS OWN bundled undici major, and a
 * userland Agent from a different major validates for a different handler shape. Routing through
 * this module's own `fetch` keeps the handler and the `Agent` paired from one undici copy, so the
 * vendor never negotiates HTTP/2 on any Node major, present or future.
 */
import { Agent, fetch as undiciFetch } from 'undici';

/** Fetches one HTTP request. Injected, so a test can default it to the platform's global fetch. */
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
