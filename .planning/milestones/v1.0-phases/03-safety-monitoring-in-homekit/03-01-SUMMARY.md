---
phase: 03-safety-monitoring-in-homekit
plan: 01
subsystem: testing
tags: [homekit, hap, cucumber, test-harness, homebridge]

requires:
  - phase: 02-safe-gemini-discovery-and-identity
    provides: the accessory factory and the Cucumber harness the HAP stand-in sits under
provides:
  - a single hand-built HAP namespace stand-in whose Service and Characteristic are constructible base classes
  - the standard service and characteristic definitions this phase publishes, with the real identifiers, props, and value constants
  - the real HAP format defaults, so a service published before the first valid decode cannot read as healthy by accident
  - the real three-argument addService, both duplicate refusals, getServiceById, and removeService on the accessory stand-in
  - a zero-advance scenario clock step for the SAFE-07 immediacy scenarios
affects: [safety monitoring services, custom characteristics, service catalogue, immediacy proof]

actuals:
  tokens: 9500
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "One stand-in per external boundary, imported rather than re-declared"
    - "Table-driven type definitions behind a factory, so N near-identical class bodies never exist"
    - "Stand-in call shapes copied from the real library, including its refusal wording"

key-files:
  created:
    - features/support/fakeHap.ts
    - features/support/steps/hap.ts
  modified:
    - features/support/fakeHomebridgeApi.ts
    - features/support/steps/harness.ts
    - features/support/steps/shadow.ts
    - features/harness.feature

key-decisions:
  - "The stand-in exposes Service and Characteristic as constructible base classes rather than identifier constants, because production declares its own HomeKit types by subclassing the injected namespace."
  - "FakeHomebridgeApi gained a `hap` member typed as the stand-in namespace. `api.hap` is typed as the real HAP-NodeJS namespace through the deliberate `as unknown as API` widening, so a step reaching a service class through `api.hap` would hand a real HAP class to a stand-in accessory."
  - "The `FakeService` alias was dropped rather than retyped: `fallow dead-code` fails a re-export with no consumer, and a second name for one boundary is the first step toward a second stand-in of it."
  - "RED and GREEN land in one commit per task. A commit whose module does not yet exist fails the mandatory `npm lint` pre-commit hook, and the project forbids `--no-verify`."

patterns-established:
  - "Stand-in fidelity is asserted, not assumed: features/harness.feature pins the identifiers, props, defaults, argument orders, and refusal wording of the HAP stand-in directly."
  - "A characteristic lookup answers the characteristic, not its value, matching the real HAP; a caller reads `.value`."

requirements-completed: [SAFE-07, SAFE-02]

coverage:
  - id: D1
    description: "One hand-built HAP namespace stand-in whose Service and Characteristic are constructible base classes carrying the standard definitions"
    requirement: SAFE-02
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake hap namespace carries the definitions the accessories publish"
        status: pass
    human_judgment: false
  - id: D2
    description: "The stand-in reproduces the real HAP format defaults and the non-idempotent addOptionalCharacteristic"
    requirement: SAFE-02
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake hap namespace reproduces the format defaults of the real hap"
        status: pass
    human_judgment: false
  - id: D3
    description: "The accessory stand-in answers the real three-argument addService, both duplicate refusals, getServiceById, and removeService"
    requirement: SAFE-02
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake accessory carries several services of one type"
        status: pass
      - kind: integration
        ref: "features/harness.feature#The fake accessory refuses a duplicate service"
        status: pass
      - kind: integration
        ref: "features/harness.feature#The fake accessory removes one service"
        status: pass
    human_judgment: false
  - id: D4
    description: "A scenario step that advances the scenario clock by exactly zero milliseconds"
    requirement: SAFE-07
    verification: []
    human_judgment: true
    rationale: "No scenario binds the step yet. Its first consumers are the immediacy scenarios later plans in this phase write, so nothing automated exercises it today; the suite only proves it did not break the existing steps."
  - id: D5
    description: "Every scenario in every existing feature file still passes after the harness change"
    verification:
      - kind: e2e
        ref: "npm run check (three consecutive runs, exit 0; 50/50 cucumber scenarios, 588/588 unit tests)"
        status: pass
    human_judgment: false

