/**
 * @fileoverview The one hand-built HAP namespace stand-in.
 *
 * This is a stand-in rather than the real `@homebridge/hap-nodejs`, matching every other external
 * boundary in this codebase. It answers the members the plugin reads, with the real argument
 * orders, the real duplicate refusals, and the real format defaults, and nothing more; it is not a
 * reimplementation of HAP-NodeJS. There is exactly one of these in the repository, because two
 * stand-ins of one boundary drift apart silently and the drift surfaces as a green test over broken
 * production behavior.
 *
 * The argument orders matter more than they look. A plugin declares its own HomeKit types by
 * subclassing the injected namespace, so `Service` and `Characteristic` are constructible base
 * classes here rather than identifier constants, and `addService` takes a display name where the
 * real one does. A stand-in that recorded a display name as a subtype would let every safety
 * assertion built on it pass while proving nothing.
 *
 * `@homebridge/hap-nodejs` is never imported: it is a transitive dependency rather than a declared
 * one, and the project keeps HAP-NodeJS out of direct imports.
 */

import { createHash } from 'node:crypto';

// Every type Apple assigns lives in one namespace, so a standard identifier is its own short prefix
// completed by this suffix.
const APPLE_BASE_UUID = '-0000-1000-8000-0026BB765291';

// The four string characteristics the real HAP answers a named default for, keyed by identifier as
// the real switch keys on. Every other string characteristic starts at the empty string. The
// definitions below carry the same identifiers, and a scenario reads all four back, so the two lists
// cannot drift apart unnoticed.
const NAMED_STRING_DEFAULTS: ReadonlyMap<string, string> = new Map([
  [`00000020${APPLE_BASE_UUID}`, 'Default-Manufacturer'],
  [`00000021${APPLE_BASE_UUID}`, 'Default-Model'],
  [`00000030${APPLE_BASE_UUID}`, 'Default-SerialNumber'],
  [`00000052${APPLE_BASE_UUID}`, '0.0.0'],
]);

/** The characteristic formats this stand-in answers, carrying the values the real enum carries. */
export interface FakeFormats {
  readonly BOOL: string;
  readonly UINT8: string;
  readonly STRING: string;
  readonly FLOAT: string;
}

/** The characteristic permissions this stand-in answers, carrying the values the real enum carries. */
export interface FakePerms {
  readonly PAIRED_READ: string;
  readonly PAIRED_WRITE: string;
  readonly NOTIFY: string;
}

/** The characteristic units this stand-in answers, carrying the values the real enum carries. */
export interface FakeUnits {
  readonly PERCENTAGE: string;
}

/**
 * The HAP status codes a write path answers, carrying the values the real enum carries.
 *
 * Only the statuses this plugin can answer are declared. `test/accessories/hapWriteFidelity.test.ts`
 * reads each one off both namespaces and asserts the pairs are equal, so a drifted number fails
 * there rather than in a scenario that would still have looked green.
 */
export interface FakeHapStatus {
  readonly SUCCESS: number;
  readonly SERVICE_COMMUNICATION_FAILURE: number;
  readonly RESOURCE_BUSY: number;
  readonly OPERATION_TIMED_OUT: number;
  readonly NOT_ALLOWED_IN_CURRENT_STATE: number;
}

/** The deterministic accessory-identifier derivation a scenario reads back. */
export interface FakeUuid {
  generate(data: string): string;
}

const FORMATS: FakeFormats = { BOOL: 'bool', UINT8: 'uint8', STRING: 'string', FLOAT: 'float' };
const PERMS: FakePerms = { PAIRED_READ: 'pr', PAIRED_WRITE: 'pw', NOTIFY: 'ev' };
const UNITS: FakeUnits = { PERCENTAGE: 'percentage' };
const HAP_STATUS: FakeHapStatus = {
  SUCCESS: 0,
  SERVICE_COMMUNICATION_FAILURE: -70402,
  RESOURCE_BUSY: -70403,
  OPERATION_TIMED_OUT: -70408,
  NOT_ALLOWED_IN_CURRENT_STATE: -70412,
};

