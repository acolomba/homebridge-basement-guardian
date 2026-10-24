---
phase: 04-pump-records-and-official-controls
plan: 01
subsystem: api
tags: [homekit, hap, homebridge, cucumber, node-test, typescript]

requires:
  - phase: 03-safety-monitoring-in-homekit
    provides: the service catalogue, the accessory publish loop, the trust-scope map, and the hand-built HAP stand-in
provides:
  - "`TrustScope` and `ScopedDomainState` carry `self-test` and `alarm-mute` as separate members"
  - "`src/runtime/commandPort.ts`: the one port a HomeKit control reaches the vendor through"
  - "`AccountRuntime.commands`: the command implementation, under the root abort signal, with no retry"
  - "`src/accessories/controls.ts`: the write binder — onSet, the value refusal, the pending set, the clearing push, reconciliation"
  - "`ProjectionInput.pendingControls` and `ServiceRow.alwaysPublish`"
  - "the `System Self-Test` Switch row and its accessory wiring"
  - "the HAP stand-in's write path: Switch, On, statusCode, onSet, handleSetRequest, handleGetRequest, HAPStatus, HapStatusError"
  - "`test/accessories/hapWriteFidelity.test.ts`: the only permitted direct import of the pinned HAP package"
  - "`features/support/publishedServices.ts`: the shared catalogue lookup two step modules read through"
affects: [04-02, 04-03, 04-04, 04-05, 04-06]

actuals:
  tokens: 39000
  tasks: 2
  commits: 8

tech-stack:
  added: ["@homebridge/hap-nodejs@2.2.2 (devDependency, exact pin)"]
  patterns:
    - "A HomeKit write path: a catalogue row projects, a separate binder registers the handler"
    - "A refused write arms a macrotask clearing push through the injected Timers port"
    - "A stand-in with a hand-built write path is held against the real package by a fidelity test"

key-files:
  created:
    - src/runtime/commandPort.ts
    - src/accessories/controls.ts
    - test/runtime/commandPort.test.ts
    - test/accessories/controls.test.ts
    - test/accessories/hapWriteFidelity.test.ts
    - features/support/publishedServices.ts
    - features/support/steps/controls.ts
    - features/officialControls.feature
  modified:
    - src/device/health.ts
    - src/device/family.ts
    - src/device/gemini.ts
    - src/runtime/accountRuntime.ts
    - src/accessories/serviceCatalogue.ts
    - src/accessories/basementGuardian.ts
    - src/platform.ts
    - features/support/fakeHap.ts
    - features/support/world.ts
    - package.json

key-decisions:
  - "The undeclared HAP package became an exact-pinned devDependency rather than staying a hoisted transitive, and the resolution-identity assertion closes the trap that creates."
  - "The clearing push republishes the control rows and then pushes the reported value, so a refusal answered while the control's scope is untrustworthy still clears the sticky status."
  - "`projectionInputOf` takes the pending set as a parameter, because a closure reference would have made the binder and the projection mutually forward-referencing under the declare-before-use lint rule."
  - "`AccountRuntimeOptions` gained a `registry` member: the runtime did not already hold one, and the composition root now passes the same instance the discovery path uses."
  - "The command port answers `vendor-error` for a device the store never held or a family this version cannot drive, because `CommandFailure` has no third member in this plan."

patterns-established:
  - "Control rows: one `RowDefinition` with `alwaysPublish`, whose `values` hands `On` to `published()` as `undefined` while the capability is pending"
  - "Fidelity testing: one write script, two implementations, deep-equal `{ rejectedWith, value, statusCode }` records"
  - "Every refusal case in a fidelity test starts from a value the plugin pushed, never the format default"

requirements-completed: [CTRL-03, CTRL-05]

