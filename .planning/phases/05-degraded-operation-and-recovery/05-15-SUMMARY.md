---
phase: 05-degraded-operation-and-recovery
plan: 15
subsystem: api
tags: [telemetry-ownership, shadow, monitoring-trust, cucumber, homekit]

requires:
  - phase: 05-degraded-operation-and-recovery
    provides: the per-device shadow silence and per-device telemetry release plan 05-14 shipped
  - phase: 05-degraded-operation-and-recovery
    provides: the two-device Cucumber harness plan 05-13 landed, and the telemetry-ownership rule plan 05-11 shipped
provides:
  - An ownership guard that reads the telemetry section alone, so a report carrying only device metadata may order but may not own
  - The receipt-time rule left reading the wider observation test, so a metadata report still counts as the device speaking
  - The harness step that publishes a report carrying only device metadata
  - The harness step that reads the merged metadata back off the canonical snapshot, which nothing in `features/` could do before
  - The scenario in which a poll finds the flood after a metadata-only report arrives
  - Closure of `05-REVIEW-2.md` CR-03
affects: [05-19, shadow telemetry ownership, monitoring diagnostics]

actuals:
  tokens: 7100
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Two questions a message answers are read where each is answered, not merged into one shared predicate, so narrowing one cannot silently narrow the other"
    - "A publishing step chooses which section of the reported document a table lands in, so telemetry and device metadata differ by one argument rather than by a second function"
    - "An end-to-end scenario asserts the document arrived before it asserts what the document did, so a failure names the delivery rather than the behaviour"

key-files:
  created: []
  modified:
    - src/device/state.ts
    - features/support/steps/shadow.ts
    - features/degradedOperation.feature
    - test/device/state.test.ts
    - test/runtime/accountRuntime.test.ts
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
    - .planning/WINDOWS.md

key-decisions:
  - "`carriesObservation` was left unnarrowed. Ownership is decided at its call site instead, because the same predicate answers whether the device spoke at all, and narrowing it would make a live pump reporting only metadata read as silent -- a false silence rather than a false normal, and a different wrong answer (D-11)."
  - "The shipped receipt-time case was widened into the paired case rather than duplicated. It already exercised a metadata-only patch; asserting the whole snapshot in it pins both questions in one place, and a near-clone beside it would have pinned neither better."
  - "No named variant of the metadata publish step was added. The scenario that needs it runs one system, and a named form would be a step no scenario calls."
  - "Mutation E was run although the plan did not name it. Mutations A to D leave the arrival half of D-11 unmeasured, and that half is what the narrowing must not break."

patterns-established:
  - "Ownership guard reads `patch.data`; the observation test stays `patch.data || patch.state`"
  - "`Then the canonical snapshot carries these device metadata fields:` is the metadata twin of the telemetry assertion, and reports which section its deadline was waiting on"

requirements-completed: [RES-03, RES-04]

coverage:
  - id: D1
    description: "A shadow document reporting only device metadata leaves the readings with the poll, so the flood the next poll finds reaches Apple Home"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A report carrying only device metadata leaves the readings with the poll"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 leaves the poll owning telemetry through a live message that reports only device metadata"
        status: pass
    human_judgment: false
  - id: D2
    description: "That same document still counts as the device speaking: it refreshes the receipt time and the tile vouches for the system again"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#advances the receipt time and establishes no watermark for a patch that reports only device metadata"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#A report carrying only device metadata leaves the readings with the poll"
        status: pass
    human_judgment: false
  - id: D3
    description: "A watermark that already exists still advances on such a document, so a superseded telemetry document cannot overwrite a newer reading"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#advances a watermark it already held on a patch that reports only device metadata, so a superseded telemetry patch stays refused"
        status: pass
    human_judgment: false
  - id: D4
    description: "The harness can read `snapshot.metadata`, so a scenario publishing a metadata document proves the document arrived rather than assuming it"
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "features/support/steps/shadow.ts#Then the canonical snapshot carries these device metadata fields:"
        status: pass
    human_judgment: false

duration: 38min
completed: 2026-09-02
status: complete
---

# Phase 5 Plan 15: Telemetry ownership reads the telemetry section Summary

**A shadow document reporting only wifi signal and firmware no longer takes the pit reading away from polling, while still counting as the device speaking -- `nextShadowVersion` reads `patch.data`, `carriesObservation` is untouched, and the two harness steps that make the difference visible from a basement.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-09-02T21:17Z
- **Completed:** 2026-09-02T21:56Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Closed `05-REVIEW-2.md` CR-03: a metadata-only `update/accepted` delta established the telemetry watermark, locking the poll out with nothing to release it, because the same message kept the silence rule quiet.
- Split the two questions a reported document answers at the call site rather than in the shared predicate, so the device-spoke question stays wide and the ownership question is narrow.
- Landed the first step in the suite that reads `snapshot.metadata`, so the new scenario proves its document was delivered and merged instead of assuming it.
- Ran five mutations, including one the plan did not name, and recorded the two that broke nothing along with why.

