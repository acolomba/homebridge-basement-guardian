// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Checks persisted accessory contracts through valid shapes and compiler errors.
 */

import type { AccessoryContext, ActivationWatermarks, PumpObservation } from '../../src/persistence/accessoryContext.js';

const DEVICE_ID = 'account-1_serial-1';
const OBSERVATION_START = 1_800_000_000_000;
const LAST_ACTIVATION = 1_800_000_777_000;

const pumpObservation: PumpObservation = {
  observationStartedAt: OBSERVATION_START,
  activationCount: 4,
  lastActivationAt: LAST_ACTIVATION,
};
const watermarks: ActivationWatermarks = { backupPumpTimestamp: undefined, testTimestamp: undefined };
const storedContext: AccessoryContext = {
  deviceId: DEVICE_ID,
  deviceTypeId: 'wayneWaterGemini',
  serialNumber: 'serial-1',
  primaryPump: pumpObservation,
  backupPump: { observationStartedAt: OBSERVATION_START, activationCount: 0, lastActivationAt: undefined },
  watermarks,
  lastVendorName: 'Sump System',
};

void ({ observationStartedAt: OBSERVATION_START, activationCount: 0, lastActivationAt: undefined } satisfies PumpObservation);
void ({ backupPumpTimestamp: 1_700_000_111, testTimestamp: undefined } satisfies ActivationWatermarks);
void ({ backupPumpTimestamp: undefined, testTimestamp: 1_700_000_222 } satisfies ActivationWatermarks);

// An absent label makes no claim about whether the activation was test activity.
void ({ observationStartedAt: OBSERVATION_START, activationCount: 1, lastActivationAt: LAST_ACTIVATION } satisfies PumpObservation);
void ({
  observationStartedAt: OBSERVATION_START,
  activationCount: 1,
  lastActivationAt: LAST_ACTIVATION,
  lastActivationWasTestActivity: true,
} satisfies PumpObservation);
void ({
  observationStartedAt: OBSERVATION_START,
  activationCount: 1,
  lastActivationAt: LAST_ACTIVATION,
  lastActivationWasTestActivity: false,
} satisfies PumpObservation);

// First-run context carries identity and the vendor name before any observation.
void ({ deviceId: DEVICE_ID, deviceTypeId: 'wayneWaterGemini', serialNumber: 'serial-1', lastVendorName: 'Sump System' } satisfies AccessoryContext);

// The observation reducer updates these stored records in place.
pumpObservation.observationStartedAt = OBSERVATION_START;
pumpObservation.activationCount += 1;
pumpObservation.lastActivationAt = LAST_ACTIVATION;
pumpObservation.lastActivationWasTestActivity = false;
watermarks.backupPumpTimestamp = 1_700_000_111;
watermarks.testTimestamp = 1_700_000_222;
storedContext.primaryPump = pumpObservation;
storedContext.backupPump = pumpObservation;
storedContext.watermarks = watermarks;

// @ts-expect-error a count means nothing without the time the plugin began watching
void ({ activationCount: 4, lastActivationAt: LAST_ACTIVATION } satisfies PumpObservation);
// @ts-expect-error an observation carries its activation count even when it is zero
void ({ observationStartedAt: OBSERVATION_START, lastActivationAt: undefined } satisfies PumpObservation);
// @ts-expect-error an observation states that no activation has been observed with a present undefined member
void ({ observationStartedAt: OBSERVATION_START, activationCount: 0 } satisfies PumpObservation);
// @ts-expect-error the observation start is stored as milliseconds rather than a date string
void ({ observationStartedAt: '2026-01-01T00:00:00Z', activationCount: 0, lastActivationAt: undefined } satisfies PumpObservation);
// @ts-expect-error an activation count is numeric
void ({ observationStartedAt: OBSERVATION_START, activationCount: '4', lastActivationAt: undefined } satisfies PumpObservation);
// @ts-expect-error the last activation is stored as milliseconds rather than a date string
void ({ observationStartedAt: OBSERVATION_START, activationCount: 1, lastActivationAt: '2026-01-01T00:00:00Z' } satisfies PumpObservation);
// @ts-expect-error an earned test-activity label is a boolean
void ({ ...pumpObservation, lastActivationWasTestActivity: 'yes' } satisfies PumpObservation);
// @ts-expect-error the unearned label is omitted rather than written as undefined
void ({ ...pumpObservation, lastActivationWasTestActivity: undefined } satisfies PumpObservation);

// @ts-expect-error the backup watermark is present even when its value is undefined
void ({ testTimestamp: undefined } satisfies ActivationWatermarks);
// @ts-expect-error the self-test watermark is present even when its value is undefined
void ({ backupPumpTimestamp: undefined } satisfies ActivationWatermarks);
// @ts-expect-error a backup watermark holds numeric device seconds
void ({ backupPumpTimestamp: '1700000111', testTimestamp: undefined } satisfies ActivationWatermarks);
// @ts-expect-error a self-test watermark holds numeric device seconds
void ({ backupPumpTimestamp: undefined, testTimestamp: '1700000222' } satisfies ActivationWatermarks);

// @ts-expect-error stored state carries no credential
void ({ ...storedContext, idToken: 'id-token-1' } satisfies AccessoryContext);
// @ts-expect-error stored state carries no telemetry snapshot, which would read as current after a restart
void ({ ...storedContext, data: { water_level: 1 } } satisfies AccessoryContext);

const { backupPump, ...withoutBackupPump } = storedContext;
void (backupPump satisfies PumpObservation | undefined);
void (withoutBackupPump satisfies AccessoryContext);

const { lastVendorName, ...withoutLastVendorName } = storedContext;
void (lastVendorName satisfies string);
// @ts-expect-error the vendor name is written on every registration, so it is never left unset
void (withoutLastVendorName satisfies AccessoryContext);
