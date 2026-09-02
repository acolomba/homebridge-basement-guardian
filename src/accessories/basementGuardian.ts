/**
 * @fileoverview One physical Basement Guardian system, published to HomeKit as
 * one accessory carrying several services.
 *
 * The accessory owns HomeKit and nothing else. It walks the service catalogue
 * and pushes characteristic updates; it never sees a raw vendor payload, a
 * shadow document, or a retry policy. Its identity is seeded by the vendor
 * `deviceId`, which is immutable: a device that starts reporting a different
 * `deviceTypeId` selects a different adapter but stays the same physical
 * accessory, so the user's automations survive.
 *
 * `update()` re-resolves the family registry and re-validates on every call. A
 * `deviceTypeId` that stops resolving to an implemented family degrades every
 * controller-derived scope in place: it marks the services it has already
 * published for those scopes inactive while leaving their last trustworthy
 * values exactly where they are, and it never calls `decode()`, never touches
 * `AccessoryInformation`, and never adds a second one (every
 * `PlatformAccessory` already carries one from its own construction). The
 * confirmed-offline adapter is not one of those services: it reads the
 * accessory's own count of consecutive disconnected polls rather than anything
 * an adapter decoded, so it keeps counting and keeps reporting (RES-03). A
 * payload that fails one field's shape costs only the scope that field owns,
 * because the family still decodes every scope whose own fields validated
 * (D-014).
 *
 * Nothing here registers an `onGet` handler or a HAP `GET` event listener.
 * Every value reaches HomeKit by being pushed, so HAP serves the last pushed
 * value directly and a read never reaches the network (RES-04). Degradation is
 * reported only through `StatusActive` and the computed `untrusted` scopes; it
 * never throws `HapStatusError` and never pushes an `Error` through a
 * characteristic, either of which would produce Apple Home's sticky No Response
 * state and erase exactly the retained last-valid values the safety rule
 * requires the accessory to keep (D-014, DEV-08).
 */

import { createControlBinder } from './controls.js';
import { createPumpRecords } from './pumpRecords.js';
import {
  booleanOf,
  createServiceCatalogue,
  decodedGroup,
  ensureService,
  isRowFullyTrusted,
  numberOf,
  publishedService,
  publishValue,
  removeServiceIfPresent,
  seedConfiguredName,
} from './serviceCatalogue.js';
import { isNotificationServiceKind } from './services.js';

import type { PumpRecordsObservation, PumpRecordValues } from './pumpRecords.js';
import type { ProjectionInput, PumpRecordProjection, ServiceRow } from './serviceCatalogue.js';
import type { NotificationServiceKind, ServiceDescriptor, ServiceKind } from './services.js';
import type { DeviceCapability, FamilyValidation } from '../device/family.js';
import type { DistrustReason, TrustScope, UntrustedScope } from '../device/health.js';
import type { FamilyRegistry } from '../device/registry.js';
import type { DeviceSnapshot } from '../device/state.js';
import type { AccessoryStore } from '../runtime/accessoryStore.js';
import type { CommandPort } from '../runtime/commandPort.js';
import type { MonitoringTrust } from '../runtime/monitoringHealth.js';
import type { Timers } from '../runtime/timers.js';
import type { API, Logging, PlatformAccessory, Service } from 'homebridge';

/**
 * Where one snapshot came from.
 *
 * Only a successful REST inventory response is evidence about whether the
 * vendor can still reach the device, so `'poll'` is the one source that may
 * advance or reset the offline confirmation run. `'live'` names canonical state
 * that changed between polls and reaches HomeKit on the store's own change
 * notification; it publishes everything a poll publishes and says nothing about
 * reachability, because it never observed a request succeed (RES-03, D-09).
 */
export type SnapshotSource = 'poll' | 'live';

/** One physical system as HomeKit sees it. */
export interface BasementGuardianAccessory {
  /** The vendor identifier that seeds the accessory UUID. It never changes. */
  readonly deviceId: string;
  /** Every service this accessory currently publishes, in the catalogue's declared order. */
  readonly services: readonly ServiceDescriptor[];
  /**
   * The scopes this accessory currently cannot vouch for.
   *
   * Empty while the family registry keeps resolving this accessory's
   * snapshots to an implemented, fully validating family. One entry per scope
   * that owns an invalid field, so a single bad value costs one scope rather
   * than the whole device; every non-connectivity `TrustScope` the moment the
   * registry stops resolving an implemented family at all, which is the one
   * failure no adapter can narrow (D-014, DEV-08).
   */
  readonly untrusted: readonly UntrustedScope[];
  /**
   * Applies one canonical snapshot to the published characteristics.
   *
   * This is the only way state reaches HomeKit, so a value the accessory does
   * not receive here is a value HomeKit does not show. It runs to completion
   * synchronously: nothing is awaited and nothing is scheduled, so two updates
   * cannot interleave and a suppression cannot be observed half-applied.
   */
  update(snapshot: DeviceSnapshot, source: SnapshotSource): void;
  /**
   * Applies what the plugin can currently say about its own ability to observe
   * this account.
   *
   * A lost monitoring path is a fact about the plugin rather than about the
   * device, so it withdraws trust and publishes no value of its own: every
   * characteristic keeps the last reading this accessory vouched for and only
   * the vouching stops. It never activates an adapter that asserts a device
   * condition, because the plugin seeing less is not the device saying
   * anything (D-01, D-02, D-014).
   */
  markMonitoring(trust: MonitoringTrust): void;
}

