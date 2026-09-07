# Phase 1: Secure Cloud Foundation - Research

**Researched:** 2026-08-28
**Domain:** Homebridge dynamic-platform runtime, Auth0 password-realm authentication, AWS IoT MQTT-over-WebSocket device shadows, abortable long-lived lifecycles, Cucumber transport-level test harness
**Confidence:** HIGH on the load-bearing decisions (AWS IoT client, tooling gates, packaging, Cucumber harness); MEDIUM on vendor-specific protocol behavior that only hardware can confirm

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Template teardown**

- **D-01:** Remove the template scaffold completely. Delete `src/platformAccessory.ts`, `EXAMPLE_DEVICES`, the Lightbulb service, both example motion sensors, and the unmanaged `setInterval(…, 10_000)` loop. `src/platform.ts` becomes a composition root that owns config validation, the restored-accessory map, and `AccountRuntime` start/stop. This is step 1 of the intel's implementation sequence.
- **D-02:** Remove `homebridge-lib` entirely in this phase — the `EveHomeKitTypes` import in `src/platform.ts`, the `src/@types/homebridge-lib.d.ts` shim, and the `dependencies` entry in `package.json`. Full teardown orphans its only consumer, and `D-033` requires removal regardless. Update the STATE.md pending todo to record that this closed in Phase 1 instead of Phase 6. — **Reversibility:** reversible — re-adding a dependency and a type shim is a local change.
- **D-03:** Phase 1 registers no platform accessories. `configureAccessory()` records restored accessories in the map and nothing else. Do not call `unregisterPlatformAccessories` for any reason — the conservative removal policy is a Phase 2 deliverable (`DEV-05`, `D-029`), and Phase 1 must not delete anything from a user's HomeKit.
- **D-04:** `config.schema.json` carries only the Phase 1 fields: `strictValidation: true`, a `headerDisplay` stating that Homebridge stores the password in plain text in `config.json` and in backups, then `name`, `email` (`format: email`), `password` (`widget: password`), `clientId`, `pollInterval` (`placeholder` 900, not `default`), and `offlineConfirmationPollCount` (`default` 2). `ignoredFaults` is deferred to Phase 3 with `CONF-06`. — **Reversibility:** costly — field names and shapes become a user-facing config contract as soon as a `0.x` prerelease ships under `D-026`; renaming one later requires a migration note and breaks existing `config.json` files.

**Cloud transport**

- **D-05:** The AWS IoT client library is **not chosen during discussion**. It goes to `gsd-phase-researcher` as an explicit directive — see the research directive block below. Do not let planning assume a library. — **Reversibility:** one-way — the choice determines whether credential rotation can happen in place or requires reconnect, which is the load-bearing behavior in `SYNC-04`; changing it after `ShadowClient` and its transport-level test harness exist means rewriting both.
- **D-06:** The REST client uses Node's built-in global `fetch` with `AbortSignal`, behind a small typed wrapper owning base URL, `Authorization` header, timeouts, and redacted error reporting. No HTTP dependency. The `D-038` 2.5-second command deadline comes from `AbortSignal.timeout()`.
- **D-07:** The bundled public protocol constants (`apiUrl`, `clientId`, `auth0Domain`, `auth0Realm`, `awsRegion`, `protocol`) live in a single JSON data file imported via `resolveJsonModule` and shipped in the package. `REL-04` already carves out "the bundled data file alone may contain required public vendor constants", so secret and identifier scans get one known allowlist path.
- **D-08:** The Auth0 token cache file stores the `id_token`, its expiry, and a salted hash of the configured account email. A changed email in `config.json` invalidates the cache instead of silently reusing the previous account's token for up to its 30-day lifetime. Unreadable, malformed, expired, or fingerprint-mismatched means log at debug and re-authenticate — never a hard failure. File lives under `api.user.storagePath()` with owner-only permissions where the OS supports them (`AUTH-02`).

**Testing**

- **D-09:** Unit tests compile then run: `tsc` emits, `node --test` runs the emitted JavaScript with source maps for stack traces. This preserves the full TypeScript language. Native strip-only mode was rejected on verified evidence — Node rejects both `TypeScript parameter property is not supported in strip-only mode` and `TypeScript enum is not supported in strip-only mode`, which would force constructor DI away from parameter properties and force `const enum` service subtypes into `as const` objects. A second tsconfig emits `test/` alongside `src/`. — **Reversibility:** costly — switching later means touching every test file's build path plus CI.
- **D-10:** The Cucumber fake-pump harness is built in Phase 1. Phase 1 is the cloud layer, so the fake cloud is its natural companion, and success criteria 3 and 4 are close to untestable without it. Phase 1 scenarios assert runtime behavior with no HomeKit involved: partial-shadow merge preserving omitted fields, `desired` values never becoming reported state, credential rotation, reconnect with capped backoff, and shutdown with no unhandled rejection.
- **D-11:** Fakes are layered. Unit tests inject fake `AuthClient`, `CloudApi`, and `ShadowClient` through constructor DI — fast, deterministic, no sockets. Cucumber fakes at the transport level instead: a local HTTP server for Auth0 and REST, an in-process MQTT broker for the shadow. The transport-level tests therefore never name the SDK and survive whatever D-05 resolves to. — **Reversibility:** costly — the seam determines what the whole harness is written against.
- **D-12:** `npm test` runs **both** the unit suite and the Cucumber suite. `npm run check` keeps its current composition (`typecheck`, `lint`, `fallow`, `format:check`, `test`) and therefore covers both. Nothing can be skipped by accident.

**Failure and retry behavior**

- **D-13:** An Auth0 credential rejection (`invalid_grant`) stops authentication. Log one actionable error naming the fix, delete the cached token, and make no further attempt until Homebridge restarts or the configuration changes. Rationale, verified during discussion: Auth0 brute-force blocks persist for 30 days from the *last* failed attempt, so a retrying plugin permanently prevents the block from clearing. Saving config in the Homebridge UI restarts the bridge, so the user's natural fix already re-triggers a start.
- **D-14:** Sustained transient failures log once at warn with the reason, drop consecutive same-kind failures to debug, emit one warn-level reminder every 15 minutes while still failing, and log recovery at info. A 30-second backoff must not produce 120 warn lines per hour.
- **D-15:** If REST discovery succeeds but the shadow connection does not, the runtime stays up and runs degraded on REST only. REST polling is the state source, the shadow is retried on capped backoff in the background, and the degraded monitoring path is logged once. `SYNC-03` already treats REST as the reconciliation backstop. — **Reversibility:** costly — the set of runtime states Phase 5 consumes for `RES-03`/`RES-04` is shaped here.
- **D-16:** Configuration that is out of range or structurally invalid causes the plugin to refuse to start, exactly like missing credentials: log one actionable error and start nothing. `strictValidation: true` only guards the UI form, so hand-edited `config.json` reaches the runtime. **This deliberately overrides the clamping approach shown in the intel's `Math.max(300, cfg.pollInterval ?? 900)` snippet** — do not clamp, and do not silently substitute defaults for supplied-but-invalid values. Absent optional fields still take their documented defaults.

**Architecture**

- **D-17:** Adopt the `ARCHITECTURE` source tree, scaffolded in full during Phase 1: `src/{index,settings,config,platform}.ts`, `src/runtime/{accountRuntime,retryPolicy}.ts`, `src/cloud/{auth,api,shadow,types}.ts`, `src/device/{state,events,health,family,gemini,halo}.ts`, `src/accessories/{basementGuardian,services}.ts`, `src/persistence/accessoryContext.ts`. The flatter `PLUGIN` tree was rejected because folding `AccountRuntime` into `platform.ts` recreates the `homebridge-nest` connection-monolith failure mode the intel calls out. **See the tooling conflict below — scaffolding unreferenced modules fails an existing quality gate, and the planner must resolve that explicitly.**
- **D-18:** Secret redaction is structural, not a convention. All plugin logging goes through one redacting wrapper that scrubs registered secret values and known patterns (`Bearer` tokens, `AccessKeyId`, `SecretAccessKey`, `SessionToken`, authentication request bodies) before delegating to Homebridge's `Logging`. This is directly testable, which `REL-02` already requires as a "Secret handling" test group. — **Reversibility:** costly — every log call site routes through it.
- **D-19:** `DeviceStateStore.subscribe(deviceId, listener)` notifies with `(next, previous, changedKeys)`. Phase 1 shallow-compares the merged data object and reports which keys changed; it does not decide relevance, because no family adapter exists yet to define it. Phase 3 derivations filter on `changedKeys` rather than re-diffing snapshots, which is where duplicate activation records otherwise come from. — **Reversibility:** costly — this contract is consumed by Phases 2 through 5.
- **D-20:** The Phase 1 canonical snapshot is a typed envelope around opaque data. Type only what Phase 1 genuinely owns — `deviceId`, `deviceTypeId`, `name`, `serialNumber`, `connectivity`, device timestamps, and local receipt time kept separate from device time — and carry `reported.data` as a validated-shape record with **no field decoding**. Gemini field typing and strict validation belong to Phase 2 (`DEV-02`, `DEV-03`); pulling them forward would put safety-critical `water_level` decoding in a phase whose success criteria do not cover it. — **Reversibility:** costly — Phase 2's family adapter is written against this shape.

**Tooling conflicts the planner must resolve** (verbatim from CONTEXT.md)

- **`D-17` versus the dead-code gate.** `.fallowrc.json` declares `entry: ["src/index.ts"]`, and `npm run check` runs `fallow dead-code --fail-on-issues`. Scaffolding modules that nothing imports yet will fail that gate. Resolve deliberately: scoped `.fallowrc.json` ignores for not-yet-wired modules, placeholder modules that export a real typed contract already referenced by the store or runtime, or an agreed narrowing of what "scaffold it all" means. Whatever is chosen, `npm run check` must pass at the end of the phase.
- **`.npmignore` does not exclude `features/`.** It excludes `test/` and `tests/`, but Phase 1 creates `features/` (`D-10`), which would then ship in the packed package against `REL-04` and `REL-05`. Add the exclusion in Phase 1 since Phase 1 creates the directory.
- **No `files` field in `package.json`.** Packaging is `.npmignore`-driven. The new JSON constants data file (`D-07`) must be confirmed present in `npm pack --dry-run` output, and `config.schema.json` must remain included.

### Claude's Discretion

- The injectable clock's shape and how it reaches retry, timeout, and heartbeat-age code.
- Whether the REST poll timer and the credential rotation timer share one scheduler.
- Whether `AccountRuntime` exposes only start/stop or also a health projection for Phase 5.
- Internal module naming, error type hierarchy, and the exact typed-wrapper API for `fetch`.
- Backoff constants, subject to the intel's capped shape `Math.min(30_000, 1000 * 2 ** (attempt - 2))` with a re-entrancy guard, since `error` and `close` both fire.

### Deferred Ideas (OUT OF SCOPE)

- `ignoredFaults` configuration field and its seven-slug enum — Phase 3, with `CONF-06`.
- Conservative cached-accessory removal, including the two-successful-inventory policy and the final current-inventory check — Phase 2 (`DEV-05`, `D-029`).
- Family registry, startup validation ladder, and the `water_level` legal-value domain check — Phase 2 (`DEV-02`, `DEV-03`).
- Offline confirmation using `offlineConfirmationPollCount` — the field is configured in Phase 1, but the behavior it drives is Phase 5 (`RES-03`).
- `package.json` license metadata alignment with `D-035`, and removal of `private: true` — Phase 6.
- Backup-battery fault adapter proposal (`battery_health == 32`) — open proposal, resolves during Phase 3 discussion.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONF-01 | Dynamic-platform package, TypeScript ESM, supported runtimes, main or child bridge | Platform skeleton pattern (§Architecture Patterns, Pattern 1); `engines` already correct; `tsconfig` already `nodenext` |
| CONF-02 | One vendor account in the Settings GUI with strict validation, masked password, plaintext disclosure | `config.schema.json` reference in intel §3; `widget: password`, `format: email`, `strictValidation: true`, `singular: true` |
| CONF-03 | Absent credentials → clear error, no network/timer/accessory work | Constructor bail-out before registering listeners (Pattern 1); Homebridge Verified "must not start unless configured" |
| CONF-04 | Optional `clientId` override, no other vendor constants exposed | D-07 bundled JSON constants; verified `resolveJsonModule` + `with { type: 'json' }` requirement and `dist/` emission |
| CONF-05 | `pollInterval` 300–3600 (~900 default), `offlineConfirmationPollCount` 1–8 (2 default) | D-16 refuse-on-invalid; `placeholder` vs `default`; runtime validation module `src/config.ts` |
| AUTH-01 | Unattended Auth0 password-realm auth, cached token reuse, reauth before/after expiry | Verified Auth0 grant shape (intel §3); verified brute-force block semantics; D-13 stop-on-`invalid_grant` |
| AUTH-02 | Token only under Homebridge storage path, owner-only permissions, no secrets in logs/context | Verified `api.user.storagePath()`; verified `writeFile({mode})` pitfall on existing files; D-18 redacting logger wrapper against the verified `Logging` interface shape |
| SYNC-01 | Typed REST operations for inventory/snapshots, commands, AWS credentials; no excluded routes | D-06 `fetch` + `AbortSignal`; four routes from intel §4; `AbortSignal.any` composition verified |
| SYNC-02 | One canonical snapshot per device; merge partial `reported`, ignore `desired`, preserve omitted fields | State-store rules from intel; verified shadow `update/accepted` payload shape; verified v1 shadow version/stale-discard behavior |
| SYNC-03 | Full shadow after startup and reconnect; REST poll as reconciliation backstop; no replay assumption | Verified `$aws/things/{thing}/shadow/get` + `/get/accepted`; verified mqtt.js `resubscribe` restores subscriptions but AWS replays nothing |
| SYNC-04 | Credentials rotate in place ~10 min before expiry; failed refresh stays scheduled; capped reconnect, no duplicate loops | **AWS IoT Client Decision** section — full answer with AWS citation, `aws-crt` status, and the recommendation |
| SYNC-05 | Idempotent abortable lifecycle over shutdown, partial startup, timers, subscriptions, retries, commands, socket | Verified `AbortSignal.any`, `timers/promises.setTimeout({signal})`; `api.on('shutdown')` sole teardown owner; stop-path ordering from intel |