/**
 * The error a write handler throws to refuse a write with a named status.
 *
 * The real class carries the status on `hapStatus` and nothing else, which is the member
 * `handleSetRequest` reads; a handler throwing anything else is converted rather than read.
 */
/**
 * One refused write, carrying the status the handler named.
 *
 * `hapStatus` is the one member `handleSetRequest` reads: a handler throwing anything else is
 * converted rather than read. The class implementing it is module-local, so every caller
 * constructs one through `hap.HapStatusError` as the plugin does through the injected namespace,
 * and no test reaches a HAP type by a route production does not have.
 */
export interface FakeHapStatusError extends Error {
  readonly hapStatus: number;
}

class StandInHapStatusError extends Error implements FakeHapStatusError {
  constructor(readonly hapStatus: number) {
    super(`status code: ${String(hapStatus)}`);
    this.name = 'HapStatusError';
  }
}

const UUID: FakeUuid = {
  // Deterministic (same input -> same output, different input -> different output), never HAP's
  // real v5 derivation: the harness needs a stable, injectable stand-in, not the production
  // algorithm.
  generate(data: string): string {
    return createHash('sha1').update(data).digest('hex');
  },
};

/** The characteristic properties this stand-in carries, named as the real `CharacteristicProps` names them. */
export interface FakeCharacteristicProps {
  format: string;
  perms: readonly string[];
  unit?: string;
  minValue?: number;
  maxValue?: number;
  minStep?: number;
  maxLen?: number;
  validValues?: readonly number[];
}

const NAMED_STRING: FakeCharacteristicProps = { format: FORMATS.STRING, perms: [PERMS.PAIRED_READ], maxLen: 64 };
const PLAIN_STRING: FakeCharacteristicProps = { format: FORMATS.STRING, perms: [PERMS.PAIRED_READ] };
// The one paired-write characteristic this plugin publishes. A controller writes the name a user
// typed, and the real HAP names no default for this identifier, so it constructs at the empty
// string -- which is the sentinel the seeding rule reads to tell an unnamed service from a renamed
// one. A stand-in answering anything else would satisfy the no-clobber case vacuously.
const WRITABLE_STRING: FakeCharacteristicProps = { format: FORMATS.STRING, perms: [PERMS.NOTIFY, PERMS.PAIRED_READ, PERMS.PAIRED_WRITE] };
const WRITE_ONLY_BOOL: FakeCharacteristicProps = { format: FORMATS.BOOL, perms: [PERMS.PAIRED_WRITE] };
// The one characteristic a controller both reads and writes on this plugin, and the only route a
// HomeKit press reaches the vendor through.
const WRITABLE_BOOL: FakeCharacteristicProps = { format: FORMATS.BOOL, perms: [PERMS.NOTIFY, PERMS.PAIRED_READ, PERMS.PAIRED_WRITE] };
const READ_ONLY_BOOL: FakeCharacteristicProps = { format: FORMATS.BOOL, perms: [PERMS.NOTIFY, PERMS.PAIRED_READ] };
const BINARY_STATE: FakeCharacteristicProps = {
  format: FORMATS.UINT8,
  perms: [PERMS.NOTIFY, PERMS.PAIRED_READ],
  minValue: 0,
  maxValue: 1,
  minStep: 1,
  validValues: [0, 1],
};
const TERNARY_STATE: FakeCharacteristicProps = { ...BINARY_STATE, maxValue: 2, validValues: [0, 1, 2] };
const UINT8_PERCENTAGE: FakeCharacteristicProps = {
  format: FORMATS.UINT8,
  perms: [PERMS.NOTIFY, PERMS.PAIRED_READ],
  unit: UNITS.PERCENTAGE,
  minValue: 0,
  maxValue: 100,
  minStep: 1,
};
const FLOAT_PERCENTAGE: FakeCharacteristicProps = { ...UINT8_PERCENTAGE, format: FORMATS.FLOAT };