/** Everything the accessory factory needs, by injection. */
export interface BasementGuardianAccessoryOptions {
  accessory: PlatformAccessory;
  hap: API['hap'];
  registry: FamilyRegistry;
  log: Logging;
  /**
   * Deferred execution.
   *
   * The accessory schedules nothing across `update()`: it publishes
   * synchronously, so a test hands in a stand-in that records calls and asserts
   * it recorded none across a whole transition, which is evidence about an
   * absence that watching behaviour alone cannot give (SAFE-07, D-18).
   *
   * The write path is the one place a deferral exists, and it exists because
   * HAP requires it: the push that makes a refused control readable again has
   * to run after HAP's own catch has stored the refusal status. That is the
   * next macrotask and no earlier, so the binder arms it here (D-04, D-10).
   */
  timers: Timers;
  /**
   * The sink an accessory's own observation record reaches disk through.
   *
   * Mutating an accessory's context changes an object in memory and nothing on
   * disk: Homebridge writes the cache only when it is told the accessory
   * changed. The record writes through this narrow port rather than the
   * accessory reaching for a Homebridge API handle it deliberately does not
   * have, so a test hands in a recorder and asserts a write was not asked for
   * (CTRL-01, D-008).
   */
  store: AccessoryStore;
  /** The command surface a HomeKit press on a control Switch reaches the vendor through (CTRL-05). */
  commands: CommandPort;
  /** The notification sensors to leave unpublished. Absent publishes every adapter (D-017, CONF-06). */
  ignoredFaults?: readonly NotificationServiceKind[];
  /**
   * Consecutive disconnected polls before the offline adapter activates.
   *
   * Absent takes the documented default. A supplied value is a whole number of
   * at least one; anything else is refused at construction, because a threshold
   * of zero would activate the adapter on every update including the first
   * (RES-03, D-09).
   */
  offlineConfirmationPollCount?: number;
}

// No literal manufacturer or model string exists on the wire, so these are
// documented plugin-side literals derived from the vendor's `deviceTypeId`
// (`wayneWaterGemini`) and `attributes.productLine` (`wayneWater`), not a
// vendor-reported value.
const MANUFACTURER = 'Wayne';
const MODEL = 'Gemini';

// `mcu_firmware_version` is the only source for `FirmwareRevision`: the MCU
// governs pump control and is the safety-relevant firmware, so it is never
// compared against or blended with `wifi_firmware_version`.
const UNKNOWN_FIRMWARE = 'unknown';

// The same default `src/config.ts` resolves for `offlineConfirmationPollCount`,
// repeated here so an accessory built without the setting behaves as a
// configured one does.
const DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT = 2;

// Every scope that can lose trust, in the order `untrusted` reports them.
const TRUST_SCOPES: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault', 'connectivity', 'self-test', 'alarm-mute'];

/** One control row, and the reported fact its Switch follows. */
interface ControlDefinition {
  capability: DeviceCapability;
  /** The field inside the capability's own decoded group that carries the reported value. */
  field: string;
}

// The capability each control row drives. A capability, the trust scope that
// owns it, and the decoded group carrying it are one string by design, so this
// map holds the field name and nothing else (D-02).
const CONTROLS: ReadonlyMap<ServiceKind, ControlDefinition> = new Map<ServiceKind, ControlDefinition>([
  ['system-self-test', { capability: 'self-test', field: 'running' }],
  ['alarm-mute', { capability: 'alarm-mute', field: 'muted' }],
]);

// Every scope but `connectivity`, which is the same set for the two conditions
// that reach past a single field.
//
// No adapter resolving at all degrades them together, because `connectivity` is
// governed by the separately-validated wire envelope rather than by family
// validation, so a profile failure never touches it (D-014, DEV-08). A lost
// pump-controller link poisons the same five, because every one of them is
// derived from the controller while `connectivity` reports the vendor cloud,
// which is still answering (D-11, RES-02).
const NON_CONNECTIVITY_SCOPES: ReadonlySet<TrustScope> = new Set(TRUST_SCOPES.filter((scope) => scope !== 'connectivity'));

