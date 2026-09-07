/**
 * @fileoverview Static gate on the production dependency set.
 *
 * This project ships exactly two production dependencies, `mqtt` and `undici`. `REL-03`
 * requires that set stay named and deliberate, so a future `npm install <new-runtime-dep>`
 * fails this test by name instead of silently widening the shipped dependency tree the way
 * `test/packageManifest.test.ts` already catches an `engines` drift.
 *
 * `undici` was added so the vendor HTTP transport could route through userland undici's own
 * `fetch` and `Agent` end to end, rather than through Node's built-in global `fetch`: Node's
 * built-in `fetch` bundles its own undici copy, and that copy's `allowH2` default flipped from
 * `false` to `true` starting with Node 26, so the plugin negotiated HTTP/2 with the vendor on
 * that Node major and hit an upstream undici teardown race on idle HTTP/2 sessions. A per-request
 * dispatcher on the built-in `fetch` cannot fix this portably, because the built-in fetch's
 * dispatch handler is shaped for its OWN bundled undici major, and a userland `Agent` from a
 * different major fails that handler's validation. Routing through this module's own `fetch` and
 * `Agent` keeps both from the same undici copy on every Node major (see src/cloud/httpDispatcher.ts).
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

test('keeps the production dependency set exactly ["mqtt", "undici"] (REL-03)', () => {
  // act
  const manifest = packageManifest();

  // assert
  assert.deepStrictEqual(Object.keys(manifest.dependencies).sort(), ['mqtt', 'undici']);
});
