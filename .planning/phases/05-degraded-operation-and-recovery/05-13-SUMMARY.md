---
phase: 05-degraded-operation-and-recovery
plan: 13
subsystem: testing
tags: [cucumber, harness, multi-device, homekit, shadow]

requires:
  - phase: 05-degraded-operation-and-recovery
    provides: the single-device Cucumber harness, the service catalogue read path, and the fake REST and shadow stand-ins this round extends
provides:
  - A named-accessory read step, so a scenario can assert a value on one system among several
  - A named-device heartbeat step, so a scenario can say which pump sent a live message
  - A named-device vendor-change step, so a scenario can change one pump's reported body and leave its neighbour alone
  - Two scenarios proving a two-pump account is published and observed as two systems
  - The first end-to-end coverage of any per-device rule in this phase
affects: [05-14, 05-15, multi-device scenarios, CR-01, WR-05]

actuals:
  tokens: 20000
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A named lookup sits beside the account-wide one rather than replacing it, so 96 shipped scenarios keep the meaning they were written with"
    - "A lookup that matches no name throws and lists what was available, so a mis-named scenario fails on the name rather than three steps later on a value"
    - "A pair of assertions states the moved side before the not-moved side, so the delivery has landed before the second assertion reads"

key-files:
  created: []
  modified:
    - features/support/publishedServices.ts
    - features/support/steps/homekit.ts
    - features/support/steps/shadow.ts
    - features/degradedOperation.feature
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
    - .planning/WINDOWS.md

key-decisions:
  - "accessoryNamed stays module-local rather than exported: fallow dead-code fails the gate on an export with no consumer outside its module, and nothing outside publishedServices.ts needs it"
  - "The named-accessory lookup answers the last match through filter().at(-1) rather than findLast(), which the project's TypeScript lib does not carry"
  - "The polled half of the second scenario is asserted before any heartbeat, because once a live document takes ownership a poll body is discarded and the assertion would measure the watermark rather than the routing"
  - "awaitSubscription is left as it is: it reads a cumulative topic count and so answers for either device on a two-device account, which is weaker than its name suggests but is not what the new assertions wait on"

patterns-established:
  - "Two-device scenarios seed distinct waterLevel values per row, so 'reads apart' is an assertion about values rather than about existence"
  - "Every waterLevel and published water_level is drawn from the legal code set {0, 1, 3, 7, 15, 31}"

requirements-completed: [RES-03, RES-04]

coverage:
  - id: D1
    description: "Two Basement Guardian systems on one account publish two accessories, and a scenario reads each system's own values"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: 'features/degradedOperation.feature#Two pumps on one account publish two accessories that read apart'
        status: pass
    human_judgment: false
  - id: D2
    description: "A step naming a system the plugin never published fails on the name and lists the names it did publish"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: 'features/support/publishedServices.ts#accessoryNamed, pinned by mutation B'
        status: pass
    human_judgment: false
  - id: D3
    description: "A live message names the pump it came from and moves only that pump's readings, in both directions"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A heartbeat from one pump moves only that pump's readings"
        status: pass
    human_judgment: false
  - id: D4
    description: "A vendor-side change to one named pump's reported body moves that pump's polled reading and leaves the other pump's where it was"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A heartbeat from one pump moves only that pump's readings, polled half, pinned by mutation E"
        status: pass
    human_judgment: false
  - id: D5
    description: "The three named steps plan 05-14 writes its CR-01 scenario in all exist and are proved on already-correct behaviour, so 05-14 lands a source change alone"
    requirement: RES-04
    verification:
      - kind: e2e
        ref: 'npm run check'
        status: pass
    human_judgment: true
    rationale: "Whether the vocabulary is sufficient for 05-14's scenario is a judgment about a plan not yet executed. The steps and their per-device behaviour are proved; their sufficiency is not something a test in this round can assert."

duration: 26 min
completed: 2026-09-02
status: complete
---

# Phase 05 Plan 13: Two pumps on one account Summary

**The end-to-end suite can now describe a two-device account: a named-accessory read, a named-device heartbeat, and a named-device vendor change, with two scenarios proving two pumps publish two accessories that read apart and that a message for one leaves the other where it was.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-09-02T20:15:00Z (approximate; first task commit at 20:22:32Z)
- **Completed:** 2026-09-02T20:41:00Z
- **Tasks:** 2
- **Files modified:** 6 (4 under `features/`, 2 planning artifacts)

## No production code changed

`git diff --stat b67d030..HEAD -- src/ test/` is empty. `git status` named no file under `src/` at any point in the round, including while each of the five mutations was applied. Both scenarios pass against unmodified production code, which is the whole reason wave 8 exists: plan 05-14's red result must be about `CR-01` and not about a harness that moved in the same commit.

