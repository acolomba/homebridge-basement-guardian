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

**Status vocabulary.** Added 2026-09-03 by quick task 260903-ho5. Every cell in the Status column of
this table and of the second gap-closure round table carries one of these four strings:

- `✅ shipped` — the named test exists, is green, and the row's named mutation was applied and failed
  a test at the tier the row's own Automated Command runs. Nothing else is recorded against it.
- `⚠️ green, mutation failed nothing` — the named test is green and the named mutation left every
  tier green. The cell names what pins the behaviour instead, or says that nothing does.
- `⚠️ green, blind at this tier` — the named test is green and the named mutation fails only at a
  tier the row's own Automated Command does not run. The cell names the tier that carries it.
- `⚠️ shipped, blind to CR-0N` — the named mutation did fail at the row's own tier, and the Test
  Quality Audit in commit `4631d46` separately marks the test that carries the row blind to blocker
  CR-0N, which then shipped. The cell names the tier and the blocker.

A mutation and an audit ask two different questions. A mutation asks whether the test can see the
implementation move. The audit asks whether the test can see the implementation be wrong. A row can
pass the first and fail the second, which is why the fourth string exists.
| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | 05-01 | 0 | RES-03 | — | Two consecutive REST failures mark the path degraded; one does not | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 — `test/runtime/monitoringHealth.test.ts` | ✅ shipped — 05-01 mutation 1 failed 2 of 20 cases in `monitoringHealth.test.ts`, the module this row's own command runs |
| TBD | 05-01 | 0 | RES-03 | — | Shadow silence is measured from message arrival, never from `shadowConnected` | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 | ✅ shipped — 05-01 mutation 2 failed 13 unit cases in `monitoringHealth.test.ts` and 24 scenarios |
| TBD | 05-01 | 0 | RES-03 | — | One missed heartbeat is not silence; two is | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 | ✅ shipped — 05-01 mutation 3 failed 5 of 20 cases in `monitoringHealth.test.ts` |
| TBD | 05-01 | 0 | RES-03 | — | A REST poll does not clear a shadow-silence degradation (D-11) | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 | ✅ shipped — 05-01 mutation 4 failed 1 of 20 cases in `monitoringHealth.test.ts`, on `leaves the shadow silent when a poll succeeds` |
| TBD | 05-01 | — | RES-03 | — | A monitoring-path failure never activates `Basement Guardian Offline` | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` (extend) | ✅ shipped — 05-01 mutation 5 failed six offline-adapter cases in `basementGuardian.test.ts` and two Cucumber scenarios, both on `the "Basement Guardian Offline" sensor is not activated`, which is this row's own tier and own assertion. Probe P3 in commit `4631d46` measured the same behaviour by execution. The blind assertion the audit names in the shared scenario is about `Sump Pit Flood`; see the note below |
| TBD | 05-01 | — | RES-03 | — | REST down + shadow alive leaves every live-value service `Status Active = true`, while `Basement Guardian Offline` alone withdraws (D-02) | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ✅ shipped — 05-01 mutation 6 failed `basementGuardian.test.ts` and the Cucumber scenario `Polling failure alone leaves the live values trustworthy`, this row's own tier |
| TBD | 05-01 | — | RES-03 | — | Shadow silent + REST alive sets `Status Active = false` on `Sump Pit Flood` while its `Leak Detected` value is retained | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ⚠️ shipped, blind to CR-01 — 05-01 mutation 7 failed 4 of the 5 new Cucumber scenarios, this row's own tier. Commit `4631d46`'s audit marks the carrying scenario `Shadow silence withdraws trust while polling continues` blind to CR-01: it polls with unchanged telemetry and asserts `the "Sump Pit Flood" sensor is not activated` after a dry poll, which is this row's retained-value clause and passes whichever way the code behaves |
| TBD | 05-01 | — | RES-01 (not contradicted) | — | An **identical** heartbeat clears shadow silence | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ⚠️ shipped, blind to CR-02 — 05-01 mutation 8 failed exactly one thing in the suite, the Cucumber scenario `An identical heartbeat clears the shadow silence`, 1 of 83: this row's own tier and own scenario. Commit `4631d46`'s audit marks that scenario blind to CR-02, because it runs under a short poll interval, so a clearing driven by a poll tick and one driven by the arrival read the same |
| TBD | 05-02 | — | RES-04 | — | A restored accessory reads `Status Active = false` before any poll lands | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` — **requires the Wave 0 harness change** | ⚠️ green, blind at this tier — 05-02 mutation 1b, the row's literal wording, deleted the `configureAccessory` call site and left Cucumber green at 4 of 4 restart scenarios; `test/platform.test.ts` failed alone. Form 1a, deleting the marking from the pass, did fail both restart scenarios, so only the call-site half is blind here. WINDOWS ledger 1 records it, and `05-VERIFICATION.md` M11 re-measured it at 5 unit and 0 scenarios |
| TBD | 05-02 | — | RES-04 | — | The restored accessory's last values are retained, not blanked | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ✅ shipped — 05-02 mutation 2 failed the Cucumber scenario `A restart retains the values it marks stale` on `Water Level`, this row's own tier, plus `staleMarking.test.ts` and `platform.test.ts` |
| TBD | 05-03 | 0 | RES-04 | — | No module under `src/accessories/` registers a read handler | unit (static) | `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | ❌ W0 — `test/accessories/accessoryReadPathScope.test.ts` | ✅ shipped — 05-03 mutation 7 failed `accessoryReadPathScope.test.ts`, the module this row's own command runs, naming `src/accessories/basementGuardian.ts` |
| TBD | 05-03 | 0 | RES-04 | — | No module under `src/accessories/` imports the cloud client | unit (static) | `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | ❌ W0 | ✅ shipped — 05-03 mutation 8 failed `accessoryReadPathScope.test.ts`, the module this row's own command runs, on `no module in the accessories tier can reach the vendor` |
| TBD | 05-03 | 0 | RES-04 | — | The gate is non-vacuous: it enumerated a floor of files | unit (static) | `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | ❌ W0 | ✅ shipped — 05-03 mutation 9 failed both real gate cases in `accessoryReadPathScope.test.ts`, reporting that the gate had enumerated 0 modules where the repository holds 10 |
| TBD | 05-03 | — | RES-04 | — | A press with no valid state is refused `-70412` naming the state | unit | `node --test dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` (extend) | ✅ shipped — 05-03 mutation 1 failed 5 unit cases including `controls.test.ts`, the module this row's own command runs, plus the Cucumber press scenario |
| TBD | 05-03 | — | RES-04 | — | A press with no command transport is refused `-70412` naming the transport | unit | `node --test dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` | ✅ shipped — 05-03 mutation 2 failed 9 unit cases across `controls.test.ts` and `basementGuardian.test.ts`, plus the Cucumber transport scenario on the write reading -70402 |
| TBD | 05-03 | — | RES-04 | — | With both true, the log names the agreed one | unit | `node --test dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` | ✅ shipped — 05-03 mutation 3 failed exactly one case in `controls.test.ts`, `names the missing transport alone when the plugin has neither fresh state nor a way to send`, out of 179 |
| TBD | 05-03 | — | RES-04 | — | The command transport is unready for good once the runtime has halted, so nothing can send after a credential rejection | unit | `node --test dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` (extend) | ⚠️ green, mutation failed nothing — 05-03 mutation 4 failed nothing: 1269 unit tests and 87 scenarios all passed (`05-03-SUMMARY.md:260`, WINDOWS ledger 2). What pins the behaviour is later work, not this row's own test. `05-VERIFICATION.md` M12 re-ran the same mutation on 2026-09-03 and it now fails 2 unit cases and 1 scenario, because WR-03's scope withdrawal and 05-16's cases made the term load-bearing. Ledger 2 reads fixed and its wording is stale |
| TBD | 05-03 | — | RES-04 | — | The terminal authentication branch pushes `commandTransportReady` false with `credentialsRejected` true, and nothing reaches the cloud after it | unit | `node --test dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped — 05-03 mutation 5 failed 1 of 1269 in `accountRuntime.test.ts`, the module this row's own command runs |
| TBD | 05-03 | — | RES-04 | — | A `markMonitoring` push differing only in `commandTransportReady` changes the answer the binder's predicate gives | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` (extend) | ✅ shipped — 05-03 mutation 6 failed 4 cases in `basementGuardian.test.ts`, the module this row's own command runs, plus 10 Cucumber scenarios |
| TBD | 05-04 | — | RES-04 | — | Credential rejection makes a read throw and retains the value | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js dist-test/test/accessories/staleMarking.test.js` | `test/accessories/serviceCatalogue.test.ts`, `test/accessories/staleMarking.test.ts` (extend) | ✅ shipped — 05-04 mutation 1 failed cases in `serviceCatalogue.test.ts` and `staleMarking.test.ts` by name, which are this row's own two modules, plus the Cucumber credential scenario |
| TBD | 05-04 | — | RES-04 | — | Credential rejection is the **only** cause that does this | unit | `node --test dist-test/test/platform.test.js` | `test/platform.test.ts` (extend) | ✅ shipped — 05-04 mutation 2 failed 2 cases in `platform.test.ts`, the module this row's own command runs, and left the credential scenario green as its control |
| TBD | 05-05 | — | CONF-05 | — | The degradation thresholds are not configurable | unit | `node --test dist-test/test/config.test.js` | `test/config.test.ts` (assert the resolved config's key set is unchanged) | ✅ shipped — 05-05 applied the named knob mutation as a real setting and failed 1 of 62 in `config.test.ts`, the module this row's own command runs. The other 61 widened in silence, which is the result the hand-written key list exists to catch |

### First-round reconciliation (quick task 260903-ho5, 2026-09-03)

The 22 rows above read `⬜ pending` until this date. They now carry a measured status each.

**The route.** Plan 05-10 reconciled the gap-closure rows by looking each row up in its plan's
summary. The first-round rows carry `TBD` in their Task ID column, so that route had nothing to look
up. A second route works and this task used it: each row has an entry in the `### Named mutations`
table below, in the same order, and each of those mutations has a measured outcome in a first-round
summary. Four summaries record theirs in a `## Mutation Testing` table; `05-05` records its single
mutation in prose, under `## The mutation, and what it proved`. The basis existed by a different
route than the one 05-10 tried. A later reader does not need to repeat the search.

**The counts.** 18 rows read `✅ shipped`. 2 read a `⚠️ green` status. 2 read `⚠️ shipped, blind to
CR-0N`. The Plan column now names a summary for all 22 rows, so no row was left uncovered.

**The four rows that are not plain shipped.**

- Row 7, `Shadow silent + REST alive sets Status Active false on Sump Pit Flood`. Its mutation
  discriminated at its own tier: `05-01` mutation 7 failed 4 of the 5 new Cucumber scenarios. The
  audit in commit `4631d46` still marks its carrying scenario blind to CR-01.
- Row 8, `An identical heartbeat clears shadow silence`. `05-01` mutation 8 failed 1 scenario of 83,
  its own. The audit marks that scenario blind to CR-02.
- Row 9, `A restored accessory reads Status Active false before any poll`. The row's literal
  mutation, `05-02` form 1b, left Cucumber green at 4 of 4 restart scenarios. WINDOWS ledger 1.
- Row 17, `The command transport is unready for good once the runtime has halted`. `05-03` mutation 4
  failed nothing at all. WINDOWS ledger 2.

**Two findings this reconciliation measured, which the plan that ordered it did not predict.**

1. Row 5 is plain `✅ shipped`, not blind. The task was told to expect rows 5 and 7 to share the
   blind finding. Reading the scenario decides against it. `Shadow silence withdraws trust while
   polling continues` ends in four assertions. The audit names exactly one of them as the blind one,
   `the "Sump Pit Flood" sensor is not activated` after a dry poll, and that assertion is row 7's
   retained-value clause. Row 5's own assertion in the same scenario is `the "Basement Guardian
   Offline" sensor is not activated`, which the audit does not name, and CR-01 does not touch the
   Offline adapter's activation rule. Probe P3 in the same report measured row 5's behaviour by
   execution and found it real. Marking row 5 blind would state the opposite of a measurement in the
   report that supplies the blind finding.
2. Row 17's null result no longer reproduces. `05-03` measured its mutation failing nothing, and
   ledger 2 records that. The third verification re-ran the same mutation as M12 on 2026-09-03 and
   it fails 2 unit cases and 1 scenario, because WR-03's scope withdrawal and 05-16's cases made the
   term load-bearing. The row keeps its `⚠️ green` status, because the row is about its own named
   test and its own named mutation, and the tests that now pin the term were written by later
   rounds. The cell says where it is pinned today. Ledger 2 reads `fixed` with no reason recorded,
   so its wording still asserts a fact that no longer holds; a new ledger entry records that.

**The mapping disagreement, reported rather than resolved.** WINDOWS ledger 13 and plan 05-10's
paragraph both say three of these rows are the ones the first verifier found green but blind. Commit
`4631d46` counts six blind-but-green tests on phase-central behaviour, of which three carry the
literal `BLIND to CR-01/02/03` label. Those three are scenarios, not rows, and they do not map onto
three rows. `Shadow silence withdraws trust while polling continues` lands on row 7. `An identical
heartbeat clears the shadow silence` lands on row 8. `Credential rejection makes every service
unreadable` lands on no row at all: it is an end-to-end scenario, and both credential rows in this
table state unit-level behaviour as their Secure Behavior. The criterion is subject matter. The
scenario is executed by the bare `npm run test:cucumber` that rows 5 through 10 carry, because that
command runs the whole suite with no name filter; no row states the behaviour it covers. So the step
from three blind scenarios to three blind rows is an inference, and no artifact states it. This task
does not pick one source over the other.

**A missing row.** The first round never wrote an end-to-end row for the credential refusal. That is
why the audit's third blind finding has nowhere to be recorded. It is a hole in the map, not a status
on a row.

**What the third verification adds without changing a row.** It re-measured SC-1 through SC-4 by
execution and reports 4 of 4 with all four blockers closed. A behaviour whose first-round row is
blind may be pinned today by an assertion a later round added. Row 17's cell says where it is pinned
now. No row's status was upgraded on that basis, because each row is a claim about its own named test
and its own named mutation.