</phase_requirements>

## Summary

Phase 1 is a long-lived cloud runtime bolted onto a Homebridge dynamic platform. Almost all of the risk sits in three places: the AWS IoT transport choice (`D-05`, unresolved by design), the abortable lifecycle that has to survive partial startup and repeated shutdown (`SYNC-05`), and the existing repository quality gates, which are considerably stricter than the CONTEXT.md discussion assumed. Research found three separate hard gate failures that Phase 1 will hit on its first commit and that no one has recorded yet: typed ESLint refuses to parse any `.ts` file outside `tsconfig.json`'s `include`, `@typescript-eslint/no-floating-promises` fires on every `node:test` `test()` call, and `npm pack` currently ships 735 files from `.claude/` plus `research.tar.gz`. Each is verified and each has a one-line fix, but they are plan tasks, not surprises for an executor.

The AWS IoT question resolved cleanly and in the user's favor. AWS documents that a SigV4-authenticated MQTT connection lasts "Up to 24 hours", far past the ~1-hour lifetime of the vendor's STS credentials, because SigV4 is validated only during the WebSocket handshake. Reading `aws-iot-device-sdk` v1's source settles the companion question: `updateWebSocketCredentials()` is three variable assignments consumed by the stream builder on the *next* connection attempt — it never touches the live socket. So "rotate in place" has always meant "keep the credential cache fresh without tearing down the connection", and every candidate library implements it identically. `aws-crt` 1.33.1 still has no JavaScript delegate credentials provider, and it additionally carries an npm `install` lifecycle script that compiles from source on 32-bit ARM, which collides with a Homebridge Verified rule. The recommendation is `mqtt` 5.x with `transformWsUrl` and roughly 35 lines of SigV4 presigning on `node:crypto`, verified end to end in this session.

The Cucumber harness is buildable but has one non-obvious trap. `aedes` works with `mqtt` over plain TCP immediately, and fails silently over WebSocket if you use `ws`'s `createWebSocketStream`: mqtt.js writes each CONNECT field as its own WebSocket frame, and aedes consumes exactly one chunk per `readable` event, so the handshake stalls forever with no error. A ~12-line coalescing `Duplex` bridge fixes it; that bridge was written and verified in this session along with a full shadow-topic round trip and a credential-rotation reconnect.

**Primary recommendation:** Use `mqtt` ^5.15.2 as the only new runtime dependency, sign the AWS IoT WebSocket URL yourself in `src/cloud/shadow.ts` via `transformWsUrl` reading a credential cache that the `SYNC-04` timer refreshes, and build the shadow protocol (`$aws/things/{deviceId}/shadow/get` + `/get/accepted` + `/update/accepted`, with shadow-`version` monotonicity) directly rather than reproducing `thingShadow`. `SYNC-04` needs no revision.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Homebridge lifecycle, cached-accessory map, config validation bail-out | Plugin host (`src/platform.ts`) | — | Only the platform sees `api`, `config`, and the restore callback; the intel's component table forbids it owning auth or merge rules |
| Account start/stop, poll timer, rotation timer, retry, root `AbortController` | Plugin runtime (`src/runtime/accountRuntime.ts`) | — | Keeping this out of `platform.ts` is the whole point of `D-17`; folding it in reproduces the `homebridge-nest` connection monolith |
| Auth0 password-realm grant and disk token cache | Cloud client (`src/cloud/auth.ts`) | Local filesystem under `api.user.storagePath()` | Credentials must not travel through the platform or the REST client; the storage path is a Verified requirement |
| Typed REST calls to the four vendor routes | Cloud client (`src/cloud/api.ts`) | — | `CloudApi` must not own retry loops or HomeKit state per the intel component table |
| AWS IoT connection, SigV4 presigning, credential rotation, shadow topics | Cloud client (`src/cloud/shadow.ts`) | AWS IoT message broker | Signing is ours because no library exposes a JS credentials delegate; the broker validates only at handshake |
| Snapshot merge, omitted-field preservation, `desired` rejection, change notification | Pure policy (`src/device/state.ts`) | — | No sockets, no timers, no HomeKit — this is the module the whole test suite leans on |
| Secret redaction | Cross-cutting wrapper around Homebridge `Logging` | — | `D-18` makes it structural; a convention cannot be tested, a wrapper can |
| Bundled protocol constants | Static data (`src/*.json`) | Build output (`dist/`) | `D-07`; verified that `tsc` copies the JSON into `outDir` so it ships automatically |
| HomeKit services, characteristics, family decoding | **Out of scope for Phase 1** | Phases 2–5 | `D-03` and `D-20` explicitly hold these back |

## AWS IoT Client Decision

> This is the priority output of this research. All three questions from the CONTEXT.md research directive are answered.

### Q1 — Does an established SigV4 MQTT-over-WebSocket connection survive expiry of the credentials that signed it?

**Yes.** AWS IoT validates SigV4 only during the WebSocket handshake; expiry of the signing credentials does not close an established connection. Three independent lines of evidence agree.

**1. AWS documents a SigV4 connection duration far longer than any STS credential lifetime.** The AWS IoT Core Developer Guide, *Device communication protocols → Connection duration limits*, publishes this table verbatim [CITED: docs.aws.amazon.com/iot/latest/developerguide/protocols.html]:

> **MQTT connection duration by authentication feature**
>
> | Feature | Maximum duration \* |
> | --- | --- |
> | X.509 client certificate | 1–2 weeks |
> | Custom authentication | 1–2 weeks |
> | Signature Version 4 | Up to 24 hours |
>
> \* Not guaranteed

A 24-hour ceiling is only coherent if the connection outlives the credentials that signed it. The vendor's STS credentials last approximately one hour [CITED: `.planning/intel/constraints.md` §5]; if AWS terminated the connection at credential expiry, the documented SigV4 maximum would be the credential lifetime, not 24 hours.

**2. The 24-hour figure is a hard service quota, not a heuristic.** The AWS General Reference *AWS IoT Core message broker and protocol limits and quotas* states [CITED: docs.aws.amazon.com/general/latest/gr/iot-core.html]:

> `WebSocket connection duration` | The WebSocket connection lifetime is 24 hours. If the lifetime is exceeded, The WebSocket connection will be closed. | 86400 Seconds | 86400 Seconds | No

The final `No` column means the quota is not adjustable. **Planning consequence:** even with flawless credential rotation, the shadow socket is forcibly closed at least once per day. A reconnect path is mandatory regardless of the library chosen, and the Cucumber suite should cover it.

**3. `updateWebSocketCredentials()` in `aws-iot-device-sdk` v1 never touched the live connection.** Reading the shipped source settles what the 90-minute hardware test actually observed [VERIFIED: `aws/aws-iot-device-sdk-js` `device/index.js:925-929`, fetched this session]:

```js
this.updateWebSocketCredentials = function(accessKeyId, secretKey, sessionToken, expiration) {
   awsAccessId = accessKeyId;
   awsSecretKey = secretKey;
   awsSTSToken = sessionToken;
};
```

Three assignments and nothing else. The `expiration` argument is accepted and discarded. Those variables are read in exactly one place — the stream-builder function that `mqtt.MqttClient` calls per connection attempt [VERIFIED: `device/index.js:633-661`]:

```js
function _wrapper(client) {
   var protocol = options.protocol;
   if (protocol === 'wss') {
      var url;
      if (awsAccessId === '' || awsSecretKey === '') {
         url = 'wss://no-credentials-available';
      } else {
         url = prepareWebSocketUrl(options, awsAccessId, awsSecretKey, awsSTSToken);
      }
      options.url = url;
   }
   ...
}
var device = new mqtt.MqttClient(_wrapper, options);
```

So v1's rotation API **only affected the next reconnect**. The hardware test's "one in-place rotation without an unplanned disconnect" was therefore evidence that AWS IoT left the connection alone, not evidence that the SDK re-signed anything.

**Conclusion for `SYNC-04`:** "rotate in place, do not reconnect" is achievable and is precisely what every candidate does. The phrase means *refresh the credential cache without tearing down the live socket*, not *re-sign a live socket*. No library re-signs a live socket, because AWS IoT never re-checks one.

### Q2 — Has `aws-crt` added a JavaScript delegate credentials provider after 1.33.1?

**No.** `aws-crt` is still at **1.33.1**, published **2026-07-31** — it is the latest release, not a stale pin [VERIFIED: `npm view aws-crt version time.modified`]. The shipped typings still carry the same disclaimer and the same four factories [VERIFIED: `aws-crt-1.33.1.tgz` → `package/dist/native/auth.d.ts`, downloaded and read this session]:

```ts
/**
 * Credentials providers source the AwsCredentials needed to sign an authenticated AWS request.
 *
 * We don't currently expose an interface for fetching credentials from Javascript.
 *
 * @category Auth
 */
export declare class AwsCredentialsProvider extends crt_native.AwsCredentialsProvider {
    static newDefault(bootstrap?: ClientBootstrap | undefined): AwsCredentialsProvider;
    static newStatic(access_key: crt_native.StringLike, secret_key: crt_native.StringLike, session_token?: crt_native.StringLike): AwsCredentialsProvider;
    static newCognito(config: CognitoCredentialsProviderConfig): AwsCredentialsProvider;
    static newX509(config: X509CredentialsConfig): AwsCredentialsProvider;
}
```

`WebsocketConfig.credentials_provider` is typed as a required `AwsCredentialsProvider` [VERIFIED: `package/dist/native/aws_iot.d.ts:17-19`], so vendor STS credentials can only enter through `newStatic()`, and rotating them means rebuilding the connection config and the connection.

**One escape hatch does exist and was not previously noted.** `aws-crt` exposes a JavaScript handshake hook [VERIFIED: `package/dist/native/mqtt.d.ts:98-103`]:

```ts
/**
 * Optional function to transform websocket handshake request.
 * If provided, function is called each time a websocket connection is attempted.
 * The function may modify the HTTP request before it is sent to the server.
 */
websocket_handshake_transform?: (request: HttpRequest, done: (error_code?: number) => void) => void;
```

This would let us sign the handshake ourselves in JavaScript, sidestepping `AwsCredentialsProvider` entirely. But note the docstring: *"called each time a websocket connection is attempted"* — it is per-connection, exactly like `transformWsUrl`. It removes v2's functional blocker at the cost of writing the same SigV4 code we would write for `mqtt`, while still carrying the native binary. It therefore erases v2's only remaining advantage.

**Two further findings weigh against `aws-crt`, both new:**

- **It runs an npm `install` lifecycle script.** [VERIFIED: `npm view aws-crt scripts.install` → `node ./scripts/install.js`] The script exits early when a prebuilt binary matches, otherwise it invokes `build.js` (CMake) [VERIFIED: `package/scripts/install.js:11-21`]. Prebuilt binaries ship for `win32-x64`, `linux-x64-glibc`, `linux-x64-musl`, `linux-arm64-glibc`, `linux-arm64-musl`, `darwin-x64`, `darwin-arm64` [VERIFIED: `find package -name '*.node'`] — **no 32-bit `linux-arm`**, which is still a common Homebridge host (Raspberry Pi running 32-bit Raspberry Pi OS). The Homebridge Verified checklist says: *"The plugin must not execute post-install scripts that modify the users' system in any way"* [CITED: `.planning/intel/context.md` §11]. An `install` script that may download a tarball and run CMake on the user's Pi is squarely what that rule targets, and `REL-06` requires meeting current Verified criteria.
- **Footprint.** 44.4 MB unpacked across 437 files [VERIFIED: `npm view aws-crt dist.unpackedSize dist.fileCount`], with runtime dependencies `axios`, `crypto-js`, `@httptoolkit/websocket-stream`, `buffer`, `process`, `@aws-sdk/util-utf8-browser` [VERIFIED: `package/package.json`]. `REL-03` requires a telemetry review of direct dependencies; `axios` in a privacy-sensitive plugin is an avoidable review burden.

### Q3 — Recommendation

**Use `mqtt` ^5.15.2 with `transformWsUrl`, and sign the AWS IoT WebSocket URL in-house on `node:crypto`. `SYNC-04` requires no revision.**

Because Q1 established that no library re-signs a live connection, the three candidates differ only in *how* they get fresh credentials into the next handshake — and `mqtt` is the only one that does it without either a maintenance-mode dependency or a native toolchain.

| Requirement | `aws-iot-device-sdk` v1 (2.2.16) | `aws-iot-device-sdk-v2` / `aws-crt` (1.28.0 / 1.33.1) | `mqtt` 5.15.2 |
|---|---|---|---|
| Fresh credentials on next connect without tearing down the live socket (`SYNC-04`) | Yes, via `updateWebSocketCredentials()` (three assignments) | Only by rebuilding the client, **or** by hand-signing in `websocket_handshake_transform` | Yes, via `transformWsUrl` reading a credential cache |
| Fresh vendor `clientId` on reconnect | Not exposed | Requires client rebuild | Yes — `client.options.clientId` is mutable inside the hook [VERIFIED: README example, tested] |
| Maintenance status | "This SDK will no longer receive feature updates, but will receive security updates" [CITED: `aws/aws-iot-device-sdk-js` README] — rejected by the user | Active | Active; 2.65 M weekly downloads |
| Install-time native build | No | **Yes** (`install` script; source build on 32-bit ARM) | No |
| Transitive `mqtt` pin | Exact-pins `mqtt@4.2.8` | n/a | We own the version |
| Footprint | ~pins an old `mqtt` | 44.4 MB unpacked | 14 MB installed, ~40 transitive packages, pure JS |
| SigV4 code we own | 0 lines | 0 lines (provider path) or ~35 lines (handshake-transform path) | ~35 lines, verified below |

