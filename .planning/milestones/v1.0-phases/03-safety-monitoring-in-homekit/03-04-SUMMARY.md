---
phase: 03-safety-monitoring-in-homekit
plan: 04
subsystem: ui
tags: [homekit, hap, homebridge, contact-sensor, custom-characteristic, cucumber]

requires:
  - phase: 03-01
    provides: The constructible HAP namespace stand-in and the real three-argument addService shape
  - phase: 03-02
    provides: Per-field violation scopes and the partial decode that omits a scope which did not validate
  - phase: 03-03
    provides: The primary-pump-running core kind and the seven removable notification slugs
provides:
  - A read-only Mains Power Present characteristic and a Sump Mains Power service, both under fixed v4 identifiers outside Apple's namespace
  - A service catalogue with one row per published service, the projection contract, and the get-or-add, remove, and push helpers
  - An accessory that narrows distrust to the scopes whose own fields failed, retains the last trustworthy value, and marks the row inactive
  - A confirmed-offline adapter driven only by consecutive disconnected polls
  - Cucumber steps that read a published service and characteristic back off the registered accessory
affects: [03-05, 03-06, 03-07, 03-08]

actuals:
  tokens: 33947
  tasks: 1
  commits: 5

tech-stack:
  added: []
  patterns:
    - Custom HAP types declared inside a factory over the injected api.hap namespace
    - Table-driven service catalogue with one project closure per row and a single trust gate
    - Consecutive-count confirmation for a plugin-derived physical-device alert

key-files:
  created:
    - src/accessories/customCharacteristics.ts
    - src/accessories/customServices.ts
    - src/accessories/serviceCatalogue.ts
    - features/safetyMonitoring.feature
    - features/support/steps/homekit.ts
    - test/accessories/customCharacteristics.test.ts
    - test/accessories/customServices.test.ts
    - test/accessories/serviceCatalogue.test.ts
  modified:
    - src/accessories/basementGuardian.ts
    - test/accessories/basementGuardian.test.ts
    - test/platform.test.ts
    - features/support/fakeHomebridgeApi.ts

key-decisions:
  - "D-12 confirmed by the user: a service subtype is its ServiceKind slug verbatim, with no prefix and no version segment"
  - "Custom service and characteristic UUIDs are hard-coded random v4 literals, never derived from a seed string that a later edit could change"
  - "A row's trust gate reads the row the call is made on, so a row derived with a different toleratedDistrust is judged by its own list"
  - "The degradation warning fires on any transition into a degraded state, not only on an unresolved family"

patterns-established:
  - "Trust gate in one place: isRowTrusted drives both the empty projection and the StatusActive push"
  - "Source-condition tests read a module with its comments stripped, so a header may name a forbidden idiom in order to forbid it"

requirements-completed: [SAFE-05, SAFE-08, RES-01, RES-03, CONF-06]

coverage:
  - id: D1
    description: "A validated ac_power reaches Apple Home end to end: the custom Sump Mains Power service carries the reported value and the Mains Power Lost contact sensor follows it"
    requirement: SAFE-05
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#projects the reported ac_power true verbatim onto Mains Power Present"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#publishes a reported ac_power of false on both power services"
        status: pass
      - kind: e2e
        ref: "features/safetyMonitoring.feature#A mains power loss activates the mains power lost sensor"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every custom characteristic is read-only and no custom identifier lies in Apple's assigned base namespace"
    requirement: SAFE-08
    verification:
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#declares Mains Power Present as a read-only boolean"
        status: pass
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#identifies MainsPowerPresent with a fixed v4 identifier outside Apple's namespace"
        status: pass
      - kind: unit
        ref: "test/accessories/customServices.test.ts#identifies SumpMainsPowerService with a fixed v4 identifier outside Apple's namespace"
        status: pass
    human_judgment: false
  - id: D3
    description: "An untrusted scope publishes no value at all and keeps the last trustworthy reading, marking only its own rows inactive"
    requirement: RES-01
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#keeps the last trustworthy power values when ac_power stops validating"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#deactivates only the services of the scope that stopped validating"
        status: pass
      - kind: e2e
        ref: "features/safetyMonitoring.feature#A power field that stops validating keeps its last trustworthy reading"
        status: pass
    human_judgment: false
  - id: D4
    description: "Basement Guardian Offline activates only after the configured run of consecutive disconnected polls, and never from the device's own offline report"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#activates the offline adapter on disconnected poll 8 and not before"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#never activates the offline adapter from the device reporting itself offline"
        status: pass
      - kind: e2e
        ref: "features/safetyMonitoring.feature#The offline adapter stays quiet while the vendor answers for the device"
        status: pass
    human_judgment: false
  - id: D5
    description: "An ignoredFaults slug un-publishes only its own contact sensor, idempotently, leaving the condition and every sibling service in place"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#leaves the decoded condition and every sibling service untouched by a suppression"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#applies the same suppression a second time without adding or removing a service"
        status: pass
    human_judgment: false
  - id: D6
    description: "Apple Home renders the custom Sump Mains Power service, and renders a StatusActive false service as a settings row rather than hiding the tile"
    requirement: SAFE-08
    verification: []
    human_judgment: true
    rationale: "Controller-side rendering of a non-Apple service UUID is outside the plugin's reach and cannot be asserted from the plugin; research carries it as assumption A3 with no authoritative source either way."

