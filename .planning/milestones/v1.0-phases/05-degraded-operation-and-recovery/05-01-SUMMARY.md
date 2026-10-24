---
phase: 05-degraded-operation-and-recovery
plan: 01
subsystem: safety-monitoring
tags: [homebridge, hap, typescript, mqtt, cucumber, node-test, trust-projection]

requires:
  - phase: 03-safety-monitoring-in-homekit
    provides: the per-scope preserve-and-mark invariant, `StatusActive` as the degradation signal, the offline confirmation run and its adapter
  - phase: 04-pump-records-and-official-controls
    provides: the control binder's injected predicates, the pump record projection, the `04-VERIFICATION.md` W-1 warning about a Cucumber tier blind to this projection path
provides:
  - "`src/runtime/monitoringHealth.ts` — the account-wide monitoring-trust projection: the REST failure run, the shadow arrival stamp, the two thresholds, and the pure predicates over them"
  - "`AccountRuntimeOptions.onMonitoringHealth` and `AccountRuntimeDeps.onMonitoringHealth` — the trust decision leaving the runtime on every poll outcome"
  - "`BasementGuardianAccessory.markMonitoring` — the third distrust layer, reaching every published row through `untrustedScopes`"
  - "`applyMonitoringHealth` — the exported platform fan-out both the platform and the Cucumber harness call"
  - "`FakeRestApi.failEveryRequestWith` / `answerNormally` — the sustained failure a consecutive-failure threshold needs to be provable at all"
  - "The `Live device reporting` failure-log kind, so a transport outage names the cause that happened"
affects: [05-02-restart-marking, 05-03-command-gating, 05-04-credential-rejection, 05-05-documentation]

actuals:
  tokens: 21112
  tasks: 3
  commits: 5
  # `estimateTokens` scale: chars/4 over the realized diff (84 449 chars, 13 files,
  # 1403 insertions). Recorded on the scale the template mandates. The plan's 115 000
  # projection was almost certainly taken over the read set rather than the diff, so the
  # two figures are not on the same footing; a later calibration pass should compare
  # like with like before treating this as a 5x over-estimate. Chars/4 over the full
  # contents of the thirteen changed files is 195 350.

tech-stack:
  added: []
  patterns:
    - "A second projection beside an existing one, rather than an edit to it, when a new question needs facts the old answer collapsed"
    - "An account-wide fact fanned out to every accessory through an exported free function both the platform and the harness call"
    - "A third non-overwriting layer in `distrustReasonsOf`, so three causes compose with fixed precedence"

key-files:
  created:
    - src/runtime/monitoringHealth.ts
    - test/runtime/monitoringHealth.test.ts
  modified:
    - src/runtime/accountRuntime.ts
    - src/accessories/basementGuardian.ts
    - src/platform.ts
    - features/degradedOperation.feature
    - features/support/world.ts
    - features/support/fakeRestApi.ts
    - features/support/steps/shadow.ts
    - features/support/steps/runtime.ts
    - test/runtime/accountRuntime.test.ts
    - test/accessories/basementGuardian.test.ts
    - test/platform.test.ts

key-decisions:
  - "The D-02/D-04 checkpoint was answered `d-02`: a REST-only degradation withdraws `connectivity` and only `connectivity`. No artifact changed, because that is what the plan already implemented."
  - "PA-01 resolved structurally: the arrival stamp is seeded from the injected clock at construction, so a broker the plugin can never reach goes silent two heartbeats after the runtime was built rather than never."
  - "PA-02 resolved by following D-02, the later and narrower text, over D-04's sentence about not marking HomeKit."
  - "`monitoringPathNow()` is byte-identical. The trust decision is a second projection beside it, and all fourteen existing assertions pass with their expectations unmodified."
  - "The shadow-silence diagnostic is a new `FailureLog` kind, `Live device reporting`, rate-limited by that module rather than by a second warn-once flag."
  - "`reportDegradation()` no longer fires for `'unreachable'`, so a transport outage stops producing the accessory line about a profile or payload that stopped validating."

patterns-established:
  - "Lazy evaluation on the poll tick against an injected `Clock`, so a 1796-second threshold is drivable from a scenario that never sleeps"
  - "Arrival stamped at `onReportedPatch`, upstream of the canonical store's change filter, so an identical heartbeat still proves the live path is alive"
  - "`markMonitoring` stores the handed value unconditionally, outside the unchanged-value early return, so a member added later cannot go stale behind an unchanged-looking report"

