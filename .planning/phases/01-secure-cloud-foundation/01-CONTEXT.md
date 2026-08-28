# Phase 1: Secure Cloud Foundation - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the account-level cloud runtime and nothing above it.

**In scope:** the Homebridge Plugin Settings form and its validation (CONF-01 through CONF-05); unattended Auth0 password-realm authentication with a cached ID token (AUTH-01, AUTH-02); a typed REST client for `/devices`, `/devices/{deviceId}`, `/devices/{deviceId}/data`, and `/credentials/aws` (SYNC-01); an AWS IoT shadow subscription with in-place temporary-credential rotation (SYNC-04); one canonical merged snapshot per device built from REST snapshots and partial shadow `reported` patches (SYNC-02); full-shadow refresh after startup and reconnect plus REST polling as reconciliation backstop (SYNC-03); and one abortable, idempotent start/stop lifecycle covering timers, subscriptions, retry waits, and the shadow socket (SYNC-05).

**Out of scope:** HomeKit accessories and services, family validation and field decoding, water-level or fault interpretation, commands, pump observation records, and offline confirmation. Those belong to Phases 2 through 5. Phase 1 registers no platform accessories.

</domain>

<decisions>
## Implementation Decisions

### Template teardown

- **D-01:** Remove the template scaffold completely. Delete `src/platformAccessory.ts`, `EXAMPLE_DEVICES`, the Lightbulb service, both example motion sensors, and the unmanaged `setInterval(…, 10_000)` loop. `src/platform.ts` becomes a composition root that owns config validation, the restored-accessory map, and `AccountRuntime` start/stop. This is step 1 of the intel's implementation sequence.
- **D-02:** Remove `homebridge-lib` entirely in this phase — the `EveHomeKitTypes` import in `src/platform.ts`, the `src/@types/homebridge-lib.d.ts` shim, and the `dependencies` entry in `package.json`. Full teardown orphans its only consumer, and `D-033` requires removal regardless. Update the STATE.md pending todo to record that this closed in Phase 1 instead of Phase 6. — **Reversibility:** reversible — re-adding a dependency and a type shim is a local change.
- **D-03:** Phase 1 registers no platform accessories. `configureAccessory()` records restored accessories in the map and nothing else. Do not call `unregisterPlatformAccessories` for any reason — the conservative removal policy is a Phase 2 deliverable (`DEV-05`, `D-029`), and Phase 1 must not delete anything from a user's HomeKit.
- **D-04:** `config.schema.json` carries only the Phase 1 fields: `strictValidation: true`, a `headerDisplay` stating that Homebridge stores the password in plain text in `config.json` and in backups, then `name`, `email` (`format: email`), `password` (`widget: password`), `clientId`, `pollInterval` (`placeholder` 900, not `default`), and `offlineConfirmationPollCount` (`default` 2). `ignoredFaults` is deferred to Phase 3 with `CONF-06`. — **Reversibility:** costly — field names and shapes become a user-facing config contract as soon as a `0.x` prerelease ships under `D-026`; renaming one later requires a migration note and breaks existing `config.json` files.

### Cloud transport

- **D-05:** The AWS IoT client library is **not chosen during discussion**. It goes to `gsd-phase-researcher` as an explicit directive — see the research directive block below. Do not let planning assume a library. **RESOLVED by research (2026-08-28, `01-RESEARCH.md` §AWS IoT Client Decision): `mqtt` ^5.15.2 + `transformWsUrl` + ~35 lines of SigV4 on `node:crypto`.** Research established that AWS validates SigV4 only at the WebSocket handshake and publishes a 24-hour maximum MQTT connection duration, so an established connection outlives its ~1-hour STS credentials; v1's `updateWebSocketCredentials()` was three variable assignments consumed only by the *next* connection attempt and never touched the live socket. `SYNC-04`/`D-015` therefore need no revision. A daily reconnect at the 24-hour ceiling is normal and must not be logged as a fault. — **Reversibility:** one-way — the choice determines whether credential rotation can happen in place or requires reconnect, which is the load-bearing behavior in `SYNC-04`; changing it after `ShadowClient` and its transport-level test harness exist means rewriting both.
- **D-06:** The REST client uses Node's built-in global `fetch` with `AbortSignal`, behind a small typed wrapper owning base URL, `Authorization` header, timeouts, and redacted error reporting. No HTTP dependency. The `D-038` 2.5-second command deadline comes from `AbortSignal.timeout()`.
- **D-07:** The bundled public protocol constants (`apiUrl`, `clientId`, `auth0Domain`, `auth0Realm`, `awsRegion`, `protocol`) live in a single JSON data file imported via `resolveJsonModule` and shipped in the package. `REL-04` already carves out "the bundled data file alone may contain required public vendor constants", so secret and identifier scans get one known allowlist path.
- **D-08:** The Auth0 token cache file stores the `id_token`, its expiry, and a salted hash of the configured account email. A changed email in `config.json` invalidates the cache instead of silently reusing the previous account's token for up to its 30-day lifetime. Unreadable, malformed, expired, or fingerprint-mismatched means log at debug and re-authenticate — never a hard failure. File lives under `api.user.storagePath()` with owner-only permissions where the OS supports them (`AUTH-02`).