`mqtt` is the transitive dependency v1 already ships, at a current version we control, minus the maintenance-mode wrapper. The cost is the SigV4 presigner and a small shadow-protocol layer — both of which are pure, deterministic, and directly testable, which is exactly the kind of code this project's test rules are built for.

**End-to-end verification performed this session.** A local `aedes` broker over WebSocket, an `mqtt` 5.15.2 client with `transformWsUrl`, a shadow-topic round trip, an in-cache credential rotation, and a forced reconnect all behaved as `SYNC-04` requires:

```
1) signs= 1 clientId= vendor-client-1 msgs= 1
2) after in-cache rotation: signs= 1 (unchanged => no reconnect) msgs= 2
3) after reconnect: signs= 2 clientId= vendor-client-2 msgs= 3
handshakes: [
  'X-Amz-Credential=AKIA1&X-Amz-Signature=sig1&X-Amz-Security-Token=tok1',
  'X-Amz-Credential=AKIA2&X-Amz-Signature=sig2&X-Amz-Security-Token=tok2'
]
```

Line 2 is the `SYNC-04` behavior: credentials rotated in the cache, the signer was not invoked, the socket was not touched, and shadow messages kept arriving. Line 3 is the reconnect: the rotated credentials and the new vendor client ID were used automatically, and `resubscribe` restored the subscription.

**Residual risks of this choice, stated plainly:**

- We own the SigV4 correctness. Mitigated by golden-vector unit tests under a fixed clock (verified deterministic below) and by the fact that a signing bug fails loudly at handshake with HTTP 403, not silently.
- We own the shadow-topic layer instead of `thingShadow`. Phase 1 needs a small subset (see §Architecture Patterns, Pattern 3), and the version/stale-discard rule is reproduced from the v1 source below.
- `mqtt` declares `@types/ws` and `@types/readable-stream` as production `dependencies`, pulling `@types/node` (~2.8 MB) into the runtime tree [VERIFIED: `du -sh node_modules/*` in a clean `npm install mqtt --omit=dev`]. Harmless, but it will show up in a dependency review.

**No revision to `D-015` or `SYNC-04` is needed.** `SYNC-04` says "Temporary AWS credentials rotate in place about ten minutes before expiry, failed refreshes remain scheduled, and reconnect retries are capped and protected from duplicate loops." Every clause is satisfiable and now verified. The only clarification worth adding to the plan (not the requirement) is that the 24-hour AWS WebSocket ceiling means a daily reconnect is normal and must not be logged as a fault.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `mqtt` | ^5.15.2 | MQTT 3.1.1 over WebSocket to AWS IoT; `transformWsUrl` re-signs each handshake | The reference JS MQTT client; 2.65 M weekly downloads; the same library `aws-iot-device-sdk` v1 wraps [VERIFIED: npm registry] |
| `node:crypto` | built-in | SigV4 presigned URL for `iotdevicegateway` | `@aws-sdk/signature-v4` cannot presign AWS IoT — it always places `X-Amz-Security-Token` in the canonical query string [CITED: github.com/aws/aws-sdk-js-v3/issues/3417] |
| `fetch` / `AbortSignal` | built-in | REST client with per-request deadlines and root-signal composition | `D-06` locked; `AbortSignal.any` and `AbortSignal.timeout` both present [VERIFIED: runtime probe] |
| `node:timers/promises` | built-in | Abortable retry and poll waits | `setTimeout(ms, undefined, { signal })` rejects with `AbortError` / `ABORT_ERR` [VERIFIED: runtime probe] |

### Supporting (development only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@cucumber/cucumber` | ^13.2.1 | Fake-pump BDD suite (`D-10`) | `engines: node "22 \|\| 24 \|\| >=26"` matches the project range [VERIFIED: npm registry] |
| `aedes` | ^1.1.1 | In-process MQTT broker for the fake shadow (`D-11`) | `"type": "module"`, ships its own `aedes.d.ts`, no install scripts [VERIFIED: npm registry] |
| `ws` | ^8.21.3 | WebSocket server for the fake broker | Already a transitive dependency of `mqtt`; needed explicitly for the server side |
| `strong-mock` | ^9.2.2 | Strict interaction mocks | **Mandated** by `.claude/rules/typescript-unit-testing.md`; not currently installed [VERIFIED: `package.json` has no such entry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `mqtt` + own SigV4 | `aws-iot-device-sdk` 2.2.16 | Zero signing code, but maintenance mode and an exact `mqtt@4.2.8` pin; rejected by the user |
| `mqtt` + own SigV4 | `aws-iot-device-sdk-v2` 1.28.0 | Native binary, `install` lifecycle script, no JS credentials delegate, 44 MB, `axios` |
| Own SigV4 | `@aws-sdk/signature-v4` | Cannot produce an AWS IoT presigned URL; the token must be appended after signing |
| Own shadow layer | `thingShadow` from v1 | Would reintroduce the rejected dependency for ~120 lines of topic plumbing |
| `aedes` | Real AWS IoT in CI | `REL-02` forbids live credentials, hardware, or public network access in the deterministic suite |
| `aedes` | `mosquitto` subprocess | External binary; `REL-02` wants no developer setup |

**Installation:**

```bash
npm install mqtt
npm install --save-dev @cucumber/cucumber aedes ws strong-mock
npm uninstall homebridge-lib   # D-02
```

**Version verification (this session, `npm view <pkg> version`):** `mqtt` 5.15.2 (published 2026-07-06), `aedes` 1.1.1 (2026-07-06), `ws` 8.21.3 (2026-08-07), `@cucumber/cucumber` 13.2.1 (2026-08-04), `strong-mock` 9.2.2 (2026-04-29), `aws-crt` 1.33.1 (2026-07-31), `aws-iot-device-sdk-v2` 1.28.0 (2026-08-04), `aws-iot-device-sdk` 2.2.16 (2026-06-22).

## Package Legitimacy Audit

Run via `gsd-tools query package-legitimacy check --ecosystem npm …` plus `npm view <pkg> time.created scripts.install scripts.postinstall`.

| Package | Registry | First published | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----------------|-----------|-------------|---------|-------------|
| `mqtt` | npm | 2013-02-12 | 2,651,987/wk | github.com/mqttjs/MQTT.js | OK | Approved |
| `aedes` | npm | 2015-03-06 | 123,028/wk | github.com/moscajs/aedes | OK | Approved |
| `ws` | npm | 2011-12-04 | 269,627,528/wk | github.com/websockets/ws | SUS (`too-new`) | Approved — see note |
| `@cucumber/cucumber` | npm | 2020-09-14 | 2,333,479/wk | github.com/cucumber/cucumber-js | SUS (`too-new`) | Approved — see note |
| `strong-mock` | npm | 2019-06-25 | 20,455/wk | github.com/NiGhTTraX/strong-mock | OK | Approved (mandated by project rules) |
| `aws-iot-device-sdk` | npm | — | 192,090/wk | github.com/aws/aws-iot-device-sdk-js | OK | Not selected (maintenance mode, user-rejected) |
| `aws-iot-device-sdk-v2` | npm | — | 113,194/wk | github.com/aws/aws-iot-device-sdk-js-v2 | SUS (`too-new`) | Not selected |
| `aws-crt` | npm | — | 865,176/wk | github.com/awslabs/aws-crt-nodejs | SUS (`too-new`) | Not selected |

**Note on the `too-new` verdicts.** The seam's `too-new` signal measures recency of the *latest publish*, not package age. `ws` (2011, 269 M weekly downloads) and `@cucumber/cucumber` (2020, 2.3 M weekly downloads) are long-established and were confirmed by first-publish date. These are not slopsquat risks and need no human-verify checkpoint.

**Packages removed due to `[SLOP]` verdict:** none.

**Install/postinstall audit:** `mqtt`, `aedes`, `ws`, `@cucumber/cucumber`, `strong-mock` all report empty `scripts.install` and `scripts.postinstall` [VERIFIED: `npm view <pkg> scripts.postinstall scripts.install`]. `aws-crt` reports `install: node ./scripts/install.js` — a Homebridge Verified conflict, documented above, and one of the reasons it is not selected.

## Architecture Patterns

### System Architecture Diagram

```mermaid
flowchart TD
  HB["Homebridge: config.json, cached accessories, lifecycle events"]
  HB -->|"constructor(log, config, api)"| PLAT["BasementGuardianPlatform (src/platform.ts)"]
  HB -->|configureAccessory| CACHE[["restored-accessory Map (recorded only, D-03)"]]
  HB -->|didFinishLaunching| START{{"AccountRuntime.start()"}}
  HB -->|shutdown| STOP{{"AccountRuntime.stop()"}}

  PLAT -->|"parse + validate, refuse on invalid (D-16)"| CFG["validateConfig (src/config.ts)"]
  CFG -->|"invalid or missing -> log one error, register no listeners"| IDLE(["idle, nothing started"])
  CFG -->|valid| PLAT

  PLAT --> LOG["RedactingLogger (D-18) wraps Homebridge Logging"]
  PLAT --> RT["AccountRuntime (src/runtime/accountRuntime.ts)"]
  RT --> ROOT[["root AbortController - every timer, wait, fetch, socket"]]

  RT --> AUTH["AuthClient (src/cloud/auth.ts)"]
  AUTH -->|"cache hit + fingerprint match + not expired"| TOK[("token cache file under api.user.storagePath(), mode 0600")]
  AUTH -->|"cache miss / expired / fingerprint mismatch"| A0[["Auth0 POST /oauth/token password-realm"]]
  A0 -->|"200 -> id_token"| TOK
  A0 -->|"invalid_grant -> stop, delete cache, one error (D-13)"| HALT(["authentication halted until restart"])

  RT --> API["CloudApi (src/cloud/api.ts) - fetch + AbortSignal"]
  API -->|GET /devices| INV[["device inventory + snapshots"]]
  API -->|GET /credentials/aws| CRED[("credential cache: endpoint, clientId, STS creds, Expiration")]

  RT -->|"poll every pollInterval - reconciliation backstop (SYNC-03)"| API
  RT -->|"rotation timer: Expiration - 10 min, always reschedules in finally (SYNC-04)"| CRED

  RT --> SH["ShadowClient (src/cloud/shadow.ts)"]
  CRED -->|"read on each handshake, never on a live socket"| SIGN["presignIotWebsocketUrl - node:crypto SigV4"]
  SIGN -->|"transformWsUrl returns signed wss URL"| SH
  SH -->|"connect / reconnect on capped backoff, re-entrancy guarded"| IOT[["AWS IoT message broker"]]
  IOT -->|"$aws/things/{deviceId}/shadow/update/accepted - partial reported patch"| SH
  SH -->|"publish $aws/things/{deviceId}/shadow/get on connect and reconnect"| IOT
  IOT -->|"$aws/things/{deviceId}/shadow/get/accepted - full shadow"| SH
  SH -.->|"shadow connect fails -> degraded, REST-only (D-15)"| RT

  INV -->|applyDiscovery| STORE["DeviceStateStore (src/device/state.ts)"]
  SH -->|"applyReportedPatch - merge, never replace; ignore desired"| STORE
  STORE --> SNAP[("one immutable snapshot per deviceId: identity + connectivity + opaque reported.data + deviceTime + receivedAt")]
  STORE -->|"subscribe(deviceId, (next, previous, changedKeys)) (D-19)"| CONSUMERS(["Phase 2-5 consumers - none in Phase 1"])

  STOP --> ROOT
  ROOT -->|"1 abort future work"| RT
  ROOT -->|"2 stop new commands"| API
  ROOT -->|"3 clear timers and subscriptions"| RT
  ROOT -->|"4 close the shadow socket"| SH
```

Reading the primary path: Homebridge constructs the platform, which validates config and either refuses (`CONF-03`, `D-16`) or registers the two lifecycle listeners. `didFinishLaunching` starts `AccountRuntime`, which authenticates, discovers devices over REST, fetches AWS credentials, and opens the shadow. Shadow patches and REST snapshots both land in one store that merges rather than replaces. `shutdown` aborts the root controller and unwinds in the documented order.

### Recommended Project Structure

```
src/
├── index.ts                    # registerPlatform only — unchanged, keep as is
├── settings.ts                 # PLATFORM_NAME, PLUGIN_NAME — unchanged
├── protocol.json               # D-07 bundled public vendor constants
├── config.ts                   # BgConfig type + validateConfig(): refuse, never clamp (D-16)
├── platform.ts                 # composition root; cached-accessory map; start/stop wiring
├── logging.ts                  # D-18 RedactingLogger (naming at Claude's discretion)
├── runtime/
│   ├── accountRuntime.ts       # start/stop, root AbortController, poll + rotation timers
│   └── retryPolicy.ts          # capped backoff + re-entrancy guard
├── cloud/
│   ├── types.ts                # wire types for the four REST routes and the shadow envelope
│   ├── auth.ts                 # password-realm grant + token cache file
│   ├── api.ts                  # typed fetch wrapper over the four routes
│   └── shadow.ts               # mqtt client, SigV4 presigner, shadow topic layer
├── device/
│   ├── state.ts                # DeviceStateStore — the merge reducer
│   ├── events.ts               # Phase 3 — typed contract only in Phase 1
│   ├── health.ts               # Phase 3/5 — typed contract only in Phase 1
│   ├── family.ts               # Phase 2 — typed contract only in Phase 1
│   ├── gemini.ts               # Phase 2 — typed contract only in Phase 1
│   └── halo.ts                 # Phase 2 — typed contract only in Phase 1
├── accessories/
│   ├── basementGuardian.ts     # Phase 2 — typed contract only in Phase 1
│   └── services.ts             # Phase 2 — typed contract only in Phase 1
└── persistence/
    └── accessoryContext.ts     # Phase 2/4 — typed contract only in Phase 1

test/                           # mirrors src/ exactly, one *.test.ts per module, no exclusions
features/
├── CLAUDE.md                   # existing Gherkin rules — binding
├── *.feature
└── support/
    ├── world.ts                # typed World: fake cloud, plugin harness, clock, cleanup
    ├── fakeAuth0.ts            # node:http server
    ├── fakeRestApi.ts          # node:http server, four routes
    ├── fakeShadowBroker.ts     # aedes + ws + coalescing bridge
    └── steps/*.ts              # organized by function, not by feature file
```

### Pattern 1: Platform constructor that refuses before it registers anything

`CONF-03` and the Verified rule *"must successfully install and not start unless it is configured"* both hinge on returning from the constructor **before** any listener exists. `D-16` extends this from missing credentials to structurally invalid or out-of-range values.

```ts
// Source: .planning/intel/context.md "Building the Homebridge plugin" §1, adapted for D-16.
constructor(
  public readonly log: Logging,
  config: PlatformConfig,
  public readonly api: API,
) {
  this.log = createRedactingLogger(log);          // D-18 — wrap before anything can log

  const validated = validateConfig(config);       // D-16 — refuse, do not clamp
  if (!validated.ok) {
    this.log.error(`Not starting: ${validated.reason} Fix it in the Homebridge UI (Plugins -> Basement Guardian -> Settings).`);
    return;                                       // no listeners registered, nothing runs
  }

  this.cfg = validated.config;
  this.runtime = new AccountRuntime({ /* injected collaborators */ });

  this.api.on('didFinishLaunching', () => {
    void this.runtime.start();                    // never let a rejection escape
  });

  this.api.on('shutdown', () => {
    void this.runtime.stop();
  });
}
```

Two details that are easy to get wrong. The redacting wrapper must be installed before the first `log.error`, because the refusal message can quote a configuration value. And `void` on both handlers is required: `@typescript-eslint/no-floating-promises` is active under `strictTypeChecked` and Homebridge's own Verified rule forbids unhandled exceptions.

### Pattern 2: Credential rotation that never touches the live socket

```ts
// Source: .planning/intel/context.md §9 (rotation shape), plus the Q1 finding that
// the live connection is never re-signed. `signal` comes from the root AbortController.
private scheduleRotation(): void {
  clearTimeout(this.rotationTimer);
  const dueIn = new Date(this.credentials.credentials.Expiration).getTime() - this.clock.now() - 10 * 60_000;

  this.rotationTimer = setTimeout(() => {
    void (async () => {
      try {
        // Refresh the cache only. The signer reads this cache on the NEXT handshake.
        this.credentials = await this.api.awsCredentials(this.signal);
      } catch (error) {
        this.log.warn('AWS credential refresh failed; retrying.', describeRedacted(error));
      } finally {
        this.scheduleRotation();                  // ALWAYS reschedule — Tuya's bug is returning on error
      }
    })();
  }, Math.max(30_000, dueIn));
}
```

The `finally` is `SYNC-04`'s "failed refreshes remain scheduled". `Math.max(30_000, dueIn)` guards against a credential response that is already near expiry.

### Pattern 3: SigV4 presigning wired through `transformWsUrl`

`transformWsUrl` is declared as `transformWsUrl?: (url: string, options: IClientOptions, client: MqttClient) => string;` [VERIFIED: `mqtt@5.15.2` `build/lib/client.d.ts:65`] and is invoked from the WebSocket stream builder on every connection attempt [VERIFIED: `build/lib/connect/ws.js:24-25`]:

```js
function buildUrl (opts, client) {
    let url = `${opts.protocol}://${opts.hostname}:${opts.port}${opts.path}`;
    if (typeof opts.transformWsUrl === 'function') {
        url = opts.transformWsUrl(url, opts, client);
    }
    return url;
}
```

The mqtt README documents the exact use case [CITED: `mqtt@5.15.2` README, *Refresh Authentication Options / Signed Urls with `transformWsUrl`*]: *"other cloud services may require a url be signed with each connection … By the time the reconnect happens in the application lifecycle, the original auth data may have expired."* It also notes the hook *"does not support promises"*, which is exactly why `SYNC-04`'s refresh timer must maintain a cache the hook reads synchronously.

The signer, verified deterministic this session:

```ts
// Source: canonical algorithm from docs.aws.amazon.com/general/latest/gr/signature-version-4.html;
// AWS-IoT-specific details (service name, /mqtt path, unsigned security token) confirmed against
// aws/aws-iot-device-sdk-js device/index.js:139-157 (prepareWebSocketUrl) and signUrl.
import { createHash, createHmac } from 'node:crypto';

