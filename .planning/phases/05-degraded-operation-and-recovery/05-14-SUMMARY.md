---
phase: 05-degraded-operation-and-recovery
plan: 14
subsystem: api
tags: [monitoring-trust, shadow, telemetry-ownership, multi-device, homekit]

requires:
  - phase: 05-degraded-operation-and-recovery
    provides: the two-device Cucumber harness plan 05-13 landed — the named read, the named publish and the named vendor change
  - phase: 05-degraded-operation-and-recovery
    provides: the shadow-silence release and the returning-heartbeat recovery plans 05-08 and 05-11 shipped on a single-device account
provides:
  - Per-device shadow arrival stamps, so silence is a fact about one controller rather than about an account
  - A per-device telemetry release, so a quiet pump is handed back to the poll and its healthy neighbour is not
  - A device's silence window seeded when discovery admits it, and dropped at a confirmed removal
  - The end-to-end scenario in which a poll finds the quiet pump's flood and the healthy pump keeps its own live reading
  - Closure of `05-REVIEW-2.md` CR-01 and WR-05
affects: [05-15, multi-device accessories, monitoring diagnostics]

actuals:
  tokens: 13000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A projection owns the set of devices it is watching, so one place decides who is being watched and `trustNow()` keeps the zero-argument shape thirteen shipped cases already use"
    - "A fleet-wide release is written as an explicit loop at its one legitimate call site, so the fleet-wide case and the per-device case differ in signature as well as in cause"
    - "A two-device scenario advances the clock in heartbeat-length steps with a message between them, so the account-wide rule never trips and the per-device rule is what the assertion measures"

key-files:
  created: []
  modified:
    - src/runtime/monitoringHealth.ts
    - src/runtime/accountRuntime.ts
    - src/device/state.ts
    - test/runtime/monitoringHealth.test.ts
    - test/device/state.test.ts
    - test/runtime/accountRuntime.test.ts
    - features/degradedOperation.feature
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
    - .planning/WINDOWS.md

key-decisions:
  - "Shadow silence is measured per device from that device's own last message, seeded at discovery admission rather than at runtime construction"
  - "releaseShadowSource takes the deviceId it releases; a disconnection releases the fleet as an explicit loop"
  - "Shadow-silence marking stays account-wide: any silent device makes every accessory stop vouching"
  - "recordShadowMessage stamps whatever device a message named, admitted or not, which is why mutation C failed nothing in the new scenario"

patterns-established:
  - "The admitted set lives inside the projection rather than being passed in by every caller, so no caller can get a silently different answer by passing the wrong list"
  - "A two-device assertion is only evidence when the device's live level and its polled level are deliberately different"

requirements-completed: [RES-03, RES-04]

coverage:
  - id: D1
    description: "On a two-pump account whose second pump keeps heartbeating, a poll that finds the quiet pump's pit flooded reports that flood in Apple Home"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A poll finds a flood on the pump that went quiet while its neighbour keeps reporting"
        status: pass
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#names only the pump that stopped speaking when the pump beside it is still heartbeating"
        status: pass
    human_judgment: false
  - id: D2
    description: "The quiet pump's tile stops saying the plugin vouches for it: its Status Active reads false while the poll refreshes it"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A poll finds a flood on the pump that went quiet while its neighbour keeps reporting"
        status: pass
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#stops vouching for the account while one pump is quiet and vouches again once it speaks"
        status: pass
    human_judgment: false
  - id: D3
    description: "The healthy pump keeps the level its own heartbeat delivered through its neighbour's silence (WR-05)"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A poll finds a flood on the pump that went quiet while its neighbour keeps reporting"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#leaves the pump beside it owning its own telemetry"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 hands only the quiet pump back to the poll and leaves its neighbour owning its telemetry"
        status: pass
    human_judgment: false
  - id: D4
    description: "A device's silence window starts when discovery admits it, and a later poll re-admitting it does not restart the window"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#goes silent two heartbeats after admission when no message ever arrives"
        status: pass
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#leaves a quiet pump quiet when a later poll admits it again"
        status: pass
    human_judgment: false
  - id: D5
    description: "A removed device's arrival stamp is dropped, so the tracked set cannot grow for the life of the process"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#stops reporting a system the account no longer carries"
        status: pass
    human_judgment: false
  - id: D6
    description: "A shadow disconnection still releases the whole fleet, because the connection that ended carried every device"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-15 hands every pump back to the poll when the connection that carried them all ends"
        status: pass
    human_judgment: false
  - id: D7
    description: "Everything plans 05-08 and 05-11 delivered on a single-device account still holds, unedited"
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A returning heartbeat clears the shadow silence before the next poll"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#A pit that floods after the live path went quiet still reaches Apple Home"
        status: pass
    human_judgment: false
  - id: D8
    description: "Shadow-silence marking is account-wide on a multi-device account: a two-pump owner whose front pump goes quiet sees both tiles stop vouching"
    verification: []
    human_judgment: true
    rationale: "This is a deliberate cost, not a proven property. Whether telling an owner the plugin cannot vouch for both systems when it can vouch for one is acceptable is a judgment about what an owner is served by, and no test can settle it. The argument is recorded in 05-VALIDATION.md and as an open ledger todo."

