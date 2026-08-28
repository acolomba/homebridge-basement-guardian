/**
 * @fileoverview The per-scenario world.
 *
 * Every scenario gets a fresh world. The world owns the lifetime of each fake it hands out, keeps
 * the scenario clock and the observation log, and tears everything down in reverse order once the
 * scenario ends, so no scenario leaks a listening socket, an open connection, or a temporary
 * directory into the next one.
 *
 * The world reports scenario time through `now()`, which is the shape a production clock port
 * expects, so a later scenario can hand the world itself to the code under test as its clock.
 */

import { After, setWorldConstructor, World } from '@cucumber/cucumber';

import { createFakeAuth0 } from './fakeAuth0.js';
import { createFakeRestApi } from './fakeRestApi.js';

import type { FakeAuth0 } from './fakeAuth0.js';
import type { ApiDevice, FakeRestApi } from './fakeRestApi.js';
import type { IWorldOptions } from '@cucumber/cucumber';

/** The scenario state and the fakes one scenario runs against. */
export class BasementGuardianWorld extends World {
  /** What the scenario observed, in arrival order. */
  readonly observations: string[] = [];

  /** The devices the scenario handed to the fake REST service. */
  devices: readonly ApiDevice[] = [];

  private readonly cleanups: (() => Promise<void>)[] = [];

  private scenarioTime = 0;

  private auth0Tenant: FakeAuth0 | undefined = undefined;

  private restService: FakeRestApi | undefined = undefined;

  private lastResponse: { status: number; body: unknown } | undefined = undefined;

  constructor(readonly options: IWorldOptions) {
    super(options);
  }

  /** The scenario's current time in milliseconds. It moves only when a step moves it. */
  now(): number {
    return this.scenarioTime;
  }

  /** Moves the scenario clock forward. */
  advanceClock(milliseconds: number): void {
    this.scenarioTime += milliseconds;
  }

  /** Registers a teardown step. The world runs registered steps in reverse order. */
  own(cleanup: () => Promise<void>): void {
    this.cleanups.push(cleanup);
  }

  /** The fake Auth0 tenant, started on first use. */
  async auth0(): Promise<FakeAuth0> {
    if (this.auth0Tenant === undefined) {
      const tenant = await createFakeAuth0();
      this.own(() => tenant.close());
      this.auth0Tenant = tenant;
    }

    return this.auth0Tenant;
  }

  /** The fake vendor REST service, started on first use. */
  async restApi(): Promise<FakeRestApi> {
    if (this.restService === undefined) {
      const service = await createFakeRestApi();
      this.own(() => service.close());
      this.restService = service;
    }

    return this.restService;
  }

  /** Records the status and parsed body of a response a step received. */
  recordResponse(status: number, body: unknown): void {
    this.lastResponse = { status, body };
  }

  /** The most recent response a step recorded. */
  response(): { status: number; body: unknown } {
    if (this.lastResponse === undefined) {
      throw new Error('no step has recorded a response yet');
    }

    return this.lastResponse;
  }

  /** Runs every registered teardown step in reverse order. */
  async cleanUp(): Promise<void> {
    const cleanups = this.cleanups.splice(0).reverse();

    for (const cleanup of cleanups) {
      await cleanup();
    }
  }
}

setWorldConstructor(BasementGuardianWorld);

After(async function (this: BasementGuardianWorld) {
  await this.cleanUp();
});
