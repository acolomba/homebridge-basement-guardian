---
phase: 01-secure-cloud-foundation
plan: 03
subsystem: device-state
tags: [state-store, shadow-merge, version-watermark, change-notification, type-only-contracts, dead-code-gate, tdd]

requires:
  - "01-01: the second TypeScript project, typed lint over test/**, and the npm run check gate"
  - "01-02: createDeviceStateStore, the write-once snapshot store this plan turns into a reducer"
provides:
  - "`applyReportedPatch`, the key-by-key merge that keeps every field a heartbeat omits"
  - "`ReportedPatch`, a shape with no member able to carry requested control state"
  - "A per-device shadow version watermark that discards out-of-order and replayed patches"
  - "`subscribe` and `DeviceSnapshotListener`, notifying with (next, previous, changedKeys)"
  - "`metadata` and `shadowVersion` on `DeviceSnapshot`, both frozen and kept apart from telemetry"
  - "Eight declaration-only contract modules covering occurrences, health, families, accessories, and persistence"
  - "`.fallowrc.json` `ignoreFindings`, seeded with the eight scaffold paths in the declared order"
affects: [01-07, 01-09, 01-10, 01-11, accessory-adapters, family-adapters, event-derivation]

actuals:
  tokens: 16100
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Reported patches merge key by key; a REST response replaces telemetry and preserves shadow-only fields"
    - "A version watermark guards ordering, so the reducer needs no delivery guarantee from its transport"
    - "Absent values are explicit `T | undefined` members, never optional properties, under exactOptionalPropertyTypes"
    - "A shape that cannot hold a dangerous value is the control; no convention polices it"
    - "Listener invocation is isolated per listener, and the failure report carries no listener detail"
    - "Not-yet-wired modules are declaration-only, so they carry no coverage obligation and no unearned behavior"

key-files:
  created:
    - src/device/events.ts
    - src/device/health.ts
    - src/device/family.ts
    - src/device/gemini.ts
    - src/device/halo.ts
    - src/accessories/basementGuardian.ts
    - src/accessories/services.ts
    - src/persistence/accessoryContext.ts
    - test/device/events.test.ts
    - test/device/health.test.ts
    - test/device/family.test.ts
    - test/device/gemini.test.ts
    - test/device/halo.test.ts
    - test/accessories/basementGuardian.test.ts
    - test/accessories/services.test.ts
    - test/persistence/accessoryContext.test.ts
  modified:
    - src/device/state.ts
    - test/device/state.test.ts
    - .fallowrc.json
    - src/platform.ts
    - test/runtime/accountRuntime.test.ts

key-decisions:
  - "A REST poll preserves shadow-only metadata and the version watermark instead of blanking both every poll interval"
  - "The store takes a logger by injection, which changed two call sites the plan did not list"
  - "`ReportedPatch` proves its refusal of requested state at compile time, because no runtime path can reach a member the type does not declare"
  - "An identical patch still advances the receipt time but notifies nobody, so liveness and change stay separate facts"
  - "The eight `ignoreFindings` entries currently suppress no finding and are kept anyway, because later plans assert the list by strict equality"
  - "`src/accessories/services.ts` declares union types only; the `as const` constant object arrives with the accessory adapters, because a scaffold with a top-level assignment is not declaration-only"

patterns-established:
  - "Data-driven version-watermark rows, one sibling test() per row for lower, equal, and higher"
  - "A notification recorder that consumes all three listener parameters, so a case compares whole notifications rather than counting calls"
  - "A raising listener whose own error message carries a device identifier and a value, which proves the failure log repeats neither"
  - "Type-only test modules using `satisfies` positives and `@ts-expect-error` negatives, each with a stated reason"
  - "Destructuring a valid literal to build a missing-member negative, which keeps the directive on the line the error is reported"

requirements-completed: [SYNC-02]

