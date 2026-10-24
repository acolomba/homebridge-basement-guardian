---
phase: 03-safety-monitoring-in-homekit
plan: 05
subsystem: ui
tags: [homekit, hap, homebridge, leak-sensor, contact-sensor, battery, custom-characteristic]

requires:
  - phase: 03-02
    provides: The decoded scope groups the rows read, and the partial decode that omits a group whose fields did not validate
  - phase: 03-03
    provides: The primary-pump-running core kind and the seven removable notification slugs
  - phase: 03-04
    provides: The ServiceRow shape, the projection contract, isRowTrusted, and the get-or-add, remove, and push helpers
provides:
  - Eleven more read-only vendor-defined characteristics, each under a hard-coded v4 identifier outside Apple's namespace
  - Sump Pit, Pump, and Backup Battery services, with the Pump service shaped to take later record characteristics without a subtype change
  - All fifteen catalogue rows, in a fixed publication order pinned against an inline display-name list
  - A per-value trust rule, so a row keeps publishing a trustworthy group while another group it reads is untrusted
  - The first consumer of ProjectionInput.controllerDataLastTrustedAt
affects: [03-06, 03-07, 03-08]

actuals:
  tokens: 36460
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - One class factory per HAP type family, driven from a definition table, so no near-identical class body repeats
    - Per-scope-group trust reads, so one row can publish from two groups and withhold only the untrustworthy half
    - Test loops extracted into named registrar functions, keeping one top-level describe under the cognitive-complexity gate

key-files:
  created: []
  modified:
    - src/accessories/customCharacteristics.ts
    - src/accessories/customServices.ts
    - src/accessories/serviceCatalogue.ts
    - test/accessories/customCharacteristics.test.ts
    - test/accessories/customServices.test.ts
    - test/accessories/serviceCatalogue.test.ts
    - test/accessories/basementGuardian.test.ts

key-decisions:
  - "Both battery services publish under the single backup-battery kind and subtype, named Backup Battery and Backup Battery Facts"
  - "A row's trust gate is applied per decoded scope group rather than per row, so Sump Pit Level keeps publishing water while the fault scope is untrusted"
  - "ControllerDataLastTrustedAt publishes only beside a decoded link state, so a row that cannot vouch for the link never publishes a time that reads as evidence about it"
  - "A merged backup-pump verdict is withheld unless both raw causes decoded, rather than defaulting the missing one to false"
  - "hap.Service.Battery is used; the Service.BatteryService alias does not exist on the Homebridge 2.x HAP line"

patterns-established:
  - "Definition table plus one class factory: the read-only perms literal lives in exactly one place, so no declaration can grant a write permission by omission"
  - "published(candidates): a row lists every value it could publish and the helper drops the ones whose source fact did not decode"
  - "Registrar functions group data-driven test loops, so one describe per entrypoint stays under fallow's cognitive-complexity threshold"

requirements-completed: [SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-06, SAFE-08]

