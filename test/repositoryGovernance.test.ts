/**
 * @fileoverview Static gate on GitHub repository-governance files.
 *
 * These assertions read the repository's `SECURITY.md` and issue templates as plain text.
 * They gate `REL-06` (best-effort support, private vulnerability reporting) and `D-025`
 * (never ask a reporter for a complete `config.json`).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// This file compiles to `dist-test/test/repositoryGovernance.test.js`, the same depth as
// `dist-test/test/packageManifest.test.js`, so the repository root is two levels up.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPOSITORY_ROOT, relativePath), 'utf8');
}

test('SECURITY.md states support is best-effort (REL-06)', () => {
  // act
  const securityPolicy = readRepoFile('SECURITY.md');

  // assert
  assert.match(securityPolicy, /best.effort/i);
});

test('SECURITY.md directs vulnerability reports to private Security Advisories (REL-06)', () => {
  // act
  const securityPolicy = readRepoFile('SECURITY.md');

  // assert
  assert.match(securityPolicy, /security\/advisories/i);
});

for (const templatePath of ['.github/ISSUE_TEMPLATE/bug-report.md', '.github/ISSUE_TEMPLATE/support-request.md']) {
  test(`${templatePath} does not ask for a complete config.json (REL-06, D-025)`, () => {
    // act
    const template = readRepoFile(templatePath);

    // assert
    assert.doesNotMatch(template, /show your homebridge config\.json here/i);
    assert.match(template, /email/i);
    assert.match(template, /password/i);
  });
}