// What one accessory's own payload last said about trust, kept apart from what
// the account-wide monitoring trust says.
interface DeviceDistrust {
  violated: ReadonlySet<TrustScope>;
  controllerLinkLost: boolean;
}

// The three sets a monitoring failure can withdraw, beside the empty one a
// healthy pair of transports withdraws.
const EVERY_SCOPE: ReadonlySet<TrustScope> = new Set(TRUST_SCOPES);
const CONNECTIVITY_SCOPE: ReadonlySet<TrustScope> = new Set<TrustScope>(['connectivity']);
const NO_SCOPES: ReadonlySet<TrustScope> = new Set<TrustScope>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDeviceContext(value: unknown): value is { deviceId: string; deviceTypeId: string } {
  return isRecord(value) && typeof value.deviceId === 'string' && typeof value.deviceTypeId === 'string';
}

function deviceIdOf(accessory: PlatformAccessory): string {
  const context: unknown = accessory.context;
  const device = isRecord(context) ? context.device : undefined;

  if (!isDeviceContext(device)) {
    throw new Error('the accessory context carries no device identity; the platform must set context.device before creating the accessory');
  }

  return device.deviceId;
}

// `decode()` is generic over the family, so the decoded value arrives here as
// `unknown`. Reading the group structurally, rather than importing Gemini's own
// type, keeps this module ignorant of any one family's shape (D-003). A group
// the family omitted did not validate, and its absence is what keeps
// `AccessoryInformation` on its last valid values rather than blanking them
// (D-014).
function decodedMetadataOf(decoded: unknown): Record<string, unknown> | undefined {
  const metadata = isRecord(decoded) ? decoded.metadata : undefined;

  return isRecord(metadata) ? metadata : undefined;
}

function firmwareRevisionOf(metadata: Record<string, unknown>): string {
  const mcuFirmwareVersion = metadata.mcuFirmwareVersion;

  return typeof mcuFirmwareVersion === 'string' ? mcuFirmwareVersion : UNKNOWN_FIRMWARE;
}

// A violation whose scope is `undefined` names a field no published service
// reads, so it is diagnosable without deactivating anything (D-04).
function violatedScopesOf(validation: FamilyValidation): ReadonlySet<TrustScope> {
  const scopes = new Set<TrustScope>();

  if (validation.valid) {
    return scopes;
  }

  for (const violation of validation.violations) {
    if (violation.scope !== undefined) {
      scopes.add(violation.scope);
    }
  }

  return scopes;
}

function reasonsOf(scopes: Iterable<TrustScope>, reason: DistrustReason): Map<TrustScope, DistrustReason> {
  const reasons = new Map<TrustScope, DistrustReason>();

  for (const scope of scopes) {
    reasons.set(scope, reason);
  }

  return reasons;
}

// `serial_communications === false` is a condition the device reports, not a
// field that failed its shape, so the payload still validates and the `fault`
// group still decodes. A group that did not decode says nothing about the link,
// and an absent field is never read as evidence that the link is up (D-11).
function isControllerLinkLost(decoded: unknown): boolean {
  const fault = isRecord(decoded) ? decoded.fault : undefined;

  return isRecord(fault) && fault.controllerLinkPresent === false;
}

// Which scopes an account-wide monitoring failure withdraws, which is not the
// same set for the two transports.
//
// Shadow silence spares `connectivity`: a REST poll still sources that claim,
// and withdrawing it would deactivate the one adapter still being fed. A
// degraded poll withdraws `connectivity` as well, because then nothing sources
// it and a frozen confirmation run would go on reading as current, which is the
// false normal the narrowing exists to close. Both down withdraws everything
// (D-02, D-04).
function monitoringDegradedScopes(trust: MonitoringTrust): ReadonlySet<TrustScope> {
  if (trust.shadowSilent) {
    return trust.restDegraded ? EVERY_SCOPE : NON_CONNECTIVITY_SCOPES;
  }

  return trust.restDegraded ? CONNECTIVITY_SCOPE : NO_SCOPES;
}

// A failed field, a lost controller link, and a lost monitoring path are three
// different failures, so they carry different reasons and none overwrites
// another: a scope already untrusted because its own field violated keeps
// saying so, and each broader cause adds only the scopes that had nothing wrong
// with them. `connectivity` is left out of the controller-link layer
// deliberately -- the vendor cloud answering is exactly what makes the rest
// doubtful. The monitoring layer decides its own set, because which scopes a
// transport outage costs depends on which transport went (D-02, D-11, RES-02,
// RES-03).
function distrustReasonsOf(
  violated: ReadonlySet<TrustScope>,
  controllerLinkLost: boolean,
  monitoringDegraded: ReadonlySet<TrustScope>,
): ReadonlyMap<TrustScope, DistrustReason> {
  const reasons = reasonsOf(violated, 'invalid');

  if (controllerLinkLost) {
    for (const scope of NON_CONNECTIVITY_SCOPES) {
      if (!reasons.has(scope)) {
        reasons.set(scope, 'controller-link-lost');
      }
    }
  }

  for (const scope of monitoringDegraded) {
    if (!reasons.has(scope)) {
      reasons.set(scope, 'unreachable');
    }
  }

  return reasons;
}