duration: 39min
completed: 2026-08-30
status: complete
---

# Phase 03 Plan 01: HAP Stand-In and the Zero-Advance Clock Step Summary

**A single hand-built HAP namespace stand-in with constructible `Service` and `Characteristic` bases, the real three-argument `addService`, both real duplicate refusals, and the real format defaults — replacing a two-argument stand-in that would have recorded a display name as a subtype.**

## Performance

- **Duration:** 39 min
- **Started:** 2026-08-30T13:05:00Z
- **Completed:** 2026-08-30T13:44:00Z
- **Tasks:** 3
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- `features/support/fakeHap.ts` carries `Service` and `Characteristic` as constructible base classes, so a production module can declare `class X extends hap.Service` and reach `super(displayName, X.UUID, subtype)`. A harness scenario declares exactly such a scratch type and constructs it.
- The standard definitions carry Apple's real identifiers, the real props, and the real value constants, and reproduce the real `getDefaultValue()` — `false` for a bool, `''` for a string, the declared minimum for a numeric format. A fresh `LeakSensor` reads `LeakDetected` as `0` and a fresh `Battery` reads `StatusLowBattery` as `0`, which are the false-normal defaults a later plan has to avoid publishing.
- `features/support/fakeHomebridgeApi.ts` now takes `addService(serviceClass, displayName, subtype)`, refuses a duplicate UUID-plus-subtype and a second same-UUID service with no subtype using the real HAP wording, and answers `getServiceById` and `removeService`.
- Eight new harness scenarios pin all of the above, including that a display name lands as a display name and not as a subtype.
- `features/support/steps/shadow.ts` binds `When the scenario clock does not move` to `advanceClock(0)`.

## Task Commits

1. **Task 1: class-shaped Service and Characteristic bases** — `4c8291e` (feat)
2. **Task 2: the real accessory service surface over the shared HAP stand-in** — `c20eff2` (feat)
3. **Task 3: the zero-advance scenario clock step** — `702c0a4` (feat)

## Files Created/Modified

- `features/support/fakeHap.ts` (new) — the one hand-built HAP namespace stand-in: `createFakeHap`, the `Service` and `Characteristic` bases, fourteen standard characteristics, four standard services, `Formats`/`Perms`/`Units`, and `uuid.generate`.
- `features/support/steps/hap.ts` (new) — ten `Then` steps holding the stand-in and the accessory surface to their contract.
- `features/support/fakeHomebridgeApi.ts` — consumes the shared namespace, declares no HAP identifier of its own, and answers the real accessory call shapes.
- `features/support/steps/harness.ts` — two call sites moved to the new `homebridge.hap` seam and now read `.value` off the returned characteristic.
- `features/support/steps/shadow.ts` — the zero-advance clock step.
- `features/harness.feature` — five new scenarios.

## Verification

Recorded rather than asserted, because a single green run is not a green gate here:

- `npm run check` — exit 0 on three consecutive runs (`typecheck` → `lint` → `fallow` → `format:check` → `test`).
- `npm run test:cucumber` — 50 scenarios, 50 passed; 406 steps, 406 passed, on each of those runs.
- Unit suite — 588 passed, 0 failed, 0 skipped, 0 todo.
- `fallow dupes` — `✓ No code duplication found`. `--explain-skipped` confirms the only skipped files are `**/*.test.*`, so `features/support/fakeHap.ts` is genuinely analysed rather than exempt.
- `git diff --name-only b71e8b9..HEAD` — no file under `src/` was modified.

### Negative control on the defect this plan closes

A passing test is not evidence, so the assertions that close the two-argument `addService` defect were shown to fail against it. `addService` was temporarily patched to `new serviceClass(undefined, displayName)` — the old behaviour, where the display name lands in the subtype position — and the suite reported **50 scenarios (47 passed, 3 failed)**: the sibling-subtype, duplicate-refusal, and remove-service scenarios all failed. The patch was reverted and the suite returned to 50/50. The scratch-subclass and format-default assertions were likewise proven by a RED run before `fakeHap.ts` existed, which failed the build naming the missing module.

## Decisions Made

