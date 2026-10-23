# Phase 02: Cloud Conformance - Pattern Map

**Mapped:** 2026-10-13
**Files classified:** 17 cloud files plus 3 conditional external consumers; the fourth filename consumer is the existing auth test.
**Scope:** Conformance mapping, not a completed review or finding disposition. No new production files are implied.

## File Classification

All paths in the analog column were verified with `git ls-files`. Existing modules remain their own lifecycle/contract authority. The shared examples below supply specific conformance patterns, not permission to copy an entire unreviewed file.

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
| --- | --- | --- | --- | --- |
| `src/cloud/auth.ts` | service | request-response, file-I/O | `src/cloud/auth.ts` | exact; preserve existing ownership |
| `test/cloud/auth.test.ts` | test | request-response, file-I/O | `test/cloud/auth.test.ts` | exact; selected settled assertions |
| `src/cloud/shadow.ts` | service | event-driven, pub-sub | `src/cloud/shadow.ts` | exact; preserve existing ownership |
| `test/cloud/shadow.test.ts` | test | event-driven, pub-sub | `test/cloud/auth.test.ts` | role-match for complete observations; retain shadow harness |
| `src/cloud/api.ts` | service | request-response | `src/cloud/auth.ts` | role-match for typed injection/header; retain REST semantics |
| `test/cloud/api.test.ts` | test | request-response | `test/cloud/auth.test.ts` | exact role/flow for explicit transport and complete results |
| `src/cloud/types.ts` | model, utility | transform | `src/cloud/shadow.ts` | flow-match for narrowed reported sections; retain wire guards |
| `test/cloud/types.test.ts` | test | transform | `test/cloud/auth.test.ts` | role-match for independently expected whole objects |
| `src/cloud/errors.ts` | model | request-response | `src/cloud/auth.ts` | partial; typed error construction/use and header only |
| `test/cloud/errors.test.ts` | test | request-response | `test/cloud/auth.test.ts` | role-match for typed observable errors |
| `src/cloud/httpDispatcher.ts` | utility | request-response | `src/cloud/auth.ts` | partial; header and injected HTTP type only |
| `test/cloud/httpDispatcher.test.ts` | test | request-response | `test/cloud/alpnServer.ts` | flow-match; local transport fixture |
| `src/cloud/mqttTransport.ts` | service | event-driven | `src/cloud/shadow.ts` | flow-match; preserve transport-specific ownership |
| `test/cloud/mqttTransport.test.ts` | test | event-driven | `test/cloud/auth.test.ts` | role-match for controlled settlement and cleanup |
| `src/cloud/sigv4.ts` | utility | transform | `src/cloud/auth.ts` | partial; header/import conventions only |
| `test/cloud/sigv4.test.ts` | test | transform | `test/cloud/auth.test.ts` | role-match for independent expectations; retain signing-byte fixture |
| `test/cloud/alpnServer.ts` | utility | request-response, file-I/O | `test/cloud/alpnServer.ts` | exact; existing case-owned helper |
| `test/platform.test.ts` (conditional) | test | event-driven, file-I/O | `test/cloud/auth.test.ts` | role-match for independent cache-path expectation |
| `features/support/steps/authentication.ts` (conditional) | test | file-I/O | `test/cloud/auth.test.ts` | flow-match for stable cache filename contract |
| `features/real-pump/support/realWorld.ts` (conditional) | test utility | file-I/O | `test/cloud/auth.test.ts` | flow-match for stable cache filename contract |

## Pattern Assignments

### All 17 cloud files: header and import form

**Analog:** `src/cloud/auth.ts:1-23` and `test/cloud/auth.test.ts:1-32`.
Copy the layout, substituting a brief file purpose. Preserve each file's existing SPDX classification and attribution.

```ts
// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Manages authentication and the token cache.
 */

import { createHash, randomBytes } from 'node:crypto';
import { access, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
```

Type-only imports are explicit, and relative imports retain `.js`:

```ts
// src/cloud/auth.ts:20-23
import type { ProtocolConstants } from '../protocol.js';
import type { HttpFetch } from './httpDispatcher.js';
import type { Clock } from '../runtime/clock.js';
import type { Logging } from 'homebridge';
```

This example does not establish that every other auth comment or import already conforms. Keep header-only commits separate from functional causes under the settled protocol.

### `src/cloud/auth.ts`: shared work remains client-owned