requirements-completed: [RES-03]

coverage:
  - id: D1
    description: "Two missed heartbeats of shadow silence with REST still polling withdraws every scope but `connectivity`: `Sump Pit Flood` reports `Status Active` as `false` with its `Leak Detected` value retained, while `Basement Guardian Offline` stays trusted and quiet."
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#Shadow silence withdraws trust while polling continues"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#withdraws every scope but connectivity when only the shadow has gone quiet"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#deactivates the flood sensor while leaving the offline adapter vouched for when the shadow goes quiet"
        status: pass
    human_judgment: false
  - id: D2
    description: "Two consecutive failed REST polls with the shadow alive withdraws `connectivity` alone and leaves the seven live-value scopes trusted."
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#Polling failure alone leaves the live values trustworthy"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#withdraws connectivity alone when only the polling path is degraded"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#reports the polling path degraded on the second consecutive failure and trusted again on the next success"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both transports degraded withdraws all eight `TrustScope` members while every published value is retained."
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#Both monitoring paths lost withdraws every scope"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#withdraws every scope when both transports are lost"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#retains every published value across a lost monitoring path and moves the trust flag alone"
        status: pass
    human_judgment: false
  - id: D4
    description: "Clearing is matched to cause: a successful poll does not clear shadow silence, and a heartbeat carrying values identical to the previous one does."
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A successful poll does not clear the shadow silence"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#An identical heartbeat clears the shadow silence"
        status: pass
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#leaves the shadow silent when a poll succeeds, because a poll observed no live message"
        status: pass
    human_judgment: false
  - id: D5
    description: "The boundary and precision contract: 1_795_999 ms is not silence and 1_796_000 ms is; one failed poll withdraws nothing and the second consecutive one withdraws."
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#reports the shadow silent as {false|true} {elapsed} ms after the last message (five rows)"
        status: pass
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#reports the polling path degraded as {bool} after {n} consecutive failed poll(s) (four rows)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The plugin never states a cause that did not happen: a transport outage produces no validation line, and the shadow-silence diagnostic comes from the runtime's rate-limited failure log under its own kind, naming no route, header, credential, or device."
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#explains no degradation when the payload never stopped validating"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#reports the silent live connection once across three silent polls inside one reminder interval"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#names no route, no header, and no credential in the line a silent live connection records"
        status: pass
    human_judgment: false
  - id: D7
    description: "A monitoring-path failure never activates `Basement Guardian Offline` and never activates `Pump Controller Link Lost`, and every scope's last-trusted timestamp stops advancing while the degradation holds."
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#freezes the moment trustworthy controller data last arrived for as long as the monitoring path is lost"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#Both monitoring paths lost withdraws every scope"
        status: pass
    human_judgment: false
  - id: D8
    description: "The account-wide trust reaches every accessory the platform publishes, through one exported fan-out that the Cucumber harness calls rather than copies."
    verification:
      - kind: unit
        ref: "test/platform.test.ts#hands the same account-wide trust to every accessory this run publishes"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#withdraws the offline verdict from every published accessory once polling has failed twice"
        status: pass
    human_judgment: false
  - id: D9
    description: "Apple Home renders the withdrawn trust on a real paired home as a `Status Active — No` row with the tile present and its last value retained."
    verification: []
    human_judgment: true
    rationale: "Apple Home's rendering cannot be asserted from the plugin side. This rides along with the open G-003 / G-004 real-home session already listed in `05-VALIDATION.md` § Manual-Only Verifications."

duration: 47min
completed: 2026-09-01
status: complete
---

# Phase 5 Plan 01: Degraded Monitoring Path Summary

**A shadow that stops speaking for two heartbeats now deactivates every safety tile while polling keeps the offline verdict alive, proven end to end against the fake cloud and the fake broker.**

## Performance

- **Duration:** 47 min (first commit to last)
- **Started:** 2026-09-02T00:16:12Z
- **Completed:** 2026-09-02T01:03:00Z
- **Tasks:** 3 of 3
- **Files modified:** 13 (2 created, 11 modified)

## Accomplishments

