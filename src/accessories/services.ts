/**
 * @fileoverview The services one accessory publishes, and how each one is keyed.
 *
 * HomeKit identifies a service by its type together with its subtype, so a
 * subtype that changes orphans the service and every automation, scene, and
 * notification the user attached to it. The subtypes named here are therefore
 * part of the plugin's user-facing contract from the first release.
 *
 * The stable subtype strings themselves arrive with the accessory adapters, as
 * an `as const` object that derives its union from these types. A `const enum`
 * is not an option: the style rules ban it, and Node rejects an enum when it
 * strips types rather than compiling them.
 *
 * The removable notification names appear twice, once as a type and once as a
 * runtime list, because an administrator supplies them as text: the
 * configuration check and the shipped settings form both read them at run time.
 */

/**
 * The truthful services every accessory publishes.
 *
 * A user cannot remove one of these. They report what the system reports, so
 * removing one would hide a condition rather than hide a notification.
 */
export type CoreServiceKind =
  | 'sump-pit-flood'
  | 'sump-pit-level'
  | 'primary-pump'
  | 'primary-pump-running'
  | 'backup-pump'
  | 'sump-mains-power'
  | 'backup-battery'
  | 'system-self-test'
  | 'alarm-mute';

/**
 * The notification sensors a user may remove from the configuration.
 *
 * Each name is the configuration slug for its adapter. Removing one removes
 * that sensor alone: the condition, the counters, the timestamps, and the
 * truthful service all stay.
 */
export type NotificationServiceKind =
  | 'backup-pump-activated'
  | 'mains-power-lost'
  | 'primary-pump-fault'
  | 'backup-pump-fault'
  | 'water-sensor-fault'
  | 'pump-controller-link-lost'
  | 'basement-guardian-offline';

/**
 * The removable notification names, in the order the type declares them.
 *
 * This is the one runtime source the configuration refusal and the shipped
 * settings-form enum both trace to, so neither can offer a name the type does
 * not declare.
 */
export const NOTIFICATION_SERVICE_KINDS: readonly NotificationServiceKind[] = [
  'backup-pump-activated',
  'mains-power-lost',
  'primary-pump-fault',
  'backup-pump-fault',
  'water-sensor-fault',
  'pump-controller-link-lost',
  'basement-guardian-offline',
];

// `Array.includes` requires an argument of the element type, so membership is
// tested through a widened view of the same list rather than an assertion.
const NOTIFICATION_SERVICE_NAMES: readonly string[] = NOTIFICATION_SERVICE_KINDS;

/**
 * Answers whether a supplied value names one of the removable notification sensors.
 *
 * The value arrives from a hand-edited `config.json`, so it is checked as
 * `unknown` rather than trusted to be text.
 */
export function isNotificationServiceKind(value: unknown): value is NotificationServiceKind {
  return typeof value === 'string' && NOTIFICATION_SERVICE_NAMES.includes(value);
}

/** Every service kind this plugin can publish. */
export type ServiceKind = CoreServiceKind | NotificationServiceKind;

/**
 * One service published on one accessory.
 *
 * `kind` and `subtype` do not key a descriptor on their own: the backup battery
 * publishes twice under one kind and one subtype, once as the standard Battery
 * service and once as the vendor facts service. `serviceUuid` is the HAP type
 * identifier that tells those two apart, so `kind`, `subtype`, and
 * `serviceUuid` together are the key.
 */
export interface ServiceDescriptor {
  kind: ServiceKind;
  /** The stable HomeKit subtype. It never changes for a given service. */
  subtype: string;
  /** The HAP service type identifier, which is what tells two rows of one kind and subtype apart. */
  serviceUuid: string;
  /** The name HomeKit shows for the service. */
  name: string;
}
