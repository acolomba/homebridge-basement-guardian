import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { createFakeAccessory } from '../../features/support/fakeHomebridgeApi.js';
import { createBasementGuardianAccessory } from '../../src/accessories/basementGuardian.js';
import { createCustomCharacteristics } from '../../src/accessories/customCharacteristics.js';
import { createServiceCatalogue } from '../../src/accessories/serviceCatalogue.js';
import { markServicesUnreadable } from '../../src/accessories/staleMarking.js';
import { geminiFamily } from '../../src/device/gemini.js';
import { systemTimers } from '../../src/runtime/timers.js';

import type { FakeHapCharacteristic, FakeHapService, FakeServiceClass } from '../../features/support/fakeHap.js';
import type { FakeAccessory } from '../../features/support/fakeHomebridgeApi.js';
import type { BasementGuardianAccessory, BasementGuardianAccessoryOptions } from '../../src/accessories/basementGuardian.js';
import type { ServiceRow } from '../../src/accessories/serviceCatalogue.js';
import type { NotificationServiceKind, ServiceDescriptor, ServiceKind } from '../../src/accessories/services.js';
import type { DeviceCapability, DeviceFamily, FieldViolation } from '../../src/device/family.js';
import type { TrustScope } from '../../src/device/health.js';
import type { FamilyOutcome, FamilyRegistry } from '../../src/device/registry.js';
import type { DeviceSnapshot } from '../../src/device/state.js';
import type { AccessoryStore } from '../../src/runtime/accessoryStore.js';
import type { CommandPort } from '../../src/runtime/commandPort.js';
import type { MonitoringTrust } from '../../src/runtime/monitoringHealth.js';
import type { Timers } from '../../src/runtime/timers.js';
import type { API, Logging, PlatformAccessory } from 'homebridge';

const DEVICE_ID = 'account-1_serial-1';
const DEVICE_TYPE_ID = 'wayneWaterGemini';
const ACCESSORY_NAME = 'Sump System';
const ACCESSORY_UUID = 'placeholder-accessory-uuid';

const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;
const LEAK_DETECTED = 1;

// The one legal water level code above the flood threshold, and the percentage the ladder maps it
// to (D-01, D-03).
const FLOODING_LEVEL_CODE = 31;
const FLOODING_LEVEL_PERCENT = 100;

// Every scope the accessory degrades when no adapter resolves, in the stable order `untrusted` must
// expose them -- written independently of the production constant.
const DEGRADED_SCOPES: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault', 'self-test', 'alarm-mute'];

// The published HAP service type of every row, written out here rather than read off the catalogue,
// so a row that changed service type fails at the descriptor as well as behind it. The two backup
// battery rows share a kind and a subtype and differ only here, which is what makes the descriptor
// keyable.
const LEAK_SENSOR_UUID = '00000083-0000-1000-8000-0026BB765291';
const CONTACT_SENSOR_UUID = '00000080-0000-1000-8000-0026BB765291';
const BATTERY_UUID = '00000096-0000-1000-8000-0026BB765291';
const SUMP_PIT_SERVICE_UUID = 'ed31d704-44c8-4f20-9de0-6f29b33ef607';
const PUMP_SERVICE_UUID = '523f059e-deaa-4674-bbb2-980f9f7da7ec';
const SUMP_MAINS_POWER_SERVICE_UUID = 'fbb41424-0697-4ebe-ba89-7ba8ea254623';
const BACKUP_BATTERY_SERVICE_UUID = 'eb139c1e-aa1d-4318-bee9-60a338d99686';
const SWITCH_UUID = '00000049-0000-1000-8000-0026BB765291';

// Every service this accessory publishes, in the catalogue's declared order.
const PUBLISHED_SERVICES: readonly ServiceDescriptor[] = [
  { kind: 'sump-pit-flood', subtype: 'sump-pit-flood', serviceUuid: LEAK_SENSOR_UUID, name: 'Sump Pit Flood' },
  { kind: 'sump-pit-level', subtype: 'sump-pit-level', serviceUuid: SUMP_PIT_SERVICE_UUID, name: 'Sump Pit Level' },
  { kind: 'primary-pump', subtype: 'primary-pump', serviceUuid: PUMP_SERVICE_UUID, name: 'Primary Pump' },
  { kind: 'primary-pump-running', subtype: 'primary-pump-running', serviceUuid: CONTACT_SENSOR_UUID, name: 'Primary Pump Running' },
  { kind: 'backup-pump', subtype: 'backup-pump', serviceUuid: PUMP_SERVICE_UUID, name: 'Backup Pump' },
  { kind: 'backup-pump-activated', subtype: 'backup-pump-activated', serviceUuid: CONTACT_SENSOR_UUID, name: 'Backup Pump Activated' },
  { kind: 'sump-mains-power', subtype: 'sump-mains-power', serviceUuid: SUMP_MAINS_POWER_SERVICE_UUID, name: 'Sump Mains Power' },
  { kind: 'mains-power-lost', subtype: 'mains-power-lost', serviceUuid: CONTACT_SENSOR_UUID, name: 'Mains Power Lost' },
  { kind: 'backup-battery', subtype: 'backup-battery', serviceUuid: BATTERY_UUID, name: 'Backup Battery' },
  { kind: 'backup-battery', subtype: 'backup-battery', serviceUuid: BACKUP_BATTERY_SERVICE_UUID, name: 'Backup Battery Facts' },
  { kind: 'primary-pump-fault', subtype: 'primary-pump-fault', serviceUuid: CONTACT_SENSOR_UUID, name: 'Primary Pump Fault' },
  { kind: 'backup-pump-fault', subtype: 'backup-pump-fault', serviceUuid: CONTACT_SENSOR_UUID, name: 'Backup Pump Fault' },
  { kind: 'water-sensor-fault', subtype: 'water-sensor-fault', serviceUuid: CONTACT_SENSOR_UUID, name: 'Water Sensor Fault' },
  { kind: 'pump-controller-link-lost', subtype: 'pump-controller-link-lost', serviceUuid: CONTACT_SENSOR_UUID, name: 'Pump Controller Link Lost' },
  { kind: 'system-self-test', subtype: 'system-self-test', serviceUuid: SWITCH_UUID, name: 'System Self-Test' },
  { kind: 'alarm-mute', subtype: 'alarm-mute', serviceUuid: SWITCH_UUID, name: 'Alarm Mute' },
  { kind: 'basement-guardian-offline', subtype: 'basement-guardian-offline', serviceUuid: CONTACT_SENSOR_UUID, name: 'Basement Guardian Offline' },
];

// The scope each published service reads, in the same order, so a case can name the services one
// failing scope deactivates without restating the catalogue.
const PUBLISHED_SCOPES: readonly TrustScope[] = [
  'water',
  'water',
  'pump',
  'pump',
  'pump',
  'pump',
  'power',
  'power',
  'battery',
  'battery',
  'fault',
  'fault',
  'fault',
  'fault',
  'self-test',
  'alarm-mute',
  'connectivity',
];

// The one row that keeps publishing while a lost controller link makes its own scope untrusted: the
// network module reports that link state directly, so the adapter for it stays truthful (D-11).
const CONTROLLER_LINK_ROW = 'Pump Controller Link Lost';

// The two control rows. Both are published from the first update whatever their scope reports,
// because a room holding only sensors does not render in Apple Home at all and these Switches are
// what make the accessory's room visible (D-03).
const SELF_TEST_ROW = 'System Self-Test';
const ALARM_MUTE_ROW = 'Alarm Mute';

// The statuses a refused write answers, written out here rather than read off the namespace (D-04).
const NOT_ALLOWED_IN_CURRENT_STATE = -70412;
const SERVICE_COMMUNICATION_FAILURE = -70402;
const RESOURCE_BUSY = -70403;

// Every published service that reads the `fault` scope, whether or not it is filed under it.
// `Sump Pit Level` reads the reported water sensor fault beside its level, and both pump services
// read their pump's own fault and fuse, so one bad `fault` field costs all three the right to call
// what they publish current (D-014).
const FAULT_READING_SERVICES: readonly string[] = [
  'Sump Pit Level',
  'Primary Pump',
  'Backup Pump',
  'Primary Pump Fault',
  'Backup Pump Fault',
  'Water Sensor Fault',
  CONTROLLER_LINK_ROW,
];

// The whole controller-link report, written out here rather than matched on a fragment, so a case
// asserts what an owner reads: the device it names, the condition, and what happens to the values.
const CONTROLLER_LINK_WARNING =
  `Lost the pump controller link on ${DEVICE_ID}: the vendor cloud still answers, so water, pump, power, ` +
  'battery, and fault values are retained rather than refreshed until the link returns.';

// A name a user typed, deliberately unlike anything the catalogue publishes, so a case that asserts
// it survived cannot be satisfied by a seed.
const USER_RENAME = 'Fuse Box';

// Every module under `src/accessories/`, read as source so a prohibited idiom fails here by name
// rather than through some downstream symptom.
const ACCESSORY_MODULES: readonly string[] = ['basementGuardian.ts', 'customCharacteristics.ts', 'customServices.ts', 'serviceCatalogue.ts'];

// The construction that turns a characteristic unreadable, named once so the gate below and the one
// exception to it cannot drift apart.
const ERRORED_CHARACTERISTIC = 'HapStatusError';

// The modules that must never name it at all. `serviceCatalogue.ts` is deliberately absent:
// `D-10` grants it exactly one, and the case below pins the count and where that one sits rather
// than permitting the module wholesale (03-CONTEXT D-05).
const MODULES_ERRORING_NO_CHARACTERISTIC: readonly string[] = ['basementGuardian.ts', 'customCharacteristics.ts', 'customServices.ts'];

// The namespace holds no per-scenario state: a service and its characteristics live on the
// accessory that added them, so one stand-in serves every case.
const HAP = createFakeHap();

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];

const {
  ControllerDataLastTrustedAt,
  ControllerLinkPresent,
  LastActivationWasTestActivity,
  LastObservedActivationAt,
  MainsPowerPresent,
  ObservationStartedAt,
  ObservedActivationCount,
} = createCustomCharacteristics(HAP_NAMESPACE);
const CATALOGUE = createServiceCatalogue(HAP_NAMESPACE);

void ({
  deviceId: DEVICE_ID,
  services: [{ kind: 'sump-pit-flood', subtype: 'sump-pit-flood', serviceUuid: LEAK_SENSOR_UUID, name: 'Sump Pit Flood' }],
  untrusted: [],
  update: () => undefined,
  markMonitoring: () => undefined,
} satisfies BasementGuardianAccessory);

// @ts-expect-error the accessory is seeded by the immutable vendor identifier
void ({ services: [], untrusted: [], update: () => undefined, markMonitoring: () => undefined } satisfies BasementGuardianAccessory);
// @ts-expect-error state reaches HomeKit through the update entry point alone
void ({ deviceId: DEVICE_ID, services: [], untrusted: [], markMonitoring: () => undefined } satisfies BasementGuardianAccessory);
void ({
  deviceId: DEVICE_ID,
  // @ts-expect-error a published service is a keyed descriptor, not a bare name
  services: ['sump-pit-flood'],
  untrusted: [],
  update: () => undefined,
  markMonitoring: () => undefined,
} satisfies BasementGuardianAccessory);
void ({
  deviceId: DEVICE_ID,
  services: [],
  // @ts-expect-error a degraded scope is a keyed descriptor, not a bare name
  untrusted: ['water'],
  update: () => undefined,
  markMonitoring: () => undefined,
} satisfies BasementGuardianAccessory);
// @ts-expect-error the account-wide monitoring trust is how a lost path reaches the published rows
void ({ deviceId: DEVICE_ID, services: [], untrusted: [], update: () => undefined } satisfies BasementGuardianAccessory);

// A full, legal Gemini telemetry payload. The trust-scope cases below run the real adapter rather
// than a stand-in, because the claim they check is about the whole chain -- a wire field, the scope
// that owns it, and the services that scope deactivates -- and a stand-in family would let this
// module assert its own answer (D-02, D-014).
const GEMINI_TELEMETRY: Readonly<Record<string, unknown>> = {
  water_level: 1,
  primary_pump_running: false,
  primary_pump_fault: false,
  backup_pump_running: false,
  backup_pump_fault: false,
  backup_pump_fuse_blown: false,
  ac_power: true,
  battery_charging: false,
  battery_voltage_low: false,
  battery_health: 8,
  hours_of_protection: 8,
  water_sensor_fault: false,
  serial_communications: true,
  alarm_audio_muted: false,
  test_running: false,
  offline: false,
};

// Every `TrustScope` member, written out here rather than imported, so the accessory's own list and
// the union cannot drift apart without a case saying so.
const EVERY_TRUST_SCOPE: readonly TrustScope[] = ['alarm-mute', 'battery', 'connectivity', 'fault', 'power', 'pump', 'self-test', 'water'];

// Every scope in the stable order `untrusted` exposes them, written out here so
// a case naming the whole set does not read it back off the production list.
const EVERY_SCOPE_IN_ORDER: readonly TrustScope[] = ['water', 'pump', 'power', 'battery', 'fault', 'connectivity', 'self-test', 'alarm-mute'];

// The two transport facts, as the account runtime reports them.
const EVERY_TRANSPORT_WORKING: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: true, credentialsRejected: false };
const SHADOW_SILENT: MonitoringTrust = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false };
const REST_DEGRADED: MonitoringTrust = { restDegraded: true, shadowSilent: false, commandTransportReady: false, credentialsRejected: false };
const EVERY_TRANSPORT_LOST: MonitoringTrust = { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: false };
// The one trust that differs from the refusal below in the credential member alone, which is the
// pair the republish comparison has to tell apart (WR-04).
const COMMAND_TRANSPORT_UNREADY: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false };

// What the runtime reports once the vendor has refused the account credentials. The command
// transport is unready because the runtime has stopped for good, which is the shape `haltMonitoring`
// answers and the only shape this member ever arrives in (D-10, D-13).
const CREDENTIALS_REFUSED: MonitoringTrust = { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true };

