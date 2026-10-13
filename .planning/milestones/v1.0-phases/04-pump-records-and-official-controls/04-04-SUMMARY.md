---
phase: 04-pump-records-and-official-controls
plan: 04
subsystem: api
tags: [homekit, hap, homebridge, persistence, node-test, cucumber, typescript]

requires:
  - phase: 03-safety-monitoring-in-homekit
    provides: the service catalogue, the projection contract, and the accessory that walks it
  - phase: 04-pump-records-and-official-controls
    provides: the four record characteristics, the persist port, and the records module
provides:
  - "`PumpRecordProjection`, and `primaryPumpRecord` / `backupPumpRecord` on `ProjectionInput`"
  - "both Pump services publishing the observation start, the observed activation count, and the last observed activation, with the self-test label on the backup pump alone"
  - "`decodedGroup`, `booleanOf` and `numberOf` exported, so exactly one structural narrowing of a decoded scope group exists"
  - "`BasementGuardianAccessoryOptions.store`, and one `PumpRecords` instance per accessory driven once per resolved snapshot"
  - "the only `AccessoryStore` implementation, an inline closure at the composition root, built per accessory"
  - "`BasementGuardianAccessoryContext` carrying the three optional record members"
affects: [04-05, 04-06]

actuals:
  tokens: 89201
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "A value the accessory formats reaches a row already formatted, and the row publishes it beside the decoded fact it describes rather than on its own"
    - "An injected options interface is pinned by reading its own source, because the claim is about a member it refuses to declare"
    - "A per-instance closure is proved by driving the second instance rather than the first, so a process-wide one bound to the first fails the case"

key-files:
  created: []
  modified:
    - src/accessories/serviceCatalogue.ts
    - src/accessories/basementGuardian.ts
    - src/platform.ts
    - test/accessories/serviceCatalogue.test.ts
    - test/accessories/basementGuardian.test.ts
    - test/platform.test.ts

key-decisions:
  - "The record publishes beside the pump's own reported running state and never instead of it. `ensureService` adds a service as soon as its row projects anything, and `Pump Running` is the one characteristic `PumpService` requires, so a row that earned its service on the record alone would add one whose required characteristic sat at HAP's `false` default."
  - "`ProjectionInput`'s two record members are optional rather than required. Reading a record before the first observation throws by design, and the unresolved-family branch of `update()` runs before any observation on a fresh install, so the accessory genuinely cannot supply one there."
  - "The per-accessory store case drives the second registered device's pump, not the first. A process-wide store bound to the first accessory survived the case as first written."
  - "The store supply in `platform.ts` landed with task 2 rather than task 3, because `store` became a required option there and nothing would have compiled without it."
  - "The fresh-store criterion is met by an observable claim rather than by comparing two `persist` references, because the store is a closure the composition root never exposes."

patterns-established:
  - "Publish an accessory-formatted value only alongside the decoded fact it describes, so no row earns a service on it alone"
  - "Read an options interface as source text to assert the collaborator it does not take"
  - "Exercise the second instance, never the first, when the claim is that no shared instance exists"

requirements-completed: [CTRL-01]