- The account-wide monitoring-trust projection exists and is 100% covered: a REST failure run compared with `>=` against a threshold of two, and a shadow arrival stamp compared with `>=` against `898_000 * 2` milliseconds of the injected clock. Neither quantity is divided, averaged, scaled, or rounded.
- The whole path — transport fact to HomeKit characteristic — is wired once and proven end to end. `Sump Pit Flood` reports `Status Active` as `false` with its `Leak Detected` value retained, while `Basement Guardian Offline` stays trusted and quiet in the same run.
- The complete transport matrix and both clearing rules hold in Cucumber: shadow silent, REST degraded, both down, a successful poll that does not clear silence, and an identical heartbeat that does.
- `reportDegradation()` no longer names a profile or payload that stopped validating for an outage that stopped nothing validating. The transport diagnostic moved to the runtime's rate-limited failure log under a new kind, `Live device reporting`.
- Every mutation `05-VALIDATION.md` names for a behaviour in this plan was applied, watched to fail its named test, reverted, and green restored.

## Task Commits

1. **Task 1: Decision checkpoint (D-02 vs D-04)** — answered `d-02` before execution; no commit, because `d-02` is what the plan already implemented and no artifact changed.
2. **Task 2: Tracer — two missed heartbeats withdraw trust while polling continues** — `f145013` (test), `2fa49f2` (feat), `0ca92a8` (test), `73cc4bb` (feat)
3. **Task 3: The transport matrix, both clearing paths, and the right diagnostic** — `d7cf0c3` (feat)

**Plan metadata:** see the `docs(05-01)` commit that follows this file.

## Files Created/Modified

- `src/runtime/monitoringHealth.ts` — the projection: three thresholds, `MonitoringTrust`, two pure predicates, and a factory closing over the run and the stamp.
- `test/runtime/monitoringHealth.test.ts` — twenty cases over the thresholds, the five-point silence boundary, and both clearing rules.
- `src/runtime/accountRuntime.ts` — builds one `MonitoringHealth`; stamps every arrival at `onReportedPatch`; moves the run in both poll recorders; reports the trust and the new failure-log kind from one place at the end of each recorder.
- `src/accessories/basementGuardian.ts` — `markMonitoring`, `monitoringDegradedScopes`, the third layer in `distrustReasonsOf`, `reasonsNow()` as the one place the whole reason map is assembled, and the corrected `reportDegradation()` predicate.
- `src/platform.ts` — the exported `applyMonitoringHealth` fan-out and the runtime callback that drives it.
- `features/support/world.ts` — calls the same exported fan-out over the same `DiscoveryContext` its two neighbours build.
- `features/support/fakeRestApi.ts` — `failEveryRequestWith` / `answerNormally`, beside the untouched one-shot `failNextWith`.
- `features/support/steps/shadow.ts` — `When the scenario clock moves forward by {int} seconds`.
- `features/support/steps/runtime.ts` — the two sustained-failure steps.
- `features/degradedOperation.feature` — five new scenarios.
- `test/runtime/accountRuntime.test.ts`, `test/accessories/basementGuardian.test.ts`, `test/platform.test.ts` — the runtime push, the scope mapping, the retained values, the frozen timestamp, and the fan-out.

## Decisions Made

- **The checkpoint answered `d-02`.** A REST-only degradation withdraws `connectivity` and only `connectivity`. No artifact changed: the six the checkpoint listed as changing under `d-04` all stayed as the plan specified, and `05-VALIDATION.md`'s two `REST down + shadow alive` rows were already written for `d-02`.
- **PA-01** resolved as the research recommended: the stamp is seeded at construction. The alternative left a shadow that never connects permanently trusted.
- **PA-02** resolved by following `D-02`. `Basement Guardian Offline` deactivates after two failed polls; the seven live-value scopes stay trusted.
- **The failure-log kind is `Live device reporting`,** a capitalized noun phrase reading as the subject of "Live device reporting recovered." The message names what stopped and what the plugin did about it, and nothing else.
- **`recordTrustedScopes` was left exactly as it is.** Under a monitoring degradation no scope advances, including `fault`, which is what `ControllerDataLastTrustedAt` publishes. That freeze is asserted rather than corrected.

## Mutation Testing

Every named mutation in `05-VALIDATION.md` that covers a behaviour in this plan was applied, watched to fail, reverted, and green restored. All eight:

| # | Mutation | What failed | Restored |
|---|---|---|---|
| 1 | `isRestDegraded`: `>=` → `> 0` | `monitoringHealth.test.ts` — `reports the polling path degraded as false after 1 consecutive failed poll(s)`; `starts a fresh run after a success, so one later failure does not degrade again` (2 of 20) | green, 20/20 |
| 2 | Shadow silence read from the socket flag instead of arrival times | 13 unit cases including `reports the shadow silent once two heartbeats have passed with no message`, `reports the shadow trusted over the same span once a message reached the reported-patch callback`, `reports the silent live connection once across three silent polls inside one reminder interval`; 24 Cucumber scenarios including all three new transport scenarios | green, 1250 unit / 83 scenarios |
| 3 | `MISSED_HEARTBEATS_BEFORE_SILENT` → `1` | `monitoringHealth.test.ts` — `publishes the thresholds it measures against`; `reports the shadow silent as false 898000 ms after the last message`; `… 1795999 ms …`; `measures the silence from the newest message, so a late arrival restarts the window`; `leaves the silence window where it was when a poll fails` (5 of 20) | green, 20/20 |
| 4 | `recordRestSuccess()` also clears the arrival stamp's effect | `monitoringHealth.test.ts` — `leaves the shadow silent when a poll succeeds, because a poll observed no live message` (1 of 20) | green, 20/20 |
| 5 | `offlineValues` reads the degradation instead of `offlineConfirmed` | `basementGuardian.test.ts` — six offline-adapter cases including `activates the offline adapter on disconnected poll 2 and not before` and `takes the documented default of two consecutive disconnected polls`; Cucumber — `Shadow silence withdraws trust while polling continues` and `Both monitoring paths lost withdraws every scope`, both on `Then the "Basement Guardian Offline" sensor is not activated` | green |
| 6 | Mark a live-value scope on any degradation rather than on shadow loss alone | `basementGuardian.test.ts` — `withdraws connectivity alone when only the polling path is degraded`; Cucumber — `Polling failure alone leaves the live values trustworthy` on `Then the "Sump Pit Flood" service reports "Status Active" as "true"` | green |
| 7 | Withdraw only on `polling === false` | `accountRuntime.test.ts` — `reports the polling path degraded on the second consecutive failure and trusted again on the next success`; `reports the shadow silent once two heartbeats have passed with no message`; `reports the silent live connection once …`; `announces the live connection recovered once …`; `names no route, no header, and no credential …` (5); Cucumber — 4 of the 5 new scenarios | green |
| 8 | Drive the clearing from the store's change filter instead of the arrival callback | Cucumber — `An identical heartbeat clears the shadow silence`, on `Then the "Sump Pit Flood" service reports "Status Active" as "true"` (1 of 83) | green, 83/83 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Four new scenarios asserted the right value for the wrong reason**

- **Found during:** Task 3, while the transport-matrix scenarios were first run.
- **Issue:** The scenarios published `water_level: 2` as the heartbeat that stamps a shadow arrival. `2` is not a legal vendor code — `src/device/gemini.ts:79` accepts `{0, 1, 3, 7, 15, 31}` — so the payload failed family validation and the `water` scope went `invalid`. `Sump Pit Flood` therefore reported `Status Active` as `false` because a field stopped validating, not because the shadow had gone quiet, and the tracer scenario committed in `0ca92a8` had been passing for that wrong reason. Two later scenarios failed outright, which is what exposed it: once `water` is permanently invalid, no recovery can restore the row.
- **Fix:** every heartbeat in `features/degradedOperation.feature` now publishes `water_level: 3`, a legal code distinct from the `1` the background seeds.
- **Files modified:** `features/degradedOperation.feature`
- **Verification:** the mutation table above is the real check — mutation 7 (withdraw only on `polling === false`) now fails the tracer scenario, which it could not have done while the row was deactivating for a validation failure.
- **Committed in:** `d7cf0c3`

**2. [Rule 3 - Blocking] Two existing assertions counted every warning and now share the log with a new diagnostic**

- **Found during:** Task 3, adding the `Live device reporting` failure-log kind.
- **Issue:** `reports a failed refresh through the rate-limited discipline rather than directly` and `reports no removal when the final-check fetch itself fails` both asserted `countOf(logged, 'warn')`. Each advances the harness clock past 1 796 000 ms with a fake shadow that never delivers a message, so both now legitimately see the new silence warning and both would have failed.
- **Fix:** both assertions were narrowed to name the line each case is actually about — `ROTATION_FAILED_LINE` and `DISCOVERY_FAILED_LINE` — through a new `countOfLine` helper. This is strictly stronger than the level count it replaces: the case now fails if the wording of its own line drifts, which the level count never would have caught.
- **Files modified:** `test/runtime/accountRuntime.test.ts`
- **Verification:** `npm run test:coverage:direct` over the `accountRuntime` pair reports 100/100/100 with 90 cases passing.
- **Committed in:** `d7cf0c3`