// The cause a refusal names when the runtime has no proven way to reach the vendor. Written out
// here rather than read off the binder, so the accessory case fails if the two halves of the
// command gate ever start naming each other's cause (D-07, D-08).
const NO_COMMAND_TRANSPORT_CAUSE = 'the plugin has no way to reach the vendor right now';

// The cause a refusal names when the route is proven but the plugin cannot vouch for the capability's
// own reported state. Written out here for the same reason as the one above.
const NO_FRESH_STATE_CAUSE = 'the plugin has no fresh state for it';

// The cause a refusal names when the route and the reported value are both there but the live path
// has gone quiet, so no confirmation can come back inside the window. Written out for the same
// reason as the two above, and this one especially: it is the cause the accessory named wrongly
// until the rule behind it existed (D-07, D-08, WR-02).
const QUIET_LIVE_CONNECTION_CAUSE = 'the live connection is quiet, so the plugin cannot see the device confirm the command';

// The window a request waits in for the device's own confirming report, mirrored from the binder
// because it does not export it. A case picks the deadline out of the deferrals by this delay rather
// than running every deferral, which would also run a refusal's clearing push. A drift between the
// two numbers leaves the deadline uncollected and fails the case on a count of zero (D-037).
const PENDING_WINDOW_MS = 30_000;

// The four pump services a wrong-typed `test_timestamp` must leave alone. Filed under `pump` that
// field would deactivate two live safety signals, and it says nothing about whether a pump is
// running (D-02, D-014).
const PUMP_SERVICES: readonly string[] = ['Primary Pump', 'Backup Pump', 'Primary Pump Running', 'Backup Pump Activated'];

// The one device identity a case asks for when it wants the platform to have set none at all.
const NO_DEVICE_CONTEXT = Symbol('no device context');

// The receipt time every record case starts from, written as the string the record must publish and
// parsed into the milliseconds a snapshot carries, so the expectation is a literal rather than
// whatever the production formatter would answer.
const RECORD_RECEIVED_AT_ISO = '2026-09-01T12:00:00.000Z';
const RECORD_RECEIVED_AT = Date.parse(RECORD_RECEIVED_AT_ISO);

// One default poll interval later, which is when the second snapshot of a two-snapshot case arrives.
const ONE_POLL_LATER_MS = 900_000;

function accessoryStandIn(device: unknown = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }): FakeAccessory {
  const accessory = createFakeAccessory(ACCESSORY_NAME, ACCESSORY_UUID);

  if (device !== NO_DEVICE_CONTEXT) {
    accessory.context.device = device;
  }

  return accessory;
}

// The prohibitions are about what a module does, not what it explains: the module headers name both
// forbidden idioms precisely in order to forbid them, so the check reads the code without comments.
function codeOf(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function silentLog(): Logging {
  return Object.assign(() => undefined, {
    prefix: 'basement guardian',
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
    log: () => undefined,
    success: () => undefined,
    warn: () => undefined,
  });
}

// A `Logging` stand-in that records every `warn()` call, so a case can assert
// the degradation transition logs exactly once.
function recordingLog(): { log: Logging; warnings: string[] } {
  const warnings: string[] = [];
  const log = Object.assign(() => undefined, {
    prefix: 'basement guardian',
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
    log: () => undefined,
    success: () => undefined,
    warn: (message: string) => {
      warnings.push(message);
    },
  });

  return { log, warnings };
}

// A `Timers` stand-in that records every call and schedules nothing. The accessory takes the port
// and never reaches for it, so a case asserts this recorder stayed empty across a whole transition.
function recordingTimers(): { timers: Timers; calls: string[] } {
  const calls: string[] = [];
  const timers: Timers = {
    setTimeout: (_handler, delayMs) => {
      calls.push(`setTimeout ${String(delayMs)}`);

      return undefined;
    },
    setInterval: (_handler, delayMs) => {
      calls.push(`setInterval ${String(delayMs)}`);

      return undefined;
    },
    clearTimeout: () => {
      calls.push('clearTimeout');
    },
    clearInterval: () => {
      calls.push('clearInterval');
    },
  };

  return { timers, calls };
}

// A `CommandPort` stand-in that records every send and accepts it. The accessory never sends on its
// own, so a case asserts this recorder stayed empty across a whole update.
function recordingCommands(): { commands: CommandPort; sends: string[] } {
  const sends: string[] = [];
  const commands: CommandPort = {
    send: (deviceId: string, capability: DeviceCapability, requested: boolean) => {
      sends.push(`${deviceId} ${capability} ${String(requested)}`);

      return Promise.resolve({ accepted: true });
    },
  };

  return { commands, sends };
}

// An `AccessoryStore` stand-in that counts every write request and performs none. The accessory
// mutates its own context and asks Homebridge to store it, so a case counts the asks; a case that
// asserts none were made is stating something about an absence, which watching behaviour alone
// cannot give (D-008, D-010).
function recordingStore(): { store: AccessoryStore; persisted: () => number } {
  let persists = 0;

  return {
    store: {
      persist: () => {
        persists += 1;
      },
    },
    persisted: () => persists,
  };
}

// Every macrotask a case has collected, run in the order the plugin armed them. A handler whose
// request was already resolved returns on its own, so the whole list is safe to run and a case
// states "whatever the plugin deferred" rather than picking an index it worked out by hand.
function runEvery(deferred: readonly (() => void)[]): void {
  for (const run of deferred) {
    run();
  }
}

// A deliberately deferred variant of the same transition, private to this module and never a
// production option. Every immediacy layer is shown to catch it, which is what makes a green layer
// evidence that the accessory did not defer rather than evidence that the layer cannot tell.
function deferredTransition(timers: Timers, run: () => void): unknown {
  return timers.setTimeout(run, 0);
}

function registryWith(outcome: FamilyOutcome<unknown>): FamilyRegistry {
  return { lookup: () => outcome, shouldLog: () => true };
}

// Answers each outcome in turn and then repeats the last one, so a case drives a sequence of
// snapshots through one accessory without restating the registry.
function registryOver(outcomes: readonly FamilyOutcome<unknown>[]): FamilyRegistry {
  const remaining = [...outcomes];
  let latest = remaining[0] ?? { kind: 'unknown' as const, deviceTypeId: DEVICE_TYPE_ID };

  return {
    lookup: () => {
      latest = remaining.shift() ?? latest;

      return latest;
    },
    shouldLog: () => true,
  };
}

interface SnapshotOverrides {
  deviceTypeId?: string;
  receivedAt?: number;
  connected?: boolean;
  data?: Readonly<Record<string, unknown>>;
}

function buildSnapshot(overrides: SnapshotOverrides = {}): DeviceSnapshot {
  const { deviceTypeId = DEVICE_TYPE_ID, receivedAt = 0, connected = true, data = {} } = overrides;

  return {
    identity: { deviceId: DEVICE_ID, deviceTypeId, name: ACCESSORY_NAME, serialNumber: 'serial-1' },
    connectivity: { connected, timestamp: 0 },
    data,
    metadata: {},
    shadowVersion: undefined,
    deviceTimestamp: undefined,
    receivedAt,
  };
}

function buildOptions(
  overrides: Partial<Omit<BasementGuardianAccessoryOptions, 'accessory'>> & { accessory: FakeAccessory },
): BasementGuardianAccessoryOptions {
  const { accessory, ...rest } = overrides;

  return {
    hap: HAP_NAMESPACE,
    registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }),
    log: silentLog(),
    timers: recordingTimers().timers,
    store: recordingStore().store,
    commands: recordingCommands().commands,
    ...rest,
    accessory: accessory as unknown as PlatformAccessory,
  };
}

function fakeFamily(overrides: Partial<DeviceFamily<unknown>>): DeviceFamily<unknown> {
  return {
    deviceTypeId: DEVICE_TYPE_ID,
    displayName: 'Wayne Water Gemini',
    implemented: true,
    validate: () => ({ valid: true }),
    decode: () => ({ metadata: {} }),
    capabilities: () => [],
    command: () => ({ desiredData: {} }),
    ...overrides,
  };
}

// The family-neutral decoded shape every adapter answers: one group per scope, and the `power`
// group absent when a case makes `ac_power` fail its shape. Every other group decodes, because a
// family omits only the scopes whose own fields did not validate (D-04).
function decodedState(mainsPresent?: boolean): Record<string, unknown> {
  return {
    metadata: { mcuFirmwareVersion: '1.2.3' },
    water: { levelCode: 0, levelPercent: 0, flooded: false },
    pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined },
    battery: { charging: true, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
    fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
    connectivity: { reportedOffline: false },
    'self-test': { running: false, testedAt: undefined },
    'alarm-mute': { muted: false },
    ...(mainsPresent === undefined ? {} : { power: { mainsPresent } }),
  };
}

// A family that reports mains power until a case makes `ac_power` fail its shape, which is the one
// per-field failure the power rows read.
function powerFamily(mainsPresent?: boolean): DeviceFamily<unknown> {
  const violations = [{ field: 'ac_power', reason: 'missing' as const, scope: 'power' as const }];

  return fakeFamily({
    validate: () => (mainsPresent === undefined ? { valid: false, violations } : { valid: true }),
    decode: () => decodedState(mainsPresent),
  });
}

interface LinkOverrides {
  linkPresent: boolean;
  mainsPresent?: boolean;
  flooded?: boolean;
  violations?: readonly FieldViolation[];
}

// A family whose fault group reports the controller link state. `serial_communications` is a
// reported condition rather than a validation failure, so the whole payload keeps validating and
// every scope group decodes while the link is down -- which is what makes the distrust the
// accessory's own decision rather than a consequence of a failed field.
function linkFamily({ linkPresent, mainsPresent = true, flooded = false, violations = [] }: LinkOverrides): DeviceFamily<unknown> {
  return fakeFamily({
    validate: () => (violations.length === 0 ? { valid: true } : { valid: false, violations }),
    decode: () => ({
      metadata: { mcuFirmwareVersion: '1.2.3' },
      water: flooded ? { levelCode: FLOODING_LEVEL_CODE, levelPercent: FLOODING_LEVEL_PERCENT, flooded } : { levelCode: 0, levelPercent: 0, flooded },
      pump: { primaryRunning: false, backupRunning: false, backupActivatedAt: undefined },
      power: { mainsPresent },
      battery: { charging: true, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
      fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: linkPresent },
      connectivity: { reportedOffline: false },
      'self-test': { running: false, testedAt: undefined },
      'alarm-mute': { muted: false },
    }),
  });
}

function linkOutcome(overrides: LinkOverrides): FamilyOutcome<unknown> {
  return { kind: 'implemented', family: linkFamily(overrides) };
}

function accessoryWith(accessory: FakeAccessory, overrides: Partial<Omit<BasementGuardianAccessoryOptions, 'accessory'>>): BasementGuardianAccessory {
  return createBasementGuardianAccessory(buildOptions({ accessory, ...overrides }));
}

// One snapshot in a sequence a case drives, named by the wire fields that moved and by the moment
// the plugin received them. The receipt time matters here in a way it does not elsewhere: it is
// what the observation start and every watched activation are recorded from.
interface TelemetryUpdate {
  data?: Readonly<Record<string, unknown>>;
  receivedAt?: number;
}

// One accessory driven by the real Gemini adapter over a sequence of payloads, so a case states the
// wire fields that moved and reads back the record they produced. The adapter is the real one
// because the claim is about the whole chain -- a wire field, the scope that owns it, and the record
// the accessory built from it -- and a stand-in family would let this module assert its own answer.
function geminiUpdates(
  accessory: FakeAccessory,
  updates: readonly TelemetryUpdate[],
  overrides: Partial<Omit<BasementGuardianAccessoryOptions, 'accessory'>> = {},
): BasementGuardianAccessory {
  const basementGuardianAccessory = accessoryWith(accessory, {
    registry: registryWith({ kind: 'implemented', family: geminiFamily }),
    ...overrides,
  });

  for (const { data = {}, receivedAt = RECORD_RECEIVED_AT } of updates) {
    basementGuardianAccessory.update(buildSnapshot({ data: { ...GEMINI_TELEMETRY, ...data }, receivedAt }), 'poll');
  }

  return basementGuardianAccessory;
}

// One accessory driven by the real Gemini adapter over one snapshot, so a case states a wire field
// and reads back the services it reached.
function geminiAccessory(
  accessory: FakeAccessory,
  data: Readonly<Record<string, unknown>>,
  overrides: Partial<Omit<BasementGuardianAccessoryOptions, 'accessory'>> = {},
): BasementGuardianAccessory {
  const basementGuardianAccessory = accessoryWith(accessory, {
    registry: registryWith({ kind: 'implemented', family: geminiFamily }),
    ...overrides,
  });

  basementGuardianAccessory.update(buildSnapshot({ data: { ...GEMINI_TELEMETRY, ...data } }), 'poll');

  return basementGuardianAccessory;
}

// A service is resolved by the name HomeKit shows rather than by its subtype, because the two
// backup battery services share one subtype and differ only in their service type.
function rowNamed(displayName: string): ServiceRow {
  const row = CATALOGUE.find((candidate) => candidate.displayName === displayName);

  if (row === undefined) {
    throw new Error(`the catalogue publishes no ${displayName} row`);
  }

  return row;
}

// A row resolved by the slug it publishes under, so a case that is about the published name writes
// no name of its own: the expected value is read back from the row.
function rowOfKind(kind: ServiceKind): ServiceRow {
  const row = CATALOGUE.find((candidate) => candidate.kind === kind);

  if (row === undefined) {
    throw new Error(`the catalogue publishes no ${kind} row`);
  }

  return row;
}

function serviceOf(accessory: FakeAccessory, displayName: string): FakeHapService {
  const row = rowNamed(displayName);
  // The catalogue declares its classes against the real HAP types while the accessory stand-in
  // answers its own; the class is one runtime object, so the lookup needs the stand-in's view of it.
  const service = accessory.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);

  if (service === undefined) {
    throw new Error(`the accessory publishes no ${displayName} service`);
  }

  return service;
}

