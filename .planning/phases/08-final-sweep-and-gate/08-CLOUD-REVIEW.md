# Phase 08 CLOUD complete-file review

**Reviewer:** `/root/phase8_plan02`, an in-session reviewer who did not edit the assigned source or test files.
**Committed revision read:** `38469d73c2ca1f3e3187f4ed93cc5107b450120a`.
**Method:** Read each complete committed file at the listed Git blob, including the test helpers. The manifest's CLOUD paths, line counts, and blobs matched `HEAD:path` before review. This is round-zero discovery; no production or test file was changed.

## Shard A complete-file ledger

| Path | Complete lines read | Full blob | Reviewer | Finding count and IDs |
| --- | --- | --- | --- | --- |
| src/cloud/auth.ts | 1-596 | 45316e06710b9ec6da56eb257376e776bab2e74d | /root/phase8_plan02 | 0, clean |
| test/cloud/auth.test.ts | 1-1550 | 67412b337bd8d51f8863a66328fece53062730a7 | /root/phase8_plan02 | 0, clean |
| src/cloud/shadow.ts | 1-478 | 018f49c720f0119fb131b4f03dfbc3966a98dadc | /root/phase8_plan02 | 0, clean |
| test/cloud/shadow.test.ts | 1-1146 | efecee5e0f6dfebc70ae1427f222cea7fd5a8bec | /root/phase8_plan02 | 0, clean |
| test/cloud/alpnServer.ts | 1-138 | d505578dcd20954593df1bfba7f6536b359013e8 | /root/phase8_plan02 | 0, clean |

The long test files were read in contiguous spans: `auth.test.ts` 1-400, 401-800, 801-1200, 1201-1550; `shadow.test.ts` 1-400, 401-800, 801-1146. Each row above records the union, 1-N.

## Shard A contracts and dispositions

`createAuthClient` obtains and shares the password-realm grant, validates token lifetime and finite expiry, writes an owner-only cache, and registers each distinct bearer token before returning it. Its caller in `src/runtime/accountRuntime.ts:1303-1318` injects the Homebridge storage path, redacting logger, clock, and HTTP dispatcher. Terminal refusal reaches the runtime guard at `src/runtime/accountRuntime.ts:746-768`; throttling reaches the long-delay branch at `:1072-1090`. The runtime logs fixed text instead of arbitrary error messages. Abort handling keeps a joined grant alive until its final caller leaves. The owner tests exercise those paths, cache permissions, invalid grants, cancellation, and the loopback ALPN boundary.

`createShadowClient` routes only accepted reported state and ignores rejected or unrelated topics. It narrows corrupt reported sections, passes a finite version or `undefined` to the device store, and marks a connection ready only after subscription and complete-shadow requests. `src/runtime/accountRuntime.ts:858-900` applies the routed patch to `src/device/state.ts:346-357` and records per-device arrival; `src/device/state.ts:247-270` prevents an empty telemetry section from acquiring the shadow watermark. The disconnect consumer releases the fleet's shadow source at `src/runtime/accountRuntime.ts:811-829`. The shadow tests distinguish handshake refusal, subscription failure, reconnect, late old-connection callbacks, requested state, and invalid documents.

No shard A candidate met the finding threshold. The following reviewed concerns were rejected without allocating an ID:

| Candidate | Exact rule and location | Disposition and evidence |
| --- | --- | --- |
| Vendor `error` text in an authentication exception could reach a log | `AGENTS.md` §Project, Privacy; `38469d73:src/cloud/auth.ts:287-290,346-364` | Rejected for this revision. `src/runtime/accountRuntime.ts:746-768,1072-1095` consumes the typed error and emits fixed messages. `test/cloud/auth.test.ts:1180-1193` asserts the response description and credentials stay out of logs. There is no demonstrated public or accessory path for the exception text. |
| A metadata-only shadow document could refresh an arrival timestamp | `AGENTS.md` §Project, Safety semantics; `38469d73:src/cloud/shadow.ts:197-205,275-284` | Rejected as a CLOUD defect on current evidence. The parser preserves section absence, while `src/device/state.ts:247-270` refuses telemetry ownership without `data`. The runtime's arrival rule treats a routed message as live-path evidence. The earlier measured vendor stream in `02-REVIEW.md` did not show metadata-only delivery. This concern can be reopened if a real payload establishes the missing condition. |

## Bounded cross-boundary reads

These are consumer reads, not complete-file ownership: `38469d73:src/runtime/accountRuntime.ts:253-300,430-500,746-770,811-900,966-999,1072-1158,1295-1345`; `38469d73:src/device/state.ts:17-129,189-270,337-407`. They cover grant and credential injection, inventory admission, command outcome, shadow arrival and release, and telemetry ownership. The RUNTIME and DEVICE batches retain complete-file ownership.

## Verification to date

At Node `v26.12.1`, `npm run build:test` exited 0. The first direct coverage attempt for `src/cloud/auth.ts` failed because the sandbox denied a loopback bind (`listen EPERM 127.0.0.1`), with 68 owner cases passed and one environmental failure. The same CLOUD direct-pair command was rerun with loopback permission; all eight CLOUD pairs exited 0. This does not claim a combined repository gate.