duration: 50 min
completed: 2026-09-02
status: complete
---

# Phase 05 Plan 14: Per-device shadow silence Summary

**Shadow silence is now a fact about one controller, measured from that controller's own last message and started when discovery admits it, so a poll finds the quiet pump's flood while the pump beside it keeps the readings its own live path delivered.**

## Performance

- **Duration:** 50 min
- **Started:** 2026-09-02T20:50:00Z (approximate; first task commit at 20:57:31Z)
- **Completed:** 2026-09-02T21:40:00Z
- **Tasks:** 3
- **Files modified:** 9 (7 source and test, 2 planning artifacts)

## The red result, quoted as the scenario found it

Before any source changed, on a two-pump account whose back pump kept heartbeating while the front pump's controller stopped speaking, and with every poll reporting `water_level: 31` on the front pump:

| What the front pump's tile said | Value |
|---|---|
| `Sump Pit Level` → `Water Level` | **40** — the level its own last heartbeat delivered, frozen |
| `Sump Pit Flood` → `Leak Detected` | **0** — no leak |
| `Sump Pit Flood` → `Status Active` | **true** — the plugin claimed to vouch for it |

The failure arrived as:

```
Failed scenarios:
  1) A poll finds a flood on the pump that went quiet while its neighbour keeps reporting
       Then the "Sump Pit Flood" service on "Front Sump Pump" reports "Leak Detected" as "1"
           Error: the Sump Pit Flood service on Front Sump Pump never reported Leak Detected as 1 within 2000 ms

1 scenario (1 failed)
22 steps (18 passed, 3 skipped, 1 failed)
```

**Confirmed rather than inferred.** With the source still unchanged, restating those three assertions as `0`, `40` and `true` made the scenario pass in 0.34 s. A flooded pit really did report as a normal one, and the tile really did go on claiming the plugin vouched for it. That is `CR-01` observed from a basement.

### A first draft of the scenario passed against the broken code, and why that mattered

The first version advanced the clock in a single 1796-second jump. It passed the flood assertions against unmodified production code and failed only on `Status Active`. The reason is the defect at one remove: a single jump ages the *account* stamp past two heartbeats as well, so the account-wide rule tripped, released **both** pumps by accident, and the flood arrived for the wrong reason. A green result there would have measured nothing.

The shipped scenario advances in two heartbeat-length steps with a message from the back basement between them. Every step leaves the newest message on the account under one heartbeat old, so an account-wide silence never trips at all, while the front basement's own last message ages past two. That is the difference between a scenario that measures the per-device rule and one that measures the clock. The reasoning is written into the scenario's prose so a later reader does not "tidy" the two steps back into one.

## Accomplishments

