/**
 * This is the platform name that users register in their Homebridge config.json.
 */
export const PLATFORM_NAME = 'BasementGuardian';

/**
 * This must match the name of your plugin as defined the package.json `name` property
 */
export const PLUGIN_NAME = 'homebridge-basement-guardian';

/**
 * How the plugin identifies itself on every outbound request it makes: the vendor REST reads and
 * commands, the Auth0 login request, and the AWS IoT MQTT WebSocket handshake.
 *
 * It is the plugin name and nothing else, built from the one product string this codebase declares
 * so no second one exists to drift. It carries no version: no runtime version source exists under
 * `src/`, `package.json` is imported nowhere at runtime, and adding that import would create a
 * packaging dependency and a drift risk in exchange for a fact the vendor cannot use.
 *
 * It carries no hostname, operating-system detail, bridge name, account identifier, or device
 * identifier either, so it says nothing about the installation it came from. It does not present the
 * plugin as the official vendor application (AUTH-02).
 */
export const PLUGIN_USER_AGENT = PLUGIN_NAME;
