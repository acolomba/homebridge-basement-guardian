// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Verifies persisted arrival anchors and storage recovery.
 */

import assert from 'node:assert/strict';
import fsPromises, { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
// eslint-disable-next-line no-restricted-imports -- Synchronizes the scoped rename mock with the existing static Node built-in import.
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { mock, verify, when } from 'strong-mock';

import { ARRIVAL_ANCHOR_FILENAME, createArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';

import {
  ARRIVAL_ANCHOR_MEMORY_CASES,
  ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS,
  ARRIVAL_ANCHOR_PERSISTENCE_CASES,
  ARRIVAL_ANCHOR_PERSISTENCE_PARTICIPANTS,
  assertArrivalAnchorMemoryContract,
  assertArrivalAnchorPersistenceContract,
  exerciseArrivalAnchorMemoryContract,
  exerciseArrivalAnchorPersistenceContract,
} from './arrivalAnchorMemoryContract.js';

import type { ArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';
import type { LogLevel, Logging } from 'homebridge';
import type { TestContext } from 'node:test';

const DEVICE_ID = 'placeholder-device';
const OTHER_DEVICE_ID = 'placeholder-other-device';

const ANCHOR = 1_700_000_000_000;
const OTHER_ANCHOR = 1_700_000_898_000;

function recordingLog(recorded: string[]): Logging {
  void recorded;

  function at(level: string): (message: string) => void {
    return (message: string): void => {
      void level;
      void message;
    };
  }

  return Object.assign(at('info'), {
    prefix: 'basement guardian',
    debug: at('debug'),
    error: at('error'),
    info: at('info'),
    success: at('success'),
    warn: at('warn'),
    log: (level: LogLevel, message: string): void => {
      void level;
      void message;
    },
  });
}

// One storage directory per case, so no case can observe another's anchor file.
async function createStoragePath(t: TestContext): Promise<string> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-anchors-'));

  t.after(async () => {
    await rm(storagePath, { recursive: true, force: true });
  });

  return storagePath;
}

// A second store over the same directory, which is what a restart looks like
// from here: a fresh map, and whatever the last run left on disk.
function storeOver(storagePath: string, recorded: string[]): ArrivalAnchors {
  return createArrivalAnchors({ storagePath, log: recordingLog(recorded) });
}

async function writeAnchorText(storagePath: string, text: string): Promise<void> {
  await writeFile(join(storagePath, ARRIVAL_ANCHOR_FILENAME), text, 'utf8');
}

for (const contractCase of ARRIVAL_ANCHOR_MEMORY_CASES) {
  test(`${ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS.real.factoryName} ${contractCase}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const log: Logging = Object.assign(() => undefined, {
      prefix: 'basement guardian',
      debug: () => undefined,
      error: () => undefined,
      info: () => undefined,
      success: () => undefined,
      warn: () => undefined,
      log: () => undefined,
    });
    const anchors = createArrivalAnchors({ storagePath, log });

    // act
    const observation = exerciseArrivalAnchorMemoryContract(anchors, contractCase);

    // assert
    assertArrivalAnchorMemoryContract(observation, contractCase);
  });
}

for (const contractCase of ARRIVAL_ANCHOR_PERSISTENCE_CASES) {
  test(`${ARRIVAL_ANCHOR_PERSISTENCE_PARTICIPANTS.real.factoryName} ${contractCase}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const anchors = storeOver(storagePath, []);

    // act
    const observation = await exerciseArrivalAnchorPersistenceContract(anchors, contractCase);

    // assert
    assertArrivalAnchorPersistenceContract(observation, contractCase);
  });
}

test('D-08 restores nothing on a first start, when no anchor file exists yet', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const recorded: string[] = [];
  const anchors = storeOver(storagePath, recorded);

  // act
  await anchors.restore();

  // assert
  assert.deepStrictEqual(anchors.get(DEVICE_ID), undefined);
});

