# Phase 01: Known Findings and Loop Proof - Pattern Map

**Mapped:** 2026-10-13
**Files analyzed:** 7 intended implementation/process files
**Analogs found:** 5 / 7 (four exact code matches; one partial document match)

## Scope and Decision Precedence

This map covers the four explicitly owned code files and three implied process artifacts. Process filenames below are recommendations for the planner. Do not modify controls or state production modules merely to repair assertions. Temporary negative-control mutations must be restored.

Updated CONTEXT D-06 resolves the research's RED-commit conflict. Commit a planning-only record containing the complete regression patch, observed RED command/output, and unchanged source revision before committing the active test plus production fix after GREEN and passing hooks. The research's A1, open-question blocker, and terminal BLOCKED label are superseded by that decision.

Only live `.planning/phases` records govern this milestone. Archived milestone completion does not establish current completion. Seed WARNING findings remain deferred to their owning later phases.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/cloud/auth.ts` | service | request-response, file-I/O | `src/cloud/auth.ts` | exact |
| `test/cloud/auth.test.ts` | test | request-response, event-driven, file-I/O | `test/cloud/auth.test.ts` | exact |
| `test/accessories/controls.test.ts` | test | event-driven, request-response | `test/accessories/controls.test.ts` | exact |
| `test/device/state.test.ts` | test | transform, event-driven | `test/device/state.test.ts` | exact |
| `01-FINDINGS.md` in this phase | config/process record | batch | `.planning/research/SPOT-CHECK-FINDINGS.md` | partial |
| `01-RED-EVIDENCE.md` in this phase | config/process record | batch | none | none |
| `01-<plan>-SUMMARY.md` in this phase | config/process record | batch | none selected | none |

All five named analogs were verified with non-empty `git ls-files -- <path>` output. There are no install mirrors in these assignments.

## Pattern Assignments

### `src/cloud/auth.ts` (service, request-response and file-I/O)

**Analog:** the same tracked source module. Retain its injected options interface and private function organization.

**Imports** (lines 2-14, selected excerpt):

```typescript
import { createHash, randomBytes } from 'node:crypto';
import { access, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PLUGIN_USER_AGENT } from '../settings.js';
```

Value imports precede separate `import type` imports. Preserve relative `.js` specifiers.

**Injection** (lines 83-88):

```typescript
  clock: Clock;
  /** Supplies the salt the cached fingerprint is computed over. */
  createSalt: () => string;
  /** Registers the granted token with the redacting logger (AUTH-02). */
  registerSecret: (secret: string) => void;
  log: Logging;
```

Extend this seam with an optional complete temporary-path producer and a lazy entropy fallback. Preserve composition compatibility; do not export private helpers for tests.

**Exclusive creation and cleanup** (lines 224-234):

```typescript
async function storeCache(temporary: string, target: string, contents: string): Promise<void> {
  await writeFile(temporary, contents, { mode: OWNER_ONLY_MODE, flag: 'wx' });

  try {
    await rename(temporary, target);
  } catch (error: unknown) {
    await rm(temporary, { force: true });

    throw error;
  }
}
```

The write occurs outside rename cleanup: a collision must not delete someone else's occupied path. Preserve owner-only mode and the in-memory success fallback in lines 246-252.

**Whole attempt boundary** (lines 414-418):

```typescript
async function grantAndCache(options: AuthClientOptions, policy: FailurePolicy, signal: AbortSignal): Promise<CachedToken> {
  const granted = await requestGrant(options, policy, signal);
  await writeCachedToken(options, granted);

  return granted;
}
```

Coalesce this entire operation. Add grant-owned cancellation and independent caller waits. Keep the shared slot until underlying settlement, including delayed abort rejection. No existing implementation provides correct per-waiter cancellation; use D-04/D-05 and RESEARCH lifecycle guidance rather than copying the current first-caller ownership defect.

**Deadline and abort-silent error handling** (lines 368, 370-377):

```typescript
signal: AbortSignal.any([signal, AbortSignal.timeout(options.requestTimeoutMs)]),
```

```typescript
  } catch (error: unknown) {
    // A shutdown is not a failure, so an abort the caller asked for travels on
    // untouched and says nothing.
    if (signal.aborted) {
      throw error;
    }

    throw reportTransient(options, policy, NETWORK_FAILURE);
```

Supply the grant-owned signal to transport composition. Preserve payload narrowing in `isTokenCacheFile` (130-137) and `readGrant` (347-359), terminal authentication policy, redaction registration, and the existing cache shape.

### `test/cloud/auth.test.ts` (test, request-response/event-driven/file-I/O)

**Analog:** the same owner test. Extend existing options, real temporary-directory cleanup, grant-response fixtures, and recording logs rather than creating shared support files. Existing concurrent-grant cases are at lines 322-349; collision assertions are at 542-563. The collision's PID-only guessed filename is the defect, not a reusable pattern.

**Error assertion and silent log contract** (lines 965-974):

```typescript
  await assert.rejects(
    () => authClient.idToken(shutdown.signal),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.strictEqual(error.name, 'AbortError');

      return true;
    },
  );
  assert.deepStrictEqual(messages, []);
