// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Checks per-scope trust, monitoring paths and absent clocks.
 */

import type { DeviceHealth, DistrustReason, MonitoringPath, TrustScope, UntrustedScope } from '../../src/device/health.js';

const DEVICE_ID = 'account-1_serial-1';
const RECEIVED_AT = 1_700_000_777_000;
const UNTRUSTED_SCOPES: readonly UntrustedScope[] = [{ scope: 'water', reason: 'invalid', lastTrustedAt: undefined }];

void ('poll-only' satisfies MonitoringPath);
void ('pump' satisfies TrustScope);
void ('controller-link-lost' satisfies DistrustReason);
void ({ scope: 'pump', reason: 'controller-link-lost', lastTrustedAt: RECEIVED_AT } satisfies UntrustedScope);
void ({ scope: 'water', reason: 'invalid', lastTrustedAt: undefined } satisfies UntrustedScope);
void ({ deviceId: DEVICE_ID, monitoringPath: 'shadow-and-poll', untrusted: [], lastReceivedAt: RECEIVED_AT } satisfies DeviceHealth);
void ({
  deviceId: DEVICE_ID,
  monitoringPath: 'unavailable',
  untrusted: [{ scope: 'connectivity', reason: 'unreachable', lastTrustedAt: RECEIVED_AT }],
  lastReceivedAt: undefined,
} satisfies DeviceHealth);
void ({ deviceId: DEVICE_ID, monitoringPath: 'poll-only', untrusted: UNTRUSTED_SCOPES, lastReceivedAt: RECEIVED_AT } satisfies DeviceHealth);

// @ts-expect-error polling alone is a named degraded path, not a free-form label
void ('degraded' satisfies MonitoringPath);
// @ts-expect-error a scope that lost trust says why, so no caller has to guess
void ({ scope: 'pump', lastTrustedAt: RECEIVED_AT } satisfies UntrustedScope);
// @ts-expect-error trust is marked per scope, never for the whole device at once
void ({ scope: 'everything', reason: 'stale', lastTrustedAt: undefined } satisfies UntrustedScope);
// @ts-expect-error an absent trusted list is not the same claim as an empty one
void ({ deviceId: DEVICE_ID, monitoringPath: 'poll-only', lastReceivedAt: RECEIVED_AT } satisfies DeviceHealth);
// @ts-expect-error the last trusted time is present even when no trusted value has arrived
void ({ scope: 'pump', reason: 'stale' } satisfies UntrustedScope);
// @ts-expect-error the receipt time is present even when no state has arrived
void ({ deviceId: DEVICE_ID, monitoringPath: 'unavailable', untrusted: [] } satisfies DeviceHealth);
// @ts-expect-error a distrust reason names a supported loss of trust
void ('unknown' satisfies DistrustReason);
void ({
  scope: 'water',
  reason: 'invalid',
  // @ts-expect-error a known last trusted time is a numeric local timestamp
  lastTrustedAt: 'not-a-number',
} satisfies UntrustedScope);
void ({
  deviceId: DEVICE_ID,
  monitoringPath: 'poll-only',
  untrusted: [],
  // @ts-expect-error a known receipt time is a numeric local timestamp
  lastReceivedAt: 'not-a-number',
} satisfies DeviceHealth);
