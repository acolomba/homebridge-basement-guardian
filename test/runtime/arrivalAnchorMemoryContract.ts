// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Checks consumed arrival-anchor memory and persistence state.
 *
 * Numeric anchors have no mutable aliases. The get/record boundary has no
 * enumeration or deletion operation. Durable bytes and JSON validation belong
 * to the real store's restore/persist owner cases. The separate account contract
 * checks deletion and successful persistence state. Disk bytes, malformed JSON,
 * write ownership and persistence failures remain real-store owner concerns.
 */

import assert from 'node:assert/strict';

import type { ArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';

interface ArrivalAnchorMemoryParticipant {
  ownerPath: string;
  factoryName: string;
}

/** Lists the real and stateful memory participants and their owning modules. */
export const ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS = {
  real: { ownerPath: 'test/runtime/arrivalAnchors.test.ts', factoryName: 'createArrivalAnchors' },
  monitoring: { ownerPath: 'test/runtime/monitoringHealth.test.ts', factoryName: 'recordingAnchors' },
  account: { ownerPath: 'test/runtime/accountRuntime.test.ts', factoryName: 'recordingAnchors' },
} satisfies Record<'real' | 'monitoring' | 'account', ArrivalAnchorMemoryParticipant>;

/** Names the memory behaviors each owner checks with a fresh participant. */
export const ARRIVAL_ANCHOR_MEMORY_CASES = [
  'returns missing anchors',
  'retains a zero anchor',
  'retains a finite anchor',
  'overwrites an anchor',
  'keeps devices independent',
] as const;

/** Captures both device lookups at one point in a memory scenario. */
export interface ArrivalAnchorMemoryObservation {
  anchor: number | undefined;
  otherAnchor: number | undefined;
}

/** Captures both devices before and after one device's anchor changes. */
export interface ArrivalAnchorMemoryTransition {
  beforeOverwrite: ArrivalAnchorMemoryObservation;
  afterOverwrite: ArrivalAnchorMemoryObservation;
}

/** Exercises one consumed-memory behavior and captures its complete observations. */
export function exerciseArrivalAnchorMemoryContract(
  anchors: Pick<ArrivalAnchors, 'get' | 'record'>,
  contractCase: (typeof ARRIVAL_ANCHOR_MEMORY_CASES)[number],
): ArrivalAnchorMemoryObservation | ArrivalAnchorMemoryTransition {
  if (contractCase === 'returns missing anchors') {
    return { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };
  }

  if (contractCase === 'retains a zero anchor') {
    anchors.record('placeholder-device', 0);

    return { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };
  }

  if (contractCase === 'retains a finite anchor') {
    anchors.record('placeholder-device', 1_700_000_000_000);

    return { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };
  }

  if (contractCase === 'overwrites an anchor') {
    anchors.record('placeholder-device', 1_700_000_000_000);
    anchors.record('placeholder-device', 1_700_000_898_000);

    return { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };
  }

  anchors.record('placeholder-device', 1_700_000_000_000);
  anchors.record('placeholder-other-device', 1_700_000_898_000);
  const beforeOverwrite = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };
  anchors.record('placeholder-device', 0);
  const afterOverwrite = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };

  return { beforeOverwrite, afterOverwrite };
}

/** Asserts captured memory observations against independent literal expectations. */
export function assertArrivalAnchorMemoryContract(
  observation: ArrivalAnchorMemoryObservation | ArrivalAnchorMemoryTransition,
  contractCase: (typeof ARRIVAL_ANCHOR_MEMORY_CASES)[number],
): void {
  if (contractCase === 'returns missing anchors') {
    assert.deepStrictEqual(observation, { anchor: undefined, otherAnchor: undefined });
    return;
  }

  if (contractCase === 'retains a zero anchor') {
    assert.deepStrictEqual(observation, { anchor: 0, otherAnchor: undefined });
    return;
  }

  if (contractCase === 'retains a finite anchor') {
    assert.deepStrictEqual(observation, { anchor: 1_700_000_000_000, otherAnchor: undefined });
    return;
  }

  if (contractCase === 'overwrites an anchor') {
    assert.deepStrictEqual(observation, { anchor: 1_700_000_898_000, otherAnchor: undefined });
    return;
  }

  assert.deepStrictEqual(observation, {
    beforeOverwrite: { anchor: 1_700_000_000_000, otherAnchor: 1_700_000_898_000 },
    afterOverwrite: { anchor: 0, otherAnchor: 1_700_000_898_000 },
  });
}

