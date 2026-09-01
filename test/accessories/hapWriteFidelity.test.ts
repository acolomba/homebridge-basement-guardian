/**
 * @fileoverview Holds the hand-built HAP stand-in's write path against the HAP the plugin runs on.
 *
 * This is the one file in the repository permitted to import `@homebridge/hap-nodejs` directly
 * (D-17). The rule it excepts is a **runtime** rule: no module under `src/` reaches HAP-NodeJS,
 * every HomeKit type comes from the injected `api.hap` namespace, and nothing here relaxes that.
 *
 * The exception exists because without it every write semantic this plugin relies on is one the
 * plugin itself authored. `features/support/fakeHap.ts` has the only `Switch`, `On`, `onSet` and
 * status code the scenarios ever see, so a green suite over that stand-in would prove that the
 * stand-in agrees with itself and nothing more. The cases below run the same write script against
 * the real pinned package and against the stand-in and assert the two records are deep-equal, so a
 * stand-in that clears a value on a rejected write, or answers a read after one, fails here rather
 * than in a scenario that would still have looked green (SAFE-08).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

import { Characteristic, Formats, HAPStatus, HapStatusError, Perms, Service } from '@homebridge/hap-nodejs';

import { createFakeHap } from '../../features/support/fakeHap.js';

import type { FakeHapService } from '../../features/support/fakeHap.js';
import type { CharacteristicProps } from '@homebridge/hap-nodejs';

const HAP_SPECIFIER = '@homebridge/hap-nodejs';
const HOMEBRIDGE_SPECIFIER = 'homebridge';
const SWITCH_NAME = 'System Self-Test';
const SWITCH_SUBTYPE = 'system-self-test';

// One past what a `uint8` can carry. A pump that runs a few times a day reaches this in well under a
// year, so the difference between the two formats below is a false normal reachable in weeks.
const COUNT_PAST_UINT8 = 256;

// Two identifiers used by this file alone, for characteristics that exist only inside the clamping
// case; neither is a published identity and neither appears in any accessory.
const NARROW_COUNT_UUID = '951ad4d2-c092-4ec6-ab9f-f024662219e5';
const WIDE_COUNT_UUID = 'f0e7799e-4687-4bb7-b594-6fd52a084625';

// How far up from a resolved entry point the manifest that owns it can sit. `homebridge` does not
// export its own `package.json`, so it is read from disk instead, and the walk is bounded rather
// than open-ended.
const MANIFEST_SEARCH_DEPTH = 4;

const FAKE = createFakeHap();

const require_ = createRequire(import.meta.url);

/** One write or read, as both implementations report it. */
interface WriteRecord {
  rejectedWith: unknown;
  value: unknown;
  statusCode: number;
}

/** The write surface both implementations answer, so one script drives each in turn. */
interface WriteSubject {
  /** Registers the one write handler this characteristic answers through. */
  onSet(handler: () => Promise<void>): void;
  /** Drives a controller write and answers what it left behind. */
  set(value: boolean): Promise<WriteRecord>;
  /** Drives a controller read and answers what it left behind. */
  get(): Promise<WriteRecord>;
  /** Pushes a value onto `On`, as the plugin's own publish does. */
  pushOn(value: boolean): void;
  /** Pushes a value onto `StatusActive`, which is a different characteristic on the same service. */
  pushStatusActive(value: boolean): void;
  /** Answers the stored value and status without driving anything. */
  read(): WriteRecord;
}

interface InstalledManifest {
  name?: string;
  version?: string;
  dependencies?: Readonly<Record<string, string>>;
}

function readManifest(path: string): InstalledManifest {
  const manifest: unknown = JSON.parse(readFileSync(path, 'utf8'));

  return manifest as InstalledManifest;
}

// The manifest that owns a resolved entry point, found by walking up from it rather than by a fixed
// relative path: a package that moved its entry point one directory would otherwise silently answer
// a different manifest, or none.
function manifestOwning(entryPath: string, name: string): InstalledManifest {
  let directory = dirname(entryPath);

  for (let level = 0; level < MANIFEST_SEARCH_DEPTH; level += 1) {
    const candidate = join(directory, 'package.json');

    try {
      const manifest = readManifest(candidate);

      if (manifest.name === name) {
        return manifest;
      }
    } catch {
      // Not every directory on the way up carries a manifest; the walk continues.
    }

    directory = dirname(directory);
  }

  throw new Error(`no installed manifest for ${name} above ${entryPath}`);
}