/** One characteristic on a stand-in service. */
export interface FakeHapCharacteristic {
  readonly displayName: string;
  readonly UUID: string;
  readonly props: FakeCharacteristicProps;
  value: unknown;
  /**
   * Whether anything ever wrote this value, as against HAP having constructed it.
   *
   * The real HAP carries no such member, and no production code reads it. It exists because the
   * construction default of both alarm characteristics is `0`, which is also the quiet state, so a
   * scenario asserting a quiet sensor would otherwise be satisfied by a service the plugin created
   * and never wrote to -- and would pass against an implementation that publishes nothing at all.
   */
  pushed: boolean;
  /**
   * The status the last write left on this characteristic, or `0` when there is none.
   *
   * The real HAP carries this member too, and it is the whole reason the write path is modelled
   * here rather than assumed: a rejected write stores the thrown status and every later read
   * answers it until something pushes a value, which is a service reading as unavailable long
   * after the press that refused it. Any push clears it, whatever value it carries.
   */
  statusCode: number;
  getDefaultValue(): unknown;
  /** Registers the one write handler this characteristic answers through. */
  onSet(handler: FakeSetHandler): FakeHapCharacteristic;
  /**
   * Answers a controller write, as the real HAP answers one.
   *
   * An accepted write clears the stored status and stores the value; a rejected one leaves the
   * value exactly where it was and stores the status the handler named, then rejects with that
   * status as a bare number.
   */
  handleSetRequest(value: unknown): Promise<void>;
  /** Answers a controller read: the stored status when there is one, and the stored value otherwise. */
  handleGetRequest(): unknown;
}

/** The one write handler a characteristic answers through. */
export type FakeSetHandler = (value: unknown) => void | Promise<void>;

/** A stand-in characteristic type: constructed with no arguments, and carrying the type's own identifier. */
export interface FakeCharacteristicClass {
  readonly UUID: string;
  new (): FakeHapCharacteristic;
}

/** The leak states `LeakDetected` reports. */
export interface FakeLeakDetectedValues {
  readonly LEAK_NOT_DETECTED: number;
  readonly LEAK_DETECTED: number;
}

/** The contact states `ContactSensorState` reports. */
export interface FakeContactSensorStateValues {
  readonly CONTACT_DETECTED: number;
  readonly CONTACT_NOT_DETECTED: number;
}

/** The fault states `StatusFault` reports. */
export interface FakeStatusFaultValues {
  readonly NO_FAULT: number;
  readonly GENERAL_FAULT: number;
}

/** The battery states `StatusLowBattery` reports. */
export interface FakeStatusLowBatteryValues {
  readonly BATTERY_LEVEL_NORMAL: number;
  readonly BATTERY_LEVEL_LOW: number;
}

/** The charging states `ChargingState` reports. */
export interface FakeChargingStateValues {
  readonly NOT_CHARGING: number;
  readonly CHARGING: number;
  readonly NOT_CHARGEABLE: number;
}

/** The `Characteristic` member of the stand-in namespace: a constructible base carrying the standard definitions. */
export interface FakeCharacteristicNamespace {
  new (displayName: string, UUID: string, props: FakeCharacteristicProps): FakeHapCharacteristic;
  readonly Manufacturer: FakeCharacteristicClass;
  readonly Model: FakeCharacteristicClass;
  readonly SerialNumber: FakeCharacteristicClass;
  readonly FirmwareRevision: FakeCharacteristicClass;
  readonly Name: FakeCharacteristicClass;
  readonly ConfiguredName: FakeCharacteristicClass;
  readonly Identify: FakeCharacteristicClass;
  readonly LeakDetected: FakeCharacteristicClass & FakeLeakDetectedValues;
  readonly ContactSensorState: FakeCharacteristicClass & FakeContactSensorStateValues;
  readonly WaterLevel: FakeCharacteristicClass;
  readonly StatusActive: FakeCharacteristicClass;
  readonly StatusFault: FakeCharacteristicClass & FakeStatusFaultValues;
  readonly StatusLowBattery: FakeCharacteristicClass & FakeStatusLowBatteryValues;
  readonly BatteryLevel: FakeCharacteristicClass;
  readonly ChargingState: FakeCharacteristicClass & FakeChargingStateValues;
  readonly On: FakeCharacteristicClass;
}

