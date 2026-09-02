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
first-round rows still read `⬜ pending`: this plan verified the gap-closure round against its
summaries and has no equivalent basis for the first round, and three of those rows are the ones
`05-VERIFICATION.md` found green but blind, so marking them shipped would assert the opposite of
what the verifier measured.

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
| Apple Home renders a refused credential as `No Response`, and still does after a device heartbeat | RES-04 | Apple Home rendering cannot be asserted from the plugin side. **Premise shifted 2026-09-02 by plan 05-12:** `D-10` mandates the reading at the instant of the refusal, and that instant was never the hard half. `05-VERIFICATION.md` measured the presentation being undone by the first live message that followed, so the check must now span that transition. `05-VERIFICATION.md` `human_verification` item 2 already carries the restated premise; this row records it where the phase's own manual register lives rather than stating a second version of it | Force a credential rejection on a real paired home. Read the greyed-out accessory, reach its cached values, and trigger an automation built on one of its sensors. Then wait for at least one device heartbeat and look again. It must still read `No Response`. Rides along with the open `G-003` / `G-004` session |

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

---

### Second gap-closure round rows (plans 05-13 to 05-19), planned 2026-09-02

Seeded by the planner from `05-REVIEW-2.md`, ahead of execution. Each row is stated as what a basement
owner must observe, and each names the mutation a *correct-but-different* implementation would have to
survive. Every row reads `⬜ pending` until its plan's summary evidences it; each plan appends its own
`### Plan 05-NN rows` and `### Plan 05-NN mutations` subsections above, and the closing plan reconciles
these rows against those summaries.

**Three rows were added on 2026-09-02 during plan revision**, after `gsd-plan-checker` returned
`ISSUES FOUND` and the findings were re-measured against the tree. Each is marked in place. All three
close the same shape of hole: a plan claiming an assertion the harness could not make. Plan 05-13
gains the named vendor-change step 05-14's scenario needs; plan 05-15 gains the step that reads
`snapshot.metadata`, which nothing in `features/` had ever read; plan 05-18 gains the companion case
that proves its ordering fixture is order-sensitive, because no automated command on that task could
tell a case that can fail from one that cannot.

