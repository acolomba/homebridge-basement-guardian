/**
 * @fileoverview One row per published service, and the get-or-add, remove, and
 * push helpers an accessory drives them with.
 *
 * The catalogue is the one place a decoded fact becomes a HomeKit value, which
 * makes it the last point at which a wrong value can still be refused: HAP
 * clamps an out-of-range value into a plausible reading rather than rejecting
 * it, so a `ContactSensorState` of 7 publishes as the alarm state nobody
 * reported. Every value a row projects is therefore one of the characteristic's
 * own declared constants or a value read verbatim from decoded state, and no
 * arithmetic reaches a projection.
 *
 * A row that cannot vouch for a fact projects nothing for it at all rather than
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

import type { CharacteristicClass, CustomCharacteristics } from './customCharacteristics.js';
import type { CustomServices, ServiceClass } from './customServices.js';
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
   * The rule is per value rather than per row, because several rows read more
   * than one decoded scope group: a row publishes a value only when the group
   * that value reads decoded and the scope owning that group is either trusted
   * or untrusted for a reason this row tolerates. `Sump Pit Level` therefore
   * keeps publishing a trustworthy water level while the `fault` scope is
   * untrusted, and withholds only the fault-sourced values.
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
  values: (input: ProjectionInput, trust: RowTrust) => readonly ProjectedValue[];
}

/** One value a row would publish, absent when the fact it reads did not decode or is not trustworthy. */
interface Candidate {
  characteristic: CharacteristicClass;
  value: CharacteristicValue | undefined;
}