coverage:
  - id: D1
    description: "Both Pump services publish the observation start, the observed activation count, and the last observed activation; the backup pump additionally publishes whether the last activation was self-test activity, and the primary pump never does."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes the observed activation count the record carries on the primary pump row"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes the observation start and the last activation the record carries on the backup pump row"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes no self-test label on the primary pump row even when the record carries one"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes a self-test label of true on the backup pump row"
        status: pass
    human_judgment: false
  - id: D2
    description: "The record values reach a row through `ProjectionInput` already formatted, so no arithmetic and no date construction happens inside a projection, and the two pump rows are the only rows that publish any record characteristic."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes a pump record on the two pump services and on no other row"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#publishes an observation start at the first snapshot receipt time and an empty last activation"
        status: pass
    human_judgment: false
  - id: D3
    description: "A record with nothing observed publishes the empty string for the last activation, exactly as the controller-data timestamp already does, and never a fabricated time."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes an empty last activation on the primary-pump row rather than nothing at all"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes an empty last activation on the backup-pump row rather than nothing at all"
        status: pass
    human_judgment: false
  - id: D4
    description: "`update()` drives one observation per snapshot from the decoded pump and self-test groups and the snapshot's own receipt time, and drives none at all when the family did not resolve."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#counts one activation for a backup pump it watched start"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#drives no observation and asks for no write when the family has never resolved"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#leaves a published record where it is when the family stops resolving"
        status: pass
    human_judgment: false
  - id: D5
    description: "`update()` still runs to completion synchronously: the pre-existing zero-deferral and synchronous-visibility assertions pass byte-for-byte unchanged, and a new case covers the records path on the same gate."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#calls no global scheduling function across an update that counts an activation"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#calls no global scheduling function across a source change to a published value"
        status: pass
      - kind: unit
        ref: "test/accessories/timerFreedom.test.ts#no module in the accessories tier imports deferred execution from the node standard library (SAFE-07, D-18)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The accessory writes the record to disk only through the injected `AccessoryStore`, and its injected options still carry no Homebridge API handle."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#declares exactly the collaborators the accessory takes by injection"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#declares no injected option typed API and none named api"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#asks for one write for the snapshot that counted an activation and none for an unchanged one"
        status: pass
    human_judgment: false
  - id: D7
    description: "The composition root supplies the only `AccessoryStore` implementation, per accessory, and a record change alone reaches disk even though the record is absent from the change-detection comparison."
    requirement: CTRL-01
    verification:
      - kind: unit
        ref: "test/platform.test.ts#asks Homebridge to store the accessory whose snapshot counted an activation, and no other"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#compares the display name, the vendor name, the device record, and the service list, and nothing else"
        status: pass
    human_judgment: false
  - id: D8
    description: "Structural narrowing of a decoded scope group happens in exactly one module: `decodedGroup` is exported, `trustedGroup` delegates to it, and the accessory reads its observation through it."
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#answers the group a decoded state carries for the scope asked for"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#answers nothing for a group that is not a record"
        status: pass
    human_judgment: false
  - id: D9
    description: "The harness registers accessories through the same function the platform does, so it gets the same store with no separate wiring and no scenario changed."
    verification:
      - kind: e2e
        ref: "npm run test:cucumber"
        status: pass
    human_judgment: false
  - id: D10
    description: "What Apple Home draws for a Pump service that gained four characteristics after it was already published, and whether a restored accessory in a real installation adopts them and shows a count that survives a Homebridge restart."
    requirement: CTRL-01
    verification: []
    human_judgment: true
    rationale: "Nothing here has met a real Homebridge cache or a real Apple Home. The restart claim is exercised only against the accessory stand-in, which records a persist call rather than writing a cache and reading it back."

duration: 68 min
completed: 2026-09-01
status: complete
---

# Phase 4 Plan 04: Wiring the pump record Summary

**Both Pump services now carry the moment this plugin started watching, how many activations it watched, and when the last one was, driven by one record instance per accessory that reaches disk through a narrow port the composition root is the only supplier of.**

## Performance

- **Duration:** 68 min
- **Tasks:** 3
- **Files created:** 0
- **Files modified:** 6

## Accomplishments

- `ProjectionInput` gained `primaryPumpRecord` and `backupPumpRecord`, and both pump rows publish them beside their live pump and fault values. Every value arrives already formatted, so the module's own contract holds: no arithmetic and no date construction reaches a projection.
- **The record rides with the pump's own reported running state, and that is the load-bearing part.** `ensureService` adds a service as soon as its row projects anything, and that gate is sound only while every *required* characteristic of the service class comes from a scope the row still publishes from. `PumpService` requires `Pump Running`. A record published unconditionally would therefore have added a `Pump Service` on a snapshot whose pump group never decoded, with `Pump Running` sitting at HAP's `false` default — a pump reported as not running that no device ever reported. The plan did not ask for the gate; the seven pre-existing `projects nothing on any decoded-state row` cases fail without it.
- `decodedGroup`, `booleanOf` and `numberOf` are exported. `trustedGroup` applies its trust check and then delegates, and the accessory builds its observation through the same three, so exactly one structural narrowing of a decoded scope group exists rather than two that can disagree about one payload.
- The accessory holds one `PumpRecords` instance for as long as it lives and drives exactly one observation per resolved snapshot, before the rows publish. The unresolved-family branch drives none: a family that no longer resolves cannot say whether a pump ran, so advancing a count from it would be a guess and blanking the record would discard evidence.
- `projectionInputOf` turns the stored milliseconds into the strings a row publishes with the accessory's existing `isoTimestamp`, exactly as `controllerDataLastTrustedAt` already was. The accessory stays the one place a stored millisecond value becomes a published string.
- The composition root supplies the only `AccessoryStore` implementation, as an inline closure per accessory. It is a second, independent caller of the same idempotent API `updateDiscoveredDevice` already calls, which is what makes a record change reach disk at all: the change comparison covers the display name, the vendor name, the device record, and the service list, and none of those move when a pump runs.
- `BasementGuardianAccessoryContext` gained the three record members, each optional and each typed by indexing `AccessoryContext`, so one declaration stays the source of what is stored.