### Gap-closure round rows (plans 05-06 to 05-11)

Added 2026-09-02 after `05-VERIFICATION.md` returned `gaps_found`. Every row below states the
behaviour as **what a basement owner must observe**, not as what the implementation does. That is the
correction this round encodes: the first round applied every named mutation and CR-01 shipped anyway,
because the mutations tested whether the tests could see the implemented behaviour change, not
whether the implemented behaviour was right.

**Reconciled 2026-09-02 by plan 05-10, against the six summaries rather than against the plans.**
Every row below was checked for three things: does the behaviour it names match the behaviour an
executor actually asserted, does the automated command match the one that was run, and does the
named file exist. Twenty-five rows were confirmed unchanged. Four were corrected, each marked in
place: the validation-failure row named one of the two withholding causes it covers; the shared-walk
row claimed the duplication gate as evidence, which 05-09 measured and disproved; the
scenario-repair row said three scenarios where four were affected and described a repair that does
not work; and the documentation row carried the wrong task ID. One row was added, for the
credential-rotation refusal that 05-07 shipped and the mutations table already named but no row
carried. Three mutations were corrected where the executor found the named form inexpressible or
unreachable, and three were added for rows that had none. **Nothing in the first-round table above
was touched**, including the two `REST down + shadow alive` rows, and no table was duplicated. The
first-round rows still read `⬜ pending` when this plan ran: it verified the gap-closure round against
its summaries and had no equivalent basis for the first round, and three of those rows were taken to
be the ones `05-VERIFICATION.md` found green but blind, so marking them shipped would have asserted
the opposite of what the verifier measured. **Superseded 2026-09-03.** Quick task 260903-ho5
reconciled those 22 rows through the `### Named mutations` table instead, which the first-round
summaries do measure. See `### First-round reconciliation` above, which also reports that the step
from three blind scenarios to three blind rows is an inference no artifact states.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T2 | 05-06 | 1 | RES-03 | T-05-19 | A flooded pit polled on a healthy transport while the live path is silent reaches `Leak Detected = 1` in HomeKit, with `Status Active` false | e2e | `npm run test:cucumber -- --name "flooded pit reaches Apple Home"` | `features/degradedOperation.feature` | ✅ shipped |
| T2 | 05-06 | 1 | RES-03 | T-05-21 | **Corrected 2026-09-02.** A field that failed family validation, and a scope a lost controller link poisoned, both still publish nothing at all. The row named the validation half alone; 05-06 asserted both, and the mutations table names one mutation for each | unit | `npm run test:coverage:direct -- dist-test/src/accessories/serviceCatalogue.js dist-test/test/accessories/serviceCatalogue.test.js` | `test/accessories/serviceCatalogue.test.ts` | ✅ shipped |
| T3 | 05-06 | 1 | RES-03 | T-05-20 | Under a total transport blackout `Pump Controller Link Lost` keeps its verdict and reports `Status Active` false | e2e | `npm run test:cucumber -- --name "blind plugin vouches for no controller-link verdict"` | `features/degradedOperation.feature` | ✅ shipped |
| T2 | 05-06 | 1 | RES-03 | T-05-20 | With both transports down and the controller link intact, neither `Basement Guardian Offline` nor `Pump Controller Link Lost` is activated by the outage itself — the monitoring failure marks, it raises no alarm | unit | `npm run test:coverage:direct -- dist-test/src/accessories/serviceCatalogue.js dist-test/test/accessories/serviceCatalogue.test.js` | `test/accessories/serviceCatalogue.test.ts` | ✅ shipped |
| T2 | 05-06 | 1 | RES-03 | T-05-19 | A tile whose scope is untrusted for the monitoring cause alone is on the accessory while the outage is in force, so an owner does not wait a further poll — up to an hour — for it to appear after recovery (WR-08) | unit | `npm run test:coverage:direct -- dist-test/src/accessories/serviceCatalogue.js dist-test/test/accessories/serviceCatalogue.test.js` | `test/accessories/serviceCatalogue.test.ts` | ✅ shipped |
| T3 | 05-06 | 1 | RES-04 | T-05-22 | A press during a monitoring outage is still refused, so the write gate did not widen with the publishing predicate | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T1 | 05-06 | 1 | RES-04 | T-05-23 | A step claiming a service answers a read fails when the characteristic is absent | e2e | `npm run test:cucumber -- --name "A transport outage leaves every service readable"` | `features/support/steps/homekit.ts` | ✅ shipped |
| T1 | 05-07 | 2 | RES-04 | T-05-24 | A credential refused after a healthy start pushes the terminal trust and logs the authentication stop, not the generic discovery line | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T1 | 05-07 | 2 | RES-04 | T-05-24 | **Added 2026-09-02.** A refusal met by the credential rotation loop reaches the same terminal branch, instead of being swallowed into a rotation failure that promises another attempt. Plan 05-07 shipped and asserted it (`D2`) and the mutations table already named its mutation, but no row carried it | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T1 | 05-07 | 2 | RES-04 | T-05-25 | An hour after a mid-run refusal, no inventory call, no credential call and no shadow attempt has been made | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T3 | 05-07 | 2 | RES-04 | T-05-24 | An owner who changes their vendor password while Homebridge runs finds the accessory unreadable with its readings kept | e2e | `npm run test:cucumber -- --name "after a healthy start"` | `features/degradedOperation.feature` | ✅ shipped |
| T2 | 05-07 | 2 | RES-04 | T-05-26 | `stop()` pushes one trust whose command transport is unready, and marks no scope | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T1 | 05-08 | 3 | RES-03 | T-05-29 | A message arriving after a silence restores the trust with no clock movement and no poll | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T1 | 05-08 | 3 | RES-03 | T-05-30 | A healthy live connection produces no push per heartbeat | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T2 | 05-08 | 3 | RES-03 | T-05-32 | An identical heartbeat clears the silence while the plugin's device polling is parked at the vendor | e2e | `npm run test:cucumber -- --name "before the next poll"` | `features/degradedOperation.feature` | ✅ shipped |
| T2 | 05-08 | 3 | RES-03 | T-05-32 | No poll outcome is recorded while that scenario runs, so the restored trust cannot be credited to a poll the client's ten-second request deadline produced | e2e | `npm run test:cucumber -- --name "before the next poll"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-09 | 4 | RES-04 | T-05-34 | A press on a restored control after a failed restart is refused with the transport status and a named cause | unit | `npm run test:coverage:direct -- dist-test/src/accessories/controls.js dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` | ✅ shipped |
| T1 | 05-09 | 4 | RES-04 | T-05-36 | A refused press leaves the control readable once the clearing push has run | unit | `npm run test:coverage:direct -- dist-test/src/accessories/controls.js dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` | ✅ shipped |
| T1 | 05-09 | 4 | RES-04 | T-05-35 | The accessory's own binder replaces the refusing handler, so a recovered plugin operates its controls | unit | `npm run test:coverage:direct -- dist-test/src/accessories/staleMarking.js dist-test/test/accessories/staleMarking.test.js` | `test/accessories/staleMarking.test.ts` | ✅ shipped |
| T2 | 05-09 | 4 | RES-04 | T-05-34 | A press on a restored control is refused, sends nothing, and leaves the control readable | e2e | `npm run test:cucumber -- --name "restored control is refused"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-09 | 4 | RES-04 | T-05-38 | **Corrected 2026-09-02.** The three restart-time passes share one guarded walk, and that walk binds only services carrying the surface each pass acts on. The health gate does not discriminate this: 05-09 measured a literal third near-copy and got byte-identical `fallow` output, so `npm run fallow` is a baseline check here, not evidence. The evidence is the walk's own cases and the guard-widening mutation, which fails cases in two different passes from one edit | unit | `npm run test:coverage:direct -- dist-test/src/accessories/staleMarking.js dist-test/test/accessories/staleMarking.test.js` | `test/accessories/staleMarking.test.ts` | ✅ shipped |
| T1 | 05-11 | 5 | RES-03 | T-05-43 | A device whose live path spoke and then went quiet still reports a later flood: a healthy REST poll carrying the family's flood code reaches `Leak Detected = 1` in HomeKit with `Status Active` false | e2e | `npm run test:cucumber -- --name "went quiet"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-11 | 5 | RES-03 | T-05-44 | The flood reaches the store on the first poll that observes the silence, not the one after it — one poll late is up to an hour late at the configured maximum | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T1 | 05-11 | 5 | RES-03 | T-05-48 | **Corrected 2026-09-02.** Four existing scenarios publish a heartbeat and then cross the threshold, not three, and the membership differs from the plan's list in both directions. Two were repaired so their prose premise still holds; two stay honest unedited. The handover reverts telemetry to `water_level: 1` from the harness's full valid body, not to an emptied record, so two of the plan's three predicted failure modes never occur | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ✅ shipped |
| T2 | 05-11 | 5 | SYNC-02 | T-05-45 | A pump run the live path reported is not erased by a poll arriving while the shadow is still inside the two-heartbeat window | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T2 | 05-11 | 5 | SYNC-02 | T-05-45 | A poll that recovers from a REST-only degradation does not take telemetry from a live shadow, so its older body does not erase what the live path delivered | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T2 | 05-11 | 5 | SYNC-03 | T-05-47 | Once the live path speaks again, a pump run it reports is not erased by the next poll's older body — ownership returns through the patch path that already exists | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T2 | 05-11 | 5 | SYNC-03 | T-05-45 | Repeating the handover on every poll of a long silence moves no telemetry key, restamps no receipt time, and notifies no listener | unit | `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | `test/device/state.test.ts` | ✅ shipped |
| T3 | 05-11 | 5 | SYNC-03 | T-05-46 | `01-CONTEXT.md` D-15 and `REQUIREMENTS.md` SYNC-03 record, in their own text, that shadow ownership ends on silence as well as on disconnection, each dated and each naming `05-CONTEXT.md` D-13 | other | `grep -c "Amended 2026-09-02" .planning/phases/01-secure-cloud-foundation/01-CONTEXT.md .planning/REQUIREMENTS.md` | `.planning/phases/01-secure-cloud-foundation/01-CONTEXT.md`, `.planning/REQUIREMENTS.md` | ✅ shipped |
| T1 | 05-10 | 6 | RES-03, RES-04 | T-05-39 | Every documentation claim about degraded operation is traceable to a passing assertion. (Task ID corrected 2026-09-02: the documentation work is 05-10 task 1, not task 2) | manual | `npm run check` | `README.md`, `CHANGELOG.md` | ✅ shipped |

### Plan 05-12 rows

Added 2026-09-02 after `05-VERIFICATION.md` returned `gaps_found` a second time, on SC-4's second half
alone. The gap sat in the state the previous round created: plan 05-07 made a mid-run credential
refusal reach the terminal branch, and mutation testing confirmed that is real, but it delivered a
one-shot push where a durable state was needed. The rows below state what an owner must observe after
the refusal, not at the instant of it, because the instant was never the hard half.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T1 | 05-12 | 7 | RES-04 | T-05-12-01 | An owner whose vendor password was refused while Homebridge ran finds the accessory still refusing every read after the next device heartbeat, on a leak sensor, a contact sensor and a switch, with the reading it last published retained | e2e | `npm run test:cucumber -- --name "stays refused when the next heartbeat lands"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-12 | 7 | RES-04 | T-05-12-01 | The same owner, looking again two simulated hours and one further changed heartbeat later, finds the same greyed-out accessory rather than a normal one. The presentation is a state the runtime is in, not an act it performed once | e2e | `npm run test:cucumber -- --name "stays refused when the next heartbeat lands"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-12 | 7 | RES-04 | T-05-12-03 | A halted plugin holds no live connection to the vendor, so it stops consuming temporary cloud credentials it can no longer rotate. The step reads the broker's own socket count rather than a plugin-side flag | e2e | `npm run test:cucumber -- --name "stays refused when the next heartbeat lands"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-12 | 7 | RES-04 | T-05-12-05 | The halt records no shadow-degradation line, so the log names the cause an owner must act on and not a transport outage that did not happen. Closing raises no disconnection | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T2 | 05-12 | 7 | RES-04 | T-05-12-02 | A credential grant still in flight when another loop meets the refusal opens no connection when it lands, so the overwrite path is not re-established one function later | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T2 | 05-12 | 7 | RES-04 | T-05-12-02 | A connection that was already starting when the refusal landed is closed rather than kept, so the runtime is never left holding a socket it will never use | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T1 | 05-12 | 7 | RES-04 | T-05-12-01 | The scenario can see the defect at all. `world.until` reads its condition before its first delay, so a plain refusal step placed straight after a publish answers from the marking already in place and passes whether or not the message was delivered. The settling step is what makes the read-refusal half evidence rather than decoration | e2e | `npm run test:cucumber -- --name "stays refused when the next heartbeat lands"` | `features/support/steps/homekit.ts` | ✅ shipped |
| T1 | 05-12 | 7 | RES-04 | T-05-12-01 | The halted path and the shadow-silence recovery path are distinct mechanisms, and neither stands in for the other: reverting this plan's close kills the new scenario and leaves `A returning heartbeat clears the shadow silence before the next poll` green | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ✅ shipped |

### Plan 05-12 mutations

Each was applied to the source tree, watched, and reverted after `git status` showed the mutated file
was the only changed one. Every commit preceded its mutation.

| Behaviour | Mutation that must fail it |
|---|---|
| A refusal survives the next heartbeat | Mutation A. Remove `void closeQuietly(shadow);` from `haltOnTerminalAuthFailure`. The scenario fails at `Then the broker holds no live connection`, and with that step suppressed it fails at `Then the "Sump Pit Flood" service still answers no read for "Status Active"` with `it answered a read`. The unit case fails on `closes: 0` against `closes: 1` |
| The scenario is not blind to it | Mutation B. Drop the settle from the new step and re-apply mutation A. **The plan predicted the scenario would pass and it does not**: it still fails at `Then the broker holds no live connection`, which sits before the settling steps and does not depend on the settle. Suppressing that one step isolates the half the mutation is about, and the scenario then **passes** against the defect in 0.3 s. That pass is the finding: without the settle the read-refusal steps are blind, and restoring the settle alone turns the same run red |
| The two paths are distinct | Mutation C. Run mutation A against `A returning heartbeat clears the shadow silence before the next poll`. It stays green, 18 steps passed, while the new scenario is dead |
| Nothing opens a connection after a halt | Mutation D. Narrow `attemptShadow`'s entry guard back to `stopped` alone. `D-13 opens no live connection for a credential grant that lands after a refusal has halted the runtime` fails naming the client that was built (`1 !== 0`); the post-start case stays green |
| Nothing is kept from the halt's own start window | Mutation E. Narrow `attemptShadow`'s post-start check back to `stopped` alone. `D-13 keeps no live connection that opened while a refusal was halting the runtime` fails on `closes: 0` against `closes: 1`; the entry-guard case stays green |

