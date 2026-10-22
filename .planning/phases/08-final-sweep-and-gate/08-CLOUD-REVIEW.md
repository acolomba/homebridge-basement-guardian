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

## Shard B complete-file ledger

| Path | Complete lines read | Full blob | Reviewer | Finding count and IDs |
| --- | --- | --- | --- | --- |
| src/cloud/api.ts | 1-215 | 4e694267cb62e62007117e2ff446638b5d7c4822 | /root/phase8_plan02 | 0, clean |
| src/cloud/errors.ts | 1-79 | 9c436addbc88097a43f0014e56ee1a97b7b8ff3f | /root/phase8_plan02 | 0, clean |
| src/cloud/httpDispatcher.ts | 1-31 | af30f746317a694f726066f3c4f6f377ddf95f13 | /root/phase8_plan02 | 0, clean |
| src/cloud/mqttTransport.ts | 1-211 | 1fabd5e989208c5c3813a1322a4b22388faa49f0 | /root/phase8_plan02 | 0, clean |
| src/cloud/sigv4.ts | 1-94 | 4906248e564bfbab863ce9898be0d952d2ca498e | /root/phase8_plan02 | 0, clean |
| src/cloud/types.ts | 1-189 | 1bf3ce8c30180281c03568ae050c46461ce9184f | /root/phase8_plan02 | 0, clean |
| test/cloud/api.test.ts | 1-1093 | 090cfd88a72a94befe2046fa553315915d96faa6 | /root/phase8_plan02 | 0, clean |
| test/cloud/apiSeeds.ts | 1-122 | a3687ee3f61ed2e70da722f52d51d56f56d8be6a | /root/phase8_plan02 | 0, clean |
| test/cloud/errors.test.ts | 1-150 | e21969678faa9684411b190076c63d81b05fc79b | /root/phase8_plan02 | 0, clean |
| test/cloud/httpDispatcher.test.ts | 1-135 | 8b5ace6810b5d30e9fbd3ba5983dccef3371da95 | /root/phase8_plan02 | 0, clean |
| test/cloud/mqttTransport.test.ts | 1-605 | af244e8f1eff500db769a731d100c394b927c331 | /root/phase8_plan02 | 0, clean |
| test/cloud/sigv4.test.ts | 1-178 | 3c5f959248ace911a2174a9f9d111e47efd64c8c | /root/phase8_plan02 | 0, clean |
| test/cloud/sigv4Seeds.ts | 1-31 | a171af6b884ec29f307b959f2399c99459087507 | /root/phase8_plan02 | 0, clean |
| test/cloud/types.test.ts | 1-347 | 497baeed84580e7e5c557f6067f0495f06ee7c87 | /root/phase8_plan02 | 0, clean |

The long B test files were read in contiguous spans: `api.test.ts` 1-400, 401-800, 801-1093; `mqttTransport.test.ts` 1-310, 311-605. The `sigv4.test.ts` output was revisited at 28-68 after an output limit clipped that span. Each ledger row records its complete 1-N read.

## Shard B contracts and dispositions

`createCloudApi` limits the REST surface to inventory, single-device read, AWS credentials, and one-shot command. `src/cloud/api.ts:82-87` rejects URL control segments, and `:149-173` passes one composite deadline through authentication and HTTP. `:116-136` returns only schema-checked success bodies or fixed route/status errors. The API owner tests cover complete request method, headers, body, URL, cancellation, failed-body cleanup, and the loopback ALPN path. `src/runtime/accountRuntime.ts:430-500,1098-1158` uses inventory and command outcomes; `:966-999` registers temporary credentials before storing them and starting the shadow connection.

`src/cloud/types.ts:130-189` narrows wire envelopes, keeps telemetry opaque, and drops extra wire keys during normalization. `src/device/state.ts:198-214,337-355` copies the incoming identity, connectivity, and telemetry into the canonical store. `src/cloud/mqttTransport.ts:113-136,161-210` bounds subscribe/publish callbacks and ends a pending handshake forcibly; the shadow client handles late callbacks through its current-connection guard. `src/cloud/sigv4.ts:71-94` signs the bare broker host, fixed path and canonical query with temporary credentials. Its tests compare the complete signed bytes with independently written expectations and vary the signing inputs.

No shard B candidate met the finding threshold. These concerns were rejected without allocating an ID:

| Candidate | Exact rule and location | Disposition and evidence |
| --- | --- | --- |
| A JSON `1e309` connectivity timestamp passes the numeric wire guard | `AGENTS.md` §Project, Safety semantics; `38469d73:src/cloud/types.ts:130-149` | Rejected as an unproven observable defect. The device timestamp is kept separate from local receipt time at `src/device/state.ts:198-214`; the reviewed runtime and store freshness decisions do not use it. Phase 02's `02-API-REVIEW.md` §Consumer and candidate dispositions expressly left a finite-connectivity restriction unintroduced for lack of a proven vendor or consumer contract. A concrete timestamp consumer or payload would reopen this concern. |
| A malformed credential expiration string passes the string guard | `.agents/skills/typescript-unit-tests/rules/review.md` §Classifying findings; `38469d73:src/cloud/types.ts:181-184` | Rejected as a test-gap claim. `src/runtime/accountRuntime.ts:314-324` recognizes an unparsable expiration and chooses the configured minimum rotation delay. The credentials response guard promises wire shape, not a parsed expiration. |
| A late MQTT callback could settle after its deadline | `AGENTS.md` §Project, Safety semantics; `38469d73:src/cloud/mqttTransport.ts:113-135` | Rejected as a live-state defect. The operation promise is already settled by the deadline; `src/cloud/shadow.ts:352-375` releases the connection, and `:224-230,391-412` blocks callbacks from the released connection from changing state. |

## Applied rules and final disposition

The review applied `AGENTS.md` §General, §Project and §Build verification; `.agents/skills/typescript-style/SKILL.md` plus `rules/modules-and-data.md` (files/modules and data), `classes.md`, `functions.md` (control flow and errors), `types.md`, `naming-and-docs.md`, `comments.md`, and `review.md`; `.agents/skills/typescript-unit-tests/SKILL.md` plus `rules/pairing-and-design.md`, `tools.md`, `cases.md`, `test-doubles.md`, `boundaries.md`, and `review.md`. Every reviewed TypeScript file has the Phase 1 SPDX line, separate copyright block, and brief `@fileoverview`; attribution is unchanged. The toolchain quick scan found only justified `eslint-disable` lines and the described test-only `@ts-expect-error`.

**Round-zero CLOUD disposition:** 19 current paths read completely at the recorded blobs; zero accepted `CR-08-CLOUD-NNN` IDs; zero open CLOUD findings; five reasoned candidate rejections; no CLOUD repair or correction round started. Plan 08-09 owns central reconciliation, and any later source/test change requires a fresh complete-file row at its new blob. This report does not close GATE-02 for the whole repository.