### Testing

- **D-09:** Unit tests compile then run: `tsc` emits, `node --test` runs the emitted JavaScript with source maps for stack traces. This preserves the full TypeScript language. Native strip-only mode was rejected on verified evidence — Node rejects both `TypeScript parameter property is not supported in strip-only mode` and `TypeScript enum is not supported in strip-only mode`, which would force constructor DI away from parameter properties and force `const enum` service subtypes into `as const` objects. A second tsconfig emits `test/` alongside `src/`. — **Reversibility:** costly — switching later means touching every test file's build path plus CI.
- **D-10:** The Cucumber fake-pump harness is built in Phase 1. Phase 1 is the cloud layer, so the fake cloud is its natural companion, and success criteria 3 and 4 are close to untestable without it. Phase 1 scenarios assert runtime behavior with no HomeKit involved: partial-shadow merge preserving omitted fields, `desired` values never becoming reported state, credential rotation, reconnect with capped backoff, and shutdown with no unhandled rejection.
- **D-11:** Fakes are layered. Unit tests inject fake `AuthClient`, `CloudApi`, and `ShadowClient` through constructor DI — fast, deterministic, no sockets. Cucumber fakes at the transport level instead: a local HTTP server for Auth0 and REST, an in-process MQTT broker for the shadow. The transport-level tests therefore never name the SDK and survive whatever D-05 resolves to. — **Reversibility:** costly — the seam determines what the whole harness is written against.
- **D-12:** `npm test` runs **both** the unit suite and the Cucumber suite. `npm run check` keeps its current composition (`typecheck`, `lint`, `fallow`, `format:check`, `test`) and therefore covers both. Nothing can be skipped by accident.

### Failure and retry behavior

- **D-13:** An Auth0 credential rejection (`invalid_grant`) stops authentication. Log one actionable error naming the fix, delete the cached token, and make no further attempt until Homebridge restarts or the configuration changes. Rationale, verified during discussion: Auth0 brute-force blocks persist for 30 days from the *last* failed attempt, so a retrying plugin permanently prevents the block from clearing. Saving config in the Homebridge UI restarts the bridge, so the user's natural fix already re-triggers a start.
- **D-14:** Sustained transient failures log once at warn with the reason, drop consecutive same-kind failures to debug, emit one warn-level reminder every 15 minutes while still failing, and log recovery at info. A 30-second backoff must not produce 120 warn lines per hour.
- **D-15:** If REST discovery succeeds but the shadow connection does not, the runtime stays up and runs degraded on REST only. REST polling is the state source, the shadow is retried on capped backoff in the background, and the degraded monitoring path is logged once. `SYNC-03` already treats REST as the reconciliation backstop. — **Reversibility:** costly — the set of runtime states Phase 5 consumes for `RES-03`/`RES-04` is shaped here.
- **D-16:** Configuration that is out of range or structurally invalid causes the plugin to refuse to start, exactly like missing credentials: log one actionable error and start nothing. `strictValidation: true` only guards the UI form, so hand-edited `config.json` reaches the runtime. **This deliberately overrides the clamping approach shown in the intel's `Math.max(300, cfg.pollInterval ?? 900)` snippet** — do not clamp, and do not silently substitute defaults for supplied-but-invalid values. Absent optional fields still take their documented defaults.

### Architecture