## Task Commits

1. **Task 1: End to end -- a report carrying only device metadata leaves the readings with the poll** - `885c60c` (fix)
2. **Task 2: Both questions a reported document answers are pinned separately** - `c2bcaae` (test)

## Files Created/Modified

- `src/device/state.ts` - `nextShadowVersion` drops its `observed` parameter and reads `patch.data`; its comment gains the sentence naming which section ownership governs
- `features/support/steps/shadow.ts` - `publishReported` takes the section a table lands in; adds `When the device reports these device metadata fields:` and `Then the canonical snapshot carries these device metadata fields:`
- `features/degradedOperation.feature` - adds `Scenario: A report carrying only device metadata leaves the readings with the poll`
- `test/device/state.test.ts` - the paired case pinning both questions at once, and the case pinning what the watermark advance is for
- `test/runtime/accountRuntime.test.ts` - the runtime case at the seam the review's reproduction was found at
- `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md` - `### Plan 05-15 rows` and `### Plan 05-15 mutations`
- `.planning/WINDOWS.md` - one deviation entry

## The RED run

Recorded before the guard changed, with the scenario and both harness steps already committed to the working tree.

Two missed heartbeats released the shadow's ownership, so the poll took the readings back and wrote its own vendor body:

```text
Then the canonical snapshot carries these fields:
  | water_level | 3 |        <- passed: the poll owned the readings
When the device reports these device metadata fields:
  | wifi_signal_dbm      | -54   |
  | mcu_firmware_version | 1.4.2 |
Then the canonical snapshot carries these device metadata fields:
  | wifi_signal_dbm      | -54   |
  | mcu_firmware_version | 1.4.2 |   <- passed: the document arrived and merged
Then the "Sump Pit Flood" service reports "Status Active" as "true"
                                     <- passed: it counted as the device speaking
When the vendor changes these device fields:
  | water_level | 31 |
Then the canonical snapshot carries these fields:
  | water_level | 31 |       <- FAILED after 5000 ms
```

**The frozen reading was `3` while the poll was reporting `31`.** Confirmed rather than inferred: restating that last assertion as `| water_level | 3 |` made the scenario pass against unmodified production code, in 0.5 s.

The RED failed for the intended reason and not incidentally. Sixteen of the eighteen steps passed, including the metadata assertion and the trust assertion, so the document was delivered, was parsed, was merged into `snapshot.metadata`, and did stamp the arrival. The only thing that did not happen was the poll refreshing the level -- which is CR-03 exactly, seen from a basement: every tile reads normal, fully vouched for, over a level no transport delivered.

## The two-hunk diff of `src/device/state.ts`

```diff
@@ -240,8 +240,16 @@ function carriesObservation(patch: ReportedPatch): boolean {
 // document carrying no observation would take ownership from the poll on the
 // strength of having seen nothing, freezing telemetry at whatever the poll last
 // wrote (SYNC-02, D-014).
-function nextShadowVersion(previous: DeviceSnapshot, patch: ReportedPatch, observed: boolean): number | undefined {
-  if (!observed && previous.shadowVersion === undefined) {
+//
+// The section ownership governs is the telemetry one, which is why this reads
+// `patch.data` rather than the wider observation test above. A document
+// reporting only device metadata -- a firmware revision, a signal strength --
+// has observed the device without delivering a reading, so it may order but may
+// not own. Reading the wider test here lets such a document take the readings
+// from the poll while the same message keeps the silence rule quiet, leaving
+// nothing to hand them back (CR-03).
+function nextShadowVersion(previous: DeviceSnapshot, patch: ReportedPatch): number | undefined {
+  if (patch.data === undefined && previous.shadowVersion === undefined) {
     return undefined;
   }

@@ -261,7 +269,7 @@ function nextSnapshot(previous: DeviceSnapshot, patch: ReportedPatch, receivedAt
     connectivity: previous.connectivity,
     data: mergeRecord(previous.data, patch.data),
     metadata: mergeRecord(previous.metadata, patch.state),
-    shadowVersion: nextShadowVersion(previous, patch, observed),
+    shadowVersion: nextShadowVersion(previous, patch),
     deviceTimestamp: previous.deviceTimestamp,
     receivedAt: observed ? receivedAt : previous.receivedAt,
   });
```

Two hunks, as the plan required: the guard and its call site. `carriesObservation` is byte-identical, and `nextSnapshot` still computes `observed` for `receivedAt`.

## Mutations

Each was applied after its task was committed, run, and reverted only once `git status` showed the mutated file was the only changed one, with `npm run build:test` rerun afterwards.

