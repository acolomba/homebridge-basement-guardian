/**
 * @fileoverview Loopback stand-in for the vendor Auth0 tenant.
 *
 * The tenant answers the password-realm grant, records every grant it received, and can be armed
 * to answer the next request with a failure. A scenario asserts what the plugin sent rather than
 * how it sent it, so this fake survives a change of HTTP client.
 */

import { readBody, respondJson, startLoopbackServer } from './loopbackServer.js';

import type { IncomingMessage, ServerResponse } from 'node:http';

const TOKEN_PATH = '/oauth/token';

/** The identity token the tenant issues unless a scenario replaces it. */
export const DEFAULT_ID_TOKEN = 'fake-id-token';

// The tenant reports the observed 30-day identity-token lifetime unless a scenario shortens it.
const DEFAULT_EXPIRES_IN_SECONDS = 2592000;

/** One password-realm grant, in the shape the tenant received it. */
export interface FakeAuth0TokenRequest {
  grantType: string;
  realm: string;
  clientId: string;
  username: string;
  password: string;
  scope: string;
}

/** A loopback Auth0 tenant that a scenario can arm and then inspect. */
export interface FakeAuth0 {
  readonly origin: string;
  readonly requests: readonly FakeAuth0TokenRequest[];

  /** Sets the identity token and lifetime the tenant answers with from now on. */
  issueToken(idToken: string, expiresInSeconds: number): void;

  /** Arms the next token response to carry this status and this error code. */
  failWith(status: number, error: string): void;

  /** Stops the tenant and resolves once every open connection is destroyed. */
  close(): Promise<void>;
}

interface IssuedToken {
  idToken: string;
  expiresInSeconds: number;
}

interface ArmedFailure {
  status: number;
  error: string;
}

interface TenantState {
  readonly requests: FakeAuth0TokenRequest[];
  issued: IssuedToken;
  armedFailure: ArmedFailure | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  return typeof value === 'string' ? value : '';
}

function toTokenRequest(body: Record<string, unknown>): FakeAuth0TokenRequest {
  return {
    grantType: readString(body, 'grant_type'),
    realm: readString(body, 'realm'),
    clientId: readString(body, 'client_id'),
    username: readString(body, 'username'),
    password: readString(body, 'password'),
    scope: readString(body, 'scope'),
  };
}

async function readGrant(request: IncomingMessage): Promise<FakeAuth0TokenRequest> {
  const body = await readBody(request);
  const parsed: unknown = body === '' ? {} : JSON.parse(body);

  return toTokenRequest(isRecord(parsed) ? parsed : {});
}

async function route(state: TenantState, request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== 'POST' || request.url !== TOKEN_PATH) {
    respondJson(response, 404, { error: 'unknown_route' });

    return;
  }

  state.requests.push(await readGrant(request));
  const failure = state.armedFailure;
  state.armedFailure = undefined;

  if (failure !== undefined) {
    respondJson(response, failure.status, { error: failure.error, error_description: 'the scenario armed this failure' });

    return;
  }

  respondJson(response, 200, { id_token: state.issued.idToken, expires_in: state.issued.expiresInSeconds, token_type: 'Bearer' });
}

/**
 * Starts a fake Auth0 tenant on an ephemeral loopback port.
 *
 * The promise resolves only once the port is known, so a caller can read `origin` immediately.
 */
export async function createFakeAuth0(): Promise<FakeAuth0> {
  const state: TenantState = {
    requests: [],
    issued: { idToken: DEFAULT_ID_TOKEN, expiresInSeconds: DEFAULT_EXPIRES_IN_SECONDS },
    armedFailure: undefined,
  };

  const server = await startLoopbackServer((request, response) => route(state, request, response));

  return {
    origin: server.baseUrl,
    requests: state.requests,
    issueToken(idToken: string, expiresInSeconds: number): void {
      state.issued = { idToken, expiresInSeconds };
    },
    failWith(status: number, error: string): void {
      state.armedFailure = { status, error };
    },
    close(): Promise<void> {
      return server.close();
    },
  };
}