## Defect reintroduction — what was watched to fail

A green suite is not evidence. Each safety-bearing claim was proven by putting the defect back, watching the named case fail, restoring, and re-running.

| Claim | Defect reintroduced | Cases that failed |
|---|---|---|
| The record rides with the pump's **own reported running state** | the `facts.running === undefined` gate removed from `recordCandidates` | 8: `publishes no record at all on a pump row whose reported running state did not decode`, and all seven `projects nothing on any decoded-state row from …` |
| The primary pump carries **no** self-test label | `publishesTestActivity: true` on `primaryPumpValues` | `publishes no self-test label on the primary pump row even when the record carries one` |
| The last activation publishes, **empty string included** | the `LastObservedActivationAt` candidate deleted | 3, incl. `publishes an empty last activation on the primary-pump row rather than nothing at all` |
| `decodedGroup` narrows **the group**, not only the state | the inner `isRecord(group)` replaced with an assertion | `answers nothing for a group that is not a record` |
| An unresolved family drives **no** observation | `records.observe(...)` added to the unresolved branch | `drives no observation and asks for no write when the family has never resolved` |
| An undecoded running value **neither counts nor clears** | `booleanOf(pump, 'backupRunning') ?? false` | `counts no second activation when the pump scope recovers still reporting the same run` |
| The accessory **formats** the stored milliseconds | `String(record.observationStartedAt)` in place of `isoTimestamp` | 3, incl. `publishes an observation start at the first snapshot receipt time and an empty last activation` |
| A record with nothing observed publishes the **empty string** | `'never'` in place of `isoTimestamp(undefined)` for the last activation | 2 |
| The record instance is **created once per accessory** | a fresh `createPumpRecords` per `update()` | 6, incl. `continues one record across updates rather than reseeding the observation start` |
| The store **actually asks** Homebridge to store the accessory | `persist: () => undefined` | 4, incl. `asks Homebridge to store the accessory whose snapshot counted an activation, and no other` |
| The record is **absent** from the change comparison | `primaryPump` added to both state objects | `compares the display name, the vendor name, the device record, and the service list, and nothing else` |
| The store is **per accessory**, never process-wide | a module-level store closed over the first accessory registered | *survived the first run* — see below |

**One mutation found a real hole rather than confirming one.** A process-wide store bound to the first accessory the process ever built passed the case `asks Homebridge to store the accessory whose snapshot counted an activation, and no other` exactly as written. The case registered two devices and then ran the **first** device's pump, so a store that always named the first accessory named the right one by coincidence. In a real fleet this defect writes one basement's counted activation onto another basement's cached accessory, and every count but the first device's is silently lost. The case now runs the **second** device's pump, and the same mutation fails it.

That is the fourth time on this phase that a positive has passed for the wrong reason. The pattern in all four is the same: the fixture happened to sit at the value the defect produces.

## Files Modified