coverage:
  - id: D1
    description: "A partial shadow patch merges into the cached snapshot and removes no field the patch omits"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#merges a partial heartbeat and leaves every value it omits where the device last set it"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#leaves every stored value in place for a patch that reports neither section"
        status: pass
    human_judgment: false
  - id: D2
    description: "A shadow desired value never becomes reported device state, and a desired value of null is not recorded as a sensor value"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#carries no member able to hold a requested control value"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#carries no member able to hold an acknowledged control value"
        status: pass
    human_judgment: false
  - id: D3
    description: "A patch whose shadow version is not greater than the version already applied is discarded, so out-of-order delivery cannot overwrite newer state"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#leaves water level at 1 and the applied version at 5 for a patch at version 4"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#leaves water level at 1 and the applied version at 5 for a patch at version 5"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#leaves water level at 31 and the applied version at 6 for a patch at version 6"
        status: pass
    human_judgment: false
  - id: D4
    description: "Local receipt time stays separate from device timestamps in every snapshot"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#builds a snapshot that keeps device time apart from local receipt time"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#leaves every stored value in place for a patch that reports neither section"
        status: pass
    human_judgment: false
  - id: D5
    description: "subscribe notifies with (next, previous, changedKeys) from a shallow comparison of merged telemetry, and a repeated identical patch produces no notification"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#reports the merged snapshot, the snapshot it replaced, and the one key that changed"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#reports every changed key in a stable order"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#notifies no listener for a heartbeat that repeats the stored values"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#stops notifying a listener that unsubscribes"
        status: pass
    human_judgment: false
  - id: D6
    description: "One listener that raises neither stops the remaining listeners nor propagates out of the reducer, and the failure report carries no listener detail"
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#runs the remaining listeners and reports a fixed message when one listener raises"
        status: pass
    human_judgment: false
  - id: D7
    description: "The snapshot carries reported telemetry and device metadata as separate opaque records with no field decoding, and both are frozen"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#merges a reported state section into metadata and leaves telemetry untouched"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#returns a merged snapshot no consumer can modify"
        status: pass
    human_judgment: false
  - id: D8
    description: "Every module of the adopted source tree exists, and each not-yet-wired module is a declaration with no runtime body"
    verification:
      - kind: other
        ref: "grep -cE '^(function|class|const|let|var|export (const|function|class))' over all eight emitted dist-test/src scaffolds returns 0 for each"
        status: pass
      - kind: unit
        ref: "test/device/events.test.ts, test/device/health.test.ts, test/device/family.test.ts, test/device/gemini.test.ts, test/device/halo.test.ts, test/accessories/basementGuardian.test.ts, test/accessories/services.test.ts, test/persistence/accessoryContext.test.ts"
        status: pass
    human_judgment: false
  - id: D9
    description: "ignoreFindings leads with the eight scaffold paths in the declared order, holds no duplicate, and holds no entry outside the eight plus the five named transitional paths"
    verification:
      - kind: other
        ref: "the plan's node -e ignoreFindings assertion (exit 0)"
        status: pass
    human_judgment: false
  - id: D10
    description: "The state store pair reports 100 percent lines, branches, and functions when run alone, and every quality gate passes on the scaffolded tree"
    verification:
      - kind: other
        ref: "npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js (100/100/100)"
        status: pass
      - kind: other
        ref: "npm run check (exit 0)"
        status: pass
    human_judgment: false
  - id: D11
    description: "A real Gemini shadow document merges through this reducer with the field names, section split, and version behavior the vendor actually sends"
    verification: []
    human_judgment: true
    rationale: "Every case drives the reducer with hand-built patches. The section split, the seven heartbeat fields, and the version watermark come from captured vendor traffic and from the v1 SDK's own guard, but no shadow message from a live account has passed through this code. Only a human with real hardware can confirm that."

duration: 30min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 03: Canonical Merge Reducer Summary

**The write-once snapshot store becomes a merge reducer with a version watermark and a per-device subscription contract, and the remaining eight modules of the source tree land as declaration-only contracts.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-08-28T23:04:00Z
- **Completed:** 2026-08-28T23:33:46Z
- **Tasks:** 3
- **Files created or modified:** 21

