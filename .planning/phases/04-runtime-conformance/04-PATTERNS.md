# Phase 4: Runtime Conformance - Pattern Map

**Mapped:** 2026-10-14
**Revision:** `008218be4badf44455ab35906f1dfcff06089bf8`
**Files classified:** 20 existing files, ten mirrored pairs
**Pattern coverage:** 20 / 20; bounded analog assignments, not conformance verdicts

This document guides implementation after independent review. It accepts no findings, creates no helpers, and supplies no test or coverage result. CONTEXT D-01–D-07 remain binding. Completed cloud/device/persistence excerpts below illustrate specific patterns; they do not certify every line in those files. Existing runtime targets are preservation inputs, never their own approved conformance analogs.

## File Classification

Match quality concerns the cited pattern, not equivalent product semantics. `partial` means a different role or flow supplies only a reusable technique.

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
| --- | --- | --- | --- | --- |
| `src/runtime/accessoryStore.ts` | provider / declaration | file-I/O | `src/cloud/auth.ts` 103–106 | role-match: narrow injected operation |
| `test/runtime/accessoryStore.test.ts` | test / compiler contract | transform | `test/device/health.test.ts` 17–42 | exact declaration-test pattern |
| `src/runtime/clock.ts` | provider | request-response | `src/cloud/auth.ts` 81–100,165–167 | partial: clock injection, not clock implementation |
| `test/runtime/clock.test.ts` | test | request-response | `test/cloud/shadow.test.ts` 28,615–630 | partial: injected time and context mocks |
| `src/runtime/monotonicClock.ts` | provider | request-response | `src/cloud/auth.ts` 81–100,165–167 | partial: clock injection only |
| `test/runtime/monotonicClock.test.ts` | test | request-response | `test/cloud/shadow.test.ts` 28,615–630 | partial: deterministic boundary observation |
| `src/runtime/timers.ts` | provider | event-driven | `src/cloud/shadow.ts` 78–103 | role-match: injected side-effect port |
| `test/runtime/timers.test.ts` | test | event-driven | `test/cloud/shadow.test.ts` 615–630 | exact scheduling-test technique |
| `src/runtime/commandPort.ts` | provider / model | request-response | `src/device/registry.ts` 23–47 | role-match: public named variants |
| `test/runtime/commandPort.test.ts` | test / compiler contract | transform | `test/device/health.test.ts` 17–42 | exact declaration-test pattern |
| `src/runtime/failureLog.ts` | service | event-driven | `src/cloud/auth.ts` 315–335 | exact failure/recovery pattern; cadence differs |
| `test/runtime/failureLog.test.ts` | test | event-driven | `test/cloud/auth.test.ts` 1480–1501 | exact whole log-stream assertion |
| `src/runtime/retryPolicy.ts` | service | event-driven | `src/cloud/shadow.ts` 217–242,298–304 | role-match: closure ownership and guarded work |
| `test/runtime/retryPolicy.test.ts` | test | event-driven | `test/cloud/shadow.test.ts` 615–630 | exact context-timer technique |
| `src/runtime/arrivalAnchors.ts` | service / storage adapter | file-I/O | `src/cloud/auth.ts` 148–176,243–271 | exact atomic-storage technique; different payload |
| `test/runtime/arrivalAnchors.test.ts` | test | file-I/O | `test/cloud/auth.test.ts` 108–120 | exact per-case real temporary storage |
| `src/runtime/monitoringHealth.ts` | service / projection | event-driven / transform | `src/cloud/shadow.ts` 217–242,448–458 | role-match: owned facts and derived health |
| `test/runtime/monitoringHealth.test.ts` | test | event-driven / transform | `test/cloud/shadow.test.ts` 633–645 | exact before/after public projection observation |
| `src/runtime/accountRuntime.ts` | service / composition | event-driven / request-response | `src/cloud/shadow.ts` 217–242,352–374,391–411,471–475 | role-match: current ownership across asynchronous work |
| `test/runtime/accountRuntime.test.ts` | test | event-driven / request-response | `test/cloud/shadow.test.ts` 615–630,938–954 | exact lifecycle-observation technique; account coverage broader |

