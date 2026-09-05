import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/** The single tarball report `npm pack --dry-run --json` prints on standard output. */
interface PackReport {
  files: { path: string }[];
}

const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// The `files` allowlist admits `dist`, `config.schema.json`, `CHANGELOG.md`, and `NOTICE`; npm
// force-includes `package.json`, `LICENSE`, and `README.md` whatever the allowlist says (D-21).
const ALLOWED_ROOT_FILES = ['CHANGELOG.md', 'LICENSE', 'NOTICE', 'README.md', 'config.schema.json', 'package.json'];
const COMPILED_OUTPUT_PREFIX = 'dist/';
const PLUGIN_ENTRY_POINT = 'dist/index.js';

// The pack runs against the working tree, so an unbuilt `dist/` would empty the packed list and make
// every allowlist assertion below pass without examining a single compiled file. Refuse that instead:
// `npm run check` builds through `prefallow` before it tests, so a missing entry point means the tree
// was never built, not that packaging changed.
function packedPaths(): string[] {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const [tarball] = JSON.parse(output) as [PackReport];
  const paths = tarball.files.map((file) => file.path);

  if (!paths.includes(PLUGIN_ENTRY_POINT)) {
    throw new Error(`the packed artifact carries no ${PLUGIN_ENTRY_POINT}, so the allowlist cannot be checked; run \`npm run build\` first`);
  }

  return paths;
}

test('packs nothing beyond the compiled output and the allowlisted root files (REL-04)', () => {
  // act
  const unexpectedPaths = packedPaths().filter((packedPath) => !packedPath.startsWith(COMPILED_OUTPUT_PREFIX) && !ALLOWED_ROOT_FILES.includes(packedPath));

  // assert
  assert.deepStrictEqual(unexpectedPaths, [], `the packed artifact carries paths outside the publish allowlist (D-21): ${unexpectedPaths.join(', ')}`);
});

test('packs every allowlisted root file and no other root file (REL-04)', () => {
  // act
  const rootFiles = packedPaths().filter((packedPath) => !packedPath.includes('/'));

  // assert
  assert.deepStrictEqual([...rootFiles].sort(), ALLOWED_ROOT_FILES);
});