const SERVICE = 'iotdevicegateway';

function signingKey(secretAccessKey: string, dateStamp: string, region: string): Buffer {
  const kDate = createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp).digest();
  const kRegion = createHmac('sha256', kDate).update(region).digest();
  const kService = createHmac('sha256', kRegion).update(SERVICE).digest();

  return createHmac('sha256', kService).update('aws4_request').digest();
}

export function presignIotWebsocketUrl(input: PresignInput): string {
  const amz = input.now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const day = amz.slice(0, 8);
  const path = '/mqtt';
  const query = 'X-Amz-Algorithm=AWS4-HMAC-SHA256'
    + `&X-Amz-Credential=${encodeURIComponent(`${input.accessKeyId}/${day}/${input.region}/${SERVICE}/aws4_request`)}`
    + `&X-Amz-Date=${amz}`
    + '&X-Amz-SignedHeaders=host';
  const canonicalRequest = [
    'GET', path, query, `host:${input.host.toLowerCase()}\n`, 'host',
    createHash('sha256').update('').digest('hex'),
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256', amz, `${day}/${input.region}/${SERVICE}/aws4_request`,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');
  const signature = createHmac('sha256', signingKey(input.secretAccessKey, day, input.region))
    .update(stringToSign).digest('hex');

  // X-Amz-Security-Token is appended AFTER signing. AWS IoT does not sign it.
  return `wss://${input.host}${path}?${query}&X-Amz-Signature=${signature}`
    + `&X-Amz-Security-Token=${encodeURIComponent(input.sessionToken)}`;
}
```

Verified output under a fixed clock, stable across repeated calls:

```
wss://<endpoint>/mqtt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAIOSFODNN7EXAMPLE%2F20260828%2Fus-east-1%2Fiotdevicegateway%2Faws4_request&X-Amz-Date=20260828T120000Z&X-Amz-SignedHeaders=host&X-Amz-Signature=0b2e763d718cc93b52cef881458beaecfd98003193038373ec432db0c7e78083&X-Amz-Security-Token=SESSION%2FTOKEN%2BVALUE%3D%3D
stable: true
```

Wiring it up. Note that `transformWsUrl` receives `wss://host:443/mqtt` including the port, and AWS IoT signs the bare host, so **ignore the `url` argument and build from the endpoint**:

```ts
const client = mqtt.connect(`wss://${creds.endpoint}/mqtt`, {
  clientId: creds.clientId,
  protocolVersion: 4,
  reconnectPeriod: 0,                     // we own backoff (retryPolicy.ts), not mqtt.js
  clean: true,
  resubscribe: true,
  transformWsUrl: (_url, _options, c) => {
    const current = this.credentialCache.current();   // refreshed by the SYNC-04 timer
    c.options.clientId = current.clientId;            // GET /credentials/aws returns a NEW client id each time
    return presignIotWebsocketUrl({ ...current, now: new Date(this.clock.now()) });
  },
});
```

Setting `c.options.clientId` is load-bearing, not cosmetic: AWS IoT documents that *"Two clients with the same client ID can't be connected concurrently to the message broker. When a client connects to the message broker using a client ID that another client is using, the new client connection is accepted and the previously connected client is disconnected."* [CITED: docs.aws.amazon.com/iot/latest/developerguide/mqtt.html, *AWS IoT differences from MQTT specifications*]. Reusing a stale client ID while an old socket lingers makes the plugin kick itself into a reconnect loop.

### Pattern 4: The shadow topic subset Phase 1 needs

The classic (unnamed) shadow prefix is `$aws/things/{thingName}/shadow`, and AWS explicitly warns against wildcard subscriptions [CITED: docs.aws.amazon.com/iot/latest/developerguide/device-shadow-mqtt.html]. The thing name equals the vendor `deviceId` [CITED: `.planning/intel/constraints.md` §5].

| Topic | Direction | Phase 1 use |
|---|---|---|
| `$aws/things/{deviceId}/shadow/get` | publish (empty payload) | Full-shadow refresh after connect and after every reconnect (`SYNC-03`) |
| `$aws/things/{deviceId}/shadow/get/accepted` | subscribe | The full shadow document |
| `$aws/things/{deviceId}/shadow/get/rejected` | subscribe | Log and fall back to REST; never fabricate state |
| `$aws/things/{deviceId}/shadow/update/accepted` | subscribe | Device-published partial `reported` patches — the ~898 s heartbeat (`SYNC-02`) |
| `$aws/things/{deviceId}/shadow/update/delta` | **do not subscribe** | Deltas carry `desired`; `SYNC-02` ignores `desired` entirely |
| `$aws/things/{deviceId}/shadow/update` | **do not publish** | The plugin never writes the shadow; Gemini commands go through `PUT /devices/{deviceId}/data` |

The v1 `thingShadow` behavior worth reproducing is its version guard [VERIFIED: `aws/aws-iot-device-sdk-js` `thing/index.js:217-250`, fetched this session]: it tracks the shadow `version` per thing and discards messages whose version is older than the one already applied, unless `discardStale` is false. Out-of-order shadow delivery is explicitly in this project's test strategy (*"Include partial, omitted, invalid, delayed, duplicate, and out-of-order data"*), so the store or the shadow client must hold a per-device `version` watermark. The v1 rule to copy: update the tracked version on every accepted or delta message whose status is not `rejected`.

Also reproduce the foreign-vs-own distinction. v1 emits `foreignStateChange` only when the incoming `clientToken` does not match one it issued [VERIFIED: `thing/index.js:266-275`]. Phase 1 never publishes updates, so every `update/accepted` message is foreign by construction — but the plan should state that assumption rather than leave it implicit, because Phase 4 adds a command path.

### Pattern 5: Composing the root abort signal with a per-request deadline

```ts
// AbortSignal.any and AbortSignal.timeout both verified present.
async function request(path: string, rootSignal: AbortSignal, deadlineMs: number): Promise<Response> {
  const signal = AbortSignal.any([rootSignal, AbortSignal.timeout(deadlineMs)]);

  return fetch(new URL(path, this.baseUrl), { headers: this.authHeader(), signal });
}
```

And for every wait — retry backoff, poll interval, rotation delay — use the abortable timer instead of a bare `setTimeout`, so `SYNC-05` gets a single cancellation mechanism:

```ts
import { setTimeout as delay } from 'node:timers/promises';

await delay(backoffMs, undefined, { signal: rootSignal });   // rejects AbortError on shutdown
```

Verified: `AbortSignal.any` is a function, `AbortSignal.timeout` is a function, and the abortable delay rejects with `AbortError` / code `ABORT_ERR`.

### Pattern 6: The Cucumber fake shadow broker

`aedes` works with `mqtt` over plain TCP with no ceremony:

```ts
const broker = await Aedes.createBroker();
const server = net.createServer((socket) => { broker.handle(socket); });
```

Over WebSocket it needs a bridge, and the obvious one is broken (see Pitfall 4). This bridge is verified working:

```ts
// features/support/fakeShadowBroker.ts
function bridge(ws: WebSocket): Duplex {
  let pending: Buffer[] = [];
  const duplex = new Duplex({
    read() { /* push-driven */ },
    write(chunk, _encoding, callback) { ws.send(chunk, { binary: true }, () => { callback(); }); },
    destroy(error, callback) { ws.close(); callback(error); },
  });
  const flush = (): void => {
    if (pending.length === 0) { return; }

    const batch = Buffer.concat(pending);
    pending = [];
    duplex.push(batch);
  };

  ws.on('message', (data: Buffer) => {
    pending.push(Buffer.from(data));
    if (pending.length === 1) { setImmediate(flush); }
  });
  ws.on('close', () => { flush(); duplex.push(null); });
  ws.on('error', (error) => { duplex.destroy(error); });

  return duplex;
}
```

The fake device then drives scenarios by publishing on the broker:

```ts
broker.publish({
  topic: `$aws/things/${deviceId}/shadow/update/accepted`,
  payload: Buffer.from(JSON.stringify({ state: { reported: { data: heartbeatFields } }, version: nextVersion })),
  qos: 0,
});
```

**One design consequence for the planner.** The harness must reach a local `ws://` broker while the bundled constant says `wss` [CITED: `.planning/intel/constraints.md` §2]. Do **not** add a configuration field — `D-07` and `CONF-04` forbid it. Instead give `ShadowClient` a constructor-injected protocol that defaults to the bundled constant, which the harness overrides with `'ws'`. The endpoint and client ID need no override at all, because they arrive as *data* from the fake `GET /credentials/aws` response. The alternative — serving TLS with a self-signed certificate — is more faithful but introduces a `rejectUnauthorized: false` escape hatch that must never reach production; the injected protocol is safer.

### Anti-Patterns to Avoid