### Plan 05-13 rows

Added 2026-09-02 after the round landed the two-device harness. Every one of the 96 scenarios that
shipped used a single `deviceId`, so no end-to-end assertion in this phase could tell a per-device
fact from an account-wide one. These rows are the first that can. All five pass against unmodified
production code, which is the point: the capability is proved on behaviour that is already correct,
so a later red result on the same harness is about the defect and not about the harness.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T1 | 05-13 | 8 | RES-03 | T-05-13-01 | An owner with a Basement Guardian in each basement gets a tile for each one, and each tile reads its own basement: the front pump publishes 20% while the back pump publishes 60%, from the same account and the same run | e2e | `npm run test:cucumber -- --name "Two pumps on one account publish two accessories"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-13 | 8 | RES-03 | T-05-13-01 | A scenario naming a system the plugin never published fails on the name and lists the names it did publish, rather than reading another basement's tile and passing | e2e | `npm run test:cucumber -- --name "Two pumps on one account publish two accessories"` | `features/support/publishedServices.ts` | ✅ shipped |
| T2 | 05-13 | 8 | RES-03 | T-05-13-01 | A live message from the front basement moves the front tile and leaves the back tile at the level the back pump's own inventory carried, and a message from the back basement does the same in the other direction | e2e | `npm run test:cucumber -- --name "A heartbeat from one pump moves only"` | `features/degradedOperation.feature` | ✅ shipped |
| T2 | 05-13 | 8 | RES-03 | T-05-13-01 | The vendor reporting a new body for one pump moves that pump's polled reading and leaves the other basement's tile where it was. Asserted while both pumps are still poll-owned, before any heartbeat takes ownership, so the half plan 05-14 inherits is measured rather than assumed | e2e | `npm run test:cucumber -- --name "A heartbeat from one pump moves only"` | `features/support/steps/shadow.ts` | ✅ shipped |
| T2 | 05-13 | 8 | RES-03 | structural | The suite can express a two-device account at all. Three named steps now exist -- the named read, the named publish and the named vendor change -- and plan 05-14's `CR-01` scenario is written entirely in them, so 05-14 lands a source change alone and its red result cannot be about a harness that moved in the same commit | e2e | `npm run test:cucumber` | `features/support/publishedServices.ts`, `features/support/steps/homekit.ts`, `features/support/steps/shadow.ts` | ✅ shipped |

### Plan 05-13 mutations

Each was applied to the harness, watched, and reverted after `git status` showed the mutated file was
the only changed one. Every commit preceded its mutation. No mutation was applied to `src/`, and no
file under `src/` or `test/` changed at any point in the round.

| Behaviour | Mutation that must fail it |
|---|---|
| Two accessories read apart | Mutation A. Make the named-accessory lookup answer `handedAccessories.at(-1)` regardless of the name asked for. The scenario fails at `Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "20"`, having read 60 -- the back pump's level. Confirmed by re-running the same mutation with that one assertion restated as `"60"`, which passes: the front read really is answering the back pump's tile |
| A name matching nothing fails loudly | Mutation B. Make the named-accessory lookup answer `undefined` instead of throwing, and name a pump the plugin never published. Unmutated, the failure reads `the plugin published no Side Sump Pump accessory; it published: Front Sump Pump, Back Sump Pump` and arrives in 0.16 s. Mutated, it degrades to `the Sump Pit Level service on Side Sump Pump never reported Water Level as 20 within 2000 ms` -- a deadline that never says the pump was never published, and from which a reader cannot tell a misnamed scenario from a routing defect |
| A heartbeat moves one pump and not the other | Mutation C. Resolve every named publish to `world.devices.at(0)`. The first heartbeat still lands on the front pump, so the first half survives; the scenario dies at `Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "80"`, the back pump still holding the 60 its own inventory row carried |
| The name resolver's throw is worth having | Mutation D. Make the device-name resolver fall back to position zero instead of throwing, and name a pump the scenario never seeded. Unmutated, the step fails on the name in 0.36 s: `no step has given the scenario a Side Sump Pump device; it seeded: Front Sump Pump, Back Sump Pump`. Mutated, the scenario still fails -- but three steps later, on a value, with a 2000 ms deadline naming a pump that was never the problem. Both are red; only one is diagnosable |
| A vendor change moves one named pump's polled reading and no other | Mutation E. Make the named vendor-change step rewrite every seeded device, the way the account-wide step does. The polled half dies at `Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "60"`, the back pump having read 80 -- the front pump's new body. Confirmed by re-running with that assertion restated as `"80"`, which passes it and moves the failure to the next `"60"` assertion. **This is the mutation that makes plan 05-14's inheritance real:** without it, 05-14 would rest on a step whose per-device behaviour nothing had ever measured |


### Plan 05-14 rows

Added 2026-09-02, when the round closed `05-REVIEW-2.md` CR-01 and WR-05. The scenario is written
entirely in plan 05-13's three named steps and `git status --porcelain -- features/support/` printed
nothing at every commit, so the red result these rows record is about the defect and not about a
harness that moved in the same commit.

The red result, quoted as the scenario found it before any source changed: on a two-pump account
whose second pump kept heartbeating, the quiet pump's tile held `Water Level` **40** -- the last
level its own live path delivered -- while every poll reported `water_level: 31`; its `Leak Detected`
read **0**; and its `Status Active` read **true**, so the plugin went on claiming to vouch for a
basement it had stopped watching. Confirmed rather than inferred: restating those three assertions as
`0`, `40` and `true` made the scenario pass against unmodified production code.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T1 | 05-14 | 9 | RES-03 | T-05-14-02 | A poll that finds the quiet pump's pit flooded reports that flood in Apple Home, on a two-pump account whose other pump is heartbeating normally. Mutation A must fail it | e2e | `npm run test:cucumber -- --name "A poll finds a flood on the pump that went quiet"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-14 | 9 | RES-03 | T-05-14-01 | The quiet pump's tile stops saying the plugin vouches for it: its `Status Active` reads false while the poll refreshes it. Mutation A must fail it | e2e | `npm run test:cucumber -- --name "A poll finds a flood on the pump that went quiet"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-14 | 9 | RES-03 | T-05-14-03 | The healthy pump keeps the level its own heartbeat delivered through its neighbour's silence, rather than having every poll of that silence write the vendor's older body over it. Mutation B must fail it | e2e | `npm run test:cucumber -- --name "A poll finds a flood on the pump that went quiet"` | `features/degradedOperation.feature` | ✅ shipped |
| T2 | 05-14 | 9 | RES-03 | T-05-14-01 | A message stamps only the device it came from, so two pumps are two silence windows and one pump's heartbeat is no evidence about the pump beside it. Mutation D must fail it | unit | `npm run test:coverage:direct -- dist-test/src/runtime/monitoringHealth.js dist-test/test/runtime/monitoringHealth.test.js` | `test/runtime/monitoringHealth.test.ts` | ✅ shipped |
| T2 | 05-14 | 9 | RES-03 | T-05-14-01 | A device admitted late starts its own silence window at its admission, and a device the plugin was never told about is never reported silent. Mutation G must fail the account verdict these rest on | unit | `npm run test:coverage:direct -- dist-test/src/runtime/monitoringHealth.js dist-test/test/runtime/monitoringHealth.test.js` | `test/runtime/monitoringHealth.test.ts` | ✅ shipped |
| T2 | 05-14 | 9 | RES-03 | T-05-14-01 | A device the arrival map already holds is not re-stamped when a later poll admits it again, so a pump quiet for hours still reaches its silence. Mutation E must fail it | unit | `npm run test:coverage:direct -- dist-test/src/runtime/monitoringHealth.js dist-test/test/runtime/monitoringHealth.test.js` | `test/runtime/monitoringHealth.test.ts` | ✅ shipped |
| T2 | 05-14 | 9 | RES-03 | T-05-14-03 | A release names the one device it releases, and a release naming a device the store never held changes nothing. Mutation F must fail it | unit | `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | `test/device/state.test.ts` | ✅ shipped |
| T2 | 05-14 | 9 | RES-03 | T-05-14-04 | A disconnection releases the whole fleet, because the connection that ended carried every device, while a silence releases only the controller that stopped speaking | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T1, T2 | 05-14 | 9 | RES-04 | structural | **The honest limit, measured rather than assumed.** The plan predicted that mutation B -- an account-wide release -- might pass the end-to-end tier, and reserved WR-05's discriminating evidence for mutation F at the unit tier. It does not pass: the scenario fails at its last assertion, the healthy pump reading 60 where 80 was expected, because the poll that carried the quiet pump's flood also wrote the healthy pump's older vendor body. The end-to-end tier therefore does see WR-05, and it sees it only because the healthy pump's live level and its polled level were deliberately made different. Mutation F remains the unit-tier evidence and is the one that fails when the release itself stops discriminating | e2e, unit | `npm run test:cucumber -- --name "A poll finds a flood on the pump that went quiet"`, `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | `features/degradedOperation.feature`, `test/device/state.test.ts` | ✅ shipped |

### Plan 05-14 mutations

Every mutation was applied after its task was committed, run, and reverted only once `git status`
showed the mutated file was the only changed one. **Mutation C is the one that failed nothing in the
new scenario, and it is recorded as the measurement it is rather than quietly dropped.**

| Behaviour | Mutation that must fail it |
|---|---|
| A poll finds the quiet pump's flood | Mutation A. Make `recordShadowMessage` stamp every admitted device rather than the one named, which is the account-wide behaviour this plan replaced. The scenario dies at `features/degradedOperation.feature:208`, `Then the "Sump Pit Flood" service on "Front Sump Pump" reports "Leak Detected" as "1"`: the quiet pump is never silent, is never released, and every poll body is discarded |
| The healthy pump keeps its own reading | Mutation B. Make `applyDevices` release every stored device whenever any one is silent. The scenario dies at `features/degradedOperation.feature:211`, `Then the "Sump Pit Level" service on "Back Sump Pump" reports "Water Level" as "80"`, having read 60. Confirmed by re-running the same mutation with that assertion restated as `"60"`, which passes: the healthy pump's live level really was overwritten by its own vendor body |
| A device is admitted when discovery finds it | Mutation C. Revert the admit call in `applyDevices`, so nothing is admitted. **This failed nothing in the new scenario, which passed unchanged.** The reason is structural rather than accidental: the quiet pump in that scenario heartbeats once before falling silent, and `recordShadowMessage` stamps whatever device a message came from, admitted or not, so the admit call is redundant for a pump that has ever spoken. The admit call's real subject is a device that has *never* spoken, which the scenario does not exercise. It is not unpinned: the same mutation fails five shipped scenarios -- `A flooded pit reaches Apple Home while the live path is silent`, `Both monitoring paths lost withdraws every scope`, `A blind plugin vouches for no controller-link verdict`, `A transport outage leaves every service readable`, `A press with no valid state is refused locally` -- and `goes silent two heartbeats after admission when no message ever arrives` at `test/runtime/monitoringHealth.test.ts:239` is the unit case that states it directly |
| A message stamps only its own device | Mutation D. Make `recordShadowMessage` stamp every admitted device. Fails `names only the pump that stopped speaking when the pump beside it is still heartbeating` at `test/runtime/monitoringHealth.test.ts:256`, `stops vouching for the account while one pump is quiet and vouches again once it speaks` at `:274`, and `D-13 hands only the quiet pump back to the poll and leaves its neighbour owning its telemetry` at `test/runtime/accountRuntime.test.ts:1097` |
| An already-tracked device is not re-stamped | Mutation E. Make `admitDevice` set the stamp unconditionally. Fails `leaves a quiet pump quiet when a later poll admits it again` at `test/runtime/monitoringHealth.test.ts:329`, and eleven cases in all: every poll re-arms the window, so no silence is ever reached and the whole degraded-monitoring group goes with it. This is the mutation that pins the prohibition against per-poll re-seeding |
| A release names one device | Mutation F. Make `releaseShadowSource` clear every snapshot regardless of the `deviceId` it was given. Fails `leaves the pump beside it owning its own telemetry` at `test/device/state.test.ts:582`, `changes nothing when it names a device the store never held` at `:609`, and the runtime's per-poll release case at `test/runtime/accountRuntime.test.ts:1097`. **This is WR-05's discriminating mutation**, and it is why WR-05 is closed here rather than deferred a second time |
| The account verdict is still pinned after the redesign | Mutation G. Make `trustNow` answer `shadowSilent` false unconditionally. Fifteen cases fail, thirteen of them shipped before this plan -- including the silence-window table at `test/runtime/monitoringHealth.test.ts:100-118` and the whole `the degraded monitoring path` group in `test/runtime/accountRuntime.test.ts`. The account-wide verdict survived the move to per-device stamps with its coverage intact |

### Plan 05-15 rows

Added 2026-09-02, when the round closed `05-REVIEW-2.md` CR-03. Measured baseline before appending:
`grep -c "05-15"` answered **4**, the number the plan derived its floor of 12 from, so the floor stands
as written.

The red result, quoted as the scenario found it before the guard changed: after two missed heartbeats
the poll had taken the readings back and written **`water_level: 3`**, its own vendor body. A report
carrying only `wifi_signal_dbm` and `mcu_firmware_version` then arrived. The vendor changed the polled
level to **31**, the flooding code, and the snapshot still read **3** five seconds later. Confirmed
rather than inferred: restating that assertion as `3` made the scenario pass against unmodified
production code. The document had delivered no reading and had taken the readings anyway.