- **D-17:** Adopt the `ARCHITECTURE` source tree, scaffolded in full during Phase 1: `src/{index,settings,config,platform}.ts`, `src/runtime/{accountRuntime,retryPolicy}.ts`, `src/cloud/{auth,api,shadow,types}.ts`, `src/device/{state,events,health,family,gemini,halo}.ts`, `src/accessories/{basementGuardian,services}.ts`, `src/persistence/accessoryContext.ts`. The flatter `PLUGIN` tree was rejected because folding `AccountRuntime` into `platform.ts` recreates the `homebridge-nest` connection-monolith failure mode the intel calls out. **See the tooling conflict below — scaffolding unreferenced modules fails an existing quality gate, and the planner must resolve that explicitly.**
- **D-18:** Secret redaction is structural, not a convention. All plugin logging goes through one redacting wrapper that scrubs registered secret values and known patterns (`Bearer` tokens, `AccessKeyId`, `SecretAccessKey`, `SessionToken`, authentication request bodies) before delegating to Homebridge's `Logging`. This is directly testable, which `REL-02` already requires as a "Secret handling" test group. — **Reversibility:** costly — every log call site routes through it.
- **D-19:** `DeviceStateStore.subscribe(deviceId, listener)` notifies with `(next, previous, changedKeys)`. Phase 1 shallow-compares the merged data object and reports which keys changed; it does not decide relevance, because no family adapter exists yet to define it. Phase 3 derivations filter on `changedKeys` rather than re-diffing snapshots, which is where duplicate activation records otherwise come from. — **Reversibility:** costly — this contract is consumed by Phases 2 through 5.
- **D-20:** The Phase 1 canonical snapshot is a typed envelope around opaque data. Type only what Phase 1 genuinely owns — `deviceId`, `deviceTypeId`, `name`, `serialNumber`, `connectivity`, device timestamps, and local receipt time kept separate from device time — and carry `reported.data` as a validated-shape record with **no field decoding**. Gemini field typing and strict validation belong to Phase 2 (`DEV-02`, `DEV-03`); pulling them forward would put safety-critical `water_level` decoding in a phase whose success criteria do not cover it. — **Reversibility:** costly — Phase 2's family adapter is written against this shape.

### Research directive — resolve before planning

`gsd-phase-researcher` must resolve the AWS IoT client choice with evidence, not preference. Findings established during discussion, to be treated as inputs rather than repeated work:

- `aws-iot-device-sdk` (v1, 2.2.16) is in **maintenance mode** — its README states "This SDK will no longer receive feature updates, but will receive security updates." It exact-pins `mqtt@4.2.8`. It has `updateWebSocketCredentials()`, the API the 90-minute hardware rotation test exercised. The user has rejected it on maintenance grounds; do not select it without new evidence that the alternatives cannot meet `SYNC-04`.
- `aws-iot-device-sdk-v2` (1.28.0) depends on `aws-crt` (1.33.1). Its tarball **does** ship prebuilt N-API binaries for `linux-x64-glibc`, `linux-x64-musl`, `linux-arm64-glibc`, `linux-arm64-musl`, `darwin-arm64`, `darwin-x64`, and `win32-x64`, and `scripts/install.js` exits immediately when the matching binary is present. It compiles from source via CMake and a CloudFront-hosted tarball only for uncovered platforms — notably 32-bit `armv7`. Footprint is 16 MB packed / 44 MB unpacked, and it pulls `axios` and `crypto-js` transitively. **Its blocker is credentials, not install:** `aws-crt`'s `AwsCredentialsProvider` exposes only `newDefault`, `newStatic`, `newCognito`, and `newX509`, and the source states "We don't currently expose an interface for fetching credentials from Javascript." Vendor STS credentials from `GET /credentials/aws` can therefore only enter via `newStatic()`, making rotation a client rebuild.
- `mqtt` 5.x offers `transformWsUrl(url, options, client) => url`, documented for "signing urls which upon reconnect can have become expired" and invoked on every new WebSocket connection. It is synchronous and cannot fetch, but `SYNC-04` already requires a refresh timer holding fresh credentials, so the hook only re-signs from that cache. Cost is roughly 60 lines of SigV4 presigned-URL signing on `node:crypto`, deterministic under a fixed clock and therefore coverable by golden-vector tests.

Required outputs from research:

1. Determine empirically whether an **established** AWS IoT MQTT-over-WebSocket SigV4 connection survives expiry of the credentials that signed it, or whether AWS IoT disconnects. This determines whether "rotate in place" is achievable at all, or whether v1's `updateWebSocketCredentials()` only affected the next reconnect.
2. Confirm whether `aws-crt` has added a JavaScript delegate credentials provider after 1.33.1.
3. Recommend one library with a rationale that satisfies `SYNC-04` as written, **or** state plainly that no option can, and propose the specific revision `D-015`/`SYNC-04` would need to permit reconnect-on-rotation. Do not quietly weaken the requirement.

### Tooling conflicts the planner must resolve

These are consequences of decisions above, discovered during discussion. They are in Phase 1 scope — do not defer them to be hit during execution.

- **`D-17` versus the dead-code gate.** `.fallowrc.json` declares `entry: ["src/index.ts"]`, and `npm run check` runs `fallow dead-code --fail-on-issues`. Scaffolding modules that nothing imports yet will fail that gate. Resolve deliberately: scoped `.fallowrc.json` ignores for not-yet-wired modules, placeholder modules that export a real typed contract already referenced by the store or runtime, or an agreed narrowing of what "scaffold it all" means. Whatever is chosen, `npm run check` must pass at the end of the phase.
- **(Superseded by `D-21` — the allowlist removes `.npmignore` entirely.)** `.npmignore` does not exclude `features/`. It excludes `test/` and `tests/`, but Phase 1 creates `features/` (`D-10`), which would then ship in the packed package against `REL-04` and `REL-05`. Add the exclusion in Phase 1 since Phase 1 creates the directory.
- **(Superseded by `D-21`.)** No `files` field in `package.json`. Packaging is `.npmignore`-driven. The new JSON constants data file (`D-07`) must be confirmed present in `npm pack --dry-run` output, and `config.schema.json` must remain included.

### Post-research decisions (recorded 2026-08-28)

These were raised by `01-RESEARCH.md` and decided after research returned. They are in Phase 1 scope.

- **D-21:** Replace denylist packaging with an explicit `files` allowlist in `package.json` and **delete `.npmignore` entirely**, mirroring the sibling `pi-claude-marketplace` repository, which ships `files: ["CHANGELOG.md", "LICENSE", "README.md", "extensions/…/**"]` and carries no `.npmignore`. For this package the allowlist is `dist`, `config.schema.json`, and `CHANGELOG.md`; npm force-includes `LICENSE` and `README*` regardless. **Verified problem being fixed:** `npm pack --dry-run` currently emits **755 files, 3.2 MB packed / 11.1 MB unpacked**, comprising 735 files of `.claude/`, plus `research.tar.gz`, `CLAUDE.md`, `.pi/`, and `features/`. `research.tar.gz` holds the raw pre-sanitization material — `research/API.md`, `research/OPERATIONS.md`, `research/dump/`, and the live vendor scripts `auth.sh`, `poll.sh`, `api.sh`, `watch.js` — which is exactly what `D-027` and `REL-04` forbid shipping. It is gitignored, so it never appears in `git status`; only `private: true` has prevented publication. **Acceptance:** `npm pack --dry-run` lists only the intended files, and the JSON constants data file from `D-07` is confirmed present (`tsc` copies it into `dist/`). — **Reversibility:** reversible — packaging metadata is a local change.

- **D-22:** An Auth0 HTTP 429 `too_many_attempts` is **retried on a long backoff**, not routed to the `D-13` stop path. This is a deliberate user override of the recommendation. Rationale for the override: a 429 can originate from shared-IP throttling unrelated to this account's credentials, and permanently halting a basement safety monitor on a throttling response is worse than the alternative. **Accepted risk, which the plan must not paper over:** if the 429 does reflect a genuine account block, each retry refreshes Auth0's 30-day window measured from the last failed attempt. Mitigations required in the plan: the retry interval must be long (not the standard capped backoff), the log message must name the 429, state that a genuine block extends 30 days from the last attempt, and tell the user how to stop the plugin if the block is real. `D-13`'s stop-on-`invalid_grant` behavior is unchanged. — **Reversibility:** reversible.

- **D-23:** Create `CHANGELOG.md` in Phase 1 using Keep a Changelog structure with an `Unreleased` section, and record Phase 1's changes in it. Phase 1 is the first phase producing shippable code and the first to meet CLAUDE.md's pre-PR changelog rule, so later phases append rather than bootstrap. Include it in the `D-21` allowlist. — **Reversibility:** reversible.