- **Calling `updateWebSocketCredentials`-style "in-place rotation" and expecting the live socket to change.** Nothing re-signs a live connection. Rotation means refreshing a cache.
- **Replacing the cached snapshot with a heartbeat payload.** Heartbeats carry seven fields; wholesale assignment blanks pump, power, charging, test, and fault values every ~15 minutes [CITED: `.planning/intel/context.md` §1].
- **Subscribing to `$aws/things/{thing}/shadow/#`.** AWS warns the topic set grows over time; it would also deliver `desired` deltas that `SYNC-02` must ignore.
- **Letting `mqtt.js` own reconnect timing.** `reconnectPeriod` defaults to 1000 ms with no cap; `retryPolicy.ts` owns backoff so `SYNC-04`'s "capped and protected from duplicate loops" is testable. Both `error` and `close` fire, so the guard is required.
- **`throw` from any refusal path.** The Verified checklist requires the plugin to catch and log its own errors; the constructor bail-out returns, it does not throw.
- **Treating a daily reconnect as a fault.** AWS closes SigV4 WebSockets at 24 hours by quota.
- **Writing the token cache with `fs.writeFile(path, data, { mode: 0o600 })` over an existing file.** See Pitfall 3 — the mode is ignored and the file stays world-readable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MQTT 3.1.1 framing, keepalive, QoS 1, resubscribe | A packet codec on `ws` | `mqtt` 5.x | Packet ordering, PINGREQ timing, and message-ID allocation are where hand-rolled clients fail silently |
| HTTP client | An `http`/`https` wrapper or `axios` | built-in `fetch` | `D-06`; also avoids a `REL-03` telemetry review of an HTTP dependency |
| Retry deadline cancellation | A `Promise` race with a `setTimeout` handle | `AbortSignal.any` + `timers/promises.setTimeout({ signal })` | One cancellation mechanism satisfies all of `SYNC-05` and leaks no timers |
| Test MQTT broker | A socket that replays canned bytes | `aedes` | Real CONNECT/SUBACK/PUBLISH semantics; the plugin's own reconnect logic gets exercised |
| Strict interaction assertions | `t.mock.fn()` call-count checks | `strong-mock` | Mandated by `.claude/rules/typescript-unit-testing.md` |
| Coverage thresholds | A custom reporter | `node --test --experimental-test-coverage --test-coverage-{lines,branches,functions}=100` | Verified to set a non-zero exit code below threshold |
| Shadow document semantics | Inventing a merge protocol | The documented `$aws/things/…/shadow` topics + a `version` watermark | AWS defines the contract; the v1 SDK's stale-discard rule is proven |

**Exception, and it is deliberate:** SigV4 presigning for `iotdevicegateway` **must** be hand-rolled. `@aws-sdk/signature-v4` cannot produce the URL because *"it assumes that if the session token is present it will always add the X-Amz-Security-Token canonical query string. This means its not possible to generate a pre-signed URL for some services"* [CITED: github.com/aws/aws-sdk-js-v3/issues/3417, closed for staleness]. AWS's own documentation acknowledges the split: *"For some services, you must include the X-Amz-Security-Token query parameter in the canonical (signed) query string. For other services, you add the X-Amz-Security-Token parameter at the end, after you calculate the signature."* AWS IoT is the second kind.

**Key insight:** every "don't hand-roll" item above is infrastructure with hidden state machines. The one thing we *do* hand-roll — a pure function from credentials plus a clock to a URL string — has no state at all, which is why golden-vector tests can pin it completely.

## Runtime State Inventory

Phase 1 is mostly greenfield, but `D-01`/`D-02` are a teardown of shipped template code and `D-03` concerns state Homebridge already holds on disk. Recorded for completeness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Homebridge's cached-accessory file (`api.user.cachedAccessoryPath()`) may already hold template-created Lightbulb/MotionSensor accessories from any developer run of `npm run watch`. `D-03` forbids unregistering them. | None in code. Developers using `test/hbConfig/` should clear that instance's cache manually; the plugin must not delete anything (`D-03`). |
| Live service config | None. The vendor account holds no plugin-created configuration; Phase 1 uses only read routes plus `GET /credentials/aws`. | None — verified against the four routes in `.planning/intel/constraints.md` §4. |
| OS-registered state | None. The plugin registers no OS-level tasks, services, or units. | None. |
| Secrets/env vars | `test/hbConfig/config.json` will hold a real account password. `.gitignore` must cover it before any developer run. | Verify the ignore rule in Phase 1 before first use, per CONTEXT.md's code-context note. |
| Build artifacts | `dist/` currently contains `platformAccessory.js`, `platformAccessory.d.ts`, and `platformAccessory.js.map` from the template [VERIFIED: `npm pack --dry-run` output lists all three]. `npm run build` runs `rimraf ./dist` first, so they clear automatically. `node_modules/homebridge-lib` persists until `npm uninstall`. | `npm run build` clears `dist/`; `npm uninstall homebridge-lib` (`D-02`) clears the module and updates `package-lock.json`. |

## Common Pitfalls

### Pitfall 1: Typed ESLint refuses to parse any `.ts` file outside `tsconfig.json`'s `include`

**What goes wrong:** the first `test/**/*.ts` or `features/**/*.ts` file breaks `npm run lint`, and therefore `npm run check`, with a parsing error rather than a rule violation.

**Verified reproduction** (probe file created, linted, deleted; working tree left clean):

```
/home/acolomba/homebridge-basement-guardian/test/tmpProbe.test.ts
  0:0  error  Parsing error: /home/acolomba/homebridge-basement-guardian/test/tmpProbe.test.ts was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject
```

**Why it happens:** `eslint.config.js` sets `projectService: true` with `tsconfigRootDir: import.meta.dirname` for `**/*.ts`, and `tsconfig.json` has `"include": ["eslint.config.js", "homebridge-ui", "src"]` [VERIFIED: `tsconfig.json`, final line]. Today the only test file is `test/plugin.test.mjs`, which falls into the `disableTypeChecked` block, so nothing has hit this yet. Note `rootDir: "src"` also means the root config cannot simply be widened — adding `test` to `include` makes `tsc` emit outside `rootDir`.

**How to avoid:** add a second config and point ESLint at both. Verified working:

```jsonc
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "rootDir": ".", "outDir": "dist-test", "declaration": false },
  "include": ["src", "test", "features"]
}
```

```js
// eslint.config.js — in the **/*.ts block
parserOptions: {
  project: ['./tsconfig.json', './tsconfig.test.json'],
  tsconfigRootDir: import.meta.dirname,
},
```

With that change the probe file parsed and typed rules ran. This same `tsconfig.test.json` is the `D-09` "second tsconfig" that emits `test/` alongside `src/`, so it earns its keep twice.

**Warning signs:** `Parsing error: … was not found by the project service` on any new `.ts` file.

### Pitfall 2: `no-floating-promises` fires on every `node:test` `test()` call

**What goes wrong:** with typed linting working, the very same probe file produced:

```
  4:1  error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator  @typescript-eslint/no-floating-promises
```

**Why it happens:** `eslint.config.js` enables `tseslint.configs.strictTypeChecked`, and `node:test`'s `test()` returns a `Promise`.

**How to avoid:** pick one and apply it uniformly — `void test('…', () => { … });` at every call site, or a scoped ESLint override disabling `@typescript-eslint/no-floating-promises` for `test/**/*.ts`. The override is less noisy and does not distort the test-style rules the project already mandates. Either way it must be settled before the first test file lands, because `--max-warnings=0` makes this a hard failure.

**Warning signs:** `npm run lint` failing on files that typecheck cleanly.

### Pitfall 3: `fs.writeFile(path, data, { mode })` silently leaves an existing file world-readable

**What goes wrong:** `AUTH-02` requires owner-only permissions on the token cache. Passing `{ mode: 0o600 }` works on creation and is **ignored** on every subsequent rewrite, so the very first token refresh after any file-mode drift leaves the token readable by every local user.

**Verified reproduction:**

```
writeFileSync mode 0o600 ->  600
overwrite existing, mode ignored ->  644
temp+rename ->  600
umask = 22
```

**Why it happens:** POSIX `open(2)` applies `mode` only when it creates the file. `fs.writeFile` with `'w'` truncates an existing inode and leaves its mode alone.

**How to avoid:** write to a sibling temp file with `mode: 0o600`, then `rename` over the target. This also makes the write atomic, so a crash mid-write cannot leave a truncated token cache — which matters because `D-08` treats a malformed cache as a re-authentication trigger, and re-authenticating too often walks toward the Auth0 brute-force threshold.

**Warning signs:** a "Secret handling" test that asserts the mode only after the first write will pass while the bug is live. Assert the mode after a *second* write.

### Pitfall 4: `ws.createWebSocketStream` + `aedes` hangs forever with no error

**What goes wrong:** the natural WebSocket bridge for the fake broker produces a WebSocket connection, an `aedes` `Client` object, and then nothing. No error, no CONNACK, no timeout — the Cucumber scenario just hangs.

**Verified reproduction:** the WebSocket upgrade succeeded with subprotocol `mqtt`, `broker.handle()` returned a `Client`, and `broker.on('client')` never fired.

**Why it happens:** two behaviors combine. `mqtt.js` writes each CONNECT field as a separate stream write, and `ws` turns each write into its own WebSocket frame, so the server sees `<Buffer 10>`, `<Buffer 0f>`, `<Buffer 00 04>`, `<Buffer 4d 51 54 54>`, … as nine discrete chunks [VERIFIED: probe]. `aedes` reads exactly one chunk per `readable` event [VERIFIED: `aedes@1.1.1` `lib/client.js:60-83`, `const buf = client.conn.read(null); if (buf) { client._parser.parse(buf) }`], so it consumes the single byte `0x10`, finds no complete packet, and never re-reads. Over TCP the kernel coalesces the writes, which is why `aedes` over `net.createServer` works immediately.

**How to avoid:** the coalescing bridge in Pattern 6, which batches all frames arriving in a tick and pushes one concatenated buffer. Verified end to end including a shadow-topic round trip.

**Warning signs:** a Cucumber scenario that times out at the step which starts the plugin, with no broker `client` event and no client `error` event.

### Pitfall 5: `resolveJsonModule` alone does not compile under `module: nodenext`

**What goes wrong:** `D-07`'s constants import fails to typecheck.

**Verified reproduction:**

```
src/index.ts(1,22): error TS1543: Importing a JSON file into an ECMAScript module requires a 'type: "json"' import attribute when 'module' is set to 'NodeNext'.
```

**How to avoid:** `import protocol from './protocol.json' with { type: 'json' };`. Good news for packaging: `tsc` copies the JSON file into `outDir` automatically — a build of a single-file project produced `dist/index.js`, `dist/index.d.ts`, `dist/index.js.map`, **and** `dist/protocol.json`, and `node dist/index.js` printed the value. No copy step is needed, and `.npmignore` does not exclude `dist/`, so `D-07`'s "shipped in the package" requirement is already satisfied.

### Pitfall 6: `npm pack` currently ships 735 files from `.claude/`

**What goes wrong:** `REL-04`/`REL-05` require a clean packed package. It is not clean today, and Phase 1 adds `features/` to the problem.

**Verified today, on the current working tree:**

```
    735 .claude
     12 dist
      1 research.tar.gz
      1 README.md
      1 .pi
      1 package.json
      1 LICENSE
      1 features
      1 config.schema.json
      1 CLAUDE.md

package size: 3.2 MB · unpacked size: 11.1 MB · total files: 755
```

`features/CLAUDE.md` already ships, confirming CONTEXT.md's concern. But `.claude/` (the entire GSD runtime), `.pi/`, `research.tar.gz`, and `CLAUDE.md` ship too, none of which CONTEXT.md flagged. `research.tar.gz` in particular is exactly the kind of artifact `REL-04` and `D-027` exist to keep out.

**Why it happens:** `.npmignore` is a denylist and does not list `.claude`, `.pi`, `research.tar.gz`, or `features` [VERIFIED: `.npmignore` — it lists `.agents`, `.codex`, `.planning`, `docs/`, `test/`, `tests/`, and the template defaults, but none of the four].

**How to avoid:** add an allowlist instead of chasing the denylist. `"files": ["dist", "config.schema.json"]` in `package.json` closes the whole class in one line; npm always includes `package.json`, `README`, `LICENSE`, and `CHANGELOG` regardless. The intel already recommends it: *"Publishing docs recommend `files` (or `.npmignore`) so `src/` and maps do not ship. Check with `npm pack --dry-run`."* Phase 1 should make the change and add a `npm pack --dry-run` assertion, because Phase 1 is the phase that creates both `features/` and the JSON constants file.

**Warning signs:** none at runtime. This only surfaces at publish, which is why an explicit check belongs in the phase.

### Pitfall 7: Project test rules demand more than CONTEXT.md assumed

**What goes wrong:** `.claude/rules/typescript-unit-testing.md` is binding and imposes obligations that are not in `package.json` or CONTEXT.md.

**Verified requirements from that file:** `strong-mock` is the mandated mocking library (*"Use `node:test` for the runner … `strong-mock` for strict interaction mocks"*) and is not a devDependency today. Test commands `npm run test:coverage:direct -- <path>` and `npm run test:coverage:all` are referenced and do not exist in `package.json`'s `scripts`. Pairing is total: *"Every production `.ts` module under `src/` has exactly one `.test.ts` module under `test/` at the mirrored path"* and *"No exclusions. Type-only modules, `index.ts` barrels, and one-function modules all need a test module."* Coverage is per-pair: *"Each source-test pair reaches 100% function, line, and branch coverage when run alone. Aggregate coverage does not count."*

**Why it matters for `D-17`:** scaffolding fourteen modules up front means fourteen paired test modules at 100% coverage each. A scaffold that is a pure type declaration has no executable lines and satisfies this trivially; a scaffold with a stub function body does not.

**How to avoid:** make every not-yet-wired scaffold module **type-only** — interfaces and type aliases, no runtime code. That satisfies the coverage rule at zero cost, keeps the `D-19`/`D-20` contracts visible for Phases 2–5, and dovetails with the dead-code resolution below.

**Mechanism, verified:** `node --test --experimental-test-coverage --test-coverage-lines=100 --test-coverage-branches=100 --test-coverage-functions=100 --test-coverage-include='<file>' <test>` exits `1` below threshold and `0` above it. Note that coverage reports against the **emitted JavaScript** — uncovered lines are reported as `out/a.js | … | 5`, not remapped to the `.ts` source. Percentages are unaffected; only line numbers are less convenient.