- `createMonitoringHealth` holds one arrival stamp per admitted device instead of one per account. `recordShadowMessage(deviceId)` stamps the device the message came from; `silentDevices()` answers every admitted device two heartbeats past its own last message, in admission order; `trustNow().shadowSilent` is `silentDevices().length > 0`.
- `admitDevice(deviceId)` starts a device's window at discovery and leaves an existing stamp alone. `forgetDevice(deviceId)` drops it at a confirmed removal and nowhere else.
- `applyDevices` releases only the devices `silentDevices()` names, still above the discovery loop for the reason the existing comment gives. `handleShadowDisconnected` still releases the fleet, now written as an explicit loop with its reason.
- `releaseShadowSource(deviceId)` clears one snapshot's watermark and does nothing for a `deviceId` the store does not hold.
- The suite moved from 1349 to 1358 unit tests and from 98 to 99 scenarios, with no shipped scenario edited.

## Task Commits

1. **Task 1: the scenario, then the three source modules** — `8ee1c7f` (fix)
2. **Task 2: the per-device unit cases** — `2d591bc` (test)
3. **Task 3: validation rows, mutations and ledger** — `5a1e0b2` (docs)

Each was verified with `git show --name-only --format="" HEAD` immediately after committing. No commit deleted a tracked file.

## No file under `features/support/` changed

`git status --porcelain -- features/support/` printed nothing, at every commit and at the end of the round. The scenario is written entirely in plan 05-13's three named steps, quoted here exactly as it uses them:

```gherkin
When the "Front Sump Pump" device publishes these heartbeat fields:
  | water_level | 3 |
When the vendor changes the "Front Sump Pump" device fields:
  | water_level | 31 |
Then the "Sump Pit Flood" service on "Front Sump Pump" reports "Leak Detected" as "1"
```

The account-wide `When the vendor changes these device fields:` was not used: it rewrites every seeded device's data, so the assertion that the healthy pump keeps its own reading would have stopped being about the healthy pump.

One thing the plan did not anticipate and the harness did not need: there is **no named form of `Then the {string} sensor is activated`**. The flood is therefore asserted through the named characteristic read, `reports "Leak Detected" as "1"` — `Leak Detected` is the characteristic `Sump Pit Flood` raises its alarm through, and `1` is `LeakDetected.LEAK_DETECTED`. No step was added; the existing named read carries the claim.

## Water level values, and the set they came from

Every value is a member of `{0, 1, 3, 7, 15, 31}`, the domain `src/device/waterLevel.ts:26-33` maps.

| Where | Code | Published `Water Level` |
|---|---|---|
| Front pump inventory row | 1 | 20 |
| Back pump inventory row | 7 | 60 |
| Heartbeat from the front pump | 3 | 40 |
| First heartbeat from the back pump | 3 | 40 |
| Second heartbeat from the back pump | 1 | 20 |
| Third heartbeat from the back pump | 15 | 80 |
| Vendor change to the front pump | 31 | 100 |

The back pump's live level (80) and its vendor body (60) are deliberately different. That is what makes the final assertion evidence rather than a tautology — and it is why mutation B fails, which the plan expected it might not.

No assertion ever failed on a withheld `Sump Pit Level`, so the family adapter accepted every snapshot.

## Mutations

Every mutation was applied after its task was committed, run, and reverted only once `git status` showed the mutated file was the only changed one. **Six of the seven failed something. Mutation C failed nothing in the new scenario, and that is reported rather than smoothed over.**

### Mutation A — `recordShadowMessage` stamps every admitted device

The account-wide behaviour this plan replaced. The new scenario dies at `features/degradedOperation.feature:208`:

```
Then the "Sump Pit Flood" service on "Front Sump Pump" reports "Leak Detected" as "1"
    Error: the Sump Pit Flood service on Front Sump Pump never reported Leak Detected as 1 within 2000 ms
1 scenario (1 failed) — 22 steps (18 passed, 3 skipped, 1 failed)
```

The quiet pump is never silent, is never released, and every poll body is discarded. This is the mutation proving the scenario measures per-device stamping.

### Mutation B — `applyDevices` releases every stored device whenever any is silent

**The plan predicted this might pass. It does not.** The scenario dies at `features/degradedOperation.feature:211`:

```
Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "80"
    Error: the Sump Pit Level service on Back Sump Pump never reported Water Level as 80 within 2000 ms
1 scenario (1 failed) — 22 steps (21 passed, 1 failed)
```

**Values compared: expected 80, read 60.** Confirmed by re-running the same mutation with that one assertion restated as `"60"`, which passes in 0.37 s: the healthy pump's live level really was overwritten by its own older vendor body.

The end-to-end tier therefore **does** see WR-05, and it sees it for a specific reason worth recording — the healthy pump's live level and its polled level were deliberately made different, and the preceding flood assertion guarantees a poll has already landed by the time the last assertion reads. Mutation F remains the unit-tier evidence.

### Mutation C — revert the admit call, so nothing is ever admitted

**This failed nothing in the new scenario, which passed unchanged in 0.38 s.**

The reason is structural rather than accidental. `recordShadowMessage` stamps whatever device a message named, admitted or not, and the quiet pump in this scenario heartbeats once before falling silent. So for a pump that has *ever* spoken, the admit call is redundant — its real subject is a device that has **never** spoken, which this scenario does not exercise.

It is not unpinned. The same mutation fails five shipped scenarios:

```
1) A flooded pit reaches Apple Home while the live path is silent
2) Both monitoring paths lost withdraws every scope
3) A blind plugin vouches for no controller-link verdict
4) A transport outage leaves every service readable
5) A press with no valid state is refused locally

99 scenarios (94 passed, 5 failed)
```

and `goes silent two heartbeats after admission when no message ever arrives` at `test/runtime/monitoringHealth.test.ts:239` is the unit case that states it directly.

### Mutation D — `recordShadowMessage` stamps every admitted device (unit tier)

Three cases fail:

- `names only the pump that stopped speaking when the pump beside it is still heartbeating` — `test/runtime/monitoringHealth.test.ts:256`
- `stops vouching for the account while one pump is quiet and vouches again once it speaks` — `test/runtime/monitoringHealth.test.ts:274`
- `D-13 hands only the quiet pump back to the poll and leaves its neighbour owning its telemetry` — `test/runtime/accountRuntime.test.ts:1097`

`ℹ tests 193 / pass 190 / fail 3` over the three files.

### Mutation E — `admitDevice` re-stamps a device it already holds

`leaves a quiet pump quiet when a later poll admits it again` — `test/runtime/monitoringHealth.test.ts:329` — fails, and ten more with it: every poll re-arms the window, so no silence is ever reached and the whole `the degraded monitoring path` group in `accountRuntime.test.ts` goes down, including `D-13 reports the flood a poll found on a device whose live path went quiet`.

`ℹ tests 193 / pass 182 / fail 11`. This is the mutation that pins the prohibition against per-poll re-seeding.

### Mutation F — `releaseShadowSource` clears every snapshot regardless of the `deviceId`

Three cases fail:

- `leaves the pump beside it owning its own telemetry` — `test/device/state.test.ts:582`
- `changes nothing when it names a device the store never held` — `test/device/state.test.ts:609`
- `D-13 hands only the quiet pump back to the poll and leaves its neighbour owning its telemetry` — `test/runtime/accountRuntime.test.ts:1097`

`ℹ tests 193 / pass 190 / fail 3`. **This is WR-05's discriminating mutation**, and it is why WR-05 is closed here rather than deferred a second time.

### Mutation G — `trustNow` answers `shadowSilent` false unconditionally

Fifteen cases fail, thirteen of them shipped before this plan — the silence-window table rows at `test/runtime/monitoringHealth.test.ts:100-118`, `goes silent a full window after a late arrival`, `leaves the shadow silent when a poll succeeds`, `answers both facts together`, and the whole `the degraded monitoring path` group in `accountRuntime.test.ts`.

`ℹ tests 193 / pass 178 / fail 15`. The account-wide verdict survived the move to per-device stamps with its coverage intact.

## `src/device/state.ts` has exactly three hunks

`git diff 00a6aad..HEAD -- src/device/state.ts` names the docblock, the signature, and the body of the release, and nothing else:

```diff
-  releaseShadowSource(): void;
+  releaseShadowSource(deviceId: string): void;
```

```diff
-    releaseShadowSource(): void {
-      for (const [deviceId, snapshot] of snapshots) {
+    releaseShadowSource(deviceId: string): void {
+      const snapshot = snapshots.get(deviceId);
+
+      if (snapshot !== undefined) {
         snapshots.set(deviceId, freeze({ ...snapshot, shadowVersion: undefined }));
       }
     },
```

**`pollTelemetry`, `nextShadowVersion` and `carriesObservation` are untouched.** `nextShadowVersion` is plan 05-15's subject and a change here would have made that plan's evidence unreadable.

## The two restated monitoring-health cases

| Original name | New name |
|---|---|
| `vouches for a shadow it has only just been built over` | `vouches for a shadow over a device it has only just admitted` |
| `goes silent two heartbeats after construction when no message ever arrives` | `goes silent two heartbeats after admission when no message ever arrives` |

Neither was deleted. The false normal they guard — a broker the plugin can never reach reading as permanently trusted — is still real, and is now guarded by a later clock: a device discovery found and nothing was ever heard from goes silent two heartbeats after the poll that found it. All fourteen shipped cases are present with their original claims; only these two names changed.

## Which production path reaches each new branch

- `admitDevice`'s `has` branch — both sides reached from `applyDevices`'s discovery loop: the first poll takes the absent side for every device, and every later poll takes the present side for every device already carried.
- `silentDevices()`'s filter — both sides reached from `applyDevices`'s release loop and from `trustNow()`, which `monitoringTrustNow()` calls on every poll outcome and every arriving message.
- `releaseShadowSource`'s `undefined` guard — the absent side is reached from `applyDevices` when a device goes silent and is removed between the silence projection naming it and the store being asked; the present side on every ordinary release.
- `handleShadowDisconnected`'s loop — reached on every disconnection, with the empty-store case reached by a disconnection before the first poll.

No branch is reachable only from a test.

## Suite counts, on both installed Node versions

Recorded baseline: **1349 unit tests, 98 scenarios, 1039 steps, 100/100/100 coverage.**

| Runtime | Unit tests | Scenarios | Steps | Coverage (line / branch / function) |
|---|---|---|---|---|
| `node` v26.7.0 | 1358 pass, 0 fail | 99 passed | 1061 passed | 100.00 / 100.00 / 100.00 |
| `/usr/bin/node` v22.22.2 | 1358 pass, 0 fail | 99 passed | 1061 passed | 100.00 / 100.00 / 100.00 |

**Node 24 is not installed on this machine and is not claimed.** The v22 lower bound and a runtime above the v24 upper bound were both exercised; the CI matrix is only partly reproduced here.

Every unit of movement is accounted for:

- **Unit tests: 1349 → 1358, +9.** Five new monitoring-health cases, two new store cases, two new runtime cases. The two restated cases are renames, not additions.
- **Scenarios: 98 → 99, +1.** One new, no shipped scenario edited or removed.
- **Steps: 1039 → 1061, +22.** The new scenario contributes 22 as Cucumber counts them — 3 inherited `Background` steps plus its own 19.
- **Coverage: unchanged at 100 % on all three axes.**

`npm run check` exits 0. `fallow dupes` reports one clone group, the pre-existing `features/support/steps/hap.ts:113-124` / `168-181` pair, which this plan did not touch and did not add to.

## `05-VALIDATION.md`: the measured baseline and the floor

The plan's floor is baseline-relative, deliberately, and the baseline had moved:

- **Measured `B` immediately before appending: 9.** The plan's sanity-check figure, taken on 2026-09-02 before plan revision closed, was `6`.
- **What moved it:** plan 05-13 appended rows and a mutation entry naming this plan — lines 204, 205 and 219 in the shipped file, all written in wave 8. Those three, on top of the six the plan measured, make nine. This is exactly why the plan forbade a hardcoded literal: a floor computed from a stale baseline gets easier to satisfy every time the preceding wave mentions this plan.
- **Floor asserted: `B + 11` = 20.** After appending the two subsection headings and the nine rows, `grep -c "05-14"` answered exactly **20**; the account-wide marking paragraph then took it to **22**.