coverage:
  - id: D1
    description: "Every vendor-defined characteristic is read-only, carries a fixed v4 identifier outside Apple's assigned namespace, and no two share an identifier"
    requirement: SAFE-08
    verification:
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#grants no write permission on any vendor-defined characteristic"
        status: pass
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#identifies RawWaterLevelCode with a fixed v4 identifier outside Apple's namespace"
        status: pass
      - kind: unit
        ref: "test/accessories/customServices.test.ts#gives every published type of either factory its own identifier"
        status: pass
    human_judgment: false
  - id: D2
    description: "One PumpService class carries both pumps under their own subtypes, declaring the fuse fact optional so the primary can omit it and a later release can add record characteristics without a subtype change"
    requirement: SAFE-08
    verification:
      - kind: unit
        ref: "test/accessories/customServices.test.ts#carries both pumps on one service class, each under its own subtype"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#keeps both pumps apart on one custom service class"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sump Pit Level publishes the mapped percentage beside the raw vendor code for every legal water-level code, and Sump Pit Flood activates at code 31 alone"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes water level code 31 as 100 per cent beside the raw code"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#reports a flooding pit at exactly one legal water level code"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes an integer water level for code 31"
        status: pass
    human_judgment: false
  - id: D4
    description: "A water-level code that failed validation publishes no level and no raw code, while a trustworthy water level keeps publishing through an untrusted fault scope"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#keeps publishing a trustworthy water level while the fault scope is untrusted"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#projects nothing on any decoded-state row from a group that did not decode"
        status: pass
    human_judgment: false
  - id: D5
    description: "Primary Pump Running and Backup Pump Activated follow their own running boolean alone, so a self-test, an absent activation timestamp, a mains loss, and a primary-pump fault leave them unchanged"
    requirement: SAFE-03
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#activates the backup pump adapter during a self-test run of true"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#activates the backup pump adapter with a reported activation time of undefined"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#leaves the backup pump adapter quiet while every other condition is active"
        status: pass
    human_judgment: false
  - id: D6
    description: "Five equipment-fault adapters transition independently, no aggregate fault is published, and the two raw backup causes stay separately readable on the custom Backup Pump service"
    requirement: SAFE-04
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#activates one fault adapter alone for a blown backup pump fuse"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#keeps a backup pump fault of false and a fuse of true separately readable"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes no aggregate fault and no filter maintenance service"
        status: pass
    human_judgment: false
  - id: D7
    description: "Pump Controller Link Lost keeps reporting while a lost link makes its own scope untrusted, and reports nothing when the link fact failed validation"
    requirement: SAFE-04
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#keeps the controller link adapter publishing while a lost link makes its own scope untrusted"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes no controller link state at all while the link fact failed validation"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#silences every other fault adapter while a lost link makes the fault scope untrusted"
        status: pass
    human_judgment: false
  - id: D8
    description: "StatusLowBattery follows the D-07 sources, the protection band publishes as reported even when the health code says the battery is absent, and NOT_CHARGEABLE is never published"
    requirement: SAFE-06
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#reports the backup battery as low for health code 32 with a low voltage of false"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes the reported protection band unchanged while the health code reports the battery absent"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#never reports the backup battery as not chargeable, for any reading in this suite"
        status: pass
    human_judgment: false
  - id: D9
    description: "Wi-Fi signal strength reaches no HomeKit service or characteristic, and no filter-maintenance semantics are used anywhere"
    verification:
      - kind: unit
        ref: "test/accessories/customCharacteristics.test.ts#gives no vendor-defined characteristic a name drawn from diagnostics or filter maintenance"
        status: pass
      - kind: unit
        ref: "test/accessories/customServices.test.ts#names no PumpService characteristic after diagnostics or filter maintenance"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes no aggregate fault and no filter maintenance service"
        status: pass
    human_judgment: false
  - id: D10
    description: "The fifteen published services render in Apple Home under names an owner reads as basement-protection conditions, and the 25/50/75/100 battery levels read as documented estimates rather than measurements"
    requirement: SAFE-06
    verification: []
    human_judgment: true
    rationale: "Whether a rendered percentage reads to an owner as an estimate is a judgement no test can settle; the plan carries it as a judgement-tier prohibition and a documentation obligation, and it needs the real-home session."
  - id: D11
    description: "A real controller's 7-to-15-second pump activation is actually observed and delivered to HomeKit"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes the reported primary pump running state of true on both primary rows"
        status: pass
    human_judgment: true
    rationale: "The projection is proven here, but whether an activation is ever observed depends on delivery cadence rather than on the adapter; that is settled by the live-state wiring in 03-06 and by the real-hardware gate."

duration: 60 min
completed: 2026-08-30
status: complete
---

# Phase 3 Plan 5: The Full Service Catalogue Summary

**Eleven more services join the tracer's three: the pit level and its flood adapter, both pumps with their live activity adapters, the battery pair, and four more independent fault adapters, each carrying its exact vendor cause read-only beside its standard value.**

## Performance

- **Duration:** 60 min
- **Started:** 2026-08-30T17:00:00Z
- **Completed:** 2026-08-30T18:00:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `createCustomCharacteristics` now answers twelve read-only characteristics built from one definition table and one class factory. The read-only permission set is built in exactly one place and answers a fresh array per declaration, so no declaration can grant a write permission by omission and no two characteristics share a mutable props member.
- `createCustomServices` answers four services from one class factory. `PumpService` declares `PumpFault` and `PumpFuseBlown` optional, so one class carries both pumps under their own subtypes and a later release can add the observation-epoch, observed-count, and last-activation characteristics without touching the subtype.
- `createServiceCatalogue` answers all fifteen rows in a fixed publication order, built from five small definition functions. The order and the display-name list are both pinned against inline literals, so a later addition or reorder is a deliberate, visible change.
- The projection rule generalised from per row to per decoded scope group. `Sump Pit Level` reads both `water` and `fault`, and keeps publishing a trustworthy level while withholding the fault-sourced values.
- `ProjectionInput.controllerDataLastTrustedAt` has its first consumer: `Pump Controller Link Lost` publishes it beside the link state it reports (RES-02).