async function recorded(read: () => WriteRecord, drive: () => Promise<unknown>): Promise<WriteRecord> {
  let rejectedWith: unknown = undefined;

  try {
    await drive();
  } catch (error: unknown) {
    rejectedWith = error;
  }

  return { ...read(), rejectedWith };
}

function realSubject(): WriteSubject {
  const service = new Service.Switch(SWITCH_NAME, SWITCH_SUBTYPE);

  // A handler that throws a plain `Error` makes real HAP emit a characteristic warning, and with no
  // listener it writes that to the console. Listening keeps the case quiet without changing what is
  // measured.
  service.on('characteristic-warning', () => undefined);

  const characteristic = service.getCharacteristic(Characteristic.On);
  const read = (): WriteRecord => ({ rejectedWith: undefined, value: characteristic.value, statusCode: characteristic.statusCode });

  return {
    onSet(handler) {
      characteristic.onSet(handler);
    },
    set: (value) => recorded(read, () => characteristic.handleSetRequest(value)),
    get: () => recorded(read, () => characteristic.handleGetRequest()),
    pushOn(value) {
      service.updateCharacteristic(Characteristic.On, value);
    },
    pushStatusActive(value) {
      service.updateCharacteristic(Characteristic.StatusActive, value);
    },
    read,
  };
}

function fakeCharacteristicOf(service: FakeHapService): { value: unknown; statusCode: number; handleSetRequest: (value: unknown) => Promise<void> } {
  const characteristic = service.getCharacteristic(FAKE.Characteristic.On);

  if (characteristic === undefined) {
    throw new Error('the stand-in Switch carries no On characteristic');
  }

  return characteristic;
}

function fakeSubject(): WriteSubject {
  const service = new FAKE.Service.Switch(SWITCH_NAME, SWITCH_SUBTYPE);
  const characteristic = fakeCharacteristicOf(service);
  const read = (): WriteRecord => ({ rejectedWith: undefined, value: characteristic.value, statusCode: characteristic.statusCode });

  return {
    onSet(handler) {
      service.getCharacteristic(FAKE.Characteristic.On)?.onSet(handler);
    },
    set: (value) => recorded(read, () => characteristic.handleSetRequest(value)),
    get: () => recorded(read, () => Promise.resolve(service.getCharacteristic(FAKE.Characteristic.On)?.handleGetRequest())),
    pushOn(value) {
      service.updateCharacteristic(FAKE.Characteristic.On, value);
    },
    pushStatusActive(value) {
      service.updateCharacteristic(FAKE.Characteristic.StatusActive, value);
    },
    read,
  };
}

// One write script, run against each implementation in turn. Neither record is the expected value:
// the assertion is that the two agree, so a semantic this phase got wrong would have to be wrong the
// same way in the real HAP source, which is the point of comparing rather than restating.
type WriteScript = (subject: WriteSubject, refuse: (status: number) => Error) => Promise<WriteRecord>;

async function bothRecords(script: WriteScript): Promise<{ real: WriteRecord; fake: WriteRecord }> {
  const real = await script(realSubject(), (status) => new HapStatusError(status));
  const fake = await script(fakeSubject(), (status) => new FAKE.HapStatusError(status));

  return { real, fake };
}

// Pushes a count onto a real HAP characteristic declared exactly as `props` says, and answers what
// it held afterwards. The warning listener keeps a clamped push from writing to the console; it
// changes nothing about the value being measured.
function countAfterPush(uuid: string, props: CharacteristicProps): unknown {
  const characteristic = new Characteristic('Observed Count', uuid, props);
  characteristic.on('characteristic-warning', () => undefined);

  characteristic.updateValue(COUNT_PAST_UINT8);

  return characteristic.value;
}