- `src/accessories/serviceCatalogue.ts` — `PumpRecordProjection`; the two record members on `ProjectionInput`; `record` and `publishesTestActivity` on `PumpFacts`; `recordCandidates`; the exported `decodedGroup`, `booleanOf` and `numberOf`, with `trustedGroup` delegating
- `src/accessories/basementGuardian.ts` — `store` on the options; the per-accessory `createPumpRecords` instance; `observationOf`; `recordProjectionOf`; the one `observe` call in the resolved branch; the record members on `projectionInputOf`
- `src/platform.ts` — the three optional record members on `BasementGuardianAccessoryContext`; the only `AccessoryStore` implementation, built per accessory at `createBasementGuardianAccessoryFor`
- `test/accessories/serviceCatalogue.test.ts` — the locally-declared record shape and the widened `projectionInput`; twelve record cases; the `decodedGroup`, `booleanOf` and `numberOf` describes
- `test/accessories/basementGuardian.test.ts` — the recording store; `geminiUpdates`; `pumpRecordOf`; `declaredOptions`; ten record cases, including the new zero-deferral case over a counted activation
- `test/platform.test.ts` — the stored-context type checks and their two negatives; the per-accessory store case; the change-comparison key case; `POWER_FAMILY`'s pump group following `backup_pump_running`

## Task Commits

1. **Task 1: the record values on both pump rows, and one exported structural narrowing**
   - `2fb2283` `test(04): require a pump record on both pump services` — RED, 7 failing cases
   - `7651336` `feat(04): publish the pump record on both pump services` — GREEN
2. **Task 2: the accessory drives one observation per snapshot and formats the record once**
   - `b23b309` `test(04): require the accessory to drive the pump record` — RED, 6 failing cases
   - `eef637b` `feat(04): drive one pump observation per snapshot` — GREEN
3. **Task 3: the composition root widens the stored context type**
   - `e46e3b0` `test(04): require the stored context to type the pump record` — RED, 2 failing type negatives
   - `dbeacc9` `feat(04): widen the stored context with the pump record` — GREEN

Every commit was verified non-empty with `git show --name-only --format="" HEAD`. Each was made with a plain `git commit` after `pre-commit run --files <changed files>` came back clean; the GSD commit handler was not used, per the tooling hazard recorded in STATE.md.

**The RED commits.** All three compile, which is what let them be committed at all — `npm typecheck` is a pre-commit hook. Task 1's works because the test declares the record shape itself and extends `ProjectionInput` with it, rather than importing a type that does not exist yet; that same declaration stays after GREEN, so the test table pins the shape instead of following the interface. Task 2's works because the cases read published characteristic values, and all four record characteristics already existed. Task 3's works because `UnknownContext` is `Record<string, any>`: two `@ts-expect-error` negatives over wrongly-typed record members are unused directives until the widening lands, which is a compile failure of exactly the right kind.

## Decisions Made

**The record publishes only beside the pump's own reported running state.** The plan asks for the record values to pass through `published()` "like every other candidate" and says nothing about a gate. Without one, a snapshot whose `pump` group did not decode leaves the two pump rows projecting three record values each, which earns them a `PumpService` whose required `Pump Running` HAP constructs at `false`. That is the exact false-normal class `ensureService`'s own docblock exists to prevent, and the pattern already existed one function away: `ControllerDataLastTrustedAt` publishes only when `linkPresent` decoded, "so a row that cannot vouch for the link never publishes a time that would read as evidence about it". The cost is that a record is withheld on any snapshot whose pump group fails to decode; HAP keeps serving the last pushed record, so nothing is lost.

**`ProjectionInput`'s record members are optional.** The plan's interface sketch declares both required. That cannot hold: `PumpRecords.primary` throws before the first observation by design (04-03), and `update()`'s unresolved-family branch calls `projectionInputOf` before any observation has happened on a fresh install. A required member would have forced the accessory to invent a record there or to crash. Optional is also what the style guide asks for over `| undefined`, and it carries the right meaning — absent is "nothing observed yet", which publishes nothing rather than a count of zero counted from 1970.

**The per-accessory store case drives the second device.** Written the obvious way it proved nothing; see the mutation table. The criterion asked for a reference-inequality assertion between two `persist` functions, which is not reachable — the store is a closure the composition root never exposes. Naming the accessory that was actually stored is both reachable and stronger: it fails for a shared store *and* for a store that named the wrong accessory for any other reason.

**The store supply landed with task 2.** `store` became a required member of `BasementGuardianAccessoryOptions` in task 2, so `src/platform.ts` could not compile without supplying one. Task 3 kept the context widening, its type checks, and the two platform cases.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] A record published unconditionally would earn a Pump service at HAP's defaults**