// Each untrusted scope carries its own `lastTrustedAt`, the receipt time of the
// last snapshot in which that scope both decoded and was still vouched for --
// `undefined` when it never has. Reporting them in `TRUST_SCOPES` order keeps
// the exposed list stable however the reasons were assembled.
function untrustedScopesOf(reasons: ReadonlyMap<TrustScope, DistrustReason>, lastTrustedAt: ReadonlyMap<TrustScope, number>): readonly UntrustedScope[] {
  const untrusted: UntrustedScope[] = [];

  for (const scope of TRUST_SCOPES) {
    const reason = reasons.get(scope);

    if (reason !== undefined) {
      untrusted.push({ scope, reason, lastTrustedAt: lastTrustedAt.get(scope) });
    }
  }

  return untrusted;
}

// A connected poll resets the run, and the count is clamped at the threshold so
// a long outage leaves no backlog that would hold the adapter activated after a
// reconnection. The count only ever reads `connectivity.connected`, never the
// device's own `data.offline` report, because an alert raised from a transport
// hiccup teaches the owner to ignore it (RES-03, D-016).
function nextOfflineCount(previous: number, connected: boolean, threshold: number): number {
  return connected ? 0 : Math.min(previous + 1, threshold);
}

// The empty string, never a fabricated time, is what a scope that has never
// decoded reports (RES-02).
function isoTimestamp(at: number | undefined): string {
  return at === undefined ? '' : new Date(at).toISOString();
}

// One observation per snapshot, built from the decoded groups through the
// catalogue's own narrowing rather than a second one written here: two
// narrowings can disagree about the same payload, and the record would then
// count something no row ever published (D-003).
//
// Every field is absent rather than defaulted when its group did not decode,
// which is what keeps the record from advancing on a payload the family could
// not vouch for (D-014).
function observationOf(decoded: unknown, receivedAt: number): PumpRecordsObservation {
  const pump = decodedGroup(decoded, 'pump');
  const selfTest = decodedGroup(decoded, 'self-test');

  return {
    receivedAt,
    primaryRunning: booleanOf(pump, 'primaryRunning'),
    backupRunning: booleanOf(pump, 'backupRunning'),
    backupActivatedAt: numberOf(pump, 'backupActivatedAt'),
    testRunning: booleanOf(selfTest, 'running'),
    testedAt: numberOf(selfTest, 'testedAt'),
  };
}

// The accessory is the one place a stored millisecond value becomes a published
// string, exactly as `controllerDataLastTrustedAt` already is, so no row reads a
// clock or keeps state of its own. A record that has seen no activation
// publishes the empty string rather than a fabricated time (CTRL-01, D-011).
function recordProjectionOf(record: PumpRecordValues): PumpRecordProjection {
  return {
    observationStartedAt: isoTimestamp(record.observationStartedAt),
    activationCount: record.activationCount,
    lastActivationAt: isoTimestamp(record.lastActivationAt),
    lastActivationWasTestActivity: record.lastActivationWasTestActivity,
  };
}

// Every `PlatformAccessory` already carries this service from its own
// construction, so it is fetched here and never added again.
function populateAccessoryInformation(accessory: PlatformAccessory, hap: API['hap'], snapshot: DeviceSnapshot, metadata: Record<string, unknown>): void {
  const accessoryInformation = accessory.getService(hap.Service.AccessoryInformation);

  if (accessoryInformation === undefined) {
    throw new Error('the accessory carries no AccessoryInformation service, which every constructed PlatformAccessory provides');
  }

  accessoryInformation
    .setCharacteristic(hap.Characteristic.Manufacturer, MANUFACTURER)
    .setCharacteristic(hap.Characteristic.Model, MODEL)
    .setCharacteristic(hap.Characteristic.SerialNumber, snapshot.identity.serialNumber)
    .setCharacteristic(hap.Characteristic.FirmwareRevision, firmwareRevisionOf(metadata));
}