coverage:
  - id: D1
    description: "A HomeKit press of System Self-Test reaches the vendor as exactly one PUT carrying the measured body, and the device's own report is what leaves the Switch on."
    requirement: CTRL-03
    verification:
      - kind: e2e
        ref: "features/officialControls.feature#A press of the self-test switch reaches the vendor and the device's report leaves it on"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#sends one on request, holds the capability pending, and pushes nothing back"
        status: pass
    human_judgment: false
  - id: D2
    description: "A reported test_running with no HomeKit write behind it turns the Switch on and sends nothing."
    requirement: CTRL-03
    verification:
      - kind: e2e
        ref: "features/officialControls.feature#A self-test started outside HomeKit turns the switch on with no command behind it"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#CTRL-03 follows a reported test_running the device raised with no HomeKit write behind it"
        status: pass
    human_judgment: false
  - id: D3
    description: "A write of On = false sends nothing, throws -70412, and is followed by a macrotask push that returns the stored status to 0."
    requirement: CTRL-03
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#refuses a write of false, sends nothing, and leaves the stored value where HAP had it"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#arms the clearing push as a macrotask at delay 0 rather than running it inline"
        status: pass
      - kind: integration
        ref: "test/accessories/basementGuardian.test.ts#CTRL-03 refuses an off write, sends nothing, and makes the switch readable again on the deferral it recorded"
        status: pass
    human_judgment: false
  - id: D4
    description: "A microtask push runs before HAP assigns the refusal status and leaves it standing, which is why the push is a macrotask."
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#leaves a sticky status when the clearing push is queued as a microtask instead"
        status: pass
      - kind: unit
        ref: "test/accessories/hapWriteFidelity.test.ts#survives a push queued as a microtask inside the handler, on both implementations"
        status: pass
    human_judgment: false
  - id: D5
    description: "While a self-test request is unresolved the row projects nothing for On, so the per-update push cannot snap the toggle back."
    requirement: CTRL-05
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#projects no On at all while the control carries an unresolved request"
        status: pass
    human_judgment: false
  - id: D6
    description: "TrustScope carries self-test and alarm-mute separately: a wrong-typed test_timestamp deactivates no pump service and no Contact Sensor."
    verification:
      - kind: unit
        ref: "test/device/gemini.test.ts#D-02 omits the self-test scope and no other when the control field test_timestamp is invalid"
        status: pass
      - kind: integration
        ref: "test/accessories/basementGuardian.test.ts#D-02 deactivates the self-test scope alone for a wrong-typed test_timestamp, leaving every pump service active"
        status: pass
      - kind: integration
        ref: "test/accessories/basementGuardian.test.ts#D-02 deactivates the alarm mute scope alone for an out-of-domain alarm_audio_muted"
        status: pass
    human_judgment: false
  - id: D7
    description: "The System Self-Test Switch publishes from the first update even when test_running never decoded, carrying StatusActive false."
    verification:
      - kind: integration
        ref: "test/accessories/basementGuardian.test.ts#D-03 publishes the self-test switch on the first update even though test_running never decoded"
        status: pass
    human_judgment: false
  - id: D8
    description: "The fake HAP's write path agrees with the pinned real HAP on every write semantic this phase relies on, and resolves the same file the plugin host resolves."
    verification:
      - kind: unit
        ref: "test/accessories/hapWriteFidelity.test.ts"
        status: pass
    human_judgment: false
  - id: D9
    description: "The command surface sends the family wire body under the root signal, distinguishes a timeout from a vendor error, and never retries."
    requirement: CTRL-05
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#commands"
        status: pass
    human_judgment: false
  - id: D10
    description: "Apple Home renders a Switch carrying StatusActive = false, still accepts a press, and draws something readable between a refused write and the clearing push."
    verification: []
    human_judgment: true
    rationale: "D-03's own stated risk plus Assumption A1. HAP's side is verified here; what a real paired controller draws is not observable in this environment and belongs in the G-003 / G-004 real-home session."

duration: 145 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 01: End-to-end self-test control Summary

**A HomeKit press of `System Self-Test` now reaches the vendor as one measured `PUT`, the row withholds `On` until the device confirms, and the fake HAP the scenarios run on is held against the real pinned package by a fidelity test that catches every defect planted in it.**