| Mutation | What it does | What failed |
|---|---|---|
| **A** | Restore the guard to `!carriesObservation(patch)` | At task 1: the scenario at `features/degradedOperation.feature:197`, `Then the canonical snapshot carries these fields: \| water_level \| 31 \|`, and **no unit case at all -- 1358 passed**. After task 2: also `advances the receipt time and establishes no watermark for a patch that reports only device metadata` at `test/device/state.test.ts:423` and `D-13 leaves the poll owning telemetry through a live message that reports only device metadata` at `test/runtime/accountRuntime.test.ts:1000` |
| **B** | Return `previous.shadowVersion` whenever `patch.data` is absent, so a metadata-only document may not advance a watermark either | Three unit cases, no scenario. `keeps shadow metadata and the applied version when a later poll refreshes telemetry` at `test/device/state.test.ts:140` and `leaves the receipt time alone and advances the watermark it already held for a patch that reports neither section` at `:379`, both shipped before this plan, plus `advances a watermark it already held on a patch that reports only device metadata, so a superseded telemetry patch stays refused` at `:450`, added by task 2 |
| **C** | Narrow `carriesObservation` to `patch.data !== undefined`, the rejected fix | One unit case, no scenario: `advances the receipt time and establishes no watermark for a patch that reports only device metadata` at `test/device/state.test.ts:423` |
| **D** | Make the metadata publish step send an empty metadata section | The scenario at `features/degradedOperation.feature:191`, `Then the canonical snapshot carries these device metadata fields:` -- "the canonical snapshot never carried the device metadata fields the scenario expects within 5000 ms". On the metadata assertion, four steps before the flood |
| **E** *(not named by the plan)* | Guard `health.recordShadowMessage(deviceId)` on `patch.data !== undefined`, so a metadata report stops counting as an arrival | The scenario at `features/degradedOperation.feature:194`, `Then the "Sump Pit Flood" service reports "Status Active" as "true"`. **No unit case failed -- 1360 passed** |

### The mutations that broke less than expected, stated as the measurements they are

**Mutation A broke no unit case when task 1 was committed.** The end-to-end tier was the only thing that saw the fix. The plan anticipated a gap of this shape and task 2 closed it with two cases: the paired store case, which fails because the watermark reads `1` instead of `undefined`, and the runtime case, which fails because the flood the fourth poll carried is discarded and the level stays at the vendor's `1`. Both now fail mutation A.

**Mutation C broke no scenario, and that is correct rather than a gap.** `carriesObservation` reaches only `receivedAt` in the store. The arrival stamp the silence rule reads is `health.recordShadowMessage` in `accountRuntime`, which never consulted the predicate, so the end-to-end tier cannot see this mutation at all. The unit case at `test/device/state.test.ts:423` is the whole of its coverage, and that is the right tier for it.

**Mutation E broke no unit case.** The scenario is the only thing pinning it, and it is pinned deliberately at the tier an owner would feel it: with `recordShadowMessage` narrowed, the metadata report stops clearing the silence, the tile goes on saying the plugin cannot vouch for the system, and the release path would eventually hand telemetry back for a pump that never stopped speaking. Together with mutation C, the two halves of "a metadata report is still a report" are pinned at two tiers by two independent tests.

## Confirmation: a metadata-only report still counts as the device speaking

This is the half of D-11 the narrowing must not break, and it survives at both places it is decided.

| Where it is decided | What proves it | Mutation that kills it |
|---|---|---|
| `receivedAt` in the store | `advances the receipt time and establishes no watermark for a patch that reports only device metadata`, `test/device/state.test.ts:423` | C |
| The arrival stamp the silence rule reads | `Then the "Sump Pit Flood" service reports "Status Active" as "true"`, `features/degradedOperation.feature:194` | E |

`carriesObservation` is unchanged, so nothing about the device-spoke question moved. A live pump that reports only metadata does not read as silent.

## Harness steps added

Neither existed before this plan.

- `When the device reports these device metadata fields:` -- publishes through the broker with the table under the document's `reported.state` section. The account-wide form only: the scenario that needs it runs one system, and a named variant would be a step no scenario calls. `publishReported` now takes the section, so the telemetry step and the metadata step differ by one argument.
- `Then the canonical snapshot carries these device metadata fields:` -- **no step in the suite read `snapshot.metadata` before this one.** Measured at `b67d030` and again here: `grep -rn metadata features/support/steps/*.ts` returned one line and it was a comment in `hap.ts`. Both snapshot assertions read `.data` by construction. The step shares `assertSnapshotRecord` with the telemetry assertion so the two agree about which snapshot they read and how long they wait, and its deadline message names the section, so a metadata failure does not read as a telemetry failure.

## Suite counts

Baseline measured on the committed tree at `76362f4` before any edit.