- **Found during:** Task 1
- **Issue:** `ensureService` adds a service as soon as its row projects anything. With the record published unconditionally, a snapshot whose `pump` group did not decode would add a `PumpService` and leave its required `Pump Running` at HAP's `false` default.
- **Fix:** `recordCandidates` withholds the whole record while `facts.running` is absent, on the pattern `ControllerDataLastTrustedAt` already set.
- **Files modified:** `src/accessories/serviceCatalogue.ts`, `test/accessories/serviceCatalogue.test.ts`
- **Verification:** Removing the gate fails `publishes no record at all on a pump row whose reported running state did not decode` and all seven pre-existing `projects nothing on any decoded-state row from …` cases.
- **Committed in:** `7651336`

**2. [Rule 3 - Blocking] The record members cannot be required on `ProjectionInput`**

- **Found during:** Task 1
- **Issue:** The accessory's unresolved-family branch builds a projection input before any observation exists, and reading a record then throws.
- **Fix:** Both members are optional; an absent record publishes nothing at all.
- **Files modified:** `src/accessories/serviceCatalogue.ts`, `test/accessories/serviceCatalogue.test.ts`
- **Verification:** `publishes no record on either pump row before the accessory has observed anything`
- **Committed in:** `7651336`

**3. [Rule 3 - Blocking] Task 3's store supply had to land with task 2**

- **Found during:** Task 2
- **Issue:** Adding `store` as a required option broke `src/platform.ts`, and `npm typecheck` is a pre-commit hook.
- **Fix:** The full store implementation and its comment landed in `eef637b`; task 3 kept the context widening and the platform cases.
- **Files modified:** `src/platform.ts`
- **Verification:** `npm run check` green at `eef637b`.
- **Committed in:** `eef637b`

**4. [Rule 1 - Bug] Two strict-mock platform cases refused the record's first write**

- **Found during:** Task 2
- **Issue:** `registers a newly discovered device once the launch event succeeds` and `unregisters a confirmed-absent accessory …` hand the platform a `strong-mock` `API` with no `updatePlatformAccessories` expectation. The record seeded from the first snapshot now asks for one, so the mock threw and both cases hung for five seconds and failed.
- **Fix:** Each gained an `updatePlatformAccessories` expectation. The registration case captures the argument and asserts it names the registered accessory.
- **Files modified:** `test/platform.test.ts`
- **Verification:** Both pass; `persist: () => undefined` fails them.
- **Committed in:** `eef637b`

**5. [Rule 1 - Bug] The suppression case's call count was one short**

- **Found during:** Task 2
- **Issue:** `calls updatePlatformAccessories once a suppression changes the published service set` expected one call on the first poll. There are now two: the record's seed and the changed service set.
- **Fix:** The expectation reads `2` and `2`. The claim the case exists for is unchanged — the second poll adds none.
- **Files modified:** `test/platform.test.ts`
- **Verification:** The case still fails if the second poll persists.
- **Committed in:** `eef637b`

**6. [Rule 2 - Missing Critical] The per-accessory store case did not discriminate**

- **Found during:** Task 3, mutation checking
- **Issue:** A module-level store bound to the first accessory registered passed the case, because the case ran the first device's pump.
- **Fix:** The case runs the second device's pump and expects that accessory's UUID.
- **Files modified:** `test/platform.test.ts`
- **Verification:** The same mutation now fails `asks Homebridge to store the accessory whose snapshot counted an activation, and no other`.
- **Committed in:** `dbeacc9`

**7. [Rule 3 - Blocking] `POWER_FAMILY` could not report a pump running**

- **Found during:** Task 3
- **Issue:** The platform suite's family hard-coded `backupRunning: false`, so no discovery case could drive an activation the accessory watched.
- **Fix:** Its pump group follows `snapshot.data.backup_pump_running`. No existing fixture supplies that field, so every other case reads the `false` it read before.
- **Files modified:** `test/platform.test.ts`
- **Verification:** `npm run check` green; the platform pair still at 100/100/100.
- **Committed in:** `dbeacc9`

**8. [Rule 3 - Blocking] A static source path failed the dead-code gate**

- **Found during:** Task 3
- **Issue:** Reading `src/platform.ts` as text through `new URL('../../src/platform.ts', …)` is an unresolved import to `fallow dead-code`, which fails `npm run fallow`.
- **Fix:** The module name is a parameter and the path is interpolated, which is the idiom the accessory suites already use for the same reason.
- **Files modified:** `test/platform.test.ts`
- **Verification:** `npm run fallow` exits 0.
- **Committed in:** `e46e3b0`