// A zero anchor is legal, and this round trip proves it survives persistence.
// Finite-number validation rejects overflow JSON numbers that parse as infinity.
// A truthiness check would incorrectly reject zero.
test('D-07 reads back every anchor it wrote, including one whose value is zero', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const recorded: string[] = [];
  const writer = storeOver(storagePath, recorded);
  writer.record(DEVICE_ID, ANCHOR);
  writer.record(OTHER_DEVICE_ID, 0);

  // act
  await writer.persist();
  const reader = storeOver(storagePath, recorded);
  await reader.restore();

  // assert
  assert.deepStrictEqual(ARRIVAL_ANCHOR_FILENAME, '.basement-guardian-arrivals.json');
  assert.deepStrictEqual(
    {
      contents: await readFile(join(storagePath, '.basement-guardian-arrivals.json'), 'utf8'),
      anchor: reader.get(DEVICE_ID),
      otherAnchor: reader.get(OTHER_DEVICE_ID),
    },
    { contents: '{"placeholder-device":1700000000000,"placeholder-other-device":0}', anchor: ANCHOR, otherAnchor: 0 },
  );
});

for (const { timestamp, text } of [
  { timestamp: '1e309', text: '{"placeholder-device":1e309,"placeholder-other-device":1700000000000}' },
  { timestamp: '-1e309', text: '{"placeholder-device":-1e309,"placeholder-other-device":1700000000000}' },
]) {
  test(`rejects the whole stored anchor file when a timestamp is ${timestamp}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    await writeAnchorText(storagePath, text);
    const anchors = storeOver(storagePath, []);

    // act
    await anchors.restore();

    // assert
    assert.deepStrictEqual({ anchor: anchors.get(DEVICE_ID), otherAnchor: anchors.get(OTHER_DEVICE_ID) }, { anchor: undefined, otherAnchor: undefined });
  });
}

for (const { shape, text } of [
  { shape: 'is not JSON at all', text: 'not json' },
  { shape: 'is JSON but not an object', text: '[1, 2]' },
  { shape: 'carries an entry that is not a number', text: `{"${DEVICE_ID}": ${String(ANCHOR)}, "${OTHER_DEVICE_ID}": "soon"}` },
]) {
  // The third shape is the one worth stating: the file is rejected whole rather
  // than in part. Keeping the entries that happened to parse would go on
  // vouching for those devices on evidence the rest of the file contradicted,
  // and resting on the forward-only term alone is the conservative answer.
  test(`D-08 restores nothing when the stored file ${shape}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const recorded: string[] = [];
    await writeAnchorText(storagePath, text);
    const anchors = storeOver(storagePath, recorded);

    // act
    await anchors.restore();

    // assert
    assert.deepStrictEqual({ anchor: anchors.get(DEVICE_ID), otherAnchor: anchors.get(OTHER_DEVICE_ID) }, { anchor: undefined, otherAnchor: undefined });
  });
}

// The account's systems come and go over months, so a store that only ever grew
// would keep an anchor for a pump that was sold with the house.
test('D-14 drops a forgotten device from the file, so the stored set cannot outgrow the account', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const recorded: string[] = [];
  const writer = storeOver(storagePath, recorded);
  writer.record(DEVICE_ID, ANCHOR);
  writer.record(OTHER_DEVICE_ID, OTHER_ANCHOR);
  await writer.persist();

  // act
  writer.forget(DEVICE_ID);
  await writer.persist();
  const reader = storeOver(storagePath, recorded);
  await reader.restore();

  // assert
  assert.deepStrictEqual(ARRIVAL_ANCHOR_FILENAME, '.basement-guardian-arrivals.json');
  assert.deepStrictEqual(
    {
      contents: await readFile(join(storagePath, '.basement-guardian-arrivals.json'), 'utf8'),
      anchor: reader.get(DEVICE_ID),
      otherAnchor: reader.get(OTHER_DEVICE_ID),
    },
    { contents: '{"placeholder-other-device":1700000898000}', anchor: undefined, otherAnchor: OTHER_ANCHOR },
  );
});

