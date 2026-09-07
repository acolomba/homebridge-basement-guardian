/**
 * @fileoverview Static gate on the shipped LICENSE and NOTICE text, and on every `src/*.ts`
 * file's own first-line SPDX header.
 *
 * `D-035` splits this repository's licensing between template-derived Apache-2.0 files and
 * original MIT-licensed work. LICENSE and NOTICE are the two files that carry that boundary
 * to a reader; this gate reads their raw text and asserts each says what it must, the same
 * "read the file, assert the text" pattern the packaging and HAP-import gates already use.
 *
 * The per-file gate below extends that same pattern to the classification itself: every
 * `src/*.ts` file carries a first-line SPDX identifier naming which of the two licenses
 * covers it, so a header removed, changed, or misclassified after this gate lands fails a
 * named test rather than silently drifting from LICENSE and NOTICE's prose (REL-05, T-06-05).
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// The compiled case runs from `dist-test/test/packaging`, which puts the repository root
// three levels up.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

test('LICENSE carries both the Apache and MIT license texts (REL-05)', () => {
  // arrange
  const license = readFileSync(join(REPOSITORY_ROOT, 'LICENSE'), 'utf8');

  // act & assert
  assert.match(license, /Apache License/);
  assert.match(license, /MIT License/);
});

test('NOTICE exists and names the Apache-licensed template this project began from (REL-05, D-035)', () => {
  // arrange
  const notice = readFileSync(join(REPOSITORY_ROOT, 'NOTICE'), 'utf8');

  // act & assert
  assert.match(notice, /homebridge-plugin-template/);
  assert.match(notice, /Apache/);
});

/**
 * The two `src/*.ts` files that stayed near-verbatim Apache-2.0 template material (D-035's
 * default reading). `src/platform.ts` was reexamined and classified MIT instead: it is over
 * 80% new code since the template import, an explicit maintainer decision that departs from
 * that default (T-06-06).
 */
const APACHE_DERIVED_FILES: readonly string[] = ['src/index.ts', 'src/settings.ts'];

// This repository's current src/*.ts count. A gate that enumerated fewer files read the
// wrong tree, and the per-file assertions built on that read would pass without examining
// every file the classification actually covers.
const SRC_FILE_FLOOR = 42;

// Repository-relative and POSIX-separated, mirroring test/accessories/hapImportScope.test.ts's
// own typeScriptFilesUnder() so a failing assertion names a path an author can open.
function typeScriptFilesUnder(relativeDirectory: string): readonly string[] {
  return readdirSync(join(REPOSITORY_ROOT, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${relativeDirectory}/${entry.name}`;

    if (entry.isDirectory()) {
      return typeScriptFilesUnder(path);
    }

    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

test('every src/*.ts file is enumerated for the license-header gate (REL-05)', () => {
  // act
  const files = typeScriptFilesUnder('src');

  // assert
  assert.ok(
    files.length >= SRC_FILE_FLOOR,
    `the gate enumerated ${String(files.length)} src/*.ts files, fewer than the ${String(SRC_FILE_FLOOR)} this repository holds`,
  );
});

test('the two template-derived files carry the Apache-2.0 SPDX header and the template note (REL-05, D-035)', () => {
  // arrange
  const contents = APACHE_DERIVED_FILES.map((file) => readFileSync(join(REPOSITORY_ROOT, file), 'utf8'));

  // act & assert
  for (const content of contents) {
    assert.match(content, /SPDX-License-Identifier:\s*Apache-2\.0/);
    assert.match(content, /Modified from the Homebridge plugin template/);
  }
});

test('every other src/*.ts file carries the MIT SPDX header and not the Apache one (REL-05, D-035)', () => {
  // arrange
  const files = typeScriptFilesUnder('src').filter((file) => !APACHE_DERIVED_FILES.includes(file));

  // act & assert
  for (const file of files) {
    const content = readFileSync(join(REPOSITORY_ROOT, file), 'utf8');
    assert.match(content, /SPDX-License-Identifier:\s*MIT/, `${file} is missing the MIT SPDX header`);
    assert.doesNotMatch(content, /SPDX-License-Identifier:\s*Apache-2\.0/, `${file} unexpectedly carries an Apache-2.0 header`);
  }
});