## Accomplishments

- A scenario can name one of several systems on an account and read that system's own published values.
- A scenario can send a live message from a named system and prove the other system did not move.
- A scenario can change one named system's vendor-reported body and prove the other system's polled reading stayed where its own inventory row put it. **Plan 05-14 consumes this step; it does not land it.**
- A step naming a system the plugin never published, or a device the scenario never seeded, fails on the name and lists what was available.
- The suite moved from 96 to 98 scenarios and from 1011 to 1039 steps, with no shipped scenario edited.

## Task Commits

1. **Task 1: two pumps on one account are two accessories a scenario can read apart** — `7abfbcf` (test)
2. **Task 2: a live message names the pump it came from, and moves only that pump** — `baed2bb` (test)
3. **Task 2: validation rows, mutations table and ledger entries** — `d625ea6` (docs)

Each was verified with `git show --name-only --format="" HEAD` after committing. No commit deleted a tracked file.

## The three named steps plan 05-14 must quote

Exactly as implemented, argument order included:

| Purpose | Step wording | Arguments, in order |
|---|---|---|
| Named read | `Then the {string} service on {string} reports {string} as {string}` | service name, accessory name, characteristic name, expected value |
| Named publish | `When the {string} device publishes these heartbeat fields:` | device name, then a rows-hash data table of reported fields |
| Named vendor change | `When the vendor changes the {string} device fields:` | device name, then a rows-hash data table of fields to merge into that device's data |

Written out as a scenario would:

```gherkin
Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "80"
When the "Front Sump Pump" device publishes these heartbeat fields:
  | water_level | 3 |
When the vendor changes the "Front Sump Pump" device fields:
  | water_level | 15 |
```

The name in all three is the **vendor `name` column of the scenario's device table**, which is also what the plugin constructs the accessory's `displayName` from (`src/platform.ts:304`). One word identifies the system on both halves of an assertion.

## RED runs

**Task 1**, before the step existed:

```
Undefined scenarios:
  1) Two pumps on one account publish two accessories that read apart # features/degradedOperation.feature:25
       Then the "Sump Pit Flood" service on "Front Sump Pump" reports "Status Active" as "true"
       Then the "Sump Pit Flood" service on "Back Sump Pump" reports "Status Active" as "true"
       Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "20"
       Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "60"

1 scenario (1 undefined)
10 steps (6 passed, 4 undefined)
```

**Task 2**, before either step existed:

```
Undefined scenarios:
  1) A heartbeat from one pump moves only that pump's readings # features/degradedOperation.feature:41
       When the vendor changes the "Front Sump Pump" device fields:
         | water_level | 15 |
       When the "Front Sump Pump" device publishes these heartbeat fields:
         | water_level | 3 |
       When the "Back Sump Pump" device publishes these heartbeat fields:
         | water_level | 15 |

1 scenario (1 undefined)
18 steps (9 passed, 6 skipped, 3 undefined)
```

## Mutations

Each was applied after its task was committed, run, and reverted only after `git status` showed the mutated file was the only changed one. **Every one of the five failed something.** None was applied to `src/`.

### Mutation A — the named-accessory lookup stops discriminating

Made `accessoryNamed` answer `handedAccessories.at(-1)` regardless of the name asked for.

Failed at `features/degradedOperation.feature:38`, `Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "20"`:

```
Error: the Sump Pit Level service on Front Sump Pump never reported Water Level as 20 within 2000 ms
1 scenario (1 failed) — 10 steps (8 passed, 1 skipped, 1 failed)
```

**Values compared: expected 20, read 60.** Confirmed rather than inferred: with the same mutation still applied and that one assertion restated as `"60"`, the scenario passes in 0.25 s. The front pump's read really is answering the back pump's tile.

### Mutation B — a name that matches nothing stops failing loudly

First, the unmutated behaviour, with the scenario asking for a `"Side Sump Pump"` that was never published:

```
Error: the plugin published no Side Sump Pump accessory; it published: Front Sump Pump, Back Sump Pump
    at accessoryNamed (dist-test/features/support/publishedServices.js:42:15)
1 scenario (1 failed) — 18→10 steps (8 passed, 1 skipped, 1 failed) in 0.16 s
```

Then with `accessoryNamed` returning `undefined` instead of throwing:

```
Error: the Sump Pit Level service on Side Sump Pump never reported Water Level as 20 within 2000 ms
1 scenario (1 failed) — 10 steps (8 passed, 1 skipped, 1 failed) in 2.17 s
```