**9. [Rule 1 - Bug] The fresh-store acceptance criterion is not reachable as written**

- **Found during:** Task 3
- **Issue:** The criterion asks a test to assert that two `persist` functions are not the same reference. `createBasementGuardianAccessoryFor` is not exported and the store it builds is never handed back.
- **Fix:** The equivalent observable claim is asserted instead: only the accessory that observed the activation is named in the call. It fails for a shared store and for a store that named the wrong accessory for any other reason.
- **Files modified:** `test/platform.test.ts`
- **Verification:** The process-wide-store mutation fails it.
- **Committed in:** `dbeacc9`

---

**Total deviations:** 9 auto-fixed (3 bugs, 2 missing critical, 4 blocking). **Impact:** each was needed for a claim of this plan to hold, for the build to compile, or for a repository gate to pass. No scope creep: nothing here touches the controls, the README, or `CHANGELOG.md`.

## The harness needed no separate wiring — confirmed by reading

`features/support/world.ts:566-584` builds a `DiscoveryContext` from the same nine members the platform builds one from and hands it to `registerDiscoveredDevices` at lines 529 and 538. Every accessory in a scenario therefore reaches `createBasementGuardianAccessoryFor`, which is the one place the store is supplied, so the harness gets the same store the plugin does with nothing declared for it. `git diff --name-only a0f0361..HEAD` lists no file under `features/`, and the 65 scenarios and 583 steps pass unchanged.

## Issues Encountered

**The record seeds on the very first poll, so every accessory now asks Homebridge to store it once more than before.** The observation start must survive a restart, and it cannot until Homebridge is told the context changed, so the seed earns a write. On a fleet this is one extra cache write per device on the first poll of each run and none afterwards while the basement is dry. Two platform cases had to be told to expect it; both are documented above.

**The label is still up to two poll intervals stale during a live run.** Recorded in 04-03's summary and unchanged here — wiring the record to HomeKit does not narrow that window. On the default fifteen-minute poll the `Last Activation Was Self-Test` characteristic can describe the previous run for up to half an hour after a new one is counted. It decorates a record and never touches a live sensor.

**Nothing here has met a real Homebridge cache.** The restart claim is exercised against the accessory stand-in, which records a persist call rather than writing a cache and reading it back. Whether a restored accessory adopts four characteristics it was published without, and whether the count actually comes back, is the one thing on this plan that needs a real installation. It is carried as `D10` with `human_judgment: true`.

**`CHANGELOG.md` was not touched.** `CLAUDE.md` asks for that before a PR rather than per plan, as `04-01` through `04-03` also did.

## Gates

At `dbeacc9`:

- `npm run check` green — 1203 unit tests, 65 Cucumber scenarios, 583 steps.
- `npm run test:coverage:all` at 100/100/100 over every module under `src/`.
- The three focused pairs named in the plan's verify blocks each at 100/100/100: `serviceCatalogue` (166 cases), `basementGuardian` (121 cases), `platform` (42 cases).
- `node --test dist-test/test/accessories/timerFreedom.test.js` — 3 pass, 0 fail.
- `npm run fallow` exits 0, with no dead-code and no health finding, and only the pre-existing `features/support/steps/hap.ts` clone group, which this plan did not touch.
- The three pre-existing `update()` immediacy cases pass with their assertion expressions byte-for-byte unchanged. The only line removed from `test/accessories/basementGuardian.test.ts` across this plan is the module-scope characteristic destructure, which was widened.

## Self-Check: PASSED

- `src/accessories/serviceCatalogue.ts`, `src/accessories/basementGuardian.ts`, `src/platform.ts`, `test/accessories/serviceCatalogue.test.ts`, `test/accessories/basementGuardian.test.ts`, `test/platform.test.ts` — all present on disk and all carrying this plan's changes.
- Commits `2fb2283`, `7651336`, `b23b309`, `eef637b`, `e46e3b0`, `dbeacc9` — all present in `git log`, all non-empty.
- `features/support/world.ts` unmodified. `STATE.md` and `ROADMAP.md` were not written.