The metadata half and the arrival half both passed in that red run -- 16 of the 18 steps did -- so the
red is about ownership alone and not about a harness that failed to publish.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T1 | 05-15 | 10 | RES-03 | T-05-15-01 | A report carrying only firmware or signal strength does not take the pit reading away from the poll, so the flood the poll then finds reaches Apple Home. Mutation A must fail it | e2e | `npm run test:cucumber -- --name "leaves the readings with the poll"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-15 | 10 | RES-03 | T-05-15-02 | The metadata-only report the scenario claims to send really reached the store and was merged, so the scenario cannot pass against a harness that published nothing. Mutation D must fail it, on the metadata assertion rather than on the flood | e2e | `npm run test:cucumber -- --name "leaves the readings with the poll"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-15 | 10 | RES-03 | T-05-15-03 | That same report still counts as the device speaking, so the tile vouches for the system again rather than reading it as silent. Mutation E must fail it | e2e | `npm run test:cucumber -- --name "leaves the readings with the poll"` | `features/degradedOperation.feature` | ✅ shipped |
| T2 | 05-15 | 10 | RES-03 | T-05-15-01, T-05-15-03 | The two questions a reported document answers are pinned in one case: a metadata-only report moves the receipt time and establishes no watermark. Mutation A fails the ownership half and mutation C fails the receipt-time half | unit | `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | `test/device/state.test.ts` | ✅ shipped |
| T2 | 05-15 | 10 | RES-03 | T-05-15-04 | A watermark that already exists still advances on a metadata-only report, so a document the shadow has already superseded cannot overwrite a newer reading. Mutation B must fail it | unit | `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | `test/device/state.test.ts` | ✅ shipped |
| T2 | 05-15 | 10 | RES-03 | T-05-15-02 | At the seam the review's reproduction was found at: after a release, a live message reporting only device metadata leaves the poll owning telemetry, so the next poll's flood reaches the store and the watermark stays absent. Mutation A must fail it | unit | `npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js dist-test/test/runtime/accountRuntime.test.js` | `test/runtime/accountRuntime.test.ts` | ✅ shipped |
| T2 | 05-15 | 10 | RES-03 | structural | A telemetry document still takes ownership on the terms it always did, and a document reporting neither section still establishes nothing and still leaves the receipt time where it was -- the control that says this change widened nothing. Both were shipped before this plan and both still pass unedited | unit | `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | `test/device/state.test.ts` | ✅ shipped |

### Plan 05-15 mutations

Every mutation was applied after its task was committed, run, and reverted only once `git status`
showed the mutated file was the only changed one. **Mutation A failed no unit case at the moment task
1 was committed** -- the scenario alone caught it -- and that gap is recorded here as the measurement
it is, beside the two cases task 2 added to close it.

| Behaviour | Mutation that must fail it |
|---|---|
| A metadata-only report does not take the readings | Mutation A. Restore `nextShadowVersion` to the wider observation test, `!carriesObservation(patch)`. At task 1 it failed the new scenario at `features/degradedOperation.feature:197`, `Then the canonical snapshot carries these fields: \| water_level \| 31 \|`, and **no unit case at all** -- 1358 passed. After task 2 it also fails `advances the receipt time and establishes no watermark for a patch that reports only device metadata` at `test/device/state.test.ts:423` and `D-13 leaves the poll owning telemetry through a live message that reports only device metadata` at `test/runtime/accountRuntime.test.ts:1000` |
| An existing watermark still advances | Mutation B. Make the guard return `previous.shadowVersion` whenever `patch.data` is absent, so a metadata-only document may not advance a watermark either. Fails `keeps shadow metadata and the applied version when a later poll refreshes telemetry` at `test/device/state.test.ts:140` and `leaves the receipt time alone and advances the watermark it already held for a patch that reports neither section` at `:379`, both shipped before this plan, plus `advances a watermark it already held on a patch that reports only device metadata, so a superseded telemetry patch stays refused` at `:450`, which task 2 added because the two shipped cases pin the advance without pinning what it is for. No scenario fails |
| A metadata report still moves the receipt time | Mutation C. Narrow `carriesObservation` to `patch.data !== undefined`, the rejected fix. Fails one case: `advances the receipt time and establishes no watermark for a patch that reports only device metadata` at `test/device/state.test.ts:423`. No scenario fails, and that is correct rather than a gap: the arrival stamp the silence rule reads is `recordShadowMessage` in the runtime, which never consulted this predicate, so the end-to-end tier cannot see this mutation at all |
| The metadata document really arrived | Mutation D. Make the metadata publish step send an empty metadata section. The scenario dies at `features/degradedOperation.feature:191`, `Then the canonical snapshot carries these device metadata fields:`, reporting that the snapshot never carried the device metadata fields the scenario expects -- on the metadata assertion, four steps before the flood. This is what proves the metadata half is load-bearing rather than decorative |
| A metadata report still counts as the device speaking | Mutation E. Guard `health.recordShadowMessage(deviceId)` on `patch.data !== undefined`, so a report carrying no reading stops counting as an arrival. The scenario dies at `features/degradedOperation.feature:194`, `Then the "Sump Pit Flood" service reports "Status Active" as "true"`. **No unit case fails** -- 1360 passed -- so the scenario is the only thing pinning the half of D-11 the narrowing must not break, and it is pinned deliberately at the tier an owner would feel it |

### Plan 05-16 rows

Added 2026-09-02, when the round closed `05-REVIEW-2.md` CR-02, WR-03 and WR-04. Measured baseline
before appending: `grep -c "05-16"` answered **4**, on lines 468 to 471 -- four seeded table rows and
no subsection heading. That is the number the plan derived its floor of **13** from, so the floor
stands as written: 4 measured, plus 2 subsection headings, plus one line for each of the seven rows
below.

The red result, quoted as the scenario found it before the guard changed. After the refusal all three
services refused reads. The press was refused, correctly, and sent nothing. Then the clock advance ran
the plugin's own deferred clearing push, and:

```text
System Self-Test  Status Active: answered, true
Alarm Mute        Status Active: answered, true
Sump Pit Flood    Status Active: refused
```

One press on one control returned **both** controls to a fully vouched-for read on a runtime that
will never observe anything again. Confirmed rather than inferred: restating those three assertions to
the values above made the scenario pass against unmodified production code, and moving the same
assertions to before the clock advance also passed. The press is not the damage; the macrotask the
press arms is.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T1 | 05-16 | 11 | RES-04 | T-05-16-01 | A press on either control Switch after the vendor has refused the account credentials leaves both control services and the flood sensor still refusing reads, with their readings retained. Mutation A must fail it | e2e | `npm run test:cucumber -- --name "leaves both controls still refusing reads"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-16 | 11 | RES-04 | T-05-16-01 | The clock advance is what lets the scenario see the damage at all, so the scenario cannot pass against a plugin read one macrotask too early. Mutation B must make the scenario pass against the defect | e2e | `npm run test:cucumber -- --name "leaves both controls still refusing reads"` | `features/degradedOperation.feature` | ✅ shipped |
| T1 | 05-16 | 11 | RES-04 | T-05-16-01 | All three ways a control request can end are covered by the one closed seam: the press the plugin refuses itself, the request that outlives its window, and the refusal the vendor answers. One case each, so a guard proved on the door the reproduction used is not credited with the other two. Mutation A must fail all three | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T2 | 05-16 | 11 | RES-04 | T-05-16-02 | A refused credential withdraws every trust scope, so the value under the marking reads false rather than the plugin claiming it vouches for what it shows. Mutations D and E must fail it | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T2 | 05-16 | 11 | RES-04 | T-05-16-03 | `Basement Guardian Offline` keeps publishing the verdict it holds under that wider withdrawal, marked rather than blank, because the reason filled in says the plugin is seeing less. The row is first pushed the opposite verdict, so a withholding withdrawal is caught rather than agreed with by accident. Mutation F must fail it on the withheld value | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T2 | 05-16 | 11 | RES-04 | T-05-16-05 | Preserve-and-mark holds under the wider withdrawal: every reading a row published before the refusal is still published after it, and only the trust report moved. The whole published surface is compared rather than one value chosen in advance. Mutations C and D must fail it | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T2 | 05-16 | 11 | RES-04 | T-05-16-04 | A trust push differing from the stored one only in the credential member still republishes, so the halt is not read as nothing new and silently declined. **Before this round, replacing that member with a constant left 1348 unit tests and 96 Cucumber scenarios green; after it, mutation E fails four named cases.** The before is recorded as well as the after, because a map holding only the after loses the finding | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |

### Plan 05-16 mutations

Every mutation was applied after its task was committed, run, and reverted only once `git status`
showed the mutated file was the only changed one, with `npm run build:test` after each. **Mutation C
failed nothing at the moment task 1 was committed** and fails three cases after task 2; that movement
is recorded here as the measurement it is rather than as either a gap or a success.

| Behaviour | Mutation that must fail it |
|---|---|
| A press after the refusal leaves both controls refusing reads | Mutation A. Remove the credential guard from the republish callback the control binder holds. Fails the new scenario at `features/degradedOperation.feature:551`, at `Then the "System Self-Test" service still answers no read for "Status Active"`, reporting `it answered a read`. It also fails all three unit cases at `test/accessories/basementGuardian.test.ts:2355`, `:2376` and `:2390`, each on `{ selfTest: true, alarmMute: true }` against `{ selfTest: 'refused -70402', alarmMute: 'refused -70402' }` |
| All three refusal paths reach the one closed seam | Mutation A again, read per case. The three cases drive `refuseLocally`, `expire` and `refuseOutcome`, and all three fail together, which is what makes "one seam closes three doors" a measurement rather than a reading of the call graph. Guarding the clearing push instead of the callback would leave `expire` open while looking equivalent |
| The clock advance is what makes the scenario able to see anything | Mutation B. Drop the two clock advances from the new scenario and keep mutation A applied. The scenario **passes in 1.6 s against the defect**, 27 of 27 steps. The clearing push is armed for the next macrotask, so a scenario that presses and reads without advancing reads the moment before the damage. Behaved exactly as the plan predicted, which the same mutation in plan 05-12 did not |
| The halt's own trust push is still required | Mutation C. Guard `republishPublishedRows` on the same member, which the fix deliberately does not. **At task 1 it failed nothing at all** -- 1363 unit tests and 101 scenarios green -- because a refused credential withdrew no scope yet, so the halt's republish pushed the same `true` it had already published. After task 2 it fails three cases: `WR-03 keeps the offline adapter publishing its verdict...` at `test/accessories/basementGuardian.test.ts:2793`, `WR-03 leaves every reading a row published...` at `:2834`, and `WR-04 republishes for a trust push...` at `:2856`. The full-withdrawal case at `:2815` still passes, because it reads the accessory's exposed scope list, which `markMonitoring` computes before the republish -- so the withdrawal is right and never reaches a tile. That contrast is the coverage gap task 2 closed |
| A refused credential withdraws every scope | Mutation D. Remove the credential branch from `monitoringDegradedScopes`. Fails all four task 2 cases at `test/accessories/basementGuardian.test.ts:2793`, `:2815`, `:2834` and `:2856`. The withdrawal case fails on `[]` against the eight-scope list; the WR-04 case on `after: { flood: true, offline: true }` against `{ flood: false, offline: false }`. No scenario fails |
| The credential member of the republish comparison is load-bearing | Mutation E. Replace `trust.credentialsRejected === monitoring.credentialsRejected` with `true`, which is the reviewer's own mutation. **Before this round it left 1348 unit tests and 96 scenarios green.** After it, four cases fail: `:2793`, `:2815`, `:2834` and `:2856`. The offline case fails on `offlineState: 1`, the opposite verdict the case pushed in first surviving untouched, which says no republish happened at all. All 101 scenarios still pass, so the member is pinned at the unit tier alone and deliberately: the end-to-end tier reads a status the platform pushes immediately afterwards, which hides the boolean underneath it |
| The withdrawal marks without withholding | Mutation F. Fill the credential branch's scopes with `invalid`, a withholding reason, instead of the seeing-less `unreachable`. Fails `WR-03 keeps the offline adapter publishing its verdict...` at `test/accessories/basementGuardian.test.ts:2793` on `offlineState: 1` against `0` -- **on the withheld value, with `offlineActive: false` still correct** -- so the case discriminates the withholding alone and not the marking. It also fails the withdrawal case at `:2815` on the reason. This is the mutation that pins D-02's narrowing against the widening |

### Plan 05-17 rows

`grep -c "05-17"` answered **3** immediately before appending, on lines 523 to 525 -- three seeded
table rows and no subsection heading. That is the number the plan derived its floor of **12** from,
so **the floor stands as written**: 3 measured, plus the 2 headings, plus one line for each of the
seven rows the task names.

| Task | Plan | Wave | Requirement | Finding | Secret an owner must observe | Test type | Automated command | Test file | Status |
|---|---|---|---|---|---|---|---|---|---|
| T1 | 05-17 | 12 | RES-04 | WR-02 | A press refused while the live connection is quiet names the quiet connection, and not a state the plugin has: the pit reading on the tile arrived seconds ago from a working poll, so an owner told the plugin has no state for the pump goes to inspect equipment that is fine. Mutations A and C must fail it | e2e | `npm run test:cucumber -- --name "names the quiet connection"` | `features/officialControls.feature` | ✅ shipped |
| T1 | 05-17 | 12 | RES-04 | WR-02 | A press refused with no route to the vendor at all still names the route, because a channel to hear back on cannot help a plugin with nothing to send on. Mutation B must fail it | unit | `npm run test:coverage:direct -- dist-test/src/accessories/controls.js dist-test/test/accessories/controls.test.js` | `test/accessories/controls.test.ts` | ✅ shipped |
| T1 | 05-17 | 12 | RES-04 | WR-02 | A press refused because the capability's own reported field never decoded still names the missing state, so the rule inserted above it did not swallow every refusal in the module. Mutation A must fail it | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T2 | 05-17 | 12 | RES-04 | WR-02 | After a press is refused during the silence, the Switch returns to what the device reported and not to what HomeKit asked for. This is the one place the write path's own answer becomes visible to a controller, and before the two halves read one rule it showed a test running that no device had confirmed. Mutations D and E must fail it | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T2 | 05-17 | 12 | RES-04 | WR-02 | A value the plugin calls doubtful stays hidden from the tile and from the write path alike, so no press reaches a real pump on it. The case is built on a lost controller link rather than a failed field, because the family drops a violated scope's whole group before the accessory sees it and a case built on one would agree with a rule that withheld nothing. Mutation F must fail it | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T3 | 05-17 | 12 | RES-04 | WR-06 | A self-test the device confirmed on the very snapshot that withdrew the control's scope is resolved by that confirmation, and no line says the device never confirmed it. Mutations G and H must fail it | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T3 | 05-17 | 12 | RES-04 | WR-06 | The same moment under the withdrawal `WR-06` was reported against -- the poll that first finds the live path quiet. **This half was already closed by task 2**, because once both halves read one rule a seeing-less withdrawal hides the reported value from nobody. Kept as its own row so the two withdrawals are recorded as two, not credited to one change. Mutations D and H must fail it | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ✅ shipped |
| T3 | 05-17 | 12 | RES-04 | WR-06 | A request no report ever confirms still expires, the Switch still returns to what the device reports, and the owner is still told once that it was not retried -- because a command that outlived its deadline may already have reached the pump. Mutation H must fail it | e2e | `npm run test:cucumber -- --name "after the window closed still turns the switch on"` | `features/officialControls.feature` | ✅ shipped |

