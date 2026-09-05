/**
 * @fileoverview Defensive telemetry-signature scan of the installed mqtt tree.
 *
 * `REL-03` requires the one production dependency, `mqtt`, to pass a telemetry review. This
 * gate recursively scans every `.js` file under the installed `node_modules/mqtt` tree
 * (mqtt.js's own code plus its transitive dependencies, which are already installed) for
 * known telemetry/analytics-SDK identifiers. This is a defensive signature scan, not a
 * substitute for the fuller review recorded in `06-RESEARCH.md` (npm audit clean, mqtt.js is
 * a well-known open-source MQTT client) -- see Assumption A2 there.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// The compiled case runs from `dist-test/test/packaging`, which puts the repository root
// three levels up.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const MQTT_TREE = 'node_modules/mqtt';

// Case-insensitive telemetry/analytics-SDK identifiers this gate treats as a finding.
const TELEMETRY_SIGNATURES: readonly string[] = ['sentry', 'segment.io', 'amplitude', 'mixpanel', 'google-analytics', 'bugsnag', 'datadog'];

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

test('the installed mqtt tree carries no known telemetry-SDK identifier (REL-03)', () => {
  // arrange
  const files = jsFilesUnder(MQTT_TREE);

  // act
  const findings = files.flatMap((file) => {
    const signatures = matchedSignatures(readFileSync(join(REPOSITORY_ROOT, file), 'utf8'));

    return signatures.map((signature) => `${file} (${signature})`);
  });

  // assert
  assert.ok(files.length > 0, `found no .js files under ${MQTT_TREE} -- is the dependency installed?`);
  assert.deepStrictEqual(findings, []);
});
