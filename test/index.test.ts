// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests registration of the Basement Guardian platform.
 */

import { test } from 'node:test';

import { mock, verify, when } from 'strong-mock';

import registerPlugin from '../src/index.js';
import { BasementGuardianPlatform } from '../src/platform.js';
import { PLATFORM_NAME } from '../src/settings.js';

import type { API } from 'homebridge';

test('registers the Basement Guardian platform and touches nothing else on the API', () => {
  // arrange
  const api = mock<API>({ exactParams: true, name: 'homebridge api' });
  when(() => {
    api.registerPlatform(PLATFORM_NAME, BasementGuardianPlatform);
  }).thenReturn(undefined);

  // act
  registerPlugin(api);

  // assert
  verify(api);
});
