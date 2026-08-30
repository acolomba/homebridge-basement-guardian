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