// The reason the observed activation count is declared `uint32` rather than `uint8`, demonstrated
// against the real pinned package instead of argued about. HAP does not refuse a value above the
// declared maximum -- it *clamps* it into the domain, silently, and answers a plausible number. On
// a count that means the characteristic stops advancing at 255 and keeps reading as a fact about
// the basement, which is the false normal the safety rule forbids (D-12, CTRL-01, SAFE-08).
test('clamps a count past 255 on the narrow numeric format and keeps it whole on the wide one', () => {
  // arrange
  const perms = [Perms.PAIRED_READ, Perms.NOTIFY];

  // act
  const counts = {
    narrow: countAfterPush(NARROW_COUNT_UUID, { format: Formats.UINT8, perms, maxValue: 255 }),
    wide: countAfterPush(WIDE_COUNT_UUID, { format: Formats.UINT32, perms }),
  };

  // assert
  assert.deepStrictEqual(counts, { narrow: 255, wide: COUNT_PAST_UINT8 });
});

test('D-17 resolves the same HAP file the plugin host itself resolves', () => {
  // arrange
  const homebridgeRequire = createRequire(require_.resolve(HOMEBRIDGE_SPECIFIER));

  // act
  const resolved = { here: require_.resolve(HAP_SPECIFIER), throughTheHost: homebridgeRequire.resolve(HAP_SPECIFIER) };

  // assert
  assert.strictEqual(resolved.here, resolved.throughTheHost);
});

test('D-17 runs against the HAP version the plugin host declares', () => {
  // arrange
  const installed = readManifest(require_.resolve(`${HAP_SPECIFIER}/package.json`));
  const host = manifestOwning(require_.resolve(HOMEBRIDGE_SPECIFIER), HOMEBRIDGE_SPECIFIER);

  // act
  const versions = { installed: installed.version, declaredByTheHost: host.dependencies?.[HAP_SPECIFIER] };

  // assert
  assert.strictEqual(versions.installed, versions.declaredByTheHost);
});

test('stores the value and clears the status on an accepted write, on both implementations', async () => {
  // act
  const { real, fake } = await bothRecords(async (subject) => {
    subject.onSet(() => Promise.resolve());

    return subject.set(true);
  });

  // assert
  assert.deepStrictEqual(real, fake);
  assert.deepStrictEqual(real, { rejectedWith: undefined, value: true, statusCode: 0 });
});

// The held value is pushed to `true` first, deliberately away from the `bool` format default. A
// case that refused a write from the default could not tell an implementation that leaves the value
// alone from one that resets it, and resetting it is exactly what a hand-built stand-in would do.
test('leaves the value the plugin published and stores the thrown status on a refused write, on both implementations', async () => {
  // act
  const { real, fake } = await bothRecords(async (subject, refuse) => {
    subject.pushOn(true);
    subject.onSet(() => Promise.reject(refuse(HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE)));

    return subject.set(false);
  });

  // assert
  assert.deepStrictEqual(real, fake);
  assert.deepStrictEqual(real, { rejectedWith: HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE, value: true, statusCode: HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE });
});

// This is why the binder throws only `HapStatusError`. A plain `Error` is converted to a
// communication failure, and real HAP also emits a characteristic warning quoting the message,
// which puts a cause the plugin chose into a channel it does not control.
test('converts a plain Error to a communication failure, on both implementations', async () => {
  // act
  const { real, fake } = await bothRecords(async (subject) => {
    subject.pushOn(true);
    subject.onSet(() => Promise.reject(new Error('boom')));

    return subject.set(false);
  });

  // assert
  assert.deepStrictEqual(real, fake);
  assert.deepStrictEqual(real, {
    rejectedWith: HAPStatus.SERVICE_COMMUNICATION_FAILURE,
    value: true,
    statusCode: HAPStatus.SERVICE_COMMUNICATION_FAILURE,
  });
});

test('answers the stored status to a read issued after a refusal, on both implementations', async () => {
  // act
  const { real, fake } = await bothRecords(async (subject, refuse) => {
    subject.pushOn(true);
    subject.onSet(() => Promise.reject(refuse(HAPStatus.RESOURCE_BUSY)));
    await subject.set(false);

    return subject.get();
  });

  // assert
  assert.deepStrictEqual(real, fake);
  assert.deepStrictEqual(real, { rejectedWith: HAPStatus.RESOURCE_BUSY, value: true, statusCode: HAPStatus.RESOURCE_BUSY });
});

