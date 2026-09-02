---
phase: "5"
slug: "degraded-operation-and-recovery"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-01"
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `05-RESEARCH.md` § Validation Architecture. Task IDs are filled by the planner.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (unit, compiled to `dist-test/` first) + `@cucumber/cucumber` ^13.2.1 (e2e over `features/`) |
| **Config file** | `cucumber.*` resolved by `cucumber-js` with no explicit `-c`; unit tests need none |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm test` (unit + Cucumber) |
| **Estimated runtime** | ~90 seconds for `npm test` |

**Additional local-only gates** (neither is in CI — `.github/workflows/build.yml` runs lint,
format:check, typecheck, fallow, `npm test`, build, audit):

| Gate | Command | Threshold |
|------|---------|-----------|
| Coverage | `npm run test:coverage:all` | 100 lines / 100 branches / 100 functions over `dist-test/src/**/*.js` |
| Health | `npm run fallow` | `maxCyclomatic: 20`, `maxCognitive: 15`, `maxUnitSize: 60`, `maxCrap: 0` |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`. The pre-commit hooks do **not** run tests
  (`.pre-commit-config.yaml` runs lint, format:check, typecheck, fallow only), so a RED commit is
  possible and is the intended `test(...)` → `feat(...)` shape.
- **After every plan wave:** Run `npm test` (unit + all Cucumber scenarios).
- **Before `/gsd-verify-work`:** `npm test` green **plus** `npm run test:coverage:all` at 100/100/100
  **plus** `npm run fallow` — on **both Node 22.x and 24.x**, because CI carries neither the coverage
  gate nor this developer's Node version.
- **Max feedback latency, per-task unit sampling:** ~30 seconds — `npm run test:unit`, and the
  focused `npm run test:coverage:direct` source/test pair each task runs first.
- **Max feedback latency, full-suite tasks:** ~90 seconds. Several tasks carry
  `npm run test:cucumber` or `npm run check` as an `<automated>` command because the behaviour they
  assert is end-to-end and has no unit equivalent, and plan 05-02 task 1 must run all 78 scenarios by
  construction. The 30-second figure is the sampling rate the executor gets between commits, not a
  ceiling on every command in the phase.

---

## Per-Task Verification Map

Every row names the **mutation that must fail it**. A test whose named mutation still passes is not
evidence — that is the rule this project paid for six times in Phase 4, and the reason
`04-VERIFICATION.md` W-1 exists.

Task IDs are assigned by the planner; the behaviour, command, and mutation columns are binding as
written here.