## Pattern Assignments

Related targets explicitly share each excerpt. Preserve target-specific behavior; copy structure only where a confirmed finding requires it.

### Declaration ports and compiler owners

**Apply to:** `src/runtime/accessoryStore.ts`, `test/runtime/accessoryStore.test.ts`, `test/runtime/commandPort.test.ts`.

`src/cloud/auth.ts:103–106` supplies the small documented operation boundary:

```typescript
/** Supplies a valid vendor ID token, authenticating again only when needed. */
export interface AuthClient {
  idToken(signal: AbortSignal): Promise<string>;
}
```

`test/device/health.test.ts:19–21,33–34,39–42` supplies positive/negative compiler contracts:

```typescript
void ('controller-link-lost' satisfies DistrustReason);
void ({ scope: 'pump', reason: 'controller-link-lost', lastTrustedAt: RECEIVED_AT } satisfies UntrustedScope);
void ({ scope: 'water', reason: 'invalid', lastTrustedAt: undefined } satisfies UntrustedScope);
```

```typescript
// @ts-expect-error a scope that lost trust says why, so no caller has to guess
void ({ scope: 'pump', lastTrustedAt: RECEIVED_AT } satisfies UntrustedScope);
```

```typescript
// @ts-expect-error the last trusted time is present even when no trusted value has arrived
void ({ scope: 'pump', reason: 'stale' } satisfies UntrustedScope);
// @ts-expect-error the receipt time is present even when no state has arrived
void ({ deviceId: DEVICE_ID, monitoringPath: 'unavailable', untrusted: [] } satisfies DeviceHealth);
```

Keep meaningful accessory `persist()` and command accepted/refused positives and negatives. Required refusal cause and required-present undefined are different contracts from optional fields. Do not call a literal recorder to test its own implementation. Declaration owners correctly have no runtime cases; report selector acceptance honestly, with no artificial wrapper or invented coverage percentage.

### Clock providers and timer port

**Apply to:** `src/runtime/clock.ts`, `src/runtime/monotonicClock.ts`, `src/runtime/timers.ts` and all three mirrored owners.

`src/cloud/auth.ts:91–95,165–167` makes dependencies explicit and reads the supplied clock:

```typescript
  /** Never Node's built-in global `fetch`; see httpDispatcher.ts for why. */
  httpFetch: HttpFetch;
  clock: Clock;
  /** Supplies the salt the cached fingerprint is computed over. */
  createSalt: () => string;
```

```typescript
function isCurrent(expiresAtMs: number, clock: Clock): boolean {
  return expiresAtMs - TOKEN_RENEWAL_MARGIN_MS > clock.now();
}
```

`src/cloud/shadow.ts:86–89` demonstrates supplying side effects rather than constructing a live boundary inside logic:

```typescript
  /** Owns reconnect timing, capped and guarded against duplicate chains. */
  retry: RetryPolicy;
  createTransport: (options: MqttTransportOptions) => MqttTransport;
  connect: MqttConnect;
```

`test/cloud/shadow.test.ts:28` provides the stateless injected clock:

```typescript
const clock = { now: () => Date.parse('2026-08-28T12:00:00.000Z') };
```

The timer owner and both clock owners share the context-owned mocking and public-observation technique in the scheduling excerpt below. For the clocks this is only a partial analogy: retain wall epoch milliseconds versus forward elapsed milliseconds, bigint conversion, and public boundary assertions. Do not add real sleeps or compare incompatible clock domains. No completed standalone clock adapter analog was found.

### Conditional command outcome variants

**Apply to:** `src/runtime/commandPort.ts`; its owner uses the compiler pattern above.

Only if independent review confirms the inline-union finding, follow `src/device/registry.ts:23–43`:

```typescript
/** An implemented profile and the family adapter that answers for it. */
export interface ImplementedFamilyOutcome<T> {
  kind: 'implemented';
  family: DeviceFamily<T>;
}

/** A recognized profile whose family adapter is not implemented. */
export interface UnsupportedFamilyOutcome {
  kind: 'unsupported';
  deviceTypeId: string;
  displayName: string;
}

/** A profile the registry does not recognize. */
export interface UnknownFamilyOutcome {
  kind: 'unknown';
  deviceTypeId: string;
}

/** The verdict on one vendor `deviceTypeId`. */
export type FamilyOutcome<T> = ImplementedFamilyOutcome<T> | UnsupportedFamilyOutcome | UnknownFamilyOutcome;
```

Copy public documented variant structure, not registry names, generic, or tags. Preserve `accepted: true`, `accepted: false`, required `failure: CommandFailure`, and `'vendor-error' | 'timed-out'`. Do not change mutability, force named imports into structural consumers, leak private constituents, or suppress Fallow. Exact consumers must be traced again at the actual pre-edit revision.

### Failure reporting

**Apply to:** `src/runtime/failureLog.ts`, `test/runtime/failureLog.test.ts`.

`src/cloud/auth.ts:319–335` provides fixed safe messages and recovery state:

```typescript
function reportTransient(options: AuthClientOptions, policy: FailurePolicy, failure: TransientFailure): CloudRequestError {
  if (policy.lastTransient === failure.kind) {
    options.log.debug(transientLog(failure.kind));
  } else {
    options.log.warn(transientLog(failure.kind));
  }

  policy.lastTransient = failure.kind;

  return new CloudRequestError(failure.message, failure.status, GRANT_ROUTE);
}

function reportRecovery(options: AuthClientOptions, policy: FailurePolicy): void {
  if (policy.lastTransient !== undefined) {
    options.log.info(RECOVERED);
    delete policy.lastTransient;
  }
}
```

`test/cloud/auth.test.ts:1494–1500` asserts the complete promised stream after the public token:

```typescript
  // assert
  assert.strictEqual(idToken, 'id-token-1');
  assert.deepStrictEqual(messages, [
    'warn Authentication could not be completed (HTTP 500); the plugin will try again.',
    'debug Authentication could not be completed (HTTP 500); the plugin will try again.',
    'info Authentication recovered.',
  ]);
```

The target keeps per-kind reminder timestamps, boundary cadence, independent kinds, recovery and silent forget. Auth's last-kind policy must not replace that map. Logging assertions belong here because logging is this module's public behavior; other runtime tests normally use a silent logger.

### Scheduling and lifecycle observations

**Apply to:** `src/runtime/retryPolicy.ts`, `test/runtime/retryPolicy.test.ts`, the three provider owners above, and `test/runtime/accountRuntime.test.ts`.

`src/cloud/shadow.ts:217–229` supplies instance-owned state and explicit ownership:

```typescript
export function createShadowClient(options: ShadowClientOptions): ShadowClient {
  const routes = new Map<string, ShadowRoute>();
  let devices: readonly string[] = [];
  let connection: ShadowConnection | undefined;
  let closing = false;
  let ending: Promise<void> | undefined;
```

```typescript
  function isCurrent(target: ShadowConnection): boolean {
    return connection === target && !target.released && !closing;
  }
```

`test/cloud/shadow.test.ts:615–631` is the shared concrete timer/lifecycle analog:

```typescript
  test('ends the transport once and schedules no reconnect when closed twice', async (t) => {
    // arrange
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { client, transports } = harness();
    await client.start([DEVICE_A]);
    await connected(transports[0]);

    // act
    await client.close();
    await client.close();
    transports[0]?.close();
    t.mock.timers.tick(30_000);
    await nextEventLoopTurn();

    // assert
    assert.deepStrictEqual({ ends: transports[0]?.ends(), connections: transports.length }, { ends: 1, connections: 1 });
  });
```

Adapt only the technique: fresh case state, context timers, awaited settling and complete independently specified observations. Keep retry's first delay, ceiling, pending guard, reset and shared-root abort behavior. Retain the timer module object import needed by timer mocks. Do not transplant shadow lifecycle semantics into retry or clocks. Test the actual adapter's return/cancellation behavior through exports.

