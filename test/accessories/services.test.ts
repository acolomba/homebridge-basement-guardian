import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isNotificationServiceKind, NOTIFICATION_SERVICE_KINDS } from '../../src/accessories/services.js';

import type { CoreServiceKind, NotificationServiceKind, ServiceDescriptor, ServiceKind } from '../../src/accessories/services.js';

// The seven removable names are written out here rather than read from the production list, so a
// case fails when the two disagree instead of agreeing with whatever the module now declares.
const REMOVABLE_SENSOR_NAMES = [
  'backup-pump-running',
  'mains-power-lost',
  'primary-pump-fault',
  'backup-pump-fault',
  'water-sensor-fault',
  'pump-controller-link-lost',
  'basement-guardian-offline',
];

// Apple's Leak Sensor identifier, and a stand-in for a type this module declares no name for. The
// descriptor types the field as text, so neither is checked for shape here.
const LEAK_SENSOR_UUID = '00000083-0000-1000-8000-0026BB765291';
const PLACEHOLDER_UUID = 'placeholder-service-uuid';

void ('sump-pit-flood' satisfies CoreServiceKind);
void ('primary-pump-running' satisfies CoreServiceKind);
void ('system-self-test' satisfies CoreServiceKind);
void ('backup-pump-running' satisfies NotificationServiceKind);
void ('pump-controller-link-lost' satisfies NotificationServiceKind);
void ('backup-battery' satisfies ServiceKind);
void ('mains-power-lost' satisfies ServiceKind);
void ({ kind: 'sump-pit-flood', subtype: 'sump-pit-flood', serviceUuid: LEAK_SENSOR_UUID, name: 'Sump Pit Flood' } satisfies ServiceDescriptor);

// @ts-expect-error a removable notification sensor is not a truthful service
void ('mains-power-lost' satisfies CoreServiceKind);
// @ts-expect-error a truthful service cannot be removed, so it is not a notification adapter
void ('sump-pit-level' satisfies NotificationServiceKind);
// @ts-expect-error the primary pump activity sensor reports truthful state, so it is not removable
void ('primary-pump-running' satisfies NotificationServiceKind);
// @ts-expect-error HomeKit keys a service by type and subtype together, so the subtype is required
void ({ kind: 'alarm-mute', serviceUuid: PLACEHOLDER_UUID, name: 'Alarm Mute' } satisfies ServiceDescriptor);
// @ts-expect-error two rows of one kind and subtype differ only by service type, so the type identifier is required
void ({ kind: 'backup-battery', subtype: 'backup-battery', name: 'Backup Battery Level' } satisfies ServiceDescriptor);
// @ts-expect-error a service kind is one of the declared names, not free-form text
void ({ kind: 'sump-pit-humidity', subtype: 'sump-pit-humidity', serviceUuid: PLACEHOLDER_UUID, name: 'Sump Pit Humidity' } satisfies ServiceDescriptor);

test('CONF-06 lists the seven removable notification sensors in declaration order', () => {
  // act & assert
  assert.deepStrictEqual(NOTIFICATION_SERVICE_KINDS, REMOVABLE_SENSOR_NAMES);
});

for (const sensorName of REMOVABLE_SENSOR_NAMES) {
  test(`recognises ${sensorName} as a removable notification sensor`, () => {
    // act & assert
    assert.strictEqual(isNotificationServiceKind(sensorName), true);
  });
}

for (const { described, supplied } of [
  { described: 'a truthful service kind', supplied: 'sump-pit-flood' },
  { described: 'a misspelled name', supplied: 'mains-power-lst' },
  { described: 'a number', supplied: 1 },
  { described: 'an absent value', supplied: undefined },
]) {
  test(`refuses ${described} as a removable notification sensor`, () => {
    // act & assert
    assert.strictEqual(isNotificationServiceKind(supplied), false);
  });
}