## Accomplishments

- A heartbeat now merges instead of replacing. The vendor sends seven of roughly twenty fields every fifteen minutes, so a wholesale assignment would blank pump, power, charging, test, and fault values on a cadence. The merge runs key by key, and a case proves that a patch carrying only a water level leaves the pump and mains-power values where the device last set them.
- Requested control state cannot enter canonical safety state, and no convention is asked to prevent it. `ReportedPatch` declares reported telemetry, reported metadata, and a version, and nothing else. Two `@ts-expect-error` negatives prove the compiler refuses a `desired` section and a `desired` entry of `null`, so the failure would be a build failure rather than a wrong reading.
- Out-of-order shadow delivery cannot overwrite newer state. A per-device version watermark discards any patch that does not move the version forward, proven by data-driven rows for a lower, an equal, and a higher version. An unversioned patch still applies and leaves the watermark alone.
- Subscribers receive the next snapshot, the one it replaced, and the exact set of telemetry keys that moved, sorted so the array can be compared directly. A patch that changes nothing notifies nobody, which is what keeps a repeated heartbeat silent and stops duplicate activation records downstream.
- A listener that raises cannot take the plugin down. Each listener runs in isolation, the rest still run, and the reducer still returns. The failure report is one fixed message: the case gives the raising listener an error whose own text carries a device identifier and a telemetry value, then asserts the complete recorded log to prove neither reached it.
- The full source tree now exists. Eight modules covering occurrences, health, the family adapter, both device families, the accessory, its services, and the persisted context are declarations only. Each emits `export {}` and nothing else, which is confirmed against the emitted JavaScript rather than assumed.
- Every gate is green on the scaffolded tree. `npm run check` exits 0 across type check, lint, all three `fallow` sub-commands, the format check, 116 unit tests, and 10 Cucumber scenarios over 61 steps. The state store pair reports 100 percent lines, branches, and functions run alone.

## Task Commits

1. **Task 1: merge partial reported patches without losing omitted fields** - `80c5828`
2. **Task 2: publish the change-notification contract** - `550cab0`
3. **Task 3: scaffold the remaining source tree and resolve the dead-code gate** - `a406030`

## Files Created/Modified

- `src/device/state.ts` - The merge reducer, the version watermark, freezing, and the subscription contract
- `test/device/state.test.ts` - 29 cases across `applyDiscovery`, `applyReportedPatch`, `subscribe`, `snapshot`, and `deviceIds`
- `.fallowrc.json` - Gains `ignoreFindings` with the eight scaffold paths, alongside the existing keys
- `src/device/events.ts` - Discriminated union of derived occurrences, each naming its device and its local observation time
- `src/device/health.ts` - Monitoring path and per-scope trust, so no scope is marked untrustworthy more widely than the evidence supports
- `src/device/family.ts` - Family adapter contract: identity, support flag, validation, decoding, capabilities, and command bodies
- `src/device/gemini.ts` - Gemini identity plus telemetry and metadata field names; no legal-value set and no threshold
- `src/device/halo.ts` - HALO identity alone, with the reason nothing else is declared
- `src/accessories/basementGuardian.ts` - Accessory contract: immutable identity, published services, and the single update entry point
- `src/accessories/services.ts` - The truthful services and the removable notification sensors, and how each is keyed
- `src/persistence/accessoryContext.ts` - Pump observation records and de-duplication watermarks; no credential, no snapshot, no timer
- Eight mirrored type-only test modules, each with `satisfies` positives and `@ts-expect-error` negatives
- `src/platform.ts` - One line: the store now receives the logger
- `test/runtime/accountRuntime.test.ts` - Snapshot assertion gains the two new members; three store constructions receive the logger

## Decisions Made

- **A REST poll preserves shadow-only metadata and the version watermark.** The plan enumerates what a shadow patch does to a snapshot but not what a later REST discovery does to shadow-supplied fields. Leaving the original behavior in place would have blanked `metadata` and reset `shadowVersion` to `undefined` on every poll. That is the same wholesale-replacement failure this plan exists to prevent, one level up: firmware metadata would disappear on the poll interval, and a stale shadow message arriving just after a poll would be accepted because the watermark had been cleared. A REST response is a full telemetry snapshot, so `data` is still replaced; `metadata` and `shadowVersion` now survive, because a poll is not evidence that either changed.