**Analog:** the existing `sharedGrant` in `src/cloud/auth.ts:521-543`.

```ts
if (inFlight === undefined) {
  const controller = new AbortController();
  const token = grantAndCache(options, policy, controller.signal).finally(() => {
    inFlight = undefined;
  });
  inFlight = { controller, token, waiters: 0 };
}
```

The slot survives teardown until settlement. Retain the independently cancellable waiter and final-caller cancellation (`536-542`):

```ts
return waitFor(attempt.token, signal, (cancelled) => {
  attempt.waiters -= 1;

  if (cancelled && attempt.waiters === 0) {
    attempt.controller.abort();
  }
});
```

`waitFor` removes its listener and releases a waiter only once (`444-484`); `currentToken` shares the cache read and checks cancellation after waiting (`545-563`). These are D-05 invariants, not refactoring targets.

### `src/cloud/auth.ts`: private optional policy

**Existing sites:** `src/cloud/auth.ts:120-123,317-333,510,548-549`. The existing union-with-undefined fields are the warning, not a pattern to copy. The minimal proposed adaptation is:

```ts
interface FailurePolicy {
  haltedReason?: string;
  lastTransient?: string;
}
const policy: FailurePolicy = {};
// In the existing successful recovery branch:
delete policy.lastTransient;
```

This is proposed code, not an existing excerpt. With exact optional properties enabled, change the explicit undefined clear as well as initialization. Do not convert unrelated optional runtime state, public types, or explicitly absent patch fields mechanically.

### Cloud tests: exact public results and independent cache expectations

**Analog:** `test/cloud/auth.test.ts:627-632`; independent digest helper is at `84-88`.

```ts
assert.deepStrictEqual(parseJson(await readFile(join(storagePath, TOKEN_CACHE_FILENAME), 'utf8')), {
  idToken: 'id-token-1',
  expiresAt: START_TIME + TOKEN_LIFETIME_MS,
  emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
  salt: 'salt-1',
});
```

Apply whole independently expected records to auth cache/privacy cases, API results/errors, shadow patches, wire normalization, and transport observations. If byte serialization is the promise, compare independently expected bytes rather than only parsed keys. Count checks still matter when deduplication is promised; pair them with exact request records where request contents matter.

The cancellation case in `test/cloud/auth.test.ts:419-442` directly observes surviving caller, uncancelled shared transport, cache contents, request count, and logs:

```ts
assert.deepStrictEqual(await joinedOutcome, { status: 'fulfilled', idToken: 'id-token-1' });
assert.strictEqual(transport.aborted, false);
```

Use strict strong-mock expectations only for promised interactions. Ordinary canned-response stubs need no incidental call-count verification. Do not copy global-fetch defaults or negative substring assertions simply because they exist nearby.

### Auth/API tests: hermetic transport injection

**Analog:** the typed injection port in `src/cloud/auth.ts:90-96`; controlled grant helper at `test/cloud/auth.test.ts:194-203`.

```ts
httpFetch: HttpFetch;
clock: Clock;
/** Supplies the salt the cached fingerprint is computed over. */
createSalt: () => string;
/** Supplies the complete temporary cache path when a token is written. */
createTemporaryPath?: (target: string) => string;
```

Preserve production injection. For tests, replace live default fallback with a fixed synthetic failure and explicitly pass each case's fake/controlled `httpFetch`. Return a fresh Response per request. This fail-closed default is a required adaptation, not an existing code excerpt. Research identifies global fallback in both auth and API helpers; review both owned helpers.

### Shadow source/tests and MQTT transport: preserve connection ownership

**Analog:** `src/cloud/shadow.ts:388-408`.

```ts
target.transport.onMessage((topic: string, payload: Buffer) => {
  if (isCurrent(target)) {
    handleMessage(topic, payload);
  }
});
```

The same current-target guard surrounds connect/error/close notifications. `requestEveryShadow` announces connection only after subscription and initial publishes (`350-370`). `openConnection` rejects reopening during shutdown and ends the previous transport (`415-442`). Preserve MQTT's existing handshake-on-factory-call contract; do not move networking to another lifecycle stage as style cleanup.

**Validation/transform analog:** `src/cloud/shadow.ts:194-202`.

```ts
const reported = document.state.reported;
const sections = isRecord(reported) ? reported : {};

return {
  data: isRecord(sections.data) ? sections.data : undefined,
  state: isRecord(sections.state) ? sections.state : undefined,
  version: typeof document.version === 'number' ? document.version : undefined,
};
```

