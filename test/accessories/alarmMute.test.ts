// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests the provisional alarm-mute contract.
 */

import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

import * as alarmMute from '../../src/accessories/alarmMute.js';

// The prefix every export of this module carries, so a constant that stops saying it is unverified
// fails here rather than shipping as if `G-001` were closed.
const PROVISIONAL_PREFIX = 'PROVISIONAL_';

// `src/` holds forty-three `.ts` modules. A scan that read fewer read the wrong tree, and the
// declaring list built on that read would prove nothing about the modules it missed.
const SOURCE_MODULE_FLOOR = 43;

// A module declares a mute value when one of these patterns captures a name that contains `mute` in
// any case. `unmute` counts too, because alarm mute is the only mute in the domain. A read of a name
// does not match. The scan leaves out type names, function and method names, object-literal keys and
// string literals: those name types, behavior and wire fields, not values that govern mute.
const VALUE_DECLARATIONS: readonly RegExp[] = [
  // The name after `const`, `let`, `var` or `enum`, or a whole destructuring pattern, so every name
  // in the pattern counts.
  /\b(?:const\s+enum|const|let|var|enum)\s+([A-Za-z_$][\w$]*|\{[^;]*?\}|\[[^;]*?\])/g,
  // A field name after `readonly`, `static`, `private`, `protected` or `public`, but not a method
  // name. A `readonly` interface member counts too.
  /\b(?:readonly|static|private|protected|public)\s+(?:(?:static|readonly)\s+)*([A-Za-z_$][\w$]*)(?=\s*[?!]?\s*[:=;])/g,
  // A name at the start of a line that gets a value from `=`, which is the form of a class field
  // without a modifier.
  /^\s*([A-Za-z_$][\w$]*)\s*[?!]?\s*(?::[^=;]+)?(?<![<>!])=(?![=>])/gm,
];

// One `.ts` module under `src/`, by its path relative to `src/`, with its source text.
interface SourceModule {
  path: string;
  source: string;
}

async function sourceModules(): Promise<readonly SourceModule[]> {
  const root = new URL('../../../src/', import.meta.url);
  const entries = await readdir(root, { recursive: true });
  const modules: SourceModule[] = [];

  for (const entry of entries.filter((candidate) => candidate.endsWith('.ts')).sort()) {
    modules.push({ path: entry, source: await readFile(new URL(entry, root), 'utf8') });
  }

  return modules;
}

// Answers whether a module's source declares a value whose name contains `mute` in any case.
function declaresMuteValue(source: string): boolean {
  return VALUE_DECLARATIONS.some((pattern) => [...source.matchAll(pattern)].some(([, name = '']) => name.toLowerCase().includes('mute')));
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
  // act
  const requestedValue = alarmMute.PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE;

  // assert
  assert.strictEqual(requestedValue, true);
});

// Closing `G-001` has to be one reviewable edit to one module, which it is only while no other
// module declares an assumption of its own about mute (D-16). The owning module's own declaration
// is the match the scan must find, so a scan that reads nothing or matches nothing fails.
test('is the only module under src that declares a value governing alarm mute', async () => {
  // arrange
  const modules = await sourceModules();

  // act
  const declaring = modules.filter((module) => declaresMuteValue(module.source)).map((module) => module.path);

  // assert
  assert.deepStrictEqual(
    { declaring, readsTheSourceTree: modules.length >= SOURCE_MODULE_FLOOR },
    { declaring: ['accessories/alarmMute.ts'], readsTheSourceTree: true },
  );
});