Both are red. Only the first says the pump was never published. The second is a deadline from which a reader cannot tell a mis-named scenario from a routing defect, and it costs 2 seconds to arrive.

### Mutation C — every named publish routes to position zero

Resolved every named publish to `theDeviceId(this)`. The first heartbeat still lands on the front pump, so the first half survives. The scenario dies at `features/degradedOperation.feature:69`, `Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "80"`:

```
Error: the Sump Pit Level service on Back Sump Pump never reported Water Level as 80 within 2000 ms
1 scenario (1 failed) — 18 steps (16 passed, 1 skipped, 1 failed)
```

The back pump still held the 60 its own inventory row carried — evidenced in the same run by the three earlier `Back Sump Pump ... "60"` assertions among the 16 that passed.

### Mutation D — the device-name resolver falls back instead of throwing

Unmutated, with the scenario naming a `"Side Sump Pump"` it never seeded, the step fails on the name in 0.36 s:

```
Error: no step has given the scenario a Side Sump Pump device; it seeded: Front Sump Pump, Back Sump Pump
    at deviceIdNamed (dist-test/features/support/steps/shadow.js:76:15)
18 steps (15 passed, 2 skipped, 1 failed)
```

With the resolver falling back to `world.devices.at(0)`, the scenario still fails — but later, on a value:

```
Error: the Sump Pit Level service on Back Sump Pump never reported Water Level as 80 within 2000 ms
18 steps (16 passed, 1 skipped, 1 failed)
```

**Which a reader diagnoses faster:** the throw, decisively. It names the step at the moment of the mistake, names the pump that does not exist, and lists the two that do — a reader knows the scenario is wrong. The fallback points at an assertion three steps downstream about a pump that was never the problem, which reads exactly like a routing defect in `src/`. That is the evidence the throw is worth having.

### Mutation E — the named vendor change rewrites every seeded device

Made `changeNamedDeviceFields` select every device, the way `changeDeviceFields` does. The **polled half** dies at `features/degradedOperation.feature:62`, `Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "60"`:

```
Error: the Sump Pit Level service on Back Sump Pump never reported Water Level as 60 within 2000 ms
1 scenario (1 failed) — 18 steps (11 passed, 6 skipped, 1 failed)
```

**Values compared: expected 60, read 80** — the front pump's new body applied to the back pump too. Confirmed by re-running with that one assertion restated as `"80"`, which passes it and moves the failure to the next `"60"` assertion at line 66 (14 steps passed).

This is the mutation that makes plan 05-14's inheritance real. Without it, 05-14 would rest on a step whose per-device behaviour nothing had ever measured.

## Water level values, and the set they were drawn from

Every value is a member of `{0, 1, 3, 7, 15, 31}`, the domain `src/device/waterLevel.ts:26-33` maps.

| Where | Code | Published `Water Level` |
|---|---|---|
| Front pump inventory row, both scenarios | 1 | 20 |
| Back pump inventory row, both scenarios | 7 | 60 |
| Vendor change to the front pump | 15 | 80 |
| Heartbeat from the front pump | 3 | 40 |
| Heartbeat from the back pump | 15 | 80 |

No assertion ever failed on a withheld `Sump Pit Level`, so the family adapter accepted every snapshot. The flood code 31 was deliberately not used: it is legal, but it raises an alarm the scenarios are not about, and both scenarios are about routing.

## Suite counts, on both installed Node versions

Recorded baseline: **1349 unit tests, 96 scenarios, 1011 steps.**

| Runtime | Unit tests | Scenarios | Steps | Coverage (line / branch / function) |
|---|---|---|---|---|
| `node` v26.7.0 | 1349 pass, 0 fail | 98 passed | 1039 passed | 100.00 / 100.00 / 100.00 |
| `/usr/bin/node` v22.22.2 | 1349 pass, 0 fail | 98 passed | 1039 passed | 100.00 / 100.00 / 100.00 |

**Node 24 is not installed on this machine and is not claimed.** The CI matrix is therefore only partly reproduced here; the v22 lower bound and a runtime above the v24 upper bound were both exercised.

Every unit of movement is accounted for:

- **Unit tests: 1349 → 1349.** This plan adds no production code and no unit test.
- **Scenarios: 96 → 98.** One per task, both new, no shipped scenario edited or removed.
- **Steps: 1011 → 1039, +28.** Task 1's scenario contributes 10 (4 Background/setup steps inherited plus 6 of its own — 2 `Given`, 1 `When`, 4 `Then`, counted as Cucumber reports them: 10 total per run). Task 2's scenario contributes 18. 10 + 18 = 28.
- **Coverage: unchanged at 100 % on all three axes**, as expected for a round that adds no production code.

