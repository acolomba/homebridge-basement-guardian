import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { setImmediate as nextEventLoopTurn } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { It, mock, verify, when } from 'strong-mock';

import { createFakeHap } from '../features/support/fakeHap.js';
import { HarnessPlatformAccessory } from '../features/support/fakeHomebridgeApi.js';
import { createBasementGuardianAccessory } from '../src/accessories/basementGuardian.js';
import { createServiceCatalogue } from '../src/accessories/serviceCatalogue.js';
import { markTrustReportsUnreadable } from '../src/accessories/staleMarking.js';
import { TOKEN_CACHE_FILENAME } from '../src/cloud/auth.js';
import { createDeviceStateStore } from '../src/device/state.js';
import { applyMonitoringHealth, BasementGuardianPlatform, registerDiscoveredDevices, removeDiscoveredDevice } from '../src/platform.js';
import { systemTimers } from '../src/runtime/timers.js';
import { PLATFORM_NAME, PLUGIN_NAME } from '../src/settings.js';

import type { FakeCharacteristicClass, FakeHapService, FakeServiceClass } from '../features/support/fakeHap.js';
import type { FakeAccessory } from '../features/support/fakeHomebridgeApi.js';
import type { BasementGuardianAccessory } from '../src/accessories/basementGuardian.js';
import type { NotificationServiceKind } from '../src/accessories/services.js';
import type { ApiDevice } from '../src/cloud/types.js';
import type { DeviceFamily } from '../src/device/family.js';
import type { FamilyOutcome, FamilyRegistry } from '../src/device/registry.js';
import type { DeviceStateStore, ReportedPatch } from '../src/device/state.js';
import type { BasementGuardianAccessoryContext, BasementGuardianPlatformAccessory, DiscoveryContext } from '../src/platform.js';
import type { CommandPort } from '../src/runtime/commandPort.js';
import type { MonitoringTrust } from '../src/runtime/monitoringHealth.js';
import type { API, LogLevel, Logging, PlatformAccessory, PlatformConfig } from 'homebridge';
import type { TestContext } from 'node:test';

