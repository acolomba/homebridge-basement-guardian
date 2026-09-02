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
import type { DeviceCapability } from '../device/family.js';
import type { DistrustReason, TrustScope, UntrustedScope } from '../device/health.js';
import type { API, CharacteristicValue, PlatformAccessory, Service } from 'homebridge';

/** One characteristic value a row publishes, and the characteristic that carries it. */
export interface ProjectedValue {
  characteristic: CharacteristicClass;
  value: CharacteristicValue;
}

/**
 * What one pump's record says, in the form a row publishes it.
 *
 * Every member arrives already formatted, because this module's own contract is
 * that a published value is one of the characteristic's declared constants or a
 * value read verbatim from its input, and no arithmetic and no date
 * construction reaches a projection. The accessory holds the stored
 * milliseconds and turns them into these strings, exactly as it already does
 * for `controllerDataLastTrustedAt`, so no row reads a clock or keeps state of
 * its own (CTRL-01).
 */
export interface PumpRecordProjection {
  /** ISO-8601 UTC at which observation of this pump began, or the empty string when it never has (CTRL-01, D-020). */
  observationStartedAt: string;
  /** Activations of this pump the plugin watched since that start, never a device or whole-of-life total (CTRL-01, D-020). */
  activationCount: number;
  /** ISO-8601 UTC of the last observed activation, or the empty string when none has been observed (CTRL-01, D-012). */
  lastActivationAt: string;
  /** Whether that last activation was self-test activity, absent until the plugin has earned the label (CTRL-01, D-013). */
  lastActivationWasTestActivity: boolean | undefined;
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
  /**
   * The capabilities carrying an unresolved HomeKit request, whose rows publish
   * nothing for `On` until the device answers (D-05, D-037).
   *
   * Requested control state reaches a row through this member and no other. No
   * reported patch and no shadow topic carries it, so it can never become
   * canonical safety state.
   */
  pendingControls: ReadonlySet<DeviceCapability>;
  /**
   * What the plugin observed the primary pump do, counted from its own
   * observation start (CTRL-01, D-012).
   *
   * Absent until the accessory has observed a snapshot, which is the state
   * before the first update and the state of an accessory whose family has
   * never resolved. An absent record publishes nothing at all rather than a
   * count of zero counted from 1970, which is the whole class of claim the
   * record exists to avoid making (D-020).
   */
  primaryPumpRecord?: PumpRecordProjection;
  /** The same for the backup pump, which is the only one that can carry a self-test label (CTRL-01, D-013). */
  backupPumpRecord?: PumpRecordProjection;
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
   * Every scope this row reads, in `TrustScope` order, starting with the one it
   * is filed under.
   *
   * Several rows read a second scope group beside their own: `Sump Pit Level`
   * reads the reported water sensor fault, and both pump services read their
   * pump's own fault and fuse. A row that answered for its own scope alone
   * would keep calling those values current after the `fault` scope stopped
   * validating, which publishes stale fault telemetry as a normal reading --
   * the exact false normal the trust scoping exists to prevent (D-014, D-05).
   */
  readScopes: readonly TrustScope[];
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
  /**
   * Whether this row earns its service even when it projects nothing.
   *
   * `false` for every row but the controls. See `ensureService` for why the
   * gate exists and why those two are exempt from it (D-03).
   */
  alwaysPublish: boolean;
}