duration: 60 min
completed: 2026-08-30
status: complete
---

# Phase 3 Plan 4: HomeKit Publication Tracer Summary

**A vendor `ac_power` now travels family decode, catalogue row, custom and standard HomeKit services, and a published characteristic, with the confirmed-offline adapter proving the accessory's own per-poll state reaches HomeKit too.**

## Performance

- **Duration:** 60 min
- **Started:** 2026-08-30T15:47:00Z
- **Completed:** 2026-08-30T16:47:00Z
- **Tasks:** 1 executed (task 1 was the decision checkpoint, answered by the user)
- **Files modified:** 12

## Accomplishments

- `createCustomCharacteristics` and `createCustomServices` declare `MainsPowerPresent` and `SumpMainsPowerService` over the injected `api.hap` namespace, each under a hard-coded random v4 identifier that is not in Apple's assigned base namespace.
- `createServiceCatalogue` returns the three tracer rows in publication order, each carrying its kind, its subtype (the kind slug verbatim), its display name, its scope, its tolerated distrust reasons, its service class, and a `project` closure gated on trust in exactly one place.
- `createBasementGuardianAccessory` now walks the catalogue on every `update()`: it narrows distrust to the scopes whose own fields failed, keeps a per-scope `lastTrustedAt`, refreshes `AccessoryInformation` only when the metadata group decoded, counts consecutive disconnected polls, and pushes `StatusActive` on every published row while pushing no value at all on an untrusted one.
- `features/safetyMonitoring.feature` drives the real plugin against the fake vendor cloud and reads the published services back off the registered accessory.

## Task Commits

1. **Custom HAP types** — `5392544` (feat)
2. **Service catalogue and publish helpers** — `38569f0` (feat)
3. **Accessory publish loop, trust scoping, offline counter** — `d6ea0dc` (feat)
4. **Cucumber feature and HomeKit read-back steps** — `5401a4a` (test)
5. **Platform test held to the shared HAP stand-in** — `018ba9b` (fix)

## Files Created/Modified

- `src/accessories/customCharacteristics.ts` — the read-only vendor-defined characteristics and the `CharacteristicClass` type HAP's readers and writers accept.
- `src/accessories/customServices.ts` — the custom service classes and the `ServiceClass` type `getServiceById` and `addService` accept.
- `src/accessories/serviceCatalogue.ts` — the rows, the projection contract, `isRowTrusted`, `ensureService`, `removeServiceIfPresent`, and `publishValue`.
- `src/accessories/basementGuardian.ts` — reworked from all-or-nothing degradation to per-scope trust and a catalogue-driven publish loop.
- `features/safetyMonitoring.feature` — four scenarios covering publication, mains loss, retention under a failed field, and the quiet offline adapter.
- `features/support/steps/homekit.ts` — `Then` steps that resolve a named service through the catalogue and read a characteristic back.
- `features/support/fakeHomebridgeApi.ts` — `HarnessPlatformAccessory` exported so a caller can stand in for `api.platformAccessory`.
- `test/platform.test.ts` — moved off its own HAP stand-in onto the shared one.

