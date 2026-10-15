// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Checks the arrival-anchor memory operations used by monitoring.
 *
 * Numeric anchors have no mutable aliases. The get/record boundary has no
 * enumeration or deletion operation. Durable bytes and JSON validation belong
 * to the real store's restore/persist owner cases.
 */

import assert from 'node:assert/strict';

import type { ArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';

interface ArrivalAnchorMemoryParticipant {
  ownerPath: string;
  factoryName: string;
}

/** Lists the real and stateful monitoring participants and their owning modules. */
export const ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS = {
  real: { ownerPath: 'test/runtime/arrivalAnchors.test.ts', factoryName: 'createArrivalAnchors' },
  monitoring: { ownerPath: 'test/runtime/monitoringHealth.test.ts', factoryName: 'recordingAnchors' },
} satisfies Record<'real' | 'monitoring', ArrivalAnchorMemoryParticipant>;

/** Names the memory behaviors each owner checks with a fresh participant. */
export const ARRIVAL_ANCHOR_MEMORY_CASES = [
  'returns missing anchors',
  'retains a zero anchor',
  'retains a finite anchor',
  'overwrites an anchor',
  'keeps devices independent',
] as const;

/** Asserts one consumed-memory behavior directly, so a broken participant throws. */
export function assertArrivalAnchorMemoryContract(
  anchors: Pick<ArrivalAnchors, 'get' | 'record'>,
  contractCase: (typeof ARRIVAL_ANCHOR_MEMORY_CASES)[number],
): void {
  if (contractCase === 'returns missing anchors') {
    // act
    const observation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };

    // assert
    assert.deepStrictEqual(observation, { anchor: undefined, otherAnchor: undefined });
    return;
  }

  if (contractCase === 'retains a zero anchor') {
    // act
    anchors.record('placeholder-device', 0);
    const observation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };

    // assert
    assert.deepStrictEqual(observation, { anchor: 0, otherAnchor: undefined });
    return;
  }

  if (contractCase === 'retains a finite anchor') {
    // act
    anchors.record('placeholder-device', 1_700_000_000_000);
    const observation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };

    // assert
    assert.deepStrictEqual(observation, { anchor: 1_700_000_000_000, otherAnchor: undefined });
    return;
  }

  if (contractCase === 'overwrites an anchor') {
    // arrange
    anchors.record('placeholder-device', 1_700_000_000_000);

    // act
    anchors.record('placeholder-device', 1_700_000_898_000);
    const observation = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };

    // assert
    assert.deepStrictEqual(observation, { anchor: 1_700_000_898_000, otherAnchor: undefined });
    return;
  }

  // arrange
  anchors.record('placeholder-device', 1_700_000_000_000);
  anchors.record('placeholder-other-device', 1_700_000_898_000);

  // act
  const beforeOverwrite = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };
  anchors.record('placeholder-device', 0);
  const afterOverwrite = { anchor: anchors.get('placeholder-device'), otherAnchor: anchors.get('placeholder-other-device') };

  // assert
  assert.deepStrictEqual(
    { beforeOverwrite, afterOverwrite },
    {
      beforeOverwrite: { anchor: 1_700_000_000_000, otherAnchor: 1_700_000_898_000 },
      afterOverwrite: { anchor: 0, otherAnchor: 1_700_000_898_000 },
    },
  );
}