/** Lists participants that consume deletion, restore and successful persistence. */
export const ARRIVAL_ANCHOR_PERSISTENCE_PARTICIPANTS = {
  real: ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS.real,
  account: ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS.account,
} satisfies Record<'real' | 'account', ArrivalAnchorMemoryParticipant>;

/** Names the consumed state behaviors, with fresh participants for each case. */
export const ARRIVAL_ANCHOR_PERSISTENCE_CASES = [
  'forgets only the named device',
  'restores persisted anchors without clearing other memory',
  'persists a snapshot including deletion',
] as const;

/** Captures both device lookups before and after the consumed operation. */
export interface ArrivalAnchorPersistenceTransition {
  beforeOperation: ArrivalAnchorMemoryObservation;
  afterOperation: ArrivalAnchorMemoryObservation;
}

/** Exercises consumed state operations without checking disk representation. */
export async function exerciseArrivalAnchorPersistenceContract(
  anchors: ArrivalAnchors,
  contractCase: (typeof ARRIVAL_ANCHOR_PERSISTENCE_CASES)[number],
): Promise<ArrivalAnchorPersistenceTransition> {
  await anchors.restore();

  if (contractCase === 'forgets only the named device') {
    anchors.record('placeholder-device', 0);
    anchors.record('placeholder-other-device', 1_700_000_898_000);
    anchors.forget('placeholder-missing-device');
    const beforeOperation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };
    anchors.forget('placeholder-device');
    const afterOperation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };

    return { beforeOperation, afterOperation };
  }

  if (contractCase === 'restores persisted anchors without clearing other memory') {
    anchors.record('placeholder-device', 0);
    await anchors.persist();
    anchors.record('placeholder-device', 1_700_000_000_000);
    anchors.record('placeholder-other-device', 1_700_000_898_000);
    const beforeOperation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };
    await anchors.restore();
    const afterOperation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };

    return { beforeOperation, afterOperation };
  }

  anchors.record('placeholder-device', 1_700_000_000_000);
  anchors.record('placeholder-other-device', 0);
  await anchors.persist();
  anchors.forget('placeholder-device');
  anchors.record('placeholder-other-device', 1_700_000_898_000);
  await anchors.persist();
  const beforeOperation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };
  anchors.record('placeholder-device', 0);
  anchors.record('placeholder-other-device', 42);
  anchors.forget('placeholder-device');
  anchors.forget('placeholder-other-device');
  await anchors.restore();
  const afterOperation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };

  return { beforeOperation, afterOperation };
}

/** Asserts consumed state observations against independent whole literals. */
export function assertArrivalAnchorPersistenceContract(
  observation: ArrivalAnchorPersistenceTransition,
  contractCase: (typeof ARRIVAL_ANCHOR_PERSISTENCE_CASES)[number],
): void {
  if (contractCase === 'forgets only the named device') {
    assert.deepStrictEqual(observation, {
      beforeOperation: { anchor: 0, otherAnchor: 1_700_000_898_000 },
      afterOperation: { anchor: undefined, otherAnchor: 1_700_000_898_000 },
    });
    return;
  }

  if (contractCase === 'restores persisted anchors without clearing other memory') {
    assert.deepStrictEqual(observation, {
      beforeOperation: { anchor: 1_700_000_000_000, otherAnchor: 1_700_000_898_000 },
      afterOperation: { anchor: 0, otherAnchor: 1_700_000_898_000 },
    });
    return;
  }

  assert.deepStrictEqual(observation, {
    beforeOperation: { anchor: undefined, otherAnchor: 1_700_000_898_000 },
    afterOperation: { anchor: undefined, otherAnchor: 1_700_000_898_000 },
  });
}