**Corrected records.** Two claims already in this file were false of the code, and a map that leaves
them standing repeats the defect this round exists to close.

| Record | What it said | What is true | What catches a future drift |
|---|---|---|---|
| The premise comment above the shipped scenario `A press with no valid state is refused locally`, at `features/officialControls.feature` | That the control row withholds the reported value once its own scope is untrusted, and the no-fresh-state rule then refuses the press | Neither half. The row kept publishing what the working poll delivered from the moment 05-06 widened its rule, and after this plan the rule that refuses that scenario is the quiet-live-connection rule. **The scenario stayed green through all of it because it asserts the status and never the cause, and one status answers every local refusal** | The scenario is kept for the status and the new scenario beside it asserts the cause. Mutation A fails the second and leaves the first green, which is the pair that tells a reworded rule from a reordered table. The comment now records that the scenario passed for a reason other than the one it stated |
| The row `A press is still refused during a monitoring outage \| Route reportedControlValue through the publishing predicate`, in `### Gap-closure round mutations (plans 05-06 to 05-11)` | That routing the write path's reported value through the publishing predicate is a mutation a correct implementation survives and the shipped one fails | It is now the shipped code. Task 2 made that exact edit, because the press is refused by a rule of its own and no longer by the absence of a value the plugin has. The row is left unedited above, as the plan required, and corrected here | Mutation D is the inverse and is the live one: restoring the write path's own guard over every untrusted scope fails the agreement case by name |

### Plan 05-17 mutations

Every mutation was applied after its task was committed, run, and reverted only once `git status`
showed the mutated file was the only changed one, with `npm run build:test` after each. **Mutation B
fails no scenario at all**, and **mutation F failed nothing until the case it targets was rebuilt**;
both are recorded as the measurements they are.

| Behaviour | Mutation that must fail it |
|---|---|
| The refusal names the quiet live connection | Mutation A. Delete the new rule's row from `LOCAL_REFUSALS`. Fails the new scenario at `features/officialControls.feature:191`, on the log line, reporting `the plugin has no fresh state for it` against the quiet-connection cause. It also fails 7 unit cases. **Both shipped refusal scenarios stay green**, which is the pair proving the two are distinct rules rather than one renamed -- and is also the measurement behind the claim that the shipped state scenario cannot tell them apart |
| The insertion point is load-bearing, below the transport rule | Mutation B. Move the new rule above `hasNoCommandTransport` in the table. **The shipped no-command-transport scenario stays green** -- it never sets the two conditions together, so no scenario can see this. Exactly one unit case fails: `names the missing transport alone when the plugin has neither a route to send on nor a live path to hear back on` at `test/accessories/controls.test.ts:696`, reporting the quiet-connection cause against `the plugin has no way to reach the vendor right now`. **That case was added by this plan for this mutation. Without it mutation B would have failed nothing at all**, which is the shape of blindness `04-VERIFICATION.md` W-1 records |
| The quiet live path is a third fact, not a shade of the transport | Mutation C. Make the accessory's predicate answer `monitoring.commandTransportReady` instead of `!monitoring.shadowSilent`. Fails the new scenario on the log line and the unit case `RES-04 names the quiet live connection for a press during shadow silence`. A press during silence goes back to naming a state the plugin has |
| The row and the write path answer one question | Mutation D. Restore `reportedControlValue`'s own guard over every untrusted scope. Fails `WR-02 returns the Switch to the value the device reported when a press is refused during shadow silence`, naming the two values that disagreed: `afterTheRefusedPress: true`, the value HomeKit's own request left standing, against the device's reported `false` |
| The row's own publishing behaviour is still pinned separately | Mutation E. Make `isRowPublishable` ignore the reason and withhold for every untrusted scope. Fails the agreement case **together with 8 shipped cases**, among them `publishes a scope untrusted for unreachable only while the value itself is not in doubt` and `publishes a flood a poll delivers during a lost monitoring path`. The two halves now fail as one, which is the point of them reading one rule |
| A doubtful value is hidden from both halves | Mutation F. Fill `SEEING_LESS_REASONS` with every reason. Fails `WR-02 keeps a doubtful value absent from both the control row and the write path` with `Missing expected rejection` -- **the press is not refused at all**, so a command would reach a real sump pump on a value the plugin calls doubtful. **This mutation failed nothing on the case's first draft**, which was built on a field that failed validation; the family drops a violated scope's whole group at `src/device/gemini.ts:370`, so the value was already absent for a second reason and the case agreed with a rule that withheld nothing. Rebuilt on a lost controller link, which is a valid boolean the decode keeps |
| A confirmation the device sent resolves the request it confirms | Mutation G. Point `reconcileControls` back at the vouched-for value. Fails `WR-06 resolves a request the device confirmed on the snapshot that withdrew the control scope` on the warning `The self-test request on <deviceId> was never confirmed by the device. It is not retried.` -- the line naming a device failure that did not happen. It fails nothing else, which is what says the gate belonged to reconciliation alone |
| The gate was removed from reconciliation, not the report | Mutation H. Make the decoded reader answer `undefined` for every control. Fails **10 cases**: all three `WR-06` cases, the agreement case, and six shipped ones including `CTRL-04 answers -70403 for a write of true while alarm_audio_muted reads true` and `CR-02 leaves both controls refusing reads when a request that outlived its window runs its clearing push`. The still-warns case fails on `-70412`: with no report at all the first press is refused for the missing state and no command is ever issued |

### Plan 05-18 rows

`grep -c "05-18"` answered **6** immediately before appending, on lines 547, 570, 571, 572, 573 and
574 -- the round's revision note plus five seeded table rows and no subsection heading. That is the
number the plan derived its floor of **16** from, so **the floor stands as written**: 6 measured, plus
the 2 headings, plus one line for each of the eight behaviour rows below.

| Task | Plan | Wave | Requirement | Finding | Secret an owner must observe | Test type | Automated command | Test file | Status |
|---|---|---|---|---|---|---|---|---|---|
| T1 | 05-18 | 13 | RES-04 | WR-01 | The greyed-out presentation survives an edit that reorders the two pushes behind it. A reordered fan-out republishes an ordinary boolean over the error and every tile answers normally while the account is refused for good -- the false normal this project exists to prevent. Mutation A must fail it | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | `test/platform.test.ts` | ✅ shipped |
| T1 | 05-18 | 13 | RES-04 | WR-01 | The fixture the ordering case reads is one that republishes, so a case as unfailable as the one it replaces is caught by the suite rather than by an executor's report of a mutation they applied by hand. The suite reads one fixture under both push orders and asserts the two readings differ. Mutation A2 must fail it | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | `test/platform.test.ts` | ✅ shipped |
| T1 | 05-18 | 13 | RES-04 | WR-01 | Every accessory this run published still hears the same account-wide answer, which is what the recording case was built to prove and still proves. The two cases measure different things and neither is redundant. Mutation B must leave it green while mutation A fails the case beside it | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | `test/platform.test.ts` | ✅ shipped |
| T1 | 05-18 | 13 | RES-04 | WR-01 | The error push is what makes a refused account unreadable, and the new case did not become a second copy of a case that already existed. Mutation C must fail the new case together with the fixture-driven ones | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | `test/platform.test.ts` | ✅ shipped |
| T2 | 05-18 | 13 | RES-04 | WR-07 | A field added to the platform's runtime context reaches all three callbacks, because there is one literal. A field added to two of three type-checks and gives the monitoring path a different plugin from the discovery path. **The gate counts `DiscoveryContext`-shaped object literals, not mentions of a field name.** Mutation D must fail it | unit (static) | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | `test/platform.test.ts` | ✅ shipped |
| T2 | 05-18 | 13 | RES-04 | WR-07 | The literal count does not move when a property read of a context member is added, which is what separates this gate from a count over a field name -- `basementGuardianAccessories` appears on ten lines of `src/platform.ts` and only the literals are literals. Mutation D2 must leave the count still | unit (static) | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | `test/platform.test.ts` | ✅ shipped |
| T2 | 05-18 | 13 | RES-04 | WR-07 | A field dropped from the one literal is a compiler error rather than a silent behavioural difference, which is the property the single literal buys. Mutation E must fail `npm run typecheck` | static | `npm run typecheck` | `src/platform.ts` | ✅ shipped |
| T3 | 05-18 | 13 | RES-04 | WR-08 | The marking pass still reaches exactly the services carrying a trust report, and adds a characteristic to none. Widening it would add a row to a service that never published one, changing a published identity an owner's automations may already attach to. Mutation G must fail it | unit | `npm run test:coverage:direct -- dist-test/src/accessories/staleMarking.js dist-test/test/accessories/staleMarking.test.js` | `test/accessories/staleMarking.test.ts` | ✅ shipped |
| T3 | 05-18 | 13 | RES-04 | WR-08 | An operator is told, once, when a credential refusal marked nothing at all -- the one case that produces no signal in HomeKit, because every tile keeps answering. A refusal that did mark services says nothing extra, because those tiles are the signal. Mutation H must fail the marks-and-no-line case | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | `test/platform.test.ts` | ✅ shipped |

**WR-01's before and after, recorded as the finding it is.**

| Record | Before this plan | After this plan |
|---|---|---|
| Inverting the two loops in `applyMonitoringHealth` | Left **all 1348 unit tests green** when the reviewer ran it, and all 1378 when this plan re-measured the same inversion at its own baseline. The only tier that caught it was Cucumber, at 2 scenarios. The comment above `test/platform.test.ts:1228` said the case there pinned the ordering; it could not, because the stand-in it drives pushes nothing onto the services the error push walks | Fails `leaves the pushed status standing over an accessory that republishes its own rows`, at `dist-test/test/platform.test.js:1050`, reporting `threw: undefined` where `threw: -70402` was expected. **1379 pass, 1 fail.** The recording case stays green under the same mutation, which is what says the two cases measure different things |

### Plan 05-18 mutations

Every mutation was applied after its task was committed, run, and reverted only once `git status`
showed the mutated file was the only changed one, with `npm run build:test` after each. **No mutation
in this plan failed nothing.** Mutations D2 and B are the two whose passing result is the measurement:
D2 must leave the count still and B must leave the recording case green.

| Behaviour | Mutation that must fail it |
|---|---|
| The refusal push order is observable at the unit tier | Mutation A. Run the error push before the boolean fan-out. Fails `leaves the pushed status standing over an accessory that republishes its own rows` at `dist-test/test/platform.test.js:1050`, with the diff `+ threw: undefined` against `- threw: -70402` under a `value: false`. Counts move from 1380 pass / 0 fail to 1379 pass / 1 fail. **The same inversion left every unit case green before this plan**, which is the finding |
| The fixture the ordering case reads is order-sensitive | Mutation A2. Build the companion case's second fixture on `recordingBasementGuardianAccessory`, which pushes nothing. Fails `reads a different trust report under each push order, which is what makes the ordering case able to fail` on `Expected "actual" not to be strictly deep-equal to: [ -70402 ]` -- both orders read the same status, so the case cannot see the difference it asserts. This is the automated substitute for an executor's honesty about mutation A |
| The recording case pins reach, not ordering | Mutation B. The same inversion as mutation A. **`leaves the pushed status standing after the boolean fan-out has run` stays green**, together with the two other fixture-driven refusal cases. That is the evidence the two cases measure different things and that the new one is not a rename of the old |
| The error push is what makes the account unreadable | Mutation C. Delete the walk over `context.accessories` entirely. Fails **4 platform cases**, the new ordering case among them, and `npm run build:test` also refuses the file on an unused import. The new case failing here as well as under mutation A is what says it is not a duplicate of the cases that already existed |
| The runtime context is assembled once | Mutation D. Re-inline the literal in `onMonitoringHealth`. Fails `holds exactly one DiscoveryContext-shaped literal beside the declaration it satisfies` with `src/platform.ts holds 3 DiscoveryContext-shaped literals where 2 are expected` |
| The gate counts literals rather than mentions | Mutation D2. Splice one more property read of a context member into a copy of the file text. **The count does not move: 2 before, 2 after.** A gate marked on a bare field name would have moved, and would not have moved for a re-inlined literal spelling a field differently. The same control ships as a permanent case beside the planted second literal |
| A missing field is a compiler error | Mutation E. Drop `offlineConfirmationPollCount` from the one literal. Fails `npm run typecheck` with `src/platform.ts(504,79): error TS2741: Property 'offlineConfirmationPollCount' is missing in type ... but required in type 'DiscoveryContext'` |
| The context stays a function, never a hoisted constant | Mutation F. Hoist the literal to a `const` above the runtime seam and have the helper answer it. Fails on three layers: `npm run typecheck` with `TS2448: Block-scoped variable 'runtime' used before its declaration` and `TS2454`, `npm run lint` with `no-use-before-define`, and **9 platform cases** at runtime on the temporal dead zone. The prohibition is enforced by the compiler, not by a comment |
| The marking pass reaches the trust report and no other service | Mutation G. Drop the `testCharacteristic` guard from the shared walk so it reaches every service. Fails `counts every service that reports whether the plugin vouches for it, and leaves one that never did alone`, reporting `marked: 4` against `2` and `carriesTrust: true` against `false` on the control that carried no trust report -- a characteristic added to a service that never published one. **11 of the module's 18 cases fail**, because the guard is shared by all three passes; the count is 4 rather than 3 because the walk then reaches `AccessoryInformation` as well |
| The zero-count line is conditional | Mutation H. Log the line whatever the count. Fails `says nothing extra when the refusal marked the services it reached`, which reads the line through the file's own recording log while the flood services carry the communication-failure status. It also fails `says nothing for a refusal that arrived before this run had any accessory to mark`, which is the empty-account case the condition deliberately stays quiet for |