### Claude's Discretion

- The injectable clock's shape and how it reaches retry, timeout, and heartbeat-age code.
- Whether the REST poll timer and the credential rotation timer share one scheduler.
- Whether `AccountRuntime` exposes only start/stop or also a health projection for Phase 5.
- Internal module naming, error type hierarchy, and the exact typed-wrapper API for `fetch`.
- Backoff constants, subject to the intel's capped shape `Math.min(30_000, 1000 * 2 ** (attempt - 2))` with a re-entrancy guard, since `error` and `close` both fire.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked product and architecture decisions
- `.planning/PROJECT.md` — all 40 ADR-locked decisions, constraints, and the test strategy. Phase 1 is governed by `D-013`, `D-015`, `D-023`, `D-024`, `D-028`, `D-031`, `D-033`, `D-036`, `D-038`.
- `.planning/intel/decisions.md` — authoritative ingested decision record behind PROJECT.md.
- `.planning/REQUIREMENTS.md` — `CONF-01` through `CONF-05`, `AUTH-01`, `AUTH-02`, `SYNC-01` through `SYNC-05` are this phase's requirements. `CONF-06` is Phase 3.
- `.planning/ROADMAP.md` — Phase 1 goal and its four success criteria.

### Protocol and runtime behavior
- `.planning/intel/constraints.md` §3 — Auth0 password-realm grant shape, `Authorization: Bearer <id-token>`, 30-day observed token lifetime, HTTP 403 on unauthenticated requests.
- `.planning/intel/constraints.md` §2 — the six bundled public protocol constants and the rule that only `clientId` is overridable.
- `.planning/intel/constraints.md` §4 — the four REST routes v1 uses, and the account/device-management routes it must not touch.
- `.planning/intel/constraints.md` §5 — `GET /credentials/aws` response shape, ~1-hour credential lifetime, per-connection client ID, thing name equals `deviceId`, `persistentSubscribe`, `reported.data` versus `reported.state`.
- `.planning/intel/context.md` §1 — heartbeat cadence ~898 s, the seven fields a partial heartbeat carries, and the rule that heartbeats merge rather than replace.
- `.planning/intel/context.md` §2 — credential rotation ten minutes before expiry, rescheduling from the new expiry, and "do not reconnect only because the credentials changed".
- `.planning/intel/context.md` §4 — liveness signal ordering and why shadow silence alone never proves offline.
- `.planning/intel/context.md` §6 — the ten numbered runtime requirements.

### Homebridge and architecture implementation guidance
- `.planning/intel/context.md` "Architectural lessons" — component responsibility table, the `ARCHITECTURE` source layout adopted in `D-17`, the eight state-store rules, the `DeviceStateStore` interface sketch, resource-lifetime ordering, configuration strategy, and the test-group table.
- `.planning/intel/context.md` "Building the Homebridge plugin" §1 — dynamic platform justification and the constructor bail-out that returns before registering listeners.
- `.planning/intel/context.md` §3 — full `config.schema.json` reference including `widget: password`, `strictValidation`, and `placeholder` versus `default`.
- `.planning/intel/context.md` §5 — `accessory.context` persists only via `api.updatePlatformAccessories()`; token must not be written into `config.json`.
- `.planning/intel/context.md` §9 — start in `didFinishLaunching` never the constructor, `api.on('shutdown')` as sole teardown owner, the rotation `finally` that always reschedules, and the capped-backoff shape.
- `.planning/intel/context.md` §11 — the Homebridge Verified checklist, especially "must not start unless it is configured", "files inside the Homebridge storage directory", and "must not throw unhandled exceptions".

### Repository standards
- `CLAUDE.md` — project guidelines, git and branching rules, external reference documentation policy.
- `.claude/rules/typescript-style-guide.md` — TypeScript style rules.
- `.claude/rules/typescript-unit-testing.md` — unit-test structure and naming.
- `.claude/rules/typescript-comments.md` — comment conventions.
- `.claude/rules/changelog.md` — CHANGELOG requirements.
- `features/CLAUDE.md` — Gherkin phrasing rules and step-definition organization; binding on the `D-10` harness.