/** What one pump reports, before the catalogue turns it into published values. */
interface PumpFacts {
  running: boolean | undefined;
  faulted: boolean | undefined;
  fuseBlown: boolean | undefined;
  /** The condition the owning service's `StatusFault` follows, which merges the fuse on the backup pump. */
  serviceFaulted: boolean | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

// One scope group of the family-neutral decoded state, read structurally so this
// module stays ignorant of any one family's type (D-003), and answered only
// while this row may still vouch for the scope that owns it. `undefined` means
// the group did not decode or the scope is untrusted, never that the facts in it
// are absent from the device.
function trustedGroup(input: ProjectionInput, trust: RowTrust, scope: TrustScope): Record<string, unknown> | undefined {
  if (!isRowTrusted({ scope, toleratedDistrust: trust.toleratedDistrust }, input.untrustedScopes)) {
    return undefined;
  }

  const group = isRecord(input.decoded) ? input.decoded[scope] : undefined;

  return isRecord(group) ? group : undefined;
}

function booleanOf(group: Record<string, unknown> | undefined, field: string): boolean | undefined {
  const value = group?.[field];

  return typeof value === 'boolean' ? value : undefined;
}

function numberOf(group: Record<string, unknown> | undefined, field: string): number | undefined {
  const value = group?.[field];

  return typeof value === 'number' ? value : undefined;
}

// A row publishes only the facts it can vouch for: an absent one is omitted
// rather than defaulted, so the last trustworthy value stays published and no
// service ever reads as a normal the device never reported (D-014, RES-01).
function published(candidates: readonly Candidate[]): readonly ProjectedValue[] {
  const values: ProjectedValue[] = [];

  for (const candidate of candidates) {
    if (candidate.value !== undefined) {
      values.push({ characteristic: candidate.characteristic, value: candidate.value });
    }
  }

  return values;
}

// The one place the project's alarm convention lives: `CONTACT_NOT_DETECTED`
// is the activated state, so an Apple Home tile reads "Open" when there is
// something to act on.
function contactState(hap: API['hap'], activated: boolean | undefined): CharacteristicValue | undefined {
  const { ContactSensorState } = hap.Characteristic;

  if (activated === undefined) {
    return undefined;
  }

  return activated ? ContactSensorState.CONTACT_NOT_DETECTED : ContactSensorState.CONTACT_DETECTED;
}

function faultState(hap: API['hap'], faulted: boolean | undefined): CharacteristicValue | undefined {
  const { StatusFault } = hap.Characteristic;

  if (faulted === undefined) {
    return undefined;
  }

  return faulted ? StatusFault.GENERAL_FAULT : StatusFault.NO_FAULT;
}

function lowBatteryState(hap: API['hap'], low: boolean | undefined): CharacteristicValue | undefined {
  const { StatusLowBattery } = hap.Characteristic;

  if (low === undefined) {
    return undefined;
  }

  return low ? StatusLowBattery.BATTERY_LEVEL_LOW : StatusLowBattery.BATTERY_LEVEL_NORMAL;
}

// `NOT_CHARGEABLE` is never published: no vendor field sources it, and a
// charging state stopping for the eight seconds a self-test takes is normal
// rather than a fault (D-008).
function chargingState(hap: API['hap'], charging: boolean | undefined): CharacteristicValue | undefined {
  const { ChargingState } = hap.Characteristic;

  if (charging === undefined) {
    return undefined;
  }

  return charging ? ChargingState.CHARGING : ChargingState.NOT_CHARGING;
}

function leakState(hap: API['hap'], flooded: boolean | undefined): CharacteristicValue | undefined {
  const { LeakDetected } = hap.Characteristic;

  if (flooded === undefined) {
    return undefined;
  }

  return flooded ? LeakDetected.LEAK_DETECTED : LeakDetected.LEAK_NOT_DETECTED;
}

// An absent fact stays absent through the negation, so an undecoded reading
// never becomes the quiet half of a two-state adapter.
function inverted(fact: boolean | undefined): boolean | undefined {
  return fact === undefined ? undefined : !fact;
}

// The backup fault covers a blown or missing fuse as well as the pump's own
// reported fault. Both raw causes stay separately readable on the custom
// `Backup Pump` service, so the exact cause is never lost to the merge, and a
// group missing either fact yields no verdict rather than a quiet one.
function backupPumpFaulted(fault: Record<string, unknown> | undefined): boolean | undefined {
  const faulted = booleanOf(fault, 'backupPumpFault');
  const fuseBlown = booleanOf(fault, 'backupPumpFuseBlown');

  if (faulted === undefined || fuseBlown === undefined) {
    return undefined;
  }

  return faulted || fuseBlown;
}

// The flood verdict and the level percentage both come from the decoded `water`
// group, which already carries them from the family adapter. The level meaning
// lives behind the family boundary, so this module never imports the ladder: a
// second call site would be a second place to change when `G-002` closes.
function floodValues(hap: API['hap'], input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const flooded = booleanOf(trustedGroup(input, trust, 'water'), 'flooded');

  return published([{ characteristic: hap.Characteristic.LeakDetected, value: leakState(hap, flooded) }]);
}

// The raw thermometer code publishes beside the mapped percentage, so the
// provisional ladder stays checkable against a real pit without a debug build
// (D-015, SAFE-08).
function sumpPitLevelValues(hap: API['hap'], characteristics: CustomCharacteristics, input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const water = trustedGroup(input, trust, 'water');
  const waterSensorFault = booleanOf(trustedGroup(input, trust, 'fault'), 'waterSensorFault');

  return published([
    { characteristic: hap.Characteristic.WaterLevel, value: numberOf(water, 'levelPercent') },
    { characteristic: characteristics.RawWaterLevelCode, value: numberOf(water, 'levelCode') },
    { characteristic: characteristics.WaterSensorFaultReported, value: waterSensorFault },
    { characteristic: hap.Characteristic.StatusFault, value: faultState(hap, waterSensorFault) },
  ]);
}

function pumpValues(hap: API['hap'], characteristics: CustomCharacteristics, facts: PumpFacts): readonly ProjectedValue[] {
  return published([
    { characteristic: characteristics.PumpRunning, value: facts.running },
    { characteristic: characteristics.PumpFault, value: facts.faulted },
    { characteristic: characteristics.PumpFuseBlown, value: facts.fuseBlown },
    { characteristic: hap.Characteristic.StatusFault, value: faultState(hap, facts.serviceFaulted) },
  ]);
}

function primaryPumpValues(hap: API['hap'], characteristics: CustomCharacteristics, input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const faulted = booleanOf(trustedGroup(input, trust, 'fault'), 'primaryPumpFault');

  return pumpValues(hap, characteristics, {
    running: booleanOf(trustedGroup(input, trust, 'pump'), 'primaryRunning'),
    faulted,
    // The primary pump reports no fuse fact, which is why the custom service
    // declares that characteristic optional rather than required.
    fuseBlown: undefined,
    serviceFaulted: faulted,
  });
}

function backupPumpValues(hap: API['hap'], characteristics: CustomCharacteristics, input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const fault = trustedGroup(input, trust, 'fault');

  return pumpValues(hap, characteristics, {
    running: booleanOf(trustedGroup(input, trust, 'pump'), 'backupRunning'),
    faulted: booleanOf(fault, 'backupPumpFault'),
    fuseBlown: booleanOf(fault, 'backupPumpFuseBlown'),
    serviceFaulted: backupPumpFaulted(fault),
  });
}

// The two live activity adapters read one pump boolean and nothing else. A
// backup run shows that water reached the backup-pump threshold or that inflow
// exceeded the primary pump's capacity; it establishes neither mains loss nor
// primary-pump failure, and both of those have their own signals. So a
// self-test in progress, an absent activation timestamp, a mains loss, and a
// primary-pump fault all leave this adapter exactly where the running boolean
// puts it (C-001, SAFE-03).
function pumpActivityValues(hap: API['hap'], input: ProjectionInput, trust: RowTrust, field: string): readonly ProjectedValue[] {
  const running = booleanOf(trustedGroup(input, trust, 'pump'), field);

  return published([{ characteristic: hap.Characteristic.ContactSensorState, value: contactState(hap, running) }]);
}

function mainsPowerValues(characteristics: CustomCharacteristics, input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const mainsPresent = booleanOf(trustedGroup(input, trust, 'power'), 'mainsPresent');

  return published([{ characteristic: characteristics.MainsPowerPresent, value: mainsPresent }]);
}

function mainsPowerLostValues(hap: API['hap'], input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const mainsPresent = booleanOf(trustedGroup(input, trust, 'power'), 'mainsPresent');

  return published([
    { characteristic: hap.Characteristic.ContactSensorState, value: contactState(hap, inverted(mainsPresent)) },
    // Mains loss is a condition the device reports, not a fault of the power
    // service, so `StatusFault` stays at `NO_FAULT` in both states (D-008).
    { characteristic: hap.Characteristic.StatusFault, value: mainsPresent === undefined ? undefined : hap.Characteristic.StatusFault.NO_FAULT },
  ]);
}

// The backup battery is published twice: the standard service carries the
// documented 25/50/75/100 protection-duration estimates and the low-battery
// indicator, and the facts service carries the exact vendor codes beside them so
// anyone can check one against the other. Neither reads the other's fields.
// Correcting a reported protection band because the health code says the battery
// is absent would be exactly the guess the safety rule forbids, so both facts are
// published as reported and `StatusLowBattery` carries the warning (D-007,
// D-008, D-012). Battery health, replacement, and protection duration are never
// represented through filter-maintenance semantics (D-021, SAFE-06).
function batteryValues(hap: API['hap'], input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const battery = trustedGroup(input, trust, 'battery');

  return published([
    { characteristic: hap.Characteristic.StatusLowBattery, value: lowBatteryState(hap, booleanOf(battery, 'low')) },
    { characteristic: hap.Characteristic.BatteryLevel, value: numberOf(battery, 'levelPercent') },
    { characteristic: hap.Characteristic.ChargingState, value: chargingState(hap, booleanOf(battery, 'charging')) },
  ]);
}

function batteryFactsValues(characteristics: CustomCharacteristics, input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const battery = trustedGroup(input, trust, 'battery');

  return published([
    { characteristic: characteristics.BatteryCharging, value: booleanOf(battery, 'charging') },
    { characteristic: characteristics.BatteryVoltageLow, value: booleanOf(battery, 'voltageLow') },
    { characteristic: characteristics.BatteryHealthCode, value: numberOf(battery, 'healthCode') },
    { characteristic: characteristics.ProtectionHoursCode, value: numberOf(battery, 'protectionHoursCode') },
  ]);
}

// Five conditions, five adapters, five causes. Reducing them to one tile would
// tell an owner that something is wrong without telling them what, which is the
// failure a sump-pump alert exists to avoid, so no aggregate row is ever
// published and each adapter transitions on its own condition alone (SAFE-04,
// D-008).
function faultAdapterValues(hap: API['hap'], faulted: boolean | undefined, extra: readonly Candidate[] = []): readonly ProjectedValue[] {
  return published([
    { characteristic: hap.Characteristic.ContactSensorState, value: contactState(hap, faulted) },
    { characteristic: hap.Characteristic.StatusFault, value: faultState(hap, faulted) },
    ...extra,
  ]);
}

// The network module knows its own link state directly, so this one adapter
// stays truthful while everything downstream of the controller does not. A
// `serial_communications` field that failed validation is a different matter:
// the link state is then unknown rather than known-lost, the row's own scope is
// untrusted for a reason it does not tolerate, and it publishes nothing
// (D-11, RES-02).
function controllerLinkValues(hap: API['hap'], characteristics: CustomCharacteristics, input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const linkPresent = booleanOf(trustedGroup(input, trust, 'fault'), 'controllerLinkPresent');

  return faultAdapterValues(hap, inverted(linkPresent), [
    { characteristic: characteristics.ControllerLinkPresent, value: linkPresent },
    // The time the accessory last had trustworthy controller-derived state
    // publishes beside the link state rather than on its own, so a row that
    // cannot vouch for the link never publishes a time that would read as
    // evidence about it (RES-02).
    { characteristic: characteristics.ControllerDataLastTrustedAt, value: linkPresent === undefined ? undefined : input.controllerDataLastTrustedAt },
  ]);
}

// The offline adapter reads the accessory's own confirmation count, never a
// reported field: `data.offline` is what the device says about itself, and a
// physical-device alert raised from it would fire on a transport hiccup
// (RES-03, D-016).
function offlineValues(hap: API['hap'], input: ProjectionInput): readonly ProjectedValue[] {
  return published([{ characteristic: hap.Characteristic.ContactSensorState, value: contactState(hap, input.offlineConfirmed) }]);
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
      return isRowTrusted(this, input.untrustedScopes) ? values(input, this) : [];
    },
  };
}