### Pitfall 8: `Logging` is a callable interface, not a plain object

**What goes wrong:** a `D-18` redacting wrapper written as a class fails to satisfy `Logging`, because the interface is a call signature with properties [VERIFIED: `homebridge@2.4.0` `dist/logger.d.ts:24-33`]:

```ts
export interface Logging {
    prefix: string;
    (message: string, ...parameters: any[]): void;
    info: (message: string, ...parameters: any[]) => void;
    success: (message: string, ...parameters: any[]) => void;
    warn: (message: string, ...parameters: any[]) => void;
    error: (message: string, ...parameters: any[]) => void;
    debug: (message: string, ...parameters: any[]) => void;
    log: (level: LogLevel, message: string, ...parameters: any[]) => void;
}
```

**How to avoid:** build a function and attach the seven members (`prefix`, `info`, `success`, `warn`, `error`, `debug`, `log`). All seven must be redacted, including the bare call form and `log(level, …)` — a wrapper that covers only `info`/`warn`/`error` leaks through `debug` and the callable form.

**Good news on compatibility:** the interface is identical in `homebridge@1.8.0` [VERIFIED: `homebridge-1.8.0.tgz` → `package/lib/logger.d.ts:24-33`, same seven members including `success`], so `REL-01`'s `^1.8.0 || ^2.0.0` range needs no shim.

### Pitfall 9: `strictTypeChecked` and untyped wire data

**What goes wrong:** `eslint.config.js` enables `tseslint.configs.strictTypeChecked`. `await response.json()` returns `any`, and every downstream use trips `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-argument`, or `restrict-template-expressions`. The same applies to `JSON.parse(payload.toString())` for shadow messages.

**How to avoid:** type the boundary as `unknown` and narrow with hand-written predicates in `src/cloud/types.ts`. This is not just lint appeasement — `D-20` requires `reported.data` to be a *validated-shape* record, and `D-14`'s preserve-and-mark invariant depends on being able to reject a malformed payload without corrupting the snapshot. Do not reach for `as`; the style guide and the safety constraint agree.

## Code Examples

### Auth0 password-realm request with redacted failure handling

```ts
// Source: .planning/intel/constraints.md §3 (grant shape).
// Error semantics from Auth0 docs — see Sources.
const response = await fetch(`https://${constants.auth0Domain}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
    realm: constants.auth0Realm,
    client_id: cfg.clientId ?? constants.clientId,
    username: cfg.email,
    password: cfg.password,
    scope: 'openid profile email',
  }),
  signal: AbortSignal.any([rootSignal, AbortSignal.timeout(requestTimeoutMs)]),
});
```

The request body is a secret in its entirety and must never be logged (`D-18`, `AUTH-02`). On failure, branch on the parsed `error` field:

- `invalid_grant` → `D-13`: log one actionable error, delete the token cache, stop. Do not retry.
- HTTP 429 with `too_many_attempts` → the account is already blocked. Same stop behavior, with a message naming the block so the user knows waiting is required, not retrying.
- Anything else (network, 5xx) → transient; `D-14` logging discipline and capped backoff apply.

`D-13`'s rationale is confirmed by Auth0's own documentation: the default brute-force threshold is 10 incorrect attempts from one IP to one user identifier, blocks are lifted only when *"Thirty (30) days pass from the last failed login attempt"*, and blocked requests return HTTP 429 `too_many_attempts` [CITED: auth0.com/docs/secure/attack-protection/brute-force-protection]. A retrying plugin refreshes that 30-day window indefinitely.

### Atomic, owner-only token cache write

```ts
// AUTH-02 — mode is applied only at creation, so create a fresh file and rename over.
const target = path.join(this.api.user.storagePath(), '.basement-guardian-token.json');
const temp = `${target}.${process.pid}.tmp`;

await fs.writeFile(temp, JSON.stringify(cache), { mode: 0o600, signal: rootSignal });
await fs.rename(temp, target);
```

The cache payload is `{ idToken, expiresAt, emailFingerprint }` per `D-08`. The fingerprint is a salted hash of the configured email; the salt should be generated once and stored alongside so the comparison is stable across restarts, and the raw email must not appear in the file.

### Config validation that refuses rather than clamps

```ts
// D-16 — this deliberately replaces the intel's Math.max(300, cfg.pollInterval ?? 900) clamp.
export function validateConfig(raw: PlatformConfig): ConfigResult {
  const email = raw.email;
  if (typeof email !== 'string' || email.length === 0) {
    return { ok: false, reason: 'the account email is missing.' };
  }

  const pollInterval = raw.pollInterval ?? 900;                       // absent -> documented default
  if (!Number.isInteger(pollInterval) || pollInterval < 300 || pollInterval > 3600) {
    return { ok: false, reason: `pollInterval must be a whole number of seconds from 300 to 3600, but it is ${String(raw.pollInterval)}.` };
  }
  ...
}
```

The bounds `300`–`3600` and `1`–`8` with default `2` come straight from `CONF-05`. `pollInterval` uses `placeholder` in the schema so it is absent from `config.json` unless the user sets it; `offlineConfirmationPollCount` uses `default: 2` [CITED: `.planning/intel/context.md` §3].

### Cucumber ESM + TypeScript configuration (verified working)

The repo is `"type": "module"` with `module: nodenext` and has no Cucumber dependency. Verified end to end this session with `@cucumber/cucumber@13.2.1`, `typescript@6.0.3`, and `@types/node@26.2.0`: one feature, one World with a parameter-property class, three steps, all passing.

```jsonc
// cucumber.json — profiles are top-level keys
{
  "default": {
    "paths": ["features/**/*.feature"],
    "import": ["dist-test/features/**/*.js"],
    "format": ["summary"]
  },
  "real": {
    "paths": ["features/real-pump/**/*.feature"],
    "import": ["dist-test/features/**/*.js"],
    "tags": "@real and @read-only",
    "format": ["summary"]
  }
}
```

```jsonc
// package.json scripts
{
  "build:test": "rimraf ./dist-test && tsc -p tsconfig.test.json",
  "test:unit": "npm run build:test && node --test \"dist-test/test/**/*.test.js\"",
  "test:cucumber": "npm run build:test && cucumber-js",
  "test": "npm run test:unit && npm run test:cucumber"
}
```

Verified output:

```
--- compiled ---
dist-test/features/support/steps.js
dist-test/features/support/world.js
dist-test/src/adder.js

1 scenario (1 passed)
3 steps (3 passed)
```

Four points the Cucumber docs make that matter here [CITED: github.com/cucumber/cucumber-js/blob/main/docs/configuration.md and docs/esm.md]:

1. Config file names are fixed: `cucumber.json`, `cucumber.yaml`, `cucumber.yml`, `cucumber.js`, `cucumber.cjs`, `cucumber.mjs`, or `--config`.
2. *"If your support code is written as ESM, you'll need to use the `import` configuration option to specify your files, rather than the `require` option."* Compiled output under `module: nodenext` in a `"type": "module"` package is ESM, so `import` is correct.
3. Once you specify any `import` option, the defaults no longer apply — hence the explicit `paths` too.
4. `paths` points at the **source** `.feature` files; only support code comes from `dist-test/`. Feature files are not compiled.

**Difference from current documentation, recorded per CLAUDE.md.** The docs also advertise `.ts`/`.mts`/`.cts` config files via *"Node.js built-in TypeScript support"*, with the caveats that *"your `tsconfig.json` won't be honoured and that you need to be explicit about type imports."* This project cannot use that path: `D-09` rejected Node's strip-only mode on verified evidence, re-confirmed this session — `SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode` and `SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode`. Keeping `cucumber.json` and compiling support code with `tsc` avoids the whole question and honours the project tsconfig. `@cucumber/cucumber@13.2.1` declares `engines.node: "22 || 24 || >=26"` and exposes `"import": "./lib/wrapper.mjs"` [VERIFIED: `npm view @cucumber/cucumber@13.2.1`], so ESM consumption is first-class at the pinned version.

### Resolving `D-17` against the `fallow` dead-code gate

This is the CONTEXT.md tooling conflict, and it has a clean answer.

**Reproduced.** A scratch project with `entry: ["src/index.ts"]` and one unwired module produced exactly the failure CONTEXT.md predicted:

```
● Unused files (1)
  src/cloud/shadow.ts
  Files not reachable from any entry point
