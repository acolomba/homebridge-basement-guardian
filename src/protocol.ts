// SPDX-License-Identifier: MIT
// The import attribute is mandatory under module: nodenext; resolveJsonModule
// alone does not compile. tsc copies the data file into the build output, so it
// ships with the package and needs no copy step.
import protocolConstants from './protocol.json' with { type: 'json' };

/**
 * The public vendor protocol constants bundled with the plugin.
 *
 * These six values are the one documented exception to the rule that vendor
 * identifiers stay out of the repository (REL-04, D-07). Only `clientId` is
 * overridable from the Homebridge configuration; the rest are internal and
 * carry no configuration field (CONF-04).
 */
export interface ProtocolConstants {
  /** Base URL of the vendor REST API. */
  apiUrl: string;
  /** Public Auth0 client identifier. */
  clientId: string;
  /**
   * Base URL of the vendor Auth0 tenant.
   *
   * The value carries its scheme, as `apiUrl` does, so the one place that
   * builds a grant URL concatenates rather than deciding a scheme of its own.
   */
  auth0Url: string;
  /** Auth0 password realm. */
  auth0Realm: string;
  /** AWS IoT region. */
  awsRegion: string;
  /** AWS IoT WebSocket protocol. */
  protocol: string;
}

/** The bundled protocol constants, read from the shipped data file. */
export const PROTOCOL: ProtocolConstants = protocolConstants;
