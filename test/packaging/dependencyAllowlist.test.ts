/**
 * @fileoverview Static gate on the production dependency set.
 *
 * This project ships exactly one production dependency, `mqtt`. `REL-03` requires that stay
 * true, so a future `npm install <new-runtime-dep>` fails this test by name instead of
 * silently widening the shipped dependency tree the way `test/packageManifest.test.ts`
 * already catches an `engines` drift.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/** The parts of the shipped `package.json` this gate reads. */
interface PackageManifest {
  dependencies: Record<string, string>;
}

// The compiled case runs from `dist-test/test/packaging`, which puts the repository root
// three levels up.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function packageManifest(): PackageManifest {
  const manifest: unknown = JSON.parse(readFileSync(join(REPOSITORY_ROOT, 'package.json'), 'utf8'));

  return manifest as PackageManifest;
}

test('keeps the production dependency set exactly ["mqtt"] (REL-03)', () => {
  // act
  const manifest = packageManifest();

  // assert
  assert.deepStrictEqual(Object.keys(manifest.dependencies).sort(), ['mqtt']);
});