// A handler may throw a status error, a bare status number, or anything else. Only the first two
// name a status; everything else is a defect in the handler, which the real HAP reports as a
// communication failure and warns about.
function thrownStatusOf(error: unknown): number {
  if (typeof error === 'number') {
    return error;
  }

  return error instanceof StandInHapStatusError ? error.hapStatus : HAP_STATUS.SERVICE_COMMUNICATION_FAILURE;
}

class StandInCharacteristic implements FakeHapCharacteristic {
  value: unknown;

  pushed = false;

  statusCode = HAP_STATUS.SUCCESS;

  private setHandler: FakeSetHandler | undefined = undefined;

  constructor(
    readonly displayName: string,
    readonly UUID: string,
    readonly props: FakeCharacteristicProps,
  ) {
    this.value = this.getDefaultValue();
  }

  onSet(handler: FakeSetHandler): FakeHapCharacteristic {
    this.setHandler = handler;

    return this;
  }

  // The real order matters and is reproduced exactly: the handler runs first, the status is
  // cleared and the value stored only on the success path, and a rejection leaves the value
  // untouched. Nothing snaps a refused toggle back, because HAP never moved it.
  //
  // `pushed` deliberately stays where it was. It marks a value the plugin published, and a
  // controller write is not that; a scenario reading a control back is reading a characteristic the
  // plugin already published to.
  async handleSetRequest(value: unknown): Promise<void> {
    if (this.setHandler === undefined) {
      this.statusCode = HAP_STATUS.SUCCESS;
      this.value = value;

      return;
    }

    try {
      await this.setHandler(value);
    } catch (error: unknown) {
      this.statusCode = thrownStatusOf(error);

      // The real HAP rethrows the status as a bare number rather than the error it caught, so a
      // caller reading `error.hapStatus` off it would be reading a member that is not there.
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- reproducing the real HAP write path, which rejects with a bare status number
      throw this.statusCode;
    }

    this.statusCode = HAP_STATUS.SUCCESS;
    this.value = value;
  }

  // A stored status answers before the value is ever read, which is what makes a refused write
  // outlive the press that caused it.
  handleGetRequest(): unknown {
    if (this.statusCode !== HAP_STATUS.SUCCESS) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- reproducing the real HAP read path, which throws a bare status number
      throw this.statusCode;
    }

    return this.value;
  }

  // The real HAP answers `false` for a bool; for a string, one of four named defaults by identifier
  // and the empty string otherwise; and for a numeric format the first declared valid value, then
  // the declared minimum, then zero. The numeric order matters: a characteristic whose domain
  // excludes zero would otherwise start at a code its own `validValues` forbids here while the real
  // HAP started it at a legal one. The real numeric fallback also takes the declared minimum only
  // when it is finite; every numeric characteristic defined here declares a finite one, so that
  // guard has nothing to discriminate and is not reproduced.
  //
  // Those defaults are this plugin's good-news values, so a service published before the first
  // valid decode would read as a healthy sump pit. That is why the accessory adds no service until
  // its row has a value to vouch for, and why the scenario "A field that never validates publishes
  // no service at all" asserts an absent service rather than a quiet one (D-014).
  getDefaultValue(): unknown {
    if (this.props.format === FORMATS.BOOL) {
      return false;
    }

    if (this.props.format === FORMATS.STRING) {
      return NAMED_STRING_DEFAULTS.get(this.UUID) ?? '';
    }

    return this.props.validValues?.[0] ?? this.props.minValue ?? 0;
  }
}

