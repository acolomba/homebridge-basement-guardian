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
 * `deviceTypeId` that stops resolving to an implemented family degrades the
 * whole accessory in place: it never calls `decode()`, never touches
 * `AccessoryInformation`, and never adds a second one (every
 * `PlatformAccessory` already carries one from its own construction). A payload
 * that fails one field's shape costs only the scope that field owns, because
 * the family still decodes every scope whose own fields validated (D-014).
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

import { createServiceCatalogue, ensureService, isRowTrusted, publishValue, removeServiceIfPresent } from './serviceCatalogue.js';
import { isNotificationServiceKind } from './services.js';

import type { ProjectionInput } from './serviceCatalogue.js';
import type { NotificationServiceKind, ServiceDescriptor, ServiceKind } from './services.js';
import type { FamilyValidation } from '../device/family.js';
import type { TrustScope, UntrustedScope } from '../device/health.js';
import type { FamilyRegistry } from '../device/registry.js';
import type { DeviceSnapshot } from '../device/state.js';
import type { Timers } from '../runtime/timers.js';
import type { API, Logging, PlatformAccessory } from 'homebridge';

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
}

/** Everything the accessory factory needs, by injection. */
export interface BasementGuardianAccessoryOptions {
  accessory: PlatformAccessory;
  hap: API['hap'];
  registry: FamilyRegistry;
  log: Logging;
  /**
   * Deferred execution, taken and never called.
   *
   * The accessory publishes synchronously inside `update()`, so nothing here
   * schedules anything. The port is required rather than optional because its
   * whole purpose is to be observed: a test hands in a stand-in that records
   * calls and asserts it recorded none, which is evidence about an absence that
   * watching behaviour alone cannot give (SAFE-07, D-18).
   */
  timers: Timers;
  /** The notification sensors to leave unpublished. Absent publishes every adapter (D-017, CONF-06). */
  ignoredFaults?: readonly NotificationServiceKind[];
  /** Consecutive disconnected polls before the offline adapter activates. Absent takes the documented default (RES-03, D-09). */
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
const TRUST_SCOPES: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault', 'connectivity'];

// Every scope but `connectivity` degrades together when no adapter resolves at
// all: `connectivity` is governed by the separately-validated wire envelope,
// not by family validation, so a profile failure never touches it (D-014,
// DEV-08).
const DEGRADED_SCOPES: ReadonlySet<TrustScope> = new Set(TRUST_SCOPES.filter((scope) => scope !== 'connectivity'));

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

// Each untrusted scope carries its own `lastTrustedAt`, the receipt time of the
// last snapshot in which that scope decoded -- `undefined` when it never has.
function untrustedScopesOf(scopes: ReadonlySet<TrustScope>, lastTrustedAt: ReadonlyMap<TrustScope, number>): readonly UntrustedScope[] {
  return TRUST_SCOPES.filter((scope) => scopes.has(scope)).map((scope): UntrustedScope => ({
    scope,
    reason: 'invalid',
    lastTrustedAt: lastTrustedAt.get(scope),
  }));
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
 * first `update()` arrives, so an accessory that has never heard from its
 * device shows no service at all rather than a board of format defaults.
 */
export function createBasementGuardianAccessory(options: BasementGuardianAccessoryOptions): BasementGuardianAccessory {
  const { accessory, hap, registry, log } = options;
  const deviceId = deviceIdOf(accessory);
  const catalogue = createServiceCatalogue(hap);
  const ignoredFaults: readonly NotificationServiceKind[] = options.ignoredFaults ?? [];
  const offlineThreshold = options.offlineConfirmationPollCount ?? DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT;

  // Local to this accessory: per scope, the receipt time of the last snapshot
  // in which it decoded; whether the accessory is currently degraded (so a
  // repeated degraded `update()` logs nothing further); the currently exposed
  // untrusted scopes; the run of consecutive disconnected polls; and the
  // services currently published.
  const lastTrustedAt = new Map<TrustScope, number>();
  let degraded = false;
  let untrusted: readonly UntrustedScope[] = [];
  let offlineCount = 0;
  let published: readonly ServiceDescriptor[] = [];

  // Only a removable notification kind can be suppressed; a core kind reports
  // what the system reports, so removing one would hide a condition rather
  // than hide a notification (CONF-06).
  function isSuppressed(kind: ServiceKind): boolean {
    return isNotificationServiceKind(kind) && ignoredFaults.includes(kind);
  }

  // One pass over the catalogue in its declared order, so the published order
  // never depends on which adapters an administrator suppressed. A row that
  // cannot vouch for its scope receives its `StatusActive` push and nothing
  // else, which leaves the last trustworthy value exactly where it was.
  function publishRows(input: ProjectionInput): readonly ServiceDescriptor[] {
    const descriptors: ServiceDescriptor[] = [];

    for (const row of catalogue) {
      if (isSuppressed(row.kind)) {
        removeServiceIfPresent(accessory, row);

        continue;
      }

      const service = ensureService(accessory, row);

      for (const projected of row.project(input)) {
        publishValue(service, projected.characteristic, projected.value);
      }

      publishValue(service, hap.Characteristic.StatusActive, isRowTrusted(row, input.untrustedScopes));
      descriptors.push({ kind: row.kind, subtype: row.subtype, name: row.displayName });
    }

    return descriptors;
  }

  // The transition into a degraded state logs once; recovery clears the flag,
  // so a sustained degradation says nothing further while a later relapse still
  // reports itself (D-05).
  function reportDegradation(): void {
    if (untrusted.length === 0) {
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

  function recordTrustedScopes(violated: ReadonlySet<TrustScope>, receivedAt: number): void {
    for (const scope of TRUST_SCOPES) {
      if (!violated.has(scope)) {
        lastTrustedAt.set(scope, receivedAt);
      }
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

    update(snapshot: DeviceSnapshot, source: SnapshotSource): void {
      void source;
      const outcome = registry.lookup(snapshot.identity.deviceTypeId);

      if (outcome.kind !== 'implemented') {
        // An unresolved family cannot say which scope a value belongs to, so
        // this is the one failure that still degrades every scope at once. It
        // never calls `decode()` and never touches `AccessoryInformation`.
        untrusted = untrustedScopesOf(DEGRADED_SCOPES, lastTrustedAt);
        reportDegradation();

        return;
      }

      const violated = violatedScopesOf(outcome.family.validate(snapshot));
      const decoded = outcome.family.decode(snapshot);
      const metadata = decodedMetadataOf(decoded);

      recordTrustedScopes(violated, snapshot.receivedAt);
      untrusted = untrustedScopesOf(violated, lastTrustedAt);
      offlineCount = nextOfflineCount(offlineCount, snapshot.connectivity.connected, offlineThreshold);

      if (metadata !== undefined) {
        populateAccessoryInformation(accessory, hap, snapshot, metadata);
      }

      published = publishRows({
        decoded,
        untrustedScopes: untrusted,
        offlineConfirmed: offlineCount >= offlineThreshold,
        controllerDataLastTrustedAt: isoTimestamp(lastTrustedAt.get('fault')),
      });

      reportDegradation();
    },
  };
}
