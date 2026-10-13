---
phase: 06-validated-release-candidate
plan: 04
subsystem: infra
tags: [privacy, telemetry, http, mqtt, auth0]

# Dependency graph
requires: []
provides:
  - PLUGIN_USER_AGENT, a single identity constant in src/settings.ts applied to every outbound vendor request
  - requestInit() in src/cloud/api.ts sending the identity header on both the read and command branches
  - fetchGrant() in src/cloud/auth.ts sending the identity header on the Auth0 login request
  - createMqttTransport() in src/cloud/mqttTransport.ts sending the identity header on the WebSocket handshake via wsOptions.headers
affects: [06-05, 06-06, ship]

# Actuals (#2632)
actuals:
  tokens: 4240
  tasks: 2
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One identity constant (PLUGIN_USER_AGENT) threaded through a chain of caller-supplied options fields (MqttTransportOptions.userAgent -> ShadowClientOptions.userAgent), rather than importing settings.ts into a low-level transport module"

key-files:
  created: []
  modified:
    - src/settings.ts
    - src/cloud/api.ts
    - src/cloud/auth.ts
    - src/cloud/mqttTransport.ts
    - src/cloud/shadow.ts
    - src/runtime/accountRuntime.ts
    - test/settings.test.ts
    - test/cloud/api.test.ts
    - test/cloud/auth.test.ts
    - test/cloud/mqttTransport.test.ts
    - test/cloud/shadow.test.ts

key-decisions:
  - "MqttTransportOptions is actually assembled in src/cloud/shadow.ts's openConnection(), not in src/runtime/accountRuntime.ts as the plan stated -- shadow.ts calls options.createTransport(...) with the full options object. ShadowClientOptions gained its own userAgent field so the identity string can still enter the system at accountRuntime.ts, the one place PLUGIN_USER_AGENT is imported, and flow through shadow.ts to the transport."
  - "A required userAgent field on MqttTransportOptions and ShadowClientOptions ripples into every literal that satisfies those types. test/cloud/shadow.test.ts is not in this plan's declared files_modified list, but its harness constructs a typed ShadowClientOptions literal directly, so it needed one added field to keep compiling; fixed as a Rule 3 blocking issue rather than left broken."

patterns-established: []

requirements-completed: [REL-03, REL-04]

coverage:
  - id: D1
    description: "One PLUGIN_USER_AGENT constant (renamed from COMMAND_USER_AGENT) applies to every outbound vendor request: REST reads, REST commands, the Auth0 login, and the MQTT WebSocket handshake"
    requirement: "REL-03"
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#declares the bearer token and the identity header on a read request"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#declares exactly four headers on a command request"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#identifies the plugin on the grant request, alongside its content type"
        status: pass
      - kind: unit
        ref: "test/cloud/mqttTransport.test.ts#signs the WebSocket handshake with the caller-supplied identity header"
        status: pass
    human_judgment: false
  - id: D2
    description: "The identity string carries no version, hostname, operating-system detail, bridge name, account identifier, or device identifier, and introduces no new outbound destination"
    requirement: "REL-03"
    verification:
      - kind: unit
        ref: "test/settings.test.ts#identifies the plugin by its own name and nothing else"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#says nothing about the installation in the command user agent"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-09-04
status: complete
---

# Phase 6 Plan 04: Consistent Outbound Identity Header Summary

**One PLUGIN_USER_AGENT constant, relocated from src/cloud/api.ts into src/settings.ts, now identifies the plugin on all four outbound vendor call sites instead of only the REST command path.**

## Performance

- **Duration:** ~28 min
- **Completed:** 2026-09-04
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- `src/settings.ts` exports `PLUGIN_USER_AGENT`, the plugin name and nothing else, carrying the same identity-shape contract (`equals PLUGIN_NAME`, `contains no '/'`) the old `COMMAND_USER_AGENT` carried.
- `src/cloud/api.ts`'s `requestInit()` sets the identity header on both the no-body (GET) branch and the body-carrying (command) branch, so every REST request identifies itself the same way.
- `src/cloud/auth.ts`'s `fetchGrant()` sends the identity header alongside `Content-Type` on the Auth0 password-realm grant.
- `src/cloud/mqttTransport.ts`'s `createMqttTransport()` passes `wsOptions: { headers: { 'User-Agent': options.userAgent } }` to the underlying `connect()` call, so the AWS IoT MQTT WebSocket handshake carries the same identity.
- The identity string is wired at one composition site (`createAccountRuntimeFromConfig` in `src/runtime/accountRuntime.ts`) and threaded down through `ShadowClientOptions.userAgent` (new) to the point in `src/cloud/shadow.ts` that actually assembles `MqttTransportOptions`.
- No new outbound destination was introduced; the identity string is unchanged from the prior `COMMAND_USER_AGENT` value.

