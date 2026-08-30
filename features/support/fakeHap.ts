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

/** The deterministic accessory-identifier derivation a scenario reads back. */
export interface FakeUuid {
  generate(data: string): string;
}

const FORMATS: FakeFormats = { BOOL: 'bool', UINT8: 'uint8', STRING: 'string', FLOAT: 'float' };
const PERMS: FakePerms = { PAIRED_READ: 'pr', PAIRED_WRITE: 'pw', NOTIFY: 'ev' };
const UNITS: FakeUnits = { PERCENTAGE: 'percentage' };

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
const WRITE_ONLY_BOOL: FakeCharacteristicProps = { format: FORMATS.BOOL, perms: [PERMS.PAIRED_WRITE] };
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
  getDefaultValue(): unknown;
}

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
  readonly Identify: FakeCharacteristicClass;
  readonly LeakDetected: FakeCharacteristicClass & FakeLeakDetectedValues;
  readonly ContactSensorState: FakeCharacteristicClass & FakeContactSensorStateValues;
  readonly WaterLevel: FakeCharacteristicClass;
  readonly StatusActive: FakeCharacteristicClass;
  readonly StatusFault: FakeCharacteristicClass & FakeStatusFaultValues;
  readonly StatusLowBattery: FakeCharacteristicClass & FakeStatusLowBatteryValues;
  readonly BatteryLevel: FakeCharacteristicClass;
  readonly ChargingState: FakeCharacteristicClass & FakeChargingStateValues;
}

class StandInCharacteristic implements FakeHapCharacteristic {
  value: unknown;

  constructor(
    readonly displayName: string,
    readonly UUID: string,
    readonly props: FakeCharacteristicProps,
  ) {
    this.value = this.getDefaultValue();
  }

  // The real HAP answers `false` for a bool, the empty string for a string, and for a numeric
  // format the first declared valid value, then the declared minimum, then zero. The numeric order
  // matters: a characteristic whose domain excludes zero would otherwise start at a code its own
  // `validValues` forbids here while the real HAP started it at a legal one. Those defaults are
  // this plugin's good-news values, so a service published before the first valid decode reads as
  // a healthy sump pit; reproducing them exactly is what lets a scenario prove the accessory never
  // leaves a service sitting there (D-014).
  getDefaultValue(): unknown {
    if (this.props.format === FORMATS.BOOL) {
      return false;
    }

    if (this.props.format === FORMATS.STRING) {
      return '';
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

  updateCharacteristic(characteristicClass: FakeCharacteristicClass, value: unknown): FakeHapService {
    const characteristic = this.getCharacteristic(characteristicClass) ?? this.addCharacteristic(characteristicClass);

    characteristic.value = value;

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

// One definition per standard service, each adding the characteristics the real definition requires.
function defineService(uuid: string, required: readonly FakeCharacteristicClass[]): FakeServiceClass {
  return class extends StandInService {
    static readonly UUID = uuid;

    constructor(displayName?: string, subtype?: string) {
      super(displayName, uuid, subtype);

      for (const characteristicClass of required) {
        this.addCharacteristic(characteristicClass);
      }
    }
  };
}

const SERVICE: FakeServiceNamespace = Object.assign(StandInService, {
  AccessoryInformation: defineService(`0000003E${APPLE_BASE_UUID}`, [
    CHARACTERISTIC.Manufacturer,
    CHARACTERISTIC.Model,
    CHARACTERISTIC.SerialNumber,
    CHARACTERISTIC.FirmwareRevision,
    CHARACTERISTIC.Identify,
  ]),
  LeakSensor: defineService(`00000083${APPLE_BASE_UUID}`, [CHARACTERISTIC.LeakDetected]),
  ContactSensor: defineService(`00000080${APPLE_BASE_UUID}`, [CHARACTERISTIC.ContactSensorState]),
  Battery: defineService(`00000096${APPLE_BASE_UUID}`, [CHARACTERISTIC.StatusLowBattery]),
});

/** The hand-built HAP namespace, in the shape a plugin consumes `api.hap` in. */
export interface FakeHap {
  readonly Service: FakeServiceNamespace;
  readonly Characteristic: FakeCharacteristicNamespace;
  readonly Formats: FakeFormats;
  readonly Perms: FakePerms;
  readonly Units: FakeUnits;
  readonly uuid: FakeUuid;
}

const HAP: FakeHap = { Service: SERVICE, Characteristic: CHARACTERISTIC, Formats: FORMATS, Perms: PERMS, Units: UNITS, uuid: UUID };

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