test('returns the stored status to zero on a push of the value already held, on both implementations', async () => {
  // act
  const { real, fake } = await bothRecords(async (subject, refuse) => {
    subject.pushOn(true);
    subject.onSet(() => Promise.reject(refuse(HAPStatus.RESOURCE_BUSY)));
    await subject.set(false);
    subject.pushOn(subject.read().value === true);

    return subject.read();
  });

  // assert
  assert.deepStrictEqual(real, fake);
  assert.deepStrictEqual(real, { rejectedWith: undefined, value: true, statusCode: 0 });
});

// The stickiness is per characteristic, which is what bounds the blast radius of one refusal: the
// other fourteen services are untouched, and so is `StatusActive` on this one.
test('leaves the stored status on On when StatusActive is pushed, on both implementations', async () => {
  // act
  const { real, fake } = await bothRecords(async (subject, refuse) => {
    subject.pushOn(true);
    subject.onSet(() => Promise.reject(refuse(HAPStatus.OPERATION_TIMED_OUT)));
    await subject.set(false);
    subject.pushStatusActive(false);

    return subject.read();
  });

  // assert
  assert.deepStrictEqual(real, fake);
  assert.deepStrictEqual(real, { rejectedWith: undefined, value: true, statusCode: HAPStatus.OPERATION_TIMED_OUT });
});

// The ordering the macrotask choice rests on, confirmed against real HAP rather than against the
// stand-in alone. A push queued as a microtask inside the handler runs before HAP's own catch
// assigns the status, so it clears a status that has not been set yet and the refusal survives it.
// Without this case that ordering would be the one write semantic in the whole phase proven only
// against a stand-in this phase wrote (D-04).
test('survives a push queued as a microtask inside the handler, on both implementations', async () => {
  // act
  const { real, fake } = await bothRecords(async (subject, refuse) => {
    subject.pushOn(true);
    subject.onSet(() => {
      queueMicrotask(() => {
        subject.pushOn(true);
      });

      return Promise.reject(refuse(HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE));
    });
    await subject.set(false);
    await Promise.resolve();

    return subject.read();
  });

  // assert
  assert.deepStrictEqual(real, fake);
  assert.notStrictEqual(real.statusCode, 0);
  assert.strictEqual(real.statusCode, HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE);
});

test('carries the same numbers for every status the controls answer', () => {
  // act
  const statuses = {
    notAllowed: { real: HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE, fake: FAKE.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE },
    resourceBusy: { real: HAPStatus.RESOURCE_BUSY, fake: FAKE.HAPStatus.RESOURCE_BUSY },
    communicationFailure: { real: HAPStatus.SERVICE_COMMUNICATION_FAILURE, fake: FAKE.HAPStatus.SERVICE_COMMUNICATION_FAILURE },
    timedOut: { real: HAPStatus.OPERATION_TIMED_OUT, fake: FAKE.HAPStatus.OPERATION_TIMED_OUT },
  };

  // assert
  assert.deepStrictEqual(statuses, {
    notAllowed: { real: -70412, fake: -70412 },
    resourceBusy: { real: -70403, fake: -70403 },
    communicationFailure: { real: -70402, fake: -70402 },
    timedOut: { real: -70408, fake: -70408 },
  });
});

test('declares the same Switch shape: On required, Name optional', () => {
  // act
  const shape = {
    real: {
      required: new Service.Switch(SWITCH_NAME, SWITCH_SUBTYPE).characteristics.map((characteristic) => characteristic.UUID),
      optional: new Service.Switch(SWITCH_NAME, SWITCH_SUBTYPE).optionalCharacteristics.map((characteristic) => characteristic.UUID),
    },
    fake: {
      required: new FAKE.Service.Switch(SWITCH_NAME, SWITCH_SUBTYPE).characteristics.map((characteristic) => characteristic.UUID),
      optional: new FAKE.Service.Switch(SWITCH_NAME, SWITCH_SUBTYPE).optionalCharacteristics.map((characteristic) => characteristic.UUID),
    },
  };

  // assert
  assert.deepStrictEqual(shape.fake, shape.real);
  assert.deepStrictEqual(shape.real, { required: [Characteristic.Name.UUID, Characteristic.On.UUID], optional: [Characteristic.Name.UUID] });
});