// One row before its trust gate is attached. `values` answers what the row
// would publish from a trustworthy snapshot; `toRow` is the single place the
// gate wraps it, so no row closure repeats the rule.
interface RowDefinition extends RowTrust {
  kind: ServiceKind;
  displayName: string;
  serviceClass: ServiceClass;
  /** Absent for a row that reads its own scope and nothing else, which is most of them. */
  readScopes?: readonly TrustScope[];
  /** Absent for a row that earns its service only when it has something to publish, which is every row but the controls. */
  alwaysPublish?: boolean;
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
  /** What the plugin observed this pump do, already formatted by the accessory, or nothing observed yet (CTRL-01). */
  record: PumpRecordProjection | undefined;
  /** Whether this pump's row carries the self-test label. Only the backup pump's does (D-013). */
  publishesTestActivity: boolean;
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

/** Answers whether a row may publish what arrived, which is not yet a different question. */
export function isRowPublishable(row: RowTrust, untrustedScopes: readonly UntrustedScope[]): boolean {
  return isRowTrusted(row, untrustedScopes);
}

/**
 * Answers whether a row can vouch for every scope it reads, not only the one it
 * is filed under.
 *
 * This is what `StatusActive` reports. A row that reads a second scope group
 * withholds that group's values as soon as the scope owning it stops
 * validating, so the service keeps the values the last trustworthy snapshot
 * produced; calling itself active would publish those retained values as the
 * device's current report. `Status Fault` on a pump service is the reading an
 * owner acts on, so it says nothing about a scope the accessory has already
 * told itself it cannot vouch for (D-014, D-05).
 */
export function isRowFullyTrusted(row: ServiceRow, untrustedScopes: readonly UntrustedScope[]): boolean {
  return row.readScopes.every((scope) => isRowTrusted({ scope, toleratedDistrust: row.toleratedDistrust }, untrustedScopes));
}

/**
 * Answers one scope group of the family-neutral decoded state, or `undefined`
 * when the state or the group is not a record.
 *
 * This is the one structural narrowing of a decoded scope group in the codebase.
 * `decode()` is generic over the family, so the state arrives as `unknown`;
 * reading it here, once, is what stops the accessory and the rows disagreeing
 * about the same payload. Two narrowings can differ about which fields a group
 * carries, and a row would then publish a value the accessory's own observation
 * never saw (D-003).
 *
 * `undefined` means the group did not decode, never that the facts in it are
 * absent from the device.
 */
export function decodedGroup(decoded: unknown, scope: TrustScope): Record<string, unknown> | undefined {
  const group = isRecord(decoded) ? decoded[scope] : undefined;

  return isRecord(group) ? group : undefined;
}

/**
 * Answers a decoded field as a boolean, or `undefined` when the group did not
 * decode or the field is not one.
 */
export function booleanOf(group: Record<string, unknown> | undefined, field: string): boolean | undefined {
  const value = group?.[field];

  return typeof value === 'boolean' ? value : undefined;
}

/**
 * Answers a decoded field as a number, or `undefined` when the group did not
 * decode or the field is not one.
 */
export function numberOf(group: Record<string, unknown> | undefined, field: string): number | undefined {
  const value = group?.[field];

  return typeof value === 'number' ? value : undefined;
}

// The same group, answered only while this row may still vouch for the scope that
// owns it. The structural read is `decodedGroup`'s and is never repeated here.
// `undefined` means the group did not decode or the scope is untrusted, never
// that the facts in it are absent from the device.
function trustedGroup(input: ProjectionInput, trust: RowTrust, scope: TrustScope): Record<string, unknown> | undefined {
  if (!isRowTrusted({ scope, toleratedDistrust: trust.toleratedDistrust }, input.untrustedScopes)) {
    return undefined;
  }

  return decodedGroup(input.decoded, scope);
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

// The record publishes beside the pump's own reported running state and never
// instead of it. `ensureService` adds a service as soon as its row projects
// anything, and `Pump Running` is the one characteristic `PumpService` requires,
// so a row that earned its service on the record alone would add one whose
// required characteristic sat at HAP's `false` default -- a pump reported as not
// running that no device ever reported. This is the same rule that keeps
// `ControllerDataLastTrustedAt` beside the link state it describes (D-014,
// RES-01).
//
// Only the backup pump carries the self-test label: the device reports no
// primary activation timestamp and a self-test runs the backup pump, so nothing
// about a primary run could ever be classified (D-013, C-001).
function recordCandidates(characteristics: CustomCharacteristics, facts: PumpFacts): readonly Candidate[] {
  const record = facts.running === undefined ? undefined : facts.record;
  const classification = facts.publishesTestActivity ? record?.lastActivationWasTestActivity : undefined;

  return [
    { characteristic: characteristics.ObservationStartedAt, value: record?.observationStartedAt },
    { characteristic: characteristics.ObservedActivationCount, value: record?.activationCount },
    { characteristic: characteristics.LastObservedActivationAt, value: record?.lastActivationAt },
    { characteristic: characteristics.LastActivationWasTestActivity, value: classification },
  ];
}

function pumpValues(hap: API['hap'], characteristics: CustomCharacteristics, facts: PumpFacts): readonly ProjectedValue[] {
  return published([
    { characteristic: characteristics.PumpRunning, value: facts.running },
    { characteristic: characteristics.PumpFault, value: facts.faulted },
    { characteristic: characteristics.PumpFuseBlown, value: facts.fuseBlown },
    { characteristic: hap.Characteristic.StatusFault, value: faultState(hap, facts.serviceFaulted) },
    ...recordCandidates(characteristics, facts),
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
    record: input.primaryPumpRecord,
    publishesTestActivity: false,
  });
}

function backupPumpValues(hap: API['hap'], characteristics: CustomCharacteristics, input: ProjectionInput, trust: RowTrust): readonly ProjectedValue[] {
  const fault = trustedGroup(input, trust, 'fault');

  return pumpValues(hap, characteristics, {
    running: booleanOf(trustedGroup(input, trust, 'pump'), 'backupRunning'),
    faulted: booleanOf(fault, 'backupPumpFault'),
    fuseBlown: booleanOf(fault, 'backupPumpFuseBlown'),
    serviceFaulted: backupPumpFaulted(fault),
    record: input.backupPumpRecord,
    publishesTestActivity: true,
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

// A control's Switch follows what the device reports, and publishes nothing at
// all for `On` while a HomeKit request for that capability is unresolved.
//
// The capability is read from the parameter on every call, never closed over
// and never hard-coded: withholding lives in the row, so a helper consulting
// the wrong capability would leave both pending sets perfectly correct and
// still freeze the other control's Switch for the whole window every time this
// one was pressed.
// Withholding rather than publishing is what stops the accessory's per-update
// push from snapping the toggle back before the device confirms; because nothing
// is pushed, HAP keeps serving the value the accepted write left. The whole of
// the rule is one `undefined`, which `published()` already drops (D-05, D-037).
function controlValues(hap: API['hap'], input: ProjectionInput, trust: RowTrust, capability: DeviceCapability, field: string): readonly ProjectedValue[] {
  const reported = booleanOf(trustedGroup(input, trust, capability), field);

  return published([{ characteristic: hap.Characteristic.On, value: input.pendingControls.has(capability) ? undefined : reported }]);
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
  const { kind, displayName, scope, toleratedDistrust, serviceClass, readScopes = [scope], alwaysPublish = false, values } = definition;

  return {
    kind,
    subtype: kind,
    displayName,
    scope,
    toleratedDistrust,
    serviceClass,
    readScopes,
    alwaysPublish,

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
      // The reported water sensor fault publishes beside the level, so this row
      // answers for the `fault` scope as well as its own.
      readScopes: ['water', 'fault'],
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
      // The pump's own reported fault publishes beside its running state, so
      // this row answers for the `fault` scope as well as its own.
      readScopes: ['pump', 'fault'],
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
      // The pump's own reported fault and its fuse publish beside its running
      // state, so this row answers for the `fault` scope as well as its own.
      readScopes: ['pump', 'fault'],
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

// The controls are the two things an owner can do rather than only watch. Each
// is a standard `Switch` whose `On` follows the capability's own reported field,
// and each is filed under its own trust scope, so a bad `alarm_audio_muted`
// deactivates the mute control and leaves self-test fully trustworthy (D-01,
// D-02).
function controlDefinitions(hap: API['hap']): readonly RowDefinition[] {
  return [
    {
      kind: 'system-self-test',
      displayName: 'System Self-Test',
      scope: 'self-test',
      toleratedDistrust: [],
      serviceClass: hap.Service.Switch,
      alwaysPublish: true,
      values: (input, trust) => controlValues(hap, input, trust, 'self-test', 'running'),
    },
    {
      kind: 'alarm-mute',
      displayName: 'Alarm Mute',
      scope: 'alarm-mute',
      toleratedDistrust: [],
      serviceClass: hap.Service.Switch,
      alwaysPublish: true,
      values: (input, trust) => controlValues(hap, input, trust, 'alarm-mute', 'muted'),
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
    ...controlDefinitions(hap),
    ...connectivityDefinitions(hap),
  ];

  return definitions.map((definition) => toRow(definition));
}

/**
 * Answers the service a row already publishes on, or `undefined` when the
 * accessory does not carry it.
 *
 * The lookup always passes the service class rather than its identifier string:
 * the string overload matches a display name only, so it answers `undefined`
 * for an identifier and would turn a get-or-add into an `addService` that
 * throws on the duplicate. Passing the class also matches a service restored
 * from the Homebridge cache, which arrives as a plain `Service` whose class the
 * running code no longer recognises.
 *
 * This is the one lookup an accessory reaches for when it must act on what it
 * already published without publishing anything new.
 */
export function publishedService(accessory: PlatformAccessory, row: ServiceRow): Service | undefined {
  return accessory.getServiceById(row.serviceClass, row.subtype);
}

/**
 * Answers the service a row publishes on, adding it only when the row has
 * something to publish onto it and the accessory does not carry it yet.
 *
 * A row with nothing to vouch for never earns a new service. HAP constructs
 * every characteristic at its format default, and for this plugin's alarm
 * convention those defaults are the good-news values, so an added-but-never-
 * written service reads as a healthy sump pit that no device ever reported:
 * "Leak Not Detected" on an empty pit, a quiet fault sensor, a normal battery.
 * `StatusActive = false` is the only marker of that state, and Apple Home does
 * not show it on the tile. A device whose water field is out of domain from the
 * moment the plugin is installed therefore publishes no `Sump Pit Flood`
 * service at all rather than one reading "no leak" (D-014, D-05, RES-01).
 *
 * A service the accessory already carries is answered whatever the row can
 * publish, so a scope that stops validating keeps its last trustworthy values
 * and still receives its `StatusActive` push.
 *
 * Gating on the projection length is sound only while every *required*
 * characteristic of a row's service class comes from a scope that row is still
 * publishing from. A required characteristic sourced from a second scope group
 * would be constructed as soon as the row projected its own-scope value, and
 * left at the format default HAP gave it, which is the false normal this gate
 * exists to prevent. That alignment is a precondition rather than a
 * coincidence, and the catalogue's own case over every row in every trust state
 * is what holds it.
 *
 * The gate has one named exemption, and a row claims it by setting
 * `alwaysPublish`. It is waived for the control Switches alone, on two grounds
 * that do not hold for any sensor. `On = false` is what the device reports in
 * the overwhelmingly common case -- no test running, no alarm muted -- so the
 * format default is the truth rather than a good-news guess, and a row that
 * cannot vouch for it still carries `StatusActive = false` to say so. And a
 * room holding only sensors does not render in Apple Home at all: the Self-Test
 * Switch is what makes the accessory's room visible, so withholding it until
 * its field first decodes would hide every other service with it (D-03).
 */
export function ensureService(accessory: PlatformAccessory, row: ServiceRow, projected: readonly ProjectedValue[]): Service | undefined {
  const service = publishedService(accessory, row);

  if (service !== undefined) {
    return service;
  }

  return projected.length === 0 && !row.alwaysPublish ? undefined : accessory.addService(row.serviceClass, row.displayName, row.subtype);
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
  const service = publishedService(accessory, row);

  if (service === undefined) {
    return false;
  }

  accessory.removeService(service);

  return true;
}

// Declares a characteristic on a service that neither carries nor declares it,
// which is what every writer below does before it pushes.
//
// The guard is required rather than cosmetic: `addOptionalCharacteristic` is
// not idempotent, so a second call appends a second entry, and a service
// restored from the Homebridge cache carries neither the class nor its
// declaration. Without the declaration HAP warns on every restored accessory
// that the characteristic belongs to no section of the service.
function declareCharacteristic(service: Service, characteristic: CharacteristicClass): void {
  if (!service.testCharacteristic(characteristic) && !service.optionalCharacteristics.some((declared) => declared.UUID === characteristic.UUID)) {
    service.addOptionalCharacteristic(characteristic);
  }
}

/**
 * Pushes one value onto a service, declaring the characteristic first when the
 * service does not already carry or declare it.
 */
export function publishValue(service: Service, characteristic: CharacteristicClass, value: CharacteristicValue): void {
  declareCharacteristic(service, characteristic);

  service.updateCharacteristic(characteristic, value);
}

/**
 * Makes one characteristic unreadable under a named status, and leaves the
 * value it holds exactly where it is.
 *
 * This is the one act `03-CONTEXT.md` D-05 otherwise forbids. Pushing a
 * `HapStatusError` presents the accessory as "No Response", and a degradation
 * that will clear itself must never present that way, because greying out a
 * tile for a condition that fixes itself teaches an owner to ignore the one
 * signal that needs them. `D-10` grants the exception to a single cause -- a
 * vendor refusal of the account credentials -- which never self-clears and
 * which an automatic retry makes worse rather than merely failing to fix, so
 * "requires user action" is literal there and nowhere else (RES-04, D-10).
 *
 * It is a separate function beside `publishValue` rather than a widening of it.
 * An error is not a `CharacteristicValue`, and widening that parameter would
 * let any caller push one and reopen the locked decision for every row; as
 * written, a search for the forbidden act answers exactly one production call
 * site. The verb is the contract, exactly as it is between `publishValue` and
 * `seedConfiguredName`.
 *
 * The stored value survives because HAP assigns the status and returns before
 * it validates or stores anything, so preserve-and-mark does not become
 * preserve-and-erase (D-014). `test/accessories/hapWriteFidelity.test.ts` holds
 * the hand-built stand-in to that ordering against the pinned real package.
 */
export function publishPersistentFailure(hap: API['hap'], service: Service, characteristic: CharacteristicClass, status: number): void {
  declareCharacteristic(service, characteristic);

  service.updateCharacteristic(characteristic, new hap.HapStatusError(status));
}

/**
 * Names a service for a controller, and never over a name a user already gave
 * it.
 *
 * A controller labels a secondary service of a bridged accessory by
 * `ConfiguredName` rather than by `Name`, so a sensor published without one
 * reads as "Contact Sensor 4" where `SAFE-04` promised the owner a named cause.
 *
 * The write happens once. `ConfiguredName` is paired-write, and
 * `Characteristic.serialize` writes its value into the Homebridge accessory
 * cache, so a rename a user makes survives a restart; pushing on every update
 * would destroy a name the user set and expected to keep, on every poll. This
 * is the rule the plugin applies to reported device state, applied to a name
 * the user rather than the device is the authority on (D-14). The verb is the
 * contract: this seeds where `publishValue` publishes, and the two must not be
 * confused.
 *
 * The name comes from `RowDefinition.displayName` alone, which is the same
 * string `Name` already carries, so no second list of service names can drift
 * from the catalogue.
 *
 * `testCharacteristic` is asked before `getCharacteristic` because the real HAP
 * creates a declared-but-absent characteristic on the way out of
 * `getCharacteristic`, which would name a service the caller only meant to
 * inspect.
 */
export function seedConfiguredName(hap: API['hap'], service: Service, displayName: string): void {
  const characteristic = hap.Characteristic.ConfiguredName;

  declareCharacteristic(service, characteristic);

  const current = service.testCharacteristic(characteristic) ? service.getCharacteristic(characteristic).value : undefined;

  if (typeof current === 'string' && current !== '') {
    return;
  }

  service.updateCharacteristic(characteristic, displayName);
}