## Task Commits

1. **The remaining custom services and their read-only characteristics** — `848186f` (feat)
2. **The water services, the flood adapter, and both pumps** — `cffe52e` (feat)
3. **The battery pair and the four remaining fault adapters** — `4fdfb55` (feat)

## Files Created/Modified

- `src/accessories/customCharacteristics.ts` — twelve characteristics from one table and one class factory; the read-only perms in one place.
- `src/accessories/customServices.ts` — `SumpPitService`, `PumpService`, `SumpMainsPowerService`, and `BackupBatteryService` from one class factory, every one declaring `StatusActive` and `StatusFault` optional.
- `src/accessories/serviceCatalogue.ts` — the fifteen rows, the per-group `trustedGroup` reader, the `published` candidate filter, and the standard-value helpers (`contactState`, `faultState`, `leakState`, `lowBatteryState`, `chargingState`).
- `test/accessories/customCharacteristics.test.ts` — data-driven over the whole declared set.
- `test/accessories/customServices.test.ts` — data-driven over the four services, plus the cross-factory identifier-distinctness check.
- `test/accessories/serviceCatalogue.test.ts` — the whole projection surface, with the data-driven loops grouped into registrar functions.
- `test/accessories/basementGuardian.test.ts` — the published-service set grew from three to fifteen, and service lookups moved from subtype to display name.

## Decisions Made

- **Two battery services under one kind and one subtype.** `HOMEKIT.md` §2 names one row for both, so the second display name (`Backup Battery Facts`) is chosen rather than quoted, as the plan's flagged assumption records. They carry different HAP service types, so HAP accepts both on one accessory and `getServiceById` disambiguates them by class. This is the only kind the catalogue publishes twice, and it is why the accessory test now resolves a service by display name rather than by subtype.
- **The trust gate reads a scope group at a time.** `trustedGroup(input, trust, scope)` answers a decoded group only while the row may still vouch for the scope that owns it. The tracer's three rows each read exactly one group, so their behaviour is unchanged; what it buys is `Sump Pit Level` keeping a trustworthy water level published while the `fault` scope is untrusted. `RowDefinition.values` gained a second parameter carrying the row's own trust facts, so the rule is judged by the row the call is made on rather than a copy captured when the catalogue was built.
- **A merged verdict needs both of its causes.** `backupPumpFaulted` answers `undefined` unless both `backupPumpFault` and `backupPumpFuseBlown` decoded. Defaulting the missing one to `false` would publish a quiet backup-pump-fault adapter from half a fault group, which is exactly the false normal the safety rule forbids. Both raw causes stay separately readable on the custom `Backup Pump` service, so the exact cause is never lost to the merge.
- **`ControllerDataLastTrustedAt` publishes beside the link state, not on its own.** A row that cannot vouch for the link would otherwise publish a timestamp that reads as evidence about it. Under a lost link the `fault` group still decodes -- `serial_communications === false` is a reported condition rather than a validation failure -- so all four values publish there, which is what `RES-02` asks for.
- **`hap.Service.Battery`, not `Service.BatteryService`.** The alias is absent from the Homebridge 2.x HAP line. `docs/research/HOMEKIT.md` §2's wording is stale; that file is untracked, so no tracked artifact disagrees.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `test/accessories/basementGuardian.test.ts` had to change with the published-service set**

- **Found during:** Tasks 2 and 3
- **Issue:** The file is outside this plan's `files_modified`, but it pins the accessory's published-service list against an inline literal of three descriptors and looks a service up by its subtype. Publishing twelve more services makes both wrong: the list is now fifteen, and the two backup-battery rows share one subtype, so a subtype lookup silently answers the standard Battery service for both.
- **Fix:** `PUBLISHED_SERVICES` extended to the fifteen descriptors in catalogue order, with a companion `PUBLISHED_SCOPES` list so a case can say which services one failing scope deactivates without restating the catalogue. `serviceClassOf(subtype)` was replaced by `rowNamed(displayName)`, and `serviceOf`, `valueOf`, and `statusActiveOf` now take the display name -- which is what `features/support/steps/homekit.ts` already does.
- **Files modified:** `test/accessories/basementGuardian.test.ts` (outside `files_modified`)
- **Verification:** The file passes 51/51 with `src/accessories/basementGuardian.js` still at 100% line, branch, and function coverage. The suppression case still proves one adapter alone is removed.
- **Committed in:** `cffe52e` and `4fdfb55`