## Performance

- **Duration:** 145 min
- **Tasks:** 2 (1 tracer, 1 auto)
- **Files created:** 8
- **Files modified:** 19

## Accomplishments

- `TrustScope` gained `self-test` and `alarm-mute` as separate members, with the whole typecheck cascade — `ScopedDomainState`, two Gemini decoders, three re-scoped `TELEMETRY_CHECKS` rows, and `TRUST_SCOPES` — landed together. A wrong-typed `test_timestamp` now deactivates the Self-Test Switch alone and leaves both Pump services and both pump Contact Sensors fully trusted.
- A narrow `CommandPort` reaches the vendor through `AccountRuntime.commands`, which builds the body with the family the device's own `deviceTypeId` selects, sends under the root abort signal, and never retries. A resolved body carrying `success: false` answers a refusal rather than falling out of the rejection path.
- `src/accessories/controls.ts` is the codebase's first HomeKit write path. It refuses any value that is not exactly `true`, arms a macrotask clearing push before every refusal, holds the capability pending across an accepted write, and clears that entry only when the device reports the value that was asked for.
- The catalogue publishes a `System Self-Test` Switch that follows reported `test_running`, publishes from the first update through a named `alwaysPublish` exemption, and projects nothing for `On` while a request is unresolved.
- The HAP stand-in gained a write path reproducing the real order, and `@homebridge/hap-nodejs` became a declared exact-pinned devDependency so a fidelity test can hold that stand-in honest.

## Task Commits

1. **Task 1 (tracer): end-to-end self-test control**
   - `b3ceee2` `test(04): require the control fields to own their trust scopes` — RED, 9 failing cases
   - `b07b675` `feat(04): scope the control fields to their own trust scopes` — GREEN
   - `7f5279f` `feat(04): declare the vendor command port`
   - `afa02be` `feat(04): send official commands through the account runtime`
   - `1f3c3ab` `feat(04): add the write path to the hap stand-in`
   - `3d70695` `feat(04): publish the system self-test switch and bind its writes`
   - `7c13a51` `test(04): press the self-test switch end to end`
2. **Task 2: declare the pinned HAP package and hold the fake against it**
   - `aee46b9` `test(04): hold the fake hap write path against the real hap`

Every commit was verified non-empty with `git show --name-only --format="" HEAD`. Commits were made with plain `git commit` after `pre-commit run --files <changed files>` came back clean, per the tooling hazard recorded in STATE.md; the GSD commit handler was not used.

## Files Created/Modified

Created:

- `src/runtime/commandPort.ts` — `CommandPort`, `CommandOutcome`, `CommandFailure`
- `src/accessories/controls.ts` — the binder: `onSet` registration, the value refusal, the pending set, the clearing push, reconciliation
- `test/runtime/commandPort.test.ts` — the port's type contract
- `test/accessories/controls.test.ts` — 15 cases including the microtask-ordering companion
- `test/accessories/hapWriteFidelity.test.ts` — the only permitted direct import of `@homebridge/hap-nodejs`
- `features/support/publishedServices.ts` — the shared catalogue lookup and `pushed` gate
- `features/support/steps/controls.ts` — the write step and the request assertions
- `features/officialControls.feature` — the two self-test scenarios

Modified:

- `src/device/health.ts` — `TrustScope` gains two members
- `src/device/family.ts` — `SelfTestState`, `AlarmMuteState`, two `ScopedDomainState` members, and `PumpState.backupActivatedAt`'s unit stated as Unix seconds
- `src/device/gemini.ts` — two decoders and the three re-scoped checks
- `src/runtime/accountRuntime.ts` — `AccountRuntime.commands`, `AccountRuntimeOptions.registry`, `AccountRuntimeDeps.registry`
- `src/accessories/serviceCatalogue.ts` — `pendingControls`, `alwaysPublish`, the `ensureService` exemption and its revised docblock, the `system-self-test` row
- `src/accessories/basementGuardian.ts` — the binder, the `CONTROLS` map, `reportedControlValue`, `republishControlRows`, `reconcileControls`, the reworded `timers` docblock, `TRUST_SCOPES`
- `src/platform.ts` — `DiscoveryContext.commands`, wired from `runtime.commands`
- `features/support/fakeHap.ts` — `Switch`, `On`, `statusCode`, `onSet`, `handleSetRequest`, `handleGetRequest`, `HAPStatus`, `HapStatusError`, and a rewritten file overview
- `features/support/world.ts` — the registry and the command port wired into `discoveryContext`
- `package.json` / `package-lock.json` — `@homebridge/hap-nodejs` at `2.2.2`, exact
- `test/accessories/basementGuardian.test.ts`, `test/accessories/serviceCatalogue.test.ts`, `test/accessories/timerFreedom.test.ts`, `test/platform.test.ts`, `test/runtime/accountRuntime.test.ts`, `test/device/gemini.test.ts`, `test/device/family.test.ts`, `features/support/steps/homekit.ts`

## Decisions Made

**The undeclared HAP dependency — which handling was chosen, and why.** The package is now an explicit `devDependencies` entry at the bare version `2.2.2`, the exact string `homebridge@2.4.0` pins, with `package-lock.json` refreshed by `npm install --package-lock-only`. `npm ls @homebridge/hap-nodejs` reports one deduped resolution.

The alternative was to keep relying on npm hoisting. That resolves today only incidentally: it would break on a `homebridge` minor bump, on a hoisting change, or on a nested install strategy, and nothing pins the version the fidelity test asserts against. Declaring it makes the resolution intentional. The trap declaring it introduces — a declared copy that resolves to a different file than the one `homebridge` loads — is closed by the resolution-identity assertion, which builds a second `createRequire` from `homebridge`'s own entry point and asserts both resolvers answer the same absolute path. Both resolvers answered `node_modules/@homebridge/hap-nodejs/dist/index.js` on 2026-09-01.

**The clearing push does two things, not one.** `republish()` re-asserts what the control rows can currently vouch for, and a direct push of `reported() ?? heldOn()` follows it. The second push is not redundant: a row publishes `On` only while it can vouch for the reported value, so a refusal answered while the control's own scope is untrustworthy would leave the status standing and the Switch unreadable. Pushing the value the characteristic already carries states nothing new — HAP returns a stored status to `0` whatever value it is given.

**`projectionInputOf` takes the pending set as a parameter.** The natural shape — the projection reading `controls.pending` from the closure while the binder's `republish` calls back into a function that builds a projection — is a source-order cycle, and `@typescript-eslint/no-use-before-define` is `error` here with `functions` and `variables` both on. Passing the set breaks the cycle without a mutable slot or a lazily-assigned binder.

**`AccountRuntimeOptions` gained a `registry`.** The plan said the runtime "already holds" a family registry; it does not. Adding one to the runtime's own options and passing the platform's single instance through `AccountRuntimeDeps` keeps exactly one registry per plugin run, so a command and the accessory it came from can never resolve two different families for one device.

**Faults are not eligibility, and offline is not checked yet.** This plan ships the value refusal only. The undecoded-state, confirmed-offline and duplicate refusals are 04-02's, as that plan's own `<behavior>` states.

## Defect reintroduction — what was watched to fail

Phase constraint: a green suite is not evidence. Each claim below was proven by putting the defect back and watching the named case fail, then restoring and re-running.