| Plan | Wave | Requirement | Finding | Secret an owner must observe | Named mutation that must fail it | Test type | Automated command | Status |
|---|---|---|---|---|---|---|---|---|
| 05-13 | 8 | RES-03 | structural | Two Basement Guardian systems on one account are two tiles, each reading its own basement | Make the named-accessory lookup answer the newest accessory regardless of the name it was given | e2e | `npm run test:cucumber -- --name "Two pumps on one account publish two accessories"` | ⬜ pending |
| 05-13 | 8 | RES-03 | structural | A live message from one basement does not move the other basement's tile | Route every named publish to the first seeded device | e2e | `npm run test:cucumber -- --name "A heartbeat from one pump moves only"` | ⬜ pending |
| 05-13 | 8 | RES-03 | structural | The vendor reporting a new body for one pump moves that pump's polled reading and leaves the other basement's tile where it was. **Added 2026-09-02 during plan revision:** the suite's only vendor-change step rewrites every seeded device at once, so plan 05-14's scenario could not have named its quiet pump. 05-14 consumes this step; it does not land it | Map the named vendor change over every seeded device, the way the account-wide step does | e2e | `npm run test:cucumber -- --name "A heartbeat from one pump moves only"` | ⬜ pending |
| 05-14 | 9 | RES-03 | CR-01 | A poll that finds the quiet pump's pit flooded reports that flood, on a two-pump account whose other pump is heartbeating normally | Stamp every admitted device on each arriving message rather than the one the message named | e2e | `npm run test:cucumber -- --name "A poll finds a flood on the pump that went quiet"` | ⬜ pending |
| 05-14 | 9 | RES-03 | CR-01 | The quiet pump's tile stops saying the plugin vouches for it | Revert the admit call, so no device is ever stamped and no device is ever silent | e2e | `npm run test:cucumber -- --name "A poll finds a flood on the pump that went quiet"` | ⬜ pending |
| 05-14 | 9 | RES-03 | WR-05 | The healthy pump keeps the live readings it is still receiving through its neighbour's silence | Release every stored device whenever any one is silent | unit | `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | ⬜ pending |
| 05-14 | 9 | RES-03 | CR-01 | A pump added to the account later is judged from when the plugin first knew about it, not from when the plugin started | Re-stamp a device the arrival map already holds on every admission | unit | `npm run test:coverage:direct -- dist-test/src/runtime/monitoringHealth.js dist-test/test/runtime/monitoringHealth.test.js` | ⬜ pending |
| 05-15 | 10 | RES-03 | CR-03 | A report carrying only firmware or signal strength does not stop the poll refreshing the pit reading | Restore the ownership guard to the wider observation test | e2e | `npm run test:cucumber -- --name "leaves the readings with the poll"` | ⬜ pending |
| 05-15 | 10 | RES-03 | CR-03 | That same report still counts as the device speaking, so it does not make a live pump read as silent | Narrow the observation test to the telemetry section as well | unit | `npm run test:coverage:direct -- dist-test/src/device/state.js dist-test/test/device/state.test.js` | ⬜ pending |
| 05-15 | 10 | RES-03 | CR-03 | The metadata-only report the scenario claims to send actually reached the store and was merged, so the scenario cannot pass against a harness that published nothing. **Added 2026-09-02 during plan revision:** no step in the suite read `snapshot.metadata` -- `grep -rn metadata features/support/steps/*.ts` returned one comment -- so the plan's own criterion about asserting both halves was unmeetable, and 05-15 now lands the reading step | Make the metadata publish step send an empty metadata section; the scenario must fail on the metadata assertion rather than on the flood | e2e | `npm run test:cucumber -- --name "leaves the readings with the poll"` | ⬜ pending |
| 05-16 | 11 | RES-04 | CR-02 | Pressing a switch on a greyed-out accessory does not make the accessory look normal again | Remove the credential guard from the accessory's republish callback | e2e | `npm run test:cucumber -- --name "leaves both controls still refusing reads"` | ⬜ pending |
| 05-16 | 11 | RES-04 | WR-03 | The trust report under the refusal reads false, so the plugin is not claiming to vouch for what it shows | Remove the credential branch from the monitoring scope map | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ⬜ pending |
| 05-16 | 11 | RES-04 | WR-03 | `Basement Guardian Offline` still shows its verdict under the wider withdrawal, marked rather than blank | Fill the credential branch's scopes with a withholding reason instead of the seeing-less one | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ⬜ pending |
| 05-16 | 11 | RES-04 | WR-04 | A trust push that differs only in the credential member still republishes | Replace that member of `markMonitoring`'s comparison with a constant. **Before this round the same mutation left 1348 unit tests and 96 scenarios green** | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ⬜ pending |
| 05-17 | 12 | RES-04 | WR-02 | A press refused while the live connection is quiet names the quiet connection, not a state the plugin has | Remove the live-confirmation rule from the local refusal table | e2e | `npm run test:cucumber -- --name "names the quiet connection"` | ⬜ pending |
| 05-17 | 12 | RES-04 | WR-02 | The value the control tile shows and the value the write path reads are one value | Restore `reportedControlValue`'s own guard over every untrusted scope | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ⬜ pending |
| 05-17 | 12 | RES-04 | WR-06 | A self-test the device confirmed is not reported as one the device never confirmed | Point reconciliation back at the vouched-for value instead of the decoded one | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ⬜ pending |
| 05-18 | 13 | RES-04 | WR-01 | The greyed-out presentation survives an edit that reorders the two pushes behind it | Invert the two loops in `applyMonitoringHealth`. **Before this round the same mutation left all 1348 unit tests green** | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | ⬜ pending |
| 05-18 | 13 | RES-04 | WR-01 | The ordering case is read on a fixture that actually republishes, so a case as vacuous as the one it replaces is caught by the suite rather than by an executor's honesty. **Added 2026-09-02 during plan revision:** every automated command on that task passes against the unfixed tree, so without this the only discriminating evidence was a manually applied mutation | Build the companion case's second fixture on the recording stand-in, which pushes nothing, so both push orders read identically and the case cannot see the difference it asserts | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | ⬜ pending |
| 05-18 | 13 | RES-04 | WR-07 | A field added to the platform's runtime context reaches all three callbacks | Re-inline a second `DiscoveryContext` literal in one callback. **The gate counts `DiscoveryContext`-shaped object literals, not mentions of a field name:** `basementGuardianAccessories` appears on ten lines of `src/platform.ts` and only three are literals, so a name count would move on an unrelated property read and would not move on a re-inlined literal spelling a field differently | unit (static) | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | ⬜ pending |
| 05-18 | 13 | RES-04 | WR-08 | An operator is told when a credential refusal marked nothing at all — the one case that produces no signal in HomeKit | Log the line whatever the count | unit | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js` | ⬜ pending |
| 05-18 | 13 | RES-04 | WR-08 | The marking pass still reaches exactly the services carrying a trust report, and adds a characteristic to none | Widen the walk to every service | unit | `npm run test:coverage:direct -- dist-test/src/accessories/staleMarking.js dist-test/test/accessories/staleMarking.test.js` | ⬜ pending |
| 05-19 | 14 | RES-03 | CR-04 | An owner reading the README learns that a poll does not replace a reading the live path still owns, and learns when it starts to | *Documentation trace, not a test.* The sentence depends on `test/runtime/accountRuntime.test.ts` — the case that pins the poll losing inside the two-heartbeat window — and on the flood scenario for the half after the handover. A row that claimed a mutation of its own would be the defect this round exists to stop | doc | `npm run check` | ⬜ pending |
| 05-19 | 14 | RES-04 | WR-08 | The README says the trust report on every service that carries one stops answering, which is what the pass does | *Documentation trace, not a test.* Depends on the staleMarking guard case above | doc | `npm run check` | ⬜ pending |

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

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for per-task unit sampling; the full-suite commands are named above and bounded at ~90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
