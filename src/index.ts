import { BasementGuardianPlatform } from './platform.js';
import { PLATFORM_NAME } from './settings.js';

import type { API } from 'homebridge';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API): void => {
  api.registerPlatform(PLATFORM_NAME, BasementGuardianPlatform);
};