### Plan 05-19 rows

`grep -c "05-19"` answered **5** immediately before appending, on lines 128, 132, 580, 620 and 621.
**Only three of those five are about this plan** -- the round's section heading and its two seeded
table rows. Lines 128 and 132 belong to plan 05-06 and match only because their Threat Ref column
reads `T-05-19`. The plan's derived floor of **9** therefore stands as written: 5 measured, plus the
single `### Plan 05-19 rows` heading, plus one line for each of the three documentation rows below.
There is no `### Plan 05-19 mutations` subsection, and that is deliberate: prose has no mutation of
its own, so each row names the code assertion its sentence depends on instead. A row dressed up as a
mutation row would be the exact claim this round exists to stop.

**The plan's own line numbers for the five hits did not survive measurement.** It named 321, 361 and
362 for the heading and the two rows; the file has grown since and they are at 580, 620 and 621. The
count is unchanged, so the floor is unchanged.

| Task | Plan | Wave | Requirement | Finding | Sentence an owner must be able to trust | The code assertion the sentence depends on | Test type | Automated command | Status |
|---|---|---|---|---|---|---|---|---|---|
| T1 | 05-19 | 14 | RES-03 | CR-04 | While the live connection still owns the readings, a poll does not replace them, and the tile shows the last reading that connection sent. Two missed heartbeats end the ownership; from then on each successful poll updates the tile, and a poll that finds a flooded pit reports it with the trust row alone carrying the doubt | *Documentation trace, not a test.* `test/runtime/accountRuntime.test.ts` -- `D-13 keeps a pump run the live path reported when a poll arrives inside the two-heartbeat window` for the half before the handover, and `features/degradedOperation.feature` -- `A pit that floods after the live path went quiet still reaches Apple Home` for the half after it. The per-system clause depends on `features/degradedOperation.feature` -- `A poll finds a flood on the pump that went quiet while its neighbour keeps reporting` and on `test/runtime/accountRuntime.test.ts` -- `D-13 hands only the quiet pump back to the poll and leaves its neighbour owning its telemetry`. The account-wide marking clause depends on `test/runtime/monitoringHealth.test.ts` -- `stops vouching for the account while one pump is quiet and vouches again once it speaks` | doc | `npm run check` | ✅ shipped |
| T1 | 05-19 | 14 | RES-04 | WR-08 | Under a refused credential, every service **that reports whether the plugin vouches for it** stops answering -- not every service | *Documentation trace, not a test.* `test/accessories/staleMarking.test.ts` -- `counts every service that reports whether the plugin vouches for it, and leaves one that never did alone`, which plan 05-18 pinned with mutation G: dropping the `testCharacteristic` guard from the shared walk fails it with `marked: 4` against `2`, and fails 11 of the module's 18 cases. The next sentence in the same paragraph depends on `retains every other reading on a service it marks, so the tile keeps its last values` | doc | `npm run check` | ✅ shipped |
| T1 | 05-19 | 14 | RES-03 | CR-04 | The unreleased changelog entry says the plugin hands the readings back to polling at the moment it marks its services inactive, rather than that successful polls keep their readings current | *Documentation trace, not a test.* One scenario carries both halves at once: `features/degradedOperation.feature` -- `A pit that floods after the live path went quiet still reaches Apple Home` reads `Status Active` as `false` after the clock crosses two heartbeats and then reads the poll's `water_level 31` off the canonical snapshot | doc | `npm run check` | ✅ shipped |

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

### Gap-closure round mutations (plans 05-06 to 05-11)

Each mutation below is one a **correct** implementation survives and the shipped one fails. That is
the difference from the first round's table, where several mutations only proved a test could see the
implemented behaviour move.

| Behaviour | Mutation that must fail it |
|---|---|
| A flooded poll during shadow silence reaches the tile | Point the row projection back at the un-narrowed trust predicate, so a monitoring cause withholds again |
| A validation failure still withholds | Add `invalid` to the exempted-reason set |
| A lost controller link still withholds | Add `controller-link-lost` to the exempted-reason set |
| A blackout activates no safety adapter | Make `controllerLinkValues` derive its activation from the row's trust — activated whenever the row is not fully trusted — instead of from the decoded `controllerLinkPresent` |
| A monitoring-degraded row gets its service during the outage | **Corrected 2026-09-02.** The named mutation — make `ensureService` also require the row to be fully trusted before it adds a service — is not expressible: `ensureService` takes an accessory, a row and the projected values, and receives no trust state, so writing it would change that signature and put a different change under test. 05-06 applied the equivalent on the same path: un-narrow the projection so a monitoring-degraded row projects nothing, which fails `earns its service from the poll that arrives during the outage` |
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
| No poll outcome is recorded during the recovery window | **Corrected 2026-09-02.** The mutation needs two forms, because the literal one never reaches the step it is meant to test. Form 1, drop `Given the vendor never answers the device list` alone: the parked-polling step fails first, so the closing step never runs. Form 2, drop that line and relax the parked step to a plain reading: the closing step is reached and fails naming both counts, which is what the row asks for. 05-08 ran and recorded both |
| A restored control refuses a press | Remove the pass's call from `configureAccessory` |
| A refused press leaves the control readable | Drop the clearing push from the restored-control refusal |
| Only control services gain a handler, and one guard serves all three restart-time passes | Widen the shared walk's guard from `On` to `Name` so the pass binds every restored service. 05-09 ran this as M3. It fails `adds no write surface to a restored sensor, which never carried one` and `refuses a press on every restored control and counts the controls it armed` from one edit, in two different passes, which is both the claim and the drift `05-REVIEW.md` IN-01 names |
| The refusal answers the transport status | Change the refusal's status to the busy status |
| The harness drives the real pass | Remove the pass's call from the harness stand-in for `configureAccessory` |
| A flooded poll during shadow silence reaches the tile at all | Delete the `releaseShadowSource()` call from the head of `applyDevices` |
| It reaches the tile on the poll that notices, not the next one | Move the release out of `applyDevices` into `reportMonitoringHealth`. The unit case must fail; the Cucumber scenario stays green, because a 50 ms poll interval hides a one-poll delay inside a 5000 ms step deadline, and that is the point of the row |
| Only silence hands ownership over | Drop the predicate and release on every poll — the existing `SYNC-02` case must fail |
| A degradation is not silence | Read `restDegraded \|\| shadowSilent` at the release site — the REST-recovery case must fail, since the shadow is alive there and still owns telemetry |
| A slow shadow keeps ownership | Lower `MISSED_HEARTBEATS_BEFORE_SILENT` to 1 |
| The arrival path restores ownership | Make `nextShadowVersion` return `undefined` whenever `previous.shadowVersion` is undefined |
| The handover is idempotent | Make `releaseShadowSource` also clear `receivedAt` |
| The accessory's own binder replaces the refusing handler | **Added 2026-09-02, and NOT RUN.** Bind the restored refusal as an additional listener rather than into HAP's single `onSet` slot, so the accessory's own binder cannot take it over. 05-09's five named mutations do not reach `lets the accessory own binder replace the refusal, so a recovered plugin still sends`, so that assertion carries no discriminating mutation yet. Recorded as an open ledger entry rather than claimed |
| Both amendment notes are in place | Delete either the `01-CONTEXT.md` D-15 note or the `REQUIREMENTS.md` SYNC-03 note and watch the row's `grep -c` command answer `0` for that file |
| Every documentation claim is traceable to a passing assertion | Point the row projection back at the un-narrowed trust predicate and watch `A flooded pit reaches Apple Home while the live path is silent` fail. The README sentence "The plugin holds no value back while it waits" then stands on nothing, which is what makes the trace load-bearing rather than plausible |
| The repaired scenarios assert their own premise | **Corrected 2026-09-02.** The named mutation refers to a `Given these reported device fields:` line that was never added: that step replaces the whole `data` record, which would invalidate the scopes these scenarios assert on, and the matching-value repair destroys the heartbeat barrier the snapshot step provides. A bare reversion also proves nothing, because an unrepaired scenario still passes against a correct implementation. 05-11 ran the pair instead, against the defect the scenario exists to catch — report from `onReportedPatch` only when the patch moved a value. Repaired: `A returning heartbeat clears the shadow silence before the next poll` fails. Unrepaired: it passes |

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
| Apple Home renders a refused credential as `No Response`, and still does after a device heartbeat | RES-04 | Apple Home rendering cannot be asserted from the plugin side. **Premise shifted 2026-09-02 by plans 05-12 and 05-16:** `D-10` mandates the reading at the instant of the refusal, and that instant was never the hard half. The heartbeat after it was one hard half and the owner's own press is the other. `05-VERIFICATION.md` measured the presentation being undone by the first live message that followed, so the check must now span that transition. `05-VERIFICATION.md` `human_verification` item 2 already carries the restated premise; this row records it where the phase's own manual register lives rather than stating a second version of it | Force a credential rejection on a real paired home. Read the greyed-out accessory, reach its cached values, and trigger an automation built on one of its sensors. Then wait for at least one device heartbeat and look again. It must still read `No Response`. **Then press one of the two control switches and look a third time**, because pressing an alarming switch is the first thing an owner does and plan 05-16 found that one press erased the message from both controls. It must still read `No Response` after the press. Rides along with the open `G-003` / `G-004` session |

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
5. **Every scenario used one `deviceId` until plan 05-13**, so no per-device rule this phase wrote
   had end-to-end coverage of any kind, and three of the four blockers `05-REVIEW-2.md` found lived
   in exactly that gap. A suite that cannot express the plural of a thing cannot observe a rule about
   which one of them a message was for. The answer is the same shape as the four above: the harness
   gains the capability first, alone, proved on behaviour that is already correct.
6. **Per-plan mutation testing cannot see a defect that lives between two plans that are each
   correct.** Recorded 2026-09-03 by plan 05-19. Twelve rounds of per-plan verification passed over
   `CR-03` and `CR-01`'s upstream half without either surfacing, because every mutation a plan runs
   is applied inside that plan's own subject and read against that plan's own assertions. Plan 05-06
   made the accessory layer publish what a working transport delivers; plan 05-11 made a silent
   shadow hand telemetry back. Each was right, each was measured, and the seam between them -- a
   document that observed the device without delivering a reading -- belonged to neither. Only a
   whole-phase review found it. So a phase whose rows are all green is not a phase whose behaviour
   is all right, and the answer is not more mutations per plan: it is a reading pass over the seams
   the plans do not share, which is what `05-REVIEW-2.md` was and what this round closed.

---

### Second gap-closure round rows (plans 05-13 to 05-19), planned 2026-09-02

Seeded by the planner from `05-REVIEW-2.md`, ahead of execution. Each row is stated as what a basement
owner must observe, and each names the mutation a *correct-but-different* implementation would have to
survive. Every row read `⬜ pending` until its plan's summary evidenced it; each plan appends its own
`### Plan 05-NN rows` and `### Plan 05-NN mutations` subsections above, and the closing plan reconciles
these rows against those summaries. **Reconciled 2026-09-03** by quick task 260903-ho5, which moved
each row's disposition into its own Status cell. See `### Second-round reconciliation` below.

**Three rows were added on 2026-09-02 during plan revision**, after `gsd-plan-checker` returned
`ISSUES FOUND` and the findings were re-measured against the tree. Each is marked in place. All three
close the same shape of hole: a plan claiming an assertion the harness could not make. Plan 05-13
gains the named vendor-change step 05-14's scenario needs; plan 05-15 gains the step that reads
`snapshot.metadata`, which nothing in `features/` had ever read; plan 05-18 gains the companion case
that proves its ordering fixture is order-sensitive, because no automated command on that task could
tell a case that can fail from one that cannot.