```

For new cancellation cases, attach rejection consumers before aborting. Inject a local controlled `HttpFetch` that records the actual signal and exposes explicit start/resolve/reject synchronization. Do not use sleeps or private state. Cover first and joined caller cancellation separately, all callers leaving, already-aborted callers, root shutdown, cache-read overlap, failure settlement, and arrival during delayed teardown. Assert one grant and no automatic retry.

**Whole cache payload** (lines 558-563):

```typescript
    assert.deepStrictEqual(parseJson(await readFile(cachePath, 'utf8')), {
      idToken: 'id-token-1',
      expiresAt: START_TIME + TOKEN_LIFETIME_MS,
      emailFingerprint: fingerprintOf('salt-1', ACCOUNT_EMAIL),
      salt: 'salt-1',
    });
```

Reuse whole-value filesystem assertions for the appropriate successful writer cases. In the collision case, instead assert the occupied path and prior target remain unchanged, exact directory contents, usable token, and the exact cache-write diagnostic. Removing only `flag: 'wx'` must fail the named test.

### `test/accessories/controls.test.ts` (test, event-driven/request-response)

**Analog:** same owner test. Imports at lines 1-12 use Node strict assertions, `test`, the existing fake HAP, value imports, and separate type imports.

**Recording dependency** (lines 63-65):

```typescript
    warn: (message: string) => {
      warnings.push(message);
    },
```

**Exact warning assertion** (lines 390-402, core excerpt):

```typescript
  const warnings: string[] = [];
  const log = warningLog(warnings);
  const { commands } = recordingCommands({ accepted: false, failure: 'timed-out' });
  const { service } = boundSwitch({ commands, log });

  // act
  await assertRefused(service, true, OPERATION_TIMED_OUT);

  // assert
  assert.deepStrictEqual(warnings, [`The self-test request on ${DEVICE_ID} did not take effect: timed-out. It is not retried.`]);
```

Copy this assertion strength to eight sibling named cases using the existing `RefusalCase` table (407-504). Add independently authored literal expected lines; do not call the production formatter. Replace the boolean-summary loop at 591-623. Preserve explicit independent status constants (29-32), refusal fixtures, and command recorder. A wrong cause with the same status must fail its own case.

### `test/device/state.test.ts` (test, transform/event-driven)

**Analog:** same owner test. Imports at 1-16 use Node `describe`/`test`, `.js` source imports, and separate type imports.

**Independent expected snapshot** (lines 104-112):

```typescript
    assert.deepStrictEqual(snapshot, {
      identity: geminiIdentity(),
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 1, primary_pump_running: false, ac_power: true },
      metadata: {},
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: FIRST_RECEIPT,
    });
```

Assert whole expected snapshots before frozen checks at 224-247, 474-498, and 596-605. Assert nested records such as `{ depth: 3 }` and `{ signal: -54 }` before checking their frozen status. Do not build expected objects from the actual snapshot.

**Read canonical storage after action** (lines 584-592):

```typescript
    assert.deepStrictEqual(store.snapshot(DEVICE_ID), {
      identity: geminiIdentity(),
      connectivity: { connected: true, timestamp: DEVICE_TIME },
      data: { water_level: 4, primary_pump_running: false, ac_power: true },
      metadata: { wifi_signal_dbm: -54 },
      shadowVersion: undefined,
      deviceTimestamp: DEVICE_TIME,
      receivedAt: FIRST_RECEIPT,
    });
