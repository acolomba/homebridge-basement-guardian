import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

import * as alarmMute from '../../src/accessories/alarmMute.js';

// The prefix every export of this module carries, so a constant that stops saying it is unverified
// fails here rather than shipping as if `G-001` were closed.
const PROVISIONAL_PREFIX = 'PROVISIONAL_';

// The module that owns the mute contract. Every other module under `src/` is checked against it.
const OWNING_MODULE = 'accessories/alarmMute.ts';

// A constant *declaration* naming alarm mute, in the casing a constant is written in. A reference
// to the one declared here is fine and expected; a second declaration anywhere else would put an
// unmarked assumption about mute into the codebase.
const MUTE_CONSTANT_DECLARATION = /(?:const|let|var|enum|readonly)\s+([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)\b/g;

async function sourceModules(): Promise<readonly { path: string; source: string }[]> {
  const root = new URL('../../../src/', import.meta.url);
  const entries = await readdir(root, { recursive: true });
  const modules: { path: string; source: string }[] = [];

  for (const entry of entries.filter((candidate) => candidate.endsWith('.ts')).sort()) {
    modules.push({ path: entry, source: await readFile(new URL(entry, root), 'utf8') });
  }

  return modules;
}

test('names every export it declares as provisional', () => {
  // act
  const exported = Object.keys(alarmMute);

  // assert
  assert.deepStrictEqual(
    exported.filter((name) => !name.startsWith(PROVISIONAL_PREFIX)),
    [],
  );
  assert.deepStrictEqual(exported, ['PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE']);
});

// The whole of the measured command body is `{"alarm_audio_muted": true}`, and this is the value in
// it. Nothing else has ever been sent to a real device (D-019, CTRL-04).
test('requests exactly true and nothing else for alarm mute', () => {
  // act & assert
  assert.strictEqual(alarmMute.PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE, true);
});

// Closing `G-001` has to be one reviewable edit to one module, which it is only while no other
// module declares an assumption of its own about mute (D-16).
test('is the only module under src that declares a constant governing alarm mute', async () => {
  // arrange
  const modules = await sourceModules();

  // act
  const declaring = modules
    .filter((module) => module.path !== OWNING_MODULE)
    .filter((module) => [...module.source.matchAll(MUTE_CONSTANT_DECLARATION)].some(([, name = '']) => name.includes('ALARM') && name.includes('MUTE')))
    .map((module) => module.path);

  // assert
  assert.deepStrictEqual(declaring, []);
});