// One definition per standard characteristic, so fourteen near-identical class bodies never exist.
function defineCharacteristic(displayName: string, uuid: string, props: FakeCharacteristicProps): FakeCharacteristicClass {
  return class extends StandInCharacteristic {
    static readonly UUID = uuid;

    constructor() {
      super(displayName, uuid, props);
    }
  };
}

const CHARACTERISTIC: FakeCharacteristicNamespace = Object.assign(StandInCharacteristic, {
  Manufacturer: defineCharacteristic('Manufacturer', `00000020${APPLE_BASE_UUID}`, NAMED_STRING),
  Model: defineCharacteristic('Model', `00000021${APPLE_BASE_UUID}`, NAMED_STRING),
  SerialNumber: defineCharacteristic('Serial Number', `00000030${APPLE_BASE_UUID}`, NAMED_STRING),
  FirmwareRevision: defineCharacteristic('Firmware Revision', `00000052${APPLE_BASE_UUID}`, PLAIN_STRING),
  Name: defineCharacteristic('Name', `00000023${APPLE_BASE_UUID}`, NAMED_STRING),
  ConfiguredName: defineCharacteristic('Configured Name', `000000E3${APPLE_BASE_UUID}`, WRITABLE_STRING),
  Identify: defineCharacteristic('Identify', `00000014${APPLE_BASE_UUID}`, WRITE_ONLY_BOOL),
  LeakDetected: Object.assign(defineCharacteristic('Leak Detected', `00000070${APPLE_BASE_UUID}`, BINARY_STATE), {
    LEAK_NOT_DETECTED: 0,
    LEAK_DETECTED: 1,
  }),
  ContactSensorState: Object.assign(defineCharacteristic('Contact Sensor State', `0000006A${APPLE_BASE_UUID}`, BINARY_STATE), {
    CONTACT_DETECTED: 0,
    CONTACT_NOT_DETECTED: 1,
  }),
  WaterLevel: defineCharacteristic('Water Level', `000000B5${APPLE_BASE_UUID}`, FLOAT_PERCENTAGE),
  StatusActive: defineCharacteristic('Status Active', `00000075${APPLE_BASE_UUID}`, READ_ONLY_BOOL),
  StatusFault: Object.assign(defineCharacteristic('Status Fault', `00000077${APPLE_BASE_UUID}`, BINARY_STATE), {
    NO_FAULT: 0,
    GENERAL_FAULT: 1,
  }),
  StatusLowBattery: Object.assign(defineCharacteristic('Status Low Battery', `00000079${APPLE_BASE_UUID}`, BINARY_STATE), {
    BATTERY_LEVEL_NORMAL: 0,
    BATTERY_LEVEL_LOW: 1,
  }),
  BatteryLevel: defineCharacteristic('Battery Level', `00000068${APPLE_BASE_UUID}`, UINT8_PERCENTAGE),
  ChargingState: Object.assign(defineCharacteristic('Charging State', `0000008F${APPLE_BASE_UUID}`, TERNARY_STATE), {
    NOT_CHARGING: 0,
    CHARGING: 1,
    NOT_CHARGEABLE: 2,
  }),
  On: defineCharacteristic('On', `00000025${APPLE_BASE_UUID}`, WRITABLE_BOOL),
});

/** One service on a stand-in accessory. */
export interface FakeHapService {
  readonly displayName: string;
  readonly UUID: string;
  readonly subtype: string | undefined;
  readonly characteristics: readonly FakeHapCharacteristic[];
  readonly optionalCharacteristics: readonly FakeHapCharacteristic[];
  addCharacteristic(characteristicClass: FakeCharacteristicClass): FakeHapCharacteristic;
  getCharacteristic(characteristicClass: FakeCharacteristicClass): FakeHapCharacteristic | undefined;
  setCharacteristic(characteristicClass: FakeCharacteristicClass, value: unknown): FakeHapService;
  updateCharacteristic(characteristicClass: FakeCharacteristicClass, value: unknown): FakeHapService;
  testCharacteristic(characteristicClass: FakeCharacteristicClass): boolean;
  addOptionalCharacteristic(characteristicClass: FakeCharacteristicClass): void;
}