`npm run check` exits 0. `fallow dupes` reports one clone group, the pre-existing `features/support/steps/hap.ts:113-124` / `168-181` pair, which this plan did not touch and did not add to.

## `currentAccessory` and `serviceOf`

`currentAccessory`'s only edit is a docblock sentence:

```diff
+ *
+ * One device is the default shape, not the only one: an account carrying several systems hands over
+ * one accessory per system, and a step meaning a particular one reaches for `accessoryNamed`.
  */
 export function currentAccessory(homebridge: FakeHomebridgeApi): FakeAccessory | undefined {
   return homebridge.handedAccessories.at(-1);
 }
```

`serviceOf`'s **signature, exports and behaviour are unchanged**, but its body is not only a docblock edit — it now delegates to the two extracted internals rather than inlining them:

```diff
 export function serviceOf(homebridge: FakeHomebridgeApi, displayName: string): FakeHapService | undefined {
-  const row = createServiceCatalogue(...).find((candidate) => candidate.displayName === displayName);
-  if (row === undefined) {
-    throw new Error(`the plugin publishes no ${displayName} service`);
-  }
-  return currentAccessory(homebridge)?.getServiceById(row.serviceClass as unknown as FakeServiceClass, row.subtype);
+  return serviceOn(currentAccessory(homebridge), catalogueRow(homebridge, displayName));
 }
```

`catalogueRow` carries the same lookup and the same `the plugin publishes no ${displayName} service` message; `serviceOn` carries the same `getServiceById` call and the same cast comment. Nothing observable moved, and all 96 shipped scenarios pass unedited, which is the evidence.

**This is a plan self-inconsistency, recorded rather than smoothed over.** The task's `<action>` mandates "factoring the catalogue-row lookup the two now share into one internal function", while its `<acceptance_criteria>` says the only edit to `serviceOf` is a docblock sentence. Both cannot hold. The `<action>` was followed, because the factoring is what keeps the display name, service class and subtype declared in one place — the stated reason the module exists. The criterion's intent, that `serviceOf` is behaviourally unchanged, is met.

## Harness limits left open

Both recorded in `.planning/WINDOWS.md` as `kind: todo`, phase 05:

1. **`features/support/steps/harness.ts` carries a second, private `currentAccessory`** reading `registerPlatformAccessoryCalls[0]?.accessories[0]`, and a `topicNamed` resolving against a module-constant `DEVICE_ID`. Both are still single-device. Neither was needed by this round's scenarios and neither was touched — they serve the discovery feature, which seeds one device. This is the third single-device assumption in the harness and the only one still unaddressed.
2. **`awaitSubscription` in `features/support/steps/shadow.ts` reads a cumulative published-topic count**, so on a two-device account it answers once the client has subscribed to *either* device. That is weaker than the step's name suggests. It was left as it is because the new assertions wait for a value rather than for a subscription; a scenario that needed to know a *particular* device's subscription was established could not use it.

## Decisions Made

- **`accessoryNamed` is module-local, not exported.** The plan says "add `accessoryNamed(...)`" without stating visibility. Exporting it failed `fallow dead-code` with `Unused exports (1) — features/support/publishedServices.ts:46 accessoryNamed`, because nothing outside the module consumes it. Keeping it local satisfies the gate and the project style rule "export only symbols used outside the module". The plan's artifact contract (`contains: "accessoryNamed"`) and its key-link pattern are both about the identifier, not its visibility.
- **`filter(...).at(-1)` rather than `findLast(...)`.** `findLast` is not in the project's TypeScript lib: `error TS2339: Property 'findLast' does not exist on type 'readonly FakeAccessory[]'`. The `.at(-1)` form also mirrors `currentAccessory` directly, which is where the last-match reasoning comes from.
- **The polled half runs before any heartbeat.** Once a live document takes ownership of a device, a poll body is discarded; asserting the polled half after a heartbeat would measure the ownership watermark rather than the routing.
- **Each pair asserts the moved side first.** No settling read step exists for a named characteristic value, and `untilPublished` reads its condition before its first delay — so a "did not move" assertion placed first would pass before the delivery landed, whatever the routing did. Ordering the moved side first makes the delivery a precondition of the second assertion. This is stated in the scenario prose so a later reader does not "tidy" the order.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `accessoryNamed` exported broke the `fallow` gate**

- **Found during:** Task 1, at the first `npm run check`
- **Issue:** `fallow dead-code --fail-on-issues` failed with `Unused exports (1) — features/support/publishedServices.ts:46 accessoryNamed`. Nothing outside the module consumes the helper.
- **Fix:** Dropped the `export` keyword. `serviceOnNamed`, which does have an outside consumer, stays exported.
- **Files modified:** `features/support/publishedServices.ts`
- **Verification:** `npm run check` exits 0; `fallow` reports no unused export.
- **Committed in:** `7abfbcf`