```

**Resolved.** Adding `"ignoreFindings": ["src/cloud/**"]` to `.fallowrc.json` suppressed it while leaving the file in the module graph. The option is documented as *"an array of project-root-relative glob patterns whose source-owned dead-code findings are hidden after analysis without excluding matching files from discovery, parsing, resolution, or the module graph"* [VERIFIED: `node_modules/fallow/schema.json`, `properties.ignoreFindings.description`].

**Why the alternatives are worse:**

- `ignorePatterns` *"exclude[s] from analysis entirely"*, which would also drop the modules from `fallow health` and `fallow dupes` — they would stop being checked for complexity and duplication once wired.
- `entry` seeds extra entry points, but `.fallowrc.json` sets `"includeEntryExports": true` [VERIFIED: `.fallowrc.json`], which means *"exports of entry-point files are subject to unused-export detection"* — so the scaffolds' unused exports would still be reported.
- `dynamicallyLoaded` is for files a static graph cannot see; that is not what these are.

**Recommended shape,** combining this with Pitfall 7:

1. Scaffold every not-yet-wired module as **type-only** — `export interface`, `export type`, no runtime code. This makes them cheap for `fallow health`, trivially 100%-covered for the unit-test rule, and genuinely useful because `D-19` and `D-20` contracts become visible now.
2. Set `"ignoreExportsUsedInFile"` untouched and add a scoped, enumerated ignore list rather than a broad glob, so removing an entry is the natural signal that a module got wired:

```jsonc
// .fallowrc.json — add alongside the existing keys
"ignoreFindings": [
  "src/device/events.ts",
  "src/device/health.ts",
  "src/device/family.ts",
  "src/device/gemini.ts",
  "src/device/halo.ts",
  "src/accessories/basementGuardian.ts",
  "src/accessories/services.ts",
  "src/persistence/accessoryContext.ts"
]
```

3. Add a plan note that Phases 2–5 delete their entry from this list as each module is wired, and that the list must be empty by Phase 6.

Modules Phase 1 actually wires — `config.ts`, `platform.ts`, the logging wrapper, `runtime/accountRuntime.ts`, `runtime/retryPolicy.ts`, all four of `cloud/*`, and `device/state.ts` — need no entry, because `src/index.ts` reaches them transitively.

**Verified today:** `npm run fallow` passes on the current tree with health score 100 and zero dead files or exports, so the gate is genuinely green before Phase 1 touches it.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `aws-iot-device-sdk` v1 as the default Node.js AWS IoT client | Maintenance mode; *"will no longer receive feature updates, but will receive security updates"* | Ongoing | The intel's `package.json` sketch still lists `aws-iot-device-sdk: ^2.2.16` — superseded by this research |
| `request`/`axios` for HTTP in Node plugins | Built-in global `fetch` | Node 18 | `D-06`; one fewer dependency to review under `REL-03` |
| `Promise.race` with manual timers for deadlines | `AbortSignal.timeout` + `AbortSignal.any` | Node 17.3 / 20.3 | Single cancellation primitive for all of `SYNC-05` |
| `ts-node` for running TypeScript tests | `tsc` emit + `node --test` on the output (`D-09`), or native type stripping | Node 22.18 / 23.6 | `ts-node@10.9.2` is still a devDependency and is now unused; strip-only mode remains unusable here |
| `mocha` + `chai` for Homebridge plugin tests | `node:test` + `node:assert/strict` | Node 20 | Already the project rule |
| `websocket-stream` for bridging `ws` to a broker | Deprecated/unmaintained; `ws.createWebSocketStream` is the modern API but is incompatible with `aedes` | — | Hand-rolled coalescing bridge is the working answer (Pattern 6) |

**Deprecated/outdated in this repo:**

- `homebridge-lib` — a runtime dependency with one consumer, removed by `D-02`/`D-033`.
- `ts-node@10.9.2` — a devDependency with no consumer; `D-09`'s compile-then-test approach does not need it. Flag for removal; `fallow dead-code --unused-deps` will report it once `npm run check` runs after the teardown.
- `test/plugin.test.mjs` — the template smoke test; replaced by the mirrored `test/**/*.test.ts` suite, and its removal is what makes the `test` script change safe.

## Project Constraints (from CLAUDE.md)

Actionable directives the planner must honour. These carry the same authority as locked decisions.

| Directive | Source | Effect on Phase 1 |
|---|---|---|
| Read a file before editing it; trace callers before modifying a function | CLAUDE.md → Guidelines → General | Task actions must read `src/platform.ts` before the `D-01` teardown |
| Consult Homebridge and Cucumber.js primary docs; compare against pinned versions and record differences | CLAUDE.md → External Reference Documentation | Done — see the Cucumber difference note and the `Logging`/`APIEvent` typings checks |
| Never commit to `main`; feature branches are `features/*`; prefer worktrees under `.worktrees/` | CLAUDE.md → Git | Already on `features/phase-01-secure-cloud-foundation` |
| Conventional Commits; title 5–72 chars; body lines ≤ 80 chars; no GSD milestone/phase mentions | CLAUDE.md → Git | Applies to every plan task commit |
| Run `pre-commit run --all-files` (or `--files <changed>`) **before** `git commit`; fix, restage, re-run until clean; never `--amend` to recover | CLAUDE.md → Git | Must appear in each plan's commit procedure |
| Never use `--no-verify` | CLAUDE.md → Git | — |
| Never rebase or rewrite history; update branches by merging | CLAUDE.md → Git | — |
| In a worktree, prefix with `SKIP=trufflehog` only after a clean filesystem scan; do not extend `SKIP=` | CLAUDE.md → Git | Relevant if `use_worktrees` is on (it is, in `.planning/config.json`) |
| Use `simple-english` and `humanizer` skills for PR descriptions | CLAUDE.md → Git | Phase-end |
| Merge PRs with `--squash` | CLAUDE.md → Git | Phase-end |
| Offer a version bump in `package.json` and `sonar-project.properties`, update `package-lock.json`, record changes in `CHANGELOG.md` before a PR | CLAUDE.md → Versioning | **`CHANGELOG.md` does not exist** and neither does `sonar-project.properties`; the planner must decide whether Phase 1 creates them |
| Relative ESM imports use `.js` extensions | CLAUDE.md → Constraints → Runtime | Every new module |
| Use only HAP objects from `api.hap`; never import HAP-NodeJS directly | CLAUDE.md → Constraints | No HAP use in Phase 1, but the rule constrains the scaffolds |
| Unknown/stale/omitted/invalid values never become guessed measurements or normal defaults | CLAUDE.md → Constraints → Safety semantics | Directly shapes the `device/state.ts` reducer |
| Credentials, tokens, raw responses, account identifiers never enter public artifacts, accessory context, or logs | CLAUDE.md → Constraints → Privacy | `D-18` wrapper; Pitfall 6 packaging fix |
| Tokens under `api.user.storagePath()`; accessory data in typed `accessory.context`, explicitly persisted | CLAUDE.md → Constraints → Persistence | `AUTH-02`; Pitfall 3 |
| GSD workflow enforcement: no direct repo edits outside a GSD command | CLAUDE.md → GSD Workflow Enforcement | Execution runs under `/gsd-execute-phase` |
| Project skills `simple-english` and `humanizer` live under `.agents/skills/` | CLAUDE.md → Project Skills | Documentation tasks should invoke them |
| Gherkin: concise, active verbs, sentence-case scenarios, lower-case steps, no `And`, no "should", present tense, "these" for data tables | `features/CLAUDE.md` | Binding on every `D-10` feature file |
| Step definitions organized by function, not by feature file; Given/When/Then ordered; `Then` bodies start with `assert` | `features/CLAUDE.md` | Shapes `features/support/steps/` layout |
| Test code should let exceptions bubble rather than catching and logging | `features/CLAUDE.md` | Harness code must not swallow errors |
| Unit tests: `node:test`, `node:assert/strict`, `strong-mock`; no other runner/assertion/mocking library | `.claude/rules/typescript-unit-testing.md` | Add `strong-mock`; add coverage scripts |
| One `test/**/*.test.ts` per `src/**/*.ts` at the mirrored path, no exclusions; 100% per-pair coverage | `.claude/rules/typescript-unit-testing.md` | Drives the type-only scaffold recommendation |
| No `test/helpers/`, `test/utils/`, `test/mocks/`, `test/shared/`; support lives beside the concern's tests | `.claude/rules/typescript-unit-testing.md` | Constrains test-support layout |
| Named exports only, except the single default in `src/index.ts`; `import type` for type-only imports; `.js` extensions | `.claude/rules/typescript-style-guide.md` | Every new module |
| Single quotes, 2-space indent, semicolons, trailing commas, `max-len` 160, `//` comments only | `.claude/rules/typescript-style-guide.md` + `eslint.config.js` | Enforced by ESLint and Prettier |
| CHANGELOG entries: one user-visible change, one sentence, ≤ 25 words, active voice, apply `simple-english` and `humanizer` | `.claude/rules/changelog.md` | If Phase 1 creates `CHANGELOG.md` |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The vendor `protocol` constant is `wss` and the AWS IoT endpoint from `GET /credentials/aws` is a bare hostname suitable for `wss://<endpoint>/mqtt` | AWS IoT Client Decision, Pattern 3 | The signer's host and path would be wrong; caught immediately by a 403 at handshake. Confirm against a recorded credentials response before writing the signer. |
| A2 | The device publishes partial `reported` updates that AWS republishes on `.../shadow/update/accepted`, which is what v1's `foreignStateChange` surfaced | Pattern 4 | If the vendor uses `/update/documents` instead, the subscription set is wrong and no heartbeats arrive. Verifiable from a recorded session or a single `@real` scenario. |
| A3 | Shadow documents carry a monotonically increasing `version` the plugin can use as an out-of-order watermark | Pattern 4 | Without it, out-of-order delivery could apply a stale patch over a newer one. The v1 SDK relies on it, so this is well supported, but it is inferred from the SDK rather than observed on this vendor's shadows. |
| A4 | Auth0 returns `invalid_grant` (not a distinct code) for wrong credentials on the password-realm grant | Code Examples | `D-13`'s stop condition would not trigger, and the plugin would keep retrying into a 30-day block. Widely reported behavior, but Auth0's own error-code page does not list it. Handle any 4xx that is not 429 as terminal to be safe. |
| A5 | The `too_many_attempts` / HTTP 429 response also warrants the `D-13` stop path | Code Examples | Retrying a blocked account extends the block. `D-13` names only `invalid_grant`; extending it to 429 is a research recommendation, not a locked decision — worth confirming with the user. |
| A6 | `dist-test/` is an acceptable second build output directory name and location | Cucumber configuration | Purely cosmetic; the planner may choose otherwise. Must be added to `.gitignore`, `.npmignore`/`files`, `.prettierignore`, and `eslint.config.js` ignores. |
| A7 | Phase 1 creates `CHANGELOG.md`, since CLAUDE.md's versioning rule references it and it does not exist | Project Constraints | If Phase 6 owns it instead, the pre-PR step has nothing to update. Needs a decision. |
| A8 | `sonar-project.properties` is out of Phase 1 scope despite CLAUDE.md's versioning rule referencing it | Project Constraints | Same as A7. |

## Open Questions

1. **Does `GET /credentials/aws` return one credential set for the whole account, or one per device?**
   - What we know: the response shape has a single `endpoint`, `clientId`, and `credentials` object [CITED: `.planning/intel/constraints.md` §5], and the v1 pattern registers many `deviceId`s against one `thingShadow` client.
   - What's unclear: nothing in the intel states it explicitly, though the single-object shape strongly implies account scope.
   - Recommendation: design `ShadowClient` for one connection serving N device shadows. That matches the shape and the v1 usage, and it is the cheaper direction to be wrong in.

2. **Should the `D-13` stop path also cover HTTP 429 `too_many_attempts`?**
   - What we know: Auth0 blocks persist 30 days from the last failed attempt, so retrying a blocked account is strictly harmful.
   - What's unclear: `D-13` names only `invalid_grant`.
   - Recommendation: treat any non-429 4xx and 429 alike as terminal for authentication, with distinct log messages. Flag for user confirmation — this is assumption A5.