| Claim | Defect reintroduced | Cases that failed |
|---|---|---|
| The clearing push is a **macrotask** (D-04) | `timers.setTimeout(fn, 0)` → `queueMicrotask(fn)` in `armClearingPush` | 7 of 15 in `controls.test.ts`, incl. `arms the clearing push as a macrotask at delay 0`; plus `CTRL-03 refuses an off write, sends nothing, and makes the switch readable again on the deferral it recorded` |
| A **pending row withholds** rather than publishes (D-05) | `controlValues` drops the `pendingControls.has(capability)` check | `projects no On at all while the control carries an unresolved request` |
| The control fields own their **own trust scopes** (D-02) | the three `TELEMETRY_CHECKS` rows kept `scope: undefined` (the RED commit `b3ceee2`) | 9 cases across `validate` and `decode` in `gemini.test.ts` |
| `TRUST_SCOPES` lists **every** union member | `alarm-mute` removed from `TRUST_SCOPES` | 6 cases, incl. `lists one trust scope per member of the union it reports from` |
| The `alwaysPublish` **exemption** is honoured | `ensureService` ignores `row.alwaysPublish` | `adds the control service even when the row projects nothing…` plus 2 accessory cases |
| Reconciliation **clears a confirmed request** | `reconcile` only clears on a reported `false` | the end-to-end self-test scenario |
| The command port tells a **timeout from a vendor error** | `commandFailureOf` always answers `vendor-error`; `success:false` treated as accepted | `reports a timeout when the deadline aborted the attempt`, `reports a vendor error for a resolved body the vendor refused` |
| The fake **leaves the value** on a refused write | fake resets `this.value` to the format default on rejection | 6 of 11 fidelity cases |
| The fake **answers the stored status** to a later read | fake's `handleGetRequest` never throws | `answers the stored status to a read issued after a refusal…` |
| A push **clears** the stored status | fake's `updateCharacteristic` no longer resets `statusCode` | `returns the stored status to zero on a push of the value already held…` |
| Stickiness is **per characteristic** | fake's push clears every characteristic's status | `leaves the stored status on On when StatusActive is pushed…` |
| A plain `Error` becomes a **communication failure** | fake converts it to `NOT_ALLOWED_IN_CURRENT_STATE` | `converts a plain Error to a communication failure…` |

One of these found a real hole rather than confirming one. The first run of the fake-resets-the-value defect **passed**: every refusal case started from `On = false`, which is also the `bool` format default, so an implementation that resets the value was indistinguishable from one that leaves it. Every refusal case in the fidelity test now pushes `On = true` first and refuses a write of `false`, and the same defect then fails six cases.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `AccountRuntime` holds no family registry**

- **Found during:** Task 1, the command port implementation
- **Issue:** The plan says `send` "looks the family up through the registry the runtime already holds". `AccountRuntimeOptions` has no registry member and the runtime never had one.
- **Fix:** Added `registry: FamilyRegistry` to `AccountRuntimeOptions` and to `AccountRuntimeDeps`; `BasementGuardianPlatform` passes `this.registry` and the Cucumber harness passes the registry it already builds, so exactly one instance exists per run.
- **Files modified:** `src/runtime/accountRuntime.ts`, `src/platform.ts`, `features/support/world.ts`, `test/runtime/accountRuntime.test.ts`
- **Verification:** `commands` cases in `accountRuntime.test.ts`; full suite green.
- **Committed in:** `afa02be`

**2. [Rule 2 - Missing Critical] The clearing push could not clear a status while the control's scope was untrustworthy**

- **Found during:** Task 1, the binder
- **Issue:** The plan's clearing push is `republish()` alone. A row publishes `On` only while it can vouch for the reported value, so a refusal answered while `test_running` had never decoded would leave HAP answering the thrown status to every read — the exact failure D-04 exists to prevent.
- **Fix:** The push follows `republish()` with `publishValue(service, On, reported() ?? heldOn(...))`. This is also what gives `bind`'s `reported` accessor a consumer in this plan; 04-02 uses it for the duplicate and undecoded refusals.
- **Files modified:** `src/accessories/controls.ts`
- **Verification:** `clears the refusal status from the held value of true/false when no reported value can be vouched for`
- **Committed in:** `3d70695`

**3. [Rule 3 - Blocking] `no-use-before-define` forbids the natural binder/projection wiring**