## Decisions Made

- **D-12 confirmed (`confirm`, chosen by the user at the checkpoint).** The subtype is the `ServiceKind` slug verbatim. `toRow` builds `subtype: kind`, so the rule holds by construction rather than by three separate literals.
- **Hard-coded v4 UUID literals.** `MainsPowerPresent` is `b014b110-41bb-4dec-a681-4a331455425e`; `SumpMainsPowerService` is `fbb41424-0697-4ebe-ba89-7ba8ea254623`. Neither ends in `-0000-1000-8000-0026BB765291`. A source-condition test asserts that no module under `src/accessories/` calls `uuid.generate`, so the identity cannot quietly become seed-derived later.
- **`docs/research/PLUGIN.md` §8 is superseded.** Its namespaced-subtype proposal (`fault.water-sensor`) predates `D-12` and was rejected at the checkpoint. That file is untracked — `docs/research/` is gitignored — so no tracked artifact disagrees with `D-12`.
- **`ServiceRow.project` declares an explicit `this: ServiceRow`.** The first draft captured `scope` and `toleratedDistrust` when the catalogue was built, which made a row derived by spreading another silently keep the original's trust list. The `this`-typed method was the smallest change that makes a derived row judged by its own list, and the acceptance-criteria fixture case is what caught it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's Background would have produced an invalid Gemini**

- **Found during:** Task 2, Cucumber scenario authoring
- **Issue:** The plan says to copy the `Background` from `features/degradedOperation.feature`. That block seeds devices through `Given these gemini devices:` in `features/support/steps/shadow.ts`, which sets `data: {}`. A Gemini with no telemetry fails `validate()` on all sixteen required fields, so no power value could ever be published and the tracer scenario would have proved nothing.
- **Fix:** Used `features/discovery.feature`'s `Background` instead, whose `Given these devices:` step (in `features/support/steps/harness.ts`) seeds a full, legal Gemini payload including `ac_power`. Added `Given a short poll interval` so a mid-scenario field change is picked up without a real wait.
- **Files modified:** `features/safetyMonitoring.feature`
- **Verification:** All four new scenarios pass; the mains-loss scenario fails when the contact convention is inverted.
- **Committed in:** `5401a4a`

**2. [Rule 3 - Blocking] `test/platform.test.ts` carried a third HAP stand-in that cannot be subclassed**

