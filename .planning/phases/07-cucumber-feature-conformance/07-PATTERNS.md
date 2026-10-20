# Phase 7: Cucumber Feature Conformance — Pattern Map

**Mapped:** 2026-10-19
**Files classified:** 37 existing files (15 Gherkin, 22 TypeScript)
**Analogs found:** 37/37; these are review targets, not proposed new files.

## File Classification

| Review targets | Role | Data flow | Closest tracked analog | Match |
|---|---|---|---|---|
| `features/account/{configuration,sign-in}.feature` | specification | request-response | `features/account/sign-in.feature` | exact |
| `features/accessory/discovery.feature` | specification | CRUD/event-driven | `features/accessory/discovery.feature` | exact |
| `features/homekit/{official-controls,safety-state}.feature` | specification | event-driven | `features/homekit/safety-state.feature` | exact |
| `features/monitoring/degradation.feature` | specification | event-driven | `features/homekit/safety-state.feature` | flow-match |
| `features/plugin/lifecycle.feature` | specification | event-driven | `features/plugin/lifecycle.feature` | exact |
| `features/pump/records.feature` | specification | file-I/O/event-driven | `features/pump/records.feature` | exact |
| `features/shadow/{connection-lifecycle,credential-rotation,state-merging}.feature` | specification | streaming/event-driven | `features/shadow/state-merging.feature` | exact |
| `features/harness/fakes.feature` | specification | request-response/event-driven | `features/harness/fakes.feature` | exact |
| `features/real-pump/{discovery,heartbeats,lifecycle}.feature` | specification | observation/event-driven | `features/real-pump/discovery.feature` | exact |
| `features/step_definitions/{account,configuration}.steps.ts` | step adapter | request-response | `features/step_definitions/account.steps.ts` | exact |
| `features/step_definitions/{accessory,homekit,hap}.steps.ts` | step adapter | CRUD/event-driven | `features/step_definitions/homekit.steps.ts` | role-match |
| `features/step_definitions/{controls,runtime}.steps.ts` | step adapter | request-response/event-driven | `features/step_definitions/runtime.steps.ts` | role-match |
| `features/step_definitions/shadow.steps.ts` | step adapter | streaming/event-driven | `features/step_definitions/shadow.steps.ts` | exact |
| `features/step_definitions/harness.steps.ts` | step adapter | request-response/event-driven | `features/step_definitions/harness.steps.ts` | exact |
| `features/support/world.ts` | world/provider | scenario lifecycle | `features/support/world.ts` | exact |
| `features/lib/{auth0,vendorRestApi,shadowBroker}.ts` | offline service fake | request-response/pub-sub | `features/lib/vendorRestApi.ts` | role-match |
| `features/lib/{loopbackServer,timers}.ts` | utility/driver | network I/O/time | `features/lib/loopbackServer.ts` | role-match |
| `features/lib/{hap,homebridgeApi,publishedServices}.ts` | HAP fake/adapter/utility | event-driven/transform | `features/lib/homebridgeApi.ts` | role-match |
| `features/real-pump/support/{steps,heartbeatSteps,lifecycleSteps}.ts` | real-profile step adapter | observation/event-driven | `features/real-pump/support/steps.ts` | role-match |
| `features/real-pump/support/realWorld.ts` | real-profile world/provider | scenario lifecycle | `features/support/world.ts` | role-match |

All named analogs were confirmed tracked with `git ls-files`. The two world files and the shared HAP fake deserve distinct review ownership because many steps or tests consume them.

## Pattern Assignments

### Default Gherkin families

**Analog:** `features/account/sign-in.feature:1-17` for feature title, two-line description, optional common `Background`, and one observable outcome per scenario:

```gherkin
Feature: Account sign-in

  The plugin signs in once, reuses the cached token across a restart, and answers each way the
  vendor can refuse with the one response that is safe for it. No credential reaches the log.

  Scenario: A first start performs the grant and caches the token
    Given the shadow credentials
    When the plugin starts
    Then the tenant holds 1 token request
```

Use the same external behavior shape when reviewing the account, accessory, HomeKit, monitoring, plugin, pump, shadow, and harness feature families. `features/harness/fakes.feature:68-90` is the closest contract for the HAP fake and API assertions. Preserve baseline scenario count unless the ledger explains a change.

### Real-pump Gherkin family

**Analog:** `features/real-pump/discovery.feature:1-19`:

```gherkin
@real @read-only
Feature: Discovering the real Gemini and its initial state

  Scenario: The configured Gemini is discovered within a bounded timeout
    When the harness starts
    Then the harness discovers one device within 30 seconds
```

The three files use observation-only assertions, explicit bounded waits, and the same two tags. Review and dry-run them; do not execute steps in this phase.

### Default step adapters

**Analog:** `features/step_definitions/account.steps.ts:11-28,79-93`. The module imports `node:assert/strict`, Cucumber registration functions, a function-specific fake, and `BasementGuardianWorld` from `../support/world.js`. A typed `this` reaches scenario state; setup arms the fake and lets errors surface:

```ts
async function refusedCredentials(this: BasementGuardianWorld): Promise<void> {
  const tenant = await this.auth0();
  tenant.failWith(REFUSED_STATUS, 'invalid_grant');
}
Given('the tenant refuses the account credentials', refusedCredentials);
```

Use `features/step_definitions/homekit.steps.ts:98-160` for HAP service assertions, `runtime.steps.ts:63-147` for start/stop and health, and `harness.steps.ts:125-173` for fake setup. Keep one step text bound once, compare whole outcomes, and avoid catches that hide failures.

### Default world and offline stand-ins

**Analogs:** `features/support/world.ts:18-53,228-235,285-329,545-565,781-785`; `features/lib/vendorRestApi.ts:14-18,25-75,342`; `features/lib/homebridgeApi.ts:21-23,132,164-226`; `features/lib/hap.ts:698-729`.

The world creates fakes on demand, owns each release via `own`, and registers the sole default World constructor and final `After` cleanup. The REST fake records requests and supports armed failures; the loopback server must bind only the local interface. The Homebridge API fake owns `createFakeHap()` and exposes its namespace through `api.hap`. Treat `features/lib/hap.ts` as the shared HAP definition: inspect Cucumber and unit-test consumers before changing its public shape. Libraries register no Cucumber steps or hooks.

### Real-profile support

**Analogs:** `features/real-pump/support/realWorld.ts:13-34,54-61,109,358-366`; `features/real-pump/support/steps.ts:10-15,26-50`; `heartbeatSteps.ts:20-36`; `lifecycleSteps.ts:16-36`.

`realWorld.ts` owns its separate World and hooks. The step modules use typed `RealPumpWorld` callbacks and bounded polling for observations. The current real step files live under `support/` and one is named `steps.ts`; the current Cucumber layout rule prefers `.steps.ts` under `step_definitions/`. Treat that as a review and migration question while preserving the real profile's isolated import boundary. Moving `until` requires tracing all callers first; shared helpers belong in `lib/`, not a registration module.

## Shared Patterns

- **Registration boundary:** `cucumber.json:2-14` imports compiled `support/**/*.js` and `step_definitions/**/*.steps.js` for default, with `not @real` and random order. The real profile imports only `dist-test/features/real-pump/**/*.js` with `@real and @read-only`. Compile with `npm run build:test` before either profile.
- **Headers and imports:** `features/step_definitions/account.steps.ts:1-28` shows SPDX, separate copyright and `@fileoverview` blocks, ESM `.js` relative imports, and type-only world imports. Apply the approved Phase 1 header to reviewed TypeScript files.
- **Scenario cleanup:** `features/support/world.ts:285-329,545-565,781-785` registers releases on the world and drains them in reverse order in one `After` hook. Keep state per scenario.
- **Safety:** Default scenarios use local stand-ins. Real scenarios receive only a compile and `--profile real --dry-run` binding check. Verify seven skipped scenarios and 41 skipped steps, with zero undefined or ambiguous steps; exit status alone is insufficient. No live vendor account, pump, or network execution.
- **Review evidence:** Classify full-file findings by exact Cucumber or TypeScript rule, stable ID, revision-qualified location, severity, and disposition. Re-review each batch independently; use the four-round stop. For a real behavior bug, capture a failing active regression against unchanged production before GREEN.

## No Analog Found

None. This phase reviews existing files and does not create a new implementation family. No current tracked file is a good pattern for an additional source scanner; none is proposed.

## Metadata

**Search scope:** `features/**`, `cucumber.json`, Phase 7 context/research, and current Cucumber/TypeScript project skills.
**Files scanned:** 37 target paths; representative analog excerpts shown above.
**Source provenance:** all analog paths are Git tracked.