// A write that cannot land costs nothing an owner is harmed by: the clamp makes
// a stale anchor report silence sooner, never later. It does not raise out of
// the caller, and it strands no temporary file in the storage directory.
test('D-07 keeps serving and orphans no temporary file when the anchors cannot be written', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const recorded: string[] = [];
  await mkdir(join(storagePath, ARRIVAL_ANCHOR_FILENAME));
  const anchors = storeOver(storagePath, recorded);
  anchors.record(DEVICE_ID, ANCHOR);
  anchors.record(OTHER_DEVICE_ID, OTHER_ANCHOR);

  // act
  await anchors.persist();

  // assert
  assert.deepStrictEqual(
    { anchor: anchors.get(DEVICE_ID), otherAnchor: anchors.get(OTHER_DEVICE_ID), entries: await readdir(storagePath) },
    { anchor: ANCHOR, otherAnchor: OTHER_ANCHOR, entries: [ARRIVAL_ANCHOR_FILENAME] },
  );
});

test('persists and restores complete anchors using the supplied temporary path', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const temporaryPath = mock<(target: string) => string>({ exactParams: true, name: 'temporary path' });
  when(() => temporaryPath(join(storagePath, '.basement-guardian-arrivals.json'))).thenReturn(join(storagePath, 'arrival-write.tmp'));
  const writer = createArrivalAnchors({ storagePath, log: recordingLog([]), temporaryPath });
  writer.record(DEVICE_ID, ANCHOR);
  writer.record(OTHER_DEVICE_ID, 0);

  // act
  await writer.persist();
  const reader = storeOver(storagePath, []);
  await reader.restore();

  // assert
  assert.deepStrictEqual(
    {
      contents: await readFile(join(storagePath, '.basement-guardian-arrivals.json'), 'utf8'),
      anchor: reader.get(DEVICE_ID),
      otherAnchor: reader.get(OTHER_DEVICE_ID),
      entries: await readdir(storagePath),
    },
    {
      contents: '{"placeholder-device":1700000000000,"placeholder-other-device":0}',
      anchor: ANCHOR,
      otherAnchor: 0,
      entries: ['.basement-guardian-arrivals.json'],
    },
  );
  verify(temporaryPath);
});

test('serializes overlapping persist calls so the newer snapshot stays durable', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const olderTemporary = join(storagePath, 'older.tmp');
  const newerTemporary = join(storagePath, 'newer.tmp');
  const nativeRename = fsPromises.rename;
  let releaseOlderRename = (): void => undefined;
  let signalOlderReady = (): void => undefined;
  const olderRenameGate = new Promise<void>((resolve) => {
    releaseOlderRename = resolve;
  });
  const olderReady = new Promise<void>((resolve) => {
    signalOlderReady = resolve;
  });
  t.mock.method(fsPromises, 'rename', async (temporary: string, target: string): Promise<void> => {
    if (temporary === olderTemporary) {
      signalOlderReady();
      await olderRenameGate;
    }

    await nativeRename(temporary, target);
  });
  syncBuiltinESMExports();
  let temporaryWrites = 0;
  const writer = createArrivalAnchors({
    storagePath,
    log: recordingLog([]),
    temporaryPath: () => {
      temporaryWrites += 1;

      return temporaryWrites === 1 ? olderTemporary : newerTemporary;
    },
  });
  writer.record(DEVICE_ID, ANCHOR);

  try {
    // act
    const olderPersist = writer.persist();
    await olderReady;
    writer.record(OTHER_DEVICE_ID, OTHER_ANCHOR);
    const newerPersist = writer.persist();
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
    const temporaryWritesBeforeOlderRename = temporaryWrites;
    releaseOlderRename();
    await Promise.all([olderPersist, newerPersist]);
    const reader = storeOver(storagePath, []);
    await reader.restore();

    // assert
    assert.deepStrictEqual(
      {
        temporaryWritesBeforeOlderRename,
        contents: await readFile(join(storagePath, ARRIVAL_ANCHOR_FILENAME), 'utf8'),
        anchor: reader.get(DEVICE_ID),
        otherAnchor: reader.get(OTHER_DEVICE_ID),
      },
      {
        temporaryWritesBeforeOlderRename: 1,
        contents: '{"placeholder-device":1700000000000,"placeholder-other-device":1700000898000}',
        anchor: ANCHOR,
        otherAnchor: OTHER_ANCHOR,
      },
    );
  } finally {
    releaseOlderRename();
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
});