- **Found during:** Task 2, first full `npm run check`
- **Issue:** `test/platform.test.ts` declared its own `fakeHap` whose `Service` and `Characteristic` are plain identifier objects. The accessory factory now builds the catalogue eagerly, which subclasses `hap.Characteristic`, so eleven cases died with `Class extends value #<Object> is not a constructor or null` and the file hung. Its `FAKE_FAMILY` also threw from `decode()` on the premise that an invalid snapshot is never decoded — a contract 03-02 already replaced with the partial decode.
- **Fix:** Moved the file onto `createFakeHap()` and the exported `HarnessPlatformAccessory`, deleted the local stand-ins, derived the accessory UUID through `hap.uuid.generate` rather than a hardcoded `uuid-${DEVICE_ID}` literal, and gave `FAKE_FAMILY` a scoped violation with a non-throwing `decode()`.
- **Files modified:** `test/platform.test.ts`, `features/support/fakeHomebridgeApi.ts` (both outside this plan's `files_modified`)
- **Verification:** `test/platform.test.ts` passes 28/28 with `src/platform.js` at 100% line, branch, and function coverage.
- **Committed in:** `018ba9b`

**3. [Rule 3 - Blocking] An under-specified `api.hap` expectation surfaced as a five-second timeout**

- **Found during:** Task 2, after deviation 2
- **Issue:** `registers a newly discovered device once the launch event succeeds` declared `when(() => api.hap).thenReturn(...)` with no count, so strong-mock satisfied only the first of the two reads `registerDiscoveredDevices` makes. Before this plan the second read's value was only dereferenced inside `populateAccessoryInformation`, which never ran for an invalid snapshot; now the accessory factory dereferences it immediately, and the resulting `TypeError` was swallowed by the runtime's promise chain and surfaced as a timeout.
- **Fix:** `.times(2)` with a comment naming both reads, matching the `.times(3)` idiom the sibling case already uses.
- **Files modified:** `test/platform.test.ts`
- **Verification:** The case passes; the failure mode was reproduced standalone against a strong-mock `API` before the fix.
- **Committed in:** `018ba9b`

**4. [Rule 3 - Blocking] The degradation warning had to keep firing for a per-field failure**

- **Found during:** Task 2, accessory rework
- **Issue:** The plan's `<action>` puts the log-once flag only on the non-implemented branch. `features/discovery.feature`'s scenario *A payload that stops validating degrades the accessory in place* seeds an out-of-domain `water_level` — an implemented family with a failed field — and asserts `Then the plugin explains the degradation once`. Following the plan literally would have removed that diagnostic and broken a passing scenario.
- **Fix:** `reportDegradation()` fires on any transition from an empty to a non-empty untrusted set, and clears on recovery. The message wording is unchanged, so `features/support/steps/harness.ts` needed no edit.
- **Files modified:** `src/accessories/basementGuardian.ts`
- **Verification:** All 50 pre-existing scenarios still pass; the log-once and log-again unit cases still pass.
- **Committed in:** `d6ea0dc`

**5. [Rule 1 - Bug] `firmwareRevisionOf` had unreachable branches after the metadata guard**

- **Found during:** Task 2, coverage run
- **Issue:** With `AccessoryInformation` refreshed only when the decoded metadata group is present, the two `isRecord` guards inside `firmwareRevisionOf` could never both be reached, leaving dead branches that no public-behaviour case could cover.
- **Fix:** Split the narrowing into `decodedMetadataOf(decoded)`, which returns the group or `undefined`, and a `firmwareRevisionOf(metadata)` that takes the narrowed record. Every branch is now reachable from a public case.
- **Files modified:** `src/accessories/basementGuardian.ts`
- **Verification:** `src/accessories/basementGuardian.js` at 100% branch coverage.
- **Committed in:** `d6ea0dc`

### Superseded tests

Four cases in `test/accessories/basementGuardian.test.ts` asserted the prior milestone's whole-accessory degradation for a *per-field* validation failure, which `D-014` and 03-02's partial decode deliberately replace. They were superseded, not silently rewritten:

- *degrades every non-connectivity scope when validate() reports the snapshot invalid* → replaced by *reports the failing scope alone, timed at the last snapshot in which it decoded*.
- *never calls decode() when validate() reports the snapshot invalid* → removed; the family now decodes every scope whose own fields validated, and the accessory relies on that.
- *produces the identical untrusted shape whether the family is unresolved or its validate() fails* → removed; the two are deliberately no longer identical.
- *keeps AccessoryInformation unchanged after a degrading update follows a valid one* → replaced by four cases over the shapes for which the metadata group does not decode.

The whole-accessory degradation for an **unresolved** family is unchanged and still asserted.

---

**Total deviations:** 5 auto-fixed (4 blocking, 1 bug)
**Impact on plan:** No scope creep. Four of the five were forced by gates that would otherwise have failed; the fifth removed dead branches. Two files outside `files_modified` were touched (`test/platform.test.ts`, `features/support/fakeHomebridgeApi.ts`), both recorded above.

## Falsification Results

Every new gate was falsified by patching its defect back in and watching the suite fail.

| Defect reintroduced | Result |
|---|---|
| Add `PAIRED_WRITE` to the custom characteristic's perms | 2 of 5 fail |
| Move the custom UUID into Apple's base namespace | 1 of 5 fails |
| Derive the UUID with `hap.uuid.generate` instead of a literal | 1 of 5 fails |
| Drop the optional `StatusActive` declaration from the custom service | 1 of 5 fails |
| Declare `MainsPowerPresent` optional instead of required | 2 of 5 fail |
| Invert the contact alarm convention | 5 of 32 unit fail; 3 of 54 scenarios fail |
| Default an absent mains fact to a normal-looking `true` | 7 of 32 fail |
| Drop the row trust gate | 2 of 32 fail |
| Look a service up by its identifier string | 1 of 32 fails |
| Drop the `optionalCharacteristics` guard in `publishValue` | 1 of 32 fails |
| Prefix the subtype instead of using the kind slug | 4 of 32 fail |
| Mark every published row active regardless of trust | 1 of 51 unit fails; 1 of 54 scenarios fails |
| Degrade every scope on any validation failure | 3 of 51 fail |
| Count the device's own `data.offline` into the run | 1 of 51 unit fails; 1 of 54 scenarios fails |
| Compare the run with `>` instead of `>=` | 4 of 51 fail |
| Do not reset the run on a connected poll | 2 of 51 fail |
| Skip a suppressed row without removing its service | 1 of 51 fails |
| Refresh `AccessoryInformation` whatever decoded | 4 of 51 fail |
| Drop the trust gate and default an absent mains fact to `false` | 1 of 54 scenarios fails |

**One sub-behaviour could not be falsified.** Raising the offline counter's clamp (`Math.min(previous + 1, threshold)` → `threshold + 100`) left the suite fully green. A connected poll resets the run to zero, so the clamp changes no observable behaviour; it is a construction-level invariant that makes the stated truth *the count never exceeds the configured threshold* literally hold, and nothing more. It is reported here rather than presented as a tested guarantee.

Three falsifications were caught by the compiler rather than by a test (an unused import or parameter after the defect was applied) and were re-run in a form that builds; those re-runs are the numbers in the table.

## Issues Encountered

- The `test/platform.test.ts` failure surfaced first as a ten-minute hang inside `npm run check`, because the thrown `TypeError` was swallowed into the account runtime's promise chain. Reproducing the registration path in a standalone script against a strong-mock `API` is what named the real cause.

## Known Stubs

- `ProjectionInput.controllerDataLastTrustedAt` is computed and passed on every update, but no row this plan declares reads it. The plan puts it in the projection contract from the start so later rows consume a value the accessory already owns rather than reaching for a clock. Its computation is exercised (both the empty-string and the timestamp branch), but its **value** is not asserted end to end, because there is no consumer to read it through. The `RES-02` row that consumes it belongs to a later plan in this phase.

## Verification Status

- `npm run test:coverage:direct` for all four source-test pairs: 100% line, branch, and function coverage.
- `npm run test:cucumber`: 54 scenarios, 444 steps, all passed.
- `npm run check`: exit 0 on three consecutive runs.
- `npm run test:unit`: 781 tests, all passed.
- `src/platform.js` still at 100% line, branch, and function coverage after the stand-in change.

## TDD Gate Compliance

The task carries `tdd="true"`. The RED/GREEN cycle was followed within the session — each behaviour's test was written and run before its implementation, and the acceptance-criteria fixture case failed first and drove the `this`-typed `project` redesign — but the commits are per-module `feat(...)` rather than a separate `test(...)` RED commit followed by `feat(...)`.

The reason is mechanical: `.pre-commit-config.yaml` runs `npm lint`, `npm typecheck`, and `npm fallow` with `pass_filenames: false`, so every commit is gated on the whole tree. A commit holding tests that import modules which do not exist yet fails `npm lint` outright, and the project forbids `--no-verify`. A RED commit is therefore only expressible by first committing a contrived stub module, which would make the GREEN step a rewrite rather than an implementation.

No `test(...)` gate commit exists for the three source modules. `5401a4a` is a genuine `test(...)` commit for the Cucumber layer.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The contracts the remaining plans expand from are fixed: the `ServiceRow` shape, `ProjectionInput`, the get-or-add and remove helpers, `publishValue`'s declaration guard, `isRowTrusted`, and the `StatusActive` discipline.
- Plan 03-06 no longer has the partial-decode wiring to do: `createBasementGuardianAccessory` already consumes `FieldViolation.scope` and narrows distrust per scope. Its remaining work is whatever that plan adds beyond this.
- `src/platform.ts` still does not pass `ignoredFaults` or `offlineConfirmationPollCount` to the accessory, so both take their defaults in production. Wiring the resolved `BgConfig` through is open.
- `.fallowrc.json` still lists `src/accessories/services.ts` under `ignoreFindings`, which plan 03-08 owns. It was not touched.

## Self-Check: PASSED

Every file listed under `key-files` exists on disk, every commit hash listed under Task Commits resolves in `git log`, and both spot-checked new source files are tracked in `HEAD`.

---
*Phase: 03-safety-monitoring-in-homekit*
*Completed: 2026-08-30*
