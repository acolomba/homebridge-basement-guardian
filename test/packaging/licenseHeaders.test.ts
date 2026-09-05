/**
 * @fileoverview Static gate on the shipped LICENSE and NOTICE text.
 *
 * `D-035` splits this repository's licensing between template-derived Apache-2.0 files and
 * original MIT-licensed work. LICENSE and NOTICE are the two files that carry that boundary
 * to a reader; this gate reads their raw text and asserts each says what it must, the same
 * "read the file, assert the text" pattern the packaging and HAP-import gates already use.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
