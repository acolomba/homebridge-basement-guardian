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
 * This module is a declaration only. Its entry in the `ignoreFindings` list of
 * `.fallowrc.json` goes away when a production consumer arrives.
 */

/**
 * The truthful services every accessory publishes.
 *
 * A user cannot remove one of these. They report what the system reports, so
 * removing one would hide a condition rather than hide a notification.
 */
export type CoreServiceKind =
  'sump-pit-flood' | 'sump-pit-level' | 'primary-pump' | 'backup-pump' | 'sump-mains-power' | 'backup-battery' | 'system-self-test' | 'alarm-mute';

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

/** Every service kind this plugin can publish. */
export type ServiceKind = CoreServiceKind | NotificationServiceKind;

/** One service published on one accessory. */
export interface ServiceDescriptor {
  kind: ServiceKind;
  /** The stable HomeKit subtype. It never changes for a given service. */
  subtype: string;
  /** The name HomeKit shows for the service. */
  name: string;
}