## Decisions Made

- **The admitted set lives inside `MonitoringHealth`**, rather than being passed into `silentDevices()` and `trustNow()` as `05-REVIEW-2.md` sketched. Both work; owning the set means one place decides who is being watched, a caller cannot get a silently different answer by passing the wrong list, and `trustNow()` keeps the zero-argument shape thirteen shipped cases already use.
- **Marking stays account-wide.** Argued in the plan and recorded in `05-VALIDATION.md` with its cost, and appended to the ledger as an open `todo`. It was not re-litigated during execution.
- **`recordShadowMessage` stamps an unadmitted device.** A message is itself evidence that a system exists and that its live path is carrying. The alternative — ignoring messages from devices the projection has not been told about — would silently discard evidence and buys nothing, since the shadow client only starts once discovery has named the devices. The visible consequence is mutation C's null result, recorded above.
- **The clock advances in two heartbeat-length steps rather than one jump**, for the reason under `A first draft of the scenario passed against the broken code`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1 had to touch two test files it does not list**

- **Found during:** Task 1, at the first `npm run test:cucumber` after the source change
- **Issue:** `npm run test:cucumber` runs `build:test`, which compiles the whole `tsconfig.test.json` project. Eleven call sites — seven `store.releaseShadowSource()` in `test/device/state.test.ts` and four `health.recordShadowMessage()` in `test/runtime/monitoringHealth.test.ts` — failed with `TS2554: Expected 1 arguments, but got 0`, so **task 1's own `<verify>` could not run at all** until they compiled.
- **Fix:** Named the device at each call site and nothing else. Every substantive change to those files — the restatements and the new cases — landed in task 2 as planned.
- **Files modified:** `test/device/state.test.ts`, `test/runtime/monitoringHealth.test.ts`
- **Verification:** `npm run build:test` succeeds; the three named scenarios pass; `git show --name-only` on `8ee1c7f` shows the two files.
- **Committed in:** `8ee1c7f`

The plan anticipated the shape of this even if not the file list: task 2's precondition is `npm run build:test` succeeds, not `npm test`. Task 1's commit does leave exactly one unit test red — `goes silent two heartbeats after construction when no message ever arrives`, the construction-seeding case task 2 restates — which is the intended consequence of the plan's task split.

**2. [Rule 3 - Blocking] `sonarjs/no-identical-functions` on the two new runtime cases**

- **Found during:** Task 2, at `npm run lint`
- **Issue:** Both new `accountRuntime` cases declared the same local `bothAt` helper: `Update this function so that its implementation is not identical to the one on line 1089`. Two `max-len` warnings above 160 columns rode with it, and `--max-warnings=0` makes those fatal.
- **Fix:** Hoisted the helper to a module-level `bothDevicesAt(level)` beside `otherGeminiDevice`, and let `prettier` wrap the long assertion objects.
- **Files modified:** `test/runtime/accountRuntime.test.ts`, `test/device/state.test.ts`
- **Verification:** `npm run lint` clean; `npm run check` exits 0.
- **Committed in:** `2d591bc`

---

**Total deviations:** 2 auto-fixed (2 blocking). **Impact on plan:** none on scope or behaviour. One widened task 1's file list by two test files it could not compile without; the other is gate conformance inside files task 2 already owns. No package was installed; `package.json` and `package-lock.json` are unchanged.

## Plan premises that did not survive measurement

Three, all reported rather than worked around:

1. **Task 1 cannot be verified without touching test files.** `files_modified` lists them at plan level, but task 1's own `<files>` names four paths, none of them a test. Its `<verify>` runs `npm run test:cucumber`, which compiles the whole test project. Deviation 1 above.
2. **Mutation B does not pass.** The plan reserved WR-05's discriminating evidence for the unit tier on the expectation that the end-to-end tier might not see it. It does see it, given a scenario in which the healthy pump's live level and its polled level differ.
3. **Mutation C fails nothing in the new scenario.** Recorded in full above, with the five shipped scenarios and the one unit case that do pin the admit call.

