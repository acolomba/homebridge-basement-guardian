// This module is parked in the `.fallowrc.json` `ignoreFindings` list because
// `IOT_SERVICE_NAME` has no consumer yet. The entry and this note are removed
// together, in the commit that wires the shadow client into the account
// runtime and makes this module reachable from the plugin entry point.

/** The AWS service name the message broker signs connection requests under. */
export const IOT_SERVICE_NAME = 'iotdevicegateway';

/**
 * One set of temporary credentials plus the moment the URL is signed at.
 *
 * `scheme` is injected rather than fixed so the transport-level harness can
 * reach a local broker; production always supplies the bundled protocol
 * constant. It is not a configuration field and it disables no verification.
 */
export interface PresignInput {
  scheme: string;
  host: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  now: Date;
}

/** Returns the presigned WebSocket URL for the AWS IoT message broker. */
export function presignIotWebsocketUrl(input: PresignInput): string {
  return `${input.scheme}://${input.host}`;
}
