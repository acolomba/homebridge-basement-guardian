/**
 * @fileoverview Defensive telemetry-signature scan of the installed production dependency tree.
 *
 * `REL-03` requires the one production dependency, `mqtt`, to pass a telemetry review. npm's
 * hoisting is install-order-dependent, so mqtt's transitive dependencies are not reliably
 * co-located under `node_modules/mqtt`; most of them are hoisted to the top-level
 * `node_modules/`. `package-lock.json`'s `packages` keys are the actual resolved install path
 * for every dependency, hoisted or nested, so this gate reads the non-dev entries there (the
 * same scoping `dependencyLicenses.test.ts` uses) and recursively scans every `.js` file under
 * each one -- mqtt.js's own code plus every transitive dependency npm actually installed -- for
 * known telemetry/analytics-SDK identifiers. This is a defensive signature scan, not a
 * substitute for the fuller review recorded in `06-RESEARCH.md` (npm audit clean, mqtt.js is
 * a well-known open-source MQTT client) -- see Assumption A2 there.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/** One entry of a lockfile-v3 `packages` object, scoped to the field this gate reads. */
interface LockfilePackage {
  dev?: boolean;
}

/** The parts of `package-lock.json` this gate reads. */
interface PackageLock {
  packages: Record<string, LockfilePackage>;
}

// The compiled case runs from `dist-test/test/packaging`, which puts the repository root
// three levels up.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Case-insensitive telemetry/analytics-SDK identifiers this gate treats as a finding.
const TELEMETRY_SIGNATURES: readonly string[] = ['sentry', 'segment.io', 'amplitude', 'mixpanel', 'google-analytics', 'bugsnag', 'datadog'];

function packageLock(): PackageLock {
  const lockfile: unknown = JSON.parse(readFileSync(join(REPOSITORY_ROOT, 'package-lock.json'), 'utf8'));

  return lockfile as PackageLock;
}

// Resolved install paths (hoisted or nested) of every non-dev package, i.e. mqtt plus its whole
// installed transitive dependency closure.
function productionPackagePaths(): readonly string[] {
  return Object.entries(packageLock().packages)
    .filter(([path]) => path !== '')
    .filter(([, entry]) => !entry.dev)
    .map(([path]) => path);
}

function jsFilesUnder(relativeDirectory: string): readonly string[] {
  return readdirSync(join(REPOSITORY_ROOT, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${relativeDirectory}/${entry.name}`;

    if (entry.isDirectory()) {
      return jsFilesUnder(path);
    }

    return entry.name.endsWith('.js') ? [path] : [];
  });
}

function matchedSignatures(source: string): readonly string[] {
  const lowerCaseSource = source.toLowerCase();

  return TELEMETRY_SIGNATURES.filter((signature) => lowerCaseSource.includes(signature));
}

test('the installed production dependency tree carries no known telemetry-SDK identifier (REL-03)', () => {
  // arrange
  const packagePaths = productionPackagePaths();
  const files = [...new Set(packagePaths.flatMap((packagePath) => jsFilesUnder(packagePath)))];

  // act
  const findings = files.flatMap((file) => {
    const signatures = matchedSignatures(readFileSync(join(REPOSITORY_ROOT, file), 'utf8'));

    return signatures.map((signature) => `${file} (${signature})`);
  });

  // assert
  assert.ok(packagePaths.length > 0, 'found no non-dev packages in package-lock.json -- is the lockfile intact?');
  assert.ok(files.length > 0, 'found no .js files under the production dependency tree -- is it installed?');
  assert.deepStrictEqual(findings, []);
});