- **`Service` and `Characteristic` as constructible bases, not identifier constants.** Every module this phase adds declares HomeKit types by subclassing the injected namespace, so the stand-in has to be subclassable or none of those modules can be exercised.
- **`FakeHomebridgeApi` gained a `hap` member.** `api` is deliberately widened to Homebridge's own `API`, which types `hap` as the *real* HAP-NodeJS namespace. A step reaching a service class through `api.hap` therefore hands a real HAP class to a stand-in accessory, which the compiler correctly rejected. The new member is the one honest seam for a step that needs a stand-in class; the widening and its comment are untouched, and `Then the api exposes the hap namespace` still reads through `api.hap`.
- **`getCharacteristic` answers the characteristic, not its value.** That is the real HAP contract, and the plan requires matching by `instanceof` or static UUID. Two `harness.ts` assertions now read `.value`.
- **The `FakeService` alias was dropped.** The plan asked for it to be retyped; kept as a re-export it has no consumer and `fallow dead-code --fail-on-issues` failed the build on it. Consumers name `FakeHapService` from `fakeHap.ts` directly, which is also the point of having one stand-in.
- **`defineCharacteristic` / `defineService` factories.** Fourteen characteristics and four services from two small factories plus shared props constants, because `fallow dupes` runs at a zero baseline with `--fail-on-issues`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `FakeHomebridgeApi` needed a stand-in-typed `hap` member**

- **Found during:** Task 2
- **Issue:** `features/support/steps/harness.ts` reached the accessory-information service class through `homebridge.api.hap.Service.AccessoryInformation`. Once `FakeAccessory.getService` took a `FakeServiceClass`, that stopped compiling — `api.hap` is typed as the real HAP-NodeJS namespace, and `typeof AccessoryInformation` is not assignable to the stand-in's service class type.
- **Fix:** Added `readonly hap: FakeHap` to `FakeHomebridgeApi`, returned from `createFakeHomebridgeApi`, documented as the one seam that keeps a step honest about which namespace it is reading.
- **Files modified:** `features/support/fakeHomebridgeApi.ts`, `features/support/steps/harness.ts`
- **Verification:** `npm run build:test` compiles; `npm run check` exit 0 three times.
- **Committed in:** `c20eff2`

**2. [Rule 3 - Blocking] `FakeService` dropped rather than retyped**

- **Found during:** Task 2
- **Issue:** The plan says to retype `FakeService` as the stand-in's service instance type. Expressed as `export type { FakeHapService as FakeService }` it has no consumer, and `fallow dead-code --fail-on-issues` reported `Unused type exports (1) … :28 FakeService (re-export)`, failing `npm run check`.
- **Fix:** Removed the alias and left a comment naming `FakeHapService` as the type of a published service. No consumer imported `FakeService` before this change.
- **Files modified:** `features/support/fakeHomebridgeApi.ts`
- **Verification:** `npm run check` exit 0 three times.
- **Committed in:** `c20eff2`

**3. [Rule 3 - Blocking] Steps for the new scenarios live in a new module**

- **Found during:** Task 1
- **Issue:** The acceptance criteria require `features/harness.feature` scenarios, so the plan needs step definitions, but Task 2 forbids touching `features/support/steps/harness.ts` beyond compile fixes. Neither `features/harness.feature` nor a steps module appears in the plan's `files_modified`.
- **Fix:** Added `features/support/steps/hap.ts`, organised by function as `features/CLAUDE.md` requires — it owns the HAP stand-in and the accessory service surface built on it, and nothing else.
- **Files modified:** `features/support/steps/hap.ts` (new), `features/harness.feature`
- **Verification:** 50/50 scenarios pass.
- **Committed in:** `4c8291e`, `c20eff2`

---

**Total deviations:** 3 auto-fixed (3 blocking).
**Impact on plan:** None on scope. All three were forced by gates the plan itself requires (`npm run check`) or by the plan's own instruction not to touch `harness.ts`. No file under `src/` was touched.

## TDD Gate Compliance

Tasks 1 and 2 carry `tdd="true"`, and the RED phase was run and recorded for both, but **RED and GREEN landed in one commit per task rather than as separate `test(...)` then `feat(...)` commits.**