- **Found during:** Task 1, the accessory wiring
- **Issue:** The projection reads the binder's pending set and the binder's `republish` builds a projection, which is a source-order cycle under a rule this repository sets to `error` with `functions` and `variables` both checked.
- **Fix:** `projectionInputOf` takes `pendingControls` as a parameter, and the factory's helpers are ordered topologically.
- **Files modified:** `src/accessories/basementGuardian.ts`
- **Verification:** `npm run lint` clean
- **Committed in:** `3d70695`

**4. [Rule 2 - Missing Critical] The end-to-end scenario was under-determined**

- **Found during:** Task 1, the Cucumber run
- **Issue:** `Then the "System Self-Test" service reports "On" as "true"` was satisfied instantly by the value the accepted write had left, without waiting for the device's confirming report. The scenario then changed `test_running` back to `false` before the confirming poll landed, the pending entry was never cleared, and the last step failed. The green form of that scenario would have proved nothing about reconciliation.
- **Fix:** Added `Then the canonical snapshot carries these fields: | test_running | true |` between the change and the read, which forces the confirming poll to have been applied.
- **Files modified:** `features/officialControls.feature`
- **Verification:** Reintroducing a reconcile that never clears a confirmed request now fails the scenario.
- **Committed in:** `7c13a51`

**5. [Rule 1 - Bug] The fidelity test could not see a stand-in that resets the value on a refusal**

- **Found during:** Task 2, mutation checking
- **Issue:** Every refusal case started from the `bool` format default, so resetting the value looked identical to leaving it.
- **Fix:** Each refusal case pushes `On = true` first and refuses a write of `false`.
- **Files modified:** `test/accessories/hapWriteFidelity.test.ts`
- **Verification:** The planted defect now fails 6 of 11 cases.
- **Committed in:** `aee46b9`

**6. [Rule 3 - Blocking] A 28-line clone between two step modules**

- **Found during:** Task 2, `npm run fallow`
- **Issue:** `features/support/steps/controls.ts` copied the catalogue lookup and the `pushed` gate out of `steps/homekit.ts`, which `fallow dupes` reported as a clone group.
- **Fix:** Extracted `currentAccessory`, `serviceOf` and `pushedValue` into `features/support/publishedServices.ts`; both step modules import them.
- **Files modified:** `features/support/publishedServices.ts`, `features/support/steps/homekit.ts`, `features/support/steps/controls.ts`
- **Verification:** `fallow dupes` back to the one pre-existing clone group in `steps/hap.ts`; Cucumber green at 64/64.
- **Committed in:** `aee46b9`

**7. [Rule 2 - Missing Critical] `src/runtime/commandPort.ts` needed its own test module**

- **Found during:** Task 1
- **Issue:** `.claude/rules/typescript-unit-testing.md` requires one `.test.ts` per production module with no exclusions for type-only modules. The plan's file list omitted it.
- **Fix:** Added `test/runtime/commandPort.test.ts` as a `satisfies` / `@ts-expect-error` contract module.
- **Files modified:** `test/runtime/commandPort.test.ts`
- **Verification:** `npm run build:test` typechecks the negatives; `npm run fallow` reports no unused export.
- **Committed in:** `7f5279f`

---

**Total deviations:** 7 auto-fixed (2 blocking wiring, 3 missing critical, 1 bug, 1 blocking gate). **Impact:** All seven were required for the plan's own claims to hold or for a repository gate to pass. No scope creep — the local refusals, the expiry window, the Alarm Mute row and the pump records all remain where the later plans put them.

## Issues Encountered

**The TDD pairing could not be a clean test → feat pair for every layer.** Task 1's first layer got a real RED commit (`b3ceee2`, 9 failing cases) followed by a GREEN one (`b07b675`). The remaining layers could not: a red test referencing `createControlBinder`, `runtime.commands`, `ProjectionInput.pendingControls` or the fake's `Switch` does not compile, and `npm typecheck` is a pre-commit hook, so the declaration has to land with or before the test. Rather than ship inert scaffolding to manufacture a red run, each of those layers shipped as one `feat` commit carrying its tests, and the RED was demonstrated by mutation — the table above records every defect and the case that caught it. This is the discipline `.continue-here.md` asks for; it is not the commit shape the plan's action text describes, and it is recorded here rather than glossed.