function valueOf(accessory: FakeAccessory, displayName: string, characteristic: { UUID: string }): unknown {
  return serviceOf(accessory, displayName).characteristics.find((candidate) => candidate.UUID === characteristic.UUID)?.value;
}

function statusActiveOf(accessory: FakeAccessory, displayName: string): unknown {
  return valueOf(accessory, displayName, HAP.Characteristic.StatusActive);
}

// The scopes the accessory currently cannot vouch for, each with the reason it
// gives, so a case states the whole answer rather than one property of it.
function distrustOf(basementGuardianAccessory: BasementGuardianAccessory): readonly string[] {
  return basementGuardianAccessory.untrusted.map((scope) => `${scope.scope} ${scope.reason}`);
}

// Every characteristic the accessory has published, keyed by the service and
// the characteristic HomeKit shows, so a case compares the whole published
// surface across a transition instead of one value it chose in advance.
function publishedValues(accessory: FakeAccessory): ReadonlyMap<string, unknown> {
  const values = new Map<string, unknown>();

  for (const row of CATALOGUE) {
    const service = accessory.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);

    for (const characteristic of service?.characteristics ?? []) {
      values.set(`${row.displayName} / ${characteristic.displayName}`, characteristic.value);
    }
  }

  return values;
}

// Which published characteristics moved across a transition, by the name
// HomeKit shows for each.
function movedSince(before: ReadonlyMap<string, unknown>, accessory: FakeAccessory): readonly string[] {
  return [...publishedValues(accessory)].filter(([name, value]) => before.get(name) !== value).map(([name]) => name.split(' / ').at(-1) ?? name);
}

// What a controller reading one service's trust report meets, which is what an owner meets: the
// value, or the status HAP stored on the characteristic and throws ahead of the value. It is read
// through the get path rather than off a flag, because the refusal is the whole thing the owner is
// looking at (D-10).
function statusActiveReadOf(accessory: FakeAccessory, displayName: string): unknown {
  try {
    return serviceOf(accessory, displayName).getCharacteristic(HAP.Characteristic.StatusActive)?.handleGetRequest();
  } catch (thrown: unknown) {
    return `refused ${String(thrown)}`;
  }
}

// The same read over both controls and one sensor beside them. A control write that reached past
// the controls would show here, and a claim about "both controls" made from one of them would not
// be a claim about the pair (CR-02).
function trustReportReadsOf(accessory: FakeAccessory): Record<string, unknown> {
  return {
    selfTest: statusActiveReadOf(accessory, SELF_TEST_ROW),
    alarmMute: statusActiveReadOf(accessory, ALARM_MUTE_ROW),
    flood: statusActiveReadOf(accessory, 'Sump Pit Flood'),
  };
}

// A published accessory whose deferred work is held rather than run, so a case fires the macrotask
// a refused write recorded at the moment it chooses. Every control request ends by arming one.
function haltableAccessory(commands: CommandPort): {
  accessory: FakeAccessory;
  basementGuardianAccessory: BasementGuardianAccessory;
  deferred: (() => void)[];
} {
  const accessory = accessoryStandIn();
  const deferred: (() => void)[] = [];
  const timers: Timers = {
    ...recordingTimers().timers,
    setTimeout: (handler) => {
      deferred.push(handler);

      return deferred.length - 1;
    },
  };
  const basementGuardianAccessory = geminiAccessory(accessory, { test_running: false, alarm_audio_muted: false }, { timers, commands });
  basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);

  return { accessory, basementGuardianAccessory, deferred };
}