test('preserves an occupied temporary file and prior durable anchors after exclusive creation fails', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await writeFile(join(storagePath, 'occupied.tmp'), 'another writer');
  await writeFile(join(storagePath, '.basement-guardian-arrivals.json'), '{"placeholder-device":0}');
  const temporaryPath = mock<(target: string) => string>({ exactParams: true, name: 'temporary path' });
  when(() => temporaryPath(join(storagePath, '.basement-guardian-arrivals.json'))).thenReturn(join(storagePath, 'occupied.tmp'));
  const anchors = createArrivalAnchors({ storagePath, log: recordingLog([]), temporaryPath });
  anchors.record(DEVICE_ID, ANCHOR);
  anchors.record(OTHER_DEVICE_ID, OTHER_ANCHOR);

  // act
  await anchors.persist();

  // assert
  assert.deepStrictEqual(await readdir(storagePath), ['.basement-guardian-arrivals.json', 'occupied.tmp']);
  assert.deepStrictEqual(
    {
      temporary: await readFile(join(storagePath, 'occupied.tmp'), 'utf8'),
      durable: await readFile(join(storagePath, '.basement-guardian-arrivals.json'), 'utf8'),
      anchor: anchors.get(DEVICE_ID),
      otherAnchor: anchors.get(OTHER_DEVICE_ID),
    },
    { temporary: 'another writer', durable: '{"placeholder-device":0}', anchor: ANCHOR, otherAnchor: OTHER_ANCHOR },
  );
  verify(temporaryPath);
});

test('removes its supplied temporary file after rename fails and retains memory and the target', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await mkdir(join(storagePath, '.basement-guardian-arrivals.json'));
  await writeFile(join(storagePath, '.basement-guardian-arrivals.json', 'retained'), 'target contents');
  const temporaryPath = mock<(target: string) => string>({ exactParams: true, name: 'temporary path' });
  when(() => temporaryPath(join(storagePath, '.basement-guardian-arrivals.json'))).thenReturn(join(storagePath, 'owned.tmp'));
  const anchors = createArrivalAnchors({ storagePath, log: recordingLog([]), temporaryPath });
  anchors.record(DEVICE_ID, ANCHOR);
  anchors.record(OTHER_DEVICE_ID, OTHER_ANCHOR);

  // act
  await anchors.persist();

  // assert
  assert.deepStrictEqual(
    {
      anchor: anchors.get(DEVICE_ID),
      otherAnchor: anchors.get(OTHER_DEVICE_ID),
      entries: await readdir(storagePath),
      targetEntries: await readdir(join(storagePath, '.basement-guardian-arrivals.json')),
      retained: await readFile(join(storagePath, '.basement-guardian-arrivals.json', 'retained'), 'utf8'),
    },
    {
      anchor: ANCHOR,
      otherAnchor: OTHER_ANCHOR,
      entries: ['.basement-guardian-arrivals.json'],
      targetEntries: ['retained'],
      retained: 'target contents',
    },
  );
  verify(temporaryPath);
});

test('retains memory and durable bytes when the temporary path supplier throws', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  await writeFile(join(storagePath, '.basement-guardian-arrivals.json'), '{"placeholder-device":0}');
  const anchors = createArrivalAnchors({
    storagePath,
    log: recordingLog([]),
    temporaryPath: () => {
      throw new Error('temporary path unavailable');
    },
  });
  anchors.record(DEVICE_ID, ANCHOR);
  anchors.record(OTHER_DEVICE_ID, OTHER_ANCHOR);

  // act
  await anchors.persist();

  // assert
  assert.deepStrictEqual(
    {
      anchor: anchors.get(DEVICE_ID),
      otherAnchor: anchors.get(OTHER_DEVICE_ID),
      contents: await readFile(join(storagePath, '.basement-guardian-arrivals.json'), 'utf8'),
      entries: await readdir(storagePath),
    },
    { anchor: ANCHOR, otherAnchor: OTHER_ANCHOR, contents: '{"placeholder-device":0}', entries: ['.basement-guardian-arrivals.json'] },
  );
});