/** A stand-in service type: constructed with a display name and a subtype, and carrying the type's own identifier. */
export interface FakeServiceClass {
  readonly UUID: string;
  new (displayName?: string, subtype?: string): FakeHapService;
}

/** The `Service` member of the stand-in namespace: a constructible base carrying the standard definitions. */
export interface FakeServiceNamespace {
  new (displayName: string | undefined, UUID: string, subtype?: string): FakeHapService;
  readonly AccessoryInformation: FakeServiceClass;
  readonly LeakSensor: FakeServiceClass;
  readonly ContactSensor: FakeServiceClass;
  readonly Battery: FakeServiceClass;
  readonly Switch: FakeServiceClass;
}

class StandInService implements FakeHapService {
  readonly displayName: string;

  readonly UUID: string;

  readonly subtype: string | undefined;

  readonly characteristics: FakeHapCharacteristic[] = [];

  readonly optionalCharacteristics: FakeHapCharacteristic[] = [];

  constructor(displayName: string | undefined, UUID: string, subtype?: string) {
    this.displayName = displayName ?? '';
    this.UUID = UUID;
    this.subtype = subtype;

    // The real `Service` constructor creates `Name` from the display name it was given, and only
    // when it was given one, so a service added without a display name carries no `Name`.
    if (this.displayName !== '') {
      this.setCharacteristic(CHARACTERISTIC.Name, this.displayName);
    }
  }

  addCharacteristic(characteristicClass: FakeCharacteristicClass): FakeHapCharacteristic {
    const characteristic = new characteristicClass();

    this.characteristics.push(characteristic);

    return characteristic;
  }

  // The real lookup matches by `instanceof` or by the type's own identifier, and an accessory
  // restored from the Homebridge cache carries plain `Characteristic` objects, so the identifier is
  // the match that always holds.
  getCharacteristic(characteristicClass: FakeCharacteristicClass): FakeHapCharacteristic | undefined {
    return this.characteristics.find((characteristic) => characteristic.UUID === characteristicClass.UUID);
  }

  // The two writers differ only in how the real HAP notifies; both store the value and both add the
  // characteristic when the service does not carry it yet.
  setCharacteristic(characteristicClass: FakeCharacteristicClass, value: unknown): FakeHapService {
    return this.updateCharacteristic(characteristicClass, value);
  }

  // The real `updateValue` clears the stored status unconditionally before it stores, so any push
  // -- even one carrying the value the characteristic already holds -- makes a refused
  // characteristic readable again. The clearing is per characteristic: pushing `StatusActive`
  // leaves a status stored on `On` exactly where it was.
  updateCharacteristic(characteristicClass: FakeCharacteristicClass, value: unknown): FakeHapService {
    const characteristic = this.getCharacteristic(characteristicClass) ?? this.addCharacteristic(characteristicClass);

    characteristic.statusCode = HAP_STATUS.SUCCESS;
    characteristic.value = value;
    characteristic.pushed = true;

    return this;
  }

  testCharacteristic(characteristicClass: FakeCharacteristicClass): boolean {
    return this.getCharacteristic(characteristicClass) !== undefined;
  }

  // The real call is not idempotent: two calls append two entries. Production guards against the
  // second call, so the stand-in has to be able to record one.
  addOptionalCharacteristic(characteristicClass: FakeCharacteristicClass): void {
    this.optionalCharacteristics.push(new characteristicClass());
  }
}

// One definition per standard service, each adding the characteristics the real definition requires
// and declaring the ones it declares optional.
//
// The optional list is not decoration. `publishValue` declares a characteristic before pushing it
// only when the service neither carries nor declares it, and a stand-in that declared none would
// send every push through the declaring branch while production took the other one -- so the guard
// would be exercised on a path it never runs on. `Battery` genuinely declares neither status
// characteristic, which is what keeps the declaring branch reachable here as it is in production.
interface ServiceDefinition {
  uuid: string;
  required: readonly FakeCharacteristicClass[];
  optional?: readonly FakeCharacteristicClass[];
}