The reason is a hard project constraint, not convenience. A RED commit here is a commit in which the module under test does not yet exist. `.pre-commit-config.yaml` runs `npm run lint` on every commit touching `features/`, and eslint's typed rules report 102 errors (`no-unsafe-call`, `no-unsafe-member-access`, and friends) against a step module importing a module that cannot be resolved. `CLAUDE.md` forbids `--no-verify` outright and requires hooks to pass *before* the commit. The two conventions are incompatible for a new module, and the project rule wins.

What was not skipped: both RED runs were executed and their output recorded.

- Task 1 RED: `npm run test:cucumber` failed at `build:test` with `features/support/steps/hap.ts(15,31): error TS2307: Cannot find module '../fakeHap.js'`, plus six follow-on errors.
- Task 2 RED: `npm run test:cucumber` failed at `build:test` with `error TS2724: '"../fakeHomebridgeApi.js"' has no exported member named 'createFakeAccessory'`.
- Task 2 additionally has a behavioural negative control (see Verification above), which is the stronger evidence: the new assertions were shown to fail against the pre-fix `addService` semantics, not merely against a missing symbol.

## Issues Encountered

**One must_have truth is only partially met, deliberately.**

The plan's first truth reads: *"One hand-built HAP namespace stand-in exists, in `features/support/fakeHap.ts`, and it is the only one in the repository — both the Cucumber harness and the accessories unit tests import it."*

Within `features/` this now holds exactly. It does **not** hold repository-wide: `test/accessories/basementGuardian.test.ts` still declares its own `FakeIdentifier` constants, a four-characteristic `fakeHap` literal, and `FakeService` / `FakeAccessory` doubles (lines 36-88). That file was not migrated, for three reasons:

1. It is outside the plan's declared scope — neither `files_modified` nor any of the three tasks names it.
2. Migrating it would change what one existing case asserts. Line 251 asserts `getCharacteristic(CHARACTERISTIC_MANUFACTURER) === undefined` to prove a degraded `update()` never touched `AccessoryInformation`. Against the shared stand-in, `AccessoryInformation` constructs *with* `Manufacturer` at its `''` default, so that assertion would have to become `=== ''` — a strictly weaker signal for the same claim. Rewriting a passing test into a weaker one that still passes is the failure mode this phase is explicitly guarding against.
3. Its `FakeAccessory` carries a `hasAccessoryInformation = false` mode that the shared stand-in cannot express, because a real accessory always carries that service. That branch is load-bearing for the pair's required 100% branch coverage.

The prohibition *"MUST NOT create a second hand-built HAP stand-in"* is satisfied: none was created, and the pre-existing one is untouched.

**Follow-up for later plans in this phase:** the new accessories unit tests (`customServices`, `customCharacteristics`, `serviceCatalogue`) should import `features/support/fakeHap.ts` rather than grow doubles of their own, and `basementGuardian.test.ts` should migrate when plan 03-04 or 03-06 reworks its `AccessoryInformation` assertions for the service catalogue — at which point the `undefined`-versus-`''` question is being answered anyway.

**`When the scenario clock does not move` has no consumer yet.** It is bound and correct, and the plan's `<done>` asks only for that, but no scenario exercises it until the immediacy scenarios arrive (03-04, 03-07). It is classified `human_judgment: true` in the coverage block rather than claimed as automatically proven.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for the rest of wave 1 and for every later plan in this phase.

- A production module can now declare `class X extends hap.Service` / `extends hap.Characteristic` and be exercised end to end by a scenario.
- A scenario can call the same `addService` / `getServiceById` / `updateCharacteristic` / `testCharacteristic` / `addOptionalCharacteristic` / `removeService` shapes production calls, and read back every characteristic the accessory pushes.
- The real format defaults are in place, so the "a newly added service reads as a healthy sump pit" hazard is observable rather than hidden.
- `.fallowrc.json` was not touched; it remains plan 03-08's alone.

Concerns: the unit-test-side stand-in migration noted above, and the unbound clock step.

## Self-Check: PASSED

- Every file listed under `key-files` exists on disk.
- All three task commits resolve: `4c8291e`, `c20eff2`, `702c0a4`.
- `git cat-file -e HEAD:<path>` confirms both created files are in the committed tree.

---
*Phase: 03-safety-monitoring-in-homekit*
*Completed: 2026-08-30*