// The platform's own two acts on a refused credential, in the order the platform makes them: every
// accessory is told what the runtime now knows, and only then is every trust report made
// unreadable. The order is load-bearing rather than incidental -- an ordinary push clears a stored
// status, so a status pushed first would be undone by the boolean that followed it. The marking runs
// through the pass the plugin exports rather than through a copy of it, so a case cannot drift from
// what an owner is actually shown (D-10).
function refuseTheCredentials(accessory: FakeAccessory, basementGuardianAccessory: BasementGuardianAccessory): void {
  basementGuardianAccessory.markMonitoring(CREDENTIALS_REFUSED);
  markServicesUnreadable(accessory as unknown as PlatformAccessory, HAP_NAMESPACE, HAP.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
}

// The `On` characteristic of a published Switch, which is where a controller write enters.
function onCharacteristicOf(accessory: FakeAccessory, displayName: string): FakeHapCharacteristic {
  const characteristic = serviceOf(accessory, displayName).getCharacteristic(HAP.Characteristic.On);

  if (characteristic === undefined) {
    throw new Error(`the ${displayName} service carries no On characteristic`);
  }

  return characteristic;
}

async function sourceOf(module: string): Promise<string> {
  return readFile(new URL(`../../../src/accessories/${module}`, import.meta.url), 'utf8');
}

function occurrences(code: string, needle: string): number {
  return code.split(needle).length - 1;
}

// Everything one pump service publishes about what the plugin observed it do, read back by the
// identifiers of the four record characteristics rather than by position.
function pumpRecordOf(accessory: FakeAccessory, displayName: string): Record<string, unknown> {
  return {
    observationStartedAt: valueOf(accessory, displayName, ObservationStartedAt),
    activationCount: valueOf(accessory, displayName, ObservedActivationCount),
    lastActivationAt: valueOf(accessory, displayName, LastObservedActivationAt),
    lastActivationWasTestActivity: valueOf(accessory, displayName, LastActivationWasTestActivity),
  };
}

// The declared members of the accessory's injected options, read from the source rather than from
// the type, because the claim is about what the interface does not declare. A member typed `API`
// would hand the accessories tier a live Homebridge handle; the narrow persist port exists so that
// boundary is never crossed, and a type cannot be asked what it refuses to carry (D-008).
function declaredOptions(source: string): { members: readonly string[]; block: string } {
  const block = /export interface BasementGuardianAccessoryOptions \{([\s\S]*?)\n\}/u.exec(codeOf(source))?.[1] ?? '';

  return { members: [...block.matchAll(/^ {2}(\w+)\??:/gmu)].map((match) => match[1] ?? ''), block };
}

describe('createBasementGuardianAccessory', () => {
  test('reads deviceId from the accessory context the platform set', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    const basementGuardianAccessory = accessoryWith(accessory, {});

    // assert
    assert.strictEqual(basementGuardianAccessory.deviceId, DEVICE_ID);
  });

  test('throws when the accessory context carries no device identity', () => {
    // arrange
    const accessory = accessoryStandIn(NO_DEVICE_CONTEXT);

    // act & assert
    assert.throws(() => accessoryWith(accessory, {}), Error);
  });

  test('throws when the accessory context itself is not a record', () => {
    // arrange
    // A context that is not a record at all, which no accessory stand-in can express because every
    // constructed accessory carries one. It reaches the identity guard and nothing further.
    const accessory = { context: null } as unknown as PlatformAccessory;

    // act & assert
    assert.throws(() => createBasementGuardianAccessory({ ...buildOptions({ accessory: accessoryStandIn() }), accessory }), Error);
  });

  test('throws when the accessory context device carries a deviceId of the wrong type', () => {
    // arrange
    const accessory = accessoryStandIn({ deviceId: 12345, deviceTypeId: DEVICE_TYPE_ID });

    // act & assert
    assert.throws(() => accessoryWith(accessory, {}), Error);
  });

  test('throws when the accessory context device carries a deviceTypeId of the wrong type', () => {
    // arrange
    const accessory = accessoryStandIn({ deviceId: DEVICE_ID, deviceTypeId: 12345 });

    // act & assert
    assert.throws(() => accessoryWith(accessory, {}), Error);
  });

  test('publishes no service and marks no scope untrusted before the first update', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    const basementGuardianAccessory = accessoryWith(accessory, {});

    // assert
    assert.deepStrictEqual({ services: basementGuardianAccessory.services, untrusted: basementGuardianAccessory.untrusted }, { services: [], untrusted: [] });
  });

  test('degrades every non-connectivity scope and publishes nothing when no adapter resolves', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }) });
    const accessoryInformation = accessory.getService(HAP.Service.AccessoryInformation);
    const beforeUpdate = accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value;

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.untrusted,
      DEGRADED_SCOPES.map((scope) => ({ scope, reason: 'invalid', lastTrustedAt: undefined })),
    );
    assert.deepStrictEqual(basementGuardianAccessory.services, []);
    assert.strictEqual(accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value, beforeUpdate);
  });

  test('deactivates every service derived from the profile and leaves the offline sensor active when the family stops resolving', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');
    const whileResolving = PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name));

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      whileResolving,
      PUBLISHED_SERVICES.map(() => true),
    );
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SCOPES.map((scope) => scope === 'connectivity'),
    );
  });

  test('confirms the device offline on the configured polls while the family does not resolve', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true }), { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    const afterOne = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterOne, afterTwo: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterOne: CONTACT_DETECTED, afterTwo: CONTACT_NOT_DETECTED },
    );
  });

  test('leaves the offline confirmation run untouched by a live update while the family does not resolve', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true }), { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'poll');

    // act
    for (let update = 0; update < 10; update += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'live');
    }

    // assert
    assert.strictEqual(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState), CONTACT_DETECTED);
  });

  test('retains the flood it published when the family stops resolving', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, flooded: true }), { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        flood: valueOf(accessory, 'Sump Pit Flood', HAP.Characteristic.LeakDetected),
        floodActive: statusActiveOf(accessory, 'Sump Pit Flood'),
        level: valueOf(accessory, 'Sump Pit Level', HAP.Characteristic.WaterLevel),
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
      },
      { flood: LEAK_DETECTED, floodActive: false, level: FLOODING_LEVEL_PERCENT, reported: true },
    );
  });

  test('adds no service when the family stops resolving before it ever resolved', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }) });
    const addServiceSpy = t.mock.method(accessory, 'addService');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual({ services: basementGuardianAccessory.services, added: addServiceSpy.mock.callCount() }, { services: [], added: 0 });
  });

  test('logs the degradation transition exactly once across repeated degraded updates', () => {
    // arrange
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.strictEqual(warnings.length, 1);
  });

  test('logs again after recovering and degrading a second time', () => {
    // arrange
    const family = fakeFamily({});
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID },
      { kind: 'implemented', family },
      { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID },
    ];
    const { log, warnings } = recordingLog();
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log, registry });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.strictEqual(warnings.length, 2);
  });

  test('asks the family for its verdict before it asks the family to decode', () => {
    // arrange
    const calls: string[] = [];
    const family = fakeFamily({
      validate: () => {
        calls.push('validate');

        return { valid: true };
      },
      decode: () => {
        calls.push('decode');

        return decodedState(true);
      },
    });
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith({ kind: 'implemented', family }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(calls, ['validate', 'decode']);
  });

  test('publishes every service in catalogue order and marks each one active', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.services, PUBLISHED_SERVICES);
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    );
  });

  test('keys every published service distinctly, including the two backup battery services', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      [...new Set(basementGuardianAccessory.services.map((descriptor) => `${descriptor.kind}/${descriptor.subtype}/${descriptor.serviceUuid}`))],
      PUBLISHED_SERVICES.map((descriptor) => `${descriptor.kind}/${descriptor.subtype}/${descriptor.serviceUuid}`),
    );
  });

  for (const mainsPresent of [true, false]) {
    test(`publishes a reported ac_power of ${String(mainsPresent)} on both power services`, () => {
      // arrange
      const accessory = accessoryStandIn();
      const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(mainsPresent) }) });

      // act
      basementGuardianAccessory.update(buildSnapshot(), 'poll');

      // assert
      assert.deepStrictEqual(
        {
          reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
          adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
          fault: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.StatusFault),
        },
        { reported: mainsPresent, adapter: mainsPresent ? CONTACT_DETECTED : CONTACT_NOT_DETECTED, fault: HAP.Characteristic.StatusFault.NO_FAULT },
      );
    });
  }

  test('publishes every value before update() returns, with no await and no tick', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(false) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.strictEqual(valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState), CONTACT_NOT_DETECTED);
  });

  test('refreshes AccessoryInformation from the decoded metadata', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    const accessoryInformation = accessory.getService(HAP.Service.AccessoryInformation);

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        manufacturer: accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value,
        model: accessoryInformation?.getCharacteristic(HAP.Characteristic.Model)?.value,
        serialNumber: accessoryInformation?.getCharacteristic(HAP.Characteristic.SerialNumber)?.value,
        firmwareRevision: accessoryInformation?.getCharacteristic(HAP.Characteristic.FirmwareRevision)?.value,
      },
      { manufacturer: 'Wayne', model: 'Gemini', serialNumber: 'serial-1', firmwareRevision: '1.2.3' },
    );
  });

  for (const { label, decoded } of [
    { label: 'the decoded metadata carries no mcuFirmwareVersion', decoded: { metadata: {} } },
    { label: 'the mcuFirmwareVersion is not text', decoded: { metadata: { mcuFirmwareVersion: 7 } } },
  ]) {
    test(`defaults FirmwareRevision to "unknown" when ${label}`, () => {
      // arrange
      const accessory = accessoryStandIn();
      const family = fakeFamily({ decode: () => decoded });
      const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family }) });

      // act
      basementGuardianAccessory.update(buildSnapshot(), 'poll');

      // assert
      assert.strictEqual(accessory.getService(HAP.Service.AccessoryInformation)?.getCharacteristic(HAP.Characteristic.FirmwareRevision)?.value, 'unknown');
    });
  }

  for (const { label, decoded } of [
    { label: 'decodes a non-object state', decoded: null },
    { label: 'decodes an array', decoded: [] },
    { label: 'omits the metadata group', decoded: {} },
    { label: 'decodes a metadata group that is not a record', decoded: { metadata: 'absent' } },
  ]) {
    test(`leaves AccessoryInformation untouched when the family ${label}`, () => {
      // arrange
      const accessory = accessoryStandIn();
      const family = fakeFamily({ decode: () => decoded });
      const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family }) });
      const accessoryInformation = accessory.getService(HAP.Service.AccessoryInformation);
      const beforeUpdate = accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value;

      // act
      basementGuardianAccessory.update(buildSnapshot(), 'poll');

      // assert
      assert.strictEqual(accessoryInformation?.getCharacteristic(HAP.Characteristic.Manufacturer)?.value, beforeUpdate);
    });
  }

  test('throws when the accessory carries no AccessoryInformation service', () => {
    // arrange
    const accessory = accessoryStandIn();
    const accessoryInformation = accessory.getService(HAP.Service.AccessoryInformation);
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    accessory.removeService(accessoryInformation ?? serviceOf(accessory, 'Sump Mains Power'));

    // act & assert
    assert.throws(() => {
      basementGuardianAccessory.update(buildSnapshot(), 'poll');
    }, Error);
  });

  test('adds no service and changes nothing on a second update with the same snapshot', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const firstServices = [...basementGuardianAccessory.services];
    const addServiceSpy = t.mock.method(accessory, 'addService');
    const removeServiceSpy = t.mock.method(accessory, 'removeService');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.services, firstServices);
    assert.deepStrictEqual({ added: addServiceSpy.mock.callCount(), removed: removeServiceSpy.mock.callCount() }, { added: 0, removed: 0 });
  });

  test('keeps the last trustworthy power values when ac_power stops validating', () => {
    // arrange
    const accessory = accessoryStandIn();
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'implemented', family: powerFamily(true) },
      { kind: 'implemented', family: powerFamily(undefined) },
    ];
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'implemented', family: powerFamily(undefined) }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');
    const beforeFailing = {
      reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
      adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
    };

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
      },
      beforeFailing,
    );
    assert.deepStrictEqual(beforeFailing, { reported: true, adapter: CONTACT_DETECTED });
  });

  test('deactivates only the services of the scope that stopped validating', () => {
    // arrange
    const accessory = accessoryStandIn();
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'implemented', family: powerFamily(true) },
      { kind: 'implemented', family: powerFamily(undefined) },
    ];
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'implemented', family: powerFamily(undefined) }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SCOPES.map((scope) => scope !== 'power'),
    );
  });

  test('deactivates every service that reads the fault scope when one fault field stops validating', () => {
    // arrange
    const accessory = accessoryStandIn();
    const violations: readonly FieldViolation[] = [{ field: 'backup_pump_fault', reason: 'wrong-type', scope: 'fault' }];
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: true, violations })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SERVICES.map((descriptor) => !FAULT_READING_SERVICES.includes(descriptor.name)),
    );
  });

  test('retains the quiet fault values it published while the fault scope is untrusted', () => {
    // arrange
    const accessory = accessoryStandIn();
    const { PumpFault, WaterSensorFaultReported } = createCustomCharacteristics(HAP_NAMESPACE);
    const violations: readonly FieldViolation[] = [{ field: 'backup_pump_fault', reason: 'wrong-type', scope: 'fault' }];
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: true, violations })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        primaryFault: valueOf(accessory, 'Primary Pump', PumpFault),
        primaryStatus: valueOf(accessory, 'Primary Pump', HAP.Characteristic.StatusFault),
        waterSensorFault: valueOf(accessory, 'Sump Pit Level', WaterSensorFaultReported),
        adapter: valueOf(accessory, 'Backup Pump Fault', HAP.Characteristic.ContactSensorState),
      },
      { primaryFault: false, primaryStatus: HAP.Characteristic.StatusFault.NO_FAULT, waterSensorFault: false, adapter: CONTACT_DETECTED },
    );
  });

  test('publishes no service for a scope whose fields have never validated', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(undefined) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.services,
      PUBLISHED_SERVICES.filter((_, index) => PUBLISHED_SCOPES[index] !== 'power'),
    );
    assert.deepStrictEqual(
      {
        reported: accessory.getServiceById(rowNamed('Sump Mains Power').serviceClass as unknown as FakeServiceClass, 'sump-mains-power'),
        adapter: accessory.getServiceById(rowNamed('Mains Power Lost').serviceClass as unknown as FakeServiceClass, 'mains-power-lost'),
      },
      { reported: undefined, adapter: undefined },
    );
  });

  test('publishes the service for a scope on the first update in which its fields validate', () => {
    // arrange
    const accessory = accessoryStandIn();
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'implemented', family: powerFamily(undefined) },
      { kind: 'implemented', family: powerFamily(false) },
    ];
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'implemented', family: powerFamily(false) }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.services, PUBLISHED_SERVICES);
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
      },
      { reported: false, adapter: CONTACT_NOT_DETECTED },
    );
  });

  test('reports the failing scope alone, timed at the last snapshot in which it decoded', () => {
    // arrange
    const outcomes: FamilyOutcome<unknown>[] = [
      { kind: 'implemented', family: powerFamily(true) },
      { kind: 'implemented', family: powerFamily(undefined) },
    ];
    const registry: FamilyRegistry = { lookup: () => outcomes.shift() ?? { kind: 'implemented', family: powerFamily(undefined) }, shouldLog: () => true };
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [{ scope: 'power', reason: 'invalid', lastTrustedAt: 1_700_000_000_000 }]);
  });

  test('reports no last trusted time for a scope that has never decoded', () => {
    // arrange
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith({ kind: 'implemented', family: powerFamily(undefined) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [{ scope: 'power', reason: 'invalid', lastTrustedAt: undefined }]);
  });

  test('reports the fault scope with no last trusted time when its own fields never validated', () => {
    // arrange
    const family = fakeFamily({
      validate: () => ({ valid: false, violations: [{ field: 'serial_communications', reason: 'missing', scope: 'fault' }] }),
      decode: () => decodedState(true),
    });
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith({ kind: 'implemented', family }) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [{ scope: 'fault', reason: 'invalid', lastTrustedAt: undefined }]);
  });

  test('records a violation on a field no service reads without deactivating any scope', () => {
    // arrange
    const family = fakeFamily({
      validate: () => ({ valid: false, violations: [{ field: 'alarm_audio_muted', reason: 'missing', scope: undefined }] }),
      decode: () => decodedState(true),
    });
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, []);
    assert.strictEqual(statusActiveOf(accessory, 'Sump Mains Power'), true);
  });

  for (const threshold of [1, 2, 8]) {
    test(`activates the offline adapter on disconnected poll ${String(threshold)} and not before`, () => {
      // arrange
      const accessory = accessoryStandIn();
      const basementGuardianAccessory = accessoryWith(accessory, {
        registry: registryWith({ kind: 'implemented', family: powerFamily(true) }),
        offlineConfirmationPollCount: threshold,
      });

      // act
      const readings: unknown[] = [];

      for (let poll = 0; poll < threshold; poll += 1) {
        basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
        readings.push(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState));
      }

      // assert
      assert.deepStrictEqual(readings, [...Array<unknown>(threshold - 1).fill(CONTACT_DETECTED), CONTACT_NOT_DETECTED]);
    });
  }

  for (const offlineConfirmationPollCount of [0, -1, 1.5, Number.NaN]) {
    test(`refuses an offline confirmation poll count of ${String(offlineConfirmationPollCount)} at construction`, () => {
      // arrange
      const accessory = accessoryStandIn();

      // act & assert
      assert.throws(() => accessoryWith(accessory, { offlineConfirmationPollCount }), Error);
    });
  }

  test('takes the documented default of two consecutive disconnected polls', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    const afterOne = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterOne, afterTwo: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterOne: CONTACT_DETECTED, afterTwo: CONTACT_NOT_DETECTED },
    );
  });

  test('resets the run on a connected poll, so the next disconnected one alone does not reactivate', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'poll');
    const afterReconnect = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterReconnect, afterOneMore: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterReconnect: CONTACT_DETECTED, afterOneMore: CONTACT_DETECTED },
    );
  });

  test('holds no backlog after a long outage, so one connected poll fully clears the run', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, {
      registry: registryWith({ kind: 'implemented', family: powerFamily(true) }),
      offlineConfirmationPollCount: 8,
    });

    for (let poll = 0; poll < 20; poll += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    }

    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'poll');

    // act
    const readings: unknown[] = [];

    for (let poll = 0; poll < 7; poll += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
      readings.push(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState));
    }

    // assert
    assert.deepStrictEqual(readings, Array<unknown>(7).fill(CONTACT_DETECTED));
  });

  test('never activates the offline adapter from the device reporting itself offline', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });

    // act
    for (let poll = 0; poll < 10; poll += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: true, data: { offline: true } }), 'poll');
    }

    // assert
    assert.strictEqual(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState), CONTACT_DETECTED);
  });

  test('publishes every service but the suppressed one, in catalogue order', () => {
    // arrange
    const accessory = accessoryStandIn();
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }), ignoredFaults });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.services,
      PUBLISHED_SERVICES.filter((descriptor) => descriptor.kind !== 'mains-power-lost'),
    );
    assert.strictEqual(accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost'), undefined);
  });

  test('leaves the decoded condition and every sibling service untouched by a suppression', () => {
    // arrange
    const accessory = accessoryStandIn();
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(false) }), ignoredFaults });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        active: statusActiveOf(accessory, 'Sump Mains Power'),
        offline: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState),
        untrusted: basementGuardianAccessory.untrusted,
      },
      { reported: false, active: true, offline: CONTACT_DETECTED, untrusted: [] },
    );
  });

  test('removes a service a previous run published once suppression begins', () => {
    // arrange
    const accessory = accessoryStandIn();
    const published = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }) });
    published.update(buildSnapshot(), 'poll');
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const suppressed = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }), ignoredFaults });

    // act
    suppressed.update(buildSnapshot(), 'poll');

    // assert
    assert.strictEqual(accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost'), undefined);
  });

  test('removes a suppressed sensor a previous run published while the family no longer resolves', () => {
    // arrange
    const accessory = accessoryStandIn();
    const published = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });
    published.update(buildSnapshot({ connected: true }), 'poll');
    const ignoredFaults: readonly NotificationServiceKind[] = ['basement-guardian-offline', 'mains-power-lost'];
    const restarted = accessoryWith(accessory, { registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }), ignoredFaults });

    // act
    restarted.update(buildSnapshot({ connected: false }), 'poll');
    restarted.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        offline: accessory.getServiceById(HAP.Service.ContactSensor, 'basement-guardian-offline'),
        mainsPowerLost: accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost'),
        primaryPumpFaultActive: statusActiveOf(accessory, 'Primary Pump Fault'),
      },
      { offline: undefined, mainsPowerLost: undefined, primaryPumpFaultActive: false },
    );
  });

  test('applies the same suppression a second time without adding or removing a service', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: powerFamily(true) }), ignoredFaults });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const addServiceSpy = t.mock.method(accessory, 'addService');
    const removeServiceSpy = t.mock.method(accessory, 'removeService');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual({ added: addServiceSpy.mock.callCount(), removed: removeServiceSpy.mock.callCount() }, { added: 0, removed: 0 });
  });

  test('marks every controller-derived scope untrusted when the controller link is lost', () => {
    // arrange
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [
      { scope: 'water', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'pump', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'power', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'battery', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'fault', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'self-test', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'alarm-mute', reason: 'controller-link-lost', lastTrustedAt: undefined },
    ]);
  });

  test('keeps a field violation at reason invalid while the controller link is lost', () => {
    // arrange
    const violations: readonly FieldViolation[] = [{ field: 'water_level', reason: 'out-of-domain', scope: 'water' }];
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith(linkOutcome({ linkPresent: false, violations })) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [
      { scope: 'water', reason: 'invalid', lastTrustedAt: undefined },
      { scope: 'pump', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'power', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'battery', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'fault', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'self-test', reason: 'controller-link-lost', lastTrustedAt: undefined },
      { scope: 'alarm-mute', reason: 'controller-link-lost', lastTrustedAt: undefined },
    ]);
  });

  test('leaves connectivity trusted while the controller link is lost, because the cloud still answers', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SERVICES.map((descriptor, index) => descriptor.name === CONTROLLER_LINK_ROW || PUBLISHED_SCOPES[index] === 'connectivity'),
    );
  });

  test('publishes only the rows that can still vouch for themselves when the link is lost from the first poll', () => {
    // arrange
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.services,
      PUBLISHED_SERVICES.filter(
        (descriptor, index) =>
          descriptor.name === CONTROLLER_LINK_ROW ||
          descriptor.name === SELF_TEST_ROW ||
          descriptor.name === ALARM_MUTE_ROW ||
          PUBLISHED_SCOPES[index] === 'connectivity',
      ),
    );
  });

  test('keeps the controller link adapter reporting the lost link it observed directly', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        adapter: valueOf(accessory, CONTROLLER_LINK_ROW, HAP.Characteristic.ContactSensorState),
        reported: valueOf(accessory, CONTROLLER_LINK_ROW, ControllerLinkPresent),
      },
      { adapter: CONTACT_NOT_DETECTED, reported: false },
    );
  });

  test('retains the last controller-derived values published before the link was lost', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: false, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
      },
      { reported: true, adapter: CONTACT_DETECTED },
    );
  });

  test('times each poisoned scope at the last snapshot in which the controller link was present', () => {
    // arrange
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      basementGuardianAccessory.untrusted.map((untrusted) => untrusted.lastTrustedAt),
      [1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_000],
    );
  });

  test('publishes the time controller data was last trustworthy beside the lost link state', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.strictEqual(valueOf(accessory, CONTROLLER_LINK_ROW, ControllerDataLastTrustedAt), '2023-11-14T22:13:20.000Z');
  });

  test('clears the controller-link distrust on the first snapshot in which the link returns', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: false, mainsPresent: false }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, []);
    assert.deepStrictEqual(
      PUBLISHED_SERVICES.map((descriptor) => statusActiveOf(accessory, descriptor.name)),
      PUBLISHED_SERVICES.map(() => true),
    );
    assert.strictEqual(valueOf(accessory, 'Sump Mains Power', MainsPowerPresent), false);
  });

  test('reports the controller link condition exactly once across three consecutive lost-link updates', () => {
    // arrange
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log, registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(warnings, [CONTROLLER_LINK_WARNING]);
  });

  test('reports the controller link condition again after a recovery and a later re-entry', () => {
    // arrange
    const { log, warnings } = recordingLog();
    const registry = registryOver([linkOutcome({ linkPresent: false }), linkOutcome({ linkPresent: true }), linkOutcome({ linkPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log, registry });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(warnings, [CONTROLLER_LINK_WARNING, CONTROLLER_LINK_WARNING]);
  });

  test('does not call a lost controller link a validation failure', () => {
    // arrange
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { log, registry: registryWith(linkOutcome({ linkPresent: false })) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      warnings.filter((warning) => warning.includes('stopped validating')),
      [],
    );
  });

  test('leaves the offline confirmation run untouched by ten disconnected live updates', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });

    // act
    for (let update = 0; update < 10; update += 1) {
      basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'live');
    }

    const afterLiveUpdates = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterLiveUpdates, afterTwoPolls: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterLiveUpdates: CONTACT_DETECTED, afterTwoPolls: CONTACT_NOT_DETECTED },
    );
  });

  test('confirms offline on the configured polls despite a disconnected live update between them', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'live');
    const afterOnePoll = valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState);
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterOnePoll, afterTwoPolls: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState) },
      { afterOnePoll: CONTACT_DETECTED, afterTwoPolls: CONTACT_NOT_DETECTED },
    );
  });

  test('leaves a run of disconnected polls unreset by a connected live update between them', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');
    basementGuardianAccessory.update(buildSnapshot({ connected: true }), 'live');
    basementGuardianAccessory.update(buildSnapshot({ connected: false }), 'poll');

    // assert
    assert.strictEqual(valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState), CONTACT_NOT_DETECTED);
  });

  test('publishes a live update on the same characteristics a poll update publishes', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'live');

    // assert
    assert.deepStrictEqual(
      {
        reported: valueOf(accessory, 'Sump Mains Power', MainsPowerPresent),
        adapter: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
      },
      { reported: false, adapter: CONTACT_NOT_DETECTED },
    );
  });

  test('clears a safety condition on the same update that clears it in the source', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: false }), linkOutcome({ linkPresent: true, mainsPresent: true })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const whileActive = valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState);

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      { whileActive, afterClearing: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState) },
      { whileActive: CONTACT_NOT_DETECTED, afterClearing: CONTACT_DETECTED },
    );
  });

  test('records no call on the injected timer port across a source change to a published value', () => {
    // arrange
    const { timers, calls } = recordingTimers();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry, timers });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(calls, []);
  });

  test('calls no global scheduling function across a source change to a published value', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const setTimeoutSpy = t.mock.method(globalThis, 'setTimeout');
    const setIntervalSpy = t.mock.method(globalThis, 'setInterval');
    const setImmediateSpy = t.mock.method(globalThis, 'setImmediate');
    const queueMicrotaskSpy = t.mock.method(globalThis, 'queueMicrotask');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const scheduled = {
      setTimeout: setTimeoutSpy.mock.callCount(),
      setInterval: setIntervalSpy.mock.callCount(),
      setImmediate: setImmediateSpy.mock.callCount(),
      queueMicrotask: queueMicrotaskSpy.mock.callCount(),
    };

    // assert
    assert.deepStrictEqual(scheduled, { setTimeout: 0, setInterval: 0, setImmediate: 0, queueMicrotask: 0 });
  });

  test('carries the new value on the statement after update() returns, with no await and no tick', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const readImmediately = valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState);

    // assert
    assert.strictEqual(readImmediately, CONTACT_NOT_DETECTED);
  });

  test('the timer port layer catches a transition deferred through the injected port', () => {
    // arrange
    const accessory = accessoryStandIn();
    const { timers, calls } = recordingTimers();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry, timers });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    deferredTransition(timers, () => {
      basementGuardianAccessory.update(buildSnapshot(), 'poll');
    });

    // assert
    assert.deepStrictEqual(calls, ['setTimeout 0']);
  });

  test('the global spy layer catches a transition deferred through the process timers', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const setTimeoutSpy = t.mock.method(globalThis, 'setTimeout');

    // act
    const handle = deferredTransition(systemTimers, () => {
      basementGuardianAccessory.update(buildSnapshot(), 'poll');
    });
    systemTimers.clearTimeout(handle);

    // assert
    assert.strictEqual(setTimeoutSpy.mock.callCount(), 1);
  });

  test('the synchronous-visibility layer catches a transition deferred through the process timers', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true, mainsPresent: true }), linkOutcome({ linkPresent: true, mainsPresent: false })]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // act
    const handle = deferredTransition(systemTimers, () => {
      basementGuardianAccessory.update(buildSnapshot(), 'poll');
    });
    const readImmediately = valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState);
    systemTimers.clearTimeout(handle);

    // assert
    assert.strictEqual(readImmediately, CONTACT_DETECTED);
  });

  test('counts one activation for a backup pump it watched start', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    geminiUpdates(accessory, [{}, { data: { backup_pump_running: true }, receivedAt: RECORD_RECEIVED_AT + ONE_POLL_LATER_MS }]);

    // assert
    assert.strictEqual(valueOf(accessory, 'Backup Pump', ObservedActivationCount), 1);
  });

  // The count means nothing without the moment it is counted from, and nothing has been observed
  // yet, so the last activation is the empty string rather than a fabricated time (CTRL-01, D-020).
  test('publishes an observation start at the first snapshot receipt time and an empty last activation', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    geminiUpdates(accessory, [{}]);

    // assert
    assert.deepStrictEqual(pumpRecordOf(accessory, 'Primary Pump'), {
      observationStartedAt: RECORD_RECEIVED_AT_ISO,
      activationCount: 0,
      lastActivationAt: '',
      lastActivationWasTestActivity: undefined,
    });
  });

  // The record instance lives as long as the accessory does, for the same reason the platform reuses
  // one accessory instance across polls: a fresh instance per update would discard the observation
  // epoch and re-seed it from every snapshot (D-010, D-020).
  test('continues one record across updates rather than reseeding the observation start', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: geminiFamily }) });
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY, receivedAt: RECORD_RECEIVED_AT }), 'poll');
    const afterTheFirstUpdate = valueOf(accessory, 'Primary Pump', ObservationStartedAt);

    // act
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY, receivedAt: RECORD_RECEIVED_AT + ONE_POLL_LATER_MS }), 'poll');

    // assert
    assert.deepStrictEqual(
      { afterTheFirstUpdate, afterTheSecond: valueOf(accessory, 'Primary Pump', ObservationStartedAt) },
      { afterTheFirstUpdate: RECORD_RECEIVED_AT_ISO, afterTheSecond: RECORD_RECEIVED_AT_ISO },
    );
  });

  // The counted activation is asserted beside the four call counts on purpose: without it a broken
  // record path would report the same four zeroes as a working one, and the case would pass for
  // having driven nothing rather than for having deferred nothing (SAFE-07, D-18).
  test('calls no global scheduling function across an update that counts an activation', (t) => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: geminiFamily }) });
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY, receivedAt: RECORD_RECEIVED_AT }), 'poll');
    const setTimeoutSpy = t.mock.method(globalThis, 'setTimeout');
    const setIntervalSpy = t.mock.method(globalThis, 'setInterval');
    const setImmediateSpy = t.mock.method(globalThis, 'setImmediate');
    const queueMicrotaskSpy = t.mock.method(globalThis, 'queueMicrotask');

    // act
    basementGuardianAccessory.update(
      buildSnapshot({ data: { ...GEMINI_TELEMETRY, backup_pump_running: true }, receivedAt: RECORD_RECEIVED_AT + ONE_POLL_LATER_MS }),
      'poll',
    );
    const scheduled = {
      setTimeout: setTimeoutSpy.mock.callCount(),
      setInterval: setIntervalSpy.mock.callCount(),
      setImmediate: setImmediateSpy.mock.callCount(),
      queueMicrotask: queueMicrotaskSpy.mock.callCount(),
    };

    // assert
    assert.deepStrictEqual(
      { ...scheduled, counted: valueOf(accessory, 'Backup Pump', ObservedActivationCount) },
      { setTimeout: 0, setInterval: 0, setImmediate: 0, queueMicrotask: 0, counted: 1 },
    );
  });

  // A pump field that failed its shape costs the whole `pump` scope, so the row publishes nothing at
  // all and the count the last trustworthy update published stays exactly where it was. Advancing it
  // from a payload the family could not vouch for is the one thing the record must never do
  // (D-014, RES-01).
  test('keeps the count the last trustworthy update published while the pump scope is untrusted', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiUpdates(accessory, [
      {},
      { data: { backup_pump_running: true }, receivedAt: RECORD_RECEIVED_AT + ONE_POLL_LATER_MS },
    ]);
    const whileTrusted = pumpRecordOf(accessory, 'Backup Pump');

    // act
    basementGuardianAccessory.update(
      buildSnapshot({ data: { ...GEMINI_TELEMETRY, backup_pump_running: 'yes' }, receivedAt: RECORD_RECEIVED_AT + 2 * ONE_POLL_LATER_MS }),
      'poll',
    );

    // assert
    assert.deepStrictEqual(
      { count: whileTrusted.activationCount, record: pumpRecordOf(accessory, 'Backup Pump'), active: statusActiveOf(accessory, 'Backup Pump') },
      { count: 1, record: whileTrusted, active: false },
    );
  });

  // The other half of the same rule, and the half a record kept where it was cannot show on its own:
  // an undecoded running value must leave the previously reported one alone rather than settling to
  // `false`. A record that read it as `false` would manufacture an edge on the next `true` and count
  // a second activation for one physical run (D-009, D-014).
  test('counts no second activation when the pump scope recovers still reporting the same run', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiUpdates(accessory, [
      {},
      { data: { backup_pump_running: true }, receivedAt: RECORD_RECEIVED_AT + ONE_POLL_LATER_MS },
      { data: { backup_pump_running: 'yes' }, receivedAt: RECORD_RECEIVED_AT + 2 * ONE_POLL_LATER_MS },
    ]);

    // act
    basementGuardianAccessory.update(
      buildSnapshot({ data: { ...GEMINI_TELEMETRY, backup_pump_running: true }, receivedAt: RECORD_RECEIVED_AT + 3 * ONE_POLL_LATER_MS }),
      'poll',
    );

    // assert
    assert.deepStrictEqual(
      { count: valueOf(accessory, 'Backup Pump', ObservedActivationCount), active: statusActiveOf(accessory, 'Backup Pump') },
      { count: 1, active: true },
    );
  });

  // An unresolved profile says nothing about whether a pump ran, so the branch that handles one
  // drives no observation at all: it neither advances a count nor asks for a write.
  test('drives no observation and asks for no write when the family has never resolved', () => {
    // arrange
    const accessory = accessoryStandIn();
    const { store, persisted } = recordingStore();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }), store });

    // act
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY, receivedAt: RECORD_RECEIVED_AT }), 'poll');

    // assert
    assert.deepStrictEqual(
      { persists: persisted(), pumpServices: basementGuardianAccessory.services.filter((service) => service.kind === 'primary-pump') },
      { persists: 0, pumpServices: [] },
    );
  });

  // A profile that stops resolving neither advances a count nor blanks a record: the record the
  // accessory already published stays exactly where it is, and no write is asked for.
  test('leaves a published record where it is when the family stops resolving', () => {
    // arrange
    const accessory = accessoryStandIn();
    const { store, persisted } = recordingStore();
    const registry = registryOver([
      { kind: 'implemented', family: geminiFamily },
      { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID },
    ]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry, store });
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY, receivedAt: RECORD_RECEIVED_AT }), 'poll');
    const afterTheResolvedUpdate = { record: pumpRecordOf(accessory, 'Backup Pump'), persists: persisted() };

    // act
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY, receivedAt: RECORD_RECEIVED_AT + ONE_POLL_LATER_MS }), 'poll');

    // assert
    assert.deepStrictEqual(
      { record: pumpRecordOf(accessory, 'Backup Pump'), furtherPersists: persisted() - afterTheResolvedUpdate.persists },
      {
        record: { observationStartedAt: RECORD_RECEIVED_AT_ISO, activationCount: 0, lastActivationAt: '', lastActivationWasTestActivity: undefined },
        furtherPersists: 0,
      },
    );
  });

  // A record that counted an activation and never asked to be stored is lost on the next restart,
  // so the ask is what the accessory owes Homebridge for every change it made (D-008, D-010).
  test('asks for one write for the snapshot that counted an activation and none for an unchanged one', () => {
    // arrange
    const accessory = accessoryStandIn();
    const { store, persisted } = recordingStore();
    const basementGuardianAccessory = geminiUpdates(accessory, [{}], { store });
    const afterTheSeed = persisted();

    // act
    basementGuardianAccessory.update(
      buildSnapshot({ data: { ...GEMINI_TELEMETRY, backup_pump_running: true }, receivedAt: RECORD_RECEIVED_AT + ONE_POLL_LATER_MS }),
      'poll',
    );
    const afterTheActivation = persisted();
    basementGuardianAccessory.update(
      buildSnapshot({ data: { ...GEMINI_TELEMETRY, backup_pump_running: true }, receivedAt: RECORD_RECEIVED_AT + 2 * ONE_POLL_LATER_MS }),
      'poll',
    );

    // assert
    assert.deepStrictEqual(
      { afterTheSeed, afterTheActivation, afterAnUnchangedSnapshot: persisted() },
      { afterTheSeed: 1, afterTheActivation: 2, afterAnUnchangedSnapshot: 2 },
    );
  });

  test('declares exactly the collaborators the accessory takes by injection', async () => {
    // act
    const { members } = declaredOptions(await sourceOf('basementGuardian.ts'));

    // assert
    assert.deepStrictEqual(members, ['accessory', 'hap', 'registry', 'log', 'timers', 'store', 'commands', 'ignoredFaults', 'offlineConfirmationPollCount']);
  });

  test('declares no injected option typed API and none named api', async () => {
    // act
    const { members, block } = declaredOptions(await sourceOf('basementGuardian.ts'));

    // assert
    assert.deepStrictEqual({ named: members.includes('api'), typedAsApi: /:\s*API\s*;/u.test(block) }, { named: false, typedAsApi: false });
  });

  // Apple Home labels a secondary service of a bridged accessory by `ConfiguredName`, so a sensor
  // published without one reads as "Contact Sensor 4" where SAFE-04 promised a named cause. The
  // expected names are read from the catalogue rather than restated here, because a second list of
  // fifteen names is exactly the drift this case exists to catch.
  test('names every published service with the catalogue display name it publishes under', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');

    // assert
    assert.deepStrictEqual(
      CATALOGUE.map((row) => valueOf(accessory, row.displayName, HAP.Characteristic.ConfiguredName)),
      CATALOGUE.map((row) => row.displayName),
    );
  });

  // `ConfiguredName` is paired-write, and `Characteristic.serialize` writes its value into the
  // Homebridge accessory cache, so a name a controller wrote survives a restart. Seeding on every
  // update would therefore not flicker: it would destroy a name the user set and expected to keep,
  // on every poll, forever (D-14). The sibling is asserted too, because without it the case would
  // also pass against an implementation that stopped naming anything at all.
  test('leaves a name a controller wrote in place across a later update', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith(linkOutcome({ linkPresent: true })) });
    const renamed = rowOfKind('backup-pump-fault');
    const sibling = rowOfKind('primary-pump-fault');
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');
    serviceOf(accessory, renamed.displayName).setCharacteristic(HAP.Characteristic.ConfiguredName, USER_RENAME);

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        renamed: valueOf(accessory, renamed.displayName, HAP.Characteristic.ConfiguredName),
        sibling: valueOf(accessory, sibling.displayName, HAP.Characteristic.ConfiguredName),
      },
      { renamed: USER_RENAME, sibling: sibling.displayName },
    );
  });

  // An accessory whose family has stopped resolving never reaches the publishing loop again, so the
  // republishing loop is the only path left that can name a service restored from the Homebridge
  // cache without one. The emptied name stands for that restored service; without a seed on the
  // second loop it would stay unnamed for as long as the profile does not resolve.
  test('names a published service carrying no name after the family stops resolving', () => {
    // arrange
    const accessory = accessoryStandIn();
    const registry = registryOver([linkOutcome({ linkPresent: true }), { kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }]);
    const basementGuardianAccessory = accessoryWith(accessory, { registry });
    const unnamed = rowOfKind('mains-power-lost');
    const retained = rowOfKind('primary-pump-fault');
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_000_000 }), 'poll');
    serviceOf(accessory, unnamed.displayName).setCharacteristic(HAP.Characteristic.ConfiguredName, '');

    // act
    basementGuardianAccessory.update(buildSnapshot({ receivedAt: 1_700_000_060_000 }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        reseeded: valueOf(accessory, unnamed.displayName, HAP.Characteristic.ConfiguredName),
        retained: valueOf(accessory, retained.displayName, HAP.Characteristic.ConfiguredName),
      },
      { reseeded: unnamed.displayName, retained: retained.displayName },
    );
  });

  test('lists one trust scope per member of the union it reports from', () => {
    // arrange
    const basementGuardianAccessory = accessoryWith(accessoryStandIn(), { registry: registryWith({ kind: 'unknown', deviceTypeId: DEVICE_TYPE_ID }) });

    // act
    basementGuardianAccessory.update(buildSnapshot(), 'poll');
    const reported = basementGuardianAccessory.untrusted.map((untrusted) => untrusted.scope);

    // assert
    assert.deepStrictEqual(
      [...reported, 'connectivity'].sort((left, right) => left.localeCompare(right)),
      [...EVERY_TRUST_SCOPE],
    );
  });

  test('D-03 publishes the self-test switch on the first update even though test_running never decoded', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    geminiAccessory(accessory, { test_running: 'not-a-boolean' });

    // assert
    assert.deepStrictEqual(
      {
        published: serviceOf(accessory, SELF_TEST_ROW).UUID,
        on: serviceOf(accessory, SELF_TEST_ROW).characteristics.find((candidate) => candidate.UUID === HAP.Characteristic.On.UUID)?.pushed,
        statusActive: statusActiveOf(accessory, SELF_TEST_ROW),
      },
      { published: SWITCH_UUID, on: false, statusActive: false },
    );
  });

  test('D-02 deactivates the alarm mute scope alone for an out-of-domain alarm_audio_muted', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    const basementGuardianAccessory = geminiAccessory(accessory, { alarm_audio_muted: 12 });

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [{ scope: 'alarm-mute', reason: 'invalid', lastTrustedAt: undefined }]);
    assert.strictEqual(statusActiveOf(accessory, SELF_TEST_ROW), true);
  });

  test('D-02 deactivates the self-test scope alone for a wrong-typed test_timestamp, leaving every pump service active', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    const basementGuardianAccessory = geminiAccessory(accessory, { test_timestamp: 'not-a-number' });

    // assert
    assert.deepStrictEqual(basementGuardianAccessory.untrusted, [{ scope: 'self-test', reason: 'invalid', lastTrustedAt: undefined }]);
    assert.deepStrictEqual(
      PUMP_SERVICES.map((displayName) => statusActiveOf(accessory, displayName)),
      PUMP_SERVICES.map(() => true),
    );
  });

  test('CTRL-03 follows a reported test_running the device raised with no HomeKit write behind it', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    geminiAccessory(accessory, { test_running: true });

    // assert
    assert.deepStrictEqual(
      { on: valueOf(accessory, SELF_TEST_ROW, HAP.Characteristic.On), statusActive: statusActiveOf(accessory, SELF_TEST_ROW) },
      { on: true, statusActive: true },
    );
  });

  // The clearing push is what stops one refused press from leaving the Switch answering an error to
  // every read until the next poll. It is a macrotask through the injected port, so this case runs
  // the deferral the accessory recorded rather than waiting on a clock (D-04).
  test('CTRL-03 refuses an off write, sends nothing, and makes the switch readable again on the deferral it recorded', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { timers, calls } = recordingTimers();
    const { commands, sends } = recordingCommands();
    const deferred: (() => void)[] = [];
    const recording: Timers = {
      ...timers,
      setTimeout: (handler, delayMs) => {
        deferred.push(handler);

        return timers.setTimeout(handler, delayMs);
      },
    };
    geminiAccessory(accessory, { test_running: false }, { timers: recording, commands }).markMonitoring(EVERY_TRANSPORT_WORKING);

    // act
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(false),
      (thrown: unknown) => {
        assert.strictEqual(thrown, NOT_ALLOWED_IN_CURRENT_STATE);

        return true;
      },
    );
    const beforeThePush = onCharacteristicOf(accessory, SELF_TEST_ROW).statusCode;
    deferred[0]?.();

    // assert
    assert.deepStrictEqual({ sends, calls, beforeThePush }, { sends: [], calls: ['setTimeout 0'], beforeThePush: NOT_ALLOWED_IN_CURRENT_STATE });
    assert.deepStrictEqual(
      {
        statusCode: onCharacteristicOf(accessory, SELF_TEST_ROW).statusCode,
        on: onCharacteristicOf(accessory, SELF_TEST_ROW).value,
        statusActive: statusActiveOf(accessory, SELF_TEST_ROW),
      },
      { statusCode: 0, on: false, statusActive: true },
    );
  });

  // A refused credential is the one failure this plugin presents as No Response, because it never
  // clears itself and only the owner can act on it. Every way a control request can end arms a push
  // that returns a refused characteristic to a normal read, and one press therefore erased that
  // message from both controls at once and left them claiming the plugin vouched for what they
  // showed. The three cases below drive the three doors -- the press the plugin refuses by itself,
  // the request that outlives its window, and the refusal the vendor answers -- because they reach
  // the guard through different callers and a guard proved on one is not proved on the others. Each
  // reads what a controller reads (CR-02, D-10).
  const STILL_REFUSED = { selfTest: 'refused -70402', alarmMute: 'refused -70402', flood: 'refused -70402' };

  test('CR-02 leaves both controls refusing reads when the press it refused itself runs its clearing push', async () => {
    // arrange
    const { commands, sends } = recordingCommands();
    const { accessory, basementGuardianAccessory, deferred } = haltableAccessory(commands);
    refuseTheCredentials(accessory, basementGuardianAccessory);

    // act
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true),
      (thrown: unknown) => {
        assert.strictEqual(thrown, NOT_ALLOWED_IN_CURRENT_STATE);

        return true;
      },
    );
    runEvery(deferred);

    // assert
    assert.deepStrictEqual({ reads: trustReportReadsOf(accessory), sends }, { reads: STILL_REFUSED, sends: [] });
  });

  test('CR-02 leaves both controls refusing reads when a request that outlived its window runs its clearing push', async () => {
    // arrange
    const { commands, sends } = recordingCommands();
    const { accessory, basementGuardianAccessory, deferred } = haltableAccessory(commands);

    // act
    await onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true);
    refuseTheCredentials(accessory, basementGuardianAccessory);
    runEvery(deferred);

    // assert
    assert.deepStrictEqual({ reads: trustReportReadsOf(accessory), sends }, { reads: STILL_REFUSED, sends: [`${DEVICE_ID} self-test true`] });
  });

  test('CR-02 leaves both controls refusing reads when the vendor refusal that answered a press runs its clearing push', async () => {
    // arrange
    const sends: string[] = [];
    const commands: CommandPort = {
      send: (deviceId: string, capability: DeviceCapability, requested: boolean) => {
        sends.push(`${deviceId} ${capability} ${String(requested)}`);

        return Promise.resolve({ accepted: false, failure: 'vendor-error' });
      },
    };
    const { accessory, basementGuardianAccessory, deferred } = haltableAccessory(commands);

    // act
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true),
      (thrown: unknown) => {
        assert.strictEqual(thrown, SERVICE_COMMUNICATION_FAILURE);

        return true;
      },
    );
    refuseTheCredentials(accessory, basementGuardianAccessory);
    runEvery(deferred);

    // assert
    assert.deepStrictEqual({ reads: trustReportReadsOf(accessory), sends }, { reads: STILL_REFUSED, sends: [`${DEVICE_ID} self-test true`] });
  });

  test('D-03 publishes the alarm mute switch on the first update even though alarm_audio_muted never decoded', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    geminiAccessory(accessory, { alarm_audio_muted: 'not-a-boolean' });

    // assert
    assert.deepStrictEqual(
      {
        published: serviceOf(accessory, ALARM_MUTE_ROW).UUID,
        on: serviceOf(accessory, ALARM_MUTE_ROW).characteristics.find((candidate) => candidate.UUID === HAP.Characteristic.On.UUID)?.pushed,
        statusActive: statusActiveOf(accessory, ALARM_MUTE_ROW),
      },
      { published: SWITCH_UUID, on: false, statusActive: false },
    );
  });

  test('CTRL-04 follows the reported alarm_audio_muted with no HomeKit write behind it', () => {
    // arrange
    const accessory = accessoryStandIn();

    // act
    geminiAccessory(accessory, { alarm_audio_muted: true });

    // assert
    assert.deepStrictEqual(
      { on: valueOf(accessory, ALARM_MUTE_ROW, HAP.Characteristic.On), statusActive: statusActiveOf(accessory, ALARM_MUTE_ROW) },
      { on: true, statusActive: true },
    );
  });

  // The vendor exposes no unmute command and refuses a duplicate mute, so both writes are answered
  // here without anything leaving the plugin (D-019, CTRL-04).
  for (const { written, muted, status } of [
    { written: false, muted: false, status: NOT_ALLOWED_IN_CURRENT_STATE },
    { written: true, muted: true, status: RESOURCE_BUSY },
  ]) {
    test(`CTRL-04 answers ${String(status)} for a write of ${String(written)} while alarm_audio_muted reads ${String(muted)}, and sends nothing`, async () => {
      // arrange
      const accessory = accessoryStandIn();
      const { commands, sends } = recordingCommands();
      geminiAccessory(accessory, { alarm_audio_muted: muted }, { commands }).markMonitoring(EVERY_TRANSPORT_WORKING);

      // act
      await assert.rejects(
        () => onCharacteristicOf(accessory, ALARM_MUTE_ROW).handleSetRequest(written),
        (thrown: unknown) => {
          assert.strictEqual(thrown, status);

          return true;
        },
      );

      // assert
      assert.deepStrictEqual(sends, []);
    });
  }

  test('CTRL-04 sends one mute request carrying the only value the plugin will ever ask for', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { commands, sends } = recordingCommands();
    geminiAccessory(accessory, { alarm_audio_muted: false }, { commands }).markMonitoring(EVERY_TRANSPORT_WORKING);

    // act
    await onCharacteristicOf(accessory, ALARM_MUTE_ROW).handleSetRequest(true);

    // assert
    assert.deepStrictEqual(sends, [`${DEVICE_ID} alarm-mute true`]);
  });

  // Equipment faults are not eligibility. The official Gemini client permits a self-test while
  // equipment faults are present and disables the command only when the device is offline, so a
  // plugin that refused here would refuse exactly the test an owner runs to check a suspect pump
  // (D-018).
  test('CTRL-03 sends a self-test while every reported equipment fault is active', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { commands, sends } = recordingCommands();
    geminiAccessory(
      accessory,
      {
        primary_pump_fault: true,
        backup_pump_fault: true,
        backup_pump_fuse_blown: true,
        water_sensor_fault: true,
        battery_voltage_low: true,
        test_running: false,
      },
      { commands },
    ).markMonitoring(EVERY_TRANSPORT_WORKING);

    // act
    await onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true);

    // assert
    assert.deepStrictEqual(sends, [`${DEVICE_ID} self-test true`]);
  });

  // The write path reads the same confirmation run the rows publish from, so a device HomeKit is
  // already told is offline never has a command sent to it (D-07, RES-03).
  test('CTRL-03 refuses a self-test on a confirmed-offline device and sends nothing', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { commands, sends } = recordingCommands();
    const basementGuardianAccessory = geminiAccessory(accessory, { test_running: false }, { commands, offlineConfirmationPollCount: 1 });
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);

    // act
    basementGuardianAccessory.update(buildSnapshot({ connected: false, data: { ...GEMINI_TELEMETRY, test_running: false } }), 'poll');
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true),
      (thrown: unknown) => {
        assert.strictEqual(thrown, NOT_ALLOWED_IN_CURRENT_STATE);

        return true;
      },
    );

    // assert
    assert.deepStrictEqual(sends, []);
  });

  // The failing case a two-field comparison would swallow is the ordinary one, not an exotic
  // interleaving. A single failed REST poll moves neither `restDegraded` -- the threshold is two --
  // nor `shadowSilent`, so a stored trust the accessory declined to refresh would go on answering
  // the binder with the previous value and the press would be sent into a route that has just
  // failed (RES-04, D-07).
  test('RES-04 refuses the next press after a push differing from the stored trust only in the command transport', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { log, warnings } = recordingLog();
    const { commands, sends } = recordingCommands();
    const basementGuardianAccessory = geminiAccessory(accessory, { test_running: false }, { commands, log });
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);

    // act
    await onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true);
    const afterTheAcceptedPress = [...sends];
    basementGuardianAccessory.markMonitoring({ restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false });
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true),
      (thrown: unknown) => {
        assert.strictEqual(thrown, NOT_ALLOWED_IN_CURRENT_STATE);

        return true;
      },
    );

    // assert
    assert.deepStrictEqual(
      { afterTheAcceptedPress, sends, warnings },
      {
        afterTheAcceptedPress: [`${DEVICE_ID} self-test true`],
        sends: [`${DEVICE_ID} self-test true`],
        warnings: [`Refused self-test on ${DEVICE_ID}: ${NO_COMMAND_TRANSPORT_CAUSE}.`],
      },
    );
  });

  // A press during shadow silence is refused, and the cause it names is the one that is true. The
  // poll is still delivering, so the plugin has the reported value and the tile is showing it; what
  // it has lost is the channel a confirmation comes back on, and the wait closes long before the
  // next poll could carry one. Naming a missing state here -- which is what this case asserted
  // before the cause existed -- sent an owner to inspect equipment that is fine (RES-04, D-07, WR-02).
  test('RES-04 names the quiet live connection for a press during shadow silence, and sends nothing', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { log, warnings } = recordingLog();
    const { commands, sends } = recordingCommands();
    const basementGuardianAccessory = geminiAccessory(accessory, { test_running: false }, { commands, log });

    // act
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true),
      (thrown: unknown) => {
        assert.strictEqual(thrown, NOT_ALLOWED_IN_CURRENT_STATE);

        return true;
      },
    );

    // assert
    assert.deepStrictEqual({ sends, warnings }, { sends: [], warnings: [`Refused self-test on ${DEVICE_ID}: ${QUIET_LIVE_CONNECTION_CAUSE}.`] });
  });

  // The state rule is still reachable and still names its own cause. Both transports are working
  // here and the live path can carry an answer, so nothing above this rule fires; what is wrong is
  // the capability's own reported field, which did not decode. Without this case the rule inserted
  // above it could swallow every refusal in this module and the suite would not say so
  // (RES-04, D-07, D-08).
  test('RES-04 names the missing state for a press whose reported field never decoded, and sends nothing', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { log, warnings } = recordingLog();
    const { commands, sends } = recordingCommands();
    const basementGuardianAccessory = geminiAccessory(accessory, { test_running: 'not-a-boolean' }, { commands, log });

    // act
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true),
      (thrown: unknown) => {
        assert.strictEqual(thrown, NOT_ALLOWED_IN_CURRENT_STATE);

        return true;
      },
    );

    // assert. A payload carrying an out-of-domain field also degrades, and that line is not what
    // this case is about, so the refusal lines alone are compared.
    assert.deepStrictEqual(
      { sends, refusals: warnings.filter((warning) => warning.startsWith('Refused ')) },
      { sends: [], refusals: [`Refused self-test on ${DEVICE_ID}: ${NO_FRESH_STATE_CAUSE}.`] },
    );
  });

  // The value the tile shows and the value the write path reads are one value, asserted where an
  // owner can see the two disagree. A press was accepted, so the row is withholding `On` and HAP is
  // serving the `true` that press left behind. The live path then goes quiet and a second press is
  // refused. The push that returns the Switch to a normal read has to publish something, and what it
  // publishes is whatever the write path sampled -- so this is the one place the write path's own
  // answer becomes visible to a controller. It must be the device's reported `false`, which is what
  // the row publishes throughout the same withdrawal.
  //
  // Before the two halves read one rule the write path sampled nothing at all here, and the push
  // fell back to the value HomeKit's own request had left standing. The tile then showed a test
  // running that no device had confirmed, which is requested state presented as reported state
  // (RES-04, D-07, D-037, WR-02).
  test('WR-02 returns the Switch to the value the device reported when a press is refused during shadow silence', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { timers } = recordingTimers();
    const { commands, sends } = recordingCommands();
    // The clearing push alone, told apart by the delay it was armed at. Running the request's own
    // 30-second deadline as well would expire the request, and the row's republish would then set
    // `On` from its own projection -- which is the very value this case is checking the write path
    // arrived at independently. The case would pass whatever the write path answered.
    const clearingPushes: (() => void)[] = [];
    const recording: Timers = {
      ...timers,
      setTimeout: (handler, delayMs) => {
        if (delayMs === 0) {
          clearingPushes.push(handler);
        }

        return timers.setTimeout(handler, delayMs);
      },
    };
    const basementGuardianAccessory = geminiAccessory(accessory, { test_running: false }, { timers: recording, commands });
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);

    // act
    await onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true);
    const afterTheAcceptedPress = onCharacteristicOf(accessory, SELF_TEST_ROW).value;
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true),
      (thrown: unknown) => {
        assert.strictEqual(thrown, NOT_ALLOWED_IN_CURRENT_STATE);

        return true;
      },
    );
    runEvery(clearingPushes);

    // assert
    assert.deepStrictEqual(
      {
        clearingPushes: clearingPushes.length,
        afterTheAcceptedPress,
        afterTheRefusedPress: onCharacteristicOf(accessory, SELF_TEST_ROW).value,
        statusCode: onCharacteristicOf(accessory, SELF_TEST_ROW).statusCode,
        sends,
      },
      { clearingPushes: 1, afterTheAcceptedPress: true, afterTheRefusedPress: false, statusCode: 0, sends: [`${DEVICE_ID} self-test true`] },
    );
  });

  // The other direction of the same rule, and the one that keeps it narrow. A lost pump controller
  // link says the value is doubtful rather than that the plugin is seeing less, so both halves must
  // still treat it as absent: the row publishes no `On` and the write path is refused for the
  // missing state. Publishing a doubtful value would overwrite the last family-valid one, and acting
  // on it would operate a real pump on a guess.
  //
  // The lost link is deliberately the reason here, not a field that failed validation. The family
  // drops a violated scope's whole group before the accessory ever sees it, so a case built on an
  // invalid field would find the value absent whatever this rule answered, and would agree with a
  // rule that withheld nothing. The link fact is a valid boolean, so every group still decodes and
  // the rule is the only thing holding the value back (RES-04, D-02, D-07, D-11, D-014, WR-02).
  test('WR-02 keeps a doubtful value absent from both the control row and the write path', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { log, warnings } = recordingLog();
    const { commands, sends } = recordingCommands();
    const basementGuardianAccessory = geminiAccessory(accessory, { serial_communications: false }, { commands, log });

    // act
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true),
      (thrown: unknown) => {
        assert.strictEqual(thrown, NOT_ALLOWED_IN_CURRENT_STATE);

        return true;
      },
    );

    // assert. A lost link is also reported once on its own line, and that line is not what this case
    // is about, so the refusal lines alone are compared.
    assert.deepStrictEqual(
      {
        selfTestReason: basementGuardianAccessory.untrusted.find((scope) => scope.scope === 'self-test')?.reason,
        publishedOn: serviceOf(accessory, SELF_TEST_ROW).characteristics.find((candidate) => candidate.UUID === HAP.Characteristic.On.UUID)?.pushed,
        sends,
        refusals: warnings.filter((warning) => warning.startsWith('Refused ')),
      },
      {
        selfTestReason: 'controller-link-lost',
        publishedOn: false,
        sends: [],
        refusals: [`Refused self-test on ${DEVICE_ID}: ${NO_FRESH_STATE_CAUSE}.`],
      },
    );
  });

  // A request the device confirmed on the very snapshot that withdrew the control's scope. The
  // report and the withdrawal arrive together -- the device says the test is running and the same
  // payload says the pump controller link is gone -- and reconciliation used to read the value
  // through the trust gate, so it saw nothing, never matched the request, and thirty seconds later
  // warned that the device had never confirmed a test it had confirmed. That line names a device
  // failure for a withdrawal the plugin made on its own side, and an owner acts on it.
  //
  // A confirmation is the device answering a request this plugin issued, so the question here is
  // what the device reported and not what the accessory can currently vouch for. The gate still
  // stands on publishing and on the write: the row publishes no `On` throughout, so resolving the
  // request shows nothing the plugin cannot vouch for (CTRL-03, D-037, D-11, WR-06).
  test('WR-06 resolves a request the device confirmed on the snapshot that withdrew the control scope', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { timers } = recordingTimers();
    const { log, warnings } = recordingLog();
    const { commands, sends } = recordingCommands();
    const windowClosings: (() => void)[] = [];
    const recording: Timers = {
      ...timers,
      setTimeout: (handler, delayMs) => {
        if (delayMs === PENDING_WINDOW_MS) {
          windowClosings.push(handler);
        }

        return timers.setTimeout(handler, delayMs);
      },
    };
    const basementGuardianAccessory = geminiAccessory(accessory, { test_running: false }, { timers: recording, commands, log });
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);

    // act
    await onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true);
    basementGuardianAccessory.update(buildSnapshot({ data: { ...GEMINI_TELEMETRY, test_running: true, serial_communications: false } }), 'poll');
    runEvery(windowClosings);

    // assert
    assert.deepStrictEqual(
      { sends, windowClosings: windowClosings.length, unconfirmed: warnings.filter((warning) => warning.includes('never confirmed')) },
      { sends: [`${DEVICE_ID} self-test true`], windowClosings: 1, unconfirmed: [] },
    );
  });

  // The same moment under the other withdrawal, which the shared publishing rule already closed: a
  // scope withdrawn because the plugin is seeing less never hid the reported value from the write
  // path once both halves read one rule. This is the shape `WR-06` was reported against, kept as its
  // own case so an edit that gives either half its own copy of the rule fails here too and not only
  // where the tile is read (CTRL-03, D-037, D-02, WR-06).
  test('WR-06 resolves a request the device confirmed on the snapshot that first went quiet', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { timers } = recordingTimers();
    const { log, warnings } = recordingLog();
    const { commands, sends } = recordingCommands();
    const windowClosings: (() => void)[] = [];
    const recording: Timers = {
      ...timers,
      setTimeout: (handler, delayMs) => {
        if (delayMs === PENDING_WINDOW_MS) {
          windowClosings.push(handler);
        }

        return timers.setTimeout(handler, delayMs);
      },
    };
    const basementGuardianAccessory = geminiAccessory(accessory, { test_running: false }, { timers: recording, commands, log });
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);

    // act
    await onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true);
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);
    basementGuardianAccessory.update(buildSnapshot({ data: { ...GEMINI_TELEMETRY, test_running: true } }), 'poll');
    runEvery(windowClosings);

    // assert
    assert.deepStrictEqual(
      {
        sends,
        on: valueOf(accessory, SELF_TEST_ROW, HAP.Characteristic.On),
        unconfirmed: warnings.filter((warning) => warning.includes('never confirmed')),
      },
      { sends: [`${DEVICE_ID} self-test true`], on: true, unconfirmed: [] },
    );
  });

  // The other half of the same reader, and what stops the gate being removed from the report as
  // well. A device that genuinely never reports the test still leaves the request unresolved, the
  // window still closes on it, and the warning that names it still fires -- because nothing is
  // retried and an owner has to be told a command may have reached the pump anyway (D-038, D-06).
  test('WR-06 still warns when the window closes on a request no report ever confirmed', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { timers } = recordingTimers();
    const { log, warnings } = recordingLog();
    const { commands, sends } = recordingCommands();
    const windowClosings: (() => void)[] = [];
    const recording: Timers = {
      ...timers,
      setTimeout: (handler, delayMs) => {
        if (delayMs === PENDING_WINDOW_MS) {
          windowClosings.push(handler);
        }

        return timers.setTimeout(handler, delayMs);
      },
    };
    const basementGuardianAccessory = geminiAccessory(accessory, { test_running: false }, { timers: recording, commands, log });
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);

    // act
    await onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true);
    basementGuardianAccessory.update(buildSnapshot({ data: { ...GEMINI_TELEMETRY, test_running: false } }), 'poll');
    runEvery(windowClosings);

    // assert
    assert.deepStrictEqual(
      { sends, unconfirmed: warnings.filter((warning) => warning.includes('never confirmed')) },
      { sends: [`${DEVICE_ID} self-test true`], unconfirmed: [`The self-test request on ${DEVICE_ID} was never confirmed by the device. It is not retried.`] },
    );
  });

  // Nothing has told this accessory the runtime can reach the vendor yet, and an accessory that
  // assumed it could would send the first press of a run into a route that has never answered
  // (RES-04, D-07).
  test('RES-04 refuses a press before the runtime has pushed any monitoring trust, and sends nothing', async () => {
    // arrange
    const accessory = accessoryStandIn();
    const { commands, sends } = recordingCommands();
    geminiAccessory(accessory, { test_running: false }, { commands });

    // act
    await assert.rejects(
      () => onCharacteristicOf(accessory, SELF_TEST_ROW).handleSetRequest(true),
      (thrown: unknown) => {
        assert.strictEqual(thrown, NOT_ALLOWED_IN_CURRENT_STATE);

        return true;
      },
    );

    // assert
    assert.deepStrictEqual(sends, []);
  });

  test('withdraws every scope but connectivity when only the shadow has gone quiet', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});

    // act
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);

    // assert
    assert.deepStrictEqual(
      distrustOf(basementGuardianAccessory),
      DEGRADED_SCOPES.map((scope) => `${scope} unreachable`),
    );
  });

  test('withdraws connectivity alone when only the polling path is degraded', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});

    // act
    basementGuardianAccessory.markMonitoring(REST_DEGRADED);

    // assert
    assert.deepStrictEqual(distrustOf(basementGuardianAccessory), ['connectivity unreachable']);
  });

  test('withdraws every scope when both transports are lost', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});

    // act
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_LOST);

    // assert
    assert.deepStrictEqual(
      distrustOf(basementGuardianAccessory),
      EVERY_SCOPE_IN_ORDER.map((scope) => `${scope} unreachable`),
    );
  });

  test('restores every scope once both transports report themselves working again', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_LOST);

    // act
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);

    // assert
    assert.deepStrictEqual(distrustOf(basementGuardianAccessory), []);
  });

  test('leaves a scope untrusted for its own failed field saying so while a lost path claims the rest', () => {
    // arrange
    const accessory = accessoryStandIn();
    const violations = [{ field: 'water_level', reason: 'missing' as const, scope: 'water' as const }];
    const family = fakeFamily({ validate: () => ({ valid: false, violations }), decode: () => decodedState(true) });
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family }) });
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY }), 'poll');

    // act
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_LOST);

    // assert
    assert.deepStrictEqual(
      distrustOf(basementGuardianAccessory),
      EVERY_SCOPE_IN_ORDER.map((scope) => (scope === 'water' ? 'water invalid' : `${scope} unreachable`)),
    );
  });

  // Nothing on the accessory may read trustworthy while the plugin can see nothing at all, and the
  // controller-link row is the only one that could: it is the one row tolerating a cause, so the
  // broader cause has to reach its scope first. The verdict it holds stays on the tile, because
  // withdrawing trust blanks nothing (WR-01, D-02).
  test('vouches for no controller-link verdict while both transports are down, and keeps the verdict', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, { serial_communications: false });

    // act
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_LOST);

    // assert
    assert.deepStrictEqual(
      {
        contact: valueOf(accessory, CONTROLLER_LINK_ROW, HAP.Characteristic.ContactSensorState),
        active: statusActiveOf(accessory, CONTROLLER_LINK_ROW),
        distrust: distrustOf(basementGuardianAccessory),
      },
      { contact: CONTACT_NOT_DETECTED, active: false, distrust: EVERY_SCOPE_IN_ORDER.map((scope) => `${scope} unreachable`) },
    );
  });

  test('names the lost controller link as the cause on every scope it poisons while both transports work', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, { serial_communications: false });

    // act
    basementGuardianAccessory.markMonitoring(EVERY_TRANSPORT_WORKING);

    // assert
    assert.deepStrictEqual(
      { active: statusActiveOf(accessory, CONTROLLER_LINK_ROW), distrust: distrustOf(basementGuardianAccessory) },
      {
        active: true,
        distrust: EVERY_SCOPE_IN_ORDER.filter((scope) => scope !== 'connectivity').map((scope) => `${scope} controller-link-lost`),
      },
    );
  });

  test('deactivates the flood sensor while leaving the offline adapter vouched for when the shadow goes quiet', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});

    // act
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);

    // assert
    assert.deepStrictEqual(
      {
        flood: statusActiveOf(accessory, 'Sump Pit Flood'),
        offline: statusActiveOf(accessory, 'Basement Guardian Offline'),
        offlineState: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState),
      },
      { flood: false, offline: true, offlineState: CONTACT_DETECTED },
    );
  });

  // A withdrawal marks and retains; it does not discard. The check is what an owner reads off the
  // tile after a poll that arrived during the outage, because a case asserting only that nothing
  // moved passes just as well against an implementation that decoded the poll and threw it away
  // (CR-01, D-014).
  test('publishes a flood a poll delivers during a lost monitoring path, and marks it rather than dropping it', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);
    const before = publishedValues(accessory);

    // act
    basementGuardianAccessory.update(buildSnapshot({ data: { ...GEMINI_TELEMETRY, water_level: FLOODING_LEVEL_CODE }, receivedAt: ONE_POLL_LATER_MS }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        flood: valueOf(accessory, 'Sump Pit Flood', HAP.Characteristic.LeakDetected),
        floodActive: statusActiveOf(accessory, 'Sump Pit Flood'),
        moved: new Set(movedSince(before, accessory)),
      },
      { flood: LEAK_DETECTED, floodActive: false, moved: new Set(['Leak Detected', 'Water Level', 'Raw Water Level Code']) },
    );
  });

  // Widening the withdrawal to every scope looks like it should silence the one adapter still being
  // fed, which is the trap D-02's narrowing was written to avoid. It does not, because the reason a
  // monitoring withdrawal fills in says the plugin is seeing less rather than that the value is
  // doubtful, and a row untrusted for that reason still publishes what a transport delivered. This
  // case is the assertion behind that sentence. The row is first pushed the opposite verdict, so a
  // withdrawal that withheld would leave the wrong reading standing and be caught here rather than
  // agreeing with the right one by accident (WR-03, D-02, D-014).
  test('WR-03 keeps the offline adapter publishing its verdict under a refused credential and stops vouching for it', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});
    serviceOf(accessory, 'Basement Guardian Offline').updateCharacteristic(HAP.Characteristic.ContactSensorState, CONTACT_NOT_DETECTED);

    // act
    basementGuardianAccessory.markMonitoring(CREDENTIALS_REFUSED);

    // assert
    assert.deepStrictEqual(
      {
        offlineState: valueOf(accessory, 'Basement Guardian Offline', HAP.Characteristic.ContactSensorState),
        offlineActive: statusActiveOf(accessory, 'Basement Guardian Offline'),
      },
      { offlineState: CONTACT_DETECTED, offlineActive: false },
    );
  });

  // A refused credential ends every observation this runtime will ever make, so nothing it holds is
  // current whatever the two transports last reported. The reason is checked alongside the scopes,
  // because which reason fills them decides whether the withdrawal marks or empties (WR-03, D-10).
  test('WR-03 withdraws every scope under a refused credential, saying the plugin is seeing less rather than that a value is wrong', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});

    // act
    basementGuardianAccessory.markMonitoring(CREDENTIALS_REFUSED);

    // assert
    assert.deepStrictEqual(
      distrustOf(basementGuardianAccessory),
      EVERY_SCOPE_IN_ORDER.map((scope) => `${scope} unreachable`),
    );
  });

  // Preserve-and-mark under the wider withdrawal. The flood is published first so the reading the
  // case protects is one an owner would act on, and the whole published surface is compared rather
  // than the one value chosen in advance, so a withdrawal that emptied any other tile fails here
  // too (WR-03, D-014).
  test('WR-03 leaves every reading a row published where it was when the credential refusal lands', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, { water_level: FLOODING_LEVEL_CODE });
    const before = publishedValues(accessory);

    // act
    basementGuardianAccessory.markMonitoring(CREDENTIALS_REFUSED);

    // assert
    assert.deepStrictEqual(
      { moved: new Set(movedSince(before, accessory)), flood: valueOf(accessory, 'Sump Pit Flood', HAP.Characteristic.LeakDetected) },
      { moved: new Set(['Status Active']), flood: LEAK_DETECTED },
    );
  });

  // The credential member of the republish comparison, reached as a change of its own. The runtime
  // flips the command transport at the same halt, so the two members move together and the pair
  // below is the one arrangement in which the credential member is the only difference: a poll that
  // has already failed, and then the refusal. Replacing that member with a constant left the whole
  // suite green before the withdrawal above existed, so what an owner is protected from here is a
  // halt the accessory reads as nothing new and declines to report (WR-04, RES-04, D-10).
  test('WR-04 republishes for a trust push differing from the stored one only in the credential member', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});
    basementGuardianAccessory.markMonitoring(COMMAND_TRANSPORT_UNREADY);
    const before = { flood: statusActiveOf(accessory, 'Sump Pit Flood'), offline: statusActiveOf(accessory, 'Basement Guardian Offline') };

    // act
    basementGuardianAccessory.markMonitoring(CREDENTIALS_REFUSED);

    // assert
    assert.deepStrictEqual(
      { before, after: { flood: statusActiveOf(accessory, 'Sump Pit Flood'), offline: statusActiveOf(accessory, 'Basement Guardian Offline') } },
      { before: { flood: true, offline: true }, after: { flood: false, offline: false } },
    );
  });

  test('republishes nothing when the monitoring trust it is handed is the one it already holds', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);
    const service = serviceOf(accessory, 'Sump Pit Flood');
    service.updateCharacteristic(HAP.Characteristic.StatusActive, USER_RENAME);
    const before = publishedValues(accessory);

    // act
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);

    // assert
    assert.deepStrictEqual(movedSince(before, accessory), []);
  });

  test('explains no degradation when the payload never stopped validating', () => {
    // arrange
    const accessory = accessoryStandIn();
    const { log, warnings } = recordingLog();
    const basementGuardianAccessory = geminiAccessory(accessory, {}, { log });
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);

    // act
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY, receivedAt: ONE_POLL_LATER_MS }), 'poll');

    // assert
    assert.deepStrictEqual(warnings, []);
  });

  test('freezes the moment trustworthy controller data last arrived for as long as the monitoring path is lost', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = accessoryWith(accessory, { registry: registryWith({ kind: 'implemented', family: geminiFamily }) });
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY, receivedAt: RECORD_RECEIVED_AT }), 'poll');
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);

    // act
    basementGuardianAccessory.update(buildSnapshot({ data: GEMINI_TELEMETRY, receivedAt: RECORD_RECEIVED_AT + ONE_POLL_LATER_MS }), 'poll');

    // assert
    assert.strictEqual(valueOf(accessory, CONTROLLER_LINK_ROW, ControllerDataLastTrustedAt), RECORD_RECEIVED_AT_ISO);
  });

  // The poll moves a value, so "withdrawn across the polls" is checked against a reading that had
  // somewhere to go. A poll repeating the telemetry the accessory already held would leave the whole
  // published surface where it was whether or not the poll reached it at all.
  test('keeps a lost monitoring path withdrawn across a poll that moves a value during it', () => {
    // arrange
    const accessory = accessoryStandIn();
    const basementGuardianAccessory = geminiAccessory(accessory, {});
    basementGuardianAccessory.markMonitoring(SHADOW_SILENT);

    // act
    basementGuardianAccessory.update(buildSnapshot({ data: { ...GEMINI_TELEMETRY, ac_power: false }, receivedAt: ONE_POLL_LATER_MS }), 'poll');

    // assert
    assert.deepStrictEqual(
      {
        mains: valueOf(accessory, 'Mains Power Lost', HAP.Characteristic.ContactSensorState),
        mainsActive: statusActiveOf(accessory, 'Mains Power Lost'),
        distrust: distrustOf(basementGuardianAccessory),
      },
      { mains: CONTACT_NOT_DETECTED, mainsActive: false, distrust: DEGRADED_SCOPES.map((scope) => `${scope} unreachable`) },
    );
  });

  for (const module of MODULES_ERRORING_NO_CHARACTERISTIC) {
    test(`${module} signals no untrusted scope through an errored characteristic`, async () => {
      // act
      const code = codeOf(await sourceOf(module));

      // assert
      assert.strictEqual(occurrences(code, ERRORED_CHARACTERISTIC), 0);
    });
  }

  // The one exception `D-10` grants to the locked decision, pinned as a count and a location rather
  // than as a permission for the module. A second construction anywhere in the catalogue fails here,
  // which is what makes "a search for the forbidden act answers exactly one production call site" a
  // checked claim rather than a promise.
  test('serviceCatalogue.ts names an errored characteristic once, inside publishPersistentFailure', async () => {
    // act
    const code = codeOf(await sourceOf('serviceCatalogue.ts'));
    const persistentFailure = /export function publishPersistentFailure\b[\s\S]*?\n\}/.exec(code)?.[0] ?? '';

    // assert
    assert.deepStrictEqual(
      { file: occurrences(code, ERRORED_CHARACTERISTIC), insidePublishPersistentFailure: occurrences(persistentFailure, ERRORED_CHARACTERISTIC) },
      { file: 1, insidePublishPersistentFailure: 1 },
    );
  });

  for (const module of ACCESSORY_MODULES) {
    test(`${module} registers no get handler, so a read never reaches the network`, async () => {
      // act
      const code = codeOf(await sourceOf(module));

      // assert
      assert.deepStrictEqual({ onGet: code.includes('onGet'), getEvent: /\.on\(\s*['"`]get/i.test(code) }, { onGet: false, getEvent: false });
    });

    // `ConfiguredName` is the one paired-write characteristic this plugin publishes, so a controller
    // can write to a safety accessory for the first time. A set handler is what would turn that
    // write into a path toward the device; there is none, and nothing reads the value back into
    // decoded state or into a command (SAFE-08).
    test(`${module} registers no set handler, so a controller write never reaches the device`, async () => {
      // act
      const code = codeOf(await sourceOf(module));

      // assert
      assert.deepStrictEqual({ onSet: code.includes('onSet'), setEvent: /\.on\(\s*['"`]set/i.test(code) }, { onSet: false, setEvent: false });
    });

    test(`${module} derives no published identifier from a seed string`, async () => {
      // act
      const code = codeOf(await sourceOf(module));

      // assert
      assert.strictEqual(code.includes('uuid.generate'), false);
    });
  }
});
