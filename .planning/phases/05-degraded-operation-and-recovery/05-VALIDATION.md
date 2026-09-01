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
- **Max feedback latency:** ~30 seconds (`npm run test:unit`).

---

## Per-Task Verification Map

Every row names the **mutation that must fail it**. A test whose named mutation still passes is not
evidence — that is the rule this project paid for six times in Phase 4, and the reason
`04-VERIFICATION.md` W-1 exists.

Task IDs are assigned by the planner; the behaviour, command, and mutation columns are binding as
written here.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | 0 | RES-03 | — | Two consecutive REST failures mark the path degraded; one does not | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 — `test/runtime/monitoringHealth.test.ts` | ⬜ pending |
| TBD | TBD | 0 | RES-03 | — | Shadow silence is measured from message arrival, never from `shadowConnected` | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | RES-03 | — | One missed heartbeat is not silence; two is | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | 0 | RES-03 | — | A REST poll does not clear a shadow-silence degradation (D-11) | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | — | RES-03 | — | A monitoring-path failure never activates `Basement Guardian Offline` | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` (extend) | ⬜ pending |
| TBD | TBD | — | RES-03 | — | REST down + shadow alive leaves every service `Status Active = true` | e2e | `npm run test:cucumber` | `features/degradedOperation.feature` | ⬜ pending |
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
| TBD | TBD | — | RES-04 | — | A press after credential rejection is refused locally, not via a vendor round trip | e2e | `npm run test:cucumber` | `features/officialControls.feature` (extend) | ⬜ pending |
| TBD | TBD | — | RES-04 | — | Credential rejection makes a read throw and retains the value | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` (extend) | ⬜ pending |
| TBD | TBD | — | RES-04 | — | Credential rejection is the **only** cause that does this | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | `test/accessories/basementGuardian.test.ts` | ⬜ pending |
| TBD | TBD | — | CONF-05 | — | The degradation thresholds are not configurable | unit | `node --test dist-test/test/config.test.js` | `test/config.test.ts` (assert the resolved config's key set is unchanged) | ⬜ pending |

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
| REST down + shadow alive stays active | Mark on any degradation rather than on shadow loss alone |
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
| Local refusal after credential rejection | Delete the transport predicate — the press then reaches `commands.send` |
| Credential rejection throws on read | Push `false` instead of a `HapStatusError` |
| Only credential rejection throws | Make the shadow-silence path push a `HapStatusError` too |
| Thresholds not configurable | Add a knob |

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

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
