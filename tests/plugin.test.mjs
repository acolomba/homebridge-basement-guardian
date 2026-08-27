import assert from 'node:assert/strict';
import test from 'node:test';

import registerPlugin from '../dist/index.js';

test('registers the Basement Guardian dynamic platform', () => {
  let registration;
  const api = {
    registerPlatform(platformName, platformConstructor) {
      registration = { platformConstructor, platformName };
    },
  };

  registerPlugin(api);

  assert.equal(registration.platformName, 'BasementGuardian');
  assert.equal(typeof registration.platformConstructor, 'function');
});
