/**
 * @fileoverview Defensive telemetry-signature scan of the installed production dependency tree.
 *
 * `REL-03` requires every production dependency, `mqtt` and `undici`, to pass a telemetry
 * review. npm's hoisting is install-order-dependent, so a dependency's own transitive
 * dependencies are not reliably co-located under its own `node_modules` entry; most of them
 * are hoisted to the top-level `node_modules/`. `package-lock.json`'s `packages` keys are the
 * actual resolved install path for every dependency, hoisted or nested, so this gate reads the
 * non-dev entries there (the same scoping `dependencyLicenses.test.ts` uses) and recursively
 * scans every `.js` file under each one -- every production dependency's own code plus every
 * transitive dependency npm actually installed -- for known telemetry/analytics-SDK
 * identifiers. This is a defensive signature scan, not a substitute for the fuller review
 * recorded in `06-RESEARCH.md` (npm audit clean, mqtt.js is a well-known open-source MQTT
 * client) -- see Assumption A2 there.
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

// A plain substring match false-positives on an ordinary identifier that happens to embed a
// signature, such as `previousEntry`, whose lower-cased form ends in `sentry`. Requiring the
// signature to START a word drops that reading while keeping every real telemetry reference a
// finding: `Sentry.init`, `@sentry/node`, `SENTRY_DSN`, and `sentryClient` all begin the
// signature after a non-alphanumeric character or at the start of the file. The boundary is
// spelled out rather than written `\b`, because `\b` treats `_` as a word character and so would
// miss the `SENTRY_DSN` spelling, and is one-sided, because `\b` also needs a boundary AFTER the
// signature and so would miss the `sentryClient` spelling.
function matchedSignatures(source: string): readonly string[] {
  const lowerCaseSource = source.toLowerCase();

  return TELEMETRY_SIGNATURES.filter((signature) => new RegExp(`(?<![a-z0-9])${signature.replaceAll('.', '\\.')}`, 'u').test(lowerCaseSource));
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