### External documentation
- Homebridge plugin documentation — https://developers.homebridge.io/#/ — plugin lifecycle, config schema, `api.hap`.
- Cucumber.js documentation — https://github.com/cucumber/cucumber-js/tree/main/docs — ESM and TypeScript support, profiles, World objects.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.ts` — already correct. Registration only, `PLATFORM_NAME` plus the platform class. Keep as is.
- `src/settings.ts` — `PLATFORM_NAME = 'BasementGuardian'` and `PLUGIN_NAME = 'homebridge-basement-guardian'` match `config.schema.json`'s `pluginAlias` and `package.json`'s `name`. These three must stay aligned; changing any of them orphans every cached accessory.
- `test/hbConfig/` — throwaway Homebridge instance for `npm run watch` via `nodemon.json`. Useful for manual Phase 1 verification. `test/hbConfig/config.json` will hold a real account password, so confirm it is git-ignored before use.
- `tsconfig.json` — already strict, with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, and `resolveJsonModule` already enabled — the last of which `D-07` depends on.

### Established Patterns
- ESM with `"type": "module"` and `module: nodenext`. Every relative import needs an explicit `.js` extension.
- `npm run check` = `typecheck` + `lint` + `fallow` + `format:check` + `test`. All five must pass at phase end.
- `fallow` enforces `maxCyclomatic: 20`, `maxCognitive: 15`, `maxUnitSize: 60`, `maxCrap: 0`, duplicate threshold 3, and `private-type-leaks: error`. The 60-line unit cap shapes how `AccountRuntime` and the state reducer are decomposed.
- Pre-commit hooks run over changed files; `pre-commit run --all-files` must be clean before any commit attempt, per `CLAUDE.md`.

### Integration Points
- `src/platform.ts` constructor — where the missing-credential and invalid-config bail-outs land (`D-16`, `CONF-03`), before any listener is registered.
- `api.on('didFinishLaunching')` — where `AccountRuntime.start()` is invoked; never the constructor.
- `api.on('shutdown')` — sole owner of teardown; aborts the root controller, then clears timers, then closes the shadow.
- `api.user.storagePath()` — the only permitted location for the token cache file (`AUTH-02`, and a Verified requirement).
- `api.hap` — the only permitted source of HAP objects. Never import HAP-NodeJS directly.

### Known contradictions to correct in this phase
- `package.json` declares `"license": "Apache-2.0"`, which contradicts `D-035`'s `SEE LICENSE IN LICENSE` rule. STATE.md assigns this to Phase 6 — leave it, but do not propagate the inconsistency into new metadata.
- `package.json` keeps `"private": true` as an accidental-publish guard, removed in Phase 6 under `D-026`. Leave it.
- `config.schema.json` currently has `strictValidation: false` and only a `name` property. Phase 1 replaces both (`D-04`).

</code_context>

<specifics>
## Specific Ideas

- The user rejected `aws-iot-device-sdk` v1 specifically because it is a deprecated library, and asked for v2 to be examined in detail rather than dismissed on the install-script concern. That concern was investigated and found overstated — prebuilt binaries cover every mainstream Homebridge host. The remaining objection to v2 is the absence of a JavaScript credentials provider, which is a functional conflict with `SYNC-04`, not a packaging one. Research must engage with that specific point.
- The user chose to refuse startup on invalid configuration rather than clamp, overriding the recommendation. Treat strictness about configuration as the house position for this project.
- The user chose to scaffold the entire source tree up front rather than build it out as needed, accepting the placeholder cost. Do not quietly narrow this to "create directories as they fill" — resolve the dead-code gate instead.

</specifics>

<deferred>
## Deferred Ideas

- `ignoredFaults` configuration field and its seven-slug enum — Phase 3, with `CONF-06`.
- Conservative cached-accessory removal, including the two-successful-inventory policy and the final current-inventory check — Phase 2 (`DEV-05`, `D-029`).
- Family registry, startup validation ladder, and the `water_level` legal-value domain check — Phase 2 (`DEV-02`, `DEV-03`).
- Offline confirmation using `offlineConfirmationPollCount` — the field is configured in Phase 1, but the behavior it drives is Phase 5 (`RES-03`).
- `package.json` license metadata alignment with `D-035`, and removal of `private: true` — Phase 6.
- Backup-battery fault adapter proposal (`battery_health == 32`) — open proposal, resolves during Phase 3 discussion.

</deferred>

---

*Phase: 1-Secure Cloud Foundation*
*Context gathered: 2026-08-28*