## Task Commits

Each task was committed atomically, following RED/GREEN for the parts of the change that could be tested independently of a cross-file interface change:

1. **Task 1: Relocate the identity constant and apply it to both REST branches**
   - `d7ce108` (test) — failing test for the identity header on REST reads
   - `79ab307` (feat) — relocated `PLUGIN_USER_AGENT`, applied it to both `requestInit()` branches
2. **Task 2: Apply the identity header to the Auth0 login request and the MQTT handshake**
   - `ded8111` (test) — failing test for the Auth0 login identity header
   - `8a6423a` (feat) — Auth0 header GREEN, plus the MQTT handshake wiring (mqttTransport.ts, shadow.ts, accountRuntime.ts) and its own new test

## Files Created/Modified

- `src/settings.ts` — adds `PLUGIN_USER_AGENT`
- `src/cloud/api.ts` — removes `COMMAND_USER_AGENT`, imports `PLUGIN_USER_AGENT`, applies it on both `requestInit()` branches
- `src/cloud/auth.ts` — `fetchGrant()` sends `PLUGIN_USER_AGENT` as `User-Agent`
- `src/cloud/mqttTransport.ts` — `MqttConnectOptions` gains `wsOptions?`, `MqttTransportOptions` gains `userAgent`, `createMqttTransport()` sets the header
- `src/cloud/shadow.ts` — `ShadowClientOptions` gains `userAgent`, `openConnection()` passes it through to `createTransport()`
- `src/runtime/accountRuntime.ts` — imports `PLUGIN_USER_AGENT`, supplies `userAgent: PLUGIN_USER_AGENT` to `createShadowClient()`
- `test/settings.test.ts` — gains the two identity-shape assertions moved from `test/cloud/api.test.ts`
- `test/cloud/api.test.ts` — removes the `COMMAND_USER_AGENT` import and identity-shape test; asserts the complete GET-path header set including the identity header
- `test/cloud/auth.test.ts` — `stubFetch()` now captures request headers; new test asserts the grant's identity header
- `test/cloud/mqttTransport.test.ts` — harness supplies a `userAgent`; new test asserts `wsOptions.headers`
- `test/cloud/shadow.test.ts` — harness's `clientOptions` literal gains `userAgent` (compile fix, not a new behavioral assertion)

## Decisions Made