| Run | Unit tests | Unit fail | Scenarios | Steps | Coverage |
|---|---|---|---|---|---|
| Baseline, `node` v26.7.0 | 1358 | 0 | 99 | 1061 | 100 / 100 / 100 |
| Final, `node` v26.7.0 | 1360 | 0 | 100 | 1079 | 100 / 100 / 100 |
| Final, `/usr/bin/node` v22.22.2 | 1360 | 0 | 100 | 1079 | 100 / 100 / 100 |

Every unit of movement is accounted for:

- **+2 unit tests.** One store case (`advances a watermark it already held ... so a superseded telemetry patch stays refused`) and one runtime case (`D-13 leaves the poll owning telemetry through a live message that reports only device metadata`). The receipt-time case was widened in place rather than duplicated, so it adds no count.
- **+1 scenario, +18 steps.** The new scenario, which has 18 steps.
- **No existing scenario was edited**, and all 99 still pass.

**Node 24 is not installed on this machine and nothing is claimed about it.** The two versions above are the two that exist here.

## Validation floor

`grep -c "05-15" .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md`

- **Measured immediately before appending: `4`.** The same number the plan derived its floor from, so the floor of `12` stands as written rather than needing restatement.
- After appending: **`14`**. Two subsection headings plus the rows and mutation lines this plan added, above the floor by two.

## Decisions Made

- **`carriesObservation` stays wide, and ownership is decided at the call site.** The rejected fix -- narrowing the predicate and leaving both callers on it -- is one line shorter and wrong in the other direction. `receivedAt` would stop moving on a real report, and if the same narrowing ever reached the arrival stamp, a pump reporting only metadata would be called silent and its telemetry released. That is a false silence, which marks a healthy pump untrustworthy. Not a safe direction to fail in; a different wrong answer.
- **The shipped receipt-time case was widened rather than duplicated.** It already sent a metadata-only patch. Asserting the whole snapshot in it pins both questions in one place, which is what the plan asked for, and a near-clone beside it would have pinned neither better.
- **Mutation E was run although the plan did not name it.** Mutations A to D leave the arrival half of D-11 entirely unmeasured. Running it is what turns "the narrowing did not break the other half" from an assertion into a measurement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's stated consequence of refusing the watermark advance did not survive measurement**

- **Found during:** Task 2 (writing the advancing case)
- **Issue:** The plan's second prohibition says refusing to advance a held watermark on a metadata-only document "would leave a later telemetry document at the same version judged stale, which discards a real reading." Traced through `isStalePatch`, that is backwards. Refusing the advance leaves the watermark *below* the shadow's own version, so nothing is judged stale that would not have been; the loss runs the other way, and a document the shadow has already superseded is *accepted* over a newer reading.
- **Fix:** The shipped case pins the measured consequence rather than the stated one: after a metadata-only document at version 8, a telemetry document at version 7 stays refused. Mutation B fails it, because with the watermark left at 5 the version-7 document is applied and overwrites `water_level: 1` with `31`.
- **Files modified:** `test/device/state.test.ts`
- **Verification:** Mutation B fails the case; reverting it passes. `npm run test:coverage:direct` on the pair reports 100 / 100 / 100.
- **Committed in:** `c2bcaae`

---

**Total deviations:** 1 auto-fixed (1 bug, in a plan premise rather than in code)
**Impact on plan:** The prohibition itself was honoured exactly -- the advance is not refused. Only its stated reason was wrong, and the case now records the right one. No scope creep.

## Known Stubs

None.

## Threat Flags

None. The change removes surface rather than adding it: a document that delivered no reading can no longer claim ownership of readings. No new endpoint, auth path, file access, or schema at a trust boundary. `package.json` and `package-lock.json` are untouched, so `T-05-15-SC` holds.

## Ledger

One entry appended to `.planning/WINDOWS.md`:

```text
kind: deviation, phase 05, file .planning/phases/05-degraded-operation-and-recovery/05-15-PLAN.md
Plan 05-15 stated that refusing to advance a held watermark on a metadata-only document would
leave a later telemetry document at the same version judged stale, discarding a real reading.
Measured: refusing the advance leaves the watermark BELOW the shadow's own version, so a
superseded document is accepted over a newer reading. The shipped case pins the measured
consequence.
```

No existing entry was closed.

## Issues Encountered

None. Every premise the plan stated about the tree held on measurement except the one recorded above: `releaseShadowSource(deviceId)` had the signature plan 05-14 gave it, `publishReported` needed no broker change, and `grep -rn metadata features/support/steps/*.ts` still returned one comment line before this plan ran.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CR-03 is closed at three tiers with named mutations behind each.
- The metadata assertion step is available to any later plan that needs to prove a shadow document arrived.
- Plan 05-16 (wave 11) is unblocked; nothing here touches `basementGuardian.ts` or the credential paths it works in.

---
*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-02*