Apply the narrowing-before-use principle to wire guards. Preserve reported-only semantics and the existing absence representation; never manufacture a healthy value from invalid input.

### HTTP adapter tests and `test/cloud/alpnServer.ts`: owned local resources

**Analog:** `test/cloud/alpnServer.ts:24-55,73-128`.

```ts
// test/cloud/alpnServer.ts:52-55
return { key: readFileSync(keyPath, 'utf8'), cert: readFileSync(certPath, 'utf8') };
} finally {
  rmSync(directory, { recursive: true, force: true });
}
```

The certificate generator uses a unique temporary directory and unconditional cleanup. The server binds a fresh loopback port (`101-103`):

```ts
await new Promise<void>((resolve) => {
  server.listen(0, '127.0.0.1', resolve);
});
```

Reuse the existing helper and case teardown, not a new helper meta-test or global resource tracker. Preserve the paired userland undici fetch/Agent and explicit HTTP/1.1 in production; local tests establish negotiated ALPN. A listener permission failure is environmental, not intended RED.

### Filename consumers: narrow conditional edits only

The four consumers are `test/cloud/auth.test.ts:22,154`, `test/platform.test.ts:17,820`, `features/support/steps/authentication.ts:14,64-67`, and `features/real-pump/support/realWorld.ts:30,207-213`. All are tracked. Preserve `.basement-guardian-token.json` and existing storage roots.

If the executor confirms this export exists only for privileged test knowledge, make the constant private and remove the four imports. Independently name the stable filesystem contract in those existing consumers. Do not add a public getter, persistence module, or broader platform/Cucumber sweep. If retained, record a concrete intended production/public contract rationale; test usage alone does not settle the finding.

## Shared Patterns

- **Authentication:** Existing injected auth client remains the public token provider. Preserve independent cancellation and shared grant ownership; no new retries.
- **Errors/privacy:** `src/cloud/auth.ts:317-326` constructs `CloudRequestError` from sanitized failure fields and a fixed grant route. Preserve typed error discrimination, fixed diagnostics, and redaction registration; use exact consumer-visible expectations.
- **Validation:** Narrow unknown input before reading fields; preserve opaque telemetry and narrow invalid scopes. Family validation stays outside transport.
- **Signing:** Keep existing crypto primitives and independently expected canonical bytes. Conformance does not authorize a signing algorithm rewrite.
- **Process:** Copy `.planning/phases/01-known-findings-and-loop-proof/01-REVIEW-PROTOCOL.md` for ledger fields, round reconciliation, serial verification/commit sections, real RED ancestry, and separate negative controls. Adapt IDs and ownership to Phase 2; do not copy Phase 1's seed deferrals or decision numbering over D-01..D-07.
- **Gates:** Each modified pair needs isolated 100% line/function/branch coverage. The coordinator owns combined `npm run check`, findings, state, and pause enforcement. Shared helper/feature edits broaden commit selection. Reuse gate evidence only for unchanged inputs.

## No Analog Found

| Requested Pattern | Role | Data Flow | Reason / planner action |
| --- | --- | --- | --- |
| Fail-closed default test HTTP | test utility | request-response | Existing auth/API defaults are themselves warning targets; use the injected port and the rulebook adaptation above. |
| Private true-optional FailurePolicy | model | event-driven | Existing policy is the warning target; apply the minimal proposed spelling above and trace all clear/init sites. |

No new controller, middleware, persistence service, or framework is needed. Existing specialized signing/error/transport implementations remain their contract owners; no broader analog search is needed for their header/assertion edits.

## Metadata

**Analog search scope:** tracked `src/cloud/**`, `test/cloud/**`, four filename consumers, and settled Phase 1 protocol.
**Inventory:** 17 cloud paths and 3 unique external consumer paths; auth test is counted once.
**Extraction:** bounded source excerpts and consumer searches, not an exhaustive conformance review. Matching examples are pattern guidance, not proof of zero findings.
**Rulebooks consulted:** TS style/comments, unit writer/reviewer, local-verification; AGENTS and Phase 2 context/research.
**Decision preservation:** D-01 headers; D-02 ledger; D-03 all-work pause; D-04 real regression/evidence-first provenance; D-05 auth ownership; D-06 minimum scoped fixes; D-07 isolated and combined gates.
**Pattern extraction date:** 2026-10-13.
