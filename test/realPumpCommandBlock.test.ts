/**
 * @fileoverview Structural gate proving the real-pump suite can never reach a command write.
 *
 * D-04 requires every command path hard-blocked in the test transport itself, not left to
 * operator discipline. features/real-pump/support/realWorld.ts builds no HomeKit accessory layer
 * at all, so there is no write handler anywhere in the suite that could ever reach a CommandPort
 * in the first place -- this test proves that mechanically, mirroring
 * test/accessories/hapImportScope.test.ts's static source-text gate, by scanning every file under
 * features/real-pump/ for the three substrings that would prove otherwise (T-06-15).
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/** The one directory this gate scans. */
const REAL_PUMP_DIRECTORY = 'features/real-pump';

/** The substrings that would prove a command path reaches the real-pump suite. */
const FORBIDDEN_SUBSTRINGS: readonly string[] = ['.commands', 'CommandPort', 'sendCommand'];

// The compiled case runs from `dist-test/test`, which puts the repository root two levels up.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function typeScriptFilesUnder(relativeDirectory: string): readonly string[] {
  return readdirSync(join(REPOSITORY_ROOT, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${relativeDirectory}/${entry.name}`;

    if (entry.isDirectory()) {
      return typeScriptFilesUnder(path);
    }

    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

test('no file under features/real-pump/ references a command path (REL-09, D-04)', () => {
  // arrange
  const files = typeScriptFilesUnder(REAL_PUMP_DIRECTORY);

  // act
  const offending = files.filter((file) => {
    const source = readFileSync(join(REPOSITORY_ROOT, file), 'utf8');

    return FORBIDDEN_SUBSTRINGS.some((substring) => source.includes(substring));
  });

  // assert
  assert.ok(files.length >= 1, `the gate enumerated ${String(files.length)} TypeScript files under ${REAL_PUMP_DIRECTORY}, expected at least 1`);
  assert.deepStrictEqual(offending, []);
});