function defineService({ uuid, required, optional = [] }: ServiceDefinition): FakeServiceClass {
  return class extends StandInService {
    static readonly UUID = uuid;

    constructor(displayName?: string, subtype?: string) {
      super(displayName, uuid, subtype);

      for (const characteristicClass of required) {
        this.addCharacteristic(characteristicClass);
      }

      for (const characteristicClass of optional) {
        this.addOptionalCharacteristic(characteristicClass);
      }
    }
  };
}

// The optional lists carry only the members this stand-in declares; the real definitions also name
// `StatusTampered`, which this plugin publishes on nothing.
const SENSOR_OPTIONAL: readonly FakeCharacteristicClass[] = [CHARACTERISTIC.Name, CHARACTERISTIC.StatusActive, CHARACTERISTIC.StatusFault];

const SERVICE: FakeServiceNamespace = Object.assign(StandInService, {
  AccessoryInformation: defineService({
    uuid: `0000003E${APPLE_BASE_UUID}`,
    required: [CHARACTERISTIC.Manufacturer, CHARACTERISTIC.Model, CHARACTERISTIC.SerialNumber, CHARACTERISTIC.FirmwareRevision, CHARACTERISTIC.Identify],
  }),
  LeakSensor: defineService({
    uuid: `00000083${APPLE_BASE_UUID}`,
    required: [CHARACTERISTIC.LeakDetected],
    optional: [...SENSOR_OPTIONAL, CHARACTERISTIC.StatusLowBattery],
  }),
  ContactSensor: defineService({
    uuid: `00000080${APPLE_BASE_UUID}`,
    required: [CHARACTERISTIC.ContactSensorState],
    optional: [...SENSOR_OPTIONAL, CHARACTERISTIC.StatusLowBattery],
  }),
  // The real `Battery` declares neither `StatusActive` nor `StatusFault`, so the accessory's push
  // of `StatusActive` onto it declares the characteristic first, in production as here.
  Battery: defineService({
    uuid: `00000096${APPLE_BASE_UUID}`,
    required: [CHARACTERISTIC.StatusLowBattery],
    optional: [CHARACTERISTIC.BatteryLevel, CHARACTERISTIC.ChargingState, CHARACTERISTIC.Name],
  }),
  // The real `Switch` requires `On` and declares `Name` optional, and nothing else. `StatusActive`
  // is in neither list, so the plugin's push of it goes through the declaring branch here as it
  // does in production.
  Switch: defineService({
    uuid: `00000049${APPLE_BASE_UUID}`,
    required: [CHARACTERISTIC.On],
    optional: [CHARACTERISTIC.Name],
  }),
});

/** The hand-built HAP namespace, in the shape a plugin consumes `api.hap` in. */
export interface FakeHap {
  readonly Service: FakeServiceNamespace;
  readonly Characteristic: FakeCharacteristicNamespace;
  readonly Formats: FakeFormats;
  readonly Perms: FakePerms;
  readonly Units: FakeUnits;
  readonly uuid: FakeUuid;
  readonly HAPStatus: FakeHapStatus;
  readonly HapStatusError: new (hapStatus: number) => FakeHapStatusError;
}

const HAP: FakeHap = {
  Service: SERVICE,
  Characteristic: CHARACTERISTIC,
  Formats: FORMATS,
  Perms: PERMS,
  Units: UNITS,
  uuid: UUID,
  HAPStatus: HAP_STATUS,
  HapStatusError: StandInHapStatusError,
};

/**
 * Answers the HAP namespace stand-in.
 *
 * Every caller gets the same namespace, so a type declared against one caller's `Service` is the
 * same type another caller looks a service up by. The namespace holds no per-scenario state: a
 * service and its characteristics live on the accessory that added them.
 */
export function createFakeHap(): FakeHap {
  return HAP;
}
