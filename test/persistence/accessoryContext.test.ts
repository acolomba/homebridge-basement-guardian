import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import type { AccessoryContext, ActivationWatermarks, PumpObservation } from '../../src/persistence/accessoryContext.js';

const DEVICE_ID = 'account-1_serial-1';
const OBSERVATION_START = 1_700_000_000_000;
const LAST_ACTIVATION = 1_700_000_777_000;

function pumpObservation(): PumpObservation {
  return { observationStartedAt: OBSERVATION_START, activationCount: 4, lastActivationAt: LAST_ACTIVATION };
}

function noWatermarks(): ActivationWatermarks {
  return { backupPumpTimestamp: undefined, testTimestamp: undefined };
}

function storedContext(): AccessoryContext {
  return {
    deviceId: DEVICE_ID,
    deviceTypeId: 'wayneWaterGemini',
    serialNumber: 'serial-1',
    primaryPump: pumpObservation(),
    backupPump: pumpObservation(),
    watermarks: noWatermarks(),
    lastVendorName: 'Sump System',
  };
}

void (storedContext() satisfies AccessoryContext);
void ({ observationStartedAt: OBSERVATION_START, activationCount: 0, lastActivationAt: undefined } satisfies PumpObservation);
void ({ backupPumpTimestamp: 1_700_000_111, testTimestamp: undefined } satisfies ActivationWatermarks);

// @ts-expect-error a count means nothing without the time the plugin began watching
void ({ activationCount: 4, lastActivationAt: LAST_ACTIVATION } satisfies PumpObservation);
// @ts-expect-error stored state carries no credential
void ({ ...storedContext(), idToken: 'id-token-1' } satisfies AccessoryContext);
// @ts-expect-error stored state carries no telemetry snapshot, which would read as current after a restart
void ({ ...storedContext(), data: { water_level: 1 } } satisfies AccessoryContext);

const { backupPump, ...withoutBackupPump } = storedContext();
void (backupPump satisfies PumpObservation);
// @ts-expect-error both pumps are observed, so neither record is optional
void (withoutBackupPump satisfies AccessoryContext);

void ({ ...storedContext(), lastVendorName: 'Sump System' } satisfies AccessoryContext);

const { lastVendorName, ...withoutLastVendorName } = storedContext();
void (lastVendorName satisfies string);
// @ts-expect-error it is written on every registration, so it is never left unset
void (withoutLastVendorName satisfies AccessoryContext);

// The declarations above are checked by the compiler. What follows is checked against the source
// itself, because the one thing that can go wrong here is a unit a type cannot express: both device
// timestamps arrive as Unix seconds and both stored times are milliseconds, and a reader who takes
// one for the other writes a 1970 date into a characteristic with every test still green (D-11).
const CONTEXT_MODULE = 'persistence/accessoryContext.ts';

async function contextSource(): Promise<string> {
  return readFile(new URL(`../../../src/${CONTEXT_MODULE}`, import.meta.url), 'utf8');
}

function docblockAbove(source: string, declaration: string): string {
  const declared = source.indexOf(declaration);

  if (declared === -1) {
    throw new Error(`no declaration of ${declaration} in ${CONTEXT_MODULE}`);
  }

  const opened = source.lastIndexOf('/**', declared);
  const closed = source.lastIndexOf('*/', declared);

  if (opened === -1 || closed < opened) {
    throw new Error(`no docblock above ${declaration} in ${CONTEXT_MODULE}`);
  }

  return source.slice(opened, closed).toLowerCase();
}

test('states the unit of the last observed activation time and both of the sources it comes from', async () => {
  // arrange
  const source = await contextSource();

  // act
  const docblock = docblockAbove(source, 'lastActivationAt: number | undefined;');

  // assert
  assert.deepStrictEqual(
    {
      unit: docblock.includes('milliseconds'),
      watchedEdge: docblock.includes('watched edge'),
      recoveredActivation: docblock.includes('recovered activation'),
    },
    { unit: true, watchedEdge: true, recoveredActivation: true },
  );
});

test('states that both watermarks hold the device Unix seconds and are never compared against local time', async () => {
  // arrange
  const source = await contextSource();

  // act
  const docblock = docblockAbove(source, 'export interface ActivationWatermarks');

  // assert
  assert.deepStrictEqual({ unit: docblock.includes('unix seconds'), neverLocalTime: docblock.includes('local time') }, { unit: true, neverLocalTime: true });
});

test('distinguishes an unearned self-test label from a label of false', async () => {
  // arrange
  const source = await contextSource();

  // act
  const docblock = docblockAbove(source, 'lastActivationWasTestActivity?: boolean;');

  // assert
  assert.deepStrictEqual({ absent: docblock.includes('absent'), asFalse: docblock.includes('`false`') }, { absent: true, asFalse: true });
});

test('states that absent is the ordinary first-run state of every record member', async () => {
  // arrange
  const source = await contextSource();

  // act
  const docblock = docblockAbove(source, 'primaryPump?: PumpObservation;');

  // assert
  assert.deepStrictEqual({ firstRun: docblock.includes('first-run'), noEarlierShape: docblock.includes('migrat') }, { firstRun: true, noEarlierShape: true });
});
