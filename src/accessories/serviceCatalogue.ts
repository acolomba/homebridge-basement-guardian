/**
 * @fileoverview One row per published service, and the get-or-add, remove, and
 * push helpers an accessory drives them with.
 *
 * The catalogue is the one place a decoded fact becomes a HomeKit value, which
 * makes it the last point at which a wrong value can still be refused: HAP
 * clamps an out-of-range value into a plausible reading rather than rejecting
 * it, so a `ContactSensorState` of 7 publishes as the alarm state nobody
 * reported. Every value a row projects is therefore one of the characteristic's
 * own declared constants or a boolean read verbatim from decoded state, and no
 * arithmetic reaches a projection.
 *
 * A row that cannot vouch for its own scope projects nothing at all rather than
 * projecting a default, so the last value a trustworthy snapshot produced stays
 * published while the accessory marks the row inactive (D-014, RES-01).
 *
 * The subtype of every row is its `ServiceKind` slug verbatim. HomeKit
 * identifies a service by type together with subtype, so that string is a
 * user-facing contract from the first release and it is also the token an
 * administrator types into `ignoredFaults` (D-12).
 */

import { createCustomCharacteristics } from './customCharacteristics.js';
import { createCustomServices } from './customServices.js';

import type { CharacteristicClass } from './customCharacteristics.js';
import type { ServiceClass } from './customServices.js';
import type { ServiceKind } from './services.js';
import type { DistrustReason, TrustScope, UntrustedScope } from '../device/health.js';
import type { API, CharacteristicValue, PlatformAccessory, Service } from 'homebridge';

/** One characteristic value a row publishes, and the characteristic that carries it. */
export interface ProjectedValue {
  characteristic: CharacteristicClass;
  value: CharacteristicValue;
}

/** Everything a row reads to decide what it publishes. */
export interface ProjectionInput {
  /**
   * The family's decoded domain state.
   *
   * It arrives as `unknown` because the registry hands the accessory a
   * family-neutral outcome and `decode()` is generic over the family. This
   * module performs the one structural narrowing per scope group, so no row
   * repeats it and no row reaches for a `as` (D-003).
   */
  decoded: unknown;
  /**
   * Every scope the accessory currently cannot vouch for, with the reason.
   *
   * The reasons travel with the scopes rather than being flattened to a bare
   * set, because a row can be trustworthy for one distrust reason and not
   * another: the network module knows its own link state directly, so the
   * controller-link adapter stays truthful while everything downstream of the
   * controller does not.
   */
  untrustedScopes: readonly UntrustedScope[];
  /** Whether the configured number of consecutive disconnected polls has been reached (RES-03, D-09). */
  offlineConfirmed: boolean;
  /**
   * The ISO-8601 UTC time the `fault` scope -- the scope that owns
   * `serial_communications` -- last decoded, or the empty string when it never
   * has.
   *
   * `RES-02` requires a service to expose this, and the accessory formats it so
   * that no row reads a clock or keeps state of its own.
   */
  controllerDataLastTrustedAt: string;
}

/** The trust facts a row is judged by. */
export interface RowTrust {
  /** The scope whose decoded state this row publishes. */
  scope: TrustScope;
  /** The distrust reasons for which this row keeps publishing and stays active anyway. */
  toleratedDistrust: readonly DistrustReason[];
}

/** One service this accessory publishes. */
export interface ServiceRow extends RowTrust {
  kind: ServiceKind;
  /** The stable HomeKit subtype: the `kind` slug verbatim (D-12). */
  subtype: string;
  /** The name HomeKit shows for the service. */
  displayName: string;
  serviceClass: ServiceClass;
  /**
   * The values to publish, or nothing at all when this row cannot vouch for them.
   *
   * The trust gate reads the row the call is made on rather than a copy captured
   * when the catalogue was built, so a row derived from another with a different
   * `toleratedDistrust` is judged by its own list.
   */
  project(this: ServiceRow, input: ProjectionInput): readonly ProjectedValue[];
}