function waterDefinitions(hap: API['hap'], characteristics: CustomCharacteristics, services: CustomServices): readonly RowDefinition[] {
  return [
    {
      kind: 'sump-pit-flood',
      displayName: 'Sump Pit Flood',
      scope: 'water',
      toleratedDistrust: [],
      serviceClass: hap.Service.LeakSensor,
      values: (input, trust) => floodValues(hap, input, trust),
    },
    {
      kind: 'sump-pit-level',
      displayName: 'Sump Pit Level',
      scope: 'water',
      toleratedDistrust: [],
      serviceClass: services.SumpPitService,
      values: (input, trust) => sumpPitLevelValues(hap, characteristics, input, trust),
    },
  ];
}

function pumpDefinitions(hap: API['hap'], characteristics: CustomCharacteristics, services: CustomServices): readonly RowDefinition[] {
  return [
    {
      kind: 'primary-pump',
      displayName: 'Primary Pump',
      scope: 'pump',
      toleratedDistrust: [],
      serviceClass: services.PumpService,
      values: (input, trust) => primaryPumpValues(hap, characteristics, input, trust),
    },
    {
      kind: 'primary-pump-running',
      displayName: 'Primary Pump Running',
      scope: 'pump',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input, trust) => pumpActivityValues(hap, input, trust, 'primaryRunning'),
    },
    {
      kind: 'backup-pump',
      displayName: 'Backup Pump',
      scope: 'pump',
      toleratedDistrust: [],
      serviceClass: services.PumpService,
      values: (input, trust) => backupPumpValues(hap, characteristics, input, trust),
    },
    {
      kind: 'backup-pump-activated',
      displayName: 'Backup Pump Activated',
      scope: 'pump',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input, trust) => pumpActivityValues(hap, input, trust, 'backupRunning'),
    },
  ];
}