3. **Does Phase 1 create `CHANGELOG.md` and `sonar-project.properties`?**
   - What we know: CLAUDE.md's versioning rule references both; `.claude/rules/changelog.md` targets `CHANGELOG.md`; neither file exists.
   - What's unclear: STATE.md assigns packaging/licensing polish to Phase 6.
   - Recommendation: create `CHANGELOG.md` in Phase 1 (it is needed for this phase's own PR) and defer `sonar-project.properties` to Phase 6 with the rest of release tooling.

4. **How does the Cucumber harness start and stop the plugin?**
   - What we know: the test strategy requires a *"plugin harness"* and a *"fake HAP"* under `features/support/`, with a fresh typed `World` per scenario.
   - What's unclear: Phase 1 registers no accessories (`D-03`), so a full fake HAP may be premature. A minimal fake `API` object exposing `hap`, `user.storagePath()`, `on`, and `platformAccessory` might be all Phase 1 needs.
   - Recommendation: build the minimal fake `API` now and grow it in Phase 2 when accessories arrive. Record the boundary in the plan so Phase 2 does not rediscover it.

5. **`ts-node` removal.**
   - What we know: it is a devDependency with no consumer under `D-09`.
   - What's unclear: whether `fallow dead-code --unused-deps` will flag it and thus force the decision.
   - Recommendation: remove it in Phase 1 alongside `homebridge-lib`, and let `npm run check` confirm.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, test, runtime | ✓ | v26.7.0 locally | See note below |
| npm registry | Package installation, version verification | ✓ | — | — |
| `typescript` | `npm run build`, `typecheck` | ✓ | ^6.0.3 (installed) | — |
| `eslint` + `typescript-eslint` | `npm run lint` | ✓ | ^10.9.0 / ^8.67.0 (installed) | — |
| `fallow` | `npm run fallow` | ✓ | ^3.16.0 (installed) — verified green on the current tree | — |
| `prettier` | `format:check` | ✓ | 3.9.6 (installed) | — |
| `homebridge` | Type resolution, `npm run watch` | ✓ | 2.4.0 (installed); 1.8.0 typings checked from the registry | — |
| `mqtt` | Runtime shadow transport | ✗ | — | None; must be installed |
| `@cucumber/cucumber`, `aedes`, `ws`, `strong-mock` | Test suites | ✗ | — | None; must be installed |
| `pre-commit` | Commit gate | Not probed | — | CLAUDE.md requires it; assume present |
| Live vendor cloud | `@real` scenarios only | ✗ (by design) | — | `REL-09` makes those opt-in; the Phase 1 CI suite must not need it |

**Note on the local Node version.** The development machine runs **v26.7.0**, outside `engines.node: "^22.10.0 || ^24.0.0"` [VERIFIED: `node --version` and `package.json`]. Everything verified in this session ran on v26, and `@cucumber/cucumber@13.2.1` declares `"22 || 24 || >=26"`, so nothing is blocked. But two cautions apply: `npm install` will emit `EBADENGINE` warnings, and behavior verified on v26 is not automatically true on 22.10. `REL-01`'s CI matrix (Node 22 and 24 against Homebridge 1.8 minimum, 1.x latest, and current 2.x) is the real compatibility gate; Phase 1 should not treat local success as proof.

**Missing dependencies with no fallback:** `mqtt`, `@cucumber/cucumber`, `aedes`, `ws`, `strong-mock` — all install cleanly from npm with no build step and no install scripts.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (Node ≥ 22 built-in) + `node:assert/strict` + `strong-mock` ^9.2.2 for unit tests; `@cucumber/cucumber` ^13.2.1 for transport-level tests |
| Config file | `tsconfig.test.json` — **none, see Wave 0**. `cucumber.json` — **none, see Wave 0** |
| Quick run command | `node --test dist-test/test/<path>.test.js` (after `npm run build:test`) |
| Full suite command | `npm test` → `npm run test:unit && npm run test:cucumber` (`D-12`) |

Coverage enforcement, verified this session: `node --test --experimental-test-coverage --test-coverage-lines=100 --test-coverage-branches=100 --test-coverage-functions=100 --test-coverage-include='<emitted file>' <emitted test>` exits `1` below threshold and `0` at or above it. That is the mechanism for the `test:coverage:direct` script the project test rules reference.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONF-01 | The plugin registers one dynamic platform under `PLATFORM_NAME` | unit | `node --test dist-test/test/index.test.js` | ❌ Wave 0 |
| CONF-02 | `config.schema.json` declares `strictValidation`, `singular`, `widget: password`, `format: email`, and the plaintext `headerDisplay` | unit | `node --test dist-test/test/configSchema.test.js` | ❌ Wave 0 |
| CONF-03 | Missing email or password logs one error and registers no lifecycle listener | unit | `node --test dist-test/test/platform.test.js` | ❌ Wave 0 |
| CONF-03 | The plugin starts nothing when credentials are absent | cucumber | `cucumber-js features/configuration.feature` | ❌ Wave 0 |
| CONF-04 | An omitted `clientId` uses the bundled constant; a supplied one overrides it | unit | `node --test dist-test/test/config.test.js` | ❌ Wave 0 |
| CONF-05 | `pollInterval` outside 300–3600 and `offlineConfirmationPollCount` outside 1–8 refuse startup; absent values take documented defaults (`D-16`) | unit (data-driven rows) | `node --test dist-test/test/config.test.js` | ❌ Wave 0 |
| AUTH-01 | A valid unexpired cached token is reused without a network call | unit | `node --test dist-test/test/cloud/auth.test.js` | ❌ Wave 0 |
| AUTH-01 | A cache miss performs the password-realm grant and caches the result | cucumber | `cucumber-js features/authentication.feature` | ❌ Wave 0 |
| AUTH-01 | A changed configured email invalidates the cache (`D-08` fingerprint) | unit | `node --test dist-test/test/cloud/auth.test.js` | ❌ Wave 0 |
| AUTH-01 | `invalid_grant` stops authentication, deletes the cache, and makes no further attempt (`D-13`) | cucumber | `cucumber-js features/authentication.feature` | ❌ Wave 0 |
| AUTH-02 | The token cache lands under `api.user.storagePath()` with mode `0600` **after a second write** | unit | `node --test dist-test/test/cloud/auth.test.js` | ❌ Wave 0 |
| AUTH-02 | The redacting logger scrubs passwords, `Bearer` tokens, `AccessKeyId`, `SecretAccessKey`, `SessionToken`, and auth request bodies across all seven `Logging` members | unit | `node --test dist-test/test/logging.test.js` | ❌ Wave 0 |
| SYNC-01 | Each of the four routes builds the right method, path, and `Authorization` header, and touches no excluded route | unit | `node --test dist-test/test/cloud/api.test.js` | ❌ Wave 0 |
| SYNC-01 | A request aborts on the root signal and on its own deadline | unit | `node --test dist-test/test/cloud/api.test.js` | ❌ Wave 0 |
| SYNC-02 | A partial `reported` patch merges without removing omitted fields | unit | `node --test dist-test/test/device/state.test.js` | ❌ Wave 0 |
| SYNC-02 | A `desired` value never becomes reported state; `desired: null` is an acknowledgement, not a sensor value | unit | `node --test dist-test/test/device/state.test.js` | ❌ Wave 0 |
| SYNC-02 | A repeated identical patch produces no spurious `changedKeys` (`D-19`) | unit | `node --test dist-test/test/device/state.test.js` | ❌ Wave 0 |
| SYNC-02 | An out-of-order (older `version`) shadow message is discarded | unit | `node --test dist-test/test/cloud/shadow.test.js` | ❌ Wave 0 |
| SYNC-02 | A real partial heartbeat over the fake broker preserves previously reported pump and power fields | cucumber | `cucumber-js features/shadowMerge.feature` | ❌ Wave 0 |
| SYNC-03 | A full-shadow `get` is published on connect and again on every reconnect | cucumber | `cucumber-js features/shadowLifecycle.feature` | ❌ Wave 0 |
| SYNC-03 | A REST poll reconciles state that the shadow missed while disconnected | cucumber | `cucumber-js features/shadowLifecycle.feature` | ❌ Wave 0 |
| SYNC-04 | The rotation timer fires ~10 minutes before `Expiration` and reschedules from the new expiry | unit (fake clock) | `node --test dist-test/test/runtime/accountRuntime.test.js` | ❌ Wave 0 |
| SYNC-04 | A failed refresh still reschedules (the `finally`) | unit (fake clock) | `node --test dist-test/test/runtime/accountRuntime.test.js` | ❌ Wave 0 |
| SYNC-04 | Rotating credentials does not disconnect the live socket, and the next handshake carries the rotated credentials and the new client ID | cucumber | `cucumber-js features/credentialRotation.feature` | ❌ Wave 0 |
| SYNC-04 | The SigV4 presigner reproduces fixed golden vectors under a fixed clock | unit | `node --test dist-test/test/cloud/shadow.test.js` | ❌ Wave 0 |
| SYNC-04 | Reconnect backoff is capped and a duplicate `error` + `close` pair produces one retry, not two | unit (fake clock) | `node --test dist-test/test/runtime/retryPolicy.test.js` | ❌ Wave 0 |
| SYNC-05 | `stop()` is idempotent: calling it twice, and calling it after a partial startup, leaves no timers and raises nothing | unit | `node --test dist-test/test/runtime/accountRuntime.test.js` | ❌ Wave 0 |
| SYNC-05 | Shutdown during an in-flight retry wait, an in-flight fetch, and an open socket produces no unhandled rejection | cucumber | `cucumber-js features/lifecycle.feature` | ❌ Wave 0 |
| D-15 | Shadow connect failure leaves the runtime up on REST only and logs the degraded path once | cucumber | `cucumber-js features/degradedOperation.feature` | ❌ Wave 0 |
| D-14 | Sustained transient failure logs once at warn, drops to debug, reminds every 15 minutes, and logs recovery at info | unit (fake clock) | `node --test dist-test/test/runtime/accountRuntime.test.js` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run build:test && node --test dist-test/test/<the module touched>.test.js`, plus `npx eslint <changed files> --max-warnings=0`.
- **Per wave merge:** `npm test` (both suites, per `D-12`).
- **Phase gate:** `npm run check` fully green — `typecheck`, `lint`, `fallow` (all three sub-commands), `format:check`, and `test` — plus a `npm pack --dry-run` inspection confirming `dist/protocol.json` and `config.schema.json` are present and that `features/`, `.claude/`, `.pi/`, and `research.tar.gz` are absent.

### Wave 0 Gaps

- [ ] `tsconfig.test.json` — the `D-09` second build config; also the fix for Pitfall 1
- [ ] `eslint.config.js` — change `projectService: true` to `project: ['./tsconfig.json', './tsconfig.test.json']` (Pitfall 1)
- [ ] `eslint.config.js` — scoped override or a `void` convention for `@typescript-eslint/no-floating-promises` in `test/**/*.ts` (Pitfall 2)
- [ ] `cucumber.json` — `default` and `real` profiles
- [ ] `package.json` scripts — `build:test`, `test:unit`, `test:cucumber`, `test`, `test:coverage:direct`, `test:coverage:all`
- [ ] Framework install: `npm install --save-dev @cucumber/cucumber aedes ws strong-mock`
- [ ] `features/support/world.ts` — typed `World` with fake cloud, plugin harness, injectable clock, observations, cleanup
- [ ] `features/support/fakeAuth0.ts`, `features/support/fakeRestApi.ts` — `node:http` servers on ephemeral ports
- [ ] `features/support/fakeShadowBroker.ts` — `aedes` + `ws` + the coalescing bridge (Pattern 6)
- [ ] `features/support/fakeHomebridgeApi.ts` — minimal `API` with `hap`, `user.storagePath()`, `on`, `platformAccessory`
- [ ] Delete `test/plugin.test.mjs` once the mirrored `test/**/*.test.ts` suite exists
- [ ] `.gitignore`, `.prettierignore`, `eslint.config.js` ignores, and the packaging allowlist all updated for `dist-test/`

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` [VERIFIED: `.planning/config.json`].

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Auth0 password-realm grant; credentials supplied by the administrator, never generated or stored by us beyond `config.json` (Homebridge-owned) and the derived `id_token` |
| V3 Session Management | yes | Cached `id_token` with a stored expiry and a salted email fingerprint (`D-08`); reauthenticate before expiry; delete the cache on rejection (`D-13`) |
| V4 Access Control | no | The plugin is single-tenant, single-account, with no local authorization surface. Vendor-side authorization is enforced by the bearer token and by the AWS IoT policy attached to the vendor's STS credentials |
| V5 Input Validation | yes | Two boundaries: the administrator's `config.json` (`validateConfig`, refuse-not-clamp, `D-16`) and untrusted vendor wire data (`unknown` + hand-written predicates in `src/cloud/types.ts`; `D-20` validated-shape record) |
| V6 Cryptography | yes | `node:crypto` only — HMAC-SHA256 for SigV4 (never hand-roll the primitives; only the canonicalization is ours) and a salted hash for the email fingerprint. No key generation, no key storage beyond the vendor's STS material held in memory |
| V7 Error Handling & Logging | yes | `D-18` redacting wrapper across all seven `Logging` members; `D-14` rate-limited transient logging; Verified rule "must catch and log its own errors" |
| V8 Data Protection | yes | Token cache owner-only and atomic (Pitfall 3); no secrets in `accessory.context`; no secrets in the packed package (Pitfall 6); `REL-04` placeholder discipline |
| V9 Communication | yes | TLS everywhere: `https://` for Auth0 and REST, `wss://` for AWS IoT with SNI. Never disable certificate verification in production code; the fake-broker `ws` override is a constructor default, not a TLS bypass |
| V10 Malicious Code | yes | `REL-03` telemetry review of direct dependencies; verified that no selected package has an `install` or `postinstall` script; `aws-crt` rejected partly on this basis |
| V14 Configuration | yes | `strictValidation: true` in the UI plus runtime refusal (`D-16`); vendor constants bundled, not configurable (`D-07`, `CONF-04`) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Account password written to `config.json` in plain text and included in Homebridge backups | Information disclosure | Cannot be avoided — unattended auth requires it. Mitigate by disclosure: `headerDisplay` in the form, `REL-08` documentation, and a child-bridge recommendation. Locked as `D-023`. |
| Bearer token, STS credentials, or auth body leaking into logs or a support paste | Information disclosure | `D-18` structural redaction with a dedicated test group; assert against every `Logging` member including the callable form and `debug` |
| Token cache readable by other local users | Information disclosure | Owner-only mode via temp-file + rename (Pitfall 3), under `api.user.storagePath()` |
| Secrets or account identifiers shipped in the npm tarball | Information disclosure | `files: ["dist", "config.schema.json"]` allowlist plus a `npm pack --dry-run` gate (Pitfall 6) |
| Retry loop against Auth0 converting a typo into a 30-day account block | Denial of service (self-inflicted) | `D-13` stop-on-rejection, extended to HTTP 429 (open question 2) |
| Duplicate AWS IoT client ID causing the plugin to disconnect itself in a loop | Denial of service | Always use the client ID from the most recent `GET /credentials/aws`; set it inside `transformWsUrl` |
| Malformed or hostile vendor payload becoming plausible HomeKit state | Tampering | `D-20` typed envelope with opaque validated-shape `data`; `D-14` preserve-and-mark; no `as` casts at the wire boundary |
| Slopsquatted or compromised dependency executing at install time | Malicious code | Package legitimacy audit above; zero install/postinstall scripts across all selected packages |
| SigV4 presigned URL leaking into a log line | Information disclosure | The URL embeds `X-Amz-Credential` and `X-Amz-Security-Token`; add both parameter names to the `D-18` redaction pattern list, and never log the connect URL |
| Unhandled rejection during shutdown crashing Homebridge | Denial of service | `SYNC-05` single abortable lifecycle; `void` on both lifecycle handlers; Verified "must not throw unhandled exceptions" |

## Sources

### Primary (HIGH confidence)

- `aws-crt@1.33.1` tarball — `dist/native/auth.d.ts`, `dist/native/aws_iot.d.ts`, `dist/native/mqtt.d.ts`, `scripts/install.js`, `package.json`, prebuilt binary inventory (downloaded and read this session)
- `mqtt@5.15.2` tarball — `build/lib/client.d.ts`, `build/lib/connect/ws.js`, `README.md`, `package.json` (downloaded and read this session)
- `aedes@1.1.1` — `lib/client.js`, `types/instance.d.ts`, `package.json` (installed and read this session)
- `ws@8.21.3` — `lib/stream.js` (installed and read this session)
- `aws/aws-iot-device-sdk-js` `master` — `device/index.js`, `thing/index.js` (fetched from raw.githubusercontent.com this session)
- `homebridge@2.4.0` and `homebridge@1.8.0` — `dist/logger.d.ts`, `dist/api.d.ts`, `dist/user.d.ts` (installed / downloaded this session)
- `fallow@3.16.0` — `schema.json`, `explain unused-files` output (installed)
- Repository files read this session: `package.json`, `tsconfig.json`, `.fallowrc.json`, `.npmignore`, `config.schema.json`, `eslint.config.js`, `.claude/rules/typescript-style-guide.md`, `.claude/rules/typescript-unit-testing.md`, `.claude/rules/changelog.md`, `features/CLAUDE.md`, `CLAUDE.md`, `src/*.ts`
- `.planning/intel/constraints.md`, `.planning/intel/context.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/phases/01-secure-cloud-foundation/01-CONTEXT.md`
- Live experiments run this session: aedes+ws+mqtt round trip, credential-rotation reconnect, Cucumber ESM/TS suite, `resolveJsonModule` under `nodenext`, `fs.writeFile` mode behavior, `AbortSignal` composition, Node strip-only rejections, `node --test` coverage thresholds, `fallow ignoreFindings`, ESLint project-service failure and fix, `npm pack --dry-run`

### Secondary (MEDIUM confidence)

- AWS IoT Core Developer Guide — *Device communication protocols* (connection duration limits, protocol/auth matrix): https://docs.aws.amazon.com/iot/latest/developerguide/protocols.html
- AWS IoT Core Developer Guide — *MQTT* (client ID uniqueness, MQTT differences, SNI requirement): https://docs.aws.amazon.com/iot/latest/developerguide/mqtt.html
- AWS IoT Core Developer Guide — *Device Shadow MQTT topics*: https://docs.aws.amazon.com/iot/latest/developerguide/device-shadow-mqtt.html
- AWS General Reference — *AWS IoT Core endpoints and quotas* (WebSocket connection duration quota): https://docs.aws.amazon.com/general/latest/gr/iot-core.html
- Auth0 Docs — *Brute-force Protection* (threshold, 30 days from last failed attempt, HTTP 429 `too_many_attempts`): https://auth0.com/docs/secure/attack-protection/brute-force-protection
- Cucumber.js docs — *Configuration*: https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md
- Cucumber.js docs — *ES Modules*: https://github.com/cucumber/cucumber-js/blob/main/docs/esm.md
- `aws/aws-iot-device-sdk-js` README (maintenance-mode notice, `updateWebSocketCredentials` docs): https://github.com/aws/aws-iot-device-sdk-js/blob/master/README.md
- `aws/aws-sdk-js-v3` issue #3417 — SignatureV4 presign cannot support `iotdevicegateway`: https://github.com/aws/aws-sdk-js-v3/issues/3417
- Homebridge developer documentation: https://developers.homebridge.io/#/

### Tertiary (LOW confidence)

- `aws/aws-iot-device-sdk-js-v2` issue #445 — websocket credential-expiry error handling; corroborating only
- `aws/aws-iot-device-sdk-js` issue #241 — "How does one handle expired credentials?"; no maintainer answer visible, used only as evidence that the question is common

## Metadata

**Confidence breakdown:**

- AWS IoT client decision: **HIGH** — the AWS quota table, the v1 source, and a working end-to-end experiment agree; the only untested piece is a real AWS handshake with our signer
- Standard stack: **HIGH** — every package version, install script, and module format read from the registry or the tarball
- Architecture: **HIGH** for the runtime shape (component table and lifecycle come from ingested intel that is already ADR-backed); **MEDIUM** for the shadow-topic subset, which infers vendor behavior from AWS docs plus the v1 SDK rather than from a recorded vendor session
- Pitfalls: **HIGH** — all nine reproduced in this session, seven of them against this repository's own configuration
- Validation architecture: **HIGH** — the framework, commands, and coverage-threshold mechanism were all executed
- Vendor protocol specifics (assumptions A1–A3): **MEDIUM** — sourced from ingested intel, not re-verified against hardware, which `REL-09` reserves for the opt-in suite

**Research date:** 2026-08-28
**Valid until:** 2026-09-27 (30 days). Re-check `aws-crt` for a JavaScript credentials delegate and `mqtt` for `transformWsUrl` changes if Phase 1 slips past that date.