/**
 * Builds one Basement Guardian accessory over an already-constructed
 * `PlatformAccessory`.
 *
 * The factory reads no vendor payload itself: `update()` reaches the family
 * registry for validation and decoding, and every value it publishes traces
 * to a field the family adapter already confirmed. Building it touches nothing
 * outside itself: no service is added and no characteristic is pushed until the
 * first `update()` arrives, and a row still adds no service until it has a
 * value it can vouch for, so an accessory that has never heard from its device
 * -- or that has never heard a valid value for one scope -- shows no service
 * for that scope at all rather than a board of format defaults (D-014).
 */
export function createBasementGuardianAccessory(options: BasementGuardianAccessoryOptions): BasementGuardianAccessory {
  const { accessory, hap, registry, log } = options;
  const deviceId = deviceIdOf(accessory);
  const catalogue = createServiceCatalogue(hap);
  const ignoredFaults: readonly NotificationServiceKind[] = options.ignoredFaults ?? [];
  const offlineThreshold = options.offlineConfirmationPollCount ?? DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT;

  // A threshold of zero makes `offlineCount >= offlineThreshold` true from the
  // first update, so `Basement Guardian Offline` would read activated while the
  // vendor answers normally -- a permanent false alarm on the one adapter RES-03
  // exists for. `src/config.ts` bounds the setting at 1, but this factory is an
  // exported entry point, so its contract does not depend on its caller having
  // validated first.
  if (!Number.isInteger(offlineThreshold) || offlineThreshold < 1) {
    throw new Error(`offlineConfirmationPollCount must be a whole number of at least 1, not ${String(offlineThreshold)}`);
  }

  // Local to this accessory: per scope, the receipt time of the last snapshot
  // in which it was still vouched for; whether the accessory is currently
  // degraded and whether the controller link is currently lost (so a repeated
  // `update()` in either condition logs nothing further); the currently exposed
  // untrusted scopes; the run of consecutive disconnected polls; and the
  // services currently published.
  const lastTrustedAt = new Map<TrustScope, number>();
  let degraded = false;
  let controllerLinkLost = false;
  let untrusted: readonly UntrustedScope[] = [];
  let offlineCount = 0;
  let published: readonly ServiceDescriptor[] = [];
  // What the plugin can currently say about its own ability to observe this
  // account. Both transports start trusted, because nothing has failed yet.
  //
  // The command transport starts unready, which is the opposite default and
  // deliberately so: the other two say a value may be stale, and nothing has
  // gone stale before the first report, while this one says a press can leave
  // the plugin. Nothing has told this accessory the runtime can reach the vendor
  // yet, so a press in that window is refused locally rather than sent into a
  // route that has never answered (RES-04, D-07).
  let monitoring: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false };
  // What the last update's own payload said about trust. It is held because an
  // account-wide monitoring change recomputes the whole reason map without a
  // fresh snapshot, and the two device-level causes must keep their precedence
  // over the account-wide one when it does.
  let deviceDistrust: DeviceDistrust = { violated: new Set<TrustScope>(), controllerLinkLost: false };
  // The last decoded state, kept so the write path can read what the device
  // itself reports without waiting for another update: a control refused
  // between polls has to answer from the same facts the rows publish from.
  let lastDecoded: unknown = undefined;
  // Whether a snapshot has ever been observed, which is what says a record
  // exists to publish. Reading one before the first observation throws rather
  // than answering a count of zero from an epoch of 1970, so this is asked
  // before either record is read (CTRL-01, D-020).
  let observedASnapshot = false;

  // One record instance per accessory, living as long as the accessory does,
  // for the same reason the platform reuses one accessory instance across
  // polls: a fresh instance per update would discard the observation epoch and
  // the previously reported running values the watched-edge rule depends on, so
  // every poll would re-seed and no activation would ever be counted
  // (CTRL-01, D-010, D-014).
  const records = createPumpRecords({ context: accessory.context, store: options.store, log });

  // Only a removable notification kind can be suppressed; a core kind reports
  // what the system reports, so removing one would hide a condition rather
  // than hide a notification (CONF-06).
  function isSuppressed(kind: ServiceKind): boolean {
    return isNotificationServiceKind(kind) && ignoredFaults.includes(kind);
  }

  // What the device itself last said about one control, read structurally so
  // this module stays ignorant of any one family's type (D-003), and withheld
  // while the scope owning it is untrustworthy: a value the accessory cannot
  // vouch for is absent rather than defaulted (D-014).
  function reportedControlValue(control: ControlDefinition): boolean | undefined {
    if (untrusted.some((scope) => scope.scope === control.capability)) {
      return undefined;
    }

    const group = isRecord(lastDecoded) ? lastDecoded[control.capability] : undefined;
    const reported = isRecord(group) ? group[control.field] : undefined;

    return typeof reported === 'boolean' ? reported : undefined;
  }

  // Every reason currently in force: what the last update's payload said, plus
  // whatever the account-wide monitoring trust withdraws on top of it. Both
  // sources are read here rather than at each assignment site, so a poll that
  // lands during a degradation cannot silently restore trust and a degradation
  // that lands between polls does not wait for one.
  function reasonsNow(): ReadonlyMap<TrustScope, DistrustReason> {
    return distrustReasonsOf(deviceDistrust.violated, deviceDistrust.controllerLinkLost, monitoringDegradedScopes(monitoring));
  }

  // Whether the confirmation run has been reached. One expression, read by both
  // the rows and the write path, so the fact a row publishes from and the fact a
  // write is refused on cannot disagree (RES-03, D-09).
  function offlineConfirmed(): boolean {
    return offlineCount >= offlineThreshold;
  }

  // Whether the runtime currently has a proven way to reach the vendor. Read
  // from the same account-wide trust the rows publish from, so a row and a
  // refused write cannot disagree about the same account (RES-04, D-07).
  function commandTransportReady(): boolean {
    return monitoring.commandTransportReady;
  }

  // Everything a row reads, assembled once from the accessory's own state so
  // the resolved and unresolved paths cannot drift apart in what they hand a
  // row.
  function projectionInputOf(decoded: unknown, pendingControls: ReadonlySet<DeviceCapability>): ProjectionInput {
    const input: ProjectionInput = {
      decoded,
      untrustedScopes: untrusted,
      offlineConfirmed: offlineConfirmed(),
      controllerDataLastTrustedAt: isoTimestamp(lastTrustedAt.get('fault')),
      pendingControls,
    };

    if (!observedASnapshot) {
      return input;
    }

    return { ...input, primaryPumpRecord: recordProjectionOf(records.primary), backupPumpRecord: recordProjectionOf(records.backup) };
  }

  // The one publish pass a service already on the accessory gets: everything its
  // row can currently vouch for, then the `StatusActive` that reports whether it
  // could vouch for every scope it reads.
  function publishRow(row: ServiceRow, service: Service, input: ProjectionInput): void {
    for (const value of row.project(input)) {
      publishValue(service, value.characteristic, value.value);
    }

    publishValue(service, hap.Characteristic.StatusActive, isRowFullyTrusted(row, input.untrustedScopes));
  }

  // Refreshes the control rows alone. This is what a refused write's clearing
  // push runs, and it deliberately touches nothing else: nothing else changed,
  // and a full republish from a deferred callback would make `update()`'s "two
  // updates cannot interleave" claim harder to hold.
  function republishControlRows(pendingControls: ReadonlySet<DeviceCapability>): void {
    const input = projectionInputOf(lastDecoded, pendingControls);

    for (const row of catalogue) {
      const service = CONTROLS.has(row.kind) ? publishedService(accessory, row) : undefined;

      if (service === undefined) {
        continue;
      }

      publishRow(row, service, input);
    }
  }

  // The write half of the control Switches. It is created here, once, because
  // its pending set is accessory-local: one accessory's unresolved self-test
  // must not withhold another accessory's control (D-05, D-06).
  const controls = createControlBinder({
    hap,
    log,
    timers: options.timers,
    commands: options.commands,
    deviceId,
    offlineConfirmed,
    commandTransportReady,
    republish: () => {
      republishControlRows(controls.pending);
    },
  });

  // A control row's Switch is where a HomeKit press enters the plugin. The
  // handler attaches to the service the row already published, so the catalogue
  // stays projection-only and one service list keeps feeding every identity
  // (D-01).
  function bindControlRow(row: ServiceRow, service: Service): void {
    const control = CONTROLS.get(row.kind);

    if (control === undefined) {
      return;
    }

    controls.bind(service, control.capability, () => reportedControlValue(control));
  }

  // One pass over the catalogue in its declared order, so the published order
  // never depends on which adapters an administrator suppressed. A row that
  // cannot vouch for its scope receives its `StatusActive` push and nothing
  // else, which leaves the last trustworthy value exactly where it was.
  //
  // `StatusActive` answers for every scope the row reads rather than for the
  // one it is filed under, so a service carrying a value from a second scope
  // group stops calling that value current the moment the scope owning it stops
  // validating (D-014, D-05).
  //
  // The row is asked what it can publish before the service exists, because a
  // service added with nothing pushed onto it would sit at HAP's format
  // defaults, and those are this plugin's good-news values (D-014, D-05).
  function publishRows(input: ProjectionInput): readonly ServiceDescriptor[] {
    const descriptors: ServiceDescriptor[] = [];

    for (const row of catalogue) {
      if (isSuppressed(row.kind)) {
        removeServiceIfPresent(accessory, row);

        continue;
      }

      const projected = row.project(input);
      const service = ensureService(accessory, row, projected);

      if (service === undefined) {
        continue;
      }

      seedConfiguredName(hap, service, row.displayName);
      bindControlRow(row, service);

      for (const value of projected) {
        publishValue(service, value.characteristic, value.value);
      }

      publishValue(service, hap.Characteristic.StatusActive, isRowFullyTrusted(row, input.untrustedScopes));
      descriptors.push({ kind: row.kind, subtype: row.subtype, serviceUuid: row.serviceClass.UUID, name: row.displayName });
    }

    return descriptors;
  }

  // Refreshes every service the accessory has already published, and adds none.
  // An accessory whose family has never resolved therefore still shows no
  // service at all, while one that published before its profile stopped
  // resolving stops reporting its retained values as trustworthy: without this,
  // a quiet system would keep publishing "no leak, pump normal, battery fine,
  // active" forever, which is the false all-clear the whole plugin exists to
  // prevent (D-05, D-014, DEV-08).
  //
  // The connectivity row is the one this leaves alone, because nothing about it
  // stopped being knowable. It reads the accessory's own count of consecutive
  // disconnected polls rather than anything an adapter decoded, so it keeps
  // publishing its current verdict and stays active -- which is what `untrusted`
  // has always reported for that scope, and what the wire envelope still
  // supports (D-014, RES-03).
  //
  // Suppression is applied here on the same terms the publishing path applies
  // it. An administrator's `ignoredFaults` list is a standing instruction, not
  // one the resolving path owns: without this gate a profile that stopped
  // resolving would leave a removed sensor in HomeKit and go on driving it with
  // a live verdict every poll, which is the sensor and the automations attached
  // to it coming back on their own (CONF-06, D-017).
  function republishPublishedRows(input: ProjectionInput): void {
    for (const row of catalogue) {
      if (isSuppressed(row.kind)) {
        removeServiceIfPresent(accessory, row);

        continue;
      }

      const service = publishedService(accessory, row);

      if (service === undefined) {
        continue;
      }

      seedConfiguredName(hap, service, row.displayName);
      publishRow(row, service, input);
    }
  }

  // The transition into a degraded state logs once; recovery clears the flag,
  // so a sustained degradation says nothing further while a later relapse still
  // reports itself (D-05).
  //
  // Two causes are deliberately not degradations here, because neither stopped
  // anything validating and this line names a validation failure. A lost
  // controller link has its own report below. A lost monitoring path is
  // reported by the account runtime's own rate-limited failure log, which is
  // where an account-wide transport condition belongs; naming a profile or a
  // payload for it would state a cause that did not happen, and a diagnostic
  // naming the wrong cause is worse than none because an owner acts on it
  // (D-03).
  function reportDegradation(): void {
    if (!untrusted.some((scope) => scope.reason !== 'controller-link-lost' && scope.reason !== 'unreachable')) {
      degraded = false;

      return;
    }

    if (degraded) {
      return;
    }

    log.warn(
      `Degraded ${deviceId}: the profile or payload stopped validating. ` +
        'AccessoryInformation keeps its last valid values until a family-valid update recovers it.',
    );
    degraded = true;
  }

  // The same log-once discipline for the other sustained condition. The message
  // names the `deviceId`, which is not sensitive, and quotes no credential,
  // token, or account identifier; it says the values are retained rather than
  // refreshed, because that is what an owner needs to know about a reading that
  // still looks current (D-11, WR-01).
  function reportControllerLink(linkLost: boolean): void {
    if (!linkLost) {
      controllerLinkLost = false;

      return;
    }

    if (controllerLinkLost) {
      return;
    }

    log.warn(
      `Lost the pump controller link on ${deviceId}: the vendor cloud still answers, so water, pump, power, ` +
        'battery, and fault values are retained rather than refreshed until the link returns.',
    );
    controllerLinkLost = true;
  }

  // A scope's last trusted time advances only while nothing untrusts it, so a
  // scope poisoned by a lost link keeps the receipt time of the last snapshot
  // that arrived with the link present -- which is what a service publishes as
  // the moment trustworthy controller data last arrived (RES-02).
  function recordTrustedScopes(reasons: ReadonlyMap<TrustScope, DistrustReason>, receivedAt: number): void {
    for (const scope of TRUST_SCOPES) {
      if (!reasons.has(scope)) {
        lastTrustedAt.set(scope, receivedAt);
      }
    }
  }

  // The device's own report is what resolves a pending request, so a request the
  // device never confirms is never resolved by anything the plugin decided
  // (CTRL-03, D-037).
  function reconcileControls(): void {
    for (const control of CONTROLS.values()) {
      controls.reconcile(control.capability, reportedControlValue(control));
    }
  }

  return {
    deviceId,

    get services(): readonly ServiceDescriptor[] {
      return published;
    },

    get untrusted(): readonly UntrustedScope[] {
      return untrusted;
    },

    markMonitoring(trust: MonitoringTrust): void {
      // The comparison covers every member of `MonitoringTrust`, not only the two
      // that decide which scopes are withdrawn, and it grows with the type. A
      // single failed REST poll moves neither degradation field -- the REST
      // threshold is two -- while the runtime has already flipped the command
      // transport, so a comparison over those two alone would report "unchanged"
      // for exactly the transport failure a press must be refused on. Any member
      // left out of this list is a fact the runtime has pushed and this accessory
      // silently ignored (RES-04, D-07, D-10).
      const unchanged =
        trust.restDegraded === monitoring.restDegraded &&
        trust.shadowSilent === monitoring.shadowSilent &&
        trust.commandTransportReady === monitoring.commandTransportReady &&
        trust.credentialsRejected === monitoring.credentialsRejected;

      // The store sits outside the early return below deliberately. The runtime
      // reports on every poll tick, so republishing per tick would be noise
      // rather than information -- but the write path reads the stored value
      // directly rather than through the row projection, and a store skipped by
      // an unchanged-looking report would leave it answering a fact the runtime
      // has already superseded.
      monitoring = trust;

      if (unchanged) {
        return;
      }

      untrusted = untrustedScopesOf(reasonsNow(), lastTrustedAt);
      republishPublishedRows(projectionInputOf(lastDecoded, controls.pending));
    },

    update(snapshot: DeviceSnapshot, source: SnapshotSource): void {
      const outcome = registry.lookup(snapshot.identity.deviceTypeId);

      if (outcome.kind !== 'implemented') {
        // An unresolved family cannot say which scope a decoded value belongs
        // to, so this is the one failure that still degrades every
        // controller-derived scope at once. It never calls `decode()` and never
        // touches `AccessoryInformation`, and it publishes no decoded value at
        // all, so every service keeps the last values a trustworthy snapshot
        // produced. The controller-link flag is left where it was, because a
        // family that no longer resolves reports nothing about the link either
        // way.
        //
        // The confirmation run advances here as it does anywhere else. A
        // successful REST inventory observed whether the vendor can still reach
        // the device whatever the profile resolves to, and freezing the run
        // would leave a device that stopped resolving and then went offline
        // never activating the one adapter RES-03 exists for (RES-03, D-09).
        if (source === 'poll') {
          offlineCount = nextOfflineCount(offlineCount, snapshot.connectivity.connected, offlineThreshold);
        }

        deviceDistrust = { violated: NON_CONNECTIVITY_SCOPES, controllerLinkLost: false };
        untrusted = untrustedScopesOf(reasonsNow(), lastTrustedAt);
        republishPublishedRows(projectionInputOf(undefined, controls.pending));
        reportDegradation();

        return;
      }

      // The verdict is reached before the same snapshot is decoded, which is
      // the order the family contract documents: a family decides what it may
      // decode from its own validation, so asking for the verdict first keeps
      // the call order and the contract saying the same thing.
      const validation = outcome.family.validate(snapshot);
      const decoded = outcome.family.decode(snapshot);
      const linkLost = isControllerLinkLost(decoded);
      deviceDistrust = { violated: violatedScopesOf(validation), controllerLinkLost: linkLost };

      const reasons = reasonsNow();
      const metadata = decodedMetadataOf(decoded);

      recordTrustedScopes(reasons, snapshot.receivedAt);
      untrusted = untrustedScopesOf(reasons, lastTrustedAt);

      // Only a successful REST inventory response observed whether the vendor
      // can still reach the device, so a between-poll update publishes
      // everything else and leaves the confirmation run exactly where the last
      // poll left it (RES-03, D-09).
      if (source === 'poll') {
        offlineCount = nextOfflineCount(offlineCount, snapshot.connectivity.connected, offlineThreshold);
      }

      if (metadata !== undefined) {
        populateAccessoryInformation(accessory, hap, snapshot, metadata);
      }

      lastDecoded = decoded;
      // Reconciled before the rows publish, so the update that carries the
      // device's confirmation is the same one that resumes publishing reported
      // state for that control.
      reconcileControls();

      // Exactly one observation per snapshot, taken before the rows publish so
      // the same update that advanced the record is the one that shows it. It
      // is deliberately absent from the unresolved-family branch above: a family
      // that no longer resolves cannot say whether a pump ran, so advancing a
      // count from it would be a guess and blanking the record would discard
      // evidence (CTRL-01, D-014).
      records.observe(observationOf(decoded, snapshot.receivedAt));
      observedASnapshot = true;

      published = publishRows(projectionInputOf(decoded, controls.pending));

      reportControllerLink(linkLost);
      reportDegradation();
    },
  };
}