- **The store takes a logger by injection.** Isolating listener failures requires somewhere to report them. This added a required `log` member to `DeviceStateStoreOptions`, which changed the two call sites that build a store: `src/platform.ts`, where `log` was already in scope, and `test/runtime/accountRuntime.test.ts`. Neither file is in the plan's declared list.

- **An identical patch advances the receipt time and notifies nobody.** These are two different facts. The device reporting the same values is evidence of liveness, so `receivedAt` moves; nothing changed, so no subscriber hears about it. Collapsing them either loses the liveness signal or produces the duplicate notifications `D-19` exists to prevent.

- **`ReportedPatch` is enforced by the compiler, not by a runtime check.** There is no runtime case proving a `desired` section is ignored, because there is no runtime path that could carry one: the reducer reads `patch.data` and `patch.state`, and the type declares no third member. The negatives are `@ts-expect-error` checks, so a future member able to hold requested state fails the build.

- **`src/accessories/services.ts` declares union types only.** The plan calls for an `as const` object plus a derived union where stable string constants are needed. An `as const` object is a top-level assignment, which the same task forbids in a declaration-only module. The union types land now and the constant object arrives with the accessory adapters, which is when a caller first needs the strings.

- **The eight `ignoreFindings` entries currently suppress nothing, and all eight stay.** See "Issues Encountered" for the measurement. The plan is explicit that later plans assert this list by strict equality, so a helpful cleanup would fail the phase seal.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] A REST poll would have blanked shadow metadata and reset the version watermark**

- **Found during:** Task 1
- **Issue:** `applyDiscovery` built each snapshot from the vendor record alone. Once `metadata` and `shadowVersion` existed, that meant every poll cleared the firmware metadata the shadow had supplied and reset the watermark to `undefined`, which would let a stale shadow message be accepted immediately after a poll. Both outcomes are the failure modes `SYNC-02` and the ordering guard exist to prevent.
- **Fix:** `applyDiscovery` now carries `metadata` and `shadowVersion` forward from the previous snapshot. Telemetry is still replaced, because a REST response is a full snapshot; the shadow-only fields survive, because the response says nothing about them.
- **Files modified:** `src/device/state.ts`, `test/device/state.test.ts`
- **Verification:** A case discovers a device, applies a metadata patch at version 6, then re-discovers, and asserts the whole snapshot still carries the metadata and the version.
- **Committed in:** `80c5828`

**2. [Rule 3 - Blocking] Isolating listener failures needed a logger the store did not have**

- **Found during:** Task 2
- **Issue:** The task requires a raising listener to be reported at debug with a fixed message. `DeviceStateStoreOptions` carried only a clock, so there was nowhere to report to.
- **Fix:** Added `log: Logging` to `DeviceStateStoreOptions` and updated the two call sites outside the module. `src/platform.ts` already had `log` in scope, so its change is one line.
- **Files modified:** `src/device/state.ts`, `src/platform.ts`, `test/runtime/accountRuntime.test.ts`
- **Verification:** `npm run check` exits 0; the raising-listener case asserts the complete recorded log.
- **Committed in:** `550cab0`

**3. [Rule 3 - Blocking] The end-to-end runtime case asserted the old snapshot shape**

- **Found during:** Task 1
- **Issue:** `test/runtime/accountRuntime.test.ts` compares a whole stored snapshot with `deepStrictEqual`. Adding `metadata` and `shadowVersion` made that comparison fail, which is the assertion working as intended.
- **Fix:** Added both members to the expected literal. The case still discriminates: device time and receipt time remain two different values.
- **Files modified:** `test/runtime/accountRuntime.test.ts`
- **Verification:** The full unit suite passes.
- **Committed in:** `80c5828`

