/**
 * @fileoverview Static gate on the licenses of production dependencies.
 *
 * `REL-03` requires production dependencies to pass a telemetry/licensing review. A
 * GPL-family license on a production package would obligate this project's own distributed
 * code in a way `D-035`'s MIT/Apache boundary does not anticipate, so this gate reads
 * `package-lock.json`'s per-package license fields, scoped to the production tree, and
 * fails by naming any GPL-family package it finds.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/** One entry of a lockfile-v3 `packages` object, scoped to the fields this gate reads. */
interface LockfilePackage {
  dev?: boolean;
  license?: string;
}

/** The parts of `package-lock.json` this gate reads. */
interface PackageLock {
  packages: Record<string, LockfilePackage>;
}

// The compiled case runs from `dist-test/test/packaging`, which puts the repository root
// three levels up.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// GPL-family identifiers this project's mixed MIT/Apache distribution cannot carry as a
// production dependency's own license.
const GPL_FAMILY = /^(L?GPL|AGPL)/i;

function packageLock(): PackageLock {
  const lockfile: unknown = JSON.parse(readFileSync(join(REPOSITORY_ROOT, 'package-lock.json'), 'utf8'));

  return lockfile as PackageLock;
}

test('no production dependency carries a GPL-family license (REL-03)', () => {
  // arrange
  const lockfile = packageLock();

  // act
  const violations = Object.entries(lockfile.packages)
    .filter(([path]) => path !== '')
    .filter(([, entry]) => !entry.dev)
    .filter(([, entry]) => entry.license == null || GPL_FAMILY.test(entry.license))
    .map(([path, entry]) => `${path} (${entry.license ?? 'no recorded license'})`);

  // assert
  assert.deepStrictEqual(violations, []);
});