// One row before its trust gate is attached. `values` answers what the row
// would publish from a trustworthy snapshot; `toRow` is the single place the
// gate wraps it, so no row closure repeats the rule.
interface RowDefinition extends RowTrust {
  kind: ServiceKind;
  displayName: string;
  serviceClass: ServiceClass;
  values: (input: ProjectionInput) => readonly ProjectedValue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// The `power` group of the family-neutral decoded state, read structurally so
// this module stays ignorant of any one family's type (D-003). `undefined`
// means the scope did not decode, never that mains power is absent.
function mainsPresentOf(decoded: unknown): boolean | undefined {
  const power = isRecord(decoded) ? decoded.power : undefined;
  const mainsPresent = isRecord(power) ? power.mainsPresent : undefined;

  return typeof mainsPresent === 'boolean' ? mainsPresent : undefined;
}

// The one place the project's alarm convention lives: `CONTACT_NOT_DETECTED`
// is the activated state, so an Apple Home tile reads "Open" when there is
// something to act on.
function contactState(hap: API['hap'], activated: boolean): CharacteristicValue {
  const { ContactSensorState } = hap.Characteristic;

  return activated ? ContactSensorState.CONTACT_NOT_DETECTED : ContactSensorState.CONTACT_DETECTED;
}

function mainsPowerValues(mainsPowerPresent: CharacteristicClass, input: ProjectionInput): readonly ProjectedValue[] {
  const mainsPresent = mainsPresentOf(input.decoded);

  return mainsPresent === undefined ? [] : [{ characteristic: mainsPowerPresent, value: mainsPresent }];
}

// Mains loss is a condition the device reports, not a fault of the power
// service, so `StatusFault` stays at `NO_FAULT` in both states (D-008).
function mainsPowerLostValues(hap: API['hap'], input: ProjectionInput): readonly ProjectedValue[] {
  const mainsPresent = mainsPresentOf(input.decoded);

  if (mainsPresent === undefined) {
    return [];
  }

  return [
    { characteristic: hap.Characteristic.ContactSensorState, value: contactState(hap, !mainsPresent) },
    { characteristic: hap.Characteristic.StatusFault, value: hap.Characteristic.StatusFault.NO_FAULT },
  ];
}

// The offline adapter reads the accessory's own confirmation count, never a
// reported field: `data.offline` is what the device says about itself, and a
// physical-device alert raised from it would fire on a transport hiccup
// (RES-03, D-016).
function offlineValues(hap: API['hap'], input: ProjectionInput): readonly ProjectedValue[] {
  return [{ characteristic: hap.Characteristic.ContactSensorState, value: contactState(hap, input.offlineConfirmed) }];
}

/**
 * Answers whether a row can still vouch for what it publishes.
 *
 * A row is trustworthy while no untrusted scope of its own carries a reason it
 * does not tolerate. This is the one rule behind both halves of the safety
 * contract: an untrustworthy row projects nothing, and the accessory publishes
 * `StatusActive = false` for it (D-014, D-05).
 */
export function isRowTrusted(row: RowTrust, untrustedScopes: readonly UntrustedScope[]): boolean {
  return !untrustedScopes.some((untrusted) => untrusted.scope === row.scope && !row.toleratedDistrust.includes(untrusted.reason));
}

function toRow(definition: RowDefinition): ServiceRow {
  const { kind, displayName, scope, toleratedDistrust, serviceClass, values } = definition;

  return {
    kind,
    subtype: kind,
    displayName,
    scope,
    toleratedDistrust,
    serviceClass,

    project(input) {
      return isRowTrusted(this, input.untrustedScopes) ? values(input) : [];
    },
  };
}

/**
 * Answers every service this accessory publishes, in the order it publishes them.
 *
 * The order is the catalogue's own and never depends on configuration, so
 * suppressing one adapter never reorders the rest. Building the catalogue
 * touches nothing outside itself: no accessory is read and no service is added.
 */
export function createServiceCatalogue(hap: API['hap']): readonly ServiceRow[] {
  const { MainsPowerPresent } = createCustomCharacteristics(hap);
  const { SumpMainsPowerService } = createCustomServices(hap);

  const definitions: readonly RowDefinition[] = [
    {
      kind: 'sump-mains-power',
      displayName: 'Sump Mains Power',
      scope: 'power',
      toleratedDistrust: [],
      serviceClass: SumpMainsPowerService,
      values: (input) => mainsPowerValues(MainsPowerPresent, input),
    },
    {
      kind: 'mains-power-lost',
      displayName: 'Mains Power Lost',
      scope: 'power',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input) => mainsPowerLostValues(hap, input),
    },
    {
      kind: 'basement-guardian-offline',
      displayName: 'Basement Guardian Offline',
      scope: 'connectivity',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input) => offlineValues(hap, input),
    },
  ];

  return definitions.map((definition) => toRow(definition));
}

/**
 * Answers the service a row publishes on, adding it when the accessory does not
 * carry it yet.
 *
 * The lookup always passes the service class rather than its identifier string:
 * the string overload matches a display name only, so it answers `undefined`
 * for an identifier and turns this get-or-add into an `addService` that throws
 * on the duplicate. Passing the class also matches a service restored from the
 * Homebridge cache, which arrives as a plain `Service` whose class the running
 * code no longer recognises.
 */
export function ensureService(accessory: PlatformAccessory, row: ServiceRow): Service {
  return accessory.getServiceById(row.serviceClass, row.subtype) ?? accessory.addService(row.serviceClass, row.displayName, row.subtype);
}

/**
 * Removes the service a row publishes on, and answers whether one was there.
 *
 * Removing one adapter removes one Apple Home sensor and nothing else: the
 * decoded condition, the owning service, and every other row stay exactly as
 * they were, because an administrator asked to see one fewer notification, not
 * to stop monitoring (CONF-06, D-017).
 */
export function removeServiceIfPresent(accessory: PlatformAccessory, row: ServiceRow): boolean {
  const service = accessory.getServiceById(row.serviceClass, row.subtype);

  if (service === undefined) {
    return false;
  }

  accessory.removeService(service);

  return true;
}

/**
 * Pushes one value onto a service, declaring the characteristic first when the
 * service does not already carry or declare it.
 *
 * The guard is required rather than cosmetic: `addOptionalCharacteristic` is
 * not idempotent, so a second call appends a second entry, and a service
 * restored from the Homebridge cache carries neither the class nor its
 * declaration. Without the declaration HAP warns on every restored accessory
 * that the characteristic belongs to no section of the service.
 */
export function publishValue(service: Service, characteristic: CharacteristicClass, value: CharacteristicValue): void {
  if (!service.testCharacteristic(characteristic) && !service.optionalCharacteristics.some((declared) => declared.UUID === characteristic.UUID)) {
    service.addOptionalCharacteristic(characteristic);
  }

  service.updateCharacteristic(characteristic, value);
}