**2. [Rule 3 - Blocking] `findLast` is not available in the project's TypeScript lib**

- **Found during:** Task 1, at the first `npm run test:cucumber`
- **Issue:** `error TS2339: Property 'findLast' does not exist on type 'readonly FakeAccessory[]'` plus a consequent implicit-`any` error.
- **Fix:** Used `filter(...).at(-1)`, which is the same answer and mirrors `currentAccessory`. The project's `tsconfig` was **not** changed — widening the lib to reach one array method would be a scope expansion this plan has no business making.
- **Files modified:** `features/support/publishedServices.ts`
- **Verification:** `npm run typecheck` passes as part of `npm run check`.
- **Committed in:** `7abfbcf`

**3. [Rule 3 - Blocking] Import order and line length**

- **Found during:** Task 1, at `npm run lint`
- **Issue:** One `import-x/order` error on the new `ServiceRow` type import, and two `max-len` warnings above the 160-column limit in `homekit.ts`. `--max-warnings=0` makes the warnings fatal.
- **Fix:** Moved the type import after the relative ones, and let `prettier` wrap the two long lines.
- **Files modified:** `features/support/publishedServices.ts`, `features/support/steps/homekit.ts`
- **Verification:** `npm run lint` clean.
- **Committed in:** `7abfbcf`

---

**Total deviations:** 3 auto-fixed (3 blocking). **Impact on plan:** none on scope or behaviour. All three are gate-conformance fixes inside files the plan already owns. No production module was touched, no package was installed, and `package.json` and `package-lock.json` are unchanged.

## Plan premises that did not survive measurement

One, recorded above in full: **the `serviceOf` acceptance criterion contradicts the task's own `<action>`.** The action mandates factoring the shared catalogue lookup out of `serviceOf`; the criterion says the only edit to `serviceOf` is a docblock sentence. The action was followed and the contradiction is reported rather than papered over.

Everything else the plan asserted held under measurement:

- The `05-VALIDATION.md` baseline `grep -c "05-13"` answered **6** before appending, exactly as the plan's derived floor states. After appending it answers **14**, above the floor of 13.
- `grep -rn "the vendor changes these device fields:" features/` returns **28** lines — one registration plus 27 call sites — both before and after this round. All 27 call sites are unedited and `changeDeviceFields` keeps its account-wide meaning; its only change is the body it now shares with the named step.
- The `water_level` domain, `src/platform.ts`'s accessory `displayName` source, `theDeviceId`'s position-zero read and `awaitSubscription`'s cumulative count were all confirmed as described.
- The recorded suite baseline of 1349 / 96 / 1011 was confirmed on the starting tree.

## Issues Encountered

Mutation C could not be expressed as a plain substitution: replacing `deviceIdNamed(this, deviceName)` with `theDeviceId(this)` left `deviceName` unread and the build failed with `TS6133`. The mutation was made compilable by appending `+ deviceName.slice(0, 0)` — a no-op that consumes the parameter without changing the resolved `deviceId`. The mutation's meaning is unchanged: every named publish routes to position zero.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Plan 05-14 is unblocked and its vocabulary is complete.** All three steps its `CR-01` scenario needs exist, are exercised by a passing scenario, and each has a mutation proving it discriminates by name. 05-14 lands a source change alone; a red result there is about `CR-01`.

Two things 05-14's author should know:

1. The named vendor change and the named publish both resolve through `world.devices`, so the scenario must seed its devices through `Given these devices:` (or `Given these gemini devices:`) before naming any of them.
2. If 05-14's scenario needs the polled path to reach a device, it must do so **before** that device receives a heartbeat. Once a live document takes ownership, a poll body is discarded.

The two harness limits above are open and recorded. Neither blocks 05-14.

---
*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-02*

## Self-Check: PASSED

- `features/support/publishedServices.ts` — FOUND
- `features/support/steps/homekit.ts` — FOUND
- `features/support/steps/shadow.ts` — FOUND
- `features/degradedOperation.feature` — FOUND
- `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md` — FOUND, `grep -c "05-13"` answers 14
- Commits `7abfbcf`, `baed2bb`, `d625ea6` — all three FOUND in `git log`, each confirmed by `git show --name-only --format="" HEAD` at the time it was made
- `git diff --stat b67d030..HEAD -- src/ test/` — empty
- `npm run check` — exit 0, 1349 unit tests, 98 scenarios, 1039 steps