### Arrival storage

**Apply to:** `src/runtime/arrivalAnchors.ts`, `test/runtime/arrivalAnchors.test.ts`.

`src/cloud/auth.ts:243–253` is the atomic replace/error boundary analog:

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

`test/cloud/auth.test.ts:111–120` supplies per-case real storage cleanup:

```typescript
async function createStoragePath(t: TestContext): Promise<string> {
  const storagePath = await mkdtemp(join(tmpdir(), 'basement-guardian-auth-'));

  t.after(async () => {
    await chmod(storagePath, OWNER_ALL_MODE);
    await rm(storagePath, { recursive: true, force: true });
  });

  return storagePath;
}
```

Use only necessary cleanup for the actual test. Do not add token permissions, salt, credential payloads, a new format, or a migration to anchors by analogy. Preserve `.basement-guardian-arrivals.json`, device keys, numeric wall timestamps, malformed-record semantics and current write ownership. Assert complete stored bytes when bytes are the contract; independently specify restored maps when map behavior is the contract.

### Monitoring projection

**Apply to:** `src/runtime/monitoringHealth.ts`, `test/runtime/monitoringHealth.test.ts`.

`src/cloud/shadow.ts:456–458` derives the public answer from owned facts:

```typescript
    get connected(): boolean {
      return !closing && (connection?.live ?? false);
    },
```

`test/cloud/shadow.test.ts:638–644` captures public observations before and after a transition:

```typescript
    // act
    await connected(transports[0]);
    const whileUp = client.connected;
    transports[0]?.close();

    // assert
    assert.deepStrictEqual({ whileUp, afterClose: client.connected }, { whileUp: true, afterClose: false });
```

Preserve independent wall/elapsed bases, restart anchors and per-device silence. Use two distinct devices and independently written whole verdicts to discriminate cross-device leakage. Monitoring-path failure is not device offline state. Admission must retain a restored anchor; only actual arrivals advance the arrival record. Avoid importing this shadow-specific boolean formula into monitoring health.

### Account composition

**Apply to:** `src/runtime/accountRuntime.ts`, `test/runtime/accountRuntime.test.ts`.

The scheduling/lifecycle excerpts above supply factory ownership and context timer tests. `src/cloud/shadow.ts:370–374` supplies the post-await ownership guard:

```typescript
    if (isCurrent(target)) {
      target.live = true;
      options.retry.reset();
      options.onConnected();
    }
```

`src/cloud/shadow.ts:471–475` supplies memoized owned close:

```typescript
    close(): Promise<void> {
      closing = true;
      ending ??= connection === undefined ? Promise.resolve() : connection.transport.end();

      return ending;
```

`test/cloud/shadow.test.ts:947–954` demonstrates rejecting a replaced connection's late completion:

```typescript
    // act
    await connected(transports[0]);

    // assert
    assert.deepStrictEqual(
      { subscriptions: transports[0]?.subscribed.length, lifecycle },
      { subscriptions: 1, lifecycle: ['connected', 'disconnected transport-closed', 'connected'] },
    );
```

Runtime retains its actual lifecycle predicates, root cancellation, terminal-auth distinction, awaited restore before launch, removal callback before exact-device pruning, secret registration, reported authority and one potentially delivered command attempt. Do not add retries or optimistic canonical updates. Full initial and correction review covers all 1,283 source lines and all 3,365 owner lines. Sequential repair plans share one ACCOUNT ledger and continuous correction counter.

## Shared Patterns

### Headers and imports

Copy the exact section spacing in `src/cloud/auth.ts:1–23` and `test/cloud/shadow.test.ts:1–22`: SPDX line, blank line, separate copyright JSDoc, blank line, overview JSDoc, blank line, imports. For original work:

```typescript
// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Manages authentication and the token cache.
 */
```

Replace only the overview purpose with the actual file purpose. Preserve existing license/attribution boundaries. Relative imports retain `.js`; type-only imports use `import type`. Do not copy unrelated auth/cloud imports into runtime. Review actual helpers and owners separately from the source-only packaging gate.

