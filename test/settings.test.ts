import assert from 'node:assert/strict';
import { test } from 'node:test';

import configSchema from '../config.schema.json' with { type: 'json' };
import packageJson from '../package.json' with { type: 'json' };
import { PLATFORM_NAME, PLUGIN_NAME, PLUGIN_USER_AGENT } from '../src/settings.js';

test('names the platform the settings schema advertises as its plugin alias', () => {
  // act & assert
  assert.strictEqual(PLATFORM_NAME, 'BasementGuardian');
  assert.strictEqual(configSchema.pluginAlias, PLATFORM_NAME);
});

test('names the plugin the package publishes', () => {
  // act & assert
  assert.strictEqual(PLUGIN_NAME, 'homebridge-basement-guardian');
  assert.strictEqual(packageJson.name, PLUGIN_NAME);
});

// One product string exists in this codebase, so no second one can drift from it. A version, a
// platform token, or a vendor product name would all arrive as a `/`, which is what this excludes.
test('identifies the plugin by its own name and nothing else', () => {
  // act & assert
  assert.strictEqual(PLUGIN_USER_AGENT, PLUGIN_NAME);
  assert.strictEqual(PLUGIN_USER_AGENT.includes('/'), false);
});