**4. [Rule 3 - Blocking] `@ts-expect-error` directives landed on the wrong lines**

- **Found during:** Task 3
- **Issue:** For a multi-line object literal, a missing required member is reported on the closing `satisfies` line and an unexpected member on its own property line, not on the opening `void (`. Four directives were therefore reported as unused, which is itself a compile error.
- **Fix:** Missing-member negatives now destructure a valid literal and check the remainder, which keeps the directive next to the line that fails and states the intent in one place. Excess-member negatives spread a valid literal and add the offending member on a single line.
- **Files modified:** `test/device/family.test.ts`, `test/persistence/accessoryContext.test.ts`, `test/accessories/basementGuardian.test.ts`
- **Verification:** `npm run build:test` compiles with every negative firing; no directive is reported unused.
- **Committed in:** `a406030`

**5. [Rule 3 - Blocking] Two lint rules rejected the scaffolds**

- **Found during:** Task 3
- **Issue:** `import-x/order` requires the sibling type import before the parent one in `src/accessories/basementGuardian.ts`. Separately, a negative case stringified a `Record` to force a type error, which `no-base-to-string` refuses; rewriting it with a block body then failed `brace-style` at 160 columns.
- **Fix:** Reordered the two type imports. Replaced the stringifying negative with one that proves a published service is a keyed descriptor rather than a bare name, which needs no function body and makes the same point about the contract.
- **Files modified:** `src/accessories/basementGuardian.ts`, `test/accessories/basementGuardian.test.ts`
- **Verification:** `npm run lint` exits 0 at zero warnings.
- **Committed in:** `a406030`

---

**Total deviations:** 5 auto-fixed (4 blocking, 1 missing critical)
**Impact on plan:** One deviation added behavior the plan did not enumerate, and it closes a hole the plan's own safety truth forbids leaving open. The other four were needed to satisfy a gate. No acceptance criterion was weakened. Two files outside the declared list were touched, both as a direct consequence of the injected logger and the extended snapshot shape.

## TDD Gate Compliance

Each task produced one `feat:` commit rather than a `test:` then `feat:` pair, following the precedent recorded in the prior plan and for the same reason: a test module that references a symbol the source does not yet export cannot be committed. `npm run build:test` fails to compile it, and typed lint turns the resulting error-typed values into errors at zero warnings. The lint hook runs over the whole repository on any `test/**` commit, and `CLAUDE.md` forbids `--no-verify`.

The RED step was therefore observed in the working tree, before any implementation:

- **Task 1.** `npm run build:test` reported `TS2305: Module '"../../src/device/state.js"' has no exported member 'ReportedPatch'`, `TS2339: Property 'applyReportedPatch' does not exist on type 'DeviceStateStore'` at fourteen call sites, and `TS2339: Property 'metadata' does not exist on type 'DeviceSnapshot'`.
- **Task 2.** The same command reported `TS2305` for `DeviceSnapshotListener`, `TS2353: 'log' does not exist in type 'DeviceStateStoreOptions'`, and `TS2339: Property 'subscribe' does not exist on type 'DeviceStateStore'` at nine call sites.
- **Task 3.** The eight mirrored test modules were written against the eight scaffolds, and the first build reported the directive-placement failures recorded above rather than passing silently.

In each task the tests were written first and the implementation was written to them. The GREEN gate is present for all three. No REFACTOR commit was needed.

## Issues Encountered