- **`MqttTransportOptions` is assembled in `src/cloud/shadow.ts`, not `src/runtime/accountRuntime.ts`.** The plan's action text for Task 2 said to find "where `MqttTransportOptions` is assembled for the real connection (in `src/runtime/accountRuntime.ts`, where `createMqttTransport` is wired)". Tracing the actual call chain: `accountRuntime.ts` only holds a reference to the `createMqttTransport` function (passed as `ShadowClientOptions.createTransport`); the object literal satisfying `MqttTransportOptions` is built one layer down, inside `shadow.ts`'s `openConnection()`, when it calls `options.createTransport({...})`. `ShadowClientOptions` therefore gained its own `userAgent: string` field, threaded from `accountRuntime.ts` (the one place `PLUGIN_USER_AGENT` is imported) through `shadow.ts` to the transport. The plan's stated intent — one composition site owns the literal identity constant, and `mqttTransport.ts` stays free of a direct import from `settings.ts` — is preserved; only the specific file housing the final object-literal assembly differs from what the plan described.
- **`test/cloud/shadow.test.ts` needed a one-line fix outside the plan's declared `files_modified`.** Making `userAgent` a required field on `ShadowClientOptions` (matching the required, not optional, shape the plan specified for `MqttTransportOptions.userAgent`) broke the explicit `const clientOptions: ShadowClientOptions = {...}` literal in that file's `harness()` helper, since it is the only place in the repository that constructs `ShadowClientOptions` directly outside the composition seam. Rule 3 (auto-fix blocking issue): added `userAgent: 'harness-user-agent'` to the literal. No behavioral assertion in that file changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Corrected the file where `MqttTransportOptions` is assembled**
- **Found during:** Task 2 (tracing `createMqttTransport`'s real call site before editing)
- **Issue:** The plan's action text asserted `accountRuntime.ts` assembles the full `MqttTransportOptions` object literal. Reading the actual code showed `accountRuntime.ts` only wires the `createTransport` function reference into `ShadowClientOptions`; `shadow.ts`'s `openConnection()` is what builds the literal object passed to it.
- **Fix:** Added `userAgent: string` to `ShadowClientOptions` (not just `MqttTransportOptions`), threaded it through `shadow.ts`'s `openConnection()`, and supplied the literal `PLUGIN_USER_AGENT` value at `accountRuntime.ts`'s `createShadow` composition callback — preserving the plan's "one composition site" intent while fixing which file's object literal actually needed the new field.
- **Files modified:** `src/cloud/shadow.ts`, `src/runtime/accountRuntime.ts`
- **Verification:** `npm run check` passes; `test/cloud/shadow.test.ts`'s existing field-specific assertions on the transport options it receives (`clientId`, `url`, `deadlineMs`, `signUrl`) are unaffected since none of them assert the whole options object.
- **Committed in:** `8a6423a` (Task 2 GREEN commit)

**2. [Rule 3 - Blocking issue] Fixed `test/cloud/shadow.test.ts`'s harness literal**
- **Found during:** Task 2 (after adding the required `userAgent` field to `ShadowClientOptions`)
- **Issue:** `test/cloud/shadow.test.ts` (not in this plan's `files_modified` list) declares `const clientOptions: ShadowClientOptions = {...}` directly, which fails to compile once `userAgent` becomes a required field it does not supply.
- **Fix:** Added `userAgent: 'harness-user-agent'` to the literal, matching the file's existing placeholder-value style for other injected fields.
- **Files modified:** `test/cloud/shadow.test.ts`
- **Verification:** `npm run build:test` compiles; all `test/cloud/shadow.test.ts` cases still pass (255 tests across the affected suites, `npm run check` green).
- **Committed in:** `8a6423a` (Task 2 GREEN commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3, both discovered while tracing the real call chain before editing)
**Impact on plan:** No scope creep — both fixes are the minimum required to keep the codebase compiling and correctly wired once the plan's stated assembly site was found to be one layer removed from the actual code. The behavior delivered (one identity header on all four outbound call sites) matches the plan's objective exactly.

## Issues Encountered

**True RED/GREEN separation was not achievable for the MQTT handshake portion of Task 2.** Making `userAgent` a required field on `MqttTransportOptions` and `ShadowClientOptions` — the shape the plan specified, mirroring how `clientId` and `url` are already required and caller-supplied — necessarily breaks compilation in every file that constructs those types until all of them are updated together (`mqttTransport.ts`, `shadow.ts`, `accountRuntime.ts`, `test/cloud/mqttTransport.test.ts`'s harness, and `test/cloud/shadow.test.ts`'s harness). A RED commit isolating only the new mqttTransport.test.ts assertion would have required either leaving those files uncompilable (blocking every other test in the repository) or making the field optional (a design compromise the plan did not ask for and this codebase's single production caller never needed). Per the established precedent for compile-coupled changes (a RED commit is only clean when its failure is a runtime assertion rather than a reference to code that does not yet exist), this portion was implemented and tested together in the Task 2 GREEN commit rather than split further. The Auth0 login header (no interface changes needed) was still split cleanly into its own RED and GREEN commits.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All four outbound vendor call sites (REST read, REST command, Auth0 login, MQTT handshake) now carry the same honest, minimal identity header; `npm run check` passes (1431 unit tests, 104 Cucumber scenarios, all green).
- REL-03 and REL-04 are ready to mark complete for this plan (verified via `requirements.ready-ids` before marking, per the requirements-gate note this plan was executed under).
- No blockers for the remaining Phase 6 plans.

## Self-Check: PASSED

All modified files exist on disk with the expected content
(`src/settings.ts`, `src/cloud/api.ts`, `src/cloud/auth.ts`, `src/cloud/mqttTransport.ts`,
`src/cloud/shadow.ts`, `src/runtime/accountRuntime.ts`, and the five test files). All four
commits (`d7ce108`, `79ab307`, `ded8111`, `8a6423a`) are present in `git log --oneline --all`.

---
*Phase: 06-validated-release-candidate*
*Completed: 2026-09-04*