### Auth, validation and errors

No HTTP-controller auth middleware applies. Runtime composes the existing auth client; no new account/session implementation is needed. `src/cloud/auth.ts:148–156` narrows unknown stored JSON by `isRecord`, field checks and finite-number validation. `src/cloud/auth.ts:243–253` above scopes catch to the operation and cleans up before rethrow. Preserve actual target failure semantics rather than applying catch/retry mechanically. Fixed safe classification messages do not authorize raw response or identifier disclosure.

### Review and evidence ownership

Recommended dependency order is PORTS (four pairs), POLICIES (three), TRUST (two), ACCOUNT (one), then aggregate seal. Plan count remains planner discretion. Full initial review precedes repair. Reviewers and typed fixers load complete style, comment, unit writer/reviewer and local-verification books. A correction with open findings that does not reduce them, a reopened fix, or correction round four stops ALL work, even if round four is clean. New causes and sequential account plans never reset the counter.

For a real bug, observe active intended RED against unchanged production, retain complete native output/patch/command/exit/blob/version evidence, and commit planning-only evidence before minimum GREEN production plus active-test commit. Keep assertion controls separate; restore exact source bytes, rebuild and prove GREEN. Normal hooks and clean required pre-step remain mandatory. No tests or controls were run for this map.

### Exact consumers and conditional paths

Research records 18 separate native source/test-project impact results at `/private/tmp/guardian-runtime-research-fallow.json`; repeated-project probes selecting production alone are distinct evidence. Refresh exact symbol/member/private-alias traces in both `tsconfig.json` and `tsconfig.test.json` before removal or public contract changes. Read structural callers too; named import counts do not cover inferred results such as `commands.send()`.

External adaptations are conditional, not assigned edits: actual consumers may include `src/platform.ts`, `src/accessories/controls.ts`, their mirrored owners, and existing feature Worlds or concern support. Declare only the exact required paths in the owning wave after tracing. Helpers under `test/runtime/` are conditional and currently absent; do not invent a generic helper directory. Every actual helper joins full review, header inspection and broad staged gates. The five-file cause budget includes ledger/report/evidence/helper and plan-amendment paths; split or amend before exceeding it.

### Verification scope

Execution uses fresh `npm run build:test`, exact compiled owners and `npm run test:coverage:direct -- <source> <owner>`. Every modified runtime pair runs alone at 100% lines/functions/branches; declaration-only results remain honest. Shared helper changes select broad obligations. Every combined code wave and phase end requires full `npm run check` on current inputs. Selected-pair results do not refresh merged `coverage/direct.lcov`. Reuse evidence only for exact unchanged inputs under local-verification.

## No Analog Found

No target lacks an actionable bounded pattern. Completed standalone system wall-clock/monotonic-clock adapters and a full account orchestrator equivalent were not found. Their partial/role matches above do not establish runtime policy; use CONTEXT, canonical decisions and existing public contracts for those semantics.

No helper or external adaptation is created by this map. No new product behavior, package, live vendor request, private input, hardware check, persistence migration or release permission is implied. Source privacy/release narratives require actual canonical history. WINDOWS 46/47 remain OPEN/unwaived; missing early hook streams and independently unconfirmed historical Gemini counts remain historical limits. Phase 3 human judgments do not preapprove Phase 4 findings.

## Metadata

**Analog search scope:** tracked cloud, device and persistence sources/owners; current runtime inventory for preservation boundaries.
**Tracked-source gate:** `git ls-files -- <paths>` returned all eleven named analog source/owner paths: auth, shadow, cloud types, device health, registry, persistence context and their selected owners. None is an install/runtime mirror.
**Strong pattern families:** public declarations/compiler checks; guarded lifecycle; atomic storage; failure streams; deterministic time observations. Search stopped at these families.
**Inventory:** 20 core files / 6,929 lines, unchanged source sizes at mapping revision. All 20 classified; full independent execution review remains pending.
**Resources:** Read-only shell inspections only; no child agents, builds, tests, mutations, installs, commits or retained execution sessions. Only this pattern artifact was written.