// Logging is a callable interface with seven members, so a silent stub is a
// function that carries them rather than an object literal.
function createSilentLog(): Logging {
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

function createRecordingLog(messages: string[]): Logging {
  const record = (message: string): void => {
    messages.push(message);
  };

  return Object.assign(record, {
    prefix: 'basement guardian',
    debug: record,
    error: record,
    info: record,
    log: (level: LogLevel, message: string): void => {
      messages.push(`${level} ${message}`);
    },
    success: record,
    warn: record,
  });
}

// Drains the promise chains a lifecycle event starts, so the work it triggered
// has settled before the assertions run.
//
// A fixed turn count is sound only for a negative assertion, where draining
// longer can only make the case stricter. For anything the lifecycle reaches
// asynchronously, wait on the condition itself with `until`: eight turns is a
// guess, and a filesystem write behind the token cache needs more of them on a
// slower machine than on the one the constant was chosen on.
async function settle(): Promise<void> {
  for (let turn = 0; turn < 8; turn += 1) {
    await nextEventLoopTurn();
  }
}

// Waits for a condition the lifecycle reaches on its own schedule, rather than
// for a number of turns that happened to be enough locally. Fails with what it
// was waiting for instead of with whatever the assertion would have said.
async function until(reached: () => boolean | Promise<boolean>, what: string): Promise<void> {
  const deadlineMs = Date.now() + 5_000;

  while (Date.now() < deadlineMs) {
    if (await reached()) {
      return;
    }

    await nextEventLoopTurn();
  }

  throw new Error(`timed out waiting for ${what}`);
}

// Every module under `src/` that names a symbol, in path order. A module that wants to defer has to
// take the port by injection, where a test can observe it, so the concrete process timers are wired
// at the composition root and declared in their own module, and nowhere else (SAFE-07, D-18).
async function modulesNaming(symbol: string): Promise<readonly string[]> {
  const root = new URL('../../src/', import.meta.url);
  const entries = await readdir(root, { recursive: true });
  const naming: string[] = [];

  for (const entry of entries.filter((candidate) => candidate.endsWith('.ts')).sort()) {
    const source = await readFile(new URL(entry, root), 'utf8');

    if (source.includes(symbol)) {
      naming.push(entry);
    }
  }

  return naming;
}

// A module read as text, for the one claim that is about what a comparison does not cover rather
// than about what it answers. The name is interpolated so the path is a runtime value rather than a
// static import.
async function sourceOf(module: string): Promise<string> {
  return readFile(new URL(`../../src/${module}`, import.meta.url), 'utf8');
}

// The keys one of the two change-detection state objects compares, read from the source. A key list
// is what the claim is about: the record members are deliberately absent from it, and a value the
// comparison never looks at cannot be shown missing by any call the comparison makes.
function comparedKeys(source: string, name: string): readonly string[] {
  const block = new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\s*\\};`, 'u').exec(source)?.[1] ?? '';

  return [...block.matchAll(/^\s*(\w+): .*,$/gmu)].map((match) => match[1] ?? '');
}

const emptyConfig: PlatformConfig = { platform: PLATFORM_NAME };

const accountConfig: PlatformConfig = { platform: PLATFORM_NAME, email: 'account@example.test', password: 'account-password' };

const REFUSAL_ADVICE = 'Fix it in the Homebridge UI (Plugins -> Basement Guardian -> Settings).';

const DEVICE_ID = 'account-1_serial-1';
const SECOND_DEVICE_ID = 'account-1_serial-2';
const DEVICE_TYPE_ID = 'wayneWaterGemini';

// The stored context of an accessory restored from before this release: the device identity and the
// vendor name, and none of the three record members, which is the ordinary first-run state.
void ({
  device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
  lastVendorName: 'Sump System',
} satisfies BasementGuardianAccessoryContext);

// The same context once the plugin has observed both pumps, in the units the persisted record holds:
// milliseconds for everything the plugin timed, and the device's own Unix seconds for the watermarks.
void ({
  device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
  lastVendorName: 'Sump System',
  primaryPump: { observationStartedAt: 1_756_684_800_000, activationCount: 4, lastActivationAt: 1_756_685_800_000 },
  backupPump: { observationStartedAt: 1_756_684_800_000, activationCount: 1, lastActivationAt: undefined, lastActivationWasTestActivity: true },
  watermarks: { backupPumpTimestamp: undefined, testTimestamp: 1_700_000_000 },
} satisfies BasementGuardianAccessoryContext);

// @ts-expect-error a stored pump record is what the plugin observed, never a bare count
void ({ primaryPump: 4 } satisfies BasementGuardianAccessoryContext);
// @ts-expect-error the watermarks hold the device's own timestamps, never a boolean
void ({ watermarks: true } satisfies BasementGuardianAccessoryContext);

const CONTACT_DETECTED = 0;
const CONTACT_NOT_DETECTED = 1;

// The one hand-built stand-in of this boundary. The accessory now declares its own HomeKit types by
// subclassing the injected namespace, so `Service` and `Characteristic` have to be constructible
// bases rather than identifier constants; a second stand-in of the same boundary would drift.
const HAP = createFakeHap();

// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];

// The accessory identifier the plugin derives for this device, taken from the same derivation the
// plugin uses rather than restated as a literal.
const ACCESSORY_UUID = HAP.uuid.generate(DEVICE_ID);

// The status a restored control refuses a press with, written independently of the stand-in so a
// drifted number fails here (D-08).
const NOT_ALLOWED_IN_CURRENT_STATE = -70412;

// What a controller's press answered: the status a refusal threw, or `undefined` for a write HAP
// accepted and stored. The two differ only in that answer.
async function pressOutcomeOf(service: FakeHapService): Promise<unknown> {
  const on = service.getCharacteristic(HAP.Characteristic.On);

  if (on === undefined) {
    throw new Error('the restored control carries no On characteristic');
  }

  try {
    await on.handleSetRequest(true);

    return undefined;
  } catch (error: unknown) {
    return error;
  }
}

const SECOND_ACCESSORY_UUID = HAP.uuid.generate(SECOND_DEVICE_ID);

function geminiDevice(): ApiDevice {
  return {
    deviceId: DEVICE_ID,
    deviceTypeId: DEVICE_TYPE_ID,
    name: 'Sump System',
    serialNumber: 'serial-1',
    connectivity: { connected: true, timestamp: 0 },
    data: {},
  };
}

// A full, legal Gemini telemetry payload, so a case that needs the real adapter
// to publish its rows states no field of its own.
const VALID_GEMINI_TELEMETRY: Readonly<Record<string, unknown>> = {
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

// The same device as the vendor's list route sends it: the records sit under a
// plural key and the serial number under `attributes`.
function geminiWireDeviceList(): { devices: Record<string, unknown>[] } {
  return {
    devices: [
      {
        accountId: 'account-1',
        deviceId: DEVICE_ID,
        deviceTypeId: DEVICE_TYPE_ID,
        name: 'Sump System',
        data: VALID_GEMINI_TELEMETRY,
        attributes: { productLine: 'wayneWater', serialNumber: 'serial-1' },
        connectivity: { connected: true, timestamp: 0 },
      },
    ],
  };
}

function unknownRegistry(): FamilyRegistry {
  return { lookup: (deviceTypeId: string): FamilyOutcome<unknown> => ({ kind: 'unknown', deviceTypeId }), shouldLog: () => true };
}

// A minimal fake family, so `registerDiscoveredDevices` tests exercising the
// `implemented` outcome need not depend on Gemini's own field shapes. Its
// `validate()` reports one scope's field invalid, which is what puts the
// accessory into the degraded state these dispatch-focused cases observe;
// `decode()` then omits that scope, as every family does for a scope whose own
// fields did not validate.
const FAKE_FAMILY: DeviceFamily<unknown> = {
  deviceTypeId: DEVICE_TYPE_ID,
  displayName: 'Fake Family',
  implemented: true,
  validate: () => ({ valid: false, violations: [{ field: 'ac_power', reason: 'missing', scope: 'power' }] }),
  decode: () => ({}),
  capabilities: () => [],
  command: () => ({ desiredData: {} }),
};

// A family that decodes every scope, with the one telemetry field the live-state cases change
// driving the power group, so a shadow patch produces an observable characteristic change rather
// than only a call the suite could have mocked. Every scope decodes because a row publishes no
// service until it has something to vouch for, so a case about the published service set needs a
// family that vouches for every scope.
//
// The backup pump follows its own reported field for the same reason: an activation a record case
// counts has to be one the accessory watched a payload report, not one this module asserted. No
// other case supplies that field, so every one of them keeps reading the `false` it read before.
const POWER_FAMILY: DeviceFamily<unknown> = {
  deviceTypeId: DEVICE_TYPE_ID,
  displayName: 'Power Family',
  implemented: true,
  validate: () => ({ valid: true }),
  decode: (snapshot) => ({
    metadata: {},
    water: { levelCode: 0, levelPercent: 0, flooded: false },
    pump: { primaryRunning: false, backupRunning: snapshot.data.backup_pump_running === true, backupActivatedAt: undefined },
    power: { mainsPresent: snapshot.data.ac_power === true },
    battery: { charging: true, voltageLow: false, healthCode: 8, protectionHoursCode: 8, levelPercent: 100, low: false },
    fault: { primaryPumpFault: false, backupPumpFault: false, backupPumpFuseBlown: false, waterSensorFault: false, controllerLinkPresent: true },
    connectivity: { reportedOffline: false },
  }),
  capabilities: () => [],
  command: () => ({ desiredData: {} }),
};

// A device whose decode raises, so a case can drive one failing device through a batch that also
// carries a healthy one.
const THROWING_DEVICE_ID = 'account-1_serial-throwing';

// A family that raises while decoding one named device and decodes every other one normally. The
// three reachable throws inside the dispatch (the identity guard, the AccessoryInformation guard,
// and a family decode guard) all reach the loop the same way, so one of them stands for all three.
const THROWING_FAMILY: DeviceFamily<unknown> = {
  ...POWER_FAMILY,
  decode: (snapshot) => {
    if (snapshot.identity.deviceId === THROWING_DEVICE_ID) {
      throw new TypeError('decode() expected ac_power to be a boolean');
    }

    return { metadata: {}, power: { mainsPresent: true } };
  },
};

// A family that raises on its first decode and decodes normally afterwards, so a case can drive one
// device through a failed first registration and the inventory that follows it.
function recoveringFamily(): DeviceFamily<unknown> {
  let decodes = 0;

  return {
    ...POWER_FAMILY,
    decode: (snapshot) => {
      decodes += 1;

      if (decodes === 1) {
        throw new TypeError('decode() expected ac_power to be a boolean');
      }

      return POWER_FAMILY.decode(snapshot);
    },
  };
}

function implementedRegistry(): FamilyRegistry {
  return { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: FAKE_FAMILY }), shouldLog: () => true };
}

function powerRegistry(): FamilyRegistry {
  return { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: POWER_FAMILY }), shouldLog: () => true };
}

function unsupportedRegistry(shouldLog: boolean): FamilyRegistry {
  return {
    lookup: (deviceTypeId: string): FamilyOutcome<unknown> => ({ kind: 'unsupported', deviceTypeId, displayName: 'Wayne Water HALO' }),
    shouldLog: () => shouldLog,
  };
}

interface FakeApiCall {
  pluginIdentifier: string;
  platformName: string;
  accessories: FakeAccessory[];
}

function fakeDiscoveryApi(registerCalls: FakeApiCall[], updateCalls: FakeAccessory[][] = [], unregisterCalls: FakeApiCall[] = []): API {
  const standIn = {
    hap: HAP_NAMESPACE,
    platformAccessory: HarnessPlatformAccessory,
    registerPlatformAccessories(pluginIdentifier: string, platformName: string, accessories: FakeAccessory[]) {
      registerCalls.push({ pluginIdentifier, platformName, accessories: [...accessories] });
    },
    updatePlatformAccessories(accessories: FakeAccessory[]) {
      updateCalls.push([...accessories]);
    },
    unregisterPlatformAccessories(pluginIdentifier: string, platformName: string, accessories: FakeAccessory[]) {
      unregisterCalls.push({ pluginIdentifier, platformName, accessories: [...accessories] });
    },
  };

  return standIn as unknown as API;
}

interface ContextOptions {
  api: API;
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  registry: FamilyRegistry;
  basementGuardianAccessories?: Map<string, BasementGuardianAccessory>;
  log?: Logging;
  ignoredFaults?: readonly NotificationServiceKind[];
  offlineConfirmationPollCount?: number;
  commands?: CommandPort;
}

// The discovery path never sends a command, so the stand-in every case gets rejects: an accessory
// that reached the command route while merely publishing would fail by name here.
function refusingCommands(): CommandPort {
  return { send: () => Promise.reject(new Error('the discovery path must not send a command')) };
}

// Every DiscoveryContext this suite builds carries the same wiring apart from the members a case is
// about, so the shared parts live here rather than in a literal per case.
function discoveryContext(options: ContextOptions): DiscoveryContext {
  return {
    api: options.api,
    accessories: options.accessories,
    basementGuardianAccessories: options.basementGuardianAccessories ?? new Map<string, BasementGuardianAccessory>(),
    registry: options.registry,
    log: options.log ?? createSilentLog(),
    ignoredFaults: options.ignoredFaults ?? [],
    offlineConfirmationPollCount: options.offlineConfirmationPollCount ?? 2,
    timers: systemTimers,
    commands: options.commands ?? refusingCommands(),
  };
}

// A BasementGuardianAccessory that records the account-wide trust it was
// handed. The fan-out's whole content is that every accessory hears the same
// answer, so recording which one heard what is the observation.
function recordingBasementGuardianAccessory(deviceId: string, marks: string[]): BasementGuardianAccessory {
  return {
    deviceId,
    services: [],
    untrusted: [],
    update: () => undefined,
    markMonitoring: (trust: MonitoringTrust): void => {
      marks.push(`${deviceId} rest ${String(trust.restDegraded)} shadow ${String(trust.shadowSilent)}`);
    },
  };
}

// The status a refused credential is presented under, and the leak state the restored accessories
// below carry. Both are written independently of the stand-in, so a drifted number fails here
// (D-10, 04-CONTEXT D-04).
const COMMUNICATION_FAILURE = -70402;
const LEAK_DETECTED = 1;

// The status a characteristic carries once an ordinary push has cleared a stored failure, written
// independently of the stand-in for the same reason the failure above is.
const READ_SUCCEEDS = 0;

/** Two accessories as a halted restart holds them, with the flood sensor of each held for reading. */
interface RestoredAccessories {
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  floods: readonly FakeHapService[];
}

// Restored from the Homebridge cache, carrying the readings the previous run published, and
// belonging to no `BasementGuardianAccessory` at all -- which is the state a run whose first grant
// the vendor refused leaves the platform in, because it never reaches discovery.
function restoredAccessories(): RestoredAccessories {
  const accessories = new Map<string, BasementGuardianPlatformAccessory>();
  const floods: FakeHapService[] = [];

  for (const uuid of [ACCESSORY_UUID, SECOND_ACCESSORY_UUID]) {
    const accessory = new HarnessPlatformAccessory('Sump Guardian', uuid);
    const flood = accessory.addService(HAP.Service.LeakSensor, 'Sump Pit Flood', 'sump-pit-flood');

    flood.updateCharacteristic(HAP.Characteristic.LeakDetected, LEAK_DETECTED);
    flood.updateCharacteristic(HAP.Characteristic.StatusActive, true);
    accessories.set(uuid, accessory as unknown as BasementGuardianPlatformAccessory);
    floods.push(flood);
  }

  return { accessories, floods };
}

// A cache an older release wrote: services carrying the readings that run published, and no trust
// report on any of them. This is the one restored shape a credential refusal marks nothing on, so it
// is the one shape an operator has to be told about -- every tile keeps answering and HomeKit shows
// no fault at all.
function restoredAccessoryCarryingNoTrustReport(): { accessories: Map<string, BasementGuardianPlatformAccessory>; control: FakeHapService } {
  const accessory = new HarnessPlatformAccessory('Sump Guardian', ACCESSORY_UUID);
  const control = accessory.addService(HAP.Service.Switch, 'Alarm Mute', 'alarm-mute');

  control.updateCharacteristic(HAP.Characteristic.On, true);

  return {
    accessories: new Map<string, BasementGuardianPlatformAccessory>([[ACCESSORY_UUID, accessory as unknown as BasementGuardianPlatformAccessory]]),
    control,
  };
}

// The line the platform logs when a refusal reached nothing, written out here rather than imported,
// so a reworded line fails this file as well as the source.
const NOTHING_MARKED =
  'The vendor refused the account credentials. No accessory shows this, because no cached service reports whether the plugin vouches for it. ' +
  'Correct the account email and password in the Homebridge UI (Plugins -> Basement Guardian -> Settings).';

/** One restored accessory with the live instance that publishes onto its services. */
interface RepublishingAccessory {
  accessories: Map<string, BasementGuardianPlatformAccessory>;
  basementGuardianAccessories: Map<string, BasementGuardianAccessory>;
  floods: readonly FakeHapService[];
}

// A restored accessory with a real `BasementGuardianAccessory` built over the same
// `PlatformAccessory`, so the boolean fan-out and the error push touch one set of services.
//
// This is what `recordingBasementGuardianAccessory` cannot be. That stand-in pushes nothing, so the
// services the error push walks are not the services the fan-out touched, and an inverted push order
// leaves every reading exactly where it was. A case that means to observe the clobber has to read a
// characteristic both loops reach, which means an instance that republishes its own rows onto the
// accessory the second loop walks (WR-01).
//
// The row is reached through the subtype the catalogue publishes under, which is the same subtype
// `restoredAccessories` seeds above -- so a rename on either side fails here rather than silently
// handing back a second, unwatched service.
function restoredAccessoryRepublishingItsRows(): RepublishingAccessory {
  const accessory = new HarnessPlatformAccessory('Sump Guardian', ACCESSORY_UUID);

  accessory.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };

  const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
  const built = createBasementGuardianAccessory({
    accessory: accessory as unknown as PlatformAccessory,
    hap: HAP_NAMESPACE,
    registry: powerRegistry(),
    log: createSilentLog(),
    timers: systemTimers,
    store: { persist: () => undefined },
    commands: refusingCommands(),
  });

  built.update(store.applyDiscovery(geminiDevice()), 'poll');

  const flood = accessory.getServiceById(HAP.Service.LeakSensor, 'sump-pit-flood');

  if (flood === undefined) {
    throw new Error('the accessory published no Sump Pit Flood service for this case to read');
  }

  return {
    accessories: new Map<string, BasementGuardianPlatformAccessory>([[ACCESSORY_UUID, accessory as unknown as BasementGuardianPlatformAccessory]]),
    basementGuardianAccessories: new Map<string, BasementGuardianAccessory>([[ACCESSORY_UUID, built]]),
    floods: [flood],
  };
}

// What a characteristic holds, and what a controller read of it answers. The read is the whole
// difference between unreadable and merely marked, so it is driven rather than inferred from the
// stored status.
function readOf(service: FakeHapService, characteristicClass: FakeCharacteristicClass): { value: unknown; threw: unknown } {
  const held = service.getCharacteristic(characteristicClass);
  let threw: unknown = undefined;

  try {
    held?.handleGetRequest();
  } catch (error: unknown) {
    threw = error;
  }

  return { value: held?.value, threw };
}

// The trust row beside a reading the pass must not touch, so preserve-and-erase fails here as
// plainly as an unmarked accessory does.
function trustReadsOf(
  floods: readonly FakeHapService[],
): readonly { statusActive: { value: unknown; threw: unknown }; leakDetected: { value: unknown; threw: unknown } }[] {
  return floods.map((flood) => ({
    statusActive: readOf(flood, HAP.Characteristic.StatusActive),
    leakDetected: readOf(flood, HAP.Characteristic.LeakDetected),
  }));
}

function statusesOf(floods: readonly FakeHapService[]): readonly (number | undefined)[] {
  return floods.map((flood) => flood.getCharacteristic(HAP.Characteristic.StatusActive)?.statusCode);
}

// The accessory the platform built for this device, so a case can watch the calls the store's own
// change notification makes on it rather than infer them.
function builtAccessory(basementGuardianAccessories: Map<string, BasementGuardianAccessory>): BasementGuardianAccessory {
  const built = basementGuardianAccessories.get(ACCESSORY_UUID);

  if (built === undefined) {
    throw new Error('the platform built no BasementGuardianAccessory for this device');
  }

  return built;
}

function reportedPatch(data: Readonly<Record<string, unknown>>): ReportedPatch {
  return { data, state: undefined, version: undefined };
}

// The one accessory the platform handed Homebridge, so a case reads what an owner would find in
// their home rather than what the plugin believes it published.
function onlyRegisteredAccessory(registerCalls: readonly FakeApiCall[]): FakeAccessory {
  const registered = registerCalls.flatMap((call) => call.accessories);
  const accessory = registered[0];

  if (accessory === undefined || registered.length !== 1) {
    throw new Error(`the platform registered ${String(registered.length)} accessories rather than one`);
  }

  return accessory;
}

// Every catalogue service that accessory carries, by the name HomeKit shows.
function publishedServiceNames(accessory: FakeAccessory): readonly string[] {
  return createServiceCatalogue(HAP_NAMESPACE)
    .filter((row) => accessory.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype) !== undefined)
    .map((row) => row.displayName);
}

// What a named row currently reports for the trust flag every service carries.
function statusActiveOf(accessory: FakeAccessory, displayName: string): unknown {
  const row = createServiceCatalogue(HAP_NAMESPACE).find((candidate) => candidate.displayName === displayName);
  const service = row === undefined ? undefined : accessory.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);

  return service?.characteristics.find((candidate) => candidate.UUID === HAP.Characteristic.StatusActive.UUID)?.value;
}

function contactStateOf(accessory: FakeAccessory, subtype: string): unknown {
  const service = accessory.getServiceById(HAP.Service.ContactSensor, subtype);

  return service?.characteristics.find((candidate) => candidate.UUID === HAP.Characteristic.ContactSensorState.UUID)?.value;
}

// A device already registered under its own accessory, with the store holding its first snapshot,
// which is the state every live-update case starts from.
function registeredDevice(context: DiscoveryContext, accessories: Map<string, BasementGuardianPlatformAccessory>, store: DeviceStateStore): FakeAccessory {
  const accessory = new HarnessPlatformAccessory('Sump System', ACCESSORY_UUID);
  accessory.context.lastVendorName = 'Sump System';
  accessory.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
  accessories.set(ACCESSORY_UUID, accessory as unknown as BasementGuardianPlatformAccessory);
  store.applyDiscovery(geminiDevice());
  registerDiscoveredDevices(context, [DEVICE_ID], store);

  return accessory;
}

// strong-mock matches a function argument only through It.matches, so the
// matcher doubles as the capture point for the registered listener.
function captureListener(listeners: (() => void)[]): () => void {
  return It.matches((listener: () => void) => {
    listeners.push(listener);

    return true;
  });
}

// An accepted configuration reaches for the Homebridge storage directory, so
// each such case gets its own, removed when the case ends.
async function expectStoragePath(t: TestContext, api: API): Promise<{ user: API['user']; storagePath: string }> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-platform-'));

  t.after(async () => {
    await rm(storagePath, { recursive: true, force: true });
  });

  const user = mock<API['user']>({ exactParams: true, name: 'homebridge user' });
  when(() => user.storagePath()).thenReturn(storagePath);
  when(() => api.user).thenReturn(user);

  return { user, storagePath };
}

describe('BasementGuardianPlatform', () => {
  test('holds no accessory and calls nothing on the API once constructed', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });

    // act
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, api);

    // assert
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(api);
  });

  test('logs one actionable refusal and registers no listener when the account email is missing', () => {
    // arrange
    const messages: string[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });

    // act
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), emptyConfig, api);

    // assert
    assert.deepStrictEqual(messages, [`Not starting: the account email is missing. ${REFUSAL_ADVICE}`]);
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(api);
  });

  test('CONF-03 logs the refusal through the redacting wrapper, so a configuration value cannot leak', () => {
    // arrange
    const messages: string[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const refusedReason = 'pollInterval must be a whole number of seconds from 300 to 3600, but it is "Bearer [redacted]".';

    // act
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), { ...accountConfig, pollInterval: 'Bearer leaked-token' }, api);

    // assert
    assert.deepStrictEqual(messages, [`Not starting: ${refusedReason} ${REFUSAL_ADVICE}`]);
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(api);
  });

  test('AUTH-02 logs the malformed-email refusal without the account email it rejected', () => {
    // arrange
    const messages: string[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const refusedReason = 'the account email must be an email address.';

    // act
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), { ...accountConfig, email: 'jane.doe@company' }, api);

    // assert
    assert.deepStrictEqual(messages, [`Not starting: ${refusedReason} ${REFUSAL_ADVICE}`]);
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(api);
  });

  test('AUTH-02 registers the account password as a secret once the configuration is accepted', async (t) => {
    // arrange
    t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no request expected')));
    const messages: string[] = [];
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    const platform = new BasementGuardianPlatform(createRecordingLog(messages), accountConfig, api);

    // act
    platform.log.info('the grant used account-password');

    // assert
    assert.deepStrictEqual(messages, ['the grant used [redacted]']);
    verify(user);
    verify(api);
  });

  test('registers the launch and shutdown listeners once the configuration is valid', async (t) => {
    // arrange
    const requestSpy = t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no request expected')));
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);

    // act
    const platform = new BasementGuardianPlatform(createSilentLog(), accountConfig, api);

    // assert
    assert.strictEqual(listeners.length, 2);
    assert.strictEqual(requestSpy.mock.callCount(), 0);
    assert.deepStrictEqual(platform.accessories, new Map());
    verify(user);
    verify(api);
  });

  test('starts the cloud work on the launch event and releases it on shutdown', async (t) => {
    // arrange
    const requestSpy = t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('the vendor is unreachable')));
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await until(() => requestSpy.mock.callCount() >= 2, 'the launch event to reach the vendor');
    const requestsAfterLaunch = requestSpy.mock.callCount();
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(
      { requestsAfterLaunch, requestsAfterShutdown: requestSpy.mock.callCount() - requestsAfterLaunch },
      { requestsAfterLaunch: 2, requestsAfterShutdown: 0 },
    );
    verify(user);
    verify(api);
  });

  test('AUTH-02 caches the granted token under the Homebridge storage directory', async (t) => {
    // arrange
    t.mock.method(globalThis, 'fetch', (input: string | URL) =>
      input.toString().endsWith('/oauth/token')
        ? Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }))
        : Promise.resolve(new Response('{}', { status: 503 })),
    );
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user, storagePath } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await until(async () => (await readdir(storagePath)).includes(TOKEN_CACHE_FILENAME), 'the token cache file to be written');
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(await readdir(storagePath), [TOKEN_CACHE_FILENAME]);
    verify(user);
    verify(api);
  });

  test('registers a newly discovered device once the launch event succeeds', async (t) => {
    // arrange
    t.mock.method(globalThis, 'fetch', (input: string | URL) => {
      const url = input.toString();

      if (url.endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      if (url.endsWith('/devices')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              devices: [
                {
                  accountId: 'account-1',
                  deviceId: DEVICE_ID,
                  deviceTypeId: DEVICE_TYPE_ID,
                  name: 'Sump System',
                  data: {},
                  attributes: { productLine: 'wayneWater', serialNumber: 'serial-1' },
                  connectivity: { connected: true, timestamp: 0 },
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.resolve(new Response('{}', { status: 503 }));
    });
    const registeredAccessories: FakeAccessory[] = [];
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    // `api.hap` is read twice while registering the accessory: once for the
    // UUID derivation, and once by the accessory factory, which declares this
    // plugin's own HomeKit types over the namespace it is given.
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => api.platformAccessory).thenReturn(HarnessPlatformAccessory as unknown as API['platformAccessory']);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          registeredAccessories.push(...(accessories as unknown as FakeAccessory[]));

          return true;
        }),
      );
    }).thenReturn(undefined);
    // No `updatePlatformAccessories` expectation: the record the accessory seeds from its first
    // snapshot mutates only the context, because the accessory is not registered yet, and the
    // registration's own cache save is what carries the seeded record to disk. The strict mock
    // fails this case by name if the seed asks Homebridge to update anyway (CTRL-01, D-008).
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await until(() => registeredAccessories.length > 0, 'the platform to register the discovered accessory');
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(
      { count: registeredAccessories.length, device: registeredAccessories[0]?.context.device },
      { count: 1, device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID } },
    );
    verify(user);
    verify(api);
  });

  test('withdraws the offline verdict from every published accessory once polling has failed twice', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let deviceListCalls = 0;
    t.mock.method(globalThis, 'fetch', (input: string | URL) => {
      const url = input.toString();

      if (url.endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      if (url.endsWith('/devices')) {
        deviceListCalls += 1;

        return deviceListCalls === 1
          ? Promise.resolve(new Response(JSON.stringify(geminiWireDeviceList()), { status: 200 }))
          : Promise.resolve(new Response('{}', { status: 503 }));
      }

      return Promise.resolve(new Response('{}', { status: 503 }));
    });
    const registeredAccessories: FakeAccessory[] = [];
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    // Twice while registering the accessory: the UUID derivation, then the
    // accessory factory declaring this plugin's own HomeKit types.
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    when(() => api.platformAccessory).thenReturn(HarnessPlatformAccessory as unknown as API['platformAccessory']);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          registeredAccessories.push(...(accessories as unknown as FakeAccessory[]));

          return true;
        }),
      );
    }).thenReturn(undefined);
    new BasementGuardianPlatform(createSilentLog(), { ...accountConfig, pollInterval: 300 }, api);
    const [launch, shutdown] = listeners;
    launch?.();
    await until(() => registeredAccessories.length > 0, 'the platform to register the discovered accessory');
    const accessory = registeredAccessories[0];

    if (accessory === undefined) {
      throw new Error('the platform registered no accessory');
    }

    const beforeAnyFailure = statusActiveOf(accessory, 'Basement Guardian Offline');

    // act
    t.mock.timers.tick(300_000);
    await settle();
    t.mock.timers.tick(300_000);
    await settle();
    await until(() => statusActiveOf(accessory, 'Basement Guardian Offline') === false, 'the platform to withdraw the offline verdict');
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(
      {
        beforeAnyFailure,
        offline: statusActiveOf(accessory, 'Basement Guardian Offline'),
        flood: statusActiveOf(accessory, 'Sump Pit Flood'),
        offlineState: contactStateOf(accessory, 'basement-guardian-offline'),
      },
      { beforeAnyFailure: true, offline: false, flood: true, offlineState: CONTACT_DETECTED },
    );
    verify(user);
    verify(api);
  });

  test('unregisters a confirmed-absent accessory once two trustworthy polls and a final check agree it is gone', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let deviceListCalls = 0;
    t.mock.method(globalThis, 'fetch', (input: string | URL) => {
      const url = input.toString();

      if (url.endsWith('/oauth/token')) {
        return Promise.resolve(new Response(JSON.stringify({ id_token: 'id-token-1', expires_in: 2_592_000 }), { status: 200 }));
      }

      if (url.endsWith('/devices')) {
        deviceListCalls += 1;

        const wireDevice = {
          accountId: 'account-1',
          deviceId: DEVICE_ID,
          deviceTypeId: DEVICE_TYPE_ID,
          name: 'Sump System',
          data: {},
          attributes: { productLine: 'wayneWater', serialNumber: 'serial-1' },
          connectivity: { connected: true, timestamp: 0 },
        };
        const body = deviceListCalls === 1 ? { devices: [wireDevice] } : { devices: [] };

        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      }

      return Promise.resolve(new Response('{}', { status: 503 }));
    });
    const registeredAccessories: FakeAccessory[] = [];
    const unregisteredAccessories: FakeAccessory[] = [];
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    // `api.hap` is read three times across this scenario: twice while
    // registering the accessory (the UUID derivation, then the accessory
    // factory), and once more while deriving the same UUID to look the
    // accessory up for removal.
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(3);
    when(() => api.platformAccessory).thenReturn(HarnessPlatformAccessory as unknown as API['platformAccessory']);
    when(() => {
      api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          registeredAccessories.push(...(accessories as unknown as FakeAccessory[]));

          return true;
        }),
      );
    }).thenReturn(undefined);
    when(() => {
      api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        It.matches((accessories: PlatformAccessory[]) => {
          unregisteredAccessories.push(...(accessories as unknown as FakeAccessory[]));

          return true;
        }),
      );
    }).thenReturn(undefined);
    const platform = new BasementGuardianPlatform(createSilentLog(), { ...accountConfig, pollInterval: 300 }, api);
    const [launch, shutdown] = listeners;

    // act
    launch?.();
    await until(() => registeredAccessories.length > 0, 'the platform to register the discovered accessory');
    t.mock.timers.tick(300_000);
    await settle();
    t.mock.timers.tick(300_000);
    await settle();
    await until(() => unregisteredAccessories.length > 0, 'the platform to unregister the confirmed-absent accessory');
    shutdown?.();
    await settle();

    // assert
    assert.deepStrictEqual(
      { unregisteredCount: unregisteredAccessories.length, accessoryCount: platform.accessories.size },
      { unregisteredCount: 1, accessoryCount: 0 },
    );
    verify(user);
    verify(api);
  });

  test('reaches no vendor route until Homebridge reports it has finished launching', async (t) => {
    // arrange
    const requestSpy = t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('the vendor is unreachable')));
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);

    // act
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);
    await settle();

    // assert
    assert.strictEqual(requestSpy.mock.callCount(), 0);
    verify(user);
    verify(api);
  });

  test('wires the concrete process timers at the composition root alone', async () => {
    // act
    const wiring = await modulesNaming('systemTimers');

    // assert
    assert.deepStrictEqual(wiring, ['platform.ts', 'runtime/timers.ts']);
  });

  test('registers and removes no accessory across the whole lifecycle', async (t) => {
    // arrange
    t.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('no request expected')));
    const listeners: (() => void)[] = [];
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const { user } = await expectStoragePath(t, api);
    when(() => api.on('didFinishLaunching', captureListener(listeners))).thenReturn(api);
    when(() => api.on('shutdown', captureListener(listeners))).thenReturn(api);
    new BasementGuardianPlatform(createSilentLog(), accountConfig, api);

    // act
    for (const listener of listeners) {
      listener();
    }

    // assert
    verify(user);
    verify(api);
  });
});

describe('configureAccessory', () => {
  test('records a restored accessory under its UUID', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const restoredAccessory = mock<PlatformAccessory>({ exactParams: true, name: 'restored accessory' });
    when(() => restoredAccessory.UUID).thenReturn('accessory-uuid-1');
    when(() => restoredAccessory.displayName).thenReturn('Sump Pump');
    when(() => restoredAccessory.services)
      .thenReturn([])
      .times(2);
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, api);

    // act
    platform.configureAccessory(restoredAccessory);

    // assert
    assert.deepStrictEqual([...platform.accessories.keys()], ['accessory-uuid-1']);
    const cachedAccessory: BasementGuardianPlatformAccessory | undefined = platform.accessories.get('accessory-uuid-1');
    assert.strictEqual(cachedAccessory, restoredAccessory);
    verify(restoredAccessory);
    verify(api);
  });

  test('keeps one entry when the same accessory is restored twice', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const restoredAccessory = mock<PlatformAccessory>({ exactParams: true, name: 'restored accessory' });
    when(() => restoredAccessory.UUID)
      .thenReturn('accessory-uuid-1')
      .times(2);
    when(() => restoredAccessory.displayName)
      .thenReturn('Sump Pump')
      .times(2);
    when(() => restoredAccessory.services)
      .thenReturn([])
      .times(4);
    when(() => api.hap)
      .thenReturn(HAP_NAMESPACE)
      .times(2);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, api);

    // act
    platform.configureAccessory(restoredAccessory);
    platform.configureAccessory(restoredAccessory);

    // assert
    assert.deepStrictEqual([...platform.accessories.keys()], ['accessory-uuid-1']);
    assert.strictEqual(platform.accessories.get('accessory-uuid-1'), restoredAccessory);
    verify(restoredAccessory);
    verify(api);
  });

  test('withdraws trust from every restored service that reports it, and still records the accessory (RES-04, D-06)', () => {
    // arrange
    const restoredAccessory = new HarnessPlatformAccessory('Sump Guardian', ACCESSORY_UUID);
    const flood = restoredAccessory.addService(HAP.Service.LeakSensor, 'Sump Pit Flood', 'sump-pit-flood');
    flood.updateCharacteristic(HAP.Characteristic.LeakDetected, HAP.Characteristic.LeakDetected.LEAK_DETECTED);
    flood.updateCharacteristic(HAP.Characteristic.StatusActive, true);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, fakeDiscoveryApi([]));

    // act
    platform.configureAccessory(restoredAccessory as unknown as PlatformAccessory);

    // assert
    assert.deepStrictEqual(
      {
        statusActive: flood.getCharacteristic(HAP.Characteristic.StatusActive)?.value,
        leakDetected: flood.getCharacteristic(HAP.Characteristic.LeakDetected)?.value,
        recorded: platform.accessories.get(ACCESSORY_UUID) === (restoredAccessory as unknown as BasementGuardianPlatformAccessory),
      },
      { statusActive: false, leakDetected: HAP.Characteristic.LeakDetected.LEAK_DETECTED, recorded: true },
    );
  });

  // The window the restart passes exist for. HAP answers a write with no handler by storing the
  // value and reporting success, so before this pass a press on a restored control flipped the
  // toggle, reported that it worked, and sent nothing (RES-04, D-07).
  test('refuses a press on every restored control, so a press before the first poll is not silently accepted (RES-04, D-07)', async () => {
    // arrange
    const restoredAccessory = new HarnessPlatformAccessory('Sump Guardian', ACCESSORY_UUID);
    const control = restoredAccessory.addService(HAP.Service.Switch, 'System Self-Test', 'system-self-test');
    control.updateCharacteristic(HAP.Characteristic.On, false);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, fakeDiscoveryApi([]));

    // act
    platform.configureAccessory(restoredAccessory as unknown as PlatformAccessory);

    // assert
    assert.deepStrictEqual(
      { press: await pressOutcomeOf(control), on: control.getCharacteristic(HAP.Characteristic.On)?.value },
      { press: NOT_ALLOWED_IN_CURRENT_STATE, on: false },
    );
  });

  test('D-03 removes nothing from HomeKit on cache-restore alone', () => {
    // arrange
    const api = mock<API>({ exactParams: true, name: 'homebridge api' });
    const staleAccessory = mock<PlatformAccessory>({ exactParams: true, name: 'stale accessory' });
    when(() => staleAccessory.UUID).thenReturn('accessory-uuid-gone');
    when(() => staleAccessory.displayName).thenReturn('Retired Pump');
    when(() => staleAccessory.services)
      .thenReturn([])
      .times(2);
    when(() => api.hap).thenReturn(HAP_NAMESPACE);
    const platform = new BasementGuardianPlatform(createSilentLog(), emptyConfig, api);

    // act
    platform.configureAccessory(staleAccessory);

    // assert
    verify(api);
    verify(staleAccessory);
  });
});

describe('applyMonitoringHealth', () => {
  // What a launch the vendor refused before its first inventory pushes: no device was ever
  // discovered, so no system has an answer and the credential branch is the whole of what the pass
  // does. Every accessory therefore takes the missing-entry rule, which is the conservative reading
  // and the one that costs nothing here (RES-04, D-01, D-02).
  const NO_DEVICE_ANSWERED = new Map<string, MonitoringTrust>();

  // Two systems, one account, and each accessory hears the answer for its own controller. The map is
  // keyed by deviceId while the accessory map is keyed by the UUID that deviceId seeds, so this also
  // holds the join: keying the pushed map by the generated UUID makes both accessories miss, both
  // take the missing-entry rule, and the two recorded values stop differing. One accessory could not
  // catch that (D-01, D-01a).
  test('hands each accessory the answer for its own system', () => {
    // arrange
    const marks: string[] = [];
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>([
      [ACCESSORY_UUID, recordingBasementGuardianAccessory(DEVICE_ID, marks)],
      [SECOND_ACCESSORY_UUID, recordingBasementGuardianAccessory(SECOND_DEVICE_ID, marks)],
    ]);
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: new Map<string, BasementGuardianPlatformAccessory>(),
      registry: unknownRegistry(),
      basementGuardianAccessories,
    });
    const account = { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false } satisfies MonitoringTrust;

    // act
    applyMonitoringHealth(
      context,
      account,
      new Map<string, MonitoringTrust>([
        [DEVICE_ID, { ...account, shadowSilent: true }],
        [SECOND_DEVICE_ID, { ...account, shadowSilent: false }],
      ]),
    );

    // assert
    assert.deepStrictEqual(marks, [`${DEVICE_ID} rest false shadow true`, `${SECOND_DEVICE_ID} rest false shadow false`]);
  });

  test('reaches nothing when this run has published no accessory yet', () => {
    // arrange
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: new Map<string, BasementGuardianPlatformAccessory>(),
      registry: unknownRegistry(),
    });

    // act & assert
    assert.doesNotThrow(() => {
      applyMonitoringHealth(context, { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: false }, NO_DEVICE_ANSWERED);
    });
  });

  // The walk is over the platform's own accessory map rather than over the `BasementGuardianAccessory`
  // instances, because a run whose first grant the vendor refused never reaches discovery and has
  // none of the latter. These two accessories are exactly what a halted restart holds: restored,
  // carrying the values the previous run published, and belonging to no accessory instance at all
  // (RES-04, D-10).
  test('makes every restored accessory unreadable when the vendor has refused the credentials', () => {
    // arrange
    const restored = restoredAccessories();
    const context = discoveryContext({ api: fakeDiscoveryApi([]), accessories: restored.accessories, registry: unknownRegistry() });

    // act
    applyMonitoringHealth(context, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }, NO_DEVICE_ANSWERED);

    // assert
    assert.deepStrictEqual(trustReadsOf(restored.floods), [
      { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
      { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
    ]);
  });

  // A refusal that arrives after a successful start reaches the accessories this run built, not only
  // the ones a halted launch found in the cache. Both kinds are in the platform's own accessory map,
  // which is what the unreadable pass walks, and the built one is here as well -- so the pass that
  // reaches a restored accessory is proven to reach a discovered one in the same call (CR-03, D-10).
  test('makes an accessory a successful inventory built unreadable in the same pass as a restored one', () => {
    // arrange
    const marks: string[] = [];
    const restored = restoredAccessories();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: restored.accessories,
      registry: unknownRegistry(),
      basementGuardianAccessories: new Map<string, BasementGuardianAccessory>([[ACCESSORY_UUID, recordingBasementGuardianAccessory(DEVICE_ID, marks)]]),
    });

    const account = { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true } satisfies MonitoringTrust;

    // act
    // The map names this case's own device, rather than being left empty, because the refusal here
    // followed a successful start: that run discovered the device and heard from it, so an empty map
    // would say the plugin had stopped hearing a controller that was speaking, and the case would
    // have to have its expectation edited to match. The subject is the credential branch reaching a
    // built accessory and a restored one in the same pass, and it stays that.
    applyMonitoringHealth(context, account, new Map<string, MonitoringTrust>([[DEVICE_ID, account]]));

    // assert
    assert.deepStrictEqual(
      { marks, reads: trustReadsOf(restored.floods) },
      {
        marks: [`${DEVICE_ID} rest false shadow false`],
        reads: [
          { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
          { statusActive: { value: true, threw: COMMUNICATION_FAILURE }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
        ],
      },
    );
  });

  // What this case pins is the fan-out's reach, not its ordering: every accessory in the map hears the
  // same account-wide answer in the same pass that makes the restored accessories unreadable.
  //
  // It cannot pin the ordering, and the comment that said it did was wrong. The stand-in pushes
  // nothing, so the flood services the error push walks are not services it ever touched, and
  // inverting the two loops in `applyMonitoringHealth` leaves this case green. The case below --
  // "leaves the pushed status standing over an accessory that republishes its own rows" -- is the one
  // that pins the ordering, because the instance it drives republishes onto the very services the
  // error push then marks (WR-01).
  test('leaves the pushed status standing after the boolean fan-out has run', () => {
    // arrange
    const marks: string[] = [];
    const restored = restoredAccessories();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: restored.accessories,
      registry: unknownRegistry(),
      basementGuardianAccessories: new Map<string, BasementGuardianAccessory>([[ACCESSORY_UUID, recordingBasementGuardianAccessory(DEVICE_ID, marks)]]),
    });

    // act
    applyMonitoringHealth(context, { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, NO_DEVICE_ANSWERED);

    // assert
    assert.deepStrictEqual(
      { marks, statuses: statusesOf(restored.floods) },
      { marks: [`${DEVICE_ID} rest true shadow true`], statuses: [COMMUNICATION_FAILURE, COMMUNICATION_FAILURE] },
    );
  });

  // The ordering inside the fan-out is load-bearing and this is what pins it: an ordinary push clears
  // a stored status, so an error pushed before `markMonitoring` republished its rows would be
  // silently undone by the boolean that followed it. The accessory here is real and publishes onto
  // the same flood service the error push walks, so an inverted order is observable as a readable
  // value where a status should stand.
  //
  // The value *under* the status is `false`, while the fixture-driven case two above reads `true`
  // under the same status. Neither is wrong and neither should be "corrected" to match the other. A
  // refused credential withdraws every trust scope, so a real accessory republishes its trust report
  // as `false` before the error lands on it; the fixture's `true` was written by
  // `restoredAccessories` and no accessory ever republished it, because that case holds no instance
  // bound to those services (05-16).
  test('leaves the pushed status standing over an accessory that republishes its own rows', () => {
    // arrange
    const live = restoredAccessoryRepublishingItsRows();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: live.accessories,
      registry: powerRegistry(),
      basementGuardianAccessories: live.basementGuardianAccessories,
    });

    // act
    applyMonitoringHealth(context, { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: true }, NO_DEVICE_ANSWERED);

    // assert
    assert.deepStrictEqual(trustReadsOf(live.floods), [
      { statusActive: { value: false, threw: COMMUNICATION_FAILURE }, leakDetected: { value: 0, threw: undefined } },
    ]);
  });

  // The case above is only as good as the fixture it reads, and the fixture it replaced was
  // indistinguishable from a working one: it reported the same green under both push orders. So this
  // case asserts the discriminating property directly, over two identically built fixtures -- the
  // plugin's own order leaves a status standing, the inversion leaves a readable value, and the two
  // readings differ.
  //
  // Built on a stand-in that pushes nothing, both orders leave the same status standing, the readings
  // do not differ, and this case fails. That is the whole point: the vacuity nobody noticed is caught
  // by the suite rather than by an executor's report of a mutation they applied by hand.
  //
  // The two halves are driven by calling the collaborators directly rather than by copying
  // `applyMonitoringHealth`'s body, so this case measures the instrument and not a second copy of the
  // production loop.
  test('reads a different trust report under each push order, which is what makes the ordering case able to fail', () => {
    // arrange
    const inPluginOrder = restoredAccessoryRepublishingItsRows();
    const inverted = restoredAccessoryRepublishingItsRows();
    const refusal = { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: true } satisfies MonitoringTrust;
    const markUnreadable = (accessories: Map<string, BasementGuardianPlatformAccessory>): void => {
      for (const accessory of accessories.values()) {
        markTrustReportsUnreadable(accessory, HAP_NAMESPACE, HAP_NAMESPACE.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
      }
    };

    // act
    for (const built of inPluginOrder.basementGuardianAccessories.values()) {
      built.markMonitoring(refusal);
    }

    markUnreadable(inPluginOrder.accessories);
    markUnreadable(inverted.accessories);

    for (const built of inverted.basementGuardianAccessories.values()) {
      built.markMonitoring(refusal);
    }

    // assert
    assert.notDeepStrictEqual(statusesOf(inPluginOrder.floods), statusesOf(inverted.floods));
    assert.deepStrictEqual(
      { pluginOrder: statusesOf(inPluginOrder.floods), inverted: statusesOf(inverted.floods) },
      { pluginOrder: [COMMUNICATION_FAILURE], inverted: [READ_SUCCEEDS] },
    );
  });

  // The marking pass reaches every service that carries a trust report and no others, so a cache
  // written before that row was published is refused credentials with nothing marked in HomeKit and,
  // without this line, nothing anywhere else either (WR-08, D-10).
  test('tells an operator when a credential refusal reached no service at all', () => {
    // arrange
    const messages: string[] = [];
    const restored = restoredAccessoryCarryingNoTrustReport();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: restored.accessories,
      registry: unknownRegistry(),
      log: createRecordingLog(messages),
    });

    // act
    applyMonitoringHealth(context, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }, NO_DEVICE_ANSWERED);

    // assert
    assert.deepStrictEqual(
      {
        messages,
        carriesTrust: restored.control.testCharacteristic(HAP.Characteristic.StatusActive),
        on: readOf(restored.control, HAP.Characteristic.On),
      },
      { messages: [NOTHING_MARKED], carriesTrust: false, on: { value: true, threw: undefined } },
    );
  });

  // One line per refusal per accessory would be noise: a marked tile stops answering, which is the
  // presentation itself. The line names the case that has no presentation, and nothing else.
  test('says nothing extra when the refusal marked the services it reached', () => {
    // arrange
    const messages: string[] = [];
    const restored = restoredAccessories();
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: restored.accessories,
      registry: unknownRegistry(),
      log: createRecordingLog(messages),
    });

    // act
    applyMonitoringHealth(context, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }, NO_DEVICE_ANSWERED);

    // assert
    assert.deepStrictEqual({ messages, statuses: statusesOf(restored.floods) }, { messages: [], statuses: [COMMUNICATION_FAILURE, COMMUNICATION_FAILURE] });
  });

  // An empty accessory map is a zero too, and it says nothing is wrong: a launch the vendor refused
  // before the first inventory has nothing to mark. The condition worth a line is a cache holding
  // accessories and no trust report on any of them, so the count alone is not the test.
  test('says nothing for a refusal that arrived before this run had any accessory to mark', () => {
    // arrange
    const messages: string[] = [];
    const context = discoveryContext({
      api: fakeDiscoveryApi([]),
      accessories: new Map<string, BasementGuardianPlatformAccessory>(),
      registry: unknownRegistry(),
      log: createRecordingLog(messages),
    });

    // act
    applyMonitoringHealth(context, { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: true }, NO_DEVICE_ANSWERED);

    // assert
    assert.deepStrictEqual(messages, []);
  });

  // Credential rejection is the only cause in this plugin that makes a characteristic unreadable.
  // Every row here is a degradation that clears itself once its transport returns, and greying out an
  // accessory for one of those teaches an owner to ignore the one signal that needs them
  // (D-10, 03-CONTEXT D-05).
  for (const { cause, trust } of [
    { cause: 'a shadow silence', trust: { restDegraded: false, shadowSilent: true, commandTransportReady: true, credentialsRejected: false } },
    { cause: 'a REST degradation', trust: { restDegraded: true, shadowSilent: false, commandTransportReady: false, credentialsRejected: false } },
    { cause: 'an unready command transport', trust: { restDegraded: false, shadowSilent: false, commandTransportReady: false, credentialsRejected: false } },
    { cause: 'both transports lost', trust: { restDegraded: true, shadowSilent: true, commandTransportReady: false, credentialsRejected: false } },
  ] satisfies readonly { cause: string; trust: MonitoringTrust }[]) {
    test(`leaves every restored accessory readable for ${cause}`, () => {
      // arrange
      const restored = restoredAccessories();
      const context = discoveryContext({ api: fakeDiscoveryApi([]), accessories: restored.accessories, registry: unknownRegistry() });

      // act
      applyMonitoringHealth(context, trust, NO_DEVICE_ANSWERED);

      // assert
      assert.deepStrictEqual(trustReadsOf(restored.floods), [
        { statusActive: { value: true, threw: undefined }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
        { statusActive: { value: true, threw: undefined }, leakDetected: { value: LEAK_DETECTED, threw: undefined } },
      ]);
    });
  }
});

describe('registerDiscoveredDevices', () => {
  test('registers one accessory for a newly discovered device not already in accessories', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: implementedRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryCount: accessories.size,
        registerCalls: registerCalls.map((call) => ({
          pluginIdentifier: call.pluginIdentifier,
          platformName: call.platformName,
          deviceIds: call.accessories.map((accessory) => accessory.context.device),
        })),
      },
      {
        accessoryCount: 1,
        registerCalls: [{ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, deviceIds: [{ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }] }],
      },
    );
  });

  test('updates a deviceId already present in accessories in place instead of registering it again', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Sump System', uuid);
    existing.context.lastVendorName = 'Sump System';
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryCount: accessories.size,
        registerCalls,
        displayName: existing.displayName,
        device: existing.context.device,
        updatedAccessoryCount: updateCalls.length,
      },
      {
        accessoryCount: 1,
        registerCalls: [],
        displayName: 'Sump System',
        device: { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID },
        updatedAccessoryCount: 1,
      },
    );
  });

  test('adopts a vendor rename when the display name still matches the stored vendor name', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Sump System', uuid);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), name: 'Sump Sentry' });

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { displayName: existing.displayName, lastVendorName: existing.context.lastVendorName, updatedAccessoryCount: updateCalls.length },
      { displayName: 'Sump Sentry', lastVendorName: 'Sump Sentry', updatedAccessoryCount: 1 },
    );
  });

  test('keeps a customized display name but still advances the stored vendor name', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Basement Pump', uuid);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), name: 'Sump Sentry' });

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { displayName: existing.displayName, lastVendorName: existing.context.lastVendorName, updatedAccessoryCount: updateCalls.length },
      { displayName: 'Basement Pump', lastVendorName: 'Sump Sentry', updatedAccessoryCount: 1 },
    );
  });

  test('calls updatePlatformAccessories no times when nothing about the cached accessory changed', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Sump System', uuid);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { displayName: existing.displayName, lastVendorName: existing.context.lastVendorName, updatedAccessoryCount: updateCalls.length },
      { displayName: 'Sump System', lastVendorName: 'Sump System', updatedAccessoryCount: 0 },
    );
  });

  // The first poll on a new device runs before registration for throw-safety, and it always seeds
  // the pump records, which fires the persist port. An update call for a never-registered accessory
  // poisons Homebridge's cached-accessory list and voids the registration that follows, so the port
  // must stay silent until the platform has recorded the accessory as its own (DEV-01, CTRL-01).
  test('registers a newly discovered device without asking Homebridge to update a never-registered accessory', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi(registerCalls, updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: powerRegistry() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { registered: registerCalls.map((call) => call.accessories.map((accessory) => accessory.UUID)), updated: updateCalls },
      { registered: [[ACCESSORY_UUID]], updated: [] },
    );
  });

  test('persists a vendor rename it already applied when the update that follows it throws', () => {
    // arrange
    const updateCalls: FakeAccessory[][] = [];
    const api = fakeDiscoveryApi([], updateCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const existing = new HarnessPlatformAccessory('Sump System', ACCESSORY_UUID);
    existing.context.lastVendorName = 'Sump System';
    existing.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(ACCESSORY_UUID, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), name: 'Sump Sentry' });
    const family = recoveringFamily();
    const registry: FamilyRegistry = { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family }), shouldLog: () => true };

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry, log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        displayName: existing.displayName,
        persisted: updateCalls.map((call) => call.map((persistedAccessory) => persistedAccessory.displayName)),
      },
      { displayName: 'Sump Sentry', persisted: [['Sump Sentry']] },
    );
  });

  test('does nothing for a deviceId the store holds no snapshot for', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual({ accessoryCount: accessories.size, registerCalls }, { accessoryCount: 0, registerCalls: [] });
  });

  test('explains and skips an unsupported device, registering nothing for it', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];

    // act
    registerDiscoveredDevices(
      discoveryContext({ api, accessories, registry: unsupportedRegistry(true), log: createRecordingLog(messages) }),
      [DEVICE_ID],
      store,
    );

    // assert
    const expectedMessage = `Skipping ${DEVICE_ID}: Wayne Water HALO (${DEVICE_TYPE_ID}) is a recognized but unsupported device family.`;
    assert.deepStrictEqual(
      { accessoryCount: accessories.size, registerCalls, messages },
      { accessoryCount: 0, registerCalls: [], messages: [expectedMessage] },
    );
  });

  test('explains and skips an unknown device, registering nothing for it', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createRecordingLog(messages) }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      { accessoryCount: accessories.size, registerCalls, messages },
      { accessoryCount: 0, registerCalls: [], messages: [`Skipping ${DEVICE_ID}: ${DEVICE_TYPE_ID} is not a recognized device family.`] },
    );
  });

  test('says nothing for a skipped device once the registry reports it already logged', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];

    // act
    registerDiscoveredDevices(
      discoveryContext({ api, accessories, registry: unsupportedRegistry(false), log: createRecordingLog(messages) }),
      [DEVICE_ID],
      store,
    );

    // assert
    assert.deepStrictEqual({ accessoryCount: accessories.size, registerCalls, messages }, { accessoryCount: 0, registerCalls: [], messages: [] });
  });

  test('registers a valid device after skipping an unsupported device earlier in the same batch', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const haloDeviceId = 'halo-device';
    store.applyDiscovery({ ...geminiDevice(), deviceId: haloDeviceId, deviceTypeId: 'wayneWaterHalo' });
    store.applyDiscovery(geminiDevice());
    const registry: FamilyRegistry = {
      lookup: (deviceTypeId: string): FamilyOutcome<unknown> =>
        deviceTypeId === DEVICE_TYPE_ID ? { kind: 'implemented', family: FAKE_FAMILY } : { kind: 'unsupported', deviceTypeId, displayName: 'Wayne Water HALO' },
      shouldLog: () => true,
    };

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry, log: createSilentLog() }), [haloDeviceId, DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryCount: accessories.size,
        registeredDeviceIds: registerCalls.flatMap((call) => call.accessories.map((accessory) => accessory.context.device)),
      },
      { accessoryCount: 1, registeredDeviceIds: [{ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }] },
    );
  });

  test('registers a healthy device after an earlier device in the same batch throws', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), deviceId: THROWING_DEVICE_ID });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];
    const registry: FamilyRegistry = { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family: THROWING_FAMILY }), shouldLog: () => true };

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry, log: createRecordingLog(messages) }), [THROWING_DEVICE_ID, DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        registeredDeviceIds: registerCalls.flatMap((call) => call.accessories.map((accessory) => accessory.context.device)),
        messages,
      },
      {
        registeredDeviceIds: [{ deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID }],
        messages: [`Skipping ${THROWING_DEVICE_ID} on this inventory; every other device still updates.`],
      },
    );
  });

  test('publishes onto the accessory it registered after a first update on a new device throws', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery({ ...geminiDevice(), data: { ac_power: false } });
    const family = recoveringFamily();
    const registry: FamilyRegistry = { lookup: (): FamilyOutcome<unknown> => ({ kind: 'implemented', family }), shouldLog: () => true };
    const context = discoveryContext({ api, accessories, registry, log: createSilentLog() });
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    const registered = onlyRegisteredAccessory(registerCalls);
    assert.deepStrictEqual(publishedServiceNames(registered), [
      'Sump Pit Flood',
      'Sump Pit Level',
      'Primary Pump',
      'Primary Pump Running',
      'Backup Pump',
      'Backup Pump Activated',
      'Sump Mains Power',
      'Mains Power Lost',
      'Backup Battery',
      'Backup Battery Facts',
      'Primary Pump Fault',
      'Backup Pump Fault',
      'Water Sensor Fault',
      'Pump Controller Link Lost',
      'System Self-Test',
      'Alarm Mute',
      'Basement Guardian Offline',
    ]);
    assert.strictEqual(contactStateOf(registered, 'mains-power-lost'), CONTACT_NOT_DETECTED);
  });

  test('reuses the same BasementGuardianAccessory across polls so the DEV-08 log-once state persists', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());
    const messages: string[] = [];
    const context = discoveryContext({ api, accessories, basementGuardianAccessories, registry: implementedRegistry(), log: createRecordingLog(messages) });

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    const expectedMessage =
      `Degraded ${DEVICE_ID}: the profile or payload stopped validating. ` +
      'AccessoryInformation keeps its last valid values until a family-valid update recovers it.';
    assert.deepStrictEqual(messages, [expectedMessage]);
  });

  test('delivers a between-poll shadow change to HomeKit without waiting for the next poll', () => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, registry: powerRegistry() });
    const accessory = registeredDevice(context, accessories, store);
    const beforePatch = contactStateOf(accessory, 'mains-power-lost');

    // act
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));

    // assert
    assert.deepStrictEqual(
      { beforePatch, afterPatch: contactStateOf(accessory, 'mains-power-lost') },
      { beforePatch: CONTACT_NOT_DETECTED, afterPatch: CONTACT_DETECTED },
    );
  });

  test('updates from the poll as poll-sourced and from the store notification as live', (t) => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, basementGuardianAccessories, registry: powerRegistry() });
    registeredDevice(context, accessories, store);
    const updateSpy = t.mock.method(builtAccessory(basementGuardianAccessories), 'update');

    // act
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      updateSpy.mock.calls.map((call) => call.arguments[1]),
      ['live', 'poll'],
    );
  });

  test('calls updatePlatformAccessories once a suppression changes the published service set', () => {
    // arrange
    const updateCalls: FakeAccessory[][] = [];
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const context = discoveryContext({ api: fakeDiscoveryApi([], updateCalls), accessories, registry: powerRegistry(), ignoredFaults });
    registeredDevice(context, accessories, store);
    const afterFirstPoll = updateCalls.length;

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    // Two calls on the first poll: the record the accessory seeded from that snapshot, and the
    // service set the suppression changed. The second poll changes neither, so it adds none.
    assert.deepStrictEqual({ afterFirstPoll, afterSecondPoll: updateCalls.length }, { afterFirstPoll: 2, afterSecondPoll: 2 });
  });

  // The store is built per accessory at the one call site that builds an accessory, so no shared or
  // process-wide store exists. The pump that runs here is deliberately the second device's: a store
  // that closed over one accessory for the whole process would name the first one, and a case that
  // ran the first device's pump would pass against exactly that defect (CTRL-01, D-008).
  //
  // The first-poll seeds mutate only the context: neither accessory is registered while its seed
  // runs, so the persist port makes no call, and registration's own cache save is what carries the
  // seeded records to disk. Only the activation counted after registration asks Homebridge to store.
  test('asks Homebridge to store the accessory whose snapshot counted an activation, and no other', () => {
    // arrange
    const updateCalls: FakeAccessory[][] = [];
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], updateCalls), accessories, registry: powerRegistry() });
    const secondDevice = { ...geminiDevice(), deviceId: SECOND_DEVICE_ID, serialNumber: 'serial-2', name: 'Second System' };
    store.applyDiscovery(geminiDevice());
    store.applyDiscovery(secondDevice);
    registerDiscoveredDevices(context, [DEVICE_ID, SECOND_DEVICE_ID], store);
    const afterTheSeeds = updateCalls.length;

    // act
    store.applyDiscovery({ ...secondDevice, data: { backup_pump_running: true } });
    registerDiscoveredDevices(context, [DEVICE_ID, SECOND_DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        seeds: afterTheSeeds,
        sinceTheSeeds: updateCalls.slice(afterTheSeeds).map((call) => call.map((persisted) => persisted.UUID)),
      },
      { seeds: 0, sinceTheSeeds: [[SECOND_ACCESSORY_UUID]] },
    );
  });

  // The record members are deliberately absent from this comparison, which is the whole reason the
  // persist port exists: a counted activation changes none of these four, so without a second and
  // independent caller it would mutate the context and never reach disk (CTRL-01, D-010).
  test('compares the display name, the vendor name, the device record, and the service list, and nothing else', async () => {
    // arrange
    const source = await sourceOf('platform.ts');

    // act
    const compared = { previous: comparedKeys(source, 'previousState'), next: comparedKeys(source, 'nextState') };

    // assert
    assert.deepStrictEqual(compared, {
      previous: ['displayName', 'lastVendorName', 'device', 'services'],
      next: ['displayName', 'lastVendorName', 'device', 'services'],
    });
  });

  test('publishes every adapter but the one an administrator ignored', () => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, registry: powerRegistry(), ignoredFaults });

    // act
    const accessory = registeredDevice(context, accessories, store);

    // assert
    assert.deepStrictEqual(
      {
        ignored: accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost') === undefined,
        sibling: accessory.getServiceById(HAP.Service.ContactSensor, 'primary-pump-fault') !== undefined,
      },
      { ignored: true, sibling: true },
    );
  });

  test('removes an adapter added to ignoredFaults on a restart whose profile no longer resolves', () => {
    // arrange
    const api = fakeDiscoveryApi([], []);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const accessory = registeredDevice(discoveryContext({ api, accessories, registry: powerRegistry() }), accessories, store);
    const ignoredFaults: readonly NotificationServiceKind[] = ['mains-power-lost'];

    // act
    registerDiscoveredDevices(discoveryContext({ api, accessories, registry: unknownRegistry(), ignoredFaults }), [DEVICE_ID], store);

    // assert
    assert.deepStrictEqual(
      {
        ignored: accessory.getServiceById(HAP.Service.ContactSensor, 'mains-power-lost'),
        sibling: contactStateOf(accessory, 'primary-pump-fault'),
      },
      { ignored: undefined, sibling: CONTACT_DETECTED },
    );
  });

  test('confirms a device offline on the run of polls an administrator configured', () => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], []), accessories, registry: powerRegistry(), offlineConfirmationPollCount: 1 });
    const accessory = new HarnessPlatformAccessory('Sump System', ACCESSORY_UUID);
    accessory.context.lastVendorName = 'Sump System';
    accessory.context.device = { deviceId: DEVICE_ID, deviceTypeId: DEVICE_TYPE_ID };
    accessories.set(ACCESSORY_UUID, accessory as unknown as BasementGuardianPlatformAccessory);
    store.applyDiscovery({ ...geminiDevice(), connectivity: { connected: false, timestamp: 0 } });

    // act
    registerDiscoveredDevices(context, [DEVICE_ID], store);

    // assert
    assert.strictEqual(contactStateOf(accessory, 'basement-guardian-offline'), CONTACT_NOT_DETECTED);
  });
});

describe('removeDiscoveredDevice', () => {
  test('leaves no live listener behind, so a later patch reaches no accessory', (t) => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], [], []), accessories, basementGuardianAccessories, registry: powerRegistry() });
    registeredDevice(context, accessories, store);
    const updateSpy = t.mock.method(builtAccessory(basementGuardianAccessories), 'update');

    // act
    removeDiscoveredDevice(context, DEVICE_ID, store);
    store.applyDiscovery({ ...geminiDevice(), data: { ac_power: true } });
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: false }));

    // assert
    assert.strictEqual(updateSpy.mock.callCount(), 0);
  });

  test('subscribes again when the same deviceId is discovered after a removal', (t) => {
    // arrange
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const basementGuardianAccessories = new Map<string, BasementGuardianAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const context = discoveryContext({ api: fakeDiscoveryApi([], [], []), accessories, basementGuardianAccessories, registry: powerRegistry() });
    registeredDevice(context, accessories, store);
    removeDiscoveredDevice(context, DEVICE_ID, store);
    store.applyDiscovery(geminiDevice());
    registerDiscoveredDevices(context, [DEVICE_ID], store);
    const updateSpy = t.mock.method(builtAccessory(basementGuardianAccessories), 'update');

    // act
    store.applyReportedPatch(DEVICE_ID, reportedPatch({ ac_power: true }));

    // assert
    assert.deepStrictEqual(
      updateSpy.mock.calls.map((call) => call.arguments[1]),
      ['live'],
    );
  });

  test('unregisters a cached accessory, drops it from accessories, and removes its stored state', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const unregisterCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls, [], unregisterCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const uuid = ACCESSORY_UUID;
    const existing = new HarnessPlatformAccessory('Sump System', uuid);
    accessories.set(uuid, existing as unknown as BasementGuardianPlatformAccessory);
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    store.applyDiscovery(geminiDevice());

    // act
    removeDiscoveredDevice(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), DEVICE_ID, store);

    // assert
    assert.deepStrictEqual(
      {
        accessoryCount: accessories.size,
        unregisterCalls: unregisterCalls.map((call) => ({
          pluginIdentifier: call.pluginIdentifier,
          platformName: call.platformName,
          uuids: call.accessories.map((accessory) => accessory.UUID),
        })),
        storedSnapshot: store.snapshot(DEVICE_ID),
      },
      {
        accessoryCount: 0,
        unregisterCalls: [{ pluginIdentifier: PLUGIN_NAME, platformName: PLATFORM_NAME, uuids: [uuid] }],
        storedSnapshot: undefined,
      },
    );
  });

  test('does nothing for a deviceId with no cached accessory', () => {
    // arrange
    const registerCalls: FakeApiCall[] = [];
    const unregisterCalls: FakeApiCall[] = [];
    const api = fakeDiscoveryApi(registerCalls, [], unregisterCalls);
    const accessories = new Map<string, BasementGuardianPlatformAccessory>();
    const store = createDeviceStateStore({ clock: { now: () => 0 }, log: createSilentLog() });
    const expectedSnapshot = store.applyDiscovery(geminiDevice());

    // act
    removeDiscoveredDevice(discoveryContext({ api, accessories, registry: unknownRegistry(), log: createSilentLog() }), DEVICE_ID, store);

    // assert
    assert.deepStrictEqual(
      { accessoryCount: accessories.size, unregisterCalls, storedSnapshot: store.snapshot(DEVICE_ID) },
      { accessoryCount: 0, unregisterCalls: [], storedSnapshot: expectedSnapshot },
    );
  });
});

// The static gate on the platform's runtime context.
//
// `DiscoveryContext` was assembled inline in each of the three runtime callbacks, over the same nine
// fields written out three times. That is the drift `05-CONTEXT.md` D-12 exists to prevent: a field
// added to two of the three gives the monitoring path a different plugin from the discovery path,
// and no runtime layer can see it. Both spellings type-check, both lint, and every behavioural case
// passes, because each literal satisfies `DiscoveryContext` on its own. Reading the source text is
// the only layer that can name it. The Cucumber harness already builds its own context once
// (`features/support/world.ts`), so the platform was the outlier.
//
// The marker is the *shape* of the literal, not the name of a field in it. A count over
// `basementGuardianAccessories` would answer ten lines in this file, of which only the literals are
// literals -- it moves when an unrelated edit adds a property read, and it does not move when a
// re-inlined literal spells one field differently. The detector below matches the nine members in
// key position, in declaration order, with no brace between them, so a property read such as
// `context.basementGuardianAccessories.get(uuid)` cannot match it and a re-inlined literal must
// supply all nine members to satisfy the type and therefore does.
const DISCOVERY_CONTEXT_MEMBERS: readonly string[] = [
  'api',
  'accessories',
  'basementGuardianAccessories',
  'registry',
  'log',
  'ignoredFaults',
  'offlineConfirmationPollCount',
  'timers',
  'commands',
];

/** The one source file the gate reads, as a repository-relative path so a failure names something openable. */
const PLATFORM_SOURCE = 'src/platform.ts';

// The compiled case runs from `dist-test/test`, which puts the repository root two levels up. The
// floor below is what turns a wrong count of levels or a moved file into a named failure rather than
// an empty read reporting the same green as a full one.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// `src/platform.ts` is a little over twenty-eight thousand bytes. A read answering less than this
// read something other than the platform.
const PLATFORM_SOURCE_FLOOR = 20000;

// Two, not one: the `DiscoveryContext` interface body matches the detector as well, because its nine
// members are declared in the same order and in the same key position. So the expected count is the
// number of object literals plus one for the declaration they satisfy. Measured by running the
// detector over the unchanged file, which answered four -- the interface plus the three literals the
// three callbacks each built.
const EXPECTED_DISCOVERY_CONTEXT_SHAPES = 2;

// A comment line can hold a brace and would break the member chain below, and this file's own gate
// commentary names every one of the nine members. Whole-line comments are dropped before the
// detector runs, so the gate reads code.
function withoutCommentLines(source: string): string {
  return source
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/u.test(line))
    .join('\n');
}

function discoveryContextShapesIn(source: string): number {
  const detector = new RegExp(DISCOVERY_CONTEXT_MEMBERS.map((member) => `\\b${member}:`).join('[^{}]*'), 'gu');

  return (withoutCommentLines(source).match(detector) ?? []).length;
}

// A second literal, as a callback that re-inlined one would spell it. It is planted into a copy of
// the file text held here rather than into the file, so the control cannot make the gate report
// itself.
const PLANTED_SECOND_LITERAL = `
      onSomethingElse: (): void => {
        somethingElse({
          api: this.api,
          accessories: this.accessories,
          basementGuardianAccessories: this.basementGuardianAccessories,
          registry: this.registry,
          log: this.log,
          ignoredFaults: validated.config.ignoredFaults,
          offlineConfirmationPollCount: validated.config.offlineConfirmationPollCount,
          timers: systemTimers,
          commands: runtime.commands,
        });
      },
`;

// The control that separates this gate from a count over a field name: one more property read of a
// context member, spelled the way the platform's own reads are. A name count moves on this; a shape
// count must not.
const PLANTED_PROPERTY_READ = `
function readsOneMore(context: DiscoveryContext): unknown {
  return context.basementGuardianAccessories.get(context.registry.toString());
}
`;

describe('the platform builds its runtime context once', () => {
  test('holds exactly one DiscoveryContext-shaped literal beside the declaration it satisfies (WR-07, D-12)', () => {
    // arrange
    const source = readFileSync(join(REPOSITORY_ROOT, PLATFORM_SOURCE), 'utf8');

    // act
    const shapes = discoveryContextShapesIn(source);

    // assert
    assert.ok(
      source.length >= PLATFORM_SOURCE_FLOOR,
      `the gate read ${String(source.length)} bytes of ${PLATFORM_SOURCE}, fewer than the ${String(PLATFORM_SOURCE_FLOOR)} it holds`,
    );
    assert.strictEqual(
      shapes,
      EXPECTED_DISCOVERY_CONTEXT_SHAPES,
      `${PLATFORM_SOURCE} holds ${String(shapes)} DiscoveryContext-shaped literals where ` +
        `${String(EXPECTED_DISCOVERY_CONTEXT_SHAPES)} are expected: the interface declaration and one literal. ` +
        'Build the context once and call it from each of the three callbacks.',
    );
  });

  test('reports a planted second literal and stays still for a planted property read (WR-07)', () => {
    // arrange
    const source = readFileSync(join(REPOSITORY_ROOT, PLATFORM_SOURCE), 'utf8');
    const found = discoveryContextShapesIn(source);

    // act & assert
    assert.deepStrictEqual(
      {
        withASecondLiteral: discoveryContextShapesIn(source + PLANTED_SECOND_LITERAL),
        withOneMorePropertyRead: discoveryContextShapesIn(source + PLANTED_PROPERTY_READ),
      },
      { withASecondLiteral: found + 1, withOneMorePropertyRead: found },
    );
  });
});
