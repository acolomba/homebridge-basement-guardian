// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Checks the shadow lifecycle consumed by the account runtime.
 *
 * Readiness is distinct from start resolution. The account participant models
 * that distinction without implementing subscriptions or shadow requests.
 * Protocol errors, replacement connections and transport teardown remain in
 * the real shadow owner. This contract establishes no network equivalence.
 * Missing values, aliasing, overwrite, deletion and validation do not apply to
 * this lifecycle-only boundary; close ends the participant's ownership.
 */

import assert from 'node:assert/strict';

import type { ShadowClient } from '../../src/cloud/shadow.js';

interface AccountShadowParticipantDescription {
  ownerPath: string;
  factoryName: string;
}

/** Lists the real and ACCOUNT participants checked by their owning modules. */
export const ACCOUNT_SHADOW_PARTICIPANTS = {
  real: { ownerPath: 'test/cloud/shadow.test.ts', factoryName: 'createShadowClient' },
  account: { ownerPath: 'test/runtime/accountRuntime.test.ts', factoryName: 'fakeShadow' },
} satisfies Record<'real' | 'account', AccountShadowParticipantDescription>;

/** Names the consumed lifecycle scenarios, each requiring a fresh client. */
export const ACCOUNT_SHADOW_CASES = [
  { name: 'becomes ready after start resolves', connectedCalls: 1 },
  { name: 'ignores readiness completed after close', connectedCalls: 0 },
  { name: 'stays closed when started after close', connectedCalls: 0 },
] as const;

/** Supplies public lifecycle operations and the owner's readiness boundary. */
export interface AccountShadowParticipant {
  client: ShadowClient;
  notifications: readonly string[];
  beginReadiness(): void;
  finishReadiness(): Promise<void>;
  opened(): number;
  closed(): number;
}

/** Captures the complete consumed state and owned operations at one checkpoint. */
export interface AccountShadowObservation {
  stage: string;
  connected: boolean;
  notifications: readonly string[];
  opened: number;
  closed: number;
}

function capture(participant: AccountShadowParticipant, stage: string): AccountShadowObservation {
  return {
    stage,
    connected: participant.client.connected,
    notifications: [...participant.notifications],
    opened: participant.opened(),
    closed: participant.closed(),
  };
}

/** Exercises lifecycle transitions and captures state before pure assertions. */
export async function exerciseAccountShadowContract(
  participant: AccountShadowParticipant,
  contractCase: (typeof ACCOUNT_SHADOW_CASES)[number]['name'],
): Promise<AccountShadowObservation[]> {
  const observations = [capture(participant, 'constructed')];

  if (contractCase === 'stays closed when started after close') {
    await participant.client.close();
    observations.push(capture(participant, 'closed before start'));
    await participant.client.start(['placeholder-device']);
    participant.beginReadiness();
    await participant.finishReadiness();
    observations.push(capture(participant, 'start after close'));
    await participant.client.close();
    observations.push(capture(participant, 'closed again'));

    return observations;
  }

  await participant.client.start(['placeholder-device']);
  observations.push(capture(participant, 'start resolved'));
  participant.beginReadiness();
  observations.push(capture(participant, 'readiness pending'));

  if (contractCase === 'becomes ready after start resolves') {
    await participant.finishReadiness();
    observations.push(capture(participant, 'ready'));
  }

  await participant.client.close();
  observations.push(capture(participant, 'closed'));
  await participant.client.close();
  await participant.finishReadiness();
  observations.push(capture(participant, 'late completion after repeated close'));

  return observations;
}

/** Checks whole observations against independent literal lifecycle expectations. */
export function assertAccountShadowContract(
  observations: readonly AccountShadowObservation[],
  contractCase: (typeof ACCOUNT_SHADOW_CASES)[number]['name'],
): void {
  if (contractCase === 'stays closed when started after close') {
    assert.deepStrictEqual(observations, [
      { stage: 'constructed', connected: false, notifications: [], opened: 0, closed: 0 },
      { stage: 'closed before start', connected: false, notifications: [], opened: 0, closed: 0 },
      { stage: 'start after close', connected: false, notifications: [], opened: 0, closed: 0 },
      { stage: 'closed again', connected: false, notifications: [], opened: 0, closed: 0 },
    ]);
    return;
  }

  if (contractCase === 'becomes ready after start resolves') {
    assert.deepStrictEqual(observations, [
      { stage: 'constructed', connected: false, notifications: [], opened: 0, closed: 0 },
      { stage: 'start resolved', connected: false, notifications: [], opened: 1, closed: 0 },
      { stage: 'readiness pending', connected: false, notifications: [], opened: 1, closed: 0 },
      { stage: 'ready', connected: true, notifications: ['connected'], opened: 1, closed: 0 },
      { stage: 'closed', connected: false, notifications: ['connected'], opened: 1, closed: 1 },
      { stage: 'late completion after repeated close', connected: false, notifications: ['connected'], opened: 1, closed: 1 },
    ]);
    return;
  }

  assert.deepStrictEqual(observations, [
    { stage: 'constructed', connected: false, notifications: [], opened: 0, closed: 0 },
    { stage: 'start resolved', connected: false, notifications: [], opened: 1, closed: 0 },
    { stage: 'readiness pending', connected: false, notifications: [], opened: 1, closed: 0 },
    { stage: 'closed', connected: false, notifications: [], opened: 1, closed: 1 },
    { stage: 'late completion after repeated close', connected: false, notifications: [], opened: 1, closed: 1 },
  ]);
}