- **The eight `ignoreFindings` entries currently match no finding.** The plan anticipates this for several of them and forbids deleting an entry because of it. The measurement: running `fallow dead-code` against a copy of the configuration with `ignoreFindings` removed still reports `No issues found`. Two things account for it. `fallow` auto-detects 53 entry points here, not the single manual one, and it counts a mirrored `test/**/*.test.ts` as a genuine consumer, so each scaffold's own test keeps its exports alive. The list is therefore currently inert and is kept in full, in the declared order, exactly as the plan requires. `fallow` printed no `ignoreFindings pattern matched no finding this run` note in either run, so that note is not available as a signal here.
- **The eight scaffolds do not appear in the coverage report at all.** They emit `export {}` and their tests import types only, which are erased, so the modules are never loaded. `npm run test:coverage:all` reports 100 percent across every file it does see and exits 0. This is the outcome the plan predicts for a declaration-only module: nothing to cover, and no runtime code added to satisfy a tool.
- **`node_modules` is absent from the worktree.** Resolution falls through to the parent repository, so every script runs. `fallow` prints its `node_modules directory not found` warning and then passes, matching what the two prior plans recorded.
- **The `trufflehog` pre-commit hook cannot run in a worktree.** It is a git-mode scan and `.git` is a file here. `CLAUDE.md` documents this and prescribes a filesystem scan over the paths being committed. That scan ran before each of the three commits and reported `verified_secrets: 0, unverified_secrets: 0` every time. Each commit then used `SKIP=trufflehog` and no other skip.

## Known Stubs

None in the behavioral sense. The eight scaffold modules are declarations, not stubs: none returns a placeholder value, and none is reachable at runtime, so nothing can read a fabricated value from them. They are recorded here because they are deliberately incomplete contracts:

| Module | What is declared | What is deliberately absent |
|---|---|---|
| `src/device/gemini.ts` | Identity, telemetry and metadata field names | The water-level legal-value lookup and the flood threshold. Only one level has hardware-validation evidence, so a lookup now would read as a confident measurement. |
| `src/device/halo.ts` | The identity discriminant | Everything else, until HALO hardware supplies representative payloads. |
| `src/accessories/services.ts` | The service-kind unions and the descriptor shape | The `as const` object holding the stable subtype strings, which a declaration-only module cannot carry. |
| The other five scaffolds | Their contracts | Implementations, which arrive with their production consumers. |

## Deferred Items

- **Family validation after each merge.** The store rule that places validation after every merge needs a family adapter, which does not exist yet. The plan's own flagged assumption names the uncharted edge: what the store should do when a merged record stops validating. That belongs to the next specification, not to a backstop check added here.
- **Wiring `AccessoryContext` into the platform's context type.** `src/platform.ts` still declares its own `BasementGuardianAccessoryContext` as a named extension point. Adopting the persisted shape makes its members required, which restored accessories from an earlier build do not carry, so the migration belongs with the accessory adapters.
- **Removing scaffold entries from `ignoreFindings`.** Each entry goes when its module gains a production consumer. Five transitional entries are still to be added by later plans and removed again.

## User Setup Required

None. No external service configuration is needed to build, test, or check this plan's output.

## Next Phase Readiness

Ready. The contract every later plan in this phase is written against now exists and is proven:

- `npm run check` exits 0 across type check, lint, all three `fallow` sub-commands, the format check, 116 unit tests, and 10 Cucumber scenarios over 61 steps.
- The state store pair reports 100 percent lines, branches, and functions run alone, and aggregate coverage is 100 percent.
- `.fallowrc.json` keeps `ignoreDependencies` and `ignorePatterns` untouched and gains `ignoreFindings` with the eight scaffold paths leading it in the declared order, so the plans that append their transitional entries have a stable base.
- No shared planning artifact was modified. `STATE.md` and `ROADMAP.md` are untouched.

## Self-Check: PASSED

- All 16 created files and all 5 modified files exist on disk.
- All three commits are present in `git log`.
- Every task `<acceptance_criteria>` was re-run and passes, including the plan's own `ignoreFindings` assertion verbatim and a check of the emitted JavaScript for each of the eight scaffolds.
- The plan-level `<verification>` block was re-run: `node --test` passes for the state store and all eight scaffold pairs, direct coverage on the state pair is 100 percent, `npm run fallow` exits 0 across all three sub-commands, and `npm run check` exits 0.
- `git diff --name-only` against the wave base lists the plan's 19 declared files plus `src/platform.ts` and `test/runtime/accountRuntime.test.ts`, both recorded as deviations above.
- No skipped test and no unrun verification step remains.

---

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-28*