**2. [Rule 3 - Blocking] The catalogue test module breached the cognitive-complexity gate**

- **Found during:** Task 3, first `npm run lint` after the battery and fault cases
- **Issue:** `sonarjs/cognitive-complexity` and `fallow health` both flagged the single `describe('createServiceCatalogue')` callback at 17 against a limit of 15 -- fifteen sibling `for` loops in one function body. The project's test rules require one top-level `describe()` per entrypoint and one `for` loop per data-driven table, so neither could simply be dropped.
- **Fix:** The loops were grouped into seven module-level registrar functions (`registerWaterCases`, `registerPumpCases`, `registerPowerCases`, `registerBatteryCases`, `registerFaultAdapterCases`, `registerOfflineCases`, `registerAbsentStateCases`), each declared above the `describe` and called from its body. Registration is synchronous, so every case still belongs to the one top-level suite; no case was rewritten or removed.
- **Files modified:** `test/accessories/serviceCatalogue.test.ts`
- **Verification:** `npm run lint` and `npm run fallow` both clean; the module still reports the same case count and the same 100% coverage of `serviceCatalogue.js`.
- **Committed in:** `4fdfb55`

**3. [Rule 3 - Blocking] `fallow dead-code` read a source-condition test's `new URL` as an import**

- **Found during:** Task 2, first `npm run fallow`
- **Issue:** The test proving `serviceCatalogue.ts` never imports the water-level ladder reads the module as text. Written as a literal `new URL('../../../src/accessories/serviceCatalogue.ts', import.meta.url)`, fallow resolves it as a static import of a `.ts` path and fails the gate with one unresolved import.
- **Fix:** Moved the read behind a `sourceOf(module)` helper that interpolates the name, matching the idiom `test/accessories/basementGuardian.test.ts` already uses for the same reason.
- **Files modified:** `test/accessories/serviceCatalogue.test.ts`
- **Verification:** `npm run fallow` clean; the assertion still fails when the import is reintroduced.
- **Committed in:** `cffe52e`

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** No scope creep. All three were forced by gates that would otherwise have failed the commit. One file outside `files_modified` was touched (`test/accessories/basementGuardian.test.ts`), recorded above.

## Falsification Results

Every new gate was falsified by patching its defect back in and watching the suite fail. Counts are over the two or three affected test modules run together.

| Defect reintroduced | Result |
|---|---|
| Grant `PAIRED_WRITE` in the read-only perms | 13 of 73 fail |
| Move a characteristic UUID into Apple's base namespace | 1 of 73 fails |
| Move a service UUID into Apple's base namespace | 1 of 73 fails |
| Derive every UUID with `hap.uuid.generate` instead of a literal | 13 of 73 fail |
| Give two characteristics one UUID | 2 of 73 fail |
| Drop `validValues` from the raw water level code | 1 of 73 fails |
| Rename a characteristic after filter maintenance | 4 of 73 fail |
| Share one perms array across every declaration | 1 of 73 fails |
| Declare `PumpFuseBlown` required rather than optional | 3 of 73 fail |
| Drop the `StatusActive` declaration from every custom service | 4 of 73 fail |
| Drop `RawWaterLevelCode` from the pit service | 1 of 73 fails |
| Invert the flood verdict | 7 of 123 fail |
| Default an undecoded water level to zero | 7 of 123 fail |
| Withhold the raw water level code from the pit level row | 7 of 123 fail |
| Collapse the per-value trust rule back to per row | 1 of 123 fails |
| Invert the contact alarm convention | 24 of 123 fail |
| Suppress a backup pump run while a self-test is running | 1 of 123 fails |
| Gate the backup pump adapter on a reported activation time | 11 of 123 fail |
| Drop the fuse from the merged backup fault | 1 of 123 fails |
| Publish the merged backup fault without the fuse fact | 1 of 123 fails |
| Publish the pump rows before the water rows | 5 of 123 fail |
| Read the backup pump boolean on the primary pump row | 1 of 123 fails |
| Invert the low-battery convention | 12 of 159 fail |
| Report a battery that is not charging as not chargeable | 2 of 159 fail |
| Arbitrate the protection band from the health code | 1 of 159 fails |
| Drop the exact battery codes from the facts service | 13 of 159 fail |
| Reduce two fault adapters to one shared condition | 4 of 159 fail |
| Read the controller link flag uninverted | 8 of 159 fail |
| Stop tolerating `controller-link-lost` on the link adapter | 3 of 159 fail |
| Also tolerate `invalid` on the link adapter | 3 of 159 fail |
| Drop the controller data timestamp | 2 of 159 fail |
| Publish the two battery rows under different subtypes | 14 of 159 fail |

