import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { ARRIVAL_ANCHOR_FILENAME, createArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';

import type { ArrivalAnchors } from '../../src/runtime/arrivalAnchors.js';
import type { LogLevel, Logging } from 'homebridge';
import type { TestContext } from 'node:test';

const DEVICE_ID = 'placeholder-device';
const OTHER_DEVICE_ID = 'placeholder-other-device';

const ANCHOR = 1_700_000_000_000;
const OTHER_ANCHOR = 1_700_000_898_000;

const UNUSABLE_LINE = 'debug The stored arrival anchors could not be read; silence is measured from this run alone.';
const NOT_WRITTEN_LINE = 'debug The arrival anchors could not be written; a restart will measure silence from this run alone.';

function recordingLog(recorded: string[]): Logging {
  function at(level: string): (message: string) => void {
    return (message: string): void => {
      recorded.push(`${level} ${message}`);
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
      recorded.push(`${level} ${message}`);
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

test('D-08 restores nothing and says nothing on a first start, when no anchor file exists yet', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const recorded: string[] = [];
  const anchors = storeOver(storagePath, recorded);

  // act
  await anchors.restore();

  // assert
  assert.deepStrictEqual({ anchor: anchors.get(DEVICE_ID), recorded }, { anchor: undefined, recorded: [] });
});

// A zero anchor is a legal value and a truthiness test would drop it, so the
// round trip carries one. `JSON.stringify` also turns a non-finite number into
// `null`, which is why the read-back guard is a `typeof` test.
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
  assert.deepStrictEqual(
    { anchor: reader.get(DEVICE_ID), otherAnchor: reader.get(OTHER_DEVICE_ID), recorded },
    { anchor: ANCHOR, otherAnchor: 0, recorded: [] },
  );
});

for (const { shape, text } of [
  { shape: 'is not JSON at all', text: 'not json' },
  { shape: 'is JSON but not an object', text: '[1, 2]' },
  { shape: 'carries an entry that is not a number', text: `{"${DEVICE_ID}": ${String(ANCHOR)}, "${OTHER_DEVICE_ID}": "soon"}` },
]) {
  // The third shape is the one worth stating: the file is rejected whole rather
  // than in part. Keeping the entries that happened to parse would go on
  // vouching for those devices on evidence the rest of the file contradicted,
  // and resting on the forward-only term alone is the conservative answer.
  test(`D-08 restores nothing and notes it at debug when the stored file ${shape}`, async (t) => {
    // arrange
    const storagePath = await createStoragePath(t);
    const recorded: string[] = [];
    await writeAnchorText(storagePath, text);
    const anchors = storeOver(storagePath, recorded);

    // act
    await anchors.restore();

    // assert
    assert.deepStrictEqual(
      { anchor: anchors.get(DEVICE_ID), otherAnchor: anchors.get(OTHER_DEVICE_ID), recorded },
      { anchor: undefined, otherAnchor: undefined, recorded: [UNUSABLE_LINE] },
    );
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

  // assert
  const reader = storeOver(storagePath, recorded);
  await reader.restore();
  assert.deepStrictEqual({ anchor: reader.get(DEVICE_ID), otherAnchor: reader.get(OTHER_DEVICE_ID) }, { anchor: undefined, otherAnchor: OTHER_ANCHOR });
});

// A write that cannot land costs nothing an owner is harmed by: the clamp makes
// a stale anchor report silence sooner, never later. So it is a debug note, it
// does not raise out of the caller, and it strands no temporary file in the
// storage directory.
test('D-07 keeps serving at debug level and orphans no temporary file when the anchors cannot be written', async (t) => {
  // arrange
  const storagePath = await createStoragePath(t);
  const recorded: string[] = [];
  await mkdir(join(storagePath, ARRIVAL_ANCHOR_FILENAME));
  const anchors = storeOver(storagePath, recorded);
  anchors.record(DEVICE_ID, ANCHOR);

  // act
  await anchors.persist();

  // assert
  assert.deepStrictEqual({ entries: await readdir(storagePath), recorded }, { entries: [ARRIVAL_ANCHOR_FILENAME], recorded: [NOT_WRITTEN_LINE] });
});
