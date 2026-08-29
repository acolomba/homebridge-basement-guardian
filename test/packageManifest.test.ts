import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { PLUGIN_NAME } from '../src/settings.js';

/** The parts of the shipped `package.json` that declare the supported runtime. */
interface PackageManifest {
  name: string;
  type: string;
  main: string;
  keywords: string[];
  engines: {
    node: string;
    homebridge: string;
  };
}

const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function packageManifest(): PackageManifest {
  const manifest: unknown = JSON.parse(readFileSync(join(REPOSITORY_ROOT, 'package.json'), 'utf8'));

  return manifest as PackageManifest;
}

test('declares the supported Node.js and Homebridge ranges (CONF-01)', () => {
  // act
  const manifest = packageManifest();

  // assert
  assert.deepStrictEqual(manifest.engines, { node: '^22.10.0 || ^24.0.0', homebridge: '^1.8.0 || ^2.0.0' });
});

test('ships as an ES module whose entry point is the compiled plugin (CONF-01)', () => {
  // act
  const manifest = packageManifest();

  // assert
  assert.strictEqual(manifest.type, 'module');
  assert.strictEqual(manifest.main, 'dist/index.js');
});

test('names itself as the plugin Homebridge loads and marks itself a Homebridge plugin (CONF-01)', () => {
  // act
  const manifest = packageManifest();

  // assert
  assert.strictEqual(manifest.name, PLUGIN_NAME);
  assert.deepStrictEqual([...manifest.keywords].sort(), ['homebridge-plugin', 'supports-hap']);
});
