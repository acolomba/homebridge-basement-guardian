import type { CoreServiceKind, NotificationServiceKind, ServiceDescriptor, ServiceKind } from '../../src/accessories/services.js';

void ('sump-pit-flood' satisfies CoreServiceKind);
void ('system-self-test' satisfies CoreServiceKind);
void ('backup-pump-activated' satisfies NotificationServiceKind);
void ('pump-controller-link-lost' satisfies NotificationServiceKind);
void ('backup-battery' satisfies ServiceKind);
void ('mains-power-lost' satisfies ServiceKind);
void ({ kind: 'sump-pit-flood', subtype: 'sump-pit-flood', name: 'Sump Pit Flood' } satisfies ServiceDescriptor);

// @ts-expect-error a removable notification sensor is not a truthful service
void ('mains-power-lost' satisfies CoreServiceKind);
// @ts-expect-error a truthful service cannot be removed, so it is not a notification adapter
void ('sump-pit-level' satisfies NotificationServiceKind);
// @ts-expect-error HomeKit keys a service by type and subtype together, so the subtype is required
void ({ kind: 'alarm-mute', name: 'Alarm Mute' } satisfies ServiceDescriptor);
// @ts-expect-error a service kind is one of the declared names, not free-form text
void ({ kind: 'sump-pit-humidity', subtype: 'sump-pit-humidity', name: 'Sump Pit Humidity' } satisfies ServiceDescriptor);
