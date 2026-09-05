import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readme = readFileSync(join(REPOSITORY_ROOT, 'README.md'), 'utf8');

test('discloses that Homebridge stores the password in plain text (REL-08, D-023)', () => {
  // act & assert
  assert.match(readme, /plain text/i);
});

test('recommends a child bridge and warns about pairing loss on re-creation (REL-08, D-036)', () => {
  // act & assert
  assert.match(readme, /child bridge/i);
});

test('warns to keep the vendor alarm and notifications enabled during prerelease use (REL-08, D-026)', () => {
  // act & assert
  assert.match(readme, /vendor alarm/i);
});

test('discloses that battery levels are estimates (REL-08)', () => {
  // act & assert
  assert.match(readme, /estimate/i);
});

test('states there is no guarantee of Critical Alerts delivery (REL-08)', () => {
  // act & assert
  assert.match(readme, /Critical Alerts/i);
});