**Three defects were caught by the compiler rather than by a test**, which is a gate of its own and is reported as such rather than as test coverage:

- Removing `ControllerDataLastTrustedAt` from the factory fails to satisfy the `CustomCharacteristics` interface.
- Publishing `Sump Pit Level` on the leak sensor instead of its own service fails to typecheck.
- Leaving an unused `hap` parameter on `mainsPowerValues` after the rewrite fails `noUnusedParameters`.

## Issues Encountered

- Two of the deviations above surfaced only from the whole-tree gates rather than from the focused test runs: the clone and complexity thresholds are enforced across every file, so a green focused pair says nothing about whether the commit will land. Running `npm run lint` and `npm run fallow` after each task, rather than only before the commit, is what kept both to a single fix.

## Known Stubs

- **Resolved from 03-04:** `ProjectionInput.controllerDataLastTrustedAt` now has a reader. `Pump Controller Link Lost` publishes it, and its value is asserted end to end through the projection for both the empty-string and the populated case.
- **Fresh-service defaults are still reachable through an artificial family.** A row whose decoded group is absent while its scope is still trusted publishes nothing, so the service sits at its HAP construction defaults -- which are this plugin's good-news values (`LeakDetected 0`, `ContactSensorState 0`, `StatusLowBattery 0`). In production this cannot happen: `geminiFamily.decode()` omits exactly the scopes whose fields failed validation, and the accessory marks those same scopes untrusted from the violations it was given, so group-absent implies scope-untrusted and `StatusActive` goes false. It is reachable only from a hand-built family in a test. Nothing in this plan closes it, and nothing in this plan needs to; it is recorded because the invariant lives in two modules rather than one.
- **`src/platform.ts` still does not pass `ignoredFaults` or `offlineConfirmationPollCount`** to the accessory, so both take their defaults in production. Plan 03-06 owns that wiring; this plan did not touch it.

## Verification Status

- `npm run test:coverage:direct` for all three source-test pairs (`customCharacteristics`, `customServices`, `serviceCatalogue`): 100% line, branch, and function coverage. `basementGuardian.js` still at 100% after its test-module change.
- `npm run test:unit`: 920 tests, all passed.
- `npm run test:cucumber`: 54 scenarios, 444 steps, all passed.
- `npm run check`: exit 0 on three consecutive runs.
- `fallow dupes`: no duplication found, against the zero baseline, with fifteen row literals in the catalogue.

## TDD Gate Compliance

The three tasks carry `tdd="true"`. The commits are per-task `feat(...)` rather than a `test(...)` RED commit followed by `feat(...)`, for the same mechanical reason 03-04 recorded: `.pre-commit-config.yaml` runs `npm lint`, `npm typecheck`, and `npm fallow` with `pass_filenames: false`, so every commit is gated on the whole tree. A commit holding tests that reference characteristics and rows which do not exist yet fails `npm typecheck` outright, and the project forbids `--no-verify`.

**This plan is weaker than 03-04 on the RED half and says so plainly.** In 03-04 each behaviour's test was written and run before its implementation within the session. Here, task 1's source and tests were written together and the source first, so no test was observed failing before its implementation existed. What stands in for it is the falsification table above: every gate was afterwards shown to fail against the defect it exists to catch, which proves the assertion discriminates but does not prove the test was written first. No `test(...)` gate commit exists for any of the three tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The published surface is complete for this phase: fifteen rows, their order pinned, their names pinned, and each one's projection asserted against inline literals.
- Plan 03-06 has the live-state wiring and the `src/platform.ts` configuration pass-through. The catalogue needs nothing from it; the `RES-02` consumer it was to add already exists here.
- The two `unclassified` edge probes the plan flagged (`SAFE-02` and `SAFE-06`) remain open exactly as flagged: the mechanical halves are asserted here, and the delivery-cadence and reads-as-an-estimate halves need 03-06 and the real-home session.
- `.fallowrc.json` still lists `src/accessories/services.ts` under `ignoreFindings`, which plan 03-08 owns. It was not touched.

## Self-Check: PASSED

Every file listed under `key-files` exists on disk, every commit hash listed under Task Commits resolves in `git log`, and all seven changed files are tracked in `HEAD`.

---
*Phase: 03-safety-monitoring-in-homekit*
*Completed: 2026-08-30*