**Two rows depend on how D-02 and D-04 are read, and they are written for D-02.** `05-CONTEXT.md`
D-02 (narrowed) has a REST degradation *additionally* withdraw `connectivity`; D-04 says a REST-only
degradation does not mark HomeKit. They differ for exactly that one scope. The plans implement D-02,
so `Basement Guardian Offline` — whose row is `scope: 'connectivity'` — reports `Status Active` as
`false` on a REST-only degradation while every live-value service stays `true`. The
`REST down + shadow alive` rows in both tables below are written that way. **If the 05-01 decision
checkpoint answers `d-04`, revert both rows to "every service stays active" and drop the scope
qualifier from the paired mutation.**

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | 0 | RES-03 | — | Two consecutive REST failures mark the path degraded; one does not | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 — `test/runtime/monitoringHealth.test.ts` | ⬜ pending |
| TBD | TBD | 0 | RES-03 | — | Shadow silence is measured from message arrival, never from `shadowConnected` | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | RES-03 | — | One missed heartbeat is not silence; two is | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | RES-03 | — | A REST poll does not clear a shadow-silence degradation (D-11) | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | — | RES-03 | — | A monitoring-path failure never activates `Basement Guardian Offline` | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` (extend) | ⬜ pending |
| TBD | TBD | — | RES-03 | — | REST down + shadow alive leaves every live-value service `Status Active = true`, while `Basement Guardian Offline` alone withdraws (D-02) | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ⬜ pending |
| TBD | TBD | — | RES-03 | — | Shadow silent + REST alive sets `Status Active = false` on `Sump Pit Flood` while its `Leak Detected` value is retained | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ⬜ pending |
| TBD | TBD | — | RES-01 (not contradicted) | — | An **identical** heartbeat clears shadow silence | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ⬜ pending |
| TBD | TBD | — | RES-04 | — | A restored accessory reads `Status Active = false` before any poll lands | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` — **requires the Wave 0 harness change** | ⬜ pending |
| TBD | TBD | — | RES-04 | — | The restored accessory's last values are retained, not blanked | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ⬜ pending |
| TBD | TBD | 0 | RES-04 | — | No module under `src/accessories/` registers a read handler | unit (static) | `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | ❌ W0 — `test/accessories/accessoryReadPathScope.test.ts` | ⬜ pending |
| TBD | TBD | 0 | RES-04 | — | No module under `src/accessories/` imports the cloud client | unit (static) | `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | RES-04 | — | The gate is non-vacuous: it enumerated a floor of files | unit (static) | `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | — | RES-04 | — | A press with no valid state is refused `-70412` naming the state | unit | `node --test dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` (extend) | ⬜ pending |
| TBD | TBD | — | RES-04 | — | A press with no command transport is refused `-70412` naming the transport | unit | `node --test dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` | ⬜ pending |
| TBD | TBD | — | RES-04 | — | With both true, the log names the agreed one | unit | `node --test dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` | ⬜ pending |
| TBD | TBD | — | RES-04 | — | The command transport is unready for good once the runtime has halted, so nothing can send after a credential rejection | unit | `node --test dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` (extend) | ⬜ pending |
| TBD | TBD | — | RES-04 | — | The terminal authentication branch pushes `commandTransportReady` false with `credentialsRejected` true, and nothing reaches the cloud after it | unit | `node --test dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ⬜ pending |
| TBD | TBD | — | RES-04 | — | A `markMonitoring` push differing only in `commandTransportReady` changes the answer the binder's predicate gives | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` (extend) | ⬜ pending |
| TBD | TBD | — | RES-04 | — | Credential rejection makes a read throw and retains the value | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js dist-test/test/accessories/staleMarking.test.js` | `test/accessories/serviceCatalogue.test.ts`, `test/accessories/staleMarking.test.ts` (extend) | ⬜ pending |
| TBD | TBD | — | RES-04 | — | Credential rejection is the **only** cause that does this | unit | `node --test dist-test/test/platform.test.js` | `test/platform.test.ts` (extend) | ⬜ pending |
| TBD | TBD | — | CONF-05 | — | The degradation thresholds are not configurable | unit | `node --test dist-test/test/config.test.js` | `test/config.test.ts` (assert the resolved config's key set is unchanged) | ⬜ pending |

### Gap-closure round rows (plans 05-06 to 05-10)

Added 2026-09-02 after `05-VERIFICATION.md` returned `gaps_found`. Every row below states the
behaviour as **what a basement owner must observe**, not as what the implementation does. That is the
correction this round encodes: the first round applied every named mutation and CR-01 shipped anyway,
because the mutations tested whether the tests could see the implemented behaviour change, not
whether the implemented behaviour was right.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T2 | 05-06 | 1 | RES-03 | T-05-19 | A flooded pit polled on a healthy transport while the live path is silent reaches `Leak Detected = 1` in HomeKit, with `Status Active` false | e2e | `npm run test:cucumber -- --name "flooded pit reaches Apple Home"` | `features/degradedOperation.feature` | ⬜ pending |
| T2 | 05-06 | 1 | RES-03 | T-05-21 | A field that failed family validation still publishes nothing at all | unit | `npm run test:coverage:direct -- dist-test/src/accessories/serviceCatalogue.js dist-test/test/accessories/serviceCatalogue.test.js` | `test/accessories/serviceCatalogue.test.ts` | ⬜ pending |
| T3 | 05-06 | 1 | RES-03 | T-05-20 | Under a total transport blackout `Pump Controller Link Lost` keeps its verdict and reports `Status Active` false | e2e | `npm run test:cucumber -- --name "blind plugin vouches for no controller-link verdict"` | `features/degradedOperation.feature` | ⬜ pending |
| T3 | 05-06 | 1 | RES-04 | T-05-22 | A press during a monitoring outage is still refused, so the write gate did not widen with the publishing predicate | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ⬜ pending |
| T1 | 05-06 | 1 | RES-04 | T-05-23 | A step claiming a service answers a read fails when the characteristic is absent | e2e | `npm run test:cucumber -- --name "A transport outage leaves every service readable"` | `features/support/steps/homekit.ts` | ⬜ pending |
| T1 | 05-07 | 2 | RES-04 | T-05-24 | A credential refused after a healthy start pushes the terminal trust and logs the authentication stop, not the generic discovery line | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ⬜ pending |
| T1 | 05-07 | 2 | RES-04 | T-05-25 | An hour after a mid-run refusal, no inventory call, no credential call and no shadow attempt has been made | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ⬜ pending |
| T3 | 05-07 | 2 | RES-04 | T-05-24 | An owner who changes their vendor password while Homebridge runs finds the accessory unreadable with its readings kept | e2e | `npm run test:cucumber -- --name "after a healthy start"` | `features/degradedOperation.feature` | ⬜ pending |
| T2 | 05-07 | 2 | RES-04 | T-05-26 | `stop()` pushes one trust whose command transport is unready, and marks no scope | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ⬜ pending |
| T1 | 05-08 | 3 | RES-03 | T-05-29 | A message arriving after a silence restores the trust with no clock movement and no poll | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ⬜ pending |
| T1 | 05-08 | 3 | RES-03 | T-05-30 | A healthy live connection produces no push per heartbeat | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ⬜ pending |
| T2 | 05-08 | 3 | RES-03 | T-05-32 | An identical heartbeat clears the silence while the plugin's device polling is parked at the vendor | e2e | `npm run test:cucumber -- --name "before the next poll"` | `features/degradedOperation.feature` | ⬜ pending |
| T1 | 05-09 | 4 | RES-04 | T-05-34 | A press on a restored control after a failed restart is refused with the transport status and a named cause | unit | `npm run test:coverage:direct -- dist-test/src/accessories/controls.js dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` | ⬜ pending |
| T1 | 05-09 | 4 | RES-04 | T-05-36 | A refused press leaves the control readable once the clearing push has run | unit | `npm run test:coverage:direct -- dist-test/src/accessories/controls.js dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` | ⬜ pending |
| T1 | 05-09 | 4 | RES-04 | T-05-35 | The accessory's own binder replaces the refusing handler, so a recovered plugin operates its controls | unit | `npm run test:coverage:direct -- dist-test/src/accessories/staleMarking.js dist-test/test/accessories/staleMarking.test.js` | `test/accessories/staleMarking.test.ts` | ⬜ pending |
| T2 | 05-09 | 4 | RES-04 | T-05-34 | A press on a restored control is refused, sends nothing, and leaves the control readable | e2e | `npm run test:cucumber -- --name "restored control is refused"` | `features/degradedOperation.feature` | ⬜ pending |
| T1 | 05-09 | 4 | RES-04 | T-05-38 | The three restart-time passes share one guarded walk and the health gate reports no duplication | unit (gate) | `npm run fallow` | `.fallowrc.json` | ⬜ pending |
| T2 | 05-10 | 5 | RES-03, RES-04 | T-05-39 | Every documentation claim about degraded operation is traceable to a passing assertion | manual | `npm run check` | `README.md`, `CHANGELOG.md` | ⬜ pending |

### Named mutations

Each row's mutation is the proof its test is not vacuous. Apply the mutation, confirm the named test
fails, revert, confirm green.

| Behaviour | Mutation that must fail it |
|---|---|
| Two consecutive REST failures degrade | Change `>=` to `> 0` in `isRestDegraded` |
| Shadow silence from arrival times | Replace `isShadowSilent` with `() => !shadowConnected` |
| One missed heartbeat is not silence | Change `MISSED_HEARTBEATS_BEFORE_SILENT` to `1` |
| A REST poll does not clear shadow silence | Make `recordRestSuccess()` also clear `lastShadowMessageAt`'s effect |
| Monitoring failure never activates Offline | Make `offlineValues` read the degradation instead of `offlineConfirmed` |
| REST down + shadow alive keeps live-value services active | Mark a **live-value** scope on any degradation rather than on shadow loss alone |
| Shadow silent + REST alive withdraws | Withdraw only on `polling === false` |
| Identical heartbeat clears silence | Drive the clearing from `store.subscribe` instead of `onReportedPatch` |
| Restored accessory reads inactive | Delete the `configureAccessory` marking pass |
| Restored values retained | Push a format default instead of only `StatusActive` |
| No read handler under `src/accessories/` | Plant `.onGet(() => false)` in `publishRow` |
| No cloud import under `src/accessories/` | Plant `import { createCloudApi } from '../cloud/api.js';` in `basementGuardian.ts` |
| Static gate is non-vacuous | Point `REPOSITORY_ROOT` one level wrong |
| No-valid-state refusal | Remove `hasNoFreshState` from `LOCAL_REFUSALS` |
| No-transport refusal | Remove the new rule |
| Refusal precedence | Reorder `LOCAL_REFUSALS` |
| Transport unready for good after a halt | Make `commandTransportReadyNow()` ignore `halted` |
| Terminal branch reports the unready transport | Delete the push from `launchFailure`'s terminal branch |
| A push differing only in `commandTransportReady` reaches the binder | Make `markMonitoring` return before storing when `restDegraded` and `shadowSilent` are unchanged |
| Credential rejection throws on read | Push `false` instead of a `HapStatusError` |
| Only credential rejection throws | Make the shadow-silence path push a `HapStatusError` too |
| Thresholds not configurable | Add a knob |

### Gap-closure round mutations (plans 05-06 to 05-10)

Each mutation below is one a **correct** implementation survives and the shipped one fails. That is
the difference from the first round's table, where several mutations only proved a test could see the
implemented behaviour move.

| Behaviour | Mutation that must fail it |
|---|---|
| A flooded poll during shadow silence reaches the tile | Point the row projection back at the un-narrowed trust predicate, so a monitoring cause withholds again |
| A validation failure still withholds | Add `invalid` to the exempted-reason set |
| A blackout leaves the controller-link row untrusted | Move the monitoring layer back below the controller-link layer in `distrustReasonsOf` |
| A press is still refused during a monitoring outage | Route `reportedControlValue` through the publishing predicate |
| A read assertion cannot pass on an absence | Assert a read for a characteristic the service does not carry, and watch the step fail by name |
| A mid-run credential refusal reaches the terminal branch | Remove the terminal guard from `runPoll`'s catch |
| A refusal on a credential rotation reaches the terminal branch | Remove the terminal guard from `refreshCredentials`'s catch |
| Nothing wakes after a halt | Leave the poll loop's condition without the halted flag |
| The scenario meets a real re-grant rather than the restart path | Remove the step that shortens the token lifetime, and watch the scenario fail for want of a refusal |
| `stop()` tells the tier the transport is unready | Delete the push from `stop()` |
| A shutdown marks no scope | Push both degradation members true from `stop()` |
| A returning message restores trust with no poll | Delete the report from the arrival callback |
| The arrival reports once per recovery | Report from the arrival unconditionally, with no latch guard |
| An identical heartbeat clears the silence | Drive the report from a snapshot subscription instead of the arrival callback |
| The recovery scenario cannot pass on a poll tick | Delete the arrival report and confirm the new scenario fails while the pre-existing identical-heartbeat scenario stays green |
| A restored control refuses a press | Remove the pass's call from `configureAccessory` |
| A refused press leaves the control readable | Drop the clearing push from the restored-control refusal |
| Only control services gain a handler | Bind the refusal to every restored service rather than to those carrying the write surface |
| The refusal answers the transport status | Change the refusal's status to the busy status |
| The harness drives the real pass | Remove the pass's call from the harness stand-in for `configureAccessory` |

---

## Wave 0 Requirements

- [ ] `test/runtime/monitoringHealth.test.ts` — covers RES-03's threshold and clearing rules
- [ ] `test/accessories/accessoryReadPathScope.test.ts` — D-09's static gate, modelled on
      `test/accessories/hapImportScope.test.ts`
- [ ] **`features/support/fakeHomebridgeApi.ts` — `restoreCachedAccessories()` must carry services
      and their last characteristic values (and the `pushed` flag) across a restart.** Without this
      change every `D-06` scenario is vacuous. This is the single highest-value item in Wave 0 and it
      reverses a documented deliberate choice (`fakeHomebridgeApi.ts:106-110`), so the plan must
      record the reversal and re-run all 78 existing scenarios immediately after it.
- [ ] **An exported marking function that both `platform.configureAccessory` and
      `world.restoredAccessories()` call** — otherwise the harness tests its own copy of the
      behaviour (`world.ts:571-585` stands in for `configureAccessory` rather than calling it).
- [ ] A Cucumber step reading `Status Active` on a named service. The generic step
      `Then the {string} service reports {string} as {string}` already exists
      (`features/support/steps/homekit.ts:123`) and resolves values through `pushedValue`, which
      distinguishes a pushed value from a format default
      (`features/support/publishedServices.ts:50-52`). Confirm it reaches `Status Active` by name;
      if not, that is the only new step needed.
- [ ] A step making the fake broker connect and then stay silent while the scenario advances the
      clock. The broker publishes only when a step tells it to
      (`features/support/fakeShadowBroker.ts:203-211`), so silence needs no new fake capability —
      only a `When the scenario advances the clock by N seconds` step if one does not already exist.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A restored accessory carrying **pre-release** cached characteristics marks stale on upgrade | RES-04 | No test has met a real Homebridge cache; the harness restores context through a JSON round trip. Inherited from Phase 4 human item 1. | Install over an existing cached accessory, restart Homebridge with the cloud unreachable, confirm the tile shows `Status Active — No` with its previous value retained |
| Apple Home surfaces the degraded marking on a real paired home | RES-03, RES-04 | Apple Home rendering cannot be asserted from the plugin side | Force a degraded scope, confirm the `Status Active` row reads `No` and the tile stays present. Rides along with the open `G-003` / `G-004` session |

---

## The end-to-end blindness this phase must not inherit

`04-VERIFICATION.md` W-1 records that mutating away the pending-window withholding killed 2 unit
cases and left all 78 Cucumber scenarios green. The root cause is that no scenario asserted a value
the withholding controls. Phase 5's answer is structural, not aspirational:

1. **Every projection behaviour above has an e2e row that asserts `Status Active` by value**, not
   merely that a service exists. Existence is what 78 scenarios already assert, and it is what
   stayed green.
2. **The harness gains the restored service surface**, so the restart assertions have something to
   be wrong about.
3. **Every row names its mutation.** The verification step for each is: apply the mutation, confirm
   the named test fails, revert, confirm green.
4. **At least one recovery scenario publishes an identical heartbeat**, so the clearing path is
   tested against the case the store filters out rather than the case it passes through.

---

## Planning hazards and deferrals recorded for this phase

Recorded on 2026-09-01 during plan revision. None of these is a plan change; each is a fact a later
reader would otherwise have to rediscover.

**A press after credential rejection has no e2e row, deliberately.** The map previously carried
"A press after credential rejection is refused locally, not via a vendor round trip" as an e2e over
`features/officialControls.feature`. It is not buildable. `halted` is set in exactly one place — the
terminal branch inside `launchFailure` in `src/runtime/accountRuntime.ts` — reached only from
`launch()`. A run whose launch failed never reaches `applyDevices`, so `onTrustworthyInventory` never
fires, `registerDiscoveredDevices` never runs, and no `BasementGuardianAccessory`, and therefore no
`onSet` handler, exists on any restored accessory. A press on a restored switch is not refused; it is
never routed. `features/support/fakeHap.ts`'s `handleSetRequest` with no handler stores the value and
returns, so `Then the vendor receives no command` would pass for a reason unrelated to the transport
predicate, and the mutation this map paired with the row — deleting the transport predicate — would
leave it green. The claim is carried by the two unit rows above it instead, both falsifiable.

**A residual gap that follows from the same fact, not closed here.** On a halted restart, a press on
a restored switch silently appears to succeed in HomeKit while doing nothing. It predates this phase,
it sits outside `RES-04`'s "commands stay disabled until valid state and command transport return" —
which governs commands the plugin can route — and closing it needs a decision about whether a
restored accessory should carry a refusing binder at all. It belongs in its own phase.

**The two credential-rejection unit rows moved file.** They read
`test/accessories/basementGuardian.test.ts` and now read `serviceCatalogue`, `staleMarking` and
`platform`. The unreadable pass never constructs a `BasementGuardianAccessory` — a halted run has
none, which is the whole reason plan 05-04 walks the platform's own accessory map — so the behaviour
cannot live in that file. The map was wrong, not the plan.

**`check.decision-coverage-plan` failed on two wrapped decision titles, and now passes.** The
paragraph here previously recorded the gate as non-functional against this repository. That was
half right, and the half it got wrong matters, so the correction is kept rather than the claim.

Two things were true at once. Called as the plan-phase workflow calls it —
`check.decision-coverage-plan <phase-dir> <context-path>` — the gate returned
`passed: false, reason: "could-not-parse"`, naming D-06 and D-12. Called with the arguments the
other way round it returned `passed: true, skipped: true, "no trackable decisions"` — a vacuous
pass, which is the more dangerous reading and the one first recorded here.

The cause was formatting, not the `- **D-01 — Title:**` form. D-06's and D-12's titles were long
enough to wrap, putting the closing `:**` on a second line where the parser could not see it. The
two titles were joined onto one line on 2026-09-01 — whitespace only, since a soft break inside a
bold span renders as a space, so no decision text changed. The gate now reports
`passed: true, total: 12, covered: 12`, which agrees with the coverage the plan checker had already
derived by hand.

**The lesson worth keeping is the argument order.** A reversed call turns this gate's failure into a
silent pass, and nothing in its output says which call it answered. Pass the phase directory first.

**Plan 05-01 is over the smart-zone context budget and is not split.** 115000 calibrated against
100000, 13 files, confidence `low` on `sample_count: 0`. The declined split is argued in the plan
itself: four modules sit between a transport fact and a HomeKit characteristic, and removing any one
leaves the tracer's claim unproven end to end. Over-budget is advisory, never blocking. Recorded so
the executor watches actual context use through that plan rather than assuming headroom.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for per-task unit sampling; the full-suite commands are named above and bounded at ~90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