```

Apply this public-store read pattern after every version row at 313-328 and the stale metadata-watermark case at 450-459. Independently specify the row's complete expected stored snapshot. A mutation that corrupts storage while returning an old snapshot must fail.

### `01-FINDINGS.md` (process record, batch)

**Partial analog:** tracked `.planning/research/SPOT-CHECK-FINDINGS.md`, lines 24-28:

```markdown
| ID | Location | Finding |
| --- | --- | --- |
```

Retain stable seed IDs SC-01 through SC-05 and exact locations. Expand this minimal seed table with requirement, rule, severity, first round, outcome/rejection reason, regression or mutation evidence, test/evidence commit, fix commit, and verification command/status. One assigned owner writes the ledger; batch workers return records to that owner.

Add per-round opening, fixed, rejected, new, reopened, and closing counts plus commands and commit evidence. Stop all batches on no progress, a reopened fixed finding, or the four-round cap. Record the maintainer's retry/skip/stop decision without claiming unresolved work is fixed.

### `01-RED-EVIDENCE.md` and `01-<plan>-SUMMARY.md` (process records, batch)

No close current implementation analog was selected. Use updated D-06 for RED evidence and the project's GSD SUMMARY format. RED evidence must include the complete active regression patch, source commit, exact failing command/output, and why the failure proves the bug. Environmental `listen EPERM` failures are not bug evidence. Keep mutation evidence separate and record restoration plus GREEN.

Summaries reference the single phase ledger, executed scope, actual commits, and verification evidence. Include `## Threat Flags` even when none apply. Check committed paths; never treat an empty or unrelated commit as evidence.

## Shared Patterns

### Headers and license classification

Apply D-01 through D-03 to all four touched TypeScript files. No existing excerpt establishes the newly locked complete header form; compose it from the decisions:

```typescript
// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Brief purpose of this file.
 */

```

Auth's tracked first line establishes MIT for that source. Preserve any existing Apache/template attribution in other files. The existing license gate checks source classification, not the full new form or test headers; manually inspect touched headers.

### Test and verification boundaries

Use the existing Node strict assertions and arrange/act/assert structure. Keep helpers local to their owner test and preserve compiled `dist-test` layout. Read the applicable TypeScript and test skills before implementation.

Compile with `npm run build:test`, then run the owner file and isolated pair coverage. Pairs are auth/auth.test, controls/controls.test, and state/state.test. Run the existing license gate and full `npm run check` at combined wave/phase boundaries. Incremental hook success does not replace that gate. Record command, exit status, source revision, Node version, and evidence scope under `skills/local-verification/SKILL.md`.

### Authentication, validation, and logging

Only auth source changes authentication behavior. Preserve its secret registration and narrowing; no new controller guard applies. Controls and state tasks strengthen public behavior assertions without importing private formatters or inspecting private state. Evidence must use synthetic fixtures and sanitized output.

## No Analog Found

| File or pattern | Role | Data Flow | Reason |
|---|---|---|---|
| `01-RED-EVIDENCE.md` | process record | batch | The approved complete-patch RED artifact is a new contract. Use updated D-06. |
| `01-<plan>-SUMMARY.md` | process record | batch | No current completed phase proves this milestone's loop. Use GSD SUMMARY requirements. |
| Per-waiter shared-grant cancellation | service | event-driven | Existing auth coalescing owns the first caller signal; copying it preserves SC-05. |

## Metadata

**Analog search scope:** owned source/test files, packaging license gate, tracked planning seed records, project instructions and skill indexes.
**Files scanned:** 6 concrete source/test/seed candidates; 5 retained analogs plus the license gate as validation support.
**Pattern extraction date:** 2026-10-13
**Changes made:** this pattern map only; no source edits or commits.