**An acceptance criterion was met behaviourally rather than literally.** The criterion reads "A test declares an inline array of the eight `TrustScope` members and asserts it deep-equals a sorted copy of `TRUST_SCOPES`." `TRUST_SCOPES` is not exported. The case instead drives an unresolved-family update, reads the scopes the accessory reports untrusted, adds `connectivity` (the one scope that failure never degrades), sorts, and compares against an inline array of the eight members. It fails when the union and the list drift in either direction — removing `alarm-mute` from `TRUST_SCOPES` fails it — and it needs no export added for a test.

**The microtask ordering depends on the handler being asynchronous, which the research did not state.** A *synchronous* handler that queues a microtask and throws has its catch run synchronously, so the status is assigned before the microtask and the push clears it. The binder's handler is `async`, so its refusal reaches HAP as a rejected promise and HAP's catch resumes a microtask *later* than a push queued inside the handler — which is what makes the sticky status survive. Both the unit companion and the fidelity case are written in that form deliberately, and the fidelity case confirms real HAP behaves the same way.

## Known Stubs

None. Every branch this plan added is covered, both focused pairs and `npm run test:coverage:all` report 100% lines, branches and functions, and no test is skipped.

## Verification

| Gate | Result |
|---|---|
| `npm run test:coverage:direct` — `controls.js` pair | 100 / 100 / 100 |
| `npm run test:coverage:direct` — `gemini.js` pair | 100 / 100 / 100 |
| `npm run test:coverage:direct` — `serviceCatalogue.js` pair | 100 / 100 / 100 |
| `npm run test:coverage:all` | 100 / 100 / 100 over every `src/` module |
| `npm run test:cucumber -- --name "self-test"` | 2 scenarios, 24 steps, all passed |
| `npm run test:cucumber` | 64 scenarios, 572 steps, all passed |
| `node --test dist-test/test/accessories/hapWriteFidelity.test.js` | 11 passed, 0 failed |
| `npm run typecheck` | clean |
| `npm run check` | passed (typecheck, lint, fallow, format:check, 1060 unit tests, 64 scenarios) |

Baseline before this plan was 62 scenarios / 548 steps; it is now 64 / 572, with no scenario removed.

## User Setup Required

None.

## Next Phase Readiness

Ready for 04-02. The seams the later plans extend are in place and shaped as their plans expect: `ControlBinderOptions` (04-02 adds `offlineConfirmed`), `bind`'s `reported` accessor with its `boolean | undefined` return, `ProjectionInput.pendingControls`, `ServiceRow.alwaysPublish`, and the fake HAP write path the five `CTRL-05` outcome scenarios will drive.

Two items ride forward:

- **Real-home verification (D-03, Assumption A1).** Whether Apple Home renders a `Switch` carrying `StatusActive = false`, still accepts a press, and draws something readable in the window between the write error and the clearing push is unverifiable here. HAP's side is now verified on both counts. This belongs in the `G-003` / `G-004` session, as `04-CONTEXT.md` already states.
- **`.fallowrc.json` note.** `npm run fallow` prints `ignoreFindings pattern matched no finding this run: src/device/events.ts` on every run. It is pre-existing, does not fail the gate, and is out of scope here.

## Self-Check: PASSED

- Every file listed under `key-files.created` exists on disk.
- Every commit hash in the Task Commits section resolves: `b3ceee2 b07b675 7f5279f afa02be 1f3c3ab 3d70695 7c13a51 aee46b9`.
- Every commit was confirmed non-empty at the time it was made.

---
*Phase: 04-pump-records-and-official-controls*
*Completed: 2026-09-01*