**3. [Rule 3 - Blocking] The `satisfies BasementGuardianAccessory` negative controls needed their directives moved**

- **Found during:** Task 2.
- **Issue:** adding `markMonitoring` to the interface pushed two `void ({...} satisfies …)` literals over the print width, so Prettier broke them across lines and each `@ts-expect-error` then pointed at `void ({`, where there is no error.
- **Fix:** each directive moved onto the property line that carries the error. A sixth negative control was added for an object missing `markMonitoring`.
- **Files modified:** `test/accessories/basementGuardian.test.ts`
- **Verification:** `tsc -p tsconfig.test.json` reports no unused-directive error.
- **Committed in:** `0ca92a8`

---

**Total deviations:** 3 auto-fixed (1 × Rule 1, 2 × Rule 3)
**Impact on plan:** Deviation 1 was the plan's own central hazard landing on this plan's own new scenarios, and catching it is the reason the mutation pass is not optional. No scope creep: nothing outside the plan's thirteen files changed.

## Issues Encountered

- **The RED/GREEN pairing is partly nominal for the wiring commit.** `0ca92a8` carries the tests plus the declarations they need to compile, and `markMonitoring` in it stores the trust without republishing. Seven accessory cases, five runtime cases and one platform case failed in that state, which is a real RED. The Cucumber tracer scenario, however, already passed in `0ca92a8`, because `update()` folds the stored trust and the harness poll interval is 50 ms — so the withdrawal arrived on the next poll rather than on the mark. In production, with a 900-second poll, that would have been a whole interval late. The unit cases are what caught it; the scenario alone would not have.
- **The three `Live device reporting` runtime cases in `d7cf0c3` were written after the code they cover,** not before. They are pinned by mutations 2 and 7 above rather than by having been watched to fail first.
- **Node 24.x was not available on this machine.** The gate ran green on Node 22.22.2 (a CI target, `/usr/bin/node`) and on the local Node 26.7.0. Node 24.x remains unverified locally and is covered by CI.

## Known Stubs

None. Every row this plan touches publishes from a real source, and no characteristic is fed a hardcoded or placeholder value.

## Threat Flags

None. No new network endpoint, auth path, file access pattern, or schema at a trust boundary. The one new log line is a fixed string naming no device, route, header, or credential, and a test asserts that.

## Verification

Run on Node 22.22.2 and Node 26.7.0. Node 24.x unavailable locally.

| Gate | Result |
|---|---|
| `npm run test:coverage:direct` — `monitoringHealth` pair | 20/20, 100 lines / 100 branches / 100 functions |
| `npm run test:coverage:direct` — `accountRuntime` pair | 90/90, 100 / 100 / 100 |
| `npm run test:coverage:direct` — `basementGuardian` pair | 132/132, 100 / 100 / 100 |
| `npm run test:cucumber` | 83 scenarios, 822 steps, all passing (78 → 83 scenarios, 753 → 822 steps) |
| `npm run check` | green (typecheck, lint, fallow, format:check, unit + Cucumber) |
| `npm run test:coverage:all` | 1250 tests, 100 / 100 / 100 over `dist-test/src/**/*.js` |

`npm run fallow` reports one pre-existing clone group in `features/support/steps/hap.ts:113-124` / `:168-181`. It predates this plan and was left alone.

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

Ready for plan 05-02. `MonitoringTrust` is now the contract three tiers read, and later plans add `commandTransportReady` and `credentialsRejected` to it. Two things a later plan must not undo:

- `markMonitoring` stores the handed value **outside** the unchanged-value early return, and the unchanged check covers every member of `MonitoringTrust`. A two-field comparison written after a third field lands would make the most common transport failure invisible.
- `monitoringPathNow()` is untouched and must stay so. Fourteen assertions and two Cucumber scenarios read its current values.

`REQUIREMENTS.md` still marks `RES-01` and `RES-03` `Complete` while its own delivery notes say Phase 5 owes part of both. That is pre-existing (introduced in Phase 3's `f73f692`) and, per `05-CONTEXT.md`, is reconciled at phase close-out rather than here.

---

*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-01*

## Self-Check: PASSED

Both created files exist on disk. All five task commits are reachable from `HEAD`, and each was confirmed non-empty with `git show --name-only --format=""` at the moment it was made.