| Plan | Wave | Requirement | Finding | Secret an owner must observe | Named mutation that must fail it | Test type | Automated command | Status |
|---|---|---|---|---|---|---|---|---|
| 05-13 | 8 | RES-03 | structural | Two Basement Guardian systems on one account are two tiles, each reading its own basement | Make the named-accessory lookup answer the newest accessory regardless of the name it was given | e2e | `npm run test:cucumber -- --name "Two pumps on one account publish two accessories"` | ✅ shipped — 05-13 mutation A killed the scenario at `Then the "Sump Pit Level" service on "Front Sump Pump" reports "Water Level" as "20"`, the front read answering the back pump's tile |
| 05-13 | 8 | RES-03 | structural | A live message from one basement does not move the other basement's tile | Route every named publish to the first seeded device | e2e | `npm run test:cucumber -- --name "A heartbeat from one pump moves only"` | ✅ shipped — 05-13 mutation C killed the scenario at the back pump's `"Water Level" as "80"`, the back tile still holding the 60 its own inventory row carried |
| 05-13 | 8 | RES-03 | structural | The vendor reporting a new body for one pump moves that pump's polled reading and leaves the other basement's tile where it was. **Added 2026-09-02 during plan revision:** the suite's only vendor-change step rewrites every seeded device at once, so plan 05-14's scenario could not have named its quiet pump. 05-14 consumes this step; it does not land it | Map the named vendor change over every seeded device, the way the account-wide step does | e2e | `npm run test:cucumber -- --name "A heartbeat from one pump moves only"` | ✅ shipped — 05-13 mutation E killed the polled half at the back pump's `"Water Level" as "60"`, the back pump having read the front pump's new body |
| 05-14 | 9 | RES-03 | CR-01 | A poll that finds the quiet pump's pit flooded reports that flood, on a two-pump account whose other pump is heartbeating normally | Stamp every admitted device on each arriving message rather than the one the message named | e2e | `npm run test:cucumber -- --name "A poll finds a flood on the pump that went quiet"` | ✅ shipped — 05-14 mutation A killed the scenario at `features/degradedOperation.feature:208`, the row's own tier: the quiet pump is never silent, never released, and every poll body is discarded |
| 05-14 | 9 | RES-03 | CR-01 | The quiet pump's tile stops saying the plugin vouches for it | Revert the admit call, so no device is ever stamped and no device is ever silent | e2e | `npm run test:cucumber -- --name "A poll finds a flood on the pump that went quiet"` | ⚠️ green, mutation failed nothing — 05-14 mutation C, reverting the admit call, left this scenario passing unchanged. The reason is structural: the quiet pump heartbeats once before falling silent, and `recordShadowMessage` stamps whatever device a message came from, admitted or not. What pins the behaviour instead is five shipped scenarios — `A flooded pit reaches Apple Home while the live path is silent`, `Both monitoring paths lost withdraws every scope`, `A blind plugin vouches for no controller-link verdict`, `A transport outage leaves every service readable`, `A press with no valid state is refused locally` — and the unit case `goes silent two heartbeats after admission when no message ever arrives` at `test/runtime/monitoringHealth.test.ts:239`. WINDOWS ledger 21 |
| 05-14 | 9 | RES-03 | WR-05 | The healthy pump keeps the live readings it is still receiving through its neighbour's silence | Release every stored device whenever any one is silent | unit | `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | ⚠️ green, blind at this tier — 05-14 mutation B killed the scenario at `features/degradedOperation.feature:211`, the healthy pump reading 60 where 80 was expected. No unit case is recorded as failing it, so the end-to-end tier carries this mutation and this row's own unit command does not run it. The row's requirement is pinned at the unit tier by mutation F instead, at `test/device/state.test.ts:582` and `:609`. The `### Plan 05-14 rows` subsection records the same split as its honest limit |
| 05-14 | 9 | RES-03 | CR-01 | A pump added to the account later is judged from when the plugin first knew about it, not from when the plugin started | Re-stamp a device the arrival map already holds on every admission | unit | `npm run test:coverage:direct -- dist-test/src/runtime/monitoringHealth.js dist-test/test/runtime/monitoringHealth.test.js` | ✅ shipped — 05-14 mutation E failed `leaves a quiet pump quiet when a later poll admits it again` at `test/runtime/monitoringHealth.test.ts:329` and eleven cases in all, the row's own tier |
| 05-15 | 10 | RES-03 | CR-03 | A report carrying only firmware or signal strength does not stop the poll refreshing the pit reading | Restore the ownership guard to the wider observation test | e2e | `npm run test:cucumber -- --name "leaves the readings with the poll"` | ✅ shipped — 05-15 mutation A killed the scenario at `features/degradedOperation.feature:197`, this row's own tier. It failed no unit case at task 1 and two after task 2, which the `### Plan 05-15 mutations` subsection records |
| 05-15 | 10 | RES-03 | CR-03 | That same report still counts as the device speaking, so it does not make a live pump read as silent | Narrow the observation test to the telemetry section as well | unit | `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | ✅ shipped — 05-15 mutation C failed `advances the receipt time and establishes no watermark for a patch that reports only device metadata` at `test/device/state.test.ts:423`, this row's own tier. No scenario fails it, which is correct rather than a gap: the arrival stamp the silence rule reads is `recordShadowMessage`, which never consulted this predicate |
| 05-15 | 10 | RES-03 | CR-03 | The metadata-only report the scenario claims to send actually reached the store and was merged, so the scenario cannot pass against a harness that published nothing. **Added 2026-09-02 during plan revision:** no step in the suite read `snapshot.metadata` -- `grep -rn metadata features/support/steps/*.ts` returned one comment -- so the plan's own criterion about asserting both halves was unmeetable, and 05-15 now lands the reading step | Make the metadata publish step send an empty metadata section; the scenario must fail on the metadata assertion rather than on the flood | e2e | `npm run test:cucumber -- --name "leaves the readings with the poll"` | ✅ shipped — 05-15 mutation D killed the scenario at `features/degradedOperation.feature:191`, on the metadata assertion four steps before the flood, which is what proves the metadata half is load-bearing |
| 05-16 | 11 | RES-04 | CR-02 | Pressing a switch on a greyed-out accessory does not make the accessory look normal again | Remove the credential guard from the accessory's republish callback | e2e | `npm run test:cucumber -- --name "leaves both controls still refusing reads"` | ✅ shipped — 05-16 mutation A killed the scenario at `features/degradedOperation.feature:551` on `it answered a read`, this row's own tier, and all three unit cases with it |
| 05-16 | 11 | RES-04 | WR-03 | The trust report under the refusal reads false, so the plugin is not claiming to vouch for what it shows | Remove the credential branch from the monitoring scope map | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ✅ shipped — 05-16 mutation D failed all four task 2 cases at `test/accessories/basementGuardian.test.ts:2793`, `:2815`, `:2834` and `:2856`, this row's own module |
| 05-16 | 11 | RES-04 | WR-03 | `Basement Guardian Offline` still shows its verdict under the wider withdrawal, marked rather than blank | Fill the credential branch's scopes with a withholding reason instead of the seeing-less one | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ✅ shipped — 05-16 mutation F failed `WR-03 keeps the offline adapter publishing its verdict` at `test/accessories/basementGuardian.test.ts:2793` on the withheld value with the verdict still correct, plus the withdrawal case at `:2815`, this row's own module |
| 05-16 | 11 | RES-04 | WR-04 | A trust push that differs only in the credential member still republishes | Replace that member of `markMonitoring`'s comparison with a constant. **Before this round the same mutation left 1348 unit tests and 96 scenarios green** | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ✅ shipped — 05-16 mutation E failed four cases at `test/accessories/basementGuardian.test.ts:2793`, `:2815`, `:2834` and `:2856`, this row's own module. All 101 scenarios stayed green, so the member is pinned at the unit tier the row itself names |
| 05-17 | 12 | RES-04 | WR-02 | A press refused while the live connection is quiet names the quiet connection, not a state the plugin has | Remove the live-confirmation rule from the local refusal table | e2e | `npm run test:cucumber -- --name "names the quiet connection"` | ✅ shipped — 05-17 mutation A killed the new scenario at `features/officialControls.feature:191` on the log line, this row's own tier, and 7 unit cases with it. Both shipped refusal scenarios stayed green, which proves the two rules are distinct |
| 05-17 | 12 | RES-04 | WR-02 | The value the control tile shows and the value the write path reads are one value | Restore `reportedControlValue`'s own guard over every untrusted scope | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ✅ shipped — 05-17 mutation D failed the agreement case `WR-02 returns the Switch to the value the device reported when a press is refused during shadow silence` in `test/accessories/basementGuardian.test.ts`, this row's own module |
| 05-17 | 12 | RES-04 | WR-06 | A self-test the device confirmed is not reported as one the device never confirmed | Point reconciliation back at the vouched-for value instead of the decoded one | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ✅ shipped — 05-17 mutation G failed `WR-06 resolves a request the device confirmed on the snapshot that withdrew the control scope` in `test/accessories/basementGuardian.test.ts`, this row's own module, and nothing else, which is what says the gate belonged to reconciliation alone |
| 05-18 | 13 | RES-04 | WR-01 | The greyed-out presentation survives an edit that reorders the two pushes behind it | Invert the two loops in `applyMonitoringHealth`. **Before this round the same mutation left all 1348 unit tests green** | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | ✅ shipped — 05-18 mutation A failed `leaves the pushed status standing over an accessory that republishes its own rows` at `dist-test/test/platform.test.js:1050`, this row's own module. The same inversion left every unit case green before this plan, which is the finding |
| 05-18 | 13 | RES-04 | WR-01 | The ordering case is read on a fixture that actually republishes, so a case as vacuous as the one it replaces is caught by the suite rather than by an executor's honesty. **Added 2026-09-02 during plan revision:** every automated command on that task passes against the unfixed tree, so without this the only discriminating evidence was a manually applied mutation | Build the companion case's second fixture on the recording stand-in, which pushes nothing, so both push orders read identically and the case cannot see the difference it asserts | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | ✅ shipped — 05-18 mutation A2 failed `reads a different trust report under each push order, which is what makes the ordering case able to fail`, this row's own module: both push orders read the same status, so the case could not see the difference it asserts |
| 05-18 | 13 | RES-04 | WR-07 | A field added to the platform's runtime context reaches all three callbacks | Re-inline a second `DiscoveryContext` literal in one callback. **The gate counts `DiscoveryContext`-shaped object literals, not mentions of a field name:** `basementGuardianAccessories` appears on ten lines of `src/platform.ts` and only three are literals, so a name count would move on an unrelated property read and would not move on a re-inlined literal spelling a field differently | unit (static) | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | ✅ shipped — 05-18 mutation D failed `holds exactly one DiscoveryContext-shaped literal beside the declaration it satisfies`, reporting 3 literals where 2 are expected, this row's own module |
| 05-18 | 13 | RES-04 | WR-08 | An operator is told when a credential refusal marked nothing at all — the one case that produces no signal in HomeKit | Log the line whatever the count | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | ✅ shipped — 05-18 mutation H failed `says nothing extra when the refusal marked the services it reached` and `says nothing for a refusal that arrived before this run had any accessory to mark`, this row's own module |
| 05-18 | 13 | RES-04 | WR-08 | The marking pass still reaches exactly the services carrying a trust report, and adds a characteristic to none | Widen the walk to every service | unit | `npm run test:coverage:direct -- dist-test/src/accessories/staleMarking.js dist-test/test/accessories/staleMarking.test.js` | ✅ shipped — 05-18 mutation G failed `counts every service that reports whether the plugin vouches for it, and leaves one that never did alone` with `marked: 4` against `2`, and 11 of the module's 18 cases, this row's own module |
| 05-19 | 14 | RES-03 | CR-04 | An owner reading the README learns that a poll does not replace a reading the live path still owns, and learns when it starts to | *Documentation trace, not a test.* The sentence depends on `test/runtime/accountRuntime.test.ts` — the case that pins the poll losing inside the two-heartbeat window — and on the flood scenario for the half after the handover. A row that claimed a mutation of its own would be the defect this round exists to stop | doc | `npm run check` | ✅ shipped — documentation trace, so the row names the code assertions its sentence depends on instead of a mutation of its own. `test/runtime/accountRuntime.test.ts` for the half before the handover, `features/degradedOperation.feature` for the half after it, and `test/runtime/monitoringHealth.test.ts` for the account-wide marking clause. `npm run check` is green |
| 05-19 | 14 | RES-04 | WR-08 | The README says the trust report on every service that carries one stops answering, which is what the pass does | *Documentation trace, not a test.* Depends on the staleMarking guard case above | doc | `npm run check` | ✅ shipped — documentation trace. The sentence depends on `test/accessories/staleMarking.test.ts` `counts every service that reports whether the plugin vouches for it, and leaves one that never did alone`, which 05-18 mutation G fails with `marked: 4` against `2`. `npm run check` is green |

### Second-round reconciliation (quick task 260903-ho5, 2026-09-03)

The 24 rows above read `⬜ pending` until this date. They now carry a measured status each, in the
row rather than in an appendix a reader has to find. The status vocabulary is defined once, above the
first-round table under `## Per-Task Verification Map`.

**Plan 05-19's prohibition is superseded here, and named so a later reader does not read this as a
plan violation.** That prohibition forbade plan 05-19 from editing an existing `05-VALIDATION.md`
table, which is why the dispositions were appended under
`### Second gap-closure round reconciliation` instead. WINDOWS ledger 32 records the resulting
contradiction: the table's own governing paragraph says the closing plan reconciles these rows, and
the cells said pending. The prohibition bound plan 05-19. It does not bind this task, which is
authorised to reconcile the cells. Nothing in the appended subsection was removed.

**The counts.** 22 rows read `✅ shipped`. 2 read a `⚠️ green` status. No row reads
`⚠️ shipped, blind to CR-0N`; commit `4631d46`'s audit predates this round, so no row of it is
covered by that finding.

**The corrected count.** Ledger entry 32 says twenty-two rows in this table read pending. The
measured count is twenty-four. The file also holds two prose mentions of the pending marker that are
not cells, which is the likeliest source of the difference. The ledger has no edit verb, so the
correction is recorded here and the entry is marked fixed. The 24 split by plan: 05-13 three rows,
05-14 four, 05-15 three, 05-16 four, 05-17 three, 05-18 five, 05-19 two.

**The two rows that are not shipped.** Both belong to plan 05-14.

- The row asserting the quiet pump's tile stops saying the plugin vouches for it. Its named mutation,
  reverting the admit call, left the scenario passing unchanged. The `### Plan 05-14 mutations`
  subsection gives the structural reason and names what pins the behaviour instead: five shipped
  scenarios and one unit case. WINDOWS ledger 21.
- The row asserting the healthy pump keeps the live readings it is still receiving. Its named
  mutation, releasing every stored device whenever any one is silent, killed the scenario at
  `features/degradedOperation.feature:211` and no unit case. The row's own command runs the unit tier
  only, so the mutation is carried by a tier the row does not run. Mutation F pins the same
  requirement at the row's own tier. The `### Plan 05-14 rows` subsection records the same split as
  its honest limit, and the reconciliation table below records the prediction that did not hold.

**Three measured facts that attach to no row, recorded rather than forced onto one.**

- Plan 05-17 mutation B, which WINDOWS ledger 26 records, is a plan-level control. No row of this
  table names it as its mutation: the three 05-17 rows name mutations A, D and G, each of which fails
  at its row's own tier. Mutation B fails one unit case that plan 05-17 wrote for it, and no
  scenario.
- Plan 05-18 mutations B and D2 are controls whose passing result is the measurement, as the
  `### Plan 05-18 mutations` subsection states. The five 05-18 rows name mutations A, A2, D, H and G,
  and each of those failed at its row's own tier.
- Plan 05-16 mutation C and plan 05-15 mutation A each failed nothing at their plan's task 1. Both
  were closed by task 2, which the reconciliation table below and the per-plan mutation subsections
  both record. Neither is the named mutation of a row in this table, and neither is left open, so
  neither earns a warning status here. Plan 05-15's reversed watermark prediction, WINDOWS ledger 22,
  is a prediction correction recorded in the reconciliation table; the shipped case pins the measured
  consequence, so it earns no warning status either.

### Second gap-closure round reconciliation (plan 05-19, 2026-09-03)

**The row-level statuses now live in the table itself.** Quick task 260903-ho5 reconciled the 24
Status cells on 2026-09-03; see `### Second-round reconciliation` above. This subsection is kept
because it holds the prediction record and the Wave 0 evidence, neither of which the cells duplicate.

The table above says the closing plan reconciles its rows against the summaries. Plan 05-19's own
prohibitions say it must not edit an existing `05-VALIDATION.md` table, and new material is
appended. **Both cannot be honoured by editing the Status column, so the disposition of every row in
that table lives here instead and its cells are left as the plans wrote them.** The tension is a plan
self-inconsistency and is reported rather than smoothed over: a reader who wants the round's status
reads this subsection, which the table's own governing paragraph points at.

**Every row of the second gap-closure round is evidenced by its plan's summary**, and every one of
those summaries carries a `## Self-Check: PASSED` block naming the commits by content. The per-plan
`### Plan 05-NN rows` subsections above already read `✅ shipped` and were written by the executor
who measured them; nothing in them was found to disagree with its summary.

What did not behave as its plan predicted, named plan by plan, because a tidy table is worth less
than the record of a prediction that failed:

| Plan | Prediction | What was measured |
|---|---|---|
| 05-13 | The five named mutations would each fail something | Held. All five failed. The plan's own `serviceOf` acceptance criterion contradicted its `<action>`, and the action was followed; mutation C had to be made compilable with a no-op that consumes an unread parameter |
| 05-14 | Mutation B (release every stored device whenever any is silent) **might pass**, so WR-05's discriminating evidence was reserved for the unit tier | It fails, at the end-to-end tier, because the healthy pump's live level and its polled level were deliberately made different |
| 05-14 | Mutation C (revert the admit call) would fail the new scenario | **It failed nothing there.** `recordShadowMessage` stamps whatever device a message named, admitted or not, and the quiet pump speaks once before falling silent, so the admit call is redundant for any pump that has ever spoken. Five shipped scenarios and one unit case pin it instead |
| 05-15 | Refusing to advance a held watermark on a metadata-only document would leave a later telemetry document judged stale | **Backwards.** Refusing the advance leaves the watermark below the shadow's own version, so a document the shadow has already superseded is accepted over a newer reading. The shipped case pins the measured consequence |
| 05-15 | Mutations A to D would carry the change | A broke no unit case at task 1, C broke no scenario, and neither is a gap: task 2 closed A's, and C's subject reaches only `receivedAt`. Mutation E was run although the plan never named it, because A to D leave the arrival half of D-11 unmeasured |
| 05-16 | Mutation C might fail nothing at task 1 and would be closed by task 2 | Held exactly. Nothing at task 1, three cases after task 2. Mutation B behaved as predicted, which the equivalent mutation in plan 05-12 did not |
| 05-17 | The row and the write path would disagree observably through the refusal | **They cannot.** After task 1 every seeing-less withdrawal of a control scope is refused before the state rule is consulted, so the disagreement is visible only at the clearing push, and the case reads it there |
| 05-17 | Mutation B would be caught end to end | **No Cucumber scenario fails it.** No shipped scenario sets a quiet live path and an unready transport together. Its one unit case was written by that plan for that mutation; without it, mutation B would have failed nothing at all. Ledger entry 26 |
| 05-17 | Mutation F would fail the withholding case | **It failed nothing on the case's first draft.** `gemini.ts:370` drops a violated scope's whole group, so a case built on an invalid field agrees with a rule that withheld nothing. Rebuilt on a lost controller link and committed separately as its own finding |
| 05-18 | Mutation G would report `marked: 3` | `marked: 4`. The widened walk also reaches `AccessoryInformation`, which every constructed `PlatformAccessory` carries. The row was corrected to the measured number before it was committed |
| 05-18 | Every mutation would fail something | Held, with two pinned by a passing result rather than a failing one -- B and D2 -- and both recorded as the measurements they are |

**One correction that belongs to an earlier round and is recorded rather than made.** The
gap-closure mutations table above pins "Every documentation claim is traceable to a passing
assertion" on watching the README sentence *"The plugin holds no value back while it waits"* stand on
nothing. `05-REVIEW-2.md` CR-04 later showed that sentence was false of the shipped code for the
whole window its own paragraph is about, and plan 05-19 deleted it. `05-VERIFICATION.md` also lists
*"README: `the plugin holds no value back while it waits` is now a true statement about the shipped
code"* among its `gaps_closed`. Both records now name a sentence the README no longer carries.
Neither is edited here: the mutations table belongs to plan 05-10's round, and the verification report
belongs to a verifier. This is the phase's signature defect once more -- a check that passed because
the claim it rested on was never read against the code -- and it is the reason plan 05-19 traced every
kept sentence to a named assertion instead.

**Wave 0 evidence, recorded without checking its boxes.** Plan 05-19's action authorises the
`Validation Sign-Off` block and not the Wave 0 list, so the six boxes are left as they are and their
evidence is written here: `test/runtime/monitoringHealth.test.ts` and
`test/accessories/accessoryReadPathScope.test.ts` both exist and both carry the cases their rows
name; `features/support/fakeHomebridgeApi.ts` `restoreCachedAccessories()` sideloads deserialized
services onto each restored accessory, which is the documented reversal the item demanded;
`features/support/world.ts` imports and calls the exported `markRestoredServicesStale` and
`refuseRestoredControls` from `src/accessories/staleMarking.js`, so the harness drives the shipped
pass rather than a copy; the named-service `Status Active` read exists in both its account-wide and
its named-accessory form, the second added by plan 05-13; and the clock step exists as
`When the scenario clock moves forward by N seconds`.

---

## Planning hazards and deferrals recorded for this phase

Recorded on 2026-09-01 during plan revision. None of these is a plan change; each is a fact a later
reader would otherwise have to rediscover.

**The suite had no multi-device coverage at all until plan 05-13. Recorded 2026-09-02 while planning
the second gap-closure round.** Every one of the 96 scenarios that shipped used a single `deviceId`,
and three separate harness helpers collapse an account to one device by construction:
`features/support/publishedServices.ts` `currentAccessory` reads the newest accessory handed over,
`features/support/steps/shadow.ts` `theDeviceId` reads position zero of the scenario's device table,
and `features/support/steps/harness.ts` carries its own private copy of the first plus a module-constant
topic. Each is documented with the single-device assumption stated plainly, so none of this was hidden
— it was simply never revisited when the phase began writing per-device rules. `CR-01` is invisible to
the end-to-end tier for that reason alone, and `WR-05` is the same per-device / per-account confusion
from the other end. The lesson is not about devices: **a suite that cannot express the plural of a
thing cannot test any rule about which one.**

**Per-plan mutation testing cannot see a defect that lives between two correct plans. Recorded
2026-09-02.** Twelve plans each ran their own mutations and each passed. Three of `05-REVIEW-2.md`'s
four blockers are interactions: `05-11` handed telemetry to the poll on a silence predicate `05-01`
built account-wide; `05-12` closed the message route into a marking whose write route stayed open;
`05-11`'s ownership rule read one field more than ownership governs. None of the three is a defect in
the plan that shipped it. The round that follows adds whole-phase mutations to the per-plan ones —
every mutation in the table above is applied against the **whole** suite, not against the plan's own
files.

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

**The same gate under-counts `05-CONTEXT.md` D-13, and credits it to the wrong decision. Found
2026-09-02 while planning 05-11; not repaired here.** Two facts, both measured:

1. **D-13 is invisible to the parser because of where it sits.** It was appended at the end of the
   `<decisions>` block, *below* the `### Claude's Discretion` heading. Called correctly — phase
   directory first — the gate reports `total: 12` against a file that carries thirteen
   `- **D-NN — Title:**` headers. Copying the phase directory to a scratch tree and moving the D-13
   block above that heading, changing nothing else, makes the same call report `total: 13,
   covered: 13`. Position is the whole cause.
2. **Its coverage credit is not its own.** Removing `05-11-PLAN.md` from the scratch tree still leaves
   the count fully covered, because plans 05-04 and 05-07 cite `D-13` meaning Phase 1's Auth0
   thirty-day brute-force block (`01-CONTEXT.md:43`), which is a different decision with the same
   name. The gate matches the string.

So a green result from this gate says nothing about whether `05-CONTEXT.md` D-13 is planned. It is
planned — `05-11-PLAN.md` implements it and cites it throughout — but that is established by reading
the plan, not by the gate. Moving the D-13 block is an edit to the binding ruling document and was
left to the maintainer rather than taken by the planner. Anywhere either D-13 is cited outside its own
file, write `05-CONTEXT.md` D-13 or `01-CONTEXT.md` D-13; a bare `D-13` is ambiguous in this project.

**Two `05-REVIEW.md` findings close the phase as deferred, with the reasons `05-06-PLAN.md` recorded
under `Review findings this round does not act on`. Carried here 2026-09-02 by plan 05-10 so a later
reader finds a disposition for every current review finding without re-reading the review.**

**WR-05 — the nine-member `DiscoveryContext` literal is written out three times in
`src/platform.ts`.** Deferred. The drift it warns about has not happened: the reviewer read all three
and found them byte-identical. It wants a change that owns the composition root, which no plan in
this round did. `features/support/world.ts` already uses the shape the fix would build.

**IN-03 — shadow silence is measured against a wall clock that can jump.** Deferred. The finding
itself says "No change required for this release". A host with no real-time clock can jump hours on
its first NTP sync after boot, which reports a healthy shadow as silent or suppresses a real silence
for the size of the jump. Neither is a false normal that persists, and both self-clear. It wants a
note in the intel document so a later monotonic-clock decision has the reason recorded.

**Plan 05-01 is over the smart-zone context budget and is not split.** 115000 calibrated against
100000, 13 files, confidence `low` on `sample_count: 0`. The declined split is argued in the plan
itself: four modules sit between a transport fact and a HomeKit characteristic, and removing any one
leaves the tracer's claim unproven end to end. Over-budget is advisory, never blocking. Recorded so
the executor watches actual context use through that plan rather than assuming headroom.

**Shadow-silence marking stays account-wide on a multi-device account, and plan 05-14 chose that
deliberately.** Silence is now measured per device and telemetry is handed back per device, but
`shadowSilent` remains one answer pushed identically to every accessory: true when any admitted device
is silent. A two-pump owner whose front pump goes quiet therefore sees both tiles stop vouching, not
one. Three reasons. No requirement asks for per-device marking -- `RES-03` asks that a monitoring-path
loss be told apart from a confirmed-offline device without a false physical-device alert, and
account-wide marking raises no adapter and activates nothing; `05-CONTEXT.md` D-02 already ratifies
marking every accessory for a monitoring failure and names the accepted cost in those words.
Over-marking cannot produce a false normal: it withdraws trust the plugin does have, and the defect
class this project exists to prevent runs the other way. And the alternative is a second design change
riding on a blocker fix -- a per-device `MonitoringTrust` crossing `onMonitoringHealth`,
`applyMonitoringHealth` and the platform fan-out, plus every `MonitoringTrust` literal in the unit
suite -- which is how this phase twice lost the ability to say which change a green result was
measuring. The cost is real and is recorded rather than hidden: a two-pump owner is told the plugin
cannot vouch for both systems when it can vouch for one, and the `FailureLog` line is where the
distinction survives (`05-CONTEXT.md` D-03). `LIVE_REPORTING_SILENT` still names the account rather
than the device, which is the same framing and is accepted with it (T-05-14-05).

---

## Validation Sign-Off

Filled in 2026-09-03 by plan 05-19 against what was actually run. Every checked box carries its
measurement; the unchecked one carries its reason.

- [x] All tasks have `<automated>` verify or Wave 0 dependencies -- measured over the phase's
      nineteen plans: **47 `<task>` elements, 46 carrying at least one `<automated>` block.** The one
      without is a `checkpoint` task, which the criterion exempts.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify -- follows from the line
      above. No non-checkpoint task in the phase lacks one, so no run of three exists.
- [x] Wave 0 covers all MISSING references -- all six items exist on the tree and are exercised by
      shipped cases. The evidence is written out under
      `Second gap-closure round reconciliation` rather than by checking the Wave 0 boxes, which this
      plan's action does not authorise it to write.
- [x] No watch-mode flags -- `package.json`'s five test scripts (`test`, `test:unit`,
      `test:cucumber`, `test:coverage:all`, `test:coverage:direct`) carry no `--watch`.
- [x] Feedback latency < 30s for per-task unit sampling; the full-suite commands are named above and
      bounded at ~90s -- measured on `node` v26.7.0: `npm run test:unit` **13.9 s** wall including
      the TypeScript build, and `npm test`, the named full-suite pair, **54.5 s**. `npm run check`
      takes **105.1 s**, but that gate adds typecheck, lint, `fallow` and `format:check` and is
      wider than the one this line names.
- [ ] `nyquist_compliant: true` set in frontmatter -- **unchecked, and not this plan's to set.** The
      frontmatter still reads `status: draft`, `nyquist_compliant: false` and
      `wave_0_complete: false`. Those three fields are written by `validate-phase` §6, and plan
      05-19 leaves a verifier's fields alone for the same reason it leaves `05-VERIFICATION.md`
      alone.

**Approval:** pending, and stated as what it is. Approval is a human act and nobody has taken it. Two
things stand between this phase and one a reader could rely on. `05-VERIFICATION.md` reads
`status: gaps_found` with two `gaps_remaining` entries, written on 2026-09-02 before plans 05-12 to
05-19 landed and not re-run since, and one of its `gaps_closed` entries names a README sentence that
has since been deleted as untrue. And all three `Manual-Only Verifications` rows ride on the open
`G-003` / `G-004` real-home session, which has not happened. A re-verification and that session are
what would move this line.