function powerDefinitions(hap: API['hap'], characteristics: CustomCharacteristics, services: CustomServices): readonly RowDefinition[] {
  return [
    {
      kind: 'sump-mains-power',
      displayName: 'Sump Mains Power',
      scope: 'power',
      toleratedDistrust: [],
      serviceClass: services.SumpMainsPowerService,
      values: (input, trust) => mainsPowerValues(characteristics, input, trust),
    },
    {
      kind: 'mains-power-lost',
      displayName: 'Mains Power Lost',
      scope: 'power',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input, trust) => mainsPowerLostValues(hap, input, trust),
    },
  ];
}

// Two services of one kind under one subtype. They carry different HAP service
// types, so HAP accepts both on one accessory and `getServiceById` tells them
// apart by class (D-12).
function batteryDefinitions(hap: API['hap'], characteristics: CustomCharacteristics, services: CustomServices): readonly RowDefinition[] {
  return [
    {
      kind: 'backup-battery',
      displayName: 'Backup Battery',
      scope: 'battery',
      toleratedDistrust: [],
      serviceClass: hap.Service.Battery,
      values: (input, trust) => batteryValues(hap, input, trust),
    },
    {
      kind: 'backup-battery',
      displayName: 'Backup Battery Facts',
      scope: 'battery',
      toleratedDistrust: [],
      serviceClass: services.BackupBatteryService,
      values: (input, trust) => batteryFactsValues(characteristics, input, trust),
    },
  ];
}

