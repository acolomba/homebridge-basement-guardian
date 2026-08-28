import type {
  BackupPumpActivationRecovered,
  BackupPumpStarted,
  DeviceEvent,
  DeviceEventBase,
  PrimaryPumpStarted,
  SelfTestStarted,
} from '../../src/device/events.js';

const DEVICE_ID = 'account-1_serial-1';
const OBSERVED_AT = 1_700_000_777_000;
const DEVICE_TIME = 1_700_000_000_000;

void ({ deviceId: DEVICE_ID, observedAt: OBSERVED_AT } satisfies DeviceEventBase);
void ({ type: 'primary-pump-started', deviceId: DEVICE_ID, observedAt: OBSERVED_AT } satisfies PrimaryPumpStarted);
void ({ type: 'backup-pump-started', deviceId: DEVICE_ID, observedAt: OBSERVED_AT } satisfies BackupPumpStarted);
void ({ type: 'self-test-started', deviceId: DEVICE_ID, observedAt: OBSERVED_AT } satisfies SelfTestStarted);
void ({
  type: 'backup-pump-activation-recovered',
  deviceId: DEVICE_ID,
  observedAt: OBSERVED_AT,
  deviceTimestamp: DEVICE_TIME,
} satisfies BackupPumpActivationRecovered);
void ({ type: 'primary-pump-started', deviceId: DEVICE_ID, observedAt: OBSERVED_AT } satisfies DeviceEvent);

// @ts-expect-error an occurrence carries its discriminant
void ({ deviceId: DEVICE_ID, observedAt: OBSERVED_AT } satisfies DeviceEvent);
// @ts-expect-error every occurrence names the device it belongs to
void ({ type: 'primary-pump-started', observedAt: OBSERVED_AT } satisfies DeviceEvent);
// @ts-expect-error a recovered activation carries the device time that de-duplicates it
void ({ type: 'backup-pump-activation-recovered', deviceId: DEVICE_ID, observedAt: OBSERVED_AT } satisfies DeviceEvent);
// @ts-expect-error local observation time is not a device timestamp, so it is never optional
void ({ type: 'primary-pump-started', deviceId: DEVICE_ID } satisfies DeviceEvent);
