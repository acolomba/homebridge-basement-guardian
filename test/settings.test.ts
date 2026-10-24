// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests the plugin identity and outbound user agent.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import configSchema from '../config.schema.json' with { type: 'json' };
import packageJson from '../package.json' with { type: 'json' };
import { PLATFORM_NAME, PLUGIN_NAME, PLUGIN_USER_AGENT } from '../src/settings.js';

test('names the platform the settings schema advertises as its plugin alias', () => {
  // arrange
  const expectedPlatformName = 'BasementGuardian';

  // act
  const platformName = PLATFORM_NAME;

  // assert
  assert.strictEqual(platformName, expectedPlatformName);
  assert.strictEqual(configSchema.pluginAlias, platformName);
});

test('names the plugin the package publishes', () => {
  // arrange
  const expectedPluginName = 'homebridge-basement-guardian';

  // act
  const pluginName = PLUGIN_NAME;

  // assert
  assert.strictEqual(pluginName, expectedPluginName);
  assert.strictEqual(packageJson.name, pluginName);
});

// One product string exists in this codebase, so no second one can drift from it. A version, a
// platform token, or a vendor product name would all arrive as a `/`, which is what this excludes.
test('identifies the plugin by its own name and nothing else', () => {
  // arrange
  const expectedUserAgent = PLUGIN_NAME;

  // act
  const userAgent = PLUGIN_USER_AGENT;

  // assert
  assert.strictEqual(userAgent, expectedUserAgent);
  assert.strictEqual(userAgent.includes('/'), false);
});