One more, smaller: **there is no named form of the `sensor is activated` step**, so the flood is asserted through the named characteristic read on `Leak Detected`. No harness step was added.

Everything else the plan asserted held under measurement — the `water_level` domain, `releaseShadowSource`'s nine call sites, the fourteen monitoring-health cases, the line ranges in all six source and test files, and the recorded 1349 / 98 / 1039 baseline.

## Issues Encountered

**The first scenario draft passed against the broken code.** Recorded above in full, because it is the phase's signature defect in its purest form: a check that passes because the thing it rests on already sits at the value the defect produces. A single 1796-second jump trips the account-wide rule too, releasing both pumps by accident and letting the flood arrive for the wrong reason. Caught only because the RED run was inspected rather than glanced at — the `Status Active` failure was the visible symptom, and the two flood assertions passing was the thing that should not have been happening.

**Mutation C could not be made to fail the new scenario**, and was not forced to. Making it fail would have meant either removing the quiet pump's one heartbeat — which would have removed the scenario's own premise, that both pumps' live paths were working before the silence — or narrowing `recordShadowMessage` to admitted devices only, a source change made to satisfy a mutation rather than a requirement. Both were rejected. The null result is the honest measurement.

## Known Stubs

None. No hardcoded empty value, placeholder string, or unwired component was introduced.

## Ledger entries appended

Three, via `gsd-tools windows append`:

| Kind | File | What it records |
|---|---|---|
| `todo` | `src/accessories/basementGuardian.ts` | Shadow-silence marking is account-wide on a multi-device account: a two-pump owner is told the plugin cannot vouch for both systems when it can vouch for one. Deliberate; the argument and its cost are in `05-VALIDATION.md`. |
| `deviation` | `test/runtime/monitoringHealth.test.ts` | Task 1 had to touch two test files it did not list, because `test:cucumber` compiles the whole test project. |
| `deviation` | `features/degradedOperation.feature` | Mutation C failed nothing in the new scenario, and what pins the admit call instead. |

Ledger entry 2, which concerns `commandTransportReadyNow`, is untouched by this plan and was not marked fixed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**`05-REVIEW-2.md` CR-01 and WR-05 are closed.** On a two-pump account where one controller stops speaking, the poll finds that pump's flood and reports it, its tile stops vouching, and the pump beside it keeps the readings its own live path delivered.

Two things the next plan's author should know:

1. **`nextShadowVersion` and `pollTelemetry` in `src/device/state.ts` are untouched**, so plan 05-15's evidence is unobstructed. The only hunks in that file are the release's docblock, signature and body.
2. **`recordShadowMessage` stamps a device whether or not it was admitted.** A plan reasoning about the admitted set should not assume `admitDevice` is the only way into it.

`RES-03` and `RES-04` were not marked complete: `requirements.ready-ids` reports `0/2 ready`, because sibling plans in this phase also declare both and have not finished. They will be marked when the last declaring plan closes.

---
*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-02*

## Self-Check: PASSED

- `src/runtime/monitoringHealth.ts`, `src/runtime/accountRuntime.ts`, `src/device/state.ts` — FOUND
- `features/degradedOperation.feature` — FOUND
- `test/runtime/monitoringHealth.test.ts`, `test/device/state.test.ts`, `test/runtime/accountRuntime.test.ts` — FOUND
- `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md` — FOUND, `grep -c "05-14"` answers 22 against a measured baseline of 9 and a floor of 20
- Commits `8ee1c7f`, `2d591bc`, `5a1e0b2`, `585c82b` — all four FOUND in `git log`, each confirmed by `git show --name-only --format="" HEAD` at the time it was made
- `git status --porcelain -- features/support/` — empty
- `npm run check` — exit 0 on `node` v26.7.0 and `/usr/bin/node` v22.22.2: 1358 unit tests, 99 scenarios, 1061 steps, 100/100/100 coverage