function faultDefinitions(hap: API['hap'], characteristics: CustomCharacteristics): readonly RowDefinition[] {
  return [
    {
      kind: 'primary-pump-fault',
      displayName: 'Primary Pump Fault',
      scope: 'fault',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input, trust) => faultAdapterValues(hap, booleanOf(trustedGroup(input, trust, 'fault'), 'primaryPumpFault')),
    },
    {
      kind: 'backup-pump-fault',
      displayName: 'Backup Pump Fault',
      scope: 'fault',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input, trust) => faultAdapterValues(hap, backupPumpFaulted(trustedGroup(input, trust, 'fault'))),
    },
    {
      kind: 'water-sensor-fault',
      displayName: 'Water Sensor Fault',
      scope: 'fault',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input, trust) => faultAdapterValues(hap, booleanOf(trustedGroup(input, trust, 'fault'), 'waterSensorFault')),
    },
    {
      kind: 'pump-controller-link-lost',
      displayName: 'Pump Controller Link Lost',
      scope: 'fault',
      // The only row that keeps publishing while a lost controller link has made
      // its own scope untrusted, because the network module reports that link
      // state directly (D-11, RES-02).
      toleratedDistrust: ['controller-link-lost'],
      serviceClass: hap.Service.ContactSensor,
      values: (input, trust) => controllerLinkValues(hap, characteristics, input, trust),
    },
  ];
}

function connectivityDefinitions(hap: API['hap']): readonly RowDefinition[] {
  return [
    {
      kind: 'basement-guardian-offline',
      displayName: 'Basement Guardian Offline',
      scope: 'connectivity',
      toleratedDistrust: [],
      serviceClass: hap.Service.ContactSensor,
      values: (input) => offlineValues(hap, input),
    },
  ];
}

/**
 * Answers every service this accessory publishes, in the order it publishes them.
 *
 * The order is the catalogue's own and never depends on configuration or on
 * input, so suppressing one adapter never reorders the rest and no row's output
 * depends on another row having been projected first. Building the catalogue
 * touches nothing outside itself: no accessory is read and no service is added.
 */
export function createServiceCatalogue(hap: API['hap']): readonly ServiceRow[] {
  const characteristics = createCustomCharacteristics(hap);
  const services = createCustomServices(hap);

  const definitions: readonly RowDefinition[] = [
    ...waterDefinitions(hap, characteristics, services),
    ...pumpDefinitions(hap, characteristics, services),
    ...powerDefinitions(hap, characteristics, services),
    ...batteryDefinitions(hap, characteristics, services),
    ...faultDefinitions(hap, characteristics),
    ...connectivityDefinitions(hap),
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
